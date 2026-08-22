"""
Two-Stroke Engine Physics & Scavenging Simulation Engine
=========================================================
Calculates 2-stroke thermodynamics, port timing (transfer & exhaust),
scavenging efficiency (Hopkinson/Perfect Mixing model), and power output.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class TwoStrokeInput(BaseModel):
    """Input parameters for Two-Stroke Engine simulation."""
    engine_type: Literal["petrol_reed_valve", "diesel_uniflow"] = Field(
        default="petrol_reed_valve",
        description="Engine type: S.I. Cross-Scavenged or Diesel Uniflow"
    )
    bore_mm: float = Field(
        default=66.0,
        ge=30.0,
        le=200.0,
        description="Cylinder bore diameter in mm"
    )
    stroke_mm: float = Field(
        default=58.0,
        ge=30.0,
        le=200.0,
        description="Piston stroke length in mm"
    )
    compression_ratio: float = Field(
        default=8.5,
        ge=5.0,
        le=20.0,
        description="Trapped compression ratio r"
    )
    engine_rpm: float = Field(
        default=4500.0,
        ge=500.0,
        le=12000.0,
        description="Crankshaft rotational speed in RPM"
    )
    scavenge_ratio: float = Field(
        default=1.2,
        ge=0.5,
        le=2.0,
        description="Delivery ratio Rs (Air delivered / Swept volume)"
    )
    bmep_bar: float = Field(
        default=6.5,
        ge=1.0,
        le=20.0,
        description="Brake Mean Effective Pressure in bar"
    )
    crank_angle_deg: float = Field(
        default=0.0,
        ge=0.0,
        le=360.0,
        description="Crankshaft angle in degrees (0° to 360°)"
    )


class TwoStrokeOutput(BaseModel):
    """Calculated telemetry output for Two-Stroke Engine."""
    engine_type: str
    displacement_cc: float
    scavenging_efficiency_pct: float
    trapping_efficiency_pct: float
    current_stroke_phase: str
    piston_position_mm: float
    indicated_power_kw: float
    brake_power_kw: float
    brake_torque_nm: float
    power_stroke_frequency_hz: float
    status_note: str


class TwoStrokeEngine(BaseSimulationEngine):
    """Physics simulation engine for 2-Stroke Internal Combustion Engines."""

    name = "two-stroke-engine"
    description = "Two-stroke port timing, crankcase compression, scavenging efficiency, and power output"

    def calculate(self, params: TwoStrokeInput) -> TwoStrokeOutput:
        bore_m = params.bore_mm / 1000.0
        stroke_m = params.stroke_mm / 1000.0
        crank_r = stroke_m / 2.0

        # Displacement
        swept_vol_m3 = (math.pi / 4.0) * (bore_m ** 2) * stroke_m
        displacement_cc = swept_vol_m3 * 1e6

        # Scavenging Efficiency (Hopkinson Perfect Mixing model: eta_s = 1 - e^(-Rs))
        eta_scavenge = (1.0 - math.exp(-params.scavenge_ratio)) * 100.0
        eta_trapping = (eta_scavenge / (params.scavenge_ratio * 100.0)) * 100.0 if params.scavenge_ratio > 0 else 0.0

        # Stroke Phase (360° per 2-stroke cycle)
        deg = params.crank_angle_deg % 360.0
        if 0.0 <= deg < 90.0:
            phase = "1. POWER STROKE (Expansion driving piston down)"
        elif 90.0 <= deg < 140.0:
            phase = "2. EXHAUST PORT OPEN (Blowdown burnt gas release)"
        elif 140.0 <= deg < 220.0:
            phase = "3. TRANSFER PORT OPEN (Fresh charge scavenging)"
        elif 220.0 <= deg < 270.0:
            phase = "4. PORT CLOSING (Trapping fresh charge)"
        else:
            phase = "5. COMPRESSION STROKE & CRANKCASE INDUCTION"

        # Piston Position
        rad = math.radians(deg)
        piston_x_m = crank_r * (1.0 - math.cos(rad))
        piston_pos_mm = piston_x_m * 1000.0

        # Power: In 2-stroke, 1 power stroke occurs per revolution (N_cycles = RPM / 60)
        cycles_per_sec = params.engine_rpm / 60.0
        p_bmep_kpa = params.bmep_bar * 100.0
        brake_power_kw = p_bmep_kpa * swept_vol_m3 * cycles_per_sec

        indicated_power_kw = brake_power_kw / 0.82
        omega = (params.engine_rpm * 2.0 * math.pi) / 60.0
        brake_torque_nm = (brake_power_kw * 1000.0) / omega if omega > 0 else 0.0

        type_str = "Two-Stroke Reed Valve Petrol" if params.engine_type == "petrol_reed_valve" else "Two-Stroke Uniflow Diesel"
        status_note = f"{type_str}: Delivering {brake_power_kw:.1f} kW at {params.engine_rpm:.0f} RPM ({cycles_per_sec:.0f} power strokes/sec)."

        return TwoStrokeOutput(
            engine_type=type_str,
            displacement_cc=float(displacement_cc),
            scavenging_efficiency_pct=float(eta_scavenge),
            trapping_efficiency_pct=float(eta_trapping),
            current_stroke_phase=phase,
            piston_position_mm=float(piston_pos_mm),
            indicated_power_kw=float(indicated_power_kw),
            brake_power_kw=float(brake_power_kw),
            brake_torque_nm=float(brake_torque_nm),
            power_stroke_frequency_hz=float(cycles_per_sec),
            status_note=status_note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "high_rev_kart": {
                "name": "125cc High-Rev Kart Engine",
                "params": {
                    "engine_type": "petrol_reed_valve",
                    "bore_mm": 54.0,
                    "stroke_mm": 54.5,
                    "compression_ratio": 9.2,
                    "engine_rpm": 9500.0,
                    "bmep_bar": 9.5
                }
            },
            "marine_uniflow_diesel": {
                "name": "Large Marine Uniflow Diesel Engine",
                "params": {
                    "engine_type": "diesel_uniflow",
                    "bore_mm": 180.0,
                    "stroke_mm": 220.0,
                    "compression_ratio": 16.0,
                    "engine_rpm": 1200.0,
                    "bmep_bar": 14.0
                }
            }
        }
