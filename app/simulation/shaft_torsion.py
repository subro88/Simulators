"""
Shaft Torsion & Power Transmission Physics Engine
=================================================
Calculates polar moment of inertia J, peak torsional shear stress tau_max,
angle of twist theta, torsional stiffness GJ/L, and transmitted power P.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ShaftTorsionInput(BaseModel):
    shaft_type: Literal["solid", "hollow"] = Field(
        default="solid",
        description="Shaft cross-section geometry: Solid or Hollow Circular"
    )
    outer_diameter_mm: float = Field(default=50.0, ge=10.0, le=500.0, description="Outer shaft diameter D in mm")
    inner_diameter_mm: float = Field(default=30.0, ge=0.0, le=450.0, description="Inner shaft diameter d in mm (for hollow shaft)")
    shaft_length_mm: float = Field(default=1000.0, ge=100.0, le=5000.0, description="Shaft length L in mm")
    applied_torque_nm: float = Field(default=1200.0, ge=10.0, le=50000.0, description="Applied twisting torque T in N·m")
    shear_modulus_gpa: float = Field(default=80.0, ge=5.0, le=200.0, description="Shear Modulus G in GPa (Steel ≈ 80 GPa)")
    rotational_speed_rpm: float = Field(default=1440.0, ge=0.0, le=10000.0, description="Shaft rotational speed N in RPM")


class ShaftTorsionOutput(BaseModel):
    polar_moment_of_inertia_mm4: float
    max_shear_stress_mpa: float
    angle_of_twist_deg: float
    torsional_rigidity_nm2: float
    transmitted_power_kw: float
    mass_saving_pct: float
    status_note: str


class ShaftTorsionEngine(BaseSimulationEngine):
    name = "shaft-torsion"
    description = "Torsion formula and rigidity: shear stress tau, angle of twist theta, polar inertia J, and transmitted power"

    def calculate(self, params: ShaftTorsionInput) -> ShaftTorsionOutput:
        D = params.outer_diameter_mm
        d = params.inner_diameter_mm if params.shaft_type == "hollow" else 0.0

        if params.shaft_type == "hollow" and d >= D:
            d = D * 0.5  # fallback safety

        # Polar Moment of Inertia J = pi * (D^4 - d^4) / 32
        j_mm4 = (math.pi * ((D ** 4) - (d ** 4))) / 32.0
        j_m4 = j_mm4 * 1e-12

        t_nm = params.applied_torque_nm
        t_nmm = t_nm * 1000.0

        r_outer_mm = D / 2.0
        # Shear stress tau = T * r / J
        tau_mpa = (t_nmm * r_outer_mm) / j_mm4 if j_mm4 > 0 else 0.0

        g_pa = params.shear_modulus_gpa * 1e9
        l_m = params.shaft_length_mm / 1000.0

        # Angle of twist theta = T * L / (G * J) in radians
        theta_rad = (t_nm * l_m) / (g_pa * j_m4) if (g_pa * j_m4) > 0 else 0.0
        theta_deg = math.degrees(theta_rad)

        # Torsional Rigidity = G * J (N·m^2)
        gj_rigidity = g_pa * j_m4

        # Power P = (2 * pi * N * T) / 60 in kW
        n_rpm = params.rotational_speed_rpm
        power_kw = (2.0 * math.pi * n_rpm * t_nm) / 60000.0

        # Mass saving for hollow vs solid shaft of same outer diameter
        mass_saving_pct = ((d ** 2) / (D ** 2)) * 100.0 if D > 0 else 0.0

        type_title = "Hollow Shaft" if params.shaft_type == "hollow" else "Solid Shaft"
        note = (
            f"{type_title}: Max Shear Stress τ = {tau_mpa:.1f} MPa | Twist Angle θ = {theta_deg:.2f}° "
            f"| Power = {power_kw:.1f} kW at {n_rpm:.0f} RPM (Mass Saved = {mass_saving_pct:.1f}%)."
        )

        return ShaftTorsionOutput(
            polar_moment_of_inertia_mm4=float(j_mm4),
            max_shear_stress_mpa=float(tau_mpa),
            angle_of_twist_deg=float(theta_deg),
            torsional_rigidity_nm2=float(gj_rigidity),
            transmitted_power_kw=float(power_kw),
            mass_saving_pct=float(mass_saving_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "automotive_driveshaft": {
                "name": "Automotive Hollow Driveshaft",
                "params": {"shaft_type": "hollow", "outer_diameter_mm": 75.0, "inner_diameter_mm": 60.0, "shaft_length_mm": 1200.0, "applied_torque_nm": 2200.0, "rotational_speed_rpm": 2500.0}
            },
            "industrial_pump_shaft": {
                "name": "Industrial Pump Solid Shaft",
                "params": {"shaft_type": "solid", "outer_diameter_mm": 60.0, "inner_diameter_mm": 0.0, "shaft_length_mm": 800.0, "applied_torque_nm": 1500.0, "rotational_speed_rpm": 1440.0}
            }
        }
