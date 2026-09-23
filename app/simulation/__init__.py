"""Modular Simulation Engines Package"""
from .base import BaseSimulationEngine
from .differential import DifferentialEngine, DifferentialInput, DifferentialOutput
from .clutch import ClutchEngine, ClutchInput, ClutchOutput
from .four_stroke import FourStrokeEngine, FourStrokeInput, FourStrokeOutput
from .two_stroke import TwoStrokeEngine, TwoStrokeInput, TwoStrokeOutput
from .steering import SteeringEngine, SteeringInput, SteeringOutput
from .valve_timing import ValveTimingEngine, ValveTimingInput, ValveTimingOutput
from .four_bar import FourBarEngine, FourBarInput, FourBarOutput
from .cam_follower import CamFollowerEngine, CamFollowerInput, CamFollowerOutput
from .gear_trains import GearTrainsEngine, GearTrainsInput, GearTrainsOutput
from .belt_drive import BeltDriveEngine, BeltDriveInput, BeltDriveOutput
from .cement_testing import CementTestingEngine, CementTestingInput, CementTestingOutput
from .aggregate_testing import AggregateTestingEngine, AggregateTestingInput, AggregateTestingOutput
from .concrete_workability import ConcreteWorkabilityEngine, ConcreteWorkabilityInput, ConcreteWorkabilityOutput
from .rivet_joint_designer import (
    RivetJointDesignerEngine, RivetJointDesignerInput, RivetJointDesignerOutput,
)
from .truss_structural_analysis import (
    TrussStructuralAnalysisEngine, TrussStructuralAnalysisInput, TrussStructuralAnalysisOutput,
)
from .cst_3rd_sem_suite import (
    DataStructuresEngine, DataStructuresInput, DataStructuresOutput,
    ComputerArchitectureEngine, ComputerArchitectureInput, ComputerArchitectureOutput,
    DigitalLogicDesignEngine, DigitalLogicDesignInput, DigitalLogicDesignOutput,
    PCHardwareAssemblyEngine, PCHardwareAssemblyInput, PCHardwareAssemblyOutput,
    DiscreteMathematicsEngine, DiscreteMathematicsInput, DiscreteMathematicsOutput,
)
from .cst_4th_sem_suite import (
    Microprocessor8085Engine, Microprocessor8085Input, Microprocessor8085Output,
    ComputerNetworksEngine, ComputerNetworksInput, ComputerNetworksOutput,
    RdbmsSqlDatabaseEngine, RdbmsSqlDatabaseInput, RdbmsSqlDatabaseOutput,
    ObjectOrientedProgrammingEngine, ObjectOrientedProgrammingInput, ObjectOrientedProgrammingOutput,
    ComputerGraphicsEngine, ComputerGraphicsInput, ComputerGraphicsOutput,
    WebDevelopmentEngine, WebDevelopmentInput, WebDevelopmentOutput,
)
from .cst_5th_sem_suite import (
    SoftwareEngineeringEngine, SoftwareEngineeringInput, SoftwareEngineeringOutput,
    JavaProgrammingEngine, JavaProgrammingInput, JavaProgrammingOutput,
    OperatingSystemsEngine, OperatingSystemsInput, OperatingSystemsOutput,
    TheoryOfComputationEngine, TheoryOfComputationInput, TheoryOfComputationOutput,
    NetworkAdministrationEngine, NetworkAdministrationInput, NetworkAdministrationOutput,
    MultimediaAnimationEngine, MultimediaAnimationInput, MultimediaAnimationOutput,
)
from .cst_6th_sem_suite import (
    AdvancedJavaEngine, AdvancedJavaInput, AdvancedJavaOutput,
    CompilerDesignEngine, CompilerDesignInput, CompilerDesignOutput,
    NumericalMethodsEngine, NumericalMethodsInput, NumericalMethodsOutput,
    AdvancedWebTechnologyEngine, AdvancedWebTechnologyInput, AdvancedWebTechnologyOutput,
    DigitalImageProcessingEngine, DigitalImageProcessingInput, DigitalImageProcessingOutput,
    CloudCyberSecurityEngine, CloudCyberSecurityInput, CloudCyberSecurityOutput,
)
from .ee_3rd_sem_suite import (
    CircuitTheoryEngine, CircuitTheoryInput, CircuitTheoryOutput,
    ElectricalMeasurementsEngine, ElectricalMeasurementsInput, ElectricalMeasurementsOutput,
    BasicElectronicsEEEngine, BasicElectronicsEEInput, BasicElectronicsEEOutput,
    CProgrammingEEEngine, CProgrammingEEInput, CProgrammingEEOutput,
    ElectricalWiringWorkshopEngine, ElectricalWiringWorkshopInput, ElectricalWiringWorkshopOutput,
    ElementsMechanicalEEEngine, ElementsMechanicalEEInput, ElementsMechanicalEEOutput,
)
from .ee_4th_sem_suite import (
    ElectricalMachines2Engine, ElectricalMachines2Input, ElectricalMachines2Output,
    ElectricalMeasurementControlEngine, ElectricalMeasurementControlInput, ElectricalMeasurementControlOutput,
    AppliedDigitalElectronicsEngine, AppliedDigitalElectronicsInput, AppliedDigitalElectronicsOutput,
    ElectricalCadDrawingEngine, ElectricalCadDrawingInput, ElectricalCadDrawingOutput,
    PowerPlantEngineeringEngine, PowerPlantEngineeringInput, PowerPlantEngineeringOutput,
    ElectricalMaintenancePracticeEngine, ElectricalMaintenancePracticeInput, ElectricalMaintenancePracticeOutput,
)
from .ee_5th_sem_suite import (
    PowerElectronicsDrivesEngine, PowerElectronicsDrivesInput, PowerElectronicsDrivesOutput,
    Microcontroller8051Engine, Microcontroller8051Input, Microcontroller8051Output,
    SwitchgearProtectionEngine, SwitchgearProtectionInput, SwitchgearProtectionOutput,
    ElectricTractionHeatingEngine, ElectricTractionHeatingInput, ElectricTractionHeatingOutput,
    IlluminationEngineeringEngine, IlluminationEngineeringInput, IlluminationEngineeringOutput,
    EnergyAuditConservationEngine, EnergyAuditConservationInput, EnergyAuditConservationOutput,
)
from .ee_6th_sem_suite import (
    ElectricalDesignEstimationEngine, ElectricalDesignEstimationInput, ElectricalDesignEstimationOutput,
    ElectricalInstallationTestingEngine, ElectricalInstallationTestingInput, ElectricalInstallationTestingOutput,
    ElectricalWorkshop2Engine, ElectricalWorkshop2Input, ElectricalWorkshop2Output,
    IndustrialAutomationPLCEngine, IndustrialAutomationPLCInput, IndustrialAutomationPLCOutput,
    ProcessControlInstrumentationEngine, ProcessControlInstrumentationInput, ProcessControlInstrumentationOutput,
    ControlElectricalMachinesEngine, ControlElectricalMachinesInput, ControlElectricalMachinesOutput,
)
from .me_3rd_sem_suite import (
    CastingProcessEngine, CastingProcessInput, CastingProcessOutput,
    MetalFormingForgingEngine, MetalFormingForgingInput, MetalFormingForgingOutput,
    WeldingTechnologyEngine, WeldingTechnologyInput, WeldingTechnologyOutput,
    ShaftCouplingsJointsEngine, ShaftCouplingsJointsInput, ShaftCouplingsJointsOutput,
    PlummerBlockBearingsEngine, PlummerBlockBearingsInput, PlummerBlockBearingsOutput,
    IronCarbonPhaseDiagramEngine, IronCarbonPhaseDiagramInput, IronCarbonPhaseDiagramOutput,
    HeatTreatmentMetallurgyEngine, HeatTreatmentMetallurgyInput, HeatTreatmentMetallurgyOutput,
    NDTMaterialsTestingEngine, NDTMaterialsTestingInput, NDTMaterialsTestingOutput,
    AirStandardCyclesEngine, AirStandardCyclesInput, AirStandardCyclesOutput,
    SteamPropertiesMollierEngine, SteamPropertiesMollierInput, SteamPropertiesMollierOutput,
    SteamBoilersMountingsEngine, SteamBoilersMountingsInput, SteamBoilersMountingsOutput,
)
from .me_4th_sem_suite import (
    ReciprocatingAirCompressorEngine, ReciprocatingAirCompressorInput, ReciprocatingAirCompressorOutput,
    GasTurbineBraytonEngine, GasTurbineBraytonInput, GasTurbineBraytonOutput,
    ShaperSlotterMachineEngine, ShaperSlotterMachineInput, ShaperSlotterMachineOutput,
    GrindingWheelAbrasivesEngine, GrindingWheelAbrasivesInput, GrindingWheelAbrasivesOutput,
    UnconventionalMachiningEDMEngine, UnconventionalMachiningEDMInput, UnconventionalMachiningEDMOutput,
    TransducersInstrumentationEngine, TransducersInstrumentationInput, TransducersInstrumentationOutput,
    SineBarSlipGaugesEngine, SineBarSlipGaugesInput, SineBarSlipGaugesOutput,
    ComparatorsSurfaceRoughnessEngine, ComparatorsSurfaceRoughnessInput, ComparatorsSurfaceRoughnessOutput,
    SQCControlChartsEngine, SQCControlChartsInput, SQCControlChartsOutput,
    EpicyclicGearTrainsEngine, EpicyclicGearTrainsInput, EpicyclicGearTrainsOutput,
    GovernorMechanismsEngine, GovernorMechanismsInput, GovernorMechanismsOutput,
    BalancingRotatingMassesEngine, BalancingRotatingMassesInput, BalancingRotatingMassesOutput,
)
from .me_5th_sem_suite import (
    FlowOrificeVenturimeterEngine, FlowOrificeVenturimeterInput, FlowOrificeVenturimeterOutput,
    PipeFrictionMinorLossesEngine, PipeFrictionMinorLossesInput, PipeFrictionMinorLossesOutput,
    HydraulicReactionTurbinesEngine, HydraulicReactionTurbinesInput, HydraulicReactionTurbinesOutput,
    ReciprocatingPumpAirVesselEngine, ReciprocatingPumpAirVesselInput, ReciprocatingPumpAirVesselOutput,
    JigsFixturesDesignEngine, JigsFixturesDesignInput, JigsFixturesDesignOutput,
    CNCPartProgrammingGCodeEngine, CNCPartProgrammingGCodeInput, CNCPartProgrammingGCodeOutput,
    AdvancedMachiningLaserWaterjetEngine, AdvancedMachiningLaserWaterjetInput, AdvancedMachiningLaserWaterjetOutput,
    SteamTurbinesNozzlesEngine, SteamTurbinesNozzlesInput, SteamTurbinesNozzlesOutput,
    SteamCondensersCoolingTowersEngine, SteamCondensersCoolingTowersInput, SteamCondensersCoolingTowersOutput,
    AutomotiveGearboxTransmissionEngine, AutomotiveGearboxTransmissionInput, AutomotiveGearboxTransmissionOutput,
    AutomotiveBrakingABSEngine, AutomotiveBrakingABSInput, AutomotiveBrakingABSOutput,
    PressToolDieDesignEngine, PressToolDieDesignInput, PressToolDieDesignOutput,
)
from .me_6th_sem_suite import (
    PowerScrewsScrewJackEngine, PowerScrewsScrewJackInput, PowerScrewsScrewJackOutput,
    ShaftKeysFlangeCouplingEngine, ShaftKeysFlangeCouplingInput, ShaftKeysFlangeCouplingOutput,
    LeversKnuckleCotterJointEngine, LeversKnuckleCotterJointInput, LeversKnuckleCotterJointOutput,
    HydroPneumaticCircuitsEngine, HydroPneumaticCircuitsInput, HydroPneumaticCircuitsOutput,
    AbsorptionRefrigerationElectroluxEngine, AbsorptionRefrigerationElectroluxInput, AbsorptionRefrigerationElectroluxOutput,
    AirConditioningLoadDuctDesignEngine, AirConditioningLoadDuctDesignInput, AirConditioningLoadDuctDesignOutput,
    CADTransformationsSolidModelingEngine, CADTransformationsSolidModelingInput, CADTransformationsSolidModelingOutput,
    IndustrialRoboticsFMSEngine, IndustrialRoboticsFMSInput, IndustrialRoboticsFMSOutput,
    SolarThermalFlatPlateCollectorEngine, SolarThermalFlatPlateCollectorInput, SolarThermalFlatPlateCollectorOutput,
    BeltConveyorMaterialHandlingEngine, BeltConveyorMaterialHandlingInput, BeltConveyorMaterialHandlingOutput,
    CPMPERTNetworkAnalysisEngine, CPMPERTNetworkAnalysisInput, CPMPERTNetworkAnalysisOutput,
    InventoryControlEOQEngine, InventoryControlEOQInput, InventoryControlEOQOutput,
)
from .etce_3rd_sem_suite import (
    TwoPortNetworksAttenuatorsEngine, TwoPortNetworksAttenuatorsInput, TwoPortNetworksAttenuatorsOutput,
    PassiveFiltersConstantKMDerivedEngine, PassiveFiltersConstantKMDerivedInput, PassiveFiltersConstantKMDerivedOutput,
    RLCTransientResponseEngine, RLCTransientResponseInput, RLCTransientResponseOutput,
    DiodeRectifiersFiltersClippersEngine, DiodeRectifiersFiltersClippersInput, DiodeRectifiersFiltersClippersOutput,
    BJTBiasingStabilityFactorsEngine, BJTBiasingStabilityFactorsInput, BJTBiasingStabilityFactorsOutput,
    FETMOSFETCharacteristicsEngine, FETMOSFETCharacteristicsInput, FETMOSFETCharacteristicsOutput,
    KMapBooleanMinimizationEngine, KMapBooleanMinimizationInput, KMapBooleanMinimizationOutput,
    MultiplexerDemuxDecoderICEngine, MultiplexerDemuxDecoderICInput, MultiplexerDemuxDecoderICOutput,
    FlipFlopsCountersRegistersEngine, FlipFlopsCountersRegistersInput, FlipFlopsCountersRegistersOutput,
    DACADCConvertersEngine, DACADCConvertersInput, DACADCConvertersOutput,
    TransformerEquivalentCircuitRegulationEngine, TransformerEquivalentCircuitRegulationInput, TransformerEquivalentCircuitRegulationOutput,
    DCGeneratorCharacteristicsEMFEngine, DCGeneratorCharacteristicsEMFInput, DCGeneratorCharacteristicsEMFOutput,
)
from .etce_4th_sem_suite import (
    AMFMModulationDemodulationEngine, AMFMModulationDemodulationInput, AMFMModulationDemodulationOutput,
    SuperheterodyneRadioReceiverEngine, SuperheterodyneRadioReceiverInput, SuperheterodyneRadioReceiverOutput,
    PulseCodeModulationSamplingEngine, PulseCodeModulationSamplingInput, PulseCodeModulationSamplingOutput,
    FeedbackAmplifiersTopologiesEngine, FeedbackAmplifiersTopologiesInput, FeedbackAmplifiersTopologiesOutput,
    RCLCCrystalOscillatorsEngine, RCLCCrystalOscillatorsInput, RCLCCrystalOscillatorsOutput,
    SchmittTriggerComparatorsEngine, SchmittTriggerComparatorsInput, SchmittTriggerComparatorsOutput,
    IC555MultivibratorsEngine, IC555MultivibratorsInput, IC555MultivibratorsOutput,
    AudioCrossoverLoudspeakersEngine, AudioCrossoverLoudspeakersInput, AudioCrossoverLoudspeakersOutput,
    ColorTVCompositeVideoEngine, ColorTVCompositeVideoInput, ColorTVCompositeVideoOutput,
    Intel8085MicroprocessorSimulatorEngine, Intel8085MicroprocessorSimulatorInput, Intel8085MicroprocessorSimulatorOutput,
    MicroprocessorMemoryInterfacingEngine, MicroprocessorMemoryInterfacingInput, MicroprocessorMemoryInterfacingOutput,
    PPI8255InterfacingIOEngine, PPI8255InterfacingIOInput, PPI8255InterfacingIOOutput,
)
from .etce_5th_sem_suite import (
    DigitalModulationASKPSKQAMEngine, DigitalModulationASKPSKQAMInput, DigitalModulationASKPSKQAMOutput,
    RectangularWaveguideModesEngine, RectangularWaveguideModesInput, RectangularWaveguideModesOutput,
    ReflexKlystronMagnetronEngine, ReflexKlystronMagnetronInput, ReflexKlystronMagnetronOutput,
    RadarRangeDopplerAntennaEngine, RadarRangeDopplerAntennaInput, RadarRangeDopplerAntennaOutput,
    MaxwellScheringACBridgesEngine, MaxwellScheringACBridgesInput, MaxwellScheringACBridgesOutput,
    HeterodyneSpectrumAnalyzerEngine, HeterodyneSpectrumAnalyzerInput, HeterodyneSpectrumAnalyzerOutput,
    SCRTwoTransistorCommutationEngine, SCRTwoTransistorCommutationInput, SCRTwoTransistorCommutationOutput,
    SinglePhaseFullWaveSCRBridgeEngine, SinglePhaseFullWaveSCRBridgeInput, SinglePhaseFullWaveSCRBridgeOutput,
    DCDCBuckBoostConvertersEngine, DCDCBuckBoostConvertersInput, DCDCBuckBoostConvertersOutput,
    Microcontroller8051TimersUARTEngine, Microcontroller8051TimersUARTInput, Microcontroller8051TimersUARTOutput,
    LCDKeypad8051InterfacingEngine, LCDKeypad8051InterfacingInput, LCDKeypad8051InterfacingOutput,
    DSPDiscreteFourierFFTFIREngine, DSPDiscreteFourierFFTFIRInput, DSPDiscreteFourierFFTFIROutput,
)
from .etce_6th_sem_suite import (
    OpticalFiberLinkAttenuationEngine, OpticalFiberLinkAttenuationInput, OpticalFiberLinkAttenuationOutput,
    SatelliteLinkBudgetLookAnglesEngine, SatelliteLinkBudgetLookAnglesInput, SatelliteLinkBudgetLookAnglesOutput,
    CellularFrequencyReuseHandoffEngine, CellularFrequencyReuseHandoffInput, CellularFrequencyReuseHandoffOutput,
    LVDTDisplacementTransducerEngine, LVDTDisplacementTransducerInput, LVDTDisplacementTransducerOutput,
    StrainGaugeWheatstoneBridgeEngine, StrainGaugeWheatstoneBridgeInput, StrainGaugeWheatstoneBridgeOutput,
    RTDThermocouplePyrometerEngine, RTDThermocouplePyrometerInput, RTDThermocouplePyrometerOutput,
    SecondOrderSystemTransientResponseEngine, SecondOrderSystemTransientResponseInput, SecondOrderSystemTransientResponseOutput,
    RouthHurwitzStabilityCriterionEngine, RouthHurwitzStabilityCriterionInput, RouthHurwitzStabilityCriterionOutput,
    DielectricInductionHeatingEngine, DielectricInductionHeatingInput, DielectricInductionHeatingOutput,
    PLCLadderLogicSimulatorEngine, PLCLadderLogicSimulatorInput, PLCLadderLogicSimulatorOutput,
    UltrasonicFlawDetectorNDTEngine, UltrasonicFlawDetectorNDTInput, UltrasonicFlawDetectorNDTOutput,
    ECGBiopotentialInstrumentationEngine, ECGBiopotentialInstrumentationInput, ECGBiopotentialInstrumentationOutput,
)
from .ce_3rd_sem_suite import (
    PrismaticCompassTraverseSurveyEngine, PrismaticCompassTraverseSurveyInput, PrismaticCompassTraverseSurveyOutput,
    DumpyLevelRiseFallLevellingEngine, DumpyLevelRiseFallLevellingInput, DumpyLevelRiseFallLevellingOutput,
    ContourInterpolationProfileLevellingEngine, ContourInterpolationProfileLevellingInput, ContourInterpolationProfileLevellingOutput,
    TrapezoidalSimpsonEarthworkVolumeEngine, TrapezoidalSimpsonEarthworkVolumeInput, TrapezoidalSimpsonEarthworkVolumeOutput,
    PlaneTableRadiationIntersectionEngine, PlaneTableRadiationIntersectionInput, PlaneTableRadiationIntersectionOutput,
    VicatCementSettingSoundnessEngine, VicatCementSettingSoundnessInput, VicatCementSettingSoundnessOutput,
    BrickMasonryCompressiveWaterAbsorptionEngine, BrickMasonryCompressiveWaterAbsorptionInput, BrickMasonryCompressiveWaterAbsorptionOutput,
    SandBulkingMoistureContentEngine, SandBulkingMoistureContentInput, SandBulkingMoistureContentOutput,
    ConcreteMixDesignIS10262Engine, ConcreteMixDesignIS10262Input, ConcreteMixDesignIS10262Output,
    ConcreteCompactingFactorVeeBeeEngine, ConcreteCompactingFactorVeeBeeInput, ConcreteCompactingFactorVeeBeeOutput,
    SplitTensileFlexuralConcreteStrengthEngine, SplitTensileFlexuralConcreteStrengthInput, SplitTensileFlexuralConcreteStrengthOutput,
    ShearForceBendingMomentDiagramsEngine, ShearForceBendingMomentDiagramsInput, ShearForceBendingMomentDiagramsOutput,
)
from .ce_4th_sem_suite import (
    TransitTheodoliteVernierAnglesEngine, TransitTheodoliteVernierAnglesInput, TransitTheodoliteVernierAnglesOutput,
    TheodoliteTraverseBowditchRuleEngine, TheodoliteTraverseBowditchRuleInput, TheodoliteTraverseBowditchRuleOutput,
    TacheometricStadiaDistanceHeightEngine, TacheometricStadiaDistanceHeightInput, TacheometricStadiaDistanceHeightOutput,
    CircularCurveSettingRankineMethodEngine, CircularCurveSettingRankineMethodInput, CircularCurveSettingRankineMethodOutput,
    SoilPhaseRelationshipsUnitWeightsEngine, SoilPhaseRelationshipsUnitWeightsInput, SoilPhaseRelationshipsUnitWeightsOutput,
    FallingHeadPermeabilityDarcyEngine, FallingHeadPermeabilityDarcyInput, FallingHeadPermeabilityDarcyOutput,
    RankineEarthPressureRetainingWallEngine, RankineEarthPressureRetainingWallInput, RankineEarthPressureRetainingWallOutput,
    UnconfinedCompressionVaneShearEngine, UnconfinedCompressionVaneShearInput, UnconfinedCompressionVaneShearOutput,
    HighwaySuperelevationStoppingSightDistanceEngine, HighwaySuperelevationStoppingSightDistanceInput, HighwaySuperelevationStoppingSightDistanceOutput,
    CaliforniaBearingRatioCBREngine, CaliforniaBearingRatioCBRInput, CaliforniaBearingRatioCBROutput,
    BitumenPenetrationSofteningDuctilityEngine, BitumenPenetrationSofteningDuctilityInput, BitumenPenetrationSofteningDuctilityOutput,
    CropWaterDutyDeltaCanalDesignEngine, CropWaterDutyDeltaCanalDesignInput, CropWaterDutyDeltaCanalDesignOutput,
)
from .ce_5th_sem_suite import (
    RCCSinglyReinforcedBeamIS456Engine, RCCSinglyReinforcedBeamIS456Input, RCCSinglyReinforcedBeamIS456Output,
    RCCDoublyReinforcedBeamIS456Engine, RCCDoublyReinforcedBeamIS456Input, RCCDoublyReinforcedBeamIS456Output,
    RCCFlangedTBeamDesignEngine, RCCFlangedTBeamDesignInput, RCCFlangedTBeamDesignOutput,
    RCCBeamShearDesignStirrupsEngine, RCCBeamShearDesignStirrupsInput, RCCBeamShearDesignStirrupsOutput,
    RCCOneWayTwoWaySlabEngine, RCCOneWayTwoWaySlabInput, RCCOneWayTwoWaySlabOutput,
    RCCShortColumnHelicalTiesEngine, RCCShortColumnHelicalTiesInput, RCCShortColumnHelicalTiesOutput,
    RCCIsolatedFootingPunchingShearEngine, RCCIsolatedFootingPunchingShearInput, RCCIsolatedFootingPunchingShearOutput,
    RailwaySuperelevationCantDeficiencyEngine, RailwaySuperelevationCantDeficiencyInput, RailwaySuperelevationCantDeficiencyOutput,
    RailwayTurnoutPointsCrossingEngine, RailwayTurnoutPointsCrossingInput, RailwayTurnoutPointsCrossingOutput,
    AirportRunwayLengthCorrectionsEngine, AirportRunwayLengthCorrectionsInput, AirportRunwayLengthCorrectionsOutput,
    SoilConsolidationOedometerSettlementEngine, SoilConsolidationOedometerSettlementInput, SoilConsolidationOedometerSettlementOutput,
    PileFoundationLoadCapacityEngine, PileFoundationLoadCapacityInput, PileFoundationLoadCapacityOutput,
)
from .ce_6th_sem_suite import (
    IS800SteelBoltedWeldedConnectionEngine, IS800SteelBoltedWeldedConnectionInput, IS800SteelBoltedWeldedConnectionOutput,
    IS800SteelTensionMemberNetSectionEngine, IS800SteelTensionMemberNetSectionInput, IS800SteelTensionMemberNetSectionOutput,
    IS800SteelColumnBucklingCurvesEngine, IS800SteelColumnBucklingCurvesInput, IS800SteelColumnBucklingCurvesOutput,
    IS800SteelBeamBendingWebCripplingEngine, IS800SteelBeamBendingWebCripplingInput, IS800SteelBeamBendingWebCripplingOutput,
    IS1893SeismicBaseShearDistributionEngine, IS1893SeismicBaseShearDistributionInput, IS1893SeismicBaseShearDistributionOutput,
    IS13920DuctileDetailingConfinementEngine, IS13920DuctileDetailingConfinementInput, IS13920DuctileDetailingConfinementOutput,
    ConcreteGravityDamStabilityAnalysisEngine, ConcreteGravityDamStabilityAnalysisInput, ConcreteGravityDamStabilityAnalysisOutput,
    FlownetSeepageExitGradientPipingEngine, FlownetSeepageExitGradientPipingInput, FlownetSeepageExitGradientPipingOutput,
    UnitHydrographFloodRoutingRationalEngine, UnitHydrographFloodRoutingRationalInput, UnitHydrographFloodRoutingRationalOutput,
    ReboundHammerUPVNDTTestingEngine, ReboundHammerUPVNDTTestingInput, ReboundHammerUPVNDTTestingOutput,
    StructuralRetrofittingFRPJacketingEngine, StructuralRetrofittingFRPJacketingInput, StructuralRetrofittingFRPJacketingOutput,
    MicroIrrigationDripSprinklerUniformityEngine, MicroIrrigationDripSprinklerUniformityInput, MicroIrrigationDripSprinklerUniformityOutput,
)
from .bs_1st_sem_suite import (
    VernierCaliperVolumeMeasurementEngine, VernierCaliperVolumeMeasurementInput, VernierCaliperVolumeMeasurementOutput,
    MicrometerScrewGaugeMeasurementEngine, MicrometerScrewGaugeMeasurementInput, MicrometerScrewGaugeMeasurementOutput,
    SpherometerRadiusCurvatureEngine, SpherometerRadiusCurvatureInput, SpherometerRadiusCurvatureOutput,
    FrictionInclinedPlaneCoefficientEngine, FrictionInclinedPlaneCoefficientInput, FrictionInclinedPlaneCoefficientOutput,
    FlywheelMomentOfInertiaEngine, FlywheelMomentOfInertiaInput, FlywheelMomentOfInertiaOutput,
    StokesLawViscosityTerminalVelocityEngine, StokesLawViscosityTerminalVelocityInput, StokesLawViscosityTerminalVelocityOutput,
    ThermalLinearExpansionCoefficientEngine, ThermalLinearExpansionCoefficientInput, ThermalLinearExpansionCoefficientOutput,
    BoylesLawIsothermalGasEngine, BoylesLawIsothermalGasInput, BoylesLawIsothermalGasOutput,
    AcidBaseTitrationNeutralizationEngine, AcidBaseTitrationNeutralizationInput, AcidBaseTitrationNeutralizationOutput,
    WaterHardnessEDTATitrationEngine, WaterHardnessEDTATitrationInput, WaterHardnessEDTATitrationOutput,
    DanielCellElectrochemicalEMFEngine, DanielCellElectrochemicalEMFInput, DanielCellElectrochemicalEMFOutput,
    FaradayElectrolysisCopperSulfateEngine, FaradayElectrolysisCopperSulfateInput, FaradayElectrolysisCopperSulfateOutput,
    RedwoodViscometerOilViscosityEngine, RedwoodViscometerOilViscosityInput, RedwoodViscometerOilViscosityOutput,
    FlashFirePointAbelApparatusEngine, FlashFirePointAbelApparatusInput, FlashFirePointAbelApparatusOutput,
    ComplexNumbersArgandPolarEngine, ComplexNumbersArgandPolarInput, ComplexNumbersArgandPolarOutput,
    VectorAlgebraDotCrossProductsEngine, VectorAlgebraDotCrossProductsInput, VectorAlgebraDotCrossProductsOutput,
)
from .bs_2nd_sem_suite import (
    SnellsLawRefractionGlassSlabEngine, SnellsLawRefractionGlassSlabInput, SnellsLawRefractionGlassSlabOutput,
    ConvexLensFocalLengthUVEngine, ConvexLensFocalLengthUVInput, ConvexLensFocalLengthUVOutput,
    GalvanometerHalfDeflectionResistanceEngine, GalvanometerHalfDeflectionResistanceInput, GalvanometerHalfDeflectionResistanceOutput,
    GalvanometerAmmeterVoltmeterConversionEngine, GalvanometerAmmeterVoltmeterConversionInput, GalvanometerAmmeterVoltmeterConversionOutput,
    PhotoelectricEffectInverseSquareLawEngine, PhotoelectricEffectInverseSquareLawInput, PhotoelectricEffectInverseSquareLawOutput,
    PNJunctionDiodeKneeVoltageEngine, PNJunctionDiodeKneeVoltageInput, PNJunctionDiodeKneeVoltageOutput,
    ParallelPlateCapacitorPermittivityEngine, ParallelPlateCapacitorPermittivityInput, ParallelPlateCapacitorPermittivityOutput,
    CantileverVibrationFrequencyPeriodEngine, CantileverVibrationFrequencyPeriodInput, CantileverVibrationFrequencyPeriodOutput,
    SinglePurchaseCrabWinchEngine, SinglePurchaseCrabWinchInput, SinglePurchaseCrabWinchOutput,
    DoublePurchaseCrabWinchEngine, DoublePurchaseCrabWinchInput, DoublePurchaseCrabWinchOutput,
    WormAndWormWheelMachineEngine, WormAndWormWheelMachineInput, WormAndWormWheelMachineOutput,
    DifferentialAxleAndWheelEngine, DifferentialAxleAndWheelInput, DifferentialAxleAndWheelOutput,
    LamisTheoremCoplanarForcesEngine, LamisTheoremCoplanarForcesInput, LamisTheoremCoplanarForcesOutput,
    JibCraneTieJibForcesEngine, JibCraneTieJibForcesInput, JibCraneTieJibForcesOutput,
    CramersRuleMatrixInversionSystemEngine, CramersRuleMatrixInversionSystemInput, CramersRuleMatrixInversionSystemOutput,
    NumberSystemBaseConversionsEngine, NumberSystemBaseConversionsInput, NumberSystemBaseConversionsOutput,
)
from .som_suite import (
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
)

# ── Batch 4: Thermal & Fluid Engineering Suite ─────────────────────────────
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

# ── Batch 5: Electrical & Electronics Engineering Suite ────────────────────
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

# ── Batch 6: Science, Manufacturing, Civil & Workshop Suite ────────────────
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
from .concrete_mix_design import ConcreteMixDesignEngine, ConcreteMixDesignInput, ConcreteMixDesignOutput
from .soil_bearing_capacity import SoilBearingCapacityEngine, SoilBearingCapacityInput, SoilBearingCapacityOutput
from .retaining_wall_stability import RetainingWallStabilityEngine, RetainingWallStabilityInput, RetainingWallStabilityOutput
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
from .vernier_caliper_micrometer import VernierCaliperMicrometerEngine, VernierCaliperMicrometerInput, VernierCaliperMicrometerOutput
from .surface_roughness_profilometer import SurfaceRoughnessProfilometerEngine, SurfaceRoughnessProfilometerInput, SurfaceRoughnessProfilometerOutput
from .coordinate_measuring_machine import CoordinateMeasuringMachineEngine, CoordinateMeasuringMachineInput, CoordinateMeasuringMachineOutput
from .spc_control_charts import SpcControlChartsEngine, SpcControlChartsInput, SpcControlChartsOutput
from .iso_tolerance_fits import IsoToleranceFitsEngine, IsoToleranceFitsInput, IsoToleranceFitsOutput
from .hardness_testing_rockwell import HardnessTestingRockwellEngine, HardnessTestingRockwellInput, HardnessTestingRockwellOutput
from .ndt_ultrasonic_testing import NdtUltrasonicTestingEngine, NdtUltrasonicTestingInput, NdtUltrasonicTestingOutput
from .sine_bar_angle_measurement import SineBarAngleMeasurementEngine, SineBarAngleMeasurementInput, SineBarAngleMeasurementOutput
from .optical_interferometer_flatness import OpticalInterferometerFlatnessEngine, OpticalInterferometerFlatnessInput, OpticalInterferometerFlatnessOutput
