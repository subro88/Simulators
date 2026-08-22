"""
Helical & Leaf Spring Design Physics Engine
============================================
Calculates spring index C, Wahl stress factor Kw, shear stress tau,
deflection delta, spring stiffness k, and solid length L_s.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SpringDesignInput(BaseModel):
    spring_type: Literal["helical_compression", "multi_leaf"] = Field(
        default="helical_compression",
        description="Spring mechanism geometry: Helical Compression or Multi-Leaf"
    )
    applied_load_n: float = Field(default=800.0, ge=10.0, le=50000.0, description="Axial load F applied on spring in N")
    wire_diameter_mm: float = Field(default=6.0, ge=0.5, le=50.0, description="Wire diameter d in mm")
    mean_coil_diameter_mm: float = Field(default=48.0, ge=5.0, le=300.0, description="Mean coil diameter D in mm")
    active_coils: int = Field(default=8, ge=2, le=50, description="Number of active coils n_a")
    shear_modulus_gpa: float = Field(default=79.0, ge=10.0, le=200.0, description="Material Shear Modulus G in GPa (Spring Steel ≈ 79 GPa)")


class SpringDesignOutput(BaseModel):
    spring_index_c: float
    wahl_factor_kw: float
    shear_stress_mpa: float
    deflection_mm: float
    spring_rate_n_mm: float
    solid_length_mm: float
    free_length_mm: float
    status_note: str


class SpringDesignEngine(BaseSimulationEngine):
    name = "spring-design"
    description = "Helical and leaf spring mechanics: Wahl factor Kw, shear stress, deflection, spring rate k, and solid height"

    def calculate(self, params: SpringDesignInput) -> SpringDesignOutput:
        d = params.wire_diameter_mm
        D = params.mean_coil_diameter_mm
        f = params.applied_load_n
        n_a = float(params.active_coils)
        g_pa = params.shear_modulus_gpa

        # Spring Index C = D / d
        c_index = D / d if d > 0 else 8.0

        # Wahl Stress Factor Kw = (4C - 1)/(4C - 4) + 0.615 / C
        kw = ((4.0 * c_index - 1.0) / (4.0 * c_index - 4.0)) + (0.615 / c_index) if c_index > 1.0 else 1.2

        # Shear stress tau = Kw * (8 * F * D) / (pi * d^3) in MPa
        tau_mpa = (kw * 8.0 * f * D) / (math.pi * (d ** 3)) if d > 0 else 0.0

        # Deflection delta = (8 * F * D^3 * n_a) / (G * d^4)
        g_mpa = g_pa * 1000.0
        delta_mm = (8.0 * f * (D ** 3) * n_a) / (g_mpa * (d ** 4)) if (g_mpa * d) > 0 else 0.0

        # Spring stiffness k = F / delta = (G * d^4) / (8 * D^3 * n_a) in N/mm
        k_n_mm = f / delta_mm if delta_mm > 0 else 1.0

        # Solid Length L_s = (n_a + 2) * d (squared and ground ends)
        n_total = n_a + 2.0
        l_solid_mm = n_total * d

        # Free Length L_f = L_s + delta_max + clearance (15% delta)
        l_free_mm = l_solid_mm + (delta_mm * 1.15)

        note = (
            f"Helical Compression Spring (Index C = {c_index:.1f}): Wahl Factor K_w = {kw:.3f} | "
            f"Shear Stress τ = {tau_mpa:.1f} MPa | Deflection δ = {delta_mm:.1f} mm (Stiffness k = {k_n_mm:.2f} N/mm)."
        )

        return SpringDesignOutput(
            spring_index_c=float(c_index),
            wahl_factor_kw=float(kw),
            shear_stress_mpa=float(tau_mpa),
            deflection_mm=float(delta_mm),
            spring_rate_n_mm=float(k_n_mm),
            solid_length_mm=float(l_solid_mm),
            free_length_mm=float(l_free_mm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "valve_spring": {
                "name": "Automotive Engine Valve Spring",
                "params": {"applied_load_n": 650.0, "wire_diameter_mm": 4.5, "mean_coil_diameter_mm": 32.0, "active_coils": 6, "shear_modulus_gpa": 79.0}
            },
            "heavy_suspension_spring": {
                "name": "Heavy Vehicle Coil Suspension Spring",
                "params": {"applied_load_n": 8500.0, "wire_diameter_mm": 16.0, "mean_coil_diameter_mm": 120.0, "active_coils": 9, "shear_modulus_gpa": 79.0}
            }
        }
