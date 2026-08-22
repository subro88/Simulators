"""
Retaining Wall Earth Pressure & Stability Physics Engine
========================================================
Calculates Rankine active Ka and passive Kp pressure, sliding FOS_slide,
overturning FOS_over, and bearing pressure eccentricity e.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RetainingWallStabilityInput(BaseModel):
    wall_height_h_m: float = Field(default=6.0, ge=2.0, le=15.0, description="Retaining wall stem height H in meters")
    base_width_b_m: float = Field(default=3.5, ge=1.0, le=10.0, description="Base slab width B in meters")
    backfill_friction_angle_deg: float = Field(default=32.0, ge=15.0, le=45.0, description="Soil friction angle phi in degrees")
    backfill_unit_weight_kn_m3: float = Field(default=18.0, ge=14.0, le=22.0, description="Backfill unit weight gamma in kN/m³")
    concrete_unit_weight_kn_m3: float = Field(default=24.0, ge=22.0, le=26.0, description="Concrete unit weight gamma_c in kN/m³")


class RetainingWallStabilityOutput(BaseModel):
    rankine_ka: float
    total_active_thrust_kn_m: float
    resisting_moment_knm_m: float
    overturning_moment_knm_m: float
    fos_overturning: float
    fos_sliding: float
    eccentricity_m: float
    status_note: str


class RetainingWallStabilityEngine(BaseSimulationEngine):
    name = "retaining-wall-stability"
    description = "Cantilever Concrete Retaining Wall Stability: Rankine Active pressure Ka, FOS overturning, FOS sliding, and eccentricity e"

    def calculate(self, params: RetainingWallStabilityInput) -> RetainingWallStabilityOutput:
        h = params.wall_height_h_m
        b = params.base_width_b_m
        phi_deg = params.backfill_friction_angle_deg
        gamma = params.backfill_unit_weight_kn_m3
        gamma_c = params.concrete_unit_weight_kn_m3

        phi_rad = math.radians(phi_deg)

        # Rankine Active Earth Pressure Coefficient Ka = (1 - sin(phi)) / (1 + sin(phi))
        ka = (1.0 - math.sin(phi_rad)) / (1.0 + math.sin(phi_rad))

        # Total Active Thrust Pa = 0.5 * Ka * gamma * H^2 (kN/m)
        pa = 0.5 * ka * gamma * (h ** 2)

        # Overturning Moment Mo = Pa * (H / 3) (kN*m/m)
        mo = pa * (h / 3.0)

        # Wall & Soil Dead Weight estimate W_total
        # Stem volume ~ 0.4m * H, Base slab ~ 0.5m * B, Soil heel block ~ (B - 1.0m) * H
        w_concrete = (0.4 * h + 0.5 * b) * gamma_c
        w_soil = (b - 1.0) * h * gamma
        w_total = w_concrete + w_soil

        # Resisting Moment Mr (taking moment about toe)
        mr = (w_concrete * 0.8) + (w_soil * (b - 0.5 * (b - 1.0)))

        # FOS Overturning = Mr / Mo
        fos_over = mr / mo if mo > 0 else 10.0

        # FOS Sliding = (mu * W_total) / Pa (mu ≈ tan(2/3 * phi))
        mu = math.tan((2.0 / 3.0) * phi_rad)
        fos_slide = (mu * w_total) / pa if pa > 0 else 10.0

        # Resultant Eccentricity e = B/2 - (Mr - Mo) / W_total
        x_bar = (mr - mo) / w_total if w_total > 0 else b / 2.0
        ecc = (b / 2.0) - x_bar

        is_stable = (fos_over >= 1.5) and (fos_slide >= 1.5) and (abs(ecc) <= b / 6.0)
        status_text = "STABLE RETAINING WALL DESIGN" if is_stable else "UNSTABLE WALL (Increase Base Width B)"

        note = (
            f"Cantilever Retaining Wall (H = {h:.1f}m, B = {b:.1f}m, Ka = {ka:.3f}): "
            f"Active Thrust Pa = {pa:.1f} kN/m | FOS Overturning = {fos_over:.2f} (≥1.5) | "
            f"FOS Sliding = {fos_slide:.2f} (≥1.5) | Eccentricity e = {ecc:.3f}m (≤B/6 = {b/6:.2f}m) — {status_text}."
        )

        return RetainingWallStabilityOutput(
            rankine_ka=float(ka),
            total_active_thrust_kn_m=float(pa),
            resisting_moment_knm_m=float(mr),
            overturning_moment_knm_m=float(mo),
            fos_overturning=float(fos_over),
            fos_sliding=float(fos_slide),
            eccentricity_m=float(ecc),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "cantilever_wall_6m": {
                "name": "6m Cantilever Retaining Wall (B = 3.5m)",
                "params": {"wall_height_h_m": 6.0, "base_width_b_m": 3.5, "backfill_friction_angle_deg": 32.0, "backfill_unit_weight_kn_m3": 18.0, "concrete_unit_weight_kn_m3": 24.0}
            },
            "high_wall_8m": {
                "name": "8m High Retaining Wall with Heavy Backfill",
                "params": {"wall_height_h_m": 8.0, "base_width_b_m": 5.0, "backfill_friction_angle_deg": 30.0, "backfill_unit_weight_kn_m3": 19.0, "concrete_unit_weight_kn_m3": 24.0}
            }
        }
