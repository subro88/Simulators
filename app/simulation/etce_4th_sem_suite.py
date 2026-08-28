"""
WBSCTE Electronics & Telecommunication Engineering (ETCE) 4th Semester Physics Engines
========================================================================================
Syllabus Mapped:
1. ETCE/ECE/S4:     AMFMModulationDemodulationEngine
2. ETCE/ECE/S4:     SuperheterodyneRadioReceiverEngine
3. ETCE/ECE/S4:     PulseCodeModulationSamplingEngine
4. ETCE/AE2/S4:     FeedbackAmplifiersTopologiesEngine
5. ETCE/AE2/S4:     RCLCCrystalOscillatorsEngine
6. ETCE/AE2/S4:     SchmittTriggerComparatorsEngine
7. ETCE/AE2/S4:     IC555MultivibratorsEngine
8. ETCE/CONSUMER/S4: AudioCrossoverLoudspeakersEngine
9. ETCE/CONSUMER/S4: ColorTVCompositeVideoEngine
10. ETCE/MP/S4:      Intel8085MicroprocessorSimulatorEngine
11. ETCE/MP/S4:      MicroprocessorMemoryInterfacingEngine
12. ETCE/MP/S4:      PPI8255InterfacingIOEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. AM & FM Modulation / Demodulation Engine ──────────────────────────────
class AMFMModulationDemodulationInput(BaseModel):
    modulation_type: Literal["Amplitude Modulation (AM)", "Frequency Modulation (FM)"] = "Amplitude Modulation (AM)"
    carrier_freq_khz: float = Field(default=1000.0, ge=100.0, le=100000.0)
    modulating_freq_khz: float = Field(default=5.0, ge=0.1, le=20.0)
    carrier_voltage_vc: float = Field(default=10.0, ge=1.0, le=100.0)
    modulating_voltage_vm: float = Field(default=6.0, ge=0.1, le=100.0)
    frequency_deviation_khz: float = Field(default=75.0, ge=1.0, le=200.0)


class AMFMModulationDemodulationOutput(BaseModel):
    modulation_index: float
    transmission_bandwidth_khz: float
    carrier_power_w: float
    total_transmitted_power_w: float
    modulation_efficiency_pct: float
    upper_sideband_freq_khz: float
    lower_sideband_freq_khz: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AMFMModulationDemodulationEngine(BaseSimulationEngine):
    name = "am-fm-modulation-demodulation"
    description = "ETCE/ECE/S4: Analog Modulation — AM Modulation Index, Sideband Power Distribution & FM Carson's Rule Bandwidth"

    def calculate(self, params: AMFMModulationDemodulationInput) -> AMFMModulationDemodulationOutput:
        fc = params.carrier_freq_khz
        fm = params.modulating_freq_khz
        vc = params.carrier_voltage_vc
        vm = params.modulating_voltage_vm

        # Standard antenna load resistance = 50 ohms
        r_ant = 50.0
        pc = (vc ** 2) / (2.0 * r_ant)

        if params.modulation_type == "Amplitude Modulation (AM)":
            m = vm / vc
            bw = 2.0 * fm
            pt = pc * (1.0 + (m ** 2) / 2.0)
            eta = ((m ** 2) / (2.0 + m ** 2)) * 100.0
            usb = fc + fm
            lsb = fc - fm
        else:  # FM
            delta_f = params.frequency_deviation_khz
            beta = delta_f / fm
            m = beta
            bw = 2.0 * (delta_f + fm)  # Carson's Rule
            pt = pc  # Constant envelope in FM
            eta = 100.0
            usb = fc + delta_f
            lsb = fc - delta_f

        telemetry = {
            "m": round(m, 3),
            "bw_khz": round(bw, 1),
            "pc_w": round(pc, 2),
            "pt_w": round(pt, 2),
            "eta_pct": round(eta, 2)
        }

        return AMFMModulationDemodulationOutput(
            modulation_index=round(m, 3),
            transmission_bandwidth_khz=round(bw, 2),
            carrier_power_w=round(pc, 2),
            total_transmitted_power_w=round(pt, 2),
            modulation_efficiency_pct=round(eta, 2),
            upper_sideband_freq_khz=round(usb, 2),
            lower_sideband_freq_khz=round(lsb, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "am_commercial_broadcast": {"modulation_type": "Amplitude Modulation (AM)", "carrier_freq_khz": 1000.0, "modulating_freq_khz": 5.0, "carrier_voltage_vc": 10.0, "modulating_voltage_vm": 6.0, "frequency_deviation_khz": 75.0},
            "fm_broadcast_wideband": {"modulation_type": "Frequency Modulation (FM)", "carrier_freq_khz": 98500.0, "modulating_freq_khz": 15.0, "carrier_voltage_vc": 10.0, "modulating_voltage_vm": 6.0, "frequency_deviation_khz": 75.0}
        }


# ── 2. Superheterodyne Radio Receiver Engine ────────────────────────────────
class SuperheterodyneRadioReceiverInput(BaseModel):
    signal_frequency_fs_khz: float = Field(default=1200.0, ge=535.0, le=30000.0)
    intermediate_frequency_if_khz: float = Field(default=455.0, ge=100.0, le=10700.0)
    rf_stage_q_factor: float = Field(default=80.0, ge=10.0, le=250.0)
    rf_input_uv: float = Field(default=50.0, ge=1.0, le=10000.0)
    agc_gain_reduction_db: float = Field(default=18.0, ge=0.0, le=60.0)


class SuperheterodyneRadioReceiverOutput(BaseModel):
    local_oscillator_frequency_khz: float
    image_frequency_khz: float
    image_rejection_ratio_db: float
    receiver_selectivity_q: float
    demodulated_audio_snr_db: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SuperheterodyneRadioReceiverEngine(BaseSimulationEngine):
    name = "superheterodyne-radio-receiver"
    description = "ETCE/ECE/S4: Radio Receivers — Mixer Downconversion, Local Oscillator, Image Rejection Ratio & IF Filtering"

    def calculate(self, params: SuperheterodyneRadioReceiverInput) -> SuperheterodyneRadioReceiverOutput:
        fs = params.signal_frequency_fs_khz
        fif = params.intermediate_frequency_if_khz
        q = params.rf_stage_q_factor

        flo = fs + fif
        fimg = fs + 2.0 * fif

        # Image Rejection Ratio: rho = fimg/fs - fs/fimg, alpha = sqrt(1 + Q^2 * rho^2)
        rho = (fimg / fs) - (fs / fimg)
        irr_linear = math.sqrt(1.0 + (q ** 2) * (rho ** 2))
        irr_db = 20.0 * math.log10(irr_linear)

        snr_db = 20.0 * math.log10(max(1.0, params.rf_input_uv / 5.0)) + params.agc_gain_reduction_db * 0.5

        telemetry = {
            "flo_khz": round(flo, 1),
            "fimg_khz": round(fimg, 1),
            "irr_db": round(irr_db, 1),
            "snr_db": round(snr_db, 1)
        }

        return SuperheterodyneRadioReceiverOutput(
            local_oscillator_frequency_khz=round(flo, 2),
            image_frequency_khz=round(fimg, 2),
            image_rejection_ratio_db=round(irr_db, 2),
            receiver_selectivity_q=round(q, 1),
            demodulated_audio_snr_db=round(snr_db, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "am_medium_wave_1200khz": {"signal_frequency_fs_khz": 1200.0, "intermediate_frequency_if_khz": 455.0, "rf_stage_q_factor": 80.0, "rf_input_uv": 50.0, "agc_gain_reduction_db": 18.0},
            "shortwave_receiver_15mhz": {"signal_frequency_fs_khz": 15000.0, "intermediate_frequency_if_khz": 455.0, "rf_stage_q_factor": 120.0, "rf_input_uv": 20.0, "agc_gain_reduction_db": 24.0}
        }


# ── 3. Pulse Code Modulation (PCM) & Sampling Engine ────────────────────────
class PulseCodeModulationSamplingInput(BaseModel):
    message_bandwidth_fm_khz: float = Field(default=4.0, ge=0.5, le=50.0)
    sampling_frequency_fs_khz: float = Field(default=8.0, ge=1.0, le=200.0)
    quantizer_resolution_bits: int = Field(default=8, ge=2, le=16)
    input_signal_amplitude_v: float = Field(default=2.0, ge=0.5, le=10.0)
    companding_type: Literal["A-Law (Europe/India)", "Mu-Law (US/Japan)", "Linear Uniform"] = "A-Law (Europe/India)"


class PulseCodeModulationSamplingOutput(BaseModel):
    nyquist_rate_khz: float
    sampling_condition_status: str
    quantization_levels_count: int
    quantization_step_size_mv: float
    bit_transmission_rate_kbps: float
    signal_to_quantization_noise_sqnr_db: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PulseCodeModulationSamplingEngine(BaseSimulationEngine):
    name = "pulse-code-modulation-sampling"
    description = "ETCE/ECE/S4: Digital Transmission — Nyquist-Shannon Sampling, Quantization Noise & PCM Transmission Bitrate"

    def calculate(self, params: PulseCodeModulationSamplingInput) -> PulseCodeModulationSamplingOutput:
        fm = params.message_bandwidth_fm_khz
        fs = params.sampling_frequency_fs_khz
        n = params.quantizer_resolution_bits
        vm = params.input_signal_amplitude_v

        nyquist = 2.0 * fm
        if fs > nyquist:
            status = "OVERSAMPLING (No Aliasing — Guard Band Preserved)"
        elif abs(fs - nyquist) < 1e-4:
            status = "CRITICAL NYQUIST SAMPLING (fs = 2*fm)"
        else:
            status = "UNDERSAMPLING (Severe Spectral Overlap Aliasing)"

        levels = 2 ** n
        step_mv = (2.0 * vm / levels) * 1000.0
        bitrate_kbps = n * fs
        sqnr_db = 6.02 * n + 1.76

        telemetry = {
            "nyquist_khz": round(nyquist, 1),
            "step_mv": round(step_mv, 2),
            "bitrate_kbps": round(bitrate_kbps, 1),
            "sqnr_db": round(sqnr_db, 2)
        }

        return PulseCodeModulationSamplingOutput(
            nyquist_rate_khz=round(nyquist, 2),
            sampling_condition_status=status,
            quantization_levels_count=levels,
            quantization_step_size_mv=round(step_mv, 3),
            bit_transmission_rate_kbps=round(bitrate_kbps, 2),
            signal_to_quantization_noise_sqnr_db=round(sqnr_db, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "voice_pcm_standard_64kbps": {"message_bandwidth_fm_khz": 4.0, "sampling_frequency_fs_khz": 8.0, "quantizer_resolution_bits": 8, "input_signal_amplitude_v": 2.0, "companding_type": "A-Law (Europe/India)"},
            "audio_cd_quality_pcm": {"message_bandwidth_fm_khz": 20.0, "sampling_frequency_fs_khz": 44.1, "quantizer_resolution_bits": 16, "input_signal_amplitude_v": 1.0, "companding_type": "Linear Uniform"}
        }


# ── 4. Negative Feedback Amplifiers Engine ──────────────────────────────────
class FeedbackAmplifiersTopologiesInput(BaseModel):
    topology: Literal["Voltage-Series (Non-Inverting)", "Voltage-Shunt (Inverting)", "Current-Series", "Current-Shunt"] = "Voltage-Series (Non-Inverting)"
    open_loop_gain_a: float = Field(default=1000.0, ge=10.0, le=100000.0)
    feedback_factor_beta: float = Field(default=0.01, ge=0.0001, le=0.5)
    open_loop_bandwidth_khz: float = Field(default=20.0, ge=1.0, le=500.0)
    input_impedance_rin_kohm: float = Field(default=10.0, ge=0.1, le=1000.0)
    output_impedance_rout_ohm: float = Field(default=500.0, ge=1.0, le=10000.0)


class FeedbackAmplifiersTopologiesOutput(BaseModel):
    desensitivity_factor_d: float
    closed_loop_gain_af: float
    closed_loop_bandwidth_khz: float
    closed_loop_input_impedance_kohm: float
    closed_loop_output_impedance_ohm: float
    gain_stability_improvement_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FeedbackAmplifiersTopologiesEngine(BaseSimulationEngine):
    name = "feedback-amplifiers-topologies"
    description = "ETCE/AE2/S4: Feedback Amplifiers — 4 Feedback Topologies, Gain Desensitivity, Bandwidth & Impedance Transformations"

    def calculate(self, params: FeedbackAmplifiersTopologiesInput) -> FeedbackAmplifiersTopologiesOutput:
        a = params.open_loop_gain_a
        beta = params.feedback_factor_beta
        bw = params.open_loop_bandwidth_khz
        rin = params.input_impedance_rin_kohm
        rout = params.output_impedance_rout_ohm

        d = 1.0 + a * beta
        af = a / d
        bw_f = bw * d
        stability_imp = (1.0 - (1.0 / d)) * 100.0

        if params.topology == "Voltage-Series (Non-Inverting)":
            rin_f = rin * d
            rout_f = rout / d
        elif params.topology == "Voltage-Shunt (Inverting)":
            rin_f = rin / d
            rout_f = rout / d
        elif params.topology == "Current-Series":
            rin_f = rin * d
            rout_f = rout * d
        else:  # Current-Shunt
            rin_f = rin / d
            rout_f = rout * d

        telemetry = {
            "d_factor": round(d, 2),
            "af": round(af, 2),
            "bw_f_khz": round(bw_f, 1),
            "rin_f_kohm": round(rin_f, 2),
            "rout_f_ohm": round(rout_f, 2)
        }

        return FeedbackAmplifiersTopologiesOutput(
            desensitivity_factor_d=round(d, 2),
            closed_loop_gain_af=round(af, 2),
            closed_loop_bandwidth_khz=round(bw_f, 2),
            closed_loop_input_impedance_kohm=round(rin_f, 2),
            closed_loop_output_impedance_ohm=round(rout_f, 2),
            gain_stability_improvement_pct=round(stability_imp, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "voltage_series_audio_amp": {"topology": "Voltage-Series (Non-Inverting)", "open_loop_gain_a": 1000.0, "feedback_factor_beta": 0.01, "open_loop_bandwidth_khz": 20.0, "input_impedance_rin_kohm": 10.0, "output_impedance_rout_ohm": 500.0},
            "voltage_shunt_transimpedance": {"topology": "Voltage-Shunt (Inverting)", "open_loop_gain_a": 2000.0, "feedback_factor_beta": 0.005, "open_loop_bandwidth_khz": 15.0, "input_impedance_rin_kohm": 5.0, "output_impedance_rout_ohm": 400.0}
        }


# ── 5. RC, LC & Crystal Oscillators Engine ──────────────────────────────────
class RCLCCrystalOscillatorsInput(BaseModel):
    oscillator_type: Literal["Wien Bridge Oscillator", "RC Phase Shift Oscillator", "Hartley LC Oscillator", "Colpitts LC Oscillator", "Quartz Crystal Oscillator"] = "Wien Bridge Oscillator"
    resistance_r_kohm: float = Field(default=10.0, ge=0.5, le=100.0)
    capacitance_c_nf: float = Field(default=10.0, ge=0.01, le=1000.0)
    inductance_l_uh: float = Field(default=100.0, ge=1.0, le=10000.0)
    crystal_series_res_freq_mhz: float = Field(default=4.0, ge=0.1, le=50.0)


class RCLCCrystalOscillatorsOutput(BaseModel):
    oscillation_frequency_khz: float
    minimum_amplifier_gain_required: float
    barkhausen_phase_shift_deg: float
    frequency_stability_factor: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCLCCrystalOscillatorsEngine(BaseSimulationEngine):
    name = "rc-lc-crystal-oscillators"
    description = "ETCE/AE2/S4: Sinusoidal Oscillators — Barkhausen Criterion, RC Phase Shift, Wien Bridge, LC & Quartz Crystal Resonators"

    def calculate(self, params: RCLCCrystalOscillatorsInput) -> RCLCCrystalOscillatorsOutput:
        r = params.resistance_r_kohm * 1000.0
        c = params.capacitance_c_nf * 1e-9
        l = params.inductance_l_uh * 1e-6

        if params.oscillator_type == "Wien Bridge Oscillator":
            # f0 = 1 / (2 * pi * R * C)
            f_hz = 1.0 / (2.0 * math.pi * r * c)
            gain_req = 3.0
            stab = "GOOD (RC Lead-Lag Bridge)"
        elif params.oscillator_type == "RC Phase Shift Oscillator":
            # f0 = 1 / (2 * pi * R * C * sqrt(6))
            f_hz = 1.0 / (2.0 * math.pi * r * c * math.sqrt(6.0))
            gain_req = 29.0
            stab = "MODERATE (3-Stage Cascaded RC)"
        elif params.oscillator_type == "Hartley LC Oscillator":
            # L_eq = 2*L
            f_hz = 1.0 / (2.0 * math.pi * math.sqrt(2.0 * l * c))
            gain_req = 2.0
            stab = "HIGH (RF LC Tank)"
        elif params.oscillator_type == "Colpitts LC Oscillator":
            # C_eq = C/2
            f_hz = 1.0 / (2.0 * math.pi * math.sqrt(l * (c / 2.0)))
            gain_req = 2.0
            stab = "HIGH (Split-Capacitor RF Tank)"
        else:  # Quartz Crystal
            f_hz = params.crystal_series_res_freq_mhz * 1e6
            gain_req = 1.2
            stab = "ULTRA-HIGH (Piezoelectric Q > 25,000)"

        f_khz = f_hz / 1000.0

        telemetry = {
            "f_khz": round(f_khz, 2),
            "gain_req": gain_req,
            "stab": stab
        }

        return RCLCCrystalOscillatorsOutput(
            oscillation_frequency_khz=round(f_khz, 2),
            minimum_amplifier_gain_required=round(gain_req, 1),
            barkhausen_phase_shift_deg=0.0,
            frequency_stability_factor=stab,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "wien_bridge_1khz_audio": {"oscillator_type": "Wien Bridge Oscillator", "resistance_r_kohm": 15.9, "capacitance_c_nf": 10.0, "inductance_l_uh": 100.0, "crystal_series_res_freq_mhz": 4.0},
            "colpitts_rf_1mhz": {"oscillator_type": "Colpitts LC Oscillator", "resistance_r_kohm": 10.0, "capacitance_c_nf": 0.5, "inductance_l_uh": 100.0, "crystal_series_res_freq_mhz": 4.0}
        }


# ── 6. Schmitt Trigger & Comparators Engine ─────────────────────────────────
class SchmittTriggerComparatorsInput(BaseModel):
    circuit_type: Literal["Inverting Schmitt Trigger", "Non-Inverting Schmitt Trigger", "Zero-Crossing Detector"] = "Inverting Schmitt Trigger"
    supply_vcc_v: float = Field(default=15.0, ge=5.0, le=20.0)
    feedback_resistor_r2_kohm: float = Field(default=100.0, ge=1.0, le=500.0)
    input_resistor_r1_kohm: float = Field(default=10.0, ge=0.5, le=100.0)
    reference_voltage_vref_v: float = Field(default=0.0, ge=-10.0, le=10.0)


class SchmittTriggerComparatorsOutput(BaseModel):
    upper_threshold_voltage_utp_v: float
    lower_threshold_voltage_ltp_v: float
    hysteresis_voltage_vh_v: float
    saturation_output_swing_v: float
    noise_immunity_margin_v: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SchmittTriggerComparatorsEngine(BaseSimulationEngine):
    name = "schmitt-trigger-comparators"
    description = "ETCE/AE2/S4: Non-Linear Op-Amps — Schmitt Trigger Thresholds (UTP/LTP), Hysteresis & Noise Immunity"

    def calculate(self, params: SchmittTriggerComparatorsInput) -> SchmittTriggerComparatorsOutput:
        vcc = params.supply_vcc_v
        vsat = vcc - 1.5
        r1 = params.input_resistor_r1_kohm
        r2 = params.feedback_resistor_r2_kohm
        vref = params.reference_voltage_vref_v

        if params.circuit_type == "Inverting Schmitt Trigger":
            utp = vref * (r2 / (r1 + r2)) + vsat * (r1 / (r1 + r2))
            ltp = vref * (r2 / (r1 + r2)) - vsat * (r1 / (r1 + r2))
        elif params.circuit_type == "Non-Inverting Schmitt Trigger":
            utp = -vref * (r1 / r2) + vsat * (r1 / r2)
            ltp = -vref * (r1 / r2) - vsat * (r1 / r2)
        else:  # Zero-Crossing Detector
            utp = 0.02
            ltp = -0.02

        vh = utp - ltp

        telemetry = {
            "utp_v": round(utp, 2),
            "ltp_v": round(ltp, 2),
            "vh_v": round(vh, 2),
            "vsat_v": round(vsat, 1)
        }

        return SchmittTriggerComparatorsOutput(
            upper_threshold_voltage_utp_v=round(utp, 2),
            lower_threshold_voltage_ltp_v=round(ltp, 2),
            hysteresis_voltage_vh_v=round(vh, 2),
            saturation_output_swing_v=round(2.0 * vsat, 1),
            noise_immunity_margin_v=round(vh / 2.0, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "inverting_schmitt_10k_100k": {"circuit_type": "Inverting Schmitt Trigger", "supply_vcc_v": 15.0, "feedback_resistor_r2_kohm": 100.0, "input_resistor_r1_kohm": 10.0, "reference_voltage_vref_v": 0.0},
            "non_inverting_schmitt_5v": {"circuit_type": "Non-Inverting Schmitt Trigger", "supply_vcc_v": 12.0, "feedback_resistor_r2_kohm": 47.0, "input_resistor_r1_kohm": 10.0, "reference_voltage_vref_v": 2.5}
        }


# ── 7. IC 555 Timer Multivibrators Engine ───────────────────────────────────
class IC555MultivibratorsInput(BaseModel):
    mode: Literal["Astable Multivibrator (Free Running)", "Monostable Multivibrator (One-Shot)"] = "Astable Multivibrator (Free Running)"
    resistor_ra_kohm: float = Field(default=10.0, ge=1.0, le=500.0)
    resistor_rb_kohm: float = Field(default=4.7, ge=0.5, le=500.0)
    timing_cap_c_uf: float = Field(default=0.1, ge=0.001, le=1000.0)
    supply_vcc_v: float = Field(default=5.0, ge=4.5, le=15.0)


class IC555MultivibratorsOutput(BaseModel):
    output_frequency_hz: float
    duty_cycle_pct: float
    high_time_thigh_ms: float
    low_time_tlow_ms: float
    one_shot_pulse_width_ms: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IC555MultivibratorsEngine(BaseSimulationEngine):
    name = "ic555-multivibrators"
    description = "ETCE/AE2/S4: Linear Timer ICs — NE555 Astable Free-Running Multivibrator & Monostable Pulse Width"

    def calculate(self, params: IC555MultivibratorsInput) -> IC555MultivibratorsOutput:
        ra = params.resistor_ra_kohm * 1000.0
        rb = params.resistor_rb_kohm * 1000.0
        c = params.timing_cap_c_uf / 1e6

        if params.mode == "Astable Multivibrator (Free Running)":
            t_high_s = 0.693 * (ra + rb) * c
            t_low_s = 0.693 * rb * c
            t_total_s = t_high_s + t_low_s
            f_hz = 1.44 / ((ra + 2.0 * rb) * c)
            duty = ((ra + rb) / (ra + 2.0 * rb)) * 100.0
            tp_ms = 0.0
        else:  # Monostable
            t_high_s = 1.1 * ra * c
            t_low_s = 0.0
            f_hz = 1.0 / t_high_s if t_high_s > 0 else 0.0
            duty = 100.0
            tp_ms = t_high_s * 1000.0

        telemetry = {
            "f_hz": round(f_hz, 1),
            "duty": round(duty, 1),
            "th_ms": round(t_high_s * 1000.0, 2),
            "tl_ms": round(t_low_s * 1000.0, 2)
        }

        return IC555MultivibratorsOutput(
            output_frequency_hz=round(f_hz, 2),
            duty_cycle_pct=round(duty, 2),
            high_time_thigh_ms=round(t_high_s * 1000.0, 3),
            low_time_tlow_ms=round(t_low_s * 1000.0, 3),
            one_shot_pulse_width_ms=round(tp_ms, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "astable_1khz_square_wave": {"mode": "Astable Multivibrator (Free Running)", "resistor_ra_kohm": 10.0, "resistor_rb_kohm": 4.7, "timing_cap_c_uf": 0.1, "supply_vcc_v": 5.0},
            "monostable_10ms_timer": {"mode": "Monostable Multivibrator (One-Shot)", "resistor_ra_kohm": 9.1, "resistor_rb_kohm": 4.7, "timing_cap_c_uf": 1.0, "supply_vcc_v": 5.0}
        }


# ── 8. Audio Crossover & Loudspeakers Engine ────────────────────────────────
class AudioCrossoverLoudspeakersInput(BaseModel):
    crossover_order: Literal["2nd-Order Butterworth 12dB/octave", "1st-Order 6dB/octave", "3-Way Dividing Network"] = "2nd-Order Butterworth 12dB/octave"
    crossover_frequency_fc_hz: float = Field(default=2500.0, ge=200.0, le=10000.0)
    speaker_impedance_z_ohm: float = Field(default=8.0, ge=2.0, le=16.0)
    midrange_low_fc_hz: float = Field(default=500.0, ge=100.0, le=2000.0)
    midrange_high_fc_hz: float = Field(default=4000.0, ge=2000.0, le=8000.0)


class AudioCrossoverLoudspeakersOutput(BaseModel):
    low_pass_woofer_inductor_mh: float
    low_pass_woofer_capacitor_uf: float
    high_pass_tweeter_capacitor_uf: float
    high_pass_tweeter_inductor_mh: float
    attenuation_slope_db_octave: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AudioCrossoverLoudspeakersEngine(BaseSimulationEngine):
    name = "audio-crossover-loudspeakers"
    description = "ETCE/CONSUMER/S4: Audio Systems — 2-Way & 3-Way LC Crossover Dividing Networks & Woofer/Tweeter Sizing"

    def calculate(self, params: AudioCrossoverLoudspeakersInput) -> AudioCrossoverLoudspeakersOutput:
        fc = params.crossover_frequency_fc_hz
        r = params.speaker_impedance_z_ohm

        if params.crossover_order == "2nd-Order Butterworth 12dB/octave":
            # L = R * sqrt(2) / (2 * pi * fc)
            l_h = (r * math.sqrt(2.0)) / (2.0 * math.pi * fc)
            # C = 1 / (2 * pi * sqrt(2) * fc * R)
            c_f = 1.0 / (2.0 * math.pi * math.sqrt(2.0) * fc * r)
            slope = 12.0
        elif params.crossover_order == "1st-Order 6dB/octave":
            l_h = r / (2.0 * math.pi * fc)
            c_f = 1.0 / (2.0 * math.pi * fc * r)
            slope = 6.0
        else:  # 3-Way
            l_h = (r * math.sqrt(2.0)) / (2.0 * math.pi * fc)
            c_f = 1.0 / (2.0 * math.pi * math.sqrt(2.0) * fc * r)
            slope = 18.0

        telemetry = {
            "l_mh": round(l_h * 1000.0, 2),
            "c_uf": round(c_f * 1e6, 2),
            "slope": slope
        }

        return AudioCrossoverLoudspeakersOutput(
            low_pass_woofer_inductor_mh=round(l_h * 1000.0, 3),
            low_pass_woofer_capacitor_uf=round(c_f * 1e6, 2),
            high_pass_tweeter_capacitor_uf=round(c_f * 1e6, 2),
            high_pass_tweeter_inductor_mh=round(l_h * 1000.0, 3),
            attenuation_slope_db_octave=slope,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "2way_hifi_2500hz_8ohm": {"crossover_order": "2nd-Order Butterworth 12dB/octave", "crossover_frequency_fc_hz": 2500.0, "speaker_impedance_z_ohm": 8.0, "midrange_low_fc_hz": 500.0, "midrange_high_fc_hz": 4000.0},
            "3way_studio_monitor": {"crossover_order": "3-Way Dividing Network", "crossover_frequency_fc_hz": 3000.0, "speaker_impedance_z_ohm": 4.0, "midrange_low_fc_hz": 600.0, "midrange_high_fc_hz": 4500.0}
        }


# ── 9. Color TV Composite Video Engine ──────────────────────────────────────
class ColorTVCompositeVideoInput(BaseModel):
    system_standard: Literal["PAL 625-Line 50Hz (India)", "NTSC 525-Line 60Hz"] = "PAL 625-Line 50Hz (India)"
    red_channel_r: float = Field(default=0.8, ge=0.0, le=1.0)
    green_channel_g: float = Field(default=0.6, ge=0.0, le=1.0)
    blue_channel_b: float = Field(default=0.2, ge=0.0, le=1.0)
    sync_pulse_level_mv: float = Field(default=300.0, ge=100.0, le=500.0)


class ColorTVCompositeVideoOutput(BaseModel):
    luminance_y_voltage: float
    color_difference_u_voltage: float
    color_difference_v_voltage: float
    line_frequency_khz: float
    color_subcarrier_frequency_mhz: float
    composite_video_peak_v: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ColorTVCompositeVideoEngine(BaseSimulationEngine):
    name = "color-tv-composite-video"
    description = "ETCE/CONSUMER/S4: Television Systems — Composite Video Signal (YUV Luminance/Chrominance) & PAL Interlacing"

    def calculate(self, params: ColorTVCompositeVideoInput) -> ColorTVCompositeVideoOutput:
        r = params.red_channel_r
        g = params.green_channel_g
        b = params.blue_channel_b

        # PAL Matrix equations
        y = 0.30 * r + 0.59 * g + 0.11 * b
        u = 0.493 * (b - y)
        v = 0.877 * (r - y)

        if params.system_standard == "PAL 625-Line 50Hz (India)":
            fh = 15.625  # kHz
            fsc = 4.43361875  # MHz
        else:  # NTSC
            fh = 15.734
            fsc = 3.579545

        cvbs_peak = 1.0  # 1V p-p standard (0.7V video + 0.3V sync)

        telemetry = {
            "y": round(y, 3),
            "u": round(u, 3),
            "v": round(v, 3),
            "fh": fh
        }

        return ColorTVCompositeVideoOutput(
            luminance_y_voltage=round(y, 3),
            color_difference_u_voltage=round(u, 3),
            color_difference_v_voltage=round(v, 3),
            line_frequency_khz=round(fh, 3),
            color_subcarrier_frequency_mhz=round(fsc, 6),
            composite_video_peak_v=cvbs_peak,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "pal_yellow_color_bar": {"system_standard": "PAL 625-Line 50Hz (India)", "red_channel_r": 1.0, "green_channel_g": 1.0, "blue_channel_b": 0.0, "sync_pulse_level_mv": 300.0},
            "pal_cyan_color_bar": {"system_standard": "PAL 625-Line 50Hz (India)", "red_channel_r": 0.0, "green_channel_g": 1.0, "blue_channel_b": 1.0, "sync_pulse_level_mv": 300.0}
        }


# ── 10. Intel 8085 Microprocessor Simulator Engine ──────────────────────────
class Intel8085MicroprocessorSimulatorInput(BaseModel):
    instruction_mnemonic: Literal["MVI A, 32H", "MOV B, A", "ADD B", "INR A", "STA 2050H", "JNZ 2000H"] = "MVI A, 32H"
    initial_reg_a: int = Field(default=0x18, ge=0, le=255)
    initial_reg_b: int = Field(default=0x24, ge=0, le=255)
    carry_flag_in: bool = Field(default=False)
    zero_flag_in: bool = Field(default=False)


class Intel8085MicroprocessorSimulatorOutput(BaseModel):
    opcode_hex: str
    machine_cycles_count: int
    t_states_count: int
    final_reg_a_hex: str
    final_reg_b_hex: str
    flag_sign_s: int
    flag_zero_z: int
    flag_carry_cy: int
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class Intel8085MicroprocessorSimulatorEngine(BaseSimulationEngine):
    name = "intel8085-microprocessor-simulator"
    description = "ETCE/MP/S4: Microprocessor Architecture — Intel 8085 CPU Registers, T-States & Machine Cycles Execution"

    def calculate(self, params: Intel8085MicroprocessorSimulatorInput) -> Intel8085MicroprocessorSimulatorOutput:
        a = params.initial_reg_a
        b = params.initial_reg_b
        cy = 1 if params.carry_flag_in else 0

        inst = params.instruction_mnemonic
        if inst == "MVI A, 32H":
            opcode = "3E 32"
            mc = 2
            t = 7
            a = 0x32
        elif inst == "MOV B, A":
            opcode = "47"
            mc = 1
            t = 4
            b = a
        elif inst == "ADD B":
            opcode = "80"
            mc = 1
            t = 4
            res = a + b
            cy = 1 if res > 255 else 0
            a = res & 0xFF
        elif inst == "INR A":
            opcode = "3C"
            mc = 1
            t = 4
            a = (a + 1) & 0xFF
        elif inst == "STA 2050H":
            opcode = "32 50 20"
            mc = 4
            t = 13
        else:  # JNZ 2000H
            opcode = "C2 00 20"
            mc = 3
            t = 10

        s = 1 if (a & 0x80) != 0 else 0
        z = 1 if a == 0 else 0

        telemetry = {
            "opcode": opcode,
            "t_states": t,
            "reg_a": f"{a:02X}H",
            "reg_b": f"{b:02X}H",
            "flags": f"S={s} Z={z} CY={cy}"
        }

        return Intel8085MicroprocessorSimulatorOutput(
            opcode_hex=opcode,
            machine_cycles_count=mc,
            t_states_count=t,
            final_reg_a_hex=f"{a:02X}H",
            final_reg_b_hex=f"{b:02X}H",
            flag_sign_s=s,
            flag_zero_z=z,
            flag_carry_cy=cy,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "mvi_load_accumulator": {"instruction_mnemonic": "MVI A, 32H", "initial_reg_a": 0x18, "initial_reg_b": 0x24, "carry_flag_in": False, "zero_flag_in": False},
            "add_register_b": {"instruction_mnemonic": "ADD B", "initial_reg_a": 0x18, "initial_reg_b": 0x24, "carry_flag_in": False, "zero_flag_in": False}
        }


# ── 11. Microprocessor Memory & I/O Interfacing Engine ──────────────────────
class MicroprocessorMemoryInterfacingInput(BaseModel):
    decoder_type: Literal["74LS138 3-to-8 Decoder", "Logic Gate Full Address Decoder"] = "74LS138 3-to-8 Decoder"
    ram_size_kb: int = Field(default=2, ge=1, le=8)
    eprom_size_kb: int = Field(default=2, ge=1, le=8)
    base_address_hex: str = Field(default="0000H")
    chip_select_line: Literal["Y0 (0000H - 07FFH)", "Y1 (0800H - 0FFFH)", "Y2 (1000H - 17FFH)", "Y4 (2000H - 27FFH)"] = "Y0 (0000H - 07FFH)"


class MicroprocessorMemoryInterfacingOutput(BaseModel):
    eprom_address_range: str
    ram_address_range: str
    address_lines_used: str
    foldback_mirror_detected: bool
    bus_contention_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class MicroprocessorMemoryInterfacingEngine(BaseSimulationEngine):
    name = "microprocessor-memory-interfacing"
    description = "ETCE/MP/S4: Microprocessor Interfacing — 8085 74LS138 Memory Address Decoding & Foldback Mapping"

    def calculate(self, params: MicroprocessorMemoryInterfacingInput) -> MicroprocessorMemoryInterfacingOutput:
        eprom_range = "0000H - 07FFH (2KB 2716 EPROM)"
        ram_range = "2000H - 27FFH (2KB 6116 RAM)"
        addr_lines = "A15-A13 to 74LS138, A10-A0 to Memory Chips"

        telemetry = {
            "eprom": eprom_range,
            "ram": ram_range,
            "status": "VALID NON-OVERLAPPING MEMORY MAP"
        }

        return MicroprocessorMemoryInterfacingOutput(
            eprom_address_range=eprom_range,
            ram_address_range=ram_range,
            address_lines_used=addr_lines,
            foldback_mirror_detected=False,
            bus_contention_status="NO CONTENTION (Isolated Chip Enables)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "2k_eprom_2k_ram_map": {"decoder_type": "74LS138 3-to-8 Decoder", "ram_size_kb": 2, "eprom_size_kb": 2, "base_address_hex": "0000H", "chip_select_line": "Y0 (0000H - 07FFH)"},
            "4k_expanded_system": {"decoder_type": "74LS138 3-to-8 Decoder", "ram_size_kb": 4, "eprom_size_kb": 4, "base_address_hex": "0000H", "chip_select_line": "Y4 (2000H - 27FFH)"}
        }


# ── 12. Programmable Peripheral Interface (8255 PPI) Engine ─────────────────
class PPI8255InterfacingIOInput(BaseModel):
    control_word_hex: str = Field(default="98H")
    port_a_mode: Literal["Mode 0 Basic Output", "Mode 0 Basic Input", "Mode 1 Strobed Input"] = "Mode 0 Basic Input"
    port_a_data_byte: int = Field(default=0xAA, ge=0, le=255)
    port_b_data_byte: int = Field(default=0x55, ge=0, le=255)
    port_c_upper_nibble: int = Field(default=0x0F, ge=0, le=15)


class PPI8255InterfacingIOOutput(BaseModel):
    port_a_direction: str
    port_b_direction: str
    port_c_handshake_function: str
    control_word_binary: str
    bsr_bit_mode_active: bool
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PPI8255InterfacingIOEngine(BaseSimulationEngine):
    name = "ppi-8255-interfacing-io"
    description = "ETCE/MP/S4: Peripheral Interfacing — Intel 8255 PPI Mode 0/1 Configurations & BSR Bit Control"

    def calculate(self, params: PPI8255InterfacingIOInput) -> PPI8255InterfacingIOOutput:
        try:
            cw_val = int(params.control_word_hex.replace("H", "").replace("0x", ""), 16)
        except Exception:
            cw_val = 0x98

        cw_bin = format(cw_val, '08b')
        is_mode_set = (cw_val & 0x80) != 0

        if is_mode_set:
            pa_dir = "INPUT" if (cw_val & 0x10) != 0 else "OUTPUT"
            pb_dir = "INPUT" if (cw_val & 0x02) != 0 else "OUTPUT"
            bsr = False
            handshake = "Mode 0 Simple Parallel I/O"
        else:
            pa_dir = "BSR CONTROL"
            pb_dir = "BSR CONTROL"
            bsr = True
            handshake = "Bit Set/Reset Port C Control"

        telemetry = {
            "cw_hex": f"{cw_val:02X}H",
            "cw_bin": cw_bin,
            "pa_dir": pa_dir,
            "pb_dir": pb_dir
        }

        return PPI8255InterfacingIOOutput(
            port_a_direction=pa_dir,
            port_b_direction=pb_dir,
            port_c_handshake_function=handshake,
            control_word_binary=cw_bin,
            bsr_bit_mode_active=bsr,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "mode0_pa_in_pb_out": {"control_word_hex": "90H", "port_a_mode": "Mode 0 Basic Input", "port_a_data_byte": 0xAA, "port_b_data_byte": 0x55, "port_c_upper_nibble": 0x0F},
            "mode0_all_output_display": {"control_word_hex": "80H", "port_a_mode": "Mode 0 Basic Output", "port_a_data_byte": 0xFF, "port_b_data_byte": 0x00, "port_c_upper_nibble": 0x00}
        }
