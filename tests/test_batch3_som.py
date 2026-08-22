"""
Unit Tests for Batch 3: Strength of Materials (SOM) & Machine Design Suite (18 Tools)
====================================================================================
Validates mechanics calculations, stress states, and design safety criteria.
"""

import math
import pytest
from app.simulation import (
    StressStrainEngine, StressStrainInput,
    BeamBendingEngine, BeamBendingInput,
    ShaftTorsionEngine, ShaftTorsionInput,
    ColumnBucklingEngine, ColumnBucklingInput,
    MohrsCircleEngine, MohrsCircleInput,
    StressConcentrationEngine, StressConcentrationInput,
    PressureVesselEngine, PressureVesselInput,
    SpringDesignEngine, SpringDesignInput,
    BoltedJointEngine, BoltedJointInput,
    RivetedJointsEngine, RivetedJointsInput,
    WeldStrengthEngine, WeldStrengthInput,
    BearingEngine, BearingSelectionInput,
    GearStrengthEngine, GearStrengthInput,
    PowerScrewEngine, PowerScrewInput,
    FatigueLifeEngine, FatigueLifeInput,
    CrackPropagationEngine, CrackPropagationInput,
    CrossSectionPropsEngine, CrossSectionPropsInput,
    MaterialTestingEngine, MaterialTestingInput
)


def test_stress_strain_hooke():
    engine = StressStrainEngine()
    inp = StressStrainInput(applied_force_kn=50.0, specimen_diameter_mm=12.5, youngs_modulus_gpa=200.0)
    out = engine.calculate(inp)
    assert out.axial_stress_mpa > 300.0
    assert out.elongation_mm > 0.0
    assert out.shear_modulus_gpa == pytest.approx(200.0 / (2.0 * 1.3), rel=1e-2)


def test_beam_bending_flexure():
    engine = BeamBendingEngine()
    inp = BeamBendingInput(support_type="simply_supported", beam_length_m=4.0, point_load_kn=20.0, udl_kn_m=5.0)
    out = engine.calculate(inp)
    assert out.max_bending_moment_knm == 30.0  # 20*4/4 + 5*16/8 = 20 + 10 = 30
    assert out.max_deflection_mm > 0.0


def test_shaft_torsion_rigidity():
    engine = ShaftTorsionEngine()
    inp = ShaftTorsionInput(shaft_type="solid", outer_diameter_mm=50.0, applied_torque_nm=1200.0)
    out = engine.calculate(inp)
    assert out.max_shear_stress_mpa > 40.0
    assert out.transmitted_power_kw > 0.0


def test_column_buckling_euler():
    engine = ColumnBucklingEngine()
    inp = ColumnBucklingInput(end_condition="pinned_pinned", column_length_m=3.0, width_mm=80.0, depth_mm=120.0)
    out = engine.calculate(inp)
    assert out.effective_length_m == 3.0
    assert out.euler_critical_load_kn > 0.0
    assert out.slenderness_ratio > 50.0


def test_mohrs_circle_transformation():
    engine = MohrsCircleEngine()
    inp = MohrsCircleInput(sigma_x_mpa=80.0, sigma_y_mpa=-40.0, tau_xy_mpa=35.0)
    out = engine.calculate(inp)
    assert out.center_sigma_avg_mpa == 20.0
    assert out.radius_r_mpa == pytest.approx(math.sqrt(60.0**2 + 35.0**2), rel=1e-3)
    assert out.principal_stress_1_mpa > out.principal_stress_2_mpa


def test_stress_concentration_kt():
    engine = StressConcentrationEngine()
    inp = StressConcentrationInput(discontinuity_type="hole_in_plate", plate_width_mm=100.0, hole_diameter_mm=20.0)
    out = engine.calculate(inp)
    assert out.theoretical_kt > 2.0
    assert out.fatigue_kf > 1.5


def test_pressure_vessel_hoop():
    engine = PressureVesselEngine()
    inp = PressureVesselInput(vessel_category="thin_cylinder", internal_pressure_bar=20.0, inner_diameter_mm=400.0, wall_thickness_mm=10.0)
    out = engine.calculate(inp)
    assert out.hoop_stress_mpa == 40.0  # (2.0 * 400) / (2 * 10) = 40 MPa
    assert out.longitudinal_stress_mpa == 20.0


def test_spring_design_wahl():
    engine = SpringDesignEngine()
    inp = SpringDesignInput(applied_load_n=800.0, wire_diameter_mm=6.0, mean_coil_diameter_mm=48.0, active_coils=8)
    out = engine.calculate(inp)
    assert out.spring_index_c == 8.0
    assert out.wahl_factor_kw > 1.10
    assert out.spring_rate_n_mm > 0.0


def test_bolted_joint_preload():
    engine = BoltedJointEngine()
    inp = BoltedJointInput(bolt_nominal_dia_mm=16.0, applied_tensile_kn=35.0)
    out = engine.calculate(inp)
    assert out.preload_force_kn > 50.0
    assert out.remaining_clamping_kn > 0.0
    assert out.tightening_torque_nm > 100.0


def test_riveted_joints_efficiency():
    engine = RivetedJointsEngine()
    inp = RivetedJointsInput(joint_type="butt_double_strap", plate_thickness_mm=12.0, rivet_diameter_mm=22.0, pitch_distance_mm=70.0)
    out = engine.calculate(inp)
    assert out.joint_efficiency_pct > 50.0
    assert out.solid_plate_strength_kn > out.plate_tearing_strength_kn


def test_weld_strength_fillet():
    engine = WeldStrengthEngine()
    inp = WeldStrengthInput(weld_type="double_parallel_fillet", weld_size_mm=8.0, weld_length_mm=100.0, applied_force_kn=60.0)
    out = engine.calculate(inp)
    assert out.throat_thickness_mm == pytest.approx(0.7071 * 8.0, rel=1e-2)
    assert out.weld_safety_factor > 1.0


def test_bearing_l10_life():
    engine = BearingEngine()
    inp = BearingSelectionInput(bearing_type="ball_bearing", radial_load_kn=8.0, axial_load_kn=3.0, dynamic_load_rating_c_kn=32.5)
    out = engine.calculate(inp)
    assert out.equivalent_radial_load_kn > 8.0
    assert out.rating_life_l10_mr > 0.0
    assert out.rating_life_hours_l10h > 0.0


def test_gear_strength_lewis():
    engine = GearStrengthEngine()
    inp = GearStrengthInput(module_mm=4.0, pinion_teeth=20, gear_teeth=60, face_width_mm=40.0)
    out = engine.calculate(inp)
    assert out.pitch_diameter_mm == 80.0
    assert out.lewis_beam_strength_n > 5000.0
    assert out.bending_safety_factor > 1.0


def test_power_screw_torque():
    engine = PowerScrewEngine()
    inp = PowerScrewInput(thread_profile="square_thread", nominal_diameter_mm=40.0, pitch_mm=7.0, axial_load_kn=20.0)
    out = engine.calculate(inp)
    assert out.torque_to_raise_nm > out.torque_to_lower_nm
    assert out.is_self_locking is True


def test_fatigue_life_goodman():
    engine = FatigueLifeEngine()
    inp = FatigueLifeInput(ultimate_strength_mpa=600.0, yield_strength_mpa=400.0, max_cyclic_stress_mpa=250.0, min_cyclic_stress_mpa=50.0)
    out = engine.calculate(inp)
    assert out.stress_amplitude_sigma_a_mpa == 100.0
    assert out.mean_stress_sigma_m_mpa == 150.0
    assert out.goodman_safety_factor > 0.0


def test_crack_propagation_paris():
    engine = CrackPropagationEngine()
    inp = CrackPropagationInput(initial_crack_size_mm=2.0, fracture_toughness_mpam=50.0, max_stress_mpa=150.0)
    out = engine.calculate(inp)
    assert out.stress_intensity_ki_mpam > 0.0
    assert out.critical_crack_size_mm > 2.0
    assert out.cycles_to_failure_nf > 1000.0


def test_cross_section_props_ibeam():
    engine = CrossSectionPropsEngine()
    inp = CrossSectionPropsInput(section_type="i_beam", overall_height_mm=200.0, flange_width_mm=100.0)
    out = engine.calculate(inp)
    assert out.area_mm2 > 2000.0
    assert out.moment_of_inertia_ix_cm4 > out.moment_of_inertia_iy_cm4
    assert out.section_modulus_zx_cm3 > 0.0


def test_material_testing_utm():
    engine = MaterialTestingEngine()
    inp = MaterialTestingInput(test_type="utm_tensile", gauge_diameter_mm=12.5, gauge_length_mm=50.0, yield_load_kn=45.0, ultimate_load_kn=75.0)
    out = engine.calculate(inp)
    assert out.yield_strength_mpa > 300.0
    assert out.ultimate_strength_mpa > out.yield_strength_mpa
    assert out.brinell_hardness_hbw > 100.0
