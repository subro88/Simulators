/**
 * Valve Timing Diagram — WebSocket Telemetry & UI Controller
 * ==========================================================
 * Connects to Python FastAPI backend (/ws/valve-timing), handles slider inputs,
 * drives 2D polar valve timing diagram in Simulate mode, and streams state to 3D WebGL viewer.
 */

(function () {
  'use strict';

  class ValveTimingSimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        engine_tuning: 'stock_economy',
        ivo_deg_btdc: 12,
        ivc_deg_abdc: 45,
        evo_deg_bbdc: 48,
        evc_deg_atdc: 14,
        engine_rpm: 3000,
        max_valve_lift_mm: 9.5
      };

      this.canvas2d = document.getElementById('valve-2d-canvas');
      this.ctx2d = this.canvas2d ? this.canvas2d.getContext('2d') : null;

      this.init();
    }

    init() {
      this.viewer3d = new window.ValveTiming3DViewer('webgl-canvas');
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
      const wsUrl = `${protocol}//${host}/ws/valve-timing`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Valve Timing Python Engine');
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

      setTxt('st-intake-dur', `${Math.round(telemetry.intake_duration_deg)}°`);
      setTxt('st-exhaust-dur', `${Math.round(telemetry.exhaust_duration_deg)}°`);
      setTxt('st-overlap', `${telemetry.valve_overlap_deg.toFixed(1)}°`);
      setTxt('st-ve', `${telemetry.volumetric_efficiency_pct.toFixed(1)}%`);
      setTxt('st-tuning', telemetry.tuning_name);
      setTxt('st-note', telemetry.status_note);

      if (this.viewer3d) {
        this.viewer3d.updateTelemetry({
          engine_rpm: this.state.engine_rpm
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
      const r = 120;

      // Outer Circle
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Vertical TDC - BDC Line
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - r - 20);
      ctx.lineTo(cx, cy + r + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px var(--font-sans)';
      ctx.fillText('TDC (0° / 720°)', cx - 45, cy - r - 25);
      ctx.fillText('BDC (180° / 540°)', cx - 50, cy + r + 35);

      // Draw Intake Arc (Blue)
      const ivoRad = (-90 - this.state.ivo_deg_btdc) * (Math.PI / 180.0);
      const ivcRad = (90 + this.state.ivc_deg_abdc) * (Math.PI / 180.0);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 15, ivoRad, ivcRad);
      ctx.stroke();

      // Draw Exhaust Arc (Orange)
      const evoRad = (90 - this.state.evo_deg_bbdc) * (Math.PI / 180.0);
      const evcRad = (-90 + this.state.evc_deg_atdc) * (Math.PI / 180.0);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 15, evoRad, evcRad);
      ctx.stroke();

      // Overlap Arc (Red)
      ctx.fillStyle = '#34d399';
      ctx.fillText(`Valve Overlap: ${telemetry.valve_overlap_deg.toFixed(0)}°`, cx - 55, cy + 5);
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

      bindSlider('slider-ivo', 'val-ivo', 'ivo_deg_btdc', '° BTDC');
      bindSlider('slider-ivc', 'val-ivc', 'ivc_deg_abdc', '° ABDC');
      bindSlider('slider-evo', 'val-evo', 'evo_deg_bbdc', '° BBDC');
      bindSlider('slider-evc', 'val-evc', 'evc_deg_atdc', '° ATDC');
      bindSlider('slider-rpm', 'val-rpm', 'engine_rpm', ' RPM');
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
          fetch('/api/valve-timing/presets')
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
    window.valveTimingApp = new ValveTimingSimulatorApp();
  });
})();
