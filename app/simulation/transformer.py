"""
Single-Phase Transformer Efficiency & Regulation Physics Engine
================================================================
Calculates turns ratio N1/N2, secondary voltage V2, secondary current I2,
core loss Pfe, copper loss Pcu, efficiency eta, and voltage regulation %VR.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class TransformerInput(BaseModel):
    primary_voltage_v: float = Field(default=2300.0, ge=10.0, le=100000.0, description="Primary voltage V1 in Volts")
    turns_ratio_n1_n2: float = Field(default=10.0, ge=0.1, le=500.0, description="Turns ratio N1/N2")
    load_kva: float = Field(default=50.0, ge=0.1, le=10000.0, description="Transformer kVA load rating")
    load_power_factor: float = Field(default=0.85, ge=0.1, le=1.0, description="Load power factor cos(phi)")
    core_loss_watts: float = Field(default=450.0, ge=1.0, le=50000.0, description="No-load core iron loss Pfe in Watts")
    full_load_copper_loss_watts: float = Field(default=800.0, ge=1.0, le=100000.0, description="Full-load copper loss Pcu in Watts")


class TransformerOutput(BaseModel):
    turns_ratio: float
    secondary_voltage_v: float
    primary_current_a: float
    secondary_current_a: float
    core_loss_kw: float
    copper_loss_kw: float
    output_power_kw: float
    efficiency_pct: float
    voltage_regulation_pct: float
    status_note: str


class TransformerEngine(BaseSimulationEngine):
    name = "transformer"
    description = "Single-phase step-down/step-up transformer: turns ratio, V1/V2, I1/I2, iron & copper losses, and efficiency"

    def calculate(self, params: TransformerInput) -> TransformerOutput:
        v1 = params.primary_voltage_v
        a_ratio = params.turns_ratio_n1_n2
        s_kva = params.load_kva
        pf = params.load_power_factor

        # Secondary voltage V2 = V1 / a
        v2 = v1 / a_ratio if a_ratio > 0 else v1

        # Full load secondary current I2 = S_VA / V2
        s_va = s_kva * 1000.0
        i2 = s_va / v2 if v2 > 0 else 0.0

        # Primary current I1 = I2 / a
        i1 = i2 / a_ratio if a_ratio > 0 else 0.0

        # Output Active Power P_out = S_kVA * pf (in kW)
        p_out_kw = s_kva * pf

        # Losses in kW
        p_fe_kw = params.core_loss_watts / 1000.0
        p_cu_kw = params.full_load_copper_loss_watts / 1000.0
        p_total_loss_kw = p_fe_kw + p_cu_kw

        # Efficiency eta = P_out / (P_out + Losses)
        eff_pct = (p_out_kw / (p_out_kw + p_total_loss_kw)) * 100.0 if (p_out_kw + p_total_loss_kw) > 0 else 0.0

        # Voltage regulation %VR ≈ (I2 * R_eq * cos(phi) + I2 * X_eq * sin(phi)) / V2
        vr_pct = ((p_cu_kw * 1000.0 / s_va) * 100.0 * pf) if s_va > 0 else 2.0

        note = (
            f"Step-Down Transformer (N1/N2 = {a_ratio:.1f}): Primary V1 = {v1:.0f} V -> Secondary V2 = {v2:.1f} V | "
            f"Full Load Current I2 = {i2:.1f} A (I1 = {i1:.2f} A) | Efficiency η = {eff_pct:.2f}% (Losses = {p_total_loss_kw:.2f} kW)."
        )

        return TransformerOutput(
            turns_ratio=float(a_ratio),
            secondary_voltage_v=float(v2),
            primary_current_a=float(i1),
            secondary_current_a=float(i2),
            core_loss_kw=float(p_fe_kw),
            copper_loss_kw=float(p_cu_kw),
            output_power_kw=float(p_out_kw),
            efficiency_pct=float(eff_pct),
            voltage_regulation_pct=float(vr_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "distribution_transformer_11kv_415v": {
                "name": "11kV / 415V Distribution Transformer (50 kVA)",
                "params": {"primary_voltage_v": 11000.0, "turns_ratio_n1_n2": 26.5, "load_kva": 50.0, "load_power_factor": 0.85, "core_loss_watts": 350.0, "full_load_copper_loss_watts": 750.0}
            },
            "step_down_substation_33kv": {
                "name": "33kV Substation Power Transformer (500 kVA)",
                "params": {"primary_voltage_v": 33000.0, "turns_ratio_n1_n2": 80.0, "load_kva": 500.0, "load_power_factor": 0.90, "core_loss_watts": 2200.0, "full_load_copper_loss_watts": 4800.0}
            }
        }
