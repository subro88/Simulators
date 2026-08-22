"""
Steel Welded Connection Capacity (IS 800) Physics Engine
========================================================
Calculates fillet weld throat thickness tt, weld design shear strength fwd,
and total allowable tension/shear load capacity P.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SteelWeldedConnectionInput(BaseModel):
    weld_type: Literal["fillet_weld", "butt_weld_full_penetration"] = Field(default="fillet_weld", description="Weld joint structural classification")
    weld_leg_size_mm: float = Field(default=8.0, ge=3.0, le=25.0, description="Fillet weld size s in mm")
    effective_weld_length_mm: float = Field(default=200.0, ge=20.0, le=2000.0, description="Total weld seam length L in mm")
    steel_grade_fu_mpa: float = Field(default=410.0, ge=300.0, le=600.0, description="Parent steel ultimate tensile strength fu in MPa")


class SteelWeldedConnectionOutput(BaseModel):
    weld_type: str
    throat_thickness_mm: float
    weld_shear_strength_fwd_mpa: float
    total_weld_capacity_kn: float
    status_note: str


class SteelWeldedConnectionEngine(BaseSimulationEngine):
    name = "steel-welded-connection"
    description = "IS 800 Structural Steel Welded Joint: Fillet throat size tt, design strength fwd, and connection load capacity"

    def calculate(self, params: SteelWeldedConnectionInput) -> SteelWeldedConnectionOutput:
        s = params.weld_leg_size_mm
        l = params.effective_weld_length_mm
        fu = params.steel_grade_fu_mpa

        if params.weld_type == "butt_weld_full_penetration":
            tt = s  # Full throat
            # fwd = fu / 1.25
            fwd = fu / 1.25
            type_title = "Full Penetration Butt Weld"
        else:
            # Fillet weld tt = 0.7 * s
            tt = 0.7 * s
            # fwd = (fu / sqrt(3)) / 1.25
            fwd = (fu / math.sqrt(3.0)) / 1.25
            type_title = f"Fillet Weld (Leg Size = {s:.0f}mm)"

        # Capacity P = tt * L * fwd (kN)
        p_cap_kn = (tt * l * fwd) / 1000.0

        note = (
            f"IS 800 Welded Connection ({type_title}, L = {l:.0f} mm): Throat Thickness tt = {tt:.2f} mm | "
            f"Design Shear Strength fwd = {fwd:.1f} MPa | Total Joint Load Capacity P = {p_cap_kn:.1f} kN."
        )

        return SteelWeldedConnectionOutput(
            weld_type=type_title,
            throat_thickness_mm=float(tt),
            weld_shear_strength_fwd_mpa=float(fwd),
            total_weld_capacity_kn=float(p_cap_kn),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "fillet_weld_8mm": {
                "name": "8mm Fillet Weld (200mm Length, Fe410)",
                "params": {"weld_type": "fillet_weld", "weld_leg_size_mm": 8.0, "effective_weld_length_mm": 200.0, "steel_grade_fu_mpa": 410.0}
            },
            "butt_weld_12mm": {
                "name": "Full Penetration Butt Weld (12mm Plate)",
                "params": {"weld_type": "butt_weld_full_penetration", "weld_leg_size_mm": 12.0, "effective_weld_length_mm": 150.0, "steel_grade_fu_mpa": 410.0}
            }
        }
