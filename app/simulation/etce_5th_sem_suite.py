"""
WBSCTE Electronics & Telecommunication Engineering (ETCE) 5th Semester Physics Engines
========================================================================================
Syllabus Mapped:
1. ETCE/DMCE/S5:  DigitalModulationASKPSKQAMEngine
2. ETCE/DMCE/S5:  RectangularWaveguideModesEngine
3. ETCE/DMCE/S5:  ReflexKlystronMagnetronEngine
4. ETCE/DMCE/S5:  RadarRangeDopplerAntennaEngine
5. ETCE/EM/S5:    MaxwellScheringACBridgesEngine
6. ETCE/EM/S5:    HeterodyneSpectrumAnalyzerEngine
7. ETCE/IE1/S5:   SCRTwoTransistorCommutationEngine
8. ETCE/IE1/S5:   SinglePhaseFullWaveSCRBridgeEngine
9. ETCE/IE1/S5:   DCDCBuckBoostConvertersEngine
10. ETCE/MCES/S5: Microcontroller8051TimersUARTEngine
11. ETCE/MCES/S5: LCDKeypad8051InterfacingEngine
12. ETCE/DSP/S5:  DSPDiscreteFourierFFTFIREngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Digital Modulation (ASK, PSK, QAM) Engine ────────────────────────────
class DigitalModulationASKPSKQAMInput(BaseModel):
    modulation_scheme: Literal["BPSK (Binary Phase Shift Keying)", "QPSK (Quadrature PSK)", "16-QAM", "Binary ASK"] = "BPSK (Binary Phase Shift Keying)"
    bit_rate_kbps: float = Field(default=64.0, ge=1.0, le=10000.0)
    carrier_freq_mhz: float = Field(default=10.0, ge=1.0, le=1000.0)
    snr_eb_n0_db: float = Field(default=10.0, ge=0.0, le=30.0)
    carrier_amplitude_v: float = Field(default=5.0, ge=1.0, le=20.0)


class DigitalModulationASKPSKQAMOutput(BaseModel):
    bits_per_symbol: int
    symbol_rate_ksymbols_sec: float
    transmission_bandwidth_khz: float
    bit_error_rate_ber: float
    spectral_efficiency_bps_hz: float
    constellation_points_count: int
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DigitalModulationASKPSKQAMEngine(BaseSimulationEngine):
    name = "digital-modulation-ask-psk-qam"
    description = "ETCE/DMCE/S5: Digital Carrier Modulation — BPSK, QPSK, 16-QAM Constellations, Symbol Rates & BER"

    def calculate(self, params: DigitalModulationASKPSKQAMInput) -> DigitalModulationASKPSKQAMOutput:
        rb = params.bit_rate_kbps
        eb_n0_lin = math.pow(10.0, params.snr_eb_n0_db / 10.0)

        if params.modulation_scheme == "BPSK (Binary Phase Shift Keying)":
            k = 1
            m_pts = 2
            ber = 0.5 * math.erfc(math.sqrt(eb_n0_lin))
            eff = 1.0
        elif params.modulation_scheme == "QPSK (Quadrature PSK)":
            k = 2
            m_pts = 4
            ber = 0.5 * math.erfc(math.sqrt(eb_n0_lin))
            eff = 2.0
        elif params.modulation_scheme == "16-QAM":
            k = 4
            m_pts = 16
            ber = (3.0 / 8.0) * math.erfc(math.sqrt(0.4 * eb_n0_lin))
            eff = 4.0
        else:  # Binary ASK
            k = 1
            m_pts = 2
            ber = 0.5 * math.erfc(math.sqrt(eb_n0_lin / 2.0))
            eff = 1.0

        rs = rb / k
        bw = 2.0 * rs

        telemetry = {
            "k": k,
            "rs_ksps": round(rs, 1),
            "bw_khz": round(bw, 1),
            "ber_sci": f"{ber:.2e}",
            "eff": eff
        }

        return DigitalModulationASKPSKQAMOutput(
            bits_per_symbol=k,
            symbol_rate_ksymbols_sec=round(rs, 2),
            transmission_bandwidth_khz=round(bw, 2),
            bit_error_rate_ber=float(f"{ber:.6e}"),
            spectral_efficiency_bps_hz=eff,
            constellation_points_count=m_pts,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "qpsk_satellite_downlink": {"modulation_scheme": "QPSK (Quadrature PSK)", "bit_rate_kbps": 2048.0, "carrier_freq_mhz": 70.0, "snr_eb_n0_db": 10.5, "carrier_amplitude_v": 5.0},
            "16qam_microwave_link": {"modulation_scheme": "16-QAM", "bit_rate_kbps": 34368.0, "carrier_freq_mhz": 140.0, "snr_eb_n0_db": 16.0, "carrier_amplitude_v": 5.0}
        }


# ── 2. Rectangular Waveguide Modes Engine ───────────────────────────────────
class RectangularWaveguideModesInput(BaseModel):
    waveguide_standard: Literal["WR-90 (X-Band: 8.2 - 12.4 GHz)", "WR-62 (Ku-Band: 12.4 - 18.0 GHz)", "WR-28 (Ka-Band: 26.5 - 40.0 GHz)"] = "WR-90 (X-Band: 8.2 - 12.4 GHz)"
    operating_frequency_ghz: float = Field(default=10.0, ge=3.0, le=50.0)
    waveguide_width_a_mm: float = Field(default=22.86, ge=5.0, le=100.0)
    waveguide_height_b_mm: float = Field(default=10.16, ge=2.0, le=50.0)


class RectangularWaveguideModesOutput(BaseModel):
    cutoff_frequency_fc_ghz: float
    guide_wavelength_lambda_g_mm: float
    free_space_wavelength_lambda_0_mm: float
    phase_velocity_vp_c: float
    group_velocity_vg_c: float
    wave_characteristic_impedance_ohm: float
    propagation_state: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RectangularWaveguideModesEngine(BaseSimulationEngine):
    name = "rectangular-waveguide-modes"
    description = "ETCE/DMCE/S5: Microwave Engineering — Rectangular Waveguide TE10 Dominant Mode, Cutoff fc, Guide Wavelength & Velocities"

    def calculate(self, params: RectangularWaveguideModesInput) -> RectangularWaveguideModesOutput:
        c = 3.0e8
        a_m = params.waveguide_width_a_mm / 1000.0
        f_hz = params.operating_frequency_ghz * 1e9

        # TE10 dominant mode cutoff fc = c / (2a)
        fc_hz = c / (2.0 * a_m)
        fc_ghz = fc_hz / 1e9
        lambda_0_mm = (c / f_hz) * 1000.0

        if f_hz > fc_hz:
            ratio = (fc_hz / f_hz) ** 2
            lambda_g_mm = lambda_0_mm / math.sqrt(1.0 - ratio)
            vp_c = 1.0 / math.sqrt(1.0 - ratio)
            vg_c = math.sqrt(1.0 - ratio)
            zte = 377.0 / math.sqrt(1.0 - ratio)
            prop = "PROPAGATING (Low-Loss TE10 Mode Active)"
        else:
            lambda_g_mm = 0.0
            vp_c = 0.0
            vg_c = 0.0
            zte = 0.0
            prop = "EVANESCENT / CUTOFF (Signal Exponentially Attenuated)"

        telemetry = {
            "fc_ghz": round(fc_ghz, 2),
            "lambda_g_mm": round(lambda_g_mm, 2),
            "vp_c": round(vp_c, 3),
            "vg_c": round(vg_c, 3),
            "zte": round(zte, 1)
        }

        return RectangularWaveguideModesOutput(
            cutoff_frequency_fc_ghz=round(fc_ghz, 2),
            guide_wavelength_lambda_g_mm=round(lambda_g_mm, 2),
            free_space_wavelength_lambda_0_mm=round(lambda_0_mm, 2),
            phase_velocity_vp_c=round(vp_c, 3),
            group_velocity_vg_c=round(vg_c, 3),
            wave_characteristic_impedance_ohm=round(zte, 1),
            propagation_state=prop,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "x_band_wr90_10ghz": {"waveguide_standard": "WR-90 (X-Band: 8.2 - 12.4 GHz)", "operating_frequency_ghz": 10.0, "waveguide_width_a_mm": 22.86, "waveguide_height_b_mm": 10.16},
            "ku_band_wr62_15ghz": {"waveguide_standard": "WR-62 (Ku-Band: 12.4 - 18.0 GHz)", "operating_frequency_ghz": 15.0, "waveguide_width_a_mm": 15.799, "waveguide_height_b_mm": 7.899}
        }


# ── 3. Reflex Klystron & Magnetron Engine ───────────────────────────────────
class ReflexKlystronMagnetronInput(BaseModel):
    device_type: Literal["Reflex Klystron Oscillator", "Cavity Magnetron Oscillator"] = "Reflex Klystron Oscillator"
    beam_voltage_v0_v: float = Field(default=300.0, ge=100.0, le=1000.0)
    repeller_voltage_vr_v: float = Field(default=-150.0, ge=-500.0, le=-50.0)
    cavity_resonance_ghz: float = Field(default=9.5, ge=1.0, le=30.0)
    mode_index_n: int = Field(default=2, ge=1, le=4)


class ReflexKlystronMagnetronOutput(BaseModel):
    transit_time_repeller_ns: float
    optimum_repeller_voltage_v: float
    electronic_tuning_range_mhz: float
    oscillation_output_power_mw: float
    device_efficiency_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ReflexKlystronMagnetronEngine(BaseSimulationEngine):
    name = "reflex-klystron-magnetron"
    description = "ETCE/DMCE/S5: Microwave Tubes — Reflex Klystron Velocity Modulation, Repeller Modes & Magnetron Power"

    def calculate(self, params: ReflexKlystronMagnetronInput) -> ReflexKlystronMagnetronOutput:
        v0 = params.beam_voltage_v0_v
        vr = abs(params.repeller_voltage_vr_v)
        f0 = params.cavity_resonance_ghz * 1e9
        n = params.mode_index_n

        # Bunching transit time T = (n + 3/4) / f0
        t_opt_s = (n + 0.75) / f0
        t_opt_ns = t_opt_s * 1e9

        # Electronic tuning range ~ 30 MHz
        p_out_mw = 150.0 * (v0 / 300.0) * math.sin((n + 0.75) * math.pi / 2.0) ** 2
        p_out_mw = max(10.0, p_out_mw)
        eta = 22.5

        telemetry = {
            "t_ns": round(t_opt_ns, 3),
            "p_mw": round(p_out_mw, 1),
            "eta_pct": eta
        }

        return ReflexKlystronMagnetronOutput(
            transit_time_repeller_ns=round(t_opt_ns, 3),
            optimum_repeller_voltage_v=-round(vr, 1),
            electronic_tuning_range_mhz=32.0,
            oscillation_output_power_mw=round(p_out_mw, 1),
            device_efficiency_pct=eta,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "x_band_klystron_mode_2": {"device_type": "Reflex Klystron Oscillator", "beam_voltage_v0_v": 300.0, "repeller_voltage_vr_v": -150.0, "cavity_resonance_ghz": 9.5, "mode_index_n": 2},
            "magnetron_pulse_generator": {"device_type": "Cavity Magnetron Oscillator", "beam_voltage_v0_v": 800.0, "repeller_voltage_vr_v": -300.0, "cavity_resonance_ghz": 3.0, "mode_index_n": 1}
        }


# ── 4. Radar Range, Doppler & Antennas Engine ───────────────────────────────
class RadarRangeDopplerAntennaInput(BaseModel):
    peak_transmitter_power_kw: float = Field(default=25.0, ge=1.0, le=1000.0)
    antenna_gain_db: float = Field(default=32.0, ge=10.0, le=55.0)
    radar_cross_section_rcs_m2: float = Field(default=5.0, ge=0.1, le=100.0)
    target_radial_velocity_kmh: float = Field(default=180.0, ge=-1000.0, le=1000.0)
    operating_freq_ghz: float = Field(default=9.4, ge=1.0, le=35.0)
    receiver_sensitivity_dbm: float = Field(default=-100.0, ge=-130.0, le=-60.0)


class RadarRangeDopplerAntennaOutput(BaseModel):
    maximum_unambiguous_range_km: float
    doppler_frequency_shift_hz: float
    antenna_beamwidth_3db_deg: float
    target_approaching_or_receding: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RadarRangeDopplerAntennaEngine(BaseSimulationEngine):
    name = "radar-range-doppler-antenna"
    description = "ETCE/DMCE/S5: Radar Systems & Antennas — Radar Range Equation, Doppler Shift Speed & Parabolic Gain"

    def calculate(self, params: RadarRangeDopplerAntennaInput) -> RadarRangeDopplerAntennaOutput:
        c = 3.0e8
        pt_w = params.peak_transmitter_power_kw * 1000.0
        g_lin = math.pow(10.0, params.antenna_gain_db / 10.0)
        sigma = params.radar_cross_section_rcs_m2
        f0 = params.operating_freq_ghz * 1e9
        p_min_w = math.pow(10.0, (params.receiver_sensitivity_dbm - 30.0) / 10.0)
        lam = c / f0

        # Radar Range Equation: R_max = [ (Pt * G^2 * lambda^2 * sigma) / ((4*pi)^3 * Pmin) ]^(1/4)
        numerator = pt_w * (g_lin ** 2) * (lam ** 2) * sigma
        denominator = ((4.0 * math.pi) ** 3) * p_min_w
        r_max_m = math.pow(numerator / denominator, 0.25)
        r_max_km = r_max_m / 1000.0

        # Doppler shift: fd = 2 * vr * f0 / c
        vr_ms = params.target_radial_velocity_kmh / 3.6
        fd_hz = (2.0 * abs(vr_ms) * f0) / c
        motion = "APPROACHING (Positive Doppler Shift)" if params.target_radial_velocity_kmh > 0 else "RECEDING (Negative Doppler Shift)"

        # Dish 3dB beamwidth theta ~ 70 * lambda / D ~ 70 / sqrt(G)
        beam_deg = 70.0 / math.sqrt(max(1.0, g_lin))

        telemetry = {
            "r_max_km": round(r_max_km, 2),
            "fd_hz": round(fd_hz, 1),
            "beam_deg": round(beam_deg, 2)
        }

        return RadarRangeDopplerAntennaOutput(
            maximum_unambiguous_range_km=round(r_max_km, 2),
            doppler_frequency_shift_hz=round(fd_hz, 1),
            antenna_beamwidth_3db_deg=round(beam_deg, 2),
            target_approaching_or_receding=motion,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "x_band_marine_radar": {"peak_transmitter_power_kw": 25.0, "antenna_gain_db": 32.0, "radar_cross_section_rcs_m2": 5.0, "target_radial_velocity_kmh": 180.0, "operating_freq_ghz": 9.4, "receiver_sensitivity_dbm": -100.0},
            "airport_surveillance_radar": {"peak_transmitter_power_kw": 500.0, "antenna_gain_db": 38.0, "radar_cross_section_rcs_m2": 10.0, "target_radial_velocity_kmh": 500.0, "operating_freq_ghz": 2.8, "receiver_sensitivity_dbm": -110.0}
        }


# ── 5. Maxwell & Schering AC Bridges Engine ─────────────────────────────────
class MaxwellScheringACBridgesInput(BaseModel):
    bridge_type: Literal["Maxwell's Inductance-Capacitance Bridge", "Schering Bridge (Capacitance & Loss Factor)"] = "Maxwell's Inductance-Capacitance Bridge"
    resistor_r2_ohm: float = Field(default=1000.0, ge=10.0, le=100000.0)
    resistor_r3_ohm: float = Field(default=1000.0, ge=10.0, le=100000.0)
    standard_c4_uf: float = Field(default=0.1, ge=0.001, le=100.0)
    variable_r4_ohm: float = Field(default=500.0, ge=1.0, le=100000.0)
    test_frequency_hz: float = Field(default=1000.0, ge=50.0, le=100000.0)


class MaxwellScheringACBridgesOutput(BaseModel):
    measured_unknown_inductance_mh: float
    measured_unknown_capacitance_uf: float
    measured_unknown_resistance_ohm: float
    dissipation_or_quality_factor: float
    bridge_balance_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class MaxwellScheringACBridgesEngine(BaseSimulationEngine):
    name = "maxwell-schering-ac-bridges"
    description = "ETCE/EM/S5: AC Bridges — Maxwell's L-C Inductance Bridge, Schering Capacitance & Dielectric Loss Factor tan(delta)"

    def calculate(self, params: MaxwellScheringACBridgesInput) -> MaxwellScheringACBridgesOutput:
        r2 = params.resistor_r2_ohm
        r3 = params.resistor_r3_ohm
        c4 = params.standard_c4_uf / 1e6
        r4 = params.variable_r4_ohm
        omega = 2.0 * math.pi * params.test_frequency_hz

        if params.bridge_type == "Maxwell's Inductance-Capacitance Bridge":
            # Lx = R2 * R3 * C4, Rx = (R2 * R3) / R4
            lx_h = r2 * r3 * c4
            rx = (r2 * r3) / r4
            cx_uf = 0.0
            lx_mh = lx_h * 1000.0
            q_factor = (omega * lx_h) / rx if rx > 0 else 0.0
            d_or_q = q_factor
        else:  # Schering Bridge
            # Cx = C4 * (R4 / R3), Rx = R3 * (C4 / C4), tan(delta) = omega * C4 * R4
            cx_uf = (params.standard_c4_uf * (r4 / r3))
            rx = 50.0
            lx_mh = 0.0
            d_or_q = omega * c4 * r4

        telemetry = {
            "lx_mh": round(lx_mh, 2),
            "cx_uf": round(cx_uf, 4),
            "rx_ohm": round(rx, 2),
            "d_q": round(d_or_q, 3)
        }

        return MaxwellScheringACBridgesOutput(
            measured_unknown_inductance_mh=round(lx_mh, 2),
            measured_unknown_capacitance_uf=round(cx_uf, 4),
            measured_unknown_resistance_ohm=round(rx, 2),
            dissipation_or_quality_factor=round(d_or_q, 3),
            bridge_balance_status="NULL DETECTOR ZEROED (Exact Phase & Magnitude Balance)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "maxwell_100mh_inductor": {"bridge_type": "Maxwell's Inductance-Capacitance Bridge", "resistor_r2_ohm": 1000.0, "resistor_r3_ohm": 1000.0, "standard_c4_uf": 0.1, "variable_r4_ohm": 500.0, "test_frequency_hz": 1000.0},
            "schering_loss_factor_test": {"bridge_type": "Schering Bridge (Capacitance & Loss Factor)", "resistor_r2_ohm": 1000.0, "resistor_r3_ohm": 1000.0, "standard_c4_uf": 0.1, "variable_r4_ohm": 500.0, "test_frequency_hz": 1000.0}
        }


# ── 6. Heterodyne Spectrum Analyzer Engine ──────────────────────────────────
class HeterodyneSpectrumAnalyzerInput(BaseModel):
    input_frequency_mhz: float = Field(default=50.0, ge=1.0, le=1000.0)
    input_amplitude_dbm: float = Field(default=-10.0, ge=-60.0, le=20.0)
    resolution_bandwidth_rbw_khz: float = Field(default=30.0, ge=1.0, le=1000.0)
    sweep_span_mhz: float = Field(default=100.0, ge=5.0, le=500.0)
    harmonic_distortion_pct: float = Field(default=3.5, ge=0.1, le=20.0)


class HeterodyneSpectrumAnalyzerOutput(BaseModel):
    displayed_average_noise_floor_danl_dbm: float
    fundamental_peak_power_dbm: float
    second_harmonic_power_dbm: float
    third_harmonic_power_dbm: float
    total_harmonic_distortion_thd_pct: float
    dynamic_range_db: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class HeterodyneSpectrumAnalyzerEngine(BaseSimulationEngine):
    name = "heterodyne-spectrum-analyzer"
    description = "ETCE/EM/S5: Spectrum Analyzers — Swept Superheterodyne Spectrum Analyzer, RBW Resolution & THD Distortion"

    def calculate(self, params: HeterodyneSpectrumAnalyzerInput) -> HeterodyneSpectrumAnalyzerOutput:
        rbw = params.resolution_bandwidth_rbw_khz
        p_fund = params.input_amplitude_dbm

        # DANL = -174 dBm/Hz + 10*log10(RBW_Hz) + NF (assumed 15 dB)
        danl = -174.0 + 10.0 * math.log10(rbw * 1000.0) + 15.0
        dyn_range = p_fund - danl

        # Harmonics
        p_2nd = p_fund - 29.0
        p_3rd = p_fund - 38.0

        telemetry = {
            "danl": round(danl, 1),
            "fund": round(p_fund, 1),
            "p2": round(p_2nd, 1),
            "p3": round(p_3rd, 1),
            "thd": round(params.harmonic_distortion_pct, 2)
        }

        return HeterodyneSpectrumAnalyzerOutput(
            displayed_average_noise_floor_danl_dbm=round(danl, 1),
            fundamental_peak_power_dbm=round(p_fund, 1),
            second_harmonic_power_dbm=round(p_2nd, 1),
            third_harmonic_power_dbm=round(p_3rd, 1),
            total_harmonic_distortion_thd_pct=round(params.harmonic_distortion_pct, 2),
            dynamic_range_db=round(dyn_range, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "50mhz_narrow_rbw": {"input_frequency_mhz": 50.0, "input_amplitude_dbm": -10.0, "resolution_bandwidth_rbw_khz": 30.0, "sweep_span_mhz": 100.0, "harmonic_distortion_pct": 3.5},
            "100mhz_wide_spectrum": {"input_frequency_mhz": 100.0, "input_amplitude_dbm": 0.0, "resolution_bandwidth_rbw_khz": 100.0, "sweep_span_mhz": 200.0, "harmonic_distortion_pct": 2.1}
        }


# ── 7. SCR Two-Transistor Analogy & Commutation Engine ───────────────────────
class SCRTwoTransistorCommutationInput(BaseModel):
    transistor_alpha1: float = Field(default=0.45, ge=0.1, le=0.6)
    transistor_alpha2: float = Field(default=0.50, ge=0.1, le=0.6)
    gate_current_ig_ma: float = Field(default=15.0, ge=1.0, le=100.0)
    snubber_resistor_rs_ohm: float = Field(default=22.0, ge=5.0, le=200.0)
    snubber_capacitor_cs_uf: float = Field(default=0.1, ge=0.01, le=2.0)
    supply_voltage_vs_v: float = Field(default=230.0, ge=50.0, le=600.0)


class SCRTwoTransistorCommutationOutput(BaseModel):
    loop_gain_sum_alpha: float
    regenerative_latching_status: str
    maximum_dv_dt_snubber_v_us: float
    turn_off_commutation_time_us: float
    anode_latching_current_ma: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SCRTwoTransistorCommutationEngine(BaseSimulationEngine):
    name = "scr-two-transistor-commutation"
    description = "ETCE/IE1/S5: Power Semiconductor Devices — SCR Two-Transistor Model Latching, Snubber dv/dt & Forced Commutation"

    def calculate(self, params: SCRTwoTransistorCommutationInput) -> SCRTwoTransistorCommutationOutput:
        a_sum = params.transistor_alpha1 + params.transistor_alpha2
        rs = params.snubber_resistor_rs_ohm
        cs = params.snubber_capacitor_cs_uf / 1e6
        vs = params.supply_voltage_vs_v

        # dv/dt = Vs / (Rs * Cs)
        dv_dt = (vs / (rs * cs)) / 1e6  # V / us

        if a_sum >= 0.95 or params.gate_current_ig_ma >= 10.0:
            status = "LATCHED ON (Regenerative Avalanche Conduction Active)"
        else:
            status = "FORWARD BLOCKING (Off State — alpha1 + alpha2 < 1)"

        t_comm = 15.0  # us typical class C/D commutation

        telemetry = {
            "a_sum": round(a_sum, 3),
            "dv_dt": round(dv_dt, 1),
            "status": status
        }

        return SCRTwoTransistorCommutationOutput(
            loop_gain_sum_alpha=round(a_sum, 3),
            regenerative_latching_status=status,
            maximum_dv_dt_snubber_v_us=round(dv_dt, 2),
            turn_off_commutation_time_us=t_comm,
            anode_latching_current_ma=25.0,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "scr_triggered_latch": {"transistor_alpha1": 0.45, "transistor_alpha2": 0.50, "gate_current_ig_ma": 15.0, "snubber_resistor_rs_ohm": 22.0, "snubber_capacitor_cs_uf": 0.1, "supply_voltage_vs_v": 230.0},
            "scr_forward_blocking": {"transistor_alpha1": 0.35, "transistor_alpha2": 0.40, "gate_current_ig_ma": 2.0, "snubber_resistor_rs_ohm": 47.0, "snubber_capacitor_cs_uf": 0.05, "supply_voltage_vs_v": 230.0}
        }


# ── 8. Single-Phase Full-Wave SCR Bridge Engine ─────────────────────────────
class SinglePhaseFullWaveSCRBridgeInput(BaseModel):
    firing_angle_alpha_deg: float = Field(default=45.0, ge=0.0, le=180.0)
    ac_input_vrms_v: float = Field(default=230.0, ge=50.0, le=440.0)
    load_resistance_r_ohm: float = Field(default=10.0, ge=1.0, le=100.0)
    load_inductance_l_mh: float = Field(default=50.0, ge=0.0, le=500.0)
    mains_frequency_hz: float = Field(default=50.0, ge=25.0, le=400.0)


class SinglePhaseFullWaveSCRBridgeOutput(BaseModel):
    average_dc_output_voltage_vdc_v: float
    rms_output_voltage_vrms_v: float
    average_load_current_idc_a: float
    input_displacement_factor_cos_phi: float
    input_power_factor: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SinglePhaseFullWaveSCRBridgeEngine(BaseSimulationEngine):
    name = "single-phase-full-wave-scr-bridge"
    description = "ETCE/IE1/S5: Phase-Controlled Converters — 1-Phase Fully Controlled SCR Bridge, Firing Angle alpha & RL Load"

    def calculate(self, params: SinglePhaseFullWaveSCRBridgeInput) -> SinglePhaseFullWaveSCRBridgeOutput:
        vm = math.sqrt(2.0) * params.ac_input_vrms_v
        alpha_rad = math.radians(params.firing_angle_alpha_deg)

        # 1-phase full converter continuous conduction: Vdc = (2 * Vm / pi) * cos(alpha)
        vdc = (2.0 * vm / math.pi) * math.cos(alpha_rad)
        vrms = params.ac_input_vrms_v  # Continuous load assumption
        idc = max(0.0, vdc / params.load_resistance_r_ohm)

        disp_factor = math.cos(alpha_rad)
        pf = (2.0 * math.sqrt(2.0) / math.pi) * math.cos(alpha_rad)

        telemetry = {
            "vdc": round(vdc, 2),
            "idc": round(idc, 2),
            "pf": round(pf, 3),
            "alpha": params.firing_angle_alpha_deg
        }

        return SinglePhaseFullWaveSCRBridgeOutput(
            average_dc_output_voltage_vdc_v=round(vdc, 2),
            rms_output_voltage_vrms_v=round(vrms, 2),
            average_load_current_idc_a=round(idc, 2),
            input_displacement_factor_cos_phi=round(disp_factor, 3),
            input_power_factor=round(pf, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "bridge_45deg_firing": {"firing_angle_alpha_deg": 45.0, "ac_input_vrms_v": 230.0, "load_resistance_r_ohm": 10.0, "load_inductance_l_mh": 50.0, "mains_frequency_hz": 50.0},
            "bridge_90deg_zero_average": {"firing_angle_alpha_deg": 90.0, "ac_input_vrms_v": 230.0, "load_resistance_r_ohm": 10.0, "load_inductance_l_mh": 50.0, "mains_frequency_hz": 50.0}
        }


# ── 9. DC-DC Buck-Boost Converters Engine ───────────────────────────────────
class DCDCBuckBoostConvertersInput(BaseModel):
    converter_topology: Literal["Buck Converter (Step-Down)", "Boost Converter (Step-Up)", "Buck-Boost Converter (Inverting Step-Up/Down)"] = "Buck Converter (Step-Down)"
    input_voltage_vin_v: float = Field(default=24.0, ge=5.0, le=100.0)
    duty_cycle_d: float = Field(default=0.4, ge=0.05, le=0.90)
    switching_frequency_khz: float = Field(default=50.0, ge=10.0, le=500.0)
    inductor_l_uh: float = Field(default=100.0, ge=10.0, le=1000.0)
    load_resistance_r_ohm: float = Field(default=10.0, ge=1.0, le=100.0)


class DCDCBuckBoostConvertersOutput(BaseModel):
    output_dc_voltage_vout_v: float
    inductor_ripple_current_peak_a: float
    output_voltage_ripple_mv: float
    conduction_mode_status: str
    critical_inductance_uh: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DCDCBuckBoostConvertersEngine(BaseSimulationEngine):
    name = "dc-dc-buck-boost-converters"
    description = "ETCE/IE1/S5: Power Regulators — DC-DC Buck, Boost & Buck-Boost Converters Duty Cycle & Ripple Equations"

    def calculate(self, params: DCDCBuckBoostConvertersInput) -> DCDCBuckBoostConvertersOutput:
        vin = params.input_voltage_vin_v
        d = params.duty_cycle_d
        fs = params.switching_frequency_khz * 1000.0
        l_h = params.inductor_l_uh * 1e-6
        r = params.load_resistance_r_ohm

        if params.converter_topology == "Buck Converter (Step-Down)":
            vout = d * vin
            delta_il = ((vin - vout) * d) / (fs * l_h)
            l_crit_uh = (((1.0 - d) * r) / (2.0 * fs)) * 1e6
        elif params.converter_topology == "Boost Converter (Step-Up)":
            vout = vin / (1.0 - d)
            delta_il = (vin * d) / (fs * l_h)
            l_crit_uh = ((d * (1.0 - d) ** 2 * r) / (2.0 * fs)) * 1e6
        else:  # Buck-Boost
            vout = (d / (1.0 - d)) * vin
            delta_il = (vin * d) / (fs * l_h)
            l_crit_uh = (((1.0 - d) ** 2 * r) / (2.0 * fs)) * 1e6

        mode = "CONTINUOUS CONDUCTION MODE (CCM)" if params.inductor_l_uh >= l_crit_uh else "DISCONTINUOUS CONDUCTION (DCM)"
        v_rip_mv = (delta_il / (8.0 * fs * 100e-6)) * 1000.0

        telemetry = {
            "vout": round(vout, 2),
            "delta_il": round(delta_il, 3),
            "mode": mode,
            "lcrit_uh": round(l_crit_uh, 1)
        }

        return DCDCBuckBoostConvertersOutput(
            output_dc_voltage_vout_v=round(vout, 2),
            inductor_ripple_current_peak_a=round(delta_il, 3),
            output_voltage_ripple_mv=round(v_rip_mv, 2),
            conduction_mode_status=mode,
            critical_inductance_uh=round(l_crit_uh, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "buck_24v_to_9v6": {"converter_topology": "Buck Converter (Step-Down)", "input_voltage_vin_v": 24.0, "duty_cycle_d": 0.4, "switching_frequency_khz": 50.0, "inductor_l_uh": 100.0, "load_resistance_r_ohm": 10.0},
            "boost_12v_to_24v": {"converter_topology": "Boost Converter (Step-Up)", "input_voltage_vin_v": 12.0, "duty_cycle_d": 0.5, "switching_frequency_khz": 100.0, "inductor_l_uh": 68.0, "load_resistance_r_ohm": 20.0}
        }


# ── 10. 8051 Microcontroller Timers & UART Engine ───────────────────────────
class Microcontroller8051TimersUARTInput(BaseModel):
    oscillator_frequency_mhz: float = Field(default=11.0592, ge=1.0, le=24.0)
    timer_mode: Literal["Timer 1 Mode 2 (8-Bit Auto-Reload Baud Generator)", "Timer 0 Mode 1 (16-Bit Delay Timer)"] = "Timer 1 Mode 2 (8-Bit Auto-Reload Baud Generator)"
    desired_baud_rate: int = Field(default=9600, ge=300, le=57600)
    delay_milliseconds_ms: float = Field(default=10.0, ge=0.1, le=1000.0)


class Microcontroller8051TimersUARTOutput(BaseModel):
    timer_reload_value_hex: str
    machine_cycle_period_us: float
    actual_baud_rate_generated: int
    baud_rate_error_pct: float
    timer_count_cycles_required: int
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class Microcontroller8051TimersUARTEngine(BaseSimulationEngine):
    name = "microcontroller-8051-timers-uart"
    description = "ETCE/MCES/S5: 8051 Core Architecture — Dual 16-Bit Timers, Delay Calculations & UART 9600 Baud Generation"

    def calculate(self, params: Microcontroller8051TimersUARTInput) -> Microcontroller8051TimersUARTOutput:
        fosc = params.oscillator_frequency_mhz * 1e6
        tmc_us = (12.0 / fosc) * 1e6

        if params.timer_mode == "Timer 1 Mode 2 (8-Bit Auto-Reload Baud Generator)":
            baud = params.desired_baud_rate
            # Baud = fosc / (384 * (256 - TH1))
            val = int(round(256.0 - (fosc / (384.0 * baud))))
            val = max(0, min(255, val))
            th1_hex = f"{val:02X}H"
            act_baud = int(fosc / (384.0 * (256 - val)))
            err = abs(act_baud - baud) / baud * 100.0
            cycles = 256 - val
        else:  # Timer 0 Mode 1 (16-Bit)
            cycles = int((params.delay_milliseconds_ms * 1000.0) / tmc_us)
            count = 65536 - cycles
            th1_hex = f"{count:04X}H"
            act_baud = 0
            err = 0.0

        telemetry = {
            "hex": th1_hex,
            "tmc_us": round(tmc_us, 3),
            "act_baud": act_baud,
            "err": round(err, 2)
        }

        return Microcontroller8051TimersUARTOutput(
            timer_reload_value_hex=th1_hex,
            machine_cycle_period_us=round(tmc_us, 3),
            actual_baud_rate_generated=act_baud,
            baud_rate_error_pct=round(err, 2),
            timer_count_cycles_required=cycles,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "uart_9600_baud_th1_fd": {"oscillator_frequency_mhz": 11.0592, "timer_mode": "Timer 1 Mode 2 (8-Bit Auto-Reload Baud Generator)", "desired_baud_rate": 9600, "delay_milliseconds_ms": 10.0},
            "timer0_10ms_delay": {"oscillator_frequency_mhz": 11.0592, "timer_mode": "Timer 0 Mode 1 (16-Bit Delay Timer)", "desired_baud_rate": 9600, "delay_milliseconds_ms": 10.0}
        }


# ── 11. LCD & Keypad 8051 Interfacing Engine ────────────────────────────────
class LCDKeypad8051InterfacingInput(BaseModel):
    display_text_line1: str = Field(default="NHIT ETCE LAB")
    display_text_line2: str = Field(default="8051 SYSTEM OK")
    keypad_key_pressed: str = Field(default="7")
    lcd_bus_mode: Literal["8-Bit Parallel Bus Mode", "4-Bit Nibble Mode"] = "8-Bit Parallel Bus Mode"


class LCDKeypad8051InterfacingOutput(BaseModel):
    lcd_initialization_commands_hex: List[str]
    line1_ddram_address_hex: str
    line2_ddram_address_hex: str
    keypad_scanned_code_hex: str
    keypad_debounce_delay_ms: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class LCDKeypad8051InterfacingEngine(BaseSimulationEngine):
    name = "lcd-keypad-8051-interfacing"
    description = "ETCE/MCES/S5: 8051 Interfacing — 16x2 HD44780 Alphanumeric LCD Commands & 4x4 Matrix Keypad Scanning"

    def calculate(self, params: LCDKeypad8051InterfacingInput) -> LCDKeypad8051InterfacingOutput:
        cmds = ["38H (2 Lines, 5x7 Font)", "0EH (Display ON, Cursor Blink)", "01H (Clear Display)", "06H (Auto-Increment)"]
        key_code = "0E7H" if params.keypad_key_pressed == "7" else "0EFH"

        telemetry = {
            "l1": params.display_text_line1,
            "l2": params.display_text_line2,
            "key": params.keypad_key_pressed
        }

        return LCDKeypad8051InterfacingOutput(
            lcd_initialization_commands_hex=cmds,
            line1_ddram_address_hex="80H (Line 1 Address)",
            line2_ddram_address_hex="C0H (Line 2 Address)",
            keypad_scanned_code_hex=key_code,
            keypad_debounce_delay_ms=20.0,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "nhit_display_key7": {"display_text_line1": "NHIT ETCE LAB", "display_text_line2": "8051 SYSTEM OK", "keypad_key_pressed": "7", "lcd_bus_mode": "8-Bit Parallel Bus Mode"},
            "embedded_welcome": {"display_text_line1": "WELCOME TO LAB", "display_text_line2": "PRESS KEY 1-9", "keypad_key_pressed": "1", "lcd_bus_mode": "4-Bit Nibble Mode"}
        }


# ── 12. DSP Discrete Fourier, FFT & FIR Filters Engine ──────────────────────
class DSPDiscreteFourierFFTFIRInput(BaseModel):
    input_sequence_x: str = Field(default="1, 2, 3, 4, 3, 2, 1, 0")
    fir_filter_cutoff_pi: float = Field(default=0.4, ge=0.1, le=0.9)
    fir_window_type: Literal["Hamming Window", "Rectangular Window", "Hanning Window"] = "Hamming Window"
    fir_filter_taps_n: int = Field(default=7, ge=3, le=15)


class DSPDiscreteFourierFFTFIROutput(BaseModel):
    dft_computation_multiplications_n2: int
    fft_butterfly_multiplications: int
    fft_speedup_factor: float
    fir_filter_coefficients: List[float]
    filter_stopband_attenuation_db: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DSPDiscreteFourierFFTFIREngine(BaseSimulationEngine):
    name = "dsp-discrete-fourier-fft-fir"
    description = "ETCE/DSP/S5: Digital Signal Processing — DFT/FFT Radix-2 Butterfly Decomposition & Windowed FIR Filter Design"

    def calculate(self, params: DSPDiscreteFourierFFTFIRInput) -> DSPDiscreteFourierFFTFIROutput:
        n = 8
        dft_mult = n ** 2  # 64
        fft_mult = int((n / 2) * math.log2(n))  # 12
        speedup = dft_mult / fft_mult

        # 7-tap Hamming low pass FIR filter coefficients
        wc = params.fir_filter_cutoff_pi * math.pi
        taps = params.fir_filter_taps_n
        m = (taps - 1) // 2
        coeffs = []
        for i in range(taps):
            k = i - m
            if k == 0:
                hd = wc / math.pi
            else:
                hd = math.sin(wc * k) / (math.pi * k)
            w = 0.54 - 0.46 * math.cos(2.0 * math.pi * i / (taps - 1))
            coeffs.append(round(hd * w, 4))

        telemetry = {
            "dft": dft_mult,
            "fft": fft_mult,
            "speedup": round(speedup, 1),
            "coeffs": coeffs
        }

        return DSPDiscreteFourierFFTFIROutput(
            dft_computation_multiplications_n2=dft_mult,
            fft_butterfly_multiplications=fft_mult,
            fft_speedup_factor=round(speedup, 2),
            fir_filter_coefficients=coeffs,
            filter_stopband_attenuation_db=53.0 if params.fir_window_type == "Hamming Window" else 21.0,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "8point_fft_hamming_fir": {"input_sequence_x": "1, 2, 3, 4, 3, 2, 1, 0", "fir_filter_cutoff_pi": 0.4, "fir_window_type": "Hamming Window", "fir_filter_taps_n": 7},
            "rectangular_window_fir": {"input_sequence_x": "1, 1, 1, 1, 0, 0, 0, 0", "fir_filter_cutoff_pi": 0.5, "fir_window_type": "Rectangular Window", "fir_filter_taps_n": 7}
        }
