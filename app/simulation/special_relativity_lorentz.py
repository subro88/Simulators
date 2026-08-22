"""
Special Relativity Lorentz Transformations Physics Engine
=========================================================
Calculates Lorentz factor gamma, time dilation t', length contraction L',
relativistic momentum p, and total energy E = gamma*m0*c^2.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SpecialRelativityLorentzInput(BaseModel):
    velocity_fraction_c: float = Field(default=0.8, ge=0.0, le=0.9999, description="Velocity as a fraction of light speed (v/c)")
    rest_time_proper_sec: float = Field(default=10.0, ge=0.1, le=1000.0, description="Proper time interval t0 in seconds")
    rest_length_proper_m: float = Field(default=100.0, ge=1.0, le=10000.0, description="Proper length L0 in meters")
    rest_mass_kg: float = Field(default=1.0, ge=1.0e-30, le=1000.0, description="Rest mass m0 in kg")


class SpecialRelativityLorentzOutput(BaseModel):
    velocity_fraction_c: float
    lorentz_factor_gamma: float
    dilated_time_sec: float
    contracted_length_m: float
    relativistic_mass_kg: float
    total_energy_joules: float
    kinetic_energy_joules: float
    status_note: str


class SpecialRelativityLorentzEngine(BaseSimulationEngine):
    name = "special-relativity-lorentz"
    description = "Einstein's Special Relativity: Lorentz factor gamma = 1/sqrt(1-v^2/c^2), time dilation t', and length contraction L'"

    def calculate(self, params: SpecialRelativityLorentzInput) -> SpecialRelativityLorentzOutput:
        beta = params.velocity_fraction_c
        t0 = params.rest_time_proper_sec
        l0 = params.rest_length_proper_m
        m0 = params.rest_mass_kg

        c_speed = 2.99792458e8  # m/s

        # Lorentz Factor gamma = 1 / sqrt(1 - beta^2)
        gamma = 1.0 / math.sqrt(1.0 - (beta ** 2)) if beta < 1.0 else 999.0

        # Time Dilation t' = gamma * t0
        t_dilated = gamma * t0

        # Length Contraction L' = L0 / gamma
        l_contracted = l0 / gamma

        # Relativistic Mass m = gamma * m0
        m_rel = gamma * m0

        # Total Energy E = gamma * m0 * c^2
        e_total = gamma * m0 * (c_speed ** 2)

        # Kinetic Energy KE = (gamma - 1) * m0 * c^2
        ke_joules = (gamma - 1.0) * m0 * (c_speed ** 2)

        note = (
            f"Special Relativity (v = {beta:.3f}c): Lorentz Factor γ = {gamma:.3f} | "
            f"Proper Time t0 = {t0:.1f}s -> Dilated Time t' = {t_dilated:.1f}s | "
            f"Proper Length L0 = {l0:.1f}m -> Contracted Length L' = {l_contracted:.1f}m | "
            f"Kinetic Energy KE = {ke_joules:.3e} Joules."
        )

        return SpecialRelativityLorentzOutput(
            velocity_fraction_c=float(beta),
            lorentz_factor_gamma=float(gamma),
            dilated_time_sec=float(t_dilated),
            contracted_length_m=float(l_contracted),
            relativistic_mass_kg=float(m_rel),
            total_energy_joules=float(e_total),
            kinetic_energy_joules=float(ke_joules),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "relativity_80pct_c": {
                "name": "High Speed Spacecraft (v = 0.80c, gamma = 1.667)",
                "params": {"velocity_fraction_c": 0.80, "rest_time_proper_sec": 10.0, "rest_length_proper_m": 100.0, "rest_mass_kg": 1.0}
            },
            "particle_accelerator_99pct": {
                "name": "Particle Accelerator Proton (v = 0.99c, gamma = 7.089)",
                "params": {"velocity_fraction_c": 0.99, "rest_time_proper_sec": 1.0, "rest_length_proper_m": 10.0, "rest_mass_kg": 1.67e-27}
            }
        }
