"""
Ideal Gas Law & Thermodynamic Processes Physics Engine
======================================================
Calculates gas state (P, V, T, m), process work W, heat transfer Q,
internal energy change Delta_U, and enthalpy change Delta_H across Isothermal, Isobaric, Isochoric, and Adiabatic paths.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class IdealGasLawInput(BaseModel):
    process_type: Literal["isothermal", "isobaric", "isochoric", "adiabatic"] = Field(
        default="isothermal",
        description="Thermodynamic process path"
    )
    gas_type: Literal["air", "helium", "nitrogen"] = Field(
        default="air",
        description="Working fluid gas: Air (R=287 J/kgK), Helium (R=2077 J/kgK), Nitrogen (R=297 J/kgK)"
    )
    gas_mass_kg: float = Field(default=0.5, ge=0.01, le=100.0, description="Gas mass m in kg")
    initial_pressure_bar: float = Field(default=2.0, ge=0.1, le=100.0, description="Initial pressure P1 in bar")
    initial_temp_c: float = Field(default=25.0, ge=-100.0, le=1000.0, description="Initial temperature T1 in °C")
    compression_ratio: float = Field(default=3.0, ge=0.1, le=30.0, description="Volume compression/expansion ratio V1/V2")


class IdealGasLawOutput(BaseModel):
    initial_volume_m3: float
    final_volume_m3: float
    final_pressure_bar: float
    final_temp_c: float
    work_done_kj: float
    heat_transfer_kj: float
    internal_energy_change_kj: float
    status_note: str


class IdealGasLawEngine(BaseSimulationEngine):
    name = "ideal-gas-law"
    description = "Ideal Gas Law PV = mRT and process thermodynamics: Work W, Heat Q, Delta U, and final state variables"

    def calculate(self, params: IdealGasLawInput) -> IdealGasLawOutput:
        gas_props = {
            "air": {"R": 287.0, "gamma": 1.4, "cv": 718.0},
            "helium": {"R": 2077.0, "gamma": 1.66, "cv": 3150.0},
            "nitrogen": {"R": 297.0, "gamma": 1.4, "cv": 743.0}
        }
        props = gas_props.get(params.gas_type, gas_props["air"])
        r_const = props["R"]
        gamma = props["gamma"]
        cv = props["cv"]

        m = params.gas_mass_kg
        p1_pa = params.initial_pressure_bar * 1e5
        t1_k = params.initial_temp_c + 273.15

        # V1 = m * R * T1 / P1
        v1_m3 = (m * r_const * t1_k) / p1_pa if p1_pa > 0 else 0.1

        v2_m3 = v1_m3 / params.compression_ratio if params.compression_ratio > 0 else v1_m3

        if params.process_type == "isothermal":
            # T2 = T1, P2 = P1 * (V1/V2)
            t2_k = t1_k
            p2_pa = p1_pa * (v1_m3 / v2_m3)
            # W = m * R * T1 * ln(V2/V1)
            work_j = m * r_const * t1_k * math.log(v2_m3 / v1_m3)
            delta_u_j = 0.0
            heat_j = work_j
            process_title = "Isothermal Process (T = Const)"

        elif params.process_type == "isobaric":
            # P2 = P1, T2 = T1 * (V2/V1)
            p2_pa = p1_pa
            t2_k = t1_k * (v2_m3 / v1_m3)
            # W = P1 * (V2 - V1)
            work_j = p1_pa * (v2_m3 - v1_m3)
            delta_u_j = m * cv * (t2_k - t1_k)
            heat_j = delta_u_j + work_j
            process_title = "Isobaric Process (P = Const)"

        elif params.process_type == "isochoric":
            # V2 = V1, W = 0, P2 = P1 * (T2/T1)
            v2_m3 = v1_m3
            t2_k = t1_k * params.compression_ratio
            p2_pa = p1_pa * (t2_k / t1_k)
            work_j = 0.0
            delta_u_j = m * cv * (t2_k - t1_k)
            heat_j = delta_u_j
            process_title = "Isochoric Process (V = Const)"

        else: # adiabatic
            # P2 = P1 * (V1/V2)^gamma, T2 = T1 * (V1/V2)^(gamma-1)
            p2_pa = p1_pa * ((v1_m3 / v2_m3) ** gamma)
            t2_k = t1_k * ((v1_m3 / v2_m3) ** (gamma - 1.0))
            work_j = (p1_pa * v1_m3 - p2_pa * v2_m3) / (gamma - 1.0)
            heat_j = 0.0
            delta_u_j = -work_j
            process_title = "Adiabatic / Isentropic Process (Q = 0)"

        p2_bar = p2_pa / 1e5
        t2_c = t2_k - 273.15

        work_kj = work_j / 1000.0
        heat_kj = heat_j / 1000.0
        delta_u_kj = delta_u_j / 1000.0

        note = (
            f"{process_title} ({params.gas_type.capitalize()}): Final P2 = {p2_bar:.2f} bar, T2 = {t2_c:.1f}°C | "
            f"Work W = {work_kj:.2f} kJ | Heat Q = {heat_kj:.2f} kJ | ΔU = {delta_u_kj:.2f} kJ."
        )

        return IdealGasLawOutput(
            initial_volume_m3=float(v1_m3),
            final_volume_m3=float(v2_m3),
            final_pressure_bar=float(p2_bar),
            final_temp_c=float(t2_c),
            work_done_kj=float(work_kj),
            heat_transfer_kj=float(heat_kj),
            internal_energy_change_kj=float(delta_u_kj),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "air_isothermal_compression": {
                "name": "Air Isothermal Compression (3:1)",
                "params": {"process_type": "isothermal", "gas_type": "air", "gas_mass_kg": 0.5, "initial_pressure_bar": 1.0, "initial_temp_c": 25.0, "compression_ratio": 3.0}
            },
            "air_adiabatic_compression": {
                "name": "Air Adiabatic Compression (8:1)",
                "params": {"process_type": "adiabatic", "gas_type": "air", "gas_mass_kg": 0.5, "initial_pressure_bar": 1.0, "initial_temp_c": 25.0, "compression_ratio": 8.0}
            }
        }
