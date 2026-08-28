"""
Unit Tests for WBSCTE Civil Engineering (CE) 4th Semester Physics Engines
==========================================================================
Validates:
1. TransitTheodoliteVernierAnglesEngine
2. TheodoliteTraverseBowditchRuleEngine
3. TacheometricStadiaDistanceHeightEngine
4. CircularCurveSettingRankineMethodEngine
5. SoilPhaseRelationshipsUnitWeightsEngine
6. FallingHeadPermeabilityDarcyEngine
7. RankineEarthPressureRetainingWallEngine
8. UnconfinedCompressionVaneShearEngine
9. HighwaySuperelevationStoppingSightDistanceEngine
10. CaliforniaBearingRatioCBREngine
11. BitumenPenetrationSofteningDuctilityEngine
12. CropWaterDutyDeltaCanalDesignEngine
"""

import pytest
from app.simulation.ce_4th_sem_suite import (
    TransitTheodoliteVernierAnglesEngine, TransitTheodoliteVernierAnglesInput,
    TheodoliteTraverseBowditchRuleEngine, TheodoliteTraverseBowditchRuleInput,
    TacheometricStadiaDistanceHeightEngine, TacheometricStadiaDistanceHeightInput,
    CircularCurveSettingRankineMethodEngine, CircularCurveSettingRankineMethodInput,
    SoilPhaseRelationshipsUnitWeightsEngine, SoilPhaseRelationshipsUnitWeightsInput,
    FallingHeadPermeabilityDarcyEngine, FallingHeadPermeabilityDarcyInput,
    RankineEarthPressureRetainingWallEngine, RankineEarthPressureRetainingWallInput,
    UnconfinedCompressionVaneShearEngine, UnconfinedCompressionVaneShearInput,
    HighwaySuperelevationStoppingSightDistanceEngine, HighwaySuperelevationStoppingSightDistanceInput,
    CaliforniaBearingRatioCBREngine, CaliforniaBearingRatioCBRInput,
    BitumenPenetrationSofteningDuctilityEngine, BitumenPenetrationSofteningDuctilityInput,
    CropWaterDutyDeltaCanalDesignEngine, CropWaterDutyDeltaCanalDesignInput,
)


def test_transit_theodolite_vernier_angles():
    engine = TransitTheodoliteVernierAnglesEngine()
    inp = TransitTheodoliteVernierAnglesInput(
        horizontal_angle_deg=48.5,
        repetitions_count_n=3,
        vertical_elevation_angle_deg=12.5
    )
    out = engine.calculate(inp)
    assert abs(out.accumulated_repetition_angle_deg - 145.5) < 0.1
    assert abs(out.mean_measured_horizontal_angle_deg - 48.5) < 0.01
    assert abs(out.vertical_zenith_distance_deg - 77.5) < 0.1


def test_theodolite_traverse_bowditch_rule():
    engine = TheodoliteTraverseBowditchRuleEngine()
    inp = TheodoliteTraverseBowditchRuleInput(
        traverse_side_lengths_m=[120.0, 150.0, 110.0, 140.0],
        reduced_bearings_deg=[45.0, 135.0, 225.0, 315.0]
    )
    out = engine.calculate(inp)
    assert out.total_traverse_perimeter_m == 520.0
    assert out.closing_error_linear_m >= 0.0
    assert "Traverse Precision" in out.relative_precision_ratio


def test_tacheometric_stadia_distance_height():
    engine = TacheometricStadiaDistanceHeightEngine()
    inp = TacheometricStadiaDistanceHeightInput(
        stadia_intercept_s_m=1.250,
        vertical_sight_angle_deg=8.5,
        multiplying_constant_k=100.0,
        additive_constant_c=0.0
    )
    out = engine.calculate(inp)
    assert abs(out.horizontal_distance_d_m - 122.27) < 0.5
    assert abs(out.vertical_elevation_component_v_m - 18.27) < 0.5


def test_circular_curve_setting_rankine_method():
    engine = CircularCurveSettingRankineMethodEngine()
    inp = CircularCurveSettingRankineMethodInput(
        curve_radius_r_m=300.0,
        deflection_angle_delta_deg=40.0,
        subchord_length_c_m=20.0
    )
    out = engine.calculate(inp)
    assert abs(out.tangent_length_t_m - 109.19) < 0.2
    assert abs(out.curve_length_l_m - 209.44) < 0.2
    assert abs(out.rankine_deflection_angle_per_chord_deg - 1.91) < 0.05


def test_soil_phase_relationships_unit_weights():
    engine = SoilPhaseRelationshipsUnitWeightsEngine()
    inp = SoilPhaseRelationshipsUnitWeightsInput(
        water_content_pct=18.0,
        bulk_unit_weight_kn_m3=19.5,
        specific_gravity_gs=2.68
    )
    out = engine.calculate(inp)
    assert abs(out.dry_unit_weight_kn_m3 - 16.53) < 0.1
    assert abs(out.void_ratio_e - 0.591) < 0.02
    assert abs(out.porosity_percentage_n - 37.1) < 1.0


def test_falling_head_permeability_darcy():
    engine = FallingHeadPermeabilityDarcyEngine()
    inp = FallingHeadPermeabilityDarcyInput(
        standpipe_area_a_cm2=0.5,
        soil_sample_area_a_cm2=50.0,
        sample_length_l_cm=12.0,
        initial_head_h1_cm=80.0,
        final_head_h2_cm=40.0,
        elapsed_time_t_seconds=180.0
    )
    out = engine.calculate(inp)
    assert out.permeability_coefficient_k_cm_s > 0.0
    assert "DRAINAGE" in out.soil_drainage_classification or "IMPERMEABLE" in out.soil_drainage_classification


def test_rankine_earth_pressure_retaining_wall():
    engine = RankineEarthPressureRetainingWallEngine()
    inp = RankineEarthPressureRetainingWallInput(
        wall_height_h_m=6.0,
        soil_friction_angle_phi_deg=30.0,
        soil_unit_weight_gamma_kn_m3=18.0,
        surcharge_q_kpa=10.0
    )
    out = engine.calculate(inp)
    assert abs(out.active_pressure_coefficient_ka - 0.333) < 0.01
    assert abs(out.passive_pressure_coefficient_kp - 3.00) < 0.01
    assert abs(out.total_active_thrust_pa_kn_m - 128.0) < 1.0


def test_unconfined_compression_vane_shear():
    engine = UnconfinedCompressionVaneShearEngine()
    inp = UnconfinedCompressionVaneShearInput(
        test_method="Unconfined Compressive Strength (UCS)",
        specimen_diameter_d_mm=38.0,
        axial_failure_load_n=120.0
    )
    out = engine.calculate(inp)
    assert abs(out.unconfined_compressive_strength_qu_kpa - 105.8) < 1.0
    assert abs(out.undrained_cohesion_cu_kpa - 52.9) < 0.5


def test_highway_superelevation_stopping_sight_distance():
    engine = HighwaySuperelevationStoppingSightDistanceEngine()
    inp = HighwaySuperelevationStoppingSightDistanceInput(
        design_speed_v_kmph=80.0,
        horizontal_curve_radius_r_m=250.0,
        longitudinal_friction_f=0.35
    )
    out = engine.calculate(inp)
    assert abs(out.stopping_sight_distance_ssd_m - 127.6) < 1.0
    assert out.design_superelevation_rate_e <= 0.07


def test_california_bearing_ratio_cbr():
    engine = CaliforniaBearingRatioCBREngine()
    inp = CaliforniaBearingRatioCBRInput(
        penetration_2_5mm_load_kg=68.5,
        penetration_5_0mm_load_kg=98.0
    )
    out = engine.calculate(inp)
    assert abs(out.cbr_at_2_5mm_percentage - 5.00) < 0.05
    assert abs(out.cbr_at_5_0mm_percentage - 4.77) < 0.05
    assert out.design_cbr_percentage == 5.00


def test_bitumen_penetration_softening_ductility():
    engine = BitumenPenetrationSofteningDuctilityEngine()
    inp = BitumenPenetrationSofteningDuctilityInput(
        penetration_value_tenth_mm=65.0,
        ring_ball_softening_point_degc=48.5,
        ductility_elongation_cm=78.0
    )
    out = engine.calculate(inp)
    assert "VG-30" in out.is73_viscosity_grade_designation
    assert "PASSED" in out.ductility_test_status


def test_crop_water_duty_delta_canal_design():
    engine = CropWaterDutyDeltaCanalDesignEngine()
    inp = CropWaterDutyDeltaCanalDesignInput(
        crop_name="Rice (Delta = 120 cm, Base = 120 days)",
        culturable_command_area_cca_ha=4500.0,
        canal_silt_factor_f=1.0
    )
    out = engine.calculate(inp)
    assert abs(out.crop_duty_d_hectares_cumec - 864.0) < 0.1
    assert abs(out.required_canal_discharge_q_cumecs - 5.208) < 0.01
    assert abs(out.lacey_regime_velocity_v_m_s - 0.579) < 0.01
