"""
Active & Passive Signal Processing Filters (Bode Plot) Physics Engine
======================================================================
Calculates cutoff frequency fc, magnitude gain A(f) in dB, phase shift theta(f),
and 1st-order Bode response for Low-Pass, High-Pass, and Band-Pass filters.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SignalProcessingFilterInput(BaseModel):
    filter_type: Literal["low_pass", "high_pass", "band_pass"] = Field(
        default="low_pass",
        description="Filter frequency response type"
    )
    resistance_kohm: float = Field(default=10.0, ge=0.1, le=1000.0, description="Filter resistor R in kΩ")
    capacitance_nfarad: float = Field(default=15.9, ge=0.01, le=10000.0, description="Filter capacitor C in nF")
    test_frequency_hz: float = Field(default=1000.0, ge=1.0, le=1000000.0, description="Input signal test frequency f in Hz")


class SignalProcessingFilterOutput(BaseModel):
    filter_type: str
    cutoff_frequency_hz: float
    voltage_gain_magnitude: float
    gain_decibels_db: float
    phase_shift_degrees: float
    attenuation_status: str
    status_note: str


class SignalProcessingFilterEngine(BaseSimulationEngine):
    name = "signal-processing-filter"
    description = "Passive & Active RC Low-Pass/High-Pass/Band-Pass filters: cutoff fc, Bode gain dB, and phase shift"

    def calculate(self, params: SignalProcessingFilterInput) -> SignalProcessingFilterOutput:
        r_ohm = params.resistance_kohm * 1000.0
        c_farad = params.capacitance_nfarad / 1e9
        f_test = params.test_frequency_hz

        # Cutoff frequency fc = 1 / (2 * pi * R * C)
        fc_hz = 1.0 / (2.0 * math.pi * r_ohm * c_farad) if (r_ohm * c_farad) > 0 else 1000.0
        ratio = f_test / fc_hz if fc_hz > 0 else 1.0

        if params.filter_type == "low_pass":
            # Gain A(f) = 1 / sqrt(1 + (f/fc)^2)
            gain_mag = 1.0 / math.sqrt(1.0 + (ratio ** 2))
            phase_deg = - math.degrees(math.atan(ratio))
            type_title = "1st-Order RC Low-Pass Filter"
            atten_state = "PASSBAND (Signal Passed Unattenuated)" if f_test <= fc_hz else "STOPBAND (-20 dB/decade Roll-off)"

        elif params.filter_type == "high_pass":
            # Gain A(f) = ratio / sqrt(1 + (f/fc)^2)
            gain_mag = ratio / math.sqrt(1.0 + (ratio ** 2))
            phase_deg = 90.0 - math.degrees(math.atan(ratio))
            type_title = "1st-Order RC High-Pass Filter"
            atten_state = "PASSBAND (Signal Passed Unattenuated)" if f_test >= fc_hz else "STOPBAND (-20 dB/decade Roll-off)"

        else: # band_pass
            gain_mag = 1.0 / (1.0 + math.pow(ratio - 1.0/ratio, 2))**0.5 if ratio > 0 else 0.5
            phase_deg = 0.0
            type_title = "RC Band-Pass Filter"
            atten_state = "CENTER PASSBAND"

        # Gain in dB = 20 * log10(gain_mag)
        gain_db = 20.0 * math.log10(max(1e-4, gain_mag))

        note = (
            f"{type_title} (Cutoff fc = {fc_hz:.1f} Hz): Test Freq = {f_test:.0f} Hz | "
            f"Gain Magnitude = {gain_mag:.3f} ({gain_db:.2f} dB) | Phase Shift = {phase_deg:.1f}° ({atten_state})."
        )

        return SignalProcessingFilterOutput(
            filter_type=type_title,
            cutoff_frequency_hz=float(fc_hz),
            voltage_gain_magnitude=float(gain_mag),
            gain_decibels_db=float(gain_db),
            phase_shift_degrees=float(phase_deg),
            attenuation_status=atten_state,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "low_pass_1khz_audio": {
                "name": "1kHz Audio RC Low-Pass Filter (R=10k, C=15.9nF)",
                "params": {"filter_type": "low_pass", "resistance_kohm": 10.0, "capacitance_nfarad": 15.9, "test_frequency_hz": 1000.0}
            },
            "high_pass_10khz_noise": {
                "name": "High-Pass High-Frequency Noise Filter (10kHz Cutoff)",
                "params": {"filter_type": "high_pass", "resistance_kohm": 10.0, "capacitance_nfarad": 1.59, "test_frequency_hz": 20000.0}
            }
        }
