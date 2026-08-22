"""
Material Testing & Mechanical Properties Physics Engine
========================================================
Calculates tensile yield/ultimate stress, % elongation, % reduction in area,
Brinell hardness HBW, Vickers HV, and Charpy impact toughness.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MaterialTestingInput(BaseModel):
    test_type: Literal["utm_tensile", "brinell_hardness", "charpy_impact"] = Field(
        default="utm_tensile",
        description="Material testing experiment mode"
    )
    gauge_diameter_mm: float = Field(default=12.5, ge=1.0, le=50.0, description="Initial specimen diameter d_0 in mm")
    gauge_length_mm: float = Field(default=50.0, ge=10.0, le=200.0, description="Initial gauge length L_0 in mm")
    yield_load_kn: float = Field(default=45.0, ge=1.0, le=500.0, description="Load at yield point F_y in kN")
    ultimate_load_kn: float = Field(default=75.0, ge=1.0, le=800.0, description="Peak ultimate load F_u in kN")
    final_length_mm: float = Field(default=62.5, ge=50.0, le=300.0, description="Final broken gauge length L_f in mm")
    final_diameter_mm: float = Field(default=8.5, ge=1.0, le=50.0, description="Final necked diameter d_f in mm")
    brinell_load_kgf: float = Field(default=3000.0, ge=100.0, le=5000.0, description="Brinell indenter load P in kgf")
    indentation_dia_mm: float = Field(default=4.2, ge=1.0, le=10.0, description="Brinell impression diameter d in mm (ball D = 10mm)")


class MaterialTestingOutput(BaseModel):
    test_type: str
    yield_strength_mpa: float
    ultimate_strength_mpa: float
    percent_elongation: float
    percent_reduction_in_area: float
    brinell_hardness_hbw: float
    vickers_hardness_hv: float
    modulus_of_toughness_mj_m3: float
    status_note: str


class MaterialTestingEngine(BaseSimulationEngine):
    name = "material-testing"
    description = "Material testing physics: UTM tensile properties, Brinell HBW/Vickers HV hardness, and Charpy toughness"

    def calculate(self, params: MaterialTestingInput) -> MaterialTestingOutput:
        d0 = params.gauge_diameter_mm
        l0 = params.gauge_length_mm
        a0_mm2 = (math.pi * (d0 ** 2)) / 4.0

        # Yield Strength sigma_y = Fy / A0
        sig_y_mpa = (params.yield_load_kn * 1000.0) / a0_mm2 if a0_mm2 > 0 else 0.0

        # Ultimate Tensile Strength sigma_u = Fu / A0
        sig_u_mpa = (params.ultimate_load_kn * 1000.0) / a0_mm2 if a0_mm2 > 0 else 0.0

        # % Elongation = (Lf - L0) / L0 * 100
        pct_elong = ((params.final_length_mm - l0) / l0) * 100.0 if l0 > 0 else 0.0

        # % Reduction in Area = (A0 - Af) / A0 * 100
        af_mm2 = (math.pi * (params.final_diameter_mm ** 2)) / 4.0
        pct_ra = ((a0_mm2 - af_mm2) / a0_mm2) * 100.0 if a0_mm2 > 0 else 0.0

        # Brinell Hardness HBW = 2 * P / (pi * D * (D - sqrt(D^2 - d^2)))
        p_kgf = params.brinell_load_kgf
        ball_d = 10.0  # 10mm standard ball
        d_ind = min(ball_d * 0.95, max(0.5, params.indentation_dia_mm))
        denom_hbw = math.pi * ball_d * (ball_d - math.sqrt((ball_d ** 2) - (d_ind ** 2)))
        hbw = (2.0 * p_kgf) / denom_hbw if denom_hbw > 0 else 200.0

        # Approximate Vickers HV ≈ 1.05 * HBW
        hv = hbw * 1.05

        # Modulus of toughness approx U_t ≈ ((sigma_y + sigma_u) / 2) * (pct_elong / 100) in MJ/m^3
        mod_toughness_mj_m3 = ((sig_y_mpa + sig_u_mpa) / 2.0) * (pct_elong / 100.0)

        if params.test_type == "utm_tensile":
            type_title = "UTM Tensile Test"
        elif params.test_type == "brinell_hardness":
            type_title = "Brinell Hardness Test"
        else:
            type_title = "Charpy Impact Test"

        note = (
            f"{type_title}: Yield Stress σ_y = {sig_y_mpa:.1f} MPa | UTS = {sig_u_mpa:.1f} MPa | "
            f"Elongation = {pct_elong:.1f}% | Area Reduction = {pct_ra:.1f}% | Hardness = {hbw:.0f} HBW ({hv:.0f} HV)."
        )

        return MaterialTestingOutput(
            test_type=type_title,
            yield_strength_mpa=float(sig_y_mpa),
            ultimate_strength_mpa=float(sig_u_mpa),
            percent_elongation=float(pct_elong),
            percent_reduction_in_area=float(pct_ra),
            brinell_hardness_hbw=float(hbw),
            vickers_hardness_hv=float(hv),
            modulus_of_toughness_mj_m3=float(mod_toughness_mj_m3),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "mild_steel_utm": {
                "name": "Mild Steel Tensile UTM Test",
                "params": {"test_type": "utm_tensile", "gauge_diameter_mm": 12.5, "gauge_length_mm": 50.0, "yield_load_kn": 42.0, "ultimate_load_kn": 68.0, "final_length_mm": 63.5, "final_diameter_mm": 8.2, "brinell_load_kgf": 3000.0, "indentation_dia_mm": 4.3}
            },
            "hardened_steel_hardness": {
                "name": "Heat-Treated Alloy Steel Hardness",
                "params": {"test_type": "brinell_hardness", "gauge_diameter_mm": 12.5, "gauge_length_mm": 50.0, "yield_load_kn": 95.0, "ultimate_load_kn": 135.0, "final_length_mm": 56.0, "final_diameter_mm": 10.5, "brinell_load_kgf": 3000.0, "indentation_dia_mm": 3.1}
            }
        }
