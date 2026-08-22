/**
 * Automotive Friction Clutch — WebSocket Telemetry & UI Controller
 * ================================================================
 * Connects to Python FastAPI backend (/ws/clutch), handles slider inputs,
 * drives 2D working schematic canvas in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class ClutchSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        clutch_type: 'single_plate',
        calculation_theory: 'uniform_wear',
        clamp_force_n: 4200,
        friction_coeff: 0.35,
        outer_radius_mm: 120,
        inner_radius_mm: 80,
        number_of_plates: 1,
        pedal_travel_pct: 0,
        engine_rpm: 2400,
        engine_torque_nm: 220
      };

      // 2D Working Schematic Canvas
      this.canvas2d = document.getElementById('clutch-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      // 1. Initialize 3D Viewer
      this.viewer3d = new window.Clutch3DViewer('webgl-canvas');

      // 2. Establish WebSocket connection
      this.connectWebSocket();

      // 3. Bind UI Controls & Sliders
      this.bindControls();

      // 4. Bind Mode Tabs
      this.bindModeTabs();

      // 5. Bind Presets
      this.bindPresets();

      // 6. Viewport overlay controls
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
      const wsUrl = `${protocol}//${host}/ws/clutch`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Clutch Python engine');
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

      setTxt('st-capacity', `${telemetry.max_torque_capacity_nm.toFixed(1)} N·m`);
      setTxt('st-transmitted', `${telemetry.transmitted_torque_nm.toFixed(1)} N·m`);
      setTxt('st-gb-rpm', `${Math.round(telemetry.gearbox_rpm)} RPM`);
      setTxt('st-power', `${telemetry.transmitted_power_kw.toFixed(2)} kW`);
      setTxt('st-wear', `${telemetry.wear_rate_index.toFixed(2)}`);
      setTxt('st-formula', telemetry.torque_formula);
      setTxt('st-note', telemetry.status_note);

      const statusBadge = document.getElementById('st-status');
      if (statusBadge) {
        if (telemetry.effective_clamp_force_n < 50) {
          statusBadge.textContent = 'DISENGAGED';
          statusBadge.style.color = 'var(--text-muted)';
        } else if (telemetry.is_slipping) {
          statusBadge.textContent = 'SLIPPING';
          statusBadge.style.color = 'var(--red)';
        } else {
          statusBadge.textContent = 'LOCKED UP';
          statusBadge.style.color = 'var(--green)';
        }
      }

      // Stream to 3D viewer
      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          engine_rpm: this.state.engine_rpm,
          gearbox_rpm: telemetry.gearbox_rpm,
          pedal_travel_pct: this.state.pedal_travel_pct
        });
      }

      // Render 2D working schematic
      this.draw2DSchematic(telemetry);
    }

    draw2DSchematic(telemetry) {
      if (!this.ctx2d || !this.canvas2d) return;

      const w = (this.canvas2d.width = this.canvas2d.clientWidth || 700);
      const h = (this.canvas2d.height = this.canvas2d.clientHeight || 500);

      const ctx = this.ctx2d;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // 1. Engine Flywheel (Left Side)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 160, cy - 140, 40, 280);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 160, cy - 140, 40, 280);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px var(--font-sans)';
      ctx.fillText('Engine Flywheel', cx - 150, cy - 155);
      ctx.fillText(`${Math.round(this.state.engine_rpm)} RPM`, cx - 140, cy + 170);

      // 2. Friction Disc (Middle)
      const liningColor = telemetry.is_slipping ? '#ef4444' : '#34d399';
      ctx.fillStyle = liningColor;
      ctx.fillRect(cx - 115, cy - 120, 16, 240);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 115, cy - 120, 16, 240);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Friction Disc', cx - 115, cy - 135);

      // 3. Pressure Plate (Right Side)
      // Axial offset based on pedal travel
      const pedalOffset = (this.state.pedal_travel_pct / 100.0) * 35.0;
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 95 + pedalOffset, cy - 130, 30, 260);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 95 + pedalOffset, cy - 130, 30, 260);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Pressure Plate', cx - 90 + pedalOffset, cy - 145);

      // 4. Gearbox Output Shaft
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy);
      ctx.lineTo(cx + 200, cy);
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.fillText('Gearbox Shaft', cx + 80, cy - 20);
      ctx.fillText(`${Math.round(telemetry.gearbox_rpm)} RPM`, cx + 80, cy + 30);

      // 5. Clamping Force Springs Diagram
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      for (let yOffset of [-90, 90]) {
        ctx.beginPath();
        ctx.moveTo(cx - 60 + pedalOffset, cy + yOffset);
        ctx.lineTo(cx + 40, cy + yOffset);
        ctx.stroke();
      }

      // Legend Overlay
      ctx.fillStyle = '#64748b';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText(`Theory: ${telemetry.calculation_theory}`, 20, 30);
      ctx.fillText(
        `Pedal Travel: ${this.state.pedal_travel_pct}% (${
          telemetry.is_slipping ? 'Slipping/Disengaged' : 'Full Lockup'
        })`,
        20,
        50
      );
    }

    bindControls() {
      // Clutch type selection buttons
      const typeBtns = document.querySelectorAll('[data-clutch-type]');
      typeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          typeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.clutch_type = btn.dataset.clutchType;
          if (btn.dataset.clutchType === 'multi_plate') {
            this.state.number_of_plates = 4;
            this.state.friction_coeff = 0.12; // Wet multi-plate
          } else {
            this.state.number_of_plates = 1;
            this.state.friction_coeff = 0.35; // Dry single-plate
          }
          this.sendState();
        });
      });

      // Theory selection buttons
      const theoryBtns = document.querySelectorAll('[data-theory]');
      theoryBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          theoryBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.calculation_theory = btn.dataset.theory;
          this.sendState();
        });
      });

      // Sliders
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

      bindSlider('slider-pedal', 'val-pedal', 'pedal_travel_pct', '%');
      bindSlider('slider-clamp', 'val-clamp', 'clamp_force_n', ' N');
      bindSlider('slider-rpm', 'val-rpm', 'engine_rpm', ' RPM');
      bindSlider('slider-torque', 'val-torque', 'engine_torque_nm', ' N·m');
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

          fetch('/api/clutch/presets')
            .then((r) => r.json())
            .then((presets) => {
              if (presets[val]) {
                const p = presets[val].params;
                Object.assign(this.state, p);

                if (p.pedal_travel_pct !== undefined) {
                  const s = document.getElementById('slider-pedal');
                  if (s) s.value = p.pedal_travel_pct;
                  const b = document.getElementById('val-pedal');
                  if (b) b.textContent = `${p.pedal_travel_pct}%`;
                }
                if (p.clamp_force_n !== undefined) {
                  const s = document.getElementById('slider-clamp');
                  if (s) s.value = p.clamp_force_n;
                  const b = document.getElementById('val-clamp');
                  if (b) b.textContent = `${p.clamp_force_n} N`;
                }
                this.sendState();
              }
            });
        });
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.clutchApp = new ClutchSimulatorApp();
  });
})();
