"""
Four-Stroke Engine Physics & Thermodynamics Engine
==================================================
Calculates Otto/Diesel thermodynamic cycles, piston kinematics,
indicated/brake power, mechanical efficiency, BMEP, and 4-stroke cycle phases.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class FourStrokeInput(BaseModel):
    """Input telemetry for Four-Stroke Engine physics simulation."""
    engine_type: Literal["petrol_otto", "diesel_cycle"] = Field(
        default="petrol_otto",
        description="Engine cycle type: S.I. (Petrol/Otto) or C.I. (Diesel)"
    )
    bore_mm: float = Field(
        default=85.0,
        ge=40.0,
        le=200.0,
        description="Cylinder bore diameter in mm"
    )
    stroke_mm: float = Field(
        default=88.0,
        ge=40.0,
        le=250.0,
        description="Piston stroke length in mm"
    )
    compression_ratio: float = Field(
        default=10.5,
        ge=6.0,
        le=24.0,
        description="Compression ratio r (Vc + Vs) / Vc"
    )
    cutoff_ratio: float = Field(
        default=1.8,
        ge=1.1,
        le=4.0,
        description="Cutoff ratio rc for Diesel cycle"
    )
    engine_rpm: float = Field(
        default=3000.0,
        ge=300.0,
        le=8000.0,
        description="Crankshaft rotational speed in RPM"
    )
    number_of_cylinders: int = Field(
        default=4,
        ge=1,
        le=12,
        description="Number of engine cylinders"
    )
    bmep_bar: float = Field(
        default=10.0,
        ge=1.0,
        le=30.0,
        description="Brake Mean Effective Pressure in bar"
    )
    mechanical_efficiency_pct: float = Field(
        default=85.0,
        ge=50.0,
        le=98.0,
        description="Mechanical efficiency percentage"
    )
    crank_angle_deg: float = Field(
        default=0.0,
        ge=0.0,
        le=720.0,
        description="Instantaneous crankshaft angle in degrees (0° to 720°)"
    )


class FourStrokeOutput(BaseModel):
    """Calculated output telemetry for Four-Stroke Engine."""
    engine_type: str
    swept_volume_cc: float
    clearance_volume_cc: float
    total_displacement_cc: float
    air_standard_efficiency_pct: float
    current_stroke_phase: str
    piston_position_mm: float
    piston_velocity_ms: float
    indicated_power_kw: float
    brake_power_kw: float
    friction_power_kw: float
    brake_torque_nm: float
    thermodynamic_formula: str
    status_note: str


class FourStrokeEngine(BaseSimulationEngine):
    """Physics & Thermodynamics simulation engine for 4-Stroke Engines."""

    name = "four-stroke-engine"
    description = "Four-Stroke S.I./C.I. Otto and Diesel cycle thermodynamics, kinematics, and power output"

    def calculate(self, params: FourStrokeInput) -> FourStrokeOutput:
        bore_m = params.bore_mm / 1000.0
        stroke_m = params.stroke_mm / 1000.0
        crank_r = stroke_m / 2.0
        conrod_l = crank_r * 3.5  # Standard conrod ratio L/r = 3.5

        # 1. Volume Calculations per cylinder
        swept_vol_m3 = (math.pi / 4.0) * (bore_m ** 2) * stroke_m
        swept_vol_cc = swept_vol_m3 * 1e6
        clearance_vol_cc = swept_vol_cc / (params.compression_ratio - 1.0)
        total_disp_cc = swept_vol_cc * params.number_of_cylinders

        # 2. Air Standard Efficiency
        gamma = 1.4  # Ratio of specific heats for air
        if params.engine_type == "petrol_otto":
            # eta = 1 - 1 / r^(gamma - 1)
            eta_air = (1.0 - (1.0 / (params.compression_ratio ** (gamma - 1.0)))) * 100.0
            type_str = "Four-Stroke Petrol (S.I. Otto Cycle)"
        else:
            # Diesel: eta = 1 - (1 / (gamma * r^(gamma-1))) * ((rc^gamma - 1)/(rc - 1))
            rc = params.cutoff_ratio
            r = params.compression_ratio
            term1 = 1.0 / (gamma * (r ** (gamma - 1.0)))
            term2 = (rc ** gamma - 1.0) / (rc - 1.0)
            eta_air = (1.0 - term1 * term2) * 100.0
            type_str = "Four-Stroke Diesel (C.I. Cycle)"

        # 3. Stroke Phase Identification (720° cycle = 2 revolutions)
        theta_mod = params.crank_angle_deg % 720.0
        if 0.0 <= theta_mod < 180.0:
            stroke_phase = "1. INTAKE STROKE (Fresh air/fuel mixture drawn in)"
        elif 180.0 <= theta_mod < 360.0:
            stroke_phase = "2. COMPRESSION STROKE (Charge compressed towards TDC)"
        elif 360.0 <= theta_mod < 540.0:
            stroke_phase = "3. POWER STROKE (Combustion expansion drives piston down)"
        else:
            stroke_phase = "4. EXHAUST STROKE (Burnt gases expelled through exhaust valve)"

        # 4. Instantaneous Piston Kinematics (x from TDC)
        rad = math.radians(theta_mod)
        lambda_r = crank_r / conrod_l
        piston_x_m = crank_r * ((1.0 - math.cos(rad)) + (lambda_r / 2.0) * (math.sin(rad) ** 2))
        piston_pos_mm = piston_x_m * 1000.0

        omega = (params.engine_rpm * 2.0 * math.pi) / 60.0
        piston_v_ms = omega * crank_r * (math.sin(rad) + (lambda_r / 2.0) * math.sin(2.0 * rad))

        # 5. Power & Torque Calculations
        # Brake Power: BP = (P_bmep * L * A * N_cycles * n_cyl) / 60000 in kW
        # 4-stroke has 1 power stroke per 2 revolutions -> N_cycles = RPM / 2
        cycles_per_sec = (params.engine_rpm / 2.0) / 60.0
        p_bmep_kpa = params.bmep_bar * 100.0  # bar to kPa
        brake_power_kw = (p_bmep_kpa * swept_vol_m3 * cycles_per_sec * params.number_of_cylinders)

        eta_mech = params.mechanical_efficiency_pct / 100.0
        indicated_power_kw = brake_power_kw / eta_mech
        friction_power_kw = indicated_power_kw - brake_power_kw

        # Torque: T = (BP * 1000) / omega
        brake_torque_nm = (brake_power_kw * 1000.0) / omega if omega > 0 else 0.0

        formula_str = (
            f"η_air = {eta_air:.1f}% | BP = {brake_power_kw:.1f} kW | "
            f"T = {brake_torque_nm:.1f} N·m | V_disp = {total_disp_cc:.0f} cc"
        )

        status_note = f"{type_str}: Operating at {params.engine_rpm:.0f} RPM with {brake_power_kw:.1f} kW Brake Power."

        return FourStrokeOutput(
            engine_type=type_str,
            swept_volume_cc=float(swept_vol_cc),
            clearance_volume_cc=float(clearance_vol_cc),
            total_displacement_cc=float(total_disp_cc),
            air_standard_efficiency_pct=float(eta_air),
            current_stroke_phase=stroke_phase,
            piston_position_mm=float(piston_pos_mm),
            piston_velocity_ms=float(piston_v_ms),
            indicated_power_kw=float(indicated_power_kw),
            brake_power_kw=float(brake_power_kw),
            friction_power_kw=float(friction_power_kw),
            brake_torque_nm=float(brake_torque_nm),
            thermodynamic_formula=formula_str,
            status_note=status_note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "naturally_aspirated_petrol": {
                "name": "2.0L 4-Cyl Petrol (Naturally Aspirated)",
                "params": {
                    "engine_type": "petrol_otto",
                    "bore_mm": 85.0,
                    "stroke_mm": 88.0,
                    "compression_ratio": 10.5,
                    "engine_rpm": 4000.0,
                    "number_of_cylinders": 4,
                    "bmep_bar": 11.5
                }
            },
            "heavy_duty_diesel": {
                "name": "3.0L Turbo Diesel (C.I. Engine)",
                "params": {
                    "engine_type": "diesel_cycle",
                    "bore_mm": 96.0,
                    "stroke_mm": 102.0,
                    "compression_ratio": 17.5,
                    "cutoff_ratio": 2.0,
                    "engine_rpm": 2200.0,
                    "number_of_cylinders": 6,
                    "bmep_bar": 18.0
                }
            },
            "high_rpm_sport": {
                "name": "High-RPM Performance Engine",
                "params": {
                    "engine_type": "petrol_otto",
                    "bore_mm": 81.0,
                    "stroke_mm": 77.0,
                    "compression_ratio": 11.8,
                    "engine_rpm": 6500.0,
                    "number_of_cylinders": 4,
                    "bmep_bar": 14.0
                }
            }
        }
