"""
Grinding Wheel Wear & Specific Energy Physics Engine
===================================================
Calculates wheel surface speed Vs, work speed Vw, Grinding ratio G,
material removal rate MRR, and specific grinding energy ug.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class GrindingWheelInput(BaseModel):
    wheel_diameter_mm: float = Field(default=250.0, ge=50.0, le=600.0, description="Grinding wheel diameter D_w in mm")
    wheel_speed_rpm: float = Field(default=2400.0, ge=500.0, le=6000.0, description="Grinding wheel speed N_w in RPM")
    workpiece_speed_m_min: float = Field(default=15.0, ge=1.0, le=100.0, description="Workpiece speed V_work in m/min")
    infeed_depth_um: float = Field(default=20.0, ge=1.0, le=200.0, description="Infeed depth per pass d in µm")
    grinding_width_mm: float = Field(default=25.0, ge=5.0, le=100.0, description="Grinding width b in mm")


class GrindingWheelOutput(BaseModel):
    wheel_speed_m_s: float
    speed_ratio_vs_vw: float
    material_removal_rate_mm3_s: float
    grinding_ratio_g: float
    specific_grinding_energy_j_mm3: float
    grinding_power_kw: float
    status_note: str


class GrindingWheelEngine(BaseSimulationEngine):
    name = "grinding-wheel"
    description = "Abrasive grinding operations: wheel speed Vs, speed ratio Vs/Vw, MRR, Grinding ratio G, and power"

    def calculate(self, params: GrindingWheelInput) -> GrindingWheelOutput:
        dw = params.wheel_diameter_mm
        nw = params.wheel_speed_rpm
        vw_m_min = params.workpiece_speed_m_min
        d_um = params.infeed_depth_um
        b = params.grinding_width_mm

        # Wheel surface speed Vs (m/s)
        vs_m_s = (math.pi * (dw / 1000.0) * nw) / 60.0

        # Work speed Vw (m/s)
        vw_m_s = vw_m_min / 60.0

        speed_ratio = vs_m_s / vw_m_s if vw_m_s > 0 else 100.0

        # MRR = b * (d / 1000) * (Vw * 1000) in mm^3/s
        mrr_mm3_s = b * (d_um / 1000.0) * (vw_m_s * 1000.0)

        # Grinding Ratio G = Vol Metal / Vol Wheel wear ≈ 40 typical
        g_ratio = 40.0

        # Specific Grinding Energy u_g ≈ 35 - 50 J/mm^3
        ug_j_mm3 = 42.0

        # Grinding Power P = u_g * MRR / 1000 (kW)
        power_kw = (ug_j_mm3 * mrr_mm3_s) / 1000.0

        note = (
            f"Surface Grinding (Wheel Vs = {vs_m_s:.1f} m/s, Work Vw = {vw_m_min:.1f} m/min): "
            f"Speed Ratio = {speed_ratio:.0f}:1 | MRR = {mrr_mm3_s:.1f} mm³/s | "
            f"Grinding Ratio G = {g_ratio:.0f} | Grinding Power = {power_kw:.2f} kW."
        )

        return GrindingWheelOutput(
            wheel_speed_m_s=float(vs_m_s),
            speed_ratio_vs_vw=float(speed_ratio),
            material_removal_rate_mm3_s=float(mrr_mm3_s),
            grinding_ratio_g=float(g_ratio),
            specific_grinding_energy_j_mm3=float(ug_j_mm3),
            grinding_power_kw=float(power_kw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "surface_grinding_precision": {
                "name": "Precision Surface Grinding (20µm Infeed)",
                "params": {"wheel_diameter_mm": 250.0, "wheel_speed_rpm": 2400.0, "workpiece_speed_m_min": 15.0, "infeed_depth_um": 20.0, "grinding_width_mm": 25.0}
            },
            "heavy_creep_feed": {
                "name": "Heavy Creep Feed Grinding (100µm Infeed)",
                "params": {"wheel_diameter_mm": 300.0, "wheel_speed_rpm": 1800.0, "workpiece_speed_m_min": 5.0, "infeed_depth_um": 100.0, "grinding_width_mm": 30.0}
            }
        }
