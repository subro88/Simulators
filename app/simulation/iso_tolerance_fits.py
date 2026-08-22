"""
ISO System of Limits & Fits (ISO 286 H7/g6) Physics Engine
=========================================================
Calculates fundamental deviation, upper/lower limit sizes for hole and shaft,
clearance, transition, or interference fit.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class IsoToleranceFitsInput(BaseModel):
    basic_size_mm: float = Field(default=40.0, ge=1.0, le=500.0, description="Basic nominal dimension D in mm")
    hole_tolerance_class: Literal["H7", "H8", "H11"] = Field(default="H7", description="ISO Hole tolerance grade")
    shaft_tolerance_class: Literal["g6", "f7", "p6", "k6"] = Field(default="g6", description="ISO Shaft tolerance grade")


class IsoToleranceFitsOutput(BaseModel):
    fit_type: str
    hole_max_limit_mm: float
    hole_min_limit_mm: float
    shaft_max_limit_mm: float
    shaft_min_limit_mm: float
    max_clearance_or_interference_mm: float
    min_clearance_or_interference_mm: float
    status_note: str


class IsoToleranceFitsEngine(BaseSimulationEngine):
    name = "iso-tolerance-fits"
    description = "ISO 286 Limits and Fits: Hole basis H7 vs Shaft g6/f7/p6, upper/lower limits, clearance vs interference"

    def calculate(self, params: IsoToleranceFitsInput) -> IsoToleranceFitsOutput:
        d_basic = params.basic_size_mm
        hole = params.hole_tolerance_class
        shaft = params.shaft_tolerance_class

        # ISO IT7 tolerance IT7 = 0.001 * (16 * i) where i = 0.45 * D^(1/3) + 0.001*D (µm)
        i_um = 0.45 * math.pow(d_basic, 1.0 / 3.0) + 0.001 * d_basic
        it7_mm = (16.0 * i_um) / 1000.0
        it6_mm = (10.0 * i_um) / 1000.0
        it8_mm = (25.0 * i_um) / 1000.0

        # Hole H7: EI = 0, ES = IT7
        hole_min = d_basic
        hole_max = d_basic + (it7_mm if "7" in hole else it8_mm)

        # Shaft Fundamental Deviations (g6, f7, p6)
        if shaft == "g6":
            es_shaft = - (2.5 * math.pow(d_basic, 0.34)) / 1000.0  # mm
            shaft_max = d_basic + es_shaft
            shaft_min = shaft_max - it6_mm
            fit_type = "Clearance Fit (Precision Running Slide)"
        elif shaft == "f7":
            es_shaft = - (5.5 * math.pow(d_basic, 0.41)) / 1000.0
            shaft_max = d_basic + es_shaft
            shaft_min = shaft_max - it7_mm
            fit_type = "Clearance Fit (Normal Running Fit)"
        elif shaft == "p6":
            ei_shaft = (5.0 * math.pow(d_basic, 0.34)) / 1000.0  # Heavy interference
            shaft_min = d_basic + ei_shaft
            shaft_max = shaft_min + it6_mm
            fit_type = "Interference Press Fit (Permanent Joint)"
        else: # k6
            shaft_min = d_basic
            shaft_max = d_basic + it6_mm
            fit_type = "Transition Fit (Push Fit / Snug Alignment)"

        max_clearance = hole_max - shaft_min
        min_clearance = hole_min - shaft_max

        note = (
            f"ISO 286 Limits & Fits ({d_basic:.0f} mm {hole}/{shaft}): "
            f"Hole Limits [{hole_min:.3f} mm, {hole_max:.3f} mm] | "
            f"Shaft Limits [{shaft_min:.3f} mm, {shaft_max:.3f} mm] | "
            f"Max Allowance = {max_clearance*1000:.1f} µm, Min Allowance = {min_clearance*1000:.1f} µm ({fit_type})."
        )

        return IsoToleranceFitsOutput(
            fit_type=fit_type,
            hole_max_limit_mm=float(hole_max),
            hole_min_limit_mm=float(hole_min),
            shaft_max_limit_mm=float(shaft_max),
            shaft_min_limit_mm=float(shaft_min),
            max_clearance_or_interference_mm=float(max_clearance),
            min_clearance_or_interference_mm=float(min_clearance),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "h7_g6_precision_running": {
                "name": "40mm H7/g6 Precision Running Clearance Fit",
                "params": {"basic_size_mm": 40.0, "hole_tolerance_class": "H7", "shaft_tolerance_class": "g6"}
            },
            "h7_p6_heavy_press_fit": {
                "name": "50mm H7/p6 Heavy Interference Press Fit",
                "params": {"basic_size_mm": 50.0, "hole_tolerance_class": "H7", "shaft_tolerance_class": "p6"}
            }
        }
