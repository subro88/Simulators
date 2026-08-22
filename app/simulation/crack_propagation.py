"""
Fracture Mechanics & Crack Propagation Physics Engine
=====================================================
Calculates stress intensity factor KI, critical crack size ac,
Paris Law crack growth rate da/dN, and cycles to failure Nf.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CrackPropagationInput(BaseModel):
    initial_crack_size_mm: float = Field(default=2.0, ge=0.1, le=50.0, description="Initial crack length a_0 in mm")
    fracture_toughness_mpam: float = Field(default=50.0, ge=10.0, le=200.0, description="Material fracture toughness K_Ic in MPa·√m")
    max_stress_mpa: float = Field(default=150.0, ge=10.0, le=1000.0, description="Peak nominal stress sigma_max in MPa")
    min_stress_mpa: float = Field(default=15.0, ge=0.0, le=500.0, description="Minimum nominal stress sigma_min in MPa")
    geometry_factor_y: float = Field(default=1.12, ge=0.8, le=2.5, description="Shape factor Y (edge crack ≈ 1.12, center crack ≈ 1.0)")
    paris_constant_c: float = Field(default=1.5e-11, ge=1e-13, le=1e-8, description="Paris law material constant C")
    paris_exponent_m: float = Field(default=3.0, ge=2.0, le=4.5, description="Paris law exponent m")


class CrackPropagationOutput(BaseModel):
    stress_intensity_ki_mpam: float
    critical_crack_size_mm: float
    crack_growth_rate_mm_cycle: float
    cycles_to_failure_nf: float
    fracture_safety_factor: float
    status_note: str


class CrackPropagationEngine(BaseSimulationEngine):
    name = "crack-propagation"
    description = "Linear elastic fracture mechanics: stress intensity KI, critical crack size ac, Paris law da/dN, and cycles Nf"

    def calculate(self, params: CrackPropagationInput) -> CrackPropagationOutput:
        a_0_mm = params.initial_crack_size_mm
        a_0_m = a_0_mm / 1000.0
        k_ic = params.fracture_toughness_mpam
        s_max = params.max_stress_mpa
        s_min = params.min_stress_mpa
        y_geo = params.geometry_factor_y

        # Stress intensity KI = Y * sigma_max * sqrt(pi * a)
        k_i = y_geo * s_max * math.sqrt(math.pi * a_0_m)

        # Critical crack size a_c = (1 / pi) * (K_Ic / (Y * sigma_max))^2
        a_c_m = (1.0 / math.pi) * ((k_ic / (y_geo * s_max)) ** 2) if (y_geo * s_max) > 0 else 0.1
        a_c_mm = a_c_m * 1000.0

        # Stress range delta_sigma
        delta_s = max(0.1, s_max - s_min)
        delta_k = y_geo * delta_s * math.sqrt(math.pi * a_0_m)

        # Paris Law da/dN = C * (delta_K)^m (m/cycle)
        c_paris = params.paris_constant_c
        m_paris = params.paris_exponent_m
        da_dn_m = c_paris * (delta_k ** m_paris)
        da_dn_mm = da_dn_m * 1000.0

        # Cycles to failure Nf by integrating Paris Law from a_0 to a_c
        if a_c_m > a_0_m and m_paris != 2.0:
            term1 = 2.0 / ((m_paris - 2.0) * c_paris * ((y_geo * delta_s * math.sqrt(math.pi)) ** m_paris))
            term2 = (1.0 / (a_0_m ** ((m_paris - 2.0) / 2.0))) - (1.0 / (a_c_m ** ((m_paris - 2.0) / 2.0)))
            n_f = term1 * term2
        else:
            n_f = 1e6

        n_f = max(0.0, n_f)

        fos_fracture = k_ic / k_i if k_i > 0 else 99.0

        status_text = "SAFE FROM FAST FRACTURE" if fos_fracture >= 1.0 else "CRITICAL: FRACTURE TOUGHNESS EXCEEDED!"

        note = (
            f"Fracture Analysis (a_0 = {a_0_mm:.1f} mm): Stress Intensity K_I = {k_i:.1f} MPa·√m (K_Ic = {k_ic:.0f}) | "
            f"Critical Crack Size a_c = {a_c_mm:.1f} mm | Remaining Fatigue Life N_f = {n_f:.0e} cycles ({status_text})."
        )

        return CrackPropagationOutput(
            stress_intensity_ki_mpam=float(k_i),
            critical_crack_size_mm=float(a_c_mm),
            crack_growth_rate_mm_cycle=float(da_dn_mm),
            cycles_to_failure_nf=float(n_f),
            fracture_safety_factor=float(fos_fracture),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "aircraft_skin_crack": {
                "name": "Aircraft Fuselage Panel Crack",
                "params": {"initial_crack_size_mm": 2.0, "fracture_toughness_mpam": 35.0, "max_stress_mpa": 120.0, "min_stress_mpa": 10.0, "geometry_factor_y": 1.12, "paris_constant_c": 2.0e-11, "paris_exponent_m": 3.2}
            },
            "pressure_pipe_flaw": {
                "name": "Steel Pressure Pipeline Flaw",
                "params": {"initial_crack_size_mm": 5.0, "fracture_toughness_mpam": 65.0, "max_stress_mpa": 180.0, "min_stress_mpa": 20.0, "geometry_factor_y": 1.0, "paris_constant_c": 1.5e-11, "paris_exponent_m": 3.0}
            }
        }
