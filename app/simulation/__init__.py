"""Modular Simulation Engines Package"""
from .base import BaseSimulationEngine
from .differential import DifferentialEngine, DifferentialInput, DifferentialOutput
from .clutch import ClutchEngine, ClutchInput, ClutchOutput
from .four_stroke import FourStrokeEngine, FourStrokeInput, FourStrokeOutput
from .two_stroke import TwoStrokeEngine, TwoStrokeInput, TwoStrokeOutput
from .steering import SteeringEngine, SteeringInput, SteeringOutput
from .valve_timing import ValveTimingEngine, ValveTimingInput, ValveTimingOutput

# Batch 2 Engines
from .four_bar import FourBarEngine, FourBarInput, FourBarOutput
from .cam_follower import CamFollowerEngine, CamFollowerInput, CamFollowerOutput
from .gear_trains import GearTrainsEngine, GearTrainsInput, GearTrainsOutput
from .belt_drive import BeltDriveEngine, BeltDriveInput, BeltDriveOutput
from .slider_crank import SliderCrankEngine, SliderCrankInput, SliderCrankOutput
from .scotch_yoke import ScotchYokeEngine, ScotchYokeInput, ScotchYokeOutput
from .geneva_mechanism import GenevaEngine, GenevaInput, GenevaOutput
from .governor import GovernorEngine, GovernorInput, GovernorOutput
from .flywheel import FlywheelEngine, FlywheelInput, FlywheelOutput
from .gyroscope import GyroscopeEngine, GyroscopeInput, GyroscopeOutput
from .vibrations import VibrationsEngine, VibrationsInput, VibrationsOutput
from .shm import SHMEngine, SHMInput, SHMOutput
from .simple_machines import SimpleMachinesEngine, SimpleMachinesInput, SimpleMachinesOutput
from .collision_momentum import CollisionMomentumEngine, CollisionMomentumInput, CollisionMomentumOutput
from .torque_rotation import TorqueRotationEngine, TorqueRotationInput, TorqueRotationOutput

# Batch 3 Engines
from .stress_strain import StressStrainEngine, StressStrainInput, StressStrainOutput
from .beam_bending import BeamBendingEngine, BeamBendingInput, BeamBendingOutput
from .shaft_torsion import ShaftTorsionEngine, ShaftTorsionInput, ShaftTorsionOutput
from .column_buckling import ColumnBucklingEngine, ColumnBucklingInput, ColumnBucklingOutput
from .mohrs_circle import MohrsCircleEngine, MohrsCircleInput, MohrsCircleOutput
from .stress_concentration import StressConcentrationEngine, StressConcentrationInput, StressConcentrationOutput
from .pressure_vessel import PressureVesselEngine, PressureVesselInput, PressureVesselOutput
from .spring_design import SpringDesignEngine, SpringDesignInput, SpringDesignOutput
from .bolted_joint import BoltedJointEngine, BoltedJointInput, BoltedJointOutput
from .riveted_joints import RivetedJointsEngine, RivetedJointsInput, RivetedJointsOutput
from .weld_strength import WeldStrengthEngine, WeldStrengthInput, WeldStrengthOutput
from .bearing_selection import BearingEngine, BearingSelectionInput, BearingSelectionOutput
from .gear_strength import GearStrengthEngine, GearStrengthInput, GearStrengthOutput
from .power_screw import PowerScrewEngine, PowerScrewInput, PowerScrewOutput
from .fatigue_life import FatigueLifeEngine, FatigueLifeInput, FatigueLifeOutput
from .crack_propagation import CrackPropagationEngine, CrackPropagationInput, CrackPropagationOutput
from .cross_section_props import CrossSectionPropsEngine, CrossSectionPropsInput, CrossSectionPropsOutput
from .material_testing import MaterialTestingEngine, MaterialTestingInput, MaterialTestingOutput

# Batch 4 Engines
from .bernoullis_principle import BernoullisPrincipleEngine, BernoullisPrincipleInput, BernoullisPrincipleOutput
from .continuity_equation import ContinuityEquationEngine, ContinuityEquationInput, ContinuityEquationOutput
from .reynolds_number import ReynoldsNumberEngine, ReynoldsNumberInput, ReynoldsNumberOutput
from .fluid_flow import FluidFlowEngine, FluidFlowInput, FluidFlowOutput
from .buoyancy import BuoyancyEngine, BuoyancyInput, BuoyancyOutput
from .pascals_law import PascalsLawEngine, PascalsLawInput, PascalsLawOutput
from .wind_tunnel import WindTunnelEngine, WindTunnelInput, WindTunnelOutput
from .heat_transfer import HeatTransferEngine, HeatTransferInput, HeatTransferOutput
from .heat_exchanger import HeatExchangerEngine, HeatExchangerInput, HeatExchangerOutput
from .stefan_boltzmann import StefanBoltzmannEngine, StefanBoltzmannInput, StefanBoltzmannOutput
from .ideal_gas_law import IdealGasLawEngine, IdealGasLawInput, IdealGasLawOutput
from .thermodynamics import ThermodynamicsEngine, ThermodynamicsInput, ThermodynamicsOutput
from .rankine_cycle import RankineCycleEngine, RankineCycleInput, RankineCycleOutput
from .refrigeration_cycle import RefrigerationCycleEngine, RefrigerationCycleInput, RefrigerationCycleOutput
from .centrifugal_pump import CentrifugalPumpEngine, CentrifugalPumpInput, CentrifugalPumpOutput
from .hydraulic_turbine import HydraulicTurbineEngine, HydraulicTurbineInput, HydraulicTurbineOutput
from .hydraulic_circuit import HydraulicCircuitEngine, HydraulicCircuitInput, HydraulicCircuitOutput
from .pneumatic_circuit import PneumaticCircuitEngine, PneumaticCircuitInput, PneumaticCircuitOutput
from .thermal_power_plant import ThermalPowerPlantEngine, ThermalPowerPlantInput, ThermalPowerPlantOutput
from .morse_test import MorseTestEngine, MorseTestInput, MorseTestOutput

# Batch 5 Engines
from .ohms_law import OhmsLawEngine, OhmsLawInput, OhmsLawOutput
from .kirchhoffs_laws import KirchhoffsLawsEngine, KirchhoffsLawsInput, KirchhoffsLawsOutput
from .rlc_circuit import RlcCircuitEngine, RlcCircuitInput, RlcCircuitOutput
from .three_phase_circuit import ThreePhaseCircuitEngine, ThreePhaseCircuitInput, ThreePhaseCircuitOutput
from .transformer import TransformerEngine, TransformerInput, TransformerOutput
from .dc_motor import DcMotorEngine, DcMotorInput, DcMotorOutput
from .induction_motor import InductionMotorEngine, InductionMotorInput, InductionMotorOutput
from .synchronous_machine import SynchronousMachineEngine, SynchronousMachineInput, SynchronousMachineOutput
from .diode_characteristics import DiodeCharacteristicsEngine, DiodeCharacteristicsInput, DiodeCharacteristicsOutput
from .rectifier_circuit import RectifierCircuitEngine, RectifierCircuitInput, RectifierCircuitOutput
from .bjt_transistor import BjtTransistorEngine, BjtTransistorInput, BjtTransistorOutput
from .mosfet_transistor import MosfetTransistorEngine, MosfetTransistorInput, MosfetTransistorOutput
from .op_amp import OpAmpEngine, OpAmpInput, OpAmpOutput
from .logic_gates import LogicGatesEngine, LogicGatesInput, LogicGatesOutput
from .combinational_logic import CombinationalLogicEngine, CombinationalLogicInput, CombinationalLogicOutput
from .sequential_logic import SequentialLogicEngine, SequentialLogicInput, SequentialLogicOutput
from .timer_555 import Timer555Engine, Timer555Input, Timer555Output
from .power_electronics import PowerElectronicsEngine, PowerElectronicsInput, PowerElectronicsOutput
from .solar_pv_cell import SolarPvCellEngine, SolarPvCellInput, SolarPvCellOutput
from .battery_storage import BatteryStorageEngine, BatteryStorageInput, BatteryStorageOutput
from .control_system_pid import ControlSystemPidEngine, ControlSystemPidInput, ControlSystemPidOutput
from .signal_processing_filter import SignalProcessingFilterEngine, SignalProcessingFilterInput, SignalProcessingFilterOutput

# Batch 6 Sub-Suite A: Manufacturing Technology
from .lathe_turning import LatheTurningEngine, LatheTurningInput, LatheTurningOutput
from .milling_cutting import MillingCuttingEngine, MillingCuttingInput, MillingCuttingOutput
from .drilling_mechanics import DrillingMechanicsEngine, DrillingMechanicsInput, DrillingMechanicsOutput
from .grinding_wheel import GrindingWheelEngine, GrindingWheelInput, GrindingWheelOutput
from .sheet_metal_bending import SheetMetalBendingEngine, SheetMetalBendingInput, SheetMetalBendingOutput
from .punching_blanking import PunchingBlankingEngine, PunchingBlankingInput, PunchingBlankingOutput
from .metal_casting import MetalCastingEngine, MetalCastingInput, MetalCastingOutput
from .welding_heat_input import WeldingHeatInputEngine, WeldingHeatInputInput, WeldingHeatInputOutput
from .injection_molding import InjectionMoldingEngine, InjectionMoldingInput, InjectionMoldingOutput
from .additive_3d_printing import Additive3dPrintingEngine, Additive3dPrintingInput, Additive3dPrintingOutput
from .cnc_gcode_machining import CncGcodeMachiningEngine, CncGcodeMachiningInput, CncGcodeMachiningOutput
from .powder_metallurgy import PowderMetallurgyEngine, PowderMetallurgyInput, PowderMetallurgyOutput
from .metal_forging import MetalForgingEngine, MetalForgingInput, MetalForgingOutput
from .metal_extrusion import MetalExtrusionEngine, MetalExtrusionInput, MetalExtrusionOutput
from .wire_drawing import WireDrawingEngine, WireDrawingInput, WireDrawingOutput
from .edm_machining import EdmMachiningEngine, EdmMachiningInput, EdmMachiningOutput
from .laser_beam_cutting import LaserBeamCuttingEngine, LaserBeamCuttingInput, LaserBeamCuttingOutput
from .waterjet_cutting import WaterjetCuttingEngine, WaterjetCuttingInput, WaterjetCuttingOutput
from .plastic_thermoforming import PlasticThermoformingEngine, PlasticThermoformingInput, PlasticThermoformingOutput
from .die_casting_high_pressure import DieCastingHighPressureEngine, DieCastingHighPressureInput, DieCastingHighPressureOutput

# Batch 6 Sub-Suite B: Civil & Structural Engineering
from .concrete_mix_design import ConcreteMixDesignEngine, ConcreteMixDesignInput, ConcreteMixDesignOutput
from .soil_bearing_capacity import SoilBearingCapacityEngine, SoilBearingCapacityInput, SoilBearingCapacityOutput
from .retaining_wall_stability import RetainingWallStabilityEngine, RetainingWallStabilityInput, RetainingWallStabilityOutput
from .truss_structural_analysis import TrussStructuralAnalysisEngine, TrussStructuralAnalysisInput, TrussStructuralAnalysisOutput
from .surveying_leveling import SurveyingLevelingEngine, SurveyingLevelingInput, SurveyingLevelingOutput
from .pavement_design_flex import PavementDesignFlexEngine, PavementDesignFlexInput, PavementDesignFlexOutput
from .hydrology_rational_runoff import HydrologyRationalRunoffEngine, HydrologyRationalRunoffInput, HydrologyRationalRunoffOutput
from .open_channel_manning import OpenChannelManningEngine, OpenChannelManningInput, OpenChannelManningOutput
from .seismic_base_shear import SeismicBaseShearEngine, SeismicBaseShearInput, SeismicBaseShearOutput
from .steel_bolted_connection import SteelBoltedConnectionEngine, SteelBoltedConnectionInput, SteelBoltedConnectionOutput
from .steel_welded_connection import SteelWeldedConnectionEngine, SteelWeldedConnectionInput, SteelWeldedConnectionOutput
from .slope_stability_bishop import SlopeStabilityBishopEngine, SlopeStabilityBishopInput, SlopeStabilityBishopOutput
from .consolidation_settlement import ConsolidationSettlementEngine, ConsolidationSettlementInput, ConsolidationSettlementOutput
from .shear_strength_direct import ShearStrengthDirectEngine, ShearStrengthDirectInput, ShearStrengthDirectOutput
from .concrete_beam_rc import ConcreteBeamRcEngine, ConcreteBeamRcInput, ConcreteBeamRcOutput
from .column_rc_design import ColumnRcDesignEngine, ColumnRcDesignInput, ColumnRcDesignOutput
from .stormwater_pipe_sizing import StormwaterPipeSizingEngine, StormwaterPipeSizingInput, StormwaterPipeSizingOutput
from .traffic_flow_greenshields import TrafficFlowGreenshieldsEngine, TrafficFlowGreenshieldsInput, TrafficFlowGreenshieldsOutput

# Batch 6 Sub-Suite C: Physics & Applied Science
from .geometrical_optics_lens import GeometricalOpticsLensEngine, GeometricalOpticsLensInput, GeometricalOpticsLensOutput
from .wave_interference_young import WaveInterferenceYoungEngine, WaveInterferenceYoungInput, WaveInterferenceYoungOutput
from .doppler_effect_sound import DopplerEffectSoundEngine, DopplerEffectSoundInput, DopplerEffectSoundOutput
from .photoelectric_effect import PhotoelectricEffectEngine, PhotoelectricEffectInput, PhotoelectricEffectOutput
from .radioactive_decay import RadioactiveDecayEngine, RadioactiveDecayInput, RadioactiveDecayOutput
from .projectile_motion import ProjectileMotionEngine, ProjectileMotionInput, ProjectileMotionOutput
from .electrostatics_coulomb import ElectrostaticsCoulombEngine, ElectrostaticsCoulombInput, ElectrostaticsCoulombOutput
from .electromagnetic_induction import ElectromagneticInductionEngine, ElectromagneticInductionInput, ElectromagneticInductionOutput
from .fluid_statics_manometer import FluidStaticsManometerEngine, FluidStaticsManometerInput, FluidStaticsManometerOutput
from .sound_decibel_attenuation import SoundDecibelAttenuationEngine, SoundDecibelAttenuationInput, SoundDecibelAttenuationOutput
from .blackbody_radiation_wien import BlackbodyRadiationWienEngine, BlackbodyRadiationWienInput, BlackbodyRadiationWienOutput
from .special_relativity_lorentz import SpecialRelativityLorentzEngine, SpecialRelativityLorentzInput, SpecialRelativityLorentzOutput
from .heat_conduction_transient import HeatConductionTransientEngine, HeatConductionTransientInput, HeatConductionTransientOutput
from .viscous_fluid_poiseuille import ViscousFluidPoiseuilleEngine, ViscousFluidPoiseuilleInput, ViscousFluidPoiseuilleOutput
from .rotational_inertia_tensor import RotationalInertiaTensorEngine, RotationalInertiaTensorInput, RotationalInertiaTensorOutput

# Batch 6 Sub-Suite D: Metrology, Quality & Production Management
from .vernier_caliper_micrometer import VernierCaliperMicrometerEngine, VernierCaliperMicrometerInput, VernierCaliperMicrometerOutput
from .surface_roughness_profilometer import SurfaceRoughnessProfilometerEngine, SurfaceRoughnessProfilometerInput, SurfaceRoughnessProfilometerOutput
from .coordinate_measuring_machine import CoordinateMeasuringMachineEngine, CoordinateMeasuringMachineInput, CoordinateMeasuringMachineOutput
from .spc_control_charts import SpcControlChartsEngine, SpcControlChartsInput, SpcControlChartsOutput
from .iso_tolerance_fits import IsoToleranceFitsEngine, IsoToleranceFitsInput, IsoToleranceFitsOutput
from .hardness_testing_rockwell import HardnessTestingRockwellEngine, HardnessTestingRockwellInput, HardnessTestingRockwellOutput
from .ndt_ultrasonic_testing import NdtUltrasonicTestingEngine, NdtUltrasonicTestingInput, NdtUltrasonicTestingOutput
from .sine_bar_angle_measurement import SineBarAngleMeasurementEngine, SineBarAngleMeasurementInput, SineBarAngleMeasurementOutput
from .optical_interferometer_flatness import OpticalInterferometerFlatnessEngine, OpticalInterferometerFlatnessInput, OpticalInterferometerFlatnessOutput
from .economic_order_quantity import EconomicOrderQuantityEngine, EconomicOrderQuantityInput, EconomicOrderQuantityOutput
from .line_balancing_takt_time import LineBalancingTaktTimeEngine, LineBalancingTaktTimeInput, LineBalancingTaktTimeOutput
from .overall_equipment_effectiveness import OverallEquipmentEffectivenessEngine, OverallEquipmentEffectivenessInput, OverallEquipmentEffectivenessOutput

__all__ = [
    "BaseSimulationEngine",
    "DifferentialEngine", "DifferentialInput", "DifferentialOutput",
    "ClutchEngine", "ClutchInput", "ClutchOutput",
    "FourStrokeEngine", "FourStrokeInput", "FourStrokeOutput",
    "TwoStrokeEngine", "TwoStrokeInput", "TwoStrokeOutput",
    "SteeringEngine", "SteeringInput", "SteeringOutput",
    "ValveTimingEngine", "ValveTimingInput", "ValveTimingOutput",
    # Batch 2
    "FourBarEngine", "FourBarInput", "FourBarOutput",
    "CamFollowerEngine", "CamFollowerInput", "CamFollowerOutput",
    "GearTrainsEngine", "GearTrainsInput", "GearTrainsOutput",
    "BeltDriveEngine", "BeltDriveInput", "BeltDriveOutput",
    "SliderCrankEngine", "SliderCrankInput", "SliderCrankOutput",
    "ScotchYokeEngine", "ScotchYokeInput", "ScotchYokeOutput",
    "GenevaEngine", "GenevaInput", "GenevaOutput",
    "GovernorEngine", "GovernorInput", "GovernorOutput",
    "FlywheelEngine", "FlywheelInput", "FlywheelOutput",
    "GyroscopeEngine", "GyroscopeInput", "GyroscopeOutput",
    "VibrationsEngine", "VibrationsInput", "VibrationsOutput",
    "SHMEngine", "SHMInput", "SHMOutput",
    "SimpleMachinesEngine", "SimpleMachinesInput", "SimpleMachinesOutput",
    "CollisionMomentumEngine", "CollisionMomentumInput", "CollisionMomentumOutput",
    "TorqueRotationEngine", "TorqueRotationInput", "TorqueRotationOutput",
    # Batch 3
    "StressStrainEngine", "StressStrainInput", "StressStrainOutput",
    "BeamBendingEngine", "BeamBendingInput", "BeamBendingOutput",
    "ShaftTorsionEngine", "ShaftTorsionInput", "ShaftTorsionOutput",
    "ColumnBucklingEngine", "ColumnBucklingInput", "ColumnBucklingOutput",
    "MohrsCircleEngine", "MohrsCircleInput", "MohrsCircleOutput",
    "StressConcentrationEngine", "StressConcentrationInput", "StressConcentrationOutput",
    "PressureVesselEngine", "PressureVesselInput", "PressureVesselOutput",
    "SpringDesignEngine", "SpringDesignInput", "SpringDesignOutput",
    "BoltedJointEngine", "BoltedJointInput", "BoltedJointOutput",
    "RivetedJointsEngine", "RivetedJointsInput", "RivetedJointsOutput",
    "WeldStrengthEngine", "WeldStrengthInput", "WeldStrengthOutput",
    "BearingEngine", "BearingSelectionInput", "BearingSelectionOutput",
    "GearStrengthEngine", "GearStrengthInput", "GearStrengthOutput",
    "PowerScrewEngine", "PowerScrewInput", "PowerScrewOutput",
    "FatigueLifeEngine", "FatigueLifeInput", "FatigueLifeOutput",
    "CrackPropagationEngine", "CrackPropagationInput", "CrackPropagationOutput",
    "CrossSectionPropsEngine", "CrossSectionPropsInput", "CrossSectionPropsOutput",
    "MaterialTestingEngine", "MaterialTestingInput", "MaterialTestingOutput",
    # Batch 4
    "BernoullisPrincipleEngine", "BernoullisPrincipleInput", "BernoullisPrincipleOutput",
    "ContinuityEquationEngine", "ContinuityEquationInput", "ContinuityEquationOutput",
    "ReynoldsNumberEngine", "ReynoldsNumberInput", "ReynoldsNumberOutput",
    "FluidFlowEngine", "FluidFlowInput", "FluidFlowOutput",
    "BuoyancyEngine", "BuoyancyInput", "BuoyancyOutput",
    "PascalsLawEngine", "PascalsLawInput", "PascalsLawOutput",
    "WindTunnelEngine", "WindTunnelInput", "WindTunnelOutput",
    "HeatTransferEngine", "HeatTransferInput", "HeatTransferOutput",
    "HeatExchangerEngine", "HeatExchangerInput", "HeatExchangerOutput",
    "StefanBoltzmannEngine", "StefanBoltzmannInput", "StefanBoltzmannOutput",
    "IdealGasLawEngine", "IdealGasLawInput", "IdealGasLawOutput",
    "ThermodynamicsEngine", "ThermodynamicsInput", "ThermodynamicsOutput",
    "RankineCycleEngine", "RankineCycleInput", "RankineCycleOutput",
    "RefrigerationCycleEngine", "RefrigerationCycleInput", "RefrigerationCycleOutput",
    "CentrifugalPumpEngine", "CentrifugalPumpInput", "CentrifugalPumpOutput",
    "HydraulicTurbineEngine", "HydraulicTurbineInput", "HydraulicTurbineOutput",
    "HydraulicCircuitEngine", "HydraulicCircuitInput", "HydraulicCircuitOutput",
    "PneumaticCircuitEngine", "PneumaticCircuitInput", "PneumaticCircuitOutput",
    "ThermalPowerPlantEngine", "ThermalPowerPlantInput", "ThermalPowerPlantOutput",
    "MorseTestEngine", "MorseTestInput", "MorseTestOutput",
    # Batch 5
    "OhmsLawEngine", "OhmsLawInput", "OhmsLawOutput",
    "KirchhoffsLawsEngine", "KirchhoffsLawsInput", "KirchhoffsLawsOutput",
    "RlcCircuitEngine", "RlcCircuitInput", "RlcCircuitOutput",
    "ThreePhaseCircuitEngine", "ThreePhaseCircuitInput", "ThreePhaseCircuitOutput",
    "TransformerEngine", "TransformerInput", "TransformerOutput",
    "DcMotorEngine", "DcMotorInput", "DcMotorOutput",
    "InductionMotorEngine", "InductionMotorInput", "InductionMotorOutput",
    "SynchronousMachineEngine", "SynchronousMachineInput", "SynchronousMachineOutput",
    "DiodeCharacteristicsEngine", "DiodeCharacteristicsInput", "DiodeCharacteristicsOutput",
    "RectifierCircuitEngine", "RectifierCircuitInput", "RectifierCircuitOutput",
    "BjtTransistorEngine", "BjtTransistorInput", "BjtTransistorOutput",
    "MosfetTransistorEngine", "MosfetTransistorInput", "MosfetTransistorOutput",
    "OpAmpEngine", "OpAmpInput", "OpAmpOutput",
    "LogicGatesEngine", "LogicGatesInput", "LogicGatesOutput",
    "CombinationalLogicEngine", "CombinationalLogicInput", "CombinationalLogicOutput",
    "SequentialLogicEngine", "SequentialLogicInput", "SequentialLogicOutput",
    "Timer555Engine", "Timer555Input", "Timer555Output",
    "PowerElectronicsEngine", "PowerElectronicsInput", "PowerElectronicsOutput",
    "SolarPvCellEngine", "SolarPvCellInput", "SolarPvCellOutput",
    "BatteryStorageEngine", "BatteryStorageInput", "BatteryStorageOutput",
    "ControlSystemPidEngine", "ControlSystemPidInput", "ControlSystemPidOutput",
    "SignalProcessingFilterEngine", "SignalProcessingFilterInput", "SignalProcessingFilterOutput",
    # Batch 6 Sub-Suite A
    "LatheTurningEngine", "LatheTurningInput", "LatheTurningOutput",
    "MillingCuttingEngine", "MillingCuttingInput", "MillingCuttingOutput",
    "DrillingMechanicsEngine", "DrillingMechanicsInput", "DrillingMechanicsOutput",
    "GrindingWheelEngine", "GrindingWheelInput", "GrindingWheelOutput",
    "SheetMetalBendingEngine", "SheetMetalBendingInput", "SheetMetalBendingOutput",
    "PunchingBlankingEngine", "PunchingBlankingInput", "PunchingBlankingOutput",
    "MetalCastingEngine", "MetalCastingInput", "MetalCastingOutput",
    "WeldingHeatInputEngine", "WeldingHeatInputInput", "WeldingHeatInputOutput",
    "InjectionMoldingEngine", "InjectionMoldingInput", "InjectionMoldingOutput",
    "Additive3dPrintingEngine", "Additive3dPrintingInput", "Additive3dPrintingOutput",
    "CncGcodeMachiningEngine", "CncGcodeMachiningInput", "CncGcodeMachiningOutput",
    "PowderMetallurgyEngine", "PowderMetallurgyInput", "PowderMetallurgyOutput",
    "MetalForgingEngine", "MetalForgingInput", "MetalForgingOutput",
    "MetalExtrusionEngine", "MetalExtrusionInput", "MetalExtrusionOutput",
    "WireDrawingEngine", "WireDrawingInput", "WireDrawingOutput",
    "EdmMachiningEngine", "EdmMachiningInput", "EdmMachiningOutput",
    "LaserBeamCuttingEngine", "LaserBeamCuttingInput", "LaserBeamCuttingOutput",
    "WaterjetCuttingEngine", "WaterjetCuttingInput", "WaterjetCuttingOutput",
    "PlasticThermoformingEngine", "PlasticThermoformingInput", "PlasticThermoformingOutput",
    "DieCastingHighPressureEngine", "DieCastingHighPressureInput", "DieCastingHighPressureOutput",
    # Batch 6 Sub-Suite B
    "ConcreteMixDesignEngine", "ConcreteMixDesignInput", "ConcreteMixDesignOutput",
    "SoilBearingCapacityEngine", "SoilBearingCapacityInput", "SoilBearingCapacityOutput",
    "RetainingWallStabilityEngine", "RetainingWallStabilityInput", "RetainingWallStabilityOutput",
    "TrussStructuralAnalysisEngine", "TrussStructuralAnalysisInput", "TrussStructuralAnalysisOutput",
    "SurveyingLevelingEngine", "SurveyingLevelingInput", "SurveyingLevelingOutput",
    "PavementDesignFlexEngine", "PavementDesignFlexInput", "PavementDesignFlexOutput",
    "HydrologyRationalRunoffEngine", "HydrologyRationalRunoffInput", "HydrologyRationalRunoffOutput",
    "OpenChannelManningEngine", "OpenChannelManningInput", "OpenChannelManningOutput",
    "SeismicBaseShearEngine", "SeismicBaseShearInput", "SeismicBaseShearOutput",
    "SteelBoltedConnectionEngine", "SteelBoltedConnectionInput", "SteelBoltedConnectionOutput",
    "SteelWeldedConnectionEngine", "SteelWeldedConnectionInput", "SteelWeldedConnectionOutput",
    "SlopeStabilityBishopEngine", "SlopeStabilityBishopInput", "SlopeStabilityBishopOutput",
    "ConsolidationSettlementEngine", "ConsolidationSettlementInput", "ConsolidationSettlementOutput",
    "ShearStrengthDirectEngine", "ShearStrengthDirectInput", "ShearStrengthDirectOutput",
    "ConcreteBeamRcEngine", "ConcreteBeamRcInput", "ConcreteBeamRcOutput",
    "ColumnRcDesignEngine", "ColumnRcDesignInput", "ColumnRcDesignOutput",
    "StormwaterPipeSizingEngine", "StormwaterPipeSizingInput", "StormwaterPipeSizingOutput",
    "TrafficFlowGreenshieldsEngine", "TrafficFlowGreenshieldsInput", "TrafficFlowGreenshieldsOutput",
    # Batch 6 Sub-Suite C
    "GeometricalOpticsLensEngine", "GeometricalOpticsLensInput", "GeometricalOpticsLensOutput",
    "WaveInterferenceYoungEngine", "WaveInterferenceYoungInput", "WaveInterferenceYoungOutput",
    "DopplerEffectSoundEngine", "DopplerEffectSoundInput", "DopplerEffectSoundOutput",
    "PhotoelectricEffectEngine", "PhotoelectricEffectInput", "PhotoelectricEffectOutput",
    "RadioactiveDecayEngine", "RadioactiveDecayInput", "RadioactiveDecayOutput",
    "ProjectileMotionEngine", "ProjectileMotionInput", "ProjectileMotionOutput",
    "ElectrostaticsCoulombEngine", "ElectrostaticsCoulombInput", "ElectrostaticsCoulombOutput",
    "ElectromagneticInductionEngine", "ElectromagneticInductionInput", "ElectromagneticInductionOutput",
    "FluidStaticsManometerEngine", "FluidStaticsManometerInput", "FluidStaticsManometerOutput",
    "SoundDecibelAttenuationEngine", "SoundDecibelAttenuationInput", "SoundDecibelAttenuationOutput",
    "BlackbodyRadiationWienEngine", "BlackbodyRadiationWienInput", "BlackbodyRadiationWienOutput",
    "SpecialRelativityLorentzEngine", "SpecialRelativityLorentzInput", "SpecialRelativityLorentzOutput",
    "HeatConductionTransientEngine", "HeatConductionTransientInput", "HeatConductionTransientOutput",
    "ViscousFluidPoiseuilleEngine", "ViscousFluidPoiseuilleInput", "ViscousFluidPoiseuilleOutput",
    "RotationalInertiaTensorEngine", "RotationalInertiaTensorInput", "RotationalInertiaTensorOutput",
    # Batch 6 Sub-Suite D
    "VernierCaliperMicrometerEngine", "VernierCaliperMicrometerInput", "VernierCaliperMicrometerOutput",
    "SurfaceRoughnessProfilometerEngine", "SurfaceRoughnessProfilometerInput", "SurfaceRoughnessProfilometerOutput",
    "CoordinateMeasuringMachineEngine", "CoordinateMeasuringMachineInput", "CoordinateMeasuringMachineOutput",
    "SpcControlChartsEngine", "SpcControlChartsInput", "SpcControlChartsOutput",
    "IsoToleranceFitsEngine", "IsoToleranceFitsInput", "IsoToleranceFitsOutput",
    "HardnessTestingRockwellEngine", "HardnessTestingRockwellInput", "HardnessTestingRockwellOutput",
    "NdtUltrasonicTestingEngine", "NdtUltrasonicTestingInput", "NdtUltrasonicTestingOutput",
    "SineBarAngleMeasurementEngine", "SineBarAngleMeasurementInput", "SineBarAngleMeasurementOutput",
    "OpticalInterferometerFlatnessEngine", "OpticalInterferometerFlatnessInput", "OpticalInterferometerFlatnessOutput",
    "EconomicOrderQuantityEngine", "EconomicOrderQuantityInput", "EconomicOrderQuantityOutput",
    "LineBalancingTaktTimeEngine", "LineBalancingTaktTimeInput", "LineBalancingTaktTimeOutput",
    "OverallEquipmentEffectivenessEngine", "OverallEquipmentEffectivenessInput", "OverallEquipmentEffectivenessOutput",
]
