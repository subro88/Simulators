"""
Reynolds Number & Flow Regimes Physics Engine
=============================================
Calculates Reynolds number Re, kinematic viscosity nu, flow regime classification
(Laminar, Transition, Turbulent), and entrance length L_e.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ReynoldsNumberInput(BaseModel):
    pipe_diameter_mm: float = Field(default=50.0, ge=5.0, le=500.0, description="Pipe internal diameter d in mm")
    flow_velocity_ms: float = Field(default=1.2, ge=0.01, le=50.0, description="Mean fluid velocity v in m/s")
    fluid_density_kg_m3: float = Field(default=1000.0, ge=0.5, le=2000.0, description="Fluid density rho in kg/m³")
    dynamic_viscosity_mpas: float = Field(default=1.002, ge=0.01, le=1000.0, description="Dynamic viscosity mu in mPa·s (Water at 20°C ≈ 1.002 mPa·s)")


class ReynoldsNumberOutput(BaseModel):
    reynolds_number: float
    kinematic_viscosity_cst: float
    flow_regime: str
    hydrodynamic_entry_length_m: float
    friction_factor_laminar: float
    status_note: str


class ReynoldsNumberEngine(BaseSimulationEngine):
    name = "reynolds-number"
    description = "Reynolds number and flow regime classification: Re = rho*v*d/mu, entry length, and laminar vs turbulent transition"

    def calculate(self, params: ReynoldsNumberInput) -> ReynoldsNumberOutput:
        d = params.pipe_diameter_mm / 1000.0
        v = params.flow_velocity_ms
        rho = params.fluid_density_kg_m3
        mu_pa_s = params.dynamic_viscosity_mpas / 1000.0  # convert mPa·s to Pa·s

        # Kinematic viscosity nu = mu / rho in m^2/s (1 cSt = 1e-6 m^2/s)
        nu_m2s = mu_pa_s / rho if rho > 0 else 1e-6
        nu_cst = nu_m2s * 1e6

        # Reynolds number Re = (rho * v * d) / mu
        re = (rho * v * d) / mu_pa_s if mu_pa_s > 0 else 0.0

        if re < 2300.0:
            regime = "Laminar Flow (Smooth Layered Motion)"
            # Hydrodynamic entry length L_e = 0.05 * Re * d
            entry_length_m = 0.05 * re * d
            f_laminar = 64.0 / re if re > 0 else 0.0
        elif 2300.0 <= re <= 4000.0:
            regime = "Transitional Flow (Unstable Dye Streak Breakdown)"
            entry_length_m = 0.05 * re * d
            f_laminar = 64.0 / re
        else:
            regime = "Turbulent Flow (Full Swirling & Chaotic Mixing)"
            # Hydrodynamic entry length for turbulent L_e ≈ 4.4 * Re^(1/6) * d
            entry_length_m = 4.4 * (re ** (1.0 / 6.0)) * d
            f_laminar = 0.316 / (re ** 0.25)  # Blasius formula

        note = (
            f"Flow Regime: {regime} | Reynolds Number Re = {re:.0f} (Kinematic Viscosity ν = {nu_cst:.2f} cSt) "
            f"| Entry Length L_e = {entry_length_m:.2f} m."
        )

        return ReynoldsNumberOutput(
            reynolds_number=float(re),
            kinematic_viscosity_cst=float(nu_cst),
            flow_regime=regime,
            hydrodynamic_entry_length_m=float(entry_length_m),
            friction_factor_laminar=float(f_laminar),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "water_laminar_pipe": {
                "name": "Water Slow Pipe Flow (Laminar)",
                "params": {"pipe_diameter_mm": 25.0, "flow_velocity_ms": 0.05, "fluid_density_kg_m3": 1000.0, "dynamic_viscosity_mpas": 1.002}
            },
            "water_turbulent_main": {
                "name": "Water Supply Main Pipe (Turbulent)",
                "params": {"pipe_diameter_mm": 100.0, "flow_velocity_ms": 2.5, "fluid_density_kg_m3": 1000.0, "dynamic_viscosity_mpas": 1.002}
            }
        }
