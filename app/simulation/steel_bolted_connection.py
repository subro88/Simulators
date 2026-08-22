"""
Steel Bolted Connection Capacity (IS 800) Physics Engine
========================================================
Calculates bolt shear strength Vnsb, bearing strength Vnpb,
net plate tension strength Tdn, and joint efficiency.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SteelBoltedConnectionInput(BaseModel):
    joint_type: Literal["lap_joint_single_shear", "double_cover_butt_joint"] = Field(default="lap_joint_single_shear", description="Connection joint layout")
    bolt_grade: Literal["4.6", "8.8", "10.9"] = Field(default="4.6", description="Structural bolt grade rating")
    bolt_diameter_mm: float = Field(default=20.0, ge=12.0, le=36.0, description="Nominal bolt shank diameter d in mm")
    num_bolts: int = Field(default=4, ge=1, le=20, description="Total number of bolts in connection")
    plate_thickness_mm: float = Field(default=10.0, ge=4.0, le=40.0, description="Thinnest connected plate thickness t in mm")


class SteelBoltedConnectionOutput(BaseModel):
    bolt_grade: str
    shear_capacity_per_bolt_kn: float
    bearing_capacity_per_bolt_kn: float
    governing_bolt_value_kn: float
    total_connection_capacity_kn: float
    status_note: str


class SteelBoltedConnectionEngine(BaseSimulationEngine):
    name = "steel-bolted-connection"
    description = "IS 800 Steel Design: Bolted Lap/Butt Joint shear capacity, bearing capacity, and connection bolt value"

    def calculate(self, params: SteelBoltedConnectionInput) -> SteelBoltedConnectionOutput:
        d = params.bolt_diameter_mm
        n_bolts = params.num_bolts
        t_plate = params.plate_thickness_mm

        if params.bolt_grade == "8.8":
            f_ub = 800.0
            grade_title = "Grade 8.8 High Strength Bolt"
        elif params.bolt_grade == "10.9":
            f_ub = 1000.0
            grade_title = "Grade 10.9 Heavy Duty Bolt"
        else: # 4.6
            f_ub = 400.0
            grade_title = "Grade 4.6 Ordinary Commercial Bolt"

        # Shank Area Anb = pi/4 * d^2, Thread Area Anb_net ≈ 0.78 * Anb
        a_sb = (math.pi / 4.0) * (d ** 2)
        a_nb = 0.78 * a_sb

        # Number of shear planes n_s, n_n
        if params.joint_type == "double_cover_butt_joint":
            n_shear_planes = 2.0
            type_title = "Double Cover Butt Joint (Double Shear)"
        else:
            n_shear_planes = 1.0
            type_title = "Lap Joint (Single Shear)"

        # Nominal Shear Strength Vnsb = (f_ub / sqrt(3)) * (n_s * A_sb + n_n * A_nb) / 1.25 (kN)
        v_sb_kn = ((f_ub / math.sqrt(3.0)) * (n_shear_planes * a_nb) / 1.25) / 1000.0

        # Nominal Bearing Strength Vnpb = 2.5 * kb * d * t * f_u / 1.25 (kN) where kb ≈ 0.5
        kb = 0.5
        f_u_plate = 410.0  # Fe 410 steel
        v_pb_kn = (2.5 * kb * d * t_plate * f_u_plate / 1.25) / 1000.0

        # Bolt Value V_bolt = min(V_sb, V_pb)
        v_bolt_value_kn = min(v_sb_kn, v_pb_kn)

        # Total Connection Capacity P = n_bolts * V_bolt
        total_capacity_kn = n_bolts * v_bolt_value_kn

        note = (
            f"IS 800 Bolted Connection ({grade_title}, d = {d:.0f} mm, {n_bolts} Bolts, {type_title}): "
            f"Bolt Shear Capacity = {v_sb_kn:.1f} kN | Bearing Capacity = {v_pb_kn:.1f} kN | "
            f"Governing Bolt Value = {v_bolt_value_kn:.1f} kN -> Total Joint Capacity = {total_capacity_kn:.1f} kN."
        )

        return SteelBoltedConnectionOutput(
            bolt_grade=grade_title,
            shear_capacity_per_bolt_kn=float(v_sb_kn),
            bearing_capacity_per_bolt_kn=float(v_pb_kn),
            governing_bolt_value_kn=float(v_bolt_value_kn),
            total_connection_capacity_kn=float(total_capacity_kn),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "lap_joint_4_bolts_m20": {
                "name": "Lap Joint with 4 M20 Grade 4.6 Bolts (10mm Plate)",
                "params": {"joint_type": "lap_joint_single_shear", "bolt_grade": "4.6", "bolt_diameter_mm": 20.0, "num_bolts": 4, "plate_thickness_mm": 10.0}
            },
            "butt_joint_6_bolts_m24_88": {
                "name": "Double Cover Butt Joint with 6 M24 Grade 8.8 Bolts",
                "params": {"joint_type": "double_cover_butt_joint", "bolt_grade": "8.8", "bolt_diameter_mm": 24.0, "num_bolts": 6, "plate_thickness_mm": 12.0}
            }
        }
