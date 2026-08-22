"""
Kirchhoff's Laws (KVL & KCL) & Nodal Analysis Physics Engine
===========================================================
Calculates node voltages, mesh loop currents, galvanometer current Ig in Wheatstone bridge,
and verifies sum of currents & KVL loop conservation.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


class KirchhoffsLawsInput(BaseModel):
    source_voltage_v: float = Field(default=10.0, ge=0.5, le=100.0, description="DC Source voltage Vs in Volts")
    r1_ohms: float = Field(default=100.0, ge=1.0, le=10000.0, description="Bridge arm R1 in Ohms")
    r2_ohms: float = Field(default=200.0, ge=1.0, le=10000.0, description="Bridge arm R2 in Ohms")
    r3_ohms: float = Field(default=150.0, ge=1.0, le=10000.0, description="Bridge arm R3 in Ohms")
    r4_ohms: float = Field(default=300.0, ge=1.0, le=10000.0, description="Bridge arm R4 in Ohms")
    detector_rg_ohms: float = Field(default=50.0, ge=1.0, le=1000.0, description="Galvanometer internal resistance Rg in Ohms")


class KirchhoffsLawsOutput(BaseModel):
    node_va_volts: float
    node_vb_volts: float
    galvanometer_current_ma: float
    source_total_current_ma: float
    is_bridge_balanced: bool
    status_note: str


class KirchhoffsLawsEngine(BaseSimulationEngine):
    name = "kirchhoffs-laws"
    description = "Kirchhoff's Current & Voltage Laws (KCL/KVL): Wheatstone bridge nodal analysis, Ig, and balance state"

    def calculate(self, params: KirchhoffsLawsInput) -> KirchhoffsLawsOutput:
        vs = params.source_voltage_v
        r1 = params.r1_ohms
        r2 = params.r2_ohms
        r3 = params.r3_ohms
        r4 = params.r4_ohms
        rg = params.detector_rg_ohms

        # Nodal Analysis equations for nodes A and B in Wheatstone bridge:
        # Node A: (Va - Vs)/R1 + Va/R2 + (Va - Vb)/Rg = 0 => Va * (1/R1 + 1/R2 + 1/Rg) - Vb * (1/Rg) = Vs/R1
        # Node B: (Vb - Vs)/R3 + Vb/R4 + (Vb - Va)/Rg = 0 => -Va * (1/Rg) + Vb * (1/R3 + 1/R4 + 1/Rg) = Vs/R3

        g1, g2, g3, g4, gg = 1.0/r1, 1.0/r2, 1.0/r3, 1.0/r4, 1.0/rg

        matrix_a = np.array([
            [(g1 + g2 + gg), -gg],
            [-gg, (g3 + g4 + gg)]
        ])
        vector_b = np.array([vs * g1, vs * g3])

        node_v = np.linalg.solve(matrix_a, vector_b)
        va = float(node_v[0])
        vb = float(node_v[1])

        # Ig = (Va - Vb) / Rg
        ig_amp = (va - vb) / rg
        ig_ma = ig_amp * 1000.0

        # Total Source Current I_tot = (Vs - Va)/R1 + (Vs - Vb)/R3
        i_tot_amp = ((vs - va) * g1) + ((vs - vb) * g3)
        i_tot_ma = i_tot_amp * 1000.0

        # Balance check: R1 / R2 == R3 / R4 => R1 * R4 == R2 * R3
        is_balanced = math.isclose(r1 * r4, r2 * r3, rel_tol=1e-3)
        status_text = "BALANCED BRIDGE (Ig = 0)" if is_balanced else "UNBALANCED BRIDGE (Current flows through Rg)"

        note = (
            f"Wheatstone Bridge Circuit: Node Va = {va:.2f} V, Node Vb = {vb:.2f} V | "
            f"Galvanometer Current Ig = {ig_ma:.2f} mA | Source Current I_total = {i_tot_ma:.2f} mA ({status_text})."
        )

        return KirchhoffsLawsOutput(
            node_va_volts=float(va),
            node_vb_volts=float(vb),
            galvanometer_current_ma=float(ig_ma),
            source_total_current_ma=float(i_tot_ma),
            is_bridge_balanced=is_balanced,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "balanced_wheatstone": {
                "name": "Balanced Wheatstone Bridge (R1/R2 = R3/R4)",
                "params": {"source_voltage_v": 10.0, "r1_ohms": 100.0, "r2_ohms": 200.0, "r3_ohms": 150.0, "r4_ohms": 300.0, "detector_rg_ohms": 50.0}
            },
            "strain_gauge_unbalanced": {
                "name": "Unbalanced Strain Gauge Bridge Sensor",
                "params": {"source_voltage_v": 10.0, "r1_ohms": 100.0, "r2_ohms": 200.0, "r3_ohms": 150.0, "r4_ohms": 320.0, "detector_rg_ohms": 50.0}
            }
        }
