"""
Flywheel & Turning Moment Diagram Physics Engine
================================================
Calculates maximum fluctuation of energy Delta E, mean torque T_mean,
coefficient of fluctuation of speed C_s, required moment of inertia I, and rim mass m.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class FlywheelInput(BaseModel):
    engine_power_kw: float = Field(default=50.0, ge=5.0, le=500.0, description="Engine indicated/brake power in kW")
    mean_speed_rpm: float = Field(default=1500.0, ge=100.0, le=6000.0, description="Mean engine speed in RPM")
    energy_fluctuation_pct: float = Field(default=15.0, ge=1.0, le=50.0, description="Maximum energy fluctuation as % of work per cycle")
    speed_fluctuation_pct: float = Field(default=2.0, ge=0.2, le=10.0, description="Allowable speed fluctuation Cs in %")
    flywheel_radius_mm: float = Field(default=350.0, ge=100.0, le=1200.0, description="Flywheel rim mean radius R in mm")


class FlywheelOutput(BaseModel):
    work_done_per_cycle_j: float
    max_energy_fluctuation_j: float
    mean_torque_nm: float
    coeff_speed_fluctuation: float
    moment_of_inertia_kgm2: float
    flywheel_rim_mass_kg: float
    rim_linear_velocity_ms: float
    status_note: str


class FlywheelEngine(BaseSimulationEngine):
    name = "flywheel"
    description = "Flywheel energy storage dynamics: energy fluctuation Delta E, speed fluctuation Cs, inertia I, and rim mass"

    def calculate(self, params: FlywheelInput) -> FlywheelOutput:
        power_w = params.engine_power_kw * 1000.0
        n_mean = params.mean_speed_rpm
        omega_mean = (n_mean * 2.0 * math.pi) / 60.0

        # Mean torque T_mean = Power / omega_mean
        t_mean = power_w / omega_mean if omega_mean > 0 else 0.0

        # Work done per cycle W_cycle = Power * (60 / N) for 2-stroke or 4-stroke assumption (assuming 4-stroke 2 revs per cycle)
        w_cycle = power_w * (120.0 / n_mean) if n_mean > 0 else 0.0

        # Max fluctuation of energy Delta E = (energy_fluctuation_pct / 100) * W_cycle
        delta_e = (params.energy_fluctuation_pct / 100.0) * w_cycle

        # Coefficient of speed fluctuation C_s = speed_fluctuation_pct / 100
        c_s = params.speed_fluctuation_pct / 100.0

        # Moment of inertia I = Delta E / (C_s * omega_mean^2)
        i_req = delta_e / (c_s * (omega_mean ** 2)) if (c_s * omega_mean ** 2) > 0 else 1.0

        r_m = params.flywheel_radius_mm / 1000.0
        # Rim mass m = I / R^2
        rim_mass = i_req / (r_m ** 2) if r_m > 0 else 10.0

        # Rim linear velocity v = omega_mean * R
        v_rim = omega_mean * r_m

        note = (
            f"Flywheel Design: Required Inertia I = {i_req:.2f} kg·m² | Rim Mass = {rim_mass:.1f} kg "
            f"| Energy Fluctuation ΔE = {delta_e:.0f} J (C_s = {c_s*100:.1f}%)."
        )

        return FlywheelOutput(
            work_done_per_cycle_j=float(w_cycle),
            max_energy_fluctuation_j=float(delta_e),
            mean_torque_nm=float(t_mean),
            coeff_speed_fluctuation=float(c_s),
            moment_of_inertia_kgm2=float(i_req),
            flywheel_rim_mass_kg=float(rim_mass),
            rim_linear_velocity_ms=float(v_rim),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "4_cylinder_automobile": {
                "name": "4-Cylinder Automobile Flywheel",
                "params": {"engine_power_kw": 80.0, "mean_speed_rpm": 2500.0, "energy_fluctuation_pct": 12.0, "speed_fluctuation_pct": 1.5}
            },
            "punching_press": {
                "name": "Heavy Industrial Punching Press",
                "params": {"engine_power_kw": 25.0, "mean_speed_rpm": 300.0, "energy_fluctuation_pct": 40.0, "speed_fluctuation_pct": 5.0}
            }
        }
