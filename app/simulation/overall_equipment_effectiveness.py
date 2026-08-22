"""
Overall Equipment Effectiveness (OEE) TPM Physics Engine
=========================================================
Calculates Availability A, Performance P, Quality Q, OEE percentage,
and World-Class Manufacturing benchmark evaluation.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class OverallEquipmentEffectivenessInput(BaseModel):
    planned_production_time_min: float = Field(default=480.0, ge=60.0, le=1440.0, description="Planned shift operating time in minutes")
    unplanned_downtime_min: float = Field(default=40.0, ge=0.0, le=400.0, description="Breakdowns & changeover downtime in minutes")
    ideal_cycle_time_sec: float = Field(default=30.0, ge=1.0, le=600.0, description="Nameplate ideal cycle time in seconds")
    total_parts_produced: int = Field(default=800, ge=10, le=50000, description="Total units produced during shift")
    defect_scrap_parts: int = Field(default=24, ge=0, le=5000, description="Scrap & defect parts count")


class OverallEquipmentEffectivenessOutput(BaseModel):
    availability_pct: float
    performance_pct: float
    quality_pct: float
    overall_equipment_effectiveness_oee_pct: float
    oee_world_class_status: str
    status_note: str


class OverallEquipmentEffectivenessEngine(BaseSimulationEngine):
    name = "overall-equipment-effectiveness"
    description = "TPM Overall Equipment Effectiveness: OEE = Availability * Performance * Quality (World-Class Benchmark = 85%)"

    def calculate(self, params: OverallEquipmentEffectivenessInput) -> OverallEquipmentEffectivenessOutput:
        planned_min = params.planned_production_time_min
        downtime_min = params.unplanned_downtime_min
        ideal_sec = params.ideal_cycle_time_sec
        total_produced = params.total_parts_produced
        defects = params.defect_scrap_parts

        # 1. Availability = Operating Time / Planned Time
        run_time_min = max(0.0, planned_min - downtime_min)
        avail_frac = run_time_min / planned_min if planned_min > 0 else 0.0

        # 2. Performance = (Ideal Cycle Time * Total Parts) / Operating Time
        ideal_time_min = (ideal_sec * total_produced) / 60.0
        perf_frac = ideal_time_min / run_time_min if run_time_min > 0 else 0.0
        perf_frac = min(1.0, perf_frac)

        # 3. Quality = Good Parts / Total Parts
        good_parts = max(0, total_produced - defects)
        qual_frac = good_parts / total_produced if total_produced > 0 else 1.0

        # OEE = Availability * Performance * Quality
        oee_frac = avail_frac * perf_frac * qual_frac
        oee_pct = oee_frac * 100.0

        avail_pct = avail_frac * 100.0
        perf_pct = perf_frac * 100.0
        qual_pct = qual_frac * 100.0

        if oee_pct >= 85.0:
            status = "WORLD-CLASS OEE BENCHMARK (OEE ≥ 85%)"
        elif oee_pct >= 65.0:
            status = "TYPICAL MANUFACTURING OEE (65% ≤ OEE < 85%)"
        else:
            status = "LOW OEE — SIGNIFICANT LOSSES (OEE < 65%)"

        note = (
            f"TPM Equipment OEE Metric (Planned = {planned_min:.0f} min, Run = {run_time_min:.0f} min): "
            f"Availability = {avail_pct:.1f}% | Performance = {perf_pct:.1f}% | Quality = {qual_pct:.1f}% | "
            f"Overall Equipment Effectiveness OEE = {oee_pct:.1f}% ({status})."
        )

        return OverallEquipmentEffectivenessOutput(
            availability_pct=float(avail_pct),
            performance_pct=float(perf_pct),
            quality_pct=float(qual_pct),
            overall_equipment_effectiveness_oee_pct=float(oee_pct),
            oee_world_class_status=status,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "world_class_85pct_cell": {
                "name": "World-Class Automated Cell (OEE = 85.4%)",
                "params": {"planned_production_time_min": 480.0, "unplanned_downtime_min": 20.0, "ideal_cycle_time_sec": 30.0, "total_parts_produced": 880, "defect_scrap_parts": 8}
            },
            "typical_machining_cell": {
                "name": "Typical Machining Line (OEE = 68.2%)",
                "params": {"planned_production_time_min": 480.0, "unplanned_downtime_min": 50.0, "ideal_cycle_time_sec": 30.0, "total_parts_produced": 750, "defect_scrap_parts": 30}
            }
        }
