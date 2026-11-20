/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CIRCUIT THEORY & NETWORKS VIRTUAL LAB ENGINE — VisualLab V2 Standard
 * Strict 3:2 Dual Viewport, Thevenin & Norton Theorems,
 * Maximum Power Transfer, R-L-C Series AC Resonance,
 * Oscilloscope, Phasor Diagram, 3D WebGL Model & Anime.js Kinetic Choreography
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
      this.activeSineOsc = null;
      this.activeSineGain = null;
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
      if (!this.enabled && this.activeSineGain) {
        this.stopSineBeep();
      }
      return this.enabled;
    }

    playRelayClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    playSwitchToggle() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.025);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    }

    playSuccessChord() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.05);
        osc.stop(this.ctx.currentTime + i * 0.05 + 0.36);
      });
    }

    playAlertTone() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.setValueAtTime(240, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    }

    playResonanceTone(freq, currentRatio = 1.0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const audioFreq = Math.max(100, Math.min(2400, freq));
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(audioFreq, this.ctx.currentTime);
      const vol = Math.min(0.2, 0.04 + currentRatio * 0.12);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    }
  }

  const sound = new SoundSynthesizer();

  // ════════════════════════════════════════════════════════════════════════════
  // 2. COMPLEX NUMBER ARITHMETIC CLASS
  // ════════════════════════════════════════════════════════════════════════════
  class Complex {
    constructor(re = 0, im = 0) {
      this.re = Number(re) || 0;
      this.im = Number(im) || 0;
    }

    add(b) {
      return new Complex(this.re + b.re, this.im + b.im);
    }

    sub(b) {
      return new Complex(this.re - b.re, this.im - b.im);
    }

    mul(b) {
      return new Complex(
        this.re * b.re - this.im * b.im,
        this.re * b.im + this.im * b.re
      );
    }

    div(b) {
      const denom = b.re * b.re + b.im * b.im;
      if (denom === 0) return new Complex(Infinity, Infinity);
      return new Complex(
        (this.re * b.re + this.im * b.im) / denom,
        (this.im * b.re - this.re * b.im) / denom
      );
    }

    get mag() {
      return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    get phaseRad() {
      return Math.atan2(this.im, this.re);
    }

    get phaseDeg() {
      return Math.atan2(this.im, this.re) * (180 / Math.PI);
    }

    static fromPolar(r, deg) {
      const rad = (deg * Math.PI) / 180;
      return new Complex(r * Math.cos(rad), r * Math.sin(rad));
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. CIRCUIT ENGINE — THEVENIN & NORTON THEOREMS
  // ════════════════════════════════════════════════════════════════════════════
  class CircuitEngine {
    constructor() {
      // Default parameters matching prompt benchmark:
      // Vs = 24V, R1 = 10Ω, R2 = 20Ω, R3 = 30Ω, R4 = 15Ω, RL = 50Ω
      this.vs = 24.0;
      this.r1 = 10.0;
      this.r2 = 20.0;
      this.r3 = 30.0;
      this.r4 = 15.0;
      this.rl = 50.0;

      // Switches:
      // S1: Connects Load RL across terminals A-B (Default: CLOSED = true)
      // S2: Open Terminal A disconnect (Default: CLOSED/connected = true)
      // S3: Open Terminal B disconnect (Default: CLOSED/connected = true)
      this.s1Closed = true;
      this.s2Closed = true;
      this.s3Closed = true;

      this.s1Open = false;
      this.s2Short = false;
      this.s3Kill = false;
      this.topology = 'bridge'; // 'bridge', 'divider', 'dual', 'hybrid'
    }

    setTopology(name) {
      this.topology = name;
      if (name === 'bridge') {
        this.vs = 24.0; this.r1 = 10.0; this.r2 = 20.0; this.r3 = 30.0; this.r4 = 15.0; this.rl = 50.0;
      } else if (name === 'divider') {
        this.vs = 24.0; this.r1 = 10.0; this.r2 = 20.0; this.r3 = 0.0; this.r4 = 0.0; this.rl = 50.0;
      } else if (name === 'dual') {
        this.vs = 24.0; this.r1 = 10.0; this.r2 = 20.0; this.r3 = 15.0; this.r4 = 0.0; this.rl = 50.0;
      } else if (name === 'hybrid') {
        this.vs = 12.0; this.r1 = 20.0; this.r2 = 10.0; this.r3 = 0.0; this.r4 = 0.0; this.rl = 50.0;
      }
    }

    setParam(key, value) {
      const v = parseFloat(value);
      if (!isNaN(v)) {
        if (key === 'vs') this.vs = Math.max(0, Math.min(100, v));
        if (key === 'r1') this.r1 = Math.max(0.1, Math.min(1000, v));
        if (key === 'r2') this.r2 = Math.max(0.1, Math.min(1000, v));
        if (key === 'r3') this.r3 = Math.max(0.1, Math.min(1000, v));
        if (key === 'r4') this.r4 = Math.max(0.1, Math.min(1000, v));
        if (key === 'rl') this.rl = Math.max(0.0, Math.min(1000, v));
      }
    }

    setSwitch(name, state) {
      if (name === 's1') { this.s1Open = !!state; this.s1Closed = !state; }
      if (name === 's2') { this.s2Short = !!state; this.s2Closed = !state; }
      if (name === 's3') { this.s3Kill = !!state; this.s3Closed = !state; }
    }

    calculate() {
      // Wheatstone Bridge network calculations:
      // Node A is divider of R1 & R2 from Vs: Va = Vs * R2 / (R1 + R2)
      // Node B is divider of R3 & R4 from Vs: Vb = Vs * R4 / (R3 + R4)
      const r12 = this.r1 + this.r2;
      const r34 = this.r3 + this.r4;
      const va = r12 > 0 ? (this.vs * this.r2) / r12 : 0;
      const vb = r34 > 0 ? (this.vs * this.r4) / r34 : 0;

      let vth = 0;
      let rth = 0;

      if (this.topology === 'divider') {
        // Voltage divider across R1 & R2
        vth = r12 > 0 ? (this.vs * this.r2) / r12 : 0;
        rth = r12 > 0 ? (this.r1 * this.r2) / r12 : 0;
      } else if (this.topology === 'dual') {
        // Dual-source mesh with Vs and secondary 12V source
        const v2 = 12.0;
        vth = (r12 > 0 ? (this.vs * this.r2) / r12 : 0) - (r12 > 0 ? (v2 * this.r1) / r12 : 0);
        rth = (r12 > 0 ? (this.r1 * this.r2) / r12 : 0) + this.r3;
      } else if (this.topology === 'hybrid') {
        // Current-source hybrid (1A Norton source + Vs)
        const is = 1.0;
        vth = this.vs + is * this.r1;
        rth = this.r1 + this.r2;
      } else {
        // Standard Wheatstone bridge (default)
        vth = va - vb;
        const r1_par_r2 = (this.r1 * this.r2) / (this.r1 + this.r2);
        const r3_par_r4 = (this.r3 * this.r4) / (this.r3 + this.r4);
        rth = r1_par_r2 + r3_par_r4;
      }

      // Norton Short-Circuit Current:
      // In = Vth / Rth
      const inorton = rth > 0 ? vth / rth : 0;
      const vnorton = vth;

      // Actual terminal state taking switches into account:
      // If S2 or S3 is open, the terminal connection is broken
      const terminalsConnected = this.s2Closed && this.s3Closed;

      let iload = 0;
      let vload = 0;
      let pload = 0;

      // Diagnostic Knife Switch states:
      // S1 (Disconnect Load): if checked, RL is disconnected -> measures Voc = Vth
      // S2 (Short Terminals A-B): if checked, terminals A-B are shorted -> measures Isc = IN
      // S3 (Kill Sources): if checked, sources are killed -> measures Rth on ohmmeter
      const isLoadDisconnected = this.s1Open;
      const isShortCircuit = this.s2Short;
      const isSourcesKilled = this.s3Kill;

      if (isSourcesKilled) {
        // Ohmmeter mode: Sources deactivated (0V), measuring Rth
        iload = 0;
        vload = 0;
        pload = 0;
      } else if (isShortCircuit) {
        // Ammeter Short-Circuit mode: RL = 0, measures IN
        iload = rth > 0 ? vth / rth : 0;
        vload = 0;
        pload = 0;
      } else if (isLoadDisconnected) {
        // Voltmeter Open-Circuit mode: RL = infinity, measures Voc = Vth
        iload = 0;
        vload = vth;
        pload = 0;
      } else {
        // Normal Loaded Conduction mode:
        const totalR = rth + this.rl;
        if (totalR > 0) {
          iload = vth / totalR;
          vload = iload * this.rl;
          pload = iload * iload * this.rl;
        }
      }

      // Branch currents in original bridge:
      const i_branch_12 = r12 > 0 ? this.vs / r12 : 0;
      const i_branch_34 = r34 > 0 ? this.vs / r34 : 0;
      const i_total = i_branch_12 + i_branch_34;

      return {
        vs: this.vs,
        r1: this.r1,
        r2: this.r2,
        r3: this.r3,
        r4: this.r4,
        rl: this.rl,
        va,
        vb,
        vth,
        rth,
        inorton,
        vnorton,
        iload,
        vload,
        pload,
        i_branch_12,
        i_branch_34,
        i_total,
        s1Closed: this.s1Closed,
        s2Closed: this.s2Closed,
        s3Closed: this.s3Closed,
        terminalsConnected
      };
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. MPT ENGINE — MAXIMUM POWER TRANSFER THEOREM
  // ════════════════════════════════════════════════════════════════════════════
  class MPTEngine {
    constructor() {
      // Benchmark defaults: Vth = 12V, Rth = 20Ω, RL = 20Ω
      this.vth = 12.0;
      this.rth = 20.0;
      this.rl = 20.0;
    }

    setParam(key, value) {
      const v = parseFloat(value);
      if (!isNaN(v)) {
        if (key === 'vth') this.vth = Math.max(0.5, Math.min(100, v));
        if (key === 'rth') this.rth = Math.max(0.5, Math.min(500, v));
        if (key === 'rl') this.rl = Math.max(0.0, Math.min(1000, v));
      }
    }

    calculate(rlVal = this.rl) {
      const rl = Math.max(0, rlVal);
      const totalR = this.rth + rl;
      let il = 0;
      let vl = 0;
      let pl = 0;
      let pin = 0;
      let eta = 0;

      if (totalR > 0) {
        il = this.vth / totalR;
        vl = il * rl;
        pl = il * il * rl;
        pin = this.vth * il;
        eta = pin > 0 ? (pl / pin) * 100 : 0;
      }

      // Theoretical Optimal at RL = Rth:
      const pmax = (this.vth * this.vth) / (4 * this.rth);
      const rlOpt = this.rth;
      const etaAtMax = 50.0;
      const vlAtMax = this.vth / 2.0;
      const ilAtMax = this.vth / (2 * this.rth);

      return {
        vth: this.vth,
        rth: this.rth,
        rl,
        il,
        vl,
        pl,
        pin,
        eta,
        pmax,
        rlOpt,
        etaAtMax,
        vlAtMax,
        ilAtMax
      };
    }

    sweep(numPoints = 200, maxRL = null) {
      const limit = maxRL || Math.max(100, this.rth * 5);
      const points = [];
      const step = limit / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const rl = i * step;
        const res = this.calculate(rl);
        points.push({
          rl,
          pl: res.pl,
          eta: res.eta,
          vl: res.vl,
          il: res.il
        });
      }
      return points;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. RLC ENGINE — SERIES AC RESONANCE & PHASOR ANALYSIS
  // ════════════════════════════════════════════════════════════════════════════
  class RLCEngine {
    constructor() {
      // Benchmark: Vrms = 10V, R = 10Ω, L = 25.33mH (0.02533 H), C = 1.0μF (1e-6 F), f = 1000Hz
      this.vrms = 10.0;
      this.f = 1000.0;
      this.r = 10.0;
      this.l_mH = 25.33; // in mH for UI
      this.c_uF = 1.0; // in μF for UI
    }

    get l() {
      return (this.l_mH * 1e-3);
    }

    get c() {
      return (this.c_uF * 1e-6);
    }

    setParam(key, value) {
      const v = parseFloat(value);
      if (!isNaN(v)) {
        if (key === 'vrms') this.vrms = Math.max(0.5, Math.min(50, v));
        if (key === 'f') this.f = Math.max(10, Math.min(20000, v));
        if (key === 'r') this.r = Math.max(0.5, Math.min(500, v));
        if (key === 'l') this.l_mH = Math.max(0.1, Math.min(500, v));
        if (key === 'c') this.c_uF = Math.max(0.01, Math.min(100, v));
      }
    }

    getResonanceProperties() {
      const l = this.l;
      const c = this.c;
      const r = this.r;

      // Resonant frequency fr = 1 / (2 * pi * sqrt(L * C))
      const fr = 1 / (2 * Math.PI * Math.sqrt(l * c));

      // Quality factor Q = (1 / R) * sqrt(L / C) = 2 * pi * fr * L / R
      const q = (1 / r) * Math.sqrt(l / c);

      // Bandwidth BW = fr / Q = R / (2 * pi * L)
      const bw = fr / q;

      // Half-power cutoff frequencies:
      // Exact quadratic solution: f1,2 = fr * [ sqrt(1 + 1/(4Q^2)) -+ 1/(2Q) ]
      const f1 = fr * (Math.sqrt(1 + 1 / (4 * q * q)) - 1 / (2 * q));
      const f2 = fr * (Math.sqrt(1 + 1 / (4 * q * q)) + 1 / (2 * q));

      return {
        fr,
        q,
        bw,
        f1,
        f2
      };
    }

    calculate(freqVal = this.f) {
      const f = Math.max(1, freqVal);
      const omega = 2 * Math.PI * f;
      const l = this.l;
      const c = this.c;
      const r = this.r;

      const xl = omega * l;
      const xc = 1 / (omega * c);
      const x_net = xl - xc;

      const z_mag = Math.sqrt(r * r + x_net * x_net);
      const phaseRad = Math.atan2(x_net, r);
      const phaseDeg = phaseRad * (180 / Math.PI);

      const i = z_mag > 0 ? this.vrms / z_mag : 0;
      const vr = i * r;
      const vl = i * xl;
      const vc = i * xc;
      const vs = this.vrms;

      const pf = Math.cos(phaseRad);
      const pActive = vs * i * pf; // Real power (Watts)
      const qReactive = vs * i * Math.sin(phaseRad); // Reactive power (VAR)
      const sApparent = vs * i; // Apparent power (VA)

      const resProps = this.getResonanceProperties();
      const isResonant = Math.abs(f - resProps.fr) < 0.01 * resProps.fr;

      return {
        f,
        omega,
        vrms: this.vrms,
        r,
        l,
        c,
        xl,
        xc,
        x_net,
        z_mag,
        phaseRad,
        phaseDeg,
        i,
        vr,
        vl,
        vc,
        vs,
        pf,
        pActive,
        qReactive,
        sApparent,
        isResonant,
        ...resProps
      };
    }

    sweep(numPoints = 300) {
      const resProps = this.getResonanceProperties();
      // Cover from 0.1 * fr to 3.0 * fr
      const fMin = Math.max(10, resProps.fr * 0.1);
      const fMax = Math.min(20000, resProps.fr * 3.0);
      const points = [];
      const step = (fMax - fMin) / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const f = fMin + i * step;
        const calc = this.calculate(f);
        points.push({
          f,
          i: calc.i,
          phaseDeg: calc.phaseDeg,
          vr: calc.vr,
          vl: calc.vl,
          vc: calc.vc,
          z_mag: calc.z_mag
        });
      }
      return { points, fMin, fMax, fr: resProps.fr, imax: this.vrms / this.r };
    }

    getPhasors(freqVal = this.f) {
      const c = this.calculate(freqVal);
      // Reference: Current I is at 0 degrees
      return {
        i: { mag: c.i, deg: 0, label: 'I' },
        vr: { mag: c.vr, deg: 0, label: 'VR' },
        vl: { mag: c.vl, deg: 90, label: 'VL' },
        vc: { mag: c.vc, deg: -90, label: 'VC' },
        vs: { mag: c.vs, deg: c.phaseDeg, label: 'Vs' }
      };
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. UNIFIED CANVAS RENDERER — VISUALLAB V2 STANDARD
  // ════════════════════════════════════════════════════════════════════════════
  class UnifiedCanvasRenderer {
    constructor(canvasId, circuitEngine, mptEngine, rlcEngine) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.circuitEngine = circuitEngine;
      this.mptEngine = mptEngine;
      this.rlcEngine = rlcEngine;

      this.activeModule = 'thevenin'; // 'thevenin', 'mpt', 'rlc'
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.showGrid = true;
      this.isDragging = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;

      // Module-specific camera memory for clean isolation
      this.moduleViews = {
        thevenin: { zoom: 1.0, panX: 0, panY: 0 },
        mpt: { zoom: 1.0, panX: 0, panY: 0 },
        rlc: { zoom: 1.0, panX: 0, panY: 0 }
      };

      // Animated electron flow particles
      this.particles = [];
      this.initParticles();

      this.animTime = 0;
      this.animReq = null;

      this.initEvents();
      this.resizeCanvas();
      this.startLoop();
    }

    initParticles() {
      this.particles = [];
      for (let i = 0; i < 60; i++) {
        this.particles.push({
          segment: Math.floor(Math.random() * 8),
          t: Math.random(),
          speed: 0.005 + Math.random() * 0.005,
          size: 2.0 + Math.random() * 1.5,
          alpha: 0.6 + Math.random() * 0.4
        });
      }
    }

    saveModuleView() {
      if (this.moduleViews[this.activeModule]) {
        this.moduleViews[this.activeModule] = {
          zoom: this.zoom,
          panX: this.panX,
          panY: this.panY
        };
      }
    }

    restoreModuleView(mod) {
      if (this.moduleViews[mod]) {
        this.zoom = this.moduleViews[mod].zoom;
        this.panX = this.moduleViews[mod].panX;
        this.panY = this.moduleViews[mod].panY;
        this.updateZoomHUD();
      }
    }

    switchModule(mod) {
      if (this.activeModule === mod) return;
      this.saveModuleView();
      this.activeModule = mod;
      this.restoreModuleView(mod);

      // Smooth Anime.js spring transition for canvas
      if (window.anime) {
        window.anime({
          targets: this.canvas,
          opacity: [0.3, 1],
          scale: [0.98, 1],
          duration: 350,
          easing: 'spring(1, 80, 10, 0)'
        });
      }

      this.render();
    }

    resizeCanvas() {
      const container = this.canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.max(300, Math.floor(rect.width));
      const displayHeight = Math.max(260, Math.floor(rect.height || 520));

      if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
      }
      this.render();
    }

    setZoomAt(newZoom, mouseX, mouseY) {
      const clamped = Math.max(0.4, Math.min(3.0, newZoom));
      const worldX = (mouseX - this.panX) / this.zoom;
      const worldY = (mouseY - this.panY) / this.zoom;
      this.zoom = clamped;
      this.panX = mouseX - worldX * this.zoom;
      this.panY = mouseY - worldY * this.zoom;
      this.saveModuleView();
      this.updateZoomHUD();
      this.render();
    }

    updateZoomHUD() {
      const hudEl = document.getElementById('hud-zoom-level');
      if (hudEl) {
        hudEl.textContent = `${Math.round(this.zoom * 100)}%`;
      }
    }

    resetView() {
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.saveModuleView();
      this.updateZoomHUD();
      this.render();
    }

    fitView() {
      // Auto-center circuit
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.zoom = Math.min(w / 880, h / 520) * 0.95;
      this.zoom = Math.max(0.5, Math.min(2.0, this.zoom));
      this.panX = (w - 880 * this.zoom) / 2;
      this.panY = (h - 520 * this.zoom) / 2;
      this.saveModuleView();
      this.updateZoomHUD();
      this.render();
    }

    toggleGrid() {
      this.showGrid = !this.showGrid;
      this.render();
    }

    toggleFullscreen() {
      const target = document.getElementById('canvas-card-container') || this.canvas.parentElement;
      if (!document.fullscreenElement) {
        if (target.requestFullscreen) {
          target.requestFullscreen();
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setTimeout(() => this.resizeCanvas(), 80);
    }

    initEvents() {
      const cvs = this.canvas;

      // Mouse Drag to Pan
      cvs.addEventListener('mousedown', (e) => {
        if (e.button === 0 || e.button === 1) { // Left or middle click
          this.isDragging = true;
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
          cvs.style.cursor = 'grabbing';
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
          const dx = e.clientX - this.lastMouseX;
          const dy = e.clientY - this.lastMouseY;
          this.panX += dx;
          this.panY += dy;
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
          this.saveModuleView();
          this.render();
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          cvs.style.cursor = 'grab';
        }
      });

      // Mouse Wheel Zoom centered on cursor
      cvs.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = cvs.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const clampedDelta = Math.max(-100, Math.min(100, e.deltaY));
        const factor = Math.pow(1.0015, -clampedDelta);
        this.setZoomAt(this.zoom * factor, mouseX, mouseY);
      }, { passive: false });

      // Touch Events for Mobile / Tablet Pinch-to-Zoom
      let initialPinchDist = 0;
      let initialZoom = 1.0;
      let lastTouchX = 0;
      let lastTouchY = 0;

      cvs.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.isDragging = true;
          lastTouchX = e.touches[0].clientX;
          lastTouchY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          this.isDragging = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          initialPinchDist = Math.hypot(dx, dy);
          initialZoom = this.zoom;
        }
      }, { passive: true });

      cvs.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && this.isDragging) {
          const dx = e.touches[0].clientX - lastTouchX;
          const dy = e.touches[0].clientY - lastTouchY;
          this.panX += dx;
          this.panY += dy;
          lastTouchX = e.touches[0].clientX;
          lastTouchY = e.touches[0].clientY;
          this.saveModuleView();
          this.render();
        } else if (e.touches.length === 2 && initialPinchDist > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const rect = cvs.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          const scale = dist / initialPinchDist;
          this.setZoomAt(initialZoom * scale, midX, midY);
        }
      }, { passive: true });

      cvs.addEventListener('touchend', () => {
        this.isDragging = false;
        initialPinchDist = 0;
      });

      // HUD Buttons
      const btnZoomIn = document.getElementById('hud-zoom-in');
      const btnZoomOut = document.getElementById('hud-zoom-out');
      const btnZoom1 = document.getElementById('hud-zoom-1');
      const btnZoomFit = document.getElementById('hud-zoom-fit');
      const btnGrid = document.getElementById('hud-grid-toggle');
      const btnFull = document.getElementById('btn-fullscreen');

      if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.setZoomAt(this.zoom * 1.2, this.canvas.width / 2, this.canvas.height / 2));
      if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.setZoomAt(this.zoom / 1.2, this.canvas.width / 2, this.canvas.height / 2));
      if (btnZoom1) btnZoom1.addEventListener('click', () => this.resetView());
      if (btnZoomFit) btnZoomFit.addEventListener('click', () => this.fitView());
      if (btnGrid) btnGrid.addEventListener('click', () => this.toggleGrid());
      if (btnFull) btnFull.addEventListener('click', () => this.toggleFullscreen());

      // ResizeObserver
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => this.resizeCanvas());
        if (this.canvas.parentElement) ro.observe(this.canvas.parentElement);
      }

      // Keyboard Shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.key === '+' || e.key === '=') {
          this.setZoomAt(this.zoom * 1.15, this.canvas.width / 2, this.canvas.height / 2);
        } else if (e.key === '-' || e.key === '_') {
          this.setZoomAt(this.zoom / 1.15, this.canvas.width / 2, this.canvas.height / 2);
        } else if (e.key === '0') {
          this.resetView();
        } else if (e.key === 'f' || e.key === 'F') {
          this.toggleFullscreen();
        } else if (e.key === 'g' || e.key === 'G') {
          this.toggleGrid();
        } else if (e.key === 'Escape' && document.fullscreenElement) {
          document.exitFullscreen();
          setTimeout(() => this.resizeCanvas(), 80);
        }
      });

      document.addEventListener('fullscreenchange', () => {
        setTimeout(() => this.resizeCanvas(), 80);
      });
    }

    startLoop() {
      const loop = (ts) => {
        this.animTime = ts * 0.001;
        this.updateParticles();
        this.render();
        this.animReq = requestAnimationFrame(loop);
      };
      this.animReq = requestAnimationFrame(loop);
    }

    updateParticles() {
      // Determine flow speed from circuit active state
      let speedFactor = 1.0;
      if (this.activeModule === 'thevenin') {
        const c = this.circuitEngine.calculate();
        speedFactor = Math.min(3.0, Math.max(0.1, c.i_total * 0.8));
      } else if (this.activeModule === 'mpt') {
        const m = this.mptEngine.calculate();
        speedFactor = Math.min(3.0, Math.max(0.1, m.il * 1.5));
      } else if (this.activeModule === 'rlc') {
        const r = this.rlcEngine.calculate();
        speedFactor = Math.min(3.0, Math.max(0.1, r.i * 1.2));
      }

      for (const p of this.particles) {
        p.t += p.speed * speedFactor;
        if (p.t > 1.0) {
          p.t = 0;
          p.segment = Math.floor(Math.random() * 8);
        }
      }
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Deep dark canvas background
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      // Dot-Matrix Engineering Grid
      if (this.showGrid) {
        this.drawDotMatrix(w, h);
      }

      // Draw Active Module Circuit Schematic
      if (this.activeModule === 'thevenin') {
        this.drawTheveninSchematic();
      } else if (this.activeModule === 'mpt') {
        this.drawMPTSchematic();
      } else if (this.activeModule === 'rlc') {
        this.drawRLCSchematic();
      }

      ctx.restore();
    }

    drawDotMatrix(w, h) {
      const ctx = this.ctx;
      const spacing = 32;

      // Inverse transform to world coordinates
      const startX = Math.floor((-this.panX / this.zoom) / spacing) * spacing;
      const endX = Math.ceil(((w - this.panX) / this.zoom) / spacing) * spacing;
      const startY = Math.floor((-this.panY / this.zoom) / spacing) * spacing;
      const endY = Math.ceil(((h - this.panY) / this.zoom) / spacing) * spacing;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      for (let x = startX; x <= endX; x += spacing) {
        for (let y = startY; y <= endY; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SCHEMATIC 1: THEVENIN & NORTON (Wheatstone Bridge + Equivalent Circuits)
    // ──────────────────────────────────────────────────────────────────────────
    drawTheveninSchematic() {
      const ctx = this.ctx;
      const c = this.circuitEngine.calculate();

      // Title & Subtitle banner
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('WHEATSTONE BRIDGE NETWORK — THEVENIN & NORTON LABORATORY', 50, 40);
      ctx.font = '11px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Interactive 4-Resistor DC Bridge with Removable Load RL and Dual Split-Screen Comparator', 50, 58);

      // Reference origin for bridge
      const bx = 160;
      const by = 130;

      // Major Nodes:
      // P_top: (320, 130) -> High potential Vs+
      // P_bot: (320, 430) -> Ground 0V
      // Node A: (200, 280) -> Junction R1 & R2
      // Node B: (440, 280) -> Junction R3 & R4
      const pTop = { x: 320, y: 130 };
      const pBot = { x: 320, y: 430 };
      const pA = { x: 200, y: 280 };
      const pB = { x: 440, y: 280 };

      // DC Source branch on the left (x: 100)
      const pVsTop = { x: 100, y: 130 };
      const pVsBot = { x: 100, y: 430 };

      // Wires from Vs to Top and Bot rails
      this.drawWire(pVsTop.x, pVsTop.y, pTop.x, pTop.y, '#38bdf8', 2.5);
      this.drawWire(pVsBot.x, pVsBot.y, pBot.x, pBot.y, '#334155', 2.5);
      this.drawWire(pVsTop.x, pVsTop.y, pVsTop.x, 240, '#38bdf8', 2.5);
      this.drawWire(pVsBot.x, pVsBot.y, pVsBot.x, 320, '#334155', 2.5);

      // DC Voltage Source Symbol at (100, 280)
      this.drawDCSource(100, 280, c.vs, 'Vs');

      // Top rail to Node A (R1) & Node B (R3)
      this.drawWire(pTop.x, pTop.y, pA.x, pTop.y, '#38bdf8', 2.5);
      this.drawWire(pTop.x, pTop.y, pB.x, pTop.y, '#38bdf8', 2.5);
      this.drawResistor(pA.x, pTop.y, pA.x, pA.y, `R1: ${c.r1.toFixed(0)}Ω`, '#38bdf8', false);
      this.drawResistor(pB.x, pTop.y, pB.x, pB.y, `R3: ${c.r3.toFixed(0)}Ω`, '#38bdf8', false);

      // Node A to Bot rail (R2) & Node B to Bot rail (R4)
      this.drawResistor(pA.x, pA.y, pA.x, pBot.y, `R2: ${c.r2.toFixed(0)}Ω`, '#10b981', false);
      this.drawResistor(pB.x, pB.y, pB.x, pBot.y, `R4: ${c.r4.toFixed(0)}Ω`, '#10b981', false);
      this.drawWire(pA.x, pBot.y, pTop.x, pBot.y, '#334155', 2.5);
      this.drawWire(pB.x, pBot.y, pTop.x, pBot.y, '#334155', 2.5);

      // Ground Symbol at pBot
      this.drawGround(pBot.x, pBot.y);

      // Central Load Branch connecting Node A to Node B via Switch S1 & RL
      // Node A -> Switch S2 -> Terminal A -> Switch S1 -> RL -> Terminal B -> Switch S3 -> Node B
      const termA = { x: 250, y: 280 };
      const termB = { x: 390, y: 280 };

      // Wire Node A to Switch S2
      this.drawWire(pA.x, pA.y, termA.x - 15, pA.y, '#38bdf8', 2.0);
      this.drawSwitch(termA.x - 15, pA.y, termA.x, pA.y, c.s2Closed, 'S2 (A)');

      // Wire Node B to Switch S3
      this.drawWire(pB.x, pB.y, termB.x + 15, pB.y, '#38bdf8', 2.0);
      this.drawSwitch(termB.x + 15, pB.y, termB.x, pB.y, c.s3Closed, 'S3 (B)');

      // Terminals A and B circles
      this.drawTerminal(termA.x, termA.y, 'Terminal A', '#f59e0b');
      this.drawTerminal(termB.x, termB.y, 'Terminal B', '#f59e0b');

      // Load Switch S1 and Load Resistor RL
      const wireColor = (c.terminalsConnected && c.s1Closed) ? '#10b981' : '#475569';
      this.drawSwitch(termA.x, termA.y, termA.x + 35, termA.y, c.s1Closed, 'S1 (Load)');
      this.drawResistor(termA.x + 35, termA.y, termB.x, termB.y, `RL: ${c.rl.toFixed(0)}Ω`, wireColor, true);

      // Node Voltage telemetry pills
      this.drawNodeBadge(pA.x, pA.y - 18, `Va = ${c.va.toFixed(2)} V`, '#38bdf8');
      this.drawNodeBadge(pB.x, pB.y - 18, `Vb = ${c.vb.toFixed(2)} V`, '#38bdf8');

      // Live Current Particles flowing along wire segments
      if (c.i_total > 0.001) {
        this.renderCurrentParticles([
          { x1: pVsTop.x, y1: 240, x2: pVsTop.x, y2: pVsTop.y },
          { x1: pVsTop.x, y1: pVsTop.y, x2: pTop.x, y2: pTop.y },
          { x1: pTop.x, y1: pTop.y, x2: pA.x, y2: pTop.y },
          { x1: pA.x, y1: pTop.y, x2: pA.x, y2: pA.y },
          { x1: pA.x, y1: pA.y, x2: pA.x, y2: pBot.y },
          { x1: pTop.x, y1: pTop.y, x2: pB.x, y2: pTop.y },
          { x1: pB.x, y1: pTop.y, x2: pB.x, y2: pB.y },
          { x1: pB.x, y1: pB.y, x2: pB.x, y2: pBot.y },
          ...(c.s1Closed && c.terminalsConnected ? [{ x1: termA.x, y1: termA.y, x2: termB.x, y2: termB.y }] : [])
        ]);
      }

      // ────────────────────────────────────────────────────────────────────────
      // SPLIT-SCREEN COMPARATOR: EXACT THEVENIN & NORTON EQUIVALENTS
      // ────────────────────────────────────────────────────────────────────────
      const eqX = 560;
      const eqY = 120;
      const eqW = 280;
      const eqH = 340;

      // Background Card for Equivalent Circuits
      ctx.fillStyle = 'rgba(11, 19, 41, 0.85)';
      ctx.strokeStyle = '#1c2d54';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(eqX, eqY, eqW, eqH, 8);
      ctx.fill();
      ctx.stroke();

      // Card Header
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('⚡ EXACT THEVENIN EQUIVALENT', eqX + 16, eqY + 26);
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Terminal Equivalence across Nodes A & B', eqX + 16, eqY + 42);

      // Thevenin Circuit: Series Vth -> Rth -> RL
      const thVs = { x: eqX + 50, y: eqY + 130 };
      const thTop = { x: eqX + 50, y: eqY + 75 };
      const thRth = { x: eqX + 140, y: eqY + 75 };
      const thTermA = { x: eqX + 220, y: eqY + 75 };
      const thTermB = { x: eqX + 220, y: eqY + 185 };
      const thBot = { x: eqX + 50, y: eqY + 185 };

      this.drawWire(thTop.x, thTop.y, eqX + 100, thTop.y, '#38bdf8', 2.0);
      this.drawResistor(eqX + 100, thTop.y, thTermA.x, thTop.y, `Rth: ${c.rth.toFixed(1)}Ω`, '#f59e0b', false);
      this.drawWire(thVs.x, thTop.y, thVs.x, thVs.y - 20, '#38bdf8', 2.0);
      this.drawWire(thVs.x, thVs.y + 20, thVs.x, thBot.y, '#334155', 2.0);
      this.drawWire(thBot.x, thBot.y, thTermB.x, thBot.y, '#334155', 2.0);
      this.drawDCSource(thVs.x, thVs.y, c.vth, 'Vth');

      // Connected Load
      this.drawTerminal(thTermA.x, thTermA.y, 'A', '#38bdf8');
      this.drawTerminal(thTermB.x, thTermB.y, 'B', '#334155');
      this.drawResistor(thTermA.x, thTermA.y, thTermB.x, thTermB.y, `RL: ${c.rl.toFixed(0)}Ω`, '#10b981', false);

      // Thevenin vs Original Verification Callout
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`IL = ${c.iload.toFixed(3)} A  |  VL = ${c.vload.toFixed(2)} V`, eqX + 16, eqY + 220);

      // Lower Section: Norton Model Formula
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(eqX + 16, eqY + 235);
      ctx.lineTo(eqX + eqW - 16, eqY + 235);
      ctx.stroke();

      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#c084fc';
      ctx.fillText('NORTON DUAL EQUIVALENT:', eqX + 16, eqY + 258);
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`IN = Vth / Rth = ${c.inorton.toFixed(3)} A`, eqX + 16, eqY + 278);
      ctx.fillText(`RN = Rth       = ${c.rth.toFixed(2)} Ω`, eqX + 16, eqY + 298);
      ctx.fillText(`PL = IL²·RL    = ${c.pload.toFixed(3)} W`, eqX + 16, eqY + 318);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SCHEMATIC 2: MAXIMUM POWER TRANSFER
    // ──────────────────────────────────────────────────────────────────────────
    drawMPTSchematic() {
      const ctx = this.ctx;
      const m = this.mptEngine.calculate();

      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('MAXIMUM POWER TRANSFER THEOREM (JACOBI\'S LAW)', 50, 40);
      ctx.font = '11px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Source Network (Vth, Rth) driving Variable Rheostat Load RL across terminals A-B', 50, 58);

      const cx = 140;
      const cy = 160;

      // Source Card Outline
      ctx.fillStyle = 'rgba(14, 26, 56, 0.4)';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(cx - 30, cy - 40, 260, 260);
      ctx.setLineDash([]);

      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('INTERNAL THEVENIN SOURCE', cx - 20, cy - 24);

      // Thevenin Source Symbol at (cx + 20, cy + 90)
      this.drawDCSource(cx + 20, cy + 90, m.vth, 'Vth');
      this.drawWire(cx + 20, cy, cx + 20, cy + 70, '#38bdf8', 2.5);
      this.drawWire(cx + 20, cy + 110, cx + 20, cy + 180, '#334155', 2.5);

      // Internal Resistor Rth on top rail
      this.drawWire(cx + 20, cy, cx + 70, cy, '#38bdf8', 2.5);
      this.drawResistor(cx + 70, cy, cx + 170, cy, `Rth: ${m.rth.toFixed(1)}Ω`, '#f59e0b', false);
      this.drawWire(cx + 170, cy, cx + 230, cy, '#38bdf8', 2.5);

      // Bottom return wire
      this.drawWire(cx + 20, cy + 180, cx + 230, cy + 180, '#334155', 2.5);

      // Terminals A & B
      const termA = { x: cx + 230, y: cy };
      const termB = { x: cx + 230, y: cy + 180 };
      this.drawTerminal(termA.x, termA.y, 'Terminal A', '#38bdf8');
      this.drawTerminal(termB.x, termB.y, 'Terminal B', '#334155');

      // Rheostat Load RL on the right
      const loadX = cx + 330;
      this.drawWire(termA.x, termA.y, loadX, cy, '#38bdf8', 2.5);
      this.drawWire(termB.x, termB.y, loadX, cy + 180, '#334155', 2.5);

      // Variable Rheostat Symbol
      this.drawRheostat(loadX, cy, loadX, cy + 180, `RL: ${m.rl.toFixed(1)}Ω`, '#10b981');

      // Animated Particles flowing around the loop
      if (m.il > 0.01) {
        this.renderCurrentParticles([
          { x1: cx + 20, y1: cy + 70, x2: cx + 20, y2: cy },
          { x1: cx + 20, y1: cy, x2: cx + 70, y2: cy },
          { x1: cx + 170, y1: cy, x2: loadX, y2: cy },
          { x1: loadX, y1: cy, x2: loadX, y2: cy + 180 },
          { x1: loadX, y1: cy + 180, x2: cx + 20, y2: cy + 180 },
          { x1: cx + 20, y1: cy + 180, x2: cx + 20, y2: cy + 110 }
        ]);
      }

      // Telemetry & Benchmark Comparison Dashboard
      const dashX = 540;
      const dashY = 120;
      const dashW = 300;
      const dashH = 340;

      ctx.fillStyle = 'rgba(11, 19, 41, 0.9)';
      ctx.strokeStyle = '#1c2d54';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(dashX, dashY, dashW, dashH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('📊 REAL-TIME MPT TELEMETRY', dashX + 16, dashY + 26);

      const items = [
        { label: 'Current Load RL:', val: `${m.rl.toFixed(2)} Ω`, color: '#38bdf8' },
        { label: 'Internal Rth:', val: `${m.rth.toFixed(2)} Ω`, color: '#f59e0b' },
        { label: 'Load Voltage VL:', val: `${m.vl.toFixed(2)} V`, color: '#e2e8f0' },
        { label: 'Load Current IL:', val: `${m.il.toFixed(3)} A`, color: '#e2e8f0' },
        { label: 'Load Power PL:', val: `${m.pl.toFixed(3)} W`, color: '#10b981' },
        { label: 'Max Power Pmax:', val: `${m.pmax.toFixed(3)} W`, color: '#f43f5e' },
        { label: 'Source Efficiency η:', val: `${m.eta.toFixed(1)} %`, color: m.eta > 48 && m.eta < 52 ? '#10b981' : '#f59e0b' }
      ];

      items.forEach((item, idx) => {
        const rowY = dashY + 60 + idx * 30;
        ctx.font = '11px "Inter", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(item.label, dashX + 16, rowY);
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.fillStyle = item.color;
        ctx.fillText(item.val, dashX + 180, rowY);
      });

      // Status indicator pill
      const isMatched = Math.abs(m.rl - m.rth) < 0.2;
      ctx.beginPath();
      ctx.roundRect(dashX + 16, dashY + 280, dashW - 32, 40, 6);
      ctx.fillStyle = isMatched ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)';
      ctx.strokeStyle = isMatched ? '#10b981' : '#334155';
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = isMatched ? '#10b981' : '#94a3b8';
      ctx.fillText(isMatched ? '✓ IMPEDANCE MATCHED (PL = Pmax, η = 50%)' : 'MISMATCHED (Adjust RL Slider to Match Rth)', dashX + 26, dashY + 305);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SCHEMATIC 3: RLC SERIES AC RESONANCE
    // ──────────────────────────────────────────────────────────────────────────
    drawRLCSchematic() {
      const ctx = this.ctx;
      const r = this.rlcEngine.calculate();

      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('R-L-C SERIES AC RESONANCE TANK CIRCUIT', 50, 40);
      ctx.font = '11px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Sinusoidal AC Generator driving Series R, L and C with Voltage Magnification Telemetry', 50, 58);

      const ax = 120;
      const ay = 150;

      // AC Generator on the left
      this.drawACSource(ax, ay + 100, r.vrms, r.f);

      // Top Rail Wire to Components
      this.drawWire(ax, ay, ax + 80, ay, '#38bdf8', 2.5);
      this.drawWire(ax, ay + 200, ax + 80, ay + 200, '#334155', 2.5);

      // Component 1: Resistor R
      this.drawResistor(ax + 80, ay, ax + 190, ay, `R: ${r.r.toFixed(1)}Ω`, '#38bdf8', false);
      this.drawWire(ax + 190, ay, ax + 230, ay, '#38bdf8', 2.5);

      // Component 2: Inductor Coil L
      this.drawInductor(ax + 230, ay, ax + 350, ay, `L: ${this.rlcEngine.l_mH.toFixed(2)}mH`, '#f59e0b');
      this.drawWire(ax + 350, ay, ax + 390, ay, '#38bdf8', 2.5);

      // Component 3: Capacitor Plates C
      this.drawCapacitor(ax + 390, ay, ax + 490, ay, `C: ${this.rlcEngine.c_uF.toFixed(2)}μF`, '#f43f5e');

      // Right return loop down to bottom rail
      this.drawWire(ax + 490, ay, ax + 540, ay, '#38bdf8', 2.5);
      this.drawWire(ax + 540, ay, ax + 540, ay + 200, '#334155', 2.5);
      this.drawWire(ax + 540, ay + 200, ax, ay + 200, '#334155', 2.5);

      // Bottom rail ground connection
      this.drawGround(ax + 270, ay + 200);

      // Animated Bidirectional AC Current Pulsing
      if (r.i > 0.01) {
        this.renderCurrentParticles([
          { x1: ax, y1: ay + 80, x2: ax, y2: ay },
          { x1: ax, y1: ay, x2: ax + 80, y2: ay },
          { x1: ax + 190, y1: ay, x2: ax + 230, y2: ay },
          { x1: ax + 350, y1: ay, x2: ax + 390, y2: ay },
          { x1: ax + 490, y1: ay, x2: ax + 540, y2: ay },
          { x1: ax + 540, y1: ay, x2: ax + 540, y2: ay + 200 },
          { x1: ax + 540, y1: ay + 200, x2: ax, y2: ay + 200 }
        ]);
      }

      // Live Voltage Across Components Callouts
      this.drawNodeBadge(ax + 135, ay - 24, `VR = ${r.vr.toFixed(2)} V`, '#38bdf8');
      this.drawNodeBadge(ax + 290, ay - 24, `VL = ${r.vl.toFixed(2)} V`, '#f59e0b');
      this.drawNodeBadge(ax + 440, ay - 24, `VC = ${r.vc.toFixed(2)} V`, '#f43f5e');

      // Right-side Resonance Characteristics Card
      const cardX = 570;
      const cardY = 120;
      const cardW = 280;
      const cardH = 350;

      ctx.fillStyle = 'rgba(11, 19, 41, 0.9)';
      ctx.strokeStyle = r.isResonant ? '#10b981' : '#1c2d54';
      ctx.lineWidth = r.isResonant ? 2.0 : 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = r.isResonant ? '#10b981' : '#38bdf8';
      ctx.fillText(r.isResonant ? '★ RESONANCE PEAK ACTIVE' : '〰 RLC TELEMETRY', cardX + 16, cardY + 26);

      const rows = [
        { label: 'Current Freq f:', val: `${r.f.toFixed(1)} Hz`, col: '#38bdf8' },
        { label: 'Resonant Freq fr:', val: `${r.fr.toFixed(1)} Hz`, col: '#10b981' },
        { label: 'Inductive XL:', val: `${r.xl.toFixed(2)} Ω`, col: '#f59e0b' },
        { label: 'Capacitive XC:', val: `${r.xc.toFixed(2)} Ω`, col: '#f43f5e' },
        { label: 'Net Reactance X:', val: `${r.x_net.toFixed(2)} Ω`, col: '#e2e8f0' },
        { label: 'Impedance |Z|:', val: `${r.z_mag.toFixed(2)} Ω`, col: '#38bdf8' },
        { label: 'Current I (rms):', val: `${r.i.toFixed(3)} A`, col: '#10b981' },
        { label: 'Quality Factor Q:', val: `${r.q.toFixed(2)}`, col: '#c084fc' },
        { label: 'Bandwidth BW:', val: `${r.bw.toFixed(1)} Hz`, col: '#e2e8f0' },
        { label: 'Phase Angle θ:', val: `${r.phaseDeg.toFixed(1)}°`, col: '#f59e0b' }
      ];

      rows.forEach((row, idx) => {
        const ry = cardY + 54 + idx * 26;
        ctx.font = '11px "Inter", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(row.label, cardX + 16, ry);
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillStyle = row.col;
        ctx.fillText(row.val, cardX + 165, ry);
      });

      // Voltage magnification warning
      if (r.vl > r.vs * 1.5) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.roundRect(cardX + 12, cardY + 312, cardW - 24, 26, 4);
        ctx.fill();
        ctx.stroke();
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f43f5e';
        ctx.fillText(`⚡ Q-MAGNIFICATION: VL=VC=${r.vl.toFixed(1)}V > Vs`, cardX + 18, cardY + 329);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SCHEMATIC DRAWING PRIMITIVES
    // ──────────────────────────────────────────────────────────────────────────
    drawWire(x1, y1, x2, y2, color = '#38bdf8', width = 2.0) {
      const ctx = this.ctx;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    drawResistor(x1, y1, x2, y2, label = '', color = '#38bdf8', isVariable = false) {
      const ctx = this.ctx;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);

      // Lead in
      const bodyLen = 50;
      const leadLen = (len - bodyLen) / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(leadLen, 0);

      // Zig-zag teeth
      const teeth = 6;
      const toothStep = bodyLen / teeth;
      const amp = 8;
      for (let i = 0; i < teeth; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        ctx.lineTo(leadLen + (i + 0.5) * toothStep, sign * amp);
      }
      ctx.lineTo(leadLen + bodyLen, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      // Rheostat diagonal arrow
      if (isVariable) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(leadLen - 4, amp + 8);
        ctx.lineTo(leadLen + bodyLen + 8, -amp - 8);
        ctx.stroke();
        // Arrowhead
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(leadLen + bodyLen + 8, -amp - 8);
        ctx.lineTo(leadLen + bodyLen + 2, -amp - 5);
        ctx.lineTo(leadLen + bodyLen + 6, -amp - 1);
        ctx.fill();
      }

      // Label
      if (label) {
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(label, leadLen - 6, -amp - 6);
      }

      ctx.restore();
    }

    drawRheostat(x1, y1, x2, y2, label = '', color = '#10b981') {
      this.drawResistor(x1, y1, x2, y2, label, color, true);
    }

    drawInductor(x1, y1, x2, y2, label = '', color = '#f59e0b') {
      const ctx = this.ctx;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);

      const bodyLen = 60;
      const leadLen = (len - bodyLen) / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(leadLen, 0);

      // 4 semicircular loops
      const loops = 4;
      const radius = (bodyLen / loops) / 2;
      for (let i = 0; i < loops; i++) {
        const cx = leadLen + (i * 2 + 1) * radius;
        ctx.arc(cx, 0, radius, Math.PI, 0, false);
      }
      ctx.lineTo(len, 0);
      ctx.stroke();

      if (label) {
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fcd34d';
        ctx.fillText(label, leadLen, -radius - 6);
      }

      ctx.restore();
    }

    drawCapacitor(x1, y1, x2, y2, label = '', color = '#f43f5e') {
      const ctx = this.ctx;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);

      const mid = len / 2;
      const gap = 8;
      const plateH = 24;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;

      // Left lead & plate
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(mid - gap / 2, 0);
      ctx.moveTo(mid - gap / 2, -plateH / 2);
      ctx.lineTo(mid - gap / 2, plateH / 2);

      // Right plate & lead
      ctx.moveTo(mid + gap / 2, -plateH / 2);
      ctx.lineTo(mid + gap / 2, plateH / 2);
      ctx.moveTo(mid + gap / 2, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      if (label) {
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fda4af';
        ctx.fillText(label, mid - 20, -plateH / 2 - 6);
      }

      ctx.restore();
    }

    drawDCSource(x, y, voltage, label = 'Vs') {
      const ctx = this.ctx;
      const r = 20;

      ctx.fillStyle = '#0b1329';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Polarities
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('+', x - 5, y - 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('−', x - 5, y + 12);

      // Label callout
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${label}: ${voltage.toFixed(1)}V`, x - 35, y - 26);
    }

    drawACSource(x, y, vrms, freq) {
      const ctx = this.ctx;
      const r = 22;

      ctx.fillStyle = '#0b1329';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sine wave symbol inside
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let t = -12; t <= 12; t++) {
        const sy = Math.sin((t / 12) * Math.PI) * 7;
        if (t === -12) ctx.moveTo(x + t, y - sy);
        else ctx.lineTo(x + t, y - sy);
      }
      ctx.stroke();

      // Label
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`AC: ${vrms.toFixed(1)}V`, x - 32, y - 28);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${freq.toFixed(0)}Hz`, x - 18, y + 36);
    }

    drawSwitch(x1, y1, x2, y2, isClosed, label = '') {
      const ctx = this.ctx;
      const r = 3.5;

      // Terminal dots
      ctx.fillStyle = isClosed ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.arc(x2, y2, r, 0, Math.PI * 2);
      ctx.fill();

      // Blade
      ctx.strokeStyle = isClosed ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      if (isClosed) {
        ctx.lineTo(x2, y2);
      } else {
        // Angled open blade
        ctx.lineTo(x1 + (x2 - x1) * 0.8, y1 - 18);
      }
      ctx.stroke();

      if (label) {
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = isClosed ? '#10b981' : '#f59e0b';
        ctx.fillText(label, x1, y1 - 8);
      }
    }

    drawTerminal(x, y, label, color = '#f59e0b') {
      const ctx = this.ctx;
      ctx.fillStyle = '#020712';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(label, x - 15, y + 18);
    }

    drawGround(x, y) {
      const ctx = this.ctx;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 10);
      // Three horizontal bars
      ctx.moveTo(x - 12, y + 10);
      ctx.lineTo(x + 12, y + 10);
      ctx.moveTo(x - 7, y + 14);
      ctx.lineTo(x + 7, y + 14);
      ctx.moveTo(x - 2, y + 18);
      ctx.lineTo(x + 2, y + 18);
      ctx.stroke();
    }

    drawNodeBadge(x, y, text, color = '#38bdf8') {
      const ctx = this.ctx;
      ctx.font = '700 10px "JetBrains Mono", monospace';
      const tw = ctx.measureText(text).width;
      const pad = 5;

      ctx.fillStyle = 'rgba(11, 19, 41, 0.9)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - pad, y - 10, tw + pad * 2, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.fillText(text, x - tw / 2, y + 3);
    }

    renderCurrentParticles(segments) {
      if (!segments || segments.length === 0) return;
      const ctx = this.ctx;

      for (const p of this.particles) {
        const seg = segments[p.segment % segments.length];
        if (!seg) continue;
        const px = seg.x1 + (seg.x2 - seg.x1) * p.t;
        const py = seg.y1 + (seg.y2 - seg.y1) * p.t;

        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 7. RIGHT-PANEL GRAPH RENDERERS
  // ════════════════════════════════════════════════════════════════════════════

  // TAB 2: Maximum Power Transfer P(RL) & Efficiency Curve
  class MPTGraphRenderer {
    constructor(canvasId, mptEngine) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.mptEngine = mptEngine;
    }

    render() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark background
      ctx.fillStyle = '#050b17';
      ctx.fillRect(0, 0, w, h);

      const margin = { top: 25, right: 45, bottom: 35, left: 45 };
      const plotW = w - margin.left - margin.right;
      const plotH = h - margin.top - margin.bottom;

      const sweep = this.mptEngine.sweep(180);
      const opt = this.mptEngine.calculate();

      // Peak power for scaling Y
      const maxP = Math.max(0.5, opt.pmax * 1.25);
      const maxRL = sweep[sweep.length - 1].rl;

      // Coordinate transformers
      const xToPixel = (rl) => margin.left + (rl / maxRL) * plotW;
      const pToPixel = (p) => margin.top + plotH - (p / maxP) * plotH;
      const etaToPixel = (eta) => margin.top + plotH - (eta / 100) * plotH;

      // Grid Lines
      ctx.strokeStyle = '#162547';
      ctx.lineWidth = 1.0;
      for (let pStep = 0; pStep <= maxP; pStep += maxP / 4) {
        const y = pToPixel(pStep);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + plotW, y);
        ctx.stroke();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(pStep.toFixed(2), 6, y + 3);
      }

      // Efficiency Y-axis on right
      for (let etaStep = 0; etaStep <= 100; etaStep += 25) {
        const y = etaToPixel(etaStep);
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`${etaStep}%`, margin.left + plotW + 6, y + 3);
      }

      // Curve 1: Power P(RL) (Cyan Bell Curve)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      sweep.forEach((pt, idx) => {
        const x = xToPixel(pt.rl);
        const y = pToPixel(pt.pl);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Curve 2: Efficiency η(RL) (Amber Rising Curve)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      sweep.forEach((pt, idx) => {
        const x = xToPixel(pt.rl);
        const y = etaToPixel(pt.eta);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Vertical Marker at RL = Rth (Optimal Peak)
      const optX = xToPixel(opt.rlOpt);
      const optY = pToPixel(opt.pmax);

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(optX, margin.top);
      ctx.lineTo(optX, margin.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Peak Highlight Circle
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(optX, optY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Annotations
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Pmax = ${opt.pmax.toFixed(2)} W`, optX + 8, optY - 6);

      // Current Slider Position Marker
      const curX = xToPixel(opt.rl);
      const curY = pToPixel(opt.pl);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Legend
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('■ Power PL (W)', margin.left + 10, margin.top + 15);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('■ Efficiency η (%)', margin.left + 110, margin.top + 15);
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('--- Rth (Optimal)', margin.left + 230, margin.top + 15);
    }
  }

  // TAB 3: RLC Resonance Curve
  class ResonanceCurveRenderer {
    constructor(canvasId, rlcEngine) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.rlcEngine = rlcEngine;
    }

    render() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.fillStyle = '#050b17';
      ctx.fillRect(0, 0, w, h);

      const margin = { top: 25, right: 35, bottom: 35, left: 45 };
      const plotW = w - margin.left - margin.right;
      const plotH = h - margin.top - margin.bottom;

      const sweep = this.rlcEngine.sweep(250);
      const cur = this.rlcEngine.calculate();
      const points = sweep.points;
      const maxI = Math.max(0.1, sweep.imax * 1.15);

      const xToPixel = (f) => margin.left + ((f - sweep.fMin) / (sweep.fMax - sweep.fMin)) * plotW;
      const yToPixel = (i) => margin.top + plotH - (i / maxI) * plotH;

      // Grid Lines
      ctx.strokeStyle = '#162547';
      ctx.lineWidth = 1.0;
      for (let iStep = 0; iStep <= maxI; iStep += maxI / 4) {
        const y = yToPixel(iStep);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + plotW, y);
        ctx.stroke();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(iStep.toFixed(2), 6, y + 3);
      }

      // -3dB Half-Power Line (I = Imax / sqrt(2))
      const halfPowerI = sweep.imax / Math.SQRT2;
      const halfY = yToPixel(halfPowerI);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(margin.left, halfY);
      ctx.lineTo(margin.left + plotW, halfY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('-3dB (0.707 Imax)', margin.left + plotW - 95, halfY - 4);

      // Resonance Curve (Current vs Frequency)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      points.forEach((pt, idx) => {
        const x = xToPixel(pt.f);
        const y = yToPixel(pt.i);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Vertical Marker at Resonant Frequency fr
      const frX = xToPixel(sweep.fr);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(frX, margin.top);
      ctx.lineTo(frX, margin.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Peak Circle
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(frX, yToPixel(sweep.imax), 5, 0, Math.PI * 2);
      ctx.fill();

      // Current Operating Point
      const curX = xToPixel(cur.f);
      const curY = yToPixel(cur.i);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Text Annotations
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`fr = ${sweep.fr.toFixed(0)} Hz`, frX + 6, margin.top + 15);
      ctx.fillText(`Imax = ${sweep.imax.toFixed(2)} A`, frX + 6, margin.top + 28);

      // Half-power points f1, f2
      const resProps = this.rlcEngine.getResonanceProperties();
      const f1X = xToPixel(resProps.f1);
      const f2X = xToPixel(resProps.f2);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(f1X, halfY, 3.5, 0, Math.PI * 2);
      ctx.arc(f2X, halfY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillText(`f1=${resProps.f1.toFixed(0)}`, f1X - 25, halfY + 14);
      ctx.fillText(`f2=${resProps.f2.toFixed(0)}`, f2X + 4, halfY + 14);
    }
  }

  // TAB 4: Dual-Trace Oscilloscope
  class OscilloscopeRenderer {
    constructor(canvasId, rlcEngine) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.rlcEngine = rlcEngine;
      this.timeOffset = 0;
    }

    render() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark CRT Screen Background
      ctx.fillStyle = '#010810';
      ctx.fillRect(0, 0, w, h);

      // CRT Graticule: 10 Divs H x 8 Divs V
      const divW = w / 10;
      const divH = h / 8;

      ctx.strokeStyle = '#0c1a2e';
      ctx.lineWidth = 1.0;
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * divW, 0);
        ctx.lineTo(i * divW, h);
        ctx.stroke();
      }
      for (let j = 0; j <= 8; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * divH);
        ctx.lineTo(w, j * divH);
        ctx.stroke();
      }

      // Center crosshairs with subdivision tick marks
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const r = this.rlcEngine.calculate();
      const centerY = h / 2;

      // Time Scale: show 2 full cycles of current frequency
      const f = r.f;
      const period = 1 / f;
      const totalTime = period * 2;

      this.timeOffset += 0.0005;

      // Channel 1: Source Voltage Vs (Yellow Trace)
      const vScale = divH * 1.5; // pixels per volt relative to Vrms
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let px = 0; px < w; px++) {
        const t = (px / w) * totalTime + this.timeOffset;
        const vs_t = Math.sin(2 * Math.PI * f * t);
        const y = centerY - vs_t * vScale;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // Channel 2: Circuit Current I / Resistor Voltage VR (Cyan Trace)
      // Phase shifted by theta
      const phaseRad = r.phaseRad;
      const iScale = divH * 1.8;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let px = 0; px < w; px++) {
        const t = (px / w) * totalTime + this.timeOffset;
        const i_t = Math.sin(2 * Math.PI * f * t - phaseRad);
        const y = centerY - i_t * iScale;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // On-Screen Readout Badges
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`CH1: Vs = ${r.vrms.toFixed(1)} V (rms)`, 12, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`CH2: I = ${r.i.toFixed(3)} A | θ = ${r.phaseDeg.toFixed(1)}°`, 12, 34);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`TIME: ${(period * 1000).toFixed(2)} ms/cycle`, w - 160, 18);
    }
  }

  // TAB 5: Rotating Phasor Diagram in Complex Plane
  class PhasorRenderer {
    constructor(canvasId, rlcEngine) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.rlcEngine = rlcEngine;
      this.rotationAngle = 0;
    }

    render() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.fillStyle = '#050b17';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) - 30;

      // Complex Plane Polar Grid
      ctx.strokeStyle = '#162547';
      ctx.lineWidth = 1.0;
      for (let rad = maxR / 3; rad <= maxR; rad += maxR / 3) {
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Re and Im Axes
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - maxR - 10, cy);
      ctx.lineTo(cx + maxR + 10, cy);
      ctx.moveTo(cx, cy - maxR - 10);
      ctx.lineTo(cx, cy + maxR + 10);
      ctx.stroke();

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('+Re (0°)', cx + maxR - 25, cy + 14);
      ctx.fillText('+j Im (90°)', cx + 6, cy - maxR);

      const r = this.rlcEngine.calculate();
      const phasors = this.rlcEngine.getPhasors();

      // Normalize maximum phasor length
      const maxMag = Math.max(r.vs, r.vl, r.vc, r.vr, 1.0);
      const scale = maxR / maxMag;

      // Slow continuous rotation
      this.rotationAngle += 0.008;

      // Draw Phasor Vectors:
      // I: reference along 0° (White)
      this.drawVector(cx, cy, phasors.i.deg, phasors.i.mag * (maxR / Math.max(r.i, 0.5)) * 0.8, '#ffffff', `I (${r.i.toFixed(2)}A)`);

      // VR: in phase with I (Cyan)
      this.drawVector(cx, cy, phasors.vr.deg, phasors.vr.mag * scale, '#38bdf8', `VR (${r.vr.toFixed(1)}V)`);

      // VL: leading by +90° (Amber)
      this.drawVector(cx, cy, phasors.vl.deg, phasors.vl.mag * scale, '#f59e0b', `VL (${r.vl.toFixed(1)}V)`);

      // VC: lagging by -90° (Rose)
      this.drawVector(cx, cy, phasors.vc.deg, phasors.vc.mag * scale, '#f43f5e', `VC (${r.vc.toFixed(1)}V)`);

      // Resultant Vs (Green)
      this.drawVector(cx, cy, phasors.vs.deg, phasors.vs.mag * scale, '#10b981', `Vs (${r.vs.toFixed(1)}V, ${r.phaseDeg.toFixed(0)}°)`);
    }

    drawVector(cx, cy, deg, length, color, label) {
      const ctx = this.ctx;
      const rad = (deg * Math.PI) / 180;
      const targetX = cx + Math.cos(rad) * length;
      const targetY = cy - Math.sin(rad) * length; // canvas Y is inverted

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Arrowhead
      const headLen = 8;
      const arrowAngle = Math.atan2(targetY - cy, targetX - cx);
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(
        targetX - headLen * Math.cos(arrowAngle - Math.PI / 7),
        targetY - headLen * Math.sin(arrowAngle - Math.PI / 7)
      );
      ctx.lineTo(
        targetX - headLen * Math.cos(arrowAngle + Math.PI / 7),
        targetY - headLen * Math.sin(arrowAngle + Math.PI / 7)
      );
      ctx.fill();

      // Label
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillText(label, targetX + 5, targetY - 4);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 8. 3D WEBGL HARDWARE MODEL (Three.js r128 & OrbitControls)
  // ════════════════════════════════════════════════════════════════════════════
  class ThreeJSModel {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas || !window.THREE) return;

      this.scene = new window.THREE.Scene();
      this.scene.background = new window.THREE.Color(0x020712);

      const w = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 800;
      const h = 480;
      this.camera = new window.THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      this.camera.position.set(0, 35, 60);

      this.renderer = new window.THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);

      if (window.THREE.OrbitControls) {
        this.controls = new window.THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
      }

      this.initLighting();
      this.buildCircuitComponents();
      this.initInteraction();
      this.startLoop();
    }

    initLighting() {
      const ambient = new window.THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambient);

      const dirLight = new window.THREE.DirectionalLight(0x38bdf8, 0.8);
      dirLight.position.set(20, 40, 20);
      this.scene.add(dirLight);

      const dirLight2 = new window.THREE.DirectionalLight(0x10b981, 0.4);
      dirLight2.position.set(-20, 20, -20);
      this.scene.add(dirLight2);
    }

    buildCircuitComponents() {
      this.components = [];

      // 1. Solderless Breadboard Base
      const bbGeo = new window.THREE.BoxGeometry(40, 2, 25);
      const bbMat = new window.THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.7,
        metalness: 0.1
      });
      const breadboard = new window.THREE.Mesh(bbGeo, bbMat);
      breadboard.position.set(0, 0, 0);
      breadboard.name = 'breadboard';
      this.scene.add(breadboard);
      this.components.push(breadboard);

      // Power Rails (+/- stripes)
      const railMatRed = new window.THREE.MeshBasicMaterial({ color: 0xef4444 });
      const railMatBlue = new window.THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const railGeo = new window.THREE.BoxGeometry(38, 0.1, 0.8);

      const railRed1 = new window.THREE.Mesh(railGeo, railMatRed);
      railRed1.position.set(0, 1.05, -11);
      this.scene.add(railRed1);

      const railBlue1 = new window.THREE.Mesh(railGeo, railMatBlue);
      railBlue1.position.set(0, 1.05, -9.5);
      this.scene.add(railBlue1);

      // 2. Inductor Coil (Copper Windings)
      const indGroup = new window.THREE.Group();
      indGroup.name = 'inductor';
      const toroidGeo = new window.THREE.TorusGeometry(3.5, 1.2, 16, 40);
      const copperMat = new window.THREE.MeshStandardMaterial({
        color: 0xb45309,
        metalness: 0.85,
        roughness: 0.25
      });
      const toroid = new window.THREE.Mesh(toroidGeo, copperMat);
      toroid.rotation.x = Math.PI / 2;
      toroid.position.y = 3.5;
      indGroup.add(toroid);
      indGroup.position.set(-10, 1, 0);
      this.scene.add(indGroup);
      this.components.push(indGroup);

      // 3. Electrolytic Capacitor (Aluminum Canister)
      const capGroup = new window.THREE.Group();
      capGroup.name = 'capacitor';
      const capGeo = new window.THREE.CylinderGeometry(2.5, 2.5, 8, 32);
      const capMat = new window.THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        metalness: 0.6,
        roughness: 0.3
      });
      const capMesh = new window.THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 5;
      capGroup.add(capMesh);
      capGroup.position.set(2, 1, 0);
      this.scene.add(capGroup);
      this.components.push(capGroup);

      // 4. Ceramic Wirewound Rheostat
      const rheoGroup = new window.THREE.Group();
      rheoGroup.name = 'rheostat';
      const rheoBodyGeo = new window.THREE.BoxGeometry(12, 4, 5);
      const rheoMat = new window.THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.5,
        roughness: 0.5
      });
      const rheoBody = new window.THREE.Mesh(rheoBodyGeo, rheoMat);
      rheoBody.position.y = 3;
      rheoGroup.add(rheoBody);

      // Slider Wiper Collar
      const wiperGeo = new window.THREE.BoxGeometry(2, 4.5, 5.5);
      const wiperMat = new window.THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.9,
        roughness: 0.2
      });
      const wiper = new window.THREE.Mesh(wiperGeo, wiperMat);
      wiper.position.set(0, 3, 0);
      rheoGroup.add(wiper);

      rheoGroup.position.set(12, 1, 0);
      this.scene.add(rheoGroup);
      this.components.push(rheoGroup);
    }

    initInteraction() {
      const raycaster = new window.THREE.Raycaster();
      const mouse = new window.THREE.Vector2();

      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
          let target = intersects[0].object;
          while (target.parent && target.parent !== this.scene && !target.name) {
            target = target.parent;
          }
          const name = target.name || (target.parent ? target.parent.name : '');
          this.inspectComponent(name);
        }
      });

      // Quick Nav Buttons
      const quickBtns = document.querySelectorAll('.quick-nav-btn');
      quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          quickBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const target = btn.dataset.target;
          this.focusOn(target);
          this.inspectComponent(target);
        });
      });

      const btnReset = document.getElementById('btn-3d-reset');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          this.camera.position.set(0, 35, 60);
          if (this.controls) this.controls.target.set(0, 0, 0);
        });
      }
    }

    focusOn(targetName) {
      if (!this.controls) return;
      const targets = {
        breadboard: { pos: [0, 35, 60], look: [0, 0, 0] },
        inductor: { pos: [-10, 15, 25], look: [-10, 3, 0] },
        capacitor: { pos: [2, 15, 25], look: [2, 5, 0] },
        rheostat: { pos: [12, 15, 25], look: [12, 3, 0] }
      };

      const t = targets[targetName];
      if (t) {
        if (window.anime) {
          window.anime({
            targets: this.camera.position,
            x: t.pos[0],
            y: t.pos[1],
            z: t.pos[2],
            duration: 800,
            easing: 'spring(1, 80, 10, 0)'
          });
        } else {
          this.camera.position.set(...t.pos);
        }
        this.controls.target.set(...t.look);
      }
    }

    inspectComponent(name) {
      const aside = document.getElementById('sim3d-components');
      if (!aside) return;

      const specs = {
        breadboard: {
          title: 'Solderless Breadboard (830 Tie-Points)',
          desc: 'High-durability ABS prototyping base with phosphor bronze nickel-plated spring clips. Features dual positive/negative power distribution distribution rails and central IC dual inline spacing.',
          params: [
            { k: 'Max Voltage', v: '300 V DC/AC' },
            { k: 'Current Rating', v: '2.5 A Continuous' },
            { k: 'Contact Resistance', v: '< 10 mΩ' },
            { k: 'Hole Pitch', v: '2.54 mm (0.1 inch)' }
          ]
        },
        inductor: {
          title: 'Toroidal Ferrite Core Inductor (25.33 mH)',
          desc: 'High-Q low-DCR magnetic coil wound with enameled OFC copper wire over a high-permeability powdered iron toroid. Minimizes external flux leakage and maintains stability across AC resonance sweeps.',
          params: [
            { k: 'Inductance L', v: '25.33 mH ± 2%' },
            { k: 'DC Resistance DCR', v: '0.85 Ω' },
            { k: 'Self-Resonant Freq', v: '180 kHz' },
            { k: 'Saturation Current', v: '3.2 A' }
          ]
        },
        capacitor: {
          title: 'Polypropylene Film Capacitor (1.00 μF)',
          desc: 'Low-loss non-inductive metalized film capacitor designed for precision filtering and AC resonant tank circuits. Exhibits ultra-low Equivalent Series Resistance (ESR) and high dielectric breakdown rating.',
          params: [
            { k: 'Capacitance C', v: '1.00 μF ± 1%' },
            { k: 'Voltage Rating', v: '100 V DC / 63 V AC' },
            { k: 'ESR @ 1 kHz', v: '0.04 Ω' },
            { k: 'Dissipation Factor', v: '< 0.0005' }
          ]
        },
        rheostat: {
          title: 'Ceramic Slide Wirewound Rheostat (0–100 Ω)',
          desc: 'Heavy-duty laboratory rheostat wound with high-resistivity constantan wire over an insulated vitreous ceramic tube. Spring-loaded bronze wiper ensures positive terminal contact across continuous load sweeps.',
          params: [
            { k: 'Max Resistance', v: '100.0 Ω' },
            { k: 'Power Rating', v: '150 Watts' },
            { k: 'Max Current', v: '1.25 A' },
            { k: 'Resolution', v: 'Continuous Wiper' }
          ]
        }
      };

      const data = specs[name] || specs.breadboard;
      aside.innerHTML = `
        <div style="background:#0b1329; border:1px solid #1c2d54; border-radius:8px; padding:14px;">
          <h3 style="color:#38bdf8; font-size:1.05rem; margin-bottom:6px;">${data.title}</h3>
          <p style="color:#94a3b8; font-size:0.8rem; line-height:1.5; margin-bottom:12px;">${data.desc}</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${data.params.map(p => `
              <div style="background:#050b17; border:1px solid #162547; border-radius:6px; padding:6px 10px;">
                <span style="font-size:0.7rem; color:#64748b; text-transform:uppercase; display:block;">${p.k}</span>
                <strong style="font-size:0.85rem; color:#10b981; font-family:'JetBrains Mono',monospace;">${p.v}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    startLoop() {
      const render = () => {
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 9. CERTIFICATION QUIZ ENGINE (10 Comprehensive Questions)
  // ════════════════════════════════════════════════════════════════════════════
  class QuizEngine {
    constructor() {
      this.questions = [
        {
          id: 1,
          q: "In a Wheatstone bridge with Vs = 24 V, R1 = 10 Ω, R2 = 20 Ω, R3 = 30 Ω, and R4 = 15 Ω, what is the Thevenin open-circuit voltage Vth across terminals A and B?",
          options: [
            "Vth = 8.00 V",
            "Vth = 12.00 V",
            "Vth = 16.00 V",
            "Vth = 0.00 V"
          ],
          correct: 0,
          explanation: "Va = 24 × (20 / 30) = 16 V; Vb = 24 × (15 / 45) = 8 V. Therefore, Vth = Va - Vb = 16 V - 8 V = 8.00 V."
        },
        {
          id: 2,
          q: "For the same bridge circuit with Vs deactivated (short-circuited), what is the Thevenin equivalent resistance Rth seen from terminals A and B?",
          options: [
            "Rth = 16.67 Ω",
            "Rth = 30.00 Ω",
            "Rth = 10.00 Ω",
            "Rth = 75.00 Ω"
          ],
          correct: 0,
          explanation: "Rth = (R1 || R2) + (R3 || R4) = (10×20/30) + (30×15/45) = 6.667 Ω + 10.000 Ω = 16.67 Ω."
        },
        {
          id: 3,
          q: "What is the corresponding Norton short-circuit current IN for a network having Vth = 8.0 V and Rth = 16.67 Ω?",
          options: [
            "IN = 0.48 A",
            "IN = 2.08 A",
            "IN = 1.33 A",
            "IN = 0.24 A"
          ],
          correct: 0,
          explanation: "By source transformation, IN = Vth / Rth = 8.0 V / 16.667 Ω = 0.480 A."
        },
        {
          id: 4,
          q: "According to Jacobi's Maximum Power Transfer Theorem for DC circuits, when is maximum power delivered to variable load RL?",
          options: [
            "When RL = Rth",
            "When RL = 0 Ω (short circuit)",
            "When RL = ∞ (open circuit)",
            "When RL = 2 × Rth"
          ],
          correct: 0,
          explanation: "Setting dPL/dRL = 0 yields the optimal condition RL = Rth. At this impedance match, the load extracts maximum power from the source."
        },
        {
          id: 5,
          q: "What is the source efficiency η of a circuit operating at the Maximum Power Transfer condition (RL = Rth)?",
          options: [
            "η = 50%",
            "η = 100%",
            "η = 70.7%",
            "η = 25%"
          ],
          correct: 0,
          explanation: "At RL = Rth, exactly half the total power generated by the source is dissipated internally in Rth, resulting in an efficiency of η = 50%."
        },
        {
          id: 6,
          q: "Given a Thevenin source with Vth = 12 V and Rth = 20 Ω, what is the maximum power Pmax that can be transferred to the load?",
          options: [
            "Pmax = 1.80 W",
            "Pmax = 7.20 W",
            "Pmax = 3.60 W",
            "Pmax = 0.90 W"
          ],
          correct: 0,
          explanation: "Pmax = Vth² / (4 × Rth) = (12)² / (4 × 20) = 144 / 80 = 1.80 Watts."
        },
        {
          id: 7,
          q: "In an R-L-C series circuit with L = 25.33 mH and C = 1.0 μF, what is the resonant frequency fr?",
          options: [
            "fr = 1000 Hz (1.0 kHz)",
            "fr = 500 Hz",
            "fr = 2000 Hz",
            "fr = 159 Hz"
          ],
          correct: 0,
          explanation: "fr = 1 / (2π√(LC)) = 1 / (2π√(0.02533 × 10⁻⁶)) = 1 / (2π × 1.5915 × 10⁻⁴) ≈ 1000 Hz."
        },
        {
          id: 8,
          q: "For the same series R-L-C circuit at resonance with R = 10 Ω, what is the circuit Quality Factor Q?",
          options: [
            "Q = 15.92",
            "Q = 1.59",
            "Q = 31.83",
            "Q = 62.83"
          ],
          correct: 0,
          explanation: "Q = (2π × fr × L) / R = (2π × 1000 × 0.02533) / 10 = 159.15 / 10 = 15.92."
        },
        {
          id: 9,
          q: "What is the half-power bandwidth BW of the series resonant circuit with fr = 1000 Hz and Q = 15.92?",
          options: [
            "BW = 62.8 Hz",
            "BW = 100.0 Hz",
            "BW = 31.4 Hz",
            "BW = 159.2 Hz"
          ],
          correct: 0,
          explanation: "BW = fr / Q = 1000 Hz / 15.915 = 62.83 Hz (alternatively BW = R / (2πL) = 62.83 Hz)."
        },
        {
          id: 10,
          q: "At series resonance, what is the relationship between the inductive voltage VL, capacitive voltage VC, and input source voltage Vs?",
          options: [
            "VL = VC = Q × Vs (180° out of phase, canceling each other)",
            "VL + VC = Vs",
            "VL = VC = Vs / 2",
            "VL and VC are zero"
          ],
          correct: 0,
          explanation: "At fr, XL = XC so VL leads current by 90° and VC lags by 90°, perfectly canceling. The reactive voltages are magnified by factor Q: VL = VC = Q × Vs."
        }
      ];

      this.selectedAnswers = {};
      this.submitted = false;
      this.initUI();
    }

    initUI() {
      const container = document.getElementById('quiz-questions-list');
      if (!container) return;

      container.innerHTML = this.questions.map((q, idx) => `
        <div class="quiz-q-card" id="q-card-${idx}" style="background:#0b1329; border:1px solid #1c2d54; border-radius:8px; padding:14px; margin-bottom:12px;">
          <div style="font-weight:700; color:#38bdf8; font-size:0.95rem; margin-bottom:8px;">
            Q${idx + 1}. ${q.q}
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${q.options.map((opt, oIdx) => `
              <label style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:#050b17; border:1px solid #162547; border-radius:6px; cursor:pointer;">
                <input type="radio" name="quiz-q-${idx}" value="${oIdx}">
                <span style="font-size:0.85rem; color:#cbd5e1;">${opt}</span>
              </label>
            `).join('')}
          </div>
          <div class="quiz-feedback hidden" id="quiz-fb-${idx}" style="margin-top:8px; padding:8px 10px; border-radius:6px; font-size:0.82rem;"></div>
        </div>
      `).join('');

      // Event listener for selections
      this.questions.forEach((_, idx) => {
        const radios = document.querySelectorAll(`input[name="quiz-q-${idx}"]`);
        radios.forEach(r => {
          r.addEventListener('change', (e) => {
            this.selectedAnswers[idx] = parseInt(e.target.value, 10);
          });
        });
      });

      const btnSubmit = document.getElementById('btn-submit-quiz');
      const btnReset = document.getElementById('btn-reset-quiz');

      if (btnSubmit) btnSubmit.addEventListener('click', () => this.submit());
      if (btnReset) btnReset.addEventListener('click', () => this.reset());
    }

    submit() {
      let score = 0;
      this.questions.forEach((q, idx) => {
        const selected = this.selectedAnswers[idx];
        const fbEl = document.getElementById(`quiz-fb-${idx}`);
        const cardEl = document.getElementById(`q-card-${idx}`);

        if (fbEl) {
          fbEl.classList.remove('hidden');
          if (selected === q.correct) {
            score++;
            fbEl.style.background = 'rgba(16, 185, 129, 0.15)';
            fbEl.style.border = '1px solid #10b981';
            fbEl.style.color = '#10b981';
            fbEl.innerHTML = `<strong>✓ Correct!</strong> ${q.explanation}`;
          } else {
            fbEl.style.background = 'rgba(244, 63, 94, 0.15)';
            fbEl.style.border = '1px solid #f43f5e';
            fbEl.style.color = '#f43f5e';
            fbEl.innerHTML = `<strong>✗ Incorrect.</strong> Correct answer: <em>${q.options[q.correct]}</em>. ${q.explanation}`;
          }
        }
      });

      const scoreDisplay = document.getElementById('quiz-score-display');
      if (scoreDisplay) {
        scoreDisplay.textContent = `${score} / ${this.questions.length}`;
      }

      const certCard = document.getElementById('quiz-certificate-card');
      if (certCard) {
        if (score >= 8) {
          certCard.classList.remove('hidden');
          sound.playSuccessChord();
        } else {
          certCard.classList.add('hidden');
          sound.playAlertTone();
        }
      }
    }

    reset() {
      this.selectedAnswers = {};
      const radios = document.querySelectorAll('input[type="radio"]');
      radios.forEach(r => r.checked = false);

      const fbs = document.querySelectorAll('.quiz-feedback');
      fbs.forEach(fb => fb.classList.add('hidden'));

      const scoreDisplay = document.getElementById('quiz-score-display');
      if (scoreDisplay) scoreDisplay.textContent = '0 / 10';

      const certCard = document.getElementById('quiz-certificate-card');
      if (certCard) certCard.classList.add('hidden');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 10. PROGRESSIVE CHALLENGE / LAB ENGINE (9 Built-In Labs)
  // ════════════════════════════════════════════════════════════════════════════
  class ChallengeEngine {
    constructor(circuitEngine, mptEngine, rlcEngine) {
      this.circuitEngine = circuitEngine;
      this.mptEngine = mptEngine;
      this.rlcEngine = rlcEngine;

      this.labs = [
        {
          id: 'lab1',
          title: 'Lab 1: Thevenin Voltage Measurement (Open-Circuit)',
          desc: 'Disconnect load resistor RL by opening switch S1. Observe that open-circuit terminal voltage Voc exactly equals the theoretical Thevenin voltage Vth = 8.00 V.',
          steps: [
            { text: 'Set Vs = 24 V, R1 = 10 Ω, R2 = 20 Ω, R3 = 30 Ω, R4 = 15 Ω', check: (c) => Math.abs(c.vs - 24) < 1 && Math.abs(c.r1 - 10) < 1 },
            { text: 'Open Switch S1 to isolate the load terminal', check: (c) => !c.s1Closed },
            { text: 'Ensure switches S2 and S3 are CLOSED to probe terminals A & B', check: (c) => c.s2Closed && c.s3Closed },
            { text: 'Verify terminal voltage Vload = Voc = 8.00 V', check: (c) => Math.abs(c.vload - 8.00) < 0.1 }
          ]
        },
        {
          id: 'lab2',
          title: 'Lab 2: Norton Short-Circuit Current & Source Duality',
          desc: 'Close switch S1 and set RL = 0 Ω to simulate an ideal ammeter shorting terminals A-B. Verify short-circuit current Isc = IN = 0.48 A.',
          steps: [
            { text: 'Ensure switches S1, S2, and S3 are all CLOSED', check: (c) => c.s1Closed && c.s2Closed && c.s3Closed },
            { text: 'Set Load Resistor RL = 0 Ω (Short Circuit)', check: (c) => c.rl <= 0.1 },
            { text: 'Verify measured short-circuit current Iload = 0.480 A', check: (c) => Math.abs(c.iload - 0.48) < 0.05 }
          ]
        },
        {
          id: 'lab3',
          title: 'Lab 3: Wheatstone Bridge Null Balance Condition',
          desc: 'Adjust resistor R4 to balance the bridge such that R1/R2 = R3/R4 (10/20 = 30/R4 => R4 = 60 Ω). Verify Vth drops to exactly 0.00 V.',
          steps: [
            { text: 'Keep R1 = 10 Ω, R2 = 20 Ω, R3 = 30 Ω', check: (c) => Math.abs(c.r1 - 10) < 1 && Math.abs(c.r2 - 20) < 1 && Math.abs(c.r3 - 30) < 1 },
            { text: 'Adjust R4 slider to 60 Ω to balance the ratio', check: (c) => Math.abs(c.r4 - 60) < 2 },
            { text: 'Verify Thevenin voltage Vth = 0.00 V (Null Balance)', check: (c) => Math.abs(c.vth) < 0.1 }
          ]
        },
        {
          id: 'lab4',
          title: 'Lab 4: Maximum Power Transfer Peak Search',
          desc: 'In the MPT Lab module, sweep load resistance RL across 0 to 100 Ω. Locate the exact resistance where load power PL reaches maximum.',
          steps: [
            { text: 'Switch to Module 2 (Max Power Transfer)', check: () => window.canvasRenderer && window.canvasRenderer.activeModule === 'mpt' },
            { text: 'Set Vth = 12 V and Rth = 20 Ω', check: () => Math.abs(this.mptEngine.vth - 12) < 0.5 && Math.abs(this.mptEngine.rth - 20) < 1 },
            { text: 'Adjust RL slider to match Rth (RL = 20 Ω)', check: () => Math.abs(this.mptEngine.rl - 20) < 1 },
            { text: 'Confirm Load Power PL reaches maximum peak Pmax = 1.80 W', check: () => Math.abs(this.mptEngine.calculate().pl - 1.80) < 0.1 }
          ]
        },
        {
          id: 'lab5',
          title: 'Lab 5: 50% Efficiency Verification at MPT',
          desc: 'Demonstrate that at maximum power transfer (RL = Rth), source efficiency is precisely 50% and load voltage is half of Vth (VL = Vth / 2 = 6.00 V).',
          steps: [
            { text: 'Set RL = Rth = 20 Ω in MPT Module', check: () => Math.abs(this.mptEngine.rl - this.mptEngine.rth) < 1 },
            { text: 'Verify load voltage VL = 6.00 V', check: () => Math.abs(this.mptEngine.calculate().vl - 6.00) < 0.2 },
            { text: 'Verify efficiency η = 50.0%', check: () => Math.abs(this.mptEngine.calculate().eta - 50.0) < 0.5 }
          ]
        },
        {
          id: 'lab6',
          title: 'Lab 6: High-Efficiency Impedance Tradeoff (80% Efficiency)',
          desc: 'Calculate the load resistance required for 80% source efficiency (RL = 4 × Rth = 80 Ω) and verify power reduction tradeoff.',
          steps: [
            { text: 'Set Rth = 20 Ω', check: () => Math.abs(this.mptEngine.rth - 20) < 1 },
            { text: 'Adjust RL slider to 80 Ω (RL = 4 × Rth)', check: () => Math.abs(this.mptEngine.rl - 80) < 2 },
            { text: 'Verify efficiency η = 80.0% and PL = 1.15 W', check: () => Math.abs(this.mptEngine.calculate().eta - 80.0) < 1.0 }
          ]
        },
        {
          id: 'lab7',
          title: 'Lab 7: Series AC Resonance Tuning (fr = 1000 Hz)',
          desc: 'In Module 3, tune the AC generator frequency f to locate resonance. Verify that inductive and capacitive reactances cancel (XL = XC = 159.2 Ω).',
          steps: [
            { text: 'Switch to Module 3 (RLC Resonance)', check: () => window.canvasRenderer && window.canvasRenderer.activeModule === 'rlc' },
            { text: 'Set L = 25.33 mH and C = 1.00 μF', check: () => Math.abs(this.rlcEngine.l_mH - 25.33) < 0.5 && Math.abs(this.rlcEngine.c_uF - 1.0) < 0.1 },
            { text: 'Tune frequency f to 1000 Hz', check: () => Math.abs(this.rlcEngine.f - 1000) < 15 },
            { text: 'Verify phase angle θ ≈ 0° (Unity Power Factor)', check: () => Math.abs(this.rlcEngine.calculate().phaseDeg) < 3 }
          ]
        },
        {
          id: 'lab8',
          title: 'Lab 8: Voltage Magnification & Quality Factor Q',
          desc: 'Observe the voltage magnification across inductor L and capacitor C at resonance: VL = VC = Q × Vs = 15.92 × 10 V ≈ 159.2 V.',
          steps: [
            { text: 'Ensure circuit is at resonance (f = 1000 Hz, R = 10 Ω)', check: () => Math.abs(this.rlcEngine.f - 1000) < 15 && Math.abs(this.rlcEngine.r - 10) < 1 },
            { text: 'Observe circuit current reaches maximum I = Vrms/R = 1.00 A', check: () => Math.abs(this.rlcEngine.calculate().i - 1.0) < 0.05 },
            { text: 'Confirm VL and VC reach magnified 159.2 V (Q = 15.92)', check: () => Math.abs(this.rlcEngine.calculate().vl - 159.2) < 5 }
          ]
        },
        {
          id: 'lab9',
          title: 'Lab 9: Bandpass Filter Bandwidth Design',
          desc: 'Adjust resistor R to double the bandwidth from 62.8 Hz to 125.6 Hz (by setting R = 20 Ω), observing the lowering of Q.',
          steps: [
            { text: 'Keep f = 1000 Hz, L = 25.33 mH, C = 1.00 μF', check: () => Math.abs(this.rlcEngine.f - 1000) < 15 },
            { text: 'Increase resistor R to 20 Ω', check: () => Math.abs(this.rlcEngine.r - 20) < 1.5 },
            { text: 'Verify Bandwidth BW increases to ~125.6 Hz and Q drops to ~7.96', check: () => Math.abs(this.rlcEngine.getResonanceProperties().bw - 125.6) < 10 }
          ]
        }
      ];

      this.currentLab = this.labs[0];
      this.initUI();
    }

    initUI() {
      const select = document.getElementById('lab-select');
      const btnLoad = document.getElementById('btn-load-lab');
      const btnVerify = document.getElementById('btn-verify-lab');

      if (select) {
        select.innerHTML = this.labs.map(lab => `
          <option value="${lab.id}">${lab.title}</option>
        `).join('');

        select.addEventListener('change', (e) => {
          this.loadLab(e.target.value);
        });
      }

      if (btnLoad) {
        btnLoad.addEventListener('click', () => {
          if (select) this.loadLab(select.value);
        });
      }

      if (btnVerify) {
        btnVerify.addEventListener('click', () => {
          this.verify();
        });
      }

      this.renderLabBox();
    }

    loadLab(labId) {
      const found = this.labs.find(l => l.id === labId);
      if (found) {
        this.currentLab = found;
        this.renderLabBox();
        const resEl = document.getElementById('lab-status-result');
        if (resEl) {
          resEl.textContent = '';
          resEl.className = 'ticket-status-result';
        }
        sound.playRelayClick();
      }
    }

    renderLabBox() {
      const box = document.getElementById('lab-box');
      if (!box || !this.currentLab) return;

      box.innerHTML = `
        <div style="font-weight:700; color:#38bdf8; font-size:0.95rem; margin-bottom:4px;">
          ${this.currentLab.title}
        </div>
        <p style="color:#94a3b8; font-size:0.82rem; margin-bottom:10px;">
          ${this.currentLab.desc}
        </p>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${this.currentLab.steps.map((st, i) => `
            <div id="step-row-${i}" style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:#050b17; border-left:3px solid #38bdf8; border-radius:4px; font-size:0.82rem; color:#cbd5e1;">
              <span id="step-icon-${i}">○</span>
              <span>Step ${i + 1}: ${st.text}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    verify() {
      if (!this.currentLab) return;
      const c = this.circuitEngine.calculate();
      let allPassed = true;

      this.currentLab.steps.forEach((step, idx) => {
        const passed = step.check(c);
        const rowEl = document.getElementById(`step-row-${idx}`);
        const iconEl = document.getElementById(`step-icon-${idx}`);

        if (rowEl && iconEl) {
          if (passed) {
            rowEl.style.borderLeftColor = '#10b981';
            rowEl.style.color = '#10b981';
            iconEl.textContent = '✓';
          } else {
            allPassed = false;
            rowEl.style.borderLeftColor = '#f43f5e';
            rowEl.style.color = '#f43f5e';
            iconEl.textContent = '✗';
          }
        }
      });

      const resEl = document.getElementById('lab-status-result');
      if (resEl) {
        if (allPassed) {
          resEl.textContent = '✓ LAB PASSED! All assertions verified successfully.';
          resEl.style.color = '#10b981';
          sound.playSuccessChord();
        } else {
          resEl.textContent = '✗ FAILED: One or more circuit conditions not met. Check steps above.';
          resEl.style.color = '#f43f5e';
          sound.playAlertTone();
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 11. APPLICATION ORCHESTRATOR & EVENT BINDINGS
  // ════════════════════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    // Instantiate all mathematical and simulation engines
    const circuitEngine = new CircuitEngine();
    const mptEngine = new MPTEngine();
    const rlcEngine = new RLCEngine();

    // Canvas Schematic Renderer
    const canvasRenderer = new UnifiedCanvasRenderer('circuit-canvas', circuitEngine, mptEngine, rlcEngine);
    window.canvasRenderer = canvasRenderer; // Exposed globally

    // Right Deck Renderers
    const mptGraph = new MPTGraphRenderer('mpt-canvas', mptEngine);
    const resGraph = new ResonanceCurveRenderer('resonance-canvas', rlcEngine);
    const oscRenderer = new OscilloscopeRenderer('osc-canvas', rlcEngine);
    const phasorRenderer = new PhasorRenderer('phasor-canvas', rlcEngine);

    // 3D Model Scene
    const model3d = new ThreeJSModel('sim3d-canvas');

    // Certification Quiz & 9-Lab Challenges
    const quiz = new QuizEngine();
    const challenge = new ChallengeEngine(circuitEngine, mptEngine, rlcEngine);

    // ──────────────────────────────────────────────────────────────────────────
    // Mode Switching (Canonical 4 Modes)
    // ──────────────────────────────────────────────────────────────────────────
    const modeTabs = document.querySelectorAll('#mode-tabs .pill');
    const simWrapper = document.getElementById('sim-wrapper');
    const model3dWrapper = document.getElementById('model3d-wrapper');
    const exploreWrapper = document.getElementById('explore-wrapper');
    const quizWrapper = document.getElementById('quiz-wrapper');

    function switchMode(targetMode) {
      modeTabs.forEach(tab => {
        if (tab.dataset.mode === targetMode) tab.classList.add('active');
        else tab.classList.remove('active');
      });

      if (simWrapper) simWrapper.classList.toggle('hidden', targetMode !== 'simulate');
      if (model3dWrapper) model3dWrapper.classList.toggle('hidden', targetMode !== '3d-model');
      if (exploreWrapper) exploreWrapper.classList.toggle('hidden', targetMode !== 'explore');
      if (quizWrapper) quizWrapper.classList.toggle('hidden', targetMode !== 'quiz');

      sound.playRelayClick();

      if (targetMode === 'simulate') {
        setTimeout(() => canvasRenderer.resizeCanvas(), 50);
      } else if (targetMode === '3d-model') {
        // Trigger 3D inspector default
        model3d.inspectComponent('breadboard');
      } else if (targetMode === 'explore' || targetMode === 'quiz') {
        if (window.renderMathInElement) {
          try {
            window.renderMathInElement(targetMode === 'explore' ? exploreWrapper : quizWrapper, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
              ],
              throwOnError: false
            });
          } catch (e) {
            console.warn('KaTeX render error:', e);
          }
        }
      }
    }

    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Module Pill Selector (Thevenin, MPT, RLC)
    // ──────────────────────────────────────────────────────────────────────────
    const modulePills = document.querySelectorAll('.module-pill-selector .mod-pill');
    const panelThevenin = document.getElementById('params-thevenin');
    const panelMpt = document.getElementById('params-mpt');
    const panelRlc = document.getElementById('params-rlc');

    function switchModuleUI(mod) {
      modulePills.forEach(pill => {
        if (pill.dataset.module === mod) pill.classList.add('active');
        else pill.classList.remove('active');
      });

      if (panelThevenin) panelThevenin.classList.toggle('hidden', mod !== 'thevenin');
      if (panelMpt) panelMpt.classList.toggle('hidden', mod !== 'mpt');
      if (panelRlc) panelRlc.classList.toggle('hidden', mod !== 'rlc');

      // Update Header Badges
      const badgeMod = document.getElementById('badge-module');
      if (badgeMod) {
        if (mod === 'thevenin') badgeMod.textContent = 'Mode: Thevenin/Norton';
        else if (mod === 'mpt') badgeMod.textContent = 'Mode: Max Power Transfer';
        else if (mod === 'rlc') badgeMod.textContent = 'Mode: RLC Resonance';
      }

      canvasRenderer.switchModule(mod);
      updateDisplays();
      sound.playRelayClick();
    }

    modulePills.forEach(pill => {
      pill.addEventListener('click', () => switchModuleUI(pill.dataset.module));
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Right Deck Tab Switching (Meters, MPT Graph, Resonance, Scope, Phasor)
    // ──────────────────────────────────────────────────────────────────────────
    const deckTabs = document.querySelectorAll('.deck-tabs .deck-tab');
    const tabMeters = document.getElementById('tab-meters');
    const tabMptGraph = document.getElementById('tab-mpt-graph');
    const tabResonance = document.getElementById('tab-resonance');
    const tabOscilloscope = document.getElementById('tab-oscilloscope');
    const tabPhasor = document.getElementById('tab-phasor');

    const tabProof = document.getElementById('tab-proof');

    deckTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        deckTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;

        if (tabMeters) tabMeters.classList.toggle('hidden', target !== 'meters');
        if (tabMptGraph) tabMptGraph.classList.toggle('hidden', target !== 'mpt-graph');
        if (tabResonance) tabResonance.classList.toggle('hidden', target !== 'resonance');
        if (tabOscilloscope) tabOscilloscope.classList.toggle('hidden', target !== 'oscilloscope');
        if (tabPhasor) tabPhasor.classList.toggle('hidden', target !== 'phasor');
        if (tabProof) tabProof.classList.toggle('hidden', target !== 'proof');

        sound.playRelayClick();
        updateDisplays();
      });
    });

    // Topology Presets Selector
    const selectTopology = document.getElementById('select-topology');
    if (selectTopology) {
      selectTopology.addEventListener('change', (e) => {
        circuitEngine.setTopology(e.target.value);
        // Sync sliders with preset values
        const vsSl = document.getElementById('sl-vs');
        const r1Sl = document.getElementById('sl-r1');
        const r2Sl = document.getElementById('sl-r2');
        const r3Sl = document.getElementById('sl-r3');
        const r4Sl = document.getElementById('sl-r4');
        const rlSl = document.getElementById('sl-rl');

        if (vsSl) { vsSl.value = circuitEngine.vs; document.getElementById('sl-vs-val').textContent = `${circuitEngine.vs} V`; }
        if (r1Sl) { r1Sl.value = circuitEngine.r1; document.getElementById('sl-r1-val').textContent = `${circuitEngine.r1} Ω`; }
        if (r2Sl) { r2Sl.value = circuitEngine.r2; document.getElementById('sl-r2-val').textContent = `${circuitEngine.r2} Ω`; }
        if (r3Sl) { r3Sl.value = circuitEngine.r3; document.getElementById('sl-r3-val').textContent = `${circuitEngine.r3} Ω`; }
        if (r4Sl) { r4Sl.value = circuitEngine.r4; document.getElementById('sl-r4-val').textContent = `${circuitEngine.r4} Ω`; }
        if (rlSl) { rlSl.value = circuitEngine.rl; document.getElementById('sl-rl-val').textContent = `${circuitEngine.rl} Ω`; }

        sound.playRelayClick();
        updateDisplays();
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Blueprint Inspector Tabs (Theory Mode)
    // ──────────────────────────────────────────────────────────────────────────
    const bpTabs = document.querySelectorAll('.blueprint-selector-tabs .bp-tab');
    const bpThevenin = document.getElementById('bp-pane-thevenin-ckt');
    const bpMpt = document.getElementById('bp-pane-mpt-curve');
    const bpRlc = document.getElementById('bp-pane-rlc-circuit');

    bpTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        bpTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const bp = tab.dataset.bp;

        if (bpThevenin) bpThevenin.classList.toggle('hidden', bp !== 'thevenin-ckt');
        if (bpMpt) bpMpt.classList.toggle('hidden', bp !== 'mpt-curve');
        if (bpRlc) bpRlc.classList.toggle('hidden', bp !== 'rlc-circuit');

        sound.playRelayClick();
      });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Sound Toggle Button
    // ──────────────────────────────────────────────────────────────────────────
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const enabled = sound.toggle();
        btnSound.textContent = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Module 1 (Thevenin) Controls: Sliders & Knife Switches
    // ──────────────────────────────────────────────────────────────────────────
    const slidersThevenin = [
      { id: 'sl-vs', key: 'vs', valId: 'sl-vs-val', unit: 'V' },
      { id: 'sl-r1', key: 'r1', valId: 'sl-r1-val', unit: 'Ω' },
      { id: 'sl-r2', key: 'r2', valId: 'sl-r2-val', unit: 'Ω' },
      { id: 'sl-r3', key: 'r3', valId: 'sl-r3-val', unit: 'Ω' },
      { id: 'sl-r4', key: 'r4', valId: 'sl-r4-val', unit: 'Ω' },
      { id: 'sl-rl', key: 'rl', valId: 'sl-rl-val', unit: 'Ω' }
    ];

    slidersThevenin.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) {
        el.addEventListener('input', (e) => {
          circuitEngine.setParam(s.key, e.target.value);
          const valEl = document.getElementById(s.valId);
          if (valEl) valEl.textContent = `${parseFloat(e.target.value).toFixed(0)} ${s.unit}`;
          updateDisplays();
        });
      }
    });

    const switchesThevenin = [
      { id: 'sw-s1', name: 's1', valId: 'sw-s1-val' },
      { id: 'sw-s2', name: 's2', valId: 'sw-s2-val' },
      { id: 'sw-s3', name: 's3', valId: 'sw-s3-val' }
    ];

    switchesThevenin.forEach(sw => {
      const el = document.getElementById(sw.id);
      if (el) {
        el.addEventListener('change', (e) => {
          circuitEngine.setSwitch(sw.name, e.target.checked);
          const valEl = document.getElementById(sw.valId);
          if (valEl) valEl.textContent = e.target.checked ? 'CLOSED' : 'OPEN';
          sound.playSwitchToggle();
          updateDisplays();
        });
      }
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Module 2 (MPT) Controls: Sliders & Sweep Button
    // ──────────────────────────────────────────────────────────────────────────
    const slidersMpt = [
      { id: 'sl-mpt-vth', key: 'vth', valId: 'sl-mpt-vth-val', unit: 'V' },
      { id: 'sl-mpt-rth', key: 'rth', valId: 'sl-mpt-rth-val', unit: 'Ω' },
      { id: 'sl-mpt-rl', key: 'rl', valId: 'sl-mpt-rl-val', unit: 'Ω' }
    ];

    slidersMpt.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) {
        el.addEventListener('input', (e) => {
          mptEngine.setParam(s.key, e.target.value);
          const valEl = document.getElementById(s.valId);
          if (valEl) valEl.textContent = `${parseFloat(e.target.value).toFixed(1)} ${s.unit}`;
          updateDisplays();
        });
      }
    });

    const btnMptSweep = document.getElementById('btn-mpt-sweep');
    if (btnMptSweep) {
      btnMptSweep.addEventListener('click', () => {
        sound.playRelayClick();
        mptGraph.render();
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Module 3 (RLC) Controls: Sliders & Frequency Sweep / Auto-Tune
    // ──────────────────────────────────────────────────────────────────────────
    const slidersRlc = [
      { id: 'sl-rlc-v', key: 'vrms', valId: 'sl-rlc-v-val', unit: 'V' },
      { id: 'sl-rlc-f', key: 'f', valId: 'sl-rlc-f-val', unit: 'Hz' },
      { id: 'sl-rlc-r', key: 'r', valId: 'sl-rlc-r-val', unit: 'Ω' },
      { id: 'sl-rlc-l', key: 'l', valId: 'sl-rlc-l-val', unit: 'mH' },
      { id: 'sl-rlc-c', key: 'c', valId: 'sl-rlc-c-val', unit: 'μF' }
    ];

    slidersRlc.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) {
        el.addEventListener('input', (e) => {
          rlcEngine.setParam(s.key, e.target.value);
          const valEl = document.getElementById(s.valId);
          if (valEl) valEl.textContent = `${parseFloat(e.target.value).toFixed(s.key === 'c' || s.key === 'l' ? 2 : 0)} ${s.unit}`;

          // Frequency tracking sound beep
          if (s.key === 'f') {
            const r = rlcEngine.calculate();
            sound.playResonanceTone(r.f, r.i / (r.vrms / r.r));
          }

          updateDisplays();
        });
      }
    });

    const btnRlcAuto = document.getElementById('btn-rlc-auto');
    if (btnRlcAuto) {
      btnRlcAuto.addEventListener('click', () => {
        const resProps = rlcEngine.getResonanceProperties();
        rlcEngine.setParam('f', resProps.fr);

        const fSlider = document.getElementById('sl-rlc-f');
        const fVal = document.getElementById('sl-rlc-f-val');
        if (fSlider) fSlider.value = resProps.fr;
        if (fVal) fVal.textContent = `${resProps.fr.toFixed(0)} Hz`;

        sound.playSuccessChord();
        updateDisplays();
      });
    }

    const btnRlcSweep = document.getElementById('btn-rlc-sweep');
    if (btnRlcSweep) {
      btnRlcSweep.addEventListener('click', () => {
        sound.playRelayClick();
        resGraph.render();
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Measurement Logging & CSV Export
    // ──────────────────────────────────────────────────────────────────────────
    const btnExportLog = document.getElementById('btn-export-log');
    const btnClearLog = document.getElementById('btn-clear-log');
    const logTbody = document.getElementById('lab-log-tbody');
    let logIndex = 1;

    function addLogEntry(module, measurement, val, unit) {
      if (!logTbody) return;
      const tr = document.createElement('tr');
      const timeStr = new Date().toLocaleTimeString();
      tr.innerHTML = `
        <td>${logIndex++}</td>
        <td>${timeStr}</td>
        <td><span class="status-pill highlight">${module}</span></td>
        <td>${measurement}</td>
        <td style="font-family:'JetBrains Mono',monospace; font-weight:700; color:#10b981;">${val}</td>
        <td>${unit}</td>
      `;
      logTbody.prepend(tr);
    }

    if (btnClearLog && logTbody) {
      btnClearLog.addEventListener('click', () => {
        logTbody.innerHTML = '';
        logIndex = 1;
        sound.playRelayClick();
      });
    }

    if (btnExportLog && logTbody) {
      btnExportLog.addEventListener('click', () => {
        const rows = Array.from(logTbody.querySelectorAll('tr'));
        let csv = 'No,Time,Module,Measurement,Value,Unit\n';
        rows.forEach(r => {
          const cols = Array.from(r.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""')}"`);
          csv += cols.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Circuit_Lab_Measurements_${Date.now()}.csv`;
        link.click();
        sound.playSuccessChord();
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Central Display & Telemetry Synchronizer
    // ──────────────────────────────────────────────────────────────────────────
    function updateDisplays() {
      // 1. DMM Readings in Tab 1
      const mmV = document.getElementById('mm-voltage');
      const mmI = document.getElementById('mm-current');
      const mmR = document.getElementById('mm-resistance');

      const c = circuitEngine.calculate();
      const m = mptEngine.calculate();
      const r = rlcEngine.calculate();

      if (canvasRenderer.activeModule === 'thevenin') {
        if (c.s3Kill) {
          // Switch 3 Active: Sources Killed -> Ohmmeter measures Rth
          if (mmV) mmV.textContent = '0.000';
          if (mmI) mmI.textContent = '0.000';
          if (mmR) mmR.textContent = c.rth.toFixed(3);
        } else if (c.s2Short) {
          // Switch 2 Active: Short A-B -> Ammeter measures IN
          if (mmV) mmV.textContent = '0.000';
          if (mmI) mmI.textContent = c.inorton.toFixed(3);
          if (mmR) mmR.textContent = '0.000';
        } else if (c.s1Open) {
          // Switch 1 Active: Open Load -> Voltmeter measures Voc = Vth
          if (mmV) mmV.textContent = c.vth.toFixed(3);
          if (mmI) mmI.textContent = '0.000';
          if (mmR) mmR.textContent = 'OPEN';
        } else {
          // Normal Load Conduction
          if (mmV) mmV.textContent = c.vload.toFixed(3);
          if (mmI) mmI.textContent = c.iload.toFixed(3);
          if (mmR) mmR.textContent = c.rl.toFixed(1);
        }
      } else if (canvasRenderer.activeModule === 'mpt') {
        if (mmV) mmV.textContent = m.vl.toFixed(3);
        if (mmI) mmI.textContent = m.il.toFixed(3);
        if (mmR) mmR.textContent = m.rl.toFixed(1);
      } else if (canvasRenderer.activeModule === 'rlc') {
        if (mmV) mmV.textContent = r.vr.toFixed(3);
        if (mmI) mmI.textContent = r.i.toFixed(3);
        if (mmR) mmR.textContent = r.z_mag.toFixed(1);
      }

      // Live Dynamic Regime Badge
      const badgeRegime = document.getElementById('badge-regime');
      if (badgeRegime) {
        if (canvasRenderer.activeModule === 'rlc') {
          if (r.f < r.fr * 0.99) {
            badgeRegime.textContent = 'CAPACITIVE (Current Leads)';
            badgeRegime.style.color = '#38bdf8';
          } else if (r.f > r.fr * 1.01) {
            badgeRegime.textContent = 'INDUCTIVE (Current Lags)';
            badgeRegime.style.color = '#f59e0b';
          } else {
            badgeRegime.textContent = '★ SERIES RESONANCE (Unity PF)';
            badgeRegime.style.color = '#10b981';
          }
        } else if (canvasRenderer.activeModule === 'mpt') {
          const isMatched = Math.abs(m.rl - m.rth) < 0.5;
          badgeRegime.textContent = isMatched ? '★ MPT MATCH (η = 50%)' : (m.rl < m.rth ? 'UNDER-MATCHED' : 'OVER-MATCHED');
          badgeRegime.style.color = isMatched ? '#10b981' : '#f59e0b';
        } else {
          badgeRegime.textContent = `TOPOLOGY: ${circuitEngine.topology.toUpperCase()}`;
          badgeRegime.style.color = '#38bdf8';
        }
      }

      // Step-by-Step KaTeX / Nodal Proof Tab Generator
      const proofEl = document.getElementById('proof-katex-container');
      if (proofEl) {
        if (canvasRenderer.activeModule === 'thevenin') {
          proofEl.innerHTML = `
            <div style="font-family:'JetBrains Mono',monospace; font-size:0.8rem; line-height:1.7;">
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">1. Conductance Matrix [G]·[v] = [i_s]:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54; margin-bottom:8px;">
                [ (1/R1 + 1/R2)       0        ] · [ Va ] = [ Vs/R1 ]<br>
                [       0        (1/R3 + 1/R4) ] · [ Vb ]   [ Vs/R3 ]
              </div>
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">2. Nodal Potentials at Nodes A & B:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54; margin-bottom:8px;">
                Va = Vs · R2 / (R1 + R2) = ${c.vs.toFixed(1)} · ${c.r2.toFixed(0)} / (${c.r1.toFixed(0)} + ${c.r2.toFixed(0)}) = <strong style="color:#10b981;">${c.va.toFixed(3)} V</strong><br>
                Vb = Vs · R4 / (R3 + R4) = ${c.vs.toFixed(1)} · ${c.r4.toFixed(0)} / (${c.r3.toFixed(0)} + ${c.r4.toFixed(0)}) = <strong style="color:#10b981;">${c.vb.toFixed(3)} V</strong>
              </div>
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">3. Thevenin Equivalent Reduction:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54; margin-bottom:8px;">
                Vth = Va - Vb = ${c.va.toFixed(3)} - ${c.vb.toFixed(3)} = <strong style="color:#f59e0b;">${c.vth.toFixed(3)} V</strong><br>
                Rth = (R1 || R2) + (R3 || R4) = <strong style="color:#f59e0b;">${c.rth.toFixed(3)} Ω</strong><br>
                IN  = Vth / Rth = <strong style="color:#c084fc;">${c.inorton.toFixed(3)} A</strong>
              </div>
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">4. Terminal Load Equivalence Invariant:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54;">
                IL = Vth / (Rth + RL) = <strong style="color:#10b981;">${c.iload.toFixed(3)} A</strong><br>
                VL = IL · RL = <strong style="color:#10b981;">${c.vload.toFixed(3)} V</strong>
              </div>
            </div>
          `;
        } else if (canvasRenderer.activeModule === 'mpt') {
          proofEl.innerHTML = `
            <div style="font-family:'JetBrains Mono',monospace; font-size:0.8rem; line-height:1.7;">
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">1. Load Power Function P_L(R_L):</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54; margin-bottom:8px;">
                PL(RL) = [ Vth / (Rth + RL) ]² · RL
              </div>
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">2. Derivative Extremum dPL/dRL = 0:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54; margin-bottom:8px;">
                dPL/dRL = Vth² · [ (Rth + RL) - 2·RL ] / (Rth + RL)³ = 0 ⟹ <strong style="color:#10b981;">RL = Rth = ${m.rth.toFixed(2)} Ω</strong>
              </div>
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">3. Peak Power P_max & Efficiency η:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54;">
                Pmax = Vth² / (4·Rth) = (${m.vth.toFixed(1)})² / (4 · ${m.rth.toFixed(1)}) = <strong style="color:#f59e0b;">${m.pmax.toFixed(3)} W</strong><br>
                η = RL / (Rth + RL) · 100% = <strong style="color:#10b981;">50.0%</strong> (at RL = Rth)
              </div>
            </div>
          `;
        } else if (canvasRenderer.activeModule === 'rlc') {
          proofEl.innerHTML = `
            <div style="font-family:'JetBrains Mono',monospace; font-size:0.8rem; line-height:1.7;">
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">1. Series RLC Complex Impedance:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54; margin-bottom:8px;">
                Z(f) = R + j(2πfL - 1/(2πfC)) = <strong style="color:#38bdf8;">${r.z_mag.toFixed(2)} Ω</strong>, θ = <strong style="color:#f59e0b;">${r.phaseDeg.toFixed(1)}°</strong>
              </div>
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">2. Resonance Frequency fr (XL = XC):</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54; margin-bottom:8px;">
                fr = 1 / (2π√(LC)) = <strong style="color:#10b981;">${r.fr.toFixed(1)} Hz</strong> ⟹ I_max = Vrms/R = <strong style="color:#10b981;">${(r.vrms/r.r).toFixed(2)} A</strong>
              </div>
              <p style="color:#38bdf8; font-weight:700; margin-bottom:4px;">3. Quality Factor & Voltage Magnification:</p>
              <div style="background:#020712; padding:8px 12px; border-radius:6px; border:1px solid #1c2d54;">
                Q = (2π·fr·L) / R = <strong style="color:#c084fc;">${r.q.toFixed(2)}</strong>, BW = fr / Q = <strong style="color:#e2e8f0;">${r.bw.toFixed(1)} Hz</strong><br>
                VL = VC = Q · Vrms = <strong style="color:#f43f5e;">${(r.q * r.vrms).toFixed(1)} V</strong>
              </div>
            </div>
          `;
        }
      }

      // Thevenin Result Summary
      const resVth = document.getElementById('result-vth');
      const resRth = document.getElementById('result-rth');
      const resIn = document.getElementById('result-in');
      const resVn = document.getElementById('result-vn');

      if (resVth) resVth.textContent = `${c.vth.toFixed(2)} V`;
      if (resRth) resRth.textContent = `${c.rth.toFixed(2)} Ω`;
      if (resIn) resIn.textContent = `${c.inorton.toFixed(3)} A`;
      if (resVn) resVn.textContent = `${c.vnorton.toFixed(2)} V`;

      // Header Badges
      const badgeVth = document.getElementById('badge-vth');
      const badgePf = document.getElementById('badge-pf');
      if (badgeVth) badgeVth.textContent = `Vth: ${c.vth.toFixed(2)}V`;
      if (badgePf) badgePf.textContent = `cos θ: ${r.pf.toFixed(2)}`;

      // MPT Table Rows
      const mptPmax = document.getElementById('mpt-pmax');
      const mptRlOpt = document.getElementById('mpt-rl-opt');
      const mptEta = document.getElementById('mpt-eta');
      const mptVl = document.getElementById('mpt-vl');

      if (mptPmax) mptPmax.textContent = m.pmax.toFixed(3);
      if (mptRlOpt) mptRlOpt.textContent = m.rlOpt.toFixed(1);
      if (mptEta) mptEta.textContent = m.eta.toFixed(1);
      if (mptVl) mptVl.textContent = m.vl.toFixed(2);

      // Resonance Table Rows
      const resFr = document.getElementById('res-fr');
      const resQ = document.getElementById('res-q');
      const resBw = document.getElementById('res-bw');
      const resF1 = document.getElementById('res-f1');
      const resF2 = document.getElementById('res-f2');

      if (resFr) resFr.textContent = `${r.fr.toFixed(1)} Hz`;
      if (resQ) resQ.textContent = r.q.toFixed(2);
      if (resBw) resBw.textContent = `${r.bw.toFixed(1)} Hz`;
      if (resF1) resF1.textContent = `${r.f1.toFixed(1)} Hz`;
      if (resF2) resF2.textContent = `${r.f2.toFixed(1)} Hz`;

      // Render Graph Cards
      mptGraph.render();
      resGraph.render();
      oscRenderer.render();
      phasorRenderer.render();
    }

    // Continuous rendering ticker for Oscilloscope & Phasor rotation
    setInterval(() => {
      oscRenderer.render();
      phasorRenderer.render();
    }, 40);

    // Initial update
    updateDisplays();

    // Button: Log Current Reading
    const btnLogReading = document.getElementById('btn-log-reading');
    if (btnLogReading) {
      btnLogReading.addEventListener('click', () => {
        const c = circuitEngine.calculate();
        const m = mptEngine.calculate();
        const r = rlcEngine.calculate();
        const mod = canvasRenderer.activeModule;

        if (mod === 'thevenin') {
          const rlStr = c.s1Open ? 'OPEN' : c.rl.toFixed(1);
          const psrc = (c.vs * c.i_total).toFixed(3);
          const etaStr = (c.pload > 0 && c.vs * c.i_total > 0 ? (c.pload / (c.vs * c.i_total)) * 100 : 0).toFixed(1) + '%';
          const reg = c.s3Kill ? 'Killed Sources (Rth)' : (c.s2Short ? 'Short-Circuit (IN)' : (c.s1Open ? 'Open-Circuit (Voc)' : 'Normal Load'));
          addLogTableRow(rlStr, c.iload.toFixed(3), c.vload.toFixed(3), c.pload.toFixed(3), psrc, etaStr, reg);
        } else if (mod === 'mpt') {
          const psrc = m.pin.toFixed(3);
          const reg = Math.abs(m.rl - m.rth) < 0.5 ? 'MAX POWER MATCH' : (m.rl < m.rth ? 'Under-Matched' : 'Over-Matched');
          addLogTableRow(m.rl.toFixed(1), m.il.toFixed(3), m.vl.toFixed(3), m.pl.toFixed(3), psrc, m.eta.toFixed(1) + '%', reg);
        } else if (mod === 'rlc') {
          const reg = r.f < r.fr * 0.99 ? 'Capacitive' : (r.f > r.fr * 1.01 ? 'Inductive' : 'Series Resonance');
          addLogTableRow(`f=${r.f.toFixed(0)}Hz`, r.i.toFixed(3), r.vr.toFixed(3), r.pActive.toFixed(3), r.sApparent.toFixed(3), (r.pf * 100).toFixed(1) + '%', reg);
        }
        sound.playRelayClick();
      });
    }

    // Button: Populate Benchmark Trials (Case A)
    const btnBenchTrials = document.getElementById('btn-bench-trials');
    if (btnBenchTrials) {
      btnBenchTrials.addEventListener('click', () => {
        if (!logTbody) return;
        logTbody.innerHTML = '';
        logIndex = 1;

        const benchmarkA = [
          { rl: '0.0 (Short)', il: '0.600 (IN)', vl: '0.00', pl: '0.000', psrc: '7.200', eta: '0.00%', reg: 'Short-Circuit Limit' },
          { rl: '5.0', il: '0.480', vl: '2.40', pl: '1.152', psrc: '5.760', eta: '20.00%', reg: 'Under-Matched' },
          { rl: '10.0', il: '0.400', vl: '4.00', pl: '1.600', psrc: '4.800', eta: '33.33%', reg: 'Under-Matched' },
          { rl: '20.0 (=Rth)', il: '0.300', vl: '6.00', pl: '1.800 (Pmax)', psrc: '3.600', eta: '50.00%', reg: 'MAX POWER MATCH' },
          { rl: '40.0', il: '0.200', vl: '8.00', pl: '1.600', psrc: '2.400', eta: '66.67%', reg: 'Over-Matched' },
          { rl: '80.0', il: '0.120', vl: '9.60', pl: '1.152', psrc: '1.440', eta: '80.00%', reg: 'High-Efficiency Mode' }
        ];

        benchmarkA.forEach(row => {
          addLogTableRow(row.rl, row.il, row.vl, row.pl, row.psrc, row.eta, row.reg);
        });
        sound.playSuccessChord();
      });
    }

    function addLogTableRow(rl, il, vl, pl, psrc, eta, regime) {
      if (!logTbody) return;
      const tr = document.createElement('tr');
      const timeStr = new Date().toLocaleTimeString();
      const mod = canvasRenderer.activeModule.toUpperCase();
      tr.innerHTML = `
        <td style="font-weight:700; color:#38bdf8;">${logIndex++}</td>
        <td>${timeStr} (${mod})</td>
        <td style="font-family:'JetBrains Mono',monospace;">${rl}</td>
        <td style="font-family:'JetBrains Mono',monospace; color:#38bdf8;">${il}</td>
        <td style="font-family:'JetBrains Mono',monospace; color:#facc15;">${vl}</td>
        <td style="font-family:'JetBrains Mono',monospace; font-weight:700; color:#10b981;">${pl}</td>
        <td style="font-family:'JetBrains Mono',monospace;">${psrc}</td>
        <td style="font-family:'JetBrains Mono',monospace; color:#f59e0b;">${eta}</td>
        <td><span class="status-pill ${regime.includes('MATCH') || regime.includes('Resonance') ? 'highlight' : 'active'}">${regime}</span></td>
      `;
      logTbody.prepend(tr);
    }

    // Initial Benchmark Population
    const initialBenchmarkA = [
      { rl: '0.0 (Short)', il: '0.600 (IN)', vl: '0.00', pl: '0.000', psrc: '7.200', eta: '0.00%', reg: 'Short-Circuit Limit' },
      { rl: '20.0 (=Rth)', il: '0.300', vl: '6.00', pl: '1.800 (Pmax)', psrc: '3.600', eta: '50.00%', reg: 'MAX POWER MATCH' },
      { rl: '80.0', il: '0.120', vl: '9.60', pl: '1.152', psrc: '1.440', eta: '80.00%', reg: 'High-Efficiency Mode' }
    ];
    initialBenchmarkA.forEach(row => {
      addLogTableRow(row.rl, row.il, row.vl, row.pl, row.psrc, row.eta, row.reg);
    });

    // Entry Animations via Anime.js
    if (window.anime) {
      window.anime({
        targets: '.pill-tabs .pill',
        translateY: [-15, 0],
        opacity: [0, 1],
        delay: window.anime.stagger(60),
        easing: 'spring(1, 80, 10, 0)'
      });

      window.anime({
        targets: ['.workbench-left', '.workbench-right'],
        translateY: [20, 0],
        opacity: [0, 1],
        delay: window.anime.stagger(80),
        easing: 'spring(1, 80, 10, 0)'
      });
    }
  });

})();
