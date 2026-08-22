"""
Faraday's Electromagnetic Induction & Lenz's Law Physics Engine
===============================================================
Calculates magnetic flux Phi_B, induced EMF E = -N*(dPhi/dt),
induced current I, self-inductance L, and stored magnetic energy U.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ElectromagneticInductionInput(BaseModel):
    num_turns_n: int = Field(default=200, ge=10, le=5000, description="Coil number of turns N")
    magnetic_field_tesla: float = Field(default=0.8, ge=0.01, le=5.0, description="Magnetic field B in Tesla")
    coil_area_cm2: float = Field(default=50.0, ge=1.0, le=500.0, description="Coil cross-section area A in cm²")
    time_change_ms: float = Field(default=20.0, ge=0.5, le=500.0, description="Field change time dt in ms")
    coil_resistance_ohms: float = Field(default=10.0, ge=0.1, le=500.0, description="Coil resistance R in Ohms")


class ElectromagneticInductionOutput(BaseModel):
    magnetic_flux_webers: float
    induced_emf_volts: float
    induced_current_amperes: float
    self_inductance_mhenry: float
    stored_magnetic_energy_joules: float
    status_note: str


class ElectromagneticInductionEngine(BaseSimulationEngine):
    name = "electromagnetic-induction"
    description = "Faraday's Law of Induction & Lenz's Law: Induced EMF E = -N*(dPhi/dt), current I, and stored magnetic energy U"

    def calculate(self, params: ElectromagneticInductionInput) -> ElectromagneticInductionOutput:
        n = params.num_turns_n
        b_t = params.magnetic_field_tesla
        a_m2 = (params.coil_area_cm2) / 10000.0
        dt_s = params.time_change_ms / 1000.0
        r_ohm = params.coil_resistance_ohms

        # Magnetic Flux Phi_B = B * A (Webers)
        phi_wb = b_t * a_m2

        # Induced EMF E = N * (dPhi / dt) (Volts)
        dphi_dt = phi_wb / dt_s if dt_s > 0 else 0.0
        emf_v = n * dphi_dt

        # Induced Current I = E / R (Amperes)
        i_amp = emf_v / r_ohm if r_ohm > 0 else 0.0

        # Self-Inductance L = mu0 * N^2 * A / length (mH)
        mu0 = 4.0 * math.pi * 1e-7
        l_henry = (mu0 * (n ** 2) * a_m2) / 0.1
        l_mh = l_henry * 1000.0

        # Stored Magnetic Energy U = 0.5 * L * I^2 (Joules)
        u_joules = 0.5 * l_henry * (i_amp ** 2)

        note = (
            f"Faraday Electromagnetic Induction (N = {n} turns, B = {b_t:.2f} T, dt = {params.time_change_ms:.0f} ms): "
            f"Magnetic Flux Φ = {phi_wb*1000:.2f} mWb | Induced EMF E = {emf_v:.2f} V | "
            f"Induced Current I = {i_amp:.2f} A | Stored Energy U = {u_joules:.4f} Joules."
        )

        return ElectromagneticInductionOutput(
            magnetic_flux_webers=float(phi_wb),
            induced_emf_volts=float(emf_v),
            induced_current_amperes=float(i_amp),
            self_inductance_mhenry=float(l_mh),
            stored_magnetic_energy_joules=float(u_joules),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "fast_flux_change_20ms": {
                "name": "Fast Magnetic Field Collapse (200 Turns, 20ms)",
                "params": {"num_turns_n": 200, "magnetic_field_tesla": 0.8, "coil_area_cm2": 50.0, "time_change_ms": 20.0, "coil_resistance_ohms": 10.0}
            },
            "heavy_inductor_pulse": {
                "name": "Heavy Inductor Pulse (1000 Turns, 1.5 T)",
                "params": {"num_turns_n": 1000, "magnetic_field_tesla": 1.5, "coil_area_cm2": 100.0, "time_change_ms": 10.0, "coil_resistance_ohms": 5.0}
            }
        }
