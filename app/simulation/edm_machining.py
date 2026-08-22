"""
EDM Spark Erosion Physics Engine
================================
Calculates Electric Discharge Machining MRR, electrode wear ratio EWR,
spark energy E, and surface finish Ra.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class EdmMachiningInput(BaseModel):
    discharge_current_amp: float = Field(default=25.0, ge=1.0, le=200.0, description="Peak discharge current Ip in Amperes")
    pulse_on_time_us: float = Field(default=100.0, ge=1.0, le=1000.0, description="Pulse ON duration Ton in µs")
    discharge_voltage_v: float = Field(default=40.0, ge=20.0, le=120.0, description="Arc voltage V in Volts")
    electrode_material: str = Field(default="Copper (Cu)", description="Tool electrode material")


class EdmMachiningOutput(BaseModel):
    electrode_material: str
    spark_energy_mj: float
    material_removal_rate_mm3_min: float
    electrode_wear_ratio_pct: float
    surface_roughness_ra_um: float
    status_note: str


class EdmMachiningEngine(BaseSimulationEngine):
    name = "edm-machining"
    description = "Electric Discharge Machining (EDM): spark discharge energy E, MRR, electrode wear ratio EWR, and Ra"

    def calculate(self, params: EdmMachiningInput) -> EdmMachiningOutput:
        ip = params.discharge_current_amp
        ton = params.pulse_on_time_us
        v = params.discharge_voltage_v

        # Spark Energy E = V * Ip * Ton (mJ)
        e_mj = (v * ip * ton) / 1000.0

        # Empirical MRR = K * Ip^1.1 * Ton^0.35 (mm^3/min) where K ≈ 4.0
        mrr_mm3_min = 4.0 * (ip ** 1.1) * ((ton / 100.0) ** 0.35)

        # Electrode Wear Ratio EWR ≈ 1.5% for Copper on Steel
        ewr_pct = 1.5

        # Surface Roughness Ra ≈ 0.4 * Ip^0.3 * Ton^0.3 (µm)
        ra_um = 0.4 * (ip ** 0.3) * ((ton / 100.0) ** 0.3)

        note = (
            f"EDM Die Sinking ({params.electrode_material}, Ip = {ip:.0f} A, Ton = {ton:.0f} µs): "
            f"Spark Discharge Energy = {e_mj:.2f} mJ | MRR = {mrr_mm3_min:.1f} mm³/min | "
            f"Electrode Wear Ratio EWR = {ewr_pct:.1f}% | Surface Finish Ra = {ra_um:.2f} µm."
        )

        return EdmMachiningOutput(
            electrode_material=params.electrode_material,
            spark_energy_mj=float(e_mj),
            material_removal_rate_mm3_min=float(mrr_mm3_min),
            electrode_wear_ratio_pct=float(ewr_pct),
            surface_roughness_ra_um=float(ra_um),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "roughing_edm_copper": {
                "name": "Roughing EDM (Ip=40A, Ton=200µs)",
                "params": {"discharge_current_amp": 40.0, "pulse_on_time_us": 200.0, "discharge_voltage_v": 45.0, "electrode_material": "Copper (Cu)"}
            },
            "finishing_edm_graphite": {
                "name": "Finishing EDM (Ip=5A, Ton=20µs)",
                "params": {"discharge_current_amp": 5.0, "pulse_on_time_us": 20.0, "discharge_voltage_v": 35.0, "electrode_material": "Graphite"}
            }
        }
