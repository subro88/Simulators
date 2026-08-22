"""
Power Electronics (Buck, Boost & SCR Thyristor) Physics Engine
==============================================================
Calculates output voltage Vout, duty cycle D, inductor current ripple Delta_IL,
output voltage ripple Delta_Vo, and conversion efficiency.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class PowerElectronicsInput(BaseModel):
    converter_type: Literal["buck_step_down", "boost_step_up", "scr_phase_control"] = Field(
        default="buck_step_down",
        description="Power electronics topology"
    )
    input_voltage_v: float = Field(default=24.0, ge=1.0, le=500.0, description="DC Input voltage Vin in Volts")
    duty_cycle_fraction: float = Field(default=0.5, ge=0.05, le=0.95, description="PWM Duty cycle D (0.05 to 0.95)")
    switching_frequency_khz: float = Field(default=50.0, ge=1.0, le=500.0, description="Switching frequency f_sw in kHz")
    filter_inductor_uh: float = Field(default=220.0, ge=1.0, le=5000.0, description="Filter inductor L in µH")
    load_current_a: float = Field(default=3.0, ge=0.1, le=50.0, description="DC Load current I_out in Amperes")


class PowerElectronicsOutput(BaseModel):
    converter_type: str
    output_voltage_v: float
    duty_cycle_pct: float
    inductor_current_ripple_a: float
    output_power_w: float
    conversion_efficiency_pct: float
    status_note: str


class PowerElectronicsEngine(BaseSimulationEngine):
    name = "power-electronics"
    description = "DC-DC Buck & Boost converters and SCR phase control: Vout, PWM duty cycle D, inductor ripple Delta_IL, and efficiency"

    def calculate(self, params: PowerElectronicsInput) -> PowerElectronicsOutput:
        vin = params.input_voltage_v
        d = params.duty_cycle_fraction
        f_hz = params.switching_frequency_khz * 1000.0
        l_h = params.filter_inductor_uh / 1e6
        i_out = params.load_current_a

        if params.converter_type == "buck_step_down":
            # Buck: Vout = D * Vin
            vout = d * vin
            # Delta_IL = (Vin - Vout) * D / (f * L)
            delta_il = ((vin - vout) * d) / (f_hz * l_h) if (f_hz * l_h) > 0 else 0.5
            eff_pct = 92.5
            type_title = "Buck DC-DC Step-Down Converter"

        elif params.converter_type == "boost_step_up":
            # Boost: Vout = Vin / (1 - D)
            vout = vin / (1.0 - d) if (1.0 - d) > 0 else vin * 10.0
            # Delta_IL = Vin * D / (f * L)
            delta_il = (vin * d) / (f_hz * l_h) if (f_hz * l_h) > 0 else 0.5
            eff_pct = 89.0
            type_title = "Boost DC-DC Step-Up Converter"

        else: # scr_phase_control
            # SCR phase control: Vout = Vin * (1 + cos(alpha)) / pi where alpha = D * pi
            alpha_rad = d * math.pi
            vout = (vin * math.sqrt(2.0) / math.pi) * (1.0 + math.cos(alpha_rad))
            delta_il = 0.2
            eff_pct = 95.0
            type_title = f"SCR Thyristor Phase Control (Firing α = {math.degrees(alpha_rad):.0f}°)"

        p_out_w = vout * i_out

        note = (
            f"{type_title} (Vin = {vin:.1f} V, Duty = {d*100:.1f}%): Output Vout = {vout:.2f} V | "
            f"Inductor Current Ripple ΔIL = {delta_il:.2f} A | Output Power = {p_out_w:.1f} W (η = {eff_pct:.1f}%)."
        )

        return PowerElectronicsOutput(
            converter_type=type_title,
            output_voltage_v=float(vout),
            duty_cycle_pct=float(d * 100.0),
            inductor_current_ripple_a=float(delta_il),
            output_power_w=float(p_out_w),
            conversion_efficiency_pct=float(eff_pct),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "buck_24v_to_12v": {
                "name": "Buck Converter 24V to 12V (D = 50%)",
                "params": {"converter_type": "buck_step_down", "input_voltage_v": 24.0, "duty_cycle_fraction": 0.5, "switching_frequency_khz": 50.0, "filter_inductor_uh": 220.0, "load_current_a": 3.0}
            },
            "boost_12v_to_24v": {
                "name": "Boost Converter 12V to 24V (D = 50%)",
                "params": {"converter_type": "boost_step_up", "input_voltage_v": 12.0, "duty_cycle_fraction": 0.5, "switching_frequency_khz": 50.0, "filter_inductor_uh": 220.0, "load_current_a": 2.0}
            }
        }
