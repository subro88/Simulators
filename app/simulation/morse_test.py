"""
Morse Test & Engine Performance Testing Physics Engine
======================================================
Calculates total Brake Power BP, individual cylinder Indicated Power IP,
Frictional Power FP, mechanical efficiency eta_m, and specific fuel consumption.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class MorseTestInput(BaseModel):
    num_cylinders: int = Field(default=4, ge=2, le=8, description="Number of cylinders in IC engine")
    engine_speed_rpm: float = Field(default=3000.0, ge=1000.0, le=6000.0, description="Tested engine speed in RPM")
    brake_power_all_cyl_kw: float = Field(default=60.0, ge=5.0, le=500.0, description="Total Brake Power (all cylinders firing) BP_all in kW")
    avg_bp_cutout_kw: float = Field(default=42.0, ge=2.0, le=450.0, description="Average Brake Power with 1 cylinder cut out BP_-i in kW")
    fuel_consumption_kg_h: float = Field(default=15.0, ge=1.0, le=100.0, description="Fuel consumption rate m_f in kg/h")


class MorseTestOutput(BaseModel):
    total_brake_power_kw: float
    single_cylinder_ip_kw: float
    total_indicated_power_kw: float
    frictional_power_kw: float
    mechanical_efficiency_pct: float
    brake_specific_fuel_consumption_g_kwh: float
    status_note: str


class MorseTestEngine(BaseSimulationEngine):
    name = "morse-test"
    description = "Morse Test multi-cylinder engine evaluation: Indicated Power IP, Frictional Power FP, and mechanical efficiency eta_m"

    def calculate(self, params: MorseTestInput) -> MorseTestOutput:
        n_cyl = params.num_cylinders
        bp_all = params.brake_power_all_cyl_kw
        bp_cutout = params.avg_bp_cutout_kw

        # IP of 1 cylinder = BP_all - BP_-i
        ip_1_kw = bp_all - bp_cutout
        ip_1_kw = max(0.1, ip_1_kw)

        # Total Indicated Power IP_total = n * IP_1
        ip_total_kw = n_cyl * ip_1_kw

        # Frictional Power FP = IP_total - BP_all
        fp_kw = ip_total_kw - bp_all

        # Mechanical Efficiency eta_m = BP_all / IP_total
        eff_m_pct = (bp_all / ip_total_kw) * 100.0 if ip_total_kw > 0 else 0.0

        # BSFC = m_f (g/h) / BP (kW) -> g/kWh
        bsfc = (params.fuel_consumption_kg_h * 1000.0) / bp_all if bp_all > 0 else 0.0

        note = (
            f"{n_cyl}-Cylinder Engine Morse Test (N = {params.engine_speed_rpm:.0f} RPM): Total BP = {bp_all:.1f} kW | "
            f"Indicated Power IP = {ip_total_kw:.1f} kW | Frictional Power FP = {fp_kw:.1f} kW | Mechanical Efficiency η_m = {eff_m_pct:.1f}% (BSFC = {bsfc:.0f} g/kWh)."
        )

        return MorseTestOutput(
            total_brake_power_kw=float(bp_all),
            single_cylinder_ip_kw=float(ip_1_kw),
            total_indicated_power_kw=float(ip_total_kw),
            frictional_power_kw=float(fp_kw),
            mechanical_efficiency_pct=float(eff_m_pct),
            brake_specific_fuel_consumption_g_kwh=float(bsfc),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "four_cylinder_petrol": {
                "name": "4-Cylinder Petrol Engine Morse Test",
                "params": {"num_cylinders": 4, "engine_speed_rpm": 3000.0, "brake_power_all_cyl_kw": 60.0, "avg_bp_cutout_kw": 42.0, "fuel_consumption_kg_h": 15.0}
            },
            "six_cylinder_diesel": {
                "name": "6-Cylinder Heavy Diesel Engine Morse Test",
                "params": {"num_cylinders": 6, "engine_speed_rpm": 2200.0, "brake_power_all_cyl_kw": 180.0, "avg_bp_cutout_kw": 145.0, "fuel_consumption_kg_h": 38.0}
            }
        }
