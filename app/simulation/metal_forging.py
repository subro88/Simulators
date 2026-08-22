"""
Open-Die Metal Forging Load & Friction Hill Physics Engine
=========================================================
Calculates true strain epsilon, flow stress Yf, friction hill factor,
peak forging load F, and forging work W.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MetalForgingInput(BaseModel):
    initial_height_mm: float = Field(default=80.0, ge=10.0, le=500.0, description="Initial billet height h0 in mm")
    final_height_mm: float = Field(default=40.0, ge=5.0, le=450.0, description="Final forged height hf in mm")
    billet_diameter_mm: float = Field(default=60.0, ge=10.0, le=500.0, description="Initial billet diameter d0 in mm")
    yield_strength_mpa: float = Field(default=120.0, ge=20.0, le=600.0, description="Hot forging yield stress Yf in MPa")
    friction_coefficient_mu: float = Field(default=0.25, ge=0.05, le=0.5, description="Die-billet friction coefficient mu")


class MetalForgingOutput(BaseModel):
    true_strain: float
    height_reduction_pct: float
    final_diameter_mm: float
    forging_force_kn: float
    forging_force_tons: float
    forging_energy_kj: float
    status_note: str


class MetalForgingEngine(BaseSimulationEngine):
    name = "metal-forging"
    description = "Hot open-die upset forging: true strain epsilon, friction hill pressure distribution, and forging load F"

    def calculate(self, params: MetalForgingInput) -> MetalForgingOutput:
        h0 = params.initial_height_mm
        hf = params.final_height_mm
        d0 = params.billet_diameter_mm
        yf = params.yield_strength_mpa
        mu = params.friction_coefficient_mu

        # True Strain epsilon = ln(h0 / hf)
        eps = math.log(h0 / hf) if hf > 0 else 0.0
        red_pct = ((h0 - hf) / h0) * 100.0

        # Constant volume V = pi/4 * d0^2 * h0 -> final diameter df
        vol = (math.pi / 4.0) * (d0 ** 2) * h0
        df = math.sqrt((4.0 * vol) / (math.pi * hf)) if hf > 0 else d0

        # Open-die forging average pressure p_avg = Yf * (1 + (mu * df) / (3 * hf))
        p_avg = yf * (1.0 + (mu * df) / (3.0 * hf))

        # Forging Force F = p_avg * Area_final (in kN)
        a_final = (math.pi / 4.0) * (df ** 2)
        f_kn = (p_avg * a_final) / 1000.0
        f_tons = f_kn / 9.81

        # Energy W ≈ F_avg * (h0 - hf) in kJ
        work_kj = (f_kn * 0.7 * (h0 - hf)) / 1000.0

        note = (
            f"Hot Open-Die Upset Forging (h0 = {h0:.0f} -> {hf:.0f} mm, {red_pct:.0f}% Reduction): "
            f"True Strain ε = {eps:.3f} | Final Dia df = {df:.1f} mm | "
            f"Forging Load F = {f_kn:.1f} kN ({f_tons:.0f} Tons) | Energy W = {work_kj:.2f} kJ."
        )

        return MetalForgingOutput(
            true_strain=float(eps),
            height_reduction_pct=float(red_pct),
            final_diameter_mm=float(df),
            forging_force_kn=float(f_kn),
            forging_force_tons=float(f_tons),
            forging_energy_kj=float(work_kj),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "hot_steel_upsetting_50pct": {
                "name": "Hot Steel Billet Upsetting (50% Reduction)",
                "params": {"initial_height_mm": 80.0, "final_height_mm": 40.0, "billet_diameter_mm": 60.0, "yield_strength_mpa": 120.0, "friction_coefficient_mu": 0.25}
            },
            "aluminum_block_forging": {
                "name": "Aluminum Hot Forging (Yf = 60 MPa)",
                "params": {"initial_height_mm": 100.0, "final_height_mm": 50.0, "billet_diameter_mm": 80.0, "yield_strength_mpa": 60.0, "friction_coefficient_mu": 0.15}
            }
        }
