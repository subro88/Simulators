// NHIT VisualLab — overlay sidebar with categorised simulations.
// Self-contained: injects its own CSS and builds the DOM from SIDEBAR_DATA.
(function () {
  var SIDEBAR_DATA = [{"name": "🧪 Virtual Lab Testing", "tools": [{"slug": "utm-testing", "title": "UTM Virtual Lab"}, {"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "fatigue-testing", "title": "Fatigue Testing Virtual Lab"}, {"slug": "torsion-testing", "title": "Torsion Test Virtual Lab"}, {"slug": "litmus-test", "title": "Litmus Paper Test — Colour Chart & Virtual Lab"}, {"slug": "pneumatic-circuit", "title": "Pneumatic Circuit Simulator"}, {"slug": "electro-pneumatic-circuit", "title": "Electro-Pneumatic Circuit Simulator"}, {"slug": "ray-optics", "title": "Ray Optics Simulator & Trainer"}, {"slug": "refraction", "title": "Refraction of Light Simulator — Snell’s Law, Critical Angle & Prisms"}, {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test Simulator"}, {"slug": "centrifugal-pump", "title": "Centrifugal Pump Test Rig Simulator"}, {"slug": "hydraulic-turbine", "title": "Hydraulic Turbine Test Rig Simulator"}]}, {"name": "Measuring Instruments", "tools": [{"slug": "vernier-caliper", "title": "Vernier Caliper Simulator"}, {"slug": "screw-gauge", "title": "Screw Gauge Simulator"}, {"slug": "height-gauge", "title": "Vernier Height Gauge Simulator"}, {"slug": "dial-gauge", "title": "Dial Gauge Simulator"}, {"slug": "steel-ruler", "title": "Steel Ruler Simulator"}, {"slug": "bevel-protractor", "title": "Bevel Protractor — Least Count & Vernier Reading"}, {"slug": "protractor", "title": "Online Protractor Simulator"}, {"slug": "pressure-gauge", "title": "Pressure Gauge Simulator"}]}, {"name": "Mechanics & Motion", "tools": [{"slug": "newtons-laws", "title": "Newton’s Laws of Motion"}, {"slug": "projectile-motion", "title": "Projectile Motion Calculator & Simulator"}, {"slug": "free-fall", "title": "Free Fall Simulator"}, {"slug": "friction", "title": "Friction & Contact Forces Simulator"}, {"slug": "hookes-law", "title": "Hooke’s Law Simulator"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "vibrations", "title": "Spring-Mass-Damper Simulator"}, {"slug": "torque-rotation", "title": "Torque & Rotational Motion Simulator"}, {"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "gyroscope", "title": "Gyroscope Simulator"}, {"slug": "simple-machines", "title": "Simple Machines Simulator"}, {"slug": "buoyancy", "title": "Buoyancy & Archimedes’ Principle Simulator"}, {"slug": "collision-momentum", "title": "Collision & Momentum Simulator — Elastic, Inelastic & 2D Collisions"}, {"slug": "simple-pendulum", "title": "Simple Pendulum Simulator"}, {"slug": "free-body-diagram", "title": "Free Body Diagram & Force Resolver"}, {"slug": "escape-velocity", "title": "Escape Velocity Simulator"}, {"slug": "bearing-life", "title": "Bearing Life Calculator"}, {"slug": "gear-strength", "title": "Gear Strength Calculator"}, {"slug": "hydraulic-cylinder", "title": "Hydraulic Cylinder Simulator"}]}, {"name": "Mechanisms & Machines", "tools": [{"slug": "four-bar-linkage", "title": "Four-Bar Linkage Simulator"}, {"slug": "slider-crank", "title": "Slider-Crank Mechanism"}, {"slug": "cam-follower", "title": "Cam & Follower Mechanism"}, {"slug": "gear-trains", "title": "Gear Train Calculator"}, {"slug": "belt-drive", "title": "Belt & Chain Drive"}, {"slug": "scotch-yoke", "title": "Scotch Yoke Mechanism"}, {"slug": "geneva-mechanism", "title": "Geneva Mechanism Animation & Simulator"}, {"slug": "centrifugal-governor", "title": "Centrifugal Governor Simulator"}, {"slug": "flywheel", "title": "Flywheel Energy Storage"}, {"slug": "bearing-selection", "title": "Bearing Selection Calculator"}, {"slug": "governor", "title": "Governor Mechanism Simulator"}, {"slug": "flywheel-energy", "title": "Flywheel Energy Calculator"}]}, {"name": "Strength of Materials", "tools": [{"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "hookes-law", "title": "Hooke’s Law Simulator"}, {"slug": "utm-testing", "title": "UTM Virtual Lab"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "fatigue-testing", "title": "Fatigue Testing Virtual Lab"}, {"slug": "mohrs-circle", "title": "Mohr's Circle Calculator"}, {"slug": "stress-concentration", "title": "Stress Concentration Factor (Kt) Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "beam-bending", "title": "Beam Bending Simulator — SFD, BMD & Deflection"}, {"slug": "truss-analysis", "title": "Truss Analysis — Method of Joints"}, {"slug": "shaft-torsion", "title": "Shaft Torsion Calculator"}, {"slug": "column-buckling", "title": "Column Buckling Calculator"}, {"slug": "pressure-vessel", "title": "Hoop Stress Calculator — Thin-Walled Pressure Vessel"}, {"slug": "spring-design", "title": "Spring Design Calculator"}, {"slug": "bolted-joint", "title": "Bolt Torque & Preload Calculator"}, {"slug": "riveted-joints", "title": "Types of Riveted Joints"}, {"slug": "rivet-joint-designer", "title": "Rivet Joint Design & Failure Mode Simulator"}, {"slug": "torsion-testing", "title": "Torsion Test Virtual Lab"}, {"slug": "power-screw", "title": "Power Screw Calculator"}, {"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "crack-propagation", "title": "Crack Propagation & Critical Crack Length"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}]}, {"name": "Thermal & Fluid Engineering", "tools": [{"slug": "thermodynamics", "title": "Thermodynamic Cycles Simulator"}, {"slug": "ideal-gas-law", "title": "Ideal Gas Law Calculator & Simulator"}, {"slug": "boyles-law", "title": "Boyle's Law Simulator"}, {"slug": "charles-law", "title": "Charles' Law Simulator"}, {"slug": "heat-transfer", "title": "Heat Transfer Calculator — Conduction, Convection & Radiation"}, {"slug": "heat-exchanger", "title": "LMTD & NTU Heat Exchanger Calculator"}, {"slug": "bernoullis-principle", "title": "Bernoulli’s Principle Simulator"}, {"slug": "fluid-flow", "title": "Pipe Pressure Drop Calculator — Darcy-Weisbach"}, {"slug": "reynolds-number", "title": "Reynolds Number Calculator"}, {"slug": "pascals-law", "title": "Pascal’s Law Simulator"}, {"slug": "wind-tunnel", "title": "Wind Tunnel Simulator"}, {"slug": "psychrometric-chart", "title": "Interactive Psychrometric Chart Calculator"}, {"slug": "rankine-cycle", "title": "Rankine Cycle Simulator"}, {"slug": "refrigeration-cycle", "title": "Refrigeration Cycle Simulator"}, {"slug": "four-stroke-engine", "title": "Four Stroke Engine Simulator"}, {"slug": "two-stroke-engine", "title": "Two Stroke Engine Simulator"}, {"slug": "buoyancy", "title": "Buoyancy & Archimedes’ Principle Simulator"}, {"slug": "viscosity-experiment", "title": "Viscosity Experiment Virtual Lab"}, {"slug": "thermal-conductivity", "title": "Thermal Conductivity Calculator"}, {"slug": "continuity-equation", "title": "Continuity Equation Simulator"}, {"slug": "stefan-boltzmann", "title": "Stefan-Boltzmann Radiation Simulator"}, {"slug": "specific-heat-capacity", "title": "Specific Heat Capacity Table & Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}]}, {"name": "⚡ Basic Electrical Simulations", "tools": [{"slug": "ohms-law", "title": "Ohm’s Law Calculator & DC Circuit Builder"}, {"slug": "wheatstone-bridge", "title": "Wheatstone Bridge Simulator & Calculator"}, {"slug": "kirchhoff-solver", "title": "Kirchhoff’s Law Calculator — KCL & KVL"}, {"slug": "rc-circuit", "title": "RC Circuit — Capacitor Charging & Discharging"}, {"slug": "rlc-circuit", "title": "RLC Circuit — AC Circuit Analysis"}, {"slug": "capacitor-bank", "title": "Capacitor Bank Simulator"}, {"slug": "ac-generator", "title": "AC Generator Simulator"}, {"slug": "transformer", "title": "Transformer — Step-Up & Step-Down"}, {"slug": "dc-motor", "title": "DC Motor Simulator"}, {"slug": "diode-rectifier", "title": "Diode & Rectifier Circuits"}, {"slug": "bjt-transistor", "title": "BJT Transistor Simulator"}, {"slug": "star-delta", "title": "Star-Delta (Y-Δ) Conversion"}, {"slug": "logic-gates", "title": "Logic Gates Simulator"}, {"slug": "karnaugh-map", "title": "Karnaugh Map Solver"}, {"slug": "electrical-wiring", "title": "House Wiring Simulator — Practice Home Electrical Circuits"}, {"slug": "resistor-color-code", "title": "Resistor Color Code Calculator"}, {"slug": "faradays-law", "title": "Faraday's Law Simulator"}, {"slug": "plc-ladder-logic", "title": "PLC Ladder Logic Simulator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}, {"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "heat-transfer", "title": "Heat Transfer Calculator — Conduction, Convection & Radiation"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "beam-bending", "title": "Beam Bending Simulator — SFD, BMD & Deflection"}]}, {"name": "Workshop & Manufacturing", "tools": [{"slug": "lathe-machine", "title": "Lathe Machine Simulator"}, {"slug": "milling-machine", "title": "Milling Machine Simulator"}, {"slug": "drilling-machine", "title": "Drilling Machine Simulator"}, {"slug": "hydraulic-circuit", "title": "Hydraulic Circuit Simulator and Trainer"}, {"slug": "pneumatic-circuit", "title": "Pneumatic Circuit Simulator"}, {"slug": "electro-pneumatic-circuit", "title": "Electro-Pneumatic Circuit Simulator"}, {"slug": "plc-ladder-logic", "title": "PLC Ladder Logic Simulator"}, {"slug": "cnc-gcode", "title": "CNC G-Code Simulator"}, {"slug": "bolted-joint", "title": "Bolt Torque & Preload Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}, {"slug": "welding-symbols", "title": "Welding Symbols Chart & Interactive Trainer"}, {"slug": "riveted-joints", "title": "Types of Riveted Joints"}, {"slug": "gdt-trainer", "title": "GD&T Symbols Chart & Trainer"}, {"slug": "thread-nomenclature", "title": "Thread Nomenclature & Metric Thread Chart"}, {"slug": "tolerance-fits", "title": "Tolerance & Fits Calculator"}, {"slug": "bend-radius", "title": "Sheet Metal Bend Radius & Bend Allowance Calculator"}, {"slug": "rivet-joint-designer", "title": "Rivet Joint Design & Failure Mode Simulator"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "machining-calculator", "title": "Speeds and Feeds Calculator"}]}, {"name": "Engineering Calculators", "tools": [{"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "column-buckling", "title": "Column Buckling Calculator"}, {"slug": "power-screw", "title": "Power Screw Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}, {"slug": "stress-concentration", "title": "Stress Concentration Factor (Kt) Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "machining-calculator", "title": "Speeds and Feeds Calculator"}, {"slug": "spring-design", "title": "Spring Design Calculator"}, {"slug": "tolerance-fits", "title": "Tolerance & Fits Calculator"}, {"slug": "bend-radius", "title": "Sheet Metal Bend Radius & Bend Allowance Calculator"}, {"slug": "gear-trains", "title": "Gear Train Calculator"}, {"slug": "bearing-life", "title": "Bearing Life Calculator"}, {"slug": "gear-strength", "title": "Gear Strength Calculator"}, {"slug": "heat-exchanger", "title": "LMTD & NTU Heat Exchanger Calculator"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "hydraulic-cylinder", "title": "Hydraulic Cylinder Simulator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}]}, {"name": "🔬 Basic Science", "tools": [{"slug": "collision-momentum", "title": "Collision & Momentum Simulator — Elastic, Inelastic & 2D Collisions"}, {"slug": "balance-chemical-equations", "title": "Balancing Chemical Equations"}, {"slug": "build-your-atom", "title": "Build Your Atom"}, {"slug": "ray-optics", "title": "Ray Optics Simulator & Trainer"}, {"slug": "refraction", "title": "Refraction of Light Simulator — Snell’s Law, Critical Angle & Prisms"}, {"slug": "titration", "title": "Titration Simulator — Acid-Base Curve, Indicators & Calculator"}, {"slug": "litmus-test", "title": "Litmus Paper Test — Colour Chart & Virtual Lab"}, {"slug": "newtons-laws", "title": "Newton’s Laws of Motion"}, {"slug": "projectile-motion", "title": "Projectile Motion Calculator & Simulator"}, {"slug": "free-fall", "title": "Free Fall Simulator"}, {"slug": "boyles-law", "title": "Boyle's Law Simulator"}, {"slug": "charles-law", "title": "Charles' Law Simulator"}, {"slug": "ideal-gas-law", "title": "Ideal Gas Law Calculator & Simulator"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "hookes-law", "title": "Hooke’s Law Simulator"}, {"slug": "friction", "title": "Friction & Contact Forces Simulator"}, {"slug": "pascals-law", "title": "Pascal’s Law Simulator"}, {"slug": "bernoullis-principle", "title": "Bernoulli’s Principle Simulator"}, {"slug": "specific-heat-capacity", "title": "Specific Heat Capacity Table & Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "faradays-law", "title": "Faraday's Law Simulator"}]}, {"name": "𝑓(x) Mathematics & Graphing Tools", "tools": [{"slug": "math-graphing", "title": "Math Function Graph Generator"}, {"slug": "logic-gates", "title": "Logic Gates Simulator"}, {"slug": "karnaugh-map", "title": "Karnaugh Map Solver"}, {"slug": "calculus-visualizer", "title": "Calculus Visualizer & Simulator"}, {"slug": "matrix-multiplication", "title": "Matrix Calculator and Operations Simulator"}, {"slug": "area-calculator", "title": "Area Calculator"}]}, {"name": "Other Simulations", "tools": [{"slug": "chemical-bonds", "title": "Chemical Bond Simulator"}, {"slug": "chemical-mixing", "title": "Chemical Mixing Simulation — Mix Acids & Bases"}, {"slug": "moment-of-inertia-angle", "title": "Moment of Inertia of an Angle Section"}, {"slug": "moment-of-inertia-channel", "title": "Moment of Inertia of a Channel Section"}, {"slug": "moment-of-inertia-circle", "title": "Moment of Inertia of a Circle"}, {"slug": "moment-of-inertia-hollow-circle", "title": "Moment of Inertia of a Hollow Circle"}, {"slug": "moment-of-inertia-hollow-rect", "title": "Moment of Inertia of a Hollow Rectangle"}, {"slug": "moment-of-inertia-i-beam", "title": "Moment of Inertia of an I-Beam"}, {"slug": "moment-of-inertia-rectangle", "title": "Moment of Inertia of a Rectangle"}, {"slug": "moment-of-inertia-t-section", "title": "Moment of Inertia of a T-Section"}, {"slug": "phase-change", "title": "Phase Change & Latent Heat Simulator"}]}];

  // Link prefix relative to site root, derived from current page depth.
  function rootPrefix() {
    var segs = location.pathname.split('/').filter(Boolean);
    var dirDepth = Math.max(0, segs.length - 1);
    var p = '';
    for (var i = 0; i < dirDepth; i++) p += '../';
    return p;
  }
  var ROOT = rootPrefix();

  var css =
    '#sim-sidebar{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;' +
    'background:#0f1320;color:#dce3f0;box-shadow:2px 0 18px rgba(0,0,0,.5);' +
    'transform:translateX(-100%);transition:transform .25s ease;z-index:9999;' +
    'display:flex;flex-direction:column;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:14px}' +
    'body.sim-sidebar-open #sim-sidebar{transform:translateX(0)}' +
    '#sim-sidebar .sb-head{padding:14px 14px 10px;border-bottom:1px solid #1e2740;' +
    'position:sticky;top:0;background:#0f1320;z-index:2}' +
    '#sim-sidebar .sb-brand{font-weight:800;font-size:15px;color:#7aa2ff;letter-spacing:.3px}' +
    '#sim-sidebar .sb-sub{font-size:11px;color:#6b7a99;margin-top:2px}' +
    '#sim-sidebar .sb-search{margin-top:10px;width:100%;box-sizing:border-box;padding:8px 10px;' +
    'border-radius:8px;border:1px solid #1e2740;background:#0a0d18;color:#dce3f0;outline:none}' +
    '#sim-sidebar .sb-search:focus{border-color:#7aa2ff}' +
    '#sim-sidebar .sb-body{overflow-y:auto;padding:8px 6px 24px;flex:1}' +
    '#sim-sidebar details{border-bottom:1px solid #161d33}' +
    '#sim-sidebar summary{cursor:pointer;padding:9px 10px;font-weight:700;color:#cdd7ee;' +
    'list-style:none;display:flex;justify-content:space-between;align-items:center}' +
    '#sim-sidebar summary::-webkit-details-marker{display:none}' +
    '#sim-sidebar summary .sb-count{font-size:11px;color:#6b7a99;font-weight:600}' +
    '#sim-sidebar summary:hover{background:#141b30}' +
    '#sim-sidebar .sb-list{margin:0;padding:0 0 6px}' +
    '#sim-sidebar .sb-list a{display:block;padding:6px 12px 6px 22px;color:#aab6d4;' +
    'text-decoration:none;border-radius:6px;margin:1px 6px}' +
    '#sim-sidebar .sb-list a:hover{background:#1b2540;color:#fff}' +
    '#sim-sidebar .sb-hint{font-size:10px;color:#56627f;padding:8px 12px}' +
    '#sim-sidebar-toggle{position:fixed;top:12px;left:12px;z-index:10001;width:40px;height:40px;' +
    'border:none;border-radius:10px;background:#0f1320;color:#7aa2ff;font-size:18px;' +
    'cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4);display:flex;align-items:center;' +
    'justify-content:center}' +
    'body.sim-sidebar-open #sim-sidebar-toggle{left:312px}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var sidebar = document.createElement('aside');
  sidebar.id = 'sim-sidebar';

  var head = document.createElement('div');
  head.className = 'sb-head';
  var brand = document.createElement('div');
  brand.className = 'sb-brand';
  brand.textContent = 'NHIT VisualLab';
  var sub = document.createElement('div');
  sub.className = 'sb-sub';
  sub.textContent = 'All Simulations';
  head.appendChild(brand);
  head.appendChild(sub);
  var search = document.createElement('input');
  search.className = 'sb-search';
  search.placeholder = 'Search simulations…';
  search.setAttribute('aria-label', 'Search simulations');
  head.appendChild(search);
  sidebar.appendChild(head);

  var bodyEl = document.createElement('div');
  bodyEl.className = 'sb-body';

  SIDEBAR_DATA.forEach(function (cat) {
    var det = document.createElement('details');
    det.open = true;
    var sum = document.createElement('summary');
    var sname = document.createElement('span');
    sname.textContent = cat.name;
    var cnt = document.createElement('span');
    cnt.className = 'sb-count';
    cnt.textContent = cat.tools.length;
    sum.appendChild(sname);
    sum.appendChild(cnt);
    det.appendChild(sum);
    var ul = document.createElement('div');
    ul.className = 'sb-list';
    cat.tools.forEach(function (t) {
      var a = document.createElement('a');
      a.textContent = t.title;
      a.href = ROOT + 'tools/' + t.slug + '/index.html';
      ul.appendChild(a);
    });
    det.appendChild(ul);
    bodyEl.appendChild(det);
  });

  var hint = document.createElement('div');
  hint.className = 'sb-hint';
  hint.textContent = '← hide · → show · Esc closes';
  bodyEl.appendChild(hint);
  sidebar.appendChild(bodyEl);
  document.body.appendChild(sidebar);

  var btn = document.createElement('button');
  btn.id = 'sim-sidebar-toggle';
  btn.title = 'Toggle simulations sidebar (← / →)';
  btn.innerHTML = '&#9776;';
  document.body.appendChild(btn);

  function openSb() {
    document.body.classList.add('sim-sidebar-open');
    clearTimeout(autoHideTimer);
  }
  function closeSb() {
    document.body.classList.remove('sim-sidebar-open');
  }
  function toggleSb() {
    if (document.body.classList.contains('sim-sidebar-open')) closeSb();
    else openSb();
  }

  var autoHideTimer;
  sidebar.addEventListener('mouseleave', function () {
    autoHideTimer = setTimeout(closeSb, 700);
  });
  sidebar.addEventListener('mouseenter', function () {
    clearTimeout(autoHideTimer);
  });

  btn.addEventListener('click', toggleSb);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
      t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); openSb(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); closeSb(); }
    else if (e.key === 'Escape') { closeSb(); }
  });

  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('sim-sidebar-open') &&
        !sidebar.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      closeSb();
    }
  });

  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) setTimeout(closeSb, 60);
  });

  // Open on load as an overlay, then auto-hide unless the user engages it.
  openSb();
  setTimeout(function () {
    if (!sidebar.matches(':hover')) closeSb();
  }, 5000);

  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase();
    var groups = sidebar.querySelectorAll('details');
    groups.forEach(function (det) {
      var any = false;
      det.querySelectorAll('a').forEach(function (a) {
        var match = a.textContent.toLowerCase().indexOf(q) !== -1;
        a.style.display = match ? '' : 'none';
        if (match) any = true;
      });
      if (q.length > 0) {
        det.style.display = any ? '' : 'none';
        det.open = any;
      } else {
        det.style.display = '';
        det.open = true;
      }
    });
  });
})();
