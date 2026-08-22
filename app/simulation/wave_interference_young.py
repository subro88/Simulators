"""
Young's Double Slit Wave Interference Physics Engine
===================================================
Calculates fringe width Delta y, bright fringe positions y_m,
dark fringe positions, and angular fringe width theta.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class WaveInterferenceYoungInput(BaseModel):
    light_wavelength_nm: float = Field(default=632.8, ge=380.0, le=750.0, description="Monochromatic laser wavelength lambda in nm")
    slit_separation_d_mm: float = Field(default=0.25, ge=0.05, le=2.0, description="Distance between slits d in mm")
    screen_distance_d_m: float = Field(default=1.5, ge=0.5, le=5.0, description="Slit to screen distance D in meters")
    fringe_order_m: int = Field(default=3, ge=1, le=20, description="Fringe order number m")


class WaveInterferenceYoungOutput(BaseModel):
    fringe_width_beta_mm: float
    bright_fringe_position_ym_mm: float
    dark_fringe_position_ym_mm: float
    angular_fringe_width_deg: float
    status_note: str


class WaveInterferenceYoungEngine(BaseSimulationEngine):
    name = "wave-interference-young"
    description = "Young's Double Slit Wave Interference: fringe spacing beta = lambda*D/d, bright/dark fringe positions ym"

    def calculate(self, params: WaveInterferenceYoungInput) -> WaveInterferenceYoungOutput:
        lam_nm = params.light_wavelength_nm
        d_mm = params.slit_separation_d_mm
        big_d_m = params.screen_distance_d_m
        m_order = params.fringe_order_m

        lam_m = lam_nm * 1e-9
        d_m = d_mm / 1000.0

        # Fringe Width Beta = lambda * D / d (in meters -> mm)
        beta_m = (lam_m * big_d_m) / d_m if d_m > 0 else 0.0
        beta_mm = beta_m * 1000.0

        # Bright Fringe Position ym = m * Beta
        y_bright_mm = m_order * beta_mm

        # Dark Fringe Position ym_dark = (m - 0.5) * Beta
        y_dark_mm = (m_order - 0.5) * beta_mm

        # Angular Fringe Width theta = lambda / d (radians -> deg)
        theta_rad = lam_m / d_m if d_m > 0 else 0.0
        theta_deg = math.degrees(theta_rad)

        note = (
            f"Young's Double Slit Interference (λ = {lam_nm:.1f} nm, d = {d_mm:.2f} mm, D = {big_d_m:.1f} m): "
            f"Fringe Spacing β = {beta_mm:.3f} mm | Order m={m_order} Bright Fringe = {y_bright_mm:.2f} mm | "
            f"Dark Fringe = {y_dark_mm:.2f} mm (Angular Width θ = {theta_deg:.4f}°)."
        )

        return WaveInterferenceYoungOutput(
            fringe_width_beta_mm=float(beta_mm),
            bright_fringe_position_ym_mm=float(y_bright_mm),
            dark_fringe_position_ym_mm=float(y_dark_mm),
            angular_fringe_width_deg=float(theta_deg),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "he_ne_red_laser": {
                "name": "He-Ne Red Laser Interference (632.8 nm)",
                "params": {"light_wavelength_nm": 632.8, "slit_separation_d_mm": 0.25, "screen_distance_d_m": 1.5, "fringe_order_m": 3}
            },
            "green_laser_narrow_slits": {
                "name": "Green Laser Interference (532 nm, d = 0.15mm)",
                "params": {"light_wavelength_nm": 532.0, "slit_separation_d_mm": 0.15, "screen_distance_d_m": 2.0, "fringe_order_m": 5}
            }
        }
