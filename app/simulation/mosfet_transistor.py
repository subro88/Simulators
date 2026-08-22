"""
N-Channel & P-Channel Enhancement MOSFET Physics Engine
========================================================
Calculates drain current ID, drain-source voltage VDS, RDS(on) resistance,
transconductance gm, and operating region (Cutoff, Triode/Ohmic, Saturation).
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MosfetTransistorInput(BaseModel):
    gate_source_voltage_vgs: float = Field(default=5.0, ge=0.0, le=20.0, description="Gate-Source voltage VGS in Volts")
    drain_supply_voltage_vdd: float = Field(default=12.0, ge=1.0, le=100.0, description="Drain supply VDD in Volts")
    threshold_voltage_vth: float = Field(default=2.0, ge=0.5, le=5.0, description="Threshold voltage Vth in Volts")
    transconductance_kn_ma_v2: float = Field(default=100.0, ge=1.0, le=5000.0, description="MOSFET process parameter kn in mA/V²")
    drain_resistor_rd_ohms: float = Field(default=10.0, ge=0.1, le=1000.0, description="Drain load resistor RD in Ω")


class MosfetTransistorOutput(BaseModel):
    operating_region: str
    drain_current_a: float
    drain_source_voltage_vds: float
    rds_on_ohms: float
    transconductance_mS: float
    power_dissipation_w: float
    status_note: str


class MosfetTransistorEngine(BaseSimulationEngine):
    name = "mosfet-transistor"
    description = "Enhancement MOSFET I-V characteristics: Cutoff, Triode/Ohmic, and Saturation modes with RDS(on) & gm"

    def calculate(self, params: MosfetTransistorInput) -> MosfetTransistorOutput:
        vgs = params.gate_source_voltage_vgs
        vdd = params.drain_supply_voltage_vdd
        vth = params.threshold_voltage_vth
        kn_a_v2 = params.transconductance_kn_ma_v2 / 1000.0  # convert mA/V^2 to A/V^2
        rd = params.drain_resistor_rd_ohms

        v_ov = vgs - vth  # Overdrive voltage

        if v_ov <= 0:
            region = "Cutoff Region (OFF State — Gate Below Threshold)"
            i_d = 0.0
            vds = vdd
            g_m_ms = 0.0
            rds_on = 1e6
        else:
            # Saturation current estimate I_sat = 0.5 * kn * V_ov^2
            i_d_sat = 0.5 * kn_a_v2 * (v_ov ** 2)
            vds_sat = vdd - (i_d_sat * rd)

            if vds_sat >= v_ov:
                region = "Saturation Region (Pinch-Off Constant Current)"
                i_d = i_d_sat
                vds = vds_sat
                g_m_ms = kn_a_v2 * v_ov * 1000.0
                rds_on = 1.0 / (kn_a_v2 * v_ov) if (kn_a_v2 * v_ov) > 0 else 100.0
            else:
                region = "Triode / Ohmic Region (Low RDS(on) Conductive Channel)"
                # Solve quadratic for VDS in triode mode: VDD - ID * RD = VDS
                # ID = kn * (V_ov * VDS - 0.5 * VDS^2)
                vds = v_ov * 0.1  # linear approximation
                i_d = kn_a_v2 * (v_ov * vds - 0.5 * (vds ** 2))
                g_m_ms = kn_a_v2 * vds * 1000.0
                rds_on = 1.0 / (kn_a_v2 * v_ov) if (kn_a_v2 * v_ov) > 0 else 0.05

        p_diss_w = vds * i_d

        note = (
            f"N-Channel MOSFET (VGS = {vgs:.1f} V, Vth = {vth:.1f} V): State = {region} | "
            f"Drain Current ID = {i_d:.2f} A | VDS = {vds:.2f} V (RDS(on) = {rds_on*1000:.1f} mΩ, Power = {p_diss_w:.2f} W)."
        )

        return MosfetTransistorOutput(
            operating_region=region,
            drain_current_a=float(i_d),
            drain_source_voltage_vds=float(vds),
            rds_on_ohms=float(rds_on),
            transconductance_mS=float(g_m_ms),
            power_dissipation_w=float(p_diss_w),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "mosfet_power_switch_on": {
                "name": "Power MOSFET Low-Side Switch ON (VGS = 10V)",
                "params": {"gate_source_voltage_vgs": 10.0, "drain_supply_voltage_vdd": 12.0, "threshold_voltage_vth": 2.5, "transconductance_kn_ma_v2": 500.0, "drain_resistor_rd_ohms": 2.0}
            },
            "mosfet_cutoff_off": {
                "name": "MOSFET Cutoff OFF State (VGS = 0V)",
                "params": {"gate_source_voltage_vgs": 0.0, "drain_supply_voltage_vdd": 12.0, "threshold_voltage_vth": 2.5, "transconductance_kn_ma_v2": 500.0, "drain_resistor_rd_ohms": 2.0}
            }
        }
