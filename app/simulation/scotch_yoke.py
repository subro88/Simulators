"""
Scotch Yoke Mechanism Physics Engine
====================================
Converts rotational motion into pure simple harmonic motion (SHM).
Calculates yoke position x, linear velocity v, acceleration a, and pin contact forces.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ScotchYokeInput(BaseModel):
    crank_radius_mm: float = Field(default=60.0, ge=10.0, le=250.0, description="Crank radius R in mm")
    crank_rpm: float = Field(default=600.0, ge=0.0, le=3000.0, description="Input crank speed in RPM")
    crank_angle_deg: float = Field(default=30.0, ge=0.0, le=360.0, description="Instantaneous crank angle theta in degrees")
    slider_mass_kg: float = Field(default=2.5, ge=0.1, le=50.0, description="Reciprocating yoke mass in kg")


class ScotchYokeOutput(BaseModel):
    stroke_length_mm: float
    yoke_displacement_mm: float
    yoke_velocity_ms: float
    yoke_acceleration_ms2: float
    inertia_force_n: float
    peak_velocity_ms: float
    status_note: str


class ScotchYokeEngine(BaseSimulationEngine):
    name = "scotch-yoke"
    description = "Scotch Yoke mechanism kinematics: pure simple harmonic reciprocating motion"

    def calculate(self, params: ScotchYokeInput) -> ScotchYokeOutput:
        r = params.crank_radius_mm / 1000.0
        theta_rad = math.radians(params.crank_angle_deg)
        omega = (params.crank_rpm * 2.0 * math.pi) / 60.0

        # Pure SHM: x = R * cos(theta), v = -R * omega * sin(theta), a = -R * omega^2 * cos(theta)
        x_m = r * math.cos(theta_rad)
        x_mm = x_m * 1000.0
        v_ms = -r * omega * math.sin(theta_rad)
        a_ms2 = -r * (omega ** 2) * math.cos(theta_rad)

        inertia_force = params.slider_mass_kg * abs(a_ms2)
        stroke_mm = 2.0 * params.crank_radius_mm
        peak_v = r * omega

        note = (
            f"Scotch Yoke (Pure SHM): Stroke = {stroke_mm:.1f} mm | Yoke Displacement = {x_mm:.1f} mm "
            f"| Velocity = {v_ms:.2f} m/s | Inertia Force = {inertia_force:.1f} N."
        )

        return ScotchYokeOutput(
            stroke_length_mm=float(stroke_mm),
            yoke_displacement_mm=float(x_mm),
            yoke_velocity_ms=float(v_ms),
            yoke_acceleration_ms2=float(a_ms2),
            inertia_force_n=float(inertia_force),
            peak_velocity_ms=float(peak_v),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "valve_actuator": {
                "name": "High Precision Valve Actuator",
                "params": {"crank_radius_mm": 40.0, "crank_rpm": 900.0, "slider_mass_kg": 1.5}
            },
            "reciprocating_pump": {
                "name": "Heavy Reciprocating Slurry Pump",
                "params": {"crank_radius_mm": 100.0, "crank_rpm": 300.0, "slider_mass_kg": 8.0}
            }
        }
