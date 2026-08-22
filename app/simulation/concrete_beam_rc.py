"""
Reinforced Concrete (RC) Beam Flexural Design (IS 456) Physics Engine
====================================================================
Calculates neutral axis depth xu, limiting neutral axis xu_max,
ultimate moment of resistance Mu_lim, rebar percentage Pt, and failure mode.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ConcreteBeamRcInput(BaseModel):
    beam_width_b_mm: float = Field(default=250.0, ge=150.0, le=600.0, description="Beam width b in mm")
    effective_depth_d_mm: float = Field(default=450.0, ge=200.0, le=1200.0, description="Effective depth d in mm")
    concrete_grade_fck: float = Field(default=25.0, ge=20.0, le=60.0, description="Concrete compressive strength fck in MPa")
    steel_grade_fy: float = Field(default=415.0, ge=250.0, le=550.0, description="Rebar yield strength fy in MPa")
    num_tension_bars: int = Field(default=4, ge=2, le=10, description="Number of tension rebar rods")
    bar_diameter_mm: float = Field(default=20.0, ge=10.0, le=32.0, description="Rebar rod diameter in mm")


class ConcreteBeamRcOutput(BaseModel):
    steel_area_ast_mm2: float
    steel_percentage_pt: float
    neutral_axis_xu_mm: float
    limiting_neutral_axis_xumax_mm: float
    ultimate_moment_mulim_knm: float
    beam_failure_mode: str
    status_note: str


class ConcreteBeamRcEngine(BaseSimulationEngine):
    name = "concrete-beam-rc"
    description = "IS 456 Limit State Concrete Beam Flexure: neutral axis xu, limiting moment Mu_lim, and tension/compression failure mode"

    def calculate(self, params: ConcreteBeamRcInput) -> ConcreteBeamRcOutput:
        b = params.beam_width_b_mm
        d = params.effective_depth_d_mm
        fck = params.concrete_grade_fck
        fy = params.steel_grade_fy
        n_bars = params.num_tension_bars
        d_bar = params.bar_diameter_mm

        # Area of tension steel Ast
        ast = n_bars * (math.pi / 4.0) * (d_bar ** 2)
        pt = (ast / (b * d)) * 100.0

        # Neutral axis depth xu = (0.87 * fy * Ast) / (0.36 * fck * b)
        xu = (0.87 * fy * ast) / (0.36 * fck * b)

        # Limiting neutral axis xu_max / d per IS 456 (0.53 for Fe250, 0.48 for Fe415, 0.46 for Fe500)
        if fy <= 250.0:
            xu_max_ratio = 0.53
        elif fy <= 415.0:
            xu_max_ratio = 0.48
        else:
            xu_max_ratio = 0.46

        xu_max = xu_max_ratio * d

        if xu < xu_max:
            # Under-reinforced section (Ductile Tension Failure)
            mu_nmm = 0.87 * fy * ast * d * (1.0 - (ast * fy) / (b * d * fck))
            mode = "Under-Reinforced Section (Ductile Tension Yield Failure)"
        elif math.isclose(xu, xu_max, rel_tol=0.05):
            # Balanced section
            mu_nmm = 0.36 * (xu_max / d) * (1.0 - 0.42 * (xu_max / d)) * fck * b * (d ** 2)
            mode = "Balanced Section (Simultaneous Concrete Crushing & Steel Yield)"
        else:
            # Over-reinforced section -> Cap at xu_max
            xu_eff = xu_max
            mu_nmm = 0.36 * (xu_eff / d) * (1.0 - 0.42 * (xu_eff / d)) * fck * b * (d ** 2)
            mode = "Over-Reinforced Section (Brittle Concrete Compression Failure)"

        mu_knm = mu_nmm / 1e6

        note = (
            f"IS 456 RC Beam Design (b = {b:.0f}mm, d = {d:.0f}mm, M{fck:.0f}/Fe{fy:.0f}): "
            f"Tension Rebar Ast = {ast:.0f} mm² ({pt:.2f}%) | Neutral Axis xu = {xu:.1f} mm (xu_max = {xu_max:.1f} mm) | "
            f"Ultimate Moment Capacity Mu = {mu_knm:.1f} kN·m ({mode})."
        )

        return ConcreteBeamRcOutput(
            steel_area_ast_mm2=float(ast),
            steel_percentage_pt=float(pt),
            neutral_axis_xu_mm=float(xu),
            limiting_neutral_axis_xumax_mm=float(xu_max),
            ultimate_moment_mulim_knm=float(mu_knm),
            beam_failure_mode=mode,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "under_reinforced_m25_fe415": {
                "name": "Under-Reinforced RC Beam (M25 / Fe415, 4x20mm Bars)",
                "params": {"beam_width_b_mm": 250.0, "effective_depth_d_mm": 450.0, "concrete_grade_fck": 25.0, "steel_grade_fy": 415.0, "num_tension_bars": 4, "bar_diameter_mm": 20.0}
            },
            "balanced_m30_fe500": {
                "name": "Balanced RC Beam Section (M30 / Fe500)",
                "params": {"beam_width_b_mm": 300.0, "effective_depth_d_mm": 500.0, "concrete_grade_fck": 30.0, "steel_grade_fy": 500.0, "num_tension_bars": 4, "bar_diameter_mm": 25.0}
            }
        }
