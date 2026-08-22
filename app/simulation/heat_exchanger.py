"""
Heat Exchangers (LMTD & Effectiveness-NTU) Physics Engine
===========================================================
Calculates Log Mean Temperature Difference LMTD, heat duty Q,
counter-flow vs parallel-flow effectiveness epsilon, and area A required.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class HeatExchangerInput(BaseModel):
    flow_arrangement: Literal["counter_flow", "parallel_flow"] = Field(
        default="counter_flow",
        description="Heat exchanger flow direction: Counter-Flow or Parallel-Flow"
    )
    hot_fluid_inlet_c: float = Field(default=95.0, ge=30.0, le=500.0, description="Hot fluid inlet temp T_h,in in °C")
    hot_fluid_outlet_c: float = Field(default=55.0, ge=20.0, le=450.0, description="Hot fluid outlet temp T_h,out in °C")
    cold_fluid_inlet_c: float = Field(default=20.0, ge=0.0, le=200.0, description="Cold fluid inlet temp T_c,in in °C")
    cold_fluid_m_dot_kg_s: float = Field(default=1.5, ge=0.1, le=100.0, description="Cold fluid mass flow rate m_c in kg/s")
    cold_fluid_cp_j_kgk: float = Field(default=4184.0, ge=1000.0, le=6000.0, description="Cold fluid specific heat Cp in J/(kg·K)")
    overall_u_w_m2k: float = Field(default=650.0, ge=50.0, le=5000.0, description="Overall heat transfer coefficient U in W/(m²·K)")


class HeatExchangerOutput(BaseModel):
    flow_arrangement: str
    heat_duty_kw: float
    cold_fluid_outlet_c: float
    lmtd_deg_c: float
    required_area_m2: float
    effectiveness_pct: float
    status_note: str


class HeatExchangerEngine(BaseSimulationEngine):
    name = "heat-exchanger"
    description = "Shell & tube / double pipe heat exchanger LMTD and NTU method: heat duty Q, LMTD, and required area A"

    def calculate(self, params: HeatExchangerInput) -> HeatExchangerOutput:
        th_in = params.hot_fluid_inlet_c
        th_out = params.hot_fluid_outlet_c
        tc_in = params.cold_fluid_inlet_c
        m_c = params.cold_fluid_m_dot_kg_s
        cp_c = params.cold_fluid_cp_j_kgk
        u_val = params.overall_u_w_m2k

        # Calculate heat capacity rate C_c = m_c * Cp_c
        c_c = m_c * cp_c

        # Hot fluid temp drop Delta T_h = th_in - th_out
        # Assume hot fluid heat rate Q = C_c * (tc_out - tc_in). Assume hot fluid capacity C_h = 1.2 * C_c
        c_h = c_c * 1.2
        q_w = c_h * (th_in - th_out)
        q_kw = q_w / 1000.0

        tc_out = tc_in + (q_w / c_c) if c_c > 0 else tc_in + 20.0

        if params.flow_arrangement == "counter_flow":
            dt1 = th_in - tc_out
            dt2 = th_out - tc_in
            type_title = "Counter-Flow Heat Exchanger"
        else:
            dt1 = th_in - tc_in
            dt2 = th_out - tc_out
            type_title = "Parallel-Flow Heat Exchanger"

        # LMTD = (dt1 - dt2) / ln(dt1 / dt2)
        if math.isclose(dt1, dt2, abs_tol=1e-3) or dt1 <= 0 or dt2 <= 0:
            lmtd = (dt1 + dt2) / 2.0
        else:
            lmtd = (dt1 - dt2) / math.log(dt1 / dt2)

        lmtd = max(0.5, lmtd)

        # Required area A = Q / (U * LMTD)
        area_m2 = q_w / (u_val * lmtd) if (u_val * lmtd) > 0 else 1.0

        # Maximum possible heat transfer Q_max = C_min * (T_h,in - T_c,in)
        c_min = min(c_c, c_h)
        q_max = c_min * (th_in - tc_in)
        eff_pct = (q_w / q_max) * 100.0 if q_max > 0 else 0.0

        note = (
            f"{type_title}: Heat Duty Q = {q_kw:.1f} kW | LMTD = {lmtd:.1f}°C | "
            f"Cold Outlet T_c,out = {tc_out:.1f}°C | Required Area A = {area_m2:.2f} m² (Effectiveness ε = {eff_pct:.1f}%)."
        )

        return HeatExchangerOutput(
            flow_arrangement=type_title,
            heat_duty_kw=float(q_kw),
            cold_fluid_outlet_c=float(tc_out),
            lmtd_deg_c=float(lmtd),
            required_area_m2=float(area_m2),
            effectiveness_pct=float(eff_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "counter_flow_cooler": {
                "name": "Industrial Oil Cooler (Counter-Flow)",
                "params": {"flow_arrangement": "counter_flow", "hot_fluid_inlet_c": 95.0, "hot_fluid_outlet_c": 55.0, "cold_fluid_inlet_c": 20.0, "cold_fluid_m_dot_kg_s": 1.5, "overall_u_w_m2k": 650.0}
            },
            "parallel_flow_preheater": {
                "name": "Water Preheater (Parallel-Flow)",
                "params": {"flow_arrangement": "parallel_flow", "hot_fluid_inlet_c": 120.0, "hot_fluid_outlet_c": 70.0, "cold_fluid_inlet_c": 25.0, "cold_fluid_m_dot_kg_s": 2.0, "overall_u_w_m2k": 800.0}
            }
        }
