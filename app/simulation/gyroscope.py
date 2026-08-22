"""
Gyroscopic Precession & Stabilization Physics Engine
===================================================
Calculates rotor moment of inertia I, spin velocity omega, precession speed omega_p,
gyroscopic couple C = I * omega * omega_p, and vehicle stability moments.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class GyroscopeInput(BaseModel):
    rotor_mass_kg: float = Field(default=8.0, ge=0.5, le=100.0, description="Gyroscopic rotor mass m in kg")
    rotor_radius_mm: float = Field(default=150.0, ge=30.0, le=600.0, description="Rotor radius of gyration k in mm")
    spin_rpm: float = Field(default=6000.0, ge=100.0, le=30000.0, description="Rotor spin speed N_s in RPM")
    precession_rpm: float = Field(default=30.0, ge=0.0, le=600.0, description="Precession speed N_p in RPM")


class GyroscopeOutput(BaseModel):
    rotor_inertia_kgm2: float
    spin_velocity_rads: float
    precession_velocity_rads: float
    gyroscopic_couple_nm: float
    angular_momentum_nms: float
    stability_status: str
    status_note: str


class GyroscopeEngine(BaseSimulationEngine):
    name = "gyroscope"
    description = "Gyroscopic precession physics: spin angular velocity, precession speed, and gyroscopic couple"

    def calculate(self, params: GyroscopeInput) -> GyroscopeOutput:
        r_m = params.rotor_radius_mm / 1000.0
        # Disc inertia I = 0.5 * m * r^2
        i_rotor = 0.5 * params.rotor_mass_kg * (r_m ** 2)

        omega_s = (params.spin_rpm * 2.0 * math.pi) / 60.0
        omega_p = (params.precession_rpm * 2.0 * math.pi) / 60.0

        # Angular momentum L = I * omega_s
        l_ang = i_rotor * omega_s

        # Gyroscopic Couple C = I * omega_s * omega_p
        c_gyro = i_rotor * omega_s * omega_p

        status = "Stabilizing Gyroscopic Couple Active" if c_gyro > 0 else "Static Rotor"
        note = (
            f"Gyroscopic Effect: Rotor Inertia I = {i_rotor:.4f} kg·m² | Spin = {params.spin_rpm:.0f} RPM "
            f"| Precession = {params.precession_rpm:.1f} RPM | Gyroscopic Couple C = {c_gyro:.2f} N·m."
        )

        return GyroscopeOutput(
            rotor_inertia_kgm2=float(i_rotor),
            spin_velocity_rads=float(omega_s),
            precession_velocity_rads=float(omega_p),
            gyroscopic_couple_nm=float(c_gyro),
            angular_momentum_nms=float(l_ang),
            stability_status=status,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "aircraft_propeller": {
                "name": "Aircraft Engine Propeller Gyro",
                "params": {"rotor_mass_kg": 25.0, "rotor_radius_mm": 400.0, "spin_rpm": 2400.0, "precession_rpm": 12.0}
            },
            "ship_stabilizer": {
                "name": "Marine Ship Gyro-Stabilizer",
                "params": {"rotor_mass_kg": 80.0, "rotor_radius_mm": 500.0, "spin_rpm": 10000.0, "precession_rpm": 5.0}
            }
        }
