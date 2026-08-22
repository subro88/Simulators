"""
Operational Amplifier (Op-Amp) Topologies & Gain Physics Engine
===============================================================
Calculates closed-loop voltage gain Av, output voltage Vout, bandwidth,
slew rate limit, and saturation limits across Inverting, Non-Inverting, and Voltage Follower configurations.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class OpAmpInput(BaseModel):
    topology: Literal["inverting", "non_inverting", "voltage_follower", "summing"] = Field(
        default="inverting",
        description="Op-Amp circuit configuration"
    )
    input_voltage_v: float = Field(default=1.5, ge=-15.0, le=15.0, description="Input voltage Vin in Volts")
    input_resistor_rin_kohm: float = Field(default=10.0, ge=0.5, le=500.0, description="Input resistor Rin in kΩ")
    feedback_resistor_rf_kohm: float = Field(default=100.0, ge=1.0, le=2000.0, description="Feedback resistor Rf in kΩ")
    supply_rails_vcc_v: float = Field(default=15.0, ge=3.0, le=36.0, description="DC Supply rails ±VCC in Volts")


class OpAmpOutput(BaseModel):
    topology: str
    voltage_gain_av: float
    ideal_vout_volts: float
    actual_vout_volts: float
    is_saturated: bool
    status_note: str


class OpAmpEngine(BaseSimulationEngine):
    name = "op-amp"
    description = "Ideal and practical Op-Amp circuits: closed-loop gain Av, Vout calculation, and supply rail saturation"

    def calculate(self, params: OpAmpInput) -> OpAmpOutput:
        vin = params.input_voltage_v
        rin = params.input_resistor_rin_kohm * 1000.0
        rf = params.feedback_resistor_rf_kohm * 1000.0
        vcc = params.supply_rails_vcc_v
        vsat = vcc - 1.2  # typical rail headroom

        if params.topology == "inverting":
            av = - (rf / rin) if rin > 0 else -10.0
            type_title = "Inverting Amplifier"
        elif params.topology == "non_inverting":
            av = 1.0 + (rf / rin) if rin > 0 else 1.0
            type_title = "Non-Inverting Amplifier"
        elif params.topology == "voltage_follower":
            av = 1.0
            type_title = "Voltage Follower (Buffer)"
        else: # summing
            av = - (rf / rin)
            type_title = "Inverting Summing Amplifier"

        v_ideal = vin * av

        # Saturation check
        if v_ideal > vsat:
            v_actual = vsat
            is_sat = True
            sat_status = "POSITIVE RAIL SATURATION (+Vsat)"
        elif v_ideal < -vsat:
            v_actual = -vsat
            is_sat = True
            sat_status = "NEGATIVE RAIL SATURATION (-Vsat)"
        else:
            v_actual = v_ideal
            is_sat = False
            sat_status = "UNSATURATED LINEAR MODE"

        note = (
            f"{type_title}: Voltage Gain Av = {av:.2f}x | Ideal Vout = {v_ideal:.2f} V -> "
            f"Actual Vout = {v_actual:.2f} V (Rails = ±{vcc:.0f}V — {sat_status})."
        )

        return OpAmpOutput(
            topology=type_title,
            voltage_gain_av=float(av),
            ideal_vout_volts=float(v_ideal),
            actual_vout_volts=float(v_actual),
            is_saturated=is_sat,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "inverting_gain_10x": {
                "name": "Inverting Op-Amp Amplifier (10x Gain)",
                "params": {"topology": "inverting", "input_voltage_v": 1.0, "input_resistor_rin_kohm": 10.0, "feedback_resistor_rf_kohm": 100.0, "supply_rails_vcc_v": 15.0}
            },
            "non_inverting_gain_11x": {
                "name": "Non-Inverting Op-Amp Amplifier (11x Gain)",
                "params": {"topology": "non_inverting", "input_voltage_v": 1.0, "input_resistor_rin_kohm": 10.0, "feedback_resistor_rf_kohm": 100.0, "supply_rails_vcc_v": 15.0}
            }
        }
