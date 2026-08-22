"""
3-Phase AC Induction Motor Torque-Speed & Slip Physics Engine
============================================================
Calculates synchronous speed Ns, rotor speed N, fractional slip s,
rotor frequency fr, electromagnetic torque T, output power, and efficiency.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class InductionMotorInput(BaseModel):
    num_poles: int = Field(default=4, ge=2, le=12, description="Number of stator poles P (2, 4, 6, 8...)")
    supply_frequency_hz: float = Field(default=50.0, ge=10.0, le=100.0, description="AC Supply frequency f in Hz")
    supply_voltage_line_v: float = Field(default=415.0, ge=100.0, le=1000.0, description="3-Phase Line voltage V_L in Volts")
    operating_slip_pct: float = Field(default=4.0, ge=0.1, le=100.0, description="Rotor operating slip s in %")
    rotor_resistance_ohms: float = Field(default=0.4, ge=0.01, le=5.0, description="Rotor resistance R2 in Ohms per phase")


class InductionMotorOutput(BaseModel):
    synchronous_speed_rpm: float
    rotor_speed_rpm: float
    slip_fraction: float
    rotor_frequency_hz: float
    electromagnetic_torque_nm: float
    output_power_kw: float
    rotor_copper_loss_kw: float
    efficiency_pct: float
    status_note: str


class InductionMotorEngine(BaseSimulationEngine):
    name = "induction-motor"
    description = "3-Phase squirrel-cage induction motor: Ns, rotor speed N, slip s, torque-speed curve, and efficiency"

    def calculate(self, params: InductionMotorInput) -> InductionMotorOutput:
        p_poles = params.num_poles
        f_supply = params.supply_frequency_hz
        vl = params.supply_voltage_line_v
        s_fraction = params.operating_slip_pct / 100.0

        # Synchronous Speed Ns = 120 * f / P
        ns_rpm = (120.0 * f_supply) / p_poles

        # Rotor Speed N = Ns * (1 - s)
        n_rpm = ns_rpm * (1.0 - s_fraction)

        # Rotor Frequency fr = s * f
        fr_hz = s_fraction * f_supply

        # Phase Voltage V_ph = VL / sqrt(3)
        v_ph = vl / math.sqrt(3.0)
        ws_rad_s = (2.0 * math.pi * ns_rpm) / 60.0

        # Torque T = (3 / ws) * (Vph^2 * (R2/s)) / ((R2/s)^2 + X2^2)
        r2 = params.rotor_resistance_ohms
        x2 = 1.2  # standstill rotor reactance
        r2_over_s = r2 / s_fraction if s_fraction > 0 else 100.0

        t_nm = (3.0 / ws_rad_s) * ((v_ph ** 2) * r2_over_s) / ((r2_over_s ** 2) + (x2 ** 2)) if ws_rad_s > 0 else 0.0

        # Output Power P_out = T * omega_r (kW)
        w_r_rad_s = (2.0 * math.pi * n_rpm) / 60.0
        p_out_kw = (t_nm * w_r_rad_s) / 1000.0

        # Rotor Copper Loss P_rcu = s * P_gap = s * (P_out / (1 - s))
        p_gap_kw = p_out_kw / (1.0 - s_fraction) if (1.0 - s_fraction) > 0 else p_out_kw
        p_rcu_kw = s_fraction * p_gap_kw

        # Total Efficiency approx eta ≈ (1 - s) * 0.94
        eff_pct = (1.0 - s_fraction) * 94.0

        note = (
            f"4-Pole 3-Phase Induction Motor (f = {f_supply:.0f} Hz): Synchronous Ns = {ns_rpm:.0f} RPM | "
            f"Rotor Speed N = {n_rpm:.0f} RPM (Slip s = {params.operating_slip_pct:.1f}%) | "
            f"Electromagnetic Torque T = {t_nm:.1f} N·m | Output Power = {p_out_kw:.1f} kW (η = {eff_pct:.1f}%)."
        )

        return InductionMotorOutput(
            synchronous_speed_rpm=float(ns_rpm),
            rotor_speed_rpm=float(n_rpm),
            slip_fraction=float(s_fraction),
            rotor_frequency_hz=float(fr_hz),
            electromagnetic_torque_nm=float(t_nm),
            output_power_kw=float(p_out_kw),
            rotor_copper_loss_kw=float(p_rcu_kw),
            efficiency_pct=float(eff_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "four_pole_415v_motor": {
                "name": "Standard 4-Pole 415V 50Hz Motor (1440 RPM)",
                "params": {"num_poles": 4, "supply_frequency_hz": 50.0, "supply_voltage_line_v": 415.0, "operating_slip_pct": 4.0, "rotor_resistance_ohms": 0.4}
            },
            "two_pole_high_speed": {
                "name": "2-Pole High-Speed 3000 RPM Motor (Slip 2%)",
                "params": {"num_poles": 2, "supply_frequency_hz": 50.0, "supply_voltage_line_v": 415.0, "operating_slip_pct": 2.0, "rotor_resistance_ohms": 0.25}
            }
        }
