"""
NE555 Timer IC Multivibrator Physics Engine
============================================
Calculates Astable frequency f, high time thigh, low time tlow, duty cycle D,
and Monostable pulse width T for the 555 Timer IC.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class Timer555Input(BaseModel):
    timer_mode: Literal["astable", "monostable"] = Field(default="astable", description="555 Timer IC mode")
    resistor_r1_kohm: float = Field(default=10.0, ge=1.0, le=1000.0, description="Resistor R1 in kΩ")
    resistor_r2_kohm: float = Field(default=47.0, ge=1.0, le=1000.0, description="Resistor R2 in kΩ (used in Astable)")
    timing_capacitor_uf: float = Field(default=10.0, ge=0.001, le=1000.0, description="Timing capacitor C in µF")


class Timer555Output(BaseModel):
    timer_mode: str
    frequency_hz: float
    period_ms: float
    time_high_ms: float
    time_low_ms: float
    duty_cycle_pct: float
    status_note: str


class Timer555Engine(BaseSimulationEngine):
    name = "timer-555"
    description = "NE555 Timer IC Astable/Monostable multivibrator: frequency f, high/low times, duty cycle D, and pulse width"

    def calculate(self, params: Timer555Input) -> Timer555Output:
        r1 = params.resistor_r1_kohm * 1000.0
        r2 = params.resistor_r2_kohm * 1000.0
        c_farad = params.timing_capacitor_uf / 1e6

        if params.timer_mode == "astable":
            # Astable: f = 1.44 / ((R1 + 2*R2) * C)
            t_high = 0.693 * (r1 + r2) * c_farad
            t_low = 0.693 * r2 * c_farad
            period = t_high + t_low
            freq = 1.0 / period if period > 0 else 0.0
            duty = (t_high / period) * 100.0 if period > 0 else 50.0
            type_title = "555 Timer Astable Multivibrator (Oscillator)"
        else:
            # Monostable: T = 1.1 * R1 * C
            t_high = 1.1 * r1 * c_farad
            t_low = 0.0
            period = t_high
            freq = 1.0 / period if period > 0 else 0.0
            duty = 100.0
            type_title = "555 Timer Monostable One-Shot Pulse Generator"

        th_ms = t_high * 1000.0
        tl_ms = t_low * 1000.0
        p_ms = period * 1000.0

        note = (
            f"{type_title}: Frequency f = {freq:.2f} Hz (Period = {p_ms:.2f} ms) | "
            f"High Time = {th_ms:.2f} ms, Low Time = {tl_ms:.2f} ms | Duty Cycle D = {duty:.1f}%."
        )

        return Timer555Output(
            timer_mode=type_title,
            frequency_hz=float(freq),
            period_ms=float(p_ms),
            time_high_ms=float(th_ms),
            time_low_ms=float(tl_ms),
            duty_cycle_pct=float(duty),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "astable_1hz_led_flasher": {
                "name": "1Hz LED Flasher Oscillator (Astable)",
                "params": {"timer_mode": "astable", "resistor_r1_kohm": 10.0, "resistor_r2_kohm": 68.0, "timing_capacitor_uf": 10.0}
            },
            "monostable_1sec_pulse": {
                "name": "1 Second Monostable Delay Pulse Generator",
                "params": {"timer_mode": "monostable", "resistor_r1_kohm": 91.0, "resistor_r2_kohm": 0.0, "timing_capacitor_uf": 10.0}
            }
        }
