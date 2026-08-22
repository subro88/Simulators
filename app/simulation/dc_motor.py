"""
DC Shunt & Series Motor Physics Engine
======================================
Calculates back EMF Eb, armature current Ia, rotational speed N, shaft torque T,
input power Pin, output mechanical power Pout, and efficiency eta.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class DcMotorInput(BaseModel):
    motor_type: Literal["shunt", "series"] = Field(default="shunt", description="DC motor winding topology")
    terminal_voltage_v: float = Field(default=220.0, ge=10.0, le=1000.0, description="DC Supply terminal voltage V in Volts")
    armature_resistance_ohms: float = Field(default=0.5, ge=0.01, le=10.0, description="Armature winding resistance Ra in Ohms")
    shunt_field_resistance_ohms: float = Field(default=220.0, ge=10.0, le=5000.0, description="Shunt field resistance Rsh in Ohms")
    applied_load_torque_nm: float = Field(default=45.0, ge=0.0, le=500.0, description="Mechanical load torque T_load in N·m")


class DcMotorOutput(BaseModel):
    motor_type: str
    back_emf_volts: float
    armature_current_amperes: float
    field_current_amperes: float
    motor_speed_rpm: float
    shaft_torque_nm: float
    output_power_kw: float
    input_power_kw: float
    efficiency_pct: float
    status_note: str


class DcMotorEngine(BaseSimulationEngine):
    name = "dc-motor"
    description = "DC shunt & series motor electromechanics: Back EMF Eb, speed-torque characteristics, and efficiency"

    def calculate(self, params: DcMotorInput) -> DcMotorOutput:
        v = params.terminal_voltage_v
        ra = params.armature_resistance_ohms
        t_load = params.applied_load_torque_nm

        if params.connection_type == "shunt" if hasattr(params, "connection_type") else params.motor_type == "shunt":
            # Shunt: Ish = V / Rsh
            ish = v / params.shunt_field_resistance_ohms if params.shunt_field_resistance_ohms > 0 else 1.0
            # Torque constant Kt ~ 1.2 N*m/A
            kt = 1.2
            ia = t_load / kt if kt > 0 else 10.0
            # Back EMF Eb = V - Ia * Ra
            eb = v - (ia * ra)
            # Speed N (RPM) = (Eb / (Kt)) * (60 / 2pi)
            speed_rad_s = eb / kt if kt > 0 else 100.0
            speed_rpm = max(0.0, speed_rad_s * (60.0 / (2.0 * math.pi)))
            i_total = ia + ish
            type_title = "DC Shunt Motor"
        else: # series
            ish = 0.0
            kt = 0.18
            ia = math.sqrt(t_load / kt) if kt > 0 else 10.0
            eb = v - (ia * (ra + 0.3))
            speed_rad_s = eb / (kt * ia) if (kt * ia) > 0 else 100.0
            speed_rpm = max(0.0, speed_rad_s * (60.0 / (2.0 * math.pi)))
            i_total = ia
            type_title = "DC Series Motor"

        # Output mechanical power P_out = T_load * omega (kW)
        p_out_kw = (t_load * speed_rad_s) / 1000.0
        # Input electrical power P_in = V * I_total (kW)
        p_in_kw = (v * i_total) / 1000.0

        eff_pct = (p_out_kw / p_in_kw) * 100.0 if p_in_kw > 0 else 0.0

        note = (
            f"{type_title} (V = {v:.0f} V): Speed = {speed_rpm:.0f} RPM | Back EMF Eb = {eb:.1f} V | "
            f"Armature Current Ia = {ia:.1f} A | Shaft Torque = {t_load:.1f} N·m (Output = {p_out_kw:.2f} kW, η = {eff_pct:.1f}%)."
        )

        return DcMotorOutput(
            motor_type=type_title,
            back_emf_volts=float(eb),
            armature_current_amperes=float(ia),
            field_current_amperes=float(ish),
            motor_speed_rpm=float(speed_rpm),
            shaft_torque_nm=float(t_load),
            output_power_kw=float(p_out_kw),
            input_power_kw=float(p_in_kw),
            efficiency_pct=float(eff_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "industrial_shunt_motor_220v": {
                "name": "Industrial 220V DC Shunt Motor (45 N·m)",
                "params": {"motor_type": "shunt", "terminal_voltage_v": 220.0, "armature_resistance_ohms": 0.5, "shunt_field_resistance_ohms": 220.0, "applied_load_torque_nm": 45.0}
            },
            "traction_series_motor": {
                "name": "Traction DC Series Motor (High Starting Torque)",
                "params": {"motor_type": "series", "terminal_voltage_v": 600.0, "armature_resistance_ohms": 0.15, "shunt_field_resistance_ohms": 0.0, "applied_load_torque_nm": 120.0}
            }
        }
