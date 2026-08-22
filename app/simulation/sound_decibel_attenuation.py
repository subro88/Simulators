"""
Sound Decibel Attenuation & Inverse Square Law Physics Engine
=============================================================
Calculates Sound Pressure Level SPL in dB, Sound Intensity I,
distance attenuation Delta L_dB, and inverse square law spreading.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SoundDecibelAttenuationInput(BaseModel):
    source_power_watts: float = Field(default=10.0, ge=0.001, le=1000.0, description="Acoustic source sound power W in Watts")
    distance_r1_m: float = Field(default=1.0, ge=0.1, le=100.0, description="Initial measurement distance r1 in meters")
    distance_r2_m: float = Field(default=10.0, ge=0.5, le=1000.0, description="Target measurement distance r2 in meters")


class SoundDecibelAttenuationOutput(BaseModel):
    sound_intensity_i1_w_m2: float
    sound_pressure_level_spl1_db: float
    sound_pressure_level_spl2_db: float
    distance_attenuation_db: float
    status_note: str


class SoundDecibelAttenuationEngine(BaseSimulationEngine):
    name = "sound-decibel-attenuation"
    description = "Acoustics & Sound Decibels: Intensity Level SPL = 10*log10(I/I0) dB, Inverse Square Law, and distance drop"

    def calculate(self, params: SoundDecibelAttenuationInput) -> SoundDecibelAttenuationOutput:
        w_power = params.source_power_watts
        r1 = params.distance_r1_m
        r2 = params.distance_r2_m

        # Reference Intensity I0 = 1e-12 W/m^2
        i0 = 1e-12

        # Intensity I = W / (4 * pi * r^2) (W/m^2)
        i1 = w_power / (4.0 * math.pi * (r1 ** 2)) if r1 > 0 else i0
        i2 = w_power / (4.0 * math.pi * (r2 ** 2)) if r2 > 0 else i0

        # SPL (dB) = 10 * log10(I / I0)
        spl1 = 10.0 * math.log10(max(1e-15, i1 / i0))
        spl2 = 10.0 * math.log10(max(1e-15, i2 / i0))

        # Distance Attenuation Delta dB = 20 * log10(r2 / r1)
        att_db = 20.0 * math.log10(r2 / r1) if r1 > 0 else 0.0

        note = (
            f"Acoustic Spreading (Power W = {w_power:.2f} W): "
            f"SPL @ {r1:.1f}m = {spl1:.1f} dB (I = {i1:.2e} W/m²) -> "
            f"SPL @ {r2:.1f}m = {spl2:.1f} dB | Distance Attenuation Drop = -{att_db:.1f} dB."
        )

        return SoundDecibelAttenuationOutput(
            sound_intensity_i1_w_m2=float(i1),
            sound_pressure_level_spl1_db=float(spl1),
            sound_pressure_level_spl2_db=float(spl2),
            distance_attenuation_db=float(att_db),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "speaker_10w_1m_to_10m": {
                "name": "10W Speaker Horn (1m vs 10m Distance)",
                "params": {"source_power_watts": 10.0, "distance_r1_m": 1.0, "distance_r2_m": 10.0}
            },
            "industrial_generator_noise": {
                "name": "Industrial Generator Noise Drop (1m to 50m)",
                "params": {"source_power_watts": 100.0, "distance_r1_m": 1.0, "distance_r2_m": 50.0}
            }
        }
