"""
Conduction & Convection Heat Transfer Physics Engine
=====================================================
Calculates 1D steady-state heat flux q, total thermal resistance R_th,
overall heat transfer coefficient U, and composite wall interface temperatures.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class HeatTransferInput(BaseModel):
    layer1_thickness_mm: float = Field(default=100.0, ge=5.0, le=500.0, description="Layer 1 (Brick) thickness L1 in mm")
    layer1_k_w_mk: float = Field(default=0.8, ge=0.01, le=400.0, description="Layer 1 thermal conductivity k1 in W/(m·K)")
    layer2_thickness_mm: float = Field(default=50.0, ge=5.0, le=500.0, description="Layer 2 (Insulation) thickness L2 in mm")
    layer2_k_w_mk: float = Field(default=0.04, ge=0.01, le=400.0, description="Layer 2 thermal conductivity k2 in W/(m·K)")
    inner_temp_c: float = Field(default=200.0, ge=-50.0, le=1500.0, description="Hot inner fluid/surface temp T1 in °C")
    outer_temp_c: float = Field(default=25.0, ge=-50.0, le=500.0, description="Cold outer ambient temp T2 in °C")
    inner_conv_h1: float = Field(default=25.0, ge=2.0, le=1000.0, description="Inner convection coefficient h1 in W/(m²·K)")
    outer_conv_h2: float = Field(default=10.0, ge=2.0, le=1000.0, description="Outer convection coefficient h2 in W/(m²·K)")
    wall_area_m2: float = Field(default=1.0, ge=0.1, le=100.0, description="Wall surface area A in m²")


class HeatTransferOutput(BaseModel):
    total_thermal_resistance_k_w: float
    overall_heat_transfer_u_w_m2k: float
    heat_transfer_rate_w: float
    heat_flux_w_m2: float
    interface_temp_c: float
    outer_surface_temp_c: float
    status_note: str


class HeatTransferEngine(BaseSimulationEngine):
    name = "heat-transfer"
    description = "1D steady heat conduction & convection through composite walls: thermal resistance R_th, U-factor, and heat flux"

    def calculate(self, params: HeatTransferInput) -> HeatTransferOutput:
        l1 = params.layer1_thickness_mm / 1000.0
        l2 = params.layer2_thickness_mm / 1000.0
        k1 = params.layer1_k_w_mk
        k2 = params.layer2_k_w_mk
        a = params.wall_area_m2

        # Thermal Resistances (K/W)
        r_conv1 = 1.0 / (params.inner_conv_h1 * a) if params.inner_conv_h1 * a > 0 else 0.0
        r_cond1 = l1 / (k1 * a) if k1 * a > 0 else 0.0
        r_cond2 = l2 / (k2 * a) if k2 * a > 0 else 0.0
        r_conv2 = 1.0 / (params.outer_conv_h2 * a) if params.outer_conv_h2 * a > 0 else 0.0

        r_total = r_conv1 + r_cond1 + r_cond2 + r_conv2

        # Heat rate Q = (T_hot - T_cold) / R_total
        delta_t = params.inner_temp_c - params.outer_temp_c
        q_w = delta_t / r_total if r_total > 0 else 0.0
        q_flux_w_m2 = q_w / a if a > 0 else 0.0

        # Overall coefficient U = 1 / (R_total * A)
        u_w_m2k = 1.0 / (r_total * a) if r_total * a > 0 else 0.0

        # Interface Temperature between layer 1 and 2
        t_inner_surf = params.inner_temp_c - (q_w * r_conv1)
        t_int_c = t_inner_surf - (q_w * r_cond1)
        t_outer_surf_c = t_int_c - (q_w * r_cond2)

        note = (
            f"Composite Wall Heat Transfer: Heat Rate Q = {q_w:.1f} W (Flux q = {q_flux_w_m2:.1f} W/m²) | "
            f"Overall U = {u_w_m2k:.3f} W/(m²·K) | Interface Temp = {t_int_c:.1f}°C, Outer Surface = {t_outer_surf_c:.1f}°C."
        )

        return HeatTransferOutput(
            total_thermal_resistance_k_w=float(r_total),
            overall_heat_transfer_u_w_m2k=float(u_w_m2k),
            heat_transfer_rate_w=float(q_w),
            heat_flux_w_m2=float(q_flux_w_m2),
            interface_temp_c=float(t_int_c),
            outer_surface_temp_c=float(t_outer_surf_c),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "building_insulated_wall": {
                "name": "Insulated Building Brick Wall",
                "params": {"layer1_thickness_mm": 110.0, "layer1_k_w_mk": 0.7, "layer2_thickness_mm": 50.0, "layer2_k_w_mk": 0.035, "inner_temp_c": 22.0, "outer_temp_c": -5.0}
            },
            "industrial_furnace_wall": {
                "name": "Industrial High-Temp Furnace Wall",
                "params": {"layer1_thickness_mm": 230.0, "layer1_k_w_mk": 1.2, "layer2_thickness_mm": 100.0, "layer2_k_w_mk": 0.08, "inner_temp_c": 900.0, "outer_temp_c": 30.0}
            }
        }
