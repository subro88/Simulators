"""
One-Dimensional Soil Consolidation Settlement Physics Engine
=============================================================
Calculates Terzaghi 1D consolidation primary settlement Sc,
compression index Cc, initial void ratio e0, and time factor Tv.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ConsolidationSettlementInput(BaseModel):
    clay_layer_thickness_m: float = Field(default=4.0, ge=0.5, le=30.0, description="Clay layer thickness H0 in meters")
    initial_void_ratio_e0: float = Field(default=0.85, ge=0.3, le=2.5, description="Initial void ratio e0")
    compression_index_cc: float = Field(default=0.32, ge=0.05, le=1.0, description="Compression index Cc")
    initial_effective_stress_kpa: float = Field(default=80.0, ge=10.0, le=500.0, description="Initial effective overburden stress sigma0' in kPa")
    building_load_stress_kpa: float = Field(default=50.0, ge=5.0, le=400.0, description="Additional foundation stress Delta_sigma' in kPa")
    cv_coefficient_m2_yr: float = Field(default=2.5, ge=0.1, le=20.0, description="Coefficient of consolidation cv in m²/year")


class ConsolidationSettlementOutput(BaseModel):
    primary_settlement_mm: float
    primary_settlement_cm: float
    time_for_90_pct_settlement_years: float
    final_void_ratio: float
    status_note: str


class ConsolidationSettlementEngine(BaseSimulationEngine):
    name = "consolidation-settlement"
    description = "Terzaghi 1D Primary Consolidation Settlement: Sc = (Cc*H0/(1+e0))*log10((sigma0+Dsigma)/sigma0) and time t90"

    def calculate(self, params: ConsolidationSettlementInput) -> ConsolidationSettlementOutput:
        h0 = params.clay_layer_thickness_m
        e0 = params.initial_void_ratio_e0
        cc = params.compression_index_cc
        sigma0 = params.initial_effective_stress_kpa
        d_sigma = params.building_load_stress_kpa
        cv = params.cv_coefficient_m2_yr

        # Terzaghi 1D Primary Settlement Sc = (Cc * H0 / (1 + e0)) * log10((sigma0 + d_sigma) / sigma0)
        stress_ratio = (sigma0 + d_sigma) / sigma0 if sigma0 > 0 else 1.0
        sc_m = (cc * h0 / (1.0 + e0)) * math.log10(stress_ratio)
        sc_mm = sc_m * 1000.0
        sc_cm = sc_m * 100.0

        # Change in void ratio Delta_e = Cc * log10(stress_ratio)
        delta_e = cc * math.log10(stress_ratio)
        ef = e0 - delta_e

        # Time for 90% consolidation (Tv = 0.848 for U = 90%)
        # Drainage path H_dr = H0 / 2 for double drainage
        hdr = h0 / 2.0
        t90_years = (0.848 * (hdr ** 2)) / cv if cv > 0 else 10.0

        note = (
            f"1D Clay Consolidation Settlement (H0 = {h0:.1f}m, Cc = {cc:.2f}): "
            f"Overburden σ0' = {sigma0:.0f} kPa -> Stress Inc Δσ' = {d_sigma:.0f} kPa | "
            f"Primary Settlement Sc = {sc_mm:.1f} mm ({sc_cm:.1f} cm) | "
            f"Final Void Ratio ef = {ef:.3f} | Time for 90% Settlement t90 = {t90_years:.1f} years."
        )

        return ConsolidationSettlementOutput(
            primary_settlement_mm=float(sc_mm),
            primary_settlement_cm=float(sc_cm),
            time_for_90_pct_settlement_years=float(t90_years),
            final_void_ratio=float(ef),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str,Any]]:
        return {
            "soft_clay_building_settlement": {
                "name": "Soft Clay Layer Settlement (H0 = 4m, Δσ' = 50 kPa)",
                "params": {"clay_layer_thickness_m": 4.0, "initial_void_ratio_e0": 0.85, "compression_index_cc": 0.32, "initial_effective_stress_kpa": 80.0, "building_load_stress_kpa": 50.0, "cv_coefficient_m2_yr": 2.5}
            },
            "heavy_embankment_consolidation": {
                "name": "Heavy Embankment Consolidation (H0 = 8m, Δσ' = 120 kPa)",
                "params": {"clay_layer_thickness_m": 8.0, "initial_void_ratio_e0": 1.10, "compression_index_cc": 0.45, "initial_effective_stress_kpa": 100.0, "building_load_stress_kpa": 120.0, "cv_coefficient_m2_yr": 1.8}
            }
        }
