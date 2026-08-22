"""
Radioactive Decay & Half-Life Physics Engine
============================================
Calculates decay constant lambda, remaining nuclei N(t), activity A(t) in Bq & Ci,
half-life T_1/2, and radiocarbon dating age.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class RadioactiveDecayInput(BaseModel):
    isotope: Literal["carbon_14", "uranium_238", "cobalt_60", "radium_226"] = Field(default="carbon_14", description="Radioisotopic nuclide")
    initial_atoms_n0: float = Field(default=1.0e15, ge=1.0e6, le=1.0e24, description="Initial number of radioactive nuclei N0")
    decay_time_years: float = Field(default=5730.0, ge=0.0, le=1.0e9, description="Decay elapsed time t in years")


class RadioactiveDecayOutput(BaseModel):
    isotope: str
    half_life_years: float
    decay_constant_per_year: float
    remaining_nuclei_nt: float
    remaining_fraction_pct: float
    activity_becquerels_bq: float
    activity_curies_ci: float
    status_note: str


class RadioactiveDecayEngine(BaseSimulationEngine):
    name = "radioactive-decay"
    description = "Nuclear Physics Exponential Radioactive Decay: N(t) = N0*e^(-lambda*t), half-life T1/2, and Activity A(t)"

    def calculate(self, params: RadioactiveDecayInput) -> RadioactiveDecayOutput:
        n0 = params.initial_atoms_n0
        t_years = params.decay_time_years

        if params.isotope == "uranium_238":
            t_half = 4.468e9
            iso_title = "Uranium-238 (238U)"
        elif params.isotope == "cobalt_60":
            t_half = 5.27
            iso_title = "Cobalt-60 (60Co)"
        elif params.isotope == "radium_226":
            t_half = 1600.0
            iso_title = "Radium-226 (226Ra)"
        else: # carbon_14
            t_half = 5730.0
            iso_title = "Carbon-14 (14C)"

        # Decay Constant lambda = ln(2) / T_half (1/years)
        lam_yr = math.log(2.0) / t_half

        # Remaining Nuclei N(t) = N0 * exp(-lambda * t)
        n_t = n0 * math.exp(-lam_yr * t_years)
        rem_pct = (n_t / n0) * 100.0

        # Activity A(t) = lambda_sec * N(t) in Becquerels (Bq)
        lam_sec = lam_yr / (365.25 * 24.0 * 3600.0)
        a_bq = lam_sec * n_t
        a_ci = a_bq / 3.7e10  # 1 Curie = 3.7e10 Bq

        note = (
            f"Radioactive Decay ({iso_title}, Half-Life T1/2 = {t_half:.0f} yrs): "
            f"After t = {t_years:.0f} yrs -> Remaining Nuclei N(t) = {n_t:.3e} ({rem_pct:.1f}% of N0) | "
            f"Decay Activity A(t) = {a_bq:.2e} Bq ({a_ci:.2e} Curies)."
        )

        return RadioactiveDecayOutput(
            isotope=iso_title,
            half_life_years=float(t_half),
            decay_constant_per_year=float(lam_yr),
            remaining_nuclei_nt=float(n_t),
            remaining_fraction_pct=float(rem_pct),
            activity_becquerels_bq=float(a_bq),
            activity_curies_ci=float(a_ci),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "carbon_14_one_halflife": {
                "name": "Carbon-14 Radiocarbon Dating (1 Half-Life = 5730 yrs)",
                "params": {"isotope": "carbon_14", "initial_atoms_n0": 1.0e15, "decay_time_years": 5730.0}
            },
            "cobalt_60_medical_decay": {
                "name": "Cobalt-60 Medical Source Decay (10.54 yrs = 2 Half-Lives)",
                "params": {"isotope": "cobalt_60", "initial_atoms_n0": 1.0e18, "decay_time_years": 10.54}
            }
        }
