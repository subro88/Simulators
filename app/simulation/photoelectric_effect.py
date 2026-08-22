"""
Photoelectric Effect & Quantum Physics Engine
=============================================
Calculates photon energy E, work function Phi, threshold frequency nu0,
stopping potential Vs, and maximum photoelectron kinetic energy KE_max.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PhotoelectricEffectInput(BaseModel):
    target_metal: Literal["sodium", "copper", "cesium", "zinc"] = Field(default="sodium", description="Target emitter metal")
    light_wavelength_nm: float = Field(default=350.0, ge=100.0, le=800.0, description="Incident photon wavelength lambda in nm")
    light_intensity_mw_cm2: float = Field(default=5.0, ge=0.1, le=100.0, description="Light intensity in mW/cm²")


class PhotoelectricEffectOutput(BaseModel):
    target_metal: str
    photon_energy_ev: float
    work_function_ev: float
    threshold_wavelength_nm: float
    stopping_potential_volts: float
    max_kinetic_energy_ev: float
    is_photoelectric_emission: bool
    status_note: str


class PhotoelectricEffectEngine(BaseSimulationEngine):
    name = "photoelectric-effect"
    description = "Einstein's Photoelectric Effect Quantum Physics: Photon energy E = h*nu, work function Phi, stopping potential Vs"

    def calculate(self, params: PhotoelectricEffectInput) -> PhotoelectricEffectOutput:
        lam_nm = params.light_wavelength_nm

        # Work functions in eV
        if params.target_metal == "cesium":
            phi_ev = 2.14
            metal_title = "Cesium (Cs)"
        elif params.target_metal == "copper":
            phi_ev = 4.70
            metal_title = "Copper (Cu)"
        elif params.target_metal == "zinc":
            phi_ev = 4.30
            metal_title = "Zinc (Zn)"
        else: # sodium
            phi_ev = 2.36
            metal_title = "Sodium (Na)"

        # Threshold Wavelength lambda0 = 1240 / Phi (nm)
        lam0_nm = 1240.0 / phi_ev

        # Photon Energy E = h * c / lambda = 1240 / lambda (eV)
        e_photon_ev = 1240.0 / lam_nm

        # Einstein's Photoelectric Equation: KE_max = E_photon - Phi (eV)
        ke_max_ev = e_photon_ev - phi_ev

        if ke_max_ev > 0:
            is_emission = True
            v_stopping = ke_max_ev  # Stopping potential in Volts (KE = e * Vs)
            status = "PHOTOELECTRIC EMISSION ACTIVE (E_photon > Work Function)"
        else:
            is_emission = False
            ke_max_ev = 0.0
            v_stopping = 0.0
            status = "NO EMISSION (Photon Energy Below Work Function Threshold)"

        note = (
            f"Einstein Photoelectric Effect ({metal_title}, λ = {lam_nm:.1f} nm): "
            f"Photon Energy E = {e_photon_ev:.2f} eV (Work Function Φ = {phi_ev:.2f} eV) | "
            f"Threshold Wavelength λ0 = {lam0_nm:.1f} nm | Stopping Potential Vs = {v_stopping:.2f} V ({status})."
        )

        return PhotoelectricEffectOutput(
            target_metal=metal_title,
            photon_energy_ev=float(e_photon_ev),
            work_function_ev=float(phi_ev),
            threshold_wavelength_nm=float(lam0_nm),
            stopping_potential_volts=float(v_stopping),
            max_kinetic_energy_ev=float(ke_max_ev),
            is_photoelectric_emission=is_emission,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "uv_on_sodium_emission": {
                "name": "UV Light on Sodium Emitter (350nm, Phi = 2.36 eV)",
                "params": {"target_metal": "sodium", "light_wavelength_nm": 350.0, "light_intensity_mw_cm2": 5.0}
            },
            "visible_red_no_emission": {
                "name": "Red Light on Sodium (650nm — Below Threshold)",
                "params": {"target_metal": "sodium", "light_wavelength_nm": 650.0, "light_intensity_mw_cm2": 20.0}
            }
        }
