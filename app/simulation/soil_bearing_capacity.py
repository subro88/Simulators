"""
Terzaghi Soil Bearing Capacity Physics Engine
=============================================
Calculates Nc, Nq, Ngamma factors, ultimate bearing capacity qu,
allowable bearing capacity q_allow, and safe soil load.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SoilBearingCapacityInput(BaseModel):
    footing_type: Literal["strip", "square", "circular"] = Field(default="square", description="Shallow footing geometry")
    footing_width_b_m: float = Field(default=2.0, ge=0.5, le=10.0, description="Footing width B in meters")
    footing_depth_df_m: float = Field(default=1.5, ge=0.5, le=5.0, description="Embedment depth Df in meters")
    cohesion_c_kpa: float = Field(default=25.0, ge=0.0, le=200.0, description="Soil cohesion c in kPa")
    friction_angle_deg: float = Field(default=30.0, ge=0.0, le=45.0, description="Soil friction angle phi in degrees")
    unit_weight_gamma_kn_m3: float = Field(default=18.0, ge=12.0, le=24.0, description="Soil moist unit weight gamma in kN/m³")
    factor_of_safety: float = Field(default=3.0, ge=2.0, le=5.0, description="Safety factor FOS")


class SoilBearingCapacityOutput(BaseModel):
    footing_type: str
    nc_factor: float
    nq_factor: float
    ngamma_factor: float
    ultimate_bearing_capacity_kpa: float
    allowable_bearing_capacity_kpa: float
    safe_column_load_kn: float
    status_note: str


class SoilBearingCapacityEngine(BaseSimulationEngine):
    name = "soil-bearing-capacity"
    description = "Terzaghi Shallow Foundation Bearing Capacity: Nc, Nq, Ngamma, ultimate capacity qu, and allowable load"

    def calculate(self, params: SoilBearingCapacityInput) -> SoilBearingCapacityOutput:
        b = params.footing_width_b_m
        df = params.footing_depth_df_m
        c = params.cohesion_c_kpa
        phi_deg = params.friction_angle_deg
        gamma = params.unit_weight_gamma_kn_m3
        fos = params.factor_of_safety

        phi_rad = math.radians(phi_deg)

        # Terzaghi Bearing Capacity Factors Nc, Nq, Ngamma
        if phi_deg == 0:
            nq = 1.0
            nc = 5.7
            ngamma = 0.0
        else:
            nq = math.exp(math.pi * math.tan(phi_rad)) * (math.tan(math.radians(45.0 + phi_deg / 2.0)) ** 2)
            nc = (nq - 1.0) / math.tan(phi_rad)
            ngamma = 2.0 * (nq + 1.0) * math.tan(phi_rad)

        q_surcharge = gamma * df

        if params.footing_type == "strip":
            qu = c * nc + q_surcharge * nq + 0.5 * gamma * b * ngamma
            area = b * 1.0
            type_title = f"Strip Footing (B = {b:.1f}m)"
        elif params.footing_type == "square":
            qu = 1.3 * c * nc + q_surcharge * nq + 0.4 * gamma * b * ngamma
            area = b ** 2
            type_title = f"Square Footing ({b:.1f}m x {b:.1f}m)"
        else: # circular
            qu = 1.3 * c * nc + q_surcharge * nq + 0.3 * gamma * b * ngamma
            area = (math.pi / 4.0) * (b ** 2)
            type_title = f"Circular Footing (Dia = {b:.1f}m)"

        q_allow = qu / fos
        safe_load_kn = q_allow * area

        note = (
            f"Terzaghi Bearing Capacity ({type_title}, ϕ = {phi_deg:.0f}°, c = {c:.0f} kPa): "
            f"Bearing Factors (Nc = {nc:.1f}, Nq = {nq:.1f}, Nγ = {ngamma:.1f}) | "
            f"Ultimate Capacity qu = {qu:.1f} kPa | Allowable q_allow = {q_allow:.1f} kPa (FOS = {fos:.1f}) | "
            f"Safe Column Load = {safe_load_kn:.0f} kN."
        )

        return SoilBearingCapacityOutput(
            footing_type=type_title,
            nc_factor=float(nc),
            nq_factor=float(nq),
            ngamma_factor=float(ngamma),
            ultimate_bearing_capacity_kpa=float(qu),
            allowable_bearing_capacity_kpa=float(q_allow),
            safe_column_load_kn=float(safe_load_kn),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "square_footing_c_phi_soil": {
                "name": "Square Footing in c-phi Soil (2m x 2m)",
                "params": {"footing_type": "square", "footing_width_b_m": 2.0, "footing_depth_df_m": 1.5, "cohesion_c_kpa": 25.0, "friction_angle_deg": 30.0, "unit_weight_gamma_kn_m3": 18.0, "factor_of_safety": 3.0}
            },
            "strip_footing_clay": {
                "name": "Strip Footing on Pure Clay (phi = 0°)",
                "params": {"footing_type": "strip", "footing_width_b_m": 1.5, "footing_depth_df_m": 1.0, "cohesion_c_kpa": 60.0, "friction_angle_deg": 0.0, "unit_weight_gamma_kn_m3": 17.5, "factor_of_safety": 3.0}
            }
        }
