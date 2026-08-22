"""
Traffic Flow & Speed-Density (Greenshields Model) Physics Engine
================================================================
Calculates free-flow speed vf, jam density kj, traffic flow q,
maximum highway capacity qmax, and level of service LOS.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class TrafficFlowGreenshieldsInput(BaseModel):
    free_flow_speed_vf_kmh: float = Field(default=90.0, ge=40.0, le=140.0, description="Free-flow speed vf in km/h")
    jam_density_kj_veh_km: float = Field(default=120.0, ge=50.0, le=250.0, description="Jam density kj in vehicles/km")
    current_density_k_veh_km: float = Field(default=40.0, ge=0.0, le=250.0, description="Operating traffic density k in vehicles/km")


class TrafficFlowGreenshieldsOutput(BaseModel):
    space_mean_speed_v_kmh: float
    traffic_flow_q_veh_hr: float
    maximum_capacity_qmax_veh_hr: float
    optimum_density_ko_veh_km: float
    optimum_speed_vo_kmh: float
    level_of_service_los: str
    status_note: str


class TrafficFlowGreenshieldsEngine(BaseSimulationEngine):
    name = "traffic-flow-greenshields"
    description = "Greenshields Linear Speed-Density Traffic Model: Flow rate q = k*v, highway capacity qmax, and Level of Service (LOS)"

    def calculate(self, params: TrafficFlowGreenshieldsInput) -> TrafficFlowGreenshieldsOutput:
        vf = params.free_flow_speed_vf_kmh
        kj = params.jam_density_kj_veh_km
        k = params.current_density_k_veh_km

        # Greenshields Speed-Density v = vf * (1 - k / kj)
        k = min(k, kj)
        v = vf * (1.0 - k / kj)

        # Traffic Flow Rate q = k * v (veh/hr)
        q = k * v

        # Optimum Speed vo = vf / 2, Optimum Density ko = kj / 2
        vo = vf / 2.0
        ko = kj / 2.0

        # Max Highway Capacity qmax = (vf * kj) / 4 (veh/hr/lane)
        qmax = (vf * kj) / 4.0

        # Level of Service LOS (A to F based on v / vf ratio)
        v_ratio = v / vf if vf > 0 else 0.0
        if v_ratio >= 0.85:
            los = "LOS A (Free Flow — Low Density)"
        elif v_ratio >= 0.70:
            los = "LOS B (Reasonably Free Flow)"
        elif v_ratio >= 0.55:
            los = "LOS C (Stable Flow)"
        elif v_ratio >= 0.45:
            los = "LOS D (Approaching Unstable Flow)"
        elif v_ratio >= 0.30:
            los = "LOS E (Capacity Flow — At Maximum qmax)"
        else:
            los = "LOS F (Forced Flow / Gridlock Breakdown)"

        note = (
            f"Greenshields Traffic Model (vf = {vf:.0f} km/h, kj = {kj:.0f} v/km): "
            f"At Density k = {k:.0f} v/km -> Speed v = {v:.1f} km/h | Flow Rate q = {q:.0f} veh/hr/lane | "
            f"Max Capacity qmax = {qmax:.0f} veh/hr/lane @ ko = {ko:.0f} v/km ({los})."
        )

        return TrafficFlowGreenshieldsOutput(
            space_mean_speed_v_kmh=float(v),
            traffic_flow_q_veh_hr=float(q),
            maximum_capacity_qmax_veh_hr=float(qmax),
            optimum_density_ko_veh_km=float(ko),
            optimum_speed_vo_kmh=float(vo),
            level_of_service_los=los,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "expressway_free_flow": {
                "name": "Expressway Free Flow Traffic (k = 20 v/km)",
                "params": {"free_flow_speed_vf_kmh": 100.0, "jam_density_kj_veh_km": 120.0, "current_density_k_veh_km": 20.0}
            },
            "peak_hour_capacity": {
                "name": "Peak Hour Maximum Capacity Flow (k = 60 v/km)",
                "params": {"free_flow_speed_vf_kmh": 90.0, "jam_density_kj_veh_km": 120.0, "current_density_k_veh_km": 60.0}
            }
        }
