"""
Drilling Torque & Thrust Force Physics Engine
============================================
Calculates drilling torque T, thrust force Fz, MRR, cutting power P, and drilling time t.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class DrillingMechanicsInput(BaseModel):
    drill_diameter_mm: float = Field(default=12.0, ge=1.0, le=80.0, description="Twist drill diameter D in mm")
    spindle_speed_rpm: float = Field(default=900.0, ge=100.0, le=5000.0, description="Spindle rotational speed N in RPM")
    feed_mm_rev: float = Field(default=0.2, ge=0.02, le=1.0, description="Drill feed f in mm/rev")
    hole_depth_mm: float = Field(default=40.0, ge=2.0, le=300.0, description="Hole depth L in mm")


class DrillingMechanicsOutput(BaseModel):
    cutting_speed_m_min: float
    penetration_rate_mm_min: float
    material_removal_rate_cm3_min: float
    thrust_force_n: float
    drilling_torque_nm: float
    drilling_power_kw: float
    drilling_time_sec: float
    status_note: str


class DrillingMechanicsEngine(BaseSimulationEngine):
    name = "drilling-mechanics"
    description = "Twist drill mechanics: thrust force Fz, drilling torque T, penetration rate, and power P"

    def calculate(self, params: DrillingMechanicsInput) -> DrillingMechanicsOutput:
        d = params.drill_diameter_mm
        n = params.spindle_speed_rpm
        f = params.feed_mm_rev
        l_hole = params.hole_depth_mm

        v = (math.pi * d * n) / 1000.0
        vf = f * n  # mm/min

        mrr_cm3_min = (math.pi / 4.0 * (d ** 2) * vf) / 1000.0

        # Empirical Thrust Force Fz ≈ 800 * D^0.8 * f^0.8 (N) for medium steel
        fz_n = 800.0 * (d ** 0.8) * (f ** 0.8)

        # Empirical Torque T ≈ 0.55 * D^1.9 * f^0.8 (N*m)
        torque_nm = 0.55 * (d ** 1.9) * (f ** 0.8)

        # Power P = (T * 2 * pi * N) / 60000 (kW)
        power_kw = (torque_nm * 2.0 * math.pi * n) / 60000.0

        # Drilling Time t = (L + 0.3*D) / vf * 60 (sec)
        t_sec = ((l_hole + 0.3 * d) / vf) * 60.0 if vf > 0 else 0.0

        note = (
            f"Drilling Operation (D = {d:.0f} mm, N = {n:.0f} RPM): Penetration Rate = {vf:.0f} mm/min | "
            f"Thrust Force Fz = {fz_n:.0f} N | Torque = {torque_nm:.1f} N·m | Power = {power_kw:.2f} kW (Time = {t_sec:.1f} s)."
        )

        return DrillingMechanicsOutput(
            cutting_speed_m_min=float(v),
            penetration_rate_mm_min=float(vf),
            material_removal_rate_cm3_min=float(mrr_cm3_min),
            thrust_force_n=float(fz_n),
            drilling_torque_nm=float(torque_nm),
            drilling_power_kw=float(power_kw),
            drilling_time_sec=float(t_sec),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "standard_12mm_hole": {
                "name": "Standard 12mm Hole Drilling (N=900 RPM)",
                "params": {"drill_diameter_mm": 12.0, "spindle_speed_rpm": 900.0, "feed_mm_rev": 0.2, "hole_depth_mm": 40.0}
            },
            "heavy_30mm_core_drill": {
                "name": "Heavy 30mm Core Drilling (N=350 RPM)",
                "params": {"drill_diameter_mm": 30.0, "spindle_speed_rpm": 350.0, "feed_mm_rev": 0.35, "hole_depth_mm": 80.0}
            }
        }
