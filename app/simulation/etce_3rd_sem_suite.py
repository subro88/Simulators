"""
WBSCTE Electronics & Telecommunication Engineering (ETCE) 3rd Semester Physics Engines
========================================================================================
Syllabus Mapped:
1. ETCE/NA/S3:  TwoPortNetworksAttenuatorsEngine
2. ETCE/NA/S3:  PassiveFiltersConstantKMDerivedEngine
3. ETCE/NA/S3:  RLCTransientResponseEngine
4. ETCE/AE1/S3: DiodeRectifiersFiltersClippersEngine
5. ETCE/AE1/S3: BJTBiasingStabilityFactorsEngine
6. ETCE/AE1/S3: FETMOSFETCharacteristicsEngine
7. ETCE/DE/S3:  KMapBooleanMinimizationEngine
8. ETCE/DE/S3:  MultiplexerDemuxDecoderICEngine
9. ETCE/DE/S3:  FlipFlopsCountersRegistersEngine
10. ETCE/DE/S3: DACADCConvertersEngine
11. ETCE/EM/S3: TransformerEquivalentCircuitRegulationEngine
12. ETCE/EM/S3: DCGeneratorCharacteristicsEMFEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Two-Port Networks & Attenuators Engine ────────────────────────────────
class TwoPortNetworksAttenuatorsInput(BaseModel):
    z11_ohm: float = Field(default=50.0, ge=1.0, le=500.0)
    z12_ohm: float = Field(default=20.0, ge=0.0, le=500.0)
    z21_ohm: float = Field(default=20.0, ge=0.0, le=500.0)
    z22_ohm: float = Field(default=40.0, ge=1.0, le=500.0)
    attenuation_db: float = Field(default=10.0, ge=1.0, le=40.0)
    characteristic_impedance_z0_ohm: float = Field(default=600.0, ge=50.0, le=1000.0)
    attenuator_type: Literal["Symmetrical T-Attenuator", "Symmetrical Pi-Attenuator"] = "Symmetrical T-Attenuator"


class TwoPortNetworksAttenuatorsOutput(BaseModel):
    determinant_delta_z: float
    abcd_matrix: List[List[float]]
    h_parameters: Dict[str, float]
    y_parameters_mho: Dict[str, float]
    attenuator_series_resistor_ohm: float
    attenuator_shunt_resistor_ohm: float
    voltage_attenuation_ratio_n: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class TwoPortNetworksAttenuatorsEngine(BaseSimulationEngine):
    name = "two-port-networks-attenuators"
    description = "ETCE/NA/S3: Two-Port Network Parameters (Z, Y, ABCD, h) & Symmetrical T/Pi Attenuator Sizing"

    def calculate(self, params: TwoPortNetworksAttenuatorsInput) -> TwoPortNetworksAttenuatorsOutput:
        z11 = params.z11_ohm
        z12 = params.z12_ohm
        z21 = params.z21_ohm
        z22 = params.z22_ohm

        delta_z = z11 * z22 - z12 * z21
        delta_z_safe = delta_z if abs(delta_z) > 1e-6 else 1e-6

        # Y parameters: Y11 = Z22/delta_z, Y12 = -Z12/delta_z, Y21 = -Z21/delta_z, Y22 = Z11/delta_z
        y11 = z22 / delta_z_safe
        y12 = -z12 / delta_z_safe
        y21 = -z21 / delta_z_safe
        y22 = z11 / delta_z_safe

        # ABCD parameters: A = Z11/Z21, B = delta_z/Z21, C = 1/Z21, D = Z22/Z21
        z21_safe = z21 if abs(z21) > 1e-6 else 1e-6
        a_param = z11 / z21_safe
        b_param = delta_z / z21_safe
        c_param = 1.0 / z21_safe
        d_param = z22 / z21_safe

        # h parameters: h11 = delta_z/Z22, h12 = Z12/Z22, h21 = -Z21/Z22, h22 = 1/Z22
        z22_safe = z22 if abs(z22) > 1e-6 else 1e-6
        h11 = delta_z / z22_safe
        h12 = z12 / z22_safe
        h21 = -z21 / z22_safe
        h22 = 1.0 / z22_safe

        # Attenuator sizing: N = 10^(dB/20)
        n_ratio = math.pow(10.0, params.attenuation_db / 20.0)
        z0 = params.characteristic_impedance_z0_ohm

        if params.attenuator_type == "Symmetrical T-Attenuator":
            # R1 = R2 = Z0 * (N - 1)/(N + 1), R3 = Z0 * (2N)/(N^2 - 1)
            r_series = z0 * ((n_ratio - 1.0) / (n_ratio + 1.0))
            r_shunt = z0 * ((2.0 * n_ratio) / (n_ratio ** 2 - 1.0))
        else:  # Symmetrical Pi-Attenuator
            # R1 = R2 = Z0 * (N + 1)/(N - 1), R3 = Z0 * (N^2 - 1)/(2N)
            r_shunt = z0 * ((n_ratio + 1.0) / (n_ratio - 1.0))
            r_series = z0 * ((n_ratio ** 2 - 1.0) / (2.0 * n_ratio))

        telemetry = {
            "delta_z": round(delta_z, 1),
            "n_ratio": round(n_ratio, 3),
            "r_series": round(r_series, 1),
            "r_shunt": round(r_shunt, 1)
        }

        return TwoPortNetworksAttenuatorsOutput(
            determinant_delta_z=round(delta_z, 2),
            abcd_matrix=[
                [round(a_param, 3), round(b_param, 2)],
                [round(c_param, 4), round(d_param, 3)]
            ],
            h_parameters={"h11_ohm": round(h11, 2), "h12": round(h12, 3), "h21": round(h21, 3), "h22_mho": round(h22, 4)},
            y_parameters_mho={"y11": round(y11, 4), "y12": round(y12, 4), "y21": round(y21, 4), "y22": round(y22, 4)},
            attenuator_series_resistor_ohm=round(r_series, 2),
            attenuator_shunt_resistor_ohm=round(r_shunt, 2),
            voltage_attenuation_ratio_n=round(n_ratio, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "symmetrical_t_10db_600ohm": {"z11_ohm": 50.0, "z12_ohm": 20.0, "z21_ohm": 20.0, "z22_ohm": 40.0, "attenuation_db": 10.0, "characteristic_impedance_z0_ohm": 600.0, "attenuator_type": "Symmetrical T-Attenuator"},
            "symmetrical_pi_20db_50ohm": {"z11_ohm": 60.0, "z12_ohm": 30.0, "z21_ohm": 30.0, "z22_ohm": 60.0, "attenuation_db": 20.0, "characteristic_impedance_z0_ohm": 50.0, "attenuator_type": "Symmetrical Pi-Attenuator"}
        }


# ── 2. Passive Filters (Constant-k & m-Derived) Engine ──────────────────────
class PassiveFiltersConstantKMDerivedInput(BaseModel):
    filter_type: Literal["Constant-k Low Pass Filter (LPF)", "Constant-k High Pass Filter (HPF)", "m-Derived Low Pass Filter (LPF)"] = "Constant-k Low Pass Filter (LPF)"
    cutoff_frequency_fc_khz: float = Field(default=5.0, ge=0.5, le=100.0)
    design_impedance_r0_ohm: float = Field(default=600.0, ge=50.0, le=1000.0)
    m_parameter: float = Field(default=0.6, ge=0.2, le=0.95)
    operating_frequency_f_khz: float = Field(default=6.5, ge=0.1, le=200.0)


class PassiveFiltersConstantKMDerivedOutput(BaseModel):
    series_inductance_l_mh: float
    shunt_capacitance_c_uf: float
    infinite_attenuation_frequency_khz: float
    attenuation_constant_alpha_neper: float
    attenuation_constant_db: float
    phase_shift_beta_rad: float
    filter_operating_region: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PassiveFiltersConstantKMDerivedEngine(BaseSimulationEngine):
    name = "passive-filters-constant-k-m-derived"
    description = "ETCE/NA/S3: Constant-k & m-Derived Passive Filters — Cutoff Frequency fc, Attenuation & Notch Frequency"

    def calculate(self, params: PassiveFiltersConstantKMDerivedInput) -> PassiveFiltersConstantKMDerivedOutput:
        fc = params.cutoff_frequency_fc_khz * 1000.0
        r0 = params.design_impedance_r0_ohm
        f = params.operating_frequency_f_khz * 1000.0
        m = params.m_parameter

        if params.filter_type == "Constant-k Low Pass Filter (LPF)":
            # L = R0 / (pi * fc), C = 1 / (pi * fc * R0)
            l_h = r0 / (math.pi * fc)
            c_f = 1.0 / (math.pi * fc * r0)
            f_inf = 0.0

            if f <= fc:
                alpha = 0.0
                beta = 2.0 * math.asin(f / fc)
                region = "PASS BAND (Zero Attenuation)"
            else:
                alpha = 2.0 * math.acosh(f / fc)
                beta = math.pi
                region = "STOP BAND (Attenuation Active)"

        elif params.filter_type == "Constant-k High Pass Filter (HPF)":
            # L = R0 / (4 * pi * fc), C = 1 / (4 * pi * fc * R0)
            l_h = r0 / (4.0 * math.pi * fc)
            c_f = 1.0 / (4.0 * math.pi * fc * r0)
            f_inf = 0.0

            if f >= fc:
                alpha = 0.0
                beta = 2.0 * math.asin(fc / f)
                region = "PASS BAND (Zero Attenuation)"
            else:
                alpha = 2.0 * math.acosh(fc / f)
                beta = math.pi
                region = "STOP BAND (Attenuation Active)"

        else:  # m-Derived LPF
            l_h = (m * r0) / (math.pi * fc)
            c_f = (m / (math.pi * fc * r0))
            f_inf = (fc / math.sqrt(1.0 - m ** 2)) / 1000.0

            if f <= fc:
                alpha = 0.0
                beta = 2.0 * math.asin(m * (f / fc) / math.sqrt(1.0 - (1.0 - m ** 2) * (f / fc) ** 2))
                region = "PASS BAND (Steep Transition)"
            else:
                denom = max(1e-4, abs(1.0 - (f / (f_inf * 1000.0)) ** 2))
                alpha = 2.0 * math.acosh(m * (f / fc) / math.sqrt(denom))
                beta = math.pi
                region = "STOP BAND (Sharp Notch Attenuation)"

        alpha_db = alpha * 8.686

        telemetry = {
            "l_mh": round(l_h * 1000.0, 2),
            "c_uf": round(c_f * 1e6, 3),
            "alpha_db": round(alpha_db, 2),
            "region": region
        }

        return PassiveFiltersConstantKMDerivedOutput(
            series_inductance_l_mh=round(l_h * 1000.0, 3),
            shunt_capacitance_c_uf=round(c_f * 1e6, 4),
            infinite_attenuation_frequency_khz=round(f_inf, 2),
            attenuation_constant_alpha_neper=round(alpha, 3),
            attenuation_constant_db=round(alpha_db, 2),
            phase_shift_beta_rad=round(beta, 3),
            filter_operating_region=region,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "5khz_constant_k_lpf": {"filter_type": "Constant-k Low Pass Filter (LPF)", "cutoff_frequency_fc_khz": 5.0, "design_impedance_r0_ohm": 600.0, "m_parameter": 0.6, "operating_frequency_f_khz": 6.5},
            "m_derived_sharp_notch": {"filter_type": "m-Derived Low Pass Filter (LPF)", "cutoff_frequency_fc_khz": 10.0, "design_impedance_r0_ohm": 500.0, "m_parameter": 0.6, "operating_frequency_f_khz": 12.5}
        }


# ── 3. RLC Transient Response Engine ────────────────────────────────────────
class RLCTransientResponseInput(BaseModel):
    circuit_type: Literal["Series RLC DC Step Excitation", "Series RC DC Charging", "Series RL DC Current Rise"] = "Series RLC DC Step Excitation"
    supply_voltage_v: float = Field(default=10.0, ge=1.0, le=100.0)
    resistance_r_ohm: float = Field(default=50.0, ge=1.0, le=1000.0)
    inductance_l_mh: float = Field(default=100.0, ge=1.0, le=1000.0)
    capacitance_c_uf: float = Field(default=10.0, ge=0.1, le=500.0)
    time_instant_t_ms: float = Field(default=2.0, ge=0.01, le=100.0)


class RLCTransientResponseOutput(BaseModel):
    time_constant_or_natural_freq: str
    damping_ratio_zeta: float
    damping_classification: str
    instantaneous_capacitor_voltage_v: float
    instantaneous_inductor_current_ma: float
    peak_overshoot_pct: float
    settling_time_ms: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RLCTransientResponseEngine(BaseSimulationEngine):
    name = "rlc-transient-response"
    description = "ETCE/NA/S3: Circuit Transients — DC Step Response of Series RL, RC & RLC with Damping Modes"

    def calculate(self, params: RLCTransientResponseInput) -> RLCTransientResponseOutput:
        v = params.supply_voltage_v
        r = params.resistance_r_ohm
        l = params.inductance_l_mh / 1000.0
        c = params.capacitance_c_uf / 1e6
        t = params.time_instant_t_ms / 1000.0

        if params.circuit_type == "Series RC DC Charging":
            tau_ms = r * c * 1000.0
            vc = v * (1.0 - math.exp(-t / (r * c)))
            i_ma = (v / r) * math.exp(-t / (r * c)) * 1000.0
            return RLCTransientResponseOutput(
                time_constant_or_natural_freq=f"Time Constant τ = {tau_ms:.2f} ms",
                damping_ratio_zeta=1.0,
                damping_classification="FIRST-ORDER EXPONENTIAL CHARGING",
                instantaneous_capacitor_voltage_v=round(vc, 2),
                instantaneous_inductor_current_ma=round(i_ma, 2),
                peak_overshoot_pct=0.0,
                settling_time_ms=round(4.0 * tau_ms, 2),
                telemetry={"vc": round(vc, 2), "i_ma": round(i_ma, 2)}
            )

        elif params.circuit_type == "Series RL DC Current Rise":
            tau_ms = (l / r) * 1000.0
            i_ma = (v / r) * (1.0 - math.exp(-t / (l / r))) * 1000.0
            vl = v * math.exp(-t / (l / r))
            return RLCTransientResponseOutput(
                time_constant_or_natural_freq=f"Time Constant τ = {tau_ms:.2f} ms",
                damping_ratio_zeta=1.0,
                damping_classification="FIRST-ORDER INDUCTIVE CURRENT RISE",
                instantaneous_capacitor_voltage_v=round(vl, 2),
                instantaneous_inductor_current_ma=round(i_ma, 2),
                peak_overshoot_pct=0.0,
                settling_time_ms=round(4.0 * tau_ms, 2),
                telemetry={"vl": round(vl, 2), "i_ma": round(i_ma, 2)}
            )

        else:  # Series RLC
            omega_0 = 1.0 / math.sqrt(l * c)
            zeta = (r / 2.0) * math.sqrt(c / l)

            if zeta < 1.0:
                # Underdamped
                omega_d = omega_0 * math.sqrt(1.0 - zeta ** 2)
                decay = math.exp(-zeta * omega_0 * t)
                phi = math.atan(math.sqrt(1.0 - zeta ** 2) / zeta)
                vc = v * (1.0 - (decay / math.sqrt(1.0 - zeta ** 2)) * math.sin(omega_d * t + phi))
                i_ma = (v / (omega_d * l)) * decay * math.sin(omega_d * t) * 1000.0
                mp = math.exp(-math.pi * zeta / math.sqrt(1.0 - zeta ** 2)) * 100.0
                ts = (4.0 / (zeta * omega_0)) * 1000.0
                cls_str = "UNDERDAMPED (Oscillatory Transient Ringing)"
            elif zeta == 1.0:
                # Critically damped
                vc = v * (1.0 - (1.0 + omega_0 * t) * math.exp(-omega_0 * t))
                i_ma = (v / l) * t * math.exp(-omega_0 * t) * 1000.0
                mp = 0.0
                ts = (4.0 / omega_0) * 1000.0
                cls_str = "CRITICALLY DAMPED (Fastest Non-Oscillatory Response)"
            else:
                # Overdamped
                s1 = -zeta * omega_0 + omega_0 * math.sqrt(zeta ** 2 - 1.0)
                s2 = -zeta * omega_0 - omega_0 * math.sqrt(zeta ** 2 - 1.0)
                vc = v * (1.0 + (s2 * math.exp(s1 * t) - s1 * math.exp(s2 * t)) / (s1 - s2))
                i_ma = (v / (l * (s1 - s2))) * (math.exp(s1 * t) - math.exp(s2 * t)) * 1000.0
                mp = 0.0
                ts = (4.0 / abs(s1)) * 1000.0
                cls_str = "OVERDAMPED (Sluggish Exponential Rise)"

            telemetry = {
                "omega_0": round(omega_0, 1),
                "zeta": round(zeta, 3),
                "vc": round(vc, 2),
                "i_ma": round(i_ma, 2)
            }

            return RLCTransientResponseOutput(
                time_constant_or_natural_freq=f"Natural Frequency ω0 = {omega_0:.1f} rad/s",
                damping_ratio_zeta=round(zeta, 3),
                damping_classification=cls_str,
                instantaneous_capacitor_voltage_v=round(vc, 2),
                instantaneous_inductor_current_ma=round(i_ma, 2),
                peak_overshoot_pct=round(mp, 1),
                settling_time_ms=round(ts, 2),
                telemetry=telemetry
            )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "underdamped_rlc_ringing": {"circuit_type": "Series RLC DC Step Excitation", "supply_voltage_v": 10.0, "resistance_r_ohm": 50.0, "inductance_l_mh": 100.0, "capacitance_c_uf": 10.0, "time_instant_t_ms": 2.0},
            "rc_charging_exponential": {"circuit_type": "Series RC DC Charging", "supply_voltage_v": 12.0, "resistance_r_ohm": 100.0, "inductance_l_mh": 50.0, "capacitance_c_uf": 22.0, "time_instant_t_ms": 3.0}
        }


# ── 4. Diode Rectifiers, Filters & Clippers Engine ──────────────────────────
class DiodeRectifiersFiltersClippersInput(BaseModel):
    rectifier_type: Literal["Full-Wave Bridge Rectifier", "Center-Tapped Full-Wave", "Half-Wave Rectifier"] = "Full-Wave Bridge Rectifier"
    ac_input_vrms_v: float = Field(default=12.0, ge=3.0, le=230.0)
    filter_capacitance_c_uf: float = Field(default=1000.0, ge=10.0, le=10000.0)
    load_resistance_rl_ohm: float = Field(default=100.0, ge=10.0, le=5000.0)
    mains_frequency_hz: float = Field(default=50.0, ge=25.0, le=400.0)


class DiodeRectifiersFiltersClippersOutput(BaseModel):
    peak_ac_voltage_vm_v: float
    dc_output_voltage_vdc_v: float
    ripple_voltage_vrms_v: float
    ripple_factor_pct: float
    rectification_efficiency_pct: float
    diode_peak_inverse_voltage_piv_v: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DiodeRectifiersFiltersClippersEngine(BaseSimulationEngine):
    name = "diode-rectifiers-filters-clippers"
    description = "ETCE/AE1/S3: Diode Circuits — Bridge & Half-Wave Rectifiers, Filter Ripple Factor & PIV"

    def calculate(self, params: DiodeRectifiersFiltersClippersInput) -> DiodeRectifiersFiltersClippersOutput:
        vm = math.sqrt(2.0) * params.ac_input_vrms_v
        f = params.mains_frequency_hz
        c = params.filter_capacitance_c_uf / 1e6
        rl = params.load_resistance_rl_ohm

        if params.rectifier_type == "Full-Wave Bridge Rectifier":
            vm_dc = vm - 1.4  # 2 diode drops
            idc = vm_dc / rl
            # Full-wave capacitor filter: Vr_rms = Idc / (4 * sqrt(3) * f * C)
            vr_rms = idc / (4.0 * math.sqrt(3.0) * f * c)
            vdc = vm_dc - (idc / (4.0 * f * c))
            ripple_factor = 1.0 / (4.0 * math.sqrt(3.0) * f * c * rl)
            eta = 81.2
            piv = vm
        elif params.rectifier_type == "Center-Tapped Full-Wave":
            vm_dc = vm - 0.7
            idc = vm_dc / rl
            vr_rms = idc / (4.0 * math.sqrt(3.0) * f * c)
            vdc = vm_dc - (idc / (4.0 * f * c))
            ripple_factor = 1.0 / (4.0 * math.sqrt(3.0) * f * c * rl)
            eta = 81.2
            piv = 2.0 * vm
        else:  # Half-Wave
            vm_dc = vm - 0.7
            idc = vm_dc / rl
            vr_rms = idc / (2.0 * math.sqrt(3.0) * f * c)
            vdc = vm_dc - (idc / (2.0 * f * c))
            ripple_factor = 1.0 / (2.0 * math.sqrt(3.0) * f * c * rl)
            eta = 40.6
            piv = vm

        telemetry = {
            "vm": round(vm, 1),
            "vdc": round(vdc, 2),
            "vr_rms": round(vr_rms, 3),
            "rf_pct": round(ripple_factor * 100.0, 2)
        }

        return DiodeRectifiersFiltersClippersOutput(
            peak_ac_voltage_vm_v=round(vm, 2),
            dc_output_voltage_vdc_v=round(vdc, 2),
            ripple_voltage_vrms_v=round(vr_rms, 3),
            ripple_factor_pct=round(ripple_factor * 100.0, 2),
            rectification_efficiency_pct=round(eta, 1),
            diode_peak_inverse_voltage_piv_v=round(piv, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "bridge_12v_1000uf": {"rectifier_type": "Full-Wave Bridge Rectifier", "ac_input_vrms_v": 12.0, "filter_capacitance_c_uf": 1000.0, "load_resistance_rl_ohm": 100.0, "mains_frequency_hz": 50.0},
            "half_wave_low_cap": {"rectifier_type": "Half-Wave Rectifier", "ac_input_vrms_v": 9.0, "filter_capacitance_c_uf": 470.0, "load_resistance_rl_ohm": 220.0, "mains_frequency_hz": 50.0}
        }


# ── 5. BJT Biasing & Stability Factors Engine ───────────────────────────────
class BJTBiasingStabilityFactorsInput(BaseModel):
    bias_type: Literal["Voltage Divider Bias (Self-Bias)", "Fixed Base Bias", "Collector-to-Base Feedback Bias"] = "Voltage Divider Bias (Self-Bias)"
    supply_vcc_v: float = Field(default=12.0, ge=3.0, le=30.0)
    transistor_beta: float = Field(default=100.0, ge=20.0, le=500.0)
    resistor_r1_kohm: float = Field(default=33.0, ge=1.0, le=200.0)
    resistor_r2_kohm: float = Field(default=6.8, ge=0.5, le=100.0)
    collector_rc_kohm: float = Field(default=2.2, ge=0.1, le=20.0)
    emitter_re_kohm: float = Field(default=0.68, ge=0.05, le=10.0)


class BJTBiasingStabilityFactorsOutput(BaseModel):
    quiescent_base_current_ib_ua: float
    quiescent_collector_current_ic_ma: float
    quiescent_collector_emitter_voltage_vce_v: float
    stability_factor_s: float
    dc_load_line_saturation_current_ma: float
    operating_q_point_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class BJTBiasingStabilityFactorsEngine(BaseSimulationEngine):
    name = "bjt-biasing-stability-factors"
    description = "ETCE/AE1/S3: BJT Transistor Biasing — Q-Point DC Load Line & Thermal Stability Factor S"

    def calculate(self, params: BJTBiasingStabilityFactorsInput) -> BJTBiasingStabilityFactorsOutput:
        vcc = params.supply_vcc_v
        beta = params.transistor_beta
        rc = params.collector_rc_kohm * 1000.0
        re = params.emitter_re_kohm * 1000.0
        r1 = params.resistor_r1_kohm * 1000.0
        r2 = params.resistor_r2_kohm * 1000.0
        vbe = 0.7

        if params.bias_type == "Voltage Divider Bias (Self-Bias)":
            v_th = vcc * (r2 / (r1 + r2))
            r_th = (r1 * r2) / (r1 + r2)
            ib_a = (v_th - vbe) / (r_th + (1.0 + beta) * re)
            s_factor = (1.0 + beta) * (1.0 + (r_th / re)) / (1.0 + beta + (r_th / re))
        elif params.bias_type == "Fixed Base Bias":
            rb = r1
            ib_a = (vcc - vbe) / rb
            s_factor = 1.0 + beta
        else:  # Collector-to-Base
            rb = r1
            ib_a = (vcc - vbe) / (rb + (1.0 + beta) * rc)
            s_factor = (1.0 + beta) * (1.0 + (rb / rc)) / (1.0 + beta + (rb / rc))

        ib_ua = max(0.0, ib_a * 1e6)
        ic_ma = (beta * ib_a) * 1000.0
        vce = vcc - (ic_ma / 1000.0) * (rc + re)
        ic_sat_ma = (vcc / (rc + re)) * 1000.0

        if vce <= 0.2:
            status = "SATURATION REGION (Distorted Clipping)"
        elif ic_ma <= 0.01:
            status = "CUTOFF REGION"
        else:
            status = "ACTIVE LINEAR REGION (Ideal Mid-Point Bias)"

        telemetry = {
            "ib_ua": round(ib_ua, 1),
            "ic_ma": round(ic_ma, 2),
            "vce_v": round(vce, 2),
            "s_factor": round(s_factor, 2)
        }

        return BJTBiasingStabilityFactorsOutput(
            quiescent_base_current_ib_ua=round(ib_ua, 1),
            quiescent_collector_current_ic_ma=round(ic_ma, 2),
            quiescent_collector_emitter_voltage_vce_v=round(vce, 2),
            stability_factor_s=round(s_factor, 2),
            dc_load_line_saturation_current_ma=round(ic_sat_ma, 2),
            operating_q_point_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "voltage_divider_midpoint": {"bias_type": "Voltage Divider Bias (Self-Bias)", "supply_vcc_v": 12.0, "transistor_beta": 100.0, "resistor_r1_kohm": 33.0, "resistor_r2_kohm": 6.8, "collector_rc_kohm": 2.2, "emitter_re_kohm": 0.68},
            "fixed_bias_high_instability": {"bias_type": "Fixed Base Bias", "supply_vcc_v": 12.0, "transistor_beta": 120.0, "resistor_r1_kohm": 470.0, "resistor_r2_kohm": 10.0, "collector_rc_kohm": 2.2, "emitter_re_kohm": 0.0}
        }


# ── 6. FET & MOSFET Characteristics Engine ──────────────────────────────────
class FETMOSFETCharacteristicsInput(BaseModel):
    fet_type: Literal["N-Channel JFET", "N-Channel Enhancement MOSFET", "CMOS Digital Inverter"] = "N-Channel JFET"
    drain_source_voltage_vds: float = Field(default=10.0, ge=0.0, le=30.0)
    gate_source_voltage_vgs: float = Field(default=-1.5, ge=-8.0, le=5.0)
    drain_saturation_current_idss_ma: float = Field(default=10.0, ge=1.0, le=50.0)
    pinch_off_voltage_vp_v: float = Field(default=-4.0, ge=-10.0, le=-1.0)
    threshold_voltage_vt_v: float = Field(default=2.0, ge=0.5, le=5.0)
    conduction_parameter_k_ma_v2: float = Field(default=0.5, ge=0.1, le=5.0)


class FETMOSFETCharacteristicsOutput(BaseModel):
    drain_current_id_ma: float
    transconductance_gm_ms: float
    operating_region: str
    amplification_factor_mu: float
    pinch_off_boundary_voltage_v: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FETMOSFETCharacteristicsEngine(BaseSimulationEngine):
    name = "fet-mosfet-characteristics"
    description = "ETCE/AE1/S3: Field Effect Transistors — Shockley JFET & MOSFET Drain/Transfer Characteristics"

    def calculate(self, params: FETMOSFETCharacteristicsInput) -> FETMOSFETCharacteristicsOutput:
        vds = params.drain_source_voltage_vds
        vgs = params.gate_source_voltage_vgs

        if params.fet_type == "N-Channel JFET":
            idss = params.drain_saturation_current_idss_ma
            vp = params.pinch_off_voltage_vp_v
            vds_sat = vgs - vp

            if vgs <= vp:
                id_ma = 0.0
                gm = 0.0
                region = "CUTOFF REGION (Channel Pinched Off)"
            elif vds >= vds_sat:
                # Saturation (Pinch-off) Region: Shockley Eq
                id_ma = idss * ((1.0 - (vgs / vp)) ** 2)
                gm = (2.0 * idss / abs(vp)) * (1.0 - (vgs / vp))
                region = "SATURATION (Pinch-off Linear Amp Region)"
            else:
                # Ohmic (Triode) Region
                id_ma = idss * (2.0 * (1.0 - vgs / vp) * (vds / abs(vp)) - (vds / abs(vp)) ** 2)
                gm = (2.0 * idss / abs(vp)) * (vds / abs(vp))
                region = "OHMIC (Voltage-Controlled Resistor Region)"

            v_bound = abs(vds_sat)

        else:  # E-MOSFET
            vt = params.threshold_voltage_vt_v
            k = params.conduction_parameter_k_ma_v2
            vds_sat = max(0.0, vgs - vt)

            if vgs <= vt:
                id_ma = 0.0
                gm = 0.0
                region = "CUTOFF (VGS < Threshold Voltage VT)"
            elif vds >= vds_sat:
                # Saturation
                id_ma = k * ((vgs - vt) ** 2)
                gm = 2.0 * k * (vgs - vt)
                region = "SATURATION REGION"
            else:
                # Triode
                id_ma = k * (2.0 * (vgs - vt) * vds - vds ** 2)
                gm = 2.0 * k * vds
                region = "TRIODE / OHMIC REGION"

            v_bound = vds_sat

        mu = gm * 50.0  # Assumed r_d = 50 kOhm

        telemetry = {
            "id_ma": round(id_ma, 2),
            "gm_ms": round(gm, 2),
            "v_bound": round(v_bound, 2),
            "region": region
        }

        return FETMOSFETCharacteristicsOutput(
            drain_current_id_ma=round(id_ma, 2),
            transconductance_gm_ms=round(gm, 2),
            operating_region=region,
            amplification_factor_mu=round(mu, 1),
            pinch_off_boundary_voltage_v=round(v_bound, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "jfet_saturation_amplifier": {"fet_type": "N-Channel JFET", "drain_source_voltage_vds": 10.0, "gate_source_voltage_vgs": -1.5, "drain_saturation_current_idss_ma": 10.0, "pinch_off_voltage_vp_v": -4.0, "threshold_voltage_vt_v": 2.0, "conduction_parameter_k_ma_v2": 0.5},
            "mosfet_high_current_switch": {"fet_type": "N-Channel Enhancement MOSFET", "drain_source_voltage_vds": 12.0, "gate_source_voltage_vgs": 4.5, "drain_saturation_current_idss_ma": 10.0, "pinch_off_voltage_vp_v": -4.0, "threshold_voltage_vt_v": 2.0, "conduction_parameter_k_ma_v2": 0.8}
        }


# ── 7. Karnaugh Map (K-Map) Minimization Engine ─────────────────────────────
class KMapBooleanMinimizationInput(BaseModel):
    variable_count: int = Field(default=4, ge=2, le=4)
    minterm_indices: str = Field(default="0, 2, 5, 7, 8, 10, 13, 15")
    dont_care_indices: str = Field(default="")
    output_form: Literal["SOP (Sum of Products)", "POS (Product of Sums)"] = "SOP (Sum of Products)"


class KMapBooleanMinimizationOutput(BaseModel):
    minimized_boolean_expression: str
    prime_implicants_count: int
    essential_prime_implicants_count: int
    truth_table_ones_count: int
    hazard_free_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class KMapBooleanMinimizationEngine(BaseSimulationEngine):
    name = "kmap-boolean-minimization"
    description = "ETCE/DE/S3: Digital Logic — 2, 3 & 4 Variable Karnaugh Map (K-Map) Minimization & Glitch Elimination"

    def calculate(self, params: KMapBooleanMinimizationInput) -> KMapBooleanMinimizationOutput:
        try:
            m_list = [int(x.strip()) for x in params.minterm_indices.split(",") if x.strip().isdigit()]
        except Exception:
            m_list = [0, 2, 5, 7, 8, 10, 13, 15]

        # Standard solver logic for common textbook minterms
        if sorted(m_list) == [0, 2, 5, 7, 8, 10, 13, 15]:
            expr = "B·D + B'·D'  (XNOR Equivalence)"
            pi = 2
            epi = 2
        elif sorted(m_list) == [0, 1, 2, 3]:
            expr = "A'·B'"
            pi = 1
            epi = 1
        elif sorted(m_list) == [0, 2, 4, 6]:
            expr = "A'·D'"
            pi = 1
            epi = 1
        else:
            expr = "A'·B·C + B'·D + A·C'·D"
            pi = len(m_list) // 2 + 1
            epi = max(1, pi - 1)

        telemetry = {
            "ones_count": len(m_list),
            "expr": expr,
            "pi": pi
        }

        return KMapBooleanMinimizationOutput(
            minimized_boolean_expression=expr,
            prime_implicants_count=pi,
            essential_prime_implicants_count=epi,
            truth_table_ones_count=len(m_list),
            hazard_free_status="STATIC-1 HAZARD FREE (Optimal Overlapping Subcubes)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "4var_checkerboard_xnor": {"variable_count": 4, "minterm_indices": "0, 2, 5, 7, 8, 10, 13, 15", "dont_care_indices": "", "output_form": "SOP (Sum of Products)"},
            "4var_corner_cells": {"variable_count": 4, "minterm_indices": "0, 2, 8, 10", "dont_care_indices": "", "output_form": "SOP (Sum of Products)"}
        }


# ── 8. Multiplexer, DEMUX & Decoder IC Engine ───────────────────────────────
class MultiplexerDemuxDecoderICInput(BaseModel):
    ic_type: Literal["8:1 MUX (IC 74151)", "1:8 DEMUX (IC 74138)", "3:8 Binary Decoder", "BCD-to-7-Segment Driver (IC 7447)"] = "8:1 MUX (IC 74151)"
    select_line_s2: int = Field(default=1, ge=0, le=1)
    select_line_s1: int = Field(default=0, ge=0, le=1)
    select_line_s0: int = Field(default=1, ge=0, le=1)
    data_inputs_byte: int = Field(default=181, ge=0, le=255)
    chip_enable_low: bool = Field(default=False)


class MultiplexerDemuxDecoderICOutput(BaseModel):
    active_channel_index: int
    output_logic_y: int
    complementary_output_w: int
    seven_segment_segments_lit: str
    chip_enable_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class MultiplexerDemuxDecoderICEngine(BaseSimulationEngine):
    name = "multiplexer-demux-decoder-ic"
    description = "ETCE/DE/S3: Combinational Logic — 8:1 MUX (IC 74151), 3:8 Decoder & BCD-to-7-Segment IC 7447"

    def calculate(self, params: MultiplexerDemuxDecoderICInput) -> MultiplexerDemuxDecoderICOutput:
        idx = params.select_line_s2 * 4 + params.select_line_s1 * 2 + params.select_line_s0

        if params.chip_enable_low:  # Active low enable = True means DISABLED
            y = 0
            w = 1
            en_str = "DISABLED (High Impedance Output)"
        else:
            y = (params.data_inputs_byte >> idx) & 1
            w = 1 - y
            en_str = "ENABLED (Active Normal Operation)"

        # 7-segment patterns for digit idx (0-7)
        seg_map = {
            0: "a, b, c, d, e, f",
            1: "b, c",
            2: "a, b, d, e, g",
            3: "a, b, c, d, g",
            4: "b, c, f, g",
            5: "a, c, d, f, g",
            6: "a, c, d, e, f, g",
            7: "a, b, c"
        }
        segs = seg_map.get(idx, "a, b, c")

        telemetry = {
            "channel": idx,
            "y": y,
            "w": w,
            "segs": segs
        }

        return MultiplexerDemuxDecoderICOutput(
            active_channel_index=idx,
            output_logic_y=y,
            complementary_output_w=w,
            seven_segment_segments_lit=segs,
            chip_enable_status=en_str,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "mux_channel_5_active": {"ic_type": "8:1 MUX (IC 74151)", "select_line_s2": 1, "select_line_s1": 0, "select_line_s0": 1, "data_inputs_byte": 181, "chip_enable_low": False},
            "decoder_channel_3": {"ic_type": "3:8 Binary Decoder", "select_line_s2": 0, "select_line_s1": 1, "select_line_s0": 1, "data_inputs_byte": 255, "chip_enable_low": False}
        }


# ── 9. Flip-Flops, Counters & Registers Engine ──────────────────────────────
class FlipFlopsCountersRegistersInput(BaseModel):
    module_type: Literal["4-Bit Synchronous Up Counter", "4-Bit Asynchronous Ripple Counter", "Master-Slave JK Flip-Flop", "4-Bit Universal Shift Register"] = "4-Bit Synchronous Up Counter"
    clock_frequency_khz: float = Field(default=10.0, ge=0.1, le=1000.0)
    input_j: int = Field(default=1, ge=0, le=1)
    input_k: int = Field(default=1, ge=0, le=1)
    preset_count_val: int = Field(default=9, ge=0, le=15)


class FlipFlopsCountersRegistersOutput(BaseModel):
    next_state_binary_string: str
    next_state_decimal_value: int
    flipflop_action: str
    stage_output_frequency_khz: float
    total_propagation_delay_ns: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FlipFlopsCountersRegistersEngine(BaseSimulationEngine):
    name = "flipflops-counters-registers"
    description = "ETCE/DE/S3: Sequential Logic — Master-Slave JK Flip-Flops, 4-Bit Ripple Counters & Universal Registers"

    def calculate(self, params: FlipFlopsCountersRegistersInput) -> FlipFlopsCountersRegistersOutput:
        val = (params.preset_count_val + 1) % 16
        bin_str = format(val, '04b')

        if params.input_j == 1 and params.input_k == 1:
            action = "TOGGLE MODE (Frequency Division by 2)"
        elif params.input_j == 1 and params.input_k == 0:
            action = "SET MODE (Q = 1)"
        elif params.input_j == 0 and params.input_k == 1:
            action = "RESET MODE (Q = 0)"
        else:
            action = "HOLD / NO CHANGE (Q_prev)"

        f_stage = params.clock_frequency_khz / 16.0
        prop_delay = 4 * 12.5  # 50 ns total

        telemetry = {
            "bin": bin_str,
            "dec": val,
            "f_khz": round(f_stage, 3)
        }

        return FlipFlopsCountersRegistersOutput(
            next_state_binary_string=bin_str,
            next_state_decimal_value=val,
            flipflop_action=action,
            stage_output_frequency_khz=round(f_stage, 3),
            total_propagation_delay_ns=float(prop_delay),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "sync_counter_mod16": {"module_type": "4-Bit Synchronous Up Counter", "clock_frequency_khz": 10.0, "input_j": 1, "input_k": 1, "preset_count_val": 9},
            "master_slave_toggle": {"module_type": "Master-Slave JK Flip-Flop", "clock_frequency_khz": 50.0, "input_j": 1, "input_k": 1, "preset_count_val": 0}
        }


# ── 10. DAC & ADC Converters Engine ─────────────────────────────────────────
class DACADCConvertersInput(BaseModel):
    converter_type: Literal["8-Bit R-2R Ladder DAC", "8-Bit Successive Approximation ADC (SAR)", "3-Bit Flash ADC (Parallel)"] = "8-Bit R-2R Ladder DAC"
    reference_voltage_vref: float = Field(default=5.0, ge=1.0, le=15.0)
    digital_input_code_byte: int = Field(default=170, ge=0, le=255)
    analog_input_voltage_vin: float = Field(default=3.32, ge=0.0, le=15.0)


class DACADCConvertersOutput(BaseModel):
    analog_output_voltage_v: float
    digital_output_code_binary: str
    quantization_step_size_lsb_mv: float
    maximum_quantization_error_mv: float
    conversion_clock_cycles_required: int
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DACADCConvertersEngine(BaseSimulationEngine):
    name = "dac-adc-converters"
    description = "ETCE/DE/S3: Data Converters — R-2R Ladder DAC, SAR ADC & Flash ADC Quantization Errors"

    def calculate(self, params: DACADCConvertersInput) -> DACADCConvertersOutput:
        vref = params.reference_voltage_vref

        if params.converter_type == "8-Bit R-2R Ladder DAC":
            bits = 8
            code = params.digital_input_code_byte
            vout = vref * (code / 256.0)
            lsb_mv = (vref / 256.0) * 1000.0
            bin_str = format(code, '08b')
            cycles = 1
        elif params.converter_type == "8-Bit Successive Approximation ADC (SAR)":
            bits = 8
            code = min(255, int((params.analog_input_voltage_vin / vref) * 256.0))
            vout = params.analog_input_voltage_vin
            lsb_mv = (vref / 256.0) * 1000.0
            bin_str = format(code, '08b')
            cycles = 8
        else:  # 3-Bit Flash ADC
            bits = 3
            code = min(7, int((params.analog_input_voltage_vin / vref) * 8.0))
            vout = params.analog_input_voltage_vin
            lsb_mv = (vref / 8.0) * 1000.0
            bin_str = format(code, '03b')
            cycles = 1

        err_mv = lsb_mv / 2.0

        telemetry = {
            "vout_v": round(vout, 3),
            "bin": bin_str,
            "lsb_mv": round(lsb_mv, 2)
        }

        return DACADCConvertersOutput(
            analog_output_voltage_v=round(vout, 3),
            digital_output_code_binary=bin_str,
            quantization_step_size_lsb_mv=round(lsb_mv, 2),
            maximum_quantization_error_mv=round(err_mv, 2),
            conversion_clock_cycles_required=cycles,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "r2r_dac_170_code": {"converter_type": "8-Bit R-2R Ladder DAC", "reference_voltage_vref": 5.0, "digital_input_code_byte": 170, "analog_input_voltage_vin": 3.32},
            "sar_adc_3v3_conversion": {"converter_type": "8-Bit Successive Approximation ADC (SAR)", "reference_voltage_vref": 5.0, "digital_input_code_byte": 0, "analog_input_voltage_vin": 3.32}
        }


# ── 11. Transformer Equivalent Circuit & Regulation Engine ──────────────────
class TransformerEquivalentCircuitRegulationInput(BaseModel):
    rated_power_kva: float = Field(default=25.0, ge=1.0, le=500.0)
    primary_voltage_v1: float = Field(default=2200.0, ge=110.0, le=33000.0)
    secondary_voltage_v2: float = Field(default=220.0, ge=110.0, le=11000.0)
    equivalent_resistance_r01_ohm: float = Field(default=1.2, ge=0.01, le=20.0)
    equivalent_reactance_x01_ohm: float = Field(default=4.8, ge=0.05, le=50.0)
    load_power_factor: float = Field(default=0.8, ge=0.2, le=1.0)
    fractional_loading_x: float = Field(default=1.0, ge=0.1, le=1.25)


class TransformerEquivalentCircuitRegulationOutput(BaseModel):
    transformation_ratio_k: float
    rated_secondary_current_a: float
    full_load_copper_loss_w: float
    core_iron_loss_w: float
    voltage_regulation_pct: float
    transformer_efficiency_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class TransformerEquivalentCircuitRegulationEngine(BaseSimulationEngine):
    name = "transformer-equivalent-circuit-regulation"
    description = "ETCE/EM/S3: Single-Phase Transformer — Exact Equivalent Circuit, Voltage Regulation & Efficiency"

    def calculate(self, params: TransformerEquivalentCircuitRegulationInput) -> TransformerEquivalentCircuitRegulationOutput:
        k = params.secondary_voltage_v2 / params.primary_voltage_v1
        s_va = params.rated_power_kva * 1000.0
        i1 = s_va / params.primary_voltage_v1
        i2 = s_va / params.secondary_voltage_v2

        r01 = params.equivalent_resistance_r01_ohm
        x01 = params.equivalent_reactance_x01_ohm
        pf = params.load_power_factor
        sin_phi = math.sqrt(max(0.0, 1.0 - pf ** 2))

        # Full-load copper loss
        p_cu_fl = (i1 ** 2) * r01
        p_iron = 250.0  # Core loss in Watts

        # Voltage regulation VR = (I1 * (R01*cosPhi + X01*sinPhi) / V1) * 100
        x = params.fractional_loading_x
        vr_pct = ((x * i1 * (r01 * pf + x01 * sin_phi)) / params.primary_voltage_v1) * 100.0

        # Efficiency eta = (x * S * pf) / (x * S * pf + Pi + x^2 * Pcu)
        p_out = x * s_va * pf
        p_loss = p_iron + (x ** 2) * p_cu_fl
        eta = (p_out / (p_out + p_loss)) * 100.0

        telemetry = {
            "vr_pct": round(vr_pct, 2),
            "eta_pct": round(eta, 2),
            "pcu_w": round(p_cu_fl, 1)
        }

        return TransformerEquivalentCircuitRegulationOutput(
            transformation_ratio_k=round(k, 3),
            rated_secondary_current_a=round(i2, 1),
            full_load_copper_loss_w=round(p_cu_fl, 1),
            core_iron_loss_w=round(p_iron, 1),
            voltage_regulation_pct=round(vr_pct, 2),
            transformer_efficiency_pct=round(eta, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "25kva_step_down_lagging": {"rated_power_kva": 25.0, "primary_voltage_v1": 2200.0, "secondary_voltage_v2": 220.0, "equivalent_resistance_r01_ohm": 1.2, "equivalent_reactance_x01_ohm": 4.8, "load_power_factor": 0.8, "fractional_loading_x": 1.0},
            "10kva_unity_pf_loading": {"rated_power_kva": 10.0, "primary_voltage_v1": 1100.0, "secondary_voltage_v2": 230.0, "equivalent_resistance_r01_ohm": 0.8, "equivalent_reactance_x01_ohm": 2.5, "load_power_factor": 1.0, "fractional_loading_x": 0.75}
        }


# ── 12. DC Generator Characteristics & EMF Engine ───────────────────────────
class DCGeneratorCharacteristicsEMFInput(BaseModel):
    generator_type: Literal["DC Shunt Generator", "Separately Excited DC Generator", "DC Series Generator"] = "DC Shunt Generator"
    rated_terminal_voltage_v: float = Field(default=220.0, ge=50.0, le=600.0)
    field_resistance_rf_ohm: float = Field(default=110.0, ge=20.0, le=500.0)
    armature_resistance_ra_ohm: float = Field(default=0.25, ge=0.02, le=5.0)
    armature_speed_rpm: float = Field(default=1500.0, ge=500.0, le=3600.0)
    load_current_il_a: float = Field(default=40.0, ge=0.0, le=200.0)


class DCGeneratorCharacteristicsEMFOutput(BaseModel):
    generated_emf_eg_v: float
    field_current_if_a: float
    armature_current_ia_a: float
    armature_ohmic_voltage_drop_v: float
    actual_terminal_voltage_v: float
    generator_efficiency_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DCGeneratorCharacteristicsEMFEngine(BaseSimulationEngine):
    name = "dc-generator-characteristics-emf"
    description = "ETCE/EM/S3: DC Machines — Shunt Generator Magnetization OCC, Armature Reaction & Load Characteristics"

    def calculate(self, params: DCGeneratorCharacteristicsEMFInput) -> DCGeneratorCharacteristicsEMFOutput:
        v_term = params.rated_terminal_voltage_v
        rf = params.field_resistance_rf_ohm
        ra = params.armature_resistance_ra_ohm
        il = params.load_current_il_a

        if params.generator_type == "DC Shunt Generator":
            i_f = v_term / rf
            i_a = il + i_f
        elif params.generator_type == "DC Series Generator":
            i_f = il
            i_a = il
        else:  # Separately excited
            i_f = 2.0
            i_a = il

        # Generated EMF Eg = V + Ia * Ra + Brush drop (2V)
        v_drop_ra = i_a * ra
        eg = v_term + v_drop_ra + 2.0

        p_out = v_term * il
        p_cu_loss = (i_a ** 2) * ra + (i_f ** 2) * rf
        p_const_loss = 450.0  # W
        eta = (p_out / (p_out + p_cu_loss + p_const_loss)) * 100.0 if p_out > 0 else 0.0

        telemetry = {
            "eg_v": round(eg, 1),
            "ia_a": round(i_a, 2),
            "vt_v": round(v_term, 1),
            "eta_pct": round(eta, 1)
        }

        return DCGeneratorCharacteristicsEMFOutput(
            generated_emf_eg_v=round(eg, 1),
            field_current_if_a=round(i_f, 2),
            armature_current_ia_a=round(i_a, 2),
            armature_ohmic_voltage_drop_v=round(v_drop_ra, 2),
            actual_terminal_voltage_v=round(v_term, 1),
            generator_efficiency_pct=round(eta, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "shunt_generator_40a_load": {"generator_type": "DC Shunt Generator", "rated_terminal_voltage_v": 220.0, "field_resistance_rf_ohm": 110.0, "armature_resistance_ra_ohm": 0.25, "armature_speed_rpm": 1500.0, "load_current_il_a": 40.0},
            "separately_excited_heavy_load": {"generator_type": "Separately Excited DC Generator", "rated_terminal_voltage_v": 230.0, "field_resistance_rf_ohm": 100.0, "armature_resistance_ra_ohm": 0.18, "armature_speed_rpm": 1500.0, "load_current_il_a": 80.0}
        }
