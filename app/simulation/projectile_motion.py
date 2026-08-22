"""
Parabolic Projectile Motion Physics Engine
==========================================
Calculates trajectory x(t) and y(t), time of flight T, max height H,
horizontal range R, and velocity components (vx, vy).
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ProjectileMotionInput(BaseModel):
    initial_velocity_m_s: float = Field(default=40.0, ge=1.0, le=500.0, description="Launch speed v0 in m/s")
    launch_angle_deg: float = Field(default=45.0, ge=5.0, le=85.0, description="Launch angle theta in degrees")
    initial_height_m: float = Field(default=0.0, ge=0.0, le=100.0, description="Initial elevation h0 in meters")
    gravity_m_s2: float = Field(default=9.81, ge=1.0, le=25.0, description="Gravitational acceleration g in m/s²")


class ProjectileMotionOutput(BaseModel):
    time_of_flight_sec: float
    max_height_h_m: float
    horizontal_range_r_m: float
    impact_velocity_m_s: float
    status_note: str


class ProjectileMotionEngine(BaseSimulationEngine):
    name = "projectile-motion"
    description = "Classical Parabolic Projectile Dynamics: Trajectory x(t) and y(t), Time of Flight T, Max Height H, and Range R"

    def calculate(self, params: ProjectileMotionInput) -> ProjectileMotionOutput:
        v0 = params.initial_velocity_m_s
        theta_deg = params.launch_angle_deg
        h0 = params.initial_height_m
        g = params.gravity_m_s2

        theta_rad = math.radians(theta_deg)
        v0x = v0 * math.cos(theta_rad)
        v0y = v0 * math.sin(theta_rad)

        # Max Height H = h0 + v0y^2 / (2 * g)
        h_max = h0 + (v0y ** 2) / (2.0 * g)

        # Time of flight T: g/2 * T^2 - v0y * T - h0 = 0
        discriminant = (v0y ** 2) + 2.0 * g * h0
        t_flight = (v0y + math.sqrt(discriminant)) / g if g > 0 else 1.0

        # Horizontal Range R = v0x * T
        range_r = v0x * t_flight

        # Impact velocity v_impact = sqrt(v0x^2 + (v0y - g*T)^2)
        vy_impact = v0y - g * t_flight
        v_impact = math.sqrt(v0x ** 2 + vy_impact ** 2)

        note = (
            f"Parabolic Projectile Trajectory (v0 = {v0:.1f} m/s, θ = {theta_deg:.0f}°): "
            f"Time of Flight T = {t_flight:.2f} s | Max Height H = {h_max:.1f} m | "
            f"Horizontal Range R = {range_r:.1f} m | Impact Speed = {v_impact:.1f} m/s."
        )

        return ProjectileMotionOutput(
            time_of_flight_sec=float(t_flight),
            max_height_h_m=float(h_max),
            horizontal_range_r_m=float(range_r),
            impact_velocity_m_s=float(v_impact),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "optimal_45deg_launch": {
                "name": "Optimal 45° Launch Angle (v0 = 40 m/s)",
                "params": {"initial_velocity_m_s": 40.0, "launch_angle_deg": 45.0, "initial_height_m": 0.0, "gravity_m_s2": 9.81}
            },
            "high_cliff_launch": {
                "name": "Cliff Top Launch (h0 = 50m, 30° Angle)",
                "params": {"initial_velocity_m_s": 30.0, "launch_angle_deg": 30.0, "initial_height_m": 50.0, "gravity_m_s2": 9.81}
            }
        }
