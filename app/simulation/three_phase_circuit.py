"""
3-Phase AC Systems (Star Y vs Delta Delta) Physics Engine
=========================================================
Calculates line & phase voltages VL, Vph, line & phase currents IL, Iph,
3-phase real power P, reactive power Q, apparent power S, and neutral current.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ThreePhaseCircuitInput(BaseModel):
    connection_type: Literal["star_wye", "delta"] = Field(default="star_wye", description="3-phase load connection: Star (Y) or Delta (Delta)")
    line_voltage_v: float = Field(default=415.0, ge=100.0, le=10000.0, description="3-Phase Line-to-Line RMS voltage VL in Volts")
    phase_impedance_ohms: float = Field(default=15.0, ge=0.5, le=1000.0, description="Per-phase impedance magnitude Z_ph in Ohms")
    power_factor: float = Field(default=0.85, ge=0.1, le=1.0, description="Load power factor cos(phi) (Lagging)")


class ThreePhaseCircuitOutput(BaseModel):
    connection_type: str
    line_voltage_v: float
    phase_voltage_v: float
    line_current_a: float
    phase_current_a: float
    total_real_power_kw: float
    total_reactive_power_kvar: float
    total_apparent_power_kva: float
    status_note: str


class ThreePhaseCircuitEngine(BaseSimulationEngine):
    name = "three-phase-circuit"
    description = "3-Phase AC Star (Y) and Delta (Δ) balance networks: VL, Vph, IL, Iph, and 3-phase S/P/Q powers"

    def calculate(self, params: ThreePhaseCircuitInput) -> ThreePhaseCircuitOutput:
        vl = params.line_voltage_v
        z_ph = params.phase_impedance_ohms
        pf = params.power_factor

        if params.connection_type == "star_wye":
            # Star: Vph = VL / sqrt(3), IL = Iph = Vph / Zph
            v_ph = vl / math.sqrt(3.0)
            i_ph = v_ph / z_ph if z_ph > 0 else 0.0
            i_l = i_ph
            type_title = "3-Phase Star (Wye Y) Connected Load"
        else:
            # Delta: Vph = VL, Iph = Vph / Zph, IL = sqrt(3) * Iph
            v_ph = vl
            i_ph = v_ph / z_ph if z_ph > 0 else 0.0
            i_l = math.sqrt(3.0) * i_ph
            type_title = "3-Phase Delta (Δ) Connected Load"

        # 3-Phase Powers: P = sqrt(3) * VL * IL * pf (in kW)
        s_va = math.sqrt(3.0) * vl * i_l
        p_w = s_va * pf
        sin_phi = math.sqrt(max(0.0, 1.0 - (pf ** 2)))
        q_var = s_va * sin_phi

        p_kw = p_w / 1000.0
        q_kvar = q_var / 1000.0
        s_kva = s_va / 1000.0

        note = (
            f"{type_title} (VL = {vl:.0f} V): Phase Voltage Vph = {v_ph:.1f} V | "
            f"Line Current IL = {i_l:.1f} A (Iph = {i_ph:.1f} A) | Total 3-Phase Power P = {p_kw:.1f} kW ({s_kva:.1f} kVA)."
        )

        return ThreePhaseCircuitOutput(
            connection_type=type_title,
            line_voltage_v=float(vl),
            phase_voltage_v=float(v_ph),
            line_current_a=float(i_l),
            phase_current_a=float(i_ph),
            total_real_power_kw=float(p_kw),
            total_reactive_power_kvar=float(q_kvar),
            total_apparent_power_kva=float(s_kva),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "industrial_415v_star": {
                "name": "Industrial 415V Star Motor Load",
                "params": {"connection_type": "star_wye", "line_voltage_v": 415.0, "phase_impedance_ohms": 12.0, "power_factor": 0.85}
            },
            "industrial_415v_delta": {
                "name": "Industrial 415V Delta High-Power Heater Load",
                "params": {"connection_type": "delta", "line_voltage_v": 415.0, "phase_impedance_ohms": 12.0, "power_factor": 0.95}
            }
        }
