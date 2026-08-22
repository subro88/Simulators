"""
Cam & Follower Kinematics Physics Engine
========================================
Calculates displacement y(theta), velocity v(theta), acceleration a(theta), and jerk
for S.H.M., Cycloidal, Uniform Velocity, and U.A.R.M. follower motions.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CamFollowerInput(BaseModel):
    """Input parameters for Cam & Follower simulation."""
    follower_motion: Literal["shm", "cycloidal", "uniform_velocity", "uarm"] = Field(
        default="shm",
        description="Type of follower lift motion curve"
    )
    follower_type: Literal["roller", "knife_edge", "flat_face"] = Field(
        default="roller",
        description="Type of follower contact geometry"
    )
    stroke_stroke_mm: float = Field(default=40.0, ge=10.0, le=120.0, description="Total follower lift stroke S in mm")
    outstroke_angle_deg: float = Field(default=120.0, ge=30.0, le=180.0, description="Outstroke angle theta_o in degrees")
    dwell_top_angle_deg: float = Field(default=30.0, ge=0.0, le=120.0, description="Dwell angle at top position theta_d1 in degrees")
    return_angle_deg: float = Field(default=120.0, ge=30.0, le=180.0, description="Return stroke angle theta_r in degrees")
    base_circle_radius_mm: float = Field(default=60.0, ge=20.0, le=150.0, description="Cam base circle radius r0 in mm")
    cam_rpm: float = Field(default=300.0, ge=10.0, le=3000.0, description="Camshaft rotational speed in RPM")
    cam_angle_deg: float = Field(default=45.0, ge=0.0, le=360.0, description="Instantaneous cam angle theta in degrees")


class CamFollowerOutput(BaseModel):
    """Calculated output kinematics for Cam & Follower."""
    motion_type: str
    follower_displacement_mm: float
    follower_velocity_ms: float
    follower_acceleration_ms2: float
    max_velocity_ms: float
    max_acceleration_ms2: float
    max_pressure_angle_deg: float
    status_note: str


class CamFollowerEngine(BaseSimulationEngine):
    """Kinematics simulation engine for Cams & Followers."""

    name = "cam-follower"
    description = "S.H.M., Cycloidal, U.A.R.M. cam profile displacement, velocity, acceleration, and pressure angle"

    def calculate(self, params: CamFollowerInput) -> CamFollowerOutput:
        S = params.stroke_stroke_mm / 1000.0
        r0 = params.base_circle_radius_mm / 1000.0
        theta_o = math.radians(params.outstroke_angle_deg)
        theta_d1 = math.radians(params.dwell_top_angle_deg)
        theta_r = math.radians(params.return_angle_deg)

        omega = (params.cam_rpm * 2.0 * math.pi) / 60.0
        theta = math.radians(params.cam_angle_deg % 360.0)

        # Displacement y, Velocity v, Acceleration a
        y, v, a = 0.0, 0.0, 0.0

        if theta < theta_o:
            # Outstroke phase
            ratio = theta / theta_o
            if params.follower_motion == "shm":
                y = (S / 2.0) * (1.0 - math.cos(math.pi * ratio))
                v = (math.pi * S * omega / (2.0 * theta_o)) * math.sin(math.pi * ratio)
                a = ((math.pi**2 * S * omega**2) / (2.0 * theta_o**2)) * math.cos(math.pi * ratio)
            elif params.follower_motion == "cycloidal":
                y = S * (ratio - (1.0 / (2.0 * math.pi)) * math.sin(2.0 * math.pi * ratio))
                v = (S * omega / theta_o) * (1.0 - math.cos(2.0 * math.pi * ratio))
                a = ((2.0 * math.pi * S * omega**2) / (theta_o**2)) * math.sin(2.0 * math.pi * ratio)
            else: # Uniform Velocity
                y = S * ratio
                v = S * omega / theta_o
                a = 0.0
        elif theta < (theta_o + theta_d1):
            # Top Dwell phase
            y = S
            v, a = 0.0, 0.0
        elif theta < (theta_o + theta_d1 + theta_r):
            # Return Stroke phase
            ratio = (theta - theta_o - theta_d1) / theta_r
            if params.follower_motion == "shm":
                y = (S / 2.0) * (1.0 + math.cos(math.pi * ratio))
                v = -(math.pi * S * omega / (2.0 * theta_r)) * math.sin(math.pi * ratio)
                a = -((math.pi**2 * S * omega**2) / (2.0 * theta_r**2)) * math.cos(math.pi * ratio)
            elif params.follower_motion == "cycloidal":
                y = S * (1.0 - ratio + (1.0 / (2.0 * math.pi)) * math.sin(2.0 * math.pi * ratio))
                v = -(S * omega / theta_r) * (1.0 - math.cos(2.0 * math.pi * ratio))
                a = -((2.0 * math.pi * S * omega**2) / (theta_r**2)) * math.sin(2.0 * math.pi * ratio)
            else:
                y = S * (1.0 - ratio)
                v = -S * omega / theta_r
                a = 0.0
        else:
            # Bottom Dwell phase
            y, v, a = 0.0, 0.0, 0.0

        # Maximum velocity & acceleration estimates
        v_max = (math.pi * S * omega) / (2.0 * theta_o)
        a_max = (math.pi**2 * S * omega**2) / (2.0 * theta_o**2)

        # Max pressure angle alpha = atan(v / (r0 + y))
        curr_r = r0 + y
        press_angle_rad = math.atan(abs(v) / (omega * curr_r)) if omega * curr_r > 0 else 0.0
        press_angle_deg = math.degrees(press_angle_rad)

        motion_title = params.follower_motion.upper() + " Motion"
        note = (
            f"{motion_title}: Displacement = {y*1000.0:.1f} mm | Velocity = {v:.2f} m/s | "
            f"Pressure Angle = {press_angle_deg:.1f}°."
        )

        return CamFollowerOutput(
            motion_type=motion_title,
            follower_displacement_mm=float(y * 1000.0),
            follower_velocity_ms=float(v),
            follower_acceleration_ms2=float(a),
            max_velocity_ms=float(v_max),
            max_acceleration_ms2=float(a_max),
            max_pressure_angle_deg=float(press_angle_deg),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "shm_smooth": {
                "name": "S.H.M. Smooth Motion (High Speed)",
                "params": {"follower_motion": "shm", "follower_type": "roller", "stroke_stroke_mm": 40.0, "cam_rpm": 600.0}
            },
            "cycloidal_zero_jerk": {
                "name": "Cycloidal Low-Jerk Motion",
                "params": {"follower_motion": "cycloidal", "follower_type": "roller", "stroke_stroke_mm": 50.0, "cam_rpm": 1200.0}
            }
        }
