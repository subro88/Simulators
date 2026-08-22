"""
Hydraulic Circuits & Actuators Physics Engine
=============================================
Calculates hydraulic cylinder extension force F_ext, retraction force F_ret,
velocities v_ext & v_ret, and relief valve system power.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class HydraulicCircuitInput(BaseModel):
    system_pressure_bar: float = Field(default=160.0, ge=10.0, le=350.0, description="Pump relief pressure P in bar")
    flow_rate_lpm: float = Field(default=40.0, ge=1.0, le=300.0, description="Pump flow rate Q in L/min")
    piston_diameter_mm: float = Field(default=80.0, ge=20.0, le=300.0, description="Cylinder piston bore diameter D in mm")
    rod_diameter_mm: float = Field(default=45.0, ge=10.0, le=200.0, description="Piston rod diameter d in mm")
    stroke_length_mm: float = Field(default=400.0, ge=50.0, le=2000.0, description="Cylinder stroke L in mm")


class HydraulicCircuitOutput(BaseModel):
    extend_force_kn: float
    retract_force_kn: float
    extend_velocity_mm_s: float
    retract_velocity_mm_s: float
    extend_time_sec: float
    retract_time_sec: float
    system_power_kw: float
    status_note: str


class HydraulicCircuitEngine(BaseSimulationEngine):
    name = "hydraulic-circuit"
    description = "Hydraulic cylinder actuators & DCV circuit: extension/retraction forces, speeds, cycle times, and power"

    def calculate(self, params: HydraulicCircuitInput) -> HydraulicCircuitOutput:
        p_pa = params.system_pressure_bar * 1e5
        d_p = params.piston_diameter_mm / 1000.0
        d_r = params.rod_diameter_mm / 1000.0

        a_p_m2 = (math.pi * (d_p ** 2)) / 4.0
        a_r_m2 = (math.pi * (d_r ** 2)) / 4.0
        a_annular_m2 = a_p_m2 - a_r_m2

        # Forces in kN
        f_ext_kn = (p_pa * a_p_m2) / 1000.0
        f_ret_kn = (p_pa * a_annular_m2) / 1000.0 if a_annular_m2 > 0 else f_ext_kn

        # Flow Q in m^3/s
        q_m3s = (params.flow_rate_lpm / 60000.0)

        # Velocities v = Q / A in m/s -> mm/s
        v_ext_m_s = q_m3s / a_p_m2 if a_p_m2 > 0 else 0.0
        v_ret_m_s = q_m3s / a_annular_m2 if a_annular_m2 > 0 else v_ext_m_s

        v_ext_mm_s = v_ext_m_s * 1000.0
        v_ret_mm_s = v_ret_m_s * 1000.0

        # Stroke time t = Stroke / v
        s_m = params.stroke_length_mm / 1000.0
        t_ext_s = s_m / v_ext_m_s if v_ext_m_s > 0 else 0.0
        t_ret_s = s_m / v_ret_m_s if v_ret_m_s > 0 else 0.0

        # System Hydraulic Power P = p * Q (kW)
        power_kw = (p_pa * q_m3s) / 1000.0

        note = (
            f"Double-Acting Hydraulic Cylinder (P = {params.system_pressure_bar:.0f} bar): Extend Force = {f_ext_kn:.1f} kN (Speed = {v_ext_mm_s:.0f} mm/s, t = {t_ext_s:.2f}s) | "
            f"Retract Force = {f_ret_kn:.1f} kN (Speed = {v_ret_mm_s:.0f} mm/s, t = {t_ret_s:.2f}s) | System Power = {power_kw:.1f} kW."
        )

        return HydraulicCircuitOutput(
            extend_force_kn=float(f_ext_kn),
            retract_force_kn=float(f_ret_kn),
            extend_velocity_mm_s=float(v_ext_mm_s),
            retract_velocity_mm_s=float(v_ret_mm_s),
            extend_time_sec=float(t_ext_s),
            retract_time_sec=float(t_ret_s),
            system_power_kw=float(power_kw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "excavator_boom_cylinder": {
                "name": "Excavator Heavy Boom Cylinder",
                "params": {"system_pressure_bar": 210.0, "flow_rate_lpm": 120.0, "piston_diameter_mm": 125.0, "rod_diameter_mm": 70.0, "stroke_length_mm": 800.0}
            },
            "industrial_press_ram": {
                "name": "Industrial Press Fast Ram Cylinder",
                "params": {"system_pressure_bar": 160.0, "flow_rate_lpm": 60.0, "piston_diameter_mm": 80.0, "rod_diameter_mm": 45.0, "stroke_length_mm": 400.0}
            }
        }
