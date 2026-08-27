(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randPick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* Colour helpers (used by realistic gear rendering) */
  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lighten(hex, amt) {
    var c = hexToRGB(hex);
    return 'rgb(' + Math.min(255, c[0] + amt) + ',' + Math.min(255, c[1] + amt) + ',' + Math.min(255, c[2] + amt) + ')';
  }
  function darken(hex, amt) {
    var c = hexToRGB(hex);
    return 'rgb(' + Math.max(0, c[0] - amt) + ',' + Math.max(0, c[1] - amt) + ',' + Math.max(0, c[2] - amt) + ')';
  }
  function rgba(hex, a) {
    var c = hexToRGB(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  /* ================================================================
     CONSTANTS & DATA
     ================================================================ */
  var MODULES = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

  /* Lewis form factors Y for 20-degree pressure angle */
  var LEWIS_TABLE = [
    {t:12, y:0.245}, {t:13, y:0.261}, {t:14, y:0.277}, {t:15, y:0.290},
    {t:16, y:0.296}, {t:17, y:0.303}, {t:18, y:0.309}, {t:19, y:0.314},
    {t:20, y:0.322}, {t:21, y:0.328}, {t:22, y:0.331}, {t:24, y:0.337},
    {t:25, y:0.340}, {t:26, y:0.346}, {t:28, y:0.353}, {t:30, y:0.359},
    {t:32, y:0.365}, {t:34, y:0.371}, {t:36, y:0.377}, {t:38, y:0.383},
    {t:40, y:0.389}, {t:45, y:0.399}, {t:50, y:0.408}, {t:55, y:0.415},
    {t:60, y:0.421}, {t:65, y:0.425}, {t:70, y:0.429}, {t:75, y:0.433},
    {t:80, y:0.436}, {t:90, y:0.442}, {t:100, y:0.446}, {t:120, y:0.450},
    {t:150, y:0.458}
  ];

  /* Materials: name, allowable bending (MPa), allowable contact (MPa) */
  var DEFAULT_MATERIALS = [
    { name: 'Steel (Hardened)',  sigBend: 310, sigContact: 1100, Cp: 191 },
    { name: 'Steel (Case-hard)', sigBend: 400, sigContact: 1500, Cp: 191 },
    { name: 'Cast Iron',         sigBend: 105, sigContact: 550,  Cp: 163 },
    { name: 'Bronze',            sigBend: 85,  sigContact: 450,  Cp: 150 },
    { name: 'Nylon',             sigBend: 40,  sigContact: 200,  Cp: 70  }
  ];
  var MATERIALS = DEFAULT_MATERIALS.slice();

  /* AGMA factors */
  var Ko = 1.25, Kv = 1.20, Ks = 1.00, Km = 1.20, KB = 1.00, Cf = 1.00;

  /* Presets */
  var PRESETS = [
    { id: 'auto',    name: 'Automotive Pinion', gearType:'helical', moduleIdx:5, teethP:18, teethG:36, faceWidth:25, rpm:3000, powerKW:25, helixAngle:25, matIdx:1 },
    { id: 'gearbox', name: 'Industrial Gearbox', gearType:'spur',   moduleIdx:7, teethP:20, teethG:60, faceWidth:40, rpm:1450, powerKW:15, helixAngle:20, matIdx:0 },
    { id: 'high-rpm',name: 'High-Speed Spur',    gearType:'spur',   moduleIdx:4, teethP:25, teethG:40, faceWidth:20, rpm:4000, powerKW:8,  helixAngle:20, matIdx:1 },
    { id: 'heavy',   name: 'Heavy-Duty Slow',    gearType:'spur',   moduleIdx:9, teethP:22, teethG:88, faceWidth:60, rpm:300,  powerKW:30, helixAngle:20, matIdx:0 },
    { id: 'plastic', name: 'Light Plastic',      gearType:'spur',   moduleIdx:3, teethP:24, teethG:48, faceWidth:15, rpm:800,  powerKW:0.5,helixAngle:20, matIdx:4 },
    { id: 'ci-pump', name: 'Cast-Iron Pump',     gearType:'spur',   moduleIdx:5, teethP:20, teethG:50, faceWidth:30, rpm:1200, powerKW:3,  helixAngle:20, matIdx:2 }
  ];

  /* ================================================================
     UNIT SYSTEM (SI internal, Imperial display only)
     ================================================================ */
  var unitSys = 'si';
  function isImp() { return unitSys === 'imp'; }

  /* SI base, displayed accordingly */
  function uMod() { return isImp() ? 'in' : 'mm'; }            /* module shown in mm or in */
  function uLen() { return isImp() ? 'in' : 'mm'; }            /* face width, dia */
  function uForce() { return isImp() ? 'lbf' : 'N'; }
  function uStress() { return isImp() ? 'psi' : 'MPa'; }
  function uVel() { return isImp() ? 'ft/s' : 'm/s'; }
  function uPwr() { return isImp() ? 'hp' : 'kW'; }

  function dLen(siMM) { return isImp() ? siMM * 0.03937 : siMM; }
  function dForce(siN) { return isImp() ? siN * 0.2248 : siN; }
  function dStress(siMPa) { return isImp() ? siMPa * 145.0377 : siMPa; }
  function dVel(siMS) { return isImp() ? siMS * 3.2808 : siMS; }
  function dPwr(siKW) { return isImp() ? siKW * 1.3410 : siKW; }
  /* Reverse for stepper input commits */
  function siLen(d) { return isImp() ? d / 0.03937 : d; }
  function siPwr(d) { return isImp() ? d / 1.3410 : d; }

  function fmt(v, d) { if (!isFinite(v)) return '—'; return roundN(v, d).toString(); }

  /* ================================================================
     DOM REFS
     ================================================================ */
  var canvas = $('#sim-canvas');
  var ctx = canvas.getContext('2d');

  var simPanel    = $('#sim-panel');
  var catRow      = $('#cat-row');
  var itemSel     = $('#item-selector');
  var itemInfo    = $('#item-info');
  var practPanel  = $('#practice-panel');
  var practBar    = $('#practice-bar');
  var quizPanel   = $('#quiz-panel');
  var quizBar     = $('#quiz-bar');
  var quizResult  = $('#quiz-result');

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var gearType = 'spur';
  var matIdx = 0;
  var moduleIdx = 5;   /* index → 2 mm */
  var teethP = 20;
  var teethG = 40;
  var faceWidth = 30;  /* mm */
  var rpm = 1500;
  var powerKW = 5;
  var helixAngle = 20;

  /* Canvas feature toggles */
  var showEquation  = true;
  var showStressBar = true;
  var showForceArrow = true;
  var showGrid = false;
  var showCross = false;

  /* Animation */
  var animAngle = 0, animId = null;

  /* Practice / Quiz state */
  var pScore = 0, pTotal = 0, pAnswer = 0, pUnit = '', pSteps = [], pLocked = false;
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizLocked = false;

  /* Undo / Redo */
  var undoStack = [], redoStack = [];
  var UNDO_LIMIT = 50;

  /* ================================================================
     LEWIS / AGMA HELPERS
     ================================================================ */
  function lewisY(teeth) {
    if (teeth <= LEWIS_TABLE[0].t) return LEWIS_TABLE[0].y;
    if (teeth >= LEWIS_TABLE[LEWIS_TABLE.length - 1].t) return LEWIS_TABLE[LEWIS_TABLE.length - 1].y;
    for (var i = 0; i < LEWIS_TABLE.length - 1; i++) {
      if (teeth >= LEWIS_TABLE[i].t && teeth <= LEWIS_TABLE[i + 1].t) {
        var frac = (teeth - LEWIS_TABLE[i].t) / (LEWIS_TABLE[i + 1].t - LEWIS_TABLE[i].t);
        return LEWIS_TABLE[i].y + frac * (LEWIS_TABLE[i + 1].y - LEWIS_TABLE[i].y);
      }
    }
    return 0.40;
  }
  function agmaJ(teeth) { return 0.22 + (teeth - 12) * 0.0025; }
  function agmaI(tP, tG) {
    var mG = tG / tP;
    var sinPhi = Math.sin(20 * Math.PI / 180);
    var cosPhi = Math.cos(20 * Math.PI / 180);
    return sinPhi * cosPhi / 2 * mG / (mG + 1);
  }

  /* ================================================================
     CALCULATIONS (all SI internal)
     ================================================================ */
  function calc() {
    var m = MODULES[moduleIdx];
    var dP = m * teethP;
    var dG = m * teethG;
    var ratio = teethG / teethP;
    var v = Math.PI * dP * rpm / 60000;     /* m/s */
    var Wt = (powerKW * 1000) / Math.max(v, 1e-6);

    var Y = lewisY(teethP);
    var b = faceWidth;
    var helixRad = helixAngle * Math.PI / 180;
    var mn = (gearType === 'helical') ? m * Math.cos(helixRad) : m;

    var sigLewis = Wt / (b * mn * Y);

    var J = agmaJ(teethP);
    if (gearType === 'helical') J *= 1.15;
    var sigAGMA = (Wt * Ko * Kv * Ks * Km * KB) / (b * mn * J);

    var mat = MATERIALS[matIdx];
    var I = agmaI(teethP, teethG);
    if (gearType === 'helical') I *= 1.10;
    var sigContact = mat.Cp * Math.sqrt(Wt * Ko * Kv * Ks * Km * Cf / (b * dP * I));

    var fosBend = mat.sigBend / sigAGMA;
    var fosContact = mat.sigContact / sigContact;

    return {
      m: m, mn: mn, dP: dP, dG: dG, ratio: ratio, v: v, Wt: Wt,
      Y: Y, J: J, I: I,
      sigLewis: sigLewis, sigAGMA: sigAGMA, sigContact: sigContact,
      fosBend: fosBend, fosContact: fosContact, mat: mat, b: b
    };
  }

  /* ================================================================
     READOUT UPDATES (unit-aware)
     ================================================================ */
  function updateReadouts() {
    var r = calc();

    /* Badges */
    $('#rb-wt').textContent      = fmt(dForce(r.Wt), 0) + ' ' + uForce();
    $('#rb-bend').textContent    = fmt(dStress(r.sigAGMA), 1) + ' ' + uStress();
    $('#rb-contact').textContent = fmt(dStress(r.sigContact), 0) + ' ' + uStress();
    $('#rb-fos-b').textContent   = fmt(r.fosBend, 2);
    $('#rb-fos-c').textContent   = fmt(r.fosContact, 2);

    /* Readout cards */
    $('#r-wt').textContent      = fmt(dForce(r.Wt), 1);
    $('#r-bend').textContent    = fmt(dStress(r.sigAGMA), 1);
    $('#r-contact').textContent = fmt(dStress(r.sigContact), 0);
    $('#r-fos-b').textContent   = fmt(r.fosBend, 2);
    $('#r-fos-c').textContent   = fmt(r.fosContact, 2);
    $('#r-vel').textContent     = fmt(dVel(r.v), 2);
    $('#r-ratio').textContent   = fmt(r.ratio, 2);
    $('#r-dp').textContent      = fmt(dLen(r.dP), 1);

    /* Card unit labels */
    setText('u-wt',      ' ' + uForce());
    setText('u-bend',    ' ' + uStress());
    setText('u-contact', ' ' + uStress());
    setText('u-vel',     ' ' + uVel());
    setText('u-dp',      ' ' + uLen());

    /* Slider labels and unit badges */
    setText('lbl-module', 'Module');
    setText('bdg-module', uMod());
    setText('lbl-face',   'Face Width');
    setText('bdg-face',   uLen());
    setText('lbl-power',  'Power');
    setText('bdg-power',  uPwr());

    /* Slider value displays */
    $('#module-val').textContent  = fmt(dLen(MODULES[moduleIdx]), isImp() ? 4 : 2);
    $('#teeth-p-val').textContent = teethP;
    $('#teeth-g-val').textContent = teethG;
    $('#face-val').textContent    = fmt(dLen(faceWidth), isImp() ? 3 : 0);
    $('#rpm-val').textContent     = rpm;
    $('#power-val').textContent   = fmt(dPwr(powerKW), 2);
    $('#helix-val').innerHTML     = helixAngle + '&deg;';

    /* Sync stepper inputs (guard active typing) */
    syncSteppers();

    /* Status panel */
    setText('st-mat', MATERIALS[matIdx].name);
    setText('st-type', gearType.charAt(0).toUpperCase() + gearType.slice(1));
    setText('st-fos-bend', fmt(r.fosBend, 2));
    setText('st-fos-contact', fmt(r.fosContact, 2));

    /* FOS verdict colour cue */
    var verdict = $('#st-verdict');
    if (verdict) {
      if (r.fosBend < 1.0 || r.fosContact < 0.8) {
        verdict.textContent = 'UNSAFE'; verdict.className = 'st-verdict bad';
      } else if (r.fosBend < 1.5 || r.fosContact < 1.0) {
        verdict.textContent = 'MARGINAL'; verdict.className = 'st-verdict warn';
      } else {
        verdict.textContent = 'SAFE'; verdict.className = 'st-verdict ok';
      }
    }
  }

  function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

  function syncSteppers() {
    setStepper('stp-module', dLen(MODULES[moduleIdx]), isImp() ? 4 : 2);
    setStepper('stp-teeth-p', teethP, 0);
    setStepper('stp-teeth-g', teethG, 0);
    setStepper('stp-face',  dLen(faceWidth), isImp() ? 3 : 0);
    setStepper('stp-rpm',   rpm, 0);
    setStepper('stp-power', dPwr(powerKW), 2);
    setStepper('stp-helix', helixAngle, 0);
  }
  function setStepper(id, val, decimals) {
    var inp = document.getElementById(id);
    if (!inp || document.activeElement === inp) return;
    inp.value = roundN(val, decimals);
  }

  /* ================================================================
     CANVAS — DPR-aware resize + draw
     ================================================================ */
  var W = 900, H = 460;     /* logical drawing coords */

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width || canvas.parentElement.clientWidth - 16;
    var targetH = cssW * (H / W);
    if (Math.abs((rect.height || 0) - targetH) > 1) canvas.style.height = targetH + 'px';
    canvas.width  = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(targetH * dpr));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / W, canvas.height / H);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
    draw();
  }

  /* Realistic involute-style gear with linear flanks + radial gradient.
     Adapted from tools/gear-trains/. Tooth flank crosses pitch circle at
     toothAngle/4 so meshing geometry is visually correct. */
  function drawGear(cx, cy, numTeeth, pitchR, angle, strokeColor, label) {
    var modVis  = (2 * pitchR) / numTeeth;        // visual module from pitch radius
    var addendum = modVis;
    var dedendum = modVis * 1.25;
    var outerR = pitchR + addendum;
    var rootR  = Math.max(4, pitchR - dedendum);
    var toothAngle = (2 * Math.PI) / numTeeth;
    var hRoot = toothAngle * 0.34;
    var hTip  = toothAngle * 0.18;

    ctx.save();
    ctx.translate(cx, cy);

    /* Drop shadow under disc */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 14; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
    ctx.fillStyle = 'rgba(0,0,0,0.001)';
    ctx.beginPath(); ctx.arc(0, 0, outerR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.rotate(angle);

    /* Toothed silhouette */
    ctx.beginPath();
    for (var i = 0; i < numTeeth; i++) {
      var a   = i * toothAngle;
      var aLR = a - hRoot, aLT = a - hTip;
      var aRT = a + hTip,  aRR = a + hRoot;
      var aNextLR = ((i + 1) * toothAngle) - hRoot;
      if (i === 0) ctx.moveTo(rootR * Math.cos(aLR), rootR * Math.sin(aLR));
      ctx.lineTo(outerR * Math.cos(aLT), outerR * Math.sin(aLT));
      ctx.arc(0, 0, outerR, aLT, aRT, false);
      ctx.lineTo(rootR * Math.cos(aRR), rootR * Math.sin(aRR));
      ctx.arc(0, 0, rootR, aRR, aNextLR, false);
    }
    ctx.closePath();

    /* Radial gradient fill */
    var grad = ctx.createRadialGradient(-outerR * 0.25, -outerR * 0.25, rootR * 0.2, 0, 0, outerR);
    grad.addColorStop(0,    lighten(strokeColor, 70));
    grad.addColorStop(0.55, strokeColor);
    grad.addColorStop(1,    darken(strokeColor, 60));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = darken(strokeColor, 30);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* Inner bevel highlight */
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, rootR - 2, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();

    /* Helical hatching: clip to gear silhouette, draw diagonal lines tilted by helix angle */
    if (gearType === 'helical') {
      ctx.save();
      /* Re-build the tooth path as a clip region */
      ctx.beginPath();
      for (var j = 0; j < numTeeth; j++) {
        var aa   = j * toothAngle;
        var aaLR = aa - hRoot, aaLT = aa - hTip;
        var aaRT = aa + hTip,  aaRR = aa + hRoot;
        var aaNextLR = ((j + 1) * toothAngle) - hRoot;
        if (j === 0) ctx.moveTo(rootR * Math.cos(aaLR), rootR * Math.sin(aaLR));
        ctx.lineTo(outerR * Math.cos(aaLT), outerR * Math.sin(aaLT));
        ctx.arc(0, 0, outerR, aaLT, aaRT, false);
        ctx.lineTo(rootR * Math.cos(aaRR), rootR * Math.sin(aaRR));
        ctx.arc(0, 0, rootR, aaRR, aaNextLR, false);
      }
      ctx.closePath();
      ctx.clip();

      var helixRad = helixAngle * Math.PI / 180;
      var slope = Math.tan(helixRad);
      var step = Math.max(4, modVis * 0.55);
      var hLine = lighten(strokeColor, 40);
      ctx.strokeStyle = rgba('#ffffff', 0.28);
      ctx.lineWidth = 1;
      var span = outerR * 2.4;
      /* Lines parallel to slope = (1, slope), drawn across the bounding box */
      for (var k = -span; k <= span; k += step) {
        ctx.beginPath();
        ctx.moveTo(-span,  k - span * slope);
        ctx.lineTo( span,  k + span * slope);
        ctx.stroke();
      }
      /* A second, slightly thicker, accent line every 3rd step for crispness */
      ctx.strokeStyle = rgba(hLine, 0.55);
      ctx.lineWidth = 1.4;
      for (var kk = -span; kk <= span; kk += step * 3) {
        ctx.beginPath();
        ctx.moveTo(-span,  kk - span * slope);
        ctx.lineTo( span,  kk + span * slope);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* Hub */
    var hubR  = Math.max(modVis * 2.2, 10);
    var axleR = Math.max(modVis * 1.1, 5);
    var hubGrad = ctx.createRadialGradient(-hubR * 0.3, -hubR * 0.3, 1, 0, 0, hubR);
    hubGrad.addColorStop(0, lighten(strokeColor, 40));
    hubGrad.addColorStop(1, darken(strokeColor, 40));
    ctx.fillStyle = hubGrad;
    ctx.beginPath(); ctx.arc(0, 0, hubR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(strokeColor, 50);
    ctx.lineWidth = 1; ctx.stroke();

    /* Axle hole + keyway */
    ctx.fillStyle = '#0d1117';
    ctx.beginPath(); ctx.arc(0, 0, axleR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1; ctx.stroke();
    var kw = Math.max(1.5, axleR * 0.35);
    ctx.fillRect(-kw / 2, -axleR - kw * 0.6, kw, kw * 1.1);

    ctx.restore();

    /* Pitch circle (visible when grid toggle on, for clarity) */
    if (showGrid) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = rgba(strokeColor, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, pitchR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    /* Label */
    if (label) {
      ctx.font = '800 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.strokeText(label, cx, cy + outerR + 18);
      ctx.fillText (label, cx, cy + outerR + 18);
    }
  }

  function drawGridBg() {
    ctx.save();
    ctx.strokeStyle = 'rgba(139,157,195,0.10)';
    ctx.lineWidth = 1;
    var step = 30;
    for (var x = step; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = step; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* Side view: face-width runs vertically (top = one end, bottom = other end).
     The panel is tall and narrow — w = circumferential slice, h = face width.
     Spur: tooth lines are perfectly horizontal (full-face contact simultaneously).
     Helical: tooth lines are diagonal by ψ, sweeping contact is gradual.
     Animation drifts lines downward (circumferential rotation). */
  function drawCrossSection(x0, y0, w, h) {
    var isHelical = gearType === 'helical';
    var psi = isHelical ? helixAngle : 0;
    var slope = Math.tan(psi * Math.PI / 180);
    var slopeOff = slope * w;   // vertical drop of a tooth line across panel width w

    ctx.save();

    /* Title — two lines above panel */
    ctx.fillStyle = '#8b9dc3';
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Side view', x0 + w / 2, y0 - 14);
    ctx.fillStyle = isHelical ? '#ffab00' : '#90caf9';
    ctx.fillText(isHelical ? ('ψ = ' + helixAngle + '°') : 'ψ = 0° (spur)', x0 + w / 2, y0 - 4);

    /* Panel background */
    var grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
    grad.addColorStop(0, 'rgba(66,165,245,0.12)');
    grad.addColorStop(1, 'rgba(66,165,245,0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = 'rgba(139,157,195,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, w, h);

    /* Face-width double-arrow on left edge with value */
    var ax = x0 - 13;
    ctx.strokeStyle = '#8b9dc3'; ctx.fillStyle = '#8b9dc3'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, y0 + 4); ctx.lineTo(ax, y0 + h - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax - 3, y0 + 8); ctx.lineTo(ax, y0 + 2); ctx.lineTo(ax + 3, y0 + 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ax - 3, y0 + h - 8); ctx.lineTo(ax, y0 + h - 2); ctx.lineTo(ax + 3, y0 + h - 8); ctx.closePath(); ctx.fill();
    ctx.save();
    ctx.translate(ax - 7, y0 + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '500 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8b9dc3';
    ctx.fillText(fmt(dLen(faceWidth), isImp() ? 2 : 0) + ' ' + uLen(), 0, 0);
    ctx.restore();

    /* Tooth lines: clip to panel, drift downward */
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();

    var numTeethShown = 7;
    var pitch = h / numTeethShown;
    var phase = (animAngle * 80) % pitch;   // lines drift downward with rotation

    ctx.strokeStyle = 'rgba(144,202,249,0.55)';
    ctx.lineWidth = 1.3;
    for (var i = -2; i <= numTeethShown + 2; i++) {
      var lY = y0 + i * pitch + phase;
      ctx.beginPath();
      ctx.moveTo(x0, lY);
      ctx.lineTo(x0 + w, isHelical ? lY + slopeOff : lY);
      ctx.stroke();
    }

    /* Contact marker */
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,85,85,0.7)'; ctx.shadowBlur = 6;
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;

    if (isHelical) {
      /* Diagonal contact line sweeps vertically — gradual engagement */
      var sweepT = (animAngle * 0.6) % (Math.PI * 2);
      var halfRange = Math.max(4, (h - Math.abs(slopeOff) - 20) / 2);
      var sweepY = y0 + h / 2 + Math.sin(sweepT) * halfRange;
      ctx.beginPath();
      ctx.moveTo(x0, sweepY);
      ctx.lineTo(x0 + w, sweepY + slopeOff);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff8a65';
      ctx.font = '600 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('gradual', x0 + w / 2, y0 + h * 0.82);
      ctx.fillText('contact', x0 + w / 2, y0 + h * 0.91);
    } else {
      /* Horizontal line at centre — full face engaged simultaneously */
      var midY = y0 + h / 2;
      ctx.beginPath();
      ctx.moveTo(x0, midY);
      ctx.lineTo(x0 + w, midY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff8a65';
      ctx.font = '600 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('full-face', x0 + w / 2, y0 + h * 0.82);
      ctx.fillText('contact', x0 + w / 2, y0 + h * 0.91);
    }

    ctx.restore();   // unclip
    ctx.restore();
  }

  function drawClassicalEquation(cx, cy, sigLewisDisp, WtDisp, b_disp, m_disp, Y, gapW) {
    /* σ = W_t / (b · m · Y)   with values rolled in */
    var sVar = 18, sSub = 12, sVal = 12, sEq = 20;
    var floors = { v: 12, s: 9, val: 10, e: 14 };

    function mkFonts(s) {
      return {
        varFont: 'italic 700 ' + s.v   + 'px "Cambria Math","Times New Roman",serif',
        subFont:         '700 ' + s.s   + 'px "Cambria Math","Times New Roman",serif',
        valFont:         '700 ' + s.val + 'px "JetBrains Mono","Courier New",monospace',
        eqFont:          '700 ' + s.e   + 'px "Cambria Math","Times New Roman",serif'
      };
    }
    var sz = { v: sVar, s: sSub, val: sVal, e: sEq };
    var f = mkFonts(sz);

    var C_S = '#ff5555', C_W = '#ffab00', C_B = '#42a5f5', C_M = '#90caf9', C_Y = '#3ddc84', C_EQ = '#ffd54f';

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

    function measureLeft() { ctx.font = f.varFont; var a = ctx.measureText('σ').width; ctx.font = f.valFont; var b2 = ctx.measureText(' = ' + sigLewisDisp).width; return a + b2; }
    function measureNum()  { ctx.font = f.varFont; var a = ctx.measureText('W').width; ctx.font = f.subFont; var s2 = ctx.measureText('t').width; ctx.font = f.valFont; var v2 = ctx.measureText(' = ' + WtDisp).width; return a + s2 + v2; }
    function measureDen()  {
      ctx.font = f.valFont;
      var bTxt = b_disp + ' × ' + m_disp + ' × ' + Y;
      return ctx.measureText(bTxt).width;
    }
    function measureEq()   { ctx.font = f.eqFont; return ctx.measureText(' = ').width; }

    var wL = measureLeft(), wEq = measureEq(), wN = measureNum(), wD = measureDen();
    var wFrac = Math.max(wN, wD);
    var total = wL + wEq + wFrac;

    if (total > gapW) {
      var scale = Math.max(0.62, gapW / total);
      sz = {
        v:   Math.max(floors.v,   Math.round(sVar * scale)),
        s:   Math.max(floors.s,   Math.round(sSub * scale)),
        val: Math.max(floors.val, Math.round(sVal * scale)),
        e:   Math.max(floors.e,   Math.round(sEq * scale))
      };
      f = mkFonts(sz);
      wL = measureLeft(); wEq = measureEq(); wN = measureNum(); wD = measureDen();
      wFrac = Math.max(wN, wD);
      total = wL + wEq + wFrac;
    }

    var x = Math.round(cx - total / 2);
    var y = cy;

    /* σ = */
    ctx.font = f.varFont; ctx.fillStyle = C_S; ctx.fillText('σ', x, y);
    ctx.font = f.valFont; ctx.fillStyle = '#e6edf6';
    var wSig = (function () { ctx.font = f.varFont; return ctx.measureText('σ').width; })();
    ctx.font = f.valFont;
    ctx.fillText(' = ' + sigLewisDisp, x + wSig, y);
    x += wL;

    /* Equals between LHS and fraction */
    ctx.font = f.eqFont; ctx.fillStyle = C_EQ; ctx.fillText(' = ', x, y); x += wEq;

    /* Fraction: numerator (W_t), denominator (b · m · Y) */
    var vSpan = Math.max(8, Math.round(sz.v * 0.65));
    var fracX = x;
    /* Numerator centered horizontally within wFrac */
    var numX = fracX + Math.round((wFrac - wN) / 2);
    ctx.font = f.varFont; ctx.fillStyle = C_W; ctx.fillText('W', numX, y - vSpan);
    var wW = (function () { ctx.font = f.varFont; return ctx.measureText('W').width; })();
    ctx.font = f.subFont; ctx.fillText('t', numX + wW, y - vSpan + Math.round(sz.v * 0.25));
    var wTsub = (function () { ctx.font = f.subFont; return ctx.measureText('t').width; })();
    ctx.font = f.valFont; ctx.fillStyle = '#e6edf6';
    ctx.fillText(' = ' + WtDisp, numX + wW + wTsub, y - vSpan);

    /* Denominator: coloured tokens */
    var denX = fracX + Math.round((wFrac - wD) / 2);
    ctx.font = f.valFont;
    var bw = ctx.measureText(b_disp).width;
    var mw = ctx.measureText(' × ' + m_disp).width;
    var yw = ctx.measureText(' × ' + Y).width;
    ctx.fillStyle = C_B; ctx.fillText(b_disp, denX, y + vSpan);
    ctx.fillStyle = '#e6edf6'; ctx.fillText(' × ', denX + bw, y + vSpan);
    var afterB = denX + bw + ctx.measureText(' × ').width;
    ctx.fillStyle = C_M; ctx.fillText(m_disp, afterB, y + vSpan);
    ctx.fillStyle = '#e6edf6'; ctx.fillText(' × ', afterB + ctx.measureText(m_disp).width, y + vSpan);
    var afterM = afterB + ctx.measureText(m_disp).width + ctx.measureText(' × ').width;
    ctx.fillStyle = C_Y; ctx.fillText(Y, afterM, y + vSpan);

    /* Fraction bar */
    ctx.strokeStyle = '#e0e7ef'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(fracX - 2, y); ctx.lineTo(fracX + wFrac + 2, y); ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (showGrid) drawGridBg();

    var r = calc();

    /* Scale gears to fit canvas */
    var maxD = Math.max(r.dP, r.dG);
    var scale = Math.min((W * 0.35) / maxD, (H * 0.40) / maxD);
    scale = Math.min(scale, 2.5);
    scale = Math.max(scale, 0.3);

    var rP = (r.dP / 2) * scale;
    var rG = (r.dG / 2) * scale;

    var gap = rP + rG + 2;
    var cxP = W / 2 - gap / 2;
    var cyP = H * 0.42;
    var cxG = W / 2 + gap / 2;
    var cyG = H * 0.42;

    var angleP = animAngle;
    var angleG = -animAngle * (teethP / teethG);

    drawGear(cxP, cyP, teethP, rP, angleP, '#ffab00', 'Pinion (Z=' + teethP + ')');
    drawGear(cxG, cyG, teethG, rG, angleG, '#42a5f5', 'Gear (Z=' + teethG + ')');

    /* Mesh contact glow */
    var dx = cxG - cxP, dy = cyG - cyP, dM = Math.sqrt(dx*dx + dy*dy);
    if (dM > 1) {
      var mx = cxP + (dx / dM) * rP;
      var my = cyP + (dy / dM) * rP;
      var mg = ctx.createRadialGradient(mx, my, 0, mx, my, 18);
      mg.addColorStop(0, 'rgba(255,235,160,0.85)');
      mg.addColorStop(1, 'rgba(255,235,160,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, 18, 0, Math.PI * 2); ctx.fill();
    }

    /* Force arrow */
    if (showForceArrow) {
      var arrowLen = Math.min(60, rP * 0.9);
      ctx.save();
      ctx.strokeStyle = '#ff5555'; ctx.fillStyle = '#ff5555'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cxP, cyP - rP);
      ctx.lineTo(cxP + arrowLen, cyP - rP);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cxP + arrowLen, cyP - rP);
      ctx.lineTo(cxP + arrowLen - 7, cyP - rP - 5);
      ctx.lineTo(cxP + arrowLen - 7, cyP - rP + 5);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Wt = ' + fmt(dForce(r.Wt), 0) + ' ' + uForce(), cxP + arrowLen + 6, cyP - rP - 4);
      ctx.restore();
    }

    /* Stress bars (bottom-left) */
    if (showStressBar) {
      var barX = 14, barY = H - 70, barW = 130, barH = 10;
      ctx.fillStyle = '#8b9dc3';
      ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Bending: ' + fmt(dStress(r.sigAGMA), 0) + ' / ' + fmt(dStress(r.mat.sigBend), 0) + ' ' + uStress(), barX, barY - 4);
      ctx.fillStyle = '#1f2535'; ctx.fillRect(barX, barY, barW, barH);
      var fb = clamp(r.sigAGMA / r.mat.sigBend, 0, 1);
      ctx.fillStyle = fb > 0.9 ? '#ff5555' : fb > 0.65 ? '#f5c842' : '#3ddc84';
      ctx.fillRect(barX, barY, barW * fb, barH);

      barY += 26;
      ctx.fillStyle = '#8b9dc3';
      ctx.fillText('Contact: ' + fmt(dStress(r.sigContact), 0) + ' / ' + fmt(dStress(r.mat.sigContact), 0) + ' ' + uStress(), barX, barY - 4);
      ctx.fillStyle = '#1f2535'; ctx.fillRect(barX, barY, barW, barH);
      var fc = clamp(r.sigContact / r.mat.sigContact, 0, 1);
      ctx.fillStyle = fc > 0.9 ? '#ff5555' : fc > 0.65 ? '#f5c842' : '#3ddc84';
      ctx.fillRect(barX, barY, barW * fc, barH);
    }

    /* Cross-section panel — right side, vertical (tall + narrow) */
    var csW = 84, csH = 210, csX = W - csW - 14, csY = 36;
    if (showCross) {
      drawCrossSection(csX, csY, csW, csH);
    }

    /* FOS — bottom-right (above module info), repositioned to clear the
       cross-section panel that now occupies the top-right. */
    ctx.font = 'bold 11px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
    var fcY1 = H - 30, fcY2 = H - 14;
    var fc1 = r.fosBend >= 1.5 ? '#3ddc84' : r.fosBend >= 1.0 ? '#f5c842' : '#ff5555';
    ctx.fillStyle = fc1; ctx.fillText('FOS(b) = ' + fmt(r.fosBend, 2), W - 14, fcY1);
    var fc2 = r.fosContact >= 1.0 ? '#3ddc84' : r.fosContact >= 0.8 ? '#f5c842' : '#ff5555';
    ctx.fillStyle = fc2; ctx.fillText('FOS(c) = ' + fmt(r.fosContact, 2), W - 14, fcY2);

    /* Module / material info — bottom-left, beside stress bars */
    ctx.fillStyle = '#8b9dc3';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('m = ' + fmt(dLen(MODULES[moduleIdx]), isImp() ? 4 : 2) + ' ' + uMod() + '   |   ' + MATERIALS[matIdx].name, 14, H - 8);

    /* Classical Lewis equation bottom-center */
    if (showEquation) {
      var sigDisp = fmt(dStress(r.sigLewis), 1) + ' ' + uStress();
      var WtDisp  = fmt(dForce(r.Wt), 0) + ' ' + uForce();
      var bDisp   = fmt(dLen(r.b), isImp() ? 3 : 0) + ' ' + uLen();
      var mDisp   = fmt(dLen(r.mn), isImp() ? 4 : 2) + ' ' + uMod();
      var Ydisp   = fmt(r.Y, 3);
      var gapW = W - 220;
      drawClassicalEquation(W / 2, H * 0.86, sigDisp, WtDisp, bDisp, mDisp, Ydisp, gapW);
    }
  }

  function animate() {
    animAngle += 0.008;
    draw();
    animId = requestAnimationFrame(animate);
  }
  function startAnim() { if (!animId) animate(); }
  function stopAnim() { if (animId) { cancelAnimationFrame(animId); animId = null; } }

  /* ================================================================
     UNDO / REDO
     ================================================================ */
  function snapState() {
    return {
      gearType: gearType, matIdx: matIdx, moduleIdx: moduleIdx,
      teethP: teethP, teethG: teethG, faceWidth: faceWidth,
      rpm: rpm, powerKW: powerKW, helixAngle: helixAngle,
      unitSys: unitSys,
      sE: showEquation, sS: showStressBar, sF: showForceArrow, sG: showGrid, sX: showCross
    };
  }
  function loadState(s) {
    if (!s) return;
    gearType   = s.gearType   || 'spur';
    matIdx     = s.matIdx     != null ? s.matIdx : 0;
    moduleIdx  = s.moduleIdx  != null ? s.moduleIdx : 5;
    teethP     = s.teethP     || 20;
    teethG     = s.teethG     || 40;
    faceWidth  = s.faceWidth  || 30;
    rpm        = s.rpm        || 1500;
    powerKW    = s.powerKW    || 5;
    helixAngle = s.helixAngle || 20;
    unitSys    = s.unitSys    || 'si';
    showEquation   = (s.sE === undefined) ? true  : !!s.sE;
    showStressBar  = (s.sS === undefined) ? true  : !!s.sS;
    showForceArrow = (s.sF === undefined) ? true  : !!s.sF;
    showGrid       = (s.sG === undefined) ? false : !!s.sG;
    showCross      = (s.sX === undefined) ? false : !!s.sX;

    syncSimUI();
    syncToggleUI();
    syncUnitUI();
    updateReadouts(); draw();
  }
  function saveUndo() {
    undoStack.push(snapState());
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack.length = 0;
  }
  function performUndo() {
    if (undoStack.length === 0) return;
    redoStack.push(snapState());
    loadState(undoStack.pop());
  }
  function performRedo() {
    if (redoStack.length === 0) return;
    undoStack.push(snapState());
    loadState(redoStack.pop());
  }

  function syncSimUI() {
    /* Pills */
    $$('#gear-type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.gear === gearType); });
    $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', parseInt(p.dataset.mat, 10) === matIdx); });
    var helixRow = $('#helix-row');
    if (helixRow) helixRow.style.display = (gearType === 'helical') ? '' : 'none';

    /* Sliders */
    $('#module-slider').value = moduleIdx;
    $('#teeth-p-slider').value = teethP;
    $('#teeth-g-slider').value = teethG;
    $('#face-slider').value = faceWidth;
    $('#rpm-slider').value = rpm;
    $('#power-slider').value = powerKW;
    $('#helix-slider').value = helixAngle;
  }
  function syncToggleUI() {
    var e = $('#chk-equation'); if (e) e.checked = !!showEquation;
    var s = $('#chk-stress');   if (s) s.checked = !!showStressBar;
    var f = $('#chk-force');    if (f) f.checked = !!showForceArrow;
    var g = $('#chk-grid');     if (g) g.checked = !!showGrid;
    var x = $('#chk-cross');    if (x) x.checked = !!showCross;
  }
  function syncUnitUI() {
    $$('#unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.unit === unitSys); });
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  $('#mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.mode;
    $$('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;
    hide(simPanel); hide(catRow); hide(itemSel); hide(itemInfo);
    hide(practPanel); hide(practBar); hide(quizPanel); hide(quizBar); hide(quizResult);
    hide($('#action-bar')); hide($('#learn-panels')); hide($('#hint-banner'));

    if (m === 'simulate') {
      show(simPanel);
      show($('#action-bar'));
      show($('#learn-panels'));
      if (!hintDismissed) show($('#hint-banner'));
      startAnim(); updateReadouts();
    } else if (m === 'explore') {
      stopAnim();
      show(catRow); show(itemSel);
      buildConceptGrid();
    } else if (m === 'practice') {
      stopAnim();
      show(practPanel); show(practBar);
      pScore = 0; pTotal = 0;
      $('#pbar-score-val').textContent = '0 / 0';
      newPractice();
    } else if (m === 'quiz') {
      stopAnim();
      show(quizBar);
      startQuiz();
    }
    draw();
  }

  /* ================================================================
     HINT BANNER (auto-close on first interaction)
     ================================================================ */
  var hintDismissed = false;
  function dismissHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    var hb = $('#hint-banner'); if (hb) hb.style.display = 'none';
  }
  function wireHintAutoClose() {
    var dismiss = $('#hint-dismiss');
    if (dismiss) dismiss.addEventListener('click', dismissHint);
    /* Auto-close on any sim interaction */
    var triggers = ['#sim-panel', '#preset-bar', '#action-bar', '#sim-canvas'];
    triggers.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) {
        el.addEventListener('input', dismissHint, { once: true });
        el.addEventListener('click', dismissHint, { once: true });
        el.addEventListener('change', dismissHint, { once: true });
      }
    });
  }

  /* ================================================================
     SIMULATE PANEL — EVENT HANDLERS
     ================================================================ */
  $('#gear-type-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    saveUndo();
    gearType = e.target.dataset.gear;
    $$('#gear-type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    var helixRow = $('#helix-row');
    if (helixRow) helixRow.style.display = (gearType === 'helical') ? '' : 'none';
    clearPresetHighlight();
    updateReadouts(); draw();
  });

  $('#mat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill') || e.target.dataset.mat == null) return;
    saveUndo();
    matIdx = parseInt(e.target.dataset.mat, 10);
    $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    clearPresetHighlight();
    updateReadouts(); draw();
  });

  /* Slider handlers */
  function bindSlider(sel, setter, parseFn) {
    var s = $(sel);
    if (!s) return;
    s.addEventListener('input', function () {
      saveUndo();
      setter(parseFn(this.value));
      clearPresetHighlight();
      updateReadouts(); draw();
    });
  }
  bindSlider('#module-slider',  function (v) { moduleIdx = v; }, function (v) { return parseInt(v, 10); });
  bindSlider('#teeth-p-slider', function (v) { teethP = v; },    function (v) { return parseInt(v, 10); });
  bindSlider('#teeth-g-slider', function (v) { teethG = v; },    function (v) { return parseInt(v, 10); });
  bindSlider('#face-slider',    function (v) { faceWidth = v; }, function (v) { return parseInt(v, 10); });
  bindSlider('#rpm-slider',     function (v) { rpm = v; },       function (v) { return parseInt(v, 10); });
  bindSlider('#power-slider',   function (v) { powerKW = v; },   function (v) { return parseFloat(v); });
  bindSlider('#helix-slider',   function (v) { helixAngle = v; },function (v) { return parseInt(v, 10); });

  /* ================================================================
     STEPPERS — companion text inputs + [-]/[+] buttons
     ================================================================ */
  function wireStepper(opts) {
    /* opts: id (input id), minus, plus, get(), set(displayValue), step */
    var inp = document.getElementById(opts.id);
    var minus = document.getElementById(opts.minus);
    var plus  = document.getElementById(opts.plus);
    if (!inp || !minus || !plus) return;

    function commit(v) {
      saveUndo();
      opts.set(v);
      clearPresetHighlight();
      updateReadouts(); draw();
    }
    inp.addEventListener('change', function () {
      var v = parseFloat(this.value);
      if (isNaN(v)) return;
      commit(v);
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') this.blur(); });
    minus.addEventListener('click', function () { commit(opts.get() - opts.step()); });
    plus.addEventListener('click',  function () { commit(opts.get() + opts.step()); });
  }

  /* Module: stepper changes moduleIdx by snapping to nearest entry in MODULES (display value in mm or in) */
  wireStepper({
    id: 'stp-module', minus: 'stp-module-minus', plus: 'stp-module-plus',
    get: function () { return dLen(MODULES[moduleIdx]); },
    set: function (dv) {
      var siMM = siLen(dv);
      var best = 0, bestErr = Infinity;
      for (var i = 0; i < MODULES.length; i++) {
        var err = Math.abs(MODULES[i] - siMM);
        if (err < bestErr) { bestErr = err; best = i; }
      }
      moduleIdx = best;
    },
    step: function () { return isImp() ? 0.04 : 0.5; }
  });
  wireStepper({
    id: 'stp-teeth-p', minus: 'stp-teeth-p-minus', plus: 'stp-teeth-p-plus',
    get: function () { return teethP; },
    set: function (v) { teethP = clamp(Math.round(v), 12, 80); },
    step: function () { return 1; }
  });
  wireStepper({
    id: 'stp-teeth-g', minus: 'stp-teeth-g-minus', plus: 'stp-teeth-g-plus',
    get: function () { return teethG; },
    set: function (v) { teethG = clamp(Math.round(v), 12, 150); },
    step: function () { return 1; }
  });
  wireStepper({
    id: 'stp-face', minus: 'stp-face-minus', plus: 'stp-face-plus',
    get: function () { return dLen(faceWidth); },
    set: function (dv) { faceWidth = clamp(Math.round(siLen(dv)), 10, 100); },
    step: function () { return isImp() ? 0.1 : 1; }
  });
  wireStepper({
    id: 'stp-rpm', minus: 'stp-rpm-minus', plus: 'stp-rpm-plus',
    get: function () { return rpm; },
    set: function (v) { rpm = clamp(Math.round(v / 50) * 50, 100, 10000); },
    step: function () { return 50; }
  });
  wireStepper({
    id: 'stp-power', minus: 'stp-power-minus', plus: 'stp-power-plus',
    get: function () { return dPwr(powerKW); },
    set: function (dv) { powerKW = clamp(siPwr(dv), 0.1, 200); },
    step: function () { return isImp() ? 0.5 : 0.5; }
  });
  wireStepper({
    id: 'stp-helix', minus: 'stp-helix-minus', plus: 'stp-helix-plus',
    get: function () { return helixAngle; },
    set: function (v) { helixAngle = clamp(Math.round(v), 0, 45); },
    step: function () { return 1; }
  });

  /* ================================================================
     PRESETS
     ================================================================ */
  function clearPresetHighlight() {
    $$('#preset-bar .preset-btn').forEach(function (b) { b.classList.remove('active'); });
  }
  function applyPreset(p, btn) {
    saveUndo();
    gearType   = p.gearType;
    moduleIdx  = p.moduleIdx;
    teethP     = p.teethP;
    teethG     = p.teethG;
    faceWidth  = p.faceWidth;
    rpm        = p.rpm;
    powerKW    = p.powerKW;
    helixAngle = p.helixAngle;
    matIdx     = p.matIdx;
    syncSimUI();
    clearPresetHighlight();
    if (btn) btn.classList.add('active');
    updateReadouts(); draw();
  }

  function buildPresetBar() {
    var bar = $('#preset-bar');
    if (!bar) return;
    var html = '<span class="ctrl-label">Presets</span>';
    PRESETS.forEach(function (p) {
      html += '<button class="preset-btn" data-id="' + p.id + '">' + p.name + '</button>';
    });
    bar.innerHTML = html;
    bar.querySelectorAll('.preset-btn[data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = PRESETS.find(function (x) { return x.id === btn.dataset.id; });
        if (p) applyPreset(p, btn);
      });
    });
  }

  /* ================================================================
     CUSTOM MATERIAL MODAL
     ================================================================ */
  function openCustomMatModal() {
    var modal = $('#custom-mat-modal');
    if (!modal) return;
    /* Pre-fill labels with current unit */
    setText('cm-bend-unit', uStress());
    setText('cm-contact-unit', uStress());
    /* Default values in displayed units */
    $('#cm-name').value = 'Custom Steel';
    $('#cm-bend').value = roundN(dStress(250), 1);
    $('#cm-contact').value = roundN(dStress(900), 0);
    $('#cm-cp').value = 191;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var el = $('#cm-name'); if (el) el.focus(); }, 30);
  }
  function closeCustomMatModal() {
    var modal = $('#custom-mat-modal'); if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  function submitCustomMat() {
    var name = ($('#cm-name').value || '').trim() || 'Custom';
    var bendD    = parseFloat($('#cm-bend').value);
    var contactD = parseFloat($('#cm-contact').value);
    var cp       = parseFloat($('#cm-cp').value);
    if (isNaN(bendD) || isNaN(contactD) || isNaN(cp)) return;
    /* Convert displayed → SI */
    var bendSI    = isImp() ? bendD / 145.0377 : bendD;
    var contactSI = isImp() ? contactD / 145.0377 : contactD;
    var newMat = { name: name, sigBend: bendSI, sigContact: contactSI, Cp: cp };

    /* Replace any existing custom or append */
    var existingIdx = -1;
    for (var i = 0; i < MATERIALS.length; i++) {
      if (i >= DEFAULT_MATERIALS.length) { existingIdx = i; break; }
    }
    saveUndo();
    if (existingIdx >= 0) {
      MATERIALS[existingIdx] = newMat;
      matIdx = existingIdx;
    } else {
      MATERIALS.push(newMat);
      matIdx = MATERIALS.length - 1;
    }
    rebuildMatTabs();
    closeCustomMatModal();
    updateReadouts(); draw();
  }
  function rebuildMatTabs() {
    var tabs = $('#mat-tabs');
    if (!tabs) return;
    var html = '';
    MATERIALS.forEach(function (m, i) {
      html += '<button class="pill' + (i === matIdx ? ' active' : '') + '" data-mat="' + i + '">' + m.name + '</button>';
    });
    html += '<button class="pill pill-custom" id="btn-custom-mat" type="button" title="Define custom material">+ Custom</button>';
    tabs.innerHTML = html;
    var custom = $('#btn-custom-mat');
    if (custom) custom.addEventListener('click', openCustomMatModal);
  }

  /* ================================================================
     SHOW CALCULATION MODAL (AGMA derivation)
     ================================================================ */
  function calcStep(num, title, formula, calculation, result) {
    var html = '<div class="cs-step">';
    html += '<div class="cs-step-hd">';
    html += '<span class="cs-num">Step ' + num + '</span>';
    html += '<span class="cs-title">' + title + '</span>';
    html += '</div>';
    if (formula)     html += '<div class="cs-formula">' + formula + '</div>';
    if (calculation) html += '<div class="cs-calc">' + calculation.replace(/\n/g, '<br>') + '</div>';
    if (result != null) html += '<div class="cs-result">→ <strong>' + result + '</strong></div>';
    html += '</div>';
    return html;
  }

  function buildCalcSteps() {
    var r = calc();
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Given &mdash; Current State</span>';
    html += '<div class="cs-given">';
    html += '<span>m = ' + r.m + ' mm</span>';
    html += '<span>Z<sub>p</sub> = ' + teethP + '</span>';
    html += '<span>Z<sub>g</sub> = ' + teethG + '</span>';
    html += '<span>b = ' + r.b + ' mm</span>';
    html += '<span>n = ' + rpm + ' rpm</span>';
    html += '<span>P = ' + powerKW + ' kW</span>';
    html += '<span>Material: ' + r.mat.name + '</span>';
    if (gearType === 'helical') html += '<span>ψ = ' + helixAngle + '°</span>';
    html += '</div>';
    html += '<p class="cs-si-note">&#9432; All calculations performed in SI. Displayed units follow the SI / Imperial toggle.</p></div>';

    /* Step 1: Pitch diameter */
    html += calcStep(1, 'Pitch diameter (pinion)',
      '\\[ d<sub>p</sub> = m × Z<sub>p</sub> \\]',
      'd<sub>p</sub> = ' + r.m + ' × ' + teethP,
      roundN(r.dP, 2) + ' mm');

    /* Step 2: Pitch line velocity */
    html += calcStep(2, 'Pitch line velocity',
      '\\[ v = π × d<sub>p</sub> × n / 60000 \\]',
      'v = π × ' + roundN(r.dP, 1) + ' × ' + rpm + ' / 60000',
      roundN(r.v, 3) + ' m/s');

    /* Step 3: Tangential force */
    html += calcStep(3, 'Tangential force',
      '\\[ W<sub>t</sub> = (P × 1000) / v \\]',
      'W<sub>t</sub> = (' + powerKW + ' × 1000) / ' + roundN(r.v, 3),
      roundN(r.Wt, 0) + ' N');

    /* Step 4: Lewis form factor */
    html += calcStep(4, 'Lewis form factor (Z<sub>p</sub> = ' + teethP + ')',
      'Y = lookup(Z<sub>p</sub>, 20° PA)',
      'From AGMA / Lewis tables for ' + teethP + ' teeth at 20°',
      roundN(r.Y, 3));

    /* Step 5: Lewis bending stress */
    var mnNote = (gearType === 'helical')
      ? ('m<sub>n</sub> = m × cosψ = ' + r.m + ' × cos(' + helixAngle + '°) = ' + roundN(r.mn, 3) + ' mm')
      : 'm<sub>n</sub> = m = ' + r.m + ' mm (spur)';
    html += calcStep(5, 'Lewis bending stress',
      '\\[ σ<sub>L</sub> = W<sub>t</sub> / (b × m<sub>n</sub> × Y) \\]',
      mnNote + '\nσ<sub>L</sub> = ' + roundN(r.Wt, 0) + ' / (' + r.b + ' × ' + roundN(r.mn, 3) + ' × ' + roundN(r.Y, 3) + ')',
      roundN(r.sigLewis, 1) + ' MPa');

    /* Step 6: AGMA bending stress */
    var jNote = (gearType === 'helical')
      ? 'J = ' + roundN(r.J, 4) + ' (includes 1.15× helical multiplier)'
      : 'J = ' + roundN(r.J, 4);
    html += calcStep(6, 'AGMA bending stress (with correction factors)',
      '\\[ σ<sub>b</sub> = W<sub>t</sub> × K<sub>o</sub> × K<sub>v</sub> × K<sub>s</sub> × K<sub>m</sub> × K<sub>B</sub> / (b × m<sub>n</sub> × J) \\]',
      'K<sub>o</sub>=' + Ko + ', K<sub>v</sub>=' + Kv + ', K<sub>s</sub>=' + Ks + ', K<sub>m</sub>=' + Km + ', K<sub>B</sub>=' + KB + '\n' + jNote +
      '\nNumerator = ' + roundN(r.Wt, 0) + ' × ' + roundN(Ko*Kv*Ks*Km*KB, 3) + ' = ' + roundN(r.Wt * Ko * Kv * Ks * Km * KB, 0) +
      '\nDenominator = ' + r.b + ' × ' + roundN(r.mn, 3) + ' × ' + roundN(r.J, 4) + ' = ' + roundN(r.b * r.mn * r.J, 3),
      roundN(r.sigAGMA, 1) + ' MPa  (≈ ' + roundN(dStress(r.sigAGMA), 0) + ' ' + uStress() + ')');

    /* Step 7: AGMA contact stress */
    html += calcStep(7, 'AGMA contact (Hertzian) stress',
      '\\[ σ<sub>c</sub> = C<sub>p</sub> × √(W<sub>t</sub> × K<sub>o</sub> × K<sub>v</sub> × K<sub>s</sub> × K<sub>m</sub> × C<sub>f</sub> / (b × d<sub>p</sub> × I)) \\]',
      'C<sub>p</sub> = ' + r.mat.Cp + ' √(MPa)\nI = ' + roundN(r.I, 4) +
      '\nUnder root = ' + roundN(r.Wt * Ko * Kv * Ks * Km * Cf, 0) + ' / (' + r.b + ' × ' + roundN(r.dP, 1) + ' × ' + roundN(r.I, 4) + ')',
      roundN(r.sigContact, 0) + ' MPa  (≈ ' + roundN(dStress(r.sigContact), 0) + ' ' + uStress() + ')');

    /* Step 8: Safety factors + verdict */
    var verdict;
    if (r.fosBend < 1.0 || r.fosContact < 0.8) verdict = 'UNSAFE — increase module, face width, or upgrade material.';
    else if (r.fosBend < 1.5 || r.fosContact < 1.0) verdict = 'MARGINAL — design works but lacks usual safety margin.';
    else verdict = 'SAFE — within recommended industrial margins (FOS ≥ 1.5 bending, ≥ 1.0 contact).';
    html += calcStep(8, 'Safety factors and verdict',
      '\\[ FOS<sub>b</sub> = σ<sub>b,allow</sub> / σ<sub>b</sub>   ;   FOS<sub>c</sub> = σ<sub>c,allow</sub> / σ<sub>c</sub> \\]',
      'FOS<sub>b</sub> = ' + r.mat.sigBend + ' / ' + roundN(r.sigAGMA, 1) + ' = ' + roundN(r.fosBend, 2) +
      '\nFOS<sub>c</sub> = ' + r.mat.sigContact + ' / ' + roundN(r.sigContact, 0) + ' = ' + roundN(r.fosContact, 2),
      verdict);

    return html;
  }

  function openCalcModal() {
    var modal = $('#calc-modal');
    var body  = $('#calc-modal-body');
    if (!modal || !body) return;
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    var cb = $('#calc-modal-close'); if (cb) cb.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCalcModal() {
    var modal = $('#calc-modal'); if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    var b = $('#btn-calc'); if (b) b.focus();
  }

  /* ================================================================
     CONTEXT MENU (right-click on canvas)
     ================================================================ */
  var ctxMenu = null;
  function buildCtxMenu() {
    if (ctxMenu) return;
    ctxMenu = document.createElement('div');
    ctxMenu.className = 'ctx-menu';
    ctxMenu.innerHTML =
      '<div class="ctx-item" data-act="export-png">Export PNG</div>' +
      '<div class="ctx-item" data-act="export-csv">Export CSV</div>' +
      '<div class="ctx-sep"></div>' +
      '<div class="ctx-item" data-act="copy-wt">Copy W<sub>t</sub> value</div>' +
      '<div class="ctx-item" data-act="copy-bend">Copy bending stress</div>' +
      '<div class="ctx-item" data-act="copy-contact">Copy contact stress</div>' +
      '<div class="ctx-sep"></div>' +
      '<div class="ctx-item" data-act="toggle-grid">Toggle grid</div>' +
      '<div class="ctx-item" data-act="toggle-eq">Toggle equation</div>' +
      '<div class="ctx-sep"></div>' +
      '<div class="ctx-item" data-act="reset">Reset to defaults</div>';
    document.body.appendChild(ctxMenu);
    ctxMenu.addEventListener('click', function (e) {
      var t = e.target.closest('.ctx-item');
      if (!t) return;
      handleCtxAction(t.dataset.act);
      hideCtxMenu();
    });
    document.addEventListener('click', function (e) {
      if (ctxMenu && !ctxMenu.contains(e.target)) hideCtxMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideCtxMenu();
    });
  }
  function showCtxMenu(x, y) {
    buildCtxMenu();
    ctxMenu.style.display = 'block';
    /* Clamp to viewport */
    var vw = window.innerWidth, vh = window.innerHeight;
    var rect = ctxMenu.getBoundingClientRect();
    var px = Math.min(x, vw - rect.width - 8);
    var py = Math.min(y, vh - rect.height - 8);
    ctxMenu.style.left = Math.max(4, px) + 'px';
    ctxMenu.style.top  = Math.max(4, py) + 'px';
  }
  function hideCtxMenu() { if (ctxMenu) ctxMenu.style.display = 'none'; }

  function handleCtxAction(act) {
    var r = calc();
    if (act === 'export-png') exportPNG();
    else if (act === 'export-csv') exportCSV();
    else if (act === 'copy-wt')      copyToClip(roundN(dForce(r.Wt), 1) + ' ' + uForce());
    else if (act === 'copy-bend')    copyToClip(roundN(dStress(r.sigAGMA), 1) + ' ' + uStress());
    else if (act === 'copy-contact') copyToClip(roundN(dStress(r.sigContact), 0) + ' ' + uStress());
    else if (act === 'toggle-grid') { saveUndo(); showGrid = !showGrid; syncToggleUI(); draw(); }
    else if (act === 'toggle-eq')   { saveUndo(); showEquation = !showEquation; syncToggleUI(); draw(); }
    else if (act === 'reset')       resetAll();
  }

  function copyToClip(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
  }

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY);
  });

  /* ================================================================
     EXPORT — CSV + PNG
     ================================================================ */
  function exportCSV() {
    var r = calc();
    var rows = [];
    rows.push(['Parameter', 'Value', 'Unit']);
    rows.push(['Gear type', gearType, '']);
    rows.push(['Material', r.mat.name, '']);
    rows.push(['Module (m)', r.m, 'mm']);
    rows.push(['Pinion teeth (Zp)', teethP, '']);
    rows.push(['Gear teeth (Zg)', teethG, '']);
    rows.push(['Face width (b)', r.b, 'mm']);
    rows.push(['RPM (pinion)', rpm, 'rpm']);
    rows.push(['Power (P)', powerKW, 'kW']);
    if (gearType === 'helical') rows.push(['Helix angle', helixAngle, 'deg']);
    rows.push(['Pitch diameter (dp)', roundN(r.dP, 2), 'mm']);
    rows.push(['Pitch diameter (dg)', roundN(r.dG, 2), 'mm']);
    rows.push(['Gear ratio', roundN(r.ratio, 3), '']);
    rows.push(['Pitch line velocity', roundN(r.v, 3), 'm/s']);
    rows.push(['Tangential force (Wt)', roundN(r.Wt, 1), 'N']);
    rows.push(['Lewis form factor (Y)', roundN(r.Y, 3), '']);
    rows.push(['AGMA J factor', roundN(r.J, 4), '']);
    rows.push(['AGMA I factor', roundN(r.I, 4), '']);
    rows.push(['Lewis bending stress', roundN(r.sigLewis, 2), 'MPa']);
    rows.push(['AGMA bending stress', roundN(r.sigAGMA, 2), 'MPa']);
    rows.push(['AGMA contact stress', roundN(r.sigContact, 1), 'MPa']);
    rows.push(['Allowable bending', r.mat.sigBend, 'MPa']);
    rows.push(['Allowable contact', r.mat.sigContact, 'MPa']);
    rows.push(['FOS bending', roundN(r.fosBend, 3), '']);
    rows.push(['FOS contact', roundN(r.fosContact, 3), '']);

    var csv = rows.map(function (row) {
      return row.map(function (c) {
        var s = String(c);
        if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',');
    }).join('\n');

    downloadFile(csv, 'gear-strength-' + Date.now() + '.csv', 'text/csv');
  }

  function exportPNG() {
    /* Render an offscreen export canvas with watermark */
    var off = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    off.width = W * dpr; off.height = (H + 40) * dpr;
    var oc = off.getContext('2d');
    oc.scale(dpr, dpr);
    /* Background */
    oc.fillStyle = '#0d1117';
    oc.fillRect(0, 0, W, H + 40);
    /* Copy current canvas content (re-render into export ctx) */
    var prevCtx = ctx;
    /* Temporarily swap drawing context */
    ctx = oc;
    draw();
    ctx = prevCtx;

    /* Watermark footer */
    oc.fillStyle = '#8b9dc3';
    oc.font = '12px "Segoe UI", sans-serif';
    oc.textAlign = 'left';
    oc.fillText('NHIT VisualLab / Gear Strength Simulator', 14, H + 25);
    oc.textAlign = 'right';
    var r = calc();
    oc.fillText(
      'm=' + r.m + 'mm  Zp=' + teethP + '  Zg=' + teethG + '  b=' + r.b + 'mm  P=' + powerKW + 'kW  n=' + rpm + 'rpm',
      W - 14, H + 25
    );

    off.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'gear-strength-' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function downloadFile(content, name, mime) {
    var blob = new Blob([content], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ================================================================
     RESET
     ================================================================ */
  function resetAll() {
    saveUndo();
    gearType = 'spur';
    matIdx = 0; moduleIdx = 5;
    teethP = 20; teethG = 40;
    faceWidth = 30; rpm = 1500; powerKW = 5; helixAngle = 20;
    showEquation = true; showStressBar = true; showForceArrow = true; showGrid = false; showCross = false;
    MATERIALS = DEFAULT_MATERIALS.slice();
    rebuildMatTabs();
    syncSimUI(); syncToggleUI();
    clearPresetHighlight();
    updateReadouts(); draw();
  }

  /* ================================================================
     UNIT TOGGLE
     ================================================================ */
  function wireUnitTabs() {
    var tabs = $('#unit-tabs');
    if (!tabs) return;
    tabs.addEventListener('click', function (e) {
      if (!e.target.matches('.pill')) return;
      saveUndo();
      unitSys = e.target.dataset.unit;
      syncUnitUI();
      updateReadouts(); draw();
    });
  }

  /* ================================================================
     CANVAS FEATURE TOGGLES (checkboxes)
     ================================================================ */
  function wireCanvasToggles() {
    var e = $('#chk-equation');
    var s = $('#chk-stress');
    var f = $('#chk-force');
    var g = $('#chk-grid');
    var x = $('#chk-cross');
    if (e) e.addEventListener('change', function () { saveUndo(); showEquation  = this.checked; draw(); });
    if (s) s.addEventListener('change', function () { saveUndo(); showStressBar = this.checked; draw(); });
    if (f) f.addEventListener('change', function () { saveUndo(); showForceArrow = this.checked; draw(); });
    if (g) g.addEventListener('change', function () { saveUndo(); showGrid     = this.checked; draw(); });
    if (x) x.addEventListener('change', function () { saveUndo(); showCross    = this.checked; draw(); });
  }

  /* ================================================================
     LEARNING PANELS (collapsible)
     ================================================================ */
  function wireLearnPanels() {
    var expAll = $('#learn-expand-all');
    var colAll = $('#learn-collapse-all');
    var cards  = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  }

  /* ================================================================
     KEYBOARD SHORTCUTS
     ================================================================ */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    var isInput = (tag === 'INPUT' || tag === 'TEXTAREA');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      if (!isInput) { e.preventDefault(); performUndo(); }
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      if (!isInput) { e.preventDefault(); performRedo(); }
    } else if (e.key === 'Escape') {
      if ($('#calc-modal').classList.contains('active')) closeCalcModal();
      else if ($('#custom-mat-modal').classList.contains('active')) closeCustomMatModal();
    }
  });

  /* ================================================================
     EXPLORE MODE — CONCEPTS
     ================================================================ */
  var CONCEPTS = [
    /* Fundamentals */
    { id: 'lewis-eq', name: 'Lewis Equation', symbol: 'σ = Wt/(bmY)', formula: 'σ = Wt / (b × m × Y)', unit: 'MPa', cat: 'fundamentals',
      desc: 'The Lewis bending stress equation treats the gear tooth as a cantilever beam loaded at its tip. Wt is the tangential force (N), b is the face width (mm), m is the module (mm), and Y is the Lewis form factor which depends on the number of teeth. It gives the maximum bending stress at the tooth root.',
      example: { problem: 'Wt = 2000 N, b = 30 mm, m = 3 mm, Y = 0.322 (20 teeth). Find bending stress.',
        steps: ['σ = Wt / (b × m × Y)', 'σ = 2000 / (30 × 3 × 0.322)', 'σ = 2000 / 28.98', 'σ = 69.0 MPa'], answer: 69.0, unit: 'MPa' } },
    { id: 'form-factor', name: 'Lewis Form Factor', symbol: 'Y = f(N)', formula: 'Y increases with tooth count', unit: '—', cat: 'fundamentals',
      desc: 'The Lewis form factor Y depends on the number of teeth and pressure angle. For 20-degree, Y ranges from 0.245 (12 teeth) to 0.458 (150 teeth). Higher Y means a stronger tooth relative to its size.',
      example: { problem: 'Compare Y for 15-tooth and 40-tooth gears (20-deg PA).',
        steps: ['Y(15) = 0.290', 'Y(40) = 0.389', 'The 40-tooth gear has 34% higher form factor', 'More teeth = stronger tooth root'], answer: 0.389, unit: '' } },
    { id: 'tang-force', name: 'Tangential Force', symbol: 'Wt = P/v', formula: 'Wt = P / v = P × 60000 / (π × d × n)', unit: 'N', cat: 'fundamentals',
      desc: 'The tangential force Wt acts along the pitch circle and transmits power. From P (kW) and v (m/s): Wt = (P × 1000) / v. Pitch line velocity v = π × d × n / 60000 (mm, RPM).',
      example: { problem: 'P = 5 kW, d = 60 mm, n = 1500 RPM. Find Wt.',
        steps: ['v = π × 60 × 1500 / 60000 = 4.712 m/s', 'Wt = (5 × 1000) / 4.712', 'Wt = 1061 N'], answer: 1061, unit: 'N' } },
    { id: 'pitch-diam', name: 'Pitch Diameter', symbol: 'd = m × N', formula: 'd = m × N', unit: 'mm', cat: 'fundamentals',
      desc: 'Pitch diameter is the diameter of the imaginary circle on which gear teeth mesh. It equals module times the number of teeth. Two meshing gears must share the same module. Centre distance = (d1 + d2) / 2.',
      example: { problem: 'm = 4 mm, N = 25 teeth. Find pitch diameter.',
        steps: ['d = m × N', 'd = 4 × 25', 'd = 100 mm'], answer: 100, unit: 'mm' } },

    /* Failure modes */
    { id: 'bend-fatigue', name: 'Bending Fatigue', symbol: 'Root crack', formula: 'σ_bend < σ_allow / FOS', unit: 'MPa', cat: 'failure',
      desc: 'Bending fatigue: repeated stress cycles initiate a crack at the tooth root fillet (tensile side). Most common gear failure. The Lewis and AGMA methods both target this mode.',
      example: { problem: 'Actual bending = 180 MPa, allowable = 310 MPa. Find FOS.',
        steps: ['FOS = σ_allow / σ_actual', 'FOS = 310 / 180', 'FOS = 1.72', 'Safe (FOS > 1.5)'], answer: 1.72, unit: '' } },
    { id: 'pitting', name: 'Surface Pitting', symbol: 'Contact fatigue', formula: 'σ_c < σ_c_allow / FOS', unit: 'MPa', cat: 'failure',
      desc: 'Pitting is surface fatigue from repeated Hertzian contact. Subsurface cracks propagate, causing pits on the tooth flank. AGMA contact stress evaluates pitting resistance.',
      example: { problem: 'Contact = 850 MPa, allowable = 1100 MPa. Find FOS.',
        steps: ['FOS = σ_c_allow / σ_c_actual', 'FOS = 1100 / 850', 'FOS = 1.29', 'Acceptable (FOS > 1.0)'], answer: 1.29, unit: '' } },
    { id: 'scuffing', name: 'Scuffing', symbol: 'Adhesive wear', formula: 'PV < PV_limit', unit: 'MPa·m/s', cat: 'failure',
      desc: 'Scuffing (scoring) is adhesive wear from lubricant film breakdown. PV factor (contact pressure × sliding velocity) exceeding lubricant capacity is the trigger. Worst at high speed under heavy load.',
      example: { problem: 'P = 400 MPa, V = 3.5 m/s. Find PV.',
        steps: ['PV = P × V', 'PV = 400 × 3.5', 'PV = 1400 MPa·m/s', 'Compare with lubricant limit'], answer: 1400, unit: 'MPa·m/s' } },
    { id: 'tooth-fracture', name: 'Tooth Fracture', symbol: 'Overload', formula: 'σ_max > σ_ultimate', unit: 'MPa', cat: 'failure',
      desc: 'Tooth fracture is sudden, catastrophic failure from a single overload exceeding ultimate strength. Causes: shock loads, foreign objects, poor heat treatment. AGMA Ko factor accounts for it.',
      example: { problem: 'Wt = 5000 N, shock factor 2.5. Find peak.',
        steps: ['W_peak = Wt × Ko', 'W_peak = 5000 × 2.5', 'W_peak = 12500 N'], answer: 12500, unit: 'N' } },

    /* AGMA */
    { id: 'ko-factor', name: 'Overload Factor Ko', symbol: 'Ko = 1.0–1.75', formula: 'σ ∝ Ko', unit: '—', cat: 'agma',
      desc: 'Ko accounts for external loads above nominal. Uniform (electric motors): Ko = 1.0–1.25. Light shock: 1.25–1.5. Heavy shock: 1.5–1.75.',
      example: { problem: 'Electric motor → compressor. Choose Ko.',
        steps: ['Source: motor (uniform)', 'Driven: compressor (moderate)', 'Ko = 1.25'], answer: 1.25, unit: '' } },
    { id: 'kv-factor', name: 'Dynamic Factor Kv', symbol: 'Kv = f(v, Q)', formula: 'Kv = ((A + √v) / A)^B', unit: '—', cat: 'agma',
      desc: 'Kv accounts for internal dynamic loads from manufacturing errors and pitch-line velocity. Higher quality → lower Kv. At low speeds Kv ≈ 1; at high speeds with poor quality, Kv > 1.5.',
      example: { problem: 'v = 5 m/s, AGMA Q8. Estimate Kv.',
        steps: ['Q8 → A=61.2, B=0.52', 'Kv = ((61.2 + √1000) / 61.2)^0.52', 'Kv ≈ 1.18'], answer: 1.18, unit: '' } },
    { id: 'km-factor', name: 'Load Distribution Km', symbol: 'Km = 1.0–1.7', formula: 'σ ∝ Km', unit: '—', cat: 'agma',
      desc: 'Km accounts for non-uniform load across the face from shaft deflection, bearing clearance, and alignment. b/d < 0.5 with good mounts: Km ≈ 1.0–1.2. Wide face: 1.5–1.7.',
      example: { problem: 'b = 50 mm, d = 100 mm. Estimate Km.',
        steps: ['b/d = 0.5', 'Straddle-mounted', 'Km ≈ 1.2'], answer: 1.2, unit: '' } },

    /* Materials */
    { id: 'steel-hard', name: 'Hardened Steel', symbol: 'HRC 50–58', formula: 'σ_b = 310 MPa, σ_c = 1100 MPa', unit: 'MPa', cat: 'materials',
      desc: 'Through-hardened steel (4140, 4340) at 50–58 HRC. Allowable bending 250–380 MPa, contact 950–1200 MPa. Most common industrial gear material.',
      example: { problem: 'AGMA bending = 200 MPa on hardened steel.',
        steps: ['σ_allow = 310 MPa', 'FOS = 310/200 = 1.55', 'Safe'], answer: 1.55, unit: '' } },
    { id: 'case-hard', name: 'Case-Hardened Steel', symbol: 'HRC 58–62', formula: 'σ_b = 400 MPa, σ_c = 1500 MPa', unit: 'MPa', cat: 'materials',
      desc: 'Carburized steel: hard outer layer (58–62 HRC) with tough core. Highest strength of any gear material — bending up to 400 MPa, contact up to 1500 MPa. Used in autos and aerospace.',
      example: { problem: 'Contact stress = 1200 MPa on case-hardened.',
        steps: ['σ_c_allow = 1500 MPa', 'FOS = 1500/1200 = 1.25', 'Acceptable'], answer: 1.25, unit: '' } },
    { id: 'cast-iron', name: 'Cast Iron', symbol: 'Class 30–40', formula: 'σ_b = 105 MPa, σ_c = 550 MPa', unit: 'MPa', cat: 'materials',
      desc: 'Cast iron (ASTM 30–40): economical and damps vibration. Bending 70–120 MPa, contact 400–600 MPa. Suits low-speed, low-load drives like change gears.',
      example: { problem: 'Bending stress = 80 MPa on cast iron.',
        steps: ['σ_allow = 105 MPa', 'FOS = 105/80 = 1.31', 'Marginal'], answer: 1.31, unit: '' } }
  ];

  var currentCat = 'fundamentals';
  var currentConcept = null;

  function buildConceptGrid() {
    var grid = $('#concept-grid');
    var filtered = CONCEPTS.filter(function (c) { return c.cat === currentCat; });
    var html = '';
    filtered.forEach(function (c) {
      var activeClass = (currentConcept && currentConcept.id === c.id) ? ' active' : '';
      html += '<button class="is-btn' + activeClass + '" data-id="' + c.id + '">'
            + '<span class="is-btn-name">' + c.name + '</span>'
            + '<span class="is-btn-sym">' + c.symbol + '</span>'
            + '</button>';
    });
    grid.innerHTML = html;
    if (!currentConcept || currentConcept.cat !== currentCat) {
      if (filtered.length > 0) showConcept(filtered[0]);
    }
  }
  function showConcept(c) {
    currentConcept = c;
    $$('#concept-grid .is-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.id === c.id); });
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span>'
      + '<span class="ii-cat-badge">' + c.cat + '</span></div>'
      + '<p class="ii-desc">' + c.desc + '</p>';
    if (c.formula) {
      html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';
    }
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4><p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) { html += '<div class="ex-step"><strong>' + s + '</strong></div>'; });
      html += '</div>';
    }
    show(itemInfo);
    itemInfo.innerHTML = html;
  }
  $('#cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    currentCat = e.target.dataset.cat;
    $$('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.cat === currentCat); });
    currentConcept = null;
    buildConceptGrid();
  });
  $('#concept-grid').addEventListener('click', function (e) {
    var btn = e.target.closest('.is-btn');
    if (!btn) return;
    var c = CONCEPTS.find(function (x) { return x.id === btn.dataset.id; });
    if (c) showConcept(c);
  });

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  var PRACTICE_GEN = [
    function () {
      var wt = randInt(5, 30) * 100;
      var b = randInt(2, 6) * 10;
      var mi = randPick([1, 1.5, 2, 2.5, 3, 4, 5]);
      var n = randPick([15, 18, 20, 25, 30, 35, 40]);
      var y = roundN(lewisY(n), 3);
      var sig = roundN(wt / (b * mi * y), 1);
      return { prompt: 'Wt = ' + wt + ' N, b = ' + b + ' mm, m = ' + mi + ' mm, N = ' + n + ' (Y = ' + y + '). Calculate Lewis bending stress (MPa).', answer: sig, unit: 'MPa', tol: 1,
        steps: ['σ = Wt / (b × m × Y)', 'σ = ' + wt + ' / (' + b + ' × ' + mi + ' × ' + y + ')', 'σ = ' + wt + ' / ' + roundN(b * mi * y, 2), 'σ = ' + sig + ' MPa'] };
    },
    function () {
      var p = randPick([1, 2, 3, 5, 7.5, 10, 15]);
      var d = randPick([40, 50, 60, 80, 100, 120]);
      var n = randInt(5, 30) * 100;
      var v = roundN(Math.PI * d * n / 60000, 3);
      var wt = roundN((p * 1000) / v, 0);
      return { prompt: 'P = ' + p + ' kW, d = ' + d + ' mm, n = ' + n + ' RPM. Calculate Wt (N).', answer: wt, unit: 'N', tol: 5,
        steps: ['v = π × d × n / 60000', 'v = ' + v + ' m/s', 'Wt = (P × 1000) / v', 'Wt = ' + wt + ' N'] };
    },
    function () {
      var mi = randPick([1, 1.5, 2, 2.5, 3, 4, 5, 6]);
      var n = randInt(15, 60);
      var d = roundN(mi * n, 1);
      return { prompt: 'm = ' + mi + ' mm, N = ' + n + '. Calculate pitch diameter (mm).', answer: d, unit: 'mm', tol: 0.5,
        steps: ['d = m × N', 'd = ' + mi + ' × ' + n, 'd = ' + d + ' mm'] };
    },
    function () {
      var np = randInt(15, 30);
      var ng = randInt(30, 80);
      var gr = roundN(ng / np, 2);
      return { prompt: 'Pinion ' + np + ', gear ' + ng + ' teeth. Calculate gear ratio.', answer: gr, unit: ':1', tol: 0.05,
        steps: ['GR = Ng / Np', 'GR = ' + ng + ' / ' + np, 'GR = ' + gr] };
    },
    function () {
      var sigActual = randInt(80, 280);
      var mats = [{ name: 'hardened steel', allow: 310 }, { name: 'case-hardened', allow: 400 }, { name: 'cast iron', allow: 105 }];
      var mat = randPick(mats);
      var fos = roundN(mat.allow / sigActual, 2);
      return { prompt: 'σ = ' + sigActual + ' MPa on ' + mat.name + ' (σ_allow = ' + mat.allow + ' MPa). Find FOS.', answer: fos, unit: '', tol: 0.05,
        steps: ['FOS = σ_allow / σ_actual', 'FOS = ' + mat.allow + ' / ' + sigActual, 'FOS = ' + fos] };
    },
    function () {
      var d = randPick([40, 50, 60, 80, 100, 120, 150]);
      var n = randInt(5, 30) * 100;
      var v = roundN(Math.PI * d * n / 60000, 2);
      return { prompt: 'd = ' + d + ' mm, n = ' + n + ' RPM. Calculate v (m/s).', answer: v, unit: 'm/s', tol: 0.1,
        steps: ['v = π × d × n / 60000', 'v = ' + v + ' m/s'] };
    },
    function () {
      var d = randPick([30, 40, 50, 60, 80, 100, 120]);
      var n = randInt(15, 40);
      var m = roundN(d / n, 2);
      return { prompt: 'd = ' + d + ' mm, N = ' + n + '. Required module (mm)?', answer: m, unit: 'mm', tol: 0.1,
        steps: ['m = d / N', 'm = ' + d + ' / ' + n + ' = ' + m + ' mm'] };
    },
    function () {
      var np = randInt(15, 30);
      var ng = randInt(30, 80);
      var rpmIn = randInt(5, 30) * 100;
      var rpmOut = roundN(rpmIn * np / ng, 1);
      return { prompt: 'Pinion ' + np + ' teeth at ' + rpmIn + ' RPM. Gear ' + ng + ' teeth. Output RPM?', answer: rpmOut, unit: 'rpm', tol: 1,
        steps: ['GR = Ng/Np = ' + roundN(ng/np, 3), 'RPM_out = RPM_in / GR = ' + rpmOut + ' rpm'] };
    },
    function () {
      var wt = randInt(5, 25) * 100;
      var b = randPick([20, 25, 30, 35, 40]);
      var mi = randPick([2, 2.5, 3, 4, 5]);
      var jVal = roundN(0.28 + Math.random() * 0.1, 3);
      var sig = roundN(wt * Ko * Kv * Ks * Km * KB / (b * mi * jVal), 0);
      return { prompt: 'AGMA: Wt = ' + wt + ' N, b = ' + b + ' mm, m = ' + mi + ' mm, J = ' + jVal + '. Ko=1.25, Kv=1.20, Ks=Km=KB=1.0. σ (MPa)?', answer: sig, unit: 'MPa', tol: 5,
        steps: ['σ = Wt×Ko×Kv×Ks×Km×KB / (b×m×J)', 'σ = ' + sig + ' MPa'] };
    },
    function () {
      var teeth = randPick([14, 18, 20, 25, 30, 40, 50, 60, 80, 100]);
      var y = roundN(lewisY(teeth), 3);
      return { prompt: 'Lewis Y for ' + teeth + ' teeth (20-deg PA). 3 d.p.', answer: y, unit: '', tol: 0.005,
        steps: ['From Lewis table:', 'For N = ' + teeth + ': Y = ' + y] };
    },
    function () {
      var mi = randPick([2, 2.5, 3, 4, 5]);
      var np = randInt(15, 30);
      var ng = randInt(30, 60);
      var cd = roundN(mi * (np + ng) / 2, 1);
      return { prompt: 'm = ' + mi + ' mm, Np = ' + np + ', Ng = ' + ng + '. Centre distance (mm)?', answer: cd, unit: 'mm', tol: 0.5,
        steps: ['CD = m×(Np+Ng)/2', 'CD = ' + cd + ' mm'] };
    },
    function () {
      var wt = randInt(5, 30) * 100;
      var v = roundN(1 + Math.random() * 9, 2);
      var p = roundN(wt * v / 1000, 2);
      return { prompt: 'Wt = ' + wt + ' N, v = ' + v + ' m/s. Power (kW)?', answer: p, unit: 'kW', tol: 0.1,
        steps: ['P = Wt × v / 1000', 'P = ' + p + ' kW'] };
    }
  ];

  function newPractice() {
    pLocked = false;
    var gen = PRACTICE_GEN[randInt(0, PRACTICE_GEN.length - 1)];
    var prob = gen();
    pAnswer = prob.answer; pUnit = prob.unit; pSteps = prob.steps;
    $('#pp-prompt').textContent = prob.prompt;
    $('#pp-unit').textContent = pUnit;
    $('#pp-input').value = '';
    $('#pp-input').disabled = false;
    $('#pp-feedback').textContent = '';
    $('#pp-feedback').className = 'feedback';
    hide($('#pp-next')); show($('#pp-check')); hide($('#pp-solution'));
    $('#pp-input').focus();
  }
  function checkPractice() {
    if (pLocked) return;
    var userVal = parseFloat($('#pp-input').value);
    if (isNaN(userVal)) return;
    pLocked = true; pTotal++;
    var tol = Math.max(Math.abs(pAnswer) * 0.05, 0.5);
    var correct = Math.abs(userVal - pAnswer) <= tol;
    if (correct) {
      pScore++;
      $('#pp-feedback').textContent = 'Correct!';
      $('#pp-feedback').className = 'feedback ok';
    } else {
      $('#pp-feedback').textContent = 'Incorrect. Answer: ' + pAnswer + ' ' + pUnit;
      $('#pp-feedback').className = 'feedback err';
    }
    $('#pp-input').disabled = true;
    hide($('#pp-check')); show($('#pp-next'));
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
    var solHtml = '<h4>Solution</h4>';
    pSteps.forEach(function (s) { solHtml += '<div class="sol-step"><strong>' + s + '</strong></div>'; });
    $('#pp-solution').innerHTML = solHtml;
    show($('#pp-solution'));
  }
  $('#pp-check').addEventListener('click', checkPractice);
  $('#pp-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });
  $('#pp-next').addEventListener('click', newPractice);

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  var QUIZ_POOL = [
    { type: 'mcq', prompt: 'The Lewis bending stress equation treats the gear tooth as:', options: ['A cantilever beam', 'A simply supported beam', 'A column under compression', 'A torsion bar'], correct: 0 },
    { type: 'mcq', prompt: 'Which AGMA factor accounts for shock loads from the power source?', options: ['Ko (Overload)', 'Kv (Dynamic)', 'Km (Load distribution)', 'Ks (Size)'], correct: 0 },
    { type: 'mcq', prompt: 'Surface pitting in gears is caused by:', options: ['Repeated bending at tooth root', 'Hertzian contact stress fatigue', 'Corrosion from lubricant', 'Thermal expansion mismatch'], correct: 1 },
    { type: 'mcq', prompt: 'For two gears to mesh properly, they must have the same:', options: ['Number of teeth', 'Module', 'Face width', 'Shaft diameter'], correct: 1 },
    { type: 'mcq', prompt: 'Which gear material has the highest allowable contact stress?', options: ['Cast iron', 'Bronze', 'Case-hardened steel', 'Nylon'], correct: 2 },
    { type: 'mcq', prompt: 'The Lewis form factor Y increases with:', options: ['Higher RPM', 'More teeth', 'Larger module', 'Greater face width'], correct: 1 },
    { type: 'mcq', prompt: 'Helical gears compared to spur gears provide:', options: ['Lower cost', 'Smoother and quieter operation', 'No axial thrust', 'Higher gear ratio per stage'], correct: 1 },
    { type: 'mcq', prompt: 'A safety factor less than 1.0 for bending stress means:', options: ['The gear is over-designed', 'The gear will fail under load', 'The gear needs more teeth', 'The lubricant is inadequate'], correct: 1 },
    { type: 'numeric', prompt: 'Wt = 1500 N, b = 25 mm, m = 3 mm, Y = 0.322. Lewis bending stress (MPa)?', answer: roundN(1500 / (25 * 3 * 0.322), 1), unit: 'MPa', tol: 2 },
    { type: 'numeric', prompt: 'Pitch diameter with module 4 mm and 30 teeth (mm)?', answer: 120, unit: 'mm', tol: 0.5 },
    { type: 'numeric', prompt: 'Pitch line velocity: d = 80 mm, n = 1500 RPM (m/s)?', answer: roundN(Math.PI * 80 * 1500 / 60000, 2), unit: 'm/s', tol: 0.2 },
    { type: 'numeric', prompt: 'Gear ratio: pinion 18 teeth, gear 72 teeth?', answer: 4, unit: ':1', tol: 0.05 },
    { type: 'numeric', prompt: 'FOS if actual bending = 200 MPa, allowable = 310 MPa?', answer: 1.55, unit: '', tol: 0.05 },
    { type: 'numeric', prompt: 'Tangential force: P = 10 kW, v = 5.24 m/s (N)?', answer: roundN(10000 / 5.24, 0), unit: 'N', tol: 10 },
    { type: 'numeric', prompt: 'Centre distance: m = 3 mm, Np = 20, Ng = 50 (mm)?', answer: 105, unit: 'mm', tol: 0.5 }
  ];

  function startQuiz() {
    quizSet = shuffleArr(QUIZ_POOL).slice(0, QUIZ_SIZE);
    quizIdx = 0; quizScore = 0;
    hide(quizResult); show(quizPanel); show(quizBar);
    renderQuizQ();
  }
  function renderQuizQ() {
    var q = quizSet[quizIdx];
    quizLocked = false;
    $('#qbar-num').textContent = quizIdx + 1;
    var html = '<p class="qp-prompt">' + q.prompt + '</p>';
    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, i) { html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>'; });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">'
        + '<input class="qi-input" id="quiz-input" type="number" step="any" placeholder="Answer">'
        + '<span class="qi-unit">' + (q.unit || '') + '</span>'
        + '<button class="btn btn-primary" id="quiz-submit">Submit</button></div>';
    }
    html += '<div style="margin-top:10px;display:flex;align-items:center;gap:10px;">'
      + '<span class="quiz-feedback" id="quiz-fb"></span>'
      + '<button class="btn btn-ghost" id="quiz-next" style="display:none;margin-left:auto;">Next →</button></div>';
    quizPanel.innerHTML = html;
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { if (!quizLocked) submitQuizMCQ(parseInt(btn.dataset.idx, 10)); });
      });
    } else {
      var submitBtn = $('#quiz-submit'); var inputEl = $('#quiz-input');
      if (submitBtn) submitBtn.addEventListener('click', submitQuizNumeric);
      if (inputEl) {
        inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitQuizNumeric(); });
        inputEl.focus();
      }
    }
    var nextBtn = $('#quiz-next'); if (nextBtn) nextBtn.addEventListener('click', nextQuizQ);
  }
  function submitQuizMCQ(idx) {
    if (quizLocked) return;
    quizLocked = true;
    var q = quizSet[quizIdx];
    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b) { b.classList.add('locked'); });
    if (idx === q.correct) {
      quizScore++; btns[idx].classList.add('correct');
      $('#quiz-fb').textContent = 'Correct!'; $('#quiz-fb').className = 'quiz-feedback ok';
      q._correct = true;
    } else {
      btns[idx].classList.add('wrong'); btns[q.correct].classList.add('correct');
      $('#quiz-fb').textContent = 'Incorrect. Answer: ' + q.options[q.correct];
      $('#quiz-fb').className = 'quiz-feedback err';
      q._correct = false;
    }
    show($('#quiz-next'));
  }
  function submitQuizNumeric() {
    if (quizLocked) return;
    var input = $('#quiz-input'); if (!input) return;
    var val = parseFloat(input.value); if (isNaN(val)) return;
    quizLocked = true;
    var q = quizSet[quizIdx];
    var tol = q.tol || Math.max(Math.abs(q.answer) * 0.05, 0.5);
    var correct = Math.abs(val - q.answer) <= tol;
    input.disabled = true;
    var submitBtn = $('#quiz-submit'); if (submitBtn) submitBtn.disabled = true;
    if (correct) { quizScore++; $('#quiz-fb').textContent = 'Correct!'; $('#quiz-fb').className = 'quiz-feedback ok'; q._correct = true; }
    else { $('#quiz-fb').textContent = 'Incorrect. Answer: ' + q.answer + ' ' + (q.unit || ''); $('#quiz-fb').className = 'quiz-feedback err'; q._correct = false; }
    show($('#quiz-next'));
  }
  function nextQuizQ() {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) showQuizResult();
    else renderQuizQ();
  }
  function showQuizResult() {
    hide(quizPanel); hide(quizBar); show(quizResult);
    var pct = quizScore / QUIZ_SIZE;
    var stars, sClass, verdict;
    if (pct === 1) { stars = '★★★'; sClass = 'perfect'; verdict = 'Perfect score!'; }
    else if (pct >= 0.6) { stars = '★★'; sClass = 'good'; verdict = 'Good job!'; }
    else { stars = '★'; sClass = 'poor'; verdict = 'Keep practising.'; }
    var html = '<div class="qr-header">'
      + '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>'
      + '<div class="qr-score-wrap"><span class="qr-score ' + sClass + '">' + quizScore + '/' + QUIZ_SIZE + '</span>'
      + '<div class="qr-verdict">' + verdict + '</div></div></div>';
    html += '<div class="qr-rows">';
    quizSet.forEach(function (q, i) {
      var rowClass = q._correct ? 'ok' : 'err';
      var mark = q._correct ? '✓' : '✗';
      var detail = q.prompt.substring(0, 80) + (q.prompt.length > 80 ? '...' : '');
      html += '<div class="qr-row ' + rowClass + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail"><strong>' + detail + '</strong></span><span class="qr-mark">' + mark + '</span></div>';
    });
    html += '</div><button class="btn btn-primary" id="quiz-retry" style="align-self:center;margin-top:8px;">New Quiz</button>';
    quizResult.innerHTML = html;
    $('#quiz-retry').addEventListener('click', function () { hide(quizResult); show(quizPanel); show(quizBar); startQuiz(); });
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    buildPresetBar();
    rebuildMatTabs();
    wireUnitTabs();
    wireCanvasToggles();
    wireLearnPanels();
    wireHintAutoClose();

    /* Action bar buttons */
    var btnReset  = $('#btn-reset');
    var btnExpCsv = $('#btn-export-csv');
    var btnExpPng = $('#btn-export-png');
    var btnUndo   = $('#btn-undo');
    var btnRedo   = $('#btn-redo');
    var btnCalc   = $('#btn-calc');
    if (btnReset)  btnReset.addEventListener('click', resetAll);
    if (btnExpCsv) btnExpCsv.addEventListener('click', exportCSV);
    if (btnExpPng) btnExpPng.addEventListener('click', exportPNG);
    if (btnUndo)   btnUndo.addEventListener('click', performUndo);
    if (btnRedo)   btnRedo.addEventListener('click', performRedo);
    if (btnCalc)   btnCalc.addEventListener('click', openCalcModal);

    /* Calc modal close + backdrop */
    var calcClose = $('#calc-modal-close');
    if (calcClose) calcClose.addEventListener('click', closeCalcModal);
    var calcModalEl = $('#calc-modal');
    if (calcModalEl) calcModalEl.addEventListener('click', function (e) { if (e.target === calcModalEl) closeCalcModal(); });

    /* Custom material modal */
    var cmClose = $('#cm-close');
    var cmCancel = $('#cm-cancel');
    var cmSubmit = $('#cm-submit');
    var cmModal = $('#custom-mat-modal');
    if (cmClose)  cmClose.addEventListener('click', closeCustomMatModal);
    if (cmCancel) cmCancel.addEventListener('click', closeCustomMatModal);
    if (cmSubmit) cmSubmit.addEventListener('click', submitCustomMat);
    if (cmModal)  cmModal.addEventListener('click', function (e) { if (e.target === cmModal) closeCustomMatModal(); });

    /* DPR-aware resize */
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeCanvas).observe(canvas);

    syncSimUI(); syncToggleUI(); syncUnitUI();
    updateReadouts();
    startAnim();
  }

  init();
})();
