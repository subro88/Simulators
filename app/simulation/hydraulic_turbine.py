"""
Hydraulic Turbines (Pelton, Francis, Kaplan) Physics Engine
============================================================
Calculates water power P_w, runner power P_r, shaft power P_shaft,
specific speed Ns, and hydraulic/overall efficiency.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class HydraulicTurbineInput(BaseModel):
    turbine_type: Literal["pelton_wheel", "francis_turbine", "kaplan_turbine"] = Field(
        default="pelton_wheel",
        description="Hydraulic turbine classification"
    )
    net_head_m: float = Field(default=250.0, ge=5.0, le=1000.0, description="Net operating head H in meters")
    discharge_m3_s: float = Field(default=2.5, ge=0.1, le=200.0, description="Water flow rate Q in m³/s")
    runner_speed_rpm: float = Field(default=500.0, ge=50.0, le=2000.0, description="Runner rotational speed N in RPM")
    overall_efficiency: float = Field(default=0.88, ge=0.5, le=0.96, description="Overall turbine efficiency eta_o")


class HydraulicTurbineOutput(BaseModel):
    turbine_type: str
    water_power_mw: float
    shaft_power_mw: float
    specific_speed_ns: float
    jet_or_flow_velocity_ms: float
    runner_bucket_speed_ms: float
    status_note: str


class HydraulicTurbineEngine(BaseSimulationEngine):
    name = "hydraulic-turbine"
    description = "Hydraulic turbine power generation: Pelton/Francis/Kaplan water power P_w, shaft power P_s, and specific speed N_s"

    def calculate(self, params: HydraulicTurbineInput) -> HydraulicTurbineOutput:
        g = 9.81
        rho = 1000.0
        h = params.net_head_m
        q = params.discharge_m3_s
        n = params.runner_speed_rpm

        # Water Power P_w = rho * g * Q * H (in W -> MW)
        p_w_w = rho * g * q * h
        p_w_mw = p_w_w / 1e6

        # Shaft Power P_shaft = P_w * eta_o (in MW)
        p_shaft_mw = p_w_mw * params.overall_efficiency
        p_shaft_kw = p_shaft_mw * 1000.0

        # Specific Speed N_s = N * sqrt(P_kw) / H^(5/4)
        n_s = (n * math.sqrt(p_shaft_kw)) / (h ** 1.25) if h > 0 else 0.0

        # Jet Velocity V_1 = C_v * sqrt(2 * g * H)
        c_v = 0.98
        v_jet = c_v * math.sqrt(2.0 * g * h)

        # Runner Bucket Speed u1 = 0.46 * V_1
        u1 = 0.46 * v_jet

        type_titles = {
            "pelton_wheel": "Pelton Impulse Turbine (High Head)",
            "francis_turbine": "Francis Reaction Turbine (Medium Head)",
            "kaplan_turbine": "Kaplan Axial Turbine (Low Head)"
        }
        title = type_titles.get(params.turbine_type, "Hydraulic Turbine")

        note = (
            f"{title}: Water Power P_w = {p_w_mw:.2f} MW | Generated Shaft Power = {p_shaft_mw:.2f} MW | "
            f"Jet Velocity = {v_jet:.1f} m/s | Specific Speed N_s = {n_s:.1f} (Overall η = {params.overall_efficiency*100:.1f}%)."
        )

        return HydraulicTurbineOutput(
            turbine_type=title,
            water_power_mw=float(p_w_mw),
            shaft_power_mw=float(p_shaft_mw),
            specific_speed_ns=float(n_s),
            jet_or_flow_velocity_ms=float(v_jet),
            runner_bucket_speed_ms=float(u1),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "high_head_pelton": {
                "name": "High-Head Hydro Plant (Pelton 300m)",
                "params": {"turbine_type": "pelton_wheel", "net_head_m": 300.0, "discharge_m3_s": 2.0, "runner_speed_rpm": 600.0, "overall_efficiency": 0.89}
            },
            "medium_head_francis": {
                "name": "Medium-Head Hydro Plant (Francis 120m)",
                "params": {"turbine_type": "francis_turbine", "net_head_m": 120.0, "discharge_m3_s": 15.0, "runner_speed_rpm": 375.0, "overall_efficiency": 0.91}
            }
        }
