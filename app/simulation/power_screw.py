"""
Power Screw & Threaded Actuator Mechanics Physics Engine
=========================================================
Calculates mean thread diameter d_m, helix angle lambda, raising torque Tu,
lowering torque Td, mechanical efficiency eta, and self-locking conditions.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PowerScrewInput(BaseModel):
    thread_profile: Literal["square_thread", "acme_thread"] = Field(
        default="square_thread",
        description="Thread cross-section profile"
    )
    nominal_diameter_mm: float = Field(default=40.0, ge=10.0, le=200.0, description="Major outer diameter d in mm")
    pitch_mm: float = Field(default=7.0, ge=1.0, le=30.0, description="Thread pitch p in mm")
    axial_load_kn: float = Field(default=20.0, ge=0.5, le=500.0, description="Axial load W to be moved in kN")
    thread_friction_coeff: float = Field(default=0.15, ge=0.02, le=0.50, description="Coefficient of friction mu on threads")
    collar_friction_coeff: float = Field(default=0.12, ge=0.0, le=0.50, description="Collar friction coefficient mu_c")
    collar_mean_dia_mm: float = Field(default=50.0, ge=10.0, le=300.0, description="Collar mean friction diameter D_c in mm")


class PowerScrewOutput(BaseModel):
    mean_diameter_mm: float
    helix_angle_deg: float
    friction_angle_deg: float
    torque_to_raise_nm: float
    torque_to_lower_nm: float
    screw_efficiency_pct: float
    is_self_locking: bool
    status_note: str


class PowerScrewEngine(BaseSimulationEngine):
    name = "power-screw"
    description = "Power screw kinematics and friction torque: Square/Acme thread raising torque Tu, lowering torque Td, and efficiency"

    def calculate(self, params: PowerScrewInput) -> PowerScrewOutput:
        d = params.nominal_diameter_mm
        p = params.pitch_mm
        w_n = params.axial_load_kn * 1000.0
        mu = params.thread_friction_coeff
        mu_c = params.collar_friction_coeff
        d_c_m = params.collar_mean_dia_mm / 1000.0

        # Mean diameter d_m = d - p/2
        d_m_mm = d - (p / 2.0)
        d_m_m = d_m_mm / 1000.0

        # Helix angle tan(lambda) = p / (pi * d_m)
        tan_lambda = p / (math.pi * d_m_mm) if d_m_mm > 0 else 0.1
        lambda_rad = math.atan(tan_lambda)
        lambda_deg = math.degrees(lambda_rad)

        # Virtual friction coefficient for Acme threads (2alpha = 29 deg => alpha = 14.5 deg)
        if params.thread_profile == "acme_thread":
            alpha_rad = math.radians(14.5)
            mu_eff = mu / math.cos(alpha_rad)
            profile_name = "Acme Thread (29°)"
        else:
            mu_eff = mu
            profile_name = "Square Thread"

        phi_rad = math.atan(mu_eff)
        phi_deg = math.degrees(phi_rad)

        # Torque to raise load Tu = (W * d_m / 2) * tan(lambda + phi) + collar_torque
        tan_sum = math.tan(lambda_rad + phi_rad)
        t_thread_raise = (w_n * d_m_m / 2.0) * tan_sum
        t_collar = (mu_c * w_n * d_c_m / 2.0)
        t_raise_nm = t_thread_raise + t_collar

        # Torque to lower load Td = (W * d_m / 2) * tan(phi - lambda) + collar_torque
        tan_diff = math.tan(phi_rad - lambda_rad)
        t_thread_lower = (w_n * d_m_m / 2.0) * tan_diff
        t_lower_nm = t_thread_lower + t_collar

        # Efficiency eta = W * p / (2 * pi * T_raise)
        eff_pct = (w_n * (p / 1000.0)) / (2.0 * math.pi * t_raise_nm) * 100.0 if t_raise_nm > 0 else 0.0

        is_self_locking = phi_rad >= lambda_rad

        status_text = "Self-Locking (Safe under load)" if is_self_locking else "Overhauling (Requires back-drive brake)"

        note = (
            f"{profile_name}: Helix Angle λ = {lambda_deg:.2f}° | Raising Torque Tu = {t_raise_nm:.1f} N·m "
            f"| Efficiency η = {eff_pct:.1f}% ({status_text})."
        )

        return PowerScrewOutput(
            mean_diameter_mm=float(d_m_mm),
            helix_angle_deg=float(lambda_deg),
            friction_angle_deg=float(phi_deg),
            torque_to_raise_nm=float(t_raise_nm),
            torque_to_lower_nm=float(t_lower_nm),
            screw_efficiency_pct=float(eff_pct),
            is_self_locking=is_self_locking,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "heavy_press_screw": {
                "name": "Heavy Press Square Thread Screw",
                "params": {"thread_profile": "square_thread", "nominal_diameter_mm": 50.0, "pitch_mm": 8.0, "axial_load_kn": 40.0, "thread_friction_coeff": 0.15, "collar_friction_coeff": 0.12}
            },
            "lathe_lead_screw": {
                "name": "Lathe Lead Screw (Acme Thread)",
                "params": {"thread_profile": "acme_thread", "nominal_diameter_mm": 32.0, "pitch_mm": 6.0, "axial_load_kn": 12.0, "thread_friction_coeff": 0.10, "collar_friction_coeff": 0.08}
            }
        }
