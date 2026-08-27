"""
WBSCTE 3rd Sem Civil Engineering — Aggregate Testing Physics Engine
====================================================================
Simulates Aggregate Impact Value (AIV), Aggregate Crushing Value (ACV), Silt Content,
Sand Bulking Curve, Flakiness & Elongation Index according to IS 2386 & IS 383.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class AggregateTestingInput(BaseModel):
    """Input parameters for Aggregate Testing Lab."""
    test_type: Literal["impact_value", "crushing_value", "sand_bulking", "sieve_gradation", "flakiness_elongation"] = Field(
        default="impact_value",
        description="Type of coarse or fine aggregate laboratory test"
    )
    moisture_content_pct: float = Field(default=4.5, ge=0.0, le=15.0, description="Moisture percentage in sand for bulking test")
    fines_passing_236mm_g: float = Field(default=42.0, ge=5.0, le=120.0, description="Mass W2 passing 2.36mm IS sieve after 15 hammer blows (from 350g)")
    crushed_fines_236mm_g: float = Field(default=68.0, ge=10.0, le=180.0, description="Mass W2 passing 2.36mm sieve after 40t load (from 3000g sample)")
    flaky_particles_g: float = Field(default=48.0, ge=0.0, le=150.0, description="Mass of flaky particles passing slot gauge (from 500g)")


class AggregateTestingOutput(BaseModel):
    """Calculated laboratory results for Aggregate Testing."""
    test_name: str
    aggregate_impact_value_pct: float
    aggregate_crushing_value_pct: float
    sand_bulking_pct: float
    flakiness_index_pct: float
    suitability_for_pavement: str
    status_note: str


class AggregateTestingEngine(BaseSimulationEngine):
    """Laboratory test engine for Civil Engineering Aggregate Testing (IS 2386)."""

    name = "aggregate-testing-lab"
    description = "Aggregate Impact Value AIV, Crushing Value ACV, Sand Bulking curve, Flakiness/Elongation index"

    def calculate(self, params: AggregateTestingInput) -> AggregateTestingOutput:
        # AIV = (W2 / W1) * 100% where W1 = 350g
        w1_impact = 350.0
        aiv = (params.fines_passing_236mm_g / w1_impact) * 100.0

        # ACV = (W2 / W1) * 100% where W1 = 3000g
        w1_crushing = 3000.0
        acv = (params.crushed_fines_236mm_g / w1_crushing) * 100.0

        # Bulking of sand peaks around 4-6% moisture content (up to 30-40% volume expansion)
        m = params.moisture_content_pct
        if m == 0.0:
            bulking = 0.0
        elif m <= 5.0:
            bulking = (m / 5.0) * 35.0
        elif m <= 12.0:
            bulking = 35.0 - ((m - 5.0) / 7.0) * 35.0
        else:
            bulking = 0.0

        # Flakiness index FI = (Flaky Mass / Total Mass 500g) * 100%
        fi = (params.flaky_particles_g / 500.0) * 100.0

        if params.test_type == "impact_value":
            title = "Aggregate Impact Value Test (IS 2386 Part 4)"
            if aiv < 30.0:
                suitability = "SUITABLE for Wearing Course (Bituminous Concrete & Rigid Pavement)."
            elif aiv < 45.0:
                suitability = "SUITABLE for Sub-base & Water Bound Macadam (WBM) only."
            else:
                suitability = "UNSUITABLE for pavement construction."
            note = f"Aggregate Impact Value (AIV) = {aiv:.1f}% ({suitability})."

        elif params.test_type == "crushing_value":
            title = "Aggregate Crushing Value Test (IS 2386 Part 4)"
            if acv < 30.0:
                suitability = "SUITABLE for Surface Wearing Courses."
            else:
                suitability = "SUITABLE for Base Course only."
            note = f"Aggregate Crushing Value (ACV) = {acv:.1f}% under 40-tonne compressive load."

        elif params.test_type == "sand_bulking":
            title = "Bulking of Fine Aggregate / Sand Test"
            suitability = "Requires volume correction in volumetric concrete batching."
            note = f"Sand Bulking = {bulking:.1f}% at {m:.1f}% Moisture Content."

        else:
            title = "Flakiness & Elongation Index Test (IS 2386 Part 1)"
            suitability = "SUITABLE: Flakiness index <= 15%." if fi <= 15.0 else "UNSUITABLE: High flakiness impairs concrete workability."
            note = f"Flakiness Index (FI) = {fi:.1f}% (Max limit: 15%)."

        return AggregateTestingOutput(
            test_name=title,
            aggregate_impact_value_pct=float(aiv),
            aggregate_crushing_value_pct=float(acv),
            sand_bulking_pct=float(bulking),
            flakiness_index_pct=float(fi),
            suitability_for_pavement=suitability,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "wearing_course_granite": {
                "name": "Granite Aggregate (Wearing Course)",
                "params": {"test_type": "impact_value", "fines_passing_236mm_g": 42.0}
            },
            "sand_max_bulking": {
                "name": "Peak Sand Bulking at 5% Moisture",
                "params": {"test_type": "sand_bulking", "moisture_content_pct": 5.0}
            }
        }
