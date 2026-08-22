/**
 * Steering Geometry — WebSocket Telemetry & UI Controller
 * =======================================================
 * Connects to Python FastAPI backend (/ws/steering), handles slider inputs,
 * drives 2D working schematic canvas in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class SteeringSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        steering_mechanism: 'ackermann',
        wheelbase_m: 2.6,
        track_width_m: 1.5,
        steering_wheel_angle_deg: 180,
        steering_ratio: 16.0,
        camber_angle_deg: -1.0,
        caster_angle_deg: 4.5,
        kpi_angle_deg: 12.0
      };

      this.canvas2d = document.getElementById('steering-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.Steering3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/steering`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Steering Python Engine');
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

      setTxt('st-inner', `${telemetry.inner_wheel_angle_deg.toFixed(1)}°`);
      setTxt('st-outer', `${telemetry.actual_outer_wheel_angle_deg.toFixed(1)}°`);
      setTxt('st-ideal', `${telemetry.ideal_ackermann_outer_angle_deg.toFixed(1)}°`);
      setTxt('st-error', `${telemetry.ackermann_error_deg.toFixed(2)}°`);
      setTxt('st-radius', `${telemetry.turning_radius_cg_m.toFixed(2)} m`);
      setTxt('st-scrub', `${telemetry.scrub_radius_mm.toFixed(1)} mm`);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          inner_wheel_angle_deg: telemetry.inner_wheel_angle_deg,
          actual_outer_wheel_angle_deg: telemetry.actual_outer_wheel_angle_deg,
          steering_wheel_angle_deg: this.state.steering_wheel_angle_deg
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
      const cy = h / 2;

      // Draw Chassis Footprint
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(cx - 80, cy - 120, 160, 240);

      // Steering Rack
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy - 80);
      ctx.lineTo(cx + 70, cy - 80);
      ctx.stroke();

      // Front Wheels
      const innerRad = (telemetry.inner_wheel_angle_deg * Math.PI) / 180.0;
      const outerRad = (telemetry.actual_outer_wheel_angle_deg * Math.PI) / 180.0;

      // Left Wheel
      ctx.save();
      ctx.translate(cx - 80, cy - 80);
      ctx.rotate(-innerRad);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-10, -30, 20, 60);
      ctx.restore();

      // Right Wheel
      ctx.save();
      ctx.translate(cx + 80, cy - 80);
      ctx.rotate(-outerRad);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-10, -30, 20, 60);
      ctx.restore();

      ctx.fillStyle = '#34d399';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText(`Ackermann Condition: cot(θ) - cot(φ) = w/B`, 20, 30);
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

      bindSlider('slider-steer', 'val-steer', 'steering_wheel_angle_deg', '°');
      bindSlider('slider-wb', 'val-wb', 'wheelbase_m', ' m');
      bindSlider('slider-tw', 'val-tw', 'track_width_m', ' m');
      bindSlider('slider-ratio', 'val-ratio', 'steering_ratio', ':1');
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
          fetch('/api/steering/presets')
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
    window.steeringApp = new SteeringSimulatorApp();
  });
})();
