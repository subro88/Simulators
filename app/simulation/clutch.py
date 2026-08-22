"""
Automotive Friction Clutch Simulation Engine
=============================================
Calculates single-plate and multi-plate clutch torque capacity under Uniform Pressure
and Uniform Wear theories, diaphragm spring clamping forces, pedal engagement, slip, and thermal wear.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class ClutchInput(BaseModel):
    """Input parameters for Automotive Friction Clutch simulation."""
    clutch_type: Literal["single_plate", "multi_plate", "diaphragm"] = Field(
        default="single_plate",
        description="Type of friction clutch design"
    )
    calculation_theory: Literal["uniform_wear", "uniform_pressure"] = Field(
        default="uniform_wear",
        description="Design assumption (Uniform Wear for worn/used, Uniform Pressure for new)"
    )
    clamp_force_n: float = Field(
        default=4000.0,
        ge=500.0,
        le=15000.0,
        description="Axial spring clamping force W in Newtons"
    )
    friction_coeff: float = Field(
        default=0.35,
        ge=0.05,
        le=0.60,
        description="Coefficient of friction mu (0.35 for organic dry lining, 0.10 for wet)"
    )
    outer_radius_mm: float = Field(
        default=120.0,
        ge=50.0,
        le=300.0,
        description="Outer radius of friction disc Ro in mm"
    )
    inner_radius_mm: float = Field(
        default=80.0,
        ge=20.0,
        le=250.0,
        description="Inner radius of friction disc Ri in mm"
    )
    number_of_plates: int = Field(
        default=1,
        ge=1,
        le=10,
        description="Number of friction discs (n_surfaces = 2 * n_plates)"
    )
    pedal_travel_pct: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Clutch pedal depressed travel percentage (0% = fully engaged, 100% = fully released)"
    )
    engine_rpm: float = Field(
        default=2400.0,
        ge=0.0,
        le=7000.0,
        description="Engine flywheel speed in RPM"
    )
    engine_torque_nm: float = Field(
        default=250.0,
        ge=0.0,
        le=1000.0,
        description="Engine torque transmitted to flywheel in N·m"
    )


class ClutchOutput(BaseModel):
    """Calculated output telemetry for the friction clutch."""
    clutch_type: str
    calculation_theory: str
    effective_mean_radius_mm: float
    number_of_active_surfaces: int
    effective_clamp_force_n: float
    max_torque_capacity_nm: float
    is_slipping: bool
    slip_torque_delta_nm: float
    gearbox_rpm: float
    transmitted_torque_nm: float
    transmitted_power_kw: float
    wear_rate_index: float
    torque_formula: str
    status_note: str


class ClutchEngine(BaseSimulationEngine):
    """High-precision physics engine for automotive friction clutches."""

    name = "automotive-clutch"
    description = "Single-plate and multi-plate friction clutch torque capacity, slip, and wear physics"

    def calculate(self, params: ClutchInput) -> ClutchOutput:
        r_out = params.outer_radius_mm / 1000.0  # Convert mm to m
        r_in = params.inner_radius_mm / 1000.0

        # Number of active contact friction surfaces
        n_surfaces = 2 * params.number_of_plates

        # Effective mean radius Rm calculation based on design theory
        if params.calculation_theory == "uniform_pressure":
            # Rm = (2/3) * (Ro^3 - Ri^3) / (Ro^2 - Ri^2)
            if math.isclose(r_out, r_in):
                r_mean = r_out
            else:
                r_mean = (2.0 / 3.0) * (r_out**3 - r_in**3) / (r_out**2 - r_in**2)
            theory_label = "Uniform Pressure Theory (New Clutch)"
        else:
            # Rm = (Ro + Ri) / 2
            r_mean = (r_out + r_in) / 2.0
            theory_label = "Uniform Wear Theory (Worn/Used Clutch)"

        # Effective clamp force W considering pedal depression
        # 0% pedal -> 100% clamp force; 100% pedal -> 0% clamp force
        engagement_factor = max(0.0, 1.0 - (params.pedal_travel_pct / 100.0))
        effective_clamp_n = params.clamp_force_n * engagement_factor

        # Maximum torque capacity: T = n_surfaces * mu * W * Rm
        max_torque_capacity = n_surfaces * params.friction_coeff * effective_clamp_n * r_mean

        # Slip condition analysis
        if engagement_factor < 0.05:
            # Fully disengaged
            is_slipping = True
            gearbox_rpm = 0.0
            transmitted_torque = 0.0
            slip_delta = params.engine_torque_nm
            status_note = "Clutch fully disengaged (pedal depressed): Zero power transfer to gearbox."

        elif max_torque_capacity < params.engine_torque_nm:
            # Slipping: Engine torque exceeds friction capacity
            is_slipping = True
            slip_ratio = max_torque_capacity / params.engine_torque_nm
            gearbox_rpm = params.engine_rpm * slip_ratio
            transmitted_torque = max_torque_capacity
            slip_delta = params.engine_torque_nm - max_torque_capacity
            status_note = f"Clutch slipping! Engine torque ({params.engine_torque_nm:.1f} N·m) exceeds capacity ({max_torque_capacity:.1f} N·m)."

        else:
            # Fully engaged / Locked up
            is_slipping = False
            gearbox_rpm = params.engine_rpm
            transmitted_torque = params.engine_torque_nm
            slip_delta = 0.0
            status_note = f"Fully engaged (Locked up): Transmitting full engine torque ({transmitted_torque:.1f} N·m) to gearbox."

        # Transmitted Power: P = (Torque * Omega) / 1000 in kW
        omega_gb = (gearbox_rpm * 2.0 * math.pi) / 60.0
        transmitted_power_kw = (transmitted_torque * omega_gb) / 1000.0

        # Friction wear rate index: proportional to pressure * relative velocity * slip
        wear_rate = (params.clamp_force_n / 1000.0) * (params.engine_rpm - gearbox_rpm) * 0.001

        # Formula string
        formula_str = (
            f"T_cap = {n_surfaces} × {params.friction_coeff:.2f} × {effective_clamp_n:.0f} N × "
            f"{r_mean*1000:.1f} mm = {max_torque_capacity:.1f} N·m"
        )

        return ClutchOutput(
            clutch_type=params.clutch_type.replace("_", " ").title(),
            calculation_theory=theory_label,
            effective_mean_radius_mm=float(r_mean * 1000.0),
            number_of_active_surfaces=int(n_surfaces),
            effective_clamp_force_n=float(effective_clamp_n),
            max_torque_capacity_nm=float(max_torque_capacity),
            is_slipping=is_slipping,
            slip_torque_delta_nm=float(slip_delta),
            gearbox_rpm=float(gearbox_rpm),
            transmitted_torque_nm=float(transmitted_torque),
            transmitted_power_kw=float(transmitted_power_kw),
            wear_rate_index=float(wear_rate),
            torque_formula=formula_str,
            status_note=status_note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "passenger_car_engaged": {
                "name": "Standard Passenger Car (Engaged)",
                "params": {
                    "clutch_type": "single_plate",
                    "clamp_force_n": 4200.0,
                    "friction_coeff": 0.35,
                    "outer_radius_mm": 120.0,
                    "inner_radius_mm": 80.0,
                    "number_of_plates": 1,
                    "pedal_travel_pct": 0.0,
                    "engine_torque_nm": 220.0
                }
            },
            "partial_engagement_slip": {
                "name": "Biting Point (Slipping Engagement)",
                "params": {
                    "clutch_type": "diaphragm",
                    "clamp_force_n": 4200.0,
                    "pedal_travel_pct": 65.0,
                    "engine_torque_nm": 220.0
                }
            },
            "motorcycle_multi_plate": {
                "name": "High-Torque Multi-Plate (Motorcycle)",
                "params": {
                    "clutch_type": "multi_plate",
                    "clamp_force_n": 2200.0,
                    "friction_coeff": 0.12,  # Wet clutch
                    "outer_radius_mm": 70.0,
                    "inner_radius_mm": 45.0,
                    "number_of_plates": 6,
                    "pedal_travel_pct": 0.0,
                    "engine_torque_nm": 160.0
                }
            }
        }
