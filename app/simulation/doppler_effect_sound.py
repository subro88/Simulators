"""
Doppler Effect & Mach Cone Physics Engine
=========================================
Calculates observed sound frequency f', frequency shift Delta_f,
Mach number M, and Mach cone angle theta.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class DopplerEffectSoundInput(BaseModel):
    source_frequency_hz: float = Field(default=440.0, ge=20.0, le=20000.0, description="Emitted source frequency f0 in Hz")
    speed_of_sound_m_s: float = Field(default=343.0, ge=300.0, le=1500.0, description="Speed of sound in medium v in m/s")
    source_velocity_m_s: float = Field(default=30.0, ge=0.0, le=1000.0, description="Source velocity vs in m/s")
    observer_velocity_m_s: float = Field(default=0.0, ge=0.0, le=200.0, description="Observer velocity vo in m/s")
    source_direction: Literal["approaching", "receding"] = Field(default="approaching", description="Source motion direction")


class DopplerEffectSoundOutput(BaseModel):
    source_frequency_hz: float
    observed_frequency_hz: float
    frequency_shift_hz: float
    mach_number: float
    mach_cone_angle_deg: float
    is_supersonic: bool
    status_note: str


class DopplerEffectSoundEngine(BaseSimulationEngine):
    name = "doppler-effect-sound"
    description = "Acoustic Doppler Effect: observed frequency f' = f0*(v +/- vo)/(v -/+ vs), Mach number M, and Mach cone angle"

    def calculate(self, params: DopplerEffectSoundInput) -> DopplerEffectSoundOutput:
        f0 = params.source_frequency_hz
        v = params.speed_of_sound_m_s
        vs = params.source_velocity_m_s
        vo = params.observer_velocity_m_s
        direction = params.source_direction

        # Mach Number M = vs / v
        mach = vs / v
        is_supersonic = mach >= 1.0

        if is_supersonic:
            # Mach cone angle sin(theta) = 1 / Mach
            mach_angle_rad = math.asin(1.0 / mach)
            mach_angle_deg = math.degrees(mach_angle_rad)
            f_observed = f0 * 2.5  # Sonic boom shockwave pitch
            status_state = "SUPERSONIC (Sonic Boom Shockwave Cone Formed)"
        else:
            mach_angle_deg = 90.0
            status_state = "SUBSONIC ACOUSTIC DOPPLER SHIFT"
            if direction == "approaching":
                # Approaching: f' = f0 * (v + vo) / (v - vs)
                denom = v - vs
                f_observed = f0 * ((v + vo) / denom) if denom > 0 else f0 * 5.0
            else: # receding
                # Receding: f' = f0 * (v - vo) / (v + vs)
                denom = v + vs
                f_observed = f0 * ((v - vo) / denom) if denom > 0 else f0 * 0.2

        f_shift = f_observed - f0

        note = (
            f"Acoustic Doppler Effect (Source f0 = {f0:.0f} Hz, vs = {vs:.1f} m/s {direction}): "
            f"Observed Frequency f' = {f_observed:.1f} Hz (Frequency Shift Δf = {f_shift:+.1f} Hz) | "
            f"Mach Number = {mach:.2f} (Mach Cone Angle = {mach_angle_deg:.1f}° — {status_state})."
        )

        return DopplerEffectSoundOutput(
            source_frequency_hz=float(f0),
            observed_frequency_hz=float(f_observed),
            frequency_shift_hz=float(f_shift),
            mach_number=float(mach),
            mach_cone_angle_deg=float(mach_angle_deg),
            is_supersonic=is_supersonic,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "siren_approaching_car": {
                "name": "Ambulance Siren Approaching (vs = 30 m/s ~ 108 km/h)",
                "params": {"source_frequency_hz": 440.0, "speed_of_sound_m_s": 343.0, "source_velocity_m_s": 30.0, "observer_velocity_m_s": 0.0, "source_direction": "approaching"}
            },
            "supersonic_jet_mach2": {
                "name": "Supersonic Fighter Jet Mach 1.5 (Sonic Boom Cone)",
                "params": {"source_frequency_hz": 500.0, "speed_of_sound_m_s": 343.0, "source_velocity_m_s": 514.5, "observer_velocity_m_s": 0.0, "source_direction": "approaching"}
            }
        }
