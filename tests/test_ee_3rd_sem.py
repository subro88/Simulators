"""
Unit Tests for WBSCTE Electrical Engineering 3rd Semester Simulation Suite
==========================================================================
Validates CircuitTheoryEngine, ElectricalMeasurementsEngine, BasicElectronicsEEEngine,
CProgrammingEEEngine, ElectricalWiringWorkshopEngine, and ElementsMechanicalEEEngine.
"""

import pytest
from app.simulation import (
    CircuitTheoryEngine, CircuitTheoryInput,
    ElectricalMeasurementsEngine, ElectricalMeasurementsInput,
    BasicElectronicsEEEngine, BasicElectronicsEEInput,
    CProgrammingEEEngine, CProgrammingEEInput,
    ElectricalWiringWorkshopEngine, ElectricalWiringWorkshopInput,
    ElementsMechanicalEEEngine, ElementsMechanicalEEInput,
)


def test_circuit_theory_resonance():
    engine = CircuitTheoryEngine()
    inp = CircuitTheoryInput(
        analysis_mode="rlc_series_resonance",
        series_resistance_r=10.0,
        series_inductance_l_mh=50.0,
        series_capacitance_c_uf=10.0
    )
    out = engine.calculate(inp)
    assert out.resonant_frequency_fr_hz > 200.0
    assert out.quality_factor_q > 0.0
    assert out.maximum_power_pmax_w == 12.0


def test_electrical_measurements_wattmeter():
    engine = ElectricalMeasurementsEngine()
    inp = ElectricalMeasurementsInput(
        instrument_mode="two_wattmeter_3phase",
        wattmeter_w1_w=1200.0,
        wattmeter_w2_w=400.0
    )
    out = engine.calculate(inp)
    assert out.total_3phase_power_w == 1600.0
    assert 0.0 < out.power_factor_cos_phi <= 1.0


def test_basic_electronics_zener():
    engine = BasicElectronicsEEEngine()
    inp = BasicElectronicsEEInput(
        circuit_mode="zener_regulator",
        input_dc_voltage_vin=18.0,
        zener_breakdown_vz=10.0,
        series_resistor_rs=220.0,
        load_resistor_rl=1000.0
    )
    out = engine.calculate(inp)
    assert out.regulated_output_voltage_vout == 10.0
    assert out.zener_current_iz_ma > 0.0


def test_c_programming_ee_mesh():
    engine = CProgrammingEEEngine()
    inp = CProgrammingEEInput(
        simulation_task="mesh_current_solver",
        voltage_v1=20.0,
        voltage_v2=10.0,
        resistor_r1=5.0,
        resistor_r2=10.0,
        resistor_r3_common=2.0
    )
    out = engine.calculate(inp)
    assert out.matrix_determinant_delta > 0.0
    assert "main()" in out.c_source_code_snippet


def test_electrical_wiring_staircase():
    engine = ElectricalWiringWorkshopEngine()
    inp = ElectricalWiringWorkshopInput(
        wiring_scheme="staircase_wiring",
        switch_1_state="position_a",
        switch_2_state="position_a"
    )
    out = engine.calculate(inp)
    assert out.lamp_illuminated is True
    assert out.earth_electrode_resistance_ohm > 0.0


def test_elements_mechanical_engine():
    engine = ElementsMechanicalEEEngine()
    inp = ElementsMechanicalEEInput(
        mechanical_system="four_stroke_engine",
        engine_speed_rpm=1500.0,
        brake_torque_nm=45.0
    )
    out = engine.calculate(inp)
    assert out.indicated_power_ip_kw > 0.0
    assert out.brake_power_bp_kw > 0.0
    assert out.mechanical_efficiency_pct > 0.0
