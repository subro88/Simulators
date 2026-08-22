/**
 * Bernoulli's Principle WebSocket Controller & 2D Venturi Schematic Binders
 */
document.addEventListener('DOMContentLoaded', () => {
  const visualizer3D = new BernoullisPrinciple3D('webgl-canvas');

  // WebSocket Manager
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/bernoullis-principle`;
  let socket = null;

  const badge = document.getElementById('ws-badge');
  const wsText = document.getElementById('ws-text');

  function connectWS() {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      badge.classList.add('connected');
      wsText.textContent = 'Python Fluid Engine Connected (WebSocket)';
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state_update') {
        updateDOM(msg.payload);
      }
    };

    socket.onclose = () => {
      badge.classList.remove('connected');
      wsText.textContent = 'Disconnected. Retrying...';
      setTimeout(connectWS, 3000);
    };
  }

  connectWS();

  function sendState() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const payload = {
      pipe_diameter_mm: parseFloat(document.getElementById('slider-d1').value),
      throat_diameter_mm: parseFloat(document.getElementById('slider-d2').value),
      manometer_head_mm: parseFloat(document.getElementById('slider-h').value),
      inlet_pressure_kpa: parseFloat(document.getElementById('slider-p1').value),
    };
    socket.send(JSON.stringify({ type: 'set_state', payload }));
  }

  function updateDOM(data) {
    document.getElementById('st-v1').textContent = `${data.inlet_velocity_ms.toFixed(2)} m/s`;
    document.getElementById('st-v2').textContent = `${data.throat_velocity_ms.toFixed(2)} m/s`;
    document.getElementById('st-p2').textContent = `${data.throat_pressure_kpa.toFixed(1)} kPa`;
    document.getElementById('st-q').textContent = `${data.volumetric_flow_rate_lps.toFixed(2)} L/s`;
    document.getElementById('st-note').textContent = data.status_note;

    visualizer3D.updateFlow(data.inlet_velocity_ms, data.throat_velocity_ms);
    draw2DVENTURI(data);
  }

  // Bind sliders
  ['slider-d1', 'slider-d2', 'slider-h', 'slider-p1'].forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      document.getElementById(`val-${id.replace('slider-', '')}`).textContent =
        id.includes('d') ? `${input.value} mm` : id.includes('h') ? `${input.value} mm` : `${input.value} kPa`;
      sendState();
    });
  });

  // Controls buttons
  document.getElementById('btn-toggle-explode').addEventListener('click', () => visualizer3D.toggleExplode());
  document.getElementById('btn-reset-cam').addEventListener('click', () => visualizer3D.resetCamera());

  // Pill tabs
  document.querySelectorAll('#mode-tabs .pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-tabs .pill').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      document.querySelectorAll('.mode-section').forEach((sec) => sec.classList.remove('active'));
      if (document.getElementById(`section-${mode}`)) {
        document.getElementById(`section-${mode}`).classList.add('active');
      } else {
        document.getElementById('section-simulate').classList.add('active');
      }
    });
  });

  // 2D Venturi Schematic Canvas
  function draw2DVENTURI(data) {
    const canvas = document.getElementById('2d-schematic-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);

    ctx.clearRect(0, 0, w, h);

    const midY = h / 2.0;

    // Draw Tapered Venturi Duct Outline
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';

    ctx.beginPath();
    ctx.moveTo(20, midY - 60);
    ctx.lineTo(w * 0.3, midY - 60);
    ctx.lineTo(w * 0.45, midY - 25);
    ctx.lineTo(w * 0.55, midY - 25);
    ctx.lineTo(w * 0.75, midY - 60);
    ctx.lineTo(w - 20, midY - 60);

    ctx.lineTo(w - 20, midY + 60);
    ctx.lineTo(w * 0.75, midY + 60);
    ctx.lineTo(w * 0.55, midY + 25);
    ctx.lineTo(w * 0.45, midY + 25);
    ctx.lineTo(w * 0.3, midY + 60);
    ctx.lineTo(20, midY + 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Streamlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (let offset = -40; offset <= 40; offset += 20) {
      ctx.beginPath();
      ctx.moveTo(20, midY + offset);
      ctx.lineTo(w * 0.3, midY + offset);
      ctx.lineTo(w * 0.45, midY + offset * 0.4);
      ctx.lineTo(w * 0.55, midY + offset * 0.4);
      ctx.lineTo(w * 0.75, midY + offset);
      ctx.lineTo(w - 20, midY + offset);
      ctx.stroke();
    }

    // Velocity Overlay Text
    ctx.fillStyle = '#f59e0b';
    ctx.font = '12px sans-serif';
    ctx.fillText(`v1 = ${data.inlet_velocity_ms.toFixed(2)} m/s`, w * 0.1, midY + 5);
    ctx.fillText(`v2 = ${data.throat_velocity_ms.toFixed(2)} m/s`, w * 0.47, midY + 5);
  }
});
