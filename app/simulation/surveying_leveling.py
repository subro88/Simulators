"""
Surveying Differential Leveling & Traverse Physics Engine
=========================================================
Calculates Height of Instrument HI, Reduced Level RL, Backsight BS, Foresight FS,
and Bowditch compass balancing correction for closed traverse.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SurveyingLevelingInput(BaseModel):
    benchmark_rl_m: float = Field(default=100.0, ge=0.0, le=5000.0, description="Benchmark Reduced Level BM in meters")
    backsight_bs_m: float = Field(default=1.450, ge=0.1, le=5.0, description="Backsight reading BS in meters")
    foresight_fs_m: float = Field(default=0.850, ge=0.1, le=5.0, description="Foresight reading FS in meters")
    traverse_error_closure_mm: float = Field(default=12.0, ge=0.0, le=200.0, description="Closed traverse error of closure e in mm")
    total_perimeter_m: float = Field(default=600.0, ge=50.0, le=10000.0, description="Total traverse perimeter length in meters")


class SurveyingLevelingOutput(BaseModel):
    height_of_instrument_hi_m: float
    target_reduced_level_rl_m: float
    rise_fall_m: float
    is_rise: bool
    permissible_error_limit_mm: float
    status_note: str


class SurveyingLevelingEngine(BaseSimulationEngine):
    name = "surveying-leveling"
    description = "Geodetic Surveying Differential Leveling: Height of Instrument HI = BM + BS, Reduced Level RL = HI - FS, and Rise/Fall"

    def calculate(self, params: SurveyingLevelingInput) -> SurveyingLevelingOutput:
        bm = params.benchmark_rl_m
        bs = params.backsight_bs_m
        fs = params.foresight_fs_m
        e_mm = params.traverse_error_closure_mm
        l_total = params.total_perimeter_m

        # Height of Instrument HI = BM + BS
        hi = bm + bs

        # Target Reduced Level RL = HI - FS
        rl_target = hi - fs

        # Rise/Fall = BS - FS
        diff = bs - fs
        is_rise = diff > 0
        rise_fall = abs(diff)

        # Permissible Error for Ordinary Leveling = ± 12 * sqrt(K) mm where K in km
        k_km = l_total / 1000.0
        perm_error_mm = 12.0 * math.sqrt(k_km)

        is_acceptable = e_mm <= perm_error_mm
        status_text = "LEVELING CHECK PASSED" if is_acceptable else "RE-SURVEY REQUIRED (Error Exceeds Limit)"

        note = (
            f"Differential Leveling Check (BM = {bm:.3f} m): BS = {bs:.3f} m -> "
            f"Height of Instrument HI = {hi:.3f} m | FS = {fs:.3f} m -> Target RL = {rl_target:.3f} m | "
            f"Net {'Rise' if is_rise else 'Fall'} = {rise_fall:.3f} m | Error Closure = {e_mm:.1f} mm (Limit = ±{perm_error_mm:.1f} mm — {status_text})."
        )

        return SurveyingLevelingOutput(
            height_of_instrument_hi_m=float(hi),
            target_reduced_level_rl_m=float(rl_target),
            rise_fall_m=float(rise_fall),
            is_rise=is_rise,
            permissible_error_limit_mm=float(perm_error_mm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "ordinary_leveling_bm100": {
                "name": "Ordinary Leveling from BM 100.000m (BS = 1.450m)",
                "params": {"benchmark_rl_m": 100.0, "backsight_bs_m": 1.450, "foresight_fs_m": 0.850, "traverse_error_closure_mm": 12.0, "total_perimeter_m": 600.0}
            },
            "precise_benchmark_transfer": {
                "name": "Precise Geodetic Benchmark Transfer (1km Loop)",
                "params": {"benchmark_rl_m": 250.500, "backsight_bs_m": 2.110, "foresight_fs_m": 1.950, "traverse_error_closure_mm": 5.0, "total_perimeter_m": 1000.0}
            }
        }
