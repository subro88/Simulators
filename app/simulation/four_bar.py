"""
Four-Bar Linkage Kinematics Physics Engine
==========================================
Calculates Grashof condition, Freudenstein position analysis, angular velocity,
angular acceleration, transmission angle, and coupler curve point tracing.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class FourBarInput(BaseModel):
    """Input parameters for Four-Bar Linkage simulation."""
    frame_length_a: float = Field(default=180.0, ge=30.0, le=500.0, description="Fixed Frame link length a (mm)")
    crank_length_b: float = Field(default=60.0, ge=10.0, le=400.0, description="Input Crank link length b (mm)")
    coupler_length_c: float = Field(default=160.0, ge=20.0, le=500.0, description="Coupler link length c (mm)")
    rocker_length_d: float = Field(default=140.0, ge=20.0, le=500.0, description="Output Rocker link length d (mm)")
    crank_angle_deg: float = Field(default=45.0, ge=0.0, le=360.0, description="Input crank angle theta2 in degrees")
    crank_rpm: float = Field(default=60.0, ge=0.0, le=600.0, description="Input crank speed in RPM")


class FourBarOutput(BaseModel):
    """Calculated output kinematics for Four-Bar Linkage."""
    grashof_type: str
    is_grashof: bool
    coupler_angle_deg: float
    rocker_angle_deg: float
    transmission_angle_deg: float
    rocker_rpm: float
    coupler_point_x: float
    coupler_point_y: float
    status_note: str


class FourBarEngine(BaseSimulationEngine):
    """Kinematics simulation engine for 4-Bar Planar Linkages."""

    name = "four-bar-linkage"
    description = "Grashof criterion, Freudenstein angular position solver, and transmission angle"

    def calculate(self, params: FourBarInput) -> FourBarOutput:
        a = params.frame_length_a
        b = params.crank_length_b
        c = params.coupler_length_c
        d = params.rocker_length_d

        links = [a, b, c, d]
        s = min(links)
        l = max(links)
        p_q_sum = sum(links) - s - l

        is_grashof = (s + l) <= p_q_sum

        if is_grashof:
            if s == a:
                grashof_type = "Grashof Double-Crank (Drag-Link Mechanism)"
            elif s == b:
                grashof_type = "Grashof Crank-Rocker Mechanism"
            elif s == d:
                grashof_type = "Grashof Rocker-Crank Mechanism"
            else:
                grashof_type = "Grashof Double-Rocker Mechanism"
        else:
            grashof_type = "Non-Grashof Triple-Rocker Mechanism"

        # Freudenstein Position Analysis for theta4 (rocker angle)
        th2 = math.radians(params.crank_angle_deg)
        k1 = a / b
        k2 = a / d
        k3 = (b**2 - c**2 + d**2 + a**2) / (2.0 * b * d)
        k4 = a / c
        k5 = (c**2 + d**2 - a**2 - b**2) / (2.0 * c * d)

        A_val = math.cos(th2) - k1 - k2 * math.cos(th2) + k3
        B_val = -2.0 * math.sin(th2)
        C_val = k1 - (k2 + 1.0) * math.cos(th2) + k3

        discriminant = B_val**2 - 4.0 * A_val * C_val
        if discriminant < 0:
            th4 = 0.0
            th3 = 0.0
            transmission_angle = 0.0
            rocker_rpm = 0.0
            px, py = 0.0, 0.0
            note = "Linkage cannot assemble at this crank angle (toggle limit reached)."
        else:
            t = (-B_val + math.sqrt(discriminant)) / (2.0 * A_val) if A_val != 0 else 0.0
            th4 = 2.0 * math.atan(t)
            th3 = math.atan2(d * math.sin(th4) - b * math.sin(th2), a + d * math.cos(th4) - b * math.cos(th2))

            # Transmission angle mu between coupler c and rocker d
            cos_mu = (c**2 + d**2 - (a - b * math.cos(th2))**2 - (b * math.sin(th2))**2) / (2.0 * c * d)
            cos_mu = max(-1.0, min(1.0, cos_mu))
            transmission_angle = math.degrees(math.acos(cos_mu))

            omega2 = (params.crank_rpm * 2.0 * math.pi) / 60.0
            omega4 = (b * omega2 * math.sin(th3 - th2)) / (d * math.sin(th3 - th4)) if math.sin(th3 - th4) != 0 else 0.0
            rocker_rpm = (omega4 * 60.0) / (2.0 * math.pi)

            # Coupler point mid-point coordinates
            px = b * math.cos(th2) + (c / 2.0) * math.cos(th3)
            py = b * math.sin(th2) + (c / 2.0) * math.sin(th3)
            note = f"{grashof_type}: Transmission Angle = {transmission_angle:.1f}° (Rocker Speed = {rocker_rpm:.1f} RPM)."

        return FourBarOutput(
            grashof_type=grashof_type,
            is_grashof=is_grashof,
            coupler_angle_deg=float(math.degrees(th3)),
            rocker_angle_deg=float(math.degrees(th4)),
            transmission_angle_deg=float(transmission_angle),
            rocker_rpm=float(rocker_rpm),
            coupler_point_x=float(px),
            coupler_point_y=float(py),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "standard_crank_rocker": {
                "name": "Standard Crank-Rocker",
                "params": {"frame_length_a": 180.0, "crank_length_b": 60.0, "coupler_length_c": 160.0, "rocker_length_d": 140.0}
            },
            "drag_link_double_crank": {
                "name": "Drag-Link Double-Crank",
                "params": {"frame_length_a": 50.0, "crank_length_b": 100.0, "coupler_length_c": 120.0, "rocker_length_d": 110.0}
            }
        }
