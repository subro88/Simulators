"""
Rectifier Circuits & Capacitor Filters Physics Engine
=====================================================
Calculates peak voltage Vm, DC output voltage Vdc, peak-to-peak ripple Vr_pp,
ripple factor r, Peak Inverse Voltage PIV, and DC load current Idc.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RectifierCircuitInput(BaseModel):
    rectifier_type: Literal["full_wave_bridge", "half_wave", "center_tapped"] = Field(
        default="full_wave_bridge",
        description="Rectifier circuit topology"
    )
    ac_input_voltage_rms: float = Field(default=12.0, ge=1.0, le=440.0, description="AC Secondary RMS voltage V_rms in Volts")
    ac_frequency_hz: float = Field(default=50.0, ge=10.0, le=1000.0, description="AC Supply frequency f in Hz")
    filter_capacitance_uf: float = Field(default=1000.0, ge=0.0, le=50000.0, description="Filter capacitor C in µF (0 = Unfiltered)")
    load_resistor_ohms: float = Field(default=100.0, ge=5.0, le=10000.0, description="DC Load resistor RL in Ohms")


class RectifierCircuitOutput(BaseModel):
    rectifier_type: str
    peak_voltage_vm: float
    dc_output_voltage_v: float
    dc_load_current_ma: float
    ripple_voltage_pp_v: float
    ripple_factor: float
    peak_inverse_voltage_piv: float
    status_note: str


class RectifierCircuitEngine(BaseSimulationEngine):
    name = "rectifier-circuit"
    description = "AC to DC Rectifiers (Half-wave, Full-wave bridge) with Smoothing Capacitor Filters: Vdc, Ripple, and PIV"

    def calculate(self, params: RectifierCircuitInput) -> RectifierCircuitOutput:
        v_rms = params.ac_input_voltage_rms
        f = params.ac_frequency_hz
        c_farad = params.filter_capacitance_uf / 1e6
        rl = params.load_resistor_ohms

        v_m = v_rms * math.sqrt(2.0)

        if params.rectifier_type == "half_wave":
            piv = v_m
            v_drop = 0.7  # 1 diode drop
            v_m_eff = max(0.0, v_m - v_drop)
            f_ripple = f
            if c_farad > 0:
                # Filtered half-wave
                i_dc_est = v_m_eff / rl
                v_ripple_pp = i_dc_est / (f_ripple * c_farad) if (f_ripple * c_farad) > 0 else v_m_eff
                v_dc = max(0.0, v_m_eff - (v_ripple_pp / 2.0))
                r_factor = v_ripple_pp / (2.0 * math.sqrt(3.0) * v_dc) if v_dc > 0 else 1.21
            else:
                v_dc = v_m_eff / math.pi
                v_ripple_pp = v_m_eff
                r_factor = 1.21
            type_title = "Half-Wave Rectifier"

        else: # full_wave_bridge or center_tapped
            piv = 2.0 * v_m if params.rectifier_type == "center_tapped" else v_m
            v_drop = 1.4 if params.rectifier_type == "full_wave_bridge" else 0.7
            v_m_eff = max(0.0, v_m - v_drop)
            f_ripple = 2.0 * f
            if c_farad > 0:
                i_dc_est = v_m_eff / rl
                v_ripple_pp = i_dc_est / (f_ripple * c_farad) if (f_ripple * c_farad) > 0 else v_m_eff
                v_dc = max(0.0, v_m_eff - (v_ripple_pp / 2.0))
                r_factor = v_ripple_pp / (2.0 * math.sqrt(3.0) * v_dc) if v_dc > 0 else 0.482
            else:
                v_dc = (2.0 * v_m_eff) / math.pi
                v_ripple_pp = v_m_eff * 0.5
                r_factor = 0.482
            type_title = "Full-Wave Bridge Rectifier" if params.rectifier_type == "full_wave_bridge" else "Full-Wave Center-Tapped Rectifier"

        i_dc_ma = (v_dc / rl) * 1000.0 if rl > 0 else 0.0

        note = (
            f"{type_title} (V_rms = {v_rms:.1f} V, C = {params.filter_capacitance_uf:.0f} µF): "
            f"DC Output Vdc = {v_dc:.2f} V | Load Current Idc = {i_dc_ma:.1f} mA | "
            f"Ripple Voltage = {v_ripple_pp:.2f} V_pp (Ripple Factor = {r_factor:.3f}, PIV = {piv:.1f} V)."
        )

        return RectifierCircuitOutput(
            rectifier_type=type_title,
            peak_voltage_vm=float(v_m),
            dc_output_voltage_v=float(v_dc),
            dc_load_current_ma=float(i_dc_ma),
            ripple_voltage_pp_v=float(v_ripple_pp),
            ripple_factor=float(r_factor),
            peak_inverse_voltage_piv=float(piv),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "bridge_filtered_12v": {
                "name": "Full-Wave Bridge Rectifier with 1000µF Filter",
                "params": {"rectifier_type": "full_wave_bridge", "ac_input_voltage_rms": 12.0, "ac_frequency_hz": 50.0, "filter_capacitance_uf": 1000.0, "load_resistor_ohms": 100.0}
            },
            "unfiltered_half_wave": {
                "name": "Unfiltered Half-Wave AC Demodulator",
                "params": {"rectifier_type": "half_wave", "ac_input_voltage_rms": 12.0, "ac_frequency_hz": 50.0, "filter_capacitance_uf": 0.0, "load_resistor_ohms": 100.0}
            }
        }
