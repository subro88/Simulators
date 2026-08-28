"""
Unit Tests for WBSCTE Civil Engineering (CE) 3rd Semester Physics Engines
==========================================================================
Validates:
1. PrismaticCompassTraverseSurveyEngine
2. DumpyLevelRiseFallLevellingEngine
3. ContourInterpolationProfileLevellingEngine
4. TrapezoidalSimpsonEarthworkVolumeEngine
5. PlaneTableRadiationIntersectionEngine
6. VicatCementSettingSoundnessEngine
7. BrickMasonryCompressiveWaterAbsorptionEngine
8. SandBulkingMoistureContentEngine
9. ConcreteMixDesignIS10262Engine
10. ConcreteCompactingFactorVeeBeeEngine
11. SplitTensileFlexuralConcreteStrengthEngine
12. ShearForceBendingMomentDiagramsEngine
"""

import pytest
from app.simulation.ce_3rd_sem_suite import (
    PrismaticCompassTraverseSurveyEngine, PrismaticCompassTraverseSurveyInput,
    DumpyLevelRiseFallLevellingEngine, DumpyLevelRiseFallLevellingInput,
    ContourInterpolationProfileLevellingEngine, ContourInterpolationProfileLevellingInput,
    TrapezoidalSimpsonEarthworkVolumeEngine, TrapezoidalSimpsonEarthworkVolumeInput,
    PlaneTableRadiationIntersectionEngine, PlaneTableRadiationIntersectionInput,
    VicatCementSettingSoundnessEngine, VicatCementSettingSoundnessInput,
    BrickMasonryCompressiveWaterAbsorptionEngine, BrickMasonryCompressiveWaterAbsorptionInput,
    SandBulkingMoistureContentEngine, SandBulkingMoistureContentInput,
    ConcreteMixDesignIS10262Engine, ConcreteMixDesignIS10262Input,
    ConcreteCompactingFactorVeeBeeEngine, ConcreteCompactingFactorVeeBeeInput,
    SplitTensileFlexuralConcreteStrengthEngine, SplitTensileFlexuralConcreteStrengthInput,
    ShearForceBendingMomentDiagramsEngine, ShearForceBendingMomentDiagramsInput,
)


def test_prismatic_compass_traverse_survey():
    engine = PrismaticCompassTraverseSurveyEngine()
    inp = PrismaticCompassTraverseSurveyInput(
        fore_bearing_wcb_deg=45.5,
        back_bearing_wcb_deg=225.5,
        magnetic_declination_deg=2.5,
        declination_direction="East (+)"
    )
    out = engine.calculate(inp)
    assert "N 45.50° E" in out.reduced_bearing_quadrantal
    assert abs(out.true_bearing_deg - 48.0) < 0.1
    assert out.bearing_difference_error_deg == 0.0
    assert "FREE FROM LOCAL ATTRACTION" in out.local_attraction_status


def test_dumpy_level_rise_fall_levelling():
    engine = DumpyLevelRiseFallLevellingEngine()
    inp = DumpyLevelRiseFallLevellingInput(
        benchmark_elevation_m=100.0,
        backsight_reading_m=1.450,
        intermediate_sight_reading_m=1.820,
        foresight_reading_m=2.150
    )
    out = engine.calculate(inp)
    assert abs(out.height_of_instrument_hi_m - 101.450) < 0.001
    assert abs(out.reduced_level_is_station_m - 99.630) < 0.001
    assert abs(out.reduced_level_fs_station_m - 99.300) < 0.001
    assert out.arithmetic_check_passed is True


def test_contour_interpolation_profile_levelling():
    engine = ContourInterpolationProfileLevellingEngine()
    inp = ContourInterpolationProfileLevellingInput(
        point_a_elevation_m=102.5,
        point_b_elevation_m=107.0,
        horizontal_distance_ab_m=45.0,
        target_contour_elevation_m=105.0
    )
    out = engine.calculate(inp)
    assert abs(out.ground_slope_gradient_pct - 10.0) < 0.1
    assert abs(out.interpolated_distance_from_a_m - 25.0) < 0.1
    assert "MODERATE" in out.terrain_slope_classification


def test_trapezoidal_simpson_earthwork_volume():
    engine = TrapezoidalSimpsonEarthworkVolumeEngine()
    inp = TrapezoidalSimpsonEarthworkVolumeInput(
        cross_section_interval_d_m=20.0,
        ordinate_offsets_m=[5.2, 7.8, 9.4, 8.6, 6.1],
        formation_width_b_m=10.0
    )
    out = engine.calculate(inp)
    assert out.trapezoidal_area_m2 > 500.0
    assert out.simpsons_area_m2 > 500.0
    assert out.prismoidal_embankment_volume_m3 > 5000.0


def test_plane_table_radiation_intersection():
    engine = PlaneTableRadiationIntersectionEngine()
    inp = PlaneTableRadiationIntersectionInput(
        baseline_length_ab_m=50.0,
        angle_a_deg=62.0,
        angle_b_deg=48.0
    )
    out = engine.calculate(inp)
    assert abs(out.included_apex_angle_c_deg - 70.0) < 0.1
    assert abs(out.triangulated_distance_ac_m - 39.54) < 0.5
    assert abs(out.triangulated_distance_bc_m - 47.00) < 0.5


def test_vicat_cement_setting_soundness():
    engine = VicatCementSettingSoundnessEngine()
    inp = VicatCementSettingSoundnessInput(
        water_consistency_percentage_p=30.0,
        initial_setting_needle_penetration_mm=5.0,
        elapsed_setting_time_minutes=45.0,
        le_chatelier_expansion_mm=2.5
    )
    out = engine.calculate(inp)
    assert abs(out.initial_setting_water_req_pct - 25.5) < 0.1
    assert "PASSED" in out.cement_setting_status
    assert "SOUND CEMENT" in out.soundness_compliance_status


def test_brick_masonry_compressive_water_absorption():
    engine = BrickMasonryCompressiveWaterAbsorptionEngine()
    inp = BrickMasonryCompressiveWaterAbsorptionInput(
        crushing_load_kn=220.0,
        brick_length_mm=190.0,
        brick_width_mm=90.0,
        dry_weight_kg=3.10,
        wet_weight_24hr_kg=3.52
    )
    out = engine.calculate(inp)
    assert abs(out.compressive_strength_mpa - 12.87) < 0.1
    assert abs(out.water_absorption_percentage - 13.55) < 0.2
    assert "CLASS 10" in out.is1077_brick_class
    assert "COMPLIANT" in out.absorption_compliance_status


def test_sand_bulking_moisture_content():
    engine = SandBulkingMoistureContentEngine()
    inp = SandBulkingMoistureContentInput(
        initial_dry_sand_height_mm=150.0,
        bulked_damp_sand_height_mm=185.0,
        sand_moisture_content_pct=5.0,
        fineness_modulus_fm=2.65
    )
    out = engine.calculate(inp)
    assert abs(out.sand_bulking_percentage - 23.33) < 0.1
    assert abs(out.batching_volume_correction_factor - 1.233) < 0.01
    assert "ZONE II" in out.is383_sand_zone_classification


def test_concrete_mix_design_is10262():
    engine = ConcreteMixDesignIS10262Engine()
    inp = ConcreteMixDesignIS10262Input(
        grade_of_concrete="M25 (fck = 25 MPa)",
        exposure_condition="Moderate",
        maximum_aggregate_size_mm=20.0,
        slump_workability_mm=100.0
    )
    out = engine.calculate(inp)
    assert abs(out.target_mean_strength_fck_prime_mpa - 31.6) < 0.1
    assert abs(out.free_water_cement_ratio - 0.45) < 0.01
    assert out.cement_content_kg_m3 > 400.0
    assert "Cement : Sand : Aggregate" in out.mix_ratio_by_weight


def test_concrete_compacting_factor_veebee():
    engine = ConcreteCompactingFactorVeeBeeEngine()
    inp = ConcreteCompactingFactorVeeBeeInput(
        partially_compacted_weight_kg=10.8,
        fully_compacted_weight_kg=12.2,
        empty_cylinder_weight_kg=4.5
    )
    out = engine.calculate(inp)
    assert abs(out.compacting_factor_cf - 0.818) < 0.01
    assert "WORKABILITY" in out.workability_degree_classification


def test_split_tensile_flexural_concrete_strength():
    engine = SplitTensileFlexuralConcreteStrengthEngine()
    inp = SplitTensileFlexuralConcreteStrengthInput(
        cylinder_diameter_d_mm=150.0,
        cylinder_length_l_mm=300.0,
        tensile_cracking_load_kn=185.0,
        characteristic_cube_fck_mpa=25.0
    )
    out = engine.calculate(inp)
    assert abs(out.split_tensile_strength_fct_mpa - 2.617) < 0.05
    assert abs(out.modulus_of_rupture_flexural_fr_mpa - 3.50) < 0.01
    assert out.direct_tensile_strength_estimate_mpa > 1.0


def test_shear_force_bending_moment_diagrams():
    engine = ShearForceBendingMomentDiagramsEngine()
    inp = ShearForceBendingMomentDiagramsInput(
        beam_span_l_m=6.0,
        point_load_p_kn=30.0,
        point_load_distance_a_m=2.0,
        udl_w_kn_per_m=10.0
    )
    out = engine.calculate(inp)
    assert abs(out.support_reaction_ra_kn - 50.0) < 0.1
    assert abs(out.support_reaction_rb_kn - 40.0) < 0.1
    assert abs(out.maximum_bending_moment_knm - 80.0) < 0.1
    assert abs(out.max_moment_location_x_m - 2.0) < 0.1
