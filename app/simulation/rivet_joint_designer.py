"""
Rivet Joint Designer — Interactive pitch, margin & multi-row layout optimizer
============================================================================
Computes a code-derived rivet pitch, edge margin, required rivet count and the
resulting joint efficiency for a multi-row riveted lap/butt joint using the
same failure-mode model as the RivetedJointsEngine.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RivetJointDesignerInput(BaseModel):
    joint_type: Literal["lap_single", "lap_double", "butt_single_strap", "butt_double_strap"] = Field(
        default="lap_double", description="Joint configuration"
    )
    plate_thickness_mm: float = Field(default=12.0, ge=2.0, le=50.0)
    rivet_diameter_mm: float = Field(default=22.0, ge=5.0, le=50.0)
    plate_width_mm: float = Field(default=200.0, ge=40.0, le=1000.0)
    applied_force_kn: float = Field(default=300.0, ge=1.0, le=5000.0)
    num_rows: int = Field(default=2, ge=1, le=4, description="Number of rivet rows")
    permissible_tensile_mpa: float = Field(default=120.0, ge=50.0, le=300.0)
    permissible_shear_mpa: float = Field(default=95.0, ge=40.0, le=250.0)
    permissible_crushing_mpa: float = Field(default=160.0, ge=80.0, le=400.0)
    safety_factor: float = Field(default=2.0, ge=1.0, le=6.0)


class RivetJointDesignerOutput(BaseModel):
    recommended_pitch_mm: float
    recommended_margin_mm: float
    rivets_per_row: int
    solid_plate_strength_kn: float
    plate_tearing_strength_kn: float
    rivet_shearing_strength_kn: float
    rivet_crushing_strength_kn: float
    joint_efficiency_pct: float
    governing_mode: str
    status_note: str
    telemetry: Dict[str, Any]


class RivetJointDesignerEngine(BaseSimulationEngine):
    name = "rivet-joint-designer"

    def calculate(self, params: RivetJointDesignerInput) -> RivetJointDesignerOutput:
        t = params.plate_thickness_mm
        d = params.rivet_diameter_mm
        b = params.plate_width_mm
        p_force = params.applied_force_kn * 1000.0  # N

        # Code-based layout rules of thumb
        pitch = 3.0 * d
        margin = 1.5 * d

        n_rows = params.num_rows
        # Double strap / butt double gives two shear planes & two rivets per pitch
        shear_planes = 2 if "double" in params.joint_type or "butt" in params.joint_type else 1
        rivets_per_pitch = n_rows * shear_planes

        st = params.permissible_tensile_mpa
        tau = params.permissible_shear_mpa
        sc = params.permissible_crushing_mpa

        # Per-pitch strengths (N)
        p_solid = (pitch * t * st)
        p_tear = ((pitch - d) * t * st)
        p_shear = rivets_per_pitch * (math.pi / 4.0) * (d ** 2) * tau
        p_crush = rivets_per_pitch * d * t * sc

        p_joint = min(p_tear, p_shear, p_crush)
        eff = (p_joint / p_solid) * 100.0

        if p_joint == p_tear:
            mode = "Plate Tearing"
        elif p_joint == p_shear:
            mode = "Rivet Shearing"
        else:
            mode = "Rivet Crushing"

        # Required rivets to carry the applied load at the chosen safety factor
        allowable_joint_n = p_joint / params.safety_factor
        required_rows = max(1, math.ceil(p_force / (allowable_joint_n / shear_planes)) ) if shear_planes else 1
        rivets_per_row = math.ceil(required_rows / n_rows)

        note = (
            f"{params.joint_type.replace('_', ' ').title()} joint (t={t:.0f}mm, d={d:.0f}mm, "
            f"{n_rows} row(s)): Recommended pitch p={pitch:.0f}mm, margin m={margin:.0f}mm. "
            f"Joint efficiency η={eff:.1f}% (governing: {mode}). "
            f"At SF={params.safety_factor:.1f}, use ≥{rivets_per_row} rivets/row over plate width {b:.0f}mm."
        )

        return RivetJointDesignerOutput(
            recommended_pitch_mm=round(pitch, 1),
            recommended_margin_mm=round(margin, 1),
            rivets_per_row=rivets_per_row,
            solid_plate_strength_kn=round(p_solid / 1000.0, 2),
            plate_tearing_strength_kn=round(p_tear / 1000.0, 2),
            rivet_shearing_strength_kn=round(p_shear / 1000.0, 2),
            rivet_crushing_strength_kn=round(p_crush / 1000.0, 2),
            joint_efficiency_pct=round(eff, 2),
            governing_mode=mode,
            status_note=note,
            telemetry={
                "pitch_mm": pitch,
                "margin_mm": margin,
                "efficiency": eff,
                "mode": mode,
                "rivets_per_row": rivets_per_row,
            },
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "lap_double_standard": {
                "name": "Double-row lap joint (12 mm plate, 22 mm rivets)",
                "params": {
                    "joint_type": "lap_double",
                    "plate_thickness_mm": 12.0,
                    "rivet_diameter_mm": 22.0,
                    "plate_width_mm": 200.0,
                    "applied_force_kn": 300.0,
                    "num_rows": 2,
                },
            },
            "butt_double_boiler": {
                "name": "Butt double-strap boiler joint",
                "params": {
                    "joint_type": "butt_double_strap",
                    "plate_thickness_mm": 14.0,
                    "rivet_diameter_mm": 25.0,
                    "plate_width_mm": 250.0,
                    "applied_force_kn": 500.0,
                    "num_rows": 2,
                },
            },
        }
