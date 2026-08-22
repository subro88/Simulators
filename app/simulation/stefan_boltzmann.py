"""
Radiation Heat Transfer & Stefan-Boltzmann Physics Engine
==========================================================
Calculates net thermal radiation flux q, radiation heat transfer coefficient hr,
emissivity effects, and blackbody vs graybody comparison.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class StefanBoltzmannInput(BaseModel):
    hot_surface_temp_c: float = Field(default=500.0, ge=0.0, le=3000.0, description="Hot surface temperature T1 in °C")
    surrounding_temp_c: float = Field(default=25.0, ge=-50.0, le=1000.0, description="Surrounding ambient temperature T2 in °C")
    emissivity: float = Field(default=0.85, ge=0.01, le=1.0, description="Surface emissivity epsilon (0 to 1, Blackbody = 1.0)")
    surface_area_m2: float = Field(default=2.0, ge=0.01, le=100.0, description="Radiating surface area A in m²")


class StefanBoltzmannOutput(BaseModel):
    hot_temp_kelvin: float
    surrounding_temp_kelvin: float
    net_radiation_power_kw: float
    radiation_flux_kw_m2: float
    radiation_h_coeff_w_m2k: float
    blackbody_ratio: float
    status_note: str


class StefanBoltzmannEngine(BaseSimulationEngine):
    name = "stefan-boltzmann"
    description = "Thermal radiation physics: Stefan-Boltzmann law q = eps*sigma*A*(T1^4 - T2^4), emissivity, and radiation h_r"

    def calculate(self, params: StefanBoltzmannInput) -> StefanBoltzmannOutput:
        sigma = 5.670374e-8  # Stefan-Boltzmann constant W/(m^2*K^4)

        t1_k = params.hot_surface_temp_c + 273.15
        t2_k = params.surrounding_temp_c + 273.15
        eps = params.emissivity
        a = params.surface_area_m2

        # Net radiation power Q = eps * sigma * A * (T1^4 - T2^4) in W
        q_w = eps * sigma * a * ((t1_k ** 4) - (t2_k ** 4))
        q_kw = q_w / 1000.0
        q_flux_kw_m2 = q_kw / a if a > 0 else 0.0

        # Equivalent radiation heat transfer coefficient h_r = eps * sigma * (T1 + T2) * (T1^2 + T2^2)
        h_r = eps * sigma * (t1_k + t2_k) * ((t1_k ** 2) + (t2_k ** 2))

        # Comparison with ideal blackbody (eps = 1.0)
        blackbody_ratio = eps

        note = (
            f"Thermal Radiation (T1 = {params.hot_surface_temp_c:.0f}°C, ε = {eps:.2f}): "
            f"Net Power Q = {q_kw:.2f} kW (Flux q = {q_flux_kw_m2:.2f} kW/m²) | Radiation h_r = {h_r:.2f} W/(m²·K)."
        )

        return StefanBoltzmannOutput(
            hot_temp_kelvin=float(t1_k),
            surrounding_temp_kelvin=float(t2_k),
            net_radiation_power_kw=float(q_kw),
            radiation_flux_kw_m2=float(q_flux_kw_m2),
            radiation_h_coeff_w_m2k=float(h_r),
            blackbody_ratio=float(blackbody_ratio),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "exhaust_manifold_radiator": {
                "name": "Engine Exhaust Manifold (500°C)",
                "params": {"hot_surface_temp_c": 500.0, "surrounding_temp_c": 25.0, "emissivity": 0.85, "surface_area_m2": 0.5}
            },
            "solar_thermal_collector": {
                "name": "Solar Thermal Absorber Plate",
                "params": {"hot_surface_temp_c": 120.0, "surrounding_temp_c": 20.0, "emissivity": 0.92, "surface_area_m2": 2.0}
            }
        }
