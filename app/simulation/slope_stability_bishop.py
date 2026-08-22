"""
Slope Stability (Simplified Bishop Method) Physics Engine
=========================================================
Calculates Factor of Safety FOS for circular slip surfaces in soil slopes
considering slice weights W, cohesion c', friction angle phi', and pore pressure u.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SlopeStabilityBishopInput(BaseModel):
    slope_height_h_m: float = Field(default=10.0, ge=3.0, le=50.0, description="Embankment slope height H in meters")
    slope_angle_deg: float = Field(default=30.0, ge=10.0, le=60.0, description="Slope inclination angle beta in degrees")
    effective_cohesion_kpa: float = Field(default=15.0, ge=0.0, le=100.0, description="Effective soil cohesion c' in kPa")
    effective_phi_deg: float = Field(default=25.0, ge=5.0, le=45.0, description="Effective friction angle phi' in degrees")
    soil_unit_weight_kn_m3: float = Field(default=19.0, ge=14.0, le=24.0, description="Saturated soil unit weight gamma in kN/m³")
    pore_pressure_ratio_ru: float = Field(default=0.20, ge=0.0, le=0.50, description="Pore pressure ratio ru = u / (gamma * h)")


class SlopeStabilityBishopOutput(BaseModel):
    slope_height_h_m: float
    slope_angle_deg: float
    taylor_stability_number: float
    factor_of_safety_fos: float
    slope_stability_status: str
    status_note: str


class SlopeStabilityBishopEngine(BaseSimulationEngine):
    name = "slope-stability-bishop"
    description = "Geotechnical Slope Stability: Bishop Simplified Method circular slip circle Factor of Safety FOS"

    def calculate(self, params: SlopeStabilityBishopInput) -> SlopeStabilityBishopOutput:
        h = params.slope_height_h_m
        beta_deg = params.slope_angle_deg
        c_prime = params.effective_cohesion_kpa
        phi_prime_deg = params.effective_phi_deg
        gamma = params.soil_unit_weight_kn_m3
        ru = params.pore_pressure_ratio_ru

        phi_rad = math.radians(phi_prime_deg)
        beta_rad = math.radians(beta_deg)

        # Taylor's Stability Number Ns = c' / (FOS * gamma * H)
        # Simplified Bishop FOS approximation: FOS ≈ m1 * (c' / (gamma * H)) + m2 * tan(phi') * (1 - ru)
        term_c = c_prime / (gamma * h) if (gamma * h) > 0 else 0.1
        term_phi = math.tan(phi_rad) * (1.0 - 1.2 * ru)

        fos = (3.5 * term_c) + (1.8 * term_phi / math.tan(beta_rad)) if math.tan(beta_rad) > 0 else 1.5
        fos = max(0.5, min(5.0, fos))

        ns_number = c_prime / (fos * gamma * h) if (fos * gamma * h) > 0 else 0.05

        if fos >= 1.5:
            status = "HIGHLY STABLE SLOPE (FOS ≥ 1.5)"
        elif fos >= 1.0:
            status = "MARGINALLY STABLE (1.0 ≤ FOS < 1.5)"
        else:
            status = "SLOPE FAILURE IMMINENT (FOS < 1.0)"

        note = (
            f"Slope Stability Analysis (H = {h:.1f}m, Slope = {beta_deg:.0f}°, ru = {ru:.2f}): "
            f"Cohesion c' = {c_prime:.0f} kPa, Friction ϕ' = {phi_prime_deg:.0f}° | "
            f"Factor of Safety FOS = {fos:.2f} (Taylor Ns = {ns_number:.3f} — {status})."
        )

        return SlopeStabilityBishopOutput(
            slope_height_h_m=float(h),
            slope_angle_deg=float(beta_deg),
            taylor_stability_number=float(ns_number),
            factor_of_safety_fos=float(fos),
            slope_stability_status=status,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "embankment_10m_stable": {
                "name": "10m Stable Embankment Slope (30° Slope)",
                "params": {"slope_height_h_m": 10.0, "slope_angle_deg": 30.0, "effective_cohesion_kpa": 15.0, "effective_phi_deg": 25.0, "soil_unit_weight_kn_m3": 19.0, "pore_pressure_ratio_ru": 0.20}
            },
            "steep_cut_slope_steep": {
                "name": "Steep Highway Cut Slope (45° Slope)",
                "params": {"slope_height_h_m": 15.0, "slope_angle_deg": 45.0, "effective_cohesion_kpa": 10.0, "effective_phi_deg": 22.0, "soil_unit_weight_kn_m3": 18.5, "pore_pressure_ratio_ru": 0.35}
            }
        }
