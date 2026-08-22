"""
Fluid Statics & U-Tube Differential Manometer Physics Engine
============================================================
Calculates hydrostatic pressure P, differential pressure Delta P,
manometer liquid column deflection h, and gauge pressure.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class FluidStaticsManometerInput(BaseModel):
    manometer_fluid: Literal["mercury", "water", "oil"] = Field(default="mercury", description="Heavy manometer fluid")
    deflection_height_h_cm: float = Field(default=25.0, ge=0.5, le=200.0, description="Differential fluid column deflection h in cm")
    pipe_fluid_density_kg_m3: float = Field(default=1000.0, ge=700.0, le=1200.0, description="Pipeline fluid density rho_f in kg/m³")


class FluidStaticsManometerOutput(BaseModel):
    manometer_fluid: str
    manometer_fluid_density_kg_m3: float
    differential_pressure_kpa: float
    differential_pressure_bar: float
    equivalent_water_head_m: float
    status_note: str


class FluidStaticsManometerEngine(BaseSimulationEngine):
    name = "fluid-statics-manometer"
    description = "Fluid Hydrostatics U-Tube Manometer: Delta P = (rho_m - rho_f) * g * h, pressure head meters, and bar gauge"

    def calculate(self, params: FluidStaticsManometerInput) -> FluidStaticsManometerOutput:
        h_m = params.deflection_height_h_cm / 100.0
        rho_f = params.pipe_fluid_density_kg_m3
        g = 9.81

        if params.manometer_fluid == "water":
            rho_m = 1000.0
            fluid_title = "Water (1000 kg/m³)"
        elif params.manometer_fluid == "oil":
            rho_m = 850.0
            fluid_title = "Oil (850 kg/m³)"
        else: # mercury
            rho_m = 13600.0
            fluid_title = "Mercury Hg (13,600 kg/m³)"

        # Differential Pressure Delta P = (rho_m - rho_f) * g * h (Pa -> kPa)
        delta_p_pa = (rho_m - rho_f) * g * h_m
        delta_p_kpa = delta_p_pa / 1000.0
        delta_p_bar = delta_p_pa / 1e5

        # Equivalent Water Head hw = Delta P / (1000 * g)
        hw_m = delta_p_pa / (1000.0 * g)

        note = (
            f"U-Tube Differential Manometer ({fluid_title}, Deflection h = {params.deflection_height_h_cm:.1f} cm): "
            f"Differential Pressure ΔP = {delta_p_kpa:.2f} kPa ({delta_p_bar:.4f} bar) | "
            f"Equivalent Water Head = {hw_m:.2f} m H2O."
        )

        return FluidStaticsManometerOutput(
            manometer_fluid=fluid_title,
            manometer_fluid_density_kg_m3=float(rho_m),
            differential_pressure_kpa=float(delta_p_kpa),
            differential_pressure_bar=float(delta_p_bar),
            equivalent_water_head_m=float(hw_m),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "mercury_manometer_25cm": {
                "name": "Mercury Manometer 25cm Deflection (Water Pipe)",
                "params": {"manometer_fluid": "mercury", "deflection_height_h_cm": 25.0, "pipe_fluid_density_kg_m3": 1000.0}
            },
            "oil_water_differential": {
                "name": "Oil-Water Low Differential Pressure Manometer",
                "params": {"manometer_fluid": "water", "deflection_height_h_cm": 50.0, "pipe_fluid_density_kg_m3": 850.0}
            }
        }
