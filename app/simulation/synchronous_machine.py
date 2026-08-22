"""
Synchronous Machine & V-Curve Physics Engine
=============================================
Calculates excitation voltage Ef, power angle delta, active power P,
pull-out power Pmax, armature current Ia, and V-curve excitation status.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SynchronousMachineInput(BaseModel):
    terminal_voltage_v: float = Field(default=415.0, ge=100.0, le=20000.0, description="Terminal voltage V in Volts")
    synchronous_reactance_ohms: float = Field(default=4.5, ge=0.5, le=50.0, description="Synchronous reactance Xs in Ohms")
    field_excitation_current_a: float = Field(default=12.0, ge=1.0, le=100.0, description="DC Field excitation current If in Amperes")
    power_angle_deg: float = Field(default=25.0, ge=0.0, le=85.0, description="Power/Rotor load angle delta in degrees")


class SynchronousMachineOutput(BaseModel):
    excitation_emf_v: float
    power_angle_deg: float
    generated_real_power_kw: float
    pullout_power_limit_kw: float
    armature_current_a: float
    power_factor: float
    excitation_mode: str
    status_note: str


class SynchronousMachineEngine(BaseSimulationEngine):
    name = "synchronous-machine"
    description = "Synchronous generator/motor V-curves & stability: excitation EMF Ef, power angle delta, and pull-out power"

    def calculate(self, params: SynchronousMachineInput) -> SynchronousMachineOutput:
        v = params.terminal_voltage_v
        xs = params.synchronous_reactance_ohms
        if_field = params.field_excitation_current_a
        delta_deg = params.power_angle_deg

        # Excitation EMF Ef proportional to field current (Ef = K * If)
        ef = if_field * 35.0

        delta_rad = math.radians(delta_deg)

        # Real 3-phase Power P = (3 * V_ph * Ef_ph / Xs) * sin(delta)
        v_ph = v / math.sqrt(3.0)
        ef_ph = ef / math.sqrt(3.0)

        p_w = (3.0 * v_ph * ef_ph / xs) * math.sin(delta_rad) if xs > 0 else 0.0
        p_max_w = (3.0 * v_ph * ef_ph / xs) if xs > 0 else 0.0

        p_kw = p_w / 1000.0
        p_max_kw = p_max_w / 1000.0

        # Armature current Ia = sqrt(V_ph^2 + Ef_ph^2 - 2*V_ph*Ef_ph*cos(delta)) / Xs
        num_sq = (v_ph ** 2) + (ef_ph ** 2) - (2.0 * v_ph * ef_ph * math.cos(delta_rad))
        i_a = math.sqrt(max(0.0, num_sq)) / xs if xs > 0 else 0.0

        pf = (p_w / (3.0 * v_ph * i_a)) if (3.0 * v_ph * i_a) > 0 else 0.85
        pf = min(1.0, max(0.1, pf))

        if ef > v:
            mode = "Over-Excited (Supplies Reactive Power / Leading PF)"
        elif math.isclose(ef, v, rel_tol=0.05):
            mode = "Normal Excitation (Unity Power Factor)"
        else:
            mode = "Under-Excited (Absorbs Reactive Power / Lagging PF)"

        note = (
            f"Synchronous Alternator (If = {if_field:.1f} A, δ = {delta_deg:.1f}°): "
            f"Generated Power P = {p_kw:.1f} kW (Pull-Out Limit = {p_max_kw:.1f} kW) | "
            f"Armature Current Ia = {i_a:.1f} A | {mode}."
        )

        return SynchronousMachineOutput(
            excitation_emf_v=float(ef),
            power_angle_deg=float(delta_deg),
            generated_real_power_kw=float(p_kw),
            pullout_power_limit_kw=float(p_max_kw),
            armature_current_a=float(i_a),
            power_factor=float(pf),
            excitation_mode=mode,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "utility_alternator_overexcited": {
                "name": "Utility Synchronous Alternator (Over-Excited)",
                "params": {"terminal_voltage_v": 415.0, "synchronous_reactance_ohms": 4.5, "field_excitation_current_a": 15.0, "power_angle_deg": 30.0}
            },
            "synchronous_condenser": {
                "name": "Synchronous Condenser (Power Factor Correction)",
                "params": {"terminal_voltage_v": 415.0, "synchronous_reactance_ohms": 4.5, "field_excitation_current_a": 18.0, "power_angle_deg": 5.0}
            }
        }
