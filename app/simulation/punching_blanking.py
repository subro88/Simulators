"""
Punching & Blanking Force Physics Engine
========================================
Calculates shearing force F, stripping force Fstrip, die clearance c,
and press tonnage capacity for sheet metal punching.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PunchingBlankingInput(BaseModel):
    hole_diameter_mm: float = Field(default=25.0, ge=1.0, le=200.0, description="Punch hole diameter D in mm")
    sheet_thickness_mm: float = Field(default=3.0, ge=0.2, le=15.0, description="Sheet thickness t in mm")
    shear_strength_mpa: float = Field(default=350.0, ge=50.0, le=1200.0, description="Material shear strength tau_s in MPa")
    shear_ground_angle_deg: float = Field(default=0.0, ge=0.0, le=15.0, description="Shear angle on punch face in degrees")


class PunchingBlankingOutput(BaseModel):
    cut_perimeter_mm: float
    die_clearance_per_side_mm: float
    peak_punching_force_kn: float
    stripping_force_kn: float
    recommended_press_tonnage: float
    status_note: str


class PunchingBlankingEngine(BaseSimulationEngine):
    name = "punching-blanking"
    description = "Sheet metal die punching & blanking: cutting perimeter, die clearance c, shear force F, and press tonnage"

    def calculate(self, params: PunchingBlankingInput) -> PunchingBlankingOutput:
        d = params.hole_diameter_mm
        t = params.sheet_thickness_mm
        tau_s = params.shear_strength_mpa
        alpha_deg = params.shear_ground_angle_deg

        # Cut Perimeter P = pi * D
        perim_mm = math.pi * d

        # Die clearance per side c = 0.075 * t * sqrt(tau_s / 10)
        c_mm = 0.075 * t * math.sqrt(tau_s / 10.0) / 3.0

        # Peak Punching Force F = P * t * tau_s (in N)
        f_peak_n = perim_mm * t * tau_s

        # Reduction factor for shear angle on punch face
        if alpha_deg > 0:
            reduction = 1.0 / (1.0 + math.tan(math.radians(alpha_deg)) * (t / 1.5))
            f_peak_n *= max(0.4, reduction)

        f_peak_kn = f_peak_n / 1000.0

        # Stripping force F_strip ≈ 0.15 * F_peak
        f_strip_kn = 0.15 * f_peak_kn

        # Recommended Press Tonnage (Metric Tons = kN / 9.81 * 1.25 safety factor)
        tonnage = (f_peak_kn / 9.81) * 1.25

        note = (
            f"Die Punching (D = {d:.0f} mm, t = {t:.1f} mm): Cut Perimeter = {perim_mm:.1f} mm | "
            f"Die Clearance per side c = {c_mm:.3f} mm | Punching Force F = {f_peak_kn:.1f} kN | "
            f"Required Press Capacity = {tonnage:.1f} Metric Tons."
        )

        return PunchingBlankingOutput(
            cut_perimeter_mm=float(perim_mm),
            die_clearance_per_side_mm=float(c_mm),
            peak_punching_force_kn=float(f_peak_kn),
            stripping_force_kn=float(f_strip_kn),
            recommended_press_tonnage=float(tonnage),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "punch_25mm_hole_steel": {
                "name": "25mm Hole Punching in 3mm Steel Plate",
                "params": {"hole_diameter_mm": 25.0, "sheet_thickness_mm": 3.0, "shear_strength_mpa": 350.0, "shear_ground_angle_deg": 0.0}
            },
            "sheared_punch_heavy": {
                "name": "Sheared Face Punching (5° Bevel Angle)",
                "params": {"hole_diameter_mm": 40.0, "sheet_thickness_mm": 5.0, "shear_strength_mpa": 400.0, "shear_ground_angle_deg": 5.0}
            }
        }
