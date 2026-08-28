"""
Unit Tests for WBSCTE Electronics & Telecommunication Engineering (ETCE) 6th Semester Physics Engines
======================================================================================================
Validates:
1. OpticalFiberLinkAttenuationEngine
2. SatelliteLinkBudgetLookAnglesEngine
3. CellularFrequencyReuseHandoffEngine
4. LVDTDisplacementTransducerEngine
5. StrainGaugeWheatstoneBridgeEngine
6. RTDThermocouplePyrometerEngine
7. SecondOrderSystemTransientResponseEngine
8. RouthHurwitzStabilityCriterionEngine
9. DielectricInductionHeatingEngine
10. PLCLadderLogicSimulatorEngine
11. UltrasonicFlawDetectorNDTEngine
12. ECGBiopotentialInstrumentationEngine
"""

import pytest
from app.simulation.etce_6th_sem_suite import (
    OpticalFiberLinkAttenuationEngine, OpticalFiberLinkAttenuationInput,
    SatelliteLinkBudgetLookAnglesEngine, SatelliteLinkBudgetLookAnglesInput,
    CellularFrequencyReuseHandoffEngine, CellularFrequencyReuseHandoffInput,
    LVDTDisplacementTransducerEngine, LVDTDisplacementTransducerInput,
    StrainGaugeWheatstoneBridgeEngine, StrainGaugeWheatstoneBridgeInput,
    RTDThermocouplePyrometerEngine, RTDThermocouplePyrometerInput,
    SecondOrderSystemTransientResponseEngine, SecondOrderSystemTransientResponseInput,
    RouthHurwitzStabilityCriterionEngine, RouthHurwitzStabilityCriterionInput,
    DielectricInductionHeatingEngine, DielectricInductionHeatingInput,
    PLCLadderLogicSimulatorEngine, PLCLadderLogicSimulatorInput,
    UltrasonicFlawDetectorNDTEngine, UltrasonicFlawDetectorNDTInput,
    ECGBiopotentialInstrumentationEngine, ECGBiopotentialInstrumentationInput,
)


def test_optical_fiber_link_attenuation():
    engine = OpticalFiberLinkAttenuationEngine()
    inp = OpticalFiberLinkAttenuationInput(
        core_refractive_index_n1=1.48,
        cladding_refractive_index_n2=1.46,
        core_radius_a_um=25.0,
        operating_wavelength_nm=1310.0,
        fiber_length_km=15.0,
        input_optical_power_mw=2.0
    )
    out = engine.calculate(inp)
    assert abs(out.numerical_aperture_na - 0.2425) < 0.01
    assert 13.5 < out.acceptance_angle_deg < 14.5
    assert out.total_fiber_link_loss_db > 0.0
    assert out.received_optical_power_mw < 2.0


def test_satellite_link_budget_look_angles():
    engine = SatelliteLinkBudgetLookAnglesEngine()
    inp = SatelliteLinkBudgetLookAnglesInput(
        earth_station_lat_deg=22.5,
        earth_station_lon_deg=88.36,
        satellite_lon_deg=83.0,
        uplink_frequency_ghz=14.0,
        transmitter_eirp_dbw=55.0,
        earth_station_g_over_t_db_k=28.0
    )
    out = engine.calculate(inp)
    assert 150.0 < out.azimuth_angle_deg < 220.0
    assert 50.0 < out.elevation_angle_deg < 70.0
    assert out.free_space_path_loss_db > 200.0
    assert out.carrier_to_noise_density_c_n0_dbhz > 90.0


def test_cellular_frequency_reuse_handoff():
    engine = CellularFrequencyReuseHandoffEngine()
    inp = CellularFrequencyReuseHandoffInput(
        cluster_size_k=7,
        path_loss_exponent_gamma=4.0,
        cell_radius_r_km=2.0,
        total_available_channels=350
    )
    out = engine.calculate(inp)
    assert abs(out.co_channel_reuse_ratio_q - 4.58) < 0.1
    assert out.signal_to_interference_ratio_sir_db >= 18.0
    assert out.channels_per_cell == 50
    assert "COMPLIANT" in out.sir_compliance_status


def test_lvdt_displacement_transducer():
    engine = LVDTDisplacementTransducerEngine()
    inp = LVDTDisplacementTransducerInput(
        core_displacement_mm=2.5,
        sensitivity_mv_per_mm=40.0,
        residual_null_voltage_mv=5.0
    )
    out = engine.calculate(inp)
    assert out.differential_secondary_output_vrms_mv > 90.0
    assert out.output_phase_angle_deg == 0.0
    assert "FORWARD" in out.core_direction_polarity


def test_strain_gauge_wheatstone_bridge():
    engine = StrainGaugeWheatstoneBridgeEngine()
    inp = StrainGaugeWheatstoneBridgeInput(
        applied_mechanical_strain_microstrain=500.0,
        gauge_factor_gf=2.1,
        bridge_configuration="Quarter Bridge (1 Active Gauge)",
        bridge_excitation_voltage_v=10.0
    )
    out = engine.calculate(inp)
    assert abs(out.fractional_resistance_change_pct - 0.105) < 0.01
    assert abs(out.bridge_output_voltage_mv - 2.625) < 0.05


def test_rtd_thermocouple_pyrometer():
    engine = RTDThermocouplePyrometerEngine()
    inp = RTDThermocouplePyrometerInput(
        measured_temperature_degc=150.0,
        sensor_type="Pt100 RTD (Platinum resistance: R0 = 100Ω)",
        rtd_ice_point_r0_ohm=100.0
    )
    out = engine.calculate(inp)
    assert "157.33" in out.sensor_electrical_output or "158" in out.sensor_electrical_output
    assert "LINEARITY" in out.measurement_linearity_status


def test_second_order_system_transient_response():
    engine = SecondOrderSystemTransientResponseEngine()
    inp = SecondOrderSystemTransientResponseInput(
        natural_frequency_wn_rads=5.0,
        damping_ratio_zeta=0.5
    )
    out = engine.calculate(inp)
    assert abs(out.damped_frequency_wd_rads - 4.33) < 0.1
    assert 14.0 < out.percentage_peak_overshoot_pct < 18.0
    assert abs(out.settling_time_2pct_ts_s - 1.60) < 0.1
    assert "UNDERDAMPED" in out.system_damping_type


def test_routh_hurwitz_stability_criterion():
    engine = RouthHurwitzStabilityCriterionEngine()
    inp = RouthHurwitzStabilityCriterionInput(
        coeff_a3=1.0,
        coeff_a2=6.0,
        coeff_a1=11.0,
        coeff_a0=6.0
    )
    out = engine.calculate(inp)
    assert out.sign_changes_count_rhp_poles == 0
    assert "STABLE" in out.system_stability_verdict


def test_dielectric_induction_heating():
    engine = DielectricInductionHeatingEngine()
    inp = DielectricInductionHeatingInput(
        heating_process="Dielectric Heating (Insulators / Plastics / Wood)",
        rf_generator_freq_mhz=27.12,
        rf_voltage_vrms_v=3000.0,
        loss_tangent_tan_delta=0.035
    )
    out = engine.calculate(inp)
    assert out.thermal_power_generated_watts > 3000.0
    assert "Plastics" in out.industrial_application_domain


def test_plc_ladder_logic_simulator():
    engine = PLCLadderLogicSimulatorEngine()
    inp = PLCLadderLogicSimulatorInput(
        start_pushbutton_i0=True,
        stop_pushbutton_i1=False,
        thermal_overload_i2=False
    )
    out = engine.calculate(inp)
    assert out.main_contactor_q0_state is True
    assert out.delta_contactor_q2_state is True
    assert out.plc_scan_cycle_time_ms == 2.5


def test_ultrasonic_flaw_detector_ndt():
    engine = UltrasonicFlawDetectorNDTEngine()
    inp = UltrasonicFlawDetectorNDTInput(
        steel_acoustic_velocity_m_s=5920.0,
        specimen_thickness_mm=50.0,
        flaw_depth_mm=22.5,
        probe_frequency_mhz=4.0
    )
    out = engine.calculate(inp)
    assert abs(out.backwall_echo_time_of_flight_us - 16.89) < 0.2
    assert abs(out.flaw_echo_time_of_flight_us - 7.60) < 0.2
    assert out.acoustic_wavelength_mm < 2.0


def test_ecg_biopotential_instrumentation():
    engine = ECGBiopotentialInstrumentationEngine()
    inp = ECGBiopotentialInstrumentationInput(
        lead_i_voltage_mv=0.8,
        lead_iii_voltage_mv=0.5,
        heart_rate_bpm=72.0,
        instrumentation_amp_gain=1000.0
    )
    out = engine.calculate(inp)
    assert abs(out.lead_ii_voltage_einthoven_mv - 1.3) < 0.01
    assert 45.0 < out.cardiac_electrical_axis_deg < 65.0
    assert "NORMAL" in out.clinical_axis_interpretation
