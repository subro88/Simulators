"""
BJT Transistor DC Biasing & Small-Signal Amplifier Physics Engine
===================================================================
Calculates base current IB, collector current IC, Q-point (VCE, IC),
transconductance gm, voltage gain Av, and saturation/cutoff operating region.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BjtTransistorInput(BaseModel):
    vcc_supply_volts: float = Field(default=12.0, ge=3.0, le=50.0, description="DC Supply voltage VCC in Volts")
    beta_current_gain: float = Field(default=100.0, ge=10.0, le=500.0, description="Transistor DC current gain beta (hFE)")
    base_resistor_rb_kohm: float = Field(default=220.0, ge=1.0, le=2000.0, description="Base biasing resistor RB in kΩ")
    collector_resistor_rc_kohm: float = Field(default=2.2, ge=0.1, le=50.0, description="Collector resistor RC in kΩ")
    emitter_resistor_re_ohm: float = Field(default=470.0, ge=0.0, le=5000.0, description="Emitter stabilizing resistor RE in Ω")


class BjtTransistorOutput(BaseModel):
    operating_region: str
    base_current_ua: float
    collector_current_ma: float
    collector_emitter_vce_volts: float
    transconductance_mS: float
    small_signal_voltage_gain_av: float
    power_dissipation_mw: float
    status_note: str


class BjtTransistorEngine(BaseSimulationEngine):
    name = "bjt-transistor"
    description = "Common-emitter NPN BJT amplifier DC load line Q-point (VCE, IC), transconductance gm, and voltage gain Av"

    def calculate(self, params: BjtTransistorInput) -> BjtTransistorOutput:
        vcc = params.vcc_supply_volts
        beta = params.beta_current_gain
        rb = params.base_resistor_rb_kohm * 1000.0
        rc = params.collector_resistor_rc_kohm * 1000.0
        re = params.emitter_resistor_re_ohm
        vbe = 0.7  # Silicon VBE drop

        # Base current IB = (VCC - VBE) / (RB + (beta + 1) * RE)
        denom_b = rb + ((beta + 1.0) * re)
        i_b_amp = (vcc - vbe) / denom_b if (vcc > vbe and denom_b > 0) else 0.0
        i_b_ua = i_b_amp * 1e6

        # Active mode IC = beta * IB
        i_c_active = beta * i_b_amp
        v_ce_active = vcc - (i_c_active * (rc + re))

        if vcc <= vbe:
            region = "Cutoff Region (OFF State — Zero Current)"
            i_c_ma = 0.0
            v_ce = vcc
            a_v = 0.0
            g_m_ms = 0.0
        elif v_ce_active < 0.2:
            region = "Saturation Region (ON Switch — VCE(sat) ≈ 0.2V)"
            v_ce = 0.2
            i_c_ma = ((vcc - 0.2) / (rc + re)) * 1000.0 if (rc + re) > 0 else 0.0
            a_v = 0.0
            g_m_ms = 0.0
        else:
            region = "Active Linear Region (Amplifier Operation)"
            v_ce = v_ce_active
            i_c_ma = i_c_active * 1000.0
            vt_mv = 25.85
            g_m_ms = i_c_ma / vt_mv  # mS
            # Av ≈ -gm * RC
            a_v = - (g_m_ms / 1000.0) * rc

        p_diss_mw = v_ce * i_c_ma

        note = (
            f"NPN BJT Amplifier (β = {beta:.0f}): Q-Point (VCE = {v_ce:.2f} V, IC = {i_c_ma:.2f} mA) | "
            f"Base Current IB = {i_b_ua:.1f} µA | Voltage Gain Av = {a_v:.1f}x ({region})."
        )

        return BjtTransistorOutput(
            operating_region=region,
            base_current_ua=float(i_b_ua),
            collector_current_ma=float(i_c_ma),
            collector_emitter_vce_volts=float(v_ce),
            transconductance_mS=float(g_m_ms),
            small_signal_voltage_gain_av=float(a_v),
            power_dissipation_mw=float(p_diss_mw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "ce_amplifier_active_qpoint": {
                "name": "Common-Emitter Amplifier Q-Point (VCE = 6V)",
                "params": {"vcc_supply_volts": 12.0, "beta_current_gain": 100.0, "base_resistor_rb_kohm": 220.0, "collector_resistor_rc_kohm": 2.2, "emitter_resistor_re_ohm": 470.0}
            },
            "bjt_saturated_switch": {
                "name": "BJT Digital Saturated Relay Switch",
                "params": {"vcc_supply_volts": 12.0, "beta_current_gain": 100.0, "base_resistor_rb_kohm": 10.0, "collector_resistor_rc_kohm": 0.5, "emitter_resistor_re_ohm": 0.0}
            }
        }
