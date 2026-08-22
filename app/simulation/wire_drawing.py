"""
Wire & Rod Drawing Pass Design Physics Engine
=============================================
Calculates area reduction r, drawing stress sigma_d, drawing pull force F,
and maximum theoretical reduction limit per pass.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class WireDrawingInput(BaseModel):
    initial_wire_diameter_mm: float = Field(default=8.0, ge=0.5, le=30.0, description="Initial wire diameter D0 in mm")
    final_wire_diameter_mm: float = Field(default=6.5, ge=0.2, le=28.0, description="Final drawn diameter Df in mm")
    die_semi_angle_deg: float = Field(default=8.0, ge=4.0, le=20.0, description="Die semi-angle alpha in degrees")
    friction_coefficient_mu: float = Field(default=0.08, ge=0.01, le=0.25, description="Die friction coefficient mu")
    material_yield_stress_mpa: float = Field(default=320.0, ge=50.0, le=1500.0, description="Material yield strength Y_avg in MPa")


class WireDrawingOutput(BaseModel):
    area_reduction_pct: float
    true_drawing_strain: float
    drawing_stress_mpa: float
    drawing_force_kn: float
    drawing_power_kw: float
    max_allowable_reduction_pct: float
    status_note: str


class WireDrawingEngine(BaseSimulationEngine):
    name = "wire-drawing"
    description = "Wire & Rod Drawing: area reduction r, drawing stress sigma_d, capstan pull force F, and yield limit"

    def calculate(self, params: WireDrawingInput) -> WireDrawingOutput:
        d0 = params.initial_wire_diameter_mm
        df = params.final_wire_diameter_mm
        alpha_deg = params.die_semi_angle_deg
        mu = params.friction_coefficient_mu
        y_avg = params.material_yield_stress_mpa

        a0 = (math.pi / 4.0) * (d0 ** 2)
        af = (math.pi / 4.0) * (df ** 2)

        # Area Reduction r = (A0 - Af) / A0
        red_frac = (a0 - af) / a0 if a0 > 0 else 0.0
        red_pct = red_frac * 100.0

        # True Strain epsilon = ln(A0 / Af)
        eps = math.log(a0 / af) if af > 0 else 0.0

        alpha_rad = math.radians(alpha_deg)

        # Drawing Stress sigma_d = Y_avg * (1 + mu / tan(alpha)) * phi * ln(A0 / Af)
        # Inhomogeneous deformation factor phi ≈ 0.88 + 0.12 * (h / L_c)
        phi = 1.08
        sigma_d_mpa = y_avg * phi * (1.0 + (mu / math.tan(alpha_rad))) * eps if math.tan(alpha_rad) > 0 else 0.0

        # Drawing Force F = sigma_d * Af (in kN)
        f_draw_kn = (sigma_d_mpa * af) / 1000.0

        # Drawing Power for v = 3.0 m/s
        v_m_s = 3.0
        power_kw = f_draw_kn * v_m_s

        # Max theoretical reduction per pass = (1 - 1/e) ≈ 63.2%
        max_red_pct = (1.0 - math.exp(-1.0)) * 100.0

        is_safe = sigma_d_mpa < y_avg
        status_text = "SAFE DRAWING PASS (sigma_d < Y_yield)" if is_safe else "WIRE BREAKAGE RISK (sigma_d >= Y_yield)"

        note = (
            f"Wire Drawing (D0 = {d0:.1f} mm -> Df = {df:.1f} mm, {red_pct:.1f}% Reduction): "
            f"Drawing Stress σd = {sigma_d_mpa:.1f} MPa (Yield Y = {y_avg:.0f} MPa) | "
            f"Pull Force F = {f_draw_kn:.2f} kN | Capstan Power @3m/s = {power_kw:.1f} kW ({status_text})."
        )

        return WireDrawingOutput(
            area_reduction_pct=float(red_pct),
            true_drawing_strain=float(eps),
            drawing_stress_mpa=float(sigma_d_mpa),
            drawing_force_kn=float(f_draw_kn),
            drawing_power_kw=float(power_kw),
            max_allowable_reduction_pct=float(max_red_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "copper_wire_pass": {
                "name": "Copper Wire Pass (8mm to 6.5mm, 34% Red)",
                "params": {"initial_wire_diameter_mm": 8.0, "final_wire_diameter_mm": 6.5, "die_semi_angle_deg": 8.0, "friction_coefficient_mu": 0.08, "material_yield_stress_mpa": 320.0}
            },
            "steel_rod_drawing": {
                "name": "Steel Rod Drawing (12mm to 10mm)",
                "params": {"initial_wire_diameter_mm": 12.0, "final_wire_diameter_mm": 10.0, "die_semi_angle_deg": 10.0, "friction_coefficient_mu": 0.10, "material_yield_stress_mpa": 550.0}
            }
        }
