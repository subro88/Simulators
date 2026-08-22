"""
Direct Shear Test Soil Mohr-Coulomb Physics Engine
===================================================
Calculates Mohr-Coulomb failure envelope tau = c + sigma * tan(phi),
cohesion c, friction angle phi, and principal failure stresses.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ShearStrengthDirectInput(BaseModel):
    normal_stress_sigma_kpa: float = Field(default=150.0, ge=10.0, le=1000.0, description="Normal stress sigma on shear plane in kPa")
    cohesion_c_kpa: float = Field(default=20.0, ge=0.0, le=200.0, description="Soil cohesion intercept c in kPa")
    friction_angle_phi_deg: float = Field(default=28.0, ge=0.0, le=45.0, description="Internal friction angle phi in degrees")


class ShearStrengthDirectOutput(BaseModel):
    normal_stress_kpa: float
    shear_strength_tau_kpa: float
    friction_angle_deg: float
    cohesion_kpa: float
    major_principal_stress_sigma1_kpa: float
    minor_principal_stress_sigma3_kpa: float
    status_note: str


class ShearStrengthDirectEngine(BaseSimulationEngine):
    name = "shear-strength-direct"
    description = "Mohr-Coulomb Failure Criterion: Direct shear test envelope tau = c + sigma*tan(phi), cohesion c, and principal stresses"

    def calculate(self, params: ShearStrengthDirectInput) -> ShearStrengthDirectOutput:
        sigma = params.normal_stress_sigma_kpa
        c = params.cohesion_c_kpa
        phi_deg = params.friction_angle_phi_deg

        phi_rad = math.radians(phi_deg)

        # Shear Strength tau = c + sigma * tan(phi) (kPa)
        tau = c + sigma * math.tan(phi_rad)

        # Principal Stresses at failure:
        # sigma1 = sigma3 * tan^2(45 + phi/2) + 2 * c * tan(45 + phi/2)
        n_phi = math.tan(math.radians(45.0 + phi_deg / 2.0)) ** 2
        sigma3 = (sigma - c * math.sin(phi_rad)) / (1.0 + math.sin(phi_rad)) if (1.0 + math.sin(phi_rad)) > 0 else sigma * 0.5
        sigma3 = max(0.0, sigma3)
        sigma1 = sigma3 * n_phi + 2.0 * c * math.sqrt(n_phi)

        note = (
            f"Mohr-Coulomb Shear Envelope (c = {c:.0f} kPa, ϕ = {phi_deg:.1f}°): "
            f"At Normal Stress σ = {sigma:.0f} kPa -> Shear Strength τ = {tau:.1f} kPa | "
            f"Principal Failure Stresses (σ1 = {sigma1:.1f} kPa, σ3 = {sigma3:.1f} kPa)."
        )

        return ShearStrengthDirectOutput(
            normal_stress_kpa=float(sigma),
            shear_strength_tau_kpa=float(tau),
            friction_angle_deg=float(phi_deg),
            cohesion_kpa=float(c),
            major_principal_stress_sigma1_kpa=float(sigma1),
            minor_principal_stress_sigma3_kpa=float(sigma3),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "sandy_clay_direct_shear": {
                "name": "Sandy Clay Soil Shear Test (c = 20 kPa, phi = 28°)",
                "params": {"normal_stress_sigma_kpa": 150.0, "cohesion_c_kpa": 20.0, "friction_angle_phi_deg": 28.0}
            },
            "dense_sand_drained": {
                "name": "Dense Sand Drained Shear Test (c = 0 kPa, phi = 38°)",
                "params": {"normal_stress_sigma_kpa": 200.0, "cohesion_c_kpa": 0.0, "friction_angle_phi_deg": 38.0}
            }
        }
