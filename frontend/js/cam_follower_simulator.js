/**
 * Cam & Follower — WebSocket Telemetry & UI Controller
 * ===================================================
 * Connects to Python FastAPI backend (/ws/cam-follower), handles slider inputs,
 * drives 2D cam profile & displacement graph in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class CamFollowerSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        follower_motion: 'shm',
        follower_type: 'roller',
        stroke_stroke_mm: 40,
        outstroke_angle_deg: 120,
        dwell_top_angle_deg: 30,
        return_angle_deg: 120,
        base_circle_radius_mm: 60,
        cam_rpm: 300,
        cam_angle_deg: 45
      };

      this.canvas2d = document.getElementById('cam-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.CamFollower3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/cam-follower`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Cam & Follower Python Engine');
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

      setTxt('st-disp', `${telemetry.follower_displacement_mm.toFixed(1)} mm`);
      setTxt('st-vel', `${telemetry.follower_velocity_ms.toFixed(2)} m/s`);
      setTxt('st-acc', `${telemetry.follower_acceleration_ms2.toFixed(1)} m/s²`);
      setTxt('st-press-ang', `${telemetry.max_pressure_angle_deg.toFixed(1)}°`);
      setTxt('st-motion', telemetry.motion_type);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          cam_rpm: this.state.cam_rpm,
          follower_displacement_mm: telemetry.follower_displacement_mm
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

      const cx = w / 3;
      const cy = h / 2 + 20;

      // Base Circle
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Follower Stem & Roller
      const liftY = (telemetry.follower_displacement_mm / 40.0) * 45.0;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(cx, cy - 45 - liftY - 12, 12, 0, Math.PI * 2); // Roller
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 5, cy - 45 - liftY - 90, 10, 80); // Stem

      // Right Side Displacement Graph
      const gx = w * 0.58;
      const gy = h * 0.25;
      const gw = 220;
      const gh = 160;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, gw, gh);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText('Displacement Curve y(θ)', gx + 40, gy - 10);

      // Draw SHM Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= gw; i++) {
        const x = gx + i;
        const normX = i / gw;
        const yNorm = 0.5 * (1.0 - Math.cos(normX * Math.PI * 2.0));
        const y = gy + gh - yNorm * gh * 0.8 - 15;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    bindControls() {
      const motionBtns = document.querySelectorAll('[data-motion]');
      motionBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          motionBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.follower_motion = btn.dataset.motion;
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

      bindSlider('slider-stroke', 'val-stroke', 'stroke_stroke_mm', ' mm');
      bindSlider('slider-r0', 'val-r0', 'base_circle_radius_mm', ' mm');
      bindSlider('slider-rpm', 'val-rpm', 'cam_rpm', ' RPM');
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
          fetch('/api/cam-follower/presets')
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
    window.camFollowerApp = new CamFollowerSimulatorApp();
  });
})();
