"""
Ultrasonic Non-Destructive Testing (NDT) Flaw Detection Physics Engine
========================================================================
Calculates acoustic velocity v, flaw depth d = v*t/2, acoustic impedance Z,
and reflection coefficient R at material flaw interface.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class NdtUltrasonicTestingInput(BaseModel):
    material_type: Literal["carbon_steel", "aluminum", "titanium"] = Field(default="carbon_steel", description="Workpiece specimen material")
    echo_time_us: float = Field(default=16.0, ge=1.0, le=200.0, description="Time of flight echo return t in µs")
    flaw_interface_type: Literal["air_void", "slag_inclusion"] = Field(default="air_void", description="Flaw defect interface boundary")


class NdtUltrasonicTestingOutput(BaseModel):
    material_type: str
    acoustic_velocity_m_s: float
    flaw_depth_mm: float
    acoustic_impedance_z_rayl: float
    reflection_coefficient_r_pct: float
    status_note: str


class NdtUltrasonicTestingEngine(BaseSimulationEngine):
    name = "ndt-ultrasonic-testing"
    description = "NDT Ultrasonic Flaw Detection: Echo arrival time t, acoustic velocity v, flaw depth d = v*t/2, and impedance R"

    def calculate(self, params: NdtUltrasonicTestingInput) -> NdtUltrasonicTestingOutput:
        t_us = params.echo_time_us

        if params.material_type == "aluminum":
            v_m_s = 6320.0
            rho = 2700.0
            mat_title = "Structural Aluminum (6061-T6)"
        elif params.material_type == "titanium":
            v_m_s = 6070.0
            rho = 4500.0
            mat_title = "Titanium Alloy (Ti-6Al-4V)"
        else: # carbon_steel
            v_m_s = 5920.0
            rho = 7850.0
            mat_title = "Carbon Steel Plate"

        # Flaw Depth d = (v * t) / 2 (meters -> mm)
        t_sec = t_us / 1e6
        depth_m = (v_m_s * t_sec) / 2.0
        depth_mm = depth_m * 1000.0

        # Acoustic Impedance Z = rho * v (Rayl)
        z1 = rho * v_m_s

        if params.flaw_interface_type == "air_void":
            z2 = 415.0  # Air impedance
            defect_name = "Internal Air Void / Porosity Flaw"
        else:
            z2 = 1.2e7  # Slag inclusion
            defect_name = "Solid Slag / Inclusion Flaw"

        # Reflection Coefficient R = ((Z2 - Z1) / (Z2 + Z1))^2
        ref_coeff = math.pow((z2 - z1) / (z2 + z1), 2.0) if (z2 + z1) > 0 else 1.0
        ref_pct = ref_coeff * 100.0

        note = (
            f"Ultrasonic NDT Flaw Inspection ({mat_title}): Sound Velocity v = {v_m_s:.0f} m/s | "
            f"Echo Arrival Time t = {t_us:.1f} µs -> Flaw Depth d = {depth_mm:.2f} mm | "
            f"Acoustic Impedance Z = {z1/1e6:.2f} MRayl ({defect_name}, Reflection = {ref_pct:.1f}%)."
        )

        return NdtUltrasonicTestingOutput(
            material_type=mat_title,
            acoustic_velocity_m_s=float(v_m_s),
            flaw_depth_mm=float(depth_mm),
            acoustic_impedance_z_rayl=float(z1),
            reflection_coefficient_r_pct=float(ref_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "steel_internal_void_16us": {
                "name": "Steel Internal Air Void (16µs Echo = 47.36mm Depth)",
                "params": {"material_type": "carbon_steel", "echo_time_us": 16.0, "flaw_interface_type": "air_void"}
            },
            "aluminum_plate_flaw": {
                "name": "Aluminum Plate Defect (10µs Echo = 31.6mm Depth)",
                "params": {"material_type": "aluminum", "echo_time_us": 10.0, "flaw_interface_type": "air_void"}
            }
        }
