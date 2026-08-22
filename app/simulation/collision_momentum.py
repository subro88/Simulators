"""
Collision & Momentum Conservation Physics Engine
================================================
Calculates 1D elastic and inelastic collision kinematics, post-impact velocities v1 and v2,
coefficient of restitution e, momentum conservation, and kinetic energy loss Delta KE.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CollisionMomentumInput(BaseModel):
    mass_1_kg: float = Field(default=5.0, ge=0.1, le=500.0, description="Mass of Body 1 in kg")
    velocity_1_initial_ms: float = Field(default=10.0, ge=-50.0, le=50.0, description="Initial velocity u1 of Body 1 in m/s")
    mass_2_kg: float = Field(default=3.0, ge=0.1, le=500.0, description="Mass of Body 2 in kg")
    velocity_2_initial_ms: float = Field(default=-2.0, ge=-50.0, le=50.0, description="Initial velocity u2 of Body 2 in m/s")
    coeff_restitution: float = Field(default=0.80, ge=0.0, le=1.0, description="Coefficient of Restitution e (0 = plastic, 1 = elastic)")


class CollisionMomentumOutput(BaseModel):
    total_momentum_initial_kgms: float
    total_momentum_final_kgms: float
    velocity_1_final_ms: float
    velocity_2_final_ms: float
    initial_kinetic_energy_j: float
    final_kinetic_energy_j: float
    energy_loss_j: float
    collision_type: str
    status_note: str


class CollisionMomentumEngine(BaseSimulationEngine):
    name = "collision-momentum"
    description = "Conservation of linear momentum and impulse: 1D elastic/inelastic collision kinematics"

    def calculate(self, params: CollisionMomentumInput) -> CollisionMomentumOutput:
        m1 = params.mass_1_kg
        m2 = params.mass_2_kg
        u1 = params.velocity_1_initial_ms
        u2 = params.velocity_2_initial_ms
        e = params.coeff_restitution

        p_initial = (m1 * u1) + (m2 * u2)
        ke_initial = (0.5 * m1 * (u1 ** 2)) + (0.5 * m2 * (u2 ** 2))

        # Post collision velocities
        v1 = ((m1 * u1 + m2 * u2) - m2 * e * (u1 - u2)) / (m1 + m2)
        v2 = ((m1 * u1 + m2 * u2) + m1 * e * (u1 - u2)) / (m1 + m2)

        p_final = (m1 * v1) + (m2 * v2)
        ke_final = (0.5 * m1 * (v1 ** 2)) + (0.5 * m2 * (v2 ** 2))
        e_loss = ke_initial - ke_final

        if math.isclose(e, 1.0, abs_tol=1e-3):
            col_type = "Perfectly Elastic Collision (Zero Energy Loss)"
        elif math.isclose(e, 0.0, abs_tol=1e-3):
            col_type = "Perfectly Inelastic / Plastic Collision (Bodies Stick)"
        else:
            col_type = f"Inelastic Collision (e = {e:.2f})"

        note = (
            f"{col_type}: Post Velocity v1 = {v1:.2f} m/s, v2 = {v2:.2f} m/s | "
            f"Momentum Conserved = {p_final:.2f} kg·m/s | Energy Loss ΔKE = {e_loss:.2f} J."
        )

        return CollisionMomentumOutput(
            total_momentum_initial_kgms=float(p_initial),
            total_momentum_final_kgms=float(p_final),
            velocity_1_final_ms=float(v1),
            velocity_2_final_ms=float(v2),
            initial_kinetic_energy_j=float(ke_initial),
            final_kinetic_energy_j=float(ke_final),
            energy_loss_j=float(e_loss),
            collision_type=col_type,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "billiard_elastic": {
                "name": "Billiard Ball Elastic Head-On",
                "params": {"mass_1_kg": 0.17, "velocity_1_initial_ms": 5.0, "mass_2_kg": 0.17, "velocity_2_initial_ms": 0.0, "coeff_restitution": 1.0}
            },
            "car_crash_inelastic": {
                "name": "Vehicle Crash (Plastic Deformation)",
                "params": {"mass_1_kg": 1200.0, "velocity_1_initial_ms": 15.0, "mass_2_kg": 1500.0, "velocity_2_initial_ms": -10.0, "coeff_restitution": 0.15}
            }
        }
