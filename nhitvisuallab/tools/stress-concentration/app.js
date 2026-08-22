(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     1. DOM REFS
     ══════════════════════════════════════════════════════════════ */
  var canvas = document.getElementById('main-canvas');
  var ctx = canvas.getContext('2d');
  var chartCanvas = document.getElementById('chart-canvas');

  /* Hi-DPI for all three canvases. Each carried fixed width/height attributes
     while the CSS stretches them to their cards, so on a 2x display the stress
     field drew at 2.0x and the Kt chart at 2.5x upscale. Backing stores now
     follow device pixels with the context scaled, so the logical spaces
     (760x440, 760x240, 700x160) are untouched. No canvas pointer interaction
     in this tool. */
  var SC_LOG = { 'main-canvas': [760, 440], 'chart-canvas': [760, 240], 'history-canvas': [700, 160] };
  function fitOne(cv) {
    if (!cv) return;
    var L = SC_LOG[cv.id]; if (!L) return;
    var dpr = window.devicePixelRatio || 1;
    var dW = cv.getBoundingClientRect().width;
    if (!(dW > 40)) dW = L[0];
    cv.width  = Math.round(dW * dpr);
    cv.height = Math.round(dW * (L[1] / L[0]) * dpr);
    cv.getContext('2d').setTransform((dW * dpr) / L[0], 0, 0, (dW * dpr) / L[0], 0, 0);
  }
  function fitAllSC() {
    fitOne(document.getElementById('main-canvas'));
    fitOne(document.getElementById('chart-canvas'));
    fitOne(document.getElementById('history-canvas'));
  }

  var cctx = chartCanvas.getContext('2d');

  var ktValueEl = document.getElementById('kt-value');
  // Answer strip above the controls — mirrors the canvas readout so a mobile
  // visitor sees Kt without scrolling. Optional: guarded everywhere below.
  var asKtEl = document.getElementById('as-kt');
  var asSmaxEl = document.getElementById('as-smax');
  var asSnomEl = document.getElementById('as-snom');
  var asRatioEl = document.getElementById('as-ratio');
  var sigNomEl = document.getElementById('sig-nom');
  var sigMaxEl = document.getElementById('sig-max');
  var ratioValEl = document.getElementById('ratio-val');
  var simControls = document.getElementById('sim-controls');

  /* Sections */
  var simSection = document.getElementById('sim-section');
  var exploreSection = document.getElementById('explore-section');
  var practiceSection = document.getElementById('practice-section');
  var quizSection = document.getElementById('quiz-section');

  /* ══════════════════════════════════════════════════════════════
     2. STATE
     ══════════════════════════════════════════════════════════════ */
  var mode = 'simulate';
  var geoType = 0; // 0..7
  var unitSystem = 'si'; // 'si' or 'imp'
  var showDimensions = true;
  var showEqnOverlay = true;
  var ktHistory = [];
  var HIST_MAX = 60;

  /* Unit conversion helpers (internal storage is always SI: mm, MPa) */
  var MM_PER_IN = 25.4;
  var MPA_PER_KSI = 6.89475729;
  function lenDisp(mm)  { return unitSystem === 'si' ? mm : mm / MM_PER_IN; }
  function lenInput(v)  { return unitSystem === 'si' ? v  : v * MM_PER_IN; }
  function stressDisp(mpa) { return unitSystem === 'si' ? mpa : mpa / MPA_PER_KSI; }
  function stressInput(v)  { return unitSystem === 'si' ? v   : v * MPA_PER_KSI; }
  function lenUnit()    { return unitSystem === 'si' ? 'mm'  : 'in'; }
  function stressUnit() { return unitSystem === 'si' ? 'MPa' : 'ksi'; }
  function fmtLen(mm, p)    { return lenDisp(mm).toFixed(p == null ? (unitSystem==='si'?1:3) : p) + ' ' + lenUnit(); }
  function fmtStress(mpa, p){ return stressDisp(mpa).toFixed(p == null ? 1 : p) + ' ' + stressUnit(); }

  /* Geometry names */
  var GEO_NAMES = [
    'Plate with Center Hole (Tension)',
    'Plate with Edge Notch (Tension)',
    'Plate with Shoulder Fillet (Tension)',
    'Plate with Shoulder Fillet (Bending)',
    'Round Shaft with Fillet (Tension)',
    'Round Shaft with Fillet (Torsion)',
    'Round Shaft with Groove (Tension)',
    'Round Shaft with Transverse Hole (Tension)'
  ];

  /* Default parameters per geometry: { D, d, r, sigNom } */
  var params = {
    D: 100, d: 50, r: 5, sigNom: 100
  };

  /* Parameter ranges per geometry type: [D, d, r, sigNom] */
  var PARAM_CONFIG = [
    /* 0: Plate center hole   */ { labels: ['Plate Width D', 'Hole Diameter d', null, 'Nominal Stress'], Drange: [40, 200], drange: [5, 100], rrange: null, sigRange: [10, 500], defaults: { D: 100, d: 20, r: 10, sigNom: 100 } },
    /* 1: Plate edge notch    */ { labels: ['Plate Width D', 'Notch Depth t', 'Notch Radius r', 'Nominal Stress'], Drange: [40, 200], drange: [2, 60], rrange: [0.5, 30], sigRange: [10, 500], defaults: { D: 100, d: 15, r: 5, sigNom: 100 } },
    /* 2: Plate fillet tension */ { labels: ['Large Width D', 'Small Width d', 'Fillet Radius r', 'Nominal Stress'], Drange: [40, 200], drange: [20, 180], rrange: [0.5, 30], sigRange: [10, 500], defaults: { D: 100, d: 60, r: 5, sigNom: 100 } },
    /* 3: Plate fillet bending */ { labels: ['Large Width D', 'Small Width d', 'Fillet Radius r', 'Nominal Stress'], Drange: [40, 200], drange: [20, 180], rrange: [0.5, 30], sigRange: [10, 500], defaults: { D: 100, d: 60, r: 5, sigNom: 100 } },
    /* 4: Shaft fillet tension */ { labels: ['Large Diameter D', 'Small Diameter d', 'Fillet Radius r', 'Nominal Stress'], Drange: [20, 200], drange: [10, 180], rrange: [0.5, 20], sigRange: [10, 500], defaults: { D: 80, d: 50, r: 5, sigNom: 100 } },
    /* 5: Shaft fillet torsion */ { labels: ['Large Diameter D', 'Small Diameter d', 'Fillet Radius r', 'Nominal Stress'], Drange: [20, 200], drange: [10, 180], rrange: [0.5, 20], sigRange: [10, 500], defaults: { D: 80, d: 50, r: 5, sigNom: 100 } },
    /* 6: Shaft groove tension */ { labels: ['Shaft Diameter D', 'Groove Depth t', 'Groove Radius r', 'Nominal Stress'], Drange: [20, 200], drange: [2, 40], rrange: [0.5, 20], sigRange: [10, 500], defaults: { D: 80, d: 10, r: 5, sigNom: 100 } },
    /* 7: Shaft trans hole    */ { labels: ['Shaft Diameter D', 'Hole Diameter d', null, 'Nominal Stress'], Drange: [20, 200], drange: [2, 80], rrange: null, sigRange: [10, 500], defaults: { D: 80, d: 15, r: 7.5, sigNom: 100 } }
  ];

  /* ══════════════════════════════════════════════════════════════
     3. Kt CALCULATION FUNCTIONS (Peterson's curve fits)
     ══════════════════════════════════════════════════════════════ */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function calcKt(geo, D, d, r) {
    var ratio, t, h, Dd;
    switch (geo) {
      case 0: /* Plate center hole - tension */
        ratio = clamp(d / D, 0.01, 0.95);
        return 3.0 - 3.13 * ratio + 3.66 * ratio * ratio - 1.53 * ratio * ratio * ratio;

      case 1: /* Plate edge notch - tension */
        /* t = notch depth (stored in d), r = notch radius */
        t = clamp(d, 0.1, D * 0.45);
        var rr = clamp(r, 0.1, t * 2);
        ratio = clamp(t / rr, 0.1, 20);
        /* Peterson approximation for single edge notch */
        if (ratio <= 2) {
          return 1.0 + 0.993 * Math.sqrt(ratio) + 0.18 * ratio;
        }
        return 0.78 + 1.12 * Math.sqrt(ratio);

      case 2: /* Plate shoulder fillet - tension */
        h = clamp((D - d) / 2, 0.1, 100);
        Dd = clamp(D / d, 1.01, 6.0);
        ratio = clamp(h / r, 0.1, 20);
        /* Peterson C-coefficient approximation */
        var C1 = 0.926 + 1.157 * Math.sqrt(Dd) - 0.099 * Dd;
        var C2 = 0.012 - 3.036 * Math.sqrt(Dd) + 0.961 * Dd;
        var C3 = -0.302 + 3.977 * Math.sqrt(Dd) - 1.744 * Dd;
        var C4 = 0.365 - 2.098 * Math.sqrt(Dd) + 0.878 * Dd;
        var hr = clamp(1 / ratio, 0.05, 1);
        return clamp(C1 + C2 * hr + C3 * hr * hr + C4 * hr * hr * hr, 1.0, 10.0);

      case 3: /* Plate shoulder fillet - bending */
        h = clamp((D - d) / 2, 0.1, 100);
        Dd = clamp(D / d, 1.01, 6.0);
        ratio = clamp(h / r, 0.1, 20);
        var B1 = 0.927 + 1.149 * Math.sqrt(Dd) - 0.086 * Dd;
        var B2 = 0.015 - 3.281 * Math.sqrt(Dd) + 0.837 * Dd;
        var B3 = -0.302 + 3.816 * Math.sqrt(Dd) - 1.585 * Dd;
        var B4 = 0.365 - 1.685 * Math.sqrt(Dd) + 0.832 * Dd;
        hr = clamp(1 / ratio, 0.05, 1);
        return clamp(B1 + B2 * hr + B3 * hr * hr + B4 * hr * hr * hr, 1.0, 10.0);

      case 4: /* Round shaft with fillet - tension */
        Dd = clamp(D / d, 1.01, 6.0);
        ratio = clamp(r / d, 0.005, 0.5);
        return clamp(0.89 + 1.48 * Math.pow(ratio, -0.38) - 0.41 * (Dd - 1), 1.0, 10.0);

      case 5: /* Round shaft with fillet - torsion */
        Dd = clamp(D / d, 1.01, 6.0);
        ratio = clamp(r / d, 0.005, 0.5);
        return clamp(0.83 + 0.95 * Math.pow(ratio, -0.35) - 0.3 * (Dd - 1), 1.0, 8.0);

      case 6: /* Round shaft with groove - tension */
        /* t = groove depth (stored in d), r = groove radius */
        t = clamp(d, 0.1, D * 0.4);
        ratio = clamp(t / r, 0.1, 20);
        return clamp(1.0 + 1.08 * Math.sqrt(ratio), 1.0, 10.0);

      case 7: /* Round shaft with transverse hole - tension */
        ratio = clamp(d / D, 0.01, 0.5);
        return clamp(3.0 - 3.14 * ratio + 3.67 * ratio * ratio - 1.527 * ratio * ratio * ratio, 2.0, 3.05);

      default: return 3.0;
    }
  }

  function getRatioLabel(geo, D, d, r) {
    switch (geo) {
      case 0: return 'd/D = ' + (d / D).toFixed(3);
      case 1: return 't/r = ' + (d / r).toFixed(3);
      case 2: case 3: return 'r/h = ' + (r / Math.max((D - d) / 2, 0.1)).toFixed(3);
      case 4: case 5: return 'r/d = ' + (r / d).toFixed(3);
      case 6: return 't/r = ' + (d / r).toFixed(3);
      case 7: return 'd/D = ' + (d / D).toFixed(3);
      default: return '';
    }
  }

  /* ══════════════════════════════════════════════════════════════
     4. SLIDER GENERATION
     ══════════════════════════════════════════════════════════════ */
  function buildSliders() {
    var cfg = PARAM_CONFIG[geoType];
    var def = cfg.defaults;
    params.D = def.D; params.d = def.d; params.r = def.r; params.sigNom = def.sigNom;

    var html = '';
    html += sliderHTML('D', cfg.labels[0], cfg.Drange[0], cfg.Drange[1], def.D, 'len');
    html += sliderHTML('d', cfg.labels[1], cfg.drange[0], cfg.drange[1], def.d, 'len');
    if (cfg.rrange) {
      html += sliderHTML('r', cfg.labels[2], cfg.rrange[0], cfg.rrange[1], def.r, 'len');
    }
    html += sliderHTML('sigNom', cfg.labels[3], cfg.sigRange[0], cfg.sigRange[1], def.sigNom, 'stress');

    simControls.innerHTML = html;

    /* Attach listeners */
    simControls.querySelectorAll('input[type="range"]').forEach(function (r) {
      r.addEventListener('input', onSliderChange);
    });
    simControls.querySelectorAll('input.step-input').forEach(function (n) {
      n.addEventListener('change', onStepInputChange);
    });
    simControls.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', onStepBtnClick);
    });
  }

  function sliderHTML(key, label, minSi, maxSi, valSi, kind) {
    var step = (key === 'r' && minSi < 1) ? 0.1 : 1;
    var dispMin, dispMax, dispVal, unit, dispStep, decimals;
    if (kind === 'len') {
      dispMin = lenDisp(minSi); dispMax = lenDisp(maxSi); dispVal = lenDisp(valSi);
      unit = lenUnit();
      dispStep = unitSystem === 'si' ? step : Math.max(0.01, step / MM_PER_IN);
      decimals = unitSystem === 'si' ? (step < 1 ? 1 : 0) : 3;
    } else {
      dispMin = stressDisp(minSi); dispMax = stressDisp(maxSi); dispVal = stressDisp(valSi);
      unit = stressUnit();
      dispStep = unitSystem === 'si' ? 1 : 0.1;
      decimals = unitSystem === 'si' ? 0 : 2;
    }
    return '<div class="slider-group" data-key="' + key + '" data-kind="' + kind + '">' +
      '<label>' + label + ' <span id="val-' + key + '">' + dispVal.toFixed(decimals) + ' ' + unit + '</span></label>' +
      '<div class="slider-row">' +
        '<button class="step-btn" data-key="' + key + '" data-step="-1" type="button" aria-label="Decrease">&minus;</button>' +
        '<input type="number" class="step-input" data-key="' + key + '" min="' + dispMin + '" max="' + dispMax + '" step="' + dispStep + '" value="' + dispVal.toFixed(decimals) + '">' +
        '<button class="step-btn" data-key="' + key + '" data-step="1" type="button" aria-label="Increase">+</button>' +
        '<span class="step-unit">' + unit + '</span>' +
      '</div>' +
      '<input type="range" data-key="' + key + '" data-kind="' + kind + '" min="' + dispMin + '" max="' + dispMax + '" value="' + dispVal + '" step="' + dispStep + '">' +
      '</div>';
  }

  function commitParam(key, dispVal) {
    var grp = simControls.querySelector('.slider-group[data-key="' + key + '"]');
    var kind = grp ? grp.dataset.kind : 'len';
    var siVal = (kind === 'stress') ? stressInput(dispVal) : lenInput(dispVal);
    params[key] = siVal;

    /* Enforce d < D for fillets/shafts */
    if ((geoType >= 2 && geoType <= 5)) {
      if (params.d > params.D - 2) params.d = Math.max(1, params.D - 2);
    }
    refreshAllInputs();
    updateReadouts();
    pushHistory();
    draw();
    drawChart();
    renderEquations();
    renderCoach();
    drawHistory();
  }

  function refreshAllInputs() {
    ['D','d','r','sigNom'].forEach(function (key) {
      var grp = simControls.querySelector('.slider-group[data-key="' + key + '"]');
      if (!grp) return;
      var kind = grp.dataset.kind;
      var siVal = params[key];
      var disp = (kind === 'stress') ? stressDisp(siVal) : lenDisp(siVal);
      var decimals = (kind === 'stress')
        ? (unitSystem === 'si' ? 0 : 2)
        : (unitSystem === 'si' ? (key === 'r' ? 1 : 0) : 3);
      var unit = (kind === 'stress') ? stressUnit() : lenUnit();
      var lbl = document.getElementById('val-' + key);
      if (lbl) lbl.textContent = disp.toFixed(decimals) + ' ' + unit;
      var num = grp.querySelector('input.step-input');
      var rng = grp.querySelector('input[type="range"]');
      if (num) num.value = disp.toFixed(decimals);
      if (rng) rng.value = disp;
    });
  }

  function onSliderChange(e) {
    commitParam(e.target.dataset.key, parseFloat(e.target.value));
  }
  function onStepInputChange(e) {
    var v = parseFloat(e.target.value);
    if (!isFinite(v)) return;
    commitParam(e.target.dataset.key, v);
  }
  function onStepBtnClick(e) {
    var key = e.target.dataset.key;
    var dir = parseInt(e.target.dataset.step, 10);
    var grp = simControls.querySelector('.slider-group[data-key="' + key + '"]');
    var rng = grp.querySelector('input[type="range"]');
    var step = parseFloat(rng.step) || 1;
    var cur = parseFloat(rng.value);
    var newVal = clamp(cur + dir * step, parseFloat(rng.min), parseFloat(rng.max));
    commitParam(key, newVal);
  }

  /* ══════════════════════════════════════════════════════════════
     5. READOUT UPDATE
     ══════════════════════════════════════════════════════════════ */
  function updateReadouts() {
    var kt = calcKt(geoType, params.D, params.d, params.r);
    var sigMax = kt * params.sigNom;
    ktValueEl.textContent = kt.toFixed(3);
    sigNomEl.textContent = fmtStress(params.sigNom);
    sigMaxEl.textContent = fmtStress(sigMax);
    ratioValEl.textContent = getRatioLabel(geoType, params.D, params.d, params.r);
    if (asKtEl) asKtEl.textContent = kt.toFixed(3);
    if (asSmaxEl) asSmaxEl.textContent = fmtStress(sigMax);
    if (asSnomEl) asSnomEl.textContent = fmtStress(params.sigNom);
    if (asRatioEl) asRatioEl.textContent = getRatioLabel(geoType, params.D, params.d, params.r);
  }

  /* ══════════════════════════════════════════════════════════════
     6. CANVAS DRAWING — MAIN (Stress Visualization)
     ══════════════════════════════════════════════════════════════ */
  function stressColor(ratio) {
    /* ratio 0..1 maps blue -> cyan -> green -> yellow -> red */
    var r2 = clamp(ratio, 0, 1);
    var rr, gg, bb;
    if (r2 < 0.25) {
      var t2 = r2 / 0.25;
      rr = 0; gg = Math.round(100 + 155 * t2); bb = Math.round(255 * (1 - t2));
    } else if (r2 < 0.5) {
      var t3 = (r2 - 0.25) / 0.25;
      rr = 0; gg = 255; bb = 0;
      rr = Math.round(100 * t3); gg = 255; bb = 0;
    } else if (r2 < 0.75) {
      var t4 = (r2 - 0.5) / 0.25;
      rr = Math.round(100 + 155 * t4); gg = Math.round(255 * (1 - 0.3 * t4)); bb = 0;
    } else {
      var t5 = (r2 - 0.75) / 0.25;
      rr = 255; gg = Math.round(178 * (1 - t5)); bb = 0;
    }
    return 'rgb(' + rr + ',' + gg + ',' + bb + ')';
  }

  function draw() {
    var W = 760, H = 440;   /* logical space; backing is DPR-scaled */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var kt = calcKt(geoType, params.D, params.d, params.r);
    var cx = W / 2;
    var cy = H / 2;

    ctx.save();

    switch (geoType) {
      case 0: drawPlateHole(W, H, cx, cy, kt); break;
      case 1: drawPlateNotch(W, H, cx, cy, kt); break;
      case 2: case 3: drawPlateFillet(W, H, cx, cy, kt); break;
      case 4: case 5: drawShaftFillet(W, H, cx, cy, kt); break;
      case 6: drawShaftGroove(W, H, cx, cy, kt); break;
      case 7: drawShaftTransHole(W, H, cx, cy, kt); break;
    }

    ctx.restore();

    /* Title */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '13px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(GEO_NAMES[geoType], cx, H - 12);

    /* Kt label */
    ctx.fillStyle = '#e040fb';
    ctx.font = 'bold 16px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Kt = ' + kt.toFixed(3), 16, 28);

    /* Classical equation overlay */
    if (showEqnOverlay) {
      var sigMaxLocal = kt * params.sigNom;
      ctx.fillStyle = '#dde3f0';
      ctx.font = '12px Segoe UI, system-ui, sans-serif';
      ctx.fillText('σ_max = Kt × σ_nom', 16, 48);
      ctx.fillStyle = '#f5c842';
      ctx.font = '12px Courier New, monospace';
      ctx.fillText('= ' + kt.toFixed(3) + ' × ' + fmtStress(params.sigNom, 1) + ' = ' + fmtStress(sigMaxLocal, 1), 16, 64);
    }

    /* Color legend */
    drawLegend(W, H);
  }

  function drawLegend(W, H) {
    var lx = W - 140;
    var ly = 20;
    var lw = 120;
    var lh = 12;
    var grad = ctx.createLinearGradient(lx, ly, lx + lw, ly);
    grad.addColorStop(0, stressColor(0));
    grad.addColorStop(0.25, stressColor(0.25));
    grad.addColorStop(0.5, stressColor(0.5));
    grad.addColorStop(0.75, stressColor(0.75));
    grad.addColorStop(1, stressColor(1));
    ctx.fillStyle = grad;
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, lw, lh);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('\u03C3_nom', lx, ly + lh + 12);
    ctx.textAlign = 'right';
    ctx.fillText('Kt\u00D7\u03C3_nom', lx + lw, ly + lh + 12);
  }

  /* ── Individual geometry drawing functions ── */

  function drawPlateHole(W, H, cx, cy, kt) {
    var scale = Math.min((W - 100) / params.D, (H - 120) / (params.D * 0.6));
    scale = Math.min(scale, 3);
    var pW = params.D * scale;
    var pH = params.D * 0.5 * scale;
    var holeR = (params.d / 2) * scale;

    /* Stress field */
    drawStressField(cx - pW / 2, cy - pH / 2, pW, pH, function (x, y) {
      var dx = x - cx;
      var dy = y - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < holeR) return -1; /* inside hole */
      var ang = Math.atan2(dy, dx);
      var nearFactor = holeR / Math.max(dist, holeR + 1);
      /* Stress is highest at 90 degrees (top/bottom of hole) */
      var angFactor = Math.abs(Math.sin(ang));
      var stress = (1 + (kt - 1) * nearFactor * nearFactor * (0.3 + 0.7 * angFactor * angFactor));
      return clamp((stress - 1) / (kt - 1 + 0.001), 0, 1);
    });

    /* Plate outline */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - pW / 2, cy - pH / 2, pW, pH);

    /* Hole */
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#dde3f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
    ctx.stroke();

    /* Dimension lines */
    drawDim(cx - pW / 2, cy - pH / 2 - 20, cx + pW / 2, cy - pH / 2 - 20, dimLabel('D', params.D));
    drawDim(cx - holeR, cy + pH / 2 + 20, cx + holeR, cy + pH / 2 + 20, dimLabel('d', params.d));

    /* Force arrows */
    drawForceArrows(cx - pW / 2, cx + pW / 2, cy, pH, 'horizontal');
  }

  function drawPlateNotch(W, H, cx, cy, kt) {
    var scale = Math.min((W - 100) / params.D, (H - 120) / (params.D * 0.6));
    scale = Math.min(scale, 3);
    var pW = params.D * scale;
    var pH = params.D * 0.5 * scale;
    var notchD = params.d * scale;
    var notchR = params.r * scale;

    /* Stress field */
    drawStressField(cx - pW / 2, cy - pH / 2, pW, pH, function (x, y) {
      /* Notch on right side */
      var notchX = cx + pW / 2;
      var dx = notchX - x;
      var dy = Math.abs(y - cy);
      if (dx < 0) return 0;
      if (dx < notchD && dy < notchR) return -1;
      var dist = Math.sqrt(dx * dx + (dy > 0 ? dy * dy : 0));
      var nearFactor = Math.exp(-dist / (notchD * 1.5));
      return clamp(nearFactor * (kt / 3), 0, 1);
    });

    /* Plate outline with notch */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - pW / 2, cy - pH / 2);
    ctx.lineTo(cx + pW / 2, cy - pH / 2);
    /* Right notch */
    ctx.lineTo(cx + pW / 2, cy - notchR);
    ctx.arc(cx + pW / 2 - notchD, cy, notchR, -Math.PI / 2 * (notchR / notchR), Math.PI / 2, false);
    ctx.lineTo(cx + pW / 2, cy + pH / 2);
    ctx.lineTo(cx - pW / 2, cy + pH / 2);
    ctx.closePath();
    ctx.stroke();

    drawDim(cx - pW / 2, cy - pH / 2 - 20, cx + pW / 2, cy - pH / 2 - 20, dimLabel('D', params.D));
    drawForceArrows(cx - pW / 2, cx + pW / 2, cy, pH, 'horizontal');
  }

  function drawPlateFillet(W, H, cx, cy, kt) {
    var scale = Math.min((W - 100) / params.D, (H - 120) / (params.D * 0.55));
    scale = Math.min(scale, 3);
    var bigW = params.D * scale;
    var smallW = params.d * scale;
    var h = (bigW - smallW) / 2;
    var filletR = params.r * scale;
    var plateLen = bigW * 1.2;
    var halfLen = plateLen / 2;

    /* Stress field on smaller section */
    drawStressField(cx - halfLen, cy - bigW / 2, plateLen, bigW, function (x, y) {
      var relX = x - cx;
      var distFromCenter = Math.abs(y - cy);
      /* Transition zone */
      if (relX > -halfLen * 0.2 && relX < halfLen * 0.2) {
        var transR = Math.sqrt(relX * relX + (distFromCenter - smallW / 2) * (distFromCenter - smallW / 2));
        var nearFactor = Math.exp(-transR / (filletR * 3 + 1));
        if (distFromCenter > smallW / 2) return -1;
        return clamp(nearFactor * (kt - 1) / (kt), 0, 1);
      }
      if (distFromCenter > (relX < 0 ? bigW / 2 : smallW / 2)) return -1;
      return clamp(0.15 + 0.1 * Math.random(), 0, 0.3);
    });

    /* Draw plate shape */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - halfLen, cy - bigW / 2);
    ctx.lineTo(cx - halfLen * 0.15, cy - bigW / 2);
    /* Fillet top */
    ctx.quadraticCurveTo(cx + halfLen * 0.05, cy - smallW / 2, cx + halfLen * 0.15, cy - smallW / 2);
    ctx.lineTo(cx + halfLen, cy - smallW / 2);
    ctx.lineTo(cx + halfLen, cy + smallW / 2);
    ctx.lineTo(cx + halfLen * 0.15, cy + smallW / 2);
    /* Fillet bottom */
    ctx.quadraticCurveTo(cx + halfLen * 0.05, cy + bigW / 2, cx - halfLen * 0.15, cy + bigW / 2);
    ctx.lineTo(cx - halfLen, cy + bigW / 2);
    ctx.closePath();
    ctx.stroke();

    /* Dimensions */
    drawDim(cx - halfLen - 16, cy - bigW / 2, cx - halfLen - 16, cy + bigW / 2, dimLabel('D', params.D));
    drawDim(cx + halfLen + 16, cy - smallW / 2, cx + halfLen + 16, cy + smallW / 2, dimLabel('d', params.d));

    drawForceArrows(cx - halfLen, cx + halfLen, cy, smallW, 'horizontal');
  }

  function drawShaftFillet(W, H, cx, cy, kt) {
    var scale = Math.min((W - 100) / (params.D * 2.5), (H - 120) / params.D);
    scale = Math.min(scale, 3);
    var bigD = params.D * scale;
    var smallD = params.d * scale;
    var filletR = params.r * scale;
    var shaftLen = bigD * 2.2;
    var halfLen = shaftLen / 2;

    /* Stress field */
    drawStressField(cx - halfLen, cy - bigD / 2, shaftLen, bigD, function (x, y) {
      var relX = x - cx;
      var distFromAxis = Math.abs(y - cy);
      var localR = relX < 0 ? bigD / 2 : smallD / 2;
      if (distFromAxis > localR + 2) return -1;
      /* Near fillet */
      if (Math.abs(relX) < halfLen * 0.15) {
        var transD = Math.sqrt(relX * relX + (distFromAxis - smallD / 2) * (distFromAxis - smallD / 2));
        var nearF = Math.exp(-transD / (filletR * 3 + 1));
        return clamp(nearF * (kt - 1) / kt, 0, 1);
      }
      return clamp(0.12, 0, 0.2);
    });

    /* Draw shaft shape (side view = rectangle with step) */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - halfLen, cy - bigD / 2);
    ctx.lineTo(cx - halfLen * 0.1, cy - bigD / 2);
    ctx.quadraticCurveTo(cx + halfLen * 0.05, cy - smallD / 2, cx + halfLen * 0.12, cy - smallD / 2);
    ctx.lineTo(cx + halfLen, cy - smallD / 2);
    ctx.lineTo(cx + halfLen, cy + smallD / 2);
    ctx.lineTo(cx + halfLen * 0.12, cy + smallD / 2);
    ctx.quadraticCurveTo(cx + halfLen * 0.05, cy + bigD / 2, cx - halfLen * 0.1, cy + bigD / 2);
    ctx.lineTo(cx - halfLen, cy + bigD / 2);
    ctx.closePath();
    ctx.stroke();

    /* Center line */
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - halfLen - 10, cy);
    ctx.lineTo(cx + halfLen + 10, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Dimensions */
    drawDim(cx - halfLen - 16, cy - bigD / 2, cx - halfLen - 16, cy + bigD / 2, dimLabel('D', params.D));
    drawDim(cx + halfLen + 16, cy - smallD / 2, cx + halfLen + 16, cy + smallD / 2, dimLabel('d', params.d));

    drawForceArrows(cx - halfLen, cx + halfLen, cy, smallD, 'horizontal');
  }

  function drawShaftGroove(W, H, cx, cy, kt) {
    var scale = Math.min((W - 100) / (params.D * 2.5), (H - 120) / params.D);
    scale = Math.min(scale, 3);
    var shaftD = params.D * scale;
    var grooveD = params.d * scale; /* groove depth */
    var grooveR = params.r * scale;
    var shaftLen = shaftD * 2.5;
    var halfLen = shaftLen / 2;
    var netD = shaftD - 2 * grooveD;

    /* Stress field */
    drawStressField(cx - halfLen, cy - shaftD / 2, shaftLen, shaftD, function (x, y) {
      var distFromAxis = Math.abs(y - cy);
      if (distFromAxis > shaftD / 2) return -1;
      var relX = Math.abs(x - cx);
      /* Near groove */
      if (relX < grooveR * 2) {
        var transD2 = Math.sqrt(relX * relX + (distFromAxis - netD / 2) * (distFromAxis - netD / 2));
        var nearF2 = Math.exp(-transD2 / (grooveR * 3 + 1));
        return clamp(nearF2 * (kt - 1) / kt, 0, 1);
      }
      return 0.12;
    });

    /* Shaft with groove */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - halfLen, cy - shaftD / 2);
    ctx.lineTo(cx - grooveR, cy - shaftD / 2);
    /* Groove top */
    ctx.quadraticCurveTo(cx, cy - netD / 2, cx + grooveR, cy - shaftD / 2);
    ctx.lineTo(cx + halfLen, cy - shaftD / 2);
    ctx.lineTo(cx + halfLen, cy + shaftD / 2);
    ctx.lineTo(cx + grooveR, cy + shaftD / 2);
    /* Groove bottom */
    ctx.quadraticCurveTo(cx, cy + netD / 2, cx - grooveR, cy + shaftD / 2);
    ctx.lineTo(cx - halfLen, cy + shaftD / 2);
    ctx.closePath();
    ctx.stroke();

    /* Center line */
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - halfLen - 10, cy);
    ctx.lineTo(cx + halfLen + 10, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    drawDim(cx - halfLen - 16, cy - shaftD / 2, cx - halfLen - 16, cy + shaftD / 2, dimLabel('D', params.D));
    drawForceArrows(cx - halfLen, cx + halfLen, cy, shaftD, 'horizontal');
  }

  function drawShaftTransHole(W, H, cx, cy, kt) {
    var scale = Math.min((W - 100) / (params.D * 2.5), (H - 120) / params.D);
    scale = Math.min(scale, 3);
    var shaftD = params.D * scale;
    var holeD = params.d * scale;
    var shaftLen = shaftD * 2.5;
    var halfLen = shaftLen / 2;

    /* Stress field */
    drawStressField(cx - halfLen, cy - shaftD / 2, shaftLen, shaftD, function (x, y) {
      var distFromAxis = Math.abs(y - cy);
      if (distFromAxis > shaftD / 2) return -1;
      var dx2 = x - cx;
      var dist3 = Math.sqrt(dx2 * dx2 + (y - cy) * (y - cy));
      if (dist3 < holeD / 2) return -1;
      var nearF3 = (holeD / 2) / Math.max(dist3, holeD / 2 + 1);
      var angF = Math.abs(Math.sin(Math.atan2(y - cy, dx2)));
      return clamp(nearF3 * nearF3 * (0.3 + 0.7 * angF * angF), 0, 1);
    });

    /* Shaft rectangle */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - halfLen, cy - shaftD / 2, shaftLen, shaftD);

    /* Hole */
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, holeD / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#dde3f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, holeD / 2, 0, Math.PI * 2);
    ctx.stroke();

    /* Center line */
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - halfLen - 10, cy);
    ctx.lineTo(cx + halfLen + 10, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    drawDim(cx - halfLen - 16, cy - shaftD / 2, cx - halfLen - 16, cy + shaftD / 2, dimLabel('D', params.D));
    drawDim(cx - holeD / 2, cy + shaftD / 2 + 20, cx + holeD / 2, cy + shaftD / 2 + 20, dimLabel('d', params.d));
    drawForceArrows(cx - halfLen, cx + halfLen, cy, shaftD, 'horizontal');
  }

  /* ── Stress field rendering helper ── */
  function drawStressField(x0, y0, w, h, stressFn) {
    var step = 4;
    for (var px = x0; px < x0 + w; px += step) {
      for (var py = y0; py < y0 + h; py += step) {
        var s = stressFn(px + step / 2, py + step / 2);
        if (s < 0) continue; /* inside void */
        ctx.fillStyle = stressColor(s);
        ctx.globalAlpha = 0.6 + 0.4 * s;
        ctx.fillRect(px, py, step, step);
      }
    }
    ctx.globalAlpha = 1;
  }

  function dimLabel(prefix, valMm) {
    var dec = unitSystem === 'si' ? (valMm < 10 ? 1 : 0) : 2;
    return prefix + '=' + lenDisp(valMm).toFixed(dec) + ' ' + lenUnit();
  }

  /* ── Dimension line helper ── */
  function drawDim(x1, y1, x2, y2, label) {
    if (!showDimensions) return;
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    /* Arrowheads */
    var vertical = Math.abs(x1 - x2) < 2;
    if (vertical) {
      drawArrowHead(x1, y1, 0, 1);
      drawArrowHead(x2, y2, 0, -1);
    } else {
      drawArrowHead(x1, y1, 1, 0);
      drawArrowHead(x2, y2, -1, 0);
    }

    /* Label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '11px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (vertical) {
      ctx.save();
      ctx.translate(x1 - 8, (y1 + y2) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(label, (x1 + x2) / 2, y1 - 6);
    }
  }

  function drawArrowHead(x, y, dx, dy) {
    var sz = 5;
    ctx.fillStyle = '#6b7a99';
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (dx !== 0) {
      ctx.lineTo(x - dx * sz, y - sz / 2);
      ctx.lineTo(x - dx * sz, y + sz / 2);
    } else {
      ctx.lineTo(x - sz / 2, y - dy * sz);
      ctx.lineTo(x + sz / 2, y - dy * sz);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ── Force arrows ── */
  function drawForceArrows(xLeft, xRight, cy, height, dir) {
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#e040fb';
    var count = 3;
    var spacing = height / (count + 1);

    for (var i = 1; i <= count; i++) {
      var yy = cy - height / 2 + i * spacing;
      /* Left arrow (pointing right = tension pull from left) */
      ctx.beginPath();
      ctx.moveTo(xLeft - 30, yy);
      ctx.lineTo(xLeft - 6, yy);
      ctx.stroke();
      drawArrowHeadAccent(xLeft - 6, yy, 1, 0);

      /* Right arrow (pointing left = tension pull from right) */
      ctx.beginPath();
      ctx.moveTo(xRight + 30, yy);
      ctx.lineTo(xRight + 6, yy);
      ctx.stroke();
      drawArrowHeadAccent(xRight + 6, yy, -1, 0);
    }

    ctx.fillStyle = '#e040fb';
    ctx.font = 'bold 12px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P', xLeft - 30, cy - height / 2 - 6);
    ctx.fillText('P', xRight + 30, cy - height / 2 - 6);
  }

  function drawArrowHeadAccent(x, y, dx, dy) {
    var sz = 7;
    ctx.fillStyle = '#e040fb';
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (dx !== 0) {
      ctx.lineTo(x - dx * sz, y - sz / 2);
      ctx.lineTo(x - dx * sz, y + sz / 2);
    } else {
      ctx.lineTo(x - sz / 2, y - dy * sz);
      ctx.lineTo(x + sz / 2, y - dy * sz);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ══════════════════════════════════════════════════════════════
     7. CHART DRAWING — Kt vs Ratio
     ══════════════════════════════════════════════════════════════ */
  function drawChart() {
    var W = 760, H = 240;   /* logical space; backing is DPR-scaled */
    cctx.clearRect(0, 0, W, H);
    cctx.fillStyle = '#0d1117';
    cctx.fillRect(0, 0, W, H);

    var pad = { l: 60, r: 30, t: 30, b: 40 };
    var plotW = W - pad.l - pad.r;
    var plotH = H - pad.t - pad.b;

    /* Determine axis ranges */
    var ratioMin, ratioMax, ratioLabel2;
    var kt, curRatio;

    switch (geoType) {
      case 0:
        ratioMin = 0.01; ratioMax = 0.9; ratioLabel2 = 'd/D';
        curRatio = params.d / params.D;
        break;
      case 1: case 6:
        ratioMin = 0.2; ratioMax = 10; ratioLabel2 = 't/r';
        curRatio = params.d / params.r;
        break;
      case 2: case 3:
        ratioMin = 0.05; ratioMax = 1; ratioLabel2 = 'r/h';
        curRatio = params.r / Math.max((params.D - params.d) / 2, 0.1);
        break;
      case 4: case 5:
        ratioMin = 0.01; ratioMax = 0.4; ratioLabel2 = 'r/d';
        curRatio = params.r / params.d;
        break;
      case 7:
        ratioMin = 0.01; ratioMax = 0.45; ratioLabel2 = 'd/D';
        curRatio = params.d / params.D;
        break;
      default:
        ratioMin = 0; ratioMax = 1; ratioLabel2 = 'ratio'; curRatio = 0.5;
    }

    /* Generate curve data */
    var numPts = 200;
    var pts = [];
    var ktMin = 99, ktMax = 0;
    for (var i = 0; i <= numPts; i++) {
      var r2 = ratioMin + (ratioMax - ratioMin) * i / numPts;
      var ktv;
      switch (geoType) {
        case 0: ktv = calcKt(0, 1, r2, 0); break;
        case 1: ktv = calcKt(1, params.D, r2 * params.r, params.r); break;
        case 2: ktv = calcKt(2, params.D, params.D - 2 * r2 * 1, r2 * Math.max((params.D - params.d) / 2, 0.1) / r2); break;
        case 3: ktv = calcKt(3, params.D, params.D - 2 * r2 * 1, r2 * Math.max((params.D - params.d) / 2, 0.1) / r2); break;
        case 4: ktv = calcKt(4, params.D, params.d, r2 * params.d); break;
        case 5: ktv = calcKt(5, params.D, params.d, r2 * params.d); break;
        case 6: ktv = calcKt(6, params.D, r2 * params.r, params.r); break;
        case 7: ktv = calcKt(7, 1, r2, 0); break;
        default: ktv = 3;
      }
      pts.push({ ratio: r2, kt: ktv });
      if (ktv < ktMin) ktMin = ktv;
      if (ktv > ktMax) ktMax = ktv;
    }

    /* Pad Kt range */
    ktMin = Math.max(1, Math.floor(ktMin * 10) / 10 - 0.2);
    ktMax = Math.ceil(ktMax * 10) / 10 + 0.3;
    if (ktMax - ktMin < 0.5) ktMax = ktMin + 0.5;

    /* Grid */
    cctx.strokeStyle = '#2a3050';
    cctx.lineWidth = 0.5;
    for (var gx = 0; gx <= 5; gx++) {
      var xx = pad.l + plotW * gx / 5;
      cctx.beginPath(); cctx.moveTo(xx, pad.t); cctx.lineTo(xx, pad.t + plotH); cctx.stroke();
    }
    for (var gy = 0; gy <= 4; gy++) {
      var yy2 = pad.t + plotH * gy / 4;
      cctx.beginPath(); cctx.moveTo(pad.l, yy2); cctx.lineTo(pad.l + plotW, yy2); cctx.stroke();
    }

    /* Axes labels */
    cctx.fillStyle = '#6b7a99';
    cctx.font = '11px Segoe UI, system-ui, sans-serif';
    cctx.textAlign = 'center';
    for (var lx = 0; lx <= 5; lx++) {
      var xv = ratioMin + (ratioMax - ratioMin) * lx / 5;
      cctx.fillText(xv.toFixed(2), pad.l + plotW * lx / 5, pad.t + plotH + 16);
    }
    cctx.textAlign = 'right';
    for (var ly = 0; ly <= 4; ly++) {
      var yv = ktMax - (ktMax - ktMin) * ly / 4;
      cctx.fillText(yv.toFixed(2), pad.l - 8, pad.t + plotH * ly / 4 + 4);
    }

    /* Axis titles */
    cctx.fillStyle = '#dde3f0';
    cctx.font = '12px Segoe UI, system-ui, sans-serif';
    cctx.textAlign = 'center';
    cctx.fillText(ratioLabel2, pad.l + plotW / 2, H - 4);
    cctx.save();
    cctx.translate(14, pad.t + plotH / 2);
    cctx.rotate(-Math.PI / 2);
    cctx.fillText('Kt', 0, 0);
    cctx.restore();

    /* Plot curve */
    cctx.strokeStyle = '#e040fb';
    cctx.lineWidth = 2;
    cctx.beginPath();
    for (var pi = 0; pi < pts.length; pi++) {
      var px2 = pad.l + plotW * (pts[pi].ratio - ratioMin) / (ratioMax - ratioMin);
      var py2 = pad.t + plotH * (1 - (pts[pi].kt - ktMin) / (ktMax - ktMin));
      if (pi === 0) cctx.moveTo(px2, py2); else cctx.lineTo(px2, py2);
    }
    cctx.stroke();

    /* Current point marker */
    var curKt = calcKt(geoType, params.D, params.d, params.r);
    var markerX = pad.l + plotW * (clamp(curRatio, ratioMin, ratioMax) - ratioMin) / (ratioMax - ratioMin);
    var markerY = pad.t + plotH * (1 - (curKt - ktMin) / (ktMax - ktMin));
    cctx.fillStyle = '#e040fb';
    cctx.beginPath();
    cctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
    cctx.fill();
    cctx.strokeStyle = '#fff';
    cctx.lineWidth = 2;
    cctx.stroke();

    /* Value label at marker */
    cctx.fillStyle = '#fff';
    cctx.font = 'bold 11px Segoe UI, system-ui, sans-serif';
    cctx.textAlign = 'left';
    cctx.fillText('Kt=' + curKt.toFixed(3), markerX + 10, markerY - 6);

    /* Title */
    cctx.fillStyle = '#dde3f0';
    cctx.font = 'bold 13px Segoe UI, system-ui, sans-serif';
    cctx.textAlign = 'left';
    cctx.fillText('Kt vs ' + ratioLabel2 + ' — ' + GEO_NAMES[geoType], pad.l, pad.t - 10);
  }

  /* ══════════════════════════════════════════════════════════════
     8. MODE SWITCHING
     ══════════════════════════════════════════════════════════════ */
  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.value;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;
    simSection.style.display = m === 'simulate' ? '' : 'none';
    exploreSection.style.display = m === 'explore' ? '' : 'none';
    practiceSection.style.display = m === 'practice' ? '' : 'none';
    quizSection.style.display = m === 'quiz' ? '' : 'none';

    if (m === 'simulate') { draw(); drawChart(); }
    if (m === 'explore') { renderExplore(); }
    if (m === 'practice') { newPracticeQuestion(); }
    if (m === 'quiz') { startQuiz(); }
  }

  /* Geometry tabs */
  document.getElementById('geo-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.geo-btn')) return;
    geoType = parseInt(e.target.dataset.geo, 10);
    document.querySelectorAll('.geo-btn').forEach(function (b) {
      b.classList.toggle('active', b === e.target);
    });
    buildSliders();
    populatePresets();
    updateReadouts();
    pushHistory();
    draw();
    drawChart();
    renderEquations();
    renderCoach();
    drawHistory();
  });

  /* ══════════════════════════════════════════════════════════════
     9. EXPLORE MODE
     ══════════════════════════════════════════════════════════════ */
  var EXPLORE_DATA = {
    fundamentals: [
      { title: 'What is Stress Concentration?', formula: '\u03C3_max = Kt \u00D7 \u03C3_nom', desc: 'Stress concentration occurs when the cross-sectional area of a member changes abruptly. At geometric discontinuities (holes, notches, fillets), local stress can be several times higher than the average nominal stress. The stress concentration factor Kt quantifies this amplification.', example: 'A plate with width 100 mm and a 20 mm center hole under 50 kN tension:\n\u03C3_nom = P / (D-d)\u00D7t = 50000 / (100-20)\u00D710 = 62.5 MPa\nKt = 2.51, so \u03C3_max = 2.51 \u00D7 62.5 = <strong>156.9 MPa</strong>' },
      { title: 'Why Does Stress Concentrate?', formula: 'Force flow lines crowd around discontinuities', desc: 'Imagine stress as water flowing through a channel. When the channel narrows (a notch or hole), the flow speeds up. Similarly, force flow lines must detour around holes and notches, crowding together and increasing local stress. The sharper the discontinuity, the more severe the concentration.', example: 'A sharp 90\u00B0 corner theoretically has Kt = \u221E. In practice, even a tiny fillet radius r = 0.5 mm reduces Kt from \u221E to about 4\u20136, showing why "sharp corners" are avoided in design.' },
      { title: 'Nominal Stress Definitions', formula: 'Tension: \u03C3_nom = P/A\nBending: \u03C3_nom = Mc/I\nTorsion: \u03C4_nom = Tc/J', desc: 'The nominal stress is calculated using the net cross-section (after subtracting the discontinuity). For tension, divide force by net area. For bending, use the flexure formula at the net section. For torsion, use the smaller shaft diameter to compute the polar moment of inertia.', example: 'Shaft with D=80mm, d=50mm, fillet, under T=500 N\u00B7m torsion:\nJ = \u03C0d\u2074/32 = \u03C0(0.05)\u2074/32 = 6.14\u00D710\u207B\u2077 m\u2074\n\u03C4_nom = Tc/J = 500\u00D70.025/6.14e-7 = <strong>20.4 MPa</strong>' }
    ],
    plates: [
      { title: 'Plate with Central Hole', formula: 'Kt = 3.0 - 3.13(d/D) + 3.66(d/D)\u00B2 - 1.53(d/D)\u00B3', desc: 'For an infinite plate with a small hole, Kt = 3.0 (Kirsch solution). As the hole diameter increases relative to plate width, Kt first decreases slightly then the net-section stress dominates. The formula above applies for d/D from 0 to ~0.95.', example: 'd/D = 0.2: Kt = 3.0 - 3.13(0.2) + 3.66(0.04) - 1.53(0.008) = 3.0 - 0.626 + 0.146 - 0.012 = <strong>2.508</strong>' },
      { title: 'Plate with Edge Notch', formula: 'Kt \u2248 1 + 0.993\u221A(t/r) + 0.18(t/r)  for t/r \u2264 2', desc: 'A semi-circular edge notch under tension concentrates stress at the notch root. The key ratio is notch depth (t) to notch radius (r). Deeper and sharper notches produce higher Kt. A semicircular notch (t = r) gives Kt \u2248 3.07.', example: 'Notch depth t = 10 mm, radius r = 5 mm: t/r = 2\nKt = 1 + 0.993\u00D7\u221A2 + 0.18\u00D72 = 1 + 1.404 + 0.36 = <strong>2.764</strong>' },
      { title: 'Plate with Shoulder Fillet', formula: 'Kt = C1 + C2(r/h) + C3(r/h)\u00B2 + C4(r/h)\u00B3', desc: 'When a wide plate steps down to a narrower one through a fillet, stress concentrates at the fillet radius. Kt depends on two ratios: D/d (width ratio) and r/h where h = (D-d)/2 is the step height. Larger fillet radii significantly reduce Kt. Under bending, Kt is typically lower than under tension for the same geometry.', example: 'D=100mm, d=60mm, r=8mm: h=(100-60)/2=20, r/h=0.4\nUsing Peterson coefficients for D/d=1.67: Kt \u2248 <strong>1.85</strong> (tension)' }
    ],
    shafts: [
      { title: 'Shaft with Fillet (Tension)', formula: 'Kt depends on D/d and r/d', desc: 'Stepped shafts are common in machine design (bearing seats, gear locations). Under axial tension, stress concentrates at the fillet where the diameter changes. Increasing the fillet radius is the most effective way to reduce Kt. A typical minimum fillet radius specification is r = 0.02d.', example: 'D=80mm, d=50mm, r=5mm:\nr/d = 0.1, D/d = 1.6\nKt \u2248 <strong>2.05</strong>' },
      { title: 'Shaft with Fillet (Torsion)', formula: 'Kt_torsion < Kt_tension for same geometry', desc: 'Under torsion, the stress concentration at a fillet is lower than under tension for the same D/d and r/d ratios. This is because torsional shear stress distribution is different from tensile stress distribution. The maximum shear stress occurs at the fillet surface.', example: 'Same shaft D=80mm, d=50mm, r=5mm under torsion:\nKt_torsion \u2248 <strong>1.65</strong> (vs 2.05 for tension)' },
      { title: 'Shaft with Groove', formula: 'Kt \u2248 1 + 1.08\u221A(t/r)', desc: 'Circumferential grooves (for snap rings, O-rings, etc.) create stress concentration similar to notches. The net diameter at the groove bottom determines the nominal stress, while Kt depends on groove depth (t) and groove radius (r).', example: 'Groove depth t=5mm, radius r=2mm:\nt/r = 2.5\nKt = 1 + 1.08\u00D7\u221A2.5 = 1 + 1.708 = <strong>2.71</strong>' },
      { title: 'Shaft with Transverse Hole', formula: 'Kt \u2248 3.0 - 3.14(d/D) + 3.67(d/D)\u00B2 - 1.53(d/D)\u00B3', desc: 'Oil holes, cross-pin holes, and instrumentation holes through shafts create stress concentration similar to a plate with a hole. The stress is highest at the hole edge perpendicular to the applied load. For small d/D, Kt approaches 3.0.', example: 'Shaft D=60mm with d=10mm transverse hole:\nd/D = 0.167\nKt = 3.0 - 0.524 + 0.102 - 0.007 = <strong>2.57</strong>' }
    ],
    design: [
      { title: 'Notch Sensitivity Factor (q)', formula: 'Kf = 1 + q(Kt - 1)\nq = 1/(1 + a/r)', desc: 'Real materials do not always develop the full theoretical Kt under fatigue loading. The notch sensitivity factor q (0 to 1) accounts for material and size effects. High-strength steels have q near 1.0 (fully sensitive), while cast iron may have q = 0.2. Neuber\'s constant "a" depends on UTS.', example: 'Steel with UTS = 700 MPa, a = 0.05 mm, notch r = 2 mm:\nq = 1/(1 + 0.05/2) = 0.976\nIf Kt = 2.5: Kf = 1 + 0.976(2.5-1) = <strong>2.46</strong>' },
      { title: 'Reducing Stress Concentration', formula: 'Design guidelines for lower Kt', desc: 'Methods to reduce Kt include: (1) Increase fillet radius, (2) Use relief grooves near shoulders, (3) Add flow-smoothing holes near discontinuities, (4) Use elliptical holes instead of circular, (5) Gradual transitions instead of abrupt steps, (6) Surface treatments (shot peening, rolling) to introduce compressive residual stresses.', example: 'A shaft shoulder with r=1mm has Kt=3.2. Increasing to r=5mm: Kt=1.8.\nAdding a relief groove: effective Kt=1.5.\nCost of larger fillet: almost zero. <strong>Always specify generous fillets.</strong>' },
      { title: 'Common Kt Values Reference', formula: 'Quick reference for design checks', desc: 'Typical Kt values: Small hole in wide plate = 3.0, Semicircular notch = 3.07, Sharp shoulder (r/h=0.05) = 3.5\u20134.0, Generous fillet (r/h=0.5) = 1.5\u20131.8, Keyway = 2.0\u20133.5, Threads = 2.5\u20134.0, Weld toe = 1.5\u20133.5. These are approximate values; always check Peterson\'s charts for your specific geometry.', example: 'Design rule of thumb: For fatigue-critical parts, aim for Kt < 2.0.\nFor static loading of ductile materials, Kt < 3.0 is often acceptable.\nFor brittle materials, always use Kt directly (no notch sensitivity reduction).' }
    ]
  };

  var currentExploreCat = 'fundamentals';

  document.getElementById('explore-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    currentExploreCat = e.target.dataset.value;
    document.querySelectorAll('#explore-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    renderExplore();
  });

  function renderExplore() {
    var container = document.getElementById('explore-content');
    var cards = EXPLORE_DATA[currentExploreCat] || [];
    var html = '';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<div class="concept-card">';
      html += '<h3>' + c.title + '</h3>';
      html += '<div class="formula">' + c.formula + '</div>';
      html += '<p>' + c.desc + '</p>';
      if (c.example) {
        html += '<div class="example">' + c.example.replace(/\n/g, '<br>') + '</div>';
      }
      html += '</div>';
    }
    container.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════════
     10. PRACTICE MODE
     ══════════════════════════════════════════════════════════════ */
  var practiceCorrect = 0, practiceTotal = 0;
  var practiceAnswer = 0;
  var practiceSolution = '';

  var PRACTICE_GENERATORS = [
    /* 0: Find Kt for plate with hole */
    function () {
      var D2 = 50 + Math.round(Math.random() * 150);
      var d2 = Math.round(D2 * (0.1 + Math.random() * 0.5));
      var kt2 = calcKt(0, D2, d2, 0);
      return {
        prompt: 'A plate of width D = ' + D2 + ' mm has a central hole of diameter d = ' + d2 + ' mm under tension. Find Kt.',
        answer: kt2,
        unit: '',
        solution: 'd/D = ' + d2 + '/' + D2 + ' = ' + (d2 / D2).toFixed(4) + '\nKt = 3.0 - 3.13(' + (d2 / D2).toFixed(3) + ') + 3.66(' + (d2 / D2).toFixed(3) + ')\u00B2 - 1.53(' + (d2 / D2).toFixed(3) + ')\u00B3\nKt = ' + kt2.toFixed(3),
        tol: 0.05
      };
    },
    /* 1: Find sigma_max for plate with hole */
    function () {
      var D2 = 60 + Math.round(Math.random() * 100);
      var d2 = Math.round(D2 * (0.1 + Math.random() * 0.4));
      var sig = 50 + Math.round(Math.random() * 200);
      var kt2 = calcKt(0, D2, d2, 0);
      var smax = kt2 * sig;
      return {
        prompt: 'A plate (D = ' + D2 + ' mm, hole d = ' + d2 + ' mm) has \u03C3_nom = ' + sig + ' MPa. Find \u03C3_max.',
        answer: smax,
        unit: 'MPa',
        solution: 'Kt = ' + kt2.toFixed(3) + '\n\u03C3_max = Kt \u00D7 \u03C3_nom = ' + kt2.toFixed(3) + ' \u00D7 ' + sig + ' = ' + smax.toFixed(1) + ' MPa',
        tol: 2
      };
    },
    /* 2: Find Kt for shaft fillet tension */
    function () {
      var D2 = 40 + Math.round(Math.random() * 80);
      var d2 = Math.round(D2 * (0.5 + Math.random() * 0.3));
      var r2 = 1 + Math.round(Math.random() * 10);
      var kt2 = calcKt(4, D2, d2, r2);
      return {
        prompt: 'A stepped shaft with D = ' + D2 + ' mm, d = ' + d2 + ' mm, fillet r = ' + r2 + ' mm is under tension. Find Kt.',
        answer: kt2,
        unit: '',
        solution: 'D/d = ' + (D2 / d2).toFixed(3) + ', r/d = ' + (r2 / d2).toFixed(4) + '\nKt = ' + kt2.toFixed(3),
        tol: 0.1
      };
    },
    /* 3: Find Kt for shaft fillet torsion */
    function () {
      var D2 = 40 + Math.round(Math.random() * 80);
      var d2 = Math.round(D2 * (0.5 + Math.random() * 0.3));
      var r2 = 1 + Math.round(Math.random() * 8);
      var kt2 = calcKt(5, D2, d2, r2);
      return {
        prompt: 'A stepped shaft (D = ' + D2 + ' mm, d = ' + d2 + ' mm, r = ' + r2 + ' mm) under torsion. Find Kt.',
        answer: kt2,
        unit: '',
        solution: 'D/d = ' + (D2 / d2).toFixed(3) + ', r/d = ' + (r2 / d2).toFixed(4) + '\nKt (torsion) = ' + kt2.toFixed(3),
        tol: 0.1
      };
    },
    /* 4: Find sigma_max given Kt and sigma_nom */
    function () {
      var kt2 = 1.5 + Math.round(Math.random() * 20) / 10;
      var sig = 30 + Math.round(Math.random() * 200);
      var smax = kt2 * sig;
      return {
        prompt: 'Given Kt = ' + kt2.toFixed(1) + ' and \u03C3_nom = ' + sig + ' MPa, find \u03C3_max.',
        answer: smax,
        unit: 'MPa',
        solution: '\u03C3_max = Kt \u00D7 \u03C3_nom = ' + kt2.toFixed(1) + ' \u00D7 ' + sig + ' = ' + smax.toFixed(1) + ' MPa',
        tol: 1
      };
    },
    /* 5: Find nominal stress from load and area */
    function () {
      var D2 = 60 + Math.round(Math.random() * 80);
      var d2 = Math.round(D2 * (0.15 + Math.random() * 0.3));
      var t2 = 5 + Math.round(Math.random() * 15);
      var P = 10 + Math.round(Math.random() * 100);
      var A = (D2 - d2) * t2;
      var sigN = (P * 1000) / A;
      return {
        prompt: 'A plate (width D = ' + D2 + ' mm, hole d = ' + d2 + ' mm, thickness t = ' + t2 + ' mm) under P = ' + P + ' kN. Find \u03C3_nom (net section) in MPa.',
        answer: sigN,
        unit: 'MPa',
        solution: 'Net area A = (D - d) \u00D7 t = (' + D2 + ' - ' + d2 + ') \u00D7 ' + t2 + ' = ' + A + ' mm\u00B2\n\u03C3_nom = P/A = ' + (P * 1000) + ' / ' + A + ' = ' + sigN.toFixed(2) + ' MPa',
        tol: 2
      };
    },
    /* 6: Find Kf from Kt and q */
    function () {
      var kt2 = 2 + Math.round(Math.random() * 20) / 10;
      var q = 0.5 + Math.round(Math.random() * 5) / 10;
      var kf = 1 + q * (kt2 - 1);
      return {
        prompt: 'Given Kt = ' + kt2.toFixed(1) + ' and notch sensitivity q = ' + q.toFixed(1) + ', find the fatigue stress concentration factor Kf.',
        answer: kf,
        unit: '',
        solution: 'Kf = 1 + q(Kt - 1) = 1 + ' + q.toFixed(1) + '(' + kt2.toFixed(1) + ' - 1) = 1 + ' + (q * (kt2 - 1)).toFixed(3) + ' = ' + kf.toFixed(3),
        tol: 0.05
      };
    },
    /* 7: Find required fillet radius for target Kt */
    function () {
      var D2 = 60 + Math.round(Math.random() * 60);
      var d2 = Math.round(D2 * (0.6 + Math.random() * 0.2));
      var targetKt = 1.5 + Math.round(Math.random() * 10) / 10;
      /* Binary search for r */
      var rLo = 0.5, rHi = 30, rMid;
      for (var iter = 0; iter < 50; iter++) {
        rMid = (rLo + rHi) / 2;
        var ktMid = calcKt(4, D2, d2, rMid);
        if (ktMid > targetKt) rLo = rMid; else rHi = rMid;
      }
      var rAns = (rLo + rHi) / 2;
      var actualKt = calcKt(4, D2, d2, rAns);
      return {
        prompt: 'A shaft with D = ' + D2 + ' mm, d = ' + d2 + ' mm needs Kt \u2264 ' + targetKt.toFixed(1) + ' under tension. Find the minimum fillet radius r (mm).',
        answer: rAns,
        unit: 'mm',
        solution: 'By iteration or Peterson\'s chart: r \u2248 ' + rAns.toFixed(1) + ' mm gives Kt = ' + actualKt.toFixed(3),
        tol: 1
      };
    },
    /* 8: Find Kt for groove */
    function () {
      var D2 = 30 + Math.round(Math.random() * 60);
      var t2 = 2 + Math.round(Math.random() * 10);
      var r2 = 1 + Math.round(Math.random() * 6);
      var kt2 = calcKt(6, D2, t2, r2);
      return {
        prompt: 'A shaft (D = ' + D2 + ' mm) has a circumferential groove of depth t = ' + t2 + ' mm and radius r = ' + r2 + ' mm. Find Kt.',
        answer: kt2,
        unit: '',
        solution: 't/r = ' + (t2 / r2).toFixed(3) + '\nKt = 1 + 1.08\u221A(' + (t2 / r2).toFixed(3) + ') = ' + kt2.toFixed(3),
        tol: 0.1
      };
    },
    /* 9: Find sigma_max for shaft with groove */
    function () {
      var D2 = 40 + Math.round(Math.random() * 60);
      var t2 = 2 + Math.round(Math.random() * 8);
      var r2 = 1 + Math.round(Math.random() * 5);
      var sig = 50 + Math.round(Math.random() * 150);
      var kt2 = calcKt(6, D2, t2, r2);
      var smax = kt2 * sig;
      return {
        prompt: 'A grooved shaft (D = ' + D2 + ' mm, groove depth = ' + t2 + ' mm, groove r = ' + r2 + ' mm), \u03C3_nom = ' + sig + ' MPa. Find \u03C3_max.',
        answer: smax,
        unit: 'MPa',
        solution: 'Kt = ' + kt2.toFixed(3) + '\n\u03C3_max = ' + kt2.toFixed(3) + ' \u00D7 ' + sig + ' = ' + smax.toFixed(1) + ' MPa',
        tol: 5
      };
    },
    /* 10: Find max load before yield */
    function () {
      var D2 = 80 + Math.round(Math.random() * 80);
      var d2 = Math.round(D2 * (0.15 + Math.random() * 0.3));
      var t2 = 5 + Math.round(Math.random() * 10);
      var Sy = 200 + Math.round(Math.random() * 300);
      var kt2 = calcKt(0, D2, d2, 0);
      var A = (D2 - d2) * t2;
      var sigNomMax = Sy / kt2;
      var Pmax = sigNomMax * A / 1000;
      return {
        prompt: 'Plate (D = ' + D2 + ' mm, hole d = ' + d2 + ' mm, thickness = ' + t2 + ' mm) made of steel with Sy = ' + Sy + ' MPa. Find max load P (kN) before yielding at the hole.',
        answer: Pmax,
        unit: 'kN',
        solution: 'Kt = ' + kt2.toFixed(3) + '\nNet area = (' + D2 + '-' + d2 + ')\u00D7' + t2 + ' = ' + A + ' mm\u00B2\n\u03C3_nom_max = Sy/Kt = ' + Sy + '/' + kt2.toFixed(3) + ' = ' + sigNomMax.toFixed(1) + ' MPa\nP = \u03C3_nom \u00D7 A = ' + sigNomMax.toFixed(1) + ' \u00D7 ' + A + ' = ' + (sigNomMax * A).toFixed(0) + ' N = ' + Pmax.toFixed(2) + ' kN',
        tol: 2
      };
    },
    /* 11: Transverse hole Kt */
    function () {
      var D2 = 30 + Math.round(Math.random() * 70);
      var d2 = Math.round(D2 * (0.05 + Math.random() * 0.3));
      var kt2 = calcKt(7, D2, d2, 0);
      return {
        prompt: 'A shaft (D = ' + D2 + ' mm) has a transverse hole of diameter d = ' + d2 + ' mm. Find Kt.',
        answer: kt2,
        unit: '',
        solution: 'd/D = ' + (d2 / D2).toFixed(4) + '\nKt = 3.0 - 3.14(' + (d2 / D2).toFixed(3) + ') + 3.67(' + (d2 / D2).toFixed(3) + ')\u00B2 - 1.527(' + (d2 / D2).toFixed(3) + ')\u00B3 = ' + kt2.toFixed(3),
        tol: 0.05
      };
    }
  ];

  function newPracticeQuestion() {
    var idx = Math.floor(Math.random() * PRACTICE_GENERATORS.length);
    var q = PRACTICE_GENERATORS[idx]();
    practiceAnswer = q.answer;
    practiceSolution = q.solution;
    document.getElementById('practice-prompt').textContent = q.prompt;
    document.getElementById('practice-unit').textContent = q.unit;
    document.getElementById('practice-input').value = '';
    document.getElementById('practice-feedback').textContent = '';
    document.getElementById('practice-feedback').className = 'practice-feedback';
    document.getElementById('practice-solution').style.display = 'none';
    document.getElementById('practice-input').dataset.tol = q.tol;
    document.getElementById('practice-input').focus();
  }

  document.getElementById('practice-check').addEventListener('click', function () {
    var inp = parseFloat(document.getElementById('practice-input').value);
    if (isNaN(inp)) return;
    var tol = parseFloat(document.getElementById('practice-input').dataset.tol) || 0.1;
    practiceTotal++;
    var fb = document.getElementById('practice-feedback');
    if (Math.abs(inp - practiceAnswer) <= tol) {
      practiceCorrect++;
      fb.textContent = '\u2705 Correct! Answer: ' + practiceAnswer.toFixed(3);
      fb.className = 'practice-feedback feedback-ok';
    } else {
      fb.textContent = '\u274C Incorrect. Correct answer: ' + practiceAnswer.toFixed(3);
      fb.className = 'practice-feedback feedback-err';
    }
    document.getElementById('practice-score').textContent = practiceCorrect + ' / ' + practiceTotal;
  });

  document.getElementById('practice-next').addEventListener('click', newPracticeQuestion);

  document.getElementById('practice-show').addEventListener('click', function () {
    var sol = document.getElementById('practice-solution');
    sol.style.display = sol.style.display === 'none' ? '' : 'none';
    sol.innerHTML = '<strong>Solution:</strong><br>' + practiceSolution.replace(/\n/g, '<br>');
  });

  /* ══════════════════════════════════════════════════════════════
     11. QUIZ MODE
     ══════════════════════════════════════════════════════════════ */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizAnswers = [];
  var quizLocked = false;

  var QUIZ_POOL = [];

  function buildQuizPool() {
    QUIZ_POOL = [
      /* MCQ questions */
      { type: 'mcq', q: 'What is the stress concentration factor Kt for an infinitesimally small hole in an infinite plate under tension?', opts: ['1.0', '2.0', '3.0', '4.0'], correct: 2 },
      { type: 'mcq', q: 'Which method is most effective for reducing stress concentration at a shaft shoulder?', opts: ['Increase shaft length', 'Increase fillet radius', 'Decrease shaft diameter', 'Use a harder material'], correct: 1 },
      { type: 'mcq', q: 'What does the notch sensitivity factor q represent?', opts: ['The ratio of Kt to Kf', 'How much of Kt a material actually experiences in fatigue', 'The inverse of Kt', 'The yield stress divided by UTS'], correct: 1 },
      { type: 'mcq', q: 'For a shaft under torsion, how does Kt compare to the same shaft under tension?', opts: ['Kt(torsion) > Kt(tension)', 'Kt(torsion) = Kt(tension)', 'Kt(torsion) < Kt(tension)', 'They are unrelated'], correct: 2 },
      { type: 'mcq', q: 'Which has the highest stress concentration factor?', opts: ['Large fillet (r/d = 0.3)', 'Small fillet (r/d = 0.02)', 'Semicircular groove', 'No discontinuity'], correct: 1 },
      { type: 'mcq', q: 'What is the relationship between sigma_max, Kt, and sigma_nom?', opts: ['\u03C3_max = Kt + \u03C3_nom', '\u03C3_max = Kt \u00D7 \u03C3_nom', '\u03C3_max = Kt / \u03C3_nom', '\u03C3_max = \u03C3_nom / Kt'], correct: 1 },
      { type: 'mcq', q: 'Who first compiled comprehensive stress concentration charts?', opts: ['Von Mises', 'Peterson', 'Mohr', 'Hooke'], correct: 1 },
      { type: 'mcq', q: 'For a ductile material under static loading, stress concentration is:', opts: ['Always critical', 'Not significant because local yielding redistributes stress', 'More important than under fatigue', 'Only relevant for torsion'], correct: 1 },

      /* Numeric questions */
      { type: 'num', q: 'A plate (D=100mm) with a center hole (d=30mm) under tension. Find Kt. (2 decimal places)', answer: calcKt(0, 100, 30, 0), tol: 0.05, unit: '' },
      { type: 'num', q: 'Given Kt = 2.5 and sigma_nom = 120 MPa, what is sigma_max?', answer: 300, tol: 1, unit: 'MPa' },
      { type: 'num', q: 'Kt = 3.0 and q = 0.8. Calculate Kf.', answer: 1 + 0.8 * (3.0 - 1), tol: 0.05, unit: '' },
      { type: 'num', q: 'A shaft (D=80mm) with transverse hole (d=16mm). Find Kt.', answer: calcKt(7, 80, 16, 0), tol: 0.05, unit: '' },
      { type: 'num', q: 'Shaft groove: t=8mm, r=4mm. Find Kt using Kt = 1 + 1.08*sqrt(t/r).', answer: 1 + 1.08 * Math.sqrt(2), tol: 0.05, unit: '' },
      { type: 'num', q: 'Plate with hole: d/D = 0.5. Calculate Kt using the standard polynomial.', answer: calcKt(0, 1, 0.5, 0), tol: 0.05, unit: '' },
      { type: 'num', q: 'If sigma_max = 450 MPa and Kt = 2.25, what is sigma_nom?', answer: 200, tol: 1, unit: 'MPa' }
    ];
  }

  function startQuiz() {
    buildQuizPool();
    /* Shuffle and pick 5 */
    var shuffled = QUIZ_POOL.slice();
    for (var si = shuffled.length - 1; si > 0; si--) {
      var sj = Math.floor(Math.random() * (si + 1));
      var tmp = shuffled[si]; shuffled[si] = shuffled[sj]; shuffled[sj] = tmp;
    }
    quizSet = shuffled.slice(0, QUIZ_SIZE);
    quizIdx = 0; quizScore = 0; quizAnswers = [];
    quizLocked = false;
    document.getElementById('quiz-result').style.display = 'none';
    document.getElementById('quiz-bar').style.display = '';
    showQuizQuestion();
  }

  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    document.getElementById('quiz-counter').textContent = 'Q ' + (quizIdx + 1) + ' / ' + QUIZ_SIZE;
    document.getElementById('quiz-prompt').textContent = q.q;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-feedback').className = 'practice-feedback';
    document.getElementById('quiz-submit').disabled = false;
    document.getElementById('quiz-next').disabled = true;
    quizLocked = false;

    var optsContainer = document.getElementById('quiz-options');
    var numGroup = document.getElementById('quiz-input-group');

    if (q.type === 'mcq') {
      numGroup.style.display = 'none';
      optsContainer.style.display = '';
      var html = '';
      for (var oi = 0; oi < q.opts.length; oi++) {
        html += '<div class="quiz-opt" data-idx="' + oi + '">' + q.opts[oi] + '</div>';
      }
      optsContainer.innerHTML = html;
      optsContainer.querySelectorAll('.quiz-opt').forEach(function (el) {
        el.addEventListener('click', function () {
          if (quizLocked) return;
          optsContainer.querySelectorAll('.quiz-opt').forEach(function (o) { o.classList.remove('selected'); });
          el.classList.add('selected');
        });
      });
    } else {
      optsContainer.style.display = 'none';
      numGroup.style.display = '';
      document.getElementById('quiz-input').value = '';
      document.getElementById('quiz-unit').textContent = q.unit || '';
    }
  }

  document.getElementById('quiz-submit').addEventListener('click', function () {
    if (quizLocked) return;
    var q = quizSet[quizIdx];
    var fb = document.getElementById('quiz-feedback');
    var userAnswer, isCorrect;

    if (q.type === 'mcq') {
      var sel = document.querySelector('.quiz-opt.selected');
      if (!sel) return;
      userAnswer = parseInt(sel.dataset.idx, 10);
      isCorrect = userAnswer === q.correct;

      /* Highlight correct/wrong */
      document.querySelectorAll('.quiz-opt').forEach(function (o, idx2) {
        if (idx2 === q.correct) o.classList.add('correct');
        else if (idx2 === userAnswer && !isCorrect) o.classList.add('wrong');
      });
      quizAnswers.push({ q: q.q, given: q.opts[userAnswer], correct: q.opts[q.correct], ok: isCorrect });
    } else {
      var val = parseFloat(document.getElementById('quiz-input').value);
      if (isNaN(val)) return;
      userAnswer = val;
      isCorrect = Math.abs(val - q.answer) <= (q.tol || 0.1);
      quizAnswers.push({ q: q.q, given: val.toFixed(3), correct: q.answer.toFixed(3), ok: isCorrect });
    }

    if (isCorrect) {
      quizScore++;
      fb.textContent = '\u2705 Correct!';
      fb.className = 'practice-feedback feedback-ok';
    } else {
      fb.textContent = '\u274C Incorrect. Answer: ' + (q.type === 'mcq' ? q.opts[q.correct] : q.answer.toFixed(3));
      fb.className = 'practice-feedback feedback-err';
    }

    quizLocked = true;
    document.getElementById('quiz-submit').disabled = true;
    document.getElementById('quiz-next').disabled = false;
  });

  document.getElementById('quiz-next').addEventListener('click', function () {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) {
      showQuizResult();
    } else {
      showQuizQuestion();
    }
  });

  function showQuizResult() {
    document.getElementById('quiz-bar').style.display = 'none';
    var result = document.getElementById('quiz-result');
    result.style.display = '';

    var scoreClass = quizScore >= 5 ? 'perfect' : quizScore >= 3 ? 'good' : 'poor';
    var stars = quizScore >= 5 ? '\u2605\u2605\u2605' : quizScore >= 3 ? '\u2605\u2605' : '\u2605';

    var html = '<div class="qr-header">';
    html += '<div class="qr-score ' + scoreClass + '">' + quizScore + ' / ' + QUIZ_SIZE + '</div>';
    html += '<div class="qr-stars">' + stars + '</div>';
    html += '</div>';
    html += '<div class="qr-rows">';
    for (var ri = 0; ri < quizAnswers.length; ri++) {
      var a = quizAnswers[ri];
      html += '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '">';
      html += '<div class="qr-q">Q' + (ri + 1) + ': ' + a.q + '</div>';
      html += '<div class="qr-a">Your answer: ' + a.given + ' | Correct: ' + a.correct + ' ' + (a.ok ? '\u2713' : '\u2717') + '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn btn-primary" onclick="document.getElementById(\'quiz-result\').style.display=\'none\';document.getElementById(\'quiz-bar\').style.display=\'\';' +
      'document.querySelectorAll(\'#mode-tabs .pill\').forEach(function(p){p.classList.toggle(\'active\',p.dataset.value===\'quiz\');});' +
      '">New Quiz</button>';

    result.innerHTML = html;

    /* Attach new quiz handler (replace inline onclick for cleanliness) */
    var newQuizBtn = result.querySelector('.btn-primary');
    newQuizBtn.onclick = function () { startQuiz(); };
  }

  /* ══════════════════════════════════════════════════════════════
     12. PRESETS
     ══════════════════════════════════════════════════════════════ */
  var PRESETS = {
    0: [
      { name: 'Small hole / wide plate (Kt ≈ 3)', D: 200, d: 10, r: 0, sigNom: 100 },
      { name: 'd/D = 0.3 (Kt ≈ 2.5)', D: 100, d: 30, r: 0, sigNom: 100 },
      { name: 'd/D = 0.5 (Kt ≈ 2.2)', D: 100, d: 50, r: 0, sigNom: 100 }
    ],
    1: [
      { name: 'Semicircular notch (t=r)', D: 100, d: 5, r: 5, sigNom: 100 },
      { name: 'Sharp notch (t/r=4)', D: 100, d: 20, r: 5, sigNom: 100 },
      { name: 'Shallow notch (t/r=0.5)', D: 100, d: 2, r: 4, sigNom: 100 }
    ],
    2: [
      { name: 'Generous fillet (r/h=0.5)', D: 100, d: 60, r: 10, sigNom: 100 },
      { name: 'Sharp shoulder (r/h=0.05)', D: 100, d: 60, r: 1, sigNom: 100 },
      { name: 'Typical (r/h=0.2)', D: 100, d: 60, r: 4, sigNom: 100 }
    ],
    3: [
      { name: 'Generous fillet bending', D: 100, d: 60, r: 10, sigNom: 100 },
      { name: 'Sharp shoulder bending', D: 100, d: 60, r: 1, sigNom: 100 }
    ],
    4: [
      { name: 'Bearing seat (r/d=0.1)', D: 80, d: 50, r: 5, sigNom: 100 },
      { name: 'Sharp shoulder (r/d=0.02)', D: 80, d: 50, r: 1, sigNom: 100 },
      { name: 'Smooth transition (r/d=0.3)', D: 80, d: 50, r: 15, sigNom: 100 }
    ],
    5: [
      { name: 'Bearing seat torsion', D: 80, d: 50, r: 5, sigNom: 100 },
      { name: 'Sharp shoulder torsion', D: 80, d: 50, r: 1, sigNom: 100 }
    ],
    6: [
      { name: 'Snap-ring groove', D: 80, d: 3, r: 1, sigNom: 100 },
      { name: 'Deep groove (t/r=2.5)', D: 80, d: 5, r: 2, sigNom: 100 },
      { name: 'Shallow groove (t/r=0.5)', D: 80, d: 2, r: 4, sigNom: 100 }
    ],
    7: [
      { name: 'Small oil hole (d/D=0.1)', D: 80, d: 8, r: 4, sigNom: 100 },
      { name: 'Cross-pin hole (d/D=0.2)', D: 80, d: 16, r: 8, sigNom: 100 }
    ]
  };

  function populatePresets() {
    var sel = document.getElementById('preset-select');
    var list = PRESETS[geoType] || [];
    var html = '<option value="">— Choose —</option>';
    for (var i = 0; i < list.length; i++) {
      html += '<option value="' + i + '">' + list[i].name + '</option>';
    }
    sel.innerHTML = html;
  }
  function applyPreset(idx) {
    var p = PRESETS[geoType][idx];
    if (!p) return;
    params.D = p.D; params.d = p.d; params.r = p.r; params.sigNom = p.sigNom;
    refreshAllInputs();
    updateReadouts();
    pushHistory();
    draw(); drawChart();
    renderEquations(); renderCoach(); drawHistory();
  }

  /* ══════════════════════════════════════════════════════════════
     13. LEARNING PANELS
     ══════════════════════════════════════════════════════════════ */
  var EQ_FORMULAS = {
    0: function () {
      var rt = params.d / params.D;
      var kt = calcKt(0, params.D, params.d, params.r);
      return [
        '\\[K_t = 3.0 - 3.13\\,\\rho + 3.66\\,\\rho^2 - 1.53\\,\\rho^3,\\ \\ \\rho = d/D\\]',
        '\\[\\rho = ' + rt.toFixed(4) + ',\\ \\ K_t = ' + kt.toFixed(3) + '\\]',
        '\\[\\sigma_{max} = K_t \\cdot \\sigma_{nom} = ' + kt.toFixed(3) + ' \\times ' + fmtStress(params.sigNom,1) + ' = ' + fmtStress(kt*params.sigNom,1) + '\\]'
      ];
    },
    1: function () {
      var tr = params.d / params.r;
      var kt = calcKt(1, params.D, params.d, params.r);
      var form = tr <= 2
        ? '\\[K_t \\approx 1 + 0.993\\sqrt{t/r} + 0.18\\,(t/r)\\]'
        : '\\[K_t \\approx 0.78 + 1.12\\sqrt{t/r}\\]';
      return [form,
        '\\[t/r = ' + tr.toFixed(3) + ',\\ \\ K_t = ' + kt.toFixed(3) + '\\]',
        '\\[\\sigma_{max} = ' + kt.toFixed(3) + ' \\times ' + fmtStress(params.sigNom,1) + ' = ' + fmtStress(kt*params.sigNom,1) + '\\]'];
    },
    2: function () { return filletEq(2, 'Tension'); },
    3: function () { return filletEq(3, 'Bending'); },
    4: function () {
      var Dd = params.D/params.d, rd = params.r/params.d;
      var kt = calcKt(4, params.D, params.d, params.r);
      return ['\\[K_t \\approx 0.89 + 1.48\\,(r/d)^{-0.38} - 0.41(D/d - 1)\\]',
        '\\[D/d = ' + Dd.toFixed(3) + ',\\ r/d = ' + rd.toFixed(4) + '\\]',
        '\\[K_t = ' + kt.toFixed(3) + ',\\ \\ \\sigma_{max} = ' + fmtStress(kt*params.sigNom,1) + '\\]'];
    },
    5: function () {
      var Dd = params.D/params.d, rd = params.r/params.d;
      var kt = calcKt(5, params.D, params.d, params.r);
      return ['\\[K_t \\approx 0.83 + 0.95\\,(r/d)^{-0.35} - 0.30(D/d - 1)\\]',
        '\\[D/d = ' + Dd.toFixed(3) + ',\\ r/d = ' + rd.toFixed(4) + '\\]',
        '\\[K_t = ' + kt.toFixed(3) + '\\ \\ (\\text{torsion})\\]'];
    },
    6: function () {
      var tr = params.d/params.r;
      var kt = calcKt(6, params.D, params.d, params.r);
      return ['\\[K_t \\approx 1 + 1.08\\sqrt{t/r}\\]',
        '\\[t/r = ' + tr.toFixed(3) + ',\\ \\ K_t = ' + kt.toFixed(3) + '\\]',
        '\\[\\sigma_{max} = ' + fmtStress(kt*params.sigNom,1) + '\\]'];
    },
    7: function () {
      var rt = params.d/params.D;
      var kt = calcKt(7, params.D, params.d, params.r);
      return ['\\[K_t \\approx 3.0 - 3.14\\,\\rho + 3.67\\,\\rho^2 - 1.527\\,\\rho^3,\\ \\ \\rho = d/D\\]',
        '\\[\\rho = ' + rt.toFixed(4) + ',\\ \\ K_t = ' + kt.toFixed(3) + '\\]',
        '\\[\\sigma_{max} = ' + fmtStress(kt*params.sigNom,1) + '\\]'];
    }
  };
  function filletEq(geo, loading) {
    var Dd = params.D/params.d, h = Math.max((params.D-params.d)/2, 0.1), rh = params.r/h;
    var kt = calcKt(geo, params.D, params.d, params.r);
    return ['\\[K_t = C_1 + C_2(r/h) + C_3(r/h)^2 + C_4(r/h)^3\\ \\ (\\text{'+loading+'})\\]',
      '\\[D/d = ' + Dd.toFixed(3) + ',\\ r/h = ' + rh.toFixed(3) + '\\]',
      '\\[K_t = ' + kt.toFixed(3) + ',\\ \\ \\sigma_{max} = ' + fmtStress(kt*params.sigNom,1) + '\\]'];
  }

  function renderEquations() {
    var body = document.getElementById('lp-equations-body');
    if (!body) return;
    var lines = (EQ_FORMULAS[geoType] || function(){return [];})();
    body.innerHTML = lines.map(function(l){ return '<div class="lp-eq-line">' + l + '</div>'; }).join('');
    if (window.renderMathInElement) {
      try { window.renderMathInElement(body, { delimiters: [{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}] }); } catch (e) {}
    }
  }

  function renderCoach() {
    var body = document.getElementById('lp-coach-body');
    if (!body) return;
    var kt = calcKt(geoType, params.D, params.d, params.r);
    var items = [];
    if (kt >= 2.5) items.push({tag:'PRIORITY', text:'Kt = ' + kt.toFixed(2) + ' is high. The single biggest lever is increasing the radius at the discontinuity.'});
    else if (kt >= 1.8) items.push({tag:'MODERATE', text:'Kt = ' + kt.toFixed(2) + ' is typical. Acceptable for ductile static loads, but reduce for fatigue.'});
    else items.push({tag:'GOOD', text:'Kt = ' + kt.toFixed(2) + ' is low. Geometry is well-proportioned.'});

    if (geoType >= 2 && geoType <= 5) {
      var rNow = params.r;
      var rTry = Math.min(rNow * 2, (geoType <= 3 ? 30 : 20));
      var ktTry = calcKt(geoType, params.D, params.d, rTry);
      items.push({tag:'TRY', text:'Doubling r from ' + fmtLen(rNow,1) + ' to ' + fmtLen(rTry,1) + ' would change Kt from ' + kt.toFixed(2) + ' → ' + ktTry.toFixed(2) + '.'});
    } else if (geoType === 1 || geoType === 6) {
      var rTry2 = params.r * 2;
      var ktTry2 = calcKt(geoType, params.D, params.d, rTry2);
      items.push({tag:'TRY', text:'Doubling the radius from ' + fmtLen(params.r,1) + ' to ' + fmtLen(rTry2,1) + ' would change Kt from ' + kt.toFixed(2) + ' → ' + ktTry2.toFixed(2) + '.'});
    } else if (geoType === 0 || geoType === 7) {
      items.push({tag:'NOTE', text:'For a hole, Kt is geometry-driven (≈3 for small d/D). Add a smoothing fillet or use an elliptical hole to reduce peak stress.'});
    }
    items.push({tag:'FATIGUE', text:'For cyclic loading, convert to Kf = 1 + q(Kt−1). Ductile high-strength steel: q ≈ 0.9; cast iron: q ≈ 0.2.'});

    body.innerHTML = items.map(function(it){ return '<div class="coach-item"><span class="coach-tag">' + it.tag + '</span>' + it.text + '</div>'; }).join('');
  }

  function pushHistory() {
    var kt = calcKt(geoType, params.D, params.d, params.r);
    ktHistory.push(kt);
    if (ktHistory.length > HIST_MAX) ktHistory.shift();
  }
  function drawHistory() {
    var c = document.getElementById('history-canvas');
    if (!c) return;
    var hctx = c.getContext('2d');
    var W = c.width, H = c.height;
    hctx.clearRect(0,0,W,H);
    hctx.fillStyle = '#0d1117'; hctx.fillRect(0,0,W,H);
    if (ktHistory.length < 2) {
      hctx.fillStyle = '#6b7a99'; hctx.font='12px Segoe UI, system-ui, sans-serif'; hctx.textAlign='center';
      hctx.fillText('Adjust sliders to populate Kt history', W/2, H/2);
      return;
    }
    var min = Math.min.apply(null, ktHistory), max = Math.max.apply(null, ktHistory);
    if (max - min < 0.1) { max = min + 0.1; }
    var pad = 20;
    hctx.strokeStyle = '#e040fb'; hctx.lineWidth = 2; hctx.beginPath();
    for (var i = 0; i < ktHistory.length; i++) {
      var x = pad + (W - 2*pad) * i / (ktHistory.length - 1);
      var y = pad + (H - 2*pad) * (1 - (ktHistory[i] - min)/(max - min));
      if (i === 0) hctx.moveTo(x,y); else hctx.lineTo(x,y);
    }
    hctx.stroke();
    /* Current marker */
    var last = ktHistory[ktHistory.length-1];
    var lx = W - pad, ly = pad + (H - 2*pad) * (1 - (last - min)/(max - min));
    hctx.fillStyle = '#e040fb'; hctx.beginPath(); hctx.arc(lx, ly, 4, 0, Math.PI*2); hctx.fill();
    /* Axes labels */
    hctx.fillStyle = '#6b7a99'; hctx.font='10px Segoe UI, system-ui, sans-serif';
    hctx.textAlign='left'; hctx.fillText('Kt max = ' + max.toFixed(2), 6, 12);
    hctx.fillText('Kt min = ' + min.toFixed(2), 6, H - 6);
  }

  /* ══════════════════════════════════════════════════════════════
     14. SHOW CALCULATION MODAL
     ══════════════════════════════════════════════════════════════ */
  function openCalcModal() {
    var kt = calcKt(geoType, params.D, params.d, params.r);
    var sigMax = kt * params.sigNom;
    var ratio = getRatioLabel(geoType, params.D, params.d, params.r);
    var html = '';
    html += '<div class="calc-step"><b>1. Geometry</b>' + GEO_NAMES[geoType] + '</div>';
    html += '<div class="calc-step"><b>2. Inputs</b>' +
      'D = ' + fmtLen(params.D) + ', d = ' + fmtLen(params.d);
    if (PARAM_CONFIG[geoType].rrange) html += ', r = ' + fmtLen(params.r);
    html += ', σ_nom = ' + fmtStress(params.sigNom) + '</div>';
    html += '<div class="calc-step"><b>3. Controlling ratio</b>' + ratio + '</div>';
    html += '<div class="calc-step"><b>4. Peterson Kt</b><span class="calc-eq">Kt = ' + kt.toFixed(3) + '</span></div>';
    html += '<div class="calc-step"><b>5. Maximum stress</b><span class="calc-eq">σ_max = Kt × σ_nom = ' + kt.toFixed(3) + ' × ' + fmtStress(params.sigNom,1) + ' = ' + fmtStress(sigMax,1) + '</span></div>';
    html += '<div class="calc-step"><b>6. Fatigue (typical q = 0.9)</b><span class="calc-eq">Kf = 1 + 0.9(Kt − 1) = ' + (1 + 0.9*(kt-1)).toFixed(3) + '</span></div>';
    document.getElementById('calc-modal-body').innerHTML = html;
    document.getElementById('calc-modal').style.display = '';
  }
  function closeCalcModal() { document.getElementById('calc-modal').style.display = 'none'; }

  /* ══════════════════════════════════════════════════════════════
     15. CONTEXT MENU
     ══════════════════════════════════════════════════════════════ */
  var ctxMenu = document.getElementById('ctx-menu');
  function showCtxMenu(x, y, items) {
    ctxMenu.innerHTML = items.map(function (it) {
      if (it.sep) return '<li class="sep"></li>';
      return '<li data-act="' + it.act + '">' + it.label + '</li>';
    }).join('');
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top  = y + 'px';
    ctxMenu.style.display = '';
    /* Clamp to viewport */
    var rect = ctxMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) ctxMenu.style.left = (window.innerWidth - rect.width - 4) + 'px';
    if (rect.bottom > window.innerHeight) ctxMenu.style.top = (window.innerHeight - rect.height - 4) + 'px';
  }
  function hideCtxMenu() { ctxMenu.style.display = 'none'; }
  document.addEventListener('click', hideCtxMenu);
  document.addEventListener('scroll', hideCtxMenu, true);

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY, [
      { label: '📷 Export canvas PNG', act: 'png-main' },
      { label: '📋 Copy Kt value', act: 'copy-kt' },
      { sep: true },
      { label: '↺ Reset geometry', act: 'reset' }
    ]);
  });
  chartCanvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY, [
      { label: '💾 Export Kt curve CSV', act: 'csv' },
      { label: '📷 Export chart PNG', act: 'png-chart' },
      { label: '📋 Copy Kt value', act: 'copy-kt' },
      { sep: true },
      { label: '↺ Reset geometry', act: 'reset' }
    ]);
  });
  ctxMenu.addEventListener('click', function (e) {
    if (e.target.tagName !== 'LI' || e.target.classList.contains('sep')) return;
    handleAct(e.target.dataset.act);
    hideCtxMenu();
  });

  function handleAct(act) {
    if (act === 'png-main')  exportPng(canvas, 'stress-concentration-canvas');
    if (act === 'png-chart') exportPng(chartCanvas, 'stress-concentration-chart');
    if (act === 'csv') exportCsv();
    if (act === 'copy-kt') {
      var kt = calcKt(geoType, params.D, params.d, params.r);
      if (navigator.clipboard) navigator.clipboard.writeText(kt.toFixed(4));
    }
    if (act === 'reset') {
      var def = PARAM_CONFIG[geoType].defaults;
      params.D = def.D; params.d = def.d; params.r = def.r; params.sigNom = def.sigNom;
      refreshAllInputs(); updateReadouts(); pushHistory();
      draw(); drawChart(); renderEquations(); renderCoach(); drawHistory();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     16. EXPORT (CSV + PNG)
     ══════════════════════════════════════════════════════════════ */
  function exportPng(srcCanvas, filename) {
    var watermark = document.createElement('canvas');
    watermark.width = srcCanvas.width;
    watermark.height = srcCanvas.height + 24;
    var wctx = watermark.getContext('2d');
    wctx.fillStyle = '#0d1117';
    wctx.fillRect(0, 0, watermark.width, watermark.height);
    wctx.drawImage(srcCanvas, 0, 0);
    wctx.fillStyle = '#6b7a99';
    wctx.font = '11px Segoe UI, system-ui, sans-serif';
    wctx.textAlign = 'right';
    wctx.fillText('NHIT VisualLab — Stress Concentration (Kt)', watermark.width - 8, srcCanvas.height + 16);
    var a = document.createElement('a');
    a.href = watermark.toDataURL('image/png');
    a.download = filename + '.png';
    a.click();
  }
  function exportCsv() {
    /* Sample 200 points along the active Kt curve */
    var n = 200, lines = ['ratio,Kt'];
    var rangeMap = { 0:[0.01,0.9], 1:[0.2,10], 2:[0.05,1], 3:[0.05,1], 4:[0.01,0.4], 5:[0.01,0.4], 6:[0.2,10], 7:[0.01,0.45] };
    var rng = rangeMap[geoType] || [0,1];
    for (var i = 0; i <= n; i++) {
      var r2 = rng[0] + (rng[1]-rng[0]) * i / n;
      var ktv;
      switch (geoType) {
        case 0: ktv = calcKt(0, 1, r2, 0); break;
        case 1: ktv = calcKt(1, params.D, r2 * params.r, params.r); break;
        case 2: case 3:
          var h = Math.max((params.D - params.d)/2, 0.1);
          ktv = calcKt(geoType, params.D, params.d, r2 * h); break;
        case 4: case 5: ktv = calcKt(geoType, params.D, params.d, r2 * params.d); break;
        case 6: ktv = calcKt(6, params.D, r2 * params.r, params.r); break;
        case 7: ktv = calcKt(7, 1, r2, 0); break;
        default: ktv = 3;
      }
      lines.push(r2.toFixed(4) + ',' + ktv.toFixed(4));
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kt-curve-' + GEO_NAMES[geoType].replace(/[^a-z0-9]+/gi,'-').toLowerCase() + '.csv';
    a.click();
  }

  /* ══════════════════════════════════════════════════════════════
     17. WIRING (toggles, presets, modal, action bar)
     ══════════════════════════════════════════════════════════════ */
  document.getElementById('unit-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    unitSystem = e.target.dataset.value;
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    buildSliders();
    refreshAllInputs();
    updateReadouts();
    draw(); drawChart();
    renderEquations();
    renderCoach();
  });

  document.getElementById('preset-select').addEventListener('change', function (e) {
    if (e.target.value !== '') applyPreset(parseInt(e.target.value, 10));
  });

  document.getElementById('dim-toggle').addEventListener('change', function (e) {
    showDimensions = e.target.checked;
    draw();
  });
  document.getElementById('eqn-overlay-toggle').addEventListener('change', function (e) {
    showEqnOverlay = e.target.checked;
    draw();
  });

  document.getElementById('show-calc-btn').addEventListener('click', openCalcModal);
  document.getElementById('calc-modal-close').addEventListener('click', closeCalcModal);
  document.getElementById('calc-modal').addEventListener('click', function (e) {
    if (e.target.id === 'calc-modal') closeCalcModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCalcModal();
  });

  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);
  document.getElementById('export-png-btn').addEventListener('click', function () { exportPng(canvas, 'stress-concentration-canvas'); });

  document.getElementById('learn-expand-all').addEventListener('click', function () {
    document.querySelectorAll('.learn-card').forEach(function (c) { c.open = true; });
  });
  document.getElementById('learn-collapse-all').addEventListener('click', function () {
    document.querySelectorAll('.learn-card').forEach(function (c) { c.open = false; });
  });

  var hintBar = document.getElementById('hint-bar');
  if (localStorage.getItem('sc-hint-dismissed') === '1') hintBar.style.display = 'none';
  document.getElementById('hint-close').addEventListener('click', function () {
    hintBar.style.display = 'none';
    try { localStorage.setItem('sc-hint-dismissed', '1'); } catch (err) {}
  });

  /* ══════════════════════════════════════════════════════════════
     18. INIT
     ══════════════════════════════════════════════════════════════ */
  buildSliders();
  populatePresets();
  updateReadouts();
  pushHistory();
  fitAllSC();   /* must run BEFORE the first paint: resizing a canvas clears it */
  draw();
  drawChart();
  renderEquations();
  renderCoach();
  drawHistory();

  window.addEventListener('resize', function () {
    fitAllSC();
    if (mode === 'simulate') { draw(); drawChart(); drawHistory(); }
  });

})();
