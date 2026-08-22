/**
 * Two-Stroke Engine — WebSocket Telemetry & UI Controller
 * ========================================================
 * Connects to Python FastAPI backend (/ws/two-stroke), handles slider inputs,
 * drives 2D working schematic canvas in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class TwoStrokeSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        engine_type: 'petrol_reed_valve',
        bore_mm: 66,
        stroke_mm: 58,
        compression_ratio: 8.5,
        engine_rpm: 4500,
        scavenge_ratio: 1.2,
        bmep_bar: 6.5,
        crank_angle_deg: 0
      };

      this.canvas2d = document.getElementById('engine-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.TwoStroke3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/two-stroke`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Two-Stroke Python Engine');
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

      setTxt('st-disp', `${Math.round(telemetry.displacement_cc)} cc`);
      setTxt('st-scavenge', `${telemetry.scavenging_efficiency_pct.toFixed(1)}%`);
      setTxt('st-bp', `${telemetry.brake_power_kw.toFixed(1)} kW`);
      setTxt('st-torque', `${telemetry.brake_torque_nm.toFixed(1)} N·m`);
      setTxt('st-freq', `${Math.round(telemetry.power_stroke_frequency_hz)} Hz`);
      setTxt('st-phase', telemetry.current_stroke_phase);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          engine_rpm: this.state.engine_rpm,
          current_stroke_phase: telemetry.current_stroke_phase
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

      const cx = w / 2;
      const cy = h / 2 + 20;

      // Cylinder & Crankcase Ports
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 70, cy - 140, 140, 200);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 70, cy - 140, 140, 200);

      // Ports
      ctx.fillStyle = '#34d399';
      ctx.fillRect(cx - 85, cy - 40, 15, 30); // Transfer
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx + 70, cy - 60, 15, 30);  // Exhaust

      // Piston
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 68, cy - 90, 136, 40);
      ctx.strokeRect(cx - 68, cy - 90, 136, 40);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText('Transfer Port (Fresh Charge)', cx - 180, cy - 25);
      ctx.fillText('Exhaust Port (Burnt Gas)', cx + 95, cy - 45);
    }

    bindControls() {
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
          fetch('/api/two-stroke/presets')
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
    window.twoStrokeApp = new TwoStrokeSimulatorApp();
  });
})();
