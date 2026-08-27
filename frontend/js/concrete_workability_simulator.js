/**
 * Concrete Workability Lab (IS 1199) — 2D Canvas & WebSocket Telemetry Client
 * ===========================================================================
 * Handles real-time 2D slump cone drawing, compacting factor cylinder balance,
 * and bidirectional WebSocket communication with Python FastAPI backend.
 */

(function () {
  'use strict';

  let ws = null;
  let animId = null;

  const state = {
    water_cement_ratio: 0.50,
    aggregate_max_size_mm: 20.0,
    sand_aggregate_ratio: 0.35,
    admixture_dosage_percent: 0.0,
    test_type: 'slump_cone',
    slump_mm: 75.0,
    slump_type: 'True Slump',
    compacting_factor: 0.88,
    vee_bee_seconds: 6.5,
    flow_percent: 45.0,
    degree_of_workability: 'Medium',
    suitable_applications: 'Normal reinforced concrete, manual compaction, heavily reinforced sections.',
    is_code_compliance: 'Conforms to IS 1199 & IS 456 Table 2 (Degree: Medium).'
  };

  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/concrete-workability`;

    const wsBadge = document.getElementById('ws-badge');
    const wsText = document.getElementById('ws-text');

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = function () {
        if (wsBadge) wsBadge.className = 'ws-status-badge connected';
        if (wsText) wsText.textContent = 'Python Physics Connected';
        sendStateUpdate();
      };

      ws.onmessage = function (event) {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state_update') {
            Object.assign(state, msg.payload);
            updateUI();
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };

      ws.onclose = function () {
        if (wsBadge) wsBadge.className = 'ws-status-badge disconnected';
        if (wsText) wsText.textContent = 'Offline (Client Physics)';
        setTimeout(initWebSocket, 3000);
      };
    } catch (e) {
      console.warn('WebSocket connection error, running offline fallback', e);
    }
  }

  function sendStateUpdate() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'set_state',
        payload: {
          water_cement_ratio: parseFloat(state.water_cement_ratio),
          aggregate_max_size_mm: parseFloat(state.aggregate_max_size_mm),
          sand_aggregate_ratio: parseFloat(state.sand_aggregate_ratio),
          admixture_dosage_percent: parseFloat(state.admixture_dosage_percent),
          test_type: state.test_type
        }
      }));
    }
  }

  function updateUI() {
    // Sliders and labels
    const elWc = document.getElementById('val-wc');
    if (elWc) elWc.textContent = parseFloat(state.water_cement_ratio).toFixed(2);

    const elAgg = document.getElementById('val-agg');
    if (elAgg) elAgg.textContent = `${parseFloat(state.aggregate_max_size_mm).toFixed(0)} mm`;

    const elSp = document.getElementById('val-sp');
    if (elSp) elSp.textContent = `${parseFloat(state.admixture_dosage_percent).toFixed(1)}%`;

    // Telemetry fields
    const stSlump = document.getElementById('st-slump');
    if (stSlump) stSlump.textContent = `${parseFloat(state.slump_mm).toFixed(1)} mm`;

    const stCf = document.getElementById('st-cf');
    if (stCf) stCf.textContent = parseFloat(state.compacting_factor).toFixed(3);

    const stVb = document.getElementById('st-vb');
    if (stVb) stVb.textContent = `${parseFloat(state.vee_bee_seconds).toFixed(1)} s`;

    const stFlow = document.getElementById('st-flow');
    if (stFlow) stFlow.textContent = `${parseFloat(state.flow_percent).toFixed(1)}%`;

    const stDegree = document.getElementById('st-degree');
    if (stDegree) stDegree.textContent = `Degree: ${state.degree_of_workability}`;

    const stSuit = document.getElementById('st-suitability');
    if (stSuit) stSuit.textContent = `Suitable: ${state.suitable_applications}`;

    const stNote = document.getElementById('st-note');
    if (stNote) stNote.textContent = state.is_code_compliance;
  }

  function draw2D() {
    const canvas = document.getElementById('workability-2d-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#060b13');
    bgGrad.addColorStop(1, '#0e1624');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Base plate
    const baseY = h - 60;
    ctx.fillStyle = '#2a364f';
    ctx.fillRect(w * 0.1, baseY, w * 0.8, 12);
    ctx.fillStyle = '#00e676';
    ctx.fillRect(w * 0.1, baseY, w * 0.8, 2);

    if (state.test_type === 'slump_cone') {
      // Draw Slump Cone Frustum & Slumped Concrete
      const cx = w / 2;
      const initialHeight = 180; // 300mm scaled
      const slumpPx = (state.slump_mm / 300.0) * initialHeight;
      const currentHeight = Math.max(initialHeight - slumpPx, 20);

      // 1. Slump Cone Outline (Reference Frustum)
      ctx.strokeStyle = 'rgba(41, 182, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 30, baseY - initialHeight);
      ctx.lineTo(cx + 30, baseY - initialHeight);
      ctx.lineTo(cx + 60, baseY);
      ctx.lineTo(cx - 60, baseY);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Deformed Concrete Mass
      const concGrad = ctx.createLinearGradient(cx - 60, 0, cx + 60, 0);
      concGrad.addColorStop(0, '#607274');
      concGrad.addColorStop(0.5, '#9BA4B5');
      concGrad.addColorStop(1, '#607274');
      ctx.fillStyle = concGrad;

      const spreadWidth = 60 + (slumpPx * 0.35);
      ctx.beginPath();
      ctx.moveTo(cx - (30 + slumpPx * 0.15), baseY - currentHeight);
      ctx.quadraticCurveTo(cx, baseY - currentHeight - 5, cx + (30 + slumpPx * 0.15), baseY - currentHeight);
      ctx.lineTo(cx + spreadWidth, baseY);
      ctx.lineTo(cx - spreadWidth, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Slump Height Measurement Arrow & Text
      ctx.strokeStyle = '#ffd600';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 80, baseY - initialHeight);
      ctx.lineTo(cx + 80, baseY - currentHeight);
      ctx.stroke();

      ctx.fillStyle = '#ffd600';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`Slump = ${state.slump_mm.toFixed(1)} mm`, cx + 90, baseY - initialHeight + (slumpPx / 2));
      ctx.fillText(`Type: ${state.slump_type}`, cx + 90, baseY - initialHeight + (slumpPx / 2) + 16);

    } else if (state.test_type === 'compacting_factor') {
      // Compacting Factor Apparatus 2D schematic
      const cx = w / 2;
      ctx.fillStyle = '#29b6f6';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Compacting Factor Apparatus (IS 1199)', cx - 110, 30);

      // Upper Hopper
      ctx.strokeStyle = '#29b6f6';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 60, 50, 120, 50);
      ctx.fillStyle = 'rgba(41,182,246,0.15)';
      ctx.fillRect(cx - 60, 50, 120, 50);
      ctx.fillStyle = '#dde3f0';
      ctx.font = '11px sans-serif';
      ctx.fillText('Upper Hopper', cx - 35, 78);

      // Lower Hopper
      ctx.strokeRect(cx - 50, 130, 100, 45);
      ctx.fillStyle = 'rgba(41,182,246,0.15)';
      ctx.fillRect(cx - 50, 130, 100, 45);
      ctx.fillStyle = '#dde3f0';
      ctx.fillText('Lower Hopper', cx - 35, 158);

      // Cylinder
      ctx.strokeStyle = '#00e676';
      ctx.strokeRect(cx - 40, 205, 80, 70);
      ctx.fillStyle = 'rgba(0,230,118,0.2)';
      ctx.fillRect(cx - 40, 205, 80, 70);
      ctx.fillStyle = '#00e676';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`CF = ${state.compacting_factor.toFixed(3)}`, cx - 35, 245);
    }

    animId = requestAnimationFrame(draw2D);
  }

  function initControls() {
    const sWc = document.getElementById('slider-wc');
    if (sWc) {
      sWc.addEventListener('input', (e) => {
        state.water_cement_ratio = parseFloat(e.target.value);
        updateUI();
        sendStateUpdate();
      });
    }

    const sAgg = document.getElementById('slider-agg');
    if (sAgg) {
      sAgg.addEventListener('input', (e) => {
        state.aggregate_max_size_mm = parseFloat(e.target.value);
        updateUI();
        sendStateUpdate();
      });
    }

    const sSp = document.getElementById('slider-sp');
    if (sSp) {
      sSp.addEventListener('input', (e) => {
        state.admixture_dosage_percent = parseFloat(e.target.value);
        updateUI();
        sendStateUpdate();
      });
    }

    document.querySelectorAll('[data-test-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-test-type]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.test_type = btn.dataset.testType;
        const testLabel = document.getElementById('st-test-name');
        if (testLabel) testLabel.textContent = btn.textContent;
        updateUI();
        sendStateUpdate();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initWebSocket();
      initControls();
      draw2D();
    });
  } else {
    initWebSocket();
    initControls();
    draw2D();
  }
})();
