"""
Plastic Sheet Thermoforming Physics Engine
==========================================
Calculates sheet draw ratio DR, final wall thickness t_final, heating time th,
and vacuum forming pressure.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PlasticThermoformingInput(BaseModel):
    initial_sheet_thickness_mm: float = Field(default=3.0, ge=0.5, le=12.0, description="Initial sheet thickness t0 in mm")
    mold_depth_mm: float = Field(default=80.0, ge=10.0, le=400.0, description="Mold cavity depth H in mm")
    mold_opening_width_mm: float = Field(default=200.0, ge=50.0, le=1000.0, description="Mold opening width W in mm")
    heating_temperature_c: float = Field(default=160.0, ge=120.0, le=240.0, description="Sheet forming temperature in °C")


class PlasticThermoformingOutput(BaseModel):
    draw_ratio: float
    average_final_thickness_mm: float
    corner_minimum_thickness_mm: float
    sheet_heating_time_sec: float
    status_note: str


class PlasticThermoformingEngine(BaseSimulationEngine):
    name = "plastic-thermoforming"
    description = "Vacuum Thermoforming: sheet draw ratio DR, wall thinning t_final, heating time th, and corner stretch"

    def calculate(self, params: PlasticThermoformingInput) -> PlasticThermoformingOutput:
        t0 = params.initial_sheet_thickness_mm
        h_mold = params.mold_depth_mm
        w_mold = params.mold_opening_width_mm

        # Surface area of flat sheet A_flat = W^2
        a_flat = w_mold ** 2
        # Formed part area A_part = W^2 + 4 * W * H
        a_part = (w_mold ** 2) + 4.0 * w_mold * h_mold

        # Draw Ratio DR = A_part / A_flat
        dr = a_part / a_flat if a_flat > 0 else 1.0

        # Average final thickness t_avg = t0 / DR
        t_avg = t0 / dr if dr > 0 else t0

        # Corner minimum thickness t_corner ≈ 0.5 * t_avg
        t_corner = 0.5 * t_avg

        # Heating time t_h ∝ t0^1.8 (seconds)
        t_h_sec = 12.0 * math.pow(t0, 1.8)

        note = (
            f"Vacuum Thermoforming (t0 = {t0:.1f} mm, Mold Depth = {h_mold:.0f} mm): "
            f"Draw Ratio DR = {dr:.2f}:1 | Avg Wall Thickness = {t_avg:.2f} mm | "
            f"Min Corner Thickness = {t_corner:.2f} mm | Sheet Heating Time = {t_h_sec:.1f} s."
        )

        return PlasticThermoformingOutput(
            draw_ratio=float(dr),
            average_final_thickness_mm=float(t_avg),
            corner_minimum_thickness_mm=float(t_corner),
            sheet_heating_time_sec=float(t_h_sec),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "abs_deep_draw_tray": {
                "name": "ABS Deep-Draw Tray (3mm Sheet, 80mm Depth)",
                "params": {"initial_sheet_thickness_mm": 3.0, "mold_depth_mm": 80.0, "mold_opening_width_mm": 200.0, "heating_temperature_c": 160.0}
            },
            "shallow_blister_pack": {
                "name": "Shallow PET Packaging Blister (1mm Sheet)",
                "params": {"initial_sheet_thickness_mm": 1.0, "mold_depth_mm": 20.0, "mold_opening_width_mm": 100.0, "heating_temperature_c": 140.0}
            }
        }
