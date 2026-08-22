"""
Cross-Section Properties & Geometric Section Modulus Physics Engine
====================================================================
Calculates area A, centroidal moments of inertia Ix and Iy, section moduli Zx and Zy,
and radii of gyration rx and ry across structural geometries (I-Beam, Channel, Hollow Circle, Box).
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CrossSectionPropsInput(BaseModel):
    section_type: Literal["i_beam", "channel", "hollow_circle", "rectangular_box"] = Field(
        default="i_beam",
        description="Cross-section geometric shape"
    )
    overall_height_mm: float = Field(default=200.0, ge=20.0, le=1000.0, description="Overall section height H in mm")
    flange_width_mm: float = Field(default=100.0, ge=10.0, le=600.0, description="Flange width B in mm")
    web_thickness_mm: float = Field(default=8.0, ge=1.0, le=50.0, description="Web thickness t_w in mm")
    flange_thickness_mm: float = Field(default=12.0, ge=1.0, le=80.0, description="Flange thickness t_f in mm")


class CrossSectionPropsOutput(BaseModel):
    section_type: str
    area_mm2: float
    moment_of_inertia_ix_cm4: float
    moment_of_inertia_iy_cm4: float
    section_modulus_zx_cm3: float
    section_modulus_zy_cm3: float
    radius_of_gyration_rx_mm: float
    radius_of_gyration_ry_mm: float
    status_note: str


class CrossSectionPropsEngine(BaseSimulationEngine):
    name = "cross-section-props"
    description = "Structural cross-section properties: Area A, Ix, Iy, section moduli Zx, Zy, and radii of gyration rx, ry"

    def calculate(self, params: CrossSectionPropsInput) -> CrossSectionPropsOutput:
        h = params.overall_height_mm
        b = params.flange_width_mm
        tw = params.web_thickness_mm
        tf = params.flange_thickness_mm

        if params.section_type == "i_beam":
            # I-Beam: 2 flanges + 1 web
            h_web = max(1.0, h - 2.0 * tf)
            area = (2.0 * b * tf) + (h_web * tw)
            # Ix = (b * h^3 / 12) - ((b - tw) * h_web^3 / 12)
            ix = (b * (h ** 3) / 12.0) - ((b - tw) * (h_web ** 3) / 12.0)
            # Iy = (2 * (tf * b^3 / 12)) + (h_web * tw^3 / 12)
            iy = (2.0 * (tf * (b ** 3) / 12.0)) + (h_web * (tw ** 3) / 12.0)
            type_title = "Standard I-Beam Section"

        elif params.section_type == "channel":
            h_web = max(1.0, h - 2.0 * tf)
            area = (2.0 * b * tf) + (h_web * tw)
            ix = (b * (h ** 3) / 12.0) - ((b - tw) * (h_web ** 3) / 12.0)
            iy = (2.0 * tf * (b ** 3) / 3.0) + (h_web * (tw ** 3) / 12.0)
            type_title = "C-Channel Section"

        elif params.section_type == "hollow_circle":
            r_o = h / 2.0
            r_i = max(0.0, r_o - tf)
            area = math.pi * ((r_o ** 2) - (r_i ** 2))
            ix = (math.pi / 4.0) * ((r_o ** 4) - (r_i ** 4))
            iy = ix
            type_title = "Hollow Circular Tube"

        else: # rectangular_box
            b_in = max(0.0, b - 2.0 * tw)
            h_in = max(0.0, h - 2.0 * tf)
            area = (b * h) - (b_in * h_in)
            ix = (b * (h ** 3) / 12.0) - (b_in * (h_in ** 3) / 12.0)
            iy = (h * (b ** 3) / 12.0) - (h_in * (b_in ** 3) / 12.0)
            type_title = "Hollow Rectangular Box Section"

        ix_cm4 = ix / 1e4
        iy_cm4 = iy / 1e4

        # Section modulus Zx = Ix / (H/2), Zy = Iy / (B/2)
        zx_mm3 = ix / (h / 2.0) if h > 0 else 0.0
        zy_mm3 = iy / (b / 2.0) if b > 0 else 0.0

        zx_cm3 = zx_mm3 / 1000.0
        zy_cm3 = zy_mm3 / 1000.0

        # Radius of gyration rx = sqrt(Ix / A), ry = sqrt(Iy / A)
        rx_mm = math.sqrt(ix / area) if area > 0 else 0.0
        ry_mm = math.sqrt(iy / area) if area > 0 else 0.0

        note = (
            f"{type_title}: Area = {area:.1f} mm² | Ix = {ix_cm4:.1f} cm⁴, Iy = {iy_cm4:.1f} cm⁴ | "
            f"Section Modulus Zx = {zx_cm3:.1f} cm³ | Radius of Gyration rx = {rx_mm:.1f} mm, ry = {ry_mm:.1f} mm."
        )

        return CrossSectionPropsOutput(
            section_type=type_title,
            area_mm2=float(area),
            moment_of_inertia_ix_cm4=float(ix_cm4),
            moment_of_inertia_iy_cm4=float(iy_cm4),
            section_modulus_zx_cm3=float(zx_cm3),
            section_modulus_zy_cm3=float(zy_cm3),
            radius_of_gyration_rx_mm=float(rx_mm),
            radius_of_gyration_ry_mm=float(ry_mm),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "w200_ibeam": {
                "name": "W200x30 Structural Steel I-Beam",
                "params": {"section_type": "i_beam", "overall_height_mm": 200.0, "flange_width_mm": 100.0, "web_thickness_mm": 6.5, "flange_thickness_mm": 10.0}
            },
            "box_girder": {
                "name": "Rectangular Hollow Structural Box Girder",
                "params": {"section_type": "rectangular_box", "overall_height_mm": 250.0, "flange_width_mm": 150.0, "web_thickness_mm": 8.0, "flange_thickness_mm": 12.0}
            }
        }
