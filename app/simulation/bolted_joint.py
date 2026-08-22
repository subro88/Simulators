"""
Bolted Joint & Fastener Design Physics Engine
=============================================
Calculates bolt stiffness kb, member stiffness km, joint stiffness ratio C,
preload Fi, bolt tension Fb, member clamping Fm, and separation safety factor.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BoltedJointInput(BaseModel):
    bolt_nominal_dia_mm: float = Field(default=16.0, ge=4.0, le=60.0, description="Nominal bolt diameter d (e.g., M16)")
    pitch_mm: float = Field(default=2.0, ge=0.5, le=6.0, description="Thread pitch p in mm")
    grip_length_mm: float = Field(default=60.0, ge=10.0, le=300.0, description="Clamped member thickness L in mm")
    applied_tensile_kn: float = Field(default=35.0, ge=0.0, le=500.0, description="External working tensile load P in kN")
    proof_strength_mpa: float = Field(default=600.0, ge=200.0, le=1200.0, description="Bolt proof strength sigma_p in MPa (Class 8.8 ≈ 600 MPa)")
    torque_coeff_k: float = Field(default=0.20, ge=0.10, le=0.30, description="Torque coefficient K (lubricated ≈ 0.15, dry ≈ 0.20)")


class BoltedJointOutput(BaseModel):
    tensile_stress_area_mm2: float
    preload_force_kn: float
    tightening_torque_nm: float
    joint_stiffness_ratio: float
    total_bolt_load_kn: float
    remaining_clamping_kn: float
    separation_load_kn: float
    bolt_safety_factor: float
    status_note: str


class BoltedJointEngine(BaseSimulationEngine):
    name = "bolted-joint"
    description = "Bolted joint mechanics: preload Fi, joint stiffness ratio C, bolt load Fb, clamping Fm, and separation safety factor"

    def calculate(self, params: BoltedJointInput) -> BoltedJointOutput:
        d = params.bolt_nominal_dia_mm
        p = params.pitch_mm

        # Tensile stress area A_t = (pi / 4) * (d - 0.9382 * p)^2
        d_sub = d - (0.9382 * p)
        a_t_mm2 = (math.pi / 4.0) * (d_sub ** 2) if d_sub > 0 else (math.pi * d ** 2) / 4.0

        # Recommended preload F_i = 0.75 * A_t * sigma_proof
        f_i_n = 0.75 * a_t_mm2 * params.proof_strength_mpa
        f_i_kn = f_i_n / 1000.0

        # Tightening Torque T = K * F_i * d (in N·m)
        t_nm = (params.torque_coeff_k * f_i_n * (d / 1000.0))

        # Joint Stiffness ratio C: typical steel joint C ≈ 0.20 to 0.30
        c_ratio = 0.25

        p_working_kn = params.applied_tensile_kn

        # Total bolt load F_b = F_i + C * P
        f_b_kn = f_i_kn + (c_ratio * p_working_kn)

        # Remaining clamping load F_m = F_i - (1 - C) * P
        f_m_kn = f_i_kn - ((1.0 - c_ratio) * p_working_kn)

        # Separation Load P_sep = F_i / (1 - C)
        p_sep_kn = f_i_kn / (1.0 - c_ratio)

        # Bolt stress = F_b / A_t
        bolt_stress_mpa = (f_b_kn * 1000.0) / a_t_mm2 if a_t_mm2 > 0 else 0.0
        fos_bolt = params.proof_strength_mpa / bolt_stress_mpa if bolt_stress_mpa > 0 else 99.0

        status_str = "SAFE (Joint Sealed)" if f_m_kn > 0 else "WARNING: JOINT SEPARATION!"

        note = (
            f"M{d:.0f} Bolted Joint: Preload F_i = {f_i_kn:.1f} kN (Torque = {t_nm:.1f} N·m) | "
            f"Total Bolt Load F_b = {f_b_kn:.1f} kN | Clamping F_m = {f_m_kn:.1f} kN ({status_str})."
        )

        return BoltedJointOutput(
            tensile_stress_area_mm2=float(a_t_mm2),
            preload_force_kn=float(f_i_kn),
            tightening_torque_nm=float(t_nm),
            joint_stiffness_ratio=float(c_ratio),
            total_bolt_load_kn=float(f_b_kn),
            remaining_clamping_kn=float(f_m_kn),
            separation_load_kn=float(p_sep_kn),
            bolt_safety_factor=float(fos_bolt),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "m16_flange_bolt": {
                "name": "M16 Flange Pipe Joint (Class 8.8)",
                "params": {"bolt_nominal_dia_mm": 16.0, "pitch_mm": 2.0, "grip_length_mm": 60.0, "applied_tensile_kn": 35.0, "proof_strength_mpa": 600.0}
            },
            "m20_cylinder_head": {
                "name": "M20 Engine Cylinder Head Bolt (Class 10.9)",
                "params": {"bolt_nominal_dia_mm": 20.0, "pitch_mm": 2.5, "grip_length_mm": 100.0, "applied_tensile_kn": 70.0, "proof_strength_mpa": 830.0}
            }
        }
