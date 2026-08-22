"""
Simple Machines (Inclined Plane, Pulley Block, Screw Jack) Physics Engine
========================================================================
Calculates Mechanical Advantage MA, Velocity Ratio VR, Efficiency eta,
effort required P, friction angle phi, and self-locking conditions.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SimpleMachinesInput(BaseModel):
    machine_type: Literal["inclined_plane", "pulley_system", "screw_jack"] = Field(
        default="screw_jack",
        description="Simple machine type: Inclined Plane, Pulley System, or Screw Jack"
    )
    load_weight_n: float = Field(default=5000.0, ge=100.0, le=100000.0, description="Load weight W to be raised in N")
    applied_effort_n: float = Field(default=250.0, ge=10.0, le=10000.0, description="Applied effort P in N")
    friction_coeff: float = Field(default=0.20, ge=0.01, le=0.60, description="Coefficient of friction mu")
    inclination_angle_deg: float = Field(default=15.0, ge=2.0, le=60.0, description="Inclined plane angle theta in degrees")
    number_of_pulleys: int = Field(default=4, ge=1, le=10, description="Number of pulleys n in block and tackle")
    screw_pitch_mm: float = Field(default=10.0, ge=2.0, le=40.0, description="Screw pitch p in mm")
    tom_handle_length_mm: float = Field(default=400.0, ge=100.0, le=1500.0, description="Tom/lever handle radius R in mm")


class SimpleMachinesOutput(BaseModel):
    machine_type: str
    mechanical_advantage: float
    velocity_ratio: float
    efficiency_pct: float
    ideal_effort_n: float
    friction_effort_n: float
    is_self_locking: bool
    status_note: str


class SimpleMachinesEngine(BaseSimulationEngine):
    name = "simple-machines"
    description = "Mechanics of simple machines: Mechanical Advantage MA, Velocity Ratio VR, Efficiency, and Friction"

    def calculate(self, params: SimpleMachinesInput) -> SimpleMachinesOutput:
        w = params.load_weight_n
        p = max(1.0, params.applied_effort_n)
        mu = params.friction_coeff
        phi_rad = math.atan(mu)

        if params.machine_type == "inclined_plane":
            theta_rad = math.radians(params.inclination_angle_deg)
            # Velocity ratio VR = 1 / sin(theta)
            vr = 1.0 / math.sin(theta_rad) if math.sin(theta_rad) > 0 else 1.0
            # Ideal effort P_ideal = W * sin(theta)
            p_ideal = w * math.sin(theta_rad)
            # Actual effort to raise load P = W * sin(theta + phi) / cos(phi)
            type_title = "Inclined Plane"
            is_self_locking = theta_rad <= phi_rad

        elif params.machine_type == "pulley_system":
            # VR = number of pulleys n
            vr = float(params.number_of_pulleys)
            p_ideal = w / vr
            type_title = f"{params.number_of_pulleys}-Pulley System"
            is_self_locking = False

        else: # screw_jack
            p_mm = params.screw_pitch_mm
            r_mm = params.tom_handle_length_mm
            d_mean_mm = 40.0  # mean thread diameter
            alpha_rad = math.atan(p_mm / (math.pi * d_mean_mm))

            # VR = (2 * pi * R) / pitch
            vr = (2.0 * math.pi * r_mm) / p_mm if p_mm > 0 else 1.0

            # Ideal effort at handle: P_ideal = W * (pitch / (2 * pi * R))
            p_ideal = w / vr

            # Self locking if friction angle phi > helix angle alpha (efficiency < 50%)
            is_self_locking = phi_rad > alpha_rad
            type_title = "Screw Jack"

        ma = w / p
        eff_pct = (ma / vr) * 100.0 if vr > 0 else 0.0
        eff_pct = min(100.0, max(0.0, eff_pct))

        friction_effort = p - p_ideal

        locking_text = "Self-Locking (Safe)" if is_self_locking else "Overhauling (Requires Brake)"
        note = (
            f"{type_title}: MA = {ma:.2f} | VR = {vr:.2f} | Mechanical Efficiency = {eff_pct:.1f}% "
            f"| Friction Effort = {friction_effort:.1f} N ({locking_text})."
        )

        return SimpleMachinesOutput(
            machine_type=type_title,
            mechanical_advantage=float(ma),
            velocity_ratio=float(vr),
            efficiency_pct=float(eff_pct),
            ideal_effort_n=float(p_ideal),
            friction_effort_n=float(friction_effort),
            is_self_locking=is_self_locking,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "heavy_screw_jack": {
                "name": "Industrial Car Screw Jack",
                "params": {"machine_type": "screw_jack", "load_weight_n": 15000.0, "applied_effort_n": 220.0, "screw_pitch_mm": 8.0, "tom_handle_length_mm": 350.0}
            },
            "quad_pulley_hoist": {
                "name": "4-Pulley Block & Tackle Hoist",
                "params": {"machine_type": "pulley_system", "load_weight_n": 4000.0, "applied_effort_n": 1150.0, "number_of_pulleys": 4}
            }
        }
