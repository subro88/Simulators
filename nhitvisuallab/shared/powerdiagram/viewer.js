/* NHIT VisualLab — interactive thermal plant schematic.
   Scroll = zoom to cursor, drag = pan, click a component = zoom/expand it. */
window.ThermalDiagram = (function () {
  'use strict';
  var VBW = 1000, VBH = 1300;
  var MIN = 0.5, MAX = 6;

  var DEFAULT_INFO = {
    coal: 'Coal is delivered and crushed, then fed from the bunker into the furnace. About 3–4 tonnes of coal burn every minute in a large plant.',
    boiler: 'The furnace burns fuel to boil water in tubes, raising steam to high pressure and temperature (e.g. 160 bar, 540 °C) in the steam drum.',
    chimney: 'Flue gas leaves through the stack after particulate (fly-ash) and sulphur/NOx controls. The visible plume is mostly water vapour and CO₂.',
    turbine: 'High-pressure steam expands through HP then LP turbine stages, spinning the shaft at a fixed 3000 RPM (50 Hz) and driving the generator.',
    generator: 'The turbine shaft turns the generator rotor in a magnetic field, producing 3-phase AC electricity that is stepped up for the grid.',
    grid: 'A transformer and switchyard connect the plant to transmission lines that carry power to homes and industry.',
    condenser: 'Exhaust steam is condensed back to water by cooling water. This closes the Rankine cycle and lets feedwater be reused.',
    cooling: 'The cooling tower rejects waste heat to the atmosphere; the white plume is condensed water vapour, not smoke.',
    pump: 'The feed pump returns condensed water from the condenser back to the boiler at high pressure.'
  };

  function buildSVG(info) {
    function comp(id, x, y, w, h, label, extra) {
      return '<g class="pd-comp" data-id="' + id + '">' +
        '<rect class="pd-box" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' +
        (extra && extra.fill || '#ffffff') + '" stroke="#9fb2c9" stroke-width="2"/>' +
        (extra && extra.inner || '') +
        '<text class="pd-label" x="' + (x + w / 2) + '" y="' + (y + h / 2) + '" text-anchor="middle" dominant-baseline="middle">' + label + '</text>' +
        '</g>';
    }
    var s = '<svg id="pdSvg" viewBox="0 0 ' + VBW + ' ' + VBH + '" xmlns="http://www.w3.org/2000/svg">';
    s += '<defs>' +
      '<linearGradient id="gBoiler" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e8741a"/></linearGradient>' +
      '<linearGradient id="gTower" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7edf6"/><stop offset="1" stop-color="#9fb2c9"/></linearGradient>' +
      '<linearGradient id="gGen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset="1" stop-color="#ffb400"/></linearGradient>' +
      '</defs>';
    s += '<g id="pd-view">';
    // pipes first (under components)
    s += '<path class="pd-flow pd-hot" d="M280,250 C360,250 420,330 560,330"/>';           // boiler->HP turbine
    s += '<path class="pd-flow pd-cold" d="M705,420 L705,560"/>';                            // turbine->condenser
    s += '<path class="pd-flow pd-cold" d="M620,615 C520,650 440,660 390,680"/>';            // condenser->tower
    s += '<path class="pd-flow pd-cold" d="M390,860 L386,528"/>';                            // tower->pump
    s += '<path class="pd-flow pd-feed" d="M380,432 C300,430 230,470 200,505"/>';            // pump->boiler
    s += '<path d="M185,134 L185,210" stroke="#7a5a3a" stroke-width="8" fill="none" stroke-linecap="round"/>'; // coal belt
    s += '<path d="M750,360 L800,360" stroke="#555" stroke-width="6" fill="none"/>';          // turbine->generator shaft
    s += '<path d="M940,360 L905,250" stroke="#555" stroke-width="5" fill="none"/>';          // generator->tower
    s += '<path d="M905,250 L880,210 M905,250 L930,210" stroke="#555" stroke-width="4" fill="none"/>'; // tower cross
    // emissions
    s += '<g opacity="0.7" fill="#cfd8e6"><circle cx="322" cy="80" r="10"/><circle cx="338" cy="64" r="13"/><circle cx="356" cy="80" r="10"/></g>';
    // components
    s += comp('coal', 110, 70, 150, 64, 'Coal Bunker');
    s += comp('boiler', 90, 210, 190, 300, 'Boiler', { fill: 'url(#gBoiler)', inner: '<line x1="110" y1="250" x2="260" y2="250" stroke="#b35a10" stroke-width="3"/><line x1="110" y1="300" x2="260" y2="300" stroke="#b35a10" stroke-width="3"/>' });
    s += comp('chimney', 300, 90, 44, 170, 'Stack');
    s += comp('turbine', 560, 300, 190, 120, 'Turbine', { inner: '<line x1="650" y1="305" x2="650" y2="415" stroke="#9fb2c9" stroke-width="2"/><text x="605" y="460" text-anchor="middle" font-size="11" fill="#5b7089">HP / LP</text>' });
    s += comp('generator', 800, 300, 140, 120, 'Generator', { fill: 'url(#gGen)' });
    s += comp('grid', 870, 200, 70, 90, 'Grid', { inner: '<path d="M878,290 L878,210 M905,290 L905,210 M932,290 L932,210" stroke="#888" stroke-width="3"/><path d="M870,210 L940,210" stroke="#888" stroke-width="3"/>' });
    s += comp('condenser', 620, 560, 200, 110, 'Condenser', { fill: '#cfeaff', inner: '<path d="M650,600 h20 M690,600 h20 M730,600 h20 M770,600 h20" stroke="#1f7ae0" stroke-width="3"/>' });
    s += '<g class="pd-comp" data-id="cooling"><path class="pd-box" d="M300,860 L340,620 L460,620 L500,860 Z" fill="url(#gTower)" stroke="#7d92ad" stroke-width="2"/><text class="pd-label" x="400" y="745" text-anchor="middle">Cooling Tower</text></g>';
    s += '<g class="pd-comp" data-id="pump"><circle class="pd-box" cx="380" cy="480" r="46" fill="#ffb400" stroke="#caa11a" stroke-width="2"/><text class="pd-label" x="380" y="484" text-anchor="middle" font-size="13">Feed Pump</text></g>';
    s += '</g></svg>';
    return s;
  }

  function init(root, cfg) {
    cfg = cfg || {};
    var info = Object.assign({}, DEFAULT_INFO, cfg.info || {});
    root.innerHTML = '<div class="pd-root">' +
      '<div class="pd-head"><h1>' + (cfg.title || 'Thermal Power Plant — Interactive Schematic') + '</h1>' +
      '<p>Scroll to zoom into a part · drag to pan · click a component to expand it · ⛶ for full screen</p></div>' +
      '<div class="pd-toolbar">' +
      '<button class="pd-btn" id="pdOut">−</button>' +
      '<span class="pd-zoomlabel" id="pdZoom">100%</span>' +
      '<button class="pd-btn" id="pdIn">+</button>' +
      '<button class="pd-btn" id="pdReset">Reset view</button>' +
      '<span class="pd-spacer"></span>' +
      '<button class="pd-btn primary" id="pdFull">⛶ Fullscreen</button>' +
      '</div>' +
      '<div class="pd-stage" id="pdStage">' + buildSVG(info) + '</div>' +
      '<div class="pd-info" id="pdInfo"><h3>Explore the plant</h3><p>Click any component to zoom in and read what it does. Scroll anywhere to zoom toward your cursor.</p></div>' +
      '</div>';

    var stage = root.querySelector('#pdStage');
    var svg = root.querySelector('#pdSvg');
    var view = root.querySelector('#pd-view');
    var zoomLabel = root.querySelector('#pdZoom');
    var infoEl = root.querySelector('#pdInfo');
    var k = 1, tx = 0, ty = 0, tween = null;

    function apply() {
      view.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') scale(' + k + ')');
      zoomLabel.textContent = Math.round(k * 100) + '%';
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function svgPoint(clientX, clientY) {
      var r = svg.getBoundingClientRect();
      return { x: (clientX - r.left) / r.width * VBW, y: (clientY - r.top) / r.height * VBH };
    }

    // wheel zoom to cursor
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = svgPoint(e.clientX, e.clientY);
      var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      var nk = clamp(k * factor, MIN, MAX);
      tx = p.x - nk * (p.x - tx) / k;
      ty = p.y - nk * (p.y - ty) / k;
      k = nk; apply();
    }, { passive: false });

    // drag to pan
    var dragging = false, moved = false, lastX = 0, lastY = 0;
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY;
      stage.classList.add('dragging'); stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      var r = svg.getBoundingClientRect();
      tx += dx / r.width * VBW; ty += dy / r.height * VBH;
      lastX = e.clientX; lastY = e.clientY; apply();
    });
    function endDrag(e) { dragging = false; stage.classList.remove('dragging'); if (e && e.pointerId != null) try { stage.releasePointerCapture(e.pointerId); } catch (x) {} }

    // click a component -> zoom/expand + info
    stage.addEventListener('click', function (e) {
      if (moved) return;
      var g = e.target.closest('.pd-comp');
      if (!g) return;
      var id = g.getAttribute('data-id');
      var b = g.getBBox();
      var nk = clamp(Math.min(VBW * 0.55 / b.width, VBH * 0.5 / b.height), MIN, MAX);
      var ntx = VBW / 2 - nk * (b.x + b.width / 2);
      var nty = VBH / 2 - nk * (b.y + b.height / 2);
      tweenTo(nk, ntx, nty, 450);
      infoEl.innerHTML = '<h3>' + g.querySelector('text').textContent + '</h3><p>' +
        (info[id] || 'Component of the thermal power plant.') + '</p><p class="pd-hint">Scroll to zoom further · Reset view to zoom out.</p>';
    });

    function tweenTo(nk, ntx, nty, dur) {
      if (tween) cancelAnimationFrame(tween);
      var s0 = { k: k, tx: tx, ty: ty }, t0 = performance.now();
      function step(now) {
        var u = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - u, 3);
        k = s0.k + (nk - s0.k) * e; tx = s0.tx + (ntx - s0.tx) * e; ty = s0.ty + (nty - s0.ty) * e;
        apply();
        if (u < 1) tween = requestAnimationFrame(step); else tween = null;
      }
      tween = requestAnimationFrame(step);
    }

    root.querySelector('#pdIn').onclick = function () { var nk = clamp(k * 1.2, MIN, MAX); tx -= (VBW / 2 - tx) * (nk / k - 1); ty -= (VBH / 2 - ty) * (nk / k - 1); k = nk; apply(); };
    root.querySelector('#pdOut').onclick = function () { var nk = clamp(k / 1.2, MIN, MAX); tx -= (VBW / 2 - tx) * (nk / k - 1); ty -= (VBH / 2 - ty) * (nk / k - 1); k = nk; apply(); };
    root.querySelector('#pdReset').onclick = function () { tweenTo(1, 0, 0, 400); infoEl.innerHTML = '<h3>Explore the plant</h3><p>Click any component to zoom in and read what it does. Scroll anywhere to zoom toward your cursor.</p>'; };
    root.querySelector('#pdFull').onclick = function () { if (!document.fullscreenElement) stage.requestFullscreen && stage.requestFullscreen(); else document.exitFullscreen && document.exitFullscreen(); };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    apply();
  }

  return { init: init };
})();
