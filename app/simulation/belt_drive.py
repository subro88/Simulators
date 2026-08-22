"""
Flat & V-Belt Drive Dynamics Physics Engine
===========================================
Calculates belt speed v, lap angles theta, centrifugal tension Tc, tight/slack side tensions (T1, T2),
friction torque, and transmitted mechanical power P.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BeltDriveInput(BaseModel):
    """Input parameters for Belt Drive simulation."""
    belt_type: Literal["flat_belt", "v_belt"] = Field(
        default="flat_belt",
        description="Type of belt drive: Flat Belt or V-Belt"
    )
    driver_diameter_mm: float = Field(default=200.0, ge=50.0, le=800.0, description="Driver pulley diameter D1 in mm")
    driven_diameter_mm: float = Field(default=400.0, ge=50.0, le=1200.0, description="Driven pulley diameter D2 in mm")
    center_distance_mm: float = Field(default=1000.0, ge=200.0, le=3000.0, description="Center distance C in mm")
    friction_coeff: float = Field(default=0.30, ge=0.10, le=0.60, description="Coefficient of friction mu")
    belt_mass_kg_m: float = Field(default=0.40, ge=0.05, le=3.0, description="Belt mass per unit length m in kg/m")
    max_tension_n: float = Field(default=1500.0, ge=200.0, le=8000.0, description="Maximum allowable belt tension T1 in N")
    driver_rpm: float = Field(default=1440.0, ge=100.0, le=5000.0, description="Driver pulley speed N1 in RPM")
    groove_angle_deg: float = Field(default=38.0, ge=20.0, le=60.0, description="Groove angle 2beta for V-belt in degrees")


class BeltDriveOutput(BaseModel):
    """Calculated output telemetry for Belt Drive."""
    belt_type: str
    speed_ratio: float
    belt_velocity_ms: float
    lap_angle_deg: float
    centrifugal_tension_n: float
    tight_side_tension_n: float
    slack_side_tension_n: float
    transmitted_power_kw: float
    transmitted_torque_nm: float
    status_note: str


class BeltDriveEngine(BaseSimulationEngine):
    """Dynamics simulation engine for Flat & V-Belt Drives."""

    name = "belt-drive"
    description = "Belt speed, centrifugal tension, T1/T2 tension ratio, and transmitted power"

    def calculate(self, params: BeltDriveInput) -> BeltDriveOutput:
        d1 = params.driver_diameter_mm / 1000.0
        d2 = params.driven_diameter_mm / 1000.0
        c = params.center_distance_mm / 1000.0

        # Belt Velocity v = (pi * D1 * N1) / 60
        velocity_ms = (math.pi * d1 * params.driver_rpm) / 60.0

        # Lap angle theta on smaller pulley = pi - 2 * asin((D2 - D1) / (2C))
        sin_alpha = abs(d2 - d1) / (2.0 * c) if c > 0 else 0.0
        sin_alpha = min(1.0, max(0.0, sin_alpha))
        alpha = math.asin(sin_alpha)
        theta_rad = math.pi - (2.0 * alpha)
        theta_deg = math.degrees(theta_rad)

        # Centrifugal tension Tc = m * v^2
        tc = params.belt_mass_kg_m * (velocity_ms ** 2)

        # Friction factor exponent: e^(mu * theta / sin(beta))
        mu = params.friction_coeff
        if params.belt_type == "v_belt":
            beta_rad = math.radians(params.groove_angle_deg / 2.0)
            exponent = (mu * theta_rad) / math.sin(beta_rad)
            type_title = "V-Belt Drive"
        else:
            exponent = mu * theta_rad
            type_title = "Flat Belt Drive"

        ratio_tensions = math.exp(exponent)

        # T1 = T_max, T2 = Tc + (T1 - Tc) / ratio_tensions
        t1 = params.max_tension_n
        t2 = tc + ((t1 - tc) / ratio_tensions) if ratio_tensions > 0 else tc

        # Power P = (T1 - T2) * v / 1000 in kW
        power_kw = max(0.0, (t1 - t2) * velocity_ms / 1000.0)
        speed_ratio = d2 / d1 if d1 > 0 else 1.0
        output_rpm = params.driver_rpm / speed_ratio

        omega_in = (params.driver_rpm * 2.0 * math.pi) / 60.0
        torque_nm = (power_kw * 1000.0) / omega_in if omega_in > 0 else 0.0

        note = (
            f"{type_title}: Belt Speed = {velocity_ms:.1f} m/s | Transmitted Power = {power_kw:.2f} kW "
            f"(Tight T1 = {t1:.0f} N, Slack T2 = {t2:.0f} N)."
        )

        return BeltDriveOutput(
            belt_type=type_title,
            speed_ratio=float(speed_ratio),
            belt_velocity_ms=float(velocity_ms),
            lap_angle_deg=float(theta_deg),
            centrifugal_tension_n=float(tc),
            tight_side_tension_n=float(t1),
            slack_side_tension_n=float(t2),
            transmitted_power_kw=float(power_kw),
            transmitted_torque_nm=float(torque_nm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "flat_belt_workshop": {
                "name": "Workshop Flat Belt (1440 RPM)",
                "params": {"belt_type": "flat_belt", "driver_diameter_mm": 200.0, "driven_diameter_mm": 400.0, "max_tension_n": 1500.0}
            },
            "v_belt_industrial": {
                "name": "Industrial V-Belt High Power",
                "params": {"belt_type": "v_belt", "driver_diameter_mm": 250.0, "driven_diameter_mm": 500.0, "max_tension_n": 3200.0}
            }
        }
