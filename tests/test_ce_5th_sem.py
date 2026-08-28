"""
Unit Tests for WBSCTE Civil Engineering (CE) 5th Semester Physics Engines
==========================================================================
Validates:
1. RCCSinglyReinforcedBeamIS456Engine
2. RCCDoublyReinforcedBeamIS456Engine
3. RCCFlangedTBeamDesignEngine
4. RCCBeamShearDesignStirrupsEngine
5. RCCOneWayTwoWaySlabEngine
6. RCCShortColumnHelicalTiesEngine
7. RCCIsolatedFootingPunchingShearEngine
8. RailwaySuperelevationCantDeficiencyEngine
9. RailwayTurnoutPointsCrossingEngine
10. AirportRunwayLengthCorrectionsEngine
11. SoilConsolidationOedometerSettlementEngine
12. PileFoundationLoadCapacityEngine
"""

import pytest
from app.simulation.ce_5th_sem_suite import (
    RCCSinglyReinforcedBeamIS456Engine, RCCSinglyReinforcedBeamIS456Input,
    RCCDoublyReinforcedBeamIS456Engine, RCCDoublyReinforcedBeamIS456Input,
    RCCFlangedTBeamDesignEngine, RCCFlangedTBeamDesignInput,
    RCCBeamShearDesignStirrupsEngine, RCCBeamShearDesignStirrupsInput,
    RCCOneWayTwoWaySlabEngine, RCCOneWayTwoWaySlabInput,
    RCCShortColumnHelicalTiesEngine, RCCShortColumnHelicalTiesInput,
    RCCIsolatedFootingPunchingShearEngine, RCCIsolatedFootingPunchingShearInput,
    RailwaySuperelevationCantDeficiencyEngine, RailwaySuperelevationCantDeficiencyInput,
    RailwayTurnoutPointsCrossingEngine, RailwayTurnoutPointsCrossingInput,
    AirportRunwayLengthCorrectionsEngine, AirportRunwayLengthCorrectionsInput,
    SoilConsolidationOedometerSettlementEngine, SoilConsolidationOedometerSettlementInput,
    PileFoundationLoadCapacityEngine, PileFoundationLoadCapacityInput,
)


def test_rcc_singly_reinforced_beam():
    engine = RCCSinglyReinforcedBeamIS456Engine()
    inp = RCCSinglyReinforcedBeamIS456Input(
        concrete_grade_fck_mpa=20.0,
        steel_grade_fy_mpa=415.0,
        beam_width_b_mm=250.0,
        effective_depth_d_mm=450.0,
        tension_steel_ast_mm2=942.0
    )
    out = engine.calculate(inp)
    assert abs(out.neutral_axis_depth_xu_mm - 188.95) < 0.5
    assert abs(out.limiting_neutral_axis_xumax_mm - 216.0) < 0.5
    assert "UNDER-REINFORCED" in out.beam_section_failure_mode


def test_rcc_doubly_reinforced_beam():
    engine = RCCDoublyReinforcedBeamIS456Engine()
    inp = RCCDoublyReinforcedBeamIS456Input(
        concrete_grade_fck_mpa=20.0,
        steel_grade_fy_mpa=415.0,
        beam_width_b_mm=250.0,
        effective_depth_d_mm=450.0,
        effective_cover_d_prime_mm=45.0,
        tension_steel_ast_mm2=1472.0,
        compression_steel_asc_mm2=402.0
    )
    out = engine.calculate(inp)
    assert out.total_moment_capacity_mu_knm > out.limiting_moment_mulim_knm
    assert abs(out.compression_steel_stress_fsc_mpa - 353.0) < 1.0


def test_rcc_flanged_t_beam_design():
    engine = RCCFlangedTBeamDesignEngine()
    inp = RCCFlangedTBeamDesignInput(
        flange_width_bf_mm=1200.0,
        flange_thickness_df_mm=120.0,
        web_width_bw_mm=250.0,
        effective_depth_d_mm=450.0,
        tension_steel_ast_mm2=1885.0,
        concrete_fck_mpa=20.0,
        steel_fy_mpa=415.0
    )
    out = engine.calculate(inp)
    assert out.neutral_axis_depth_xu_mm <= 120.0
    assert "IN FLANGE" in out.neutral_axis_location
    assert out.moment_of_resistance_mu_knm > 250.0


def test_rcc_beam_shear_design_stirrups():
    engine = RCCBeamShearDesignStirrupsEngine()
    inp = RCCBeamShearDesignStirrupsInput(
        factored_shear_force_vu_kn=140.0,
        beam_width_b_mm=250.0,
        effective_depth_d_mm=450.0,
        tension_steel_percentage_pt=1.2,
        concrete_fck_mpa=20.0,
        stirrups_dia_mm=8.0,
        stirrup_legs=2
    )
    out = engine.calculate(inp)
    assert abs(out.nominal_shear_stress_tauv_mpa - 1.244) < 0.05
    assert out.recommended_stirrup_spacing_sv_mm <= 300.0
    assert "REQUIRED" in out.shear_design_verdict


def test_rcc_one_way_two_way_slab():
    engine = RCCOneWayTwoWaySlabEngine()
    inp = RCCOneWayTwoWaySlabInput(
        short_span_lx_m=3.5,
        long_span_ly_m=4.5,
        total_factored_load_w_kn_m2=10.5
    )
    out = engine.calculate(inp)
    assert out.aspect_ratio_r <= 2.0
    assert out.design_moment_short_span_mux_knm_m > 0.0
    assert "REQUIRED" in out.torsional_corner_mesh_required


def test_rcc_short_column_helical_ties():
    engine = RCCShortColumnHelicalTiesEngine()
    inp = RCCShortColumnHelicalTiesInput(
        column_width_b_mm=300.0,
        column_depth_d_mm=400.0,
        unsupported_length_l_m=3.0,
        concrete_fck_mpa=20.0,
        steel_fy_mpa=415.0,
        steel_percentage_p_pct=1.5,
        tie_type="Lateral Ties"
    )
    out = engine.calculate(inp)
    assert out.axial_load_capacity_pu_kn > 1200.0
    assert out.minimum_eccentricity_emin_mm >= 20.0


def test_rcc_isolated_footing_punching_shear():
    engine = RCCIsolatedFootingPunchingShearEngine()
    inp = RCCIsolatedFootingPunchingShearInput(
        column_axial_load_p_kn=900.0,
        soil_safe_bearing_capacity_sbc_kpa=180.0,
        column_side_a_mm=350.0,
        footing_depth_d_mm=450.0,
        concrete_fck_mpa=20.0
    )
    out = engine.calculate(inp)
    assert out.required_footing_side_b_m >= 2.0
    assert "SAFE" in out.punching_shear_safety_status


def test_railway_superelevation_cant_deficiency():
    engine = RailwaySuperelevationCantDeficiencyEngine()
    inp = RailwaySuperelevationCantDeficiencyInput(
        track_gauge_g_m=1.676,
        curve_radius_r_m=600.0,
        train_speed_v_kmph=80.0,
        max_cant_deficiency_cd_mm=76.0
    )
    out = engine.calculate(inp)
    assert abs(out.equilibrium_cant_ceq_mm - 140.7) < 1.0
    assert abs(out.max_safe_speed_vmax_kmph - 100.4) < 1.0


def test_railway_turnout_points_crossing():
    engine = RailwayTurnoutPointsCrossingEngine()
    inp = RailwayTurnoutPointsCrossingInput(
        turnout_ratio_n=12.0,
        gauge_g_m=1.676,
        heel_divergence_d_m=0.133
    )
    out = engine.calculate(inp)
    assert abs(out.crossing_angle_deg - 4.76) < 0.1
    assert abs(out.curve_lead_cl_m - 40.22) < 0.2


def test_airport_runway_length_corrections():
    engine = AirportRunwayLengthCorrectionsEngine()
    inp = AirportRunwayLengthCorrectionsInput(
        basic_runway_length_lo_m=2000.0,
        airport_elevation_msl_m=600.0,
        airport_reference_temp_art_degc=35.0,
        effective_runway_gradient_pct=0.8
    )
    out = engine.calculate(inp)
    assert out.elevation_corrected_length_l1_m == 2280.0
    assert out.gradient_corrected_final_length_m > 3000.0


def test_soil_consolidation_oedometer_settlement():
    engine = SoilConsolidationOedometerSettlementEngine()
    inp = SoilConsolidationOedometerSettlementInput(
        initial_void_ratio_eo=0.85,
        clay_layer_thickness_ho_m=4.0,
        initial_effective_stress_sigma0_kpa=100.0,
        additional_stress_increment_dsigma_kpa=50.0,
        liquid_limit_ll_pct=45.0
    )
    out = engine.calculate(inp)
    assert abs(out.compression_index_cc - 0.315) < 0.01
    assert abs(out.total_primary_settlement_sc_mm - 119.9) < 1.0


def test_pile_foundation_load_capacity():
    engine = PileFoundationLoadCapacityEngine()
    inp = PileFoundationLoadCapacityInput(
        pile_type="Bored Cast-in-Situ RCC Pile",
        pile_diameter_d_m=0.6,
        pile_length_l_m=15.0,
        soil_undrained_cohesion_cu_kpa=60.0,
        adhesion_factor_alpha=0.6,
        factor_of_safety=2.5
    )
    out = engine.calculate(inp)
    assert abs(out.ultimate_end_bearing_qb_kn - 152.68) < 1.0
    assert abs(out.ultimate_skin_friction_qs_kn - 1017.88) < 1.0
    assert abs(out.safe_allowable_working_load_qsafe_kn - 468.22) < 1.0
