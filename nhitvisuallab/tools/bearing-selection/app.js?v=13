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
  function randFloat(a, b) { return a + Math.random() * (b - a); }
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

  /* ================================================================
     UNITS — internal state is ALWAYS SI; imperial is display-only.
     ================================================================ */
  var units = 'SI';                     // 'SI' | 'imp'
  var LB_PER_N = 0.2248089, MM_PER_IN = 25.4, LB_PER_KG = 2.2046226, HP_PER_KW = 1.3410221, LBFT_PER_NM = 0.7375621;
  function isImp() { return units === 'imp'; }
  function commas(n) { return n.toLocaleString('en-US'); }
  // formatters take an SI value, return a display string
  function fmtLen(mm) { return isImp() ? roundN(mm / MM_PER_IN, 2) + ' in' : roundN(mm, 1) + ' mm'; }
  function fmtForce(N) { return isImp() ? commas(Math.round(N * LB_PER_N)) + ' lbf' : commas(Math.round(N)) + ' N'; }
  function fmtRating(kN) { return isImp() ? commas(Math.round(kN * 1000 * LB_PER_N)) + ' lbf' : roundN(kN, kN < 100 ? 2 : 1) + ' kN'; }
  function fmtMass(kg) { return isImp() ? roundN(kg * LB_PER_KG, 2) + ' lb' : roundN(kg, 2) + ' kg'; }
  function fmtTemp(C) { return isImp() ? Math.round(C * 1.8 + 32) + ' °F' : Math.round(C) + ' °C'; }
  function fmtPower(kW) { return isImp() ? roundN(kW * HP_PER_KW, 1) + ' hp' : roundN(kW, 1) + ' kW'; }
  function fmtTorque(Nm) { return isImp() ? roundN(Nm * LBFT_PER_NM, 1) + ' lbf·ft' : roundN(Nm, 1) + ' N·m'; }
  // input converters between SI and current display unit
  function lenToDisp(mm) { return isImp() ? mm / MM_PER_IN : mm; }
  function lenToSI(v) { return isImp() ? v * MM_PER_IN : v; }
  function tempToDisp(C) { return isImp() ? C * 1.8 + 32 : C; }
  function tempToSI(v) { return isImp() ? (v - 32) / 1.8 : v; }
  function powerToDisp(kW) { return isImp() ? kW * HP_PER_KW : kW; }
  function powerToSI(v) { return isImp() ? v / HP_PER_KW : v; }

  /* ================================================================
     BEARING DATABASE
     ================================================================ */
  var BEARING_DB = [
    // Deep Groove Ball (62xx series)
    { series: '6200', bore: 10, C: 5.07, C0: 2.36, type: 'ball' },
    { series: '6201', bore: 12, C: 6.89, C0: 3.45, type: 'ball' },
    { series: '6202', bore: 15, C: 7.80, C0: 3.75, type: 'ball' },
    { series: '6203', bore: 17, C: 9.56, C0: 4.75, type: 'ball' },
    { series: '6204', bore: 20, C: 12.7, C0: 6.55, type: 'ball' },
    { series: '6205', bore: 25, C: 14.8, C0: 7.80, type: 'ball' },
    { series: '6206', bore: 30, C: 19.5, C0: 11.2, type: 'ball' },
    { series: '6207', bore: 35, C: 25.5, C0: 15.3, type: 'ball' },
    { series: '6208', bore: 40, C: 29.1, C0: 17.8, type: 'ball' },
    { series: '6209', bore: 45, C: 33.2, C0: 21.6, type: 'ball' },
    { series: '6210', bore: 50, C: 35.1, C0: 23.2, type: 'ball' },
    // Cylindrical Roller (NUxx series)
    { series: 'NU204', bore: 20, C: 16.8, C0: 11.2, type: 'roller' },
    { series: 'NU205', bore: 25, C: 22.1, C0: 15.6, type: 'roller' },
    { series: 'NU206', bore: 30, C: 28.6, C0: 20.8, type: 'roller' },
    { series: 'NU207', bore: 35, C: 36.9, C0: 28.0, type: 'roller' },
    { series: 'NU208', bore: 40, C: 41.0, C0: 31.5, type: 'roller' },
    { series: 'NU210', bore: 50, C: 56.1, C0: 45.5, type: 'roller' }
  ];

  /* ================================================================
     FIND-BEARING CATALOG (real SKF product-table data)
     Source: SKF "Rolling bearings" catalogue PUB BU/P1 17000/1 EN, Oct 2018
     ================================================================ */
  var FIND_TYPES = {
    dgb: {
      key: 'dgb', name: 'Deep Groove Ball', family: 'ball', p: 3, e: 0.22,
      canRadial: true, canAxial: true, maxMisalign: 0.17,
      note: 'Most versatile bearing — handles radial plus moderate axial load in both directions, high speed capability.',
      calcP: function (Fr, Fa) {
        if (Fr <= 0) return { X: 0, Y: 1 };
        var r = Fa / Fr;
        return r <= 0.22 ? { X: 1, Y: 0 } : { X: 0.56, Y: 1.63 };
      },
      bearings: [
        { series: '6200', d: 10, D: 30, B: 9, C: 5.4, C0: 2.36, nLim: 36000, m: 0.031 },
        { series: '6201', d: 12, D: 32, B: 10, C: 7.28, C0: 3.1, nLim: 32000, m: 0.037 },
        { series: '6002', d: 15, D: 32, B: 9, C: 5.85, C0: 2.85, nLim: 26000, m: 0.03 },
        { series: '6003', d: 17, D: 35, B: 10, C: 6.37, C0: 3.25, nLim: 28000, m: 0.038 },
        { series: '6004', d: 20, D: 42, B: 12, C: 9.95, C0: 5.0, nLim: 24000, m: 0.067 },
        { series: '6205', d: 25, D: 52, B: 15, C: 14.8, C0: 7.8, nLim: 18000, m: 0.13 },
        { series: '6206', d: 30, D: 62, B: 16, C: 20.3, C0: 11.2, nLim: 15000, m: 0.2 },
        { series: '6207', d: 35, D: 72, B: 17, C: 27.0, C0: 15.3, nLim: 13000, m: 0.29 },
        { series: '6208', d: 40, D: 80, B: 18, C: 32.5, C0: 19.0, nLim: 11000, m: 0.37 },
        { series: '6209', d: 45, D: 85, B: 19, C: 35.1, C0: 21.6, nLim: 11000, m: 0.42 },
        { series: '6210', d: 50, D: 90, B: 20, C: 37.1, C0: 23.2, nLim: 10000, m: 0.46 },
        { series: '6211', d: 55, D: 100, B: 21, C: 46.2, C0: 29.0, nLim: 9000, m: 0.61 },
        { series: '6212', d: 60, D: 110, B: 22, C: 55.3, C0: 36.0, nLim: 8000, m: 0.78 },
        { series: '6213', d: 65, D: 120, B: 23, C: 58.5, C0: 40.5, nLim: 7500, m: 1.0 },
        { series: '6214', d: 70, D: 125, B: 24, C: 63.7, C0: 45.0, nLim: 7000, m: 1.1 },
        { series: '6015', d: 75, D: 115, B: 20, C: 41.6, C0: 33.5, nLim: 7500, m: 0.65 },
        { series: '6016', d: 80, D: 125, B: 22, C: 49.4, C0: 40.0, nLim: 7000, m: 0.86 },
        { series: '6017', d: 85, D: 130, B: 22, C: 52.0, C0: 43.0, nLim: 6700, m: 0.9 },
        { series: '6018', d: 90, D: 140, B: 24, C: 60.5, C0: 50.0, nLim: 6300, m: 1.15 },
        { series: '6020', d: 100, D: 150, B: 24, C: 63.7, C0: 54.0, nLim: 5600, m: 1.25 },
        { series: '6022', d: 110, D: 170, B: 28, C: 85.2, C0: 73.5, nLim: 5000, m: 1.95 },
        { series: '6024', d: 120, D: 180, B: 28, C: 88.4, C0: 80.0, nLim: 4800, m: 2.1 },
        { series: '6026', d: 130, D: 200, B: 33, C: 112.0, C0: 100.0, nLim: 4300, m: 3.3 },
        { series: '6028', d: 140, D: 210, B: 33, C: 111.0, C0: 108.0, nLim: 4000, m: 3.45 },
        { series: '6030', d: 150, D: 225, B: 35, C: 125.0, C0: 125.0, nLim: 3800, m: 4.3 }
      ]
    },
    ang: {
      key: 'ang', name: 'Angular Contact Ball (40°)', family: 'ball', p: 3, e: 1.14,
      canRadial: true, canAxial: true, maxMisalign: 0.08,
      note: 'Offset raceways carry combined radial + axial load in one direction; pair back-to-back for both directions. Preferred for spindles.',
      calcP: function (Fr, Fa) {
        if (Fr <= 0) return { X: 0, Y: 0.57 };
        var r = Fa / Fr;
        return r <= 1.14 ? { X: 1, Y: 0 } : { X: 0.35, Y: 0.57 };
      },
      bearings: [
        { series: '7200 BECBP', d: 10, D: 30, B: 9, C: 7.02, C0: 3.35, nLim: 30000, m: 0.03 },
        { series: '7201 BECBP', d: 12, D: 32, B: 10, C: 7.61, C0: 3.8, nLim: 26000, m: 0.036 },
        { series: '7202 BECBP', d: 15, D: 35, B: 11, C: 8.8, C0: 4.65, nLim: 26000, m: 0.045 },
        { series: '7203 BECBP', d: 17, D: 40, B: 12, C: 11, C0: 5.85, nLim: 20000, m: 0.065 },
        { series: '7204 BECBP', d: 20, D: 47, B: 14, C: 14.3, C0: 8.15, nLim: 19000, m: 0.11 },
        { series: '7205 BECBP', d: 25, D: 52, B: 15, C: 15.6, C0: 10, nLim: 17000, m: 0.13 },
        { series: '7206 BECBP', d: 30, D: 62, B: 16, C: 24, C0: 15.6, nLim: 14000, m: 0.2 },
        { series: '7207 BECBP', d: 35, D: 72, B: 17, C: 31, C0: 20.8, nLim: 12000, m: 0.28 },
        { series: '7208 BECBP', d: 40, D: 80, B: 18, C: 36.5, C0: 26, nLim: 11000, m: 0.37 },
        { series: '7209 BECBP', d: 45, D: 85, B: 19, C: 38, C0: 28.5, nLim: 10000, m: 0.42 },
        { series: '7210 BECBP', d: 50, D: 90, B: 20, C: 40, C0: 31, nLim: 9000, m: 0.47 },
        { series: '7211 BECBP', d: 55, D: 100, B: 21, C: 49, C0: 40, nLim: 8000, m: 0.62 },
        { series: '7212 BECBPH', d: 60, D: 110, B: 22, C: 61, C0: 50, nLim: 7500, m: 0.8 },
        { series: '7213 BECBP', d: 65, D: 120, B: 23, C: 69.5, C0: 57, nLim: 6700, m: 1.0 },
        { series: '7214 BECBP', d: 70, D: 125, B: 24, C: 72, C0: 60, nLim: 6300, m: 1.1 },
        { series: '7215 BECBP', d: 75, D: 130, B: 25, C: 73.5, C0: 65.5, nLim: 6300, m: 1.2 },
        { series: '7216 BECBP', d: 80, D: 140, B: 26, C: 85, C0: 75, nLim: 5600, m: 1.45 },
        { series: '7217 BECBP', d: 85, D: 150, B: 28, C: 102, C0: 90, nLim: 5300, m: 1.85 },
        { series: '7218 BECBP', d: 90, D: 160, B: 30, C: 116, C0: 104, nLim: 5000, m: 2.3 },
        { series: '7220 BECBP', d: 100, D: 180, B: 34, C: 143, C0: 134, nLim: 4500, m: 3.3 },
        { series: '7222 BECBP', d: 110, D: 200, B: 38, C: 163, C0: 156, nLim: 4000, m: 4.6 },
        { series: '7224 BCBM', d: 120, D: 215, B: 40, C: 165, C0: 163, nLim: 3600, m: 5.9 }
      ]
    },
    sab: {
      key: 'sab', name: 'Self-Aligning Ball', family: 'ball', p: 3, e: 0.4,
      canRadial: true, canAxial: true,
      note: 'Spherical outer raceway self-corrects for shaft misalignment and housing deflection — use where shaft/housing alignment cannot be guaranteed.',
      calcP: function (Fr, Fa) {
        if (Fr <= 0) return { X: 0, Y: 2.3 };
        var r = Fa / Fr;
        return r <= 0.4 ? { X: 1, Y: 0 } : { X: 0.65, Y: 2.3 };
      },
      bearings: [
        { series: '1200 ETN9', d: 10, D: 30, B: 9, C: 5.53, C0: 1.18, nLim: 36000, m: 0.034, align: 2.5 },
        { series: '1202 ETN9', d: 15, D: 35, B: 11, C: 7.41, C0: 1.76, nLim: 28000, m: 0.049, align: 2.5 },
        { series: '1204 ETN9', d: 20, D: 47, B: 14, C: 12.7, C0: 3.4, nLim: 20000, m: 0.12, align: 2.5 },
        { series: '1205 ETN9', d: 25, D: 52, B: 15, C: 14.3, C0: 4.0, nLim: 18000, m: 0.14, align: 2.5 },
        { series: '1305 ETN9', d: 25, D: 62, B: 17, C: 19, C0: 5.4, nLim: 15000, m: 0.26, align: 3.0 },
        { series: '1206 ETN9', d: 30, D: 62, B: 16, C: 15.6, C0: 4.65, nLim: 15000, m: 0.22, align: 2.5 },
        { series: '1207 ETN9', d: 35, D: 72, B: 17, C: 19, C0: 6.0, nLim: 13000, m: 0.32, align: 2.5 },
        { series: '1307 ETN9', d: 35, D: 80, B: 21, C: 26.5, C0: 8.5, nLim: 11000, m: 0.51, align: 3.0 },
        { series: '1208 ETN9', d: 40, D: 80, B: 18, C: 19.9, C0: 6.95, nLim: 11000, m: 0.42, align: 2.5 },
        { series: '1209 ETN9', d: 45, D: 85, B: 19, C: 22.9, C0: 7.8, nLim: 11000, m: 0.47, align: 2.5 },
        { series: '1210 ETN9', d: 50, D: 90, B: 20, C: 26.5, C0: 9.15, nLim: 10000, m: 0.53, align: 2.5 },
        { series: '1211 ETN9', d: 55, D: 100, B: 21, C: 27.6, C0: 10.6, nLim: 9000, m: 0.71, align: 2.5 },
        { series: '1212 ETN9', d: 60, D: 110, B: 22, C: 31.2, C0: 12.2, nLim: 8500, m: 0.9, align: 2.5 },
        { series: '1215', d: 75, D: 130, B: 25, C: 39, C0: 15.6, nLim: 6700, m: 1.35, align: 2.5 },
        { series: '1218', d: 90, D: 160, B: 30, C: 57.2, C0: 23.6, nLim: 5300, m: 2.5, align: 2.5 },
        { series: '1220', d: 100, D: 180, B: 34, C: 68.9, C0: 30, nLim: 4800, m: 3.7, align: 2.5 }
      ]
    },
    cyl: {
      key: 'cyl', name: 'Cylindrical Roller (NU)', family: 'roller', p: 10 / 3, e: 0,
      canRadial: true, canAxial: false, maxMisalign: 0.04,
      note: 'Line contact gives the highest radial capacity for a given size; standard NU design carries no axial load and allows free axial float (non-locating position).',
      calcP: function () { return { X: 1, Y: 0 }; },
      bearings: [
        { series: 'NU 202 ECP', d: 15, D: 35, B: 11, C: 12.5, C0: 10.2, nLim: 26000, m: 0.047 },
        { series: 'NU 203 ECP', d: 17, D: 40, B: 12, C: 20, C0: 14.3, nLim: 22000, m: 0.068 },
        { series: 'NU 204 ECP', d: 20, D: 47, B: 14, C: 28.5, C0: 22, nLim: 19000, m: 0.11 },
        { series: 'NU 205 ECP', d: 25, D: 52, B: 15, C: 32.5, C0: 27, nLim: 16000, m: 0.13 },
        { series: 'NU 305 ECP', d: 25, D: 62, B: 17, C: 46.5, C0: 36.5, nLim: 15000, m: 0.23 },
        { series: 'NU 206 ECP', d: 30, D: 62, B: 16, C: 44, C0: 36.5, nLim: 14000, m: 0.2 },
        { series: 'NU 207 ECP', d: 35, D: 72, B: 17, C: 56, C0: 48, nLim: 12000, m: 0.29 },
        { series: 'NU 208 ECP', d: 40, D: 80, B: 18, C: 62, C0: 53, nLim: 11000, m: 0.37 },
        { series: 'NU 209 ECP', d: 45, D: 85, B: 19, C: 69.5, C0: 64, nLim: 9500, m: 0.42 },
        { series: 'NU 210 ECP', d: 50, D: 90, B: 20, C: 73.5, C0: 69.5, nLim: 9000, m: 0.47 },
        { series: 'NU 211 ECP', d: 55, D: 100, B: 21, C: 96.5, C0: 95, nLim: 8000, m: 0.66 },
        { series: 'NU 212 ECP', d: 60, D: 110, B: 22, C: 108, C0: 102, nLim: 7500, m: 0.79 },
        { series: 'NU 213 ECP', d: 65, D: 120, B: 23, C: 122, C0: 118, nLim: 6700, m: 1.0 },
        { series: 'NU 214 ECP', d: 70, D: 125, B: 24, C: 137, C0: 137, nLim: 6300, m: 1.15 },
        { series: 'NU 215 ECP', d: 75, D: 130, B: 25, C: 150, C0: 156, nLim: 6000, m: 1.25 },
        { series: 'NU 216 ECP', d: 80, D: 140, B: 26, C: 160, C0: 166, nLim: 5600, m: 1.55 },
        { series: 'NU 217 ECP', d: 85, D: 150, B: 28, C: 190, C0: 200, nLim: 5300, m: 1.9 },
        { series: 'NU 218 ECP', d: 90, D: 160, B: 30, C: 208, C0: 220, nLim: 5000, m: 2.3 },
        { series: 'NU 220 ECP', d: 100, D: 180, B: 34, C: 285, C0: 305, nLim: 4500, m: 3.35 },
        { series: 'NU 222 ECP', d: 110, D: 200, B: 38, C: 335, C0: 365, nLim: 4000, m: 4.7 },
        { series: 'NU 224 ECP', d: 120, D: 215, B: 40, C: 390, C0: 430, nLim: 3600, m: 5.75 },
        { series: 'NU 226 ECP', d: 130, D: 230, B: 40, C: 415, C0: 455, nLim: 3400, m: 6.45 },
        { series: 'NU 230 ECM', d: 150, D: 270, B: 45, C: 510, C0: 600, nLim: 2800, m: 11.5 }
      ]
    },
    tap: {
      key: 'tap', name: 'Tapered Roller (single row)', family: 'roller', p: 10 / 3,
      canRadial: true, canAxial: true, maxMisalign: 0.02,
      note: 'Conical rollers carry combined radial + axial load in one direction; mount in opposed pairs for axial load in both directions.',
      calcP: function (Fr, Fa, entry) {
        var e = entry.e || 0.4, Y = entry.Y || 1.5;
        if (Fr <= 0) return { X: 0, Y: Y };
        var r = Fa / Fr;
        return r <= e ? { X: 1, Y: 0 } : { X: 0.4, Y: Y };
      },
      bearings: [
        { series: '30202', d: 15, D: 35, B: 11.75, C: 18.5, C0: 14.6, nLim: 20000, m: 0.055, e: 0.35, Y: 1.7 },
        { series: '30203', d: 17, D: 40, B: 13.25, C: 23.4, C0: 18.6, nLim: 18000, m: 0.079, e: 0.35, Y: 1.7 },
        { series: '32004 X', d: 20, D: 42, B: 15, C: 29.7, C0: 27, nLim: 16000, m: 0.099, e: 0.37, Y: 1.6 },
        { series: '30205', d: 25, D: 47, B: 15, C: 33.2, C0: 32.5, nLim: 14000, m: 0.11, e: 0.43, Y: 1.4 },
        { series: '32006 X', d: 30, D: 55, B: 17, C: 43.9, C0: 44, nLim: 12000, m: 0.17, e: 0.43, Y: 1.4 },
        { series: '32007 X', d: 35, D: 62, B: 18, C: 52.3, C0: 54, nLim: 10000, m: 0.23, e: 0.46, Y: 1.3 },
        { series: '32008 X', d: 40, D: 68, B: 19, C: 64.7, C0: 71, nLim: 9500, m: 0.28, e: 0.37, Y: 1.6 },
        { series: '32009 X', d: 45, D: 75, B: 20, C: 71.7, C0: 80, nLim: 8500, m: 0.34, e: 0.4, Y: 1.5 },
        { series: '32910', d: 50, D: 72, B: 15, C: 41.3, C0: 53, nLim: 8500, m: 0.19, e: 0.35, Y: 1.7 },
        { series: '32911', d: 55, D: 80, B: 17, C: 51.7, C0: 69.5, nLim: 7500, m: 0.28, e: 0.31, Y: 1.9 },
        { series: '32912', d: 60, D: 85, B: 17, C: 53.2, C0: 75, nLim: 6700, m: 0.3, e: 0.33, Y: 1.8 },
        { series: '32913', d: 65, D: 90, B: 17, C: 54.7, C0: 80, nLim: 6700, m: 0.32, e: 0.35, Y: 1.7 },
        { series: '32914', d: 70, D: 100, B: 20, C: 85.8, C0: 112, nLim: 6000, m: 0.49, e: 0.33, Y: 1.9 },
        { series: '32915', d: 75, D: 105, B: 20, C: 86.8, C0: 116, nLim: 5600, m: 0.51, e: 0.33, Y: 1.8 },
        { series: '32916', d: 80, D: 110, B: 20, C: 89.7, C0: 125, nLim: 5600, m: 0.54, e: 0.35, Y: 1.7 },
        { series: '32917', d: 85, D: 120, B: 23, C: 115, C0: 156, nLim: 5000, m: 0.78, e: 0.33, Y: 1.8 },
        { series: '32918', d: 90, D: 125, B: 23, C: 119, C0: 166, nLim: 4800, m: 0.83, e: 0.35, Y: 1.7 },
        { series: '32920', d: 100, D: 140, B: 25, C: 147, C0: 204, nLim: 4300, m: 1.15, e: 0.33, Y: 1.8 },
        { series: '32924', d: 120, D: 165, B: 29, C: 204, C0: 305, nLim: 3600, m: 1.8, e: 0.35, Y: 1.7 },
        { series: 'T4DB 150', d: 150, D: 210, B: 32, C: 287, C0: 390, nLim: 2800, m: 3.1, e: 0.48, Y: 1.25 }
      ]
    },
    sph: {
      key: 'sph', name: 'Spherical Roller', family: 'roller', p: 10 / 3, e: 0.3,
      canRadial: true, canAxial: true,
      note: 'Two rows of barrel rollers on a common spherical outer raceway — very heavy radial load capacity plus self-aligning for shaft deflection/misalignment.',
      calcP: function (Fr, Fa) {
        if (Fr <= 0) return { X: 0, Y: 3.5 };
        var r = Fa / Fr;
        return r <= 0.3 ? { X: 1, Y: 0 } : { X: 0.67, Y: 3.5 };
      },
      bearings: [
        { series: '22205 E', d: 25, D: 52, B: 18, C: 49.9, C0: 44, nLim: 17000, m: 0.26, align: 2 },
        { series: '22207 E', d: 35, D: 72, B: 23, C: 88.8, C0: 85, nLim: 12000, m: 0.45, align: 2 },
        { series: '22209 E', d: 45, D: 85, B: 23, C: 104, C0: 98, nLim: 10000, m: 0.58, align: 2 },
        { series: '22211 E', d: 55, D: 100, B: 25, C: 129, C0: 127, nLim: 8500, m: 0.84, align: 1.5 },
        { series: '22212 E', d: 60, D: 110, B: 28, C: 159, C0: 166, nLim: 7500, m: 1.15, align: 1.5 },
        { series: '22213 E', d: 65, D: 120, B: 31, C: 198, C0: 216, nLim: 7000, m: 1.55, align: 1.5 },
        { series: '22214 E', d: 70, D: 125, B: 31, C: 213, C0: 228, nLim: 6700, m: 1.55, align: 1.5 },
        { series: '22215 E', d: 75, D: 130, B: 31, C: 217, C0: 240, nLim: 6300, m: 1.7, align: 1.5 },
        { series: '22216 E', d: 80, D: 140, B: 33, C: 243, C0: 270, nLim: 6000, m: 2.1, align: 1.5 },
        { series: '22217 E', d: 85, D: 150, B: 36, C: 291, C0: 325, nLim: 5600, m: 2.7, align: 1.5 },
        { series: '22218 E', d: 90, D: 160, B: 40, C: 331, C0: 375, nLim: 5300, m: 3.4, align: 1.5 },
        { series: '22220 E', d: 100, D: 180, B: 46, C: 433, C0: 490, nLim: 4500, m: 4.9, align: 1.5 },
        { series: '22222 E', d: 110, D: 200, B: 53, C: 572, C0: 640, nLim: 4000, m: 7, align: 1.5 },
        { series: '22224 E', d: 120, D: 215, B: 58, C: 652, C0: 765, nLim: 3800, m: 8.7, align: 1.5 },
        { series: '22228 CC/W33', d: 140, D: 250, B: 68, C: 743, C0: 900, nLim: 3200, m: 14, align: 1.5 },
        { series: '22230 CC/W33', d: 150, D: 270, B: 73, C: 898, C0: 1080, nLim: 3000, m: 18, align: 1.5 }
      ]
    },
    ndl: {
      key: 'ndl', name: 'Needle Roller (NA, w/ inner ring)', family: 'roller', p: 10 / 3, e: 0,
      canRadial: true, canAxial: false, maxMisalign: 0,
      note: 'Thin needle rollers give high radial capacity in a minimal radial envelope; no axial load capacity and essentially no misalignment tolerance.',
      calcP: function () { return { X: 1, Y: 0 }; },
      bearings: [
        { series: 'NA 4900', d: 10, D: 22, B: 13, C: 8.8, C0: 10.4, nLim: 28000, m: 0.024 },
        { series: 'NA 4902', d: 15, D: 28, B: 13, C: 11.2, C0: 15.3, nLim: 22000, m: 0.034 },
        { series: 'NA 4903', d: 17, D: 30, B: 13, C: 11.4, C0: 16.3, nLim: 20000, m: 0.038 },
        { series: 'NA 4904', d: 20, D: 37, B: 17, C: 21.6, C0: 28, nLim: 17000, m: 0.075 },
        { series: 'NA 4905', d: 25, D: 42, B: 17, C: 24.2, C0: 34.5, nLim: 15000, m: 0.088 },
        { series: 'NA 4906', d: 30, D: 47, B: 17, C: 25.5, C0: 39, nLim: 13000, m: 0.1 },
        { series: 'NA 4907', d: 35, D: 55, B: 20, C: 31.9, C0: 54, nLim: 11000, m: 0.17 },
        { series: 'NA 4908', d: 40, D: 62, B: 22, C: 42.9, C0: 71, nLim: 9500, m: 0.23 },
        { series: 'NA 4909', d: 45, D: 68, B: 22, C: 45.7, C0: 78, nLim: 8500, m: 0.27 },
        { series: 'NA 4910', d: 50, D: 72, B: 22, C: 47.3, C0: 85, nLim: 8000, m: 0.27 },
        { series: 'NA 4912', d: 60, D: 85, B: 25, C: 60.5, C0: 114, nLim: 6700, m: 0.43 },
        { series: 'NA 4913', d: 65, D: 90, B: 25, C: 61.6, C0: 120, nLim: 6300, m: 0.46 },
        { series: 'NA 4914', d: 70, D: 100, B: 30, C: 84.2, C0: 163, nLim: 5600, m: 0.73 },
        { series: 'NA 4916', d: 80, D: 110, B: 30, C: 88, C0: 183, nLim: 5000, m: 0.88 },
        { series: 'NA 4918', d: 90, D: 125, B: 35, C: 112, C0: 265, nLim: 4300, m: 1.3 },
        { series: 'NA 4920', d: 100, D: 140, B: 40, C: 125, C0: 280, nLim: 4000, m: 1.9 }
      ]
    },
    thr: {
      key: 'thr', name: 'Thrust (Ball / Cylindrical Roller)', family: 'thrust',
      canRadial: false, canAxial: true, maxMisalign: 0,
      note: 'Axial loads only — must not be subjected to any radial load. Ball type for lighter/faster duty, roller type for heavier axial loads at lower speed.',
      calcP: function () { return { X: 0, Y: 1 }; },
      bearings: [
        { series: '51100', d: 10, D: 24, B: 9, C: 9.95, C0: 15.3, nLim: 13000, m: 0.02, p: 3, fam: 'thrust_ball' },
        { series: '51102', d: 15, D: 28, B: 9, C: 10.6, C0: 18.3, nLim: 12000, m: 0.023, p: 3, fam: 'thrust_ball' },
        { series: '81102 TN', d: 15, D: 28, B: 9, C: 11.2, C0: 27, nLim: 8500, m: 0.024, p: 10 / 3, fam: 'thrust_roller' },
        { series: '51104', d: 20, D: 35, B: 10, C: 15.1, C0: 29, nLim: 10000, m: 0.037, p: 3, fam: 'thrust_ball' },
        { series: '81104 TN', d: 20, D: 35, B: 10, C: 18.6, C0: 48, nLim: 7500, m: 0.037, p: 10 / 3, fam: 'thrust_roller' },
        { series: '51105', d: 25, D: 42, B: 11, C: 18.2, C0: 39, nLim: 9000, m: 0.056, p: 3, fam: 'thrust_ball' },
        { series: '51106', d: 30, D: 47, B: 11, C: 19, C0: 43, nLim: 8500, m: 0.063, p: 3, fam: 'thrust_ball' },
        { series: '81106 TN', d: 30, D: 47, B: 11, C: 27, C0: 78, nLim: 6000, m: 0.057, p: 10 / 3, fam: 'thrust_roller' },
        { series: '51108', d: 40, D: 60, B: 13, C: 25.5, C0: 63, nLim: 7000, m: 0.12, p: 3, fam: 'thrust_ball' },
        { series: '81108 TN', d: 40, D: 60, B: 13, C: 43, C0: 137, nLim: 5000, m: 0.11, p: 10 / 3, fam: 'thrust_roller' },
        { series: '51110', d: 50, D: 70, B: 14, C: 27, C0: 75, nLim: 6300, m: 0.16, p: 3, fam: 'thrust_ball' },
        { series: '81110 TN', d: 50, D: 70, B: 14, C: 47.5, C0: 166, nLim: 4300, m: 0.14, p: 10 / 3, fam: 'thrust_roller' },
        { series: '81113 TN', d: 65, D: 90, B: 18, C: 83, C0: 320, nLim: 3400, m: 0.31, p: 10 / 3, fam: 'thrust_roller' },
        { series: '81115 TN', d: 75, D: 100, B: 19, C: 83, C0: 335, nLim: 3200, m: 0.39, p: 10 / 3, fam: 'thrust_roller' },
        { series: '81116 TN', d: 80, D: 105, B: 19, C: 81.5, C0: 335, nLim: 3000, m: 0.4, p: 10 / 3, fam: 'thrust_roller' },
        { series: '51120', d: 100, D: 135, B: 25, C: 80.6, C0: 265, nLim: 3200, m: 0.97, p: 3, fam: 'thrust_ball' },
        { series: '81120 TN', d: 100, D: 135, B: 25, C: 156, C0: 630, nLim: 2400, m: 0.95, p: 10 / 3, fam: 'thrust_roller' },
        { series: '81130 TN', d: 150, D: 190, B: 31, C: 212, C0: 1000, nLim: 1700, m: 2.2, p: 10 / 3, fam: 'thrust_roller' }
      ]
    }
  };

  /* ================================================================
     SUPPLEMENTARY SKF DATA — fatigue load limit Pu (kN, from SKF
     product tables), static load factors X0/Y0, and ISO 281 category.
     Powers the SKF rating life (L10m) and static safety (s0).
     ================================================================ */
  var PU_DATA = {
    // Deep groove ball
    '6200': 0.1, '6201': 0.132, '6002': 0.12, '6003': 0.137, '6004': 0.212, '6205': 0.335,
    '6206': 0.475, '6207': 0.655, '6208': 0.8, '6209': 0.915, '6210': 0.98, '6211': 1.25,
    '6212': 1.53, '6213': 1.73, '6214': 1.9, '6015': 1.43, '6016': 1.66, '6017': 1.76,
    '6018': 1.96, '6020': 2.04, '6022': 2.6, '6024': 2.75, '6026': 3.35, '6028': 3.45, '6030': 3.9,
    // Angular contact ball (40°)
    '7200 BECBP': 0.14, '7201 BECBP': 0.16, '7202 BECBP': 0.196, '7203 BECBP': 0.25, '7204 BECBP': 0.345,
    '7205 BECBP': 0.43, '7206 BECBP': 0.655, '7207 BECBP': 0.88, '7208 BECBP': 1.1, '7209 BECBP': 1.22,
    '7210 BECBP': 1.32, '7211 BECBP': 1.66, '7212 BECBPH': 2.12, '7213 BECBP': 2.45, '7214 BECBP': 2.55,
    '7215 BECBP': 2.7, '7216 BECBP': 3.05, '7217 BECBP': 3.55, '7218 BECBP': 4.0, '7220 BECBP': 4.75,
    '7222 BECBP': 5.3, '7224 BCBM': 5.3,
    // Self-aligning ball
    '1200 ETN9': 0.061, '1202 ETN9': 0.09, '1204 ETN9': 0.18, '1205 ETN9': 0.21, '1305 ETN9': 0.28,
    '1206 ETN9': 0.24, '1207 ETN9': 0.31, '1307 ETN9': 0.43, '1208 ETN9': 0.36, '1209 ETN9': 0.4,
    '1210 ETN9': 0.48, '1211 ETN9': 0.54, '1212 ETN9': 0.62, '1215': 0.8, '1218': 1.08, '1220': 1.29,
    // Cylindrical roller (NU)
    'NU 202 ECP': 1.22, 'NU 203 ECP': 1.73, 'NU 204 ECP': 2.75, 'NU 205 ECP': 3.35, 'NU 305 ECP': 4.55,
    'NU 206 ECP': 4.5, 'NU 207 ECP': 6.1, 'NU 208 ECP': 6.7, 'NU 209 ECP': 8.15, 'NU 210 ECP': 8.8,
    'NU 211 ECP': 12.2, 'NU 212 ECP': 13.4, 'NU 213 ECP': 15.6, 'NU 214 ECP': 18, 'NU 215 ECP': 20.4,
    'NU 216 ECP': 21.2, 'NU 217 ECP': 25, 'NU 218 ECP': 27, 'NU 220 ECP': 36.5, 'NU 222 ECP': 42.5,
    'NU 224 ECP': 49, 'NU 226 ECP': 51, 'NU 230 ECM': 64,
    // Tapered roller
    '30202': 1.43, '30203': 1.83, '32004 X': 2.65, '30205': 3.45, '32006 X': 4.55, '32007 X': 5.85,
    '32008 X': 7.65, '32009 X': 8.8, '32910': 5.6, '32911': 7.2, '32912': 7.8, '32913': 8.15,
    '32914': 12.7, '32915': 13.2, '32916': 14, '32917': 17.6, '32918': 18.3, '32920': 22.4,
    '32924': 32, 'T4DB 150': 40,
    // Spherical roller
    '22205 E': 4.75, '22207 E': 9.3, '22209 E': 10.8, '22211 E': 13.7, '22212 E': 18.6, '22213 E': 24,
    '22214 E': 25.5, '22215 E': 26.5, '22216 E': 29, '22217 E': 34.5, '22218 E': 39, '22220 E': 49,
    '22222 E': 63, '22224 E': 73.5, '22228 CC/W33': 86.5, '22230 CC/W33': 102,
    // Needle roller (NA49, with inner ring)
    'NA 4900': 1.22, 'NA 4902': 1.83, 'NA 4903': 1.96, 'NA 4904': 3.35, 'NA 4905': 4.15, 'NA 4906': 4.65,
    'NA 4907': 6.7, 'NA 4908': 8.8, 'NA 4909': 9.65, 'NA 4910': 10.6, 'NA 4912': 14.3, 'NA 4913': 14.6,
    'NA 4914': 20.8, 'NA 4916': 23.2, 'NA 4918': 32.5, 'NA 4920': 34,
    // Thrust
    '51100': 0.56, '51102': 0.67, '51104': 1.08, '51105': 1.43, '51106': 1.6, '51108': 2.32,
    '51110': 2.8, '51120': 9.15, '81102 TN': 2.45, '81104 TN': 4.65, '81106 TN': 7.65, '81108 TN': 13.7,
    '81110 TN': 16.6, '81113 TN': 32.5, '81115 TN': 34, '81116 TN': 34, '81120 TN': 62, '81130 TN': 88
  };
  // Per-type static load factors (X0, Y0) and ISO 281 rating-life category.
  // rb = radial ball, rr = radial roller; thrust resolved per-entry via fam.
  var TYPE_EXT = {
    dgb: { X0: 0.6, Y0: 0.5, iso: 'rb' }, ang: { X0: 0.5, Y0: 0.26, iso: 'rb' },
    sab: { X0: 1, Y0: 2.5, iso: 'rb' }, cyl: { X0: 1, Y0: 0, iso: 'rr' },
    tap: { X0: 0.5, Y0: 0.9, iso: 'rr' }, sph: { X0: 1, Y0: 2.5, iso: 'rr' },
    ndl: { X0: 1, Y0: 0, iso: 'rr' }, thr: { X0: 0, Y0: 1, iso: null }
  };
  Object.keys(FIND_TYPES).forEach(function (k) {
    var cfg = FIND_TYPES[k], ext = TYPE_EXT[k];
    cfg.X0 = ext.X0; cfg.Y0 = ext.Y0; cfg.iso = ext.iso;
    cfg.bearings.forEach(function (e) { if (PU_DATA[e.series] != null) e.pu = PU_DATA[e.series]; });
  });

  /* ── ISO 281:2007 SKF rating life helpers ──────────────────────
     Lnm = a1 · aSKF · L10,  aSKF = f(kappa, eta_c·Cu/P).
     aISO coefficients validated against SKF diagrams 9–12. ────────── */
  var A1_REL = { '90': 1, '95': 0.64, '96': 0.55, '97': 0.47, '98': 0.37, '99': 0.25 };
  var ETAC = { extreme: 1, high: 0.7, normal: 0.55, slight: 0.4, typical: 0.2, severe: 0.05 };
  var ETAC_LABEL = {
    extreme: 'Extreme cleanliness', high: 'High (sealed)', normal: 'Normal (shielded)',
    slight: 'Slight contamination', typical: 'Typical contamination', severe: 'Severe contamination'
  };

  function aISO(iso, kappa, x) {
    // x = eta_c · Cu/P (dimensionless);  valid 0.1 ≤ kappa ≤ 4, capped [0.1, 50]
    if (kappa > 4) kappa = 4;
    if (kappa < 0.1) return 0.1;
    if (x <= 0) return 0.1;
    var ball = (iso === 'rb' || iso === 'tb');
    var C1, C2, C3, C4, C5, C6;
    if (ball) {
      C1 = 2.5671; C4 = 0.83; C5 = 1 / 3; C6 = 9.3;
      if (kappa < 0.4) { C2 = 2.2649; C3 = 0.054381; }
      else if (kappa <= 1) { C2 = 1.9987; C3 = 0.19087; }
      else { C2 = 1.9987; C3 = 0.071739; }
    } else {
      C1 = 1.5859; C4 = 1.0; C5 = 0.4; C6 = 9.185;
      if (kappa < 0.4) { C2 = 1.3993; C3 = 0.054381; }
      else if (kappa <= 1) { C2 = 1.2348; C3 = 0.19087; }
      else { C2 = 1.2348; C3 = 0.071739; }
    }
    var base = C1 - C2 / Math.pow(kappa, C3);
    if (base <= 0) return 0.1;
    var Z = Math.pow(base, C4) * Math.pow(x, C5);
    if (Z >= 1) return 50;
    var a = 0.1 / Math.pow(1 - Z, C6);
    return Math.max(0.1, Math.min(50, a));
  }
  function isoCatFor(cfg, entry) {
    if (cfg.iso) return cfg.iso;
    return entry.fam === 'thrust_roller' ? 'tr' : 'tb';
  }

  /* ── Requirement-driven selection engine ────────────────────── */
  function findBearings(req) {
    // req: { bore(optional Number|null), Fr(N), Fa(N), speed(rpm), life(hours), misalign(deg) }
    var results = [];
    Object.keys(FIND_TYPES).forEach(function (key) {
      var cfg = FIND_TYPES[key];
      var reasons = [];
      if (req.Fa > 0.02 * Math.max(req.Fr, 1) && !cfg.canAxial) {
        reasons.push('Cannot carry axial load (Fa = ' + req.Fa + ' N)');
      }
      if (req.Fr > 0.02 * Math.max(req.Fa, 1) && !cfg.canRadial) {
        reasons.push('Cannot carry radial load (Fr = ' + req.Fr + ' N)');
      }

      var candidates = [];
      if (reasons.length === 0) cfg.bearings.forEach(function (entry) {
        if (req.bore && entry.d < req.bore) return;
        var maxMis = entry.align != null ? entry.align : (cfg.maxMisalign != null ? cfg.maxMisalign : 0);
        if (req.misalign > 0 && maxMis < req.misalign) return;

        var xy = cfg.calcP(req.Fr, req.Fa, entry);
        var P = xy.X * req.Fr + xy.Y * req.Fa;
        if (P <= 0) P = Math.max(req.Fr, req.Fa, 1);
        var p = entry.p || cfg.p;
        var reqC_N = P * Math.pow((req.life * 60 * req.speed) / 1e6, 1 / p);
        var reqC_kN = reqC_N / 1000;
        var speedOK = entry.nLim >= req.speed;
        var loadOK = entry.C >= reqC_kN;
        var actualL10mrev = Math.pow((entry.C * 1000) / P, p);
        var actualL10hrs = (actualL10mrev * 1e6) / (60 * req.speed);

        // ── SKF rating life  Lnm = a1 · aSKF · L10 ──
        var a1 = A1_REL[String(req.reliability)] || 1;
        var etaC = ETAC[req.contam] != null ? ETAC[req.contam] : 0.55;
        var kappa = req.kappa > 0 ? req.kappa : 2;
        var aSKF = 1, xFac = null;
        if (entry.pu != null) {
          xFac = etaC * (entry.pu * 1000 / P);   // eta_c · Cu/P (Cu=pu kN, P in N)
          aSKF = aISO(isoCatFor(cfg, entry), kappa, xFac);
        }
        var Lnm_mrev = a1 * aSKF * actualL10mrev;
        var Lnm_hrs = (Lnm_mrev * 1e6) / (60 * req.speed);

        // ── Static safety  s0 = C0 / P0 ──
        var P0 = cfg.X0 * req.Fr + cfg.Y0 * req.Fa;
        if (cfg.canRadial && P0 < req.Fr) P0 = req.Fr;
        if (!cfg.canRadial && P0 < req.Fa) P0 = req.Fa;
        var s0 = P0 > 0 ? (entry.C0 * 1000) / P0 : null;

        // ── Minimum load check (skidding risk) ──
        var minLoadN = (cfg.family === 'ball' ? 0.01 : 0.02) * entry.C * 1000;
        var appliedN = Math.max(req.Fr, req.Fa, 1);
        var minLoadOK = appliedN >= minLoadN;

        candidates.push({
          entry: entry, P: roundN(P, 0), reqC_kN: roundN(reqC_kN, 2),
          speedOK: speedOK, loadOK: loadOK,
          actualL10mrev: actualL10mrev, actualL10hrs: actualL10hrs, p: p,
          a1: a1, aSKF: aSKF, xFac: xFac, kappa: kappa, etaC: etaC,
          Lnm_mrev: Lnm_mrev, Lnm_hrs: Lnm_hrs,
          s0: s0, minLoadN: minLoadN, minLoadOK: minLoadOK
        });
      });

      var suitable = candidates.filter(function (c) { return c.loadOK && c.speedOK; });
      suitable.sort(function (a, b) { return (a.entry.d - b.entry.d) || (a.entry.m - b.entry.m); });
      var best = suitable[0] || null;

      if (!best) {
        if (reasons.length === 0) {
          if (req.misalign > 0 && cfg.bearings.every(function (e) {
            var m = e.align != null ? e.align : (cfg.maxMisalign != null ? cfg.maxMisalign : 0);
            return m < req.misalign;
          })) {
            reasons.push('Misalignment tolerance insufficient for this type');
          } else if (candidates.length === 0) {
            reasons.push('No catalog size in range covers the requested bore');
          } else {
            reasons.push('No catalog bearing in range meets the required life at this speed');
          }
        }
      }

      results.push({ key: key, name: cfg.name, note: cfg.note, best: best, reasons: reasons });
    });

    var suitableResults = results.filter(function (r) { return r.best; });
    var excludedResults = results.filter(function (r) { return !r.best; });
    suitableResults.sort(function (a, b) { return a.best.entry.m - b.best.entry.m; });

    return { suitable: suitableResults, excluded: excludedResults };
  }

  /* ================================================================
     BEARING TYPE CONFIGURATION
     ================================================================ */
  var BEARING_TYPES = {
    dgb: {
      key: 'dgb',
      name: 'Deep Groove Ball',
      dbType: 'ball',
      p: 3,
      e: 0.22,
      getXY: function (Fr, Fa) {
        if (Fr === 0) return { X: 0, Y: 1 };
        var ratio = Fa / Fr;
        if (ratio <= 0.22) return { X: 1, Y: 0 };
        return { X: 0.56, Y: 1.63 };
      },
      nElements: 8,
      elementShape: 'ball',
      canAxial: true,
      canRadial: true
    },
    cyl: {
      key: 'cyl',
      name: 'Cylindrical Roller',
      dbType: 'roller',
      p: 10 / 3,
      e: 0,
      getXY: function () {
        return { X: 1, Y: 0 };
      },
      nElements: 12,
      elementShape: 'roller',
      canAxial: false,
      canRadial: true
    },
    ang: {
      key: 'ang',
      name: 'Angular Contact',
      dbType: 'ball',
      p: 3,
      e: 0.68,
      getXY: function (Fr, Fa) {
        if (Fr === 0) return { X: 0, Y: 0.93 };
        return { X: 0.57, Y: 0.93 };
      },
      nElements: 10,
      elementShape: 'ball',
      canAxial: true,
      canRadial: true
    },
    thr: {
      key: 'thr',
      name: 'Thrust Ball',
      dbType: 'ball',
      p: 3,
      e: Infinity,
      getXY: function () {
        return { X: 0, Y: 1 };
      },
      nElements: 12,
      elementShape: 'ball',
      canAxial: true,
      canRadial: false
    }
  };

  /* ================================================================
     DATA - CONCEPTS (12)
     ================================================================ */
  var CONCEPTS = [
    /* ── Bearing Types ────────────────────────────────────────── */
    {
      id: 'deep-groove-ball', name: 'Deep Groove Ball Bearing', symbol: '62xx',
      formula: 'Radial + light axial loads', unit: '\u2014',
      cat: 'types',
      desc: 'Deep groove ball bearings are the most commonly used rolling bearing type. They are versatile, low-maintenance, and can accommodate both radial loads and moderate axial loads in either direction. The deep raceway grooves and close conformity between the balls and raceways enable them to carry axial loads in both directions. They are suitable for high and very high speeds and are robust, requiring little maintenance. Common applications include electric motors, household appliances, pumps, conveyor rollers, and gearboxes.',
      diagram: 'dgbDiagram',
      example: { problem: 'A deep groove ball bearing 6205 (C = 14.8 kN) carries a radial load of 3 kN at 1500 rpm. Find the L10 life in hours.', steps: ['P = Fr = 3000 N (Fa/Fr < e, so X=1, Y=0)', 'L10 = (C/P)^3 = (14800/3000)^3 = 119.1 million rev', 'Lh = (119.1 \u00D7 10\u2076) / (60 \u00D7 1500)', 'Lh = 1323 hours'], answer: 1323, unit: 'hours' }
    },
    {
      id: 'cylindrical-roller', name: 'Cylindrical Roller Bearing', symbol: 'NUxxx',
      formula: 'Heavy radial loads only', unit: '\u2014',
      cat: 'types',
      desc: 'Cylindrical roller bearings have rollers that make line contact with the raceways, providing much higher radial load capacity than ball bearings of comparable size. The standard NU design has two flanges on the outer ring and none on the inner ring, allowing free axial movement of the shaft relative to the housing. This makes them ideal for non-locating bearing positions. They are widely used in gearboxes, electric motors (drive end), and heavy-duty applications where high radial loads and moderate speeds are encountered.',
      diagram: 'cylDiagram',
      example: { problem: 'A cylindrical roller bearing NU206 (C = 28.6 kN) carries Fr = 10 kN at 1000 rpm. Find L10 life.', steps: ['P = Fr = 10000 N (cylindrical roller: X=1, Y=0)', 'p = 10/3 for roller bearings', 'L10 = (C/P)^(10/3) = (28600/10000)^3.333 = 38.6 Mrev', 'Lh = (38.6 \u00D7 10\u2076) / (60 \u00D7 1000)', 'Lh = 643 hours'], answer: 643, unit: 'hours' }
    },
    {
      id: 'angular-contact', name: 'Angular Contact Bearing', symbol: '72xx',
      formula: 'P = 0.57Fr + 0.93Fa', unit: '\u2014',
      cat: 'types',
      desc: 'Angular contact ball bearings have inner and outer ring raceways that are displaced relative to each other in the direction of the bearing axis. This means they are designed to accommodate combined loads (simultaneous radial and axial loads). The contact angle (typically 15\u00B0, 25\u00B0, or 40\u00B0) determines the axial load capacity \u2014 higher angles support heavier axial loads. They are often used in pairs (back-to-back or face-to-face) to handle axial loads in both directions. Common applications include machine tool spindles, automotive wheel hubs, and pumps.',
      diagram: 'angDiagram',
      example: { problem: 'An angular contact bearing (C = 25.5 kN) carries Fr = 5 kN and Fa = 3 kN at 2000 rpm. Find L10 life.', steps: ['P = 0.57 \u00D7 5000 + 0.93 \u00D7 3000', 'P = 2850 + 2790 = 5640 N', 'L10 = (25500/5640)^3 = 92.2 Mrev', 'Lh = (92.2 \u00D7 10\u2076) / (60 \u00D7 2000)', 'Lh = 768 hours'], answer: 768, unit: 'hours' }
    },
    {
      id: 'thrust-ball', name: 'Thrust Ball Bearing', symbol: '511xx',
      formula: 'P = Fa (axial only)', unit: '\u2014',
      cat: 'types',
      desc: 'Thrust ball bearings consist of shaft and housing washers with a ball and cage assembly between them. They can accommodate axial loads only and must not be subjected to radial loads. Single-direction thrust bearings can support axial loads in one direction, while double-direction types handle loads in both directions. They are self-centering and insensitive to misalignment. Used in crane hooks, turntables, slow-speed automotive clutch release mechanisms, and vertical shaft arrangements.',
      diagram: 'thrDiagram',
      example: { problem: 'A thrust ball bearing (C = 18 kN) carries an axial load of 8 kN at 500 rpm. Find L10 life in hours.', steps: ['P = Fa = 8000 N (thrust bearing)', 'L10 = (C/P)^3 = (18000/8000)^3 = 11.39 Mrev', 'Lh = (11.39 \u00D7 10\u2076) / (60 \u00D7 500)', 'Lh = 380 hours'], answer: 380, unit: 'hours' }
    },

    /* ── Nomenclature ─────────────────────────────────────────── */
    {
      id: 'iso-designation', name: 'ISO Designation System', symbol: '6205',
      formula: 'Type + Series + Bore Code', unit: '\u2014',
      cat: 'nomenclature',
      desc: 'Bearing designations follow ISO 15 standards. The basic designation consists of a type code, a dimension series code, and a bore identification number. For deep groove ball bearings, the prefix is "6". The second digit indicates the width/diameter series (2 = light, 3 = medium). The last two digits represent the bore code. For bore codes 04 and above, multiply by 5 to get the bore diameter in mm. Special codes: 00 = 10 mm, 01 = 12 mm, 02 = 15 mm, 03 = 17 mm.',
      diagram: 'nomenclatureDiagram',
      example: { problem: 'Decode the bearing designation 6208.', steps: ['6 = Deep groove ball bearing', '2 = Light series (diameter and width)', '08 = Bore code (08 \u00D7 5 = 40 mm bore)', 'Result: Deep groove ball bearing, 40 mm bore, light series'], answer: 40, unit: 'mm bore' }
    },
    {
      id: 'bore-codes', name: 'Bore Code Rules', symbol: 'Bore = code\u00D75',
      formula: '00\u219210, 01\u219212, 02\u219215, 03\u219217, 04+\u2192code\u00D75', unit: 'mm',
      cat: 'nomenclature',
      desc: 'The bore identification number (last two digits of the basic designation) indicates the bearing bore diameter. For bore codes 04 and above, multiply the code by 5 to get the bore in millimetres. The four smallest standard bores have special codes: 00 = 10 mm, 01 = 12 mm, 02 = 15 mm, 03 = 17 mm. For example, bore code 05 corresponds to 25 mm (5 \u00D7 5), bore code 10 corresponds to 50 mm (10 \u00D7 5), and bore code 20 corresponds to 100 mm.',
      diagram: 'boreCodeDiagram',
      example: { problem: 'What is the bore diameter for a bearing with bore code 09?', steps: ['Bore code = 09', 'Since code \u2265 04: bore = code \u00D7 5', 'Bore = 9 \u00D7 5 = 45 mm'], answer: 45, unit: 'mm' }
    },
    {
      id: 'series-codes', name: 'Dimension Series', symbol: '62, 63, NU2',
      formula: 'Width + Diameter series', unit: '\u2014',
      cat: 'nomenclature',
      desc: 'The dimension series code appears after the type digit and indicates the cross-section (width and diameter) of the bearing. For deep groove ball bearings: series 60 is extra-light, 62 is light, 63 is medium. Wider series have higher load ratings but larger outer dimensions. For cylindrical roller bearings, the NU2xx series is standard, while NU3xx is a wider variant with higher load capacity. The correct series selection balances load capacity against available space.',
      diagram: 'seriesDiagram',
      example: { problem: 'Compare 6205 and 6305 bearings (both 25 mm bore). C = 14.8 kN vs 25.5 kN. Which offers more life under 5 kN radial load?', steps: ['6205: L10 = (14800/5000)^3 = 25.9 Mrev', '6305: L10 = (25500/5000)^3 = 132.7 Mrev', 'The 63 series (medium) has 5.1\u00D7 more life', 'Trade-off: 6305 has larger OD and width'], answer: 132.7, unit: 'Mrev' }
    },
    {
      id: 'suffix-codes', name: 'Suffix Codes', symbol: '2RS, ZZ, C3',
      formula: 'Seal / Shield / Clearance', unit: '\u2014',
      cat: 'nomenclature',
      desc: 'Suffix codes after the basic designation indicate bearing variants: 2RS or 2RSR = contact seals on both sides (grease-filled for life, dust/moisture protection). ZZ or 2Z = metal shields on both sides (less friction than seals, some protection). C3 = greater than normal internal clearance (needed for thermal expansion in high-temperature applications). C2 = less than normal clearance. NR = snap ring groove on outer ring. These suffixes are critical for proper bearing specification.',
      diagram: 'suffixDiagram',
      example: { problem: 'What does the designation 6205-2RS C3 mean?', steps: ['6 = Deep groove ball bearing', '2 = Light series', '05 = Bore code (25 mm)', '2RS = Contact seals on both sides', 'C3 = Greater than normal clearance'], answer: 25, unit: 'mm bore, sealed, C3 clearance' }
    },

    /* ── Life Calculation ─────────────────────────────────────── */
    {
      id: 'l10-formula', name: 'L10 Life Formula', symbol: 'L10 = (C/P)^p',
      formula: 'L10 = (C/P)^p \u00D7 10\u2076 rev', unit: 'million rev',
      cat: 'life',
      desc: 'The basic rating life L10 represents the number of revolutions at which 10% of a population of identical bearings will have failed by fatigue. It is calculated as L10 = (C/P)^p where C is the basic dynamic load rating (from catalog), P is the equivalent dynamic bearing load, and p is the life exponent: p = 3 for ball bearings, p = 10/3 for roller bearings. The result is in millions of revolutions. This formula is defined in ISO 281.',
      diagram: 'l10Diagram',
      example: { problem: 'A ball bearing has C = 19.5 kN and equivalent load P = 4 kN. Calculate L10 in million revolutions.', steps: ['L10 = (C/P)^p', 'L10 = (19500/4000)^3', 'L10 = (4.875)^3', 'L10 = 115.9 million revolutions'], answer: 115.9, unit: 'Mrev' }
    },
    {
      id: 'equivalent-load', name: 'Equivalent Dynamic Load', symbol: 'P = XFr + YFa',
      formula: 'P = X\u00B7Fr + Y\u00B7Fa', unit: 'N',
      cat: 'life',
      desc: 'When a bearing is subjected to both radial (Fr) and axial (Fa) loads simultaneously, these must be combined into a single equivalent dynamic bearing load P that would give the same life as the actual combined loading. The general formula is P = X\u00B7Fr + Y\u00B7Fa, where X is the radial load factor and Y is the axial load factor. These factors depend on bearing type and the ratio Fa/Fr relative to the calculation factor e. For deep groove ball bearings: if Fa/Fr \u2264 e, X=1, Y=0; if Fa/Fr > e, X=0.56, Y=1.63.',
      diagram: 'eqLoadDiagram',
      example: { problem: 'A deep groove ball bearing carries Fr = 4000 N and Fa = 2000 N. Calculate P. (e = 0.22)', steps: ['Fa/Fr = 2000/4000 = 0.50', 'Since 0.50 > e = 0.22: X = 0.56, Y = 1.63', 'P = 0.56 \u00D7 4000 + 1.63 \u00D7 2000', 'P = 2240 + 3260 = 5500 N'], answer: 5500, unit: 'N' }
    },
    {
      id: 'life-hours', name: 'Life in Hours', symbol: 'Lh = L10\u00B710\u2076/(60n)',
      formula: 'Lh = (L10 \u00D7 10\u2076) / (60 \u00D7 n)', unit: 'hours',
      cat: 'life',
      desc: 'For practical engineering, bearing life is typically expressed in operating hours rather than revolutions. The conversion formula is Lh = (L10 \u00D7 10\u2076) / (60 \u00D7 n), where L10 is the basic rating life in millions of revolutions and n is the rotational speed in RPM. Recommended minimum life varies by application: household appliances 1000\u20133000 hours, electric motors 10000\u201320000 hours, industrial gearboxes 20000\u201350000 hours, and 24/7 continuous operation 50000\u2013100000 hours.',
      diagram: 'lifeHoursDiagram',
      example: { problem: 'A bearing has L10 = 80 million revolutions at 1000 rpm. Convert to hours.', steps: ['Lh = (L10 \u00D7 10\u2076) / (60 \u00D7 n)', 'Lh = (80 \u00D7 10\u2076) / (60 \u00D7 1000)', 'Lh = 80000000 / 60000', 'Lh = 1333 hours'], answer: 1333, unit: 'hours' }
    },
    {
      id: 'required-c', name: 'Required Load Rating C', symbol: 'C = P\u00B7(Lh\u00B760n/10\u2076)^(1/p)',
      formula: 'C = P \u00D7 (Lh\u00B760\u00B7n / 10\u2076)^(1/p)', unit: 'kN',
      cat: 'life',
      desc: 'When the desired bearing life and operating conditions are known, the required minimum dynamic load rating C can be calculated. This value is then used to select a suitable bearing from the catalog whose basic dynamic load rating meets or exceeds the calculated requirement. The formula is C = P \u00D7 (Lh \u00D7 60 \u00D7 n / 10\u2076)^(1/p), where Lh is desired life in hours, n is speed in RPM, and p is 3 for ball or 10/3 for roller bearings.',
      diagram: 'requiredCDiagram',
      example: { problem: 'Select a ball bearing for P = 3000 N, n = 1500 rpm, desired life = 20000 hours.', steps: ['C = P \u00D7 (Lh\u00B760\u00B7n / 10\u2076)^(1/3)', 'C = 3000 \u00D7 (20000\u00D760\u00D71500 / 10\u2076)^(1/3)', 'C = 3000 \u00D7 (1800)^(1/3)', 'C = 3000 \u00D7 12.16 = 36500 N = 36.5 kN', 'Select 6210 (C = 35.1 kN) or next larger size'], answer: 36.5, unit: 'kN' }
    }
  ];

  /* ================================================================
     PROBLEM GENERATORS (12)
     ================================================================ */
  function generateProblems() {
    return [
      // 1 - Calculate L10 life in Mrev for ball bearing
      (function () {
        var C = randInt(10, 40);
        var P = randInt(2, Math.max(3, C - 2));
        var ratio = C / P;
        var L10 = roundN(Math.pow(ratio, 3), 1);
        return {
          prompt: 'A ball bearing has a dynamic load rating C = ' + C + ' kN and equivalent load P = ' + P + ' kN. Calculate the L10 life in million revolutions (p = 3).',
          answer: L10,
          unit: 'Mrev',
          tolerance: 0.15,
          solution: [
            'L10 = (C/P)^p',
            'L10 = (' + C + '/' + P + ')^3',
            'L10 = ' + roundN(ratio, 3) + '^3',
            'L10 = <strong>' + L10 + ' million revolutions</strong>'
          ]
        };
      })(),
      // 2 - Calculate L10 life in hours
      (function () {
        var C = randInt(15, 45);
        var P = randInt(3, Math.max(4, C - 5));
        var n = randInt(5, 30) * 100;
        var L10mrev = Math.pow(C / P, 3);
        var Lh = roundN((L10mrev * 1e6) / (60 * n), 0);
        return {
          prompt: 'A ball bearing has C = ' + C + ' kN, P = ' + P + ' kN, and runs at ' + n + ' rpm. Calculate the L10 life in hours.',
          answer: Lh,
          unit: 'hours',
          tolerance: 0.05,
          solution: [
            'L10 = (C/P)^3 = (' + C + '/' + P + ')^3 = ' + roundN(L10mrev, 2) + ' Mrev',
            'Lh = (L10 \u00D7 10\u2076) / (60 \u00D7 n)',
            'Lh = (' + roundN(L10mrev, 2) + ' \u00D7 10\u2076) / (60 \u00D7 ' + n + ')',
            'Lh = <strong>' + Lh + ' hours</strong>'
          ]
        };
      })(),
      // 3 - Calculate equivalent load P for DGB
      (function () {
        var Fr = randInt(20, 80) * 100;
        var Fa = randInt(5, 40) * 100;
        var ratio = Fa / Fr;
        var X, Y, P;
        if (ratio <= 0.22) {
          X = 1; Y = 0;
          P = Fr;
        } else {
          X = 0.56; Y = 1.63;
          P = roundN(X * Fr + Y * Fa, 0);
        }
        return {
          prompt: 'A deep groove ball bearing carries Fr = ' + Fr + ' N and Fa = ' + Fa + ' N. Calculate the equivalent dynamic load P. (Use e = 0.22, X = 0.56, Y = 1.63 when Fa/Fr > e)',
          answer: P,
          unit: 'N',
          tolerance: 0.03,
          solution: [
            'Fa/Fr = ' + Fa + '/' + Fr + ' = ' + roundN(ratio, 3),
            ratio <= 0.22 ? 'Since ' + roundN(ratio, 3) + ' \u2264 0.22: X = 1, Y = 0' : 'Since ' + roundN(ratio, 3) + ' > 0.22: X = 0.56, Y = 1.63',
            'P = X\u00B7Fr + Y\u00B7Fa = ' + X + '\u00D7' + Fr + ' + ' + Y + '\u00D7' + Fa,
            'P = <strong>' + P + ' N</strong>'
          ]
        };
      })(),
      // 4 - Required C for ball bearing
      (function () {
        var P = randInt(20, 80) * 100;
        var n = randInt(5, 30) * 100;
        var Lh = randInt(5, 40) * 1000;
        var reqC = P * Math.pow((Lh * 60 * n / 1e6), 1 / 3);
        var reqCkN = roundN(reqC / 1000, 1);
        return {
          prompt: 'A ball bearing application has P = ' + P + ' N, speed = ' + n + ' rpm, and desired life = ' + Lh + ' hours. Calculate the required dynamic load rating C in kN.',
          answer: reqCkN,
          unit: 'kN',
          tolerance: 0.08,
          solution: [
            'C = P \u00D7 (Lh \u00D7 60 \u00D7 n / 10\u2076)^(1/3)',
            'C = ' + P + ' \u00D7 (' + Lh + ' \u00D7 60 \u00D7 ' + n + ' / 10\u2076)^(1/3)',
            'C = ' + P + ' \u00D7 (' + roundN(Lh * 60 * n / 1e6, 2) + ')^(1/3)',
            'C = ' + P + ' \u00D7 ' + roundN(Math.pow(Lh * 60 * n / 1e6, 1 / 3), 3),
            'C = <strong>' + reqCkN + ' kN</strong>'
          ]
        };
      })(),
      // 5 - L10 life for roller bearing
      (function () {
        var C = randInt(15, 55);
        var P = randInt(5, Math.max(6, C - 5));
        var pExp = 10 / 3;
        var L10 = roundN(Math.pow(C / P, pExp), 1);
        return {
          prompt: 'A cylindrical roller bearing has C = ' + C + ' kN and equivalent load P = ' + P + ' kN. Calculate L10 life in million revolutions (p = 10/3).',
          answer: L10,
          unit: 'Mrev',
          tolerance: 0.12,
          solution: [
            'L10 = (C/P)^(10/3)',
            'L10 = (' + C + '/' + P + ')^3.333',
            'L10 = ' + roundN(C / P, 3) + '^3.333',
            'L10 = <strong>' + L10 + ' million revolutions</strong>'
          ]
        };
      })(),
      // 6 - Bore diameter from designation
      (function () {
        var codes = [
          { code: '00', bore: 10 }, { code: '01', bore: 12 },
          { code: '02', bore: 15 }, { code: '03', bore: 17 },
          { code: '04', bore: 20 }, { code: '05', bore: 25 },
          { code: '06', bore: 30 }, { code: '07', bore: 35 },
          { code: '08', bore: 40 }, { code: '09', bore: 45 },
          { code: '10', bore: 50 }, { code: '12', bore: 60 }
        ];
        var pick = codes[randInt(0, codes.length - 1)];
        var series = ['62', '63'][randInt(0, 1)];
        var desig = series + pick.code;
        return {
          prompt: 'What is the bore diameter (in mm) of a bearing with designation ' + desig + '?',
          answer: pick.bore,
          unit: 'mm',
          tolerance: 0,
          solution: [
            'Designation: ' + desig,
            '"' + series[0] + '" = Deep groove ball bearing',
            '"' + series[1] + '" = ' + (series[1] === '2' ? 'Light' : 'Medium') + ' series',
            'Bore code: ' + pick.code,
            parseInt(pick.code) >= 4 ? 'Since code \u2265 04: bore = ' + pick.code + ' \u00D7 5 = <strong>' + pick.bore + ' mm</strong>' : 'Special code: ' + pick.code + ' = <strong>' + pick.bore + ' mm</strong>'
          ]
        };
      })(),
      // 7 - Compare life of two bearings
      (function () {
        var idx1 = randInt(3, 7);
        var idx2 = idx1 + randInt(1, 3);
        if (idx2 >= 11) idx2 = 10;
        var b1 = BEARING_DB[idx1];
        var b2 = BEARING_DB[idx2];
        var P = randInt(20, 50) * 100;
        var L1 = roundN(Math.pow(b1.C * 1000 / P, 3), 1);
        var L2 = roundN(Math.pow(b2.C * 1000 / P, 3), 1);
        var ratio = roundN(L2 / L1, 1);
        return {
          prompt: 'Under P = ' + P + ' N, bearing ' + b1.series + ' (C = ' + b1.C + ' kN) has L10 = ' + L1 + ' Mrev. Bearing ' + b2.series + ' (C = ' + b2.C + ' kN) has L10 = ? Mrev. Find L10 for ' + b2.series + '.',
          answer: L2,
          unit: 'Mrev',
          tolerance: 0.12,
          solution: [
            'L10 = (C/P)^3 for ball bearings',
            'For ' + b2.series + ': L10 = (' + b2.C + ' \u00D7 1000 / ' + P + ')^3',
            'L10 = ' + roundN(b2.C * 1000 / P, 3) + '^3',
            'L10 = <strong>' + L2 + ' Mrev</strong>',
            '(' + b2.series + ' offers ' + ratio + '\u00D7 the life of ' + b1.series + ')'
          ]
        };
      })(),
      // 8 - Required C for roller bearing
      (function () {
        var P = randInt(50, 150) * 100;
        var n = randInt(3, 15) * 100;
        var Lh = randInt(5, 25) * 1000;
        var pExp = 10 / 3;
        var reqC = P * Math.pow(Lh * 60 * n / 1e6, 1 / pExp);
        var reqCkN = roundN(reqC / 1000, 1);
        return {
          prompt: 'A roller bearing application has P = ' + P + ' N, speed = ' + n + ' rpm, desired life = ' + Lh + ' hours. Calculate required C in kN (p = 10/3).',
          answer: reqCkN,
          unit: 'kN',
          tolerance: 0.1,
          solution: [
            'C = P \u00D7 (Lh \u00D7 60 \u00D7 n / 10\u2076)^(1/p)',
            'C = ' + P + ' \u00D7 (' + Lh + ' \u00D7 60 \u00D7 ' + n + ' / 10\u2076)^(3/10)',
            'C = ' + P + ' \u00D7 (' + roundN(Lh * 60 * n / 1e6, 2) + ')^0.3',
            'C = ' + P + ' \u00D7 ' + roundN(Math.pow(Lh * 60 * n / 1e6, 1 / pExp), 3),
            'C = <strong>' + reqCkN + ' kN</strong>'
          ]
        };
      })(),
      // 9 - Angular contact equivalent load
      (function () {
        var Fr = randInt(30, 100) * 100;
        var Fa = randInt(10, 60) * 100;
        var P = roundN(0.57 * Fr + 0.93 * Fa, 0);
        return {
          prompt: 'An angular contact bearing carries Fr = ' + Fr + ' N and Fa = ' + Fa + ' N. Calculate P using X = 0.57 and Y = 0.93.',
          answer: P,
          unit: 'N',
          tolerance: 0.02,
          solution: [
            'P = X\u00B7Fr + Y\u00B7Fa',
            'P = 0.57 \u00D7 ' + Fr + ' + 0.93 \u00D7 ' + Fa,
            'P = ' + roundN(0.57 * Fr, 0) + ' + ' + roundN(0.93 * Fa, 0),
            'P = <strong>' + P + ' N</strong>'
          ]
        };
      })(),
      // 10 - Select bearing from catalog
      (function () {
        var P = randInt(20, 60) * 100;
        var n = randInt(5, 25) * 100;
        var Lh = randInt(5, 30) * 1000;
        var reqC = P * Math.pow(Lh * 60 * n / 1e6, 1 / 3) / 1000;
        var selected = null;
        for (var i = 0; i < BEARING_DB.length; i++) {
          if (BEARING_DB[i].type === 'ball' && BEARING_DB[i].C >= reqC) {
            selected = BEARING_DB[i];
            break;
          }
        }
        if (!selected) selected = BEARING_DB[10]; // fallback to 6210
        return {
          prompt: 'For a ball bearing application: P = ' + P + ' N, n = ' + n + ' rpm, desired life = ' + Lh + ' hrs. Calculate required C (kN) and identify the smallest suitable 62xx bearing.',
          answer: selected.bore,
          unit: 'mm (bore of selected bearing)',
          tolerance: 0,
          solution: [
            'C_req = P \u00D7 (Lh\u00B760\u00B7n / 10\u2076)^(1/3)',
            'C_req = ' + P + ' \u00D7 (' + roundN(Lh * 60 * n / 1e6, 2) + ')^(1/3)',
            'C_req = ' + roundN(reqC, 2) + ' kN',
            'From catalog: select ' + selected.series + ' (C = ' + selected.C + ' kN \u2265 ' + roundN(reqC, 2) + ' kN)',
            'Bore = <strong>' + selected.bore + ' mm</strong>'
          ]
        };
      })(),
      // 11 - Convert Mrev to hours
      (function () {
        var L10 = randInt(10, 200);
        var n = randInt(5, 30) * 100;
        var Lh = roundN((L10 * 1e6) / (60 * n), 0);
        return {
          prompt: 'A bearing has L10 = ' + L10 + ' million revolutions and runs at ' + n + ' rpm. Convert to operating hours.',
          answer: Lh,
          unit: 'hours',
          tolerance: 0.03,
          solution: [
            'Lh = (L10 \u00D7 10\u2076) / (60 \u00D7 n)',
            'Lh = (' + L10 + ' \u00D7 1000000) / (60 \u00D7 ' + n + ')',
            'Lh = ' + (L10 * 1e6) + ' / ' + (60 * n),
            'Lh = <strong>' + Lh + ' hours</strong>'
          ]
        };
      })(),
      // 12 - Life exponent effect
      (function () {
        var C = randInt(20, 40);
        var P = randInt(5, Math.max(6, C - 5));
        var L10ball = roundN(Math.pow(C / P, 3), 1);
        var L10roller = roundN(Math.pow(C / P, 10 / 3), 1);
        return {
          prompt: 'For C = ' + C + ' kN and P = ' + P + ' kN, calculate L10 using p = 3 (ball) and p = 10/3 (roller). What is L10 for the roller bearing in Mrev?',
          answer: L10roller,
          unit: 'Mrev',
          tolerance: 0.12,
          solution: [
            'Ball (p=3): L10 = (' + C + '/' + P + ')^3 = ' + L10ball + ' Mrev',
            'Roller (p=10/3): L10 = (' + C + '/' + P + ')^3.333',
            'L10 = ' + roundN(C / P, 3) + '^3.333',
            'L10 = <strong>' + L10roller + ' Mrev</strong>',
            'Roller bearing has ' + (L10roller > L10ball ? 'longer' : 'shorter') + ' life due to higher exponent'
          ]
        };
      })()
    ];
  }

  /* ================================================================
     QUIZ POOL (15 questions)
     ================================================================ */
  function generateQuizPool() {
    return [
      // 1 - MCQ: bearing type for pure radial heavy load
      {
        type: 'mcq',
        prompt: 'Which bearing type is best suited for heavy radial loads with no axial load?',
        choices: ['Deep Groove Ball', 'Cylindrical Roller', 'Angular Contact', 'Thrust Ball'],
        correct: 1,
        explanation: 'Cylindrical roller bearings have the highest radial load capacity due to line contact between rollers and raceways.'
      },
      // 2 - MCQ: bearing for pure axial load
      {
        type: 'mcq',
        prompt: 'Which bearing type can ONLY accommodate axial loads?',
        choices: ['Deep Groove Ball', 'Cylindrical Roller', 'Angular Contact', 'Thrust Ball'],
        correct: 3,
        explanation: 'Thrust ball bearings are designed exclusively for axial loads and must not be subjected to radial loads.'
      },
      // 3 - MCQ: life exponent for ball bearings
      {
        type: 'mcq',
        prompt: 'What is the life exponent p for ball bearings in the L10 formula?',
        choices: ['2', '3', '10/3', '4'],
        correct: 1,
        explanation: 'The life exponent p = 3 for ball bearings and p = 10/3 for roller bearings (ISO 281).'
      },
      // 4 - MCQ: bore code 03
      {
        type: 'mcq',
        prompt: 'What bore diameter does bore code 03 represent?',
        choices: ['13 mm', '15 mm', '17 mm', '20 mm'],
        correct: 2,
        explanation: 'Special bore codes: 00=10mm, 01=12mm, 02=15mm, 03=17mm. From 04 onwards, bore = code \u00D7 5.'
      },
      // 5 - MCQ: nomenclature type digit
      {
        type: 'mcq',
        prompt: 'In the bearing designation 6208, what does the first digit "6" indicate?',
        choices: ['Bore diameter', 'Width series', 'Deep groove ball bearing type', 'Number of rolling elements'],
        correct: 2,
        explanation: 'The first digit "6" is the type code for deep groove ball bearings. "7" = angular contact, "N" = cylindrical roller.'
      },
      // 6 - Numeric: calculate P
      (function () {
        var Fr = randInt(30, 80) * 100;
        var Fa = randInt(15, 40) * 100;
        var P = roundN(0.56 * Fr + 1.63 * Fa, 0);
        return {
          type: 'numeric',
          prompt: 'Deep groove ball bearing: Fr = ' + Fr + ' N, Fa = ' + Fa + ' N, Fa/Fr > e. Calculate P (N). Use X=0.56, Y=1.63.',
          answer: P,
          unit: 'N',
          tolerance: 0.03,
          explanation: 'P = 0.56\u00D7' + Fr + ' + 1.63\u00D7' + Fa + ' = ' + P + ' N'
        };
      })(),
      // 7 - Numeric: L10 in Mrev
      (function () {
        var C = randInt(12, 35);
        var P = randInt(3, Math.max(4, C - 5));
        var L10 = roundN(Math.pow(C / P, 3), 1);
        return {
          type: 'numeric',
          prompt: 'Ball bearing: C = ' + C + ' kN, P = ' + P + ' kN. Calculate L10 in million revolutions.',
          answer: L10,
          unit: 'Mrev',
          tolerance: 0.12,
          explanation: 'L10 = (' + C + '/' + P + ')^3 = ' + L10 + ' Mrev'
        };
      })(),
      // 8 - MCQ: what does 2RS mean?
      {
        type: 'mcq',
        prompt: 'What does the suffix "2RS" indicate in a bearing designation?',
        choices: ['Double row bearing', 'Contact seals on both sides', 'Reinforced cage', 'Extra clearance'],
        correct: 1,
        explanation: '2RS means contact rubber seals on both sides, making the bearing sealed and pre-greased for life.'
      },
      // 9 - MCQ: combined load bearing
      {
        type: 'mcq',
        prompt: 'Which bearing type is commonly used in machine tool spindles for combined radial and axial loads?',
        choices: ['Thrust Ball', 'Cylindrical Roller', 'Angular Contact', 'Deep Groove Ball'],
        correct: 2,
        explanation: 'Angular contact ball bearings are ideal for combined loads and are the standard choice for machine tool spindles.'
      },
      // 10 - Numeric: bore from designation
      (function () {
        var code = randInt(4, 12);
        var bore = code * 5;
        return {
          type: 'numeric',
          prompt: 'What is the bore diameter (mm) of bearing 62' + (code < 10 ? '0' + code : code) + '?',
          answer: bore,
          unit: 'mm',
          tolerance: 0,
          explanation: 'Bore code ' + (code < 10 ? '0' + code : code) + ': since code \u2265 04, bore = ' + code + ' \u00D7 5 = ' + bore + ' mm'
        };
      })(),
      // 11 - MCQ: C3 clearance
      {
        type: 'mcq',
        prompt: 'What does the suffix "C3" mean in bearing designation 6205-2RS C3?',
        choices: ['Grade 3 precision', 'Greater than normal internal clearance', '3 mm contact angle', 'Carbon steel cage'],
        correct: 1,
        explanation: 'C3 indicates greater than normal radial internal clearance, often needed for applications with thermal expansion.'
      },
      // 12 - Numeric: life in hours
      (function () {
        var L10 = randInt(20, 150);
        var n = randInt(5, 25) * 100;
        var Lh = roundN((L10 * 1e6) / (60 * n), 0);
        return {
          type: 'numeric',
          prompt: 'Convert L10 = ' + L10 + ' Mrev to hours at n = ' + n + ' rpm.',
          answer: Lh,
          unit: 'hours',
          tolerance: 0.03,
          explanation: 'Lh = (' + L10 + ' \u00D7 10\u2076) / (60 \u00D7 ' + n + ') = ' + Lh + ' hours'
        };
      })(),
      // 13 - MCQ: roller life exponent
      {
        type: 'mcq',
        prompt: 'What is the life exponent p for roller bearings?',
        choices: ['3', '10/3', '2.5', '4'],
        correct: 1,
        explanation: 'For roller bearings p = 10/3 (approximately 3.333), compared to p = 3 for ball bearings.'
      },
      // 14 - MCQ: self-locking capability
      {
        type: 'mcq',
        prompt: 'For a cylindrical roller bearing (NU type), what is the equivalent load P when both radial and axial loads are present?',
        choices: ['P = Fr + Fa', 'P = Fr (NU type cannot carry axial loads)', 'P = 0.57Fr + 0.93Fa', 'P = Fa'],
        correct: 1,
        explanation: 'Standard NU-type cylindrical roller bearings can only carry radial loads, so P = Fr. Axial load must be carried by a separate bearing.'
      },
      // 15 - Numeric: required C
      (function () {
        var P = randInt(20, 60) * 100;
        var n = randInt(5, 20) * 100;
        var Lh = randInt(5, 25) * 1000;
        var reqC = roundN(P * Math.pow(Lh * 60 * n / 1e6, 1 / 3) / 1000, 1);
        return {
          type: 'numeric',
          prompt: 'Ball bearing: P = ' + P + ' N, n = ' + n + ' rpm, Lh = ' + Lh + ' hrs. Calculate required C (kN).',
          answer: reqC,
          unit: 'kN',
          tolerance: 0.1,
          explanation: 'C = ' + P + ' \u00D7 (' + Lh + '\u00D760\u00D7' + n + '/10\u2076)^(1/3) = ' + reqC + ' kN'
        };
      })()
    ];
  }

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'find';                // find | explore | practice | quiz

  // Find-Bearing state
  var findReq = { bore: 0, Fr: 5000, Fa: 1000, speed: 1500, life: 20000, misalign: 0, reliability: 90, contam: 'normal', kappa: 2 };
  var findResult = null;
  var selectedFindKey = null;       // bearing type key the user clicked to inspect; null = best match

  function getFindTop() {
    if (!findResult) return null;
    if (selectedFindKey) {
      for (var i = 0; i < findResult.suitable.length; i++) {
        if (findResult.suitable[i].key === selectedFindKey) return findResult.suitable[i];
      }
    }
    return findResult.suitable[0] || null;
  }

  // Animation state
  var animAngle = 0;
  var animRunning = true;
  var lastTime = 0;

  // Explore state
  var exploreCat = 'types';
  var selectedConcept = null;

  // Practice state
  var practiceProblems = [];
  var practiceIdx = 0;
  var practiceScore = 0;
  var practiceTotal = 0;
  var practiceAnswered = false;

  // Quiz state
  var quizPool = [];
  var quizQuestions = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswers = [];
  var quizLocked = false;

  /* ================================================================
     DOM REFS
     ================================================================ */
  var canvas = $('#sim-canvas');
  var ctx = canvas.getContext('2d');

  var modeTabs = $$('#mode-tabs .pill');

  // Readout badges (drive from the top Find-Bearing match)
  var rbLife = $('#rb-life');
  var rbEqLoad = $('#rb-eqload');
  var rbReqC = $('#rb-reqc');
  var rbBearing = $('#rb-bearing');

  // Find-Bearing DOM refs
  var findPanel = $('#find-panel');
  var fBore = $('#f-bore'), fBoreVal = $('#f-bore-val');
  var fBoreAny = $('#f-bore-any');
  var fFr = $('#f-fr'), fFrVal = $('#f-fr-val');
  var fFa = $('#f-fa'), fFaVal = $('#f-fa-val');
  var fSpeed = $('#f-speed'), fSpeedVal = $('#f-speed-val');
  var fLife = $('#f-life'), fLifeVal = $('#f-life-val');
  var fMis = $('#f-mis'), fMisVal = $('#f-mis-val');
  var fReliability = $('#f-reliability');
  var fContam = $('#f-contam');
  var fKappa = $('#f-kappa'), fKappaVal = $('#f-kappa-val');
  var fMachine = $('#f-machine');
  var fFindBtn = $('#f-find-btn');
  var findModalBackdrop = $('#find-modal-backdrop');
  var findModalBody = $('#find-modal-body');
  var findModalClose = $('#find-modal-close');

  // Panels
  var calcPanel = $('#calc-panel');
  var canvasCard = document.querySelector('.canvas-card');
  var catRow = $('#cat-row');
  var itemSelector = $('#item-selector');
  var conceptGrid = $('#concept-grid');
  var itemInfo = $('#item-info');
  var practicePanel = $('#practice-panel');
  var practiceBar = $('#practice-bar');
  var quizPanel = $('#quiz-panel');
  var quizBar = $('#quiz-bar');
  var quizResult = $('#quiz-result');

  // Practice elements
  var ppPrompt = $('#pp-prompt');
  var ppInput = $('#pp-input');
  var ppUnit = $('#pp-unit');
  var ppCheck = $('#pp-check');
  var ppNext = $('#pp-next');
  var ppFeedback = $('#pp-feedback');
  var ppSolution = $('#pp-solution');
  var pbarScoreVal = $('#pbar-score-val');

  /* ================================================================
     CANVAS DRAWING
     ================================================================ */
  var W, H;
  var dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height || W * 480 / 900;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── Draw helper primitives ─────────────────────────────────── */
  function drawCircle(cx, cy, r, stroke, lw, fill) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  function drawArc(cx, cy, r, start, end, stroke, lw) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw || 1;
    ctx.stroke();
  }

  function drawLine(x1, y1, x2, y2, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw || 1;
    ctx.stroke();
  }

  function drawArrow(x1, y1, x2, y2, color, lw, headSize) {
    headSize = headSize || 10;
    var angle = Math.atan2(y2 - y1, x2 - x1);
    // shaft
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 2;
    ctx.stroke();
    // head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headSize * Math.cos(angle - 0.4), y2 - headSize * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - headSize * Math.cos(angle + 0.4), y2 - headSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawText(text, x, y, color, size, align, font) {
    ctx.fillStyle = color;
    ctx.font = (font || 'bold') + ' ' + size + 'px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function drawRoundedRect(x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  /* ── Bearing cross-section drawing ─────────────────────────── */
  function drawBearingCrossSection(cx, cy, cfg, angle, exactType) {
    if (exactType === undefined) exactType = true;
    var scale = Math.min(W / 900, H / 480);
    var outerR = 140 * scale;
    var innerR = 56 * scale;
    var pitchR = (outerR + innerR) / 2;
    var raceWidth = 16 * scale;
    var elementR = (outerR - innerR) / 2 * 0.58;
    var nElements = cfg.nElements;

    // --- Angular contact: tilt everything ---
    var contactAngle = 0;
    if (cfg.key === 'ang') contactAngle = 25 * Math.PI / 180;

    // --- Thrust: horizontal arrangement ---
    if (cfg.key === 'thr') {
      drawThrustBearing(cx, cy, scale, cfg, angle);
      return;
    }

    // Outer race (thick ring)
    ctx.save();
    ctx.shadowColor = 'rgba(123,31,162,0.25)';
    ctx.shadowBlur = 20 * scale;
    drawCircle(cx, cy, outerR, '#6d6d6d', 3 * scale, null);
    drawCircle(cx, cy, outerR - raceWidth, '#6d6d6d', 2 * scale, null);
    // Fill outer race region
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, outerR - raceWidth, 0, Math.PI * 2, true);
    ctx.fillStyle = '#4a4a4a';
    ctx.fill();
    ctx.restore();

    // Outer race highlight
    drawArc(cx, cy, outerR - 1 * scale, -0.3, 0.8, 'rgba(180,180,180,0.25)', 2 * scale);

    // Inner race
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR + raceWidth, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = '#4a4a4a';
    ctx.fill();
    ctx.restore();
    drawCircle(cx, cy, innerR + raceWidth, '#6d6d6d', 2 * scale, null);
    drawCircle(cx, cy, innerR, '#6d6d6d', 2 * scale, null);

    // Inner race highlight
    drawArc(cx, cy, innerR + raceWidth - 1 * scale, -0.5, 0.5, 'rgba(180,180,180,0.2)', 1.5 * scale);

    // Bore hole
    drawCircle(cx, cy, innerR - 2 * scale, '#2a3050', 1.5 * scale, '#0d1117');

    // Cross-hatch pattern in bore for shaft indication
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 3 * scale, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(42,48,80,0.4)';
    ctx.lineWidth = 0.5 * scale;
    for (var h = -innerR; h < innerR; h += 6 * scale) {
      drawLine(cx + h, cy - innerR, cx + h + innerR * 0.3, cy + innerR, 'rgba(42,48,80,0.3)', 0.5 * scale);
    }
    ctx.restore();

    // Cage (dashed circle)
    ctx.beginPath();
    ctx.arc(cx, cy, pitchR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(123,31,162,0.3)';
    ctx.lineWidth = 1 * scale;
    ctx.setLineDash([4 * scale, 5 * scale]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rolling elements
    for (var i = 0; i < nElements; i++) {
      var baseAngle = angle + (i * 2 * Math.PI / nElements);
      var ex = cx + pitchR * Math.cos(baseAngle);
      var ey = cy + pitchR * Math.sin(baseAngle);

      if (cfg.elementShape === 'ball') {
        // Ball with gradient
        var grad = ctx.createRadialGradient(
          ex - elementR * 0.3, ey - elementR * 0.3, elementR * 0.1,
          ex, ey, elementR
        );
        grad.addColorStop(0, '#ce93d8');
        grad.addColorStop(0.5, '#7b1fa2');
        grad.addColorStop(1, '#4a148c');
        drawCircle(ex, ey, elementR, null, 0, grad);
        // Highlight
        drawCircle(ex - elementR * 0.25, ey - elementR * 0.25, elementR * 0.25, null, 0, 'rgba(255,255,255,0.25)');
      } else if (cfg.elementShape === 'roller') {
        // Roller (rectangle oriented radially)
        var rollerLen = elementR * 2.2;
        var rollerW = elementR * 1.2;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(baseAngle);
        var rGrad = ctx.createLinearGradient(-rollerW / 2, 0, rollerW / 2, 0);
        rGrad.addColorStop(0, '#4a148c');
        rGrad.addColorStop(0.3, '#7b1fa2');
        rGrad.addColorStop(0.5, '#ce93d8');
        rGrad.addColorStop(0.7, '#7b1fa2');
        rGrad.addColorStop(1, '#4a148c');
        drawRoundedRect(-rollerW / 2, -rollerLen / 2, rollerW, rollerLen, 2 * scale, rGrad, '#9c27b0', 1 * scale);
        ctx.restore();
      }
    }

    // Cage lines connecting elements
    ctx.strokeStyle = 'rgba(123,31,162,0.25)';
    ctx.lineWidth = 1 * scale;
    for (var j = 0; j < nElements; j++) {
      var a1 = angle + (j * 2 * Math.PI / nElements);
      var a2 = angle + (((j + 1) % nElements) * 2 * Math.PI / nElements);
      var x1 = cx + pitchR * Math.cos(a1);
      var y1 = cy + pitchR * Math.sin(a1);
      var x2 = cx + pitchR * Math.cos(a2);
      var y2 = cy + pitchR * Math.sin(a2);
      drawLine(x1, y1, x2, y2, 'rgba(123,31,162,0.2)', 1 * scale);
    }

    // Angular contact indicator line
    if (cfg.key === 'ang') {
      ctx.save();
      ctx.setLineDash([3 * scale, 3 * scale]);
      var cAng = 25 * Math.PI / 180;
      var len = outerR * 1.15;
      drawLine(cx - len * Math.cos(cAng), cy + len * Math.sin(cAng),
        cx + len * Math.cos(cAng), cy - len * Math.sin(cAng),
        'rgba(245,200,66,0.5)', 1 * scale);
      ctx.setLineDash([]);
      if (exactType) drawText('25\u00B0', cx + outerR * 0.4, cy - outerR * 0.3, '#f5c842', 11 * scale, 'left', 'normal');
      ctx.restore();
    }
  }

  /* ── Thrust bearing special layout ─────────────────────────── */
  function drawThrustBearing(cx, cy, scale, cfg, angle) {
    var plateW = 240 * scale;
    var plateH = 16 * scale;
    var gap = 36 * scale;
    var elementR = 10 * scale;
    var nElements = cfg.nElements;

    // Upper washer (shaft washer)
    drawRoundedRect(cx - plateW / 2, cy - gap / 2 - plateH, plateW, plateH, 3 * scale, '#4a4a4a', '#6d6d6d', 2 * scale);
    drawText('Shaft Washer', cx, cy - gap / 2 - plateH - 10 * scale, '#6b7a99', 10 * scale, 'center', 'normal');

    // Lower washer (housing washer)
    drawRoundedRect(cx - plateW / 2, cy + gap / 2, plateW, plateH, 3 * scale, '#4a4a4a', '#6d6d6d', 2 * scale);
    drawText('Housing Washer', cx, cy + gap / 2 + plateH + 12 * scale, '#6b7a99', 10 * scale, 'center', 'normal');

    // Rolling elements between washers
    var startX = cx - plateW / 2 + 20 * scale;
    var endX = cx + plateW / 2 - 20 * scale;
    var spacing = (endX - startX) / (nElements - 1);

    for (var i = 0; i < nElements; i++) {
      var bx = startX + i * spacing + Math.sin(angle * 2 + i) * 3 * scale;
      bx = clamp(bx, startX, endX);
      var by = cy;

      var grad = ctx.createRadialGradient(
        bx - elementR * 0.3, by - elementR * 0.3, elementR * 0.1,
        bx, by, elementR
      );
      grad.addColorStop(0, '#ce93d8');
      grad.addColorStop(0.5, '#7b1fa2');
      grad.addColorStop(1, '#4a148c');
      drawCircle(bx, by, elementR, null, 0, grad);
      drawCircle(bx - elementR * 0.2, by - elementR * 0.2, elementR * 0.2, null, 0, 'rgba(255,255,255,0.25)');
    }

    // Cage lines
    ctx.strokeStyle = 'rgba(123,31,162,0.2)';
    ctx.lineWidth = 1 * scale;
    drawLine(startX, cy, endX, cy, 'rgba(123,31,162,0.15)', 1 * scale);
  }

  /* ── Find Bearing canvas summary ───────────────────────────── */
  function drawFindResult(scale) {
    drawText('Bearing Selection Engine', W / 2, 26 * scale, '#ce93d8', 15 * scale, 'center', 'bold');

    if (!findResult || findResult.suitable.length === 0) {
      drawText('Set your requirements below and click "Find Bearing"', W / 2, H / 2, '#6b7a99', 12 * scale, 'center', 'normal');
      drawText('Radial load, axial load, speed, life and misalignment are checked', W / 2, H / 2 + 22 * scale, '#6b7a99', 10 * scale, 'center', 'normal');
      drawText('against 8 real SKF bearing families to recommend the smallest suitable size.', W / 2, H / 2 + 40 * scale, '#6b7a99', 10 * scale, 'center', 'normal');
      return;
    }

    var top = getFindTop();
    var isBest = findResult.suitable[0].key === top.key;
    var b = top.best;
    var cx = W * 0.28, cy = H * 0.54;
    var typeMap = { dgb: 'dgb', ang: 'ang', cyl: 'cyl', thr: 'thr', sab: 'dgb', tap: 'ang', sph: 'cyl', ndl: 'cyl' };
    var visualKey = typeMap[top.key] || 'dgb';
    var cfg = BEARING_TYPES[visualKey];
    drawBearingCrossSection(cx, cy, cfg, animAngle, visualKey === top.key);
    drawFindLoadArrows(cx, cy, scale, cfg);

    drawText(b.entry.series, cx, cy + 160 * scale, '#3ddc84', 15 * scale, 'center', 'bold');
    drawText(top.name + (isBest ? ' — Best Match' : ' — Selected'), cx, cy + 178 * scale, '#6b7a99', 10 * scale, 'center', 'normal');

    var px = W * 0.6, panelW = W * 0.34;
    var py = 42 * scale, lineH = 23 * scale;
    var s0col = (b.s0 != null && b.s0 < 1) ? '#ff5555' : '#3ddc84';
    var items = [
      { label: 'Bearing Type', value: top.name, color: isBest ? '#3ddc84' : '#f5c842' },
      { label: 'Designation', value: b.entry.series, color: '#3ddc84' },
      { label: 'Radial Load Fr', value: fmtForce(findReq.Fr), color: '#ff5555' },
      { label: 'Axial Load Fa', value: fmtForce(findReq.Fa), color: '#42a5f5' },
      { label: 'Speed', value: findReq.speed + ' rpm', color: '#dde3f0' },
      { label: 'Equiv. Load P', value: fmtForce(b.P), color: '#f5c842' },
      { label: "Req'd C", value: fmtRating(b.reqC_kN), color: '#f5c842' },
      { label: 'Catalog C / C0', value: fmtRating(b.entry.C) + ' / ' + fmtRating(b.entry.C0), color: '#3ddc84' },
      { label: 'Basic L10h', value: fmtHrs(b.actualL10hrs), color: '#8b95b3' },
      { label: 'SKF L10mh', value: fmtHrs(b.Lnm_hrs), color: '#ce93d8' },
      { label: 'Static s₀', value: (b.s0 != null ? roundN(b.s0, 1) : '—'), color: s0col },
      { label: 'Mass', value: fmtMass(b.entry.m), color: '#6b7a99' }
    ];

    // Background panel — sized to enclose the rows AND the overlaid HTML button below them
    var panelTop = py - 22 * scale;
    var panelBottom = 365 * scale;
    drawRoundedRect(px - 14 * scale, panelTop, panelW + 28 * scale, panelBottom - panelTop, 10 * scale, 'rgba(22,27,39,0.6)', '#2a3050', 1 * scale);

    for (var i = 0; i < items.length; i++) {
      var yy = py + i * lineH;
      drawText(items[i].label + ':', px, yy, '#8b95b3', 12 * scale, 'left', 'normal');
      drawText(String(items[i].value), px + panelW, yy, items[i].color, 13 * scale, 'right', 'bold');
    }
  }

  /* ── Load arrows for the currently viewed Find-Bearing result ─ */
  function drawFindLoadArrows(cx, cy, scale, cfg) {
    var outerR = 140 * scale;
    var arrowBase = outerR + 30 * scale;
    var maxArrowLen = 80 * scale;
    var Fr = findReq.Fr, Fa = findReq.Fa;

    if (Fr > 0 && cfg.key !== 'thr') {
      var radLen = maxArrowLen * Math.min(Fr / 50000, 1);
      drawArrow(cx, cy - arrowBase - radLen, cx, cy - arrowBase, '#ff5555', 2.5 * scale, 10 * scale);
      drawText('Fr = ' + fmtForce(Fr), cx, cy - arrowBase - radLen - 14 * scale, '#ff5555', 11 * scale, 'center', 'bold');
    }

    if (Fa > 0) {
      var axLen = maxArrowLen * Math.min(Fa / 20000, 1);
      if (cfg.key === 'thr') {
        drawArrow(cx + arrowBase + axLen, cy, cx + arrowBase, cy, '#42a5f5', 2.5 * scale, 10 * scale);
        drawText('Fa = ' + fmtForce(Fa), cx + arrowBase + axLen + 10 * scale, cy, '#42a5f5', 11 * scale, 'left', 'bold');
      } else {
        drawArrow(cx - arrowBase - axLen, cy, cx - arrowBase, cy, '#42a5f5', 2.5 * scale, 10 * scale);
        drawText('Fa = ' + fmtForce(Fa), cx - arrowBase - axLen - 10 * scale, cy, '#42a5f5', 11 * scale, 'right', 'bold');
      }
    }
  }

  /* ── Explore mode diagrams ──────────────────────────────────── */
  function drawExploreDiagram(concept) {
    var scale = Math.min(W / 900, H / 480);
    var cx = W * 0.35;
    var cy = H * 0.5;

    ctx.clearRect(0, 0, W, H);

    // Background
    drawRoundedRect(0, 0, W, H, 0, '#0d1117', null, 0);

    // Title
    drawText(concept.name, W / 2, 24 * scale, '#ce93d8', 15 * scale, 'center', 'bold');
    drawText(concept.symbol, W / 2, 46 * scale, '#7b1fa2', 12 * scale, 'center', 'normal');

    switch (concept.diagram) {
      case 'dgbDiagram':
        drawBearingCrossSection(cx, cy, BEARING_TYPES.dgb, animAngle);
        drawText('Deep Groove Ball Bearing', cx, H - 24 * scale, '#6b7a99', 10 * scale, 'center', 'normal');
        drawExploreInfoRight(scale, [
          'Most common bearing type',
          'Radial + moderate axial loads',
          'High speed capability',
          'Low maintenance',
          'Series: 6000, 6200, 6300'
        ]);
        break;

      case 'cylDiagram':
        drawBearingCrossSection(cx, cy, BEARING_TYPES.cyl, animAngle);
        drawText('Cylindrical Roller Bearing', cx, H - 24 * scale, '#6b7a99', 10 * scale, 'center', 'normal');
        drawExploreInfoRight(scale, [
          'Line contact = high radial capacity',
          'NU type: radial loads only',
          'Free axial displacement',
          'Used for non-locating positions',
          'Series: NU, NJ, NUP'
        ]);
        break;

      case 'angDiagram':
        drawBearingCrossSection(cx, cy, BEARING_TYPES.ang, animAngle);
        drawText('Angular Contact Ball Bearing', cx, H - 24 * scale, '#6b7a99', 10 * scale, 'center', 'normal');
        drawExploreInfoRight(scale, [
          'Offset raceways for combined loads',
          'Contact angle: 15\u00B0, 25\u00B0, 40\u00B0',
          'Often used in pairs',
          'P = 0.57Fr + 0.93Fa',
          'Series: 7200, 7300'
        ]);
        break;

      case 'thrDiagram':
        drawThrustBearing(cx, cy, scale, BEARING_TYPES.thr, animAngle);
        drawText('Thrust Ball Bearing', cx, H - 24 * scale, '#6b7a99', 10 * scale, 'center', 'normal');
        drawExploreInfoRight(scale, [
          'Axial loads only',
          'P = Fa',
          'Single or double direction',
          'Self-centering design',
          'Series: 511, 512, 513'
        ]);
        break;

      case 'nomenclatureDiagram':
        drawNomenclatureDiagram(cx, cy, scale);
        break;

      case 'boreCodeDiagram':
        drawBoreCodeTable(scale);
        break;

      case 'seriesDiagram':
        drawSeriesComparison(cx, cy, scale);
        break;

      case 'suffixDiagram':
        drawSuffixDiagram(cx, cy, scale);
        break;

      case 'l10Diagram':
        drawL10CurveDiagram(scale);
        break;

      case 'eqLoadDiagram':
        drawEqLoadDiagram(cx, cy, scale);
        break;

      case 'lifeHoursDiagram':
        drawLifeHoursDiagram(scale);
        break;

      case 'requiredCDiagram':
        drawRequiredCDiagram(scale);
        break;

      default:
        drawBearingCrossSection(cx, cy, BEARING_TYPES.dgb, animAngle);
        break;
    }
  }

  function drawExploreInfoRight(scale, lines) {
    var px = W * 0.62;
    var py = 80 * scale;
    for (var i = 0; i < lines.length; i++) {
      drawText('\u2022 ' + lines[i], px, py + i * 26 * scale, '#dde3f0', 10 * scale, 'left', 'normal');
    }
  }

  function drawNomenclatureDiagram(cx, cy, scale) {
    var desig = '6 2 0 5';
    var startX = cx - 80 * scale;
    var y = cy - 30 * scale;
    var spacing = 50 * scale;

    drawText('Bearing Designation Decoder', W / 2, 70 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    // Draw digits large
    var digits = ['6', '2', '0', '5'];
    var colors = ['#7b1fa2', '#42a5f5', '#f5c842', '#3ddc84'];
    var labels = ['Type', 'Series', 'Width', 'Bore Code'];
    var descs = ['Deep Groove\nBall', 'Light', 'Standard', '05 \u00D7 5 = 25mm'];

    for (var i = 0; i < digits.length; i++) {
      var dx = startX + i * spacing;
      // Digit
      drawRoundedRect(dx - 18 * scale, y - 22 * scale, 36 * scale, 44 * scale, 6 * scale, 'rgba(123,31,162,0.15)', colors[i], 2 * scale);
      drawText(digits[i], dx, y, colors[i], 24 * scale, 'center', 'bold');
      // Label above
      drawText(labels[i], dx, y - 40 * scale, '#6b7a99', 9 * scale, 'center', 'normal');
      // Description below
      var descLines = descs[i].split('\n');
      for (var j = 0; j < descLines.length; j++) {
        drawText(descLines[j], dx, y + 40 * scale + j * 16 * scale, colors[i], 9 * scale, 'center', 'normal');
      }
    }

    // Right side info
    drawExploreInfoRight(scale, [
      'First digit: bearing type',
      '6 = Deep groove ball',
      '7 = Angular contact',
      'N = Cylindrical roller',
      'Second digit: dimension series',
      'Last two: bore identification'
    ]);
  }

  function drawBoreCodeTable(scale) {
    var startX = W * 0.08;
    var startY = 80 * scale;
    var colW = 80 * scale;
    var rowH = 26 * scale;

    drawText('Bore Code Reference Table', W / 2, 60 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    // Header
    drawText('Code', startX, startY, '#7b1fa2', 10 * scale, 'left', 'bold');
    drawText('Bore (mm)', startX + colW, startY, '#7b1fa2', 10 * scale, 'left', 'bold');
    drawText('Rule', startX + colW * 2.2, startY, '#7b1fa2', 10 * scale, 'left', 'bold');

    var codes = [
      { code: '00', bore: '10', rule: 'Special' },
      { code: '01', bore: '12', rule: 'Special' },
      { code: '02', bore: '15', rule: 'Special' },
      { code: '03', bore: '17', rule: 'Special' },
      { code: '04', bore: '20', rule: '04 \u00D7 5' },
      { code: '05', bore: '25', rule: '05 \u00D7 5' },
      { code: '06', bore: '30', rule: '06 \u00D7 5' },
      { code: '08', bore: '40', rule: '08 \u00D7 5' },
      { code: '10', bore: '50', rule: '10 \u00D7 5' },
      { code: '12', bore: '60', rule: '12 \u00D7 5' },
      { code: '20', bore: '100', rule: '20 \u00D7 5' }
    ];

    for (var i = 0; i < codes.length; i++) {
      var yy = startY + (i + 1) * rowH;
      var isSpecial = parseInt(codes[i].code) < 4;
      var c = isSpecial ? '#f5c842' : '#dde3f0';
      drawText(codes[i].code, startX, yy, c, 10 * scale, 'left', 'bold');
      drawText(codes[i].bore, startX + colW, yy, c, 10 * scale, 'left', 'bold');
      drawText(codes[i].rule, startX + colW * 2.2, yy, '#6b7a99', 9 * scale, 'left', 'normal');
    }

    // Formula on right
    drawExploreInfoRight(scale, [
      'For codes 00-03: special values',
      '00 = 10mm, 01 = 12mm',
      '02 = 15mm, 03 = 17mm',
      '',
      'For codes 04 and above:',
      'Bore = code \u00D7 5 mm'
    ]);
  }

  function drawSeriesComparison(cx, cy, scale) {
    // Show three bearings side by side with different series sizes
    var bearings = [
      { name: '6005', od: 42, bore: 25, w: 12, C: 10.1 },
      { name: '6205', od: 52, bore: 25, w: 15, C: 14.8 },
      { name: '6305', od: 62, bore: 25, w: 17, C: 25.5 }
    ];

    drawText('Dimension Series Comparison (25mm bore)', W / 2, 70 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    for (var i = 0; i < bearings.length; i++) {
      var b = bearings[i];
      var bx = W * 0.15 + i * W * 0.22;
      var by = cy;
      var r = b.od / 2 * 1.4 * scale;
      var ir = b.bore / 2 * 1.4 * scale;

      // Outer race
      drawCircle(bx, by, r, '#6d6d6d', 2 * scale, 'rgba(74,74,74,0.4)');
      // Inner race
      drawCircle(bx, by, ir, '#6d6d6d', 2 * scale, 'rgba(74,74,74,0.6)');
      // Bore
      drawCircle(bx, by, ir * 0.6, '#2a3050', 1 * scale, '#0d1117');

      drawText(b.name, bx, by + r + 18 * scale, '#ce93d8', 12 * scale, 'center', 'bold');
      drawText('OD: ' + b.od + 'mm', bx, by + r + 34 * scale, '#6b7a99', 9 * scale, 'center', 'normal');
      drawText('C: ' + b.C + ' kN', bx, by + r + 48 * scale, '#3ddc84', 9 * scale, 'center', 'bold');
    }

    drawExploreInfoRight(scale, [
      'Same bore, different capacity',
      '60 series: Extra light',
      '62 series: Light',
      '63 series: Medium',
      'Larger series = more capacity',
      'but larger overall dimensions'
    ]);
  }

  function drawSuffixDiagram(cx, cy, scale) {
    drawText('Common Suffix Codes', W / 2, 70 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    var suffixes = [
      { code: '2RS / 2RSR', desc: 'Contact seals both sides', color: '#7b1fa2' },
      { code: 'ZZ / 2Z', desc: 'Metal shields both sides', color: '#42a5f5' },
      { code: 'C2', desc: 'Less than normal clearance', color: '#f5c842' },
      { code: 'C3', desc: 'Greater than normal clearance', color: '#3ddc84' },
      { code: 'C4', desc: 'Much greater clearance', color: '#ff5555' },
      { code: 'NR', desc: 'Snap ring groove', color: '#ce93d8' },
      { code: 'P5 / P6', desc: 'Precision class', color: '#42a5f5' },
      { code: 'TN', desc: 'Polyamide cage', color: '#f5c842' }
    ];

    var startX = W * 0.08;
    var startY = 100 * scale;
    var rowH = 36 * scale;

    for (var i = 0; i < suffixes.length; i++) {
      var yy = startY + i * rowH;
      drawRoundedRect(startX - 5 * scale, yy - 12 * scale, W * 0.8, 28 * scale, 4 * scale,
        'rgba(22,27,39,0.5)', '#2a3050', 0.5 * scale);
      drawText(suffixes[i].code, startX + 10 * scale, yy, suffixes[i].color, 11 * scale, 'left', 'bold');
      drawText(suffixes[i].desc, startX + 140 * scale, yy, '#dde3f0', 10 * scale, 'left', 'normal');
    }
  }

  function drawL10CurveDiagram(scale) {
    // Draw a simplified L10 vs C/P curve
    var ox = W * 0.12;
    var oy = H * 0.82;
    var gw = W * 0.45;
    var gh = H * 0.6;

    drawText('L10 Life vs C/P Ratio', W / 2, 60 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    // Axes
    drawLine(ox, oy, ox + gw, oy, '#6b7a99', 1.5 * scale);
    drawLine(ox, oy, ox, oy - gh, '#6b7a99', 1.5 * scale);

    // Labels
    drawText('C/P', ox + gw / 2, oy + 20 * scale, '#6b7a99', 10 * scale, 'center', 'normal');
    ctx.save();
    ctx.translate(ox - 20 * scale, oy - gh / 2);
    ctx.rotate(-Math.PI / 2);
    drawText('L10 (Mrev)', 0, 0, '#6b7a99', 10 * scale, 'center', 'normal');
    ctx.restore();

    // Plot ball curve (p=3)
    ctx.beginPath();
    ctx.strokeStyle = '#7b1fa2';
    ctx.lineWidth = 2 * scale;
    for (var x = 0; x <= 1; x += 0.01) {
      var cpRatio = 1 + x * 5; // C/P from 1 to 6
      var l10 = Math.pow(cpRatio, 3);
      var px = ox + (x * gw);
      var py = oy - (l10 / 220) * gh;
      if (x === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Plot roller curve (p=10/3)
    ctx.beginPath();
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2 * scale;
    for (var xr = 0; xr <= 1; xr += 0.01) {
      var cpR = 1 + xr * 5;
      var l10r = Math.pow(cpR, 10 / 3);
      var pxr = ox + (xr * gw);
      var pyr = oy - (l10r / 220) * gh * 0.85;
      pyr = Math.max(pyr, oy - gh);
      if (xr === 0) ctx.moveTo(pxr, pyr);
      else ctx.lineTo(pxr, pyr);
    }
    ctx.stroke();

    // Tick marks
    for (var t = 1; t <= 6; t++) {
      var tx = ox + ((t - 1) / 5) * gw;
      drawLine(tx, oy, tx, oy + 4 * scale, '#6b7a99', 1 * scale);
      drawText(t.toString(), tx, oy + 12 * scale, '#6b7a99', 8 * scale, 'center', 'normal');
    }

    // Legend
    drawLine(W * 0.62, 100 * scale, W * 0.66, 100 * scale, '#7b1fa2', 2 * scale);
    drawText('Ball (p=3)', W * 0.67, 100 * scale, '#7b1fa2', 10 * scale, 'left', 'normal');
    drawLine(W * 0.62, 120 * scale, W * 0.66, 120 * scale, '#42a5f5', 2 * scale);
    drawText('Roller (p=10/3)', W * 0.67, 120 * scale, '#42a5f5', 10 * scale, 'left', 'normal');

    drawExploreInfoRight(scale, [
      'L10 = (C/P)^p',
      '',
      'p = 3 for ball bearings',
      'p = 10/3 for roller bearings',
      '',
      'Life increases rapidly',
      'with higher C/P ratio'
    ]);
  }

  function drawEqLoadDiagram(cx, cy, scale) {
    drawText('Equivalent Dynamic Load', W / 2, 60 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    // Show bearing with force vectors
    drawBearingCrossSection(W * 0.3, cy, BEARING_TYPES.dgb, animAngle);

    // Fr arrow (vertical)
    drawArrow(W * 0.3, cy - 160 * scale, W * 0.3, cy - 100 * scale, '#ff5555', 2.5 * scale, 10 * scale);
    drawText('Fr', W * 0.3, cy - 170 * scale, '#ff5555', 12 * scale, 'center', 'bold');

    // Fa arrow (horizontal)
    drawArrow(W * 0.3 - 160 * scale, cy, W * 0.3 - 100 * scale, cy, '#42a5f5', 2.5 * scale, 10 * scale);
    drawText('Fa', W * 0.3 - 170 * scale, cy, '#42a5f5', 12 * scale, 'center', 'bold');

    drawExploreInfoRight(scale, [
      'P = X\u00B7Fr + Y\u00B7Fa',
      '',
      'Deep Groove Ball:',
      '  Fa/Fr \u2264 e: X=1, Y=0',
      '  Fa/Fr > e: X=0.56, Y=1.63',
      '',
      'Cylindrical Roller: P = Fr',
      'Angular Contact: X=0.57, Y=0.93',
      'Thrust: P = Fa'
    ]);
  }

  function drawLifeHoursDiagram(scale) {
    drawText('Converting L10 to Operating Hours', W / 2, 60 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    // Formula box
    drawRoundedRect(W * 0.1, 90 * scale, W * 0.8, 50 * scale, 8 * scale, 'rgba(123,31,162,0.1)', '#7b1fa2', 1.5 * scale);
    drawText('Lh = (L10 \u00D7 10\u2076) / (60 \u00D7 n)', W / 2, 115 * scale, '#ce93d8', 16 * scale, 'center', 'bold');

    // Recommended life table
    var apps = [
      { name: 'Household appliances', life: '1000 - 3000', color: '#3ddc84' },
      { name: 'Light machines (8 hrs/day)', life: '4000 - 8000', color: '#3ddc84' },
      { name: 'Industrial machines', life: '8000 - 15000', color: '#f5c842' },
      { name: 'Electric motors', life: '10000 - 20000', color: '#f5c842' },
      { name: 'Industrial gearboxes', life: '20000 - 50000', color: '#ff5555' },
      { name: 'Continuous operation (24/7)', life: '50000 - 100000', color: '#ff5555' }
    ];

    var startY = 170 * scale;
    drawText('Recommended Minimum Life (hours)', W * 0.1, startY, '#7b1fa2', 11 * scale, 'left', 'bold');

    for (var i = 0; i < apps.length; i++) {
      var yy = startY + (i + 1) * 30 * scale;
      drawRoundedRect(W * 0.08, yy - 10 * scale, W * 0.84, 24 * scale, 4 * scale,
        'rgba(22,27,39,0.5)', '#2a3050', 0.5 * scale);
      drawText(apps[i].name, W * 0.1, yy, '#dde3f0', 10 * scale, 'left', 'normal');
      drawText(apps[i].life + ' hrs', W * 0.85, yy, apps[i].color, 10 * scale, 'right', 'bold');
    }
  }

  function drawRequiredCDiagram(scale) {
    drawText('Calculating Required Load Rating C', W / 2, 60 * scale, '#dde3f0', 14 * scale, 'center', 'bold');

    // Formula
    drawRoundedRect(W * 0.05, 85 * scale, W * 0.9, 50 * scale, 8 * scale, 'rgba(123,31,162,0.1)', '#7b1fa2', 1.5 * scale);
    drawText('C = P \u00D7 (Lh \u00D7 60 \u00D7 n / 10\u2076)^(1/p)', W / 2, 110 * scale, '#ce93d8', 15 * scale, 'center', 'bold');

    // Flow diagram
    var steps = [
      { label: 'Given: P, n, Lh', color: '#42a5f5', y: 160 },
      { label: 'Calculate C_req', color: '#f5c842', y: 200 },
      { label: 'Search catalog: C_bearing \u2265 C_req', color: '#7b1fa2', y: 240 },
      { label: 'Select smallest suitable bearing', color: '#3ddc84', y: 280 },
      { label: 'Verify actual L10 life', color: '#ce93d8', y: 320 }
    ];

    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      var yy = s.y * scale;
      drawRoundedRect(W * 0.15, yy - 14 * scale, W * 0.7, 28 * scale, 6 * scale,
        'rgba(22,27,39,0.6)', s.color, 1.5 * scale);
      drawText((i + 1) + '. ' + s.label, W / 2, yy, s.color, 10 * scale, 'center', 'bold');

      if (i < steps.length - 1) {
        drawArrow(W / 2, yy + 14 * scale, W / 2, (steps[i + 1].y) * scale - 14 * scale, '#6b7a99', 1 * scale, 6 * scale);
      }
    }
  }

  /* ── Main draw function ─────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background
    drawRoundedRect(0, 0, W, H, 0, '#0d1117', null, 0);

    var scale = Math.min(W / 900, H / 480);
    var cfg = BEARING_TYPES.dgb;

    if (mode === 'find') {
      drawFindResult(scale);
    } else if (mode === 'explore' && selectedConcept) {
      drawExploreDiagram(selectedConcept);
    } else if (mode === 'explore') {
      // Default explore view
      var bcx = W * 0.5;
      var bcy = H * 0.5;
      drawBearingCrossSection(bcx, bcy, cfg, animAngle);
      drawText('Select a concept to explore', bcx, 24 * scale, '#6b7a99', 12 * scale, 'center', 'normal');
    } else if (mode === 'practice') {
      // Animated bearing in background
      var pcx = W * 0.5;
      var pcy = H * 0.5;
      ctx.globalAlpha = 0.25;
      drawBearingCrossSection(pcx, pcy, cfg, animAngle);
      ctx.globalAlpha = 1;
      drawText('Practice Mode', pcx, 30 * scale, '#7b1fa2', 16 * scale, 'center', 'bold');
      drawText('Solve bearing problems below', pcx, 52 * scale, '#6b7a99', 11 * scale, 'center', 'normal');
    } else if (mode === 'quiz') {
      // Animated bearing in background
      var qcx = W * 0.5;
      var qcy = H * 0.5;
      ctx.globalAlpha = 0.2;
      drawBearingCrossSection(qcx, qcy, cfg, animAngle);
      ctx.globalAlpha = 1;
      drawText('Quiz Mode', qcx, 30 * scale, '#7b1fa2', 16 * scale, 'center', 'bold');
      drawText('Test your bearing knowledge', qcx, 52 * scale, '#6b7a99', 11 * scale, 'center', 'normal');
    }
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Angular speed proportional to the RPM slider. `speed` was never declared,
    // so this threw on the first frame and the bearing never rotated at all;
    // read the slider the same way runFindBearing does.
    var rpm = fSpeed ? (parseFloat(fSpeed.value) || 0) : 0;
    var omega = (rpm / 60) * 2 * Math.PI * 0.05; // scaled down for visual
    animAngle += omega * dt;
    if (animAngle > Math.PI * 200) animAngle -= Math.PI * 200;

    draw();

    if (animRunning) {
      requestAnimationFrame(animate);
    }
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;

    // Update tabs
    modeTabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-mode') === m);
    });

    // Show/hide panels
    hide(findPanel);
    hide(calcPanel);
    hide(catRow);
    hide(itemSelector);
    hide(itemInfo);
    hide(practicePanel);
    hide(practiceBar);
    hide(quizPanel);
    hide(quizBar);
    hide(quizResult);
    if (canvasCard) canvasCard.style.display = (m === 'calc') ? 'none' : '';

    if (m === 'find') {
      show(findPanel);
      runFindBearing();
    } else if (m === 'calc') {
      show(calcPanel);
      runCalculators();
    } else if (m === 'explore') {
      show(catRow);
      show(itemSelector);
      selectedConcept = null;
      buildConceptGrid();
    } else if (m === 'practice') {
      show(practicePanel);
      show(practiceBar);
      startPractice();
    } else if (m === 'quiz') {
      show(quizBar);
      show(quizPanel);
      startQuiz();
    }

    draw();
  }

  /* ================================================================
     FIND-BEARING MODE
     ================================================================ */
  var FIND_ICON = { dgb: '●', ang: '∠', sab: '◉', cyl: '⚙', tap: '▲', sph: '◎', ndl: '≡', thr: '⬆' };
  var FIND_FAMILY = {
    dgb: { label: 'Ball Bearing', color: '#7b1fa2' },
    ang: { label: 'Ball Bearing', color: '#7b1fa2' },
    sab: { label: 'Ball Bearing', color: '#7b1fa2' },
    cyl: { label: 'Roller Bearing', color: '#42a5f5' },
    tap: { label: 'Roller Bearing', color: '#42a5f5' },
    sph: { label: 'Roller Bearing', color: '#42a5f5' },
    ndl: { label: 'Roller Bearing', color: '#42a5f5' },
    thr: { label: 'Thrust Bearing', color: '#f5c842' }
  };

  function runFindBearing() {
    findReq = {
      bore: (fBoreAny && fBoreAny.checked) ? 0 : (parseFloat(fBore.value) || 0),
      Fr: parseFloat(fFr.value) || 0,
      Fa: parseFloat(fFa.value) || 0,
      speed: parseFloat(fSpeed.value) || 1,
      life: parseFloat(fLife.value) || 1000,
      misalign: parseFloat(fMis.value) || 0,
      reliability: fReliability ? (parseInt(fReliability.value, 10) || 90) : 90,
      contam: fContam ? fContam.value : 'normal',
      kappa: fKappa ? (parseFloat(fKappa.value) || 2) : 2
    };
    findResult = findBearings(findReq);
    selectedFindKey = null;
    updateBadges();
    renderFindResults();
    draw();
  }

  function updateBadges() {
    var top = getFindTop();
    if (!top) {
      rbLife.textContent = '---';
      rbEqLoad.textContent = '---';
      rbReqC.textContent = '---';
      rbBearing.textContent = '---';
      return;
    }
    var b = top.best;
    rbLife.textContent = fmtHrs(b.Lnm_hrs);
    rbEqLoad.textContent = fmtForce(b.P);
    rbReqC.textContent = fmtRating(b.reqC_kN);
    rbBearing.textContent = b.entry.series;
  }

  function findRowHTML(r, rank) {
    var b = r.best;
    var isViewed = getFindTop() && getFindTop().key === r.key;
    var fam = FIND_FAMILY[r.key] || { label: '', color: '#7b1fa2' };
    var badge = rank === 0 ? '<span class="find-badge find-badge-best">Best Match</span>' : '';
    var viewedBadge = isViewed && rank !== 0 ? '<span class="find-badge find-badge-viewing">Viewing</span>' : '';
    return (
      '<div class="find-card' + (rank === 0 ? ' find-card-best' : '') + (isViewed ? ' find-card-viewing' : '') + '" style="--fam-color:' + fam.color + '" data-find-key="' + r.key + '" role="button" tabindex="0" aria-label="View ' + r.name + ' simulation">' +
      '  <div class="find-card-top">' +
      '    <div class="find-card-top-left">' +
      '      <span class="find-icon-badge">' + (FIND_ICON[r.key] || '●') + '</span>' +
      '      <div class="find-card-top-text"><span class="find-kicker">' + fam.label + '</span><span class="find-type-name">' + r.name + '</span></div>' +
      '    </div>' + badge + viewedBadge +
      '  </div>' +
      '  <div class="find-desig-row"><span class="find-desig-label">Designation</span><span class="find-desig">' + b.entry.series + '</span></div>' +
      '  <div class="find-note">' + r.note + '</div>' +
      '  <div class="find-spec-grid">' +
      '    <div class="find-spec"><span>Bore d</span><strong>' + fmtLen(b.entry.d) + '</strong></div>' +
      '    <div class="find-spec"><span>OD D</span><strong>' + fmtLen(b.entry.D) + '</strong></div>' +
      '    <div class="find-spec"><span>Width B</span><strong>' + fmtLen(b.entry.B) + '</strong></div>' +
      '    <div class="find-spec"><span>Dynamic C</span><strong>' + fmtRating(b.entry.C) + '</strong></div>' +
      '    <div class="find-spec"><span>Static C0</span><strong>' + fmtRating(b.entry.C0) + '</strong></div>' +
      '    <div class="find-spec"><span>Fatigue Pu</span><strong>' + (b.entry.pu != null ? fmtRating(b.entry.pu) : '—') + '</strong></div>' +
      '    <div class="find-spec"><span>Req\'d C</span><strong>' + fmtRating(b.reqC_kN) + '</strong></div>' +
      '    <div class="find-spec"><span>Equiv. P</span><strong>' + fmtForce(b.P) + '</strong></div>' +
      '    <div class="find-spec"><span>Basic L10h</span><strong>' + fmtHrs(b.actualL10hrs) + '</strong></div>' +
      '    <div class="find-spec find-spec-hi"><span>SKF L10mh</span><strong>' + fmtHrs(b.Lnm_hrs) + '</strong></div>' +
      '    <div class="find-spec"><span>Static s&#8320;</span><strong>' + (b.s0 != null ? roundN(b.s0, 1) : '—') + '</strong></div>' +
      '    <div class="find-spec"><span>Mass</span><strong>' + fmtMass(b.entry.m) + '</strong></div>' +
      '  </div>' +
      findCompareHTML(b) +
      findFlagsHTML(b) +
      '</div>'
    );
  }

  function fmtHrs(h) {
    if (!isFinite(h)) return '∞';
    if (h >= 100000) return roundN(h / 1000, 0) + 'k hrs';
    if (h >= 10000) return roundN(h / 1000, 1) + 'k hrs';
    return roundN(h, 0) + ' hrs';
  }

  // Design requirement vs the available standard bearing, with margin.
  function findCompareHTML(b) {
    function row(label, need, have, marginHTML, ok) {
      return '<div class="cmp-row' + (ok ? '' : ' cmp-row-bad') + '">' +
        '<span class="cmp-label">' + label + '</span>' +
        '<span class="cmp-need">' + need + '</span>' +
        '<span class="cmp-arrow">→</span>' +
        '<span class="cmp-have">' + have + '</span>' +
        '<span class="cmp-margin">' + marginHTML + '</span>' +
        '</div>';
    }
    var rows = '';
    // Dynamic load C
    var cMargin = ((b.entry.C - b.reqC_kN) / b.reqC_kN) * 100;
    rows += row('Dynamic load C', fmtRating(b.reqC_kN), fmtRating(b.entry.C),
      '<span class="cmp-ok">+' + roundN(cMargin, 0) + '%</span>', true);
    // Rating life (SKF L10m vs required)
    var lifeRatio = b.Lnm_hrs / (findReq.life || 1);
    rows += row('Rating life', fmtHrs(findReq.life), fmtHrs(b.Lnm_hrs),
      '<span class="cmp-ok">' + (lifeRatio >= 10 ? roundN(lifeRatio, 0) : roundN(lifeRatio, 1)) + '×</span>', true);
    // Speed
    var spdRatio = b.entry.nLim / (findReq.speed || 1);
    rows += row('Speed', findReq.speed + ' rpm', b.entry.nLim + ' rpm limit',
      '<span class="cmp-ok">' + roundN(spdRatio, 1) + '×</span>', true);
    // Bore
    var needBore = findReq.bore > 0 ? ('≥ ' + fmtLen(findReq.bore)) : 'any';
    rows += row('Bore d', needBore, fmtLen(b.entry.d), '<span class="cmp-ok">✓</span>', true);
    return '<div class="cmp-block"><div class="cmp-head"><span>Requirement</span><span>Standard bearing</span></div>' + rows + '</div>';
  }

  function findFlagsHTML(b) {
    var flags = [];
    if (b.aSKF != null) {
      flags.push('<span class="find-flag find-flag-info">a_SKF ' + roundN(b.aSKF, 2) + ' · a₁ ' + b.a1 + '</span>');
    }
    if (b.s0 != null && b.s0 < 1) {
      flags.push('<span class="find-flag find-flag-warn">Low static safety s₀ &lt; 1</span>');
    }
    if (!b.minLoadOK) {
      flags.push('<span class="find-flag find-flag-warn">Below min. load (skidding risk)</span>');
    }
    if (!flags.length) return '';
    return '<div class="find-flags">' + flags.join('') + '</div>';
  }

  function excludedRowHTML(r) {
    return (
      '<div class="find-excluded-row">' +
      '  <span class="find-excluded-name">' + r.name + '</span>' +
      '  <span class="find-excluded-reason">' + r.reasons.join('; ') + '</span>' +
      '</div>'
    );
  }

  function buildResultsHTML() {
    if (!findResult) return '';
    var s = findResult.suitable, ex = findResult.excluded;
    var html = '';
    if (s.length === 0) {
      html += '<div class="find-empty">No catalog bearing in this trainer\'s size range satisfies all requirements. Try relaxing life, speed, or misalignment, or reduce the load.</div>';
    } else {
      html += '<div class="find-cards">';
      for (var i = 0; i < s.length; i++) html += findRowHTML(s[i], i);
      html += '</div>';
    }
    if (ex.length > 0) {
      html += '<div class="find-excluded"><div class="find-excluded-title">Not suitable</div>';
      for (var j = 0; j < ex.length; j++) html += excludedRowHTML(ex[j]);
      html += '</div>';
    }
    return html;
  }

  function wireResultCards(container, closeModalAfter) {
    container.querySelectorAll('.find-card[data-find-key]').forEach(function (card) {
      var choose = function () {
        selectFindResult(card.getAttribute('data-find-key'));
        if (closeModalAfter) closeFindModal();
      };
      card.addEventListener('click', choose);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
      });
    });
  }

  function renderFindResults() {
    // Results are shown only in the popup; just keep it in sync if it's open.
    if (findResult && findModalBackdrop.style.display !== 'none') renderFindModalBody();
  }

  function selectFindResult(key) {
    selectedFindKey = key;
    updateBadges();
    renderFindResults();
    draw();
  }

  function renderFindModalBody() {
    if (!findResult) { findModalBody.innerHTML = ''; return; }
    findModalBody.innerHTML =
      '<p class="find-modal-summary">' + findResult.suitable.length + ' of 8 bearing types suitable for Fr=' + fmtForce(findReq.Fr) + ', Fa=' + fmtForce(findReq.Fa) + ', ' + findReq.speed + ' rpm, ' + findReq.life + ' hr life.</p>' +
      buildResultsHTML();
    wireResultCards(findModalBody, true);
  }

  function openFindModal() {
    renderFindModalBody();
    findModalBackdrop.style.display = 'flex';
  }

  function closeFindModal() {
    findModalBackdrop.style.display = 'none';
  }

  /* ================================================================
     CALCULATORS MODE — lubrication κ, load-from-power, decoder
     ================================================================ */
  // ISO VG grades: [nu40, nu100] (mm²/s), mineral oil ~VI 95
  var VG_DATA = {
    '32': [32, 5.4], '46': [46, 6.8], '68': [68, 8.8], '100': [100, 11.4],
    '150': [150, 15], '220': [220, 19.4], '320': [320, 24.5], '460': [460, 31], '680': [680, 40]
  };
  function walther(nu) { return Math.log(Math.log(nu + 0.7) / Math.LN10) / Math.LN10; }
  function invWalther(W) { return Math.pow(10, Math.pow(10, W)) - 0.7; }
  function oilViscosityAt(vg, T) {
    var d = VG_DATA[vg]; if (!d) return null;
    var W40 = walther(d[0]), W100 = walther(d[1]);
    var x40 = Math.log(313.15) / Math.LN10, x100 = Math.log(373.15) / Math.LN10;
    var B = (W40 - W100) / (x100 - x40);
    var A = W40 + B * x40;
    var WT = A - B * (Math.log(T + 273.15) / Math.LN10);
    return invWalther(WT);
  }
  function ratedViscosity(dm, n) {
    // SKF ν1 (mm²/s) as function of dm (mm) and n (rpm)
    if (n < 1000) return 4500 / (Math.pow(n, 0.5) * Math.pow(dm, 0.5));
    return 45000 / (Math.pow(n, 0.83) * Math.pow(dm, 0.5));
  }
  function kappaRegime(k) {
    if (k < 0.1) return { name: 'Boundary lubrication', desc: 'Metal-to-metal asperity contact — EP/AW additives essential; short life.', color: '#ff5555' };
    if (k < 1) return { name: 'Mixed (thin film)', desc: 'Partial film — some wear; increase viscosity or reduce temperature.', color: '#f5c842' };
    if (k <= 4) return { name: 'Mixed / good film', desc: 'Good lubrication regime — the sweet spot for most applications.', color: '#3ddc84' };
    return { name: 'Full film (EHL)', desc: 'Complete separation — no life gain above κ≈4, higher friction/heat.', color: '#42a5f5' };
  }

  function runLubrication() {
    // inputs are in the current display unit → convert to SI
    var d = lenToSI(parseFloat($('#lub-d').value) || 0), D = lenToSI(parseFloat($('#lub-D').value) || 0);
    var n = parseFloat($('#lub-n').value) || 1, vg = $('#lub-vg').value, T = tempToSI(parseFloat($('#lub-T').value) || 40);
    var dm = 0.5 * (d + D);
    if (dm <= 0) { $('#lub-out').innerHTML = '<span class="calc-err">Enter valid bore and OD.</span>'; return; }
    var nu1 = ratedViscosity(dm, n);
    var nu = oilViscosityAt(vg, T);
    var kappa = nu / nu1;
    lubKappa = clamp(kappa, 0.05, 8);
    var reg = kappaRegime(kappa);
    $('#lub-out').innerHTML =
      '<div class="calc-res-grid">' +
      '<div class="calc-res"><span>Mean dia d<sub>m</sub></span><strong>' + fmtLen(dm) + '</strong></div>' +
      '<div class="calc-res"><span>Rated visc. ν₁</span><strong>' + roundN(nu1, 1) + ' mm²/s</strong></div>' +
      '<div class="calc-res"><span>Oper. visc. ν</span><strong>' + roundN(nu, 1) + ' mm²/s</strong></div>' +
      '<div class="calc-res calc-res-hi"><span>Viscosity ratio κ</span><strong style="color:' + reg.color + '">' + roundN(kappa, 2) + '</strong></div>' +
      '</div>' +
      '<div class="calc-verdict" style="border-color:' + reg.color + '"><strong style="color:' + reg.color + '">' + reg.name + '</strong> — ' + reg.desc + '</div>';
  }

  function runLoadCalc() {
    var P = powerToSI(parseFloat($('#ld-power').value) || 0), n = parseFloat($('#ld-n').value) || 1;
    var d = lenToSI(parseFloat($('#ld-d').value) || 1), type = $('#ld-type').value, duty = parseFloat($('#ld-factor').value) || 1;
    var T = 9550 * P / n;                 // Nm
    var Ft = 2000 * T / d;                // N (tangential at pitch dia)
    var Fr, Fa = 0, model;
    if (type === 'spur') { Fr = Ft / Math.cos(20 * Math.PI / 180); model = 'Spur gear: F_r = F_t/cos20° (separating + tangential resultant)'; }
    else if (type === 'helical') { Fr = Ft * Math.sqrt(1 + Math.pow(Math.tan(20 * Math.PI / 180) / Math.cos(15 * Math.PI / 180), 2)); Fa = Ft * Math.tan(15 * Math.PI / 180); model = 'Helical gear: axial F_a = F_t·tan(15° helix)'; }
    else if (type === 'vbelt') { Fr = Ft * 1.7; model = 'V-belt: shaft pull ≈ 1.7·F_t (belt tension)'; }
    else if (type === 'flatbelt') { Fr = Ft * 2.5; model = 'Flat belt: shaft pull ≈ 2.5·F_t (high tension)'; }
    else { Fr = Ft * 1.15; model = 'Chain / toothed belt: shaft pull ≈ 1.15·F_t'; }
    Fr *= duty; Fa *= duty;
    ldFr = Math.round(Fr); ldFa = Math.round(Fa);
    $('#ld-out').innerHTML =
      '<div class="calc-res-grid">' +
      '<div class="calc-res"><span>Torque T</span><strong>' + fmtTorque(T) + '</strong></div>' +
      '<div class="calc-res"><span>Tangential F<sub>t</sub></span><strong>' + fmtForce(Ft) + '</strong></div>' +
      '<div class="calc-res calc-res-hi"><span>Radial F<sub>r</sub></span><strong style="color:#ff5555">' + fmtForce(ldFr) + '</strong></div>' +
      '<div class="calc-res calc-res-hi"><span>Axial F<sub>a</sub></span><strong style="color:#42a5f5">' + fmtForce(ldFa) + '</strong></div>' +
      '</div>' +
      '<div class="calc-verdict">' + model + '. Includes duty factor ×' + duty + '.</div>';
  }

  /* ── Designation decoder ──────────────────────────────────────── */
  var DECODE_SUFFIX = {
    '2RS1': 'Contact seals (NBR) both sides — sealed for life', '2RSH': 'Contact seals (HNBR) both sides',
    '2RSR': 'Contact seals both sides', 'RS1': 'Contact seal one side', '2RS': 'Contact seals both sides',
    '2Z': 'Metal shields both sides', 'ZZ': 'Metal shields both sides', '2ZR': 'Metal shields both sides', 'Z': 'Metal shield one side',
    'C1': 'Radial clearance < C2 (very small)', 'C2': 'Radial clearance less than Normal', 'CN': 'Normal radial clearance',
    'C3': 'Radial clearance greater than Normal', 'C4': 'Radial clearance greater than C3', 'C5': 'Radial clearance greater than C4',
    'P0': 'Normal ISO tolerance class', 'P6': 'ISO tolerance class 6 (higher precision)', 'P5': 'ISO tolerance class 5',
    'P4': 'ISO tolerance class 4 (high precision)', 'P4A': 'ISO class 4 with modified running accuracy',
    'E': 'Reinforced / optimised internal design (higher capacity)', 'EC': 'Optimised roller set + flange (cyl. roller)',
    'ECP': 'Optimised design, polyamide cage', 'ECM': 'Optimised design, machined brass cage', 'ECJ': 'Optimised design, pressed steel cage',
    'ETN9': 'Reinforced, glass-fibre polyamide cage', 'TN9': 'Glass-fibre reinforced polyamide cage', 'TN': 'Polyamide cage',
    'P': 'Polyamide (glass-fibre) cage, ball-centred', 'M': 'Machined brass cage', 'J': 'Pressed steel cage', 'MA': 'Machined brass cage, outer-ring centred', 'MB': 'Machined brass cage, inner-ring centred',
    'B': 'Contact angle 40° (angular contact)', 'BE': '40° contact, reinforced', 'BECBP': '40° contact, reinforced, polyamide cage',
    'AC': 'Contact angle 25°', 'CC': 'Spherical roller, optimised, no floating guide ring', 'CA': 'Spherical roller, machined cage, guide ring', 'CB': 'Reduced clearance range (CC)',
    'W33': 'Lubrication groove + 3 holes in outer ring', 'K': 'Tapered bore, taper 1:12', 'K30': 'Tapered bore, taper 1:30',
    'N': 'Snap-ring groove in outer ring', 'NR': 'Snap-ring groove + snap ring', 'X': 'Boundary dims changed to ISO', 'VA405': 'Special for high-temperature applications'
  };
  var DECODE_TYPE = [
    { re: /^NA/, t: 'Needle roller bearing (NA — with inner ring)' },
    { re: /^RNA/, t: 'Needle roller bearing (RNA — without inner ring)' },
    { re: /^NK/, t: 'Needle roller bearing (NK — drawn cup / machined, no inner ring)' },
    { re: /^NUP/, t: 'Cylindrical roller bearing (NUP — locating, both ring flanges + loose flange)' },
    { re: /^NU/, t: 'Cylindrical roller bearing (NU — non-locating, no inner-ring flanges)' },
    { re: /^NJ/, t: 'Cylindrical roller bearing (NJ — locates in one direction)' },
    { re: /^NF/, t: 'Cylindrical roller bearing (NF)' },
    { re: /^N/, t: 'Cylindrical roller bearing (N — no outer-ring flanges)' },
    { re: /^QJ/, t: 'Four-point contact ball bearing (QJ)' },
    { re: /^T/, t: 'Tapered roller bearing (T-series / metric)' },
    { re: /^6/, t: 'Deep groove ball bearing (6-series)' },
    { re: /^7/, t: 'Angular contact ball bearing (7-series)' },
    { re: /^1/, t: 'Self-aligning ball bearing (1-series)' },
    { re: /^22/, t: 'Spherical roller bearing (22-series)' },
    { re: /^23/, t: 'Spherical roller bearing (23-series, wide)' },
    { re: /^2/, t: 'Self-aligning ball / spherical roller bearing (2-series)' },
    { re: /^302|^303|^320|^322|^323|^329|^330|^331|^332/, t: 'Tapered roller bearing (metric 3-series)' },
    { re: /^30|^31|^32|^33/, t: 'Tapered roller bearing (metric)' },
    { re: /^3/, t: 'Double-row angular contact ball bearing (3-series)' },
    { re: /^511|^512|^513|^514/, t: 'Thrust ball bearing, single direction (51-series)' },
    { re: /^522|^523|^524/, t: 'Thrust ball bearing, double direction (52-series)' },
    { re: /^811|^812/, t: 'Cylindrical roller thrust bearing (8-series)' },
    { re: /^292|^293|^294/, t: 'Spherical roller thrust bearing (29-series)' },
    { re: /^5/, t: 'Thrust ball bearing (5-series)' },
    { re: /^8/, t: 'Cylindrical roller thrust bearing (8-series)' }
  ];
  function boreFromCode(code) {
    if (code === '00') return 10; if (code === '01') return 12; if (code === '02') return 15; if (code === '03') return 17;
    var n = parseInt(code, 10); return isNaN(n) ? null : n * 5;
  }
  function decodeDesignation(raw) {
    var s = (raw || '').toUpperCase().trim();
    if (!s) return '<span class="calc-hint">Type a designation above to decode it.</span>';
    var tokens = s.split(/[\s\-\/]+/).filter(Boolean);
    // Merge a pure-letter prefix token with a following digit token: "NU 210" → "NU210"
    if (tokens.length >= 2 && /^[A-Z]+$/.test(tokens[0]) && /^\d/.test(tokens[1])) {
      tokens = [tokens[0] + tokens[1]].concat(tokens.slice(2));
    }
    var core = tokens[0];
    // core may be like "NU210" or "6205" or "22222" or "30205"; leading letters + digits
    var mLetters = core.match(/^[A-Z]*/)[0];
    var mDigits = core.match(/\d+/) ? core.match(/\d+/)[0] : '';
    // type
    var type = 'Unrecognised type — check the designation';
    for (var i = 0; i < DECODE_TYPE.length; i++) { if (DECODE_TYPE[i].re.test(core)) { type = DECODE_TYPE[i].t; break; } }
    // bore: last two digits of the numeric part
    var boreMM = null, boreCode = '';
    if (mDigits.length >= 2) { boreCode = mDigits.slice(-2); boreMM = boreFromCode(boreCode); }
    // suffixes: remaining tokens + trailing letters glued onto core
    var suffTokens = tokens.slice(1);
    var glued = core.slice(mLetters.length + mDigits.length);
    if (glued) suffTokens.unshift(glued);
    var suffRows = [];
    suffTokens.forEach(function (tk) {
      if (!tk) return;
      var found = DECODE_SUFFIX[tk];
      if (!found) {
        // try progressive strip (e.g. ECP -> E?) — check whole then known keys contained
        var keys = Object.keys(DECODE_SUFFIX).sort(function (a, b) { return b.length - a.length; });
        for (var k = 0; k < keys.length; k++) { if (tk.indexOf(keys[k]) === 0) { found = DECODE_SUFFIX[keys[k]] + (tk.length > keys[k].length ? ' (+ ' + tk.slice(keys[k].length) + ')' : ''); break; } }
      }
      suffRows.push('<div class="dc-row"><span class="dc-code">' + tk + '</span><span class="dc-mean">' + (found || 'Special suffix — see SKF designation system') + '</span></div>');
    });
    var html = '<div class="dc-result">';
    html += '<div class="dc-row dc-row-main"><span class="dc-code">' + core + '</span><span class="dc-mean">' + type + '</span></div>';
    if (boreMM != null) html += '<div class="dc-row"><span class="dc-code">Bore ' + boreCode + '</span><span class="dc-mean">Bore diameter d = <strong>' + fmtLen(boreMM) + '</strong>' + (parseInt(boreCode, 10) >= 4 ? ' (code ×5)' : ' (special code)') + '</span></div>';
    html += suffRows.join('');
    html += '</div>';
    return html;
  }

  var lubKappa = 2, ldFr = 0, ldFa = 0;
  function runCalculators() { runLubrication(); runLoadCalc(); $('#dc-out').innerHTML = decodeDesignation($('#dc-input').value); }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  function buildConceptGrid() {
    conceptGrid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    filtered.forEach(function (concept) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept && selectedConcept.id === concept.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + concept.name + '</span>' +
        '<span class="is-btn-sym">' + concept.symbol + '</span>';
      btn.addEventListener('click', function () {
        selectConcept(concept);
      });
      conceptGrid.appendChild(btn);
    });
  }

  function selectConcept(concept) {
    selectedConcept = concept;
    // Highlight button
    var btns = conceptGrid.querySelectorAll('.is-btn');
    btns.forEach(function (b) { b.classList.remove('active'); });
    var idx = CONCEPTS.filter(function (c) { return c.cat === exploreCat; }).indexOf(concept);
    if (idx >= 0 && btns[idx]) btns[idx].classList.add('active');

    // Build info panel
    show(itemInfo);
    itemInfo.innerHTML =
      '<div class="ii-top">' +
      '  <span class="ii-name">' + concept.name + '</span>' +
      '  <span class="ii-cat-badge">' + concept.cat + '</span>' +
      '</div>' +
      '<p class="ii-desc">' + concept.desc + '</p>' +
      '<div class="formula-box">' +
      '  <span class="fb-formula">' + concept.formula + '</span>' +
      '  <span class="fb-unit">' + concept.unit + '</span>' +
      '</div>' +
      '<div class="example-box">' +
      '  <h4>Worked Example</h4>' +
      '  <p class="ex-problem">' + concept.example.problem + '</p>' +
      concept.example.steps.map(function (s) {
        return '  <p class="ex-step"><strong>' + s + '</strong></p>';
      }).join('') +
      '</div>';

    draw();
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function startPractice() {
    practiceProblems = generateProblems();
    practiceIdx = 0;
    practiceScore = 0;
    practiceTotal = 0;
    showPracticeProblem();
  }

  function showPracticeProblem() {
    if (practiceIdx >= practiceProblems.length) {
      practiceProblems = generateProblems();
      practiceIdx = 0;
    }
    var prob = practiceProblems[practiceIdx];
    ppPrompt.textContent = prob.prompt;
    ppUnit.textContent = prob.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    hide(ppSolution);
    hide(ppNext);
    show(ppCheck);
    practiceAnswered = false;
    ppInput.focus();
  }

  function checkPractice() {
    if (practiceAnswered) return;
    var prob = practiceProblems[practiceIdx];
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) {
      ppFeedback.textContent = 'Please enter a numeric answer.';
      ppFeedback.className = 'feedback err';
      return;
    }

    practiceAnswered = true;
    practiceTotal++;
    ppInput.disabled = true;

    var tolerance = prob.tolerance || 0.05;
    var correct = false;
    if (tolerance === 0) {
      correct = Math.abs(userVal - prob.answer) < 0.5;
    } else {
      correct = Math.abs(userVal - prob.answer) / Math.max(1, Math.abs(prob.answer)) <= tolerance;
    }

    if (correct) {
      practiceScore++;
      ppFeedback.textContent = 'Correct! Answer: ' + prob.answer + ' ' + prob.unit;
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = 'Incorrect. Correct answer: ' + prob.answer + ' ' + prob.unit;
      ppFeedback.className = 'feedback err';
    }

    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;

    // Show solution
    show(ppSolution);
    ppSolution.innerHTML = '<h4>Solution</h4>' +
      prob.solution.map(function (s) { return '<p class="sol-step">' + s + '</p>'; }).join('');

    hide(ppCheck);
    show(ppNext);
  }

  function nextPractice() {
    practiceIdx++;
    showPracticeProblem();
  }

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    quizPool = generateQuizPool();
    quizQuestions = shuffleArr(quizPool).slice(0, 5);
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizLocked = false;
    hide(quizResult);
    show(quizPanel);
    show(quizBar);
    showQuizQuestion();
  }

  function showQuizQuestion() {
    if (quizIdx >= quizQuestions.length) {
      showQuizResult();
      return;
    }

    var q = quizQuestions[quizIdx];
    $('#qbar-num').textContent = quizIdx + 1;
    quizLocked = false;

    if (q.type === 'mcq') {
      quizPanel.innerHTML =
        '<p class="qp-prompt">' + q.prompt + '</p>' +
        '<div class="answer-grid">' +
        q.choices.map(function (c, i) {
          return '<button class="answer-btn" data-idx="' + i + '">' + c + '</button>';
        }).join('') +
        '</div>';

      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizLocked) return;
          quizLocked = true;
          var chosen = parseInt(btn.getAttribute('data-idx'));
          var correct = chosen === q.correct;

          // Mark buttons
          quizPanel.querySelectorAll('.answer-btn').forEach(function (b, bi) {
            b.classList.add('locked');
            if (bi === q.correct) b.classList.add('correct');
            if (bi === chosen && !correct) b.classList.add('wrong');
          });

          if (correct) quizScore++;
          quizAnswers.push({
            prompt: q.prompt,
            chosen: q.choices[chosen],
            correct: q.choices[q.correct],
            ok: correct,
            explanation: q.explanation
          });

          setTimeout(function () {
            quizIdx++;
            showQuizQuestion();
          }, 1400);
        });
      });
    } else if (q.type === 'numeric') {
      quizPanel.innerHTML =
        '<p class="qp-prompt">' + q.prompt + '</p>' +
        '<div class="quiz-input-row">' +
        '  <input class="qi-input" id="quiz-num-input" type="number" step="any" placeholder="Answer">' +
        '  <span class="qi-unit">' + q.unit + '</span>' +
        '  <button class="btn btn-primary" id="quiz-num-check">Submit</button>' +
        '</div>' +
        '<div class="quiz-feedback" id="quiz-num-feedback"></div>';

      var qInput = $('#quiz-num-input');
      var qCheck = $('#quiz-num-check');
      var qFeedback = $('#quiz-num-feedback');

      qInput.focus();

      var handleNumeric = function () {
        if (quizLocked) return;
        var val = parseFloat(qInput.value);
        if (isNaN(val)) {
          qFeedback.textContent = 'Enter a number';
          qFeedback.className = 'quiz-feedback err';
          return;
        }
        quizLocked = true;
        var tol = q.tolerance || 0.05;
        var correct;
        if (tol === 0) {
          correct = Math.abs(val - q.answer) < 0.5;
        } else {
          correct = Math.abs(val - q.answer) / Math.max(1, Math.abs(q.answer)) <= tol;
        }

        if (correct) {
          quizScore++;
          qFeedback.textContent = 'Correct! ' + q.answer + ' ' + q.unit;
          qFeedback.className = 'quiz-feedback ok';
        } else {
          qFeedback.textContent = 'Incorrect. Answer: ' + q.answer + ' ' + q.unit;
          qFeedback.className = 'quiz-feedback err';
        }

        quizAnswers.push({
          prompt: q.prompt,
          chosen: val + ' ' + q.unit,
          correct: q.answer + ' ' + q.unit,
          ok: correct,
          explanation: q.explanation
        });

        setTimeout(function () {
          quizIdx++;
          showQuizQuestion();
        }, 1800);
      };

      qCheck.addEventListener('click', handleNumeric);
      qInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleNumeric();
      });
    }
  }

  function showQuizResult() {
    hide(quizPanel);
    hide(quizBar);
    show(quizResult);

    var pct = Math.round((quizScore / 5) * 100);
    var scoreClass = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';
    var stars = '';
    for (var s = 0; s < 5; s++) {
      stars += s < quizScore ? '\u2605' : '\u2606';
    }
    var verdict = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practicing!';

    quizResult.innerHTML =
      '<div class="qr-header">' +
      '  <div class="qr-title-wrap">' +
      '    <span class="qr-title">Quiz Complete</span>' +
      '    <span class="qr-stars">' + stars + '</span>' +
      '  </div>' +
      '  <div class="qr-score-wrap">' +
      '    <span class="qr-score ' + scoreClass + '">' + quizScore + '/5</span>' +
      '    <div class="qr-verdict">' + verdict + '</div>' +
      '  </div>' +
      '</div>' +
      '<div class="qr-rows">' +
      quizAnswers.map(function (a, i) {
        return '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '">' +
          '<span class="qr-qnum">Q' + (i + 1) + '</span>' +
          '<span class="qr-detail">' + a.prompt.substring(0, 80) + (a.prompt.length > 80 ? '...' : '') +
          '<br>Your answer: <strong>' + a.chosen + '</strong>' +
          (a.ok ? '' : ' | Correct: <strong>' + a.correct + '</strong>') +
          '</span>' +
          '<span class="qr-mark">' + (a.ok ? '\u2713' : '\u2717') + '</span>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<button class="btn btn-primary" id="quiz-retry">Try Again</button>';

    $('#quiz-retry').addEventListener('click', function () {
      hide(quizResult);
      show(quizPanel);
      show(quizBar);
      startQuiz();
    });
  }

  /* ================================================================
     EVENT BINDINGS
     ================================================================ */

  // Mode tabs
  modeTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.getAttribute('data-mode'));
    });
  });

  // ── SI / Imperial unit toggle (display-only; internal state stays SI) ──
  function setUnits(newU) {
    if (newU === units) return;
    // capture calc inputs in SI (converters use the current `units`)
    var lenIds = ['lub-d', 'lub-D', 'ld-d'], siLen = {};
    lenIds.forEach(function (id) { var el = document.getElementById(id); if (el) siLen[id] = lenToSI(parseFloat(el.value) || 0); });
    var tEl = document.getElementById('lub-T'), tSI = tEl ? tempToSI(parseFloat(tEl.value) || 0) : null;
    var pEl = document.getElementById('ld-power'), pSI = pEl ? powerToSI(parseFloat(pEl.value) || 0) : null;
    units = newU;
    // write calc inputs back in the new display unit
    lenIds.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = roundN(lenToDisp(siLen[id]), isImp() ? 2 : 1); });
    if (tEl) tEl.value = Math.round(tempToDisp(tSI));
    if (pEl) pEl.value = roundN(powerToDisp(pSI), isImp() ? 1 : 1);
    // update field-label unit spans
    $$('.u-len').forEach(function (e) { e.textContent = isImp() ? 'in' : 'mm'; });
    $$('.u-temp').forEach(function (e) { e.innerHTML = isImp() ? '&deg;F' : '&deg;C'; });
    $$('.u-power').forEach(function (e) { e.textContent = isImp() ? 'hp' : 'kW'; });
    // active tab
    $$('#unit-tabs .pill').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-units') === newU); });
    // re-render everything
    updateSliderLabels();
    runFindBearing();
    if (mode === 'calc') runCalculators();
  }
  $$('#unit-tabs .pill').forEach(function (tab) {
    tab.addEventListener('click', function () { setUnits(tab.getAttribute('data-units')); });
  });

  // Slider labels (bore/Fr/Fa are unit-aware; speed/life/misalign are universal)
  function updateBoreLabel() {
    fBoreVal.textContent = (fBoreAny && fBoreAny.checked) ? 'any' : fmtLen(parseFloat(fBore.value));
  }
  function updateSliderLabels() {
    updateBoreLabel();
    fFrVal.textContent = fmtForce(parseFloat(fFr.value));
    fFaVal.textContent = fmtForce(parseFloat(fFa.value));
    fSpeedVal.textContent = fSpeed.value + ' rpm';
    fLifeVal.textContent = fLife.value + ' hrs';
    var mv = parseFloat(fMis.value);
    fMisVal.textContent = mv > 0 ? mv + '°' : 'none';
  }

  // Find-Bearing sliders — live update: canvas + badges react on every change
  fBore.addEventListener('input', function () { updateBoreLabel(); runFindBearing(); });
  if (fBoreAny) fBoreAny.addEventListener('change', function () {
    fBore.disabled = fBoreAny.checked;
    updateBoreLabel();
    runFindBearing();
  });
  fFr.addEventListener('input', function () { fFrVal.textContent = fmtForce(parseFloat(fFr.value)); runFindBearing(); });
  fFa.addEventListener('input', function () { fFaVal.textContent = fmtForce(parseFloat(fFa.value)); runFindBearing(); });
  fSpeed.addEventListener('input', function () { fSpeedVal.textContent = fSpeed.value + ' rpm'; runFindBearing(); });
  fLife.addEventListener('input', function () {
    fLifeVal.textContent = fLife.value + ' hrs';
    if (fMachine) fMachine.value = '';   // manual edit clears the machine preset
    runFindBearing();
  });
  fMis.addEventListener('input', function () {
    var mv = parseFloat(fMis.value);
    fMisVal.textContent = mv > 0 ? mv + '°' : 'none';
    runFindBearing();
  });

  // Machine-type life preset → sets the Life slider
  if (fMachine) fMachine.addEventListener('change', function () {
    var v = parseInt(fMachine.value, 10);
    if (v) { fLife.value = v; fLifeVal.textContent = v + ' hrs'; runFindBearing(); }
  });
  // SKF rating-life advanced inputs
  if (fReliability) fReliability.addEventListener('change', runFindBearing);
  if (fContam) fContam.addEventListener('change', runFindBearing);
  if (fKappa) fKappa.addEventListener('input', function () {
    var k = parseFloat(fKappa.value);
    fKappaVal.textContent = k.toFixed(1);
    var note = k < 0.4 ? 'Boundary — poor film' : k < 1 ? 'Mixed — thin film' : k < 4 ? 'Mixed / good film' : 'Full film';
    var nEl = document.getElementById('f-kappa-note');
    if (nEl) nEl.textContent = note;
    runFindBearing();
  });

  fFindBtn.addEventListener('click', function () {
    runFindBearing();
    openFindModal();
  });

  findModalClose.addEventListener('click', closeFindModal);
  findModalBackdrop.addEventListener('click', function (e) {
    if (e.target === findModalBackdrop) closeFindModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && findModalBackdrop.style.display !== 'none') closeFindModal();
  });

  // ── Calculators mode wiring ──
  ['lub-d', 'lub-D', 'lub-n', 'lub-vg', 'lub-T'].forEach(function (id) {
    var el = document.getElementById(id); if (el) el.addEventListener('input', runLubrication);
    if (el) el.addEventListener('change', runLubrication);
  });
  ['ld-power', 'ld-n', 'ld-d', 'ld-type', 'ld-factor'].forEach(function (id) {
    var el = document.getElementById(id); if (el) el.addEventListener('input', runLoadCalc);
    if (el) el.addEventListener('change', runLoadCalc);
  });
  var dcInput = document.getElementById('dc-input');
  if (dcInput) dcInput.addEventListener('input', function () { $('#dc-out').innerHTML = decodeDesignation(dcInput.value); });
  var dcQuick = document.getElementById('dc-quick');
  if (dcQuick) {
    ['6208-2RS1 C3', 'NU 210 ECP', '7208 BECBP', '22222 E', '30205', '51108'].forEach(function (ex) {
      var b = document.createElement('button'); b.className = 'dc-chip'; b.type = 'button'; b.textContent = ex;
      b.addEventListener('click', function () { dcInput.value = ex; $('#dc-out').innerHTML = decodeDesignation(ex); });
      dcQuick.appendChild(b);
    });
  }
  var lubApply = document.getElementById('lub-apply');
  if (lubApply) lubApply.addEventListener('click', function () {
    if (fKappa) { var k = clamp(lubKappa, 0.1, 4); fKappa.value = k; fKappaVal.textContent = k.toFixed(1); }
    var adv = document.getElementById('find-advanced'); if (adv) adv.open = true;
    setMode('find');
    var mt = document.querySelector('#mode-tabs .pill[data-mode="find"]');
  });
  var ldApply = document.getElementById('ld-apply');
  if (ldApply) ldApply.addEventListener('click', function () {
    if (fFr) { fFr.value = Math.min(ldFr, parseFloat(fFr.max) || ldFr); fFrVal.textContent = fFr.value + ' N'; }
    if (fFa) { fFa.value = Math.min(ldFa, parseFloat(fFa.max) || ldFa); fFaVal.textContent = fFa.value + ' N'; }
    setMode('find');
  });

  // Find-Bearing presets
  $$('#find-preset-row .preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('#find-preset-row .preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var bore = btn.getAttribute('data-fbore');
      var fr = btn.getAttribute('data-ffr');
      var fa = btn.getAttribute('data-ffa');
      var spd = btn.getAttribute('data-fspeed');
      var life = btn.getAttribute('data-flife');
      var mis = btn.getAttribute('data-fmis');

      var anyBore = (bore === '0');
      if (fBoreAny) { fBoreAny.checked = anyBore; fBore.disabled = anyBore; }
      if (!anyBore) fBore.value = bore;
      fFr.value = fr; fFa.value = fa; fSpeed.value = spd; fLife.value = life; fMis.value = mis;
      if (fMachine) fMachine.value = '';
      updateSliderLabels();

      runFindBearing();
    });
  });

  // Explore category tabs
  $$('#cat-tabs .pill').forEach(function (tab) {
    tab.addEventListener('click', function () {
      $$('#cat-tabs .pill').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      exploreCat = tab.getAttribute('data-cat');
      selectedConcept = null;
      hide(itemInfo);
      buildConceptGrid();
      draw();
    });
  });

  // Practice
  ppCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') checkPractice();
  });
  ppNext.addEventListener('click', nextPractice);

  /* ================================================================
     CANVAS RESIZE HANDLER
     ================================================================ */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCanvas();
      draw();
    }, 100);
  });

  /* ================================================================
     INIT
     ================================================================ */
  resizeCanvas();
  updateSliderLabels();
  runFindBearing();
  animRunning = true;
  requestAnimationFrame(animate);

})();
