"""
Concrete Mix Design (IS 10262) Physics Engine
=============================================
Calculates target mean strength fck', water-cement ratio w/c, cement content,
and aggregate proportions for structural concrete.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ConcreteMixDesignInput(BaseModel):
    grade_of_concrete: Literal["M20", "M25", "M30", "M35", "M40"] = Field(default="M30", description="Characteristic concrete grade fck")
    exposure_condition: Literal["mild", "moderate", "severe"] = Field(default="moderate", description="Environmental exposure class")
    aggregate_max_size_mm: float = Field(default=20.0, ge=10.0, le=40.0, description="Nominal maximum aggregate size in mm")
    slump_mm: float = Field(default=75.0, ge=25.0, le=175.0, description="Workability slump in mm")


class ConcreteMixDesignOutput(BaseModel):
    grade_of_concrete: str
    target_mean_strength_mpa: float
    water_cement_ratio: float
    cement_content_kg_m3: float
    water_content_l_m3: float
    coarse_aggregate_kg_m3: float
    fine_aggregate_kg_m3: float
    status_note: str


class ConcreteMixDesignEngine(BaseSimulationEngine):
    name = "concrete-mix-design"
    description = "IS 10262 Concrete Mix Design: target strength fck', water-cement ratio w/c, cement & aggregate proportions"

    def calculate(self, params: ConcreteMixDesignInput) -> ConcreteMixDesignOutput:
        grade = params.grade_of_concrete
        fck_val = float(grade.replace("M", ""))

        # Standard deviation s from IS 456
        if fck_val <= 25.0:
            s_std = 4.0
        elif fck_val <= 35.0:
            s_std = 5.0
        else:
            s_std = 5.0

        # Target Mean Strength fck' = fck + 1.65 * s (MPa)
        fck_prime = fck_val + 1.65 * s_std

        # Water-Cement ratio w/c selection based on grade
        if fck_val == 20.0: wc = 0.50
        elif fck_val == 25.0: wc = 0.45
        elif fck_val == 30.0: wc = 0.42
        elif fck_val == 35.0: wc = 0.40
        else: wc = 0.38

        # Base water content for 20mm aggregate = 186 L/m^3 (adjusted for slump)
        water_l = 186.0 + (params.slump_mm - 50.0) / 25.0 * 6.0

        # Cement Content = Water / (w/c) (kg/m^3)
        cement_kg = water_l / wc

        # Aggregate proportions per m^3 concrete (2400 kg/m^3 total wet density)
        remaining_mass = 2400.0 - (water_l + cement_kg)
        coarse_kg = remaining_mass * 0.62
        fine_kg = remaining_mass * 0.38

        note = (
            f"IS 10262 Mix Design ({grade}): Target Strength fck' = {fck_prime:.1f} MPa | "
            f"Water-Cement Ratio w/c = {wc:.2f} | Cement = {cement_kg:.0f} kg/m³ | "
            f"Water = {water_l:.0f} L/m³ | Coarse Agg = {coarse_kg:.0f} kg, Fine Agg = {fine_kg:.0f} kg."
        )

        return ConcreteMixDesignOutput(
            grade_of_concrete=grade,
            target_mean_strength_mpa=float(fck_prime),
            water_cement_ratio=float(wc),
            cement_content_kg_m3=float(cement_kg),
            water_content_l_m3=float(water_l),
            coarse_aggregate_kg_m3=float(coarse_kg),
            fine_aggregate_kg_m3=float(fine_kg),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "m30_structural_rc": {
                "name": "M30 Grade Structural Concrete Mix (75mm Slump)",
                "params": {"grade_of_concrete": "M30", "exposure_condition": "moderate", "aggregate_max_size_mm": 20.0, "slump_mm": 75.0}
            },
            "m40_high_strength": {
                "name": "M40 Grade High-Strength Prestressed Concrete",
                "params": {"grade_of_concrete": "M40", "exposure_condition": "severe", "aggregate_max_size_mm": 20.0, "slump_mm": 100.0}
            }
        }
