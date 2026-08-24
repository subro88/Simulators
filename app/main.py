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
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse

from app.simulation import (
    DifferentialEngine, DifferentialInput, DifferentialOutput,
    ClutchEngine, ClutchInput, ClutchOutput,
    FourStrokeEngine, FourStrokeInput, FourStrokeOutput,
    TwoStrokeEngine, TwoStrokeInput, TwoStrokeOutput,
    SteeringEngine, SteeringInput, SteeringOutput,
    ValveTimingEngine, ValveTimingInput, ValveTimingOutput,
    # Batch 2
    FourBarEngine, FourBarInput, FourBarOutput,
    CamFollowerEngine, CamFollowerInput, CamFollowerOutput,
    GearTrainsEngine, GearTrainsInput, GearTrainsOutput,
    BeltDriveEngine, BeltDriveInput, BeltDriveOutput,
    SliderCrankEngine, SliderCrankInput, SliderCrankOutput,
    ScotchYokeEngine, ScotchYokeInput, ScotchYokeOutput,
    GenevaEngine, GenevaInput, GenevaOutput,
    GovernorEngine, GovernorInput, GovernorOutput,
    FlywheelEngine, FlywheelInput, FlywheelOutput,
    GyroscopeEngine, GyroscopeInput, GyroscopeOutput,
    VibrationsEngine, VibrationsInput, VibrationsOutput,
    SHMEngine, SHMInput, SHMOutput,
    SimpleMachinesEngine, SimpleMachinesInput, SimpleMachinesOutput,
    CollisionMomentumEngine, CollisionMomentumInput, CollisionMomentumOutput,
    TorqueRotationEngine, TorqueRotationInput, TorqueRotationOutput,
    # Batch 3
    StressStrainEngine, StressStrainInput, StressStrainOutput,
    BeamBendingEngine, BeamBendingInput, BeamBendingOutput,
    ShaftTorsionEngine, ShaftTorsionInput, ShaftTorsionOutput,
    ColumnBucklingEngine, ColumnBucklingInput, ColumnBucklingOutput,
    MohrsCircleEngine, MohrsCircleInput, MohrsCircleOutput,
    StressConcentrationEngine, StressConcentrationInput, StressConcentrationOutput,
    PressureVesselEngine, PressureVesselInput, PressureVesselOutput,
    SpringDesignEngine, SpringDesignInput, SpringDesignOutput,
    BoltedJointEngine, BoltedJointInput, BoltedJointOutput,
    RivetedJointsEngine, RivetedJointsInput, RivetedJointsOutput,
    WeldStrengthEngine, WeldStrengthInput, WeldStrengthOutput,
    BearingEngine, BearingSelectionInput, BearingSelectionOutput,
    GearStrengthEngine, GearStrengthInput, GearStrengthOutput,
    PowerScrewEngine, PowerScrewInput, PowerScrewOutput,
    FatigueLifeEngine, FatigueLifeInput, FatigueLifeOutput,
    CrackPropagationEngine, CrackPropagationInput, CrackPropagationOutput,
    CrossSectionPropsEngine, CrossSectionPropsInput, CrossSectionPropsOutput,
    MaterialTestingEngine, MaterialTestingInput, MaterialTestingOutput,
    # Batch 4
    BernoullisPrincipleEngine, BernoullisPrincipleInput, BernoullisPrincipleOutput,
    ContinuityEquationEngine, ContinuityEquationInput, ContinuityEquationOutput,
    ReynoldsNumberEngine, ReynoldsNumberInput, ReynoldsNumberOutput,
    FluidFlowEngine, FluidFlowInput, FluidFlowOutput,
    BuoyancyEngine, BuoyancyInput, BuoyancyOutput,
    PascalsLawEngine, PascalsLawInput, PascalsLawOutput,
    WindTunnelEngine, WindTunnelInput, WindTunnelOutput,
    HeatTransferEngine, HeatTransferInput, HeatTransferOutput,
    HeatExchangerEngine, HeatExchangerInput, HeatExchangerOutput,
    StefanBoltzmannEngine, StefanBoltzmannInput, StefanBoltzmannOutput,
    IdealGasLawEngine, IdealGasLawInput, IdealGasLawOutput,
    ThermodynamicsEngine, ThermodynamicsInput, ThermodynamicsOutput,
    RankineCycleEngine, RankineCycleInput, RankineCycleOutput,
    RefrigerationCycleEngine, RefrigerationCycleInput, RefrigerationCycleOutput,
    CentrifugalPumpEngine, CentrifugalPumpInput, CentrifugalPumpOutput,
    HydraulicTurbineEngine, HydraulicTurbineInput, HydraulicTurbineOutput,
    HydraulicCircuitEngine, HydraulicCircuitInput, HydraulicCircuitOutput,
    PneumaticCircuitEngine, PneumaticCircuitInput, PneumaticCircuitOutput,
    ThermalPowerPlantEngine, ThermalPowerPlantInput, ThermalPowerPlantOutput,
    MorseTestEngine, MorseTestInput, MorseTestOutput,
    # Batch 5
    OhmsLawEngine, OhmsLawInput, OhmsLawOutput,
    KirchhoffsLawsEngine, KirchhoffsLawsInput, KirchhoffsLawsOutput,
    RlcCircuitEngine, RlcCircuitInput, RlcCircuitOutput,
    ThreePhaseCircuitEngine, ThreePhaseCircuitInput, ThreePhaseCircuitOutput,
    TransformerEngine, TransformerInput, TransformerOutput,
    DcMotorEngine, DcMotorInput, DcMotorOutput,
    InductionMotorEngine, InductionMotorInput, InductionMotorOutput,
    SynchronousMachineEngine, SynchronousMachineInput, SynchronousMachineOutput,
    DiodeCharacteristicsEngine, DiodeCharacteristicsInput, DiodeCharacteristicsOutput,
    RectifierCircuitEngine, RectifierCircuitInput, RectifierCircuitOutput,
    BjtTransistorEngine, BjtTransistorInput, BjtTransistorOutput,
    MosfetTransistorEngine, MosfetTransistorInput, MosfetTransistorOutput,
    OpAmpEngine, OpAmpInput, OpAmpOutput,
    LogicGatesEngine, LogicGatesInput, LogicGatesOutput,
    CombinationalLogicEngine, CombinationalLogicInput, CombinationalLogicOutput,
    SequentialLogicEngine, SequentialLogicInput, SequentialLogicOutput,
    Timer555Engine, Timer555Input, Timer555Output,
    PowerElectronicsEngine, PowerElectronicsInput, PowerElectronicsOutput,
    SolarPvCellEngine, SolarPvCellInput, SolarPvCellOutput,
    BatteryStorageEngine, BatteryStorageInput, BatteryStorageOutput,
    ControlSystemPidEngine, ControlSystemPidInput, ControlSystemPidOutput,
    SignalProcessingFilterEngine, SignalProcessingFilterInput, SignalProcessingFilterOutput,
    # Batch 6 Sub-Suite A
    LatheTurningEngine, LatheTurningInput, LatheTurningOutput,
    MillingCuttingEngine, MillingCuttingInput, MillingCuttingOutput,
    DrillingMechanicsEngine, DrillingMechanicsInput, DrillingMechanicsOutput,
    GrindingWheelEngine, GrindingWheelInput, GrindingWheelOutput,
    SheetMetalBendingEngine, SheetMetalBendingInput, SheetMetalBendingOutput,
    PunchingBlankingEngine, PunchingBlankingInput, PunchingBlankingOutput,
    MetalCastingEngine, MetalCastingInput, MetalCastingOutput,
    WeldingHeatInputEngine, WeldingHeatInputInput, WeldingHeatInputOutput,
    InjectionMoldingEngine, InjectionMoldingInput, InjectionMoldingOutput,
    Additive3dPrintingEngine, Additive3dPrintingInput, Additive3dPrintingOutput,
    CncGcodeMachiningEngine, CncGcodeMachiningInput, CncGcodeMachiningOutput,
    PowderMetallurgyEngine, PowderMetallurgyInput, PowderMetallurgyOutput,
    MetalForgingEngine, MetalForgingInput, MetalForgingOutput,
    MetalExtrusionEngine, MetalExtrusionInput, MetalExtrusionOutput,
    WireDrawingEngine, WireDrawingInput, WireDrawingOutput,
    EdmMachiningEngine, EdmMachiningInput, EdmMachiningOutput,
    LaserBeamCuttingEngine, LaserBeamCuttingInput, LaserBeamCuttingOutput,
    WaterjetCuttingEngine, WaterjetCuttingInput, WaterjetCuttingOutput,
    PlasticThermoformingEngine, PlasticThermoformingInput, PlasticThermoformingOutput,
    DieCastingHighPressureEngine, DieCastingHighPressureInput, DieCastingHighPressureOutput,
    # Batch 6 Sub-Suite B
    ConcreteMixDesignEngine, ConcreteMixDesignInput, ConcreteMixDesignOutput,
    SoilBearingCapacityEngine, SoilBearingCapacityInput, SoilBearingCapacityOutput,
    RetainingWallStabilityEngine, RetainingWallStabilityInput, RetainingWallStabilityOutput,
    TrussStructuralAnalysisEngine, TrussStructuralAnalysisInput, TrussStructuralAnalysisOutput,
    SurveyingLevelingEngine, SurveyingLevelingInput, SurveyingLevelingOutput,
    PavementDesignFlexEngine, PavementDesignFlexInput, PavementDesignFlexOutput,
    HydrologyRationalRunoffEngine, HydrologyRationalRunoffInput, HydrologyRationalRunoffOutput,
    OpenChannelManningEngine, OpenChannelManningInput, OpenChannelManningOutput,
    SeismicBaseShearEngine, SeismicBaseShearInput, SeismicBaseShearOutput,
    SteelBoltedConnectionEngine, SteelBoltedConnectionInput, SteelBoltedConnectionOutput,
    SteelWeldedConnectionEngine, SteelWeldedConnectionInput, SteelWeldedConnectionOutput,
    SlopeStabilityBishopEngine, SlopeStabilityBishopInput, SlopeStabilityBishopOutput,
    ConsolidationSettlementEngine, ConsolidationSettlementInput, ConsolidationSettlementOutput,
    ShearStrengthDirectEngine, ShearStrengthDirectInput, ShearStrengthDirectOutput,
    ConcreteBeamRcEngine, ConcreteBeamRcInput, ConcreteBeamRcOutput,
    ColumnRcDesignEngine, ColumnRcDesignInput, ColumnRcDesignOutput,
    StormwaterPipeSizingEngine, StormwaterPipeSizingInput, StormwaterPipeSizingOutput,
    TrafficFlowGreenshieldsEngine, TrafficFlowGreenshieldsInput, TrafficFlowGreenshieldsOutput,
    # Batch 6 Sub-Suite C
    GeometricalOpticsLensEngine, GeometricalOpticsLensInput, GeometricalOpticsLensOutput,
    WaveInterferenceYoungEngine, WaveInterferenceYoungInput, WaveInterferenceYoungOutput,
    DopplerEffectSoundEngine, DopplerEffectSoundInput, DopplerEffectSoundOutput,
    PhotoelectricEffectEngine, PhotoelectricEffectInput, PhotoelectricEffectOutput,
    RadioactiveDecayEngine, RadioactiveDecayInput, RadioactiveDecayOutput,
    ProjectileMotionEngine, ProjectileMotionInput, ProjectileMotionOutput,
    ElectrostaticsCoulombEngine, ElectrostaticsCoulombInput, ElectrostaticsCoulombOutput,
    ElectromagneticInductionEngine, ElectromagneticInductionInput, ElectromagneticInductionOutput,
    FluidStaticsManometerEngine, FluidStaticsManometerInput, FluidStaticsManometerOutput,
    SoundDecibelAttenuationEngine, SoundDecibelAttenuationInput, SoundDecibelAttenuationOutput,
    BlackbodyRadiationWienEngine, BlackbodyRadiationWienInput, BlackbodyRadiationWienOutput,
    SpecialRelativityLorentzEngine, SpecialRelativityLorentzInput, SpecialRelativityLorentzOutput,
    HeatConductionTransientEngine, HeatConductionTransientInput, HeatConductionTransientOutput,
    ViscousFluidPoiseuilleEngine, ViscousFluidPoiseuilleInput, ViscousFluidPoiseuilleOutput,
    RotationalInertiaTensorEngine, RotationalInertiaTensorInput, RotationalInertiaTensorOutput,
    # Batch 6 Sub-Suite D
    VernierCaliperMicrometerEngine, VernierCaliperMicrometerInput, VernierCaliperMicrometerOutput,
    SurfaceRoughnessProfilometerEngine, SurfaceRoughnessProfilometerInput, SurfaceRoughnessProfilometerOutput,
    CoordinateMeasuringMachineEngine, CoordinateMeasuringMachineInput, CoordinateMeasuringMachineOutput,
    SpcControlChartsEngine, SpcControlChartsInput, SpcControlChartsOutput,
    IsoToleranceFitsEngine, IsoToleranceFitsInput, IsoToleranceFitsOutput,
    HardnessTestingRockwellEngine, HardnessTestingRockwellInput, HardnessTestingRockwellOutput,
    NdtUltrasonicTestingEngine, NdtUltrasonicTestingInput, NdtUltrasonicTestingOutput,
    SineBarAngleMeasurementEngine, SineBarAngleMeasurementInput, SineBarAngleMeasurementOutput,
    OpticalInterferometerFlatnessEngine, OpticalInterferometerFlatnessInput, OpticalInterferometerFlatnessOutput,
    EconomicOrderQuantityEngine, EconomicOrderQuantityInput, EconomicOrderQuantityOutput,
    LineBalancingTaktTimeEngine, LineBalancingTaktTimeInput, LineBalancingTaktTimeOutput,
    OverallEquipmentEffectivenessEngine, OverallEquipmentEffectivenessInput, OverallEquipmentEffectivenessOutput
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

# Batch 2 Engines
four_bar_engine = FourBarEngine()
cam_follower_engine = CamFollowerEngine()
gear_trains_engine = GearTrainsEngine()
belt_drive_engine = BeltDriveEngine()
slider_crank_engine = SliderCrankEngine()
scotch_yoke_engine = ScotchYokeEngine()
geneva_engine = GenevaEngine()
governor_engine = GovernorEngine()
flywheel_engine = FlywheelEngine()
gyroscope_engine = GyroscopeEngine()
vibrations_engine = VibrationsEngine()
shm_engine = SHMEngine()
simple_machines_engine = SimpleMachinesEngine()
collision_momentum_engine = CollisionMomentumEngine()
torque_rotation_engine = TorqueRotationEngine()

# Batch 3 Engines
stress_strain_engine = StressStrainEngine()
beam_bending_engine = BeamBendingEngine()
shaft_torsion_engine = ShaftTorsionEngine()
column_buckling_engine = ColumnBucklingEngine()
mohrs_circle_engine = MohrsCircleEngine()
stress_concentration_engine = StressConcentrationEngine()
pressure_vessel_engine = PressureVesselEngine()
spring_design_engine = SpringDesignEngine()
bolted_joint_engine = BoltedJointEngine()
riveted_joints_engine = RivetedJointsEngine()
weld_strength_engine = WeldStrengthEngine()
bearing_engine = BearingEngine()
gear_strength_engine = GearStrengthEngine()
power_screw_engine = PowerScrewEngine()
fatigue_life_engine = FatigueLifeEngine()
crack_propagation_engine = CrackPropagationEngine()
cross_section_props_engine = CrossSectionPropsEngine()
material_testing_engine = MaterialTestingEngine()

# Batch 4 Engines
bernoullis_principle_engine = BernoullisPrincipleEngine()
continuity_equation_engine = ContinuityEquationEngine()
reynolds_number_engine = ReynoldsNumberEngine()
fluid_flow_engine = FluidFlowEngine()
buoyancy_engine = BuoyancyEngine()
pascals_law_engine = PascalsLawEngine()
wind_tunnel_engine = WindTunnelEngine()
heat_transfer_engine = HeatTransferEngine()
heat_exchanger_engine = HeatExchangerEngine()
stefan_boltzmann_engine = StefanBoltzmannEngine()
ideal_gas_law_engine = IdealGasLawEngine()
thermodynamics_engine = ThermodynamicsEngine()
rankine_cycle_engine = RankineCycleEngine()
refrigeration_cycle_engine = RefrigerationCycleEngine()
centrifugal_pump_engine = CentrifugalPumpEngine()
hydraulic_turbine_engine = HydraulicTurbineEngine()
hydraulic_circuit_engine = HydraulicCircuitEngine()
pneumatic_circuit_engine = PneumaticCircuitEngine()
thermal_power_plant_engine = ThermalPowerPlantEngine()
morse_test_engine = MorseTestEngine()

# Batch 5 Engines
ohms_law_engine = OhmsLawEngine()
kirchhoffs_laws_engine = KirchhoffsLawsEngine()
rlc_circuit_engine = RlcCircuitEngine()
three_phase_circuit_engine = ThreePhaseCircuitEngine()
transformer_engine = TransformerEngine()
dc_motor_engine = DcMotorEngine()
induction_motor_engine = InductionMotorEngine()
synchronous_machine_engine = SynchronousMachineEngine()
diode_characteristics_engine = DiodeCharacteristicsEngine()
rectifier_circuit_engine = RectifierCircuitEngine()
bjt_transistor_engine = BjtTransistorEngine()
mosfet_transistor_engine = MosfetTransistorEngine()
op_amp_engine = OpAmpEngine()
logic_gates_engine = LogicGatesEngine()
combinational_logic_engine = CombinationalLogicEngine()
sequential_logic_engine = SequentialLogicEngine()
timer_555_engine = Timer555Engine()
power_electronics_engine = PowerElectronicsEngine()
solar_pv_cell_engine = SolarPvCellEngine()
battery_storage_engine = BatteryStorageEngine()
control_system_pid_engine = ControlSystemPidEngine()
signal_processing_filter_engine = SignalProcessingFilterEngine()

# Batch 6 Sub-Suite A Engines
lathe_turning_engine = LatheTurningEngine()
milling_cutting_engine = MillingCuttingEngine()
drilling_mechanics_engine = DrillingMechanicsEngine()
grinding_wheel_engine = GrindingWheelEngine()
sheet_metal_bending_engine = SheetMetalBendingEngine()
punching_blanking_engine = PunchingBlankingEngine()
metal_casting_engine = MetalCastingEngine()
welding_heat_input_engine = WeldingHeatInputEngine()
injection_molding_engine = InjectionMoldingEngine()
additive_3d_printing_engine = Additive3dPrintingEngine()
cnc_gcode_machining_engine = CncGcodeMachiningEngine()
powder_metallurgy_engine = PowderMetallurgyEngine()
metal_forging_engine = MetalForgingEngine()
metal_extrusion_engine = MetalExtrusionEngine()
wire_drawing_engine = WireDrawingEngine()
edm_machining_engine = EdmMachiningEngine()
laser_beam_cutting_engine = LaserBeamCuttingEngine()
waterjet_cutting_engine = WaterjetCuttingEngine()
plastic_thermoforming_engine = PlasticThermoformingEngine()
die_casting_high_pressure_engine = DieCastingHighPressureEngine()

# Batch 6 Sub-Suite B Engines
concrete_mix_design_engine = ConcreteMixDesignEngine()
soil_bearing_capacity_engine = SoilBearingCapacityEngine()
retaining_wall_stability_engine = RetainingWallStabilityEngine()
truss_structural_analysis_engine = TrussStructuralAnalysisEngine()
surveying_leveling_engine = SurveyingLevelingEngine()
pavement_design_flex_engine = PavementDesignFlexEngine()
hydrology_rational_runoff_engine = HydrologyRationalRunoffEngine()
open_channel_manning_engine = OpenChannelManningEngine()
seismic_base_shear_engine = SeismicBaseShearEngine()
steel_bolted_connection_engine = SteelBoltedConnectionEngine()
steel_welded_connection_engine = SteelWeldedConnectionEngine()
slope_stability_bishop_engine = SlopeStabilityBishopEngine()
consolidation_settlement_engine = ConsolidationSettlementEngine()
shear_strength_direct_engine = ShearStrengthDirectEngine()
concrete_beam_rc_engine = ConcreteBeamRcEngine()
column_rc_design_engine = ColumnRcDesignEngine()
stormwater_pipe_sizing_engine = StormwaterPipeSizingEngine()
traffic_flow_greenshields_engine = TrafficFlowGreenshieldsEngine()

# Batch 6 Sub-Suite C Engines
geometrical_optics_lens_engine = GeometricalOpticsLensEngine()
wave_interference_young_engine = WaveInterferenceYoungEngine()
doppler_effect_sound_engine = DopplerEffectSoundEngine()
photoelectric_effect_engine = PhotoelectricEffectEngine()
radioactive_decay_engine = RadioactiveDecayEngine()
projectile_motion_engine = ProjectileMotionEngine()
electrostatics_coulomb_engine = ElectrostaticsCoulombEngine()
electromagnetic_induction_engine = ElectromagneticInductionEngine()
fluid_statics_manometer_engine = FluidStaticsManometerEngine()
sound_decibel_attenuation_engine = SoundDecibelAttenuationEngine()
blackbody_radiation_wien_engine = BlackbodyRadiationWienEngine()
special_relativity_lorentz_engine = SpecialRelativityLorentzEngine()
heat_conduction_transient_engine = HeatConductionTransientEngine()
viscous_fluid_poiseuille_engine = ViscousFluidPoiseuilleEngine()
rotational_inertia_tensor_engine = RotationalInertiaTensorEngine()

# Batch 6 Sub-Suite D Engines
vernier_caliper_micrometer_engine = VernierCaliperMicrometerEngine()
surface_roughness_profilometer_engine = SurfaceRoughnessProfilometerEngine()
coordinate_measuring_machine_engine = CoordinateMeasuringMachineEngine()
spc_control_charts_engine = SpcControlChartsEngine()
iso_tolerance_fits_engine = IsoToleranceFitsEngine()
hardness_testing_rockwell_engine = HardnessTestingRockwellEngine()
ndt_ultrasonic_testing_engine = NdtUltrasonicTestingEngine()
sine_bar_angle_measurement_engine = SineBarAngleMeasurementEngine()
optical_interferometer_flatness_engine = OpticalInterferometerFlatnessEngine()
economic_order_quantity_engine = EconomicOrderQuantityEngine()
line_balancing_takt_time_engine = LineBalancingTaktTimeEngine()
overall_equipment_effectiveness_engine = OverallEquipmentEffectivenessEngine()


@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "platform_version": "2.0.0",
        "total_active_tools": 151,
        "batch_6_science_manufacturing_civil": [
            {"id": "lathe-turning", "ws_endpoint": "/ws/lathe-turning"},
            {"id": "milling-cutting", "ws_endpoint": "/ws/milling-cutting"},
            {"id": "drilling-mechanics", "ws_endpoint": "/ws/drilling-mechanics"},
            {"id": "grinding-wheel", "ws_endpoint": "/ws/grinding-wheel"},
            {"id": "sheet-metal-bending", "ws_endpoint": "/ws/sheet-metal-bending"},
            {"id": "punching-blanking", "ws_endpoint": "/ws/punching-blanking"},
            {"id": "metal-casting", "ws_endpoint": "/ws/metal-casting"},
            {"id": "welding-heat-input", "ws_endpoint": "/ws/welding-heat-input"},
            {"id": "injection-molding", "ws_endpoint": "/ws/injection-molding"},
            {"id": "additive-3d-printing", "ws_endpoint": "/ws/additive-3d-printing"},
            {"id": "cnc-gcode-machining", "ws_endpoint": "/ws/cnc-gcode-machining"},
            {"id": "powder-metallurgy", "ws_endpoint": "/ws/powder-metallurgy"},
            {"id": "metal-forging", "ws_endpoint": "/ws/metal-forging"},
            {"id": "metal-extrusion", "ws_endpoint": "/ws/metal-extrusion"},
            {"id": "wire-drawing", "ws_endpoint": "/ws/wire-drawing"},
            {"id": "edm-machining", "ws_endpoint": "/ws/edm-machining"},
            {"id": "laser-beam-cutting", "ws_endpoint": "/ws/laser-beam-cutting"},
            {"id": "waterjet-cutting", "ws_endpoint": "/ws/waterjet-cutting"},
            {"id": "plastic-thermoforming", "ws_endpoint": "/ws/plastic-thermoforming"},
            {"id": "die-casting-high-pressure", "ws_endpoint": "/ws/die-casting-high-pressure"},
            # Civil
            {"id": "concrete-mix-design", "ws_endpoint": "/ws/concrete-mix-design"},
            {"id": "soil-bearing-capacity", "ws_endpoint": "/ws/soil-bearing-capacity"},
            {"id": "retaining-wall-stability", "ws_endpoint": "/ws/retaining-wall-stability"},
            {"id": "truss-structural-analysis", "ws_endpoint": "/ws/truss-structural-analysis"},
            {"id": "surveying-leveling", "ws_endpoint": "/ws/surveying-leveling"},
            {"id": "pavement-design-flex", "ws_endpoint": "/ws/pavement-design-flex"},
            {"id": "hydrology-rational-runoff", "ws_endpoint": "/ws/hydrology-rational-runoff"},
            {"id": "open-channel-manning", "ws_endpoint": "/ws/open-channel-manning"},
            {"id": "seismic-base-shear", "ws_endpoint": "/ws/seismic-base-shear"},
            {"id": "steel-bolted-connection", "ws_endpoint": "/ws/steel-bolted-connection"},
            {"id": "steel-welded-connection", "ws_endpoint": "/ws/steel-welded-connection"},
            {"id": "slope-stability-bishop", "ws_endpoint": "/ws/slope-stability-bishop"},
            {"id": "consolidation-settlement", "ws_endpoint": "/ws/consolidation-settlement"},
            {"id": "shear-strength-direct", "ws_endpoint": "/ws/shear-strength-direct"},
            {"id": "concrete-beam-rc", "ws_endpoint": "/ws/concrete-beam-rc"},
            {"id": "column-rc-design", "ws_endpoint": "/ws/column-rc-design"},
            {"id": "stormwater-pipe-sizing", "ws_endpoint": "/ws/stormwater-pipe-sizing"},
            {"id": "traffic-flow-greenshields", "ws_endpoint": "/ws/traffic-flow-greenshields"},
            # Science
            {"id": "geometrical-optics-lens", "ws_endpoint": "/ws/geometrical-optics-lens"},
            {"id": "wave-interference-young", "ws_endpoint": "/ws/wave-interference-young"},
            {"id": "doppler-effect-sound", "ws_endpoint": "/ws/doppler-effect-sound"},
            {"id": "photoelectric-effect", "ws_endpoint": "/ws/photoelectric-effect"},
            {"id": "radioactive-decay", "ws_endpoint": "/ws/radioactive-decay"},
            {"id": "projectile-motion", "ws_endpoint": "/ws/projectile-motion"},
            {"id": "electrostatics-coulomb", "ws_endpoint": "/ws/electrostatics-coulomb"},
            {"id": "electromagnetic-induction", "ws_endpoint": "/ws/electromagnetic-induction"},
            {"id": "fluid-statics-manometer", "ws_endpoint": "/ws/fluid-statics-manometer"},
            {"id": "sound-decibel-attenuation", "ws_endpoint": "/ws/sound-decibel-attenuation"},
            {"id": "blackbody-radiation-wien", "ws_endpoint": "/ws/blackbody-radiation-wien"},
            {"id": "special-relativity-lorentz", "ws_endpoint": "/ws/special-relativity-lorentz"},
            {"id": "heat-conduction-transient", "ws_endpoint": "/ws/heat-conduction-transient"},
            {"id": "viscous-fluid-poiseuille", "ws_endpoint": "/ws/viscous-fluid-poiseuille"},
            {"id": "rotational-inertia-tensor", "ws_endpoint": "/ws/rotational-inertia-tensor"},
            # Metrology
            {"id": "vernier-caliper-micrometer", "ws_endpoint": "/ws/vernier-caliper-micrometer"},
            {"id": "surface-roughness-profilometer", "ws_endpoint": "/ws/surface-roughness-profilometer"},
            {"id": "coordinate-measuring-machine", "ws_endpoint": "/ws/coordinate-measuring-machine"},
            {"id": "spc-control-charts", "ws_endpoint": "/ws/spc-control-charts"},
            {"id": "iso-tolerance-fits", "ws_endpoint": "/ws/iso-tolerance-fits"},
            {"id": "hardness-testing-rockwell", "ws_endpoint": "/ws/hardness-testing-rockwell"},
            {"id": "ndt-ultrasonic-testing", "ws_endpoint": "/ws/ndt-ultrasonic-testing"},
            {"id": "sine-bar-angle-measurement", "ws_endpoint": "/ws/sine-bar-angle-measurement"},
            {"id": "optical-interferometer-flatness", "ws_endpoint": "/ws/optical-interferometer-flatness"},
            {"id": "economic-order-quantity", "ws_endpoint": "/ws/economic-order-quantity"},
            {"id": "line-balancing-takt-time", "ws_endpoint": "/ws/line-balancing-takt-time"},
            {"id": "overall-equipment-effectiveness", "ws_endpoint": "/ws/overall-equipment-effectiveness"},
        ]
    }

# ── Batch 6 REST Endpoints ───────────────────────────────────────────────────

# Helper to register standard REST routes dynamically for batch 6
def register_engine_rest_routes(name, engine, input_cls, output_cls):
    @app.post(f"/api/{name}/simulate", response_model=output_cls, tags=[name])
    async def simulate(params: input_cls):
        return engine.calculate(params)

    @app.get(f"/api/{name}/presets", tags=[name])
    async def presets():
        return engine.get_presets()

# Sub-Suite A REST
register_engine_rest_routes("lathe-turning", lathe_turning_engine, LatheTurningInput, LatheTurningOutput)
register_engine_rest_routes("milling-cutting", milling_cutting_engine, MillingCuttingInput, MillingCuttingOutput)
register_engine_rest_routes("drilling-mechanics", drilling_mechanics_engine, DrillingMechanicsInput, DrillingMechanicsOutput)
register_engine_rest_routes("grinding-wheel", grinding_wheel_engine, GrindingWheelInput, GrindingWheelOutput)
register_engine_rest_routes("sheet-metal-bending", sheet_metal_bending_engine, SheetMetalBendingInput, SheetMetalBendingOutput)
register_engine_rest_routes("punching-blanking", punching_blanking_engine, PunchingBlankingInput, PunchingBlankingOutput)
register_engine_rest_routes("metal-casting", metal_casting_engine, MetalCastingInput, MetalCastingOutput)
register_engine_rest_routes("welding-heat-input", welding_heat_input_engine, WeldingHeatInputInput, WeldingHeatInputOutput)
register_engine_rest_routes("injection-molding", injection_molding_engine, InjectionMoldingInput, InjectionMoldingOutput)
register_engine_rest_routes("additive-3d-printing", additive_3d_printing_engine, Additive3dPrintingInput, Additive3dPrintingOutput)
register_engine_rest_routes("cnc-gcode-machining", cnc_gcode_machining_engine, CncGcodeMachiningInput, CncGcodeMachiningOutput)
register_engine_rest_routes("powder-metallurgy", powder_metallurgy_engine, PowderMetallurgyInput, PowderMetallurgyOutput)
register_engine_rest_routes("metal-forging", metal_forging_engine, MetalForgingInput, MetalForgingOutput)
register_engine_rest_routes("metal-extrusion", metal_extrusion_engine, MetalExtrusionInput, MetalExtrusionOutput)
register_engine_rest_routes("wire-drawing", wire_drawing_engine, WireDrawingInput, WireDrawingOutput)
register_engine_rest_routes("edm-machining", edm_machining_engine, EdmMachiningInput, EdmMachiningOutput)
register_engine_rest_routes("laser-beam-cutting", laser_beam_cutting_engine, LaserBeamCuttingInput, LaserBeamCuttingOutput)
register_engine_rest_routes("waterjet-cutting", waterjet_cutting_engine, WaterjetCuttingInput, WaterjetCuttingOutput)
register_engine_rest_routes("plastic-thermoforming", plastic_thermoforming_engine, PlasticThermoformingInput, PlasticThermoformingOutput)
register_engine_rest_routes("die-casting-high-pressure", die_casting_high_pressure_engine, DieCastingHighPressureInput, DieCastingHighPressureOutput)

# Sub-Suite B REST
register_engine_rest_routes("concrete-mix-design", concrete_mix_design_engine, ConcreteMixDesignInput, ConcreteMixDesignOutput)
register_engine_rest_routes("soil-bearing-capacity", soil_bearing_capacity_engine, SoilBearingCapacityInput, SoilBearingCapacityOutput)
register_engine_rest_routes("retaining-wall-stability", retaining_wall_stability_engine, RetainingWallStabilityInput, RetainingWallStabilityOutput)
register_engine_rest_routes("truss-structural-analysis", truss_structural_analysis_engine, TrussStructuralAnalysisInput, TrussStructuralAnalysisOutput)
register_engine_rest_routes("surveying-leveling", surveying_leveling_engine, SurveyingLevelingInput, SurveyingLevelingOutput)
register_engine_rest_routes("pavement-design-flex", pavement_design_flex_engine, PavementDesignFlexInput, PavementDesignFlexOutput)
register_engine_rest_routes("hydrology-rational-runoff", hydrology_rational_runoff_engine, HydrologyRationalRunoffInput, HydrologyRationalRunoffOutput)
register_engine_rest_routes("open-channel-manning", open_channel_manning_engine, OpenChannelManningInput, OpenChannelManningOutput)
register_engine_rest_routes("seismic-base-shear", seismic_base_shear_engine, SeismicBaseShearInput, SeismicBaseShearOutput)
register_engine_rest_routes("steel-bolted-connection", steel_bolted_connection_engine, SteelBoltedConnectionInput, SteelBoltedConnectionOutput)
register_engine_rest_routes("steel-welded-connection", steel_welded_connection_engine, SteelWeldedConnectionInput, SteelWeldedConnectionOutput)
register_engine_rest_routes("slope-stability-bishop", slope_stability_bishop_engine, SlopeStabilityBishopInput, SlopeStabilityBishopOutput)
register_engine_rest_routes("consolidation-settlement", consolidation_settlement_engine, ConsolidationSettlementInput, ConsolidationSettlementOutput)
register_engine_rest_routes("shear-strength-direct", shear_strength_direct_engine, ShearStrengthDirectInput, ShearStrengthDirectOutput)
register_engine_rest_routes("concrete-beam-rc", concrete_beam_rc_engine, ConcreteBeamRcInput, ConcreteBeamRcOutput)
register_engine_rest_routes("column-rc-design", column_rc_design_engine, ColumnRcDesignInput, ColumnRcDesignOutput)
register_engine_rest_routes("stormwater-pipe-sizing", stormwater_pipe_sizing_engine, StormwaterPipeSizingInput, StormwaterPipeSizingOutput)
register_engine_rest_routes("traffic-flow-greenshields", traffic_flow_greenshields_engine, TrafficFlowGreenshieldsInput, TrafficFlowGreenshieldsOutput)

# Sub-Suite C REST
register_engine_rest_routes("geometrical-optics-lens", geometrical_optics_lens_engine, GeometricalOpticsLensInput, GeometricalOpticsLensOutput)
register_engine_rest_routes("wave-interference-young", wave_interference_young_engine, WaveInterferenceYoungInput, WaveInterferenceYoungOutput)
register_engine_rest_routes("doppler-effect-sound", doppler_effect_sound_engine, DopplerEffectSoundInput, DopplerEffectSoundOutput)
register_engine_rest_routes("photoelectric-effect", photoelectric_effect_engine, PhotoelectricEffectInput, PhotoelectricEffectOutput)
register_engine_rest_routes("radioactive-decay", radioactive_decay_engine, RadioactiveDecayInput, RadioactiveDecayOutput)
register_engine_rest_routes("projectile-motion", projectile_motion_engine, ProjectileMotionInput, ProjectileMotionOutput)
register_engine_rest_routes("electrostatics-coulomb", electrostatics_coulomb_engine, ElectrostaticsCoulombInput, ElectrostaticsCoulombOutput)
register_engine_rest_routes("electromagnetic-induction", electromagnetic_induction_engine, ElectromagneticInductionInput, ElectromagneticInductionOutput)
register_engine_rest_routes("fluid-statics-manometer", fluid_statics_manometer_engine, FluidStaticsManometerInput, FluidStaticsManometerOutput)
register_engine_rest_routes("sound-decibel-attenuation", sound_decibel_attenuation_engine, SoundDecibelAttenuationInput, SoundDecibelAttenuationOutput)
register_engine_rest_routes("blackbody-radiation-wien", blackbody_radiation_wien_engine, BlackbodyRadiationWienInput, BlackbodyRadiationWienOutput)
register_engine_rest_routes("special-relativity-lorentz", special_relativity_lorentz_engine, SpecialRelativityLorentzInput, SpecialRelativityLorentzOutput)
register_engine_rest_routes("heat-conduction-transient", heat_conduction_transient_engine, HeatConductionTransientInput, HeatConductionTransientOutput)
register_engine_rest_routes("viscous-fluid-poiseuille", viscous_fluid_poiseuille_engine, ViscousFluidPoiseuilleInput, ViscousFluidPoiseuilleOutput)
register_engine_rest_routes("rotational-inertia-tensor", rotational_inertia_tensor_engine, RotationalInertiaTensorInput, RotationalInertiaTensorOutput)

# Sub-Suite D REST
register_engine_rest_routes("vernier-caliper-micrometer", vernier_caliper_micrometer_engine, VernierCaliperMicrometerInput, VernierCaliperMicrometerOutput)
register_engine_rest_routes("surface-roughness-profilometer", surface_roughness_profilometer_engine, SurfaceRoughnessProfilometerInput, SurfaceRoughnessProfilometerOutput)
register_engine_rest_routes("coordinate-measuring-machine", coordinate_measuring_machine_engine, CoordinateMeasuringMachineInput, CoordinateMeasuringMachineOutput)
register_engine_rest_routes("spc-control-charts", spc_control_charts_engine, SpcControlChartsInput, SpcControlChartsOutput)
register_engine_rest_routes("iso-tolerance-fits", iso_tolerance_fits_engine, IsoToleranceFitsInput, IsoToleranceFitsOutput)
register_engine_rest_routes("hardness-testing-rockwell", hardness_testing_rockwell_engine, HardnessTestingRockwellInput, HardnessTestingRockwellOutput)
register_engine_rest_routes("ndt-ultrasonic-testing", ndt_ultrasonic_testing_engine, NdtUltrasonicTestingInput, NdtUltrasonicTestingOutput)
register_engine_rest_routes("sine-bar-angle-measurement", sine_bar_angle_measurement_engine, SineBarAngleMeasurementInput, SineBarAngleMeasurementOutput)
register_engine_rest_routes("optical-interferometer-flatness", optical_interferometer_flatness_engine, OpticalInterferometerFlatnessInput, OpticalInterferometerFlatnessOutput)
register_engine_rest_routes("economic-order-quantity", economic_order_quantity_engine, EconomicOrderQuantityInput, EconomicOrderQuantityOutput)
register_engine_rest_routes("line-balancing-takt-time", line_balancing_takt_time_engine, LineBalancingTaktTimeInput, LineBalancingTaktTimeOutput)
register_engine_rest_routes("overall-equipment-effectiveness", overall_equipment_effectiveness_engine, OverallEquipmentEffectivenessInput, OverallEquipmentEffectivenessOutput)


# ── Generic WebSocket Telemetry Helper ───────────────────────────────────────

async def handle_ws_session(websocket: WebSocket, engine, input_cls):
    await websocket.accept()
    current_state = input_cls()
    initial_output = engine.calculate(current_state)
    await websocket.send_json({"type": "state_update", "payload": initial_output.model_dump()})

    try:
        while True:
            raw_data = await websocket.receive_text()
            msg = json.loads(raw_data)
            if msg.get("type") == "update":
                updated_fields = msg.get("params", {})
                current_dict = current_state.model_dump()
                current_dict.update(updated_fields)
                current_state = input_cls(**current_dict)
                output = engine.calculate(current_state)
                await websocket.send_json({"type": "state_update", "payload": output.model_dump()})

            elif msg.get("type") == "set_preset":
                preset_key = msg.get("preset")
                presets = engine.get_presets()
                if preset_key in presets:
                    preset_params = presets[preset_key]["params"]
                    current_state = input_cls(**preset_params)
                    output = engine.calculate(current_state)
                    await websocket.send_json({
                        "type": "preset_applied",
                        "preset": preset_key,
                        "params": preset_params,
                        "payload": output.model_dump()
                    })

    except WebSocketDisconnect:
        logger.info(f"WebSocket session disconnected for {engine.name}")
    except Exception as e:
        logger.error(f"Error in WebSocket handler for {engine.name}: {e}")
        await websocket.close()

# Batch 6 WebSockets Dynamic Registration
def register_engine_ws_route(name, engine, input_cls):
    @app.websocket(f"/ws/{name}")
    async def ws_handler(ws: WebSocket):
        await handle_ws_session(ws, engine, input_cls)

# Sub-Suite A WS
register_engine_ws_route("lathe-turning", lathe_turning_engine, LatheTurningInput)
register_engine_ws_route("milling-cutting", milling_cutting_engine, MillingCuttingInput)
register_engine_ws_route("drilling-mechanics", drilling_mechanics_engine, DrillingMechanicsInput)
register_engine_ws_route("grinding-wheel", grinding_wheel_engine, GrindingWheelInput)
register_engine_ws_route("sheet-metal-bending", sheet_metal_bending_engine, SheetMetalBendingInput)
register_engine_ws_route("punching-blanking", punching_blanking_engine, PunchingBlankingInput)
register_engine_ws_route("metal-casting", metal_casting_engine, MetalCastingInput)
register_engine_ws_route("welding-heat-input", welding_heat_input_engine, WeldingHeatInputInput)
register_engine_ws_route("injection-molding", injection_molding_engine, InjectionMoldingInput)
register_engine_ws_route("additive-3d-printing", additive_3d_printing_engine, Additive3dPrintingInput)
register_engine_ws_route("cnc-gcode-machining", cnc_gcode_machining_engine, CncGcodeMachiningInput)
register_engine_ws_route("powder-metallurgy", powder_metallurgy_engine, PowderMetallurgyInput)
register_engine_ws_route("metal-forging", metal_forging_engine, MetalForgingInput)
register_engine_ws_route("metal-extrusion", metal_extrusion_engine, MetalExtrusionInput)
register_engine_ws_route("wire-drawing", wire_drawing_engine, WireDrawingInput)
register_engine_ws_route("edm-machining", edm_machining_engine, EdmMachiningInput)
register_engine_ws_route("laser-beam-cutting", laser_beam_cutting_engine, LaserBeamCuttingInput)
register_engine_ws_route("waterjet-cutting", waterjet_cutting_engine, WaterjetCuttingInput)
register_engine_ws_route("plastic-thermoforming", plastic_thermoforming_engine, PlasticThermoformingInput)
register_engine_ws_route("die-casting-high-pressure", die_casting_high_pressure_engine, DieCastingHighPressureInput)

# Sub-Suite B WS
register_engine_ws_route("concrete-mix-design", concrete_mix_design_engine, ConcreteMixDesignInput)
register_engine_ws_route("soil-bearing-capacity", soil_bearing_capacity_engine, SoilBearingCapacityInput)
register_engine_ws_route("retaining-wall-stability", retaining_wall_stability_engine, RetainingWallStabilityInput)
register_engine_ws_route("truss-structural-analysis", truss_structural_analysis_engine, TrussStructuralAnalysisInput)
register_engine_ws_route("surveying-leveling", surveying_leveling_engine, SurveyingLevelingInput)
register_engine_ws_route("pavement-design-flex", pavement_design_flex_engine, PavementDesignFlexInput)
register_engine_ws_route("hydrology-rational-runoff", hydrology_rational_runoff_engine, HydrologyRationalRunoffInput)
register_engine_ws_route("open-channel-manning", open_channel_manning_engine, OpenChannelManningInput)
register_engine_ws_route("seismic-base-shear", seismic_base_shear_engine, SeismicBaseShearInput)
register_engine_ws_route("steel-bolted-connection", steel_bolted_connection_engine, SteelBoltedConnectionInput)
register_engine_ws_route("steel-welded-connection", steel_welded_connection_engine, SteelWeldedConnectionInput)
register_engine_ws_route("slope-stability-bishop", slope_stability_bishop_engine, SlopeStabilityBishopInput)
register_engine_ws_route("consolidation-settlement", consolidation_settlement_engine, ConsolidationSettlementInput)
register_engine_ws_route("shear-strength-direct", shear_strength_direct_engine, ShearStrengthDirectInput)
register_engine_ws_route("concrete-beam-rc", concrete_beam_rc_engine, ConcreteBeamRcInput)
register_engine_ws_route("column-rc-design", column_rc_design_engine, ColumnRcDesignInput)
register_engine_ws_route("stormwater-pipe-sizing", stormwater_pipe_sizing_engine, StormwaterPipeSizingInput)
register_engine_ws_route("traffic-flow-greenshields", traffic_flow_greenshields_engine, TrafficFlowGreenshieldsInput)

# Sub-Suite C WS
register_engine_ws_route("geometrical-optics-lens", geometrical_optics_lens_engine, GeometricalOpticsLensInput)
register_engine_ws_route("wave-interference-young", wave_interference_young_engine, WaveInterferenceYoungInput)
register_engine_ws_route("doppler-effect-sound", doppler_effect_sound_engine, DopplerEffectSoundInput)
register_engine_ws_route("photoelectric-effect", photoelectric_effect_engine, PhotoelectricEffectInput)
register_engine_ws_route("radioactive-decay", radioactive_decay_engine, RadioactiveDecayInput)
register_engine_ws_route("projectile-motion", projectile_motion_engine, ProjectileMotionInput)
register_engine_ws_route("electrostatics-coulomb", electrostatics_coulomb_engine, ElectrostaticsCoulombInput)
register_engine_ws_route("electromagnetic-induction", electromagnetic_induction_engine, ElectromagneticInductionInput)
register_engine_ws_route("fluid-statics-manometer", fluid_statics_manometer_engine, FluidStaticsManometerInput)
register_engine_ws_route("sound-decibel-attenuation", sound_decibel_attenuation_engine, SoundDecibelAttenuationInput)
register_engine_ws_route("blackbody-radiation-wien", blackbody_radiation_wien_engine, BlackbodyRadiationWienInput)
register_engine_ws_route("special-relativity-lorentz", special_relativity_lorentz_engine, SpecialRelativityLorentzInput)
register_engine_ws_route("heat-conduction-transient", heat_conduction_transient_engine, HeatConductionTransientInput)
register_engine_ws_route("viscous-fluid-poiseuille", viscous_fluid_poiseuille_engine, ViscousFluidPoiseuilleInput)
register_engine_ws_route("rotational-inertia-tensor", rotational_inertia_tensor_engine, RotationalInertiaTensorInput)

# Sub-Suite D WS
register_engine_ws_route("vernier-caliper-micrometer", vernier_caliper_micrometer_engine, VernierCaliperMicrometerInput)
register_engine_ws_route("surface-roughness-profilometer", surface_roughness_profilometer_engine, SurfaceRoughnessProfilometerInput)
register_engine_ws_route("coordinate-measuring-machine", coordinate_measuring_machine_engine, CoordinateMeasuringMachineInput)
register_engine_ws_route("spc-control-charts", spc_control_charts_engine, SpcControlChartsInput)
register_engine_ws_route("iso-tolerance-fits", iso_tolerance_fits_engine, IsoToleranceFitsInput)
register_engine_ws_route("hardness-testing-rockwell", hardness_testing_rockwell_engine, HardnessTestingRockwellInput)
register_engine_ws_route("ndt-ultrasonic-testing", ndt_ultrasonic_testing_engine, NdtUltrasonicTestingInput)
register_engine_ws_route("sine-bar-angle-measurement", sine_bar_angle_measurement_engine, SineBarAngleMeasurementInput)
register_engine_ws_route("optical-interferometer-flatness", optical_interferometer_flatness_engine, OpticalInterferometerFlatnessInput)
register_engine_ws_route("economic-order-quantity", economic_order_quantity_engine, EconomicOrderQuantityInput)
register_engine_ws_route("line-balancing-takt-time", line_balancing_takt_time_engine, LineBalancingTaktTimeInput)
register_engine_ws_route("overall-equipment-effectiveness", overall_equipment_effectiveness_engine, OverallEquipmentEffectivenessInput)


# ── Static File Mounts & Frontend Routes ─────────────────────────────────────

if (FRONTEND_DIR / "css").exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/nhitvisuallab/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="nhit_css")
if (FRONTEND_DIR / "js").exists():
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
    app.mount("/nhitvisuallab/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="nhit_js")
if (FRONTEND_DIR / "models").exists():
    app.mount("/models", StaticFiles(directory=str(FRONTEND_DIR / "models")), name="models")
    app.mount("/nhitvisuallab/models", StaticFiles(directory=str(FRONTEND_DIR / "models")), name="nhit_models")

@app.get("/")
@app.get("/index.html")
async def root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.get("/nhitvisuallab/{page_name}.html")
async def serve_nhit_v2_redirect(page_name: str):
    v2_file = FRONTEND_DIR / f"{page_name}.html"
    if v2_file.exists():
        return RedirectResponse(url=f"/{page_name}.html")
    nhit_path = NHITVISUALLAB_DIR / f"{page_name}.html"
    if nhit_path.exists():
        return FileResponse(str(nhit_path))
    raise HTTPException(status_code=404, detail="Page not found")

@app.get("/{page_name}.html")
async def serve_frontend_page(page_name: str):
    file_path = FRONTEND_DIR / f"{page_name}.html"
    if file_path.exists():
        return FileResponse(str(file_path))
    nhit_path = NHITVISUALLAB_DIR / f"{page_name}.html"
    if nhit_path.exists():
        return FileResponse(str(nhit_path))
    raise HTTPException(status_code=404, detail="Page not found")

if NHITVISUALLAB_DIR.exists():
    if (NHITVISUALLAB_DIR / "Icons").exists():
        app.mount("/Icons", StaticFiles(directory=str(NHITVISUALLAB_DIR / "Icons")), name="nhitvisuallab_icons")
    if (NHITVISUALLAB_DIR / "shared").exists():
        app.mount("/shared", StaticFiles(directory=str(NHITVISUALLAB_DIR / "shared")), name="nhitvisuallab_shared")
    if (NHITVISUALLAB_DIR / "brand").exists():
        app.mount("/brand", StaticFiles(directory=str(NHITVISUALLAB_DIR / "brand")), name="nhitvisuallab_brand")
    if (NHITVISUALLAB_DIR / "tools").exists():
        app.mount("/tools", StaticFiles(directory=str(NHITVISUALLAB_DIR / "tools"), html=True), name="nhitvisuallab_tools")
    app.mount("/nhitvisuallab", StaticFiles(directory=str(NHITVISUALLAB_DIR), html=True), name="nhitvisuallab")




