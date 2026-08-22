"""
Automotive Open Differential Simulation Engine
=============================================
Calculates exact bevel-gear differential kinematics, wheel speed splits,
spider planet pinion angular velocities, and torque distributions.
"""

from typing import Dict, Any, Literal
import numpy as np
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class DifferentialInput(BaseModel):
    """Input telemetry for Automotive Differential simulation."""
    input_rpm: float = Field(
        default=1200.0,
        ge=0.0,
        le=6000.0,
        description="Propeller/Driveshaft input speed in RPM"
    )
    maneuver: Literal["straight", "left", "right", "slip", "jacked"] = Field(
        default="straight",
        description="Driving maneuver condition"
    )
    turn_bias: float = Field(
        default=60.0,
        ge=50.0,
        le=95.0,
        description="Turn bias percentage allocated to outer wheel (50% = straight)"
    )
    spider_count: int = Field(
        default=2,
        ge=2,
        le=4,
        description="Number of spider planet pinions (2 or 4)"
    )
    axle_teeth: int = Field(
        default=14,
        ge=8,
        le=30,
        description="Number of teeth on side sun gears"
    )
    spider_teeth: int = Field(
        default=10,
        ge=6,
        le=20,
        description="Number of teeth on spider planet pinions"
    )
    final_drive_ratio: float = Field(
        default=4.0,
        ge=1.0,
        le=8.0,
        description="Final drive ratio (Crown Wheel / Drive Pinion)"
    )
    engine_torque_nm: float = Field(
        default=200.0,
        ge=0.0,
        le=1000.0,
        description="Engine input torque at propeller shaft (N·m)"
    )
    left_traction_coeff: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Friction/traction coefficient under left wheel (0=ice, 1=dry asphalt)"
    )
    right_traction_coeff: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Friction/traction coefficient under right wheel (0=ice, 1=dry asphalt)"
    )


class DifferentialOutput(BaseModel):
    """Output calculated telemetry from the physics engine."""
    input_rpm: float
    crown_rpm: float
    left_rpm: float
    right_rpm: float
    spider_rpm: float
    gear_ratio_spider: float
    final_drive_ratio: float
    total_crown_torque_nm: float
    left_torque_nm: float
    right_torque_nm: float
    delivered_power_kw: float
    kinematic_verification: str
    torque_equation: str
    slip_detected: bool
    status_note: str


class DifferentialEngine(BaseSimulationEngine):
    """High-precision physics engine for automotive open differentials."""

    name = "automotive-differential"
    description = "Planetary bevel-gear automotive differential mechanism kinematics and dynamics"

    def calculate(self, params: DifferentialInput) -> DifferentialOutput:
        # Final drive reduction: Pinion -> Crown Wheel
        crown_rpm = params.input_rpm / params.final_drive_ratio
        gear_ratio_spider = params.axle_teeth / params.spider_teeth

        # Kinematic wheel speed distribution
        if params.maneuver == "straight":
            left_rpm = crown_rpm
            right_rpm = crown_rpm
            spider_rpm = 0.0
            status_note = "Straight driving: Spider pinions locked relative to carrier (zero self-rotation)."
            slip_detected = False

        elif params.maneuver == "left":
            # Left turn: inner wheel (left) slows down, outer wheel (right) speeds up
            bias_fraction = params.turn_bias / 100.0
            right_rpm = crown_rpm * 2.0 * bias_fraction
            left_rpm = (2.0 * crown_rpm) - right_rpm
            spider_rpm = (right_rpm - crown_rpm) * gear_ratio_spider
            status_note = f"Left turn: Left (inner) wheel at {left_rpm:.1f} RPM, Right (outer) wheel at {right_rpm:.1f} RPM."
            slip_detected = False

        elif params.maneuver == "right":
            # Right turn: inner wheel (right) slows down, outer wheel (left) speeds up
            bias_fraction = params.turn_bias / 100.0
            left_rpm = crown_rpm * 2.0 * bias_fraction
            right_rpm = (2.0 * crown_rpm) - left_rpm
            spider_rpm = (left_rpm - crown_rpm) * gear_ratio_spider
            status_note = f"Right turn: Right (inner) wheel at {right_rpm:.1f} RPM, Left (outer) wheel at {left_rpm:.1f} RPM."
            slip_detected = False

        elif params.maneuver == "slip":
            # Left wheel slips on ice (0 traction), spins at 2x crown speed, right wheel stationary
            left_rpm = 2.0 * crown_rpm
            right_rpm = 0.0
            spider_rpm = (left_rpm - crown_rpm) * gear_ratio_spider
            status_note = "Traction loss: Left wheel slips uncontrollably; right wheel receives no drive."
            slip_detected = True

        elif params.maneuver == "jacked":
            # Right wheel lifted/jacked off ground
            right_rpm = 2.0 * crown_rpm
            left_rpm = 0.0
            spider_rpm = (right_rpm - crown_rpm) * gear_ratio_spider
            status_note = "One wheel jacked: Free wheel spins at 2x carrier speed; grounded wheel stationary."
            slip_detected = True

        else:
            left_rpm = crown_rpm
            right_rpm = crown_rpm
            spider_rpm = 0.0
            status_note = "Normal operation"
            slip_detected = False

        # Torque distribution:
        # In an open differential, available torque is limited to 2x the minimum traction wheel capacity
        total_crown_torque = params.engine_torque_nm * params.final_drive_ratio
        min_traction = min(params.left_traction_coeff, params.right_traction_coeff)

        if params.maneuver in ["slip", "jacked"]:
            # On zero traction, torque delivered drops to minimum surface resistance
            effective_torque_per_wheel = (total_crown_torque / 2.0) * min(min_traction, 0.05)
        else:
            effective_torque_per_wheel = (total_crown_torque / 2.0) * min_traction

        left_torque = effective_torque_per_wheel
        right_torque = effective_torque_per_wheel

        # Mechanical Power: P = (Torque * Omega) / 1000 in kW
        omega_left = (left_rpm * 2.0 * np.pi) / 60.0
        omega_right = (right_rpm * 2.0 * np.pi) / 60.0
        delivered_power_kw = float(((left_torque * omega_left) + (right_torque * omega_right)) / 1000.0)

        # Mathematical verification string
        kinematic_verif = (
            f"{left_rpm:.1f} RPM (Left) + {right_rpm:.1f} RPM (Right) = "
            f"{left_rpm + right_rpm:.1f} RPM = 2 × {crown_rpm:.1f} RPM (Crown)"
        )

        torque_eq = (
            f"T_left ({left_torque:.1f} N·m) = T_right ({right_torque:.1f} N·m) "
            f"[Open Differential 50/50 Torque Split]"
        )

        return DifferentialOutput(
            input_rpm=float(params.input_rpm),
            crown_rpm=float(crown_rpm),
            left_rpm=float(left_rpm),
            right_rpm=float(right_rpm),
            spider_rpm=float(spider_rpm),
            gear_ratio_spider=float(gear_ratio_spider),
            final_drive_ratio=float(params.final_drive_ratio),
            total_crown_torque_nm=float(total_crown_torque),
            left_torque_nm=float(left_torque),
            right_torque_nm=float(right_torque),
            delivered_power_kw=delivered_power_kw,
            kinematic_verification=kinematic_verif,
            torque_equation=torque_eq,
            slip_detected=slip_detected,
            status_note=status_note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "cruising_highway": {
                "name": "Highway Cruising (Straight)",
                "params": {
                    "input_rpm": 2400.0,
                    "maneuver": "straight",
                    "turn_bias": 60.0,
                    "engine_torque_nm": 180.0
                }
            },
            "sharp_hairpin_left": {
                "name": "Sharp Hairpin (Left Turn)",
                "params": {
                    "input_rpm": 1200.0,
                    "maneuver": "left",
                    "turn_bias": 75.0,
                    "engine_torque_nm": 220.0
                }
            },
            "ice_patch_slip": {
                "name": "Black Ice Patch (Left Slip)",
                "params": {
                    "input_rpm": 1500.0,
                    "maneuver": "slip",
                    "left_traction_coeff": 0.05,
                    "right_traction_coeff": 0.9
                }
            },
            "garage_jacked_test": {
                "name": "Service Inspection (One Wheel Jacked)",
                "params": {
                    "input_rpm": 800.0,
                    "maneuver": "jacked"
                }
            }
        }
