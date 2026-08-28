"""
Unit Tests for WBSCTE Civil Engineering (CE) 6th Semester Physics Engines
==========================================================================
Validates:
1. IS800SteelBoltedWeldedConnectionEngine
2. IS800SteelTensionMemberNetSectionEngine
3. IS800SteelColumnBucklingCurvesEngine
4. IS800SteelBeamBendingWebCripplingEngine
5. IS1893SeismicBaseShearDistributionEngine
6. IS13920DuctileDetailingConfinementEngine
7. ConcreteGravityDamStabilityAnalysisEngine
8. FlownetSeepageExitGradientPipingEngine
9. UnitHydrographFloodRoutingRationalEngine
10. ReboundHammerUPVNDTTestingEngine
11. StructuralRetrofittingFRPJacketingEngine
12. MicroIrrigationDripSprinklerUniformityEngine
"""

import pytest
from app.simulation.ce_6th_sem_suite import (
    IS800SteelBoltedWeldedConnectionEngine, IS800SteelBoltedWeldedConnectionInput,
    IS800SteelTensionMemberNetSectionEngine, IS800SteelTensionMemberNetSectionInput,
    IS800SteelColumnBucklingCurvesEngine, IS800SteelColumnBucklingCurvesInput,
    IS800SteelBeamBendingWebCripplingEngine, IS800SteelBeamBendingWebCripplingInput,
    IS1893SeismicBaseShearDistributionEngine, IS1893SeismicBaseShearDistributionInput,
    IS13920DuctileDetailingConfinementEngine, IS13920DuctileDetailingConfinementInput,
    ConcreteGravityDamStabilityAnalysisEngine, ConcreteGravityDamStabilityAnalysisInput,
    FlownetSeepageExitGradientPipingEngine, FlownetSeepageExitGradientPipingInput,
    UnitHydrographFloodRoutingRationalEngine, UnitHydrographFloodRoutingRationalInput,
    ReboundHammerUPVNDTTestingEngine, ReboundHammerUPVNDTTestingInput,
    StructuralRetrofittingFRPJacketingEngine, StructuralRetrofittingFRPJacketingInput,
    MicroIrrigationDripSprinklerUniformityEngine, MicroIrrigationDripSprinklerUniformityInput,
)


def test_is800_steel_bolted_welded_connection():
    engine = IS800SteelBoltedWeldedConnectionEngine()
    inp = IS800SteelBoltedWeldedConnectionInput(
        bolt_diameter_d_mm=20.0,
        bolt_grade="4.6 Grade (fub = 400 MPa, fyb = 240 MPa)",
        plate_thickness_t_mm=10.0,
        fillet_weld_size_s_mm=6.0,
        weld_length_l_mm=150.0
    )
    out = engine.calculate(inp)
    assert abs(out.bolt_single_shear_capacity_vdsb_kn - 45.26) < 0.5
    assert abs(out.bolt_bearing_capacity_vdpb_kn - 82.0) < 1.0
    assert abs(out.fillet_weld_design_strength_pw_kn - 120.5) < 1.0


def test_is800_steel_tension_member_net_section():
    engine = IS800SteelTensionMemberNetSectionEngine()
    inp = IS800SteelTensionMemberNetSectionInput(
        gross_area_ag_mm2=1500.0,
        connected_leg_area_anc_mm2=750.0,
        outstanding_leg_area_ago_mm2=650.0,
        yield_strength_fy_mpa=250.0,
        ultimate_strength_fu_mpa=410.0,
        shear_lag_beta=1.05
    )
    out = engine.calculate(inp)
    assert abs(out.gross_section_yielding_strength_tdg_kn - 340.91) < 0.5
    assert abs(out.net_section_rupture_strength_tdn_kn - 376.51) < 0.5
    assert out.design_tension_capacity_td_kn == out.gross_section_yielding_strength_tdg_kn


def test_is800_steel_column_buckling_curves():
    engine = IS800SteelColumnBucklingCurvesEngine()
    inp = IS800SteelColumnBucklingCurvesInput(
        effective_length_kl_m=3.5,
        radius_of_gyration_r_mm=45.0,
        cross_section_area_ae_mm2=4500.0,
        yield_strength_fy_mpa=250.0,
        buckling_class="Buckling Class c (Rolled I-Sections & Built-up)"
    )
    out = engine.calculate(inp)
    assert abs(out.slenderness_ratio_lambda - 77.78) < 0.5
    assert out.design_compressive_stress_fcd_mpa > 100.0
    assert out.axial_compressive_capacity_pd_kn > 500.0


def test_is800_steel_beam_bending_web_crippling():
    engine = IS800SteelBeamBendingWebCripplingEngine()
    inp = IS800SteelBeamBendingWebCripplingInput(
        plastic_section_modulus_zp_cm3=850.0,
        flange_width_b_mm=140.0,
        web_thickness_tw_mm=7.5,
        overall_depth_h_mm=350.0,
        bearing_length_b1_mm=75.0,
        yield_strength_fy_mpa=250.0
    )
    out = engine.calculate(inp)
    assert abs(out.design_bending_strength_md_knm - 193.18) < 0.5
    assert abs(out.web_bearing_crippling_strength_pwc_kn - 234.38) < 0.5


def test_is1893_seismic_base_shear_distribution():
    engine = IS1893SeismicBaseShearDistributionEngine()
    inp = IS1893SeismicBaseShearDistributionInput(
        seismic_zone="Zone IV (Z = 0.24 — Kolkata / High Risk)",
        importance_factor_i=1.2,
        response_reduction_factor_r=5.0,
        total_seismic_weight_w_kn=12000.0,
        building_height_h_m=24.0,
        number_of_storeys=8
    )
    out = engine.calculate(inp)
    assert abs(out.fundamental_period_ta_s - 0.813) < 0.05
    assert abs(out.total_design_base_shear_vb_kn - 578.4) < 5.0


def test_is13920_ductile_detailing_confinement():
    engine = IS13920DuctileDetailingConfinementEngine()
    inp = IS13920DuctileDetailingConfinementInput(
        column_dimension_d_mm=450.0,
        column_core_dimension_h_mm=370.0,
        concrete_fck_mpa=25.0,
        steel_fy_mpa=415.0,
        hoop_bar_dia_mm=8.0,
        gross_area_ag_mm2=202500.0,
        core_area_ak_mm2=136900.0
    )
    out = engine.calculate(inp)
    assert out.max_special_confining_spacing_sv_mm <= 100.0
    assert "COMPLIANT" in out.ductility_compliance_status


def test_concrete_gravity_dam_stability_analysis():
    engine = ConcreteGravityDamStabilityAnalysisEngine()
    inp = ConcreteGravityDamStabilityAnalysisInput(
        dam_height_h_m=60.0,
        base_width_b_m=45.0,
        water_depth_hw_m=55.0,
        concrete_density_kn_m3=24.0,
        coefficient_of_friction_mu=0.7,
        uplift_reduction_factor=0.67
    )
    out = engine.calculate(inp)
    assert out.factor_of_safety_overturning_fso >= 1.5
    assert out.factor_of_safety_sliding_fss >= 1.0
    assert "STABLE" in out.dam_stability_verdict


def test_flownet_seepage_exit_gradient_piping():
    engine = FlownetSeepageExitGradientPipingEngine()
    inp = FlownetSeepageExitGradientPipingInput(
        hydraulic_head_h_m=6.0,
        soil_permeability_k_cm_s=0.002,
        flow_channels_nf=4,
        equipotential_drops_nd=12,
        exit_field_length_l_m=1.2
    )
    out = engine.calculate(inp)
    assert abs(out.seepage_discharge_q_litres_s_m - 0.040) < 0.005
    assert abs(out.exit_gradient_iexit - 0.417) < 0.02


def test_unit_hydrograph_flood_routing_rational():
    engine = UnitHydrographFloodRoutingRationalEngine()
    inp = UnitHydrographFloodRoutingRationalInput(
        catchment_area_a_km2=45.0,
        runoff_coefficient_c=0.65,
        rainfall_intensity_i_mm_hr=35.0,
        unit_hydrograph_peak_qp_cumecs=120.0,
        storm_duration_hr=4.0
    )
    out = engine.calculate(inp)
    assert abs(out.rational_peak_discharge_q_cumecs - 28.44) < 0.5
    assert out.flood_hydrograph_peak_flow_cumecs > 1000.0


def test_rebound_hammer_upv_ndt_testing():
    engine = ReboundHammerUPVNDTTestingEngine()
    inp = ReboundHammerUPVNDTTestingInput(
        rebound_number_r=36.0,
        upv_path_length_l_mm=300.0,
        upv_transit_time_t_us=72.0,
        concrete_tested_element="Column Side Face"
    )
    out = engine.calculate(inp)
    assert abs(out.ultrasonic_pulse_velocity_km_s - 4.167) < 0.05
    assert "GOOD" in out.upv_concrete_quality_grade
    assert abs(out.estimated_rebound_fck_mpa - 41.2) < 1.0


def test_structural_retrofitting_frp_jacketing():
    engine = StructuralRetrofittingFRPJacketingEngine()
    inp = StructuralRetrofittingFRPJacketingInput(
        unconfined_concrete_strength_fco_mpa=20.0,
        column_diameter_d_mm=350.0,
        frp_layers_count_n=2,
        frp_thickness_per_layer_tf_mm=0.35,
        frp_tensile_strength_ffu_mpa=3500.0
    )
    out = engine.calculate(inp)
    assert abs(out.lateral_confining_pressure_fl_mpa - 14.0) < 0.5
    assert abs(out.confined_concrete_strength_fcc_mpa - 66.2) < 1.0
    assert out.axial_strength_enhancement_ratio > 3.0


def test_micro_irrigation_drip_sprinkler_uniformity():
    engine = MicroIrrigationDripSprinklerUniformityEngine()
    inp = MicroIrrigationDripSprinklerUniformityInput(
        nominal_emitter_discharge_q0_lph=4.0,
        operating_pressure_head_h_m=12.0,
        emitter_discharge_exponent_x=0.5,
        measured_catch_depths_mm=[18.5, 19.2, 17.8, 18.0, 19.5, 17.2, 18.8, 18.4]
    )
    out = engine.calculate(inp)
    assert abs(out.actual_emitter_discharge_q_lph - 4.38) < 0.1
    assert out.christiansen_uniformity_coefficient_cu_pct >= 90.0
    assert "EXCELLENT" in out.distribution_uniformity_rating
