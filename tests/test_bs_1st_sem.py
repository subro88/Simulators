"""
Unit Tests for WBSCTE Basic Science (BS) 1st Semester Physics, Chemistry & Maths Engines
========================================================================================
Validates:
1. VernierCaliperVolumeMeasurementEngine
2. MicrometerScrewGaugeMeasurementEngine
3. SpherometerRadiusCurvatureEngine
4. FrictionInclinedPlaneCoefficientEngine
5. FlywheelMomentOfInertiaEngine
6. StokesLawViscosityTerminalVelocityEngine
7. ThermalLinearExpansionCoefficientEngine
8. BoylesLawIsothermalGasEngine
9. AcidBaseTitrationNeutralizationEngine
10. WaterHardnessEDTATitrationEngine
11. DanielCellElectrochemicalEMFEngine
12. FaradayElectrolysisCopperSulfateEngine
13. RedwoodViscometerOilViscosityEngine
14. FlashFirePointAbelApparatusEngine
15. ComplexNumbersArgandPolarEngine
16. VectorAlgebraDotCrossProductsEngine
"""

import pytest
from app.simulation.bs_1st_sem_suite import (
    VernierCaliperVolumeMeasurementEngine, VernierCaliperVolumeMeasurementInput,
    MicrometerScrewGaugeMeasurementEngine, MicrometerScrewGaugeMeasurementInput,
    SpherometerRadiusCurvatureEngine, SpherometerRadiusCurvatureInput,
    FrictionInclinedPlaneCoefficientEngine, FrictionInclinedPlaneCoefficientInput,
    FlywheelMomentOfInertiaEngine, FlywheelMomentOfInertiaInput,
    StokesLawViscosityTerminalVelocityEngine, StokesLawViscosityTerminalVelocityInput,
    ThermalLinearExpansionCoefficientEngine, ThermalLinearExpansionCoefficientInput,
    BoylesLawIsothermalGasEngine, BoylesLawIsothermalGasInput,
    AcidBaseTitrationNeutralizationEngine, AcidBaseTitrationNeutralizationInput,
    WaterHardnessEDTATitrationEngine, WaterHardnessEDTATitrationInput,
    DanielCellElectrochemicalEMFEngine, DanielCellElectrochemicalEMFInput,
    FaradayElectrolysisCopperSulfateEngine, FaradayElectrolysisCopperSulfateInput,
    RedwoodViscometerOilViscosityEngine, RedwoodViscometerOilViscosityInput,
    FlashFirePointAbelApparatusEngine, FlashFirePointAbelApparatusInput,
    ComplexNumbersArgandPolarEngine, ComplexNumbersArgandPolarInput,
    VectorAlgebraDotCrossProductsEngine, VectorAlgebraDotCrossProductsInput,
)


def test_vernier_caliper_volume_measurement():
    engine = VernierCaliperVolumeMeasurementEngine()
    inp = VernierCaliperVolumeMeasurementInput(
        main_scale_reading_msr_cm=3.4,
        vernier_scale_coincidence_vsd=6,
        least_count_lc_cm=0.01,
        internal_diameter_d_cm=2.2,
        length_l_cm=6.5
    )
    out = engine.calculate(inp)
    assert abs(out.external_diameter_d_cm - 3.46) < 0.01
    assert abs(out.hollow_cylinder_volume_cm3 - 36.41) < 0.5


def test_micrometer_screw_gauge_measurement():
    engine = MicrometerScrewGaugeMeasurementEngine()
    inp = MicrometerScrewGaugeMeasurementInput(
        main_scale_reading_msr_mm=2.0,
        circular_scale_reading_csr=42,
        pitch_mm=1.0,
        circular_divisions=100,
        zero_error_mm=0.02
    )
    out = engine.calculate(inp)
    assert abs(out.corrected_diameter_mm - 2.40) < 0.01
    assert abs(out.wire_cross_sectional_area_mm2 - 4.524) < 0.05


def test_spherometer_radius_curvature():
    engine = SpherometerRadiusCurvatureEngine()
    inp = SpherometerRadiusCurvatureInput(
        mean_distance_between_legs_l_mm=40.0,
        sagitta_height_h_mm=1.85
    )
    out = engine.calculate(inp)
    assert abs(out.radius_of_curvature_r_mm - 145.07) < 0.5
    assert abs(out.focal_length_f_cm - 7.25) < 0.1


def test_friction_inclined_plane_coefficient():
    engine = FrictionInclinedPlaneCoefficientEngine()
    inp = FrictionInclinedPlaneCoefficientInput(
        mass_of_slider_m_kg=0.5,
        angle_of_inclination_deg=28.0
    )
    out = engine.calculate(inp)
    assert abs(out.coefficient_of_static_friction_mu - 0.5317) < 0.01
    assert abs(out.normal_reaction_n_newtons - 4.331) < 0.05


def test_flywheel_moment_of_inertia():
    engine = FlywheelMomentOfInertiaEngine()
    inp = FlywheelMomentOfInertiaInput(
        mass_attached_m_kg=0.4,
        height_of_fall_h_m=1.2,
        turns_on_axle_N=5,
        rotations_after_detachment_n=42,
        axle_radius_r_m=0.02,
        time_after_detachment_t_s=18.0
    )
    out = engine.calculate(inp)
    assert abs(out.moment_of_inertia_i_kg_m2 - 4.111) < 0.1


def test_stokes_law_viscosity_terminal_velocity():
    engine = StokesLawViscosityTerminalVelocityEngine()
    inp = StokesLawViscosityTerminalVelocityInput(
        sphere_radius_r_mm=1.5,
        density_of_sphere_rho_kg_m3=7800.0,
        density_of_liquid_sigma_kg_m3=1260.0,
        terminal_velocity_v_m_s=0.082
    )
    out = engine.calculate(inp)
    assert abs(out.dynamic_viscosity_eta_pa_s - 0.3912) < 0.02
    assert abs(out.dynamic_viscosity_eta_poise - 3.912) < 0.2


def test_thermal_linear_expansion_coefficient():
    engine = ThermalLinearExpansionCoefficientEngine()
    inp = ThermalLinearExpansionCoefficientInput(
        initial_rod_length_l0_cm=50.0,
        initial_temp_t1_degc=25.0,
        final_temp_t2_degc=100.0,
        elongation_dl_mm=0.64
    )
    out = engine.calculate(inp)
    assert abs(out.coefficient_of_linear_expansion_alpha - 1.707e-5) < 1e-6


def test_boyles_law_isothermal_gas():
    engine = BoylesLawIsothermalGasEngine()
    inp = BoylesLawIsothermalGasInput(
        atmospheric_pressure_p0_cm_hg=76.0,
        manometer_difference_h_cm=14.0,
        air_column_length_l_cm=22.5
    )
    out = engine.calculate(inp)
    assert abs(out.total_absolute_pressure_p_cm_hg - 90.0) < 0.1
    assert abs(out.pv_constant_product - 2025.0) < 1.0


def test_acid_base_titration_neutralization():
    engine = AcidBaseTitrationNeutralizationEngine()
    inp = AcidBaseTitrationNeutralizationInput(
        oxalic_acid_normality_n1=0.10,
        oxalic_acid_pipette_volume_v1_ml=20.0,
        naoh_burette_concordant_reading_v2_ml=18.6
    )
    out = engine.calculate(inp)
    assert abs(out.naoh_normality_n2 - 0.1075) < 0.001
    assert abs(out.naoh_strength_grams_per_litre - 4.30) < 0.1


def test_water_hardness_edta_titration():
    engine = WaterHardnessEDTATitrationEngine()
    inp = WaterHardnessEDTATitrationInput(
        water_sample_volume_v_sample_ml=50.0,
        edta_molarity_m=0.01,
        edta_concordant_burette_volume_v_edta_ml=14.2
    )
    out = engine.calculate(inp)
    assert abs(out.total_hardness_ppm_caco3 - 284.0) < 1.0
    assert "HARD" in out.water_hardness_classification


def test_daniel_cell_electrochemical_emf():
    engine = DanielCellElectrochemicalEMFEngine()
    inp = DanielCellElectrochemicalEMFInput(
        zinc_ion_concentration_m=0.1,
        copper_ion_concentration_m=1.0,
        temperature_k=298.15
    )
    out = engine.calculate(inp)
    assert abs(out.actual_cell_emf_volts - 1.1295) < 0.01
    assert out.gibbs_free_energy_delta_g_kj < 0.0


def test_faraday_electrolysis_copper_sulfate():
    engine = FaradayElectrolysisCopperSulfateEngine()
    inp = FaradayElectrolysisCopperSulfateInput(
        current_current_i_amp=1.5,
        time_duration_t_min=30.0,
        atomic_mass_copper=63.54,
        valency_z=2
    )
    out = engine.calculate(inp)
    assert abs(out.total_charge_q_coulombs - 2700.0) < 1.0
    assert abs(out.mass_of_copper_deposited_grams - 0.889) < 0.02


def test_redwood_viscometer_oil_viscosity():
    engine = RedwoodViscometerOilViscosityEngine()
    inp = RedwoodViscometerOilViscosityInput(
        redwood_efflux_time_t_seconds=185.0,
        oil_temperature_degc=50.0,
        oil_specific_gravity=0.89
    )
    out = engine.calculate(inp)
    assert abs(out.kinematic_viscosity_nu_cst - 45.43) < 0.5
    assert abs(out.dynamic_viscosity_eta_cp - 40.43) < 0.5


def test_flash_fire_point_abel_apparatus():
    engine = FlashFirePointAbelApparatusEngine()
    inp = FlashFirePointAbelApparatusInput(
        barometric_pressure_p_kpa=101.3,
        observed_flash_point_degc=42.0,
        observed_fire_point_degc=48.0
    )
    out = engine.calculate(inp)
    assert out.corrected_flash_point_degc == 42.0
    assert "CLASS B" in out.petroleum_combustibility_class


def test_complex_numbers_argand_polar():
    engine = ComplexNumbersArgandPolarEngine()
    inp = ComplexNumbersArgandPolarInput(
        real_part_x=3.0,
        imaginary_part_y=4.0,
        power_n_demoivre=3
    )
    out = engine.calculate(inp)
    assert abs(out.modulus_r - 5.0) < 0.01
    assert abs(out.argument_theta_deg - 53.13) < 0.1
    assert abs(out.demoivre_powered_real - (-117.0)) < 1.0


def test_vector_algebra_dot_cross_products():
    engine = VectorAlgebraDotCrossProductsEngine()
    inp = VectorAlgebraDotCrossProductsInput(
        vector_a_components=[3.0, 4.0, 0.0],
        vector_b_components=[2.0, -1.0, 2.0],
        lever_arm_r_components=[0.5, 0.2, 0.0],
        force_f_components=[10.0, 25.0, 0.0]
    )
    out = engine.calculate(inp)
    assert abs(out.dot_product_work_done_joules - 2.0) < 0.01
    assert abs(out.torque_magnitude_n_m - 10.5) < 0.1
