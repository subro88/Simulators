"""
Sine Bar Angle Measurement Metrology Physics Engine
===================================================
Calculates taper angle theta = arcsin(H / L), slip gauge stack height H,
angular error in degrees, minutes, and seconds (DMS).
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SineBarAngleMeasurementInput(BaseModel):
    sine_bar_length_mm: float = Field(default=200.0, ge=100.0, le=500.0, description="Sine bar length between roller centers L in mm")
    slip_gauge_height_h_mm: float = Field(default=51.76, ge=0.1, le=450.0, description="Slip gauge stack height H in mm")


class SineBarAngleMeasurementOutput(BaseModel):
    sine_bar_length_mm: float
    slip_gauge_height_h_mm: float
    measured_angle_deg: float
    angle_degrees: int
    angle_minutes: int
    angle_seconds: float
    status_note: str


class SineBarAngleMeasurementEngine(BaseSimulationEngine):
    name = "sine-bar-angle-measurement"
    description = "Metrology Angular Inspection: Sine bar angle sin(theta) = H / L, slip gauge stack H, DMS degrees-minutes-seconds"

    def calculate(self, params: SineBarAngleMeasurementInput) -> SineBarAngleMeasurementOutput:
        l_bar = params.sine_bar_length_mm
        h_stack = params.slip_gauge_height_h_mm

        # sin(theta) = H / L
        sin_theta = max(0.0, min(1.0, h_stack / l_bar)) if l_bar > 0 else 0.0
        theta_rad = math.asin(sin_theta)
        theta_deg = math.degrees(theta_rad)

        # Degrees, Minutes, Seconds conversion
        deg_int = int(theta_deg)
        rem_min = (theta_deg - deg_int) * 60.0
        min_int = int(rem_min)
        sec_val = (rem_min - min_int) * 60.0

        note = (
            f"Sine Bar Angle Inspection (L = {l_bar:.0f} mm, Slip Stack H = {h_stack:.3f} mm): "
            f"Taper Angle θ = {theta_deg:.4f}° -> {deg_int}° {min_int}' {sec_val:.1f}\" DMS."
        )

        return SineBarAngleMeasurementOutput(
            sine_bar_length_mm=float(l_bar),
            slip_gauge_height_h_mm=float(h_stack),
            measured_angle_deg=float(theta_deg),
            angle_degrees=deg_int,
            angle_minutes=min_int,
            angle_seconds=float(sec_val),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "sine_bar_15deg_taper": {
                "name": "Sine Bar 15° Taper Inspection (200mm Bar, H = 51.764mm)",
                "params": {"sine_bar_length_mm": 200.0, "slip_gauge_height_h_mm": 51.764}
            },
            "sine_bar_30deg_angle": {
                "name": "Sine Bar 30° Precise Angle (200mm Bar, H = 100.000mm)",
                "params": {"sine_bar_length_mm": 200.0, "slip_gauge_height_h_mm": 100.000}
            }
        }
