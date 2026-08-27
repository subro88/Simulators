"""
Simulators Platform — FastAPI Backend Server
============================================
Provides high-precision physics calculations, WebSocket telemetry streaming,
and serves modern WebGL frontends alongside legacy V1 simulators.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse

from app.simulation import (
    DifferentialEngine, DifferentialInput, DifferentialOutput,
    ClutchEngine, ClutchInput, ClutchOutput,
    FourStrokeEngine, FourStrokeInput, FourStrokeOutput,
    TwoStrokeEngine, TwoStrokeInput, TwoStrokeOutput,
    SteeringEngine, SteeringInput, SteeringOutput,
    ValveTimingEngine, ValveTimingInput, ValveTimingOutput,
    FourBarEngine, FourBarInput, FourBarOutput,
    CamFollowerEngine, CamFollowerInput, CamFollowerOutput,
    GearTrainsEngine, GearTrainsInput, GearTrainsOutput,
    BeltDriveEngine, BeltDriveInput, BeltDriveOutput,
    CementTestingEngine, CementTestingInput, CementTestingOutput,
    AggregateTestingEngine, AggregateTestingInput, AggregateTestingOutput,
    ConcreteWorkabilityEngine, ConcreteWorkabilityInput, ConcreteWorkabilityOutput,
    # ── Batch 4: Strength of Materials & Structural Design ──
    StressStrainEngine, StressStrainInput, StressStrainOutput,
    ShaftTorsionEngine, ShaftTorsionInput, ShaftTorsionOutput,
    ColumnBucklingEngine, ColumnBucklingInput, ColumnBucklingOutput,
    MohrsCircleEngine, MohrsCircleInput, MohrsCircleOutput,
    PressureVesselEngine, PressureVesselInput, PressureVesselOutput,
    SpringDesignEngine, SpringDesignInput, SpringDesignOutput,
    BoltedJointEngine, BoltedJointInput, BoltedJointOutput,
    RivetedJointsEngine, RivetedJointsInput, RivetedJointsOutput,
    WeldStrengthEngine, WeldStrengthInput, WeldStrengthOutput,
    CrackPropagationEngine, CrackPropagationInput, CrackPropagationOutput,
    RivetJointDesignerEngine, RivetJointDesignerInput, RivetJointDesignerOutput,
    TrussStructuralAnalysisEngine, TrussStructuralAnalysisInput, TrussStructuralAnalysisOutput,
    DataStructuresEngine, DataStructuresInput, DataStructuresOutput,
    ComputerArchitectureEngine, ComputerArchitectureInput, ComputerArchitectureOutput,
    DigitalLogicDesignEngine, DigitalLogicDesignInput, DigitalLogicDesignOutput,
    PCHardwareAssemblyEngine, PCHardwareAssemblyInput, PCHardwareAssemblyOutput,
    DiscreteMathematicsEngine, DiscreteMathematicsInput, DiscreteMathematicsOutput,
    Microprocessor8085Engine, Microprocessor8085Input, Microprocessor8085Output,
    ComputerNetworksEngine, ComputerNetworksInput, ComputerNetworksOutput,
    RdbmsSqlDatabaseEngine, RdbmsSqlDatabaseInput, RdbmsSqlDatabaseOutput,
    ObjectOrientedProgrammingEngine, ObjectOrientedProgrammingInput, ObjectOrientedProgrammingOutput,
    ComputerGraphicsEngine, ComputerGraphicsInput, ComputerGraphicsOutput,
    WebDevelopmentEngine, WebDevelopmentInput, WebDevelopmentOutput,
    SoftwareEngineeringEngine, SoftwareEngineeringInput, SoftwareEngineeringOutput,
    JavaProgrammingEngine, JavaProgrammingInput, JavaProgrammingOutput,
    OperatingSystemsEngine, OperatingSystemsInput, OperatingSystemsOutput,
    TheoryOfComputationEngine, TheoryOfComputationInput, TheoryOfComputationOutput,
    NetworkAdministrationEngine, NetworkAdministrationInput, NetworkAdministrationOutput,
    MultimediaAnimationEngine, MultimediaAnimationInput, MultimediaAnimationOutput,
    AdvancedJavaEngine, AdvancedJavaInput, AdvancedJavaOutput,
    CompilerDesignEngine, CompilerDesignInput, CompilerDesignOutput,
    NumericalMethodsEngine, NumericalMethodsInput, NumericalMethodsOutput,
    AdvancedWebTechnologyEngine, AdvancedWebTechnologyInput, AdvancedWebTechnologyOutput,
    DigitalImageProcessingEngine, DigitalImageProcessingInput, DigitalImageProcessingOutput,
    CloudCyberSecurityEngine, CloudCyberSecurityInput, CloudCyberSecurityOutput,
    CircuitTheoryEngine, CircuitTheoryInput, CircuitTheoryOutput,
    ElectricalMeasurementsEngine, ElectricalMeasurementsInput, ElectricalMeasurementsOutput,
    BasicElectronicsEEEngine, BasicElectronicsEEInput, BasicElectronicsEEOutput,
    CProgrammingEEEngine, CProgrammingEEInput, CProgrammingEEOutput,
    ElectricalWiringWorkshopEngine, ElectricalWiringWorkshopInput, ElectricalWiringWorkshopOutput,
    ElementsMechanicalEEEngine, ElementsMechanicalEEInput, ElementsMechanicalEEOutput,
    ElectricalMachines2Engine, ElectricalMachines2Input, ElectricalMachines2Output,
    ElectricalMeasurementControlEngine, ElectricalMeasurementControlInput, ElectricalMeasurementControlOutput,
    AppliedDigitalElectronicsEngine, AppliedDigitalElectronicsInput, AppliedDigitalElectronicsOutput,
    ElectricalCadDrawingEngine, ElectricalCadDrawingInput, ElectricalCadDrawingOutput,
    PowerPlantEngineeringEngine, PowerPlantEngineeringInput, PowerPlantEngineeringOutput,
    ElectricalMaintenancePracticeEngine, ElectricalMaintenancePracticeInput, ElectricalMaintenancePracticeOutput,
    PowerElectronicsDrivesEngine, PowerElectronicsDrivesInput, PowerElectronicsDrivesOutput,
    Microcontroller8051Engine, Microcontroller8051Input, Microcontroller8051Output,
    SwitchgearProtectionEngine, SwitchgearProtectionInput, SwitchgearProtectionOutput,
    ElectricTractionHeatingEngine, ElectricTractionHeatingInput, ElectricTractionHeatingOutput,
    IlluminationEngineeringEngine, IlluminationEngineeringInput, IlluminationEngineeringOutput,
    EnergyAuditConservationEngine, EnergyAuditConservationInput, EnergyAuditConservationOutput,
    ElectricalDesignEstimationEngine, ElectricalDesignEstimationInput, ElectricalDesignEstimationOutput,
    ElectricalInstallationTestingEngine, ElectricalInstallationTestingInput, ElectricalInstallationTestingOutput,
    ElectricalWorkshop2Engine, ElectricalWorkshop2Input, ElectricalWorkshop2Output,
    IndustrialAutomationPLCEngine, IndustrialAutomationPLCInput, IndustrialAutomationPLCOutput,
    ProcessControlInstrumentationEngine, ProcessControlInstrumentationInput, ProcessControlInstrumentationOutput,
    ControlElectricalMachinesEngine, ControlElectricalMachinesInput, ControlElectricalMachinesOutput,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simulators-server")

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
NHITVISUALLAB_DIR = BASE_DIR / "nhitvisuallab"
MODELS_DIR = FRONTEND_DIR / "models"

FRONTEND_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Simulators Platform API",
    description="Decoupled Python Physics & WebGL Engineering Simulation Engine",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registry of simulation engines
differential_engine = DifferentialEngine()
clutch_engine = ClutchEngine()
four_stroke_engine = FourStrokeEngine()
two_stroke_engine = TwoStrokeEngine()
steering_engine = SteeringEngine()
valve_timing_engine = ValveTimingEngine()
four_bar_engine = FourBarEngine()
cam_follower_engine = CamFollowerEngine()
gear_trains_engine = GearTrainsEngine()
belt_drive_engine = BeltDriveEngine()
cement_testing_engine = CementTestingEngine()
aggregate_testing_engine = AggregateTestingEngine()
concrete_workability_engine = ConcreteWorkabilityEngine()

# ── CST 3rd Semester Engines ──────────────────────────────────────────────────
data_structures_engine = DataStructuresEngine()
computer_architecture_engine = ComputerArchitectureEngine()
digital_logic_design_engine = DigitalLogicDesignEngine()
pc_hardware_assembly_engine = PCHardwareAssemblyEngine()
discrete_mathematics_engine = DiscreteMathematicsEngine()

# ── CST 4th Semester Engines ──────────────────────────────────────────────────
microprocessor_8085_engine = Microprocessor8085Engine()
computer_networks_engine = ComputerNetworksEngine()
rdbms_sql_database_engine = RdbmsSqlDatabaseEngine()
object_oriented_programming_engine = ObjectOrientedProgrammingEngine()
computer_graphics_engine = ComputerGraphicsEngine()
web_development_engine = WebDevelopmentEngine()

# ── CST 5th Semester Engines ──────────────────────────────────────────────────
software_engineering_engine = SoftwareEngineeringEngine()
java_programming_engine = JavaProgrammingEngine()
operating_systems_engine = OperatingSystemsEngine()
theory_of_computation_engine = TheoryOfComputationEngine()
network_administration_engine = NetworkAdministrationEngine()
multimedia_animation_engine = MultimediaAnimationEngine()

# ── CST 6th Semester Engines ──────────────────────────────────────────────────
advanced_java_engine = AdvancedJavaEngine()
compiler_design_engine = CompilerDesignEngine()
numerical_methods_engine = NumericalMethodsEngine()
advanced_web_tech_engine = AdvancedWebTechnologyEngine()
digital_image_processing_engine = DigitalImageProcessingEngine()
cloud_cyber_security_engine = CloudCyberSecurityEngine()

# ── EE 3rd Semester Engines ───────────────────────────────────────────────────
circuit_theory_engine = CircuitTheoryEngine()
electrical_measurements_engine = ElectricalMeasurementsEngine()
basic_electronics_ee_engine = BasicElectronicsEEEngine()
c_programming_ee_engine = CProgrammingEEEngine()
electrical_wiring_workshop_engine = ElectricalWiringWorkshopEngine()
elements_mechanical_ee_engine = ElementsMechanicalEEEngine()

# ── EE 4th Semester Engines ───────────────────────────────────────────────────
electrical_machines_2_engine = ElectricalMachines2Engine()
electrical_measurement_control_engine = ElectricalMeasurementControlEngine()
applied_digital_electronics_engine = AppliedDigitalElectronicsEngine()
electrical_cad_drawing_engine = ElectricalCadDrawingEngine()
power_plant_engineering_engine = PowerPlantEngineeringEngine()
electrical_maintenance_practice_engine = ElectricalMaintenancePracticeEngine()

# ── EE 5th Semester Engines ───────────────────────────────────────────────────
power_electronics_drives_engine = PowerElectronicsDrivesEngine()
microcontroller_8051_engine = Microcontroller8051Engine()
switchgear_protection_engine = SwitchgearProtectionEngine()
electric_traction_heating_engine = ElectricTractionHeatingEngine()
illumination_engineering_engine = IlluminationEngineeringEngine()
energy_audit_conservation_engine = EnergyAuditConservationEngine()

# ── EE 6th Semester Engines ───────────────────────────────────────────────────
electrical_design_estimation_engine = ElectricalDesignEstimationEngine()
electrical_installation_testing_engine = ElectricalInstallationTestingEngine()
electrical_workshop_2_engine = ElectricalWorkshop2Engine()
industrial_automation_plc_engine = IndustrialAutomationPLCEngine()
process_control_instrumentation_engine = ProcessControlInstrumentationEngine()
control_electrical_machines_engine = ControlElectricalMachinesEngine()

# ── Batch 4: Strength of Materials & Structural Design Engines ────────────────
stress_strain_engine = StressStrainEngine()
shaft_torsion_engine = ShaftTorsionEngine()
column_buckling_engine = ColumnBucklingEngine()
mohrs_circle_engine = MohrsCircleEngine()
pressure_vessel_engine = PressureVesselEngine()
spring_design_engine = SpringDesignEngine()
bolted_joint_engine = BoltedJointEngine()
riveted_joints_engine = RivetedJointsEngine()
weld_strength_engine = WeldStrengthEngine()
crack_propagation_engine = CrackPropagationEngine()
rivet_joint_designer_engine = RivetJointDesignerEngine()
truss_analysis_engine = TrussStructuralAnalysisEngine()

# (route_prefix, engine_instance, input_cls, output_cls, html_file)
BATCH4 = [
    ("stress-strain", stress_strain_engine, StressStrainInput, StressStrainOutput, "stress_strain.html"),
    ("shaft-torsion", shaft_torsion_engine, ShaftTorsionInput, ShaftTorsionOutput, "shaft_torsion.html"),
    ("column-buckling", column_buckling_engine, ColumnBucklingInput, ColumnBucklingOutput, "column_buckling.html"),
    ("mohrs-circle", mohrs_circle_engine, MohrsCircleInput, MohrsCircleOutput, "mohrs_circle.html"),
    ("pressure-vessel", pressure_vessel_engine, PressureVesselInput, PressureVesselOutput, "pressure_vessel.html"),
    ("spring-design", spring_design_engine, SpringDesignInput, SpringDesignOutput, "spring_design.html"),
    ("bolted-joint", bolted_joint_engine, BoltedJointInput, BoltedJointOutput, "bolted_joint.html"),
    ("riveted-joints", riveted_joints_engine, RivetedJointsInput, RivetedJointsOutput, "riveted_joints.html"),
    ("weld-strength", weld_strength_engine, WeldStrengthInput, WeldStrengthOutput, "weld_strength.html"),
    ("crack-propagation", crack_propagation_engine, CrackPropagationInput, CrackPropagationOutput, "crack_propagation.html"),
    ("rivet-joint-designer", rivet_joint_designer_engine, RivetJointDesignerInput, RivetJointDesignerOutput, "rivet_joint_designer.html"),
    ("truss-analysis", truss_analysis_engine, TrussStructuralAnalysisInput, TrussStructuralAnalysisOutput, "truss_analysis.html"),
    ("data-structures", data_structures_engine, DataStructuresInput, DataStructuresOutput, "data_structures.html"),
    ("computer-architecture", computer_architecture_engine, ComputerArchitectureInput, ComputerArchitectureOutput, "computer_architecture.html"),
    ("digital-logic-design", digital_logic_design_engine, DigitalLogicDesignInput, DigitalLogicDesignOutput, "digital_logic_design.html"),
    ("pc-hardware-assembly", pc_hardware_assembly_engine, PCHardwareAssemblyInput, PCHardwareAssemblyOutput, "pc_hardware_assembly.html"),
    ("discrete-mathematics", discrete_mathematics_engine, DiscreteMathematicsInput, DiscreteMathematicsOutput, "discrete_mathematics.html"),
    ("microprocessor-8085", microprocessor_8085_engine, Microprocessor8085Input, Microprocessor8085Output, "microprocessor_8085.html"),
    ("computer-networks", computer_networks_engine, ComputerNetworksInput, ComputerNetworksOutput, "computer_networks.html"),
    ("rdbms-sql-database", rdbms_sql_database_engine, RdbmsSqlDatabaseInput, RdbmsSqlDatabaseOutput, "rdbms_sql_database.html"),
    ("object-oriented-programming", object_oriented_programming_engine, ObjectOrientedProgrammingInput, ObjectOrientedProgrammingOutput, "object_oriented_programming.html"),
    ("computer-graphics", computer_graphics_engine, ComputerGraphicsInput, ComputerGraphicsOutput, "computer_graphics.html"),
    ("web-development", web_development_engine, WebDevelopmentInput, WebDevelopmentOutput, "web_development.html"),
    ("software-engineering", software_engineering_engine, SoftwareEngineeringInput, SoftwareEngineeringOutput, "software_engineering.html"),
    ("java-programming", java_programming_engine, JavaProgrammingInput, JavaProgrammingOutput, "java_programming.html"),
    ("operating-systems", operating_systems_engine, OperatingSystemsInput, OperatingSystemsOutput, "operating_systems.html"),
    ("theory-of-computation", theory_of_computation_engine, TheoryOfComputationInput, TheoryOfComputationOutput, "theory_of_computation.html"),
    ("network-administration", network_administration_engine, NetworkAdministrationInput, NetworkAdministrationOutput, "network_administration.html"),
    ("multimedia-animation", multimedia_animation_engine, MultimediaAnimationInput, MultimediaAnimationOutput, "multimedia_animation.html"),
    ("advanced-java", advanced_java_engine, AdvancedJavaInput, AdvancedJavaOutput, "advanced_java.html"),
    ("compiler-design", compiler_design_engine, CompilerDesignInput, CompilerDesignOutput, "compiler_design.html"),
    ("numerical-methods", numerical_methods_engine, NumericalMethodsInput, NumericalMethodsOutput, "numerical_methods.html"),
    ("advanced-web-tech", advanced_web_tech_engine, AdvancedWebTechnologyInput, AdvancedWebTechnologyOutput, "advanced_web_tech.html"),
    ("digital-image-processing", digital_image_processing_engine, DigitalImageProcessingInput, DigitalImageProcessingOutput, "digital_image_processing.html"),
    ("cloud-cyber-security", cloud_cyber_security_engine, CloudCyberSecurityInput, CloudCyberSecurityOutput, "cloud_cyber_security.html"),
    ("circuit-theory", circuit_theory_engine, CircuitTheoryInput, CircuitTheoryOutput, "circuit_theory.html"),
    ("electrical-measurements", electrical_measurements_engine, ElectricalMeasurementsInput, ElectricalMeasurementsOutput, "electrical_measurements.html"),
    ("basic-electronics-ee", basic_electronics_ee_engine, BasicElectronicsEEInput, BasicElectronicsEEOutput, "basic_electronics_ee.html"),
    ("c-programming-ee", c_programming_ee_engine, CProgrammingEEInput, CProgrammingEEOutput, "c_programming_ee.html"),
    ("electrical-wiring-workshop", electrical_wiring_workshop_engine, ElectricalWiringWorkshopInput, ElectricalWiringWorkshopOutput, "electrical_wiring_workshop.html"),
    ("elements-mechanical-ee", elements_mechanical_ee_engine, ElementsMechanicalEEInput, ElementsMechanicalEEOutput, "elements_mechanical_ee.html"),
    ("electrical-machines-2", electrical_machines_2_engine, ElectricalMachines2Input, ElectricalMachines2Output, "electrical_machines_2.html"),
    ("electrical-measurement-control", electrical_measurement_control_engine, ElectricalMeasurementControlInput, ElectricalMeasurementControlOutput, "electrical_measurement_control.html"),
    ("applied-digital-electronics", applied_digital_electronics_engine, AppliedDigitalElectronicsInput, AppliedDigitalElectronicsOutput, "applied_digital_electronics.html"),
    ("electrical-cad-drawing", electrical_cad_drawing_engine, ElectricalCadDrawingInput, ElectricalCadDrawingOutput, "electrical_cad_drawing.html"),
    ("power-plant-engineering", power_plant_engineering_engine, PowerPlantEngineeringInput, PowerPlantEngineeringOutput, "power_plant_engineering.html"),
    ("electrical-maintenance-practice", electrical_maintenance_practice_engine, ElectricalMaintenancePracticeInput, ElectricalMaintenancePracticeOutput, "electrical_maintenance_practice.html"),
    ("power-electronics-drives", power_electronics_drives_engine, PowerElectronicsDrivesInput, PowerElectronicsDrivesOutput, "power_electronics_drives.html"),
    ("microcontroller-8051", microcontroller_8051_engine, Microcontroller8051Input, Microcontroller8051Output, "microcontroller_8051.html"),
    ("switchgear-protection", switchgear_protection_engine, SwitchgearProtectionInput, SwitchgearProtectionOutput, "switchgear_protection.html"),
    ("electric-traction-heating", electric_traction_heating_engine, ElectricTractionHeatingInput, ElectricTractionHeatingOutput, "electric_traction_heating.html"),
    ("illumination-engineering", illumination_engineering_engine, IlluminationEngineeringInput, IlluminationEngineeringOutput, "illumination_engineering.html"),
    ("energy-audit-conservation", energy_audit_conservation_engine, EnergyAuditConservationInput, EnergyAuditConservationOutput, "energy_audit_conservation.html"),
    ("electrical-design-estimation", electrical_design_estimation_engine, ElectricalDesignEstimationInput, ElectricalDesignEstimationOutput, "electrical_design_estimation.html"),
    ("electrical-installation-testing", electrical_installation_testing_engine, ElectricalInstallationTestingInput, ElectricalInstallationTestingOutput, "electrical_installation_testing.html"),
    ("electrical-workshop-2", electrical_workshop_2_engine, ElectricalWorkshop2Input, ElectricalWorkshop2Output, "electrical_workshop_2.html"),
    ("industrial-automation-plc", industrial_automation_plc_engine, IndustrialAutomationPLCInput, IndustrialAutomationPLCOutput, "industrial_automation_plc.html"),
    ("process-control-instrumentation", process_control_instrumentation_engine, ProcessControlInstrumentationInput, ProcessControlInstrumentationOutput, "process_control_instrumentation.html"),
    ("control-electrical-machines", control_electrical_machines_engine, ControlElectricalMachinesInput, ControlElectricalMachinesOutput, "control_electrical_machines.html"),
]


def _make_ws_handler(engine, input_cls):
    async def _handler(websocket: WebSocket):
        await handle_ws_session(websocket, engine, input_cls)
    return _handler


def _make_sim_route(engine, input_cls, output_cls):
    async def _route(params: input_cls):
        return engine.calculate(params)
    return _route


def _make_preset_route(engine):
    async def _route():
        return engine.get_presets()
    return _route


V2_TEMPLATE = FRONTEND_DIR / "v2_tool.html"


def _make_html_route(tool_id):
    def _route():
        html = V2_TEMPLATE.read_text(encoding="utf-8").replace("__TOOL_ID__", tool_id)
        return HTMLResponse(html)
    return _route


for _prefix, _engine, _in, _out, _html in BATCH4:
    app.add_api_route(
        f"/api/{_prefix}/simulate",
        _make_sim_route(_engine, _in, _out),
        methods=["POST"],
        response_model=_out,
    )
    app.add_api_route(f"/api/{_prefix}/presets", _make_preset_route(_engine), methods=["GET"])
    app.add_api_websocket_route(f"/ws/{_prefix}", _make_ws_handler(_engine, _in))
    app.add_api_route(f"/{_prefix}.html", _make_html_route(_prefix), methods=["GET"])
    # Also accept the underscore variant used by some legacy sidebar links
    _us = _prefix.replace("-", "_")
    if _us != _prefix:
        app.add_api_route(f"/{_us}.html", _make_html_route(_prefix), methods=["GET"])


# Generic V2 HTML page for every V1 tool directory (3D-only when no live engine).
# The V2 tab loads /<slug>.html?embed=1 from the migrated tool index pages.
_batch4_slugs = {p for p, _e, _i, _o, _h in BATCH4}
_tool_root = NHITVISUALLAB_DIR / "tools"
if _tool_root.exists():
    for _d in sorted(_tool_root.iterdir()):
        if not _d.is_dir():
            continue
        _slug = _d.name
        if _slug in _batch4_slugs:
            continue
        app.add_api_route(f"/{_slug}.html", _make_html_route(_slug), methods=["GET"])
        _uslug = _slug.replace("-", "_")
        if _uslug != _slug:
            app.add_api_route(f"/{_uslug}.html", _make_html_route(_slug), methods=["GET"])


@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "platform_version": "2.0.0",
        "batch_1_automobile_core": [
            {"id": "automotive-differential", "ws_endpoint": "/ws/differential"},
            {"id": "automotive-clutch", "ws_endpoint": "/ws/clutch"},
            {"id": "four-stroke-engine", "ws_endpoint": "/ws/four-stroke"},
            {"id": "two-stroke-engine", "ws_endpoint": "/ws/two-stroke"},
            {"id": "steering-geometry", "ws_endpoint": "/ws/steering"},
            {"id": "valve-timing-diagram", "ws_endpoint": "/ws/valve-timing"},
        ],
        "batch_2_tom_kinematics": [
            {"id": "four-bar-linkage", "ws_endpoint": "/ws/four-bar"},
            {"id": "cam-follower", "ws_endpoint": "/ws/cam-follower"},
            {"id": "gear-trains", "ws_endpoint": "/ws/gear-trains"},
            {"id": "belt-drive", "ws_endpoint": "/ws/belt-drive"},
        ],
        "wbscte_civil_engineering": [
            {"id": "cement-testing-lab", "ws_endpoint": "/ws/cement-testing"},
            {"id": "aggregate-testing-lab", "ws_endpoint": "/ws/aggregate-testing"},
        ],
        "batch_4_strength_of_materials": [
            {"id": "stress-strain", "ws_endpoint": "/ws/stress-strain"},
            {"id": "shaft-torsion", "ws_endpoint": "/ws/shaft-torsion"},
            {"id": "column-buckling", "ws_endpoint": "/ws/column-buckling"},
            {"id": "mohrs-circle", "ws_endpoint": "/ws/mohrs-circle"},
            {"id": "pressure-vessel", "ws_endpoint": "/ws/pressure-vessel"},
            {"id": "spring-design", "ws_endpoint": "/ws/spring-design"},
            {"id": "bolted-joint", "ws_endpoint": "/ws/bolted-joint"},
            {"id": "riveted-joints", "ws_endpoint": "/ws/riveted-joints"},
            {"id": "weld-strength", "ws_endpoint": "/ws/weld-strength"},
            {"id": "crack-propagation", "ws_endpoint": "/ws/crack-propagation"},
            {"id": "rivet-joint-designer", "ws_endpoint": "/ws/rivet-joint-designer"},
            {"id": "truss-analysis", "ws_endpoint": "/ws/truss-analysis"},
        ],
    }


# ── REST Endpoints ───────────────────────────────────────────────────────────

@app.post("/api/differential/simulate", response_model=DifferentialOutput)
async def simulate_differential(params: DifferentialInput):
    return differential_engine.calculate(params)

@app.get("/api/differential/presets")
async def get_differential_presets():
    return differential_engine.get_presets()


@app.post("/api/clutch/simulate", response_model=ClutchOutput)
async def simulate_clutch(params: ClutchInput):
    return clutch_engine.calculate(params)

@app.get("/api/clutch/presets")
async def get_clutch_presets():
    return clutch_engine.get_presets()


@app.post("/api/four-stroke/simulate", response_model=FourStrokeOutput)
async def simulate_four_stroke(params: FourStrokeInput):
    return four_stroke_engine.calculate(params)

@app.get("/api/four-stroke/presets")
async def get_four_stroke_presets():
    return four_stroke_engine.get_presets()


@app.post("/api/two-stroke/simulate", response_model=TwoStrokeOutput)
async def simulate_two_stroke(params: TwoStrokeInput):
    return two_stroke_engine.calculate(params)

@app.get("/api/two-stroke/presets")
async def get_two_stroke_presets():
    return two_stroke_engine.get_presets()


@app.post("/api/steering/simulate", response_model=SteeringOutput)
async def simulate_steering(params: SteeringInput):
    return steering_engine.calculate(params)

@app.get("/api/steering/presets")
async def get_steering_presets():
    return steering_engine.get_presets()


@app.post("/api/valve-timing/simulate", response_model=ValveTimingOutput)
async def simulate_valve_timing(params: ValveTimingInput):
    return valve_timing_engine.calculate(params)

@app.get("/api/valve-timing/presets")
async def get_valve_timing_presets():
    return valve_timing_engine.get_presets()


@app.post("/api/four-bar/simulate", response_model=FourBarOutput)
async def simulate_four_bar(params: FourBarInput):
    return four_bar_engine.calculate(params)

@app.get("/api/four-bar/presets")
async def get_four_bar_presets():
    return four_bar_engine.get_presets()


@app.post("/api/cam-follower/simulate", response_model=CamFollowerOutput)
async def simulate_cam_follower(params: CamFollowerInput):
    return cam_follower_engine.calculate(params)

@app.get("/api/cam-follower/presets")
async def get_cam_follower_presets():
    return cam_follower_engine.get_presets()


@app.post("/api/gear-trains/simulate", response_model=GearTrainsOutput)
async def simulate_gear_trains(params: GearTrainsInput):
    return gear_trains_engine.calculate(params)

@app.get("/api/gear-trains/presets")
async def get_gear_trains_presets():
    return gear_trains_engine.get_presets()


@app.post("/api/belt-drive/simulate", response_model=BeltDriveOutput)
async def simulate_belt_drive(params: BeltDriveInput):
    return belt_drive_engine.calculate(params)

@app.get("/api/belt-drive/presets")
async def get_belt_drive_presets():
    return belt_drive_engine.get_presets()


@app.post("/api/cement-testing/simulate", response_model=CementTestingOutput)
async def simulate_cement_testing(params: CementTestingInput):
    return cement_testing_engine.calculate(params)

@app.get("/api/cement-testing/presets")
async def get_cement_testing_presets():
    return cement_testing_engine.get_presets()


@app.post("/api/aggregate-testing/simulate", response_model=AggregateTestingOutput)
async def simulate_aggregate_testing(params: AggregateTestingInput):
    return aggregate_testing_engine.calculate(params)

@app.get("/api/aggregate-testing/presets")
async def get_aggregate_testing_presets():
    return aggregate_testing_engine.get_presets()


# ── Generic WebSocket Telemetry Helper ───────────────────────────────────────

async def handle_ws_session(websocket: WebSocket, engine, input_cls):
    await websocket.accept()
    current_state = input_cls()
    initial_output = engine.calculate(current_state)
    await websocket.send_json({"type": "state_update", "payload": initial_output.model_dump()})

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                message = json.loads(raw_data)
                if message.get("type") == "set_state":
                    updated_dict = current_state.model_dump()
                    updated_dict.update(message.get("payload", {}))
                    current_state = input_cls(**updated_dict)
                    output = engine.calculate(current_state)
                    await websocket.send_json({"type": "state_update", "payload": output.model_dump()})
                elif message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception as ex:
                await websocket.send_json({"type": "error", "payload": {"message": str(ex)}})
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/differential")
async def ws_diff(ws: WebSocket):
    await handle_ws_session(ws, differential_engine, DifferentialInput)

@app.websocket("/ws/clutch")
async def ws_clutch(ws: WebSocket):
    await handle_ws_session(ws, clutch_engine, ClutchInput)

@app.websocket("/ws/four-stroke")
async def ws_four_stroke(ws: WebSocket):
    await handle_ws_session(ws, four_stroke_engine, FourStrokeInput)

@app.websocket("/ws/two-stroke")
async def ws_two_stroke(ws: WebSocket):
    await handle_ws_session(ws, two_stroke_engine, TwoStrokeInput)

@app.websocket("/ws/steering")
async def ws_steering(ws: WebSocket):
    await handle_ws_session(ws, steering_engine, SteeringInput)

@app.websocket("/ws/valve-timing")
async def ws_valve_timing(ws: WebSocket):
    await handle_ws_session(ws, valve_timing_engine, ValveTimingInput)

@app.websocket("/ws/four-bar")
async def ws_four_bar(ws: WebSocket):
    await handle_ws_session(ws, four_bar_engine, FourBarInput)

@app.websocket("/ws/cam-follower")
async def ws_cam_follower(ws: WebSocket):
    await handle_ws_session(ws, cam_follower_engine, CamFollowerInput)

@app.websocket("/ws/gear-trains")
async def ws_gear_trains(ws: WebSocket):
    await handle_ws_session(ws, gear_trains_engine, GearTrainsInput)

@app.websocket("/ws/belt-drive")
async def ws_belt_drive(ws: WebSocket):
    await handle_ws_session(ws, belt_drive_engine, BeltDriveInput)

@app.websocket("/ws/cement-testing")
async def ws_cement_testing(ws: WebSocket):
    await handle_ws_session(ws, cement_testing_engine, CementTestingInput)

@app.websocket("/ws/aggregate-testing")
async def ws_aggregate_testing(ws: WebSocket):
    await handle_ws_session(ws, aggregate_testing_engine, AggregateTestingInput)

@app.websocket("/ws/concrete-workability")
async def ws_concrete_workability(ws: WebSocket):
    await handle_ws_session(ws, concrete_workability_engine, ConcreteWorkabilityInput)


# ── Static File Mounts & Frontend Routes ─────────────────────────────────────

if NHITVISUALLAB_DIR.exists():
    app.mount("/nhitvisuallab", StaticFiles(directory=str(NHITVISUALLAB_DIR), html=True), name="nhitvisuallab")

if (FRONTEND_DIR / "css").exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
if (FRONTEND_DIR / "js").exists():
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
if (FRONTEND_DIR / "models").exists():
    app.mount("/models", StaticFiles(directory=str(FRONTEND_DIR / "models")), name="models")

if FRONTEND_DIR.exists():
    app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


@app.get("/differential.html")
@app.get("/automotive_differential.html")
async def serve_differential():
    p = NHITVISUALLAB_DIR / "tools" / "automotive-differential" / "index.html"
    if p.exists():
        return FileResponse(str(p))
    return FileResponse(str(FRONTEND_DIR / "differential.html"))

@app.get("/clutch.html")
async def serve_clutch():
    return FileResponse(str(FRONTEND_DIR / "clutch.html"))

@app.get("/four_stroke.html")
async def serve_four_stroke():
    return FileResponse(str(FRONTEND_DIR / "four_stroke.html"))

@app.get("/two_stroke.html")
async def serve_two_stroke():
    return FileResponse(str(FRONTEND_DIR / "two_stroke.html"))

@app.get("/steering.html")
async def serve_steering():
    return FileResponse(str(FRONTEND_DIR / "steering.html"))

@app.get("/valve_timing.html")
async def serve_valve_timing():
    return FileResponse(str(FRONTEND_DIR / "valve_timing.html"))

@app.get("/four_bar.html")
async def serve_four_bar():
    return FileResponse(str(FRONTEND_DIR / "four_bar.html"))

@app.get("/cam_follower.html")
async def serve_cam_follower():
    return FileResponse(str(FRONTEND_DIR / "cam_follower.html"))

@app.get("/gear_trains.html")
async def serve_gear_trains():
    return FileResponse(str(FRONTEND_DIR / "gear_trains.html"))

@app.get("/belt_drive.html")
async def serve_belt_drive():
    return FileResponse(str(FRONTEND_DIR / "belt_drive.html"))

@app.get("/cement_testing.html")
@app.get("/nhitvisuallab/tools/cement-testing/index.html")
async def serve_cement_testing():
    p1 = NHITVISUALLAB_DIR / "tools" / "cement-testing" / "index.html"
    if p1.exists():
        return FileResponse(str(p1))
    return FileResponse(str(FRONTEND_DIR / "cement_testing.html"))

@app.get("/aggregate_testing.html")
@app.get("/nhitvisuallab/tools/aggregate-testing/index.html")
async def serve_aggregate_testing():
    p2 = NHITVISUALLAB_DIR / "tools" / "aggregate-testing" / "index.html"
    if p2.exists():
        return FileResponse(str(p2))
    return FileResponse(str(FRONTEND_DIR / "aggregate_testing.html"))

@app.get("/nhitvisuallab/tools/concrete-workability/index.html")
async def serve_concrete_workability():
    p3 = NHITVISUALLAB_DIR / "tools" / "concrete-workability" / "index.html"
    if p3.exists():
        return FileResponse(str(p3))
    return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.get("/")
async def root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

# Generic root-level simulation pages: serve frontend/<page>.html at /<page>.html.
# Explicit routes (e.g. /differential.html) above take precedence; this catches the rest
# (including tool pages that only live at the root, like soil_mechanics.html).
@app.get("/{page}.html")
async def serve_root_html(page: str):
    p = FRONTEND_DIR / (page + ".html")
    if p.exists():
        return FileResponse(str(p))
    raise HTTPException(status_code=404, detail="Not found")
