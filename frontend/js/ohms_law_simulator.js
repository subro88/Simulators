/**
 * Ohm's Law WebSocket Controller & 2D Circuit Schematic Binders
 */
document.addEventListener('DOMContentLoaded', () => {
  const visualizer3D = new OhmsLaw3D('webgl-canvas');

  // WebSocket Manager
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/ohms-law`;
  let socket = null;

  const badge = document.getElementById('ws-badge');
  const wsText = document.getElementById('ws-text');

  function connectWS() {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      badge.classList.add('connected');
      wsText.textContent = 'Python Electrical Engine Connected (WebSocket)';
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
      supply_voltage_v: parseFloat(document.getElementById('slider-v').value),
      resistor_1_ohms: parseFloat(document.getElementById('slider-r1').value),
      resistor_2_ohms: parseFloat(document.getElementById('slider-r2').value),
      connection_mode: document.getElementById('select-mode').value,
    };
    socket.send(JSON.stringify({ type: 'set_state', payload }));
  }

  function updateDOM(data) {
    document.getElementById('st-req').textContent = `${data.equivalent_resistance_ohms.toFixed(1)} Ω`;
    document.getElementById('st-i').textContent = `${data.circuit_current_ma.toFixed(1)} mA`;
    document.getElementById('st-p').textContent = `${data.total_power_watts.toFixed(2)} W`;
    document.getElementById('st-v1').textContent = `${data.r1_voltage_drop_v.toFixed(1)} V`;
    document.getElementById('st-note').textContent = data.status_note;

    visualizer3D.updateCurrent(data.circuit_current_amperes);
    draw2DCIRCUIT(data);
  }

  // Bind controls
  ['slider-v', 'slider-r1', 'slider-r2'].forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      document.getElementById(`val-${id.replace('slider-', '')}`).textContent =
        id.includes('v') ? `${input.value} V` : `${input.value} Ω`;
      sendState();
    });
  });

  document.getElementById('select-mode').addEventListener('change', (e) => {
    document.getElementById('val-mode').textContent = e.target.options[e.target.selectedIndex].text.split(' ')[0];
    sendState();
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

  // 2D DC Circuit Schematic Canvas
  function draw2DCIRCUIT(data) {
    const canvas = document.getElementById('2d-schematic-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);

    ctx.clearRect(0, 0, w, h);

    const pad = 40;

    // Outer Loop Wires
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(pad, pad, w - 2 * pad, h - 2 * pad);
    ctx.stroke();

    // DC Voltage Source Circle on Left Wire
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(pad - 15, h / 2 - 20, 30, 40);
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pad, h / 2, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '12px sans-serif';
    ctx.fillText('DC', pad - 8, h / 2 + 4);

    // Resistors on Top / Right Wires
    ctx.fillStyle = '#00f2fe';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Req = ${data.equivalent_resistance_ohms.toFixed(1)} Ω`, w / 2 - 40, pad - 10);
    ctx.fillText(`I = ${data.circuit_current_ma.toFixed(1)} mA`, w / 2 - 30, h - pad + 20);
  }
});
