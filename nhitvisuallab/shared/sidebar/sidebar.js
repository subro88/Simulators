// NHIT VisualLab — Dual-Mode Overlay Sidebar (Context Aware & Persistent State)
(function () {  var CATEGORY_DATA = [{"name": "\u26a1 Electrical & Electronics", "tools": [{"slug": "circuit-theory", "title": "Circuit Theory & Networks Lab"}, {"slug": "electrical-measurements", "title": "Electrical Measuring Instruments"}, {"slug": "basic-electronics-ee", "title": "Basic Electronics Lab (EE)"}, {"slug": "c-programming-ee", "title": "C Programming for Electrical Eng"}, {"slug": "electrical-wiring-workshop", "title": "Electrical Workshop & Wiring"}, {"slug": "elements-mechanical-ee", "title": "Elements of Mechanical Eng"}, {"slug": "electrical-machines-2", "title": "Electrical Machines - II Lab"}, {"slug": "electrical-measurement-control", "title": "Measurement & Control Systems"}, {"slug": "applied-digital-electronics", "title": "Applied & Digital Electronics"}, {"slug": "electrical-cad-drawing", "title": "Computer Aided Electrical Drawing"}, {"slug": "power-plant-engineering", "title": "Power Plant Engineering Lab"}, {"slug": "electrical-maintenance-practice", "title": "Electrical Maintenance & Testing"}, {"slug": "power-electronics-drives", "title": "Power Electronics & Drives Lab"}, {"slug": "microcontroller-8051", "title": "8051 Microcontroller & Embedded"}, {"slug": "switchgear-protection", "title": "Switchgear & Protection Lab"}, {"slug": "electric-traction-heating", "title": "Utilization, Traction & Heating"}, {"slug": "illumination-engineering", "title": "Illumination Engineering Lab"}, {"slug": "energy-audit-conservation", "title": "Energy Conservation & Audit"}, {"slug": "electrical-design-estimation", "title": "Electrical Design, Estimation & Costing"}, {"slug": "electrical-installation-testing", "title": "Installation, Maintenance & Testing"}, {"slug": "electrical-workshop-2", "title": "Electrical Workshop - II (Rewinding)"}, {"slug": "industrial-automation-plc", "title": "Industrial Automation & PLC Lab"}, {"slug": "process-control-instrumentation", "title": "Process Control & Instrumentation"}, {"slug": "control-electrical-machines", "title": "Control of Electrical Machines"}, {"slug": "diode-rectifier", "title": "Diode & Rectifier Circuits"}, {"slug": "bjt-transistor", "title": "BJT Transistor Amplifier"}, {"slug": "op-amp", "title": "Operational Amplifier (Op-Amp)"}, {"slug": "transformers", "title": "Transformer Testing & Efficiency"}, {"slug": "dc-motor", "title": "DC Motor & Generator Simulator"}, {"slug": "induction-motor", "title": "3-Phase Induction Motor Simulator"}, {"slug": "synchronous-machine", "title": "Synchronous Machine Simulator"}, {"slug": "pid-controller", "title": "PID Controller Simulation"}]}, {"name": "\ud83e\uddea Virtual Lab Testing", "tools": [{"slug": "concrete-workability", "title": "Concrete Workability Lab (IS 1199)"}, {"slug": "cement-testing", "title": "Cement Physical Testing Lab (IS 4031)"}, {"slug": "aggregate-testing", "title": "Aggregate Physical Testing Lab (IS 2386)"}, {"slug": "utm-testing", "title": "UTM Virtual Lab"}, {"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "fatigue-testing", "title": "Fatigue Testing Virtual Lab"}, {"slug": "torsion-testing", "title": "Torsion Test Virtual Lab"}, {"slug": "litmus-test", "title": "Litmus Paper Test \u2014 Colour Chart & Virtual Lab"}, {"slug": "pneumatic-circuit", "title": "Pneumatic Circuit Simulator"}, {"slug": "electro-pneumatic-circuit", "title": "Electro-Pneumatic Circuit Simulator"}, {"slug": "ray-optics", "title": "Ray Optics Simulator & Trainer"}, {"slug": "refraction", "title": "Refraction of Light Simulator \u2014 Snell\u2019s Law, Critical Angle & Prisms"}, {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test Simulator"}, {"slug": "centrifugal-pump", "title": "Centrifugal Pump Test Rig Simulator"}, {"slug": "hydraulic-turbine", "title": "Hydraulic Turbine Test Rig Simulator"}]}, {"name": "\ud83d\udcbb Computer Science & IT", "tools": [{"slug": "data-structures", "title": "Data Structures & Algorithms Virtual Lab"}, {"slug": "computer-architecture", "title": "Computer Organization & Architecture"}, {"slug": "digital-logic-design", "title": "Digital Logic Design Lab"}, {"slug": "pc-hardware-assembly", "title": "PC Maintenance & Hardware Assembly"}, {"slug": "discrete-mathematics", "title": "Discrete Mathematics & Graph Theory"}, {"slug": "microprocessor-8085", "title": "8085 Microprocessor & Assembly IDE"}, {"slug": "computer-networks", "title": "Computer Networks Virtual Lab"}, {"slug": "rdbms-sql-database", "title": "RDBMS & SQL Database Virtual Lab"}, {"slug": "object-oriented-programming", "title": "Object-Oriented Programming Lab"}, {"slug": "computer-graphics", "title": "Computer Graphics Virtual Lab"}, {"slug": "web-development", "title": "Web Page Development Virtual Lab"}, {"slug": "software-engineering", "title": "Software Engineering & UML Lab"}, {"slug": "java-programming", "title": "Java Programming & JVM Lab"}, {"slug": "operating-systems", "title": "Operating Systems Virtual Lab"}, {"slug": "theory-of-computation", "title": "Theory of Computation & Automata Lab"}, {"slug": "network-administration", "title": "Network Management & Admin Lab"}, {"slug": "multimedia-animation", "title": "Multimedia & Animation Virtual Lab"}, {"slug": "advanced-java", "title": "Advanced Java & J2EE Virtual Lab"}, {"slug": "compiler-design", "title": "Compiler Design & System Programming"}, {"slug": "numerical-methods", "title": "Numerical Methods Virtual Lab"}, {"slug": "advanced-web-tech", "title": "Advanced Web Technology Lab"}, {"slug": "digital-image-processing", "title": "Digital Image Processing Lab"}, {"slug": "cloud-cyber-security", "title": "Cloud Computing & Cyber Security"}, {"slug": "logic-gates", "title": "Logic Gates Simulator"}, {"slug": "karnaugh-map", "title": "Karnaugh Map Solver"}, {"slug": "plc-ladder-logic", "title": "PLC Ladder Logic Simulator"}, {"slug": "cnc-gcode", "title": "CNC G-Code Simulator"}]}, {"name": "Measuring Instruments", "tools": [{"slug": "vernier-caliper", "title": "Vernier Caliper Simulator"}, {"slug": "screw-gauge", "title": "Screw Gauge Simulator"}, {"slug": "height-gauge", "title": "Vernier Height Gauge Simulator"}, {"slug": "dial-gauge", "title": "Dial Gauge Simulator"}, {"slug": "steel-ruler", "title": "Steel Ruler Simulator"}, {"slug": "bevel-protractor", "title": "Bevel Protractor \u2014 Least Count & Vernier Reading"}, {"slug": "protractor", "title": "Online Protractor Simulator"}, {"slug": "pressure-gauge", "title": "Pressure Gauge Simulator"}]}, {"name": "Mechanics & Motion", "tools": [{"slug": "newtons-laws", "title": "Newton\u2019s Laws of Motion"}, {"slug": "projectile-motion", "title": "Projectile Motion Calculator & Simulator"}, {"slug": "free-fall", "title": "Free Fall Simulator"}, {"slug": "friction", "title": "Friction & Contact Forces Simulator"}, {"slug": "hookes-law", "title": "Hooke\u2019s Law Simulator"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "vibrations", "title": "Spring-Mass-Damper Simulator"}, {"slug": "torque-rotation", "title": "Torque & Rotational Motion Simulator"}, {"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "gyroscope", "title": "Gyroscope Simulator"}, {"slug": "simple-machines", "title": "Simple Machines Simulator"}, {"slug": "buoyancy", "title": "Buoyancy & Archimedes\u2019 Principle Simulator"}, {"slug": "collision-momentum", "title": "Collision & Momentum Simulator \u2014 Elastic, Inelastic & 2D Collisions"}, {"slug": "simple-pendulum", "title": "Simple Pendulum Simulator"}, {"slug": "free-body-diagram", "title": "Free Body Diagram & Force Resolver"}, {"slug": "escape-velocity", "title": "Escape Velocity Simulator"}, {"slug": "bearing-life", "title": "Bearing Life Calculator"}, {"slug": "gear-strength", "title": "Gear Strength Calculator"}, {"slug": "hydraulic-cylinder", "title": "Hydraulic Cylinder Simulator"}]}, {"name": "Mechanisms & Machines", "tools": [{"slug": "four-bar-linkage", "title": "Four-Bar Linkage Simulator"}, {"slug": "slider-crank", "title": "Slider-Crank Mechanism"}, {"slug": "cam-follower", "title": "Cam & Follower Mechanism"}, {"slug": "gear-trains", "title": "Gear Train Calculator"}, {"slug": "belt-drive", "title": "Belt & Chain Drive"}, {"slug": "scotch-yoke", "title": "Scotch Yoke Mechanism"}, {"slug": "geneva-mechanism", "title": "Geneva Mechanism Animation & Simulator"}, {"slug": "centrifugal-governor", "title": "Centrifugal Governor Simulator"}, {"slug": "flywheel", "title": "Flywheel Energy Storage"}, {"slug": "bearing-selection", "title": "Bearing Selection Calculator"}, {"slug": "governor", "title": "Governor Mechanism Simulator"}, {"slug": "flywheel-energy", "title": "Flywheel Energy Calculator"}]}, {"name": "Strength of Materials", "tools": [{"slug": "stress-strain", "title": "Stress-Strain Curve Diagram Explained"}, {"slug": "hookes-law", "title": "Hooke\u2019s Law Simulator"}, {"slug": "utm-testing", "title": "UTM Virtual Lab"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "fatigue-testing", "title": "Fatigue Testing Virtual Lab"}, {"slug": "mohrs-circle", "title": "Mohr's Circle Calculator"}, {"slug": "stress-concentration", "title": "Stress Concentration Factor (Kt) Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "beam-bending", "title": "Beam Bending Simulator \u2014 SFD, BMD & Deflection"}, {"slug": "truss-analysis", "title": "Truss Analysis \u2014 Method of Joints"}, {"slug": "shaft-torsion", "title": "Shaft Torsion Calculator"}, {"slug": "column-buckling", "title": "Column Buckling Calculator"}, {"slug": "pressure-vessel", "title": "Hoop Stress Calculator \u2014 Thin-Walled Pressure Vessel"}, {"slug": "spring-design", "title": "Spring Design Calculator"}, {"slug": "bolted-joint", "title": "Bolt Torque & Preload Calculator"}, {"slug": "riveted-joints", "title": "Types of Riveted Joints"}, {"slug": "rivet-joint-designer", "title": "Rivet Joint Design & Failure Mode Simulator"}, {"slug": "torsion-testing", "title": "Torsion Test Virtual Lab"}, {"slug": "power-screw", "title": "Power Screw Calculator"}, {"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "crack-propagation", "title": "Crack Propagation & Critical Crack Length"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}]}, {"name": "Thermal & Fluid Engineering", "tools": [{"slug": "thermodynamics", "title": "Thermodynamic Cycles Simulator"}, {"slug": "ideal-gas-law", "title": "Ideal Gas Law Calculator & Simulator"}, {"slug": "boyles-law", "title": "Boyle's Law Simulator"}, {"slug": "charles-law", "title": "Charles' Law Simulator"}, {"slug": "heat-transfer", "title": "Heat Transfer Calculator \u2014 Conduction, Convection & Radiation"}, {"slug": "heat-exchanger", "title": "LMTD & NTU Heat Exchanger Calculator"}, {"slug": "bernoullis-principle", "title": "Bernoulli\u2019s Principle Simulator"}, {"slug": "fluid-flow", "title": "Pipe Pressure Drop Calculator \u2014 Darcy-Weisbach"}, {"slug": "reynolds-number", "title": "Reynolds Number Calculator"}, {"slug": "pascals-law", "title": "Pascal\u2019s Law Simulator"}, {"slug": "wind-tunnel", "title": "Wind Tunnel Simulator"}, {"slug": "thermal-power-plant", "title": "Thermal Power Plant Simulator"}, {"slug": "nuclear-power-plant", "title": "Nuclear Power Plant Simulator (PWR)"}, {"slug": "psychrometric-chart", "title": "Interactive Psychrometric Chart Calculator"}, {"slug": "rankine-cycle", "title": "Rankine Cycle Simulator"}, {"slug": "refrigeration-cycle", "title": "Refrigeration Cycle Simulator"}, {"slug": "four-stroke-engine", "title": "Four Stroke Engine Simulator"}, {"slug": "two-stroke-engine", "title": "Two Stroke Engine Simulator"}, {"slug": "buoyancy", "title": "Buoyancy & Archimedes\u2019 Principle Simulator"}, {"slug": "viscosity-experiment", "title": "Viscosity Experiment Virtual Lab"}, {"slug": "thermal-conductivity", "title": "Thermal Conductivity Calculator"}, {"slug": "continuity-equation", "title": "Continuity Equation Simulator"}, {"slug": "stefan-boltzmann", "title": "Stefan-Boltzmann Radiation Simulator"}, {"slug": "specific-heat-capacity", "title": "Specific Heat Capacity Table & Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}]}, {"name": "Power Plant Simulations", "tools": [{"slug": "thermal-power-plant", "title": "Thermal Power Plant Simulator"}, {"slug": "coal-gas-power-plant", "title": "Coal & Gas Power Plant Simulator"}, {"slug": "nuclear-power-plant", "title": "Nuclear Power Plant Simulator (PWR)"}]}, {"name": "Workshop & Manufacturing", "tools": [{"slug": "lathe-machine", "title": "Lathe Machine Simulator"}, {"slug": "milling-machine", "title": "Milling Machine Simulator"}, {"slug": "drilling-machine", "title": "Drilling Machine Simulator"}, {"slug": "hydraulic-circuit", "title": "Hydraulic Circuit Simulator and Trainer"}, {"slug": "pneumatic-circuit", "title": "Pneumatic Circuit Simulator"}, {"slug": "electro-pneumatic-circuit", "title": "Electro-Pneumatic Circuit Simulator"}, {"slug": "plc-ladder-logic", "title": "PLC Ladder Logic Simulator"}, {"slug": "cnc-gcode", "title": "CNC G-Code Simulator"}, {"slug": "bolted-joint", "title": "Bolt Torque & Preload Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}, {"slug": "welding-symbols", "title": "Welding Symbols Chart & Interactive Trainer"}, {"slug": "riveted-joints", "title": "Types of Riveted Joints"}, {"slug": "gdt-trainer", "title": "GD&T Symbols Chart & Trainer"}, {"slug": "thread-nomenclature", "title": "Thread Nomenclature & Metric Thread Chart"}, {"slug": "tolerance-fits", "title": "Tolerance & Fits Calculator"}, {"slug": "bend-radius", "title": "Sheet Metal Bend Radius & Bend Allowance Calculator"}, {"slug": "rivet-joint-designer", "title": "Rivet Joint Design & Failure Mode Simulator"}, {"slug": "hardness-testing", "title": "Hardness Conversion Chart & Testing Simulator"}, {"slug": "impact-testing", "title": "Charpy & Izod Impact Test Virtual Lab"}, {"slug": "machining-calculator", "title": "Speeds and Feeds Calculator"}]}, {"name": "Engineering Calculators", "tools": [{"slug": "moment-of-inertia", "title": "Moment of Inertia Calculator"}, {"slug": "column-buckling", "title": "Column Buckling Calculator"}, {"slug": "power-screw", "title": "Power Screw Calculator"}, {"slug": "weld-strength", "title": "Weld Strength Calculator"}, {"slug": "stress-concentration", "title": "Stress Concentration Factor (Kt) Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "machining-calculator", "title": "Speeds and Feeds Calculator"}, {"slug": "spring-design", "title": "Spring Design Calculator"}, {"slug": "tolerance-fits", "title": "Tolerance & Fits Calculator"}, {"slug": "bend-radius", "title": "Sheet Metal Bend Radius & Bend Allowance Calculator"}, {"slug": "gear-trains", "title": "Gear Train Calculator"}, {"slug": "bearing-life", "title": "Bearing Life Calculator"}, {"slug": "gear-strength", "title": "Gear Strength Calculator"}, {"slug": "heat-exchanger", "title": "LMTD & NTU Heat Exchanger Calculator"}, {"slug": "fatigue-life", "title": "Fatigue Life Calculator"}, {"slug": "hydraulic-cylinder", "title": "Hydraulic Cylinder Simulator"}, {"slug": "thermocouple", "title": "Thermocouple & Seebeck Effect Simulator"}]}, {"name": "\ud83d\udd2c Basic Science", "tools": [{"slug": "collision-momentum", "title": "Collision & Momentum Simulator \u2014 Elastic, Inelastic & 2D Collisions"}, {"slug": "balance-chemical-equations", "title": "Balancing Chemical Equations"}, {"slug": "build-your-atom", "title": "Build Your Atom"}, {"slug": "ray-optics", "title": "Ray Optics Simulator & Trainer"}, {"slug": "refraction", "title": "Refraction of Light Simulator \u2014 Snell\u2019s Law, Critical Angle & Prisms"}, {"slug": "titration", "title": "Titration Simulator \u2014 Acid-Base Curve, Indicators & Calculator"}, {"slug": "litmus-test", "title": "Litmus Paper Test \u2014 Colour Chart & Virtual Lab"}, {"slug": "newtons-laws", "title": "Newton\u2019s Laws of Motion"}, {"slug": "projectile-motion", "title": "Projectile Motion Calculator & Simulator"}, {"slug": "free-fall", "title": "Free Fall Simulator"}, {"slug": "boyles-law", "title": "Boyle's Law Simulator"}, {"slug": "charles-law", "title": "Charles' Law Simulator"}, {"slug": "ideal-gas-law", "title": "Ideal Gas Law Calculator & Simulator"}, {"slug": "shm", "title": "Simple Harmonic Motion"}, {"slug": "hookes-law", "title": "Hooke\u2019s Law Simulator"}, {"slug": "friction", "title": "Friction & Contact Forces Simulator"}, {"slug": "pascals-law", "title": "Pascal\u2019s Law Simulator"}, {"slug": "bernoullis-principle", "title": "Bernoulli\u2019s Principle Simulator"}, {"slug": "specific-heat-capacity", "title": "Specific Heat Capacity Table & Calculator"}, {"slug": "thermal-expansion", "title": "Thermal Expansion Calculator"}, {"slug": "faradays-law", "title": "Faraday's Law Simulator"}]}, {"name": "\ud835\udc53(x) Mathematics & Graphing Tools", "tools": [{"slug": "math-graphing", "title": "Math Function Graph Generator"}, {"slug": "logic-gates", "title": "Logic Gates Simulator"}, {"slug": "karnaugh-map", "title": "Karnaugh Map Solver"}, {"slug": "calculus-visualizer", "title": "Calculus Visualizer & Simulator"}, {"slug": "matrix-multiplication", "title": "Matrix Calculator and Operations Simulator"}, {"slug": "area-calculator", "title": "Area Calculator"}]}, {"name": "Other Simulations", "tools": [{"slug": "automotive-clutch", "title": "Automotive Friction Clutch Simulator"}, {"slug": "automotive-differential", "title": "Automotive Differential Mechanism Simulator"}, {"slug": "chemical-bonds", "title": "Chemical Bond Simulator"}, {"slug": "chemical-mixing", "title": "Chemical Mixing Simulation \u2014 Mix Acids & Bases"}, {"slug": "moment-of-inertia-angle", "title": "Moment of Inertia of an Angle Section"}, {"slug": "moment-of-inertia-channel", "title": "Moment of Inertia of a Channel Section"}, {"slug": "moment-of-inertia-circle", "title": "Moment of Inertia of a Circle"}, {"slug": "moment-of-inertia-hollow-circle", "title": "Moment of Inertia of a Hollow Circle"}, {"slug": "moment-of-inertia-hollow-rect", "title": "Moment of Inertia of a Hollow Rectangle"}, {"slug": "moment-of-inertia-i-beam", "title": "Moment of Inertia of an I-Beam"}, {"slug": "moment-of-inertia-rectangle", "title": "Moment of Inertia of a Rectangle"}, {"slug": "moment-of-inertia-t-section", "title": "Moment of Inertia of a T-Section"}, {"slug": "phase-change", "title": "Phase Change & Latent Heat Simulator"}, {"slug": "steering-geometry", "title": "Steering Geometry & Wheel Alignment Simulator"}, {"slug": "thermal-power-plant-diagram", "title": "Thermal Power Plant"}, {"slug": "valve-timing-diagram", "title": "Valve Timing Diagram Simulator"}]}];
  var COURSE_DATA = [{"course": "\ud83c\udfce\ufe0f Automobile Engg.", "semesters": [{"sem": "Semester 3 (Syllabus Mapped)", "tools": [{"slug": "valve-timing-diagram", "title": "Valve Timing Diagram Simulator (S.I. & C.I.)"}, {"slug": "automotive-differential", "title": "Automotive Differential Mechanism Simulator"}, {"slug": "automotive-clutch", "title": "Automotive Friction Clutch Simulator"}, {"slug": "four-stroke-engine", "title": "Four Stroke Petrol & Diesel Engine"}, {"slug": "two-stroke-engine", "title": "Two Stroke Engine Simulator"}, {"slug": "morse-test", "title": "IC Engine Test Rig & Morse Test"}, {"slug": "thermodynamics", "title": "Heat Power: Otto, Diesel & Dual Cycles"}, {"slug": "ideal-gas-law", "title": "Gas Laws: Boyle's & Charles's Law"}, {"slug": "heat-transfer", "title": "Heat Transfer (Conduction & Convection)"}, {"slug": "heat-exchanger", "title": "LMTD Heat Exchanger Simulator"}, {"slug": "stress-strain", "title": "Advanced SOM: Stress-Strain Curve"}, {"slug": "utm-testing", "title": "Advanced SOM: UTM Tensile Test Lab"}, {"slug": "mohrs-circle", "title": "Advanced SOM: Mohr's Circle Diagram"}, {"slug": "beam-bending", "title": "Advanced SOM: Bending Stresses & SFD/BMD"}, {"slug": "shaft-torsion", "title": "Advanced SOM: Shaft Torsion Calculator"}, {"slug": "spring-design", "title": "Advanced SOM: Helical Springs Design"}, {"slug": "pressure-vessel", "title": "Advanced SOM: Thin Cylinders Hoop Stress"}, {"slug": "diode-rectifier", "title": "Electronics Lab: Diodes & Rectifiers"}, {"slug": "bjt-transistor", "title": "Electronics Lab: BJT Transistor"}, {"slug": "logic-gates", "title": "Electronics Lab: Logic Gates & Flip-Flops"}, {"slug": "lathe-machine", "title": "Manufacturing: Lathe Machine Simulator"}, {"slug": "milling-machine", "title": "Manufacturing: Milling Machine Simulator"}, {"slug": "drilling-machine", "title": "Manufacturing: Drilling Machine"}, {"slug": "tolerance-fits", "title": "Auto Drawing: Limits, Fits & Tolerances"}, {"slug": "gdt-trainer", "title": "Auto Drawing: GD&T Symbols Chart"}]}, {"sem": "Semester 4 (Syllabus Mapped)", "tools": [{"slug": "refrigeration-cycle", "title": "HPE II: Air Conditioning & Vapor Compression"}, {"slug": "psychrometric-chart", "title": "HPE II: Psychrometric Chart Calculator"}, {"slug": "rankine-cycle", "title": "HPE II: Steam Turbines & Rankine Cycle"}, {"slug": "thermal-power-plant", "title": "HPE II: Thermal Power Generation"}, {"slug": "coal-gas-power-plant", "title": "HPE II: Gas Turbines Power Plant"}, {"slug": "four-stroke-engine", "title": "Advanced Engines: MPFI & CRDI Fuel Injection"}, {"slug": "valve-timing-diagram", "title": "Advanced Engines: Valve Timing"}, {"slug": "automotive-differential", "title": "Transmission: Rear Axle & Differential"}, {"slug": "automotive-clutch", "title": "Transmission: Friction Clutches"}, {"slug": "gear-trains", "title": "Transmission: Manual Transmissions & Gear Ratios"}, {"slug": "gear-strength", "title": "Transmission: Gear Strength Calculator"}, {"slug": "bend-radius", "title": "Manufacturing: Press Tools, Punching & Blanking"}, {"slug": "machining-calculator", "title": "Manufacturing: Speeds & Feeds Calculator"}, {"slug": "four-bar-linkage", "title": "TOM: Four-Bar Kinematic Linkage"}, {"slug": "slider-crank", "title": "TOM: Slider-Crank Velocity Analysis"}, {"slug": "cam-follower", "title": "TOM: Cam Profile & Follower"}, {"slug": "centrifugal-governor", "title": "TOM: Governors"}, {"slug": "flywheel", "title": "TOM: Flywheel Energy Storage"}, {"slug": "bearing-life", "title": "TOM: Bearing Life Calculator"}]}, {"sem": "Semester 5 (Syllabus Mapped)", "tools": [{"slug": "steering-geometry", "title": "Chassis II: Steering Geometry & Alignment (Ackermann, Camber)"}, {"slug": "hydraulic-circuit", "title": "Chassis II & Lab: Hydraulic Brake Systems & Valves"}, {"slug": "pneumatic-circuit", "title": "Chassis II & Lab: Air Brake Systems & Pneumatics"}, {"slug": "electro-pneumatic-circuit", "title": "Hydraulics & Lab: Electro-Pneumatic Circuit"}, {"slug": "hydraulic-cylinder", "title": "Hydraulics & Lab: Hydraulic Cylinders & Actuators"}, {"slug": "spring-design", "title": "Component Design: Helical & Leaf Springs"}, {"slug": "shaft-torsion", "title": "Component Design: Transmission Shafts & Keys"}, {"slug": "power-screw", "title": "Component Design: Power Screws"}, {"slug": "bolted-joint", "title": "Component Design: Bolted Joints"}, {"slug": "weld-strength", "title": "Component Design: Welded Joints"}, {"slug": "rivet-joint-designer", "title": "Component Design: Riveted Joints"}, {"slug": "stress-concentration", "title": "Component Design: Stress Concentration Factor (Kt)"}, {"slug": "dc-motor", "title": "Auto Electricals: Starter Motor & DC Generator"}, {"slug": "ac-generator", "title": "Auto Electricals: Alternator Charging System"}, {"slug": "electrical-wiring", "title": "Auto Electricals: Harness & Lighting Wiring"}, {"slug": "diode-rectifier", "title": "Auto Electricals: ECU Rectifiers & Diodes"}, {"slug": "wind-tunnel", "title": "Elective: Vehicle Aerodynamics & Drag Cd"}, {"slug": "fluid-flow", "title": "Elective: Aerodynamic Flow & Pressure Drop"}, {"slug": "reynolds-number", "title": "Elective: Vehicle Boundary Layer Reynolds Number"}]}, {"sem": "Semester 6 (Syllabus Mapped)", "tools": [{"slug": "lathe-machine", "title": "Maintenance: Engine & Component Overhauling"}, {"slug": "milling-machine", "title": "Maintenance: Garage Machine Tools"}, {"slug": "drilling-machine", "title": "Maintenance: Drilling Operations"}, {"slug": "vernier-caliper", "title": "Maintenance: Precision Measuring Instruments"}, {"slug": "dial-gauge", "title": "Maintenance: Cylinder Bore & Shaft Runout Gauge"}, {"slug": "cnc-gcode", "title": "CAD/CAM Elective: CNC G-Code Programming"}, {"slug": "plc-ladder-logic", "title": "CAD/CAM Elective: Automated Assembly PLC"}, {"slug": "refrigeration-cycle", "title": "Auto AC Elective: VCRS Automobile Air Conditioning"}, {"slug": "psychrometric-chart", "title": "Auto AC Elective: Psychrometric Chart Calculator"}, {"slug": "heat-exchanger", "title": "Auto AC Elective: Evaporator & Condenser Heat Exchanger"}, {"slug": "nuclear-power-plant", "title": "Alternate Energy Elective: Nuclear Power Generation"}, {"slug": "capacitor-bank", "title": "Alternate Energy Elective: EV Battery Supercapacitors"}]}]}, {"course": "\ud83c\udfd7\ufe0f Civil Engg.", "semesters": [{"sem": "Semester 3 (Syllabus Mapped)", "tools": [{"slug": "concrete-workability", "title": "Concrete Workability Lab (IS 1199)"}, {"slug": "cement-testing", "title": "Cement Testing Lab (IS 4031)"}, {"slug": "aggregate-testing", "title": "Aggregate Testing Lab (IS 2386)"}, {"slug": "beam-bending", "title": "SOM: Beam Bending, SFD & BMD"}, {"slug": "bernoullis-principle", "title": "Hydraulics: Bernoulli\u2019s Theorem"}, {"slug": "fluid-flow", "title": "Hydraulics: Pipe Friction & Pressure Drop"}]}, {"sem": "Semester 4 (Syllabus Mapped)", "tools": [{"slug": "stress-strain", "title": "SOM: Stress-Strain Diagram"}, {"slug": "utm-testing", "title": "SOM: UTM Concrete & Steel Test"}, {"slug": "viscosity-experiment", "title": "Hydraulics: Viscosity Lab"}, {"slug": "truss-analysis", "title": "SOM: Truss Analysis Method of Joints"}]}, {"sem": "Semester 5 (Syllabus Mapped)", "tools": [{"slug": "mohrs-circle", "title": "Soil Mechanics: Mohr's Circle"}, {"slug": "column-buckling", "title": "Structures: Column Buckling"}, {"slug": "weld-strength", "title": "Steel Structures: Welded Joints"}, {"slug": "riveted-joints", "title": "Steel Structures: Riveted Joints"}, {"slug": "area-calculator", "title": "Surveying: Cross-Section Area"}]}, {"sem": "Semester 6 (Syllabus Mapped)", "tools": [{"slug": "litmus-test", "title": "Environmental: Water pH & Litmus Test"}, {"slug": "chemical-mixing", "title": "Environmental: Chemical Mixing Lab"}, {"slug": "ray-optics", "title": "Surveying: Optical Instruments Ray Optics"}, {"slug": "refraction", "title": "Surveying: Refraction & Leveling"}]}]}, {"course": "\ud83d\udcbb Computer Sc & Tech.", "semesters": [{"sem": "Semester 3 (Syllabus Mapped: CST/3/301 - CST/3/306 & PP-I)", "tools": [{"slug": "data-structures", "title": "CST/3/304 & 302: Data Structures & Algorithms Lab"}, {"slug": "computer-architecture", "title": "CST/3/305: Computer Organization & Architecture"}, {"slug": "digital-logic-design", "title": "CST/3/303: Digital Logic Design Lab"}, {"slug": "pc-hardware-assembly", "title": "CST/3/PP-I: PC Maintenance & Hardware Assembly"}, {"slug": "discrete-mathematics", "title": "CST/3/301: Discrete Mathematics & Graph Theory"}, {"slug": "diode-rectifier", "title": "CST/3/306: EDC \u2014 Diode & Rectifier Circuits"}, {"slug": "bjt-transistor", "title": "CST/3/306: EDC \u2014 BJT Transistor Amplifier"}, {"slug": "logic-gates", "title": "CST/3/303: Basic Logic Gates & De Morgan's"}, {"slug": "karnaugh-map", "title": "CST/3/303: Karnaugh Map Logic Simplifier"}, {"slug": "matrix-multiplication", "title": "CST/3/301: Matrix Algebra Calculator"}]}, {"sem": "Semester 4 (Syllabus Mapped: CST/4/401 - CST/4/405 & PP-II)", "tools": [{"slug": "microprocessor-8085", "title": "CST/4/401: Microprocessor & Assembly IDE (8085)"}, {"slug": "computer-networks", "title": "CST/4/402: Computer Networks & Subnetting Lab"}, {"slug": "rdbms-sql-database", "title": "CST/4/403: Relational DBMS & SQL Lab"}, {"slug": "object-oriented-programming", "title": "CST/4/404: Object-Oriented Programming (OOP) Lab"}, {"slug": "computer-graphics", "title": "CST/4/405: Computer Graphics & Algorithms Lab"}, {"slug": "web-development", "title": "CST/4/PP-II: Web Page Development Lab"}, {"slug": "math-graphing", "title": "Math: Function Graph Visualizer"}, {"slug": "calculus-visualizer", "title": "Math: Calculus Visualizer"}]}, {"sem": "Semester 5 (Syllabus Mapped: CST/5/501 - CST/5/505 & PP-III)", "tools": [{"slug": "software-engineering", "title": "CST/5/501: Software Engineering & Agile/COCOMO Lab"}, {"slug": "java-programming", "title": "CST/5/502: Java Programming & JVM Concurrency Lab"}, {"slug": "operating-systems", "title": "CST/5/503: Operating Systems Virtual Lab"}, {"slug": "theory-of-computation", "title": "CST/5/504: Theory of Computation & Automata (TOC)"}, {"slug": "network-administration", "title": "CST/5/505(I): Network Management & Administration"}, {"slug": "multimedia-animation", "title": "CST/5/505(II): Multimedia & Animation Techniques"}, {"slug": "plc-ladder-logic", "title": "Industrial Controls: PLC Ladder Logic"}, {"slug": "cnc-gcode", "title": "CIM Automation: CNC G-Code Simulator"}]}, {"sem": "Semester 6 (Syllabus Mapped: CST/6/601 - CST/6/603 & PP-IV)", "tools": [{"slug": "advanced-java", "title": "CST/6/601: Advanced Java & J2EE Enterprise Lab"}, {"slug": "compiler-design", "title": "CST/6/602: System Programming & Compiler Design"}, {"slug": "numerical-methods", "title": "CST/6/603(I): Numerical Methods Virtual Lab"}, {"slug": "advanced-web-tech", "title": "CST/6/603(II): Advanced Web Technology Lab"}, {"slug": "digital-image-processing", "title": "CST/6/603(III): Digital Image Processing Lab"}, {"slug": "cloud-cyber-security", "title": "CST/6/PP-IV: Cloud Computing & Cyber Security"}, {"slug": "pid-controller", "title": "Embedded Controls: PID Controller Simulation"}, {"slug": "cryptography-ciphers", "title": "Cyber Security: Classic & Modern Ciphers"}]}]}, {"course": "\u26a1 Electrical Engineering", "semesters": [{"sem": "Semester 3 (Syllabus Mapped: EE/S3/CTN, EE/S3/EMI, EE/S3/BE, EE/S3/C, EE/S3/WS, EE/S3/EMCE)", "tools": [{"slug": "circuit-theory", "title": "EE/S3/CTN: Circuit Theory & Network Theorems"}, {"slug": "electrical-measurements", "title": "EE/S3/EMI: Electrical Measuring Instruments"}, {"slug": "basic-electronics-ee", "title": "EE/S3/BE: Basic Electronics Lab"}, {"slug": "c-programming-ee", "title": "EE/S3/C: Programming Concept using C"}, {"slug": "electrical-wiring-workshop", "title": "EE/S3/WS: Electrical Workshop Practice"}, {"slug": "elements-mechanical-ee", "title": "EE/S3/EMCE: Elements of Mechanical Eng"}, {"slug": "diode-rectifier", "title": "EDC: Diode & Rectifier Characteristics"}, {"slug": "bjt-transistor", "title": "EDC: BJT Common Emitter Amplifier"}]}, {"sem": "Semester 4 (Syllabus Mapped: EE/S4/EM II, EE/S4/EMC, EE/S4/ADE, EE/S4/ED, EE/S4/PPE, EE/S4/PFII)", "tools": [{"slug": "electrical-machines-2", "title": "EE/S4/EM II: Electrical Machines - II"}, {"slug": "electrical-measurement-control", "title": "EE/S4/EMC: Electrical Measurement & Control"}, {"slug": "applied-digital-electronics", "title": "EE/S4/ADE: Applied & Digital Electronics"}, {"slug": "electrical-cad-drawing", "title": "EE/S4/ED: Computer Aided Electrical Drawing"}, {"slug": "power-plant-engineering", "title": "EE/S4/PPE: Power Plant Engineering"}, {"slug": "electrical-maintenance-practice", "title": "EE/S4/PFII: Electrical Maintenance & Testing"}, {"slug": "induction-motor", "title": "EM-II: 3-Phase Induction Motor Dynamics"}, {"slug": "synchronous-machine", "title": "EM-II: Synchronous Alternator V-Curves"}]}, {"sem": "Semester 5 (Syllabus Mapped: EE/S5/PED, EE/S5/MPMC, EE/S5/SGP, EE/S5/UTHD, EE/S5/ILE, EE/S5/ECA)", "tools": [{"slug": "power-electronics-drives", "title": "EE/S5/PED: Power Electronics & Drives"}, {"slug": "microcontroller-8051", "title": "EE/S5/MPMC: 8051 Microcontroller & Embedded"}, {"slug": "switchgear-protection", "title": "EE/S5/SGP: Switchgear & Protection"}, {"slug": "electric-traction-heating", "title": "EE/S5/UTHD: Utilization, Traction & Heating"}, {"slug": "illumination-engineering", "title": "EE/S5/ILE: Illumination Engineering"}, {"slug": "energy-audit-conservation", "title": "EE/S5/ECA: Energy Conservation & Audit"}, {"slug": "pid-controller", "title": "Control: Closed-Loop Industrial Drives"}]}, {"sem": "Semester 6 (Syllabus Mapped: EE/S6/EDEC, EE/S6/EIMT, EE/S6/EWII, EE/S6/IA, EE/S6/PC, EE/S6/CEM)", "tools": [{"slug": "electrical-design-estimation", "title": "EE/S6/EDEC: Electrical Design & Estimation"}, {"slug": "electrical-installation-testing", "title": "EE/S6/EIMT: Installation, Maint. & Testing"}, {"slug": "electrical-workshop-2", "title": "EE/S6/EWII: Electrical Workshop - II"}, {"slug": "industrial-automation-plc", "title": "EE/S6/IA: Industrial Automation & PLC"}, {"slug": "process-control-instrumentation", "title": "EE/S6/PC: Process Control & Instrumentation"}, {"slug": "control-electrical-machines", "title": "EE/S6/CEM: Control of Electrical Machines"}]}]}, {"course": "\ud83d\udce1 Electronics & Telecomm Engg.", "semesters": [{"sem": "Semester 3 & 4 (Analog & Digital)", "tools": [{"slug": "diode-rectifier", "title": "Analog: Diode Rectifier & Filter"}, {"slug": "bjt-transistor", "title": "Analog: BJT Transistor Amplifier"}, {"slug": "logic-gates", "title": "Digital: Logic Gates & Flip-Flops"}, {"slug": "karnaugh-map", "title": "Digital: K-Map Logic Simplifier"}, {"slug": "thermocouple", "title": "Instrumentation: Thermocouple Sensors"}]}, {"sem": "Semester 5 & 6 (Optics & Signals)", "tools": [{"slug": "ray-optics", "title": "Optical Fiber: Ray Optics Simulator"}, {"slug": "refraction", "title": "Optics: Refraction & Snell's Law"}]}]}, {"course": "\u2699\ufe0f Mechanical Engg.", "semesters": [{"sem": "Semester 3 & 4 (Thermal, Fluid & Manufacturing)", "tools": [{"slug": "thermodynamics", "title": "Thermodynamics: Otto & Diesel Cycles"}, {"slug": "four-stroke-engine", "title": "IC Engines: 4-Stroke Engine"}, {"slug": "two-stroke-engine", "title": "IC Engines: 2-Stroke Engine"}, {"slug": "bernoullis-principle", "title": "Fluid Mechanics: Bernoulli's Principle"}, {"slug": "fluid-flow", "title": "Fluid Mechanics: Pipe Flow Friction"}, {"slug": "reynolds-number", "title": "Fluid Mechanics: Reynolds Number"}, {"slug": "pascals-law", "title": "Fluid Power: Pascal's Law Hydraulic Press"}, {"slug": "lathe-machine", "title": "Workshop: Lathe Turning Operations"}, {"slug": "milling-machine", "title": "Workshop: Milling Cutter Operations"}, {"slug": "drilling-machine", "title": "Workshop: Drilling & Boring Operations"}]}, {"sem": "Semester 5 & 6 (Kinematics, SOM & Design)", "tools": [{"slug": "four-bar-linkage", "title": "Theory of Machines: Four-Bar Linkage"}, {"slug": "slider-crank", "title": "Theory of Machines: Slider Crank"}, {"slug": "cam-follower", "title": "Theory of Machines: Cam & Follower"}, {"slug": "gear-trains", "title": "Theory of Machines: Gear Trains"}, {"slug": "belt-drive", "title": "Theory of Machines: Belt Drives"}, {"slug": "beam-bending", "title": "SOM: Beam Deflection & Bending"}, {"slug": "mohrs-circle", "title": "SOM: Mohr's Stress Circle"}, {"slug": "spring-design", "title": "Machine Design: Springs Design"}, {"slug": "bearing-selection", "title": "Machine Design: Rolling Bearings"}]}]}];

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
    '#sim-sidebar-toggle{position:fixed;top:50%;transform:translateY(-50%);left:12px;z-index:10001;width:40px;height:40px;' +
    'border:none;border-radius:10px;background:#0f1320;color:#29b6f6;font-size:18px;' +
    'cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5);display:flex;align-items:center;' +
    'justify-content:center;transition:left .25s ease, transform .25s ease}' +
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

  // Global listener for any additional buttons with .sidebar-toggle-btn
  document.addEventListener('click', function (e) {
    if (e.target.closest('.sidebar-toggle-btn') || e.target.closest('[data-action="toggle-sidebar"]')) {
      e.preventDefault();
      toggleSb();
    }
  });

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
