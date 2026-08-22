/**
 * Stress-Strain WebSocket Controller & 2D Curve Schematic Binders
 */
document.addEventListener('DOMContentLoaded', () => {
  const visualizer3D = new StressStrain3D('webgl-canvas');

  // WebSocket Manager
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/stress-strain`;
  let socket = null;

  const badge = document.getElementById('ws-badge');
  const wsText = document.getElementById('ws-text');

  function connectWS() {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      badge.classList.add('connected');
      wsText.textContent = 'Python Mechanics Connected (WebSocket)';
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
      applied_force_kn: parseFloat(document.getElementById('slider-force').value),
      specimen_diameter_mm: parseFloat(document.getElementById('slider-d').value),
      youngs_modulus_gpa: parseFloat(document.getElementById('slider-e').value),
      poissons_ratio: parseFloat(document.getElementById('slider-nu').value),
    };
    socket.send(JSON.stringify({ type: 'set_state', payload }));
  }

  function updateDOM(data) {
    document.getElementById('st-stress').textContent = `${data.axial_stress_mpa.toFixed(1)} MPa`;
    document.getElementById('st-strain').textContent = `${data.axial_strain_micro.toFixed(0)} µε`;
    document.getElementById('st-elong').textContent = `${data.elongation_mm.toFixed(4)} mm`;
    document.getElementById('st-g').textContent = `${data.shear_modulus_gpa.toFixed(1)} GPa`;
    document.getElementById('st-note').textContent = data.status_note;

    visualizer3D.updateStrain(data.elongation_mm);
    draw2DCurve(data);
  }

  // Bind sliders
  ['slider-force', 'slider-d', 'slider-e', 'slider-nu'].forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      document.getElementById(`val-${id.replace('slider-', '')}`).textContent =
        id.includes('force') ? `${input.value} kN` : id.includes('d') ? `${input.value} mm` : id.includes('e') ? `${input.value} GPa` : input.value;
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

  // 2D Stress-Strain Curve & Specimen Renderer
  function draw2DCurve(data) {
    const canvas = document.getElementById('2d-schematic-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);

    ctx.clearRect(0, 0, w, h);

    // Axes
    const pad = 40;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, 20);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - 20, h - pad);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('Stress σ (MPa)', pad - 10, 14);
    ctx.fillText('Strain ε (µε)', w - 60, h - pad + 25);

    // Elastic Hooke's Line
    const maxStressView = 600;
    const maxStrainView = 3000;

    const currX = pad + (data.axial_strain_micro / maxStrainView) * (w - pad - 30);
    const currY = (h - pad) - (data.axial_stress_mpa / maxStressView) * (h - pad - 30);

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    // Operating Point Dot
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(currX, currY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`(${data.axial_strain_micro.toFixed(0)} µε, ${data.axial_stress_mpa.toFixed(1)} MPa)`, currX + 8, currY - 8);
  }
});
