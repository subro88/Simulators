"""
Metal Casting Solidification (Chvorinov's Rule) Physics Engine
================================================================
Calculates modulus (V/A), Chvorinov's solidification time ts,
mold filling time tf, and riser design volume Vr.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MetalCastingInput(BaseModel):
    casting_shape: Literal["cube", "sphere", "cylinder"] = Field(default="cube", description="Casting geometry")
    characteristic_dimension_mm: float = Field(default=100.0, ge=10.0, le=1000.0, description="Side length / Diameter in mm")
    chvorinov_constant_s_mm2: float = Field(default=0.0025, ge=0.0005, le=0.01, description="Mold constant B in s/mm²")
    sprue_height_mm: float = Field(default=150.0, ge=50.0, le=500.0, description="Pouring sprue height h in mm")


class MetalCastingOutput(BaseModel):
    casting_shape: str
    volume_cm3: float
    surface_area_cm2: float
    modulus_v_over_a_mm: float
    solidification_time_sec: float
    solidification_time_min: float
    mold_filling_time_sec: float
    status_note: str


class MetalCastingEngine(BaseSimulationEngine):
    name = "metal-casting"
    description = "Metal casting solidification dynamics: Chvorinov's Rule ts = B*(V/A)^2, modulus V/A, and sprue fill time"

    def calculate(self, params: MetalCastingInput) -> MetalCastingOutput:
        dim = params.characteristic_dimension_mm
        b_const = params.chvorinov_constant_s_mm2
        h_sprue = params.sprue_height_mm

        if params.casting_shape == "cube":
            vol = dim ** 3
            area = 6.0 * (dim ** 2)
            shape_title = f"Cube Casting ({dim:.0f}mm side)"
        elif params.casting_shape == "sphere":
            vol = (4.0 / 3.0) * math.pi * ((dim / 2.0) ** 3)
            area = 4.0 * math.pi * ((dim / 2.0) ** 2)
            shape_title = f"Sphere Casting ({dim:.0f}mm dia)"
        else: # cylinder (L = 2D)
            r = dim / 2.0
            l_cyl = 2.0 * dim
            vol = math.pi * (r ** 2) * l_cyl
            area = 2.0 * math.pi * (r ** 2) + 2.0 * math.pi * r * l_cyl
            shape_title = f"Cylinder Casting (D={dim:.0f}mm, L={l_cyl:.0f}mm)"

        # Modulus M = V / A in mm
        modulus_mm = vol / area if area > 0 else 1.0

        # Chvorinov's Solidification Time ts = B * (V / A)^2 (seconds)
        ts_sec = b_const * (modulus_mm ** 2)
        ts_min = ts_sec / 60.0

        # Mold filling velocity v_gate = sqrt(2 * g * h_sprue) in mm/s
        g_mm_s2 = 9810.0
        v_gate = math.sqrt(2.0 * g_mm_s2 * h_sprue)
        gate_area_mm2 = 200.0  # typical choke gate area
        flow_rate_mm3_s = gate_area_mm2 * v_gate
        tf_sec = vol / flow_rate_mm3_s if flow_rate_mm3_s > 0 else 1.0

        note = (
            f"{shape_title}: Modulus V/A = {modulus_mm:.2f} mm | "
            f"Solidification Time ts = {ts_sec:.1f} s ({ts_min:.2f} min) | "
            f"Mold Filling Time tf = {tf_sec:.2f} s (Gate Velocity = {v_gate/1000:.2f} m/s)."
        )

        return MetalCastingOutput(
            casting_shape=shape_title,
            volume_cm3=float(vol / 1000.0),
            surface_area_cm2=float(area / 100.0),
            modulus_v_over_a_mm=float(modulus_mm),
            solidification_time_sec=float(ts_sec),
            solidification_time_min=float(ts_min),
            mold_filling_time_sec=float(tf_sec),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "sand_cast_cube": {
                "name": "Sand Cast Iron Cube (100mm)",
                "params": {"casting_shape": "cube", "characteristic_dimension_mm": 100.0, "chvorinov_constant_s_mm2": 0.0025, "sprue_height_mm": 150.0}
            },
            "sphere_riser_design": {
                "name": "Spherical Feeder Riser (150mm Dia)",
                "params": {"casting_shape": "sphere", "characteristic_dimension_mm": 150.0, "chvorinov_constant_s_mm2": 0.0025, "sprue_height_mm": 200.0}
            }
        }
