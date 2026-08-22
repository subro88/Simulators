"""
Thermal Power Plant Economics & Efficiency Physics Engine
==========================================================
Calculates Heat Rate HR (kJ/kWh), overall plant efficiency eta_overall,
coal/gas fuel consumption rate, and CO2 emissions.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ThermalPowerPlantInput(BaseModel):
    fuel_type: Literal["bituminous_coal", "natural_gas", "heavy_fuel_oil"] = Field(
        default="bituminous_coal",
        description="Power plant fuel type"
    )
    generator_output_mw: float = Field(default=500.0, ge=10.0, le=2000.0, description="Electrical power output P_gen in MW")
    boiler_efficiency_pct: float = Field(default=88.0, ge=60.0, le=96.0, description="Boiler thermal efficiency eta_b in %")
    cycle_efficiency_pct: float = Field(default=42.0, ge=20.0, le=60.0, description="Rankine cycle efficiency eta_c in %")
    generator_efficiency_pct: float = Field(default=98.5, ge=90.0, le=99.9, description="Generator electrical efficiency eta_g in %")


class ThermalPowerPlantOutput(BaseModel):
    overall_plant_efficiency_pct: float
    heat_rate_kj_kwh: float
    fuel_consumption_tonnes_per_hour: float
    specific_fuel_consumption_kg_kwh: float
    co2_emissions_tonnes_per_hour: float
    status_note: str


class ThermalPowerPlantEngine(BaseSimulationEngine):
    name = "thermal-power-plant"
    description = "Thermal power plant overall efficiency: Heat Rate (kJ/kWh), coal/gas fuel rate, and CO2 emissions"

    def calculate(self, params: ThermalPowerPlantInput) -> ThermalPowerPlantOutput:
        fuel_data = {
            "bituminous_coal": {"lhv_mj_kg": 25.0, "co2_factor_kg_kg": 2.42, "name": "Bituminous Coal"},
            "natural_gas": {"lhv_mj_kg": 48.0, "co2_factor_kg_kg": 2.75, "name": "Natural Gas"},
            "heavy_fuel_oil": {"lhv_mj_kg": 41.0, "co2_factor_kg_kg": 3.15, "name": "Heavy Fuel Oil"}
        }
        f_info = fuel_data.get(params.fuel_type, fuel_data["bituminous_coal"])
        lhv_mj = f_info["lhv_mj_kg"]

        # Overall Plant Efficiency eta_overall = eta_b * eta_c * eta_g
        eta_overall = (params.boiler_efficiency_pct / 100.0) * (params.cycle_efficiency_pct / 100.0) * (params.generator_efficiency_pct / 100.0)
        eta_overall_pct = eta_overall * 100.0

        # Heat Rate HR = 3600 / eta_overall (kJ/kWh)
        heat_rate_kj_kwh = 3600.0 / eta_overall if eta_overall > 0 else 9999.0

        # Fuel Consumption Rate m_fuel = P_gen (MW) / (eta_overall * LHV) in kg/s -> tonnes/h
        p_gen_kw = params.generator_output_mw * 1000.0
        lhv_kj = lhv_mj * 1000.0
        fuel_kg_s = p_gen_kw / (eta_overall * lhv_kj) if (eta_overall * lhv_kj) > 0 else 0.0
        fuel_tph = fuel_kg_s * 3.6

        # Specific Fuel Consumption SFC = (3600 / (eta_overall * LHV)) in kg/kWh
        sfc_kg_kwh = (3600.0 / (eta_overall * lhv_kj)) if (eta_overall * lhv_kj) > 0 else 0.0

        # CO2 emissions = fuel_tph * co2_factor
        co2_tph = fuel_tph * f_info["co2_factor_kg_kg"]

        note = (
            f"{params.generator_output_mw:.0f} MW {f_info['name']} Plant: Overall Efficiency = {eta_overall_pct:.1f}% | "
            f"Heat Rate = {heat_rate_kj_kwh:.0f} kJ/kWh | Fuel Rate = {fuel_tph:.1f} tonnes/h (CO2 Emissions = {co2_tph:.1f} t/h)."
        )

        return ThermalPowerPlantOutput(
            overall_plant_efficiency_pct=float(eta_overall_pct),
            heat_rate_kj_kwh=float(heat_rate_kj_kwh),
            fuel_consumption_tonnes_per_hour=float(fuel_tph),
            specific_fuel_consumption_kg_kwh=float(sfc_kg_kwh),
            co2_emissions_tonnes_per_hour=float(co2_tph),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "modern_coal_500mw": {
                "name": "500 MW Modern Coal Thermal Station",
                "params": {"fuel_type": "bituminous_coal", "generator_output_mw": 500.0, "boiler_efficiency_pct": 88.0, "cycle_efficiency_pct": 42.0, "generator_efficiency_pct": 98.5}
            },
            "ccgt_natural_gas": {
                "name": "600 MW Combined Cycle Natural Gas Plant",
                "params": {"fuel_type": "natural_gas", "generator_output_mw": 600.0, "boiler_efficiency_pct": 92.0, "cycle_efficiency_pct": 58.0, "generator_efficiency_pct": 98.8}
            }
        }
