// NHIT VisualLab — Dual-Mode Overlay Sidebar
// Toggle between: 📁 By Category | 🎓 By Course & Semester
(function () {

  var CATEGORY_DATA = [
    {
      "name": "🧪 Virtual Lab Testing",
      "tools": [
        {"slug": "utm-testing", "title": "UTM Virtual Lab"},
        {"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"},
        {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"},
        {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"},
        {"slug": "fatigue-life", "title": "Fatigue Life Calculator"},
        {"slug": "fatigue-testing", "title": "Fatigue Testing Virtual Lab"},
        {"slug": "torsion-testing", "title": "Torsion Test Virtual Lab"},
        {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test Simulator"},
        {"slug": "centrifugal-pump", "title": "Centrifugal Pump Test Rig Simulator"},
        {"slug": "hydraulic-turbine", "title": "Hydraulic Turbine Test Rig Simulator"}
      ]
    },
    {
      "name": "🏎️ Automotive Engineering",
      "tools": [
        {"slug": "steering-geometry", "title": "Steering Geometry & Alignment (Ackermann, Camber, Caster)"},
        {"slug": "valve-timing-diagram", "title": "Valve Timing Diagram Simulator (Petrol & Diesel)"},
        {"slug": "automotive-differential", "title": "Automotive Differential Mechanism Simulator"},
        {"slug": "automotive-clutch", "title": "Automotive Friction Clutch Simulator"},
        {"slug": "four-stroke-engine", "title": "Four Stroke Engine Simulator"},
        {"slug": "two-stroke-engine", "title": "Two Stroke Engine Simulator"},
        {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test"},
        {"slug": "thermodynamics", "title": "Thermodynamic Cycles (Otto, Diesel, Dual)"},
        {"slug": "hydraulic-circuit", "title": "Hydraulic Brakes & Hydraulic Circuit"},
        {"slug": "pneumatic-circuit", "title": "Air Brake Systems & Pneumatic Circuit"},
        {"slug": "wind-tunnel", "title": "Vehicle Aerodynamics & Wind Tunnel"},
        {"slug": "refrigeration-cycle", "title": "Automobile Air Conditioning (HVAC)"},
        {"slug": "psychrometric-chart", "title": "Auto AC Psychrometric Chart Calculator"},
        {"slug": "tolerance-fits", "title": "Limits, Fits & Tolerances"},
        {"slug": "gdt-trainer", "title": "GD&T Symbols Chart & Trainer"}
      ]
    },
    {
      "name": "📐 Measuring Instruments & Metrology",
      "tools": [
        {"slug": "vernier-caliper", "title": "Vernier Caliper Simulator"},
        {"slug": "screw-gauge", "title": "Screw Gauge Simulator"},
        {"slug": "height-gauge", "title": "Vernier Height Gauge Simulator"},
        {"slug": "dial-gauge", "title": "Dial Gauge Simulator"},
        {"slug": "steel-ruler", "title": "Steel Ruler Simulator"},
        {"slug": "bevel-protractor", "title": "Bevel Protractor Simulator"},
        {"slug": "protractor", "title": "Online Protractor Simulator"},
        {"slug": "pressure-gauge", "title": "Pressure Gauge Simulator"}
      ]
    },
    {
      "name": "⚙️ Mechanisms & Machine Kinematics",
      "tools": [
        {"slug": "four-bar-linkage", "title": "Four-Bar Linkage Simulator"},
        {"slug": "slider-crank", "title": "Slider-Crank Mechanism"},
        {"slug": "cam-follower", "title": "Cam & Follower Mechanism"},
        {"slug": "gear-trains", "title": "Gear Train Calculator"},
        {"slug": "belt-drive", "title": "Belt & Chain Drive"},
        {"slug": "scotch-yoke", "title": "Scotch Yoke Mechanism"},
        {"slug": "geneva-mechanism", "title": "Geneva Mechanism Simulator"},
        {"slug": "centrifugal-governor", "title": "Centrifugal Governor Simulator"},
        {"slug": "flywheel", "title": "Flywheel Energy Storage"},
        {"slug": "bearing-selection", "title": "Bearing Selection Calculator"}
      ]
    },
    {
      "name": "🏗️ Strength of Materials (SOM)",
      "tools": [
        {"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"},
        {"slug": "hookes-law", "title": "Hooke’s Law Simulator"},
        {"slug": "utm-testing", "title": "UTM Virtual Lab"},
        {"slug": "hardness-testing", "title": "Hardness Testing Simulator"},
        {"slug": "impact-testing", "title": "Charpy & Izod Impact Test"},
        {"slug": "mohrs-circle", "title": "Mohr's Circle Calculator"},
        {"slug": "beam-bending", "title": "Beam Bending — SFD, BMD & Deflection"},
        {"slug": "truss-analysis", "title": "Truss Analysis Simulator"},
        {"slug": "shaft-torsion", "title": "Shaft Torsion Calculator"},
        {"slug": "column-buckling", "title": "Column Buckling Calculator"},
        {"slug": "pressure-vessel", "title": "Thin Cylinders Hoop Stress"},
        {"slug": "spring-design", "title": "Spring Design Calculator"}
      ]
    },
    {
      "name": "🔥 Thermal & Fluid Engineering",
      "tools": [
        {"slug": "thermodynamics", "title": "Thermodynamic Cycles Simulator"},
        {"slug": "ideal-gas-law", "title": "Ideal Gas Law Calculator"},
        {"slug": "boyles-law", "title": "Boyle's Law Simulator"},
        {"slug": "charles-law", "title": "Charles' Law Simulator"},
        {"slug": "heat-transfer", "title": "Heat Transfer — Conduction, Convection, Radiation"},
        {"slug": "heat-exchanger", "title": "LMTD & NTU Heat Exchanger"},
        {"slug": "bernoullis-principle", "title": "Bernoulli’s Principle Simulator"},
        {"slug": "fluid-flow", "title": "Pipe Pressure Drop Calculator"},
        {"slug": "reynolds-number", "title": "Reynolds Number Calculator"},
        {"slug": "pascals-law", "title": "Pascal’s Law Simulator"},
        {"slug": "rankine-cycle", "title": "Rankine Cycle Simulator"},
        {"slug": "refrigeration-cycle", "title": "Refrigeration Cycle Simulator"}
      ]
    },
    {
      "name": "🏭 Power Plant Engineering",
      "tools": [
        {"slug": "thermal-power-plant", "title": "Thermal Power Plant Simulator"},
        {"slug": "nuclear-power-plant", "title": "Nuclear Power Plant Simulator (PWR) & Virtual Tour"},
        {"slug": "coal-gas-power-plant", "title": "Coal & Gas Power Plant Simulator"}
      ]
    },
    {
      "name": "⚡ Basic Electrical & Electronics",
      "tools": [
        {"slug": "ohms-law", "title": "Ohm’s Law & DC Circuit Builder"},
        {"slug": "wheatstone-bridge", "title": "Wheatstone Bridge Simulator"},
        {"slug": "kirchhoff-solver", "title": "Kirchhoff’s Laws (KCL & KVL)"},
        {"slug": "rc-circuit", "title": "RC Circuit Charging & Discharging"},
        {"slug": "rlc-circuit", "title": "RLC Circuit Analysis"},
        {"slug": "ac-generator", "title": "AC Generator Simulator"},
        {"slug": "transformer", "title": "Transformer Step-Up & Step-Down"},
        {"slug": "dc-motor", "title": "DC Motor Simulator"},
        {"slug": "diode-rectifier", "title": "Diode & Rectifier Circuits"},
        {"slug": "bjt-transistor", "title": "BJT Transistor Simulator"},
        {"slug": "logic-gates", "title": "Logic Gates Simulator"},
        {"slug": "karnaugh-map", "title": "Karnaugh Map Solver"},
        {"slug": "electrical-wiring", "title": "House Electrical Wiring Practice"}
      ]
    },
    {
      "name": "🛠️ Workshop & Manufacturing Processes",
      "tools": [
        {"slug": "lathe-machine", "title": "Lathe Machine Simulator"},
        {"slug": "milling-machine", "title": "Milling Machine Simulator"},
        {"slug": "drilling-machine", "title": "Drilling Machine Simulator"},
        {"slug": "cnc-gcode", "title": "CNC G-Code Simulator"},
        {"slug": "weld-strength", "title": "Weld Strength Calculator"},
        {"slug": "welding-symbols", "title": "Welding Symbols Chart & Trainer"},
        {"slug": "machining-calculator", "title": "Speeds and Feeds Calculator"}
      ]
    }
  ];

  var COURSE_DATA = [
    {
      "course": "🏎️ Automobile Engg.",
      "semesters": [
        {
          "sem": "Semester 3 (Syllabus Mapped)",
          "tools": [
            {"slug": "valve-timing-diagram", "title": "Valve Timing Diagram Simulator (S.I. & C.I.)"},
            {"slug": "automotive-differential", "title": "Automotive Differential Mechanism Simulator"},
            {"slug": "automotive-clutch", "title": "Automotive Friction Clutch Simulator"},
            {"slug": "four-stroke-engine", "title": "Four Stroke Petrol & Diesel Engine"},
            {"slug": "two-stroke-engine", "title": "Two Stroke Engine Simulator"},
            {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test"},
            {"slug": "thermodynamics", "title": "Heat Power: Otto, Diesel & Dual Cycles"},
            {"slug": "ideal-gas-law", "title": "Gas Laws: Boyle's & Charles's Law"},
            {"slug": "heat-transfer", "title": "Heat Transfer (Conduction & Convection)"},
            {"slug": "heat-exchanger", "title": "LMTD Heat Exchanger Simulator"},
            {"slug": "stress-strain", "title": "Advanced SOM: Stress-Strain Curve"},
            {"slug": "utm-testing", "title": "Advanced SOM: UTM Tensile Test Lab"},
            {"slug": "mohrs-circle", "title": "Advanced SOM: Mohr's Circle Diagram"},
            {"slug": "beam-bending", "title": "Advanced SOM: Bending Stresses & SFD/BMD"},
            {"slug": "shaft-torsion", "title": "Advanced SOM: Shaft Torsion Calculator"},
            {"slug": "spring-design", "title": "Advanced SOM: Helical Springs Design"},
            {"slug": "pressure-vessel", "title": "Advanced SOM: Thin Cylinders Hoop Stress"},
            {"slug": "diode-rectifier", "title": "Electronics Lab: Diodes & Rectifiers"},
            {"slug": "bjt-transistor", "title": "Electronics Lab: BJT Transistor"},
            {"slug": "logic-gates", "title": "Electronics Lab: Logic Gates & Flip-Flops"},
            {"slug": "lathe-machine", "title": "Manufacturing: Lathe Machine Simulator"},
            {"slug": "milling-machine", "title": "Manufacturing: Milling Machine Simulator"},
            {"slug": "drilling-machine", "title": "Manufacturing: Drilling Machine"},
            {"slug": "tolerance-fits", "title": "Auto Drawing: Limits, Fits & Tolerances"},
            {"slug": "gdt-trainer", "title": "Auto Drawing: GD&T Symbols Chart"}
          ]
        },
        {
          "sem": "Semester 4 (Syllabus Mapped)",
          "tools": [
            {"slug": "refrigeration-cycle", "title": "HPE II: Air Conditioning & Vapor Compression"},
            {"slug": "psychrometric-chart", "title": "HPE II: Psychrometric Chart Calculator"},
            {"slug": "rankine-cycle", "title": "HPE II: Steam Turbines & Rankine Cycle"},
            {"slug": "thermal-power-plant", "title": "HPE II: Thermal Power Generation"},
            {"slug": "coal-gas-power-plant", "title": "HPE II: Gas Turbines Power Plant"},
            {"slug": "four-stroke-engine", "title": "Advanced Engines: MPFI & CRDI Fuel Injection"},
            {"slug": "valve-timing-diagram", "title": "Advanced Engines: Valve Timing"},
            {"slug": "automotive-differential", "title": "Transmission: Rear Axle & Differential"},
            {"slug": "automotive-clutch", "title": "Transmission: Friction Clutches"},
            {"slug": "gear-trains", "title": "Transmission: Manual Transmissions & Gear Ratios"},
            {"slug": "gear-strength", "title": "Transmission: Gear Strength Calculator"},
            {"slug": "bend-radius", "title": "Manufacturing: Press Tools, Punching & Blanking"},
            {"slug": "machining-calculator", "title": "Manufacturing: Speeds & Feeds Calculator"},
            {"slug": "four-bar-linkage", "title": "TOM: Four-Bar Kinematic Linkage"},
            {"slug": "slider-crank", "title": "TOM: Slider-Crank Velocity Analysis"},
            {"slug": "cam-follower", "title": "TOM: Cam Profile & Follower"},
            {"slug": "centrifugal-governor", "title": "TOM: Governors"},
            {"slug": "flywheel", "title": "TOM: Flywheel Energy Storage"},
            {"slug": "bearing-life", "title": "TOM: Bearing Life Calculator"}
          ]
        },
        {
          "sem": "Semester 5 (Syllabus Mapped)",
          "tools": [
            {"slug": "steering-geometry", "title": "Chassis II: Steering Geometry & Alignment (Ackermann, Camber)"},
            {"slug": "hydraulic-circuit", "title": "Chassis II & Lab: Hydraulic Brake Systems & Valves"},
            {"slug": "pneumatic-circuit", "title": "Chassis II & Lab: Air Brake Systems & Pneumatics"},
            {"slug": "electro-pneumatic-circuit", "title": "Hydraulics & Lab: Electro-Pneumatic Circuit"},
            {"slug": "hydraulic-cylinder", "title": "Hydraulics & Lab: Hydraulic Cylinders & Actuators"},
            {"slug": "spring-design", "title": "Component Design: Helical & Leaf Springs"},
            {"slug": "shaft-torsion", "title": "Component Design: Transmission Shafts & Keys"},
            {"slug": "power-screw", "title": "Component Design: Power Screws"},
            {"slug": "bolted-joint", "title": "Component Design: Bolted Joints"},
            {"slug": "weld-strength", "title": "Component Design: Welded Joints"},
            {"slug": "rivet-joint-designer", "title": "Component Design: Riveted Joints"},
            {"slug": "stress-concentration", "title": "Component Design: Stress Concentration Factor (Kt)"},
            {"slug": "dc-motor", "title": "Auto Electricals: Starter Motor & DC Generator"},
            {"slug": "ac-generator", "title": "Auto Electricals: Alternator Charging System"},
            {"slug": "electrical-wiring", "title": "Auto Electricals: Harness & Lighting Wiring"},
            {"slug": "diode-rectifier", "title": "Auto Electricals: ECU Rectifiers & Diodes"},
            {"slug": "wind-tunnel", "title": "Elective: Vehicle Aerodynamics & Drag Cd"},
            {"slug": "fluid-flow", "title": "Elective: Aerodynamic Flow & Pressure Drop"},
            {"slug": "reynolds-number", "title": "Elective: Vehicle Boundary Layer Reynolds Number"}
          ]
        },
        {
          "sem": "Semester 6 (Syllabus Mapped)",
          "tools": [
            {"slug": "lathe-machine", "title": "Maintenance: Engine & Component Overhauling"},
            {"slug": "milling-machine", "title": "Maintenance: Garage Machine Tools"},
            {"slug": "drilling-machine", "title": "Maintenance: Drilling Operations"},
            {"slug": "vernier-caliper", "title": "Maintenance: Precision Measuring Instruments"},
            {"slug": "dial-gauge", "title": "Maintenance: Cylinder Bore & Shaft Runout Gauge"},
            {"slug": "cnc-gcode", "title": "CAD/CAM Elective: CNC G-Code Programming"},
            {"slug": "plc-ladder-logic", "title": "CAD/CAM Elective: Automated Assembly PLC"},
            {"slug": "refrigeration-cycle", "title": "Auto AC Elective: VCRS Automobile Air Conditioning"},
            {"slug": "psychrometric-chart", "title": "Auto AC Elective: Psychrometric Chart Calculator"},
            {"slug": "heat-exchanger", "title": "Auto AC Elective: Evaporator & Condenser Heat Exchanger"},
            {"slug": "nuclear-power-plant", "title": "Alternate Energy Elective: Nuclear Power Generation"},
            {"slug": "capacitor-bank", "title": "Alternate Energy Elective: EV Battery Supercapacitors"}
          ]
        }
      ]
    },
    {
      "course": "🏗️ Civil Engg.",
      "semesters": [
        {
          "sem": "Semester 3 & 4 (SOM & Hydraulics)",
          "tools": [
            {"slug": "stress-strain", "title": "SOM: Stress-Strain Diagram"},
            {"slug": "utm-testing", "title": "SOM: UTM Concrete & Steel Test"},
            {"slug": "beam-bending", "title": "SOM: Beam Bending, SFD & BMD"},
            {"slug": "truss-analysis", "title": "SOM: Truss Analysis Method of Joints"},
            {"slug": "bernoullis-principle", "title": "Hydraulics: Bernoulli’s Theorem"},
            {"slug": "fluid-flow", "title": "Hydraulics: Pipe Friction & Pressure Drop"},
            {"slug": "viscosity-experiment", "title": "Hydraulics: Viscosity Lab"}
          ]
        },
        {
          "sem": "Semester 5 & 6 (Structural & Geotech)",
          "tools": [
            {"slug": "mohrs-circle", "title": "Soil Mechanics: Mohr's Circle"},
            {"slug": "column-buckling", "title": "Structures: Column Buckling"},
            {"slug": "weld-strength", "title": "Steel Structures: Welded Joints"},
            {"slug": "riveted-joints", "title": "Steel Structures: Riveted Joints"},
            {"slug": "area-calculator", "title": "Surveying: Cross-Section Area"}
          ]
        }
      ]
    },
    {
      "course": "💻 Computer Sc & Tech.",
      "semesters": [
        {
          "sem": "Semester 3 & 4 (Digital & Math)",
          "tools": [
            {"slug": "logic-gates", "title": "Digital Circuits: Logic Gates Simulator"},
            {"slug": "karnaugh-map", "title": "Digital Logic: Karnaugh Map Minimizer"},
            {"slug": "math-graphing", "title": "Mathematics: Function Grapher"},
            {"slug": "calculus-visualizer", "title": "Mathematics: Calculus Visualizer"},
            {"slug": "matrix-multiplication", "title": "Linear Algebra: Matrix Calculator"}
          ]
        },
        {
          "sem": "Semester 5 & 6 (Hardware & Embedded)",
          "tools": [
            {"slug": "plc-ladder-logic", "title": "Embedded Systems: PLC Ladder Logic"},
            {"slug": "cnc-gcode", "title": "Computer Integrated Manufacturing: CNC G-Code"}
          ]
        }
      ]
    },
    {
      "course": "⚡ Electrical Engg.",
      "semesters": [
        {
          "sem": "Semester 3 (Circuit Theory & Measurement)",
          "tools": [
            {"slug": "ohms-law", "title": "Circuits: Ohm's Law & DC Circuits"},
            {"slug": "wheatstone-bridge", "title": "Measurements: Wheatstone Bridge"},
            {"slug": "kirchhoff-solver", "title": "Circuits: KCL & KVL Solver"},
            {"slug": "rc-circuit", "title": "Circuits: RC Circuit Transient Response"},
            {"slug": "rlc-circuit", "title": "Circuits: RLC Resonance & AC"},
            {"slug": "resistor-color-code", "title": "Components: Resistor Color Code"}
          ]
        },
        {
          "sem": "Semester 4 & 5 (Machines & Power)",
          "tools": [
            {"slug": "dc-motor", "title": "Electrical Machines: DC Motor Rig"},
            {"slug": "transformer", "title": "Electrical Machines: Step-Up/Down Transformer"},
            {"slug": "ac-generator", "title": "Electrical Machines: Alternator AC Generator"},
            {"slug": "star-delta", "title": "Machines: Star-Delta (Y-Δ) Starter"},
            {"slug": "thermal-power-plant", "title": "Power Generation: Thermal Power Plant"},
            {"slug": "nuclear-power-plant", "title": "Power Generation: Nuclear Power Plant (PWR)"}
          ]
        }
      ]
    },
    {
      "course": "📡 Electronics & Telecomm Engg.",
      "semesters": [
        {
          "sem": "Semester 3 & 4 (Analog & Digital)",
          "tools": [
            {"slug": "diode-rectifier", "title": "Analog: Diode Rectifier & Filter"},
            {"slug": "bjt-transistor", "title": "Analog: BJT Transistor Amplifier"},
            {"slug": "logic-gates", "title": "Digital: Logic Gates & Flip-Flops"},
            {"slug": "karnaugh-map", "title": "Digital: K-Map Logic Simplifier"},
            {"slug": "thermocouple", "title": "Instrumentation: Thermocouple Sensors"}
          ]
        },
        {
          "sem": "Semester 5 & 6 (Optics & Signals)",
          "tools": [
            {"slug": "ray-optics", "title": "Optical Fiber: Ray Optics Simulator"},
            {"slug": "refraction", "title": "Optics: Refraction & Snell's Law"}
          ]
        }
      ]
    },
    {
      "course": "⚙️ Mechanical Engg.",
      "semesters": [
        {
          "sem": "Semester 3 & 4 (Thermal, Fluid & Manufacturing)",
          "tools": [
            {"slug": "thermodynamics", "title": "Thermodynamics: Otto & Diesel Cycles"},
            {"slug": "four-stroke-engine", "title": "IC Engines: 4-Stroke Engine"},
            {"slug": "two-stroke-engine", "title": "IC Engines: 2-Stroke Engine"},
            {"slug": "morse-test", "title": "IC Engines: Morse Test Rig"},
            {"slug": "lathe-machine", "title": "Workshop: Lathe Machine Simulator"},
            {"slug": "milling-machine", "title": "Workshop: Milling Machine Simulator"},
            {"slug": "drilling-machine", "title": "Workshop: Drilling Machine"}
          ]
        },
        {
          "sem": "Semester 5 & 6 (Theory of Machines & Design)",
          "tools": [
            {"slug": "four-bar-linkage", "title": "TOM: Four-Bar Linkage"},
            {"slug": "slider-crank", "title": "TOM: Slider-Crank Mechanism"},
            {"slug": "cam-follower", "title": "TOM: Cam & Follower"},
            {"slug": "gear-trains", "title": "TOM: Gear Trains"},
            {"slug": "shaft-torsion", "title": "Machine Design: Shaft Torsion"},
            {"slug": "spring-design", "title": "Machine Design: Springs"},
            {"slug": "bearing-selection", "title": "Machine Design: Bearings"}
          ]
        }
      ]
    },
    {
      "course": "🔧 ITI - Fitter",
      "semesters": [
        {
          "sem": "Year 1 (Trade Theory & Workshop Practical)",
          "tools": [
            {"slug": "vernier-caliper", "title": "Fitting Metrology: Vernier Caliper"},
            {"slug": "screw-gauge", "title": "Fitting Metrology: Screw Gauge Micrometer"},
            {"slug": "height-gauge", "title": "Metrology: Vernier Height Gauge"},
            {"slug": "bevel-protractor", "title": "Metrology: Bevel Protractor"},
            {"slug": "lathe-machine", "title": "Turning Practical: Lathe Machine"},
            {"slug": "drilling-machine", "title": "Drilling Practical: Drilling Machine"},
            {"slug": "tolerance-fits", "title": "Theory: Fits & Tolerances"},
            {"slug": "welding-symbols", "title": "Welding Theory: Welding Symbols"}
          ]
        },
        {
          "sem": "Year 2 (Power Transmission & Hydraulics)",
          "tools": [
            {"slug": "gear-trains", "title": "Power Transmission: Gear Drives"},
            {"slug": "belt-drive", "title": "Power Transmission: Belt Drives"},
            {"slug": "bearing-selection", "title": "Maintenance: Bearings Assembly"},
            {"slug": "hydraulic-circuit", "title": "Fluid Power: Hydraulic Circuit"},
            {"slug": "pneumatic-circuit", "title": "Fluid Power: Pneumatic Circuit"}
          ]
        }
      ]
    },
    {
      "course": "💡 ITI - Electrician",
      "semesters": [
        {
          "sem": "Year 1 (Basic Electrical & House Wiring)",
          "tools": [
            {"slug": "ohms-law", "title": "Theory: Ohm's Law & DC Circuits"},
            {"slug": "electrical-wiring", "title": "Practical: House Electrical Wiring"},
            {"slug": "resistor-color-code", "title": "Theory: Resistor Color Codes"},
            {"slug": "rc-circuit", "title": "Theory: Capacitors & RC Circuits"},
            {"slug": "wheatstone-bridge", "title": "Measurement: Wheatstone Bridge"}
          ]
        },
        {
          "sem": "Year 2 (Electrical Machines & Control)",
          "tools": [
            {"slug": "dc-motor", "title": "Machines Practical: DC Motor Rig"},
            {"slug": "transformer", "title": "Machines Practical: Transformer Testing"},
            {"slug": "ac-generator", "title": "Machines Practical: AC Alternator"},
            {"slug": "star-delta", "title": "Control Practical: Star-Delta Starter"},
            {"slug": "plc-ladder-logic", "title": "Automation: PLC Ladder Logic"}
          ]
        }
      ]
    }
  ];

  function rootPrefix() {
    var segs = location.pathname.split('/').filter(Boolean);
    var dirDepth = Math.max(0, segs.length - 1);
    var p = '';
    for (var i = 0; i < dirDepth; i++) p += '../';
    return p;
  }
  var ROOT = rootPrefix();

  var css =
    '#sim-sidebar{position:fixed;top:0;left:0;height:100vh;width:320px;max-width:88vw;' +
    'background:#0f1320;color:#dce3f0;box-shadow:4px 0 24px rgba(0,0,0,.6);' +
    'transform:translateX(-100%);transition:transform .25s ease;z-index:9999;' +
    'display:flex;flex-direction:column;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:13.5px}' +
    'body.sim-sidebar-open #sim-sidebar{transform:translateX(0)}' +
    '#sim-sidebar .sb-head{padding:12px 14px 10px;border-bottom:1px solid #1e2740;' +
    'position:sticky;top:0;background:#0f1320;z-index:2}' +
    '#sim-sidebar .sb-brand{font-weight:800;font-size:15px;color:#7aa2ff;letter-spacing:.3px}' +
    '#sim-sidebar .sb-sub{font-size:11px;color:#6b7a99;margin-top:2px}' +
    '#sim-sidebar .sb-mode-toggle{display:flex;background:#080b14;border:1px solid #1e2740;border-radius:8px;padding:3px;margin-top:8px;gap:3px}' +
    '#sim-sidebar .sb-toggle-btn{flex:1;border:none;background:transparent;color:#6b7a99;padding:6px 4px;font-size:11.5px;font-weight:600;border-radius:6px;cursor:pointer;transition:all .18s;text-align:center}' +
    '#sim-sidebar .sb-toggle-btn.active{background:#29b6f6;color:#080c14;font-weight:700;box-shadow:0 0 10px rgba(41,182,246,.35)}' +
    '#sim-sidebar .sb-search{margin-top:8px;width:100%;box-sizing:border-box;padding:7px 10px;' +
    'border-radius:7px;border:1px solid #1e2740;background:#0a0d18;color:#dce3f0;outline:none;font-size:12.5px}' +
    '#sim-sidebar .sb-search:focus{border-color:#29b6f6}' +
    '#sim-sidebar .sb-body{overflow-y:auto;padding:8px 6px 24px;flex:1}' +
    '#sim-sidebar details{border-bottom:1px solid #161d33}' +
    '#sim-sidebar summary{cursor:pointer;padding:9px 10px;font-weight:700;color:#cdd7ee;' +
    'list-style:none;display:flex;justify-content:space-between;align-items:center}' +
    '#sim-sidebar summary::-webkit-details-marker{display:none}' +
    '#sim-sidebar summary .sb-count{font-size:11px;color:#6b7a99;font-weight:600}' +
    '#sim-sidebar summary:hover{background:#141b30}' +
    '#sim-sidebar .sb-list{margin:0;padding:0 0 6px}' +
    '#sim-sidebar .sb-list a{display:block;padding:5px 10px 5px 20px;color:#aab6d4;' +
    'text-decoration:none;border-radius:6px;margin:1px 4px;font-size:12.5px}' +
    '#sim-sidebar .sb-list a:hover{background:#1b2540;color:#fff}' +
    '#sim-sidebar-toggle{position:fixed;top:12px;left:12px;z-index:10001;width:40px;height:40px;' +
    'border:none;border-radius:10px;background:#0f1320;color:#29b6f6;font-size:18px;' +
    'cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5);display:flex;align-items:center;' +
    'justify-content:center}' +
    'body.sim-sidebar-open #sim-sidebar-toggle{left:332px}';

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
  sub.textContent = 'Interactive Engineering Simulations';
  head.appendChild(brand);
  head.appendChild(sub);

  var modeToggle = document.createElement('div');
  modeToggle.className = 'sb-mode-toggle';
  
  var btnCat = document.createElement('button');
  btnCat.className = 'sb-toggle-btn active';
  btnCat.textContent = '📁 By Category';
  
  var btnCourse = document.createElement('button');
  btnCourse.className = 'sb-toggle-btn';
  btnCourse.textContent = '🎓 By Course / Sem';
  
  modeToggle.appendChild(btnCat);
  modeToggle.appendChild(btnCourse);
  head.appendChild(modeToggle);

  var search = document.createElement('input');
  search.className = 'sb-search';
  search.placeholder = 'Search simulations or subjects…';
  search.setAttribute('aria-label', 'Search simulations');
  head.appendChild(search);
  sidebar.appendChild(head);

  var bodyEl = document.createElement('div');
  bodyEl.className = 'sb-body';
  sidebar.appendChild(bodyEl);

  var activeMode = 'cat';

  function renderCategoryView(filterText) {
    bodyEl.innerHTML = '';
    filterText = (filterText || '').toLowerCase().trim();

    CATEGORY_DATA.forEach(function (cat) {
      var matchingTools = cat.tools.filter(function (t) {
        return !filterText || t.title.toLowerCase().indexOf(filterText) !== -1 || t.slug.indexOf(filterText) !== -1;
      });

      if (matchingTools.length === 0) return;

      var det = document.createElement('details');
      det.open = true;
      var sum = document.createElement('summary');
      var sname = document.createElement('span');
      sname.textContent = cat.name;
      var cnt = document.createElement('span');
      cnt.className = 'sb-count';
      cnt.textContent = matchingTools.length;
      sum.appendChild(sname);
      sum.appendChild(cnt);
      det.appendChild(sum);

      var ul = document.createElement('div');
      ul.className = 'sb-list';
      matchingTools.forEach(function (t) {
        var a = document.createElement('a');
        a.textContent = t.title;
        a.href = ROOT + 'tools/' + t.slug + '/index.html';
        ul.appendChild(a);
      });
      det.appendChild(ul);
      bodyEl.appendChild(det);
    });
  }

  function renderCourseView(filterText) {
    bodyEl.innerHTML = '';
    filterText = (filterText || '').toLowerCase().trim();

    COURSE_DATA.forEach(function (cData) {
      var courseDet = document.createElement('details');
      courseDet.open = true;

      var courseSum = document.createElement('summary');
      var cName = document.createElement('span');
      cName.textContent = cData.course;
      courseSum.appendChild(cName);
      courseDet.appendChild(courseSum);

      var hasContent = false;

      cData.semesters.forEach(function (sem) {
        var matchingTools = sem.tools.filter(function (t) {
          return !filterText || t.title.toLowerCase().indexOf(filterText) !== -1 || sem.sem.toLowerCase().indexOf(filterText) !== -1 || cData.course.toLowerCase().indexOf(filterText) !== -1;
        });

        if (matchingTools.length === 0) return;
        hasContent = true;

        var semDet = document.createElement('details');
        semDet.open = true;
        semDet.style.marginLeft = '8px';

        var semSum = document.createElement('summary');
        semSum.style.fontSize = '12px';
        semSum.style.color = '#7aa2ff';

        var sName = document.createElement('span');
        sName.textContent = sem.sem;
        var cnt = document.createElement('span');
        cnt.className = 'sb-count';
        cnt.textContent = matchingTools.length;

        semSum.appendChild(sName);
        semSum.appendChild(cnt);
        semDet.appendChild(semSum);

        var ul = document.createElement('div');
        ul.className = 'sb-list';
        matchingTools.forEach(function (t) {
          var a = document.createElement('a');
          a.textContent = t.title;
          a.href = ROOT + 'tools/' + t.slug + '/index.html';
          ul.appendChild(a);
        });
        semDet.appendChild(ul);
        courseDet.appendChild(semDet);
      });

      if (hasContent) {
        bodyEl.appendChild(courseDet);
      }
    });
  }

  renderCategoryView();

  btnCat.addEventListener('click', function () {
    activeMode = 'cat';
    btnCat.classList.add('active');
    btnCourse.classList.remove('active');
    renderCategoryView(search.value);
  });

  btnCourse.addEventListener('click', function () {
    activeMode = 'course';
    btnCourse.classList.add('active');
    btnCat.classList.remove('active');
    renderCourseView(search.value);
  });

  search.addEventListener('input', function () {
    if (activeMode === 'cat') renderCategoryView(search.value);
    else renderCourseView(search.value);
  });

  document.body.appendChild(sidebar);

  var toggleBtn = document.createElement('button');
  toggleBtn.id = 'sim-sidebar-toggle';
  toggleBtn.innerHTML = '☰';
  toggleBtn.setAttribute('aria-label', 'Toggle simulation menu');
  document.body.appendChild(toggleBtn);

  toggleBtn.addEventListener('click', function () {
    document.body.classList.toggle('sim-sidebar-open');
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('sim-sidebar-open')) {
      document.body.classList.remove('sim-sidebar-open');
    }
  });

})();