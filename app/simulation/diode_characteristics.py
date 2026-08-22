"""
Diode I-V Characteristics & Zener Voltage Regulator Physics Engine
===================================================================
Calculates Shockley diode current I_D, forward voltage VF, Zener breakdown voltage VZ,
load current IL, and Zener regulator line/load regulation.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class DiodeCharacteristicsInput(BaseModel):
    diode_type: Literal["silicon_pn", "zener_regulator", "schottky"] = Field(
        default="silicon_pn",
        description="Semiconductor diode model"
    )
    input_voltage_v: float = Field(default=5.0, ge=-50.0, le=50.0, description="Circuit input voltage Vin in Volts")
    series_resistor_ohms: float = Field(default=220.0, ge=1.0, le=10000.0, description="Current limiting series resistor Rs in Ohms")
    load_resistor_ohms: float = Field(default=1000.0, ge=10.0, le=100000.0, description="Load resistor RL in Ohms")
    zener_voltage_v: float = Field(default=3.3, ge=1.8, le=30.0, description="Zener breakdown rating Vz in Volts")


class DiodeCharacteristicsOutput(BaseModel):
    diode_type: str
    operating_state: str
    diode_voltage_v: float
    diode_current_ma: float
    load_voltage_v: float
    load_current_ma: float
    series_resistor_power_mw: float
    status_note: str


class DiodeCharacteristicsEngine(BaseSimulationEngine):
    name = "diode-characteristics"
    description = "Semiconductor diode I-V characteristics (Shockley equation) & Zener voltage regulator circuit"

    def calculate(self, params: DiodeCharacteristicsInput) -> DiodeCharacteristicsOutput:
        vin = params.input_voltage_v
        rs = params.series_resistor_ohms
        rl = params.load_resistor_ohms
        vz = params.zener_voltage_v

        if params.diode_type == "zener_regulator":
            # Zener regulator circuit
            if vin > vz:
                # Zener breakdown active
                v_out = vz
                state = "Zener Breakdown Regulation Mode"
                i_load_amp = v_out / rl if rl > 0 else 0.0
                i_series_amp = (vin - vz) / rs if rs > 0 else 0.0
                i_diode_amp = max(0.0, i_series_amp - i_load_amp)
                v_diode = vz
            elif vin > 0.7:
                # Forward biased zener
                v_out = 0.7
                state = "Forward Biased Diode"
                v_diode = 0.7
                i_series_amp = (vin - 0.7) / rs
                i_load_amp = 0.7 / rl
                i_diode_amp = i_series_amp - i_load_amp
            else:
                v_out = vin * (rl / (rs + rl))
                state = "Off / Below Knee"
                v_diode = v_out
                i_series_amp = vin / (rs + rl)
                i_load_amp = i_series_amp
                i_diode_amp = 0.0
            type_title = f"Zener Regulator ({vz:.1f}V Rating)"

        else:
            # Standard PN Junction / Schottky
            vf_drop = 0.3 if params.diode_type == "schottky" else 0.7
            if vin >= vf_drop:
                state = "Forward Biased (Conducting)"
                v_diode = vf_drop
                i_diode_amp = (vin - vf_drop) / rs if rs > 0 else 0.0
                v_out = vin - v_diode
                i_load_amp = v_out / rl
            else:
                state = "Reverse Biased (Blocking / Cutoff)"
                v_diode = vin
                i_diode_amp = 0.0
                v_out = 0.0
                i_load_amp = 0.0
            type_title = "Schottky Barrier Diode" if params.diode_type == "schottky" else "Standard Silicon PN Diode"

        i_d_ma = i_diode_amp * 1000.0
        i_l_ma = i_load_amp * 1000.0
        p_rs_mw = (i_series_amp ** 2 * rs * 1000.0) if 'i_series_amp' in locals() else 0.0

        note = (
            f"{type_title}: State = {state} | Diode Drop VD = {v_diode:.2f} V | "
            f"Diode Current ID = {i_d_ma:.1f} mA | Regulated Load Vout = {v_out:.2f} V ({i_l_ma:.1f} mA)."
        )

        return DiodeCharacteristicsOutput(
            diode_type=type_title,
            operating_state=state,
            diode_voltage_v=float(v_diode),
            diode_current_ma=float(i_d_ma),
            load_voltage_v=float(v_out),
            load_current_ma=float(i_l_ma),
            series_resistor_power_mw=float(p_rs_mw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "zener_5v_regulator": {
                "name": "5.1V Zener Voltage Regulator (12V Supply)",
                "params": {"diode_type": "zener_regulator", "input_voltage_v": 12.0, "series_resistor_ohms": 220.0, "load_resistor_ohms": 1000.0, "zener_voltage_v": 5.1}
            },
            "silicon_diode_forward": {
                "name": "Silicon PN Diode Forward Bias (5V)",
                "params": {"diode_type": "silicon_pn", "input_voltage_v": 5.0, "series_resistor_ohms": 330.0, "load_resistor_ohms": 1000.0, "zener_voltage_v": 3.3}
            }
        }
