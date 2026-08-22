"""
Additive 3D Printing (FDM Deposition) Physics Engine
====================================================
Calculates print time t, filament length consumption L, part mass m,
layer deposition rate, and volumetric flow rate Q.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class Additive3dPrintingInput(BaseModel):
    filament_material: Literal["pla", "petg", "abs"] = Field(default="pla", description="3D Printing filament polymer")
    layer_height_mm: float = Field(default=0.2, ge=0.05, le=0.6, description="Layer height h in mm")
    print_speed_mm_s: float = Field(default=60.0, ge=10.0, le=300.0, description="Print speed v in mm/s")
    infill_density_pct: float = Field(default=20.0, ge=0.0, le=100.0, description="Internal infill percentage %")
    part_bounding_volume_cm3: float = Field(default=120.0, ge=1.0, le=2000.0, description="Part bounding volume in cm³")


class Additive3dPrintingOutput(BaseModel):
    filament_material: str
    volumetric_flow_rate_mm3_s: float
    filament_length_meters: float
    part_weight_grams: float
    total_layers_count: int
    estimated_print_time_hours: float
    status_note: str


class Additive3dPrintingEngine(BaseSimulationEngine):
    name = "additive-3d-printing"
    description = "FDM Additive Manufacturing: layer height h, print time, volumetric extrusion flow rate Q, and filament usage"

    def calculate(self, params: Additive3dPrintingInput) -> Additive3dPrintingOutput:
        h = params.layer_height_mm
        v = params.print_speed_mm_s
        infill_frac = params.infill_density_pct / 100.0
        v_part_cm3 = params.part_bounding_volume_cm3

        if params.filament_material == "petg":
            density_g_cm3 = 1.27
            mat_title = "PETG Filament"
        elif params.filament_material == "abs":
            density_g_cm3 = 1.04
            mat_title = "ABS Filament"
        else: # pla
            density_g_cm3 = 1.24
            mat_title = "PLA Filament"

        # Volumetric Flow Rate Q = nozzle_width (0.4mm) * layer_height * print_speed (mm^3/s)
        nozzle_w = 0.4
        q_flow_mm3_s = nozzle_w * h * v

        # Effective solid polymer volume V_solid = V_part * (0.2 + 0.8 * infill)
        v_solid_cm3 = v_part_cm3 * (0.2 + 0.8 * infill_frac)
        v_solid_mm3 = v_solid_cm3 * 1000.0

        # Filament consumption (1.75mm diameter standard)
        d_fil_mm = 1.75
        a_fil_mm2 = (math.pi / 4.0) * (d_fil_mm ** 2)
        l_fil_m = (v_solid_mm3 / a_fil_mm2) / 1000.0

        # Weight m = V_solid * density
        weight_g = v_solid_cm3 * density_g_cm3

        # Layers count assuming 50mm height
        total_layers = int(50.0 / h)

        # Print Time t = V_solid / Q (seconds) -> hours (/ 3600)
        t_sec = v_solid_mm3 / q_flow_mm3_s if q_flow_mm3_s > 0 else 0.0
        t_hours = t_sec / 3600.0

        note = (
            f"FDM 3D Printing ({mat_title}, Layer = {h:.2f} mm, Speed = {v:.0f} mm/s): "
            f"Extrusion Flow Rate Q = {q_flow_mm3_s:.1f} mm³/s | "
            f"Filament Used = {l_fil_m:.1f} m ({weight_g:.1f} g) | Estimated Print Time = {t_hours:.2f} hours."
        )

        return Additive3dPrintingOutput(
            filament_material=mat_title,
            volumetric_flow_rate_mm3_s=float(q_flow_mm3_s),
            filament_length_meters=float(l_fil_m),
            part_weight_grams=float(weight_g),
            total_layers_count=total_layers,
            estimated_print_time_hours=float(t_hours),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str,Any]]:
        return {
            "pla_standard_speed": {
                "name": "PLA Standard Print (0.2mm Layer, 60mm/s)",
                "params": {"filament_material": "pla", "layer_height_mm": 0.2, "print_speed_mm_s": 60.0, "infill_density_pct": 20.0, "part_bounding_volume_cm3": 120.0}
            },
            "fast_draft_mode": {
                "name": "High-Speed Draft Mode (0.3mm Layer, 120mm/s)",
                "params": {"filament_material": "pla", "layer_height_mm": 0.3, "print_speed_mm_s": 120.0, "infill_density_pct": 15.0, "part_bounding_volume_cm3": 120.0}
            }
        }
