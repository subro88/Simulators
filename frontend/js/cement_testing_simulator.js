/**
 * Cement Testing — WebSocket Telemetry & UI Controller
 * ====================================================
 * Connects to Python FastAPI backend (/ws/cement-testing), handles test mode selections & sliders,
 * drives 2D Vicat apparatus & Sieve graph in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class CementTestingSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        test_type: 'consistency',
        cement_grade: 'opc_43',
        water_percentage: 28.5,
        elapsed_time_min: 45,
        sieve_residue_g: 4.2,
        curing_days: 7
      };

      this.canvas2d = document.getElementById('cement-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.CementTesting3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/cement-testing`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Cement Testing Python Engine');
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

      setTxt('st-pen', `${telemetry.penetration_depth_mm.toFixed(1)} mm`);
      setTxt('st-init-time', `${Math.round(telemetry.initial_setting_time_min)} min`);
      setTxt('st-fin-time', `${Math.round(telemetry.final_setting_time_min)} min`);
      setTxt('st-fine', `${telemetry.fineness_percentage.toFixed(1)}%`);
      setTxt('st-strength', `${telemetry.compressive_strength_mpa.toFixed(1)} MPa`);
      setTxt('st-test-name', telemetry.test_name);
      setTxt('st-status', telemetry.compliance_status);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          penetration_depth_mm: telemetry.penetration_depth_mm
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

      // Vicat Mold Frame
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.strokeRect(cx - 50, cy - 30, 100, 70);

      // Cement Paste Fill
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 48, cy - 28, 96, 66);

      // Plunger Needle
      const dropY = (10.0 - telemetry.penetration_depth_mm) * 4.0;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 3, cy - 100 + dropY, 6, 90);

      // Target Penetration Marker (5-7mm from bottom)
      ctx.strokeStyle = '#34d399';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy + 32);
      ctx.lineTo(cx + 60, cy + 32);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#34d399';
      ctx.font = '11px var(--font-sans)';
      ctx.fillText('Target 5-7mm Bottom Line', cx + 65, cy + 35);

      // Right Panel Info Graph
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px var(--font-sans)';
      ctx.fillText(`Test: ${telemetry.test_name}`, w * 0.52, 40);

      ctx.fillStyle = telemetry.is_standard_consistency ? '#34d399' : '#f59e0b';
      ctx.fillText(`Compliance: ${telemetry.compliance_status}`, w * 0.52, 70);
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

      bindSlider('slider-water', 'val-water', 'water_percentage', '%');
      bindSlider('slider-time', 'val-time', 'elapsed_time_min', ' min');
      bindSlider('slider-sieve', 'val-sieve', 'sieve_residue_g', ' g');
      bindSlider('slider-days', 'val-days', 'curing_days', ' days');
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
          fetch('/api/cement-testing/presets')
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
    window.cementTestingApp = new CementTestingSimulatorApp();
  });
})();
