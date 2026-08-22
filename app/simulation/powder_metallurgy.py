"""
Powder Metallurgy Compaction & Sintering Physics Engine
======================================================
Calculates green density rho_g, compaction force F, sintering shrinkage %Delta L,
and final porosity P_por.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PowderMetallurgyInput(BaseModel):
    powder_material: str = Field(default="Iron (Fe)", description="Metal powder material")
    compaction_pressure_mpa: float = Field(default=400.0, ge=50.0, le=1200.0, description="Die compaction pressure P in MPa")
    compact_diameter_mm: float = Field(default=40.0, ge=5.0, le=200.0, description="Compact cylindrical diameter D in mm")
    compact_height_mm: float = Field(default=20.0, ge=2.0, le=100.0, description="Compact height H in mm")
    theoretical_density_g_cm3: float = Field(default=7.87, ge=1.5, le=20.0, description="Theoretical full density in g/cm³")


class PowderMetallurgyOutput(BaseModel):
    powder_material: str
    compaction_force_kn: float
    green_density_g_cm3: float
    relative_green_density_pct: float
    sintered_density_g_cm3: float
    porosity_pct: float
    linear_shrinkage_pct: float
    status_note: str


class PowderMetallurgyEngine(BaseSimulationEngine):
    name = "powder-metallurgy"
    description = "Powder Metallurgy: die compaction force F, green density, sintering shrinkage, and residual porosity"

    def calculate(self, params: PowderMetallurgyInput) -> PowderMetallurgyOutput:
        p_mpa = params.compaction_pressure_mpa
        d = params.compact_diameter_mm
        rho_th = params.theoretical_density_g_cm3

        area_mm2 = (math.pi / 4.0) * (d ** 2)

        # Compaction Force F = P * Area (in kN)
        f_comp_kn = (p_mpa * area_mm2) / 1000.0

        # Empirical Heckel equation for green density: rho_g = rho_th * (0.6 + 0.35 * (1 - exp(-P / 250)))
        rel_green = 0.60 + 0.35 * (1.0 - math.exp(-p_mpa / 250.0))
        rho_green = rel_green * rho_th

        # Sintering increases density to ~95% of theoretical
        rel_sintered = min(0.98, rel_green + 0.12)
        rho_sintered = rel_sintered * rho_th

        porosity_pct = (1.0 - rel_sintered) * 100.0

        # Linear shrinkage % = (1 - (rho_green / rho_sintered)^(1/3)) * 100
        shrinkage_pct = (1.0 - math.pow(rho_green / rho_sintered, 1.0 / 3.0)) * 100.0

        note = (
            f"Powder Metallurgy ({params.powder_material}): Compaction Force F = {f_comp_kn:.1f} kN (P = {p_mpa:.0f} MPa) | "
            f"Green Density = {rho_green:.2f} g/cm³ ({rel_green*100:.1f}%) -> "
            f"Sintered Density = {rho_sintered:.2f} g/cm³ (Porosity = {porosity_pct:.1f}%, Shrinkage = {shrinkage_pct:.2f}%)."
        )

        return PowderMetallurgyOutput(
            powder_material=params.powder_material,
            compaction_force_kn=float(f_comp_kn),
            green_density_g_cm3=float(rho_green),
            relative_green_density_pct=float(rel_green * 100.0),
            sintered_density_g_cm3=float(rho_sintered),
            porosity_pct=float(porosity_pct),
            linear_shrinkage_pct=float(shrinkage_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "iron_powder_compaction": {
                "name": "Iron Powder Billet Compaction (400 MPa)",
                "params": {"powder_material": "Iron (Fe)", "compaction_pressure_mpa": 400.0, "compact_diameter_mm": 40.0, "compact_height_mm": 20.0, "theoretical_density_g_cm3": 7.87}
            },
            "copper_bushing_high_press": {
                "name": "Bronze/Copper Bushing Compaction (600 MPa)",
                "params": {"powder_material": "Bronze (Cu-Sn)", "compaction_pressure_mpa": 600.0, "compact_diameter_mm": 30.0, "compact_height_mm": 25.0, "theoretical_density_g_cm3": 8.90}
            }
        }
