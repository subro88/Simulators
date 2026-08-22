/**
 * Gear Trains — WebSocket Telemetry & UI Controller
 * =================================================
 * Connects to Python FastAPI backend (/ws/gear-trains), handles slider inputs,
 * drives 2D meshing gears schematic in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class GearTrainsSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        train_type: 'simple',
        module_mm: 3.0,
        driver_teeth: 20,
        idler_teeth: 40,
        driven_teeth: 60,
        input_rpm: 1440,
        input_torque_nm: 100,
        efficiency_pct: 96
      };

      this.canvas2d = document.getElementById('gear-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.GearTrains3DViewer('webgl-canvas');
      this.connectWebSocket();
      this.bindControls();
      this.bindModeTabs();
      this.bindPresets();

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
      const wsUrl = `${protocol}//${host}/ws/gear-trains`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Gear Trains Python Engine');
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

      setTxt('st-ratio', `${telemetry.gear_ratio.toFixed(2)}:1`);
      setTxt('st-out-rpm', `${Math.round(telemetry.output_rpm)} RPM`);
      setTxt('st-out-torque', `${telemetry.output_torque_nm.toFixed(1)} N·m`);
      setTxt('st-dir', telemetry.rotation_direction);
      setTxt('st-center-dist', `${telemetry.center_distance_mm.toFixed(1)} mm`);
      setTxt('st-train-type', telemetry.train_type);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          input_rpm: this.state.input_rpm,
          gear_ratio: telemetry.gear_ratio
        });
      }

      this.draw2DSchematic(telemetry);
    }

    draw2DSchematic(telemetry) {
      if (!this.ctx2d || !this.canvas2d) return;

      const w = (this.canvas2d.width = this.canvas2d.clientWidth || 700);
      const h = (this.canvas2d.height = this.canvas2d.clientHeight || 460);
      const ctx = this.ctx2d;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      const cy = h / 2;
      const r1 = 35;
      const r2 = 55;
      const r3 = 75;

      const cx1 = w / 4;
      const cx2 = cx1 + r1 + r2;
      const cx3 = cx2 + r2 + r3;

      // Draw Driver Gear (Orange)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx1, cy, r1, 0, Math.PI * 2);
      ctx.fill();

      // Draw Idler Gear (Cyan)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx2, cy, r2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Driven Gear (Green)
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(cx3, cy, r3, 0, Math.PI * 2);
      ctx.fill();

      // Text Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText(`Driver (Z1=${this.state.driver_teeth})`, cx1 - 40, cy + r1 + 20);
      ctx.fillText(`Idler (Z2=${this.state.idler_teeth})`, cx2 - 35, cy + r2 + 20);
      ctx.fillText(`Driven (Z3=${this.state.driven_teeth})`, cx3 - 40, cy + r3 + 20);
    }

    bindControls() {
      const trainBtns = document.querySelectorAll('[data-train-type]');
      trainBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          trainBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.train_type = btn.dataset.trainType;
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

      bindSlider('slider-z1', 'val-z1', 'driver_teeth', ' T');
      bindSlider('slider-z2', 'val-z2', 'idler_teeth', ' T');
      bindSlider('slider-z3', 'val-z3', 'driven_teeth', ' T');
      bindSlider('slider-rpm', 'val-rpm', 'input_rpm', ' RPM');
      bindSlider('slider-torque', 'val-torque', 'input_torque_nm', ' N·m');
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
          fetch('/api/gear-trains/presets')
            .then((r) => r.json())
            .then((presets) => {
              if (presets[val]) {
                Object.assign(this.state, presets[val].params);
                this.sendState();
              }
            });
        });
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.gearTrainsApp = new GearTrainsSimulatorApp();
  });
})();
