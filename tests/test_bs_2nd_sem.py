"""
Unit Tests for WBSCTE Basic Science (BS) 2nd Semester Physics, Mechanics, Maths-II & IT Engines
================================================================================================
Validates:
1. SnellsLawRefractionGlassSlabEngine
2. ConvexLensFocalLengthUVEngine
3. GalvanometerHalfDeflectionResistanceEngine
4. GalvanometerAmmeterVoltmeterConversionEngine
5. PhotoelectricEffectInverseSquareLawEngine
6. PNJunctionDiodeKneeVoltageEngine
7. ParallelPlateCapacitorPermittivityEngine
8. CantileverVibrationFrequencyPeriodEngine
9. SinglePurchaseCrabWinchEngine
10. DoublePurchaseCrabWinchEngine
11. WormAndWormWheelMachineEngine
12. DifferentialAxleAndWheelEngine
13. LamisTheoremCoplanarForcesEngine
14. JibCraneTieJibForcesEngine
15. CramersRuleMatrixInversionSystemEngine
16. NumberSystemBaseConversionsEngine
"""

import pytest
from app.simulation.bs_2nd_sem_suite import (
    SnellsLawRefractionGlassSlabEngine, SnellsLawRefractionGlassSlabInput,
    ConvexLensFocalLengthUVEngine, ConvexLensFocalLengthUVInput,
    GalvanometerHalfDeflectionResistanceEngine, GalvanometerHalfDeflectionResistanceInput,
    GalvanometerAmmeterVoltmeterConversionEngine, GalvanometerAmmeterVoltmeterConversionInput,
    PhotoelectricEffectInverseSquareLawEngine, PhotoelectricEffectInverseSquareLawInput,
    PNJunctionDiodeKneeVoltageEngine, PNJunctionDiodeKneeVoltageInput,
    ParallelPlateCapacitorPermittivityEngine, ParallelPlateCapacitorPermittivityInput,
    CantileverVibrationFrequencyPeriodEngine, CantileverVibrationFrequencyPeriodInput,
    SinglePurchaseCrabWinchEngine, SinglePurchaseCrabWinchInput,
    DoublePurchaseCrabWinchEngine, DoublePurchaseCrabWinchInput,
    WormAndWormWheelMachineEngine, WormAndWormWheelMachineInput,
    DifferentialAxleAndWheelEngine, DifferentialAxleAndWheelInput,
    LamisTheoremCoplanarForcesEngine, LamisTheoremCoplanarForcesInput,
    JibCraneTieJibForcesEngine, JibCraneTieJibForcesInput,
    CramersRuleMatrixInversionSystemEngine, CramersRuleMatrixInversionSystemInput,
    NumberSystemBaseConversionsEngine, NumberSystemBaseConversionsInput,
)


def test_snells_law_refraction_glass_slab():
    engine = SnellsLawRefractionGlassSlabEngine()
    inp = SnellsLawRefractionGlassSlabInput(
        angle_of_incidence_i_deg=45.0,
        refractive_index_mu=1.50,
        slab_thickness_t_cm=6.0
    )
    out = engine.calculate(inp)
    assert abs(out.angle_of_refraction_r_deg - 28.13) < 0.1
    assert abs(out.lateral_shift_displacement_cm - 1.974) < 0.05


def test_convex_lens_focal_length_uv():
    engine = ConvexLensFocalLengthUVEngine()
    inp = ConvexLensFocalLengthUVInput(
        object_distance_u_cm=-30.0,
        image_distance_v_cm=60.0
    )
    out = engine.calculate(inp)
    assert abs(out.focal_length_f_cm - 20.0) < 0.1
    assert abs(out.lens_power_dioptres - 5.0) < 0.1


def test_galvanometer_half_deflection_resistance():
    engine = GalvanometerHalfDeflectionResistanceEngine()
    inp = GalvanometerHalfDeflectionResistanceInput(
        cell_emf_e_volts=2.0,
        high_resistance_r_ohms=4500.0,
        full_deflection_theta_div=30,
        shunt_resistance_s_ohms=100.0
    )
    out = engine.calculate(inp)
    assert abs(out.galvanometer_resistance_g_ohms - 102.27) < 0.5


def test_galvanometer_ammeter_voltmeter_conversion():
    engine = GalvanometerAmmeterVoltmeterConversionEngine()
    inp = GalvanometerAmmeterVoltmeterConversionInput(
        galvanometer_resistance_g_ohms=100.0,
        full_scale_deflection_current_ig_ma=0.5,
        desired_ammeter_range_i_amp=3.0,
        desired_voltmeter_range_v_volts=15.0
    )
    out = engine.calculate(inp)
    assert abs(out.parallel_shunt_resistance_s_ohms - 0.01667) < 0.001
    assert abs(out.series_multiplier_resistance_rs_ohms - 29900.0) < 1.0


def test_photoelectric_effect_inverse_square_law():
    engine = PhotoelectricEffectInverseSquareLawEngine()
    inp = PhotoelectricEffectInverseSquareLawInput(
        source_distance_d_cm=25.0,
        source_power_p_watts=60.0,
        photocathode_work_function_phi_ev=2.14,
        incident_light_wavelength_nm=450.0
    )
    out = engine.calculate(inp)
    assert abs(out.incident_light_intensity_w_m2 - 76.39) < 0.5
    assert abs(out.max_kinetic_energy_kmax_ev - 0.616) < 0.05


def test_pn_junction_diode_knee_voltage():
    engine = PNJunctionDiodeKneeVoltageEngine()
    inp = PNJunctionDiodeKneeVoltageInput(
        forward_voltage_vf_volts=0.75,
        semiconductor_material="Silicon (Si)",
        temperature_k=300.0,
        saturation_current_is_na=10.0
    )
    out = engine.calculate(inp)
    assert out.knee_voltage_vk_volts == 0.70
    assert "HIGH CONDUCTION" in out.conduction_state


def test_parallel_plate_capacitor_permittivity():
    engine = ParallelPlateCapacitorPermittivityEngine()
    inp = ParallelPlateCapacitorPermittivityInput(
        plate_diameter_d_cm=20.0,
        plate_separation_d_mm=2.0,
        dielectric_constant_k=4.5,
        applied_voltage_v_volts=200.0
    )
    out = engine.calculate(inp)
    assert abs(out.vacuum_capacitance_c0_pf - 139.06) < 1.0
    assert abs(out.dielectric_capacitance_c_pf - 625.77) < 5.0


def test_cantilever_vibration_frequency_period():
    engine = CantileverVibrationFrequencyPeriodEngine()
    inp = CantileverVibrationFrequencyPeriodInput(
        cantilever_length_l_cm=50.0,
        blade_width_b_mm=25.0,
        blade_thickness_d_mm=1.5,
        youngs_modulus_y_gpa=200.0,
        attached_load_m_kg=0.30
    )
    out = engine.calculate(inp)
    assert abs(out.cantilever_stiffness_k_n_m - 33.75) < 0.5
    assert abs(out.oscillation_time_period_t_sec - 0.5924) < 0.05


def test_single_purchase_crab_winch():
    engine = SinglePurchaseCrabWinchEngine()
    inp = SinglePurchaseCrabWinchInput(
        load_lifted_w_kg=60.0,
        effort_applied_p_kg=4.5,
        effort_wheel_diameter_2r_cm=40.0,
        load_drum_diameter_d_cm=15.0,
        teeth_pinion_t1=20,
        teeth_spur_gear_t2=60
    )
    out = engine.calculate(inp)
    assert abs(out.velocity_ratio_vr - 8.0) < 0.1
    assert abs(out.mechanical_advantage_ma - 13.33) < 0.1


def test_double_purchase_crab_winch():
    engine = DoublePurchaseCrabWinchEngine()
    inp = DoublePurchaseCrabWinchInput(
        load_lifted_w_kg=150.0,
        effort_applied_p_kg=5.0,
        effort_arm_length_r_cm=30.0,
        load_drum_radius_r_drum_cm=10.0,
        pinions_t1_t3=[20, 25],
        spur_gears_t2_t4=[60, 100]
    )
    out = engine.calculate(inp)
    assert abs(out.velocity_ratio_vr - 36.0) < 0.1
    assert abs(out.mechanical_advantage_ma - 30.0) < 0.1
    assert abs(out.mechanical_efficiency_percent - 83.33) < 0.5


def test_worm_and_worm_wheel_machine():
    engine = WormAndWormWheelMachineEngine()
    inp = WormAndWormWheelMachineInput(
        load_lifted_w_kg=120.0,
        effort_applied_p_kg=3.2,
        effort_wheel_radius_r_cm=25.0,
        load_drum_radius_r_drum_cm=8.0,
        teeth_worm_wheel_t=40,
        worm_threads_n=1
    )
    out = engine.calculate(inp)
    assert abs(out.velocity_ratio_vr - 125.0) < 0.1
    assert abs(out.mechanical_advantage_ma - 37.5) < 0.1
    assert "SELF-LOCKING" in out.reversibility_self_locking_status


def test_differential_axle_and_wheel():
    engine = DifferentialAxleAndWheelEngine()
    inp = DifferentialAxleAndWheelInput(
        load_lifted_w_kg=100.0,
        effort_applied_p_kg=8.0,
        effort_wheel_diameter_d_cm=40.0,
        larger_axle_diameter_d1_cm=20.0,
        smaller_axle_diameter_d2_cm=15.0
    )
    out = engine.calculate(inp)
    assert abs(out.velocity_ratio_vr - 16.0) < 0.1
    assert abs(out.mechanical_advantage_ma - 12.5) < 0.1
    assert abs(out.mechanical_efficiency_percent - 78.13) < 0.5


def test_lamis_theorem_coplanar_forces():
    engine = LamisTheoremCoplanarForcesEngine()
    inp = LamisTheoremCoplanarForcesInput(
        force_p_newtons=100.0,
        angle_alpha_deg=120.0,
        angle_beta_deg=135.0
    )
    out = engine.calculate(inp)
    assert abs(out.angle_gamma_deg - 105.0) < 0.1
    assert abs(out.force_q_newtons - 81.65) < 0.5
    assert abs(out.force_r_newtons - 111.54) < 0.5


def test_jib_crane_tie_jib_forces():
    engine = JibCraneTieJibForcesEngine()
    inp = JibCraneTieJibForcesInput(
        suspended_load_w_kn=20.0,
        jib_angle_theta1_deg=30.0,
        tie_angle_theta2_deg=45.0
    )
    out = engine.calculate(inp)
    assert abs(out.tie_rod_tension_ftie_kn - 14.64) < 0.2
    assert abs(out.jib_boom_compression_fjib_kn - 10.35) < 0.2


def test_cramers_rule_matrix_inversion_system():
    engine = CramersRuleMatrixInversionSystemEngine()
    inp = CramersRuleMatrixInversionSystemInput(
        matrix_a_row1=[2.0, 1.0, 1.0],
        matrix_a_row2=[1.0, 3.0, 2.0],
        matrix_a_row3=[1.0, 1.0, 1.0],
        constants_vector_b=[10.0, 18.0, 6.0]
    )
    out = engine.calculate(inp)
    assert abs(out.main_determinant_delta - 1.0) < 0.1
    assert abs(out.solution_x - 4.0) < 0.1
    assert abs(out.solution_y - 10.0) < 0.1
    assert abs(out.solution_z - (-8.0)) < 0.1


def test_number_system_base_conversions():
    engine = NumberSystemBaseConversionsEngine()
    inp = NumberSystemBaseConversionsInput(input_decimal_integer=215)
    out = engine.calculate(inp)
    assert out.binary_string == "11010111"
    assert out.octal_string == "327"
    assert out.hexadecimal_string == "D7"
    assert out.bcd_8421_string == "0010 0001 0101"
