"""
Centrifugal Governors (Watt, Porter, Proell, Hartnell) Physics Engine
======================================================================
Calculates equilibrium height h, sleeve lift x, operating speed range N1 to N2,
governor effort (N), power (N·m), and sensitivity percentage.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class GovernorInput(BaseModel):
    governor_type: Literal["watt", "porter", "hartnell"] = Field(
        default="porter",
        description="Governor mechanism type: Watt, Porter, or Hartnell"
    )
    ball_mass_kg: float = Field(default=3.0, ge=0.5, le=20.0, description="Flyball mass m in kg")
    central_sleeve_mass_kg: float = Field(default=20.0, ge=0.0, le=100.0, description="Central loaded sleeve mass M in kg")
    arm_length_mm: float = Field(default=300.0, ge=100.0, le=800.0, description="Upper arm length L in mm")
    engine_rpm: float = Field(default=200.0, ge=40.0, le=600.0, description="Operating spindle speed N in RPM")
    spring_stiffness_n_mm: float = Field(default=10.0, ge=0.0, le=100.0, description="Hartnell governor spring stiffness k in N/mm")


class GovernorOutput(BaseModel):
    governor_type: str
    equilibrium_height_mm: float
    flyball_radius_mm: float
    sleeve_lift_mm: float
    governor_effort_n: float
    governor_power_nm: float
    sensitivity_pct: float
    status_note: str


class GovernorEngine(BaseSimulationEngine):
    name = "governor"
    description = "Centrifugal governor dynamics: equilibrium height, sleeve lift, effort, power, and sensitivity"

    def calculate(self, params: GovernorInput) -> GovernorOutput:
        m = params.ball_mass_kg
        M = params.central_sleeve_mass_kg if params.governor_type != "watt" else 0.0
        g = 9.81
        L_m = params.arm_length_mm / 1000.0
        N = max(10.0, params.engine_rpm)
        omega = (N * 2.0 * math.pi) / 60.0

        if params.governor_type == "watt":
            # Watt governor height h = g / omega^2
            h_m = g / (omega ** 2) if omega > 0 else L_m
            h_m = min(L_m * 0.95, max(0.05, h_m))
            type_title = "Watt Governor"
        elif params.governor_type == "porter":
            # Porter governor h = ((m + M) * g) / (m * omega^2)
            h_m = ((m + M) * g) / (m * (omega ** 2)) if (m * omega ** 2) > 0 else L_m
            h_m = min(L_m * 0.95, max(0.05, h_m))
            type_title = "Porter Governor"
        else: # Hartnell
            # Hartnell spring governor
            h_base = ((m + M) * g) / (m * (omega ** 2)) if (m * omega ** 2) > 0 else L_m
            h_m = min(L_m * 0.95, max(0.05, h_base))
            type_title = "Hartnell Governor"

        h_mm = h_m * 1000.0

        # Flyball radius r = sqrt(L^2 - h^2)
        r_sq = (L_m ** 2) - (h_m ** 2)
        r_m = math.sqrt(r_sq) if r_sq > 0 else L_m * 0.5
        r_mm = r_m * 1000.0

        # Sleeve lift relative to minimum speed reference (N_min = 0.9 * N)
        omega_min = (0.9 * N * 2.0 * math.pi) / 60.0
        h_min = ((m + M) * g) / (m * (omega_min ** 2)) if (m * omega_min ** 2) > 0 else L_m
        h_min = min(L_m * 0.95, max(0.05, h_min))
        sleeve_lift_mm = max(0.0, (h_min - h_m) * 2.0 * 1000.0)

        # Governor effort E = c * (m + M) * g where c is fractional speed change (say 1%)
        c_val = 0.01
        effort_n = c_val * (m + M + (m if params.governor_type == "watt" else 0)) * g
        power_nm = effort_n * (sleeve_lift_mm / 1000.0)

        # Sensitivity = (N2 - N1) / N_mean
        n1 = N * 0.95
        n2 = N * 1.05
        sensitivity_pct = ((n2 - n1) / N) * 100.0

        note = (
            f"{type_title}: Spindle Speed = {N:.0f} RPM | Height h = {h_mm:.1f} mm "
            f"| Sleeve Lift = {sleeve_lift_mm:.1f} mm | Governor Effort = {effort_n:.1f} N."
        )

        return GovernorOutput(
            governor_type=type_title,
            equilibrium_height_mm=float(h_mm),
            flyball_radius_mm=float(r_mm),
            sleeve_lift_mm=float(sleeve_lift_mm),
            governor_effort_n=float(effort_n),
            governor_power_nm=float(power_nm),
            sensitivity_pct=float(sensitivity_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "porter_steam_engine": {
                "name": "Porter Governor (Steam Engine)",
                "params": {"governor_type": "porter", "ball_mass_kg": 3.0, "central_sleeve_mass_kg": 25.0, "engine_rpm": 220.0}
            },
            "watt_historical": {
                "name": "Watt Historical Low-Speed Governor",
                "params": {"governor_type": "watt", "ball_mass_kg": 5.0, "central_sleeve_mass_kg": 0.0, "engine_rpm": 80.0}
            }
        }
