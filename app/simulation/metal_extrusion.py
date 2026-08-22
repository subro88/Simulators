"""
Metal Extrusion Ratio & Ram Force Physics Engine
================================================
Calculates extrusion ratio R, true extrusion strain, extrusion pressure p,
ram force Fram, and hydraulic press power P.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MetalExtrusionInput(BaseModel):
    extrusion_type: Literal["direct_forward", "indirect_reverse"] = Field(default="direct_forward", description="Extrusion direction mode")
    billet_diameter_mm: float = Field(default=150.0, ge=30.0, le=500.0, description="Container billet diameter D0 in mm")
    extruded_diameter_mm: float = Field(default=30.0, ge=5.0, le=200.0, description="Extruded profile diameter Df in mm")
    billet_length_mm: float = Field(default=400.0, ge=100.0, le=2000.0, description="Billet length L0 in mm")
    material_flow_stress_mpa: float = Field(default=100.0, ge=20.0, le=600.0, description="Hot flow stress Y_avg in MPa")


class MetalExtrusionOutput(BaseModel):
    extrusion_type: str
    extrusion_ratio_r: float
    true_extrusion_strain: float
    extrusion_pressure_mpa: float
    ram_force_kn: float
    ram_force_tons: float
    status_note: str


class MetalExtrusionEngine(BaseSimulationEngine):
    name = "metal-extrusion"
    description = "Hot metal direct & indirect extrusion: Extrusion ratio R, extrusion pressure p, and ram force F"

    def calculate(self, params: MetalExtrusionInput) -> MetalExtrusionOutput:
        d0 = params.billet_diameter_mm
        df = params.extruded_diameter_mm
        l0 = params.billet_length_mm
        y_avg = params.material_flow_stress_mpa

        # Areas A0 & Af
        a0 = (math.pi / 4.0) * (d0 ** 2)
        af = (math.pi / 4.0) * (df ** 2)

        # Extrusion Ratio R = A0 / Af
        r_ratio = a0 / af if af > 0 else 1.0

        # True Extrusion Strain epsilon = ln(R)
        eps = math.log(r_ratio)

        # Johnson's Extrusion Strain epsilon_x = a + b * ln(R) where a = 0.8, b = 1.5
        eps_x = 0.8 + 1.5 * eps

        if params.extrusion_type == "direct_forward":
            # Friction term for container wall: 2 * L0 / D0
            p_ext_mpa = y_avg * (eps_x + (2.0 * l0 / d0))
            type_title = "Direct (Forward) Extrusion"
        else: # indirect
            p_ext_mpa = y_avg * eps_x
            type_title = "Indirect (Reverse) Extrusion"

        # Ram Force F = p_ext * A0 (in kN)
        f_ram_kn = (p_ext_mpa * a0) / 1000.0
        f_ram_tons = f_ram_kn / 9.81

        note = (
            f"{type_title} (D0 = {d0:.0f} mm -> Df = {df:.0f} mm): "
            f"Extrusion Ratio R = {r_ratio:.1f}:1 (Strain ε = {eps:.2f}) | "
            f"Extrusion Pressure p = {p_ext_mpa:.1f} MPa | Ram Force F = {f_ram_kn:.1f} kN ({f_ram_tons:.0f} Metric Tons)."
        )

        return MetalExtrusionOutput(
            extrusion_type=type_title,
            extrusion_ratio_r=float(r_ratio),
            true_extrusion_strain=float(eps),
            extrusion_pressure_mpa=float(p_ext_mpa),
            ram_force_kn=float(f_ram_kn),
            ram_force_tons=float(f_ram_tons),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "aluminum_rod_extrusion": {
                "name": "Aluminum Rod Extrusion (R = 25:1)",
                "params": {"extrusion_type": "direct_forward", "billet_diameter_mm": 150.0, "extruded_diameter_mm": 30.0, "billet_length_mm": 400.0, "material_flow_stress_mpa": 100.0}
            },
            "indirect_copper_tube": {
                "name": "Indirect Copper Tube Extrusion",
                "params": {"extrusion_type": "indirect_reverse", "billet_diameter_mm": 120.0, "extruded_diameter_mm": 20.0, "billet_length_mm": 300.0, "material_flow_stress_mpa": 150.0}
            }
        }
