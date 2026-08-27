"""
Unit Tests for WBSCTE Electrical Engineering 5th Semester Simulation Suite
==========================================================================
Validates PowerElectronicsDrivesEngine, Microcontroller8051Engine, SwitchgearProtectionEngine,
ElectricTractionHeatingEngine, IlluminationEngineeringEngine, and EnergyAuditConservationEngine.
"""

import pytest
from app.simulation import (
    PowerElectronicsDrivesEngine, PowerElectronicsDrivesInput,
    Microcontroller8051Engine, Microcontroller8051Input,
    SwitchgearProtectionEngine, SwitchgearProtectionInput,
    ElectricTractionHeatingEngine, ElectricTractionHeatingInput,
    IlluminationEngineeringEngine, IlluminationEngineeringInput,
    EnergyAuditConservationEngine, EnergyAuditConservationInput,
)


def test_power_electronics_scr_bridge():
    engine = PowerElectronicsDrivesEngine()
    inp = PowerElectronicsDrivesInput(
        converter_topology="scr_single_phase_bridge",
        firing_angle_alpha_deg=45.0,
        ac_input_voltage_rms=230.0,
        load_resistance_r=10.0
    )
    out = engine.calculate(inp)
    assert out.average_dc_voltage_vo > 100.0
    assert out.average_load_current_io_a > 10.0
    assert out.form_factor > 1.0


def test_microcontroller_8051_baud():
    engine = Microcontroller8051Engine()
    inp = Microcontroller8051Input(
        subsystem_mode="baud_rate_generator",
        crystal_frequency_mhz=11.0592,
        target_baud_rate=9600,
        smod_bit=0
    )
    out = engine.calculate(inp)
    assert out.timer1_th1_reload_hex == "0xFD"
    assert out.timer1_th1_reload_dec == 253
    assert out.steps_per_revolution == 200


def test_switchgear_protection_idmt():
    engine = SwitchgearProtectionEngine()
    inp = SwitchgearProtectionInput(
        protection_scheme="idmt_overcurrent_relay",
        fault_current_a=3500.0,
        ct_primary_rating_a=400.0,
        ct_secondary_rating_a=5.0,
        plug_setting_multiplier_ps=1.25,
        time_multiplier_setting_tms=0.5
    )
    out = engine.calculate(inp)
    assert out.plug_setting_multiplier_psm > 1.0
    assert 0.0 < out.relay_operating_time_sec < 10.0
    assert "TRIP" in out.circuit_breaker_status


def test_electric_traction_heating_speed_time():
    engine = ElectricTractionHeatingEngine()
    inp = ElectricTractionHeatingInput(
        application_domain="traction_speed_time_curve",
        max_speed_vm_kmph=60.0,
        acceleration_alpha_kmphs=1.8,
        braking_beta_kmphs=2.5,
        run_distance_d_km=1.5
    )
    out = engine.calculate(inp)
    assert out.total_run_time_t_sec > 0.0
    assert out.average_speed_kmph > 0.0
    assert out.specific_energy_consumption_sec_wh_ton_km > 0.0


def test_illumination_engineering_lumen():
    engine = IlluminationEngineeringEngine()
    inp = IlluminationEngineeringInput(
        illumination_task="indoor_lumen_design",
        room_length_m=20.0,
        room_width_m=12.0,
        target_lux_level_e=300.0,
        lamp_lumen_output_f=3600.0,
        utilization_factor_uf=0.6,
        maintenance_factor_mf=0.8
    )
    out = engine.calculate(inp)
    assert out.required_number_of_luminaires_n > 0
    assert out.total_floor_area_sqm == 240.0
    assert out.illuminance_at_point_lux > 0.0


def test_energy_audit_conservation_pf():
    engine = EnergyAuditConservationEngine()
    inp = EnergyAuditConservationInput(
        audit_focus="power_factor_correction",
        active_load_power_p_kw=250.0,
        existing_power_factor_cos1=0.72,
        target_power_factor_cos2=0.98,
        electricity_tariff_per_kwh=7.50
    )
    out = engine.calculate(inp)
    assert out.required_capacitor_bank_kvar > 100.0
    assert out.annual_energy_cost_savings_inr > 0.0
    assert 0.0 < out.simple_payback_period_years < 3.0
