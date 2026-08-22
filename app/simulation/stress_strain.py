"""
Stress-Strain & Elastic Constants Physics Engine
=================================================
Calculates normal stress sigma, strain epsilon, Young's modulus E, shear modulus G,
bulk modulus K, Poisson's ratio nu, and strain energy U.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class StressStrainInput(BaseModel):
    applied_force_kn: float = Field(default=50.0, ge=0.1, le=2000.0, description="Applied axial tensile/compressive load F in kN")
    specimen_diameter_mm: float = Field(default=12.5, ge=1.0, le=200.0, description="Specimen circular diameter d in mm")
    gauge_length_mm: float = Field(default=50.0, ge=10.0, le=500.0, description="Initial gauge length L in mm")
    youngs_modulus_gpa: float = Field(default=200.0, ge=1.0, le=1000.0, description="Young's Modulus E in GPa (Steel ≈ 200 GPa)")
    poissons_ratio: float = Field(default=0.30, ge=0.0, le=0.49, description="Poisson's ratio nu (Steel ≈ 0.30)")


class StressStrainOutput(BaseModel):
    cross_sectional_area_mm2: float
    axial_stress_mpa: float
    axial_strain_micro: float
    elongation_mm: float
    shear_modulus_gpa: float
    bulk_modulus_gpa: float
    strain_energy_joules: float
    lateral_contraction_mm: float
    status_note: str


class StressStrainEngine(BaseSimulationEngine):
    name = "stress-strain"
    description = "Hooke's Law and elastic constants: stress, strain, E, G, K, Poisson's ratio, and strain energy"

    def calculate(self, params: StressStrainInput) -> StressStrainOutput:
        d = params.specimen_diameter_mm
        area_mm2 = (math.pi * (d ** 2)) / 4.0
        area_m2 = area_mm2 * 1e-6

        force_n = params.applied_force_kn * 1000.0

        # Stress sigma = F / A in MPa (N/mm^2)
        stress_mpa = force_n / area_mm2 if area_mm2 > 0 else 0.0
        stress_pa = stress_mpa * 1e6

        e_pa = params.youngs_modulus_gpa * 1e9
        # Strain epsilon = sigma / E
        strain = stress_pa / e_pa if e_pa > 0 else 0.0
        strain_micro = strain * 1e6

        # Elongation delta = strain * L
        l_mm = params.gauge_length_mm
        elongation_mm = strain * l_mm

        nu = params.poissons_ratio
        # Shear modulus G = E / (2 * (1 + nu)) in GPa
        g_gpa = params.youngs_modulus_gpa / (2.0 * (1.0 + nu))

        # Bulk modulus K = E / (3 * (1 - 2 * nu)) in GPa
        k_gpa = params.youngs_modulus_gpa / (3.0 * (1.0 - 2.0 * nu)) if (1.0 - 2.0 * nu) > 0 else 999.0

        # Lateral contraction delta_d = nu * strain * d
        lateral_contraction_mm = nu * strain * d

        # Strain Energy U = (sigma^2 * Volume) / (2 * E)
        volume_m3 = area_m2 * (l_mm / 1000.0)
        strain_energy_j = ((stress_pa ** 2) * volume_m3) / (2.0 * e_pa) if e_pa > 0 else 0.0

        note = (
            f"Elastic Analysis: Stress σ = {stress_mpa:.1f} MPa | Strain ε = {strain_micro:.0f} µε "
            f"| Elongation ΔL = {elongation_mm:.4f} mm (G = {g_gpa:.1f} GPa, K = {k_gpa:.1f} GPa)."
        )

        return StressStrainOutput(
            cross_sectional_area_mm2=float(area_mm2),
            axial_stress_mpa=float(stress_mpa),
            axial_strain_micro=float(strain_micro),
            elongation_mm=float(elongation_mm),
            shear_modulus_gpa=float(g_gpa),
            bulk_modulus_gpa=float(k_gpa),
            strain_energy_joules=float(strain_energy_j),
            lateral_contraction_mm=float(lateral_contraction_mm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "structural_steel": {
                "name": "Structural Steel ASTM A36",
                "params": {"applied_force_kn": 50.0, "specimen_diameter_mm": 12.5, "youngs_modulus_gpa": 200.0, "poissons_ratio": 0.29}
            },
            "aluminum_alloy": {
                "name": "Aluminum Alloy 6061-T6",
                "params": {"applied_force_kn": 30.0, "specimen_diameter_mm": 12.5, "youngs_modulus_gpa": 68.9, "poissons_ratio": 0.33}
            }
        }
