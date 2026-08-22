"""
Bernoulli's Principle & Venturimeter Dynamics Physics Engine
============================================================
Calculates pipe & throat flow velocities v1, v2, differential pressure delta_P,
manometer head delta_h, and volumetric flow rate Q.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BernoullisPrincipleInput(BaseModel):
    pipe_diameter_mm: float = Field(default=100.0, ge=20.0, le=500.0, description="Inlet pipe diameter d1 in mm")
    throat_diameter_mm: float = Field(default=50.0, ge=10.0, le=400.0, description="Venturi throat diameter d2 in mm")
    discharge_coeff_cd: float = Field(default=0.98, ge=0.80, le=1.0, description="Coefficient of discharge C_d")
    fluid_density_kg_m3: float = Field(default=1000.0, ge=500.0, le=1500.0, description="Fluid density rho in kg/m³")
    manometer_head_mm: float = Field(default=250.0, ge=10.0, le=2000.0, description="Manometer fluid differential head h in mm")
    inlet_pressure_kpa: float = Field(default=200.0, ge=10.0, le=1000.0, description="Inlet static gauge pressure P1 in kPa")


class BernoullisPrincipleOutput(BaseModel):
    inlet_area_mm2: float
    throat_area_mm2: float
    inlet_velocity_ms: float
    throat_velocity_ms: float
    throat_pressure_kpa: float
    volumetric_flow_rate_lps: float
    mass_flow_rate_kg_s: float
    status_note: str


class BernoullisPrincipleEngine(BaseSimulationEngine):
    name = "bernoullis-principle"
    description = "Bernoulli equation and Venturi discharge: velocity acceleration, pressure drop, and flow rate Q"

    def calculate(self, params: BernoullisPrincipleInput) -> BernoullisPrincipleOutput:
        d1 = params.pipe_diameter_mm / 1000.0
        d2 = params.throat_diameter_mm / 1000.0
        g = 9.81

        a1_m2 = (math.pi * (d1 ** 2)) / 4.0
        a2_m2 = (math.pi * (d2 ** 2)) / 4.0

        h_m = params.manometer_head_mm / 1000.0

        # Theoretical discharge Q_actual = Cd * (A1 * A2 / sqrt(A1^2 - A2^2)) * sqrt(2 * g * h)
        denom_sq = (a1_m2 ** 2) - (a2_m2 ** 2)
        q_m3s = params.discharge_coeff_cd * ((a1_m2 * a2_m2) / math.sqrt(denom_sq)) * math.sqrt(2.0 * g * h_m) if denom_sq > 0 and h_m > 0 else 0.0

        v1_ms = q_m3s / a1_m2 if a1_m2 > 0 else 0.0
        v2_ms = q_m3s / a2_m2 if a2_m2 > 0 else 0.0

        # Pressure drop P1 - P2 = 0.5 * rho * (v2^2 - v1^2)
        p1_pa = params.inlet_pressure_kpa * 1000.0
        delta_p_pa = 0.5 * params.fluid_density_kg_m3 * ((v2_ms ** 2) - (v1_ms ** 2))
        p2_pa = p1_pa - delta_p_pa
        p2_kpa = p2_pa / 1000.0

        q_lps = q_m3s * 1000.0
        m_dot_kg_s = q_m3s * params.fluid_density_kg_m3

        note = (
            f"Venturi Flow: Inlet Velocity v1 = {v1_ms:.2f} m/s, Throat Velocity v2 = {v2_ms:.2f} m/s | "
            f"Throat Pressure P2 = {p2_kpa:.1f} kPa | Flow Rate Q = {q_lps:.2f} L/s ({m_dot_kg_s:.2f} kg/s)."
        )

        return BernoullisPrincipleOutput(
            inlet_area_mm2=float(a1_m2 * 1e6),
            throat_area_mm2=float(a2_m2 * 1e6),
            inlet_velocity_ms=float(v1_ms),
            throat_velocity_ms=float(v2_ms),
            throat_pressure_kpa=float(p2_kpa),
            volumetric_flow_rate_lps=float(q_lps),
            mass_flow_rate_kg_s=float(m_dot_kg_s),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "water_venturi_meter": {
                "name": "Water Pipe Venturi Flow Meter",
                "params": {"pipe_diameter_mm": 100.0, "throat_diameter_mm": 50.0, "discharge_coeff_cd": 0.98, "fluid_density_kg_m3": 1000.0, "manometer_head_mm": 250.0, "inlet_pressure_kpa": 200.0}
            },
            "air_carburetor_throat": {
                "name": "Air Carburetor Venturi Throat",
                "params": {"pipe_diameter_mm": 60.0, "throat_diameter_mm": 25.0, "discharge_coeff_cd": 0.92, "fluid_density_kg_m3": 1.2, "manometer_head_mm": 150.0, "inlet_pressure_kpa": 101.3}
            }
        }
