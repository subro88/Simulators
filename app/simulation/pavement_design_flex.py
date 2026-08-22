"""
Flexible Pavement Design (AASHTO / IRC 37) Physics Engine
=========================================================
Calculates Equivalent Single Axle Loads ESAL, Structural Number SN,
asphalt/subbase layer thicknesses D1, D2, D3, and CBR design thickness.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PavementDesignFlexInput(BaseModel):
    initial_daily_commercial_vehicles: float = Field(default=1500.0, ge=100.0, le=50000.0, description="Initial daily commercial vehicles A")
    design_life_years: float = Field(default=15.0, ge=5.0, le=30.0, description="Highway design life n in years")
    traffic_growth_rate_pct: float = Field(default=7.5, ge=1.0, le=15.0, description="Annual traffic growth rate r in %")
    subgrade_cbr_pct: float = Field(default=6.0, ge=1.0, le=30.0, description="Subgrade California Bearing Ratio CBR in %")


class PavementDesignFlexOutput(BaseModel):
    cumulative_esal_msa: float
    required_pavement_thickness_mm: float
    asphalt_wearing_course_mm: float
    granular_base_course_mm: float
    granular_subbase_course_mm: float
    status_note: str


class PavementDesignFlexEngine(BaseSimulationEngine):
    name = "pavement-design-flex"
    description = "IRC 37 / AASHTO Flexible Highway Pavement: cumulative MSA traffic ESAL, CBR subgrade thickness, and pavement layers"

    def calculate(self, params: PavementDesignFlexInput) -> PavementDesignFlexOutput:
        a_veh = params.initial_daily_commercial_vehicles
        n_years = params.design_life_years
        r_pct = params.traffic_growth_rate_pct
        cbr = params.subgrade_cbr_pct

        r_frac = r_pct / 100.0
        vdf = 3.5  # Vehicle Damage Factor for heavy trucks

        # Cumulative ESAL (Million Standard Axles MSA)
        # N_msa = 365 * [ (1 + r)^n - 1 ] / r * A * VDF * LDF / 10^6
        growth_factor = ((1.0 + r_frac) ** n_years - 1.0) / r_frac if r_frac > 0 else n_years
        n_msa = (365.0 * a_veh * growth_factor * vdf * 0.75) / 1e6

        # Required Pavement Thickness T (mm) per IRC 37 CBR curve: T ≈ 585 * (N_msa)^0.12 * (CBR)^-0.2
        t_total_mm = 585.0 * math.pow(max(0.1, n_msa), 0.12) * math.pow(cbr, -0.2)

        # Layer distribution: BC/DBM Asphalt (30%), Granular Base WMM (35%), Subbase GSB (35%)
        t_asphalt = max(40.0, t_total_mm * 0.30)
        t_base = max(150.0, t_total_mm * 0.35)
        t_subbase = max(150.0, t_total_mm * 0.35)

        note = (
            f"IRC 37 Flexible Pavement Design (CBR = {cbr:.1f}%, {n_years:.0f}-Year Design Life): "
            f"Cumulative Traffic = {n_msa:.1f} MSA | Total Required Thickness T = {t_total_mm:.0f} mm | "
            f"Layers: Asphalt = {t_asphalt:.0f}mm, WMM Base = {t_base:.0f}mm, GSB Subbase = {t_subbase:.0f}mm."
        )

        return PavementDesignFlexOutput(
            cumulative_esal_msa=float(n_msa),
            required_pavement_thickness_mm=float(t_total_mm),
            asphalt_wearing_course_mm=float(t_asphalt),
            granular_base_course_mm=float(t_base),
            granular_subbase_course_mm=float(t_subbase),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "four_lane_national_highway": {
                "name": "4-Lane National Highway (1500 Vehicles/Day, CBR 6%)",
                "params": {"initial_daily_commercial_vehicles": 1500.0, "design_life_years": 15.0, "traffic_growth_rate_pct": 7.5, "subgrade_cbr_pct": 6.0}
            },
            "heavy_industrial_corridor": {
                "name": "Heavy Industrial Corridor (5000 Vehicles/Day, CBR 4%)",
                "params": {"initial_daily_commercial_vehicles": 5000.0, "design_life_years": 20.0, "traffic_growth_rate_pct": 8.0, "subgrade_cbr_pct": 4.0}
            }
        }
