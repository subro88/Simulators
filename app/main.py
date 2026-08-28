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

# ── ME 3rd Semester Engines ───────────────────────────────────────────────────
casting_process_engine = CastingProcessEngine()
metal_forming_forging_engine = MetalFormingForgingEngine()
welding_technology_engine = WeldingTechnologyEngine()
shaft_couplings_joints_engine = ShaftCouplingsJointsEngine()
plummer_block_bearings_engine = PlummerBlockBearingsEngine()
iron_carbon_phase_diagram_engine = IronCarbonPhaseDiagramEngine()
heat_treatment_metallurgy_engine = HeatTreatmentMetallurgyEngine()
ndt_materials_testing_engine = NDTMaterialsTestingEngine()
air_standard_cycles_engine = AirStandardCyclesEngine()
steam_properties_mollier_engine = SteamPropertiesMollierEngine()
steam_boilers_mountings_engine = SteamBoilersMountingsEngine()

# ── ME 4th Semester Engines ───────────────────────────────────────────────────
reciprocating_air_compressor_engine = ReciprocatingAirCompressorEngine()
gas_turbine_brayton_engine = GasTurbineBraytonEngine()
shaper_slotter_machine_engine = ShaperSlotterMachineEngine()
grinding_wheel_abrasives_engine = GrindingWheelAbrasivesEngine()
unconventional_machining_edm_engine = UnconventionalMachiningEDMEngine()
transducers_instrumentation_engine = TransducersInstrumentationEngine()
sine_bar_slip_gauges_engine = SineBarSlipGaugesEngine()
comparators_surface_roughness_engine = ComparatorsSurfaceRoughnessEngine()
sqc_control_charts_engine = SQCControlChartsEngine()
epicyclic_gear_trains_engine = EpicyclicGearTrainsEngine()
governor_mechanisms_engine = GovernorMechanismsEngine()
balancing_rotating_masses_engine = BalancingRotatingMassesEngine()

# ── ME 5th Semester Engines ───────────────────────────────────────────────────
flow_orifice_venturimeter_engine = FlowOrificeVenturimeterEngine()
pipe_friction_minor_losses_engine = PipeFrictionMinorLossesEngine()
hydraulic_reaction_turbines_engine = HydraulicReactionTurbinesEngine()
reciprocating_pump_air_vessel_engine = ReciprocatingPumpAirVesselEngine()
jigs_fixtures_design_engine = JigsFixturesDesignEngine()
cnc_part_programming_gcode_engine = CNCPartProgrammingGCodeEngine()
advanced_machining_laser_waterjet_engine = AdvancedMachiningLaserWaterjetEngine()
steam_turbines_nozzles_engine = SteamTurbinesNozzlesEngine()
steam_condensers_cooling_towers_engine = SteamCondensersCoolingTowersEngine()
automotive_gearbox_transmission_engine = AutomotiveGearboxTransmissionEngine()
automotive_braking_abs_engine = AutomotiveBrakingABSEngine()
press_tool_die_design_engine = PressToolDieDesignEngine()

# ── ME 6th Semester Engines ───────────────────────────────────────────────────
power_screws_screw_jack_engine = PowerScrewsScrewJackEngine()
shaft_keys_flange_coupling_engine = ShaftKeysFlangeCouplingEngine()
levers_knuckle_cotter_joint_engine = LeversKnuckleCotterJointEngine()
hydro_pneumatic_circuits_engine = HydroPneumaticCircuitsEngine()
absorption_refrigeration_electrolux_engine = AbsorptionRefrigerationElectroluxEngine()
air_conditioning_load_duct_design_engine = AirConditioningLoadDuctDesignEngine()
cad_transformations_solid_modeling_engine = CADTransformationsSolidModelingEngine()
industrial_robotics_fms_engine = IndustrialRoboticsFMSEngine()
solar_thermal_flat_plate_collector_engine = SolarThermalFlatPlateCollectorEngine()
belt_conveyor_material_handling_engine = BeltConveyorMaterialHandlingEngine()
cpm_pert_network_analysis_engine = CPMPERTNetworkAnalysisEngine()
inventory_control_eoq_engine = InventoryControlEOQEngine()

# ── ETCE 3rd Semester Engines ───────────────────────────────────────────────────
two_port_networks_attenuators_engine = TwoPortNetworksAttenuatorsEngine()
passive_filters_constant_k_m_derived_engine = PassiveFiltersConstantKMDerivedEngine()
rlc_transient_response_engine = RLCTransientResponseEngine()
diode_rectifiers_filters_clippers_engine = DiodeRectifiersFiltersClippersEngine()
bjt_biasing_stability_factors_engine = BJTBiasingStabilityFactorsEngine()
fet_mosfet_characteristics_engine = FETMOSFETCharacteristicsEngine()
kmap_boolean_minimization_engine = KMapBooleanMinimizationEngine()
multiplexer_demux_decoder_ic_engine = MultiplexerDemuxDecoderICEngine()
flipflops_counters_registers_engine = FlipFlopsCountersRegistersEngine()
dac_adc_converters_engine = DACADCConvertersEngine()
transformer_equivalent_circuit_regulation_engine = TransformerEquivalentCircuitRegulationEngine()
dc_generator_characteristics_emf_engine = DCGeneratorCharacteristicsEMFEngine()

# ── ETCE 4th Semester Engines ───────────────────────────────────────────────────
am_fm_modulation_demodulation_engine = AMFMModulationDemodulationEngine()
superheterodyne_radio_receiver_engine = SuperheterodyneRadioReceiverEngine()
pulse_code_modulation_sampling_engine = PulseCodeModulationSamplingEngine()
feedback_amplifiers_topologies_engine = FeedbackAmplifiersTopologiesEngine()
rc_lc_crystal_oscillators_engine = RCLCCrystalOscillatorsEngine()
schmitt_trigger_comparators_engine = SchmittTriggerComparatorsEngine()
ic555_multivibrators_engine = IC555MultivibratorsEngine()
audio_crossover_loudspeakers_engine = AudioCrossoverLoudspeakersEngine()
color_tv_composite_video_engine = ColorTVCompositeVideoEngine()
intel8085_microprocessor_simulator_engine = Intel8085MicroprocessorSimulatorEngine()
microprocessor_memory_interfacing_engine = MicroprocessorMemoryInterfacingEngine()
ppi_8255_interfacing_io_engine = PPI8255InterfacingIOEngine()

# ── ETCE 5th Semester Engines ───────────────────────────────────────────────────
digital_modulation_ask_psk_qam_engine = DigitalModulationASKPSKQAMEngine()
rectangular_waveguide_modes_engine = RectangularWaveguideModesEngine()
reflex_klystron_magnetron_engine = ReflexKlystronMagnetronEngine()
radar_range_doppler_antenna_engine = RadarRangeDopplerAntennaEngine()
maxwell_schering_ac_bridges_engine = MaxwellScheringACBridgesEngine()
heterodyne_spectrum_analyzer_engine = HeterodyneSpectrumAnalyzerEngine()
scr_two_transistor_commutation_engine = SCRTwoTransistorCommutationEngine()
single_phase_full_wave_scr_bridge_engine = SinglePhaseFullWaveSCRBridgeEngine()
dc_dc_buck_boost_converters_engine = DCDCBuckBoostConvertersEngine()
microcontroller_8051_timers_uart_engine = Microcontroller8051TimersUARTEngine()
lcd_keypad_8051_interfacing_engine = LCDKeypad8051InterfacingEngine()
dsp_discrete_fourier_fft_fir_engine = DSPDiscreteFourierFFTFIREngine()

# ── ETCE 6th Semester Engines ───────────────────────────────────────────────────
optical_fiber_link_attenuation_engine = OpticalFiberLinkAttenuationEngine()
satellite_link_budget_look_angles_engine = SatelliteLinkBudgetLookAnglesEngine()
cellular_frequency_reuse_handoff_engine = CellularFrequencyReuseHandoffEngine()
lvdt_displacement_transducer_engine = LVDTDisplacementTransducerEngine()
strain_gauge_wheatstone_bridge_engine = StrainGaugeWheatstoneBridgeEngine()
rtd_thermocouple_pyrometer_engine = RTDThermocouplePyrometerEngine()
second_order_system_transient_response_engine = SecondOrderSystemTransientResponseEngine()
routh_hurwitz_stability_criterion_engine = RouthHurwitzStabilityCriterionEngine()
dielectric_induction_heating_engine = DielectricInductionHeatingEngine()
plc_ladder_logic_simulator_engine = PLCLadderLogicSimulatorEngine()
ultrasonic_flaw_detector_ndt_engine = UltrasonicFlawDetectorNDTEngine()
ecg_biopotential_instrumentation_engine = ECGBiopotentialInstrumentationEngine()

# ── Civil Engineering 3rd Semester Engines ──────────────────────────────────────
prismatic_compass_traverse_survey_engine = PrismaticCompassTraverseSurveyEngine()
dumpy_level_rise_fall_levelling_engine = DumpyLevelRiseFallLevellingEngine()
contour_interpolation_profile_levelling_engine = ContourInterpolationProfileLevellingEngine()
trapezoidal_simpson_earthwork_volume_engine = TrapezoidalSimpsonEarthworkVolumeEngine()
plane_table_radiation_intersection_engine = PlaneTableRadiationIntersectionEngine()
vicat_cement_setting_soundness_engine = VicatCementSettingSoundnessEngine()
brick_masonry_compressive_water_absorption_engine = BrickMasonryCompressiveWaterAbsorptionEngine()
sand_bulking_moisture_content_engine = SandBulkingMoistureContentEngine()
concrete_mix_design_is10262_engine = ConcreteMixDesignIS10262Engine()
concrete_compacting_factor_veebee_engine = ConcreteCompactingFactorVeeBeeEngine()
split_tensile_flexural_concrete_strength_engine = SplitTensileFlexuralConcreteStrengthEngine()
shear_force_bending_moment_diagrams_engine = ShearForceBendingMomentDiagramsEngine()

# ── Civil Engineering 4th Semester Engines ──────────────────────────────────────
transit_theodolite_vernier_angles_engine = TransitTheodoliteVernierAnglesEngine()
theodolite_traverse_bowditch_rule_engine = TheodoliteTraverseBowditchRuleEngine()
tacheometric_stadia_distance_height_engine = TacheometricStadiaDistanceHeightEngine()
circular_curve_setting_rankine_method_engine = CircularCurveSettingRankineMethodEngine()
soil_phase_relationships_unit_weights_engine = SoilPhaseRelationshipsUnitWeightsEngine()
falling_head_permeability_darcy_engine = FallingHeadPermeabilityDarcyEngine()
rankine_earth_pressure_retaining_wall_engine = RankineEarthPressureRetainingWallEngine()
unconfined_compression_vane_shear_engine = UnconfinedCompressionVaneShearEngine()
highway_superelevation_stopping_sight_distance_engine = HighwaySuperelevationStoppingSightDistanceEngine()
california_bearing_ratio_cbr_engine = CaliforniaBearingRatioCBREngine()
bitumen_penetration_softening_ductility_engine = BitumenPenetrationSofteningDuctilityEngine()
crop_water_duty_delta_canal_design_engine = CropWaterDutyDeltaCanalDesignEngine()

# ── Civil Engineering 5th Semester Engines ──────────────────────────────────────
rcc_singly_reinforced_beam_is456_engine = RCCSinglyReinforcedBeamIS456Engine()
rcc_doubly_reinforced_beam_is456_engine = RCCDoublyReinforcedBeamIS456Engine()
rcc_flanged_t_beam_design_engine = RCCFlangedTBeamDesignEngine()
rcc_beam_shear_design_stirrups_engine = RCCBeamShearDesignStirrupsEngine()
rcc_one_way_two_way_slab_engine = RCCOneWayTwoWaySlabEngine()
rcc_short_column_helical_ties_engine = RCCShortColumnHelicalTiesEngine()
rcc_isolated_footing_punching_shear_engine = RCCIsolatedFootingPunchingShearEngine()
railway_superelevation_cant_deficiency_engine = RailwaySuperelevationCantDeficiencyEngine()
railway_turnout_points_crossing_engine = RailwayTurnoutPointsCrossingEngine()
airport_runway_length_corrections_engine = AirportRunwayLengthCorrectionsEngine()
soil_consolidation_oedometer_settlement_engine = SoilConsolidationOedometerSettlementEngine()
pile_foundation_load_capacity_engine = PileFoundationLoadCapacityEngine()

# ── Civil Engineering 6th Semester Engines ──────────────────────────────────────
is800_steel_bolted_welded_connection_engine = IS800SteelBoltedWeldedConnectionEngine()
is800_steel_tension_member_net_section_engine = IS800SteelTensionMemberNetSectionEngine()
is800_steel_column_buckling_curves_engine = IS800SteelColumnBucklingCurvesEngine()
is800_steel_beam_bending_web_crippling_engine = IS800SteelBeamBendingWebCripplingEngine()
is1893_seismic_base_shear_distribution_engine = IS1893SeismicBaseShearDistributionEngine()
is13920_ductile_detailing_confinement_engine = IS13920DuctileDetailingConfinementEngine()
concrete_gravity_dam_stability_analysis_engine = ConcreteGravityDamStabilityAnalysisEngine()
flownet_seepage_exit_gradient_piping_engine = FlownetSeepageExitGradientPipingEngine()
unit_hydrograph_flood_routing_rational_engine = UnitHydrographFloodRoutingRationalEngine()
rebound_hammer_upv_ndt_testing_engine = ReboundHammerUPVNDTTestingEngine()
structural_retrofitting_frp_jacketing_engine = StructuralRetrofittingFRPJacketingEngine()
micro_irrigation_drip_sprinkler_uniformity_engine = MicroIrrigationDripSprinklerUniformityEngine()

# ── Basic Science (Common for All Branches) 1st Semester Engines ───────────────
vernier_caliper_volume_measurement_engine = VernierCaliperVolumeMeasurementEngine()
micrometer_screw_gauge_measurement_engine = MicrometerScrewGaugeMeasurementEngine()
spherometer_radius_curvature_engine = SpherometerRadiusCurvatureEngine()
friction_inclined_plane_coefficient_engine = FrictionInclinedPlaneCoefficientEngine()
flywheel_moment_of_inertia_engine = FlywheelMomentOfInertiaEngine()
stokes_law_viscosity_terminal_velocity_engine = StokesLawViscosityTerminalVelocityEngine()
thermal_linear_expansion_coefficient_engine = ThermalLinearExpansionCoefficientEngine()
boyles_law_isothermal_gas_engine = BoylesLawIsothermalGasEngine()
acid_base_titration_neutralization_engine = AcidBaseTitrationNeutralizationEngine()
water_hardness_edta_titration_engine = WaterHardnessEDTATitrationEngine()
daniel_cell_electrochemical_emf_engine = DanielCellElectrochemicalEMFEngine()
faraday_electrolysis_copper_sulfate_engine = FaradayElectrolysisCopperSulfateEngine()
redwood_viscometer_oil_viscosity_engine = RedwoodViscometerOilViscosityEngine()
flash_fire_point_abel_apparatus_engine = FlashFirePointAbelApparatusEngine()
complex_numbers_argand_polar_engine = ComplexNumbersArgandPolarEngine()
vector_algebra_dot_cross_products_engine = VectorAlgebraDotCrossProductsEngine()

# ── Basic Science (Common for All Branches) 2nd Semester Engines ───────────────
snells_law_refraction_glass_slab_engine = SnellsLawRefractionGlassSlabEngine()
convex_lens_focal_length_uv_engine = ConvexLensFocalLengthUVEngine()
galvanometer_half_deflection_resistance_engine = GalvanometerHalfDeflectionResistanceEngine()
galvanometer_ammeter_voltmeter_conversion_engine = GalvanometerAmmeterVoltmeterConversionEngine()
photoelectric_effect_inverse_square_law_engine = PhotoelectricEffectInverseSquareLawEngine()
pn_junction_diode_knee_voltage_engine = PNJunctionDiodeKneeVoltageEngine()
parallel_plate_capacitor_permittivity_engine = ParallelPlateCapacitorPermittivityEngine()
cantilever_vibration_frequency_period_engine = CantileverVibrationFrequencyPeriodEngine()
single_purchase_crab_winch_engine = SinglePurchaseCrabWinchEngine()
double_purchase_crab_winch_engine = DoublePurchaseCrabWinchEngine()
worm_and_worm_wheel_machine_engine = WormAndWormWheelMachineEngine()
differential_axle_and_wheel_engine = DifferentialAxleAndWheelEngine()
lamis_theorem_coplanar_forces_engine = LamisTheoremCoplanarForcesEngine()
jib_crane_tie_jib_forces_engine = JibCraneTieJibForcesEngine()
cramers_rule_matrix_inversion_system_engine = CramersRuleMatrixInversionSystemEngine()
number_system_base_conversions_engine = NumberSystemBaseConversionsEngine()

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
    ("casting-process", casting_process_engine, CastingProcessInput, CastingProcessOutput, "casting_process.html"),
    ("metal-forming-forging", metal_forming_forging_engine, MetalFormingForgingInput, MetalFormingForgingOutput, "metal_forming_forging.html"),
    ("welding-technology", welding_technology_engine, WeldingTechnologyInput, WeldingTechnologyOutput, "welding_technology.html"),
    ("shaft-couplings-joints", shaft_couplings_joints_engine, ShaftCouplingsJointsInput, ShaftCouplingsJointsOutput, "shaft_couplings_joints.html"),
    ("plummer-block-bearings", plummer_block_bearings_engine, PlummerBlockBearingsInput, PlummerBlockBearingsOutput, "plummer_block_bearings.html"),
    ("iron-carbon-phase-diagram", iron_carbon_phase_diagram_engine, IronCarbonPhaseDiagramInput, IronCarbonPhaseDiagramOutput, "iron_carbon_phase_diagram.html"),
    ("heat-treatment-metallurgy", heat_treatment_metallurgy_engine, HeatTreatmentMetallurgyInput, HeatTreatmentMetallurgyOutput, "heat_treatment_metallurgy.html"),
    ("ndt-materials-testing", ndt_materials_testing_engine, NDTMaterialsTestingInput, NDTMaterialsTestingOutput, "ndt_materials_testing.html"),
    ("air-standard-cycles", air_standard_cycles_engine, AirStandardCyclesInput, AirStandardCyclesOutput, "air_standard_cycles.html"),
    ("steam-properties-mollier", steam_properties_mollier_engine, SteamPropertiesMollierInput, SteamPropertiesMollierOutput, "steam_properties_mollier.html"),
    ("steam-boilers-mountings", steam_boilers_mountings_engine, SteamBoilersMountingsInput, SteamBoilersMountingsOutput, "steam_boilers_mountings.html"),
    ("reciprocating-air-compressor", reciprocating_air_compressor_engine, ReciprocatingAirCompressorInput, ReciprocatingAirCompressorOutput, "reciprocating_air_compressor.html"),
    ("gas-turbine-brayton", gas_turbine_brayton_engine, GasTurbineBraytonInput, GasTurbineBraytonOutput, "gas_turbine_brayton.html"),
    ("shaper-slotter-machine", shaper_slotter_machine_engine, ShaperSlotterMachineInput, ShaperSlotterMachineOutput, "shaper_slotter_machine.html"),
    ("grinding-wheel-abrasives", grinding_wheel_abrasives_engine, GrindingWheelAbrasivesInput, GrindingWheelAbrasivesOutput, "grinding_wheel_abrasives.html"),
    ("unconventional-machining-edm", unconventional_machining_edm_engine, UnconventionalMachiningEDMInput, UnconventionalMachiningEDMOutput, "unconventional_machining_edm.html"),
    ("transducers-instrumentation", transducers_instrumentation_engine, TransducersInstrumentationInput, TransducersInstrumentationOutput, "transducers_instrumentation.html"),
    ("sine-bar-slip-gauges", sine_bar_slip_gauges_engine, SineBarSlipGaugesInput, SineBarSlipGaugesOutput, "sine_bar_slip_gauges.html"),
    ("comparators-surface-roughness", comparators_surface_roughness_engine, ComparatorsSurfaceRoughnessInput, ComparatorsSurfaceRoughnessOutput, "comparators_surface_roughness.html"),
    ("sqc-control-charts", sqc_control_charts_engine, SQCControlChartsInput, SQCControlChartsOutput, "sqc_control_charts.html"),
    ("epicyclic-gear-trains", epicyclic_gear_trains_engine, EpicyclicGearTrainsInput, EpicyclicGearTrainsOutput, "epicyclic_gear_trains.html"),
    ("governor-mechanisms", governor_mechanisms_engine, GovernorMechanismsInput, GovernorMechanismsOutput, "governor_mechanisms.html"),
    ("balancing-rotating-masses", balancing_rotating_masses_engine, BalancingRotatingMassesInput, BalancingRotatingMassesOutput, "balancing_rotating_masses.html"),
    ("flow-orifice-venturimeter", flow_orifice_venturimeter_engine, FlowOrificeVenturimeterInput, FlowOrificeVenturimeterOutput, "flow_orifice_venturimeter.html"),
    ("pipe-friction-minor-losses", pipe_friction_minor_losses_engine, PipeFrictionMinorLossesInput, PipeFrictionMinorLossesOutput, "pipe_friction_minor_losses.html"),
    ("hydraulic-reaction-turbines", hydraulic_reaction_turbines_engine, HydraulicReactionTurbinesInput, HydraulicReactionTurbinesOutput, "hydraulic_reaction_turbines.html"),
    ("reciprocating-pump-air-vessel", reciprocating_pump_air_vessel_engine, ReciprocatingPumpAirVesselInput, ReciprocatingPumpAirVesselOutput, "reciprocating_pump_air_vessel.html"),
    ("jigs-fixtures-design", jigs_fixtures_design_engine, JigsFixturesDesignInput, JigsFixturesDesignOutput, "jigs_fixtures_design.html"),
    ("cnc-part-programming-gcode", cnc_part_programming_gcode_engine, CNCPartProgrammingGCodeInput, CNCPartProgrammingGCodeOutput, "cnc_part_programming_gcode.html"),
    ("advanced-machining-laser-waterjet", advanced_machining_laser_waterjet_engine, AdvancedMachiningLaserWaterjetInput, AdvancedMachiningLaserWaterjetOutput, "advanced_machining_laser_waterjet.html"),
    ("steam-turbines-nozzles", steam_turbines_nozzles_engine, SteamTurbinesNozzlesInput, SteamTurbinesNozzlesOutput, "steam_turbines_nozzles.html"),
    ("steam-condensers-cooling-towers", steam_condensers_cooling_towers_engine, SteamCondensersCoolingTowersInput, SteamCondensersCoolingTowersOutput, "steam_condensers_cooling_towers.html"),
    ("automotive-gearbox-transmission", automotive_gearbox_transmission_engine, AutomotiveGearboxTransmissionInput, AutomotiveGearboxTransmissionOutput, "automotive_gearbox_transmission.html"),
    ("automotive-braking-abs", automotive_braking_abs_engine, AutomotiveBrakingABSInput, AutomotiveBrakingABSOutput, "automotive_braking_abs.html"),
    ("press-tool-die-design", press_tool_die_design_engine, PressToolDieDesignInput, PressToolDieDesignOutput, "press_tool_die_design.html"),
    ("power-screws-screw-jack", power_screws_screw_jack_engine, PowerScrewsScrewJackInput, PowerScrewsScrewJackOutput, "power_screws_screw_jack.html"),
    ("shaft-keys-flange-coupling", shaft_keys_flange_coupling_engine, ShaftKeysFlangeCouplingInput, ShaftKeysFlangeCouplingOutput, "shaft_keys_flange_coupling.html"),
    ("levers-knuckle-cotter-joint", levers_knuckle_cotter_joint_engine, LeversKnuckleCotterJointInput, LeversKnuckleCotterJointOutput, "levers_knuckle_cotter_joint.html"),
    ("hydro-pneumatic-circuits", hydro_pneumatic_circuits_engine, HydroPneumaticCircuitsInput, HydroPneumaticCircuitsOutput, "hydro_pneumatic_circuits.html"),
    ("absorption-refrigeration-electrolux", absorption_refrigeration_electrolux_engine, AbsorptionRefrigerationElectroluxInput, AbsorptionRefrigerationElectroluxOutput, "absorption_refrigeration_electrolux.html"),
    ("air-conditioning-load-duct-design", air_conditioning_load_duct_design_engine, AirConditioningLoadDuctDesignInput, AirConditioningLoadDuctDesignOutput, "air_conditioning_load_duct_design.html"),
    ("cad-transformations-solid-modeling", cad_transformations_solid_modeling_engine, CADTransformationsSolidModelingInput, CADTransformationsSolidModelingOutput, "cad_transformations_solid_modeling.html"),
    ("industrial-robotics-fms", industrial_robotics_fms_engine, IndustrialRoboticsFMSInput, IndustrialRoboticsFMSOutput, "industrial_robotics_fms.html"),
    ("solar-thermal-flat-plate-collector", solar_thermal_flat_plate_collector_engine, SolarThermalFlatPlateCollectorInput, SolarThermalFlatPlateCollectorOutput, "solar_thermal_flat_plate_collector.html"),
    ("belt-conveyor-material-handling", belt_conveyor_material_handling_engine, BeltConveyorMaterialHandlingInput, BeltConveyorMaterialHandlingOutput, "belt_conveyor_material_handling.html"),
    ("cpm-pert-network-analysis", cpm_pert_network_analysis_engine, CPMPERTNetworkAnalysisInput, CPMPERTNetworkAnalysisOutput, "cpm_pert_network_analysis.html"),
    ("inventory-control-eoq", inventory_control_eoq_engine, InventoryControlEOQInput, InventoryControlEOQOutput, "inventory_control_eoq.html"),
    ("two-port-networks-attenuators", two_port_networks_attenuators_engine, TwoPortNetworksAttenuatorsInput, TwoPortNetworksAttenuatorsOutput, "two_port_networks_attenuators.html"),
    ("passive-filters-constant-k-m-derived", passive_filters_constant_k_m_derived_engine, PassiveFiltersConstantKMDerivedInput, PassiveFiltersConstantKMDerivedOutput, "passive_filters_constant_k_m_derived.html"),
    ("rlc-transient-response", rlc_transient_response_engine, RLCTransientResponseInput, RLCTransientResponseOutput, "rlc_transient_response.html"),
    ("diode-rectifiers-filters-clippers", diode_rectifiers_filters_clippers_engine, DiodeRectifiersFiltersClippersInput, DiodeRectifiersFiltersClippersOutput, "diode_rectifiers_filters_clippers.html"),
    ("bjt-biasing-stability-factors", bjt_biasing_stability_factors_engine, BJTBiasingStabilityFactorsInput, BJTBiasingStabilityFactorsOutput, "bjt_biasing_stability_factors.html"),
    ("fet-mosfet-characteristics", fet_mosfet_characteristics_engine, FETMOSFETCharacteristicsInput, FETMOSFETCharacteristicsOutput, "fet_mosfet_characteristics.html"),
    ("kmap-boolean-minimization", kmap_boolean_minimization_engine, KMapBooleanMinimizationInput, KMapBooleanMinimizationOutput, "kmap_boolean_minimization.html"),
    ("multiplexer-demux-decoder-ic", multiplexer_demux_decoder_ic_engine, MultiplexerDemuxDecoderICInput, MultiplexerDemuxDecoderICOutput, "multiplexer_demux_decoder_ic.html"),
    ("flipflops-counters-registers", flipflops_counters_registers_engine, FlipFlopsCountersRegistersInput, FlipFlopsCountersRegistersOutput, "flipflops_counters_registers.html"),
    ("dac-adc-converters", dac_adc_converters_engine, DACADCConvertersInput, DACADCConvertersOutput, "dac_adc_converters.html"),
    ("transformer-equivalent-circuit-regulation", transformer_equivalent_circuit_regulation_engine, TransformerEquivalentCircuitRegulationInput, TransformerEquivalentCircuitRegulationOutput, "transformer_equivalent_circuit_regulation.html"),
    ("dc-generator-characteristics-emf", dc_generator_characteristics_emf_engine, DCGeneratorCharacteristicsEMFInput, DCGeneratorCharacteristicsEMFOutput, "dc_generator_characteristics_emf.html"),
    ("am-fm-modulation-demodulation", am_fm_modulation_demodulation_engine, AMFMModulationDemodulationInput, AMFMModulationDemodulationOutput, "am_fm_modulation_demodulation.html"),
    ("superheterodyne-radio-receiver", superheterodyne_radio_receiver_engine, SuperheterodyneRadioReceiverInput, SuperheterodyneRadioReceiverOutput, "superheterodyne_radio_receiver.html"),
    ("pulse-code-modulation-sampling", pulse_code_modulation_sampling_engine, PulseCodeModulationSamplingInput, PulseCodeModulationSamplingOutput, "pulse_code_modulation_sampling.html"),
    ("feedback-amplifiers-topologies", feedback_amplifiers_topologies_engine, FeedbackAmplifiersTopologiesInput, FeedbackAmplifiersTopologiesOutput, "feedback_amplifiers_topologies.html"),
    ("rc-lc-crystal-oscillators", rc_lc_crystal_oscillators_engine, RCLCCrystalOscillatorsInput, RCLCCrystalOscillatorsOutput, "rc_lc_crystal_oscillators.html"),
    ("schmitt-trigger-comparators", schmitt_trigger_comparators_engine, SchmittTriggerComparatorsInput, SchmittTriggerComparatorsOutput, "schmitt_trigger_comparators.html"),
    ("ic555-multivibrators", ic555_multivibrators_engine, IC555MultivibratorsInput, IC555MultivibratorsOutput, "ic555_multivibrators.html"),
    ("audio-crossover-loudspeakers", audio_crossover_loudspeakers_engine, AudioCrossoverLoudspeakersInput, AudioCrossoverLoudspeakersOutput, "audio_crossover_loudspeakers.html"),
    ("color-tv-composite-video", color_tv_composite_video_engine, ColorTVCompositeVideoInput, ColorTVCompositeVideoOutput, "color_tv_composite_video.html"),
    ("intel8085-microprocessor-simulator", intel8085_microprocessor_simulator_engine, Intel8085MicroprocessorSimulatorInput, Intel8085MicroprocessorSimulatorOutput, "intel8085_microprocessor_simulator.html"),
    ("microprocessor-memory-interfacing", microprocessor_memory_interfacing_engine, MicroprocessorMemoryInterfacingInput, MicroprocessorMemoryInterfacingOutput, "microprocessor_memory_interfacing.html"),
    ("ppi-8255-interfacing-io", ppi_8255_interfacing_io_engine, PPI8255InterfacingIOInput, PPI8255InterfacingIOOutput, "ppi_8255_interfacing_io.html"),
    ("digital-modulation-ask-psk-qam", digital_modulation_ask_psk_qam_engine, DigitalModulationASKPSKQAMInput, DigitalModulationASKPSKQAMOutput, "digital_modulation_ask_psk_qam.html"),
    ("rectangular-waveguide-modes", rectangular_waveguide_modes_engine, RectangularWaveguideModesInput, RectangularWaveguideModesOutput, "rectangular_waveguide_modes.html"),
    ("reflex-klystron-magnetron", reflex_klystron_magnetron_engine, ReflexKlystronMagnetronInput, ReflexKlystronMagnetronOutput, "reflex_klystron_magnetron.html"),
    ("radar-range-doppler-antenna", radar_range_doppler_antenna_engine, RadarRangeDopplerAntennaInput, RadarRangeDopplerAntennaOutput, "radar_range_doppler_antenna.html"),
    ("maxwell-schering-ac-bridges", maxwell_schering_ac_bridges_engine, MaxwellScheringACBridgesInput, MaxwellScheringACBridgesOutput, "maxwell_schering_ac_bridges.html"),
    ("heterodyne-spectrum-analyzer", heterodyne_spectrum_analyzer_engine, HeterodyneSpectrumAnalyzerInput, HeterodyneSpectrumAnalyzerOutput, "heterodyne_spectrum_analyzer.html"),
    ("scr-two-transistor-commutation", scr_two_transistor_commutation_engine, SCRTwoTransistorCommutationInput, SCRTwoTransistorCommutationOutput, "scr_two_transistor_commutation.html"),
    ("single-phase-full-wave-scr-bridge", single_phase_full_wave_scr_bridge_engine, SinglePhaseFullWaveSCRBridgeInput, SinglePhaseFullWaveSCRBridgeOutput, "single_phase_full_wave_scr_bridge.html"),
    ("dc-dc-buck-boost-converters", dc_dc_buck_boost_converters_engine, DCDCBuckBoostConvertersInput, DCDCBuckBoostConvertersOutput, "dc_dc_buck_boost_converters.html"),
    ("microcontroller-8051-timers-uart", microcontroller_8051_timers_uart_engine, Microcontroller8051TimersUARTInput, Microcontroller8051TimersUARTOutput, "microcontroller_8051_timers_uart.html"),
    ("lcd-keypad-8051-interfacing", lcd_keypad_8051_interfacing_engine, LCDKeypad8051InterfacingInput, LCDKeypad8051InterfacingOutput, "lcd_keypad_8051_interfacing.html"),
    ("dsp-discrete-fourier-fft-fir", dsp_discrete_fourier_fft_fir_engine, DSPDiscreteFourierFFTFIRInput, DSPDiscreteFourierFFTFIROutput, "dsp_discrete_fourier_fft_fir.html"),
    ("optical-fiber-link-attenuation", optical_fiber_link_attenuation_engine, OpticalFiberLinkAttenuationInput, OpticalFiberLinkAttenuationOutput, "optical_fiber_link_attenuation.html"),
    ("satellite-link-budget-look-angles", satellite_link_budget_look_angles_engine, SatelliteLinkBudgetLookAnglesInput, SatelliteLinkBudgetLookAnglesOutput, "satellite_link_budget_look_angles.html"),
    ("cellular-frequency-reuse-handoff", cellular_frequency_reuse_handoff_engine, CellularFrequencyReuseHandoffInput, CellularFrequencyReuseHandoffOutput, "cellular_frequency_reuse_handoff.html"),
    ("lvdt-displacement-transducer", lvdt_displacement_transducer_engine, LVDTDisplacementTransducerInput, LVDTDisplacementTransducerOutput, "lvdt_displacement_transducer.html"),
    ("strain-gauge-wheatstone-bridge", strain_gauge_wheatstone_bridge_engine, StrainGaugeWheatstoneBridgeInput, StrainGaugeWheatstoneBridgeOutput, "strain_gauge_wheatstone_bridge.html"),
    ("rtd-thermocouple-pyrometer", rtd_thermocouple_pyrometer_engine, RTDThermocouplePyrometerInput, RTDThermocouplePyrometerOutput, "rtd_thermocouple_pyrometer.html"),
    ("second-order-system-transient-response", second_order_system_transient_response_engine, SecondOrderSystemTransientResponseInput, SecondOrderSystemTransientResponseOutput, "second_order_system_transient_response.html"),
    ("routh-hurwitz-stability-criterion", routh_hurwitz_stability_criterion_engine, RouthHurwitzStabilityCriterionInput, RouthHurwitzStabilityCriterionOutput, "routh_hurwitz_stability_criterion.html"),
    ("dielectric-induction-heating", dielectric_induction_heating_engine, DielectricInductionHeatingInput, DielectricInductionHeatingOutput, "dielectric_induction_heating.html"),
    ("plc-ladder-logic-simulator", plc_ladder_logic_simulator_engine, PLCLadderLogicSimulatorInput, PLCLadderLogicSimulatorOutput, "plc_ladder_logic_simulator.html"),
    ("ultrasonic-flaw-detector-ndt", ultrasonic_flaw_detector_ndt_engine, UltrasonicFlawDetectorNDTInput, UltrasonicFlawDetectorNDTOutput, "ultrasonic_flaw_detector_ndt.html"),
    ("ecg-biopotential-instrumentation", ecg_biopotential_instrumentation_engine, ECGBiopotentialInstrumentationInput, ECGBiopotentialInstrumentationOutput, "ecg_biopotential_instrumentation.html"),
    ("prismatic-compass-traverse-survey", prismatic_compass_traverse_survey_engine, PrismaticCompassTraverseSurveyInput, PrismaticCompassTraverseSurveyOutput, "prismatic_compass_traverse_survey.html"),
    ("dumpy-level-rise-fall-levelling", dumpy_level_rise_fall_levelling_engine, DumpyLevelRiseFallLevellingInput, DumpyLevelRiseFallLevellingOutput, "dumpy_level_rise_fall_levelling.html"),
    ("contour-interpolation-profile-levelling", contour_interpolation_profile_levelling_engine, ContourInterpolationProfileLevellingInput, ContourInterpolationProfileLevellingOutput, "contour_interpolation_profile_levelling.html"),
    ("trapezoidal-simpson-earthwork-volume", trapezoidal_simpson_earthwork_volume_engine, TrapezoidalSimpsonEarthworkVolumeInput, TrapezoidalSimpsonEarthworkVolumeOutput, "trapezoidal_simpson_earthwork_volume.html"),
    ("plane-table-radiation-intersection", plane_table_radiation_intersection_engine, PlaneTableRadiationIntersectionInput, PlaneTableRadiationIntersectionOutput, "plane_table_radiation_intersection.html"),
    ("vicat-cement-setting-soundness", vicat_cement_setting_soundness_engine, VicatCementSettingSoundnessInput, VicatCementSettingSoundnessOutput, "vicat_cement_setting_soundness.html"),
    ("brick-masonry-compressive-water-absorption", brick_masonry_compressive_water_absorption_engine, BrickMasonryCompressiveWaterAbsorptionInput, BrickMasonryCompressiveWaterAbsorptionOutput, "brick_masonry_compressive_water_absorption.html"),
    ("sand-bulking-moisture-content", sand_bulking_moisture_content_engine, SandBulkingMoistureContentInput, SandBulkingMoistureContentOutput, "sand_bulking_moisture_content.html"),
    ("concrete-mix-design-is10262", concrete_mix_design_is10262_engine, ConcreteMixDesignIS10262Input, ConcreteMixDesignIS10262Output, "concrete_mix_design_is10262.html"),
    ("concrete-compacting-factor-veebee", concrete_compacting_factor_veebee_engine, ConcreteCompactingFactorVeeBeeInput, ConcreteCompactingFactorVeeBeeOutput, "concrete_compacting_factor_veebee.html"),
    ("split-tensile-flexural-concrete-strength", split_tensile_flexural_concrete_strength_engine, SplitTensileFlexuralConcreteStrengthInput, SplitTensileFlexuralConcreteStrengthOutput, "split_tensile_flexural_concrete_strength.html"),
    ("shear-force-bending-moment-diagrams", shear_force_bending_moment_diagrams_engine, ShearForceBendingMomentDiagramsInput, ShearForceBendingMomentDiagramsOutput, "shear_force_bending_moment_diagrams.html"),
    ("transit-theodolite-vernier-angles", transit_theodolite_vernier_angles_engine, TransitTheodoliteVernierAnglesInput, TransitTheodoliteVernierAnglesOutput, "transit_theodolite_vernier_angles.html"),
    ("theodolite-traverse-bowditch-rule", theodolite_traverse_bowditch_rule_engine, TheodoliteTraverseBowditchRuleInput, TheodoliteTraverseBowditchRuleOutput, "theodolite_traverse_bowditch_rule.html"),
    ("tacheometric-stadia-distance-height", tacheometric_stadia_distance_height_engine, TacheometricStadiaDistanceHeightInput, TacheometricStadiaDistanceHeightOutput, "tacheometric_stadia_distance_height.html"),
    ("circular-curve-setting-rankine-method", circular_curve_setting_rankine_method_engine, CircularCurveSettingRankineMethodInput, CircularCurveSettingRankineMethodOutput, "circular_curve_setting_rankine_method.html"),
    ("soil-phase-relationships-unit-weights", soil_phase_relationships_unit_weights_engine, SoilPhaseRelationshipsUnitWeightsInput, SoilPhaseRelationshipsUnitWeightsOutput, "soil_phase_relationships_unit_weights.html"),
    ("falling-head-permeability-darcy", falling_head_permeability_darcy_engine, FallingHeadPermeabilityDarcyInput, FallingHeadPermeabilityDarcyOutput, "falling_head_permeability_darcy.html"),
    ("rankine-earth-pressure-retaining-wall", rankine_earth_pressure_retaining_wall_engine, RankineEarthPressureRetainingWallInput, RankineEarthPressureRetainingWallOutput, "rankine_earth_pressure_retaining_wall.html"),
    ("unconfined-compression-vane-shear", unconfined_compression_vane_shear_engine, UnconfinedCompressionVaneShearInput, UnconfinedCompressionVaneShearOutput, "unconfined_compression_vane_shear.html"),
    ("highway-superelevation-stopping-sight-distance", highway_superelevation_stopping_sight_distance_engine, HighwaySuperelevationStoppingSightDistanceInput, HighwaySuperelevationStoppingSightDistanceOutput, "highway_superelevation_stopping_sight_distance.html"),
    ("california-bearing-ratio-cbr", california_bearing_ratio_cbr_engine, CaliforniaBearingRatioCBRInput, CaliforniaBearingRatioCBROutput, "california_bearing_ratio_cbr.html"),
    ("bitumen-penetration-softening-ductility", bitumen_penetration_softening_ductility_engine, BitumenPenetrationSofteningDuctilityInput, BitumenPenetrationSofteningDuctilityOutput, "bitumen_penetration_softening_ductility.html"),
    ("crop-water-duty-delta-canal-design", crop_water_duty_delta_canal_design_engine, CropWaterDutyDeltaCanalDesignInput, CropWaterDutyDeltaCanalDesignOutput, "crop_water_duty_delta_canal_design.html"),
    ("rcc-singly-reinforced-beam-is456", rcc_singly_reinforced_beam_is456_engine, RCCSinglyReinforcedBeamIS456Input, RCCSinglyReinforcedBeamIS456Output, "rcc_singly_reinforced_beam_is456.html"),
    ("rcc-doubly-reinforced-beam-is456", rcc_doubly_reinforced_beam_is456_engine, RCCDoublyReinforcedBeamIS456Input, RCCDoublyReinforcedBeamIS456Output, "rcc_doubly_reinforced_beam_is456.html"),
    ("rcc-flanged-t-beam-design", rcc_flanged_t_beam_design_engine, RCCFlangedTBeamDesignInput, RCCFlangedTBeamDesignOutput, "rcc_flanged_t_beam_design.html"),
    ("rcc-beam-shear-design-stirrups", rcc_beam_shear_design_stirrups_engine, RCCBeamShearDesignStirrupsInput, RCCBeamShearDesignStirrupsOutput, "rcc_beam_shear_design_stirrups.html"),
    ("rcc-one-way-two-way-slab", rcc_one_way_two_way_slab_engine, RCCOneWayTwoWaySlabInput, RCCOneWayTwoWaySlabOutput, "rcc_one_way_two_way_slab.html"),
    ("rcc-short-column-helical-ties", rcc_short_column_helical_ties_engine, RCCShortColumnHelicalTiesInput, RCCShortColumnHelicalTiesOutput, "rcc_short_column_helical_ties.html"),
    ("rcc-isolated-footing-punching-shear", rcc_isolated_footing_punching_shear_engine, RCCIsolatedFootingPunchingShearInput, RCCIsolatedFootingPunchingShearOutput, "rcc_isolated_footing_punching_shear.html"),
    ("railway-superelevation-cant-deficiency", railway_superelevation_cant_deficiency_engine, RailwaySuperelevationCantDeficiencyInput, RailwaySuperelevationCantDeficiencyOutput, "railway_superelevation_cant_deficiency.html"),
    ("railway-turnout-points-crossing", railway_turnout_points_crossing_engine, RailwayTurnoutPointsCrossingInput, RailwayTurnoutPointsCrossingOutput, "railway_turnout_points_crossing.html"),
    ("airport-runway-length-corrections", airport_runway_length_corrections_engine, AirportRunwayLengthCorrectionsInput, AirportRunwayLengthCorrectionsOutput, "airport_runway_length_corrections.html"),
    ("soil-consolidation-oedometer-settlement", soil_consolidation_oedometer_settlement_engine, SoilConsolidationOedometerSettlementInput, SoilConsolidationOedometerSettlementOutput, "soil_consolidation_oedometer_settlement.html"),
    ("pile-foundation-load-capacity", pile_foundation_load_capacity_engine, PileFoundationLoadCapacityInput, PileFoundationLoadCapacityOutput, "pile_foundation_load_capacity.html"),
    ("is800-steel-bolted-welded-connection", is800_steel_bolted_welded_connection_engine, IS800SteelBoltedWeldedConnectionInput, IS800SteelBoltedWeldedConnectionOutput, "is800_steel_bolted_welded_connection.html"),
    ("is800-steel-tension-member-net-section", is800_steel_tension_member_net_section_engine, IS800SteelTensionMemberNetSectionInput, IS800SteelTensionMemberNetSectionOutput, "is800_steel_tension_member_net_section.html"),
    ("is800-steel-column-buckling-curves", is800_steel_column_buckling_curves_engine, IS800SteelColumnBucklingCurvesInput, IS800SteelColumnBucklingCurvesOutput, "is800_steel_column_buckling_curves.html"),
    ("is800-steel-beam-bending-web-crippling", is800_steel_beam_bending_web_crippling_engine, IS800SteelBeamBendingWebCripplingInput, IS800SteelBeamBendingWebCripplingOutput, "is800_steel_beam_bending_web_crippling.html"),
    ("is1893-seismic-base-shear-distribution", is1893_seismic_base_shear_distribution_engine, IS1893SeismicBaseShearDistributionInput, IS1893SeismicBaseShearDistributionOutput, "is1893_seismic_base_shear_distribution.html"),
    ("is13920-ductile-detailing-confinement", is13920_ductile_detailing_confinement_engine, IS13920DuctileDetailingConfinementInput, IS13920DuctileDetailingConfinementOutput, "is13920_ductile_detailing_confinement.html"),
    ("concrete-gravity-dam-stability-analysis", concrete_gravity_dam_stability_analysis_engine, ConcreteGravityDamStabilityAnalysisInput, ConcreteGravityDamStabilityAnalysisOutput, "concrete_gravity_dam_stability_analysis.html"),
    ("flownet-seepage-exit-gradient-piping", flownet_seepage_exit_gradient_piping_engine, FlownetSeepageExitGradientPipingInput, FlownetSeepageExitGradientPipingOutput, "flownet_seepage_exit_gradient_piping.html"),
    ("unit-hydrograph-flood-routing-rational", unit_hydrograph_flood_routing_rational_engine, UnitHydrographFloodRoutingRationalInput, UnitHydrographFloodRoutingRationalOutput, "unit_hydrograph_flood_routing_rational.html"),
    ("rebound-hammer-upv-ndt-testing", rebound_hammer_upv_ndt_testing_engine, ReboundHammerUPVNDTTestingInput, ReboundHammerUPVNDTTestingOutput, "rebound_hammer_upv_ndt_testing.html"),
    ("structural-retrofitting-frp-jacketing", structural_retrofitting_frp_jacketing_engine, StructuralRetrofittingFRPJacketingInput, StructuralRetrofittingFRPJacketingOutput, "structural_retrofitting_frp_jacketing.html"),
    ("micro-irrigation-drip-sprinkler-uniformity", micro_irrigation_drip_sprinkler_uniformity_engine, MicroIrrigationDripSprinklerUniformityInput, MicroIrrigationDripSprinklerUniformityOutput, "micro_irrigation_drip_sprinkler_uniformity.html"),
    ("vernier-caliper-volume-measurement", vernier_caliper_volume_measurement_engine, VernierCaliperVolumeMeasurementInput, VernierCaliperVolumeMeasurementOutput, "vernier_caliper_volume_measurement.html"),
    ("micrometer-screw-gauge-measurement", micrometer_screw_gauge_measurement_engine, MicrometerScrewGaugeMeasurementInput, MicrometerScrewGaugeMeasurementOutput, "micrometer_screw_gauge_measurement.html"),
    ("spherometer-radius-curvature", spherometer_radius_curvature_engine, SpherometerRadiusCurvatureInput, SpherometerRadiusCurvatureOutput, "spherometer_radius_curvature.html"),
    ("friction-inclined-plane-coefficient", friction_inclined_plane_coefficient_engine, FrictionInclinedPlaneCoefficientInput, FrictionInclinedPlaneCoefficientOutput, "friction_inclined_plane_coefficient.html"),
    ("flywheel-moment-of-inertia", flywheel_moment_of_inertia_engine, FlywheelMomentOfInertiaInput, FlywheelMomentOfInertiaOutput, "flywheel_moment_of_inertia.html"),
    ("stokes-law-viscosity-terminal-velocity", stokes_law_viscosity_terminal_velocity_engine, StokesLawViscosityTerminalVelocityInput, StokesLawViscosityTerminalVelocityOutput, "stokes_law_viscosity_terminal_velocity.html"),
    ("thermal-linear-expansion-coefficient", thermal_linear_expansion_coefficient_engine, ThermalLinearExpansionCoefficientInput, ThermalLinearExpansionCoefficientOutput, "thermal_linear_expansion_coefficient.html"),
    ("boyles-law-isothermal-gas", boyles_law_isothermal_gas_engine, BoylesLawIsothermalGasInput, BoylesLawIsothermalGasOutput, "boyles_law_isothermal_gas.html"),
    ("acid-base-titration-neutralization", acid_base_titration_neutralization_engine, AcidBaseTitrationNeutralizationInput, AcidBaseTitrationNeutralizationOutput, "acid_base_titration_neutralization.html"),
    ("water-hardness-edta-titration", water_hardness_edta_titration_engine, WaterHardnessEDTATitrationInput, WaterHardnessEDTATitrationOutput, "water_hardness_edta_titration.html"),
    ("daniel-cell-electrochemical-emf", daniel_cell_electrochemical_emf_engine, DanielCellElectrochemicalEMFInput, DanielCellElectrochemicalEMFOutput, "daniel_cell_electrochemical_emf.html"),
    ("faraday-electrolysis-copper-sulfate", faraday_electrolysis_copper_sulfate_engine, FaradayElectrolysisCopperSulfateInput, FaradayElectrolysisCopperSulfateOutput, "faraday_electrolysis_copper_sulfate.html"),
    ("redwood-viscometer-oil-viscosity", redwood_viscometer_oil_viscosity_engine, RedwoodViscometerOilViscosityInput, RedwoodViscometerOilViscosityOutput, "redwood_viscometer_oil_viscosity.html"),
    ("flash-fire-point-abel-apparatus", flash_fire_point_abel_apparatus_engine, FlashFirePointAbelApparatusInput, FlashFirePointAbelApparatusOutput, "flash_fire_point_abel_apparatus.html"),
    ("complex-numbers-argand-polar", complex_numbers_argand_polar_engine, ComplexNumbersArgandPolarInput, ComplexNumbersArgandPolarOutput, "complex_numbers_argand_polar.html"),
    ("vector-algebra-dot-cross-products", vector_algebra_dot_cross_products_engine, VectorAlgebraDotCrossProductsInput, VectorAlgebraDotCrossProductsOutput, "vector_algebra_dot_cross_products.html"),
    ("snells-law-refraction-glass-slab", snells_law_refraction_glass_slab_engine, SnellsLawRefractionGlassSlabInput, SnellsLawRefractionGlassSlabOutput, "snells_law_refraction_glass_slab.html"),
    ("convex-lens-focal-length-uv", convex_lens_focal_length_uv_engine, ConvexLensFocalLengthUVInput, ConvexLensFocalLengthUVOutput, "convex_lens_focal_length_uv.html"),
    ("galvanometer-half-deflection-resistance", galvanometer_half_deflection_resistance_engine, GalvanometerHalfDeflectionResistanceInput, GalvanometerHalfDeflectionResistanceOutput, "galvanometer_half_deflection_resistance.html"),
    ("galvanometer-ammeter-voltmeter-conversion", galvanometer_ammeter_voltmeter_conversion_engine, GalvanometerAmmeterVoltmeterConversionInput, GalvanometerAmmeterVoltmeterConversionOutput, "galvanometer_ammeter_voltmeter_conversion.html"),
    ("photoelectric-effect-inverse-square-law", photoelectric_effect_inverse_square_law_engine, PhotoelectricEffectInverseSquareLawInput, PhotoelectricEffectInverseSquareLawOutput, "photoelectric_effect_inverse_square_law.html"),
    ("pn-junction-diode-knee-voltage", pn_junction_diode_knee_voltage_engine, PNJunctionDiodeKneeVoltageInput, PNJunctionDiodeKneeVoltageOutput, "pn_junction_diode_knee_voltage.html"),
    ("parallel-plate-capacitor-permittivity", parallel_plate_capacitor_permittivity_engine, ParallelPlateCapacitorPermittivityInput, ParallelPlateCapacitorPermittivityOutput, "parallel_plate_capacitor_permittivity.html"),
    ("cantilever-vibration-frequency-period", cantilever_vibration_frequency_period_engine, CantileverVibrationFrequencyPeriodInput, CantileverVibrationFrequencyPeriodOutput, "cantilever_vibration_frequency_period.html"),
    ("single-purchase-crab-winch", single_purchase_crab_winch_engine, SinglePurchaseCrabWinchInput, SinglePurchaseCrabWinchOutput, "single_purchase_crab_winch.html"),
    ("double-purchase-crab-winch", double_purchase_crab_winch_engine, DoublePurchaseCrabWinchInput, DoublePurchaseCrabWinchOutput, "double_purchase_crab_winch.html"),
    ("worm-and-worm-wheel-machine", worm_and_worm_wheel_machine_engine, WormAndWormWheelMachineInput, WormAndWormWheelMachineOutput, "worm_and_worm_wheel_machine.html"),
    ("differential-axle-and-wheel", differential_axle_and_wheel_engine, DifferentialAxleAndWheelInput, DifferentialAxleAndWheelOutput, "differential_axle_and_wheel.html"),
    ("lamis-theorem-coplanar-forces", lamis_theorem_coplanar_forces_engine, LamisTheoremCoplanarForcesInput, LamisTheoremCoplanarForcesOutput, "lamis_theorem_coplanar_forces.html"),
    ("jib-crane-tie-jib-forces", jib_crane_tie_jib_forces_engine, JibCraneTieJibForcesInput, JibCraneTieJibForcesOutput, "jib_crane_tie_jib_forces.html"),
    ("cramers-rule-matrix-inversion-system", cramers_rule_matrix_inversion_system_engine, CramersRuleMatrixInversionSystemInput, CramersRuleMatrixInversionSystemOutput, "cramers_rule_matrix_inversion_system.html"),
    ("number-system-base-conversions", number_system_base_conversions_engine, NumberSystemBaseConversionsInput, NumberSystemBaseConversionsOutput, "number_system_base_conversions.html"),
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
