/**
 * Aggregate Testing — WebSocket Telemetry & UI Controller
 * =======================================================
 * Connects to Python FastAPI backend (/ws/aggregate-testing), handles test mode selections & sliders,
 * drives 2D Impact test & Sieve graph in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class AggregateTestingSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        test_type: 'impact_value',
        moisture_content_pct: 4.5,
        fines_passing_236mm_g: 42.0,
        crushed_fines_236mm_g: 68.0,
        flaky_particles_g: 48.0
      };

      this.canvas2d = document.getElementById('aggregate-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.AggregateTesting3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/aggregate-testing`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Aggregate Testing Python Engine');
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

      setTxt('st-aiv', `${telemetry.aggregate_impact_value_pct.toFixed(1)}%`);
      setTxt('st-acv', `${telemetry.aggregate_crushing_value_pct.toFixed(1)}%`);
      setTxt('st-bulking', `${telemetry.sand_bulking_pct.toFixed(1)}%`);
      setTxt('st-fi', `${telemetry.flakiness_index_pct.toFixed(1)}%`);
      setTxt('st-test-name', telemetry.test_name);
      setTxt('st-suitability', telemetry.suitability_for_pavement);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry(telemetry);
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

      // Draw Impact Test Mold Base & Hammer
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 40, cy + 20, 80, 20);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - 30, cy - 10, 60, 30); // Cylinder

      ctx.fillStyle = '#34d399';
      ctx.fillRect(cx - 20, cy - 80, 40, 50); // Hammer

      // Right Side Bulking Curve Graph
      const gx = w * 0.52;
      const gy = h * 0.25;
      const gw = 240;
      const gh = 150;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, gw, gh);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px var(--font-sans)';
      ctx.fillText('Sand Bulking vs Moisture Content', gx + 20, gy - 10);

      // Parabolic Bulking Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let m = 0; m <= 12; m += 0.2) {
        const px = gx + (m / 12.0) * gw;
        let b = m <= 5 ? (m / 5.0) * 35.0 : 35.0 - ((m - 5.0) / 7.0) * 35.0;
        const py = gy + gh - (b / 40.0) * gh;
        if (m === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    bindControls() {
      const testBtns = document.querySelectorAll('[data-test-type]');
      testBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          testBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.test_type = btn.dataset.testType;
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

      bindSlider('slider-fines', 'val-fines', 'fines_passing_236mm_g', ' g');
      bindSlider('slider-crush', 'val-crush', 'crushed_fines_236mm_g', ' g');
      bindSlider('slider-moisture', 'val-moisture', 'moisture_content_pct', '%');
      bindSlider('slider-flaky', 'val-flaky', 'flaky_particles_g', ' g');
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
          fetch('/api/aggregate-testing/presets')
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
    window.aggregateTestingApp = new AggregateTestingSimulatorApp();
  });
})();
