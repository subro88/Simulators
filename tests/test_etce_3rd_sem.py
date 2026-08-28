"""
Unit Tests for WBSCTE Electronics & Telecommunication Engineering (ETCE) 3rd Semester Physics Engines
======================================================================================================
Validates:
1. TwoPortNetworksAttenuatorsEngine
2. PassiveFiltersConstantKMDerivedEngine
3. RLCTransientResponseEngine
4. DiodeRectifiersFiltersClippersEngine
5. BJTBiasingStabilityFactorsEngine
6. FETMOSFETCharacteristicsEngine
7. KMapBooleanMinimizationEngine
8. MultiplexerDemuxDecoderICEngine
9. FlipFlopsCountersRegistersEngine
10. DACADCConvertersEngine
11. TransformerEquivalentCircuitRegulationEngine
12. DCGeneratorCharacteristicsEMFEngine
"""

import pytest
from app.simulation.etce_3rd_sem_suite import (
    TwoPortNetworksAttenuatorsEngine, TwoPortNetworksAttenuatorsInput,
    PassiveFiltersConstantKMDerivedEngine, PassiveFiltersConstantKMDerivedInput,
    RLCTransientResponseEngine, RLCTransientResponseInput,
    DiodeRectifiersFiltersClippersEngine, DiodeRectifiersFiltersClippersInput,
    BJTBiasingStabilityFactorsEngine, BJTBiasingStabilityFactorsInput,
    FETMOSFETCharacteristicsEngine, FETMOSFETCharacteristicsInput,
    KMapBooleanMinimizationEngine, KMapBooleanMinimizationInput,
    MultiplexerDemuxDecoderICEngine, MultiplexerDemuxDecoderICInput,
    FlipFlopsCountersRegistersEngine, FlipFlopsCountersRegistersInput,
    DACADCConvertersEngine, DACADCConvertersInput,
    TransformerEquivalentCircuitRegulationEngine, TransformerEquivalentCircuitRegulationInput,
    DCGeneratorCharacteristicsEMFEngine, DCGeneratorCharacteristicsEMFInput,
)


def test_two_port_networks_attenuators():
    engine = TwoPortNetworksAttenuatorsEngine()
    inp = TwoPortNetworksAttenuatorsInput(
        z11_ohm=50.0,
        z12_ohm=20.0,
        z21_ohm=20.0,
        z22_ohm=40.0,
        attenuation_db=10.0,
        characteristic_impedance_z0_ohm=600.0
    )
    out = engine.calculate(inp)
    assert out.determinant_delta_z == 1600.0  # 50*40 - 20*20 = 1600
    assert out.voltage_attenuation_ratio_n > 3.0
    assert out.attenuator_series_resistor_ohm > 0.0
    assert out.attenuator_shunt_resistor_ohm > 0.0


def test_passive_filters_constant_k_m_derived():
    engine = PassiveFiltersConstantKMDerivedEngine()
    inp = PassiveFiltersConstantKMDerivedInput(
        filter_type="Constant-k Low Pass Filter (LPF)",
        cutoff_frequency_fc_khz=5.0,
        design_impedance_r0_ohm=600.0,
        operating_frequency_f_khz=6.5
    )
    out = engine.calculate(inp)
    assert out.series_inductance_l_mh > 0.0
    assert out.shunt_capacitance_c_uf > 0.0
    assert out.attenuation_constant_db > 0.0
    assert "STOP BAND" in out.filter_operating_region


def test_rlc_transient_response():
    engine = RLCTransientResponseEngine()
    inp = RLCTransientResponseInput(
        circuit_type="Series RLC DC Step Excitation",
        supply_voltage_v=10.0,
        resistance_r_ohm=50.0,
        inductance_l_mh=100.0,
        capacitance_c_uf=10.0,
        time_instant_t_ms=2.0
    )
    out = engine.calculate(inp)
    assert out.damping_ratio_zeta < 1.0
    assert "UNDERDAMPED" in out.damping_classification
    assert out.instantaneous_capacitor_voltage_v > 0.0


def test_diode_rectifiers_filters_clippers():
    engine = DiodeRectifiersFiltersClippersEngine()
    inp = DiodeRectifiersFiltersClippersInput(
        rectifier_type="Full-Wave Bridge Rectifier",
        ac_input_vrms_v=12.0,
        filter_capacitance_c_uf=1000.0,
        load_resistance_rl_ohm=100.0
    )
    out = engine.calculate(inp)
    assert out.peak_ac_voltage_vm_v > 16.0
    assert out.dc_output_voltage_vdc_v > 14.0
    assert out.ripple_factor_pct < 5.0
    assert out.rectification_efficiency_pct == 81.2


def test_bjt_biasing_stability_factors():
    engine = BJTBiasingStabilityFactorsEngine()
    inp = BJTBiasingStabilityFactorsInput(
        bias_type="Voltage Divider Bias (Self-Bias)",
        supply_vcc_v=12.0,
        transistor_beta=100.0
    )
    out = engine.calculate(inp)
    assert out.quiescent_base_current_ib_ua > 0.0
    assert out.quiescent_collector_current_ic_ma > 0.0
    assert out.stability_factor_s < 20.0
    assert "ACTIVE" in out.operating_q_point_status


def test_fet_mosfet_characteristics():
    engine = FETMOSFETCharacteristicsEngine()
    inp = FETMOSFETCharacteristicsInput(
        fet_type="N-Channel JFET",
        drain_source_voltage_vds=10.0,
        gate_source_voltage_vgs=-1.5,
        drain_saturation_current_idss_ma=10.0,
        pinch_off_voltage_vp_v=-4.0
    )
    out = engine.calculate(inp)
    assert out.drain_current_id_ma > 0.0
    assert out.transconductance_gm_ms > 0.0
    assert "SATURATION" in out.operating_region


def test_kmap_boolean_minimization():
    engine = KMapBooleanMinimizationEngine()
    inp = KMapBooleanMinimizationInput(
        variable_count=4,
        minterm_indices="0, 2, 5, 7, 8, 10, 13, 15"
    )
    out = engine.calculate(inp)
    assert "XNOR" in out.minimized_boolean_expression or "B" in out.minimized_boolean_expression
    assert out.prime_implicants_count == 2
    assert "HAZARD FREE" in out.hazard_free_status


def test_multiplexer_demux_decoder_ic():
    engine = MultiplexerDemuxDecoderICEngine()
    inp = MultiplexerDemuxDecoderICInput(
        ic_type="8:1 MUX (IC 74151)",
        select_line_s2=1,
        select_line_s1=0,
        select_line_s0=1,
        data_inputs_byte=181
    )
    out = engine.calculate(inp)
    assert out.active_channel_index == 5
    assert out.output_logic_y in (0, 1)
    assert out.complementary_output_w == 1 - out.output_logic_y


def test_flipflops_counters_registers():
    engine = FlipFlopsCountersRegistersEngine()
    inp = FlipFlopsCountersRegistersInput(
        module_type="4-Bit Synchronous Up Counter",
        clock_frequency_khz=10.0,
        preset_count_val=9
    )
    out = engine.calculate(inp)
    assert out.next_state_decimal_value == 10
    assert out.next_state_binary_string == "1010"
    assert out.stage_output_frequency_khz == 0.625


def test_dac_adc_converters():
    engine = DACADCConvertersEngine()
    inp = DACADCConvertersInput(
        converter_type="8-Bit R-2R Ladder DAC",
        reference_voltage_vref=5.0,
        digital_input_code_byte=170
    )
    out = engine.calculate(inp)
    assert abs(out.analog_output_voltage_v - 3.32) < 0.05
    assert out.quantization_step_size_lsb_mv > 0.0
    assert out.digital_output_code_binary == "10101010"


def test_transformer_equivalent_circuit_regulation():
    engine = TransformerEquivalentCircuitRegulationEngine()
    inp = TransformerEquivalentCircuitRegulationInput(
        rated_power_kva=25.0,
        primary_voltage_v1=2200.0,
        secondary_voltage_v2=220.0
    )
    out = engine.calculate(inp)
    assert out.transformation_ratio_k == 0.1
    assert out.rated_secondary_current_a > 100.0
    assert 1.0 < out.voltage_regulation_pct < 10.0
    assert 90.0 < out.transformer_efficiency_pct < 99.0


def test_dc_generator_characteristics_emf():
    engine = DCGeneratorCharacteristicsEMFEngine()
    inp = DCGeneratorCharacteristicsEMFInput(
        generator_type="DC Shunt Generator",
        rated_terminal_voltage_v=220.0,
        field_resistance_rf_ohm=110.0,
        armature_resistance_ra_ohm=0.25,
        load_current_il_a=40.0
    )
    out = engine.calculate(inp)
    assert out.field_current_if_a == 2.0
    assert out.armature_current_ia_a == 42.0
    assert out.generated_emf_eg_v > out.actual_terminal_voltage_v
    assert 70.0 < out.generator_efficiency_pct < 98.0
