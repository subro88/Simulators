"""
Surface Roughness Profilometer Metrology Physics Engine
========================================================
Calculates Centre Line Average Ra, ten-point height Rz, peak-to-valley Rt,
and ISO roughness grade N1 to N12.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SurfaceRoughnessProfilometerInput(BaseModel):
    machining_process: Literal["ground", "milled", "turned", "lapped"] = Field(default="milled", description="Machined surface finish type")
    feed_or_grain_microns: float = Field(default=15.0, ge=1.0, le=200.0, description="Process feed or abrasive grain size in µm")
    cutoff_length_mm: float = Field(default=0.8, ge=0.08, le=8.0, description="Sampling cutoff length lambda_c in mm")


class SurfaceRoughnessProfilometerOutput(BaseModel):
    machining_process: str
    roughness_ra_um: float
    roughness_rz_um: float
    roughness_rt_um: float
    iso_roughness_grade: str
    status_note: str


class SurfaceRoughnessProfilometerEngine(BaseSimulationEngine):
    name = "surface-roughness-profilometer"
    description = "Surface Metrology Profilometer: Centre Line Average Ra, Rz, peak-to-valley Rt, and ISO roughness grade N1-N12"

    def calculate(self, params: SurfaceRoughnessProfilometerInput) -> SurfaceRoughnessProfilometerOutput:
        feed_um = params.feed_or_grain_microns
        proc = params.machining_process

        if proc == "lapped":
            ra_um = feed_um * 0.05
            proc_title = "Lapped / Polished Precision Surface"
        elif proc == "ground":
            ra_um = feed_um * 0.12
            proc_title = "Surface Ground Finish"
        elif proc == "turned":
            ra_um = feed_um * 0.22
            proc_title = "Precision Turned Finish"
        else: # milled
            ra_um = feed_um * 0.18
            proc_title = "End Milled Finish"

        # Ten-point height Rz ≈ 4.5 * Ra
        rz_um = 4.5 * ra_um

        # Peak-to-valley Rt ≈ 6.0 * Ra
        rt_um = 6.0 * ra_um

        # ISO Roughness Grade (N1 = 0.025um, N12 = 50um)
        if ra_um <= 0.05: iso_grade = "N2 (Superfine Lapped)"
        elif ra_um <= 0.2: iso_grade = "N4 (Precision Ground)"
        elif ra_um <= 0.8: iso_grade = "N6 (Fine Milled / Turned)"
        elif ra_um <= 3.2: iso_grade = "N8 (Medium Machined)"
        elif ra_um <= 12.5: iso_grade = "N10 (Rough Cast / Forged)"
        else: iso_grade = "N12 (Coarse Unmachined)"

        note = (
            f"Surface Roughness Metrology ({proc_title}): "
            f"Centre Line Average Ra = {ra_um:.2f} µm | Ten-Point Rz = {rz_um:.2f} µm | "
            f"Peak-to-Valley Rt = {rt_um:.2f} µm ({iso_grade})."
        )

        return SurfaceRoughnessProfilometerOutput(
            machining_process=proc_title,
            roughness_ra_um=float(ra_um),
            roughness_rz_um=float(rz_um),
            roughness_rt_um=float(rt_um),
            iso_roughness_grade=iso_grade,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "fine_milled_surface": {
                "name": "Fine End Milled Surface (Ra = 2.7 µm)",
                "params": {"machining_process": "milled", "feed_or_grain_microns": 15.0, "cutoff_length_mm": 0.8}
            },
            "precision_lapped_optical": {
                "name": "Precision Lapped Optical Mirror Surface",
                "params": {"machining_process": "lapped", "feed_or_grain_microns": 2.0, "cutoff_length_mm": 0.25}
            }
        }
