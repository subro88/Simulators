"""
Wind Tunnel Aerodynamics (Drag & Lift) Physics Engine
=====================================================
Calculates dynamic pressure q, drag force FD, lift force FL,
lift-to-drag ratio L/D, and stall condition.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class WindTunnelInput(BaseModel):
    air_velocity_ms: float = Field(default=35.0, ge=1.0, le=120.0, description="Wind tunnel freestream velocity v in m/s")
    angle_of_attack_deg: float = Field(default=6.0, ge=-10.0, le=25.0, description="Airfoil angle of attack alpha in degrees")
    wing_span_m: float = Field(default=1.2, ge=0.2, le=5.0, description="Wing span b in meters")
    wing_chord_m: float = Field(default=0.3, ge=0.05, le=1.0, description="Wing chord c in meters")
    air_density_kg_m3: float = Field(default=1.225, ge=0.5, le=2.0, description="Air density rho in kg/m³ (Standard air = 1.225 kg/m³)")


class WindTunnelOutput(BaseModel):
    wing_area_m2: float
    dynamic_pressure_pa: float
    lift_coefficient_cl: float
    drag_coefficient_cd: float
    lift_force_n: float
    drag_force_n: float
    lift_to_drag_ratio: float
    is_stalled: bool
    status_note: str


class WindTunnelEngine(BaseSimulationEngine):
    name = "wind-tunnel"
    description = "Subsonic wind tunnel aerodynamics: lift coefficient Cl, drag coefficient Cd, L/D ratio, and stall detection"

    def calculate(self, params: WindTunnelInput) -> WindTunnelOutput:
        v = params.air_velocity_ms
        alpha_deg = params.angle_of_attack_deg
        b_span = params.wing_span_m
        c_chord = params.wing_chord_m
        rho = params.air_density_kg_m3

        area_m2 = b_span * c_chord

        # Dynamic pressure q = 0.5 * rho * v^2
        q_pa = 0.5 * rho * (v ** 2)

        # Cl vs Alpha approximation for NACA 0012: Cl = 2 * pi * alpha (in rad), stalls at ~15 deg
        if alpha_deg <= 15.0:
            cl = 2.0 * math.pi * math.radians(alpha_deg)
            # Cd = Cd0 + Cl^2 / (pi * AR * e) where AR = span/chord
            ar = (b_span ** 2) / area_m2 if area_m2 > 0 else 5.0
            cd0 = 0.015
            cd = cd0 + ((cl ** 2) / (math.pi * ar * 0.85))
            is_stalled = False
        else:
            # Post-stall drop off
            cl = 0.6 * math.cos(math.radians(alpha_deg - 15.0))
            cd = 0.25 + 0.5 * math.sin(math.radians(alpha_deg - 15.0))
            is_stalled = True

        # Lift FL = Cl * q * A, Drag FD = Cd * q * A
        f_lift_n = cl * q_pa * area_m2
        f_drag_n = cd * q_pa * area_m2

        l_over_d = cl / cd if cd > 0 else 0.0

        status_text = "NORMAL LIFT (Unstalled)" if not is_stalled else "STALLED (Aerodynamic Flow Separation!)"

        note = (
            f"Aerodynamic Test (α = {alpha_deg:.1f}° at v = {v:.1f} m/s): Lift FL = {f_lift_n:.1f} N, "
            f"Drag FD = {f_drag_n:.1f} N | L/D Ratio = {l_over_d:.1f} (Cl = {cl:.2f}, Cd = {cd:.3f} — {status_text})."
        )

        return WindTunnelOutput(
            wing_area_m2=float(area_m2),
            dynamic_pressure_pa=float(q_pa),
            lift_coefficient_cl=float(cl),
            drag_coefficient_cd=float(cd),
            lift_force_n=float(f_lift_n),
            drag_force_n=float(f_drag_n),
            lift_to_drag_ratio=float(l_over_d),
            is_stalled=is_stalled,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "cruise_flight_naca0012": {
                "name": "NACA Airfoil Cruise Flight (6° AoA)",
                "params": {"air_velocity_ms": 40.0, "angle_of_attack_deg": 6.0, "wing_span_m": 1.5, "wing_chord_m": 0.3}
            },
            "high_aoa_near_stall": {
                "name": "High Angle of Attack (16° Stalled)",
                "params": {"air_velocity_ms": 30.0, "angle_of_attack_deg": 16.0, "wing_span_m": 1.5, "wing_chord_m": 0.3}
            }
        }
