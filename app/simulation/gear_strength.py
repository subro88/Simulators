"""
Spur & Bevel Gear Strength (Lewis & Buckingham) Physics Engine
===============================================================
Calculates tangential tooth force Ft, Lewis beam strength F_b,
velocity factor Cv, dynamic load F_d, wear load F_w, and tooth safety factor.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class GearStrengthInput(BaseModel):
    module_mm: float = Field(default=4.0, ge=1.0, le=20.0, description="Gear module m in mm")
    pinion_teeth: int = Field(default=20, ge=12, le=100, description="Pinion tooth count Z1")
    gear_teeth: int = Field(default=60, ge=12, le=200, description="Gear wheel tooth count Z2")
    face_width_mm: float = Field(default=40.0, ge=10.0, le=300.0, description="Gear face width b in mm")
    allowable_bending_stress_mpa: float = Field(default=140.0, ge=40.0, le=500.0, description="Allowable bending stress sigma_b in MPa")
    pinion_rpm: float = Field(default=1440.0, ge=10.0, le=10000.0, description="Pinion rotational speed N1 in RPM")
    transmitted_power_kw: float = Field(default=15.0, ge=0.5, le=500.0, description="Transmitted power P in kW")


class GearStrengthOutput(BaseModel):
    pitch_diameter_mm: float
    pitch_line_velocity_ms: float
    tangential_tooth_force_n: float
    lewis_form_factor: float
    lewis_beam_strength_n: float
    velocity_factor_cv: float
    effective_dynamic_load_n: float
    bending_safety_factor: float
    status_note: str


class GearStrengthEngine(BaseSimulationEngine):
    name = "gear-strength"
    description = "Gear tooth strength: Lewis beam strength, Barth velocity factor Cv, tangential force Ft, and safety factor"

    def calculate(self, params: GearStrengthInput) -> GearStrengthOutput:
        m = params.module_mm
        z1 = float(params.pinion_teeth)
        z2 = float(params.gear_teeth)
        b = params.face_width_mm
        sig_b = params.allowable_bending_stress_mpa
        n1 = params.pinion_rpm
        power_w = params.transmitted_power_kw * 1000.0

        # Pitch diameter d_p = m * Z1
        d_p_mm = m * z1
        d_p_m = d_p_mm / 1000.0

        # Pitch line velocity v = pi * d_p * N / 60
        v_ms = (math.pi * d_p_m * n1) / 60.0

        # Tangential tooth load Ft = Power / v
        f_t_n = power_w / v_ms if v_ms > 0 else 0.0

        # Lewis form factor y for 20 deg full-depth involute: y = 0.154 - (0.912 / Z1)
        y_lewis = 0.154 - (0.912 / z1) if z1 > 0 else 0.10

        # Lewis Beam Strength F_beam = sigma_b * b * pi * m * y
        f_beam_n = sig_b * b * math.pi * m * y_lewis

        # Velocity factor (Barth formula for cut gears v <= 10 m/s): Cv = 3 / (3 + v)
        c_v = 3.0 / (3.0 + v_ms) if v_ms > 0 else 1.0

        # Effective Dynamic Load F_d = F_t / C_v
        f_d_n = f_t_n / c_v if c_v > 0 else f_t_n

        fos_bending = f_beam_n / f_d_n if f_d_n > 0 else 99.0

        status_str = "SAFE IN BENDING" if fos_bending >= 1.2 else "WARNING: TOOTH BENDING FAILURE RISK!"

        note = (
            f"Spur Gear (m = {m:.1f} mm, Z = {params.pinion_teeth}/{params.gear_teeth}): Tangential Load Ft = {f_t_n:.0f} N | "
            f"Lewis Beam Strength = {f_beam_n:.0f} N | Dynamic Load Fd = {f_d_n:.0f} N (Bending FOS = {fos_bending:.2f} — {status_str})."
        )

        return GearStrengthOutput(
            pitch_diameter_mm=float(d_p_mm),
            pitch_line_velocity_ms=float(v_ms),
            tangential_tooth_force_n=float(f_t_n),
            lewis_form_factor=float(y_lewis),
            lewis_beam_strength_n=float(f_beam_n),
            velocity_factor_cv=float(c_v),
            effective_dynamic_load_n=float(f_d_n),
            bending_safety_factor=float(fos_bending),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "industrial_speed_reducer": {
                "name": "Industrial Gearbox Speed Reducer",
                "params": {"module_mm": 4.0, "pinion_teeth": 20, "gear_teeth": 60, "face_width_mm": 40.0, "allowable_bending_stress_mpa": 140.0, "pinion_rpm": 1440.0, "transmitted_power_kw": 15.0}
            },
            "high_speed_machine_gear": {
                "name": "High-Speed Machine Tool Gear",
                "params": {"module_mm": 2.5, "pinion_teeth": 24, "gear_teeth": 48, "face_width_mm": 30.0, "allowable_bending_stress_mpa": 180.0, "pinion_rpm": 2800.0, "transmitted_power_kw": 22.0}
            }
        }
