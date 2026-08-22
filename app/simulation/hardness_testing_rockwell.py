"""
Hardness Testing (Brinell, Rockwell & Vickers) Physics Engine
============================================================
Calculates Brinell Hardness HBW, Rockwell HRC/HRB, Vickers HV,
indentation diameter d, and equivalent tensile strength UTS.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class HardnessTestingRockwellInput(BaseModel):
    testing_method: Literal["rockwell_hrc", "brinell_hbw", "vickers_hv"] = Field(default="rockwell_hrc", description="Hardness testing method")
    indentation_depth_or_dia_mm: float = Field(default=0.08, ge=0.01, le=5.0, description="Measured indentation depth (Rockwell mm) or diameter (Brinell mm)")
    test_load_kgf: float = Field(default=150.0, ge=10.0, le=3000.0, description="Applied major test load P in kgf")


class HardnessTestingRockwellOutput(BaseModel):
    testing_method: str
    calculated_hardness_value: float
    hardness_scale_name: str
    estimated_uts_mpa: float
    material_category: str
    status_note: str


class HardnessTestingRockwellEngine(BaseSimulationEngine):
    name = "hardness-testing-rockwell"
    description = "Hardness Testing Metrology: Brinell HBW = 2P/(pi*D*(D-sqrt(D^2-d^2))), Rockwell HRC, Vickers HV, and UTS correlation"

    def calculate(self, params: HardnessTestingRockwellInput) -> HardnessTestingRockwellOutput:
        val_mm = params.indentation_depth_or_dia_mm
        p_kgf = params.test_load_kgf

        if params.testing_method == "brinell_hbw":
            # Brinell HBW = 2 * P / (pi * D * (D - sqrt(D^2 - d^2))) with D = 10mm
            big_d = 10.0
            d_ind = val_mm
            denom = math.pi * big_d * (big_d - math.sqrt(max(0.1, (big_d ** 2) - (d_ind ** 2))))
            h_val = (2.0 * p_kgf) / denom if denom > 0 else 200.0
            scale_name = f"{h_val:.0f} HBW 10/3000"
            uts_est = h_val * 3.45  # UTS ≈ 3.45 * HB (MPa)
            method_title = "Brinell Hardness Test (10mm Ball, 3000 kgf)"

        elif params.testing_method == "vickers_hv":
            # Vickers HV = 1.8544 * P / d^2
            d_diag = val_mm
            h_val = (1.8544 * p_kgf) / (d_diag ** 2) if d_diag > 0 else 300.0
            scale_name = f"{h_val:.0f} HV30"
            uts_est = h_val * 3.2
            method_title = "Vickers Hardness Test (Diamond Pyramid)"

        else: # rockwell_hrc
            # Rockwell HRC = 100 - (e / 0.002) where e in mm
            e_mm = val_mm
            h_val = max(0.0, min(100.0, 100.0 - (e_mm / 0.002)))
            scale_name = f"{h_val:.1f} HRC"
            # HRC to UTS correlation
            uts_est = 20.0 * h_val + 300.0
            method_title = "Rockwell C Hardness Test (120° Diamond Cone, 150 kgf)"

        if h_val >= 60.0 and params.testing_method == "rockwell_hrc":
            category = "Hardened Tool Steel / Case Hardened"
        elif h_val >= 30.0:
            category = "Medium Alloy / Structural Steel"
        else:
            category = "Soft Annealed Steel / Non-Ferrous Alloy"

        note = (
            f"Hardness Testing ({method_title}): Indenter Metric = {val_mm:.3f} mm | "
            f"Hardness Rating = {scale_name} | Estimated Tensile Strength UTS ≈ {uts_est:.0f} MPa ({category})."
        )

        return HardnessTestingRockwellOutput(
            testing_method=method_title,
            calculated_hardness_value=float(h_val),
            hardness_scale_name=scale_name,
            estimated_uts_mpa=float(uts_est),
            material_category=category,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "rockwell_hrc_hardened_steel": {
                "name": "Rockwell HRC Hardened Tool Steel (e = 0.08mm)",
                "params": {"testing_method": "rockwell_hrc", "indentation_depth_or_dia_mm": 0.08, "test_load_kgf": 150.0}
            },
            "brinell_hbw_cast_iron": {
                "name": "Brinell HBW Cast Iron (3000 kgf, d = 4.2mm)",
                "params": {"testing_method": "brinell_hbw", "indentation_depth_or_dia_mm": 4.2, "test_load_kgf": 3000.0}
            }
        }
