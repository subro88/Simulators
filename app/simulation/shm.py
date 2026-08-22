"""
Simple Harmonic Motion (SHM) Physics Engine
============================================
Calculates period T, frequency f, instantaneous displacement x, velocity v, acceleration a,
and energy conservation (Kinetic KE vs Potential PE).
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SHMInput(BaseModel):
    system_type: Literal["spring_mass", "simple_pendulum"] = Field(
        default="spring_mass",
        description="SHM System Type: Spring-Mass or Simple Pendulum"
    )
    mass_kg: float = Field(default=2.0, ge=0.05, le=100.0, description="Mass m in kg")
    stiffness_n_m: float = Field(default=50.0, ge=1.0, le=5000.0, description="Spring stiffness k in N/m (for Spring-Mass)")
    pendulum_length_m: float = Field(default=1.0, ge=0.1, le=10.0, description="Pendulum length L in meters")
    amplitude_m: float = Field(default=0.2, ge=0.01, le=2.0, description="Oscillation amplitude A in meters")
    time_sec: float = Field(default=0.5, ge=0.0, le=60.0, description="Instantaneous time t in seconds")


class SHMOutput(BaseModel):
    system_type: str
    period_sec: float
    frequency_hz: float
    angular_frequency_rads: float
    displacement_m: float
    velocity_ms: float
    acceleration_ms2: float
    kinetic_energy_j: float
    potential_energy_j: float
    total_energy_j: float
    status_note: str


class SHMEngine(BaseSimulationEngine):
    name = "shm"
    description = "Simple Harmonic Motion kinematics and phase-space energy conservation"

    def calculate(self, params: SHMInput) -> SHMOutput:
        g = 9.81
        if params.system_type == "spring_mass":
            k_eff = params.stiffness_n_m
            omega = math.sqrt(k_eff / params.mass_kg) if params.mass_kg > 0 else 1.0
            type_title = "Spring-Mass System"
        else:
            omega = math.sqrt(g / params.pendulum_length_m) if params.pendulum_length_m > 0 else 1.0
            k_eff = params.mass_kg * (omega ** 2)
            type_title = "Simple Pendulum"

        period = (2.0 * math.pi) / omega
        freq = 1.0 / period

        a_amp = params.amplitude_m
        t = params.time_sec

        # SHM: x = A * cos(omega * t), v = -A * omega * sin(omega * t), a = -A * omega^2 * cos(omega * t)
        x = a_amp * math.cos(omega * t)
        v = -a_amp * omega * math.sin(omega * t)
        accel = -a_amp * (omega ** 2) * math.cos(omega * t)

        ke = 0.5 * params.mass_kg * (v ** 2)
        pe = 0.5 * k_eff * (x ** 2)
        e_total = ke + pe

        note = (
            f"{type_title}: Period T = {period:.2f} s ({freq:.2f} Hz) | Displacement x = {x*100:.1f} cm "
            f"| Velocity v = {v:.2f} m/s | Kinetic KE = {ke:.3f} J, Potential PE = {pe:.3f} J."
        )

        return SHMOutput(
            system_type=type_title,
            period_sec=float(period),
            frequency_hz=float(freq),
            angular_frequency_rads=float(omega),
            displacement_m=float(x),
            velocity_ms=float(v),
            acceleration_ms2=float(accel),
            kinetic_energy_j=float(ke),
            potential_energy_j=float(pe),
            total_energy_j=float(e_total),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "standard_spring_mass": {
                "name": "Standard Spring-Mass Oscillator",
                "params": {"system_type": "spring_mass", "mass_kg": 2.0, "stiffness_n_m": 50.0, "amplitude_m": 0.25}
            },
            "seconds_pendulum": {
                "name": "Seconds Pendulum (T ≈ 2s)",
                "params": {"system_type": "simple_pendulum", "pendulum_length_m": 0.994, "amplitude_m": 0.15}
            }
        }
