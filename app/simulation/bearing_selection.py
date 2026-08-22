"""
Rolling Element Bearing Selection & L10 Life Physics Engine
============================================================
Calculates equivalent radial load Pe, rating life L10 in million revolutions,
operating life L10h in hours, and required dynamic load rating C.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BearingSelectionInput(BaseModel):
    bearing_type: Literal["ball_bearing", "roller_bearing"] = Field(
        default="ball_bearing",
        description="Bearing rolling element type: Ball (p=3) or Tapered/Cylindrical Roller (p=10/3)"
    )
    radial_load_kn: float = Field(default=8.0, ge=0.5, le=200.0, description="Radial load Fr in kN")
    axial_load_kn: float = Field(default=3.0, ge=0.0, le=100.0, description="Axial/thrust load Fa in kN")
    shaft_speed_rpm: float = Field(default=1440.0, ge=10.0, le=20000.0, description="Shaft speed N in RPM")
    dynamic_load_rating_c_kn: float = Field(default=32.5, ge=2.0, le=500.0, description="Catalog Dynamic Load Rating C in kN")
    desired_life_hours: float = Field(default=20000.0, ge=500.0, le=200000.0, description="Target operating life L_h in hours")


class BearingSelectionOutput(BaseModel):
    equivalent_radial_load_kn: float
    rating_life_l10_mr: float
    rating_life_hours_l10h: float
    required_rating_c_kn: float
    capacity_ratio: float
    status_note: str


class BearingEngine(BaseSimulationEngine):
    name = "bearing-selection"
    description = "Rolling element bearing selection: equivalent load Pe, L10 life rating in million revolutions and hours"

    def calculate(self, params: BearingSelectionInput) -> BearingSelectionOutput:
        fr = params.radial_load_kn
        fa = params.axial_load_kn
        c_cat = params.dynamic_load_rating_c_kn
        n_rpm = params.shaft_speed_rpm

        # Equivalent load Pe = X * Fr + Y * Fa (simplified ISO 281 model: X=0.56, Y=1.4 if Fa/Fr > e)
        ratio_fa_fr = fa / fr if fr > 0 else 1.0
        if ratio_fa_fr > 0.25:
            x_factor, y_factor = 0.56, 1.45
        else:
            x_factor, y_factor = 1.0, 0.0

        p_e_kn = (x_factor * fr) + (y_factor * fa)

        # Exponent p: 3 for ball bearings, 10/3 for roller bearings
        p_exponent = 3.0 if params.bearing_type == "ball_bearing" else (10.0 / 3.0)

        # L10 life in million revolutions = (C / Pe)^p
        l10_mr = (c_cat / p_e_kn) ** p_exponent if p_e_kn > 0 else 99999.0

        # Life in hours L10h = (L10 * 10^6) / (60 * N)
        l10h = (l10_mr * 1e6) / (60.0 * n_rpm) if n_rpm > 0 else 99999.0

        # Required catalog rating C_req for desired hours: C_req = Pe * (L10_req)^(1/p)
        l10_req_mr = (params.desired_life_hours * 60.0 * n_rpm) / 1e6
        c_req_kn = p_e_kn * (l10_req_mr ** (1.0 / p_exponent)) if l10_req_mr > 0 else p_e_kn

        cap_ratio = c_cat / c_req_kn if c_req_kn > 0 else 1.0

        status_text = "SUITABLE (Meets Target Life)" if l10h >= params.desired_life_hours else "INSUFFICIENT LIFE (Select Larger Bearing)"
        type_title = "Deep Groove Ball Bearing" if params.bearing_type == "ball_bearing" else "Tapered Roller Bearing"

        note = (
            f"{type_title}: Equivalent Load P_e = {p_e_kn:.2f} kN | L10 Life = {l10_mr:.1f} Million Revs "
            f"({l10h:.0f} Operating Hours vs Target {params.desired_life_hours:.0f} hrs) — {status_text}."
        )

        return BearingSelectionOutput(
            equivalent_radial_load_kn=float(p_e_kn),
            rating_life_l10_mr=float(l10_mr),
            rating_life_hours_l10h=float(l10h),
            required_rating_c_kn=float(c_req_kn),
            capacity_ratio=float(cap_ratio),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "electric_motor_ball_bearing": {
                "name": "Electric Motor 6210 Ball Bearing",
                "params": {"bearing_type": "ball_bearing", "radial_load_kn": 6.5, "axial_load_kn": 1.8, "shaft_speed_rpm": 1440.0, "dynamic_load_rating_c_kn": 35.0, "desired_life_hours": 25000.0}
            },
            "gearbox_roller_bearing": {
                "name": "Heavy Gearbox Tapered Roller Bearing",
                "params": {"bearing_type": "roller_bearing", "radial_load_kn": 25.0, "axial_load_kn": 12.0, "shaft_speed_rpm": 900.0, "dynamic_load_rating_c_kn": 95.0, "desired_life_hours": 15000.0}
            }
        }
