"""
Blackbody Radiation & Wien's Displacement Law Physics Engine
============================================================
Calculates peak emission wavelength lambda_max, total emissive power E,
Stefan-Boltzmann radiation flux, and spectral radiance.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BlackbodyRadiationWienInput(BaseModel):
    temperature_kelvin: float = Field(default=5800.0, ge=300.0, le=20000.0, description="Blackbody absolute temperature T in Kelvin")
    surface_emissivity: float = Field(default=1.0, ge=0.01, le=1.0, description="Surface emissivity epsilon")
    surface_area_m2: float = Field(default=1.0, ge=0.01, le=100.0, description="Surface area A in m²")


class BlackbodyRadiationWienOutput(BaseModel):
    temperature_kelvin: float
    peak_wavelength_nm: float
    peak_wavelength_um: float
    spectral_color_region: str
    total_radiant_emittance_w_m2: float
    total_radiant_power_kw: float
    status_note: str


class BlackbodyRadiationWienEngine(BaseSimulationEngine):
    name = "blackbody-radiation-wien"
    description = "Blackbody Thermal Radiation: Wien's Law lambda_max*T = 2.898e-3 m K, Stefan-Boltzmann Eb = sigma*T^4"

    def calculate(self, params: BlackbodyRadiationWienInput) -> BlackbodyRadiationWienOutput:
        temp_k = params.temperature_kelvin
        eps = params.surface_emissivity
        area = params.surface_area_m2

        # Wien's Displacement Constant b = 2.89777e-3 m*K
        b_wien = 2.89777e-3

        # Peak Wavelength lambda_max = b / T (meters -> nm & um)
        lam_max_m = b_wien / temp_k if temp_k > 0 else 1e-6
        lam_max_nm = lam_max_m * 1e9
        lam_max_um = lam_max_m * 1e6

        # Spectral Region Classification
        if lam_max_nm < 380.0:
            region = "ULTRAVIOLET (UV)"
        elif lam_max_nm <= 750.0:
            region = "VISIBLE LIGHT SPECTRUM"
        elif lam_max_nm <= 3000.0:
            region = "NEAR INFRARED (NIR)"
        else:
            region = "FAR INFRARED (FIR / Thermal Heat)"

        # Stefan-Boltzmann Law Eb = eps * sigma * T^4 (W/m^2)
        sigma_sb = 5.67037e-8
        eb_w_m2 = eps * sigma_sb * math.pow(temp_k, 4)

        # Total Radiant Power P = Eb * A (kW)
        power_kw = (eb_w_m2 * area) / 1000.0

        note = (
            f"Blackbody Radiation (T = {temp_k:.0f} K, ε = {eps:.2f}): "
            f"Peak Wavelength λ_max = {lam_max_nm:.1f} nm ({lam_max_um:.2f} µm — {region}) | "
            f"Radiant Emittance Eb = {eb_w_m2/1000:.1f} kW/m² | Total Power P = {power_kw:.1f} kW."
        )

        return BlackbodyRadiationWienOutput(
            temperature_kelvin=float(temp_k),
            peak_wavelength_nm=float(lam_max_nm),
            peak_wavelength_um=float(lam_max_um),
            spectral_color_region=region,
            total_radiant_emittance_w_m2=float(eb_w_m2),
            total_radiant_power_kw=float(power_kw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "sun_photosphere_5800k": {
                "name": "Sun Photosphere Temperature (5800 K — Visible Peak)",
                "params": {"temperature_kelvin": 5800.0, "surface_emissivity": 1.0, "surface_area_m2": 1.0}
            },
            "industrial_furnace_1500k": {
                "name": "Industrial Thermal Furnace (1500 K — Infrared Peak)",
                "params": {"temperature_kelvin": 1500.0, "surface_emissivity": 0.90, "surface_area_m2": 2.0}
            }
        }
