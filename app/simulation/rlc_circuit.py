"""
AC RLC Series & Parallel Resonance Physics Engine
=================================================
Calculates inductive reactance XL, capacitive reactance XC, impedance Z,
resonant frequency f0, Quality factor Q, power factor cos(phi), and S/P/Q powers.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RlcCircuitInput(BaseModel):
    circuit_type: Literal["series", "parallel"] = Field(default="series", description="AC RLC topology")
    supply_voltage_rms: float = Field(default=230.0, ge=1.0, le=1000.0, description="AC Supply voltage V_rms in Volts")
    supply_frequency_hz: float = Field(default=50.0, ge=1.0, le=100000.0, description="AC Supply frequency f in Hz")
    resistance_ohms: float = Field(default=20.0, ge=0.1, le=10000.0, description="Resistance R in Ohms")
    inductance_mhenry: float = Field(default=150.0, ge=0.1, le=5000.0, description="Inductance L in mH")
    capacitance_ufarad: float = Field(default=50.0, ge=0.01, le=2000.0, description="Capacitance C in µF")


class RlcCircuitOutput(BaseModel):
    circuit_type: str
    inductive_reactance_ohms: float
    capacitive_reactance_ohms: float
    impedance_ohms: float
    phase_angle_deg: float
    resonant_frequency_hz: float
    quality_factor_q: float
    current_rms_amperes: float
    power_factor: float
    real_power_watts: float
    reactive_power_var: float
    apparent_power_va: float
    status_note: str


class RlcCircuitEngine(BaseSimulationEngine):
    name = "rlc-circuit"
    description = "AC RLC series & parallel resonance: impedance Z, phase angle phi, power factor, and S/P/Q power components"

    def calculate(self, params: RlcCircuitInput) -> RlcCircuitOutput:
        v = params.supply_voltage_rms
        f = params.supply_frequency_hz
        r = params.resistance_ohms
        l_h = params.inductance_mhenry / 1000.0
        c_f = params.capacitance_ufarad / 1e6

        omega = 2.0 * math.pi * f
        x_l = omega * l_h
        x_c = 1.0 / (omega * c_f) if (omega * c_f) > 0 else 0.0

        # Resonant Frequency f0 = 1 / (2 * pi * sqrt(L * C))
        f0_hz = 1.0 / (2.0 * math.pi * math.sqrt(l_h * c_f)) if (l_h * c_f) > 0 else 50.0

        # Quality factor Q = (1/R) * sqrt(L/C) for series
        q_factor = (1.0 / r) * math.sqrt(l_h / c_f) if r > 0 and c_f > 0 else 0.0

        if params.circuit_type == "series":
            x_net = x_l - x_c
            z_val = math.sqrt((r ** 2) + (x_net ** 2))
            phi_rad = math.atan2(x_net, r)
            type_title = "Series RLC Circuit"
        else: # parallel
            g = 1.0 / r if r > 0 else 0.0
            b_net = (1.0 / x_c if x_c > 0 else 0.0) - (1.0 / x_l if x_l > 0 else 0.0)
            y_val = math.sqrt((g ** 2) + (b_net ** 2))
            z_val = 1.0 / y_val if y_val > 0 else 0.0
            phi_rad = math.atan2(b_net, g)
            type_title = "Parallel RLC Circuit"

        phi_deg = math.degrees(phi_rad)
        pf = math.cos(phi_rad)

        i_rms = v / z_val if z_val > 0 else 0.0
        s_va = v * i_rms
        p_w = s_va * pf
        q_var = s_va * math.sin(abs(phi_rad))

        if math.isclose(f, f0_hz, rel_tol=0.02):
            res_status = "AT RESONANCE (Unity Power Factor cosφ = 1.0)"
        elif f < f0_hz:
            res_status = "CAPACITIVE DOMINATED (Leading Current)" if params.circuit_type == "series" else "INDUCTIVE DOMINATED"
        else:
            res_status = "INDUCTIVE DOMINATED (Lagging Current)" if params.circuit_type == "series" else "CAPACITIVE DOMINATED"

        note = (
            f"{type_title} (f = {f:.0f} Hz): Impedance Z = {z_val:.1f} Ω (XL = {x_l:.1f} Ω, XC = {x_c:.1f} Ω) | "
            f"Current I = {i_rms:.2f} A | Resonant Freq f0 = {f0_hz:.1f} Hz (pf = {pf:.3f} — {res_status})."
        )

        return RlcCircuitOutput(
            circuit_type=type_title,
            inductive_reactance_ohms=float(x_l),
            capacitive_reactance_ohms=float(x_c),
            impedance_ohms=float(z_val),
            phase_angle_deg=float(phi_deg),
            resonant_frequency_hz=float(f0_hz),
            quality_factor_q=float(q_factor),
            current_rms_amperes=float(i_rms),
            power_factor=float(pf),
            real_power_watts=float(p_w),
            reactive_power_var=float(q_var),
            apparent_power_va=float(s_va),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "series_resonance_50hz": {
                "name": "AC Mains 50Hz Series RLC Circuit",
                "params": {"circuit_type": "series", "supply_voltage_rms": 230.0, "supply_frequency_hz": 50.0, "resistance_ohms": 20.0, "inductance_mhenry": 150.0, "capacitance_ufarad": 50.0}
            },
            "tuned_radio_receiver": {
                "name": "Tuned Radio Receiver Resonant Filter",
                "params": {"circuit_type": "series", "supply_voltage_rms": 5.0, "supply_frequency_hz": 1000.0, "resistance_ohms": 10.0, "inductance_mhenry": 5.0, "capacitance_ufarad": 5.0}
            }
        }
