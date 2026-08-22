"""
Vapor Compression Refrigeration Cycle (VCR) Physics Engine
===========================================================
Calculates refrigerating effect QL, compressor work W_comp, COP,
refrigeration tonnage (TR), and condenser heat rejection QC.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RefrigerationCycleInput(BaseModel):
    refrigerant_type: Literal["r134a", "r410a", "r290"] = Field(
        default="r134a",
        description="Working refrigerant fluid"
    )
    evaporator_temp_c: float = Field(default=-10.0, ge=-40.0, le=10.0, description="Evaporator temperature T_evap in °C")
    condenser_temp_c: float = Field(default=45.0, ge=20.0, le=70.0, description="Condenser temperature T_cond in °C")
    mass_flow_rate_kg_s: float = Field(default=0.08, ge=0.005, le=5.0, description="Refrigerant mass flow rate m_dot in kg/s")
    compressor_efficiency: float = Field(default=0.82, ge=0.5, le=1.0, description="Compressor isentropic efficiency eta_c")


class RefrigerationCycleOutput(BaseModel):
    refrigerant_type: str
    refrigerating_effect_kw: float
    refrigeration_capacity_tr: float
    compressor_power_kw: float
    condenser_heat_rejection_kw: float
    cop_cooling: float
    carnot_cop: float
    status_note: str


class RefrigerationCycleEngine(BaseSimulationEngine):
    name = "refrigeration-cycle"
    description = "Vapor Compression Refrigeration Cycle (VCR): cooling capacity QL, compressor power W_comp, COP, and tonnage TR"

    def calculate(self, params: RefrigerationCycleInput) -> RefrigerationCycleOutput:
        t_evap = params.evaporator_temp_c
        t_cond = params.condenser_temp_c
        m_dot = params.mass_flow_rate_kg_s

        # Simplified enthalpy correlations for R134a
        # h1 (sat vapor at T_evap) ≈ 400 + 0.6 * T_evap (kJ/kg)
        h1 = 400.0 + 0.6 * t_evap
        # h3 (sat liquid at T_cond) ≈ 200 + 1.4 * T_cond (kJ/kg)
        h3 = 200.0 + 1.4 * t_cond
        h4 = h3  # Throttling process h4 = h3

        # Isentropic compression h2s
        h2s = h1 + 0.8 * (t_cond - t_evap) + 20.0
        w_comp_ideal = h2s - h1
        w_comp_actual = w_comp_ideal / params.compressor_efficiency
        h2 = h1 + w_comp_actual

        # Refrigerating effect q_L = h1 - h4 (kJ/kg)
        q_l_specific = h1 - h4
        # Heat rejection q_C = h2 - h3
        q_c_specific = h2 - h3

        # Total Powers in kW
        q_l_kw = m_dot * q_l_specific
        w_comp_kw = m_dot * w_comp_actual
        q_c_kw = m_dot * q_c_specific

        # Tons of Refrigeration (1 TR = 3.517 kW)
        tr_capacity = q_l_kw / 3.517

        # COP_cooling = Q_L / W_comp
        cop = q_l_kw / w_comp_kw if w_comp_kw > 0 else 0.0

        # Carnot COP = T_evap_K / (T_cond_K - T_evap_K)
        t_evap_k = t_evap + 273.15
        t_cond_k = t_cond + 273.15
        carnot_cop = t_evap_k / (t_cond_k - t_evap_k) if (t_cond_k - t_evap_k) > 0 else 0.0

        note = (
            f"VCR Cycle ({params.refrigerant_type.upper()}): Cooling Capacity = {tr_capacity:.2f} TR ({q_l_kw:.2f} kW) | "
            f"Compressor Power = {w_comp_kw:.2f} kW | COP = {cop:.2f} (Carnot Limit COP = {carnot_cop:.2f})."
        )

        return RefrigerationCycleOutput(
            refrigerant_type=params.refrigerant_type.upper(),
            refrigerating_effect_kw=float(q_l_kw),
            refrigeration_capacity_tr=float(tr_capacity),
            compressor_power_kw=float(w_comp_kw),
            condenser_heat_rejection_kw=float(q_c_kw),
            cop_cooling=float(cop),
            carnot_cop=float(carnot_cop),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "home_air_conditioner": {
                "name": "Split Air Conditioner (1.5 TR R134a)",
                "params": {"refrigerant_type": "r134a", "evaporator_temp_c": 5.0, "condenser_temp_c": 45.0, "mass_flow_rate_kg_s": 0.035, "compressor_efficiency": 0.85}
            },
            "cold_storage_freezer": {
                "name": "Cold Storage Deep Freezer (-20°C Evap)",
                "params": {"refrigerant_type": "r410a", "evaporator_temp_c": -20.0, "condenser_temp_c": 40.0, "mass_flow_rate_kg_s": 0.06, "compressor_efficiency": 0.80}
            }
        }
