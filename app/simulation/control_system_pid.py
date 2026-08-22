"""
PID Controller & Closed-Loop Step Response Physics Engine
=========================================================
Calculates Proportional, Integral, Derivative control outputs,
second-order system damping ratio zeta, natural frequency wn, overshoot %OS, and settling time ts.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ControlSystemPidInput(BaseModel):
    kp_gain: float = Field(default=4.5, ge=0.0, le=100.0, description="Proportional gain Kp")
    ki_gain: float = Field(default=1.2, ge=0.0, le=50.0, description="Integral gain Ki")
    kd_gain: float = Field(default=0.8, ge=0.0, le=20.0, description="Derivative gain Kd")
    setpoint_value: float = Field(default=1.0, ge=0.1, le=100.0, description="Reference setpoint r(t)")


class ControlSystemPidOutput(BaseModel):
    kp_gain: float
    ki_gain: float
    kd_gain: float
    damping_ratio_zeta: float
    natural_frequency_rad_s: float
    percent_overshoot: float
    rise_time_sec: float
    settling_time_sec: float
    system_stability: str
    status_note: str


class ControlSystemPidEngine(BaseSimulationEngine):
    name = "control-system-pid"
    description = "PID controller (Proportional, Integral, Derivative) closed-loop step response: %OS, ts, tr, and stability"

    def calculate(self, params: ControlSystemPidInput) -> ControlSystemPidOutput:
        kp = params.kp_gain
        ki = params.ki_gain
        kd = params.kd_gain

        # Equivalent closed-loop second-order parameters: s^2 + (2*zeta*wn) s + wn^2 = 0
        # wn^2 = Kp + Ki, 2*zeta*wn = 1.0 + Kd
        wn = math.sqrt(max(0.1, kp + ki))
        zeta = (1.0 + kd) / (2.0 * wn) if wn > 0 else 1.0

        # Percent Overshoot %OS = exp(-zeta * pi / sqrt(1 - zeta^2)) * 100%
        if zeta < 1.0:
            denom_os = math.sqrt(1.0 - (zeta ** 2))
            pct_os = math.exp((-zeta * math.pi) / denom_os) * 100.0 if denom_os > 0 else 0.0
            stability = "Underdamped (Oscillatory Step Response)"
        elif math.isclose(zeta, 1.0, abs_tol=0.05):
            pct_os = 0.0
            stability = "Critically Damped (Fastest Non-Oscillatory Response)"
        else:
            pct_os = 0.0
            stability = "Overdamped (Sluggish Non-Oscillatory Response)"

        # Rise time tr ≈ 1.8 / wn
        t_r = 1.8 / wn if wn > 0 else 1.0
        # Settling time ts ≈ 4.0 / (zeta * wn)
        t_s = 4.0 / (zeta * wn) if (zeta * wn) > 0 else 2.0

        note = (
            f"PID Controller (Kp = {kp:.1f}, Ki = {ki:.1f}, Kd = {kd:.1f}): "
            f"Natural Freq ωn = {wn:.2f} rad/s | Damping Ratio ζ = {zeta:.2f} | "
            f"Overshoot %OS = {pct_os:.1f}% | Settling Time ts = {t_s:.2f}s ({stability})."
        )

        return ControlSystemPidOutput(
            kp_gain=float(kp),
            ki_gain=float(ki),
            kd_gain=float(kd),
            damping_ratio_zeta=float(zeta),
            natural_frequency_rad_s=float(wn),
            percent_overshoot=float(pct_os),
            rise_time_sec=float(t_r),
            settling_time_sec=float(t_s),
            system_stability=stability,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str,Any]]:
        return {
            "pid_underdamped_fast": {
                "name": "Fast Underdamped PID Servo Tuning (5% Overshoot)",
                "params": {"kp_gain": 6.0, "ki_gain": 1.5, "kd_gain": 0.8, "setpoint_value": 1.0}
            },
            "pid_critically_damped": {
                "name": "Critically Damped No-Overshoot Tuning",
                "params": {"kp_gain": 3.0, "ki_gain": 0.5, "kd_gain": 2.5, "setpoint_value": 1.0}
            }
        }
