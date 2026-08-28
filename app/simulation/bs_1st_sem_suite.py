"""
WBSCTE Basic Science (BS) 1st Semester Physics, Chemistry & Mathematics Engines (Common for All Branches)
========================================================================================================
Syllabus Mapped:
1. BS103/BS107: VernierCaliperVolumeMeasurementEngine
2. BS103/BS107: MicrometerScrewGaugeMeasurementEngine
3. BS103/BS107: SpherometerRadiusCurvatureEngine
4. BS103/BS107: FrictionInclinedPlaneCoefficientEngine
5. BS103/BS107: FlywheelMomentOfInertiaEngine
6. BS103/BS107: StokesLawViscosityTerminalVelocityEngine
7. BS103/BS107: ThermalLinearExpansionCoefficientEngine
8. BS103/BS107: BoylesLawIsothermalGasEngine
9. BS105/BS109: AcidBaseTitrationNeutralizationEngine
10. BS105/BS109: WaterHardnessEDTATitrationEngine
11. BS105/BS109: DanielCellElectrochemicalEMFEngine
12. BS105/BS109: FaradayElectrolysisCopperSulfateEngine
13. BS105/BS109: RedwoodViscometerOilViscosityEngine
14. BS105/BS109: FlashFirePointAbelApparatusEngine
15. BS101:       ComplexNumbersArgandPolarEngine
16. BS101:       VectorAlgebraDotCrossProductsEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Vernier Caliper Volume Measurement Engine ───────────────────────────
class VernierCaliperVolumeMeasurementInput(BaseModel):
    main_scale_reading_msr_cm: float = Field(default=3.4, ge=0.0, le=15.0)
    vernier_scale_coincidence_vsd: int = Field(default=6, ge=0, le=10)
    least_count_lc_cm: float = Field(default=0.01, ge=0.001, le=0.05)
    internal_diameter_d_cm: float = Field(default=2.2, ge=0.5, le=10.0)
    length_l_cm: float = Field(default=6.5, ge=1.0, le=20.0)


class VernierCaliperVolumeMeasurementOutput(BaseModel):
    external_diameter_d_cm: float
    internal_diameter_d_cm: float
    hollow_cylinder_volume_cm3: float
    measurement_least_count_cm: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class VernierCaliperVolumeMeasurementEngine(BaseSimulationEngine):
    name = "vernier-caliper-volume-measurement"
    description = "BS103/BS107: Physics Lab — Vernier Caliper Least Count LC = 0.01cm & Hollow Cylinder Volume V = pi/4 (D^2 - d^2) L"

    def calculate(self, params: VernierCaliperVolumeMeasurementInput) -> VernierCaliperVolumeMeasurementOutput:
        msr = params.main_scale_reading_msr_cm
        vsd = params.vernier_scale_coincidence_vsd
        lc = params.least_count_lc_cm
        d_in = params.internal_diameter_d_cm
        l = params.length_l_cm

        d_ext = msr + (vsd * lc)
        # Volume = (pi/4) * (D^2 - d^2) * L
        vol = (math.pi / 4.0) * (max(0.0, d_ext**2 - d_in**2)) * l

        telemetry = {
            "d_ext_cm": round(d_ext, 3),
            "d_in_cm": round(d_in, 3),
            "vol_cm3": round(vol, 3),
            "lc_cm": lc
        }

        return VernierCaliperVolumeMeasurementOutput(
            external_diameter_d_cm=round(d_ext, 3),
            internal_diameter_d_cm=round(d_in, 3),
            hollow_cylinder_volume_cm3=round(vol, 3),
            measurement_least_count_cm=lc,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "brass_hollow_cylinder": {"main_scale_reading_msr_cm": 3.4, "vernier_scale_coincidence_vsd": 6, "least_count_lc_cm": 0.01, "internal_diameter_d_cm": 2.2, "length_l_cm": 6.5},
            "steel_bushing_specimen": {"main_scale_reading_msr_cm": 4.8, "vernier_scale_coincidence_vsd": 4, "least_count_lc_cm": 0.01, "internal_diameter_d_cm": 3.5, "length_l_cm": 8.0}
        }


# ── 2. Micrometer Screw Gauge Measurement Engine ───────────────────────────
class MicrometerScrewGaugeMeasurementInput(BaseModel):
    main_scale_reading_msr_mm: float = Field(default=2.0, ge=0.0, le=25.0)
    circular_scale_reading_csr: int = Field(default=42, ge=0, le=100)
    pitch_mm: float = Field(default=1.0, ge=0.5, le=1.0)
    circular_divisions: int = Field(default=100, ge=50, le=100)
    zero_error_mm: float = Field(default=0.02, ge=-0.10, le=0.10)


class MicrometerScrewGaugeMeasurementOutput(BaseModel):
    least_count_mm: float
    observed_diameter_mm: float
    corrected_diameter_mm: float
    wire_cross_sectional_area_mm2: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class MicrometerScrewGaugeMeasurementEngine(BaseSimulationEngine):
    name = "micrometer-screw-gauge-measurement"
    description = "BS103/BS107: Physics Lab — Screw Gauge Pitch, Circular Scale LC = 0.01mm, Wire Diameter & Cross-Section Area"

    def calculate(self, params: MicrometerScrewGaugeMeasurementInput) -> MicrometerScrewGaugeMeasurementOutput:
        msr = params.main_scale_reading_msr_mm
        csr = params.circular_scale_reading_csr
        pitch = params.pitch_mm
        n_div = params.circular_divisions
        zero_err = params.zero_error_mm

        lc = pitch / n_div
        d_obs = msr + (csr * lc)
        d_corr = max(0.01, d_obs - zero_err)
        area = (math.pi / 4.0) * (d_corr**2)

        telemetry = {
            "lc_mm": lc,
            "d_obs_mm": round(d_obs, 3),
            "d_corr_mm": round(d_corr, 3),
            "area_mm2": round(area, 4)
        }

        return MicrometerScrewGaugeMeasurementOutput(
            least_count_mm=lc,
            observed_diameter_mm=round(d_obs, 3),
            corrected_diameter_mm=round(d_corr, 3),
            wire_cross_sectional_area_mm2=round(area, 4),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "copper_winding_wire": {"main_scale_reading_msr_mm": 2.0, "circular_scale_reading_csr": 42, "pitch_mm": 1.0, "circular_divisions": 100, "zero_error_mm": 0.02},
            "nichrome_resistance_wire": {"main_scale_reading_msr_mm": 1.0, "circular_scale_reading_csr": 85, "pitch_mm": 1.0, "circular_divisions": 100, "zero_error_mm": -0.01}
        }


# ── 3. Spherometer Radius of Curvature Engine ──────────────────────────────
class SpherometerRadiusCurvatureInput(BaseModel):
    mean_distance_between_legs_l_mm: float = Field(default=40.0, ge=20.0, le=80.0)
    sagitta_height_h_mm: float = Field(default=1.85, ge=0.2, le=10.0)
    spherical_surface_type: Literal["Convex Spherical Mirror", "Concave Spherical Mirror"] = "Convex Spherical Mirror"


class SpherometerRadiusCurvatureOutput(BaseModel):
    radius_of_curvature_r_mm: float
    radius_of_curvature_r_cm: float
    focal_length_f_cm: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SpherometerRadiusCurvatureEngine(BaseSimulationEngine):
    name = "spherometer-radius-curvature"
    description = "BS103/BS107: Physics Lab — Spherometer Radius of Curvature R = l^2 / (6h) + h/2 & Mirror Focal Length f = R/2"

    def calculate(self, params: SpherometerRadiusCurvatureInput) -> SpherometerRadiusCurvatureOutput:
        l = params.mean_distance_between_legs_l_mm
        h = params.sagitta_height_h_mm

        # R = l^2 / (6h) + h/2
        r_mm = (l**2) / (6.0 * h) + (h / 2.0)
        r_cm = r_mm / 10.0
        f_cm = r_cm / 2.0

        telemetry = {
            "r_mm": round(r_mm, 2),
            "r_cm": round(r_cm, 2),
            "f_cm": round(f_cm, 2)
        }

        return SpherometerRadiusCurvatureOutput(
            radius_of_curvature_r_mm=round(r_mm, 2),
            radius_of_curvature_r_cm=round(r_cm, 2),
            focal_length_f_cm=round(f_cm, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "convex_mirror_40mm_base": {"mean_distance_between_legs_l_mm": 40.0, "sagitta_height_h_mm": 1.85, "spherical_surface_type": "Convex Spherical Mirror"},
            "concave_watch_glass": {"mean_distance_between_legs_l_mm": 45.0, "sagitta_height_h_mm": 2.40, "spherical_surface_type": "Concave Spherical Mirror"}
        }


# ── 4. Friction on Inclined Plane & Coefficient Engine ──────────────────────
class FrictionInclinedPlaneCoefficientInput(BaseModel):
    mass_of_slider_m_kg: float = Field(default=0.5, ge=0.1, le=5.0)
    angle_of_inclination_deg: float = Field(default=28.0, ge=5.0, le=60.0)
    surface_pair: Literal["Wood on Glass", "Wood on Wood", "Metal on Metal"] = "Wood on Glass"


class FrictionInclinedPlaneCoefficientOutput(BaseModel):
    angle_of_repose_deg: float
    coefficient_of_static_friction_mu: float
    normal_reaction_n_newtons: float
    limiting_friction_force_f_newtons: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FrictionInclinedPlaneCoefficientEngine(BaseSimulationEngine):
    name = "friction-inclined-plane-coefficient"
    description = "BS103/BS107: Physics Lab — Limiting Static Friction on Rough Inclined Plane mu = tan(theta) & Normal Force N"

    def calculate(self, params: FrictionInclinedPlaneCoefficientInput) -> FrictionInclinedPlaneCoefficientOutput:
        m = params.mass_of_slider_m_kg
        theta_deg = params.angle_of_inclination_deg
        theta_rad = math.radians(theta_deg)
        g = 9.81

        mu_s = math.tan(theta_rad)
        n_force = m * g * math.cos(theta_rad)
        f_lim = m * g * math.sin(theta_rad)

        telemetry = {
            "theta_deg": theta_deg,
            "mu_s": round(mu_s, 4),
            "n_newtons": round(n_force, 3),
            "f_lim_newtons": round(f_lim, 3)
        }

        return FrictionInclinedPlaneCoefficientOutput(
            angle_of_repose_deg=theta_deg,
            coefficient_of_static_friction_mu=round(mu_s, 4),
            normal_reaction_n_newtons=round(n_force, 3),
            limiting_friction_force_f_newtons=round(f_lim, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "wood_on_glass_28deg": {"mass_of_slider_m_kg": 0.5, "angle_of_inclination_deg": 28.0, "surface_pair": "Wood on Glass"},
            "wood_on_wood_35deg": {"mass_of_slider_m_kg": 0.8, "angle_of_inclination_deg": 35.0, "surface_pair": "Wood on Wood"}
        }


# ── 5. Flywheel Moment of Inertia Engine ────────────────────────────────────
class FlywheelMomentOfInertiaInput(BaseModel):
    mass_attached_m_kg: float = Field(default=0.4, ge=0.1, le=2.0)
    height_of_fall_h_m: float = Field(default=1.2, ge=0.5, le=3.0)
    turns_on_axle_N: int = Field(default=5, ge=2, le=15)
    rotations_after_detachment_n: int = Field(default=42, ge=10, le=150)
    axle_radius_r_m: float = Field(default=0.02, ge=0.01, le=0.05)
    time_after_detachment_t_s: float = Field(default=18.0, ge=5.0, le=60.0)


class FlywheelMomentOfInertiaOutput(BaseModel):
    moment_of_inertia_i_kg_m2: float
    angular_velocity_at_detachment_rad_s: float
    frictional_torque_n_m: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FlywheelMomentOfInertiaEngine(BaseSimulationEngine):
    name = "flywheel-moment-of-inertia"
    description = "BS103/BS107: Physics Lab — Flywheel Moment of Inertia I = (N m g h / (N + n)) (t^2 / 4pi^2) & Rotational Dynamics"

    def calculate(self, params: FlywheelMomentOfInertiaInput) -> FlywheelMomentOfInertiaOutput:
        m = params.mass_attached_m_kg
        h = params.height_of_fall_h_m
        N = params.turns_on_axle_N
        n = params.rotations_after_detachment_n
        r = params.axle_radius_r_m
        t = params.time_after_detachment_t_s
        g = 9.81

        omega = (4.0 * math.pi * n) / t
        # I = (N * m * g * h / (N + n)) * (t^2 / (4 * pi^2)) - m * r^2
        i_val = (N * m * g * h / (N + n)) * (t**2 / (4.0 * math.pi**2)) - (m * r**2)
        tau_f = (i_val * omega) / t

        telemetry = {
            "i_kg_m2": round(i_val, 4),
            "omega_rad_s": round(omega, 2),
            "tau_f_nm": round(tau_f, 4)
        }

        return FlywheelMomentOfInertiaOutput(
            moment_of_inertia_i_kg_m2=round(i_val, 4),
            angular_velocity_at_detachment_rad_s=round(omega, 2),
            frictional_torque_n_m=round(tau_f, 4),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "lab_flywheel_0_4kg_mass": {"mass_attached_m_kg": 0.4, "height_of_fall_h_m": 1.2, "turns_on_axle_N": 5, "rotations_after_detachment_n": 42, "axle_radius_r_m": 0.02, "time_after_detachment_t_s": 18.0},
            "heavy_flywheel_0_8kg_mass": {"mass_attached_m_kg": 0.8, "height_of_fall_h_m": 1.5, "turns_on_axle_N": 8, "rotations_after_detachment_n": 75, "axle_radius_r_m": 0.025, "time_after_detachment_t_s": 28.0}
        }


# ── 6. Stokes' Law Viscosity & Terminal Velocity Engine ─────────────────────
class StokesLawViscosityTerminalVelocityInput(BaseModel):
    sphere_radius_r_mm: float = Field(default=1.5, ge=0.5, le=5.0)
    density_of_sphere_rho_kg_m3: float = Field(default=7800.0, ge=2000.0, le=12000.0)
    density_of_liquid_sigma_kg_m3: float = Field(default=1260.0, ge=800.0, le=1500.0)
    terminal_velocity_v_m_s: float = Field(default=0.082, ge=0.01, le=0.5)


class StokesLawViscosityTerminalVelocityOutput(BaseModel):
    dynamic_viscosity_eta_pa_s: float
    dynamic_viscosity_eta_poise: float
    reynolds_number_re: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class StokesLawViscosityTerminalVelocityEngine(BaseSimulationEngine):
    name = "stokes-law-viscosity-terminal-velocity"
    description = "BS103/BS107: Physics Lab — Stokes' Law Terminal Velocity & Liquid Viscosity eta = 2 r^2 (rho - sigma) g / (9 v)"

    def calculate(self, params: StokesLawViscosityTerminalVelocityInput) -> StokesLawViscosityTerminalVelocityOutput:
        r = params.sphere_radius_r_mm * 1e-3
        rho = params.density_of_sphere_rho_kg_m3
        sigma = params.density_of_liquid_sigma_kg_m3
        v = params.terminal_velocity_v_m_s
        g = 9.81

        # eta = 2 * r^2 * (rho - sigma) * g / (9 * v)
        eta_pa_s = (2.0 * (r**2) * (rho - sigma) * g) / (9.0 * v)
        eta_poise = eta_pa_s * 10.0
        re = (sigma * v * (2.0 * r)) / max(1e-6, eta_pa_s)

        telemetry = {
            "eta_pa_s": round(eta_pa_s, 4),
            "eta_poise": round(eta_poise, 3),
            "re": round(re, 4)
        }

        return StokesLawViscosityTerminalVelocityOutput(
            dynamic_viscosity_eta_pa_s=round(eta_pa_s, 4),
            dynamic_viscosity_eta_poise=round(eta_poise, 3),
            reynolds_number_re=round(re, 4),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "glycerin_steel_ball_1_5mm": {"sphere_radius_r_mm": 1.5, "density_of_sphere_rho_kg_m3": 7800.0, "density_of_liquid_sigma_kg_m3": 1260.0, "terminal_velocity_v_m_s": 0.082},
            "castor_oil_glass_sphere": {"sphere_radius_r_mm": 2.0, "density_of_sphere_rho_kg_m3": 2500.0, "density_of_liquid_sigma_kg_m3": 960.0, "terminal_velocity_v_m_s": 0.045}
        }


# ── 7. Thermal Linear Expansion Coefficient Engine ──────────────────────────
class ThermalLinearExpansionCoefficientInput(BaseModel):
    initial_rod_length_l0_cm: float = Field(default=50.0, ge=20.0, le=100.0)
    initial_temp_t1_degc: float = Field(default=25.0, ge=10.0, le=40.0)
    final_temp_t2_degc: float = Field(default=100.0, ge=50.0, le=100.0)
    elongation_dl_mm: float = Field(default=0.64, ge=0.1, le=3.0)
    rod_material: Literal["Brass Rod", "Copper Rod", "Iron Rod", "Aluminium Rod"] = "Brass Rod"


class ThermalLinearExpansionCoefficientOutput(BaseModel):
    temperature_difference_dt_degc: float
    coefficient_of_linear_expansion_alpha: float
    areal_expansion_beta: float
    volumetric_expansion_gamma: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ThermalLinearExpansionCoefficientEngine(BaseSimulationEngine):
    name = "thermal-linear-expansion-coefficient"
    description = "BS103/BS107: Physics Lab — Pullinger's Rod Linear Expansion alpha = dL / (L0 dT), beta = 2alpha, gamma = 3alpha"

    def calculate(self, params: ThermalLinearExpansionCoefficientInput) -> ThermalLinearExpansionCoefficientOutput:
        l0_cm = params.initial_rod_length_l0_cm
        t1 = params.initial_temp_t1_degc
        t2 = params.final_temp_t2_degc
        dl_cm = params.elongation_dl_mm / 10.0

        dt = t2 - t1
        alpha = dl_cm / (l0_cm * max(1.0, dt))
        beta = 2.0 * alpha
        gamma = 3.0 * alpha

        telemetry = {
            "dt_degc": dt,
            "alpha": f"{alpha:.3e}",
            "beta": f"{beta:.3e}",
            "gamma": f"{gamma:.3e}"
        }

        return ThermalLinearExpansionCoefficientOutput(
            temperature_difference_dt_degc=dt,
            coefficient_of_linear_expansion_alpha=round(alpha, 8),
            areal_expansion_beta=round(beta, 8),
            volumetric_expansion_gamma=round(gamma, 8),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "brass_rod_50cm_100c": {"initial_rod_length_l0_cm": 50.0, "initial_temp_t1_degc": 25.0, "final_temp_t2_degc": 100.0, "elongation_dl_mm": 0.64, "rod_material": "Brass Rod"},
            "copper_rod_50cm_100c": {"initial_rod_length_l0_cm": 50.0, "initial_temp_t1_degc": 25.0, "final_temp_t2_degc": 100.0, "elongation_dl_mm": 0.60, "rod_material": "Copper Rod"}
        }


# ── 8. Boyle's Law Isothermal Gas Engine ────────────────────────────────────
class BoylesLawIsothermalGasInput(BaseModel):
    atmospheric_pressure_p0_cm_hg: float = Field(default=76.0, ge=70.0, le=80.0)
    manometer_difference_h_cm: float = Field(default=14.0, ge=-40.0, le=60.0)
    air_column_length_l_cm: float = Field(default=22.5, ge=5.0, le=50.0)


class BoylesLawIsothermalGasOutput(BaseModel):
    total_absolute_pressure_p_cm_hg: float
    gas_volume_arbitrary_v_cm: float
    pv_constant_product: float
    isothermal_boyle_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class BoylesLawIsothermalGasEngine(BaseSimulationEngine):
    name = "boyles-law-isothermal-gas"
    description = "BS103/BS107: Physics Lab — Boyle's Law Isothermal P1 V1 = P2 V2 = Constant Verification with Manometer"

    def calculate(self, params: BoylesLawIsothermalGasInput) -> BoylesLawIsothermalGasOutput:
        p0 = params.atmospheric_pressure_p0_cm_hg
        h = params.manometer_difference_h_cm
        l = params.air_column_length_l_cm

        p_tot = p0 + h
        pv = p_tot * l
        verdict = f"BOYLE'S LAW VERIFIED: P x V = {pv:.1f} cm Hg·cm (Constant at Isothermal Temperature)"

        telemetry = {
            "p_tot": round(p_tot, 1),
            "v_col": round(l, 1),
            "pv": round(pv, 1),
            "verdict": verdict
        }

        return BoylesLawIsothermalGasOutput(
            total_absolute_pressure_p_cm_hg=round(p_tot, 1),
            gas_volume_arbitrary_v_cm=round(l, 1),
            pv_constant_product=round(pv, 1),
            isothermal_boyle_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "positive_pressure_h_14cm": {"atmospheric_pressure_p0_cm_hg": 76.0, "manometer_difference_h_cm": 14.0, "air_column_length_l_cm": 22.5},
            "negative_vacuum_h_minus_10cm": {"atmospheric_pressure_p0_cm_hg": 76.0, "manometer_difference_h_cm": -10.0, "air_column_length_l_cm": 30.7}
        }


# ── 9. Acid-Base Titration Neutralization Engine ────────────────────────────
class AcidBaseTitrationNeutralizationInput(BaseModel):
    oxalic_acid_normality_n1: float = Field(default=0.10, ge=0.01, le=1.0)
    oxalic_acid_pipette_volume_v1_ml: float = Field(default=20.0, ge=10.0, le=50.0)
    naoh_burette_concordant_reading_v2_ml: float = Field(default=18.6, ge=5.0, le=50.0)


class AcidBaseTitrationNeutralizationOutput(BaseModel):
    naoh_normality_n2: float
    naoh_strength_grams_per_litre: float
    neutralization_equivalence_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AcidBaseTitrationNeutralizationEngine(BaseSimulationEngine):
    name = "acid-base-titration-neutralization"
    description = "BS105/BS109: Chemistry Lab — Volumetric Neutralization Titration N1 V1 = N2 V2 (Oxalic Acid vs NaOH with Phenolphthalein)"

    def calculate(self, params: AcidBaseTitrationNeutralizationInput) -> AcidBaseTitrationNeutralizationOutput:
        n1 = params.oxalic_acid_normality_n1
        v1 = params.oxalic_acid_pipette_volume_v1_ml
        v2 = params.naoh_burette_concordant_reading_v2_ml

        # N2 = (N1 * V1) / V2
        n2 = (n1 * v1) / v2
        # Strength = N2 * Eq_wt (40.0 for NaOH)
        strength = n2 * 40.0

        status = f"EQUIVALENCE POINT REACHED: N(NaOH) = {n2:.4f} N, Strength = {strength:.2f} g/L"

        telemetry = {
            "n2": round(n2, 4),
            "strength_g_l": round(strength, 2),
            "status": status
        }

        return AcidBaseTitrationNeutralizationOutput(
            naoh_normality_n2=round(n2, 4),
            naoh_strength_grams_per_litre=round(strength, 2),
            neutralization_equivalence_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_0_1n_oxalic_acid": {"oxalic_acid_normality_n1": 0.10, "oxalic_acid_pipette_volume_v1_ml": 20.0, "naoh_burette_concordant_reading_v2_ml": 18.6},
            "0_05n_dilute_titration": {"oxalic_acid_normality_n1": 0.05, "oxalic_acid_pipette_volume_v1_ml": 25.0, "naoh_burette_concordant_reading_v2_ml": 23.2}
        }


# ── 10. Water Hardness EDTA Titration Engine ────────────────────────────────
class WaterHardnessEDTATitrationInput(BaseModel):
    water_sample_volume_v_sample_ml: float = Field(default=50.0, ge=20.0, le=100.0)
    edta_molarity_m: float = Field(default=0.01, ge=0.005, le=0.05)
    edta_concordant_burette_volume_v_edta_ml: float = Field(default=14.2, ge=2.0, le=40.0)


class WaterHardnessEDTATitrationOutput(BaseModel):
    total_hardness_ppm_caco3: float
    water_hardness_classification: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class WaterHardnessEDTATitrationEngine(BaseSimulationEngine):
    name = "water-hardness-edta-titration"
    description = "BS105/BS109: Chemistry Lab — Total Water Hardness by EDTA Complexometry & EBT Indicator in ppm CaCO3"

    def calculate(self, params: WaterHardnessEDTATitrationInput) -> WaterHardnessEDTATitrationOutput:
        v_s = params.water_sample_volume_v_sample_ml
        m_edta = params.edta_molarity_m
        v_edta = params.edta_concordant_burette_volume_v_edta_ml

        # Hardness ppm = (V_edta * M_edta * 100 * 1000) / V_sample
        ppm = (v_edta * m_edta * 100.0 * 1000.0) / v_s

        if ppm < 60.0:
            cls_str = "SOFT WATER (< 60 ppm)"
        elif ppm <= 120.0:
            cls_str = "MODERATELY HARD WATER (60 - 120 ppm)"
        elif ppm <= 180.0:
            cls_str = "HARD WATER (120 - 180 ppm)"
        else:
            cls_str = "VERY HARD WATER (> 180 ppm — Requires Lime-Soda / Zeolite Softening)"

        telemetry = {
            "ppm": round(ppm, 1),
            "class": cls_str
        }

        return WaterHardnessEDTATitrationOutput(
            total_hardness_ppm_caco3=round(ppm, 1),
            water_hardness_classification=cls_str,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "tap_water_sample_50ml": {"water_sample_volume_v_sample_ml": 50.0, "edta_molarity_m": 0.01, "edta_concordant_burette_volume_v_edta_ml": 14.2},
            "borewell_groundwater_sample": {"water_sample_volume_v_sample_ml": 50.0, "edta_molarity_m": 0.01, "edta_concordant_burette_volume_v_edta_ml": 22.8}
        }


# ── 11. Daniel Cell Electrochemical EMF Engine ──────────────────────────────
class DanielCellElectrochemicalEMFInput(BaseModel):
    zinc_ion_concentration_m: float = Field(default=0.1, ge=0.001, le=2.0)
    copper_ion_concentration_m: float = Field(default=1.0, ge=0.001, le=2.0)
    temperature_k: float = Field(default=298.15, ge=273.15, le=350.15)


class DanielCellElectrochemicalEMFOutput(BaseModel):
    standard_cell_potential_e0_volts: float
    actual_cell_emf_volts: float
    gibbs_free_energy_delta_g_kj: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DanielCellElectrochemicalEMFEngine(BaseSimulationEngine):
    name = "daniel-cell-electrochemical-emf"
    description = "BS105/BS109: Chemistry Lab — Daniel Cell Zn-Cu EMF, Nernst Equation Ecell = E0 - (0.0591/n) log([Zn2+]/[Cu2+])"

    def calculate(self, params: DanielCellElectrochemicalEMFInput) -> DanielCellElectrochemicalEMFOutput:
        c_zn = params.zinc_ion_concentration_m
        c_cu = params.copper_ion_concentration_m
        t = params.temperature_k

        e0 = 1.10  # Standard Zn-Cu EMF (0.34 - (-0.76))
        n = 2
        f = 96485.0
        r = 8.314

        # Ecell = E0 - (2.303 R T / n F) * log10([Zn2+] / [Cu2+])
        factor = (2.303 * r * t) / (n * f)
        e_cell = e0 - factor * math.log10(c_zn / c_cu)

        # Delta G = -n F Ecell (kJ)
        delta_g = (-n * f * e_cell) * 1e-3

        telemetry = {
            "e0_v": e0,
            "e_cell_v": round(e_cell, 4),
            "delta_g_kj": round(delta_g, 2)
        }

        return DanielCellElectrochemicalEMFOutput(
            standard_cell_potential_e0_volts=e0,
            actual_cell_emf_volts=round(e_cell, 4),
            gibbs_free_energy_delta_g_kj=round(delta_g, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_daniel_cell_0_1m_zn": {"zinc_ion_concentration_m": 0.1, "copper_ion_concentration_m": 1.0, "temperature_k": 298.15},
            "equimolar_1m_zn_cu": {"zinc_ion_concentration_m": 1.0, "copper_ion_concentration_m": 1.0, "temperature_k": 298.15}
        }


# ── 12. Faraday's Electrolysis of Copper Sulfate Engine ─────────────────────
class FaradayElectrolysisCopperSulfateInput(BaseModel):
    current_current_i_amp: float = Field(default=1.5, ge=0.2, le=5.0)
    time_duration_t_min: float = Field(default=30.0, ge=5.0, le=120.0)
    atomic_mass_copper: float = Field(default=63.54, ge=63.0, le=64.0)
    valency_z: int = Field(default=2, ge=1, le=3)


class FaradayElectrolysisCopperSulfateOutput(BaseModel):
    total_charge_q_coulombs: float
    electrochemical_equivalent_z_g_per_c: float
    mass_of_copper_deposited_grams: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FaradayElectrolysisCopperSulfateEngine(BaseSimulationEngine):
    name = "faraday-electrolysis-copper-sulfate"
    description = "BS105/BS109: Chemistry Lab — Faraday's First Law of Electrolysis m = Z I t for Copper Deposition from CuSO4"

    def calculate(self, params: FaradayElectrolysisCopperSulfateInput) -> FaradayElectrolysisCopperSulfateOutput:
        i = params.current_current_i_amp
        t_s = params.time_duration_t_min * 60.0
        m_at = params.atomic_mass_copper
        z = params.valency_z
        f = 96485.0

        q = i * t_s
        z_ece = m_at / (z * f)
        m_dep = z_ece * q

        telemetry = {
            "q_coulombs": round(q, 1),
            "z_ece": f"{z_ece:.4e}",
            "m_dep_g": round(m_dep, 4)
        }

        return FaradayElectrolysisCopperSulfateOutput(
            total_charge_q_coulombs=round(q, 1),
            electrochemical_equivalent_z_g_per_c=round(z_ece, 6),
            mass_of_copper_deposited_grams=round(m_dep, 4),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "cu_voltameter_1_5a_30min": {"current_current_i_amp": 1.5, "time_duration_t_min": 30.0, "atomic_mass_copper": 63.54, "valency_z": 2},
            "heavy_deposition_2_5a_60min": {"current_current_i_amp": 2.5, "time_duration_t_min": 60.0, "atomic_mass_copper": 63.54, "valency_z": 2}
        }


# ── 13. Redwood Viscometer Oil Viscosity Engine ─────────────────────────────
class RedwoodViscometerOilViscosityInput(BaseModel):
    redwood_efflux_time_t_seconds: float = Field(default=185.0, ge=30.0, le=1000.0)
    oil_temperature_degc: float = Field(default=50.0, ge=20.0, le=100.0)
    oil_specific_gravity: float = Field(default=0.89, ge=0.80, le=0.98)


class RedwoodViscometerOilViscosityOutput(BaseModel):
    kinematic_viscosity_nu_cst: float
    dynamic_viscosity_eta_cp: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RedwoodViscometerOilViscosityEngine(BaseSimulationEngine):
    name = "redwood-viscometer-oil-viscosity"
    description = "BS105/BS109: Chemistry Lab — Redwood Viscometer No. 1 Efflux Time to Kinematic Viscosity nu = A t - B/t & Dynamic cP"

    def calculate(self, params: RedwoodViscometerOilViscosityInput) -> RedwoodViscometerOilViscosityOutput:
        t = params.redwood_efflux_time_t_seconds
        sp_gr = params.oil_specific_gravity

        if t > 100.0:
            a, b = 0.00247, 0.50
        else:
            a, b = 0.00260, 1.72

        nu_stokes = (a * t) - (b / t)
        nu_cst = nu_stokes * 100.0
        eta_cp = nu_cst * sp_gr

        telemetry = {
            "nu_cst": round(nu_cst, 2),
            "eta_cp": round(eta_cp, 2),
            "t_sec": t
        }

        return RedwoodViscometerOilViscosityOutput(
            kinematic_viscosity_nu_cst=round(nu_cst, 2),
            dynamic_viscosity_eta_cp=round(eta_cp, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "lubricating_oil_50degc": {"redwood_efflux_time_t_seconds": 185.0, "oil_temperature_degc": 50.0, "oil_specific_gravity": 0.89},
            "heavy_gear_oil_40degc": {"redwood_efflux_time_t_seconds": 320.0, "oil_temperature_degc": 40.0, "oil_specific_gravity": 0.92}
        }


# ── 14. Abel's Flash & Fire Point Apparatus Engine ──────────────────────────
class FlashFirePointAbelApparatusInput(BaseModel):
    barometric_pressure_p_kpa: float = Field(default=101.3, ge=90.0, le=105.0)
    observed_flash_point_degc: float = Field(default=42.0, ge=20.0, le=90.0)
    observed_fire_point_degc: float = Field(default=48.0, ge=25.0, le=100.0)
    oil_fuel_type: Literal["Kerosene / Aviation Turbine Fuel", "Diesel Fuel Oil", "Light Lubricating Oil"] = "Kerosene / Aviation Turbine Fuel"


class FlashFirePointAbelApparatusOutput(BaseModel):
    corrected_flash_point_degc: float
    corrected_fire_point_degc: float
    petroleum_combustibility_class: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FlashFirePointAbelApparatusEngine(BaseSimulationEngine):
    name = "flash-fire-point-abel-apparatus"
    description = "BS105/BS109: Chemistry Lab — Abel's Closed Cup Flash Point & Fire Point Test for Petroleum Fuels with Pressure Correction"

    def calculate(self, params: FlashFirePointAbelApparatusInput) -> FlashFirePointAbelApparatusOutput:
        p = params.barometric_pressure_p_kpa
        t_flash = params.observed_flash_point_degc
        t_fire = params.observed_fire_point_degc

        # Barometric correction: T_corr = T_obs + 0.033 * (101.3 - P)
        corr = 0.033 * (101.3 - p)
        t_flash_c = t_flash + corr
        t_fire_c = t_fire + corr

        if t_flash_c < 23.0:
            cls_name = "CLASS A PETROLEUM FLUID (Highly Flammable Flash Point < 23°C)"
        elif t_flash_c <= 65.0:
            cls_name = "CLASS B COMBUSTIBLE FLUID (Flash Point 23°C to 65°C, e.g. Kerosene/Diesel)"
        else:
            cls_name = "CLASS C COMBUSTIBLE FLUID (Flash Point > 65°C, e.g. Heavy Fuel Oils)"

        telemetry = {
            "flash_corr_degc": round(t_flash_c, 1),
            "fire_corr_degc": round(t_fire_c, 1),
            "class": cls_name
        }

        return FlashFirePointAbelApparatusOutput(
            corrected_flash_point_degc=round(t_flash_c, 1),
            corrected_fire_point_degc=round(t_fire_c, 1),
            petroleum_combustibility_class=cls_name,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "kerosene_abel_test": {"barometric_pressure_p_kpa": 101.3, "observed_flash_point_degc": 42.0, "observed_fire_point_degc": 48.0, "oil_fuel_type": "Kerosene / Aviation Turbine Fuel"},
            "diesel_fuel_test": {"barometric_pressure_p_kpa": 100.2, "observed_flash_point_degc": 56.0, "observed_fire_point_degc": 64.0, "oil_fuel_type": "Diesel Fuel Oil"}
        }


# ── 15. Complex Numbers Argand & Polar Engine ───────────────────────────────
class ComplexNumbersArgandPolarInput(BaseModel):
    real_part_x: float = Field(default=3.0, ge=-20.0, le=20.0)
    imaginary_part_y: float = Field(default=4.0, ge=-20.0, le=20.0)
    power_n_demoivre: int = Field(default=3, ge=1, le=10)


class ComplexNumbersArgandPolarOutput(BaseModel):
    modulus_r: float
    argument_theta_deg: float
    polar_form_string: str
    demoivre_powered_real: float
    demoivre_powered_imag: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ComplexNumbersArgandPolarEngine(BaseSimulationEngine):
    name = "complex-numbers-argand-polar"
    description = "BS101: Engineering Mathematics-I — Complex Numbers Argand Plane z = x + iy, Modulus r, Argument theta & De Moivre's z^n"

    def calculate(self, params: ComplexNumbersArgandPolarInput) -> ComplexNumbersArgandPolarOutput:
        x = params.real_part_x
        y = params.imaginary_part_y
        n = params.power_n_demoivre

        r = math.sqrt(x**2 + y**2)
        theta_rad = math.atan2(y, x)
        theta_deg = math.degrees(theta_rad)

        polar_str = f"{r:.2f} (cos {theta_deg:.1f}° + i sin {theta_deg:.1f}°)"

        # De Moivre: z^n = r^n * (cos(n theta) + i sin(n theta))
        r_n = math.pow(r, n)
        n_theta = n * theta_rad
        real_n = r_n * math.cos(n_theta)
        imag_n = r_n * math.sin(n_theta)

        telemetry = {
            "r": round(r, 3),
            "theta_deg": round(theta_deg, 2),
            "real_n": round(real_n, 2),
            "imag_n": round(imag_n, 2)
        }

        return ComplexNumbersArgandPolarOutput(
            modulus_r=round(r, 3),
            argument_theta_deg=round(theta_deg, 2),
            polar_form_string=polar_str,
            demoivre_powered_real=round(real_n, 2),
            demoivre_powered_imag=round(imag_n, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "3_plus_4i_cubed": {"real_part_x": 3.0, "imaginary_part_y": 4.0, "power_n_demoivre": 3},
            "1_plus_sqrt3i_sixth": {"real_part_x": 1.0, "imaginary_part_y": 1.732, "power_n_demoivre": 6}
        }


# ── 16. Vector Algebra Dot & Cross Products Engine ──────────────────────────
class VectorAlgebraDotCrossProductsInput(BaseModel):
    vector_a_components: List[float] = Field(default=[3.0, 4.0, 0.0])
    vector_b_components: List[float] = Field(default=[2.0, -1.0, 2.0])
    lever_arm_r_components: List[float] = Field(default=[0.5, 0.2, 0.0])
    force_f_components: List[float] = Field(default=[10.0, 25.0, 0.0])


class VectorAlgebraDotCrossProductsOutput(BaseModel):
    dot_product_work_done_joules: float
    cross_product_torque_vector: List[float]
    torque_magnitude_n_m: float
    angle_between_vectors_deg: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class VectorAlgebraDotCrossProductsEngine(BaseSimulationEngine):
    name = "vector-algebra-dot-cross-products"
    description = "BS101: Engineering Mathematics-I — Vector Dot Product Work Done W = F·d & Cross Product Torque tau = r x F"

    def calculate(self, params: VectorAlgebraDotCrossProductsInput) -> VectorAlgebraDotCrossProductsOutput:
        a = params.vector_a_components
        b = params.vector_b_components
        r = params.lever_arm_r_components
        f = params.force_f_components

        # Dot product W = A . B
        dot_w = a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

        mag_a = math.sqrt(a[0]**2 + a[1]**2 + a[2]**2)
        mag_b = math.sqrt(b[0]**2 + b[1]**2 + b[2]**2)
        cos_theta = dot_w / max(1e-6, mag_a * mag_b)
        cos_theta = max(-1.0, min(1.0, cos_theta))
        ang_deg = math.degrees(math.acos(cos_theta))

        # Cross product Torque = r x F
        tau_x = r[1]*f[2] - r[2]*f[1]
        tau_y = r[2]*f[0] - r[0]*f[2]
        tau_z = r[0]*f[1] - r[1]*f[0]
        tau_mag = math.sqrt(tau_x**2 + tau_y**2 + tau_z**2)

        telemetry = {
            "dot_w": round(dot_w, 2),
            "tau_vector": [round(tau_x, 2), round(tau_y, 2), round(tau_z, 2)],
            "tau_mag": round(tau_mag, 2),
            "angle_deg": round(ang_deg, 2)
        }

        return VectorAlgebraDotCrossProductsOutput(
            dot_product_work_done_joules=round(dot_w, 2),
            cross_product_torque_vector=[round(tau_x, 2), round(tau_y, 2), round(tau_z, 2)],
            torque_magnitude_n_m=round(tau_mag, 2),
            angle_between_vectors_deg=round(ang_deg, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_work_and_torque": {"vector_a_components": [3.0, 4.0, 0.0], "vector_b_components": [2.0, -1.0, 2.0], "lever_arm_r_components": [0.5, 0.2, 0.0], "force_f_components": [10.0, 25.0, 0.0]},
            "3d_orthogonal_forces": {"vector_a_components": [1.0, 2.0, 3.0], "vector_b_components": [4.0, -5.0, 6.0], "lever_arm_r_components": [1.0, 0.0, 0.0], "force_f_components": [0.0, 50.0, 0.0]}
        }
