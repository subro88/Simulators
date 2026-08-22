"""
Production Line Balancing & Takt Time Physics Engine
====================================================
Calculates customer Takt Time T_takt, required minimum workstations N_min,
line efficiency eta_line, and balance delay % BD.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class LineBalancingTaktTimeInput(BaseModel):
    available_shift_time_hours: float = Field(default=8.0, ge=1.0, le=24.0, description="Shift net available operating time in hours")
    daily_customer_demand_units: float = Field(default=480.0, ge=10.0, le=10000.0, description="Daily customer demand in units")
    total_work_content_time_sec: float = Field(default=220.0, ge=10.0, le=3600.0, description="Total work content sum T_i in seconds")
    actual_workstations_count: int = Field(default=5, ge=1, le=50, description="Actual number of workstations N")


class LineBalancingTaktTimeOutput(BaseModel):
    takt_time_sec: float
    theoretical_min_workstations: int
    line_efficiency_pct: float
    balance_delay_pct: float
    status_note: str


class LineBalancingTaktTimeEngine(BaseSimulationEngine):
    name = "line-balancing-takt-time"
    description = "Lean Manufacturing Line Balancing: Takt Time T_takt = Operating Time / Demand, N_min workstations, and Line Efficiency"

    def calculate(self, params: LineBalancingTaktTimeInput) -> LineBalancingTaktTimeOutput:
        avail_sec = params.available_shift_time_hours * 3600.0
        demand = params.daily_customer_demand_units
        tw_sec = params.total_work_content_time_sec
        n_actual = params.actual_workstations_count

        # Takt Time T_takt = Available Time / Demand (sec/unit)
        takt_sec = avail_sec / demand if demand > 0 else 60.0

        # Theoretical Minimum Workstations N_min = ceil(Total Work Content / Takt Time)
        n_min = math.ceil(tw_sec / takt_sec) if takt_sec > 0 else 1

        # Cycle time = Takt time
        c_time = takt_sec

        # Line Efficiency eta_line = (Total Work Content / (N_actual * Cycle_Time)) * 100%
        eff_pct = (tw_sec / (n_actual * c_time)) * 100.0 if (n_actual * c_time) > 0 else 50.0
        eff_pct = min(100.0, eff_pct)

        # Balance Delay % = 100% - Line Efficiency %
        bd_pct = 100.0 - eff_pct

        note = (
            f"Production Line Balancing ({params.available_shift_time_hours:.0f}h Shift, Demand = {demand:.0f} units): "
            f"Customer Takt Time = {takt_sec:.1f} s/unit | Min Workstations N_min = {n_min} (Actual N = {n_actual}) | "
            f"Line Efficiency η = {eff_pct:.1f}% (Balance Delay BD = {bd_pct:.1f}%)."
        )

        return LineBalancingTaktTimeOutput(
            takt_time_sec=float(takt_sec),
            theoretical_min_workstations=n_min,
            line_efficiency_pct=float(eff_pct),
            balance_delay_pct=float(bd_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "assembly_line_480_units": {
                "name": "Assembly Line 480 Units/Day Demand (Takt = 60s)",
                "params": {"available_shift_time_hours": 8.0, "daily_customer_demand_units": 480.0, "total_work_content_time_sec": 220.0, "actual_workstations_count": 4}
            },
            "automotive_high_takt": {
                "name": "Automotive High-Speed Takt Line (Takt = 45s)",
                "params": {"available_shift_time_hours": 16.0, "daily_customer_demand_units": 1280.0, "total_work_content_time_sec": 310.0, "actual_workstations_count": 8}
            }
        }
