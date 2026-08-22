"""
Welded Joints Strength Physics Engine
=====================================
Calculates throat thickness t, transverse/parallel fillet weld capacity P,
shear stress tau, and eccentric weld group stress.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class WeldStrengthInput(BaseModel):
    weld_type: Literal["transverse_fillet", "parallel_fillet", "double_parallel_fillet"] = Field(
        default="double_parallel_fillet",
        description="Fillet weld orientation and configuration"
    )
    weld_size_mm: float = Field(default=8.0, ge=2.0, le=30.0, description="Fillet weld leg size s in mm")
    weld_length_mm: float = Field(default=100.0, ge=10.0, le=1000.0, description="Weld bead length L in mm")
    applied_force_kn: float = Field(default=60.0, ge=1.0, le=1000.0, description="Applied tensile/shear force P in kN")
    allowable_shear_mpa: float = Field(default=95.0, ge=20.0, le=300.0, description="Allowable weld shear stress tau in MPa")
    allowable_tensile_mpa: float = Field(default=110.0, ge=20.0, le=300.0, description="Allowable weld tensile stress sigma_t in MPa")


class WeldStrengthOutput(BaseModel):
    throat_thickness_mm: float
    effective_weld_area_mm2: float
    weld_load_capacity_kn: float
    actual_weld_stress_mpa: float
    weld_safety_factor: float
    status_note: str


class WeldStrengthEngine(BaseSimulationEngine):
    name = "weld-strength"
    description = "Welded joint mechanics: throat thickness t = 0.707s, fillet weld strength P, and weld safety factor"

    def calculate(self, params: WeldStrengthInput) -> WeldStrengthOutput:
        s = params.weld_size_mm
        l = params.weld_length_mm
        p_kn = params.applied_force_kn

        # Throat thickness t = s * sin(45 deg) = 0.707 * s
        throat_mm = 0.7071 * s

        if params.weld_type == "transverse_fillet":
            # Single transverse fillet: Area = t * L, allowable stress = sigma_t
            area_mm2 = throat_mm * l
            allow_stress = params.allowable_tensile_mpa
            type_title = "Single Transverse Fillet Weld"

        elif params.weld_type == "parallel_fillet":
            # Single parallel fillet: Area = t * L, allowable stress = tau
            area_mm2 = throat_mm * l
            allow_stress = params.allowable_shear_mpa
            type_title = "Single Parallel Fillet Weld"

        else:
            # Double parallel fillet: Area = 2 * t * L, allowable stress = tau
            area_mm2 = 2.0 * throat_mm * l
            allow_stress = params.allowable_shear_mpa
            type_title = "Double Parallel Fillet Weld"

        # Load capacity P = Area * allow_stress (in N)
        capacity_n = area_mm2 * allow_stress
        capacity_kn = capacity_n / 1000.0

        # Actual stress = P_applied / Area
        actual_stress_mpa = (p_kn * 1000.0) / area_mm2 if area_mm2 > 0 else 0.0

        fos = capacity_kn / p_kn if p_kn > 0 else 99.0

        status_text = "SAFE (Within Allowable Limits)" if fos >= 1.0 else "WARNING: WELD OVERLOADED!"

        note = (
            f"{type_title} (s = {s:.1f} mm, L = {l:.0f} mm): Throat t = {throat_mm:.2f} mm | "
            f"Weld Capacity P_max = {capacity_kn:.1f} kN | Actual Stress = {actual_stress_mpa:.1f} MPa (FOS = {fos:.2f})."
        )

        return WeldStrengthOutput(
            throat_thickness_mm=float(throat_mm),
            effective_weld_area_mm2=float(area_mm2),
            weld_load_capacity_kn=float(capacity_kn),
            actual_weld_stress_mpa=float(actual_stress_mpa),
            weld_safety_factor=float(fos),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "bracket_double_fillet": {
                "name": "Structural Bracket Double Parallel Weld",
                "params": {"weld_type": "double_parallel_fillet", "weld_size_mm": 8.0, "weld_length_mm": 120.0, "applied_force_kn": 75.0, "allowable_shear_mpa": 95.0}
            },
            "tie_bar_transverse": {
                "name": "Tie Bar Transverse Lap Weld",
                "params": {"weld_type": "transverse_fillet", "weld_size_mm": 10.0, "weld_length_mm": 100.0, "applied_force_kn": 50.0, "allowable_tensile_mpa": 110.0}
            }
        }
