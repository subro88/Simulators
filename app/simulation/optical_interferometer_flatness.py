"""
Optical Flat Interferometry Surface Flatness Physics Engine
============================================================
Calculates fringe count N, monochromatic wavelength lambda,
surface flatness error h = N*lambda/2 in nanometers/microns.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class OpticalInterferometerFlatnessInput(BaseModel):
    light_source: Literal["sodium_vapor_589nm", "helium_neon_632nm", "mercury_green_546nm"] = Field(default="sodium_vapor_589nm", description="Monochromatic light source")
    fringe_shift_count_n: float = Field(default=3.5, ge=0.1, le=50.0, description="Interferogram fringe displacement count N")


class OpticalInterferometerFlatnessOutput(BaseModel):
    light_source: str
    wavelength_nm: float
    flatness_error_um: float
    flatness_error_nanometers: float
    surface_grade: str
    status_note: str


class OpticalInterferometerFlatnessEngine(BaseSimulationEngine):
    name = "optical-interferometer-flatness"
    description = "Optical Flat Interferometry: Surface flatness deviation h = N * lambda / 2, fringe shift N, and optical grade"

    def calculate(self, params: OpticalInterferometerFlatnessInput) -> OpticalInterferometerFlatnessOutput:
        n_shift = params.fringe_shift_count_n

        if params.light_source == "helium_neon_632nm":
            lam_nm = 632.8
            light_title = "He-Ne Red Laser (632.8 nm)"
        elif params.light_source == "mercury_green_546nm":
            lam_nm = 546.1
            light_title = "Mercury Green Line (546.1 nm)"
        else: # sodium
            lam_nm = 589.0
            light_title = "Sodium Vapor Lamp (589.0 nm)"

        # Flatness Error h = N * (lambda / 2) (nm -> um)
        h_nm = n_shift * (lam_nm / 2.0)
        h_um = h_nm / 1000.0

        if h_um <= 0.1:
            grade = "Grade 00 (Reference Master Optical Flat)"
        elif h_um <= 0.3:
            grade = "Grade 0 (Inspection Calibration Flat)"
        elif h_um <= 1.0:
            grade = "Grade 1 (Toolroom Lapped Surface)"
        else:
            grade = "Grade 2 (General Machined Surface)"

        note = (
            f"Optical Flat Interferometry ({light_title}): Fringe Shift N = {n_shift:.1f} | "
            f"Surface Flatness Deviation h = {h_nm:.1f} nm ({h_um:.3f} µm — {grade})."
        )

        return OpticalInterferometerFlatnessOutput(
            light_source=light_title,
            wavelength_nm=float(lam_nm),
            flatness_error_um=float(h_um),
            flatness_error_nanometers=float(h_nm),
            surface_grade=grade,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "master_gauge_block_flatness": {
                "name": "Master Gauge Block Flatness (N = 0.5 Fringes)",
                "params": {"light_source": "sodium_vapor_589nm", "fringe_shift_count_n": 0.5}
            },
            "lapped_seal_face_flatness": {
                "name": "Lapped Mechanical Seal Face (N = 3.5 Fringes)",
                "params": {"light_source": "sodium_vapor_589nm", "fringe_shift_count_n": 3.5}
            }
        }
