/**
 * Four-Bar Linkage — WebSocket Telemetry & UI Controller
 * ======================================================
 * Connects to Python FastAPI backend (/ws/four-bar), handles slider inputs,
 * drives 2D planar linkage & coupler curve canvas in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class FourBarSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        frame_length_a: 180,
        crank_length_b: 60,
        coupler_length_c: 160,
        rocker_length_d: 140,
        crank_angle_deg: 45,
        crank_rpm: 60
      };

      this.canvas2d = document.getElementById('linkage-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.FourBar3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/four-bar`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Four-Bar Python Engine');
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

      setTxt('st-grashof', telemetry.grashof_type);
      setTxt('st-trans', `${telemetry.transmission_angle_deg.toFixed(1)}°`);
      setTxt('st-rocker-speed', `${telemetry.rocker_rpm.toFixed(1)} RPM`);
      setTxt('st-coupler-ang', `${telemetry.coupler_angle_deg.toFixed(1)}°`);
      setTxt('st-rocker-ang', `${telemetry.rocker_angle_deg.toFixed(1)}°`);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          coupler_angle_deg: telemetry.coupler_angle_deg,
          rocker_angle_deg: telemetry.rocker_angle_deg
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

      const ox = w / 4;
      const oy = h / 2 + 30;

      // Fixed Ground Frame Link (a)
      const ax = ox + this.state.frame_length_a;
      const ay = oy;

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // Crank Pin B
      const th2 = ((Date.now() / 1000.0) * (this.state.crank_rpm / 60.0) * Math.PI * 2.0);
      const bx = ox + this.state.crank_length_b * Math.cos(th2);
      const by = oy - this.state.crank_length_b * Math.sin(th2);

      // Crank Link (b)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Rocker Pin C
      const th4 = (telemetry.rocker_angle_deg * Math.PI) / 180.0;
      const cx = ax + this.state.rocker_length_d * Math.cos(th4);
      const cy = ay - this.state.rocker_length_d * Math.sin(th4);

      // Rocker Link (d)
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Coupler Link (c)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Pins
      ctx.fillStyle = '#e2e8f0';
      for (let [px, py] of [[ox, oy], [ax, ay], [bx, by], [cx, cy]]) {
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText(`Grashof: ${telemetry.is_grashof ? 'SATISFIED (s + l ≤ p + q)' : 'NON-GRASHOF'}`, 20, 30);
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

      bindSlider('slider-a', 'val-a', 'frame_length_a', ' mm');
      bindSlider('slider-b', 'val-b', 'crank_length_b', ' mm');
      bindSlider('slider-c', 'val-c', 'coupler_length_c', ' mm');
      bindSlider('slider-d', 'val-d', 'rocker_length_d', ' mm');
      bindSlider('slider-rpm', 'val-rpm', 'crank_rpm', ' RPM');
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
          fetch('/api/four-bar/presets')
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
    window.fourBarApp = new FourBarSimulatorApp();
  });
})();
