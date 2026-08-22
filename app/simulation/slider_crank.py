"""
Slider-Crank Mechanism Physics Engine
=====================================
Calculates piston stroke displacement x, linear velocity v, linear acceleration a,
connecting rod obliquity angle phi, and peak forces.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SliderCrankInput(BaseModel):
    crank_radius_mm: float = Field(default=50.0, ge=10.0, le=200.0, description="Crank radius r in mm")
    connecting_rod_mm: float = Field(default=200.0, ge=50.0, le=600.0, description="Connecting rod length l in mm")
    crank_rpm: float = Field(default=1500.0, ge=0.0, le=8000.0, description="Crank shaft rotational speed in RPM")
    crank_angle_deg: float = Field(default=45.0, ge=0.0, le=360.0, description="Instantaneous crank angle theta in degrees")


class SliderCrankOutput(BaseModel):
    obliquity_ratio: float
    piston_stroke_mm: float
    piston_displacement_mm: float
    piston_velocity_ms: float
    piston_acceleration_ms2: float
    connecting_rod_angle_deg: float
    max_piston_velocity_ms: float
    status_note: str


class SliderCrankEngine(BaseSimulationEngine):
    name = "slider-crank"
    description = "Single slider-crank kinematics: piston displacement, velocity, acceleration, and obliquity angle"

    def calculate(self, params: SliderCrankInput) -> SliderCrankOutput:
        r = params.crank_radius_mm / 1000.0
        l = params.connecting_rod_mm / 1000.0
        lambda_ratio = r / l if l > 0 else 0.25

        theta_rad = math.radians(params.crank_angle_deg)
        omega = (params.crank_rpm * 2.0 * math.pi) / 60.0

        # Connecting rod obliquity angle phi = asin(lambda * sin(theta))
        sin_phi = lambda_ratio * math.sin(theta_rad)
        sin_phi = min(1.0, max(-1.0, sin_phi))
        phi_rad = math.asin(sin_phi)
        phi_deg = math.degrees(phi_rad)

        # Displacement x = r * ((1 - cos(theta)) + (lambda / 2) * sin^2(theta))
        x_m = r * ((1.0 - math.cos(theta_rad)) + (lambda_ratio / 2.0) * (math.sin(theta_rad) ** 2))
        x_mm = x_m * 1000.0

        # Velocity v = r * omega * (sin(theta) + (lambda / 2) * sin(2 * theta))
        v_ms = r * omega * (math.sin(theta_rad) + (lambda_ratio / 2.0) * math.sin(2.0 * theta_rad))

        # Acceleration a = r * omega^2 * (cos(theta) + lambda * cos(2 * theta))
        a_ms2 = r * (omega ** 2) * (math.cos(theta_rad) + lambda_ratio * math.cos(2.0 * theta_rad))

        stroke_mm = 2.0 * params.crank_radius_mm
        max_v = r * omega * (1.0 + lambda_ratio)

        note = (
            f"Slider-Crank: Stroke = {stroke_mm:.1f} mm | Piston Velocity = {abs(v_ms):.2f} m/s "
            f"| Acceleration = {a_ms2:.1f} m/s² (Obliquity ratio λ = {lambda_ratio:.3f})."
        )

        return SliderCrankOutput(
            obliquity_ratio=float(lambda_ratio),
            piston_stroke_mm=float(stroke_mm),
            piston_displacement_mm=float(x_mm),
            piston_velocity_ms=float(v_ms),
            piston_acceleration_ms2=float(a_ms2),
            connecting_rod_angle_deg=float(phi_deg),
            max_piston_velocity_ms=float(max_v),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "automotive_piston": {
                "name": "Standard Automobile Piston",
                "params": {"crank_radius_mm": 45.0, "connecting_rod_mm": 140.0, "crank_rpm": 3000.0}
            },
            "compressor_short_rod": {
                "name": "Air Compressor (Short Rod)",
                "params": {"crank_radius_mm": 60.0, "connecting_rod_mm": 180.0, "crank_rpm": 1200.0}
            }
        }
