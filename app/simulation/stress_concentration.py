"""
Stress Concentration Factor (Kt & Kf) Physics Engine
======================================================
Calculates theoretical stress concentration Kt, notch sensitivity q,
fatigue stress concentration Kf, nominal stress sigma_nom, and peak stress sigma_max.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class StressConcentrationInput(BaseModel):
    discontinuity_type: Literal["hole_in_plate", "filleted_flat_bar", "grooved_shaft"] = Field(
        default="hole_in_plate",
        description="Geometric discontinuity shape"
    )
    plate_width_mm: float = Field(default=100.0, ge=20.0, le=500.0, description="Plate/shaft width W in mm")
    hole_diameter_mm: float = Field(default=20.0, ge=2.0, le=200.0, description="Hole diameter d or notch depth in mm")
    fillet_radius_mm: float = Field(default=5.0, ge=0.5, le=50.0, description="Fillet/groove radius r in mm")
    applied_load_kn: float = Field(default=40.0, ge=0.1, le=1000.0, description="Applied axial load F in kN")
    plate_thickness_mm: float = Field(default=10.0, ge=1.0, le=100.0, description="Plate thickness t in mm")
    notch_sensitivity_q: float = Field(default=0.85, ge=0.0, le=1.0, description="Material notch sensitivity q (0 to 1)")


class StressConcentrationOutput(BaseModel):
    nominal_stress_mpa: float
    theoretical_kt: float
    fatigue_kf: float
    peak_stress_static_mpa: float
    peak_stress_fatigue_mpa: float
    stress_increase_pct: float
    status_note: str


class StressConcentrationEngine(BaseSimulationEngine):
    name = "stress-concentration"
    description = "Geometric stress concentration: Kt, notch sensitivity q, fatigue factor Kf, and peak local stress"

    def calculate(self, params: StressConcentrationInput) -> StressConcentrationOutput:
        w = params.plate_width_mm
        d = params.hole_diameter_mm
        r = params.fillet_radius_mm
        t = params.plate_thickness_mm
        f_n = params.applied_load_kn * 1000.0

        if params.discontinuity_type == "hole_in_plate":
            # Net area A_net = (w - d) * t
            w_net = max(1.0, w - d)
            area_net_mm2 = w_net * t
            # Empirical Kt formula for central hole in plate: Kt = 3 - 3.13*(d/w) + 3.66*(d/w)^2 - 1.53*(d/w)^3
            ratio = d / w if w > 0 else 0.2
            kt = 3.0 - 3.13 * ratio + 3.66 * (ratio ** 2) - 1.53 * (ratio ** 3)
            kt = max(1.5, min(4.0, kt))
            title = "Central Hole in Plate"

        elif params.discontinuity_type == "filleted_flat_bar":
            d_net = max(1.0, w - 2.0 * d)
            area_net_mm2 = d_net * t
            # Empirical Kt for filleted flat bar: Kt ≈ 1.0 + 2.0 * sqrt(d / r)
            kt = 1.0 + 1.2 * math.sqrt(d / r) if r > 0 else 3.0
            kt = max(1.2, min(5.0, kt))
            title = "Filleted Flat Bar"

        else: # grooved_shaft
            d_net = max(1.0, w - 2.0 * d)
            area_net_mm2 = (math.pi * (d_net ** 2)) / 4.0
            kt = 1.0 + 1.5 * math.sqrt(d / r) if r > 0 else 3.5
            kt = max(1.3, min(6.0, kt))
            title = "Grooved Circular Shaft"

        sigma_nom_mpa = f_n / area_net_mm2 if area_net_mm2 > 0 else 0.0

        # Fatigue stress factor Kf = 1 + q * (Kt - 1)
        q = params.notch_sensitivity_q
        kf = 1.0 + q * (kt - 1.0)

        peak_static_mpa = sigma_nom_mpa * kt
        peak_fatigue_mpa = sigma_nom_mpa * kf

        increase_pct = (kt - 1.0) * 100.0

        note = (
            f"{title}: Nominal Stress σ_nom = {sigma_nom_mpa:.1f} MPa | Theoretical K_t = {kt:.2f} "
            f"| Fatigue K_f = {kf:.2f} (Peak Static Stress σ_max = {peak_static_mpa:.1f} MPa)."
        )

        return StressConcentrationOutput(
            nominal_stress_mpa=float(sigma_nom_mpa),
            theoretical_kt=float(kt),
            fatigue_kf=float(kf),
            peak_stress_static_mpa=float(peak_static_mpa),
            peak_stress_fatigue_mpa=float(peak_fatigue_mpa),
            stress_increase_pct=float(increase_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "plate_with_hole": {
                "name": "Tensile Plate with Center Hole",
                "params": {"discontinuity_type": "hole_in_plate", "plate_width_mm": 100.0, "hole_diameter_mm": 20.0, "applied_load_kn": 50.0, "plate_thickness_mm": 10.0, "notch_sensitivity_q": 0.85}
            },
            "stepped_shaft_fillet": {
                "name": "Stepped Shaft Sharp Fillet",
                "params": {"discontinuity_type": "filleted_flat_bar", "plate_width_mm": 80.0, "hole_diameter_mm": 10.0, "fillet_radius_mm": 2.5, "applied_load_kn": 30.0, "plate_thickness_mm": 15.0, "notch_sensitivity_q": 0.90}
            }
        }
