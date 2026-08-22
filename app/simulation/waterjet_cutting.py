"""
Abrasive Waterjet Cutting Physics Engine
========================================
Calculates waterjet velocity vj, depth of cut hd, abrasive flow rate ma,
and hydraulic pump power P.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class WaterjetCuttingInput(BaseModel):
    water_pressure_bar: float = Field(default=3800.0, ge=1000.0, le=6000.0, description="Ultra-high pressure P in bar")
    orifice_diameter_mm: float = Field(default=0.3, ge=0.1, le=0.6, description="Jewel orifice diameter d_o in mm")
    abrasive_flow_g_min: float = Field(default=350.0, ge=50.0, le=800.0, description="Garnet abrasive feed rate m_a in g/min")
    traverse_speed_mm_min: float = Field(default=250.0, ge=10.0, le=2000.0, description="Cutting head traverse speed v in mm/min")


class WaterjetCuttingOutput(BaseModel):
    water_jet_velocity_m_s: float
    max_depth_of_cut_mm: float
    water_flow_rate_l_min: float
    pump_power_kw: float
    status_note: str


class WaterjetCuttingEngine(BaseSimulationEngine):
    name = "waterjet-cutting"
    description = "Ultra-high pressure abrasive waterjet (AWJ): jet velocity vj, depth of cut hd, abrasive flow, and pump power P"

    def calculate(self, params: WaterjetCuttingInput) -> WaterjetCuttingOutput:
        p_bar = params.water_pressure_bar
        do = params.orifice_diameter_mm
        ma_g_min = params.abrasive_flow_g_min
        v_traverse = params.traverse_speed_mm_min

        p_pa = p_bar * 1e5
        rho_w = 1000.0  # kg/m^3

        # Jet velocity vj = sqrt(2 * P / rho_w) in m/s
        vj_m_s = math.sqrt((2.0 * p_pa) / rho_w)

        # Water flow rate Q = Cd * A * vj (L/min) where Cd ≈ 0.65
        cd = 0.65
        a_o_m2 = (math.pi / 4.0) * ((do / 1000.0) ** 2)
        q_m3_s = cd * a_o_m2 * vj_m_s
        q_l_min = q_m3_s * 60000.0

        # Hydraulic Pump Power P = P_pa * Q (kW)
        power_kw = (p_pa * q_m3_s) / 1000.0

        # Depth of cut estimate hd (mm) ∝ P^1.25 * ma^0.34 / v^0.43
        h_d_mm = 0.05 * math.pow(p_bar / 1000.0, 1.25) * math.pow(ma_g_min / 100.0, 0.34) / math.pow(v_traverse / 100.0, 0.43)

        note = (
            f"Abrasive Waterjet AWJ (P = {p_bar:.0f} bar, Orifice = {do:.2f} mm): "
            f"Jet Velocity vj = {vj_m_s:.0f} m/s | Water Flow = {q_l_min:.2f} L/min | "
            f"Pump Power = {power_kw:.1f} kW | Max Depth of Cut @ {v_traverse:.0f}mm/min = {h_d_mm:.1f} mm."
        )

        return WaterjetCuttingOutput(
            water_jet_velocity_m_s=float(vj_m_s),
            max_depth_of_cut_mm=float(h_d_mm),
            water_flow_rate_l_min=float(q_l_min),
            pump_power_kw=float(power_kw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "awj_3800bar_steel": {
                "name": "3800 bar AWJ Steel Plate Cutting",
                "params": {"water_pressure_bar": 3800.0, "orifice_diameter_mm": 0.3, "abrasive_flow_g_min": 350.0, "traverse_speed_mm_min": 250.0}
            },
            "awj_5000bar_thick_titanium": {
                "name": "5000 bar High-Pressure Titanium Cut",
                "params": {"water_pressure_bar": 5000.0, "orifice_diameter_mm": 0.25, "abrasive_flow_g_min": 450.0, "traverse_speed_mm_min": 150.0}
            }
        }
