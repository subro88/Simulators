(function () {
  'use strict';

  /* ================================================================
     ENGINEERING DATA
     ================================================================ */

  /* Electrode (all-weld-metal) minimum properties:
     E70xx per AWS A5.1 (E7018: 70 ksi UTS / 58 ksi yield),
     E90xx per AWS A5.5 (E9018: 90 ksi UTS / 77 ksi yield),
     E308 per AWS A5.4, ER4043 as-welded typical. */
  var MATERIALS = {
    e70:    { name: 'E70xx (Mild Steel)',     uts: 483,  sy: 400, color: '#42a5f5' },
    e90:    { name: 'E90xx (High Strength)',   uts: 621,  sy: 531, color: '#66bb6a' },
    e308:   { name: 'E308 (Stainless Steel)',  uts: 586,  sy: 379, color: '#ab47bc' },
    er4043: { name: 'ER4043 (Aluminum)',       uts: 186,  sy: 124, color: '#ffb74d' }
  };

  /* Minimum fillet weld sizes per AWS D1.1 (approximate) */
  var MIN_FILLET = [
    { maxPlate: 6,  minLeg: 3 },
    { maxPlate: 13, minLeg: 5 },
    { maxPlate: 19, minLeg: 6 },
    { maxPlate: 50, minLeg: 8 }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */

  var canvas  = document.getElementById('sim-canvas');
  var ctx     = canvas.getContext('2d');

  /* Sliders */
  var legSlider       = document.getElementById('leg-slider');
  var lengthSlider    = document.getElementById('length-slider');
  var thicknessSlider = document.getElementById('thickness-slider');
  var nweldSlider     = document.getElementById('nweld-slider');
  var loadSlider      = document.getElementById('load-slider');

  /* Stepper number inputs (mirror the sliders, unit-aware) */
  var legInput       = document.getElementById('leg-input');
  var lengthInput    = document.getElementById('length-input');
  var thicknessInput = document.getElementById('thickness-input');
  var nweldInput     = document.getElementById('nweld-input');
  var loadInput      = document.getElementById('load-input');

  /* Slider <-> stepper-input map. `unit` selects how the SI slider value is
     displayed/parsed in the active unit system. */
  var STEP_MAP = [
    { key: 'leg',       slider: legSlider,       input: legInput,       unit: 'len',  unitEl: 'leg-unit' },
    { key: 'length',    slider: lengthSlider,    input: lengthInput,    unit: 'len',  unitEl: 'length-unit' },
    { key: 'thickness', slider: thicknessSlider, input: thicknessInput, unit: 'len',  unitEl: 'thickness-unit' },
    { key: 'nweld',     slider: nweldSlider,     input: nweldInput,     unit: 'count', unitEl: null },
    { key: 'load',      slider: loadSlider,      input: loadInput,      unit: 'load', unitEl: 'load-unit' }
  ];

  function stepToDisplay(m, siVal) {
    if (m.unit === 'len')  return dLen(siVal);
    if (m.unit === 'load') return dLoad(siVal);
    return siVal; /* count */
  }
  function stepToSI(m, dispVal) {
    if (m.unit === 'len')  return imperial ? dispVal / CONV.len  : dispVal;
    if (m.unit === 'load') return imperial ? dispVal / CONV.load : dispVal;
    return dispVal;
  }
  function stepDigits(m) {
    if (m.unit === 'count') return 0;
    if (m.unit === 'load')  return dpLoad();
    return dpLen();
  }

  /* Push current slider (SI) values into the stepper inputs + unit labels */
  function syncSteppers() {
    STEP_MAP.forEach(function (m) {
      var si = +m.slider.value;
      if (document.activeElement !== m.input) {
        m.input.value = stepToDisplay(m, si).toFixed(stepDigits(m));
      }
      if (m.unitEl) {
        var el = document.getElementById(m.unitEl);
        if (el) el.textContent = (m.unit === 'load') ? uLoadLabel() : uLenLabel();
      }
    });
  }

  /* Readouts */
  var rThroat  = document.getElementById('r-throat');
  var rArea    = document.getElementById('r-area');
  var rStress  = document.getElementById('r-stress');
  var rAllow   = document.getElementById('r-allow');
  var rFos     = document.getElementById('r-fos');
  var rVerdict = document.getElementById('r-verdict');
  var rMaxLoad = document.getElementById('r-maxload');
  var rEffLen  = document.getElementById('r-efflen');

  /* Load bar */
  var loadBarFill   = document.getElementById('load-bar-fill');
  var loadBarMarker = document.getElementById('load-bar-marker');

  /* Panels */
  var simPanel      = document.getElementById('sim-panel');
  var catRow        = document.getElementById('cat-row');
  var itemSelector  = document.getElementById('item-selector');
  var itemInfo      = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar   = document.getElementById('practice-bar');
  var quizPanel     = document.getElementById('quiz-panel');
  var quizBar       = document.getElementById('quiz-bar');
  var quizResult    = document.getElementById('quiz-result');

  /* Practice */
  var ppPrompt   = document.getElementById('pp-prompt');
  var ppInput    = document.getElementById('pp-input');
  var ppUnit     = document.getElementById('pp-unit');
  var ppCheck    = document.getElementById('pp-check');
  var ppShow     = document.getElementById('pp-show');
  var ppNext     = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScore  = document.getElementById('pbar-score-val');

  /* Quiz */
  var qbarNum = document.getElementById('qbar-num');

  var runSimBtn = document.getElementById('run-sim-btn');

  /* ================================================================
     STATE
     ================================================================ */

  var mode      = 'simulate';
  var jointType = 'fillet-transverse';
  var loadType  = 'tension';
  var matKey    = 'e70';
  var animPhase = 0;
  var animId    = null;
  var simRan    = false;
  var imperial  = false;

  /* Canvas feature toggles (default ON) */
  var showEquation = true;
  var showStress   = true;
  var showDims     = true;

  /* Rolling-output state for the canvas equation (0..1) */
  var forceScale = 0;

  /* ================================================================
     UNIT SYSTEM  (internal SI always; display-only conversion)
     ================================================================ */

  var CONV = {
    len:    0.0393701,  /* mm  -> in   */
    area:   0.00155000, /* mm2 -> in2  */
    load:   0.2248089,  /* kN  -> kip  */
    stress: 0.1450377   /* MPa -> ksi  */
  };

  function uLenLabel()    { return imperial ? 'in'  : 'mm';  }
  function uAreaLabel()   { return imperial ? 'in²' : 'mm²'; }
  function uLoadLabel()   { return imperial ? 'kip' : 'kN';  }
  function uStressLabel() { return imperial ? 'ksi' : 'MPa'; }

  function dLen(mm)    { return imperial ? mm * CONV.len    : mm; }
  function dArea(mm2)  { return imperial ? mm2 * CONV.area  : mm2; }
  function dLoad(kN)   { return imperial ? kN * CONV.load   : kN; }
  function dStress(MPa){ return imperial ? MPa * CONV.stress: MPa; }

  /* digits per quantity for the active unit system */
  function dpLen()    { return imperial ? 3 : 1; }
  function dpArea()   { return imperial ? 3 : 1; }
  function dpLoad()   { return imperial ? 2 : 1; }
  function dpStress() { return imperial ? 2 : 1; }

  /* formatted "value unit" strings for canvas/readouts */
  function fLen(mm, d)    { return dLen(mm).toFixed(d == null ? dpLen() : d) + ' ' + uLenLabel(); }
  function fLoad(kN, d)   { return dLoad(kN).toFixed(d == null ? dpLoad() : d) + ' ' + uLoadLabel(); }
  function fStress(MPa, d){ return dStress(MPa).toFixed(d == null ? dpStress() : d) + ' ' + uStressLabel(); }

  /* Practice state */
  var pCorrect = 0, pTotal = 0, pAnswer = 0, pChecked = false;

  /* Quiz state */
  var QUIZ_SIZE  = 5;
  var quizSet    = [];
  var quizIdx    = 0;
  var quizScore  = 0;
  var quizLocked = false;

  /* Explore state */
  var exploreCat     = 'fundamentals';
  var exploreIdx     = 0;

  /* ================================================================
     CALCULATIONS
     ================================================================ */

  function getParams() {
    var leg    = +legSlider.value;
    var L      = +lengthSlider.value;
    var t_plate = +thicknessSlider.value;
    var nWelds = +nweldSlider.value;
    var P      = +loadSlider.value; /* kN */
    return { leg: leg, L: L, t_plate: t_plate, nWelds: nWelds, P: P };
  }

  /* Minimum AWS D1.1 fillet leg for the joined plate (mm); 0 if not a fillet */
  function minFilletLeg(t_plate) {
    for (var i = 0; i < MIN_FILLET.length; i++) {
      if (t_plate <= MIN_FILLET[i].maxPlate) return MIN_FILLET[i].minLeg;
    }
    return MIN_FILLET[MIN_FILLET.length - 1].minLeg;
  }

  function calcWeld(p) {
    var mat = MATERIALS[matKey];
    var throat, effLen, area, actualStress, allowStress, fos, maxLoad;
    var isFillet = jointType.indexOf('fillet') === 0 || jointType === 'lap-joint';
    /* A butt weld is a single groove weld — nWelds does not apply (B3). */
    var nEff = isFillet ? p.nWelds : 1;
    var stressSym = 'τ';   /* symbol shown for the governing stress */
    /* The "Fillet Combined" joint IS combined loading by definition —
       it always analyses via von Mises, whatever the load-type tab says. */
    var effLoad = (jointType === 'fillet-combined') ? 'combined' : loadType;

    if (isFillet) {
      throat = p.leg * 0.707;
      effLen = Math.max(p.L - 2 * p.leg, p.leg); /* effective length */
      area   = throat * effLen * nEff;
      /* Fillet welds are governed by shear across the throat regardless of
         applied direction → allowable = 0.3 × UTS (AWS D1.1). */
      allowStress = 0.3 * mat.uts;
    } else {
      /* Butt weld */
      throat = (jointType === 'butt-full') ? p.t_plate : p.t_plate * 0.5;
      effLen = p.L;
      area   = throat * effLen * nEff;
      /* Allowable depends on load type for groove welds (B1):
         tension 0.6·Sy, shear 0.4·Sy, combined uses tension allowable. */
      if (effLoad === 'shear') allowStress = 0.4 * mat.sy;
      else                     allowStress = 0.6 * mat.sy;
    }

    var P_N = p.P * 1000; /* convert kN to N */

    /* Combined loading resolves P into 60% normal / 40% shear, so
       σ_eq = kComb·P/A with kComb = √(0.6² + 3·0.4²) ≈ 0.9165. */
    var kComb = (effLoad === 'combined') ? Math.sqrt(0.6 * 0.6 + 3 * 0.4 * 0.4) : 1;

    if (effLoad === 'combined') {
      var sigma = (P_N * 0.6) / area;
      var tau   = (P_N * 0.4) / area;
      actualStress = Math.sqrt(sigma * sigma + 3 * tau * tau);
      stressSym = 'σ_eq';
    } else {
      actualStress = P_N / area;
      /* Fillet always reports throat shear; butt-tension reports normal σ. */
      stressSym = (!isFillet && effLoad === 'tension') ? 'σ' : 'τ';
    }

    fos     = actualStress > 0 ? allowStress / actualStress : Infinity;
    /* Max load must be consistent with FOS: at P = maxLoad, FOS = 1.0.
       Under combined loading that means dividing by kComb. */
    maxLoad = (allowStress * area) / (1000 * kComb); /* kN */

    /* Min-fillet check (B2) + max-fillet rule (leg ≤ t − 2 mm for t > 6) */
    var minLeg = isFillet ? minFilletLeg(p.t_plate) : 0;
    var belowMin = isFillet && p.leg < minLeg;
    var maxLegAllowed = (p.t_plate > 6) ? p.t_plate - 2 : p.t_plate;
    var aboveMax = isFillet && p.leg > maxLegAllowed;

    return {
      throat: throat,
      effLen: effLen,
      area: area,
      actualStress: actualStress,
      allowStress: allowStress,
      fos: fos,
      maxLoad: maxLoad,
      pass: fos >= 1.0,
      isFillet: isFillet,
      nEff: nEff,
      stressSym: stressSym,
      minLeg: minLeg,
      belowMin: belowMin,
      maxLegAllowed: maxLegAllowed,
      aboveMax: aboveMax,
      effLoad: effLoad
    };
  }

  function updateReadouts() {
    var p = getParams();
    var r = calcWeld(p);

    syncSteppers(p);

    rThroat.textContent  = dLen(r.throat).toFixed(dpLen());
    rArea.textContent    = dArea(r.area).toFixed(dpArea());
    rStress.textContent  = dStress(r.actualStress).toFixed(dpStress());
    rAllow.textContent   = dStress(r.allowStress).toFixed(dpStress());
    rFos.textContent     = isFinite(r.fos) ? r.fos.toFixed(2) : '∞';
    rMaxLoad.textContent = dLoad(r.maxLoad).toFixed(dpLoad());
    rEffLen.textContent  = dLen(r.effLen).toFixed(dpLen());

    /* Stress card label reflects the governing component */
    var ls = document.getElementById('l-stress');
    if (ls) ls.textContent = (r.stressSym === 'σ') ? 'Tensile Stress'
                           : (r.stressSym === 'σ_eq') ? 'Equivalent Stress'
                           : 'Throat Shear';

    if (r.pass) {
      rVerdict.textContent = 'PASS';
      rVerdict.style.color = '#3ddc84';
    } else {
      rVerdict.textContent = 'FAIL';
      rVerdict.style.color = '#ff5555';
    }

    /* Min / max fillet-size advisories (AWS D1.1) */
    var warn = document.getElementById('weld-warn');
    if (warn) {
      var msgs = [];
      if (r.belowMin) {
        msgs.push('⚠ Leg ' + fLen(p.leg) + ' is below the AWS D1.1 minimum of '
                + fLen(r.minLeg) + ' for a ' + fLen(p.t_plate) + ' plate.');
      }
      if (r.aboveMax) {
        msgs.push('⚠ Leg ' + fLen(p.leg) + ' exceeds the maximum of ' + fLen(r.maxLegAllowed)
                + ' for a ' + fLen(p.t_plate) + ' plate (leg ≤ t − 2 mm above 6 mm) — risk of melting the plate edge.');
      }
      warn.style.display = msgs.length ? '' : 'none';
      warn.innerHTML = msgs.join('<br>');
    }

    /* Update load bar */
    var ratio = (r.maxLoad > 0) ? Math.min(p.P / r.maxLoad, 1.0) : 1.0;
    loadBarFill.style.width = ((1 - ratio) * 100) + '%';
    loadBarMarker.style.left = (ratio * 100) + '%';

    updateLearnPanels(p, r);
    draw();
  }

  /* Reset rolling canvas output after any input change (no-op mid-run) */
  function invalidateOutput() {
    if (animId) return;
    forceScale = 0;
  }

  /* Refresh the readout-card unit suffixes for the active unit system */
  function updateUnitLabels() {
    function set(id, txt) { var e = document.getElementById(id); if (e) e.innerHTML = txt; }
    set('u-throat',  ' ' + uLenLabel());
    set('u-area',    ' ' + (imperial ? 'in&sup2;' : 'mm&sup2;'));
    set('u-stress',  ' ' + uStressLabel());
    set('u-allow',   ' ' + uStressLabel());
    set('u-maxload', ' ' + uLoadLabel());
    set('u-efflen',  ' ' + uLenLabel());
  }

  /* ── Live-equations + What-if coach (KaTeX) ──────────────────── */
  var _learnCache = { eq: '', coach: '' };

  function updateLearnPanels(p, r) {
    var eq = document.getElementById('lp-eq-body');
    if (eq) {
      var html = '';
      if (r.isFillet) {
        html += '<div class="eq-line">\\[ t = 0.707\\,a \\qquad L_{e} = L - 2a \\qquad A = t\\,L_{e}\\,n \\]</div>';
        html += '<div class="eq-line">\\( t = 0.707 \\times ' + rN(p.leg, 2) + ' = ' + rN(r.throat, 2) + '\\;\\mathrm{mm} \\)</div>';
        html += '<div class="eq-line">\\( A = ' + rN(r.throat, 2) + ' \\times ' + rN(r.effLen, 0) + ' \\times ' + r.nEff
              + ' = ' + rN(r.area, 0) + '\\;\\mathrm{mm^2} \\)</div>';
      } else {
        html += '<div class="eq-line">\\[ t_{e} = ' + (jointType === 'butt-full' ? 't_{plate}' : '0.5\\,t_{plate}')
              + ' \\qquad A = t_{e}\\,L \\]</div>';
        html += '<div class="eq-line">\\( A = ' + rN(r.throat, 1) + ' \\times ' + rN(r.effLen, 0)
              + ' = ' + rN(r.area, 0) + '\\;\\mathrm{mm^2} \\)</div>';
      }
      var symTex = (r.stressSym === 'σ') ? '\\sigma' : (r.stressSym === 'σ_eq') ? '\\sigma_{eq}' : '\\tau';
      if (r.stressSym === 'σ_eq') {
        html += '<div class="eq-line">\\[ \\sigma_{eq} = \\sqrt{\\sigma^2 + 3\\tau^2} = ' + rN(r.actualStress, 1) + '\\;\\mathrm{MPa} \\]</div>';
      } else {
        html += '<div class="eq-line">\\[ ' + symTex + ' = \\dfrac{P}{A} = \\dfrac{' + rN(p.P * 1000, 0) + '}{' + rN(r.area, 0)
              + '} = ' + rN(r.actualStress, 1) + '\\;\\mathrm{MPa} \\]</div>';
      }
      html += '<div class="eq-line">\\( FOS = \\dfrac{' + rN(r.allowStress, 1) + '}{' + rN(r.actualStress, 1) + '} = '
            + (isFinite(r.fos) ? rN(r.fos, 2) : '\\infty') + ' \\Rightarrow \\mathbf{' + (r.pass ? 'PASS' : 'FAIL') + '} \\)</div>';
      if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }
    }

    var coach = document.getElementById('lp-coach-body');
    if (coach) {
      var tips = [];
      if (!r.pass) {
        var needA = (p.P * 1000) / r.allowStress;
        tips.push('Overstressed. To pass at this load you need about <strong>' + rN(needA, 0)
          + ' mm²</strong> of throat area (currently ' + rN(r.area, 0) + ' mm²) — increase leg size, length, or weld count.');
      } else if (r.fos < 1.5) {
        tips.push('Passes but the margin is thin (FOS ' + rN(r.fos, 2) + '). Most design codes target FOS 1.5–3.0.');
      } else {
        tips.push('Healthy margin — FOS ' + rN(r.fos, 2) + '. You could carry up to <strong>' + fLoad(r.maxLoad) + '</strong> before failure.');
      }
      if (r.belowMin) tips.push('Leg size is below the AWS D1.1 minimum for this plate — risk of fast cooling and cracking.');
      if (r.aboveMax) tips.push('Leg size exceeds the plate-edge maximum (t − 2 mm) — reduce the leg or use a thicker plate.');
      if (r.isFillet && r.nEff === 1) tips.push('A single fillet loads the joint eccentrically; a second weld (double fillet) halves the stress.');
      if (jointType === 'fillet-transverse') tips.push('Transverse fillets test ~30% stronger than parallel ones; this tool conservatively applies the same allowable to both, as most codes do unless the AWS D1.1 directional factor (up to 1.5×) is explicitly invoked.');
      var ch = tips.map(function (t) { return '<div class="coach-line">• ' + t + '</div>'; }).join('');
      if (ch !== _learnCache.coach) { coach.innerHTML = ch; _learnCache.coach = ch; }
    }
  }

  function rN(x, digits) {
    if (!isFinite(x)) return String(x);
    var pw = Math.pow(10, digits || 0);
    return (Math.round(x * pw) / pw).toString();
  }

  /* ================================================================
     CANVAS DRAWING
     ================================================================ */

  function resizeCanvas() {
    /* Fallback width when the parent has no layout width yet (init before paint),
       so draw() never receives non-positive dimensions. ResizeObserver corrects later. */
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max((canvas.parentElement.clientWidth || 0) - 16, 300);
    var h = Math.min(w * 0.58, 460);
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
    draw();
  }

  /* ── Professional drawing helpers ───────────────────────────── */

  /* Metallic steel gradient for a plate body (vertical sheen). */
  function steelGrad(y0, y1) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0,    '#3a4565');
    g.addColorStop(0.18, '#454f72');
    g.addColorStop(0.5,  '#333b58');
    g.addColorStop(0.82, '#2a3150');
    g.addColorStop(1,    '#222840');
    return g;
  }

  /* Section hatching (engineering "cut material" convention) inside a clip. */
  function hatchPath(buildPath, x0, y0, x1, y1, spacing, color) {
    ctx.save();
    ctx.beginPath(); buildPath(); ctx.clip();
    ctx.strokeStyle = color || 'rgba(150,165,200,0.16)';
    ctx.lineWidth = 1;
    var step = spacing || 8;
    for (var d = -(y1 - y0); d < (x1 - x0) + (y1 - y0); d += step) {
      ctx.beginPath();
      ctx.moveTo(x0 + d, y0);
      ctx.lineTo(x0 + d + (y1 - y0), y1);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Text with a dark halo so it stays legible over any fill. */
  function haloText(txt, x, y, font, color, align) {
    ctx.save();
    ctx.font = font; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 3.2;
    ctx.strokeStyle = 'rgba(8,11,20,0.92)';
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = color; ctx.fillText(txt, x, y);
    ctx.restore();
  }

  /* Engineering dimension line: extension lines + double arrowheads + value. */
  function dimLineH(x1, x2, y, txt, color) {
    color = color || '#9fb0d0';
    var ext = 5;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
    /* extension ticks */
    ctx.beginPath(); ctx.moveTo(x1, y - ext); ctx.lineTo(x1, y + ext);
    ctx.moveTo(x2, y - ext); ctx.lineTo(x2, y + ext); ctx.stroke();
    /* dimension line */
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    arrowTip(x1, y, 0);  arrowTip(x2, y, Math.PI);
    ctx.restore();
    haloText(txt, (x1 + x2) / 2, y - 9, '11px "JetBrains Mono","Courier New",monospace', '#e6edf6');
  }
  function dimLineV(y1, y2, x, txt, color) {
    color = color || '#9fb0d0';
    var ext = 5;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - ext, y1); ctx.lineTo(x + ext, y1);
    ctx.moveTo(x - ext, y2); ctx.lineTo(x + ext, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    arrowTip(x, y1, Math.PI / 2); arrowTip(x, y2, -Math.PI / 2);
    ctx.restore();
    haloText(txt, x, (y1 + y2) / 2, '11px "JetBrains Mono","Courier New",monospace', '#e6edf6');
  }
  /* small filled arrowhead pointing along `ang` (0 = +x) */
  function arrowTip(x, y, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -3); ctx.lineTo(7, 3);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* Stress ratio 0..>1 → two-stop gradient colours for the bead fill. */
  function stressShades(ratio) {
    if (!showStress) return ['#6c7ba0', '#4a567a'];
    if (ratio < 0.6)  return ['#5ee89a', '#27a866'];
    if (ratio < 1.0)  return ['#ffd765', '#e0a020'];
    return ['#ff7a7a', '#d23232'];
  }

  /* Colour scale legend (green→amber→red) with a marker at the current ratio. */
  function drawStressLegend(x, y, w, ratio) {
    if (!showStress) return;
    var hgt = 9;
    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#3ddc84'); g.addColorStop(0.55, '#f5c842'); g.addColorStop(1, '#ff5555');
    ctx.fillStyle = g; roundRect(ctx, x, y, w, hgt, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(150,165,200,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    var mx = x + Math.max(0, Math.min(1, ratio / 1.0)) * w;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(mx, y - 3); ctx.lineTo(mx - 4, y - 9); ctx.lineTo(mx + 4, y - 9); ctx.closePath(); ctx.fill();
    haloText('σ / σallow', x + w / 2, y + hgt + 8, '9px "Segoe UI",sans-serif', '#8b9dc3');
    haloText('0', x, y + hgt + 8, '8px "JetBrains Mono",monospace', '#8b9dc3');
    haloText('1.0', x + w, y + hgt + 8, '8px "JetBrains Mono",monospace', '#8b9dc3');
  }

  /* Weld ripple arcs along a bead (side-view realism). */
  function weldRipples(x0, x1, y, amp, n, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    var span = x1 - x0, stepc = span / n;
    for (var i = 0; i <= n; i++) {
      var rx = x0 + i * stepc;
      ctx.beginPath();
      ctx.arc(rx, y, Math.max(amp, 1.5), Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    var W = canvas.width / (window.devicePixelRatio || 1);
    var H = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, W, H);

    /* Backdrop: deep vignette + engineering grid */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0f1422'); bg.addColorStop(1, '#0a0e18');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = 'rgba(120,140,180,0.05)'; ctx.lineWidth = 1;
    for (var gx = 24; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 24; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    ctx.restore();

    var p = getParams();
    var r = calcWeld(p);
    var stressRatio = r.allowStress > 0 ? r.actualStress / r.allowStress : 2.0;

    /* Two framed panels: left = pictorial view, right = cross-section */
    var pad = 12, gapMid = 14;
    var topPad = 30;
    var panelY = topPad, panelH = H - topPad - 14;
    var leftX = pad, leftW = W * 0.5 - pad - gapMid / 2;
    var rightX = W * 0.5 + gapMid / 2, rightW = W - rightX - pad;

    function panel(x, w, title) {
      ctx.save();
      ctx.fillStyle = 'rgba(20,26,44,0.55)';
      ctx.strokeStyle = 'rgba(139,157,195,0.18)'; ctx.lineWidth = 1;
      roundRect(ctx, x, panelY, w, panelH, 10); ctx.fill(); ctx.stroke();
      ctx.restore();
      /* title chip */
      ctx.save();
      ctx.font = '600 10px "Segoe UI",sans-serif'; ctx.textAlign = 'left';
      var tw = ctx.measureText(title).width + 16;
      ctx.fillStyle = 'rgba(255,23,68,0.16)';
      roundRect(ctx, x + 10, panelY - 9, tw, 18, 9); ctx.fill();
      haloText(title, x + 10 + tw / 2, panelY, '600 10px "Segoe UI",sans-serif', '#ff8a9b');
      ctx.restore();
    }

    var isFillet = jointType.indexOf('fillet') === 0 || jointType === 'lap-joint';
    panel(leftX, leftW, isFillet ? 'PICTORIAL VIEW' : 'ELEVATION');
    panel(rightX, rightW, 'CROSS-SECTION (A–A)');

    if (isFillet) {
      drawFilletSideView(ctx, leftX + 14, panelY + 14, leftW - 28, panelH - 28, p, r, stressRatio);
      drawFilletCrossSection(ctx, rightX + 14, panelY + 14, rightW - 28, panelH - 28, p, r, stressRatio);
    } else {
      drawButtSideView(ctx, leftX + 14, panelY + 14, leftW - 28, panelH - 28, p, r, stressRatio);
      drawButtCrossSection(ctx, rightX + 14, panelY + 14, rightW - 28, panelH - 28, p, r, stressRatio);
    }

    /* Stress legend (bottom-left of cross-section panel) */
    drawStressLegend(rightX + 16, panelY + panelH - 26, Math.min(rightW - 32, 120), stressRatio);

    /* Classical equation overlay with rolling output */
    if (showEquation) drawEquation(W, H, p, r);

    /* Verdict overlay if simulation ran */
    if (simRan) drawVerdictBadge(ctx, W, H, r);
  }

  /* Unicode-styled equation banner at the canvas top with a rolling result. */
  function drawEquation(W, H, p, r) {
    var stale = forceScale < 0.001 && !animId && !simRan;
    var roll  = simRan ? 1 : Math.max(0, Math.min(1, forceScale));
    var lhs, rhsVal;
    if (r.stressSym === 'σ_eq') {
      lhs = 'σeq = √(σ² + 3τ²)';
    } else if (r.stressSym === 'σ') {
      lhs = 'σ = P / (tₑ·L)';
    } else if (r.isFillet) {
      lhs = 'τ = P / (0.707·a·Lₑ·n)';
    } else {
      lhs = 'τ = P / (tₑ·L)';   /* groove weld in shear */
    }
    rhsVal = stale ? '—' : fStress(r.actualStress * roll);

    var cx = W / 2, y = H - 40;
    var lhsFont = 'italic 600 14px "Cambria Math","Times New Roman",serif';
    var valFont = 'bold 14px "JetBrains Mono","Courier New",monospace';
    var sep = '  →  ';

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = lhsFont; var wLhs = ctx.measureText(lhs + sep).width;
    ctx.font = valFont; var wVal = ctx.measureText(rhsVal).width;
    var total = wLhs + wVal;
    var x = cx - total / 2;

    /* background pill */
    ctx.fillStyle = 'rgba(13,17,30,0.78)';
    roundRect(ctx, x - 12, y - 13, total + 24, 26, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139,157,195,0.30)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = lhsFont; ctx.fillStyle = '#cdd6ee'; ctx.fillText(lhs + sep, x, y);
    ctx.font = valFont; ctx.fillStyle = stale ? '#8b9dc3' : (r.pass ? '#3ddc84' : '#ff5555');
    ctx.fillText(rhsVal, x + wLhs, y);
    ctx.restore();
  }

  /* LEFT PANEL — length view: weld bead running along the joint, showing
     total length L, the two end craters, and the effective length Le. */
  function drawFilletSideView(ctx, ox, oy, w, h, p, r, ratio) {
    var cx = ox + w / 2;
    var jy = oy + h * 0.52;              /* joint / fusion line */
    var beadW = w * 0.84;
    var x0 = cx - beadW / 2, x1 = cx + beadW / 2;

    /* Parent plate face below the bead (steel sheen) */
    var plTop = jy + 2, plBot = oy + h - 34;
    ctx.fillStyle = steelGrad(plTop, plBot);
    ctx.fillRect(ox + 4, plTop, w - 8, plBot - plTop);
    ctx.strokeStyle = '#5566a0'; ctx.lineWidth = 1.2;
    ctx.strokeRect(ox + 4, plTop, w - 8, plBot - plTop);

    /* Bead height scaled to leg */
    var bh = Math.max(7, Math.min(h * 0.2, 5 + p.leg * 0.9));
    var by = jy - bh;
    var craterFrac = Math.min(p.leg / p.L, 0.18);
    var craterPx = beadW * craterFrac;
    var sh = stressShades(ratio);

    /* Bead body as a capsule with convex top */
    function beadPath() {
      ctx.beginPath();
      ctx.moveTo(x0, jy);
      ctx.bezierCurveTo(x0 + beadW * 0.04, by, x1 - beadW * 0.04, by, x1, jy);
      ctx.closePath();
    }
    var bg = ctx.createLinearGradient(0, by, 0, jy);
    bg.addColorStop(0, sh[0]); bg.addColorStop(1, sh[1]);
    ctx.save(); beadPath(); ctx.fillStyle = bg; ctx.fill();
    /* top sheen */
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(x0, by, beadW, bh * 0.35);
    ctx.restore();
    beadPath(); ctx.strokeStyle = sh[1]; ctx.lineWidth = 1.4; ctx.stroke();

    /* Ripple arcs across the effective (non-crater) length */
    weldRipples(x0 + craterPx + 4, x1 - craterPx - 4, by + bh * 0.55,
                Math.max(bh * 0.32, 2), Math.max(6, Math.round(beadW / 16)), 'rgba(10,14,24,0.55)');

    /* Crater end zones (hatched, reduced strength) */
    [[x0, x0 + craterPx], [x1 - craterPx, x1]].forEach(function (cz) {
      hatchPath(function () { ctx.rect(cz[0], by, cz[1] - cz[0], bh + 4); },
                cz[0], by, cz[1], by + bh + 4, 5, 'rgba(255,90,90,0.4)');
    });

    /* Load arrow (glow) — direction is a physics claim: transverse fillets
       pull PERPENDICULAR to the bead, parallel fillets load ALONG it,
       combined pulls at an angle. */
    var ay = oy + 8;
    var dirMode = (jointType === 'fillet-parallel') ? 'along'
                : (r.effLoad === 'combined') ? 'diag' : 'perp';
    ctx.save();
    ctx.shadowColor = 'rgba(255,23,68,0.7)'; ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ff5b73'; ctx.fillStyle = '#ff5b73'; ctx.lineWidth = 3;
    if (dirMode === 'along') {
      /* Load along the weld axis + opposite reaction at the other end
         (kept at bead mid-height, clear of the Le dimension line) */
      var aly = by + Math.max(bh * 0.55, 6);
      ctx.beginPath(); ctx.moveTo(x1 - 20, aly); ctx.lineTo(x1 + 16, aly); ctx.stroke();
      arrowTip(x1 + 16, aly, 0);
      ctx.beginPath(); ctx.moveTo(x0 + 20, aly); ctx.lineTo(x0 - 16, aly); ctx.stroke();
      arrowTip(x0 - 16, aly, Math.PI);
      ctx.restore();
      haloText('P = ' + fLoad(p.P) + ' (along weld)', cx, ay, 'bold 12px "Segoe UI",sans-serif', '#ff8a9b');
    } else if (dirMode === 'diag') {
      var ex = cx + 42, ey = ay + 14;
      ctx.beginPath(); ctx.moveTo(cx, by - 6); ctx.lineTo(ex, ey); ctx.stroke();
      arrowTip(cx, by - 6, Math.atan2(by - 6 - ey, cx - ex));
      ctx.restore();
      haloText('P = ' + fLoad(p.P) + ' (combined)', cx, ay, 'bold 12px "Segoe UI",sans-serif', '#ff8a9b');
    } else {
      ctx.beginPath(); ctx.moveTo(cx, by - 6); ctx.lineTo(cx, ay + 6); ctx.stroke();
      arrowTip(cx, by - 6, Math.PI / 2);
      ctx.restore();
      haloText('P = ' + fLoad(p.P), cx, ay, 'bold 12px "Segoe UI",sans-serif', '#ff8a9b');
    }

    if (showDims) {
      /* Effective length (between crater inner edges) and total length */
      dimLineH(x0 + craterPx, x1 - craterPx, by - 8, 'Le = ' + fLen(r.effLen), '#3ddc84');
      dimLineH(x0, x1, plBot + 16, 'L = ' + fLen(p.L), '#9fb0d0');
      haloText('weld bead', cx, jy + 12, '9px "Segoe UI",sans-serif', '#8b9dc3');
    }
  }

  /* RIGHT PANEL \u2014 true cross-section: leg, throat (failure plane), 45\u00B0,
     plate thickness, all to a single px-per-mm scale. */
  function drawFilletCrossSection(ctx, ox, oy, w, h, p, r, ratio) {
    var twoSided = (p.nWelds >= 2 || jointType === 'lap-joint');
    var cx = ox + w * (twoSided ? 0.5 : 0.62);
    var baseTop = oy + h * 0.6;

    /* Unified scale so leg + plate are mutually proportional and fit */
    var maxDim = Math.max(p.t_plate + p.leg, p.leg * 2, p.t_plate);
    var avail  = Math.min(w * 0.40, h * 0.42);
    var s = Math.max(0.7, Math.min(avail / maxDim, 6));
    var legPx = p.leg * s, platePx = Math.max(p.t_plate * s, 6);
    var vertH = (baseTop - oy) - legPx - 6;

    var sh = stressShades(ratio);

    /* \u2500\u2500 Base (horizontal) plate \u2014 cut section with hatching \u2500\u2500 */
    var bx0 = ox + 6, bx1 = ox + w - 6;
    ctx.fillStyle = steelGrad(baseTop, baseTop + platePx);
    ctx.fillRect(bx0, baseTop, bx1 - bx0, platePx);
    hatchPath(function () { ctx.rect(bx0, baseTop, bx1 - bx0, platePx); }, bx0, baseTop, bx1, baseTop + platePx, 8);
    ctx.strokeStyle = '#6678b0'; ctx.lineWidth = 1.3;
    ctx.strokeRect(bx0, baseTop, bx1 - bx0, platePx);

    /* \u2500\u2500 Vertical plate \u2014 cut section with hatching \u2500\u2500 */
    var vx0 = cx - platePx / 2, vx1 = cx + platePx / 2, vy0 = baseTop - vertH;
    ctx.fillStyle = steelGrad(vy0, baseTop);
    ctx.fillRect(vx0, vy0, platePx, vertH);
    hatchPath(function () { ctx.rect(vx0, vy0, platePx, vertH); }, vx0, vy0, vx1, baseTop, 8);
    ctx.strokeStyle = '#6678b0'; ctx.lineWidth = 1.3;
    ctx.strokeRect(vx0, vy0, platePx, vertH);

    /* One fillet (root corner, leg toward `dir`). Convex face + stress fill. */
    function fillet(rootX, dir) {
      var ax = rootX, ay = baseTop - legPx;          /* up the vertical face */
      var bx = rootX + dir * legPx, by = baseTop;     /* along the base top   */
      var bulge = legPx * 0.16;                        /* convex face */
      var g = ctx.createLinearGradient(rootX, baseTop, rootX + dir * legPx, baseTop - legPx);
      g.addColorStop(0, sh[1]); g.addColorStop(1, sh[0]);
      ctx.beginPath();
      ctx.moveTo(rootX, baseTop);
      ctx.lineTo(ax, ay);
      ctx.quadraticCurveTo(rootX + dir * legPx * 0.5 + dir * bulge, baseTop - legPx * 0.5 - bulge, bx, by);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = sh[1]; ctx.lineWidth = 1.6; ctx.stroke();

      if (showDims) {
        /* Throat = perpendicular root\u2192face (the failure plane) */
        var mx = rootX - dir * 0 + dir * legPx * 0.5, my = baseTop - legPx * 0.5;
        ctx.save();
        ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(rootX, baseTop); ctx.lineTo(mx, my); ctx.stroke();
        ctx.restore();
      }
      return { ax: ax, ay: ay, bx: bx, by: by };
    }

    var fL = fillet(vx0, -1);
    if (twoSided) fillet(vx1, +1);

    /* Root point marker */
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(vx0, baseTop, 2.2, 0, Math.PI * 2); ctx.fill();

    if (showDims) {
      /* Throat callout \u2014 above the fillet apex, clear of the leg dims */
      var tcx = vx0 - legPx * 0.55, tcy = baseTop - legPx;
      haloText('throat a\u00B70.707', tcx, tcy - 22, '9px "Segoe UI",sans-serif', '#ffe08a');
      haloText('= ' + fLen(r.throat), tcx, tcy - 10, '10px "JetBrains Mono",monospace', '#ffe08a');

      /* Horizontal leg dimension */
      dimLineH(fL.bx, vx0, baseTop + platePx + 14, 'leg ' + fLen(p.leg), '#9fb0d0');
      /* Vertical leg dimension */
      dimLineV(fL.ay, baseTop, vx0 - legPx - 14, fLen(p.leg), '#9fb0d0');
      /* Plate thickness dimension */
      dimLineH(vx0, vx1, vy0 - 12, 't ' + fLen(p.t_plate), '#9fb0d0');

      /* 45\u00B0 marker at root \u2014 a 45\u00B0 sweep between the base plate (pointing
         left, \u03C0) and the weld face diagonal (up-left, 1.25\u03C0). The old
         \u2212\u03C0/2\u2192\u03C0 sweep drew a 270\u00B0 arc through the plates. */
      ctx.strokeStyle = '#8b9dc3'; ctx.lineWidth = 0.9;
      var arcR = Math.max(legPx * 0.34, 6);
      ctx.beginPath(); ctx.arc(vx0, baseTop, arcR, Math.PI, Math.PI * 1.25); ctx.stroke();
      haloText('45\u00B0', vx0 - arcR * 1.6, baseTop - arcR * 0.6, '8px "Segoe UI",sans-serif', '#8b9dc3');
    }
  }

  /* LEFT PANEL — plan view of a butt joint: two plates butted along a weld
     seam of length L, pulled in tension. */
  function drawButtSideView(ctx, ox, oy, w, h, p, r, ratio) {
    var cx = ox + w / 2, cy = oy + h * 0.5;
    var seamW = w * 0.78;
    var x0 = cx - seamW / 2, x1 = cx + seamW / 2;
    var plateH = Math.min(h * 0.30, 60);
    var sh = stressShades(ratio);

    /* Two plates (top & bottom faces of the seam) */
    function plate(yTop) {
      ctx.fillStyle = steelGrad(yTop, yTop + plateH);
      ctx.fillRect(x0, yTop, seamW, plateH);
      ctx.strokeStyle = '#5566a0'; ctx.lineWidth = 1.2;
      ctx.strokeRect(x0, yTop, seamW, plateH);
    }
    var beadH = Math.max(8, Math.min(h * 0.16, 6 + p.t_plate * 0.4));
    plate(cy - plateH - beadH / 2);
    plate(cy + beadH / 2);

    /* Weld bead seam (length L) with stress fill, crown sheen, ripples */
    var bg = ctx.createLinearGradient(0, cy - beadH / 2, 0, cy + beadH / 2);
    bg.addColorStop(0, sh[0]); bg.addColorStop(0.5, sh[1]); bg.addColorStop(1, sh[0]);
    ctx.fillStyle = bg;
    roundRect(ctx, x0, cy - beadH / 2, seamW, beadH, beadH / 2); ctx.fill();
    ctx.strokeStyle = sh[1]; ctx.lineWidth = 1.4; ctx.stroke();
    weldRipples(x0 + 6, x1 - 6, cy, Math.max(beadH * 0.3, 2), Math.max(8, Math.round(seamW / 14)), 'rgba(10,14,24,0.5)');

    /* Load arrows — direction is a physics claim. In this plan view the
       plates sit above and below the seam:
       tension  → plates pulled APART, perpendicular to the seam;
       shear    → plates slide in OPPOSITE directions along the seam;
       combined → opposed diagonal pulls. */
    var topPlateCy = cy - beadH / 2 - plateH / 2;
    var botPlateCy = cy + beadH / 2 + plateH / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(255,23,68,0.7)'; ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ff5b73'; ctx.fillStyle = '#ff5b73'; ctx.lineWidth = 3;
    var effLoadBtt = (loadType === 'combined') ? 'combined' : loadType;
    if (effLoadBtt === 'shear') {
      ctx.beginPath(); ctx.moveTo(cx - 30, topPlateCy); ctx.lineTo(cx + 44, topPlateCy); ctx.stroke();
      arrowTip(cx + 44, topPlateCy, 0);
      ctx.beginPath(); ctx.moveTo(cx + 30, botPlateCy); ctx.lineTo(cx - 44, botPlateCy); ctx.stroke();
      arrowTip(cx - 44, botPlateCy, Math.PI);
    } else if (effLoadBtt === 'combined') {
      ctx.beginPath(); ctx.moveTo(cx, cy - beadH / 2 - 4); ctx.lineTo(cx + 34, oy + 12); ctx.stroke();
      arrowTip(cx + 34, oy + 12, Math.atan2(oy + 12 - (cy - beadH / 2 - 4), 34));
      ctx.beginPath(); ctx.moveTo(cx, cy + beadH / 2 + 4); ctx.lineTo(cx - 34, oy + h - 12); ctx.stroke();
      arrowTip(cx - 34, oy + h - 12, Math.atan2(oy + h - 12 - (cy + beadH / 2 + 4), -34));
    } else {
      /* tension: pull apart across the joint */
      ctx.beginPath(); ctx.moveTo(cx, topPlateCy + 8); ctx.lineTo(cx, oy + 14); ctx.stroke();
      arrowTip(cx, oy + 14, Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(cx, botPlateCy - 8); ctx.lineTo(cx, oy + h - 14); ctx.stroke();
      arrowTip(cx, oy + h - 14, -Math.PI / 2);
    }
    ctx.restore();
    haloText('P = ' + fLoad(p.P) + (effLoadBtt === 'shear' ? ' (shear)' : effLoadBtt === 'combined' ? ' (combined)' : ''),
             ox + w - 8, oy + 12, 'bold 12px "Segoe UI",sans-serif', '#ff8a9b', 'right');

    if (showDims) {
      dimLineH(x0, x1, cy + beadH / 2 + plateH + 14, 'L = ' + fLen(p.L), '#9fb0d0');
      haloText('weld seam', cx, cy, '9px "Segoe UI",sans-serif', '#0a0e18');
    }
  }

  /* RIGHT PANEL — butt cross-section showing the groove, effective throat,
     reinforcement crown, and (for partial) the unfused root. */
  function drawButtCrossSection(ctx, ox, oy, w, h, p, r, ratio) {
    var cx = ox + w / 2, cy = oy + h * 0.5;
    var s = Math.max(1.2, Math.min((h * 0.5) / Math.max(p.t_plate, 1), (w * 0.16), 9));
    var platePx = Math.max(p.t_plate * s, 24);
    var top = cy - platePx / 2, bot = cy + platePx / 2;
    var plateRun = Math.min(w * 0.30, 70);
    var halfGapTop = Math.max(platePx * 0.18, 7);     /* groove opening at top */
    var full = (jointType === 'butt-full');
    var throatPx = full ? platePx : platePx * 0.5;
    var sh = stressShades(ratio);

    /* Parent plates (cut sections, hatched). Stroke the outline BEFORE
       hatching — hatchPath leaves a stale sub-path as the current path. */
    function plate(side) {
      var gx = (side < 0) ? cx - halfGapTop : cx + halfGapTop;     /* top inner edge */
      var x0 = (side < 0) ? cx - halfGapTop - plateRun : cx + halfGapTop + plateRun;
      function outline() {
        ctx.beginPath();
        ctx.moveTo(x0, top); ctx.lineTo(gx, top); ctx.lineTo(cx, bot); ctx.lineTo(x0, bot);
        ctx.closePath();
      }
      outline();
      ctx.fillStyle = steelGrad(top, bot); ctx.fill();
      ctx.strokeStyle = '#6678b0'; ctx.lineWidth = 1.3; ctx.stroke();
      hatchPath(outline, Math.min(x0, gx), top, Math.max(x0, gx), bot, 8);
    }
    plate(-1); plate(+1);

    /* Weld metal filling the V groove (full or partial depth) */
    var fillBot = full ? bot : top + throatPx;
    var bg = ctx.createLinearGradient(0, top, 0, fillBot);
    bg.addColorStop(0, sh[0]); bg.addColorStop(1, sh[1]);
    ctx.beginPath();
    ctx.moveTo(cx - halfGapTop, top);
    ctx.lineTo(cx + halfGapTop, top);
    if (full) { ctx.lineTo(cx, bot); }
    else {
      var frac = throatPx / platePx;
      ctx.lineTo(cx + halfGapTop * (1 - frac), fillBot);
      ctx.lineTo(cx - halfGapTop * (1 - frac), fillBot);
    }
    ctx.closePath();
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = sh[1]; ctx.lineWidth = 1.6; ctx.stroke();

    /* Reinforcement crown (convex cap) */
    ctx.fillStyle = sh[0];
    ctx.beginPath();
    ctx.moveTo(cx - halfGapTop, top);
    ctx.quadraticCurveTo(cx, top - Math.max(platePx * 0.1, 4), cx + halfGapTop, top);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = sh[1]; ctx.lineWidth = 1.2; ctx.stroke();

    /* Partial-penetration unfused root (dashed) */
    if (!full) {
      ctx.save();
      ctx.strokeStyle = '#ff7a7a'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx, fillBot); ctx.lineTo(cx, bot); ctx.stroke();
      ctx.restore();
      haloText('unfused root', cx, bot + 10, '8px "Segoe UI",sans-serif', '#ff7a7a');
    }

    if (showDims) {
      /* Effective throat (vertical), plate thickness */
      dimLineV(top, fillBot, cx - halfGapTop - plateRun + 12, '', '#ffe08a');
      haloText('te ' + fLen(r.throat), cx - halfGapTop - plateRun + 12, (top + fillBot) / 2 - 14,
               '10px "JetBrains Mono",monospace', '#ffe08a');
      dimLineV(top, bot, cx + halfGapTop + plateRun - 12, 't ' + fLen(p.t_plate), '#9fb0d0');
    }
  }

  function drawVerdictBadge(ctx, W, H, r) {
    var badgeW = 100;
    var badgeH = 32;
    var bx = W - badgeW - 15;
    var by = H - badgeH - 15;

    ctx.fillStyle = r.pass ? 'rgba(61,220,132,0.15)' : 'rgba(255,85,85,0.15)';
    ctx.strokeStyle = r.pass ? '#3ddc84' : '#ff5555';
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, badgeW, badgeH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.fillStyle = r.pass ? '#3ddc84' : '#ff5555';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.pass ? '\u2713 PASS' : '\u2717 FAIL', bx + badgeW / 2, by + badgeH / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ================================================================
     RUN SIMULATION ANIMATION
     ================================================================ */

  function runSimulation() {
    if (animId) cancelAnimationFrame(animId);
    simRan = false;
    animPhase = 0;
    forceScale = 0;

    function animStep() {
      animPhase += 0.02;
      /* ease-out so the rolling value decelerates into its final number */
      forceScale = 1 - Math.pow(1 - Math.min(animPhase, 1), 2);
      if (animPhase >= 1) {
        animPhase = 1;
        forceScale = 1;
        animId = null;
        simRan = true;
        updateReadouts();
        return;
      }
      draw();
      drawAnimOverlay(animPhase);
      animId = requestAnimationFrame(animStep);
    }
    animId = requestAnimationFrame(animStep);
  }

  function drawAnimOverlay(t) {
    var W = canvas.width / (window.devicePixelRatio || 1);
    var H = canvas.height / (window.devicePixelRatio || 1);

    /* Loading bar at bottom */
    var barH = 6;
    var barY = H - barH - 5;
    ctx.fillStyle = '#2a3050';
    roundRect(ctx, 20, barY, W - 40, barH, 3);
    ctx.fill();

    ctx.fillStyle = '#ff1744';
    roundRect(ctx, 20, barY, (W - 40) * t, barH, 3);
    ctx.fill();

    /* "Applying Load..." text */
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillStyle = '#ff1744';
    ctx.textAlign = 'center';
    ctx.fillText('Applying Load... ' + Math.round(t * 100) + '%', W / 2, barY - 8);
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function switchMode(m) {
    mode = m;
    if (animId) { cancelAnimationFrame(animId); animId = null; }

    /* Hide all */
    simPanel.style.display      = 'none';
    catRow.style.display        = 'none';
    itemSelector.style.display  = 'none';
    itemInfo.style.display      = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display   = 'none';
    quizPanel.style.display     = 'none';
    quizBar.style.display       = 'none';
    quizResult.style.display    = 'none';

    if (m === 'simulate') {
      simPanel.style.display = '';
      canvas.parentElement.style.display = '';
      simRan = false;
      updateReadouts();
    } else if (m === 'explore') {
      canvas.parentElement.style.display = 'none';
      catRow.style.display       = '';
      itemSelector.style.display = '';
      itemInfo.style.display     = '';
      buildExplore();
    } else if (m === 'practice') {
      canvas.parentElement.style.display = 'none';
      practicePanel.style.display = '';
      practiceBar.style.display   = '';
      pCorrect = 0; pTotal = 0;
      pbarScore.textContent = '0 / 0';
      newPractice();
    } else if (m === 'quiz') {
      canvas.parentElement.style.display = 'none';
      quizPanel.style.display = '';
      quizBar.style.display   = '';
      startQuiz();
    }
  }

  /* Mode tabs */
  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(m);
  });

  /* nWelds is meaningless for a single groove (butt) weld → disable it (B3).
     "Fillet Combined" IS combined loading → lock the load-type tabs to it. */
  function updateJointControls() {
    var isButt = jointType.indexOf('butt') === 0;
    var grp = document.getElementById('nweld-group');
    if (grp) grp.classList.toggle('disabled-grp', isButt);
    if (nweldSlider) nweldSlider.disabled = isButt;
    if (nweldInput) nweldInput.disabled = isButt;

    var isComb = (jointType === 'fillet-combined');
    if (isComb) loadType = 'combined';
    document.querySelectorAll('#loadtype-tabs .pill').forEach(function (p) {
      p.disabled = isComb;
      if (isComb) p.classList.toggle('active', p.dataset.load === 'combined');
    });
  }

  /* Joint type tabs */
  document.getElementById('joint-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    jointType = e.target.dataset.joint;
    document.querySelectorAll('#joint-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    updateJointControls();
    simRan = false; invalidateOutput();
    updateReadouts();
  });

  /* Load type tabs */
  document.getElementById('loadtype-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    loadType = e.target.dataset.load;
    document.querySelectorAll('#loadtype-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    simRan = false; invalidateOutput();
    updateReadouts();
  });

  /* Material tabs */
  document.getElementById('material-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    matKey = e.target.dataset.mat;
    document.querySelectorAll('#material-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    simRan = false; invalidateOutput();
    updateReadouts();
  });

  /* Sliders */
  [legSlider, lengthSlider, thicknessSlider, nweldSlider, loadSlider].forEach(function (s) {
    s.addEventListener('input', function () { simRan = false; invalidateOutput(); updateReadouts(); });
  });

  /* Stepper number inputs + [−]/[+] buttons */
  STEP_MAP.forEach(function (m) {
    function commit() {
      var dispVal = parseFloat(m.input.value);
      if (isNaN(dispVal)) { syncSteppers(); return; }
      var si = stepToSI(m, dispVal);
      var lo = +m.slider.min, hi = +m.slider.max;
      si = Math.max(lo, Math.min(hi, si));
      if (m.unit === 'count') si = Math.round(si);
      m.slider.value = si;
      simRan = false; invalidateOutput(); updateReadouts();
    }
    m.input.addEventListener('change', commit);
    m.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { commit(); m.input.blur(); } });
  });

  /* Stepper +/- buttons (step in SI slider units) */
  document.querySelectorAll('.stepper').forEach(function (st) {
    var key = st.getAttribute('data-key');
    var m = STEP_MAP.filter(function (x) { return x.key === key; })[0];
    if (!m) return;
    st.querySelectorAll('.stp-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (m.slider.disabled) return;
        var dir = +b.getAttribute('data-dir');
        var stepSI = +m.slider.step || 1;
        var v = +m.slider.value + dir * stepSI;
        v = Math.max(+m.slider.min, Math.min(+m.slider.max, v));
        m.slider.value = v;
        simRan = false; invalidateOutput(); updateReadouts();
      });
    });
  });

  /* Canvas feature toggles */
  function wireToggle(id, set) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function () {
      set(this.checked);
      var lab = this.closest('.sim-toggle');
      if (lab) lab.classList.toggle('checked', this.checked);
      draw();
    });
  }
  wireToggle('chk-equation', function (v) { showEquation = v; });
  wireToggle('chk-stress',   function (v) { showStress = v; });
  wireToggle('chk-dims',     function (v) { showDims = v; });

  /* Run simulation button */
  runSimBtn.addEventListener('click', runSimulation);

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  var CONCEPTS = [
    /* -- Fundamentals -- */
    { id: 'throat', name: 'Throat Thickness', symbol: 't = 0.707 \u00D7 leg', formula: 't = leg \u00D7 cos(45\u00B0) = 0.707 \u00D7 leg', unit: 'mm', cat: 'fundamentals',
      desc: 'The throat thickness is the shortest distance from the weld root to the face of a fillet weld. For equal-leg fillet welds, it equals 0.707 times the leg size. This is the critical dimension for calculating weld stress because it represents the minimum cross-section through which loads are transferred. A larger throat means a stronger weld.',
      example: { problem: 'A fillet weld has a leg size of 10 mm. What is the throat thickness?', steps: ['t = 0.707 \u00D7 leg', 't = 0.707 \u00D7 10', 't = 7.07 mm'], answer: 7.07, unit: 'mm' } },

    { id: 'eff-length', name: 'Effective Length', symbol: 'L_eff = L \u2212 2\u00D7leg', formula: 'L_eff = L \u2212 2 \u00D7 leg', unit: 'mm', cat: 'fundamentals',
      desc: 'The effective length of a fillet weld accounts for crater defects at the weld start and stop points. Each crater reduces the reliable weld length by approximately one leg size. Therefore, effective length equals the total weld length minus twice the leg size. For butt welds, the effective length equals the full weld length since groove welds have uniform cross-section.',
      example: { problem: 'A 200 mm fillet weld with 8 mm leg size. What is the effective length?', steps: ['L_eff = L \u2212 2 \u00D7 leg', 'L_eff = 200 \u2212 2 \u00D7 8', 'L_eff = 200 \u2212 16', 'L_eff = 184 mm'], answer: 184, unit: 'mm' } },

    { id: 'throat-area', name: 'Throat Area', symbol: 'A = t \u00D7 L_eff', formula: 'A = t \u00D7 L_eff \u00D7 n', unit: 'mm\u00B2', cat: 'fundamentals',
      desc: 'The throat area is the total effective area resisting the applied load. For fillet welds, it is the throat thickness multiplied by the effective length and the number of welds. This is the area used in the stress formula \u03C4 = P / A. Using throat area instead of leg area is important because the throat represents the actual minimum section resisting shear.',
      example: { problem: 'Two fillet welds, leg = 10 mm, L = 200 mm. Calculate the total throat area.', steps: ['t = 0.707 \u00D7 10 = 7.07 mm', 'L_eff = 200 \u2212 2 \u00D7 10 = 180 mm', 'A = t \u00D7 L_eff \u00D7 n', 'A = 7.07 \u00D7 180 \u00D7 2 = 2545.2 mm\u00B2'], answer: 2545.2, unit: 'mm\u00B2' } },

    { id: 'fos', name: 'Factor of Safety', symbol: 'FOS = \u03C3_allow / \u03C3_actual', formula: 'FOS = \u03C3_allowable / \u03C3_actual', unit: '\u2014', cat: 'fundamentals',
      desc: 'The Factor of Safety (FOS) compares the allowable stress to the actual stress in the weld. FOS \u2265 1.0 means the weld passes the design check; FOS < 1.0 means the weld is overstressed and will likely fail. In practice, engineers aim for FOS of 1.5 to 3.0 depending on loading conditions, consequences of failure, and inspection quality.',
      example: { problem: 'A weld has actual stress 100 MPa and allowable stress 145 MPa. What is the FOS?', steps: ['FOS = \u03C3_allow / \u03C3_actual', 'FOS = 145 / 100', 'FOS = 1.45', 'FOS \u2265 1.0, so the weld PASSES'], answer: 1.45, unit: '' } },

    /* -- Joint Types -- */
    { id: 'fillet-trans', name: 'Fillet \u2014 Transverse', symbol: '\u03C4 = P / A_throat', formula: '\u03C4 = P / (0.707 \u00D7 leg \u00D7 L_eff \u00D7 n)', unit: 'MPa', cat: 'joints',
      desc: 'A transverse fillet weld has the load applied perpendicular to the weld axis. The entire weld cross-section resists the load in shear across the throat. Transverse fillets test approximately 30% stronger than parallel fillets of the same size because the stress distribution across the throat is more favourable — but design codes (and this simulator) conservatively apply the same allowable stress to both directions unless the optional AWS D1.1 directional factor (up to 1.5×) is explicitly invoked.',
      example: { problem: 'A transverse fillet weld: leg = 8 mm, L = 150 mm, 2 welds, P = 80 kN.', steps: ['t = 0.707 \u00D7 8 = 5.656 mm', 'L_eff = 150 \u2212 2 \u00D7 8 = 134 mm', 'A = 5.656 \u00D7 134 \u00D7 2 = 1515.8 mm\u00B2', '\u03C4 = 80000 / 1515.8 = 52.8 MPa'], answer: 52.8, unit: 'MPa' } },

    { id: 'fillet-par', name: 'Fillet \u2014 Parallel', symbol: '\u03C4 = P / A_throat', formula: '\u03C4 = P / (0.707 \u00D7 leg \u00D7 L_eff \u00D7 n)', unit: 'MPa', cat: 'joints',
      desc: 'A parallel (longitudinal) fillet weld has the load applied along the weld axis. The weld resists the load through shear stress along its length. Parallel fillets are common in structural connections such as gusset plates and bracket attachments. The stress distribution is less uniform than in transverse welds, making them somewhat weaker for the same size.',
      example: { problem: 'A parallel fillet weld: leg = 6 mm, L = 200 mm, 2 welds, P = 50 kN.', steps: ['t = 0.707 \u00D7 6 = 4.242 mm', 'L_eff = 200 \u2212 2 \u00D7 6 = 188 mm', 'A = 4.242 \u00D7 188 \u00D7 2 = 1595.0 mm\u00B2', '\u03C4 = 50000 / 1595.0 = 31.3 MPa'], answer: 31.3, unit: 'MPa' } },

    { id: 'fillet-comb', name: 'Fillet \u2014 Combined', symbol: '\u03C3_eq = \u221A(\u03C3\u00B2 + 3\u03C4\u00B2)', formula: '\u03C3_eq = \u221A(\u03C3_trans\u00B2 + 3\u03C4_par\u00B2)', unit: 'MPa', cat: 'joints',
      desc: 'When a fillet weld carries both transverse and parallel loads simultaneously, the combined stress is calculated using the von Mises criterion. The equivalent stress accounts for the interaction between normal and shear components. This gives a more accurate assessment of weld safety than simply adding the stresses.',
      example: { problem: 'A fillet weld has transverse stress 60 MPa and parallel shear stress 40 MPa.', steps: ['\u03C3_eq = \u221A(\u03C3\u00B2 + 3\u03C4\u00B2)', '\u03C3_eq = \u221A(60\u00B2 + 3 \u00D7 40\u00B2)', '\u03C3_eq = \u221A(3600 + 4800)', '\u03C3_eq = \u221A8400 = 91.7 MPa'], answer: 91.7, unit: 'MPa' } },

    { id: 'butt-full', name: 'Butt Weld \u2014 Full Pen.', symbol: '\u03C3 = P / (t \u00D7 L)', formula: '\u03C3 = P / (t_plate \u00D7 L)', unit: 'MPa', cat: 'joints',
      desc: 'A full penetration butt weld (groove weld) joins two plates with complete fusion through the entire plate thickness. The effective throat equals the plate thickness. These welds are the strongest type because the weld metal completely replaces the base metal at the joint. They are used in pressure vessels, structural beams, and critical load-bearing connections.',
      example: { problem: 'Full penetration butt weld: plate 12 mm, L = 200 mm, P = 100 kN.', steps: ['A = t_plate \u00D7 L', 'A = 12 \u00D7 200 = 2400 mm\u00B2', '\u03C3 = P / A', '\u03C3 = 100000 / 2400 = 41.7 MPa'], answer: 41.7, unit: 'MPa' } },

    { id: 'butt-partial', name: 'Butt Weld \u2014 Partial Pen.', symbol: '\u03C3 = P / (t_eff \u00D7 L)', formula: 't_eff = t_plate / 2', unit: 'MPa', cat: 'joints',
      desc: 'A partial penetration butt weld does not fuse through the full plate thickness. The effective throat is typically 50-75% of the plate thickness, depending on the groove preparation. These are cheaper and faster than full penetration welds but have reduced load capacity. They are suitable for secondary structural members and static loading conditions.',
      example: { problem: 'Partial butt weld: plate 20 mm (50% penetration), L = 150 mm, P = 60 kN.', steps: ['t_eff = 20 / 2 = 10 mm', 'A = 10 \u00D7 150 = 1500 mm\u00B2', '\u03C3 = 60000 / 1500', '\u03C3 = 40.0 MPa'], answer: 40.0, unit: 'MPa' } },

    { id: 'lap-joint', name: 'Lap Joint (Double Fillet)', symbol: 'Two parallel fillets', formula: '\u03C4 = P / (2 \u00D7 0.707 \u00D7 leg \u00D7 L_eff)', unit: 'MPa', cat: 'joints',
      desc: 'A lap joint uses two fillet welds on opposite sides of overlapping plates. The double fillet configuration provides excellent load capacity and is one of the most common welded joint types. Each weld carries approximately half the total load. The minimum overlap should be at least 3 times the thinner plate thickness to ensure adequate force transfer.',
      example: { problem: 'Lap joint with two fillets: leg = 10 mm, L = 250 mm, P = 120 kN.', steps: ['t = 0.707 \u00D7 10 = 7.07 mm', 'L_eff = 250 \u2212 2 \u00D7 10 = 230 mm', 'A = 7.07 \u00D7 230 \u00D7 2 = 3252.2 mm\u00B2', '\u03C4 = 120000 / 3252.2 = 36.9 MPa'], answer: 36.9, unit: 'MPa' } },

    /* -- Materials -- */
    { id: 'mat-e70', name: 'E70xx (Mild Steel)', symbol: 'UTS = 483 MPa', formula: '\u03C4_allow = 0.3 \u00D7 483 = 144.9 MPa', unit: 'MPa', cat: 'materials',
      desc: 'E70xx is the most commonly used electrode for structural steel welding. The "70" indicates a minimum ultimate tensile strength of 70 ksi (483 MPa). The "E" stands for electrode, and the "xx" represents the welding position and flux type. E7018 (low-hydrogen) is the most popular variant, providing excellent mechanical properties, good ductility, and resistance to hydrogen cracking.',
      example: { problem: 'What is the allowable fillet weld shear stress for E70xx?', steps: ['\u03C4_allow = 0.3 \u00D7 UTS', '\u03C4_allow = 0.3 \u00D7 483', '\u03C4_allow = 144.9 MPa', 'This is per AWS D1.1 for fillet welds'], answer: 144.9, unit: 'MPa' } },

    { id: 'mat-e90', name: 'E90xx (High Strength)', symbol: 'UTS = 621 MPa', formula: '\u03C4_allow = 0.3 \u00D7 621 = 186.3 MPa', unit: 'MPa', cat: 'materials',
      desc: 'E90xx electrodes are used for welding high-strength structural steels (ASTM A572 Grade 65, A514, etc.). They provide a minimum UTS of 90 ksi (621 MPa). These electrodes require more careful heat control and preheat requirements compared to E70xx. They are used in bridges, cranes, heavy equipment, and applications where weight reduction through higher-strength steel is beneficial.',
      example: { problem: 'What is the allowable fillet weld shear stress for E90xx?', steps: ['\u03C4_allow = 0.3 \u00D7 UTS', '\u03C4_allow = 0.3 \u00D7 621', '\u03C4_allow = 186.3 MPa', 'Higher strength but requires skilled welders'], answer: 186.3, unit: 'MPa' } },

    { id: 'mat-e308', name: 'E308 (Stainless Steel)', symbol: 'UTS = 586 MPa', formula: '\u03C4_allow = 0.3 \u00D7 586 = 175.8 MPa', unit: 'MPa', cat: 'materials',
      desc: 'E308 is the standard filler metal for welding austenitic stainless steels (304, 304L). It provides corrosion resistance matching the base metal and has an ultimate tensile strength of 586 MPa. Stainless steel welding requires careful control of heat input and interpass temperature to avoid sensitisation (carbide precipitation) which reduces corrosion resistance.',
      example: { problem: 'What is the allowable fillet weld shear stress for E308?', steps: ['\u03C4_allow = 0.3 \u00D7 UTS', '\u03C4_allow = 0.3 \u00D7 586', '\u03C4_allow = 175.8 MPa', 'Used for stainless steel fabrication'], answer: 175.8, unit: 'MPa' } },

    { id: 'mat-al', name: 'ER4043 (Aluminum)', symbol: 'UTS = 186 MPa', formula: '\u03C4_allow = 0.3 \u00D7 186 = 55.8 MPa', unit: 'MPa', cat: 'materials',
      desc: 'ER4043 is the most common aluminum filler wire for MIG/TIG welding of 6xxx series aluminum alloys. It contains 5% silicon for improved fluidity and crack resistance. The UTS is significantly lower than steel electrodes at 186 MPa, meaning aluminum welds require larger sizes to carry equivalent loads. The heat-affected zone in aluminum welds also suffers significant strength reduction.',
      example: { problem: 'What is the allowable fillet weld shear stress for ER4043?', steps: ['\u03C4_allow = 0.3 \u00D7 UTS', '\u03C4_allow = 0.3 \u00D7 186', '\u03C4_allow = 55.8 MPa', 'Much lower than steel \u2014 larger welds needed'], answer: 55.8, unit: 'MPa' } },

    /* -- Design Rules -- */
    { id: 'min-size', name: 'Minimum Fillet Size', symbol: 'AWS D1.1 Table', formula: 'Based on thicker plate joined', unit: 'mm', cat: 'design',
      desc: 'AWS D1.1 specifies minimum fillet weld sizes based on the thickness of the thicker plate being joined. For plates up to 6 mm: min leg = 3 mm. For 6\u201313 mm: min leg = 5 mm. For 13\u201319 mm: min leg = 6 mm. For plates over 19 mm: min leg = 8 mm. These minimums ensure adequate heat input for fusion and prevent rapid cooling that causes cracking.',
      example: { problem: 'What is the minimum fillet weld size for joining a 15 mm plate?', steps: ['Plate thickness = 15 mm', 'AWS D1.1: 13 mm < 15 mm \u2264 19 mm', 'Minimum leg size = 6 mm', 'This ensures proper fusion'], answer: 6, unit: 'mm' } },

    { id: 'max-size', name: 'Maximum Fillet Size', symbol: 'leg \u2264 t \u2212 2mm', formula: 'Max leg = plate thickness \u2212 2 mm (for t > 6mm)', unit: 'mm', cat: 'design',
      desc: 'The maximum fillet weld size is limited by the plate thickness. For plates thicker than 6 mm, the maximum leg size equals the plate thickness minus 2 mm (to avoid melting the plate edge). For plates 6 mm or thinner, the maximum leg equals the plate thickness. This rule prevents excessive heat input that would distort or burn through the plate edge.',
      example: { problem: 'What is the maximum fillet weld size for a 12 mm plate?', steps: ['Plate thickness = 12 mm > 6 mm', 'Max leg = t \u2212 2', 'Max leg = 12 \u2212 2 = 10 mm', 'Weld leg must not exceed 10 mm'], answer: 10, unit: 'mm' } },

    { id: 'intermittent', name: 'Intermittent Welds', symbol: 'length-pitch pattern', formula: 'e.g., 50-150 (50mm weld, 150mm pitch)', unit: 'mm', cat: 'design',
      desc: 'Intermittent fillet welds are short weld segments placed at regular intervals instead of a continuous weld. They are used to reduce welding cost, distortion, and heat input while still providing adequate strength. The notation "50-150" means 50 mm weld segments at 150 mm centre-to-centre spacing. The minimum length of each segment must be at least 4 times the leg size.',
      example: { problem: 'An intermittent weld "60-200" with 8 mm leg over 1000 mm joint. Total weld length?', steps: ['Pitch = 200 mm, segment = 60 mm', 'Number of segments = 1000 / 200 = 5', 'Total weld length = 5 \u00D7 60 = 300 mm', 'Effective length = 5 \u00D7 (60 \u2212 2\u00D78) = 5 \u00D7 44 = 220 mm'], answer: 300, unit: 'mm' } },

    { id: 'defects', name: 'Weld Defects & Strength', symbol: 'Porosity, cracks, undercut', formula: 'Defects reduce effective throat area', unit: '\u2014', cat: 'design',
      desc: 'Weld defects reduce the effective load-carrying area and create stress concentrations. Common defects include: porosity (gas pockets reducing cross-section), lack of fusion (incomplete bonding between weld and base metal), undercut (groove at weld toe reducing plate thickness), slag inclusions (trapped flux), and cracks (most dangerous, can propagate under cyclic loading). Inspection methods include visual, ultrasonic, radiographic, and magnetic particle testing.',
      example: { problem: 'A weld with 15% porosity has nominal throat area 1000 mm\u00B2. What is effective area?', steps: ['Porosity reduces effective area by 15%', 'A_eff = A \u00D7 (1 \u2212 0.15)', 'A_eff = 1000 \u00D7 0.85', 'A_eff = 850 mm\u00B2'], answer: 850, unit: 'mm\u00B2' } }
  ];

  function buildExplore() {
    var grid = document.getElementById('concept-grid');
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    grid.innerHTML = '';
    filtered.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (i === 0 ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        grid.querySelectorAll('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo(c);
      });
      grid.appendChild(btn);
    });
    if (filtered.length) showConceptInfo(filtered[0]);
  }

  function showConceptInfo(c) {
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>';
    html += '<div class="ii-desc">' + c.desc + '</div>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<div class="ex-problem">' + c.example.problem + '</div>';
      c.example.steps.forEach(function (s) {
        html += '<div class="ex-step">\u2192 ' + s + '</div>';
      });
      html += '<div class="ex-step"><strong>Answer: ' + c.example.answer + ' ' + c.example.unit + '</strong></div>';
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  /* Explore category tabs */
  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildExplore();
  });

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  var PRACTICE_GENERATORS = [
    /* 1 */ function () { var leg = randInt(4, 20); var t = (leg * 0.707); return { prompt: 'A fillet weld has a leg size of ' + leg + ' mm. Calculate the throat thickness.', answer: round2(t), unit: 'mm', steps: ['t = 0.707 \u00D7 leg', 't = 0.707 \u00D7 ' + leg, 't = ' + round2(t) + ' mm'] }; },
    /* 2 */ function () { var L = randInt(100, 400); var leg = randInt(5, 15); var eff = L - 2 * leg; return { prompt: 'A fillet weld is ' + L + ' mm long with ' + leg + ' mm leg size. Calculate the effective length.', answer: eff, unit: 'mm', steps: ['L_eff = L \u2212 2 \u00D7 leg', 'L_eff = ' + L + ' \u2212 2 \u00D7 ' + leg, 'L_eff = ' + eff + ' mm'] }; },
    /* 3 */ function () { var leg = randInt(5, 15); var L = randInt(100, 300); var n = randInt(1, 3); var t = leg * 0.707; var eff = L - 2 * leg; var A = t * eff * n; return { prompt: 'Calculate the total throat area for ' + n + ' fillet weld(s) with leg = ' + leg + ' mm, L = ' + L + ' mm.', answer: round1(A), unit: 'mm\u00B2', steps: ['t = 0.707 \u00D7 ' + leg + ' = ' + round2(t) + ' mm', 'L_eff = ' + L + ' \u2212 2 \u00D7 ' + leg + ' = ' + eff + ' mm', 'A = ' + round2(t) + ' \u00D7 ' + eff + ' \u00D7 ' + n + ' = ' + round1(A) + ' mm\u00B2'] }; },
    /* 4 */ function () { var leg = randInt(5, 15); var L = randInt(100, 300); var n = 2; var P = randInt(30, 200); var t = leg * 0.707; var eff = L - 2 * leg; var A = t * eff * n; var stress = (P * 1000) / A; return { prompt: 'A fillet weld: leg = ' + leg + ' mm, L = ' + L + ' mm, ' + n + ' welds, P = ' + P + ' kN. Calculate the shear stress.', answer: round1(stress), unit: 'MPa', steps: ['t = 0.707 \u00D7 ' + leg + ' = ' + round2(t) + ' mm', 'L_eff = ' + eff + ' mm', 'A = ' + round2(t) + ' \u00D7 ' + eff + ' \u00D7 ' + n + ' = ' + round1(A) + ' mm\u00B2', '\u03C4 = ' + (P * 1000) + ' / ' + round1(A) + ' = ' + round1(stress) + ' MPa'] }; },
    /* 5 */ function () { var keys = ['e70', 'e90', 'e308', 'er4043']; var k = keys[randInt(0, 3)]; var mat = MATERIALS[k]; var allow = 0.3 * mat.uts; return { prompt: 'What is the allowable fillet weld shear stress for ' + mat.name + ' (UTS = ' + mat.uts + ' MPa)?', answer: round1(allow), unit: 'MPa', steps: ['\u03C4_allow = 0.3 \u00D7 UTS', '\u03C4_allow = 0.3 \u00D7 ' + mat.uts, '\u03C4_allow = ' + round1(allow) + ' MPa'] }; },
    /* 6 */ function () { var stress = randInt(50, 200); var allow = randInt(stress - 30, stress + 100); var fos = allow / stress; return { prompt: 'A weld has actual stress ' + stress + ' MPa and allowable stress ' + allow + ' MPa. Calculate the Factor of Safety.', answer: round2(fos), unit: '', steps: ['FOS = \u03C3_allow / \u03C3_actual', 'FOS = ' + allow + ' / ' + stress, 'FOS = ' + round2(fos)] }; },
    /* 7 */ function () { var tp = randInt(8, 30); var L = randInt(100, 300); var P = randInt(30, 150); var A = tp * L; var stress = (P * 1000) / A; return { prompt: 'Full penetration butt weld: plate = ' + tp + ' mm, L = ' + L + ' mm, P = ' + P + ' kN. Calculate the tensile stress.', answer: round1(stress), unit: 'MPa', steps: ['A = t \u00D7 L = ' + tp + ' \u00D7 ' + L + ' = ' + A + ' mm\u00B2', '\u03C3 = P / A', '\u03C3 = ' + (P * 1000) + ' / ' + A + ' = ' + round1(stress) + ' MPa'] }; },
    /* 8 */ function () { var leg = randInt(5, 15); var P = randInt(40, 200); var n = 2; var allow = 144.9; var t = leg * 0.707; var A_per_mm = t * n; var Lreq = (P * 1000) / (allow * A_per_mm); var Ltotal = Lreq + 2 * leg; return { prompt: 'Design: ' + n + ' fillet welds, leg = ' + leg + ' mm, E70xx. What weld length is needed to carry ' + P + ' kN?', answer: round0(Ltotal), unit: 'mm', steps: ['t = 0.707 \u00D7 ' + leg + ' = ' + round2(t) + ' mm', '\u03C4_allow = 144.9 MPa (E70xx)', 'L_eff = P / (\u03C4_allow \u00D7 t \u00D7 n)', 'L_eff = ' + (P * 1000) + ' / (144.9 \u00D7 ' + round2(t) + ' \u00D7 ' + n + ') = ' + round0(Lreq) + ' mm', 'L_total = L_eff + 2 \u00D7 leg = ' + round0(Lreq) + ' + ' + (2 * leg) + ' = ' + round0(Ltotal) + ' mm'] }; },
    /* 9 */ function () { var P = randInt(40, 200); var L = randInt(100, 300); var n = 2; var allow = 144.9; var A_req = (P * 1000) / allow; var t_req = A_req / (L * n); var leg_req = t_req / 0.707; return { prompt: 'Design: E70xx, L = ' + L + ' mm (take L as the effective length), ' + n + ' welds, P = ' + P + ' kN. What minimum leg size is needed?', answer: round1(leg_req), unit: 'mm', steps: ['A_req = P / \u03C4_allow = ' + (P * 1000) + ' / 144.9 = ' + round1(A_req) + ' mm\u00B2', 't_req = A / (L \u00D7 n) = ' + round1(A_req) + ' / (' + L + ' \u00D7 ' + n + ') = ' + round2(t_req) + ' mm', 'leg = t / 0.707 = ' + round2(t_req) + ' / 0.707 = ' + round1(leg_req) + ' mm'] }; },
    /* 10 */ function () { var sigma = randInt(30, 100); var tau = randInt(20, 80); var eq = Math.sqrt(sigma * sigma + 3 * tau * tau); return { prompt: 'A weld has \u03C3 = ' + sigma + ' MPa and \u03C4 = ' + tau + ' MPa. Calculate the von Mises equivalent stress.', answer: round1(eq), unit: 'MPa', steps: ['\u03C3_eq = \u221A(\u03C3\u00B2 + 3\u03C4\u00B2)', '\u03C3_eq = \u221A(' + sigma + '\u00B2 + 3 \u00D7 ' + tau + '\u00B2)', '\u03C3_eq = \u221A(' + (sigma * sigma) + ' + ' + (3 * tau * tau) + ')', '\u03C3_eq = ' + round1(eq) + ' MPa'] }; },
    /* 11 */ function () { var tp = randInt(8, 30); var L = randInt(100, 300); var t_eff = tp * 0.5; var P = randInt(20, 100); var A = t_eff * L; var stress = (P * 1000) / A; return { prompt: 'Partial penetration butt weld: plate = ' + tp + ' mm (50% penetration), L = ' + L + ' mm, P = ' + P + ' kN. Calculate stress.', answer: round1(stress), unit: 'MPa', steps: ['t_eff = ' + tp + ' / 2 = ' + t_eff + ' mm', 'A = ' + t_eff + ' \u00D7 ' + L + ' = ' + A + ' mm\u00B2', '\u03C3 = ' + (P * 1000) + ' / ' + A + ' = ' + round1(stress) + ' MPa'] }; },
    /* 12 */ function () { var leg = randInt(5, 15); var L = randInt(100, 300); var n = 2; var keys = ['e70', 'e90', 'e308', 'er4043']; var k = keys[randInt(0, 3)]; var mat = MATERIALS[k]; var allow = 0.3 * mat.uts; var t = leg * 0.707; var eff = L - 2 * leg; var A = t * eff * n; var maxLoad = (allow * A) / 1000; return { prompt: 'What is the maximum load for ' + n + ' fillet welds, leg = ' + leg + ' mm, L = ' + L + ' mm, ' + mat.name + '?', answer: round1(maxLoad), unit: 'kN', steps: ['t = 0.707 \u00D7 ' + leg + ' = ' + round2(t) + ' mm', 'L_eff = ' + eff + ' mm', 'A = ' + round2(t) + ' \u00D7 ' + eff + ' \u00D7 ' + n + ' = ' + round1(A) + ' mm\u00B2', '\u03C4_allow = 0.3 \u00D7 ' + mat.uts + ' = ' + round1(allow) + ' MPa', 'P_max = ' + round1(allow) + ' \u00D7 ' + round1(A) + ' / 1000 = ' + round1(maxLoad) + ' kN'] }; }
  ];

  function newPractice() {
    pChecked = false;
    ppInput.value = '';
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppNext.style.display = 'none';
    ppCheck.style.display = '';
    ppShow.style.display = '';

    var gen = PRACTICE_GENERATORS[randInt(0, PRACTICE_GENERATORS.length - 1)];
    var q = gen();
    ppPrompt.textContent = q.prompt;
    ppUnit.textContent = q.unit;
    pAnswer = q.answer;

    /* Build solution HTML */
    var solHtml = '<h4>Step-by-Step Solution</h4>';
    q.steps.forEach(function (s) {
      solHtml += '<div class="sol-step">\u2192 ' + s + '</div>';
    });
    solHtml += '<div class="sol-step"><strong>Answer: ' + q.answer + ' ' + q.unit + '</strong></div>';
    ppSolution.innerHTML = solHtml;

    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (pChecked) return;
    pChecked = true;
    pTotal++;
    var userVal = parseFloat(ppInput.value);
    var tol = Math.max(Math.abs(pAnswer) * 0.05, 0.5);
    if (!isNaN(userVal) && Math.abs(userVal - pAnswer) <= tol) {
      pCorrect++;
      ppFeedback.textContent = '\u2713 Correct! Answer: ' + pAnswer;
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '\u2717 Incorrect. Correct answer: ' + pAnswer;
      ppFeedback.className = 'feedback err';
    }
    pbarScore.textContent = pCorrect + ' / ' + pTotal;
    ppCheck.style.display = 'none';
    ppShow.style.display = 'none';
    ppNext.style.display = '';
    ppSolution.style.display = '';
  });

  ppShow.addEventListener('click', function () {
    ppSolution.style.display = '';
  });

  ppNext.addEventListener('click', newPractice);

  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!pChecked) ppCheck.click();
      else ppNext.click();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ questions */
    { type: 'mcq', q: 'What is the throat thickness formula for an equal-leg fillet weld?', opts: ['t = leg \u00D7 0.707', 't = leg \u00D7 0.5', 't = leg \u00D7 sin(60\u00B0)', 't = leg \u00D7 cos(30\u00B0)'], correct: 0 },
    { type: 'mcq', q: 'Which weld type is strongest for the same throat thickness?', opts: ['Full penetration butt weld', 'Fillet weld (transverse)', 'Fillet weld (parallel)', 'Partial penetration butt weld'], correct: 0 },
    { type: 'mcq', q: 'What is the allowable shear stress multiplier for fillet welds (AWS)?', opts: ['0.3 \u00D7 UTS', '0.6 \u00D7 UTS', '0.5 \u00D7 Sy', '0.3 \u00D7 Sy'], correct: 0 },
    { type: 'mcq', q: 'How is effective fillet weld length calculated?', opts: ['L \u2212 2 \u00D7 leg', 'L \u2212 leg', 'L \u00D7 0.9', 'L + 2 \u00D7 throat'], correct: 0 },
    { type: 'mcq', q: 'What is the von Mises equivalent stress formula?', opts: ['\u221A(\u03C3\u00B2 + 3\u03C4\u00B2)', '\u03C3 + \u03C4', '\u221A(\u03C3\u00B2 + \u03C4\u00B2)', '\u03C3 + 2\u03C4'], correct: 0 },
    { type: 'mcq', q: 'A FOS of 0.8 means the weld:', opts: ['FAILS \u2014 overstressed', 'PASSES with small margin', 'Is at exactly allowable stress', 'Needs more inspection'], correct: 0 },
    { type: 'mcq', q: 'The minimum fillet weld size for a 15 mm plate (AWS D1.1) is:', opts: ['6 mm', '3 mm', '5 mm', '8 mm'], correct: 0 },
    { type: 'mcq', q: 'E70xx electrode has an ultimate tensile strength of:', opts: ['483 MPa', '621 MPa', '345 MPa', '586 MPa'], correct: 0 },
    { type: 'mcq', q: 'For butt welds in tension, the allowable stress is:', opts: ['0.6 \u00D7 Sy', '0.3 \u00D7 UTS', '0.5 \u00D7 UTS', 'UTS / FOS'], correct: 0 },
    { type: 'mcq', q: 'A lap joint typically uses:', opts: ['Two fillet welds on opposite sides', 'One butt weld', 'One transverse fillet weld', 'Three parallel fillet welds'], correct: 0 },

    /* Numeric questions */
    { type: 'num', q: 'Calculate the throat thickness for a 12 mm fillet weld (mm).', answer: 8.48, unit: 'mm', tol: 0.1 },
    { type: 'num', q: 'Effective length for a 250 mm fillet weld with 10 mm leg size (mm).', answer: 230, unit: 'mm', tol: 1 },
    { type: 'num', q: 'Allowable fillet shear stress for E70xx (UTS = 483 MPa): \u03C4_allow = ? MPa', answer: 144.9, unit: 'MPa', tol: 1 },
    { type: 'num', q: 'Butt weld stress: plate 10 mm, L = 200 mm, P = 50 kN. \u03C3 = ? MPa', answer: 25.0, unit: 'MPa', tol: 0.5 },
    { type: 'num', q: 'Von Mises stress: \u03C3 = 50 MPa, \u03C4 = 30 MPa. \u03C3_eq = ? MPa', answer: 70.0, unit: 'MPa', tol: 1 }
  ];

  function startQuiz() {
    quizScore = 0;
    quizIdx = 0;
    quizLocked = false;
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';

    /* Shuffle and pick 5 */
    var shuffled = QUIZ_POOL.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
    }
    quizSet = shuffled.slice(0, QUIZ_SIZE);
    /* For MCQ, shuffle options */
    quizSet.forEach(function (q) {
      if (q.type === 'mcq') {
        var correctText = q.opts[q.correct];
        var shuffOpts = q.opts.slice();
        for (var k = shuffOpts.length - 1; k > 0; k--) {
          var m = randInt(0, k);
          var t2 = shuffOpts[k]; shuffOpts[k] = shuffOpts[m]; shuffOpts[m] = t2;
        }
        q._opts = shuffOpts;
        q._correct = shuffOpts.indexOf(correctText);
      }
    });
    showQuizQuestion();
  }

  function showQuizQuestion() {
    quizLocked = false;
    qbarNum.textContent = quizIdx + 1;
    var q = quizSet[quizIdx];

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.q + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q._opts.forEach(function (opt, i) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>';
      });
      html += '</div>';
      html += '<div style="margin-top:12px"><span class="quiz-feedback" id="qfb"></span></div>';
    } else {
      html += '<div class="quiz-input-row"><input class="qi-input" id="qi-val" type="number" step="any" placeholder="Your answer"><span class="qi-unit">' + q.unit + '</span><button class="btn btn-primary" id="qi-submit">Submit</button></div>';
      html += '<div style="margin-top:8px"><span class="quiz-feedback" id="qfb"></span></div>';
    }
    html += '<div style="margin-top:12px;display:none" id="quiz-next-wrap"><button class="btn btn-ghost" id="quiz-next">Next \u2192</button></div>';

    quizPanel.innerHTML = html;

    /* Attach events */
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizLocked) return;
          quizLocked = true;
          var idx = +btn.dataset.idx;
          var correct = q._correct;
          var btns = quizPanel.querySelectorAll('.answer-btn');
          btns.forEach(function (b, bi) {
            b.classList.add('locked');
            if (bi === correct) b.classList.add('correct');
            if (bi === idx && idx !== correct) b.classList.add('wrong');
          });
          var fb = document.getElementById('qfb');
          if (idx === correct) {
            quizScore++;
            fb.textContent = '\u2713 Correct!';
            fb.className = 'quiz-feedback ok';
            q._userAnswer = q._opts[idx];
            q._isCorrect = true;
          } else {
            fb.textContent = '\u2717 Wrong. Answer: ' + q._opts[correct];
            fb.className = 'quiz-feedback err';
            q._userAnswer = q._opts[idx];
            q._isCorrect = false;
          }
          document.getElementById('quiz-next-wrap').style.display = '';
        });
      });
    } else {
      var submitBtn = document.getElementById('qi-submit');
      var qiInput = document.getElementById('qi-val');
      function submitNumeric() {
        if (quizLocked) return;
        quizLocked = true;
        var userVal = parseFloat(qiInput.value);
        var fb = document.getElementById('qfb');
        var tol = q.tol || Math.max(Math.abs(q.answer) * 0.05, 0.5);
        if (!isNaN(userVal) && Math.abs(userVal - q.answer) <= tol) {
          quizScore++;
          fb.textContent = '\u2713 Correct! Answer: ' + q.answer;
          fb.className = 'quiz-feedback ok';
          q._isCorrect = true;
          q._userAnswer = userVal;
        } else {
          fb.textContent = '\u2717 Wrong. Correct answer: ' + q.answer + ' ' + q.unit;
          fb.className = 'quiz-feedback err';
          q._isCorrect = false;
          q._userAnswer = isNaN(userVal) ? 'No answer' : userVal;
        }
        submitBtn.disabled = true;
        document.getElementById('quiz-next-wrap').style.display = '';
      }
      submitBtn.addEventListener('click', submitNumeric);
      qiInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitNumeric(); });
      qiInput.focus();
    }

    document.getElementById('quiz-next-wrap').addEventListener('click', function () {
      quizIdx++;
      if (quizIdx < QUIZ_SIZE) {
        showQuizQuestion();
      } else {
        showQuizResult();
      }
    });
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var scoreClass, stars, verdict;
    if (quizScore === 5)      { scoreClass = 'perfect'; stars = '\u2605\u2605\u2605'; verdict = 'Perfect Score!'; }
    else if (quizScore >= 3)  { scoreClass = 'good';    stars = '\u2605\u2605';      verdict = 'Good Job!'; }
    else                      { scoreClass = 'poor';    stars = '\u2605';             verdict = 'Keep Practicing'; }

    var html = '<div class="qr-header"><div class="qr-title-wrap"><div class="qr-title">Quiz Complete</div><div class="qr-stars">' + stars + '</div></div>';
    html += '<div class="qr-score-wrap"><div class="qr-score ' + scoreClass + '">' + quizScore + '/' + QUIZ_SIZE + '</div><div class="qr-verdict">' + verdict + '</div></div></div>';

    html += '<div class="qr-rows">';
    quizSet.forEach(function (q, i) {
      var cls = q._isCorrect ? 'ok' : 'err';
      var mark = q._isCorrect ? '\u2713' : '\u2717';
      html += '<div class="qr-row ' + cls + '"><div class="qr-qnum">Q' + (i + 1) + '</div>';
      html += '<div class="qr-detail">' + q.q.substring(0, 60) + (q.q.length > 60 ? '...' : '') + '<br>Your answer: <strong>' + q._userAnswer + '</strong></div>';
      html += '<div class="qr-mark">' + mark + '</div></div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="new-quiz-btn">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('new-quiz-btn').addEventListener('click', function () {
      quizResult.style.display = 'none';
      switchMode('quiz');
    });
  }

  /* ================================================================
     UNIT TOGGLE
     ================================================================ */

  document.getElementById('unit-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    imperial = e.target.dataset.unit === 'imp';
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    updateUnitLabels();
    _learnCache.eq = ''; _learnCache.coach = '';
    updateReadouts();
  });

  /* ================================================================
     PRESETS
     ================================================================ */

  var PRESETS = [
    { name: 'Bracket 50 kN', joint: 'fillet-transverse', load: 'tension',  mat: 'e70', leg: 6,  L: 200, t: 10, n: 2, P: 50 },
    { name: 'Lap 120 kN',    joint: 'lap-joint',         load: 'shear',    mat: 'e70', leg: 10, L: 250, t: 12, n: 2, P: 120 },
    { name: 'CJP Butt',      joint: 'butt-full',         load: 'tension',  mat: 'e90', leg: 8,  L: 200, t: 16, n: 1, P: 180 },
    { name: 'Stainless Rail',joint: 'fillet-parallel',   load: 'shear',    mat: 'e308',leg: 8,  L: 300, t: 10, n: 2, P: 90 },
    { name: 'Alu Frame',     joint: 'fillet-transverse', load: 'tension',  mat: 'er4043',leg: 10,L: 200, t: 8,  n: 2, P: 25 }
  ];

  function applyPreset(ps) {
    jointType = ps.joint; loadType = ps.load; matKey = ps.mat;
    legSlider.value = ps.leg; lengthSlider.value = ps.L;
    thicknessSlider.value = ps.t; nweldSlider.value = ps.n; loadSlider.value = ps.P;
    document.querySelectorAll('#joint-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.joint === ps.joint); });
    document.querySelectorAll('#loadtype-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.load === ps.load); });
    document.querySelectorAll('#material-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mat === ps.mat); });
    updateJointControls();
    simRan = false; invalidateOutput();
    updateReadouts();
  }

  (function buildPresets() {
    var row = document.getElementById('preset-row');
    if (!row) return;
    PRESETS.forEach(function (ps) {
      var b = document.createElement('button');
      b.className = 'preset-btn'; b.type = 'button'; b.textContent = ps.name;
      b.addEventListener('click', function () { applyPreset(ps); });
      row.appendChild(b);
    });
  })();

  /* ================================================================
     RESET
     ================================================================ */

  function resetAll() {
    jointType = 'fillet-transverse'; loadType = 'tension'; matKey = 'e70';
    legSlider.value = 8; lengthSlider.value = 150; thicknessSlider.value = 12;
    nweldSlider.value = 2; loadSlider.value = 80;
    showEquation = true; showStress = true; showDims = true;
    ['chk-equation', 'chk-stress', 'chk-dims'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.checked = true; var lab = el.closest('.sim-toggle'); if (lab) lab.classList.add('checked'); }
    });
    document.querySelectorAll('#joint-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.joint === 'fillet-transverse'); });
    document.querySelectorAll('#loadtype-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.load === 'tension'); });
    document.querySelectorAll('#material-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mat === 'e70'); });
    updateJointControls();
    simRan = false; forceScale = 0;
    updateReadouts();
  }
  var resetBtn = document.getElementById('reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetAll);

  /* ================================================================
     EXPORT (CSV + PNG)
     ================================================================ */

  function currentRows() {
    var p = getParams(), r = calcWeld(p);
    return [
      ['Joint type', jointType],
      ['Load type', loadType],
      ['Material', MATERIALS[matKey].name],
      ['Weld leg size (' + uLenLabel() + ')', dLen(p.leg).toFixed(dpLen())],
      ['Weld length (' + uLenLabel() + ')', dLen(p.L).toFixed(dpLen())],
      ['Plate thickness (' + uLenLabel() + ')', dLen(p.t_plate).toFixed(dpLen())],
      ['Number of welds', r.nEff],
      ['Applied load (' + uLoadLabel() + ')', dLoad(p.P).toFixed(dpLoad())],
      ['Throat thickness (' + uLenLabel() + ')', dLen(r.throat).toFixed(dpLen())],
      ['Throat area (' + uAreaLabel() + ')', dArea(r.area).toFixed(dpArea())],
      ['Effective length (' + uLenLabel() + ')', dLen(r.effLen).toFixed(dpLen())],
      ['Actual stress (' + uStressLabel() + ')', dStress(r.actualStress).toFixed(dpStress())],
      ['Allowable stress (' + uStressLabel() + ')', dStress(r.allowStress).toFixed(dpStress())],
      ['Factor of safety', isFinite(r.fos) ? r.fos.toFixed(2) : 'inf'],
      ['Max load (' + uLoadLabel() + ')', dLoad(r.maxLoad).toFixed(dpLoad())],
      ['Verdict', r.pass ? 'PASS' : 'FAIL']
    ];
  }

  function exportCSV() {
    var rows = currentRows();
    var csv = 'Parameter,Value\r\n' + rows.map(function (r2) {
      return '"' + String(r2[0]).replace(/"/g, '""') + '","' + String(r2[1]).replace(/"/g, '""') + '"';
    }).join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'weld-strength-results.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPNG() {
    /* Composite the canvas with a watermark onto an offscreen buffer */
    var dpr = window.devicePixelRatio || 1;
    var off = document.createElement('canvas');
    off.width = canvas.width; off.height = canvas.height;
    var octx = off.getContext('2d');
    octx.fillStyle = '#0d1117';
    octx.fillRect(0, 0, off.width, off.height);
    octx.drawImage(canvas, 0, 0);
    octx.font = (12 * dpr) + 'px Segoe UI, sans-serif';
    octx.fillStyle = 'rgba(221,227,240,0.55)';
    octx.textAlign = 'right';
    octx.fillText('NHIT VisualLab', off.width - 10 * dpr, off.height - 8 * dpr);
    var a = document.createElement('a');
    a.href = off.toDataURL('image/png');
    a.download = 'weld-strength.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  var csvBtn = document.getElementById('export-csv-btn');
  if (csvBtn) csvBtn.addEventListener('click', exportCSV);
  var pngBtn = document.getElementById('export-png-btn');
  if (pngBtn) pngBtn.addEventListener('click', exportPNG);

  /* ================================================================
     CANVAS RIGHT-CLICK CONTEXT MENU
     ================================================================ */

  var ctxMenu = null;
  function closeCtxMenu() { if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; } }
  function copyStress() {
    var p = getParams(), r = calcWeld(p);
    var txt = 'Actual stress: ' + fStress(r.actualStress) + ' | FOS: ' + (isFinite(r.fos) ? r.fos.toFixed(2) : '∞');
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
  }
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    closeCtxMenu();
    var items = [
      ['Export PNG', exportPNG],
      ['Export CSV', exportCSV],
      ['Copy stress value', copyStress],
      ['Toggle stress map', function () { var c = document.getElementById('chk-stress'); if (c) { c.checked = !c.checked; c.dispatchEvent(new Event('change')); } }],
      ['Reset', resetAll]
    ];
    var menu = document.createElement('div');
    menu.className = 'canvas-ctx-menu';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = it[0];
      b.addEventListener('click', function () { it[1](); closeCtxMenu(); });
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    var mw = 180, mh = menu.offsetHeight || 200;
    var x = Math.min(e.clientX, window.innerWidth - mw - 8);
    var y = Math.min(e.clientY, window.innerHeight - mh - 8);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    ctxMenu = menu;
  });
  document.addEventListener('click', closeCtxMenu);
  document.addEventListener('scroll', closeCtxMenu, true);

  /* ================================================================
     SHOW-CALCULATION MODAL
     ================================================================ */

  function calcStep(num, title, formula, calculation, result) {
    var html = '<div class="cs-step"><div class="cs-step-hd">';
    html += '<span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula)     html += '<div class="cs-formula">' + formula + '</div>';
    if (calculation) html += '<div class="cs-calc">' + calculation + '</div>';
    if (result != null) html += '<div class="cs-result">→ <strong>' + result + '</strong></div>';
    html += '</div>';
    return html;
  }

  function buildCalcSteps() {
    var p = getParams(), r = calcWeld(p), mat = MATERIALS[matKey];
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Given &mdash; Current Simulation State</span><div class="cs-given">';
    html += '<span>Joint: ' + jointType + '</span><span>Load: ' + loadType + '</span><span>Material: ' + mat.name + '</span>';
    html += '<span>leg a = ' + p.leg + ' mm</span><span>L = ' + p.L + ' mm</span><span>t_plate = ' + p.t_plate + ' mm</span>';
    html += '<span>n = ' + r.nEff + '</span><span>P = ' + p.P + ' kN</span></div>';
    html += '<p class="cs-si-note">&#9432; All calculations in SI. Displayed readouts follow the SI / Imperial toggle.</p></div>';

    var step = 1;
    if (r.isFillet) {
      html += calcStep(step++, 'Throat thickness',
        '\\[ t = 0.707 \\, a \\]',
        '\\( t = 0.707 \\times ' + p.leg + ' \\)',
        rN(r.throat, 2) + ' mm');
      html += calcStep(step++, 'Effective length (crater allowance)',
        '\\[ L_{e} = L - 2a \\]',
        '\\( L_{e} = ' + p.L + ' - 2 \\times ' + p.leg + ' \\)',
        rN(r.effLen, 0) + ' mm');
      html += calcStep(step++, 'Throat area',
        '\\[ A = t \\, L_{e} \\, n \\]',
        '\\( A = ' + rN(r.throat, 2) + ' \\times ' + rN(r.effLen, 0) + ' \\times ' + r.nEff + ' \\)',
        rN(r.area, 0) + ' mm²');
      html += calcStep(step++, 'Allowable shear stress (AWS D1.1, fillet)',
        '\\[ \\tau_{allow} = 0.3 \\, \\sigma_{u} \\]',
        '\\( \\tau_{allow} = 0.3 \\times ' + mat.uts + ' \\)',
        rN(r.allowStress, 1) + ' MPa');
    } else {
      html += calcStep(step++, 'Effective throat',
        '\\[ t_{e} = ' + (jointType === 'butt-full' ? 't_{plate}' : '0.5 \\, t_{plate}') + ' \\]',
        '\\( t_{e} = ' + (jointType === 'butt-full' ? p.t_plate : '0.5 \\times ' + p.t_plate) + ' \\)',
        rN(r.throat, 1) + ' mm');
      html += calcStep(step++, 'Weld area',
        '\\[ A = t_{e} \\, L \\]',
        '\\( A = ' + rN(r.throat, 1) + ' \\times ' + p.L + ' \\)',
        rN(r.area, 0) + ' mm²');
      var fac = (loadType === 'shear') ? '0.4' : '0.6';
      html += calcStep(step++, 'Allowable stress (groove, ' + loadType + ')',
        '\\[ \\sigma_{allow} = ' + fac + ' \\, \\sigma_{y} \\]',
        '\\( \\sigma_{allow} = ' + fac + ' \\times ' + mat.sy + ' \\)',
        rN(r.allowStress, 1) + ' MPa');
    }

    if (r.stressSym === 'σ_eq') {
      var sg = (p.P * 1000 * 0.6) / r.area, tt = (p.P * 1000 * 0.4) / r.area;
      html += calcStep(step++, 'Combined (von Mises) stress — P resolved as 60% normal + 40% shear',
        '\\[ \\sigma = \\dfrac{0.6P}{A}, \\quad \\tau = \\dfrac{0.4P}{A}, \\quad \\sigma_{eq} = \\sqrt{\\sigma^2 + 3\\tau^2} \\]',
        '\\( \\sigma_{eq} = \\sqrt{' + rN(sg, 1) + '^2 + 3 \\times ' + rN(tt, 1) + '^2} \\)',
        rN(r.actualStress, 1) + ' MPa');
    } else {
      var symT = (r.stressSym === 'σ') ? '\\sigma' : '\\tau';
      html += calcStep(step++, 'Actual stress',
        '\\[ ' + symT + ' = \\dfrac{P}{A} \\]',
        '\\( ' + symT + ' = \\dfrac{' + (p.P * 1000) + '}{' + rN(r.area, 0) + '} \\)',
        rN(r.actualStress, 1) + ' MPa');
    }

    html += calcStep(step++, 'Factor of safety & verdict',
      '\\[ FOS = \\dfrac{\\sigma_{allow}}{\\sigma_{actual}} \\]',
      '\\( FOS = \\dfrac{' + rN(r.allowStress, 1) + '}{' + rN(r.actualStress, 1) + '} = '
        + (isFinite(r.fos) ? rN(r.fos, 2) : '\\infty') + ' \\)',
      (r.pass ? '✓ PASS' : '✗ FAIL') + ' — max load ' + rN(r.maxLoad, 1) + ' kN'
        + (r.belowMin ? ' (⚠ leg below AWS min ' + r.minLeg + ' mm)' : ''));
    return html;
  }

  function openCalcModal() {
    var modal = document.getElementById('calc-modal'), body = document.getElementById('calc-modal-body');
    if (!modal || !body) return;
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    var cb = document.getElementById('calc-modal-close'); if (cb) cb.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCalcModal() {
    var modal = document.getElementById('calc-modal'); if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    var b = document.getElementById('btn-calc'); if (b) b.focus();
  }
  var calcBtn = document.getElementById('btn-calc');
  if (calcBtn) calcBtn.addEventListener('click', openCalcModal);
  var calcClose = document.getElementById('calc-modal-close');
  if (calcClose) calcClose.addEventListener('click', closeCalcModal);
  var calcModalEl = document.getElementById('calc-modal');
  if (calcModalEl) calcModalEl.addEventListener('click', function (e) { if (e.target === calcModalEl) closeCalcModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && calcModalEl && calcModalEl.classList.contains('active')) closeCalcModal();
  });

  /* ================================================================
     LEARN PANELS
     ================================================================ */

  (function wireLearnPanels() {
    var expAll = document.getElementById('learn-expand-all');
    var colAll = document.getElementById('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  })();

  /* ================================================================
     UTILITIES
     ================================================================ */

  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function round0(n) { return Math.round(n); }
  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }

  /* ================================================================
     INIT
     ================================================================ */

  window.addEventListener('resize', resizeCanvas);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  }
  updateUnitLabels();
  updateJointControls();
  resizeCanvas();
  updateReadouts();

})();
