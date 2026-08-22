// NHIT VisualLab — Dual-Mode Overlay Sidebar (Context Aware & Persistent State)
(function () {
  var CATEGORY_DATA = [{"name": "🧪 Virtual Lab Testing", "tools": [{"slug": "utm-testing", "title": "UTM Virtual Lab"}, {"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "fatigue-testing", "title": "Fatigue Testing Virtual Lab"}, {"slug": "torsion-testing", "title": "Torsion Test Virtual Lab"}, {"slug": "litmus-test", "title": "Litmus Paper Test — Colour Chart & Virtual Lab"}, {"slug": "pneumatic-circuit", "title": "Pneumatic Circuit Simulator"}, {"slug": "electro-pneumatic-circuit", "title": "Electro-Pneumatic Circuit Simulator"}, {"slug": "ray-optics", "title": "Ray Optics Simulator & Trainer"}, {"slug": "refraction", "title": "Refraction of Light Simulator — Snell’s Law, Critical Angle & Prisms"}, {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test Simulator"}, {"slug": "centrifugal-pump", "title": "Centrifugal Pump Test Rig Simulator"}, {"slug": "hydraulic-turbine", "title": "Hydraulic Turbine Test Rig Simulator"}]}, {"name": "Measuring Instruments", "tools": [{"slug": "vernier-caliper", "title": "Vernier Caliper Simulator"}, {"slug": "screw-gauge", "title": "Screw Gauge Simulator"}, {"slug": "height-gauge", "title": "Vernier Height Gauge Simulator"}, {"slug": "dial-gauge", "title": "Dial Gauge Simulator"}, {"slug": "steel-ruler", "title": "Steel Ruler Simulator"}, {"slug": "bevel-protractor", "title": "Bevel Protractor — Least Count & Vernier Reading"}, {"slug": "protractor", "title": "Online Protractor Simulator"}, {"slug": "pressure-gauge", "title": "Pressure Gauge Simulator"}]}, {"name": "Mechanics & Motion", "tools": [{"slug": "newtons-laws", "title": "Newton’s Laws of Motion"}, {"slug": "projectile-motion", "title": "Projectile Motion Calculator & Simulator"}, {"slug": "free-fall", "title": "Free Fall Simulator"}, {"slug": "friction", "title": "Friction & Contact Forces Simulator"}, {"slug": "hookes-law", "title": "Hooke’s Law Simulator"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "vibrations", "title": "Spring-Mass-Damper Simulator"}, {"slug": "torque-rotation", "title": "Torque & Rotational Motion Simulator"}, {"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "gyroscope", "title": "Gyroscope Simulator"}, {"slug": "simple-machines", "title": "Simple Machines Simulator"}, {"slug": "buoyancy", "title": "Buoyancy & Archimedes’ Principle Simulator"}, {"slug": "collision-momentum", "title": "Collision & Momentum Simulator — Elastic, Inelastic & 2D Collisions"}, {"slug": "simple-pendulum", "title": "Simple Pendulum Simulator"}, {"slug": "free-body-diagram", "title": "Free Body Diagram & Force Resolver"}, {"slug": "escape-velocity", "title": "Escape Velocity Simulator"}, {"slug": "bearing-life", "title": "Bearing Life Calculator"}, {"slug": "gear-strength", "title": "Gear Strength Calculator"}, {"slug": "hydraulic-cylinder", "title": "Hydraulic Cylinder Simulator"}]}, {"name": "Mechanisms & Machines", "tools": [{"slug": "four-bar-linkage", "title": "Four-Bar Linkage Simulator"}, {"slug": "slider-crank", "title": "Slider-Crank Mechanism"}, {"slug": "cam-follower", "title": "Cam & Follower Mechanism"}, {"slug": "gear-trains", "title": "Gear Train Calculator"}, {"slug": "belt-drive", "title": "Belt & Chain Drive"}, {"slug": "scotch-yoke", "title": "Scotch Yoke Mechanism"}, {"slug": "geneva-mechanism", "title": "Geneva Mechanism Animation & Simulator"}, {"slug": "centrifugal-governor", "title": "Centrifugal Governor Simulator"}, {"slug": "flywheel", "title": "Flywheel Energy Storage"}, {"slug": "bearing-selection", "title": "Bearing Selection Calculator"}, {"slug": "governor", "title": "Governor Mechanism Simulator"}, {"slug": "flywheel-energy", "title": "Flywheel Energy Calculator"}]}, {"name": "Strength of Materials", "tools": [{"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "hookes-law", "title": "Hooke’s Law Simulator"}, {"slug": "utm-testing", "title": "UTM Virtual Lab"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "fatigue-testing", "title": "Fatigue Testing Virtual Lab"}, {"slug": "mohrs-circle", "title": "Mohr's Circle Calculator"}, {"slug": "stress-concentration", "title": "Stress Concentration Factor (Kt) Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "beam-bending", "title": "Beam Bending Simulator — SFD, BMD & Deflection"}, {"slug": "truss-analysis", "title": "Truss Analysis — Method of Joints"}, {"slug": "shaft-torsion", "title": "Shaft Torsion Calculator"}, {"slug": "column-buckling", "title": "Column Buckling Calculator"}, {"slug": "pressure-vessel", "title": "Hoop Stress Calculator — Thin-Walled Pressure Vessel"}, {"slug": "spring-design", "title": "Spring Design Calculator"}, {"slug": "bolted-joint", "title": "Bolt Torque & Preload Calculator"}, {"slug": "riveted-joints", "title": "Types of Riveted Joints"}, {"slug": "rivet-joint-designer", "title": "Rivet Joint Design & Failure Mode Simulator"}, {"slug": "torsion-testing", "title": "Torsion Test Virtual Lab"}, {"slug": "power-screw", "title": "Power Screw Calculator"}, {"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "crack-propagation", "title": "Crack Propagation & Critical Crack Length"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}]}, {"name": "Thermal & Fluid Engineering", "tools": [{"slug": "thermodynamics", "title": "Thermodynamic Cycles Simulator"}, {"slug": "ideal-gas-law", "title": "Ideal Gas Law Calculator & Simulator"}, {"slug": "boyles-law", "title": "Boyle's Law Simulator"}, {"slug": "charles-law", "title": "Charles' Law Simulator"}, {"slug": "heat-transfer", "title": "Heat Transfer Calculator — Conduction, Convection & Radiation"}, {"slug": "heat-exchanger", "title": "LMTD & NTU Heat Exchanger Calculator"}, {"slug": "bernoullis-principle", "title": "Bernoulli’s Principle Simulator"}, {"slug": "fluid-flow", "title": "Pipe Pressure Drop Calculator — Darcy-Weisbach"}, {"slug": "reynolds-number", "title": "Reynolds Number Calculator"}, {"slug": "pascals-law", "title": "Pascal’s Law Simulator"}, {"slug": "wind-tunnel", "title": "Wind Tunnel Simulator"}, {"slug": "thermal-power-plant", "title": "Thermal Power Plant Simulator"}, {"slug": "nuclear-power-plant", "title": "Nuclear Power Plant Simulator (PWR)"}, {"slug": "psychrometric-chart", "title": "Interactive Psychrometric Chart Calculator"}, {"slug": "rankine-cycle", "title": "Rankine Cycle Simulator"}, {"slug": "refrigeration-cycle", "title": "Refrigeration Cycle Simulator"}, {"slug": "four-stroke-engine", "title": "Four Stroke Engine Simulator"}, {"slug": "two-stroke-engine", "title": "Two Stroke Engine Simulator"}, {"slug": "buoyancy", "title": "Buoyancy & Archimedes’ Principle Simulator"}, {"slug": "viscosity-experiment", "title": "Viscosity Experiment Virtual Lab"}, {"slug": "thermal-conductivity", "title": "Thermal Conductivity Calculator"}, {"slug": "continuity-equation", "title": "Continuity Equation Simulator"}, {"slug": "stefan-boltzmann", "title": "Stefan-Boltzmann Radiation Simulator"}, {"slug": "specific-heat-capacity", "title": "Specific Heat Capacity Table & Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}]}, {"name": "Power Plant Simulations", "tools": [{"slug": "thermal-power-plant", "title": "Thermal Power Plant Simulator"}, {"slug": "coal-gas-power-plant", "title": "Coal & Gas Power Plant Simulator"}, {"slug": "nuclear-power-plant", "title": "Nuclear Power Plant Simulator (PWR)"}]}, {"name": "⚡ Basic Electrical Simulations", "tools": [{"slug": "ohms-law", "title": "Ohm’s Law Calculator & DC Circuit Builder"}, {"slug": "wheatstone-bridge", "title": "Wheatstone Bridge Simulator & Calculator"}, {"slug": "kirchhoff-solver", "title": "Kirchhoff’s Law Calculator — KCL & KVL"}, {"slug": "rc-circuit", "title": "RC Circuit — Capacitor Charging & Discharging"}, {"slug": "rlc-circuit", "title": "RLC Circuit — AC Circuit Analysis"}, {"slug": "capacitor-bank", "title": "Capacitor Bank Simulator"}, {"slug": "ac-generator", "title": "AC Generator Simulator"}, {"slug": "transformer", "title": "Transformer — Step-Up & Step-Down"}, {"slug": "dc-motor", "title": "DC Motor Simulator"}, {"slug": "diode-rectifier", "title": "Diode & Rectifier Circuits"}, {"slug": "bjt-transistor", "title": "BJT Transistor Simulator"}, {"slug": "star-delta", "title": "Star-Delta (Y-Δ) Conversion"}, {"slug": "logic-gates", "title": "Logic Gates Simulator"}, {"slug": "karnaugh-map", "title": "Karnaugh Map Solver"}, {"slug": "electrical-wiring", "title": "House Wiring Simulator — Practice Home Electrical Circuits"}, {"slug": "resistor-color-code", "title": "Resistor Color Code Calculator"}, {"slug": "faradays-law", "title": "Faraday's Law Simulator"}, {"slug": "plc-ladder-logic", "title": "PLC Ladder Logic Simulator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}, {"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "heat-transfer", "title": "Heat Transfer Calculator — Conduction, Convection & Radiation"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "beam-bending", "title": "Beam Bending Simulator — SFD, BMD & Deflection"}]}, {"name": "Workshop & Manufacturing", "tools": [{"slug": "lathe-machine", "title": "Lathe Machine Simulator"}, {"slug": "milling-machine", "title": "Milling Machine Simulator"}, {"slug": "drilling-machine", "title": "Drilling Machine Simulator"}, {"slug": "hydraulic-circuit", "title": "Hydraulic Circuit Simulator and Trainer"}, {"slug": "pneumatic-circuit", "title": "Pneumatic Circuit Simulator"}, {"slug": "electro-pneumatic-circuit", "title": "Electro-Pneumatic Circuit Simulator"}, {"slug": "plc-ladder-logic", "title": "PLC Ladder Logic Simulator"}, {"slug": "cnc-gcode", "title": "CNC G-Code Simulator"}, {"slug": "bolted-joint", "title": "Bolt Torque & Preload Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}, {"slug": "welding-symbols", "title": "Welding Symbols Chart & Interactive Trainer"}, {"slug": "riveted-joints", "title": "Types of Riveted Joints"}, {"slug": "gdt-trainer", "title": "GD&T Symbols Chart & Trainer"}, {"slug": "thread-nomenclature", "title": "Thread Nomenclature & Metric Thread Chart"}, {"slug": "tolerance-fits", "title": "Tolerance & Fits Calculator"}, {"slug": "bend-radius", "title": "Sheet Metal Bend Radius & Bend Allowance Calculator"}, {"slug": "rivet-joint-designer", "title": "Rivet Joint Design & Failure Mode Simulator"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "machining-calculator", "title": "Speeds and Feeds Calculator"}]}, {"name": "Engineering Calculators", "tools": [{"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "column-buckling", "title": "Column Buckling Calculator"}, {"slug": "power-screw", "title": "Power Screw Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}, {"slug": "stress-concentration", "title": "Stress Concentration Factor (Kt) Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "machining-calculator", "title": "Speeds and Feeds Calculator"}, {"slug": "spring-design", "title": "Spring Design Calculator"}, {"slug": "tolerance-fits", "title": "Tolerance & Fits Calculator"}, {"slug": "bend-radius", "title": "Sheet Metal Bend Radius & Bend Allowance Calculator"}, {"slug": "gear-trains", "title": "Gear Train Calculator"}, {"slug": "bearing-life", "title": "Bearing Life Calculator"}, {"slug": "gear-strength", "title": "Gear Strength Calculator"}, {"slug": "heat-exchanger", "title": "LMTD & NTU Heat Exchanger Calculator"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "hydraulic-cylinder", "title": "Hydraulic Cylinder Simulator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}]}, {"name": "🔬 Basic Science", "tools": [{"slug": "collision-momentum", "title": "Collision & Momentum Simulator — Elastic, Inelastic & 2D Collisions"}, {"slug": "balance-chemical-equations", "title": "Balancing Chemical Equations"}, {"slug": "build-your-atom", "title": "Build Your Atom"}, {"slug": "ray-optics", "title": "Ray Optics Simulator & Trainer"}, {"slug": "refraction", "title": "Refraction of Light Simulator — Snell’s Law, Critical Angle & Prisms"}, {"slug": "titration", "title": "Titration Simulator — Acid-Base Curve, Indicators & Calculator"}, {"slug": "litmus-test", "title": "Litmus Paper Test — Colour Chart & Virtual Lab"}, {"slug": "newtons-laws", "title": "Newton’s Laws of Motion"}, {"slug": "projectile-motion", "title": "Projectile Motion Calculator & Simulator"}, {"slug": "free-fall", "title": "Free Fall Simulator"}, {"slug": "boyles-law", "title": "Boyle's Law Simulator"}, {"slug": "charles-law", "title": "Charles' Law Simulator"}, {"slug": "ideal-gas-law", "title": "Ideal Gas Law Calculator & Simulator"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "hookes-law", "title": "Hooke’s Law Simulator"}, {"slug": "friction", "title": "Friction & Contact Forces Simulator"}, {"slug": "pascals-law", "title": "Pascal’s Law Simulator"}, {"slug": "bernoullis-principle", "title": "Bernoulli’s Principle Simulator"}, {"slug": "specific-heat-capacity", "title": "Specific Heat Capacity Table & Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "faradays-law", "title": "Faraday's Law Simulator"}]}, {"name": "𝑓(x) Mathematics & Graphing Tools", "tools": [{"slug": "math-graphing", "title": "Math Function Graph Generator"}, {"slug": "logic-gates", "title": "Logic Gates Simulator"}, {"slug": "karnaugh-map", "title": "Karnaugh Map Solver"}, {"slug": "calculus-visualizer", "title": "Calculus Visualizer & Simulator"}, {"slug": "matrix-multiplication", "title": "Matrix Calculator and Operations Simulator"}, {"slug": "area-calculator", "title": "Area Calculator"}]}, {"name": "Other Simulations", "tools": [{"slug": "automotive-clutch", "title": "Automotive Friction Clutch Simulator"}, {"slug": "automotive-differential", "title": "Automotive Differential Mechanism Simulator"}, {"slug": "chemical-bonds", "title": "Chemical Bond Simulator"}, {"slug": "chemical-mixing", "title": "Chemical Mixing Simulation — Mix Acids & Bases"}, {"slug": "moment-of-inertia-angle", "title": "Moment of Inertia of an Angle Section"}, {"slug": "moment-of-inertia-channel", "title": "Moment of Inertia of a Channel Section"}, {"slug": "moment-of-inertia-circle", "title": "Moment of Inertia of a Circle"}, {"slug": "moment-of-inertia-hollow-circle", "title": "Moment of Inertia of a Hollow Circle"}, {"slug": "moment-of-inertia-hollow-rect", "title": "Moment of Inertia of a Hollow Rectangle"}, {"slug": "moment-of-inertia-i-beam", "title": "Moment of Inertia of an I-Beam"}, {"slug": "moment-of-inertia-rectangle", "title": "Moment of Inertia of a Rectangle"}, {"slug": "moment-of-inertia-t-section", "title": "Moment of Inertia of a T-Section"}, {"slug": "phase-change", "title": "Phase Change & Latent Heat Simulator"}, {"slug": "steering-geometry", "title": "Steering Geometry & Wheel Alignment Simulator"}, {"slug": "thermal-power-plant-diagram", "title": "Thermal Power Plant"}, {"slug": "valve-timing-diagram", "title": "Valve Timing Diagram Simulator"}]}];
  var COURSE_DATA = [{"course": "🏎️ Automobile Engg.", "semesters": [{"sem": "Semester 3 (Syllabus Mapped)", "tools": [{"slug": "valve-timing-diagram", "title": "Valve Timing Diagram Simulator (S.I. & C.I.)"}, {"slug": "automotive-differential", "title": "Automotive Differential Mechanism Simulator"}, {"slug": "automotive-clutch", "title": "Automotive Friction Clutch Simulator"}, {"slug": "four-stroke-engine", "title": "Four Stroke Petrol & Diesel Engine"}, {"slug": "two-stroke-engine", "title": "Two Stroke Engine Simulator"}, {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test"}, {"slug": "thermodynamics", "title": "Heat Power: Otto, Diesel & Dual Cycles"}, {"slug": "ideal-gas-law", "title": "Gas Laws: Boyle's & Charles's Law"}, {"slug": "heat-transfer", "title": "Heat Transfer (Conduction & Convection)"}, {"slug": "heat-exchanger", "title": "LMTD Heat Exchanger Simulator"}, {"slug": "stress-strain", "title": "Advanced SOM: Stress-Strain Curve"}, {"slug": "utm-testing", "title": "Advanced SOM: UTM Tensile Test Lab"}, {"slug": "mohrs-circle", "title": "Advanced SOM: Mohr's Circle Diagram"}, {"slug": "beam-bending", "title": "Advanced SOM: Bending Stresses & SFD/BMD"}, {"slug": "shaft-torsion", "title": "Advanced SOM: Shaft Torsion Calculator"}, {"slug": "spring-design", "title": "Advanced SOM: Helical Springs Design"}, {"slug": "pressure-vessel", "title": "Advanced SOM: Thin Cylinders Hoop Stress"}, {"slug": "diode-rectifier", "title": "Electronics Lab: Diodes & Rectifiers"}, {"slug": "bjt-transistor", "title": "Electronics Lab: BJT Transistor"}, {"slug": "logic-gates", "title": "Electronics Lab: Logic Gates & Flip-Flops"}, {"slug": "lathe-machine", "title": "Manufacturing: Lathe Machine Simulator"}, {"slug": "milling-machine", "title": "Manufacturing: Milling Machine Simulator"}, {"slug": "drilling-machine", "title": "Manufacturing: Drilling Machine"}, {"slug": "tolerance-fits", "title": "Auto Drawing: Limits, Fits & Tolerances"}, {"slug": "gdt-trainer", "title": "Auto Drawing: GD&T Symbols Chart"}]}, {"sem": "Semester 4 (Syllabus Mapped)", "tools": [{"slug": "refrigeration-cycle", "title": "HPE II: Air Conditioning & Vapor Compression"}, {"slug": "psychrometric-chart", "title": "HPE II: Psychrometric Chart Calculator"}, {"slug": "rankine-cycle", "title": "HPE II: Steam Turbines & Rankine Cycle"}, {"slug": "thermal-power-plant", "title": "HPE II: Thermal Power Generation"}, {"slug": "coal-gas-power-plant", "title": "HPE II: Gas Turbines Power Plant"}, {"slug": "four-stroke-engine", "title": "Advanced Engines: MPFI & CRDI Fuel Injection"}, {"slug": "valve-timing-diagram", "title": "Advanced Engines: Valve Timing"}, {"slug": "automotive-differential", "title": "Transmission: Rear Axle & Differential"}, {"slug": "automotive-clutch", "title": "Transmission: Friction Clutches"}, {"slug": "gear-trains", "title": "Transmission: Manual Transmissions & Gear Ratios"}, {"slug": "gear-strength", "title": "Transmission: Gear Strength Calculator"}, {"slug": "bend-radius", "title": "Manufacturing: Press Tools, Punching & Blanking"}, {"slug": "machining-calculator", "title": "Manufacturing: Speeds & Feeds Calculator"}, {"slug": "four-bar-linkage", "title": "TOM: Four-Bar Kinematic Linkage"}, {"slug": "slider-crank", "title": "TOM: Slider-Crank Velocity Analysis"}, {"slug": "cam-follower", "title": "TOM: Cam Profile & Follower"}, {"slug": "centrifugal-governor", "title": "TOM: Governors"}, {"slug": "flywheel", "title": "TOM: Flywheel Energy Storage"}, {"slug": "bearing-life", "title": "TOM: Bearing Life Calculator"}]}, {"sem": "Semester 5 (Syllabus Mapped)", "tools": [{"slug": "steering-geometry", "title": "Chassis II: Steering Geometry & Alignment (Ackermann, Camber)"}, {"slug": "hydraulic-circuit", "title": "Chassis II & Lab: Hydraulic Brake Systems & Valves"}, {"slug": "pneumatic-circuit", "title": "Chassis II & Lab: Air Brake Systems & Pneumatics"}, {"slug": "electro-pneumatic-circuit", "title": "Hydraulics & Lab: Electro-Pneumatic Circuit"}, {"slug": "hydraulic-cylinder", "title": "Hydraulics & Lab: Hydraulic Cylinders & Actuators"}, {"slug": "spring-design", "title": "Component Design: Helical & Leaf Springs"}, {"slug": "shaft-torsion", "title": "Component Design: Transmission Shafts & Keys"}, {"slug": "power-screw", "title": "Component Design: Power Screws"}, {"slug": "bolted-joint", "title": "Component Design: Bolted Joints"}, {"slug": "weld-strength", "title": "Component Design: Welded Joints"}, {"slug": "rivet-joint-designer", "title": "Component Design: Riveted Joints"}, {"slug": "stress-concentration", "title": "Component Design: Stress Concentration Factor (Kt)"}, {"slug": "dc-motor", "title": "Auto Electricals: Starter Motor & DC Generator"}, {"slug": "ac-generator", "title": "Auto Electricals: Alternator Charging System"}, {"slug": "electrical-wiring", "title": "Auto Electricals: Harness & Lighting Wiring"}, {"slug": "diode-rectifier", "title": "Auto Electricals: ECU Rectifiers & Diodes"}, {"slug": "wind-tunnel", "title": "Elective: Vehicle Aerodynamics & Drag Cd"}, {"slug": "fluid-flow", "title": "Elective: Aerodynamic Flow & Pressure Drop"}, {"slug": "reynolds-number", "title": "Elective: Vehicle Boundary Layer Reynolds Number"}]}, {"sem": "Semester 6 (Syllabus Mapped)", "tools": [{"slug": "lathe-machine", "title": "Maintenance: Engine & Component Overhauling"}, {"slug": "milling-machine", "title": "Maintenance: Garage Machine Tools"}, {"slug": "drilling-machine", "title": "Maintenance: Drilling Operations"}, {"slug": "vernier-caliper", "title": "Maintenance: Precision Measuring Instruments"}, {"slug": "dial-gauge", "title": "Maintenance: Cylinder Bore & Shaft Runout Gauge"}, {"slug": "cnc-gcode", "title": "CAD/CAM Elective: CNC G-Code Programming"}, {"slug": "plc-ladder-logic", "title": "CAD/CAM Elective: Automated Assembly PLC"}, {"slug": "refrigeration-cycle", "title": "Auto AC Elective: VCRS Automobile Air Conditioning"}, {"slug": "psychrometric-chart", "title": "Auto AC Elective: Psychrometric Chart Calculator"}, {"slug": "heat-exchanger", "title": "Auto AC Elective: Evaporator & Condenser Heat Exchanger"}, {"slug": "nuclear-power-plant", "title": "Alternate Energy Elective: Nuclear Power Generation"}, {"slug": "capacitor-bank", "title": "Alternate Energy Elective: EV Battery Supercapacitors"}]}]}, {"course": "🏗️ Civil Engg.", "semesters": [{"sem": "Semester 3 & 4 (SOM & Hydraulics)", "tools": [{"slug": "stress-strain", "title": "SOM: Stress-Strain Diagram"}, {"slug": "utm-testing", "title": "SOM: UTM Concrete & Steel Test"}, {"slug": "beam-bending", "title": "SOM: Beam Bending, SFD & BMD"}, {"slug": "truss-analysis", "title": "SOM: Truss Analysis Method of Joints"}, {"slug": "bernoullis-principle", "title": "Hydraulics: Bernoulli’s Theorem"}, {"slug": "fluid-flow", "title": "Hydraulics: Pipe Friction & Pressure Drop"}, {"slug": "viscosity-experiment", "title": "Hydraulics: Viscosity Lab"}]}, {"sem": "Semester 5 & 6 (Structural & Geotech)", "tools": [{"slug": "mohrs-circle", "title": "Soil Mechanics: Mohr's Circle"}, {"slug": "column-buckling", "title": "Structures: Column Buckling"}, {"slug": "weld-strength", "title": "Steel Structures: Welded Joints"}, {"slug": "riveted-joints", "title": "Steel Structures: Riveted Joints"}, {"slug": "area-calculator", "title": "Surveying: Cross-Section Area"}]}]}, {"course": "💻 Computer Sc & Tech.", "semesters": [{"sem": "Semester 3 & 4 (Digital & Math)", "tools": [{"slug": "logic-gates", "title": "Digital Circuits: Logic Gates Simulator"}, {"slug": "karnaugh-map", "title": "Digital Logic: Karnaugh Map Minimizer"}, {"slug": "math-graphing", "title": "Mathematics: Function Grapher"}, {"slug": "calculus-visualizer", "title": "Mathematics: Calculus Visualizer"}, {"slug": "matrix-multiplication", "title": "Linear Algebra: Matrix Calculator"}]}, {"sem": "Semester 5 & 6 (Hardware & Embedded)", "tools": [{"slug": "plc-ladder-logic", "title": "Embedded Systems: PLC Ladder Logic"}, {"slug": "cnc-gcode", "title": "Computer Integrated Manufacturing: CNC G-Code"}]}]}, {"course": "⚡ Electrical Engg.", "semesters": [{"sem": "Semester 3 (Circuit Theory & Measurement)", "tools": [{"slug": "ohms-law", "title": "Circuits: Ohm's Law & DC Circuits"}, {"slug": "wheatstone-bridge", "title": "Measurements: Wheatstone Bridge"}, {"slug": "kirchhoff-solver", "title": "Circuits: KCL & KVL Solver"}, {"slug": "rc-circuit", "title": "Circuits: RC Circuit Transient Response"}, {"slug": "rlc-circuit", "title": "Circuits: RLC Resonance & AC"}, {"slug": "resistor-color-code", "title": "Components: Resistor Color Code"}]}, {"sem": "Semester 4 & 5 (Machines & Power)", "tools": [{"slug": "dc-motor", "title": "Electrical Machines: DC Motor Rig"}, {"slug": "transformer", "title": "Electrical Machines: Step-Up/Down Transformer"}, {"slug": "ac-generator", "title": "Electrical Machines: Alternator AC Generator"}, {"slug": "star-delta", "title": "Machines: Star-Delta (Y-Δ) Starter"}, {"slug": "thermal-power-plant", "title": "Power Generation: Thermal Power Plant"}, {"slug": "nuclear-power-plant", "title": "Power Generation: Nuclear Power Plant (PWR)"}]}]}, {"course": "📡 Electronics & Telecomm Engg.", "semesters": [{"sem": "Semester 3 & 4 (Analog & Digital)", "tools": [{"slug": "diode-rectifier", "title": "Analog: Diode Rectifier & Filter"}, {"slug": "bjt-transistor", "title": "Analog: BJT Transistor Amplifier"}, {"slug": "logic-gates", "title": "Digital: Logic Gates & Flip-Flops"}, {"slug": "karnaugh-map", "title": "Digital: K-Map Logic Simplifier"}, {"slug": "thermocouple", "title": "Instrumentation: Thermocouple Sensors"}]}, {"sem": "Semester 5 & 6 (Optics & Signals)", "tools": [{"slug": "ray-optics", "title": "Optical Fiber: Ray Optics Simulator"}, {"slug": "refraction", "title": "Optics: Refraction & Snell's Law"}]}]}, {"course": "⚙️ Mechanical Engg.", "semesters": [{"sem": "Semester 3 & 4 (Thermal, Fluid & Manufacturing)", "tools": [{"slug": "thermodynamics", "title": "Thermodynamics: Otto & Diesel Cycles"}, {"slug": "four-stroke-engine", "title": "IC Engines: 4-Stroke Engine"}, {"slug": "two-stroke-engine", "title": "IC Engines: 2-Stroke Engine"}, {"slug": "bernoullis-principle", "title": "Fluid Mechanics: Bernoulli's Principle"}, {"slug": "fluid-flow", "title": "Fluid Mechanics: Pipe Flow Friction"}, {"slug": "reynolds-number", "title": "Fluid Mechanics: Reynolds Number"}, {"slug": "pascals-law", "title": "Fluid Power: Pascal's Law Hydraulic Press"}, {"slug": "lathe-machine", "title": "Workshop: Lathe Turning Operations"}, {"slug": "milling-machine", "title": "Workshop: Milling Cutter Operations"}, {"slug": "drilling-machine", "title": "Workshop: Drilling & Boring Operations"}]}, {"sem": "Semester 5 & 6 (Kinematics, SOM & Design)", "tools": [{"slug": "four-bar-linkage", "title": "Theory of Machines: Four-Bar Linkage"}, {"slug": "slider-crank", "title": "Theory of Machines: Slider Crank"}, {"slug": "cam-follower", "title": "Theory of Machines: Cam & Follower"}, {"slug": "gear-trains", "title": "Theory of Machines: Gear Trains"}, {"slug": "belt-drive", "title": "Theory of Machines: Belt Drives"}, {"slug": "beam-bending", "title": "SOM: Beam Deflection & Bending"}, {"slug": "mohrs-circle", "title": "SOM: Mohr's Stress Circle"}, {"slug": "spring-design", "title": "Machine Design: Springs Design"}, {"slug": "bearing-selection", "title": "Machine Design: Rolling Bearings"}]}]}];

  // Detect current active tool slug from URL
  function getCurrentSlug() {
    var p = location.pathname;
    var m = p.match(/\/tools\/([^\/]+)/);
    return m ? m[1] : '';
  }
  var currentSlug = getCurrentSlug();

  // Smart root prefix resolution
  function getRootPrefix() {
    var p = location.pathname;
    var idx = p.indexOf('/nhitvisuallab');
    if (idx !== -1) {
      return p.substring(0, idx) + '/nhitvisuallab/';
    }
    var segs = p.split('/').filter(Boolean);
    if (segs.length <= 1) return './';
    var depth = segs.length - 1;
    var prefix = '';
    for (var i = 0; i < depth; i++) prefix += '../';
    return prefix;
  }
  var ROOT = getRootPrefix();

  // Session state helpers
  function getSavedState(key) {
    try {
      var raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function saveState(key, obj) {
    try {
      sessionStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {}
  }

  var css =
    '#sim-sidebar-backdrop{position:fixed;top:0;left:0;width:100vw;height:100vh;' +
    'background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);z-index:9998;opacity:0;pointer-events:none;transition:opacity .25s ease}' +
    'body.sim-sidebar-open #sim-sidebar-backdrop{opacity:1;pointer-events:auto}' +
    '#sim-sidebar{position:fixed;top:0;left:0;height:100vh;width:320px;max-width:88vw;' +
    'background:#001c24;color:#dce3f0;box-shadow:4px 0 24px rgba(0,0,0,.6);' +
    'transform:translateX(-100%);transition:transform .25s ease;z-index:9999;' +
    'display:flex;flex-direction:column;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:13.5px}' +
    'body.sim-sidebar-open #sim-sidebar{transform:translateX(0)}' +
    '#sim-sidebar .sb-head{padding:12px 14px 10px;border-bottom:1px solid #1e2740;' +
    'position:sticky;top:0;background:#001c24;z-index:2}' +
    '#sim-sidebar .sb-brand-row{display:flex;justify-content:space-between;align-items:center}' +
    '#sim-sidebar .sb-brand{font-weight:800;font-size:15px;color:#7aa2ff;letter-spacing:.3px}' +
    '#sim-sidebar .sb-close-btn{background:transparent;border:none;color:#6b7a99;font-size:22px;' +
    'line-height:1;cursor:pointer;padding:2px 6px;border-radius:4px;transition:all .15s}' +
    '#sim-sidebar .sb-close-btn:hover{color:#fff;background:#1e2740}' +
    '#sim-sidebar .sb-sub{font-size:11px;color:#6b7a99;margin-top:2px}' +
    '#sim-sidebar .sb-mode-toggle{display:flex;background:#00212b;border:1px solid #1e2740;border-radius:8px;padding:3px;margin-top:8px;gap:3px}' +

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
    '#sim-sidebar .sb-hint{font-size:10px;color:#56627f;padding:8px 12px}' +
    '#sim-sidebar-toggle{position:fixed;top:12px;left:12px;z-index:10001;width:40px;height:40px;' +
    'border:none;border-radius:10px;background:#0f1320;color:#29b6f6;font-size:18px;' +
    'cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5);display:flex;align-items:center;' +
    'justify-content:center;transition:left .25s ease}' +
    'body.sim-sidebar-open #sim-sidebar-toggle{left:332px}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var backdrop = document.createElement('div');
  backdrop.id = 'sim-sidebar-backdrop';
  document.body.appendChild(backdrop);

  var sidebar = document.createElement('aside');
  sidebar.id = 'sim-sidebar';

  var head = document.createElement('div');
  head.className = 'sb-head';

  var brandRow = document.createElement('div');
  brandRow.className = 'sb-brand-row';

  var brand = document.createElement('div');
  brand.className = 'sb-brand';
  brand.textContent = 'NHIT VisualLab';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'sb-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close sidebar');

  brandRow.appendChild(brand);
  brandRow.appendChild(closeBtn);
  head.appendChild(brandRow);

  var sub = document.createElement('div');
  sub.className = 'sb-sub';
  sub.textContent = 'Interactive Engineering Simulations';
  head.appendChild(sub);

  // Dual Mode Toggle Header
  var modeToggle = document.createElement('div');
  modeToggle.className = 'sb-mode-toggle';

  var btnCourse = document.createElement('button');
  btnCourse.className = 'sb-toggle-btn active';
  btnCourse.textContent = '🎓 By Course / Sem';

  var btnCat = document.createElement('button');
  btnCat.className = 'sb-toggle-btn';
  btnCat.textContent = '📁 By Category';

  modeToggle.appendChild(btnCourse);
  modeToggle.appendChild(btnCat);
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

  var activeMode = 'course'; // Default to Course & Semester wise

  function renderCategoryView(filterText) {
    bodyEl.innerHTML = '';
    filterText = (filterText || '').toLowerCase().trim();
    var isSearching = filterText.length > 0;
    var savedCatState = getSavedState('sb_cat_state');

    CATEGORY_DATA.forEach(function (cat) {
      var matchingTools = cat.tools.filter(function (t) {
        return !filterText || t.title.toLowerCase().indexOf(filterText) !== -1 || t.slug.indexOf(filterText) !== -1;
      });

      if (matchingTools.length === 0) return;

      var containsCurrent = cat.tools.some(function (t) { return t.slug === currentSlug; });
      var userPref = savedCatState[cat.name];
      var isOpen = isSearching || (userPref !== undefined ? userPref : containsCurrent);

      var det = document.createElement('details');
      det.open = Boolean(isOpen);

      det.addEventListener('toggle', function () {
        if (!isSearching) {
          savedCatState[cat.name] = det.open;
          saveState('sb_cat_state', savedCatState);
        }
      });

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
        if (t.slug === currentSlug) {
          a.style.color = '#29b6f6';
          a.style.fontWeight = '700';
          a.style.background = '#1b2540';
        }
        ul.appendChild(a);
      });
      det.appendChild(ul);
      bodyEl.appendChild(det);
    });
  }

  function renderCourseView(filterText) {
    bodyEl.innerHTML = '';
    filterText = (filterText || '').toLowerCase().trim();
    var isSearching = filterText.length > 0;
    var savedCourseState = getSavedState('sb_course_state');

    COURSE_DATA.forEach(function (cData) {
      var courseContainsCurrent = cData.semesters.some(function (sem) {
        return sem.tools.some(function (t) { return t.slug === currentSlug; });
      });

      var courseUserPref = savedCourseState[cData.course];
      var isCourseOpen = isSearching || (courseUserPref !== undefined ? courseUserPref : courseContainsCurrent);

      var courseDet = document.createElement('details');
      courseDet.open = Boolean(isCourseOpen);

      courseDet.addEventListener('toggle', function () {
        if (!isSearching) {
          savedCourseState[cData.course] = courseDet.open;
          saveState('sb_course_state', savedCourseState);
        }
      });

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

        var semContainsCurrent = sem.tools.some(function (t) { return t.slug === currentSlug; });
        var semKey = cData.course + '::' + sem.sem;
        var semUserPref = savedCourseState[semKey];
        var isSemOpen = isSearching || (semUserPref !== undefined ? semUserPref : semContainsCurrent);

        var semDet = document.createElement('details');
        semDet.open = Boolean(isSemOpen);
        semDet.style.marginLeft = '8px';

        semDet.addEventListener('toggle', function () {
          if (!isSearching) {
            savedCourseState[semKey] = semDet.open;
            saveState('sb_course_state', savedCourseState);
          }
        });

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
          if (t.slug === currentSlug) {
            a.style.color = '#29b6f6';
            a.style.fontWeight = '700';
            a.style.background = '#1b2540';
          }
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

  // Initial render: Default to Course View
  renderCourseView();

  btnCourse.addEventListener('click', function () {
    activeMode = 'course';
    btnCourse.classList.add('active');
    btnCat.classList.remove('active');
    renderCourseView(search.value);
  });

  btnCat.addEventListener('click', function () {
    activeMode = 'cat';
    btnCat.classList.add('active');
    btnCourse.classList.remove('active');
    renderCategoryView(search.value);
  });

  search.addEventListener('input', function () {
    if (activeMode === 'course') renderCourseView(search.value);
    else renderCategoryView(search.value);
  });

  var hint = document.createElement('div');
  hint.className = 'sb-hint';
  hint.textContent = '← hide · → show · Esc closes';
  bodyEl.appendChild(hint);

  document.body.appendChild(sidebar);

  var toggleBtn = document.createElement('button');
  toggleBtn.id = 'sim-sidebar-toggle';
  toggleBtn.title = 'Toggle simulations menu';
  toggleBtn.innerHTML = '&#9776;';
  toggleBtn.setAttribute('aria-label', 'Toggle simulation menu');
  document.body.appendChild(toggleBtn);

  function openSb() {
    document.body.classList.add('sim-sidebar-open');
  }
  function closeSb() {
    document.body.classList.remove('sim-sidebar-open');
  }
  function toggleSb() {
    if (document.body.classList.contains('sim-sidebar-open')) closeSb();
    else openSb();
  }

  toggleBtn.addEventListener('click', toggleSb);
  closeBtn.addEventListener('click', closeSb);
  backdrop.addEventListener('click', closeSb);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
      t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); openSb(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); closeSb(); }
    else if (e.key === 'Escape') { closeSb(); }
  });

  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) setTimeout(closeSb, 60);
  });
})();
