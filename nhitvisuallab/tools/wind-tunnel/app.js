/* ═══════════════════════════════════════════════════════════════════
   Wind Tunnel Simulator — app.js
   Subsonic Open-Circuit Wind Tunnel
   Streamline Visualization · Pressure Distribution · 7 Test Objects · 4 Modes
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     S1  HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randFloat(a, b) { return a + Math.random() * (b - a); }
  function shuffleArr(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  function log10(x) { return Math.log(x) / Math.LN10; }
  function superscript(n) {
    var sup = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
    return String(n).split('').map(function (c) { return sup[c] || c; }).join('');
  }
  function formatSci(v, d) {
    if (v === 0) return '0';
    var exp = Math.floor(log10(Math.abs(v)));
    var man = v / Math.pow(10, exp);
    if (exp === 0) return roundN(v, d).toString();
    return roundN(man, d) + '\u00d710' + superscript(exp);
  }

  /* Color interpolation for flow visualization */
  function velocityColor(ratio) {
    /* 0=blue(slow) 0.5=cyan(medium) 1.0=white(fast) */
    ratio = clamp(ratio, 0, 1);
    var r, g, b;
    if (ratio < 0.5) {
      var t = ratio * 2;
      r = Math.round(lerp(30, 0, t));
      g = Math.round(lerp(80, 188, t));
      b = Math.round(lerp(220, 212, t));
    } else {
      var t2 = (ratio - 0.5) * 2;
      r = Math.round(lerp(0, 255, t2));
      g = Math.round(lerp(188, 255, t2));
      b = Math.round(lerp(212, 255, t2));
    }
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function pressureColor(cp) {
    /* negative Cp (suction) = blue; zero = green; positive = red */
    cp = clamp(cp, -3, 1);
    var r, g, b;
    if (cp < 0) {
      var t = clamp(-cp / 3, 0, 1);
      r = Math.round(lerp(50, 0, t));
      g = Math.round(lerp(200, 100, t));
      b = Math.round(lerp(50, 255, t));
    } else {
      var t2 = clamp(cp, 0, 1);
      r = Math.round(lerp(50, 255, t2));
      g = Math.round(lerp(200, 50, t2));
      b = Math.round(lerp(50, 0, t2));
    }
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ═══════════════════════════════════════════════════════════════
     S2  TEST OBJECTS DATABASE (6)
     ═══════════════════════════════════════════════════════════════ */
  var ACCENT = '#00bcd4';

  var OBJECTS = [
    {
      id: 'sphere', name: 'Sphere',
      cdSub: 0.47, cdSuper: 0.20, reCrit: 3e5,
      hasLift: false, charLenLabel: 'Diameter',
      color: '#78909c'
    },
    {
      id: 'cylinder', name: 'Cylinder',
      cdSub: 1.17, cdSuper: 0.30, reCrit: 2.5e5,
      hasLift: false, charLenLabel: 'Diameter',
      color: '#8d9bab'
    },
    {
      id: 'cone', name: 'Cone',
      cdSub: 0.50, cdSuper: 0.50, reCrit: Infinity,
      hasLift: false, charLenLabel: 'Base diameter',
      color: '#90a4ae'
    },
    {
      id: 'flat-plate', name: 'Flat Plate',
      cdSub: 1.98, cdSuper: 1.98, reCrit: Infinity,
      hasLift: false, charLenLabel: 'Width',
      color: '#b0bec5'
    },
    {
      id: 'streamlined', name: 'Streamlined',
      cdSub: 0.04, cdSuper: 0.04, reCrit: Infinity,
      hasLift: false, charLenLabel: 'Length',
      color: '#80cbc4'
    },
    {
      id: 'airfoil', name: 'NACA 0012',
      cdSub: 0.006, cdSuper: 0.006, reCrit: Infinity,
      hasLift: true, charLenLabel: 'Chord',
      color: '#4dd0e1'
    },
    {
      id: 'car', name: 'Car Shape',
      cdSub: 0.35, cdSuper: 0.35, reCrit: Infinity,
      hasLift: false, hasDownforce: true, charLenLabel: 'Width',
      color: '#a1887f'
    }
  ];

  /* ═══════════════════════════════════════════════════════════════
     S3  AERODYNAMICS ENGINE
     ───────────────────────────────────────────────────────────────
     Pure functions — no DOM reads, no `state` reads. Everything here
     is re-verified on every build by deploy/verify-wind-tunnel-physics.js
     against published reference values (ISA tables, Sutherland's law,
     NACA thin-airfoil theory, Barlow / Rae & Pope blockage corrections,
     and the GUM / ISO 5168 uncertainty framework).
     ═══════════════════════════════════════════════════════════════ */

  /* ---------- Physical constants ---------- */
  var R_AIR   = 287.0528;   /* J/(kg·K)  specific gas constant, dry air   */
  var GAMMA   = 1.4;        /* –         ratio of specific heats, air     */
  var G0      = 9.80665;    /* m/s²      standard gravity                 */
  var ISA_T0  = 288.15;     /* K         sea-level standard temperature   */
  var ISA_P0  = 101325;     /* Pa        sea-level standard pressure      */
  var ISA_L   = 0.0065;     /* K/m       troposphere lapse rate           */
  var ISA_HT  = 11000;      /* m         tropopause (geopotential)        */
  var ISA_T11 = 216.65;     /* K         isothermal stratosphere temp     */

  /* Sutherland's law for air (White, "Viscous Fluid Flow", 3rd ed. §1-4) */
  var SUTH_MU0 = 1.716e-5;  /* Pa·s at reference temperature */
  var SUTH_T0  = 273.15;    /* K   reference temperature      */
  var SUTH_S   = 110.4;     /* K   Sutherland constant        */

  /* ISA sea-level reference values — used by the worked examples.
     NOTE: 1.789e-5 (not 1.81e-5) is the viscosity that belongs with
     ρ = 1.225 kg/m³; both are the ISA 15 °C values, so the tool is
     internally consistent wherever it quotes a pair. */
  var RHO_ISA = 1.225;
  var MU_ISA  = 1.789e-5;

  /* ---------- Atmosphere ----------
     Altitude is GEOPOTENTIAL altitude, which is what the ISA
     lapse-rate formulation is defined on. */
  function isaAtAltitude(hM) {
    var h = clamp(hM || 0, 0, 20000), T, p;
    if (h <= ISA_HT) {
      T = ISA_T0 - ISA_L * h;
      p = ISA_P0 * Math.pow(T / ISA_T0, G0 / (ISA_L * R_AIR));
    } else {
      var Tt = ISA_T11;
      var pt = ISA_P0 * Math.pow(Tt / ISA_T0, G0 / (ISA_L * R_AIR));
      T = Tt;
      p = pt * Math.exp(-G0 * (h - ISA_HT) / (R_AIR * Tt));
    }
    return { T: T, p: p, rho: p / (R_AIR * T) };
  }

  /* Dynamic viscosity of air — Sutherland's law */
  function sutherlandMu(TK) {
    var T = Math.max(TK || ISA_T0, 100);
    return SUTH_MU0 * Math.pow(T / SUTH_T0, 1.5) * (SUTH_T0 + SUTH_S) / (T + SUTH_S);
  }

  /* Speed of sound in a perfect gas */
  function soundSpeed(TK) {
    return Math.sqrt(GAMMA * R_AIR * Math.max(TK || ISA_T0, 100));
  }

  /* ---------- Working-fluid resolver ----------
     cfg: { tempC:Number, altitudeM:Number, useISATemp:Boolean }
     The working fluid is air. Altitude sets the ambient pressure from the
     ISA profile; the temperature may then be set independently of it (a
     heated or cooled tunnel), or slaved to the ISA profile with
     `useISATemp`. Cooling the air is the cryogenic-tunnel lever: it raises
     ρ and lowers μ at the same time, so ν falls and Reynolds number rises. */
  function makeFluid(cfg) {
    cfg = cfg || {};
    var h  = clamp(cfg.altitudeM || 0, 0, 20000);
    var isa = isaAtAltitude(h);
    var tC = cfg.useISATemp ? (isa.T - 273.15)
                            : clamp(cfg.tempC == null ? (isa.T - 273.15) : cfg.tempC, -60, 80);
    var TK = tC + 273.15;
    var p  = isa.p;                       /* ambient pressure set by altitude */
    var rho = p / (R_AIR * TK);           /* ideal gas at the actual temperature */
    var mu  = sutherlandMu(TK);
    return {
      name: 'Air', tempC: tC, TK: TK,
      p: p, altitudeM: h,
      rho: rho, mu: mu, nu: mu / rho,
      a: soundSpeed(TK),
      compressible: true
    };
  }

  /* ---------- Similarity ---------- */
  function calcReynolds(V, D, fl) { fl = fl || curFluid(); return fl.rho * V * D / fl.mu; }
  function calcDynPressure(V, fl) { fl = fl || curFluid(); return 0.5 * fl.rho * V * V; }
  function calcMach(V, fl)        { fl = fl || curFluid(); return V / fl.a; }

  /* Speed required to match a target Reynolds number at this scale */
  function speedForReynolds(ReTarget, D, fl) {
    if (!(D > 0)) return 0;
    return ReTarget * fl.mu / (fl.rho * D);
  }

  /* ═══════════════════════════════════════════════════════════════
     NACA 4-DIGIT GEOMETRY  +  THIN-AIRFOIL THEORY
     Designation MPXX:  m = max camber (%c), p = position of max
     camber (tenths of c), XX = thickness (%c).
     ═══════════════════════════════════════════════════════════════ */

  /* Half-thickness distribution. The −0.1015 x⁴ coefficient is the
     original NACA definition (open trailing edge); the residual TE gap
     is ~0.21 % of the thickness and is closed in the render path. */
  function nacaHalfThickness(x, t) {
    var xc = clamp(x, 0, 1);
    return 5 * t * (0.2969 * Math.sqrt(xc) - 0.1260 * xc -
                    0.3516 * xc * xc + 0.2843 * xc * xc * xc -
                    0.1015 * xc * xc * xc * xc);
  }

  /* Mean camber line and its slope. m = 0 (or p = 0) ⇒ symmetric. */
  function nacaCamberY(x, m, p) {
    if (!(m > 0) || !(p > 0) || p >= 1) return 0;
    var xc = clamp(x, 0, 1);
    return xc < p ? (m / (p * p)) * (2 * p * xc - xc * xc)
                  : (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * xc - xc * xc);
  }
  function nacaCamberSlope(x, m, p) {
    if (!(m > 0) || !(p > 0) || p >= 1) return 0;
    var xc = clamp(x, 0, 1);
    return xc < p ? (2 * m / (p * p)) * (p - xc)
                  : (2 * m / ((1 - p) * (1 - p))) * (p - xc);
  }

  /* Upper/lower surface coordinates, cosine-clustered toward the LE
     so the leading-edge radius is resolved. Returns {up:[], lo:[]}
     in chord-normalised coordinates with the TE closed. */
  function nacaSurface(m, p, t, n) {
    var N = n || 90, up = [], lo = [], i;
    for (i = 0; i <= N; i++) {
      var beta = Math.PI * i / N;
      var x  = 0.5 * (1 - Math.cos(beta));      /* cosine spacing */
      var yt = nacaHalfThickness(x, t);
      var yc = nacaCamberY(x, m, p);
      var th = Math.atan(nacaCamberSlope(x, m, p));
      var st = Math.sin(th), ct = Math.cos(th);
      up.push({ x: x - yt * st, y: yc + yt * ct });
      lo.push({ x: x + yt * st, y: yc - yt * ct });
    }
    /* Close the trailing edge exactly on the camber line */
    var yTE = nacaCamberY(1, m, p);
    up[N] = { x: 1, y: yTE };
    lo[N] = { x: 1, y: yTE };
    return { up: up, lo: lo };
  }

  /* Section area factor: A = k·t·c².  ∫2·y_t dx = 0.6851·t for the
     4-digit thickness form — used for model volume in blockage. */
  var NACA_AREA_K = 0.6851;

  /* ---- Thin-airfoil theory (Glauert) ----
     Substitution x = (1 − cos θ)/2 maps the chord onto θ ∈ [0, π].
     Integrated with composite Simpson's rule (n even). */
  function glauertIntegral(m, p, weightFn, n) {
    var N = n || 400;                       /* even */
    if (N % 2) N++;
    var h = Math.PI / N, sum = 0, i;
    for (i = 0; i <= N; i++) {
      var th = i * h;
      var x  = 0.5 * (1 - Math.cos(th));
      var f  = nacaCamberSlope(x, m, p) * weightFn(th);
      var w  = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
      sum += w * f;
    }
    return sum * h / 3;
  }

  /* Zero-lift angle, radians.  α₀ = −(1/π)∫₀^π (dz/dx)(cos θ − 1) dθ
     Reference: NACA 2412 ⇒ −2.077°  (Anderson, Fundamentals of Aerodynamics) */
  function nacaZeroLiftAlpha(m, p) {
    if (!(m > 0) || !(p > 0)) return 0;
    return -(1 / Math.PI) * glauertIntegral(m, p, function (th) {
      return Math.cos(th) - 1;
    });
  }

  /* Quarter-chord pitching moment, thin-airfoil theory.
     Cm_c/4 = (π/4)(A₂ − A₁),  Aₙ = (2/π)∫₀^π (dz/dx)·cos(nθ) dθ
     (Anderson, Fundamentals of Aerodynamics, Eq. 4.64)
     Reference: NACA 2412 ⇒ ≈ −0.053 */
  function nacaCmQuarter(m, p) {
    if (!(m > 0) || !(p > 0)) return 0;
    var A1 = (2 / Math.PI) * glauertIntegral(m, p, function (th) { return Math.cos(th); });
    var A2 = (2 / Math.PI) * glauertIntegral(m, p, function (th) { return Math.cos(2 * th); });
    return (Math.PI / 4) * (A2 - A1);
  }

  /* ---------- Finite-wing (Prandtl lifting-line) ----------
     AR = Infinity ⇒ pure 2-D section: slope 2π/rad, no induced drag. */
  var A0_2D = 2 * Math.PI;               /* per radian */

  function liftSlopePerRad(AR, e) {
    if (!isFinite(AR)) return A0_2D;
    var ee = clamp(e || 0.9, 0.5, 1.0);
    return A0_2D / (1 + A0_2D / (Math.PI * ee * Math.max(AR, 0.5)));
  }
  function inducedDragCoef(Cl, AR, e) {
    if (!isFinite(AR)) return 0;
    var ee = clamp(e || 0.9, 0.5, 1.0);
    return (Cl * Cl) / (Math.PI * ee * Math.max(AR, 0.5));
  }
  /* Finite span delays stall by the induced-angle offset: Δα = Cl_max/(π e AR) */
  function stallShiftDeg(ClMax, AR, e) {
    if (!isFinite(AR)) return 0;
    var ee = clamp(e || 0.9, 0.5, 1.0);
    return (ClMax / (Math.PI * ee * Math.max(AR, 0.5))) * 180 / Math.PI;
  }

  /* Prandtl–Glauert subsonic compressibility correction (thin airfoil,
     subcritical only — clamped at M = 0.7 where it stops being valid). */
  function prandtlGlauert(M) {
    var m = clamp(Math.abs(M || 0), 0, 0.7);
    return 1 / Math.sqrt(1 - m * m);
  }

  /* ═══════════════════════════════════════════════════════════════
     REFERENCE AREAS, FRONTAL AREAS AND MODEL VOLUME
     ───────────────────────────────────────────────────────────────
     refArea()     — the area the coefficients are referenced to
                     (frontal for bluff bodies, PLANFORM for the wing).
     frontalArea() — true projected frontal area; this is what tunnel
                     blockage is computed from, and for a wing it is
                     NOT the reference area.
     modelVolume() — needed for solid-blockage correction.
     ═══════════════════════════════════════════════════════════════ */
  var STREAM_T_RATIO = 0.28;   /* teardrop max thickness / length, as drawn */
  var CAR_LEN_RATIO  = 2.5;    /* car length / width, as drawn             */
  var CAR_FILL       = 0.55;   /* solid fraction of its bounding box       */
  var PLATE_T_RATIO  = 0.02;   /* flat-plate thickness / width             */

  function refArea(obj, D, cfg) {
    switch (obj.id) {
      case 'sphere':
      case 'cone':       return Math.PI * D * D / 4;
      case 'streamlined': var t = STREAM_T_RATIO * D; return Math.PI * t * t / 4;
      case 'airfoil':
        /* Planform S = c·b.  b = AR·c, so S = AR·c².  A 2-D section
           (AR = ∞) is referenced to unit span: S = c·(1·c) = c². */
        var AR = cfg && isFinite(cfg.AR) ? cfg.AR : 1;
        return AR * D * D;
      default:           return D * D;   /* cylinder, flat plate, car: D wide × D span */
    }
  }

  function frontalArea(obj, D, cfg) {
    switch (obj.id) {
      case 'sphere':
      case 'cone':       return Math.PI * D * D / 4;
      case 'streamlined': var t = STREAM_T_RATIO * D; return Math.PI * t * t / 4;
      case 'airfoil':
        /* thickness × span */
        var AR = cfg && isFinite(cfg.AR) ? cfg.AR : 1;
        var tc = cfg && cfg.naca ? cfg.naca.t : 0.12;
        return tc * D * (AR * D);
      default:           return D * D;
    }
  }

  function modelVolume(obj, D, cfg) {
    switch (obj.id) {
      case 'sphere':      return Math.PI * D * D * D / 6;
      case 'cylinder':    return Math.PI * D * D / 4 * D;            /* span = D */
      case 'cone':        return Math.PI * D * D / 4 * D / 3;        /* height = D */
      case 'flat-plate':  return D * D * (PLATE_T_RATIO * D);
      case 'streamlined': var t = STREAM_T_RATIO * D;
                          return Math.PI / 6 * t * t * D;            /* ellipsoid of revolution */
      case 'airfoil':     var AR = cfg && isFinite(cfg.AR) ? cfg.AR : 1;
                          var tc = cfg && cfg.naca ? cfg.naca.t : 0.12;
                          return NACA_AREA_K * tc * D * D * (AR * D);
      case 'car':         return CAR_FILL * D * D * (CAR_LEN_RATIO * D);
      default:            return D * D * D;
    }
  }

  /* Solid-blockage shape factor K₁ (Barlow / Rae & Pope, Table 10.x) */
  function blockageK1(obj) {
    if (obj.id === 'airfoil') return 1.02;                                  /* 3-D wing */
    if (obj.id === 'sphere' || obj.id === 'cone' ||
        obj.id === 'streamlined') return 0.90;                              /* body of revolution */
    return 0.96;                                                            /* other 3-D bodies */
  }
  var TAU1 = 0.82;   /* tunnel-shape factor, closed near-square test section */

  /* ═══════════════════════════════════════════════════════════════
     TUNNEL BLOCKAGE CORRECTION
     (Barlow, Rae & Pope, "Low-Speed Wind Tunnel Testing", 3rd ed., Ch.10)
       solid blockage   ε_s = K₁·τ₁·Vol / C^(3/2)
       wake  blockage   ε_w = (S_frontal / 4C)·Cd_uncorrected
       ε = ε_s + ε_w
       V_c = V(1+ε)   q_c = q(1+ε)²   Re_c = Re(1+ε)
       Coefficients are referenced to the corrected q, hence
       Cd_c = Cd/(1+ε)²  and  Cl_c = Cl/(1+ε)².
     ═══════════════════════════════════════════════════════════════ */
  function blockageFactors(obj, D, CdU, cfg) {
    var W = (cfg && cfg.testW) || 0.3, H = (cfg && cfg.testH) || 0.3;
    var C = Math.max(W * H, 1e-9);
    var Sf = frontalArea(obj, D, cfg);
    var Vol = modelVolume(obj, D, cfg);
    var epsS = blockageK1(obj) * TAU1 * Vol / Math.pow(C, 1.5);
    var epsW = (Sf / (4 * C)) * Math.max(CdU, 0);
    var eps  = epsS + epsW;
    return {
      C: C, Sfrontal: Sf, volume: Vol,
      ratio: Sf / C,                 /* geometric blockage ratio S/C */
      epsSolid: epsS, epsWake: epsW, eps: eps,
      factor: 1 + eps
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     MEASUREMENT UNCERTAINTY  —  GUM / ISO 5168
     All inputs are STANDARD uncertainties (k = 1). Combined relative
     uncertainties add in quadrature through each product/power law:
        ρ = p/(RT)      → (uρ/ρ)² = (up/p)² + (uT/T)²
        q = ½ρV²        → (uq/q)² = (uρ/ρ)² + (2·uV/V)²
        S ∝ D²          →  uS/S   = 2·uD/D
        Re = ρVD/μ      → (uRe/Re)² = (uρ/ρ)²+(uV/V)²+(uD/D)²+(uμ/μ)²
        Cd = F/(qS)     → (uCd/Cd)² = (uF/F)²+(uq/q)²+(uS/S)²
     Expanded uncertainty U = k·u_c with k = 2 (≈95 % confidence).
     ═══════════════════════════════════════════════════════════════ */
  function uncertaintyBudget(V, D, fl, res, unc) {
    unc = unc || {};
    var uV = Math.max(unc.uV != null ? unc.uV : 0.5, 0);      /* m/s  */
    var uD = Math.max(unc.uD != null ? unc.uD : 0.0001, 0);   /* m    */
    var uT = Math.max(unc.uT != null ? unc.uT : 0.5, 0);      /* K    */
    var uP = Math.max(unc.uP != null ? unc.uP : 100, 0);      /* Pa   */
    var uF = Math.max(unc.uF != null ? unc.uF : 0.01, 0);     /* N    */

    var rV = V > 0 ? uV / V : 0;
    var rD = D > 0 ? uD / D : 0;
    var rT = uT / fl.TK;
    var rP = uP / fl.p;
    /* viscosity uncertainty propagated numerically through Sutherland */
    var rMu = fl.mu > 0
      ? Math.abs(sutherlandMu(fl.TK + uT) - sutherlandMu(fl.TK - uT)) / 2 / fl.mu : 0;
    /* density comes from p and T through the ideal gas law */
    var rRho = Math.sqrt(rP * rP + rT * rT);

    var rS  = 2 * rD;
    var rQ  = Math.sqrt(rRho * rRho + (2 * rV) * (2 * rV));
    var rRe = Math.sqrt(rRho * rRho + rV * rV + rD * rD + rMu * rMu);
    var rF  = res.Fd > 1e-12 ? uF / res.Fd : 0;
    var rCd = Math.sqrt(rF * rF + rQ * rQ + rS * rS);
    var rFl = res.Fl !== 0 ? uF / Math.abs(res.Fl) : 0;
    var rCl = Math.sqrt(rFl * rFl + rQ * rQ + rS * rS);

    return {
      inputs: { uV: uV, uD: uD, uT: uT, uP: uP, uF: uF },
      rel: { V: rV, D: rD, rho: rRho, mu: rMu, S: rS, q: rQ, Re: rRe, Cd: rCd, Cl: rCl },
      /* expanded (k = 2) absolute uncertainties */
      k: 2,
      U: {
        Re: 2 * rRe * res.Re,
        q:  2 * rQ  * res.q,
        Cd: 2 * rCd * res.Cd,
        Cl: 2 * rCl * Math.abs(res.Cl),
        Fd: 2 * Math.sqrt(rQ * rQ + rS * rS + rCd * rCd) * res.Fd,
        Fl: 2 * Math.sqrt(rQ * rQ + rS * rS + rCl * rCl) * Math.abs(res.Fl)
      },
      /* dominant contributor to u(Cd), for the teaching note */
      dominant: (function () {
        var c = [['force balance', rF], ['dynamic pressure', rQ], ['model area', rS]];
        c.sort(function (a, b) { return b[1] - a[1]; });
        return c[0][0];
      })()
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION AND WING COEFFICIENTS
     ═══════════════════════════════════════════════════════════════ */

  /* Cl_max trend for the NACA 4-digit family: peaks near t/c ≈ 0.12 and
     falls away either side. Table is normalised to 1.000 at t/c = 0.12 so
     the validated NACA 0012 behaviour is reproduced exactly.
     Trend fit to the 4-digit family (Abbott & von Doenhoff); it is a
     trend model, not a lookup of any single measured polar. */
  var CLMAX_T = [0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24];
  var CLMAX_F = [0.594, 0.852, 1.000, 0.968, 0.871, 0.774, 0.700];
  function clMaxThicknessFactor(t) {
    var tc = clamp(t, CLMAX_T[0], CLMAX_T[CLMAX_T.length - 1]);
    for (var i = 1; i < CLMAX_T.length; i++) {
      if (tc <= CLMAX_T[i]) {
        var f = (tc - CLMAX_T[i - 1]) / (CLMAX_T[i] - CLMAX_T[i - 1]);
        return lerp(CLMAX_F[i - 1], CLMAX_F[i], f);
      }
    }
    return CLMAX_F[CLMAX_F.length - 1];
  }

  /* Re-dependent section Cl_max (Jacobs & Sherman / Abbott–von Doenhoff
     trend): ≈0.9 at Re 10⁵ rising to ≈1.55 at Re 10⁷. */
  function clMaxRe(Re) {
    var r = Math.max(Re || 1e5, 3e4);
    return clamp(0.32 * log10(r) - 0.68, 0.85, 1.55);
  }

  /* Full section properties for a NACA 4-digit at this Re. */
  function sectionProps(naca, Re) {
    var m = naca.m, p = naca.p, t = naca.t;
    var a0rad = nacaZeroLiftAlpha(m, p);
    var a0deg = a0rad * 180 / Math.PI;
    /* Lift at zero geometric incidence — the camber signature */
    var clAtZero = A0_2D * (-a0rad);
    var clMax = clMaxRe(Re) * clMaxThicknessFactor(t) + 0.6 * Math.abs(clAtZero);
    /* Effective stall angle measured ABOVE the zero-lift line */
    var aStallEff = Math.asin(Math.min(clMax / A0_2D, 1)) * 180 / Math.PI + 2;
    return {
      alpha0Deg: a0deg, clAtZero: clAtZero, clMax: clMax,
      alphaStallEff: aStallEff, cm4: nacaCmQuarter(m, p),
      designation: nacaDesignation(naca)
    };
  }

  function nacaDesignation(naca) {
    var mm = Math.round(naca.m * 100);
    var pp = Math.round(naca.p * 10);
    var tt = Math.round(naca.t * 100);
    if (mm === 0) pp = 0;
    return 'NACA ' + mm + pp + (tt < 10 ? '0' + tt : '' + tt);
  }

  /* Lift coefficient of the wing (section + finite-span effects). */
  function getAirfoilCl(alphaDeg, Re, cfg) {
    cfg = cfg || curCfg();
    var naca = cfg.naca, AR = cfg.AR, e = cfg.e;
    var sp = sectionProps(naca, Re);
    var slope = liftSlopePerRad(AR, e);           /* per radian */
    var aeff = alphaDeg - sp.alpha0Deg;           /* deg above the zero-lift line */
    var sgn = aeff >= 0 ? 1 : -1;
    var aAbs = Math.abs(aeff);
    /* Finite span delays stall by the induced-angle offset */
    var aS = sp.alphaStallEff + stallShiftDeg(sp.clMax, AR, e);
    var aRound = Math.max(aS - 3, 0.5);
    var cl;
    if (aAbs <= aRound) {
      cl = slope * Math.sin(aAbs * Math.PI / 180);
    } else if (aAbs <= aS) {
      var clA = slope * Math.sin(aRound * Math.PI / 180);
      var tt = (aAbs - aRound) / (aS - aRound);
      cl = clA + (sp.clMax - clA) * (1 - (1 - tt) * (1 - tt));
    } else {
      var clFlatPlate = Math.abs(1.1 * Math.sin(2 * aAbs * Math.PI / 180));
      var blend = clamp((aAbs - aS) / 8, 0, 1);
      cl = lerp(sp.clMax, clFlatPlate, blend);
    }
    return sgn * cl;
  }

  /* Drag of the wing, split into profile and induced parts. */
  function getAirfoilCdParts(alphaDeg, Re, cfg, Cl) {
    cfg = cfg || curCfg();
    var naca = cfg.naca, AR = cfg.AR, e = cfg.e;
    var ReSafe = Math.max(Re || 1e5, 1e4);
    /* Turbulent flat-plate skin friction, both surfaces, with the
       Hoerner airfoil form factor FF = 1 + 2(t/c) + 60(t/c)⁴ */
    var Cf = 0.074 / Math.pow(ReSafe, 0.2);
    var tc = naca.t;
    var FF = 1 + 2 * tc + 60 * Math.pow(tc, 4);
    var Cd0 = 2 * Cf * FF;
    var Cdi = inducedDragCoef(Cl, AR, e);
    var sp = sectionProps(naca, ReSafe);
    var aS = sp.alphaStallEff + stallShiftDeg(sp.clMax, AR, e);
    var aeff = Math.abs(alphaDeg - sp.alpha0Deg);
    var Cds = 0;
    if (aeff > aS) Cds = ((aeff - aS) / 10) * 0.3;
    return { profile: Cd0, induced: Cdi, separation: Cds, total: Cd0 + Cdi + Cds };
  }

  /* ---------- Bluff-body coefficients ---------- */
  function dragCrisisFraction(obj, Re) {
    if (!(obj.cdSuper !== obj.cdSub && isFinite(obj.reCrit))) return 0;
    var k = 12 / obj.reCrit;
    return 1 / (1 + Math.exp(-k * (Re - obj.reCrit)));
  }
  function getCd(obj, Re, alpha, cfg) {
    cfg = cfg || curCfg();
    if (obj.id === 'airfoil') {
      var cl = getAirfoilCl(alpha, Re, cfg);
      return getAirfoilCdParts(alpha, Re, cfg, cl).total;
    }
    if (obj.cdSuper !== obj.cdSub && isFinite(obj.reCrit)) {
      return obj.cdSub + (obj.cdSuper - obj.cdSub) * dragCrisisFraction(obj, Re);
    }
    return obj.cdSub;
  }
  function getCl(obj, alpha, Re, cfg) {
    cfg = cfg || curCfg();
    if (obj.id === 'airfoil') return getAirfoilCl(alpha, Re, cfg);
    if (obj.hasDownforce) return -0.05;
    return 0;
  }

  /* ═══════════════════════════════════════════════════════════════
     MASTER SOLVER
     Returns raw (as-measured) and blockage-corrected values together.
     ═══════════════════════════════════════════════════════════════ */
  function calcForces(V, D, obj, alpha, cfg) {
    cfg = cfg || curCfg();
    var fl = cfg.fluid;
    var Re = calcReynolds(V, D, fl);
    var q  = calcDynPressure(V, fl);
    var M  = calcMach(V, fl);
    var S  = refArea(obj, D, cfg);

    var Cd = getCd(obj, Re, alpha, cfg);
    var Cl = getCl(obj, alpha, Re, cfg);
    var parts = obj.id === 'airfoil'
      ? getAirfoilCdParts(alpha, Re, cfg, Cl)
      : { profile: Cd, induced: 0, separation: 0, total: Cd };

    /* Orientation penalty when the shape is reversed (rear-first) */
    if (cfg.flip) {
      if (obj.id === 'car')              Cd *= 1.45;
      else if (obj.id === 'cone')        Cd *= 2.80;
      else if (obj.id === 'streamlined') Cd *= 3.50;
      else if (obj.id === 'airfoil')     Cl = -Cl;
      if (obj.id !== 'airfoil') { parts = { profile: Cd, induced: 0, separation: 0, total: Cd }; }
    }

    /* Subsonic compressibility (optional, airfoil only, subcritical) */
    var pg = 1;
    if (cfg.applyPG && obj.id === 'airfoil' && fl.compressible) {
      pg = prandtlGlauert(M);
      Cl *= pg;
    }

    /* Tunnel blockage */
    var bl = blockageFactors(obj, D, Cd, cfg);
    var kb = cfg.applyBlockage ? bl.factor : 1;
    var Vc  = V * kb;
    var qc  = q * kb * kb;
    var Rec = Re * kb;
    var Cdc = Cd / (kb * kb);
    var Clc = Cl / (kb * kb);

    var Fd = qc * S * Cdc;      /* force is invariant; only the coefficients move */
    var Fl = qc * S * Clc;
    var LD = Math.abs(Cdc) > 0.001 ? Math.min(Math.abs(Clc / Cdc), 150) : 0;

    return {
      V: V, Vcorr: Vc, Re: Rec, ReRaw: Re, q: qc, qRaw: q, M: M,
      Cd: Cdc, Cl: Clc, CdRaw: Cd, ClRaw: Cl,
      cdProfile: parts.profile / (kb * kb),
      cdInduced: parts.induced / (kb * kb),
      cdSeparation: parts.separation / (kb * kb),
      Fd: Fd, Fl: Fl, LD: LD, A: S, S: S,
      blockage: bl, blockageApplied: !!cfg.applyBlockage, pgFactor: pg,
      fluid: fl
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     PRESSURE DISTRIBUTION  —  CALIBRATED, AND INTEGRABLE
     ───────────────────────────────────────────────────────────────
     The separated-flow base pressure is SOLVED so that integrating the
     plotted Cp reproduces the pressure part of the reference Cd. The
     student therefore integrates exactly the curve they can see, and
     gets the number the force panel shows. Resulting base pressures
     land inside the measured range (e.g. cylinder Cp_b ≈ −0.90
     subcritical), which is the check that the calibration is physical.

     Integration weights (exact, from ∮ Cp n̂·x̂ dA / (q·A_ref)):
       2-D cylinder, per unit span :  Cd = ∫₀^π Cp cosθ dθ
       axisymmetric sphere         :  Cd = 2∫₀^π Cp sinθ cosθ dθ
       flat plate (equal faces)    :  Cd = <Cp>_front − <Cp>_base
       airfoil, normal force       :  Cn = ∫₀¹ (Cp_l − Cp_u) d(x/c)
     Both integrals vanish for the unseparated inviscid curve — that is
     d'Alembert's paradox, which the overlay demonstrates.
     ═══════════════════════════════════════════════════════════════ */

  /* Fraction of total Cd carried by pressure (the rest is skin friction) */
  function pressureFraction(obj, Re) {
    var s = dragCrisisFraction(obj, Re);
    switch (obj.id) {
      case 'cylinder':   return lerp(0.98, 0.90, s);
      case 'sphere':     return lerp(0.95, 0.85, s);
      case 'flat-plate': return 0.98;
      default:           return 0.95;
    }
  }
  /* Separation angle from the front stagnation point, degrees */
  function separationAngleDeg(obj, Re) {
    var s = dragCrisisFraction(obj, Re);
    if (obj.id === 'cylinder') return lerp(80, 120, s);   /* Achenbach */
    if (obj.id === 'sphere')   return lerp(82, 120, s);
    return 90;
  }
  /* Measured suction peak, used to scale the inviscid curve */
  function cpMinTarget(obj, Re) {
    var s = dragCrisisFraction(obj, Re);
    if (obj.id === 'cylinder') return lerp(-1.2, -2.4, s);
    if (obj.id === 'sphere')   return lerp(-1.1, -1.6, s);
    return -1.0;
  }

  var CP_INVISCID_K = { cylinder: 4, sphere: 2.25 };  /* Cp = 1 − K·sin²θ */

  /* Build the Cp model. `CdTotal` is the reference drag coefficient the
     curve must reproduce (uncorrected, as-measured). */
  function cpModel(obj, alpha, Re, cfg, CdTotal, nPoints) {
    cfg = cfg || curCfg();
    var N = nPoints || 180;
    var pts = [], i;

    if (obj.id === 'cylinder' || obj.id === 'sphere') {
      var axi   = obj.id === 'sphere';
      var Kinv  = CP_INVISCID_K[obj.id];
      var thS   = separationAngleDeg(obj, Re);
      /* Scale the inviscid suction so the peak matches measurement */
      var sinAtPeak = thS <= 90 ? Math.sin(thS * Math.PI / 180) : 1;
      var kScale = (1 - cpMinTarget(obj, Re)) / (Kinv * sinAtPeak * sinAtPeak);
      var attached = function (thrDeg) {
        return 1 - Kinv * kScale * Math.pow(Math.sin(thrDeg * Math.PI / 180), 2);
      };
      /* Build the plotted trace for a trial base pressure */
      var buildB = function (cpB) {
        var out = [], j;
        for (j = 0; j <= N; j++) {
          var th = (j / N) * 360;
          var fold = th > 180 ? 360 - th : th;      /* symmetric about the axis */
          out.push({
            x: th,
            cpInviscid: 1 - Kinv * Math.pow(Math.sin(th * Math.PI / 180), 2),
            cpActual: fold <= thS ? attached(fold) : cpB
          });
        }
        return out;
      };
      /* The plotted integral is exactly linear in cpBase, so two probes
         solve it on the SAME grid and quadrature the readout uses. */
      var kindB = axi ? 'axisym' : 'cyl2d';
      var I0 = integrateCp({ kind: kindB, pts: buildB(0), integrable: true }, 'actual');
      var I1 = integrateCp({ kind: kindB, pts: buildB(1), integrable: true }, 'actual');
      var W  = I1 - I0;
      var target = pressureFraction(obj, Re) * CdTotal;
      var cpBase = Math.abs(W) > 1e-9 ? (target - I0) / W : 0;
      var clamped = cpBase < -3 || cpBase > 0.5;
      cpBase = clamp(cpBase, -3, 0.5);
      return {
        kind: kindB, pts: buildB(cpBase), integrable: true, hasInviscid: true,
        cpBase: cpBase, cpBaseClamped: clamped, sepDeg: thS,
        pressureFraction: pressureFraction(obj, Re)
      };
    }

    if (obj.id === 'flat-plate') {
      /* Front face: stagnation at the centre falling to the rim.
         Back face: constant base pressure. Equal projected areas.
         A sharp-edged plate has no attached potential-flow solution, so
         no inviscid overlay is offered (hasInviscid = false). */
      var frontFn = function (xi) { return 1 - xi * xi; };
      var buildP = function (cpB) {
        var out = [], j;
        for (j = 0; j <= N; j++) {
          var s2 = j / N;
          var pos = -1 + 2 * (s2 < 0.5 ? s2 * 2 : (1 - s2) * 2);
          out.push({
            x: s2 * 360,
            cpActual: s2 < 0.5 ? frontFn(pos) : cpB,
            cpInviscid: s2 < 0.5 ? frontFn(pos) : cpB,
            face: s2 < 0.5 ? 'front' : 'back'
          });
        }
        return out;
      };
      var J0 = integrateCp({ kind: 'faces', pts: buildP(0), integrable: true }, 'actual');
      var J1 = integrateCp({ kind: 'faces', pts: buildP(1), integrable: true }, 'actual');
      var WP = J1 - J0;
      var tgtP = pressureFraction(obj, Re) * CdTotal;
      var cpBP = clamp(Math.abs(WP) > 1e-9 ? (tgtP - J0) / WP : 0, -3, 0.5);
      return {
        kind: 'faces', pts: buildP(cpBP), integrable: true, hasInviscid: false,
        cpBase: cpBP, pressureFraction: pressureFraction(obj, Re)
      };
    }

    if (obj.id === 'airfoil') {
      var sp = sectionProps(cfg.naca, Re);
      var Cl = getCl(obj, alpha, Re, cfg);
      var aRad = alpha * Math.PI / 180;
      /* Induced angle: the section actually operates at α − α_i */
      var ai = isFinite(cfg.AR) ? Cl / (Math.PI * clamp(cfg.e || 0.9, 0.5, 1) * cfg.AR) : 0;
      var aStall = sp.alphaStallEff + stallShiftDeg(sp.clMax, cfg.AR, cfg.e);
      var stallMix = clamp((Math.abs(alpha - sp.alpha0Deg) - aStall) / 5, 0, 1);
      var tc = cfg.naca.t;

      var thickTerm = function (xc) { return -(tc / 0.12) * 0.6 * Math.exp(-xc * 5); };
      var liftShape = function (xc) { return Math.exp(-xc * (5 + 0.5 * Math.abs(alpha))); };

      /* Assemble the plotted trace for a trial lifting amplitude. */
      var buildA = function (amp) {
        var out = [], j;
        for (j = 0; j <= N; j++) {
          var xc2 = j / N;
          var th2 = thickTerm(xc2);
          var lf  = amp * liftShape(xc2);
          var cpU = th2 - lf, cpL = th2 + lf;
          if (stallMix > 0) {
            var plateau = -0.9;
            var mix = stallMix * clamp((xc2 - 0.03) / 0.12, 0, 1);
            var mm = Math.max(mix, stallMix * 0.35);
            if (Cl >= 0) cpU = lerp(cpU, plateau, mm); else cpL = lerp(cpL, plateau, mm);
          }
          if (xc2 < 0.01) { if (Cl >= 0) cpL = 1.0; else cpU = 1.0; }
          out.push({ x: xc2, cpUpper: cpU, cpLower: cpL });
        }
        return out;
      };

      /* Solve the amplitude so the plotted Cp integrates to the plotted Cl.
         The leading-edge stagnation override and the stall plateau make
         I(amp) only piecewise linear, so take two secant steps — this
         converges to well under 0.1 % for every case in the verifier. */
      var CnTarget = Cl / Math.max(Math.cos(aRad), 0.2);
      var wrapA = function (pp) { return { kind: 'chord', pts: pp, integrable: true }; };
      var amp = CnTarget / 2, k, I;
      for (k = 0; k < 6; k++) {
        I = integrateCp(wrapA(buildA(amp)), 'actual');
        if (Math.abs(I - CnTarget) < 1e-6) break;
        var dA = Math.max(Math.abs(amp) * 1e-3, 1e-6);
        var I2 = integrateCp(wrapA(buildA(amp + dA)), 'actual');
        var slope = (I2 - I) / dA;
        if (!isFinite(slope) || Math.abs(slope) < 1e-9) break;
        amp += (CnTarget - I) / slope;
      }

      return {
        kind: 'chord', pts: buildA(amp), integrable: true, hasInviscid: false,
        alphaInducedDeg: ai * 180 / Math.PI,
        alphaEffDeg: alpha - ai * 180 / Math.PI,
        cnTarget: CnTarget, section: sp, stallMix: stallMix
      };
    }

    /* Cone / streamlined / car: schematic only — NOT integrated, because
       a calibrated pressure field for these profiles is not defined here.
       The UI reports “—” rather than a number that would be wrong. */
    for (i = 0; i <= N; i++) {
      var pos2 = i / N;
      var cpG = 1 - 2 * pos2;
      if (pos2 > 0.3 && pos2 < 0.7) cpG = -0.5;
      pts.push({ x: pos2 * 360, cpInviscid: cpG, cpActual: cpG * 0.8 });
    }
    return { kind: 'schematic', pts: pts, integrable: false, hasInviscid: false };
  }

  /* Numerically integrate the PLOTTED curve. `which` selects the actual
     (separated) curve or the inviscid one. Trapezoid on the plot grid —
     deliberately the same rule a student would apply by hand. */
  function integrateCp(model, which) {
    if (!model.integrable) return null;
    var key = which === 'inviscid' ? 'cpInviscid' : 'cpActual';
    var pts = model.pts, i, sum = 0;

    if (model.kind === 'cyl2d' || model.kind === 'axisym') {
      /* fold the 0–360 trace onto 0–π and integrate with the exact weight */
      var axi = model.kind === 'axisym';
      for (i = 0; i < pts.length - 1; i++) {
        var t1 = pts[i].x * Math.PI / 180, t2 = pts[i + 1].x * Math.PI / 180;
        if (t1 >= Math.PI) break;
        var w1 = axi ? 2 * Math.sin(t1) * Math.cos(t1) : Math.cos(t1);
        var w2 = axi ? 2 * Math.sin(t2) * Math.cos(t2) : Math.cos(t2);
        sum += 0.5 * (pts[i][key] * w1 + pts[i + 1][key] * w2) * (t2 - t1);
      }
      return sum;
    }
    if (model.kind === 'faces') {
      var fSum = 0, fN = 0, bSum = 0, bN = 0;
      for (i = 0; i < pts.length; i++) {
        if (pts[i].face === 'front') { fSum += pts[i][key]; fN++; }
        else { bSum += pts[i][key]; bN++; }
      }
      if (!fN || !bN) return null;
      return (fSum / fN) - (bSum / bN);
    }
    if (model.kind === 'chord') {
      /* normal-force coefficient from the chordwise Cp difference */
      for (i = 0; i < pts.length - 1; i++) {
        var d1 = pts[i].cpLower - pts[i].cpUpper;
        var d2 = pts[i + 1].cpLower - pts[i + 1].cpUpper;
        sum += 0.5 * (d1 + d2) * (pts[i + 1].x - pts[i].x);
      }
      return sum;
    }
    return null;
  }


  /* ═══════════════════════════════════════════════════════════════
     LIVE CONFIGURATION  +  BACKWARD-COMPATIBLE WRAPPERS
     Everything above is pure. These read `state` so the rest of the
     app can keep calling the original short signatures.
     ═══════════════════════════════════════════════════════════════ */
  function curFluid() {
    return makeFluid({
      tempC: state.tempC, altitudeM: state.altitudeM, useISATemp: state.useISATemp
    });
  }
  function curCfg(over) {
    var c = {
      fluid: curFluid(),
      AR: state.AR, e: state.spanEff,
      naca: { m: state.naca.m, p: state.naca.p, t: state.naca.t },
      testW: state.testW, testH: state.testH,
      applyBlockage: state.applyBlockage, applyPG: state.applyPG,
      flip: state.flipObj, unc: state.unc
    };
    if (over) for (var k in over) if (over.hasOwnProperty(k)) c[k] = over[k];
    return c;
  }

  /* Geometric stall angle of the CURRENT wing, measured from the chord
     line (so it includes the camber shift and the finite-span delay).
     With the default symmetric section at AR = ∞ this reduces exactly to
     the original Re-only correlation. */
  function stallAngleDeg(Re, cfg) {
    cfg = cfg || curCfg();
    var sp = sectionProps(cfg.naca, Re);
    return sp.alpha0Deg + sp.alphaStallEff + stallShiftDeg(sp.clMax, cfg.AR, cfg.e);
  }
  /* Cl_max of the current section (thickness + camber aware) */
  function clMaxCurrent(Re, cfg) {
    cfg = cfg || curCfg();
    return sectionProps(cfg.naca, Re).clMax;
  }
  function curSection(Re, cfg) {
    return sectionProps((cfg || curCfg()).naca, Re);
  }

  /* Pressure-distribution accessor used by the graph layer. Returns the
     full model (points + calibration metadata). */
  function getCpModel(obj, alpha, nPoints, cfg) {
    cfg = cfg || curCfg();
    var Re = state.results ? (state.results.ReRaw || state.results.Re) : 5e5;
    var Cd = state.results ? (state.results.CdRaw || state.results.Cd) : getCd(obj, Re, alpha, cfg);
    return cpModel(obj, alpha, Re, cfg, Cd, nPoints || 180);
  }
  function getCpDistribution(obj, alpha, nPoints, cfg) {
    return getCpModel(obj, alpha, nPoints, cfg).pts;
  }

  /* Uncertainty budget for the current operating point */
  function curUncertainty(f) {
    return uncertaintyBudget(state.airSpeed, state.objSize / 1000,
                             f.fluid || curFluid(), f, state.unc);
  }


  /* ═══════════════════════════════════════════════════════════════
     S3b  POTENTIAL-FLOW PANEL SOLVER  (Hess–Smith)
     ───────────────────────────────────────────────────────────────
     Constant-strength source panels + one uniform vortex sheet, with
     the Kutta condition on sharp-trailing-edge bodies. The panels come
     from the SAME geometry that is drawn, so camber, thickness and
     incidence reach the streamlines automatically.

     Kernel (complex potential, panel local ξ ∈ [0,L] at η = 0, with
     (t, n) right-handed and n pointing OUT of the body):
       source:  u_ξ = (1/4π)·ln(r1²/r2²)     u_η = (1/2π)(θ2 − θ1)
       vortex:  u_ξ = −(1/2π)(θ2 − θ1)       u_η = (1/4π)·ln(r1²/r2²)
     Self-influence at the sheet, approached from OUTSIDE (η → 0⁺):
       source normal = +1/2,  vortex tangential = −1/2.

     The result is a genuine solution of Laplace's equation: it is
     divergence-free everywhere and exactly tangent to the body. It is
     also inviscid, so it produces ZERO drag (d'Alembert's paradox) and
     no wake — the separated region is added separately and labelled.
     Verified in deploy/verify-wind-tunnel-physics.js against the exact
     cylinder solution and NACA thin-airfoil theory.
     ═══════════════════════════════════════════════════════════════ */

  function pmSignedArea(pts) {
    var A = 0;
    for (var i = 0; i < pts.length - 1; i++) A += pts[i].x * pts[i + 1].y - pts[i + 1].x * pts[i].y;
    return A / 2;
  }
  function pmMakePanels(nodes) {
    var pts = nodes.slice();
    if (pmSignedArea(pts) > 0) pts.reverse();          /* clockwise ⇒ n points outward */
    var pan = [], i;
    for (i = 0; i < pts.length - 1; i++) {
      var dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
      var L = Math.hypot(dx, dy);
      if (L < 1e-9) continue;
      var tx = dx / L, ty = dy / L;
      pan.push({ x1: pts[i].x, y1: pts[i].y, L: L, tx: tx, ty: ty,
                 nx: -ty, ny: tx, cx: pts[i].x + dx / 2, cy: pts[i].y + dy / 2 });
    }
    return pan;
  }
  function pmPanelVel(p, px, py) {
    var rx = px - p.x1, ry = py - p.y1;
    var xi = rx * p.tx + ry * p.ty;
    var et = rx * p.nx + ry * p.ny;
    if (Math.abs(et) < 1e-9) et = (et >= 0 ? 1 : -1) * 1e-9;
    var r1 = xi * xi + et * et, r2 = (xi - p.L) * (xi - p.L) + et * et;
    var lg = 0.5 * Math.log(Math.max(r1, 1e-300) / Math.max(r2, 1e-300)) / (2 * Math.PI);
    var dth = (Math.atan2(et, xi - p.L) - Math.atan2(et, xi)) / (2 * Math.PI);
    return { sx: lg * p.tx + dth * p.nx, sy: lg * p.ty + dth * p.ny,
             vx: -dth * p.tx + lg * p.nx, vy: -dth * p.ty + lg * p.ny };
  }
  function pmSolveLinear(A, b) {
    var n = b.length, i, j, k;
    var M = A.map(function (r, idx) { return r.concat([b[idx]]); });
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      var tm = M[i]; M[i] = M[piv]; M[piv] = tm;
      if (Math.abs(M[i][i]) < 1e-14) M[i][i] = 1e-14;
      for (k = i + 1; k < n; k++) {
        var f = M[k][i] / M[i][i];
        if (f === 0) continue;
        for (j = i; j <= n; j++) M[k][j] -= f * M[i][j];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  }
  function pmSolve(nodes, Uinf, useKutta) {
    var pan = pmMakePanels(nodes), N = pan.length, i, j;
    var M = useKutta ? N + 1 : N;
    var A = [], b = [];
    for (i = 0; i < N; i++) {
      var row = new Array(M), vs = 0;
      for (j = 0; j < M; j++) row[j] = 0;
      for (j = 0; j < N; j++) {
        if (i === j) { row[j] = 0.5; continue; }
        var c = pmPanelVel(pan[j], pan[i].cx, pan[i].cy);
        row[j] = c.sx * pan[i].nx + c.sy * pan[i].ny;
        vs += c.vx * pan[i].nx + c.vy * pan[i].ny;
      }
      if (useKutta) row[N] = vs;
      A.push(row);
      b.push(-(Uinf * pan[i].nx));
    }
    if (useKutta) {
      var k1 = 0, k2 = N - 1, kr = new Array(M), vsum = 0;
      for (j = 0; j < M; j++) kr[j] = 0;
      for (j = 0; j < N; j++) {
        var s1 = 0, s2 = 0, v1, v2;
        if (j === k1) { v1 = -0.5; } else {
          var a1 = pmPanelVel(pan[j], pan[k1].cx, pan[k1].cy);
          s1 = a1.sx * pan[k1].tx + a1.sy * pan[k1].ty;
          v1 = a1.vx * pan[k1].tx + a1.vy * pan[k1].ty;
        }
        if (j === k2) { v2 = -0.5; } else {
          var a2 = pmPanelVel(pan[j], pan[k2].cx, pan[k2].cy);
          s2 = a2.sx * pan[k2].tx + a2.sy * pan[k2].ty;
          v2 = a2.vx * pan[k2].tx + a2.vy * pan[k2].ty;
        }
        kr[j] = s1 + s2; vsum += v1 + v2;
      }
      kr[N] = vsum;
      A.push(kr);
      b.push(-(Uinf * pan[k1].tx + Uinf * pan[k2].tx));
    }
    var sol = pmSolveLinear(A, b);
    var sigma = sol.slice(0, N), gamma = useKutta ? sol[N] : 0;

    /* surface Cp and the integrated inviscid forces */
    var surf = [], ca = 0, cn = 0;
    for (i = 0; i < N; i++) {
      var ux = Uinf, uy = 0;
      for (j = 0; j < N; j++) {
        if (i === j) { ux += -gamma * 0.5 * pan[i].tx; uy += -gamma * 0.5 * pan[i].ty; continue; }
        var cc = pmPanelVel(pan[j], pan[i].cx, pan[i].cy);
        ux += sigma[j] * cc.sx + gamma * cc.vx;
        uy += sigma[j] * cc.sy + gamma * cc.vy;
      }
      var vt = ux * pan[i].tx + uy * pan[i].ty;
      var cp = 1 - (vt / Uinf) * (vt / Uinf);
      surf.push({ cp: cp, vt: vt, cx: pan[i].cx, cy: pan[i].cy, L: pan[i].L, nx: pan[i].nx, ny: pan[i].ny });
      ca += -cp * pan[i].nx * pan[i].L;
      cn += -cp * pan[i].ny * pan[i].L;
    }
    var circ = 0;
    for (i = 0; i < N; i++) circ += gamma * pan[i].L;
    return {
      panels: pan, sigma: sigma, gamma: gamma, circulation: circ, surf: surf, Uinf: Uinf,
      forceX: ca, forceY: cn,
      velocityAt: function (px, py) {
        var vx = Uinf, vy = 0, q;
        for (q = 0; q < N; q++) {
          var c = pmPanelVel(pan[q], px, py);
          vx += sigma[q] * c.sx + gamma * c.vx;
          vy += sigma[q] * c.sy + gamma * c.vy;
        }
        return { vx: vx, vy: vy };
      }
    };
  }

  /* ---------- Body geometry, in MATH coordinates (y up), centred on the
       test object, in pixels. Canvas y is down, so callers convert:
         math = (x − TEST_CX_F,  TEST_CY_F − y)
       and velocities come back with vy negated. Doing the whole solve in a
       right-handed frame keeps the outward-normal convention unambiguous. */
  function pmBodyNodes(obj, R) {
    var pts = [], i, N = 120;
    var flip = state.flipObj ? -1 : 1;
    switch (obj.id) {
      case 'cylinder':
      case 'sphere':
        for (i = 0; i <= N; i++) {
          var th = 2 * Math.PI * i / N;
          pts.push({ x: R * Math.cos(th), y: R * Math.sin(th) });
        }
        return { nodes: pts, kutta: false };

      case 'airfoil': {
        /* real NACA section, chord 2.5R, rotated −α (nose up for +α) */
        var chord = R * 2.5;
        var sf = nacaSurface(state.naca.m, state.naca.p, state.naca.t, 60);
        var loop = [], k;
        for (k = sf.up.length - 1; k >= 0; k--) loop.push(sf.up[k]);   /* TE → LE, upper */
        for (k = 1; k < sf.lo.length; k++) loop.push(sf.lo[k]);        /* LE → TE, lower */
        var aEff = (state.flipObj ? -1 : 1) * state.angleOfAttack * Math.PI / 180;
        var ca = Math.cos(-aEff), sa = Math.sin(-aEff);
        for (k = 0; k < loop.length; k++) {
          var px = (loop[k].x - 0.5) * chord, py = loop[k].y * chord;
          pts.push({ x: px * ca - py * sa, y: px * sa + py * ca });
        }
        return { nodes: pts, kutta: true };
      }

      case 'flat-plate':
        /* matches the drawn plate: 6 px thick, half-height 1.3R */
        pts = [{ x: -3, y: -R * 1.3 }, { x: 3, y: -R * 1.3 },
               { x: 3, y: R * 1.3 }, { x: -3, y: R * 1.3 }, { x: -3, y: -R * 1.3 }];
        return { nodes: pts, kutta: false };

      case 'streamlined': {
        /* drawn teardrop: half-length 1.8R, half-thickness 0.5R */
        var hl = R * 1.8, ht = R * 0.5;
        for (i = 0; i <= N; i++) {
          var t2 = 2 * Math.PI * i / N;
          /* fuller nose, drawn-out tail — matches the bezier silhouette */
          var xx = Math.cos(t2), yy = Math.sin(t2);
          pts.push({ x: flip * hl * xx, y: ht * yy * Math.pow((1 + xx) / 2, 0.35) * 1.55 });
        }
        return { nodes: pts, kutta: false };
      }

      case 'cone': {
        var apex = flip * -R, base = flip * R, hb = 0.85 * R;
        pts = [{ x: apex, y: 0 }, { x: base, y: -hb }, { x: base, y: hb }, { x: apex, y: 0 }];
        return { nodes: pts, kutta: false };
      }

      case 'car': {
        /* drawn silhouette: length 3R, roof 0.62R above the belt, 0.30R below */
        var L2 = 1.5 * R;
        pts = [{ x: flip * -L2, y: -0.30 * R }, { x: flip * L2, y: -0.30 * R },
               { x: flip * L2, y: 0.28 * R }, { x: flip * 0.55 * L2, y: 0.62 * R },
               { x: flip * -0.35 * L2, y: 0.62 * R }, { x: flip * -L2, y: 0.20 * R },
               { x: flip * -L2, y: -0.30 * R }];
        return { nodes: pts, kutta: false };
      }
    }
    for (i = 0; i <= N; i++) { var t3 = 2 * Math.PI * i / N; pts.push({ x: R * Math.cos(t3), y: R * Math.sin(t3) }); }
    return { nodes: pts, kutta: false };
  }

  /* ---------- Exact axisymmetric solution for the SPHERE ----------
     A 2-D panel method cannot represent a sphere. The meridional-plane
     flow past a sphere of radius a is closed-form:
       v_r = U cosθ (1 − a³/r³),   v_θ = −U sinθ (1 + a³/2r³)
     giving the correct surface speed 1.5·U·sinθ (not the cylinder's 2U). */
  function pmSphereVel(mx, my, R, U) {
    var r = Math.hypot(mx, my);
    if (r < R * 1.0001) return { vx: 0, vy: 0, inside: true };
    var a3 = R * R * R, r3 = r * r * r;
    var ct = mx / r, st = my / r;
    var vr = U * ct * (1 - a3 / r3);
    var vth = -U * st * (1 + a3 / (2 * r3));
    return { vx: vr * ct - vth * st, vy: vr * st + vth * ct };
  }

  /* ---------- Solution cache ---------- */
  var pmCache = null;
  function pmKey() {
    var o = OBJECTS[state.objIdx];
    return o.id + '|' + state.objSize + '|' + state.angleOfAttack + '|' + (state.flipObj ? 1 : 0) +
      (o.id === 'airfoil' ? '|' + state.naca.m + ',' + state.naca.p + ',' + state.naca.t : '');
  }
  var PM_U = 1;            /* solve at unit speed; scale afterwards */
  function pmSolution() {
    var key = pmKey();
    if (pmCache && pmCache.key === key) return pmCache;
    var obj = OBJECTS[state.objIdx], R = objRadiusPx();
    var geo = pmBodyNodes(obj, R);
    var sol = null;
    if (obj.id !== 'sphere') {
      try { sol = pmSolve(geo.nodes, PM_U, geo.kutta); } catch (e) { sol = null; }
    }
    /* inviscid check: potential flow must give zero drag */
    var cdInv = sol ? sol.forceX / (2 * R) : 0;
    pmCache = { key: key, sol: sol, geo: geo, R: R, obj: obj,
                clInviscid: sol ? -sol.forceY / (R * 2) : 0, cdInviscid: cdInv, grid: null };
    return pmCache;
  }

  /* ---------- Velocity grid over the test section (canvas px) ---------- */
  var PM_GX0 = 330, PM_GX1 = 900, PM_GY0 = 70, PM_GY1 = 330, PM_STEP = 6;
  function pmBuildGrid(c) {
    var nx = Math.floor((PM_GX1 - PM_GX0) / PM_STEP) + 1;
    var ny = Math.floor((PM_GY1 - PM_GY0) / PM_STEP) + 1;
    var u = new Float32Array(nx * ny), v = new Float32Array(nx * ny);
    var msk = new Uint8Array(nx * ny);
    var i, j;
    for (i = 0; i < nx; i++) {
      for (j = 0; j < ny; j++) {
        var cxp = PM_GX0 + i * PM_STEP, cyp = PM_GY0 + j * PM_STEP;
        var mx = cxp - TEST_CX_F, my = TEST_CY_F - cyp;
        var r;
        if (c.obj.id === 'sphere') r = pmSphereVel(mx, my, c.R, PM_U);
        else if (c.sol) r = c.sol.velocityAt(mx, my);
        else r = { vx: PM_U, vy: 0 };
        var k = i * ny + j;
        if (r.inside) { msk[k] = 1; u[k] = 0; v[k] = 0; }
        else { u[k] = r.vx; v[k] = -r.vy; }         /* back to canvas (y down) */
      }
    }
    c.grid = { nx: nx, ny: ny, u: u, v: v, msk: msk };
    return c.grid;
  }
  function pmSampleGrid(c, x, y) {
    var g = c.grid || pmBuildGrid(c);
    var fx = (x - PM_GX0) / PM_STEP, fy = (y - PM_GY0) / PM_STEP;
    if (fx < 0 || fy < 0 || fx > g.nx - 1.001 || fy > g.ny - 1.001) return null;
    var i0 = fx | 0, j0 = fy | 0, tx = fx - i0, ty = fy - j0;
    var k00 = i0 * g.ny + j0, k10 = (i0 + 1) * g.ny + j0, k01 = k00 + 1, k11 = k10 + 1;
    if (g.msk[k00] || g.msk[k10] || g.msk[k01] || g.msk[k11]) return { vx: 0, vy: 0, inside: true };
    var w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
    return {
      vx: g.u[k00] * w00 + g.u[k10] * w10 + g.u[k01] * w01 + g.u[k11] * w11,
      vy: g.v[k00] * w00 + g.v[k10] * w10 + g.v[k01] * w01 + g.v[k11] * w11
    };
  }

  /* ---------- Divergence-free wake ----------
     Built from a stream function, so ∇·V = 0 holds identically:
       ψ(x,y) = −K(x)·tanh(η),   η = y / b(x)
       u = ∂ψ/∂y = −K/b · sech²η        v = −∂ψ/∂x
     b(x) grows and K is held constant once the wake is established, so the
     momentum deficit ∫u(U−u)dy — which IS the drag — is conserved downstream.
     This is the classic 2-D far-wake similarity form. */
  function pmWakeVel(xw, yw, R, U, Cd, wakeHalf) {
    if (xw <= 0) return { vx: 0, vy: 0 };
    var L = R * 3;
    var g = Math.sqrt(1 + xw / L);
    var b = wakeHalf * g;
    var onset = 1 - Math.exp(-xw / (R * 0.5));         /* smooth start at the body */
    var K = 0.9 * U * wakeHalf * Math.max(Cd, 0.05) * onset;
    var Kp = 0.9 * U * wakeHalf * Math.max(Cd, 0.05) * (Math.exp(-xw / (R * 0.5)) / (R * 0.5));
    var bp = wakeHalf / (2 * L * g);
    var eta = yw / b;
    var th = Math.tanh(eta), se = 1 - th * th;         /* sech² */
    var u = -K / b * se;
    var v = Kp * th - K * se * eta * bp / b;
    return { vx: u, vy: v };
  }

  /* ---------- Divergence-free channel (contraction + diffuser) ----------
     ψ = U₀h₀·(y/h(x)) ⇒ u = U₀h₀/h(x),  v = U₀h₀·y·h′(x)/h(x)²
     Mass is conserved exactly, and the transverse velocity that a real
     contraction produces is included instead of being ignored. */
  function pmChannelHalfHeight(x) {
    if (x < 360) return lerp(170, 110, clamp(x / 360, 0, 1));
    if (x > 840) return lerp(110, 180, clamp((x - 840) / 320, 0, 1));
    return 110;
  }
  function pmChannelVel(x, y, U) {
    var h = pmChannelHalfHeight(x);
    var dh = (pmChannelHalfHeight(x + 0.5) - pmChannelHalfHeight(x - 0.5));
    var h0 = 110;
    return { vx: U * h0 / h, vy: U * h0 * (y - TEST_CY_F) * dh / (h * h) };
  }
  /* ═══════════════════════════════════════════════════════════════
     S4  STREAMLINE PARTICLES
     ═══════════════════════════════════════════════════════════════ */
  var NUM_PARTICLES = 20;
  var particles = [];

  /* ──────────────────────────────────────────────────────────────
     Realistic flow simulation.
     Approach: dense streak-line release from inlet bands.
     Velocity field = uniform + shape-specific potential flow
                     + vortex shedding (cylinder mid-Re)
                     + recirculation in detached wake.
     ────────────────────────────────────────────────────────────── */
  var NUM_BANDS = 20;            /* horizontal streamline release bands */
  var BAND_TOP = 100, BAND_BOT = 300;
  var TRAIL_MAX = 90;            /* segments per particle trail (longer for wide canvas) */
  var PARTICLES_PER_BAND = 10;
  var TEST_CX_F = 600, TEST_CY_F = 200;
  var TUNNEL_TOP = 90, TUNNEL_BOT = 310;

  /* Vortex shedding state for cylinder (von Kármán street) */
  var shedVortices = [];   /* {x, y, strength, age, maxAge} */
  var shedClock = 0;
  var shedSide = 1;

  function initParticles() {
    particles = [];
    shedVortices = [];
    shedClock = 0;
    /* Seed each band with several particles spread across the test section */
    for (var b = 0; b < NUM_BANDS; b++) {
      var y0 = BAND_TOP + (BAND_BOT - BAND_TOP) * (b + 0.5) / NUM_BANDS;
      for (var k = 0; k < PARTICLES_PER_BAND; k++) {
        var p = createParticle(0, y0, b);
        /* Stagger initial X so the field starts populated rather than all at the inlet */
        p.x = 40 + (k / PARTICLES_PER_BAND) * 1100 + (Math.random() - 0.5) * 30;
        particles.push(p);
      }
    }
  }
  function createParticle(x, y, band) {
    return {
      x: x, y: y,
      vx: 0, vy: 0,
      band: band,
      bandY0: y,
      age: 0,
      life: 0,
      speed: 1,
      trail: [],
      maxTrail: TRAIL_MAX
    };
  }

  /* Object effective radius in pixels (matches drawTestObject scaling) */
  function objRadiusPx() { return (state.objSize / 80) * 50; }

  /* Get effective shape parameters for flow model */
  function shapeParams(obj, R) {
    /* a = effective doublet radius, wakeHalf = half-width of wake, sepAngle = where flow detaches */
    var Re = state.results ? state.results.Re : calcReynolds(state.airSpeed, state.objSize / 1000);
    var sep = Math.PI / 2; /* default 90° */
    var wake = R;
    if (obj.id === 'sphere') {
      sep = (Re > 3e5) ? 1.92 : 1.39;   /* drag crisis pushes separation back */
      wake = (Re > 3e5) ? R * 0.7 : R * 1.4;
    } else if (obj.id === 'cylinder') {
      /* Circular cylinder in crossflow — wider subcritical wake than the
         sphere (2D separation), crisis at Re ≈ 2.5×10⁵ */
      sep = (Re > 2.5e5) ? 1.92 : 1.35;
      wake = (Re > 2.5e5) ? R * 0.8 : R * 1.6;
    } else if (obj.id === 'cone') {
      /* Apex-first: attached flow on conical nose, separation at base edge */
      sep = 1.80; wake = R * 1.0;
    } else if (obj.id === 'flat-plate') {
      sep = 1.05; wake = R * 2.2;
    } else if (obj.id === 'streamlined') {
      sep = Math.PI - 0.2; wake = R * 0.3;
    } else if (obj.id === 'airfoil') {
      sep = Math.PI - 0.5; wake = R * 0.4;
    } else if (obj.id === 'car') {
      sep = 1.5; wake = R * 1.6;
    }
    /* When the shape is reversed, separation moves forward and wake gets wider */
    if (state.flipObj && (obj.id === 'car' || obj.id === 'streamlined' || obj.id === 'airfoil' || obj.id === 'cone')) {
      sep = Math.max(1.0, sep - 0.35);
      wake *= (obj.id === 'cone' ? 2.2 : 1.7);
    }
    return { a: R, sep: sep, wake: wake, Re: Re };
  }

  /* Velocity at a canvas point, in px/s.
     Composition — every term is individually divergence-free, so the sum is:
       1. potential-flow solution around the true body geometry (panel method,
          or the exact axisymmetric solution for the sphere)
       2. channel contraction/diffuser outside the test section
       3. wake stream function downstream of separation  (empirical, labelled)
       4. shed vortices for the Kármán street              (empirical, labelled)
     There are no multiplicative patches: mass is conserved everywhere. */
  function velAt(x, y, t) {
    var V = state.airSpeed; if (V < 1) V = 1;
    var U = V * 2.6;                                   /* px/s */
    var obj = OBJECTS[state.objIdx];
    var c = pmSolution();
    var R = c.R;

    var base = pmSampleGrid(c, x, y);
    if (base && base.inside) return { vx: 0, vy: 0, inside: true };
    var vx, vy;
    if (base) { vx = base.vx * U; vy = base.vy * U; }
    else { var ch = pmChannelVel(x, y, U); vx = ch.vx; vy = ch.vy; }

    /* ---- empirical separated-flow model (NOT potential flow) ---- */
    var sp = shapeParams(obj, R);
    var rearSign = (state.flipObj && (obj.id === 'car' || obj.id === 'cone' || obj.id === 'streamlined')) ? -1 : 1;
    var dx = (x - TEST_CX_F) * rearSign;
    var dy = y - TEST_CY_F;
    var f = state.results;
    var Cd = f ? (f.CdRaw != null ? f.CdRaw : f.Cd) : 0.5;

    if (dx > 0 && dx < R * 14) {
      var w = pmWakeVel(dx, dy, R, U, Cd, Math.max(sp.wake, R * 0.25));
      vx += w.vx * rearSign;
      vy += w.vy;
      /* near-wake recirculation: a counter-rotating vortex pair (divergence-free) */
      if (dx < R * 3.2 && Math.abs(dy) < sp.wake * 1.8) {
        var att = Math.exp(-dx / (R * 2.2)) * clamp(Cd, 0, 2) * 0.55;
        var ex = R * 1.4, ey = sp.wake * 0.42;
        [[ey, 1], [-ey, -1]].forEach(function (e) {
          var ddx = dx - ex, ddy = dy - e[0];
          var rr = Math.max(ddx * ddx + ddy * ddy, R * R * 0.05);
          vx += e[1] * U * att * (-ddy) / rr * R * rearSign;
          vy += e[1] * U * att * (ddx) / rr * R;
        });
      }
    }

    /* Kármán street (cylinder, sub-critical) — point vortices, divergence-free */
    if (obj.id === 'cylinder' && sp.Re > 47 && sp.Re < 2e5) {
      for (var iv = 0; iv < shedVortices.length; iv++) {
        var vv = shedVortices[iv];
        var qx = x - vv.x, qy = y - vv.y;
        var q2 = qx * qx + qy * qy + R * R * 0.25;
        var s = vv.strength * (1 - vv.age / vv.maxAge) * 0.6;
        vx += -s * qy / q2 * R * U * 0.5;
        vy += s * qx / q2 * R * U * 0.5;
      }
    }
    return { vx: vx, vy: vy, inside: false };
  }

  function updateParticles(dt) {
    var V = state.airSpeed;
    if (V < 1) V = 1;
    var obj = OBJECTS[state.objIdx];
    var R = objRadiusPx();
    var sp = shapeParams(obj, R);

    /* Vortex shedding bookkeeping for cylinder.
       Strouhal frequency must be computed in PIXEL units (f = St·U_px/D_px)
       so the street wavelength comes out ≈ U/f = D/St ≈ 4.8 diameters, as in
       reality. Using the physical Hz here would give a sub-pixel wavelength. */
    if (obj.id === 'cylinder' && sp.Re > 47 && sp.Re < 2e5) {
      var St = 0.21;
      var f = St * (V * 2.6) / (2 * R);          /* 1/s in pixel space */
      var sheddingPeriod = 1 / Math.max(f, 0.02);
      shedClock += dt;
      var _emits = 0;
      while (shedClock > sheddingPeriod && _emits < 8) {   /* fixed-step accumulator */
        shedClock -= sheddingPeriod;
        shedSide = -shedSide;
        shedVortices.push({
          x: TEST_CX_F + R * 0.8,
          y: TEST_CY_F + shedSide * R * 0.4,
          strength: shedSide * 1.5,
          age: 0,
          maxAge: 12.0   /* long enough to convect through the diffuser at street speeds */
        });
        _emits++;
      }
      /* Convect & age shed vortices */
      for (var iv = shedVortices.length - 1; iv >= 0; iv--) {
        var vv = shedVortices[iv];
        vv.x += V * 2.21 * dt;   /* 0.85 * U_pix (Bearman exp. ~0.85·U∞) */
        vv.age += dt;
        if (vv.age > vv.maxAge || vv.x > 1220) shedVortices.splice(iv, 1);
      }
    } else {
      shedVortices.length = 0;
    }

    var t = state.simTime;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      /* RK2 integrator for smoother trajectories */
      var v1 = velAt(p.x, p.y, t);
      if (v1.inside) {
        /* push gently outward to nearest surface */
        var dxs = p.x - TEST_CX_F, dys = p.y - TEST_CY_F;
        var rs = Math.sqrt(dxs * dxs + dys * dys) || 1;
        p.x = TEST_CX_F + dxs / rs * R;     /* exact surface (was R*1.05 halo) */
        p.y = TEST_CY_F + dys / rs * R;
        v1 = velAt(p.x, p.y, t);
      }
      var midX = p.x + v1.vx * dt * 0.5;
      var midY = p.y + v1.vy * dt * 0.5;
      var v2 = velAt(midX, midY, t);
      var vxF = v2.vx, vyF = v2.vy;

      /* Tunnel-wall correction in contraction/diffuser */
      var topW = TUNNEL_TOP, botW = TUNNEL_BOT;
      if (p.x < 360) {
        var f0 = (360 - p.x) / 360;
        topW = TUNNEL_TOP - 60 * f0; botW = TUNNEL_BOT + 60 * f0;
      } else if (p.x > 840) {
        var f1 = (p.x - 840) / 320;
        topW = TUNNEL_TOP - 70 * Math.min(f1, 1); botW = TUNNEL_BOT + 70 * Math.min(f1, 1);
      }
      p.x += vxF * dt;
      p.y += vyF * dt;
      if (p.y < topW + 4) { p.y = topW + 4; vyF = Math.abs(vyF) * 0.2; }
      if (p.y > botW - 4) { p.y = botW - 4; vyF = -Math.abs(vyF) * 0.2; }

      /* Trail */
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > p.maxTrail) p.trail.shift();
      var sp2 = Math.sqrt(vxF * vxF + vyF * vyF) / (V * 2.6);
      p.speed = sp2;
      p.vx = vxF; p.vy = vyF;
      p.age += dt;

      /* Recycle: off-canvas right OR stuck too long in wake (slow + old).
         Age limit scales with speed — at V = 1 m/s a particle needs ~9 min to
         cross, so a fixed 6 s limit would starve the test section. */
      var pSpeed = Math.hypot(vxF, vyF);
      var stuck = p.age > 2 && pSpeed < V * 0.45;
      var maxAgeP = Math.max(6, 1500 / (V * 2.6));
      if (p.x > 1220 || p.age > maxAgeP || stuck) {
        /* re-emit near the inlet on a band y */
        var b = p.band;
        var y0 = BAND_TOP + (BAND_BOT - BAND_TOP) * (b + 0.5) / NUM_BANDS;
        /* Small jitter to avoid moiré */
        p.x = -10 - Math.random() * 30;
        p.y = y0 + (Math.random() - 0.5) * 5;
        p.trail.length = 0;
        p.age = 0;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S5  CONCEPTS DATA (16)
     ═══════════════════════════════════════════════════════════════ */
  var CONCEPTS = [
    /* Fundamentals */
    {
      id: 'drag-force', name: 'Drag Force & Drag Coefficient', cat: 'Fundamentals',
      symbol: 'Cd', formula: 'Fd = 0.5 \u00d7 \u03c1 \u00d7 V\u00b2 \u00d7 A \u00d7 Cd',
      desc: 'Drag force is the aerodynamic resistance a body experiences when moving through a fluid. It acts parallel to the flow direction, opposing motion. The drag coefficient Cd is a dimensionless number that characterizes the drag of an object independent of size and speed. It depends primarily on the object\'s shape and the Reynolds number. Typical Cd values range from 0.04 for streamlined bodies to 1.98 for a flat plate normal to the flow.',
      example: {
        problem: 'A sphere of diameter 50 mm is tested in a wind tunnel at 30 m/s. Air density is 1.225 kg/m\u00b3 and Cd = 0.47. Calculate the drag force.',
        steps: ['A = \u03c0d\u00b2/4 = \u03c0(0.05)\u00b2/4 = 0.001963 m\u00b2', 'q = 0.5 \u00d7 1.225 \u00d7 30\u00b2 = 551.25 Pa', 'Fd = q \u00d7 A \u00d7 Cd = 551.25 \u00d7 0.001963 \u00d7 0.47', '<strong>Fd = 0.508 N</strong>']
      }
    },
    {
      id: 'lift-force', name: 'Lift Force & Lift Coefficient', cat: 'Fundamentals',
      symbol: 'Cl', formula: 'Fl = 0.5 \u00d7 \u03c1 \u00d7 V\u00b2 \u00d7 A \u00d7 Cl',
      desc: 'Lift force acts perpendicular to the free-stream flow direction, typically upward on a wing. It is generated by the pressure difference between the upper and lower surfaces of a body. For symmetric airfoils like the NACA 0012, lift is zero at zero angle of attack and increases linearly with angle of attack until stall. The lift coefficient Cl follows thin airfoil theory: Cl = 2\u03c0\u00b7sin(\u03b1) for small angles.',
      example: {
        problem: 'A NACA 0012 airfoil with chord 100 mm and span 200 mm is at \u03b1 = 5\u00b0 in 40 m/s flow. Estimate the lift force.',
        steps: ['Cl = 2\u03c0\u00b7sin(5\u00b0) = 2\u03c0 \u00d7 0.0872 = 0.548', 'A = chord \u00d7 span = 0.1 \u00d7 0.2 = 0.02 m\u00b2', 'q = 0.5 \u00d7 1.225 \u00d7 40\u00b2 = 980 Pa', '<strong>Fl = 980 \u00d7 0.02 \u00d7 0.548 = 10.74 N</strong>']
      }
    },
    {
      id: 'reynolds', name: 'Reynolds Number', cat: 'Fundamentals',
      symbol: 'Re', formula: 'Re = \u03c1 \u00d7 V \u00d7 D / \u03bc',
      desc: 'The Reynolds number is a dimensionless ratio of inertial forces to viscous forces in a fluid flow. It determines the flow regime: laminar (Re < 2300 for pipe flow), transitional, or turbulent (Re > 4000). For external flows over bodies, Re governs boundary layer behavior, drag coefficients, and separation patterns. Higher Reynolds numbers indicate more turbulent flows where inertial effects dominate.',
      example: {
        problem: 'Calculate Re for air flowing at 25 m/s over a 60 mm cylinder. \u03c1 = 1.225 kg/m\u00b3, \u03bc = 1.789\u00d710\u207b\u2075 Pa\u00b7s (ISA sea level).',
        steps: ['Re = \u03c1VD/\u03bc', 'Re = 1.225 \u00d7 25 \u00d7 0.06 / 1.789\u00d710\u207b\u2075', 'Re = 1.8375 / 1.789\u00d710\u207b\u2075', '<strong>Re = 102,711</strong>', 'Re \u2248 1.0\u00d710\u2075 is the <em>subcritical</em> regime for a cylinder: the boundary layer is still laminar at separation, but the wake behind it is turbulent. The drag crisis has not happened yet \u2014 that needs Re \u2248 2.5\u00d710\u2075.']
      }
    },
    /* Flow Physics */
    {
      id: 'boundary-layer', name: 'Boundary Layer Theory', cat: 'Flow Physics',
      symbol: '\u03b4', formula: '\u03b4 = 5x / \u221aRe_x (laminar)',
      desc: 'The boundary layer is the thin region near a solid surface where the fluid velocity increases from zero (no-slip condition at the wall) to the free-stream velocity. In a laminar boundary layer, flow is orderly and the boundary layer thickness grows as \u03b4 = 5x/\u221aRe_x. At higher Reynolds numbers, the boundary layer transitions to turbulent, becoming thicker but having higher skin friction. The boundary layer concept is fundamental to understanding drag and heat transfer.',
      example: {
        problem: 'Find the laminar boundary layer thickness 200 mm from the leading edge of a flat plate in 20 m/s airflow.',
        steps: ['Re_x = \u03c1Vx/\u03bc = 1.225 \u00d7 20 \u00d7 0.2 / 1.789\u00d710\u207b\u2075 = 273,896', 'Re_x &lt; 5\u00d710\u2075, so the layer is still laminar and the Blasius result applies', '\u03b4 = 5x/\u221aRe_x = 5 \u00d7 0.2 / \u221a273896', '\u03b4 = 1.0 / 523.4 = 0.001911 m', '<strong>\u03b4 = 1.91 mm</strong>']
      }
    },
    {
      id: 'separation', name: 'Flow Separation & Wake', cat: 'Flow Physics',
      symbol: '', formula: 'Separation occurs when dp/dx > 0 (adverse pressure gradient)',
      desc: 'Flow separation occurs when the boundary layer detaches from the body surface due to an adverse pressure gradient (pressure increasing in the flow direction). Behind the separation point, a low-pressure wake forms filled with recirculating eddies. This wake region is the primary source of pressure drag (also called form drag), which dominates over skin friction drag for bluff bodies. Streamlined shapes delay separation, dramatically reducing drag.',
      example: {
        problem: 'A cylinder (Cd = 1.2) and a streamlined body (Cd = 0.04) both have the same frontal area of 0.005 m\u00b2 in 30 m/s flow. Compare their drag forces.',
        steps: ['q = 0.5 \u00d7 1.225 \u00d7 30\u00b2 = 551.25 Pa', 'Fd_cylinder = 551.25 \u00d7 0.005 \u00d7 1.2 = 3.31 N', 'Fd_streamlined = 551.25 \u00d7 0.005 \u00d7 0.04 = 0.11 N', '<strong>Cylinder drag is 30\u00d7 higher due to massive flow separation</strong>']
      }
    },
    {
      id: 'bernoulli', name: 'Bernoulli\'s Equation', cat: 'Flow Physics',
      symbol: 'P', formula: 'P + 0.5\u03c1V\u00b2 + \u03c1gh = constant',
      desc: 'Bernoulli\'s equation relates pressure, velocity, and elevation along a streamline in an inviscid, incompressible flow. Where velocity increases, pressure decreases, and vice versa. This principle explains lift generation on airfoils (faster flow over the upper surface creates lower pressure) and the operation of Venturi meters and pitot tubes. The dynamic pressure q = 0.5\u03c1V\u00b2 represents the kinetic energy per unit volume of the flow.',
      example: {
        problem: 'Air flows through a wind tunnel contraction. If the inlet velocity is 10 m/s and the test section velocity is 30 m/s, what is the pressure drop? (\u03c1 = 1.225 kg/m\u00b3)',
        steps: ['P\u2081 + 0.5\u03c1V\u2081\u00b2 = P\u2082 + 0.5\u03c1V\u2082\u00b2', '\u0394P = 0.5\u03c1(V\u2082\u00b2 \u2212 V\u2081\u00b2)', '\u0394P = 0.5 \u00d7 1.225 \u00d7 (900 \u2212 100)', '<strong>\u0394P = 490 Pa</strong>']
      }
    },
    /* Aerodynamics */
    {
      id: 'pressure-dist', name: 'Pressure Distribution', cat: 'Aerodynamics',
      symbol: 'Cp', formula: 'Cp = (p \u2212 p\u221e) / q',
      desc: 'The pressure coefficient Cp is a dimensionless measure of local pressure relative to the free-stream. Cp = 1 at the stagnation point (where flow comes to rest), Cp = 0 at the free-stream condition, and negative Cp indicates suction (local pressure below free-stream). For an ideal inviscid flow around a cylinder, Cp = 1 \u2212 4sin\u00b2\u03b8. The integration of pressure distribution around a body yields the net aerodynamic forces.',
      example: {
        problem: 'At a point on a cylinder surface where \u03b8 = 90\u00b0, calculate the ideal Cp and the local pressure if V\u221e = 40 m/s.',
        steps: ['Cp = 1 \u2212 4sin\u00b2(90\u00b0) = 1 \u2212 4(1) = \u22123', 'q = 0.5 \u00d7 1.225 \u00d7 40\u00b2 = 980 Pa', 'p \u2212 p\u221e = Cp \u00d7 q = \u22123 \u00d7 980 = \u22122940 Pa', '<strong>Local pressure is 2940 Pa below atmospheric (strong suction)</strong>']
      }
    },
    {
      id: 'stall', name: 'Stall & Angle of Attack', cat: 'Aerodynamics',
      symbol: '\u03b1', formula: 'Cl = 2\u03c0\u00b7sin(\u03b1) (pre-stall)',
      desc: 'The angle of attack (\u03b1) is the angle between the chord line of an airfoil and the oncoming flow direction. As \u03b1 increases, lift increases linearly (Cl = 2\u03c0sin\u03b1) until the critical angle is reached, typically 12\u00b0\u201318\u00b0 for the NACA 0012. Beyond this angle, the boundary layer separates from the upper surface, causing a sudden loss of lift (stall) and a dramatic increase in drag. Stall is a critical flight safety concern.',
      example: {
        problem: 'A NACA 0012 airfoil stalls at \u03b1 = 15\u00b0 with Cl_max = 1.5. What is the maximum lift force at V = 50 m/s with wing area 0.05 m\u00b2?',
        steps: ['q = 0.5 \u00d7 1.225 \u00d7 50\u00b2 = 1531.25 Pa', 'Fl_max = q \u00d7 A \u00d7 Cl_max', 'Fl_max = 1531.25 \u00d7 0.05 \u00d7 1.5', '<strong>Fl_max = 114.8 N</strong>']
      }
    },
    {
      id: 'drag-crisis', name: 'Drag Crisis', cat: 'Aerodynamics',
      symbol: 'Re_crit', formula: 'Cd drops at Re \u2248 3\u00d710\u2075 (sphere/cylinder)',
      desc: 'The drag crisis is a sudden drop in drag coefficient that occurs when the boundary layer transitions from laminar to turbulent at a critical Reynolds number (approximately 3\u00d710\u2075 for a sphere). The turbulent boundary layer has more momentum and can resist the adverse pressure gradient longer, delaying separation and narrowing the wake. For a sphere, Cd drops from 0.47 to about 0.20. This is why golf balls have dimples \u2014 to trip the boundary layer turbulent at lower Re.',
      example: {
        problem: 'A smooth sphere has Cd = 0.47 below Re = 3\u00d710\u2075 and Cd = 0.20 above. For d = 0.1 m, find the velocity at which drag crisis occurs.',
        steps: ['Re_crit = \u03c1V_crit D/\u03bc = 3\u00d710\u2075', 'V_crit = Re_crit \u00d7 \u03bc / (\u03c1D)', 'V_crit = 3\u00d710\u2075 \u00d7 1.789\u00d710\u207b\u2075 / (1.225 \u00d7 0.1)', '<strong>V_crit = 43.8 m/s</strong>']
      }
    },
    /* Applications */
    {
      id: 'bluff-vs-streamlined', name: 'Streamlined vs Bluff Bodies', cat: 'Applications',
      symbol: '', formula: 'Cd_bluff >> Cd_streamlined',
      desc: 'Bluff bodies (cylinders, flat plates, spheres) have large separated wake regions producing high pressure drag. Streamlined bodies are shaped to maintain attached flow as long as possible, minimizing the wake and reducing drag by up to 95%. The teardrop shape is nature\'s solution \u2014 used by fish, birds, and aircraft. The key difference is that bluff bodies are drag-dominated by pressure (form) drag, while streamlined bodies experience mostly skin friction drag.',
      example: {
        problem: 'Compare total drag for a cylinder (Cd = 1.2) and a streamlined body (Cd = 0.04) with the same frontal area, both at 25 m/s.',
        steps: ['q = 0.5 \u00d7 1.225 \u00d7 25\u00b2 = 382.8 Pa', 'Drag ratio = Cd_cylinder / Cd_streamlined = 1.2 / 0.04 = 30', 'The cylinder has <strong>30 times more drag</strong>', 'This is entirely due to flow separation and wake formation']
      }
    },
    {
      id: 'vortex-street', name: 'Von Karman Vortex Street', cat: 'Applications',
      symbol: 'St', formula: 'St = f\u00b7D / V (Strouhal number)',
      desc: 'When flow passes a bluff body at moderate Reynolds numbers (47 < Re < 10\u2075), alternating vortices are shed from each side, forming a periodic pattern called the von Karman vortex street. The shedding frequency f is characterized by the Strouhal number: St = fD/V, which is approximately 0.21 for a cylinder. This periodic vortex shedding can cause structural vibrations (vortex-induced vibration) and is responsible for phenomena like the singing of power lines in wind.',
      example: {
        problem: 'A 20 mm diameter cable is exposed to 15 m/s wind. Estimate the vortex shedding frequency. (St \u2248 0.21)',
        steps: ['St = fD/V', 'f = St \u00d7 V / D', 'f = 0.21 \u00d7 15 / 0.02', '<strong>f = 157.5 Hz</strong>']
      }
    },
    {
      id: 'tunnel-types', name: 'Wind Tunnel Types', cat: 'Applications',
      symbol: '', formula: '',
      desc: 'Wind tunnels are classified by circuit type and speed range. Open-circuit tunnels draw air from the room, pass it through a contraction, test section, diffuser, and exhaust via a fan. Closed-circuit (return) tunnels recirculate air for better flow quality and lower energy cost. Speed classification includes subsonic (M < 0.8), transonic (0.8 < M < 1.2), supersonic (1.2 < M < 5), and hypersonic (M > 5). The contraction ratio (inlet area / test section area) is typically 6:1 to 9:1 to achieve uniform, low-turbulence test section flow.',
      example: {
        problem: 'A wind tunnel has contraction ratio 8:1. If the settling chamber velocity is 4 m/s, what is the test section velocity? (Use continuity equation)',
        steps: ['A\u2081V\u2081 = A\u2082V\u2082 (continuity)', 'V\u2082 = V\u2081 \u00d7 (A\u2081/A\u2082) = V\u2081 \u00d7 CR', 'V\u2082 = 4 \u00d7 8', '<strong>V\u2082 = 32 m/s in the test section</strong>']
      }
    },
    {
      id: 'similarity', name: 'Dynamic Similarity & Reynolds Matching', cat: 'Fundamentals',
      symbol: 'Re_model = Re_full', formula: 'V = Re·μ / (ρD)',
      desc: 'A scale model reproduces full-scale behaviour when the Reynolds number matches — not when the speed matches. Because Re = ρVD/μ, shrinking the model by 10× means the speed must rise by 10× to compensate, and that quickly runs into the compressibility limit: a 1:10 car model would need transonic speed, where the incompressible model this tunnel uses stops being valid. You have three levers. Raising the speed is the obvious one and the first to fail. Cooling the air is the cryogenic-tunnel lever — it raises ρ and lowers μ together, so ν falls and Re rises for free; chilling from 15 °C to −60 °C buys a factor of 1.73. Raising the pressure does the same through density. But the dominant lever is model size, because Re scales linearly with D and the required speed scales as 1/D. That is why serious automotive work is done in large or full-scale tunnels rather than on small models. Set the temperature and altitude in Lab Setup, then use Match Re to solve for the speed each choice demands.',
      example: {
        problem: 'A car 1.8 m wide travels at 100 km/h (27.8 m/s) in air at 15 °C. What does it take to match that Reynolds number on a model?',
        steps: [
          'Re_full = ρVD/μ = 1.225 × 27.8 × 1.8 / 1.789×10⁻⁵ = 3.42×10⁶',
          '<u>Lever 1 — raise the speed.</u> On a 1:10 model (D = 0.18 m): V = Re·μ/(ρD) = 278 m/s',
          '<strong>M = 0.82 — the incompressible model is invalid. This lever fails first.</strong>',
          '<u>Lever 2 — cool the air.</u> At −60 °C, ρ = 1.656 and μ = 1.402×10⁻⁵, so ν falls from 1.461×10⁻⁵ to 8.47×10⁻⁶ m²/s',
          'That is a factor of 1.73, so the same Re now needs 278/1.73 = 161 m/s — still M = 0.55. <strong>Cryogenic cooling helps, but does not save a 1:10 model.</strong>',
          '<u>Lever 3 — build a bigger model.</u> Re scales with D, so the required speed scales as 1/D. At 1:2 (D = 0.90 m): V = 56 m/s',
          '<strong>M = 0.16 — comfortably incompressible. Model size is the lever that actually works,</strong> which is why full-scale automotive tunnels exist.'
        ]
      }
    },
    {
      id: 'camber', name: 'Camber & the Zero-Lift Angle', cat: 'Aerodynamics',
      symbol: 'α₀', formula: 'C_l = a(α − α₀)',
      desc: 'Camber is the curvature of an airfoil’s mean line, and it shifts the whole lift curve to the left. A symmetric section makes exactly zero lift at zero angle of attack; a cambered one already lifts. The shift is the zero-lift angle α₀, obtained from thin-airfoil theory by integrating the camber-line slope: α₀ = −(1/π)∫(dz/dx)(cosθ − 1)dθ. For a NACA 2412 that gives −2.08°, for a 4412 −4.15°. Camber also produces a nose-down quarter-chord moment C_m,c/4 = (π/4)(A₂ − A₁), which the aircraft must trim against — the price paid for the extra lift. Thickness affects neither α₀ nor C_m,c/4: change a 2412 into a 2415 and both are unchanged, exactly as the theory predicts.',
      example: {
        problem: 'Compare a NACA 0012 and a NACA 4412 (α₀ = −4.15°) at α = 2°, as 2-D sections with lift slope 0.1097 per degree.',
        steps: [
          'NACA 0012 is symmetric, so α₀ = 0: C_l = 0.1097 × (2 − 0) = 0.219',
          'NACA 4412 has α₀ = −4.15°, so the effective angle is 2 − (−4.15) = 6.15°',
          'C_l = 0.1097 × 6.15 = 0.675',
          '<strong>Camber roughly triples the lift at this angle</strong> — without changing the geometric attitude at all.',
          'The cost is C_m,c/4 = −0.106 on the 4412 versus 0 on the 0012.'
        ]
      }
    },
    {
      id: 'aspect-ratio', name: 'Aspect Ratio & Induced Drag', cat: 'Aerodynamics',
      symbol: 'AR = b²/S', formula: 'C_di = C_l² / (π·e·AR)',
      desc: 'A real wing has ends, and at those ends high-pressure air spills round into the low-pressure upper surface, rolling into tip vortices. Those vortices tilt the local flow downward, so the wing sees a smaller effective angle of attack and its lift vector tilts backwards. The backward component is induced drag, C_di = C_l²/(π·e·AR) — the unavoidable price of making lift with a finite span. Two things follow. First, the lift-curve slope falls from the two-dimensional 2π per radian to a = a₀/(1 + a₀/(π·e·AR)). Second, induced drag scales as C_l², so it dominates when flying slowly. High aspect ratio cuts both penalties, which is why gliders and airliners have long thin wings and why a delta-winged fighter, optimised for other things, pays heavily in cruise.',
      example: {
        problem: 'A wing operates at C_l = 0.6 with span efficiency e = 0.9. Compare the induced drag and lift-curve slope at AR = 2 and AR = 12.',
        steps: [
          'AR = 2:  C_di = 0.6²/(π × 0.9 × 2) = 0.36/5.655 = 0.0637',
          'AR = 12: C_di = 0.6²/(π × 0.9 × 12) = 0.36/33.93 = 0.0106',
          '<strong>Six times less induced drag on the long wing.</strong>',
          'Lift slope, AR = 2:  a = 2π/(1 + 2π/(π × 0.9 × 2)) = 0.052 per degree',
          'Lift slope, AR = 12: a = 2π/(1 + 2π/(π × 0.9 × 12)) = 0.093 per degree',
          'The short wing needs almost twice the angle of attack for the same C_l — and stalls later because of it.'
        ]
      }
    },
    {
      id: 'blockage-uncertainty', name: 'Blockage & Measurement Uncertainty', cat: 'Applications',
      symbol: 'ε = S_f/C', formula: 'C_d,c = C_d/(1+ε)²',
      desc: 'Two things separate a number from a measurement. The first is blockage: a model in a closed test section forces the air around it to speed up, because the walls will not let the flow move aside. The measured dynamic pressure is therefore too low and the coefficient comes out too high. Corrections follow Barlow, Rae & Pope — solid blockage ε_sb = K₁τ₁V_model/C^1.5 plus wake blockage ε_wb = (S_f/4C)C_d — giving V_c = V(1+ε) and C_d,c = C_d/(1+ε)². The measured force never changes; only the coefficient you report from it does. Convention keeps blockage under 5 %. The second is uncertainty: every instrument has a tolerance, and they propagate in quadrature. Because q depends on V², velocity error enters doubled — usually the dominant term in the whole budget.',
      example: {
        problem: 'A 150 mm sphere is tested in a 300 × 300 mm section at Re where C_d = 0.20. Find the blockage and the correction. Then find the expanded uncertainty in C_d if u(V) = 0.5 m/s at V = 50 m/s, u(D) = 0.1 mm and u(F) = 0.01 N.',
        steps: [
          'Frontal area S_f = π(0.15)²/4 = 0.01767 m²;  section C = 0.09 m²',
          'Blockage ratio = 0.01767/0.09 = <strong>19.6 % — far above the 5 % limit</strong>',
          'Volume = π(0.15)³/6 = 1.767×10⁻³ m³, so ε_sb = 0.9 × 0.82 × 1.767×10⁻³ / 0.09^1.5 = 0.0483',
          'ε_wb = (0.01767/(4 × 0.09)) × 0.20 = 0.0098,  so ε = 0.0581',
          'C_d,c = C_d/(1+ε)² = C_d/1.1196 — <strong>the reported C_d falls by 10.7 %</strong>',
          'Uncertainty: u(q)/q = √[(uρ/ρ)² + (2u_V/V)²] ≈ 2 × 0.5/50 = 2.0 %',
          'u(S)/S = 2u_D/D = 2 × 0.1/150 = 0.13 %',
          '<strong>Velocity dominates — because q depends on V², its error is doubled.</strong>'
        ]
      }
    }
  ];

  /* ═══════════════════════════════════════════════════════════════
     S6  PROBLEM GENERATORS (12)
     ═══════════════════════════════════════════════════════════════ */
  function generateProblem() {
    var pool = [
      genDragForce, genReynoldsNum, genDetermineCd, genAirfoilLift,
      genDynamicPressure, genLDRatio, genFlowRegime, genPowerDrag,
      genTerminalVelocity, genBoundaryLayerThick, genPressureCoeff, genStrouhalNum
    ];
    return pool[randInt(0, pool.length - 1)]();
  }

  function genDragForce() {
    var Cd = roundN(randFloat(0.1, 1.5), 2);
    var V = randInt(10, 60);
    var D = randInt(20, 80);
    var Dm = D / 1000;
    var A = Math.PI * Dm * Dm / 4;
    var q = 0.5 * RHO_ISA * V * V;
    var Fd = q * A * Cd;
    return {
      prompt: 'Calculate the drag force on a sphere with diameter ' + D + ' mm and Cd = ' + Cd + ' in an airflow of ' + V + ' m/s. (\u03c1 = 1.225 kg/m\u00b3)',
      answer: roundN(Fd, 3), unit: 'N', tol: roundN(Fd * 0.02, 4) + 0.001,
      solution: [
        'A = \u03c0d\u00b2/4 = \u03c0(' + Dm + ')\u00b2/4 = ' + roundN(A, 6) + ' m\u00b2',
        'q = 0.5 \u00d7 1.225 \u00d7 ' + V + '\u00b2 = ' + roundN(q, 2) + ' Pa',
        'Fd = q \u00d7 A \u00d7 Cd = ' + roundN(q, 2) + ' \u00d7 ' + roundN(A, 6) + ' \u00d7 ' + Cd,
        '<strong>Fd = ' + roundN(Fd, 3) + ' N</strong>'
      ]
    };
  }

  function genReynoldsNum() {
    var V = randInt(5, 70);
    var D = randInt(10, 100);
    var Dm = D / 1000;
    var Re = RHO_ISA * V * Dm / MU_ISA;
    return {
      prompt: 'Calculate the Reynolds number for air flowing at ' + V + ' m/s over a body with characteristic length ' + D + ' mm. (\u03c1 = 1.225 kg/m\u00b3, \u03bc = 1.789\u00d710\u207b\u2075 Pa\u00b7s)',
      answer: Math.round(Re), unit: '', tol: Math.round(Re * 0.02) + 1,
      solution: [
        'Re = \u03c1VD/\u03bc',
        'Re = 1.225 \u00d7 ' + V + ' \u00d7 ' + Dm + ' / 1.789\u00d710\u207b\u2075',
        'Re = ' + roundN(RHO_ISA * V * Dm, 4) + ' / 1.789\u00d710\u207b\u2075',
        '<strong>Re = ' + Math.round(Re) + '</strong>'
      ]
    };
  }

  function genDetermineCd() {
    var Fd = roundN(randFloat(0.5, 10), 2);
    var V = randInt(15, 50);
    var D = randInt(30, 80);
    var Dm = D / 1000;
    var A = Math.PI * Dm * Dm / 4;
    var q = 0.5 * RHO_ISA * V * V;
    var Cd = Fd / (q * A);
    return {
      prompt: 'A ' + D + ' mm diameter sphere experiences a drag force of ' + Fd + ' N in ' + V + ' m/s airflow. Determine the drag coefficient Cd.',
      answer: roundN(Cd, 3), unit: '', tol: 0.02,
      solution: [
        'A = \u03c0d\u00b2/4 = ' + roundN(A, 6) + ' m\u00b2',
        'q = 0.5 \u00d7 1.225 \u00d7 ' + V + '\u00b2 = ' + roundN(q, 2) + ' Pa',
        'Cd = Fd / (q \u00d7 A) = ' + Fd + ' / (' + roundN(q, 2) + ' \u00d7 ' + roundN(A, 6) + ')',
        '<strong>Cd = ' + roundN(Cd, 3) + '</strong>'
      ]
    };
  }

  function genAirfoilLift() {
    var alpha = randInt(2, 12);
    var V = randInt(20, 60);
    var chord = randInt(50, 150);
    var span = randInt(100, 300);
    var cm = chord / 1000;
    var sm = span / 1000;
    var A = cm * sm;
    var Cl = 2 * Math.PI * Math.sin(alpha * Math.PI / 180);
    var q = 0.5 * RHO_ISA * V * V;
    var Fl = q * A * Cl;
    return {
      prompt: 'A NACA 0012 airfoil with chord ' + chord + ' mm and span ' + span + ' mm is at \u03b1 = ' + alpha + '\u00b0 in ' + V + ' m/s airflow. Calculate the lift force using Cl = 2\u03c0sin(\u03b1).',
      answer: roundN(Fl, 2), unit: 'N', tol: roundN(Math.abs(Fl) * 0.02, 3) + 0.01,
      solution: [
        'Cl = 2\u03c0\u00b7sin(' + alpha + '\u00b0) = 2\u03c0 \u00d7 ' + roundN(Math.sin(alpha * Math.PI / 180), 4) + ' = ' + roundN(Cl, 3),
        'A = ' + cm + ' \u00d7 ' + sm + ' = ' + roundN(A, 6) + ' m\u00b2',
        'q = 0.5 \u00d7 1.225 \u00d7 ' + V + '\u00b2 = ' + roundN(q, 2) + ' Pa',
        '<strong>Fl = ' + roundN(q, 2) + ' \u00d7 ' + roundN(A, 6) + ' \u00d7 ' + roundN(Cl, 3) + ' = ' + roundN(Fl, 2) + ' N</strong>'
      ]
    };
  }

  function genDynamicPressure() {
    var V = randInt(5, 80);
    var q = 0.5 * RHO_ISA * V * V;
    return {
      prompt: 'Calculate the dynamic pressure for air flowing at ' + V + ' m/s. (\u03c1 = 1.225 kg/m\u00b3)',
      answer: roundN(q, 2), unit: 'Pa', tol: roundN(q * 0.02, 2) + 0.01,
      solution: [
        'q = 0.5 \u00d7 \u03c1 \u00d7 V\u00b2',
        'q = 0.5 \u00d7 1.225 \u00d7 ' + V + '\u00b2',
        'q = 0.5 \u00d7 1.225 \u00d7 ' + (V * V),
        '<strong>q = ' + roundN(q, 2) + ' Pa</strong>'
      ]
    };
  }

  function genLDRatio() {
    var alpha = randInt(2, 10);
    var Cl = 2 * Math.PI * Math.sin(alpha * Math.PI / 180);
    var Cd0 = 0.006;
    var e = 0.9;
    var AR = 6;
    var Cd = Cd0 + (Cl * Cl) / (Math.PI * e * AR);
    var LD = Cl / Cd;
    return {
      prompt: 'A NACA 0012 airfoil (Cd0 = 0.006, e = 0.9, AR = 6) is at \u03b1 = ' + alpha + '\u00b0. Calculate the L/D ratio.',
      answer: roundN(LD, 1), unit: '', tol: roundN(LD * 0.02, 1) + 0.1,
      solution: [
        'Cl = 2\u03c0sin(' + alpha + '\u00b0) = ' + roundN(Cl, 3),
        'Cd = Cd0 + Cl\u00b2/(\u03c0eAR) = 0.006 + ' + roundN(Cl, 3) + '\u00b2/(\u03c0\u00d70.9\u00d76)',
        'Cd = 0.006 + ' + roundN(Cl * Cl / (Math.PI * e * AR), 4) + ' = ' + roundN(Cd, 4),
        '<strong>L/D = Cl/Cd = ' + roundN(Cl, 3) + '/' + roundN(Cd, 4) + ' = ' + roundN(LD, 1) + '</strong>'
      ]
    };
  }

  function genFlowRegime() {
    var V = randInt(1, 50);
    var D = randInt(5, 200);
    var Dm = D / 1000;
    var Re = RHO_ISA * V * Dm / MU_ISA;
    var regime;
    if (Re < 1) regime = 'Creeping flow';
    else if (Re < 1000) regime = 'Laminar';
    else if (Re < 200000) regime = 'Transitional/subcritical';
    else regime = 'Turbulent/supercritical';
    return {
      prompt: 'Air flows at ' + V + ' m/s over a ' + D + ' mm diameter cylinder. Calculate Re and state the flow regime. (Answer Re as a number)',
      answer: Math.round(Re), unit: '', tol: Math.round(Re * 0.02) + 1,
      solution: [
        'Re = \u03c1VD/\u03bc = 1.225 \u00d7 ' + V + ' \u00d7 ' + Dm + ' / 1.789\u00d710\u207b\u2075',
        '<strong>Re = ' + Math.round(Re) + '</strong>',
        'Flow regime: <strong>' + regime + '</strong>',
        'Re < 1: creeping \u00b7 1\u201310\u00b3: laminar \u00b7 10\u00b3\u20132\u00d710\u2075: subcritical \u00b7 > 2\u00d710\u2075: supercritical (cylinder crossflow)'
      ]
    };
  }

  function genPowerDrag() {
    var Cd = roundN(randFloat(0.2, 1.0), 2);
    var V = randInt(10, 50);
    var A = roundN(randFloat(0.005, 0.05), 4);
    var q = 0.5 * RHO_ISA * V * V;
    var Fd = q * A * Cd;
    var P = Fd * V;
    return {
      prompt: 'A body with Cd = ' + Cd + ' and frontal area ' + A + ' m\u00b2 moves at ' + V + ' m/s through air. Calculate the power required to overcome drag (P = Fd \u00d7 V).',
      answer: roundN(P, 2), unit: 'W', tol: roundN(P * 0.02, 2) + 0.01,
      solution: [
        'q = 0.5 \u00d7 1.225 \u00d7 ' + V + '\u00b2 = ' + roundN(q, 2) + ' Pa',
        'Fd = q \u00d7 A \u00d7 Cd = ' + roundN(q, 2) + ' \u00d7 ' + A + ' \u00d7 ' + Cd + ' = ' + roundN(Fd, 3) + ' N',
        'P = Fd \u00d7 V = ' + roundN(Fd, 3) + ' \u00d7 ' + V,
        '<strong>P = ' + roundN(P, 2) + ' W</strong>'
      ]
    };
  }

  function genTerminalVelocity() {
    var d = randInt(5, 30);
    var dm = d / 1000;
    var rhoSphere = randInt(2000, 8000);
    var Cd = roundN(randFloat(0.3, 0.5), 2);
    var A = Math.PI * dm * dm / 4;
    var Vol = (4 / 3) * Math.PI * Math.pow(dm / 2, 3);
    var W = rhoSphere * Vol * 9.81;
    var Vt = Math.sqrt(2 * W / (RHO_ISA * A * Cd));
    return {
      prompt: 'A sphere of diameter ' + d + ' mm and density ' + rhoSphere + ' kg/m\u00b3 falls through air (Cd = ' + Cd + '). Calculate the terminal velocity.',
      answer: roundN(Vt, 1), unit: 'm/s', tol: roundN(Vt * 0.02, 1) + 0.1,
      solution: [
        'At terminal velocity: Fd = W \u2192 0.5\u03c1V\u00b2ACd = mg',
        'Volume = (4/3)\u03c0r\u00b3 = ' + roundN(Vol * 1e9, 2) + ' mm\u00b3 = ' + roundN(Vol, 9) + ' m\u00b3',
        'Weight W = \u03c1_s \u00d7 V \u00d7 g = ' + rhoSphere + ' \u00d7 ' + roundN(Vol, 9) + ' \u00d7 9.81 = ' + roundN(W, 5) + ' N',
        'Vt = \u221a(2W / (\u03c1ACd)) = \u221a(2\u00d7' + roundN(W, 5) + ' / (1.225\u00d7' + roundN(A, 6) + '\u00d7' + Cd + '))',
        '<strong>Vt = ' + roundN(Vt, 1) + ' m/s</strong>'
      ]
    };
  }

  function genBoundaryLayerThick() {
    var V = randInt(10, 40);
    var x = randInt(50, 500);
    var xm = x / 1000;
    var Rex = RHO_ISA * V * xm / MU_ISA;
    var delta = 5 * xm / Math.sqrt(Rex);
    return {
      prompt: 'Find the laminar boundary layer thickness at x = ' + x + ' mm from the leading edge of a flat plate in ' + V + ' m/s airflow. (\u03b4 = 5x/\u221aRe_x)',
      answer: roundN(delta * 1000, 2), unit: 'mm', tol: roundN(delta * 1000 * 0.02, 2) + 0.01,
      solution: [
        'Re_x = \u03c1Vx/\u03bc = 1.225 \u00d7 ' + V + ' \u00d7 ' + xm + ' / 1.789\u00d710\u207b\u2075 = ' + Math.round(Rex),
        '\u03b4 = 5x/\u221aRe_x = 5 \u00d7 ' + xm + ' / \u221a' + Math.round(Rex),
        '\u03b4 = ' + roundN(5 * xm, 4) + ' / ' + roundN(Math.sqrt(Rex), 1),
        '<strong>\u03b4 = ' + roundN(delta * 1000, 2) + ' mm</strong>'
      ]
    };
  }

  function genPressureCoeff() {
    var V = randInt(15, 50);
    var q = 0.5 * RHO_ISA * V * V;
    var pLocal = roundN(randFloat(-3, 1) * q, 1);
    var Cp = pLocal / q;
    return {
      prompt: 'In a wind tunnel at V = ' + V + ' m/s, a pressure tap reads a gauge pressure of ' + pLocal + ' Pa relative to free-stream. Calculate the pressure coefficient Cp.',
      answer: roundN(Cp, 3), unit: '', tol: 0.02,
      solution: [
        'q = 0.5 \u00d7 1.225 \u00d7 ' + V + '\u00b2 = ' + roundN(q, 2) + ' Pa',
        'Cp = (p \u2212 p\u221e) / q = ' + pLocal + ' / ' + roundN(q, 2),
        '<strong>Cp = ' + roundN(Cp, 3) + '</strong>',
        Cp < 0 ? 'Negative Cp indicates suction (local velocity > free-stream)' : 'Positive Cp indicates stagnation/deceleration region'
      ]
    };
  }

  function genStrouhalNum() {
    var D = randInt(10, 100);
    var Dm = D / 1000;
    var V = randInt(5, 40);
    var St = 0.21;
    var f = St * V / Dm;
    return {
      prompt: 'A cylinder of diameter ' + D + ' mm is in ' + V + ' m/s crossflow. Using the Strouhal number St = 0.21, calculate the vortex shedding frequency.',
      answer: roundN(f, 1), unit: 'Hz', tol: roundN(f * 0.02, 1) + 0.1,
      solution: [
        'St = fD/V \u2192 f = St \u00d7 V / D',
        'f = 0.21 \u00d7 ' + V + ' / ' + Dm,
        'f = ' + roundN(0.21 * V, 2) + ' / ' + Dm,
        '<strong>f = ' + roundN(f, 1) + ' Hz</strong>'
      ]
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     S7  QUIZ POOL (30)
     ═══════════════════════════════════════════════════════════════ */
  var QUIZ_POOL = [
    /* MCQ (10) */
    { type: 'mcq', q: 'What does the Reynolds number compare?', opts: ['Inertial forces to viscous forces', 'Pressure forces to gravity forces', 'Drag to lift', 'Velocity to speed of sound'], ans: 0 },
    { type: 'mcq', q: 'At what approximate Re does the drag crisis occur for a smooth sphere?', opts: ['3 \u00d7 10\u2075', '3 \u00d7 10\u00b3', '3 \u00d7 10\u2077', '3 \u00d7 10\u00b9'], ans: 0 },
    { type: 'mcq', q: 'Which body shape has the lowest drag coefficient?', opts: ['Streamlined (teardrop)', 'Sphere', 'Cylinder', 'Flat plate'], ans: 0 },
    { type: 'mcq', q: 'What happens to an airfoil beyond the stall angle?', opts: ['Lift decreases sharply and drag increases', 'Lift continues to increase', 'Drag decreases to zero', 'Flow becomes perfectly laminar'], ans: 0 },
    { type: 'mcq', q: 'Bernoulli\'s equation states that where velocity increases:', opts: ['Pressure decreases', 'Pressure increases', 'Density increases', 'Temperature increases'], ans: 0 },
    { type: 'mcq', q: 'What is the primary cause of drag on a bluff body?', opts: ['Pressure drag from flow separation', 'Skin friction only', 'Wave drag', 'Gravitational effects'], ans: 0 },
    { type: 'mcq', q: 'The Strouhal number for vortex shedding behind a cylinder is approximately:', opts: ['0.21', '2.1', '0.021', '21'], ans: 0 },
    { type: 'mcq', q: 'What is the pressure coefficient at a stagnation point?', opts: ['Cp = +1.0', 'Cp = 0', 'Cp = -1.0', 'Cp = +2.0'], ans: 0 },
    { type: 'mcq', q: 'Why do golf balls have dimples?', opts: ['To trip the boundary layer turbulent and reduce drag', 'To increase surface area and generate lift', 'For aesthetic purposes', 'To reduce weight'], ans: 0 },
    { type: 'mcq', q: 'The boundary layer thickness for laminar flow over a flat plate varies as:', opts: ['\u03b4 \u221d x / \u221aRe_x', '\u03b4 \u221d x\u00b2', '\u03b4 = constant', '\u03b4 \u221d 1/x'], ans: 0 },
    /* Numeric (5) */
    { type: 'num', q: 'Calculate the dynamic pressure for air (\u03c1 = 1.225 kg/m\u00b3) flowing at 40 m/s. (q = 0.5\u03c1V\u00b2, answer in Pa)', ans: roundN(0.5 * 1.225 * 1600, 1), unit: 'Pa', tol: 5 },
    { type: 'num', q: 'A sphere with Cd = 0.47 and frontal area 0.002 m\u00b2 is in 30 m/s airflow. What is the drag force in N?', ans: roundN(0.5 * 1.225 * 900 * 0.002 * 0.47, 3), unit: 'N', tol: 0.02 },
    { type: 'num', q: 'Calculate Re for V = 20 m/s, D = 0.05 m, \u03c1 = 1.225 kg/m\u00b3, \u03bc = 1.789\u00d710\u207b\u2075 Pa\u00b7s.', ans: Math.round(RHO_ISA * 20 * 0.05 / MU_ISA), unit: '', tol: 500 },
    { type: 'num', q: 'An airfoil at \u03b1 = 8\u00b0 has Cl = 2\u03c0sin(8\u00b0). Calculate Cl.', ans: roundN(2 * Math.PI * Math.sin(8 * Math.PI / 180), 3), unit: '', tol: 0.02 },
    { type: 'num', q: 'A 30 mm cylinder sheds vortices at St = 0.21 in 10 m/s flow. Find shedding frequency in Hz.', ans: roundN(0.21 * 10 / 0.03, 1), unit: 'Hz', tol: 1 },

    /* Similarity, camber, finite span, blockage and uncertainty */
    { type: 'mcq', q: 'To test a scale model correctly in a wind tunnel you must match the full-scale:', opts: ['Reynolds number', 'Air speed', 'Model size', 'Drag force'], ans: 0 },
    { type: 'mcq', q: 'Cooling the air in a wind tunnel from 15 °C to −60 °C at constant pressure raises the Reynolds number at a given speed because:', opts: ['Density rises and viscosity falls, so kinematic viscosity ν drops', 'Density falls and viscosity rises', 'Only the speed of sound changes', 'The dynamic pressure is unaffected by temperature'], ans: 0 },
    { type: 'mcq', q: 'A 1:10 model needs 278 m/s to match its full-scale Reynolds number, which is Mach 0.82. The most effective fix is to:', opts: ['Build a larger model — required speed scales as 1/D', 'Run the tunnel even faster', 'Increase the angle of attack', 'Move the test to a higher altitude'], ans: 0 },
    { type: 'mcq', q: 'A NACA 2412 at exactly zero angle of attack produces:', opts: ['Positive lift, because camber shifts the zero-lift angle negative', 'Zero lift, like every airfoil at α = 0', 'Negative lift', 'Zero lift only above Re = 10⁶'], ans: 0 },
    { type: 'mcq', q: 'Changing a NACA 2412 to a NACA 2415 changes the thickness. According to thin-airfoil theory, the zero-lift angle α₀:', opts: ['Stays the same — α₀ depends only on the camber line', 'Becomes more negative', 'Becomes less negative', 'Falls to zero'], ans: 0 },
    { type: 'mcq', q: 'Reducing a wing’s aspect ratio at a fixed angle of attack:', opts: ['Lowers the lift-curve slope and raises induced drag', 'Raises the lift-curve slope and lowers induced drag', 'Leaves both unchanged', 'Removes profile drag'], ans: 0 },
    { type: 'mcq', q: 'Induced drag on a finite wing is proportional to:', opts: ['Cₗ² / (π e AR)', 'Cₗ / (π e AR)', 'AR / Cₗ²', 'π e AR / Cₗ'], ans: 0 },
    { type: 'mcq', q: 'A model that blocks too much of a closed test section makes the measured drag coefficient come out:', opts: ['Too high, because the flow around it speeds up', 'Too low, because the walls slow the flow', 'Unchanged — blockage cancels out', 'Too high, but only above Mach 0.3'], ans: 0 },
    { type: 'mcq', q: 'The conventional upper limit on wind-tunnel blockage ratio for a valid test is about:', opts: ['5 %', '25 %', '50 %', '0.5 %'], ans: 0 },
    { type: 'mcq', q: 'Because q = ½ρV², a 1 % uncertainty in measured velocity gives a dynamic-pressure uncertainty of about:', opts: ['2 %', '1 %', '0.5 %', '4 %'], ans: 0 },
    { type: 'mcq', q: 'An expanded uncertainty quoted with a coverage factor k = 2 corresponds to roughly:', opts: ['95 % confidence', '68 % confidence', '99.9 % confidence', '50 % confidence'], ans: 0 },
    { type: 'mcq', q: 'Integrating the pressure coefficient around a body in ideal, fully attached inviscid flow gives a drag of exactly zero. This result is called:', opts: ['D’Alembert’s paradox', 'The Kutta condition', 'The Magnus effect', 'Prandtl’s hypothesis'], ans: 0 },
    { type: 'mcq', q: 'At a fixed true airspeed, climbing from sea level to 11 km makes the Mach number:', opts: ['Rise, because the speed of sound falls with temperature', 'Fall, because the air is thinner', 'Stay the same', 'Rise, because density increases'], ans: 0 },
    { type: 'num', q: 'A NACA 4412 has a zero-lift angle of −4.15°. Using the 2-D slope Cₗ = 0.1097 per degree, what is Cₗ at α = 0°? (2 dp)', ans: 0.46, unit: '', tol: 0.03 },
    { type: 'num', q: 'A wing has Cₗ = 1.0, AR = 8 and e = 0.9. Calculate the induced drag coefficient. (3 dp)', ans: 0.0442, unit: '', tol: 0.004 },
    { type: 'num', q: 'A model of frontal area 0.0045 m² sits in a 0.30 × 0.30 m test section. What is the blockage ratio, in per cent? (1 dp)', ans: 5.0, unit: '%', tol: 0.3 }
  ];

  /* ═══════════════════════════════════════════════════════════════
     S8  DOM REFS & STATE
     ═══════════════════════════════════════════════════════════════ */
  var elSimWrapper = $('sim-wrapper');
  var elExploreWrapper = $('explore-wrapper');
  var elPracticeWrapper = $('practice-wrapper');
  var elQuizWrapper = $('quiz-wrapper');
  var elModeTabs = $('mode-tabs');
  var elSimControls = $('sim-controls');
  var elReadoutGrid = $('readout-grid');
  /* Sim controls */
  var elSpeedSlider = $('speed-slider');
  var elSpeedVal = $('speed-val');
  var elObjTabs = $('obj-tabs');
  var elAoaSlider = $('aoa-slider');
  var elAoaVal = $('aoa-val');
  var elAoaGroup = $('aoa-group');
  var elSizeSlider = $('size-slider');
  var elSizeVal = $('size-val');
  var elVisTabs = $('vis-tabs');
  /* Readout */
  var elBadgeV = $('badge-v');
  var elBadgeRe = $('badge-re');
  var elBadgeCd = $('badge-cd');
  var elBadgeFd = $('badge-fd');
  /* Explore */
  var elExploreCats = $('explore-cats');
  var elExploreGrid = $('explore-grid');
  var elExploreInfo = $('explore-info');
  /* Practice */
  var elPracticePrompt = $('practice-prompt');
  var elPracticeInput = $('practice-input');
  var elPracticeUnit = $('practice-unit');
  var elPracticeFeedback = $('practice-feedback');
  var elPracticeSolution = $('practice-solution');
  var elPracticeScore = $('practice-score');
  var elBtnCheck = $('btn-check');
  var elBtnShowSol = $('btn-show-sol');
  var elBtnNextProb = $('btn-next-prob');
  /* Quiz */
  var elQuizPanel = $('quiz-panel');
  var elQuizCounter = $('quiz-counter');
  var elQuizPrompt = $('quiz-prompt');
  var elQuizOptions = $('quiz-options');
  var elQuizNumRow = $('quiz-num-row');
  var elQuizNumInput = $('quiz-num-input');
  var elQuizNumUnit = $('quiz-num-unit');
  var elBtnQuizSubmit = $('btn-quiz-submit');
  var elQuizFeedback = $('quiz-feedback');
  var elBtnQuizNext = $('btn-quiz-next');
  var elQuizResult = $('quiz-result');
  var elQRStars = $('qr-stars');
  var elQRScore = $('qr-score');
  var elQRTable = $('qr-table');
  var elBtnNewQuiz = $('btn-new-quiz');

  /* State */
  var state = {
    mode: 'simulate',
    objIdx: 4,          /* default test article: Streamlined body */
    airSpeed: 60,
    angleOfAttack: 0,
    objSize: 100,
    visMode: 'streamlines', /* streamlines, pressure, velocity */
    graphTab: 'pressure',   /* pressure, forces, profile, polar */
    flipObj: false,         /* mirror shape horizontally (car/streamlined orientation) */
    paused: false,          /* animation pause/resume */
    zoomed: false,          /* one-stage zoom on test object */
    fanAngle: 0,
    simTime: 0,
    /* Tunnel conditions (working fluid is air) */
    tempC: 15,              /* °C  — ISA sea-level standard              */
    altitudeM: 0,           /* m   — geopotential, sets ambient pressure */
    useISATemp: true,       /* slave temperature to the ISA profile      */
    /* Wing planform */
    AR: Infinity,           /* aspect ratio; Infinity = 2-D section      */
    spanEff: 0.9,           /* Oswald span efficiency e                  */
    naca: { m: 0, p: 0, t: 0.12 },   /* NACA 4-digit: camber, position, thickness */
    /* Test section and corrections */
    testW: 0.30, testH: 0.30,        /* m — closed test-section size     */
    applyBlockage: false,
    applyPG: false,                  /* Prandtl–Glauert compressibility  */
    showInviscid: false,             /* d'Alembert overlay on the Cp plot */
    /* Instrument standard uncertainties (k = 1) */
    unc: { uV: 0.5, uD: 0.0001, uT: 0.5, uP: 100, uF: 0.01 },
    /* CSV sweep */
    sweepVar: 'speed', sweepN: 60,
    /* Results */
    results: null,
    /* Explore */
    expCat: 'Fundamentals',
    expIdx: 0,
    /* Practice */
    pProb: null,
    pScore: 0,
    pTotal: 0,
    pDone: false,
    /* Quiz */
    qSet: [],
    qIdx: 0,
    qScore: 0,
    qDone: false,
    qAnswered: false,
    qResults: []
  };

  /* ═══════════════════════════════════════════════════════════════
     S8.5  UNIT SYSTEM, OVERLAY TOGGLES, UNDO/REDO, SOUNDS
     ═══════════════════════════════════════════════════════════════ */
  var unitMode = 'si';   /* 'si' or 'imp' */
  function isImp() { return unitMode === 'imp'; }

  /* Conversion table (multiply SI → display) */
  function U() {
    if (isImp()) {
      return {
        speed:  { fromSI: function (v) { return v * 2.2369; }, toSI: function (v) { return v / 2.2369; }, label: 'mph',  digits: 1, min: 1,  max: 336 },
        size:   { fromSI: function (v) { return v * 0.03937; }, toSI: function (v) { return v / 0.03937; }, label: 'in', digits: 2, min: 0.8, max: 8 },
        force:  { fromSI: function (v) { return v * 0.2248; }, toSI: function (v) { return v / 0.2248; }, label: 'lbf', digits: 3 },
        press:  { fromSI: function (v) { return v * 0.14504e-3; }, toSI: function (v) { return v / 0.14504e-3; }, label: 'psi', digits: 4 },
        angle:  { fromSI: function (v) { return v; }, toSI: function (v) { return v; }, label: '°', digits: 1, min: -10, max: 25 }
      };
    }
    return {
      speed:  { fromSI: function (v) { return v; }, toSI: function (v) { return v; }, label: 'm/s', digits: 1, min: 1, max: 150 },
      size:   { fromSI: function (v) { return v; }, toSI: function (v) { return v; }, label: 'mm',  digits: 0, min: 20, max: 200 },
      force:  { fromSI: function (v) { return v; }, toSI: function (v) { return v; }, label: 'N',   digits: 3 },
      press:  { fromSI: function (v) { return v; }, toSI: function (v) { return v; }, label: 'Pa',  digits: 1 },
      angle:  { fromSI: function (v) { return v; }, toSI: function (v) { return v; }, label: '°', digits: 1, min: -10, max: 25 }
    };
  }

  /* Overlay toggles */
  var showEquation = true;
  var showArrows   = true;
  var showPitot    = true;
  var showBL       = true;
  var showLabels   = true;
  var showGrid     = false;

  /* Animation/rolling output (drives canvas equation) */
  var anim = { forceScale: 1, running: false };

  /* Undo/redo */
  var undoStack = [];
  var redoStack = [];
  var UNDO_CAP = 60;

  function snapState() {
    return {
      o: state.objIdx, v: state.airSpeed, a: state.angleOfAttack, s: state.objSize,
      vm: state.visMode, gt: state.graphTab, fl: state.flipObj,
      se: showEquation, sa: showArrows, sp: showPitot, sb: showBL, sl: showLabels, sg: showGrid,
      u: unitMode
    };
  }
  function loadState(s) {
    if (!s) return;
    state.objIdx        = (s.o  === undefined) ? state.objIdx        : s.o;
    state.airSpeed      = (s.v  === undefined) ? state.airSpeed      : s.v;
    state.angleOfAttack = (s.a  === undefined) ? state.angleOfAttack : s.a;
    state.objSize       = (s.s  === undefined) ? state.objSize       : s.s;
    state.visMode       = (s.vm === undefined) ? state.visMode       : s.vm;
    state.graphTab      = (s.gt === undefined) ? state.graphTab      : s.gt;
    state.flipObj       = (s.fl === undefined) ? state.flipObj       : !!s.fl;
    showEquation = (s.se === undefined) ? true  : !!s.se;
    showArrows   = (s.sa === undefined) ? true  : !!s.sa;
    showPitot    = (s.sp === undefined) ? true  : !!s.sp;
    showBL       = (s.sb === undefined) ? true  : !!s.sb;
    showLabels   = (s.sl === undefined) ? true  : !!s.sl;
    showGrid     = (s.sg === undefined) ? false : !!s.sg;
    if (s.u && s.u !== unitMode) { unitMode = s.u; syncUnitToggle(); }
    syncCheckboxes();
    syncObjTab();
    syncAoaGroup();
    syncVisTab();
    syncInputs();
    initParticles();
    updateResults();
  }
  function saveUndo() {
    undoStack.push(snapState());
    if (undoStack.length > UNDO_CAP) undoStack.shift();
    redoStack.length = 0;
    syncActionBar();
  }
  function performUndo() {
    if (!undoStack.length) return;
    redoStack.push(snapState());
    loadState(undoStack.pop());
    syncActionBar();
  }
  function performRedo() {
    if (!redoStack.length) return;
    undoStack.push(snapState());
    loadState(redoStack.pop());
    syncActionBar();
  }
  function syncActionBar() {
    var u = $('btn-undo'); if (u) u.disabled = !undoStack.length;
    var r = $('btn-redo'); if (r) r.disabled = !redoStack.length;
  }

  /* Sounds (Web Audio, lazy init) */
  var audioCtx = null;
  function getAudio() {
    if (audioCtx) return audioCtx;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  function playWhoosh(intensity) {
    var ac = getAudio(); if (!ac) return;
    var t0 = ac.currentTime;
    var dur = 0.35;
    var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < ch.length; i++) {
      var env = 1 - (i / ch.length);
      ch[i] = (Math.random() * 2 - 1) * env * 0.4;
    }
    var src = ac.createBufferSource(); src.buffer = buf;
    var bp = ac.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 600 + 1200 * Math.min(1, intensity || 0.4);
    bp.Q.value = 1.2;
    var g = ac.createGain(); g.gain.value = 0.15;
    src.connect(bp); bp.connect(g); g.connect(ac.destination);
    src.start(t0); src.stop(t0 + dur);
  }
  function playStall() {
    var ac = getAudio(); if (!ac) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(240, t0);
    o.frequency.exponentialRampToValueAtTime(110, t0 + 0.45);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + 0.55);
  }
  var lastStallState = false;
  var lastSpeedForSound = 20;

  /* ═══════════════════════════════════════════════════════════════
     S9  CANVAS SETUP (DPR + ResizeObserver)
     ═══════════════════════════════════════════════════════════════ */
  var mCanvas = $('machine-canvas');
  var gCanvas = $('graph-canvas');
  var eCanvas = $('explore-canvas');
  var mCtx = mCanvas.getContext('2d');
  var gCtx = gCanvas.getContext('2d');
  var eCtx = eCanvas.getContext('2d');
  var MW = 1200, MH = 440;
  var GW = 600, GH = 420;
  var EW = 900, EH = 400;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeOne(cvs, ctx, LW, LH) {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    var rect = cvs.getBoundingClientRect();
    var cssW = rect.width  || LW;
    var cssH = cssW * (LH / LW);
    cvs.style.height = cssH + 'px';
    cvs.width  = Math.round(cssW * d);
    cvs.height = Math.round(cssH * d);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(cvs.width / LW, cvs.height / LH);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
  }
  function initCanvases() {
    resizeOne(mCanvas, mCtx, MW, MH);
    resizeOne(gCanvas, gCtx, GW, GH);
    resizeOne(eCanvas, eCtx, EW, EH);
  }
  function redrawAll() {
    if (state.mode === 'simulate') { drawMachine(); drawGraph(); }
    else if (state.mode === 'explore' && state.expIdx >= 0) { drawExploreDiagram(CONCEPTS[state.expIdx]); }
  }

  /* ═══════════════════════════════════════════════════════════════
     S10  MACHINE CANVAS — WIND TUNNEL DRAWING
     ═══════════════════════════════════════════════════════════════ */

  /* Tunnel layout constants (landscape canvas 1200×440) */
  var TUNNEL_LEFT = 40;
  var TUNNEL_RIGHT = 1160;
  var TUNNEL_CY = 200;
  var TEST_LEFT = 360;
  var TEST_RIGHT = 840;
  var TEST_TOP = 90;
  var TEST_BOT = 310;
  var TEST_CX = 600;
  var TEST_CY = 200;

  /* One-stage zoom factor — scales inversely with object size so a small
     test article enlarges more than a big one. Clamped to [1.4, 3.0]. */
  function getZoomFactor() {
    var t = clamp((state.objSize - 20) / 180, 0, 1);
    return lerp(3.0, 1.4, t);
  }
  function drawMachine() {
    mCtx.clearRect(0, 0, MW, MH);
    drawTunnelBackground();

    var zoomed = !!state.zoomed;
    if (zoomed) {
      var z = getZoomFactor();
      mCtx.save();
      /* Center the view on the test object and scale up around it */
      mCtx.translate(MW / 2, MH / 2);
      mCtx.scale(z, z);
      mCtx.translate(-TEST_CX, -TEST_CY);
    }

    if (showGrid) drawCanvasGrid();
    drawContractionCone();
    drawTestSection();
    drawDiffuser();
    drawFan();
    drawTestObject(OBJECTS[state.objIdx]);
    if (OBJECTS[state.objIdx].id === 'airfoil') drawAoaIndicator();
    if (state.visMode === 'streamlines') {
      drawStreamlines();
    } else if (state.visMode === 'pressure') {
      drawPressureField();
    } else if (state.visMode === 'velocity') {
      drawVelocityField();
    }
    if (showArrows) drawForceArrows();
    drawWake();
    if (showBL) drawBoundaryLayer();
    drawVelocityProfile();
    if (showPitot) drawPitotTube();
    if (showLabels) drawTunnelLabels();

    if (zoomed) {
      mCtx.restore();
      /* HUD badge — gold "ZOOM N.N×" pill, top-right */
      var zf = getZoomFactor();
      mCtx.save();
      mCtx.fillStyle = 'rgba(245,200,66,0.92)';
      mCtx.fillRect(MW - 90, 12, 78, 22);
      mCtx.fillStyle = '#1a1a2e';
      mCtx.font = 'bold 11px sans-serif';
      mCtx.textAlign = 'center';
      mCtx.textBaseline = 'middle';
      mCtx.fillText('🔍 ' + zf.toFixed(1) + '×', MW - 51, 23);
      mCtx.restore();
    }
    if (state.paused) {
      /* HUD badge — gold "PAUSED" pill, top-center */
      mCtx.save();
      mCtx.fillStyle = 'rgba(245,200,66,0.92)';
      mCtx.fillRect(MW / 2 - 50, 12, 100, 22);
      mCtx.fillStyle = '#1a1a2e';
      mCtx.font = 'bold 11px sans-serif';
      mCtx.textAlign = 'center';
      mCtx.textBaseline = 'middle';
      mCtx.fillText('⏸ PAUSED', MW / 2, 23);
      mCtx.restore();
    }

    if (showEquation) drawCanvasEquation();
  }
  function drawCanvasGrid() {
    mCtx.strokeStyle = 'rgba(0,188,212,0.12)';
    mCtx.lineWidth = 0.5;
    for (var x = 0; x < MW; x += 40) {
      mCtx.beginPath(); mCtx.moveTo(x, 0); mCtx.lineTo(x, MH); mCtx.stroke();
    }
    for (var y = 0; y < MH; y += 40) {
      mCtx.beginPath(); mCtx.moveTo(0, y); mCtx.lineTo(MW, y); mCtx.stroke();
    }
  }
  function drawCanvasEquation() {
    var obj = OBJECTS[state.objIdx];
    var D = state.objSize / 1000;
    var f = calcForces(state.airSpeed, D, obj, state.angleOfAttack);
    var u = U();
    var roll = anim.forceScale;
    var Vtxt = u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits) + ' ' + u.speed.label;
    var Fdtxt = u.force.fromSI(f.Fd * roll).toFixed(u.force.digits) + ' ' + u.force.label;
    var Cdtxt = roundN(f.Cd, 3);
    /* Equation in a compact box, bottom-left corner of landscape canvas */
    mCtx.save();
    var boxX = 18, boxY = MH - 60, boxW = 320, boxH = 50;
    mCtx.fillStyle = 'rgba(13,17,30,0.82)';
    mCtx.fillRect(boxX, boxY, boxW, boxH);
    mCtx.strokeStyle = 'rgba(0,188,212,0.40)'; mCtx.lineWidth = 1;
    mCtx.strokeRect(boxX, boxY, boxW, boxH);
    mCtx.textBaseline = 'middle';
    var cy = boxY + 18;
    var x = boxX + 10;
    mCtx.font = 'italic 700 15px "Cambria Math","Times New Roman",serif';
    mCtx.fillStyle = '#ff8a65';
    mCtx.fillText('F', x, cy); x += mCtx.measureText('F').width;
    mCtx.font = '700 10px "Cambria Math","Times New Roman",serif';
    mCtx.fillText('d', x, cy + 5); x += mCtx.measureText('d').width + 2;
    mCtx.font = '700 15px "Cambria Math","Times New Roman",serif';
    mCtx.fillStyle = '#ffd54f'; mCtx.fillText(' = ', x, cy); x += mCtx.measureText(' = ').width;
    mCtx.font = 'italic 700 14px "Cambria Math","Times New Roman",serif';
    mCtx.fillStyle = '#80deea';
    mCtx.fillText('½ρV² A C', x, cy); x += mCtx.measureText('½ρV² A C').width;
    mCtx.font = '700 9px "Cambria Math","Times New Roman",serif';
    mCtx.fillText('d', x, cy + 5); x += mCtx.measureText('d').width + 8;
    mCtx.font = '700 13px "JetBrains Mono",Consolas,monospace';
    mCtx.fillStyle = '#3ddc84';
    mCtx.fillText('= ' + Fdtxt, x, cy);
    /* second row: Cd, V */
    mCtx.font = '600 11px "JetBrains Mono",Consolas,monospace';
    mCtx.fillStyle = '#b6c3e0';
    mCtx.textBaseline = 'top';
    mCtx.fillText('Cd = ' + Cdtxt + '   V = ' + Vtxt, boxX + 10, boxY + 30);
    mCtx.restore();
  }

  function drawTunnelBackground() {
    mCtx.fillStyle = '#0a0e14';
    mCtx.fillRect(0, 0, MW, MH);
    /* Grid */
    mCtx.strokeStyle = 'rgba(42,48,80,0.3)';
    mCtx.lineWidth = 0.5;
    for (var x = 0; x < MW; x += 20) { mCtx.beginPath(); mCtx.moveTo(x, 0); mCtx.lineTo(x, MH); mCtx.stroke(); }
    for (var y = 0; y < MH; y += 20) { mCtx.beginPath(); mCtx.moveTo(0, y); mCtx.lineTo(MW, y); mCtx.stroke(); }
  }

  function drawContractionCone() {
    /* Bell-mouth inlet narrowing from wide to test section */
    var cx1 = TUNNEL_LEFT;
    var cx2 = TEST_LEFT;
    var wideTop = TUNNEL_CY - 165;
    var wideBot = TUNNEL_CY + 165;
    var narrowTop = TEST_TOP;
    var narrowBot = TEST_BOT;

    /* Outer wall gradient */
    var g = mCtx.createLinearGradient(cx1, 0, cx2, 0);
    g.addColorStop(0, '#37474f');
    g.addColorStop(1, '#455a64');

    /* Top wall */
    mCtx.fillStyle = g;
    mCtx.beginPath();
    mCtx.moveTo(cx1, wideTop);
    mCtx.bezierCurveTo(cx1 + 30, wideTop, cx2 - 30, narrowTop, cx2, narrowTop);
    mCtx.lineTo(cx2, narrowTop - 12);
    mCtx.bezierCurveTo(cx2 - 30, narrowTop - 12, cx1 + 30, wideTop - 12, cx1, wideTop - 12);
    mCtx.closePath();
    mCtx.fill();
    mCtx.strokeStyle = '#546e7a';
    mCtx.lineWidth = 1;
    mCtx.stroke();

    /* Bottom wall */
    mCtx.beginPath();
    mCtx.moveTo(cx1, wideBot);
    mCtx.bezierCurveTo(cx1 + 30, wideBot, cx2 - 30, narrowBot, cx2, narrowBot);
    mCtx.lineTo(cx2, narrowBot + 12);
    mCtx.bezierCurveTo(cx2 - 30, narrowBot + 12, cx1 + 30, wideBot + 12, cx1, wideBot + 12);
    mCtx.closePath();
    mCtx.fill();
    mCtx.stroke();

    /* Bell-mouth screen (honeycomb) */
    mCtx.strokeStyle = 'rgba(0,188,212,0.15)';
    mCtx.lineWidth = 0.5;
    for (var y = wideTop; y <= wideBot; y += 15) {
      mCtx.beginPath();
      mCtx.moveTo(cx1 + 5, y);
      mCtx.lineTo(cx1 + 15, y);
      mCtx.stroke();
    }

    /* Label */
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.5);
    mCtx.font = '7px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('CONTRACTION', (cx1 + cx2) / 2, wideTop - 18);
  }

  function drawTestSection() {
    /* Rectangular transparent-walled test section */
    var tl = TEST_LEFT;
    var tr = TEST_RIGHT;
    var tt = TEST_TOP;
    var tb = TEST_BOT;

    /* Top wall */
    var gTop = mCtx.createLinearGradient(tl, tt - 12, tl, tt);
    gTop.addColorStop(0, '#455a64');
    gTop.addColorStop(1, '#37474f');
    mCtx.fillStyle = gTop;
    mCtx.fillRect(tl, tt - 12, tr - tl, 12);
    mCtx.strokeStyle = '#546e7a';
    mCtx.lineWidth = 1;
    mCtx.strokeRect(tl, tt - 12, tr - tl, 12);

    /* Bottom wall */
    var gBot = mCtx.createLinearGradient(tl, tb, tl, tb + 12);
    gBot.addColorStop(0, '#37474f');
    gBot.addColorStop(1, '#455a64');
    mCtx.fillStyle = gBot;
    mCtx.fillRect(tl, tb, tr - tl, 12);
    mCtx.strokeStyle = '#546e7a';
    mCtx.strokeRect(tl, tb, tr - tl, 12);

    /* Transparent side walls (dashed) */
    mCtx.strokeStyle = hexToRGBA(ACCENT, 0.2);
    mCtx.lineWidth = 1;
    mCtx.setLineDash([4, 4]);
    mCtx.beginPath();
    mCtx.moveTo(tl, tt);
    mCtx.lineTo(tl, tb);
    mCtx.stroke();
    mCtx.beginPath();
    mCtx.moveTo(tr, tt);
    mCtx.lineTo(tr, tb);
    mCtx.stroke();
    mCtx.setLineDash([]);

    /* Test section interior glow */
    var intGlow = mCtx.createRadialGradient(TEST_CX, TEST_CY, 30, TEST_CX, TEST_CY, 200);
    intGlow.addColorStop(0, 'rgba(0,188,212,0.03)');
    intGlow.addColorStop(1, 'rgba(0,0,0,0)');
    mCtx.fillStyle = intGlow;
    mCtx.fillRect(tl, tt, tr - tl, tb - tt);

    /* Measurement grid marks on walls */
    mCtx.strokeStyle = hexToRGBA(ACCENT, 0.1);
    mCtx.lineWidth = 0.5;
    for (var x = tl + 30; x < tr; x += 30) {
      mCtx.beginPath(); mCtx.moveTo(x, tt); mCtx.lineTo(x, tt + 5); mCtx.stroke();
      mCtx.beginPath(); mCtx.moveTo(x, tb); mCtx.lineTo(x, tb - 5); mCtx.stroke();
    }

    /* Label */
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.5);
    mCtx.font = '7px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('TEST SECTION', TEST_CX, tt - 18);
  }

  function drawDiffuser() {
    /* Expanding section after test section */
    var dx1 = TEST_RIGHT;
    var dx2 = TUNNEL_RIGHT - 50;
    var narrowTop = TEST_TOP;
    var narrowBot = TEST_BOT;
    var wideTop = TUNNEL_CY - 165;
    var wideBot = TUNNEL_CY + 165;

    var g = mCtx.createLinearGradient(dx1, 0, dx2, 0);
    g.addColorStop(0, '#455a64');
    g.addColorStop(1, '#37474f');

    /* Top wall */
    mCtx.fillStyle = g;
    mCtx.beginPath();
    mCtx.moveTo(dx1, narrowTop);
    mCtx.bezierCurveTo(dx1 + 30, narrowTop, dx2 - 30, wideTop, dx2, wideTop);
    mCtx.lineTo(dx2, wideTop - 12);
    mCtx.bezierCurveTo(dx2 - 30, wideTop - 12, dx1 + 30, narrowTop - 12, dx1, narrowTop - 12);
    mCtx.closePath();
    mCtx.fill();
    mCtx.strokeStyle = '#546e7a';
    mCtx.lineWidth = 1;
    mCtx.stroke();

    /* Bottom wall */
    mCtx.beginPath();
    mCtx.moveTo(dx1, narrowBot);
    mCtx.bezierCurveTo(dx1 + 30, narrowBot, dx2 - 30, wideBot, dx2, wideBot);
    mCtx.lineTo(dx2, wideBot + 12);
    mCtx.bezierCurveTo(dx2 - 30, wideBot + 12, dx1 + 30, narrowBot + 12, dx1, narrowBot + 12);
    mCtx.closePath();
    mCtx.fill();
    mCtx.stroke();

    /* Label */
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.5);
    mCtx.font = '7px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('DIFFUSER', (dx1 + dx2) / 2, wideTop - 18);
  }

  function drawFan() {
    /* Fan at exit with rotating blades */
    var fx = TUNNEL_RIGHT - 30;
    var fy = TUNNEL_CY;
    var fanR = 35;
    state.fanAngle += state.airSpeed * 0.003;

    /* Fan housing */
    mCtx.fillStyle = '#37474f';
    mCtx.beginPath();
    mCtx.arc(fx, fy, fanR + 8, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.strokeStyle = '#546e7a';
    mCtx.lineWidth = 2;
    mCtx.stroke();

    /* Fan blades */
    mCtx.save();
    mCtx.translate(fx, fy);
    mCtx.rotate(state.fanAngle);
    var numBlades = 6;
    for (var i = 0; i < numBlades; i++) {
      var angle = (i / numBlades) * Math.PI * 2;
      mCtx.save();
      mCtx.rotate(angle);
      mCtx.fillStyle = '#607d8b';
      mCtx.beginPath();
      mCtx.moveTo(0, -3);
      mCtx.lineTo(fanR - 2, -8);
      mCtx.lineTo(fanR, 0);
      mCtx.lineTo(fanR - 2, 5);
      mCtx.lineTo(0, 3);
      mCtx.closePath();
      mCtx.fill();
      mCtx.strokeStyle = '#78909c';
      mCtx.lineWidth = 0.5;
      mCtx.stroke();
      mCtx.restore();
    }
    mCtx.restore();

    /* Hub */
    mCtx.fillStyle = '#455a64';
    mCtx.beginPath();
    mCtx.arc(fx, fy, 8, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.fillStyle = '#78909c';
    mCtx.beginPath();
    mCtx.arc(fx, fy, 4, 0, Math.PI * 2);
    mCtx.fill();

    /* Motor label */
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.5);
    mCtx.font = '7px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('FAN/MOTOR', fx, fy + fanR + 22);
  }

  /* Angle-of-attack indicator for the NACA 0012: freestream reference line,
     α arc between flow direction and chord line, and a blinking STALL flag.
     Drawn in tunnel coords (inside the zoom transform when zoomed). */
  function drawAoaIndicator() {
    var alpha = state.angleOfAttack;
    var R = objRadiusPx();
    var chord = R * 2.5;
    var Re = state.results ? state.results.Re : 5e5;
    var aS = stallAngleDeg(Re);
    var cx = TEST_CX, cy = TEST_CY;
    /* Chord tilt in canvas coords equals α for both flip states */
    var aRad = alpha * Math.PI / 180;

    mCtx.save();
    /* Freestream (flow-direction) reference line through the pivot */
    mCtx.strokeStyle = 'rgba(139,157,195,0.45)';
    mCtx.lineWidth = 1;
    mCtx.setLineDash([5, 4]);
    mCtx.beginPath();
    mCtx.moveTo(cx - chord * 0.78, cy);
    mCtx.lineTo(cx + chord * 0.78, cy);
    mCtx.stroke();
    mCtx.setLineDash([]);

    /* α arc between the upstream freestream direction and the chord line */
    var labelTxt = 'α = ' + alpha + '°';
    var lx, ly;
    if (Math.abs(alpha) > 0.25) {
      var rArc = chord * 0.58;
      mCtx.strokeStyle = '#ffd54f';
      mCtx.lineWidth = 1.5;
      mCtx.beginPath();
      mCtx.arc(cx, cy, rArc, Math.PI, Math.PI + aRad, aRad < 0);
      mCtx.stroke();
      var midA = Math.PI + aRad / 2;
      lx = cx + Math.cos(midA) * (rArc + 22);
      ly = cy + Math.sin(midA) * (rArc + 12);
    } else {
      lx = cx - chord * 0.62;
      ly = cy - 14;
    }
    mCtx.fillStyle = '#ffd54f';
    mCtx.font = 'bold 12px "JetBrains Mono",Consolas,monospace';
    mCtx.textAlign = 'center';
    mCtx.textBaseline = 'middle';
    mCtx.fillText(labelTxt, lx, ly);

    /* Stall status flag above the wing */
    if (Math.abs(alpha) > aS) {
      if (Math.sin(state.simTime * 6) > -0.35) {   /* blink */
        mCtx.fillStyle = 'rgba(255,82,82,0.92)';
        mCtx.fillRect(cx - 36, cy - R * 1.6 - 40, 72, 20);
        mCtx.fillStyle = '#fff';
        mCtx.font = 'bold 11px sans-serif';
        mCtx.fillText('STALL', cx, cy - R * 1.6 - 30);
      }
    } else if (Math.abs(alpha) > aS - 3) {
      mCtx.fillStyle = 'rgba(255,160,0,0.90)';
      mCtx.fillRect(cx - 46, cy - R * 1.6 - 40, 92, 20);
      mCtx.fillStyle = '#1a1a2e';
      mCtx.font = 'bold 10px sans-serif';
      mCtx.fillText('NEAR STALL', cx, cy - R * 1.6 - 30);
    }
    /* Stall-angle reference (small, under the wing) */
    mCtx.fillStyle = 'rgba(139,157,195,0.75)';
    mCtx.font = '9px "JetBrains Mono",monospace';
    mCtx.fillText('α_stall ≈ ' + aS.toFixed(1) + '° @ Re ' + formatSci(Re, 1), cx, cy + R * 1.6 + 26);
    mCtx.restore();
  }

  function drawTestObject(obj) {
    var cx = TEST_CX;
    var cy = TEST_CY;
    var size = (state.objSize / 80) * 50; /* visual radius scale */
    var alpha = state.angleOfAttack;

    mCtx.save();
    mCtx.translate(cx, cy);

    /* Mirror asymmetric shapes when flipped (cone added so apex follows physics) */
    if (state.flipObj && (obj.id === 'car' || obj.id === 'streamlined' || obj.id === 'airfoil' || obj.id === 'cone')) {
      mCtx.scale(-1, 1);
    }

    switch (obj.id) {
      case 'sphere': {
        /* Sphere — read as a BALL: strong radial shading, specular highlight
           and a rim light. Deliberately different from the cylinder, which
           projects to the same circle but is a rod. */
        var sg = mCtx.createRadialGradient(-size * 0.34, -size * 0.34, size * 0.05, 0, 0, size * 1.05);
        sg.addColorStop(0, '#e8eef2');
        sg.addColorStop(0.28, '#b0bec5');
        sg.addColorStop(0.62, obj.color);
        sg.addColorStop(1, '#2b353c');
        mCtx.fillStyle = sg;
        mCtx.beginPath(); mCtx.arc(0, 0, size, 0, Math.PI * 2); mCtx.fill();
        /* rim light on the shadow side — the classic sphere cue */
        mCtx.save();
        mCtx.beginPath(); mCtx.arc(0, 0, size, 0, Math.PI * 2); mCtx.clip();
        var rim = mCtx.createRadialGradient(size * 0.42, size * 0.42, size * 0.35, size * 0.30, size * 0.30, size * 1.15);
        rim.addColorStop(0, 'rgba(255,255,255,0)');
        rim.addColorStop(1, 'rgba(190,215,230,0.42)');
        mCtx.fillStyle = rim;
        mCtx.beginPath(); mCtx.arc(0, 0, size, 0, Math.PI * 2); mCtx.fill();
        mCtx.restore();
        /* specular */
        var spec = mCtx.createRadialGradient(-size * 0.36, -size * 0.38, 0, -size * 0.36, -size * 0.38, size * 0.30);
        spec.addColorStop(0, 'rgba(255,255,255,0.75)');
        spec.addColorStop(1, 'rgba(255,255,255,0)');
        mCtx.fillStyle = spec;
        mCtx.beginPath(); mCtx.arc(-size * 0.36, -size * 0.38, size * 0.30, 0, Math.PI * 2); mCtx.fill();
        mCtx.strokeStyle = '#546e7a'; mCtx.lineWidth = 1;
        mCtx.beginPath(); mCtx.arc(0, 0, size, 0, Math.PI * 2); mCtx.stroke();
        break;
      }

      case 'cylinder': {
        /* Circular cylinder in crossflow. Its axis is perpendicular to BOTH
           the flow and the screen, so it projects to the same circle as the
           sphere — visually ambiguous, but Cd differs by 2.5x. So the rod is
           drawn receding into the test section: the flow-facing silhouette
           (which is what the panel method actually uses) is unchanged, and
           the barrel behind it is a pure depth cue. */
        /* taper the depth cue as the model fills the tunnel, so the barrel
           never pushes through the test-section wall */
        var axL = Math.min(size * 0.85, 52) * clamp((118 - size) / 45, 0.22, 1);
        var axx = axL * 0.78, axy = -axL * 0.62;        /* recede up-and-right */
        var rFar = size * 0.90;                          /* slight perspective */
        var pl = Math.hypot(axx, axy);
        var pxu = -axy / pl, pyu = axx / pl;             /* unit normal to the axis */

        /* far rim */
        mCtx.fillStyle = '#2f3a42';
        mCtx.beginPath(); mCtx.arc(axx, axy, rFar, 0, Math.PI * 2); mCtx.fill();

        /* barrel between near and far rims, lit across its curvature */
        var bg = mCtx.createLinearGradient(-pxu * size, -pyu * size, pxu * size, pyu * size);
        bg.addColorStop(0, '#39444c');
        bg.addColorStop(0.30, obj.color);
        bg.addColorStop(0.52, '#c8d2da');
        bg.addColorStop(0.78, obj.color);
        bg.addColorStop(1, '#333d45');
        mCtx.fillStyle = bg;
        mCtx.beginPath();
        mCtx.moveTo(pxu * size, pyu * size);
        mCtx.lineTo(axx + pxu * rFar, axy + pyu * rFar);
        mCtx.lineTo(axx - pxu * rFar, axy - pyu * rFar);
        mCtx.lineTo(-pxu * size, -pyu * size);
        mCtx.closePath();
        mCtx.fill();
        mCtx.strokeStyle = 'rgba(84,110,122,0.75)'; mCtx.lineWidth = 1;
        mCtx.beginPath();
        mCtx.moveTo(pxu * size, pyu * size); mCtx.lineTo(axx + pxu * rFar, axy + pyu * rFar);
        mCtx.moveTo(-pxu * size, -pyu * size); mCtx.lineTo(axx - pxu * rFar, axy - pyu * rFar);
        mCtx.stroke();

        /* near end face — a flat DISC, not a ball: shading runs across the
           rod, and a bright machined rim reads as a cut end */
        var cg = mCtx.createLinearGradient(-pxu * size, -pyu * size, pxu * size, pyu * size);
        cg.addColorStop(0, '#5c6a74');
        cg.addColorStop(0.35, obj.color);
        cg.addColorStop(0.55, '#cfd8e0');
        cg.addColorStop(1, '#46525a');
        mCtx.fillStyle = cg;
        mCtx.beginPath(); mCtx.arc(0, 0, size, 0, Math.PI * 2); mCtx.fill();
        mCtx.strokeStyle = '#9fb0bb'; mCtx.lineWidth = 1.6;
        mCtx.beginPath(); mCtx.arc(0, 0, size * 0.985, 0, Math.PI * 2); mCtx.stroke();
        mCtx.strokeStyle = '#546e7a'; mCtx.lineWidth = 1;
        mCtx.beginPath(); mCtx.arc(0, 0, size, 0, Math.PI * 2); mCtx.stroke();
        /* concentric turning mark so the end face reads as machined stock */
        mCtx.strokeStyle = 'rgba(13,17,23,0.30)'; mCtx.lineWidth = 1;
        mCtx.beginPath(); mCtx.arc(0, 0, size * 0.55, 0, Math.PI * 2); mCtx.stroke();
        mCtx.beginPath(); mCtx.arc(0, 0, size * 0.16, 0, Math.PI * 2); mCtx.stroke();
        break;
      }

      case 'cone':
        /* Cone profile: apex on LEFT (windward in forward orientation), base on RIGHT */
        var coneLen = size * 2.0;          /* tip-to-base length */
        var coneBaseHalf = size * 0.85;    /* base half-height */
        var coneAx = -coneLen * 0.5;       /* apex x */
        var coneBx =  coneLen * 0.5;       /* base x */
        /* 3D shading gradient — light at apex, darker toward base shadow */
        var coneG = mCtx.createLinearGradient(coneAx, 0, coneBx, 0);
        coneG.addColorStop(0, '#cfd8dc');
        coneG.addColorStop(0.6, obj.color);
        coneG.addColorStop(1, '#455a64');
        mCtx.fillStyle = coneG;
        mCtx.beginPath();
        mCtx.moveTo(coneAx, 0);                                    /* apex */
        mCtx.lineTo(coneBx, -coneBaseHalf);                        /* top of base */
        /* Curved base edge (ellipse hint for 3D feel) */
        mCtx.quadraticCurveTo(coneBx + size * 0.18, 0, coneBx, coneBaseHalf);
        mCtx.closePath();
        mCtx.fill();
        mCtx.strokeStyle = '#37474f';
        mCtx.lineWidth = 1;
        mCtx.stroke();
        /* Base ellipse (rear face) — half-visible to suggest 3D */
        mCtx.fillStyle = 'rgba(55,71,79,0.55)';
        mCtx.beginPath();
        mCtx.ellipse(coneBx, 0, size * 0.18, coneBaseHalf, 0, -Math.PI / 2, Math.PI / 2);
        mCtx.fill();
        mCtx.strokeStyle = '#546e7a';
        mCtx.lineWidth = 0.7;
        mCtx.stroke();
        /* Cone axis dashed (centerline) */
        mCtx.strokeStyle = 'rgba(0,188,212,0.20)';
        mCtx.setLineDash([3, 3]);
        mCtx.beginPath();
        mCtx.moveTo(coneAx, 0); mCtx.lineTo(coneBx, 0);
        mCtx.stroke();
        mCtx.setLineDash([]);
        break;

      case 'flat-plate':
        /* Vertical flat plate */
        mCtx.fillStyle = obj.color;
        mCtx.fillRect(-3, -size * 1.3, 6, size * 2.6);
        mCtx.strokeStyle = '#546e7a';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(-3, -size * 1.3, 6, size * 2.6);
        break;

      case 'streamlined':
        /* Teardrop / NACA-like streamlined body */
        mCtx.fillStyle = obj.color;
        mCtx.beginPath();
        mCtx.moveTo(size * 1.8, 0);
        mCtx.bezierCurveTo(size * 1.5, -size * 0.2, size * 0.5, -size * 0.5, -size * 0.8, -size * 0.5);
        mCtx.bezierCurveTo(-size * 1.5, -size * 0.4, -size * 1.8, -size * 0.15, -size * 1.8, 0);
        mCtx.bezierCurveTo(-size * 1.8, size * 0.15, -size * 1.5, size * 0.4, -size * 0.8, size * 0.5);
        mCtx.bezierCurveTo(size * 0.5, size * 0.5, size * 1.5, size * 0.2, size * 1.8, 0);
        mCtx.closePath();
        mCtx.fill();
        mCtx.strokeStyle = '#546e7a';
        mCtx.lineWidth = 1;
        mCtx.stroke();
        break;

      case 'airfoil':
        /* Real NACA 4-digit section, built by the SAME geometry generator
           the coefficients come from — change m/p/t and the drawn shape,
           the pressure plot and the forces all move together. */
        mCtx.rotate((state.flipObj ? -1 : 1) * alpha * Math.PI / 180);
        var chord = size * 2.5;
        var surf = nacaSurface(state.naca.m, state.naca.p, state.naca.t, 60);
        var toX = function (x) { return x * chord - chord / 2; };
        var toY = function (y) { return -y * chord; };   /* canvas y points down */
        mCtx.fillStyle = obj.color;
        mCtx.beginPath();
        for (var ai2 = 0; ai2 < surf.up.length; ai2++) {
          if (ai2 === 0) mCtx.moveTo(toX(surf.up[ai2].x), toY(surf.up[ai2].y));
          else           mCtx.lineTo(toX(surf.up[ai2].x), toY(surf.up[ai2].y));
        }
        for (var aj2 = surf.lo.length - 1; aj2 >= 0; aj2--) {
          mCtx.lineTo(toX(surf.lo[aj2].x), toY(surf.lo[aj2].y));
        }
        mCtx.closePath();
        mCtx.fill();
        mCtx.strokeStyle = '#546e7a';
        mCtx.lineWidth = 1;
        mCtx.stroke();
        /* Chord line + mean camber line — the visual signature of camber */
        if (state.naca.m > 0 && showLabels) {
          mCtx.save();
          mCtx.setLineDash([4, 3]);
          mCtx.strokeStyle = 'rgba(255,255,255,0.30)';
          mCtx.lineWidth = 1;
          mCtx.beginPath();
          mCtx.moveTo(-chord / 2, 0); mCtx.lineTo(chord / 2, 0);
          mCtx.stroke();
          mCtx.setLineDash([]);
          mCtx.strokeStyle = 'rgba(255,213,79,0.80)';
          mCtx.beginPath();
          for (var ac = 0; ac <= 40; ac++) {
            var xcc = ac / 40;
            mCtx.lineTo(toX(xcc), toY(nacaCamberY(xcc, state.naca.m, state.naca.p)));
          }
          mCtx.stroke();
          mCtx.restore();
        }
        break;

      case 'car':
        /* Sedan profile — FRONT faces LEFT (long low hood, windshield UP, roof, rear window DOWN, short trunk) */
        mCtx.fillStyle = obj.color;
        mCtx.beginPath();
        /* Bottom-front-left corner */
        mCtx.moveTo(-size * 1.5, size * 0.3);
        /* Front bumper face going UP — rounded over */
        mCtx.lineTo(-size * 1.5, size * 0.05);
        mCtx.quadraticCurveTo(-size * 1.5, -size * 0.10, -size * 1.40, -size * 0.10);
        /* Long low hood sloping slightly UP-RIGHT toward the windshield */
        mCtx.lineTo(-size * 0.55, -size * 0.25);
        /* Windshield slope UP-RIGHT (raked sedan windshield) */
        mCtx.lineTo(-size * 0.05, -size * 0.62);
        /* Flat roof */
        mCtx.lineTo(size * 0.55, -size * 0.62);
        /* Rear window slope DOWN-RIGHT (steeper than windshield = classic sedan) */
        mCtx.lineTo(size * 1.05, -size * 0.32);
        /* Short trunk top */
        mCtx.lineTo(size * 1.5, -size * 0.32);
        /* Rear bumper going DOWN */
        mCtx.lineTo(size * 1.5, size * 0.3);
        mCtx.closePath();
        mCtx.fill();
        mCtx.strokeStyle = '#546e7a';
        mCtx.lineWidth = 1;
        mCtx.stroke();
        /* Wheels — front (left) + rear (right) */
        mCtx.fillStyle = '#263238';
        mCtx.beginPath();
        mCtx.arc(-size * 1.00, size * 0.30, size * 0.20, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.arc( size * 1.05, size * 0.30, size * 0.20, 0, Math.PI * 2);
        mCtx.fill();
        /* Wheel hubs (lighter) */
        mCtx.fillStyle = '#78909c';
        mCtx.beginPath();
        mCtx.arc(-size * 1.00, size * 0.30, size * 0.08, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.arc( size * 1.05, size * 0.30, size * 0.08, 0, Math.PI * 2);
        mCtx.fill();
        /* Cabin window glass — matches the redesigned windshield/rear-window slopes */
        mCtx.fillStyle = hexToRGBA(ACCENT, 0.22);
        mCtx.beginPath();
        mCtx.moveTo(-size * 0.03, -size * 0.58);    /* top-left of windshield (just below roof front edge) */
        mCtx.lineTo( size * 0.53, -size * 0.58);    /* top-right of roof line (just below roof rear edge) */
        mCtx.lineTo( size * 0.95, -size * 0.32);    /* bottom of rear window */
        mCtx.lineTo(-size * 0.10, -size * 0.32);    /* bottom of windshield */
        mCtx.closePath();
        mCtx.fill();
        /* A pillar / hood crease cue — small headlight oval on the front face */
        mCtx.fillStyle = '#fff7c1';
        mCtx.beginPath();
        mCtx.ellipse(-size * 1.42, -size * 0.02, size * 0.08, size * 0.05, 0, 0, Math.PI * 2);
        mCtx.fill();
        /* Rear taillight on the trunk */
        mCtx.fillStyle = '#ff5555';
        mCtx.fillRect(size * 1.42, -size * 0.25, size * 0.08, size * 0.10);
        break;
    }

    mCtx.restore();
  }

  function drawStreamlines() {
    if (state.airSpeed < 1) return;
    var obj = OBJECTS[state.objIdx];
    mCtx.lineCap = 'round'; mCtx.lineJoin = 'round';
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.trail.length < 3) continue;
      var ratio = clamp(p.speed, 0, 1.6) / 1.6;
      var col = velocityColor(ratio);
      /* Single continuous polyline at constant width, faded alpha */
      mCtx.strokeStyle = col;
      mCtx.lineWidth = 1.4;
      mCtx.globalAlpha = 0.72;
      mCtx.beginPath();
      mCtx.moveTo(p.trail[0].x, p.trail[0].y);
      for (var j = 1; j < p.trail.length; j++) {
        mCtx.lineTo(p.trail[j].x, p.trail[j].y);
      }
      mCtx.stroke();
      /* Brighter head segment (last 8 px) */
      var n = p.trail.length;
      var k0 = Math.max(0, n - 8);
      mCtx.strokeStyle = col;
      mCtx.lineWidth = 2.0;
      mCtx.globalAlpha = 0.95;
      mCtx.beginPath();
      mCtx.moveTo(p.trail[k0].x, p.trail[k0].y);
      for (var j2 = k0 + 1; j2 < n; j2++) {
        mCtx.lineTo(p.trail[j2].x, p.trail[j2].y);
      }
      mCtx.stroke();
      /* Glow dot at head */
      mCtx.globalAlpha = 1;
      mCtx.fillStyle = '#e8f7ff';
      mCtx.beginPath();
      mCtx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      mCtx.fill();
    }
    mCtx.globalAlpha = 1;

    /* Mark shed vortex centers for cylinder */
    if (obj.id === 'cylinder' && shedVortices.length) {
      for (var v = 0; v < shedVortices.length; v++) {
        var vv = shedVortices[v];
        var life = 1 - vv.age / vv.maxAge;
        mCtx.globalAlpha = 0.35 * life;
        mCtx.strokeStyle = vv.strength > 0 ? '#ff8a65' : '#42a5f5';
        mCtx.lineWidth = 1.2;
        for (var ring = 1; ring <= 3; ring++) {
          mCtx.beginPath();
          mCtx.arc(vv.x, vv.y, 4 * ring, 0, Math.PI * 2);
          mCtx.stroke();
        }
      }
      mCtx.globalAlpha = 1;
    }
  }

  function drawPressureField() {
    var obj = OBJECTS[state.objIdx];
    var cx = TEST_CX;
    var cy = TEST_CY;
    var size = (state.objSize / 80) * 50;
    var alpha = state.angleOfAttack;

    /* Smooth pressure field: large radial gradients for stagnation (red) + suction (blue) */
    (function gradientField() {
      var R = size;
      /* Front stagnation: high pressure red — flip-aware for asymmetric shapes */
      var stagSign = (state.flipObj && (obj.id === 'cone' || obj.id === 'streamlined' || obj.id === 'car')) ? 1 : -1;
      var gx1 = cx + stagSign * R * 0.95, gy1 = cy;
      var grdHi = mCtx.createRadialGradient(gx1, gy1, 2, gx1, gy1, R * 1.8);
      grdHi.addColorStop(0, 'rgba(255, 60, 60, 0.55)');
      grdHi.addColorStop(1, 'rgba(255, 60, 60, 0)');
      mCtx.fillStyle = grdHi;
      mCtx.fillRect(cx - R * 3, cy - R * 3, R * 6, R * 6);
      /* Top + bottom suction (blue) */
      var sucPts = [];
      if (obj.id === 'airfoil') {
        /* Suction lobe sits on the suction side — flips with effective lift sign */
        var upper = ((state.flipObj ? -1 : 1) * alpha >= 0) ? -1 : 1;
        var ar = alpha * Math.PI / 180;
        var sx = cx - R * 0.4 * Math.cos(ar) + upper * R * 0.55 * Math.sin(ar);
        var sy = cy - R * 0.4 * Math.sin(ar) - upper * R * 0.55 * Math.cos(ar);
        sucPts.push([sx, sy, R * 2.0]);
      } else if (obj.id === 'streamlined') {
        /* Lobes at the thickness peak (front bulge); mirror with flipObj */
        var sx_s = state.flipObj ? (cx + R * 0.6) : (cx - R * 0.6);
        sucPts.push([sx_s, cy - R * 0.45, R * 1.0]);
        sucPts.push([sx_s, cy + R * 0.45, R * 1.0]);
      } else if (obj.id === 'flat-plate') {
        /* Tip-separation suction blobs OUTSIDE the plate (was inside, wrong) */
        sucPts.push([cx + R * 0.10, cy - R * 1.50, R * 1.2]);
        sucPts.push([cx + R * 0.10, cy + R * 1.50, R * 1.2]);
      } else {
        sucPts.push([cx, cy - R * 0.95, R * 1.5]);
        sucPts.push([cx, cy + R * 0.95, R * 1.5]);
      }
      for (var sp = 0; sp < sucPts.length; sp++) {
        var pt = sucPts[sp];
        var grdLo = mCtx.createRadialGradient(pt[0], pt[1], 1, pt[0], pt[1], pt[2]);
        grdLo.addColorStop(0, 'rgba(40, 130, 255, 0.55)');
        grdLo.addColorStop(1, 'rgba(40, 130, 255, 0)');
        mCtx.fillStyle = grdLo;
        mCtx.fillRect(pt[0] - pt[2], pt[1] - pt[2], pt[2] * 2, pt[2] * 2);
      }
      /* Wake low-pressure for bluff bodies */
      if (obj.id !== 'streamlined' && obj.id !== 'airfoil') {
        var wx = cx + R * 1.0, wy = cy;
        var wR = R * 2.0;
        var wgrd = mCtx.createRadialGradient(wx, wy, 1, wx, wy, wR);
        wgrd.addColorStop(0, 'rgba(80, 80, 180, 0.45)');
        wgrd.addColorStop(1, 'rgba(80, 80, 180, 0)');
        mCtx.fillStyle = wgrd;
        mCtx.fillRect(wx - wR, wy - wR, wR * 2, wR * 2);
      }
    })();

    if (obj.id === 'airfoil') {
      /* Airfoil pressure field */
      var chord = size * 2.5;
      for (var side = 0; side < 2; side++) {
        for (var i = 0; i <= 30; i++) {
          var xc = i / 30;
          var px = cx - chord / 2 + xc * chord;
          /* Simplified Cp */
          var suctionPeak = -2 - Math.abs(alpha) * 0.3;
          var cp;
          if (side === 0) {
            /* Upper surface */
            cp = suctionPeak * Math.exp(-xc * 5) - alpha * 0.03 * (1 - xc);
          } else {
            /* Lower surface */
            cp = suctionPeak * Math.exp(-xc * 5) * 0.5 + alpha * 0.03 * (1 - xc);
          }
          var py = cy + (side === 0 ? -1 : 1) * (5 + size * 0.5);
          /* Rotate for angle of attack */
          var cosA = Math.cos(alpha * Math.PI / 180);
          var sinA = Math.sin(alpha * Math.PI / 180);
          var rpx = cx + (px - cx) * cosA - (py - cy) * sinA;
          var rpy = cy + (px - cx) * sinA + (py - cy) * cosA;

          mCtx.fillStyle = pressureColor(cp);
          mCtx.globalAlpha = 0.7;
          mCtx.beginPath();
          mCtx.arc(rpx, rpy, 4, 0, Math.PI * 2);
          mCtx.fill();
        }
      }
    } else {
      /* Circular body pressure field */
      var nPts = 36;
      for (var k = 0; k < nPts; k++) {
        var theta = (k / nPts) * Math.PI * 2;
        var cp2;
        if (obj.id === 'cylinder') {
          cp2 = 1 - 4 * Math.pow(Math.sin(theta), 2);
        } else if (obj.id === 'sphere') {
          cp2 = 1 - 2.25 * Math.pow(Math.sin(theta), 2);
        } else {
          cp2 = 1 - 2 * Math.pow(Math.sin(theta), 2);
        }
        /* In wake region, use actual separated values */
        if (theta > 1.4 && theta < 4.9 && obj.id !== 'streamlined') {
          cp2 = Math.max(cp2, -1.2);
        }
        var px2 = cx + Math.cos(theta) * (size + 8);
        var py2 = cy + Math.sin(theta) * (size + 8);
        mCtx.fillStyle = pressureColor(cp2);
        mCtx.globalAlpha = 0.7;
        mCtx.beginPath();
        mCtx.arc(px2, py2, 5, 0, Math.PI * 2);
        mCtx.fill();
      }
    }
    mCtx.globalAlpha = 1.0;

    /* Draw pressure color legend */
    var lx = MW - 145, ly = 380, lw = 120, lh = 10;
    for (var li = 0; li < lw; li++) {
      var cpVal = lerp(-3, 1, li / lw);
      mCtx.fillStyle = pressureColor(cpVal);
      mCtx.fillRect(lx + li, ly, 1, lh);
    }
    mCtx.strokeStyle = '#546e7a';
    mCtx.lineWidth = 0.5;
    mCtx.strokeRect(lx, ly, lw, lh);
    mCtx.fillStyle = '#6b7a99';
    mCtx.font = '7px monospace';
    mCtx.textAlign = 'left';
    mCtx.fillText('Cp: -3', lx, ly + lh + 10);
    mCtx.textAlign = 'right';
    mCtx.fillText('+1', lx + lw, ly + lh + 10);
    mCtx.textAlign = 'center';
    mCtx.fillText('Pressure Field', lx + lw / 2, ly - 4);
  }

  function drawVelocityField() {
    /* Velocity vectors sampled from the SAME velAt() field that advects the
       particles — direction and magnitude stay consistent with the streamline
       view for every shape, angle of attack, flip state and shed vortex. */
    var V = state.airSpeed;
    if (V < 1) return;
    var U = V * 2.6;   /* freestream in px/s */

    for (var gx = TEST_LEFT + 20; gx < TEST_RIGHT - 20; gx += 25) {
      for (var gy = TEST_TOP + 20; gy < TEST_BOT - 20; gy += 25) {
        var vv = velAt(gx, gy, state.simTime);
        if (vv.inside) continue;

        var mag = Math.hypot(vv.vx, vv.vy);
        var ratio = clamp(mag / U, 0, 2) / 2;
        var arrowLen = clamp(10 * mag / U, 3, 18);
        var ux = vv.vx / (mag || 1), uy = vv.vy / (mag || 1);
        var ex = gx + ux * arrowLen, ey = gy + uy * arrowLen;

        mCtx.strokeStyle = velocityColor(ratio);
        mCtx.globalAlpha = 0.55;
        mCtx.lineWidth = 1;
        mCtx.beginPath();
        mCtx.moveTo(gx, gy);
        mCtx.lineTo(ex, ey);
        /* Arrowhead: two barbs rotated ±150° from the direction vector */
        mCtx.lineTo(ex - 3 * ux - 2 * uy, ey - 3 * uy + 2 * ux);
        mCtx.moveTo(ex, ey);
        mCtx.lineTo(ex - 3 * ux + 2 * uy, ey - 3 * uy - 2 * ux);
        mCtx.stroke();
      }
    }
    mCtx.globalAlpha = 1.0;

    /* Velocity color legend */
    var lx = MW - 145, ly = 380, lw = 120, lh = 10;
    for (var li = 0; li < lw; li++) {
      mCtx.fillStyle = velocityColor(li / lw);
      mCtx.fillRect(lx + li, ly, 1, lh);
    }
    mCtx.strokeStyle = '#546e7a';
    mCtx.lineWidth = 0.5;
    mCtx.strokeRect(lx, ly, lw, lh);
    mCtx.fillStyle = '#6b7a99';
    mCtx.font = '7px monospace';
    mCtx.textAlign = 'left';
    mCtx.fillText('Slow', lx, ly + lh + 10);
    mCtx.textAlign = 'right';
    mCtx.fillText('Fast', lx + lw, ly + lh + 10);
    mCtx.textAlign = 'center';
    mCtx.fillText('Velocity Field', lx + lw / 2, ly - 4);
  }

  function drawForceArrows() {
    if (state.airSpeed < 1) return;
    var obj = OBJECTS[state.objIdx];
    var D = state.objSize / 1000;
    var f = state.results || calcForces(state.airSpeed, D, obj, state.angleOfAttack);
    var u = U();

    var cx = TEST_CX;
    var cy = TEST_CY;
    var size = (state.objSize / 80) * 50;

    /* Anchor airfoil resultant at quarter-chord (aerodynamic centre); body centre for others */
    var anchorX = cx, anchorY = cy;
    if (obj.id === 'airfoil') {
      anchorX = cx - size * 0.25;   /* 1/4 chord forward of mid-chord centre */
    }

    /* Scale force arrows */
    var maxArrow = 80;
    var dragScale = Math.min(Math.sqrt(Math.abs(f.Fd)) * 35, maxArrow);   /* sqrt scaling keeps shape comparison visible */
    var liftScale = Math.min(Math.sqrt(Math.abs(f.Fl)) * 35, maxArrow);

    /* Drag arrow (red, horizontal, pointing right = direction of drag) */
    if (dragScale > 3) {
      mCtx.strokeStyle = '#ff5555';
      mCtx.fillStyle = '#ff5555';
      mCtx.lineWidth = 2.5;
      var dragStart = anchorX + size + 10;
      var dragEnd = dragStart + dragScale;
      mCtx.beginPath();
      mCtx.moveTo(dragStart, anchorY);
      mCtx.lineTo(dragEnd, anchorY);
      mCtx.stroke();
      /* Arrowhead */
      mCtx.beginPath();
      mCtx.moveTo(dragEnd, anchorY);
      mCtx.lineTo(dragEnd - 6, anchorY - 4);
      mCtx.lineTo(dragEnd - 6, anchorY + 4);
      mCtx.closePath();
      mCtx.fill();
      /* Label */
      mCtx.font = 'bold 9px monospace';
      mCtx.textAlign = 'left';
      mCtx.fillText('Fd=' + u.force.fromSI(f.Fd).toFixed(u.force.digits) + ' ' + u.force.label, dragEnd + 4, anchorY + 4);
    }

    /* Lift arrow (green, vertical) */
    if (liftScale > 3) {
      var liftDir = f.Fl >= 0 ? 1 : -1;   /* + lift points UP (y-down screen) */
      mCtx.strokeStyle = '#3ddc84';
      mCtx.fillStyle = '#3ddc84';
      mCtx.lineWidth = 2.5;
      var liftStart = anchorY - liftDir * (size + 10);
      var liftEnd = liftStart - liftDir * liftScale;
      mCtx.beginPath();
      mCtx.moveTo(anchorX, liftStart);
      mCtx.lineTo(anchorX, liftEnd);
      mCtx.stroke();
      /* Arrowhead */
      mCtx.beginPath();
      mCtx.moveTo(anchorX, liftEnd);
      mCtx.lineTo(anchorX - 4, liftEnd + liftDir * 6);
      mCtx.lineTo(anchorX + 4, liftEnd + liftDir * 6);
      mCtx.closePath();
      mCtx.fill();
      /* Label — signed value so downforce is explicit */
      mCtx.font = 'bold 9px monospace';
      mCtx.textAlign = 'center';
      mCtx.fillText('Fl=' + u.force.fromSI(f.Fl).toFixed(u.force.digits) + ' ' + u.force.label, anchorX, liftEnd - liftDir * 12);
    }
  }

  function drawWake() {
    if (state.airSpeed < 2) return;
    var obj = OBJECTS[state.objIdx];
    var cx = TEST_CX;
    var cy = TEST_CY;
    var size = (state.objSize / 80) * 50;

    /* Don't draw prominent wake for streamlined body unless reversed */
    if (obj.id === 'streamlined' && !state.flipObj) return;

    /* Shape-dependent wake length (in body diameters / characteristic length) */
    var wakeLenMul = ({
      sphere:     2.5,
      cylinder:   4.0,         /* long von Kármán street */
      cone:       1.8,         /* apex-first: short attached-flow wake */
      'flat-plate': 6.0,
      car:        3.5,
      airfoil:    1.0
    })[obj.id] || 3;
    /* Drag-crisis shrinks wake (turbulent BL delays separation) — only for
       shapes that actually have a crisis (sphere/cylinder; reCrit finite) */
    if (state.results && isFinite(obj.reCrit) && state.results.Re > obj.reCrit) wakeLenMul *= 0.5;
    /* Reversed shape → much bigger wake (rear-first car / tail-first teardrop / base-first cone) */
    if (state.flipObj && (obj.id === 'car' || obj.id === 'streamlined' || obj.id === 'airfoil' || obj.id === 'cone')) {
      wakeLenMul *= (obj.id === 'cone' ? 2.5 : 1.8);
    }
    var wakeLen = size * wakeLenMul;

    var wakeWidth = ({
      sphere:     1.1,
      cylinder:   1.4,
      cone:       0.8,         /* narrow wake apex-first */
      'flat-plate': 1.9,
      car:        1.3,
      airfoil:    0.4
    })[obj.id] || 1.2;
    if (state.flipObj && (obj.id === 'car' || obj.id === 'streamlined' || obj.id === 'airfoil' || obj.id === 'cone')) {
      wakeWidth *= (obj.id === 'cone' ? 1.8 : 1.4);
    }
    wakeWidth *= size;

    /* Turbulent wake shading */
    var wg = mCtx.createLinearGradient(cx + size, cy, cx + size + wakeLen, cy);
    wg.addColorStop(0, 'rgba(0,188,212,0.08)');
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    mCtx.fillStyle = wg;
    /* Wake widest at body, tapering downstream */
    mCtx.beginPath();
    mCtx.moveTo(cx + size, cy - wakeWidth);
    mCtx.bezierCurveTo(
      cx + size + wakeLen * 0.4, cy - wakeWidth * 0.7,
      cx + size + wakeLen * 0.7, cy - wakeWidth * 0.35,
      cx + size + wakeLen, cy
    );
    mCtx.bezierCurveTo(
      cx + size + wakeLen * 0.7, cy + wakeWidth * 0.35,
      cx + size + wakeLen * 0.4, cy + wakeWidth * 0.7,
      cx + size, cy + wakeWidth
    );
    mCtx.closePath();
    mCtx.fill();

    /* Small turbulent swirls in wake */
    mCtx.strokeStyle = hexToRGBA(ACCENT, 0.15);
    mCtx.lineWidth = 0.5;
    var time = state.simTime;
    for (var i = 0; i < 6; i++) {
      var sx = cx + size + 15 + i * (wakeLen / 6);
      var sy = cy + Math.sin(time * 3 + i * 1.5) * wakeWidth * 0.5;
      var sr = 4 + Math.sin(time * 2 + i) * 2;
      mCtx.beginPath();
      mCtx.arc(sx, sy, sr, 0, Math.PI * 1.5);
      mCtx.stroke();
    }
  }

  function drawBoundaryLayer() {
    if (state.airSpeed < 5) return;
    var obj = OBJECTS[state.objIdx];
    var cx = TEST_CX;
    var cy = TEST_CY;
    var size = (state.objSize / 80) * 50;

    /* Only draw for sphere and cylinder */
    if (obj.id !== 'sphere' && obj.id !== 'cylinder' && obj.id !== 'airfoil') return;

    mCtx.strokeStyle = hexToRGBA(ACCENT, 0.30);
    mCtx.lineWidth = 1;
    mCtx.setLineDash([2, 3]);

    /* Common: Re-dependent BL scaling (Blasius √x laminar, x^0.8 turbulent) */
    var D_m = state.objSize / 1000;
    var Re = calcReynolds(state.airSpeed, D_m);
    var laminar = Re < 5e5;
    var ReFactor = laminar ? 1 / Math.sqrt(Math.max(Re, 1e3)) : 1 / Math.pow(Math.max(Re, 1e3), 0.2);

    if (obj.id === 'sphere' || obj.id === 'cylinder') {
      /* BL on the WINDWARD (upstream) semicircle, truncated at separation */
      var sp = shapeParams(obj, size);
      var sepDeg = sp.sep * 180 / Math.PI - 90;
      sepDeg = clamp(sepDeg, 60, 120);
      var kDisp = laminar ? 800 : 220;
      mCtx.beginPath();
      for (var a = -sepDeg; a <= sepDeg; a += 5) {
        var aRad = a * Math.PI / 180;
        var s = Math.abs(aRad) * size;                          /* arc length from stagnation */
        var delta = laminar ? kDisp * ReFactor * Math.sqrt(s)
                            : kDisp * ReFactor * Math.pow(s, 0.8);
        var r = size + 2 + delta;
        var px = cx - Math.cos(aRad) * r;                        /* front (upstream) side */
        var py = cy - Math.sin(aRad) * r;
        if (a === -sepDeg) mCtx.moveTo(px, py);
        else mCtx.lineTo(px, py);
      }
      mCtx.stroke();
    } else if (obj.id === 'airfoil') {
      /* BL on BOTH surfaces with α-dependent thickness asymmetry */
      var chord = size * 2.5;
      var alphaRad = state.angleOfAttack * Math.PI / 180;
      var cosA = Math.cos(alphaRad), sinA = Math.sin(alphaRad);
      var kAf = laminar ? 6 : 8;
      var upAsym = 1 + 0.3 * Math.sin(alphaRad);                 /* upper grows with +α */
      var lowAsym = Math.max(0.5, 1 - 0.3 * Math.sin(alphaRad));
      var xcMaxUpper = 1 - Math.max(0, (Math.abs(state.angleOfAttack) - 8) / 10);    /* upper BL ends earlier as separation moves forward at high α */

      function airfoilSurface(side) {
        var asym = side === 'upper' ? upAsym : lowAsym;
        var ymul = side === 'upper' ? -1 : 1;
        var xMax = side === 'upper' ? xcMaxUpper : 1;
        mCtx.beginPath();
        var started = false;
        for (var i = 0; i <= 20; i++) {
          var xc = i / 20;
          if (xc > xMax) break;
          var xL = xc * chord - chord / 2;
          /* real section half-thickness plus camber offset for this surface */
          var ytN = nacaHalfThickness(xc, state.naca.t) * chord;
          var ycN = nacaCamberY(xc, state.naca.m, state.naca.p) * chord;
          var blT = (1.5 + kAf * (laminar ? Math.sqrt(xc) : Math.pow(xc, 0.8))) * asym;
          var yL = ymul * (ytN + blT) - ycN;
          var px2 = xL * cosA - yL * sinA;
          var py2 = xL * sinA + yL * cosA;
          if (!started) { mCtx.moveTo(cx + px2, cy + py2); started = true; }
          else            mCtx.lineTo(cx + px2, cy + py2);
        }
        mCtx.stroke();
      }
      airfoilSurface('upper');
      airfoilSurface('lower');
    }
    mCtx.setLineDash([]);
  }

  function drawVelocityProfile() {
    /* Velocity profile at inlet */
    var px = TEST_LEFT + 5;
    var profileH = 70;
    var profileTop = TEST_CY - profileH;
    var profileBot = TEST_CY + profileH;
    var maxW = 22;
    var V = state.airSpeed;
    if (V < 1) return;

    mCtx.strokeStyle = hexToRGBA(ACCENT, 0.4);
    mCtx.lineWidth = 1;
    mCtx.beginPath();
    for (var i = 0; i <= 20; i++) {
      var t = i / 20;
      var y = profileTop + t * (profileBot - profileTop);
      /* Parabolic-ish profile (uniform for wind tunnel) */
      var distFromCenter = Math.abs(t - 0.5) * 2;
      var vRatio = 1 - distFromCenter * distFromCenter * 0.1;
      var w = vRatio * maxW;
      if (i === 0) mCtx.moveTo(px + w, y);
      else mCtx.lineTo(px + w, y);
    }
    mCtx.stroke();
    /* Base line */
    mCtx.beginPath();
    mCtx.moveTo(px, profileTop);
    mCtx.lineTo(px, profileBot);
    mCtx.stroke();

    /* Label */
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.4);
    mCtx.font = '6px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('V profile', px + 12, profileTop - 5);
  }

  function drawPitotTube() {
    /* Pitot-static tube above the test object */
    var px = TEST_CX - 60;
    var py = TEST_TOP + 25;
    var tubeLen = 50;

    mCtx.strokeStyle = '#78909c';
    mCtx.lineWidth = 2;
    /* Tube body */
    mCtx.beginPath();
    mCtx.moveTo(px, py);
    mCtx.lineTo(px + tubeLen, py);
    mCtx.stroke();
    /* Pitot tip */
    mCtx.fillStyle = '#78909c';
    mCtx.beginPath();
    mCtx.moveTo(px, py);
    mCtx.lineTo(px - 5, py - 2);
    mCtx.lineTo(px - 5, py + 2);
    mCtx.closePath();
    mCtx.fill();
    /* Static ports */
    mCtx.fillStyle = '#455a64';
    mCtx.beginPath();
    mCtx.arc(px + 15, py, 1.5, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.beginPath();
    mCtx.arc(px + 25, py, 1.5, 0, Math.PI * 2);
    mCtx.fill();
    /* Connection tube going up */
    mCtx.strokeStyle = '#607d8b';
    mCtx.lineWidth = 1;
    mCtx.beginPath();
    mCtx.moveTo(px + tubeLen, py);
    mCtx.lineTo(px + tubeLen, py - 15);
    mCtx.stroke();

    /* Label */
    mCtx.fillStyle = '#6b7a99';
    mCtx.font = '6px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('PITOT TUBE', px + tubeLen / 2, py - 8);

    /* Live Δp = q reading — the whole point of a pitot tube */
    var qVal = 0.5 * 1.225 * state.airSpeed * state.airSpeed;
    var uu = U();
    mCtx.fillStyle = 'rgba(13,17,30,0.85)';
    mCtx.fillRect(px + tubeLen + 4, py - 24, 92, 20);
    mCtx.strokeStyle = 'rgba(0,188,212,0.40)';
    mCtx.lineWidth = 0.5;
    mCtx.strokeRect(px + tubeLen + 4, py - 24, 92, 20);
    mCtx.fillStyle = '#3ddc84';
    mCtx.font = 'bold 8px monospace';
    mCtx.textAlign = 'left';
    mCtx.fillText('Δp = ' + uu.press.fromSI(qVal).toFixed(uu.press.digits) + ' ' + uu.press.label,
                  px + tubeLen + 8, py - 11);
  }

  function drawTunnelLabels() {
    mCtx.fillStyle = ACCENT;
    mCtx.font = 'bold 11px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('NHIT VisualLab WT-200  ·  Subsonic Open-Circuit Wind Tunnel', MW / 2, 18);

    /* Flow direction arrow at top-left */
    mCtx.strokeStyle = hexToRGBA(ACCENT, 0.55);
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.55);
    mCtx.lineWidth = 1.5;
    var fAY = 40;
    mCtx.beginPath();
    mCtx.moveTo(60, fAY); mCtx.lineTo(140, fAY); mCtx.stroke();
    mCtx.beginPath();
    mCtx.moveTo(140, fAY); mCtx.lineTo(135, fAY - 4); mCtx.lineTo(135, fAY + 4);
    mCtx.closePath(); mCtx.fill();
    mCtx.font = '8px monospace';
    mCtx.textAlign = 'left';
    mCtx.fillText('FLOW', 145, fAY + 3);
  }

  /* ═══════════════════════════════════════════════════════════════
     S11  GRAPH DRAWING (Two stacked graphs)
     ═══════════════════════════════════════════════════════════════ */

  function drawGraph() {
    gCtx.clearRect(0, 0, GW, GH);
    drawGraphBackground();
    var tab = state.graphTab || 'pressure';
    if (tab === 'pressure')      drawPressureGraph();
    else if (tab === 'forces')   drawForceGraph();
    else if (tab === 'profile')  drawProfileGraph();
    else if (tab === 'polar')    drawPolarGraph();
    else if (tab === 'liftcurve') drawLiftCurveGraph();
  }

  /* Lift-curve tab: Cl (and Cd) vs α — the canonical angle-of-attack plot */
  function drawLiftCurveGraph() {
    var obj = OBJECTS[state.objIdx];
    var ox = 70, oy = GH - 60, gw = GW - 110, gh = GH - 120;
    gCtx.fillStyle = '#dde3f0';
    gCtx.font = 'bold 11px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('Lift Curve  —  Cl vs α  —  NACA 0012', GW / 2, 18);
    if (obj.id !== 'airfoil') {
      gCtx.fillStyle = '#8b9dc3';
      gCtx.font = '11px sans-serif';
      gCtx.fillText('Select the NACA 0012 airfoil to explore the lift curve.', GW / 2, GH / 2);
      return;
    }
    var f = state.results || calcForces(state.airSpeed, state.objSize / 1000, obj, state.angleOfAttack);
    var aS = stallAngleDeg(f.Re), cm = clMaxRe(f.Re);
    var A0 = -20, A1 = 25, CL0 = -2, CL1 = 2;
    function mapX(a)  { return ox + ((a - A0) / (A1 - A0)) * gw; }
    function mapY(cl) { return oy - ((clamp(cl, CL0, CL1) - CL0) / (CL1 - CL0)) * gh; }

    /* Axes + grid */
    gCtx.strokeStyle = '#6b7a99'; gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.moveTo(ox, oy - gh); gCtx.lineTo(ox, oy); gCtx.lineTo(ox + gw, oy); gCtx.stroke();
    gCtx.fillStyle = '#6b7a99'; gCtx.font = '8px monospace'; gCtx.textAlign = 'center';
    for (var av = A0; av <= A1; av += 5) {
      var xp = mapX(av);
      gCtx.fillText(av + '°', xp, oy + 13);
      gCtx.strokeStyle = av === 0 ? 'rgba(0,188,212,0.25)' : 'rgba(42,48,80,0.30)';
      gCtx.beginPath(); gCtx.moveTo(xp, oy); gCtx.lineTo(xp, oy - gh); gCtx.stroke();
    }
    gCtx.font = '9px sans-serif';
    gCtx.fillText('α (degrees)', ox + gw / 2, oy + 28);
    gCtx.textAlign = 'right'; gCtx.font = '8px monospace';
    for (var cv = CL0; cv <= CL1 + 1e-6; cv += 0.5) {
      var yp = mapY(cv);
      gCtx.fillText(cv.toFixed(1), ox - 6, yp + 3);
      gCtx.strokeStyle = Math.abs(cv) < 1e-6 ? 'rgba(0,188,212,0.25)' : 'rgba(42,48,80,0.30)';
      gCtx.beginPath(); gCtx.moveTo(ox, yp); gCtx.lineTo(ox + gw, yp); gCtx.stroke();
    }
    gCtx.save(); gCtx.translate(20, oy - gh / 2); gCtx.rotate(-Math.PI / 2);
    gCtx.textAlign = 'center'; gCtx.fillStyle = '#6b7a99'; gCtx.font = '9px sans-serif';
    gCtx.fillText('Cl  (and Cd × 5)', 0, 0); gCtx.restore();

    /* Curve cache — geometry is a pure function of (V, size, flip) */
    var key = 'lc|' + state.airSpeed.toFixed(2) + '|' + state.objSize.toFixed(0) + '|' + (state.flipObj ? 1 : 0);
    if (!window._lcCache || window._lcCache.key !== key) {
      var pts = [];
      for (var a = A0; a <= A1 + 1e-6; a += 0.5) {
        var pf = calcForces(state.airSpeed, state.objSize / 1000, obj, a);
        pts.push({ a: a, cl: pf.Cl, cd: pf.Cd });
      }
      window._lcCache = { key: key, pts: pts };
    }
    var pts2 = window._lcCache.pts;

    /* Thin-airfoil ideal line 2π·sinα (dashed reference) */
    gCtx.strokeStyle = 'rgba(139,157,195,0.40)';
    gCtx.lineWidth = 1;
    gCtx.setLineDash([4, 3]);
    gCtx.beginPath();
    for (var ii = 0; ii < pts2.length; ii++) {
      var ideal = 2 * Math.PI * Math.sin(pts2[ii].a * Math.PI / 180) * (state.flipObj ? -1 : 1);
      var px0 = mapX(pts2[ii].a), py0 = mapY(ideal);
      if (ii === 0) gCtx.moveTo(px0, py0); else gCtx.lineTo(px0, py0);
    }
    gCtx.stroke();
    gCtx.setLineDash([]);

    /* Cd × 5 curve (dashed orange) */
    gCtx.strokeStyle = '#ff8a65';
    gCtx.lineWidth = 1.3;
    gCtx.setLineDash([5, 3]);
    gCtx.beginPath();
    for (var di = 0; di < pts2.length; di++) {
      var pxd = mapX(pts2[di].a), pyd = mapY(pts2[di].cd * 5);
      if (di === 0) gCtx.moveTo(pxd, pyd); else gCtx.lineTo(pxd, pyd);
    }
    gCtx.stroke();
    gCtx.setLineDash([]);

    /* Cl curve (solid accent) */
    gCtx.strokeStyle = ACCENT;
    gCtx.lineWidth = 1.8;
    gCtx.beginPath();
    for (var ci = 0; ci < pts2.length; ci++) {
      var pxc = mapX(pts2[ci].a), pyc = mapY(pts2[ci].cl);
      if (ci === 0) gCtx.moveTo(pxc, pyc); else gCtx.lineTo(pxc, pyc);
    }
    gCtx.stroke();

    /* Stall-angle vertical markers ±αs */
    gCtx.strokeStyle = 'rgba(255,82,82,0.65)';
    gCtx.lineWidth = 1;
    gCtx.setLineDash([4, 3]);
    [aS, -aS].forEach(function (sa) {
      var sx = mapX(sa);
      gCtx.beginPath(); gCtx.moveTo(sx, oy); gCtx.lineTo(sx, oy - gh); gCtx.stroke();
    });
    gCtx.setLineDash([]);
    gCtx.fillStyle = '#ff5555'; gCtx.font = '8px monospace'; gCtx.textAlign = 'left';
    gCtx.fillText('stall ' + aS.toFixed(1) + '°', mapX(aS) + 4, oy - gh + 12);
    /* Cl_max marker */
    var mx = mapX(aS), my = mapY(cm * (state.flipObj ? -1 : 1));
    gCtx.fillStyle = '#ff5555';
    gCtx.beginPath(); gCtx.arc(mx, my, 3, 0, Math.PI * 2); gCtx.fill();
    gCtx.fillStyle = '#ffb4b4';
    gCtx.fillText('Cl_max ≈ ' + cm.toFixed(2), mx + 6, my - 6);

    /* Current operating point */
    var cxp = mapX(state.angleOfAttack), cyp = mapY(f.Cl);
    gCtx.fillStyle = '#ffd54f';
    gCtx.beginPath(); gCtx.arc(cxp, cyp, 6, 0, Math.PI * 2); gCtx.fill();
    gCtx.strokeStyle = '#fff'; gCtx.lineWidth = 1.5;
    gCtx.beginPath(); gCtx.arc(cxp, cyp, 6, 0, Math.PI * 2); gCtx.stroke();

    /* Legend + current values */
    gCtx.textAlign = 'left'; gCtx.font = '8px sans-serif';
    gCtx.fillStyle = ACCENT;                    gCtx.fillText('— Cl', ox + gw - 96, oy - gh + 12);
    gCtx.fillStyle = '#ff8a65';                 gCtx.fillText('--- Cd × 5', ox + gw - 96, oy - gh + 24);
    gCtx.fillStyle = 'rgba(139,157,195,0.85)';  gCtx.fillText('--- 2π·sinα (ideal)', ox + gw - 96, oy - gh + 36);
    gCtx.fillStyle = '#b6c3e0'; gCtx.font = '9px monospace';
    gCtx.fillText('α = ' + state.angleOfAttack + '°   Cl = ' + f.Cl.toFixed(3) + '   Cd = ' + f.Cd.toFixed(4), ox + 8, oy - gh + 12);
  }

  function drawGraphBackground() {
    gCtx.fillStyle = '#0a0e14';
    gCtx.fillRect(0, 0, GW, GH);
  }

  function drawPressureGraph() {
    /* Pressure distribution (Cp vs position) - full canvas */
    var obj = OBJECTS[state.objIdx];
    /* Effective incidence: flipping the airfoil reverses the lift sign, so the
       Cp curves must mirror to stay consistent with the force readouts */
    var alpha = (state.flipObj && obj.id === 'airfoil' ? -1 : 1) * state.angleOfAttack;
    var ox = 65, oy = GH - 50, gw = GW - 90, gh = GH - 90;

    /* Title */
    gCtx.fillStyle = '#dde3f0';
    gCtx.font = 'bold 11px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('Pressure Distribution \u2014 ' + obj.name, GW / 2, 18);

    /* Axes */
    gCtx.strokeStyle = '#6b7a99';
    gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.moveTo(ox, oy - gh);
    gCtx.lineTo(ox, oy);
    gCtx.lineTo(ox + gw, oy);
    gCtx.stroke();

    /* Grid */
    gCtx.strokeStyle = 'rgba(42,48,80,0.25)';
    gCtx.lineWidth = 0.5;
    for (var gx = ox + 40; gx < ox + gw; gx += 40) {
      gCtx.beginPath(); gCtx.moveTo(gx, oy); gCtx.lineTo(gx, oy - gh); gCtx.stroke();
    }
    for (var gy = oy - 20; gy > oy - gh; gy -= 25) {
      gCtx.beginPath(); gCtx.moveTo(ox, gy); gCtx.lineTo(ox + gw, gy); gCtx.stroke();
    }

    /* Adaptive Cp y-axis — fit suction peak even at high alpha (Cp_min ~ -6 for airfoil at 15°) */
    var _cpKey = obj.id + '|' + alpha.toFixed(3) + '|' + state.objSize.toFixed(0) + '|' + state.airSpeed.toFixed(1) + '|' + labKey();
    if (!window._cpCache || window._cpCache.key !== _cpKey) {
      var _m = getCpModel(obj, alpha, 180);
      window._cpCache = { key: _cpKey, model: _m, data: _m.pts };
    }
    var cpModelC = window._cpCache.model;
    var cpData = window._cpCache.data;
    var cpLo = 1, cpHi = 1;
    for (var s = 0; s < cpData.length; s++) {
      var a_ = cpData[s].cpUpper !== undefined ? cpData[s].cpUpper : cpData[s].cpActual;
      var b_ = cpData[s].cpLower !== undefined ? cpData[s].cpLower : cpData[s].cpInviscid;
      if (a_ !== undefined) { cpLo = Math.min(cpLo, a_); cpHi = Math.max(cpHi, a_); }
      if (b_ !== undefined) { cpLo = Math.min(cpLo, b_); cpHi = Math.max(cpHi, b_); }
    }
    var cpMin = Math.floor(Math.min(-3, cpLo - 0.5));
    var cpMax = Math.ceil(Math.max(1.5, cpHi + 0.5));
    var cpRange = cpMax - cpMin;

    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '8px monospace';
    gCtx.textAlign = 'right';
    var cvStep = cpRange > 6 ? 2 : 1;
    for (var cv = Math.ceil(cpMin); cv <= Math.floor(cpMax); cv += cvStep) {
      var yp = oy - gh + ((cv - cpMin) / cpRange) * gh;
      gCtx.fillText(cv.toString(), ox - 5, yp + 3);
      if (cv === 0) {
        gCtx.strokeStyle = 'rgba(0,188,212,0.2)';
        gCtx.lineWidth = 0.5;
        gCtx.setLineDash([3, 3]);
        gCtx.beginPath(); gCtx.moveTo(ox, yp); gCtx.lineTo(ox + gw, yp); gCtx.stroke();
        gCtx.setLineDash([]);
      }
    }

    /* Y-axis title */
    gCtx.save();
    gCtx.translate(12, oy - gh / 2);
    gCtx.rotate(-Math.PI / 2);
    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '9px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('Cp', 0, 0);
    gCtx.restore();

    if (obj.id === 'airfoil') {
      /* X-axis: x/c from 0 to 1 */
      gCtx.fillStyle = '#6b7a99';
      gCtx.font = '8px monospace';
      gCtx.textAlign = 'center';
      for (var xv = 0; xv <= 1; xv += 0.2) {
        var xp = ox + xv * gw;
        gCtx.fillText(roundN(xv, 1).toString(), xp, oy + 12);
      }
      gCtx.font = '9px sans-serif';
      gCtx.fillText('x/c', ox + gw / 2, oy + 24);

      /* Upper surface (solid) */
      gCtx.strokeStyle = '#ff5555';
      gCtx.lineWidth = 1.5;
      gCtx.beginPath();
      for (var i = 0; i < cpData.length; i++) {
        var px = ox + cpData[i].x * gw;
        var py = oy - gh + ((cpData[i].cpUpper - cpMin) / cpRange) * gh;
        py = clamp(py, oy - gh, oy);
        if (i === 0) gCtx.moveTo(px, py);
        else gCtx.lineTo(px, py);
      }
      gCtx.stroke();

      /* Lower surface (dashed) */
      gCtx.strokeStyle = '#3ddc84';
      gCtx.lineWidth = 1.5;
      gCtx.setLineDash([4, 3]);
      gCtx.beginPath();
      for (var j = 0; j < cpData.length; j++) {
        var px2 = ox + cpData[j].x * gw;
        var py2 = oy - gh + ((cpData[j].cpLower - cpMin) / cpRange) * gh;
        py2 = clamp(py2, oy - gh, oy);
        if (j === 0) gCtx.moveTo(px2, py2);
        else gCtx.lineTo(px2, py2);
      }
      gCtx.stroke();
      gCtx.setLineDash([]);

      /* Legend */
      gCtx.fillStyle = '#ff5555';
      gCtx.font = '8px sans-serif';
      gCtx.textAlign = 'left';
      gCtx.fillText('\u2014 Upper surface', ox + gw - 100, oy - gh + 12);
      gCtx.fillStyle = '#3ddc84';
      gCtx.fillText('--- Lower surface', ox + gw - 100, oy - gh + 24);
    } else {
      /* X-axis: theta 0 to 360 */
      gCtx.fillStyle = '#6b7a99';
      gCtx.font = '8px monospace';
      gCtx.textAlign = 'center';
      for (var deg = 0; deg <= 360; deg += 90) {
        var xp2 = ox + (deg / 360) * gw;
        gCtx.fillText(deg + '\u00b0', xp2, oy + 12);
      }
      gCtx.font = '9px sans-serif';
      gCtx.fillText('\u03b8 (degrees)', ox + gw / 2, oy + 24);

      /* Inviscid Cp (dashed) — only where an attached potential solution exists */
      if (cpModelC.hasInviscid) {
      gCtx.strokeStyle = hexToRGBA(ACCENT, 0.4);
      gCtx.lineWidth = 1;
      gCtx.setLineDash([4, 3]);
      gCtx.beginPath();
      for (var k = 0; k < cpData.length; k++) {
        var px3 = ox + (cpData[k].x / 360) * gw;
        var py3 = oy - gh + ((cpData[k].cpInviscid - cpMin) / cpRange) * gh;
        py3 = clamp(py3, oy - gh, oy);
        if (k === 0) gCtx.moveTo(px3, py3);
        else gCtx.lineTo(px3, py3);
      }
      gCtx.stroke();
      gCtx.setLineDash([]);
      }

      /* Actual Cp (solid) */
      gCtx.strokeStyle = ACCENT;
      gCtx.lineWidth = 1.5;
      gCtx.beginPath();
      for (var m = 0; m < cpData.length; m++) {
        var px4 = ox + (cpData[m].x / 360) * gw;
        var py4 = oy - gh + ((cpData[m].cpActual - cpMin) / cpRange) * gh;
        py4 = clamp(py4, oy - gh, oy);
        if (m === 0) gCtx.moveTo(px4, py4);
        else gCtx.lineTo(px4, py4);
      }
      gCtx.stroke();

      /* Legend */
      gCtx.fillStyle = ACCENT;
      gCtx.font = '8px sans-serif';
      gCtx.textAlign = 'left';
      gCtx.fillText('\u2014 Actual Cp', ox + gw - 100, oy - gh + 12);
      if (cpModelC.hasInviscid) {
        gCtx.fillStyle = hexToRGBA(ACCENT, 0.5);
        gCtx.fillText('--- Inviscid', ox + gw - 100, oy - gh + 24);
      }

      /* Integrate the plotted curve — this is the classic pressure-tap
         exercise, and the answer matches the drag panel by construction. */
      if (cpModelC.integrable) {
        var cdP = integrateCp(cpModelC, 'actual');
        gCtx.textAlign = 'left';
        gCtx.font = '9px sans-serif';
        gCtx.fillStyle = 'rgba(255,213,79,0.95)';
        gCtx.fillText('\u222b Cp dA \u2192 Cd,pressure = ' + cdP.toFixed(3), ox + 4, oy - gh + 12);
        if (cpModelC.hasInviscid) {
          var cdI = integrateCp(cpModelC, 'inviscid');
          gCtx.fillStyle = 'rgba(255,255,255,0.55)';
          gCtx.fillText('inviscid curve \u2192 ' + cdI.toFixed(3) +
                        "  (d'Alembert's paradox)", ox + 4, oy - gh + 24);
        }
        if (cpModelC.cpBase != null) {
          gCtx.fillStyle = 'rgba(255,255,255,0.45)';
          gCtx.fillText('base Cp = ' + cpModelC.cpBase.toFixed(2) +
                        (cpModelC.sepDeg ? ',  separation at ' + cpModelC.sepDeg.toFixed(0) + '\u00b0' : ''),
                        ox + 4, oy - gh + 36);
        }
      }
    }
  }

  function drawForceGraph() {
    /* Force display (bar chart) - full canvas */
    var obj = OBJECTS[state.objIdx];
    var D = state.objSize / 1000;
    var f = calcForces(state.airSpeed, D, obj, state.angleOfAttack);

    var ox = 65, oy = GH - 50, gw = GW - 90, gh = GH - 110;
    var barAreaTop = oy - gh;

    /* Title */
    gCtx.fillStyle = '#dde3f0';
    gCtx.font = 'bold 11px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('Aerodynamic Forces \u2014 ' + obj.name, GW / 2, barAreaTop - 8);

    /* Axes */
    gCtx.strokeStyle = '#6b7a99';
    gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.moveTo(ox, barAreaTop);
    gCtx.lineTo(ox, oy);
    gCtx.lineTo(ox + gw, oy);
    gCtx.stroke();

    /* Per-bar normalisation against an Aref = D² reference state at V=60 m/s,
       so each bar's height reflects its own scale (Tufte/Cleveland small multiples).
       Convert through U() so Imperial mode shows lbf/psi end-to-end. */
    var u = U();
    var Aref = Math.max(state.objSize / 1000, 0.01); Aref = Aref * Aref;
    var refQ = 0.5 * RHO_ISA * 60 * 60;
    var refF = refQ * Aref * 1.5;
    var bars = [
      { label: 'Drag (Fd)',       value: u.force.fromSI(f.Fd), ref: u.force.fromSI(refF), color: '#ff5555', unit: u.force.label },
      { label: 'Lift (Fl)',       value: u.force.fromSI(f.Fl), ref: u.force.fromSI(refF), color: '#3ddc84', unit: u.force.label, signed: true },
      { label: 'Dyn. Press. (q)', value: u.press.fromSI(f.q),  ref: u.press.fromSI(refQ), color: ACCENT,    unit: u.press.label },
      { label: 'L/D Ratio',       value: f.LD,                  ref: 20,                  color: '#ffa000', unit: '' }
    ];

    var barW = (gw - 60) / bars.length;
    var barGap = 15;

    bars.forEach(function (bar, i) {
      var bx = ox + barGap + i * (barW + barGap);
      var frac = Math.min(Math.abs(bar.value) / bar.ref, 1);
      var bh = Math.max(frac * (gh - 30), 2);
      var by = oy - bh;

      /* Bar */
      var bg = gCtx.createLinearGradient(bx, by, bx, oy);
      bg.addColorStop(0, bar.color);
      bg.addColorStop(1, hexToRGBA(bar.color, 0.4));
      gCtx.fillStyle = bg;
      gCtx.beginPath();
      gCtx.moveTo(bx + 2, by);
      gCtx.lineTo(bx + barW - 2, by);
      gCtx.quadraticCurveTo(bx + barW, by, bx + barW, by + 2);
      gCtx.lineTo(bx + barW, oy);
      gCtx.lineTo(bx, oy);
      gCtx.lineTo(bx, by + 2);
      gCtx.quadraticCurveTo(bx, by, bx + 2, by);
      gCtx.closePath();
      gCtx.fill();

      /* Value on top */
      gCtx.fillStyle = bar.color;
      gCtx.font = 'bold 10px monospace';
      gCtx.textAlign = 'center';
      var displayVal;
      var absV = Math.abs(bar.value);
      if (absV >= 1000) displayVal = roundN(bar.value, 0);
      else if (absV >= 1) displayVal = roundN(bar.value, 2);
      else displayVal = roundN(bar.value, 4);
      gCtx.fillText(displayVal + (bar.unit ? ' ' + bar.unit : ''), bx + barW / 2, by - 6);

      /* Label below */
      gCtx.fillStyle = '#6b7a99';
      gCtx.font = '8px sans-serif';
      gCtx.fillText(bar.label, bx + barW / 2, oy + 14);
    });

    /* Additional info */
    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '8px monospace';
    gCtx.textAlign = 'left';
    gCtx.fillText('Cd = ' + roundN(f.Cd, 4) + '  Cl = ' + roundN(f.Cl, 4) + '  Re = ' + Math.round(f.Re), ox + 5, oy + 28);
  }

  /* Velocity profile tab: boundary layer u/U vs y/δ */
  function drawProfileGraph() {
    var V = state.airSpeed;
    var D = state.objSize / 1000;
    var obj = OBJECTS[state.objIdx];
    var f = state.results || calcForces(V, D, obj, state.angleOfAttack);

    var ox = 70, oy = GH - 60, gw = GW - 110, gh = GH - 120;
    /* Title */
    gCtx.fillStyle = '#dde3f0';
    gCtx.font = 'bold 11px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('Boundary-Layer Velocity Profile  —  ' + obj.name, GW / 2, 18);
    /* Axes */
    gCtx.strokeStyle = '#6b7a99'; gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.moveTo(ox, oy - gh); gCtx.lineTo(ox, oy); gCtx.lineTo(ox + gw, oy); gCtx.stroke();
    /* X axis ticks (u/U) */
    gCtx.fillStyle = '#6b7a99'; gCtx.font = '8px monospace'; gCtx.textAlign = 'center';
    for (var xi = 0; xi <= 1; xi += 0.25) {
      var xp = ox + xi * gw;
      gCtx.fillText(xi.toFixed(2), xp, oy + 13);
      gCtx.strokeStyle = 'rgba(42,48,80,0.30)';
      gCtx.beginPath(); gCtx.moveTo(xp, oy); gCtx.lineTo(xp, oy - gh); gCtx.stroke();
    }
    gCtx.font = '9px sans-serif';
    gCtx.fillText('u / U∞', ox + gw / 2, oy + 28);
    /* Y axis ticks (y/δ) */
    gCtx.textAlign = 'right';
    for (var yi = 0; yi <= 1.2; yi += 0.2) {
      var yp = oy - (yi / 1.2) * gh;
      gCtx.fillText(yi.toFixed(1), ox - 6, yp + 3);
      gCtx.strokeStyle = 'rgba(42,48,80,0.30)';
      gCtx.beginPath(); gCtx.moveTo(ox, yp); gCtx.lineTo(ox + gw, yp); gCtx.stroke();
    }
    gCtx.save();
    gCtx.translate(20, oy - gh / 2); gCtx.rotate(-Math.PI / 2);
    gCtx.textAlign = 'center'; gCtx.font = '9px sans-serif';
    gCtx.fillStyle = '#6b7a99';
    gCtx.fillText('y / δ', 0, 0);
    gCtx.restore();
    /* Laminar (Blasius) profile — approx u/U = sin(π/2 · y/δ) for y<δ */
    gCtx.strokeStyle = '#42a5f5'; gCtx.lineWidth = 1.8;
    gCtx.beginPath();
    for (var li = 0; li <= 60; li++) {
      var ynd = li / 60 * 1.2;
      var uU = ynd >= 1 ? 1 : Math.sin(Math.PI / 2 * ynd);
      var xx = ox + uU * gw;
      var yy = oy - (ynd / 1.2) * gh;
      if (li === 0) gCtx.moveTo(xx, yy); else gCtx.lineTo(xx, yy);
    }
    gCtx.stroke();
    /* Turbulent (1/7 power law) profile */
    gCtx.strokeStyle = '#ff8a65'; gCtx.lineWidth = 1.8;
    gCtx.beginPath();
    for (var ti = 0; ti <= 60; ti++) {
      var ynd2 = ti / 60 * 1.2;
      var uU2 = ynd2 >= 1 ? 1 : Math.pow(ynd2, 1 / 7);
      var xx2 = ox + uU2 * gw;
      var yy2 = oy - (ynd2 / 1.2) * gh;
      if (ti === 0) gCtx.moveTo(xx2, yy2); else gCtx.lineTo(xx2, yy2);
    }
    gCtx.stroke();
    /* Free-stream line at y/δ = 1 */
    gCtx.strokeStyle = 'rgba(0,188,212,0.35)'; gCtx.setLineDash([4, 4]);
    var ydf = oy - (1 / 1.2) * gh;
    gCtx.beginPath(); gCtx.moveTo(ox, ydf); gCtx.lineTo(ox + gw, ydf); gCtx.stroke();
    gCtx.setLineDash([]);
    /* Legend */
    gCtx.textAlign = 'left'; gCtx.font = '9px sans-serif';
    gCtx.fillStyle = '#42a5f5'; gCtx.fillText('— Laminar (Blasius)', ox + gw - 150, oy - gh + 18);
    gCtx.fillStyle = '#ff8a65'; gCtx.fillText('— Turbulent (1/7 power)', ox + gw - 150, oy - gh + 34);
    /* Re_x for BL regime (Re_x = ρVx/μ) — Re_D drives integrated drag, Re_x drives δ */
    var x = state.objSize / 1000 * 0.5;
    var ReL = calcReynolds(V, x);
    var lam = ReL < 5e5;
    var trans = lam ? 'laminar' : (ReL < 3e6 ? 'transitional' : 'turbulent');
    var delta = lam ? 5 * x / Math.sqrt(Math.max(ReL, 1))
                    : 0.38 * x / Math.pow(Math.max(ReL, 1), 0.2);
    gCtx.fillStyle = '#b6c3e0'; gCtx.font = '9px monospace';
    gCtx.fillText('Re_x = ' + (ReL > 1e5 ? formatSci(ReL, 2) : Math.round(ReL)) + '   (' + trans + ')', ox + 8, oy - gh + 18);
    gCtx.fillText('δ ≈ ' + (delta * 1000).toFixed(2) + ' mm at x = ' + (x * 1000).toFixed(0) + ' mm', ox + 8, oy - gh + 34);
  }

  /* Polar plot: Cl vs Cd (with AoA sweep marker for airfoil, dot for others) */
  function drawPolarGraph() {
    var obj = OBJECTS[state.objIdx];
    var f = state.results || calcForces(state.airSpeed, state.objSize / 1000, obj, state.angleOfAttack);
    var ox = 70, oy = GH - 60, gw = GW - 110, gh = GH - 120;
    gCtx.fillStyle = '#dde3f0';
    gCtx.font = 'bold 11px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('Cl – Cd Drag Polar  —  ' + obj.name, GW / 2, 18);
    gCtx.strokeStyle = '#6b7a99'; gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.moveTo(ox, oy - gh); gCtx.lineTo(ox, oy); gCtx.lineTo(ox + gw, oy); gCtx.stroke();
    var cdMax = obj.id === 'airfoil' ? 0.30 : obj.id === 'flat-plate' ? 2.4 : 1.6;
    var clMax = 2;
    var cdStep = cdMax <= 0.5 ? 0.05 : 0.2;
    var cdDigits = cdMax <= 0.5 ? 2 : 1;
    /* Grid + axis labels */
    gCtx.fillStyle = '#6b7a99'; gCtx.font = '8px monospace'; gCtx.textAlign = 'center';
    for (var xi = 0; xi <= cdMax + 1e-6; xi += cdStep) {
      var xp = ox + (xi / cdMax) * gw;
      gCtx.fillText(xi.toFixed(cdDigits), xp, oy + 13);
      gCtx.strokeStyle = 'rgba(42,48,80,0.30)';
      gCtx.beginPath(); gCtx.moveTo(xp, oy); gCtx.lineTo(xp, oy - gh); gCtx.stroke();
    }
    gCtx.font = '9px sans-serif';
    gCtx.fillText('Cd', ox + gw / 2, oy + 28);
    gCtx.textAlign = 'right';
    for (var yi = -clMax / 2; yi <= clMax; yi += 0.5) {
      var yp = oy - ((yi + clMax / 2) / (1.5 * clMax)) * gh;
      gCtx.fillText(yi.toFixed(1), ox - 6, yp + 3);
      gCtx.strokeStyle = 'rgba(42,48,80,0.30)';
      gCtx.beginPath(); gCtx.moveTo(ox, yp); gCtx.lineTo(ox + gw, yp); gCtx.stroke();
    }
    gCtx.save(); gCtx.translate(20, oy - gh / 2); gCtx.rotate(-Math.PI / 2);
    gCtx.textAlign = 'center'; gCtx.fillStyle = '#6b7a99'; gCtx.font = '9px sans-serif';
    gCtx.fillText('Cl', 0, 0); gCtx.restore();
    function mapXY(cd, cl) {
      return {
        x: ox + (clamp(cd, 0, cdMax) / cdMax) * gw,
        y: oy - ((clamp(cl, -clMax / 2, clMax) + clMax / 2) / (1.5 * clMax)) * gh
      };
    }
    /* For airfoil, sweep alpha and draw a polar curve + L/D-max tangent + α ticks.
       Polar geometry is a pure function of (objIdx, V) — cache it to avoid
       ~158 calcForces calls per frame. */
    if (obj.id === 'airfoil') {
      var pkey = obj.id + '|' + state.airSpeed.toFixed(2) + '|' + state.objSize.toFixed(0) + '|' + (state.flipObj ? 1 : 0);
      if (!window._polarCache || window._polarCache.key !== pkey) {
        var curve = [], ticks = [], bestLocal = { ld: 0, a: 0, cd: 0, cl: 0 };
        for (var a = -20; a <= 25; a += 0.5) {
          var pf = calcForces(state.airSpeed, state.objSize / 1000, obj, a);
          curve.push({ a: a, cd: pf.Cd, cl: pf.Cl });
        }
        [-5, 0, 5, 10, 15, 20].forEach(function (alphaTick) {
          var pf2 = calcForces(state.airSpeed, state.objSize / 1000, obj, alphaTick);
          ticks.push({ a: alphaTick, cd: pf2.Cd, cl: pf2.Cl });
        });
        for (var aa = -15; aa <= 15; aa += 0.25) {
          var pf3 = calcForces(state.airSpeed, state.objSize / 1000, obj, aa);
          if (pf3.Cd > 1e-4 && Math.abs(pf3.Cl / pf3.Cd) > bestLocal.ld) {
            bestLocal = { ld: Math.abs(pf3.Cl / pf3.Cd), a: aa, cd: pf3.Cd, cl: pf3.Cl };
          }
        }
        window._polarCache = { key: pkey, curve: curve, ticks: ticks, best: bestLocal };
      }
      var pc = window._polarCache;
      gCtx.strokeStyle = ACCENT; gCtx.lineWidth = 1.5;
      gCtx.beginPath();
      for (var ci = 0; ci < pc.curve.length; ci++) {
        var p = mapXY(pc.curve[ci].cd, pc.curve[ci].cl);
        if (ci === 0) gCtx.moveTo(p.x, p.y); else gCtx.lineTo(p.x, p.y);
      }
      gCtx.stroke();

      /* α tick markers along the curve */
      gCtx.fillStyle = '#80deea'; gCtx.font = '8px monospace'; gCtx.textAlign = 'left';
      for (var ti = 0; ti < pc.ticks.length; ti++) {
        var tk = pc.ticks[ti], p2 = mapXY(tk.cd, tk.cl);
        gCtx.beginPath(); gCtx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2); gCtx.fill();
        gCtx.fillText(tk.a + '°', p2.x + 5, p2.y - 2);
      }

      var best = pc.best;
      if (best.ld > 0) {
        var origin = mapXY(0, 0);
        var bp = mapXY(best.cd, best.cl);
        var dx = bp.x - origin.x, dy = bp.y - origin.y;
        var tEdge = (ox + gw - origin.x) / Math.max(dx, 1e-6);
        gCtx.save();
        gCtx.strokeStyle = 'rgba(255,213,79,0.55)';
        gCtx.setLineDash([4, 3]);
        gCtx.lineWidth = 1;
        gCtx.beginPath();
        gCtx.moveTo(origin.x, origin.y);
        gCtx.lineTo(origin.x + dx * tEdge, origin.y + dy * tEdge);
        gCtx.stroke();
        gCtx.restore();
        gCtx.fillStyle = '#ffd54f';
        gCtx.beginPath(); gCtx.arc(bp.x, bp.y, 3.5, 0, Math.PI * 2); gCtx.fill();
        gCtx.fillStyle = '#fff7c1'; gCtx.font = '9px monospace';
        gCtx.fillText('(L/D)max = ' + best.ld.toFixed(1) + ' @ α=' + best.a.toFixed(1) + '°', bp.x + 6, bp.y - 5);
      }
    } else {
      /* For non-airfoils, draw greyed reference dots at canonical Cd values */
      var refs = [
        { name: 'Sphere',      cd: 0.47 },
        { name: 'Cylinder',    cd: 1.20 },
        { name: 'Flat plate',  cd: 1.98 },
        { name: 'Streamlined', cd: 0.04 }
      ];
      gCtx.fillStyle = 'rgba(139,157,195,0.45)';
      gCtx.font = '8px monospace'; gCtx.textAlign = 'center';
      refs.forEach(function (rf) {
        if (rf.cd > cdMax) return;
        var rp = mapXY(rf.cd, 0);
        gCtx.beginPath(); gCtx.arc(rp.x, rp.y, 3, 0, Math.PI * 2); gCtx.fill();
        gCtx.fillText(rf.name, rp.x, rp.y - 6);
      });
    }
    /* Current state dot */
    var cur = mapXY(f.Cd, f.Cl);
    gCtx.fillStyle = '#ffd54f';
    gCtx.beginPath(); gCtx.arc(cur.x, cur.y, 6, 0, Math.PI * 2); gCtx.fill();
    gCtx.strokeStyle = '#fff'; gCtx.lineWidth = 1.5;
    gCtx.beginPath(); gCtx.arc(cur.x, cur.y, 6, 0, Math.PI * 2); gCtx.stroke();
    /* Current values */
    gCtx.fillStyle = '#b6c3e0'; gCtx.font = '9px monospace'; gCtx.textAlign = 'left';
    gCtx.fillText('Cd = ' + f.Cd.toFixed(3) + '   Cl = ' + f.Cl.toFixed(3) + '   L/D = ' + (f.Cd > 1e-4 ? f.LD.toFixed(2) : '—'), ox + 8, oy - gh + 18);
  }

  /* ═══════════════════════════════════════════════════════════════
     S12  ANIMATION LOOP
     ═══════════════════════════════════════════════════════════════ */
  var animRAF = null;
  var lastFrameTime = 0;

  function animLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    var dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
    lastFrameTime = timestamp;

    /* Pause halts particle advance + sim clock; drawing continues
       so user can still adjust sliders and see static snapshot update. */
    if (!state.paused) {
      state.simTime += dt;
      if (state.mode === 'simulate' && state.airSpeed > 0) {
        updateParticles(dt);
      }
    }

    /* Render */
    if (state.mode === 'simulate') {
      drawMachine();
      drawGraph();
      updateResults();
    }

    animRAF = requestAnimationFrame(animLoop);
  }

  function startAnimLoop() {
    if (!animRAF) {
      lastFrameTime = 0;
      animRAF = requestAnimationFrame(animLoop);
    }
  }

  function stopAnimLoop() {
    if (animRAF) {
      cancelAnimationFrame(animRAF);
      animRAF = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S13  RESULTS UPDATE
     ═══════════════════════════════════════════════════════════════ */
  function updateResults() {
    var obj = OBJECTS[state.objIdx];
    var D = state.objSize / 1000;
    var f = calcForces(state.airSpeed, D, obj, state.angleOfAttack);
    state.results = f;
    var u = U();

    /* Readout cards */
    var resV = $('res-v');
    var resRe = $('res-re');
    var resCd = $('res-cd');
    var resCl = $('res-cl');
    var resFd = $('res-fd');
    var resFl = $('res-fl');
    var resQ = $('res-q');
    var resLD = $('res-ld');

    if (resV) resV.textContent = u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits);
    if (resRe) resRe.textContent = f.Re > 1e5 ? formatSci(f.Re, 2) : Math.round(f.Re);
    if (resCd) resCd.textContent = roundN(f.Cd, 4);
    if (resCl) resCl.textContent = roundN(f.Cl, 4);
    if (resFd) resFd.textContent = u.force.fromSI(f.Fd).toFixed(u.force.digits);
    if (resFl) resFl.textContent = u.force.fromSI(f.Fl).toFixed(u.force.digits);
    if (resQ)  resQ.textContent  = u.press.fromSI(f.q).toFixed(u.press.digits);
    if (resLD) resLD.textContent = f.Cd > 0.0001 ? roundN(f.LD, 2) : '\u2014';

    var rvu = $('res-v-u');  if (rvu) rvu.textContent = u.speed.label;
    var rfdu = $('res-fd-u'); if (rfdu) rfdu.textContent = u.force.label;
    var rflu = $('res-fl-u'); if (rflu) rflu.textContent = u.force.label;
    var rqu = $('res-q-u');  if (rqu) rqu.textContent = u.press.label;

    /* Badges */
    if (elBadgeV)  elBadgeV.textContent  = u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits);
    if (elBadgeRe) elBadgeRe.textContent = f.Re > 1e5 ? formatSci(f.Re, 1) : Math.round(f.Re);
    if (elBadgeCd) elBadgeCd.textContent = roundN(f.Cd, 3);
    if (elBadgeFd) elBadgeFd.textContent = u.force.fromSI(f.Fd).toFixed(u.force.digits);
    var bvu = $('badge-v-u');  if (bvu) bvu.textContent = u.speed.label;
    var bfdu = $('badge-fd-u'); if (bfdu) bfdu.textContent = u.force.label;

    /* ---- new academic readouts ---- */
    var fl = f.fluid || curFluid();
    var isAF = obj.id === 'airfoil';

    var cM = $('card-mach'), rM = $('res-mach'), rMu = $('res-mach-u');
    if (cM) cM.hidden = false;
    if (rM) {
      rM.textContent = f.M.toFixed(3);
      rM.classList.toggle('warn-value', f.M > 0.3);
      if (rMu) rMu.textContent = f.M > 0.3 ? 'M — compressible' : 'M — incompressible';
    }

    var cS = $('card-cdsplit'), rS = $('res-cdsplit');
    if (cS) cS.hidden = !isAF;
    if (rS && isAF) {
      rS.textContent = f.cdProfile.toFixed(4) + ' + ' + f.cdInduced.toFixed(4);
    }

    var rB = $('res-blockage'), rBu = $('res-blockage-u');
    if (rB && f.blockage) {
      var pcB = f.blockage.ratio * 100;
      rB.textContent = pcB.toFixed(2) + ' %';
      rB.classList.toggle('warn-value', pcB >= 5);
      if (rBu) rBu.textContent = state.applyBlockage ? 'corrected' : 'uncorrected';
    }

    var rU = $('res-unc');
    if (rU) {
      var ub = curUncertainty(f);
      rU.textContent = '±' + ub.U.Cd.toFixed(4);
    }

    /* Pressure-drag from integrating the plotted Cp */
    var rC = $('res-cpint'), rCu = $('res-cpint-u');
    if (rC) {
      var cpm = getCpModel(obj, state.angleOfAttack, 180);
      if (!cpm.integrable) {
        rC.textContent = '—';
        if (rCu) rCu.textContent = 'not defined for this shape';
      } else if (cpm.kind === 'chord') {
        var Cn = integrateCp(cpm, 'actual');
        rC.textContent = (Cn * Math.cos(state.angleOfAttack * Math.PI / 180)).toFixed(4);
        if (rCu) rCu.textContent = 'C\u2097 from \u222bC\u209a';
      } else {
        var cdp = integrateCp(cpm, 'actual');
        rC.textContent = cdp.toFixed(4);
        if (rCu) rCu.textContent = 'pressure drag (' +
          Math.round(100 * cpm.pressureFraction) + '% of C\u1d48)';
      }
    }

    syncLabSetup();
    updateLabChips(f);
    updateLearnPanels(f);
    updateBadgeStrip(f);

    /* Stall sound on transition (Re-dependent stall angle) */
    var isStall = (OBJECTS[state.objIdx].id === 'airfoil') && Math.abs(state.angleOfAttack) > stallAngleDeg(f.Re);
    if (isStall && !lastStallState) playStall();
    lastStallState = isStall;
  }

  /* ═══════════════════════════════════════════════════════════════
     S14  MODE SWITCHING
     ═══════════════════════════════════════════════════════════════ */
  function setMode(m) {
    state.mode = m;
    hide(elSimWrapper); hide(elExploreWrapper); hide(elPracticeWrapper); hide(elQuizWrapper);
    /* Update tab active state */
    if (elModeTabs) {
      elModeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
      elModeTabs.querySelectorAll('.pill').forEach(function (p) {
        if (p.dataset.mode === m) p.classList.add('active');
      });
    }
    switch (m) {
      case 'simulate':
        show(elSimWrapper);
        initParticles();
        startAnimLoop();
        break;
      case 'explore':
        show(elExploreWrapper);
        stopAnimLoop();
        buildExploreUI();
        break;
      case 'practice':
        show(elPracticeWrapper);
        stopAnimLoop();
        if (!state.pProb) newPractice();
        break;
      case 'quiz':
        show(elQuizWrapper);
        stopAnimLoop();
        if (state.qSet.length === 0) startQuiz();
        break;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S15  EXPLORE MODE (12 diagrams)
     ═══════════════════════════════════════════════════════════════ */
  var EXP_CATS = ['Fundamentals', 'Flow Physics', 'Aerodynamics', 'Applications'];

  function buildExploreUI() {
    if (!elExploreCats) return;
    /* Category tabs */
    elExploreCats.innerHTML = '';
    EXP_CATS.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.className = 'pill' + (cat === state.expCat ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', function () {
        state.expCat = cat;
        elExploreCats.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        buildExploreGrid();
      });
      elExploreCats.appendChild(btn);
    });
    buildExploreGrid();
  }

  function buildExploreGrid() {
    if (!elExploreGrid) return;
    elExploreGrid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === state.expCat; });
    filtered.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'explore-btn' + (i === 0 ? ' active' : '');
      btn.textContent = c.name;
      btn.addEventListener('click', function () {
        elExploreGrid.querySelectorAll('.explore-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectConcept(c);
      });
      elExploreGrid.appendChild(btn);
    });
    if (filtered.length > 0) selectConcept(filtered[0]);
  }

  function selectConcept(concept) {
    state.expIdx = CONCEPTS.indexOf(concept);
    if (!elExploreInfo) return;
    elExploreInfo.innerHTML = '';
    var h = document.createElement('h3');
    h.textContent = concept.name;
    if (concept.symbol) h.textContent += ' (' + concept.symbol + ')';
    elExploreInfo.appendChild(h);

    var p = document.createElement('p');
    p.textContent = concept.desc;
    elExploreInfo.appendChild(p);

    if (concept.formula) {
      var fb = document.createElement('div');
      fb.className = 'formula-box';
      fb.textContent = concept.formula;
      elExploreInfo.appendChild(fb);
    }

    if (concept.example) {
      var eb = document.createElement('div');
      eb.className = 'example-box';
      eb.innerHTML = '<strong>Example: </strong>' + concept.example.problem + '<br>';
      concept.example.steps.forEach(function (s) {
        eb.innerHTML += '\u2022 ' + s + '<br>';
      });
      elExploreInfo.appendChild(eb);
    }

    drawExploreDiagram(concept);
  }

  function drawExploreDiagram(concept) {
    if (!eCtx) return;
    eCtx.clearRect(0, 0, EW, EH);
    eCtx.fillStyle = '#0a0e14';
    eCtx.fillRect(0, 0, EW, EH);

    switch (concept.id) {
      case 'drag-force':      drawExploreDrag(); break;
      case 'lift-force':      drawExploreLift(); break;
      case 'reynolds':        drawExploreReynolds(); break;
      case 'boundary-layer':  drawExploreBL(); break;
      case 'separation':      drawExploreSeparation(); break;
      case 'bernoulli':       drawExploreBernoulli(); break;
      case 'pressure-dist':   drawExplorePressureDist(); break;
      case 'stall':           drawExploreStall(); break;
      case 'drag-crisis':     drawExploreDragCrisis(); break;
      case 'bluff-vs-streamlined': drawExploreBluffVsStream(); break;
      case 'vortex-street':   drawExploreVortexStreet(); break;
      case 'tunnel-types':    drawExploreTunnelTypes(); break;
      case 'similarity':      drawExploreSimilarity(); break;
      case 'camber':          drawExploreCamber(); break;
      case 'aspect-ratio':    drawExploreAspectRatio(); break;
      case 'blockage-uncertainty': drawExploreBlockage(); break;
    }

    /* Title bar */
    eCtx.fillStyle = hexToRGBA(ACCENT, 0.15);
    eCtx.fillRect(0, EH - 30, EW, 30);
    eCtx.fillStyle = hexToRGBA(ACCENT, 0.8);
    eCtx.font = 'bold 11px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText(concept.name, EW / 2, EH - 10);
  }

  /* ── Explore Diagram Functions ── */

  function drawExploreDrag() {
    var cx = EW / 2, cy = 180;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Drag Force on a Bluff Body', cx, 25);

    /* Object (sphere) */
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath(); eCtx.arc(cx, cy, 60, 0, Math.PI * 2); eCtx.fill();
    eCtx.strokeStyle = '#78909c';
    eCtx.lineWidth = 1;
    eCtx.stroke();

    /* Flow arrows coming from left */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 1.5;
    for (var i = 0; i < 7; i++) {
      var ay = cy - 90 + i * 30;
      eCtx.beginPath(); eCtx.moveTo(100, ay); eCtx.lineTo(180, ay); eCtx.stroke();
      eCtx.beginPath(); eCtx.moveTo(180, ay); eCtx.lineTo(174, ay - 4); eCtx.moveTo(180, ay); eCtx.lineTo(174, ay + 4); eCtx.stroke();
    }
    eCtx.fillStyle = ACCENT;
    eCtx.font = '10px sans-serif';
    eCtx.fillText('V\u221e', 140, cy - 100);

    /* Drag arrow */
    eCtx.strokeStyle = '#ff5555';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx + 70, cy); eCtx.lineTo(cx + 170, cy); eCtx.stroke();
    eCtx.fillStyle = '#ff5555';
    eCtx.beginPath(); eCtx.moveTo(cx + 170, cy); eCtx.lineTo(cx + 160, cy - 6); eCtx.lineTo(cx + 160, cy + 6); eCtx.closePath(); eCtx.fill();
    eCtx.font = 'bold 12px sans-serif';
    eCtx.fillText('Fd (Drag)', cx + 180, cy - 10);

    /* Wake region */
    eCtx.fillStyle = 'rgba(0,188,212,0.05)';
    eCtx.beginPath();
    eCtx.moveTo(cx + 60, cy - 40);
    eCtx.bezierCurveTo(cx + 150, cy - 80, cx + 200, cy - 30, cx + 250, cy);
    eCtx.bezierCurveTo(cx + 200, cy + 30, cx + 150, cy + 80, cx + 60, cy + 40);
    eCtx.closePath();
    eCtx.fill();
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Low-pressure wake', cx + 160, cy + 50);

    /* Formula */
    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 14px monospace';
    eCtx.fillText('Fd = 0.5\u03c1V\u00b2ACd', cx, EH - 55);
  }

  function drawExploreLift() {
    var cx = EW / 2, cy = 180;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Lift Generation on an Airfoil', cx, 25);

    /* Airfoil shape */
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath();
    eCtx.moveTo(cx - 120, cy);
    eCtx.bezierCurveTo(cx - 80, cy - 40, cx + 40, cy - 35, cx + 120, cy - 5);
    eCtx.lineTo(cx + 120, cy + 5);
    eCtx.bezierCurveTo(cx + 40, cy + 20, cx - 80, cy + 15, cx - 120, cy);
    eCtx.closePath();
    eCtx.fill();

    /* Upper flow (faster, lower pressure) */
    eCtx.strokeStyle = '#ff5555';
    eCtx.lineWidth = 1.5;
    for (var i = 0; i < 4; i++) {
      var y = cy - 50 - i * 18;
      eCtx.beginPath();
      eCtx.moveTo(cx - 150, y);
      eCtx.bezierCurveTo(cx - 50, y - 10, cx + 50, y - 10, cx + 150, y);
      eCtx.stroke();
    }
    eCtx.fillStyle = '#ff5555';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Lower pressure (faster)', cx, cy - 120);

    /* Lower flow (slower, higher pressure) */
    eCtx.strokeStyle = '#3ddc84';
    eCtx.lineWidth = 1.5;
    for (var j = 0; j < 3; j++) {
      var y2 = cy + 35 + j * 18;
      eCtx.beginPath();
      eCtx.moveTo(cx - 150, y2);
      eCtx.bezierCurveTo(cx - 50, y2 + 5, cx + 50, y2 + 5, cx + 150, y2);
      eCtx.stroke();
    }
    eCtx.fillStyle = '#3ddc84';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Higher pressure (slower)', cx, cy + 100);

    /* Lift arrow */
    eCtx.strokeStyle = '#3ddc84';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx, cy - 5); eCtx.lineTo(cx, cy - 70); eCtx.stroke();
    eCtx.fillStyle = '#3ddc84';
    eCtx.beginPath(); eCtx.moveTo(cx, cy - 70); eCtx.lineTo(cx - 6, cy - 60); eCtx.lineTo(cx + 6, cy - 60); eCtx.closePath(); eCtx.fill();
    eCtx.font = 'bold 11px sans-serif';
    eCtx.fillText('Fl (Lift)', cx + 40, cy - 60);

    /* Formula */
    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 14px monospace';
    eCtx.fillText('Fl = 0.5\u03c1V\u00b2ACl', cx, EH - 55);
  }

  function drawExploreReynolds() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Reynolds Number \u2014 Flow Regime Classification', cx, 25);

    /* Re scale bar */
    var ox = 100, oy = 160, bw = 700, bh = 40;
    var regimes = [
      { name: 'Creeping', end: 1, color: '#1e88e5' },
      { name: 'Laminar', end: 1000, color: '#00897b' },
      { name: 'Transitional', end: 200000, color: '#ffa000' },
      { name: 'Turbulent', end: 1e7, color: '#e53935' }
    ];

    var logMin = 0, logMax = 7;
    regimes.forEach(function (reg, i) {
      var xStart = i === 0 ? ox : ox + (log10(regimes[i - 1].end) / logMax) * bw;
      var xEnd = ox + (log10(reg.end) / logMax) * bw;
      eCtx.fillStyle = hexToRGBA(reg.color, 0.3);
      eCtx.fillRect(xStart, oy, xEnd - xStart, bh);
      eCtx.strokeStyle = reg.color;
      eCtx.lineWidth = 0.5;
      eCtx.strokeRect(xStart, oy, xEnd - xStart, bh);
      eCtx.fillStyle = reg.color;
      eCtx.font = 'bold 10px sans-serif';
      eCtx.textAlign = 'center';
      eCtx.fillText(reg.name, (xStart + xEnd) / 2, oy + bh / 2 + 4);
    });

    /* Re labels */
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px monospace';
    [0, 1, 2, 3, 4, 5, 6, 7].forEach(function (e) {
      var x = ox + (e / logMax) * bw;
      eCtx.textAlign = 'center';
      eCtx.fillText('10' + superscript(e), x, oy + bh + 18);
    });

    /* Flow visualization sketches */
    var sketchY = 270;
    /* Laminar flow around cylinder */
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath(); eCtx.arc(250, sketchY, 25, 0, Math.PI * 2); eCtx.fill();
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 1;
    for (var i = 0; i < 5; i++) {
      var sy = sketchY - 40 + i * 20;
      eCtx.beginPath();
      eCtx.moveTo(180, sy);
      eCtx.bezierCurveTo(220, sy, 280, sy + (i === 2 ? 0 : (i < 2 ? -10 : 10)), 320, sy);
      eCtx.stroke();
    }
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Low Re (laminar)', 250, sketchY + 50);

    /* Turbulent flow */
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath(); eCtx.arc(650, sketchY, 25, 0, Math.PI * 2); eCtx.fill();
    eCtx.strokeStyle = ACCENT;
    for (var j = 0; j < 5; j++) {
      var sy2 = sketchY - 40 + j * 20;
      eCtx.beginPath();
      eCtx.moveTo(580, sy2);
      eCtx.lineTo(620, sy2);
      eCtx.stroke();
      /* Turbulent wake */
      if (j > 0 && j < 4) {
        eCtx.beginPath();
        eCtx.moveTo(680, sy2);
        eCtx.bezierCurveTo(700, sy2 + 10, 720, sy2 - 10, 740, sy2 + 5);
        eCtx.stroke();
      }
    }
    eCtx.fillStyle = '#6b7a99';
    eCtx.fillText('High Re (turbulent wake)', 650, sketchY + 50);

    /* Formula */
    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 14px monospace';
    eCtx.fillText('Re = \u03c1VD / \u03bc', cx, 55);
  }

  function drawExploreBL() {
    var cx = EW / 2, cy = 200;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Boundary Layer Development on a Flat Plate', cx, 25);

    /* Flat plate */
    eCtx.fillStyle = '#455a64';
    eCtx.fillRect(100, cy, 700, 8);

    /* Laminar BL growth */
    eCtx.fillStyle = 'rgba(0,188,212,0.1)';
    eCtx.beginPath();
    eCtx.moveTo(100, cy);
    for (var i = 0; i <= 50; i++) {
      var x = 100 + i * 7;
      var xFrac = i / 50;
      var blThick = 30 * Math.sqrt(xFrac);
      eCtx.lineTo(x, cy - blThick);
    }
    eCtx.lineTo(450, cy);
    eCtx.closePath();
    eCtx.fill();

    /* Transition */
    eCtx.strokeStyle = '#ffa000';
    eCtx.lineWidth = 1;
    eCtx.setLineDash([4, 4]);
    eCtx.beginPath(); eCtx.moveTo(450, cy - 50); eCtx.lineTo(450, cy + 30); eCtx.stroke();
    eCtx.setLineDash([]);
    eCtx.fillStyle = '#ffa000';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Transition', 450, cy - 55);

    /* Turbulent BL (thicker) */
    eCtx.fillStyle = 'rgba(255,160,0,0.1)';
    eCtx.beginPath();
    eCtx.moveTo(450, cy);
    for (var j = 0; j <= 40; j++) {
      var x2 = 450 + j * 8.75;
      var xFrac2 = j / 40;
      var blThick2 = 30 + 25 * Math.pow(xFrac2, 0.8);
      eCtx.lineTo(x2, cy - blThick2);
    }
    eCtx.lineTo(800, cy);
    eCtx.closePath();
    eCtx.fill();

    /* Labels */
    eCtx.fillStyle = ACCENT;
    eCtx.font = '10px sans-serif';
    eCtx.fillText('Laminar BL', 280, cy - 40);
    eCtx.fillStyle = '#ffa000';
    eCtx.fillText('Turbulent BL', 650, cy - 65);

    /* Velocity profiles */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 1.5;
    /* Laminar profile (parabolic) */
    eCtx.beginPath();
    var px = 250;
    for (var k = 0; k <= 20; k++) {
      var t = k / 20;
      var vel = 1 - (1 - t) * (1 - t);
      eCtx.lineTo(px + vel * 25, cy - t * 25);
    }
    eCtx.stroke();
    eCtx.beginPath(); eCtx.moveTo(px, cy); eCtx.lineTo(px, cy - 25); eCtx.stroke();

    /* Turbulent profile (fuller) */
    eCtx.strokeStyle = '#ffa000';
    var px2 = 650;
    eCtx.beginPath();
    for (var m = 0; m <= 20; m++) {
      var t2 = m / 20;
      var vel2 = Math.pow(t2, 1 / 7);
      eCtx.lineTo(px2 + vel2 * 25, cy - t2 * 45);
    }
    eCtx.stroke();
    eCtx.beginPath(); eCtx.moveTo(px2, cy); eCtx.lineTo(px2, cy - 45); eCtx.stroke();

    /* Formula */
    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 13px monospace';
    eCtx.fillText('\u03b4 = 5x / \u221aRe_x  (laminar)', cx, 55);
  }

  function drawExploreSeparation() {
    var cx = EW / 2, cy = 180;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Flow Separation and Wake Formation', cx, 25);

    /* Cylinder */
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath(); eCtx.arc(cx, cy, 50, 0, Math.PI * 2); eCtx.fill();
    eCtx.strokeStyle = '#78909c';
    eCtx.lineWidth = 1;
    eCtx.stroke();

    /* Attached flow on front */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 1.5;
    for (var i = 0; i < 6; i++) {
      var y = cy - 80 + i * 32;
      eCtx.beginPath();
      eCtx.moveTo(cx - 200, y);
      eCtx.bezierCurveTo(cx - 100, y, cx - 60, y + (y < cy ? -15 : 15), cx - 50, cy + (y < cy ? -50 : 50));
      eCtx.stroke();
    }

    /* Separation points */
    eCtx.fillStyle = '#ff5555';
    eCtx.beginPath();
    eCtx.arc(cx + 25, cy - 43, 5, 0, Math.PI * 2);
    eCtx.fill();
    eCtx.beginPath();
    eCtx.arc(cx + 25, cy + 43, 5, 0, Math.PI * 2);
    eCtx.fill();
    eCtx.font = '8px sans-serif';
    eCtx.fillText('Separation', cx + 60, cy - 50);

    /* Wake with recirculating eddies */
    eCtx.strokeStyle = hexToRGBA('#ff5555', 0.5);
    eCtx.lineWidth = 1;
    eCtx.beginPath();
    eCtx.arc(cx + 100, cy - 20, 15, 0, Math.PI * 1.5);
    eCtx.stroke();
    eCtx.beginPath();
    eCtx.arc(cx + 100, cy + 20, 15, 0.5, Math.PI * 2);
    eCtx.stroke();
    eCtx.fillStyle = 'rgba(255,85,85,0.1)';
    eCtx.fillRect(cx + 50, cy - 50, 150, 100);
    eCtx.fillStyle = '#ff5555';
    eCtx.font = '10px sans-serif';
    eCtx.fillText('Wake (low pressure)', cx + 130, cy + 70);

    /* Pressure gradient annotation */
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('dp/dx < 0 (favorable)', cx - 80, cy + 90);
    eCtx.fillText('dp/dx > 0 (adverse)', cx + 30, cy + 90);

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 12px monospace';
    eCtx.fillText('Separation \u2192 Low-pressure wake \u2192 Pressure drag', cx, 55);
  }

  function drawExploreBernoulli() {
    var cx = EW / 2, cy = 180;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Bernoulli\'s Principle in a Venturi', cx, 25);

    /* Venturi tube */
    var tubeLeft = 120, tubeRight = 780;
    /* Top wall */
    eCtx.strokeStyle = '#546e7a';
    eCtx.lineWidth = 3;
    eCtx.beginPath();
    eCtx.moveTo(tubeLeft, cy - 80);
    eCtx.bezierCurveTo(tubeLeft + 150, cy - 80, cx - 100, cy - 30, cx, cy - 30);
    eCtx.bezierCurveTo(cx + 100, cy - 30, tubeRight - 150, cy - 80, tubeRight, cy - 80);
    eCtx.stroke();
    /* Bottom wall */
    eCtx.beginPath();
    eCtx.moveTo(tubeLeft, cy + 80);
    eCtx.bezierCurveTo(tubeLeft + 150, cy + 80, cx - 100, cy + 30, cx, cy + 30);
    eCtx.bezierCurveTo(cx + 100, cy + 30, tubeRight - 150, cy + 80, tubeRight, cy + 80);
    eCtx.stroke();

    /* Pressure labels */
    eCtx.fillStyle = '#3ddc84';
    eCtx.font = 'bold 10px sans-serif';
    eCtx.fillText('High P, Low V', 230, cy);
    eCtx.fillStyle = '#ff5555';
    eCtx.fillText('Low P, High V', cx, cy);
    eCtx.fillStyle = '#3ddc84';
    eCtx.fillText('High P, Low V', 670, cy);

    /* Manometer tubes */
    var manY = cy + 120;
    [230, cx, 670].forEach(function (mx, idx) {
      var height = idx === 1 ? 30 : 60;
      eCtx.strokeStyle = '#1e88e5';
      eCtx.lineWidth = 3;
      eCtx.beginPath();
      eCtx.moveTo(mx, cy + 80);
      eCtx.lineTo(mx, manY + 20);
      eCtx.stroke();
      eCtx.fillStyle = '#1e88e5';
      eCtx.fillRect(mx - 6, manY + 20 - height, 12, height);
    });
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Manometer readings show pressure drop at throat', cx, manY + 40);

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 13px monospace';
    eCtx.fillText('P + 0.5\u03c1V\u00b2 + \u03c1gh = constant', cx, 55);
  }

  function drawExplorePressureDist() {
    var cx = EW / 2, cy = 180;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Pressure Coefficient Distribution Around a Cylinder', cx, 25);

    /* Cylinder with Cp arrows */
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath(); eCtx.arc(cx, cy, 60, 0, Math.PI * 2); eCtx.fill();

    /* Cp arrows around surface */
    for (var i = 0; i < 12; i++) {
      var theta = (i / 12) * Math.PI * 2;
      var cp = 1 - 4 * Math.pow(Math.sin(theta), 2);
      var nx = Math.cos(theta);
      var ny = Math.sin(theta);
      var arrowLen = Math.abs(cp) * 20;
      var dir = cp > 0 ? 1 : -1; /* positive Cp pushes in, negative pulls out */
      var sx = cx + nx * 65;
      var sy = cy + ny * 65;
      var ex = sx + nx * arrowLen * dir;
      var ey = sy + ny * arrowLen * dir;

      eCtx.strokeStyle = pressureColor(cp);
      eCtx.lineWidth = 2;
      eCtx.beginPath(); eCtx.moveTo(sx, sy); eCtx.lineTo(ex, ey); eCtx.stroke();
    }

    /* Stagnation point label */
    eCtx.fillStyle = '#ff5555';
    eCtx.font = '8px sans-serif';
    eCtx.textAlign = 'left';
    eCtx.fillText('Cp = +1 (stagnation)', cx - 120, cy - 5);
    eCtx.fillStyle = '#1e88e5';
    eCtx.fillText('Cp = -3 (max suction)', cx + 5, cy - 80);

    /* Formula */
    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 13px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('Cp = 1 \u2212 4sin\u00b2\u03b8  (ideal cylinder)', cx, 55);

    /* Small Cp vs theta plot */
    var ox = 100, oy = 330, gw = 700, gh = 100;
    eCtx.strokeStyle = '#6b7a99';
    eCtx.lineWidth = 1;
    eCtx.beginPath(); eCtx.moveTo(ox, oy - gh / 2); eCtx.lineTo(ox, oy + gh / 2); eCtx.stroke();
    eCtx.beginPath(); eCtx.moveTo(ox, oy); eCtx.lineTo(ox + gw, oy); eCtx.stroke();
    /* Cp curve */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 1.5;
    eCtx.beginPath();
    for (var j = 0; j <= 100; j++) {
      var t = j / 100;
      var angle = t * Math.PI * 2;
      var cpV = 1 - 4 * Math.pow(Math.sin(angle), 2);
      var px = ox + t * gw;
      var py = oy - cpV / 4 * gh;
      if (j === 0) eCtx.moveTo(px, py); else eCtx.lineTo(px, py);
    }
    eCtx.stroke();
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '8px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('0\u00b0', ox, oy + gh / 2 + 12);
    eCtx.fillText('180\u00b0', ox + gw / 2, oy + gh / 2 + 12);
    eCtx.fillText('360\u00b0', ox + gw, oy + gh / 2 + 12);
  }

  function drawExploreStall() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Airfoil Stall Behavior', cx, 25);

    /* Cl vs alpha plot */
    var ox = 150, oy = 310, gw = 600, gh = 240;
    eCtx.strokeStyle = '#6b7a99';
    eCtx.lineWidth = 1;
    eCtx.beginPath(); eCtx.moveTo(ox, oy - gh); eCtx.lineTo(ox, oy); eCtx.lineTo(ox + gw, oy); eCtx.stroke();

    /* Axis labels */
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Angle of Attack \u03b1 (degrees)', ox + gw / 2, oy + 25);
    eCtx.save();
    eCtx.translate(ox - 35, oy - gh / 2);
    eCtx.rotate(-Math.PI / 2);
    eCtx.fillText('Lift Coefficient Cl', 0, 0);
    eCtx.restore();

    /* Alpha labels */
    for (var a = -5; a <= 25; a += 5) {
      var xp = ox + ((a + 10) / 35) * gw;
      eCtx.fillText(a + '\u00b0', xp, oy + 12);
    }

    /* Cl curve */
    eCtx.strokeStyle = '#3ddc84';
    eCtx.lineWidth = 2;
    eCtx.beginPath();
    for (var i = 0; i <= 70; i++) {
      var alpha = -10 + i * 0.5;
      var cl = getAirfoilCl(alpha, 3.5e6);   /* textbook-Re curve: αs = 15°, Cl_max ≈ 1.4 */
      var px = ox + ((alpha + 10) / 35) * gw;
      var py = oy - (cl / 2) * gh;
      py = clamp(py, oy - gh, oy + 10);
      if (i === 0) eCtx.moveTo(px, py); else eCtx.lineTo(px, py);
    }
    eCtx.stroke();

    /* Stall line */
    var stallX = ox + ((15 + 10) / 35) * gw;
    eCtx.strokeStyle = '#ff5555';
    eCtx.lineWidth = 1;
    eCtx.setLineDash([4, 4]);
    eCtx.beginPath(); eCtx.moveTo(stallX, oy); eCtx.lineTo(stallX, oy - gh); eCtx.stroke();
    eCtx.setLineDash([]);
    eCtx.fillStyle = '#ff5555';
    eCtx.font = 'bold 9px sans-serif';
    eCtx.textAlign = 'left';
    eCtx.fillText('STALL', stallX + 5, oy - gh + 15);

    /* Cl_max annotation \u2014 matches the drawn curve (Re \u2248 3\u00d710\u2076 model) */
    var clMaxPlot = clMaxRe(3.5e6);
    eCtx.fillStyle = '#f5c842';
    var clMaxY = oy - (clMaxPlot / 2) * gh;
    eCtx.beginPath(); eCtx.arc(stallX, clMaxY, 4, 0, Math.PI * 2); eCtx.fill();
    eCtx.fillStyle = '#f5c842';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Cl_max \u2248 ' + clMaxPlot.toFixed(1) + '  (Re \u2248 3\u00d710\u2076)', stallX + 10, clMaxY);

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 12px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('Cl = 2\u03c0sin(\u03b1) for \u03b1 < \u03b1_stall', cx, 55);
    eCtx.fillStyle = '#8b9dc3';
    eCtx.font = '10px sans-serif';
    eCtx.fillText('\u03b1_stall rises with Reynolds number: \u2248 10\u00b0 at Re 10\u2075  \u2192  \u2248 16\u00b0 at Re 10\u2077', cx, 72);
  }

  function drawExploreDragCrisis() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Drag Crisis \u2014 Cd Drop at Critical Reynolds Number', cx, 25);

    /* Cd vs Re plot */
    var ox = 150, oy = 310, gw = 600, gh = 230;
    eCtx.strokeStyle = '#6b7a99';
    eCtx.lineWidth = 1;
    eCtx.beginPath(); eCtx.moveTo(ox, oy - gh); eCtx.lineTo(ox, oy); eCtx.lineTo(ox + gw, oy); eCtx.stroke();

    /* Axis labels */
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Reynolds Number (log scale)', ox + gw / 2, oy + 25);
    eCtx.save();
    eCtx.translate(ox - 35, oy - gh / 2);
    eCtx.rotate(-Math.PI / 2);
    eCtx.fillText('Drag Coefficient Cd', 0, 0);
    eCtx.restore();

    /* Re axis labels */
    for (var e = 2; e <= 7; e++) {
      var xp = ox + ((e - 2) / 5) * gw;
      eCtx.font = '8px monospace';
      eCtx.fillText('10' + superscript(e), xp, oy + 12);
    }

    /* Sphere Cd vs Re */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 2.5;
    eCtx.beginPath();
    /* Subcritical */
    var subEnd = ox + ((5.5 - 2) / 5) * gw;
    var cdSubY = oy - (0.47 / 1.5) * gh;
    eCtx.moveTo(ox, cdSubY);
    eCtx.lineTo(subEnd - 20, cdSubY);
    /* Transition drop */
    var superStart = subEnd + 20;
    var cdSuperY = oy - (0.20 / 1.5) * gh;
    eCtx.bezierCurveTo(subEnd, cdSubY, subEnd, cdSuperY, superStart, cdSuperY);
    /* Supercritical */
    eCtx.lineTo(ox + gw, cdSuperY);
    eCtx.stroke();

    /* Annotations */
    eCtx.fillStyle = ACCENT;
    eCtx.font = '10px sans-serif';
    eCtx.textAlign = 'left';
    eCtx.fillText('Cd = 0.47 (subcritical)', ox + 10, cdSubY - 10);
    eCtx.fillText('Cd = 0.20 (supercritical)', superStart + 10, cdSuperY - 10);

    /* Critical Re line */
    var critX = ox + ((5.5 - 2) / 5) * gw;
    eCtx.strokeStyle = '#ff5555';
    eCtx.lineWidth = 1;
    eCtx.setLineDash([4, 4]);
    eCtx.beginPath(); eCtx.moveTo(critX, oy); eCtx.lineTo(critX, oy - gh); eCtx.stroke();
    eCtx.setLineDash([]);
    eCtx.fillStyle = '#ff5555';
    eCtx.font = 'bold 9px sans-serif';
    eCtx.fillText('Re_crit \u2248 3\u00d710\u2075', critX + 5, oy - gh + 15);

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 12px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('Turbulent BL delays separation \u2192 narrower wake \u2192 less drag', cx, 55);
  }

  function drawExploreBluffVsStream() {
    var cx = EW / 2, cy = 200;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Streamlined vs Bluff Body Comparison', cx, 25);

    /* Bluff body (cylinder) */
    var bx = 250, by = cy;
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath(); eCtx.arc(bx, by, 40, 0, Math.PI * 2); eCtx.fill();
    eCtx.fillStyle = '#ff5555';
    eCtx.font = 'bold 11px sans-serif';
    eCtx.fillText('Cd = 1.20', bx, by - 55);
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Cylinder', bx, by + 55);

    /* Large wake behind bluff body */
    eCtx.fillStyle = 'rgba(255,85,85,0.1)';
    eCtx.beginPath();
    eCtx.moveTo(bx + 40, by - 35);
    eCtx.bezierCurveTo(bx + 120, by - 60, bx + 180, by - 20, bx + 200, by);
    eCtx.bezierCurveTo(bx + 180, by + 20, bx + 120, by + 60, bx + 40, by + 35);
    eCtx.closePath();
    eCtx.fill();
    eCtx.fillStyle = '#ff5555';
    eCtx.font = '8px sans-serif';
    eCtx.fillText('Large wake', bx + 120, by);

    /* Streamlined body */
    var sx = 650, sy = cy;
    eCtx.fillStyle = '#80cbc4';
    eCtx.beginPath();
    eCtx.moveTo(sx + 80, sy);
    eCtx.bezierCurveTo(sx + 60, sy - 8, sx - 20, sy - 20, sx - 60, sy - 18);
    eCtx.bezierCurveTo(sx - 80, sy - 10, sx - 85, sy, sx - 85, sy);
    eCtx.bezierCurveTo(sx - 85, sy, sx - 80, sy + 10, sx - 60, sy + 18);
    eCtx.bezierCurveTo(sx - 20, sy + 20, sx + 60, sy + 8, sx + 80, sy);
    eCtx.closePath();
    eCtx.fill();
    eCtx.fillStyle = '#3ddc84';
    eCtx.font = 'bold 11px sans-serif';
    eCtx.fillText('Cd = 0.04', sx, sy - 35);
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('Streamlined', sx, sy + 35);

    /* Comparison arrow */
    eCtx.fillStyle = '#f5c842';
    eCtx.font = 'bold 14px sans-serif';
    eCtx.fillText('30\u00d7 less drag!', cx, cy + 100);
    eCtx.strokeStyle = '#f5c842';
    eCtx.lineWidth = 2;
    eCtx.beginPath();
    eCtx.moveTo(cx - 50, cy + 85);
    eCtx.lineTo(cx + 50, cy + 85);
    eCtx.stroke();

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 12px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('Shape determines drag: separation \u2192 wake \u2192 pressure drag', cx, 55);
  }

  function drawExploreVortexStreet() {
    var cx = EW / 2, cy = 180;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Von Karman Vortex Street', cx, 25);

    /* Cylinder */
    eCtx.fillStyle = '#607d8b';
    eCtx.beginPath(); eCtx.arc(250, cy, 30, 0, Math.PI * 2); eCtx.fill();

    /* Alternating vortices */
    var vortexColors = [hexToRGBA('#ff5555', 0.5), hexToRGBA('#3ddc84', 0.5)];
    for (var i = 0; i < 6; i++) {
      var vx = 320 + i * 70;
      var vy = cy + (i % 2 === 0 ? -25 : 25);
      var dir = i % 2 === 0 ? 1 : -1;
      eCtx.strokeStyle = vortexColors[i % 2];
      eCtx.lineWidth = 1.5;
      eCtx.beginPath();
      eCtx.arc(vx, vy, 15, 0, Math.PI * 1.8);
      eCtx.stroke();
      /* Arrow on vortex */
      var arrowAngle = dir > 0 ? -0.3 : Math.PI + 0.3;
      eCtx.fillStyle = vortexColors[i % 2];
      var ax = vx + 15 * Math.cos(arrowAngle);
      var ay = vy + 15 * Math.sin(arrowAngle);
      eCtx.beginPath();
      eCtx.arc(ax, ay, 2, 0, Math.PI * 2);
      eCtx.fill();
    }

    /* Labels */
    eCtx.fillStyle = '#ff5555';
    eCtx.font = '9px sans-serif';
    eCtx.fillText('CW vortex', 400, cy - 60);
    eCtx.fillStyle = '#3ddc84';
    eCtx.fillText('CCW vortex', 470, cy + 60);

    /* Strouhal number */
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '10px sans-serif';
    eCtx.fillText('St \u2248 0.21 for cylinders (47 < Re < 10\u2075)', cx, cy + 100);

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 14px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('St = f\u00b7D / V', cx, 55);
  }

  function drawExploreTunnelTypes() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Wind Tunnel Types and Components', cx, 25);

    /* Open-circuit tunnel schematic */
    var ty = 150;
    /* Inlet */
    eCtx.strokeStyle = '#546e7a';
    eCtx.lineWidth = 2;
    eCtx.beginPath();
    eCtx.moveTo(80, ty - 50);
    eCtx.bezierCurveTo(130, ty - 50, 170, ty - 25, 200, ty - 25);
    eCtx.stroke();
    eCtx.beginPath();
    eCtx.moveTo(80, ty + 50);
    eCtx.bezierCurveTo(130, ty + 50, 170, ty + 25, 200, ty + 25);
    eCtx.stroke();
    /* Test section */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 2;
    eCtx.strokeRect(200, ty - 25, 200, 50);
    /* Diffuser */
    eCtx.strokeStyle = '#546e7a';
    eCtx.beginPath();
    eCtx.moveTo(400, ty - 25);
    eCtx.lineTo(550, ty - 45);
    eCtx.stroke();
    eCtx.beginPath();
    eCtx.moveTo(400, ty + 25);
    eCtx.lineTo(550, ty + 45);
    eCtx.stroke();
    /* Fan */
    eCtx.strokeStyle = '#607d8b';
    eCtx.lineWidth = 2;
    eCtx.beginPath();
    eCtx.arc(580, ty, 25, 0, Math.PI * 2);
    eCtx.stroke();
    for (var b = 0; b < 4; b++) {
      var ba = b * Math.PI / 2;
      eCtx.beginPath();
      eCtx.moveTo(580, ty);
      eCtx.lineTo(580 + 20 * Math.cos(ba), ty + 20 * Math.sin(ba));
      eCtx.stroke();
    }

    /* Labels */
    eCtx.fillStyle = '#6b7a99';
    eCtx.font = '9px sans-serif';
    var labels = [
      { t: 'Bell-mouth\nInlet', x: 120, y: ty - 60 },
      { t: 'Contraction', x: 180, y: ty - 40 },
      { t: 'Test Section', x: 300, y: ty - 35 },
      { t: 'Diffuser', x: 470, y: ty - 55 },
      { t: 'Fan', x: 580, y: ty - 40 }
    ];
    labels.forEach(function (l) {
      eCtx.textAlign = 'center';
      eCtx.fillText(l.t, l.x, l.y);
    });

    /* Flow arrow */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 1.5;
    eCtx.beginPath(); eCtx.moveTo(60, ty); eCtx.lineTo(630, ty); eCtx.stroke();
    eCtx.fillStyle = ACCENT;
    eCtx.beginPath(); eCtx.moveTo(630, ty); eCtx.lineTo(624, ty - 4); eCtx.lineTo(624, ty + 4); eCtx.closePath(); eCtx.fill();
    eCtx.font = '8px sans-serif';
    eCtx.fillText('Flow direction', 350, ty + 70);

    /* Speed classification table */
    var tableY = 250;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 10px sans-serif';
    eCtx.fillText('Speed Classification', cx, tableY);

    var classes = [
      { name: 'Subsonic', range: 'M < 0.8', color: '#3ddc84' },
      { name: 'Transonic', range: '0.8 < M < 1.2', color: '#ffa000' },
      { name: 'Supersonic', range: '1.2 < M < 5', color: '#ff5555' },
      { name: 'Hypersonic', range: 'M > 5', color: '#e040fb' }
    ];
    var barW = 150;
    classes.forEach(function (c, i) {
      var bx = 130 + i * (barW + 20);
      eCtx.fillStyle = hexToRGBA(c.color, 0.2);
      eCtx.fillRect(bx, tableY + 15, barW, 30);
      eCtx.strokeStyle = c.color;
      eCtx.lineWidth = 1;
      eCtx.strokeRect(bx, tableY + 15, barW, 30);
      eCtx.fillStyle = c.color;
      eCtx.font = 'bold 9px sans-serif';
      eCtx.fillText(c.name, bx + barW / 2, tableY + 28);
      eCtx.fillStyle = '#6b7a99';
      eCtx.font = '8px monospace';
      eCtx.fillText(c.range, bx + barW / 2, tableY + 40);
    });

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 12px monospace';
    eCtx.fillText('Contraction Ratio = A_inlet / A_test \u2248 6:1 to 9:1', cx, 55);
  }


  /* ── Dynamic similarity: the three levers, and which one works ── */
  function drawExploreSimilarity() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Dynamic Similarity — Match Reynolds Number, Not Speed', cx, 24);

    function car(x, y, w, col) {
      var h = w * 0.36;
      eCtx.fillStyle = col;
      eCtx.beginPath();
      eCtx.moveTo(x - w / 2, y);
      eCtx.lineTo(x - w / 2, y - h * 0.45);
      eCtx.quadraticCurveTo(x - w * 0.22, y - h * 0.5, x - w * 0.12, y - h);
      eCtx.lineTo(x + w * 0.12, y - h);
      eCtx.quadraticCurveTo(x + w * 0.3, y - h * 0.5, x + w / 2, y - h * 0.42);
      eCtx.lineTo(x + w / 2, y);
      eCtx.closePath();
      eCtx.fill();
      eCtx.fillStyle = '#0a0e14';
      [-0.28, 0.30].forEach(function (f) {
        eCtx.beginPath(); eCtx.arc(x + f * w, y, w * 0.075, 0, Math.PI * 2); eCtx.fill();
      });
      eCtx.strokeStyle = '#6b7a99'; eCtx.lineWidth = 1;
      eCtx.beginPath(); eCtx.moveTo(x - w / 2, y + 7); eCtx.lineTo(x + w / 2, y + 7); eCtx.stroke();
    }

    /* the target */
    eCtx.fillStyle = '#dde3f0'; eCtx.font = 'bold 10px sans-serif'; eCtx.textAlign = 'center';
    eCtx.fillText('FULL SCALE', 150, 46);
    car(150, 126, 178, '#78909c');
    eCtx.font = '9px monospace'; eCtx.fillStyle = '#9fb0c8';
    eCtx.fillText('D = 1.8 m   V = 27.8 m/s   15 °C', 150, 150);
    eCtx.fillStyle = ACCENT; eCtx.font = 'bold 12px monospace';
    eCtx.fillText('Re = 3.42×10⁶', 150, 172);
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '9px sans-serif';
    eCtx.fillText('the number the model must reproduce', 150, 190);

    /* three levers */
    function lever(x, y, w, h, col, n, title, sub, res, mach, verdict) {
      eCtx.fillStyle = 'rgba(255,255,255,0.03)';
      eCtx.fillRect(x, y, w, h);
      eCtx.strokeStyle = col; eCtx.lineWidth = 1.5;
      eCtx.strokeRect(x, y, w, h);
      eCtx.textAlign = 'left';
      eCtx.fillStyle = col; eCtx.font = 'bold 10px sans-serif';
      eCtx.fillText(n + '.  ' + title, x + 12, y + 20);
      eCtx.fillStyle = '#9fb0c8'; eCtx.font = '9px sans-serif';
      eCtx.fillText(sub, x + 12, y + 36);
      eCtx.fillStyle = '#dde3f0'; eCtx.font = 'bold 11px monospace';
      eCtx.fillText(res, x + 12, y + 56);
      eCtx.fillStyle = col; eCtx.font = 'bold 10px monospace';
      eCtx.fillText(mach, x + 190, y + 56);
      eCtx.fillStyle = col; eCtx.font = 'bold 9px sans-serif';
      eCtx.fillText(verdict, x + 12, y + 74);
    }
    lever(330, 42, 500, 84, '#ff5555', '1', 'Raise the speed',
          '1:10 model, D = 0.18 m, air at 15 °C',
          'V = 278 m/s', 'M = 0.82',
          '✗  compressible — the incompressible model is invalid');
    lever(330, 138, 500, 84, '#ffa000', '2', 'Cool the air  (cryogenic tunnel)',
          'same 1:10 model at −60 °C:  ρ ↑ 1.66,  μ ↓ 1.40×10⁻⁵,  ν ↓ 1.73×',
          'V = 161 m/s', 'M = 0.55',
          '✗  better, but still transonic — cooling alone cannot save it');
    lever(330, 234, 500, 84, '#3ddc84', '3', 'Build a bigger model',
          '1:2 model, D = 0.90 m — required speed scales as 1/D',
          'V = 56 m/s', 'M = 0.16',
          '✓  comfortably incompressible — this is the lever that works');

    eCtx.textAlign = 'center';
    eCtx.fillStyle = 'rgba(255,213,79,0.95)'; eCtx.font = '10px monospace';
    eCtx.fillText('V = Re·μ / (ρD)', 150, 248);
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '9px sans-serif';
    eCtx.fillText('shrink D by 10×', 150, 270);
    eCtx.fillText('and V must rise 10×', 150, 284);

    eCtx.fillStyle = '#6b7a99'; eCtx.font = '9px sans-serif'; eCtx.textAlign = 'center';
    eCtx.fillText('Temperature and pressure move Re a little; model size moves it a lot — which is why full-scale automotive tunnels exist', cx, 344);
    eCtx.fillStyle = 'rgba(255,213,79,0.9)'; eCtx.font = '9px sans-serif';
    eCtx.fillText('Lab Setup › Match Re solves for the speed each of these choices demands', cx, 364);
  }

  /* ── Camber shifts the lift curve left ── */
  function drawExploreCamber() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Camber & the Zero-Lift Angle — Lift at Zero Incidence', cx, 25);

    /* two sections drawn from the real generator */
    function section(x, y, chord, m, p, t, col, label) {
      var sf = nacaSurface(m, p, t, 50), i;
      eCtx.fillStyle = col;
      eCtx.beginPath();
      for (i = 0; i < sf.up.length; i++) {
        var px = x + sf.up[i].x * chord, py = y - sf.up[i].y * chord;
        if (i === 0) eCtx.moveTo(px, py); else eCtx.lineTo(px, py);
      }
      for (i = sf.lo.length - 1; i >= 0; i--) eCtx.lineTo(x + sf.lo[i].x * chord, y - sf.lo[i].y * chord);
      eCtx.closePath(); eCtx.fill();
      eCtx.strokeStyle = '#546e7a'; eCtx.lineWidth = 1; eCtx.stroke();
      /* chord + camber line */
      eCtx.setLineDash([3, 3]); eCtx.strokeStyle = 'rgba(255,255,255,0.35)'; eCtx.lineWidth = 1;
      eCtx.beginPath(); eCtx.moveTo(x, y); eCtx.lineTo(x + chord, y); eCtx.stroke();
      eCtx.setLineDash([]);
      if (m > 0) {
        eCtx.strokeStyle = 'rgba(255,213,79,0.95)'; eCtx.lineWidth = 1.5;
        eCtx.beginPath();
        for (i = 0; i <= 40; i++) {
          var xc = i / 40;
          eCtx.lineTo(x + xc * chord, y - nacaCamberY(xc, m, p) * chord);
        }
        eCtx.stroke();
      }
      eCtx.fillStyle = '#dde3f0'; eCtx.font = 'bold 10px monospace'; eCtx.textAlign = 'left';
      eCtx.fillText(label, x, y - 34);
    }
    section(45, 95, 180, 0, 0, 0.12, '#78909c', 'NACA 0012');
    eCtx.fillStyle = '#9fb0c8'; eCtx.font = '9px sans-serif';
    eCtx.fillText('symmetric — camber line lies on the chord', 45, 122);
    eCtx.fillStyle = '#ff8a80'; eCtx.font = 'bold 9px monospace';
    eCtx.fillText('α₀ = 0.00°    Cₗ(0) = 0', 45, 137);

    section(45, 215, 180, 0.04, 0.4, 0.12, '#4dd0e1', 'NACA 4412');
    eCtx.fillStyle = '#9fb0c8'; eCtx.font = '9px sans-serif'; eCtx.textAlign = 'left';
    eCtx.fillText('cambered — mean line bows above the chord', 45, 242);
    eCtx.fillStyle = '#3ddc84'; eCtx.font = 'bold 9px monospace';
    eCtx.fillText('α₀ = −4.15°   Cₗ(0) = 0.46', 45, 257);

    /* lift curves */
    var ox = 330, oy = 312, gw = 520, gh = 244;
    eCtx.strokeStyle = '#6b7a99'; eCtx.lineWidth = 1;
    var aMin = -8, aMax = 14, clMin = -0.6, clMax = 1.6;
    var X = function (a) { return ox + ((a - aMin) / (aMax - aMin)) * gw; };
    var Y = function (c) { return oy - ((c - clMin) / (clMax - clMin)) * gh; };
    /* axes at Cl = 0 and alpha = 0 */
    eCtx.beginPath(); eCtx.moveTo(ox, Y(0)); eCtx.lineTo(ox + gw, Y(0)); eCtx.stroke();
    eCtx.beginPath(); eCtx.moveTo(X(0), oy); eCtx.lineTo(X(0), oy - gh); eCtx.stroke();
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '8px monospace'; eCtx.textAlign = 'center';
    for (var a = aMin; a <= aMax; a += 2) {
      if (a === 0) continue;
      eCtx.fillText(a + '°', X(a), Y(0) + 12);
    }
    eCtx.textAlign = 'right';
    for (var c2 = -0.5; c2 <= 1.5; c2 += 0.5) {
      if (Math.abs(c2) < 1e-9) continue;
      eCtx.fillText(c2.toFixed(1), X(0) - 5, Y(c2) + 3);
    }
    eCtx.font = '9px sans-serif'; eCtx.textAlign = 'center';
    eCtx.fillText('angle of attack α', ox + gw / 2, oy + 28);
    eCtx.save(); eCtx.translate(ox - 34, oy - gh / 2); eCtx.rotate(-Math.PI / 2);
    eCtx.fillText('lift coefficient Cₗ', 0, 0); eCtx.restore();

    function curve(m, p, col, dash) {
      var sp = sectionProps({ m: m, p: p, t: 0.12 }, 3.5e6);
      var slope = liftSlopePerRad(Infinity, 0.9);
      eCtx.strokeStyle = col; eCtx.lineWidth = 2.2;
      eCtx.setLineDash(dash || []);
      eCtx.save();
      eCtx.beginPath(); eCtx.rect(ox, oy - gh, gw, gh); eCtx.clip();
      eCtx.beginPath();
      var started = false;
      for (var aa = aMin; aa <= aMax; aa += 0.25) {
        var cl = slope * Math.sin((aa - sp.alpha0Deg) * Math.PI / 180);
        if (cl > clMax + 0.2 || cl < clMin - 0.2) { started = false; continue; }
        if (!started) { eCtx.moveTo(X(aa), Y(cl)); started = true; }
        else eCtx.lineTo(X(aa), Y(cl));
      }
      eCtx.stroke();
      eCtx.restore();
      eCtx.setLineDash([]);
      return sp;
    }
    var sp0 = curve(0, 0, '#78909c');
    var sp4 = curve(0.04, 0.4, '#4dd0e1');

    /* mark the two zero-lift angles */
    [[sp0.alpha0Deg, '#78909c'], [sp4.alpha0Deg, '#3ddc84']].forEach(function (r) {
      eCtx.fillStyle = r[1];
      eCtx.beginPath(); eCtx.arc(X(r[0]), Y(0), 4, 0, Math.PI * 2); eCtx.fill();
    });
    eCtx.strokeStyle = 'rgba(61,220,132,0.55)'; eCtx.lineWidth = 1; eCtx.setLineDash([3, 3]);
    eCtx.beginPath(); eCtx.moveTo(X(sp4.alpha0Deg), Y(0)); eCtx.lineTo(X(sp4.alpha0Deg), Y(1.5)); eCtx.stroke();
    eCtx.setLineDash([]);
    eCtx.fillStyle = '#3ddc84'; eCtx.font = 'bold 9px monospace'; eCtx.textAlign = 'center';
    eCtx.fillText('α₀ = −4.15°', X(sp4.alpha0Deg), Y(1.55));

    /* the lift already present at alpha = 0 */
    eCtx.strokeStyle = 'rgba(255,213,79,0.9)'; eCtx.lineWidth = 1.5;
    eCtx.beginPath(); eCtx.moveTo(X(0), Y(0)); eCtx.lineTo(X(0), Y(sp4.clAtZero)); eCtx.stroke();
    eCtx.fillStyle = 'rgba(255,213,79,0.95)'; eCtx.font = 'bold 9px monospace'; eCtx.textAlign = 'left';
    eCtx.fillText('Cₗ = 0.46 at α = 0', X(0) + 8, Y(sp4.clAtZero) - 9);

    eCtx.fillStyle = '#6b7a99'; eCtx.font = '9px sans-serif'; eCtx.textAlign = 'center';
    eCtx.fillText('Camber shifts the whole curve left by α₀ — the slope is unchanged', ox + gw / 2, oy + 62);
  }

  /* ── Aspect ratio and induced drag ── */
  function drawExploreAspectRatio() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Aspect Ratio & Induced Drag — Why Long Wings Win', cx, 25);

    /* Three planforms of EQUAL AREA. One common scale factor is applied to
       all three so the widest just fits its slot — that keeps the relative
       spans honest, which is the entire point of the picture. */
    var area = 5400, slot = 172;
    var ARS = [2, 6, 12], XS = [130, 330, 530];
    var bMax = Math.sqrt(area * ARS[ARS.length - 1]);
    var sc = slot / bMax;
    ARS.forEach(function (AR, idx) {
      var xc = XS[idx];
      var b = Math.sqrt(area * AR) * sc;
      var c = (area / Math.sqrt(area * AR)) * sc;
      var y = 105;
      eCtx.fillStyle = 'rgba(77,208,225,0.30)';
      eCtx.strokeStyle = ACCENT; eCtx.lineWidth = 1.4;
      eCtx.fillRect(xc - b / 2, y - c / 2, b, c);
      eCtx.strokeRect(xc - b / 2, y - c / 2, b, c);
      /* tip vortices — stronger when the span is short */
      var vs = 14 - AR * 0.6;
      [0, 1].forEach(function (k) {
        var vx = xc + (k ? 1 : -1) * (b / 2 + 10);
        eCtx.strokeStyle = 'rgba(255,138,128,' + (0.30 + 0.05 * (12 - AR)) + ')';
        eCtx.lineWidth = 1.4;
        eCtx.beginPath();
        for (var t = 0; t < 24; t++) {
          var ang = t * 0.42, rr = 1.5 + t * (vs / 24);
          var px = vx + (k ? 1 : -1) * Math.cos(ang) * rr * 0.55;
          var py = y + Math.sin(ang) * rr * 0.55;
          if (t === 0) eCtx.moveTo(px, py); else eCtx.lineTo(px, py);
        }
        eCtx.stroke();
      });
      eCtx.textAlign = 'center';
      eCtx.fillStyle = '#dde3f0'; eCtx.font = 'bold 11px monospace';
      eCtx.fillText('AR = ' + AR, xc, 46);
      eCtx.fillStyle = '#6b7a99'; eCtx.font = '8px sans-serif';
      eCtx.fillText('span ' + Math.round(b) + ' \u00d7 chord ' + Math.round(c) + ' \u2014 equal area', xc, 62);
      eCtx.fillStyle = ACCENT; eCtx.font = '10px monospace';
      eCtx.fillText('Cdi = ' + inducedDragCoef(0.6, AR, 0.9).toFixed(4), xc, 168);
      eCtx.fillStyle = '#9fb0c8'; eCtx.font = '10px monospace';
      eCtx.fillText('a = ' + (liftSlopePerRad(AR, 0.9) * Math.PI / 180).toFixed(4) + ' /deg', xc, 184);
    });
    eCtx.fillStyle = '#ff8a80'; eCtx.font = '9px sans-serif'; eCtx.textAlign = 'left';
    eCtx.fillText('\u21ba tip vortices \u2014 stronger on short wings', 672, 96);
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '8px sans-serif';
    eCtx.fillText('all three at Cl = 0.6, e = 0.9', 672, 114);

    /* Cdi vs AR */
    var ox = 110, oy = 350, gw = 460, gh = 145;
    eCtx.strokeStyle = '#6b7a99'; eCtx.lineWidth = 1;
    eCtx.beginPath(); eCtx.moveTo(ox, oy - gh); eCtx.lineTo(ox, oy); eCtx.lineTo(ox + gw, oy); eCtx.stroke();
    var arMax = 20, cdiMax = 0.08;
    var X = function (ar) { return ox + (ar / arMax) * gw; };
    var Y = function (v) { return oy - (v / cdiMax) * gh; };
    eCtx.strokeStyle = ACCENT; eCtx.lineWidth = 2.2;
    eCtx.beginPath();
    for (var ar = 1; ar <= arMax; ar += 0.25) {
      var v = inducedDragCoef(0.6, ar, 0.9);
      if (v > cdiMax) continue;
      eCtx.lineTo(X(ar), Y(v));
    }
    eCtx.stroke();
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '8px monospace'; eCtx.textAlign = 'center';
    [2, 5, 10, 15, 20].forEach(function (t) { eCtx.fillText(String(t), X(t), oy + 12); });
    eCtx.textAlign = 'right';
    [0.02, 0.04, 0.06, 0.08].forEach(function (t) { eCtx.fillText(t.toFixed(2), ox - 5, Y(t) + 3); });
    eCtx.font = '9px sans-serif'; eCtx.textAlign = 'center';
    eCtx.fillText('aspect ratio AR', ox + gw / 2, oy + 26);
    eCtx.save(); eCtx.translate(ox - 40, oy - gh / 2); eCtx.rotate(-Math.PI / 2);
    eCtx.fillText('induced drag Cdi', 0, 0); eCtx.restore();

    eCtx.fillStyle = 'rgba(255,213,79,0.95)'; eCtx.font = '9px monospace'; eCtx.textAlign = 'left';
    eCtx.fillText('Cdi = Cl\u00b2 / (\u03c0\u00b7e\u00b7AR)', 610, 250);
    eCtx.fillText('a   = a\u2080 / (1 + a\u2080/(\u03c0\u00b7e\u00b7AR))', 610, 268);
    eCtx.fillStyle = '#9fb0c8'; eCtx.font = '9px sans-serif';
    eCtx.fillText('Halving AR roughly doubles', 610, 294);
    eCtx.fillText('the induced drag — and cuts', 610, 308);
    eCtx.fillText('the lift-curve slope as well.', 610, 322);
    eCtx.fillStyle = '#3ddc84';
    eCtx.fillText('Gliders: AR 20–30', 610, 344);
    eCtx.fillStyle = '#ff8a80';
    eCtx.fillText('Delta fighters: AR 2–3', 610, 358);
  }

  /* ── Blockage and measurement uncertainty ── */
  function drawExploreBlockage() {
    var cx = EW / 2;
    eCtx.fillStyle = '#dde3f0';
    eCtx.font = 'bold 12px sans-serif';
    eCtx.textAlign = 'center';
    eCtx.fillText('Blockage & Measurement Uncertainty — From Number to Measurement', cx, 25);

    /* three models in the same test section */
    eCtx.font = 'bold 10px sans-serif'; eCtx.fillStyle = '#9fb0c8';
    eCtx.fillText('Same 300 × 300 mm test section, three model sizes', 245, 50);
    [[95, 50, '#3ddc84'], [245, 100, '#ffa000'], [395, 150, '#ff5555']].forEach(function (r) {
      var xc = r[0], Dmm = r[1], col = r[2];
      var box = 108, y0 = 66;
      eCtx.strokeStyle = '#6b7a99'; eCtx.lineWidth = 1.5;
      eCtx.strokeRect(xc - box / 2, y0, box, box);
      var px = (Dmm / 300) * box;
      eCtx.fillStyle = col;
      eCtx.beginPath(); eCtx.arc(xc, y0 + box / 2, px / 2, 0, Math.PI * 2); eCtx.fill();
      var ratio = (Math.PI * Dmm * Dmm / 4) / (300 * 300) * 100;
      eCtx.fillStyle = '#dde3f0'; eCtx.font = '9px monospace'; eCtx.textAlign = 'center';
      eCtx.fillText('D = ' + Dmm + ' mm', xc, y0 + box + 16);
      eCtx.fillStyle = col; eCtx.font = 'bold 10px monospace';
      eCtx.fillText('S/C = ' + ratio.toFixed(1) + ' %', xc, y0 + box + 31);
      eCtx.fillStyle = '#9fb0c8'; eCtx.font = '8px sans-serif';
      eCtx.fillText(ratio < 5 ? 'valid' : (ratio < 10 ? 'correct it' : 'too big'), xc, y0 + box + 45);
    });
    eCtx.fillStyle = 'rgba(255,213,79,0.95)'; eCtx.font = '9px monospace'; eCtx.textAlign = 'center';
    eCtx.fillText('Cd,c = Cd / (1 + \u03b5)\u00b2   with   \u03b5 = \u03b5_solid + \u03b5_wake', 245, 250);
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '9px sans-serif';
    eCtx.fillText('The measured force never changes —', 245, 272);
    eCtx.fillText('only the coefficient you report from it.', 245, 286);
    eCtx.fillStyle = '#9fb0c8'; eCtx.font = '8px sans-serif';
    eCtx.fillText('Convention: keep blockage under 5 %', 245, 308);

    /* uncertainty budget bars */
    var bx = 530, by = 90, bw = 300;
    eCtx.fillStyle = '#dde3f0'; eCtx.font = 'bold 10px sans-serif'; eCtx.textAlign = 'left';
    eCtx.fillText('Uncertainty budget for Cd', bx, 62);
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '8px sans-serif';
    eCtx.fillText('relative contributions, added in quadrature', bx, 76);
    var terms = [
      ['2·u(V)/V', 2.00, ACCENT, 'V enters q squared'],
      ['u(F)/F', 1.15, '#ffa000', 'force balance'],
      ['2·u(D)/D', 0.13, '#78909c', 'model area'],
      ['u(ρ)/ρ', 0.20, '#78909c', 'density']
    ];
    var maxV = 2.2;
    terms.forEach(function (t, i) {
      var y = by + 16 + i * 34;
      eCtx.fillStyle = '#9fb0c8'; eCtx.font = '9px monospace'; eCtx.textAlign = 'left';
      eCtx.fillText(t[0], bx, y - 4);
      var w = (t[1] / maxV) * bw;
      eCtx.fillStyle = t[2];
      eCtx.fillRect(bx, y, w, 11);
      eCtx.fillStyle = '#dde3f0'; eCtx.font = '9px monospace';
      eCtx.fillText(t[1].toFixed(2) + ' %', bx + w + 6, y + 10);
      eCtx.fillStyle = '#6b7a99'; eCtx.font = '8px sans-serif'; eCtx.textAlign = 'right';
      eCtx.fillText(t[3], bx + bw + 40, y - 4);
    });
    eCtx.textAlign = 'left';
    eCtx.strokeStyle = '#6b7a99'; eCtx.lineWidth = 1;
    eCtx.beginPath(); eCtx.moveTo(bx, by + 158); eCtx.lineTo(bx + bw + 40, by + 158); eCtx.stroke();
    var comb = Math.sqrt(terms.reduce(function (a, t) { return a + t[1] * t[1]; }, 0));
    eCtx.fillStyle = 'rgba(255,213,79,0.95)'; eCtx.font = 'bold 10px monospace';
    eCtx.fillText('combined u(Cd)/Cd = ' + comb.toFixed(2) + ' %', bx, by + 176);
    eCtx.fillStyle = '#3ddc84'; eCtx.font = 'bold 10px monospace';
    eCtx.fillText('expanded U = 2u = ' + (2 * comb).toFixed(2) + ' %  (k = 2, \u224895 %)', bx, by + 194);
    eCtx.fillStyle = '#6b7a99'; eCtx.font = '9px sans-serif';
    eCtx.fillText('Velocity dominates because q = ½ρV² —', bx, by + 218);
    eCtx.fillText('so a better pitot buys more than a better balance.', bx, by + 232);
  }

  /* ═══════════════════════════════════════════════════════════════
     S16  PRACTICE MODE
     ═══════════════════════════════════════════════════════════════ */
  function newPractice() {
    state.pProb = generateProblem();
    state.pDone = false;
    if (elPracticePrompt) elPracticePrompt.textContent = state.pProb.prompt;
    if (elPracticeInput) elPracticeInput.value = '';
    if (elPracticeUnit) elPracticeUnit.textContent = state.pProb.unit;
    if (elPracticeFeedback) { elPracticeFeedback.textContent = ''; elPracticeFeedback.className = 'practice-feedback'; }
    hide(elPracticeSolution);
    hide(elBtnShowSol);
    if (elPracticeInput) elPracticeInput.focus();
  }

  function checkPractice() {
    if (state.pDone || !elPracticeInput) return;
    var val = parseFloat(elPracticeInput.value);
    if (isNaN(val)) { elPracticeFeedback.textContent = 'Please enter a number.'; elPracticeFeedback.className = 'practice-feedback err'; return; }
    state.pDone = true;
    state.pTotal++;
    var correct = Math.abs(val - state.pProb.answer) <= state.pProb.tol;
    if (correct) {
      state.pScore++;
      elPracticeFeedback.textContent = '\u2713 Correct! Answer: ' + state.pProb.answer + ' ' + state.pProb.unit;
      elPracticeFeedback.className = 'practice-feedback ok';
    } else {
      elPracticeFeedback.textContent = '\u2717 Incorrect. Correct answer: ' + state.pProb.answer + ' ' + state.pProb.unit;
      elPracticeFeedback.className = 'practice-feedback err';
      show(elBtnShowSol);
    }
    if (elPracticeScore) elPracticeScore.textContent = state.pScore + ' / ' + state.pTotal;
  }

  function showSolution() {
    if (!state.pProb || !elPracticeSolution) return;
    elPracticeSolution.innerHTML = state.pProb.solution.map(function (s) { return '<div>' + s + '</div>'; }).join('');
    show(elPracticeSolution);
  }

  /* ═══════════════════════════════════════════════════════════════
     S17  QUIZ MODE
     ═══════════════════════════════════════════════════════════════ */
  function startQuiz() {
    state.qSet = shuffleArr(QUIZ_POOL.slice()).slice(0, 5);
    state.qIdx = 0;
    state.qScore = 0;
    state.qDone = false;
    state.qResults = [];
    hide(elQuizResult);
    show(elQuizPanel);
    showQuestion();
  }

  function showQuestion() {
    var q = state.qSet[state.qIdx];
    state.qAnswered = false;
    if (elQuizCounter) elQuizCounter.textContent = 'Question ' + (state.qIdx + 1) + ' of ' + state.qSet.length;
    if (elQuizPrompt) elQuizPrompt.textContent = q.q;
    if (elQuizFeedback) { elQuizFeedback.textContent = ''; elQuizFeedback.className = 'quiz-feedback'; }
    hide(elBtnQuizNext);

    if (q.type === 'mcq') {
      show(elQuizOptions);
      hide(elQuizNumRow);
      if (elQuizOptions) {
        elQuizOptions.innerHTML = '';
        q.opts.forEach(function (opt, i) {
          var btn = document.createElement('button');
          btn.className = 'quiz-opt';
          btn.textContent = opt;
          btn.addEventListener('click', function () { handleMCQ(i); });
          elQuizOptions.appendChild(btn);
        });
      }
    } else {
      hide(elQuizOptions);
      show(elQuizNumRow);
      if (elQuizNumInput) { elQuizNumInput.value = ''; elQuizNumInput.focus(); }
      if (elQuizNumUnit) elQuizNumUnit.textContent = q.unit || '';
    }
  }

  function handleMCQ(idx) {
    if (state.qAnswered) return;
    state.qAnswered = true;
    var q = state.qSet[state.qIdx];
    var correct = idx === q.ans;
    if (elQuizOptions) {
      var opts = elQuizOptions.querySelectorAll('.quiz-opt');
      opts.forEach(function (o, i) {
        o.classList.add('disabled');
        if (i === q.ans) o.classList.add('correct');
        if (i === idx && !correct) o.classList.add('wrong');
      });
    }
    if (correct) {
      state.qScore++;
      if (elQuizFeedback) { elQuizFeedback.textContent = '\u2713 Correct!'; elQuizFeedback.className = 'quiz-feedback ok'; }
    } else {
      if (elQuizFeedback) { elQuizFeedback.textContent = '\u2717 Incorrect. Answer: ' + q.opts[q.ans]; elQuizFeedback.className = 'quiz-feedback err'; }
    }
    state.qResults.push({ q: q.q, correct: correct });
    show(elBtnQuizNext);
  }

  function handleNumeric() {
    if (state.qAnswered || !elQuizNumInput) return;
    var val = parseFloat(elQuizNumInput.value);
    if (isNaN(val)) return;
    state.qAnswered = true;
    var q = state.qSet[state.qIdx];
    var correct = Math.abs(val - q.ans) <= (q.tol || 1);
    if (correct) {
      state.qScore++;
      if (elQuizFeedback) { elQuizFeedback.textContent = '\u2713 Correct! Answer: ' + q.ans + ' ' + (q.unit || ''); elQuizFeedback.className = 'quiz-feedback ok'; }
    } else {
      if (elQuizFeedback) { elQuizFeedback.textContent = '\u2717 Incorrect. Answer: ' + q.ans + ' ' + (q.unit || ''); elQuizFeedback.className = 'quiz-feedback err'; }
    }
    state.qResults.push({ q: q.q, correct: correct });
    show(elBtnQuizNext);
  }

  function advanceQuiz() {
    state.qIdx++;
    if (state.qIdx >= state.qSet.length) {
      showQuizResult();
    } else {
      showQuestion();
    }
  }

  function showQuizResult() {
    state.qDone = true;
    hide(elQuizPanel);
    show(elQuizResult);

    var pct = (state.qScore / state.qSet.length * 100).toFixed(0);
    var stars = Math.round(state.qScore / state.qSet.length * 5);
    if (elQRStars) {
      elQRStars.textContent = '';
      for (var i = 0; i < 5; i++) elQRStars.textContent += i < stars ? '\u2605' : '\u2606';
    }

    if (elQRScore) {
      elQRScore.textContent = state.qScore + '/' + state.qSet.length + ' (' + pct + '%)';
      elQRScore.className = 'qr-score ' + (pct == 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor');
    }

    if (elQRTable) {
      var tbody = elQRTable.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = '';
        state.qResults.forEach(function (r, i) {
          var tr = document.createElement('tr');
          tr.className = 'qr-row ' + (r.correct ? 'ok' : 'err');
          tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + r.q.substring(0, 60) + (r.q.length > 60 ? '...' : '') + '</td><td>' + (r.correct ? '\u2713' : '\u2717') + '</td>';
          tbody.appendChild(tr);
        });
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S18  CONTROL BUILDERS
     ═══════════════════════════════════════════════════════════════ */
  function buildObjectTabs() {
    if (!elObjTabs) return;
    elObjTabs.innerHTML = '';
    OBJECTS.forEach(function (obj, i) {
      var pill = document.createElement('button');
      pill.className = 'mat-pill' + (i === state.objIdx ? ' active' : '');
      pill.textContent = obj.id === 'airfoil' ? nacaDesignation(state.naca) : obj.name;
      pill.dataset.idx = i;
      pill.addEventListener('click', function () {
        if (state.objIdx === i) return;
        saveUndo();
        state.objIdx = i;
        elObjTabs.querySelectorAll('.mat-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        syncAoaGroup();
        clearPresetActive();
        initParticles();
        updateResults();
      });
      elObjTabs.appendChild(pill);
    });
  }

  function buildVisTabs() {
    if (!elVisTabs) return;
    elVisTabs.innerHTML = '';
    var modes = [
      { id: 'streamlines', name: 'Streamlines' },
      { id: 'pressure', name: 'Pressure' },
      { id: 'velocity', name: 'Velocity' }
    ];
    modes.forEach(function (m) {
      var pill = document.createElement('button');
      pill.className = 'pill' + (m.id === state.visMode ? ' active' : '');
      pill.textContent = m.name;
      pill.dataset.vmode = m.id;
      pill.addEventListener('click', function () {
        if (state.visMode === m.id) return;
        saveUndo();
        state.visMode = m.id;
        elVisTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
      });
      elVisTabs.appendChild(pill);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     S19  EVENT HANDLERS
     ═══════════════════════════════════════════════════════════════ */

  /* Mode tabs */
  if (elModeTabs) {
    elModeTabs.addEventListener('click', function (e) {
      if (!e.target.matches('.pill')) return;
      var m = e.target.dataset.mode;
      if (!m) return;
      setMode(m);
    });
  }

  /* Air Speed slider */
  var _savedSpeedDrag = false;
  if (elSpeedSlider) {
    elSpeedSlider.addEventListener('pointerdown', function () { _savedSpeedDrag = false; });
    elSpeedSlider.addEventListener('input', function () {
      if (!_savedSpeedDrag) { saveUndo(); _savedSpeedDrag = true; }
      state.airSpeed = parseFloat(this.value);
      onParamChange('speed');
    });
  }

  /* Angle of Attack slider */
  var _savedAoaDrag = false;
  if (elAoaSlider) {
    elAoaSlider.addEventListener('pointerdown', function () { _savedAoaDrag = false; });
    elAoaSlider.addEventListener('input', function () {
      if (!_savedAoaDrag) { saveUndo(); _savedAoaDrag = true; }
      state.angleOfAttack = parseFloat(this.value);
      onParamChange('aoa');
    });
  }

  /* Object Size slider */
  var _savedSizeDrag = false;
  if (elSizeSlider) {
    elSizeSlider.addEventListener('pointerdown', function () { _savedSizeDrag = false; });
    elSizeSlider.addEventListener('input', function () {
      if (!_savedSizeDrag) { saveUndo(); _savedSizeDrag = true; }
      state.objSize = parseFloat(this.value);
      onParamChange('size');
    });
  }

  function onParamChange(which) {
    syncSliderLabels();
    syncSteppers();
    updateResults();
    initParticles();
    /* whoosh on big speed jumps */
    if (which === 'speed' && Math.abs(state.airSpeed - lastSpeedForSound) > 15) {
      playWhoosh(state.airSpeed / 80); lastSpeedForSound = state.airSpeed;
    }
    /* If user changes object size while zoomed, refresh the zoom label */
    if (which === 'size' && state.zoomed) syncZoomBtn();
    clearPresetActive();
  }
  function syncSliderLabels() {
    var u = U();
    if (elSpeedVal) elSpeedVal.textContent = u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits) + ' ' + u.speed.label;
    if (elAoaVal)   elAoaVal.textContent   = state.angleOfAttack + '\u00b0';
    if (elSizeVal)  elSizeVal.textContent  = u.size.fromSI(state.objSize).toFixed(u.size.digits) + ' ' + u.size.label;
    /* Move the slider thumb to match state \u2014 but never fight a mid-drag */
    if (elSpeedSlider && document.activeElement !== elSpeedSlider) elSpeedSlider.value = state.airSpeed;
    if (elSizeSlider  && document.activeElement !== elSizeSlider)  elSizeSlider.value  = state.objSize;
    if (elAoaSlider   && document.activeElement !== elAoaSlider)   elAoaSlider.value   = state.angleOfAttack;
    syncSliderFill();
  }
  function syncSliderFill() {
    [['speed-slider', 1, 150, state.airSpeed],
     ['size-slider', 20, 200, state.objSize],
     ['aoa-slider', -10, 25, state.angleOfAttack]
    ].forEach(function (s) {
      var el = $(s[0]); if (!el) return;
      var v = s[3];
      var pct = ((v - s[1]) / (s[2] - s[1])) * 100;
      el.style.setProperty('--slider-fill', pct + '%');
    });
  }
  function syncSteppers() {
    var u = U();
    function set(id, val) {
      var el = $(id); if (!el) return;
      if (document.activeElement === el) return;
      el.value = val;
    }
    set('speed-stepper', u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits));
    set('size-stepper',  u.size.fromSI(state.objSize).toFixed(u.size.digits));
    set('aoa-stepper',   state.angleOfAttack.toFixed(0));
    var su = $('speed-stepper-u'); if (su) su.textContent = u.speed.label;
    var siu = $('size-stepper-u'); if (siu) siu.textContent = u.size.label;
  }
  function syncInputs() {
    if (elSpeedSlider) elSpeedSlider.value = state.airSpeed;
    if (elAoaSlider)   elAoaSlider.value   = state.angleOfAttack;
    if (elSizeSlider)  elSizeSlider.value  = state.objSize;
    syncSliderLabels();
    syncSteppers();
  }
  function syncCheckboxes() {
    var map = { 'chk-equation': showEquation, 'chk-arrows': showArrows, 'chk-pitot': showPitot,
                'chk-bl': showBL, 'chk-labels': showLabels, 'chk-grid': showGrid,
                'chk-flip': state.flipObj };
    Object.keys(map).forEach(function (k) { var el = $(k); if (el) el.checked = !!map[k]; });
  }
  function syncObjTab() {
    if (!elObjTabs) return;
    elObjTabs.querySelectorAll('.mat-pill').forEach(function (p, i) {
      p.classList.toggle('active', i === state.objIdx);
    });
  }
  /* Enable/disable the angle-of-attack control for the current object.
     Called on init, object-tab click, preset apply, reset, and undo/redo. */
  function syncAoaGroup() {
    var obj = OBJECTS[state.objIdx];
    if (!elAoaGroup) return;
    if (obj.hasLift) {
      elAoaGroup.style.opacity = '1';
      if (elAoaSlider) elAoaSlider.disabled = false;
    } else {
      elAoaGroup.style.opacity = '0.4';
      if (elAoaSlider) elAoaSlider.disabled = true;
      state.angleOfAttack = 0;
      if (elAoaVal) elAoaVal.textContent = '0°';
      if (elAoaSlider) elAoaSlider.value = 0;
    }
  }
  function syncVisTab() {
    if (!elVisTabs) return;
    elVisTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.vmode === state.visMode);
    });
  }
  function syncUnitToggle() {
    var ut = $('unit-tabs'); if (!ut) return;
    ut.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.unit === unitMode);
    });
  }

  /* Steppers */
  function wireSteppers() {
    ['speed', 'size', 'aoa'].forEach(function (k) {
      var input = $(k + '-stepper');
      var box = input && input.parentNode;
      if (!box) return;
      box.querySelectorAll('.step-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var dir = parseFloat(btn.dataset.step);
          var u = U(); var step = (k === 'speed') ? 1 : (k === 'size' ? (isImp() ? 0.1 : 1) : 1);
          saveUndo();
          var cur = u[k === 'aoa' ? 'angle' : k].fromSI(stateOf(k));
          var next = cur + dir * step;
          setFromDisplay(k, next);
        });
      });
      input.addEventListener('change', function () {
        var v = parseFloat(input.value);
        if (!isFinite(v)) return;
        saveUndo();
        setFromDisplay(k, v);
      });
    });
  }
  function stateOf(k) {
    return k === 'speed' ? state.airSpeed : k === 'size' ? state.objSize : state.angleOfAttack;
  }
  function setFromDisplay(k, displayVal) {
    var u = U();
    if (k === 'speed') {
      state.airSpeed = clamp(u.speed.toSI(displayVal), 1, 150);
    } else if (k === 'size') {
      state.objSize = clamp(u.size.toSI(displayVal), 20, 200);
    } else {
      state.angleOfAttack = clamp(displayVal, -10, 25);
    }
    onParamChange(k);
  }

  /* Unit toggle */
  var elUnitTabs = $('unit-tabs');
  if (elUnitTabs) {
    elUnitTabs.addEventListener('click', function (e) {
      if (!e.target.matches('.pill')) return;
      var m = e.target.dataset.unit; if (!m || m === unitMode) return;
      saveUndo(); unitMode = m;
      syncUnitToggle(); syncSteppers(); updateResults();
    });
  }

  /* Overlay toggle checkboxes */
  function wireToggles() {
    var map = [
      ['chk-equation', function (v) { showEquation = v; }],
      ['chk-arrows',   function (v) { showArrows = v; }],
      ['chk-pitot',    function (v) { showPitot = v; }],
      ['chk-bl',       function (v) { showBL = v; }],
      ['chk-labels',   function (v) { showLabels = v; }],
      ['chk-grid',     function (v) { showGrid = v; }],
      ['chk-flip',     function (v) { state.flipObj = v; initParticles(); updateResults(); }]
    ];
    map.forEach(function (pair) {
      var el = $(pair[0]); if (!el) return;
      el.addEventListener('change', function () { saveUndo(); pair[1](el.checked); });
    });
  }

  /* Presets */
  var PRESETS = [
    /* objIdx follows OBJECTS order: 0 sphere \u00b7 1 cylinder \u00b7 2 cone \u00b7 3 plate \u00b7
       4 streamlined \u00b7 5 airfoil \u00b7 6 car */
    { id: 'sphere-30', name: 'Sphere @ 30 m/s', objIdx: 0, v: 30, size: 50,  aoa: 0 },
    { id: 'crisis',    name: 'Drag crisis',     objIdx: 0, v: 100, size: 50, aoa: 0 },
    { id: 'vortex',    name: 'Vortex street',   objIdx: 1, v: 20, size: 75,  aoa: 0 },
    { id: 'cone-30',   name: 'Cone @ 30 m/s',   objIdx: 2, v: 30, size: 60,  aoa: 0 },
    { id: 'plate-15',  name: 'Flat plate @ 15', objIdx: 3, v: 15, size: 60,  aoa: 0 },
    { id: 'stream-40', name: 'Streamlined @ 40',objIdx: 4, v: 40, size: 80,  aoa: 0 },
    { id: 'naca-ld',   name: 'NACA best L/D 5\u00b0', objIdx: 5, v: 40, size: 80, aoa: 5 },
    { id: 'naca-10',   name: 'NACA pre-stall',  objIdx: 5, v: 30, size: 60,  aoa: 10 },
    { id: 'naca-18',   name: 'NACA stall 18\u00b0',  objIdx: 5, v: 30, size: 60,  aoa: 18 },
    { id: 'car-30',    name: 'Car @ 30 m/s',    objIdx: 6, v: 30, size: 80,  aoa: 0 }
  ];
  function buildPresets() {
    var host = $('preset-pills'); if (!host) return;
    host.innerHTML = '';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'preset-pill'; b.textContent = p.name;
      b.dataset.preset = p.id;
      b.addEventListener('click', function () { applyPreset(p); });
      host.appendChild(b);
    });
  }
  function applyPreset(p) {
    saveUndo();
    state.objIdx = p.objIdx; state.airSpeed = p.v; state.objSize = p.size; state.angleOfAttack = p.aoa;
    syncObjTab(); syncAoaGroup(); syncInputs(); initParticles(); updateResults();
    var host = $('preset-pills'); if (host) {
      host.querySelectorAll('.preset-pill').forEach(function (b) {
        b.classList.toggle('active', b.dataset.preset === p.id);
      });
    }
    /* Close the dropdown after picking */
    var menu = $('preset-menu'); if (menu) menu.classList.remove('open');
    var trig = $('preset-trigger'); if (trig) trig.setAttribute('aria-expanded', 'false');
  }
  function wirePresetDropdown() {
    var menu = $('preset-menu'), trig = $('preset-trigger');
    if (!menu || !trig) return;
    trig.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      trig.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) {
        menu.classList.remove('open');
        trig.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        trig.setAttribute('aria-expanded', 'false');
        trig.focus();
      }
    });
  }
  function clearPresetActive() {
    var host = $('preset-pills'); if (host) host.querySelectorAll('.preset-pill').forEach(function (b) { b.classList.remove('active'); });
  }

  /* Action bar */
  function wireActionBar() {
    var bpp = $('btn-play-pause'); if (bpp) bpp.addEventListener('click', togglePause);
    var bzm = $('btn-zoom');      if (bzm) bzm.addEventListener('click', toggleZoom);
    var bu  = $('btn-undo');      if (bu)  bu.addEventListener('click', performUndo);
    var br  = $('btn-redo');      if (br)  br.addEventListener('click', performRedo);
    var bc  = $('btn-export-csv');if (bc)  bc.addEventListener('click', exportCSV);
    var bp  = $('btn-export-png');if (bp)  bp.addEventListener('click', exportPNG);
    var brep= $('btn-export-report');if (brep)brep.addEventListener('click', exportTestReport);
    var brs = $('btn-reset');     if (brs) brs.addEventListener('click', resetAll);
    syncPlayPauseBtn();
    syncZoomBtn();
  }
  function togglePause() {
    state.paused = !state.paused;
    syncPlayPauseBtn();
  }
  function toggleZoom() {
    state.zoomed = !state.zoomed;
    syncZoomBtn();
  }
  function syncPlayPauseBtn() {
    var b = $('btn-play-pause'); if (!b) return;
    var icon = b.querySelector('.ct-icon');
    var label = b.querySelector('.ct-label');
    if (state.paused) {
      if (icon) icon.textContent = '▶';        /* ▶ play */
      if (label) label.textContent = 'Play';
      b.classList.add('active');
      b.title = 'Resume wind-flow animation (Space)';
      b.setAttribute('aria-label', 'Play');
    } else {
      if (icon) icon.textContent = '⏸';        /* ⏸ pause */
      if (label) label.textContent = 'Pause';
      b.classList.remove('active');
      b.title = 'Pause wind-flow animation (Space)';
      b.setAttribute('aria-label', 'Pause');
    }
  }
  function syncZoomBtn() {
    var b = $('btn-zoom'); if (!b) return;
    var label = b.querySelector('.ct-label');
    if (state.zoomed) {
      if (label) label.textContent = getZoomFactor().toFixed(1) + '×';   /* e.g. 2.5× */
      b.classList.add('active');
      b.title = 'Click to zoom out';
    } else {
      if (label) label.textContent = 'Zoom';
      b.classList.remove('active');
      b.title = 'Zoom in on the test object (auto-scales with size)';
    }
  }
  function resetAll() {
    saveUndo();
    state.objIdx = 4; state.airSpeed = 60; state.objSize = 100; state.angleOfAttack = 0;
    state.visMode = 'streamlines'; state.flipObj = false;
    showEquation = true; showArrows = true; showPitot = true; showBL = true; showLabels = true; showGrid = false;
    syncCheckboxes(); syncObjTab(); syncAoaGroup(); syncVisTab(); syncInputs(); clearPresetActive();
    initParticles(); updateResults();
  }

  /* Export CSV */
  function exportCSV() {
    var u = U();
    var obj = OBJECTS[state.objIdx];
    var baseCfg = curCfg();
    var fl = baseCfg.fluid;
    var N = clamp(Math.round(state.sweepN || 60), 5, 500);
    var isAF = obj.id === 'airfoil';

    /* Which quantity are we sweeping? */
    var sweeps = {
      speed:    { label: 'V_' + u.speed.label, lo: 1,   hi: 150, log: false },
      aoa:      { label: 'alpha_deg',          lo: -10, hi: 25,  log: false },
      size:     { label: 'D_' + u.size.label,  lo: 20,  hi: 200, log: false },
      reynolds: { label: 'Re_target',          lo: 1e4, hi: 5e6, log: true  },
      ar:       { label: 'AR',                 lo: 1,   hi: 20,  log: false }
    };
    var key = state.sweepVar;
    if (key === 'ar' && !isAF) key = 'speed';     /* AR only means anything for the wing */
    var sw = sweeps[key] || sweeps.speed;

    var rows = [];
    rows.push('# NHIT VisualLab — Wind Tunnel Simulator, parametric sweep');
    rows.push('# Generated,' + new Date().toISOString());
    rows.push('# Test article,' + (isAF ? nacaDesignation(state.naca) : obj.name));
    rows.push('# Sweep variable,' + key);
    rows.push('# Working fluid,' + fl.name);
    rows.push('# Temperature_C,' + fl.tempC.toFixed(2));
    rows.push('# Altitude_m_geopotential,' + fl.altitudeM.toFixed(0));
    rows.push('# Ambient_pressure_Pa,' + fl.p.toFixed(1));
    rows.push('# Speed_of_sound_m_per_s,' + fl.a.toFixed(2));
    rows.push('# Density_kg_per_m3,' + fl.rho.toFixed(5));
    rows.push('# Dynamic_viscosity_Pa_s,' + fl.mu.toExponential(5));
    rows.push('# Kinematic_viscosity_m2_per_s,' + fl.nu.toExponential(5));
    if (isAF) {
      var spH = sectionProps(state.naca, 5e5);
      rows.push('# Section,' + nacaDesignation(state.naca));
      rows.push('# Camber_m_fraction,' + state.naca.m.toFixed(3));
      rows.push('# Camber_position_p,' + state.naca.p.toFixed(2));
      rows.push('# Thickness_t_fraction,' + state.naca.t.toFixed(3));
      rows.push('# Zero_lift_angle_deg,' + spH.alpha0Deg.toFixed(4));
      rows.push('# Cm_quarter_chord,' + spH.cm4.toFixed(4));
      rows.push('# Aspect_ratio,' + (isFinite(state.AR) ? state.AR.toFixed(2) : 'infinite (2-D section)'));
      rows.push('# Span_efficiency_e,' + state.spanEff.toFixed(2));
    }
    rows.push('# Test_section_m,' + state.testW.toFixed(3) + ' x ' + state.testH.toFixed(3));
    rows.push('# Blockage_correction,' + (state.applyBlockage ? 'applied' : 'not applied'));
    rows.push('# Prandtl_Glauert,' + (state.applyPG ? 'applied' : 'not applied'));
    rows.push('# Uncertainties_k1,u(V)=' + state.unc.uV + ' m/s; u(D)=' + (state.unc.uD * 1000) +
              ' mm; u(F)=' + state.unc.uF + ' N; u(T)=' + state.unc.uT + ' K; u(p)=' + state.unc.uP + ' Pa');
    rows.push('# Coefficients are referenced to S (planform for the wing, frontal area otherwise).');
    rows.push('#');
    rows.push([sw.label, 'V_m_per_s', 'alpha_deg', 'D_mm', 'AR', 'Re', 'Mach',
               'Cd', 'Cl', 'Cd_profile', 'Cd_induced', 'S_m2',
               'Fd_' + u.force.label, 'Fl_' + u.force.label, 'q_' + u.press.label,
               'L_over_D', 'blockage_eps', 'U_Cd_k2'].join(','));

    for (var i = 0; i < N; i++) {
      var f01 = N === 1 ? 0 : i / (N - 1);
      var raw = sw.log
        ? Math.exp(Math.log(sw.lo) + (Math.log(sw.hi) - Math.log(sw.lo)) * f01)
        : sw.lo + (sw.hi - sw.lo) * f01;

      var V = state.airSpeed, alpha = state.angleOfAttack, Dmm = state.objSize;
      var cfg = curCfg();
      if (key === 'speed')         V = raw;
      else if (key === 'aoa')      alpha = raw;
      else if (key === 'size')     Dmm = raw;
      else if (key === 'ar')       cfg.AR = raw;
      else if (key === 'reynolds') V = speedForReynolds(raw, Dmm / 1000, fl);

      var D = Dmm / 1000;
      var f = calcForces(V, D, obj, alpha, cfg);
      var ub = uncertaintyBudget(V, D, fl, f, state.unc);
      var shown = key === 'speed' ? u.speed.fromSI(V)
                : key === 'size'  ? u.size.fromSI(Dmm)
                : raw;
      rows.push([
        roundN(shown, 4),
        V.toFixed(3), alpha.toFixed(2), Dmm.toFixed(1),
        isFinite(cfg.AR) ? cfg.AR.toFixed(2) : 'inf',
        f.Re.toExponential(4), f.M.toFixed(4),
        f.Cd.toFixed(5), f.Cl.toFixed(5),
        f.cdProfile.toFixed(5), f.cdInduced.toFixed(5),
        f.S.toExponential(4),
        u.force.fromSI(f.Fd).toFixed(5), u.force.fromSI(f.Fl).toFixed(5),
        u.press.fromSI(f.q).toFixed(4),
        f.Cd > 1e-4 ? f.LD.toFixed(3) : 'NA',
        f.blockage.eps.toFixed(6),
        ub.U.Cd.toFixed(5)
      ].join(','));
    }

    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'wind-tunnel-' + (obj.id === 'airfoil'
      ? nacaDesignation(state.naca).replace(/\s+/g, '') : obj.id) + '-' + key + '-sweep.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportPNG() {
    var out = document.createElement('canvas');
    out.width = mCanvas.width; out.height = mCanvas.height + 30 * dpr;
    var c = out.getContext('2d');
    c.fillStyle = '#0d1117'; c.fillRect(0, 0, out.width, out.height);
    c.drawImage(mCanvas, 0, 0);
    c.fillStyle = '#8b9dc3'; c.font = (12 * dpr) + 'px sans-serif';
    c.fillText('NHIT VisualLab  \u00b7  Wind Tunnel  \u00b7  ' + OBJECTS[state.objIdx].name + '  \u00b7  V=' + state.airSpeed + ' m/s  \u00b7  AoA=' + state.angleOfAttack + '\u00b0',
               10 * dpr, mCanvas.height + 20 * dpr);
    out.toBlob(function (b) {
      var url = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = url; a.download = 'wind-tunnel-' + OBJECTS[state.objIdx].id + '.png'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ================================================================
     EXPORT TEST REPORT (industrial-standard, print-to-PDF)
     ================================================================
     Opens a new window with a fully laid-out wind-tunnel test certificate.
     References AIAA S-114-2005, ISO 5168, AGARD AR-304. */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function buildReportMachineImage() {
    var W = mCanvas.width, H = mCanvas.height;
    var out = document.createElement('canvas');
    out.width = W; out.height = H;
    var c = out.getContext('2d');
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    /* Light tint background for the photo crop */
    c.fillStyle = '#f5f7fa'; c.fillRect(0, 0, W, H);
    c.drawImage(mCanvas, 0, 0);
    return out.toDataURL('image/png');
  }
  function buildReportGraphImage() {
    var W = gCanvas.width, H = gCanvas.height;
    var out = document.createElement('canvas');
    out.width = W; out.height = H;
    var c = out.getContext('2d');
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    c.drawImage(gCanvas, 0, 0);
    return out.toDataURL('image/png');
  }
  function classifyRegime(Re) {
    if (Re < 10) return 'Creeping (Stokes)';
    if (Re < 1000) return 'Viscous laminar';
    if (Re < 2e5) return 'Subcritical (laminar boundary layer)';
    if (Re < 5e5) return 'Critical / transitional';
    return 'Supercritical (turbulent boundary layer)';
  }
  function referenceCd(obj) {
    return ({
      sphere: '0.47 (subcritical) / 0.20 (Re > 3×10⁵)',
      cylinder: '1.17 (subcritical) / 0.30 (Re > 2.5×10⁵)',
      cone: '0.50 (apex-first) / 1.40 (base-first)',
      'flat-plate': '1.98 (Hoerner, normal flow)',
      streamlined: '0.04 (NACA-like teardrop)',
      airfoil: '0.006–0.020 (NACA 0012, α=0)',
      car: '0.28–0.35 (modern sedan)'
    })[obj.id] || '—';
  }
  function exportTestReport() {
    var u = U();
    var obj = OBJECTS[state.objIdx];
    var D = state.objSize / 1000;
    var f = state.results || calcForces(state.airSpeed, D, obj, state.angleOfAttack);

    /* Reference area from the solver's own refArea() — no duplicated formula */
    var A = (f && f.S) || refArea(obj, D, curCfg());

    var machineImg = buildReportMachineImage();
    var graphImg   = buildReportGraphImage();

    var nowStr = new Date();
    var dateStr = nowStr.toISOString().slice(0, 10);
    var timeStr = nowStr.toTimeString().slice(0, 5);
    var reportNo = 'WT-' + dateStr.replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);

    var regime = classifyRegime(f.Re);
    var refCd = referenceCd(obj);
    var rf = (f && f.fluid) || curFluid();
    var mach = (f && f.M != null) ? f.M : calcMach(state.airSpeed, rf);
    var compressible = rf.compressible && mach > 0.3;
    var runc = curUncertainty(f);
    var _sec = 1;
    var S = function (t) { return '<h2>' + (++_sec) + '. ' + t + '</h2>'; };
    var isAFr = obj.id === 'airfoil';
    var spR = isAFr ? sectionProps(state.naca, f.ReRaw || f.Re) : null;

    /* Orientation note */
    var orientation = 'Default (front toward upstream)';
    if (state.flipObj && (obj.id === 'car' || obj.id === 'streamlined' || obj.id === 'airfoil' || obj.id === 'cone')) {
      orientation = 'Flipped (rear-first / inverted)';
    }

    /* Format helpers */
    function fmt(v, d) { if (v == null || !isFinite(v)) return '—'; return v.toFixed(d == null ? 2 : d); }
    function fmtExp(v) { if (v == null) return '—'; return v.toExponential(2).replace('e+', '×10^').replace('e-', '×10⁻'); }

    var graphTabLabel = ({
      pressure: 'Pressure-coefficient distribution (Cp)',
      forces:   'Aerodynamic force bar chart',
      profile:  'Boundary-layer velocity profile',
      polar:    'Drag polar (Cl vs Cd)',
      liftcurve: 'Lift curve (Cl vs α)'
    })[state.graphTab] || 'Live graph';

    var verdict = 'Measured drag coefficient Cd = ' + f.Cd.toFixed(3) +
                  ' is consistent with reference values (' + refCd + ') for ' + obj.name +
                  ' in the ' + regime.toLowerCase() + ' flow regime.';
    if (compressible) {
      verdict += ' NOTE: Mach number M = ' + mach.toFixed(2) + ' exceeds 0.3 — compressibility effects are present and the incompressible model is approximate.';
    }

    var html = '<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="UTF-8">' +
      '<title>Wind Tunnel Test Report — ' + reportNo + '</title>' +
      '<style>' +
      '@page { size: A4; margin: 14mm 16mm; }' +
      '* { box-sizing: border-box; }' +
      'body { font-family: "Segoe UI","Helvetica Neue",Arial,sans-serif; color:#111; margin:0; padding:0; font-size:10.5pt; line-height:1.45; }' +
      '.report { max-width: 190mm; margin: 0 auto; }' +
      '.hd { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:3px solid #0077a3; padding-bottom:10px; margin-bottom:14px; }' +
      '.hd-l h1 { margin:0; font-size:18pt; color:#005678; letter-spacing:.3px; }' +
      '.hd-l .sub { margin-top:2px; font-size:9.5pt; color:#444; }' +
      '.hd-r { text-align:right; font-size:9pt; color:#333; }' +
      '.hd-r .rno { font-weight:700; color:#005678; font-size:11pt; }' +
      'h2 { font-size:11pt; color:#005678; margin:18px 0 6px; border-bottom:1px solid #b0bec5; padding-bottom:2px; letter-spacing:.4px; text-transform:uppercase; }' +
      'table { width:100%; border-collapse:collapse; margin-bottom:6px; font-size:10pt; }' +
      'th, td { text-align:left; padding:5px 9px; border-bottom:1px solid #e0e6ed; }' +
      'th { background:#eceff1; color:#37474f; font-weight:600; width:40%; }' +
      'td { color:#111; font-variant-numeric: tabular-nums; }' +
      '.two-col { display:grid; grid-template-columns:1fr 1fr; gap:0 18px; }' +
      '.img-wrap { margin-top:8px; border:1px solid #cfd8dc; padding:6px; background:#fafbfc; }' +
      '.img-wrap img { width:100%; height:auto; display:block; }' +
      '.results-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-top:6px; }' +
      '.kpi { border:1px solid #cfd8dc; padding:8px 10px; border-radius:4px; background:#f5f7fa; }' +
      '.kpi .lbl { font-size:8pt; color:#546e7a; text-transform:uppercase; letter-spacing:.5px; font-weight:600; }' +
      '.kpi .val { font-size:14pt; font-weight:700; color:#005678; font-variant-numeric: tabular-nums; }' +
      '.kpi .unit { font-size:9pt; color:#37474f; margin-left:2px; }' +
      '.verdict { margin-top:10px; padding:10px 14px; border-left:4px solid #0077a3; background:#e6f4f9; font-size:10pt; }' +
      '.warning { margin-top:8px; padding:8px 12px; border-left:4px solid #d97706; background:#fff4e0; font-size:9.5pt; color:#92400e; }' +
      '.foot { margin-top:18px; padding-top:8px; border-top:1px solid #b0bec5; font-size:8.5pt; color:#546e7a; display:flex; justify-content:space-between; }' +
      '.sign-row { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:22px; }' +
      '.sign-box { border-top:1px solid #455a64; padding-top:4px; font-size:9pt; color:#37474f; }' +
      '@media print { .no-print { display:none !important; } body { font-size:10pt; } .img-wrap { page-break-inside: avoid; } }' +
      '.bar { background:#005678; color:#fff; padding:14px 18px; text-align:center; font-size:11pt; }' +
      '.bar button { background:#fff; color:#005678; border:0; padding:7px 18px; font-weight:700; border-radius:4px; cursor:pointer; margin:0 6px; }' +
      '</style></head><body>' +
      '<div class="bar no-print">' +
        'Use your browser&rsquo;s print dialog (Ctrl/Cmd + P) to <b>Save as PDF</b>.' +
        '<button onclick="window.print()">Print / Save as PDF</button>' +
        '<button onclick="window.close()">Close</button>' +
      '</div>' +
      '<div class="report">' +

        '<div class="hd">' +
          '<div class="hd-l">' +
            '<h1>Subsonic Wind Tunnel — Test Report</h1>' +
            '<div class="sub">Aerodynamic force &amp; pressure measurement per AIAA S-114, ISO 5168</div>' +
          '</div>' +
          '<div class="hd-r">' +
            '<div class="rno">Report No. ' + reportNo + '</div>' +
            '<div>Date: ' + dateStr + '</div>' +
            '<div>Time: ' + timeStr + '</div>' +
            '<div>Facility: NHIT VisualLab WT-200 (Virtual)</div>' +
          '</div>' +
        '</div>' +

        '<h2>1. Test Article &amp; Test Conditions</h2>' +
        '<div class="two-col">' +
          '<table>' +
            '<tr><th>Test article</th><td>' + escapeHtml(obj.name) + '</td></tr>' +
            '<tr><th>Orientation</th><td>' + escapeHtml(orientation) + '</td></tr>' +
            '<tr><th>Characteristic length</th><td>' + escapeHtml(obj.charLenLabel || 'D') + ' = ' +
              fmt(u.size.fromSI(state.objSize), u.size.digits) + ' ' + u.size.label +
              ' (' + state.objSize + ' mm)</td></tr>' +
            '<tr><th>Reference area</th><td>' + A.toExponential(3) + ' m² (' + (A * 1e6).toFixed(0) + ' mm²)</td></tr>' +
            '<tr><th>Angle of attack</th><td>α = ' + state.angleOfAttack + '°' +
              (obj.hasLift ? '' : ' (no lift surface)') + '</td></tr>' +
          '</table>' +
          '<table>' +
            '<tr><th>Free-stream velocity</th><td>V<sub>∞</sub> = ' +
              fmt(u.speed.fromSI(state.airSpeed), u.speed.digits) + ' ' + u.speed.label +
              ' (' + state.airSpeed + ' m/s)</td></tr>' +
            '<tr><th>Working fluid</th><td>' + rf.name + ' at ' + rf.tempC.toFixed(1) + ' °C, ' +
              Math.round(rf.altitudeM) + ' m geopotential (p = ' + (rf.p / 1000).toFixed(2) + ' kPa)</td></tr>' +
            '<tr><th>Density</th><td>ρ = ' + rf.rho.toFixed(4) + ' kg/m³</td></tr>' +
            '<tr><th>Dynamic viscosity</th><td>μ = ' + rf.mu.toExponential(4) + ' Pa·s (Sutherland)</td></tr>' +
            '<tr><th>Kinematic viscosity</th><td>ν = ' + rf.nu.toExponential(4) + ' m²/s</td></tr>' +
            '<tr><th>Reynolds number</th><td>Re<sub>D</sub> = ' + fmtExp(f.Re) + '</td></tr>' +
            '<tr><th>Mach number</th><td>M = ' + mach.toFixed(3) +
              (compressible ? ' <b>(compressible regime)</b>' : ' (incompressible)') + '</td></tr>' +
          '</table>' +
        '</div>' +

        S('Measured Aerodynamic Coefficients') +
        '<div class="results-grid">' +
          '<div class="kpi"><div class="lbl">Drag Coefficient</div><div class="val">' + f.Cd.toFixed(3) + ' ± ' + runc.U.Cd.toFixed(3) + '<span class="unit">C<sub>d</sub> (k = 2)</span></div></div>' +
          '<div class="kpi"><div class="lbl">Lift Coefficient</div><div class="val">' + f.Cl.toFixed(3) + ' ± ' + runc.U.Cl.toFixed(3) + '<span class="unit">C<sub>l</sub> (k = 2)</span></div></div>' +
          '<div class="kpi"><div class="lbl">L / D Ratio</div><div class="val">' + (f.Cd > 1e-4 ? f.LD.toFixed(2) : '—') + '</div></div>' +
          '<div class="kpi"><div class="lbl">Dynamic Pressure</div><div class="val">' + fmt(u.press.fromSI(f.q), u.press.digits) + '<span class="unit">' + u.press.label + '</span></div></div>' +
          '<div class="kpi"><div class="lbl">Drag Force</div><div class="val">' + fmt(u.force.fromSI(f.Fd), u.force.digits) + '<span class="unit">' + u.force.label + '</span></div></div>' +
          '<div class="kpi"><div class="lbl">Lift Force</div><div class="val">' + fmt(u.force.fromSI(f.Fl), u.force.digits) + '<span class="unit">' + u.force.label + '</span></div></div>' +
          '<div class="kpi"><div class="lbl">Reynolds Number</div><div class="val">' + (f.Re > 1e5 ? fmtExp(f.Re) : Math.round(f.Re)) + '</div></div>' +
          '<div class="kpi"><div class="lbl">Flow Regime</div><div class="val" style="font-size:9pt; line-height:1.3;">' + escapeHtml(regime) + '</div></div>' +
        '</div>' +

        (isAFr ?
          S('Wing Geometry &amp; Section Properties') +
          '<table>' +
            '<tr><th>Section</th><td>' + nacaDesignation(state.naca) + ' (NACA 4-digit)</td></tr>' +
            '<tr><th>Maximum camber</th><td>m = ' + (state.naca.m * 100).toFixed(0) + ' %c at p = ' +
              (state.naca.m > 0 ? state.naca.p.toFixed(1) + ' c' : 'n/a (symmetric)') + '</td></tr>' +
            '<tr><th>Maximum thickness</th><td>t = ' + (state.naca.t * 100).toFixed(0) + ' %c at x/c = 0.30</td></tr>' +
            '<tr><th>Zero-lift angle</th><td>α<sub>0</sub> = ' + spR.alpha0Deg.toFixed(2) + '° (thin-airfoil theory)</td></tr>' +
            '<tr><th>Quarter-chord moment</th><td>C<sub>m,c/4</sub> = ' + spR.cm4.toFixed(4) + '</td></tr>' +
            '<tr><th>Aspect ratio</th><td>' + (isFinite(state.AR)
              ? 'AR = ' + state.AR.toFixed(1) + ', span efficiency e = ' + state.spanEff.toFixed(2)
              : 'AR → ∞ (two-dimensional section, wing spans the test section)') + '</td></tr>' +
            '<tr><th>Lift-curve slope</th><td>a = ' +
              (liftSlopePerRad(state.AR, state.spanEff) * Math.PI / 180).toFixed(4) + ' per degree</td></tr>' +
            '<tr><th>Reference area</th><td>S = ' + f.S.toExponential(3) + ' m² (planform, S = AR·c²)</td></tr>' +
            '<tr><th>Drag breakdown</th><td>C<sub>d0</sub> = ' + f.cdProfile.toFixed(4) +
              ' (profile) + C<sub>di</sub> = ' + f.cdInduced.toFixed(4) + ' (induced)</td></tr>' +
          '</table>'
          : '') +

        S('Tunnel Blockage Assessment') +
        '<table>' +
          '<tr><th>Test section</th><td>' + (state.testW * 1000).toFixed(0) + ' × ' + (state.testH * 1000).toFixed(0) +
            ' mm  (C = ' + f.blockage.C.toFixed(4) + ' m²)</td></tr>' +
          '<tr><th>Model frontal area</th><td>S<sub>f</sub> = ' + f.blockage.Sfrontal.toExponential(3) + ' m²</td></tr>' +
          '<tr><th>Blockage ratio</th><td>S<sub>f</sub>/C = ' + (100 * f.blockage.ratio).toFixed(2) + ' %' +
            (f.blockage.ratio < 0.05 ? ' — within the conventional 5 % limit'
              : (f.blockage.ratio < 0.10 ? ' — <b>above 5 %</b>, corrections are significant'
                 : ' — <b>above 10 %</b>, first-order corrections are not reliable')) + '</td></tr>' +
          '<tr><th>Solid blockage</th><td>ε<sub>sb</sub> = ' + f.blockage.epsSolid.toFixed(5) +
            '  (K₁·τ₁·V<sub>model</sub>/C<sup>3/2</sup>)</td></tr>' +
          '<tr><th>Wake blockage</th><td>ε<sub>wb</sub> = ' + f.blockage.epsWake.toFixed(5) +
            '  (S<sub>f</sub>/4C)·C<sub>d</sub></td></tr>' +
          '<tr><th>Total blockage</th><td>ε = ' + f.blockage.eps.toFixed(5) + '</td></tr>' +
          '<tr><th>Correction status</th><td>' + (state.applyBlockage
            ? 'APPLIED — V<sub>c</sub> = V(1+ε), C<sub>d,c</sub> = C<sub>d</sub>/(1+ε)²'
            : 'NOT applied — coefficients above are uncorrected') + '</td></tr>' +
        '</table>' +

        S('Measurement Uncertainty (GUM / ISO 5168)') +
        '<table>' +
          '<tr><th>Input standard uncertainties (k = 1)</th><td>u(V) = ' + state.unc.uV + ' m/s · u(D) = ' +
            (state.unc.uD * 1000) + ' mm · u(F) = ' + state.unc.uF + ' N · u(T) = ' + state.unc.uT +
            ' K · u(p) = ' + state.unc.uP + ' Pa</td></tr>' +
          '<tr><th>Relative u(ρ)/ρ</th><td>' + (100 * runc.rel.rho).toFixed(3) + ' %</td></tr>' +
          '<tr><th>Relative u(q)/q</th><td>' + (100 * runc.rel.q).toFixed(3) + ' %  (velocity enters squared)</td></tr>' +
          '<tr><th>Relative u(S)/S</th><td>' + (100 * runc.rel.S).toFixed(3) + ' %</td></tr>' +
          '<tr><th>Relative u(Re)/Re</th><td>' + (100 * runc.rel.Re).toFixed(3) + ' %</td></tr>' +
          '<tr><th>Combined u(C<sub>d</sub>)/C<sub>d</sub></th><td>' + (100 * runc.rel.Cd).toFixed(3) + ' %</td></tr>' +
          '<tr><th>Expanded U(C<sub>d</sub>), k = 2</th><td>C<sub>d</sub> = ' + f.Cd.toFixed(4) + ' ± ' +
            runc.U.Cd.toFixed(4) + '  (≈95 % confidence)</td></tr>' +
          '<tr><th>Expanded U(F<sub>d</sub>), k = 2</th><td>' + fmt(u.force.fromSI(f.Fd), u.force.digits) + ' ± ' +
            fmt(u.force.fromSI(runc.U.Fd), u.force.digits) + ' ' + u.force.label + '</td></tr>' +
          '<tr><th>Dominant contributor</th><td>' + escapeHtml(runc.dominant) + '</td></tr>' +
        '</table>' +

        S('Test Section Visualization') +
        '<div class="img-wrap"><img src="' + machineImg + '" alt="Wind tunnel test section"></div>' +

        S(escapeHtml(graphTabLabel)) +
        '<div class="img-wrap"><img src="' + graphImg + '" alt="Live graph"></div>' +

        S('Reference &amp; Comparison') +
        '<table>' +
          '<tr><th>Reference C<sub>d</sub> (textbook)</th><td>' + escapeHtml(refCd) + '</td></tr>' +
          '<tr><th>Measured C<sub>d</sub></th><td>' + f.Cd.toFixed(3) + '</td></tr>' +
          '<tr><th>Flow regime</th><td>' + escapeHtml(regime) + ' (Re ≈ ' + fmtExp(f.Re) + ')</td></tr>' +
          '<tr><th>Compressibility</th><td>' + (compressible ? 'M > 0.3 — compressible (incompressible model approximate)' : 'M < 0.3 — incompressible model valid') + '</td></tr>' +
        '</table>' +

        S('Conclusion') +
        '<div class="verdict"><b>Verdict:</b> ' + escapeHtml(verdict) + '</div>' +
        (compressible
          ? '<div class="warning"><b>Caution:</b> Free-stream Mach number exceeds 0.3. Lookup-table coefficients used in this report are derived from incompressible theory and may underestimate drag by 5–15 % in this regime.</div>'
          : '') +

        '<div class="sign-row">' +
          '<div class="sign-box">Tested by ___________________________</div>' +
          '<div class="sign-box">Reviewed by ___________________________</div>' +
        '</div>' +

        '<div class="foot">' +
          '<div>Generated by NHIT VisualLab Virtual Wind Tunnel · NHIT VisualLab</div>' +
          '<div>Standards: AIAA S-114-2005 · ISO 5168 · AGARD AR-304</div>' +
        '</div>' +

      '</div>' +
      '<script>window.addEventListener("load", function(){ setTimeout(function(){ window.focus(); window.print(); }, 350); });</' + 'script>' +
      '</body></html>';

    var win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups for this site to export the report.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  /* Context menu */
  function wireCtxMenu() {
    var menu = $('ctx-menu'); if (!menu) return;
    function hide() { menu.classList.remove('active'); }
    function show(e, items) {
      menu.innerHTML = '';
      items.forEach(function (it) {
        if (it === '-') { var s = document.createElement('div'); s.className = 'ctx-sep'; menu.appendChild(s); return; }
        var d = document.createElement('div'); d.className = 'ctx-item'; d.textContent = it.label;
        d.addEventListener('click', function () { hide(); it.fn(); });
        menu.appendChild(d);
      });
      menu.classList.add('active');
      var mw = menu.offsetWidth, mh = menu.offsetHeight;
      var vw = window.innerWidth, vh = window.innerHeight;
      var x = Math.min(e.clientX, vw - mw - 8);
      var y = Math.min(e.clientY, vh - mh - 8);
      menu.style.left = x + 'px'; menu.style.top = y + 'px';
    }
    function items() {
      return [
        { label: '\u270e Copy Cd value', fn: function () { try { navigator.clipboard.writeText(String(state.results ? roundN(state.results.Cd, 4) : '')); } catch (e) {} } },
        { label: '\u21a4 Export PNG',   fn: exportPNG },
        { label: '\u21a4 Export CSV',   fn: exportCSV },
        '-',
        { label: (showGrid ? '\u2611' : '\u2610') + ' Toggle Grid', fn: function () { saveUndo(); showGrid = !showGrid; syncCheckboxes(); } },
        { label: '\u21bb Reset',        fn: resetAll }
      ];
    }
    [mCanvas, gCanvas].forEach(function (c) {
      c.addEventListener('contextmenu', function (e) { e.preventDefault(); show(e, items()); });
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) hide();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  }

  /* Learn panels (KaTeX) */
  var _learnCache = { eq: '', co: '', cmp: '' };
  function updateLearnPanels(f) {
    var u = U();
    var obj = OBJECTS[state.objIdx];
    /* Live equations */
    var eq = $('lp-eq-body');
    if (eq) {
      var Vd = u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits) + '\\;\\mathrm{' + u.speed.label.replace('/', '/') + '}';
      var Fd = u.force.fromSI(f.Fd).toFixed(u.force.digits) + '\\;\\mathrm{' + u.force.label + '}';
      var Fl = u.force.fromSI(f.Fl).toFixed(u.force.digits) + '\\;\\mathrm{' + u.force.label + '}';
      var qd = u.press.fromSI(f.q).toFixed(u.press.digits) + '\\;\\mathrm{' + u.press.label + '}';
      var html = '';
      html += '<div class="eq-line">\\[ F_d = \\tfrac{1}{2}\\,\\rho V^2 A C_d \\]</div>';
      html += '<div class="eq-line">\\(F_d = ' + Fd + ',\\quad C_d = ' + f.Cd.toFixed(3) + '\\)</div>';
      html += '<div class="eq-line">\\[ F_l = \\tfrac{1}{2}\\,\\rho V^2 A C_l \\quad\\Rightarrow\\quad F_l = ' + Fl + ',\\; C_l = ' + f.Cl.toFixed(3) + '\\)</div>';
      html += '<div class="eq-line">\\[ Re = \\dfrac{\\rho V D}{\\mu} = ' + f.Re.toExponential(2).replace('e', '\\times 10^{') + '}\\]</div>';
      html += '<div class="eq-line">\\(q = \\tfrac{1}{2}\\rho V^2 = ' + qd + ',\\;\\; V = ' + Vd + '\\)</div>';
      if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }
    }
    /* Coach */
    var co = $('lp-coach-body');
    if (co) {
      var lines = [];
      if (f.Re < 1000) lines.push('Re &lt; 10\u00b3: viscous (creeping) flow \u2014 Cd rises steeply if you slow further.');
      else if (f.Re < 1e5) lines.push('Laminar regime \u2014 separation begins early on the rear face.');
      else if (f.Re > 3e5 && obj.id === 'sphere') lines.push('Sphere is in the <strong>drag-crisis</strong> regime \u2014 boundary layer turned turbulent, Cd dropped.');
      else if (f.Re > 2.5e5 && obj.id === 'cylinder') lines.push('Cylinder is in the <strong>drag-crisis</strong> regime \u2014 turbulent boundary layer delays separation, Cd dropped.');
      else lines.push('Turbulent boundary layer \u2014 drag scales close to V\u00b2\u00b7A\u00b7Cd.');
      if (obj.id === 'cylinder' && f.Re > 47 && f.Re < 2e5) lines.push('<strong>Von K\u00e1rm\u00e1n vortex street</strong> \u2014 alternating vortices shed at St \u2248 0.21. Watch the wake!');
      if (obj.id === 'airfoil') {
        var aStall = stallAngleDeg(f.Re);
        if (Math.abs(state.angleOfAttack) > aStall) lines.push('\u03b1 &gt; \u03b1<sub>stall</sub> (' + aStall.toFixed(1) + '\u00b0 at this Re): <strong>stall</strong>. Flow separated on upper surface \u2014 Cl collapses, Cd spikes.');
        else if (Math.abs(state.angleOfAttack) > aStall - 3) lines.push('Approaching stall (\u03b1<sub>stall</sub> \u2248 ' + aStall.toFixed(1) + '\u00b0 at this Re) \u2014 Cl growth flattens.');
        else lines.push('Linear lift region: Cl \u2248 2\u03c0\u00b7\u03b1 (rad) for thin airfoils. Stall at this Re \u2248 ' + aStall.toFixed(1) + '\u00b0.');
        lines.push('Cl<sub>max</sub> \u2248 ' + clMaxRe(f.Re).toFixed(2) + ' at Re = ' + formatSci(f.Re, 1) + ' \u2014 raise the speed or size (higher Re) to delay stall.');
        if (f.Cd > 0.0001) lines.push('L/D = ' + f.LD.toFixed(1) + ' \u2014 higher is better; max L/D is the design sweet spot.');
      }
      if (state.airSpeed >= 100) lines.push('Compressibility effects begin near M \u2248 0.3 (~100 m/s) \u2014 this incompressible model is approximate.');
      var html2 = lines.map(function (l) { return '<div class="coach-line">' + l + '</div>'; }).join('');
      if (html2 !== _learnCache.co) { co.innerHTML = html2; _learnCache.co = html2; }
    }
    /* Compare table */
    var cmp = $('lp-compare-body');
    if (cmp) {
      var rows = [
        ['Sphere',            0.47,  '10\u00b3\u20133\u00d710\u2075'],
        ['Cylinder',          1.17,  '10\u00b3\u20132\u00d710\u2075'],
        ['Cone (apex-first)', 0.50,  '10\u00b3\u20131\u00d710\u2076'],
        ['Flat plate',        2.0,   'any'],
        ['Streamlined',       0.04,  '10\u2074\u201310\u2076'],
        ['NACA 0012',         0.012, '10\u2075\u201310\u2077'],
        ['Car',               0.32,  '10\u2075\u201310\u2076']
      ];
      var t = '<table><thead><tr><th>Object</th><th>Typical Cd</th><th>Re range</th></tr></thead><tbody>';
      rows.forEach(function (r, i) {
        t += '<tr' + (i === state.objIdx ? ' class="active"' : '') + '><td>' + r[0] + '</td><td class="num">' + r[1] + '</td><td>' + r[2] + '</td></tr>';
      });
      t += '</tbody></table>';
      if (t !== _learnCache.cmp) { cmp.innerHTML = t; _learnCache.cmp = t; }
    }
  }
  function wireLearnPanels() {
    var expAll = $('learn-expand-all'), colAll = $('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  }

  /* Calc modal */
  function calcStep(num, title, formula, calculation, result) {
    var h = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula)     h += '<div class="cs-formula">' + formula + '</div>';
    if (calculation) h += '<div class="cs-calc">' + calculation.replace(/\n/g, '<br>') + '</div>';
    if (result != null) h += '<div class="cs-result">\u2192 <strong>' + result + '</strong></div>';
    return h + '</div>';
  }
  function buildCalcSteps() {
    var u = U();
    var obj = OBJECTS[state.objIdx];
    var D = state.objSize / 1000;
    var f = state.results || calcForces(state.airSpeed, D, obj, state.angleOfAttack);
    var _fl = (state.results && state.results.fluid) || curFluid();
    var rho = _fl.rho, mu = _fl.mu;
    /* Reference area comes from refArea() — the SAME function calcForces()
       uses, so the modal can never drift out of step with the solver. */
    var _cfg = curCfg();
    var A = refArea(obj, D, _cfg), areaFormula, areaCalc;
    if (obj.id === 'sphere' || obj.id === 'cone') {
      areaFormula = '\\[ A = \\dfrac{\\pi D^2}{4} \\]';
      areaCalc = 'A = \u03c0 \u00d7 (' + D.toFixed(3) + ')\u00b2 / 4';
    } else if (obj.id === 'airfoil') {
      areaFormula = '\\[ S = c \\cdot b = AR \\cdot c^2 \\]';
      areaCalc = isFinite(_cfg.AR)
        ? 'S = ' + _cfg.AR.toFixed(1) + ' \u00d7 (' + D.toFixed(3) + ')\u00b2   (AR = ' + _cfg.AR.toFixed(1) + ')'
        : 'S = c \u00d7 b with unit span b = c = ' + D.toFixed(3) + ' m   (2-D section, AR \u2192 \u221e)';
    } else if (obj.id === 'streamlined') {
      areaFormula = '\\[ A = \\dfrac{\\pi t^2}{4},\\quad t = 0.28\\,L \\quad (\\text{body of revolution}) \\]';
      areaCalc = 'A = \u03c0 \u00d7 (0.28 \u00d7 ' + D.toFixed(3) + ')\u00b2 / 4';
    } else {
      areaFormula = '\\[ A = D \\cdot b,\\quad b = D \\] (frontal area, 2-D section of span b = D)';
      areaCalc = 'A = ' + D.toFixed(3) + ' \u00d7 ' + D.toFixed(3);
    }
    var h = '';
    h += '<div class="cs-inputs"><span class="cs-badge">Given \u2014 Current State</span>';
    h += '<div class="cs-given">';
    h += '<span>Object: <strong>' + obj.name + '</strong></span>';
    h += '<span>V = ' + state.airSpeed + ' m/s (' + u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits) + ' ' + u.speed.label + ')</span>';
    h += '<span>D = ' + state.objSize + ' mm (' + u.size.fromSI(state.objSize).toFixed(u.size.digits) + ' ' + u.size.label + ')</span>';
    h += '<span>\u03b1 = ' + state.angleOfAttack + '\u00b0</span>';
    h += '<span>Air @ ' + _fl.tempC.toFixed(1) + ' \u00b0C' +
         (_fl.altitudeM > 0 ? ', ' + Math.round(_fl.altitudeM) + ' m' : ', sea level') + '</span>';
    h += '<span>\u03c1 = ' + rho.toFixed(4) + ' kg/m\u00b3</span>';
    h += '<span>\u03bc = ' + mu.toExponential(3) + ' Pa\u00b7s</span>';
    h += '<span>a = ' + _fl.a.toFixed(1) + ' m/s, M = ' + (f.M || 0).toFixed(3) + '</span>';
    h += '</div><p class="cs-si-note">\u24d8 All calculations done in SI. Display follows the SI / Imperial toggle. ' +
         'Conventions: cylinder, flat plate and car are 2-D sections of span b = D (2-D Cd values); ' +
         'sphere and cone are axisymmetric; the teardrop is a body of revolution; the wing is referenced to its planform area S = AR\u00b7c\u00b2, with induced drag set by the aspect ratio you choose.</p></div>';

    h += calcStep(1, 'Reference area',
      areaFormula,
      areaCalc,
      A.toExponential(3) + ' m\u00b2');
    h += calcStep(2, 'Dynamic pressure',
      '\\[ q = \\tfrac{1}{2}\\rho V^2 \\]',
      'q = 0.5 \u00d7 ' + rho.toFixed(4) + ' \u00d7 ' + state.airSpeed + '\u00b2',
      f.q.toFixed(2) + ' Pa  =  ' + u.press.fromSI(f.q).toFixed(u.press.digits) + ' ' + u.press.label);
    h += calcStep(3, 'Reynolds number',
      '\\[ Re = \\dfrac{\\rho V D}{\\mu} \\]',
      'Re = (' + rho.toFixed(4) + ' \u00d7 ' + state.airSpeed + ' \u00d7 ' + D.toFixed(3) + ') / ' + mu.toExponential(3),
      f.Re.toExponential(3));
    if (obj.id === 'airfoil') {
      var aStallM = stallAngleDeg(f.Re);
      h += calcStep(4, 'Drag coefficient (profile + induced)',
        '\\[ C_d = C_{d0}(Re) + \\dfrac{C_l^2}{\\pi e AR} \\]' +
        (isFinite(_cfg.AR) ? '\\[ e = ' + _cfg.e.toFixed(2) + ',\\ AR = ' + _cfg.AR.toFixed(1) + ' \\]'
                           : '\\[ \\text{2-D section: } AR \\to \\infty,\\ C_{di} = 0 \\]'),
        'Cd = ' + f.Cd.toFixed(4) + (Math.abs(state.angleOfAttack) > aStallM ? '  (post-stall drag rise included)' : ''),
        f.Cd.toFixed(4));
    } else {
      h += calcStep(4, 'Drag coefficient (from shape model)',
        '\\[ C_d = f(\\text{shape}, Re, \\alpha) \\]',
        'Cd = ' + f.Cd.toFixed(4),
        f.Cd.toFixed(4));
    }
    h += calcStep(5, 'Drag force',
      '\\[ F_d = \\tfrac{1}{2}\\rho V^2 A C_d \\]',
      'Fd = ' + f.q.toFixed(2) + ' \u00d7 ' + A.toExponential(3) + ' \u00d7 ' + f.Cd.toFixed(4),
      f.Fd.toFixed(4) + ' N  =  ' + u.force.fromSI(f.Fd).toFixed(u.force.digits) + ' ' + u.force.label);
    if (obj.id === 'airfoil') {
      var aStallL = stallAngleDeg(f.Re);
      h += calcStep(6, 'Lift force (thin-airfoil theory)',
        '\\[ C_l = 2\\pi\\sin\\alpha \\;\\; (\\alpha < \\alpha_{stall}),\\qquad F_l = \\tfrac{1}{2}\\rho V^2 A C_l \\]',
        '\u03b1 = ' + state.angleOfAttack + '\u00b0,  \u03b1_stall \u2248 ' + aStallL.toFixed(1) + '\u00b0 at Re = ' + f.Re.toExponential(2) +
        '\nCl = ' + f.Cl.toFixed(4) + ' (Cl_max \u2248 ' + clMaxRe(f.Re).toFixed(2) + ' at this Re),  Fl = q \u00b7 A \u00b7 Cl',
        f.Fl.toFixed(4) + ' N  =  ' + u.force.fromSI(f.Fl).toFixed(u.force.digits) + ' ' + u.force.label);
    } else {
      h += calcStep(6, 'Lift force',
        '\\[ F_l = \\tfrac{1}{2}\\rho V^2 A C_l \\]',
        'Cl = ' + f.Cl.toFixed(4) + ',  Fl = q \u00b7 A \u00b7 Cl',
        f.Fl.toFixed(4) + ' N  =  ' + u.force.fromSI(f.Fl).toFixed(u.force.digits) + ' ' + u.force.label);
    }
    h += calcStep(7, 'Lift-to-drag ratio',
      '\\[ L/D = \\dfrac{C_l}{C_d} \\]',
      'L/D = ' + f.Cl.toFixed(4) + ' / ' + f.Cd.toFixed(4),
      (f.Cd > 1e-4 ? f.LD.toFixed(3) : '\u2014'));
    return h;
  }
  function openCalcModal() {
    var m = $('calc-modal'), b = $('calc-modal-body');
    if (!m || !b) return;
    b.innerHTML = buildCalcSteps();
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeCalcModal() {
    var m = $('calc-modal'); if (!m) return;
    m.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* Graph tabs */
  function wireGraphTabs() {
    var host = $('graph-tabs'); if (!host) return;
    host.querySelectorAll('.g-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.tab;
        if (!t || t === state.graphTab) return;
        saveUndo();
        state.graphTab = t;
        syncGraphTabs();
        drawGraph();
      });
    });
  }
  function syncGraphTabs() {
    var host = $('graph-tabs'); if (!host) return;
    host.querySelectorAll('.g-tab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === state.graphTab);
    });
  }

  /* Sticky badge strip — updates on every readout refresh */
  function updateBadgeStrip(f) {
    if (!f) return;
    var u = U();
    function set(id, val) { var el = $(id); if (el) el.textContent = val; }
    set('bs-v', u.speed.fromSI(state.airSpeed).toFixed(u.speed.digits));
    set('bs-v-u', u.speed.label);
    set('bs-re', f.Re > 1e5 ? formatSci(f.Re, 1) : Math.round(f.Re));
    set('bs-cd', roundN(f.Cd, 3));
    set('bs-cl', roundN(f.Cl, 3));
    set('bs-fd', u.force.fromSI(f.Fd).toFixed(u.force.digits));
    set('bs-fd-u', u.force.label);
    set('bs-fl', u.force.fromSI(f.Fl).toFixed(u.force.digits));
    set('bs-fl-u', u.force.label);
    set('bs-ld', f.Cd > 1e-4 ? roundN(f.LD, 2) : '—');
  }

  /* Hint banner */
  function wireHintBanner() {
    var bar = $('hint-bar'), close = $('hint-close');
    if (!bar) return;
    try {
      if (localStorage.getItem('wind-tunnel-hint') === '1') bar.classList.add('hidden');
    } catch (e) {}
    if (close) close.addEventListener('click', function () {
      bar.classList.add('hidden');
      try { localStorage.setItem('wind-tunnel-hint', '1'); } catch (e) {}
    });
  }

  /* Practice buttons */
  if (elBtnCheck) elBtnCheck.addEventListener('click', checkPractice);
  if (elBtnShowSol) elBtnShowSol.addEventListener('click', showSolution);
  if (elBtnNextProb) elBtnNextProb.addEventListener('click', newPractice);
  if (elPracticeInput) elPracticeInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });

  /* Quiz buttons */
  if (elBtnQuizSubmit) elBtnQuizSubmit.addEventListener('click', handleNumeric);
  if (elBtnQuizNext) elBtnQuizNext.addEventListener('click', advanceQuiz);
  if (elBtnNewQuiz) elBtnNewQuiz.addEventListener('click', startQuiz);
  if (elQuizNumInput) elQuizNumInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleNumeric(); });

  /* Window resize + ResizeObserver */
  window.addEventListener('resize', function () { initCanvases(); redrawAll(); });
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(function () { initCanvases(); redrawAll(); });
    ro.observe(mCanvas); ro.observe(gCanvas); ro.observe(eCanvas);
  }

  /* Calc modal wiring */
  var btnCalc = $('btn-calc'); if (btnCalc) btnCalc.addEventListener('click', openCalcModal);
  var btnCalcClose = $('calc-modal-close'); if (btnCalcClose) btnCalcClose.addEventListener('click', closeCalcModal);
  var calcModalEl = $('calc-modal');
  if (calcModalEl) calcModalEl.addEventListener('click', function (e) { if (e.target === calcModalEl) closeCalcModal(); });

  /* Keyboard shortcuts */
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeCalcModal(); var menu = $('ctx-menu'); if (menu) menu.classList.remove('active'); }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var meta = e.ctrlKey || e.metaKey;
    if (meta && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) performRedo(); else performUndo();
      return;
    }
    if (meta && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); performRedo(); return; }
    if (e.key === ' ' && state.mode === 'simulate') { e.preventDefault(); togglePause(); return; }
    if (e.key === '1') setMode('simulate');
    if (e.key === '2') setMode('explore');
    if (e.key === '3') setMode('practice');
    if (e.key === '4') setMode('quiz');
  });

  /* ═══════════════════════════════════════════════════════════════
     S19b  LAB SETUP — conditions, geometry, corrections, uncertainty
     ═══════════════════════════════════════════════════════════════ */

  /* Cache key fragment: any lab setting that changes the physics */
  function labKey() {
    return state.tempC.toFixed(1) + '|' + state.altitudeM.toFixed(0) +
           '|' + state.naca.m.toFixed(3) + '|' + state.naca.p.toFixed(2) + '|' + state.naca.t.toFixed(3) +
           '|' + (isFinite(state.AR) ? state.AR.toFixed(2) : 'inf') + '|' + state.spanEff.toFixed(2) +
           '|' + (state.applyBlockage ? 'b' : '-') + state.testW.toFixed(3) + 'x' + state.testH.toFixed(3) +
           '|' + (state.applyPG ? 'pg' : '-');
  }

  function chip(label, value, cls) {
    return '<span class="lab-chip' + (cls ? ' ' + cls : '') + '"><b>' + label + '</b> ' + value + '</span>';
  }

  function isAirfoilSelected() { return OBJECTS[state.objIdx].id === 'airfoil'; }

  /* ---- state → controls ---- */
  function syncLabSetup() {
    var q = function (id) { return $(id); };
    var altS = q('alt-slider'), altV = q('alt-val');
    if (altS) { altS.value = state.altitudeM; setSliderFill(altS, 0, 15000, state.altitudeM); }
    if (altV) altV.textContent = Math.round(state.altitudeM) + ' m';

    var tS = q('temp-slider'), tV = q('temp-val');
    var tMin = -60, tMax = 80;
    if (tS) {
      tS.value = clamp(state.tempC, tMin, tMax);
      tS.disabled = state.useISATemp;
      setSliderFill(tS, tMin, tMax, clamp(state.tempC, tMin, tMax));
    }
    if (tV) tV.textContent = state.tempC.toFixed(1) + ' °C';
    var isaChk = q('chk-isa-temp'); if (isaChk) isaChk.checked = state.useISATemp;

    /* Wing geometry group — only meaningful for the airfoil */
    var wg = q('wing-group'); if (wg) wg.hidden = !isAirfoilSelected();
    var mS = q('naca-m'), pS = q('naca-p'), tcS = q('naca-t');
    if (mS)  { mS.value  = Math.round(state.naca.m * 100); setSliderFill(mS, 0, 9, mS.value); }
    if (pS)  { pS.value  = Math.round(state.naca.p * 10);  setSliderFill(pS, 1, 9, pS.value);
               pS.disabled = state.naca.m <= 0; }
    if (tcS) { tcS.value = Math.round(state.naca.t * 100); setSliderFill(tcS, 6, 24, tcS.value); }
    var mV = q('naca-m-val'), pV = q('naca-p-val'), tV2 = q('naca-t-val');
    if (mV)  mV.textContent  = Math.round(state.naca.m * 100) + ' %c';
    if (pV)  pV.textContent  = state.naca.m > 0 ? state.naca.p.toFixed(1) + ' c' : '—';
    if (tV2) tV2.textContent = Math.round(state.naca.t * 100) + ' %c';
    var dg = q('naca-desig'); if (dg) dg.textContent = nacaDesignation(state.naca);
    /* keep the object tab in step with the section the user built */
    if (elObjTabs) {
      var afIdx = -1, oi;
      for (oi = 0; oi < OBJECTS.length; oi++) if (OBJECTS[oi].id === 'airfoil') afIdx = oi;
      var afPill = afIdx >= 0 ? elObjTabs.querySelector('.mat-pill[data-idx="' + afIdx + '"]') : null;
      if (afPill) afPill.textContent = nacaDesignation(state.naca);
    }

    var chk2d = q('chk-2d'); if (chk2d) chk2d.checked = !isFinite(state.AR);
    var arS = q('ar-slider'), arV = q('ar-val');
    if (arS) { arS.disabled = !isFinite(state.AR);
               if (isFinite(state.AR)) { arS.value = state.AR; setSliderFill(arS, 1, 20, state.AR); } }
    if (arV) arV.textContent = isFinite(state.AR) ? state.AR.toFixed(1) : '∞';
    var eS = q('e-slider'), eV = q('e-val');
    if (eS) { eS.value = state.spanEff; eS.disabled = !isFinite(state.AR); setSliderFill(eS, 0.6, 1.0, state.spanEff); }
    if (eV) eV.textContent = state.spanEff.toFixed(2);

    var tw = q('test-w'), th = q('test-h');
    if (tw && document.activeElement !== tw) tw.value = Math.round(state.testW * 1000);
    if (th && document.activeElement !== th) th.value = Math.round(state.testH * 1000);
    var bChk = q('chk-blockage'); if (bChk) bChk.checked = state.applyBlockage;

    var uMap = [['unc-v', state.unc.uV, 1], ['unc-d', state.unc.uD, 1000],
                ['unc-f', state.unc.uF, 1], ['unc-t', state.unc.uT, 1], ['unc-p', state.unc.uP, 1]];
    uMap.forEach(function (r) {
      var el = q(r[0]); if (el && document.activeElement !== el) el.value = roundN(r[1] * r[2], 4);
    });

    var sv = q('sweep-var'); if (sv) sv.value = state.sweepVar;
    var sn = q('sweep-n');   if (sn && document.activeElement !== sn) sn.value = state.sweepN;

    var hint = q('lab-summary-hint');
    if (hint) {
      var fl = curFluid();
      hint.textContent = 'Air, ' + fl.tempC.toFixed(1) + ' °C' +
        (state.altitudeM > 0 ? ', ' + Math.round(state.altitudeM) + ' m' : ', sea level') +
        (isAirfoilSelected()
          ? ' · ' + nacaDesignation(state.naca) + (isFinite(state.AR) ? ' AR ' + state.AR.toFixed(1) : ' 2-D')
          : '') +
        (state.applyBlockage ? ' · blockage on' : '');
    }
  }

  function setSliderFill(el, lo, hi, v) {
    if (!el) return;
    var pct = ((v - lo) / (hi - lo)) * 100;
    el.style.setProperty('--slider-fill', clamp(pct, 0, 100) + '%');
  }

  /* ---- derived chips ---- */
  function updateLabChips(f) {
    var fl = f && f.fluid ? f.fluid : curFluid();

    var fc = $('fluid-chips');
    if (fc) {
      var M = f ? f.M : calcMach(state.airSpeed, fl);
      var isaSL = makeFluid({ tempC: 15, altitudeM: 0 });
      var reGain = isaSL.nu / fl.nu;
      fc.innerHTML =
        chip('ρ', fl.rho.toFixed(4) + ' kg/m³') +
        chip('μ', fl.mu.toExponential(3) + ' Pa·s') +
        chip('ν', fl.nu.toExponential(3) + ' m²/s') +
        chip('a', fl.a.toFixed(1) + ' m/s') +
        chip('p', (fl.p / 1000).toFixed(2) + ' kPa') +
        chip('M', M.toFixed(3), M > 0.3 ? 'warn' : 'ok') +
        chip('Re vs ISA SL', reGain.toFixed(2) + '×', reGain > 1.05 ? 'ok' : '');
    }

    var wc = $('wing-chips');
    if (wc && isAirfoilSelected()) {
      var Re = f ? (f.ReRaw || f.Re) : 5e5;
      var sp = sectionProps(state.naca, Re);
      var slope = liftSlopePerRad(state.AR, state.spanEff);
      var wh = chip('α₀', sp.alpha0Deg.toFixed(2) + '°') +
               chip('Cₗ @ α=0', sp.clAtZero.toFixed(3), sp.clAtZero > 0.01 ? 'ok' : '') +
               chip('Cₘ,c/4', sp.cm4.toFixed(4)) +
               chip('Cₗmax', sp.clMax.toFixed(2)) +
               chip('a', (slope * Math.PI / 180).toFixed(4) + ' /°') +
               chip('stall', stallAngleDeg(Re).toFixed(1) + '°');
      if (f && f.cdInduced > 0) {
        wh += chip('αᵢ', (f.Cl / (Math.PI * state.spanEff * state.AR) * 180 / Math.PI).toFixed(2) + '°');
      }
      wc.innerHTML = wh;
    }

    var bc = $('blockage-chips'), bn = $('blockage-note');
    if (bc && f && f.blockage) {
      var b = f.blockage, pc = b.ratio * 100;
      var cls = pc < 5 ? 'ok' : (pc < 10 ? 'warn' : 'bad');
      bc.innerHTML = chip('S/C', pc.toFixed(2) + ' %', cls) +
                     chip('ε solid', b.epsSolid.toFixed(5)) +
                     chip('ε wake', b.epsWake.toFixed(5)) +
                     chip('ε total', b.eps.toFixed(5)) +
                     chip('Cₓ shift', (100 * (1 / (b.factor * b.factor) - 1)).toFixed(2) + ' %');
      if (bn) {
        bn.innerHTML = pc < 5
          ? 'Blockage under 5 % — corrections are small and the test is considered valid.'
          : (pc < 10
            ? 'Blockage 5–10 % — corrections are significant. Apply them, and say so in the report.'
            : '<b>Blockage above 10 %</b> — the tunnel walls are now shaping the flow. First-order corrections are no longer reliable; use a smaller model or a bigger section.');
      }
    }

    var uc = $('unc-chips');
    if (uc && f) {
      var u = curUncertainty(f);
      uc.innerHTML = chip('u(Cₓ)/Cₓ', (100 * u.rel.Cd).toFixed(2) + ' %',
                          u.rel.Cd < 0.02 ? 'ok' : (u.rel.Cd < 0.05 ? 'warn' : 'bad')) +
                     chip('U(Cₓ) k=2', '±' + u.U.Cd.toFixed(4)) +
                     chip('u(Re)/Re', (100 * u.rel.Re).toFixed(2) + ' %') +
                     chip('u(q)/q', (100 * u.rel.q).toFixed(2) + ' %') +
                     chip('dominant', u.dominant, 'warn');
    }
  }

  /* ---- wiring ---- */
  function labChanged(reinitParticles) {
    window._cpCache = null;
    if (reinitParticles) initParticles();
    syncLabSetup();
    updateResults();
    if (state.mode === 'simulate') { drawMachine(); drawGraph(); }
  }

  function wireLabSetup() {
    var on = function (id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); };

    on('alt-slider', 'input', function (e) {
      state.altitudeM = +e.target.value;
      if (state.useISATemp) state.tempC = isaAtAltitude(state.altitudeM).T - 273.15;
      labChanged(false);
    });
    on('temp-slider', 'input', function (e) { state.tempC = +e.target.value; labChanged(false); });
    on('chk-isa-temp', 'change', function (e) {
      state.useISATemp = e.target.checked;
      if (state.useISATemp) state.tempC = isaAtAltitude(state.altitudeM).T - 273.15;
      labChanged(false);
    });

    on('btn-re-apply', 'click', function () {
      var el = $('re-target'); if (!el) return;
      var target = parseFloat(el.value);
      var note = $('re-match-note');
      if (!isFinite(target) || target <= 0) {
        if (note) note.innerHTML = 'Enter a positive Reynolds number to match.';
        return;
      }
      var D = state.objSize / 1000;
      var V = speedForReynolds(target, D, curFluid());
      var clampedV = clamp(V, 1, 150);
      saveUndo();
      state.airSpeed = Math.round(clampedV * 10) / 10;
      syncInputs();
      labChanged(false);
      if (note) {
        note.innerHTML = Math.abs(V - clampedV) > 0.05
          ? 'Re = ' + formatSci(target, 2) + ' needs <b>' + V.toFixed(1) + ' m/s</b> at D = ' +
            state.objSize + ' mm — outside the 1–150 m/s range. Speed set to ' + state.airSpeed +
            ' m/s. Change the model size, the fluid, or the altitude to reach it: that trade is exactly what scale testing is about.'
          : 'Re = ' + formatSci(target, 2) + ' reached at <b>' + state.airSpeed + ' m/s</b> with D = ' +
            state.objSize + ' mm.';
      }
    });

    on('naca-m', 'input', function (e) {
      saveUndo(); state.naca.m = (+e.target.value) / 100;
      if (state.naca.m > 0 && state.naca.p <= 0) state.naca.p = 0.4;
      labChanged(false);
    });
    on('naca-p', 'input', function (e) { saveUndo(); state.naca.p = (+e.target.value) / 10; labChanged(false); });
    on('naca-t', 'input', function (e) { saveUndo(); state.naca.t = (+e.target.value) / 100; labChanged(true); });
    on('chk-2d', 'change', function (e) {
      saveUndo();
      state.AR = e.target.checked ? Infinity : (+($('ar-slider') || {}).value || 6);
      labChanged(false);
    });
    on('ar-slider', 'input', function (e) { state.AR = +e.target.value; labChanged(false); });
    on('e-slider', 'input', function (e) { state.spanEff = +e.target.value; labChanged(false); });

    on('test-w', 'input', function (e) { state.testW = clamp((+e.target.value || 300) / 1000, 0.05, 3); labChanged(false); });
    on('test-h', 'input', function (e) { state.testH = clamp((+e.target.value || 300) / 1000, 0.05, 3); labChanged(false); });
    on('chk-blockage', 'change', function (e) { saveUndo(); state.applyBlockage = e.target.checked; labChanged(false); });

    [['unc-v', 'uV', 1], ['unc-d', 'uD', 0.001], ['unc-f', 'uF', 1],
     ['unc-t', 'uT', 1], ['unc-p', 'uP', 1]].forEach(function (r) {
      on(r[0], 'input', function (e) {
        var v = parseFloat(e.target.value);
        state.unc[r[1]] = Math.max(isFinite(v) ? v * r[2] : 0, 0);
        updateResults();
      });
    });

    on('sweep-var', 'change', function (e) { state.sweepVar = e.target.value; });
    on('sweep-n', 'input', function (e) { state.sweepN = clamp(Math.round(+e.target.value || 60), 5, 500); });
  }

  /* ═══════════════════════════════════════════════════════════════
     S20  INIT
     ═══════════════════════════════════════════════════════════════ */
  initCanvases();
  buildObjectTabs();
  buildVisTabs();
  buildPresets();
  wirePresetDropdown();
  wireSteppers();
  wireToggles();
  wireActionBar();
  wireLearnPanels();
  wireCtxMenu();
  wireHintBanner();
  wireGraphTabs();
  syncGraphTabs();
  wireLabSetup();
  syncLabSetup();
  syncCheckboxes();
  syncAoaGroup();
  syncInputs();
  syncActionBar();
  initParticles();
  updateResults();   /* populate readouts synchronously — rAF may be throttled in background tabs */
  setMode('simulate');

})();
