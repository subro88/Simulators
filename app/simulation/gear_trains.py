"""
Gear Trains Kinematics & Speed Ratio Physics Engine
===================================================
Calculates speed ratios, direction of rotation, pitch circle diameters,
center distances, and torque multiplication for Simple, Compound, and Reverted gear trains.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class GearTrainsInput(BaseModel):
    """Input parameters for Gear Trains simulation."""
    train_type: Literal["simple", "compound", "reverted"] = Field(
        default="simple",
        description="Type of gear train layout"
    )
    module_mm: float = Field(default=3.0, ge=1.0, le=10.0, description="Gear tooth module m in mm")
    driver_teeth: int = Field(default=20, ge=12, le=120, description="Driver gear teeth Z1")
    idler_teeth: int = Field(default=40, ge=12, le=120, description="Idler gear teeth Z2 (for simple train)")
    driven_teeth: int = Field(default=60, ge=12, le=150, description="Driven gear teeth Z3")
    input_rpm: float = Field(default=1440.0, ge=100.0, le=6000.0, description="Input driver shaft speed in RPM")
    input_torque_nm: float = Field(default=100.0, ge=10.0, le=1000.0, description="Input torque in N·m")
    efficiency_pct: float = Field(default=96.0, ge=70.0, le=99.0, description="Gear mesh mechanical efficiency %")


class GearTrainsOutput(BaseModel):
    """Calculated output kinematics for Gear Trains."""
    train_type: str
    gear_ratio: float
    output_rpm: float
    output_torque_nm: float
    rotation_direction: str
    driver_pitch_diameter_mm: float
    driven_pitch_diameter_mm: float
    center_distance_mm: float
    status_note: str


class GearTrainsEngine(BaseSimulationEngine):
    """Kinematics simulation engine for Spur & Helical Gear Trains."""

    name = "gear-trains"
    description = "Speed ratio i = N_in / N_out, torque multiplication, pitch diameters, and direction of rotation"

    def calculate(self, params: GearTrainsInput) -> GearTrainsOutput:
        m = params.module_mm
        z1 = params.driver_teeth
        z2 = params.idler_teeth
        z3 = params.driven_teeth

        d1 = m * z1
        d3 = m * z3

        if params.train_type == "simple":
            # Ratio i = Z3 / Z1 (Idler Z2 cancels out in ratio equation)
            ratio = z3 / z1
            direction = "Same as Driver" if 3 % 2 == 1 else "Opposite to Driver" # 3 gears -> Same direction
            center_dist = (d1 + 2.0 * (m * z2) + d3) / 2.0
            type_title = "Simple Gear Train with Idler"
        elif params.train_type == "compound":
            # Compound: i = (Z2 * Z4) / (Z1 * Z3) -> approximated as z3 / z1 * 2
            ratio = (z2 / z1) * (z3 / z2)
            direction = "Same as Driver"
            center_dist = (d1 + d3) / 2.0 + (m * z2)
            type_title = "Compound Gear Train"
        else: # Reverted
            ratio = z3 / z1
            direction = "Same as Driver"
            center_dist = (d1 + d3) / 2.0
            type_title = "Reverted Co-Axial Gear Train"

        output_rpm = params.input_rpm / ratio
        eta = params.efficiency_pct / 100.0
        output_torque = params.input_torque_nm * ratio * eta

        note = (
            f"{type_title}: Gear Ratio i = {ratio:.2f}:1 | Output Speed = {output_rpm:.1f} RPM | "
            f"Output Torque = {output_torque:.1f} N·m ({direction})."
        )

        return GearTrainsOutput(
            train_type=type_title,
            gear_ratio=float(ratio),
            output_rpm=float(output_rpm),
            output_torque_nm=float(output_torque),
            rotation_direction=direction,
            driver_pitch_diameter_mm=float(d1),
            driven_pitch_diameter_mm=float(d3),
            center_distance_mm=float(center_dist),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "speed_reducer": {
                "name": "3:1 Speed Reducer",
                "params": {"train_type": "simple", "driver_teeth": 20, "idler_teeth": 40, "driven_teeth": 60, "input_rpm": 1440.0}
            },
            "high_torque_compound": {
                "name": "High Torque Compound Train",
                "params": {"train_type": "compound", "driver_teeth": 15, "idler_teeth": 45, "driven_teeth": 75, "input_rpm": 1500.0}
            }
        }
