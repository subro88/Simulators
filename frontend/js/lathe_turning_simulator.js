/**
 * Lathe Turning WebSocket & UI Controller
 * ========================================
 * Synchronizes inputs via WebSocket /ws/lathe-turning, updates WebGL 3D view,
 * populates outputs, handles presets, and renders 2D telemetry canvas.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Instantiate 3D WebGL
  const renderer3D = new LatheTurning3D('webgl-canvas');

  // DOM Elements
  const wsBadge = document.getElementById('ws-badge');
  const wsText = document.getElementById('ws-text');

  const inputDiameter = document.getElementById('input-diameter');
  const inputSpeed = document.getElementById('input-speed');
  const inputFeed = document.getElementById('input-feed');
  const inputDoc = document.getElementById('input-doc');

  const valDiameter = document.getElementById('val-diameter');
  const valSpeed = document.getElementById('val-speed');
  const valFeed = document.getElementById('val-feed');
  const valDoc = document.getElementById('val-doc');

  const resVc = document.getElementById('res-vc');
  const resMrr = document.getElementById('res-mrr');
  const resFc = document.getElementById('res-fc');
  const resPower = document.getElementById('res-power');
  const resTime = document.getElementById('res-time');
  const statusNote = document.getElementById('status-note');

  const presetSelect = document.getElementById('preset-select');
  const btnExplode = document.getElementById('btn-toggle-explode');
  const btnResetCam = document.getElementById('btn-reset-cam');

  // Telemetry Chart Canvas
  const chartCanvas = document.getElementById('telemetry-chart-canvas');
  const chartCtx = chartCanvas ? chartCanvas.getContext('2d') : null;
  const historyFc = [];
  const historyMrr = [];

  // WebSocket Connection
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/lathe-turning`;
  let socket = null;

  function connectWebSocket() {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      wsBadge.classList.add('connected');
      wsText.textContent = 'Engine Connected (WebSocket Active)';
      sendParamsUpdate();
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state_update' || msg.type === 'preset_applied') {
        updateUIOutputs(msg.payload);
      }
    };

    socket.onclose = () => {
      wsBadge.classList.remove('connected');
      wsText.textContent = 'Disconnected. Reconnecting...';
      setTimeout(connectWebSocket, 3000);
    };
  }

  function sendParamsUpdate() {
    const d0 = parseFloat(inputDiameter.value);
    const n = parseFloat(inputSpeed.value);
    const f = parseFloat(inputFeed.value);
    const ap = parseFloat(inputDoc.value);

    valDiameter.textContent = `${d0.toFixed(1)} mm`;
    valSpeed.textContent = `${n.toFixed(0)} RPM`;
    valFeed.textContent = `${f.toFixed(2)} mm/rev`;
    valDoc.textContent = `${ap.toFixed(1)} mm`;

    if (renderer3D) {
      renderer3D.updateParams(n, d0);
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'update',
        params: {
          workpiece_diameter_mm: d0,
          spindle_speed_rpm: n,
          feed_rate_mm_rev: f,
          depth_of_cut_mm: ap
        }
      }));
    }
  }

  function updateUIOutputs(data) {
    if (!data) return;

    resVc.textContent = `${data.cutting_speed_m_min.toFixed(1)} m/min`;
    resMrr.textContent = `${data.material_removal_rate_cm3_min.toFixed(1)} cm³/min`;
    resFc.textContent = `${data.tangential_cutting_force_n.toFixed(0)} N`;
    resPower.textContent = `${data.spindle_power_kw.toFixed(2)} kW`;
    resTime.textContent = `${data.machining_time_sec.toFixed(1)} s`;
    statusNote.textContent = data.status_note || 'Calculated machining forces.';

    // Push data to chart
    historyFc.push(data.tangential_cutting_force_n);
    historyMrr.push(data.material_removal_rate_cm3_min * 10);
    if (historyFc.length > 50) historyFc.shift();
    if (historyMrr.length > 50) historyMrr.shift();

    drawTelemetryChart();
  }

  function drawTelemetryChart() {
    if (!chartCanvas || !chartCtx) return;
    const w = chartCanvas.width = chartCanvas.clientWidth;
    const h = chartCanvas.height = chartCanvas.clientHeight;

    chartCtx.clearRect(0, 0, w, h);
    chartCtx.fillStyle = '#0f172a';
    chartCtx.fillRect(0, 0, w, h);

    // Grid lines
    chartCtx.strokeStyle = '#334155';
    chartCtx.lineWidth = 1;
    for (let y = 30; y < h; y += 30) {
      chartCtx.beginPath();
      chartCtx.moveTo(0, y);
      chartCtx.lineTo(w, y);
      chartCtx.stroke();
    }

    // Draw Cutting Force Fc (Amber)
    if (historyFc.length > 1) {
      chartCtx.strokeStyle = '#f59e0b';
      chartCtx.lineWidth = 2;
      chartCtx.beginPath();
      const step = w / 50;
      for (let i = 0; i < historyFc.length; i++) {
        const x = i * step;
        const y = h - (historyFc[i] / 3000.0) * (h - 20);
        if (i === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
      }
      chartCtx.stroke();
    }

    // Legend
    chartCtx.fillStyle = '#f59e0b';
    chartCtx.font = '12px sans-serif';
    chartCtx.fillText('— Tangential Cutting Force Fc (N)', 10, 20);
  }

  // Event Listeners
  [inputDiameter, inputSpeed, inputFeed, inputDoc].forEach(el => {
    el.addEventListener('input', sendParamsUpdate);
  });

  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const presetKey = presetSelect.value;
      if (!presetKey) return;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'set_preset', preset: presetKey }));
      }
    });
  }

  if (btnExplode && renderer3D) {
    btnExplode.addEventListener('click', () => renderer3D.toggleExplodeView());
  }

  if (btnResetCam && renderer3D) {
    btnResetCam.addEventListener('click', () => renderer3D.resetCamera());
  }

  // Mode switching
  const modeTabs = document.querySelectorAll('#mode-tabs .pill');
  const modeSections = document.querySelectorAll('.mode-section');

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      modeSections.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `section-${tab.dataset.mode}`;
      const targetSec = document.getElementById(targetId);
      if (targetSec) targetSec.classList.add('active');
    });
  });

  connectWebSocket();
});
