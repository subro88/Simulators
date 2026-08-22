"""
Centrifugal Pump Performance & NPSH Physics Engine
===================================================
Calculates manometric head Hm, hydraulic power P_hyd, shaft power P_in,
overall pump efficiency eta_o, NPSH_a, and cavitation risk.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CentrifugalPumpInput(BaseModel):
    flow_rate_lps: float = Field(default=25.0, ge=1.0, le=500.0, description="Pump flow rate Q in L/s")
    suction_lift_m: float = Field(default=3.5, ge=0.0, le=10.0, description="Suction static lift h_s in meters")
    delivery_head_m: float = Field(default=28.0, ge=2.0, le=200.0, description="Delivery static head h_d in meters")
    total_friction_loss_m: float = Field(default=4.5, ge=0.1, le=50.0, description="Total pipe friction head loss h_f in meters")
    pump_speed_rpm: float = Field(default=1440.0, ge=300.0, le=3600.0, description="Impeller rotational speed N in RPM")
    overall_efficiency: float = Field(default=0.75, ge=0.3, le=0.95, description="Overall pump efficiency eta_o")
    required_npsh_m: float = Field(default=2.5, ge=0.5, le=10.0, description="Manufacturer Required NPSH_r in meters")


class CentrifugalPumpOutput(BaseModel):
    manometric_head_m: float
    hydraulic_power_kw: float
    shaft_input_power_kw: float
    available_npsh_m: float
    npsh_margin_m: float
    cavitation_risk: bool
    status_note: str


class CentrifugalPumpEngine(BaseSimulationEngine):
    name = "centrifugal-pump"
    description = "Centrifugal pump characteristics: manometric head Hm, hydraulic & shaft power, NPSHa, and cavitation check"

    def calculate(self, params: CentrifugalPumpInput) -> CentrifugalPumpOutput:
        g = 9.81
        rho = 1000.0  # water density
        q_m3s = params.flow_rate_lps / 1000.0

        # Manometric head Hm = h_s + h_d + h_f
        h_m = params.suction_lift_m + params.delivery_head_m + params.total_friction_loss_m

        # Hydraulic Power P_hyd = rho * g * Q * Hm (kW)
        p_hyd_kw = (rho * g * q_m3s * h_m) / 1000.0

        # Shaft Input Power P_in = P_hyd / eta_o
        p_in_kw = p_hyd_kw / params.overall_efficiency if params.overall_efficiency > 0 else p_hyd_kw

        # Available NPSH_a = (P_atm - P_v)/(rho*g) - h_s - h_fs
        # P_atm = 101.3 kPa, P_v = 2.34 kPa (water at 20°C) => (P_atm - P_v)/(rho*g) ≈ 10.1 m
        h_atm_v = 10.1
        suction_friction_m = params.total_friction_loss_m * 0.25  # ~25% loss in suction line
        npsh_a = h_atm_v - params.suction_lift_m - suction_friction_m

        npsh_margin = npsh_a - params.required_npsh_m
        is_cavitating = npsh_margin < 0.5

        status_text = "SAFE FROM CAVITATION" if not is_cavitating else "HIGH CAVITATION RISK! (Increase NPSHa or lower suction lift)"

        note = (
            f"Centrifugal Pump (N = {params.pump_speed_rpm:.0f} RPM): Flow Q = {params.flow_rate_lps:.1f} L/s, "
            f"Manometric Head Hm = {h_m:.1f} m | Shaft Power = {p_in_kw:.2f} kW | NPSHa = {npsh_a:.2f} m vs Required {params.required_npsh_m:.1f} m ({status_text})."
        )

        return CentrifugalPumpOutput(
            manometric_head_m=float(h_m),
            hydraulic_power_kw=float(p_hyd_kw),
            shaft_input_power_kw=float(p_in_kw),
            available_npsh_m=float(npsh_a),
            npsh_margin_m=float(npsh_margin),
            cavitation_risk=is_cavitating,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "water_supply_pump": {
                "name": "Water Supply Booster Pump",
                "params": {"flow_rate_lps": 25.0, "suction_lift_m": 3.0, "delivery_head_m": 25.0, "total_friction_loss_m": 4.0, "pump_speed_rpm": 1440.0, "overall_efficiency": 0.78, "required_npsh_m": 2.2}
            },
            "high_lift_irrigation": {
                "name": "High-Lift Agricultural Irrigation Pump",
                "params": {"flow_rate_lps": 60.0, "suction_lift_m": 5.5, "delivery_head_m": 45.0, "total_friction_loss_m": 8.0, "pump_speed_rpm": 2900.0, "overall_efficiency": 0.82, "required_npsh_m": 3.5}
            }
        }
