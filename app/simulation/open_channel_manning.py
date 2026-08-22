"""
Open Channel Flow (Manning's Equation) Physics Engine
=====================================================
Calculates area A, wetted perimeter P, hydraulic radius Rh, flow velocity v,
Manning discharge Q, and Froude Number Fr.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class OpenChannelManningInput(BaseModel):
    channel_shape: Literal["trapezoidal", "rectangular", "triangular"] = Field(default="trapezoidal", description="Canal cross-section geometry")
    bottom_width_b_m: float = Field(default=3.0, ge=0.5, le=20.0, description="Channel bottom width B in meters")
    water_depth_y_m: float = Field(default=1.5, ge=0.1, le=10.0, description="Flow water depth y in meters")
    side_slope_z: float = Field(default=1.5, ge=0.0, le=5.0, description="Trapezoidal side slope z (1:z)")
    channel_bed_slope_s: float = Field(default=0.001, ge=0.0001, le=0.05, description="Longitudinal bed slope S")
    manning_roughness_n: float = Field(default=0.025, ge=0.009, le=0.1, description="Manning's roughness coefficient n")


class OpenChannelManningOutput(BaseModel):
    flow_area_m2: float
    wetted_perimeter_m: float
    hydraulic_radius_m: float
    flow_velocity_m_s: float
    discharge_m3_s: float
    froude_number: float
    flow_regime: str
    status_note: str


class OpenChannelManningEngine(BaseSimulationEngine):
    name = "open-channel-manning"
    description = "Open Channel Open Flow Hydraulics: Manning's Q = (1/n)*A*Rh^(2/3)*S^(1/2), velocity v, and Froude number Fr"

    def calculate(self, params: OpenChannelManningInput) -> OpenChannelManningOutput:
        b = params.bottom_width_b_m
        y = params.water_depth_y_m
        z = params.side_slope_z
        s = params.channel_bed_slope_s
        n = params.manning_roughness_n

        if params.channel_shape == "rectangular":
            area = b * y
            pw = b + 2.0 * y
            dh = y
        elif params.channel_shape == "triangular":
            area = z * (y ** 2)
            pw = 2.0 * y * math.sqrt(1.0 + z ** 2)
            dh = y / 2.0
        else: # trapezoidal
            area = (b + z * y) * y
            pw = b + 2.0 * y * math.sqrt(1.0 + z ** 2)
            dh = area / (b + 2.0 * z * y)

        # Hydraulic Radius Rh = A / P
        rh = area / pw if pw > 0 else 0.5

        # Flow Velocity v = (1 / n) * Rh^(2/3) * S^(1/2) (m/s)
        v_m_s = (1.0 / n) * math.pow(rh, 2.0 / 3.0) * math.sqrt(s) if n > 0 else 0.0

        # Discharge Q = A * v (m^3/s)
        q_m3_s = area * v_m_s

        # Froude Number Fr = v / sqrt(g * Dh)
        g = 9.81
        fr = v_m_s / math.sqrt(g * dh) if dh > 0 else 0.0

        if math.isclose(fr, 1.0, abs_tol=0.05):
            regime = "CRITICAL FLOW (Fr = 1.0)"
        elif fr < 1.0:
            regime = "SUBCRITICAL FLOW (Fr < 1.0 — Tranquil Water)"
        else:
            regime = "SUPERCRITICAL FLOW (Fr > 1.0 — Rapid Water)"

        note = (
            f"Manning's Open Channel ({params.channel_shape.capitalize()}, Depth = {y:.2f}m, Bed Slope = {s}): "
            f"Flow Area A = {area:.2f} m² | Hydraulic Radius Rh = {rh:.2f} m | "
            f"Velocity v = {v_m_s:.2f} m/s | Discharge Q = {q_m3_s:.2f} m³/s | Froude Fr = {fr:.2f} ({regime})."
        )

        return OpenChannelManningOutput(
            flow_area_m2=float(area),
            wetted_perimeter_m=float(pw),
            hydraulic_radius_m=float(rh),
            flow_velocity_m_s=float(v_m_s),
            discharge_m3_s=float(q_m3_s),
            froude_number=float(fr),
            flow_regime=regime,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "unlined_earthen_canal": {
                "name": "Trapezoidal Unlined Earthen Canal (b=3m, y=1.5m)",
                "params": {"channel_shape": "trapezoidal", "bottom_width_b_m": 3.0, "water_depth_y_m": 1.5, "side_slope_z": 1.5, "channel_bed_slope_s": 0.001, "manning_roughness_n": 0.025}
            },
            "concrete_lined_rect": {
                "name": "Smooth Concrete Lined Flume (Rectangular)",
                "params": {"channel_shape": "rectangular", "bottom_width_b_m": 2.0, "water_depth_y_m": 1.0, "side_slope_z": 0.0, "channel_bed_slope_s": 0.002, "manning_roughness_n": 0.014}
            }
        }
