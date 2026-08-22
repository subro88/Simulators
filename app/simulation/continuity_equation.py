"""
Continuity Equation & Pipe Nozzle Flow Physics Engine
=====================================================
Calculates area ratio A1/A2, velocity transition v1 to v2, volumetric flow rate Q,
mass flow rate m_dot, and dynamic pressure ratio.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ContinuityEquationInput(BaseModel):
    inlet_diameter_mm: float = Field(default=80.0, ge=10.0, le=500.0, description="Inlet section diameter d1 in mm")
    outlet_diameter_mm: float = Field(default=40.0, ge=5.0, le=400.0, description="Outlet section diameter d2 in mm")
    inlet_velocity_ms: float = Field(default=2.5, ge=0.1, le=50.0, description="Inlet fluid velocity v1 in m/s")
    fluid_density_kg_m3: float = Field(default=1000.0, ge=0.5, le=2000.0, description="Fluid density rho in kg/m³")


class ContinuityEquationOutput(BaseModel):
    area_ratio: float
    outlet_velocity_ms: float
    volumetric_flow_lps: float
    mass_flow_kg_s: float
    inlet_dynamic_pressure_kpa: float
    outlet_dynamic_pressure_kpa: float
    status_note: str


class ContinuityEquationEngine(BaseSimulationEngine):
    name = "continuity-equation"
    description = "Mass conservation in fluid conduits: A1*v1 = A2*v2, velocity multiplication, and dynamic pressure"

    def calculate(self, params: ContinuityEquationInput) -> ContinuityEquationOutput:
        d1 = params.inlet_diameter_mm / 1000.0
        d2 = params.outlet_diameter_mm / 1000.0

        a1_m2 = (math.pi * (d1 ** 2)) / 4.0
        a2_m2 = (math.pi * (d2 ** 2)) / 4.0

        area_ratio = a1_m2 / a2_m2 if a2_m2 > 0 else 1.0

        v1 = params.inlet_velocity_ms
        # Continuity v2 = v1 * (A1 / A2)
        v2 = v1 * area_ratio

        q_m3s = a1_m2 * v1
        q_lps = q_m3s * 1000.0
        m_dot = q_m3s * params.fluid_density_kg_m3

        # Dynamic pressure q_dyn = 0.5 * rho * v^2
        dyn_p1_kpa = (0.5 * params.fluid_density_kg_m3 * (v1 ** 2)) / 1000.0
        dyn_p2_kpa = (0.5 * params.fluid_density_kg_m3 * (v2 ** 2)) / 1000.0

        transition_type = "Nozzle Acceleration" if d2 < d1 else "Diffuser Deceleration"

        note = (
            f"Pipe Transition ({transition_type}): Area Ratio A1/A2 = {area_ratio:.2f} | "
            f"Outlet Velocity v2 = {v2:.2f} m/s (Inlet v1 = {v1:.2f} m/s) | Flow Rate Q = {q_lps:.2f} L/s ({m_dot:.2f} kg/s)."
        )

        return ContinuityEquationOutput(
            area_ratio=float(area_ratio),
            outlet_velocity_ms=float(v2),
            volumetric_flow_lps=float(q_lps),
            mass_flow_kg_s=float(m_dot),
            inlet_dynamic_pressure_kpa=float(dyn_p1_kpa),
            outlet_dynamic_pressure_kpa=float(dyn_p2_kpa),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "fire_hose_nozzle": {
                "name": "Fire Hose Reducing Nozzle",
                "params": {"inlet_diameter_mm": 65.0, "outlet_diameter_mm": 20.0, "inlet_velocity_ms": 3.0, "fluid_density_kg_m3": 1000.0}
            },
            "wind_tunnel_diffuser": {
                "name": "Wind Tunnel Subsonic Diffuser",
                "params": {"inlet_diameter_mm": 200.0, "outlet_diameter_mm": 400.0, "inlet_velocity_ms": 20.0, "fluid_density_kg_m3": 1.2}
            }
        }
