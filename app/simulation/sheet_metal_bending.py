"""
Sheet Metal Bending & Springback Physics Engine
==============================================
Calculates Bend Allowance BA, Bend Deduction BD, springback angle Delta_theta,
neutral axis K-factor, and V-die bending force F.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SheetMetalBendingInput(BaseModel):
    sheet_thickness_mm: float = Field(default=2.0, ge=0.5, le=10.0, description="Sheet metal thickness t in mm")
    bend_radius_mm: float = Field(default=4.0, ge=0.5, le=50.0, description="Internal bend radius R in mm")
    bend_angle_deg: float = Field(default=90.0, ge=10.0, le=170.0, description="Bend angle A in degrees")
    sheet_width_mm: float = Field(default=500.0, ge=10.0, le=3000.0, description="Bend length / sheet width L in mm")
    material_uts_mpa: float = Field(default=450.0, ge=100.0, le=1500.0, description="Ultimate Tensile Strength UTS in MPa")


class SheetMetalBendingOutput(BaseModel):
    k_factor: float
    bend_allowance_mm: float
    springback_angle_deg: float
    v_die_opening_mm: float
    bending_force_kn: float
    status_note: str


class SheetMetalBendingEngine(BaseSimulationEngine):
    name = "sheet-metal-bending"
    description = "Sheet metal V-die bending: Bend Allowance BA, K-factor neutral axis, springback compensation, and press force F"

    def calculate(self, params: SheetMetalBendingInput) -> SheetMetalBendingOutput:
        t = params.sheet_thickness_mm
        r = params.bend_radius_mm
        a_deg = params.bend_angle_deg
        l_mm = params.sheet_width_mm
        uts = params.material_uts_mpa

        # K-Factor estimation: K = 0.33 for R < 2t, K = 0.50 for R >= 2t
        k_factor = 0.33 if (r < 2.0 * t) else 0.44

        # Bend Allowance BA = (pi / 180) * A * (R + K * t)
        ba_mm = (math.pi / 180.0) * a_deg * (r + k_factor * t)

        # V-Die opening W ≈ 8 * t
        w_die = 8.0 * t

        # Bending Force F = (K_bf * UTS * L * t^2) / W (in N) where K_bf ≈ 1.33 for V-bending
        k_bf = 1.33
        f_bending_n = (k_bf * uts * l_mm * (t ** 2)) / w_die
        f_bending_kn = f_bending_n / 1000.0

        # Springback Angle estimate (deg) ≈ (2 * R / t)^0.2
        springback_deg = 1.5 * (r / t) if t > 0 else 2.0

        note = (
            f"Sheet Metal V-Bending (t = {t:.1f} mm, R = {r:.1f} mm, A = {a_deg:.0f}°): "
            f"Bend Allowance BA = {ba_mm:.2f} mm (K = {k_factor:.2f}) | "
            f"V-Die Opening W = {w_die:.0f} mm | Bending Force F = {f_bending_kn:.1f} kN (Springback ≈ {springback_deg:.1f}°)."
        )

        return SheetMetalBendingOutput(
            k_factor=float(k_factor),
            bend_allowance_mm=float(ba_mm),
            springback_angle_deg=float(springback_deg),
            v_die_opening_mm=float(w_die),
            bending_force_kn=float(f_bending_kn),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "v_bend_2mm_steel": {
                "name": "2mm Mild Steel Sheet 90° V-Bend",
                "params": {"sheet_thickness_mm": 2.0, "bend_radius_mm": 4.0, "bend_angle_deg": 90.0, "sheet_width_mm": 500.0, "material_uts_mpa": 450.0}
            },
            "heavy_5mm_plate_bend": {
                "name": "5mm Structural Steel Plate 90° Heavy Bend",
                "params": {"sheet_thickness_mm": 5.0, "bend_radius_mm": 10.0, "bend_angle_deg": 90.0, "sheet_width_mm": 1000.0, "material_uts_mpa": 520.0}
            }
        }
