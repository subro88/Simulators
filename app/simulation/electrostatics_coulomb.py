"""
Coulomb's Law & Electrostatics Physics Engine
=============================================
Calculates electrostatic attraction/repulsion force F, electric field E,
potential V, and parallel plate capacitance C.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ElectrostaticsCoulombInput(BaseModel):
    charge_q1_uc: float = Field(default=10.0, ge=-500.0, le=500.0, description="Point charge q1 in µC")
    charge_q2_uc: float = Field(default=-5.0, ge=-500.0, le=500.0, description="Point charge q2 in µC")
    separation_distance_cm: float = Field(default=10.0, ge=0.5, le=500.0, description="Separation distance r in cm")
    relative_permittivity_er: float = Field(default=1.0, ge=1.0, le=80.0, description="Dielectric relative permittivity epsilon_r")


class ElectrostaticsCoulombOutput(BaseModel):
    coulomb_force_n: float
    is_attractive: bool
    electric_field_at_midpoint_v_m: float
    electric_potential_midpoint_v: float
    parallel_plate_capacitance_pf: float
    status_note: str


class ElectrostaticsCoulombEngine(BaseSimulationEngine):
    name = "electrostatics-coulomb"
    description = "Coulomb's Law & Electrostatics: F = ke*|q1*q2|/(er*r^2), Electric Field E, Potential V, and Capacitance C"

    def calculate(self, params: ElectrostaticsCoulombInput) -> ElectrostaticsCoulombOutput:
        q1_c = params.charge_q1_uc * 1e-6
        q2_c = params.charge_q2_uc * 1e-6
        r_m = params.separation_distance_cm / 100.0
        er = params.relative_permittivity_er

        # Coulomb Constant ke = 8.9875e9 N*m^2/C^2
        ke = 8.9875e9 / er

        # Coulomb Force F = ke * |q1 * q2| / r^2 (N)
        f_n = (ke * abs(q1_c * q2_c)) / (r_m ** 2) if r_m > 0 else 0.0

        is_attr = (q1_c * q2_c) < 0
        force_type = "ATTRACTIVE FORCE" if is_attr else "REPULSIVE FORCE"

        # Midpoint r_mid = r_m / 2
        r_mid = r_m / 2.0
        # Electric field E_mid = ke * q1 / r_mid^2 - ke * q2 / r_mid^2
        e_mid = (ke * (q1_c - q2_c)) / (r_mid ** 2) if r_mid > 0 else 0.0

        # Potential V_mid = ke * (q1 + q2) / r_mid
        v_mid = ke * (q1_c + q2_c) / r_mid if r_mid > 0 else 0.0

        # Parallel plate capacitance C = e0 * er * Area / d (for 0.01 m^2 plate)
        e0 = 8.854e-12
        cap_pf = (e0 * er * 0.01 / r_m) * 1e12 if r_m > 0 else 0.0

        note = (
            f"Coulomb Electrostatics (q1 = {params.charge_q1_uc:+.1f} µC, q2 = {params.charge_q2_uc:+.1f} µC, r = {params.separation_distance_cm:.1f} cm): "
            f"Electrostatic Force F = {f_n:.2f} N ({force_type}) | "
            f"Midpoint Electric Field E = {e_mid/1e3:.1f} kV/m | Midpoint Potential V = {v_mid/1e3:.1f} kV | "
            f"Capacitance C = {cap_pf:.1f} pF."
        )

        return ElectrostaticsCoulombOutput(
            coulomb_force_n=float(f_n),
            is_attractive=is_attr,
            electric_field_at_midpoint_v_m=float(e_mid),
            electric_potential_midpoint_v=float(v_mid),
            parallel_plate_capacitance_pf=float(cap_pf),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "opposite_charges_attract": {
                "name": "Opposite Charges Attraction (+10µC & -5µC @ 10cm)",
                "params": {"charge_q1_uc": 10.0, "charge_q2_uc": -5.0, "separation_distance_cm": 10.0, "relative_permittivity_er": 1.0}
            },
            "same_charges_repel": {
                "name": "Like Charges Repulsion (+20µC & +20µC @ 15cm)",
                "params": {"charge_q1_uc": 20.0, "charge_q2_uc": 20.0, "separation_distance_cm": 15.0, "relative_permittivity_er": 1.0}
            }
        }
