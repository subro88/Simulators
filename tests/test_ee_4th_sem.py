"""
Unit Tests for WBSCTE Electrical Engineering 4th Semester Simulation Suite
==========================================================================
Validates ElectricalMachines2Engine, ElectricalMeasurementControlEngine, AppliedDigitalElectronicsEngine,
ElectricalCadDrawingEngine, PowerPlantEngineeringEngine, and ElectricalMaintenancePracticeEngine.
"""

import pytest
from app.simulation import (
    ElectricalMachines2Engine, ElectricalMachines2Input,
    ElectricalMeasurementControlEngine, ElectricalMeasurementControlInput,
    AppliedDigitalElectronicsEngine, AppliedDigitalElectronicsInput,
    ElectricalCadDrawingEngine, ElectricalCadDrawingInput,
    PowerPlantEngineeringEngine, PowerPlantEngineeringInput,
    ElectricalMaintenancePracticeEngine, ElectricalMaintenancePracticeInput,
)


def test_electrical_machines_2_torque_slip():
    engine = ElectricalMachines2Engine()
    inp = ElectricalMachines2Input(
        machine_type="induction_motor_torque_slip",
        supply_voltage_v=415.0,
        supply_frequency_hz=50.0,
        pole_count=4,
        rotor_resistance_r2=0.4,
        rotor_reactance_x2=2.0,
        operational_slip=0.04
    )
    out = engine.calculate(inp)
    assert out.synchronous_speed_ns_rpm == 1500.0
    assert out.rotor_speed_nr_rpm == 1440.0
    assert out.developed_torque_nm > 0.0
    assert out.maximum_breakdown_torque_tmax_nm > out.developed_torque_nm


def test_electrical_measurement_control_pid():
    engine = ElectricalMeasurementControlEngine()
    inp = ElectricalMeasurementControlInput(
        control_mode="pid_step_response",
        damping_ratio_zeta=0.6,
        natural_frequency_wn_rad_s=4.0,
        proportional_gain_kp=3.5,
        core_displacement_mm=4.5
    )
    out = engine.calculate(inp)
    assert out.lvdt_output_voltage_mv == 225.0
    assert 0.0 < out.peak_overshoot_percent < 50.0
    assert out.settling_time_ts_sec > 0.0


def test_applied_digital_electronics_555():
    engine = AppliedDigitalElectronicsEngine()
    inp = AppliedDigitalElectronicsInput(
        circuit_mode="timer_555_astable",
        timing_resistor_ra_kohm=10.0,
        timing_resistor_rb_kohm=47.0,
        timing_capacitor_c_uf=0.1
    )
    out = engine.calculate(inp)
    assert out.oscillation_frequency_hz > 0.0
    assert 50.0 < out.duty_cycle_percent < 100.0


def test_electrical_cad_drawing_substation():
    engine = ElectricalCadDrawingEngine()
    inp = ElectricalCadDrawingInput(
        drawing_topic="substation_33_11kv_sld",
        substation_mva_base=10.0,
        transformer_impedance_pct=8.5,
        winding_slots=36,
        winding_poles=4,
        winding_phases=3
    )
    out = engine.calculate(inp)
    assert out.short_circuit_fault_mva > 100.0
    assert out.slots_per_pole_per_phase_q == 3.0
    assert 0.0 < out.winding_distribution_factor_kd <= 1.0


def test_power_plant_engineering_hydro():
    engine = PowerPlantEngineeringEngine()
    inp = PowerPlantEngineeringInput(
        plant_type="hydro_power_plant",
        water_flow_rate_q_m3_s=25.0,
        gross_head_h_m=85.0,
        turbine_generator_efficiency=0.88,
        connected_peak_load_mw=50.0,
        annual_energy_generated_mwh=262800.0
    )
    out = engine.calculate(inp)
    assert out.hydro_electrical_power_mw > 15.0
    assert out.annual_load_factor_percent > 50.0


def test_electrical_maintenance_oil_bdv():
    engine = ElectricalMaintenancePracticeEngine()
    inp = ElectricalMaintenancePracticeInput(
        maintenance_procedure="transformer_oil_bdv_test",
        oil_bdv_breakdown_kv=42.0,
        motor_rated_kv=0.415,
        motor_hp_rating=25.0
    )
    out = engine.calculate(inp)
    assert out.is_safe_for_energization is True
    assert "GOOD" in out.oil_dielectric_health_grade
    assert out.recommended_min_insulation_mohm == 1.415 or out.recommended_min_insulation_mohm == 1.41 or out.recommended_min_insulation_mohm == 1.42
