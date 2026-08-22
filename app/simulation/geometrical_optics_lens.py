"""
Geometrical Optics Thin Lens & Lensmaker Physics Engine
======================================================
Calculates focal length f, image distance v, magnification m,
image type (Real/Virtual), and Lensmaker's equation power P (Diopters).
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class GeometricalOpticsLensInput(BaseModel):
    lens_type: Literal["biconvex_converging", "biconcave_diverging"] = Field(default="biconvex_converging", description="Optical lens type")
    object_distance_u_cm: float = Field(default=30.0, ge=1.0, le=500.0, description="Object distance u in cm (positive magnitude)")
    focal_length_f_cm: float = Field(default=15.0, ge=2.0, le=200.0, description="Focal length f in cm")
    object_height_ho_cm: float = Field(default=5.0, ge=0.5, le=50.0, description="Object height ho in cm")


class GeometricalOpticsLensOutput(BaseModel):
    lens_type: str
    focal_length_f_cm: float
    image_distance_v_cm: float
    magnification_m: float
    image_height_hi_cm: float
    optical_power_diopters: float
    image_nature: str
    status_note: str


class GeometricalOpticsLensEngine(BaseSimulationEngine):
    name = "geometrical-optics-lens"
    description = "Geometrical Optics Thin Lens Equation (1/f = 1/v - 1/u): image distance v, magnification m, and optical power P"

    def calculate(self, params: GeometricalOpticsLensInput) -> GeometricalOpticsLensOutput:
        u_mag = params.object_distance_u_cm
        f_mag = params.focal_length_f_cm
        ho = params.object_height_ho_cm

        # Cartesian sign convention: Object distance u is negative (-u_mag)
        u = -u_mag

        if params.lens_type == "biconcave_diverging":
            f = -f_mag
            type_title = "Biconcave Diverging Lens"
        else:
            f = f_mag
            type_title = "Biconvex Converging Lens"

        # Thin lens equation: 1/f = 1/v - 1/u => 1/v = 1/f + 1/u
        inv_v = (1.0 / f) + (1.0 / u)
        v = 1.0 / inv_v if inv_v != 0 else 999.0

        # Magnification m = v / u
        m = v / u
        hi = m * ho

        # Optical Power P = 1 / (f_meters) (Diopters)
        power_d = 100.0 / f if f != 0 else 0.0

        if v > 0:
            nature = "REAL & INVERTED IMAGE (Formed behind lens)"
        else:
            nature = "VIRTUAL & ERECT IMAGE (Formed in front of lens)"

        note = (
            f"{type_title} (f = {f:.1f} cm, u = -{u_mag:.1f} cm): "
            f"Image Distance v = {v:.1f} cm | Magnification m = {m:.2f}x | "
            f"Image Height hi = {abs(hi):.1f} cm | Lens Power P = {power_d:+.2f} Diopters ({nature})."
        )

        return GeometricalOpticsLensOutput(
            lens_type=type_title,
            focal_length_f_cm=float(f),
            image_distance_v_cm=float(v),
            magnification_m=float(m),
            image_height_hi_cm=float(hi),
            optical_power_diopters=float(power_d),
            image_nature=nature,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "converging_real_image": {
                "name": "Biconvex Converging Lens (u = 30cm, f = 15cm)",
                "params": {"lens_type": "biconvex_converging", "object_distance_u_cm": 30.0, "focal_length_f_cm": 15.0, "object_height_ho_cm": 5.0}
            },
            "magnifying_glass_virtual": {
                "name": "Magnifying Glass Mode (u = 10cm, f = 15cm)",
                "params": {"lens_type": "biconvex_converging", "object_distance_u_cm": 10.0, "focal_length_f_cm": 15.0, "object_height_ho_cm": 5.0}
            }
        }
