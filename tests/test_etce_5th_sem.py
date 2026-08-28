"""
Unit Tests for WBSCTE Electronics & Telecommunication Engineering (ETCE) 5th Semester Physics Engines
======================================================================================================
Validates:
1. DigitalModulationASKPSKQAMEngine
2. RectangularWaveguideModesEngine
3. ReflexKlystronMagnetronEngine
4. RadarRangeDopplerAntennaEngine
5. MaxwellScheringACBridgesEngine
6. HeterodyneSpectrumAnalyzerEngine
7. SCRTwoTransistorCommutationEngine
8. SinglePhaseFullWaveSCRBridgeEngine
9. DCDCBuckBoostConvertersEngine
10. Microcontroller8051TimersUARTEngine
11. LCDKeypad8051InterfacingEngine
12. DSPDiscreteFourierFFTFIREngine
"""

import pytest
from app.simulation.etce_5th_sem_suite import (
    DigitalModulationASKPSKQAMEngine, DigitalModulationASKPSKQAMInput,
    RectangularWaveguideModesEngine, RectangularWaveguideModesInput,
    ReflexKlystronMagnetronEngine, ReflexKlystronMagnetronInput,
    RadarRangeDopplerAntennaEngine, RadarRangeDopplerAntennaInput,
    MaxwellScheringACBridgesEngine, MaxwellScheringACBridgesInput,
    HeterodyneSpectrumAnalyzerEngine, HeterodyneSpectrumAnalyzerInput,
    SCRTwoTransistorCommutationEngine, SCRTwoTransistorCommutationInput,
    SinglePhaseFullWaveSCRBridgeEngine, SinglePhaseFullWaveSCRBridgeInput,
    DCDCBuckBoostConvertersEngine, DCDCBuckBoostConvertersInput,
    Microcontroller8051TimersUARTEngine, Microcontroller8051TimersUARTInput,
    LCDKeypad8051InterfacingEngine, LCDKeypad8051InterfacingInput,
    DSPDiscreteFourierFFTFIREngine, DSPDiscreteFourierFFTFIRInput,
)


def test_digital_modulation_ask_psk_qam():
    engine = DigitalModulationASKPSKQAMEngine()
    inp = DigitalModulationASKPSKQAMInput(
        modulation_scheme="QPSK (Quadrature PSK)",
        bit_rate_kbps=64.0,
        snr_eb_n0_db=10.0
    )
    out = engine.calculate(inp)
    assert out.bits_per_symbol == 2
    assert out.symbol_rate_ksymbols_sec == 32.0
    assert out.spectral_efficiency_bps_hz == 2.0
    assert out.bit_error_rate_ber < 0.001


def test_rectangular_waveguide_modes():
    engine = RectangularWaveguideModesEngine()
    inp = RectangularWaveguideModesInput(
        waveguide_standard="WR-90 (X-Band: 8.2 - 12.4 GHz)",
        operating_frequency_ghz=10.0,
        waveguide_width_a_mm=22.86
    )
    out = engine.calculate(inp)
    assert abs(out.cutoff_frequency_fc_ghz - 6.56) < 0.05
    assert out.guide_wavelength_lambda_g_mm > out.free_space_wavelength_lambda_0_mm
    assert out.phase_velocity_vp_c > 1.0
    assert out.group_velocity_vg_c < 1.0


def test_reflex_klystron_magnetron():
    engine = ReflexKlystronMagnetronEngine()
    inp = ReflexKlystronMagnetronInput(
        device_type="Reflex Klystron Oscillator",
        beam_voltage_v0_v=300.0,
        repeller_voltage_vr_v=-150.0,
        cavity_resonance_ghz=9.5,
        mode_index_n=2
    )
    out = engine.calculate(inp)
    assert out.transit_time_repeller_ns > 0.0
    assert out.oscillation_output_power_mw > 0.0
    assert out.electronic_tuning_range_mhz == 32.0


def test_radar_range_doppler_antenna():
    engine = RadarRangeDopplerAntennaEngine()
    inp = RadarRangeDopplerAntennaInput(
        peak_transmitter_power_kw=25.0,
        antenna_gain_db=32.0,
        radar_cross_section_rcs_m2=5.0,
        target_radial_velocity_kmh=180.0,
        operating_freq_ghz=9.4
    )
    out = engine.calculate(inp)
    assert out.maximum_unambiguous_range_km > 10.0
    assert out.doppler_frequency_shift_hz > 3000.0
    assert "APPROACHING" in out.target_approaching_or_receding


def test_maxwell_schering_ac_bridges():
    engine = MaxwellScheringACBridgesEngine()
    inp = MaxwellScheringACBridgesInput(
        bridge_type="Maxwell's Inductance-Capacitance Bridge",
        resistor_r2_ohm=1000.0,
        resistor_r3_ohm=1000.0,
        standard_c4_uf=0.1,
        variable_r4_ohm=500.0
    )
    out = engine.calculate(inp)
    assert abs(out.measured_unknown_inductance_mh - 100.0) < 0.1
    assert out.measured_unknown_resistance_ohm == 2000.0
    assert "NULL" in out.bridge_balance_status


def test_heterodyne_spectrum_analyzer():
    engine = HeterodyneSpectrumAnalyzerEngine()
    inp = HeterodyneSpectrumAnalyzerInput(
        input_frequency_mhz=50.0,
        input_amplitude_dbm=-10.0,
        resolution_bandwidth_rbw_khz=30.0
    )
    out = engine.calculate(inp)
    assert out.displayed_average_noise_floor_danl_dbm < -100.0
    assert out.fundamental_peak_power_dbm == -10.0
    assert out.dynamic_range_db > 80.0


def test_scr_two_transistor_commutation():
    engine = SCRTwoTransistorCommutationEngine()
    inp = SCRTwoTransistorCommutationInput(
        transistor_alpha1=0.45,
        transistor_alpha2=0.50,
        gate_current_ig_ma=15.0,
        snubber_resistor_rs_ohm=22.0,
        snubber_capacitor_cs_uf=0.1,
        supply_voltage_vs_v=230.0
    )
    out = engine.calculate(inp)
    assert "LATCHED" in out.regenerative_latching_status
    assert out.maximum_dv_dt_snubber_v_us > 50.0


def test_single_phase_full_wave_scr_bridge():
    engine = SinglePhaseFullWaveSCRBridgeEngine()
    inp = SinglePhaseFullWaveSCRBridgeInput(
        firing_angle_alpha_deg=45.0,
        ac_input_vrms_v=230.0,
        load_resistance_r_ohm=10.0
    )
    out = engine.calculate(inp)
    assert 140.0 < out.average_dc_output_voltage_vdc_v < 155.0
    assert out.average_load_current_idc_a > 10.0
    assert 0.5 < out.input_power_factor < 0.8


def test_dc_dc_buck_boost_converters():
    engine = DCDCBuckBoostConvertersEngine()
    inp = DCDCBuckBoostConvertersInput(
        converter_topology="Buck Converter (Step-Down)",
        input_voltage_vin_v=24.0,
        duty_cycle_d=0.4,
        switching_frequency_khz=50.0,
        inductor_l_uh=100.0
    )
    out = engine.calculate(inp)
    assert abs(out.output_dc_voltage_vout_v - 9.6) < 0.1
    assert out.inductor_ripple_current_peak_a > 0.5
    assert "CCM" in out.conduction_mode_status


def test_microcontroller_8051_timers_uart():
    engine = Microcontroller8051TimersUARTEngine()
    inp = Microcontroller8051TimersUARTInput(
        oscillator_frequency_mhz=11.0592,
        timer_mode="Timer 1 Mode 2 (8-Bit Auto-Reload Baud Generator)",
        desired_baud_rate=9600
    )
    out = engine.calculate(inp)
    assert out.timer_reload_value_hex == "FDH"
    assert out.actual_baud_rate_generated == 9600
    assert out.baud_rate_error_pct == 0.0


def test_lcd_keypad_8051_interfacing():
    engine = LCDKeypad8051InterfacingEngine()
    inp = LCDKeypad8051InterfacingInput(
        display_text_line1="NHIT ETCE LAB",
        display_text_line2="8051 SYSTEM OK",
        keypad_key_pressed="7"
    )
    out = engine.calculate(inp)
    assert len(out.lcd_initialization_commands_hex) == 4
    assert out.keypad_scanned_code_hex == "0E7H"
    assert out.keypad_debounce_delay_ms == 20.0


def test_dsp_discrete_fourier_fft_fir():
    engine = DSPDiscreteFourierFFTFIREngine()
    inp = DSPDiscreteFourierFFTFIRInput(
        input_sequence_x="1, 2, 3, 4, 3, 2, 1, 0",
        fir_filter_cutoff_pi=0.4,
        fir_window_type="Hamming Window"
    )
    out = engine.calculate(inp)
    assert out.dft_computation_multiplications_n2 == 64
    assert out.fft_butterfly_multiplications == 12
    assert out.fft_speedup_factor > 5.0
    assert len(out.fir_filter_coefficients) == 7
