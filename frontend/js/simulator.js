/**
 * Automotive Differential — WebSocket Telemetry & UI Controller
 * =============================================================
 * Handles bi-directional communication with the FastAPI physics backend,
 * state synchronization, and DOM updates.
 */

(function () {
  'use strict';

  class SimulatorApp {
    constructor() {
      this.socket = null;
      this.viewer3d = null;
      this.reconnectTimer = null;
      this.currentMode = 'simulate';

      this.state = {
        input_rpm: 1200,
        maneuver: 'straight',
        turn_bias: 60,
        spider_count: 2,
        axle_teeth: 14,
        spider_teeth: 10,
        engine_torque_nm: 200,
        left_traction_coeff: 0.9,
        right_traction_coeff: 0.9
      };

      this.init();
    }

    init() {
      // 1. Initialize 3D Viewer
      this.viewer3d = new window.Differential3DViewer('webgl-canvas');

      // 2. Establish WebSocket connection
      this.connectWebSocket();

      // 3. Bind UI Controls & Sliders
      this.bindControls();

      // 4. Bind Mode Tabs
      this.bindModeTabs();

      // 5. Bind Presets
      this.bindPresets();

      // 6. Bind Exploded View & Viewport Controls
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
          if (this.viewer3d) {
            this.viewer3d.resetView();
          }
        });
      }
    }

    connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:8080';
      const wsUrl = `${protocol}//${host}/ws/differential`;

      const badge = document.getElementById('ws-badge');
      const badgeText = document.getElementById('ws-text');

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected to Python physics engine');
          if (badge) badge.classList.remove('disconnected');
          if (badgeText) badgeText.textContent = 'Python Engine Connected';

          // Send current initial state
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
          console.warn('WebSocket disconnected. Retrying in 2 seconds...');
          if (badge) badge.classList.add('disconnected');
          if (badgeText) badgeText.textContent = 'Reconnecting...';

          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 2000);
        };

        this.socket.onerror = (err) => {
          console.error('WebSocket error:', err);
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
      // 1. Update live DOM readout numbers
      const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };

      setTxt('st-crown', `${Math.round(telemetry.crown_rpm)} RPM`);
      setTxt('st-left', `${Math.round(telemetry.left_rpm)} RPM`);
      setTxt('st-right', `${Math.round(telemetry.right_rpm)} RPM`);
      setTxt(
        'st-spider',
        telemetry.spider_rpm === 0
          ? '0.0 RPM (Locked)'
          : `${telemetry.spider_rpm > 0 ? '+' : ''}${telemetry.spider_rpm.toFixed(1)} RPM`
      );

      setTxt('st-torque-left', `${telemetry.left_torque_nm.toFixed(1)} N·m`);
      setTxt('st-torque-right', `${telemetry.right_torque_nm.toFixed(1)} N·m`);
      setTxt('st-power', `${telemetry.delivered_power_kw.toFixed(2)} kW`);

      setTxt('st-kinematic-eq', telemetry.kinematic_verification);
      setTxt('st-note', telemetry.status_note);

      // 2. Stream telemetry directly to 3D WebGL viewer
      if (this.viewer3d) {
        this.viewer3d.updateTelemetry(telemetry);
      }
    }

    bindControls() {
      // Maneuver buttons
      const maneuverBtns = document.querySelectorAll('[data-maneuver]');
      maneuverBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          maneuverBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.maneuver = btn.dataset.maneuver;
          this.sendState();
        });
      });

      // Sliders with value badges
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

      bindSlider('slider-rpm', 'val-rpm', 'input_rpm', ' RPM');
      bindSlider('slider-turn', 'val-turn', 'turn_bias', '%');
      bindSlider('slider-torque', 'val-torque', 'engine_torque_nm', ' N·m');

      // Spider Count
      const spiderBtns = document.querySelectorAll('[data-spider]');
      spiderBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          spiderBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.spider_count = parseInt(btn.dataset.spider, 10);
          this.sendState();
        });
      });
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
        if (el) {
          el.classList.toggle('active', sec === mode);
        }
      });

      // Special 3D Model focus
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

          fetch('/api/differential/presets')
            .then((r) => r.json())
            .then((presets) => {
              if (presets[val]) {
                const p = presets[val].params;
                Object.assign(this.state, p);

                // Update UI inputs
                if (p.input_rpm) {
                  const s = document.getElementById('slider-rpm');
                  if (s) s.value = p.input_rpm;
                  const b = document.getElementById('val-rpm');
                  if (b) b.textContent = `${p.input_rpm} RPM`;
                }
                if (p.maneuver) {
                  document.querySelectorAll('[data-maneuver]').forEach((b) => {
                    b.classList.toggle('active', b.dataset.maneuver === p.maneuver);
                  });
                }
                if (p.turn_bias) {
                  const s = document.getElementById('slider-turn');
                  if (s) s.value = p.turn_bias;
                  const b = document.getElementById('val-turn');
                  if (b) b.textContent = `${p.turn_bias}%`;
                }

                this.sendState();
              }
            });
        });
      }
    }
  }

  // Launch app when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new SimulatorApp();
  });
})();
