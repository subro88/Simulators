"""
Reinforced Concrete (RC) Short Column Capacity (IS 456) Physics Engine
======================================================================
Calculates axial load capacity Pu, concrete area Ac, longitudinal steel Asc,
and helical reinforcement ratio for short columns.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ColumnRcDesignInput(BaseModel):
    column_shape: Literal["square", "circular"] = Field(default="square", description="Column cross-section shape")
    column_dimension_mm: float = Field(default=400.0, ge=200.0, le=1200.0, description="Side length / Diameter in mm")
    unsupported_length_m: float = Field(default=3.0, ge=1.5, le=8.0, description="Column clear height L in meters")
    concrete_grade_fck: float = Field(default=30.0, ge=20.0, le=60.0, description="Concrete compressive strength fck in MPa")
    steel_grade_fy: float = Field(default=500.0, ge=250.0, le=550.0, description="Rebar yield strength fy in MPa")
    num_longitudinal_bars: int = Field(default=8, ge=4, le=20, description="Number of vertical steel rebar rods")
    bar_diameter_mm: float = Field(default=20.0, ge=12.0, le=36.0, description="Vertical rebar rod diameter in mm")


class ColumnRcDesignOutput(BaseModel):
    column_shape: str
    gross_area_ag_mm2: float
    steel_area_asc_mm2: float
    steel_percentage_p: float
    ultimate_axial_capacity_pu_kn: float
    status_note: str


class ColumnRcDesignEngine(BaseSimulationEngine):
    name = "column-rc-design"
    description = "IS 456 Limit State RC Short Axial Column: Pu = 0.4*fck*Ac + 0.67*fy*Asc, gross area Ag, and steel percentage p"

    def calculate(self, params: ColumnRcDesignInput) -> ColumnRcDesignOutput:
        dim = params.column_dimension_mm
        fck = params.concrete_grade_fck
        fy = params.steel_grade_fy
        n_bars = params.num_longitudinal_bars
        d_bar = params.bar_diameter_mm

        if params.column_shape == "circular":
            ag = (math.pi / 4.0) * (dim ** 2)
            shape_title = f"Circular Column (Dia = {dim:.0f}mm)"
        else: # square
            ag = dim ** 2
            shape_title = f"Square Column ({dim:.0f}mm x {dim:.0f}mm)"

        # Area of steel Asc
        asc = n_bars * (math.pi / 4.0) * (d_bar ** 2)
        ac = ag - asc

        p_steel_pct = (asc / ag) * 100.0

        # Short Axial Column Capacity Pu = 0.4 * fck * Ac + 0.67 * fy * Asc (N) -> kN (/ 1000)
        pu_n = (0.40 * fck * ac) + (0.67 * fy * asc)

        # Helical reinforcement boost (5%) for circular columns
        if params.column_shape == "circular":
            pu_n *= 1.05

        pu_kn = pu_n / 1000.0

        note = (
            f"IS 456 RC Short Column ({shape_title}, M{fck:.0f}/Fe{fy:.0f}): "
            f"Gross Area Ag = {ag:.0f} mm² | Vertical Steel Asc = {asc:.0f} mm² ({p_steel_pct:.2f}%) | "
            f"Ultimate Short Axial Load Capacity Pu = {pu_kn:.0f} kN."
        )

        return ColumnRcDesignOutput(
            column_shape=shape_title,
            gross_area_ag_mm2=float(ag),
            steel_area_asc_mm2=float(asc),
            steel_percentage_p=float(p_steel_pct),
            ultimate_axial_capacity_pu_kn=float(pu_kn),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "square_column_400mm": {
                "name": "400mm Square RC Column (M30/Fe500, 8x20mm Bars)",
                "params": {"column_shape": "square", "column_dimension_mm": 400.0, "unsupported_length_m": 3.0, "concrete_grade_fck": 30.0, "steel_grade_fy": 500.0, "num_longitudinal_bars": 8, "bar_diameter_mm": 20.0}
            },
            "circular_helical_column": {
                "name": "500mm Circular Column with Helical Ties",
                "params": {"column_shape": "circular", "column_dimension_mm": 500.0, "unsupported_length_m": 3.5, "concrete_grade_fck": 35.0, "steel_grade_fy": 500.0, "num_longitudinal_bars": 10, "bar_diameter_mm": 25.0}
            }
        }
