"""
Seismic Equivalent Base Shear (IS 1893) Physics Engine
======================================================
Calculates seismic zone factor Z, building period Ta, spectral acceleration Sa/g,
design horizontal seismic coefficient Ah, and total base shear Vb.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SeismicBaseShearInput(BaseModel):
    seismic_zone: Literal["Zone_II", "Zone_III", "Zone_IV", "Zone_V"] = Field(default="Zone_IV", description="Seismic hazard zone")
    importance_factor_i: float = Field(default=1.2, ge=1.0, le=1.5, description="Building importance factor I")
    response_reduction_r: float = Field(default=5.0, ge=3.0, le=5.0, description="Response reduction factor R (SMRF = 5)")
    building_height_h_m: float = Field(default=24.0, ge=6.0, le=120.0, description="Building height H in meters")
    total_seismic_weight_kn: float = Field(default=15000.0, ge=1000.0, le=200000.0, description="Total building seismic mass weight W in kN")


class SeismicBaseShearOutput(BaseModel):
    seismic_zone: str
    zone_factor_z: float
    fundamental_period_sec: float
    spectral_acceleration_sag: float
    design_seismic_coeff_ah: float
    total_base_shear_kn: float
    status_note: str


class SeismicBaseShearEngine(BaseSimulationEngine):
    name = "seismic-base-shear"
    description = "IS 1893 Earthquake Engineering: Seismic zone factor Z, fundamental period Ta, Ah coefficient, and Total Base Shear Vb"

    def calculate(self, params: SeismicBaseShearInput) -> SeismicBaseShearOutput:
        h = params.building_height_h_m
        w_total = params.total_seismic_weight_kn
        imp = params.importance_factor_i
        r_factor = params.response_reduction_r

        if params.seismic_zone == "Zone_V":
            z_factor = 0.36
            z_title = "Zone V (Very High Seismic Risk — Z = 0.36)"
        elif params.seismic_zone == "Zone_IV":
            z_factor = 0.24
            z_title = "Zone IV (High Seismic Risk — Z = 0.24)"
        elif params.seismic_zone == "Zone_III":
            z_factor = 0.16
            z_title = "Zone III (Moderate Seismic Risk — Z = 0.16)"
        else:
            z_factor = 0.10
            z_title = "Zone II (Low Seismic Risk — Z = 0.10)"

        # Fundamental natural period Ta = 0.075 * H^0.75 (seconds) for RC frame
        t_a = 0.075 * math.pow(h, 0.75)

        # Spectral Acceleration Sa/g for Medium Soil
        if t_a <= 0.10:
            sa_g = 1.0 + 15.0 * t_a
        elif t_a <= 0.55:
            sa_g = 2.50
        else:
            sa_g = 1.36 / t_a

        # Design Horizontal Seismic Coefficient Ah = (Z/2) * (I/R) * (Sa/g)
        a_h = (z_factor / 2.0) * (imp / r_factor) * sa_g

        # Total Seismic Base Shear Vb = Ah * W (kN)
        v_b = a_h * w_total

        note = (
            f"IS 1893 Seismic Design ({z_title}, H = {h:.0f}m): Period Ta = {t_a:.2f} s | "
            f"Spectral Acceleration Sa/g = {sa_g:.2f} | Seismic Coefficient Ah = {a_h:.4f} | "
            f"Total Lateral Base Shear Vb = {v_b:.1f} kN (Weight W = {w_total/1000:.1f} MN)."
        )

        return SeismicBaseShearOutput(
            seismic_zone=z_title,
            zone_factor_z=float(z_factor),
            fundamental_period_sec=float(t_a),
            spectral_acceleration_sag=float(sa_g),
            design_seismic_coeff_ah=float(a_h),
            total_base_shear_kn=float(v_b),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "zone_iv_8story_building": {
                "name": "Zone IV 8-Story RC Building (H=24m, SMRF)",
                "params": {"seismic_zone": "Zone_IV", "importance_factor_i": 1.2, "response_reduction_r": 5.0, "building_height_h_m": 24.0, "total_seismic_weight_kn": 15000.0}
            },
            "zone_v_hospital_building": {
                "name": "Zone V Critical Hospital Building (I = 1.5)",
                "params": {"seismic_zone": "Zone_V", "importance_factor_i": 1.5, "response_reduction_r": 5.0, "building_height_h_m": 30.0, "total_seismic_weight_kn": 25000.0}
            }
        }
