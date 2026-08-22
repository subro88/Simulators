"""
Lathe Turning Operations Physics Engine
=======================================
Calculates cutting speed V, feed rate f, material removal rate MRR,
surface roughness Ra, cutting force Fc, and spindle power P.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class LatheTurningInput(BaseModel):
    workpiece_diameter_mm: float = Field(default=50.0, ge=5.0, le=500.0, description="Workpiece outer diameter D in mm")
    spindle_speed_rpm: float = Field(default=800.0, ge=50.0, le=5000.0, description="Spindle rotational speed N in RPM")
    feed_rate_mm_rev: float = Field(default=0.15, ge=0.01, le=2.0, description="Tool feed rate f in mm/rev")
    depth_of_cut_mm: float = Field(default=2.0, ge=0.1, le=10.0, description="Depth of cut d in mm")
    tool_nose_radius_mm: float = Field(default=0.8, ge=0.1, le=3.2, description="Insert nose radius r_eps in mm")


class LatheTurningOutput(BaseModel):
    cutting_speed_m_min: float
    material_removal_rate_cm3_min: float
    surface_roughness_ra_um: float
    cutting_force_n: float
    spindle_power_kw: float
    machining_time_min: float
    status_note: str


class LatheTurningEngine(BaseSimulationEngine):
    name = "lathe-turning"
    description = "Lathe turning operations: cutting speed V, MRR, theoretical surface roughness Ra, and cutting power P"

    def calculate(self, params: LatheTurningInput) -> LatheTurningOutput:
        d = params.workpiece_diameter_mm
        n = params.spindle_speed_rpm
        f = params.feed_rate_mm_rev
        doc = params.depth_of_cut_mm
        r_eps = params.tool_nose_radius_mm

        # Cutting Speed V = pi * D * N / 1000 (m/min)
        v = (math.pi * d * n) / 1000.0

        # MRR = V * f * d (cm^3/min)
        mrr_mm3_min = (v * 1000.0) * f * doc
        mrr_cm3_min = mrr_mm3_min / 1000.0

        # Theoretical Surface Roughness Ra ≈ f^2 / (32 * r_eps) in mm -> um (* 1000)
        ra_um = (f ** 2) / (32.0 * r_eps) * 1000.0 if r_eps > 0 else 3.2

        # Cutting Force Fc ≈ Kc * doc * f (Kc ≈ 2100 N/mm^2 for medium steel)
        kc = 2100.0
        fc_n = kc * doc * f

        # Spindle Power P = Fc * V / 60000 (kW)
        power_kw = (fc_n * v) / 60000.0

        # Machining time for 100mm length L
        t_mach_min = 100.0 / (f * n) if (f * n) > 0 else 0.0

        note = (
            f"Lathe Turning (D = {d:.0f} mm, N = {n:.0f} RPM): Cutting Speed V = {v:.1f} m/min | "
            f"MRR = {mrr_cm3_min:.1f} cm³/min | Surface Roughness Ra = {ra_um:.2f} µm | "
            f"Cutting Power P = {power_kw:.2f} kW (Fc = {fc_n:.0f} N)."
        )

        return LatheTurningOutput(
            cutting_speed_m_min=float(v),
            material_removal_rate_cm3_min=float(mrr_cm3_min),
            surface_roughness_ra_um=float(ra_um),
            cutting_force_n=float(fc_n),
            spindle_power_kw=float(power_kw),
            machining_time_min=float(t_mach_min),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "rough_turning_steel": {
                "name": "Steel Rough Turning (N=600 RPM, doc=3.0mm)",
                "params": {"workpiece_diameter_mm": 60.0, "spindle_speed_rpm": 600.0, "feed_rate_mm_rev": 0.25, "depth_of_cut_mm": 3.0, "tool_nose_radius_mm": 0.8}
            },
            "finish_turning_alum": {
                "name": "Aluminum Fine Finish Turning (N=1500 RPM)",
                "params": {"workpiece_diameter_mm": 40.0, "spindle_speed_rpm": 1500.0, "feed_rate_mm_rev": 0.08, "depth_of_cut_mm": 0.5, "tool_nose_radius_mm": 0.4}
            }
        }
