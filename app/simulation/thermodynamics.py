"""
First & Second Laws of Thermodynamics & Entropy Physics Engine
================================================================
Calculates heat engine thermal efficiency eta_th, Carnot efficiency,
entropy generation S_gen, net power output W_net, and Second Law efficiency.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ThermodynamicsInput(BaseModel):
    hot_source_temp_c: float = Field(default=600.0, ge=100.0, le=2500.0, description="Hot reservoir temp TH in °C")
    cold_sink_temp_c: float = Field(default=30.0, ge=-50.0, le=200.0, description="Cold reservoir temp TC in °C")
    heat_input_kw: float = Field(default=1000.0, ge=10.0, le=100000.0, description="Heat input rate QH in kW")
    actual_power_kw: float = Field(default=450.0, ge=0.0, le=100000.0, description="Actual work/power output W_net in kW")


class ThermodynamicsOutput(BaseModel):
    carnot_efficiency_pct: float
    actual_efficiency_pct: float
    second_law_efficiency_pct: float
    rejected_heat_kw: float
    entropy_generation_kw_k: float
    status_note: str


class ThermodynamicsEngine(BaseSimulationEngine):
    name = "thermodynamics"
    description = "First and Second Laws of Thermodynamics: Carnot efficiency, actual efficiency, rejected heat QC, and entropy generation S_gen"

    def calculate(self, params: ThermodynamicsInput) -> ThermodynamicsOutput:
        th_k = params.hot_source_temp_c + 273.15
        tc_k = params.cold_sink_temp_c + 273.15
        qh_kw = params.heat_input_kw
        w_net_kw = min(qh_kw * 0.95, params.actual_power_kw)

        # Carnot Efficiency eta_carnot = 1 - (TC / TH)
        carnot_eff = (1.0 - (tc_k / th_k)) * 100.0 if th_k > 0 else 0.0

        # Actual Efficiency eta_actual = W_net / QH
        actual_eff = (w_net_kw / qh_kw) * 100.0 if qh_kw > 0 else 0.0

        # Second Law Efficiency eta_II = eta_actual / eta_carnot
        second_law_eff = (actual_eff / carnot_eff) * 100.0 if carnot_eff > 0 else 0.0

        # Rejected heat QC = QH - W_net
        qc_kw = qh_kw - w_net_kw

        # Entropy generation S_gen = QC/TC - QH/TH (kW/K)
        s_gen = (qc_kw / tc_k) - (qh_kw / th_k) if tc_k > 0 and th_k > 0 else 0.0

        note = (
            f"Thermodynamic Cycle (TH = {params.hot_source_temp_c:.0f}°C, TC = {params.cold_sink_temp_c:.0f}°C): "
            f"Carnot Limit = {carnot_eff:.1f}%, Actual Efficiency = {actual_eff:.1f}% | Net Power = {w_net_kw:.0f} kW | Entropy Gen S_gen = {s_gen:.3f} kW/K."
        )

        return ThermodynamicsOutput(
            carnot_efficiency_pct=float(carnot_eff),
            actual_efficiency_pct=float(actual_eff),
            second_law_efficiency_pct=float(second_law_eff),
            rejected_heat_kw=float(qc_kw),
            entropy_generation_kw_k=float(s_gen),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "steam_power_plant": {
                "name": "High-Pressure Steam Power Plant",
                "params": {"hot_source_temp_c": 560.0, "cold_sink_temp_c": 35.0, "heat_input_kw": 50000.0, "actual_power_kw": 21000.0}
            },
            "car_engine_thermal": {
                "name": "Automotive IC Engine Thermal Efficiency",
                "params": {"hot_source_temp_c": 1200.0, "cold_sink_temp_c": 40.0, "heat_input_kw": 120.0, "actual_power_kw": 42.0}
            }
        }
