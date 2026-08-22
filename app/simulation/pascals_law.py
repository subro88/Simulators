"""
Pascal's Law & Hydraulic Force Multiplication Physics Engine
============================================================
Calculates pressure P, force multiplication F2/F1, mechanical advantage MA,
slave piston displacement x2, and hydraulic fluid work conservation.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PascalsLawInput(BaseModel):
    master_piston_dia_mm: float = Field(default=20.0, ge=5.0, le=100.0, description="Master input piston diameter d1 in mm")
    slave_piston_dia_mm: float = Field(default=100.0, ge=10.0, le=500.0, description="Slave output piston diameter d2 in mm")
    input_force_n: float = Field(default=200.0, ge=10.0, le=5000.0, description="Input effort F1 in N")
    master_stroke_mm: float = Field(default=50.0, ge=5.0, le=300.0, description="Master piston stroke displacement x1 in mm")


class PascalsLawOutput(BaseModel):
    hydraulic_pressure_bar: float
    mechanical_advantage: float
    output_force_kn: float
    slave_stroke_mm: float
    fluid_work_joules: float
    status_note: str


class PascalsLawEngine(BaseSimulationEngine):
    name = "pascals-law"
    description = "Pascal's Law fluid pressure transmission: F1/A1 = F2/A2, force multiplication, and stroke conservation"

    def calculate(self, params: PascalsLawInput) -> PascalsLawOutput:
        d1_m = params.master_piston_dia_mm / 1000.0
        d2_m = params.slave_piston_dia_mm / 1000.0

        a1_m2 = (math.pi * (d1_m ** 2)) / 4.0
        a2_m2 = (math.pi * (d2_m ** 2)) / 4.0

        # Hydraulic Pressure P = F1 / A1 (in Pa & bar)
        f1_n = params.input_force_n
        p_pa = f1_n / a1_m2 if a1_m2 > 0 else 0.0
        p_bar = p_pa / 1e5

        # Mechanical Advantage MA = A2 / A1 = (d2 / d1)^2
        ma = a2_m2 / a1_m2 if a1_m2 > 0 else 1.0

        # Output Force F2 = P * A2 = F1 * MA (in kN)
        f2_n = p_pa * a2_m2
        f2_kn = f2_n / 1000.0

        # Slave stroke x2 = x1 / MA
        x1_m = params.master_stroke_mm / 1000.0
        x2_m = x1_m / ma if ma > 0 else 0.0
        x2_mm = x2_m * 1000.0

        # Work W = F1 * x1 = F2 * x2 (Joules)
        work_j = f1_n * x1_m

        note = (
            f"Hydraulic Press (MA = {ma:.1f}x): Pressure P = {p_bar:.2f} bar | "
            f"Output Force F2 = {f2_kn:.2f} kN (from F1 = {f1_n:.0f} N) | Slave Stroke x2 = {x2_mm:.2f} mm (Work = {work_j:.1f} J)."
        )

        return PascalsLawOutput(
            hydraulic_pressure_bar=float(p_bar),
            mechanical_advantage=float(ma),
            output_force_kn=float(f2_kn),
            slave_stroke_mm=float(x2_mm),
            fluid_work_joules=float(work_j),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "hydraulic_car_jack": {
                "name": "Hydraulic Garage Car Jack",
                "params": {"master_piston_dia_mm": 15.0, "slave_piston_dia_mm": 120.0, "input_force_n": 300.0, "master_stroke_mm": 60.0}
            },
            "automotive_brake_system": {
                "name": "Automotive Hydraulic Brake System",
                "params": {"master_piston_dia_mm": 22.0, "slave_piston_dia_mm": 54.0, "input_force_n": 450.0, "master_stroke_mm": 25.0}
            }
        }
