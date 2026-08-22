"""
Thin & Thick Pressure Vessels Physics Engine
=============================================
Calculates hoop stress sigma_h, longitudinal stress sigma_l, maximum shear stress tau_max,
Lame's equations for thick cylinders, and volumetric expansion delta_V.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PressureVesselInput(BaseModel):
    vessel_category: Literal["thin_cylinder", "thick_cylinder"] = Field(
        default="thin_cylinder",
        description="Pressure vessel wall regime: Thin (t < d/20) or Thick (Lame equations)"
    )
    internal_pressure_bar: float = Field(default=20.0, ge=0.5, le=1000.0, description="Internal gauge pressure p in bar (1 bar = 0.1 MPa)")
    inner_diameter_mm: float = Field(default=400.0, ge=50.0, le=3000.0, description="Inner vessel diameter d_i in mm")
    wall_thickness_mm: float = Field(default=10.0, ge=1.0, le=200.0, description="Wall thickness t in mm")
    vessel_length_mm: float = Field(default=1500.0, ge=200.0, le=10000.0, description="Vessel length L in mm")
    youngs_modulus_gpa: float = Field(default=200.0, ge=10.0, le=500.0, description="Material Young's Modulus E in GPa")
    poissons_ratio: float = Field(default=0.30, ge=0.0, le=0.49, description="Poisson's ratio nu")


class PressureVesselOutput(BaseModel):
    vessel_category: str
    diameter_to_thickness_ratio: float
    hoop_stress_mpa: float
    longitudinal_stress_mpa: float
    max_shear_stress_mpa: float
    radial_stress_inner_mpa: float
    volumetric_expansion_cm3: float
    factor_of_safety: float
    status_note: str


class PressureVesselEngine(BaseSimulationEngine):
    name = "pressure-vessel"
    description = "Thin and thick pressure vessel mechanics: hoop stress, longitudinal stress, Lame's equations, and expansion"

    def calculate(self, params: PressureVesselInput) -> PressureVesselOutput:
        p_mpa = params.internal_pressure_bar * 0.1  # 1 bar = 0.1 MPa
        d_i = params.inner_diameter_mm
        t = params.wall_thickness_mm
        ratio = d_i / t if t > 0 else 100.0

        r_i = d_i / 2.0
        r_o = r_i + t

        if params.vessel_category == "thin_cylinder" or ratio > 20.0:
            # Thin cylinder approximation
            sigma_h = (p_mpa * d_i) / (2.0 * t) if t > 0 else 0.0
            sigma_l = (p_mpa * d_i) / (4.0 * t) if t > 0 else 0.0
            tau_max = (sigma_h - sigma_l) / 2.0
            sigma_r_i = -p_mpa
            type_title = "Thin Wall Cylinder"
        else:
            # Thick cylinder Lame's Equations (p_o = 0)
            # a = (p_i * r_i^2) / (r_o^2 - r_i^2)
            # b = (p_i * r_i^2 * r_o^2) / (r_o^2 - r_i^2)
            denom = (r_o ** 2) - (r_i ** 2)
            a_const = (p_mpa * (r_i ** 2)) / denom if denom > 0 else 0.0
            b_const = (p_mpa * (r_i ** 2) * (r_o ** 2)) / denom if denom > 0 else 0.0

            # Max hoop stress occurs at inner radius r_i: sigma_theta_max = a + b / r_i^2
            sigma_h = a_const + (b_const / (r_i ** 2))
            sigma_l = a_const  # Average longitudinal stress
            sigma_r_i = -p_mpa
            tau_max = (sigma_h - sigma_r_i) / 2.0
            type_title = "Thick Wall Cylinder (Lame Equations)"

        e_pa = params.youngs_modulus_gpa * 1e9
        nu = params.poissons_ratio
        # Volumetric strain eps_v = (p*d / (4*t*E)) * (5 - 4*nu)
        l_mm = params.vessel_length_mm
        v_initial_mm3 = (math.pi * (r_i ** 2)) * l_mm
        eps_v = ((p_mpa * 1e6 * (d_i / 1000.0)) / (4.0 * (t / 1000.0) * e_pa)) * (5.0 - 4.0 * nu) if t > 0 else 0.0
        delta_v_mm3 = eps_v * v_initial_mm3
        delta_v_cm3 = delta_v_mm3 / 1000.0

        # Assuming yield strength 250 MPa for structural steel reference
        fos = 250.0 / sigma_h if sigma_h > 0 else 99.0

        note = (
            f"{type_title} (d/t = {ratio:.1f}): Internal Pressure = {params.internal_pressure_bar:.1f} bar | "
            f"Hoop Stress σ_h = {sigma_h:.1f} MPa | Longitudinal Stress σ_l = {sigma_l:.1f} MPa | Max Shear τ_max = {tau_max:.1f} MPa."
        )

        return PressureVesselOutput(
            vessel_category=type_title,
            diameter_to_thickness_ratio=float(ratio),
            hoop_stress_mpa=float(sigma_h),
            longitudinal_stress_mpa=float(sigma_l),
            max_shear_stress_mpa=float(tau_max),
            radial_stress_inner_mpa=float(sigma_r_i),
            volumetric_expansion_cm3=float(delta_v_cm3),
            factor_of_safety=float(fos),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "thin_air_tank": {
                "name": "Compressed Air Storage Tank (Thin)",
                "params": {"vessel_category": "thin_cylinder", "internal_pressure_bar": 15.0, "inner_diameter_mm": 500.0, "wall_thickness_mm": 8.0, "vessel_length_mm": 1500.0}
            },
            "thick_hydraulic_cylinder": {
                "name": "High-Pressure Hydraulic Cylinder (Thick)",
                "params": {"vessel_category": "thick_cylinder", "internal_pressure_bar": 250.0, "inner_diameter_mm": 120.0, "wall_thickness_mm": 25.0, "vessel_length_mm": 800.0}
            }
        }
