/* NHIT VisualLab — Power Plant operation game engine.
   Pure-ish physics + SVG schematic + game shell. Used by the
   coal/gas and nuclear plant pages via window.PG_CONFIG + PowerGame.init(). */
window.PowerGame = (function () {
  'use strict';
  const PG = {};

  PG.DAY_SECONDS = 90;   // simulated seconds per "day"
  PG.MAX_DAY = 3;

  // ---- demand curve: morning + evening peaks -----------------------------
  PG.demandMW = function (t, day) {
    const p = t / PG.DAY_SECONDS;                 // 0..1 within the day
    const morning = Math.exp(-Math.pow((p - 0.33) / 0.12, 2));
    const evening = Math.exp(-Math.pow((p - 0.80) / 0.10, 2));
    const f = 0.42 + 0.58 * Math.max(morning, evening);
    const scale = 0.82 + 0.10 * day;
    return Math.round((200 + 640 * f) * scale);
  };

  PG.newState = function () {
    return {
      t: 0, day: 1, score: 0, out: 0, demand: 0,
      boiler: 0, turbine: 0, reactor: 0, rods: 0, coolant: 0,
      P: 16, Tc: 55, Tcore: 300, Ps: 12,
      trip: false, scram: false, tripMsg: '', matched: false, fuel: 0
    };
  };
  PG.newInputs = function (cfg) {
    const inp = {};
    cfg.controls.forEach(c => { inp[c.id] = c.val; });
    return inp;
  };

  // ---- physics integration ------------------------------------------------
  PG.step = function (cfg, st, inp, dt) {
    if (cfg.mode === 'nuclear') {
      // control rods (withdrawal %) drive core power
      if (st.scram) st.reactor += (0 - st.reactor) * Math.min(1, 1.3 * dt);
      else st.reactor += (inp.rods - st.reactor) * Math.min(1, 1.2 * dt);
      const TcoreSet = 280 + st.reactor * 4.0;             // up to ~680 C
      st.Tcore += (TcoreSet - st.Tcore) * Math.min(1, 0.4 * dt);
      st.coolant = inp.coolant;
      const PsSet = 4 + (st.Tcore - 280) / 400 * 30;       // secondary pressure
      st.Ps += (PsSet - st.Ps) * Math.min(1, 0.7 * dt);
      const TcSet = 30 + (100 - st.coolant) * 0.35 + (st.out / cfg.capacityMW) * 15;
      st.Tc += (TcSet - st.Tc) * Math.min(1, 0.5 * dt);
      st.turbine = inp.turbine;
      const drive = 0.5 * Math.min(st.Ps / 16, 1.3) * Math.min(st.Tc / 55, 1.3);
      st.out = Math.min(cfg.capacityMW, cfg.capacityMW * (st.turbine / 100) * drive);
      st.fuel = st.reactor * 0.9 + st.Tcore * 0.02;
      if (st.Tcore > 700 || st.Ps > 40 || st.Tc > 92) { st.scram = true; st.tripMsg = 'SCRAM — reactor protection trip!'; }
      if (st.scram && st.reactor < 12 && st.Tcore < 360) st.scram = false;
    } else {
      // thermal: boiler firing % drives pressure & steam temp
      if (st.trip) st.boiler += (0 - st.boiler) * Math.min(1, 1.6 * dt);
      else st.boiler += (inp.boiler - st.boiler) * Math.min(1, 2 * dt);
      const Pset = 8 + st.boiler * 0.34;                   // 8..42 bar
      st.P += (Pset - st.P) * Math.min(1, 0.8 * dt);
      const TcSet = 30 + st.boiler * 0.7;                  // 30..100 C
      st.Tc += (TcSet - st.Tc) * Math.min(1, 0.6 * dt);
      st.turbine = inp.turbine;
      const drive = 0.5 * Math.min(st.P / 18, 1.3) * Math.min(st.Tc / 55, 1.3);
      st.out = Math.min(cfg.capacityMW, cfg.capacityMW * (st.turbine / 100) * drive);
      st.fuel = st.boiler * cfg.fuelRate * (0.5 + 0.5 * st.turbine / 100);
      if (st.P > 38 || st.Tc > 92) { st.trip = true; st.tripMsg = 'Boiler trip — over-pressure / over-temperature!'; }
      if (st.trip && st.boiler < 28 && st.P < 30) st.trip = false;
    }

    st.demand = PG.demandMW(st.t, st.day);
    const err = st.out - st.demand;
    st.matched = Math.abs(err) < st.demand * 0.06;
    if (st.matched) st.score += 12 * dt;
    else st.score -= Math.min(9, Math.abs(err) / st.demand * 22) * dt;
    if (st.score < 0) st.score = 0;

    st.t += dt;
    if (st.t >= PG.DAY_SECONDS) { st.t -= PG.DAY_SECONDS; st.day++; }
  };

  // ---- tiny DOM helper ----------------------------------------------------
  function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  // ---- SVG schematic builders --------------------------------------------
  function gradDefs() {
    return `<defs>
      <linearGradient id="gBoiler" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e8741a"/></linearGradient>
      <linearGradient id="gReactor" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff7a59"/><stop offset="1" stop-color="#c0182b"/></linearGradient>
      <linearGradient id="gSG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bff3ec"/><stop offset="1" stop-color="#16b6a6"/></linearGradient>
      <linearGradient id="gCond" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfeaff"/><stop offset="1" stop-color="#1f7ae0"/></linearGradient>
      <linearGradient id="gTower" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e7edf6"/><stop offset="1" stop-color="#9fb2c9"/></linearGradient>
      <radialGradient id="gGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#fff2b0"/><stop offset="1" stop-color="#ff8c1a" stop-opacity="0"/></radialGradient>
    </defs>`;
  }

  function pipe(id, d, color, flow) {
    return `<path id="${id}" class="pg-pipe" data-flow="${flow}" d="${d}"
      fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="2 16"/>`;
  }

  function fanIcon(x, y, scale, fill) {
    let blades = '';
    for (let i = 0; i < 6; i++) {
      const a = (i * 60) * Math.PI / 180;
      const x1 = x + Math.cos(a) * 6 * scale, y1 = y + Math.sin(a) * 6 * scale;
      const x2 = x + Math.cos(a + 0.5) * 22 * scale, y2 = y + Math.sin(a + 0.5) * 22 * scale;
      const x3 = x + Math.cos(a + 0.18) * 22 * scale, y3 = y + Math.sin(a + 0.18) * 22 * scale;
      blades += `<path d="M${x1},${y1} L${x2},${y2} L${x3},${y3} Z" fill="${fill}" opacity="0.92"/>`;
    }
    return `<g id="turbine-rot"><circle cx="${x}" cy="${y}" r="${24 * scale}" fill="#cfd8e6"/>
      ${blades}<circle cx="${x}" cy="${y}" r="${5 * scale}" fill="#5b7089"/></g>`;
  }

  function boltIcon(x, y, scale) {
    return `<g id="gen-spark"><rect x="${x - 34 * scale}" y="${y - 26 * scale}" width="${68 * scale}" height="${52 * scale}" rx="6" fill="#ffd54a" stroke="#caa11a" stroke-width="2"/>
      <path d="M${x - 6 * scale},${y - 18 * scale} L${x - 16 * scale},${y + 4 * scale} L${x - 2 * scale},${y + 4 * scale} L${x - 8 * scale},${y + 20 * scale} L${x + 14 * scale},${y - 6 * scale} L${x + 2 * scale},${y - 6 * scale} Z" fill="#7a5a00"/></g>`;
  }

  function buildThermal() {
    const s = `<svg id="pgSvg" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg">
      ${gradDefs()}
      <!-- Boiler -->
      <rect x="60" y="150" width="140" height="190" rx="14" fill="url(#gBoiler)" stroke="#b35a10" stroke-width="3"/>
      <rect id="boiler-fire" x="80" y="300" width="100" height="30" rx="8" fill="url(#gGlow)"/>
      <text x="130" y="140" text-anchor="middle" fill="#17324d" font-weight="700">Boiler</text>
      <!-- coal belt -->
      <rect x="60" y="120" width="140" height="20" rx="6" fill="#5b7089"/>
      <g id="coal-lumps" fill="#2b2b2b">
        <rect x="74" y="122" width="14" height="12" rx="3"/><rect x="104" y="122" width="14" height="12" rx="3"/>
        <rect x="134" y="122" width="14" height="12" rx="3"/><rect x="164" y="122" width="14" height="12" rx="3"/></g>
      <!-- steam pipe boiler -> turbine -->
      ${pipe('p_steam', 'M200,200 C300,200 360,110 500,110 L640,110', '#e8741a', 'main')}
      <!-- Turbine -->
      ${fanIcon(560, 200, 1, '#1f7ae0')}
      <text x="560" y="250" text-anchor="middle" fill="#17324d" font-weight="700">Turbine</text>
      <!-- Generator -->
      ${boltIcon(720, 200, 1)}
      <text x="720" y="250" text-anchor="middle" fill="#17324d" font-weight="700">Generator</text>
      <!-- transmission -->
      <path d="M760,200 L860,200 L860,150" stroke="#888" stroke-width="5" fill="none"/>
      <path d="M850,150 L905,110 M865,150 L905,110" stroke="#888" stroke-width="3" fill="none"/>
      <text x="878" y="100" text-anchor="middle" fill="#17324d" font-size="12">Grid</text>
      <!-- exhaust steam turbine -> condenser -->
      ${pipe('p_exh', 'M660,215 C720,250 720,300 740,330', '#1f7ae0', 'main')}
      <!-- Condenser -->
      <rect x="700" y="330" width="150" height="80" rx="10" fill="url(#gCond)" stroke="#1f7ae0" stroke-width="2"/>
      <g id="cond-chev" fill="#fff" opacity="0.85">
        <path d="M725,360 l12,8 l-12,8 l4,-8 z"/><path d="M760,360 l12,8 l-12,8 l4,-8 z"/><path d="M795,360 l12,8 l-12,8 l4,-8 z"/></g>
      <text x="775" y="432" text-anchor="middle" fill="#17324d" font-weight="700">Condenser</text>
      <!-- cooling water condenser -> tower -->
      ${pipe('p_cw1', 'M850,370 C900,380 900,430 760,470', '#34a0f0', 'cool')}
      <!-- cooling tower -->
      <path d="M600,520 L640,400 L720,400 L760,520 Z" fill="url(#gTower)" stroke="#7d92ad" stroke-width="2"/>
      <g id="ct-puff" fill="#dfe7f2" opacity="0.8">
        <circle cx="670" cy="390" r="10"/><circle cx="700" cy="378" r="12"/><circle cx="730" cy="390" r="10"/></g>
      <text x="680" y="545" text-anchor="middle" fill="#17324d" font-weight="700">Cooling Tower</text>
      <!-- tower -> pump -->
      ${pipe('p_cw2', 'M620,500 C520,500 420,470 350,440', '#34a0f0', 'cool')}
      <!-- feed pump -->
      <circle cx="320" cy="420" r="26" fill="#ffb400" stroke="#caa11a" stroke-width="3"/>
      <g id="pump-rot"><path d="M320,420 l0,-18 M320,420 l16,9 M320,420 l-16,9" stroke="#7a5a00" stroke-width="4"/></g>
      <text x="320" y="468" text-anchor="middle" fill="#17324d" font-weight="700">Feed Pump</text>
      <!-- feedwater pump -> boiler -->
      ${pipe('p_feed', 'M300,400 C240,380 220,300 200,300', '#16b6a6', 'feed')}
    </svg>`;
    return s;
  }

  function buildNuclear() {
    let s = `<svg id="pgSvg" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">${gradDefs()}`;
    // Reactor
    s += `<rect x="60" y="220" width="120" height="180" rx="20" fill="url(#gReactor)" stroke="#8c1020" stroke-width="3"/>
      <circle id="core-glow" cx="120" cy="310" r="46" fill="url(#gGlow)"/>
      <g id="rods" fill="#34404f"><rect x="92" y="200" width="10" height="40"/><rect x="114" y="200" width="10" height="40"/><rect x="136" y="200" width="10" height="40"/></g>
      <text x="120" y="210" text-anchor="middle" fill="#fff" font-weight="700">Reactor</text>`;
    // three SG loops
    const ys = [140, 300, 460];
    for (let i = 0; i < 3; i++) {
      const y = ys[i];
      const sgx = 360, px = 250;
      s += `<!-- loop ${i + 1} -->
        ${pipe('p_pri' + i, `M180,${y - 20} C230,${y - 20} 230,${y} ${px},${y}`, '#e23b3b', 'pri')}
        <circle cx="${px}" cy="${y}" r="22" fill="#ffb400" stroke="#caa11a" stroke-width="3"/>
        <g id="pump${i}-rot"><path d="M${px},${y} l0,-15 M${px},${y} l13,8 M${px},${y} l-13,8" stroke="#7a5a00" stroke-width="3"/></g>
        ${pipe('p_pri' + i + 'b', `M${px},${y + 22} C300,${y + 60} 320,${y + 40} ${sgx - 20},${y + 30}`, '#e23b3b', 'pri')}
        <rect x="${sgx}" y="${y - 28}" width="60" height="90" rx="12" fill="url(#gSG)" stroke="#0e8f82" stroke-width="2"/>
        <text x="${sgx + 30}" y="${y + 4}" text-anchor="middle" fill="#0c5b53" font-size="11" font-weight="700">SG${i + 1}</text>
        ${pipe('p_sec' + i, `M${sgx + 60},${y - 6} C460,${y - 6} 470,300 560,300`, '#16b6a6', 'sec')}`;
    }
    // steam header
    s += `<rect x="560" y="150" width="14" height="300" rx="6" fill="#16b6a6"/>`;
    // turbine + generator (right)
    s += fanIcon(700, 300, 1.1, '#1f7ae0');
    s += `<text x="700" y="352" text-anchor="middle" fill="#17324d" font-weight="700">Turbine</text>`;
    s += boltIcon(860, 300, 1.05);
    s += `<text x="860" y="352" text-anchor="middle" fill="#17324d" font-weight="700">Generator</text>`;
    s += `<path d="M900,300 L960,300 L960,250" stroke="#888" stroke-width="5" fill="none"/>
      <path d="M950,250 L985,215 M962,250 L985,215" stroke="#888" stroke-width="3" fill="none"/>
      <text x="972" y="205" text-anchor="middle" fill="#17324d" font-size="12">Grid</text>`;
    // exhaust -> condenser
    s += pipe('p_exh', 'M800,318 C840,360 840,400 820,420', '#1f7ae0', 'main');
    // condenser
    s += `<rect x="770" y="420" width="150" height="80" rx="10" fill="url(#gCond)" stroke="#1f7ae0" stroke-width="2"/>
      <g id="cond-chev" fill="#fff" opacity="0.85"><path d="M795,450 l12,8 l-12,8 l4,-8 z"/><path d="M830,450 l12,8 l-12,8 l4,-8 z"/><path d="M865,450 l12,8 l-12,8 l4,-8 z"/></g>
      <text x="845" y="522" text-anchor="middle" fill="#17324d" font-weight="700">Condenser</text>`;
    // cooling tower + pump + feeds
    s += pipe('p_cw1', 'M920,460 C960,470 960,520 840,540', '#34a0f0', 'cool');
    s += `<path d="M740,580 L770,470 L840,470 L870,580 Z" fill="url(#gTower)" stroke="#7d92ad" stroke-width="2"/>
      <g id="ct-puff" fill="#dfe7f2" opacity="0.8"><circle cx="775" cy="460" r="9"/><circle cx="805" cy="448" r="11"/><circle cx="835" cy="460" r="9"/></g>
      <text x="805" y="600" text-anchor="middle" fill="#17324d" font-weight="700">Cooling Tower</text>`;
    s += pipe('p_cw2', 'M755,560 C660,560 560,540 500,500', '#34a0f0', 'cool');
    s += `<circle cx="470" cy="480" r="24" fill="#ffb400" stroke="#caa11a" stroke-width="3"/>
      <g id="pump-rot"><path d="M470,480 l0,-16 M470,480 l14,8 M470,480 l-14,8" stroke="#7a5a00" stroke-width="4"/></g>
      <text x="470" y="524" text-anchor="middle" fill="#17324d" font-weight="700">Pump</text>`;
    s += pipe('p_feed', 'M450,470 C400,460 320,440 250,300', '#16b6a6', 'feed');
    s += `</svg>`;
    return s;
  }

  // ---- main init -----------------------------------------------------------
  PG.init = function (root, cfg) {
    root.innerHTML = `
      <div class="pg-root">
        <div class="pg-head"><h1>${cfg.title}</h1><p>${cfg.intro || ''}</p></div>
        <div class="pg-status">
          <div class="pg-stat"><div class="l">Day</div><div class="v" id="st-day">1 / ${PG.MAX_DAY}</div></div>
          <div class="pg-stat"><div class="l">Clock</div><div class="v" id="st-clock">06:00</div></div>
          <div class="pg-stat"><div class="l">Score</div><div class="v" id="st-score">0</div></div>
          <div class="pg-stat"><div class="l">Demand</div><div class="v" id="st-demand">0 <small>MW</small></div></div>
          <div class="pg-stat"><div class="l">Output</div><div class="v" id="st-out">0 <small>MW</small></div></div>
          <div class="pg-stat"><div class="l">Match</div><div class="v pg-target"><span class="pg-dot" id="st-dot"></span><span id="st-match">—</span></div></div>
        </div>
        <div class="pg-screen">
          ${cfg.mode === 'nuclear' ? buildNuclear() : buildThermal()}
          <canvas class="pg-graph" id="pgGraph" width="1000" height="130"></canvas>
          <div class="pg-alert" id="pgAlert"></div>
        </div>
        <div class="pg-controls" id="pgControls"></div>
        <div class="pg-gauges" id="pgGauges"></div>
        <div class="pg-fact" id="pgFact"></div>
        <div class="pg-bar">
          <button class="pg-btn" id="pgStart">▶ Start</button>
          <button class="pg-btn ghost" id="pgReset">↻ Reset</button>
          <button class="pg-btn ghost" id="pgFull">⛶ Fullscreen</button>
        </div>
      </div>`;

    const $ = id => root.querySelector(id);
    // build controls
    const ctrlWrap = $('#pgControls');
    cfg.controls.forEach(c => {
      const wrap = h(`<div class="pg-ctrl">
        <label>${c.label}<span class="val" id="cv-${c.id}">${c.val}${c.unit || ''}</span></label>
        <input type="range" id="ci-${c.id}" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${c.val}"></div>`);
      const input = wrap.querySelector('input');
      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        wrap.querySelector('#cv-' + c.id).textContent = v + (c.unit || '');
        st0_inputs[c.id] = v;
      });
      ctrlWrap.appendChild(wrap);
    });
    // build gauges
    const gWrap = $('#pgGauges');
    cfg.gauges.forEach(g => {
      gWrap.appendChild(h(`<div class="pg-gauge" id="g-${g.id}">
        <div class="g-label">${g.label}</div>
        <div class="g-val" id="gv-${g.id}">0<small> ${g.unit}</small></div>
        <div class="g-bar"><div class="g-fill" id="gf-${g.id}"></div></div></div>`));
    });

    let st = PG.newState();
    let st0_inputs = PG.newInputs(cfg);
    let running = false;
    let phase = 'intro';
    let last = 0;
    const history = [];
    let factIdx = 0;
    let dash = 0;
    let turbAngle = 0, pumpAngle = 0, puffY = 0;

    const alertEl = $('#pgAlert');
    function showAlert(msg, cls) {
      if (!msg) { alertEl.className = 'pg-alert'; return; }
      alertEl.className = 'pg-alert show ' + (cls || '');
      alertEl.textContent = msg;
    }

    // ---- overlays ----
    function overlay(html) {
      let o = root.querySelector('.pg-overlay');
      if (!o) { o = h('<div class="pg-overlay"></div>'); root.appendChild(o); }
      o.className = 'pg-overlay'; o.innerHTML = `<div class="pg-card">${html}</div>`;
      return o;
    }
    function hideOverlay() { const o = root.querySelector('.pg-overlay'); if (o) o.className = 'pg-overlay hidden'; }

    function introOverlay() {
      phase = 'intro';
      const how = (cfg.howto || []).map(x => `<li>${x}</li>`).join('');
      const o = overlay(`<h2>${cfg.title}</h2>
        <p class="pg-lead">${cfg.intro || ''}</p>
        <p><b>How to play</b></p><ol>${how}</ol>
        <div class="pg-bar"><button class="pg-btn" id="pgGo">Start shift ▶</button></div>`);
      o.querySelector('#pgGo').onclick = () => { hideOverlay(); running = true; phase = 'play'; last = performance.now(); requestAnimationFrame(loop); };
    }

    function dayEndOverlay() {
      phase = 'dayend';
      const o = overlay(`<h2>End of Day ${st.day - 1}</h2>
        <p class="pg-lead">Grid demand kept the control room busy. Current score: <b>${Math.round(st.score)}</b>.</p>
        <div class="pg-bar"><button class="pg-btn" id="pgNext">Continue to Day ${st.day} ▶</button></div>`);
      o.querySelector('#pgNext').onclick = () => { hideOverlay(); running = true; phase = 'play'; last = performance.now(); requestAnimationFrame(loop); };
    }

    function quizOverlay() {
      phase = 'quiz';
      let qi = 0, correct = 0;
      function render() {
        const q = cfg.quiz[qi];
        const opts = q.opts.map((o, i) => `<button class="pg-opt" data-i="${i}">${o}</button>`).join('');
        const o = overlay(`<h2>Brain Challenge</h2>
          <p class="pg-lead">Question ${qi + 1} of ${cfg.quiz.length}</p>
          <div class="pg-quiz-q">${q.q}</div>${opts}
          <div class="pg-why" id="pgWhy" style="display:none"></div>
          <div class="pg-bar"><button class="pg-btn" id="pgNext" style="display:none">Next ▶</button></div>`);
        const optEls = o.querySelectorAll('.pg-opt');
        optEls.forEach(b => b.onclick = () => {
          const i = +b.dataset.i;
          optEls.forEach(x => x.disabled = true);
          if (i === q.a) { b.classList.add('correct'); correct++; }
          else { b.classList.add('wrong'); optEls[q.a].classList.add('correct'); }
          o.querySelector('#pgWhy').style.display = '';
          o.querySelector('#pgWhy').textContent = q.why;
          o.querySelector('#pgNext').style.display = '';
        });
        o.querySelector('#pgNext').onclick = () => {
          qi++;
          if (qi < cfg.quiz.length) render();
          else finalOverlay(correct);
        };
      }
      render();
    }

    function finalOverlay(correct) {
      phase = 'done';
      const best = Math.max(Math.round(st.score), +(localStorage.getItem('pg-best-' + cfg.slug) || 0));
      localStorage.setItem('pg-best-' + cfg.slug, best);
      const pct = Math.round(correct / cfg.quiz.length * 100);
      const badge = pct >= 80 ? '🏆 Plant Master' : pct >= 50 ? '🔧 Competent Operator' : '🌱 Trainee';
      const o = overlay(`<div class="pg-badge">${badge}</div>
        <div class="pg-score-final">${Math.round(st.score)}</div>
        <p class="pg-lead" style="text-align:center">Final score · Best ${best} · Quiz ${correct}/${cfg.quiz.length}</p>
        <p style="text-align:center">${cfg.outro || ''}</p>
        <div class="pg-bar"><button class="pg-btn" id="pgAgain">Play again ↻</button></div>`);
      o.querySelector('#pgAgain').onclick = () => { reset(); hideOverlay(); running = true; phase = 'play'; last = performance.now(); requestAnimationFrame(loop); };
    }

    function reset() {
      st = PG.newState(); st0_inputs = PG.newInputs(cfg);
      cfg.controls.forEach(c => { const i = root.querySelector('#ci-' + c.id); if (i) i.value = c.val; root.querySelector('#cv-' + c.id).textContent = c.val + (c.unit || ''); });
      history.length = 0; running = false;
    }

    // ---- graph ----
    const cv = $('#pgGraph'); const ctx = cv.getContext('2d');
    function drawGraph() {
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H);
      const max = cfg.capacityMW * 1.15;
      const y = v => H - 8 - (v / max) * (H - 16);
      ctx.strokeStyle = '#22304a'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { const yy = (H / 4) * i; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      const n = history.length; if (n < 2) return;
      const plot = (key, color) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * W; const yy = y(history[i][key]); i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
        ctx.stroke();
      };
      plot('demand', '#ffb400'); plot('out', '#18a957');
    }

    // ---- main loop ----
    function loop(now) {
      if (!running) return;
      let dt = (now - last) / 1000; last = now;
      if (dt > 0.1) dt = 0.1;
      const wasDay = st.day;
      PG.step(cfg, st, st0_inputs, dt);
      history.push({ demand: st.demand, out: st.out });
      if (history.length > 320) history.shift();

      // update status
      $('#st-day').textContent = Math.min(st.day, PG.MAX_DAY) + ' / ' + PG.MAX_DAY;
      const frac = st.t / PG.DAY_SECONDS;
      const hh = String(6 + Math.floor(frac * 24)).padStart(2, '0');
      const mm = String(Math.floor((frac * 24 % 1) * 60)).padStart(2, '0');
      $('#st-clock').textContent = hh + ':' + mm;
      $('#st-score').textContent = Math.round(st.score);
      $('#st-demand').innerHTML = st.demand + ' <small>MW</small>';
      $('#st-out').innerHTML = Math.round(st.out) + ' <small>MW</small>';
      const dot = $('#st-dot'); dot.className = 'pg-dot ' + (st.matched ? 'ok' : (st.out < st.demand * 0.9 ? 'low' : 'hi'));
      $('#st-match').textContent = st.matched ? 'MATCH' : (st.out < st.demand * 0.9 ? 'LOW' : 'HIGH');

      // gauges
      cfg.gauges.forEach(g => {
        const v = g.value(st, st0_inputs);
        $('#gv-' + g.id).innerHTML = (g.dec ? v.toFixed(g.dec) : Math.round(v)) + '<small> ' + g.unit + '</small>';
        const pct = Math.max(0, Math.min(100, v / g.max * 100));
        const fill = $('#gf-' + g.id); fill.style.width = pct + '%';
        const gw = $('#g-' + g.id);
        gw.className = 'pg-gauge' + (g.badAt && v >= g.badAt ? ' bad' : g.warnAt && v >= g.warnAt ? ' warn' : '');
      });

      // alert
      if (st.trip || st.scram) showAlert(st.tripMsg, 'warn');
      else if (!st.matched) showAlert(st.out < st.demand * 0.9 ? 'Under-generating — the grid needs more power!' : 'Over-generating — throttle back to save fuel!', st.out > st.demand * 1.1 ? 'warn' : '');
      else showAlert('', '');

      // svg animations
      dash = (dash + dt * 60) % 1000;
      const flowSpeed = st.out / cfg.capacityMW;
      root.querySelectorAll('.pg-pipe').forEach(p => {
        const f = p.getAttribute('data-flow');
        let sp = flowSpeed;
        if (f === 'cool') sp = (cfg.mode === 'nuclear' ? st.coolant : st.boiler) / 100;
        if (f === 'feed') sp = (cfg.mode === 'nuclear' ? st.coolant : st.boiler) / 100;
        if (f === 'pri') sp = st.reactor / 100;
        if (f === 'sec') sp = flowSpeed;
        p.style.strokeDashoffset = String(-dash * (0.4 + sp));
        p.style.opacity = String(0.35 + 0.6 * Math.min(1, sp));
      });
      // turbine + pump spin
      turbAngle = (turbAngle + dt * 240 * flowSpeed) % 360;
      const tc = cfg.mode === 'nuclear' ? '700 300' : '560 200';
      const tr = root.querySelector('#turbine-rot'); if (tr) tr.setAttribute('transform', `rotate(${turbAngle} ${tc})`);
      const pumpSpd = (cfg.mode === 'nuclear' ? st.coolant : st.boiler) / 100;
      pumpAngle = (pumpAngle + dt * 200 * pumpSpd) % 360;
      const pr = root.querySelector('#pump-rot'); if (pr) pr.setAttribute('transform', `rotate(${pumpAngle} 320 420)`);
      [140, 300, 460].forEach((y, i) => { const pr2 = root.querySelector('#pump' + i + '-rot'); if (pr2) pr2.setAttribute('transform', `rotate(${pumpAngle} 250 ${y})`); });
      // generator spark flicker
      const gs = root.querySelector('#gen-spark'); if (gs) gs.style.opacity = String(0.4 + 0.6 * Math.abs(Math.sin(now / 120)) * Math.min(1, flowSpeed * 1.4));
      // core glow (nuclear)
      const cg = root.querySelector('#core-glow'); if (cg) cg.setAttribute('r', String(30 + 22 * (st.reactor / 100)));
      // cooling tower puffs
      puffY = (puffY + dt * 30) % 30;
      const puff = root.querySelector('#ct-puff'); if (puff) puff.setAttribute('transform', `translate(0 ${-puffY})`);
      // boiler fire flicker
      const bf = root.querySelector('#boiler-fire'); if (bf) bf.style.opacity = String(0.5 + 0.5 * Math.abs(Math.sin(now / 90)) * Math.min(1, st.boiler / 100));

      drawGraph();

      // phase transitions
      if (st.day > wasDay) {
        if (st.day > PG.MAX_DAY) { running = false; quizOverlay(); return; }
        else { running = false; dayEndOverlay(); return; }
      }
      requestAnimationFrame(loop);
    }

    // facts rotator
    if (cfg.facts && cfg.facts.length) {
      const fe = $('#pgFact');
      function tickFact() { fe.innerHTML = '<b>Did you know?</b> ' + cfg.facts[factIdx % cfg.facts.length]; factIdx++; }
      tickFact(); setInterval(tickFact, 6000);
    }

    // buttons
    $('#pgStart').onclick = () => {
      if (phase === 'intro') { introOverlay(); return; }
      running = !running; last = performance.now();
      $('#pgStart').textContent = running ? '⏸ Pause' : '▶ Start';
      if (running) requestAnimationFrame(loop);
    };
    $('#pgReset').onclick = () => { reset(); $('#pgStart').textContent = '▶ Start'; };
    $('#pgFull').onclick = () => { const r = root.querySelector('.pg-root'); if (!document.fullscreenElement) r.requestFullscreen && r.requestFullscreen(); else document.exitFullscreen && document.exitFullscreen(); };

    introOverlay();
  };

  return PG;
})();
