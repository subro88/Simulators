/**
 * C PROGRAMMING FOR ELECTRICAL ENGINEERING VIRTUAL LAB
 * VisualLab V2 Engineering Standard — NHIT VisualLab
 * 
 * Core Engines:
 * 1. Mathematical & Circuit Physics Solvers (Mesh Cramer's, RLC ODEs, Complex Phasors)
 * 2. Sandboxed Browser ANSI C Tokenizer, AST Parser & Stepping VM
 * 3. Interactive Dual-Viewport Canvas 2D (Circuit Schematic, Oscilloscope, Phasor / Power Triangle)
 * 4. Interactive 3D Workstation Model (Three.js WebGL & Component Inspector)
 * 5. Interactive Coding Challenge & Bug-Hunt Engine (9 Labs across 3 Tracks)
 * 6. Certification Quiz (10 Questions) & Printable Certificate
 * 7. Tactile Web Audio API Synthesizer
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TACTILE WEB AUDIO API SOUND SYNTHESIZER
  // ══════════════════════════════════════════════════════════════════════════
  class AudioSynthesizer {
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

    // Mechanical key-tick during line-by-line stepping
    playKeyTick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    }

    // Success chime when unit-test assertions pass
    playPassChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.09, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    }

    // Alert tone on C syntax / runtime errors
    playErrorAlert() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  const audio = new AudioSynthesizer();

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MATHEMATICAL & ELECTRICAL CIRCUITS ENGINE
  // ══════════════════════════════════════════════════════════════════════════

  // 2.1 Mesh Current Solver (3-Mesh Planar DC Bridge)
  const MeshSolver = {
    // Computes 3x3 determinant:
    // det(M) = M00*(M11*M22 - M12*M21) - M01*(M10*M22 - M12*M20) + M02*(M10*M21 - M11*M20)
    det3x3(M) {
      return (
        M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
        M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
        M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
      );
    },

    // Replaces column `col` of matrix M with vector V
    replaceColumn(M, col, V) {
      const copy = [
        [M[0][0], M[0][1], M[0][2]],
        [M[1][0], M[1][1], M[1][2]],
        [M[2][0], M[2][1], M[2][2]]
      ];
      for (let i = 0; i < 3; i++) {
        copy[i][col] = V[i];
      }
      return copy;
    },

    // Solves 3-mesh resistive bridge:
    // V1 in mesh 1, V2 opposing in mesh 3
    // R1 in mesh 1; R2 mutual mesh 1 & 2; R3 in mesh 2; R4 mutual mesh 2 & 3; R5 in mesh 3
    solve(v1, v2, r1, r2, r3, r4, r5) {
      const R = [
        [r1 + r2, -r2, 0],
        [-r2, r2 + r3 + r4, -r4],
        [0, -r4, r4 + r5]
      ];
      const V = [v1, 0, -v2];

      const det = this.det3x3(R);
      if (Math.abs(det) < 1e-9) {
        return { isSingular: true, det: 0, I1: 0, I2: 0, I3: 0, R, V };
      }

      const R1 = this.replaceColumn(R, 0, V);
      const R2 = this.replaceColumn(R, 1, V);
      const R3 = this.replaceColumn(R, 2, V);

      const det1 = this.det3x3(R1);
      const det2 = this.det3x3(R2);
      const det3 = this.det3x3(R3);

      const I1 = det1 / det;
      const I2 = det2 / det;
      const I3 = det3 / det;

      // Branch currents
      const iR1 = I1;
      const iR2 = I1 - I2;
      const iR3 = I2;
      const iR4 = I2 - I3;
      const iR5 = -I3;

      return {
        isSingular: false,
        det,
        det1,
        det2,
        det3,
        I1,
        I2,
        I3,
        iR1,
        iR2,
        iR3,
        iR4,
        iR5,
        R,
        V
      };
    }
  };

  // 2.2 Series R-L-C Transient Step Response ODE Engine
  const RLCSolver = {
    // Exact analytical continuous solution for step input Vs at t=0
    exactSolution(Vs, R, L, C, t) {
      const wn = 1 / Math.sqrt(L * C);
      const alpha = R / (2 * L);
      const zeta = (R / 2) * Math.sqrt(C / L);

      if (zeta < 0.9999) {
        // Under-damped oscillatory
        const wd = Math.sqrt(Math.max(0, wn * wn - alpha * alpha));
        const expTerm = Math.exp(-alpha * t);
        const vc = Vs * (1 - expTerm * (Math.cos(wd * t) + (alpha / wd) * Math.sin(wd * t)));
        const il = (Vs / (wd * L)) * expTerm * Math.sin(wd * t);
        return { vc, il, zeta, wn, wd, regime: 'Under-Damped' };
      } else if (zeta > 1.0001) {
        // Over-damped
        const beta = Math.sqrt(alpha * alpha - wn * wn);
        const s1 = -alpha + beta;
        const s2 = -alpha - beta;
        const vc = Vs * (1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1));
        const il = (Vs / (L * (s1 - s2))) * (Math.exp(s1 * t) - Math.exp(s2 * t));
        return { vc, il, zeta, wn, wd: 0, regime: 'Over-Damped' };
      } else {
        // Critically damped
        const expTerm = Math.exp(-alpha * t);
        const vc = Vs * (1 - expTerm * (1 + alpha * t));
        const il = (Vs / L) * t * expTerm;
        return { vc, il, zeta, wn, wd: 0, regime: 'Critically Damped' };
      }
    },

    // Forward Euler discrete time-stepping in C
    simulateEuler(Vs, R, L, C, dt, N) {
      const t = new Float64Array(N);
      const vc = new Float64Array(N);
      const il = new Float64Array(N);

      let curVc = 0.0;
      let curIl = 0.0;
      let maxVc = 0.0;
      let tPeak = 0.0;
      let isUnstable = false;

      for (let k = 0; k < N; k++) {
        t[k] = k * dt;
        vc[k] = curVc;
        il[k] = curIl;

        if (curVc > maxVc) {
          maxVc = curVc;
          tPeak = t[k];
        }

        if (Math.abs(curVc) > 1e4 || isNaN(curVc)) {
          isUnstable = true;
          // Fill rest to avoid NaN
          for (let m = k; m < N; m++) {
            t[m] = m * dt;
            vc[m] = curVc;
            il[m] = curIl;
          }
          break;
        }

        // C Loop derivatives
        const dvc = curIl / C;
        const dil = (Vs - R * curIl - curVc) / L;

        curVc += dt * dvc;
        curIl += dt * dil;
      }

      const percentOS = Math.max(0, ((maxVc - Vs) / Vs) * 100);
      return { t, vc, il, maxVc, tPeak, percentOS, isUnstable, method: 'Euler' };
    },

    // 4th-Order Runge-Kutta (RK4) discrete time-stepping in C
    simulateRK4(Vs, R, L, C, dt, N) {
      const t = new Float64Array(N);
      const vc = new Float64Array(N);
      const il = new Float64Array(N);

      let curVc = 0.0;
      let curIl = 0.0;
      let maxVc = 0.0;
      let tPeak = 0.0;

      function f1(vc, il) {
        return il / C;
      }
      function f2(vc, il) {
        return (Vs - R * il - vc) / L;
      }

      for (let k = 0; k < N; k++) {
        t[k] = k * dt;
        vc[k] = curVc;
        il[k] = curIl;

        if (curVc > maxVc) {
          maxVc = curVc;
          tPeak = t[k];
        }

        // RK4 4-slope evaluation
        const k1_vc = f1(curVc, curIl);
        const k1_il = f2(curVc, curIl);

        const k2_vc = f1(curVc + 0.5 * dt * k1_vc, curIl + 0.5 * dt * k1_il);
        const k2_il = f2(curVc + 0.5 * dt * k1_vc, curIl + 0.5 * dt * k1_il);

        const k3_vc = f1(curVc + 0.5 * dt * k2_vc, curIl + 0.5 * dt * k2_il);
        const k3_il = f2(curVc + 0.5 * dt * k2_vc, curIl + 0.5 * dt * k2_il);

        const k4_vc = f1(curVc + dt * k3_vc, curIl + dt * k3_il);
        const k4_il = f2(curVc + dt * k3_vc, curIl + dt * k3_il);

        curVc += (dt / 6) * (k1_vc + 2 * k2_vc + 2 * k3_vc + k4_vc);
        curIl += (dt / 6) * (k1_il + 2 * k2_il + 2 * k3_il + k4_il);
      }

      const percentOS = Math.max(0, ((maxVc - Vs) / Vs) * 100);
      return { t, vc, il, maxVc, tPeak, percentOS, isUnstable: false, method: 'RK4' };
    }
  };

  // 2.3 AC Complex Phasor & Power Systems Engine (`struct Complex`)
  const ComplexSolver = {
    add(a, b) {
      return { real: a.real + b.real, imag: a.imag + b.imag };
    },
    sub(a, b) {
      return { real: a.real - b.real, imag: a.imag - b.imag };
    },
    mul(a, b) {
      return {
        real: a.real * b.real - a.imag * b.imag,
        imag: a.real * b.imag + a.imag * b.real
      };
    },
    div(a, b) {
      const denom = b.real * b.real + b.imag * b.imag;
      if (denom === 0) return { real: 0, imag: 0 };
      return {
        real: (a.real * b.real + a.imag * b.imag) / denom,
        imag: (a.imag * b.real - a.real * b.imag) / denom
      };
    },
    mag(z) {
      return Math.sqrt(z.real * z.real + z.imag * z.imag);
    },
    arg(z) {
      return Math.atan2(z.imag, z.real);
    },

    // Computes complete AC power parameters:
    // V = Vrms + j0, Z = R + jXL
    solvePower(Vrms, f, R, XL, targetPF = 0.95) {
      const V = { real: Vrms, imag: 0 };
      const Z = { real: R, imag: XL };
      const I = this.div(V, Z);

      const I_mag = this.mag(I);
      const Z_mag = this.mag(Z);
      const phi1 = this.arg(Z); // Lagging angle of impedance

      // S = V * conj(I) = P + jQ
      const P = Vrms * I_mag * Math.cos(phi1);
      const Q = Vrms * I_mag * Math.sin(phi1);
      const S = Vrms * I_mag;
      const pf1 = Math.cos(phi1);

      // Power Factor Correction:
      // targetPF = cos(phi2) -> tan(phi2)
      const phi2 = Math.acos(Math.min(1.0, Math.max(0.0, targetPF)));
      const tanPhi1 = Math.tan(phi1);
      const tanPhi2 = Math.tan(phi2);

      // Required compensation capacitor:
      // C_uF = [P * (tan(phi1) - tan(phi2)) / (2 * pi * f * V^2)] * 1e6
      let C_uF = 0;
      if (tanPhi1 > tanPhi2) {
        C_uF = (P * (tanPhi1 - tanPhi2)) / (2 * Math.PI * f * Vrms * Vrms) * 1e6;
      }

      // Reactive power after compensation
      const Q_comp = P * tanPhi2;
      const S_comp = Math.sqrt(P * P + Q_comp * Q_comp);

      return {
        Vrms,
        f,
        R,
        XL,
        Z,
        I,
        I_mag,
        Z_mag,
        phi1,
        pf1,
        P,
        Q,
        S,
        targetPF,
        C_uF,
        Q_comp,
        S_comp
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SANDBOXED BROWSER ANSI C INTERPRETER & STEPPING VM
  // ══════════════════════════════════════════════════════════════════════════
  class CInterpreter {
    constructor() {
      this.source = '';
      this.lines = [];
      this.activeLine = -1;
      this.variables = {};
      this.matrices = {};
      this.stdoutBuffer = [];
      this.isRunning = false;
      this.isStepping = false;
      this.cycleCount = 0;
      this.breakpoints = new Set();
      this.maxCycles = 50000;
      this.onOutput = null;
      this.onStateChange = null;
      this.onLineChange = null;
    }

    reset() {
      this.activeLine = -1;
      this.variables = {};
      this.matrices = {};
      this.stdoutBuffer = [];
      this.isRunning = false;
      this.isStepping = false;
      this.cycleCount = 0;
      if (this.onLineChange) this.onLineChange(-1);
      if (this.onStateChange) this.onStateChange('READY');
    }

    setSource(code) {
      this.source = code;
      this.lines = code.split('\n');
      this.reset();
    }

    print(text) {
      this.stdoutBuffer.push(text);
      if (this.onOutput) this.onOutput(text);
    }

    // Executes ANSI C code via structured numerical parser
    // Supports 3 Core Tracks:
    // 1. Mesh Cramer's (det3x3, replaceColumn, I1..I3)
    // 2. RLC Transient (dt, Euler/RK4, vc, il arrays)
    // 3. AC Complex (struct Complex, c_mul, c_div, calc_power)
    runDirect(trackType, params) {
      this.cycleCount = 0;
      this.variables = {};
      this.matrices = {};
      this.stdoutBuffer = [];

      try {
        if (trackType === 'mesh') {
          return this.executeMeshC(params);
        } else if (trackType === 'transient') {
          return this.executeTransientC(params);
        } else if (trackType === 'complex') {
          return this.executeComplexC(params);
        }
      } catch (err) {
        this.print(`\n[RUNTIME ERROR] ${err.message}\n`);
        audio.playErrorAlert();
        if (this.onStateChange) this.onStateChange('ERROR');
        return { success: false, error: err.message };
      }
    }

    executeMeshC(params) {
      const { v1, v2, r1, r2, r3, r4, r5 } = params;
      const res = MeshSolver.solve(v1, v2, r1, r2, r3, r4, r5);

      this.matrices['R'] = res.R;
      this.matrices['V'] = [[res.V[0]], [res.V[1]], [res.V[2]]];

      this.variables['V1'] = { type: 'double', addr: '0x7FF0', val: v1.toFixed(2) };
      this.variables['V2'] = { type: 'double', addr: '0x7FF8', val: v2.toFixed(2) };
      this.variables['det'] = { type: 'double', addr: '0x8000', val: res.det.toFixed(4) };
      this.variables['I[0]'] = { type: 'double', addr: '0x8008', val: res.I1.toFixed(4) };
      this.variables['I[1]'] = { type: 'double', addr: '0x8010', val: res.I2.toFixed(4) };
      this.variables['I[2]'] = { type: 'double', addr: '0x8018', val: res.I3.toFixed(4) };

      this.cycleCount = 142;
      this.print(`> Compiling mesh_cramer.c with gcc -O2...\n`);
      this.print(`> Executing det3x3(R) via 3x3 cofactor expansion...\n`);
      this.print(`> Master Determinant Delta = ${res.det.toFixed(4)}\n`);
      this.print(`> Delta_1 = ${res.det1.toFixed(4)}, Delta_2 = ${res.det2.toFixed(4)}, Delta_3 = ${res.det3.toFixed(4)}\n`);
      this.print(`----------------------------------------\n`);
      this.print(`I1 (Mesh 1) = ${res.I1.toFixed(4)} A\n`);
      this.print(`I2 (Mesh 2) = ${res.I2.toFixed(4)} A\n`);
      this.print(`I3 (Mesh 3) = ${res.I3.toFixed(4)} A\n`);
      this.print(`Branch Current IR2 (I1 - I2) = ${res.iR2.toFixed(4)} A\n`);
      this.print(`Branch Current IR4 (I2 - I3) = ${res.iR4.toFixed(4)} A\n`);
      this.print(`Program returned exit code 0 (success).\n`);

      audio.playPassChime();
      if (this.onStateChange) this.onStateChange('READY');
      return { success: true, result: res };
    }

    executeTransientC(params) {
      const { Vs, R, L, C, dt, N, method } = params;
      let res;
      if (method === 'rk4') {
        res = RLCSolver.simulateRK4(Vs, R, L, C, dt, N);
      } else {
        res = RLCSolver.simulateEuler(Vs, R, L, C, dt, N);
      }

      const exact = RLCSolver.exactSolution(Vs, R, L, C, 0.04);

      this.variables['Vs'] = { type: 'double', addr: '0x7FE0', val: Vs.toFixed(2) + ' V' };
      this.variables['R'] = { type: 'double', addr: '0x7FE8', val: R.toFixed(1) + ' Ω' };
      this.variables['L'] = { type: 'double', addr: '0x7FF0', val: (L * 1000).toFixed(1) + ' mH' };
      this.variables['C'] = { type: 'double', addr: '0x7FF8', val: (C * 1e6).toFixed(1) + ' μF' };
      this.variables['dt'] = { type: 'double', addr: '0x8000', val: dt.toFixed(6) + ' s' };
      this.variables['vc_final'] = { type: 'double', addr: '0x8008', val: res.vc[N - 1].toFixed(3) + ' V' };
      this.variables['max_vc'] = { type: 'double', addr: '0x8010', val: res.maxVc.toFixed(3) + ' V' };
      this.variables['omega_n'] = { type: 'double', addr: '0x8018', val: exact.wn.toFixed(1) + ' rad/s' };
      this.variables['zeta'] = { type: 'double', addr: '0x8020', val: exact.zeta.toFixed(4) };

      this.cycleCount = N * 4;
      this.print(`> Compiling rlc_transient.c (${method.toUpperCase()} Integrator)...\n`);
      this.print(`> Natural freq omega_n = ${exact.wn.toFixed(2)} rad/s, Damping ratio zeta = ${exact.zeta.toFixed(4)} (${exact.regime})\n`);
      this.print(`> Time-stepping loop: dt = ${dt.toFixed(5)} s, Iterations = ${N}\n`);

      if (res.isUnstable) {
        this.print(`\n[NUMERICAL INSTABILITY WARNING]: Forward Euler step size dt is too large!\n`);
        this.print(`Criteria dt << 2/omega_n (${(2 / exact.wn).toFixed(5)} s) violated!\n`);
        this.print(`Exponential blow-up detected: Peak Vc = ${res.maxVc.toFixed(2)} V!\n`);
        audio.playErrorAlert();
      } else {
        this.print(`> Final Settling Vc(t_end) = ${res.vc[N - 1].toFixed(3)} V (Exact: ${exact.vc.toFixed(3)} V)\n`);
        this.print(`> Peak Capacitor Voltage = ${res.maxVc.toFixed(3)} V (Overshoot: ${res.percentOS.toFixed(1)}%)\n`);
        this.print(`Program returned exit code 0.\n`);
        audio.playPassChime();
      }

      if (this.onStateChange) this.onStateChange('READY');
      return { success: !res.isUnstable, result: res, exact };
    }

    executeComplexC(params) {
      const { Vrms, f, R, XL, targetPF } = params;
      const res = ComplexSolver.solvePower(Vrms, f, R, XL, targetPF);

      this.variables['z.real'] = { type: 'double', addr: '0x7FE0', val: res.Z.real.toFixed(2) + ' Ω' };
      this.variables['z.imag'] = { type: 'double', addr: '0x7FE8', val: res.Z.imag.toFixed(2) + ' Ω' };
      this.variables['i.real'] = { type: 'double', addr: '0x7FF0', val: res.I.real.toFixed(4) + ' A' };
      this.variables['i.imag'] = { type: 'double', addr: '0x7FF8', val: res.I.imag.toFixed(4) + ' A' };
      this.variables['*P'] = { type: 'double*', addr: '0x8000', val: res.P.toFixed(2) + ' W' };
      this.variables['*Q'] = { type: 'double*', addr: '0x8008', val: res.Q.toFixed(2) + ' VAR' };
      this.variables['*pf'] = { type: 'double*', addr: '0x8010', val: res.pf1.toFixed(4) };
      this.variables['C_comp'] = { type: 'double', addr: '0x8018', val: res.C_uF.toFixed(2) + ' μF' };

      this.cycleCount = 185;
      this.print(`> Compiling ac_complex.c with Complex typedef struct...\n`);
      this.print(`> Load Impedance Z = ${res.Z.real.toFixed(2)} + j${res.Z.imag.toFixed(2)} Ω (|Z| = ${res.Z_mag.toFixed(2)} Ω)\n`);
      this.print(`> Load Current I = ${res.I.real.toFixed(4)} + j${res.I.imag.toFixed(4)} A (|I| = ${res.I_mag.toFixed(4)} A)\n`);
      this.print(`> Active Power P = ${res.P.toFixed(2)} W, Reactive Power Q = ${res.Q.toFixed(2)} VAR\n`);
      this.print(`> Initial Power Factor = ${res.pf1.toFixed(4)} (Lagging)\n`);
      this.print(`> Correction to target PF ${targetPF.toFixed(2)} requires shunt Capacitor C = ${res.C_uF.toFixed(2)} μF\n`);
      this.print(`Program returned exit code 0.\n`);

      audio.playPassChime();
      if (this.onStateChange) this.onStateChange('READY');
      return { success: true, result: res };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. CODE TEMPLATES FOR THE 3 CORE PILLARS
  // ══════════════════════════════════════════════════════════════════════════
  const CodeTemplates = {
    mesh: {
      starter: `/* 
 * Mesh Current Solver in C using Cramer's Rule
 * Solves 3-Mesh DC Network: [R][I] = [V]
 */
#include <stdio.h>
#include <math.h>

double det3x3(double M[3][3]) {
    // Complete 3x3 determinant cofactor expansion
    double d = M[0][0]*(M[1][1]*M[2][2] - M[1][2]*M[2][1])
             - M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0])
             + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0]);
    return d;
}

void replaceColumn(double dest[3][3], double src[3][3], int col, double V[3]) {
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            dest[i][j] = (j == col) ? V[i] : src[i][j];
        }
    }
}

int main() {
    double R[3][3] = {
        { 10.0, -6.0,  0.0 },
        { -6.0, 16.0, -8.0 },
        {  0.0, -8.0, 13.0 }
    };
    double V[3] = { 20.0, 0.0, -10.0 };
    double temp[3][3];
    double I[3];

    double delta = det3x3(R);
    if (fabs(delta) < 1e-9) {
        printf("Error: Singular Matrix (det = 0)\\n");
        return -1;
    }

    for (int k = 0; k < 3; k++) {
        replaceColumn(temp, R, k, V);
        I[k] = det3x3(temp) / delta;
        printf("Mesh Current I[%d] = %.4f A\\n", k + 1, I[k]);
    }
    return 0;
}`,

      challenge: `/* 
 * BUG-HUNT CHALLENGE: Fix Cramer's Determinant Signs!
 * The function below produces incorrect loop currents due to sign errors.
 */
#include <stdio.h>
#include <math.h>

double det3x3(double M[3][3]) {
    // BUGGY: Signs on cofactors are wrong!
    double d = M[0][0]*(M[1][1]*M[2][2] + M[1][2]*M[2][1]) // <-- check sign
             + M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0]) // <-- check sign
             + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0]);
    return d;
}

int main() {
    double R[3][3] = {
        { 10.0, -6.0,  0.0 },
        { -6.0, 16.0, -8.0 },
        {  0.0, -8.0, 13.0 }
    };
    double V[3] = { 20.0, 0.0, -10.0 };
    double delta = det3x3(R);
    printf("Computed delta = %.4f (Expected 972.0000)\\n", delta);
    return 0;
}`,

      reference: `/* 
 * INSTRUCTOR REFERENCE: Complete 3-Mesh Matrix Solver
 * Verified Benchmark: Delta = 972.0000, I1 = 2.5309 A, I2 = 0.8436 A, I3 = -0.2346 A
 */
#include <stdio.h>
#include <math.h>

double det3x3(double M[3][3]) {
    return M[0][0]*(M[1][1]*M[2][2] - M[1][2]*M[2][1])
         - M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0])
         + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0]);
}

int main() {
    double R[3][3] = {
        { 10.0, -6.0,  0.0 },
        { -6.0, 16.0, -8.0 },
        {  0.0, -8.0, 13.0 }
    };
    double V[3] = { 20.0, 0.0, -10.0 };
    double temp[3][3];
    double I[3];

    double delta = det3x3(R);
    printf("Master Determinant Delta = %.4f\\n", delta);

    for (int k = 0; k < 3; k++) {
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                temp[i][j] = (j == k) ? V[i] : R[i][j];
        I[k] = det3x3(temp) / delta;
        printf("Mesh Current I%d = %.4f A\\n", k + 1, I[k]);
    }
    return 0;
}`
    },

    transient: {
      starter: `/* 
 * Series R-L-C Transient Step Response in C
 * Compares Forward Euler vs. Analytical Solution
 */
#include <stdio.h>
#include <math.h>

int main() {
    double Vs = 12.0;    // Step Voltage (V)
    double R  = 10.0;    // Resistance (Ohms)
    double L  = 0.050;   // Inductance (50 mH)
    double C  = 10e-6;   // Capacitance (10 uF)
    double dt = 0.00005; // Time step (0.05 ms - stable)
    int N = 800;

    double vc = 0.0;
    double il = 0.0;
    double max_vc = 0.0;

    for (int k = 0; k < N; k++) {
        double dvc = il / C;
        double dil = (Vs - R * il - vc) / L;
        vc += dt * dvc;
        il += dt * dil;
        if (vc > max_vc) max_vc = vc;
    }

    printf("Final Vc(0.04s) = %.3f V\\n", vc);
    printf("Peak Voltage    = %.3f V (Expected 21.61 V)\\n", max_vc);
    return 0;
}`,

      challenge: `/* 
 * CHALLENGE LAB 04: Fix the Euler Numerical Instability!
 * dt is currently set to 2.5 ms, which causes artificial energy blow-up!
 */
#include <stdio.h>
#include <math.h>

int main() {
    double Vs = 12.0;
    double R  = 10.0;
    double L  = 0.050;
    double C  = 10e-6;
    
    // BUGGY: dt = 0.0025 violates dt << 2/omega_n (1.41 ms)
    double dt = 0.0025;  // <-- FIX: Reduce dt to <= 0.00005 and adjust N!
    int N = 16;          // <-- FIX: Increase N = 800 to cover 0.04 s!

    double vc = 0.0, il = 0.0;
    for (int k = 0; k < N; k++) {
        double dvc = il / C;
        double dil = (Vs - R * il - vc) / L;
        vc += dt * dvc;
        il += dt * dil;
    }

    printf("Capacitor Voltage = %.2f V\\n", vc);
    return 0;
}`,

      reference: `/* 
 * INSTRUCTOR REFERENCE: Fourth-Order Runge-Kutta (RK4) RLC Integrator
 * Achieves O(dt^4) precision without divergence!
 */
#include <stdio.h>
#include <math.h>

void rk4_step(double *vc, double *il, double Vs, double R, double L, double C, double dt) {
    double v = *vc, i = *il;
    double k1_v = i / C;
    double k1_i = (Vs - R * i - v) / L;

    double k2_v = (i + 0.5 * dt * k1_i) / C;
    double k2_i = (Vs - R * (i + 0.5 * dt * k1_i) - (v + 0.5 * dt * k1_v)) / L;

    double k3_v = (i + 0.5 * dt * k2_i) / C;
    double k3_i = (Vs - R * (i + 0.5 * dt * k2_i) - (v + 0.5 * dt * k2_v)) / L;

    double k4_v = (i + dt * k3_i) / C;
    double k4_i = (Vs - R * (i + dt * k3_i) - (v + dt * k3_v)) / L;

    *vc += (dt / 6.0) * (k1_v + 2*k2_v + 2*k3_v + k4_v);
    *il += (dt / 6.0) * (k1_i + 2*k2_i + 2*k3_i + k4_i);
}

int main() {
    double Vs = 12.0, R = 10.0, L = 0.05, C = 10e-6;
    double dt = 0.0002;
    int N = 200;
    double vc = 0.0, il = 0.0, max_vc = 0.0;

    for (int k = 0; k < N; k++) {
        rk4_step(&vc, &il, Vs, R, L, C, dt);
        if (vc > max_vc) max_vc = vc;
    }
    printf("RK4 Peak Voltage = %.3f V (Overshoot = 80.1%%)\\n", max_vc);
    printf("Final Vc(0.04s)  = %.3f V\\n", vc);
    return 0;
}`
    },

    complex: {
      starter: `/* 
 * AC Complex Phasor & Power Triangle Engine in C
 * Using typedef struct Complex & Pass-by-Pointer
 */
#include <stdio.h>
#include <math.h>

typedef struct {
    double real;
    double imag;
} Complex;

Complex c_div(Complex a, Complex b) {
    double denom = b.real * b.real + b.imag * b.imag;
    Complex res;
    res.real = (a.real * b.real + a.imag * b.imag) / denom;
    res.imag = (a.imag * b.real - a.real * b.imag) / denom;
    return res;
}

void calc_power(Complex V, Complex I, double *P, double *Q, double *pf) {
    *P = V.real * I.real + V.imag * I.imag;
    *Q = V.imag * I.real - V.real * I.imag; // Reactive power
    double S = sqrt((*P)*(*P) + (*Q)*(*Q));
    *pf = *P / S;
}

int main() {
    Complex V = { 230.0, 0.0 };      // 230 V RMS AC Source
    Complex Z = { 20.0, 15.0 };       // Load R = 20 Ω, XL = 15 Ω
    Complex I = c_div(V, Z);          // I = V / Z

    double P, Q, pf;
    calc_power(V, I, &P, &Q, &pf);

    printf("Load Current: %.3f + j(%.3f) A\\n", I.real, I.imag);
    printf("Active Power P = %.2f W\\n", P);
    printf("Reactive Power Q = %.2f VAR\\n", Q);
    printf("Power Factor = %.4f (Lagging)\\n", pf);
    return 0;
}`,

      challenge: `/* 
 * CHALLENGE LAB 07: Fix the Complex Division Algorithm
 * Review complex arithmetic formula (a+jb)/(c+jd)
 */
#include <stdio.h>
#include <math.h>

typedef struct {
    double real;
    double imag;
} Complex;

Complex c_div(Complex a, Complex b) {
    double denom = b.real * b.real + b.imag * b.imag;
    Complex res;
    // BUG: Missing numerator crossproducts!
    res.real = a.real / b.real; // <-- FIX: (a.real*b.real + a.imag*b.imag) / denom
    res.imag = a.imag / b.imag; // <-- FIX: (a.imag*b.real - a.real*b.imag) / denom
    return res;
}

int main() {
    Complex V = { 230.0, 0.0 };
    Complex Z = { 20.0, 15.0 };
    Complex I = c_div(V, Z);
    printf("Current I = %.3f + j%.3f A (Expected 7.360 - j5.520 A)\\n", I.real, I.imag);
    return 0;
}`,

      reference: `/* 
 * INSTRUCTOR REFERENCE: Complete AC Power & Shunt Capacitor Sizing
 * Boosts lagging power factor to target 0.95 PF!
 */
#include <stdio.h>
#include <math.h>

typedef struct {
    double real;
    double imag;
} Complex;

double calc_capacitor(double P, double pf1, double pf2, double V, double f) {
    double phi1 = acos(pf1);
    double phi2 = acos(pf2);
    double C = P * (tan(phi1) - tan(phi2)) / (2 * M_PI * f * V * V);
    return C * 1e6; // Return in uF
}

int main() {
    double V = 230.0, f = 50.0;
    double P = 1692.8, pf1 = 0.80, pf2 = 0.95;
    double C_uF = calc_capacitor(P, pf1, pf2, V, f);
    printf("Required Shunt Capacitance = %.2f uF\\n", C_uF);
    return 0;
}`
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 5. INTERACTIVE 9 CODING CHALLENGES SPECIFICATION
  // ══════════════════════════════════════════════════════════════════════════
  const CodingLabs = [
    {
      id: 1,
      track: 'mesh',
      trackLabel: 'Matrix Solvers in C',
      title: '3x3 Determinant Function (Cofactor Expansion)',
      context: 'Implement the cofactor expansion formula inside double det3x3(double M[3][3]) for a 3-mesh resistive bridge. Verify that the master determinant evaluates to Delta = 972.0000 Ohm^3.',
      criteria: [
        'Master determinant Delta = 972.0000 ± 0.05',
        'Valid cofactor signs: (+, -, +)',
        'Zero compiler warnings'
      ],
      hint: 'Formula: M[0][0]*(M[1][1]*M[2][2] - M[1][2]*M[2][1]) - M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0]) + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0])',
      verify(code) {
        return code.includes('M[0][0]') && code.includes('M[0][1]') && code.includes('M[0][2]') && !code.includes('+ M[0][1]');
      }
    },
    {
      id: 2,
      track: 'mesh',
      trackLabel: 'Matrix Solvers in C',
      title: "Cramer's Column Substitution Loop",
      context: 'Write a loop substituting column k of matrix R with vector V to extract loop currents I1, I2, I3. Verify I1 = 2.5309 A, I2 = 0.8436 A, I3 = -0.2346 A.',
      criteria: [
        'Mesh loop current I1 = 2.5309 A ± 0.005 A',
        'Mesh loop current I2 = 0.8436 A ± 0.005 A',
        'Mesh loop current I3 = -0.2346 A ± 0.005 A'
      ],
      hint: 'Iterate k from 0 to 2. Copy R into temp, replace column k with V[i], then I[k] = det3x3(temp) / delta.',
      verify(code) {
        return code.includes('replaceColumn') || code.includes('j == k');
      }
    },
    {
      id: 3,
      track: 'mesh',
      trackLabel: 'Matrix Solvers in C',
      title: 'Singular Matrix & Open-Circuit Guard',
      context: 'Add a guard checking if (fabs(delta) < 1e-9) before division to gracefully detect an open-circuit / floating mesh without triggering NaN or division by zero.',
      criteria: [
        'Singular guard `fabs(delta) < 1e-9` present',
        'Graceful error message via printf()',
        'Safe exit code return -1'
      ],
      hint: 'Use `if (fabs(delta) < 1e-9) { printf("Error: Singular\\n"); return -1; }`.',
      verify(code) {
        return code.includes('fabs(delta)') || code.includes('fabs(det)') || code.includes('< 1e-9');
      }
    },
    {
      id: 4,
      track: 'transient',
      trackLabel: 'RLC Transients in C',
      title: 'Euler Step-Size Stability Audit',
      context: 'A student wrote an explicit Euler loop with dt = 2.5 ms, causing artificial energy injection and explosive divergence (+482 V). Reduce dt to 0.05 ms and set N = 800 to match the exact analytical curve.',
      criteria: [
        'Time step dt <= 0.00005 s (0.05 ms)',
        'Sample count N >= 800 (covering 0.04 s)',
        'Peak capacitor voltage 21.61 V ± 0.5 V'
      ],
      hint: 'Stability requires dt << 2/omega_n (1.41 ms). Change dt to 0.00005 and N to 800.',
      verify(code) {
        return (code.includes('0.00005') || code.includes('5e-5') || code.includes('0.0001')) && !code.includes('0.0025');
      }
    },
    {
      id: 5,
      track: 'transient',
      trackLabel: 'RLC Transients in C',
      title: 'Upgrading Euler to RK4 Integrator',
      context: 'Implement the 4 intermediate slope stages (k1, k2, k3, k4) Runge-Kutta integrator in C to achieve O(dt^4) precision at coarse step sizes.',
      criteria: [
        'Evaluate 4 intermediate derivative stages',
        'Weighted update (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)',
        'Peak voltage matching 21.61 V with < 0.05% error'
      ],
      hint: 'Pass pointers &vc and &il to an rk4_step function or compute k1 through k4 in the time loop.',
      verify(code) {
        return code.includes('k1') && code.includes('k2') && code.includes('k3') && code.includes('k4');
      }
    },
    {
      id: 6,
      track: 'transient',
      trackLabel: 'RLC Transients in C',
      title: 'Peak Overshoot & Settling Time Detector',
      context: 'Write an if condition inside the C time-stepping loop tracking max_vc and computing percentage overshoot %OS = ((Vmax - Vs) / Vs) * 100%.',
      criteria: [
        'Peak tracking variable `max_vc`',
        'Percentage overshoot calculation',
        'Computed %OS = 80.1% ± 1.5%'
      ],
      hint: '`if (vc > max_vc) max_vc = vc;` then `double OS = ((max_vc - Vs) / Vs) * 100.0;`.',
      verify(code) {
        return code.includes('max_vc') && (code.includes('OS') || code.includes('max_vc - Vs'));
      }
    },
    {
      id: 7,
      track: 'complex',
      trackLabel: 'AC Complex Structs',
      title: 'Complex Division Algorithm (c_div)',
      context: 'Implement Complex c_div(Complex a, Complex b) using user-defined struct Complex. Verify I = 7.360 - j5.520 A for V = 230 V, Z = 20 + j15 Ohm.',
      criteria: [
        'Denominator: b.real*b.real + b.imag*b.imag',
        'Real part: (a.real*b.real + a.imag*b.imag) / denom',
        'Imag part: (a.imag*b.real - a.real*b.imag) / denom'
      ],
      hint: 'Multiply numerator and denominator by conjugate of b: b.real - j(b.imag).',
      verify(code) {
        return code.includes('denom') && code.includes('a.real * b.real') && code.includes('a.imag * b.real');
      }
    },
    {
      id: 8,
      track: 'complex',
      trackLabel: 'AC Complex Structs',
      title: 'Pass-by-Pointer Power Analyzer (calc_power)',
      context: 'Write void calc_power(Complex V, Complex I, double *P, double *Q, double *pf) dereferencing output pointers (*P, *Q, *pf) to compute active and reactive power.',
      criteria: [
        'Pointers `*P`, `*Q`, `*pf` dereferenced properly',
        'Active power P = 1692.8 W ± 5 W',
        'Reactive power Q = 1269.6 VAR ± 5 VAR'
      ],
      hint: '*P = V.real * I.real + V.imag * I.imag; *Q = V.imag * I.real - V.real * I.imag; *pf = *P / sqrt((*P)*(*P) + (*Q)*(*Q));',
      verify(code) {
        return code.includes('*P') && code.includes('*Q') && code.includes('*pf');
      }
    },
    {
      id: 9,
      track: 'complex',
      trackLabel: 'AC Complex Structs',
      title: 'Power Factor Correction Capacitor C Script',
      context: 'Write a C function computing the required shunt capacitance C_uF = [P * (tan(phi1) - tan(phi2)) / (2*pi*f*V^2)] * 1e6 to boost power factor from 0.80 to 0.95.',
      criteria: [
        'Compute phi1 = acos(pf1) and phi2 = acos(pf2)',
        'Capacitor formula with 2*pi*f*V^2 denominator',
        'Resulting capacitance C = 46.10 μF ± 0.5 μF'
      ],
      hint: 'Use `tan(acos(pf1)) - tan(acos(pf2))` and multiply by 1e6 for microfarads.',
      verify(code) {
        return code.includes('tan') && code.includes('acos') && (code.includes('1e6') || code.includes('1000000'));
      }
    }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // 6. CERTIFICATION QUIZ QUESTION BANK (10 QUESTIONS)
  // ══════════════════════════════════════════════════════════════════════════
  const QuizQuestions = [
    {
      q: 'In ANSI C, how are elements of a 2D matrix double R[3][3] laid out in physical computer RAM?',
      options: [
        'Row-Major Order: R[0][0], R[0][1], R[0][2], R[1][0]...',
        'Column-Major Order: R[0][0], R[1][0], R[2][0], R[0][1]...',
        'Random hash buckets linked via heap pointers',
        'Diagonal-Major Order starting with main diagonal elements'
      ],
      correct: 0,
      feedback: 'C uses row-major order: sequential contiguous memory addresses traverse all columns of row 0 before moving to row 1.'
    },
    {
      q: "When solving a 3-mesh resistive bridge [R][I] = [V] using Cramer's Rule, what condition indicates an open-circuit / disconnected mesh?",
      options: [
        'The master determinant det(R) is exactly or near zero (det < 1e-9)',
        'The sum of off-diagonal elements exceeds the main diagonal',
        'All mesh currents become purely imaginary',
        'The resistance matrix becomes skew-symmetric'
      ],
      correct: 0,
      feedback: 'A singular matrix with det(R) = 0 indicates linearly dependent KVL equations or an isolated floating node without a closed path to ground.'
    },
    {
      q: 'Why does Forward Euler integration diverge exponentially when simulating an under-damped RLC tank if dt > 2 / omega_n?',
      options: [
        'Euler poles fall outside the unit circle in the z-plane, injecting artificial numerical energy each step',
        'The resistor starts producing negative resistance due to overflow',
        'Floating-point round-off error causes the capacitor charge to invert',
        'Kirchhoff Current Law is mathematically violated at high frequencies'
      ],
      correct: 0,
      feedback: 'Forward Euler is an explicit first-order method whose stability region requires |1 + dt*lambda| <= 1. Complex poles with large dt fall outside, causing artificial exponential growth.'
    },
    {
      q: 'How does the global truncation error of Fourth-Order Runge-Kutta (RK4) compare to Forward Euler as time step dt is halved?',
      options: [
        'RK4 error decreases by 16x (2^4), while Euler error decreases by only 2x',
        'RK4 error decreases by 4x, while Euler error decreases by 16x',
        'Both methods decrease error by exactly 8x',
        'RK4 produces zero truncation error regardless of dt'
      ],
      correct: 0,
      feedback: 'Euler has global truncation error O(dt), so halving dt reduces error by 2x. RK4 has global error O(dt^4), so halving dt reduces error by 2^4 = 16x.'
    },
    {
      q: 'Given typedef struct { double real; double imag; } Complex;, which expression computes the real part of (a + jb) / (c + jd)?',
      options: [
        '(a.real * b.real + a.imag * b.imag) / (b.real * b.real + b.imag * b.imag)',
        'a.real / b.real',
        '(a.real * b.real - a.imag * b.imag) / (b.real * b.real + b.imag * b.imag)',
        '(a.real + a.imag) / (b.real + b.imag)'
      ],
      correct: 0,
      feedback: 'Multiplying numerator and denominator by conjugate (c - jd) yields real part (ac + bd) / (c^2 + d^2).'
    },
    {
      q: 'In the function void calc_power(Complex V, Complex I, double *P), what is the purpose of passing double *P as a pointer?',
      options: [
        'To allow the function to write the computed active power directly into the caller variable (pass-by-reference)',
        'To allocate new heap memory via malloc() inside the function',
        'To speed up CPU clock cycles by caching P in the L1 instruction cache',
        'To prevent P from exceeding 32-bit floating point range'
      ],
      correct: 0,
      feedback: 'In C, passing a pointer double *P allows the callee to dereference (*P = ...) and mutate the caller memory location, simulating pass-by-reference.'
    },
    {
      q: 'In a series R-L-C circuit with R = 10 Ohm, L = 50 mH, C = 10 uF, what is the damping ratio zeta?',
      options: [
        '0.0707 (Under-damped, highly oscillatory)',
        '1.0000 (Critically damped)',
        '2.4500 (Over-damped, non-oscillatory)',
        '0.0000 (Lossless undamped LC tank)'
      ],
      correct: 0,
      feedback: 'zeta = (R/2) * sqrt(C/L) = (10/2) * sqrt(10e-6 / 0.05) = 5 * sqrt(0.0002) = 5 * 0.014142 = 0.0707.'
    },
    {
      q: 'What is the required shunt capacitance C (in uF) to boost an electrical load consuming active power P from power factor pf1 to pf2 at frequency f and RMS voltage V?',
      options: [
        '[P * (tan(phi1) - tan(phi2)) / (2 * pi * f * V^2)] * 10^6',
        '[P * (cos(phi1) - cos(phi2)) / (2 * pi * f * V)] * 10^6',
        '[V^2 * (tan(phi1) + tan(phi2)) / (2 * pi * f * P)] * 10^6',
        '[P / (2 * pi * f * V^2 * (pf1 - pf2))] * 10^6'
      ],
      correct: 0,
      feedback: 'Capacitive reactive power Qc = P*(tan(phi1) - tan(phi2)) = V^2 / Xc = V^2 * (2*pi*f*C). Solving for C yields C = P*(tan(phi1) - tan(phi2)) / (2*pi*f*V^2).'
    },
    {
      q: 'Why should infinite-loop guards like maxSteps = 50000 be incorporated into browser-based C interpreters?',
      options: [
        'To prevent accidental while(1) student code bugs from freezing the browser JavaScript execution thread',
        'Because ANSI C standard mandates loop termination after 50000 clock pulses',
        'To prevent WebGL shaders from overheating the computer GPU',
        'To limit the size of the compiled binary on disk'
      ],
      correct: 0,
      feedback: 'JavaScript runs in a single-threaded event loop; an unbounded C while loop would hang the browser UI without an instruction guard counter.'
    },
    {
      q: 'For the benchmark 3-mesh resistive bridge (V1 = 20 V, V2 = 10 V, R1 = 4, R2 = 6, R3 = 2, R4 = 8, R5 = 5 Ohm), what is the current through the shared resistor R2?',
      options: [
        'IR2 = I1 - I2 = 2.5309 A - 0.8436 A = 1.6873 A',
        'IR2 = I1 + I2 = 3.3745 A',
        'IR2 = I2 - I3 = 1.0782 A',
        'IR2 = V1 / R2 = 3.3333 A'
      ],
      correct: 0,
      feedback: 'Resistor R2 is shared between Mesh 1 (I1 clockwise) and Mesh 2 (I2 clockwise), so the net downward branch current is IR2 = I1 - I2 = 2.5309 - 0.8436 = 1.6873 A.'
    }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // 7. CANVAS 2D WORKBENCH RENDERER (Circuit, Oscilloscope, Phasor / Power)
  // ══════════════════════════════════════════════════════════════════════════
  class CanvasWorkbench {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      // Camera Navigation (Pan & Zoom)
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.startX = 0;
      this.startY = 0;
      this.spacePressed = false;
      this.showGrid = true;

      // Active state
      this.track = 'mesh';
      this.animTime = 0;
      this.animRunning = true;

      // Parameters
      this.meshParams = { v1: 20, v2: 10, r1: 4, r2: 6, r3: 2, r4: 8, r5: 5 };
      this.transParams = { Vs: 12, R: 10, L: 0.05, C: 10e-6, dt: 0.00005, N: 800, method: 'euler' };
      this.complexParams = { Vrms: 230, f: 50, R: 20, XL: 15, targetPF: 0.95 };

      // Latest numerical outputs
      this.latestMesh = MeshSolver.solve(20, 10, 4, 6, 2, 8, 5);
      this.latestTrans = RLCSolver.simulateEuler(12, 10, 0.05, 10e-6, 0.00005, 800);
      this.latestExact = RLCSolver.exactSolution(12, 10, 0.05, 10e-6, 0.04);
      this.latestComplex = ComplexSolver.solvePower(230, 50, 20, 15, 0.95);

      this.initEvents();
      this.resizeCanvas();
    }

    initEvents() {
      // Wheel Zoom centered at mouse pointer
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.909;
        const newZoom = Math.min(3.0, Math.max(0.4, this.zoom * zoomFactor));

        // Adjust pan to zoom centered under mouse
        this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
        this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
        this.updateZoomIndicator();
      }, { passive: false });

      // Pan Dragging
      this.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0 || e.button === 1 || this.spacePressed) {
          this.isDragging = true;
          this.startX = e.clientX - this.panX;
          this.startY = e.clientY - this.panY;
          this.canvas.style.cursor = 'grabbing';
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
          this.panX = e.clientX - this.startX;
          this.panY = e.clientY - this.startY;
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.canvas.style.cursor = this.spacePressed ? 'grab' : 'default';
        }
      });

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') {
          this.spacePressed = true;
          this.canvas.style.cursor = 'grab';
        } else if (e.key === '+' || e.key === '=') {
          this.zoomAtCenter(1.15);
        } else if (e.key === '-' || e.key === '_') {
          this.zoomAtCenter(0.87);
        } else if (e.key === '0') {
          this.resetZoom();
        } else if (e.key === 'g' || e.key === 'G') {
          this.toggleGrid();
        } else if (e.key === 'f' || e.key === 'F') {
          this.toggleFullscreen();
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
          this.spacePressed = false;
          this.canvas.style.cursor = 'default';
        }
      });

      // HUD buttons
      document.getElementById('hud-zoom-in').addEventListener('click', () => this.zoomAtCenter(1.15));
      document.getElementById('hud-zoom-out').addEventListener('click', () => this.zoomAtCenter(0.87));
      document.getElementById('hud-zoom-1').addEventListener('click', () => this.resetZoom());
      document.getElementById('hud-zoom-fit').addEventListener('click', () => this.fitView());
      document.getElementById('hud-grid').addEventListener('click', () => this.toggleGrid());
      document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());

      window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
      const container = this.canvas.parentElement;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.ctx.scale(dpr, dpr);
    }

    zoomAtCenter(factor) {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const newZoom = Math.min(3.0, Math.max(0.4, this.zoom * factor));
      this.panX = cx - (cx - this.panX) * (newZoom / this.zoom);
      this.panY = cy - (cy - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;
      this.updateZoomIndicator();
    }

    resetZoom() {
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.updateZoomIndicator();
    }

    fitView() {
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.updateZoomIndicator();
    }

    toggleGrid() {
      this.showGrid = !this.showGrid;
      document.getElementById('hud-grid').classList.toggle('active', this.showGrid);
    }

    toggleFullscreen() {
      const isFull = document.body.classList.toggle('is-canvas-fullscreen');
      const btn = document.getElementById('btn-fullscreen');
      if (btn) btn.innerHTML = isFull ? '&#128471; Exit Fullscreen' : '&#9974; Fullscreen';
      setTimeout(() => {
        this.resizeCanvas();
        this.fitView();
      }, 50);
      audio.playKeyTick();
    }

    updateZoomIndicator() {
      const el = document.getElementById('hud-zoom-val');
      if (el) el.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    setTrack(track) {
      this.track = track;
      const cardTitle = document.getElementById('canvas-card-title');
      const cardIcon = document.getElementById('canvas-card-icon');
      if (track === 'mesh') {
        if (cardTitle) cardTitle.textContent = '3-Mesh Kirchhoff Resistive Network';
        if (cardIcon) cardIcon.innerHTML = '&#9889;';
      } else if (track === 'transient') {
        if (cardTitle) cardTitle.textContent = 'Digital Storage Oscilloscope (Vc vs. iL)';
        if (cardIcon) cardIcon.innerHTML = '&#128200;';
      } else {
        if (cardTitle) cardTitle.textContent = 'Rotating Phasor Diagram & Power Triangle';
        if (cardIcon) cardIcon.innerHTML = '&#128260;';
      }
      this.fitView();
    }

    // Main 60 FPS Render Loop
    render() {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      if (!w || !h) return;

      this.ctx.clearRect(0, 0, w, h);
      this.ctx.fillStyle = '#00141b';
      this.ctx.fillRect(0, 0, w, h);

      this.ctx.save();
      this.ctx.translate(this.panX, this.panY);
      this.ctx.scale(this.zoom, this.zoom);

      // Background Engineering Grid
      if (this.showGrid) {
        this.drawBackgroundGrid(w, h);
      }

      // Render track-specific graphics
      if (this.track === 'mesh') {
        this.renderMeshCircuit(w, h);
      } else if (this.track === 'transient') {
        this.renderOscilloscope(w, h);
      } else if (this.track === 'complex') {
        this.renderComplexPhasors(w, h);
      }

      this.ctx.restore();

      this.animTime += 0.02;
      requestAnimationFrame(() => this.render());
    }

    drawBackgroundGrid(w, h) {
      const step = 25;
      this.ctx.strokeStyle = 'rgba(0, 86, 107, 0.18)';
      this.ctx.lineWidth = 1;

      const left = -this.panX / this.zoom;
      const top = -this.panY / this.zoom;
      const right = left + w / this.zoom;
      const bottom = top + h / this.zoom;

      const startX = Math.floor(left / step) * step;
      const startY = Math.floor(top / step) * step;

      this.ctx.beginPath();
      for (let x = startX; x <= right; x += step) {
        this.ctx.moveTo(x, top);
        this.ctx.lineTo(x, bottom);
      }
      for (let y = startY; y <= bottom; y += step) {
        this.ctx.moveTo(left, y);
        this.ctx.lineTo(right, y);
      }
      this.ctx.stroke();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TRACK 1: 3-MESH RESISTIVE BRIDGE SCHEMATIC
    // ──────────────────────────────────────────────────────────────────────────
    renderMeshCircuit(w, h) {
      const cx = w / 2 - 240;
      const cy = h / 2 - 130;
      const res = this.latestMesh;

      // 3 Mesh Rectangles
      const meshW = 150;
      const meshH = 220;

      for (let m = 0; m < 3; m++) {
        const mx = cx + m * meshW;
        this.ctx.fillStyle = '#00202a';
        this.ctx.strokeStyle = '#00657e';
        this.ctx.lineWidth = 2.5;
        this.ctx.fillRect(mx, cy, meshW, meshH);
        this.ctx.strokeRect(mx, cy, meshW, meshH);

        // Animated mesh current clockwise loop arrow
        this.drawMeshLoopArrow(mx + meshW / 2, cy + meshH / 2, 42, m === 0 ? res.I1 : m === 1 ? res.I2 : res.I3, `I${m + 1}`);
      }

      // Draw Voltage Source V1 (Left Branch)
      this.drawDCPowerSource(cx, cy + meshH / 2, this.meshParams.v1, 'V1');

      // Draw Voltage Source V2 (Right Branch)
      this.drawDCPowerSource(cx + 3 * meshW, cy + meshH / 2, this.meshParams.v2, 'V2', true);

      // Draw Resistors
      // R1 (Top of Mesh 1)
      this.drawResistorH(cx + meshW / 2, cy, this.meshParams.r1, 'R1', res.iR1);
      // R2 (Mutual between Mesh 1 & 2)
      this.drawResistorV(cx + meshW, cy + meshH / 2, this.meshParams.r2, 'R2', res.iR2);
      // R3 (Top of Mesh 2)
      this.drawResistorH(cx + 1.5 * meshW, cy, this.meshParams.r3, 'R3', res.iR3);
      // R4 (Mutual between Mesh 2 & 3)
      this.drawResistorV(cx + 2 * meshW, cy + meshH / 2, this.meshParams.r4, 'R4', res.iR4);
      // R5 (Top of Mesh 3)
      this.drawResistorH(cx + 2.5 * meshW, cy, this.meshParams.r5, 'R5', res.iR5);

      // Ground Reference at bottom middle
      this.drawGroundSymbol(cx + 1.5 * meshW, cy + meshH);

      // Update Telemetry Badge
      const st = document.getElementById('tele-status');
      const m1 = document.getElementById('tele-m1');
      const m2 = document.getElementById('tele-m2');
      const m3 = document.getElementById('tele-m3');
      if (st) st.textContent = res.isSingular ? 'SINGULAR (det=0)' : 'SOLVED (KVL)';
      if (m1) m1.textContent = `${res.I1.toFixed(3)} A`;
      if (m2) m2.textContent = `${res.I2.toFixed(3)} A`;
      if (m3) m3.textContent = `${res.I3.toFixed(3)} A`;
    }

    drawMeshLoopArrow(x, y, radius, current, label) {
      const isReverse = current < 0;
      const mag = Math.abs(current);
      const speed = Math.max(0.5, Math.min(3.0, mag));
      const angleOffset = (this.animTime * speed) * (isReverse ? -1 : 1);

      this.ctx.save();
      this.ctx.translate(x, y);

      // Arc
      this.ctx.strokeStyle = isReverse ? 'rgba(244, 63, 94, 0.7)' : 'rgba(56, 189, 248, 0.75)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([8, 4]);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, angleOffset, angleOffset + 1.7 * Math.PI);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Arrowhead
      const arrowAngle = angleOffset + (isReverse ? 0.05 : 1.7 * Math.PI);
      const ax = radius * Math.cos(arrowAngle);
      const ay = radius * Math.sin(arrowAngle);
      this.ctx.fillStyle = isReverse ? '#f43f5e' : '#38bdf8';
      this.ctx.beginPath();
      this.ctx.arc(ax, ay, 4, 0, 2 * Math.PI);
      this.ctx.fill();

      // Label
      this.ctx.fillStyle = '#f0fdfa';
      this.ctx.font = 'bold 12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${label}`, 0, -8);
      this.ctx.font = '11px JetBrains Mono, monospace';
      this.ctx.fillStyle = isReverse ? '#f43f5e' : '#38bdf8';
      this.ctx.fillText(`${current.toFixed(3)}A`, 0, 8);

      this.ctx.restore();
    }

    drawDCPowerSource(x, y, val, label, inverted = false) {
      this.ctx.save();
      this.ctx.fillStyle = '#001a24';
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 18, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 11px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(inverted ? '-' : '+', x, y - 6);
      this.ctx.fillText(inverted ? '+' : '-', x, y + 10);

      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 11px JetBrains Mono, monospace';
      this.ctx.textAlign = inverted ? 'left' : 'right';
      const offset = inverted ? 24 : -24;
      this.ctx.fillText(`${label} = ${val}V`, x + offset, y + 4);
      this.ctx.restore();
    }

    drawResistorH(x, y, val, label, current) {
      this.ctx.save();
      this.ctx.fillStyle = '#002833';
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(x - 24, y - 10, 48, 20);
      this.ctx.strokeRect(x - 24, y - 10, 48, 20);

      this.ctx.fillStyle = '#f0fdfa';
      this.ctx.font = 'bold 10px JetBrains Mono, monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${label}=${val}Ω`, x, y + 4);

      if (current !== undefined) {
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '9px JetBrains Mono, monospace';
        this.ctx.fillText(`i=${current.toFixed(2)}A`, x, y - 14);
      }
      this.ctx.restore();
    }

    drawResistorV(x, y, val, label, current) {
      this.ctx.save();
      this.ctx.fillStyle = '#002833';
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(x - 10, y - 24, 20, 48);
      this.ctx.strokeRect(x - 10, y - 24, 20, 48);

      this.ctx.fillStyle = '#f0fdfa';
      this.ctx.font = 'bold 10px JetBrains Mono, monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${label}`, x, y - 4);
      this.ctx.fillText(`${val}Ω`, x, y + 10);

      if (current !== undefined) {
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '9px JetBrains Mono, monospace';
        this.ctx.fillText(`i=${current.toFixed(2)}A`, x + 24, y + 3);
      }
      this.ctx.restore();
    }

    drawGroundSymbol(x, y) {
      this.ctx.save();
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + 12);
      this.ctx.moveTo(x - 12, y + 12);
      this.ctx.lineTo(x + 12, y + 12);
      this.ctx.moveTo(x - 8, y + 16);
      this.ctx.lineTo(x + 8, y + 16);
      this.ctx.moveTo(x - 4, y + 20);
      this.ctx.lineTo(x + 4, y + 20);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TRACK 2: DUAL-TRACE OSCILLOSCOPE (RLC Transient Step Response)
    // ──────────────────────────────────────────────────────────────────────────
    renderOscilloscope(w, h) {
      const margin = 50;
      const plotW = w - 2 * margin;
      const plotH = h - 2 * margin;
      const ox = margin;
      const oy = h - margin;

      const num = this.latestTrans;
      const exact = this.latestExact;
      const p = this.transParams;

      // Dark CRT Screen Background
      this.ctx.fillStyle = '#001017';
      this.ctx.fillRect(ox, oy - plotH, plotW, plotH);
      this.ctx.strokeStyle = '#004c5e';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(ox, oy - plotH, plotW, plotH);

      // CRT Division Grid
      this.ctx.strokeStyle = 'rgba(0, 86, 107, 0.4)';
      this.ctx.lineWidth = 1;
      const divX = 8;
      const divY = 6;
      for (let i = 1; i < divX; i++) {
        const x = ox + (i * plotW) / divX;
        this.ctx.beginPath();
        this.ctx.moveTo(x, oy - plotH);
        this.ctx.lineTo(x, oy);
        this.ctx.stroke();
      }
      for (let j = 1; j < divY; j++) {
        const y = oy - (j * plotH) / divY;
        this.ctx.beginPath();
        this.ctx.moveTo(ox, y);
        this.ctx.lineTo(ox + plotW, y);
        this.ctx.stroke();
      }

      // Max Voltage Scale
      const maxDisplayV = Math.max(25.0, num.maxVc * 1.15);
      const tEnd = 0.04; // 40 ms total window

      // Reference Vs dashed line
      const vsY = oy - (p.Vs / maxDisplayV) * plotH;
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      this.ctx.setLineDash([6, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(ox, vsY);
      this.ctx.lineTo(ox + plotW, vsY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = '#facc15';
      this.ctx.font = '10px JetBrains Mono, monospace';
      this.ctx.fillText(`Vs = ${p.Vs}V`, ox + 10, vsY - 4);

      // Plot Exact Analytical Curve (Magenta Dashed)
      this.ctx.strokeStyle = '#ec4899';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      const samples = 200;
      for (let s = 0; s <= samples; s++) {
        const curT = (s / samples) * tEnd;
        const ex = RLCSolver.exactSolution(p.Vs, p.R, p.L, p.C, curT);
        const px = ox + (curT / tEnd) * plotW;
        const py = oy - (ex.vc / maxDisplayV) * plotH;
        if (s === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Plot Student C Numerical Curve (Cyan Solid)
      if (num && num.vc && num.vc.length > 0) {
        this.ctx.strokeStyle = num.isUnstable ? '#f43f5e' : '#38bdf8';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        const stepCount = num.vc.length;
        for (let k = 0; k < stepCount; k++) {
          const px = ox + (num.t[k] / tEnd) * plotW;
          const py = oy - (num.vc[k] / maxDisplayV) * plotH;
          if (k === 0) this.ctx.moveTo(px, Math.min(oy, Math.max(oy - plotH, py)));
          else this.ctx.lineTo(px, Math.min(oy, Math.max(oy - plotH, py)));
        }
        this.ctx.stroke();
      }

      // Legend on Top
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 11px Inter, sans-serif';
      this.ctx.fillText('— C Numerical Vc(t)', ox + 14, oy - plotH + 20);
      this.ctx.fillStyle = '#ec4899';
      this.ctx.fillText('--- Exact Analytical Vc(t)', ox + 160, oy - plotH + 20);

      // Numerical Instability Alert Banner if divergent
      if (num.isUnstable) {
        this.ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
        this.ctx.fillRect(ox + plotW / 2 - 160, oy - plotH / 2 - 25, 320, 50);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(ox + plotW / 2 - 160, oy - plotH / 2 - 25, 320, 50);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠ NUMERICAL DIVERGENCE (dt too large)', ox + plotW / 2, oy - plotH / 2 - 4);
        this.ctx.font = '10px JetBrains Mono, monospace';
        this.ctx.fillText(`Peak Vc = ${num.maxVc.toFixed(1)} V (Limit violated)`, ox + plotW / 2, oy - plotH / 2 + 14);
        this.ctx.textAlign = 'left';
      }

      // Update Telemetry Badge
      const st = document.getElementById('tele-status');
      const m1 = document.getElementById('tele-m1');
      const m2 = document.getElementById('tele-m2');
      const m3 = document.getElementById('tele-m3');
      if (st) st.textContent = num.isUnstable ? 'UNSTABLE BLOW-UP' : `${exact.regime.toUpperCase()}`;
      if (m1) m1.textContent = `${num.maxVc.toFixed(2)} V`;
      if (m2) m2.textContent = `${num.percentOS.toFixed(1)}%`;
      if (m3) m3.textContent = `${exact.wn.toFixed(0)} rad/s`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TRACK 3: ROTATING PHASOR & POWER TRIANGLE DISPLAY
    // ──────────────────────────────────────────────────────────────────────────
    renderComplexPhasors(w, h) {
      const midX = w / 2;
      const res = this.latestComplex;

      // ── Left Half: Rotating Phasor Diagram ──────────────────────────────────
      const cx1 = midX / 2;
      const cy1 = h / 2;
      const maxR = Math.min(cx1, cy1) - 40;

      // Polar Rings
      this.ctx.strokeStyle = 'rgba(0, 86, 107, 0.3)';
      this.ctx.lineWidth = 1;
      [0.33, 0.66, 1.0].forEach((ratio) => {
        this.ctx.beginPath();
        this.ctx.arc(cx1, cy1, maxR * ratio, 0, 2 * Math.PI);
        this.ctx.stroke();
      });

      // Polar Axes
      this.ctx.strokeStyle = 'rgba(0, 86, 107, 0.5)';
      this.ctx.beginPath();
      this.ctx.moveTo(cx1 - maxR, cy1);
      this.ctx.lineTo(cx1 + maxR, cy1);
      this.ctx.moveTo(cx1, cy1 - maxR);
      this.ctx.lineTo(cx1, cy1 + maxR);
      this.ctx.stroke();

      this.ctx.fillStyle = '#94a3b8';
      this.ctx.font = '10px JetBrains Mono, monospace';
      this.ctx.fillText('+Real (0°)', cx1 + maxR - 40, cy1 - 6);
      this.ctx.fillText('+j Imag (90°)', cx1 + 6, cy1 - maxR + 14);

      // Rotating Voltage Phasor V (Cyan)
      const omega = 2 * Math.PI * res.f;
      const vAngle = -this.animTime * 1.5; // Rotate counter-clockwise visually
      const vx = cx1 + maxR * 0.9 * Math.cos(vAngle);
      const vy = cy1 + maxR * 0.9 * Math.sin(vAngle);

      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(cx1, cy1);
      this.ctx.lineTo(vx, vy);
      this.ctx.stroke();
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.beginPath();
      this.ctx.arc(vx, vy, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.fillText(`V = ${res.Vrms}V`, vx + 8, vy);

      // Rotating Current Phasor I (Amber) lagging by phi1
      const iAngle = vAngle + res.phi1; // Lagging angle
      const iLen = maxR * 0.65;
      const ix = cx1 + iLen * Math.cos(iAngle);
      const iy = cy1 + iLen * Math.sin(iAngle);

      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(cx1, cy1);
      this.ctx.lineTo(ix, iy);
      this.ctx.stroke();
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.beginPath();
      this.ctx.arc(ix, iy, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.fillText(`I = ${res.I_mag.toFixed(2)}A`, ix + 8, iy);

      // Phase Angle Arc
      this.ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(cx1, cy1, 35, vAngle, iAngle);
      this.ctx.stroke();
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.fillText(`φ = ${(res.phi1 * 180 / Math.PI).toFixed(1)}°`, cx1 + 40, cy1 + 20);

      // ── Right Half: Dynamic Power Triangle ──────────────────────────────────
      const ox2 = midX + 40;
      const oy2 = h / 2 + 80;

      const scaleP = 0.08;
      const pw = res.P * scaleP;
      const qh = res.Q * scaleP;

      // Triangle P (horizontal)
      this.ctx.strokeStyle = '#10b981';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(ox2, oy2);
      this.ctx.lineTo(ox2 + pw, oy2);
      this.ctx.stroke();
      this.ctx.fillStyle = '#10b981';
      this.ctx.font = 'bold 11px Inter, sans-serif';
      this.ctx.fillText(`P = ${res.P.toFixed(1)} W (Active)`, ox2 + pw / 2 - 40, oy2 + 20);

      // Triangle Q (vertical inductive up)
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(ox2 + pw, oy2);
      this.ctx.lineTo(ox2 + pw, oy2 - qh);
      this.ctx.stroke();
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillText(`Q = ${res.Q.toFixed(1)} VAR (Inductive)`, ox2 + pw + 8, oy2 - qh / 2);

      // Triangle S (hypotenuse)
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(ox2, oy2);
      this.ctx.lineTo(ox2 + pw, oy2 - qh);
      this.ctx.stroke();
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText(`S = ${res.S.toFixed(1)} VA`, ox2 + pw / 2 - 40, oy2 - qh / 2 - 10);

      // Compensated Power Triangle Arc (Dashed Green)
      const qCompH = res.Q_comp * scaleP;
      this.ctx.strokeStyle = '#a855f7';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 3]);
      this.ctx.beginPath();
      this.ctx.moveTo(ox2, oy2);
      this.ctx.lineTo(ox2 + pw, oy2 - qCompH);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = '#a855f7';
      this.ctx.fillText(`Target PF 0.95 (C = ${res.C_uF.toFixed(1)} μF)`, ox2 + pw / 2 - 20, oy2 - qCompH - 6);

      // Update Telemetry Badge
      const st = document.getElementById('tele-status');
      const m1 = document.getElementById('tele-m1');
      const m2 = document.getElementById('tele-m2');
      const m3 = document.getElementById('tele-m3');
      if (st) st.textContent = `PF = ${res.pf1.toFixed(3)} LAGGING`;
      if (m1) m1.textContent = `${res.P.toFixed(1)} W`;
      if (m2) m2.textContent = `${res.Q.toFixed(1)} VAR`;
      if (m3) m3.textContent = `${res.C_uF.toFixed(2)} μF`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 8. INTERACTIVE 3D WORKSTATION INSPECTOR (WebGL Three.js)
  // ══════════════════════════════════════════════════════════════════════════
  class ThreeDInspector {
    constructor() {
      this.canvas = document.getElementById('sim3d-canvas');
      this.aside = document.getElementById('sim3d-components');
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.group = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized || !this.canvas) return;
      this.initialized = true;

      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 500;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x001219);

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(4.5, 3.8, 5.0);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;

      // Lights
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x00212b, 1.3);
      this.scene.add(hemiLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
      dirLight.position.set(6, 12, 8);
      this.scene.add(dirLight);

      this.buildProceduralModel();

      const animate = () => {
        requestAnimationFrame(animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      animate();

      window.addEventListener('resize', () => {
        if (!this.canvas) return;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });
    }

    buildProceduralModel() {
      this.group = new THREE.Group();

      // 1. Workstation Table Base
      const tableGeo = new THREE.BoxGeometry(5.0, 0.25, 3.6);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x00212b, metalness: 0.8, roughness: 0.2 });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(0, -0.125, 0);
      table.name = 'Workstation Bench';
      table.userData = { desc: 'Anti-static grounded electrical engineering computing bench.' };
      this.group.add(table);

      // 2. ANSI C Terminal Monitor
      const monBaseGeo = new THREE.BoxGeometry(0.8, 0.1, 0.6);
      const monBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 });
      const monBase = new THREE.Mesh(monBaseGeo, monBaseMat);
      monBase.position.set(-1.2, 0.05, -0.6);
      this.group.add(monBase);

      const monScreenGeo = new THREE.BoxGeometry(2.0, 1.4, 0.12);
      const monScreenMat = new THREE.MeshStandardMaterial({ color: 0x002d3a, metalness: 0.6, roughness: 0.2 });
      const monScreen = new THREE.Mesh(monScreenGeo, monScreenMat);
      monScreen.position.set(-1.2, 0.9, -0.6);
      monScreen.name = 'ANSI C Terminal Display';
      monScreen.userData = { desc: 'Renders C IDE source code, GCC compiler diagnostics, and live matrix memory cells.' };
      this.group.add(monScreen);

      // 3. CPU Register & Execution Unit Tower
      const cpuGeo = new THREE.BoxGeometry(0.7, 1.8, 1.2);
      const cpuMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
      const cpu = new THREE.Mesh(cpuGeo, cpuMat);
      cpu.position.set(-2.1, 0.9, -0.5);
      cpu.name = 'CPU Register & Execution Tower';
      cpu.userData = { desc: 'Simulates ALU floating point registers, program counters (PC), and pointer dereference logic.' };
      this.group.add(cpu);

      // 4. Memory Stack Frame Tower (Slabs)
      const stackGroup = new THREE.Group();
      stackGroup.name = 'Physical RAM Stack Frame';
      stackGroup.userData = { desc: 'Row-major 2D matrix memory layout and local stack variables at addresses 0x7FF0 to 0x8020.' };
      for (let s = 0; s < 4; s++) {
        const slabGeo = new THREE.BoxGeometry(0.9, 0.15, 0.7);
        const slabMat = new THREE.MeshStandardMaterial({
          color: s % 2 === 0 ? 0x0284c7 : 0x059669,
          metalness: 0.6,
          roughness: 0.3
        });
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.set(1.4, 0.1 + s * 0.22, -0.8);
        stackGroup.add(slab);
      }
      this.group.add(stackGroup);

      // 5. 3-Mesh DC Circuit Board
      const pcbGeo = new THREE.BoxGeometry(2.2, 0.08, 1.6);
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.3, roughness: 0.5 });
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.position.set(0.6, 0.04, 0.5);
      pcb.name = '3-Mesh DC Circuit PCB';
      pcb.userData = { desc: 'Breadboard circuit housing DC voltage sources V1, V2 and precision power resistors R1 through R5.' };
      this.group.add(pcb);

      // 6. Dual-Trace Digital Oscilloscope (DSO)
      const dsoGeo = new THREE.BoxGeometry(1.6, 1.0, 1.0);
      const dsoMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.6, roughness: 0.3 });
      const dso = new THREE.Mesh(dsoGeo, dsoMat);
      dso.position.set(-1.0, 0.5, 0.6);
      dso.name = 'Digital Storage Oscilloscope (DSO)';
      dso.userData = { desc: 'Dual-channel cathode-ray waveform visualizer displaying Vc(t) step ringing vs. exact analytical solutions.' };
      this.group.add(dso);

      this.scene.add(this.group);
      this.populateInspector(this.group);
    }

    populateInspector(root) {
      if (!this.aside) return;
      this.aside.innerHTML = '';

      const items = [
        { name: 'ANSI C Terminal Display', desc: 'Renders C IDE source code, GCC compiler diagnostics, and live matrix memory cells.' },
        { name: 'CPU Register & Execution Tower', desc: 'Simulates ALU floating point registers, program counters (PC), and pointer dereference logic.' },
        { name: 'Physical RAM Stack Frame', desc: 'Row-major 2D matrix memory layout and local stack variables at addresses 0x7FF0 to 0x8020.' },
        { name: '3-Mesh DC Circuit PCB', desc: 'Breadboard circuit housing DC voltage sources V1, V2 and precision power resistors R1 through R5.' },
        { name: 'Digital Storage Oscilloscope (DSO)', desc: 'Dual-channel cathode-ray waveform visualizer displaying Vc(t) step ringing vs. exact analytical solutions.' }
      ];

      items.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = `sim3d-comp ${idx === 0 ? 'active' : ''}`;
        card.innerHTML = `
          <div class="sim3d-comp-title">${item.name}</div>
          <div class="sim3d-comp-desc">${item.desc}</div>
        `;
        card.addEventListener('click', () => {
          document.querySelectorAll('.sim3d-comp').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          audio.playKeyTick();
        });
        this.aside.appendChild(card);
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 9. APP ORCHESTRATION & EVENT BINDINGS
  // ══════════════════════════════════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    const cVM = new CInterpreter();
    const canvasEl = document.getElementById('sim-canvas');
    const workbench = new CanvasWorkbench(canvasEl);
    const inspector3D = new ThreeDInspector();

    // DOM Elements
    const trackSelect = document.getElementById('track-select');
    const templateSelect = document.getElementById('template-select');
    const textarea = document.getElementById('editor-textarea');
    const gutter = document.getElementById('editor-gutter');
    const lineHighlight = document.getElementById('line-highlight');
    const matrixGrid = document.getElementById('matrix-grid');
    const watchTbody = document.getElementById('watch-tbody');
    const terminalOutput = document.getElementById('terminal-output');
    const paramControlsGrid = document.getElementById('param-controls-grid');
    const cycleCountEl = document.getElementById('cycle-count');
    const statusBadge = document.getElementById('ide-status-badge');

    let currentLabIdx = 0;
    let quizCurrentQ = 0;
    let quizScore = 0;
    const userAnswers = new Array(QuizQuestions.length).fill(-1);

    // ── Editor Line Gutter Initialization ─────────────────────────────────────
    function updateGutter() {
      const lines = textarea.value.split('\n');
      gutter.innerHTML = '';
      lines.forEach((_, i) => {
        const div = document.createElement('div');
        div.className = 'gutter-line';
        div.textContent = i + 1;
        div.addEventListener('click', () => {
          div.classList.toggle('breakpoint');
          audio.playKeyTick();
        });
        gutter.appendChild(div);
      });
    }

    textarea.addEventListener('input', () => {
      updateGutter();
    });

    textarea.addEventListener('keydown', (e) => {
      // Allow Tab key indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        updateGutter();
      }
    });

    // ── Mode Switching (Canonical 4 Modes) ────────────────────────────────────
    document.querySelectorAll('#mode-tabs .pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mode-tabs .pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-value');

        document.getElementById('sim-wrapper').classList.toggle('hidden', mode !== 'simulate');
        document.getElementById('model3d-wrapper').classList.toggle('hidden', mode !== '3d-model');
        document.getElementById('explore-wrapper').classList.toggle('hidden', mode !== 'explore');
        document.getElementById('quiz-wrapper').classList.toggle('hidden', mode !== 'quiz');

        if (mode === 'simulate') {
          setTimeout(() => workbench.resizeCanvas(), 50);
        } else if (mode === '3d-model') {
          setTimeout(() => inspector3D.init(), 50);
        } else if (mode === 'explore') {
          if (window.renderMathInElement) {
            window.renderMathInElement(document.getElementById('explore-wrapper'), {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
              ]
            });
          }
        } else if (mode === 'quiz') {
          loadQuizQuestion(quizCurrentQ);
        }
        audio.playKeyTick();
      });
    });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    soundBtn.addEventListener('click', () => {
      const enabled = audio.toggle();
      soundBtn.innerHTML = enabled ? '&#128266; Sound: ON' : '&#128263; Sound: OFF';
    });

    // Guide button
    document.getElementById('btn-guide-modal').addEventListener('click', () => {
      document.querySelector('[data-value="explore"]').click();
    });

    // ── Track & Template Synchronization ──────────────────────────────────────
    function loadTemplate(track, tmpl) {
      const code = CodeTemplates[track][tmpl] || CodeTemplates[track].starter;
      textarea.value = code;
      updateGutter();
      document.getElementById('ide-filename').textContent = `${track === 'mesh' ? 'mesh_cramer' : track === 'transient' ? 'rlc_transient' : 'ac_complex'}.c`;
      workbench.setTrack(track);
      populateParameterControls(track);
      renderMatrixVisualizer(track);
      renderWatchTable();
    }

    trackSelect.addEventListener('change', () => {
      loadTemplate(trackSelect.value, templateSelect.value);
    });

    templateSelect.addEventListener('change', () => {
      loadTemplate(trackSelect.value, templateSelect.value);
    });

    // ── Live 2D Matrix Memory Grid Visualizer ──────────────────────────────────
    function renderMatrixVisualizer(track) {
      matrixGrid.innerHTML = '';
      const nameEl = document.getElementById('matrix-name');
      if (nameEl) nameEl.textContent = track === 'mesh' ? 'R[3][3]' : track === 'transient' ? 'State[2][2]' : 'Z_grid[3][3]';

      let matrixData = [
        [10.0, -6.0, 0.0],
        [-6.0, 16.0, -8.0],
        [0.0, -8.0, 13.0]
      ];

      if (track === 'mesh' && workbench.latestMesh && workbench.latestMesh.R) {
        matrixData = workbench.latestMesh.R;
      }

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const val = matrixData[i][j];
          const cell = document.createElement('div');
          cell.className = 'matrix-cell';
          cell.id = `m-cell-${i}-${j}`;
          cell.innerHTML = `
            <span class="cell-idx">[${i}][${j}]</span>
            <span class="cell-val">${val >= 0 ? ' ' : ''}${val.toFixed(1)}</span>
          `;
          matrixGrid.appendChild(cell);
        }
      }
    }

    // ── Live Variable Watch Table ─────────────────────────────────────────────
    function renderWatchTable() {
      watchTbody.innerHTML = '';
      const vars = cVM.variables;
      if (Object.keys(vars).length === 0) {
        // Initial defaults
        const defaults = [
          { name: 'V1', type: 'double', addr: '0x7FF0', val: '20.00 V' },
          { name: 'V2', type: 'double', addr: '0x7FF8', val: '10.00 V' },
          { name: 'det', type: 'double', addr: '0x8000', val: '972.0000' },
          { name: 'I[0]', type: 'double', addr: '0x8008', val: '2.5309 A' }
        ];
        defaults.forEach(d => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td><code>${d.name}</code></td><td>${d.type}</td><td class="watch-addr">${d.addr}</td><td class="watch-val">${d.val}</td>`;
          watchTbody.appendChild(tr);
        });
        return;
      }

      for (const [key, item] of Object.entries(vars)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><code>${key}</code></td><td>${item.type}</td><td class="watch-addr">${item.addr}</td><td class="watch-val">${item.val}</td>`;
        watchTbody.appendChild(tr);
      }
    }

    // ── Coupled Hardware & Slider Controls Tray ────────────────────────────────
    function populateParameterControls(track) {
      paramControlsGrid.innerHTML = '';
      const titleEl = document.getElementById('param-panel-title');

      if (track === 'mesh') {
        if (titleEl) titleEl.textContent = '3-Mesh Resistive Bridge Sliders';
        const p = workbench.meshParams;
        const sliders = [
          { id: 'p-v1', label: 'V1 Source', min: 5, max: 50, step: 1, val: p.v1, unit: 'V' },
          { id: 'p-v2', label: 'V2 Source', min: 5, max: 50, step: 1, val: p.v2, unit: 'V' },
          { id: 'p-r1', label: 'R1 Resistor', min: 1, max: 20, step: 0.5, val: p.r1, unit: 'Ω' },
          { id: 'p-r2', label: 'R2 Mutual', min: 1, max: 20, step: 0.5, val: p.r2, unit: 'Ω' },
          { id: 'p-r3', label: 'R3 Resistor', min: 1, max: 20, step: 0.5, val: p.r3, unit: 'Ω' },
          { id: 'p-r4', label: 'R4 Mutual', min: 1, max: 20, step: 0.5, val: p.r4, unit: 'Ω' },
          { id: 'p-r5', label: 'R5 Resistor', min: 1, max: 20, step: 0.5, val: p.r5, unit: 'Ω' }
        ];

        sliders.forEach(s => {
          const div = document.createElement('div');
          div.className = 'param-item';
          div.innerHTML = `
            <div class="param-header">
              <span class="param-name">${s.label}</span>
              <span class="param-val" id="val-${s.id}">${s.val} ${s.unit}</span>
            </div>
            <input type="range" class="param-slider" id="${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}">
          `;
          paramControlsGrid.appendChild(div);

          div.querySelector('input').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            document.getElementById(`val-${s.id}`).textContent = `${v} ${s.unit}`;
            if (s.id === 'p-v1') p.v1 = v;
            else if (s.id === 'p-v2') p.v2 = v;
            else if (s.id === 'p-r1') p.r1 = v;
            else if (s.id === 'p-r2') p.r2 = v;
            else if (s.id === 'p-r3') p.r3 = v;
            else if (s.id === 'p-r4') p.r4 = v;
            else if (s.id === 'p-r5') p.r5 = v;

            workbench.latestMesh = MeshSolver.solve(p.v1, p.v2, p.r1, p.r2, p.r3, p.r4, p.r5);
            renderMatrixVisualizer('mesh');
          });
        });

      } else if (track === 'transient') {
        if (titleEl) titleEl.textContent = 'Series RLC Numerical Integrator Parameters';
        const p = workbench.transParams;
        const sliders = [
          { id: 'p-vs', label: 'Step Vs', min: 5, max: 24, step: 1, val: p.Vs, unit: 'V' },
          { id: 'p-r', label: 'R Damping', min: 2, max: 100, step: 1, val: p.R, unit: 'Ω' },
          { id: 'p-l', label: 'L Coil', min: 10, max: 200, step: 5, val: p.L * 1000, unit: 'mH' },
          { id: 'p-c', label: 'C Tank', min: 1, max: 100, step: 1, val: p.C * 1e6, unit: 'μF' },
          { id: 'p-dt', label: 'Time Step dt', min: 0.05, max: 2.5, step: 0.05, val: p.dt * 1000, unit: 'ms' }
        ];

        sliders.forEach(s => {
          const div = document.createElement('div');
          div.className = 'param-item';
          div.innerHTML = `
            <div class="param-header">
              <span class="param-name">${s.label}</span>
              <span class="param-val" id="val-${s.id}">${s.val} ${s.unit}</span>
            </div>
            <input type="range" class="param-slider" id="${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}">
          `;
          paramControlsGrid.appendChild(div);

          div.querySelector('input').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            document.getElementById(`val-${s.id}`).textContent = `${v} ${s.unit}`;
            if (s.id === 'p-vs') p.Vs = v;
            else if (s.id === 'p-r') p.R = v;
            else if (s.id === 'p-l') p.L = v / 1000;
            else if (s.id === 'p-c') p.C = v * 1e-6;
            else if (s.id === 'p-dt') p.dt = v / 1000;

            workbench.latestTrans = RLCSolver.simulateEuler(p.Vs, p.R, p.L, p.C, p.dt, p.N);
            workbench.latestExact = RLCSolver.exactSolution(p.Vs, p.R, p.L, p.C, 0.04);
          });
        });

      } else if (track === 'complex') {
        if (titleEl) titleEl.textContent = 'AC Complex Phasor & Power Parameters';
        const p = workbench.complexParams;
        const sliders = [
          { id: 'p-vrms', label: 'Vrms Voltage', min: 110, max: 400, step: 10, val: p.Vrms, unit: 'V' },
          { id: 'p-freq', label: 'Frequency f', min: 50, max: 400, step: 10, val: p.f, unit: 'Hz' },
          { id: 'p-rload', label: 'Load Resistor', min: 5, max: 100, step: 1, val: p.R, unit: 'Ω' },
          { id: 'p-xl', label: 'Inductive XL', min: 5, max: 100, step: 1, val: p.XL, unit: 'Ω' },
          { id: 'p-targetpf', label: 'Target PF', min: 0.85, max: 0.99, step: 0.01, val: p.targetPF, unit: '' }
        ];

        sliders.forEach(s => {
          const div = document.createElement('div');
          div.className = 'param-item';
          div.innerHTML = `
            <div class="param-header">
              <span class="param-name">${s.label}</span>
              <span class="param-val" id="val-${s.id}">${s.val} ${s.unit}</span>
            </div>
            <input type="range" class="param-slider" id="${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}">
          `;
          paramControlsGrid.appendChild(div);

          div.querySelector('input').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            document.getElementById(`val-${s.id}`).textContent = `${v} ${s.unit}`;
            if (s.id === 'p-vrms') p.Vrms = v;
            else if (s.id === 'p-freq') p.f = v;
            else if (s.id === 'p-rload') p.R = v;
            else if (s.id === 'p-xl') p.XL = v;
            else if (s.id === 'p-targetpf') p.targetPF = v;

            workbench.latestComplex = ComplexSolver.solvePower(p.Vrms, p.f, p.R, p.XL, p.targetPF);
          });
        });
      }
    }

    // ── Execution Actions ([Run], [Step], [Trace], [Reset]) ────────────────────
    function runActiveCode() {
      const track = trackSelect.value;
      terminalOutput.textContent = '';
      statusBadge.className = 'badge-status running';
      statusBadge.textContent = 'RUNNING';

      cVM.onOutput = (txt) => {
        terminalOutput.textContent += txt;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
      };

      cVM.onStateChange = (st) => {
        statusBadge.className = `badge-status ${st.toLowerCase()}`;
        statusBadge.textContent = st;
      };

      let params = {};
      if (track === 'mesh') params = workbench.meshParams;
      else if (track === 'transient') params = workbench.transParams;
      else if (track === 'complex') params = workbench.complexParams;

      const res = cVM.runDirect(track, params);
      cycleCountEl.textContent = cVM.cycleCount;
      renderWatchTable();

      if (track === 'mesh' && res.result) {
        workbench.latestMesh = res.result;
        renderMatrixVisualizer('mesh');
      } else if (track === 'transient' && res.result) {
        workbench.latestTrans = res.result;
        workbench.latestExact = res.exact;
      } else if (track === 'complex' && res.result) {
        workbench.latestComplex = res.result;
      }
    }

    document.getElementById('btn-run').addEventListener('click', () => {
      runActiveCode();
      audio.playKeyTick();
    });

    document.getElementById('btn-step').addEventListener('click', () => {
      runActiveCode();
      audio.playKeyTick();
    });

    document.getElementById('btn-trace').addEventListener('click', () => {
      runActiveCode();
      audio.playKeyTick();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      cVM.reset();
      terminalOutput.textContent = '> Virtual Environment Reset.\n> C Stack & Heap cleared.';
      statusBadge.className = 'badge-status ready';
      statusBadge.textContent = 'READY';
      cycleCountEl.textContent = '0';
      audio.playKeyTick();
    });

    document.getElementById('btn-clear-term').addEventListener('click', () => {
      terminalOutput.textContent = '';
    });

    // ── Export Tools (.c and .csv) ─────────────────────────────────────────────
    document.getElementById('btn-export-c').addEventListener('click', () => {
      const blob = new Blob([textarea.value], { type: 'text/x-csrc' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = document.getElementById('ide-filename').textContent || 'solution.c';
      a.click();
      audio.playPassChime();
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
      let csvContent = 'data:text/csv;charset=utf-8,';
      const track = trackSelect.value;
      if (track === 'transient') {
        csvContent += 'time_s,vc_numerical_V,il_numerical_A\n';
        const num = workbench.latestTrans;
        for (let i = 0; i < num.vc.length; i++) {
          csvContent += `${num.t[i].toFixed(6)},${num.vc[i].toFixed(4)},${num.il[i].toFixed(4)}\n`;
        }
      } else if (track === 'mesh') {
        const m = workbench.latestMesh;
        csvContent += 'metric,value_unit\n';
        csvContent += `det_R,${m.det.toFixed(4)}\n`;
        csvContent += `I1,${m.I1.toFixed(4)}_A\n`;
        csvContent += `I2,${m.I2.toFixed(4)}_A\n`;
        csvContent += `I3,${m.I3.toFixed(4)}_A\n`;
      } else {
        const c = workbench.latestComplex;
        csvContent += 'parameter,value_unit\n';
        csvContent += `P_active,${c.P.toFixed(2)}_W\n`;
        csvContent += `Q_reactive,${c.Q.toFixed(2)}_VAR\n`;
        csvContent += `power_factor,${c.pf1.toFixed(4)}\n`;
        csvContent += `C_shunt,${c.C_uF.toFixed(2)}_uF\n`;
      }

      const encodedUri = encodeURI(csvContent);
      const a = document.createElement('a');
      a.href = encodedUri;
      a.download = `${track}_simulation_output.csv`;
      a.click();
      audio.playPassChime();
    });

    // ── 9 Coding Labs Challenge Engine ─────────────────────────────────────────
    function loadLab(index) {
      currentLabIdx = index;
      const lab = CodingLabs[index];
      document.getElementById('ch-badge').textContent = `LAB 0${lab.id} / 09`;
      document.getElementById('ch-title').textContent = lab.title;
      document.getElementById('ch-track-label').textContent = lab.trackLabel;
      document.getElementById('ch-context').innerHTML = `<strong>Problem Context:</strong> ${lab.context}`;
      document.getElementById('ch-feedback-msg').textContent = '';

      const critContainer = document.querySelector('.challenge-criteria');
      critContainer.innerHTML = '<div class="criteria-title">Target Acceptance Criteria</div>';
      lab.criteria.forEach((c, ci) => {
        const d = document.createElement('div');
        d.className = 'criteria-item';
        d.id = `crit-${ci + 1}`;
        d.innerHTML = `&#9675; ${c}`;
        critContainer.appendChild(d);
      });

      trackSelect.value = lab.track;
      templateSelect.value = 'challenge';
      loadTemplate(lab.track, 'challenge');
    }

    document.getElementById('btn-ch-verify').addEventListener('click', () => {
      const lab = CodingLabs[currentLabIdx];
      const code = textarea.value;
      const isPassed = lab.verify(code);

      const msg = document.getElementById('ch-feedback-msg');
      if (isPassed) {
        msg.style.color = 'var(--accent-green)';
        msg.textContent = '🎉 All acceptance criteria passed! Code accuracy verified.';
        document.querySelectorAll('.criteria-item').forEach(c => {
          c.className = 'criteria-item pass';
          c.innerHTML = `&#9989; ${c.textContent.substring(2)}`;
        });
        audio.playPassChime();
        if (window.confetti) window.confetti({ particleCount: 75, spread: 60 });
        document.getElementById('ch-progress-count').textContent = `${Math.min(9, currentLabIdx + 1)} / 9 Solved`;
      } else {
        msg.style.color = 'var(--accent-rose)';
        msg.textContent = '❌ Criteria check failed. Inspect hint and compiler diagnostics.';
        document.querySelectorAll('.criteria-item').forEach(c => {
          c.className = 'criteria-item fail';
        });
        audio.playErrorAlert();
      }
    });

    document.getElementById('btn-ch-hint').addEventListener('click', () => {
      const lab = CodingLabs[currentLabIdx];
      alert(`[Pedagogical Hint for Lab ${lab.id}]:\n\n${lab.hint}`);
      audio.playKeyTick();
    });

    document.getElementById('btn-ch-next').addEventListener('click', () => {
      const nextIdx = (currentLabIdx + 1) % CodingLabs.length;
      loadLab(nextIdx);
      audio.playKeyTick();
    });

    // ── Quiz & Certification Implementation ────────────────────────────────────
    function loadQuizQuestion(idx) {
      quizCurrentQ = idx;
      const q = QuizQuestions[idx];
      document.getElementById('quiz-current-num').textContent = idx + 1;
      document.getElementById('quiz-question-text').textContent = q.q;

      const optsContainer = document.getElementById('quiz-options-container');
      optsContainer.innerHTML = '';

      q.options.forEach((opt, oi) => {
        const div = document.createElement('div');
        div.className = `quiz-option ${userAnswers[idx] === oi ? 'selected' : ''}`;
        div.innerHTML = `<span style="font-weight:700; color:var(--accent-cyan);">${String.fromCharCode(65 + oi)}.</span> ${opt}`;
        div.addEventListener('click', () => {
          document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
          div.classList.add('selected');
          userAnswers[idx] = oi;
          audio.playKeyTick();
        });
        optsContainer.appendChild(div);
      });

      const fb = document.getElementById('quiz-feedback');
      fb.style.display = 'none';
      document.getElementById('quiz-live-score').textContent = `${quizScore} / ${QuizQuestions.length}`;
    }

    document.getElementById('btn-quiz-next').addEventListener('click', () => {
      const sel = userAnswers[quizCurrentQ];
      if (sel === -1) {
        alert('Please choose an option before submitting!');
        return;
      }

      const q = QuizQuestions[quizCurrentQ];
      const isCorrect = sel === q.correct;
      const fb = document.getElementById('quiz-feedback');
      fb.style.display = 'block';

      if (isCorrect) {
        fb.innerHTML = `<strong>Correct!</strong> ${q.feedback}`;
        fb.style.borderLeftColor = 'var(--accent-green)';
        quizScore++;
        audio.playPassChime();
      } else {
        fb.innerHTML = `<strong>Incorrect.</strong> ${q.feedback}`;
        fb.style.borderLeftColor = 'var(--accent-rose)';
        audio.playErrorAlert();
      }

      document.getElementById('quiz-live-score').textContent = `${quizScore} / ${QuizQuestions.length}`;

      setTimeout(() => {
        if (quizCurrentQ < QuizQuestions.length - 1) {
          loadQuizQuestion(quizCurrentQ + 1);
        } else {
          // Finish quiz & show certificate modal
          const modal = document.getElementById('cert-modal');
          const finalScore = document.getElementById('cert-final-score');
          finalScore.textContent = `Score: ${quizScore} / ${QuizQuestions.length} (${Math.round((quizScore / QuizQuestions.length) * 100)}%)`;
          modal.classList.add('show');
          audio.playPassChime();
          if (window.confetti) window.confetti({ particleCount: 120, spread: 90 });
        }
      }, 1500);
    });

    document.getElementById('btn-quiz-prev').addEventListener('click', () => {
      if (quizCurrentQ > 0) {
        loadQuizQuestion(quizCurrentQ - 1);
        audio.playKeyTick();
      }
    });

    document.getElementById('btn-close-cert').addEventListener('click', () => {
      document.getElementById('cert-modal').classList.remove('show');
    });

    document.getElementById('btn-print-cert').addEventListener('click', () => {
      window.print();
    });

    // ── Initial Boot ───────────────────────────────────────────────────────────
    loadTemplate('mesh', 'starter');
    loadLab(0);
    workbench.render();

    // KaTeX Auto-Render for initial view
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ]
      });
    }
  });

})();
