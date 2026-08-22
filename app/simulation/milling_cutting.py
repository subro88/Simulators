"""
Milling Speeds & Feeds Physics Engine
=====================================
Calculates table feed F, material removal rate MRR, torque T, and milling power P.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MillingCuttingInput(BaseModel):
    cutter_diameter_mm: float = Field(default=20.0, ge=2.0, le=200.0, description="Milling cutter diameter D in mm")
    num_teeth: int = Field(default=4, ge=1, le=20, description="Number of cutter teeth Z")
    spindle_speed_rpm: float = Field(default=1200.0, ge=100.0, le=10000.0, description="Spindle speed N in RPM")
    feed_per_tooth_mm: float = Field(default=0.08, ge=0.01, le=1.0, description="Feed per tooth f_z in mm/tooth")
    axial_depth_ap_mm: float = Field(default=3.0, ge=0.1, le=20.0, description="Axial depth of cut a_p in mm")
    radial_width_ae_mm: float = Field(default=15.0, ge=0.1, le=100.0, description="Radial width of cut a_e in mm")


class MillingCuttingOutput(BaseModel):
    cutting_speed_m_min: float
    table_feed_mm_min: float
    material_removal_rate_cm3_min: float
    milling_power_kw: float
    cutting_torque_nm: float
    status_note: str


class MillingCuttingEngine(BaseSimulationEngine):
    name = "milling-cutting"
    description = "Face & End Milling mechanics: table feed F, MRR, specific energy power P, and spindle torque T"

    def calculate(self, params: MillingCuttingInput) -> MillingCuttingOutput:
        d = params.cutter_diameter_mm
        z = params.num_teeth
        n = params.spindle_speed_rpm
        fz = params.feed_per_tooth_mm
        ap = params.axial_depth_ap_mm
        ae = params.radial_width_ae_mm

        # Cutting Speed V = pi * D * N / 1000 (m/min)
        v = (math.pi * d * n) / 1000.0

        # Table Feed F = f_z * Z * N (mm/min)
        vf = fz * z * n

        # MRR = a_p * a_e * F / 1000 (cm^3/min)
        mrr_cm3_min = (ap * ae * vf) / 1000.0

        # Power P = MRR * u_s (u_s ≈ 2.5 kW/(cm^3/s) = 0.0416 kW/(cm^3/min))
        power_kw = mrr_cm3_min * 0.0416

        # Torque T = (P * 9549) / N (N*m)
        torque_nm = (power_kw * 9549.0) / n if n > 0 else 0.0

        note = (
            f"Milling Operation (D = {d:.0f} mm, Z = {z}): Table Feed F = {vf:.0f} mm/min | "
            f"Cutting Speed V = {v:.1f} m/min | MRR = {mrr_cm3_min:.1f} cm³/min | "
            f"Spindle Power P = {power_kw:.2f} kW (Torque = {torque_nm:.1f} N·m)."
        )

        return MillingCuttingOutput(
            cutting_speed_m_min=float(v),
            table_feed_mm_min=float(vf),
            material_removal_rate_cm3_min=float(mrr_cm3_min),
            milling_power_kw=float(power_kw),
            cutting_torque_nm=float(torque_nm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "end_milling_slotting": {
                "name": "End Milling Full Slotting (D=12mm, 4 Teeth)",
                "params": {"cutter_diameter_mm": 12.0, "num_teeth": 4, "spindle_speed_rpm": 1500.0, "feed_per_tooth_mm": 0.05, "axial_depth_ap_mm": 4.0, "radial_width_ae_mm": 12.0}
            },
            "face_milling_broad": {
                "name": "Heavy Face Milling Broad Pass (D=80mm)",
                "params": {"cutter_diameter_mm": 80.0, "num_teeth": 6, "spindle_speed_rpm": 500.0, "feed_per_tooth_mm": 0.12, "axial_depth_ap_mm": 2.5, "radial_width_ae_mm": 60.0}
            }
        }
