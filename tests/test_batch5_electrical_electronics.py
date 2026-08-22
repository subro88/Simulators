"""
Unit Tests for Batch 5: Electrical & Electronics Engineering Suite (22 Tools)
=============================================================================
Validates DC/AC circuits, electrical machines, semiconductor electronics, digital logic, and control systems.
"""

import math
import pytest
from app.simulation import (
    OhmsLawEngine, OhmsLawInput,
    KirchhoffsLawsEngine, KirchhoffsLawsInput,
    RlcCircuitEngine, RlcCircuitInput,
    ThreePhaseCircuitEngine, ThreePhaseCircuitInput,
    TransformerEngine, TransformerInput,
    DcMotorEngine, DcMotorInput,
    InductionMotorEngine, InductionMotorInput,
    SynchronousMachineEngine, SynchronousMachineInput,
    DiodeCharacteristicsEngine, DiodeCharacteristicsInput,
    RectifierCircuitEngine, RectifierCircuitInput,
    BjtTransistorEngine, BjtTransistorInput,
    MosfetTransistorEngine, MosfetTransistorInput,
    OpAmpEngine, OpAmpInput,
    LogicGatesEngine, LogicGatesInput,
    CombinationalLogicEngine, CombinationalLogicInput,
    SequentialLogicEngine, SequentialLogicInput,
    Timer555Engine, Timer555Input,
    PowerElectronicsEngine, PowerElectronicsInput,
    SolarPvCellEngine, SolarPvCellInput,
    BatteryStorageEngine, BatteryStorageInput,
    ControlSystemPidEngine, ControlSystemPidInput,
    SignalProcessingFilterEngine, SignalProcessingFilterInput
)


def test_ohms_law():
    engine = OhmsLawEngine()
    inp = OhmsLawInput(supply_voltage_v=12.0, resistor_1_ohms=100.0, resistor_2_ohms=200.0, connection_mode="series")
    out = engine.calculate(inp)
    assert out.equivalent_resistance_ohms == 300.0
    assert out.circuit_current_amperes == pytest.approx(0.04, rel=1e-3)
    assert out.total_power_watts == pytest.approx(0.48, rel=1e-3)


def test_kirchhoffs_laws_bridge():
    engine = KirchhoffsLawsEngine()
    inp = KirchhoffsLawsInput(source_voltage_v=10.0, r1_ohms=100.0, r2_ohms=200.0, r3_ohms=150.0, r4_ohms=300.0)
    out = engine.calculate(inp)
    assert out.is_bridge_balanced is True
    assert out.galvanometer_current_ma == pytest.approx(0.0, abs=1e-3)


def test_rlc_resonance():
    engine = RlcCircuitEngine()
    inp = RlcCircuitInput(circuit_type="series", supply_voltage_rms=230.0, supply_frequency_hz=50.0)
    out = engine.calculate(inp)
    assert out.impedance_ohms > 0.0
    assert out.real_power_watts > 0.0
    assert out.resonant_frequency_hz > 0.0


def test_three_phase_star_delta():
    engine = ThreePhaseCircuitEngine()
    inp_star = ThreePhaseCircuitInput(connection_type="star_wye", line_voltage_v=415.0, phase_impedance_ohms=15.0)
    out_star = engine.calculate(inp_star)
    assert out_star.phase_voltage_v == pytest.approx(415.0 / math.sqrt(3.0), rel=1e-2)

    inp_delta = ThreePhaseCircuitInput(connection_type="delta", line_voltage_v=415.0, phase_impedance_ohms=15.0)
    out_delta = engine.calculate(inp_delta)
    assert out_delta.phase_voltage_v == 415.0
    assert out_delta.total_real_power_kw > out_star.total_real_power_kw


def test_transformer_losses():
    engine = TransformerEngine()
    inp = TransformerInput(primary_voltage_v=2300.0, turns_ratio_n1_n2=10.0, load_kva=50.0)
    out = engine.calculate(inp)
    assert out.secondary_voltage_v == 230.0
    assert out.efficiency_pct > 95.0


def test_dc_motor_shunt():
    engine = DcMotorEngine()
    inp = DcMotorInput(motor_type="shunt", terminal_voltage_v=220.0, applied_load_torque_nm=45.0)
    out = engine.calculate(inp)
    assert out.back_emf_volts > 200.0
    assert out.motor_speed_rpm > 1000.0
    assert out.efficiency_pct > 80.0


def test_induction_motor_slip():
    engine = InductionMotorEngine()
    inp = InductionMotorInput(num_poles=4, supply_frequency_hz=50.0, operating_slip_pct=4.0)
    out = engine.calculate(inp)
    assert out.synchronous_speed_rpm == 1500.0
    assert out.rotor_speed_rpm == 1440.0
    assert out.electromagnetic_torque_nm > 0.0


def test_synchronous_machine_vcurve():
    engine = SynchronousMachineEngine()
    inp = SynchronousMachineInput(terminal_voltage_v=415.0, field_excitation_current_a=15.0, power_angle_deg=30.0)
    out = engine.calculate(inp)
    assert out.excitation_emf_v > 400.0
    assert out.generated_real_power_kw > 0.0


def test_diode_zener_regulator():
    engine = DiodeCharacteristicsEngine()
    inp = DiodeCharacteristicsInput(diode_type="zener_regulator", input_voltage_v=12.0, zener_voltage_v=5.1)
    out = engine.calculate(inp)
    assert out.load_voltage_v == 5.1
    assert "Zener Breakdown" in out.operating_state


def test_rectifier_bridge_filter():
    engine = RectifierCircuitEngine()
    inp = RectifierCircuitInput(rectifier_type="full_wave_bridge", ac_input_voltage_rms=12.0, filter_capacitance_uf=1000.0)
    out = engine.calculate(inp)
    assert out.dc_output_voltage_v > 12.0
    assert out.ripple_factor < 0.1


def test_bjt_amplifier_qpoint():
    engine = BjtTransistorEngine()
    inp = BjtTransistorInput(vcc_supply_volts=12.0, beta_current_gain=100.0, base_resistor_rb_kohm=220.0)
    out = engine.calculate(inp)
    assert 0.0 < out.collector_emitter_vce_volts < 12.0
    assert "Active" in out.operating_region


def test_mosfet_ohmic_saturation():
    engine = MosfetTransistorEngine()
    inp = MosfetTransistorInput(gate_source_voltage_vgs=10.0, drain_supply_voltage_vdd=12.0, threshold_voltage_vth=2.5)
    out = engine.calculate(inp)
    assert out.drain_current_a > 0.0
    assert "Region" in out.operating_region


def test_op_amp_inverting():
    engine = OpAmpEngine()
    inp = OpAmpInput(topology="inverting", input_voltage_v=1.0, input_resistor_rin_kohm=10.0, feedback_resistor_rf_kohm=100.0)
    out = engine.calculate(inp)
    assert out.voltage_gain_av == -10.0
    assert out.actual_vout_volts == -10.0


def test_logic_gates_truth_table():
    engine = LogicGatesEngine()
    inp_and = LogicGatesInput(gate_type="and", input_a=True, input_b=True)
    out_and = engine.calculate(inp_and)
    assert out_and.output_y is True

    inp_xor = LogicGatesInput(gate_type="xor", input_a=True, input_b=True)
    out_xor = engine.calculate(inp_xor)
    assert out_xor.output_y is False


def test_combinational_full_adder():
    engine = CombinationalLogicEngine()
    inp = CombinationalLogicInput(circuit_type="full_adder", input_a=True, input_b=True, input_c=False)
    out = engine.calculate(inp)
    assert out.output_1_value is False  # Sum = 0
    assert out.output_2_value is True   # Carry = 1


def test_sequential_jk_flip_flop():
    engine = SequentialLogicEngine()
    inp = SequentialLogicInput(flip_flop_type="jk_ff", current_state_q=False, input_j_or_d_or_t=True, input_k=True)
    out = engine.calculate(inp)
    assert out.next_state_q is True  # toggled from 0 to 1


def test_timer_555_astable():
    engine = Timer555Engine()
    inp = Timer555Input(timer_mode="astable", resistor_r1_kohm=10.0, resistor_r2_kohm=47.0, timing_capacitor_uf=10.0)
    out = engine.calculate(inp)
    assert out.frequency_hz > 0.0
    assert 50.0 < out.duty_cycle_pct < 100.0


def test_power_electronics_buck():
    engine = PowerElectronicsEngine()
    inp = PowerElectronicsInput(converter_type="buck_step_down", input_voltage_v=24.0, duty_cycle_fraction=0.5)
    out = engine.calculate(inp)
    assert out.output_voltage_v == 12.0
    assert out.conversion_efficiency_pct > 85.0


def test_solar_pv_mppt():
    engine = SolarPvCellEngine()
    inp = SolarPvCellInput(solar_irradiance_w_m2=1000.0, panel_temperature_c=25.0)
    out = engine.calculate(inp)
    assert out.max_power_output_watts > 200.0
    assert out.fill_factor_pct > 70.0


def test_battery_storage_soc():
    engine = BatteryStorageEngine()
    inp = BatteryStorageInput(chemistry_type="li_ion", nominal_capacity_ah=100.0, state_of_charge_pct=80.0, discharge_current_a=20.0)
    out = engine.calculate(inp)
    assert out.terminal_voltage_vt > 40.0
    assert out.estimated_run_time_hours == 4.0


def test_control_system_pid_step():
    engine = ControlSystemPidEngine()
    inp = ControlSystemPidInput(kp_gain=4.5, ki_gain=1.2, kd_gain=0.8)
    out = engine.calculate(inp)
    assert out.natural_frequency_rad_s > 2.0
    assert out.settling_time_sec > 0.0


def test_signal_processing_filter_bode():
    engine = SignalProcessingFilterEngine()
    inp = SignalProcessingFilterInput(filter_type="low_pass", resistance_kohm=10.0, capacitance_nfarad=15.9, test_frequency_hz=1000.0)
    out = engine.calculate(inp)
    assert out.cutoff_frequency_hz == pytest.approx(1000.0, rel=5e-2)
    assert out.gain_decibels_db == pytest.approx(-3.01, rel=1e-1)
