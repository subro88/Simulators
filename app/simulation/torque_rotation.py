"""
Torque & Rotational Dynamics Physics Engine
===========================================
Calculates moment of inertia I across geometries, applied torque tau,
angular acceleration alpha, angular momentum L, and rotational kinetic energy K_rot.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class TorqueRotationInput(BaseModel):
    geometry: Literal["solid_cylinder", "hollow_cylinder", "solid_sphere", "thin_rod"] = Field(
        default="solid_cylinder",
        description="Body geometry shape for moment of inertia"
    )
    mass_kg: float = Field(default=10.0, ge=0.1, le=1000.0, description="Body mass M in kg")
    radius_mm: float = Field(default=200.0, ge=10.0, le=2000.0, description="Outer radius R (or rod length L) in mm")
    inner_radius_mm: float = Field(default=100.0, ge=0.0, le=1500.0, description="Inner radius r_in for hollow cylinder in mm")
    applied_force_n: float = Field(default=50.0, ge=0.0, le=5000.0, description="Applied tangential force F in N")
    rotational_speed_rpm: float = Field(default=1200.0, ge=0.0, le=10000.0, description="Angular velocity N in RPM")


class TorqueRotationOutput(BaseModel):
    geometry: str
    moment_of_inertia_kgm2: float
    applied_torque_nm: float
    angular_acceleration_rads2: float
    angular_velocity_rads: float
    angular_momentum_nms: float
    rotational_kinetic_energy_j: float
    status_note: str


class TorqueRotationEngine(BaseSimulationEngine):
    name = "torque-rotation"
    description = "Rotational dynamics physics: Moment of inertia I, Torque tau = I*alpha, Angular momentum, and Kinetic energy"

    def calculate(self, params: TorqueRotationInput) -> TorqueRotationOutput:
        m = params.mass_kg
        r = params.radius_mm / 1000.0
        r_in = params.inner_radius_mm / 1000.0

        if params.geometry == "solid_cylinder":
            i_val = 0.5 * m * (r ** 2)
            geo_title = "Solid Cylinder / Disc"
        elif params.geometry == "hollow_cylinder":
            i_val = 0.5 * m * ((r ** 2) + (r_in ** 2))
            geo_title = "Hollow Cylinder / Ring"
        elif params.geometry == "solid_sphere":
            i_val = 0.4 * m * (r ** 2)
            geo_title = "Solid Sphere"
        else: # thin_rod
            # Thin rod about center L = r
            i_val = (1.0 / 12.0) * m * (r ** 2)
            geo_title = "Thin Uniform Rod (About Center)"

        # Applied torque tau = F * r
        tau = params.applied_force_n * r

        # Angular acceleration alpha = tau / I
        alpha = tau / i_val if i_val > 0 else 0.0

        omega = (params.rotational_speed_rpm * 2.0 * math.pi) / 60.0

        # Angular momentum L = I * omega
        l_ang = i_val * omega

        # Rotational KE = 0.5 * I * omega^2
        ke_rot = 0.5 * i_val * (omega ** 2)

        note = (
            f"{geo_title}: Moment of Inertia I = {i_val:.4f} kg·m² | Torque τ = {tau:.2f} N·m "
            f"| Angular Accel α = {alpha:.1f} rad/s² | Rotational KE = {ke_rot:.1f} J."
        )

        return TorqueRotationOutput(
            geometry=geo_title,
            moment_of_inertia_kgm2=float(i_val),
            applied_torque_nm=float(tau),
            angular_acceleration_rads2=float(alpha),
            angular_velocity_rads=float(omega),
            angular_momentum_nms=float(l_ang),
            rotational_kinetic_energy_j=float(ke_rot),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "flywheel_disc": {
                "name": "Heavy Steel Flywheel Disc",
                "params": {"geometry": "solid_cylinder", "mass_kg": 40.0, "radius_mm": 300.0, "applied_force_n": 120.0, "rotational_speed_rpm": 1800.0}
            },
            "hollow_rotor": {
                "name": "Hollow Motor Rotor Shell",
                "params": {"geometry": "hollow_cylinder", "mass_kg": 15.0, "radius_mm": 180.0, "inner_radius_mm": 120.0, "applied_force_n": 45.0, "rotational_speed_rpm": 3000.0}
            }
        }
