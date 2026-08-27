/**
 * Belt Drive — WebSocket Telemetry & UI Controller
 * ================================================
 * Connects to Python FastAPI backend (/ws/belt-drive), handles slider inputs,
 * drives 2D belt tension & lap angle schematic in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class BeltDriveSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        belt_type: 'flat_belt',
        driver_diameter_mm: 200,
        driven_diameter_mm: 400,
        center_distance_mm: 1000,
        friction_coeff: 0.30,
        belt_mass_kg_m: 0.40,
        max_tension_n: 1500,
        driver_rpm: 1440,
        groove_angle_deg: 38
      };

      this.canvas2d = document.getElementById('belt-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.BeltDrive3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/belt-drive`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Belt Drive Python Engine');
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

      setTxt('st-vel', `${telemetry.belt_velocity_ms.toFixed(1)} m/s`);
      setTxt('st-power', `${telemetry.transmitted_power_kw.toFixed(2)} kW`);
      setTxt('st-t1', `${Math.round(telemetry.tight_side_tension_n)} N`);
      setTxt('st-t2', `${Math.round(telemetry.slack_side_tension_n)} N`);
      setTxt('st-lap', `${telemetry.lap_angle_deg.toFixed(1)}°`);
      setTxt('st-belt-type', telemetry.belt_type);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          driver_rpm: this.state.driver_rpm,
          speed_ratio: telemetry.speed_ratio
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
      const r2 = 65;
      const cx1 = w / 3 - 30;
      const cx2 = w * 0.7;

      // Draw Driver Pulley (Orange)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx1, cy, r1, 0, Math.PI * 2);
      ctx.fill();

      // Draw Driven Pulley (Cyan)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx2, cy, r2, 0, Math.PI * 2);
      ctx.fill();

      // Top Belt (Tight Side T1) - Red
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx1, cy - r1);
      ctx.lineTo(cx2, cy - r2);
      ctx.stroke();

      // Bottom Belt (Slack Side T2) - Blue
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx1, cy + r1);
      ctx.lineTo(cx2, cy + r2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText(`Tight Side T1 (${Math.round(telemetry.tight_side_tension_n)} N)`, (cx1 + cx2) / 2 - 50, cy - r2 - 10);

      ctx.fillStyle = '#3b82f6';
      ctx.fillText(`Slack Side T2 (${Math.round(telemetry.slack_side_tension_n)} N)`, (cx1 + cx2) / 2 - 50, cy + r2 + 25);
    }

    bindControls() {
      const beltBtns = document.querySelectorAll('[data-belt-type]');
      beltBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          beltBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.belt_type = btn.dataset.beltType;
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

      bindSlider('slider-d1', 'val-d1', 'driver_diameter_mm', ' mm');
      bindSlider('slider-d2', 'val-d2', 'driven_diameter_mm', ' mm');
      bindSlider('slider-tmax', 'val-tmax', 'max_tension_n', ' N');
      bindSlider('slider-rpm', 'val-rpm', 'driver_rpm', ' RPM');
      bindSlider('slider-mu', 'val-mu', 'friction_coeff', '');
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
          fetch('/api/belt-drive/presets')
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
    window.beltDriveApp = new BeltDriveSimulatorApp();
  });
})();
