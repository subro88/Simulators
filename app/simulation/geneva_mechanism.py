"""
Geneva Mechanism (External Intermittent Drive) Physics Engine
============================================================
Calculates Geneva wheel slot engagement kinematics, indexing ratio, angular velocity,
peak angular acceleration, and dwell vs motion duration.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class GenevaInput(BaseModel):
    num_slots: int = Field(default=4, ge=3, le=12, description="Number of slots on Geneva wheel (n)")
    drive_crank_radius_mm: float = Field(default=80.0, ge=30.0, le=300.0, description="Drive pin crank radius a in mm")
    driver_rpm: float = Field(default=120.0, ge=10.0, le=1000.0, description="Driver crank speed in RPM")
    driver_angle_deg: float = Field(default=0.0, ge=0.0, le=360.0, description="Driver angle theta in degrees")


class GenevaOutput(BaseModel):
    center_distance_mm: float
    geneva_radius_mm: float
    indexing_ratio: float
    in_engagement: bool
    geneva_angular_velocity_rads: float
    geneva_rpm: float
    max_geneva_rpm: float
    status_note: str


class GenevaEngine(BaseSimulationEngine):
    name = "geneva-mechanism"
    description = "Intermittent motion kinematics: Geneva wheel slot engagement, angular velocity spike, and dwell ratio"

    def calculate(self, params: GenevaInput) -> GenevaOutput:
        n = float(params.num_slots)
        a = params.drive_crank_radius_mm

        # Center distance d = a / sin(pi / n)
        beta_half = math.pi / n
        d = a / math.sin(beta_half)
        b = a / math.tan(beta_half)  # Geneva wheel radius

        # Engagement angle on driver: 2 * alpha_0 where alpha_0 = pi/2 - pi/n
        alpha_0 = (math.pi / 2.0) - beta_half
        alpha_0_deg = math.degrees(alpha_0)

        # Drive crank angle normalized relative to bottom dead center (center of engagement)
        driver_deg = params.driver_angle_deg % 360.0
        # Engagement happens around 180 deg driver angle (from 180 - alpha_0 to 180 + alpha_0)
        rel_alpha_deg = driver_deg - 180.0
        if rel_alpha_deg < -180.0:
            rel_alpha_deg += 360.0

        in_engagement = abs(rel_alpha_deg) <= alpha_0_deg

        omega_in = (params.driver_rpm * 2.0 * math.pi) / 60.0
        m_ratio = a / d

        if in_engagement:
            alpha_rad = math.radians(rel_alpha_deg)
            numerator = m_ratio * math.cos(alpha_rad) - (m_ratio ** 2)
            denominator = 1.0 + (m_ratio ** 2) - (2.0 * m_ratio * math.cos(alpha_rad))
            omega_out = omega_in * (numerator / denominator) if denominator > 0 else 0.0
        else:
            omega_out = 0.0

        geneva_rpm = (omega_out * 60.0) / (2.0 * math.pi)

        # Max angular velocity occurs at midpoint of engagement (rel_alpha = 0)
        max_omega_out = omega_in * (m_ratio / (1.0 - m_ratio)) if (1.0 - m_ratio) > 0 else omega_in
        max_geneva_rpm = (max_omega_out * 60.0) / (2.0 * math.pi)

        # Indexing ratio = (Motion time) / (Total revolution time) = (2 * alpha_0) / (2 * pi)
        indexing_ratio = (2.0 * alpha_0) / (2.0 * math.pi)

        status_text = "ENGAGED (Wheel Moving)" if in_engagement else "DWELL (Wheel Locked)"
        note = (
            f"{params.num_slots}-Slot Geneva: {status_text} | Center Distance = {d:.1f} mm "
            f"| Indexing Ratio = {indexing_ratio*100:.1f}% | Peak Geneva RPM = {max_geneva_rpm:.1f} RPM."
        )

        return GenevaOutput(
            center_distance_mm=float(d),
            geneva_radius_mm=float(b),
            indexing_ratio=float(indexing_ratio),
            in_engagement=in_engagement,
            geneva_angular_velocity_rads=float(omega_out),
            geneva_rpm=float(geneva_rpm),
            max_geneva_rpm=float(max_geneva_rpm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "four_slot_film_projector": {
                "name": "4-Slot Film Projector Indexer",
                "params": {"num_slots": 4, "drive_crank_radius_mm": 80.0, "driver_rpm": 144.0}
            },
            "six_slot_conveyor": {
                "name": "6-Slot Industrial Rotary Indexer",
                "params": {"num_slots": 6, "drive_crank_radius_mm": 100.0, "driver_rpm": 60.0}
            }
        }
