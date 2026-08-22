"""
Welding Heat Input & Joint Strength Physics Engine
=================================================
Calculates arc heat input H (kJ/mm), cooling rate R_c, fillet weld throat stress tau,
and joint allowable load capacity.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class WeldingHeatInputInput(BaseModel):
    welding_process: Literal["smaw", "gmaw_mig", "gtaw_tig", "saw"] = Field(default="gmaw_mig", description="Arc welding process type")
    welding_current_a: float = Field(default=180.0, ge=30.0, le=600.0, description="Arc current I in Amperes")
    arc_voltage_v: float = Field(default=24.0, ge=10.0, le=50.0, description="Arc voltage V in Volts")
    travel_speed_mm_s: float = Field(default=5.0, ge=0.5, le=30.0, description="Torch travel speed v in mm/s")
    fillet_weld_leg_mm: float = Field(default=6.0, ge=2.0, le=25.0, description="Fillet weld leg size h in mm")
    weld_length_mm: float = Field(default=150.0, ge=10.0, le=2000.0, description="Effective weld length L in mm")


class WeldingHeatInputOutput(BaseModel):
    welding_process: str
    thermal_efficiency: float
    arc_power_kw: float
    heat_input_kj_mm: float
    throat_thickness_mm: float
    allowable_shear_load_kn: float
    status_note: str


class WeldingHeatInputEngine(BaseSimulationEngine):
    name = "welding-heat-input"
    description = "Arc welding metallurgy: Heat Input H (kJ/mm), process thermal efficiency eta, throat size tt, and fillet load capacity"

    def calculate(self, params: WeldingHeatInputInput) -> WeldingHeatInputOutput:
        i = params.welding_current_a
        v = params.arc_voltage_v
        s = params.travel_speed_mm_s
        h = params.fillet_weld_leg_mm
        l = params.weld_length_mm

        if params.welding_process == "smaw":
            eta = 0.80
            proc_title = "Shielded Metal Arc Welding (SMAW Stick)"
        elif params.welding_process == "gmaw_mig":
            eta = 0.85
            proc_title = "Gas Metal Arc Welding (GMAW / MIG)"
        elif params.welding_process == "gtaw_tig":
            eta = 0.60
            proc_title = "Gas Tungsten Arc Welding (GTAW / TIG)"
        else: # saw
            eta = 0.95
            proc_title = "Submerged Arc Welding (SAW)"

        # Arc Power P = V * I (kW)
        p_kw = (v * i) / 1000.0

        # Heat Input H = (eta * V * I) / (travel_speed) in J/mm -> kJ/mm (/ 1000)
        h_j_mm = (eta * v * i) / s if s > 0 else 0.0
        h_kj_mm = h_j_mm / 1000.0

        # Fillet Throat Thickness t_t = 0.707 * h
        tt_mm = 0.707 * h

        # Allowable Shear Stress tau_allow ≈ 108 MPa for E70xx electrode
        tau_allow_mpa = 108.0
        # Allowable Shear Load P_allow = 2 * (t_t * L * tau_allow) / 1000 (kN) for double fillet
        p_allow_kn = (2.0 * tt_mm * l * tau_allow_mpa) / 1000.0

        note = (
            f"{proc_title} (I = {i:.0f} A, V = {v:.1f} V): Arc Power P = {p_kw:.2f} kW | "
            f"Net Heat Input H = {h_kj_mm:.3f} kJ/mm | Fillet Throat tt = {tt_mm:.2f} mm | "
            f"Double Fillet Joint Shear Capacity = {p_allow_kn:.1f} kN."
        )

        return WeldingHeatInputOutput(
            welding_process=proc_title,
            thermal_efficiency=float(eta),
            arc_power_kw=float(p_kw),
            heat_input_kj_mm=float(h_kj_mm),
            throat_thickness_mm=float(tt_mm),
            allowable_shear_load_kn=float(p_allow_kn),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "gmaw_mig_structural": {
                "name": "MIG Structural Steel Welding (180A, 24V)",
                "params": {"welding_process": "gmaw_mig", "welding_current_a": 180.0, "arc_voltage_v": 24.0, "travel_speed_mm_s": 5.0, "fillet_weld_leg_mm": 6.0, "weld_length_mm": 150.0}
            },
            "gtaw_tig_precision": {
                "name": "TIG Stainless Steel Precision Weld (100A)",
                "params": {"welding_process": "gtaw_tig", "welding_current_a": 100.0, "arc_voltage_v": 15.0, "travel_speed_mm_s": 3.0, "fillet_weld_leg_mm": 3.0, "weld_length_mm": 100.0}
            }
        }
