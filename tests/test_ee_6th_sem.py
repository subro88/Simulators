"""
Unit Tests for WBSCTE Electrical Engineering 6th Semester Simulation Suite
==========================================================================
Validates ElectricalDesignEstimationEngine, ElectricalInstallationTestingEngine,
ElectricalWorkshop2Engine, IndustrialAutomationPLCEngine, ProcessControlInstrumentationEngine,
and ControlElectricalMachinesEngine.
"""

import pytest
from app.simulation import (
    ElectricalDesignEstimationEngine, ElectricalDesignEstimationInput,
    ElectricalInstallationTestingEngine, ElectricalInstallationTestingInput,
    ElectricalWorkshop2Engine, ElectricalWorkshop2Input,
    IndustrialAutomationPLCEngine, IndustrialAutomationPLCInput,
    ProcessControlInstrumentationEngine, ProcessControlInstrumentationInput,
    ControlElectricalMachinesEngine, ControlElectricalMachinesInput,
)


def test_electrical_design_estimation():
    engine = ElectricalDesignEstimationEngine()
    inp = ElectricalDesignEstimationInput(
        installation_type="industrial_motor_feeder",
        load_power_kw=37.0,
        supply_voltage_v=415.0,
        power_factor=0.85,
        efficiency=0.90,
        cable_run_length_m=80.0,
        cable_core_material="aluminum"
    )
    out = engine.calculate(inp)
    assert out.full_load_current_a > 50.0
    assert out.recommended_cable_csa_sqmm >= 35.0
    assert out.percentage_voltage_drop > 0.0
    assert out.recommended_mcb_mccb_rating_a >= 80


def test_electrical_installation_testing():
    engine = ElectricalInstallationTestingEngine()
    inp = ElectricalInstallationTestingInput(
        test_procedure="transformer_heat_run_sumpner",
        iron_loss_wi_watts=450.0,
        copper_loss_wc_watts=850.0,
        tank_cooling_surface_sqm=12.5,
        earth_tester_voltage_v=4.5,
        earth_tester_current_a=6.5
    )
    out = engine.calculate(inp)
    assert out.total_losses_watts == 1300.0
    assert 0.0 < out.max_steady_temp_rise_c < 40.0
    assert out.measured_earth_resistance_ohms < 1.0


def test_electrical_workshop_2_rewinding():
    engine = ElectricalWorkshop2Engine()
    inp = ElectricalWorkshop2Input(
        workshop_task="motor_stator_rewinding",
        motor_hp_rating=5.0,
        stator_slots=36,
        number_of_poles=4,
        coil_span_slots=8,
        wire_swg_gauge=21
    )
    out = engine.calculate(inp)
    assert out.slots_per_pole == 9.0
    assert out.electrical_slot_angle_deg == 20.0
    assert 0.90 < out.coil_pitch_factor_kp < 1.0
    assert out.estimated_total_wire_kg > 0.0


def test_industrial_automation_plc():
    engine = IndustrialAutomationPLCEngine()
    inp = IndustrialAutomationPLCInput(
        plc_mode="ladder_logic_latch",
        start_pushbutton_i0_0=True,
        stop_pushbutton_i0_1=False,
        overload_trip_i0_2=False,
        timer_preset_pt_sec=5.0,
        current_time_elapsed_et_sec=6.0
    )
    out = engine.calculate(inp)
    assert out.motor_contactor_q0_0 is True
    assert out.timer_done_bit_dn is True
    assert out.scada_hmi_status_color == "#10b981"


def test_process_control_instrumentation():
    engine = ProcessControlInstrumentationEngine()
    inp = ProcessControlInstrumentationInput(
        loop_type="transmitter_4_20ma_calibration",
        measured_pressure_bar=6.5,
        pressure_range_max_bar=10.0,
        liquid_flow_q_gpm=85.0,
        valve_pressure_drop_psi=15.0
    )
    out = engine.calculate(inp)
    assert 14.0 < out.transmitter_current_ma < 15.0
    assert out.percentage_process_variable == 65.0
    assert out.required_valve_cv > 20.0


def test_control_electrical_machines():
    engine = ControlElectricalMachinesEngine()
    inp = ControlElectricalMachinesInput(
        starter_scheme="star_delta_automatic",
        motor_rated_power_kw=22.0,
        supply_voltage_v=415.0,
        transition_timer_sec=6.0,
        current_operating_time_s=4.0
    )
    out = engine.calculate(inp)
    assert "STAR" in out.active_connection_mode
    assert out.starting_torque_percent == 33.3
    assert out.star_current_reduction_ratio == 0.333
