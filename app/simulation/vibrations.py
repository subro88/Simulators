"""
Mechanical Vibrations (Free, Damped, Forced) Physics Engine
===========================================================
Calculates natural frequency f_n, damping ratio zeta, damped frequency f_d,
logarithmic decrement delta, forced vibration magnification factor MF, and resonance conditions.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class VibrationsInput(BaseModel):
    mass_kg: float = Field(default=10.0, ge=0.1, le=1000.0, description="Vibrating mass m in kg")
    stiffness_n_m: float = Field(default=4000.0, ge=10.0, le=500000.0, description="Spring stiffness k in N/m")
    damping_coeff_ns_m: float = Field(default=40.0, ge=0.0, le=2000.0, description="Damping coefficient c in N·s/m")
    excitation_freq_hz: float = Field(default=3.18, ge=0.1, le=200.0, description="External excitation frequency f in Hz")


class VibrationsOutput(BaseModel):
    natural_frequency_hz: float
    critical_damping_ns_m: float
    damping_ratio: float
    damped_frequency_hz: float
    logarithmic_decrement: float
    frequency_ratio: float
    magnification_factor: float
    vibration_regime: str
    status_note: str


class VibrationsEngine(BaseSimulationEngine):
    name = "vibrations"
    description = "Single-DOF mechanical vibrations: natural frequency, damping ratio, logarithmic decrement, and forced resonance"

    def calculate(self, params: VibrationsInput) -> VibrationsOutput:
        m = params.mass_kg
        k = params.stiffness_n_m
        c = params.damping_coeff_ns_m

        # Undamped natural frequency omega_n = sqrt(k / m)
        omega_n = math.sqrt(k / m) if m > 0 and k > 0 else 1.0
        f_n = omega_n / (2.0 * math.pi)

        # Critical damping c_c = 2 * sqrt(k * m)
        c_c = 2.0 * math.sqrt(k * m) if (k * m) > 0 else 1.0

        # Damping ratio zeta = c / c_c
        zeta = c / c_c if c_c > 0 else 0.0

        # Damped frequency omega_d = omega_n * sqrt(1 - zeta^2) if underdamped
        if zeta < 1.0:
            omega_d = omega_n * math.sqrt(1.0 - (zeta ** 2))
            regime = "Underdamped (Oscillatory)"
            log_dec = (2.0 * math.pi * zeta) / math.sqrt(1.0 - (zeta ** 2))
        elif math.isclose(zeta, 1.0, abs_tol=1e-3):
            omega_d = 0.0
            regime = "Critically Damped (Fastest Non-Oscillatory Return)"
            log_dec = 0.0
        else:
            omega_d = 0.0
            regime = "Overdamped (Sluggish Return)"
            log_dec = 0.0

        f_d = omega_d / (2.0 * math.pi)

        # Frequency ratio r = f_excitation / f_n
        r = params.excitation_freq_hz / f_n if f_n > 0 else 1.0

        # Magnification factor MF = 1 / sqrt((1 - r^2)^2 + (2 * zeta * r)^2)
        denom_sq = ((1.0 - (r ** 2)) ** 2) + ((2.0 * zeta * r) ** 2)
        mf = 1.0 / math.sqrt(denom_sq) if denom_sq > 0 else 100.0

        note = (
            f"Vibration Analysis: Natural Freq f_n = {f_n:.2f} Hz | Damping Ratio ζ = {zeta:.3f} ({regime}) "
            f"| Magnification Factor MF = {mf:.2f} (at r = {r:.2f})."
        )

        return VibrationsOutput(
            natural_frequency_hz=float(f_n),
            critical_damping_ns_m=float(c_c),
            damping_ratio=float(zeta),
            damped_frequency_hz=float(f_d),
            logarithmic_decrement=float(log_dec),
            frequency_ratio=float(r),
            magnification_factor=float(mf),
            vibration_regime=regime,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "vehicle_suspension": {
                "name": "Quarter Car Vehicle Suspension",
                "params": {"mass_kg": 250.0, "stiffness_n_m": 20000.0, "damping_coeff_ns_m": 1500.0, "excitation_freq_hz": 1.4}
            },
            "resonance_risk": {
                "name": "Machine Base Near Resonance",
                "params": {"mass_kg": 50.0, "stiffness_n_m": 5000.0, "damping_coeff_ns_m": 20.0, "excitation_freq_hz": 1.59}
            }
        }
