"""
Rotational Moment of Inertia Tensor & Parallel Axis Theorem Physics Engine
===========================================================================
Calculates mass moment of inertia I_cm, parallel axis shift I = I_cm + M*d^2,
radius of gyration k, and rotational kinetic energy E_rot = 0.5*I*omega^2.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RotationalInertiaTensorInput(BaseModel):
    geometry: Literal["solid_cylinder", "hollow_cylinder", "solid_sphere", "rectangular_plate"] = Field(default="solid_cylinder", description="Rigid body shape")
    mass_kg: float = Field(default=10.0, ge=0.1, le=1000.0, description="Rigid body mass M in kg")
    characteristic_radius_m: float = Field(default=0.2, ge=0.01, le=5.0, description="Radius R or half-width in meters")
    axis_parallel_shift_m: float = Field(default=0.15, ge=0.0, le=5.0, description="Parallel axis shift distance d in meters")
    rotational_speed_rpm: float = Field(default=600.0, ge=0.0, le=10000.0, description="Angular rotational speed N in RPM")


class RotationalInertiaTensorOutput(BaseModel):
    geometry: str
    centroidal_inertia_icm_kg_m2: float
    shifted_inertia_iparel_kg_m2: float
    radius_of_gyration_m: float
    rotational_kinetic_energy_joules: float
    status_note: str


class RotationalInertiaTensorEngine(BaseSimulationEngine):
    name = "rotational-inertia-tensor"
    description = "Rotational Rigid Body Dynamics: Centroidal inertia I_cm, Parallel Axis Theorem I = I_cm + M*d^2, and Radius of Gyration k"

    def calculate(self, params: RotationalInertiaTensorInput) -> RotationalInertiaTensorOutput:
        m = params.mass_kg
        r = params.characteristic_radius_m
        d_shift = params.axis_parallel_shift_m
        rpm = params.rotational_speed_rpm

        if params.geometry == "solid_sphere":
            icm = (2.0 / 5.0) * m * (r ** 2)
            geo_title = f"Solid Sphere (M = {m:.1f}kg, R = {r:.2f}m)"
        elif params.geometry == "hollow_cylinder":
            icm = m * (r ** 2)
            geo_title = f"Hollow Thin Cylinder Ring (M = {m:.1f}kg, R = {r:.2f}m)"
        elif params.geometry == "rectangular_plate":
            icm = (1.0 / 12.0) * m * (4.0 * (r ** 2))
            geo_title = f"Flat Rectangular Plate (M = {m:.1f}kg, Width = {2*r:.2f}m)"
        else: # solid_cylinder
            icm = 0.5 * m * (r ** 2)
            geo_title = f"Solid Cylinder Disc (M = {m:.1f}kg, R = {r:.2f}m)"

        # Parallel Axis Theorem I_shifted = I_cm + M * d^2
        i_shifted = icm + m * (d_shift ** 2)

        # Radius of Gyration k = sqrt(I / M)
        k_gyration = math.sqrt(i_shifted / m) if m > 0 else 0.0

        # Rotational Kinetic Energy E_rot = 0.5 * I * omega^2
        omega_rad_s = (2.0 * math.pi * rpm) / 60.0
        e_rot = 0.5 * i_shifted * (omega_rad_s ** 2)

        note = (
            f"Rotational Moment of Inertia ({geo_title}): "
            f"Centroidal I_cm = {icm:.4f} kg·m² -> Shifted I (d = {d_shift:.2f}m) = {i_shifted:.4f} kg·m² | "
            f"Radius of Gyration k = {k_gyration:.3f} m | E_rot @ {rpm:.0f} RPM = {e_rot:.1f} Joules."
        )

        return RotationalInertiaTensorOutput(
            geometry=geo_title,
            centroidal_inertia_icm_kg_m2=float(icm),
            shifted_inertia_iparel_kg_m2=float(i_shifted),
            radius_of_gyration_m=float(k_gyration),
            rotational_kinetic_energy_joules=float(e_rot),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "solid_flywheel_disc": {
                "name": "Solid Steel Flywheel Disc (10kg, R = 0.2m)",
                "params": {"geometry": "solid_cylinder", "mass_kg": 10.0, "characteristic_radius_m": 0.2, "axis_parallel_shift_m": 0.15, "rotational_speed_rpm": 600.0}
            },
            "solid_sphere_shifted": {
                "name": "Solid Sphere Off-Axis Rotation (5kg, Shift = 0.2m)",
                "params": {"geometry": "solid_sphere", "mass_kg": 5.0, "characteristic_radius_m": 0.15, "axis_parallel_shift_m": 0.20, "rotational_speed_rpm": 1200.0}
            }
        }
