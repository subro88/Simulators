"""
Solar Photovoltaic Cell & MPPT Physics Engine
=============================================
Calculates solar I-V & P-V curves, open-circuit voltage Voc, short-circuit current Isc,
Maximum Power Point MPP (Vmpp, Impp), Fill Factor FF, and panel efficiency.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SolarPvCellInput(BaseModel):
    solar_irradiance_w_m2: float = Field(default=1000.0, ge=100.0, le=1200.0, description="Solar irradiance G in W/m² (STC = 1000 W/m²)")
    panel_temperature_c: float = Field(default=25.0, ge=-20.0, le=80.0, description="Cell temperature T in °C")
    num_series_cells: int = Field(default=60, ge=36, le=144, description="Number of series cells in panel")
    panel_area_m2: float = Field(default=1.6, ge=0.5, le=3.0, description="Panel surface area in m²")


class SolarPvCellOutput(BaseModel):
    open_circuit_voltage_voc: float
    short_circuit_current_isc: float
    mpp_voltage_vmpp: float
    mpp_current_impp: float
    max_power_output_watts: float
    fill_factor_pct: float
    panel_efficiency_pct: float
    status_note: str


class SolarPvCellEngine(BaseSimulationEngine):
    name = "solar-pv-cell"
    description = "Solar PV I-V & P-V characteristics: Voc, Isc, MPPT maximum power point, Fill Factor FF, and efficiency"

    def calculate(self, params: SolarPvCellInput) -> SolarPvCellOutput:
        g_ratio = params.solar_irradiance_w_m2 / 1000.0
        t_c = params.panel_temperature_c
        n_cells = params.num_series_cells

        # Short Circuit Current Isc = Isc_ref * (G / 1000)
        isc_ref = 9.5  # A
        temp_coeff_i = 0.0005  # A/°C
        isc = (isc_ref + temp_coeff_i * (t_c - 25.0)) * g_ratio

        # Open Circuit Voltage Voc = Voc_ref - dV/dT * (T - 25) + Vt * ln(G/1000)
        voc_ref = 0.65 * n_cells  # ~39V for 60 cells
        temp_coeff_v = -0.003 * n_cells  # V/°C
        voc = voc_ref + temp_coeff_v * (t_c - 25.0) + (0.026 * n_cells * math.log(max(0.1, g_ratio)))

        # MPP Estimates
        vmpp = voc * 0.82
        impp = isc * 0.92

        # Max Power P_mpp = Vmpp * Impp (Watts)
        p_mpp = vmpp * impp

        # Fill Factor FF = (Vmpp * Impp) / (Voc * Isc)
        ff = (p_mpp / (voc * isc)) if (voc * isc) > 0 else 0.75
        ff_pct = ff * 100.0

        # Panel Efficiency eta = P_mpp / (G * Area)
        p_in_sun = params.solar_irradiance_w_m2 * params.panel_area_m2
        eff_pct = (p_mpp / p_in_sun) * 100.0 if p_in_sun > 0 else 0.0

        note = (
            f"Solar PV Panel ({params.solar_irradiance_w_m2:.0f} W/m², {t_c:.0f}°C): "
            f"MPPT Max Power P_mpp = {p_mpp:.1f} W (Vmpp = {vmpp:.1f} V, Impp = {impp:.2f} A) | "
            f"Voc = {voc:.1f} V, Isc = {isc:.2f} A | Fill Factor FF = {ff_pct:.1f}% (Panel η = {eff_pct:.1f}%)."
        )

        return SolarPvCellOutput(
            open_circuit_voltage_voc=float(voc),
            short_circuit_current_isc=float(isc),
            mpp_voltage_vmpp=float(vmpp),
            mpp_current_impp=float(impp),
            max_power_output_watts=float(p_mpp),
            fill_factor_pct=float(ff_pct),
            panel_efficiency_pct=float(eff_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "standard_stc_sunlight": {
                "name": "Standard Test Condition Sunlight (1000 W/m², 25°C)",
                "params": {"solar_irradiance_w_m2": 1000.0, "panel_temperature_c": 25.0, "num_series_cells": 60, "panel_area_m2": 1.6}
            },
            "partial_shade_cloudy": {
                "name": "Overcast Cloudy Condition (400 W/m², 35°C)",
                "params": {"solar_irradiance_w_m2": 400.0, "panel_temperature_c": 35.0, "num_series_cells": 60, "panel_area_m2": 1.6}
            }
        }
