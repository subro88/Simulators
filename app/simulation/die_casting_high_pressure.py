"""
High Pressure Die Casting (HPDC) Hydraulics Physics Engine
===========================================================
Calculates plunger velocity vp, gate velocity vg, cavity fill time tfill,
and intensification pressure Pint.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class DieCastingHighPressureInput(BaseModel):
    plunger_diameter_mm: float = Field(default=70.0, ge=30.0, le=200.0, description="Shot sleeve plunger diameter D_p in mm")
    gate_area_mm2: float = Field(default=150.0, ge=20.0, le=1000.0, description="Ingate total area A_g in mm²")
    casting_volume_cm3: float = Field(default=350.0, ge=20.0, le=3000.0, description="Total shot volume V_cav in cm³")
    intensification_pressure_bar: float = Field(default=600.0, ge=200.0, le=1500.0, description="Intensification metal pressure P_int in bar")


class DieCastingHighPressureOutput(BaseModel):
    gate_velocity_m_s: float
    cavity_fill_time_ms: float
    plunger_fast_shot_speed_m_s: float
    die_locking_force_tons: float
    status_note: str


class DieCastingHighPressureEngine(BaseSimulationEngine):
    name = "die-casting-high-pressure"
    description = "High Pressure Die Casting (HPDC): plunger fast shot speed, gate velocity vg, cavity fill time tfill, and locking force"

    def calculate(self, params: DieCastingHighPressureInput) -> DieCastingHighPressureOutput:
        dp = params.plunger_diameter_mm
        ag_mm2 = params.gate_area_mm2
        v_cav_cm3 = params.casting_volume_cm3
        p_int_bar = params.intensification_pressure_bar

        ap_mm2 = (math.pi / 4.0) * (dp ** 2)
        v_cav_mm3 = v_cav_cm3 * 1000.0

        # Gate velocity vg typical 30 - 60 m/s for Aluminum HPDC
        vg_m_s = 42.0

        # Flow rate Q = Ag * vg (mm^3/s)
        q_mm3_s = ag_mm2 * (vg_m_s * 1000.0)

        # Cavity Fill Time t_fill = V_cav / Q (seconds) -> ms (* 1000)
        t_fill_ms = (v_cav_mm3 / q_mm3_s) * 1000.0 if q_mm3_s > 0 else 20.0

        # Plunger Fast Shot Speed vp = Q / Ap (m/s)
        vp_m_s = (q_mm3_s / ap_mm2) / 1000.0 if ap_mm2 > 0 else 2.5

        # Die Locking Force F_lock = P_int * A_proj (Projected area ~ 300 cm^2)
        a_proj_cm2 = 300.0
        f_lock_kn = (p_int_bar * a_proj_cm2) / 100.0
        f_lock_tons = f_lock_kn / 9.81

        note = (
            f"HPDC Aluminum Casting (V = {v_cav_cm3:.0f} cm³): Gate Velocity vg = {vg_m_s:.1f} m/s | "
            f"Cavity Fill Time = {t_fill_ms:.1f} ms | Plunger Fast Speed = {vp_m_s:.2f} m/s | "
            f"Required Die Locking Force = {f_lock_tons:.0f} Metric Tons."
        )

        return DieCastingHighPressureOutput(
            gate_velocity_m_s=float(vg_m_s),
            cavity_fill_time_ms=float(t_fill_ms),
            plunger_fast_shot_speed_m_s=float(vp_m_s),
            die_locking_force_tons=float(f_lock_tons),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "aluminum_hpdc_housing": {
                "name": "Aluminum Gearbox Housing HPDC (350 cm³)",
                "params": {"plunger_diameter_mm": 70.0, "gate_area_mm2": 150.0, "casting_volume_cm3": 350.0, "intensification_pressure_bar": 600.0}
            },
            "zinc_thin_wall_diecast": {
                "name": "Zinc Alloy Thin-Wall Die Casting (100 cm³)",
                "params": {"plunger_diameter_mm": 50.0, "gate_area_mm2": 80.0, "casting_volume_cm3": 100.0, "intensification_pressure_bar": 450.0}
            }
        }
