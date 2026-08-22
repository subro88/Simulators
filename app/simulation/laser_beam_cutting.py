"""
Laser Beam Cutting & Kerf Width Physics Engine
==============================================
Calculates laser cutting speed v, kerf width wk, heat affected zone HAZ,
and assist gas consumption rate.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class LaserBeamCuttingInput(BaseModel):
    laser_power_kw: float = Field(default=3.0, ge=0.5, le=12.0, description="Laser beam power P in kW")
    sheet_thickness_mm: float = Field(default=4.0, ge=0.5, le=25.0, description="Workpiece thickness t in mm")
    material_type: str = Field(default="Mild Steel", description="Workpiece metal material")
    assist_gas_pressure_bar: float = Field(default=12.0, ge=1.0, le=25.0, description="Assist gas pressure in bar")


class LaserBeamCuttingOutput(BaseModel):
    material_type: str
    max_cutting_speed_m_min: float
    kerf_width_mm: float
    heat_affected_zone_mm: float
    cutting_time_per_meter_sec: float
    status_note: str


class LaserBeamCuttingEngine(BaseSimulationEngine):
    name = "laser-beam-cutting"
    description = "Fiber Laser CNC sheet cutting: cutting speed v, kerf width wk, heat-affected zone HAZ, and power efficiency"

    def calculate(self, params: LaserBeamCuttingInput) -> LaserBeamCuttingOutput:
        p_kw = params.laser_power_kw
        t = params.sheet_thickness_mm

        # Speed v = (eta * P) / (rho * t * Cp_eff) -> empirical fit v (m/min) = (P_kw * 12.0) / (t^1.2)
        v_m_min = (p_kw * 12.0) / math.pow(t, 1.2) if t > 0 else 1.0

        # Kerf width wk ≈ 0.15 + 0.03 * t (mm)
        w_k = 0.15 + 0.03 * t

        # HAZ width ≈ 0.08 + 0.02 * t (mm)
        haz_mm = 0.08 + 0.02 * t

        t_per_m_sec = (1.0 / (v_m_min / 60.0)) if v_m_min > 0 else 0.0

        note = (
            f"Fiber Laser Cutting ({params.material_type}, P = {p_kw:.1f} kW, t = {t:.1f} mm): "
            f"Cutting Speed v = {v_m_min:.2f} m/min | Kerf Width = {w_k:.2f} mm | "
            f"HAZ Width = {haz_mm:.2f} mm | Time per Meter = {t_per_m_sec:.1f} s."
        )

        return LaserBeamCuttingOutput(
            material_type=params.material_type,
            max_cutting_speed_m_min=float(v_m_min),
            kerf_width_mm=float(w_k),
            heat_affected_zone_mm=float(haz_mm),
            cutting_time_per_meter_sec=float(t_per_m_sec),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "fiber_laser_3kw_steel_4mm": {
                "name": "3kW Fiber Laser 4mm Steel Sheet Cut",
                "params": {"laser_power_kw": 3.0, "sheet_thickness_mm": 4.0, "material_type": "Mild Steel", "assist_gas_pressure_bar": 12.0}
            },
            "fiber_laser_6kw_stainless_10mm": {
                "name": "6kW Fiber Laser 10mm Stainless Steel Cut",
                "params": {"laser_power_kw": 6.0, "sheet_thickness_mm": 10.0, "material_type": "Stainless Steel (304)", "assist_gas_pressure_bar": 18.0}
            }
        }
