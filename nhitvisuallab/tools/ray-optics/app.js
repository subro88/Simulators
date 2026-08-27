(function () {
  'use strict';

  /* ── helpers ── */
  var $ = function (id) { return document.getElementById(id); };
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }

  /* ── DOM refs ── */
  var canvas  = $('sim-canvas');
  var ctx     = canvas.getContext('2d');
  var slU     = $('sl-u');
  var slH     = $('sl-h');
  var slF     = $('sl-f');
  var valU    = $('val-u');
  var valH    = $('val-h');
  var valF    = $('val-f');

  /* ── state ── */
  var state = {
    mode: 'simulate',
    optic: 'mirror',   // mirror | lens
    type: 'concave',   // concave | convex
    u: 30,             // object distance (positive value, placed left of optic)
    h: 10,             // object height cm
    f: 15,             // focal length (positive value)
    animProgress: 0,   // 0 → 1 for ray animation
    animating: false,
    raysTraced: false,
    dragObj: false,
    audioCtx: null,
    // computed
    v: null,
    m: null,
    imageH: null,
    practiceScore: 0,
    practiceTotal: 0,
    quizSet: [],
    quizIdx: 0,
    quizScore: 0,
    quizAnswers: [],
    quizLocked: false,
    exploreCat: 'basics'
  };

  /* ── canvas sizing ── */
  var W, H, dpr, originX, originY, pxPerCm;
  var lastHH = 0, lastCurv = 0;   // drawn optic half-height / arc depth (set in drawOptic)
  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width - 16;
    H = Math.max(300, Math.min(W * 0.45, 420));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // coordinate system: origin at optic centre
    originX = W * 0.58;   // optic element right of centre to give room for object
    originY = H * 0.5;
    // scale so that max slider range (90 cm) fits comfortably on the left side
    pxPerCm = (originX - 30) / 95;  // fills ~90% of the left half
  }

  /* ── coordinate transforms ── */
  function cmToX(cm) { return originX + cm * pxPerCm; }
  function cmToY(cm) { return originY - cm * pxPerCm; }
  function xToCm(px) { return (px - originX) / pxPerCm; }

  /* ── physics ── */
  function compute() {
    var u_signed, f_signed, v_signed;
    if (state.optic === 'mirror') {
      // Cartesian: u negative (object left of mirror), concave f negative, convex f positive
      u_signed = -state.u;
      f_signed = state.type === 'concave' ? -state.f : state.f;
      // 1/v + 1/u = 1/f  →  1/v = 1/f - 1/u
      var inv_v = (1 / f_signed) - (1 / u_signed);
      if (Math.abs(inv_v) < 1e-9) { state.v = null; state.m = null; state.imageH = null; return; }
      v_signed = 1 / inv_v;
    } else {
      // Lens: u negative, convex f positive, concave f negative
      u_signed = -state.u;
      f_signed = state.type === 'convex' ? state.f : -state.f;
      // 1/v - 1/u = 1/f  →  1/v = 1/f + 1/u
      var inv_v2 = (1 / f_signed) + (1 / u_signed);
      if (Math.abs(inv_v2) < 1e-9) { state.v = null; state.m = null; state.imageH = null; return; }
      v_signed = 1 / inv_v2;
    }
    state.v = v_signed;
    // magnification: m = -v/u for mirrors, m = v/u for lenses
    if (state.optic === 'mirror') {
      state.m = -(v_signed / u_signed);
    } else {
      state.m = v_signed / u_signed;
    }
    state.imageH = state.m * state.h;
  }

  /* ── image nature ── */
  function getNature() {
    if (state.v === null) return { nature: 'At Infinity', orient: '—', size: '—' };
    var real, erect, mag;
    if (state.optic === 'mirror') {
      real = state.v < 0;  // negative v = same side as object = real
    } else {
      real = state.v > 0;  // positive v = opposite side from object = real
    }
    erect = state.m > 0;
    mag = Math.abs(state.m);
    return {
      nature: real ? 'Real' : 'Virtual',
      orient: erect ? 'Erect' : 'Inverted',
      size: mag > 1.01 ? 'Magnified' : mag < 0.99 ? 'Diminished' : 'Same Size'
    };
  }

  /* ── drawing ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // background grid
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    var gs = 20;
    for (var gx = 0; gx < W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    // principal axis
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(W, originY);
    ctx.stroke();
    ctx.setLineDash([]);

    // ruler markings on axis
    drawRuler();

    // draw optic element
    drawOptic();

    // draw focal points and labels
    drawFocalPoints();

    // draw object
    drawArrow(-state.u, 0, -state.u, state.h, '#ff5555', 2.5, true);
    // object label
    ctx.fillStyle = '#ff5555';
    ctx.font = '600 11px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText('Object', cmToX(-state.u), cmToY(state.h) - 10);

    // draw rays and image
    if (state.raysTraced) {
      if (state.v !== null) {
        drawRays();
        drawImage();
      } else {
        drawParallelRays(); // object at F — rays go parallel
      }
    } else if (state.animating) {
      if (state.v !== null) {
        drawAnimatedRays();
      } else {
        drawParallelRays();
      }
    }

    // Eye position hint — the observer must be where the emergent light actually
    // goes: in FRONT of a mirror (left), and BEYOND a lens (right). For a real
    // image the eye sits past the image, so the rays cross before reaching it.
    if (state.raysTraced && state.v !== null) {
      var info = getNature();
      var maxCm = xToCm(W - 24);
      if (state.optic === 'mirror') {
        drawEye(info.nature === 'Real' ? state.v - 14 : -state.u + 10);
      } else {
        drawEye(Math.min(info.nature === 'Real' ? state.v + 16 : 14, maxCm));
      }
    }

    // ray legend (top-left)
    if (state.raysTraced || state.animating) {
      drawLegend();
    }

    // axis labels
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'right';
    ctx.fillText('Principal Axis', W - 8, originY - 6);
  }

  function drawOptic() {
    // optic must be tall enough to contain the tallest ray (object tip or image tip)
    var maxObjPx = state.h * pxPerCm;
    var maxImgPx = state.imageH ? Math.abs(state.imageH) * pxPerCm : 0;
    var minHH = Math.max(maxObjPx, maxImgPx) + 20;
    var hh = Math.max(H * 0.35, minHH); // half-height of optic drawing
    ctx.lineWidth = 2.5;
    lastHH = hh;
    lastCurv = state.optic === 'mirror' ? hh * 0.25 : 0;

    if (state.optic === 'mirror') {
      // curved mirror at origin
      // CONCAVE mirror: reflecting surface is on the LEFT (facing object)
      //   The curve bows to the RIGHT (pole is at originX, C is to the left)
      //   Object sees a "cave" shape — concave means "hollowed inward"
      // CONVEX mirror: reflecting surface is on the LEFT (facing object)
      //   The curve bows to the LEFT (bulges toward the object)
      ctx.strokeStyle = '#80d8ff';
      ctx.beginPath();
      var curvature = hh * 0.25;
      if (state.type === 'concave') {
        // Concave: mirror bows RIGHT (away from object, into the "cave")
        // cp is to the RIGHT of originX
        var cp = originX + curvature;
        ctx.moveTo(originX, originY - hh);
        ctx.quadraticCurveTo(cp, originY, originX, originY + hh);
      } else {
        // Convex: mirror bows LEFT (toward the object, bulging outward)
        // cp is to the LEFT of originX
        var cp2 = originX - curvature;
        ctx.moveTo(originX, originY - hh);
        ctx.quadraticCurveTo(cp2, originY, originX, originY + hh);
      }
      ctx.stroke();

      // Reflective surface glow (subtle highlight on the reflecting side = LEFT)
      ctx.strokeStyle = 'rgba(128,216,255,.15)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      if (state.type === 'concave') {
        var cpGlow = originX + curvature;
        ctx.moveTo(originX, originY - hh);
        ctx.quadraticCurveTo(cpGlow, originY, originX, originY + hh);
      } else {
        var cpGlow2 = originX - curvature;
        ctx.moveTo(originX, originY - hh);
        ctx.quadraticCurveTo(cpGlow2, originY, originX, originY + hh);
      }
      ctx.stroke();

      // hatching on back of mirror (NON-reflecting side)
      // Concave: back is on the RIGHT (behind the concave surface)
      // Convex: back is on the RIGHT (the inside/concave side behind the convex bulge)
      ctx.strokeStyle = 'rgba(128,216,255,.3)';
      ctx.lineWidth = 1;
      var nHatch = 14;
      for (var i = 0; i < nHatch; i++) {
        var t = (i + 0.5) / nHatch;
        var y = originY - hh + t * 2 * hh;
        // sit exactly on the drawn arc: quadratic Bézier x(t) = 2t(1−t)·curvature
        var dx = opticDX(y);
        ctx.beginPath();
        ctx.moveTo(originX + dx + 2, y);
        ctx.lineTo(originX + dx + 10, y - 6);
        ctx.stroke();
      }

      // pole label — P is the point where the mirror meets the principal axis
      var poleX = originX + opticDX(originY);
      ctx.fillStyle = '#80d8ff';
      ctx.beginPath();
      ctx.arc(poleX, originY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'left';
      ctx.fillText('P', poleX + 6, originY - 6);
    } else {
      // lens: double-curved shape at origin
      ctx.strokeStyle = '#80d8ff';
      ctx.lineWidth = 2.5;
      if (state.type === 'convex') {
        // convex lens: thicker in middle
        ctx.beginPath();
        ctx.moveTo(originX, originY - hh);
        ctx.quadraticCurveTo(originX + hh * 0.2, originY, originX, originY + hh);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(originX, originY - hh);
        ctx.quadraticCurveTo(originX - hh * 0.2, originY, originX, originY + hh);
        ctx.stroke();
      } else {
        // concave lens: thinner in middle, thicker at edges
        // left surface curves inward (right)
        var edgeW = Math.max(8, hh * 0.06);
        ctx.beginPath();
        ctx.moveTo(originX - edgeW, originY - hh);
        ctx.quadraticCurveTo(originX + hh * 0.15, originY, originX - edgeW, originY + hh);
        ctx.stroke();
        // right surface curves inward (left)
        ctx.beginPath();
        ctx.moveTo(originX + edgeW, originY - hh);
        ctx.quadraticCurveTo(originX - hh * 0.15, originY, originX + edgeW, originY + hh);
        ctx.stroke();
        // thick edges (horizontal bars at top and bottom)
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originX - edgeW, originY - hh);
        ctx.lineTo(originX + edgeW, originY - hh);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(originX - edgeW, originY + hh);
        ctx.lineTo(originX + edgeW, originY + hh);
        ctx.stroke();
      }
      // arrowheads on lens tips
      if (state.type === 'convex') {
        drawLensArrow(originX, originY - hh, true);
        drawLensArrow(originX, originY + hh, true);
      }
      // concave lens has flat edges with bars — no arrowheads needed

      // optical centre label — O lies on the axis, at the centre of the lens
      ctx.fillStyle = '#80d8ff';
      ctx.beginPath();
      ctx.arc(originX, originY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'left';
      ctx.fillText('O', originX + 6, originY - 6);
    }
  }

  function drawLensArrow(x, y, isConvex) {
    var sz = 6;
    ctx.fillStyle = '#80d8ff';
    ctx.beginPath();
    if (isConvex) {
      // outward arrows at tips
      ctx.moveTo(x - sz, y + (y < originY ? sz : -sz));
      ctx.lineTo(x, y);
      ctx.lineTo(x + sz, y + (y < originY ? sz : -sz));
    } else {
      ctx.moveTo(x - sz, y + (y < originY ? -sz : sz));
      ctx.lineTo(x, y);
      ctx.lineTo(x + sz, y + (y < originY ? -sz : sz));
    }
    ctx.fill();
  }

  function drawFocalPoints() {
    var pts;
    if (state.optic === 'mirror') {
      if (state.type === 'concave') {
        pts = [
          { cm: -state.f, label: 'F' },
          { cm: -2 * state.f, label: 'C' }
        ];
      } else {
        pts = [
          { cm: state.f, label: 'F' },
          { cm: 2 * state.f, label: 'C' }
        ];
      }
    } else {
      // lens: focal points on both sides
      if (state.type === 'convex') {
        pts = [
          { cm: -state.f, label: 'F₁' },
          { cm: state.f, label: 'F₂' },
          { cm: -2 * state.f, label: '2F₁' },
          { cm: 2 * state.f, label: '2F₂' }
        ];
      } else {
        // Concave lens: both focal points are virtual
        // F₁ on object side (left, negative), F₂ on other side (right, positive)
        // But for concave lens, F₁ is where parallel rays APPEAR to diverge from
        // Standard: F₁ = same side as incident light = left = -f (virtual)
        //           F₂ = other side = +f (virtual)
        pts = [
          { cm: -state.f, label: 'F₁' },
          { cm: state.f, label: 'F₂' },
          { cm: -2 * state.f, label: '2F₁' },
          { cm: 2 * state.f, label: '2F₂' }
        ];
      }
    }

    pts.forEach(function (p) {
      var px = cmToX(p.cm);
      if (px < 10 || px > W - 10) return;
      // tick mark
      ctx.strokeStyle = 'rgba(245,200,66,.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, originY - 6);
      ctx.lineTo(px, originY + 6);
      ctx.stroke();
      // label
      ctx.fillStyle = '#f5c842';
      ctx.font = '600 10px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText(p.label, px, originY + 20);
    });
  }

  function drawArrow(x1cm, y1cm, x2cm, y2cm, color, lw, filled) {
    var ax = cmToX(x1cm), ay = cmToY(y1cm);
    var bx = cmToX(x2cm), by = cmToY(y2cm);

    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // arrowhead at (bx, by)
    var angle = Math.atan2(by - ay, bx - ax);
    var sz = filled ? 10 : 7;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - sz * Math.cos(angle - 0.4), by - sz * Math.sin(angle - 0.4));
    ctx.lineTo(bx - sz * Math.cos(angle + 0.4), by - sz * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  function drawImage() {
    if (state.v === null || state.imageH === null) return;
    var imgX;
    if (state.optic === 'mirror') {
      imgX = state.v; // v negative = left of mirror (real), positive = right (virtual)
    } else {
      imgX = state.v; // v positive = right of lens (real), negative = left (virtual)
    }
    var info = getNature();
    var color = info.nature === 'Real' ? '#3ddc84' : 'rgba(61,220,132,.55)';
    var lw = info.nature === 'Real' ? 2.5 : 2;

    // draw dashed for virtual
    if (info.nature === 'Virtual') {
      ctx.setLineDash([5, 4]);
    }
    drawArrow(imgX, 0, imgX, state.imageH, color, lw, true);
    ctx.setLineDash([]);

    // image label
    ctx.fillStyle = color;
    ctx.font = '600 11px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    var labelY = state.imageH > 0 ? cmToY(state.imageH) - 10 : cmToY(state.imageH) + 16;
    ctx.fillText('Image (' + info.nature + ')', cmToX(imgX), labelY);
  }

  /* ── Ray tracing ── */
  // The paraxial construction treats the optic as a plane at x = 0, but a mirror
  // is DRAWN as an arc. opticDX() gives the horizontal offset of that arc at a
  // given screen height so rays visibly land on the reflecting surface instead of
  // stopping short of it (lenses stay on the plane, offset 0).
  function opticDX(yPx) {
    if (state.optic !== 'mirror' || !lastHH) return 0;
    var t = (yPx - (originY - lastHH)) / (2 * lastHH);
    if (t < 0 || t > 1) return 0;
    var dir = state.type === 'concave' ? 1 : -1;
    return dir * lastCurv * 2 * t * (1 - t);   // quadratic Bézier x(t)
  }
  // Screen x of a ray point, snapped to the optic surface when it sits at x = 0
  function sx(p) {
    return cmToX(p.x) + (Math.abs(p.x) < 1e-6 ? opticDX(cmToY(p.y)) : 0);
  }

  // Helper: find y where a line from (x1,y1) to (x2,y2) crosses x=0
  function yAtX0(x1, y1, x2, y2) {
    if (Math.abs(x2 - x1) < 1e-9) return y1;
    return y1 + (y2 - y1) * (0 - x1) / (x2 - x1);
  }
  // Helper: extend a ray from (x0,y0) with slope dy/dx to a given x
  function extendRay(x0, y0, slope, targetX) {
    return { x: targetX, y: y0 + slope * (targetX - x0) };
  }

  function getRays() {
    var rays = [];
    var objX = -state.u;  // object position (negative, left of optic)
    var objY = state.h;   // object tip height (positive, above axis)
    var imgX = state.v;   // image position (computed)
    var imgY = state.imageH;
    var f = state.f;      // positive focal length magnitude
    var extendDist = Math.max(state.u * 1.5, f * 4, 60); // how far to extend rays

    if (state.optic === 'mirror') {
      /*
       * MIRROR RAY TRACING (Cartesian sign convention)
       * Mirror is at x=0. Object is at x = objX (negative).
       * Concave: F at x = -f, C at x = -2f (in front of mirror, same side as object)
       * Convex: F at x = +f, C at x = +2f (behind mirror, virtual)
       *
       * All rays start from object tip, hit mirror at x=0, then reflect BACK to
       * the left (light cannot pass through a mirror). Where the reflected rays
       * cross is the real image; where their backward extensions cross is the
       * virtual image.
       */
      var fX = state.type === 'concave' ? -f : f;   // focal point x-coordinate
      var cX = 2 * fX;                                // centre of curvature x-coordinate

      // ── Ray 1: Parallel to axis ──
      // Incident: horizontal from object tip to mirror at (0, objY)
      // Reflected: passes through F (concave) or diverges as if from F (convex)
      var r1 = [{ x: objX, y: objY }, { x: 0, y: objY }];
      var slope1 = (0 - objY) / (fX - 0);  // slope of the line through (0,objY) and F
      r1.push(extendRay(0, objY, slope1, -extendDist));
      rays.push({ segments: r1, color: '#ff6b6b' });

      // ── Ray 2: Through C (or aimed at C for convex) ──
      // Hits the mirror along the normal → reflects back along the SAME line.
      // Degenerate when the object sits exactly at C: use the pole ray instead,
      // which reflects symmetrically about the principal axis.
      var r2, atC = Math.abs(cX - objX) < 1e-6;
      if (atC) {
        var slopePole = (0 - objY) / (0 - objX);      // object tip → pole (0,0)
        r2 = [{ x: objX, y: objY }, { x: 0, y: 0 }];
        r2.push(extendRay(0, 0, -slopePole, -extendDist));  // reflected about the axis
      } else {
        var slope2inc = (0 - objY) / (cX - objX);     // slope of the object→C line
        var yHit2 = yAtX0(objX, objY, cX, 0);         // y where it meets the mirror
        r2 = [{ x: objX, y: objY }, { x: 0, y: yHit2 }];
        // Retraces itself: the reflected ray lies on the same straight line
        r2.push(extendRay(0, yHit2, slope2inc, -extendDist));
      }
      rays.push({ segments: r2, color: '#ffd93d' });

      // ── Ray 3: Through F (or aimed at F for convex) → reflects parallel ──
      var yHit3 = yAtX0(objX, objY, fX, 0);
      var r3 = [{ x: objX, y: objY }, { x: 0, y: yHit3 }];
      // Reflected: parallel to axis (horizontal), travelling back to the left
      r3.push({ x: -extendDist, y: yHit3 });
      rays.push({ segments: r3, color: '#e040fb' });

    } else {
      /*
       * LENS RAY TRACING (Cartesian sign convention)
       * Lens is at x=0. Object is at x = objX (negative). Light always continues
       * to the RIGHT after refraction — for a diverging lens the emergent rays
       * spread apart, and it is their backward extensions (drawn dashed) that
       * meet at the virtual image.
       *
       * fImage  = the focal point a ray parallel to the axis is directed at —
       *           through it for a convex lens (+f), away from it for a concave
       *           lens (-f, i.e. the focus on the incoming side).
       * fObject = the focal point a ray must be aimed at to emerge parallel to
       *           the axis (convex -f, concave +f).
       */
      var fImage  = state.type === 'convex' ?  f : -f;
      var fObject = state.type === 'convex' ? -f :  f;

      // ── Ray 1: Parallel to axis → refracts through (or away from) F₂ ──
      var l1 = [{ x: objX, y: objY }, { x: 0, y: objY }];
      var slope1L = (0 - objY) / (fImage - 0);
      l1.push(extendRay(0, objY, slope1L, extendDist));
      rays.push({ segments: l1, color: '#ff6b6b' });

      // ── Ray 2: Through optical centre → goes straight (undeviated) ──
      var slope2L = (0 - objY) / (0 - objX);
      var l2 = [{ x: objX, y: objY }, { x: 0, y: 0 }];
      l2.push(extendRay(0, 0, slope2L, extendDist));
      rays.push({ segments: l2, color: '#ffd93d' });

      // ── Ray 3: Aimed at F₁ → refracts parallel to the axis ──
      var yHit3L = yAtX0(objX, objY, fObject, 0);
      var l3 = [{ x: objX, y: objY }, { x: 0, y: yHit3L }];
      l3.push({ x: extendDist, y: yHit3L });
      rays.push({ segments: l3, color: '#e040fb' });
    }

    return rays;
  }

  function drawRays() {
    var rays = getRays();
    var isVirtual = state.v !== null && getNature().nature === 'Virtual';

    rays.forEach(function (ray) {
      ctx.strokeStyle = ray.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      for (var i = 0; i < ray.segments.length - 1; i++) {
        var a = ray.segments[i];
        var b = ray.segments[i + 1];

        // Every segment here is real light — incident and emergent alike — so it
        // is drawn solid. Only the backward extensions below are dashed.
        var ax = sx(a), ay = cmToY(a.y);
        var bx = sx(b), by = cmToY(b.y);

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // small arrowhead in middle of segment
        var mx = (ax + bx) / 2;
        var my = (ay + by) / 2;
        var ang = Math.atan2(by - ay, bx - ax);
        ctx.fillStyle = ray.color;
        ctx.beginPath();
        ctx.moveTo(mx + 5 * Math.cos(ang), my + 5 * Math.sin(ang));
        ctx.lineTo(mx - 4 * Math.cos(ang - 0.5), my - 4 * Math.sin(ang - 0.5));
        ctx.lineTo(mx - 4 * Math.cos(ang + 0.5), my - 4 * Math.sin(ang + 0.5));
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    // For a virtual image the emergent rays never meet. Trace each one BACKWARDS
    // (dashed, in the ray's own colour) from where it left the optic to the point
    // the rays only appear to come from — the virtual image tip.
    if (isVirtual && state.v !== null) {
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([4, 4]);
      rays.forEach(function (ray) {
        var hitPt = ray.segments.length > 1 ? ray.segments[1] : ray.segments[0];
        ctx.strokeStyle = ray.color;
        ctx.beginPath();
        ctx.moveTo(sx(hitPt), cmToY(hitPt.y));
        ctx.lineTo(cmToX(state.v), cmToY(state.imageH));
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  function drawAnimatedRays() {
    var rays = getRays();
    var t = state.animProgress;
    rays.forEach(function (ray) {
      ctx.strokeStyle = ray.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;

      var totalLen = 0;
      var segLens = [];
      for (var i = 0; i < ray.segments.length - 1; i++) {
        var a = ray.segments[i], b = ray.segments[i + 1];
        var dx = sx(b) - sx(a);
        var dy = cmToY(b.y) - cmToY(a.y);
        var len = Math.sqrt(dx * dx + dy * dy);
        segLens.push(len);
        totalLen += len;
      }

      var drawn = t * totalLen;
      var acc = 0;
      for (var j = 0; j < segLens.length; j++) {
        if (drawn <= 0) break;
        var a2 = ray.segments[j], b2 = ray.segments[j + 1];
        var ax2 = sx(a2), ay2 = cmToY(a2.y);
        var bx2 = sx(b2), by2 = cmToY(b2.y);
        var frac = Math.min(drawn / segLens[j], 1);

        ctx.beginPath();
        ctx.moveTo(ax2, ay2);
        ctx.lineTo(ax2 + (bx2 - ax2) * frac, ay2 + (by2 - ay2) * frac);
        ctx.stroke();
        ctx.setLineDash([]);

        drawn -= segLens[j];
      }
      ctx.globalAlpha = 1;
    });
  }

  /* ── special case: object at F → parallel rays ── */
  function drawParallelRays() {
    var objX = -state.u;          // = ±f: the object tip sits in the focal plane
    var objY = state.h;
    var colors = ['#ff6b6b', '#ffd93d', '#e040fb'];
    var isMirror = state.optic === 'mirror';

    // Focal point the parallel-to-axis ray is directed at (mirror F, or lens F₂)
    var fFocal = isMirror
      ? (state.type === 'concave' ? -state.f : state.f)
      : (state.type === 'convex' ? state.f : -state.f);

    // With the object tip in the focal plane every emergent ray leaves with the
    // SAME slope — they are parallel to one another, but tilted with respect to
    // the principal axis (the image is at infinity, off-axis).
    var mPar = -objY / fFocal;
    var endX = isMirror ? objX - 40 : 70;   // mirror reflects back left, lens carries on right

    // Three incident rays, taken by the height at which they meet the optic:
    //   objY   → the ray parallel to the principal axis
    //   2·objY → the ray whose line passes through C (mirror) or 2F₁ (lens)
    //   0      → the ray aimed at the pole / optical centre
    [objY, 2 * objY, 0].forEach(function (hitY, i) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      var hx = cmToX(0) + opticDX(cmToY(hitY));

      // incident ray
      ctx.beginPath();
      ctx.moveTo(cmToX(objX), cmToY(objY));
      ctx.lineTo(hx, cmToY(hitY));
      ctx.stroke();

      // emergent ray — same slope for all three
      var endY = hitY + mPar * (endX - 0);
      ctx.beginPath();
      ctx.moveTo(hx, cmToY(hitY));
      ctx.lineTo(cmToX(endX), cmToY(endY));
      ctx.stroke();

      // arrowhead midway along the emergent ray
      var mx = (hx + cmToX(endX)) / 2;
      var my = (cmToY(hitY) + cmToY(endY)) / 2;
      var ang = Math.atan2(cmToY(endY) - cmToY(hitY), cmToX(endX) - hx);
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(mx + 5 * Math.cos(ang), my + 5 * Math.sin(ang));
      ctx.lineTo(mx - 4 * Math.cos(ang - 0.5), my - 4 * Math.sin(ang - 0.5));
      ctx.lineTo(mx - 4 * Math.cos(ang + 0.5), my - 4 * Math.sin(ang + 0.5));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // label
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '600 11px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText('Image at Infinity', cmToX(0), 20);
    ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillText('(emergent rays are parallel to each other — they never meet)', cmToX(0), 34);
  }

  function drawEye(posCm) {
    var ex = cmToX(posCm);
    var ey = originY - 25;
    if (ex < 20 || ex > W - 20) return;

    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.lineWidth = 1;

    // simple eye shape
    ctx.beginPath();
    ctx.ellipse(ex, ey, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // pupil
    ctx.fillStyle = 'rgba(0,176,255,.6)';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();

    // label
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = '9px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText('Eye', ex, ey - 12);
  }

  /* ── ruler on axis ── */
  function drawRuler() {
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.font = '9px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;
    // draw tick marks every 10 cm from -90 to +90
    for (var cm = -90; cm <= 90; cm += 10) {
      if (cm === 0) continue; // skip origin (optic is there)
      var px = cmToX(cm);
      if (px < 5 || px > W - 5) continue;
      var isMajor = cm % 20 === 0;
      var tickH = isMajor ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(px, originY + 1);
      ctx.lineTo(px, originY + 1 + tickH);
      ctx.stroke();
      if (isMajor) {
        ctx.fillText(Math.abs(cm), px, originY + 16);
      }
    }
  }

  /* ── ray legend ── */
  function drawLegend() {
    var x = 10, y = 14;
    var items = [
      { color: '#ff6b6b', label: 'Parallel Ray' },
      { color: '#ffd93d', label: state.optic === 'mirror' ? 'Centre Ray' : 'Centre Ray' },
      { color: '#e040fb', label: 'Focal Ray' }
    ];
    ctx.font = '600 9px ' + getComputedStyle(document.body).fontFamily;
    items.forEach(function (item, i) {
      var ly = y + i * 14;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, ly);
      ctx.lineTo(x + 18, ly);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 22, ly + 3);
    });
  }

  /* ── update UI ── */
  function updateUI() {
    compute();

    // slider values
    valU.textContent = state.u;
    valH.textContent = state.h;
    valF.textContent = state.f;

    // badges
    $('rb-u').textContent = '−' + state.u;
    $('rb-f').textContent = (state.optic === 'mirror' ? (state.type === 'concave' ? '−' : '+') : (state.type === 'convex' ? '+' : '−')) + state.f;

    if (state.raysTraced && state.v !== null) {
      $('rb-v').textContent = roundN(state.v, 1);
      $('rb-m').textContent = roundN(state.m, 2);
      var info = getNature();
      $('rb-nature').textContent = info.nature + ', ' + info.orient;
    } else if (state.raysTraced && state.v === null) {
      $('rb-v').textContent = '∞';
      $('rb-m').textContent = '∞';
      $('rb-nature').textContent = 'At Infinity';
    } else {
      $('rb-v').textContent = '—';
      $('rb-m').textContent = '—';
      $('rb-nature').textContent = '—';
    }

    // formula panel
    if (state.optic === 'mirror') {
      $('formula-label').textContent = 'Mirror';
      $('formula-expr').textContent = '1/f = 1/v + 1/u';
    } else {
      $('formula-label').textContent = 'Lens';
      $('formula-expr').textContent = '1/f = 1/v − 1/u';
    }
    if (state.v !== null && state.raysTraced) {
      var fSigned = state.optic === 'mirror' ?
        (state.type === 'concave' ? -state.f : state.f) :
        (state.type === 'convex' ? state.f : -state.f);
      // The mirror equation adds 1/u, the lens equation subtracts it — the panel
      // must show the same operator it prints above, or the arithmetic is false.
      var frac = function (x) { var r = roundN(x, 1); return r < 0 ? '1/(' + r + ')' : '1/' + r; };
      var op = state.optic === 'mirror' ? ' + ' : ' − ';
      $('formula-result').textContent = frac(fSigned) + ' = ' + frac(state.v) + op + frac(-state.u) +
        '  →  v = ' + roundN(state.v, 1) + ' cm';
    } else {
      $('formula-result').textContent = '—';
    }

    // info cells
    $('iv-u').textContent = state.u + ' cm';
    $('iv-f').textContent = state.f + ' cm';
    if (state.raysTraced && state.v !== null) {
      var info2 = getNature();
      $('iv-v').textContent = roundN(Math.abs(state.v), 1) + ' cm';
      $('iv-m').textContent = roundN(Math.abs(state.m), 2) + '×';
      $('iv-nature').textContent = info2.nature;
      $('iv-orient').textContent = info2.orient + ' / ' + info2.size;
    } else if (state.raysTraced && state.v === null) {
      $('iv-v').textContent = '∞';
      $('iv-m').textContent = '∞';
      $('iv-nature').textContent = 'At Infinity';
      $('iv-orient').textContent = 'Parallel rays';
    } else {
      $('iv-v').textContent = '—';
      $('iv-m').textContent = '—';
      $('iv-nature').textContent = '—';
      $('iv-orient').textContent = '—';
    }

    // student-friendly description
    updateDescription();

    draw();
  }

  function updateDescription() {
    var el = $('desc-text');
    if (!el) return;
    if (!state.raysTraced) {
      el.innerHTML = 'Adjust the sliders and press <strong>Trace Rays</strong> to see how the image forms.';
      return;
    }
    if (state.v === null) {
      // object sits in the focal plane — the emergent rays never meet
      el.innerHTML = 'The object is placed <strong>at the focal point (F)</strong>, so every ray leaves the ' +
        state.optic + ' parallel to the others. They never converge and the image forms ' +
        '<span class="desc-highlight">at infinity</span> — infinitely large, and impossible to catch on a screen.';
      return;
    }
    var info = getNature();
    var opticName = state.type.charAt(0).toUpperCase() + state.type.slice(1) + ' ' + state.optic;
    var pos = getPositionDesc();
    var sizeWord = info.size.toLowerCase();
    var sizePhrase = sizeWord === 'same size'
      ? 'the <strong>same size</strong> as the object'
      : '<strong>' + sizeWord + '</strong> compared to the object';
    var desc = '';

    if (info.nature === 'Real') {
      desc = 'The <strong>' + opticName + '</strong> forms a <span class="desc-highlight">real, ' + info.orient.toLowerCase() + '</span> image. ';
      desc += 'The image appears ' + pos + ' and is ' + sizePhrase + '. ';
      desc += 'Since it is a real image, it can be captured on a screen placed at the image position.';
    } else {
      desc = 'The <strong>' + opticName + '</strong> forms a <span class="desc-highlight">virtual, ' + info.orient.toLowerCase() + '</span> image. ';
      desc += 'The image appears ' + pos + ' and is ' + sizePhrase + '. ';
      desc += 'Since it is virtual, it cannot be projected on a screen — you can only see it by looking into the ' + state.optic + '.';
    }

    // special cases — only for optics where F/C are on object side
    var hasRealF = (state.optic === 'mirror' && state.type === 'concave') ||
                   (state.optic === 'lens' && state.type === 'convex');
    if (hasRealF && Math.abs(state.u - 2 * state.f) < 1) {
      // A lens has no centre of curvature — that landmark belongs to mirrors only
      var landmark = state.optic === 'mirror' ? 'the centre of curvature (C)' : '2F₁';
      var imgLandmark = state.optic === 'mirror' ? 'C' : '2F₂';
      desc += ' <strong>Special case:</strong> object at ' + landmark + ' — the image forms at ' +
              imgLandmark + ', the same size but inverted.';
    }

    el.innerHTML = desc;
  }

  function getPositionDesc() {
    if (state.v === null) return '';
    var absV = Math.abs(state.v);
    // Exact landmarks are tested FIRST — otherwise an image sitting precisely at
    // C (or 2F₂) is swallowed by the surrounding "between …" range.
    if (state.optic === 'mirror') {
      if (state.v < 0) {
        // real image: always in front of the mirror, at or beyond F
        if (Math.abs(absV - state.f) < 1) return 'at the focus (F)';
        if (Math.abs(absV - 2 * state.f) < 1) return 'at the centre of curvature (C)';
        if (absV < 2 * state.f) return 'between the focus (F) and centre of curvature (C)';
        return 'beyond the centre of curvature (C)';
      } else {
        return 'behind the mirror (virtual side)';
      }
    } else {
      if (state.v > 0) {
        // real image, opposite side of lens
        if (Math.abs(absV - state.f) < 1) return 'at F₂';
        if (Math.abs(absV - 2 * state.f) < 1) return 'at 2F₂';
        if (absV < 2 * state.f) return 'between F₂ and 2F₂';
        return 'beyond 2F₂';
      } else {
        return 'on the same side as the object (virtual side)';
      }
    }
  }

  /* ── animation ── */
  function animateRays() {
    state.animating = true;
    state.raysTraced = false;
    state.animProgress = 0;
    playClick();

    var start = null;
    var duration = 1200;
    function step(ts) {
      if (!start) start = ts;
      state.animProgress = Math.min((ts - start) / duration, 1);
      draw();
      if (state.animProgress < 1) {
        requestAnimationFrame(step);
      } else {
        state.animating = false;
        state.raysTraced = true;
        playSuccess();
        updateUI();
      }
    }
    requestAnimationFrame(step);
  }

  /* ── sound ── */
  function getAudioCtx() {
    if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return state.audioCtx;
  }
  function playTone(freq, dur, type, vol) {
    try {
      var ac = getAudioCtx();
      var o = ac.createOscillator();
      var g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = vol || 0.08;
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + dur);
    } catch (e) { /* silent fail */ }
  }
  function playClick()   { playTone(800, 0.05, 'square', 0.04); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.1); setTimeout(function () { playTone(1100, 0.15, 'sine', 0.1); }, 120); }
  function playError()   { playTone(300, 0.2, 'sawtooth', 0.06); }

  /* ── slider events ── */
  function syncSlider(sl, valEl, key, isFloat) {
    sl.addEventListener('input', function () {
      state[key] = isFloat ? parseFloat(sl.value) : parseInt(sl.value, 10);
      if ($('chk-live') && $('chk-live').checked) {
        compute();
        state.raysTraced = true;
        state.animating = false;
      } else {
        state.raysTraced = false;
        state.animating = false;
      }
      updateUI();
    });
    // stepper buttons
    document.querySelectorAll('.stepper-btn[data-target="' + sl.id + '"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = isFloat ? parseFloat(sl.step || 0.5) : parseInt(sl.step || 1, 10);
        var dir = parseInt(btn.dataset.dir, 10);
        var newVal = (isFloat ? parseFloat(sl.value) : parseInt(sl.value, 10)) + dir * step;
        newVal = clamp(newVal, parseFloat(sl.min), parseFloat(sl.max));
        sl.value = newVal;
        state[key] = newVal;
        if ($('chk-live') && $('chk-live').checked) {
          compute(); state.raysTraced = true; state.animating = false;
        } else {
          state.raysTraced = false; state.animating = false;
        }
        playClick();
        updateUI();
      });
    });
    // click value label to edit
    valEl.style.cursor = 'pointer';
    valEl.title = 'Click to type a value';
    valEl.addEventListener('click', function () {
      var old = valEl.textContent;
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.value = old;
      inp.step = sl.step || (isFloat ? '0.5' : '1');
      inp.min = sl.min;
      inp.max = sl.max;
      inp.style.cssText = 'width:50px;background:transparent;border:1px solid var(--accent);color:var(--accent);font-family:var(--mono);font-size:.85rem;font-weight:700;text-align:center;border-radius:4px;padding:2px;';
      valEl.textContent = '';
      valEl.appendChild(inp);
      inp.focus();
      inp.select();
      function commit() {
        var v = isFloat ? parseFloat(inp.value) : parseInt(inp.value, 10);
        if (isNaN(v)) v = parseFloat(old);
        v = clamp(v, parseFloat(sl.min), parseFloat(sl.max));
        sl.value = v;
        state[key] = v;
        state.raysTraced = false;
        state.animating = false;
        valEl.textContent = v;
        updateUI();
      }
      inp.addEventListener('blur', commit);
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { inp.blur(); }
        if (e.key === 'Escape') { valEl.textContent = old; }
      });
    });
  }

  syncSlider(slU, valU, 'u', false);
  syncSlider(slH, valH, 'h', true);
  syncSlider(slF, valF, 'f', false);

  /* ── drag object on canvas ── */
  canvas.addEventListener('pointerdown', function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (W / rect.width);
    var objPx = cmToX(-state.u);
    if (Math.abs(mx - objPx) < 25) {
      e.preventDefault();
      state.dragObj = true;
      playClick();
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!state.dragObj) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (W / rect.width);
    var newU = -xToCm(mx);
    newU = clamp(Math.round(newU), parseInt(slU.min, 10), parseInt(slU.max, 10));
    // snap to F or 2F if within 3 cm
    if (Math.abs(newU - state.f) <= 3) { newU = state.f; playTone(600, 0.03, 'sine', 0.03); }
    else if (Math.abs(newU - 2 * state.f) <= 3) { newU = 2 * state.f; playTone(600, 0.03, 'sine', 0.03); }
    state.u = newU;
    slU.value = newU;
    if ($('chk-live') && $('chk-live').checked) {
      compute(); state.raysTraced = true; state.animating = false;
    } else {
      state.raysTraced = false; state.animating = false;
    }
    updateUI();
  });
  canvas.addEventListener('pointerup', function () { state.dragObj = false; });

  /* ── mode switching ── */
  var modeTabs = document.querySelectorAll('#mode-tabs .pill');
  modeTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      modeTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.mode = tab.dataset.mode;
      ['simulate', 'explore', 'practice', 'quiz'].forEach(function (m) {
        var sec = $('sec-' + m);
        if (sec) sec.style.display = m === state.mode ? '' : 'none';
      });
      // hide badges in practice/quiz
      $('readout-badges').style.display = (state.mode === 'practice' || state.mode === 'quiz') ? 'none' : '';
      if (state.mode === 'explore') renderExplore();
      playClick();
    });
  });

  /* ── optic / type switching ── */
  document.querySelectorAll('#optic-tabs .pill[data-optic]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('#optic-tabs .pill').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.optic = tab.dataset.optic;
      state.raysTraced = false;
      state.animating = false;
      playClick();
      updatePresets();
      updateUI();
    });
  });
  document.querySelectorAll('#type-tabs .pill[data-type]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('#type-tabs .pill').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.type = tab.dataset.type;
      state.raysTraced = false;
      state.animating = false;
      playClick();
      updatePresets();
      updateUI();
    });
  });

  /* ── buttons ── */
  $('btn-run').addEventListener('click', function () { compute(); animateRays(); });
  $('btn-reset').addEventListener('click', function () {
    state.u = 30; state.h = 10; state.f = 15;
    slU.value = 30; slH.value = 10; slF.value = 15;
    state.raysTraced = false; state.animating = false;
    playClick();
    updateUI();
  });

  /* ── context menu ── */
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var menu = $('ctx-menu');
    var rect = canvas.parentElement.getBoundingClientRect();
    menu.style.left = (e.clientX - rect.left) + 'px';
    menu.style.top = (e.clientY - rect.top) + 'px';
    menu.style.display = 'block';
  });
  document.addEventListener('click', function () { $('ctx-menu').style.display = 'none'; });
  document.querySelectorAll('.ctx-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.dataset.action;
      if (action === 'save-img') {
        var tmp = document.createElement('canvas');
        tmp.width = canvas.width; tmp.height = canvas.height;
        var tc = tmp.getContext('2d');
        tc.drawImage(canvas, 0, 0);
        var fs = Math.round(tmp.width * 0.022); if (fs < 10) fs = 10;
        tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
        tc.textAlign = 'right'; tc.textBaseline = 'bottom';
        tc.fillStyle = 'rgba(255,255,255,0.25)';
        tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
        var a = document.createElement('a');
        a.href = tmp.toDataURL('image/png');
        a.download = 'ray_optics_' + state.optic + '_' + state.type + '.png';
        a.click();
      } else if (action === 'export-csv') {
        var csvInfo = getNature();
        var csv = 'Parameter,Value\n';
        csv += 'Optic,' + state.optic + ' (' + state.type + ')\n';
        csv += 'Object Distance u (cm),' + state.u + '\n';
        csv += 'Object Height h (cm),' + state.h + '\n';
        csv += 'Focal Length f (cm),' + state.f + '\n';
        if (state.v !== null) {
          csv += 'Image Distance v (cm),' + roundN(state.v, 2) + '\n';
          csv += 'Magnification m,' + roundN(state.m, 3) + '\n';
          csv += 'Image Height (cm),' + roundN(state.imageH, 2) + '\n';
          csv += 'Nature,' + csvInfo.nature + '\n';
          csv += 'Orientation,' + csvInfo.orient + '\n';
          csv += 'Size,' + csvInfo.size + '\n';
        }
        var blob = new Blob([csv], { type: 'text/csv' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ray_optics_' + state.optic + '_' + state.type + '.csv';
        a.click();
      } else if (action === 'copy-data') {
        var info = getNature();
        var txt = state.optic + ' (' + state.type + ')\n';
        txt += 'u = ' + state.u + ' cm, f = ' + state.f + ' cm\n';
        if (state.v !== null) {
          txt += 'v = ' + roundN(state.v, 2) + ' cm, m = ' + roundN(state.m, 3) + '\n';
          txt += 'Image: ' + info.nature + ', ' + info.orient + ', ' + info.size;
        }
        navigator.clipboard.writeText(txt);
      } else if (action === 'reset') {
        $('btn-reset').click();
      }
    });
  });

  /* ── preset scenarios ── */
  function updatePresets() {
    // Presets only apply to concave mirror and convex lens (where F/C are on object side)
    var show = (state.optic === 'mirror' && state.type === 'concave') ||
               (state.optic === 'lens' && state.type === 'convex');
    $('preset-row').style.display = show ? '' : 'none';
  }

  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var preset = btn.dataset.preset;
      if (preset === 'at-f')       { state.u = state.f; }
      else if (preset === 'at-2f') { state.u = 2 * state.f; }
      else if (preset === 'beyond-2f') { state.u = Math.min(3 * state.f, 90); }
      else if (preset === 'between-fp') { state.u = Math.max(Math.round(state.f * 0.6), 5); }
      state.u = clamp(state.u, 5, 90);
      slU.value = state.u;
      playClick();
      compute();
      animateRays();
    });
  });

  /* ═══════════ EXPLORE ═══════════ */
  var EXPLORE = {
    basics: [
      { title: 'What Is Ray Optics?', body: 'Ray optics (geometric optics) describes light as straight-line rays that reflect off mirrors and refract through lenses. It accurately predicts image formation when the optical elements are much larger than the wavelength of light (~500 nm).', note: 'Ray optics breaks down for very small apertures — that is the domain of wave optics (diffraction).' },
      { title: 'Reflection vs Refraction', body: 'Reflection occurs when light bounces off a surface (mirrors). The angle of incidence equals the angle of reflection. Refraction occurs when light passes from one medium to another (lenses), bending according to Snell\'s law: n₁ sin θ₁ = n₂ sin θ₂.', formula: 'Snell\'s Law: n₁ sin θ₁ = n₂ sin θ₂' },
      { title: 'Real vs Virtual Images', body: 'A real image forms where light rays actually converge — it can be captured on a screen. A virtual image forms where rays appear to diverge from — it can only be seen by looking into the optical element, not projected. Concave mirrors and convex lenses produce real images when the object is beyond the focal point.' },
      { title: 'Sign Convention (Cartesian)', body: 'All distances are measured from the pole (mirror) or optical centre (lens). Distances in the direction of incident light are positive, against it are negative. Object distance u is always negative. For concave mirrors f is negative; for convex mirrors f is positive. For convex lenses f is positive; for concave lenses f is negative.', note: 'This simulator uses the New Cartesian Sign Convention, standard in most modern physics curricula.' }
    ],
    mirrors: [
      { title: 'Concave Mirror', body: 'A concave (converging) mirror curves inward. Parallel rays converge at the focal point F. Depending on object position, it can produce real inverted images (object beyond F) or virtual erect magnified images (object between F and P).', formula: '1/f = 1/v + 1/u' },
      { title: 'Convex Mirror', body: 'A convex (diverging) mirror curves outward. It always produces virtual, erect, diminished images regardless of object position. This makes it ideal for rear-view mirrors and security mirrors — it provides a wide field of view.', note: 'Image always forms between P and F behind the mirror.' },
      { title: 'Five Cases of Concave Mirror', body: '1. Object at infinity → image at F (point, real, inverted)\n2. Object beyond C → image between F and C (diminished, real, inverted)\n3. Object at C → image at C (same size, real, inverted)\n4. Object between C and F → image beyond C (magnified, real, inverted)\n5. Object between F and P → image behind mirror (magnified, virtual, erect)' },
      { title: 'Centre of Curvature (C)', body: 'C is the centre of the sphere from which the mirror surface is cut. The radius of curvature R = 2f. A ray directed towards C reflects back on itself — this is the second principal ray used in ray tracing.', formula: 'R = 2f' }
    ],
    lenses: [
      { title: 'Convex Lens (Converging)', body: 'A convex lens is thicker at the centre. Parallel rays converge at the focal point on the far side. Like concave mirrors, convex lenses form real inverted images when the object is beyond F, and virtual erect magnified images when the object is between F and the lens.', formula: '1/f = 1/v − 1/u' },
      { title: 'Concave Lens (Diverging)', body: 'A concave lens is thinner at the centre. It always diverges light and produces virtual, erect, diminished images regardless of object position. Used in corrective lenses for myopia (short-sightedness).', note: 'The virtual image always forms between F and the lens on the same side as the object.' },
      { title: 'Power of a Lens', body: 'The power P of a lens is the reciprocal of its focal length in metres: P = 1/f (unit: dioptres, D). A convex lens has positive power, a concave lens has negative power. Opticians prescribe corrective lenses in dioptres.', formula: 'P = 1/f (dioptres)', example: 'A lens with f = 20 cm = 0.2 m has P = 1/0.2 = +5 D' },
      { title: 'Lens Maker\'s Equation', body: 'For a thin lens with refractive index n and radii of curvature R₁ and R₂: 1/f = (n − 1)(1/R₁ − 1/R₂). This relates the physical shape of the lens to its focal length.', formula: '1/f = (n − 1)(1/R₁ − 1/R₂)' }
    ],
    formulas: [
      { title: 'Mirror Equation', body: 'The mirror equation relates object distance u, image distance v, and focal length f. Using the Cartesian sign convention, all values carry their signs.', formula: '1/v + 1/u = 1/f', example: 'Concave mirror, f = −15 cm, u = −30 cm:\n1/v = 1/(−15) − 1/(−30) = −1/15 + 1/30 = −1/30\nv = −30 cm (real, same side as object)' },
      { title: 'Lens Equation', body: 'The thin lens equation differs from the mirror equation by a sign. For a thin lens in air, the object and image distances are related by:', formula: '1/v − 1/u = 1/f', example: 'Convex lens, f = +20 cm, u = −30 cm:\n1/v = 1/20 + 1/(−30) = 1/20 − 1/30 = 1/60\nv = +60 cm (real, opposite side)' },
      { title: 'Magnification', body: 'Linear magnification m is the ratio of image height to object height. The two optics differ by a minus sign: a mirror uses m = −v/u, a lens uses m = v/u. |m| > 1 means magnified, |m| < 1 means diminished. Negative m means the image is inverted, positive m means erect.', formula: 'Mirror: m = −v/u   |   Lens: m = v/u   |   both = hᵢ/hₒ', example: 'Concave mirror, v = −30 cm, u = −30 cm:\nm = −v/u = −(−30)/(−30) = −1 (same size, inverted)\n\nConvex lens, v = +30 cm, u = −30 cm:\nm = v/u = (+30)/(−30) = −1 (same size, inverted)', note: 'Forgetting the mirror\'s minus sign is the single most common exam slip — it flips erect and inverted.' },
      { title: 'Focal Length & Radius', body: 'For spherical mirrors, the focal length is half the radius of curvature. This holds for paraxial rays (rays close to and nearly parallel to the principal axis).', formula: 'f = R/2' }
    ],
    applications: [
      { title: 'Telescopes', body: 'Reflecting telescopes (like Newton\'s) use a large concave mirror as the primary reflector to gather light from distant objects. Refracting telescopes use convex lenses. The magnification depends on the ratio of focal lengths of the objective and eyepiece.' },
      { title: 'Cameras & Eyes', body: 'A camera lens (convex) forms a real, inverted, diminished image on the sensor/film. The human eye works similarly — the cornea and crystalline lens form a real image on the retina. Accommodation changes the lens curvature to focus at different distances.' },
      { title: 'Corrective Lenses', body: 'Myopia (short-sightedness) is corrected with concave lenses that diverge light before it enters the eye. Hyperopia (long-sightedness) is corrected with convex lenses that converge light. The prescription power (in dioptres) is P = 1/f.', example: 'A myopic person with far point at 50 cm needs: P = 1/(−0.5) = −2 D' },
      { title: 'Rear-View & Security Mirrors', body: 'Convex mirrors are used as rear-view mirrors in vehicles and as security/surveillance mirrors in shops. Their diverging nature provides a wide field of view, though images appear smaller and further than actual. The warning "Objects in mirror are closer than they appear" refers to this effect.' }
    ]
  };

  function renderExplore() {
    var container = $('explore-cards');
    container.innerHTML = '';
    var cards = EXPLORE[state.exploreCat] || [];
    cards.forEach(function (card) {
      var div = document.createElement('div');
      div.className = 'explore-card';
      var html = '<h3>' + card.title + '</h3><p>' + card.body.replace(/\n/g, '<br>') + '</p>';
      if (card.formula) html += '<div class="formula-box">' + card.formula + '</div>';
      if (card.example) html += '<div class="example-box">' + card.example.replace(/\n/g, '<br>') + '</div>';
      if (card.note) html += '<p style="color:var(--gold);font-size:.8rem;margin-top:8px"><strong>Note:</strong> ' + card.note + '</p>';
      div.innerHTML = html;
      container.appendChild(div);
    });
  }

  document.querySelectorAll('#explore-tabs .explore-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('#explore-tabs .explore-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.exploreCat = tab.dataset.cat;
      playClick();
      renderExplore();
    });
  });

  /* ═══════════ PRACTICE ═══════════ */
  var PRACTICE_GEN = [
    // 0: find v given u, f
    function () {
      var optic = Math.random() < 0.5 ? 'mirror' : 'lens';
      var type = Math.random() < 0.5 ? 'concave' : 'convex';
      var f = 10 + Math.floor(Math.random() * 25);
      var u = f + 5 + Math.floor(Math.random() * 40);
      var uS = -u;
      var fS;
      var v;
      if (optic === 'mirror') {
        fS = type === 'concave' ? -f : f;
        v = 1 / ((1 / fS) - (1 / uS));
      } else {
        fS = type === 'convex' ? f : -f;
        v = 1 / ((1 / fS) + (1 / uS));
      }
      return {
        q: 'A ' + type + ' ' + optic + ' has f = ' + f + ' cm. Object is at u = ' + u + ' cm. Find image distance v (in cm, with sign).',
        type: 'numeric',
        answer: roundN(v, 1),
        tol: 1,
        unit: 'cm',
        explain: 'Using the ' + optic + ' equation with f = ' + fS + ' cm, u = ' + uS + ' cm: v = ' + roundN(v, 1) + ' cm'
      };
    },
    // 1: find magnification
    function () {
      var optic = Math.random() < 0.5 ? 'mirror' : 'lens';
      var type = Math.random() < 0.6 ? 'concave' : 'convex';
      var f = 10 + Math.floor(Math.random() * 20);
      var u = f + 5 + Math.floor(Math.random() * 30);
      var uS = -u;
      var fS, v;
      if (optic === 'mirror') {
        fS = type === 'concave' ? -f : f;
        v = 1 / ((1 / fS) - (1 / uS));
      } else {
        fS = type === 'convex' ? f : -f;
        v = 1 / ((1 / fS) + (1 / uS));
      }
      // Mirrors use m = −v/u; only lenses use m = v/u
      var m = optic === 'mirror' ? -(v / uS) : v / uS;
      var work = optic === 'mirror'
        ? 'm = −v/u = −(' + roundN(v, 1) + ')/(' + uS + ')'
        : 'm = v/u = ' + roundN(v, 1) + '/(' + uS + ')';
      return {
        q: 'A ' + type + ' ' + optic + ': f = ' + f + ' cm, u = ' + u + ' cm. What is the magnification m?',
        type: 'numeric',
        answer: roundN(m, 2),
        tol: 0.1,
        unit: '',
        explain: 'v = ' + roundN(v, 1) + ' cm, ' + work + ' = ' + roundN(m, 2)
      };
    },
    // 2: MCQ nature of image
    function () {
      var optic = Math.random() < 0.5 ? 'mirror' : 'lens';
      var type = Math.random() < 0.5 ? 'concave' : 'convex';
      var f = 15;
      var positions = [
        { u: 10, desc: 'between F and P/O' },
        { u: 25, desc: 'between F and C/2F' },
        { u: 40, desc: 'beyond C/2F' },
        { u: 15, desc: 'at F' }
      ];
      var pick = positions[Math.floor(Math.random() * positions.length)];
      var uS = -pick.u;
      var fS, v;
      if (optic === 'mirror') {
        fS = type === 'concave' ? -f : f;
        v = 1 / ((1 / fS) - (1 / uS));
      } else {
        fS = type === 'convex' ? f : -f;
        v = 1 / ((1 / fS) + (1 / uS));
      }
      if (Math.abs(v) > 10000 || isNaN(v)) {
        return PRACTICE_GEN[0]();
      }
      // Mirrors use m = −v/u; only lenses use m = v/u
      var m = optic === 'mirror' ? -(v / uS) : v / uS;
      var real = optic === 'mirror' ? v < 0 : v > 0;
      var erect = m > 0;
      var correct = (real ? 'Real' : 'Virtual') + ', ' + (erect ? 'Erect' : 'Inverted');
      var opts = ['Real, Inverted', 'Real, Erect', 'Virtual, Erect', 'Virtual, Inverted'];
      // F and C sit behind a convex mirror / concave lens, so "between F and C"
      // describes nothing the student can point to — quote the distance instead.
      var converging = (optic === 'mirror' && type === 'concave') || (optic === 'lens' && type === 'convex');
      var where = converging ? 'placed ' + pick.desc + ' (u = ' + pick.u + ' cm)' : 'placed at u = ' + pick.u + ' cm';
      return {
        q: type.charAt(0).toUpperCase() + type.slice(1) + ' ' + optic + ' (f = ' + f + ' cm). Object ' + where + '. What is the image nature?',
        type: 'mcq',
        options: opts,
        answer: correct,
        explain: 'v = ' + roundN(v, 1) + ' cm, m = ' + roundN(m, 2) + ' → ' + correct
      };
    },
    // 3: MCQ identify optic from description
    function () {
      var scenarios = [
        { desc: 'always produces virtual, erect, diminished images regardless of object position', ans: 'Convex Mirror' },
        { desc: 'produces a real inverted image when the object is beyond F, and a virtual erect image when the object is between F and the pole', ans: 'Concave Mirror' },
        { desc: 'is used to correct myopia (short-sightedness)', ans: 'Concave Lens' },
        { desc: 'is used as a magnifying glass', ans: 'Convex Lens' }
      ];
      var pick = scenarios[Math.floor(Math.random() * scenarios.length)];
      return {
        q: 'Which optical element ' + pick.desc + '?',
        type: 'mcq',
        options: ['Concave Mirror', 'Convex Mirror', 'Convex Lens', 'Concave Lens'],
        answer: pick.ans,
        explain: pick.ans + ' — ' + pick.desc
      };
    },
    // 4: find focal length given u and v
    function () {
      var optic = Math.random() < 0.5 ? 'mirror' : 'lens';
      var type = Math.random() < 0.6 ? 'concave' : 'convex';
      var f = 10 + Math.floor(Math.random() * 20);
      var u = f + 5 + Math.floor(Math.random() * 30);
      var uS = -u;
      var fS, v;
      if (optic === 'mirror') {
        fS = type === 'concave' ? -f : f;
        v = 1 / ((1 / fS) - (1 / uS));
      } else {
        fS = type === 'convex' ? f : -f;
        v = 1 / ((1 / fS) + (1 / uS));
      }
      // Both distances quoted in the same convention — u signed, like v
      var eq = optic === 'mirror' ? '1/f = 1/v + 1/u' : '1/f = 1/v − 1/u';
      return {
        q: 'A ' + type + ' ' + optic + ': u = ' + uS + ' cm, v = ' + roundN(v, 1) + ' cm (Cartesian signs). Find f (magnitude, positive value).',
        type: 'numeric',
        answer: f,
        tol: 1,
        unit: 'cm',
        explain: 'Using ' + eq + ' with u = ' + uS + ' cm and v = ' + roundN(v, 1) + ' cm: f = ' + roundN(fS, 1) + ' cm → magnitude ' + f + ' cm'
      };
    }
  ];

  function newPractice() {
    var gen = PRACTICE_GEN[Math.floor(Math.random() * PRACTICE_GEN.length)];
    var prob = gen();
    state.currentPractice = prob;
    $('p-prompt').textContent = prob.q;
    $('p-feedback').textContent = '';
    $('p-feedback').style.color = '';
    var optDiv = $('p-options');
    optDiv.innerHTML = '';
    $('p-input-row').style.display = 'none';

    if (prob.type === 'mcq') {
      prob.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'mcq-option';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          optDiv.querySelectorAll('.mcq-option').forEach(function (b) { b.disabled = true; });
          state.practiceTotal++;
          if (opt === prob.answer) {
            btn.classList.add('correct');
            state.practiceScore++;
            $('p-feedback').textContent = 'Correct! ' + prob.explain;
            $('p-feedback').style.color = 'var(--green)';
            playSuccess();
          } else {
            btn.classList.add('wrong');
            optDiv.querySelectorAll('.mcq-option').forEach(function (b) {
              if (b.textContent === prob.answer) b.classList.add('correct');
            });
            $('p-feedback').textContent = 'Incorrect. ' + prob.explain;
            $('p-feedback').style.color = 'var(--red)';
            playError();
          }
          $('p-score').textContent = state.practiceScore;
          $('p-total').textContent = state.practiceTotal;
        });
        optDiv.appendChild(btn);
      });
    } else {
      $('p-input-row').style.display = 'flex';
      $('p-unit').textContent = prob.unit;
      $('p-input').value = '';
      $('p-input').focus();
    }
  }

  $('p-new').addEventListener('click', function () { playClick(); newPractice(); });
  $('p-check').addEventListener('click', function () {
    if (!state.currentPractice) return;
    var val = parseFloat($('p-input').value);
    if (isNaN(val)) return;
    state.practiceTotal++;
    var diff = Math.abs(val - state.currentPractice.answer);
    if (diff <= (state.currentPractice.tol || 1)) {
      state.practiceScore++;
      $('p-feedback').textContent = 'Correct! ' + state.currentPractice.explain;
      $('p-feedback').style.color = 'var(--green)';
      playSuccess();
    } else {
      $('p-feedback').textContent = 'Incorrect (answer: ' + state.currentPractice.answer + '). ' + state.currentPractice.explain;
      $('p-feedback').style.color = 'var(--red)';
      playError();
    }
    $('p-score').textContent = state.practiceScore;
    $('p-total').textContent = state.practiceTotal;
    $('p-input').disabled = true;
    $('p-check').disabled = true;
  });
  $('p-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('p-check').click(); });

  /* ═══════════ QUIZ ═══════════ */
  var QUIZ_POOL = [
    { q: 'A concave mirror has f = 20 cm. An object is placed at u = 30 cm. Where does the image form?', type: 'numeric', answer: -60, tol: 2, unit: 'cm', explain: '1/v = 1/(−20) − 1/(−30) = −1/20 + 1/30 = −1/60, so v = −60 cm (real)' },
    { q: 'A convex lens with f = 15 cm has an object at u = 30 cm. What is the magnification?', type: 'numeric', answer: -1, tol: 0.15, unit: '', explain: 'v = 30 cm, m = 30/(−30) = −1 (inverted, same size)' },
    { q: 'Which mirror always produces virtual, erect, diminished images?', type: 'mcq', options: ['Concave Mirror', 'Convex Mirror', 'Plane Mirror', 'Concave Lens'], answer: 'Convex Mirror', explain: 'Convex mirrors always diverge light, forming virtual images behind the mirror.' },
    { q: 'If R = 40 cm for a concave mirror, what is f?', type: 'numeric', answer: 20, tol: 1, unit: 'cm', explain: 'f = R/2 = 40/2 = 20 cm' },
    { q: 'An object at F of a concave mirror produces an image at:', type: 'mcq', options: ['F', '2F', 'Infinity', 'Between F and P'], answer: 'Infinity', explain: 'When object is at F, reflected rays become parallel → image at infinity.' },
    { q: 'A concave lens always forms:', type: 'mcq', options: ['Real, Inverted image', 'Virtual, Erect image', 'Real, Erect image', 'No image'], answer: 'Virtual, Erect image', explain: 'Concave lenses diverge light, always forming virtual, erect, diminished images.' },
    { q: 'A lens has power P = +5 D. What is the focal length?', type: 'numeric', answer: 20, tol: 1, unit: 'cm', explain: 'f = 1/P = 1/5 = 0.2 m = 20 cm' },
    { q: 'For a convex mirror, where is the image always located?', type: 'mcq', options: ['Between P and F (behind mirror)', 'At F', 'Beyond C', 'At infinity'], answer: 'Between P and F (behind mirror)', explain: 'Convex mirror images are always virtual, between P and F behind the reflecting surface.' },
    { q: 'What type of lens is used to correct myopia?', type: 'mcq', options: ['Convex Lens', 'Concave Lens', 'Cylindrical Lens', 'Bifocal Lens'], answer: 'Concave Lens', explain: 'Myopia (short-sightedness) requires a diverging (concave) lens to shift the focal point back to the retina.' },
    { q: 'A convex lens, f = 10 cm, object at u = 8 cm. Is the image real or virtual?', type: 'mcq', options: ['Real', 'Virtual', 'No image forms', 'At infinity'], answer: 'Virtual', explain: 'Object between F and lens: 1/v = 1/10 + 1/(−8) = 1/10 − 1/8 = −1/40, v = −40 cm (virtual).' },
    { q: 'A concave mirror, f = 12 cm, u = 20 cm. Find v.', type: 'numeric', answer: -30, tol: 2, unit: 'cm', explain: '1/v = 1/(−12) − 1/(−20) = −1/12 + 1/20 = −2/60 = −1/30, v = −30 cm' },
    { q: 'What is the magnification when an object is at C of a concave mirror?', type: 'numeric', answer: -1, tol: 0.15, unit: '', explain: 'At C (u = 2f), the image also forms at C: v = u, so m = v/u = −1.' },
    { q: 'The SI unit of lens power is:', type: 'mcq', options: ['Metre', 'Dioptre', 'Watt', 'Newton'], answer: 'Dioptre', explain: 'Lens power P = 1/f (in metres). The unit is the dioptre (D).' },
    { q: 'A convex lens acts as a magnifying glass when the object is placed:', type: 'mcq', options: ['Beyond 2F', 'At 2F', 'Between F and the lens', 'At infinity'], answer: 'Between F and the lens', explain: 'When the object is between F and the optical centre, a virtual, erect, magnified image forms — the magnifying glass effect.' },
    { q: 'Two thin lenses of f₁ = 20 cm and f₂ = −10 cm in contact. Find combined power.', type: 'numeric', answer: -5, tol: 0.5, unit: 'D', explain: 'P = P₁ + P₂ = 1/0.2 + 1/(−0.1) = 5 − 10 = −5 D' }
  ];

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    shuffle(pool);
    state.quizSet = pool.slice(0, 5);
    state.quizIdx = 0;
    state.quizScore = 0;
    state.quizAnswers = [];
    state.quizLocked = false;
    $('q-result').style.display = 'none';
    $('q-result').innerHTML = '';
    $('q-start').textContent = 'Restart';
    showQuizQ();
  }

  function showQuizQ() {
    var q = state.quizSet[state.quizIdx];
    $('q-progress').textContent = 'Question ' + (state.quizIdx + 1) + ' / 5';
    $('q-prompt').textContent = q.q;
    $('q-feedback').textContent = '';
    $('q-feedback').style.color = '';
    state.quizLocked = false;
    $('q-actions').style.display = 'flex';
    $('q-submit').style.display = '';
    $('q-next').style.display = 'none';

    var optDiv = $('q-options');
    optDiv.innerHTML = '';
    $('q-input-row').style.display = 'none';

    if (q.type === 'mcq') {
      q.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'mcq-option';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          if (state.quizLocked) return;
          optDiv.querySelectorAll('.mcq-option').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          state.quizSelectedAnswer = opt;
        });
        optDiv.appendChild(btn);
      });
    } else {
      $('q-input-row').style.display = 'flex';
      $('q-unit').textContent = q.unit;
      $('q-input').value = '';
      $('q-input').disabled = false;
      $('q-input').focus();
    }
  }

  $('q-start').addEventListener('click', function () { playClick(); startQuiz(); });

  $('q-submit').addEventListener('click', function () {
    if (state.quizLocked) return;
    var q = state.quizSet[state.quizIdx];
    var userAnswer, correct;

    if (q.type === 'mcq') {
      if (!state.quizSelectedAnswer) return;
      userAnswer = state.quizSelectedAnswer;
      correct = userAnswer === q.answer;
      var optDiv = $('q-options');
      optDiv.querySelectorAll('.mcq-option').forEach(function (b) {
        b.disabled = true;
        if (b.textContent === q.answer) b.classList.add('correct');
        if (b.textContent === userAnswer && !correct) b.classList.add('wrong');
      });
    } else {
      userAnswer = parseFloat($('q-input').value);
      if (isNaN(userAnswer)) return;
      correct = Math.abs(userAnswer - q.answer) <= (q.tol || 1);
      $('q-input').disabled = true;
    }

    state.quizLocked = true;
    if (correct) {
      state.quizScore++;
      $('q-feedback').textContent = 'Correct! ' + q.explain;
      $('q-feedback').style.color = 'var(--green)';
      playSuccess();
    } else {
      $('q-feedback').textContent = 'Incorrect. ' + q.explain;
      $('q-feedback').style.color = 'var(--red)';
      playError();
    }

    state.quizAnswers.push({
      q: q.q,
      userAnswer: userAnswer,
      correct: correct,
      correctAnswer: q.answer,
      explain: q.explain
    });

    $('q-submit').style.display = 'none';
    $('q-next').style.display = '';
    $('q-next').textContent = state.quizIdx < 4 ? 'Next →' : 'Show Results';
  });

  $('q-next').addEventListener('click', function () {
    state.quizIdx++;
    if (state.quizIdx < 5) {
      showQuizQ();
    } else {
      showQuizResult();
    }
    playClick();
  });

  $('q-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('q-submit').click(); });

  function showQuizResult() {
    $('q-prompt').textContent = '';
    $('q-options').innerHTML = '';
    $('q-input-row').style.display = 'none';
    $('q-actions').style.display = 'none';
    $('q-feedback').textContent = '';

    var pct = Math.round((state.quizScore / 5) * 100);
    var stars = state.quizScore === 5 ? '★★★' : state.quizScore >= 3 ? '★★☆' : '★☆☆';

    var html = '<div class="quiz-score-display">' + state.quizScore + ' / 5 (' + pct + '%)</div>';
    html += '<div class="quiz-stars">' + stars + '</div>';
    state.quizAnswers.forEach(function (a, i) {
      html += '<div class="quiz-result-row ' + (a.correct ? 'correct' : 'wrong') + '">';
      html += '<div class="qr-q">' + (a.correct ? '✓' : '✗') + ' Q' + (i + 1) + ': ' + a.q + '</div>';
      html += '<div class="qr-a">Your answer: ' + a.userAnswer + ' | Correct: ' + a.correctAnswer + '</div>';
      html += '</div>';
    });

    $('q-result').innerHTML = html;
    $('q-result').style.display = '';
    $('q-progress').textContent = 'Result';
  }

  /* ── init ── */
  window.addEventListener('resize', function () { resizeCanvas(); updateUI(); });
  resizeCanvas();
  compute();
  updatePresets();
  updateUI();
  renderExplore();
  // auto-animate on first load so students see something immediately
  setTimeout(function () { compute(); animateRays(); }, 400);
})();
