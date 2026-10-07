/* ==========================================================================
   16-bit RISC Computer Organization & Architecture (COA) Simulator
   WBSCTE Diploma CST 3rd Semester (CST/3/305) Laboratory Engine
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
          console.warn('AudioContext not available:', e);
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

    tick() {
      this.playTone(850, 'sine', 0.04, 0.4);
    },

    writeBack() {
      // Ascending chord triad (C5, E5, G5)
      if (!this.enabled || !this.ctx) return;
      [523.25, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.12, 0.35), i * 35);
      });
    },

    stall() {
      // Low damped thud
      this.playTone(130, 'square', 0.12, 0.5, 60);
    },

    flush() {
      // Descending tone sweep
      this.playTone(480, 'sawtooth', 0.15, 0.35, 160);
    },

    cacheHit() {
      // Bright dual-frequency chirp
      this.playTone(1200, 'sine', 0.08, 0.4);
      setTimeout(() => this.playTone(1600, 'sine', 0.08, 0.4), 40);
    },

    cacheMiss() {
      // Low buzzing warning chime
      this.playTone(220, 'triangle', 0.18, 0.45, 180);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 2. 16-BIT RISC ISA DEFINITIONS & ASSEMBLER ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  const ISA = {
    // Opcode mapping (4 bits: 0..15)
    OPCODES: {
      ADD:  { code: 0x0, type: 'R', funct: 0x0 },
      SUB:  { code: 0x0, type: 'R', funct: 0x1 },
      AND:  { code: 0x0, type: 'R', funct: 0x2 },
      OR:   { code: 0x0, type: 'R', funct: 0x3 },
      XOR:  { code: 0x0, type: 'R', funct: 0x4 },
      SLT:  { code: 0x0, type: 'R', funct: 0x5 },
      SLL:  { code: 0x0, type: 'R', funct: 0x6 },
      SRL:  { code: 0x0, type: 'R', funct: 0x7 },

      ADDI: { code: 0x1, type: 'I' },
      SUBI: { code: 0x1, type: 'I' },
      LW:   { code: 0x2, type: 'I' },
      SW:   { code: 0x3, type: 'I' },
      BEQ:  { code: 0x4, type: 'I' },

      JMP:  { code: 0x5, type: 'J' },
      JAL:  { code: 0x6, type: 'J' },
      HALT: { code: 0xF, type: 'Special' },
      NOP:  { code: 0xE, type: 'Special' }
    },

    // Register name mapping R0..R7
    parseReg(name) {
      if (!name) return -1;
      const clean = name.trim().toUpperCase().replace(/,$/, '');
      const match = clean.match(/^R([0-7])$/);
      return match ? parseInt(match[1], 10) : -1;
    },

    // Parse signed immediate (dec or hex)
    parseImm(str) {
      if (!str) return 0;
      const clean = str.trim().replace(/,$/, '');
      if (clean.startsWith('0x') || clean.startsWith('0X')) {
        return parseInt(clean, 16);
      }
      return parseInt(clean, 10) || 0;
    },

    // 2-Pass Interactive Assembler
    assemble(sourceText) {
      const lines = sourceText.split('\n');
      const labels = {};
      const parsedInstructions = [];
      const errors = [];

      // Pass 1: Collect labels and strip comments
      let currentAddr = 0;
      lines.forEach((rawLine, lineIdx) => {
        let line = rawLine.split(';')[0].trim();
        if (!line) return;

        // Check for label definition: "LOOP:"
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const lblName = line.slice(0, colonIdx).trim().toUpperCase();
          labels[lblName] = currentAddr;
          line = line.slice(colonIdx + 1).trim();
        }

        if (line) {
          parsedInstructions.push({ lineIdx, raw: line, addr: currentAddr });
          currentAddr++;
        }
      });

      // Pass 2: Encode machine code words (16-bit)
      const compiled = parsedInstructions.map(item => {
        const parts = item.raw.replace(/,/g, ' ').replace(/\(/g, ' ').replace(/\)/g, ' ').split(/\s+/).filter(Boolean);
        let opStr = (parts[0] || '').toUpperCase();
        let opDef = this.OPCODES[opStr];

        if (!opDef) {
          errors.push({ line: item.lineIdx + 1, msg: `Unknown opcode: ${opStr}` });
          return null;
        }

        let machineWord = 0;
        let rd = 0, rs1 = 0, rs2 = 0, imm = 0, target = 0;
        let bitfields = '';

        if (opDef.type === 'R') {
          // Format: OP Rd, Rs1, Rs2
          rd = this.parseReg(parts[1]);
          rs1 = this.parseReg(parts[2]);
          rs2 = this.parseReg(parts[3]);

          // Friendly assembler: if SUB/ADD is used with an immediate as 3rd operand, convert to ADDI
          if (rs2 < 0 && (opStr === 'SUB' || opStr === 'ADD')) {
            const numVal = this.parseImm(parts[3]);
            imm = (opStr === 'SUB' ? -numVal : numVal) & 0x3F;
            machineWord = ((0x1 & 0xF) << 12) | ((rd & 0x7) << 9) | ((rs1 & 0x7) << 6) | imm;
            bitfields = `[ADDI R${rd} R${rs1} Imm:${this.toSigned6(imm)}]`;
            opStr = 'ADDI';
          } else {
            if (rd < 0 || rs1 < 0 || rs2 < 0) {
              errors.push({ line: item.lineIdx + 1, msg: `Invalid register in ${item.raw}` });
            }
            const funct = opDef.funct;
            machineWord = ((opDef.code & 0xF) << 12) | ((rd & 0x7) << 9) | ((rs1 & 0x7) << 6) | ((rs2 & 0x7) << 3) | (funct & 0x7);
            bitfields = `[Op:0 R${rd} R${rs1} R${rs2} F:${funct}]`;
          }

        } else if (opDef.type === 'I') {
          if (opStr === 'ADDI' || opStr === 'SUBI') {
            // ADDI Rd, Rs1, Imm / SUBI Rd, Rs1, Imm
            rd = this.parseReg(parts[1]);
            rs1 = this.parseReg(parts[2]);
            const numVal = this.parseImm(parts[3]);
            imm = (opStr === 'SUBI' ? -numVal : numVal) & 0x3F; // 6-bit immediate
            machineWord = ((0x1 & 0xF) << 12) | ((rd & 0x7) << 9) | ((rs1 & 0x7) << 6) | imm;
            bitfields = `[ADDI R${rd} R${rs1} Imm:${this.toSigned6(imm)}]`;

          } else if (opStr === 'LW' || opStr === 'SW') {
            // LW Rd, offset(Rs1) -> parts: [LW, Rd, offset, Rs1]
            rd = this.parseReg(parts[1]);
            imm = this.parseImm(parts[2]) & 0x3F;
            rs1 = this.parseReg(parts[3]);
            if (rs1 < 0) rs1 = 0; // Default R0
            machineWord = ((opDef.code & 0xF) << 12) | ((rd & 0x7) << 9) | ((rs1 & 0x7) << 6) | imm;
            bitfields = `[${opStr} R${rd} ${this.toSigned6(imm)}(R${rs1})]`;

          } else if (opStr === 'BEQ') {
            // BEQ Rs1, Rs2, Label/Offset
            rs1 = this.parseReg(parts[1]);
            rs2 = this.parseReg(parts[2]);
            const targetToken = (parts[3] || '').toUpperCase();
            if (labels[targetToken] !== undefined) {
              imm = (labels[targetToken] - (item.addr + 1)) & 0x3F;
            } else {
              imm = this.parseImm(targetToken) & 0x3F;
            }
            rd = 0;
            machineWord = ((opDef.code & 0xF) << 12) | ((rs2 & 0x7) << 9) | ((rs1 & 0x7) << 6) | imm;
            bitfields = `[BEQ R${rs1}==R${rs2} &rarr; offset:${this.toSigned6(imm)}]`;
          }

        } else if (opDef.type === 'J') {
          // JMP / JAL Target
          const targetToken = (parts[1] || '').toUpperCase();
          if (labels[targetToken] !== undefined) {
            target = labels[targetToken] & 0xFFF;
          } else {
            target = this.parseImm(targetToken) & 0xFFF;
          }
          machineWord = ((opDef.code & 0xF) << 12) | target;
          bitfields = `[${opStr} Target:0x${target.toString(16).padStart(3, '0')}]`;

        } else {
          // HALT / NOP
          machineWord = (opDef.code & 0xF) << 12;
          bitfields = `[${opStr}]`;
        }

        return {
          addr: item.addr,
          raw: item.raw,
          opStr,
          opDef,
          rd,
          rs1,
          rs2,
          imm: this.toSigned6(imm),
          target,
          machineWord: machineWord & 0xFFFF,
          hexStr: '0x' + (machineWord & 0xFFFF).toString(16).padStart(4, '0').toUpperCase(),
          bitfields
        };
      }).filter(Boolean);

      return { compiled, errors, labels };
    },

    toSigned6(val) {
      val = val & 0x3F;
      return (val & 0x20) ? val - 64 : val;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. CACHE MEMORY HIERARCHY SIMULATOR
  // ══════════════════════════════════════════════════════════════════════════
  class CacheHierarchy {
    constructor() {
      this.mapping = 'direct';   // direct | 2way | fully
      this.capacity = 256;      // bytes
      this.blockSize = 16;      // bytes
      this.policy = 'lru';      // lru | fifo

      this.hits = 0;
      this.misses = 0;
      this.accesses = 0;
      this.stallCycles = 0;
      this.missPenalty = 10;    // cycles
      this.hitTime = 1;         // cycle

      this.sets = [];
      this.reconfigure();
    }

    reconfigure() {
      const numBlocks = Math.max(1, Math.floor(this.capacity / this.blockSize));
      let numSets = numBlocks;
      let waysPerSet = 1;

      if (this.mapping === '2way') {
        waysPerSet = 2;
        numSets = Math.max(1, Math.floor(numBlocks / 2));
      } else if (this.mapping === 'fully') {
        numSets = 1;
        waysPerSet = numBlocks;
      }

      this.numSets = numSets;
      this.ways = waysPerSet;
      this.offsetBits = Math.log2(this.blockSize);
      this.indexBits = Math.log2(numSets);
      this.tagBits = 16 - this.indexBits - this.offsetBits;

      this.sets = [];
      for (let s = 0; s < numSets; s++) {
        const wayList = [];
        for (let w = 0; w < waysPerSet; w++) {
          wayList.push({
            valid: false,
            dirty: false,
            tag: 0,
            data: new Array(this.blockSize).fill(0),
            lruCounter: 0,
            fifoCounter: 0
          });
        }
        this.sets.push(wayList);
      }
    }

    decomposeAddress(addr) {
      addr = addr & 0xFFFF;
      const offsetMask = (1 << this.offsetBits) - 1;
      const offset = addr & offsetMask;

      const indexMask = (1 << this.indexBits) - 1;
      const index = (addr >> this.offsetBits) & indexMask;

      const tag = addr >> (this.offsetBits + this.indexBits);
      return { tag, index, offset };
    }

    access(addr, isWrite = false, writeData = 0) {
      this.accesses++;
      const { tag, index, offset } = this.decomposeAddress(addr);
      const set = this.sets[index] || this.sets[0];
      let hit = false;
      let hitWayIdx = -1;

      for (let w = 0; w < set.length; w++) {
        const line = set[w];
        if (line.valid && line.tag === tag) {
          hit = true;
          hitWayIdx = w;
          break;
        }
      }

      if (hit) {
        this.hits++;
        const line = set[hitWayIdx];
        if (isWrite) {
          line.dirty = true;
          line.data[offset] = writeData & 0xFF;
        }
        line.lruCounter = Date.now();
        SoundFX.cacheHit();
        return { hit: true, setIdx: index, wayIdx: hitWayIdx, tag };
      } else {
        this.misses++;
        this.stallCycles += this.missPenalty;

        // Victim selection
        let victimIdx = 0;
        if (this.policy === 'lru') {
          let oldest = Infinity;
          for (let w = 0; w < set.length; w++) {
            if (!set[w].valid) { victimIdx = w; break; }
            if (set[w].lruCounter < oldest) {
              oldest = set[w].lruCounter;
              victimIdx = w;
            }
          }
        } else {
          // FIFO
          let oldestFifo = Infinity;
          for (let w = 0; w < set.length; w++) {
            if (!set[w].valid) { victimIdx = w; break; }
            if (set[w].fifoCounter < oldestFifo) {
              oldestFifo = set[w].fifoCounter;
              victimIdx = w;
            }
          }
        }

        const vic = set[victimIdx];
        vic.valid = true;
        vic.tag = tag;
        vic.dirty = isWrite;
        vic.lruCounter = Date.now();
        vic.fifoCounter = this.accesses;
        for (let i = 0; i < this.blockSize; i++) {
          vic.data[i] = (addr + i) & 0xFF;
        }

        SoundFX.cacheMiss();
        return { hit: false, setIdx: index, wayIdx: victimIdx, tag };
      }
    }

    getAMAT() {
      if (this.accesses === 0) return this.hitTime;
      const missRate = this.misses / this.accesses;
      return this.hitTime + (missRate * this.missPenalty);
    }

    reset() {
      this.hits = 0;
      this.misses = 0;
      this.accesses = 0;
      this.stallCycles = 0;
      this.reconfigure();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. CORE 5-STAGE PIPELINE & PROCESSOR STATE MACHINE
  // ══════════════════════════════════════════════════════════════════════════
  class RISCProcessor {
    constructor() {
      this.regs = new Array(8).fill(0); // R0..R7
      this.pc = 0;
      this.ir = 0;
      this.mar = 0;
      this.mdr = 0;
      this.flags = { z: 0, n: 0, c: 0, v: 0 };

      // 64 Words Data Memory (Word-Addressable 16-bit)
      this.memory = new Array(64).fill(0);
      this.initMemory();

      this.instructions = [];
      this.clockCycle = 1;
      this.instructionsRetired = 0;
      this.stallsCount = 0;
      this.flushesCount = 0;

      // Hardware Toggles
      this.forwardingEnabled = true;
      this.branchStage = 'id';       // 'id' | 'ex'
      this.branchPredictor = '2bit'; // '2bit' | 'not-taken' | 'taken'
      this.bht = {};                 // Branch History Table (2-bit counters: 0..3)

      // Active Forwarding Lines indicator for canvas
      this.forwardA = 0; // 0=none, 1=MEM/WB, 2=EX/MEM
      this.forwardB = 0;
      this.isLoadUseStall = false;
      this.isBranchFlush = false;

      // Pipeline Registers (Latches)
      this.IF_ID = this.createEmptyLatch();
      this.ID_EX = this.createEmptyLatch();
      this.EX_MEM = this.createEmptyLatch();
      this.MEM_WB = this.createEmptyLatch();

      // Horizontal Execution Ledger
      // Maps instruction index -> { [cycleNum]: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'STALL' }
      this.ledger = [];

      this.cache = new CacheHierarchy();
      this.isRunning = false;
      this.runTimer = null;
    }

    initMemory() {
      for (let i = 0; i < this.memory.length; i++) {
        this.memory[i] = (i * 5) & 0xFFFF;
      }
      this.memory[0] = 10;
      this.memory[1] = 20;
      this.memory[2] = 30;
      this.memory[3] = 40;
    }

    createEmptyLatch() {
      return {
        valid: false,
        isNop: false,
        pc: 0,
        instrIdx: -1,
        instr: null,
        opStr: '',
        rd: 0,
        rs1: 0,
        rs2: 0,
        valA: 0,
        valB: 0,
        imm: 0,
        aluOut: 0,
        memOut: 0,
        regWrite: false,
        memRead: false,
        memWrite: false,
        memToReg: false,
        branch: false,
        target: 0
      };
    }

    loadProgram(assembledList) {
      this.instructions = assembledList || [];
      this.reset();
    }

    reset() {
      this.regs.fill(0);
      this.regs[0] = 0; // R0 hardwired to 0
      this.pc = 0;
      this.ir = 0;
      this.mar = 0;
      this.mdr = 0;
      this.flags = { z: 0, n: 0, c: 0, v: 0 };

      this.clockCycle = 1;
      this.instructionsRetired = 0;
      this.stallsCount = 0;
      this.flushesCount = 0;
      this.forwardA = 0;
      this.forwardB = 0;
      this.isLoadUseStall = false;
      this.isBranchFlush = false;

      this.IF_ID = this.createEmptyLatch();
      this.ID_EX = this.createEmptyLatch();
      this.EX_MEM = this.createEmptyLatch();
      this.MEM_WB = this.createEmptyLatch();

      this.ledger = [];
      this.instructions.forEach(() => this.ledger.push({}));
      this.cache.reset();

      this.stop();
      this.logMicroOp(`[Reset] Processor registers, pipeline latches and cache initialized.`);
    }

    // Single Discrete Clock Pulse (evaluates backwards WB -> MEM -> EX -> ID -> IF)
    clockTick() {
      SoundFX.tick();
      const cc = this.clockCycle;

      // ── STAGE 5: WRITEBACK (WB) ──
      const wb = this.MEM_WB;
      if (wb.valid && !wb.isNop) {
        if (wb.regWrite && wb.rd !== 0) {
          const writeVal = wb.memToReg ? wb.memOut : wb.aluOut;
          this.regs[wb.rd] = writeVal & 0xFFFF;
          this.triggerRegUpdateAnim(wb.rd);
          SoundFX.writeBack();
          this.logMicroOp(`[CC${cc}] WB Stage: Reg[R${wb.rd}] &larr; ${this.toHex4(writeVal)} (${writeVal}).`);
        }
        this.instructionsRetired++;
        if (wb.instrIdx >= 0 && this.ledger[wb.instrIdx]) {
          this.ledger[wb.instrIdx][cc] = 'WB';
        }
      }

      // ── STAGE 4: MEMORY ACCESS (MEM) ──
      const mem = this.EX_MEM;
      const nextWB = this.createEmptyLatch();
      if (mem.valid && !mem.isNop) {
        Object.assign(nextWB, mem);
        if (mem.memRead) {
          const addr = mem.aluOut;
          this.mar = addr;
          this.cache.access(addr, false);
          const readVal = (this.memory[addr % this.memory.length] !== undefined) ? this.memory[addr % this.memory.length] : 0;
          this.mdr = readVal;
          nextWB.memOut = readVal;
          this.logMicroOp(`[CC${cc}] MEM Stage: Read MEM[0x${addr.toString(16)}] &rarr; MDR = ${this.toHex4(readVal)}.`);
        } else if (mem.memWrite) {
          const addr = mem.aluOut;
          this.mar = addr;
          this.mdr = mem.valB;
          this.cache.access(addr, true, mem.valB);
          this.memory[addr % this.memory.length] = mem.valB & 0xFFFF;
          this.logMicroOp(`[CC${cc}] MEM Stage: Write MEM[0x${addr.toString(16)}] &larr; ${this.toHex4(mem.valB)}.`);
        }
        if (mem.instrIdx >= 0 && this.ledger[mem.instrIdx]) {
          this.ledger[mem.instrIdx][cc] = 'MEM';
        }
      }

      // ── STAGE 3: EXECUTE (EX) ──
      const ex = this.ID_EX;
      const nextMEM = this.createEmptyLatch();
      if (ex.valid && !ex.isNop) {
        Object.assign(nextMEM, ex);

        // Forwarding Unit Multiplexer Evaluation
        let operandA = ex.valA;
        let operandB = ex.valB;
        this.forwardA = 0;
        this.forwardB = 0;

        if (this.forwardingEnabled) {
          // Check Forwarding to ALU Input A
          if (this.EX_MEM.valid && this.EX_MEM.regWrite && this.EX_MEM.rd !== 0 && this.EX_MEM.rd === ex.rs1) {
            operandA = this.EX_MEM.aluOut;
            this.forwardA = 2; // EX/MEM -> EX
          } else if (this.MEM_WB.valid && this.MEM_WB.regWrite && this.MEM_WB.rd !== 0 && this.MEM_WB.rd === ex.rs1) {
            operandA = this.MEM_WB.memToReg ? this.MEM_WB.memOut : this.MEM_WB.aluOut;
            this.forwardA = 1; // MEM/WB -> EX
          }

          // Check Forwarding to ALU Input B
          if (!ex.isImmOp) {
            if (this.EX_MEM.valid && this.EX_MEM.regWrite && this.EX_MEM.rd !== 0 && this.EX_MEM.rd === ex.rs2) {
              operandB = this.EX_MEM.aluOut;
              this.forwardB = 2;
            } else if (this.MEM_WB.valid && this.MEM_WB.regWrite && this.MEM_WB.rd !== 0 && this.MEM_WB.rd === ex.rs2) {
              operandB = this.MEM_WB.memToReg ? this.MEM_WB.memOut : this.MEM_WB.aluOut;
              this.forwardB = 1;
            }
          }
        }

        // ALU Operations
        let aluResult = 0;
        const op = ex.opStr;
        const secondVal = ex.isImmOp ? ex.imm : operandB;

        if (op === 'ADD' || op === 'ADDI') {
          aluResult = (operandA + secondVal) & 0xFFFF;
        } else if (op === 'SUB') {
          aluResult = (operandA - secondVal) & 0xFFFF;
        } else if (op === 'AND') {
          aluResult = (operandA & secondVal) & 0xFFFF;
        } else if (op === 'OR') {
          aluResult = (operandA | secondVal) & 0xFFFF;
        } else if (op === 'XOR') {
          aluResult = (operandA ^ secondVal) & 0xFFFF;
        } else if (op === 'SLT') {
          aluResult = (operandA < secondVal) ? 1 : 0;
        } else if (op === 'SLL') {
          aluResult = (operandA << (secondVal & 0xF)) & 0xFFFF;
        } else if (op === 'SRL') {
          aluResult = (operandA >>> (secondVal & 0xF)) & 0xFFFF;
        } else if (op === 'LW' || op === 'SW') {
          aluResult = (operandA + ex.imm) & 0xFFFF; // Address generation
        }

        nextMEM.aluOut = aluResult;
        nextMEM.valB = operandB; // for SW data

        // Update Arithmetic Flags
        this.flags.z = (aluResult === 0) ? 1 : 0;
        this.flags.n = (aluResult & 0x8000) ? 1 : 0;

        if (ex.instrIdx >= 0 && this.ledger[ex.instrIdx]) {
          this.ledger[ex.instrIdx][cc] = 'EX';
        }
        this.logMicroOp(`[CC${cc}] EX Stage: ALU (${op}) ${operandA} &amp; ${secondVal} = ${aluResult}.`);
      }

      // ── STAGE 2: DECODE & HAZARD DETECTION (ID) ──
      const id = this.IF_ID;
      let nextEX = this.createEmptyLatch();
      let stallPipeline = false;
      let branchTaken = false;
      let branchTarget = 0;

      if (id.valid && !id.isNop) {
        const instr = id.instr;
        const opStr = instr.opStr;

        // 1. Load-Use Data Hazard Detection
        if (this.ID_EX.valid && this.ID_EX.memRead) {
          const loadDest = this.ID_EX.rd;
          const needsRs1 = (instr.rs1 === loadDest);
          const needsRs2 = (!instr.opDef.type || instr.opDef.type === 'R' || opStr === 'SW') && (instr.rs2 === loadDest);

          if (needsRs1 || needsRs2) {
            stallPipeline = true;
            this.isLoadUseStall = true;
            this.stallsCount++;
            SoundFX.stall();
            this.logMicroOp(`<span class="term-line-stall">[CC${cc}] HAZARD DETECTED: Load-Use Dependency on R${loadDest}. Inserting NOP bubble into EX stage.</span>`);
          }
        }

        if (!stallPipeline) {
          this.isLoadUseStall = false;
          nextEX.valid = true;
          nextEX.instr = instr;
          nextEX.instrIdx = id.instrIdx;
          nextEX.pc = id.pc;
          nextEX.opStr = opStr;
          nextEX.rd = instr.rd;
          nextEX.rs1 = instr.rs1;
          nextEX.rs2 = instr.rs2;
          nextEX.imm = instr.imm;
          nextEX.valA = this.regs[instr.rs1];
          nextEX.valB = this.regs[instr.rs2];
          nextEX.isImmOp = (opStr === 'ADDI' || opStr === 'LW' || opStr === 'SW');

          // Control signal decoding
          nextEX.regWrite = (opStr === 'ADD' || opStr === 'SUB' || opStr === 'AND' || opStr === 'OR' || opStr === 'XOR' || opStr === 'SLT' || opStr === 'SLL' || opStr === 'SRL' || opStr === 'ADDI' || opStr === 'LW' || opStr === 'JAL');
          nextEX.memRead = (opStr === 'LW');
          nextEX.memWrite = (opStr === 'SW');
          nextEX.memToReg = (opStr === 'LW');

          // Branch resolution in ID stage
          if (opStr === 'BEQ') {
            const cmpValA = (this.forwardA === 2) ? this.EX_MEM.aluOut : this.regs[instr.rs1];
            const cmpValB = (this.forwardB === 2) ? this.EX_MEM.aluOut : this.regs[instr.rs2];
            if (cmpValA === cmpValB) {
              branchTaken = true;
              branchTarget = id.pc + 1 + instr.imm;
            }
          } else if (opStr === 'JMP') {
            branchTaken = true;
            branchTarget = instr.target;
          }

          if (id.instrIdx >= 0 && this.ledger[id.instrIdx]) {
            this.ledger[id.instrIdx][cc] = 'ID';
          }
          this.logMicroOp(`[CC${cc}] ID Stage: Decoded ${instr.raw}. Operands: R${instr.rs1}=${nextEX.valA}, R${instr.rs2}=${nextEX.valB}.`);
        } else {
          // Inject bubble NOP into nextEX
          nextEX = this.createEmptyLatch();
          nextEX.isNop = true;
          if (id.instrIdx >= 0 && this.ledger[id.instrIdx]) {
            this.ledger[id.instrIdx][cc] = 'STALL';
          }
        }
      }

      // ── STAGE 1: INSTRUCTION FETCH (IF) ──
      const nextID = this.createEmptyLatch();
      if (!stallPipeline) {
        if (this.pc < this.instructions.length) {
          const fetchInstr = this.instructions[this.pc];
          this.mar = this.pc;
          this.ir = fetchInstr.machineWord;
          this.mdr = fetchInstr.machineWord;

          nextID.valid = true;
          nextID.instr = fetchInstr;
          nextID.instrIdx = this.pc;
          nextID.pc = this.pc;
          nextID.isNop = false;

          if (this.ledger[this.pc]) {
            this.ledger[this.pc][cc] = 'IF';
          }
          this.logMicroOp(`[CC${cc}] IF Stage: Fetched ${fetchInstr.raw} at PC=0x${this.pc.toString(16)}.`);
          this.pc++;
        } else {
          nextID.valid = false;
        }
      } else {
        // Freeze PC and freeze IF/ID latch
        Object.assign(nextID, this.IF_ID);
      }

      // Handle Branch Flush
      if (branchTaken) {
        this.isBranchFlush = true;
        this.flushesCount++;
        this.pc = branchTarget;
        nextID.valid = false; // Flush fetched instruction
        SoundFX.flush();
        this.logMicroOp(`<span class="term-line-stall">[CC${cc}] BRANCH TAKEN &rarr; Target PC=0x${branchTarget.toString(16)}. Flushing IF stage!</span>`);
      } else {
        this.isBranchFlush = false;
      }

      // Advance Latches
      this.MEM_WB = nextWB;
      this.EX_MEM = nextMEM;
      this.ID_EX = nextEX;
      if (!stallPipeline) {
        this.IF_ID = nextID;
      }

      this.clockCycle++;
      this.updateUI();
    }

    startAutoRun(freqHz) {
      if (this.isRunning) return;
      this.isRunning = true;
      const interval = Math.max(50, 1000 / freqHz);
      this.runTimer = setInterval(() => {
        // Stop if all latches empty and PC reached end
        const isFinished = (this.pc >= this.instructions.length) &&
          !this.IF_ID.valid && !this.ID_EX.valid && !this.EX_MEM.valid && !this.MEM_WB.valid;
        if (isFinished) {
          this.stop();
          return;
        }
        this.clockTick();
      }, interval);
    }

    stop() {
      this.isRunning = false;
      if (this.runTimer) {
        clearInterval(this.runTimer);
        this.runTimer = null;
      }
      const btn = document.getElementById('btn-auto-run');
      if (btn) btn.innerHTML = '&#9199; Auto Run';
    }

    triggerRegUpdateAnim(regIdx) {
      const el = document.getElementById(`reg-card-${regIdx}`);
      if (el) {
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 650);
      }
    }

    logMicroOp(htmlStr) {
      const term = document.getElementById('rtl-terminal-body');
      if (!term) return;
      const line = document.createElement('div');
      line.innerHTML = htmlStr;
      term.appendChild(line);
      term.scrollTop = term.scrollHeight;
    }

    toHex4(num) {
      return '0x' + ((num || 0) & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
    }

    updateUI() {
      // 1. Global Telemetry Badges
      const cycleEl = document.getElementById('m-cycle');
      if (cycleEl) cycleEl.textContent = `CC ${this.clockCycle}`;

      const retiredEl = document.getElementById('m-retired');
      if (retiredEl) retiredEl.textContent = this.instructionsRetired;

      const cpiEl = document.getElementById('m-cpi');
      if (cpiEl) {
        const cpi = (this.instructionsRetired > 0) ? ((this.clockCycle - 1) / this.instructionsRetired).toFixed(2) : '1.00';
        cpiEl.textContent = cpi;
      }

      const speedupEl = document.getElementById('m-speedup');
      if (speedupEl) {
        // Ideal single-cycle comparison
        const singleCycles = this.instructionsRetired * 5;
        const actualCycles = Math.max(1, this.clockCycle - 1);
        const speedup = (this.instructionsRetired > 0) ? (singleCycles / actualCycles).toFixed(2) + 'x' : '1.00x';
        speedupEl.textContent = speedup;
      }

      const stallsEl = document.getElementById('m-stalls');
      if (stallsEl) stallsEl.textContent = this.stallsCount;

      const flushesEl = document.getElementById('m-flushes');
      if (flushesEl) flushesEl.textContent = this.flushesCount;

      // 2. Stage Rail Status
      const updateStageBox = (id, latch, name) => {
        const box = document.getElementById(`stage-box-${id}`);
        const txt = document.getElementById(`stage-txt-${id}`);
        if (!box || !txt) return;
        if (latch && latch.valid && !latch.isNop) {
          box.classList.add('active');
          box.classList.remove('stall');
          txt.textContent = latch.instr ? latch.instr.raw : `${name}`;
        } else if (latch && latch.isNop) {
          box.classList.remove('active');
          box.classList.add('stall');
          txt.textContent = 'STALL (NOP)';
        } else {
          box.classList.remove('active', 'stall');
          txt.textContent = '--';
        }
      };

      updateStageBox('if', this.IF_ID, 'IF');
      updateStageBox('id', this.ID_EX, 'ID');
      updateStageBox('ex', this.EX_MEM, 'EX');
      updateStageBox('mem', this.MEM_WB, 'MEM');
      updateStageBox('wb', this.MEM_WB, 'WB');

      // 3. Status Badge
      const statusBadge = document.getElementById('pipeline-status-badge');
      if (statusBadge) {
        if (this.isLoadUseStall) {
          statusBadge.textContent = 'LOAD-USE STALL';
          statusBadge.className = 'metric-value amber';
        } else if (this.isBranchFlush) {
          statusBadge.textContent = 'BRANCH FLUSH';
          statusBadge.className = 'metric-value amber';
        } else if (this.isRunning) {
          statusBadge.textContent = 'RUNNING';
          statusBadge.className = 'metric-value';
        } else {
          statusBadge.textContent = 'PAUSED';
          statusBadge.className = 'metric-value cyan';
        }
      }

      // 4. Register File & Internal Values
      for (let i = 0; i < 8; i++) {
        const val = this.regs[i];
        const hexEl = document.getElementById(`reg-val-hex-${i}`);
        const decEl = document.getElementById(`reg-val-dec-${i}`);
        const binEl = document.getElementById(`reg-val-bin-${i}`);
        if (hexEl) hexEl.textContent = this.toHex4(val);
        if (decEl) decEl.textContent = `Dec: ${val}`;
        if (binEl) binEl.textContent = `Bin: ${val.toString(2).padStart(8, '0')}`;
      }

      const pcVal = document.getElementById('reg-pc-val');
      if (pcVal) pcVal.textContent = this.toHex4(this.pc);

      const irVal = document.getElementById('reg-ir-val');
      if (irVal) irVal.textContent = this.toHex4(this.ir);

      const marVal = document.getElementById('reg-mar-val');
      if (marVal) marVal.textContent = this.toHex4(this.mar);

      const mdrVal = document.getElementById('reg-mdr-val');
      if (mdrVal) mdrVal.textContent = this.toHex4(this.mdr);

      // Flags
      ['z', 'n', 'c', 'v'].forEach(f => {
        const el = document.getElementById(`flag-${f}`);
        if (el) {
          el.textContent = this.flags[f];
          el.classList.toggle('active', this.flags[f] === 1);
        }
      });

      // 5. Update Disassembly Active Row
      document.querySelectorAll('#disasm-tbody tr').forEach((tr, idx) => {
        tr.classList.toggle('asm-row-current', idx === this.pc);
      });

      // 6. Update Memory & Cache Table View
      this.renderMemoryTable();
      this.renderCacheTable();
      this.renderLedgerTable();
    }

    renderMemoryTable() {
      const tbody = document.getElementById('data-mem-tbody');
      if (!tbody) return;
      let html = '';
      for (let i = 0; i < 32; i++) {
        const val = this.memory[i] || 0;
        const hex = this.toHex4(val);
        html += `<tr>
          <td>0x${i.toString(16).padStart(4, '0')}</td>
          <td style="color:#38bdf8;font-weight:700;">${hex}</td>
          <td>${val}</td>
          <td style="color:#94a3b8;">${String.fromCharCode((val & 0xFF) || 32)}</td>
        </tr>`;
      }
      tbody.innerHTML = html;

      // Cache metrics
      const cRate = document.getElementById('cache-hit-rate');
      const cHits = document.getElementById('c-hits-cnt');
      const cMiss = document.getElementById('c-miss-cnt');
      const cAcc = document.getElementById('c-access-cnt');
      const cStall = document.getElementById('c-stall-cnt');

      if (cHits) cHits.textContent = this.cache.hits;
      if (cMiss) cMiss.textContent = this.cache.misses;
      if (cAcc) cAcc.textContent = this.cache.accesses;
      if (cStall) cStall.textContent = this.cache.stallCycles;
      if (cRate) {
        const rate = (this.cache.accesses > 0) ? ((this.cache.hits / this.cache.accesses) * 100).toFixed(1) : '0.0';
        cRate.textContent = `Hit Rate: ${rate}%`;
      }
    }

    renderCacheTable() {
      const tbody = document.getElementById('cache-table-body');
      if (!tbody) return;
      let html = '';
      this.cache.sets.forEach((set, setIdx) => {
        set.forEach((line, wayIdx) => {
          const hexData = line.data.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join(' ');
          html += `<tr id="cache-row-${setIdx}-${wayIdx}">
            <td>Set ${setIdx}</td>
            <td>Way ${wayIdx}</td>
            <td style="color:${line.valid ? '#10b981' : '#64748b'};font-weight:700;">${line.valid ? '1' : '0'}</td>
            <td style="color:${line.dirty ? '#f59e0b' : '#64748b'};">${line.dirty ? '1' : '0'}</td>
            <td style="color:#38bdf8;">0x${line.tag.toString(16)}</td>
            <td>${hexData}...</td>
            <td>${line.fifoCounter}</td>
          </tr>`;
        });
      });
      tbody.innerHTML = html;

      const amatEl = document.getElementById('amat-display');
      if (amatEl) amatEl.textContent = `${this.cache.getAMAT().toFixed(2)} CC`;
    }

    renderLedgerTable() {
      const headerTr = document.getElementById('ledger-header-tr');
      const tbody = document.getElementById('ledger-body');
      if (!headerTr || !tbody) return;

      const totalCycles = Math.max(8, this.clockCycle);
      let ths = '<th>Instruction</th>';
      for (let c = 1; c <= totalCycles; c++) {
        ths += `<th>CC${c}</th>`;
      }
      headerTr.innerHTML = ths;

      let rows = '';
      this.instructions.forEach((instr, idx) => {
        rows += `<tr><td style="text-align:left;font-weight:600;color:#93c5fd;">${instr.raw}</td>`;
        for (let c = 1; c <= totalCycles; c++) {
          const st = this.ledger[idx] ? this.ledger[idx][c] : '';
          let cls = '';
          if (st === 'IF') cls = 'ledger-cell-if';
          else if (st === 'ID') cls = 'ledger-cell-id';
          else if (st === 'EX') cls = 'ledger-cell-ex';
          else if (st === 'MEM') cls = 'ledger-cell-mem';
          else if (st === 'WB') cls = 'ledger-cell-wb';
          else if (st === 'STALL') cls = 'ledger-cell-stall';
          rows += `<td>${st ? `<span class="${cls}">${st}</span>` : ''}</td>`;
        }
        rows += `</tr>`;
      });
      tbody.innerHTML = rows;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. CANVAS 2D VECTOR RENDERING ENGINES
  // ══════════════════════════════════════════════════════════════════════════

  // 5.1 Pipeline Stages Visualizer Canvas
  function drawPipelineCanvas(cpu) {
    const canvas = document.getElementById('coa-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#030814';
    ctx.fillRect(0, 0, w, h);

    // Subtle Circuit Grid
    ctx.strokeStyle = '#09152b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 5 Stages Layout
    const stages = [
      { id: 'IF', name: 'FETCH', latch: cpu.IF_ID, color: '#38bdf8' },
      { id: 'ID', name: 'DECODE', latch: cpu.ID_EX, color: '#a855f7' },
      { id: 'EX', name: 'EXECUTE', latch: cpu.EX_MEM, color: '#f59e0b' },
      { id: 'MEM', name: 'MEMORY', latch: cpu.MEM_WB, color: '#10b981' },
      { id: 'WB', name: 'WRITEBACK', latch: cpu.MEM_WB, color: '#ec4899' }
    ];

    const bayW = 125;
    const bayH = 200;
    const gap = 24;
    const startX = 35;
    const startY = 80;

    // Draw Main Inter-stage Conveyor Bus
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startX + 60, startY + bayH / 2);
    ctx.lineTo(startX + 4 * (bayW + gap) + 60, startY + bayH / 2);
    ctx.stroke();

    // Stage Bays
    stages.forEach((st, i) => {
      const bx = startX + i * (bayW + gap);
      const by = startY;
      const isActive = st.latch && st.latch.valid && !st.latch.isNop;
      const isStall = st.latch && st.latch.isNop;

      // Outer Bay Shadow & Box
      ctx.fillStyle = isActive ? 'rgba(15, 23, 42, 0.95)' : 'rgba(8, 15, 30, 0.7)';
      ctx.strokeStyle = isStall ? '#f43f5e' : (isActive ? st.color : '#1e293b');
      ctx.lineWidth = isActive ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.roundRect(bx, by, bayW, bayH, 10);
      ctx.fill();
      ctx.stroke();

      // Top Stage Badge
      ctx.fillStyle = isStall ? '#f43f5e' : (isActive ? st.color : '#64748b');
      ctx.beginPath();
      ctx.roundRect(bx + 10, by - 12, bayW - 20, 24, 6);
      ctx.fill();

      ctx.fillStyle = '#030814';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`[${st.id}] ${st.name}`, bx + bayW / 2, by + 4);

      // Card Content Inside Bay
      if (isActive && st.latch.instr) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText(st.latch.instr.opStr, bx + bayW / 2, by + 45);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "JetBrains Mono", monospace';
        const rawText = st.latch.instr.raw;
        ctx.fillText(rawText.length > 14 ? rawText.slice(0, 14) + '..' : rawText, bx + bayW / 2, by + 70);

        // Hardware details
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px Inter, sans-serif';
        if (st.id === 'EX') {
          ctx.fillText(`ALU: ${st.latch.aluOut}`, bx + bayW / 2, by + 105);
        } else if (st.id === 'MEM') {
          ctx.fillText(st.latch.memRead ? 'MEM READ' : (st.latch.memWrite ? 'MEM WRITE' : 'PASS'), bx + bayW / 2, by + 105);
        } else if (st.id === 'WB') {
          ctx.fillText(`Dest: R${st.latch.rd}`, bx + bayW / 2, by + 105);
        } else if (st.id === 'ID') {
          ctx.fillText(`R${st.latch.rs1}, R${st.latch.rs2}`, bx + bayW / 2, by + 105);
        } else {
          ctx.fillText(`PC: 0x${st.latch.pc.toString(16)}`, bx + bayW / 2, by + 105);
        }

        // Active Pulse Dot
        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.arc(bx + bayW / 2, by + bayH - 24, 5, 0, Math.PI * 2);
        ctx.fill();

      } else if (isStall) {
        // Hatched NOP stall bubble
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText('STALL', bx + bayW / 2, by + 80);
        ctx.fillStyle = '#fda4af';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('NOP BUBBLE', bx + bayW / 2, by + 105);

        // Padlock icon
        ctx.fillStyle = '#fb7185';
        ctx.fillText('🔒 FREEZE', bx + bayW / 2, by + 140);
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('IDLE', bx + bayW / 2, by + 100);
      }
    });

    // Draw Forwarding Bypass Lines (Curves)
    if (cpu.forwardingEnabled) {
      const exBayX = startX + 2 * (bayW + gap) + bayW / 2;
      const memBayX = startX + 3 * (bayW + gap) + bayW / 2;
      const wbBayX = startX + 4 * (bayW + gap) + bayW / 2;

      // EX/MEM -> EX Forwarding Line (ForwardA/B = 2)
      if (cpu.forwardA === 2 || cpu.forwardB === 2) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(memBayX, startY + bayH);
        ctx.bezierCurveTo(memBayX, startY + bayH + 60, exBayX, startY + bayH + 60, exBayX, startY + bayH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('⚡ Forward EX/MEM &rarr; ALU', (exBayX + memBayX) / 2, startY + bayH + 52);
      }

      // MEM/WB -> EX Forwarding Line (ForwardA/B = 1)
      if (cpu.forwardA === 1 || cpu.forwardB === 1) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(wbBayX, startY + bayH);
        ctx.bezierCurveTo(wbBayX, startY + bayH + 90, exBayX, startY + bayH + 90, exBayX, startY + bayH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('⚡ Forward MEM/WB &rarr; ALU', (exBayX + wbBayX) / 2, startY + bayH + 82);
      }
    }

    // Top Legend & Telemetry Header
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('16-bit RISC Latch Bus Registers: [IF/ID] &bull; [ID/EX] &bull; [EX/MEM] &bull; [MEM/WB]', 35, 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = cpu.forwardingEnabled ? '#10b981' : '#f59e0b';
    ctx.fillText(`Forwarding: ${cpu.forwardingEnabled ? 'ACTIVE (Zero-Stall Bypass)' : 'DISABLED (Stall Mode)'}`, w - 35, 36);
  }

  // 5.2 Datapath & Bus RTL Canvas
  function drawDatapathCanvas(cpu) {
    const canvas = document.getElementById('datapath-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Control Unit Box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(50, 40, 160, 110, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROL UNIT', 130, 75);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Microcode Sequencer', 130, 95);
    ctx.fillText('RegWrite &bull; MemRead &bull; ALUSrc', 130, 115);

    // Register File Box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath(); ctx.roundRect(260, 40, 180, 150, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('REGISTER FILE', 350, 75);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('8 &times; 16-bit GPRs (R0-R7)', 350, 95);
    ctx.fillText(`R1: ${cpu.regs[1]} | R2: ${cpu.regs[2]}`, 350, 120);
    ctx.fillText(`R3: ${cpu.regs[3]} | R4: ${cpu.regs[4]}`, 350, 140);
    ctx.fillText(`R5: ${cpu.regs[5]} | R6: ${cpu.regs[6]}`, 350, 160);

    // ALU Core Box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath(); ctx.roundRect(490, 40, 150, 130, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('ALU CORE', 565, 75);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('16-bit Adder & Logic', 565, 95);
    ctx.fillText(`Z:${cpu.flags.z} N:${cpu.flags.n} C:${cpu.flags.c} V:${cpu.flags.v}`, 565, 120);

    // L1 Data & Instruction Memory Box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#10b981';
    ctx.beginPath(); ctx.roundRect(680, 40, 90, 160, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('L1 CACHE', 725, 75);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Direct / 2Way', 725, 95);
    ctx.fillText('&amp; SRAM', 725, 115);

    // System Bus (Middle Strip)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 240, 720, 36);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 240, 720, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('16-BIT COMMON SYSTEM BUS (Address &bull; Data &bull; Control)', 400, 262);

    // Internal Registers Row (PC, MAR, MDR, IR)
    const intRegs = [
      { name: 'PC', val: cpu.pc, x: 80 },
      { name: 'MAR', val: cpu.mar, x: 260 },
      { name: 'MDR', val: cpu.mdr, x: 440 },
      { name: 'IR', val: cpu.ir, x: 620 }
    ];

    intRegs.forEach(r => {
      ctx.fillStyle = '#0b1329';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(r.x, 320, 120, 80, 6); ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(r.name, r.x + 60, 345);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`0x${(r.val || 0).toString(16).padStart(4, '0').toUpperCase()}`, r.x + 60, 375);
    });

    // Animated Glowing Signal Bus Dots
    const time = Date.now() / 200;
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < 8; i++) {
      const dotX = 60 + ((time * 30 + i * 90) % 680);
      ctx.beginPath(); ctx.arc(dotX, 258, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. INTERACTIVE ARCHITECTURE CHALLENGE ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  const ChallengeEngine = {
    currentTrack: 1,
    currentChallengeIdx: 0,
    score: 0,
    streak: 0,

    challenges: [
      {
        track: 'Track 1: Hazard Hunter',
        title: 'Challenge 1: RAW Data Hazard Forwarding',
        desc: 'Given the following instruction sequence advancing in the pipeline:',
        code: 'I1: ADD R1, R2, R3    (Currently in EX/MEM stage)\nI2: SUB R4, R1, R5    (Currently in ID/EX stage)',
        prompt: 'What forwarding path must the Forwarding Unit trigger to prevent an erroneous stale read of R1?',
        options: [
          { text: 'A. Forward from MEM/WB to ALU Input A', correct: false },
          { text: 'B. Forward from EX/MEM to ALU Input A (ForwardA = 10₂)', correct: true },
          { text: 'C. Insert 2 hardware stall bubbles into ID/EX', correct: false },
          { text: 'D. No forwarding needed; registers update instantaneously', correct: false }
        ],
        derivation: 'I1 in EX/MEM writes to R1. I2 in ID/EX requires R1 as its first operand. Since EX/MEM contains the newly computed result, the forwarding unit sets ForwardA = 10₂ to bypass directly to ALU Input A with zero stalls.'
      },
      {
        track: 'Track 1: Hazard Hunter',
        title: 'Challenge 2: Load-Use Dependency Stall',
        desc: 'Observe this memory load sequence:',
        code: 'I1: LW  R2, 0(R1)     (Currently in EX stage)\nI2: ADD R3, R2, R4    (Currently in ID stage)',
        prompt: 'Why cannot hardware forwarding alone resolve this data hazard without stalling?',
        options: [
          { text: 'A. R2 is read-only in the instruction set', correct: false },
          { text: 'B. The data value from memory is not available until the end of MEM stage, requiring a 1-cycle stall bubble', correct: true },
          { text: 'C. Memory reads always trigger an interrupt', correct: false },
          { text: 'D. Forwarding units are disabled during arithmetic operations', correct: false }
        ],
        derivation: 'In a load instruction, data from memory is only retrieved in the MEM stage. The dependent ADD instruction needs the operand at the beginning of its EX stage. Forwarding backward in time is physically impossible, requiring hardware to inject 1 stall bubble.'
      },
      {
        track: 'Track 2: Cache Memory Predictor',
        title: 'Challenge 3: Direct-Mapped Conflict Misses',
        desc: 'Consider a Direct-Mapped cache with 16-byte blocks and 4 cache sets (Sets 0..3):',
        code: 'Access 1: Read Address 0x0000 (Maps to Set 0)\nAccess 2: Read Address 0x0040 (Maps to Set 0)\nAccess 3: Read Address 0x0000 (Maps to Set 0)',
        prompt: 'What type of cache miss occurs on Access 3?',
        options: [
          { text: 'A. Compulsory (Cold) Miss', correct: false },
          { text: 'B. Conflict (Collision) Miss', correct: true },
          { text: 'C. Capacity Miss', correct: false },
          { text: 'D. Cache Hit', correct: false }
        ],
        derivation: 'Both addresses 0x0000 and 0x0040 map to Set 0. Access 2 evicts the block from Access 1. When Access 3 reads 0x0000 again, it misses even though total cache capacity is not exceeded. This is a classic conflict miss (cache thrashing).'
      }
    ],

    init() {
      this.render();
      document.getElementById('btn-check-ch-answer').addEventListener('click', () => this.checkAnswer());
      document.getElementById('btn-toggle-ch-deriv').addEventListener('click', () => {
        const box = document.getElementById('ch-derivation-content');
        box.classList.toggle('hidden');
      });
      document.getElementById('btn-next-ch').addEventListener('click', () => this.nextChallenge());
    },

    render() {
      const ch = this.challenges[this.currentChallengeIdx];
      if (!ch) return;

      document.getElementById('ch-track-name').textContent = ch.track;
      document.getElementById('ch-question-title').textContent = ch.title;
      document.getElementById('ch-question-desc').textContent = ch.desc;
      document.getElementById('ch-code-snippet').textContent = ch.code;
      document.getElementById('ch-question-prompt').textContent = ch.prompt;
      document.getElementById('ch-derivation-content').textContent = ch.derivation;
      document.getElementById('ch-derivation-content').classList.add('hidden');

      const container = document.getElementById('ch-options-container');
      container.innerHTML = '';
      ch.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'challenge-option-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          container.querySelectorAll('.challenge-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.selectedOptionIdx = idx;
        });
        container.appendChild(btn);
      });

      this.selectedOptionIdx = -1;
    },

    checkAnswer() {
      if (this.selectedOptionIdx === -1) {
        alert('Please select an option first!');
        return;
      }
      const ch = this.challenges[this.currentChallengeIdx];
      const isCorrect = ch.options[this.selectedOptionIdx].correct;
      const btns = document.querySelectorAll('#ch-options-container .challenge-option-btn');

      btns.forEach((b, idx) => {
        if (ch.options[idx].correct) b.classList.add('correct');
        else if (idx === this.selectedOptionIdx) b.classList.add('wrong');
      });

      if (isCorrect) {
        this.score += 150;
        this.streak++;
        SoundFX.cacheHit();
      } else {
        this.streak = 0;
        SoundFX.stall();
      }

      document.getElementById('ch-score').textContent = this.score;
      document.getElementById('ch-streak').textContent = `★ ${this.streak}`;
      document.getElementById('ch-derivation-content').classList.remove('hidden');
    },

    nextChallenge() {
      this.currentChallengeIdx = (this.currentChallengeIdx + 1) % this.challenges.length;
      this.render();
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 7. QUIZ MODULE (10 WBSCTE QUESTIONS)
  // ══════════════════════════════════════════════════════════════════════════
  const QuizModule = {
    score: 0,
    questions: [
      {
        q: '1. In a 5-stage RISC pipeline, ideal speedup over an unpipelined processor for n instructions as n approaches infinity is equal to:',
        opts: ['A. k (number of pipeline stages = 5)', 'B. 1 / k', 'C. k * n', 'D. Independent of stages'],
        ans: 0,
        exp: 'Ideal speedup S = (k * n) / (k + n - 1). As n -> infinity, S approaches k (5x speedup).'
      },
      {
        q: '2. Which of the following data hazards occurs when instruction I2 tries to read a register before instruction I1 writes it?',
        opts: ['A. Write-After-Read (WAR)', 'B. Read-After-Write (RAW)', 'C. Write-After-Write (WAW)', 'D. Structural Hazard'],
        ans: 1,
        exp: 'RAW (Read-After-Write) is a true data dependency where I2 reads stale data if forwarding or stalling is not applied.'
      },
      {
        q: '3. What hardware component allows resolving RAW hazards without inserting clock cycle stalls?',
        opts: ['A. Branch Target Buffer', 'B. Data Forwarding / Bypassing Unit', 'C. Microcode ROM', 'D. DMA Controller'],
        ans: 1,
        exp: 'The Forwarding Unit uses multiplexers to route outputs from EX/MEM or MEM/WB directly back to ALU inputs.'
      },
      {
        q: '4. Why is a hardware stall bubble mandatory for a Load-Use data dependency even with forwarding enabled?',
        opts: ['A. ALU cannot add loaded values', 'B. Memory data is only available at the end of MEM stage, while the next instruction needs it at the start of EX', 'C. Registers cannot read and write concurrently', 'D. Cache is disabled'],
        ans: 1,
        exp: 'The loaded data is not available until MEM stage completes; forwarding backward in time is impossible, requiring a 1-cycle stall bubble.'
      },
      {
        q: '5. In a Direct-Mapped cache, which address field specifies the line location where a block may reside?',
        opts: ['A. Tag Field', 'B. Set Index Field', 'C. Block Byte Offset', 'D. Dirty Bit'],
        ans: 1,
        exp: 'The Set Index bits directly index the unique cache line corresponding to that memory address.'
      },
      {
        q: '6. The formula for Average Memory Access Time (AMAT) is:',
        opts: ['A. Hit Time + (Miss Rate * Miss Penalty)', 'B. Hit Time * Miss Penalty', 'C. Miss Rate * Hit Time', 'D. Hit Rate + Miss Rate'],
        ans: 0,
        exp: 'AMAT = t_hit + (Miss Rate * t_miss-penalty).'
      },
      {
        q: '7. What is the penalty when a branch misprediction is resolved in the EX stage of a 5-stage pipeline?',
        opts: ['A. 0 cycles', 'B. 1 clock cycle', 'C. 2 clock cycles (flush IF/ID and ID/EX)', 'D. 5 clock cycles'],
        ans: 2,
        exp: 'Resolving a branch in EX requires flushing both the IF/ID and ID/EX latches, incurring a 2-cycle branch penalty.'
      },
      {
        q: '8. In the 16-bit RISC ISA, which register is hardwired to constant zero ($R0 = 0)?',
        opts: ['A. R0', 'B. R7', 'C. PC', 'D. ACC'],
        ans: 0,
        exp: 'R0 is hardwired to zero, allowing convenient zero comparisons, register copying (ADD R1, R2, R0), and unconditional jumps.'
      },
      {
        q: '9. A 2-bit saturating branch predictor transitions from Weakly Taken (10) to which state upon a single Not-Taken outcome?',
        opts: ['A. Strongly Taken (11)', 'B. Weakly Not-Taken (01)', 'C. Strongly Not-Taken (00)', 'D. Remains Weakly Taken'],
        ans: 1,
        exp: 'A single misprediction in Weakly Taken (10) decrements the counter to Weakly Not-Taken (01).'
      },
      {
        q: '10. Conflict misses in cache memory can be mitigated primarily by:',
        opts: ['A. Decreasing block size', 'B. Increasing set-associativity (e.g. from Direct to 2-Way or 4-Way)', 'C. Removing the L1 cache', 'D. Reducing clock frequency'],
        ans: 1,
        exp: 'Set-associativity allows multiple memory blocks mapping to the same set index to coexist in different ways, eliminating conflict misses.'
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
        btn.addEventListener('click', (e) => {
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
        SoundFX.cacheHit();
      } else {
        btns[oIdx].classList.add('wrong');
        btns[qObj.ans].classList.add('correct');
        SoundFX.stall();
      }

      if (expEl) expEl.style.display = 'block';
      const scoreVal = document.getElementById('quiz-score-val');
      if (scoreVal) scoreVal.textContent = this.score;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 8. SAMPLE ASSEMBLY PROGRAM PRESETS
  // ══════════════════════════════════════════════════════════════════════════
  const PRESETS = {
    raw_benchmark: `; Benchmark Program: Computing (A + B) and Memory Storage
ADDI R1, R0, 10      ; R1 = 10
ADDI R2, R0, 20      ; R2 = 20
SW   R1, 0(R0)       ; MEM[0] = 10
LW   R3, 0(R0)       ; R3 = 10 (Load-use hazard with next instruction)
ADD  R4, R3, R2      ; R4 = R3 + R2 = 30 (Requires Load-Use Stall + Forward)
SUB  R5, R4, R1      ; R5 = 30 - 10 = 20 (Direct EX-to-EX Forwarding)
HALT`,

    fibonacci: `; Fibonacci Sequence Generator
ADDI R1, R0, 0       ; F(0) = 0
ADDI R2, R0, 1       ; F(1) = 1
ADDI R7, R0, 5       ; Counter = 5
LOOP:
ADD  R3, R1, R2      ; F(n) = F(n-1) + F(n-2)
ADD  R1, R0, R2      ; Shift R1 <- R2
ADD  R2, R0, R3      ; Shift R2 <- R3
SUB  R7, R7, 1       ; Decrement counter
BEQ  R7, R0, EXIT    ; Branch when counter == 0
JMP  LOOP
EXIT:
HALT`,

    array_sum: `; Array Max-Search & Memory Sum
ADDI R1, R0, 0       ; Sum = 0
ADDI R2, R0, 4       ; Array length = 4
ADDI R3, R0, 0       ; Pointer = 0
ARRLOOP:
LW   R4, 0(R3)       ; Load element from MEM[pointer]
ADD  R1, R1, R4      ; Sum += element
ADDI R3, R3, 1       ; pointer++
SUB  R2, R2, 1       ; length--
BEQ  R2, R0, ARRDONE
JMP  ARRLOOP
ARRDONE:
SW   R1, 10(R0)      ; Store total sum at MEM[10]
HALT`,

    cache_thrash: `; Cache Conflict Thrashing Demo
; Alternates access to addresses mapping to same set (0x00 and 0x10)
ADDI R1, R0, 0       ; Iteration counter
THRASHLP:
LW   R2, 0(R0)       ; Read Address 0x00 (Set Index 0)
LW   R3, 16(R0)      ; Read Address 0x10 (Evicts Set 0 in Direct-Mapped!)
LW   R4, 0(R0)       ; Read Address 0x00 (Forces Conflict Miss!)
ADDI R1, R1, 1
SUB  R5, R1, 3
BEQ  R5, R0, THRASHDONE
JMP  THRASHLP
THRASHDONE:
HALT`
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 9. MAIN INITIALIZATION & DOM BINDINGS
  // ══════════════════════════════════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    const cpu = new RISCProcessor();

    // 9.1 Register Cards Rendering
    const regGrid = document.getElementById('reg-file-grid');
    if (regGrid) {
      let regHtml = '';
      for (let i = 0; i < 8; i++) {
        regHtml += `
          <div class="reg-card" id="reg-card-${i}">
            <div class="reg-top">
              <span class="reg-name">R${i}</span>
              <span class="reg-alias">${i === 0 ? 'Zero Reg ($0)' : (i === 7 ? 'Link Reg ($ra)' : 'GPR')}</span>
            </div>
            <div class="reg-hex" id="reg-val-hex-${i}">0x0000</div>
            <div class="reg-dec-bin">
              <span id="reg-val-dec-${i}">Dec: 0</span>
              <span id="reg-val-bin-${i}">Bin: 00000000</span>
            </div>
          </div>
        `;
      }
      regGrid.innerHTML = regHtml;
    }

    // 9.2 Initial Assembly Compilation
    function assembleAndLoad() {
      const src = document.getElementById('asm-source').value;
      const { compiled, errors } = ISA.assemble(src);
      if (errors.length > 0) {
        alert(`Assembly Error:\n${errors.map(e => `Line ${e.line}: ${e.msg}`).join('\n')}`);
        return;
      }

      // Populate Disassembly Table
      const disasmTbody = document.getElementById('disasm-tbody');
      if (disasmTbody) {
        let html = '';
        compiled.forEach((item, idx) => {
          html += `<tr id="disasm-row-${idx}">
            <td style="color:var(--accent-cyan);font-weight:700;">${idx === cpu.pc ? '&rarr;' : ''}</td>
            <td>0x${item.addr.toString(16).padStart(4, '0')}</td>
            <td style="color:#38bdf8;font-weight:700;">${item.hexStr}</td>
            <td>${item.raw}</td>
            <td style="color:#94a3b8;">${item.bitfields}</td>
          </tr>`;
        });
        disasmTbody.innerHTML = html;
      }

      cpu.loadProgram(compiled);
      drawPipelineCanvas(cpu);
      drawDatapathCanvas(cpu);
    }

    assembleAndLoad();

    // 9.3 Controls & Listeners
    document.getElementById('btn-clock-step').addEventListener('click', () => {
      SoundFX.init();
      cpu.clockTick();
      drawPipelineCanvas(cpu);
      drawDatapathCanvas(cpu);
    });

    document.getElementById('btn-auto-run').addEventListener('click', (e) => {
      SoundFX.init();
      if (cpu.isRunning) {
        cpu.stop();
        e.target.innerHTML = '&#9199; Auto Run';
      } else {
        const speed = parseFloat(document.getElementById('clock-speed-slider').value) || 1.5;
        cpu.startAutoRun(speed);
        e.target.innerHTML = '&#9208; Pause Clock';
      }
    });

    document.getElementById('btn-reset-cpu').addEventListener('click', () => {
      cpu.reset();
      drawPipelineCanvas(cpu);
      drawDatapathCanvas(cpu);
    });

    document.getElementById('clock-speed-slider').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('speed-display').textContent = `${val.toFixed(1)}Hz`;
      if (cpu.isRunning) {
        cpu.stop();
        cpu.startAutoRun(val);
        document.getElementById('btn-auto-run').innerHTML = '&#9208; Pause Clock';
      }
    });

    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      SoundFX.toggle();
    });

    // Hardware Configuration Listeners
    document.getElementById('hw-forwarding').addEventListener('change', (e) => {
      cpu.forwardingEnabled = (e.target.value === 'enabled');
      drawPipelineCanvas(cpu);
    });

    document.getElementById('hw-branch-stage').addEventListener('change', (e) => {
      cpu.branchStage = e.target.value;
    });

    document.getElementById('hw-predictor').addEventListener('change', (e) => {
      cpu.branchPredictor = e.target.value;
    });

    // Preset Selection
    document.getElementById('asm-preset-select').addEventListener('change', (e) => {
      const key = e.target.value;
      if (PRESETS[key]) {
        document.getElementById('asm-source').value = PRESETS[key];
        assembleAndLoad();
      }
    });

    document.getElementById('btn-assemble-code').addEventListener('click', assembleAndLoad);
    document.getElementById('btn-format-asm').addEventListener('click', assembleAndLoad);

    // Cache Controls
    document.getElementById('cache-mapping').addEventListener('change', (e) => {
      cpu.cache.mapping = e.target.value;
      cpu.cache.reset();
      cpu.renderCacheTable();
    });
    document.getElementById('cache-capacity').addEventListener('change', (e) => {
      cpu.cache.capacity = parseInt(e.target.value, 10);
      cpu.cache.reset();
      cpu.renderCacheTable();
    });
    document.getElementById('cache-block-size').addEventListener('change', (e) => {
      cpu.cache.blockSize = parseInt(e.target.value, 10);
      cpu.cache.reset();
      cpu.renderCacheTable();
    });
    document.getElementById('cache-policy').addEventListener('change', (e) => {
      cpu.cache.policy = e.target.value;
      cpu.cache.reset();
      cpu.renderCacheTable();
    });

    // Standalone Address Probe
    document.getElementById('btn-probe-read').addEventListener('click', () => {
      SoundFX.init();
      const input = document.getElementById('probe-addr-input').value;
      const addr = ISA.parseImm(input);
      const res = cpu.cache.access(addr, false);
      cpu.renderCacheTable();

      // Highlight accessed row
      const row = document.getElementById(`cache-row-${res.setIdx}-${res.wayIdx}`);
      if (row) {
        row.className = res.hit ? 'cache-row-hit' : 'cache-row-miss';
        setTimeout(() => row.className = '', 800);
      }

      // Update Dissection Display
      const decomp = cpu.cache.decomposeAddress(addr);
      document.getElementById('dissect-hex-addr').textContent = `0x${addr.toString(16).padStart(4, '0').toUpperCase()}`;
      document.getElementById('dissect-tag-val').textContent = `0x${decomp.tag.toString(16).toUpperCase()}`;
      document.getElementById('dissect-index-val').textContent = `Set ${decomp.index}`;
      document.getElementById('dissect-offset-val').textContent = `Byte ${decomp.offset}`;
      document.getElementById('dissect-tag-bits').textContent = `${cpu.cache.tagBits} bits`;
      document.getElementById('dissect-index-bits').textContent = `${cpu.cache.indexBits} bits`;
      document.getElementById('dissect-offset-bits').textContent = `${cpu.cache.offsetBits} bits`;
    });

    document.getElementById('btn-probe-write').addEventListener('click', () => {
      SoundFX.init();
      const input = document.getElementById('probe-addr-input').value;
      const addr = ISA.parseImm(input);
      const res = cpu.cache.access(addr, true, 0xAA);
      cpu.renderCacheTable();
    });

    document.getElementById('btn-clear-cache').addEventListener('click', () => {
      cpu.cache.reset();
      cpu.renderCacheTable();
    });

    document.getElementById('btn-clear-term').addEventListener('click', () => {
      document.getElementById('rtl-terminal-body').innerHTML = '&gt; Terminal trace cleared.';
    });

    // 9.4 Sub-Module Switcher (Pipeline / Datapath / Cache / Challenge)
    document.querySelectorAll('#submodule-tabs .sub-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#submodule-tabs .sub-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sub = btn.dataset.sub;

        document.getElementById('sub-view-pipeline').classList.toggle('hidden', sub !== 'pipeline');
        document.getElementById('sub-view-datapath').classList.toggle('hidden', sub !== 'datapath');
        document.getElementById('sub-view-cache').classList.toggle('hidden', sub !== 'cache');
        document.getElementById('sub-view-challenge').classList.toggle('hidden', sub !== 'challenge');

        if (sub === 'pipeline') drawPipelineCanvas(cpu);
        if (sub === 'datapath') drawDatapathCanvas(cpu);
      });
    });

    // 9.5 Right Pane Tabs (Assembler / Registers / Memory / RTL)
    document.querySelectorAll('#right-pane-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#right-pane-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;

        ['tab-asm', 'tab-regs', 'tab-mem', 'tab-rtl'].forEach(id => {
          document.getElementById(id).classList.toggle('hidden', id !== target);
        });
      });
    });

    // 9.6 Canonical Mode Tabs (Simulate / 3D Model / Theory / Quiz)
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

    // Initialize Challenge Engine & Quiz
    ChallengeEngine.init();
    QuizModule.init();

    // 9.7 3D Model Embed Loader
    function init3DModel() {
      window.three3DInitialized = true;
      const canvas3d = document.getElementById('sim3d-canvas');
      const aside = document.getElementById('sim3d-components');
      if (!canvas3d || !window.THREE) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0e17);

      const camera = new THREE.PerspectiveCamera(45, canvas3d.clientWidth / canvas3d.clientHeight, 0.1, 100);
      camera.position.set(3.8, 3.2, 4.5);

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
      loader.load('/models/computer_architecture.glb', (gltf) => {
        scene.add(gltf.scene);
        if (aside) {
          aside.innerHTML = '';
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              const btn = document.createElement('button');
              btn.className = 'sim3d-comp';
              btn.textContent = child.name || 'Component';
              btn.addEventListener('click', () => {
                aside.querySelectorAll('.sim3d-comp').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (child.material && child.material.color) {
                  const orig = child.material.color.getHex();
                  child.material.color.setHex(0x00e676);
                  setTimeout(() => child.material.color.setHex(orig), 700);
                }
              });
              aside.appendChild(btn);
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

    // Animation Loop for live canvas electric pulses
    function continuousRender() {
      requestAnimationFrame(continuousRender);
      if (document.getElementById('sub-view-datapath') && !document.getElementById('sub-view-datapath').classList.contains('hidden')) {
        drawDatapathCanvas(cpu);
      }
    }
    continuousRender();
  });

})();
