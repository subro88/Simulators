"""
Viscous Fluid Flow & Poiseuille Law Physics Engine
==================================================
Calculates Hagen-Poiseuille volume flow rate Q, wall shear stress tau_w,
pressure drop Delta P, and Stokes falling sphere terminal velocity vt.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ViscousFluidPoiseuilleInput(BaseModel):
    pipe_radius_mm: float = Field(default=5.0, ge=0.5, le=50.0, description="Capillary tube radius r in mm")
    pipe_length_m: float = Field(default=1.0, ge=0.1, le=10.0, description="Tube length L in meters")
    pressure_drop_kpa: float = Field(default=10.0, ge=0.1, le=500.0, description="Pressure drop Delta P in kPa")
    dynamic_viscosity_pas: float = Field(default=0.1, ge=0.001, le=10.0, description="Fluid dynamic viscosity mu in Pa·s")


class ViscousFluidPoiseuilleOutput(BaseModel):
    flow_rate_cm3_s: float
    max_centerline_velocity_m_s: float
    mean_velocity_m_s: float
    wall_shear_stress_pa: float
    stokes_terminal_velocity_mm_s: float
    status_note: str


class ViscousFluidPoiseuilleEngine(BaseSimulationEngine):
    name = "viscous-fluid-poiseuille"
    description = "Hagen-Poiseuille Viscous Flow & Stokes Law: Q = (pi*r^4*DeltaP)/(8*mu*L), wall shear tau_w, and terminal velocity vt"

    def calculate(self, params: ViscousFluidPoiseuilleInput) -> ViscousFluidPoiseuilleOutput:
        r_m = params.pipe_radius_mm / 1000.0
        l_m = params.pipe_length_m
        dp_pa = params.pressure_drop_kpa * 1000.0
        mu = params.dynamic_viscosity_pas

        # Hagen-Poiseuille Flow Rate Q = (pi * r^4 * DeltaP) / (8 * mu * L) (m^3/s -> cm^3/s)
        q_m3_s = (math.pi * (r_m ** 4) * dp_pa) / (8.0 * mu * l_m) if (mu * l_m) > 0 else 0.0
        q_cm3_s = q_m3_s * 1e6

        # Mean Velocity v_mean = Q / A (m/s)
        area_m2 = math.pi * (r_m ** 2)
        v_mean = q_m3_s / area_m2 if area_m2 > 0 else 0.0

        # Max Centerline Velocity vmax = 2 * v_mean
        v_max = 2.0 * v_mean

        # Wall Shear Stress tau_w = (r * DeltaP) / (2 * L) (Pa)
        tau_w = (r_m * dp_pa) / (2.0 * l_m) if l_m > 0 else 0.0

        # Stokes Law Falling Sphere (r_s = 1mm sphere, steel density 7800 vs oil 900)
        rs_m = 0.001
        rho_p, rho_f = 7800.0, 900.0
        vt_m_s = (2.0 * (rs_m ** 2) * (rho_p - rho_f) * 9.81) / (9.0 * mu) if mu > 0 else 0.0
        vt_mm_s = vt_m_s * 1000.0

        note = (
            f"Hagen-Poiseuille Viscous Flow (Radius r = {params.pipe_radius_mm:.1f} mm, μ = {mu:.3f} Pa·s): "
            f"Flow Rate Q = {q_cm3_s:.2f} cm³/s | Mean Velocity = {v_mean:.3f} m/s (Vmax = {v_max:.3f} m/s) | "
            f"Wall Shear Stress τw = {tau_w:.1f} Pa | Stokes Falling Sphere Terminal Velocity = {vt_mm_s:.1f} mm/s."
        )

        return ViscousFluidPoiseuilleOutput(
            flow_rate_cm3_s=float(q_cm3_s),
            max_centerline_velocity_m_s=float(v_max),
            mean_velocity_m_s=float(v_mean),
            wall_shear_stress_pa=float(tau_w),
            stokes_terminal_velocity_mm_s=float(vt_mm_s),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "heavy_oil_capillary_flow": {
                "name": "Heavy Engine Oil Flow (r = 5mm, mu = 0.10 Pa·s)",
                "params": {"pipe_radius_mm": 5.0, "pipe_length_m": 1.0, "pressure_drop_kpa": 10.0, "dynamic_viscosity_pas": 0.10}
            },
            "glycerin_viscometer_high_mu": {
                "name": "Glycerin High Viscosity Capillary Flow (mu = 1.49 Pa·s)",
                "params": {"pipe_radius_mm": 8.0, "pipe_length_m": 0.5, "pressure_drop_kpa": 25.0, "dynamic_viscosity_pas": 1.49}
            }
        }
