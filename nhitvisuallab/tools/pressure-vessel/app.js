(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  function $(s)  { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ================================================================
     STATE
     ================================================================ */
  var state = {
    mode: 'simulate',
    vessel: 'cylinder',  // 'cylinder' | 'sphere'
    p:  5,    // MPa
    d:  400,  // mm
    t:  10,   // mm
    sy: 250,  // MPa
    units: 'si'          // 'si' | 'imp' — display only; the model stays SI
  };

  /* ================================================================
     DISPLAY UNITS
     All physics below stays in SI (MPa, mm). Imperial is a presentation
     layer, so the calculation cannot drift between the two systems.
     ASME vessel practice quotes pressure in psi and material strength in
     ksi, so those two take different factors.
     ================================================================ */
  function isImp() { return state.units === 'imp'; }
  var CONV = {
    press:  { f: 145.0377,  si: 'MPa', imp: 'psi', dSI: 1, dImp: 0 },   /* MPa → psi  */
    stress: { f: 0.1450377, si: 'MPa', imp: 'ksi', dSI: 1, dImp: 2 },   /* MPa → ksi  */
    len:    { f: 0.0393701, si: 'mm',  imp: 'in',  dSI: 0, dImp: 2 }    /* mm  → in   */
  };
  function cv(val, kind)  { var c = CONV[kind]; return isImp() ? val * c.f : val; }
  function uL(kind)       { var c = CONV[kind]; return isImp() ? c.imp : c.si; }
  function dp(kind)       { var c = CONV[kind]; return isImp() ? c.dImp : c.dSI; }
  /* value + unit, in the active system */
  function vu(val, kind)  { return cv(val, kind).toFixed(dp(kind)) + ' ' + uL(kind); }

  /* Single owner of the four slider captions. The range inputs keep their SI
     positions so dragging feels identical in either system; only the caption
     text changes. */
  function syncSliderLabels() {
    var set = function (id, val, kind) { var e = $(id); if (e) e.textContent = vu(val, kind); };
    set('#val-p',  state.p,  'press');
    set('#val-d',  state.d,  'len');
    set('#val-t',  state.t,  'len');
    set('#val-sy', state.sy, 'stress');
  }

  /* ================================================================
     PHYSICS
     ================================================================ */
  function compute(p, d, t, sy) {
    var sigma_h      = (p * d) / (2 * t);          // hoop stress MPa
    var sigma_l      = (p * d) / (4 * t);          // longitudinal stress MPa
    var sigma_sphere = (p * d) / (4 * t);          // sphere stress MPa
    var fos_cyl      = sy / sigma_h;               // FOS cylinder
    var fos_sphere   = sy / sigma_sphere;          // FOS sphere
    var dt_ratio     = d / t;
    var isThinWall   = dt_ratio >= 20;
    return {
      sigma_h: sigma_h,
      sigma_l: sigma_l,
      sigma_sphere: sigma_sphere,
      fos_cyl: fos_cyl,
      fos_sphere: fos_sphere,
      dt_ratio: dt_ratio,
      isThinWall: isThinWall
    };
  }

  function statusFromFOS(fos) {
    if (fos >= 3)   return 'SAFE';
    if (fos >= 1.5) return 'CAUTION';
    return 'DANGER';
  }

  function colorFromFOS(fos) {
    if (fos >= 3)   return '#3ddc84';
    if (fos >= 1.5) return '#f5c842';
    return '#ff5555';
  }

  /* ================================================================
     CANVAS DRAWING
     ================================================================ */
  var canvas  = $('#sim-canvas');
  var ctx     = canvas.getContext('2d');
  var W = 800, H = 420;

  /* Hi-DPI. This canvas carried fixed width/height attributes while the CSS
     stretches it to the card, so on a 2x display it presented an upscaled
     bitmap. Size the backing store to real device pixels and scale the context
     so the existing 800x420 logical space is untouched — no drawing code changes.
     There is no canvas pointer interaction in this tool, so no hit-test has to
     move in lockstep. */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var displayW = canvas.getBoundingClientRect().width;
    if (!(displayW > 40)) displayW = 800;
    var displayH = displayW * (420 / 800);
    canvas.width  = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    var s = (displayW * dpr) / 800;
    ctx.setTransform(s, 0, 0, s, 0, 0);
  }
  var animId  = null;
  var pulse   = 0;  // breathing animation phase

  function drawArrow(ctx, x1, y1, x2, y2, color, headLen) {
    var hl = headLen || 10;
    var angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle - Math.PI / 6), y2 - hl * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - hl * Math.cos(angle + Math.PI / 6), y2 - hl * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function drawCylinder(res, pVal, dVal, tVal, syVal, pulseFactor) {
    ctx.clearRect(0, 0, W, H);

    // ── Background panels ─────────────────────────────────────────
    // Left panel: vessel drawing
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0f1520';
    ctx.beginPath();
    ctx.roundRect(8, 8, W / 2 - 16, H - 16, 10);
    ctx.fill();

    // Right panel: data
    ctx.fillStyle = '#161b27';
    ctx.beginPath();
    ctx.roundRect(W / 2 + 8, 8, W / 2 - 16, H - 16, 10);
    ctx.fill();

    // ── Cylinder geometry ─────────────────────────────────────────
    var cx = W / 4;
    var cy = H / 2;

    var R_in_px  = clamp(dVal * 0.10, 40, 90);
    var scale    = R_in_px / (dVal / 2);
    var R_out_px = R_in_px + Math.max(4, tVal * scale);

    var wallColor = colorFromFOS(res.fos_cyl);

    // Wall (annular ring using two circles)
    ctx.beginPath();
    ctx.arc(cx, cy, R_out_px, 0, Math.PI * 2);
    ctx.arc(cx, cy, R_in_px, 0, Math.PI * 2, true);
    ctx.fillStyle = wallColor + '55';
    ctx.fill();

    // Outer circle stroke
    ctx.beginPath();
    ctx.arc(cx, cy, R_out_px, 0, Math.PI * 2);
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner circle stroke
    ctx.beginPath();
    ctx.arc(cx, cy, R_in_px, 0, Math.PI * 2);
    ctx.strokeStyle = wallColor + 'aa';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Internal pressure arrows (starburst) ─────────────────────
    var pressureScale = pulseFactor;
    var pArrowLen = R_in_px * 0.55 * pressureScale;
    var pColor    = '#bf360c';
    var nArrows   = 8;
    for (var i = 0; i < nArrows; i++) {
      var ang  = (i / nArrows) * Math.PI * 2;
      var x1   = cx + Math.cos(ang) * (R_in_px * 0.15);
      var y1   = cy + Math.sin(ang) * (R_in_px * 0.15);
      var x2   = cx + Math.cos(ang) * (R_in_px * 0.15 + pArrowLen);
      var y2   = cy + Math.sin(ang) * (R_in_px * 0.15 + pArrowLen);
      drawArrow(ctx, x1, y1, x2, y2, pColor, 8);
    }

    // ── Hoop stress arrows (horizontal, pointing outward) ─────────
    var hoopScale  = clamp(res.sigma_h / (syVal * 0.5), 0.2, 1.0) * pulseFactor;
    var hoopLen    = (W / 4 - R_out_px - 18) * hoopScale;
    hoopLen = Math.max(18, hoopLen);
    var hoopColor  = '#bf360c';

    // Left arrow  (pointing left — outward from vessel at 180°)
    drawArrow(ctx, cx - R_out_px - 4, cy, cx - R_out_px - 4 - hoopLen, cy, hoopColor, 10);
    // Right arrow (pointing right — outward from vessel at 0°)
    drawArrow(ctx, cx + R_out_px + 4, cy, cx + R_out_px + 4 + hoopLen, cy, hoopColor, 10);

    // sigma_h label
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = hoopColor;
    ctx.textAlign = 'center';
    ctx.fillText('\u03c3\u2095', cx, cy - R_out_px - 14);
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0aa';
    ctx.fillText('= ' + vu(res.sigma_h, 'stress'), cx, cy - R_out_px - 2);

    // ── Longitudinal stress arrows (vertical, up/down) ────────────
    var longScale = clamp(res.sigma_l / (syVal * 0.5), 0.15, 1.0) * pulseFactor;
    var longLen   = (H / 2 - R_out_px - 28) * longScale;
    longLen = Math.max(14, longLen);
    var longColor = '#f5c842';

    // Up arrow
    drawArrow(ctx, cx, cy - R_out_px - 4, cx, cy - R_out_px - 4 - longLen, longColor, 9);
    // Down arrow
    drawArrow(ctx, cx, cy + R_out_px + 4, cx, cy + R_out_px + 4 + longLen, longColor, 9);

    // sigma_L label (right side, offset to avoid overlap)
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = longColor;
    ctx.textAlign = 'left';
    ctx.fillText('\u03c3\u2097 = ' + vu(res.sigma_l, 'stress'), cx + R_out_px + 16, cy + 4);

    // ── Dimension annotations ─────────────────────────────────────
    // Diameter line
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - R_in_px, cy + R_out_px + 22);
    ctx.lineTo(cx + R_in_px, cy + R_out_px + 22);
    ctx.stroke();
    ctx.setLineDash([]);
    // Dimension ticks
    ctx.beginPath();
    ctx.moveTo(cx - R_in_px, cy + R_out_px + 18);
    ctx.lineTo(cx - R_in_px, cy + R_out_px + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + R_in_px, cy + R_out_px + 18);
    ctx.lineTo(cx + R_in_px, cy + R_out_px + 26);
    ctx.stroke();
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('d = ' + vu(state.d, 'len'), cx, cy + R_out_px + 36);

    // Wall thickness indicator
    var wallMidR = (R_in_px + R_out_px) / 2;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = wallColor + 'cc';
    ctx.textAlign  = 'center';
    ctx.fillText('t=' + tVal, cx + wallMidR * Math.cos(Math.PI * 0.25), cy - wallMidR * Math.sin(Math.PI * 0.25) - 3);

    // ── Label: vessel type ────────────────────────────────────────
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('CYLINDRICAL VESSEL', cx, 28);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Cross-section (end view)', cx, 42);

    // ── Right panel: stress summary ───────────────────────────────
    drawRightPanel(res, pVal, dVal, tVal, syVal, 'cylinder');
  }

  function drawSphere(res, pVal, dVal, tVal, syVal, pulseFactor) {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0f1520';
    ctx.beginPath();
    ctx.roundRect(8, 8, W / 2 - 16, H - 16, 10);
    ctx.fill();

    ctx.fillStyle = '#161b27';
    ctx.beginPath();
    ctx.roundRect(W / 2 + 8, 8, W / 2 - 16, H - 16, 10);
    ctx.fill();

    var cx = W / 4;
    var cy = H / 2;

    var R_in_px  = clamp(dVal * 0.10, 40, 90);
    var scale    = R_in_px / (dVal / 2);
    var R_out_px = R_in_px + Math.max(4, tVal * scale);

    var wallColor = colorFromFOS(res.fos_sphere);

    // Wall ring (sphere shown as circle cross-section)
    ctx.beginPath();
    ctx.arc(cx, cy, R_out_px, 0, Math.PI * 2);
    ctx.arc(cx, cy, R_in_px, 0, Math.PI * 2, true);
    ctx.fillStyle = wallColor + '55';
    ctx.fill();

    // Circles
    ctx.beginPath();
    ctx.arc(cx, cy, R_out_px, 0, Math.PI * 2);
    ctx.strokeStyle = wallColor;
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R_in_px, 0, Math.PI * 2);
    ctx.strokeStyle = wallColor + 'aa';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // ── Pressure arrows (starburst) ───────────────────────────────
    var pArrowLen = R_in_px * 0.55 * pulseFactor;
    var pColor    = '#bf360c';
    var nArrows   = 8;
    for (var i = 0; i < nArrows; i++) {
      var ang = (i / nArrows) * Math.PI * 2;
      var x1  = cx + Math.cos(ang) * (R_in_px * 0.15);
      var y1  = cy + Math.sin(ang) * (R_in_px * 0.15);
      var x2  = cx + Math.cos(ang) * (R_in_px * 0.15 + pArrowLen);
      var y2  = cy + Math.sin(ang) * (R_in_px * 0.15 + pArrowLen);
      drawArrow(ctx, x1, y1, x2, y2, pColor, 8);
    }

    // ── Equal biaxial stress arrows (4 diagonal directions) ───────
    var sScale   = clamp(res.sigma_sphere / (syVal * 0.5), 0.2, 1.0) * pulseFactor;
    var sLen     = (W / 4 - R_out_px - 18) * sScale;
    sLen         = Math.max(18, sLen);
    var sColor   = '#bf360c';
    var sAngles  = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];

    sAngles.forEach(function (a) {
      drawArrow(
        ctx,
        cx + Math.cos(a) * (R_out_px + 4),
        cy + Math.sin(a) * (R_out_px + 4),
        cx + Math.cos(a) * (R_out_px + 4 + sLen),
        cy + Math.sin(a) * (R_out_px + 4 + sLen),
        sColor, 10
      );
    });

    // Stress label
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = sColor;
    ctx.textAlign = 'center';
    ctx.fillText('\u03c3 = pd/4t', cx, cy - R_out_px - 14);
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0aa';
    ctx.fillText('= ' + vu(res.sigma_sphere, 'stress'), cx, cy - R_out_px - 2);

    // Dimension label
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(cx - R_in_px, cy + R_out_px + 22);
    ctx.lineTo(cx + R_in_px, cy + R_out_px + 22);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('d = ' + vu(state.d, 'len'), cx, cy + R_out_px + 36);

    // Wall thickness label
    var wallMidR = (R_in_px + R_out_px) / 2;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = wallColor + 'cc';
    ctx.textAlign  = 'center';
    ctx.fillText('t=' + tVal, cx + wallMidR * Math.cos(Math.PI * 0.25), cy - wallMidR * Math.sin(Math.PI * 0.25) - 3);

    // Title
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('SPHERICAL VESSEL', cx, 28);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Cross-section view', cx, 42);

    drawRightPanel(res, pVal, dVal, tVal, syVal, 'sphere');
  }

  function drawRightPanel(res, pVal, dVal, tVal, syVal, vesselType) {
    var px   = W / 2 + 20;
    var py   = 24;
    var pw   = W / 2 - 36;

    var isCyl = vesselType === 'cylinder';
    var sigma_max = isCyl ? res.sigma_h : res.sigma_sphere;
    var fos       = isCyl ? res.fos_cyl : res.fos_sphere;
    var fosColor  = colorFromFOS(fos);
    var statusStr = statusFromFOS(fos);

    // Title
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'left';
    ctx.fillText('Stress Summary', px, py + 14);

    // ── Stress bars ────────────────────────────────────────────────
    var barX  = px;
    var barW  = pw;
    var barH  = 22;
    var gap   = 44;
    var barY1 = py + 34;

    // Helper: draw a labelled stress bar
    function drawBar(y, label, value, maxVal, color) {
      var frac = clamp(value / maxVal, 0, 1);
      // Background track
      ctx.fillStyle = '#0d1117';
      ctx.beginPath();
      ctx.roundRect(barX, y, barW, barH, 4);
      ctx.fill();
      // Fill
      ctx.fillStyle = color + 'cc';
      ctx.beginPath();
      ctx.roundRect(barX, y, Math.max(8, barW * frac), barH, 4);
      ctx.fill();
      // Border
      ctx.strokeStyle = color + '66';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(barX, y, barW, barH, 4);
      ctx.stroke();
      // Labels
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'left';
      ctx.fillText(label, barX + 6, y + 15);
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(vu(value, 'stress'), barX + barW - 6, y + 15);
    }

    if (isCyl) {
      drawBar(barY1, '\u03c3\u2095 (Hoop)', res.sigma_h, syVal, '#bf360c');
      drawBar(barY1 + gap, '\u03c3\u2097 (Long.)', res.sigma_l, syVal, '#f5c842');
    } else {
      drawBar(barY1, '\u03c3 (Sphere)', res.sigma_sphere, syVal, '#bf360c');
      drawBar(barY1 + gap, 'S\u1d67 (Yield)', syVal, syVal, '#6b7a99');
    }

    // Yield strength reference line on first bar
    var yieldFrac = 1.0;
    ctx.strokeStyle = '#3ddc84cc';
    ctx.lineWidth   = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(barX + barW * yieldFrac, barY1 - 3);
    ctx.lineTo(barX + barW * yieldFrac, barY1 + barH + 3);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── FOS display ───────────────────────────────────────────────
    var fosY = barY1 + gap * 2 + 10;

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    ctx.fillText('Factor of Safety', px, fosY);

    ctx.font = 'bold 2.2rem "Courier New", monospace';
    ctx.fillStyle = fosColor;
    ctx.textAlign = 'left';
    ctx.fillText(roundN(fos, 2), px, fosY + 38);

    // Status badge
    var badgeX = px + 90;
    ctx.fillStyle = fosColor + '33';
    ctx.strokeStyle = fosColor;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, fosY + 14, 80, 22, 11);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = fosColor;
    ctx.textAlign = 'center';
    ctx.fillText(statusStr, badgeX + 40, fosY + 29);

    // ── d/t info ──────────────────────────────────────────────────
    var dtY = fosY + 56;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    ctx.fillText('d/t ratio: ', px, dtY);
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = res.isThinWall ? '#3ddc84' : '#ff5555';
    ctx.fillText(roundN(res.dt_ratio, 1), px + 68, dtY);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = res.isThinWall ? '#3ddc84aa' : '#ff5555aa';
    ctx.fillText(res.isThinWall ? 'Thin-wall valid (d/t \u2265 20)' : 'THICK wall: use Lam\u00e9', px, dtY + 15);

    // ── Formulas ──────────────────────────────────────────────────
    var frmY = dtY + 36;
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px, frmY - 4);
    ctx.lineTo(px + pw, frmY - 4);
    ctx.stroke();

    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    if (isCyl) {
      ctx.fillText('\u03c3\u2095 = pd/2t = ' + pVal + '\u00d7' + dVal + '/(2\u00d7' + tVal + ')', px, frmY + 10);
      ctx.fillText('\u03c3\u2097 = pd/4t = ' + pVal + '\u00d7' + dVal + '/(4\u00d7' + tVal + ')', px, frmY + 24);
      ctx.fillText('FOS = S\u1d67/\u03c3\u2095 = ' + syVal + '/' + roundN(res.sigma_h, 1), px, frmY + 38);
    } else {
      ctx.fillText('\u03c3 = pd/4t = ' + pVal + '\u00d7' + dVal + '/(4\u00d7' + tVal + ')', px, frmY + 10);
      ctx.fillText('FOS = S\u1d67/\u03c3 = ' + syVal + '/' + roundN(res.sigma_sphere, 1), px, frmY + 24);
    }

    // ── p label ───────────────────────────────────────────────────
    var plabelY = H - 22;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#bf360ccc';
    ctx.textAlign = 'left';
    ctx.fillText('p = ' + vu(state.p, 'press') + '  |  S\u1d67 = ' + vu(state.sy, 'stress'), px, plabelY);
  }

  function draw() {
    var p  = state.p;
    var d  = state.d;
    var t  = state.t;
    var sy = state.sy;
    var res = compute(p, d, t, sy);
    var pf  = 0.9 + 0.1 * Math.sin(pulse);  // breathing pulse 0.9–1.0

    if (state.vessel === 'cylinder') {
      drawCylinder(res, p, d, t, sy, pf);
    } else {
      drawSphere(res, p, d, t, sy, pf);
    }

    updateBadges(res);
  }

  function updateBadges(res) {
    var isCyl = state.vessel === 'cylinder';
    var fos   = isCyl ? res.fos_cyl : res.fos_sphere;
    var fosColor = colorFromFOS(fos);
    var statusStr = statusFromFOS(fos);

    $('#rb-sh').textContent  = vu(res.sigma_h, 'stress');
    $('#rb-sl').textContent  = isCyl
      ? vu(res.sigma_l, 'stress')
      : 'N/A (sphere)';
    $('#rb-fos').textContent = roundN(fos, 2);
    $('#rb-dt').textContent  = roundN(res.dt_ratio, 1);

    var statusEl = $('#rb-status');
    statusEl.textContent = statusStr;
    statusEl.style.color = fosColor;
  }

  /* Animation loop */
  function loop() {
    pulse += 0.025;
    draw();
    animId = requestAnimationFrame(loop);
  }

  /* ================================================================
     EXPLORE MODE DATA
     ================================================================ */
  var CONCEPTS = [
    {
      id: 'thin-wall', name: 'Thin-Wall Criterion', symbol: 'd/t \u2265 20',
      formula: 'Valid when d/t \u2265 20', cat: 'Theory',
      desc: 'The thin-wall assumption treats stress as uniform across the wall thickness. This is valid when the inner diameter-to-thickness ratio d/t \u2265 20 (or t/r \u2264 0.1). For thicker walls, stress varies from inner to outer surface, requiring Lam\u00e9\'s thick-cylinder equations for accurate analysis.',
      example: {
        problem: 'd = 400 mm, t = 15 mm. Is thin-wall valid?',
        steps: ['d/t = 400 / 15 = 26.7', '26.7 > 20 \u2192 thin-wall assumption IS valid'],
        answer: 26.7, unit: '(d/t)'
      }
    },
    {
      id: 'hoop-stress', name: 'Hoop (Circumferential) Stress', symbol: '\u03c3\u2095 = pd/2t',
      formula: '\u03c3\u2095 = p \u00d7 d / (2 \u00d7 t)', cat: 'Stress',
      desc: 'Hoop stress acts in the tangential direction and tries to split the cylinder along its axis. It is always twice the longitudinal stress. Derived from equilibrium of a thin ring: p\u00d7d\u00d7L = 2\u00d7\u03c3\u2095\u00d7t\u00d7L, giving \u03c3\u2095 = pd/2t.',
      example: {
        problem: 'p = 5 MPa, d = 400 mm, t = 10 mm. Find \u03c3\u2095.',
        steps: ['\u03c3\u2095 = p \u00d7 d / (2 \u00d7 t)', '= 5 \u00d7 400 / (2 \u00d7 10)', '= 2000 / 20 = 100 MPa'],
        answer: 100, unit: 'MPa'
      }
    },
    {
      id: 'long-stress', name: 'Longitudinal Stress', symbol: '\u03c3\u2097 = pd/4t',
      formula: '\u03c3\u2097 = p \u00d7 d / (4 \u00d7 t)', cat: 'Stress',
      desc: 'Longitudinal stress acts along the axis of the cylinder, trying to push the end caps off. It equals half the hoop stress. Derived from equilibrium of the end cap: p\u00d7(\u03c0d\u00b2/4) = \u03c3\u2097\u00d7\u03c0\u00d7d\u00d7t, giving \u03c3\u2097 = pd/4t.',
      example: {
        problem: 'p = 5 MPa, d = 400 mm, t = 10 mm. Find \u03c3\u2097.',
        steps: ['\u03c3\u2097 = p \u00d7 d / (4 \u00d7 t)', '= 5 \u00d7 400 / (4 \u00d7 10)', '= 2000 / 40 = 50 MPa'],
        answer: 50, unit: 'MPa'
      }
    },
    {
      id: 'sphere-stress', name: 'Spherical Vessel Stress', symbol: '\u03c3 = pd/4t',
      formula: '\u03c3 = p \u00d7 d / (4 \u00d7 t)', cat: 'Stress',
      desc: 'In a spherical pressure vessel, stress is equal in all directions (biaxial equal): \u03c3 = pd/4t. This equals the longitudinal stress of a cylinder with the same p, d, and t. Spheres are structurally more efficient \u2014 they resist the same pressure with half the wall thickness needed by a cylinder.',
      example: {
        problem: 'p = 5 MPa, d = 400 mm, t = 10 mm. Find \u03c3 for sphere vs cylinder.',
        steps: ['Sphere: \u03c3 = 5\u00d7400/(4\u00d710) = 50 MPa', 'Cylinder hoop: \u03c3\u2095 = 5\u00d7400/(2\u00d710) = 100 MPa', 'Sphere needs half the wall thickness!'],
        answer: 50, unit: 'MPa'
      }
    },
    {
      id: 'fos', name: 'Factor of Safety', symbol: 'FOS = S\u1d67/\u03c3\u2095',
      formula: 'FOS = S\u1d67 / \u03c3\u2095', cat: 'Design',
      desc: 'The factor of safety compares yield strength to the maximum stress. FOS = S\u1d67 / \u03c3\u2095 for cylinders. Design codes typically require FOS \u2265 2 for pressure vessels (FOS \u2265 4 for brittle materials). Minimum wall thickness: t_min = p\u00d7d / (2\u00d7S\u1d67/FOS).',
      example: {
        problem: 'p = 5 MPa, d = 400 mm, t = 10 mm, S\u1d67 = 250 MPa. Find FOS.',
        steps: ['\u03c3\u2095 = 5\u00d7400/(2\u00d710) = 100 MPa', 'FOS = S\u1d67/\u03c3\u2095 = 250/100 = 2.5'],
        answer: 2.5, unit: ''
      }
    },
    {
      id: 'design', name: 'Design Wall Thickness', symbol: 't = pd\u00d7FOS/(2S\u1d67)',
      formula: 't_min = p \u00d7 d \u00d7 FOS / (2 \u00d7 S\u1d67)', cat: 'Design',
      desc: 'To design a safe pressure vessel, calculate the minimum wall thickness that gives the required factor of safety. Rearranging FOS = S\u1d67/(pd/2t): t_min = p\u00d7d\u00d7FOS/(2\u00d7S\u1d67). Always round up to the next available plate thickness.',
      example: {
        problem: 'p = 8 MPa, d = 300 mm, S\u1d67 = 300 MPa, FOS = 3. Find minimum t.',
        steps: ['t_min = p\u00d7d\u00d7FOS / (2\u00d7S\u1d67)', '= 8 \u00d7 300 \u00d7 3 / (2 \u00d7 300)', '= 7200 / 600 = 12 mm'],
        answer: 12, unit: 'mm'
      }
    }
  ];

  /* ── Build Explore grid ──────────────────────────────────────── */
  var exploreActiveId = null;

  function buildExploreGrid() {
    var grid = $('#explore-grid');
    grid.innerHTML = '';
    CONCEPTS.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn';
      btn.dataset.id = c.id;
      btn.innerHTML =
        '<span class="is-btn-name">' + c.name + '</span>' +
        '<span class="is-btn-sym">'  + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selectConcept(c.id);
      });
      grid.appendChild(btn);
    });
    selectConcept(CONCEPTS[0].id);
  }

  function selectConcept(id) {
    exploreActiveId = id;
    $$('#explore-grid .is-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.id === id);
    });
    var c = CONCEPTS.find(function (x) { return x.id === id; });
    if (!c) return;
    var info = $('#explore-info');
    var stepsHTML = c.example.steps.map(function (s, i) {
      var isLast = i === c.example.steps.length - 1;
      return '<p class="ex-step">' + (i + 1) + '. ' + s + (isLast ? ' <strong>= ' + c.example.answer + (c.example.unit ? ' ' + c.example.unit : '') + '</strong>' : '') + '</p>';
    }).join('');
    info.innerHTML =
      '<div class="ii-top">' +
        '<span class="ii-name">' + c.name + '</span>' +
        '<span class="ii-cat-badge">' + c.cat + '</span>' +
      '</div>' +
      '<div class="formula-box">' +
        '<span class="fb-formula">' + c.formula + '</span>' +
        (c.example.unit ? '<span class="fb-unit">Result in: ' + c.example.unit + '</span>' : '') +
      '</div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="example-box">' +
        '<h4>Worked Example</h4>' +
        '<p class="ex-problem">' + c.example.problem + '</p>' +
        stepsHTML +
      '</div>';
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  var pracScore   = 0;
  var pracTotal   = 0;
  var pracCurrent = null;
  var pracAnswered = false;

  var PRAC_TYPES = [
    /* 0 — hoop stress */
    function () {
      var p  = randInt(2, 15);
      var d  = randInt(2, 16) * 50;
      var t  = randInt(5, 40);
      var ans = roundN((p * d) / (2 * t), 1);
      return {
        prompt: 'A cylindrical pressure vessel has internal pressure p = ' + p +
          ' MPa, inner diameter d = ' + d + ' mm, and wall thickness t = ' + t +
          ' mm. Calculate the hoop stress \u03c3\u2095.',
        answer: ans, unit: 'MPa', dp: 1,
        steps: [
          '\u03c3\u2095 = p \u00d7 d / (2 \u00d7 t)',
          '= ' + p + ' \u00d7 ' + d + ' / (2 \u00d7 ' + t + ')',
          '= ' + (p * d) + ' / ' + (2 * t),
          '<strong>= ' + ans + ' MPa</strong>'
        ]
      };
    },
    /* 1 — longitudinal stress */
    function () {
      var p  = randInt(2, 15);
      var d  = randInt(2, 16) * 50;
      var t  = randInt(5, 40);
      var ans = roundN((p * d) / (4 * t), 1);
      return {
        prompt: 'A cylindrical pressure vessel has p = ' + p +
          ' MPa, d = ' + d + ' mm, t = ' + t +
          ' mm. Find the longitudinal stress \u03c3\u2097.',
        answer: ans, unit: 'MPa', dp: 1,
        steps: [
          '\u03c3\u2097 = p \u00d7 d / (4 \u00d7 t)',
          '= ' + p + ' \u00d7 ' + d + ' / (4 \u00d7 ' + t + ')',
          '= ' + (p * d) + ' / ' + (4 * t),
          '<strong>= ' + ans + ' MPa</strong>'
        ]
      };
    },
    /* 2 — FOS */
    function () {
      var p  = randInt(2, 12);
      var d  = randInt(2, 14) * 50;
      var t  = randInt(5, 35);
      var sy = randInt(3, 10) * 50;
      var sh = (p * d) / (2 * t);
      var ans = roundN(sy / sh, 2);
      return {
        prompt: 'A cylindrical vessel: p = ' + p +
          ' MPa, d = ' + d + ' mm, t = ' + t +
          ' mm, S\u1d67 = ' + sy + ' MPa. Find the factor of safety.',
        answer: ans, unit: '', dp: 2,
        steps: [
          '\u03c3\u2095 = p\u00d7d/(2t) = ' + p + '\u00d7' + d + '/(2\u00d7' + t + ') = ' + roundN(sh, 2) + ' MPa',
          'FOS = S\u1d67 / \u03c3\u2095',
          '= ' + sy + ' / ' + roundN(sh, 2),
          '<strong>= ' + ans + '</strong>'
        ]
      };
    },
    /* 3 — minimum wall thickness */
    function () {
      var p   = randInt(2, 12);
      var d   = randInt(2, 14) * 50;
      var sy  = randInt(3, 10) * 50;
      var fos = randInt(2, 4);
      var ans = roundN((p * d * fos) / (2 * sy), 1);
      return {
        prompt: 'Design a cylindrical vessel: p = ' + p +
          ' MPa, d = ' + d + ' mm, S\u1d67 = ' + sy +
          ' MPa, FOS = ' + fos + '. Find the minimum wall thickness.',
        answer: ans, unit: 'mm', dp: 1,
        steps: [
          't_min = p \u00d7 d \u00d7 FOS / (2 \u00d7 S\u1d67)',
          '= ' + p + ' \u00d7 ' + d + ' \u00d7 ' + fos + ' / (2 \u00d7 ' + sy + ')',
          '= ' + (p * d * fos) + ' / ' + (2 * sy),
          '<strong>= ' + ans + ' mm</strong>'
        ]
      };
    },
    /* 4 — spherical vessel stress */
    function () {
      var p  = randInt(2, 15);
      var d  = randInt(2, 16) * 50;
      var t  = randInt(5, 40);
      var ans = roundN((p * d) / (4 * t), 1);
      return {
        prompt: 'A spherical pressure vessel has p = ' + p +
          ' MPa, d = ' + d + ' mm, t = ' + t +
          ' mm. Calculate the wall stress \u03c3.',
        answer: ans, unit: 'MPa', dp: 1,
        steps: [
          '\u03c3 = p \u00d7 d / (4 \u00d7 t)',
          '= ' + p + ' \u00d7 ' + d + ' / (4 \u00d7 ' + t + ')',
          '= ' + (p * d) + ' / ' + (4 * t),
          '<strong>= ' + ans + ' MPa</strong>'
        ]
      };
    },
    /* 5 — spherical vessel FOS */
    function () {
      var p  = randInt(2, 12);
      var d  = randInt(2, 14) * 50;
      var t  = randInt(5, 35);
      var sy = randInt(3, 10) * 50;
      var ss = (p * d) / (4 * t);
      var ans = roundN(sy / ss, 2);
      return {
        prompt: 'A spherical vessel: p = ' + p +
          ' MPa, d = ' + d + ' mm, t = ' + t +
          ' mm, S\u1d67 = ' + sy + ' MPa. Find the factor of safety.',
        answer: ans, unit: '', dp: 2,
        steps: [
          '\u03c3 = p\u00d7d/(4t) = ' + p + '\u00d7' + d + '/(4\u00d7' + t + ') = ' + roundN(ss, 2) + ' MPa',
          'FOS = S\u1d67 / \u03c3',
          '= ' + sy + ' / ' + roundN(ss, 2),
          '<strong>= ' + ans + '</strong>'
        ]
      };
    }
  ];

  function pracNewQ() {
    pracAnswered = false;
    var gen = PRAC_TYPES[randInt(0, PRAC_TYPES.length - 1)];
    pracCurrent = gen();

    $('#prac-prompt').textContent = pracCurrent.prompt;
    $('#prac-input').value = '';
    $('#prac-unit').textContent = pracCurrent.unit || '';
    $('#prac-feedback').textContent = '';
    $('#prac-feedback').className = 'feedback';
    hide($('#prac-sol'));
    show($('#prac-input-row'));
    $('#prac-input').focus();
  }

  function pracCheck() {
    if (!pracCurrent || pracAnswered) return;
    var raw = parseFloat($('#prac-input').value);
    if (isNaN(raw)) {
      $('#prac-feedback').textContent = 'Please enter a number.';
      $('#prac-feedback').className = 'feedback err';
      return;
    }
    pracAnswered = true;
    pracTotal++;
    var tol = Math.abs(pracCurrent.answer) * 0.02;
    var ok  = Math.abs(raw - pracCurrent.answer) <= Math.max(tol, 0.05);
    if (ok) {
      pracScore++;
      $('#prac-feedback').textContent = '\u2713 Correct! ' + pracCurrent.answer + (pracCurrent.unit ? ' ' + pracCurrent.unit : '');
      $('#prac-feedback').className = 'feedback ok';
    } else {
      $('#prac-feedback').textContent = '\u2718 Incorrect. Correct answer: ' + pracCurrent.answer + (pracCurrent.unit ? ' ' + pracCurrent.unit : '');
      $('#prac-feedback').className = 'feedback err';
    }
    // Update score
    $('#prac-score').textContent = pracScore;
    $('#prac-total').textContent = pracTotal;
    // Show solution
    var sol = $('#prac-sol');
    var stepsDiv = $('#prac-sol-steps');
    stepsDiv.innerHTML = pracCurrent.steps.map(function (s) {
      return '<p class="sol-step">' + s + '</p>';
    }).join('');
    show(sol);
  }

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  var QUIZ_TOTAL = 5;
  var quizQuestions = [];
  var quizIndex     = 0;
  var quizScore     = 0;
  var quizAnswered  = false;
  var quizResults   = [];
  var quizActive    = false;

  /* MCQ bank — 8 questions, pick 3 per quiz */
  var MCQ_BANK = [
    {
      prompt: 'Which stress is larger in a thin-walled cylindrical pressure vessel?',
      type: 'mcq',
      options: ['Hoop (circumferential) stress \u03c3\u2095', 'Longitudinal stress \u03c3\u2097', 'Radial stress', 'They are equal'],
      correct: 0,
      explanation: 'Hoop stress \u03c3\u2095 = pd/2t is always twice the longitudinal stress \u03c3\u2097 = pd/4t.'
    },
    {
      prompt: 'If the internal diameter doubles (p and t unchanged), the hoop stress:',
      type: 'mcq',
      options: ['Stays the same', 'Doubles', 'Halves', 'Quadruples'],
      correct: 1,
      explanation: '\u03c3\u2095 = pd/2t. With d doubled, \u03c3\u2095 doubles (directly proportional).'
    },
    {
      prompt: 'The thin-wall assumption is valid when:',
      type: 'mcq',
      options: ['d/t < 10', 'd/t \u2265 20', 't/d > 0.1', 'd/t = 10'],
      correct: 1,
      explanation: 'The thin-wall criterion is d/t \u2265 20, meaning the diameter is at least 20 times the wall thickness.'
    },
    {
      prompt: 'For a spherical vessel compared to a cylinder (same p, d, t), the maximum stress is:',
      type: 'mcq',
      options: ['Twice as large', 'Equal', 'Half as large', 'Four times as large'],
      correct: 2,
      explanation: 'Sphere: \u03c3 = pd/4t. Cylinder hoop: \u03c3\u2095 = pd/2t. The sphere stress is half the cylinder hoop stress.'
    },
    {
      prompt: 'Increasing wall thickness t (with p and d constant) will:',
      type: 'mcq',
      options: ['Increase hoop stress', 'Decrease hoop stress', 'Not affect hoop stress', 'Double longitudinal stress'],
      correct: 1,
      explanation: '\u03c3\u2095 = pd/2t. Increasing t reduces hoop stress because t is in the denominator.'
    },
    {
      prompt: 'A cylindrical pressure vessel typically fails by:',
      type: 'mcq',
      options: ['Longitudinal cracking (hoop stress failure)', 'Circumferential cracking (longitudinal stress failure)', 'Buckling', 'Fatigue in the end caps'],
      correct: 0,
      explanation: 'Hoop stress is twice the longitudinal stress, so the vessel fails by longitudinal cracking first.'
    },
    {
      prompt: 'Why are spherical vessels more structurally efficient than cylindrical ones?',
      type: 'mcq',
      options: ['They have higher hoop stress', 'Equal biaxial stress means half the wall thickness', 'They are easier to manufacture', 'They have zero longitudinal stress'],
      correct: 1,
      explanation: 'Sphere stress = pd/4t (half of cylinder hoop pd/2t). Same pressure needs half the wall thickness.'
    },
    {
      prompt: 'For a thick-walled vessel (d/t < 20), you should use:',
      type: 'mcq',
      options: ['The same thin-wall formulas', 'Lam\u00e9\'s equations', 'Only hoop stress calculations', 'No analysis is needed'],
      correct: 1,
      explanation: 'When d/t < 20, stress varies across the wall. Lam\u00e9\'s thick-cylinder equations account for this variation.'
    }
  ];

  /* Numeric quiz generators — 3 types, pick 2 per quiz */
  function quizNumHoop() {
    var p  = randInt(2, 10);
    var d  = randInt(2, 10) * 50;
    var t  = randInt(5, 25);
    var ans = roundN((p * d) / (2 * t), 1);
    return {
      type: 'numeric',
      prompt: 'Calculate the hoop stress for: p = ' + p + ' MPa, d = ' + d + ' mm, t = ' + t + ' mm. (\u03c3\u2095 = pd/2t)',
      answer: ans, unit: 'MPa', dp: 1,
      explanation: '\u03c3\u2095 = ' + p + '\u00d7' + d + '/(2\u00d7' + t + ') = ' + ans + ' MPa'
    };
  }

  function quizNumFOS() {
    var p  = randInt(2, 8);
    var d  = randInt(2, 8) * 50;
    var t  = randInt(5, 20);
    var sy = randInt(3, 8) * 50;
    var sh = (p * d) / (2 * t);
    var ans = roundN(sy / sh, 2);
    return {
      type: 'numeric',
      prompt: 'Find the FOS: p = ' + p + ' MPa, d = ' + d + ' mm, t = ' + t + ' mm, S\u1d67 = ' + sy + ' MPa.',
      answer: ans, unit: '', dp: 2,
      explanation: '\u03c3\u2095 = ' + roundN(sh, 2) + ' MPa. FOS = ' + sy + '/' + roundN(sh, 2) + ' = ' + ans
    };
  }

  function quizNumSphere() {
    var p  = randInt(2, 10);
    var d  = randInt(2, 10) * 50;
    var t  = randInt(5, 25);
    var ans = roundN((p * d) / (4 * t), 1);
    return {
      type: 'numeric',
      prompt: 'Find the wall stress in a spherical vessel: p = ' + p + ' MPa, d = ' + d + ' mm, t = ' + t + ' mm. (\u03c3 = pd/4t)',
      answer: ans, unit: 'MPa', dp: 1,
      explanation: '\u03c3 = ' + p + '\u00d7' + d + '/(4\u00d7' + t + ') = ' + ans + ' MPa'
    };
  }

  function buildQuiz() {
    /* Pick 3 MCQ from bank of 8, plus 2 of 3 numeric types — randomise order */
    var mcqPick   = shuffleArr(MCQ_BANK).slice(0, 3);
    var numGens   = [quizNumHoop, quizNumFOS, quizNumSphere];
    var numPick   = shuffleArr(numGens).slice(0, 2).map(function (fn) { return fn(); });
    var all       = shuffleArr(mcqPick.concat(numPick));
    return all;
  }

  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startQuiz() {
    quizQuestions = buildQuiz();
    quizIndex     = 0;
    quizScore     = 0;
    quizResults   = [];
    quizActive    = true;
    hide($('#quiz-result'));
    show($('#quiz-panel'));
    $('#quiz-start-btn').textContent = 'Restart';
    hide($('#quiz-next-btn'));
    showQuizQ();
  }

  function showQuizQ() {
    quizAnswered = false;
    var q = quizQuestions[quizIndex];
    $('#quiz-qnum').textContent = quizIndex + 1;
    $('#quiz-prompt').textContent = q.prompt;
    $('#quiz-feedback').textContent = '';
    $('#quiz-feedback').className = 'quiz-feedback';
    hide($('#quiz-next-btn'));

    var ansGrid = $('#quiz-answers');
    var numRow  = $('#quiz-num-row');

    if (q.type === 'mcq') {
      show(ansGrid);
      hide(numRow);
      ansGrid.innerHTML = '';
      q.options.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          submitMCQ(i, q);
        });
        ansGrid.appendChild(btn);
      });
    } else {
      hide(ansGrid);
      show(numRow);
      $('#quiz-input').value = '';
      $('#quiz-unit').textContent = q.unit || '';
      $('#quiz-input').focus();
    }
  }

  function submitMCQ(chosen, q) {
    if (quizAnswered) return;
    quizAnswered = true;
    var correct  = chosen === q.correct;
    if (correct) quizScore++;
    quizResults.push({ q: q, chosen: chosen, correct: correct });

    var btns = $$('#quiz-answers .answer-btn');
    btns.forEach(function (b, i) {
      b.classList.add('locked');
      if (i === q.correct) b.classList.add('correct');
      else if (i === chosen && !correct) b.classList.add('wrong');
    });

    var fb = $('#quiz-feedback');
    fb.textContent = correct ? '\u2713 Correct! ' + q.explanation : '\u2718 Wrong. ' + q.explanation;
    fb.className   = 'quiz-feedback ' + (correct ? 'ok' : 'err');

    advanceOrFinish();
  }

  function submitNumeric() {
    if (quizAnswered) return;
    var q   = quizQuestions[quizIndex];
    var raw = parseFloat($('#quiz-input').value);
    if (isNaN(raw)) {
      $('#quiz-feedback').textContent = 'Enter a number.';
      $('#quiz-feedback').className   = 'quiz-feedback err';
      return;
    }
    quizAnswered = true;
    var tol = Math.abs(q.answer) * 0.02;
    var ok  = Math.abs(raw - q.answer) <= Math.max(tol, 0.05);
    if (ok) quizScore++;
    quizResults.push({ q: q, chosen: raw, correct: ok });

    var fb = $('#quiz-feedback');
    fb.textContent = ok
      ? '\u2713 Correct! ' + q.explanation
      : '\u2718 Wrong. Correct: ' + q.answer + (q.unit ? ' ' + q.unit : '') + '. ' + q.explanation;
    fb.className   = 'quiz-feedback ' + (ok ? 'ok' : 'err');

    advanceOrFinish();
  }

  function advanceOrFinish() {
    if (quizIndex < QUIZ_TOTAL - 1) {
      show($('#quiz-next-btn'));
    } else {
      // delay slightly then show result
      setTimeout(showQuizResult, 600);
    }
  }

  function showQuizResult() {
    hide($('#quiz-panel'));
    var result = $('#quiz-result');
    show(result);
    var stars;
    if (quizScore === 5)      stars = '\u2605\u2605\u2605\u2605\u2605';
    else if (quizScore === 4) stars = '\u2605\u2605\u2605\u2605\u2606';
    else if (quizScore === 3) stars = '\u2605\u2605\u2605\u2606\u2606';
    else                      stars = '\u2605\u2605\u2606\u2606\u2606';

    var scoreClass = quizScore === 5 ? 'perfect' : quizScore >= 3 ? 'good' : 'poor';
    var verdict    = quizScore === 5 ? 'Outstanding!' : quizScore >= 4 ? 'Great work!' : quizScore >= 3 ? 'Good effort!' : 'Keep practising!';

    var rowsHTML = quizResults.map(function (r, i) {
      return '<div class="qr-row ' + (r.correct ? 'ok' : 'err') + '">' +
        '<span class="qr-qnum">Q' + (i + 1) + '</span>' +
        '<span class="qr-detail"><strong>' + r.q.prompt.substring(0, 60) + (r.q.prompt.length > 60 ? '\u2026' : '') + '</strong></span>' +
        '<span class="qr-mark">' + (r.correct ? '\u2713' : '\u2718') + '</span>' +
        '</div>';
    }).join('');

    result.innerHTML =
      '<div class="qr-header">' +
        '<div class="qr-title-wrap">' +
          '<span class="qr-title">Quiz Complete</span>' +
          '<span class="qr-stars">' + stars + '</span>' +
        '</div>' +
        '<div class="qr-score-wrap">' +
          '<div class="qr-score ' + scoreClass + '">' + quizScore + '/' + QUIZ_TOTAL + '</div>' +
          '<div class="qr-verdict">' + verdict + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="qr-rows">' + rowsHTML + '</div>' +
      '<button class="btn btn-primary" id="qr-retry-btn">Try Again</button>';

    $('#qr-retry-btn').addEventListener('click', startQuiz);
    hide($('#quiz-next-btn'));
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  var SECTIONS = {
    simulate: $('#sim-mode'),
    explore:  $('#explore-mode'),
    practice: $('#practice-mode'),
    quiz:     $('#quiz-mode')
  };

  function switchMode(mode) {
    state.mode = mode;
    Object.keys(SECTIONS).forEach(function (k) {
      SECTIONS[k].classList.toggle('hidden', k !== mode);
    });
    $$('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.value === mode);
    });
    if (mode === 'simulate') {
      if (!animId) loop();
    } else {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    }
  }

  /* ================================================================
     SLIDER WIRING
     ================================================================ */
  function wireSim() {
    var slP  = $('#sl-p');
    var slD  = $('#sl-d');
    var slT  = $('#sl-t');
    var slSy = $('#sl-sy');

    function updateSliders() {
      state.p  = parseFloat(slP.value);
      state.d  = parseFloat(slD.value);
      state.t  = parseFloat(slT.value);
      state.sy = parseFloat(slSy.value);

      syncSliderLabels();
      draw();
    }

    [slP, slD, slT, slSy].forEach(function (sl) {
      sl.addEventListener('input', updateSliders);
    });

    // Unit toggle — display only, so nothing but the labels and canvas repaint
    $$('#unit-tabs .pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var u = btn.getAttribute('data-unit');
        if (!u || u === state.units) return;
        state.units = u;
        $$('#unit-tabs .pill').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        syncSliderLabels();
        draw();
      });
    });

    // Vessel type buttons
    $$('#vessel-type-btns .preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.vessel = btn.dataset.vessel;
        $$('#vessel-type-btns .preset-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.vessel === state.vessel);
        });
        draw();
      });
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    fitCanvas();
    window.addEventListener('resize', function () { fitCanvas(); draw(); });
    wireSim();

    // Mode tabs
    $$('#mode-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        switchMode(p.dataset.value);
      });
    });

    // Build explore grid
    buildExploreGrid();

    // Practice
    $('#prac-new-btn').addEventListener('click', function () {
      pracNewQ();
    });
    $('#prac-check-btn').addEventListener('click', function () {
      pracCheck();
    });
    $('#prac-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') pracCheck();
    });

    // Quiz
    $('#quiz-start-btn').addEventListener('click', function () {
      startQuiz();
    });
    $('#quiz-next-btn').addEventListener('click', function () {
      quizIndex++;
      showQuizQ();
    });
    $('#quiz-submit-btn').addEventListener('click', function () {
      submitNumeric();
    });
    $('#quiz-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitNumeric();
    });

    // Start in simulate mode with animation
    loop();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
