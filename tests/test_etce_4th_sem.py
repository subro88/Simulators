"""
Unit Tests for WBSCTE Electronics & Telecommunication Engineering (ETCE) 4th Semester Physics Engines
======================================================================================================
Validates:
1. AMFMModulationDemodulationEngine
2. SuperheterodyneRadioReceiverEngine
3. PulseCodeModulationSamplingEngine
4. FeedbackAmplifiersTopologiesEngine
5. RCLCCrystalOscillatorsEngine
6. SchmittTriggerComparatorsEngine
7. IC555MultivibratorsEngine
8. AudioCrossoverLoudspeakersEngine
9. ColorTVCompositeVideoEngine
10. Intel8085MicroprocessorSimulatorEngine
11. MicroprocessorMemoryInterfacingEngine
12. PPI8255InterfacingIOEngine
"""

import pytest
from app.simulation.etce_4th_sem_suite import (
    AMFMModulationDemodulationEngine, AMFMModulationDemodulationInput,
    SuperheterodyneRadioReceiverEngine, SuperheterodyneRadioReceiverInput,
    PulseCodeModulationSamplingEngine, PulseCodeModulationSamplingInput,
    FeedbackAmplifiersTopologiesEngine, FeedbackAmplifiersTopologiesInput,
    RCLCCrystalOscillatorsEngine, RCLCCrystalOscillatorsInput,
    SchmittTriggerComparatorsEngine, SchmittTriggerComparatorsInput,
    IC555MultivibratorsEngine, IC555MultivibratorsInput,
    AudioCrossoverLoudspeakersEngine, AudioCrossoverLoudspeakersInput,
    ColorTVCompositeVideoEngine, ColorTVCompositeVideoInput,
    Intel8085MicroprocessorSimulatorEngine, Intel8085MicroprocessorSimulatorInput,
    MicroprocessorMemoryInterfacingEngine, MicroprocessorMemoryInterfacingInput,
    PPI8255InterfacingIOEngine, PPI8255InterfacingIOInput,
)


def test_am_fm_modulation():
    engine = AMFMModulationDemodulationEngine()
    inp = AMFMModulationDemodulationInput(
        modulation_type="Amplitude Modulation (AM)",
        carrier_freq_khz=1000.0,
        modulating_freq_khz=5.0,
        carrier_voltage_vc=10.0,
        modulating_voltage_vm=6.0
    )
    out = engine.calculate(inp)
    assert out.modulation_index == 0.6
    assert out.transmission_bandwidth_khz == 10.0
    assert out.total_transmitted_power_w > out.carrier_power_w
    assert out.upper_sideband_freq_khz == 1005.0


def test_superheterodyne_radio_receiver():
    engine = SuperheterodyneRadioReceiverEngine()
    inp = SuperheterodyneRadioReceiverInput(
        signal_frequency_fs_khz=1200.0,
        intermediate_frequency_if_khz=455.0,
        rf_stage_q_factor=80.0
    )
    out = engine.calculate(inp)
    assert out.local_oscillator_frequency_khz == 1655.0
    assert out.image_frequency_khz == 2110.0
    assert out.image_rejection_ratio_db > 35.0


def test_pulse_code_modulation_sampling():
    engine = PulseCodeModulationSamplingEngine()
    inp = PulseCodeModulationSamplingInput(
        message_bandwidth_fm_khz=4.0,
        sampling_frequency_fs_khz=8.0,
        quantizer_resolution_bits=8
    )
    out = engine.calculate(inp)
    assert out.nyquist_rate_khz == 8.0
    assert "CRITICAL" in out.sampling_condition_status
    assert out.bit_transmission_rate_kbps == 64.0
    assert out.signal_to_quantization_noise_sqnr_db > 49.0


def test_feedback_amplifiers_topologies():
    engine = FeedbackAmplifiersTopologiesEngine()
    inp = FeedbackAmplifiersTopologiesInput(
        topology="Voltage-Series (Non-Inverting)",
        open_loop_gain_a=1000.0,
        feedback_factor_beta=0.01,
        open_loop_bandwidth_khz=20.0
    )
    out = engine.calculate(inp)
    assert out.desensitivity_factor_d == 11.0
    assert abs(out.closed_loop_gain_af - 90.91) < 0.1
    assert out.closed_loop_bandwidth_khz == 220.0
    assert out.closed_loop_input_impedance_kohm == 110.0


def test_rc_lc_crystal_oscillators():
    engine = RCLCCrystalOscillatorsEngine()
    inp = RCLCCrystalOscillatorsInput(
        oscillator_type="Wien Bridge Oscillator",
        resistance_r_kohm=15.915,
        capacitance_c_nf=10.0
    )
    out = engine.calculate(inp)
    assert abs(out.oscillation_frequency_khz - 1.0) < 0.05
    assert out.minimum_amplifier_gain_required == 3.0


def test_schmitt_trigger_comparators():
    engine = SchmittTriggerComparatorsEngine()
    inp = SchmittTriggerComparatorsInput(
        circuit_type="Inverting Schmitt Trigger",
        supply_vcc_v=15.0,
        feedback_resistor_r2_kohm=100.0,
        input_resistor_r1_kohm=10.0
    )
    out = engine.calculate(inp)
    assert out.upper_threshold_voltage_utp_v > 0.0
    assert out.lower_threshold_voltage_ltp_v < 0.0
    assert out.hysteresis_voltage_vh_v > 2.0


def test_ic555_multivibrators():
    engine = IC555MultivibratorsEngine()
    inp = IC555MultivibratorsInput(
        mode="Astable Multivibrator (Free Running)",
        resistor_ra_kohm=10.0,
        resistor_rb_kohm=4.7,
        timing_cap_c_uf=0.1
    )
    out = engine.calculate(inp)
    assert 700.0 < out.output_frequency_hz < 800.0
    assert 70.0 < out.duty_cycle_pct < 80.0


def test_audio_crossover_loudspeakers():
    engine = AudioCrossoverLoudspeakersEngine()
    inp = AudioCrossoverLoudspeakersInput(
        crossover_order="2nd-Order Butterworth 12dB/octave",
        crossover_frequency_fc_hz=2500.0,
        speaker_impedance_z_ohm=8.0
    )
    out = engine.calculate(inp)
    assert out.low_pass_woofer_inductor_mh > 0.5
    assert out.high_pass_tweeter_capacitor_uf > 5.0
    assert out.attenuation_slope_db_octave == 12.0


def test_color_tv_composite_video():
    engine = ColorTVCompositeVideoEngine()
    inp = ColorTVCompositeVideoInput(
        system_standard="PAL 625-Line 50Hz (India)",
        red_channel_r=1.0,
        green_channel_g=1.0,
        blue_channel_b=0.0
    )
    out = engine.calculate(inp)
    assert abs(out.luminance_y_voltage - 0.89) < 0.02
    assert out.line_frequency_khz == 15.625
    assert out.color_subcarrier_frequency_mhz == 4.433619


def test_intel8085_microprocessor_simulator():
    engine = Intel8085MicroprocessorSimulatorEngine()
    inp = Intel8085MicroprocessorSimulatorInput(
        instruction_mnemonic="ADD B",
        initial_reg_a=0x18,
        initial_reg_b=0x24
    )
    out = engine.calculate(inp)
    assert out.opcode_hex == "80"
    assert out.final_reg_a_hex == "3CH"
    assert out.t_states_count == 4
    assert out.flag_carry_cy == 0


def test_microprocessor_memory_interfacing():
    engine = MicroprocessorMemoryInterfacingEngine()
    inp = MicroprocessorMemoryInterfacingInput(
        decoder_type="74LS138 3-to-8 Decoder",
        ram_size_kb=2,
        eprom_size_kb=2
    )
    out = engine.calculate(inp)
    assert "0000H" in out.eprom_address_range
    assert "2000H" in out.ram_address_range
    assert not out.foldback_mirror_detected


def test_ppi_8255_interfacing_io():
    engine = PPI8255InterfacingIOEngine()
    inp = PPI8255InterfacingIOInput(
        control_word_hex="98H",
        port_a_mode="Mode 0 Basic Input"
    )
    out = engine.calculate(inp)
    assert out.port_a_direction == "INPUT"
    assert not out.bsr_bit_mode_active
    assert "10011000" in out.control_word_binary
