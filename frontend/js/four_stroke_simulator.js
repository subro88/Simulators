/**
 * Four-Stroke Engine — WebSocket Telemetry & UI Controller
 * ========================================================
 * Connects to Python FastAPI backend (/ws/four-stroke), handles slider inputs,
 * drives 2D working schematic canvas in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class FourStrokeSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        engine_type: 'petrol_otto',
        bore_mm: 85,
        stroke_mm: 88,
        compression_ratio: 10.5,
        cutoff_ratio: 1.8,
        engine_rpm: 3000,
        number_of_cylinders: 4,
        bmep_bar: 10.0,
        mechanical_efficiency_pct: 85.0,
        crank_angle_deg: 0
      };

      this.canvas2d = document.getElementById('engine-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      // 1. Initialize 3D Viewer
      this.viewer3d = new window.FourStroke3DViewer('webgl-canvas');

      // 2. Establish WebSocket Connection
      this.connectWebSocket();

      // 3. Bind UI Controls
      this.bindControls();

      // 4. Bind Mode Tabs
      this.bindModeTabs();

      // 5. Bind Presets
      this.bindPresets();

      // 6. Viewport Overlay Buttons
      const btnExplode = document.getElementById('btn-toggle-explode');
      if (btnExplode) {
        btnExplode.addEventListener('click', () => {
          if (this.viewer3d) {
            const isExploded = this.viewer3d.toggleExploded();
            btnExplode.classList.toggle('active', isExploded);
            btnExplode.textContent = isExploded ? '🔍 Assembled View' : '💥 Exploded View';
          }
        });
      }

      const btnResetCam = document.getElementById('btn-reset-cam');
      if (btnResetCam) {
        btnResetCam.addEventListener('click', () => {
          if (this.viewer3d) this.viewer3d.resetView();
        });
      }
    }

    connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:8080';
      const wsUrl = `${protocol}//${host}/ws/four-stroke`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Four-Stroke Python Engine');
          if (badge) badge.classList.remove('disconnected');
          if (badgeText) badgeText.textContent = 'Python Engine Connected';
          this.sendState();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'state_update') {
              this.onStateUpdate(data.payload);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        this.socket.onclose = () => {
          if (badge) badge.classList.add('disconnected');
          if (badgeText) badgeText.textContent = 'Reconnecting...';
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 2000);
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
      }
    }

    sendState() {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            type: 'set_state',
            payload: this.state
          })
        );
      }
    }

    onStateUpdate(telemetry) {
      const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };

      setTxt('st-disp', `${Math.round(telemetry.total_displacement_cc)} cc (${telemetry.swept_volume_cc.toFixed(1)} cc/cyl)`);
      setTxt('st-eff', `${telemetry.air_standard_efficiency_pct.toFixed(1)}%`);
      setTxt('st-bp', `${telemetry.brake_power_kw.toFixed(1)} kW`);
      setTxt('st-torque', `${telemetry.brake_torque_nm.toFixed(1)} N·m`);
      setTxt('st-ip', `${telemetry.indicated_power_kw.toFixed(1)} kW`);
      setTxt('st-phase', telemetry.current_stroke_phase);
      setTxt('st-formula', telemetry.thermodynamic_formula);
      setTxt('st-note', telemetry.status_note);

      // Forward telemetry to 3D Viewer
      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          engine_rpm: this.state.engine_rpm,
          current_stroke_phase: telemetry.current_stroke_phase,
          crank_angle_deg: this.state.crank_angle_deg
        });
      }

      // Render 2D Cylinder Cross-section & Slider-Crank
      this.draw2DSchematic(telemetry);
    }

    draw2DSchematic(telemetry) {
      if (!this.ctx2d || !this.canvas2d) return;

      const w = (this.canvas2d.width = this.canvas2d.clientWidth || 700);
      const h = (this.canvas2d.height = this.canvas2d.clientHeight || 480);
      const ctx = this.ctx2d;
      ctx.clearRect(0, 0, w, h);

      // Dark background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 3.0;
      const cy = h / 2.0 + 40;

      // 1. Cylinder Block Walls
      const blockWidth = 140;
      const blockHeight = 220;
      const tdcY = cy - 140;
      const bdcY = tdcY + 110;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - blockWidth / 2 - 16, tdcY - 30, 16, blockHeight);
      ctx.fillRect(cx + blockWidth / 2, tdcY - 30, 16, blockHeight);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - blockWidth / 2 - 16, tdcY - 30, 16, blockHeight);
      ctx.strokeRect(cx + blockWidth / 2, tdcY - 30, 16, blockHeight);

      // Cylinder Head
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - blockWidth / 2 - 16, tdcY - 50, blockWidth + 32, 20);

      // 2. Gas Chamber Color by Stroke Phase
      let chamberColor = '#38bdf8';
      if (telemetry.current_stroke_phase.includes('INTAKE')) chamberColor = 'rgba(56, 189, 248, 0.4)';
      else if (telemetry.current_stroke_phase.includes('COMPRESSION')) chamberColor = 'rgba(168, 85, 247, 0.6)';
      else if (telemetry.current_stroke_phase.includes('POWER')) chamberColor = 'rgba(239, 68, 68, 0.85)';
      else chamberColor = 'rgba(148, 163, 184, 0.4)';

      // Piston Y position
      const pistonNorm = Math.min(1.0, Math.max(0.0, telemetry.piston_position_mm / (this.state.stroke_mm || 88)));
      const pistonY = tdcY + pistonNorm * 100.0;

      ctx.fillStyle = chamberColor;
      ctx.fillRect(cx - blockWidth / 2, tdcY - 30, blockWidth, pistonY - (tdcY - 30));

      // 3. Piston Body
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - blockWidth / 2 + 2, pistonY, blockWidth - 4, 45);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(cx - blockWidth / 2 + 2, pistonY, blockWidth - 4, 45);

      // Piston Pin & Connecting Rod
      const crankR = 40;
      const conrodL = 120;
      const crankAngleRad = ((Date.now() / 1000.0) * (this.state.engine_rpm / 60.0) * Math.PI * 2.0);

      const pinX = cx;
      const pinY = pistonY + 22;
      const crankPinX = cx + crankR * Math.sin(crankAngleRad);
      const crankPinY = cy + 40 + crankR * Math.cos(crankAngleRad);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(pinX, pinY);
      ctx.lineTo(crankPinX, crankPinY);
      ctx.stroke();

      // Crankshaft Center
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy + 40, 16, 0, Math.PI * 2);
      ctx.fill();

      // Crank Throw Circle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 40, crankR, 0, Math.PI * 2);
      ctx.stroke();

      // Right Side: P-V Diagram Sketch
      const pvX = w * 0.65;
      const pvY = h * 0.25;
      const pvW = 180;
      const pvH = 180;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(pvX, pvY, pvW, pvH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText('P-V Diagram', pvX + 50, pvY - 10);
      ctx.fillText('P (Pressure)', pvX - 10, pvY + pvH / 2);
      ctx.fillText('V (Volume)', pvX + pvW / 2 - 20, pvY + pvH + 20);

      // Draw Idealized Cycle Curve
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pvX + 30, pvY + 20);  // Combustion peak
      ctx.lineTo(pvX + 160, pvY + 120); // Expansion
      ctx.lineTo(pvX + 160, pvY + 160); // Exhaust
      ctx.lineTo(pvX + 30, pvY + 160);  // Compression start
      ctx.closePath();
      ctx.stroke();
    }

    bindControls() {
      const typeBtns = document.querySelectorAll('[data-engine-type]');
      typeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          typeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.engine_type = btn.dataset.engineType;
          this.sendState();
        });
      });

      const bindSlider = (sliderId, valBadgeId, stateKey, unit = '') => {
        const slider = document.getElementById(sliderId);
        const badge = document.getElementById(valBadgeId);
        if (slider) {
          slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.state[stateKey] = val;
            if (badge) badge.textContent = `${val}${unit}`;
            this.sendState();
          });
        }
      };

      bindSlider('slider-bore', 'val-bore', 'bore_mm', ' mm');
      bindSlider('slider-stroke', 'val-stroke', 'stroke_mm', ' mm');
      bindSlider('slider-cr', 'val-cr', 'compression_ratio', ':1');
      bindSlider('slider-rpm', 'val-rpm', 'engine_rpm', ' RPM');
      bindSlider('slider-bmep', 'val-bmep', 'bmep_bar', ' bar');
    }

    bindModeTabs() {
      const tabs = document.querySelectorAll('#mode-tabs .pill');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          const mode = tab.dataset.mode || tab.dataset.value;
          this.switchMode(mode);
        });
      });
    }

    switchMode(mode) {
      this.currentMode = mode;
      const sections = ['simulate', 'explore', 'practice', 'quiz'];

      sections.forEach((sec) => {
        const el = document.getElementById(`section-${sec}`);
        if (el) el.classList.toggle('active', sec === mode);
      });

      if (mode === '3d-model') {
        const simSec = document.getElementById('section-simulate');
        if (simSec) simSec.classList.add('active');
        if (this.viewer3d) this.viewer3d.onResize();
      }
    }

    bindPresets() {
      const presetSelect = document.getElementById('preset-select');
      if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (!val) return;

          fetch('/api/four-stroke/presets')
            .then((r) => r.json())
            .then((presets) => {
              if (presets[val]) {
                const p = presets[val].params;
                Object.assign(this.state, p);

                if (p.bore_mm !== undefined) {
                  const s = document.getElementById('slider-bore');
                  if (s) s.value = p.bore_mm;
                  const b = document.getElementById('val-bore');
                  if (b) b.textContent = `${p.bore_mm} mm`;
                }
                if (p.engine_rpm !== undefined) {
                  const s = document.getElementById('slider-rpm');
                  if (s) s.value = p.engine_rpm;
                  const b = document.getElementById('val-rpm');
                  if (b) b.textContent = `${p.engine_rpm} RPM`;
                }
                this.sendState();
              }
            });
        });
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.fourStrokeApp = new FourStrokeSimulatorApp();
  });
})();
