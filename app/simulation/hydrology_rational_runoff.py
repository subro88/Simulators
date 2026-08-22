"""
Hydrology Rational Peak Storm Runoff Physics Engine
===================================================
Calculates runoff coefficient C, time of concentration tc, rainfall intensity I,
and peak discharge Q (m³/s) for urban storm drainage.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class HydrologyRationalRunoffInput(BaseModel):
    catchment_area_ha: float = Field(default=50.0, ge=1.0, le=10000.0, description="Watershed area A in hectares (1 ha = 10,000 m²)")
    runoff_coefficient_c: float = Field(default=0.65, ge=0.1, le=0.95, description="Runoff coefficient C (0.1 rural to 0.95 urban)")
    rainfall_intensity_mm_hr: float = Field(default=85.0, ge=10.0, le=300.0, description="Design storm intensity I in mm/hr")
    longest_flow_path_m: float = Field(default=1200.0, ge=50.0, le=20000.0, description="Flow path length L in meters")


class HydrologyRationalRunoffOutput(BaseModel):
    peak_discharge_m3_s: float
    peak_discharge_lps: float
    time_of_concentration_min: float
    total_runoff_volume_m3: float
    status_note: str


class HydrologyRationalRunoffEngine(BaseSimulationEngine):
    name = "hydrology-rational-runoff"
    description = "Rational Method Stormwater Hydrology: Peak Discharge Q = C*I*A/360, Kirpich time of concentration tc, and culvert flow"

    def calculate(self, params: HydrologyRationalRunoffInput) -> HydrologyRationalRunoffOutput:
        area_ha = params.catchment_area_ha
        c = params.runoff_coefficient_c
        i_mm_hr = params.rainfall_intensity_mm_hr
        l_path = params.longest_flow_path_m

        # Peak Discharge Q = C * I * A / 360 (m^3/s) for A in ha, I in mm/hr
        q_m3_s = (c * i_mm_hr * area_ha) / 360.0
        q_lps = q_m3_s * 1000.0

        # Kirpich Time of Concentration tc = 0.01947 * L^0.77 * S^-0.385 (minutes)
        slope = 0.02  # 2% average slope
        tc_min = 0.01947 * math.pow(l_path, 0.77) * math.pow(slope, -0.385)

        # 1-Hour Total Runoff Volume V = C * (I/1000) * (A * 10000) (m^3)
        v_runoff_m3 = c * (i_mm_hr / 1000.0) * (area_ha * 10000.0)

        note = (
            f"Rational Hydrology Method (Area = {area_ha:.0f} ha, C = {c:.2f}): "
            f"Storm Intensity I = {i_mm_hr:.0f} mm/hr | Time of Concentration tc = {tc_min:.1f} min | "
            f"Peak Runoff Discharge Q = {q_m3_s:.2f} m³/s ({q_lps:.0f} L/s) | 1-Hr Volume = {v_runoff_m3:.0f} m³."
        )

        return HydrologyRationalRunoffOutput(
            peak_discharge_m3_s=float(q_m3_s),
            peak_discharge_lps=float(q_lps),
            time_of_concentration_min=float(tc_min),
            total_runoff_volume_m3=float(v_runoff_m3),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "urban_commercial_catchment": {
                "name": "Urban Commercial Catchment (50 ha, C = 0.65)",
                "params": {"catchment_area_ha": 50.0, "runoff_coefficient_c": 0.65, "rainfall_intensity_mm_hr": 85.0, "longest_flow_path_m": 1200.0}
            },
            "paved_airport_apron": {
                "name": "Paved Airport Runway Apron (20 ha, C = 0.90)",
                "params": {"catchment_area_ha": 20.0, "runoff_coefficient_c": 0.90, "rainfall_intensity_mm_hr": 110.0, "longest_flow_path_m": 600.0}
            }
        }
