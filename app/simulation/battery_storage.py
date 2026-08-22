"""
Battery Energy Storage & BMS Management Physics Engine
======================================================
Calculates State of Charge (SoC), terminal voltage Vt, internal resistance drop,
C-rate discharge current, stored energy Wh, and Peukert run time.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BatteryStorageInput(BaseModel):
    chemistry_type: Literal["li_ion", "lead_acid", "lifepo4"] = Field(
        default="li_ion",
        description="Battery chemistry model"
    )
    nominal_capacity_ah: float = Field(default=100.0, ge=1.0, le=1000.0, description="Nominal battery capacity in Ampere-hours (Ah)")
    state_of_charge_pct: float = Field(default=80.0, ge=0.0, le=100.0, description="Current State of Charge SoC in %")
    discharge_current_a: float = Field(default=20.0, ge=0.0, le=500.0, description="Discharge current I in Amperes")
    internal_resistance_mohm: float = Field(default=15.0, ge=0.5, le=200.0, description="Internal resistance R_int in mΩ")


class BatteryStorageOutput(BaseModel):
    chemistry_type: str
    open_circuit_voltage_ocv: float
    terminal_voltage_vt: float
    c_rate: float
    stored_energy_wh: float
    estimated_run_time_hours: float
    power_output_w: float
    status_note: str


class BatteryStorageEngine(BaseSimulationEngine):
    name = "battery-storage"
    description = "Battery energy storage systems & BMS: SoC, OCV, terminal voltage Vt, C-rate, and Peukert discharge time"

    def calculate(self, params: BatteryStorageInput) -> BatteryStorageOutput:
        soc_frac = params.state_of_charge_pct / 100.0
        c_ah = params.nominal_capacity_ah
        i_dis = params.discharge_current_a
        r_int = params.internal_resistance_mohm / 1000.0

        if params.chemistry_type == "li_ion":
            # Li-Ion 3.7V cell pack (12S = 44.4V)
            v_min, v_max = 36.0, 50.4
            v_nom = 44.4
            type_title = "Lithium-Ion (NMC) Battery Pack (12S 44.4V)"

        elif params.chemistry_type == "lifepo4":
            # LiFePO4 3.2V cell pack (16S = 51.2V)
            v_min, v_max = 44.0, 56.8
            v_nom = 51.2
            type_title = "Lithium Iron Phosphate (LiFePO4) Battery Pack (16S 51.2V)"

        else: # lead_acid
            # Lead-Acid 12V block (4 series = 48V)
            v_min, v_max = 42.0, 54.0
            v_nom = 48.0
            type_title = "Deep-Cycle Lead-Acid Battery Bank (48V)"

        # OCV approximation based on SoC
        ocv = v_min + (v_max - v_min) * (0.1 * soc_frac + 0.9 * math.pow(soc_frac, 0.5))

        # Terminal Voltage Vt = OCV - I * R_int
        vt = max(0.0, ocv - (i_dis * r_int))

        # C-Rate = I / C_Ah
        c_rate = i_dis / c_ah if c_ah > 0 else 0.0

        # Stored Energy E = V_nom * C_Ah * SoC
        e_wh = v_nom * c_ah * soc_frac

        # Discharge Run Time t = (C_Ah * SoC) / I (Hours)
        run_time_h = (c_ah * soc_frac) / i_dis if i_dis > 0 else 999.0

        p_out_w = vt * i_dis

        note = (
            f"{type_title} (SoC = {params.state_of_charge_pct:.0f}%): OCV = {ocv:.1f} V -> Terminal Vt = {vt:.1f} V | "
            f"Discharge Current = {i_dis:.1f} A ({c_rate:.2f}C) | Stored Energy = {e_wh/1000:.2f} kWh (Run Time = {run_time_h:.1f} h)."
        )

        return BatteryStorageOutput(
            chemistry_type=type_title,
            open_circuit_voltage_ocv=float(ocv),
            terminal_voltage_vt=float(vt),
            c_rate=float(c_rate),
            stored_energy_wh=float(e_wh),
            estimated_run_time_hours=float(run_time_h),
            power_output_w=float(p_out_w),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "li_ion_ev_pack_80pct": {
                "name": "Li-Ion EV Battery Pack at 80% SoC (0.5C Discharge)",
                "params": {"chemistry_type": "li_ion", "nominal_capacity_ah": 100.0, "state_of_charge_pct": 80.0, "discharge_current_a": 50.0, "internal_resistance_mohm": 15.0}
            },
            "lifepo4_solar_storage": {
                "name": "LiFePO4 Solar Home Storage Bank (51.2V 100Ah)",
                "params": {"chemistry_type": "lifepo4", "nominal_capacity_ah": 100.0, "state_of_charge_pct": 90.0, "discharge_current_a": 20.0, "internal_resistance_mohm": 10.0}
            }
        }
