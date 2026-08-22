"""
Unit Tests for Batch 6: Science, Manufacturing, Civil & Workshop Suite (65 Tools)
=================================================================================
Validates manufacturing processes, civil structures, physics/general science, and metrology/quality.
"""

import math
import pytest
from app.simulation import (
    # Sub-Suite A: Manufacturing Technology (1-20)
    LatheTurningEngine, LatheTurningInput,
    MillingCuttingEngine, MillingCuttingInput,
    DrillingMechanicsEngine, DrillingMechanicsInput,
    GrindingWheelEngine, GrindingWheelInput,
    SheetMetalBendingEngine, SheetMetalBendingInput,
    PunchingBlankingEngine, PunchingBlankingInput,
    MetalCastingEngine, MetalCastingInput,
    WeldingHeatInputEngine, WeldingHeatInputInput,
    InjectionMoldingEngine, InjectionMoldingInput,
    Additive3dPrintingEngine, Additive3dPrintingInput,
    CncGcodeMachiningEngine, CncGcodeMachiningInput,
    PowderMetallurgyEngine, PowderMetallurgyInput,
    MetalForgingEngine, MetalForgingInput,
    MetalExtrusionEngine, MetalExtrusionInput,
    WireDrawingEngine, WireDrawingInput,
    EdmMachiningEngine, EdmMachiningInput,
    LaserBeamCuttingEngine, LaserBeamCuttingInput,
    WaterjetCuttingEngine, WaterjetCuttingInput,
    PlasticThermoformingEngine, PlasticThermoformingInput,
    DieCastingHighPressureEngine, DieCastingHighPressureInput,
    # Sub-Suite B: Civil & Structural (21-38)
    ConcreteMixDesignEngine, ConcreteMixDesignInput,
    SoilBearingCapacityEngine, SoilBearingCapacityInput,
    RetainingWallStabilityEngine, RetainingWallStabilityInput,
    TrussStructuralAnalysisEngine, TrussStructuralAnalysisInput,
    SurveyingLevelingEngine, SurveyingLevelingInput,
    PavementDesignFlexEngine, PavementDesignFlexInput,
    HydrologyRationalRunoffEngine, HydrologyRationalRunoffInput,
    OpenChannelManningEngine, OpenChannelManningInput,
    SeismicBaseShearEngine, SeismicBaseShearInput,
    SteelBoltedConnectionEngine, SteelBoltedConnectionInput,
    SteelWeldedConnectionEngine, SteelWeldedConnectionInput,
    SlopeStabilityBishopEngine, SlopeStabilityBishopInput,
    ConsolidationSettlementEngine, ConsolidationSettlementInput,
    ShearStrengthDirectEngine, ShearStrengthDirectInput,
    ConcreteBeamRcEngine, ConcreteBeamRcInput,
    ColumnRcDesignEngine, ColumnRcDesignInput,
    StormwaterPipeSizingEngine, StormwaterPipeSizingInput,
    TrafficFlowGreenshieldsEngine, TrafficFlowGreenshieldsInput,
    # Sub-Suite C: Physics & Applied Science (39-53)
    GeometricalOpticsLensEngine, GeometricalOpticsLensInput,
    WaveInterferenceYoungEngine, WaveInterferenceYoungInput,
    DopplerEffectSoundEngine, DopplerEffectSoundInput,
    PhotoelectricEffectEngine, PhotoelectricEffectInput,
    RadioactiveDecayEngine, RadioactiveDecayInput,
    ProjectileMotionEngine, ProjectileMotionInput,
    ElectrostaticsCoulombEngine, ElectrostaticsCoulombInput,
    ElectromagneticInductionEngine, ElectromagneticInductionInput,
    FluidStaticsManometerEngine, FluidStaticsManometerInput,
    SoundDecibelAttenuationEngine, SoundDecibelAttenuationInput,
    BlackbodyRadiationWienEngine, BlackbodyRadiationWienInput,
    SpecialRelativityLorentzEngine, SpecialRelativityLorentzInput,
    HeatConductionTransientEngine, HeatConductionTransientInput,
    ViscousFluidPoiseuilleEngine, ViscousFluidPoiseuilleInput,
    RotationalInertiaTensorEngine, RotationalInertiaTensorInput,
    # Sub-Suite D: Metrology, Quality & Production (54-65)
    VernierCaliperMicrometerEngine, VernierCaliperMicrometerInput,
    SurfaceRoughnessProfilometerEngine, SurfaceRoughnessProfilometerInput,
    CoordinateMeasuringMachineEngine, CoordinateMeasuringMachineInput,
    SpcControlChartsEngine, SpcControlChartsInput,
    IsoToleranceFitsEngine, IsoToleranceFitsInput,
    HardnessTestingRockwellEngine, HardnessTestingRockwellInput,
    NdtUltrasonicTestingEngine, NdtUltrasonicTestingInput,
    SineBarAngleMeasurementEngine, SineBarAngleMeasurementInput,
    OpticalInterferometerFlatnessEngine, OpticalInterferometerFlatnessInput,
    EconomicOrderQuantityEngine, EconomicOrderQuantityInput,
    LineBalancingTaktTimeEngine, LineBalancingTaktTimeInput,
    OverallEquipmentEffectivenessEngine, OverallEquipmentEffectivenessInput
)

# ── Sub-Suite A Tests (1-20) ──────────────────────────────────────────────────

def test_lathe_turning():
    out = LatheTurningEngine().calculate(LatheTurningInput(workpiece_diameter_mm=50.0, spindle_speed_rpm=800.0))
    assert out.cutting_speed_m_min == pytest.approx(125.66, rel=1e-2)
    assert out.spindle_power_kw > 0.0

def test_milling_cutting():
    out = MillingCuttingEngine().calculate(MillingCuttingInput(cutter_diameter_mm=20.0, num_teeth=4, spindle_speed_rpm=1200.0))
    assert out.table_feed_mm_min == 384.0
    assert out.material_removal_rate_cm3_min > 0.0

def test_drilling_mechanics():
    out = DrillingMechanicsEngine().calculate(DrillingMechanicsInput(drill_diameter_mm=12.0, spindle_speed_rpm=900.0))
    assert out.thrust_force_n > 500.0
    assert out.drilling_torque_nm > 0.0

def test_grinding_wheel():
    out = GrindingWheelEngine().calculate(GrindingWheelInput(wheel_diameter_mm=250.0, wheel_speed_rpm=2400.0))
    assert out.wheel_speed_m_s == pytest.approx(31.41, rel=1e-2)
    assert out.grinding_power_kw > 0.0

def test_sheet_metal_bending():
    out = SheetMetalBendingEngine().calculate(SheetMetalBendingInput(sheet_thickness_mm=2.0, bend_radius_mm=4.0))
    assert out.bend_allowance_mm > 0.0
    assert out.bending_force_kn > 0.0

def test_punching_blanking():
    out = PunchingBlankingEngine().calculate(PunchingBlankingInput(hole_diameter_mm=25.0, sheet_thickness_mm=3.0))
    assert out.cut_perimeter_mm == pytest.approx(78.54, rel=1e-2)
    assert out.recommended_press_tonnage > 0.0

def test_metal_casting():
    out = MetalCastingEngine().calculate(MetalCastingInput(casting_shape="cube", characteristic_dimension_mm=100.0))
    assert out.modulus_v_over_a_mm == pytest.approx(16.67, rel=1e-2)
    assert out.solidification_time_sec > 0.0

def test_welding_heat_input():
    out = WeldingHeatInputEngine().calculate(WeldingHeatInputInput(welding_current_a=180.0, arc_voltage_v=24.0, travel_speed_mm_s=5.0))
    assert out.heat_input_kj_mm > 0.5
    assert out.allowable_shear_load_kn > 0.0

def test_injection_molding():
    out = InjectionMoldingEngine().calculate(InjectionMoldingInput(part_wall_thickness_mm=2.5, projected_area_cm2=250.0))
    assert out.clamping_force_kn > 500.0
    assert out.cooling_time_sec > 0.0

def test_additive_3d_printing():
    out = Additive3dPrintingEngine().calculate(Additive3dPrintingInput(layer_height_mm=0.2, print_speed_mm_s=60.0))
    assert out.volumetric_flow_rate_mm3_s == pytest.approx(4.8, rel=1e-3)
    assert out.estimated_print_time_hours > 0.0

def test_cnc_gcode_machining():
    out = CncGcodeMachiningEngine().calculate(CncGcodeMachiningInput(gcode_command="G01_linear", start_x_mm=0.0, start_y_mm=0.0, target_x_mm=100.0, target_y_mm=0.0))
    assert out.path_length_mm == 100.0
    assert out.block_execution_time_sec == 12.0

def test_powder_metallurgy():
    out = PowderMetallurgyEngine().calculate(PowderMetallurgyInput(compaction_pressure_mpa=400.0))
    assert out.green_density_g_cm3 > 5.0
    assert out.porosity_pct < 10.0

def test_metal_forging():
    out = MetalForgingEngine().calculate(MetalForgingInput(initial_height_mm=80.0, final_height_mm=40.0))
    assert out.true_strain == pytest.approx(0.693, rel=1e-2)
    assert out.forging_force_kn > 0.0

def test_metal_extrusion():
    out = MetalExtrusionEngine().calculate(MetalExtrusionInput(billet_diameter_mm=150.0, extruded_diameter_mm=30.0))
    assert out.extrusion_ratio_r == pytest.approx(25.0, rel=1e-3)
    assert out.ram_force_kn > 0.0

def test_wire_drawing():
    out = WireDrawingEngine().calculate(WireDrawingInput(initial_wire_diameter_mm=8.0, final_wire_diameter_mm=6.5))
    assert out.area_reduction_pct > 30.0
    assert out.drawing_force_kn > 0.0

def test_edm_machining():
    out = EdmMachiningEngine().calculate(EdmMachiningInput(discharge_current_amp=25.0, pulse_on_time_us=100.0))
    assert out.spark_energy_mj == 100.0
    assert out.material_removal_rate_mm3_min > 0.0

def test_laser_beam_cutting():
    out = LaserBeamCuttingEngine().calculate(LaserBeamCuttingInput(laser_power_kw=3.0, sheet_thickness_mm=4.0))
    assert out.max_cutting_speed_m_min > 0.0
    assert out.kerf_width_mm > 0.1

def test_waterjet_cutting():
    out = WaterjetCuttingEngine().calculate(WaterjetCuttingInput(water_pressure_bar=3800.0))
    assert out.water_jet_velocity_m_s > 800.0
    assert out.pump_power_kw > 0.0

def test_plastic_thermoforming():
    out = PlasticThermoformingEngine().calculate(PlasticThermoformingInput(initial_sheet_thickness_mm=3.0, mold_depth_mm=80.0, mold_opening_width_mm=200.0))
    assert out.draw_ratio == 2.6
    assert out.average_final_thickness_mm < 3.0

def test_die_casting_high_pressure():
    out = DieCastingHighPressureEngine().calculate(DieCastingHighPressureInput(casting_volume_cm3=350.0))
    assert out.cavity_fill_time_ms > 0.0
    assert out.die_locking_force_tons > 100.0


# ── Sub-Suite B Tests (21-38) ─────────────────────────────────────────────────

def test_concrete_mix_design():
    out = ConcreteMixDesignEngine().calculate(ConcreteMixDesignInput(grade_of_concrete="M30"))
    assert out.target_mean_strength_mpa == 38.25
    assert out.cement_content_kg_m3 > 300.0

def test_soil_bearing_capacity():
    out = SoilBearingCapacityEngine().calculate(SoilBearingCapacityInput(footing_type="square", footing_width_b_m=2.0))
    assert out.ultimate_bearing_capacity_kpa > 300.0
    assert out.allowable_bearing_capacity_kpa == pytest.approx(out.ultimate_bearing_capacity_kpa / 3.0, rel=1e-3)

def test_retaining_wall_stability():
    out = RetainingWallStabilityEngine().calculate(RetainingWallStabilityInput(wall_height_h_m=6.0, base_width_b_m=3.5))
    assert out.rankine_ka < 0.35
    assert out.fos_overturning > 1.5

def test_truss_structural_analysis():
    out = TrussStructuralAnalysisEngine().calculate(TrussStructuralAnalysisInput(truss_type="pratt_bridge", applied_load_kn=50.0))
    assert out.left_reaction_ay_kn == 25.0
    assert out.max_compression_force_kn > 0.0

def test_surveying_leveling():
    out = SurveyingLevelingEngine().calculate(SurveyingLevelingInput(benchmark_rl_m=100.0, backsight_bs_m=1.450, foresight_fs_m=0.850))
    assert out.height_of_instrument_hi_m == pytest.approx(101.450, rel=1e-3)
    assert out.target_reduced_level_rl_m == pytest.approx(100.600, rel=1e-3)

def test_pavement_design_flex():
    out = PavementDesignFlexEngine().calculate(PavementDesignFlexInput(subgrade_cbr_pct=6.0))
    assert out.cumulative_esal_msa > 0.0
    assert out.required_pavement_thickness_mm > 400.0

def test_hydrology_rational_runoff():
    out = HydrologyRationalRunoffEngine().calculate(HydrologyRationalRunoffInput(catchment_area_ha=50.0, runoff_coefficient_c=0.65, rainfall_intensity_mm_hr=85.0))
    assert out.peak_discharge_m3_s == pytest.approx(7.656, rel=1e-2)

def test_open_channel_manning():
    out = OpenChannelManningEngine().calculate(OpenChannelManningInput(channel_shape="trapezoidal", water_depth_y_m=1.5))
    assert out.discharge_m3_s > 0.0
    assert out.froude_number < 1.0

def test_seismic_base_shear():
    out = SeismicBaseShearEngine().calculate(SeismicBaseShearInput(seismic_zone="Zone_IV", building_height_h_m=24.0))
    assert out.zone_factor_z == 0.24
    assert out.total_base_shear_kn > 0.0

def test_steel_bolted_connection():
    out = SteelBoltedConnectionEngine().calculate(SteelBoltedConnectionInput(bolt_grade="4.6", bolt_diameter_mm=20.0, num_bolts=4))
    assert out.shear_capacity_per_bolt_kn > 40.0
    assert out.total_connection_capacity_kn > 150.0

def test_steel_welded_connection():
    out = SteelWeldedConnectionEngine().calculate(SteelWeldedConnectionInput(weld_type="fillet_weld", weld_leg_size_mm=8.0, effective_weld_length_mm=200.0))
    assert out.throat_thickness_mm == pytest.approx(5.656, rel=1e-2)
    assert out.total_weld_capacity_kn > 200.0

def test_slope_stability_bishop():
    out = SlopeStabilityBishopEngine().calculate(SlopeStabilityBishopInput(slope_height_h_m=10.0, slope_angle_deg=30.0))
    assert out.factor_of_safety_fos > 1.0

def test_consolidation_settlement():
    out = ConsolidationSettlementEngine().calculate(ConsolidationSettlementInput(clay_layer_thickness_m=4.0, initial_effective_stress_kpa=80.0, building_load_stress_kpa=50.0))
    assert out.primary_settlement_mm > 50.0

def test_shear_strength_direct():
    out = ShearStrengthDirectEngine().calculate(ShearStrengthDirectInput(normal_stress_sigma_kpa=150.0, cohesion_c_kpa=20.0, friction_angle_phi_deg=28.0))
    assert out.shear_strength_tau_kpa == pytest.approx(99.76, rel=1e-2)

def test_concrete_beam_rc():
    out = ConcreteBeamRcEngine().calculate(ConcreteBeamRcInput(beam_width_b_mm=250.0, effective_depth_d_mm=450.0))
    assert out.steel_area_ast_mm2 == pytest.approx(1256.6, rel=1e-2)
    assert out.ultimate_moment_mulim_knm > 100.0

def test_column_rc_design():
    out = ColumnRcDesignEngine().calculate(ColumnRcDesignInput(column_shape="square", column_dimension_mm=400.0))
    assert out.gross_area_ag_mm2 == 160000.0
    assert out.ultimate_axial_capacity_pu_kn > 1500.0

def test_stormwater_pipe_sizing():
    out = StormwaterPipeSizingEngine().calculate(StormwaterPipeSizingInput(design_discharge_m3_s=0.85))
    assert out.required_commercial_diameter_mm >= 750.0
    assert out.full_flow_velocity_m_s > 0.75

def test_traffic_flow_greenshields():
    out = TrafficFlowGreenshieldsEngine().calculate(TrafficFlowGreenshieldsInput(free_flow_speed_vf_kmh=90.0, jam_density_kj_veh_km=120.0, current_density_k_veh_km=40.0))
    assert out.space_mean_speed_v_kmh == pytest.approx(60.0, rel=1e-2)
    assert out.maximum_capacity_qmax_veh_hr == 2700.0


# ── Sub-Suite C Tests (39-53) ─────────────────────────────────────────────────

def test_geometrical_optics_lens():
    out = GeometricalOpticsLensEngine().calculate(GeometricalOpticsLensInput(lens_type="biconvex_converging", object_distance_u_cm=30.0, focal_length_f_cm=15.0))
    assert out.image_distance_v_cm == 30.0
    assert out.magnification_m == -1.0

def test_wave_interference_young():
    out = WaveInterferenceYoungEngine().calculate(WaveInterferenceYoungInput(light_wavelength_nm=632.8, slit_separation_d_mm=0.25, screen_distance_d_m=1.5))
    assert out.fringe_width_beta_mm == pytest.approx(3.797, rel=1e-2)

def test_doppler_effect_sound():
    out = DopplerEffectSoundEngine().calculate(DopplerEffectSoundInput(source_frequency_hz=440.0, speed_of_sound_m_s=343.0, source_velocity_m_s=30.0))
    assert out.observed_frequency_hz > 440.0

def test_photoelectric_effect():
    out = PhotoelectricEffectEngine().calculate(PhotoelectricEffectInput(target_metal="sodium", light_wavelength_nm=350.0))
    assert out.photon_energy_ev == pytest.approx(3.54, rel=1e-2)
    assert out.is_photoelectric_emission is True

def test_radioactive_decay():
    out = RadioactiveDecayEngine().calculate(RadioactiveDecayInput(isotope="carbon_14", decay_time_years=5730.0))
    assert out.remaining_fraction_pct == pytest.approx(50.0, rel=1e-2)

def test_projectile_motion():
    out = ProjectileMotionEngine().calculate(ProjectileMotionInput(initial_velocity_m_s=40.0, launch_angle_deg=45.0))
    assert out.max_height_h_m == pytest.approx(40.77, rel=1e-2)
    assert out.horizontal_range_r_m == pytest.approx(163.1, rel=1e-2)

def test_electrostatics_coulomb():
    out = ElectrostaticsCoulombEngine().calculate(ElectrostaticsCoulombInput(charge_q1_uc=10.0, charge_q2_uc=-5.0, separation_distance_cm=10.0))
    assert out.coulomb_force_n == pytest.approx(44.93, rel=1e-2)
    assert out.is_attractive is True

def test_electromagnetic_induction():
    out = ElectromagneticInductionEngine().calculate(ElectromagneticInductionInput(num_turns_n=200, magnetic_field_tesla=0.8, coil_area_cm2=50.0, time_change_ms=20.0))
    assert out.induced_emf_volts == 40.0

def test_fluid_statics_manometer():
    out = FluidStaticsManometerEngine().calculate(FluidStaticsManometerInput(manometer_fluid="mercury", deflection_height_h_cm=25.0))
    assert out.differential_pressure_kpa == pytest.approx(30.90, rel=1e-2)

def test_sound_decibel_attenuation():
    out = SoundDecibelAttenuationEngine().calculate(SoundDecibelAttenuationInput(source_power_watts=10.0, distance_r1_m=1.0, distance_r2_m=10.0))
    assert out.distance_attenuation_db == 20.0
    assert out.sound_pressure_level_spl1_db == pytest.approx(109.0, rel=1e-1)

def test_blackbody_radiation_wien():
    out = BlackbodyRadiationWienEngine().calculate(BlackbodyRadiationWienInput(temperature_kelvin=5800.0))
    assert out.peak_wavelength_nm == pytest.approx(499.6, rel=1e-2)

def test_special_relativity_lorentz():
    out = SpecialRelativityLorentzEngine().calculate(SpecialRelativityLorentzInput(velocity_fraction_c=0.8))
    assert out.lorentz_factor_gamma == pytest.approx(1.667, rel=1e-2)
    assert out.dilated_time_sec == pytest.approx(16.67, rel=1e-2)

def test_heat_conduction_transient():
    out = HeatConductionTransientEngine().calculate(HeatConductionTransientInput(solid_sphere_radius_mm=20.0))
    assert out.biot_number < 0.1
    assert out.is_lumped_valid is True

def test_viscous_fluid_poiseuille():
    out = ViscousFluidPoiseuilleEngine().calculate(ViscousFluidPoiseuilleInput(pipe_radius_mm=5.0, pressure_drop_kpa=10.0))
    assert out.flow_rate_cm3_s > 0.0

def test_rotational_inertia_tensor():
    out = RotationalInertiaTensorEngine().calculate(RotationalInertiaTensorInput(geometry="solid_cylinder", mass_kg=10.0, characteristic_radius_m=0.2))
    assert out.centroidal_inertia_icm_kg_m2 == pytest.approx(0.2, rel=1e-3)


# ── Sub-Suite D Tests (54-65) ─────────────────────────────────────────────────

def test_vernier_caliper_micrometer():
    out = VernierCaliperMicrometerEngine().calculate(VernierCaliperMicrometerInput(instrument_type="vernier_caliper", main_scale_reading_mm=24.0, verniethimble_coincidence_divisions=12))
    assert out.observed_reading_mm == 24.24
    assert out.corrected_actual_reading_mm == 24.22

def test_surface_roughness_profilometer():
    out = SurfaceRoughnessProfilometerEngine().calculate(SurfaceRoughnessProfilometerInput(machining_process="milled", feed_or_grain_microns=15.0))
    assert out.roughness_ra_um == pytest.approx(2.7, rel=1e-3)
    assert out.roughness_rz_um == pytest.approx(12.15, rel=1e-3)

def test_coordinate_measuring_machine():
    out = CoordinateMeasuringMachineEngine().calculate(CoordinateMeasuringMachineInput(x_dev_um=8.0, y_dev_um=6.0))
    assert out.true_position_error_um == 20.0

def test_spc_control_charts():
    out = SpcControlChartsEngine().calculate(SpcControlChartsInput(process_mean_xbarbar=25.0, average_range_rbar=0.15, subgroup_sample_size_n=5))
    assert out.xbar_ucl_mm == pytest.approx(25.08655, rel=1e-3)
    assert out.process_capability_cp > 1.0

def test_iso_tolerance_fits():
    out = IsoToleranceFitsEngine().calculate(IsoToleranceFitsInput(basic_size_mm=40.0, hole_tolerance_class="H7", shaft_tolerance_class="g6"))
    assert out.hole_min_limit_mm == 40.0
    assert "Clearance" in out.fit_type

def test_hardness_testing_rockwell():
    out = HardnessTestingRockwellEngine().calculate(HardnessTestingRockwellInput(testing_method="rockwell_hrc", indentation_depth_or_dia_mm=0.08))
    assert out.calculated_hardness_value == 60.0
    assert out.estimated_uts_mpa == 1500.0

def test_ndt_ultrasonic_testing():
    out = NdtUltrasonicTestingEngine().calculate(NdtUltrasonicTestingInput(material_type="carbon_steel", echo_time_us=16.0))
    assert out.flaw_depth_mm == pytest.approx(47.36, rel=1e-2)

def test_sine_bar_angle_measurement():
    out = SineBarAngleMeasurementEngine().calculate(SineBarAngleMeasurementInput(sine_bar_length_mm=200.0, slip_gauge_height_h_mm=51.764))
    assert out.measured_angle_deg == pytest.approx(15.0, rel=1e-3)
    assert out.angle_degrees == 15

def test_optical_interferometer_flatness():
    out = OpticalInterferometerFlatnessEngine().calculate(OpticalInterferometerFlatnessInput(light_source="sodium_vapor_589nm", fringe_shift_count_n=3.5))
    assert out.flatness_error_nanometers == 1030.75

def test_economic_order_quantity():
    out = EconomicOrderQuantityEngine().calculate(EconomicOrderQuantityInput(annual_demand_d_units=12000.0, ordering_cost_s_per_order=150.0, holding_cost_h_per_unit_yr=4.0))
    assert out.eoq_optimal_batch_units == pytest.approx(948.68, rel=1e-2)
    assert out.total_annual_inventory_cost == pytest.approx(3794.73, rel=1e-2)

def test_line_balancing_takt_time():
    out = LineBalancingTaktTimeEngine().calculate(LineBalancingTaktTimeInput(available_shift_time_hours=8.0, daily_customer_demand_units=480.0, total_work_content_time_sec=220.0, actual_workstations_count=4))
    assert out.takt_time_sec == 60.0
    assert out.line_efficiency_pct == pytest.approx(91.67, rel=1e-2)

def test_overall_equipment_effectiveness():
    out = OverallEquipmentEffectivenessEngine().calculate(OverallEquipmentEffectivenessInput(planned_production_time_min=480.0, unplanned_downtime_min=40.0, ideal_cycle_time_sec=30.0, total_parts_produced=800, defect_scrap_parts=24))
    assert out.availability_pct == pytest.approx(91.67, rel=1e-2)
    assert out.quality_pct == 97.0
    assert out.overall_equipment_effectiveness_oee_pct > 70.0
