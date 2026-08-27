"""
WBSCTE 3rd Sem Civil Engineering — Cement Testing Physics Engine
=================================================================
Simulates Vicat Standard Consistency, Initial/Final Setting Times, Fineness (Sieve/Blaine),
Le-Chatelier Soundness, and Mortar Cube Compressive Strength according to IS 4031 & IS 269.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CementTestingInput(BaseModel):
    """Input parameters for Cement Testing Lab."""
    test_type: Literal["consistency", "setting_time", "fineness", "soundness", "compressive_strength"] = Field(
        default="consistency",
        description="Type of cement physical test"
    )
    cement_grade: Literal["opc_33", "opc_43", "opc_53", "ppc"] = Field(
        default="opc_43",
        description="Grade of Portland / Pozzolana Cement"
    )
    water_percentage: float = Field(default=28.5, ge=20.0, le=40.0, description="Water percentage added by weight of cement P%")
    elapsed_time_min: float = Field(default=45.0, ge=0.0, le=720.0, description="Elapsed time in minutes from adding water")
    sieve_residue_g: float = Field(default=4.2, ge=0.0, le=20.0, description="Residue left on 90-micron IS Sieve from 100g sample")
    curing_days: int = Field(default=7, ge=1, le=28, description="Curing period in days for mortar cubes")


class CementTestingOutput(BaseModel):
    """Calculated laboratory results for Cement Testing."""
    test_name: str
    penetration_depth_mm: float
    is_standard_consistency: bool
    initial_setting_time_min: float
    final_setting_time_min: float
    fineness_percentage: float
    soundness_expansion_mm: float
    compressive_strength_mpa: float
    compliance_status: str
    status_note: str


class CementTestingEngine(BaseSimulationEngine):
    """Laboratory test engine for Civil Engineering Cement Physical Testing."""

    name = "cement-testing-lab"
    description = "Vicat consistency, initial/final setting times, 90-micron fineness, Le-Chatelier soundness, IS 4031 strength"

    def calculate(self, params: CementTestingInput) -> CementTestingOutput:
        P = params.water_percentage

        # Standard consistency P% is typically around 26-30%
        # Plunger penetration depth from bottom (target 5 to 7 mm)
        if P < 25.0:
            penetration_mm = 1.0 + (P - 20.0) * 1.2 # shallow penetration
        elif P <= 30.0:
            penetration_mm = 5.0 + (P - 28.0) * 0.8 # target range
        else:
            penetration_mm = 7.0 + (P - 30.0) * 1.5 # deep / bottom touch

        is_standard = 5.0 <= penetration_mm <= 7.0

        # Setting Times (Initial ~ 30-45 min, Final ~ 240-360 min)
        base_init = 35.0 if "opc" in params.cement_grade else 45.0
        init_time = base_init * (P / 28.5)
        final_time = init_time * 6.5

        # Fineness % residue on 90-micron sieve
        fineness_pct = (100.0 - params.sieve_residue_g)

        # Soundness Le-Chatelier expansion
        expansion_mm = 2.5 if "opc" in params.cement_grade else 4.0

        # Compressive strength development (IS 4031 Part 6)
        grade_val = 53.0 if params.cement_grade == "opc_53" else (43.0 if params.cement_grade == "opc_43" else 33.0)
        if params.curing_days == 3:
            strength_mpa = grade_val * 0.50
        elif params.curing_days == 7:
            strength_mpa = grade_val * 0.70
        else: # 28 days
            strength_mpa = grade_val * 1.02

        if params.test_type == "consistency":
            status = "PASSED: Standard Consistency achieved (5-7mm from bottom)." if is_standard else "ADJUST WATER: Target 5-7mm penetration from mold bottom."
            note = f"Vicat Plunger Penetration = {penetration_mm:.1f} mm at {P:.1f}% Water ratio."
            title = "Vicat Standard Consistency Test"
        elif params.test_type == "setting_time":
            is_valid_init = init_time >= 30.0
            status = "PASSED: Initial setting time >= 30 mins (IS 269)." if is_valid_init else "FAILED: Setting time too fast."
            note = f"Initial Setting Time = {init_time:.0f} min | Final Setting Time = {final_time:.0f} min."
            title = "Initial & Final Setting Time Test"
        elif params.test_type == "fineness":
            is_valid_fine = params.sieve_residue_g <= 10.0
            status = "PASSED: Residue <= 10% on 90µm sieve." if is_valid_fine else "FAILED: Excess residue."
            note = f"Fineness = {fineness_pct:.1f}% passing 90µm sieve (Residue: {params.sieve_residue_g:.1f}g)."
            title = "Fineness Sieve Test (IS 4031 Part 1)"
        else:
            status = f"PASSED: {params.curing_days}-Day Mortar Strength meets Grade standard."
            note = f"{params.curing_days}-Day Mortar Cube Strength = {strength_mpa:.1f} MPa ({params.cement_grade.upper()})."
            title = "Mortar Cube Compressive Strength Test"

        return CementTestingOutput(
            test_name=title,
            penetration_depth_mm=float(penetration_mm),
            is_standard_consistency=is_standard,
            initial_setting_time_min=float(init_time),
            final_setting_time_min=float(final_time),
            fineness_percentage=float(fineness_pct),
            soundness_expansion_mm=float(expansion_mm),
            compressive_strength_mpa=float(strength_mpa),
            compliance_status=status,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "vicat_consistency_standard": {
                "name": "Standard Consistency (28.5% Water)",
                "params": {"test_type": "consistency", "cement_grade": "opc_43", "water_percentage": 28.5}
            },
            "mortar_strength_7day": {
                "name": "7-Day Cube Strength (OPC 43)",
                "params": {"test_type": "compressive_strength", "cement_grade": "opc_43", "curing_days": 7}
            }
        }
