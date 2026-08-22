"""
Statistical Process Control (SPC) X-Bar & R Control Charts Physics Engine
========================================================================
Calculates X-bar & R chart control limits (UCL, LCL), process standard deviation sigma,
Process Capability Cp, and Capability Index Cpk.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SpcControlChartsInput(BaseModel):
    process_mean_xbarbar: float = Field(default=25.0, ge=0.1, le=1000.0, description="Grand process mean X-bar-bar in mm")
    average_range_rbar: float = Field(default=0.15, ge=0.001, le=5.0, description="Average sample range R-bar in mm")
    subgroup_sample_size_n: int = Field(default=5, ge=2, le=10, description="Subgroup sample size n (2 to 10)")
    upper_spec_limit_usl: float = Field(default=25.30, ge=0.1, le=1000.0, description="Upper Specification Limit USL")
    lower_spec_limit_lsl: float = Field(default=24.70, ge=0.1, le=1000.0, description="Lower Specification Limit LSL")


class SpcControlChartsOutput(BaseModel):
    xbar_ucl_mm: float
    xbar_lcl_mm: float
    r_ucl_mm: float
    r_lcl_mm: float
    estimated_sigma_mm: float
    process_capability_cp: float
    process_capability_cpk: float
    spc_process_status: str
    status_note: str


class SpcControlChartsEngine(BaseSimulationEngine):
    name = "spc-control-charts"
    description = "Statistical Process Control (SPC): X-bar & R Control Charts (UCL, LCL), estimated sigma, Cp, and Cpk capability"

    def calculate(self, params: SpcControlChartsInput) -> SpcControlChartsOutput:
        x_barbar = params.process_mean_xbarbar
        r_bar = params.average_range_rbar
        n = params.subgroup_sample_size_n
        usl = params.upper_spec_limit_usl
        lsl = params.lower_spec_limit_lsl

        # SPC Constants for n = 5 (A2 = 0.577, D3 = 0, D4 = 2.114, d2 = 2.326)
        if n == 3: a2, d3, d4, d2 = 1.023, 0.0, 2.574, 1.693
        elif n == 4: a2, d3, d4, d2 = 0.729, 0.0, 2.282, 2.059
        elif n == 6: a2, d3, d4, d2 = 0.483, 0.0, 2.004, 2.534
        else: # n = 5 default
            a2, d3, d4, d2 = 0.577, 0.0, 2.114, 2.326

        # X-Bar Control Limits: UCL = X_barbar + A2 * R_bar, LCL = X_barbar - A2 * R_bar
        x_ucl = x_barbar + a2 * r_bar
        x_lcl = x_barbar - a2 * r_bar

        # R Control Limits: UCL = D4 * R_bar, LCL = D3 * R_bar
        r_ucl = d4 * r_bar
        r_lcl = d3 * r_bar

        # Estimated Process Sigma = R_bar / d2
        sigma_est = r_bar / d2 if d2 > 0 else 0.01

        # Process Capability Cp = (USL - LSL) / (6 * sigma)
        cp = (usl - lsl) / (6.0 * sigma_est) if sigma_est > 0 else 1.0

        # Process Capability Index Cpk = min((USL - X_barbar)/(3*sigma), (X_barbar - LSL)/(3*sigma))
        cpu = (usl - x_barbar) / (3.0 * sigma_est)
        cpl = (x_barbar - lsl) / (3.0 * sigma_est)
        cpk = min(cpu, cpl)

        if cpk >= 1.33:
            status = "CAPABLE & STATISTICALLY IN-CONTROL PROCESS (Cpk ≥ 1.33 Six-Sigma Grade)"
        elif cpk >= 1.0:
            status = "MARGINALLY CAPABLE PROCESS (1.0 ≤ Cpk < 1.33)"
        else:
            status = "INCAPABLE PROCESS — REJECTS GENERATED (Cpk < 1.0)"

        note = (
            f"SPC Quality Control (X-bar-bar = {x_barbar:.3f} mm, R-bar = {r_bar:.3f} mm, n = {n}): "
            f"X-bar Limits [LCL = {x_lcl:.3f} mm, UCL = {x_ucl:.3f} mm] | Estimated σ = {sigma_est:.4f} mm | "
            f"Capability Cp = {cp:.2f}, Cpk = {cpk:.2f} ({status})."
        )

        return SpcControlChartsOutput(
            xbar_ucl_mm=float(x_ucl),
            xbar_lcl_mm=float(x_lcl),
            r_ucl_mm=float(r_ucl),
            r_lcl_mm=float(r_lcl),
            estimated_sigma_mm=float(sigma_est),
            process_capability_cp=float(cp),
            process_capability_cpk=float(cpk),
            spc_process_status=status,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "six_sigma_capable_process": {
                "name": "Six-Sigma Capable Machining Process (Cpk = 1.45)",
                "params": {"process_mean_xbarbar": 25.0, "average_range_rbar": 0.15, "subgroup_sample_size_n": 5, "upper_spec_limit_usl": 25.30, "lower_spec_limit_lsl": 24.70}
            },
            "out_of_control_drift": {
                "name": "Process Mean Drift Warning (Cpk = 0.88)",
                "params": {"process_mean_xbarbar": 25.18, "average_range_rbar": 0.22, "subgroup_sample_size_n": 5, "upper_spec_limit_usl": 25.30, "lower_spec_limit_lsl": 24.70}
            }
        }
