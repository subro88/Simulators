/**
 * V2 Batch 4 — 2D Schematic Renderers.
 * Each function draws an engineering schematic for its tool from the live
 * telemetry "data" returned by the Python engine. Signature: (ctx, w, h, data, cfg).
 */
window.V2_2D = {

  _bg(ctx, w, h) {
    ctx.fillStyle = "#04090f";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  },

  "stress-strain"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const pad = 34;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.moveTo(pad, 16); ctx.lineTo(pad, h - pad); ctx.lineTo(w - 16, h - pad); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif";
    ctx.fillText("σ (MPa)", pad - 8, 12); ctx.fillText("ε (µε)", w - 50, h - pad + 22);
    const sx = (d.axial_strain * 1e6) / 3000, sy = d.axial_stress_mpa / 600;
    const px = pad + sx * (w - pad - 30), py = (h - pad) - sy * (h - pad - 24);
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(px, py); ctx.stroke();
    ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill();
    ctx.fillText(`(${(d.axial_strain * 1e6).toFixed(0)} µε, ${d.axial_stress_mpa.toFixed(1)} MPa)`, px + 8, py - 8);
  },

  "mohrs-circle"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) / 2 / Math.max(50, d.radius_r_mpa * 1.3, Math.abs(d.center_sigma_avg_mpa) + d.radius_r_mpa + 10);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    const ccx = cx + d.center_sigma_avg_mpa * scale;
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ccx, cy, d.radius_r_mpa * scale, 0, 7); ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    [d.principal_stress_1_mpa, d.principal_stress_2_mpa].forEach((s, i) => {
      ctx.beginPath(); ctx.arc(cx + s * scale, cy, 5, 0, 7); ctx.fill();
    });
    const tx = cx + (d.transformed_sigma_x_prime_mpa) * scale;
    const ty = cy - d.transformed_tau_x_prime_y_prime_mpa * scale;
    ctx.fillStyle = "#3ddc84"; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif";
    ctx.fillText("σ", w - 14, cy - 4); ctx.fillText("τ", cx + 4, 12);
  },

  "shaft-torsion"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cy = h / 2;
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 18; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(w - 20, cy); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) {
      const x = 20 + (w - 40) * i / 10;
      ctx.beginPath(); ctx.moveTo(x, cy - 12); ctx.lineTo(x, cy + 12); ctx.stroke();
    }
    const twist = Math.min(1, d.angle_of_twist_deg / 30);
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20, cy - 40);
    for (let i = 0; i <= 10; i++) { const x = 20 + (w - 40) * i / 10; ctx.lineTo(x, cy - 40 + twist * i * 6); }
    ctx.stroke();
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`τmax = ${d.max_shear_stress_mpa.toFixed(1)} MPa   θ = ${d.angle_of_twist_deg.toFixed(2)}°   P = ${d.transmitted_power_kw.toFixed(2)} kW`, 20, h - 14);
  },

  "column-buckling"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const xc = w / 2;
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 14; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(xc, 20); ctx.lineTo(xc, h - 20); ctx.stroke();
    const amp = 18 * Math.min(1, d.slenderness_ratio / 200);
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, y = 20 + (h - 40) * t;
      const x = xc + amp * Math.sin(Math.PI * t);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif";
    ctx.fillText(`End: ${d.effective_length_m.toFixed(2)} m eff.`, 12, 16);
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`λ=${d.slenderness_ratio.toFixed(0)}  Euler=${d.euler_critical_load_kn.toFixed(1)} kN  Rankine=${d.rankine_critical_load_kn.toFixed(1)} kN`, 12, h - 10);
  },

  "pressure-vessel"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cx = w / 2, cy = h / 2, rw = w * 0.32, rh = h * 0.28;
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(cx, cy, rw, rh, 0, 0, 7); ctx.stroke();
    // Hoop (horizontal) arrows
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath(); ctx.moveTo(cx, cy + i * rh); ctx.lineTo(cx + i * rw, cy + i * rh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - i * rh); ctx.lineTo(cx + i * rw, cy - i * rh); ctx.stroke();
    }
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`σh = ${d.hoop_stress_mpa.toFixed(1)} MPa (hoop)`, 12, h - 28);
    ctx.fillText(`σL = ${d.longitudinal_stress_mpa.toFixed(1)} MPa (long.)`, 12, h - 12);
  },

  "spring-design"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cx = w / 2, top = 20, coils = Math.max(3, 8);
    const defl = Math.min(1, d.deflection_mm / 80);
    const pitch = (h - 60) / coils;
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= coils; i++) {
      const y = top + i * pitch * (1 - defl * 0.4);
      ctx.moveTo(cx - 40, y); ctx.lineTo(cx + 40, y + pitch * 0.5 * (1 - defl * 0.4));
    }
    ctx.stroke();
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`Kw=${d.wahl_factor_kw.toFixed(3)}  τ=${d.max_shear_stress_mpa.toFixed(1)} MPa`, 12, h - 28);
    ctx.fillText(`δ=${d.deflection_mm.toFixed(2)} mm  k=${d.spring_rate_n_mm.toFixed(2)} N/mm`, 12, h - 12);
  },

  "bolted-joint"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = "#1f2535"; ctx.fillRect(cx - 60, cy - 40, 120, 80);
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(cx, cy - 60); ctx.lineTo(cx, cy + 60); ctx.stroke();
    ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(cx, cy - 60, 14, 0, 7); ctx.fill();
    ctx.strokeStyle = "#3ddc84"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy - 60, 22, 0, 5); ctx.stroke();
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`Preload Fi=${d.preload_force_kn.toFixed(1)} kN`, 12, h - 28);
    ctx.fillText(`Torque T=${d.tightening_torque_nm.toFixed(1)} N·m`, 12, h - 12);
  },

  "riveted-joints"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cy = h / 2;
    ctx.fillStyle = "#1f2535"; ctx.fillRect(20, cy - 26, w - 40, 52);
    ctx.fillStyle = "#f59e0b";
    for (let x = 50; x < w - 30; x += 70) ctx.beginPath(), ctx.arc(x, cy, 9, 0, 7), ctx.fill();
    ctx.strokeStyle = d.governing_mode.indexOf("Tear") >= 0 ? "#ff5252" : d.governing_mode.indexOf("Shear") >= 0 ? "#ff9800" : "#f59e0b";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, cy - 26, w - 40, 52);
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`η=${d.joint_efficiency_pct.toFixed(1)}%  Governs: ${d.governing_mode}`, 12, h - 12);
  },

  "rivet-joint-designer"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const p = d.recommended_pitch_mm || 60, m = d.recommended_margin_mm || 30;
    const scale = (w - 40) / (Math.max(p * 4, 200));
    const plate = 26, y = h / 2;
    ctx.fillStyle = "#1f2535"; ctx.fillRect(20, y - plate, w - 40, plate * 2);
    ctx.fillStyle = "#f59e0b";
    const step = p * scale;
    for (let r = 0; r < 2; r++) {
      let x = 20 + (m + p / 2) * scale + r * 10;
      while (x < w - 20 - m * scale) {
        ctx.beginPath(); ctx.arc(x, y - plate / 2 + r * plate, 7, 0, 7); ctx.fill();
        x += step;
      }
    }
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`p=${p.toFixed(0)}mm  m=${m.toFixed(0)}mm  rows→${d.rivets_per_row} rivets  η=${d.joint_efficiency_pct.toFixed(1)}%`, 12, h - 10);
  },

  "weld-strength"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cx = w / 2, cy = h / 2, s = Math.min(40, 14 + (d.throat_thickness_mm || 6) * 2);
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx - 50, cy + 30); ctx.lineTo(cx + 50, cy + 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 50, cy - 30); ctx.lineTo(cx + 50, cy - 30); ctx.stroke();
    // fillet weld triangle
    ctx.fillStyle = "rgba(245,158,11,0.8)";
    ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + s, cy + 30); ctx.lineTo(cx, cy + 30); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#3ddc84"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + s * 0.707, cy + 30 - s * 0.707); ctx.stroke();
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`throat=${d.throat_thickness_mm.toFixed(2)}mm  τ=${d.actual_shear_stress_mpa.toFixed(1)}MPa  FoS=${d.weld_safety_factor.toFixed(2)}`, 12, h - 12);
  },

  "crack-propagation"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const cy = h / 2;
    ctx.fillStyle = "#1f2535"; ctx.fillRect(20, cy - 40, w - 40, 80);
    const a = Math.min(w - 80, (d.critical_crack_size_mm || 10) * 2);
    ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(40 + a, cy); ctx.stroke();
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40 + a, cy - 20); ctx.lineTo(40 + a, cy + 20); ctx.stroke();
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`KI=${d.stress_intensity_ki_mpam.toFixed(2)} MPa√m  ac=${d.critical_crack_size_mm.toFixed(2)}mm`, 12, h - 28);
    ctx.fillText(`Nf=${Math.round(d.cycles_to_failure_nf).toLocaleString()} cycles`, 12, h - 12);
  },

  "truss-analysis"(ctx, w, h, d) {
    this._bg(ctx, w, h);
    const type = (d.truss_type || "").toLowerCase();
    const x0 = 30, x1 = w - 30, y0 = 30, y1 = h - 40;
    const L = x1 - x0, H = (y1 - y0) * 0.5, cy = (y0 + y1) / 2;
    const n = 4;
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 4;
    const top = (i) => [x0 + L * i / n, y0];
    const bot = (i) => [x0 + L * i / n, cy + H * 0.5];
    const draw = (a, b) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
    for (let i = 0; i <= n; i++) draw(top(i), bot(i));
    for (let i = 0; i < n; i++) { draw(bot(i), bot(i + 1)); if (type.indexOf("warren") >= 0) draw(bot(i), top(i + 1)); else draw(top(i), top(i + 1)); }
    if (type.indexOf("pratt") >= 0 || type.indexOf("howe") >= 0) for (let i = 0; i < n; i++) draw(bot(i), top(i + 1));
    ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(bot(2)[0], bot(2)[1], 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#3ddc84"; ctx.font = "11px monospace";
    ctx.fillText(`Ay=By=${d.left_reaction_ay_kn.toFixed(1)}kN  C=${d.max_compression_force_kn.toFixed(1)}kN  T=${d.max_tension_force_kn.toFixed(1)}kN`, 12, h - 12);
  },
};
