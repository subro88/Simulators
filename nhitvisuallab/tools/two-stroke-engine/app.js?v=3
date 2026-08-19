(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     TWO-STROKE ENGINE SIMULATOR
     Petrol (SI) — Port Timing · Crankcase Compression · PV Diagram
     ═══════════════════════════════════════════════════════════════ */

  /* ── 1. Constants ── */
  var GAMMA = 1.4;
  var P_ATM = 101.325;    // kPa
  var T_AMB = 300;         // K

  // Port timing angles (degrees from TDC)
  var EXHAUST_OPEN  = 110;   // exhaust port opens at 110° after TDC
  var TRANSFER_OPEN = 125;   // transfer port opens at 125° after TDC
  var TRANSFER_CLOSE = 235;  // transfer port closes at 235° after TDC (=360-125)
  var EXHAUST_CLOSE  = 250;  // exhaust port closes at 250° after TDC (=360-110)
  var INTAKE_OPEN = 30;      // intake reed opens ~30° after BDC (crankcase vacuum)
  var INTAKE_CLOSE = 170;    // intake closes around 170°

  /* ── 2. DOM refs ── */
  var canvas   = document.getElementById('engine-canvas');
  var ctx      = canvas.getContext('2d');
  var modeTabs = document.getElementById('mode-tabs');
  var rpmSlider = document.getElementById('rpm-slider');
  var crSlider  = document.getElementById('cr-slider');
  var rpmVal    = document.getElementById('rpm-val');
  var crVal     = document.getElementById('cr-val');
  var btnPlay   = document.getElementById('btn-play');
  var btnStep   = document.getElementById('btn-step');

  var roPhase    = document.getElementById('ro-phase');
  var roAngle    = document.getElementById('ro-angle');
  var roPressure = document.getElementById('ro-pressure');
  var roTemp     = document.getElementById('ro-temp');
  var roEff      = document.getElementById('ro-eff');
  var roPorts    = document.getElementById('ro-ports');

  var simPanel      = document.getElementById('sim-panel');
  var explorePanel  = document.getElementById('explore-panel');
  var practicePanel = document.getElementById('practice-panel');
  var quizPanel     = document.getElementById('quiz-panel');

  /* ── 3. State ── */
  var mode = 'simulate';
  var rpm = 10;
  var compRatio = 8;
  var crankAngle = 0;   // 0-360 (one revolution per cycle)
  var playing = false;
  var stepping = false;       // true while step-animating through one phase
  var stepTarget = 0;         // crank angle to stop at
  var STEP_SPEED = 90;        // deg/sec for step animation (slow & clear)
  var animId = null;
  var lastTime = 0;
  var conRodRatio = 3.5;

  // Particle system for gas flow visualization
  var particles = [];
  var MAX_PARTICLES = 80;
  var engineLayout = null;  // stores geometry from drawEngine for particle spawning

  /* ── 4. Thermodynamic Calculations ── */
  function calcEfficiency(r) {
    // Ideal two-stroke efficiency (same as Otto)
    // Real is ~60-70% of this due to scavenging losses
    return (1 - 1 / Math.pow(r, GAMMA - 1)) * 0.7;
  }

  function isExhaustOpen(a) { return a >= EXHAUST_OPEN && a <= EXHAUST_CLOSE; }
  function isTransferOpen(a) { return a >= TRANSFER_OPEN && a <= TRANSFER_CLOSE; }
  function isIntakeOpen(a) {
    // Intake to crankcase: during upstroke when piston creates vacuum
    // Simplified: open during roughly 30°-170°
    return a >= INTAKE_OPEN && a <= INTAKE_CLOSE;
  }

  function getPhase(a) {
    a = ((a % 360) + 360) % 360;
    if (a < EXHAUST_OPEN) return 'Compression';
    if (a < 180) return 'Compression + Scavenging';
    if (a < TRANSFER_CLOSE) return 'Power + Scavenging';
    if (a < EXHAUST_CLOSE) return 'Power + Exhaust';
    return 'Power';
  }

  function getPhaseSimple(a) {
    a = ((a % 360) + 360) % 360;
    if (a < 180) return 'Upstroke';
    return 'Downstroke';
  }

  function getPhaseColor(a) {
    a = ((a % 360) + 360) % 360;
    if (a < 180) {
      if (a < EXHAUST_OPEN) return '#ffa726'; // compression (orange)
      return '#42a5f5'; // scavenging (blue)
    }
    if (a < TRANSFER_CLOSE) return '#42a5f5'; // scavenging continues
    return '#ef5350'; // power (red)
  }

  function getCycleState(theta) {
    var a = ((theta % 360) + 360) % 360;
    var r = compRatio;
    var P, T;

    if (a <= 180) {
      // UPSTROKE: compression from BDC (a=0 maps to previous BDC)
      // Actually let's redefine: 0° = TDC
      // 0° to 180°: piston goes TDC → BDC (downstroke = power then exhaust/transfer)
      // 180° to 360°: piston goes BDC → TDC (upstroke = intake/transfer then compression)
      // Two-stroke crank map:
      // 0° = TDC (ignition)
      // 0-180°: power stroke (expansion), then exhaust+transfer ports open
      // 180-360°: compression stroke (upward), intake into crankcase

      // Power expansion phase
      if (a < EXHAUST_OPEN) {
        // Isentropic expansion
        var volRatio = getVolumeRatio(a);
        P = P_ATM * Math.pow(r, GAMMA) * 3.0 / Math.pow(volRatio, GAMMA);
        T = T_AMB * Math.pow(r, GAMMA - 1) * 3.0 / Math.pow(volRatio, GAMMA - 1);
      } else {
        // Exhaust/transfer open — blowdown, pressure drops
        var blowdownProgress = (a - EXHAUST_OPEN) / (180 - EXHAUST_OPEN);
        P = P_ATM * (1 + (5 - 1) * Math.pow(1 - blowdownProgress, 2));
        T = T_AMB * (1 + (2 - 1) * (1 - blowdownProgress));
      }
    } else {
      // 180°-360°: UPSTROKE
      var upAngle = a - 180; // 0 at BDC, 180 at TDC

      if (upAngle < (TRANSFER_CLOSE - 180)) {
        // Still scavenging — near atmospheric
        P = P_ATM * 1.05;
        T = T_AMB * 1.1;
      } else if (upAngle < (EXHAUST_CLOSE - 180)) {
        // Exhaust still open, starting compression
        var compProgress = (upAngle - (TRANSFER_CLOSE - 180)) / ((EXHAUST_CLOSE - 180) - (TRANSFER_CLOSE - 180));
        P = P_ATM * (1 + compProgress * 0.5);
        T = T_AMB * (1 + compProgress * 0.3);
      } else {
        // Full compression — all ports closed
        var compAngle = upAngle - (EXHAUST_CLOSE - 180);
        var totalCompAngle = 180 - (EXHAUST_CLOSE - 180);
        var volStart = getVolumeRatio(EXHAUST_CLOSE);
        var volNow = getVolumeRatio(a);
        var compRatioActual = volStart / Math.max(volNow, 1);
        P = P_ATM * Math.pow(compRatioActual, GAMMA);
        T = T_AMB * Math.pow(compRatioActual, GAMMA - 1);
      }
    }

    return { P: Math.max(P, P_ATM * 0.5), T: Math.max(T, T_AMB * 0.8) };
  }

  /* Cylinder volume at a crank angle, as a multiple of the clearance volume:
     1 at TDC, compRatio at BDC.

     Driven by getPistonY — the same function that positions the drawn piston —
     rather than the infinite-connecting-rod form (1 - cos a)/2 that used to be
     written out here. The two disagree by up to ~7% of the stroke near
     mid-travel, which put the P-v diagram and the pressure/temperature readouts
     on a different piston position from the one being animated. getPistonY is
     already symmetric about BDC, so the explicit mirror is no longer needed. */
  function getVolumeRatio(a) {
    return 1 + (compRatio - 1) * getPistonY(a);
  }

  function getPistonY(theta) {
    var rad = theta * Math.PI / 180;
    var R = 0.5;
    var L = R * conRodRatio;
    var disp = R * (1 - Math.cos(rad)) + L * (1 - Math.sqrt(1 - Math.pow(R * Math.sin(rad) / L, 2)));
    return disp / (2 * R);
  }

  /* ── 4b. Particle System ── */
  function createParticle(x, y, vx, vy, color, size) {
    return {
      x: x, y: y,
      vx: vx, vy: vy,
      color: color,
      size: size || 3,
      life: 1.0,
      decay: 0.008 + Math.random() * 0.012
    };
  }

  function spawnParticles(dt) {
    if (!engineLayout) return;
    var el = engineLayout;
    var a = ((crankAngle % 360) + 360) % 360;

    var effectiveDt = dt || 0.016;
    var spawnCount = Math.ceil(effectiveDt * 60);

    // Exhaust port open — grey/warm particles flow RIGHT out through exhaust port
    if (isExhaustOpen(a)) {
      for (var i = 0; i < spawnCount && particles.length < MAX_PARTICLES; i++) {
        var px = el.cylX + el.cylW;
        var py = el.exhPortY + (Math.random() - 0.5) * el.portH * 0.8;
        particles.push(createParticle(
          px, py,
          40 + Math.random() * 50,  // move right (out of exhaust)
          (Math.random() - 0.5) * 15,
          'rgba(120,144,156,', // grey burnt gas
          2.5 + Math.random() * 2
        ));
      }
    }

    // Transfer port open — blue particles flow LEFT into cylinder through transfer port
    if (isTransferOpen(a)) {
      for (var i = 0; i < spawnCount && particles.length < MAX_PARTICLES; i++) {
        var px = el.cylX;
        var py = el.trPortY + (Math.random() - 0.5) * el.portH * 0.8;
        particles.push(createParticle(
          px, py,
          15 + Math.random() * 30, // move right (into cylinder)
          -(10 + Math.random() * 25), // also upward (scavenging pushes upward)
          'rgba(66,165,245,', // blue fresh mixture
          2.5 + Math.random() * 2
        ));
      }
    }

    // Intake port open — green particles flow LEFT into crankcase
    if (isIntakeOpen(a)) {
      for (var i = 0; i < Math.ceil(spawnCount * 0.7) && particles.length < MAX_PARTICLES; i++) {
        var px = el.intPortX + 12;
        var py = el.intPortY + (Math.random() - 0.5) * 10;
        particles.push(createParticle(
          px, py,
          -(20 + Math.random() * 30), // move left (into crankcase)
          (Math.random() - 0.5) * 15,
          'rgba(102,187,106,', // green fresh air-fuel
          2 + Math.random() * 2
        ));
      }
    }

    // Power stroke (before exhaust opens) — combustion particles
    if (a < EXHAUST_OPEN && a > 5) {
      if (Math.random() < 0.4 * spawnCount && particles.length < MAX_PARTICLES) {
        var px = el.sparkX + (Math.random() - 0.5) * 10;
        var py = el.cylY + 8;
        var angle = Math.random() * Math.PI * 2;
        var speed = 15 + Math.random() * 30;
        particles.push(createParticle(
          px, py,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed * 0.5 + 10,
          'rgba(255,152,0,', // orange combustion
          2 + Math.random() * 2
        ));
      }
    }

    // Compression phase — faint amber swirl
    if (a >= EXHAUST_CLOSE) {
      if (Math.random() < 0.2 * spawnCount && particles.length < MAX_PARTICLES) {
        var px = el.cylX + 5 + Math.random() * (el.cylW - 10);
        var py = el.pistonY - 10;
        particles.push(createParticle(
          px, py,
          (Math.random() - 0.5) * 20,
          -(5 + Math.random() * 12),
          'rgba(255,183,77,', // warm amber
          1.5 + Math.random() * 1.5
        ));
      }
    }
  }

  function updateParticles(dt) {
    if (!engineLayout) return;
    var el = engineLayout;
    var a = ((crankAngle % 360) + 360) % 360;

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay;

      // Constrain cylinder particles (not exhaust/intake port particles)
      if (p.x > el.cylX && p.x < el.cylX + el.cylW) {
        // Inside cylinder walls
        if (p.y > el.pistonY - 2) { p.y = el.pistonY - 2; p.vy *= -0.3; }
        if (p.y < el.cylY + 2) { p.y = el.cylY + 2; p.vy *= -0.2; }
      }

      // Remove dead or out-of-bounds particles
      if (p.life <= 0 ||
          p.x < el.cylX - 80 || p.x > el.cylX + el.cylW + 80 ||
          p.y < el.cylY - 40 || p.y > el.ccBottom + 20) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles(ctx) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var alpha = Math.max(0, p.life * 0.8);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();
    }
  }

  /* ── 5. Drawing ── */
  function draw() {
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var engineW = W * 0.55;
    var pvX = engineW + 30;
    var pvW = W - pvX - 20;
    var pvH = H - 60;

    drawEngine(10, 15, engineW - 20, H - 35);
    drawPVDiagram(pvX, 30, pvW, pvH);
    drawPhaseBar(10, H - 28, engineW - 20);
  }

  function drawEngine(x, y, w, h) {
    var a = ((crankAngle % 360) + 360) % 360;
    var pistonPos = getPistonY(a);
    var phaseColor = getPhaseColor(a);

    // Cylinder dimensions
    var cylW = w * 0.32;
    var cylH = h * 0.5;
    var cylX = x + (w - cylW) / 2;
    var cylY = y + h * 0.06;

    var pistonH = cylH * 0.1;
    var pistonY = cylY + pistonPos * (cylH - pistonH);

    // Crankshaft
    var crankCX = cylX + cylW / 2;
    var crankCY = cylY + cylH + h * 0.2;
    var crankR = h * 0.09;
    var crankRad = a * Math.PI / 180;
    var crankPinX = crankCX + crankR * Math.sin(crankRad);
    var crankPinY = crankCY - crankR * Math.cos(crankRad);

    var pistonPinX = cylX + cylW / 2;
    var pistonPinY = pistonY + pistonH;

    // ── Crankcase outline (sealed chamber below cylinder) ──
    var ccTop = cylY + cylH;
    var ccBottom = crankCY + crankR + 20;
    var ccLeft = cylX - 20;
    var ccRight = cylX + cylW + 20;

    ctx.strokeStyle = '#3a4556';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cylX, ccTop);
    ctx.lineTo(ccLeft, ccTop);
    ctx.lineTo(ccLeft, ccBottom);
    ctx.lineTo(ccRight, ccBottom);
    ctx.lineTo(ccRight, ccTop);
    ctx.lineTo(cylX + cylW, ccTop);
    ctx.stroke();

    // Crankcase fill — show pressure state
    var ccPressureColor;
    if (a >= 180 && a < 360) {
      // Upstroke — crankcase vacuum then intake
      var vacLevel = Math.max(0, Math.sin((a - 180) * Math.PI / 180)) * 0.3;
      ccPressureColor = 'rgba(66,165,245,' + (0.05 + vacLevel) + ')';
    } else {
      // Downstroke — crankcase compression
      var compLevel = Math.max(0, Math.sin(a * Math.PI / 180)) * 0.25;
      ccPressureColor = 'rgba(255,167,38,' + (0.05 + compLevel) + ')';
    }
    ctx.fillStyle = ccPressureColor;
    ctx.beginPath();
    ctx.moveTo(cylX + 1, ccTop);
    ctx.lineTo(ccLeft + 1, ccTop);
    ctx.lineTo(ccLeft + 1, ccBottom - 1);
    ctx.lineTo(ccRight - 1, ccBottom - 1);
    ctx.lineTo(ccRight - 1, ccTop);
    ctx.lineTo(cylX + cylW - 1, ccTop);
    ctx.lineTo(cylX + cylW - 1, pistonPinY + 10);
    ctx.lineTo(cylX + 1, pistonPinY + 10);
    ctx.closePath();
    ctx.fill();

    // ── Cylinder walls ──
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cylX, cylY);
    ctx.lineTo(cylX, cylY + cylH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cylX + cylW, cylY);
    ctx.lineTo(cylX + cylW, cylY + cylH);
    ctx.stroke();

    // Cylinder head
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(cylX - 8, cylY - 12, cylW + 16, 14);
    ctx.strokeStyle = '#4a5568';
    ctx.strokeRect(cylX - 8, cylY - 12, cylW + 16, 14);

    // ── Ports ──
    var portW = 14;
    var portH = 20;

    /* Port heights are placed at the piston-crown position corresponding to
       each port's timing angle, so the crown uncovers the port at exactly the
       crank angle the timing constants specify.

       They used to be positioned at cylH * (angle / 180) — a LINEAR fraction of
       crank angle — while the piston moves on the slider-crank curve. The
       result was that the drawn crown cleared the exhaust port at about 94 deg
       when the code opens it at 110 deg, and cleared the transfer port at about
       105 deg against a stated 125 deg. The student saw the port uncovered
       16-20 deg before the gas flow and port highlight switched on.

       Port timing is symmetric about BDC and getPistonY is symmetric too, so
       aligning the opening angle aligns the closing angle automatically. */
    var pistonTravel = cylH - pistonH;

    // Exhaust port (right side, higher) — opens first
    var exhPortY = cylY + getPistonY(EXHAUST_OPEN) * pistonTravel;
    var exhOpen = isExhaustOpen(a);

    // Transfer port (both sides, lower)
    var trPortY = cylY + getPistonY(TRANSFER_OPEN) * pistonTravel;
    var trOpen = isTransferOpen(a);

    // Intake port (on crankcase, bottom)
    var intOpen = isIntakeOpen(a);
    var intPortX = ccRight;
    var intPortY = (ccTop + ccBottom) / 2;

    // Draw exhaust port
    ctx.fillStyle = exhOpen ? '#ef5350' : '#2a3050';
    ctx.fillRect(cylX + cylW, exhPortY - portH / 2, portW, portH);
    ctx.strokeStyle = exhOpen ? '#ef5350' : '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cylX + cylW, exhPortY - portH / 2, portW, portH);
    // Exhaust arrow when open
    if (exhOpen) {
      ctx.save();
      ctx.strokeStyle = '#ef5350';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cylX + cylW + portW, exhPortY);
      ctx.lineTo(cylX + cylW + portW + 25, exhPortY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef5350';
      ctx.beginPath();
      ctx.moveTo(cylX + cylW + portW + 20, exhPortY - 5);
      ctx.lineTo(cylX + cylW + portW + 30, exhPortY);
      ctx.lineTo(cylX + cylW + portW + 20, exhPortY + 5);
      ctx.fill();
      ctx.restore();
    }

    // Draw transfer ports (both sides)
    ctx.fillStyle = trOpen ? '#42a5f5' : '#2a3050';
    // Left transfer
    ctx.fillRect(cylX - portW, trPortY - portH / 2, portW, portH);
    ctx.strokeStyle = trOpen ? '#42a5f5' : '#4a5568';
    ctx.strokeRect(cylX - portW, trPortY - portH / 2, portW, portH);
    // Right transfer (below exhaust)
    var trRightY = trPortY + 2;
    ctx.fillRect(cylX + cylW, trRightY - portH / 2, portW, portH);
    ctx.strokeRect(cylX + cylW, trRightY - portH / 2, portW, portH);

    // Transfer flow arrows when open
    if (trOpen) {
      ctx.save();
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      // Left arrow (into cylinder)
      ctx.beginPath();
      ctx.moveTo(cylX - portW - 15, trPortY);
      ctx.lineTo(cylX + 5, trPortY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#42a5f5';
      ctx.beginPath();
      ctx.moveTo(cylX, trPortY - 5);
      ctx.lineTo(cylX + 8, trPortY);
      ctx.lineTo(cylX, trPortY + 5);
      ctx.fill();
      // Connection line from crankcase to transfer
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ccLeft + 5, ccTop - 5);
      ctx.lineTo(cylX - portW - 10, trPortY);
      ctx.stroke();
      ctx.restore();
    }

    // Draw intake port (on crankcase)
    ctx.fillStyle = intOpen ? '#66bb6a' : '#2a3050';
    ctx.fillRect(intPortX, intPortY - 8, 12, 16);
    ctx.strokeStyle = intOpen ? '#66bb6a' : '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(intPortX, intPortY - 8, 12, 16);

    if (intOpen) {
      ctx.save();
      ctx.strokeStyle = '#66bb6a';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(intPortX + 30, intPortY);
      ctx.lineTo(intPortX + 5, intPortY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#66bb6a';
      ctx.beginPath();
      ctx.moveTo(intPortX + 10, intPortY - 5);
      ctx.lineTo(intPortX, intPortY);
      ctx.lineTo(intPortX + 10, intPortY + 5);
      ctx.fill();
      ctx.restore();
    }

    // Port labels
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = exhOpen ? '#ef5350' : '#6b7a99';
    ctx.fillText('EXHAUST', cylX + cylW + portW + 4, exhPortY - portH / 2 - 3);
    ctx.fillStyle = trOpen ? '#42a5f5' : '#6b7a99';
    ctx.textAlign = 'right';
    ctx.fillText('TRANSFER', cylX - portW - 4, trPortY - portH / 2 - 3);
    ctx.textAlign = 'left';
    ctx.fillStyle = intOpen ? '#66bb6a' : '#6b7a99';
    ctx.fillText('INTAKE', intPortX + 16, intPortY - 10);

    // ── Gas fill in cylinder ──
    var gasGrad = ctx.createLinearGradient(cylX, cylY, cylX, pistonY);
    if (a < EXHAUST_OPEN) {
      // Power/expansion — hot gas
      var hotLevel = Math.max(0.2, 0.6 - a / 180 * 0.4);
      gasGrad.addColorStop(0, 'rgba(255,87,34,' + hotLevel + ')');
      gasGrad.addColorStop(1, 'rgba(255,152,0,' + (hotLevel * 0.5) + ')');
    } else if (a < 180) {
      // Blowdown/scavenging above piston
      gasGrad.addColorStop(0, 'rgba(120,144,156,0.2)');
      gasGrad.addColorStop(1, 'rgba(66,165,245,0.15)');
    } else if (a < EXHAUST_CLOSE) {
      // Scavenging continues, fresh charge entering
      gasGrad.addColorStop(0, 'rgba(66,165,245,0.2)');
      gasGrad.addColorStop(1, 'rgba(66,165,245,0.1)');
    } else {
      // Compression
      var compProgress = (a - EXHAUST_CLOSE) / (360 - EXHAUST_CLOSE);
      var intensity = 0.1 + compProgress * 0.4;
      gasGrad.addColorStop(0, 'rgba(255,167,38,' + intensity + ')');
      gasGrad.addColorStop(1, 'rgba(255,183,77,' + (intensity * 0.5) + ')');
    }
    ctx.fillStyle = gasGrad;
    ctx.fillRect(cylX + 2, cylY, cylW - 4, pistonY - cylY);

    // Store layout for particle system
    engineLayout = {
      cylX: cylX, cylY: cylY, cylW: cylW, cylH: cylH,
      pistonY: pistonY, pistonH: pistonH,
      exhPortY: exhPortY, trPortY: trPortY,
      portW: portW, portH: portH,
      intPortX: intPortX, intPortY: intPortY,
      sparkX: cylX + cylW / 2,
      ccBottom: ccBottom
    };

    // ── Draw gas flow particles ──
    drawParticles(ctx);

    // ── Spark plug ──
    var sparkX = cylX + cylW / 2;
    var sparkY = cylY - 5;
    ctx.fillStyle = '#fdd835';
    ctx.fillRect(sparkX - 3, sparkY - 14, 6, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sparkX - 2, sparkY - 4, 4, 4);

    // Spark flash near TDC (ignition)
    if (a > 350 || a < 10) {
      ctx.save();
      ctx.globalAlpha = a > 350 ? (a - 350) / 10 : (10 - a) / 10;
      var sparkGrad = ctx.createRadialGradient(sparkX, sparkY + 5, 0, sparkX, sparkY + 5, 20);
      sparkGrad.addColorStop(0, 'rgba(255,235,59,0.9)');
      sparkGrad.addColorStop(0.5, 'rgba(255,152,0,0.4)');
      sparkGrad.addColorStop(1, 'rgba(255,87,34,0)');
      ctx.fillStyle = sparkGrad;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY + 5, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#fdd835';
    ctx.textAlign = 'center';
    ctx.fillText('SPARK', sparkX, sparkY - 17);

    // ── Draw piston ──
    var pistonGrad = ctx.createLinearGradient(cylX, pistonY, cylX, pistonY + pistonH);
    pistonGrad.addColorStop(0, '#546e7a');
    pistonGrad.addColorStop(1, '#37474f');
    ctx.fillStyle = pistonGrad;
    ctx.fillRect(cylX + 2, pistonY, cylW - 4, pistonH);
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 1;
    ctx.strokeRect(cylX + 2, pistonY, cylW - 4, pistonH);

    // Piston rings
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 1.5;
    for (var ri = 0; ri < 2; ri++) {
      var ringY = pistonY + 2 + ri * 3;
      ctx.beginPath();
      ctx.moveTo(cylX + 4, ringY);
      ctx.lineTo(cylX + cylW - 4, ringY);
      ctx.stroke();
    }

    // ── Piston skirt (extends below piston to cover/uncover ports) ──
    var skirtH = pistonH * 2;
    ctx.fillStyle = 'rgba(55,71,79,0.5)';
    ctx.fillRect(cylX + 4, pistonY + pistonH, cylW - 8, skirtH);

    // ── Piston direction arrow ──
    // 0-180° = downstroke (TDC→BDC), 180-360° = upstroke (BDC→TDC)
    var pistonGoingDown = (a < 180);
    var arrowDir = pistonGoingDown ? 1 : -1; // 1 = down, -1 = up
    var arrowX = cylX - 28;
    var arrowMidY = pistonY + pistonH / 2;
    var arrowLen = 28;

    ctx.save();
    ctx.strokeStyle = phaseColor;
    ctx.fillStyle = phaseColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.95;

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowMidY - arrowLen * arrowDir * 0.4);
    ctx.lineTo(arrowX, arrowMidY + arrowLen * arrowDir * 0.4);
    ctx.stroke();

    // Arrowhead
    var tipY = arrowMidY + arrowLen * arrowDir * 0.5;
    ctx.beginPath();
    ctx.moveTo(arrowX - 7, tipY - 9 * arrowDir);
    ctx.lineTo(arrowX + 7, tipY - 9 * arrowDir);
    ctx.lineTo(arrowX, tipY);
    ctx.closePath();
    ctx.fill();

    // Direction symbol
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pistonGoingDown ? '▼' : '▲', arrowX, arrowMidY + arrowDir * (arrowLen * 0.5 + 15));
    ctx.restore();

    // ── Connecting rod ──
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pistonPinX, pistonPinY + skirtH / 2);
    ctx.lineTo(crankPinX, crankPinY);
    ctx.stroke();

    // Piston pin
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.arc(pistonPinX, pistonPinY + skirtH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // ── Crankshaft ──
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(crankCX, crankCY, crankR + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(crankCX, crankCY);
    ctx.lineTo(crankPinX, crankPinY);
    ctx.stroke();

    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(crankCX, crankCY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.arc(crankPinX, crankPinY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Counterweight
    var cwX = crankCX - crankR * 0.8 * Math.sin(crankRad);
    var cwY = crankCY + crankR * 0.8 * Math.cos(crankRad);
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(cwX, cwY, crankR * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // ── Phase label ──
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = phaseColor;
    ctx.textAlign = 'center';
    ctx.fillText(getPhase(a), cylX + cylW / 2, crankCY + crankR + 38);

    ctx.font = '11px ' + getComputedStyle(document.documentElement).getPropertyValue('--mono');
    ctx.fillStyle = '#6b7a99';
    ctx.fillText(Math.round(crankAngle) + '\u00B0', crankCX, crankCY + crankR + 52);

    // TDC / BDC labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'right';
    ctx.fillText('TDC', cylX - 6, cylY + 6);
    ctx.fillText('BDC', cylX - 6, cylY + cylH - 2);

    // Crankcase label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4a5568';
    ctx.font = '9px sans-serif';
    ctx.fillText('CRANKCASE', crankCX, ccBottom + 12);
  }

  function drawPVDiagram(x, y, w, h) {
    var padL = 45, padB = 35, padT = 25, padR = 15;
    var plotX = x + padL;
    var plotY = y + padT;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('P-V Diagram (Two-Stroke)', x + w / 2, y + 12);

    // Axes
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Volume (V)', plotX + plotW / 2, plotY + plotH + 28);

    ctx.save();
    ctx.translate(x + 12, plotY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Pressure (P)', 0, 0);
    ctx.restore();

    // Cycle points
    var r = compRatio;
    var P1 = P_ATM;
    var V1 = r;
    var V2 = 1;
    var P2 = P1 * Math.pow(r, GAMMA);
    var P3 = P2 * 2.8;
    var V3 = V2;
    var P4 = P3 * Math.pow(V3 / V1, GAMMA);
    var V4 = V1;

    var Pmax = P3 * 1.15;
    var Vmax = V1 * 1.15;

    function toX(v) { return plotX + v / Vmax * plotW; }
    function toY(p) { return plotY + plotH - p / Pmax * plotH; }

    // Grid
    ctx.strokeStyle = 'rgba(74,85,104,0.3)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 4]);
    for (var gi = 1; gi <= 4; gi++) {
      var gy = plotY + plotH * (1 - gi / 4);
      ctx.beginPath(); ctx.moveTo(plotX, gy); ctx.lineTo(plotX + plotW, gy); ctx.stroke();
      var gx = plotX + plotW * gi / 4;
      ctx.beginPath(); ctx.moveTo(gx, plotY); ctx.lineTo(gx, plotY + plotH); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw cycle
    var steps = 50;

    // 1→2: Isentropic compression
    ctx.strokeStyle = '#ffa726';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var s = 0; s <= steps; s++) {
      var v = V1 - (V1 - V2) * s / steps;
      var p = P1 * Math.pow(V1 / v, GAMMA);
      if (s === 0) ctx.moveTo(toX(v), toY(p)); else ctx.lineTo(toX(v), toY(p));
    }
    ctx.stroke();

    // 2→3: Constant volume combustion
    ctx.strokeStyle = '#ef5350';
    ctx.beginPath();
    ctx.moveTo(toX(V2), toY(P2));
    ctx.lineTo(toX(V3), toY(P3));
    ctx.stroke();

    // 3→4: Isentropic expansion
    ctx.strokeStyle = '#ef5350';
    ctx.beginPath();
    for (var s2 = 0; s2 <= steps; s2++) {
      var v2 = V3 + (V4 - V3) * s2 / steps;
      var p2 = P3 * Math.pow(V3 / v2, GAMMA);
      if (s2 === 0) ctx.moveTo(toX(v2), toY(p2)); else ctx.lineTo(toX(v2), toY(p2));
    }
    ctx.stroke();

    // 4→1: Blowdown (exhaust) — constant volume
    ctx.strokeStyle = '#78909c';
    ctx.beginPath();
    ctx.moveTo(toX(V4), toY(P4));
    ctx.lineTo(toX(V1), toY(P1));
    ctx.stroke();

    // State point labels
    ctx.font = 'bold 12px sans-serif';
    var pts = [
      { l: '1', v: V1, p: P1, dx: 8, dy: 5 },
      { l: '2', v: V2, p: P2, dx: -14, dy: 0 },
      { l: '3', v: V3, p: P3, dx: -14, dy: -8 },
      { l: '4', v: V4, p: P4, dx: 8, dy: -5 }
    ];
    pts.forEach(function (pt) {
      ctx.fillStyle = '#dde3f0';
      ctx.beginPath();
      ctx.arc(toX(pt.v), toY(pt.p), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillText(pt.l, toX(pt.v) + pt.dx, toY(pt.p) + pt.dy);
    });

    // Current state marker
    var ca = ((crankAngle % 360) + 360) % 360;
    var currentV = getVolumeRatio(ca);
    var state = getCycleState(ca);
    var markerX = toX(currentV);
    var markerY = toY(Math.min(state.P, Pmax * 0.95));

    ctx.save();
    var glow = ctx.createRadialGradient(markerX, markerY, 0, markerX, markerY, 12);
    glow.addColorStop(0, 'rgba(25,118,210,0.6)');
    glow.addColorStop(1, 'rgba(25,118,210,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(markerX, markerY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1976d2';
    ctx.beginPath();
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Process labels
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffa726';
    ctx.fillText('Compression', toX((V1 + V2) / 2) - 10, toY(P1 * Math.pow(V1 / ((V1 + V2) / 2), GAMMA)) + 14);
    ctx.fillStyle = '#ef5350';
    ctx.fillText('Ignition', toX(V2) - 22, toY((P2 + P3) / 2));
    ctx.fillText('Expansion', toX((V3 + V4) / 2) + 12, toY(P3 * Math.pow(V3 / ((V3 + V4) / 2), GAMMA)) - 6);
    ctx.fillStyle = '#78909c';
    ctx.fillText('Blowdown', toX(V1) + 5, toY((P4 + P1) / 2) - 5);

    // Tick labels
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'right';
    for (var ti = 0; ti <= 4; ti++) {
      var pTick = Pmax * ti / 4;
      ctx.fillText(Math.round(pTick), plotX - 5, toY(pTick) + 3);
    }
    ctx.textAlign = 'center';
    ctx.fillText('V\u2082', toX(V2), plotY + plotH + 14);
    ctx.fillText('V\u2081', toX(V1), plotY + plotH + 14);
  }

  function drawPhaseBar(x, y, w) {
    var a = ((crankAngle % 360) + 360) % 360;

    // Port timing bar — shows which ports are open
    var phases = [
      { name: 'Comp.', start: 0, end: EXHAUST_OPEN, color: '#ffa726' },
      { name: 'Exh+Trans', start: EXHAUST_OPEN, end: 180, color: '#42a5f5' },
      { name: 'Scav.', start: 180, end: TRANSFER_CLOSE, color: '#42a5f5' },
      { name: 'Power', start: TRANSFER_CLOSE, end: 360, color: '#ef5350' }
    ];

    phases.forEach(function (ph) {
      var sx = x + (ph.start / 360) * w;
      var ew = ((ph.end - ph.start) / 360) * w;
      var isActive = a >= ph.start && a < ph.end;
      ctx.fillStyle = isActive ? ph.color : 'rgba(100,116,139,0.25)';
      ctx.fillRect(sx + 1, y, ew - 2, 18);
      ctx.font = (isActive ? 'bold ' : '') + '9px sans-serif';
      ctx.fillStyle = isActive ? '#fff' : '#6b7a99';
      ctx.textAlign = 'center';
      ctx.fillText(ph.name, sx + ew / 2, y + 13);
    });

    // Position marker
    var markerX = x + (a / 360) * w;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(markerX - 4, y - 2);
    ctx.lineTo(markerX + 4, y - 2);
    ctx.lineTo(markerX, y + 4);
    ctx.fill();
  }

  /* ── 6. Animation ── */
  var prevPhase = '';  // track phase changes to clear particles

  function animate(timestamp) {
    if (!playing) return;
    if (lastTime === 0) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    var degPerSec = rpm * 6;
    crankAngle = (crankAngle + degPerSec * dt) % 360;

    // Clear particles on major phase change
    var curPhase = getPhaseSimple(crankAngle);
    if (curPhase !== prevPhase) {
      particles = [];
      prevPhase = curPhase;
    }

    spawnParticles(dt);
    updateParticles(dt);
    updateReadouts();
    draw();
    animId = requestAnimationFrame(animate);
  }

  function togglePlay() {
    // Stop any step animation first
    if (stepping) {
      stepping = false;
      if (animId) cancelAnimationFrame(animId);
    }
    playing = !playing;
    btnPlay.textContent = playing ? '\u23F8 Pause' : '\u25B6 Play';
    if (playing) {
      lastTime = 0;
      animId = requestAnimationFrame(animate);
    } else if (animId) {
      cancelAnimationFrame(animId);
    }
  }

  function stepPhase() {
    if (playing) togglePlay();
    if (stepping) return; // already stepping, ignore

    // Step to next major phase boundary with animation
    var boundaries = [0, EXHAUST_OPEN, 180, TRANSFER_CLOSE, EXHAUST_CLOSE, 360];
    stepTarget = 360;
    for (var i = 0; i < boundaries.length; i++) {
      if (boundaries[i] > crankAngle + 1) { stepTarget = boundaries[i]; break; }
    }

    stepping = true;
    lastTime = 0;
    animId = requestAnimationFrame(stepAnimate);
  }

  function stepAnimate(timestamp) {
    if (!stepping) return;
    if (lastTime === 0) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    crankAngle += STEP_SPEED * dt;

    // Clear particles on major phase change
    var curPhase = getPhaseSimple(crankAngle);
    if (curPhase !== prevPhase) {
      particles = [];
      prevPhase = curPhase;
    }

    if (crankAngle >= stepTarget) {
      crankAngle = stepTarget % 360;
      stepping = false;
      lastTime = 0;
    }

    spawnParticles(dt);
    updateParticles(dt);
    updateReadouts();
    draw();
    if (stepping) animId = requestAnimationFrame(stepAnimate);
  }

  function updateReadouts() {
    var a = ((crankAngle % 360) + 360) % 360;
    var state = getCycleState(a);
    roPhase.textContent = getPhase(a);
    roAngle.textContent = Math.round(a) + '\u00B0';
    roPressure.textContent = Math.round(state.P) + ' kPa';
    roTemp.textContent = Math.round(state.T) + ' K';
    roEff.textContent = (calcEfficiency(compRatio) * 100).toFixed(1) + '%';

    var ports = [];
    if (isExhaustOpen(a)) ports.push('Exhaust');
    if (isTransferOpen(a)) ports.push('Transfer');
    if (isIntakeOpen(a)) ports.push('Intake');
    roPorts.textContent = ports.length > 0 ? ports.join(', ') : 'All Closed';
  }

  /* ── 7. Event listeners ── */
  btnPlay.addEventListener('click', togglePlay);
  btnStep.addEventListener('click', stepPhase);

  rpmSlider.addEventListener('input', function () {
    rpm = parseInt(this.value);
    rpmVal.textContent = rpm;
  });

  crSlider.addEventListener('input', function () {
    compRatio = parseFloat(this.value);
    crVal.textContent = compRatio;
    updateReadouts();
    if (!playing) draw();
  });

  /* ── 8. Mode switching ── */
  modeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.value;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;
    simPanel.style.display = (m === 'simulate') ? '' : 'none';
    explorePanel.style.display = (m === 'explore') ? '' : 'none';
    practicePanel.style.display = (m === 'practice') ? '' : 'none';
    quizPanel.style.display = (m === 'quiz') ? '' : 'none';

    if (m === 'simulate') { if (!playing) draw(); }
    else { if (playing) togglePlay(); }

    if (m === 'explore') buildExplorePanel();
    if (m === 'practice') resetPractice();
    if (m === 'quiz') startQuiz();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPLORE MODE
     ═══════════════════════════════════════════════════════════════ */

  var CONCEPTS = [
    {
      cat: 'fundamentals', name: 'Two-Stroke Cycle',
      formula: 'One power stroke per revolution (360°)',
      desc: 'A two-stroke engine completes intake, compression, power, and exhaust in a single crankshaft revolution. The upstroke combines compression (above piston) with crankcase intake (below piston). The downstroke combines power (above) with crankcase compression (below). This gives twice the firing frequency of a four-stroke at the same RPM.',
      example: { problem: 'A 2-stroke engine runs at 6000 RPM. How many power strokes per second?', steps: ['Power strokes/sec = RPM / 60', '= 6000 / 60', '= 100 power strokes/sec'], answer: '100 per second' }
    },
    {
      cat: 'fundamentals', name: 'Crankcase Compression',
      formula: 'Crankcase acts as a pre-compression chamber',
      desc: 'The sealed crankcase below the piston serves as a pump. During the upstroke, the piston creates a partial vacuum that draws fresh air-fuel mixture through the intake port (or reed valve). During the downstroke, this mixture is compressed in the crankcase and pushed through the transfer port into the cylinder.',
      example: { problem: 'Why is the crankcase sealed in a 2-stroke?', steps: ['The crankcase must be sealed to create a pressure difference.', 'Upstroke → vacuum draws in fresh mixture.', 'Downstroke → compression pushes mixture to cylinder.'], answer: 'To act as a pre-compression pump' }
    },
    {
      cat: 'fundamentals', name: 'Scavenging',
      formula: 'Trapping efficiency η_tr = m_trapped / m_delivered',
      desc: 'Scavenging is the process of replacing burnt exhaust gas with fresh charge. In loop scavenging (most common), fresh charge enters from the transfer port and pushes exhaust gas out through the exhaust port. The transfer port is angled to direct flow upward, creating a loop pattern.',
      example: { problem: 'Delivered charge = 0.5 g, trapped charge = 0.35 g. Find trapping efficiency.', steps: ['η_tr = m_trapped / m_delivered', '= 0.35 / 0.5', '= 0.70 = 70%'], answer: '70%' }
    },
    {
      cat: 'fundamentals', name: 'Short-Circuiting',
      formula: 'Loss = m_delivered - m_trapped',
      desc: 'Short-circuiting occurs when fresh charge escapes directly through the open exhaust port during the scavenging process, since both exhaust and transfer ports are open simultaneously. This wastes fuel, increases emissions, and reduces efficiency. Modern engines use shaped piston crowns and tuned exhausts to minimize this.',
      example: { problem: 'Delivered = 0.5 g, short-circuited = 0.12 g. What fraction is lost?', steps: ['Loss fraction = short-circuited / delivered', '= 0.12 / 0.5', '= 0.24 = 24%'], answer: '24% lost' }
    },
    {
      cat: 'ports', name: 'Exhaust Port Timing',
      formula: 'Opens: ~110° ATDC, Closes: ~250° ATDC',
      desc: 'The exhaust port is positioned higher on the cylinder wall than the transfer port, so it opens first during the downstroke and closes last during the upstroke. This allows initial blowdown before fresh charge enters, and ensures the exhaust closes after the transfer port to help push out remaining exhaust.',
      example: { problem: 'Exhaust opens at 110° ATDC. How many degrees before BDC?', steps: ['BDC = 180° ATDC', 'Degrees before BDC = 180 - 110', '= 70° before BDC'], answer: '70°' }
    },
    {
      cat: 'ports', name: 'Transfer Port Timing',
      formula: 'Opens: ~125° ATDC, Closes: ~235° ATDC',
      desc: 'Transfer ports connect the crankcase to the cylinder and are positioned lower than the exhaust port. They open after the exhaust port (to ensure blowdown pressure drops first) and close before it (so exhaust stays open briefly after fresh charge stops flowing, preventing backflow).',
      example: { problem: 'Transfer opens at 125°, exhaust opens at 110°. What is the blowdown angle?', steps: ['Blowdown angle = transfer open - exhaust open', '= 125 - 110', '= 15° of blowdown before scavenging starts'], answer: '15°' }
    },
    {
      cat: 'ports', name: 'Intake Port / Reed Valve',
      formula: 'Reed valve opens when crankcase pressure < atmospheric',
      desc: 'The intake system admits fresh air-fuel mixture into the crankcase. Simpler engines use piston-controlled ports, while modern engines use reed valves (thin flexible metal or carbon fiber flaps) that open automatically when crankcase pressure drops below atmospheric during the upstroke.',
      example: { problem: 'Why are reed valves preferred over piston ports?', steps: ['Reed valves are pressure-actuated, not position-actuated.', 'They open earlier and close more precisely.', 'They prevent reverse flow better than piston ports.'], answer: 'Better timing and no backflow' }
    },
    {
      cat: 'ports', name: 'Port Timing Diagram',
      formula: 'Circular diagram showing port open/close angles',
      desc: 'A port timing diagram is a circular representation (0-360°) showing when each port opens and closes relative to crankshaft position. The exhaust port has the widest opening arc (symmetric about BDC), followed by the transfer port. The intake timing depends on reed valve or piston port design.',
      example: { problem: 'Draw the sequence: EO=110°, TO=125°, BDC=180°, TC=235°, EC=250°, TDC=360°.', steps: ['110° - Exhaust opens (EO)', '125° - Transfer opens (TO)', '180° - BDC', '235° - Transfer closes (TC)', '250° - Exhaust closes (EC)', '360° - TDC (ignition)'], answer: 'EO→TO→BDC→TC→EC→TDC' }
    },
    {
      cat: 'comparison', name: 'Power Output per Rev',
      formula: '2-stroke: 1 power stroke/rev vs 4-stroke: 0.5/rev',
      desc: 'A two-stroke engine fires every revolution, while a four-stroke fires every other revolution. Theoretically, a two-stroke should produce twice the power of an equivalent four-stroke. In practice, the advantage is about 1.5x due to poorer scavenging, lower volumetric efficiency, and charge loss.',
      example: { problem: 'A 4-stroke makes 50 kW at 6000 RPM. Estimate equivalent 2-stroke power.', steps: ['Theoretical: 2x = 100 kW', 'Practical factor: ~1.5x', 'Estimated 2-stroke power ≈ 75 kW'], answer: '~75 kW (1.5× factor)' }
    },
    {
      cat: 'comparison', name: 'Fuel Efficiency',
      formula: '2-stroke SFC typically 15-30% higher than 4-stroke',
      desc: 'Two-stroke engines are less fuel efficient due to: (1) short-circuiting losses during scavenging, (2) incomplete combustion from residual exhaust mixing, and (3) lower effective compression ratio. Modern direct-injection two-strokes significantly reduce these losses.',
      example: { problem: '4-stroke SFC = 250 g/kWh. Estimate 2-stroke SFC at 20% higher.', steps: ['2-stroke SFC = 250 × 1.20', '= 300 g/kWh'], answer: '300 g/kWh' }
    },
    {
      cat: 'comparison', name: 'Weight & Simplicity',
      formula: 'No valvetrain → fewer parts → lighter',
      desc: 'Two-stroke engines have no camshaft, no valves, no rocker arms, and no timing chain/belt. The piston controls all gas exchange through ports. This makes them significantly lighter, cheaper, and easier to maintain — ideal for handheld power tools, small motorcycles, and marine outboard motors.',
      example: { problem: 'List 5 parts in a 4-stroke not needed in a 2-stroke.', steps: ['1. Camshaft', '2. Intake and exhaust valves', '3. Valve springs', '4. Rocker arms/followers', '5. Timing chain/belt'], answer: '5 fewer moving parts' }
    },
    {
      cat: 'comparison', name: 'Emissions',
      formula: 'HC emissions 2-5× higher in carbureted 2-stroke',
      desc: 'Carbureted two-stroke engines produce significantly more unburned hydrocarbon (HC) emissions because fresh fuel-air mixture escapes through the exhaust port during scavenging. They also burn lubricating oil mixed with fuel. This is why most countries have banned carbureted two-strokes for road vehicles.',
      example: { problem: 'Why do 2-strokes produce blue smoke?', steps: ['Oil is mixed with fuel (petroil mix).', 'Oil burns incompletely during combustion.', 'Unburned oil droplets form visible blue smoke.'], answer: 'Burning of mixed lubricating oil' }
    },
    {
      cat: 'performance', name: 'Delivery Ratio',
      formula: 'DR = m_delivered / m_reference',
      desc: 'The delivery ratio measures the mass of fresh charge delivered to the cylinder compared to a reference mass (based on swept volume at ambient conditions). A delivery ratio above 1.0 means more charge was delivered than the cylinder volume — possible with tuned exhaust pipes (expansion chambers).',
      example: { problem: 'Ambient density = 1.2 kg/m³, V_s = 125 cm³, delivered = 0.18 g. Find DR.', steps: ['m_ref = ρ × V_s = 1.2 × 125 × 10⁻⁶ = 0.15 g', 'DR = m_delivered / m_ref', '= 0.18 / 0.15 = 1.20'], answer: '1.20 (120%)' }
    },
    {
      cat: 'performance', name: 'Expansion Chamber',
      formula: 'Tuned exhaust creates pressure waves to improve trapping',
      desc: 'A tuned expansion chamber uses reflected pressure waves to push escaped fresh charge back into the cylinder before the exhaust port closes. The divergent cone creates a negative pressure wave, while the convergent cone creates a positive wave timed to arrive at the exhaust port just before closure.',
      example: { problem: 'Why does changing RPM affect expansion chamber effectiveness?', steps: ['Wave timing depends on exhaust velocity and pipe length.', 'At design RPM, waves arrive at the correct crank angle.', 'Off-design RPM → waves arrive too early/late → less trapping.'], answer: 'Wave timing is RPM-dependent' }
    },
    {
      cat: 'performance', name: 'Brake Mean Effective Pressure',
      formula: 'BMEP = BP × 60 / (V_s × N)',
      desc: 'BMEP for a two-stroke engine uses N (RPM) directly instead of N/2 (as in four-stroke), because there is one power stroke per revolution. This makes BMEP values for two-strokes appear lower than four-strokes of equal power density. Typical BMEP: 500-800 kPa.',
      example: { problem: 'BP = 15 kW, V_s = 250 cm³, N = 8000 RPM. Find BMEP.', steps: ['BMEP = BP × 60 / (V_s × N)', '= 15000 × 60 / (250 × 10⁻⁶ × 8000)', '= 900000 / 2.0', '= 450000 Pa = 450 kPa'], answer: '450 kPa' }
    },
    {
      cat: 'performance', name: 'Specific Power Output',
      formula: 'P/V = BP / total displacement',
      desc: 'Two-stroke engines achieve higher specific power output (kW per litre) than four-strokes because they fire every revolution. Modern racing two-strokes can exceed 200 kW/L, while typical four-strokes achieve 80-120 kW/L. This makes two-strokes preferred where power-to-weight ratio is critical.',
      example: { problem: '125 cc 2-stroke makes 28 kW. Find specific power.', steps: ['Specific power = 28 / 0.125', '= 224 kW/L'], answer: '224 kW/L' }
    }
  ];

  var exploreCategory = 'fundamentals';

  function buildExplorePanel() {
    var grid = document.getElementById('concept-grid');
    grid.innerHTML = '';
    CONCEPTS.filter(function (c) { return c.cat === exploreCategory; }).forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'concept-card';
      card.innerHTML =
        '<h3>' + c.name + '</h3>' +
        '<div class="cc-formula">' + c.formula + '</div>' +
        '<div class="cc-desc">' + c.desc + '</div>' +
        '<div class="cc-example">' +
          '<div class="cc-example-title">Worked Example</div>' +
          '<p><strong>' + c.example.problem + '</strong></p>' +
          c.example.steps.map(function (s) { return '<p>' + s + '</p>'; }).join('') +
          '<p><strong>Answer: ' + c.example.answer + '</strong></p>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  document.getElementById('explore-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCategory = e.target.dataset.cat;
    document.querySelectorAll('#explore-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.cat === exploreCategory);
    });
    buildExplorePanel();
  });

  /* ═══════════════════════════════════════════════════════════════
     PRACTICE MODE
     ═══════════════════════════════════════════════════════════════ */

  var practiceCorrect = 0;
  var practiceTotal = 0;
  var currentProblem = null;

  function randRange(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(randRange(a, b + 1)); }
  function round(v, d) { return parseFloat(v.toFixed(d)); }

  var PROBLEM_GENERATORS = [
    function () {
      var N = randInt(3000, 10000);
      var ps = round(N / 60, 1);
      return { prompt: 'A 2-stroke engine runs at ' + N + ' RPM. How many power strokes per second?', steps: ['For 2-stroke: 1 power stroke per revolution', 'PS/sec = RPM / 60', '= ' + N + ' / 60 = ' + ps], answer: ps, unit: '/sec', tol: 0.5 };
    },
    function () {
      var r = randInt(6, 12);
      var idealEff = round((1 - 1 / Math.pow(r, GAMMA - 1)) * 100, 1);
      var realEff = round(idealEff * 0.7, 1);
      return { prompt: 'Two-stroke engine with r = ' + r + '. Find actual thermal efficiency (assume 70% of ideal Otto). γ = 1.4.', steps: ['Ideal η = 1 - 1/r^(γ-1) = 1 - 1/' + r + '^0.4', '= ' + idealEff + '% (ideal)', 'Actual η = ' + idealEff + ' × 0.7 = ' + realEff + '%'], answer: realEff, unit: '%', tol: 1.0 };
    },
    function () {
      var mDel = round(randRange(0.3, 0.7), 2);
      var mTrap = round(mDel * randRange(0.55, 0.85), 2);
      var etaTr = round(mTrap / mDel * 100, 1);
      return { prompt: 'Delivered charge = ' + mDel + ' g, trapped charge = ' + mTrap + ' g. Find trapping efficiency.', steps: ['η_tr = m_trapped / m_delivered', '= ' + mTrap + ' / ' + mDel, '= ' + round(mTrap / mDel, 3), '= ' + etaTr + '%'], answer: etaTr, unit: '%', tol: 0.5 };
    },
    function () {
      var D = randInt(40, 80);
      var L = randInt(40, 70);
      var Vs = round(Math.PI / 4 * Math.pow(D / 10, 2) * (L / 10), 1);
      return { prompt: 'Bore = ' + D + ' mm, stroke = ' + L + ' mm. Find swept volume in cm³.', steps: ['V_s = (π/4) × D² × L', '= (π/4) × ' + D + '² × ' + L + ' mm³', '= ' + round(Math.PI / 4 * D * D * L, 0) + ' mm³', '= ' + Vs + ' cm³'], answer: Vs, unit: 'cm³', tol: 1.0 };
    },
    function () {
      var exhOpen = randInt(95, 120);
      var trOpen = exhOpen + randInt(10, 20);
      var blowdown = trOpen - exhOpen;
      return { prompt: 'Exhaust port opens at ' + exhOpen + '° ATDC, transfer port opens at ' + trOpen + '° ATDC. Find blowdown angle.', steps: ['Blowdown = transfer open - exhaust open', '= ' + trOpen + '° - ' + exhOpen + '°', '= ' + blowdown + '°'], answer: blowdown, unit: '°', tol: 0 };
    },
    function () {
      var BP = randInt(8, 40);
      var Vs = randInt(80, 300);
      var N = randInt(5000, 10000);
      var BMEP = round(BP * 1000 * 60 / (Vs * 1e-6 * N) / 1000, 1);
      return { prompt: 'Two-stroke: BP = ' + BP + ' kW, V_s = ' + Vs + ' cm³, N = ' + N + ' RPM. Find BMEP in kPa.', steps: ['BMEP = BP × 60 / (V_s × N)', '= ' + BP + '000 × 60 / (' + Vs + '×10⁻⁶ × ' + N + ')', '= ' + round(BP * 60000 / (Vs * 1e-6 * N), 0) + ' Pa', '= ' + BMEP + ' kPa'], answer: BMEP, unit: 'kPa', tol: 10 };
    },
    function () {
      var rho = round(randRange(1.1, 1.25), 2);
      var Vs = randInt(100, 250);
      var mRef = round(1.2 * Vs * 1e-3, 3); // g
      var mDel = round(mRef * rho, 3);
      return { prompt: 'Ambient density = 1.2 kg/m³, V_s = ' + Vs + ' cm³. Delivered mass = ' + mDel + ' g. Find delivery ratio.', steps: ['m_ref = ρ × V_s = 1.2 × ' + Vs + '×10⁻⁶', '= ' + round(mRef, 3) + ' g', 'DR = ' + mDel + ' / ' + round(mRef, 3), '= ' + round(mDel / mRef, 2)], answer: round(mDel / mRef, 2), unit: '', tol: 0.05 };
    },
    function () {
      var cc = randInt(100, 250);
      var BP = round(cc * randRange(0.16, 0.28), 1);
      var sp = round(BP / (cc / 1000), 0);
      return { prompt: 'A ' + cc + ' cm³ two-stroke makes ' + BP + ' kW. Find specific power output in kW/L.', steps: ['Displacement in litres = ' + cc + ' / 1000 = ' + round(cc / 1000, 3) + ' L', 'Specific power = ' + BP + ' / ' + round(cc / 1000, 3), '= ' + sp + ' kW/L'], answer: sp, unit: 'kW/L', tol: 5 };
    },
    function () {
      var sfc4 = randInt(230, 280);
      var penalty = randInt(15, 30);
      var sfc2 = round(sfc4 * (1 + penalty / 100), 0);
      return { prompt: 'A 4-stroke engine has SFC = ' + sfc4 + ' g/kWh. The equivalent 2-stroke is ' + penalty + '% higher. Find 2-stroke SFC.', steps: ['2-stroke SFC = ' + sfc4 + ' × (1 + ' + penalty + '/100)', '= ' + sfc4 + ' × ' + round(1 + penalty / 100, 2), '= ' + sfc2 + ' g/kWh'], answer: sfc2, unit: 'g/kWh', tol: 2 };
    },
    function () {
      var exhOpen = randInt(100, 115);
      var bdcAngle = 180;
      var degBeforeBDC = bdcAngle - exhOpen;
      return { prompt: 'Exhaust port opens at ' + exhOpen + '° after TDC. How many degrees before BDC does it open?', steps: ['BDC = 180° after TDC', 'Degrees before BDC = 180 - ' + exhOpen, '= ' + degBeforeBDC + '°'], answer: degBeforeBDC, unit: '°', tol: 0 };
    },
    function () {
      var mDel = round(randRange(0.3, 0.6), 2);
      var mSC = round(mDel * randRange(0.15, 0.30), 2);
      var lossPct = round(mSC / mDel * 100, 1);
      return { prompt: 'Delivered mass = ' + mDel + ' g, short-circuited mass = ' + mSC + ' g. What percentage is lost?', steps: ['Loss % = m_SC / m_delivered × 100', '= ' + mSC + ' / ' + mDel + ' × 100', '= ' + lossPct + '%'], answer: lossPct, unit: '%', tol: 0.5 };
    }
  ];

  function generateProblem() {
    var gen = PROBLEM_GENERATORS[randInt(0, PROBLEM_GENERATORS.length - 1)];
    currentProblem = gen();
    document.getElementById('practice-prompt').textContent = currentProblem.prompt;
    document.getElementById('practice-unit').textContent = currentProblem.unit;
    document.getElementById('practice-input').value = '';
    document.getElementById('practice-feedback').textContent = '';
    document.getElementById('practice-feedback').className = 'feedback';
    document.getElementById('solution-panel').style.display = 'none';
  }

  function checkPractice() {
    if (!currentProblem) return;
    var input = parseFloat(document.getElementById('practice-input').value);
    if (isNaN(input)) return;
    practiceTotal++;
    var diff = Math.abs(input - currentProblem.answer);
    var fb = document.getElementById('practice-feedback');
    if (diff <= currentProblem.tol) {
      practiceCorrect++;
      fb.textContent = '\u2705 Correct! ' + currentProblem.answer + ' ' + currentProblem.unit;
      fb.className = 'feedback ok';
    } else {
      fb.textContent = '\u274C Incorrect. Correct answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      fb.className = 'feedback err';
    }
    document.getElementById('practice-score').textContent = practiceCorrect + ' / ' + practiceTotal;
  }

  function showSolution() {
    if (!currentProblem) return;
    var panel = document.getElementById('solution-panel');
    panel.style.display = '';
    panel.innerHTML = '<strong>Solution:</strong><br>' +
      currentProblem.steps.map(function (s, i) {
        return '<div class="step"><span class="step-num">Step ' + (i + 1) + ':</span> ' + s + '</div>';
      }).join('');
  }

  function resetPractice() {
    practiceCorrect = 0;
    practiceTotal = 0;
    document.getElementById('practice-score').textContent = '0 / 0';
    generateProblem();
  }

  document.getElementById('btn-check').addEventListener('click', checkPractice);
  document.getElementById('btn-solution').addEventListener('click', showSolution);
  document.getElementById('btn-next-practice').addEventListener('click', generateProblem);
  document.getElementById('practice-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') checkPractice();
  });

  /* ═══════════════════════════════════════════════════════════════
     QUIZ MODE
     ═══════════════════════════════════════════════════════════════ */

  var QUIZ_SIZE = 5;
  var quizSet = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswered = false;

  var QUIZ_POOL = [
    { type: 'mcq', prompt: 'A two-stroke engine produces one power stroke every:', options: ['2 revolutions (720°)', '1 revolution (360°)', '4 revolutions (1440°)', '0.5 revolutions (180°)'], correct: 1 },
    { type: 'mcq', prompt: 'Which port opens first during the downstroke in a 2-stroke engine?', options: ['Transfer port', 'Intake port', 'Exhaust port', 'All open simultaneously'], correct: 2 },
    { type: 'mcq', prompt: 'What is the function of the crankcase in a 2-stroke engine?', options: ['Only holds the crankshaft', 'Acts as a pre-compression chamber for fresh charge', 'Contains the oil sump', 'Cools the engine'], correct: 1 },
    { type: 'mcq', prompt: '"Short-circuiting" in a 2-stroke engine refers to:', options: ['Electrical failure', 'Fresh charge escaping through the exhaust port', 'Crankshaft breaking', 'Ignition timing error'], correct: 1 },
    { type: 'mcq', prompt: 'Compared to a 4-stroke, a 2-stroke engine has:', options: ['More moving parts', 'Lower power-to-weight ratio', 'Higher power-to-weight ratio', 'Same number of parts'], correct: 2 },
    { type: 'mcq', prompt: 'Why do 2-stroke engines typically produce blue smoke?', options: ['Rich fuel mixture', 'Burning of lubricating oil mixed with fuel', 'Cold engine', 'Faulty spark plug'], correct: 1 },
    { type: 'mcq', prompt: 'A reed valve in a 2-stroke engine controls flow into the:', options: ['Cylinder', 'Exhaust pipe', 'Crankcase', 'Transfer port'], correct: 2 },
    { type: 'mcq', prompt: 'The blowdown period in a 2-stroke is the angle between:', options: ['TDC and BDC', 'Exhaust port opening and transfer port opening', 'Transfer port opening and closing', 'Intake and exhaust'], correct: 1 },
    { type: 'mcq', prompt: 'An expansion chamber on a 2-stroke exhaust:', options: ['Only reduces noise', 'Uses pressure waves to improve trapping efficiency', 'Has no performance effect', 'Increases fuel consumption'], correct: 1 },
    { type: 'mcq', prompt: 'The transfer port in a 2-stroke connects:', options: ['Cylinder to exhaust', 'Crankcase to cylinder', 'Intake to cylinder', 'Crankcase to exhaust'], correct: 1 },
    { type: 'numeric', prompt: 'Power strokes per second at 9000 RPM (2-stroke)?', answer: 150, unit: '/sec', tol: 1 },
    { type: 'numeric', prompt: 'Exhaust opens at 105° ATDC. Degrees before BDC?', answer: 75, unit: '°', tol: 0 },
    { type: 'numeric', prompt: 'Delivered = 0.4 g, trapped = 0.3 g. Trapping efficiency in %?', answer: 75, unit: '%', tol: 1 },
    { type: 'numeric', prompt: '200 cm³ 2-stroke makes 40 kW. Specific power in kW/L?', answer: 200, unit: 'kW/L', tol: 5 },
    { type: 'numeric', prompt: 'Bore 54 mm, stroke 54 mm. Swept volume in cm³?', answer: round(Math.PI / 4 * 54 * 54 * 54 / 1000, 1), unit: 'cm³', tol: 2 }
  ];

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
    return arr;
  }

  function startQuiz() {
    quizScore = 0;
    quizIdx = 0;
    quizAnswered = false;
    quizSet = shuffle(QUIZ_POOL.slice()).slice(0, QUIZ_SIZE);
    document.getElementById('quiz-result').style.display = 'none';
    document.getElementById('quiz-bar').style.display = '';
    showQuizQuestion();
  }

  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    document.getElementById('quiz-counter').textContent = 'Q ' + (quizIdx + 1) + ' / ' + QUIZ_SIZE;
    document.getElementById('quiz-prompt').textContent = q.prompt;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-feedback').className = 'feedback';
    document.getElementById('btn-quiz-submit').disabled = false;
    document.getElementById('btn-quiz-next').disabled = true;
    quizAnswered = false;

    var optionsDiv = document.getElementById('quiz-options');
    var inputGroup = document.getElementById('quiz-input-group');

    if (q.type === 'mcq') {
      optionsDiv.style.display = '';
      inputGroup.style.display = 'none';
      optionsDiv.innerHTML = '';
      q.options.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          document.querySelectorAll('.quiz-opt').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          q._selected = i;
        });
        optionsDiv.appendChild(btn);
      });
    } else {
      optionsDiv.style.display = 'none';
      inputGroup.style.display = '';
      document.getElementById('quiz-input').value = '';
      document.getElementById('quiz-unit').textContent = q.unit;
    }
  }

  function submitQuiz() {
    if (quizAnswered) return;
    var q = quizSet[quizIdx];
    var correct = false;
    var fb = document.getElementById('quiz-feedback');

    if (q.type === 'mcq') {
      if (q._selected === undefined) return;
      correct = (q._selected === q.correct);
      document.querySelectorAll('.quiz-opt').forEach(function (opt, i) {
        if (i === q.correct) opt.classList.add('correct');
        if (i === q._selected && !correct) opt.classList.add('wrong');
      });
    } else {
      var val = parseFloat(document.getElementById('quiz-input').value);
      if (isNaN(val)) return;
      correct = Math.abs(val - q.answer) <= q.tol;
      if (!correct) {
        fb.textContent = '\u274C Correct answer: ' + q.answer + ' ' + q.unit;
        fb.className = 'feedback err';
      }
    }

    if (correct) {
      quizScore++;
      fb.textContent = '\u2705 Correct!';
      fb.className = 'feedback ok';
    } else if (q.type === 'mcq') {
      fb.textContent = '\u274C Wrong! Correct: ' + q.options[q.correct];
      fb.className = 'feedback err';
    }

    q._correct = correct;
    quizAnswered = true;
    document.getElementById('btn-quiz-submit').disabled = true;
    document.getElementById('btn-quiz-next').disabled = false;
  }

  function nextQuizQuestion() {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) showQuizResult();
    else showQuizQuestion();
  }

  function showQuizResult() {
    document.getElementById('quiz-bar').style.display = 'none';
    var resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = '';

    var scoreClass = quizScore >= 5 ? 'perfect' : quizScore >= 3 ? 'good' : 'poor';
    var stars = quizScore >= 5 ? '\u2605\u2605\u2605' : quizScore >= 3 ? '\u2605\u2605' : '\u2605';

    var rows = quizSet.map(function (q, i) {
      var correctAns = q.type === 'mcq' ? q.options[q.correct] : q.answer + ' ' + q.unit;
      return '<div class="qr-row ' + (q._correct ? 'ok' : 'err') + '">' +
        '<span class="qr-q">Q' + (i + 1) + ': ' + q.prompt.substring(0, 55) + (q.prompt.length > 55 ? '...' : '') + '</span>' +
        '<span class="qr-a">' + correctAns + '</span>' +
        '<span class="qr-icon">' + (q._correct ? '\u2705' : '\u274C') + '</span>' +
      '</div>';
    }).join('');

    resultDiv.innerHTML =
      '<div class="qr-header">' +
        '<div class="qr-score ' + scoreClass + '">' + quizScore + ' / ' + QUIZ_SIZE + '</div>' +
        '<div class="qr-stars">' + stars + '</div>' +
      '</div>' +
      '<div class="qr-rows">' + rows + '</div>' +
      '<div class="qr-retry"><button class="btn btn-primary" id="btn-retry-quiz">New Quiz</button></div>';

    document.getElementById('btn-retry-quiz').addEventListener('click', startQuiz);
  }

  document.getElementById('btn-quiz-submit').addEventListener('click', submitQuiz);
  document.getElementById('btn-quiz-next').addEventListener('click', nextQuizQuestion);
  document.getElementById('quiz-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitQuiz();
  });

  /* ── 9. Canvas resize ── */
  function resizeCanvas() {
    var container = canvas.parentElement;
    var w = container.clientWidth - 20;
    var ratio = 520 / 960;
    canvas.width = Math.min(960, w);
    canvas.height = Math.round(canvas.width * ratio);
    if (!playing) draw();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  /* ── 10. Init ── */
  updateReadouts();
  draw();

})();
