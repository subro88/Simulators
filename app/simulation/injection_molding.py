"""
Plastic Injection Molding Cycle & Clamping Force Physics Engine
===============================================================
Calculates required clamping force Fclamp, cooling time tc, total cycle time,
shot volume, and polymer flow rate.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class InjectionMoldingInput(BaseModel):
    polymer_type: Literal["polypropylene_pp", "abs", "polycarbonate_pc"] = Field(default="abs", description="Thermoplastic material type")
    part_wall_thickness_mm: float = Field(default=2.5, ge=0.5, le=10.0, description="Part nominal wall thickness h in mm")
    projected_area_cm2: float = Field(default=250.0, ge=10.0, le=5000.0, description="Part total projected cavity area A in cm²")
    injection_pressure_bar: float = Field(default=800.0, ge=200.0, le=2500.0, description="Cavity peak injection pressure Pinj in bar")
    num_cavities: int = Field(default=2, ge=1, le=32, description="Multi-cavity mold count")


class InjectionMoldingOutput(BaseModel):
    polymer_type: str
    clamping_force_kn: float
    clamping_force_tons: float
    cooling_time_sec: float
    total_cycle_time_sec: float
    parts_per_hour: float
    status_note: str


class InjectionMoldingEngine(BaseSimulationEngine):
    name = "injection-molding"
    description = "Plastic Injection Molding: clamping force Fclamp, polymer thermal cooling time tc, and total molding cycle time"

    def calculate(self, params: InjectionMoldingInput) -> InjectionMoldingOutput:
        h = params.part_wall_thickness_mm
        a_cm2 = params.projected_area_cm2 * params.num_cavities
        p_bar = params.injection_pressure_bar

        if params.polymer_type == "polypropylene_pp":
            alpha = 0.08  # mm^2/s thermal diffusivity
            tm, tw, te = 230.0, 40.0, 90.0
            mat_title = "Polypropylene (PP)"
        elif params.polymer_type == "polycarbonate_pc":
            alpha = 0.11
            tm, tw, te = 290.0, 90.0, 140.0
            mat_title = "Polycarbonate (PC)"
        else: # abs
            alpha = 0.09
            tm, tw, te = 240.0, 60.0, 100.0
            mat_title = "ABS (Acrylonitrile Butadiene Styrene)"

        # Clamping Force F_clamp = P_cavity * A_proj (in kN)
        # Cavity pressure P_cavity ≈ 0.5 * P_injection
        p_cav_bar = 0.5 * p_bar
        # F (kN) = P_cav (bar) * A (cm^2) / 100
        f_clamp_kn = (p_cav_bar * a_cm2) / 100.0
        f_clamp_tons = f_clamp_kn / 9.81

        # Cooling Time tc = (h^2 / (pi^2 * alpha)) * ln((8 / pi^2) * ((Tm - Tw) / (Te - Tw)))
        ln_ratio = math.log((8.0 / (math.pi ** 2)) * ((tm - tw) / (te - tw)))
        t_cool_sec = ((h ** 2) / ((math.pi ** 2) * alpha)) * ln_ratio

        # Total Cycle Time = t_inject (2s) + t_cool + t_reset (5s)
        t_total_sec = 2.0 + t_cool_sec + 5.0
        parts_per_hr = (3600.0 / t_total_sec) * params.num_cavities if t_total_sec > 0 else 0.0

        note = (
            f"Injection Molding ({mat_title}, {params.num_cavities} Cavities): "
            f"Clamping Force F = {f_clamp_kn:.0f} kN ({f_clamp_tons:.0f} Metric Tons) | "
            f"Cooling Time = {t_cool_sec:.1f} s | Total Cycle = {t_total_sec:.1f} s ({parts_per_hr:.0f} parts/hour)."
        )

        return InjectionMoldingOutput(
            polymer_type=mat_title,
            clamping_force_kn=float(f_clamp_kn),
            clamping_force_tons=float(f_clamp_tons),
            cooling_time_sec=float(t_cool_sec),
            total_cycle_time_sec=float(t_total_sec),
            parts_per_hour=float(parts_per_hr),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "abs_2_cavity_mold": {
                "name": "ABS 2-Cavity Enclosure Mold (2.5mm Wall)",
                "params": {"polymer_type": "abs", "part_wall_thickness_mm": 2.5, "projected_area_cm2": 250.0, "injection_pressure_bar": 800.0, "num_cavities": 2}
            },
            "pp_thin_wall_container": {
                "name": "PP Thin-Wall Container 4-Cavity (1.2mm Wall)",
                "params": {"polymer_type": "polypropylene_pp", "part_wall_thickness_mm": 1.2, "projected_area_cm2": 150.0, "injection_pressure_bar": 1000.0, "num_cavities": 4}
            }
        }
