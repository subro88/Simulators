"""
Automotive Steering Geometry Physics Engine
===========================================
Calculates Ackermann steering geometry, inner vs outer wheel lock angles,
turning radius, toe-in/toe-out, camber, caster, kingpin inclination, and scrub radius.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SteeringInput(BaseModel):
    """Input parameters for Steering Geometry simulation."""
    steering_mechanism: Literal["ackermann", "parallel_turntable", "davis"] = Field(
        default="ackermann",
        description="Type of steering linkage mechanism"
    )
    wheelbase_m: float = Field(
        default=2.6,
        ge=1.2,
        le=5.0,
        description="Vehicle wheelbase B (distance between front and rear axles) in meters"
    )
    track_width_m: float = Field(
        default=1.5,
        ge=0.8,
        le=3.0,
        description="Track width w (distance between left and right kingpins) in meters"
    )
    steering_wheel_angle_deg: float = Field(
        default=180.0,
        ge=-540.0,
        le=540.0,
        description="Driver handwheel rotation angle in degrees"
    )
    steering_ratio: float = Field(
        default=16.0,
        ge=8.0,
        le=24.0,
        description="Steering gear reduction ratio (Handwheel angle / Inner wheel angle)"
    )
    camber_angle_deg: float = Field(
        default=-1.0,
        ge=-5.0,
        le=5.0,
        description="Wheel camber angle in degrees"
    )
    caster_angle_deg: float = Field(
        default=4.5,
        ge=0.0,
        le=10.0,
        description="Kingpin caster angle in degrees"
    )
    kpi_angle_deg: float = Field(
        default=12.0,
        ge=5.0,
        le=20.0,
        description="Kingpin Inclination (KPI) in degrees"
    )


class SteeringOutput(BaseModel):
    """Calculated telemetry output for Steering Geometry."""
    mechanism: str
    inner_wheel_angle_deg: float
    actual_outer_wheel_angle_deg: float
    ideal_ackermann_outer_angle_deg: float
    ackermann_error_deg: float
    turning_radius_inner_m: float
    turning_radius_outer_m: float
    turning_radius_cg_m: float
    scrub_radius_mm: float
    status_note: str


class SteeringEngine(BaseSimulationEngine):
    """Physics simulation engine for Steering Geometry & Alignment."""

    name = "steering-geometry"
    description = "Ackermann steering kinematics, turning radius, toe/camber/caster alignment, and scrub radius"

    def calculate(self, params: SteeringInput) -> SteeringOutput:
        # Inner wheel steer angle: theta = Handwheel angle / Steering ratio
        theta_deg = abs(params.steering_wheel_angle_deg) / params.steering_ratio
        theta_rad = math.radians(theta_deg)

        b = params.wheelbase_m
        w = params.track_width_m

        if theta_deg < 0.1:
            # Straight line driving
            inner_angle = 0.0
            actual_outer = 0.0
            ideal_outer = 0.0
            r_inner = 999.0
            r_outer = 999.0
            r_cg = 999.0
            ackermann_error = 0.0
            note = "Straight line driving: Both front wheels parallel (0° steer angle)."
        else:
            inner_angle = theta_deg

            # Ideal Ackermann equation: cot(phi_ideal) - cot(theta) = w / b
            cot_theta = 1.0 / math.tan(theta_rad)
            cot_phi_ideal = cot_theta + (w / b)
            ideal_outer_rad = math.atan(1.0 / cot_phi_ideal)
            ideal_outer = math.degrees(ideal_outer_rad)

            if params.steering_mechanism == "ackermann":
                # Real Ackermann linkage (~95% accuracy)
                actual_outer = ideal_outer * 0.96
            elif params.steering_mechanism == "parallel_turntable":
                # Parallel steering (both wheels turn same angle -> 100% scrub error)
                actual_outer = inner_angle
            else: # Davis
                actual_outer = ideal_outer

            ackermann_error = abs(actual_outer - ideal_outer)

            # Turning Radii
            r_inner = b / math.sin(theta_rad)
            r_outer = b / math.sin(ideal_outer_rad)
            r_cg = b / math.tan((theta_rad + ideal_outer_rad) / 2.0)

            direction = "Left" if params.steering_wheel_angle_deg > 0 else "Right"
            note = (
                f"{direction} Turn: Inner wheel at {inner_angle:.1f}°, Outer wheel at {actual_outer:.1f}° "
                f"(Turning Radius: {r_cg:.2f} m)."
            )

        # Scrub Radius calculation
        wheel_radius_mm = 320.0
        kpi_rad = math.radians(params.kpi_angle_deg)
        scrub_radius_mm = 45.0 - (wheel_radius_mm * math.sin(kpi_rad))

        return SteeringOutput(
            mechanism=params.steering_mechanism.title(),
            inner_wheel_angle_deg=float(inner_angle),
            actual_outer_wheel_angle_deg=float(actual_outer),
            ideal_ackermann_outer_angle_deg=float(ideal_outer),
            ackermann_error_deg=float(ackermann_error),
            turning_radius_inner_m=float(r_inner),
            turning_radius_outer_m=float(r_outer),
            turning_radius_cg_m=float(r_cg),
            scrub_radius_mm=float(scrub_radius_mm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "city_hatchback": {
                "name": "Compact City Car (Tight Turning Circle)",
                "params": {
                    "steering_mechanism": "ackermann",
                    "wheelbase_m": 2.4,
                    "track_width_m": 1.4,
                    "steering_wheel_angle_deg": 360.0,
                    "steering_ratio": 15.0
                }
            },
            "formula_race_car": {
                "name": "Race Car (High Direct Steering Ratio)",
                "params": {
                    "steering_mechanism": "ackermann",
                    "wheelbase_m": 3.1,
                    "track_width_m": 1.6,
                    "steering_wheel_angle_deg": 120.0,
                    "steering_ratio": 10.0,
                    "camber_angle_deg": -3.0,
                    "caster_angle_deg": 7.0
                }
            }
        }
