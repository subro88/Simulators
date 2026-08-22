"""
Beam Bending & Shear Force / Bending Moment (SFD & BMD) Physics Engine
========================================================================
Calculates maximum bending moment M_max, peak bending stress sigma_max,
section modulus Z, curvature radius R, and maximum beam deflection delta_max.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BeamBendingInput(BaseModel):
    support_type: Literal["simply_supported", "cantilever"] = Field(
        default="simply_supported",
        description="Beam boundary support: Simply Supported or Cantilever"
    )
    beam_length_m: float = Field(default=3.0, ge=0.5, le=20.0, description="Beam length L in meters")
    point_load_kn: float = Field(default=20.0, ge=0.0, le=500.0, description="Concentrated load P in kN at midspan (or free end)")
    udl_kn_m: float = Field(default=5.0, ge=0.0, le=100.0, description="Uniformly Distributed Load w in kN/m")
    beam_width_mm: float = Field(default=100.0, ge=10.0, le=500.0, description="Rectangular cross-section width b in mm")
    beam_depth_mm: float = Field(default=200.0, ge=20.0, le=1000.0, description="Rectangular cross-section depth h in mm")
    youngs_modulus_gpa: float = Field(default=200.0, ge=10.0, le=500.0, description="Material Young's Modulus E in GPa")


class BeamBendingOutput(BaseModel):
    moment_of_inertia_mm4: float
    section_modulus_mm3: float
    max_shear_force_kn: float
    max_bending_moment_knm: float
    max_bending_stress_mpa: float
    max_deflection_mm: float
    radius_of_curvature_m: float
    status_note: str


class BeamBendingEngine(BaseSimulationEngine):
    name = "beam-bending"
    description = "Flexure formula and SFD/BMD analysis: bending stress, section modulus Z, deflection, and curvature"

    def calculate(self, params: BeamBendingInput) -> BeamBendingOutput:
        b = params.beam_width_mm
        h = params.beam_depth_mm
        l = params.beam_length_m
        p = params.point_load_kn
        w = params.udl_kn_m

        # Moment of inertia I = b * h^3 / 12 (mm^4)
        i_mm4 = (b * (h ** 3)) / 12.0
        i_m4 = i_mm4 * 1e-12

        # Section modulus Z = I / (h/2) = b * h^2 / 6 (mm^3)
        z_mm3 = (b * (h ** 2)) / 6.0

        if params.support_type == "simply_supported":
            # Max Shear Force V = P/2 + w*L/2
            v_max = (p / 2.0) + (w * l / 2.0)
            # Max Bending Moment M_max = P*L/4 + w*L^2/8
            m_max = (p * l / 4.0) + (w * (l ** 2) / 8.0)

            # Deflection delta_max = P*L^3 / (48*E*I) + 5*w*L^4 / (384*E*I)
            e_pa = params.youngs_modulus_gpa * 1e9
            deflect_p = ((p * 1000.0) * (l ** 3)) / (48.0 * e_pa * i_m4) if i_m4 > 0 else 0.0
            deflect_w = (5.0 * (w * 1000.0) * (l ** 4)) / (384.0 * e_pa * i_m4) if i_m4 > 0 else 0.0
            deflect_m = deflect_p + deflect_w
            type_title = "Simply Supported Beam"
        else:
            # Cantilever
            v_max = p + (w * l)
            m_max = (p * l) + (w * (l ** 2) / 2.0)
            e_pa = params.youngs_modulus_gpa * 1e9
            deflect_p = ((p * 1000.0) * (l ** 3)) / (3.0 * e_pa * i_m4) if i_m4 > 0 else 0.0
            deflect_w = ((w * 1000.0) * (l ** 4)) / (8.0 * e_pa * i_m4) if i_m4 > 0 else 0.0
            deflect_m = deflect_p + deflect_w
            type_title = "Cantilever Beam"

        deflect_mm = deflect_m * 1000.0

        # Bending stress sigma = M / Z
        m_max_nmm = m_max * 1e6
        stress_mpa = m_max_nmm / z_mm3 if z_mm3 > 0 else 0.0

        # Radius of curvature R = E * I / M
        e_pa = params.youngs_modulus_gpa * 1e9
        m_max_nm = m_max * 1000.0
        r_m = (e_pa * i_m4) / m_max_nm if m_max_nm > 0 else 9999.0

        note = (
            f"{type_title}: Peak Moment M_max = {m_max:.2f} kN·m | Max Bending Stress σ = {stress_mpa:.1f} MPa "
            f"| Deflection δ = {deflect_mm:.2f} mm (Section Modulus Z = {z_mm3/1000:.1f} cm³)."
        )

        return BeamBendingOutput(
            moment_of_inertia_mm4=float(i_mm4),
            section_modulus_mm3=float(z_mm3),
            max_shear_force_kn=float(v_max),
            max_bending_moment_knm=float(m_max),
            max_bending_stress_mpa=float(stress_mpa),
            max_deflection_mm=float(deflect_mm),
            radius_of_curvature_m=float(r_m),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str,Any]]:
        return {
            "simply_supported_timber": {
                "name": "Timber Floor Joist (Simply Supported)",
                "params": {"support_type": "simply_supported", "beam_length_m": 4.0, "point_load_kn": 5.0, "udl_kn_m": 2.0, "beam_width_mm": 100.0, "beam_depth_mm": 250.0, "youngs_modulus_gpa": 12.0}
            },
            "cantilever_steel": {
                "name": "Steel Overhang Crane Beam (Cantilever)",
                "params": {"support_type": "cantilever", "beam_length_m": 2.5, "point_load_kn": 25.0, "udl_kn_m": 3.0, "beam_width_mm": 150.0, "beam_depth_mm": 300.0, "youngs_modulus_gpa": 200.0}
            }
        }
