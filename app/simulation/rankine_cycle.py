"""
Rankine Steam Power Cycle Physics Engine
=========================================
Calculates turbine work Wt, pump work Wp, boiler heat input Qin, condenser Qout,
thermal efficiency eta_th, and Back Work Ratio (BWR).
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RankineCycleInput(BaseModel):
    boiler_pressure_bar: float = Field(default=80.0, ge=10.0, le=220.0, description="Boiler pressure P2 in bar")
    condenser_pressure_bar: float = Field(default=0.08, ge=0.02, le=1.0, description="Condenser pressure P1 in bar")
    turbine_inlet_temp_c: float = Field(default=500.0, ge=200.0, le=700.0, description="Superheated steam inlet temp T3 in °C")
    steam_flow_rate_kg_s: float = Field(default=25.0, ge=1.0, le=500.0, description="Steam mass flow rate m_dot in kg/s")
    turbine_isentropic_efficiency: float = Field(default=0.88, ge=0.5, le=1.0, description="Turbine isentropic efficiency eta_t")


class RankineCycleOutput(BaseModel):
    turbine_power_mw: float
    pump_power_mw: float
    net_power_mw: float
    boiler_heat_input_mw: float
    condenser_heat_output_mw: float
    thermal_efficiency_pct: float
    back_work_ratio_pct: float
    status_note: str


class RankineCycleEngine(BaseSimulationEngine):
    name = "rankine-cycle"
    description = "Rankine steam power cycle thermodynamics: turbine power, pump work, thermal efficiency eta_th, and BWR"

    def calculate(self, params: RankineCycleInput) -> RankineCycleOutput:
        p_boiler = params.boiler_pressure_bar
        p_cond = params.condenser_pressure_bar
        m_dot = params.steam_flow_rate_kg_s

        # Simplified steam property correlations for demonstration
        # h1 (saturated liquid at P_cond) ≈ 173 kJ/kg
        h1 = 173.0
        # v1 (saturated liquid volume) ≈ 0.001 m^3/kg
        v1 = 0.00101
        # Pump work w_p = v1 * (P2 - P1) in kJ/kg
        w_p_specific = v1 * (p_boiler - p_cond) * 100.0  # bar to kPa
        h2 = h1 + w_p_specific

        # h3 (superheated steam at P_boiler and T3)
        h3 = 3400.0 + 1.8 * (params.turbine_inlet_temp_c - 400.0) - 2.5 * (p_boiler - 50.0)

        # h4s (isentropic turbine exit)
        h4s = 2100.0 + 0.5 * (params.turbine_inlet_temp_c - 400.0)
        w_t_ideal = h3 - h4s
        w_t_actual = w_t_ideal * params.turbine_isentropic_efficiency
        h4 = h3 - w_t_actual

        # Specific Heat Duties
        q_in_specific = h3 - h2
        q_out_specific = h4 - h1

        w_net_specific = w_t_actual - w_p_specific

        # Total Powers in MW
        p_turbine_mw = (m_dot * w_t_actual) / 1000.0
        p_pump_mw = (m_dot * w_p_specific) / 1000.0
        p_net_mw = (m_dot * w_net_specific) / 1000.0

        q_in_mw = (m_dot * q_in_specific) / 1000.0
        q_out_mw = (m_dot * q_out_specific) / 1000.0

        eff_pct = (w_net_specific / q_in_specific) * 100.0 if q_in_specific > 0 else 0.0
        bwr_pct = (w_p_specific / w_t_actual) * 100.0 if w_t_actual > 0 else 0.0

        note = (
            f"Rankine Steam Cycle (P_boiler = {p_boiler:.0f} bar, T3 = {params.turbine_inlet_temp_c:.0f}°C): "
            f"Net Power = {p_net_mw:.1f} MW | Thermal Efficiency η_th = {eff_pct:.1f}% | Back Work Ratio = {bwr_pct:.2f}%."
        )

        return RankineCycleOutput(
            turbine_power_mw=float(p_turbine_mw),
            pump_power_mw=float(p_pump_mw),
            net_power_mw=float(p_net_mw),
            boiler_heat_input_mw=float(q_in_mw),
            condenser_heat_output_mw=float(q_out_mw),
            thermal_efficiency_pct=float(eff_pct),
            back_work_ratio_pct=float(bwr_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "subcritical_power_station": {
                "name": "Subcritical Utility Power Station (80 bar, 500°C)",
                "params": {"boiler_pressure_bar": 80.0, "condenser_pressure_bar": 0.08, "turbine_inlet_temp_c": 500.0, "steam_flow_rate_kg_s": 50.0, "turbine_isentropic_efficiency": 0.88}
            },
            "high_eff_supercritical": {
                "name": "High-Efficiency Supercritical Plant (160 bar, 560°C)",
                "params": {"boiler_pressure_bar": 160.0, "condenser_pressure_bar": 0.06, "turbine_inlet_temp_c": 560.0, "steam_flow_rate_kg_s": 80.0, "turbine_isentropic_efficiency": 0.90}
            }
        }
