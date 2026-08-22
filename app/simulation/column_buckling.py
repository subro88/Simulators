"""
Column Buckling (Euler & Rankine) Physics Engine
=================================================
Calculates effective length L_e, slenderness ratio lambda, Euler critical buckling load P_cr,
Rankine load P_R, and critical buckling stress.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ColumnBucklingInput(BaseModel):
    end_condition: Literal["pinned_pinned", "fixed_free", "fixed_fixed", "fixed_pinned"] = Field(
        default="pinned_pinned",
        description="Column end boundary conditions"
    )
    column_length_m: float = Field(default=3.0, ge=0.5, le=20.0, description="Column actual length L in meters")
    width_mm: float = Field(default=80.0, ge=10.0, le=500.0, description="Rectangular cross-section width b in mm")
    depth_mm: float = Field(default=120.0, ge=10.0, le=500.0, description="Rectangular cross-section depth h in mm")
    youngs_modulus_gpa: float = Field(default=200.0, ge=10.0, le=500.0, description="Material Young's Modulus E in GPa")
    crushing_stress_mpa: float = Field(default=320.0, ge=50.0, le=1000.0, description="Material ultimate crushing stress sigma_c in MPa")


class ColumnBucklingOutput(BaseModel):
    effective_length_m: float
    cross_sectional_area_mm2: float
    min_moment_of_inertia_mm4: float
    min_radius_of_gyration_mm: float
    slenderness_ratio: float
    euler_critical_load_kn: float
    rankine_critical_load_kn: float
    critical_stress_mpa: float
    status_note: str


class ColumnBucklingEngine(BaseSimulationEngine):
    name = "column-buckling"
    description = "Euler and Rankine-Gordon column stability: effective length factor k, slenderness ratio, and critical load"

    def calculate(self, params: ColumnBucklingInput) -> ColumnBucklingOutput:
        l = params.column_length_m
        b = params.width_mm
        h = params.depth_mm

        # Effective length factor k
        factors = {
            "pinned_pinned": 1.0,
            "fixed_free": 2.0,
            "fixed_fixed": 0.5,
            "fixed_pinned": 0.707
        }
        k_factor = factors.get(params.end_condition, 1.0)
        l_e = k_factor * l

        area_mm2 = b * h
        area_m2 = area_mm2 * 1e-6

        # Min Moment of Inertia I_min = min(b*h^3/12, h*b^3/12)
        i_x = (b * (h ** 3)) / 12.0
        i_y = (h * (b ** 3)) / 12.0
        i_min_mm4 = min(i_x, i_y)
        i_min_m4 = i_min_mm4 * 1e-12

        # Min radius of gyration r_min = sqrt(I_min / A)
        r_min_mm = math.sqrt(i_min_mm4 / area_mm2) if area_mm2 > 0 else 1.0

        # Slenderness ratio lambda = L_e / r_min
        l_e_mm = l_e * 1000.0
        slenderness = l_e_mm / r_min_mm if r_min_mm > 0 else 1.0

        # Euler Critical Load P_cr = (pi^2 * E * I) / L_e^2
        e_pa = params.youngs_modulus_gpa * 1e9
        p_euler_n = ((math.pi ** 2) * e_pa * i_min_m4) / (l_e ** 2) if l_e > 0 else 0.0
        p_euler_kn = p_euler_n / 1000.0

        # Rankine Load P_R = P_c / (1 + a * lambda^2) where P_c = sigma_c * A, a = sigma_c / (pi^2 * E)
        p_crushing_n = (params.crushing_stress_mpa * 1e6) * area_m2
        rankine_a = (params.crushing_stress_mpa * 1e6) / ((math.pi ** 2) * e_pa) if e_pa > 0 else 0.0001
        p_rankine_n = p_crushing_n / (1.0 + rankine_a * (slenderness ** 2))
        p_rankine_kn = p_rankine_n / 1000.0

        critical_stress_mpa = (p_euler_n / area_m2) / 1e6 if area_m2 > 0 else 0.0

        condition_titles = {
            "pinned_pinned": "Pinned-Pinned (k=1.0)",
            "fixed_free": "Fixed-Free (k=2.0)",
            "fixed_fixed": "Fixed-Fixed (k=0.5)",
            "fixed_pinned": "Fixed-Pinned (k=0.707)"
        }
        title = condition_titles.get(params.end_condition, "Column")

        note = (
            f"{title}: Slenderness λ = {slenderness:.1f} | Euler Buckling Load P_cr = {p_euler_kn:.1f} kN "
            f"| Rankine Load P_R = {p_rankine_kn:.1f} kN (Critical Stress = {critical_stress_mpa:.1f} MPa)."
        )

        return ColumnBucklingOutput(
            effective_length_m=float(l_e),
            cross_sectional_area_mm2=float(area_mm2),
            min_moment_of_inertia_mm4=float(i_min_mm4),
            min_radius_of_gyration_mm=float(r_min_mm),
            slenderness_ratio=float(slenderness),
            euler_critical_load_kn=float(p_euler_kn),
            rankine_critical_load_kn=float(p_rankine_kn),
            critical_stress_mpa=float(critical_stress_mpa),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "long_building_column": {
                "name": "Long Building Column (Pinned-Pinned)",
                "params": {"end_condition": "pinned_pinned", "column_length_m": 4.0, "width_mm": 100.0, "depth_mm": 150.0, "youngs_modulus_gpa": 200.0}
            },
            "fixed_machine_strut": {
                "name": "Fixed Machine Strut (Fixed-Fixed)",
                "params": {"end_condition": "fixed_fixed", "column_length_m": 2.5, "width_mm": 60.0, "depth_mm": 80.0, "youngs_modulus_gpa": 200.0}
            }
        }
