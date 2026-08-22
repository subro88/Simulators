"""
Valve Timing Diagram Physics Simulation Engine
==============================================
Calculates 4-stroke valve timing angles (IVO, IVC, EVO, EVC), valve overlap angle,
intake/exhaust durations, cam lobe lift kinematics, and gas exchange volumetric efficiency.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ValveTimingInput(BaseModel):
    """Input parameters for Valve Timing Diagram simulation."""
    engine_tuning: Literal["stock_economy", "street_performance", "race_cam"] = Field(
        default="stock_economy",
        description="Camshaft profile tuning style"
    )
    ivo_deg_btdc: float = Field(
        default=12.0,
        ge=0.0,
        le=50.0,
        description="Intake Valve Opens (IVO) in degrees Before TDC"
    )
    ivc_deg_abdc: float = Field(
        default=45.0,
        ge=10.0,
        le=80.0,
        description="Intake Valve Closes (IVC) in degrees After BDC"
    )
    evo_deg_bbdc: float = Field(
        default=48.0,
        ge=10.0,
        le=80.0,
        description="Exhaust Valve Opens (EVO) in degrees Before BDC"
    )
    evc_deg_atdc: float = Field(
        default=14.0,
        ge=0.0,
        le=50.0,
        description="Exhaust Valve Closes (EVC) in degrees After TDC"
    )
    engine_rpm: float = Field(
        default=3000.0,
        ge=500.0,
        le=9000.0,
        description="Engine rotational speed in RPM"
    )
    max_valve_lift_mm: float = Field(
        default=9.5,
        ge=4.0,
        le=16.0,
        description="Maximum valve lift height in mm"
    )


class ValveTimingOutput(BaseModel):
    """Calculated output telemetry for Valve Timing Diagram."""
    tuning_name: str
    intake_duration_deg: float
    exhaust_duration_deg: float
    valve_overlap_deg: float
    volumetric_efficiency_pct: float
    current_intake_lift_mm: float
    current_exhaust_lift_mm: float
    status_note: str


class ValveTimingEngine(BaseSimulationEngine):
    """Physics simulation engine for Valve Timing Diagrams & Camshaft Kinematics."""

    name = "valve-timing-diagram"
    description = "Valve timing angles (IVO, IVC, EVO, EVC), overlap, intake/exhaust durations, and cam lift kinematics"

    def calculate(self, params: ValveTimingInput) -> ValveTimingOutput:
        # Intake Duration = 180° + IVO + IVC
        intake_duration = 180.0 + params.ivo_deg_btdc + params.ivc_deg_abdc

        # Exhaust Duration = 180° + EVO + EVC
        exhaust_duration = 180.0 + params.evo_deg_bbdc + params.evc_deg_atdc

        # Valve Overlap = IVO + EVC (period when BOTH intake & exhaust valves are simultaneously open near TDC)
        valve_overlap = params.ivo_deg_btdc + params.evc_deg_atdc

        # Empirical Volumetric Efficiency model based on overlap and RPM
        base_ve = 82.0 + (valve_overlap * 0.25)
        rpm_factor = 1.0 - abs(params.engine_rpm - 4500.0) / 12000.0
        volumetric_efficiency = min(110.0, max(60.0, base_ve * rpm_factor))

        tuning_str = params.engine_tuning.replace("_", " ").title()
        note = (
            f"{tuning_str} Camshaft: Overlap Angle = {valve_overlap:.1f}° "
            f"(Intake Duration: {intake_duration:.0f}°, Exhaust Duration: {exhaust_duration:.0f}°)."
        )

        return ValveTimingOutput(
            tuning_name=tuning_str,
            intake_duration_deg=float(intake_duration),
            exhaust_duration_deg=float(exhaust_duration),
            valve_overlap_deg=float(valve_overlap),
            volumetric_efficiency_pct=float(volumetric_efficiency),
            current_intake_lift_mm=float(params.max_valve_lift_mm * 0.8),
            current_exhaust_lift_mm=0.0,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "stock_economy": {
                "name": "Stock Commuter Cam (Low Overlap)",
                "params": {
                    "engine_tuning": "stock_economy",
                    "ivo_deg_btdc": 10.0,
                    "ivc_deg_abdc": 40.0,
                    "evo_deg_bbdc": 45.0,
                    "evc_deg_atdc": 10.0,
                    "max_valve_lift_mm": 8.5
                }
            },
            "race_cam": {
                "name": "High-Overlap Race Camshaft",
                "params": {
                    "engine_tuning": "race_cam",
                    "ivo_deg_btdc": 32.0,
                    "ivc_deg_abdc": 68.0,
                    "evo_deg_bbdc": 64.0,
                    "evc_deg_atdc": 34.0,
                    "max_valve_lift_mm": 12.8
                }
            }
        }
