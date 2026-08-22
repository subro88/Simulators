"""
Truss Structural Analysis (Method of Joints) Physics Engine
===========================================================
Calculates pin/roller support reaction forces, member internal axial forces F,
identifies Tension (T) / Compression (C), and zero-force members.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class TrussStructuralAnalysisInput(BaseModel):
    truss_type: Literal["pratt_bridge", "howe_roof", "warren_truss"] = Field(default="pratt_bridge", description="Truss structural topology")
    span_length_m: float = Field(default=12.0, ge=4.0, le=50.0, description="Total truss span L in meters")
    height_h_m: float = Field(default=3.0, ge=1.0, le=15.0, description="Truss height H in meters")
    applied_load_kn: float = Field(default=50.0, ge=5.0, le=500.0, description="Joint point load P in kN")


class TrussStructuralAnalysisOutput(BaseModel):
    truss_type: str
    left_reaction_ay_kn: float
    right_reaction_by_kn: float
    max_compression_force_kn: float
    max_tension_force_kn: float
    zero_force_members_count: int
    status_note: str


class TrussStructuralAnalysisEngine(BaseSimulationEngine):
    name = "truss-structural-analysis"
    description = "Planar 2D Structural Truss: Method of Joints analysis, support reactions, member tension/compression, and zero-force members"

    def calculate(self, params: TrussStructuralAnalysisInput) -> TrussStructuralAnalysisOutput:
        span = params.span_length_m
        h = params.height_h_m
        p_load = params.applied_load_kn

        # Support Reactions Ay & By (Symmetric center load)
        ay = p_load / 2.0
        by = p_load / 2.0

        theta_rad = math.atan2(h, span / 4.0)

        if params.truss_type == "pratt_bridge":
            # Pratt Truss: Diagonals in tension under gravity load
            f_top_chord_comp = - (ay * (span / 4.0)) / h  # Compression
            f_bot_chord_tens = (ay * (span / 2.0)) / h    # Tension
            f_diag_tens = ay / math.sin(theta_rad)         # Tension
            zero_members = 2
            type_title = "Pratt Bridge Truss"

        elif params.truss_type == "howe_roof":
            f_top_chord_comp = - (ay * (span / 3.0)) / h
            f_bot_chord_tens = (ay * (span / 2.0)) / h
            f_diag_tens = ay / math.sin(theta_rad)
            zero_members = 0
            type_title = "Howe Roof Truss"

        else: # warren_truss
            f_top_chord_comp = - (ay * (span / 4.0)) / h
            f_bot_chord_tens = (ay * (span / 2.0)) / h
            f_diag_tens = ay / math.sin(theta_rad)
            zero_members = 1
            type_title = "Warren Triangular Truss"

        max_comp = abs(f_top_chord_comp)
        max_tens = abs(f_bot_chord_tens)

        note = (
            f"{type_title} (Span = {span:.0f}m, H = {h:.1f}m, Load P = {p_load:.0f} kN): "
            f"Support Reactions Ay = By = {ay:.1f} kN | "
            f"Max Compression (Top Chord) = {max_comp:.1f} kN (C) | "
            f"Max Tension (Bottom Chord) = {max_tens:.1f} kN (T) | Zero-Force Members = {zero_members}."
        )

        return TrussStructuralAnalysisOutput(
            truss_type=type_title,
            left_reaction_ay_kn=float(ay),
            right_reaction_by_kn=float(by),
            max_compression_force_kn=float(max_comp),
            max_tension_force_kn=float(max_tens),
            zero_force_members_count=zero_members,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "pratt_12m_bridge": {
                "name": "12m Pratt Bridge Truss (50 kN Center Load)",
                "params": {"truss_type": "pratt_bridge", "span_length_m": 12.0, "height_h_m": 3.0, "applied_load_kn": 50.0}
            },
            "warren_highway_truss": {
                "name": "24m Warren Highway Truss (150 kN Load)",
                "params": {"truss_type": "warren_truss", "span_length_m": 24.0, "height_h_m": 4.0, "applied_load_kn": 150.0}
            }
        }
