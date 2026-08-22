"""
Stormwater Gravity Pipe Sizing Physics Engine
=============================================
Calculates required pipe diameter D, full flow velocity v_full,
discharge Q_full, and self-cleansing velocity check.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class StormwaterPipeSizingInput(BaseModel):
    design_discharge_m3_s: float = Field(default=0.85, ge=0.05, le=20.0, description="Design storm inflow Q in m³/s")
    pipe_slope_s: float = Field(default=0.005, ge=0.0005, le=0.05, description="Pipe hydraulic bed slope S")
    manning_n_pipe: float = Field(default=0.013, ge=0.009, le=0.025, description="Pipe roughness n (0.013 for concrete)")


class StormwaterPipeSizingOutput(BaseModel):
    design_discharge_m3_s: float
    required_commercial_diameter_mm: float
    full_flow_velocity_m_s: float
    full_flow_discharge_m3_s: float
    is_self_cleansing: bool
    status_note: str


class StormwaterPipeSizingEngine(BaseSimulationEngine):
    name = "stormwater-pipe-sizing"
    description = "Gravity Storm Drain Pipe Hydraulic Sizing: Manning full flow Q_full, velocity v, and minimum self-cleansing speed"

    def calculate(self, params: StormwaterPipeSizingInput) -> StormwaterPipeSizingOutput:
        q_req = params.design_discharge_m3_s
        s = params.pipe_slope_s
        n = params.manning_n_pipe

        # Manning equation for full circular pipe: Q = (pi/4)*D^2 * (1/n) * (D/4)^(2/3) * S^(1/2)
        # Solve for D: D = [ (n * Q * 4^(5/3)) / (pi * S^(1/2)) ]^(3/8)
        coeff = (n * q_req * math.pow(4.0, 5.0 / 3.0)) / (math.pi * math.sqrt(s))
        d_exact_m = math.pow(coeff, 3.0 / 8.0)
        d_exact_mm = d_exact_m * 1000.0

        # Standard commercial sizes in mm: 300, 450, 600, 750, 900, 1050, 1200, 1500, 1800
        commercial_sizes = [300, 450, 600, 750, 900, 1050, 1200, 1500, 1800]
        d_comm_mm = next((size for size in commercial_sizes if size >= d_exact_mm), commercial_sizes[-1])
        d_comm_m = d_comm_mm / 1000.0

        # Full Flow Capacity Q_full & Velocity v_full
        area_full = (math.pi / 4.0) * (d_comm_m ** 2)
        rh_full = d_comm_m / 4.0
        v_full = (1.0 / n) * math.pow(rh_full, 2.0 / 3.0) * math.sqrt(s)
        q_full = area_full * v_full

        is_self_cleansing = v_full >= 0.75

        note = (
            f"Storm Sewer Gravity Pipe (Q_design = {q_req:.2f} m³/s, Slope S = {s}): "
            f"Exact D = {d_exact_mm:.0f} mm -> Selected Commercial Pipe = {d_comm_mm} mm | "
            f"Full Flow Capacity Q_full = {q_full:.2f} m³/s | Velocity v = {v_full:.2f} m/s (Self-Cleansing ≥0.75m/s: {is_self_cleansing})."
        )

        return StormwaterPipeSizingOutput(
            design_discharge_m3_s=float(q_req),
            required_commercial_diameter_mm=float(d_comm_mm),
            full_flow_velocity_m_s=float(v_full),
            full_flow_discharge_m3_s=float(q_full),
            is_self_cleansing=is_self_cleansing,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "city_storm_drain_q85": {
                "name": "City Main Storm Drain Pipe (Q = 0.85 m³/s)",
                "params": {"design_discharge_m3_s": 0.85, "pipe_slope_s": 0.005, "manning_n_pipe": 0.013}
            },
            "subdivision_culvert_q200": {
                "name": "Subdivision Outfall Culvert (Q = 2.0 m³/s)",
                "params": {"design_discharge_m3_s": 2.0, "pipe_slope_s": 0.003, "manning_n_pipe": 0.013}
            }
        }
