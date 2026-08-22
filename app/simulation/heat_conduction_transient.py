"""
Transient Heat Conduction (Lumped Capacitance) Physics Engine
============================================================
Calculates Biot number Bi, thermal time constant tau, temperature T(t),
and heat transfer rate Q(t).
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class HeatConductionTransientInput(BaseModel):
    initial_temp_c: float = Field(default=300.0, ge=50.0, le=1000.0, description="Initial solid temperature T0 in °C")
    ambient_fluid_temp_c: float = Field(default=25.0, ge=-20.0, le=200.0, description="Ambient fluid temperature T_infinity in °C")
    convection_coefficient_h_w_m2k: float = Field(default=120.0, ge=10.0, le=2000.0, description="Heat transfer coefficient h in W/m²K")
    solid_sphere_radius_mm: float = Field(default=20.0, ge=2.0, le=200.0, description="Solid sphere radius r in mm")
    thermal_conductivity_k_w_mk: float = Field(default=50.0, ge=1.0, le=400.0, description="Thermal conductivity k in W/mK")
    transient_time_sec: float = Field(default=60.0, ge=1.0, le=3600.0, description="Cooling time t in seconds")


class HeatConductionTransientOutput(BaseModel):
    biot_number: float
    is_lumped_valid: bool
    thermal_time_constant_sec: float
    current_temperature_c: float
    total_heat_transferred_kj: float
    status_note: str


class HeatConductionTransientEngine(BaseSimulationEngine):
    name = "heat-conduction-transient"
    description = "Transient Lumped Thermal Capacitance: Biot number Bi = h*Lc/k < 0.1, time constant tau, and cooling curve T(t)"

    def calculate(self, params: HeatConductionTransientInput) -> HeatConductionTransientOutput:
        t0 = params.initial_temp_c
        t_inf = params.ambient_fluid_temp_c
        h = params.convection_coefficient_h_w_m2k
        r_m = params.solid_sphere_radius_mm / 1000.0
        k = params.thermal_conductivity_k_w_mk
        t_sec = params.transient_time_sec

        # Sphere Volume V = (4/3)*pi*r^3, Surface Area A = 4*pi*r^2
        # Characteristic length Lc = V / A = r / 3
        lc = r_m / 3.0

        # Biot Number Bi = h * Lc / k
        bi = (h * lc) / k

        is_valid = bi < 0.1

        # Density rho = 7800 kg/m^3 (steel), Cp = 480 J/kgK
        rho = 7800.0
        cp = 480.0
        vol = (4.0 / 3.0) * math.pi * (r_m ** 3)
        area = 4.0 * math.pi * (r_m ** 2)

        # Thermal Time Constant tau = (rho * V * Cp) / (h * A) (seconds)
        tau_sec = (rho * vol * cp) / (h * area) if (h * area) > 0 else 100.0

        # Lumped Temperature T(t) = T_inf + (T0 - T_inf) * exp(-t / tau)
        t_curr = t_inf + (t0 - t_inf) * math.exp(-t_sec / tau_sec)

        # Heat Transferred Q(t) = rho * V * Cp * (T0 - T(t)) (kJ)
        q_kj = (rho * vol * cp * (t0 - t_curr)) / 1000.0

        status_text = "LUMPED CAPACITANCE VALID (Bi < 0.1)" if is_valid else "NON-LUMPED (Spatial Gradient Exists, Bi ≥ 0.1)"

        note = (
            f"Transient Sphere Cooling (r = {params.solid_sphere_radius_mm:.0f}mm, T0 = {t0:.0f}°C -> T∞ = {t_inf:.0f}°C): "
            f"Biot Number Bi = {bi:.4f} ({status_text}) | Time Constant τ = {tau_sec:.1f} s | "
            f"Temperature at t = {t_sec:.0f}s: T(t) = {t_curr:.1f}°C (Heat Transferred Q = {q_kj:.2f} kJ)."
        )

        return HeatConductionTransientOutput(
            biot_number=float(bi),
            is_lumped_valid=is_valid,
            thermal_time_constant_sec=float(tau_sec),
            current_temperature_c=float(t_curr),
            total_heat_transferred_kj=float(q_kj),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "steel_sphere_quenching": {
                "name": "Steel Sphere Quenching (r = 20mm, Bi = 0.016)",
                "params": {"initial_temp_c": 300.0, "ambient_fluid_temp_c": 25.0, "convection_coefficient_h_w_m2k": 120.0, "solid_sphere_radius_mm": 20.0, "thermal_conductivity_k_w_mk": 50.0, "transient_time_sec": 60.0}
            },
            "copper_ball_fast_cooling": {
                "name": "Copper Ball Fast Air Cooling (k = 385 W/mK)",
                "params": {"initial_temp_c": 200.0, "ambient_fluid_temp_c": 20.0, "convection_coefficient_h_w_m2k": 50.0, "solid_sphere_radius_mm": 15.0, "thermal_conductivity_k_w_mk": 385.0, "transient_time_sec": 30.0}
            }
        }
