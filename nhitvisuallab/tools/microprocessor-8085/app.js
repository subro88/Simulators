/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 8085 MICROPROCESSOR SIMULATOR & ASSEMBLY IDE ENGINE — VisualLab V2 Standard
 * Strict 3:2 Dual Viewport, Cycle-Accurate T-State VM, DYNA-85 Hardware Trainer,
 * Two-Pass Assembler, Demultiplexed Bus Canvas, Logic Analyzer & Three.js 3D Model
 * ══════════════════════════════════════════════════════════════════════════════
 */

(() => {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // 1. TACTILE SOUND SYNTHESIZER (Web Audio API)
  // ════════════════════════════════════════════════════════════════════════════
  class SoundSynthesizer {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playKeyClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.038);
    }

    playClockTick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.015);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.016);
    }

    playHaltTone() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.setValueAtTime(220, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    }

    playSuccessChord() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.07);
        osc.stop(this.ctx.currentTime + idx * 0.07 + 0.36);
      });
    }
  }

  const sound = new SoundSynthesizer();

  // ════════════════════════════════════════════════════════════════════════════
  // 2. 8085 CYCLE-ACCURATE VIRTUAL MACHINE
  // ════════════════════════════════════════════════════════════════════════════
  class Intel8085VM {
    constructor() {
      // 64 KB Memory Space
      this.memory = new Uint8Array(65536);
      // I/O Ports Space (256 Ports)
      this.ports = new Uint8Array(256);

      // 8-Bit Internal Registers
      this.A = 0x00; // Accumulator
      this.B = 0x00;
      this.C = 0x00;
      this.D = 0x00;
      this.E = 0x00;
      this.H = 0x00;
      this.L = 0x00;
      this.W = 0x00; // Temp Reg
      this.Z = 0x00; // Temp Reg
      this.IR = 0x00; // Instruction Register

      // 16-Bit Registers
      this.PC = 0x2000; // Program Counter
      this.SP = 0x27FF; // Stack Pointer

      // Status Flags: S (Sign), Z (Zero), AC (Aux Carry), P (Parity), CY (Carry)
      this.flags = {
        S: 0,
        Z: 0,
        AC: 0,
        P: 0,
        CY: 0
      };

      // Control & Bus Status Signals
      this.ALE = 1;
      this.IOM = 0; // 0 = Memory, 1 = I/O
      this.S1 = 1;
      this.S0 = 1;
      this.RD = 1; // Active Low (1 = Inactive)
      this.WR = 1; // Active Low (1 = Inactive)
      this.CLK = 1; // High/Low

      // 74LS373 Latch Output (Demultiplexed A0-A7)
      this.latchA0_A7 = 0x00;
      // High Address Bus (A8-A15)
      this.busA8_A15 = 0x20;
      // Multiplexed Bus (AD0-AD7)
      this.busAD0_AD7 = 0x00;
      // Bus Mode: 'ADDR' (during T1 with ALE=1) or 'DATA' (during T2/T3)
      this.adBusMode = 'ADDR';

      // Execution State Machine
      this.halted = false;
      this.INTE = 0; // Interrupt Enable flip-flop
      this.currentOpcode = 0x00;
      this.currentMnemonic = 'NOP';
      this.currentMCycle = 1; // M1..M5
      this.currentMCycleType = 'OF'; // OF (Opcode Fetch), MR (Memory Read), MW, IOR, IOW
      this.totalMCycles = 1;
      this.currentTState = 1; // T1..T6
      this.totalTStatesInCycle = 4;
      this.instructionCycleSeq = []; // Array of machine cycle specs

      // Breakpoints: Set of addresses
      this.breakpoints = new Set();

      // Logic Analyzer Waveform History Buffer (Last 20 T-States)
      this.waveformHistory = [];
      this.maxWaveformPoints = 24;

      this.reset();
    }

    reset() {
      this.A = 0x00;
      this.B = 0x00;
      this.C = 0x00;
      this.D = 0x00;
      this.E = 0x00;
      this.H = 0x00;
      this.L = 0x00;
      this.W = 0x00;
      this.Z = 0x00;
      this.IR = 0x00;
      this.PC = 0x2000;
      this.SP = 0x27FF;
      this.flags = { S: 0, Z: 0, AC: 0, P: 0, CY: 0 };
      this.halted = false;
      this.INTE = 0;
      this.currentOpcode = 0x00;
      this.currentMnemonic = 'NOP';
      this.currentMCycle = 1;
      this.currentMCycleType = 'OF';
      this.currentTState = 1;
      this.totalTStatesInCycle = 4;
      this.instructionCycleSeq = [{ type: 'OF', states: 4 }];
      this.updateBusSignalsForTState();
      this.recordWaveformPoint();
    }

    // Helper: 16-Bit Register Pair Getters / Setters
    get BC() { return ((this.B << 8) | this.C) & 0xFFFF; }
    set BC(v) { this.B = (v >> 8) & 0xFF; this.C = v & 0xFF; }

    get DE() { return ((this.D << 8) | this.E) & 0xFFFF; }
    set DE(v) { this.D = (v >> 8) & 0xFF; this.E = v & 0xFF; }

    get HL() { return ((this.H << 8) | this.L) & 0xFFFF; }
    set HL(v) { this.H = (v >> 8) & 0xFF; this.L = v & 0xFF; }

    get M() { return this.memory[this.HL]; }
    set M(v) { this.memory[this.HL] = v & 0xFF; }

    get PSW() {
      const fByte = (this.flags.S << 7) | (this.flags.Z << 6) | (0 << 5) |
                    (this.flags.AC << 4) | (0 << 3) | (this.flags.P << 2) |
                    (1 << 1) | this.flags.CY;
      return ((this.A << 8) | fByte) & 0xFFFF;
    }
    set PSW(v) {
      this.A = (v >> 8) & 0xFF;
      const fByte = v & 0xFF;
      this.flags.S = (fByte >> 7) & 1;
      this.flags.Z = (fByte >> 6) & 1;
      this.flags.AC = (fByte >> 4) & 1;
      this.flags.P = (fByte >> 2) & 1;
      this.flags.CY = fByte & 1;
    }

    // Flag Calculation Helpers
    calcParity(val) {
      let v = val & 0xFF;
      let count = 0;
      while (v) {
        count += v & 1;
        v >>= 1;
      }
      return (count % 2 === 0) ? 1 : 0;
    }

    setFlagsSZP(val) {
      const v = val & 0xFF;
      this.flags.Z = (v === 0) ? 1 : 0;
      this.flags.S = (v & 0x80) ? 1 : 0;
      this.flags.P = this.calcParity(v);
    }

    // Bus Signal Synthesis for each T-state
    updateBusSignalsForTState() {
      this.CLK = (this.currentTState % 2 === 1) ? 1 : 0;

      // Status pins according to current machine cycle
      if (this.currentMCycleType === 'OF') {
        this.IOM = 0; this.S1 = 1; this.S0 = 1;
      } else if (this.currentMCycleType === 'MR') {
        this.IOM = 0; this.S1 = 1; this.S0 = 0;
      } else if (this.currentMCycleType === 'MW') {
        this.IOM = 0; this.S1 = 0; this.S0 = 1;
      } else if (this.currentMCycleType === 'IOR') {
        this.IOM = 1; this.S1 = 1; this.S0 = 0;
      } else if (this.currentMCycleType === 'IOW') {
        this.IOM = 1; this.S1 = 0; this.S0 = 1;
      }

      if (this.currentTState === 1) {
        // T1: ALE pulses HIGH; AD0-AD7 carries lower address; A8-A15 carries high address
        this.ALE = 1;
        this.RD = 1;
        this.WR = 1;
        this.busA8_A15 = (this.PC >> 8) & 0xFF;
        this.busAD0_AD7 = this.PC & 0xFF;
        this.latchA0_A7 = this.busAD0_AD7;
        this.adBusMode = 'ADDR';
      } else if (this.currentTState === 2) {
        // T2: ALE drops LOW; 74LS373 latches address; RD or WR activates
        this.ALE = 0;
        this.adBusMode = 'DATA';
        if (this.currentMCycleType === 'OF' || this.currentMCycleType === 'MR' || this.currentMCycleType === 'IOR') {
          this.RD = 0;
          this.WR = 1;
          this.busAD0_AD7 = this.memory[this.PC];
        } else if (this.currentMCycleType === 'MW' || this.currentMCycleType === 'IOW') {
          this.RD = 1;
          this.WR = 0;
          this.busAD0_AD7 = this.A;
        }
      } else if (this.currentTState === 3) {
        // T3: Data transfer completes
        this.ALE = 0;
        this.adBusMode = 'DATA';
        if (this.currentMCycleType === 'OF' || this.currentMCycleType === 'MR') {
          this.busAD0_AD7 = this.memory[this.PC];
          this.RD = 0;
        }
      } else {
        // T4..T6: Internal decoding/execution
        this.ALE = 0;
        this.RD = 1;
        this.WR = 1;
        this.adBusMode = 'IDLE';
      }
    }

    recordWaveformPoint() {
      this.waveformHistory.push({
        clk: this.CLK,
        ale: this.ALE,
        a_high: this.busA8_A15,
        ad_bus: this.busAD0_AD7,
        iom: this.IOM,
        rd: this.RD,
        wr: this.WR,
        cycle: `${this.currentMCycleType} T${this.currentTState}`
      });
      if (this.waveformHistory.length > this.maxWaveformPoints) {
        this.waveformHistory.shift();
      }
    }

    // Step a single clock T-State
    stepTState() {
      if (this.halted) return false;

      this.currentTState++;
      if (this.currentTState > this.totalTStatesInCycle) {
        this.currentTState = 1;
        this.currentMCycle++;
        if (this.currentMCycle > this.instructionCycleSeq.length) {
          // Finished all machine cycles of instruction; execute instruction logic
          this.executeCurrentInstructionLogic();
          this.prepareNextInstruction();
        } else {
          const m = this.instructionCycleSeq[this.currentMCycle - 1];
          this.currentMCycleType = m.type;
          this.totalTStatesInCycle = m.states;
        }
      }

      this.updateBusSignalsForTState();
      this.recordWaveformPoint();
      sound.playClockTick();
      return true;
    }

    // Step an entire machine cycle
    stepMCycle() {
      if (this.halted) return false;
      const targetCycle = this.currentMCycle;
      while (this.currentMCycle === targetCycle && !this.halted) {
        this.stepTState();
        if (this.currentMCycle !== targetCycle) break;
      }
      return true;
    }

    // Step full instruction
    stepInstruction() {
      if (this.halted) return false;
      // Run through remaining T-states of current instruction
      while (this.currentMCycle > 1 || this.currentTState > 1) {
        this.stepTState();
        if (this.halted) return true;
        if (this.currentMCycle === 1 && this.currentTState === 1) break;
      }
      // If we are at the start of a fresh instruction, execute it completely
      this.executeCurrentInstructionLogic();
      this.prepareNextInstruction();
      this.updateBusSignalsForTState();
      this.recordWaveformPoint();
      return true;
    }

    prepareNextInstruction() {
      this.currentOpcode = this.memory[this.PC];
      this.IR = this.currentOpcode;
      this.currentMCycle = 1;
      this.currentTState = 1;
      this.setupInstructionCycles(this.currentOpcode);
    }

    setupInstructionCycles(op) {
      // Determine machine cycle profile for 8085 opcode
      // Common defaults:
      let seq = [{ type: 'OF', states: 4 }];
      // 1-byte register ops: 1 cycle (4T)
      // 2-byte immediate ops: OF(4T) + MR(3T) = 7T
      // 3-byte ops (LXI, STA, LDA, JMP): OF(4T) + MR(3T) + MR(3T)...
      if (op === 0x76) {
        // HLT
        seq = [{ type: 'OF', states: 5 }];
      } else if (op === 0x00) {
        // NOP
        seq = [{ type: 'OF', states: 4 }];
      } else if ([0x06, 0x0E, 0x16, 0x1E, 0x26, 0x2E, 0x3E, 0xC6, 0xD6, 0xE6, 0xF6, 0xEE, 0xFE].includes(op)) {
        // MVI r, data / ADI / SUI / ANI / ORI / XRI / CPI
        seq = [{ type: 'OF', states: 4 }, { type: 'MR', states: 3 }];
      } else if ([0x01, 0x11, 0x21, 0x31].includes(op)) {
        // LXI rp, data16: OF(4T) + MR(3T) + MR(3T) = 10T
        seq = [{ type: 'OF', states: 4 }, { type: 'MR', states: 3 }, { type: 'MR', states: 3 }];
      } else if ([0x32, 0x3A, 0x22, 0x2A].includes(op)) {
        // STA, LDA, SHLD, LHLD: 4 cycles, 13T or 16T
        seq = [{ type: 'OF', states: 4 }, { type: 'MR', states: 3 }, { type: 'MR', states: 3 }, { type: (op === 0x32 || op === 0x22 ? 'MW' : 'MR'), states: 3 }];
      } else if ([0xC3, 0xCA, 0xC2, 0xDA, 0xD2, 0xE2, 0xEA, 0xF2, 0xFA].includes(op)) {
        // JMP / Conditional JMP: 3 cycles, 10T
        seq = [{ type: 'OF', states: 4 }, { type: 'MR', states: 3 }, { type: 'MR', states: 3 }];
      } else if ([0xDB, 0xD3].includes(op)) {
        // IN / OUT port: 3 cycles, 10T
        seq = [{ type: 'OF', states: 4 }, { type: 'MR', states: 3 }, { type: (op === 0xDB ? 'IOR' : 'IOW'), states: 3 }];
      } else if ([0x09, 0x19, 0x29, 0x39].includes(op)) {
        // DAD rp: OF(4T) + bus idle(6T) = 10T
        seq = [{ type: 'OF', states: 4 }, { type: 'MR', states: 3 }, { type: 'MR', states: 3 }];
      }
      this.instructionCycleSeq = seq;
      this.currentMCycleType = seq[0].type;
      this.totalTStatesInCycle = seq[0].states;
    }

    // Full Instruction Logic Execution
    executeCurrentInstructionLogic() {
      const op = this.memory[this.PC];
      let nextPC = this.PC + 1;
      let logMsg = '';

      switch (op) {
        case 0x00: // NOP
          logMsg = `[${this.hex4(this.PC)}] NOP`;
          break;

        case 0x76: // HLT
          this.halted = true;
          logMsg = `[${this.hex4(this.PC)}] HLT -> Microprocessor in HALT state.`;
          sound.playHaltTone();
          break;

        // MVI r, data
        case 0x3E: // MVI A, d8
          this.A = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI A, ${this.hex2(this.A)}H`;
          break;
        case 0x06: // MVI B, d8
          this.B = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI B, ${this.hex2(this.B)}H`;
          break;
        case 0x0E: // MVI C, d8
          this.C = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI C, ${this.hex2(this.C)}H`;
          break;
        case 0x16: // MVI D, d8
          this.D = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI D, ${this.hex2(this.D)}H`;
          break;
        case 0x1E: // MVI E, d8
          this.E = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI E, ${this.hex2(this.E)}H`;
          break;
        case 0x26: // MVI H, d8
          this.H = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI H, ${this.hex2(this.H)}H`;
          break;
        case 0x2E: // MVI L, d8
          this.L = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI L, ${this.hex2(this.L)}H`;
          break;
        case 0x36: // MVI M, d8
          this.M = this.memory[this.PC + 1]; nextPC += 1;
          logMsg = `[${this.hex4(this.PC)}] MVI M, ${this.hex2(this.M)}H`;
          break;

        // LXI rp, d16
        case 0x01: // LXI B, d16
          this.C = this.memory[this.PC + 1];
          this.B = this.memory[this.PC + 2];
          nextPC += 2;
          logMsg = `[${this.hex4(this.PC)}] LXI B, ${this.hex4(this.BC)}H`;
          break;
        case 0x11: // LXI D, d16
          this.E = this.memory[this.PC + 1];
          this.D = this.memory[this.PC + 2];
          nextPC += 2;
          logMsg = `[${this.hex4(this.PC)}] LXI D, ${this.hex4(this.DE)}H`;
          break;
        case 0x21: // LXI H, d16
          this.L = this.memory[this.PC + 1];
          this.H = this.memory[this.PC + 2];
          nextPC += 2;
          logMsg = `[${this.hex4(this.PC)}] LXI H, ${this.hex4(this.HL)}H`;
          break;
        case 0x31: // LXI SP, d16
          this.SP = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
          nextPC += 2;
          logMsg = `[${this.hex4(this.PC)}] LXI SP, ${this.hex4(this.SP)}H`;
          break;

        // MOV r1, r2
        case 0x78: this.A = this.B; logMsg = `[${this.hex4(this.PC)}] MOV A, B`; break;
        case 0x79: this.A = this.C; logMsg = `[${this.hex4(this.PC)}] MOV A, C`; break;
        case 0x7A: this.A = this.D; logMsg = `[${this.hex4(this.PC)}] MOV A, D`; break;
        case 0x7B: this.A = this.E; logMsg = `[${this.hex4(this.PC)}] MOV A, E`; break;
        case 0x7C: this.A = this.H; logMsg = `[${this.hex4(this.PC)}] MOV A, H`; break;
        case 0x7D: this.A = this.L; logMsg = `[${this.hex4(this.PC)}] MOV A, L`; break;
        case 0x7E: this.A = this.M; logMsg = `[${this.hex4(this.PC)}] MOV A, M (= ${this.hex2(this.A)}H)`; break;

        case 0x47: this.B = this.A; logMsg = `[${this.hex4(this.PC)}] MOV B, A`; break;
        case 0x4F: this.C = this.A; logMsg = `[${this.hex4(this.PC)}] MOV C, A`; break;
        case 0x57: this.D = this.A; logMsg = `[${this.hex4(this.PC)}] MOV D, A`; break;
        case 0x5F: this.E = this.A; logMsg = `[${this.hex4(this.PC)}] MOV E, A`; break;
        case 0x67: this.H = this.A; logMsg = `[${this.hex4(this.PC)}] MOV H, A`; break;
        case 0x6F: this.L = this.A; logMsg = `[${this.hex4(this.PC)}] MOV L, A`; break;
        case 0x77: this.M = this.A; logMsg = `[${this.hex4(this.PC)}] MOV M, A (MEM[${this.hex4(this.HL)}] = ${this.hex2(this.A)}H)`; break;

        case 0x46: this.B = this.M; logMsg = `[${this.hex4(this.PC)}] MOV B, M`; break;
        case 0x4E: this.C = this.M; logMsg = `[${this.hex4(this.PC)}] MOV C, M`; break;
        case 0x56: this.D = this.M; logMsg = `[${this.hex4(this.PC)}] MOV D, M`; break;
        case 0x5E: this.E = this.M; logMsg = `[${this.hex4(this.PC)}] MOV E, M`; break;
        case 0x66: this.H = this.M; logMsg = `[${this.hex4(this.PC)}] MOV H, M`; break;
        case 0x6E: this.L = this.M; logMsg = `[${this.hex4(this.PC)}] MOV L, M`; break;

        case 0x70: this.M = this.B; logMsg = `[${this.hex4(this.PC)}] MOV M, B`; break;
        case 0x71: this.M = this.C; logMsg = `[${this.hex4(this.PC)}] MOV M, C`; break;
        case 0x72: this.M = this.D; logMsg = `[${this.hex4(this.PC)}] MOV M, D`; break;
        case 0x73: this.M = this.E; logMsg = `[${this.hex4(this.PC)}] MOV M, E`; break;
        case 0x74: this.M = this.H; logMsg = `[${this.hex4(this.PC)}] MOV M, H`; break;
        case 0x75: this.M = this.L; logMsg = `[${this.hex4(this.PC)}] MOV M, L`; break;

        // LDA / STA / LHLD / SHLD
        case 0x3A: // LDA addr
          {
            const addr = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            this.A = this.memory[addr];
            nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] LDA ${this.hex4(addr)}H -> A = ${this.hex2(this.A)}H`;
          }
          break;
        case 0x32: // STA addr
          {
            const addr = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            this.memory[addr] = this.A;
            nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] STA ${this.hex4(addr)}H (MEM[${this.hex4(addr)}] = ${this.hex2(this.A)}H)`;
          }
          break;
        case 0x2A: // LHLD addr
          {
            const addr = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            this.L = this.memory[addr];
            this.H = this.memory[(addr + 1) & 0xFFFF];
            nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] LHLD ${this.hex4(addr)}H -> HL = ${this.hex4(this.HL)}H`;
          }
          break;
        case 0x22: // SHLD addr
          {
            const addr = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            this.memory[addr] = this.L;
            this.memory[(addr + 1) & 0xFFFF] = this.H;
            nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] SHLD ${this.hex4(addr)}H (MEM[${this.hex4(addr)}] = ${this.hex4(this.HL)}H)`;
          }
          break;

        // LDAX / STAX
        case 0x0A: this.A = this.memory[this.BC]; logMsg = `[${this.hex4(this.PC)}] LDAX B`; break;
        case 0x1A: this.A = this.memory[this.DE]; logMsg = `[${this.hex4(this.PC)}] LDAX D`; break;
        case 0x02: this.memory[this.BC] = this.A; logMsg = `[${this.hex4(this.PC)}] STAX B`; break;
        case 0x12: this.memory[this.DE] = this.A; logMsg = `[${this.hex4(this.PC)}] STAX D`; break;

        // XCHG
        case 0xEB:
          {
            const th = this.H, tl = this.L;
            this.H = this.D; this.L = this.E;
            this.D = th; this.E = tl;
            logMsg = `[${this.hex4(this.PC)}] XCHG -> HL <-> DE`;
          }
          break;

        // Arithmetic: ADD r
        case 0x80: this.doAdd(this.B); logMsg = `[${this.hex4(this.PC)}] ADD B`; break;
        case 0x81: this.doAdd(this.C); logMsg = `[${this.hex4(this.PC)}] ADD C`; break;
        case 0x82: this.doAdd(this.D); logMsg = `[${this.hex4(this.PC)}] ADD D`; break;
        case 0x83: this.doAdd(this.E); logMsg = `[${this.hex4(this.PC)}] ADD E`; break;
        case 0x84: this.doAdd(this.H); logMsg = `[${this.hex4(this.PC)}] ADD H`; break;
        case 0x85: this.doAdd(this.L); logMsg = `[${this.hex4(this.PC)}] ADD L`; break;
        case 0x86: this.doAdd(this.M); logMsg = `[${this.hex4(this.PC)}] ADD M`; break;
        case 0x87: this.doAdd(this.A); logMsg = `[${this.hex4(this.PC)}] ADD A`; break;

        // ADC r
        case 0x88: this.doAdc(this.B); logMsg = `[${this.hex4(this.PC)}] ADC B`; break;
        case 0x89: this.doAdc(this.C); logMsg = `[${this.hex4(this.PC)}] ADC C`; break;
        case 0x8A: this.doAdc(this.D); logMsg = `[${this.hex4(this.PC)}] ADC D`; break;
        case 0x8B: this.doAdc(this.E); logMsg = `[${this.hex4(this.PC)}] ADC E`; break;
        case 0x8C: this.doAdc(this.H); logMsg = `[${this.hex4(this.PC)}] ADC H`; break;
        case 0x8D: this.doAdc(this.L); logMsg = `[${this.hex4(this.PC)}] ADC L`; break;
        case 0x8E: this.doAdc(this.M); logMsg = `[${this.hex4(this.PC)}] ADC M`; break;
        case 0x8F: this.doAdc(this.A); logMsg = `[${this.hex4(this.PC)}] ADC A`; break;

        // ADI d8 / ACI d8
        case 0xC6:
          {
            const d = this.memory[this.PC + 1]; nextPC += 1;
            this.doAdd(d);
            logMsg = `[${this.hex4(this.PC)}] ADI ${this.hex2(d)}H`;
          }
          break;
        case 0xCE:
          {
            const d = this.memory[this.PC + 1]; nextPC += 1;
            this.doAdc(d);
            logMsg = `[${this.hex4(this.PC)}] ACI ${this.hex2(d)}H`;
          }
          break;

        // SUB r
        case 0x90: this.doSub(this.B); logMsg = `[${this.hex4(this.PC)}] SUB B`; break;
        case 0x91: this.doSub(this.C); logMsg = `[${this.hex4(this.PC)}] SUB C`; break;
        case 0x92: this.doSub(this.D); logMsg = `[${this.hex4(this.PC)}] SUB D`; break;
        case 0x93: this.doSub(this.E); logMsg = `[${this.hex4(this.PC)}] SUB E`; break;
        case 0x94: this.doSub(this.H); logMsg = `[${this.hex4(this.PC)}] SUB H`; break;
        case 0x95: this.doSub(this.L); logMsg = `[${this.hex4(this.PC)}] SUB L`; break;
        case 0x96: this.doSub(this.M); logMsg = `[${this.hex4(this.PC)}] SUB M`; break;
        case 0x97: this.doSub(this.A); logMsg = `[${this.hex4(this.PC)}] SUB A`; break;

        // SUI d8
        case 0xD6:
          {
            const d = this.memory[this.PC + 1]; nextPC += 1;
            this.doSub(d);
            logMsg = `[${this.hex4(this.PC)}] SUI ${this.hex2(d)}H`;
          }
          break;

        // INR r / DCR r
        case 0x04: this.B = this.doInr(this.B); logMsg = `[${this.hex4(this.PC)}] INR B`; break;
        case 0x0C: this.C = this.doInr(this.C); logMsg = `[${this.hex4(this.PC)}] INR C`; break;
        case 0x14: this.D = this.doInr(this.D); logMsg = `[${this.hex4(this.PC)}] INR D`; break;
        case 0x1C: this.E = this.doInr(this.E); logMsg = `[${this.hex4(this.PC)}] INR E`; break;
        case 0x24: this.H = this.doInr(this.H); logMsg = `[${this.hex4(this.PC)}] INR H`; break;
        case 0x2C: this.L = this.doInr(this.L); logMsg = `[${this.hex4(this.PC)}] INR L`; break;
        case 0x34: this.M = this.doInr(this.M); logMsg = `[${this.hex4(this.PC)}] INR M`; break;
        case 0x3C: this.A = this.doInr(this.A); logMsg = `[${this.hex4(this.PC)}] INR A`; break;

        case 0x05: this.B = this.doDcr(this.B); logMsg = `[${this.hex4(this.PC)}] DCR B`; break;
        case 0x0D: this.C = this.doDcr(this.C); logMsg = `[${this.hex4(this.PC)}] DCR C`; break;
        case 0x15: this.D = this.doDcr(this.D); logMsg = `[${this.hex4(this.PC)}] DCR D`; break;
        case 0x1D: this.E = this.doDcr(this.E); logMsg = `[${this.hex4(this.PC)}] DCR E`; break;
        case 0x25: this.H = this.doDcr(this.H); logMsg = `[${this.hex4(this.PC)}] DCR H`; break;
        case 0x2D: this.L = this.doDcr(this.L); logMsg = `[${this.hex4(this.PC)}] DCR L`; break;
        case 0x35: this.M = this.doDcr(this.M); logMsg = `[${this.hex4(this.PC)}] DCR M`; break;
        case 0x3D: this.A = this.doDcr(this.A); logMsg = `[${this.hex4(this.PC)}] DCR A`; break;

        // INX rp / DCX rp
        case 0x03: this.BC = (this.BC + 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] INX B`; break;
        case 0x13: this.DE = (this.DE + 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] INX D`; break;
        case 0x23: this.HL = (this.HL + 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] INX H`; break;
        case 0x33: this.SP = (this.SP + 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] INX SP`; break;

        case 0x0B: this.BC = (this.BC - 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] DCX B`; break;
        case 0x1B: this.DE = (this.DE - 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] DCX D`; break;
        case 0x2B: this.HL = (this.HL - 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] DCX H`; break;
        case 0x3B: this.SP = (this.SP - 1) & 0xFFFF; logMsg = `[${this.hex4(this.PC)}] DCX SP`; break;

        // DAD rp (16-bit add to HL)
        case 0x09: this.doDad(this.BC); logMsg = `[${this.hex4(this.PC)}] DAD B`; break;
        case 0x19: this.doDad(this.DE); logMsg = `[${this.hex4(this.PC)}] DAD D`; break;
        case 0x29: this.doDad(this.HL); logMsg = `[${this.hex4(this.PC)}] DAD H`; break;
        case 0x39: this.doDad(this.SP); logMsg = `[${this.hex4(this.PC)}] DAD SP`; break;

        // DAA (Decimal Adjust Accumulator)
        case 0x27:
          this.doDaa();
          logMsg = `[${this.hex4(this.PC)}] DAA -> A = ${this.hex2(this.A)}H`;
          break;

        // CMA / CMC / STC
        case 0x2F: // CMA
          this.A = (~this.A) & 0xFF;
          logMsg = `[${this.hex4(this.PC)}] CMA -> A = ${this.hex2(this.A)}H`;
          break;
        case 0x3F: // CMC
          this.flags.CY = this.flags.CY ? 0 : 1;
          logMsg = `[${this.hex4(this.PC)}] CMC -> CY = ${this.flags.CY}`;
          break;
        case 0x37: // STC
          this.flags.CY = 1;
          logMsg = `[${this.hex4(this.PC)}] STC -> CY = 1`;
          break;

        // Logical: ANA, ORA, XRA, CMP
        case 0xA0: this.doAna(this.B); logMsg = `[${this.hex4(this.PC)}] ANA B`; break;
        case 0xA1: this.doAna(this.C); logMsg = `[${this.hex4(this.PC)}] ANA C`; break;
        case 0xA2: this.doAna(this.D); logMsg = `[${this.hex4(this.PC)}] ANA D`; break;
        case 0xA3: this.doAna(this.E); logMsg = `[${this.hex4(this.PC)}] ANA E`; break;
        case 0xA4: this.doAna(this.H); logMsg = `[${this.hex4(this.PC)}] ANA H`; break;
        case 0xA5: this.doAna(this.L); logMsg = `[${this.hex4(this.PC)}] ANA L`; break;
        case 0xA6: this.doAna(this.M); logMsg = `[${this.hex4(this.PC)}] ANA M`; break;
        case 0xA7: this.doAna(this.A); logMsg = `[${this.hex4(this.PC)}] ANA A`; break;

        case 0xB0: this.doOra(this.B); logMsg = `[${this.hex4(this.PC)}] ORA B`; break;
        case 0xB1: this.doOra(this.C); logMsg = `[${this.hex4(this.PC)}] ORA C`; break;
        case 0xB2: this.doOra(this.D); logMsg = `[${this.hex4(this.PC)}] ORA D`; break;
        case 0xB3: this.doOra(this.E); logMsg = `[${this.hex4(this.PC)}] ORA E`; break;
        case 0xB4: this.doOra(this.H); logMsg = `[${this.hex4(this.PC)}] ORA H`; break;
        case 0xB5: this.doOra(this.L); logMsg = `[${this.hex4(this.PC)}] ORA L`; break;
        case 0xB6: this.doOra(this.M); logMsg = `[${this.hex4(this.PC)}] ORA M`; break;
        case 0xB7: this.doOra(this.A); logMsg = `[${this.hex4(this.PC)}] ORA A`; break;

        case 0xA8: this.doXra(this.B); logMsg = `[${this.hex4(this.PC)}] XRA B`; break;
        case 0xA9: this.doXra(this.C); logMsg = `[${this.hex4(this.PC)}] XRA C`; break;
        case 0xAA: this.doXra(this.D); logMsg = `[${this.hex4(this.PC)}] XRA D`; break;
        case 0xAB: this.doXra(this.E); logMsg = `[${this.hex4(this.PC)}] XRA E`; break;
        case 0xAC: this.doXra(this.H); logMsg = `[${this.hex4(this.PC)}] XRA H`; break;
        case 0xAD: this.doXra(this.L); logMsg = `[${this.hex4(this.PC)}] XRA L`; break;
        case 0xAE: this.doXra(this.M); logMsg = `[${this.hex4(this.PC)}] XRA M`; break;
        case 0xAF: this.doXra(this.A); logMsg = `[${this.hex4(this.PC)}] XRA A (Clear A)`; break;

        case 0xB8: this.doCmp(this.B); logMsg = `[${this.hex4(this.PC)}] CMP B`; break;
        case 0xB9: this.doCmp(this.C); logMsg = `[${this.hex4(this.PC)}] CMP C`; break;
        case 0xBA: this.doCmp(this.D); logMsg = `[${this.hex4(this.PC)}] CMP D`; break;
        case 0xBB: this.doCmp(this.E); logMsg = `[${this.hex4(this.PC)}] CMP E`; break;
        case 0xBC: this.doCmp(this.H); logMsg = `[${this.hex4(this.PC)}] CMP H`; break;
        case 0xBD: this.doCmp(this.L); logMsg = `[${this.hex4(this.PC)}] CMP L`; break;
        case 0xBE: this.doCmp(this.M); logMsg = `[${this.hex4(this.PC)}] CMP M`; break;
        case 0xBF: this.doCmp(this.A); logMsg = `[${this.hex4(this.PC)}] CMP A`; break;

        case 0xFE: // CPI d8
          {
            const d = this.memory[this.PC + 1]; nextPC += 1;
            this.doCmp(d);
            logMsg = `[${this.hex4(this.PC)}] CPI ${this.hex2(d)}H`;
          }
          break;

        // Rotates: RLC, RRC, RAL, RAR
        case 0x07: // RLC
          {
            const bit7 = (this.A >> 7) & 1;
            this.A = ((this.A << 1) | bit7) & 0xFF;
            this.flags.CY = bit7;
            logMsg = `[${this.hex4(this.PC)}] RLC`;
          }
          break;
        case 0x0F: // RRC
          {
            const bit0 = this.A & 1;
            this.A = ((this.A >> 1) | (bit0 << 7)) & 0xFF;
            this.flags.CY = bit0;
            logMsg = `[${this.hex4(this.PC)}] RRC`;
          }
          break;
        case 0x17: // RAL
          {
            const oldCY = this.flags.CY;
            this.flags.CY = (this.A >> 7) & 1;
            this.A = ((this.A << 1) | oldCY) & 0xFF;
            logMsg = `[${this.hex4(this.PC)}] RAL`;
          }
          break;
        case 0x1F: // RAR
          {
            const oldCY = this.flags.CY;
            this.flags.CY = this.A & 1;
            this.A = ((this.A >> 1) | (oldCY << 7)) & 0xFF;
            logMsg = `[${this.hex4(this.PC)}] RAR`;
          }
          break;

        // Branching: JMP / Conditionals
        case 0xC3: // JMP
          {
            const target = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            nextPC = target;
            logMsg = `[${this.hex4(this.PC)}] JMP ${this.hex4(target)}H`;
          }
          break;
        case 0xC2: // JNZ
          {
            const target = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            if (!this.flags.Z) nextPC = target; else nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] JNZ ${this.hex4(target)}H (${!this.flags.Z ? 'Taken' : 'Not Taken'})`;
          }
          break;
        case 0xCA: // JZ
          {
            const target = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            if (this.flags.Z) nextPC = target; else nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] JZ ${this.hex4(target)}H (${this.flags.Z ? 'Taken' : 'Not Taken'})`;
          }
          break;
        case 0xD2: // JNC
          {
            const target = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            if (!this.flags.CY) nextPC = target; else nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] JNC ${this.hex4(target)}H (${!this.flags.CY ? 'Taken' : 'Not Taken'})`;
          }
          break;
        case 0xDA: // JC
          {
            const target = (this.memory[this.PC + 2] << 8) | this.memory[this.PC + 1];
            if (this.flags.CY) nextPC = target; else nextPC += 2;
            logMsg = `[${this.hex4(this.PC)}] JC ${this.hex4(target)}H (${this.flags.CY ? 'Taken' : 'Not Taken'})`;
          }
          break;

        // Stack: PUSH / POP
        case 0xC5: // PUSH B
          this.pushWord(this.BC); logMsg = `[${this.hex4(this.PC)}] PUSH B`; break;
        case 0xD5: // PUSH D
          this.pushWord(this.DE); logMsg = `[${this.hex4(this.PC)}] PUSH D`; break;
        case 0xE5: // PUSH H
          this.pushWord(this.HL); logMsg = `[${this.hex4(this.PC)}] PUSH H`; break;
        case 0xF5: // PUSH PSW
          this.pushWord(this.PSW); logMsg = `[${this.hex4(this.PC)}] PUSH PSW`; break;

        case 0xC1: // POP B
          this.BC = this.popWord(); logMsg = `[${this.hex4(this.PC)}] POP B`; break;
        case 0xD1: // POP D
          this.DE = this.popWord(); logMsg = `[${this.hex4(this.PC)}] POP D`; break;
        case 0xE1: // POP H
          this.HL = this.popWord(); logMsg = `[${this.hex4(this.PC)}] POP H`; break;
        case 0xF1: // POP PSW
          this.PSW = this.popWord(); logMsg = `[${this.hex4(this.PC)}] POP PSW`; break;

        // I/O Ports: IN / OUT
        case 0xDB: // IN port
          {
            const port = this.memory[this.PC + 1]; nextPC += 1;
            this.A = this.ports[port];
            logMsg = `[${this.hex4(this.PC)}] IN ${this.hex2(port)}H -> A = ${this.hex2(this.A)}H`;
          }
          break;
        case 0xD3: // OUT port
          {
            const port = this.memory[this.PC + 1]; nextPC += 1;
            this.ports[port] = this.A;
            logMsg = `[${this.hex4(this.PC)}] OUT ${this.hex2(port)}H (Port[${this.hex2(port)}] = ${this.hex2(this.A)}H)`;
          }
          break;

        default:
          logMsg = `[${this.hex4(this.PC)}] UNKNOWN OPCODE: ${this.hex2(op)}H`;
          break;
      }

      this.PC = nextPC & 0xFFFF;
      if (logMsg) {
        this.log(logMsg);
      }
    }

    // Arithmetic Implementations
    doAdd(val) {
      const v = val & 0xFF;
      const res = this.A + v;
      this.flags.AC = ((this.A & 0x0F) + (v & 0x0F) > 0x0F) ? 1 : 0;
      this.flags.CY = (res > 0xFF) ? 1 : 0;
      this.A = res & 0xFF;
      this.setFlagsSZP(this.A);
    }

    doAdc(val) {
      const v = val & 0xFF;
      const cy = this.flags.CY;
      const res = this.A + v + cy;
      this.flags.AC = ((this.A & 0x0F) + (v & 0x0F) + cy > 0x0F) ? 1 : 0;
      this.flags.CY = (res > 0xFF) ? 1 : 0;
      this.A = res & 0xFF;
      this.setFlagsSZP(this.A);
    }

    doSub(val) {
      const v = val & 0xFF;
      const res = this.A - v;
      this.flags.AC = ((this.A & 0x0F) < (v & 0x0F)) ? 1 : 0;
      this.flags.CY = (res < 0) ? 1 : 0;
      this.A = res & 0xFF;
      this.setFlagsSZP(this.A);
    }

    doInr(val) {
      const res = (val + 1) & 0xFF;
      this.flags.AC = ((val & 0x0F) + 1 > 0x0F) ? 1 : 0;
      this.setFlagsSZP(res);
      return res;
    }

    doDcr(val) {
      const res = (val - 1) & 0xFF;
      this.flags.AC = ((val & 0x0F) === 0) ? 1 : 0;
      this.setFlagsSZP(res);
      return res;
    }

    doDad(val16) {
      const sum = this.HL + (val16 & 0xFFFF);
      this.flags.CY = (sum > 0xFFFF) ? 1 : 0;
      this.HL = sum & 0xFFFF;
    }

    doDaa() {
      let adj = 0;
      let newCY = this.flags.CY;
      const low = this.A & 0x0F;
      const high = (this.A >> 4) & 0x0F;

      if (this.flags.AC || low > 9) {
        adj += 0x06;
      }
      if (this.flags.CY || high > 9 || (high >= 9 && low > 9)) {
        adj += 0x60;
        newCY = 1;
      }
      const res = this.A + adj;
      this.flags.AC = ((this.A & 0x0F) + (adj & 0x0F) > 0x0F) ? 1 : 0;
      this.flags.CY = newCY;
      this.A = res & 0xFF;
      this.setFlagsSZP(this.A);
    }

    doAna(val) {
      this.A = (this.A & val) & 0xFF;
      this.flags.CY = 0;
      this.flags.AC = 1;
      this.setFlagsSZP(this.A);
    }

    doOra(val) {
      this.A = (this.A | val) & 0xFF;
      this.flags.CY = 0;
      this.flags.AC = 0;
      this.setFlagsSZP(this.A);
    }

    doXra(val) {
      this.A = (this.A ^ val) & 0xFF;
      this.flags.CY = 0;
      this.flags.AC = 0;
      this.setFlagsSZP(this.A);
    }

    doCmp(val) {
      const v = val & 0xFF;
      const res = this.A - v;
      this.flags.CY = (this.A < v) ? 1 : 0;
      this.flags.AC = ((this.A & 0x0F) < (v & 0x0F)) ? 1 : 0;
      this.setFlagsSZP(res & 0xFF);
    }

    pushWord(val) {
      const high = (val >> 8) & 0xFF;
      const low = val & 0xFF;
      this.SP = (this.SP - 1) & 0xFFFF;
      this.memory[this.SP] = high;
      this.SP = (this.SP - 1) & 0xFFFF;
      this.memory[this.SP] = low;
    }

    popWord() {
      const low = this.memory[this.SP];
      this.SP = (this.SP + 1) & 0xFFFF;
      const high = this.memory[this.SP];
      this.SP = (this.SP + 1) & 0xFFFF;
      return ((high << 8) | low) & 0xFFFF;
    }

    hex2(v) {
      return (v & 0xFF).toString(16).toUpperCase().padStart(2, '0');
    }

    hex4(v) {
      return (v & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    log(msg) {
      const consoleEl = document.getElementById('console-log');
      if (consoleEl) {
        consoleEl.innerHTML += `<br>&gt; ${msg}`;
        consoleEl.scrollTop = consoleEl.scrollHeight;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. TWO-PASS 8085 ASSEMBLER & DISASSEMBLER
  // ════════════════════════════════════════════════════════════════════════════
  class Assembler8085 {
    constructor() {
      // Standard Opcode Lookup Table
      this.opcodes = {
        'NOP': { code: 0x00, bytes: 1, mc: 1, t: 4 },
        'HLT': { code: 0x76, bytes: 1, mc: 1, t: 5 },
        'CMA': { code: 0x2F, bytes: 1, mc: 1, t: 4 },
        'CMC': { code: 0x3F, bytes: 1, mc: 1, t: 4 },
        'STC': { code: 0x37, bytes: 1, mc: 1, t: 4 },
        'DAA': { code: 0x27, bytes: 1, mc: 1, t: 4 },
        'RLC': { code: 0x07, bytes: 1, mc: 1, t: 4 },
        'RRC': { code: 0x0F, bytes: 1, mc: 1, t: 4 },
        'RAL': { code: 0x17, bytes: 1, mc: 1, t: 4 },
        'RAR': { code: 0x1F, bytes: 1, mc: 1, t: 4 },
        'XCHG': { code: 0xEB, bytes: 1, mc: 1, t: 4 }
      };

      // Register Encodings
      this.regCodes = { 'B': 0, 'C': 1, 'D': 2, 'E': 3, 'H': 4, 'L': 5, 'M': 6, 'A': 7 };
      this.rpCodes = { 'B': 0, 'D': 1, 'H': 2, 'SP': 3 };
    }

    assemble(sourceCode, defaultOrg = 0x2000) {
      const lines = sourceCode.split('\n');
      const symbols = {};
      let currentAddr = defaultOrg;
      const parsedLines = [];

      // Pass 1: Parse labels, directives, calculate instruction addresses
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        const commentIdx = line.indexOf(';');
        if (commentIdx !== -1) line = line.substring(0, commentIdx).trim();
        if (!line) continue;

        let label = null;
        if (line.includes(':')) {
          const parts = line.split(':');
          label = parts[0].trim().toUpperCase();
          line = parts.slice(1).join(':').trim();
          symbols[label] = currentAddr;
        }
        if (!line) continue;

        const tokens = line.split(/[\s,]+/).filter(Boolean);
        const mnemonic = tokens[0].toUpperCase();
        const operands = tokens.slice(1);

        if (mnemonic === 'ORG') {
          currentAddr = this.parseHex(operands[0]);
          continue;
        }

        const size = this.estimateSize(mnemonic, operands);
        parsedLines.push({
          lineNum: i + 1,
          addr: currentAddr,
          mnemonic,
          operands,
          raw: line,
          size
        });
        currentAddr += size;
      }

      // Pass 2: Generate Machine Code Bytes & Disassembly Records
      const binaryMap = [];
      const disasmRecords = [];
      let error = null;

      for (const item of parsedLines) {
        try {
          const result = this.encodeInstruction(item.mnemonic, item.operands, item.addr, symbols);
          binaryMap.push({ addr: item.addr, bytes: result.bytes });
          disasmRecords.push({
            addr: item.addr,
            bytes: result.bytes,
            mnemonic: item.raw.toUpperCase(),
            mc: result.mc,
            t: result.t
          });
        } catch (err) {
          error = `Line ${item.lineNum}: ${err.message}`;
          break;
        }
      }

      return { binaryMap, disasmRecords, symbols, error };
    }

    estimateSize(mnemonic, ops) {
      if (['MVI', 'ADI', 'ACI', 'SUI', 'ANI', 'ORI', 'XRI', 'CPI', 'IN', 'OUT'].includes(mnemonic)) return 2;
      if (['LXI', 'LDA', 'STA', 'LHLD', 'SHLD', 'JMP', 'JNZ', 'JZ', 'JNC', 'JC'].includes(mnemonic)) return 3;
      return 1;
    }

    encodeInstruction(mnemonic, ops, addr, symbols) {
      if (this.opcodes[mnemonic]) {
        const spec = this.opcodes[mnemonic];
        return { bytes: [spec.code], mc: spec.mc, t: spec.t };
      }

      // MOV r1, r2
      if (mnemonic === 'MOV') {
        const dst = ops[0].toUpperCase();
        const src = ops[1].toUpperCase();
        const code = 0x40 | (this.regCodes[dst] << 3) | this.regCodes[src];
        const isMem = (dst === 'M' || src === 'M');
        return { bytes: [code], mc: isMem ? 2 : 1, t: isMem ? 7 : 4 };
      }

      // MVI r, data
      if (mnemonic === 'MVI') {
        const dst = ops[0].toUpperCase();
        const data = this.resolveValue(ops[1], symbols) & 0xFF;
        const code = 0x06 | (this.regCodes[dst] << 3);
        const isMem = (dst === 'M');
        return { bytes: [code, data], mc: isMem ? 3 : 2, t: isMem ? 10 : 7 };
      }

      // LXI rp, d16
      if (mnemonic === 'LXI') {
        const rp = ops[0].toUpperCase();
        const val = this.resolveValue(ops[1], symbols);
        const code = 0x01 | (this.rpCodes[rp] << 4);
        return { bytes: [code, val & 0xFF, (val >> 8) & 0xFF], mc: 3, t: 10 };
      }

      // Single operand Arithmetic/Logical: ADD, SUB, INR, DCR, CMP, etc.
      const aluMap = {
        'ADD': 0x80, 'ADC': 0x88, 'SUB': 0x90, 'ANA': 0xA0, 'XRA': 0xA8, 'ORA': 0xB0, 'CMP': 0xB8
      };
      if (aluMap[mnemonic]) {
        const src = ops[0].toUpperCase();
        const code = aluMap[mnemonic] | this.regCodes[src];
        const isMem = (src === 'M');
        return { bytes: [code], mc: isMem ? 2 : 1, t: isMem ? 7 : 4 };
      }

      if (mnemonic === 'INR') {
        const r = ops[0].toUpperCase();
        const code = 0x04 | (this.regCodes[r] << 3);
        const isMem = (r === 'M');
        return { bytes: [code], mc: isMem ? 3 : 1, t: isMem ? 10 : 4 };
      }
      if (mnemonic === 'DCR') {
        const r = ops[0].toUpperCase();
        const code = 0x05 | (this.regCodes[r] << 3);
        const isMem = (r === 'M');
        return { bytes: [code], mc: isMem ? 3 : 1, t: isMem ? 10 : 4 };
      }

      if (mnemonic === 'INX') {
        const rp = ops[0].toUpperCase();
        const code = 0x03 | (this.rpCodes[rp] << 4);
        return { bytes: [code], mc: 1, t: 6 };
      }
      if (mnemonic === 'DCX') {
        const rp = ops[0].toUpperCase();
        const code = 0x0B | (this.rpCodes[rp] << 4);
        return { bytes: [code], mc: 1, t: 6 };
      }

      if (mnemonic === 'DAD') {
        const rp = ops[0].toUpperCase();
        const code = 0x09 | (this.rpCodes[rp] << 4);
        return { bytes: [code], mc: 3, t: 10 };
      }

      // Immediate ALU: ADI, SUI, ANI, ORI, XRI, CPI
      const immAlu = { 'ADI': 0xC6, 'ACI': 0xCE, 'SUI': 0xD6, 'ANI': 0xE6, 'ORI': 0xF6, 'XRI': 0xEE, 'CPI': 0xFE };
      if (immAlu[mnemonic]) {
        const data = this.resolveValue(ops[0], symbols) & 0xFF;
        return { bytes: [immAlu[mnemonic], data], mc: 2, t: 7 };
      }

      // Memory Direct: LDA, STA, LHLD, SHLD
      const dirMap = { 'STA': 0x32, 'LDA': 0x3A, 'SHLD': 0x22, 'LHLD': 0x2A };
      if (dirMap[mnemonic]) {
        const target = this.resolveValue(ops[0], symbols);
        return { bytes: [dirMap[mnemonic], target & 0xFF, (target >> 8) & 0xFF], mc: 4, t: 13 };
      }

      // LDAX / STAX
      if (mnemonic === 'LDAX') {
        const code = (ops[0].toUpperCase() === 'B') ? 0x0A : 0x1A;
        return { bytes: [code], mc: 2, t: 7 };
      }
      if (mnemonic === 'STAX') {
        const code = (ops[0].toUpperCase() === 'B') ? 0x02 : 0x12;
        return { bytes: [code], mc: 2, t: 7 };
      }

      // Jumps
      const jumpMap = { 'JMP': 0xC3, 'JNZ': 0xC2, 'JZ': 0xCA, 'JNC': 0xD2, 'JC': 0xDA };
      if (jumpMap[mnemonic]) {
        const target = this.resolveValue(ops[0], symbols);
        return { bytes: [jumpMap[mnemonic], target & 0xFF, (target >> 8) & 0xFF], mc: 3, t: 10 };
      }

      // Stack: PUSH / POP
      if (mnemonic === 'PUSH') {
        const rp = ops[0].toUpperCase();
        const code = (rp === 'PSW') ? 0xF5 : (0xC5 | (this.rpCodes[rp] << 4));
        return { bytes: [code], mc: 3, t: 12 };
      }
      if (mnemonic === 'POP') {
        const rp = ops[0].toUpperCase();
        const code = (rp === 'PSW') ? 0xF1 : (0xC1 | (this.rpCodes[rp] << 4));
        return { bytes: [code], mc: 3, t: 10 };
      }

      // I/O Ports: IN / OUT
      if (mnemonic === 'IN') {
        const p = this.resolveValue(ops[0], symbols) & 0xFF;
        return { bytes: [0xDB, p], mc: 3, t: 10 };
      }
      if (mnemonic === 'OUT') {
        const p = this.resolveValue(ops[0], symbols) & 0xFF;
        return { bytes: [0xD3, p], mc: 3, t: 10 };
      }

      throw new Error(`Unrecognized mnemonic: ${mnemonic}`);
    }

    resolveValue(str, symbols) {
      if (!str) return 0;
      const clean = str.trim().toUpperCase();
      if (symbols && symbols[clean] !== undefined) return symbols[clean];
      return this.parseHex(clean);
    }

    parseHex(str) {
      let s = str.trim().toUpperCase();
      if (s.endsWith('H')) s = s.slice(0, -1);
      if (s.startsWith('0X')) s = s.slice(2);
      const val = parseInt(s, 16);
      return isNaN(val) ? 0 : val;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ANIMATED 8085 INTERNAL DATAPATH CANVAS RENDERER
  // ════════════════════════════════════════════════════════════════════════════
  class DatapathCanvasRenderer {
    constructor(canvas, vm) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.vm = vm;

      // Panning & Zooming
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.showGrid = true;

      this.initEvents();
    }

    initEvents() {
      this.canvas.addEventListener('mousedown', (e) => {
        this.isDragging = true;
        this.dragStartX = e.clientX - this.panX;
        this.dragStartY = e.clientY - this.panY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.render();
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
      });

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
        const newZoom = Math.min(Math.max(this.zoom * zoomFactor, 0.4), 3.0);

        this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
        this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;

        const zoomLevelEl = document.getElementById('hud-zoom-level');
        if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(this.zoom * 100)}%`;
        this.render();
      });

      // Keyboard Shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '+' || e.key === '=') this.zoomIn();
        if (e.key === '-' || e.key === '_') this.zoomOut();
        if (e.key === '0') this.resetZoom();
        if (e.key.toLowerCase() === 'g') this.toggleGrid();
        if (e.key.toLowerCase() === 'f') toggleFullscreen();
      });
    }

    zoomIn() {
      this.zoom = Math.min(this.zoom * 1.2, 3.0);
      document.getElementById('hud-zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
      this.render();
    }

    zoomOut() {
      this.zoom = Math.max(this.zoom * 0.8, 0.4);
      document.getElementById('hud-zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
      this.render();
    }

    resetZoom() {
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      document.getElementById('hud-zoom-level').textContent = '100%';
      this.render();
    }

    fitView() {
      this.zoom = 0.95;
      this.panX = 15;
      this.panY = 15;
      document.getElementById('hud-zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
      this.render();
    }

    toggleGrid() {
      this.showGrid = !this.showGrid;
      this.render();
    }

    render() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Deep Obsidian Canvas Background
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, w, h);

      // Transform for Zoom & Pan
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      // Render Subtle Dot Matrix Grid (40px spacing, non-intrusive 12% opacity)
      if (this.showGrid) {
        const dotSpacing = 40;
        const startX = Math.floor((-this.panX / this.zoom) / dotSpacing) * dotSpacing;
        const startY = Math.floor((-this.panY / this.zoom) / dotSpacing) * dotSpacing;
        const endX = startX + (w / this.zoom) + dotSpacing;
        const endY = startY + (h / this.zoom) + dotSpacing;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        for (let x = startX; x < endX; x += dotSpacing) {
          for (let y = startY; y < endY; y += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Main 8085 IC Boundary Box
      this.drawChipFrame(ctx, 40, 30, 780, 440);

      // Draw Subtle Interconnecting Bus Traces (Behind modules)
      this.drawInterconnects(ctx);

      // 1. Control & Timing Unit
      this.drawModule(ctx, 60, 55, 170, 160, 'TIMING & CONTROL');
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`CLK: ${this.vm.CLK ? 'HIGH' : 'LOW'} (3.072 MHz)`, 72, 90);
      ctx.fillText(`ALE: ${this.vm.ALE ? 'HIGH (1)' : 'LOW (0)'}`, 72, 110);
      ctx.fillText(`IO/M#: ${this.vm.IOM}`, 72, 130);
      ctx.fillText(`RD#: ${this.vm.RD} | WR#: ${this.vm.WR}`, 72, 150);
      ctx.fillText(`S1: ${this.vm.S1} | S0: ${this.vm.S0}`, 72, 170);
      ctx.fillText(`INTE: ${this.vm.INTE ? 'ON' : 'OFF'}`, 72, 190);

      // 2. Instruction Register (IR) & Decoder
      this.drawModule(ctx, 60, 235, 170, 95, 'INSTRUCTION DECODER');
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(`IR: 0x${this.vm.hex2(this.vm.IR)} (${this.vm.currentOpcode.toString(16).toUpperCase()}H)`, 72, 275);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Inter';
      ctx.fillText(`${this.vm.currentMCycleType} Cycle &bull; State: T${this.vm.currentTState}`, 72, 305);

      // 3. Central Bidirectional 8-bit Data Bus
      const isBusDataActive = (this.vm.currentTState === 2 || this.vm.currentTState === 3);
      this.drawBus(ctx, 255, 45, 22, 380, 'INTERNAL 8-BIT DATA BUS', isBusDataActive);

      // 4. ALU & Accumulator / Flags Section
      this.drawModule(ctx, 305, 55, 230, 165, 'ARITHMETIC LOGIC UNIT (ALU)');
      const isAluActive = (this.vm.currentOpcode >= 0x80 && this.vm.currentOpcode <= 0xBF) || this.vm.currentOpcode === 0x27;
      // Accumulator [A]
      this.drawRegister(ctx, 318, 85, 95, 45, 'ACCUMULATOR [A]', `0x${this.vm.hex2(this.vm.A)}`, isAluActive);
      // Temp Reg [W/Z]
      this.drawRegister(ctx, 423, 85, 95, 45, 'TEMP [W, Z]', `${this.vm.hex2(this.vm.W)}:${this.vm.hex2(this.vm.Z)}`, false);

      // Flag Register Flip-Flops: S, Z, 0, AC, 0, P, 1, CY
      this.drawFlagsBar(ctx, 318, 142, 204, 46);

      // 5. General-Purpose Register Array (B, C, D, E, H, L, SP, PC)
      this.drawModule(ctx, 560, 55, 235, 275, 'REGISTER ARRAY');
      // B & C
      this.drawRegister(ctx, 575, 85, 95, 40, 'REG B', `0x${this.vm.hex2(this.vm.B)}`, false);
      this.drawRegister(ctx, 680, 85, 95, 40, 'REG C', `0x${this.vm.hex2(this.vm.C)}`, false);
      // D & E
      this.drawRegister(ctx, 575, 135, 95, 40, 'REG D', `0x${this.vm.hex2(this.vm.D)}`, false);
      this.drawRegister(ctx, 680, 135, 95, 40, 'REG E', `0x${this.vm.hex2(this.vm.E)}`, false);
      // H & L (Default Memory Pointer M)
      const isHLActive = (this.vm.currentOpcode & 0x07) === 6 || ((this.vm.currentOpcode >> 3) & 0x07) === 6;
      this.drawRegister(ctx, 575, 185, 95, 40, 'REG H (M)', `0x${this.vm.hex2(this.vm.H)}`, isHLActive);
      this.drawRegister(ctx, 680, 185, 95, 40, 'REG L (M)', `0x${this.vm.hex2(this.vm.L)}`, isHLActive);
      // Stack Pointer (SP)
      this.drawRegister(ctx, 575, 235, 200, 36, 'STACK POINTER [SP]', `0x${this.vm.hex4(this.vm.SP)}`, false);
      // Program Counter (PC)
      const isPcActive = (this.vm.currentTState === 1 || this.vm.currentTState === 4);
      this.drawRegister(ctx, 575, 280, 200, 36, 'PROGRAM COUNTER [PC]', `0x${this.vm.hex4(this.vm.PC)}`, isPcActive);

      // 6. External Demultiplexed Bus & 74LS373 Latch (Bottom Section)
      this.drawDemultiplexingLogic(ctx, 305, 345, 490, 110);

      ctx.restore();
    }

    drawChipFrame(ctx, x, y, w, h) {
      ctx.strokeStyle = '#162238';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#050c18';
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.stroke();

      // Silkscreen Label
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText('INTEL ® 8085AH-2 &bull; 8-BIT MICROPROCESSOR ARCHITECTURE', x + 16, y - 8);
    }

    drawInterconnects(ctx) {
      ctx.strokeStyle = '#141f33';
      ctx.lineWidth = 1.5;

      // Trace: Decoder to Bus
      ctx.beginPath();
      ctx.moveTo(230, 275);
      ctx.lineTo(255, 275);
      ctx.stroke();

      // Trace: ALU to Bus
      ctx.beginPath();
      ctx.moveTo(277, 105);
      ctx.lineTo(305, 105);
      ctx.stroke();

      // Trace: Reg Array to Bus
      ctx.beginPath();
      ctx.moveTo(277, 155);
      ctx.lineTo(560, 155);
      ctx.stroke();

      // Trace: Bus to Latch Demux
      ctx.beginPath();
      ctx.moveTo(266, 425);
      ctx.lineTo(266, 400);
      ctx.lineTo(305, 400);
      ctx.stroke();
    }

    drawModule(ctx, x, y, w, h, title) {
      // Unified Dark Obsidian Surface
      ctx.fillStyle = '#091122';
      ctx.strokeStyle = '#1c2844';
      ctx.lineWidth = 1;
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();

      // Sleek Header Pill
      ctx.fillStyle = '#0f1a30';
      ctx.strokeStyle = '#1a2848';
      ctx.lineWidth = 1;
      const pillW = Math.min(ctx.measureText(title).width + 16, w - 16);
      ctx.roundRect(x + 8, y + 8, pillW, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText(title, x + 14, y + 20);
    }

    drawRegister(ctx, x, y, w, h, label, val, isHighlighted = false) {
      ctx.fillStyle = '#050a16';
      ctx.strokeStyle = isHighlighted ? '#38bdf8' : '#141f33';
      ctx.lineWidth = isHighlighted ? 1.5 : 1;
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = isHighlighted ? '#93c5fd' : '#64748b';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(label, x + 6, y + 13);

      // Value
      ctx.fillStyle = isHighlighted ? '#38bdf8' : '#f8fafc';
      ctx.font = 'bold 13px JetBrains Mono';
      ctx.fillText(val, x + 8, y + 31);
    }

    drawFlagsBar(ctx, x, y, w, h) {
      ctx.fillStyle = '#050a16';
      ctx.strokeStyle = '#141f33';
      ctx.lineWidth = 1;
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.stroke();

      const flagOrder = [
        { k: 'S', val: this.vm.flags.S },
        { k: 'Z', val: this.vm.flags.Z },
        { k: '0', val: 0 },
        { k: 'AC', val: this.vm.flags.AC },
        { k: '0', val: 0 },
        { k: 'P', val: this.vm.flags.P },
        { k: '1', val: 1 },
        { k: 'CY', val: this.vm.flags.CY }
      ];

      const itemW = w / 8;
      flagOrder.forEach((f, idx) => {
        const fx = x + idx * itemW;
        ctx.fillStyle = '#64748b';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(f.k, fx + itemW / 2, y + 13);

        if (f.val) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.fillRect(fx + 2, y + 18, itemW - 4, 18);
          ctx.fillStyle = '#10b981';
        } else {
          ctx.fillStyle = '#475569';
        }
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(f.val.toString(), fx + itemW / 2, y + 32);

        if (idx < 7) {
          ctx.strokeStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(fx + itemW, y + 4);
          ctx.lineTo(fx + itemW, y + h - 4);
          ctx.stroke();
        }
      });
      ctx.textAlign = 'left';
    }

    drawBus(ctx, x, y, w, h, label, isActive = false) {
      ctx.fillStyle = isActive ? 'rgba(56, 189, 248, 0.08)' : '#060d1a';
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = isActive ? '#38bdf8' : '#141f33';
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.strokeRect(x, y, w, h);

      // Draw subtle directional chevrons when bus is active
      if (isActive) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        const spacing = 36;
        for (let py = y + 20; py < y + h - 20; py += spacing) {
          ctx.beginPath();
          ctx.moveTo(x + 5, py);
          ctx.lineTo(x + w / 2, py + 5);
          ctx.lineTo(x + w - 5, py);
          ctx.stroke();
        }
      }

      // Bus Label rotated vertically
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = isActive ? '#7dd3fc' : '#475569';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(label, 0, 3);
      ctx.restore();
    }

    drawDemultiplexingLogic(ctx, x, y, w, h) {
      this.drawModule(ctx, x, y, w, h, 'BUS DEMULTIPLEXING LOGIC &bull; 74LS373 OCTAL LATCH');

      // 74LS373 Latch Box
      const isLatchActive = (this.vm.ALE === 1);
      ctx.fillStyle = '#050a16';
      ctx.strokeStyle = isLatchActive ? '#fbbf24' : '#141f33';
      ctx.lineWidth = isLatchActive ? 1.5 : 1;
      ctx.roundRect(x + 15, y + 32, 155, 64, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLatchActive ? '#fbbf24' : '#94a3b8';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText('74LS373 LATCH', x + 25, y + 50);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`ALE = ${this.vm.ALE ? 'HIGH (1)' : 'LOW (0)'}`, x + 25, y + 64);
      ctx.fillStyle = '#34d399';
      ctx.fillText(`OUT: A0-A7 = 0x${this.vm.hex2(this.vm.latchA0_A7)}`, x + 25, y + 80);

      // High Address Bus A8-A15
      ctx.fillStyle = '#050a16';
      ctx.strokeStyle = '#141f33';
      ctx.lineWidth = 1;
      ctx.roundRect(x + 185, y + 32, 135, 64, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText('ADDR BUS [A15-A8]', x + 195, y + 50);
      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 14px JetBrains Mono';
      ctx.fillText(`0x${this.vm.hex2(this.vm.busA8_A15)}`, x + 195, y + 76);

      // Multiplexed Bus AD7-AD0
      ctx.fillStyle = '#050a16';
      ctx.strokeStyle = '#141f33';
      ctx.lineWidth = 1;
      ctx.roundRect(x + 335, y + 32, 140, 64, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText(`MUX BUS [AD7-AD0]`, x + 345, y + 50);
      ctx.fillStyle = this.vm.adBusMode === 'ADDR' ? '#fbbf24' : '#34d399';
      ctx.font = 'bold 13px JetBrains Mono';
      ctx.fillText(`${this.vm.adBusMode}: 0x${this.vm.hex2(this.vm.busAD0_AD7)}`, x + 345, y + 76);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. REAL-TIME WAVEFORM LOGIC ANALYZER PLOTTER
  // ════════════════════════════════════════════════════════════════════════════
  class WaveformPlotter {
    constructor(canvas, vm) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.vm = vm;
    }

    render() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, w, h);

      const history = this.vm.waveformHistory;
      if (!history || history.length < 2) return;

      const signals = [
        { label: 'CLK', color: '#38bdf8', getVal: (p) => p.clk },
        { label: 'ALE', color: '#fbbf24', getVal: (p) => p.ale },
        { label: 'IO/M#', color: '#f43f5e', getVal: (p) => p.iom },
        { label: 'RD#', color: '#34d399', getVal: (p) => p.rd },
        { label: 'WR#', color: '#a78bfa', getVal: (p) => p.wr }
      ];

      const rowH = 28;
      const startX = 65;
      const stepX = (w - startX - 20) / this.vm.maxWaveformPoints;

      // Draw Signal Traces
      signals.forEach((sig, sIdx) => {
        const baseY = 24 + sIdx * rowH;

        // Label
        ctx.fillStyle = sig.color;
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(sig.label, startX - 8, baseY - 4);

        // Grid guideline
        ctx.strokeStyle = '#091224';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, baseY);
        ctx.lineTo(w - 20, baseY);
        ctx.stroke();

        // Digital Trace
        ctx.strokeStyle = sig.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < history.length; i++) {
          const x = startX + i * stepX;
          const val = sig.getVal(history[i]);
          const y = val ? baseY - 16 : baseY;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevVal = sig.getVal(history[i - 1]);
            const prevY = prevVal ? baseY - 16 : baseY;
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(x + stepX, y);
        }
        ctx.stroke();
      });

      // Bottom Bus Strip: AD0-AD7
      const busY = 24 + signals.length * rowH;
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText('AD0-AD7', startX - 8, busY - 4);

      for (let i = 0; i < history.length; i++) {
        const x = startX + i * stepX;
        ctx.fillStyle = '#050a16';
        ctx.fillRect(x, busY - 16, stepX - 1, 16);
        ctx.strokeStyle = '#141f33';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, busY - 16, stepX - 1, 16);
        ctx.fillStyle = '#34d399';
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(history[i].ad_bus.toString(16).toUpperCase().padStart(2, '0'), x + stepX / 2, busY - 4);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. DYNA-85 HARDWARE TRAINER KEYPAD EMULATOR
  // ════════════════════════════════════════════════════════════════════════════
  class Dyna85TrainerKit {
    constructor(vm, onUpdateCallback) {
      this.vm = vm;
      this.onUpdate = onUpdateCallback;
      this.mode = 'IDLE'; // IDLE, EXMEM_ADDR, EXMEM_DATA, EXREG, GO_ADDR
      this.addrBuffer = '2000';
      this.dataBuffer = '00';
      this.currentAddr = 0x2000;
      this.currentRegIdx = 0;
      this.regList = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'SP', 'PC'];

      this.initEvents();
      this.refreshDisplay();
    }

    initEvents() {
      // Hex Keypad Keys (0-F)
      document.querySelectorAll('.trainer-keypad .t-key[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          sound.playKeyClick();
          this.handleHexKey(btn.getAttribute('data-key'));
        });
      });

      // Command Keys
      document.querySelectorAll('.trainer-keypad .t-key[data-cmd]').forEach(btn => {
        btn.addEventListener('click', () => {
          sound.playKeyClick();
          this.handleCommand(btn.getAttribute('data-cmd'));
        });
      });
    }

    handleHexKey(key) {
      if (this.mode === 'EXMEM_ADDR' || this.mode === 'GO_ADDR') {
        this.addrBuffer = (this.addrBuffer + key).slice(-4);
        this.currentAddr = parseInt(this.addrBuffer, 16) || 0x2000;
      } else if (this.mode === 'EXMEM_DATA') {
        this.dataBuffer = (this.dataBuffer + key).slice(-2);
        // Write byte immediately to RAM
        const byte = parseInt(this.dataBuffer, 16) || 0x00;
        this.vm.memory[this.currentAddr] = byte;
      }
      this.refreshDisplay();
      if (this.onUpdate) this.onUpdate();
    }

    handleCommand(cmd) {
      switch (cmd) {
        case 'RESET':
          this.mode = 'IDLE';
          this.addrBuffer = '2000';
          this.currentAddr = 0x2000;
          this.dataBuffer = this.vm.hex2(this.vm.memory[0x2000]);
          this.vm.halted = false;
          break;

        case 'EXMEM':
          this.mode = 'EXMEM_ADDR';
          break;

        case 'NEXT':
          if (this.mode === 'EXMEM_ADDR') {
            this.mode = 'EXMEM_DATA';
            this.dataBuffer = this.vm.hex2(this.vm.memory[this.currentAddr]);
          } else if (this.mode === 'EXMEM_DATA') {
            this.currentAddr = (this.currentAddr + 1) & 0xFFFF;
            this.addrBuffer = this.vm.hex4(this.currentAddr);
            this.dataBuffer = this.vm.hex2(this.vm.memory[this.currentAddr]);
          }
          break;

        case 'PREV':
          if (this.mode === 'EXMEM_DATA') {
            this.currentAddr = (this.currentAddr - 1) & 0xFFFF;
            this.addrBuffer = this.vm.hex4(this.currentAddr);
            this.dataBuffer = this.vm.hex2(this.vm.memory[this.currentAddr]);
          }
          break;

        case 'EXREG':
          this.mode = 'EXREG';
          this.currentRegIdx = (this.currentRegIdx + 1) % this.regList.length;
          const regName = this.regList[this.currentRegIdx];
          this.addrBuffer = `rEg ${regName}`;
          let rVal = 0;
          if (regName === 'A') rVal = this.vm.A;
          else if (regName === 'B') rVal = this.vm.B;
          else if (regName === 'C') rVal = this.vm.C;
          else if (regName === 'D') rVal = this.vm.D;
          else if (regName === 'E') rVal = this.vm.E;
          else if (regName === 'H') rVal = this.vm.H;
          else if (regName === 'L') rVal = this.vm.L;
          else if (regName === 'SP') rVal = this.vm.SP & 0xFF;
          else if (regName === 'PC') rVal = this.vm.PC & 0xFF;
          this.dataBuffer = this.vm.hex2(rVal);
          break;

        case 'GO':
          this.mode = 'GO_ADDR';
          break;

        case 'EXEC':
          this.vm.PC = this.currentAddr;
          this.vm.halted = false;
          this.mode = 'RUNNING';
          document.getElementById('tled-run').classList.add('lit');
          // Trigger execution
          runExecutionLoop();
          break;

        case 'STEP':
          this.vm.stepInstruction();
          this.addrBuffer = this.vm.hex4(this.vm.PC);
          this.dataBuffer = this.vm.hex2(this.vm.memory[this.vm.PC]);
          break;
      }

      this.refreshDisplay();
      if (this.onUpdate) this.onUpdate();
    }

    refreshDisplay() {
      const segAddr = document.getElementById('seg-addr');
      const segData = document.getElementById('seg-data');
      if (segAddr) segAddr.textContent = this.addrBuffer;
      if (segData) segData.textContent = this.dataBuffer;

      // Status LEDs on trainer
      const ledRun = document.getElementById('tled-run');
      const ledHlt = document.getElementById('tled-hlt');
      if (ledRun) {
        if (this.vm.halted) ledRun.classList.remove('lit');
      }
      if (ledHlt) {
        if (this.vm.halted) ledHlt.classList.add('lit');
        else ledHlt.classList.remove('lit');
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 7. PRE-LOADED LAB EXPERIMENTS & TESTS
  // ════════════════════════════════════════════════════════════════════════════
  const labExperiments = [
    {
      id: 'lab1',
      title: 'Lab 1: 8-Bit Addition with Carry Storage',
      desc: 'Add two 8-bit numbers located at 2050H and 2051H. Store the 8-bit sum at 2052H and carry bit at 2053H.',
      assertions: [
        'MEM[2052H] == (MEM[2050H] + MEM[2051H]) & 0xFF',
        'MEM[2053H] == (MEM[2050H] + MEM[2051H] > 0xFF ? 1 : 0)'
      ],
      setup: (vm) => {
        vm.memory[0x2050] = 0x95;
        vm.memory[0x2051] = 0x8C;
        vm.memory[0x2052] = 0x00;
        vm.memory[0x2053] = 0x00;
      },
      code: `ORG 2000H
LDA 2050H
MOV B, A
LDA 2051H
ADD B
STA 2052H
MVI A, 00H
ADC A
STA 2053H
HLT`,
      verify: (vm) => {
        const sum = (0x95 + 0x8C);
        return vm.memory[0x2052] === (sum & 0xFF) && vm.memory[0x2053] === 1;
      }
    },
    {
      id: 'lab2',
      title: 'Lab 2: 16-Bit Addition using DAD Register Pair',
      desc: 'Perform 16-bit addition of BC (1234H) and DE (2345H) using DAD instruction. Store 16-bit result at 2050H.',
      assertions: [
        'HL == 3579H',
        'MEM[2050H] == 79H and MEM[2051H] == 35H'
      ],
      setup: (vm) => {},
      code: `ORG 2000H
LXI H, 1234H
LXI B, 2345H
DAD B
SHLD 2050H
HLT`,
      verify: (vm) => {
        return vm.HL === 0x3579 && vm.memory[0x2050] === 0x79 && vm.memory[0x2051] === 0x35;
      }
    },
    {
      id: 'lab3',
      title: "Lab 3: 1's and 2's Complement of an 8-Bit Number",
      desc: "Find 1's complement and 2's complement of byte at 2050H (e.g. 55H). Store 1's complement at 2051H and 2's complement at 2052H.",
      assertions: [
        'MEM[2051H] == (~MEM[2050H]) & 0xFF',
        'MEM[2052H] == ((~MEM[2050H]) + 1) & 0xFF'
      ],
      setup: (vm) => {
        vm.memory[0x2050] = 0x55;
      },
      code: `ORG 2000H
LDA 2050H
CMA
STA 2051H
INR A
STA 2052H
HLT`,
      verify: (vm) => {
        return vm.memory[0x2051] === 0xAA && vm.memory[0x2052] === 0xAB;
      }
    },
    {
      id: 'lab4',
      title: 'Lab 4: Block Data Transfer between Memory Regions',
      desc: 'Copy an array of 5 bytes from source (2050H..2054H) to destination (2060H..2064H) using loop counter.',
      assertions: [
        'MEM[2060H..2064H] equals MEM[2050H..2054H]'
      ],
      setup: (vm) => {
        [0x11, 0x22, 0x33, 0x44, 0x55].forEach((b, i) => vm.memory[0x2050 + i] = b);
      },
      code: `ORG 2000H
LXI H, 2050H
LXI D, 2060H
MVI C, 05H
LOOP: MOV A, M
STAX D
INX H
INX D
DCR C
JNZ LOOP
HLT`,
      verify: (vm) => {
        const expected = [0x11, 0x22, 0x33, 0x44, 0x55];
        return expected.every((val, i) => vm.memory[0x2060 + i] === val);
      }
    },
    {
      id: 'lab5',
      title: 'Lab 5: Find Maximum Number in an Array',
      desc: 'Find the largest byte in an array of size 5 located at 2050H. Store maximum value at 2060H.',
      assertions: [
        'MEM[2060H] == 9AH (Maximum element of array [34H, 9AH, 12H, 7FH, 55H])'
      ],
      setup: (vm) => {
        const arr = [0x34, 0x9A, 0x12, 0x7F, 0x55];
        arr.forEach((b, i) => vm.memory[0x2050 + i] = b);
      },
      code: `ORG 2000H
LXI H, 2050H
MVI C, 04H
MOV A, M
LOOP: INX H
CMP M
JNC SKIP
MOV A, M
SKIP: DCR C
JNZ LOOP
STA 2060H
HLT`,
      verify: (vm) => {
        return vm.memory[0x2060] === 0x9A;
      }
    },
    {
      id: 'lab6',
      title: 'Lab 6: Sort Array in Ascending Order (Bubble Sort)',
      desc: 'Sort 4 numbers in ascending order at 2050H..2053H using two nested loops.',
      assertions: [
        'MEM[2050H..2053H] sorted in non-decreasing order'
      ],
      setup: (vm) => {
        [0x45, 0x12, 0x89, 0x23].forEach((b, i) => vm.memory[0x2050 + i] = b);
      },
      code: `ORG 2000H
MVI B, 03H
OUTER: LXI H, 2050H
MOV C, B
INNER: MOV A, M
INX H
CMP M
JC NOSWAP
MOV D, M
MOV M, A
DCX H
MOV M, D
INX H
NOSWAP: DCR C
JNZ INNER
DCR B
JNZ OUTER
HLT`,
      verify: (vm) => {
        return vm.memory[0x2050] === 0x12 &&
               vm.memory[0x2051] === 0x23 &&
               vm.memory[0x2052] === 0x45 &&
               vm.memory[0x2053] === 0x89;
      }
    },
    {
      id: 'lab7',
      title: 'Lab 7: BCD Addition with DAA',
      desc: 'Add two packed BCD numbers 38H and 45H. Adjust with DAA and store result (83H) at 2050H.',
      assertions: [
        'A == 83H',
        'MEM[2050H] == 83H'
      ],
      setup: (vm) => {},
      code: `ORG 2000H
MVI A, 38H
MVI B, 45H
ADD B
DAA
STA 2050H
HLT`,
      verify: (vm) => {
        return vm.A === 0x83 && vm.memory[0x2050] === 0x83;
      }
    },
    {
      id: 'lab8',
      title: 'Lab 8: Peripheral I/O Interfacing (IN 00H -> OUT 01H)',
      desc: 'Read byte from input Port 00H (DIP switches), rotate left through carry (RLC), and write to Port 01H (LEDs).',
      assertions: [
        'Port 01H == (Port 00H rotated left by 1 bit)'
      ],
      setup: (vm) => {
        vm.ports[0x00] = 0x55; // 01010101b -> rotated becomes 10101010b = 0xAA
      },
      code: `ORG 2000H
IN 00H
RLC
OUT 01H
HLT`,
      verify: (vm) => {
        return vm.ports[0x01] === 0xAA;
      }
    }
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // 8. 10-QUESTION CERTIFICATION QUIZ DATA
  // ════════════════════════════════════════════════════════════════════════════
  const quizQuestions = [
    {
      q: 'Which signal in the 8085 is pulsed HIGH during the T1 clock state to demultiplex the address/data bus (AD0–AD7)?',
      options: ['IO/M#', 'ALE (Address Latch Enable)', 'RD#', 'READY'],
      answer: 1,
      explanation: 'ALE pulses HIGH during the $T_1$ state. The external 74LS373 latch captures the lower address bits $A_0-A_7$ on the falling edge of ALE.'
    },
    {
      q: 'What are the status signals (IO/M#, S1, S0) during the Opcode Fetch machine cycle of an 8085 instruction?',
      options: ['IO/M# = 0, S1 = 1, S0 = 1', 'IO/M# = 0, S1 = 1, S0 = 0', 'IO/M# = 1, S1 = 1, S0 = 1', 'IO/M# = 0, S1 = 0, S0 = 1'],
      answer: 0,
      explanation: 'Opcode Fetch is characterized by $IO/\\overline{M} = 0$ (Memory), $S_1 = 1$, and $S_0 = 1$.'
    },
    {
      q: 'Which 8085 hardware interrupt is strictly Non-Maskable and vectors directly to memory location 0024H?',
      options: ['RST 7.5', 'INTR', 'TRAP', 'RST 5.5'],
      answer: 2,
      explanation: 'TRAP is the highest priority non-maskable interrupt in the 8085 with fixed vector address $0024\\text{H}$.'
    },
    {
      q: 'If Accumulator contains 38H and Register B contains 45H, what is the value of Accumulator after executing ADD B followed by DAA?',
      options: ['7DH', '83H', '73H', '93H'],
      answer: 1,
      explanation: 'Binary sum: $38\\text{H} + 45\\text{H} = 7D\\text{H}$. Since lower nibble $D > 9$, DAA adds $06\\text{H}$: $7D\\text{H} + 06\\text{H} = 83\\text{H}$ (BCD 83).'
    },
    {
      q: 'What is the total number of T-states required to execute the instruction LXI H, 2050H?',
      options: ['4 T-states', '7 T-states', '10 T-states', '13 T-states'],
      answer: 2,
      explanation: 'LXI rp, d16 consists of 3 machine cycles: Opcode Fetch (4T) + Memory Read (3T) + Memory Read (3T) = $10$ T-states.'
    },
    {
      q: 'Which register pair in 8085 functions as the default memory pointer "M"?',
      options: ['BC Pair', 'DE Pair', 'HL Pair', 'PSW Pair'],
      answer: 2,
      explanation: 'The HL register pair holds the 16-bit address for any instruction referencing operand $M = \\text{MEM}[HL]$.'
    },
    {
      q: 'What happens to the Stack Pointer (SP) during a PUSH B instruction?',
      options: ['SP decrements by 2', 'SP increments by 2', 'SP decrements by 1', 'SP remains unchanged'],
      answer: 0,
      explanation: 'PUSH decrements SP twice: higher byte (B) stored at $\\text{SP}-1$, lower byte (C) stored at $\\text{SP}-2$.'
    },
    {
      q: 'What is the condition of the Parity Flag (P) after an arithmetic or logical instruction producing 05H (00000101b)?',
      options: ['P = 1 (Odd Parity)', 'P = 1 (Even Parity)', 'P = 0 (Odd Parity)', 'P is unaffected'],
      answer: 2,
      explanation: 'The byte $05\\text{H}$ contains two 1-bits (even number of 1s). In the 8085, the Parity flag is $1$ for EVEN parity and $0$ for ODD parity. Here count is 2 (even), so $P = 1$.'
    },
    {
      q: 'Which instruction copies the contents of DE register pair into HL register pair without affecting any flags?',
      options: ['MOV H, D', 'XCHG', 'SPHL', 'DAD D'],
      answer: 1,
      explanation: 'XCHG exchanges the contents of HL with DE in 1 machine cycle (4T) without modifying any status flags.'
    },
    {
      q: 'How many address lines does the 8085 microprocessor have, and what is its maximum addressable physical memory capacity?',
      options: ['8 address lines, 256 Bytes', '16 address lines, 64 KB', '20 address lines, 1 MB', '32 address lines, 4 GB'],
      answer: 1,
      explanation: 'The 8085 features 16 address lines ($A_0-A_{15}$), capable of directly addressing $2^{16} = 65,536\\text{ bytes} = 64\\text{ KB}$ of memory.'
    }
  ];

  // Fix question 8 correct index: 05H has 2 ones, so Even Parity -> P=1 (Option index 1).
  quizQuestions[7].answer = 1;

  // ════════════════════════════════════════════════════════════════════════════
  // 9. THREE.JS 3D MODEL WORKBENCH
  // ════════════════════════════════════════════════════════════════════════════
  function initThree3DModel() {
    if (window.three3DInitialized) return;
    window.three3DInitialized = true;

    const canvas = document.getElementById('sim3d-canvas');
    const compAside = document.getElementById('sim3d-components');
    if (!canvas || !compAside) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020712);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(4.5, 4.0, 5.0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(8, 15, 10);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-8, -5, -8);
    scene.add(dirLight2);

    // Procedural PCB Trainer Board
    const boardGroup = new THREE.Group();

    // 1. PCB Base Plate
    const pcbGeo = new THREE.BoxGeometry(6.5, 0.15, 5.0);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Dark Matte Green Solder Mask
      roughness: 0.3,
      metalness: 0.2
    });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.name = 'FR-4 Glass Epoxy PCB Board';
    boardGroup.add(pcbMesh);

    // 2. Intel 8085 DIP-40 IC Package
    const icGeo = new THREE.BoxGeometry(2.4, 0.2, 0.9);
    const icMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Black Ceramic/Epoxy
      roughness: 0.5,
      metalness: 0.3
    });
    const ic8085 = new THREE.Mesh(icGeo, icMat);
    ic8085.position.set(-1.2, 0.15, 0.8);
    ic8085.name = 'Intel 8085AH-2 (DIP-40 Microprocessor)';
    boardGroup.add(ic8085);

    // Metallic Pins for 8085 (20 on each side)
    const pinGeo = new THREE.BoxGeometry(0.04, 0.18, 0.15);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 20; i++) {
      const px = -2.25 + i * 0.11;
      const pin1 = new THREE.Mesh(pinGeo, pinMat);
      pin1.position.set(px, 0.08, 0.3);
      ic8085.add(pin1);
      const pin2 = new THREE.Mesh(pinGeo, pinMat);
      pin2.position.set(px, 0.08, -0.3);
      ic8085.add(pin2);
    }

    // 3. Intel 8255 PPI Chip
    const ppiMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 0.85), icMat.clone());
    ppiMesh.position.set(-1.2, 0.15, -1.0);
    ppiMesh.name = 'Intel 8255A Programmable Peripheral Interface';
    boardGroup.add(ppiMesh);

    // 4. 74LS373 Octal Latch
    const latchMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.6), icMat.clone());
    latchMesh.position.set(0.6, 0.14, 0.8);
    latchMesh.name = '74LS373 Octal Transparent Latch (ALE Demux)';
    boardGroup.add(latchMesh);

    // 5. Quartz Crystal Oscillator (6.144 MHz)
    const xtalGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16);
    const xtalMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.95, roughness: 0.1 });
    const xtalMesh = new THREE.Mesh(xtalGeo, xtalMat);
    xtalMesh.rotation.z = Math.PI / 2;
    xtalMesh.position.set(-2.6, 0.2, 1.6);
    xtalMesh.name = '6.144 MHz Quartz Crystal Oscillator';
    boardGroup.add(xtalMesh);

    // 6. 7-Segment Red LED Displays (Address & Data)
    const segMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.2 });
    for (let s = 0; s < 6; s++) {
      const segMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.5), segMat);
      segMesh.position.set(0.8 + s * 0.38, 0.16, -1.5);
      segMesh.name = `7-Segment LED Digit ${s + 1}`;
      boardGroup.add(segMesh);
    }

    // 7. Tactile Hex Keypad Buttons
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.16, 16), btnMat);
        btn.position.set(1.1 + c * 0.42, 0.15, 0.2 + r * 0.45);
        btn.name = `Tactile Key [${r},${c}]`;
        boardGroup.add(btn);
      }
    }

    scene.add(boardGroup);

    // Build Component Sidebar
    const components = [
      { name: 'Intel 8085AH-2 CPU', desc: '40-Pin DIP NMOS 8-bit Microprocessor. 3.072 MHz clock, 16-bit address bus.' },
      { name: '74LS373 Octal Latch', desc: 'Demultiplexes lower 8-bit address (A0–A7) from AD0–AD7 via ALE pulse.' },
      { name: 'Intel 8255A PPI', desc: 'Programmable Peripheral Interface offering 24 I/O pins (Ports A, B, C).' },
      { name: '6.144 MHz Crystal', desc: 'Provides master timing. 8085 divides by 2 internally for 3.072 MHz operating clock.' },
      { name: '6-Digit 7-Segment LEDs', desc: 'Displays 4-digit hexadecimal address and 2-digit data byte.' },
      { name: '28-Key Matrix Keypad', desc: 'Hexadecimal keys 0–F plus command keys (RESET, EXMEM, NEXT, GO, EXEC).' }
    ];

    compAside.innerHTML = '';
    components.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = `sim3d-comp ${idx === 0 ? 'active' : ''}`;
      btn.innerHTML = `<strong>${c.name}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${c.desc}</span>`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sim3d-comp').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Pulse 8085 IC highlight
        ic8085.material.color.setHex(0x38bdf8);
        setTimeout(() => ic8085.material.color.setHex(0x111827), 400);
      });
      compAside.appendChild(btn);
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 10. SYSTEM APPLICATION ORCHESTRATION & DOM BINDINGS
  // ════════════════════════════════════════════════════════════════════════════
  const vm = new Intel8085VM();
  const assembler = new Assembler8085();

  let canvasRenderer = null;
  let waveformPlotter = null;
  let trainerKit = null;
  let runTimer = null;
  let currentLabIdx = 0;
  let passedLabsCount = 0;

  function initApp() {
    const mpCanvas = document.getElementById('mp-canvas');
    const waveCanvas = document.getElementById('waveform-canvas');

    if (mpCanvas) canvasRenderer = new DatapathCanvasRenderer(mpCanvas, vm);
    if (waveCanvas) waveformPlotter = new WaveformPlotter(waveCanvas, vm);

    trainerKit = new Dyna85TrainerKit(vm, () => {
      syncUI();
    });

    setupPlatformModeTabs();
    setupExecutionToolbar();
    setupIDEAndSamples();
    setupPeripherals();
    setupRAMHexEditor();
    setupLabChallengeEngine();
    setupQuizAssessment();
    setupFullscreenControls();

    // Load initial sample
    loadSampleCode('add_8bit');
    assembleAndLoad();
    syncUI();
  }

  // Platform Navigation Mode Tabs
  function setupPlatformModeTabs() {
    const tabs = document.querySelectorAll('#mode-tabs .pill');
    const wrappers = {
      'simulate': document.getElementById('sim-wrapper'),
      '3d-model': document.getElementById('model3d-wrapper'),
      'explore': document.getElementById('explore-wrapper'),
      'quiz': document.getElementById('quiz-wrapper')
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode');

        Object.keys(wrappers).forEach(k => {
          if (wrappers[k]) {
            if (k === mode) wrappers[k].classList.remove('hidden');
            else wrappers[k].classList.add('hidden');
          }
        });

        if (mode === '3d-model') {
          initThree3DModel();
        } else if (mode === 'explore') {
          if (window.renderMathInElement && window.katex) {
            window.renderMathInElement(document.getElementById('explore-wrapper'));
          }
        }
      });
    });

    // Sound toggle button
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isEnabled = sound.toggle();
        soundBtn.textContent = isEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      });
    }
  }

  // Execution Toolbar
  function setupExecutionToolbar() {
    const btnAsm = document.getElementById('btn-asm-load');
    const btnStepInst = document.getElementById('btn-step-inst');
    const btnStepMCycle = document.getElementById('btn-step-mcycle');
    const btnStepTState = document.getElementById('btn-step-tstate');
    const btnRun = document.getElementById('btn-run');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');

    btnAsm.addEventListener('click', () => {
      assembleAndLoad();
      sound.playKeyClick();
    });

    btnStepInst.addEventListener('click', () => {
      vm.stepInstruction();
      syncUI();
      sound.playKeyClick();
    });

    btnStepMCycle.addEventListener('click', () => {
      vm.stepMCycle();
      syncUI();
      sound.playKeyClick();
    });

    btnStepTState.addEventListener('click', () => {
      vm.stepTState();
      syncUI();
    });

    btnRun.addEventListener('click', () => {
      btnRun.classList.add('hidden');
      btnPause.classList.remove('hidden');
      runExecutionLoop();
    });

    btnPause.addEventListener('click', () => {
      stopExecutionLoop();
      btnPause.classList.add('hidden');
      btnRun.classList.remove('hidden');
    });

    btnReset.addEventListener('click', () => {
      stopExecutionLoop();
      vm.reset();
      syncUI();
      sound.playKeyClick();
    });

    speedSlider.addEventListener('input', () => {
      speedVal.textContent = `${speedSlider.value} Hz`;
      if (runTimer) {
        stopExecutionLoop();
        runExecutionLoop();
      }
    });

    // Sub-workbench tabs (Waveforms vs Peripherals)
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-subtab');
        document.getElementById('subtab-waveforms').classList.toggle('hidden', tab !== 'waveforms');
        document.getElementById('subtab-peripherals').classList.toggle('hidden', tab !== 'peripherals');
      });
    });

    // Right Deck Tabs (IDE vs Trainer vs RAM)
    document.querySelectorAll('.deck-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.deck-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        document.getElementById('tab-ide').classList.toggle('hidden', target !== 'ide');
        document.getElementById('tab-trainer').classList.toggle('hidden', target !== 'trainer');
        document.getElementById('tab-ram').classList.toggle('hidden', target !== 'ram');
        if (target === 'ram') renderRAMHexTable();
      });
    });

    // Clear console button
    document.getElementById('btn-clear-log').addEventListener('click', () => {
      document.getElementById('console-log').innerHTML = '&gt; Log cleared.';
    });
  }

  function runExecutionLoop() {
    const speed = parseInt(document.getElementById('speed-slider').value, 10) || 10;
    const intervalMs = Math.max(10, Math.floor(1000 / speed));

    stopExecutionLoop();
    runTimer = setInterval(() => {
      if (vm.halted || vm.breakpoints.has(vm.PC)) {
        stopExecutionLoop();
        document.getElementById('btn-pause').classList.add('hidden');
        document.getElementById('btn-run').classList.remove('hidden');
        syncUI();
        return;
      }
      vm.stepInstruction();
      syncUI();
    }, intervalMs);
  }

  function stopExecutionLoop() {
    if (runTimer) {
      clearInterval(runTimer);
      runTimer = null;
    }
  }

  // Assembly IDE & Samples
  function setupIDEAndSamples() {
    const editor = document.getElementById('asm-editor');
    const lineNumbers = document.getElementById('editor-line-numbers');
    const sampleSelect = document.getElementById('sample-select');

    function updateLineNumbers() {
      const lineCount = editor.value.split('\n').length;
      let nums = '';
      for (let i = 1; i <= Math.max(lineCount, 12); i++) nums += `${i}<br>`;
      lineNumbers.innerHTML = nums;
    }

    editor.addEventListener('input', updateLineNumbers);
    editor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = editor.scrollTop;
    });

    sampleSelect.addEventListener('change', () => {
      loadSampleCode(sampleSelect.value);
      assembleAndLoad();
    });

    document.getElementById('btn-format-asm').addEventListener('click', () => {
      editor.value = editor.value.split('\n').map(l => l.trim()).join('\n');
      updateLineNumbers();
    });
  }

  function loadSampleCode(sampleId) {
    const sample = labExperiments.find(l => l.id === sampleId) || labExperiments[0];
    const editor = document.getElementById('asm-editor');
    editor.value = sample.code;
    const lineCount = editor.value.split('\n').length;
    let nums = '';
    for (let i = 1; i <= Math.max(lineCount, 12); i++) nums += `${i}<br>`;
    document.getElementById('editor-line-numbers').innerHTML = nums;
  }

  function assembleAndLoad() {
    const code = document.getElementById('asm-editor').value;
    const res = assembler.assemble(code);
    const statusEl = document.getElementById('asm-status');
    const errEl = document.getElementById('asm-error');

    if (res.error) {
      errEl.textContent = res.error;
      statusEl.textContent = 'Assembly Failed.';
      return false;
    }

    errEl.textContent = '';
    let totalBytes = 0;
    // Load bytes into 64KB RAM
    for (const item of res.binaryMap) {
      item.bytes.forEach((b, idx) => {
        vm.memory[item.addr + idx] = b;
        totalBytes++;
      });
    }

    statusEl.textContent = `Bytes: ${totalBytes} | Start: 2000H`;
    renderDisassemblyTable(res.disasmRecords);
    renderRAMHexTable();
    return true;
  }

  function renderDisassemblyTable(records) {
    const listEl = document.getElementById('disasm-list');
    listEl.innerHTML = '';

    records.forEach(r => {
      const row = document.createElement('div');
      row.className = `disasm-row ${vm.PC === r.addr ? 'pc-active' : ''}`;
      row.id = `disasm-addr-${r.addr}`;

      const bp = document.createElement('div');
      bp.className = `bp-dot ${vm.breakpoints.has(r.addr) ? 'set' : ''}`;
      bp.addEventListener('click', () => {
        if (vm.breakpoints.has(r.addr)) vm.breakpoints.delete(r.addr);
        else vm.breakpoints.add(r.addr);
        bp.classList.toggle('set', vm.breakpoints.has(r.addr));
      });

      const addrSpan = document.createElement('span');
      addrSpan.textContent = vm.hex4(r.addr);

      const hexSpan = document.createElement('span');
      hexSpan.textContent = r.bytes.map(b => vm.hex2(b)).join(' ');

      const mnemSpan = document.createElement('span');
      mnemSpan.textContent = r.mnemonic;

      const mcSpan = document.createElement('span');
      mcSpan.textContent = `${r.mc}M`;

      const tSpan = document.createElement('span');
      tSpan.textContent = `${r.t}T`;

      row.appendChild(bp);
      row.appendChild(addrSpan);
      row.appendChild(hexSpan);
      row.appendChild(mnemSpan);
      row.appendChild(mcSpan);
      row.appendChild(tSpan);
      listEl.appendChild(row);
    });
  }

  // Peripheral I/O Rack
  function setupPeripherals() {
    // Port 00H DIP Switches
    document.querySelectorAll('.dip-rocker').forEach(rocker => {
      rocker.addEventListener('click', () => {
        sound.playKeyClick();
        rocker.classList.toggle('on');
        const bit = parseInt(rocker.getAttribute('data-bit'), 10);
        const isOn = rocker.classList.contains('on');
        rocker.nextElementSibling.textContent = isOn ? '1' : '0';

        if (isOn) vm.ports[0x00] |= (1 << bit);
        else vm.ports[0x00] &= ~(1 << bit);

        document.getElementById('port00-hex').textContent = `${vm.hex2(vm.ports[0x00])}H`;
      });
    });

    // Hardware Interrupt Triggers
    document.getElementById('btn-trap').addEventListener('click', () => {
      vm.log('TRAP Signal Received -> Vectoring to 0024H.');
      vm.pushWord(vm.PC);
      vm.PC = 0x0024;
      syncUI();
    });
    document.getElementById('btn-rst75').addEventListener('click', () => {
      vm.log('RST 7.5 Signal Received -> Vectoring to 003CH.');
      vm.pushWord(vm.PC);
      vm.PC = 0x003C;
      syncUI();
    });
    document.getElementById('btn-rst65').addEventListener('click', () => {
      vm.log('RST 6.5 Signal Received -> Vectoring to 0034H.');
      vm.pushWord(vm.PC);
      vm.PC = 0x0034;
      syncUI();
    });
    document.getElementById('btn-rst55').addEventListener('click', () => {
      vm.log('RST 5.5 Signal Received -> Vectoring to 002CH.');
      vm.pushWord(vm.PC);
      vm.PC = 0x002C;
      syncUI();
    });
    document.getElementById('btn-intr-pin').addEventListener('click', () => {
      vm.log('INTR Pin Asserted -> Vectoring to 0038H.');
      vm.pushWord(vm.PC);
      vm.PC = 0x0038;
      syncUI();
    });
    document.getElementById('btn-reset-in').addEventListener('click', () => {
      vm.log('RESET IN Pin Driven LOW -> Complete 8085 Hardware Reset.');
      vm.reset();
      syncUI();
    });
  }

  // 64KB Hex RAM Editor
  function setupRAMHexEditor() {
    document.querySelectorAll('.btn-jump').forEach(btn => {
      btn.addEventListener('click', () => {
        const addr = btn.getAttribute('data-addr');
        if (addr) jumpRAMToAddress(parseInt(addr, 16));
      });
    });

    document.getElementById('btn-ram-goto').addEventListener('click', () => {
      const input = document.getElementById('ram-goto-input');
      const val = parseInt(input.value, 16);
      if (!isNaN(val)) jumpRAMToAddress(val);
    });
  }

  function jumpRAMToAddress(addr) {
    const row = Math.floor(addr / 16);
    renderRAMHexTable(row * 16);
  }

  function renderRAMHexTable(startAddr = 0x2000) {
    const tbody = document.getElementById('ram-hex-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const numRows = 24;
    for (let r = 0; r < numRows; r++) {
      const rowAddr = (startAddr + r * 16) & 0xFFFF;
      const tr = document.createElement('tr');

      const thAddr = document.createElement('td');
      thAddr.className = 'addr-cell';
      thAddr.textContent = vm.hex4(rowAddr);
      tr.appendChild(thAddr);

      for (let c = 0; c < 16; c++) {
        const cellAddr = (rowAddr + c) & 0xFFFF;
        const val = vm.memory[cellAddr];
        const td = document.createElement('td');
        td.className = `byte-cell ${val !== 0 ? 'nonzero' : ''} ${cellAddr === vm.PC ? 'pc-pos' : ''} ${cellAddr === vm.SP ? 'sp-pos' : ''}`;
        td.textContent = vm.hex2(val);
        td.title = `Address: ${vm.hex4(cellAddr)}H`;

        td.addEventListener('dblclick', () => {
          const newVal = prompt(`Enter new Hex byte for ${vm.hex4(cellAddr)}H:`, vm.hex2(val));
          if (newVal !== null) {
            const parsed = parseInt(newVal, 16);
            if (!isNaN(parsed)) {
              vm.memory[cellAddr] = parsed & 0xFF;
              renderRAMHexTable(startAddr);
              syncUI();
            }
          }
        });

        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  // 8-Lab Progressive Challenge Engine
  function setupLabChallengeEngine() {
    const select = document.getElementById('lab-select');
    const descBox = document.getElementById('lab-desc-box');
    const btnLoad = document.getElementById('btn-load-lab');
    const btnVerify = document.getElementById('btn-verify-lab');

    function updateLabView() {
      const lab = labExperiments[currentLabIdx];
      let assertHtml = '<ul class="lab-assertions-list">';
      lab.assertions.forEach(a => assertHtml += `<li>&bull; ${a}</li>`);
      assertHtml += '</ul>';

      descBox.innerHTML = `<strong>Objective:</strong> ${lab.desc}<br><strong>Verification Assertions:</strong>${assertHtml}`;
      document.getElementById('lab-status-result').textContent = '';
    }

    select.addEventListener('change', () => {
      currentLabIdx = select.selectedIndex;
      updateLabView();
    });

    btnLoad.addEventListener('click', () => {
      const lab = labExperiments[currentLabIdx];
      document.getElementById('asm-editor').value = lab.code;
      assembleAndLoad();
      lab.setup(vm);
      syncUI();
      vm.log(`Loaded ${lab.title}. Initial test vector written to RAM.`);
      sound.playKeyClick();
    });

    btnVerify.addEventListener('click', () => {
      const lab = labExperiments[currentLabIdx];
      // Reset CPU, setup lab vector, and run until HLT
      vm.PC = 0x2000;
      vm.halted = false;
      lab.setup(vm);

      let steps = 0;
      while (!vm.halted && steps < 500) {
        vm.stepInstruction();
        steps++;
      }

      const passed = lab.verify(vm);
      const resEl = document.getElementById('lab-status-result');
      if (passed) {
        resEl.className = 'lab-status-result pass';
        resEl.innerHTML = '&#10004; PASSED ALL ASSERTIONS! (+100 XP)';
        passedLabsCount = Math.min(passedLabsCount + 1, 8);
        document.getElementById('lab-score-badge').textContent = `Mastery: ${passedLabsCount} / 8 Passed`;
        sound.playSuccessChord();
      } else {
        resEl.className = 'lab-status-result fail';
        resEl.innerHTML = '&#10006; FAILED: Output in RAM does not match assertions.';
        sound.playHaltTone();
      }
      syncUI();
    });

    updateLabView();
  }

  // 10-Question Certification Quiz
  function setupQuizAssessment() {
    const listEl = document.getElementById('quiz-questions-list');
    listEl.innerHTML = '';

    quizQuestions.forEach((q, qIdx) => {
      const card = document.createElement('div');
      card.className = 'quiz-q-card';

      const title = document.createElement('div');
      title.className = 'quiz-q-title';
      title.innerHTML = `Q${qIdx + 1}. ${q.q}`;
      card.appendChild(title);

      const optsDiv = document.createElement('div');
      optsDiv.className = 'quiz-options';

      q.options.forEach((opt, oIdx) => {
        const label = document.createElement('label');
        label.className = 'quiz-opt-label';
        label.innerHTML = `
          <input type="radio" name="q_${qIdx}" value="${oIdx}">
          <span>${opt}</span>
        `;
        optsDiv.appendChild(label);
      });
      card.appendChild(optsDiv);

      const expDiv = document.createElement('div');
      expDiv.className = 'quiz-explanation hidden';
      expDiv.id = `q_exp_${qIdx}`;
      expDiv.innerHTML = `<strong>Pedagogical Explanation:</strong> ${q.explanation}`;
      card.appendChild(expDiv);

      listEl.appendChild(card);
    });

    document.getElementById('btn-submit-quiz').addEventListener('click', () => {
      let score = 0;
      quizQuestions.forEach((q, qIdx) => {
        const selected = document.querySelector(`input[name="q_${qIdx}"]:checked`);
        const expEl = document.getElementById(`q_exp_${qIdx}`);
        expEl.classList.remove('hidden');

        if (selected && parseInt(selected.value, 10) === q.answer) {
          score++;
          expEl.style.borderLeftColor = '#10b981';
        } else {
          expEl.style.borderLeftColor = '#f43f5e';
        }
      });

      document.getElementById('quiz-score-display').textContent = `${score} / ${quizQuestions.length}`;
      if (score === quizQuestions.length) {
        document.getElementById('quiz-certificate-card').classList.remove('hidden');
        sound.playSuccessChord();
      } else {
        sound.playKeyClick();
      }
    });

    document.getElementById('btn-reset-quiz').addEventListener('click', () => {
      document.querySelectorAll('#quiz-questions-list input[type="radio"]').forEach(r => r.checked = false);
      document.querySelectorAll('.quiz-explanation').forEach(e => e.classList.add('hidden'));
      document.getElementById('quiz-score-display').textContent = `0 / ${quizQuestions.length}`;
      document.getElementById('quiz-certificate-card').classList.add('hidden');
    });
  }

  // Fullscreen Facility
  function setupFullscreenControls() {
    const btnFullscreen = document.getElementById('btn-fullscreen');
    btnFullscreen.addEventListener('click', toggleFullscreen);

    // Floating HUD button bindings
    document.getElementById('hud-zoom-in').addEventListener('click', () => canvasRenderer.zoomIn());
    document.getElementById('hud-zoom-out').addEventListener('click', () => canvasRenderer.zoomOut());
    document.getElementById('hud-zoom-1').addEventListener('click', () => canvasRenderer.resetZoom());
    document.getElementById('hud-zoom-fit').addEventListener('click', () => canvasRenderer.fitView());
    document.getElementById('hud-grid-toggle').addEventListener('click', () => canvasRenderer.toggleGrid());
  }

  function toggleFullscreen() {
    const card = document.getElementById('canvas-card-container');
    const isFull = card.classList.toggle('is-fullscreen');
    document.getElementById('btn-fullscreen').innerHTML = isFull ? '🗗 Exit Fullscreen' : '⛶ Fullscreen';

    const canvas = document.getElementById('mp-canvas');
    if (isFull) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 50;
    } else {
      canvas.width = 860;
      canvas.height = 500;
    }
    if (canvasRenderer) canvasRenderer.render();
  }

  // Synchronize entire visual interface
  function syncUI() {
    // 1. Status Badges
    document.getElementById('badge-pc').textContent = `PC: ${vm.hex4(vm.PC)}H`;
    document.getElementById('badge-cycle').textContent = `M${vm.currentMCycle}: ${vm.currentMCycleType}`;
    document.getElementById('badge-tstate').textContent = `T${vm.currentTState}`;
    document.getElementById('badge-ale').textContent = `ALE: ${vm.ALE}`;
    document.getElementById('badge-state').textContent = `HALT: ${vm.halted ? 'YES' : 'NO'}`;

    // 2. Hardware Trainer Displays
    trainerKit.refreshDisplay();

    // 3. Output Port 01H LEDs
    const p1 = vm.ports[0x01];
    document.getElementById('port01-hex').textContent = `${vm.hex2(p1)}H`;
    for (let bit = 0; bit < 8; bit++) {
      const led = document.getElementById(`led-${bit}`);
      if (led) {
        if ((p1 >> bit) & 1) led.classList.add('lit');
        else led.classList.remove('lit');
      }
    }

    // 4. Highlight active PC instruction in disassembly
    document.querySelectorAll('.disasm-row').forEach(row => row.classList.remove('pc-active'));
    const activeRow = document.getElementById(`disasm-addr-${vm.PC}`);
    if (activeRow) {
      activeRow.classList.add('pc-active');
      activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // 5. Render Canvas & Waveforms
    if (canvasRenderer) canvasRenderer.render();
    if (waveformPlotter) waveformPlotter.render();
  }

  // Boot Application on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
