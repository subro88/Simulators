"""
Mohr's Circle & Principal Stresses Physics Engine
=================================================
Calculates 2D plane stress transformations, principal stresses sigma_1 and sigma_2,
maximum in-plane shear stress tau_max, average stress sigma_avg, and principal angle theta_p.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MohrsCircleInput(BaseModel):
    sigma_x_mpa: float = Field(default=80.0, ge=-1000.0, le=1000.0, description="Normal stress along x-axis sigma_x in MPa")
    sigma_y_mpa: float = Field(default=-40.0, ge=-1000.0, le=1000.0, description="Normal stress along y-axis sigma_y in MPa")
    tau_xy_mpa: float = Field(default=35.0, ge=-500.0, le=500.0, description="Shear stress tau_xy in MPa")
    element_angle_deg: float = Field(default=0.0, ge=-180.0, le=180.0, description="Plane rotation angle theta in degrees")


class MohrsCircleOutput(BaseModel):
    center_sigma_avg_mpa: float
    radius_r_mpa: float
    principal_stress_1_mpa: float
    principal_stress_2_mpa: float
    max_shear_stress_mpa: float
    principal_angle_deg: float
    transformed_sigma_x_mpa: float
    transformed_sigma_y_mpa: float
    transformed_tau_xy_mpa: float
    status_note: str


class MohrsCircleEngine(BaseSimulationEngine):
    name = "mohrs-circle"
    description = "2D plane stress state transformation: Mohr's Circle center, radius R, principal stresses, and tau_max"

    def calculate(self, params: MohrsCircleInput) -> MohrsCircleOutput:
        sx = params.sigma_x_mpa
        sy = params.sigma_y_mpa
        txy = params.tau_xy_mpa

        # Center sigma_avg = (sigma_x + sigma_y) / 2
        sigma_avg = (sx + sy) / 2.0

        # Radius R = sqrt(((sigma_x - sigma_y)/2)^2 + tau_xy^2)
        r = math.sqrt((((sx - sy) / 2.0) ** 2) + (txy ** 2))

        # Principal stresses sigma_1, sigma_2
        sigma_1 = sigma_avg + r
        sigma_2 = sigma_avg - r

        # Max in-plane shear stress tau_max = R
        tau_max = r

        # Principal angle 2*theta_p = atan(2*tau_xy / (sigma_x - sigma_y))
        denom = sx - sy
        if not math.isclose(denom, 0.0, abs_tol=1e-6):
            two_theta_p_rad = math.atan2(2.0 * txy, denom)
        else:
            two_theta_p_rad = math.pi / 2.0 if txy >= 0 else -math.pi / 2.0

        theta_p_deg = math.degrees(two_theta_p_rad / 2.0)

        # Transformed stresses on plane rotated by angle theta
        theta_rad = math.radians(params.element_angle_deg)
        cos2 = math.cos(2.0 * theta_rad)
        sin2 = math.sin(2.0 * theta_rad)

        sx_prime = sigma_avg + ((sx - sy) / 2.0) * cos2 + txy * sin2
        sy_prime = sigma_avg - ((sx - sy) / 2.0) * cos2 - txy * sin2
        txy_prime = -((sx - sy) / 2.0) * sin2 + txy * cos2

        note = (
            f"Mohr's Circle: Center = {sigma_avg:.1f} MPa, Radius R = {r:.1f} MPa | "
            f"Principal Stresses: σ₁ = {sigma_1:.1f} MPa, σ₂ = {sigma_2:.1f} MPa | Max Shear τ_max = {tau_max:.1f} MPa (θ_p = {theta_p_deg:.1f}°)."
        )

        return MohrsCircleOutput(
            center_sigma_avg_mpa=float(sigma_avg),
            radius_r_mpa=float(r),
            principal_stress_1_mpa=float(sigma_1),
            principal_stress_2_mpa=float(sigma_2),
            max_shear_stress_mpa=float(tau_max),
            principal_angle_deg=float(theta_p_deg),
            transformed_sigma_x_mpa=float(sx_prime),
            transformed_sigma_y_mpa=float(sy_prime),
            transformed_tau_xy_mpa=float(txy_prime),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "combined_bending_torsion": {
                "name": "Shaft Combined Bending & Torsion",
                "params": {"sigma_x_mpa": 120.0, "sigma_y_mpa": 0.0, "tau_xy_mpa": 45.0, "element_angle_deg": 0.0}
            },
            "pure_shear": {
                "name": "Pure Shear State",
                "params": {"sigma_x_mpa": 0.0, "sigma_y_mpa": 0.0, "tau_xy_mpa": 60.0, "element_angle_deg": 0.0}
            }
        }
