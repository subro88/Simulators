"""
Riveted Joints Mechanics Physics Engine
========================================
Calculates tensile plate strength Pt, rivet shear strength Ps, crushing strength Pc,
joint efficiency eta, and primary failure mode (tearing, shearing, crushing).
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RivetedJointsInput(BaseModel):
    joint_type: Literal["lap_single_row", "lap_double_row", "butt_double_strap"] = Field(
        default="lap_single_row",
        description="Riveted joint configuration"
    )
    plate_thickness_mm: float = Field(default=10.0, ge=2.0, le=50.0, description="Plate thickness t in mm")
    rivet_diameter_mm: float = Field(default=20.0, ge=6.0, le=40.0, description="Rivet hole diameter d in mm")
    pitch_distance_mm: float = Field(default=60.0, ge=20.0, le=200.0, description="Pitch distance p between rivets in mm")
    allowable_tensile_mpa: float = Field(default=120.0, ge=30.0, le=400.0, description="Allowable tensile stress sigma_t of plate in MPa")
    allowable_shear_mpa: float = Field(default=90.0, ge=20.0, le=300.0, description="Allowable shear stress tau of rivet in MPa")
    allowable_crushing_mpa: float = Field(default=160.0, ge=40.0, le=500.0, description="Allowable crushing stress sigma_c in MPa")


class RivetedJointsOutput(BaseModel):
    plate_tearing_strength_kn: float
    rivet_shear_strength_kn: float
    rivet_crushing_strength_kn: float
    solid_plate_strength_kn: float
    joint_efficiency_pct: float
    primary_failure_mode: str
    status_note: str


class RivetedJointsEngine(BaseSimulationEngine):
    name = "riveted-joints"
    description = "Riveted joint failure analysis: plate tearing Pt, rivet shearing Ps, crushing Pc, and joint efficiency"

    def calculate(self, params: RivetedJointsInput) -> RivetedJointsOutput:
        t = params.plate_thickness_mm
        d = params.rivet_diameter_mm
        p = params.pitch_distance_mm
        sig_t = params.allowable_tensile_mpa
        tau = params.allowable_shear_mpa
        sig_c = params.allowable_crushing_mpa

        if params.joint_type == "lap_single_row":
            n_rivets = 1.0
            shear_factor = 1.0  # single shear
            type_title = "Single-Riveted Lap Joint"
        elif params.joint_type == "lap_double_row":
            n_rivets = 2.0
            shear_factor = 1.0  # single shear
            type_title = "Double-Riveted Lap Joint"
        else: # butt_double_strap
            n_rivets = 2.0
            shear_factor = 1.875  # double shear IS code
            type_title = "Double-Strap Butt Joint"

        # Tearing strength Pt = (p - d) * t * sigma_t
        p_t_n = (p - d) * t * sig_t if p > d else 0.0
        p_t_kn = p_t_n / 1000.0

        # Shearing strength Ps = n * shear_factor * (pi * d^2 / 4) * tau
        p_s_n = n_rivets * shear_factor * ((math.pi * (d ** 2)) / 4.0) * tau
        p_s_kn = p_s_n / 1000.0

        # Crushing strength Pc = n * d * t * sigma_c
        p_c_n = n_rivets * d * t * sig_c
        p_c_kn = p_c_n / 1000.0

        # Solid plate strength P = p * t * sigma_t
        p_solid_n = p * t * sig_t
        p_solid_kn = p_solid_n / 1000.0

        # Min joint capacity
        min_capacity_n = min(p_t_n, p_s_n, p_c_n)
        efficiency_pct = (min_capacity_n / p_solid_n) * 100.0 if p_solid_n > 0 else 0.0

        if min_capacity_n == p_t_n:
            failure_mode = "Plate Tearing (Tension)"
        elif min_capacity_n == p_s_n:
            failure_mode = "Rivet Shearing"
        else:
            failure_mode = "Rivet Crushing (Bearing)"

        note = (
            f"{type_title}: Efficiency η = {efficiency_pct:.1f}% | "
            f"Tearing Pt = {p_t_kn:.1f} kN, Shearing Ps = {p_s_kn:.1f} kN, Crushing Pc = {p_c_kn:.1f} kN (Governed by {failure_mode})."
        )

        return RivetedJointsOutput(
            plate_tearing_strength_kn=float(p_t_kn),
            rivet_shear_strength_kn=float(p_s_kn),
            rivet_crushing_strength_kn=float(p_c_kn),
            solid_plate_strength_kn=float(p_solid_kn),
            joint_efficiency_pct=float(efficiency_pct),
            primary_failure_mode=failure_mode,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "boiler_shell_butt": {
                "name": "Steam Boiler Longitudinal Butt Joint",
                "params": {"joint_type": "butt_double_strap", "plate_thickness_mm": 12.0, "rivet_diameter_mm": 22.0, "pitch_distance_mm": 70.0, "allowable_tensile_mpa": 110.0, "allowable_shear_mpa": 85.0}
            },
            "tank_lap_joint": {
                "name": "Storage Tank Double Lap Joint",
                "params": {"joint_type": "lap_double_row", "plate_thickness_mm": 8.0, "rivet_diameter_mm": 18.0, "pitch_distance_mm": 55.0, "allowable_tensile_mpa": 120.0, "allowable_shear_mpa": 90.0}
            }
        }
