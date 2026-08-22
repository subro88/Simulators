/**
 * Slider-Crank WebSocket Controller & 2D Schematic Binders
 */
document.addEventListener('DOMContentLoaded', () => {
  const visualizer3D = new SliderCrank3D('webgl-canvas');

  // WebSocket Manager
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/slider-crank`;
  let socket = null;

  const badge = document.getElementById('ws-badge');
  const wsText = document.getElementById('ws-text');

  function connectWS() {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      badge.classList.add('connected');
      wsText.textContent = 'Python Physics Connected (WebSocket)';
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
      crank_radius_mm: parseFloat(document.getElementById('slider-r').value),
      connecting_rod_mm: parseFloat(document.getElementById('slider-l').value),
      crank_rpm: parseFloat(document.getElementById('slider-rpm').value),
      crank_angle_deg: parseFloat(document.getElementById('slider-theta').value),
    };
    socket.send(JSON.stringify({ type: 'set_state', payload }));
  }

  function updateDOM(data) {
    document.getElementById('st-lambda').textContent = data.obliquity_ratio.toFixed(3);
    document.getElementById('st-disp').textContent = `${data.piston_displacement_mm.toFixed(1)} mm`;
    document.getElementById('st-vel').textContent = `${data.piston_velocity_ms.toFixed(2)} m/s`;
    document.getElementById('st-acc').textContent = `${data.piston_acceleration_ms2.toFixed(1)} m/s²`;
    document.getElementById('st-note').textContent = data.status_note;

    const thetaDeg = parseFloat(document.getElementById('slider-theta').value);
    visualizer3D.updateKinematics((thetaDeg * Math.PI) / 180, data.piston_displacement_mm);
    draw2DSchematic(data);
  }

  // Bind sliders
  ['slider-r', 'slider-l', 'slider-rpm', 'slider-theta'].forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      document.getElementById(`val-${id.replace('slider-', '')}`).textContent =
        id.includes('theta') ? `${input.value}°` : id.includes('rpm') ? `${input.value} RPM` : `${input.value} mm`;
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

  // 2D Schematic Renderer
  function draw2DSchematic(data) {
    const canvas = document.getElementById('2d-schematic-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);

    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.3;
    const cy = h * 0.5;

    const r = parseFloat(document.getElementById('slider-r').value) * 0.8;
    const l = parseFloat(document.getElementById('slider-l').value) * 0.8;
    const thetaRad = (parseFloat(document.getElementById('slider-theta').value) * Math.PI) / 180;

    const pinAx = cx + r * Math.cos(thetaRad);
    const pinAy = cy - r * Math.sin(thetaRad);

    const phiRad = Math.asin((r / l) * Math.sin(thetaRad));
    const pistonX = cx + r * Math.cos(thetaRad) + l * Math.cos(phiRad);

    // Draw Ground Pivot
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw Crank
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pinAx, pinAy);
    ctx.stroke();

    // Draw Connecting Rod
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(pinAx, pinAy);
    ctx.lineTo(pistonX, cy);
    ctx.stroke();

    // Draw Piston
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(pistonX - 20, cy - 15, 40, 30);
  }
});
