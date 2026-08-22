"""
Major & Minor Friction Losses in Pipe Networks Physics Engine
=============================================================
Calculates Darcy friction factor f, major head loss hf, minor head loss hm,
total head loss HL, and required pumping power P.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class FluidFlowInput(BaseModel):
    pipe_diameter_mm: float = Field(default=80.0, ge=10.0, le=1000.0, description="Pipe internal diameter d in mm")
    pipe_length_m: float = Field(default=100.0, ge=1.0, le=5000.0, description="Total pipe length L in meters")
    flow_rate_lps: float = Field(default=15.0, ge=0.1, le=1000.0, description="Volumetric flow rate Q in L/s")
    pipe_roughness_mm: float = Field(default=0.045, ge=0.001, le=5.0, description="Equivalent sand roughness epsilon in mm (Commercial Steel ≈ 0.045mm)")
    minor_loss_coeff_k: float = Field(default=3.5, ge=0.0, le=50.0, description="Sum of minor loss coefficients K_m (elbows, valves, tees)")
    fluid_density_kg_m3: float = Field(default=1000.0, ge=500.0, le=1500.0, description="Fluid density rho in kg/m³")


class FluidFlowOutput(BaseModel):
    flow_velocity_ms: float
    reynolds_number: float
    darcy_friction_factor: float
    major_head_loss_m: float
    minor_head_loss_m: float
    total_head_loss_m: float
    pressure_drop_kpa: float
    pumping_power_kw: float
    status_note: str


class FluidFlowEngine(BaseSimulationEngine):
    name = "fluid-flow"
    description = "Pipe network friction losses: Darcy-Weisbach hf, minor losses hm, pressure drop delta_P, and pumping power"

    def calculate(self, params: FluidFlowInput) -> FluidFlowOutput:
        d = params.pipe_diameter_mm / 1000.0
        l = params.pipe_length_m
        q_m3s = params.flow_rate_lps / 1000.0
        g = 9.81

        area_m2 = (math.pi * (d ** 2)) / 4.0
        v = q_m3s / area_m2 if area_m2 > 0 else 0.0

        # Viscosity assumptions for water (mu = 1.0e-3 Pa*s)
        mu = 1.0e-3
        re = (params.fluid_density_kg_m3 * v * d) / mu if mu > 0 else 1000.0

        # Friction factor f calculation: Swamee-Jain approximation
        eps_rel = (params.pipe_roughness_mm / 1000.0) / d
        if re < 2300.0:
            f = 64.0 / re if re > 0 else 0.04
        else:
            term = (eps_rel / 3.7) + (5.74 / (re ** 0.9))
            f = 0.25 / ((math.log10(term)) ** 2)

        # Major Head Loss h_f = f * (L / d) * (v^2 / 2g)
        h_f = f * (l / d) * ((v ** 2) / (2.0 * g)) if d > 0 else 0.0

        # Minor Head Loss h_m = K_m * (v^2 / 2g)
        h_m = params.minor_loss_coeff_k * ((v ** 2) / (2.0 * g))

        h_total = h_f + h_m

        # Pressure drop delta_P = rho * g * H_L (kPa)
        delta_p_kpa = (params.fluid_density_kg_m3 * g * h_total) / 1000.0

        # Pumping power P = rho * g * Q * H_L (kW)
        power_kw = (params.fluid_density_kg_m3 * g * q_m3s * h_total) / 1000.0

        note = (
            f"Pipe Network: Flow Velocity = {v:.2f} m/s | Friction Factor f = {f:.4f} | "
            f"Major Loss hf = {h_f:.2f} m, Minor Loss hm = {h_m:.2f} m | Total Loss H_L = {h_total:.2f} m (Power = {power_kw:.2f} kW)."
        )

        return FluidFlowOutput(
            flow_velocity_ms=float(v),
            reynolds_number=float(re),
            darcy_friction_factor=float(f),
            major_head_loss_m=float(h_f),
            minor_head_loss_m=float(h_m),
            total_head_loss_m=float(h_total),
            pressure_drop_kpa=float(delta_p_kpa),
            pumping_power_kw=float(power_kw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "city_water_pipeline": {
                "name": "City Water Distribution Pipeline",
                "params": {"pipe_diameter_mm": 150.0, "pipe_length_m": 500.0, "flow_rate_lps": 35.0, "pipe_roughness_mm": 0.045, "minor_loss_coeff_k": 5.0}
            },
            "industrial_cooling_loop": {
                "name": "Industrial Cooling Loop",
                "params": {"pipe_diameter_mm": 80.0, "pipe_length_m": 120.0, "flow_rate_lps": 18.0, "pipe_roughness_mm": 0.015, "minor_loss_coeff_k": 8.5}
            }
        }
