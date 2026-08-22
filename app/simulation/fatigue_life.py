"""
Fatigue Life & Goodman/Soderberg Diagram Physics Engine
========================================================
Calculates endurance limit Se, stress amplitude sigma_a, mean stress sigma_m,
Goodman factor of safety n_G, Soderberg n_S, and Gerber n_Ger.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class FatigueLifeInput(BaseModel):
    ultimate_strength_mpa: float = Field(default=600.0, ge=200.0, le=2000.0, description="Material ultimate tensile strength S_ut in MPa")
    yield_strength_mpa: float = Field(default=400.0, ge=100.0, le=1800.0, description="Material yield strength S_yt in MPa")
    max_cyclic_stress_mpa: float = Field(default=250.0, ge=-1000.0, le=1500.0, description="Maximum cyclic stress sigma_max in MPa")
    min_cyclic_stress_mpa: float = Field(default=50.0, ge=-1000.0, le=1500.0, description="Minimum cyclic stress sigma_min in MPa")
    surface_factor_ka: float = Field(default=0.85, ge=0.2, le=1.0, description="Surface finish modification factor k_a (ground=0.9, machined=0.8, forged=0.5)")
    size_factor_kb: float = Field(default=0.85, ge=0.5, le=1.0, description="Size modification factor k_b")


class FatigueLifeOutput(BaseModel):
    unmodified_endurance_se_prime_mpa: float
    modified_endurance_se_mpa: float
    stress_amplitude_sigma_a_mpa: float
    mean_stress_sigma_m_mpa: float
    goodman_safety_factor: float
    soderberg_safety_factor: float
    gerber_safety_factor: float
    fatigue_regime: str
    status_note: str


class FatigueLifeEngine(BaseSimulationEngine):
    name = "fatigue-life"
    description = "Fatigue failure criteria and Goodman/Soderberg diagrams: endurance limit Se, mean stress sigma_m, stress amplitude sigma_a"

    def calculate(self, params: FatigueLifeInput) -> FatigueLifeOutput:
        s_ut = params.ultimate_strength_mpa
        s_yt = params.yield_strength_mpa
        s_max = params.max_cyclic_stress_mpa
        s_min = params.min_cyclic_stress_mpa

        # Unmodified endurance limit Se' = 0.5 * Sut (for Sut <= 1400 MPa)
        se_prime = 0.5 * s_ut if s_ut <= 1400.0 else 700.0

        # Modified endurance limit Se = ka * kb * Se'
        se = params.surface_factor_ka * params.size_factor_kb * se_prime

        # Stress Amplitude sigma_a = (sigma_max - sigma_min) / 2
        sigma_a = (s_max - s_min) / 2.0

        # Mean Stress sigma_m = (sigma_max + sigma_min) / 2
        sigma_m = (s_max + s_min) / 2.0

        # Modified Goodman: 1 / n_G = sigma_a / Se + sigma_m / Sut
        denom_goodman = (sigma_a / se) + (sigma_m / s_ut) if s_ut > 0 and se > 0 else 1.0
        n_goodman = 1.0 / denom_goodman if denom_goodman > 0 else 0.0

        # Soderberg: 1 / n_S = sigma_a / Se + sigma_m / Syt
        denom_soderberg = (sigma_a / se) + (sigma_m / s_yt) if s_yt > 0 and se > 0 else 1.0
        n_soderberg = 1.0 / denom_soderberg if denom_soderberg > 0 else 0.0

        # Gerber: (n * sigma_a / Se) + (n * sigma_m / Sut)^2 = 1 => Quadratic equation for n
        # (sigma_m/Sut)^2 * n^2 + (sigma_a/Se) * n - 1 = 0
        a_quad = (sigma_m / s_ut) ** 2
        b_quad = (sigma_a / se)
        c_quad = -1.0
        if a_quad > 0:
            disc = (b_quad ** 2) - (4.0 * a_quad * c_quad)
            n_gerber = (-b_quad + math.sqrt(disc)) / (2.0 * a_quad) if disc >= 0 else 0.0
        else:
            n_gerber = 1.0 / b_quad if b_quad > 0 else 0.0

        if n_goodman >= 1.0:
            regime = "Infinite Life (> 10^6 Cycles)"
        else:
            regime = "Finite Life Fatigue Risk (< 10^6 Cycles)"

        note = (
            f"Fatigue Analysis: Modified Endurance Limit S_e = {se:.1f} MPa | Stress Amp σ_a = {sigma_a:.1f} MPa, Mean σ_m = {sigma_m:.1f} MPa | "
            f"Goodman FOS = {n_goodman:.2f}, Soderberg FOS = {n_soderberg:.2f} ({regime})."
        )

        return FatigueLifeOutput(
            unmodified_endurance_se_prime_mpa=float(se_prime),
            modified_endurance_se_mpa=float(se),
            stress_amplitude_sigma_a_mpa=float(sigma_a),
            mean_stress_sigma_m_mpa=float(sigma_m),
            goodman_safety_factor=float(n_goodman),
            soderberg_safety_factor=float(n_soderberg),
            gerber_safety_factor=float(n_gerber),
            fatigue_regime=regime,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "shaft_bending_fatigue": {
                "name": "Rotating Shaft Reverse Bending Fatigue",
                "params": {"ultimate_strength_mpa": 650.0, "yield_strength_mpa": 450.0, "max_cyclic_stress_mpa": 180.0, "min_cyclic_stress_mpa": -180.0, "surface_factor_ka": 0.85, "size_factor_kb": 0.85}
            },
            "connecting_rod_fluctuating": {
                "name": "Engine Connecting Rod Fluctuating Tension",
                "params": {"ultimate_strength_mpa": 850.0, "yield_strength_mpa": 600.0, "max_cyclic_stress_mpa": 320.0, "min_cyclic_stress_mpa": 40.0, "surface_factor_ka": 0.75, "size_factor_kb": 0.85}
            }
        }
