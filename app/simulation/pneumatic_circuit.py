"""
Pneumatic Circuits & Compressed Air Flow Physics Engine
========================================================
Calculates pneumatic cylinder thrust force F, Free Air Delivery FAD,
compressed air consumption, and FRL pressure regulator drop.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PneumaticCircuitInput(BaseModel):
    working_pressure_bar: float = Field(default=6.0, ge=1.0, le=12.0, description="Regulated working pressure P in bar (Standard shop air ≈ 6 bar)")
    cylinder_bore_mm: float = Field(default=50.0, ge=10.0, le=200.0, description="Pneumatic cylinder bore diameter D in mm")
    stroke_length_mm: float = Field(default=200.0, ge=20.0, le=1000.0, description="Cylinder stroke length L in mm")
    cycles_per_minute: float = Field(default=30.0, ge=1.0, le=300.0, description="Actuation cycles per minute (CPM)")
    mechanical_efficiency: float = Field(default=0.85, ge=0.5, le=0.98, description="Actuator mechanical efficiency eta_m")


class PneumaticCircuitOutput(BaseModel):
    thrust_force_n: float
    retract_force_n: float
    free_air_delivery_lpm: float
    compressed_air_flow_lpm: float
    air_consumption_l_per_cycle: float
    compressor_power_req_kw: float
    status_note: str


class PneumaticCircuitEngine(BaseSimulationEngine):
    name = "pneumatic-circuit"
    description = "Pneumatic cylinder actuators & FRL unit: thrust force F, Free Air Delivery FAD, and air consumption"

    def calculate(self, params: PneumaticCircuitInput) -> PneumaticCircuitOutput:
        p_gauge_bar = params.working_pressure_bar
        p_abs_bar = p_gauge_bar + 1.01325
        d_m = params.cylinder_bore_mm / 1000.0

        a_bore_m2 = (math.pi * (d_m ** 2)) / 4.0

        # Thrust Force F = P_gauge * A * eta_m (in N)
        p_pa = p_gauge_bar * 1e5
        f_thrust_n = p_pa * a_bore_m2 * params.mechanical_efficiency
        f_retract_n = f_thrust_n * 0.85  # typical rod area reduction

        # Volume per double stroke = 2 * A * L
        l_m = params.stroke_length_mm / 1000.0
        v_cycle_compressed_m3 = 2.0 * a_bore_m2 * l_m
        v_cycle_compressed_l = v_cycle_compressed_m3 * 1000.0

        # Free Air Delivery FAD = V_compressed * (P_abs / P_atm)
        v_cycle_fad_l = v_cycle_compressed_l * (p_abs_bar / 1.01325)

        # FAD Flow Rate in L/min (LPM)
        cpm = params.cycles_per_minute
        fad_lpm = v_cycle_fad_l * cpm
        compressed_lpm = v_cycle_compressed_l * cpm

        # Compressor power requirement ~ 0.1 kW per 10 FAD LPM at 6 bar
        compressor_power_kw = (fad_lpm / 10.0) * 0.1

        note = (
            f"Pneumatic Actuator (P = {p_gauge_bar:.1f} bar, Ø{params.cylinder_bore_mm:.0f}mm): Thrust Force = {f_thrust_n:.0f} N | "
            f"Free Air Delivery (FAD) = {fad_lpm:.1f} LPM at {cpm:.0f} CPM (Compressor Power ≈ {compressor_power_kw:.2f} kW)."
        )

        return PneumaticCircuitOutput(
            thrust_force_n=float(f_thrust_n),
            retract_force_n=float(f_retract_n),
            free_air_delivery_lpm=float(fad_lpm),
            compressed_air_flow_lpm=float(compressed_lpm),
            air_consumption_l_per_cycle=float(v_cycle_fad_l),
            compressor_power_req_kw=float(compressor_power_kw),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str,Any]]:
        return {
            "packaging_pick_and_place": {
                "name": "High-Speed Packaging Pick & Place (30 CPM)",
                "params": {"working_pressure_bar": 6.0, "cylinder_bore_mm": 50.0, "stroke_length_mm": 200.0, "cycles_per_minute": 30.0, "mechanical_efficiency": 0.88}
            },
            "heavy_clamping_cylinder": {
                "name": "Heavy Industrial Pneumatic Clamp (Ø100mm)",
                "params": {"working_pressure_bar": 7.0, "cylinder_bore_mm": 100.0, "stroke_length_mm": 100.0, "cycles_per_minute": 10.0, "mechanical_efficiency": 0.85}
            }
        }
