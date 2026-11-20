/**
 * ═══════════════════════════════════════════════════════════════════════
 * ELECTRICAL MEASURING INSTRUMENTS & MEASUREMENTS VIRTUAL LAB (All-in-One)
 * VisualLab V2 Engineering Standard — NHIT VisualLab
 * Modules:
 *   1. PMMC D'Arsonval Movement & Shunt/Multiplier Range Extension
 *   2. Three-Phase Two-Wattmeter Power Measurement (Star/Delta)
 *   3. Maxwell's Inductance-Capacitance AC Bridge
 * ═══════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // 1. STATE & BENCHMARK PARAMETERS
  // ═══════════════════════════════════════════════════════════════════
  const STATE = {
    platformMode: 'simulate', // 'simulate' | '3d-model' | 'explore' | 'quiz'
    activeModule: 'pmmc',     // 'pmmc' | 'wattmeter' | 'maxwell'
    activeDeckTab: 'scope',   // 'scope' | 'phasor' | 'curves' | 'null' | 'proofs'
    soundEnabled: true,

    // Module 1: PMMC Movement
    pmmc: {
      functionMode: 'ammeter', // 'basic' | 'ammeter' | 'voltmeter'
      targetRange: 5.0,        // 5.0 A full-scale
      appliedSignal: 2.5,      // Applied current (A) or voltage (V)
      Im: 0.002,               // 2.0 mA full scale
      Rm: 50.0,                // 50.0 ohms internal resistance
      Vm: 0.100,               // 100.0 mV full scale drop
      B: 0.20,                 // 0.20 Tesla
      N: 100,                  // turns
      A: 0.0006,               // 0.03m x 0.02m = 6e-4 m^2
      K: 1.2e-6,               // N*m/rad
      J: 1.2e-8,               // kg*m^2
      dampingRegime: 'critical', // 'under' | 'critical' | 'over'
      zeta: 1.0,
      theta: 0.0,              // Current angular deflection (radians)
      omega: 0.0,              // Angular velocity (rad/s)
      thetaTarget: 0.0,        // Steady state target (radians)
      thetaHistory: [],        // Step response time history
      time: 0.0,
      stepActive: false
    },

    // Module 2: Two-Wattmeter 3-Phase Power
    wattmeter: {
      VL: 400.0,               // Line voltage (V)
      IL: 10.0,                // Line current (A)
      phiDeg: 75.0,            // Phase angle degrees (lagging > 0, leading < 0)
      connection: 'star',      // 'star' | 'delta'
      w2Reversed: true,        // Reversal switch on W2
      capBankActive: false     // Power factor correction
    },

    // Module 3: Maxwell AC Bridge
    maxwell: {
      freq: 1000.0,            // Oscillator frequency (Hz)
      Vs: 5.0,                 // Excitation RMS voltage (V)
      R2: 600.0,               // Decade resistor Arm BC (ohms)
      R3: 1000.0,              // Fixed standard resistor Arm AD (ohms)
      R4: 1500.0,              // Standard decade resistor Arm CD (ohms)
      C4: 0.250e-6,            // Standard variable capacitor Arm CD (Farads)
      selectedCoilId: 2,       // Default mystery coil #2 (Benchmark Case C)
      mysteryCoils: {
        1: { name: 'Coil #1 (Standard Choke)', Lx: 0.100, Rx: 250.0 },
        2: { name: 'Coil #2 (Benchmark Case C)', Lx: 0.150, Rx: 400.0 },
        3: { name: 'Coil #3 (Filter Inductor)', Lx: 0.250, Rx: 500.0 },
        4: { name: 'Coil #4 (High-Q Air Core)', Lx: 0.120, Rx: 45.0 },
        5: { name: 'Coil #5 (Small Solenoid)', Lx: 0.080, Rx: 120.0 }
      },
      toneActive: false
    },

    // Observation Table Records
    observations: [],

    // Challenge Engine State
    challenge: {
      currentIdx: 0,
      score: 0,
      totalPossible: 900,
      attempts: 0
    },

    // Quiz State
    quiz: {
      score: 0,
      answered: 0,
      currentQuestions: []
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 2. WEB AUDIO API SYNTHESIZER
  // ═══════════════════════════════════════════════════════════════════
  class MetrologyAudio {
    constructor() {
      this.ctx = null;
      this.toneOsc = null;
      this.toneGain = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
    }

    playClick() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    }

    playSwitchSnap() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    playSuccessChime() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.25, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.35);
      });
    }

    startBridgeHeadphoneTone(freq = 1000) {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.toneOsc) return;

      this.toneOsc = this.ctx.createOscillator();
      this.toneGain = this.ctx.createGain();
      this.toneOsc.type = 'sine';
      this.toneOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.toneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.toneOsc.connect(this.toneGain);
      this.toneGain.connect(this.ctx.destination);
      this.toneOsc.start();
    }

    updateBridgeHeadphoneTone(vDetMagnitudeMv, freq = 1000) {
      if (!this.toneGain || !this.ctx) return;
      if (!STATE.soundEnabled || !STATE.maxwell.toneActive) {
        this.stopBridgeHeadphoneTone();
        return;
      }
      // Audio tone amplitude proportional to unbalance voltage
      // Below 0.05 mV is pure silence (exact null)
      let norm = Math.min(1.0, vDetMagnitudeMv / 500.0);
      if (vDetMagnitudeMv < 0.05) norm = 0;
      const targetGain = norm * 0.25;
      this.toneGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
      if (this.toneOsc) {
        this.toneOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      }
    }

    stopBridgeHeadphoneTone() {
      if (this.toneOsc) {
        try {
          this.toneOsc.stop();
          this.toneOsc.disconnect();
        } catch (e) {}
        this.toneOsc = null;
        this.toneGain = null;
      }
    }
  }

  const audio = new MetrologyAudio();

  // ═══════════════════════════════════════════════════════════════════
  // 3. MATHEMATICAL & ELECTROMECHANICAL SOLVERS
  // ═══════════════════════════════════════════════════════════════════

  // --- 3.1 PMMC Physics Engine (RK4 Differential Equation Solver) ---
  const PMMCSolver = {
    getMovementParameters() {
      const p = STATE.pmmc;
      const G = p.N * p.B * p.A; // N*m/A
      const K = p.K;             // N*m/rad
      const J = p.J;             // kg*m^2
      const omega_n = Math.sqrt(K / J); // Natural angular frequency

      // Damping coefficient D based on selected regime
      let zeta = 1.0;
      if (p.dampingRegime === 'under') zeta = 0.35;
      else if (p.dampingRegime === 'critical') zeta = 1.0;
      else if (p.dampingRegime === 'over') zeta = 2.2;
      p.zeta = zeta;

      const D = 2 * zeta * Math.sqrt(J * K);
      return { G, K, J, D, omega_n, zeta };
    },

    computeRangeExtension() {
      const p = STATE.pmmc;
      const Im = p.Im; // 2 mA
      const Rm = p.Rm; // 50 ohms
      const Vm = Im * Rm; // 100 mV

      let Rsh = 0;
      let Rse = 0;
      let multiplyingPower = 1.0;
      let sensitivity = 1 / Im; // ohms per volt

      if (p.functionMode === 'ammeter') {
        const I_target = p.targetRange;
        multiplyingPower = I_target / Im;
        if (multiplyingPower > 1) {
          Rsh = (Im * Rm) / (I_target - Im);
        } else {
          Rsh = Rm;
        }
      } else if (p.functionMode === 'voltmeter') {
        const V_target = p.targetRange;
        multiplyingPower = V_target / Vm;
        if (multiplyingPower > 1) {
          Rse = (V_target / Im) - Rm;
        } else {
          Rse = 0;
        }
      }

      // Compute actual current passing through basic meter movement (Im_actual)
      let Im_actual = 0;
      if (p.functionMode === 'basic') {
        Im_actual = p.appliedSignal;
      } else if (p.functionMode === 'ammeter') {
        const I_applied = p.appliedSignal;
        // Current divider: Im_actual = I_applied * Rsh / (Rm + Rsh)
        Im_actual = I_applied * (Rsh / (Rm + Rsh));
      } else if (p.functionMode === 'voltmeter') {
        const V_applied = p.appliedSignal;
        // Series circuit: Im_actual = V_applied / (Rm + Rse)
        Im_actual = V_applied / (Rm + Rse);
      }

      // Max scale angle is 90 degrees = pi / 2 rad
      const fullScaleTheta = Math.PI / 2;
      const theta_ss = Math.min(Math.PI / 2 * 1.05, Math.max(0, (Im_actual / Im) * fullScaleTheta));

      return {
        Im, Rm, Vm, Rsh, Rse, multiplyingPower, sensitivity, Im_actual, theta_ss
      };
    },

    // RK4 Integration Step (60 FPS, dt = 0.016s)
    stepRK4(dt = 0.016) {
      const p = STATE.pmmc;
      const { G, K, J, D } = this.getMovementParameters();
      const ext = this.computeRangeExtension();
      const Im_curr = ext.Im_actual;

      // Equation of motion: J * theta'' + D * theta' + K * theta = G * Im
      // State vector: y[0] = theta, y[1] = omega = theta'
      const f = (th, om) => {
        // Stop mechanical peg at 0 and 95 degrees (0 to 1.658 rad)
        const d_theta = om;
        const d_omega = (G * Im_curr - D * om - K * th) / J;
        return [d_theta, d_omega];
      };

      // RK4 sub-stepping for extreme numerical stability
      const subSteps = 4;
      const h = dt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        let th = p.theta;
        let om = p.omega;

        const [k1_th, k1_om] = f(th, om);
        const [k2_th, k2_om] = f(th + 0.5 * h * k1_th, om + 0.5 * h * k1_om);
        const [k3_th, k3_om] = f(th + 0.5 * h * k2_th, om + 0.5 * h * k2_om);
        const [k4_th, k4_om] = f(th + h * k3_th, om + h * k3_om);

        th += (h / 6) * (k1_th + 2 * k2_th + 2 * k3_th + k4_th);
        om += (h / 6) * (k1_om + 2 * k2_om + 2 * k3_om + k4_om);

        // Mechanical end-stops bounce
        const maxTheta = (95 * Math.PI) / 180;
        if (th < 0) {
          th = 0;
          if (om < 0) om = -0.3 * om; // Bounce off zero peg
        } else if (th > maxTheta) {
          th = maxTheta;
          if (om > 0) om = -0.3 * om; // Bounce off full-scale peg
        }

        p.theta = th;
        p.omega = om;
        p.time += h;
      }

      p.thetaTarget = ext.theta_ss;

      // Record trajectory history for dynamics scope
      p.thetaHistory.push({
        time: p.time,
        theta: p.theta,
        thetaTarget: p.thetaTarget
      });
      if (p.thetaHistory.length > 300) {
        p.thetaHistory.shift();
      }
    }
  };

  // --- 3.2 Two-Wattmeter 3-Phase Power Solver ---
  const WattmeterSolver = {
    solve() {
      const w = STATE.wattmeter;
      const VL = w.VL;
      const IL = w.IL;
      const phiRad = (w.phiDeg * Math.PI) / 180;
      const cosPhi = Math.cos(phiRad);
      const sinPhi = Math.sin(phiRad);

      // Star vs Delta phase relationships
      let Vph = VL / Math.sqrt(3);
      let Iph = IL;
      if (w.connection === 'delta') {
        Vph = VL;
        Iph = IL / Math.sqrt(3);
      }

      // Theoretical wattmeter readings
      // W1 = VL * IL * cos(30° - phi)
      // W2 = VL * IL * cos(30° + phi)
      const angle1 = (30 * Math.PI) / 180 - phiRad;
      const angle2 = (30 * Math.PI) / 180 + phiRad;

      let W1_true = VL * IL * Math.cos(angle1);
      let W2_true = VL * IL * Math.cos(angle2);

      // Total 3-Phase Active Power & Reactive Power
      const P_total = Math.sqrt(3) * VL * IL * cosPhi;
      const Q_total = Math.sqrt(3) * VL * IL * sinPhi;
      const S_total = Math.sqrt(3) * VL * IL;

      // Reversal switch logic on W2
      let W2_needleDeflection = W2_true;
      let W2_registered = W2_true;
      let needsReversal = false;

      if (W2_true < 0) {
        needsReversal = true;
        if (w.w2Reversed) {
          // Polarity switch is flipped, needle deflects upscale
          W2_needleDeflection = Math.abs(W2_true);
          W2_registered = -Math.abs(W2_true);
        } else {
          // Needle hits zero stop peg
          W2_needleDeflection = 0;
          W2_registered = 0;
        }
      } else {
        if (w.w2Reversed) {
          // Reversal switch applied when positive results in negative kick
          W2_needleDeflection = 0;
          W2_registered = -W2_true;
        } else {
          W2_needleDeflection = W2_true;
          W2_registered = W2_true;
        }
      }

      // Computed power factor from wattmeters
      let tanPhi_calc = 0;
      let pf_calc = 1.0;
      const sum = W1_true + W2_true;
      const diff = W1_true - W2_true;
      if (Math.abs(sum) > 0.001) {
        tanPhi_calc = Math.sqrt(3) * (diff / sum);
        pf_calc = Math.cos(Math.atan(tanPhi_calc));
      }

      return {
        connection: w.connection,
        VL, IL, Vph, Iph, phiDeg: w.phiDeg, phiRad, cosPhi, sinPhi,
        angle1Deg: (angle1 * 180) / Math.PI,
        angle2Deg: (angle2 * 180) / Math.PI,
        W1_true, W2_true,
        W1_display: W1_true,
        W2_display: W2_needleDeflection,
        W2_registered,
        needsReversal,
        w2Reversed: w.w2Reversed,
        P_total, Q_total, S_total,
        pf_calc
      };
    }
  };

  // --- 3.3 Maxwell Inductance-Capacitance AC Bridge Solver ---
  const MaxwellSolver = {
    // Complex number arithmetic helpers
    c_add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    c_sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
    c_mul: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
    c_div: (a, b) => {
      const d = b.re * b.re + b.im * b.im;
      return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
    },
    c_mag: (a) => Math.sqrt(a.re * a.re + a.im * a.im),
    c_arg: (a) => Math.atan2(a.im, a.re),

    solve() {
      const m = STATE.maxwell;
      const coil = m.mysteryCoils[m.selectedCoilId];
      const omega = 2 * Math.PI * m.freq;

      const Lx_true = coil.Lx;
      const Rx_true = coil.Rx;

      // Arm 1 (Unknown Coil): Z1 = Rx + j*omega*Lx
      const Z1 = { re: Rx_true, im: omega * Lx_true };
      // Arm 2: Z2 = R2
      const Z2 = { re: m.R2, im: 0 };
      // Arm 3: Z3 = R3 (Fixed standard 1000 ohms)
      const Z3 = { re: m.R3, im: 0 };
      // Arm 4: Standard parallel R4 || C4
      // Y4 = 1/R4 + j*omega*C4 => Z4 = R4 / (1 + j*omega*C4*R4)
      const d4 = 1 + Math.pow(omega * m.C4 * m.R4, 2);
      const Z4 = {
        re: m.R4 / d4,
        im: (-omega * m.C4 * Math.pow(m.R4, 2)) / d4
      };

      // Unbalance voltage across detector terminals B - D:
      // V_BD = Vs * [ Z3 / (Z1 + Z3) - Z4 / (Z2 + Z4) ]
      const Z1_plus_Z3 = this.c_add(Z1, Z3);
      const Z2_plus_Z4 = this.c_add(Z2, Z4);
      const term1 = this.c_div(Z3, Z1_plus_Z3);
      const term2 = this.c_div(Z4, Z2_plus_Z4);
      const ratioDiff = this.c_sub(term1, term2);

      const V_det = {
        re: m.Vs * ratioDiff.re,
        im: m.Vs * ratioDiff.im
      };
      const vDetMag = this.c_mag(V_det);
      const vDetMagMv = vDetMag * 1000;
      const vDetArg = this.c_arg(V_det);

      // Student extracted coil values from dial settings
      // Rx_calc = (R2 * R3) / R4
      // Lx_calc = R2 * R3 * C4
      // Q_calc = omega * C4 * R4
      const Rx_calc = (m.R2 * m.R3) / m.R4;
      const Lx_calc = m.R2 * m.R3 * m.C4;
      const Q_calc = omega * m.C4 * m.R4;

      const isBalanced = vDetMagMv < 0.05; // Less than 50 microvolts

      return {
        freq: m.freq,
        omega,
        Vs: m.Vs,
        R2: m.R2,
        R3: m.R3,
        R4: m.R4,
        C4: m.C4,
        Lx_true,
        Rx_true,
        Rx_calc,
        Lx_calc,
        Q_calc,
        vDetMag,
        vDetMagMv,
        vDetArg,
        isBalanced,
        coilName: coil.name
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 4. INTERACTIVE CANVAS 2D RENDERERS
  // ═══════════════════════════════════════════════════════════════════

  class CanvasWorkbench {
    constructor() {
      this.canvas = document.getElementById('meter-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.wrapper = document.getElementById('canvas-viewport-wrapper');

      // Camera Pan & Zoom Transform
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.showGrid = true;

      this.initEvents();
    }

    initEvents() {
      // Pan with Left Drag or Space+Drag
      this.wrapper.addEventListener('mousedown', (e) => {
        if (e.button === 0 || e.button === 1) { // Left or Middle click
          this.isDragging = true;
          this.wrapper.classList.add('is-dragging');
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.panX += dx;
        this.panY += dy;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.wrapper.classList.remove('is-dragging');
        }
      });

      // Smooth Mouse-Centered Wheel Zoom
      this.wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.909;
        const newZoom = Math.min(3.0, Math.max(0.4, this.zoom * zoomFactor));

        // Adjust pan so point under cursor stays stationary
        this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
        this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;

        this.updateZoomIndicator();
      }, { passive: false });

      // HUD Button Listeners
      document.getElementById('hud-zoom-in').addEventListener('click', () => {
        this.zoomAtCenter(1.2);
        audio.playClick();
      });
      document.getElementById('hud-zoom-out').addEventListener('click', () => {
        this.zoomAtCenter(0.833);
        audio.playClick();
      });
      document.getElementById('hud-zoom-1').addEventListener('click', () => {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.updateZoomIndicator();
        audio.playClick();
      });
      document.getElementById('hud-fit').addEventListener('click', () => {
        this.fitView();
        audio.playClick();
      });
      document.getElementById('hud-grid').addEventListener('click', (e) => {
        this.showGrid = !this.showGrid;
        e.currentTarget.classList.toggle('active', this.showGrid);
        audio.playClick();
      });

      // Fullscreen Button
      document.getElementById('btn-fullscreen').addEventListener('click', () => {
        this.toggleFullscreen();
      });

      // Keyboard Shortcuts
      window.addEventListener('keydown', (e) => {
        // Only trigger shortcuts when not typing in an input
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key === '+' || e.key === '=') {
          this.zoomAtCenter(1.15);
        } else if (e.key === '-' || e.key === '_') {
          this.zoomAtCenter(0.85);
        } else if (e.key === '0') {
          this.zoom = 1.0;
          this.panX = 0;
          this.panY = 0;
          this.updateZoomIndicator();
        } else if (e.key === 'f' || e.key === 'F') {
          this.toggleFullscreen();
        } else if (e.key === 'g' || e.key === 'G') {
          this.showGrid = !this.showGrid;
          document.getElementById('hud-grid').classList.toggle('active', this.showGrid);
        } else if (e.key === 'Escape') {
          if (document.body.classList.contains('is-canvas-fullscreen')) {
            this.exitFullscreen();
          }
        }
      });

      // Resize observer
      window.addEventListener('resize', () => {
        this.resizeCanvas();
      });
      this.resizeCanvas();
    }

    resizeCanvas() {
      const rect = this.wrapper.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
      }
    }

    zoomAtCenter(factor) {
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      const newZoom = Math.min(3.0, Math.max(0.4, this.zoom * factor));
      this.panX = cx - (cx - this.panX) * (newZoom / this.zoom);
      this.panY = cy - (cy - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;
      this.updateZoomIndicator();
    }

    fitView() {
      this.resizeCanvas();
      const baseW = 880;
      const baseH = 520;
      const scaleX = this.canvas.width / baseW;
      const scaleY = this.canvas.height / baseH;
      this.zoom = Math.min(scaleX, scaleY) * 0.94;
      this.panX = (this.canvas.width - baseW * this.zoom) / 2;
      this.panY = (this.canvas.height - baseH * this.zoom) / 2;
      this.updateZoomIndicator();
    }

    updateZoomIndicator() {
      document.getElementById('hud-zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
    }

    toggleFullscreen() {
      if (!document.body.classList.contains('is-canvas-fullscreen')) {
        document.body.classList.add('is-canvas-fullscreen');
        document.getElementById('btn-fullscreen').innerHTML = '&#128471; Exit Fullscreen';
        setTimeout(() => this.fitView(), 60);
      } else {
        this.exitFullscreen();
      }
      audio.playSwitchSnap();
    }

    exitFullscreen() {
      document.body.classList.remove('is-canvas-fullscreen');
      document.getElementById('btn-fullscreen').innerHTML = '&#9974; Fullscreen';
      setTimeout(() => this.fitView(), 60);
      audio.playSwitchSnap();
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Deep theme background
      ctx.fillStyle = '#00171f';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      // Draw grid
      if (this.showGrid) {
        this.drawCoordinateGrid(ctx);
      }

      // Delegate rendering to active module
      if (STATE.activeModule === 'pmmc') {
        this.renderPMMC(ctx);
      } else if (STATE.activeModule === 'wattmeter') {
        this.renderTwoWattmeter(ctx);
      } else if (STATE.activeModule === 'maxwell') {
        this.renderMaxwellBridge(ctx);
      }

      ctx.restore();
    }

    drawCoordinateGrid(ctx) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 86, 107, 0.25)';
      ctx.lineWidth = 1;

      const gridSize = 40;
      const minX = -400;
      const maxX = 1300;
      const minY = -300;
      const maxY = 900;

      ctx.beginPath();
      for (let x = minX; x <= maxX; x += gridSize) {
        ctx.moveTo(x, minY);
        ctx.lineTo(x, maxY);
      }
      for (let y = minY; y <= maxY; y += gridSize) {
        ctx.moveTo(minX, y);
        ctx.lineTo(maxX, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // --- MODULE 1: PMMC D'ARSONVAL CUTAWAY RENDERER ---
    renderPMMC(ctx) {
      const p = STATE.pmmc;
      const ext = PMMCSolver.computeRangeExtension();
      const currentTheta = p.theta; // radians (0 to pi/2)
      const thetaDeg = (currentTheta * 180) / Math.PI;

      const cx = 440;
      const cy = 350;

      // 1. Permanent Horseshoe Magnet Assembly
      ctx.save();
      // Magnet Yoke Base
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(cx - 280, cy - 230, 560, 400);
      ctx.fill();
      ctx.stroke();

      // Inner Cavity
      ctx.fillStyle = '#091524';
      ctx.beginPath();
      ctx.arc(cx, cy, 210, 0, Math.PI * 2);
      ctx.fill();

      // North Pole Shoe (Curved Cylindrical - Red Left)
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 180, Math.PI * 0.75, Math.PI * 1.25);
      ctx.arc(cx, cy, 130, Math.PI * 1.25, Math.PI * 0.75, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // North Pole Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', cx - 155, cy);

      // South Pole Shoe (Curved Cylindrical - Blue Right)
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx, cy, 180, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.arc(cx, cy, 130, Math.PI * 0.25, -Math.PI * 0.25, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // South Pole Label
      ctx.fillStyle = '#ffffff';
      ctx.fillText('S', cx + 155, cy);

      // Radial Magnetic Field Lines (Cyan dashed lines)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      for (let a = -40; a <= 40; a += 10) {
        const rad = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx - 130 * Math.cos(rad), cy + 130 * Math.sin(rad));
        ctx.lineTo(cx - 70 * Math.cos(rad), cy + 70 * Math.sin(rad));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 70 * Math.cos(rad), cy + 70 * Math.sin(rad));
        ctx.lineTo(cx + 130 * Math.cos(rad), cy + 130 * Math.sin(rad));
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Central Cylindrical Soft-Iron Core (Concentrates Flux)
      const gradCore = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, 65);
      gradCore.addColorStop(0, '#94a3b8');
      gradCore.addColorStop(1, '#475569');
      ctx.fillStyle = gradCore;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('SOFT-IRON', cx, cy - 8);
      ctx.fillText('CORE', cx, cy + 8);

      // 2. Rotating Coil & Aluminum Former Assembly (Rotates with currentTheta)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(currentTheta);

      // Rectangular Aluminum Former (Eddy-Current Damping)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-90, -32, 180, 64);

      // Copper Coil Windings (Multiple loops)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(-86, -28, 172, 56);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(-83, -25, 166, 50);

      // Lorentz Force Vectors (Neon Green & Rose Arrows)
      if (ext.Im_actual > 0.00005) {
        // Upper side pushing up
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(0, -68);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-6, -62);
        ctx.lineTo(0, -74);
        ctx.lineTo(6, -62);
        ctx.fill();
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText('F = NBIl', 44, -58);

        // Lower side pushing down
        ctx.strokeStyle = '#f43f5e';
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(0, 68);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-6, 62);
        ctx.lineTo(0, 74);
        ctx.lineTo(6, 62);
        ctx.fill();
      }

      // Phosphor-Bronze Spiral Hairspring
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let rSpring = 12;
      for (let a = 0; a < Math.PI * 6; a += 0.2) {
        rSpring += 0.6;
        const sx = rSpring * Math.cos(a);
        const sy = rSpring * Math.sin(a);
        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Jeweled Pivot Bearing
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore(); // Restore coil rotation

      // 3. Mirror-Scale Arc & Knife-Edge Red Pointer
      const radiusScale = 270;
      const startAngle = Math.PI * 1.25; // -45 deg from top (135 deg)
      const sweepAngle = Math.PI * 0.50; // 90 degrees total sweep

      // Curved Scale Plate Background
      ctx.fillStyle = '#020d1a';
      ctx.strokeStyle = '#00566b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusScale + 30, startAngle - 0.05, startAngle + sweepAngle + 0.05);
      ctx.arc(cx, cy, radiusScale - 50, startAngle + sweepAngle + 0.05, startAngle - 0.05, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mirror Strip (Parallax Error Elimination)
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusScale - 20, startAngle, startAngle + sweepAngle);
      ctx.stroke();

      // Scale Arc Main Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusScale, startAngle, startAngle + sweepAngle);
      ctx.stroke();

      // Scale Ticks & Numbers (10 Major divisions)
      const numDivs = 10;
      for (let i = 0; i <= numDivs; i++) {
        const frac = i / numDivs;
        const tickAngle = startAngle + frac * sweepAngle;

        const isMajor = i % 2 === 0;
        const tickLen = isMajor ? 16 : 9;

        const x1 = cx + (radiusScale - tickLen) * Math.cos(tickAngle);
        const y1 = cy + (radiusScale - tickLen) * Math.sin(tickAngle);
        const x2 = cx + radiusScale * Math.cos(tickAngle);
        const y2 = cy + radiusScale * Math.sin(tickAngle);

        ctx.strokeStyle = isMajor ? '#f8fafc' : '#94a3b8';
        ctx.lineWidth = isMajor ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Labels
        if (isMajor) {
          const tx = cx + (radiusScale + 18) * Math.cos(tickAngle);
          const ty = cy + (radiusScale + 18) * Math.sin(tickAngle);

          // Percent Scale
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px JetBrains Mono';
          ctx.fillText(`${i * 10}%`, tx, ty);

          // Real Measured Value Scale
          const valText = (frac * p.targetRange).toFixed(p.targetRange >= 10 ? 0 : 1);
          const unit = p.functionMode === 'voltmeter' ? 'V' : (p.functionMode === 'ammeter' ? 'A' : 'mA');
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '10px JetBrains Mono';
          ctx.fillText(`${valText}${unit}`, tx, ty + 12);
        }
      }

      // Pointer Needle (Red knife-edge, swings by currentTheta)
      const pointerAngle = startAngle + (currentTheta / (Math.PI / 2)) * sweepAngle;
      const px = cx + (radiusScale + 6) * Math.cos(pointerAngle);
      const py = cy + (radiusScale + 6) * Math.sin(pointerAngle);

      // Pointer Shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx + 2, cy + 2);
      ctx.lineTo(px + 3, py + 3);
      ctx.stroke();

      // Knife-edge Pointer Needle
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Counter-balance tail
      const tailX = cx - 35 * Math.cos(pointerAngle);
      const tailY = cy - 35 * Math.sin(pointerAngle);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Pivot Cap
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 4. Inset Shunt/Multiplier Circuit Wiring Box (Top-Left Corner)
      this.drawPMMCShuntBox(ctx, ext);

      ctx.restore();
    }

    drawPMMCShuntBox(ctx, ext) {
      const p = STATE.pmmc;
      const bx = 40;
      const by = 30;
      const bw = 240;
      const bh = 140;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 33, 43, 0.9)';
      ctx.strokeStyle = '#00566b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText('WIRING & RANGE EXTENSION', bx + 10, by + 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';

      if (p.functionMode === 'ammeter') {
        ctx.fillText(`Target Range: 0 - ${p.targetRange} A`, bx + 10, by + 36);
        ctx.fillText(`Shunt: Rsh = ${ext.Rsh.toFixed(4)} Ω (Parallel)`, bx + 10, by + 52);
        ctx.fillText(`Multiplying Factor: m = ${ext.multiplyingPower.toFixed(1)}`, bx + 10, by + 68);

        // Schematic miniature
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 20, by + 95); ctx.lineTo(bx + 70, by + 95);
        ctx.lineTo(bx + 70, by + 82); ctx.lineTo(bx + 160, by + 82); // Meter line
        ctx.lineTo(bx + 160, by + 95); ctx.lineTo(bx + 210, by + 95);
        ctx.moveTo(bx + 70, by + 95); ctx.lineTo(bx + 70, by + 115);
        ctx.lineTo(bx + 160, by + 115); ctx.lineTo(bx + 160, by + 95); // Shunt line
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('Meter (Rm)', bx + 85, by + 80);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Shunt (Rsh)', bx + 85, by + 126);
      } else if (p.functionMode === 'voltmeter') {
        ctx.fillText(`Target Range: 0 - ${p.targetRange} V`, bx + 10, by + 36);
        ctx.fillText(`Multiplier: Rse = ${ext.Rse.toFixed(1)} Ω (Series)`, bx + 10, by + 52);
        ctx.fillText(`Sensitivity: S = ${ext.sensitivity.toFixed(0)} Ω/V`, bx + 10, by + 68);

        // Schematic miniature
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 20, by + 100); ctx.lineTo(bx + 70, by + 100);
        ctx.lineTo(bx + 120, by + 100); ctx.lineTo(bx + 170, by + 100);
        ctx.lineTo(bx + 210, by + 100);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Rse (Series)', bx + 65, by + 92);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('Meter (Rm)', bx + 135, by + 92);
      } else {
        ctx.fillText('Direct Meter Movement', bx + 10, by + 36);
        ctx.fillText(`Full Scale Im: ${(p.Im * 1000).toFixed(1)} mA`, bx + 10, by + 52);
        ctx.fillText(`Coil Rm: ${p.Rm.toFixed(1)} Ω`, bx + 10, by + 68);
        ctx.fillText('Direct connection without shunts.', bx + 10, by + 84);
      }

      ctx.restore();
    }

    // --- MODULE 2: TWO-WATTMETER 3-PHASE RIG RENDERER ---
    renderTwoWattmeter(ctx) {
      const wm = WattmeterSolver.solve();
      const cx = 440;
      const cy = 260;

      ctx.save();

      // Title & Subtitle inside canvas
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('THREE-PHASE TWO-WATTMETER POWER MEASUREMENT RIG', cx, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(`Supply: 3Φ 3-Wire ${wm.VL}V 50Hz | Load: ${wm.connection.toUpperCase()} Connected (PF = ${wm.cosPhi.toFixed(4)})`, cx, 48);

      // 1. Three-Phase Busbars (Red R, Yellow Y, Blue B)
      const busX_start = 50;
      const busX_end = 260;
      const y_R = 90;
      const y_Y = 190;
      const y_B = 290;

      // Phase R (Red)
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(busX_start, y_R); ctx.lineTo(busX_end, y_R); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 14px JetBrains Mono'; ctx.fillText('LINE R (Red)', busX_start + 45, y_R - 8);

      // Phase Y (Yellow)
      ctx.strokeStyle = '#eab308';
      ctx.beginPath(); ctx.moveTo(busX_start, y_Y); ctx.lineTo(busX_end + 340, y_Y); ctx.stroke();
      ctx.fillStyle = '#eab308'; ctx.fillText('LINE Y (Yellow)', busX_start + 45, y_Y - 8);

      // Phase B (Blue)
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath(); ctx.moveTo(busX_start, y_B); ctx.lineTo(busX_end, y_B); ctx.stroke();
      ctx.fillStyle = '#3b82f6'; ctx.fillText('LINE B (Blue)', busX_start + 45, y_B - 8);

      // 2. Dual Wattmeters (W1 & W2) Visualized as Hardware Instruments
      this.drawAnalogWattmeterFace(ctx, 280, 70, 'W1 (Phase R)', wm.W1_display, false);
      this.drawAnalogWattmeterFace(ctx, 280, 270, 'W2 (Phase B)', wm.W2_display, wm.needsReversal);

      // 3. Current Coils (Heavy Thick Coils) & Potential Coils
      // W1 Connections
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(busX_end + 80, y_R); ctx.lineTo(cx + 170, y_R); ctx.stroke();
      // W1 Potential connection down to Line Y
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(320, 130); ctx.lineTo(320, y_Y); ctx.stroke(); ctx.setLineDash([]);

      // W2 Connections
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(busX_end + 80, y_B); ctx.lineTo(cx + 170, y_B); ctx.stroke();
      // W2 Potential connection up to Line Y (through Reversal Switch)
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(320, 270); ctx.lineTo(320, y_Y); ctx.stroke(); ctx.setLineDash([]);

      // 4. Three-Phase Load Bank (Star / Delta)
      const loadCenterX = cx + 270;
      const loadCenterY = 190;
      this.draw3PhaseLoad(ctx, loadCenterX, loadCenterY, wm.connection, y_R, y_Y, y_B);

      // 5. Reversal Switch Graphic on W2 Potential Line
      this.drawReversalSwitch(ctx, 320, 220, wm.w2Reversed, wm.needsReversal);

      ctx.restore();
    }

    drawAnalogWattmeterFace(ctx, x, y, label, watts, isReversedWarning) {
      const w = 150;
      const h = 110;

      ctx.save();
      // Instrument Bezel
      ctx.fillStyle = '#021822';
      ctx.strokeStyle = isReversedWarning ? '#f59e0b' : '#00566b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y - 10, w, h, 8);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.fillStyle = isReversedWarning ? '#f59e0b' : '#38bdf8';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + 10);

      // Scale Arc
      const mx = x + w / 2;
      const my = y + 78;
      const r = 58;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, r, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Max power is 5000 W
      const maxPower = 5000;
      const minPower = 0;
      const clampedW = Math.min(maxPower, Math.max(minPower, watts));
      const frac = clampedW / maxPower;
      const needleAngle = Math.PI * 1.25 + frac * (Math.PI * 0.50);

      // Needle
      const nx = mx + (r - 4) * Math.cos(needleAngle);
      const ny = my + (r - 4) * Math.sin(needleAngle);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Pivot
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();

      // Digital readout
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText(`${watts.toFixed(1)} W`, mx, y + 92);

      if (isReversedWarning) {
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText('REVERSE (W2 < 0)', mx, y + 42);
      }

      ctx.restore();
    }

    draw3PhaseLoad(ctx, cx, cy, connection, yR, yY, yB) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 45, 58, 0.6)';
      ctx.strokeStyle = '#00566b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 70, cy - 120, 140, 240, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`3Φ LOAD (${connection.toUpperCase()})`, cx, cy - 98);

      if (connection === 'star') {
        // Star neutral point
        const nx = cx;
        const ny = cy;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        // Branch R
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(cx, yR); ctx.stroke();
        // Branch Y
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(cx, yY); ctx.stroke();
        // Branch B
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(cx, yB); ctx.stroke();

        // Branch impedances (RL coils)
        this.drawImpedanceSymbol(ctx, cx, (ny + yR) / 2, 'ZR');
        this.drawImpedanceSymbol(ctx, cx, (ny + yY) / 2, 'ZY');
        this.drawImpedanceSymbol(ctx, cx, (ny + yB) / 2, 'ZB');

        // Neutral point node
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(nx, ny, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillText('N (Star Point)', nx, ny + 16);
      } else {
        // Delta connection
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 30, yR); ctx.lineTo(cx + 30, yY);
        ctx.lineTo(cx - 30, yB); ctx.closePath();
        ctx.stroke();

        this.drawImpedanceSymbol(ctx, cx, yR + 30, 'ZRY');
        this.drawImpedanceSymbol(ctx, cx + 15, cy + 30, 'ZYB');
        this.drawImpedanceSymbol(ctx, cx - 30, cy, 'ZBR');
      }

      ctx.restore();
    }

    drawImpedanceSymbol(ctx, x, y, label) {
      ctx.fillStyle = '#021822';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.fillRect(x - 14, y - 8, 28, 16);
      ctx.strokeRect(x - 14, y - 8, 28, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(label, x, y + 4);
    }

    drawReversalSwitch(ctx, x, y, isReversed, needsReversal) {
      ctx.save();
      ctx.fillStyle = '#021822';
      ctx.strokeStyle = needsReversal ? '#f59e0b' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 45, y - 12, 90, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isReversed ? '#10b981' : '#f43f5e';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(isReversed ? 'POLARITY: REVERSED' : 'POLARITY: NORMAL', x, y + 4);
      ctx.restore();
    }

    // --- MODULE 3: MAXWELL AC BRIDGE DIAMOND RENDERER ---
    renderMaxwellBridge(ctx) {
      const mb = MaxwellSolver.solve();
      const cx = 440;
      const cy = 260;

      ctx.save();

      // Title & Subtitle inside canvas
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px Inter';
      ctx.textAlign = 'center';
      ctx.fillText("MAXWELL'S INDUCTANCE-CAPACITANCE AC BRIDGE", cx, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(`Source: ${mb.Vs}V RMS @ ${mb.freq}Hz | Detector Unbalance: |V_BD| = ${mb.vDetMagMv.toFixed(2)} mV`, cx, 48);

      // 4 Diamond Nodes: A (Top), B (Right), C (Bottom), D (Left)
      const topNode = { x: cx, y: cy - 160 };      // Node A
      const rightNode = { x: cx + 220, y: cy };    // Node B
      const bottomNode = { x: cx, y: cy + 160 };   // Node C
      const leftNode = { x: cx - 220, y: cy };     // Node D

      // Bridge Wires (Diamond perimeter)
      ctx.strokeStyle = '#00566b';
      ctx.lineWidth = 3;

      // Arm AB (Arm 1): Unknown Coil (Lx, Rx)
      ctx.beginPath(); ctx.moveTo(topNode.x, topNode.y); ctx.lineTo(rightNode.x, rightNode.y); ctx.stroke();
      this.drawBridgeArmBox(ctx, (topNode.x + rightNode.x) / 2, (topNode.y + rightNode.y) / 2,
        'ARM 1 (Unknown Coil)', `Lx = ${(mb.Lx_true * 1000).toFixed(1)} mH`, `Rx = ${mb.Rx_true.toFixed(1)} Ω`, '#f43f5e');

      // Arm BC (Arm 2): Known Variable Resistor R2
      ctx.beginPath(); ctx.moveTo(rightNode.x, rightNode.y); ctx.lineTo(bottomNode.x, bottomNode.y); ctx.stroke();
      this.drawBridgeArmBox(ctx, (rightNode.x + bottomNode.x) / 2, (rightNode.y + bottomNode.y) / 2,
        'ARM 2 (Variable R2)', `R2 = ${mb.R2.toFixed(1)} Ω`, 'Decade Resistance', '#38bdf8');

      // Arm AD (Arm 3): Known Fixed Resistor R3
      ctx.beginPath(); ctx.moveTo(topNode.x, topNode.y); ctx.lineTo(leftNode.x, leftNode.y); ctx.stroke();
      this.drawBridgeArmBox(ctx, (topNode.x + leftNode.x) / 2, (topNode.y + leftNode.y) / 2,
        'ARM 3 (Ratio R3)', `R3 = ${mb.R3.toFixed(1)} Ω`, 'Fixed Standard', '#a855f7');

      // Arm CD (Arm 4): Standard Parallel R4 || C4
      ctx.beginPath(); ctx.moveTo(leftNode.x, leftNode.y); ctx.lineTo(bottomNode.x, bottomNode.y); ctx.stroke();
      this.drawBridgeArmBox(ctx, (leftNode.x + bottomNode.x) / 2, (leftNode.y + bottomNode.y) / 2,
        'ARM 4 (R4 || C4)', `R4 = ${mb.R4.toFixed(1)} Ω`, `C4 = ${(mb.C4 * 1e6).toFixed(3)} μF`, '#10b981');

      // Central Detector Branch (Nodes B to D)
      ctx.strokeStyle = mb.isBalanced ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(leftNode.x, leftNode.y); ctx.lineTo(rightNode.x, rightNode.y); ctx.stroke();

      // Vibration Galvanometer / Microvoltmeter Null Detector in center
      this.drawNullDetector(ctx, cx, cy, mb.vDetMagMv, mb.isBalanced);

      // AC Excitation Source (Nodes A to C outer connection)
      this.drawACSource(ctx, cx - 290, cy, topNode, bottomNode, mb.Vs, mb.freq);

      // Draw Diamond Terminal Nodes
      this.drawTerminalNode(ctx, topNode.x, topNode.y, 'A');
      this.drawTerminalNode(ctx, rightNode.x, rightNode.y, 'B');
      this.drawTerminalNode(ctx, bottomNode.x, bottomNode.y, 'C');
      this.drawTerminalNode(ctx, leftNode.x, leftNode.y, 'D');

      ctx.restore();
    }

    drawBridgeArmBox(ctx, x, y, title, line1, line2, accentColor) {
      const bw = 140;
      const bh = 54;
      ctx.save();
      ctx.fillStyle = '#021822';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(title, x, y - 13);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText(line1, x, y + 3);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(line2, x, y + 17);
      ctx.restore();
    }

    drawNullDetector(ctx, cx, cy, vDetMv, isBalanced) {
      ctx.save();
      // Glowing housing
      ctx.fillStyle = '#001b24';
      ctx.strokeStyle = isBalanced ? '#10b981' : '#f59e0b';
      ctx.lineWidth = isBalanced ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Zero-center meter scale
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 18, 42, Math.PI * 1.3, Math.PI * 1.7);
      ctx.stroke();

      // Zero Center Tick
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 24);
      ctx.lineTo(cx, cy - 14);
      ctx.stroke();

      // Deflecting Needle
      // vDetMv ranges 0 to 500 mV
      const maxAngle = Math.PI * 0.18;
      const angle = isBalanced ? 0 : Math.min(maxAngle, (vDetMv / 300) * maxAngle);
      const needleLen = 36;
      const nx = cx + needleLen * Math.sin(angle);
      const ny = cy - needleLen * Math.cos(angle);

      ctx.strokeStyle = isBalanced ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 10);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Pivot
      ctx.fillStyle = isBalanced ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Text readout
      ctx.fillStyle = isBalanced ? '#10b981' : '#f8fafc';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      if (isBalanced) {
        ctx.fillText('NULL (BALANCED)', cx, cy + 34);
      } else {
        ctx.fillText(`${vDetMv.toFixed(1)} mV`, cx, cy + 34);
      }

      ctx.restore();
    }

    drawACSource(ctx, sx, sy, topNode, bottomNode, Vs, freq) {
      ctx.save();
      // Outer connection wires
      ctx.strokeStyle = '#00566b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topNode.x, topNode.y);
      ctx.lineTo(sx, topNode.y);
      ctx.lineTo(sx, sy - 24);

      ctx.moveTo(bottomNode.x, bottomNode.y);
      ctx.lineTo(sx, bottomNode.y);
      ctx.lineTo(sx, sy + 24);
      ctx.stroke();

      // Source Circle
      ctx.fillStyle = '#021822';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sine wave symbol
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -14; x <= 14; x++) {
        const y = -8 * Math.sin((x / 14) * Math.PI);
        if (x === -14) ctx.moveTo(sx + x, sy + y);
        else ctx.lineTo(sx + x, sy + y);
      }
      ctx.stroke();

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${Vs}V @ ${freq}Hz`, sx, sy + 38);
      ctx.restore();
    }

    drawTerminalNode(ctx, x, y, label) {
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const offset = (y < 260) ? -16 : (y > 260 ? 16 : (x < 440 ? -16 : 16));
      ctx.fillText(label, x + (y === 260 ? offset : 0), y + (x === 440 ? offset : 0));
      ctx.restore();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. RIGHT DECK OSCILLOSCOPE & VECTOR TELEMETRY RENDERERS
  // ═══════════════════════════════════════════════════════════════════

  class ScopeDeckRenderer {
    constructor() {
      this.canvas = document.getElementById('scope-canvas');
      this.ctx = this.canvas.getContext('2d');
    }

    render() {
      const tab = STATE.activeDeckTab;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#001219';
      ctx.fillRect(0, 0, w, h);

      // Grid background
      this.drawScopeGrid(ctx, w, h);

      if (tab === 'scope') {
        this.renderPMMCDynamicsScope(ctx, w, h);
      } else if (tab === 'phasor') {
        this.render3PhasePhasors(ctx, w, h);
      } else if (tab === 'curves') {
        this.renderWattmeterCurves(ctx, w, h);
      } else if (tab === 'null') {
        this.renderBridgeNullScope(ctx, w, h);
      } else if (tab === 'proofs') {
        this.renderProofsTab(ctx, w, h);
      }
    }

    drawScopeGrid(ctx, w, h) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 86, 107, 0.3)';
      ctx.lineWidth = 1;
      const dx = 40;
      const dy = 30;

      ctx.beginPath();
      for (let x = 0; x <= w; x += dx) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += dy) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Center crosshair
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.restore();
    }

    // --- TAB 1: PMMC DYNAMICS SCOPE θ(t) ---
    renderPMMCDynamicsScope(ctx, w, h) {
      const p = STATE.pmmc;
      const history = p.thetaHistory;

      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText(`PMMC STEP RESPONSE θ(t) [${p.dampingRegime.toUpperCase()} DAMPING, ζ=${p.zeta.toFixed(2)}]`, 10, 18);

      if (history.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.fillText('Click "Apply Step Current" to observe transient response.', 10, h / 2);
        ctx.restore();
        return;
      }

      // Draw Steady-State Line (Target)
      const targetDeg = (p.thetaTarget * 180) / Math.PI;
      const targetY = h - 25 - (targetDeg / 100) * (h - 50);

      ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, targetY); ctx.lineTo(w, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#eab308';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Target θ_ss = ${targetDeg.toFixed(1)}°`, w - 140, targetY - 4);

      // Plot Trajectory
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let i = 0; i < history.length; i++) {
        const item = history[i];
        const deg = (item.theta * 180) / Math.PI;
        const x = (i / (history.length - 1)) * (w - 20) + 10;
        const y = h - 25 - (deg / 100) * (h - 50);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Current live deflection marker
      const currDeg = (p.theta * 180) / Math.PI;
      const curX = w - 10;
      const curY = h - 25 - (currDeg / 100) * (h - 50);
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(curX, curY, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`θ = ${currDeg.toFixed(1)}°`, curX - 70, curY - 8);

      ctx.restore();
    }

    // --- TAB 2: THREE-PHASE PHASOR DIAGRAM ---
    render3PhasePhasors(ctx, w, h) {
      const wm = WattmeterSolver.solve();
      const cx = w / 2;
      const cy = h / 2;
      const rV = 80;
      const rI = 60;

      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText('3Φ VOLTAGE & CURRENT PHASORS (V_RY, V_BY, I_R, I_B)', 10, 18);

      // Line Voltages Reference:
      // V_RY along 0° (horizontal right)
      // V_BY along -60° (or corresponding 3Φ relation)
      const drawVector = (angleRad, len, color, label) => {
        const vx = cx + len * Math.cos(angleRad);
        const vy = cy - len * Math.sin(angleRad); // Invert Y for canvas

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(vx, vy);
        ctx.stroke();

        // Arrowhead
        const arrowSize = 6;
        const headAngle = Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx - arrowSize * Math.cos(angleRad - headAngle), vy + arrowSize * Math.sin(angleRad - headAngle));
        ctx.lineTo(vx - arrowSize * Math.cos(angleRad + headAngle), vy + arrowSize * Math.sin(angleRad + headAngle));
        ctx.fill();

        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(label, vx + 8 * Math.cos(angleRad), vy - 8 * Math.sin(angleRad));
      };

      // V_RY phasor (0°)
      drawVector(0, rV, '#ef4444', 'V_RY');
      // V_BY phasor (-60° = -pi/3)
      drawVector(-Math.PI / 3, rV, '#3b82f6', 'V_BY');

      // Currents:
      // I_R lags V_R by phi. In two-wattmeter method, angle between I_R and V_RY is (30° - phi)
      const angle_IR = (30 * Math.PI) / 180 - wm.phiRad;
      drawVector(angle_IR, rI, '#f59e0b', 'I_R');

      // Angle between I_B and V_BY is (30° + phi)
      const angle_IB = -Math.PI / 3 + (30 * Math.PI) / 180 + wm.phiRad;
      drawVector(angle_IB, rI, '#10b981', 'I_B');

      // Angle indicator arcs
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`∠(V_RY, I_R) = ${(30 - wm.phiDeg).toFixed(1)}°`, 10, h - 22);
      ctx.fillText(`∠(V_BY, I_B) = ${(30 + wm.phiDeg).toFixed(1)}°`, 10, h - 8);

      ctx.restore();
    }

    // --- TAB 3: W1, W2 & POWER FACTOR VS PHI CURVES ---
    renderWattmeterCurves(ctx, w, h) {
      const wm = WattmeterSolver.solve();

      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText('W1 & W2 VS PHASE ANGLE φ (-90° TO +90°)', 10, 18);

      const zeroY = h / 2 + 10;
      const minX = 40;
      const maxX = w - 20;

      // Zero Power Line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(minX, zeroY); ctx.lineTo(maxX, zeroY);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText('0 W', 10, zeroY + 3);

      // Plot W1(phi) in Emerald Green
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let pDeg = -90; pDeg <= 90; pDeg += 2) {
        const rad = (pDeg * Math.PI) / 180;
        const w1_val = wm.VL * wm.IL * Math.cos((30 * Math.PI) / 180 - rad);
        const x = minX + ((pDeg + 90) / 180) * (maxX - minX);
        const y = zeroY - (w1_val / 8000) * (h / 2 - 25);
        if (pDeg === -90) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Plot W2(phi) in Amber
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let pDeg = -90; pDeg <= 90; pDeg += 2) {
        const rad = (pDeg * Math.PI) / 180;
        const w2_val = wm.VL * wm.IL * Math.cos((30 * Math.PI) / 180 + rad);
        const x = minX + ((pDeg + 90) / 180) * (maxX - minX);
        const y = zeroY - (w2_val / 8000) * (h / 2 - 25);
        if (pDeg === -90) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Vertical Marker for current operating phi
      const curX = minX + ((wm.phiDeg + 90) / 180) * (maxX - minX);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, 25); ctx.lineTo(curX, h - 15);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`φ = ${wm.phiDeg.toFixed(1)}°`, curX - 25, h - 5);

      // Legend
      ctx.fillStyle = '#10b981'; ctx.fillText('■ W1', w - 100, 18);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('■ W2', w - 50, 18);

      ctx.restore();
    }

    // --- TAB 4: BRIDGE NULL DETECTOR OSCILLOSCOPE ---
    renderBridgeNullScope(ctx, w, h) {
      const mb = MaxwellSolver.solve();

      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText(`AC NULL DETECTOR TRACE v_det(t) [|V_det| = ${mb.vDetMagMv.toFixed(2)} mV]`, 10, 18);

      const cy = h / 2 + 10;
      const amplitude = Math.min(80, (mb.vDetMagMv / 300) * 75);

      // Null target centerline
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.stroke();

      // Animated AC waveform
      const timeOffset = Date.now() * 0.005;
      ctx.strokeStyle = mb.isBalanced ? '#10b981' : '#f43f5e';
      ctx.lineWidth = mb.isBalanced ? 3 : 2;
      ctx.beginPath();

      for (let x = 0; x <= w; x += 2) {
        const phase = (x / 40) * Math.PI + timeOffset + mb.vDetArg;
        const y = cy + amplitude * Math.sin(phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = mb.isBalanced ? '#10b981' : '#94a3b8';
      ctx.font = 'bold 11px JetBrains Mono';
      if (mb.isBalanced) {
        ctx.fillText('PERFECT NULL ACHIEVED! Waveform flattened to 0.00 mV.', 10, h - 10);
      } else {
        ctx.fillText(`Adjust R2 and C4 dials to flatten waveform (|V_det| < 0.05 mV).`, 10, h - 10);
      }

      ctx.restore();
    }

    // --- TAB 5: STEP-BY-STEP PROOFS TAB ---
    renderProofsTab(ctx, w, h) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px Inter';
      ctx.fillText('LIVE STEP-BY-STEP MATHEMATICAL VERIFICATION', 10, 24);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText('Formulas rendered dynamically in high-fidelity KaTeX below.', 10, 48);
      ctx.restore();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. TELEMETRY HUD & DYNAMIC KATEX PROOFS UPDATER
  // ═══════════════════════════════════════════════════════════════════

  function updateTelemetryAndProofs() {
    const mod = STATE.activeModule;

    // Badges & Telemetry
    if (mod === 'pmmc') {
      const p = STATE.pmmc;
      const ext = PMMCSolver.computeRangeExtension();
      const deg = (p.theta * 180) / Math.PI;

      // Torques (uN*m)
      const Td_uNm = ext.Im_actual * (p.N * p.B * p.A) * 1e6;
      const Tc_uNm = p.K * p.theta * 1e6;
      const Tdamp_uNm = (2 * p.zeta * Math.sqrt(p.J * p.K)) * p.omega * 1e6;

      document.getElementById('badge-module').textContent = 'PMMC Movement';
      document.getElementById('badge-stat1').textContent = `Deflection: ${deg.toFixed(2)}°`;
      document.getElementById('badge-stat2').textContent = `Td: ${Td_uNm.toFixed(2)} μN·m`;
      document.getElementById('badge-stat3').textContent = `Damping: ${p.dampingRegime.toUpperCase()} (ζ=${p.zeta.toFixed(2)})`;

      document.getElementById('tel-lbl-1').textContent = 'Deflecting Torque Td';
      document.getElementById('tel-val-1').textContent = `${Td_uNm.toFixed(3)} μN·m`;
      document.getElementById('tel-sub-1').textContent = `G · Im = ${(p.N * p.B * p.A).toFixed(4)} × ${(ext.Im_actual * 1000).toFixed(3)}mA`;

      document.getElementById('tel-lbl-2').textContent = 'Controlling Torque Tc';
      document.getElementById('tel-val-2').textContent = `${Tc_uNm.toFixed(3)} μN·m`;
      document.getElementById('tel-sub-2').textContent = `K · θ = ${(p.K * 1e6).toFixed(2)} × ${p.theta.toFixed(3)} rad`;

      document.getElementById('tel-lbl-3').textContent = 'Angular Deflection θ';
      document.getElementById('tel-val-3').textContent = `${deg.toFixed(2)}° / 90.00°`;
      document.getElementById('tel-sub-3').textContent = `${((deg / 90) * 100).toFixed(1)}% Full Scale`;

      document.getElementById('tel-lbl-4').textContent = 'Damping Torque Tdamp';
      document.getElementById('tel-val-4').textContent = `${Tdamp_uNm.toFixed(3)} μN·m`;
      document.getElementById('tel-sub-4').textContent = `D · dθ/dt (Aluminum Former)`;

      // Render KaTeX proof
      const katexEl = document.getElementById('proof-katex');
      if (window.katex && katexEl) {
        let latex = '';
        if (p.functionMode === 'ammeter') {
          latex = `\\mathbf{R_{\\text{sh}}} = \\frac{I_m R_m}{I - I_m} = \\frac{(${p.Im * 1000}\\text{ mA})(50\\,\\Omega)}{${p.targetRange}\\text{ A} - ${p.Im}\\text{ A}} = \\mathbf{${ext.Rsh.toFixed(4)}\\,\\Omega}`;
        } else if (p.functionMode === 'voltmeter') {
          latex = `\\mathbf{R_{\\text{se}}} = \\frac{V}{I_m} - R_m = \\frac{${p.targetRange}\\text{ V}}{${p.Im}\\text{ A}} - 50\\,\\Omega = \\mathbf{${ext.Rse.toFixed(1)}\\,\\Omega} \\quad (S = ${ext.sensitivity.toFixed(0)}\\,\\Omega/\\text{V})`;
        } else {
          latex = `\\theta_{\\text{ss}} = \\left(\\frac{N B A}{K}\\right) I = \\left(\\frac{${(p.N * p.B * p.A).toFixed(4)}}{${p.K.toExponential(2)}}\\right) I \\implies \\mathbf{\\theta = ${deg.toFixed(2)}^\\circ}`;
        }
        window.katex.render(latex, katexEl, { displayMode: true, throwOnError: false });
      }

    } else if (mod === 'wattmeter') {
      const wm = WattmeterSolver.solve();

      document.getElementById('badge-module').textContent = 'Two-Wattmeter 3Φ';
      document.getElementById('badge-stat1').textContent = `W1: ${wm.W1_true.toFixed(1)} W`;
      document.getElementById('badge-stat2').textContent = `W2: ${wm.W2_display.toFixed(1)} W`;
      document.getElementById('badge-stat3').textContent = `PF: ${wm.cosPhi.toFixed(4)} ${wm.phiDeg >= 0 ? 'Lag' : 'Lead'}`;

      document.getElementById('tel-lbl-1').textContent = 'Wattmeter W1 Reading';
      document.getElementById('tel-val-1').textContent = `${wm.W1_display.toFixed(1)} W`;
      document.getElementById('tel-sub-1').textContent = `VL·IL·cos(30° - φ) = ${wm.VL}×${wm.IL}×cos(${(30 - wm.phiDeg).toFixed(1)}°)`;

      document.getElementById('tel-lbl-2').textContent = 'Wattmeter W2 Reading';
      document.getElementById('tel-val-2').textContent = `${wm.W2_registered.toFixed(1)} W`;
      document.getElementById('tel-sub-2').textContent = wm.needsReversal ? 'Negative Deflection (Reversed Polarity)' : `VL·IL·cos(30° + φ)`;

      document.getElementById('tel-lbl-3').textContent = 'Total 3Φ Active Power P';
      document.getElementById('tel-val-3').textContent = `${wm.P_total.toFixed(1)} W`;
      document.getElementById('tel-sub-3').textContent = `P = W1 + W2 = √3·VL·IL·cosφ`;

      document.getElementById('tel-lbl-4').textContent = 'Total 3Φ Reactive Power Q';
      document.getElementById('tel-val-4').textContent = `${wm.Q_total.toFixed(1)} VAR`;
      document.getElementById('tel-sub-4').textContent = `Q = √3·(W1 - W2)`;

      const katexEl = document.getElementById('proof-katex');
      if (window.katex && katexEl) {
        const latex = `\\tan\\phi = \\sqrt{3}\\left(\\frac{W_1 - W_2}{W_1 + W_2}\\right) = \\sqrt{3}\\left(\\frac{${wm.W1_true.toFixed(1)} - (${wm.W2_true.toFixed(1)})}{${(wm.W1_true + wm.W2_true).toFixed(1)}}\\right) \\implies \\mathbf{\\cos\\phi = ${wm.cosPhi.toFixed(4)}}`;
        window.katex.render(latex, katexEl, { displayMode: true, throwOnError: false });
      }

    } else if (mod === 'maxwell') {
      const mb = MaxwellSolver.solve();

      document.getElementById('badge-module').textContent = 'Maxwell AC Bridge';
      document.getElementById('badge-stat1').textContent = `|V_det|: ${mb.vDetMagMv.toFixed(2)} mV`;
      document.getElementById('badge-stat2').textContent = `Lx: ${(mb.Lx_calc * 1000).toFixed(1)} mH`;
      document.getElementById('badge-stat3').textContent = mb.isBalanced ? 'Status: NULL BALANCED' : 'Status: UNBALANCED';

      document.getElementById('tel-lbl-1').textContent = 'Detector Potential |V_BD|';
      document.getElementById('tel-val-1').textContent = `${mb.vDetMagMv.toFixed(3)} mV`;
      document.getElementById('tel-sub-1').textContent = mb.isBalanced ? 'Null Condition Achieved' : 'Adjust R2 & C4 Dials';

      document.getElementById('tel-lbl-2').textContent = 'Derived Inductance Lx';
      document.getElementById('tel-val-2').textContent = `${(mb.Lx_calc * 1000).toFixed(2)} mH`;
      document.getElementById('tel-sub-2').textContent = `Lx = R2 · R3 · C4`;

      document.getElementById('tel-lbl-3').textContent = 'Derived Resistance Rx';
      document.getElementById('tel-val-3').textContent = `${mb.Rx_calc.toFixed(2)} Ω`;
      document.getElementById('tel-sub-3').textContent = `Rx = (R2 · R3) / R4`;

      document.getElementById('tel-lbl-4').textContent = 'Coil Quality Factor Q';
      document.getElementById('tel-val-4').textContent = `${mb.Q_calc.toFixed(3)}`;
      document.getElementById('tel-sub-4').textContent = `Q = 2π·f·C4·R4 (Medium-Q: 1 < Q < 10)`;

      const katexEl = document.getElementById('proof-katex');
      if (window.katex && katexEl) {
        const latex = `\\mathbf{L_x} = R_2 R_3 C_4 = (${mb.R2})(${mb.R3})(${mb.C4.toExponential(3)}) = \\mathbf{${(mb.Lx_calc * 1000).toFixed(2)}\\text{ mH}}, \\quad \\mathbf{R_x} = \\frac{R_2 R_3}{R_4} = \\mathbf{${mb.Rx_calc.toFixed(2)}\\,\\Omega}`;
        window.katex.render(latex, katexEl, { displayMode: true, throwOnError: false });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. OBSERVATION TABLE & BENCHMARK PRESETS
  // ═══════════════════════════════════════════════════════════════════

  const ObservationLedger = {
    records: [],

    init() {
      document.getElementById('btn-record-obs').addEventListener('click', () => {
        this.recordCurrent();
        audio.playClick();
      });
      document.getElementById('btn-load-case-a').addEventListener('click', () => {
        this.loadBenchmarkCaseA();
        audio.playSuccessChime();
      });
      document.getElementById('btn-load-case-b').addEventListener('click', () => {
        this.loadBenchmarkCaseB();
        audio.playSuccessChime();
      });
      document.getElementById('btn-load-case-c').addEventListener('click', () => {
        this.loadBenchmarkCaseC();
        audio.playSuccessChime();
      });
      document.getElementById('btn-export-csv').addEventListener('click', () => {
        this.exportCSV();
        audio.playClick();
      });
      document.getElementById('btn-clear-obs').addEventListener('click', () => {
        this.records = [];
        this.renderTable();
        audio.playClick();
      });
    },

    recordCurrent() {
      const mod = STATE.activeModule;
      let record = {};

      if (mod === 'pmmc') {
        const p = STATE.pmmc;
        const ext = PMMCSolver.computeRangeExtension();
        record = {
          module: 'PMMC Movement',
          input: `${p.appliedSignal.toFixed(2)} ${p.functionMode === 'voltmeter' ? 'V' : 'A'}`,
          params: `Im=2mA, Rm=50Ω, Target=${p.targetRange}`,
          readings: `θ = ${((p.theta * 180) / Math.PI).toFixed(2)}°`,
          derived: p.functionMode === 'ammeter' ? `Rsh = ${ext.Rsh.toFixed(4)} Ω` : (p.functionMode === 'voltmeter' ? `Rse = ${ext.Rse.toFixed(1)} Ω` : 'Direct'),
          status: 'Valid Calibration'
        };
      } else if (mod === 'wattmeter') {
        const wm = WattmeterSolver.solve();
        record = {
          module: 'Two-Wattmeter 3Φ',
          input: `VL=${wm.VL}V, IL=${wm.IL}A, φ=${wm.phiDeg}°`,
          params: `${wm.connection.toUpperCase()} Load, W2 ${wm.w2Reversed ? 'Reversed' : 'Normal'}`,
          readings: `W1=${wm.W1_display.toFixed(1)}W, W2=${wm.W2_display.toFixed(1)}W`,
          derived: `P=${wm.P_total.toFixed(1)}W, PF=${wm.cosPhi.toFixed(4)}`,
          status: wm.needsReversal && !wm.w2Reversed ? 'Reverse Required' : 'Valid Measurement'
        };
      } else if (mod === 'maxwell') {
        const mb = MaxwellSolver.solve();
        record = {
          module: 'Maxwell AC Bridge',
          input: `Vs=5V, f=${mb.freq}Hz (${mb.coilName})`,
          params: `R2=${mb.R2}Ω, R4=${mb.R4}Ω, C4=${(mb.C4 * 1e6).toFixed(3)}μF`,
          readings: `|V_BD| = ${mb.vDetMagMv.toFixed(2)} mV`,
          derived: `Lx=${(mb.Lx_calc * 1000).toFixed(1)}mH, Rx=${mb.Rx_calc.toFixed(1)}Ω, Q=${mb.Q_calc.toFixed(2)}`,
          status: mb.isBalanced ? 'Exact Null Balance' : 'Unbalanced'
        };
      }

      this.records.push(record);
      this.renderTable();
      this.logConsole(`[OBSERVATION] Recorded ${record.module} data.`);
    },

    loadBenchmarkCaseA() {
      // Benchmark Case A: PMMC Meter Range Extension
      this.records = [
        { module: 'PMMC Shunt', input: '0 - 100 mA', params: 'Im=2.0mA, Rm=50Ω, m=50', readings: 'θ = 90.0° (FS)', derived: 'Rsh = 1.0204 Ω (Parallel)', status: 'Verified (Benchmark Case A)' },
        { module: 'PMMC Shunt', input: '0 - 5.0 A', params: 'Im=2.0mA, Rm=50Ω, m=2500', readings: 'θ = 90.0° (FS)', derived: 'Rsh = 0.02001 Ω (Parallel)', status: 'Verified (Benchmark Case A)' },
        { module: 'PMMC Multiplier', input: '0 - 10.0 V', params: 'Im=2.0mA, Rm=50Ω, m=100', readings: 'θ = 90.0° (FS)', derived: 'Rse = 4,950.0 Ω (Series, S=500Ω/V)', status: 'Verified (Benchmark Case A)' },
        { module: 'PMMC Multiplier', input: '0 - 250.0 V', params: 'Im=2.0mA, Rm=50Ω, m=2500', readings: 'θ = 90.0° (FS)', derived: 'Rse = 124,950.0 Ω (Series, S=500Ω/V)', status: 'Verified (Benchmark Case A)' }
      ];
      this.renderTable();
      this.logConsole('[BENCHMARK] Loaded Benchmark Case A (PMMC Range Extension Matrix).');
    },

    loadBenchmarkCaseB() {
      // Benchmark Case B: Two-Wattmeter 3-Phase Sweep
      this.records = [
        { module: 'Two-Wattmeter', input: 'VL=400V, IL=10A, φ=0.0°', params: 'PF = 1.000 (Unity)', readings: 'W1 = +3464.1 W, W2 = +3464.1 W', derived: 'P = 6928.2 W, Q = 0.0 VAR', status: 'Normal (+) [Verified Case B]' },
        { module: 'Two-Wattmeter', input: 'VL=400V, IL=10A, φ=30.0°', params: 'PF = 0.866 (Lag)', readings: 'W1 = +4000.0 W, W2 = +2000.0 W', derived: 'P = 6000.0 W, Q = +3464.1 VAR', status: 'Normal (+) [Verified Case B]' },
        { module: 'Two-Wattmeter', input: 'VL=400V, IL=10A, φ=60.0°', params: 'PF = 0.500 (Lag)', readings: 'W1 = +3464.1 W, W2 = 0.0 W', derived: 'P = 3464.1 W, Q = +6000.0 VAR', status: 'Zero Point [Verified Case B]' },
        { module: 'Two-Wattmeter', input: 'VL=400V, IL=10A, φ=75.0°', params: 'PF = 0.259 (Lag)', readings: 'W1 = +2828.4 W, W2 = -1035.3 W', derived: 'P = 1793.1 W, Q = +6692.1 VAR', status: 'Reversed (-) [Verified Case B]' }
      ];
      this.renderTable();
      this.logConsole('[BENCHMARK] Loaded Benchmark Case B (Two-Wattmeter Sweep Matrix).');
    },

    loadBenchmarkCaseC() {
      // Benchmark Case C: Maxwell AC Bridge Null Balance
      this.records = [
        { module: 'Maxwell Bridge', input: 'Vs=5V, f=1000Hz (Coil #2)', params: 'R3=1000Ω, R2=600Ω, R4=1500Ω, C4=0.250μF', readings: '|V_BD| = 0.00 mV (Exact Null)', derived: 'Lx = 150.0 mH, Rx = 400.0 Ω, Q = 2.356', status: 'Verified (Benchmark Case C)' }
      ];
      this.renderTable();
      this.logConsole('[BENCHMARK] Loaded Benchmark Case C (Maxwell Bridge Null Verification).');
    },

    renderTable() {
      const tbody = document.getElementById('obs-tbody');
      tbody.innerHTML = '';
      this.records.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td><span class="status-pill highlight">${r.module}</span></td>
          <td>${r.input}</td>
          <td>${r.params}</td>
          <td style="color:#f8fafc; font-weight:700;">${r.readings}</td>
          <td style="color:#38bdf8;">${r.derived}</td>
          <td><span class="status-pill active">${r.status}</span></td>
        `;
        tbody.appendChild(tr);
      });
      document.getElementById('badge-obs-count').textContent = `${this.records.length} Records`;
    },

    exportCSV() {
      if (this.records.length === 0) {
        alert('Observation table is empty. Record some measurements first!');
        return;
      }
      let csv = 'Index,Module,Input Signals,Parameters,Meter Readings,Derived Values,Status\n';
      this.records.forEach((r, i) => {
        csv += `"${i + 1}","${r.module}","${r.input}","${r.params}","${r.readings}","${r.derived}","${r.status}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `electrical_measurements_lab_data_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    logConsole(msg) {
      const el = document.getElementById('console-log');
      if (el) {
        const row = document.createElement('div');
        row.textContent = `> ${msg}`;
        el.appendChild(row);
        el.scrollTop = el.scrollHeight;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 8. GUIDED LABORATORY CHALLENGE ENGINE (9 LABS)
  // ═══════════════════════════════════════════════════════════════════

  const CHALLENGES = [
    // Track 1: PMMC
    {
      id: 1,
      track: 'Track 1 · Lab 1',
      title: 'PMMC Torque Balance & Critical Damping',
      prompt: 'Select the Critical Damping regime (ζ = 1.0) and apply a 2.5 A step signal to achieve dead-beat settling without overshoot.',
      validate: () => STATE.activeModule === 'pmmc' && STATE.pmmc.dampingRegime === 'critical',
      hint: 'Choose "Aluminum / Critical (ζ=1.0)" under the Damping Regime pills, then click "Apply Step Current".'
    },
    {
      id: 2,
      track: 'Track 1 · Lab 2',
      title: 'DC Ammeter Shunt Synthesis (0 - 5 A)',
      prompt: 'Given basic meter Im = 2.0 mA and Rm = 50 Ω, calculate and configure the meter for a 0 - 5.0 A Ammeter range (Rsh ≈ 0.02001 Ω).',
      validate: () => STATE.activeModule === 'pmmc' && STATE.pmmc.functionMode === 'ammeter' && Math.abs(STATE.pmmc.targetRange - 5.0) < 0.1,
      hint: 'Set Instrument Function to "DC Ammeter" and select target range "5.0 A (m = 2500)".'
    },
    {
      id: 3,
      track: 'Track 1 · Lab 3',
      title: 'Multi-Range DC Voltmeter Multiplier (0 - 250 V)',
      prompt: 'Configure a series multiplier Rse for a 0 - 250 V Voltmeter and verify sensitivity S = 500 Ω/V (Rse = 124,950 Ω).',
      validate: () => STATE.activeModule === 'pmmc' && STATE.pmmc.functionMode === 'voltmeter' && Math.abs(STATE.pmmc.targetRange - 250.0) < 1.0,
      hint: 'Switch to "DC Voltmeter" and select the "250.0 V (m = 2500)" full-scale range.'
    },

    // Track 2: Two-Wattmeter
    {
      id: 4,
      track: 'Track 2 · Lab 4',
      title: 'Balanced High Power Factor Test (cos φ = 0.866)',
      prompt: 'Set the load phase angle φ to +30.0° (0.866 lagging) and verify that Wattmeter W1 reads exactly twice Wattmeter W2 (W1 = 2·W2).',
      validate: () => STATE.activeModule === 'wattmeter' && Math.abs(STATE.wattmeter.phiDeg - 30.0) < 1.0,
      hint: 'Switch to the Two-Wattmeter module and click the "0.866 Lag (30°)" preset button.'
    },
    {
      id: 5,
      track: 'Track 2 · Lab 5',
      title: 'Low Power Factor No-Load & Reversal Switch (cos φ = 0.259)',
      prompt: 'Increase load phase angle to +75.0° (PF < 0.50). Observe W2 kicking backward below zero, and engage the Potential Coil Reversal Switch.',
      validate: () => STATE.activeModule === 'wattmeter' && STATE.wattmeter.phiDeg >= 70.0 && STATE.wattmeter.w2Reversed === true,
      hint: 'Select the 75° preset and ensure the W2 polarity reversal switch is toggled.'
    },
    {
      id: 6,
      track: 'Track 2 · Lab 6',
      title: 'Zero Deflection Half-Power Point (φ = 60.0°)',
      prompt: 'Adjust phase angle φ to exactly 60.0° (cos 60° = 0.500) where Wattmeter W2 reads exactly 0.0 W and W1 carries the entire total power.',
      validate: () => STATE.activeModule === 'wattmeter' && Math.abs(STATE.wattmeter.phiDeg - 60.0) < 1.0,
      hint: 'Click the "0.500 Lag (60°)" preset button and observe W2 deflection drop to zero.'
    },

    // Track 3: Maxwell AC Bridge
    {
      id: 7,
      track: 'Track 3 · Lab 7',
      title: 'Mystery Coil #2 Null Balance (Benchmark Case C)',
      prompt: 'Balance the Maxwell Bridge for Mystery Coil #2 by dialing R2 = 600 Ω, R4 = 1500 Ω, and C4 = 0.250 μF to achieve exact null (|V_det| < 0.05 mV).',
      validate: () => {
        if (STATE.activeModule !== 'maxwell') return false;
        const mb = MaxwellSolver.solve();
        return mb.isBalanced && STATE.maxwell.selectedCoilId === 2;
      },
      hint: 'Select Mystery Coil #2, then adjust R2 to 600Ω, R4 to 1500Ω, and C4 to 0.250μF (or click Auto-Balance).'
    },
    {
      id: 8,
      track: 'Track 3 · Lab 8',
      title: 'Frequency Independence Verification',
      prompt: 'With Mystery Coil #2 balanced, sweep oscillator frequency from 1000 Hz to 3000 Hz and verify that the bridge remains in perfect null balance.',
      validate: () => {
        if (STATE.activeModule !== 'maxwell') return false;
        const mb = MaxwellSolver.solve();
        return mb.isBalanced && STATE.maxwell.freq >= 2500;
      },
      hint: 'First balance Coil #2, then use the Oscillator Frequency slider to increase frequency above 2500 Hz.'
    },
    {
      id: 9,
      track: 'Track 3 · Lab 9',
      title: 'Coil Quality Factor (Q) Characterization',
      prompt: 'Select High-Q Mystery Coil #4 and balance the bridge to compute its Quality Factor Q = 2π·f·C4·R4.',
      validate: () => {
        if (STATE.activeModule !== 'maxwell') return false;
        const mb = MaxwellSolver.solve();
        return mb.isBalanced && STATE.maxwell.selectedCoilId === 4;
      },
      hint: 'Select "Coil #4 (High-Q)", click Auto-Balance, and observe the high Q-factor in telemetry.'
    }
  ];

  const ChallengeEngine = {
    currentIdx: 0,

    init() {
      this.render();
      document.getElementById('btn-chal-verify').addEventListener('click', () => {
        this.verifyCurrent();
      });
      document.getElementById('btn-chal-hint').addEventListener('click', () => {
        this.showHint();
      });
      document.getElementById('btn-chal-next').addEventListener('click', () => {
        this.nextChallenge();
      });
    },

    render() {
      const c = CHALLENGES[this.currentIdx];
      document.getElementById('chal-track-badge').textContent = c.track;
      document.getElementById('chal-title').textContent = c.title;
      document.getElementById('chal-prompt').textContent = c.prompt;

      const fb = document.getElementById('chal-feedback');
      fb.className = 'challenge-feedback';
      fb.textContent = '';

      document.getElementById('chal-score').textContent = `${STATE.challenge.score} / ${STATE.challenge.totalPossible}`;
    },

    verifyCurrent() {
      const c = CHALLENGES[this.currentIdx];
      const ok = c.validate();
      const fb = document.getElementById('chal-feedback');

      if (ok) {
        fb.className = 'challenge-feedback show success';
        fb.textContent = '✔ Calibration Verified! Objective completed successfully.';
        STATE.challenge.score += 100;
        document.getElementById('chal-score').textContent = `${STATE.challenge.score} / ${STATE.challenge.totalPossible}`;
        audio.playSuccessChime();
        ObservationLedger.recordCurrent();
      } else {
        fb.className = 'challenge-feedback show error';
        fb.textContent = '✖ Parameters not satisfied yet. Review hint and adjust controls.';
        audio.playClick();
      }
    },

    showHint() {
      const c = CHALLENGES[this.currentIdx];
      const fb = document.getElementById('chal-feedback');
      fb.className = 'challenge-feedback show';
      fb.style.background = 'rgba(234, 179, 8, 0.15)';
      fb.style.borderColor = 'rgba(234, 179, 8, 0.35)';
      fb.style.color = '#fbbf24';
      fb.textContent = `💡 Hint: ${c.hint}`;
      audio.playClick();
    },

    nextChallenge() {
      this.currentIdx = (this.currentIdx + 1) % CHALLENGES.length;
      this.render();
      audio.playClick();
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 9. CERTIFICATION QUIZ & PRACTICE MODULE
  // ═══════════════════════════════════════════════════════════════════

  const QUIZ_QUESTIONS = [
    {
      q: 'Why does a Permanent Magnet Moving Coil (PMMC) instrument have a uniform, linear scale?',
      opts: [
        'A. Deflecting torque is proportional to the square of current (Td ∝ I²)',
        'B. Radial permanent magnetic field ensures deflecting torque is directly proportional to current (Td = G·I) and spring torque is linear (Tc = K·θ)',
        'C. Phosphor-bronze hairsprings have non-linear logarithmic elasticity',
        'D. Aluminum former provides fluid-friction damping'
      ],
      correct: 1,
      exp: 'In a PMMC instrument with radial magnetic flux, Td = NBAI = G·I. At balance Td = Tc = K·θ => θ = (G/K)·I, producing a strictly linear scale.'
    },
    {
      q: 'To convert a basic PMMC movement (Im = 2 mA, Rm = 50 Ω) into an Ammeter of range 0 - 5 A, the required shunt resistor is:',
      opts: [
        'A. Rsh = 2500 Ω in series',
        'B. Rsh = 0.02001 Ω in parallel with the coil',
        'C. Rsh = 1.0204 Ω in parallel with the coil',
        'D. Rsh = 124,950 Ω in series'
      ],
      correct: 1,
      exp: 'Multiplying power m = 5 A / 0.002 A = 2500. Shunt resistance Rsh = Rm / (m - 1) = 50 / 2499 ≈ 0.02001 Ω connected in parallel.'
    },
    {
      q: 'What is the Voltmeter sensitivity of an instrument having full-scale deflection current Im = 2 mA?',
      opts: [
        'A. 200 Ω/V',
        'B. 500 Ω/V',
        'C. 1000 Ω/V',
        'D. 2000 Ω/V'
      ],
      correct: 1,
      exp: 'Voltmeter sensitivity S = 1 / Im = 1 / 0.002 A = 500 Ω/V. A higher sensitivity causes less loading error on the measured circuit.'
    },
    {
      q: 'In the Two-Wattmeter method for balanced 3-phase power, what does Wattmeter W2 read when load power factor is cos φ = 0.500 lagging (φ = 60°)?',
      opts: [
        'A. W2 = W1 (Equal positive readings)',
        'B. W2 = 0.0 W (Zero deflection)',
        'C. W2 = -W1 (Equal and opposite)',
        'D. W2 = 2 · W1'
      ],
      correct: 1,
      exp: 'W2 = VL·IL·cos(30° + φ) = VL·IL·cos(30° + 60°) = VL·IL·cos(90°) = 0. W2 reads exactly zero at PF = 0.5.'
    },
    {
      q: 'When load phase angle exceeds 60° (PF < 0.50 lagging), what happens to Wattmeter W2 and how is the reading taken?',
      opts: [
        'A. W2 burns out due to overcurrent',
        'B. W2 deflects backward against the zero peg; the potential coil reversal switch is flipped to read |W2|, and registered as -|W2|',
        'C. W2 automatically doubles its deflection',
        'D. Current coil connections must be short-circuited'
      ],
      correct: 1,
      exp: 'For φ > 60°, cos(30° + φ) < 0 => W2 < 0. The pointer kicks backward below zero. Flipping the potential-coil reversal switch allows reading |W2|, and total power is computed as P = W1 - |W2|.'
    },
    {
      q: 'What is the expression for total 3-phase active power in terms of two wattmeter readings (W1 and W2)?',
      opts: [
        'A. P = W1 - W2',
        'B. P = √3 · (W1 + W2)',
        'C. P = W1 + W2',
        'D. P = √3 · (W1 - W2)'
      ],
      correct: 2,
      exp: 'Sum of readings W1 + W2 = VL·IL·[cos(30° - φ) + cos(30° + φ)] = √3·VL·IL·cosφ = Total Active Power P.'
    },
    {
      q: 'In Maxwell’s Inductance-Capacitance AC bridge, the unknown inductance Lx is given by:',
      opts: [
        'A. Lx = (R2 · R3) / C4',
        'B. Lx = R2 · R3 · C4',
        'C. Lx = 1 / (ω² · C4)',
        'D. Lx = R4 / (R2 · R3 · C4)'
      ],
      correct: 1,
      exp: 'Equating imaginary components of bridge balance (Z1·Z4 = Z2·Z3) yields Lx = R2 · R3 · C4.'
    },
    {
      q: 'Why are the balance equations of Maxwell’s Inductance-Capacitance Bridge independent of source frequency (ω)?',
      opts: [
        'A. Because the excitation voltage is pure DC',
        'B. Because source frequency terms ω cancel out identically in both real (Rx) and imaginary (Lx) balance equations',
        'C. Because the bridge operates only at 50 Hz',
        'D. Because the detector is a thermal thermocouple'
      ],
      correct: 1,
      exp: 'The balance equations Rx = (R2·R3)/R4 and Lx = R2·R3·C4 contain no frequency term ω, meaning balance holds for any frequency within the audio range.'
    },
    {
      q: 'For which type of inductive coils is Maxwell’s Inductance-Capacitance Bridge best suited?',
      opts: [
        'A. Very low-Q coils (Q < 1)',
        'B. Medium-Q coils (1 < Q < 10)',
        'C. High-Q coils (Q > 50)',
        'D. Radio frequency superconducting resonators'
      ],
      correct: 1,
      exp: 'Maxwell’s bridge is best suited for medium-Q coils (1 < Q < 10). For high-Q coils, R4 becomes excessively large (> 100 kΩ), making Hay’s bridge preferred.'
    },
    {
      q: 'What damping system is standardly used in PMMC meters and why?',
      opts: [
        'A. Fluid friction damping using silicone oil',
        'B. Air friction damping using an aluminum vane in a chamber',
        'C. Eddy-current damping induced in the light aluminum former rotating in the permanent magnetic field',
        'D. Hysteresis damping in steel springs'
      ],
      correct: 2,
      exp: 'PMMC meters use eddy-current damping. As the aluminum former cuts the permanent magnet radial field, circulating eddy currents produce a retarding torque opposing motion (Lenz’s law).'
    }
  ];

  const QuizEngine = {
    init() {
      this.render();
      document.getElementById('btn-quiz-reset').addEventListener('click', () => {
        this.render();
        audio.playClick();
      });
      document.getElementById('btn-close-cert').addEventListener('click', () => {
        document.getElementById('cert-modal').classList.remove('show');
        audio.playClick();
      });
    },

    render() {
      const container = document.getElementById('quiz-container');
      container.innerHTML = '';
      STATE.quiz.score = 0;
      STATE.quiz.answered = 0;

      QUIZ_QUESTIONS.forEach((qObj, qIdx) => {
        const card = document.createElement('div');
        card.className = 'quiz-card';

        const qTitle = document.createElement('div');
        qTitle.className = 'quiz-question';
        qTitle.textContent = `${qIdx + 1}. ${qObj.q}`;
        card.appendChild(qTitle);

        const optsDiv = document.createElement('div');
        optsDiv.className = 'quiz-options';

        const expDiv = document.createElement('div');
        expDiv.className = 'quiz-explanation';
        expDiv.textContent = `💡 Explanation: ${qObj.exp}`;

        qObj.opts.forEach((optText, optIdx) => {
          const btn = document.createElement('button');
          btn.className = 'quiz-opt-btn';
          btn.textContent = optText;
          btn.addEventListener('click', () => {
            if (card.classList.contains('answered')) return;
            card.classList.add('answered');
            STATE.quiz.answered++;

            if (optIdx === qObj.correct) {
              btn.classList.add('correct');
              STATE.quiz.score++;
              audio.playClick();
            } else {
              btn.classList.add('incorrect');
              // Highlight correct option
              optsDiv.children[qObj.correct].classList.add('correct');
              audio.playClick();
            }
            expDiv.classList.add('show');
            this.updateStats();
          });
          optsDiv.appendChild(btn);
        });

        card.appendChild(optsDiv);
        card.appendChild(expDiv);
        container.appendChild(card);
      });

      this.updateStats();
    },

    updateStats() {
      document.getElementById('quiz-score').textContent = `${STATE.quiz.score} / ${QUIZ_QUESTIONS.length}`;
      document.getElementById('quiz-progress').textContent = `${STATE.quiz.answered} / ${QUIZ_QUESTIONS.length}`;

      if (STATE.quiz.answered === QUIZ_QUESTIONS.length) {
        if (STATE.quiz.score >= 8) {
          audio.playSuccessChime();
          const cert = document.getElementById('cert-modal');
          document.getElementById('cert-score-text').textContent = `Score: ${STATE.quiz.score} / 10 (${STATE.quiz.score * 10}% Distinction)`;
          cert.classList.add('show');
        }
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 10. 3D HARDWARE MODEL VIEWER (THREE.JS + PROCEDURAL BACKUP)
  // ═══════════════════════════════════════════════════════════════════

  class ThreeDHardwareViewer {
    constructor() {
      this.initialized = false;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;

      const canvas = document.getElementById('sim3d-canvas');
      const aside = document.getElementById('sim3d-components');
      if (!canvas || !window.THREE) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 600;
      const height = rect.height || 500;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x001219);

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(4.0, 3.5, 4.5);

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;

      // Lighting
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x00212b, 1.2);
      this.scene.add(hemiLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(8, 12, 10);
      this.scene.add(dirLight);

      // Attempt GLTF loader
      let loaded = false;
      if (window.THREE.GLTFLoader) {
        const loader = new THREE.GLTFLoader();
        loader.load('../../models/electrical_measurements.glb', (gltf) => {
          loaded = true;
          this.scene.add(gltf.scene);
          this.populateInspector(gltf.scene, aside);
        }, undefined, () => {
          // Fallback to procedural model
          if (!loaded) this.buildProceduralModel(aside);
        });
      } else {
        this.buildProceduralModel(aside);
      }

      const animate = () => {
        requestAnimationFrame(animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      animate();
    }

    buildProceduralModel(aside) {
      const group = new THREE.Group();

      // Base Chassis
      const baseGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.3, 32);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x00212b, metalness: 0.8, roughness: 0.2 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.name = 'Chassis Base';
      group.add(base);

      // Horseshoe Permanent Magnet Poles (Red North & Blue South)
      const poleGeo = new THREE.CylinderGeometry(1.6, 1.6, 1.2, 32, 1, false, 0, Math.PI * 0.45);
      const nMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 });
      const sMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.3 });

      const nPole = new THREE.Mesh(poleGeo, nMat);
      nPole.position.set(0, 0.8, 0);
      nPole.rotation.y = Math.PI * 0.77;
      nPole.name = 'Permanent Magnet (North Pole)';
      group.add(nPole);

      const sPole = new THREE.Mesh(poleGeo, sMat);
      sPole.position.set(0, 0.8, 0);
      sPole.rotation.y = -Math.PI * 0.23;
      sPole.name = 'Permanent Magnet (South Pole)';
      group.add(sPole);

      // Central Soft-Iron Cylindrical Core
      const coreGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.4, 32);
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.1 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 0.8, 0);
      core.name = 'Soft-Iron Cylindrical Core';
      group.add(core);

      // Rotating Rectangular Copper Coil
      const coilGeo = new THREE.BoxGeometry(1.8, 1.0, 0.15);
      const coilMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const coil = new THREE.Mesh(coilGeo, coilMat);
      coil.position.set(0, 0.8, 0);
      coil.rotation.y = Math.PI * 0.25;
      coil.name = 'Moving Coil & Aluminum Former';
      group.add(coil);

      // Knife-Edge Red Pointer Needle
      const needleGeo = new THREE.ConeGeometry(0.04, 2.2, 8);
      const needleMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.2, roughness: 0.2 });
      const needle = new THREE.Mesh(needleGeo, needleMat);
      needle.position.set(0, 1.7, 0.8);
      needle.rotation.x = -Math.PI * 0.35;
      needle.name = 'Red Indicator Pointer Needle';
      group.add(needle);

      this.scene.add(group);
      this.populateInspector(group, aside);
    }

    populateInspector(root, aside) {
      aside.innerHTML = '';
      const components = [];
      root.traverse((child) => {
        if (child.isMesh && child.name) {
          components.push(child);
        }
      });

      components.forEach((mesh) => {
        const btn = document.createElement('button');
        btn.className = 'sim3d-comp';
        btn.textContent = mesh.name;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sim3d-comp').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // Highlight mesh briefly
          const origColor = mesh.material.color.getHex();
          mesh.material.color.setHex(0x38bdf8);
          setTimeout(() => {
            mesh.material.color.setHex(origColor);
          }, 800);
          audio.playClick();
        });
        aside.appendChild(btn);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 11. INITIALIZATION & UI EVENT BINDINGS
  // ═══════════════════════════════════════════════════════════════════

  window.addEventListener('DOMContentLoaded', () => {
    const workbench = new CanvasWorkbench();
    const deck = new ScopeDeckRenderer();
    const threeViewer = new ThreeDHardwareViewer();

    // 1. Canonical 4-Mode Platform Tabs Bar
    document.querySelectorAll('#mode-tabs .pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mode-tabs .pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        STATE.platformMode = mode;

        document.getElementById('sim-wrapper').classList.toggle('hidden', mode !== 'simulate');
        document.getElementById('model3d-wrapper').classList.toggle('hidden', mode !== '3d-model');
        document.getElementById('explore-wrapper').classList.toggle('hidden', mode !== 'explore');
        document.getElementById('quiz-wrapper').classList.toggle('hidden', mode !== 'quiz');

        if (mode === '3d-model') {
          threeViewer.init();
        } else if (mode === 'explore') {
          setTimeout(renderAllMath, 50);
        }
        audio.playClick();
      });
    });

    // 2. Sound Toggle
    document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
      STATE.soundEnabled = !STATE.soundEnabled;
      e.currentTarget.textContent = STATE.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      audio.playClick();
    });

    // 3. Module Selector Pills (PMMC / Two-Wattmeter / Maxwell Bridge)
    document.querySelectorAll('#module-pill-selector .mod-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#module-pill-selector .mod-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mod = btn.getAttribute('data-module');
        STATE.activeModule = mod;

        // Toggle Parameter Panels
        document.getElementById('panel-pmmc-controls').classList.toggle('hidden', mod !== 'pmmc');
        document.getElementById('panel-wattmeter-controls').classList.toggle('hidden', mod !== 'wattmeter');
        document.getElementById('panel-maxwell-controls').classList.toggle('hidden', mod !== 'maxwell');

        // Toggle Quick Action Trays
        document.getElementById('pmmc-quick-actions').classList.toggle('hidden', mod !== 'pmmc');
        document.getElementById('wattmeter-quick-actions').classList.toggle('hidden', mod !== 'wattmeter');
        document.getElementById('maxwell-quick-actions').classList.toggle('hidden', mod !== 'maxwell');

        // Switch default deck tab appropriately
        if (mod === 'pmmc') STATE.activeDeckTab = 'scope';
        else if (mod === 'wattmeter') STATE.activeDeckTab = 'curves';
        else if (mod === 'maxwell') STATE.activeDeckTab = 'null';

        document.querySelectorAll('.deck-tab').forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-tab') === STATE.activeDeckTab);
        });

        // Update canvas title
        if (mod === 'pmmc') {
          document.getElementById('canvas-main-title').innerHTML = '⚡ PMMC D\'Arsonval Movement &amp; Range Extension';
        } else if (mod === 'wattmeter') {
          document.getElementById('canvas-main-title').innerHTML = '📊 Three-Phase Two-Wattmeter Power Measurement';
        } else if (mod === 'maxwell') {
          document.getElementById('canvas-main-title').innerHTML = '⚖ Maxwell\'s Inductance-Capacitance AC Bridge';
        }

        updateTelemetryAndProofs();
        audio.playClick();
      });
    });

    // 4. Deck Tab Switching
    document.querySelectorAll('.deck-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.deck-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        STATE.activeDeckTab = tab.getAttribute('data-tab');
        updateTelemetryAndProofs();
        audio.playClick();
      });
    });

    // 5. PMMC Controls & Listeners
    const pmmcFunc = document.getElementById('pmmc-function-select');
    const pmmcRange = document.getElementById('pmmc-range-select');
    const pmmcSlider = document.getElementById('slider-pmmc-applied');

    const updatePMMCUI = () => {
      const p = STATE.pmmc;
      const ext = PMMCSolver.computeRangeExtension();

      if (p.functionMode === 'voltmeter') {
        document.getElementById('pmmc-applied-label').textContent = 'Applied Voltage (V):';
        document.getElementById('disp-pmmc-applied').textContent = `${p.appliedSignal.toFixed(1)} V`;
        document.getElementById('disp-pmmc-resistor').textContent = `Rse = ${ext.Rse.toFixed(1)} Ω`;
        document.getElementById('disp-pmmc-sens').textContent = `S = ${ext.sensitivity.toFixed(0)} Ω/V (Vm = 100mV)`;
      } else if (p.functionMode === 'ammeter') {
        document.getElementById('pmmc-applied-label').textContent = 'Applied Current (A):';
        document.getElementById('disp-pmmc-applied').textContent = `${p.appliedSignal.toFixed(2)} A`;
        document.getElementById('disp-pmmc-resistor').textContent = `Rsh = ${ext.Rsh.toFixed(4)} Ω`;
        document.getElementById('disp-pmmc-sens').textContent = `Drop = ${(ext.Im_actual * ext.Rm * 1000).toFixed(1)} mV (Burden)`;
      } else {
        document.getElementById('pmmc-applied-label').textContent = 'Meter Current Im:';
        document.getElementById('disp-pmmc-applied').textContent = `${(p.appliedSignal * 1000).toFixed(2)} mA`;
        document.getElementById('disp-pmmc-resistor').textContent = 'Direct Movement (No Shunt)';
        document.getElementById('disp-pmmc-sens').textContent = `Rm = ${p.Rm} Ω`;
      }

      updateTelemetryAndProofs();
    };

    pmmcFunc.addEventListener('change', (e) => {
      const mode = e.target.value;
      STATE.pmmc.functionMode = mode;
      if (mode === 'voltmeter') {
        pmmcRange.value = '250.0v';
        STATE.pmmc.targetRange = 250.0;
        pmmcSlider.max = '250';
        pmmcSlider.step = '0.5';
        pmmcSlider.value = '125';
        STATE.pmmc.appliedSignal = 125.0;
      } else if (mode === 'ammeter') {
        pmmcRange.value = '5.0';
        STATE.pmmc.targetRange = 5.0;
        pmmcSlider.max = '5.0';
        pmmcSlider.step = '0.01';
        pmmcSlider.value = '2.5';
        STATE.pmmc.appliedSignal = 2.5;
      } else {
        pmmcRange.value = '0.002';
        STATE.pmmc.targetRange = 0.002;
        pmmcSlider.max = '0.002';
        pmmcSlider.step = '0.00005';
        pmmcSlider.value = '0.001';
        STATE.pmmc.appliedSignal = 0.001;
      }
      updatePMMCUI();
      audio.playClick();
    });

    pmmcRange.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      STATE.pmmc.targetRange = val;
      pmmcSlider.max = `${val}`;
      pmmcSlider.value = `${val / 2}`;
      STATE.pmmc.appliedSignal = val / 2;
      updatePMMCUI();
      audio.playClick();
    });

    pmmcSlider.addEventListener('input', (e) => {
      STATE.pmmc.appliedSignal = parseFloat(e.target.value);
      updatePMMCUI();
    });

    // PMMC Steppers
    document.getElementById('btn-pmmc-dec').addEventListener('click', () => {
      pmmcSlider.value = Math.max(0, parseFloat(pmmcSlider.value) - pmmcSlider.max * 0.1);
      STATE.pmmc.appliedSignal = parseFloat(pmmcSlider.value);
      updatePMMCUI();
      audio.playClick();
    });
    document.getElementById('btn-pmmc-fdec').addEventListener('click', () => {
      pmmcSlider.value = Math.max(0, parseFloat(pmmcSlider.value) - pmmcSlider.max * 0.01);
      STATE.pmmc.appliedSignal = parseFloat(pmmcSlider.value);
      updatePMMCUI();
      audio.playClick();
    });
    document.getElementById('btn-pmmc-finc').addEventListener('click', () => {
      pmmcSlider.value = Math.min(pmmcSlider.max, parseFloat(pmmcSlider.value) + pmmcSlider.max * 0.01);
      STATE.pmmc.appliedSignal = parseFloat(pmmcSlider.value);
      updatePMMCUI();
      audio.playClick();
    });
    document.getElementById('btn-pmmc-inc').addEventListener('click', () => {
      pmmcSlider.value = Math.min(pmmcSlider.max, parseFloat(pmmcSlider.value) + pmmcSlider.max * 0.1);
      STATE.pmmc.appliedSignal = parseFloat(pmmcSlider.value);
      updatePMMCUI();
      audio.playClick();
    });
    document.getElementById('btn-pmmc-fs').addEventListener('click', () => {
      pmmcSlider.value = pmmcSlider.max;
      STATE.pmmc.appliedSignal = parseFloat(pmmcSlider.max);
      updatePMMCUI();
      audio.playClick();
    });

    // Damping Regime Buttons
    document.querySelectorAll('[data-damping]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-damping]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const regime = btn.getAttribute('data-damping');
        STATE.pmmc.dampingRegime = regime;
        document.getElementById('disp-damping-badge').textContent =
          regime === 'under' ? 'ζ = 0.35 (Under-Damped)' : (regime === 'critical' ? 'ζ = 1.0 (Critical)' : 'ζ = 2.2 (Over-Damped)');
        audio.playClick();
      });
    });

    // PMMC Step Input & Zero Reset
    document.getElementById('btn-pmmc-step').addEventListener('click', () => {
      STATE.pmmc.theta = 0;
      STATE.pmmc.omega = 0;
      STATE.pmmc.time = 0;
      STATE.pmmc.thetaHistory = [];
      ObservationLedger.logConsole('[PMMC] Applied Step Current (0 → I_applied). Transient tracking begun.');
      audio.playClick();
    });
    document.getElementById('btn-pmmc-zero').addEventListener('click', () => {
      pmmcSlider.value = '0';
      STATE.pmmc.appliedSignal = 0;
      STATE.pmmc.theta = 0;
      STATE.pmmc.omega = 0;
      updatePMMCUI();
      audio.playClick();
    });

    // PMMC Presets
    document.querySelectorAll('[data-pmmc-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-pmmc-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.getAttribute('data-pmmc-preset');
        if (preset === 'ammeter5a') {
          pmmcFunc.value = 'ammeter';
          STATE.pmmc.functionMode = 'ammeter';
          pmmcRange.value = '5.0';
          STATE.pmmc.targetRange = 5.0;
          pmmcSlider.max = '5.0';
          pmmcSlider.value = '2.5';
          STATE.pmmc.appliedSignal = 2.5;
        } else if (preset === 'voltmeter250v') {
          pmmcFunc.value = 'voltmeter';
          STATE.pmmc.functionMode = 'voltmeter';
          pmmcRange.value = '250.0v';
          STATE.pmmc.targetRange = 250.0;
          pmmcSlider.max = '250';
          pmmcSlider.value = '125';
          STATE.pmmc.appliedSignal = 125.0;
        } else if (preset === 'caseA') {
          ObservationLedger.loadBenchmarkCaseA();
        } else {
          pmmcFunc.value = 'basic';
          STATE.pmmc.functionMode = 'basic';
          pmmcRange.value = '0.002';
          STATE.pmmc.targetRange = 0.002;
          pmmcSlider.max = '0.002';
          pmmcSlider.value = '0.001';
          STATE.pmmc.appliedSignal = 0.001;
        }
        updatePMMCUI();
        audio.playClick();
      });
    });

    // 6. Two-Wattmeter Controls & Listeners
    const sliderVL = document.getElementById('slider-wm-vl');
    const sliderIL = document.getElementById('slider-wm-il');
    const sliderPhi = document.getElementById('slider-wm-phi');

    const updateWattmeterUI = () => {
      const wm = WattmeterSolver.solve();
      document.getElementById('disp-wm-vl').textContent = `${wm.VL.toFixed(1)} V`;
      document.getElementById('disp-wm-il').textContent = `${wm.IL.toFixed(1)} A`;
      document.getElementById('disp-wm-phi').textContent = `${wm.phiDeg >= 0 ? '+' : ''}${wm.phiDeg.toFixed(1)}° (${wm.phiDeg >= 0 ? 'Lagging' : 'Leading'})`;
      document.getElementById('disp-wm-pf').textContent = `${wm.cosPhi.toFixed(4)} ${wm.phiDeg >= 0 ? 'Lagging' : 'Leading'}`;
      document.getElementById('disp-wm-ptotal').textContent = `${wm.P_total.toFixed(1)} W`;
      document.getElementById('disp-wm-qtotal').textContent = `${wm.Q_total >= 0 ? '+' : ''}${wm.Q_total.toFixed(1)} VAR`;
      document.getElementById('disp-wm-stotal').textContent = `${wm.S_total.toFixed(1)} VA`;

      const btnRev = document.getElementById('btn-toggle-w2-pol');
      btnRev.textContent = wm.w2Reversed ? '⇄ W2 Coil: Reversed (-)' : '⇄ W2 Coil: Normal (+)';
      document.getElementById('disp-w2-status').textContent =
        wm.needsReversal ? (wm.w2Reversed ? 'Reverse Active (Upscale Reading)' : 'Pointer Stopped at Zero Peg (W2 < 0)') : 'Normal Forward Deflection';

      updateTelemetryAndProofs();
    };

    sliderVL.addEventListener('input', (e) => {
      STATE.wattmeter.VL = parseFloat(e.target.value);
      updateWattmeterUI();
    });
    sliderIL.addEventListener('input', (e) => {
      STATE.wattmeter.IL = parseFloat(e.target.value);
      updateWattmeterUI();
    });
    sliderPhi.addEventListener('input', (e) => {
      STATE.wattmeter.phiDeg = parseFloat(e.target.value);
      updateWattmeterUI();
    });

    // Star / Delta Load Buttons
    document.getElementById('btn-load-star').addEventListener('click', () => {
      STATE.wattmeter.connection = 'star';
      document.getElementById('btn-load-star').classList.add('active');
      document.getElementById('btn-load-delta').classList.remove('active');
      updateWattmeterUI();
      audio.playClick();
    });
    document.getElementById('btn-load-delta').addEventListener('click', () => {
      STATE.wattmeter.connection = 'delta';
      document.getElementById('btn-load-delta').classList.add('active');
      document.getElementById('btn-load-star').classList.remove('active');
      updateWattmeterUI();
      audio.playClick();
    });

    // W2 Polarity Switch Buttons
    const toggleW2Polarity = () => {
      STATE.wattmeter.w2Reversed = !STATE.wattmeter.w2Reversed;
      updateWattmeterUI();
      audio.playSwitchSnap();
      ObservationLedger.logConsole(`[WATTMETER] W2 potential coil reversed: ${STATE.wattmeter.w2Reversed ? 'YES (Negative registration)' : 'NO'}`);
    };
    document.getElementById('btn-toggle-w2-pol').addEventListener('click', toggleW2Polarity);
    document.getElementById('btn-flip-w2').addEventListener('click', toggleW2Polarity);

    // Power Factor Presets
    document.querySelectorAll('[data-wm-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-wm-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.getAttribute('data-wm-preset');
        if (preset === 'unity') sliderPhi.value = '0';
        else if (preset === 'lag0866') sliderPhi.value = '30';
        else if (preset === 'lag0500') sliderPhi.value = '60';
        else if (preset === 'lag0259') {
          sliderPhi.value = '75';
          STATE.wattmeter.w2Reversed = true; // Match Benchmark Case B
        }
        else if (preset === 'lead0707') sliderPhi.value = '-45';

        STATE.wattmeter.phiDeg = parseFloat(sliderPhi.value);
        updateWattmeterUI();
        audio.playClick();
      });
    });

    // 7. Maxwell AC Bridge Controls & Listeners
    const sliderR2 = document.getElementById('slider-bridge-r2');
    const sliderR4 = document.getElementById('slider-bridge-r4');
    const sliderC4 = document.getElementById('slider-bridge-c4');
    const sliderFreq = document.getElementById('slider-bridge-freq');

    const updateMaxwellUI = () => {
      const mb = MaxwellSolver.solve();
      document.getElementById('disp-bridge-r2').textContent = `${mb.R2.toFixed(1)} Ω`;
      document.getElementById('disp-bridge-r4').textContent = `${mb.R4.toFixed(1)} Ω`;
      document.getElementById('disp-bridge-c4').textContent = `${(mb.C4 * 1e6).toFixed(3)} μF`;
      document.getElementById('disp-bridge-freq').textContent = `${mb.freq.toFixed(0)} Hz`;

      // Update Audio Tone
      audio.updateBridgeHeadphoneTone(mb.vDetMagMv, mb.freq);

      updateTelemetryAndProofs();
    };

    sliderR2.addEventListener('input', (e) => {
      STATE.maxwell.R2 = parseFloat(e.target.value);
      updateMaxwellUI();
    });
    sliderR4.addEventListener('input', (e) => {
      STATE.maxwell.R4 = parseFloat(e.target.value);
      updateMaxwellUI();
    });
    sliderC4.addEventListener('input', (e) => {
      STATE.maxwell.C4 = parseFloat(e.target.value) * 1e-6;
      updateMaxwellUI();
    });
    sliderFreq.addEventListener('input', (e) => {
      STATE.maxwell.freq = parseFloat(e.target.value);
      updateMaxwellUI();
    });

    // Maxwell Decade Steppers
    document.getElementById('btn-r2-m100').addEventListener('click', () => {
      sliderR2.value = Math.max(50, parseFloat(sliderR2.value) - 100);
      STATE.maxwell.R2 = parseFloat(sliderR2.value); updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-r2-m10').addEventListener('click', () => {
      sliderR2.value = Math.max(50, parseFloat(sliderR2.value) - 10);
      STATE.maxwell.R2 = parseFloat(sliderR2.value); updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-r2-p10').addEventListener('click', () => {
      sliderR2.value = Math.min(1500, parseFloat(sliderR2.value) + 10);
      STATE.maxwell.R2 = parseFloat(sliderR2.value); updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-r2-p100').addEventListener('click', () => {
      sliderR2.value = Math.min(1500, parseFloat(sliderR2.value) + 100);
      STATE.maxwell.R2 = parseFloat(sliderR2.value); updateMaxwellUI(); audio.playClick();
    });

    document.getElementById('btn-r4-m500').addEventListener('click', () => {
      sliderR4.value = Math.max(200, parseFloat(sliderR4.value) - 500);
      STATE.maxwell.R4 = parseFloat(sliderR4.value); updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-r4-m100').addEventListener('click', () => {
      sliderR4.value = Math.max(200, parseFloat(sliderR4.value) - 100);
      STATE.maxwell.R4 = parseFloat(sliderR4.value); updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-r4-p100').addEventListener('click', () => {
      sliderR4.value = Math.min(5000, parseFloat(sliderR4.value) + 100);
      STATE.maxwell.R4 = parseFloat(sliderR4.value); updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-r4-p500').addEventListener('click', () => {
      sliderR4.value = Math.min(5000, parseFloat(sliderR4.value) + 500);
      STATE.maxwell.R4 = parseFloat(sliderR4.value); updateMaxwellUI(); audio.playClick();
    });

    document.getElementById('btn-c4-m01').addEventListener('click', () => {
      sliderC4.value = Math.max(0.01, parseFloat(sliderC4.value) - 0.05);
      STATE.maxwell.C4 = parseFloat(sliderC4.value) * 1e-6; updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-c4-m001').addEventListener('click', () => {
      sliderC4.value = Math.max(0.01, parseFloat(sliderC4.value) - 0.005);
      STATE.maxwell.C4 = parseFloat(sliderC4.value) * 1e-6; updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-c4-p001').addEventListener('click', () => {
      sliderC4.value = Math.min(1.5, parseFloat(sliderC4.value) + 0.005);
      STATE.maxwell.C4 = parseFloat(sliderC4.value) * 1e-6; updateMaxwellUI(); audio.playClick();
    });
    document.getElementById('btn-c4-p01').addEventListener('click', () => {
      sliderC4.value = Math.min(1.5, parseFloat(sliderC4.value) + 0.05);
      STATE.maxwell.C4 = parseFloat(sliderC4.value) * 1e-6; updateMaxwellUI(); audio.playClick();
    });

    // Mystery Coil Selector
    document.querySelectorAll('[data-coil]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-coil]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cid = parseInt(btn.getAttribute('data-coil'), 10);
        STATE.maxwell.selectedCoilId = cid;

        // Reset dials slightly off balance for puzzle
        sliderR2.value = '450';
        sliderR4.value = '2000';
        sliderC4.value = '0.100';
        STATE.maxwell.R2 = 450;
        STATE.maxwell.R4 = 2000;
        STATE.maxwell.C4 = 0.100e-6;

        updateMaxwellUI();
        audio.playClick();
      });
    });

    // Auto-Balance Button (Exact solve)
    document.getElementById('btn-bridge-autobalance').addEventListener('click', () => {
      const coil = STATE.maxwell.mysteryCoils[STATE.maxwell.selectedCoilId];
      // Solve: R2 = 600, R3 = 1000
      // R4 = (R2 * R3) / Rx
      // C4 = Lx / (R2 * R3)
      const R2_target = 600.0;
      const R4_target = (R2_target * STATE.maxwell.R3) / coil.Rx;
      const C4_target = coil.Lx / (R2_target * STATE.maxwell.R3);

      sliderR2.value = `${R2_target}`;
      sliderR4.value = `${R4_target.toFixed(0)}`;
      sliderC4.value = `${(C4_target * 1e6).toFixed(3)}`;

      STATE.maxwell.R2 = R2_target;
      STATE.maxwell.R4 = R4_target;
      STATE.maxwell.C4 = C4_target;

      updateMaxwellUI();
      audio.playSuccessChime();
      ObservationLedger.logConsole(`[MAXWELL BRIDGE] Auto-balanced for ${coil.name}: Lx = ${(coil.Lx * 1000).toFixed(1)}mH, Rx = ${coil.Rx}Ω.`);
    });

    // Headphone Tone Toggle
    document.getElementById('btn-bridge-tone').addEventListener('click', (e) => {
      STATE.maxwell.toneActive = !STATE.maxwell.toneActive;
      e.currentTarget.textContent = STATE.maxwell.toneActive ? '🎧 Tone: ON' : '🎧 Headphone Tone';
      if (STATE.maxwell.toneActive) {
        audio.startBridgeHeadphoneTone(STATE.maxwell.freq);
      } else {
        audio.stopBridgeHeadphoneTone();
      }
      audio.playClick();
    });

    // 8. Initialize Subsystems
    ObservationLedger.init();
    ChallengeEngine.init();
    QuizEngine.init();

    // Render static mathematical formulas via KaTeX auto-render
    const renderAllMath = () => {
      if (window.renderMathInElement) {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }
    };
    renderAllMath();

    // 9. Main 60 FPS Animation & Physics Loop
    let lastTime = performance.now();
    const animLoop = (now) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      // Integrate PMMC dynamics
      if (STATE.activeModule === 'pmmc') {
        PMMCSolver.stepRK4(dt);
      }

      // Render Active Viewports
      workbench.render();
      deck.render();

      requestAnimationFrame(animLoop);
    };

    // Initial telemetry & trigger loop
    updateTelemetryAndProofs();
    requestAnimationFrame(animLoop);

    // Initial fit view
    setTimeout(() => workbench.fitView(), 100);
  });

})();
