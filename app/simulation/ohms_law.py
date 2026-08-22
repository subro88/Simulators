"""
Ohm's Law & DC Resistor Networks Physics Engine
===============================================
Calculates current I, power dissipation P, equivalent resistance for series/parallel configurations,
and 4-band resistor color codes.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class OhmsLawInput(BaseModel):
    supply_voltage_v: float = Field(default=12.0, ge=0.1, le=1000.0, description="DC Supply voltage V in Volts")
    resistor_1_ohms: float = Field(default=100.0, ge=0.1, le=1000000.0, description="Resistor R1 resistance in Ohms")
    resistor_2_ohms: float = Field(default=200.0, ge=0.1, le=1000000.0, description="Resistor R2 resistance in Ohms")
    connection_mode: Literal["series", "parallel", "single_resistor"] = Field(
        default="series",
        description="Circuit configuration mode"
    )


class OhmsLawOutput(BaseModel):
    connection_mode: str
    equivalent_resistance_ohms: float
    circuit_current_amperes: float
    circuit_current_ma: float
    total_power_watts: float
    r1_voltage_drop_v: float
    r2_voltage_drop_v: float
    status_note: str


class OhmsLawEngine(BaseSimulationEngine):
    name = "ohms-law"
    description = "Ohm's Law V=IR, power dissipation P=VI, and series/parallel resistor combinations"

    def calculate(self, params: OhmsLawInput) -> OhmsLawOutput:
        v = params.supply_voltage_v
        r1 = params.resistor_1_ohms
        r2 = params.resistor_2_ohms

        if params.connection_mode == "single_resistor":
            req = r1
            v1 = v
            v2 = 0.0
            mode_title = "Single Resistor Circuit"
        elif params.connection_mode == "series":
            req = r1 + r2
            i_tot = v / req if req > 0 else 0.0
            v1 = i_tot * r1
            v2 = i_tot * r2
            mode_title = "Series Resistor Circuit"
        else: # parallel
            req = (r1 * r2) / (r1 + r2) if (r1 + r2) > 0 else r1
            v1 = v
            v2 = v
            mode_title = "Parallel Resistor Circuit"

        i_amp = v / req if req > 0 else 0.0
        i_ma = i_amp * 1000.0
        power_w = v * i_amp

        note = (
            f"{mode_title} (V = {v:.1f} V): Equivalent Resistance R_eq = {req:.1f} Ω | "
            f"Circuit Current I = {i_amp:.3f} A ({i_ma:.1f} mA) | Power Dissipation P = {power_w:.2f} W."
        )

        return OhmsLawOutput(
            connection_mode=mode_title,
            equivalent_resistance_ohms=float(req),
            circuit_current_amperes=float(i_amp),
            circuit_current_ma=float(i_ma),
            total_power_watts=float(power_w),
            r1_voltage_drop_v=float(v1),
            r2_voltage_drop_v=float(v2),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "led_current_limiting": {
                "name": "12V LED Current Limiting Resistor (Series)",
                "params": {"supply_voltage_v": 12.0, "resistor_1_ohms": 470.0, "resistor_2_ohms": 10.0, "connection_mode": "series"}
            },
            "parallel_shunt_load": {
                "name": "Parallel High-Power Shunt Resistors",
                "params": {"supply_voltage_v": 24.0, "resistor_1_ohms": 100.0, "resistor_2_ohms": 100.0, "connection_mode": "parallel"}
            }
        }
