"""
WBSCTE Basic Science (BS) 2nd Semester Physics, Mechanics, Maths-II & IT Engines (Common for All Branches)
==========================================================================================================
Syllabus Mapped:
1. BS104/BS106: SnellsLawRefractionGlassSlabEngine
2. BS104/BS106: ConvexLensFocalLengthUVEngine
3. BS104/BS106: GalvanometerHalfDeflectionResistanceEngine
4. BS104/BS106: GalvanometerAmmeterVoltmeterConversionEngine
5. BS104/BS106: PhotoelectricEffectInverseSquareLawEngine
6. BS104/BS106: PNJunctionDiodeKneeVoltageEngine
7. BS104/BS106: ParallelPlateCapacitorPermittivityEngine
8. BS104/BS106: CantileverVibrationFrequencyPeriodEngine
9. ES102/ES104: SinglePurchaseCrabWinchEngine
10. ES102/ES104: DoublePurchaseCrabWinchEngine
11. ES102/ES104: WormAndWormWheelMachineEngine
12. ES102/ES104: DifferentialAxleAndWheelEngine
13. ES102/ES104: LamisTheoremCoplanarForcesEngine
14. ES102/ES104: JibCraneTieJibForcesEngine
15. BS102:       CramersRuleMatrixInversionSystemEngine
16. ES102/ES106: NumberSystemBaseConversionsEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Snell's Law Refraction & Glass Slab Engine ───────────────────────────
class SnellsLawRefractionGlassSlabInput(BaseModel):
    angle_of_incidence_i_deg: float = Field(default=45.0, ge=0.0, le=85.0)
    refractive_index_mu: float = Field(default=1.50, ge=1.0, le=2.5)
    slab_thickness_t_cm: float = Field(default=6.0, ge=1.0, le=20.0)


class SnellsLawRefractionGlassSlabOutput(BaseModel):
    angle_of_refraction_r_deg: float
    lateral_shift_displacement_cm: float
    apparent_thickness_cm: float
    critical_angle_ic_deg: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SnellsLawRefractionGlassSlabEngine(BaseSimulationEngine):
    name = "snells-law-refraction-glass-slab"
    description = "BS104/BS106: Physics Lab — Snell's Law Refraction mu = sin(i)/sin(r) & Lateral Shift d = t sin(i-r)/cos(r)"

    def calculate(self, params: SnellsLawRefractionGlassSlabInput) -> SnellsLawRefractionGlassSlabOutput:
        i_deg = params.angle_of_incidence_i_deg
        mu = params.refractive_index_mu
        t = params.slab_thickness_t_cm

        i_rad = math.radians(i_deg)
        sin_r = math.sin(i_rad) / mu
        sin_r = max(-1.0, min(1.0, sin_r))
        r_rad = math.asin(sin_r)
        r_deg = math.degrees(r_rad)

        # Lateral displacement d = t * sin(i - r) / cos(r)
        d_lat = (t * math.sin(i_rad - r_rad)) / math.cos(r_rad) if math.cos(r_rad) > 1e-6 else 0.0
        app_thick = t / mu
        ic_deg = math.degrees(math.asin(1.0 / mu)) if mu >= 1.0 else 90.0

        telemetry = {
            "i_deg": i_deg,
            "r_deg": round(r_deg, 2),
            "d_lat_cm": round(d_lat, 3),
            "app_thick_cm": round(app_thick, 2),
            "ic_deg": round(ic_deg, 2)
        }

        return SnellsLawRefractionGlassSlabOutput(
            angle_of_refraction_r_deg=round(r_deg, 2),
            lateral_shift_displacement_cm=round(d_lat, 3),
            apparent_thickness_cm=round(app_thick, 2),
            critical_angle_ic_deg=round(ic_deg, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "crown_glass_45deg": {"angle_of_incidence_i_deg": 45.0, "refractive_index_mu": 1.50, "slab_thickness_t_cm": 6.0},
            "flint_glass_60deg": {"angle_of_incidence_i_deg": 60.0, "refractive_index_mu": 1.66, "slab_thickness_t_cm": 8.0}
        }


# ── 2. Convex Lens Focal Length u-v Method Engine ───────────────────────────
class ConvexLensFocalLengthUVInput(BaseModel):
    object_distance_u_cm: float = Field(default=-30.0, ge=-100.0, le=-5.0)
    image_distance_v_cm: float = Field(default=60.0, ge=5.0, le=200.0)
    lens_type: Literal["Double Convex Glass Lens", "Plano-Convex Lens"] = "Double Convex Glass Lens"


class ConvexLensFocalLengthUVOutput(BaseModel):
    focal_length_f_cm: float
    lens_power_dioptres: float
    linear_magnification_m: float
    image_nature_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ConvexLensFocalLengthUVEngine(BaseSimulationEngine):
    name = "convex-lens-focal-length-uv"
    description = "BS104/BS106: Physics Lab — Convex Lens Focal Length 1/f = 1/v - 1/u & Power P = 100/f by u-v Optical Bench"

    def calculate(self, params: ConvexLensFocalLengthUVInput) -> ConvexLensFocalLengthUVOutput:
        u = params.object_distance_u_cm
        v = params.image_distance_v_cm

        # 1/f = 1/v - 1/u
        inv_f = (1.0 / v) - (1.0 / u)
        f_cm = 1.0 / inv_f if abs(inv_f) > 1e-6 else 0.0
        p_dioptre = 100.0 / f_cm if abs(f_cm) > 1e-6 else 0.0
        m = v / u

        verdict = f"REAL, INVERTED & MAGNIFIED ({abs(m):.2f}x)" if abs(m) > 1.0 else f"REAL, INVERTED & DIMINISHED ({abs(m):.2f}x)"

        telemetry = {
            "f_cm": round(f_cm, 2),
            "p_dioptres": round(p_dioptre, 2),
            "mag": round(m, 2),
            "verdict": verdict
        }

        return ConvexLensFocalLengthUVOutput(
            focal_length_f_cm=round(f_cm, 2),
            lens_power_dioptres=round(p_dioptre, 2),
            linear_magnification_m=round(m, 2),
            image_nature_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "focal_length_20cm_magnified": {"object_distance_u_cm": -30.0, "image_distance_v_cm": 60.0, "lens_type": "Double Convex Glass Lens"},
            "focal_length_15cm_diminished": {"object_distance_u_cm": -45.0, "image_distance_v_cm": 22.5, "lens_type": "Double Convex Glass Lens"}
        }


# ── 3. Galvanometer Half-Deflection Resistance Engine ───────────────────────
class GalvanometerHalfDeflectionResistanceInput(BaseModel):
    cell_emf_e_volts: float = Field(default=2.0, ge=1.0, le=10.0)
    high_resistance_r_ohms: float = Field(default=4500.0, ge=500.0, le=20000.0)
    full_deflection_theta_div: int = Field(default=30, ge=10, le=50)
    shunt_resistance_s_ohms: float = Field(default=100.0, ge=10.0, le=1000.0)


class GalvanometerHalfDeflectionResistanceOutput(BaseModel):
    galvanometer_resistance_g_ohms: float
    figure_of_merit_k_amp_per_div: float
    full_scale_current_ig_ma: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class GalvanometerHalfDeflectionResistanceEngine(BaseSimulationEngine):
    name = "galvanometer-half-deflection-resistance"
    description = "BS104/BS106: Physics Lab — Galvanometer Internal Resistance G = RS/(R-S) & Figure of Merit k = E/((R+G)theta)"

    def calculate(self, params: GalvanometerHalfDeflectionResistanceInput) -> GalvanometerHalfDeflectionResistanceOutput:
        e = params.cell_emf_e_volts
        r = params.high_resistance_r_ohms
        theta = params.full_deflection_theta_div
        s = params.shunt_resistance_s_ohms

        # G = (R * S) / (R - S)
        g_ohms = (r * s) / (r - s) if (r - s) > 0 else 100.0
        # k = E / ((R + G) * theta)
        k_val = e / ((r + g_ohms) * theta)
        ig_ma = (k_val * theta) * 1000.0

        telemetry = {
            "g_ohms": round(g_ohms, 2),
            "k_val": f"{k_val:.4e}",
            "ig_ma": round(ig_ma, 4)
        }

        return GalvanometerHalfDeflectionResistanceOutput(
            galvanometer_resistance_g_ohms=round(g_ohms, 2),
            figure_of_merit_k_amp_per_div=round(k_val, 8),
            full_scale_current_ig_ma=round(ig_ma, 4),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "weston_galvanometer_4500_ohms": {"cell_emf_e_volts": 2.0, "high_resistance_r_ohms": 4500.0, "full_deflection_theta_div": 30, "shunt_resistance_s_ohms": 100.0},
            "sensitive_galvanometer_8000_ohms": {"cell_emf_e_volts": 2.0, "high_resistance_r_ohms": 8000.0, "full_deflection_theta_div": 30, "shunt_resistance_s_ohms": 80.0}
        }


# ── 4. Galvanometer to Ammeter & Voltmeter Conversion Engine ────────────────
class GalvanometerAmmeterVoltmeterConversionInput(BaseModel):
    galvanometer_resistance_g_ohms: float = Field(default=100.0, ge=10.0, le=500.0)
    full_scale_deflection_current_ig_ma: float = Field(default=0.5, ge=0.05, le=10.0)
    desired_ammeter_range_i_amp: float = Field(default=3.0, ge=0.5, le=20.0)
    desired_voltmeter_range_v_volts: float = Field(default=15.0, ge=1.0, le=100.0)


class GalvanometerAmmeterVoltmeterConversionOutput(BaseModel):
    parallel_shunt_resistance_s_ohms: float
    series_multiplier_resistance_rs_ohms: float
    ammeter_multiplying_power_n: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class GalvanometerAmmeterVoltmeterConversionEngine(BaseSimulationEngine):
    name = "galvanometer-ammeter-voltmeter-conversion"
    description = "BS104/BS106: Physics Lab — Conversion of Galvanometer into Ammeter S = Ig G / (I - Ig) & Voltmeter Rs = V/Ig - G"

    def calculate(self, params: GalvanometerAmmeterVoltmeterConversionInput) -> GalvanometerAmmeterVoltmeterConversionOutput:
        g = params.galvanometer_resistance_g_ohms
        ig = params.full_scale_deflection_current_ig_ma * 1e-3
        i = params.desired_ammeter_range_i_amp
        v = params.desired_voltmeter_range_v_volts

        # Shunt S = (Ig * G) / (I - Ig)
        s_shunt = (ig * g) / max(1e-6, i - ig)
        # Series Rs = V / Ig - G
        rs_mult = (v / ig) - g
        n_factor = i / ig

        telemetry = {
            "s_ohms": round(s_shunt, 5),
            "rs_ohms": round(rs_mult, 1),
            "n_factor": round(n_factor, 1)
        }

        return GalvanometerAmmeterVoltmeterConversionOutput(
            parallel_shunt_resistance_s_ohms=round(s_shunt, 5),
            series_multiplier_resistance_rs_ohms=round(rs_mult, 1),
            ammeter_multiplying_power_n=round(n_factor, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "3a_ammeter_15v_voltmeter": {"galvanometer_resistance_g_ohms": 100.0, "full_scale_deflection_current_ig_ma": 0.5, "desired_ammeter_range_i_amp": 3.0, "desired_voltmeter_range_v_volts": 15.0},
            "10a_ammeter_30v_voltmeter": {"galvanometer_resistance_g_ohms": 80.0, "full_scale_deflection_current_ig_ma": 1.0, "desired_ammeter_range_i_amp": 10.0, "desired_voltmeter_range_v_volts": 30.0}
        }


# ── 5. Photoelectric Effect & Inverse Square Law Engine ────────────────────
class PhotoelectricEffectInverseSquareLawInput(BaseModel):
    source_distance_d_cm: float = Field(default=25.0, ge=10.0, le=100.0)
    source_power_p_watts: float = Field(default=60.0, ge=10.0, le=200.0)
    photocathode_work_function_phi_ev: float = Field(default=2.14, ge=1.5, le=5.0)
    incident_light_wavelength_nm: float = Field(default=450.0, ge=300.0, le=700.0)


class PhotoelectricEffectInverseSquareLawOutput(BaseModel):
    incident_light_intensity_w_m2: float
    photon_energy_e_ev: float
    max_kinetic_energy_kmax_ev: float
    stopping_potential_v0_volts: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PhotoelectricEffectInverseSquareLawEngine(BaseSimulationEngine):
    name = "photoelectric-effect-inverse-square-law"
    description = "BS104/BS106: Physics Lab — Photoelectric Cell Inverse Square Law I_ph proportional to 1/d^2 & Stopping Potential V0"

    def calculate(self, params: PhotoelectricEffectInverseSquareLawInput) -> PhotoelectricEffectInverseSquareLawOutput:
        d_m = params.source_distance_d_cm * 1e-2
        p = params.source_power_p_watts
        phi = params.photocathode_work_function_phi_ev
        lam_nm = params.incident_light_wavelength_nm

        # Intensity I = P / (4 * pi * d^2)
        intensity = p / (4.0 * math.pi * (d_m**2))
        # Photon energy E = 1240 / lambda(nm) in eV
        e_phot = 1240.0 / lam_nm
        k_max = max(0.0, e_phot - phi)
        v0 = k_max  # Stopping potential in Volts

        telemetry = {
            "intensity_w_m2": round(intensity, 2),
            "e_phot_ev": round(e_phot, 3),
            "k_max_ev": round(k_max, 3),
            "v0_volts": round(v0, 3)
        }

        return PhotoelectricEffectInverseSquareLawOutput(
            incident_light_intensity_w_m2=round(intensity, 2),
            photon_energy_e_ev=round(e_phot, 3),
            max_kinetic_energy_kmax_ev=round(k_max, 3),
            stopping_potential_v0_volts=round(v0, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "cesium_450nm_25cm": {"source_distance_d_cm": 25.0, "source_power_p_watts": 60.0, "photocathode_work_function_phi_ev": 2.14, "incident_light_wavelength_nm": 450.0},
            "potassium_500nm_40cm": {"source_distance_d_cm": 40.0, "source_power_p_watts": 100.0, "photocathode_work_function_phi_ev": 2.30, "incident_light_wavelength_nm": 500.0}
        }


# ── 6. P-N Junction Diode Knee Voltage Engine ──────────────────────────────
class PNJunctionDiodeKneeVoltageInput(BaseModel):
    forward_voltage_vf_volts: float = Field(default=0.75, ge=0.0, le=1.5)
    semiconductor_material: Literal["Silicon (Si)", "Germanium (Ge)"] = "Silicon (Si)"
    temperature_k: float = Field(default=300.0, ge=250.0, le=400.0)
    saturation_current_is_na: float = Field(default=10.0, ge=1.0, le=1000.0)


class PNJunctionDiodeKneeVoltageOutput(BaseModel):
    knee_voltage_vk_volts: float
    forward_current_if_ma: float
    dynamic_resistance_rd_ohms: float
    conduction_state: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PNJunctionDiodeKneeVoltageEngine(BaseSimulationEngine):
    name = "pn-junction-diode-knee-voltage"
    description = "BS104/BS106: Physics Lab — P-N Junction Diode V-I Characteristics, Barrier Knee Voltage & Dynamic Resistance rd"

    def calculate(self, params: PNJunctionDiodeKneeVoltageInput) -> PNJunctionDiodeKneeVoltageOutput:
        vf = params.forward_voltage_vf_volts
        mat = params.semiconductor_material
        t = params.temperature_k
        i_s = params.saturation_current_is_na * 1e-9

        vk = 0.70 if "Silicon" in mat else 0.30
        eta = 2.0 if "Silicon" in mat else 1.0
        vt = (1.38e-23 * t) / 1.6e-19  # thermal voltage ~0.0258V

        exponent = min(30.0, vf / (eta * vt))
        i_f = i_s * (math.exp(exponent) - 1.0)
        i_f_ma = i_f * 1000.0

        r_d = (eta * vt) / max(1e-6, i_f) if vf >= vk else 10000.0
        state = "HIGH CONDUCTION (Above Knee Voltage)" if vf >= vk else "SUB-BARRIER LEAKAGE (Below Knee Voltage)"

        telemetry = {
            "vk": vk,
            "if_ma": round(i_f_ma, 2),
            "rd_ohms": round(r_d, 2),
            "state": state
        }

        return PNJunctionDiodeKneeVoltageOutput(
            knee_voltage_vk_volts=vk,
            forward_current_if_ma=round(i_f_ma, 2),
            dynamic_resistance_rd_ohms=round(r_d, 2),
            conduction_state=state,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "silicon_diode_0_75v": {"forward_voltage_vf_volts": 0.75, "semiconductor_material": "Silicon (Si)", "temperature_k": 300.0, "saturation_current_is_na": 10.0},
            "germanium_diode_0_35v": {"forward_voltage_vf_volts": 0.35, "semiconductor_material": "Germanium (Ge)", "temperature_k": 300.0, "saturation_current_is_na": 500.0}
        }


# ── 7. Parallel Plate Capacitor & Permittivity Engine ───────────────────────
class ParallelPlateCapacitorPermittivityInput(BaseModel):
    plate_diameter_d_cm: float = Field(default=20.0, ge=5.0, le=50.0)
    plate_separation_d_mm: float = Field(default=2.0, ge=0.5, le=20.0)
    dielectric_constant_k: float = Field(default=4.5, ge=1.0, le=20.0)
    applied_voltage_v_volts: float = Field(default=200.0, ge=10.0, le=1000.0)


class ParallelPlateCapacitorPermittivityOutput(BaseModel):
    vacuum_capacitance_c0_pf: float
    dielectric_capacitance_c_pf: float
    stored_charge_q_nc: float
    stored_electrostatic_energy_micro_j: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ParallelPlateCapacitorPermittivityEngine(BaseSimulationEngine):
    name = "parallel-plate-capacitor-permittivity"
    description = "BS104/BS106: Physics Lab — Parallel Plate Capacitor Capacitance C = eps0 epsr A / d & Permittivity of Air"

    def calculate(self, params: ParallelPlateCapacitorPermittivityInput) -> ParallelPlateCapacitorPermittivityOutput:
        d_plate_m = params.plate_diameter_d_cm * 1e-2
        d_sep_m = params.plate_separation_d_mm * 1e-3
        k = params.dielectric_constant_k
        v = params.applied_voltage_v_volts
        eps0 = 8.854187817e-12

        area = (math.pi / 4.0) * (d_plate_m**2)
        c0 = (eps0 * area) / d_sep_m
        c = k * c0
        c0_pf = c0 * 1e12
        c_pf = c * 1e12
        q_nc = (c * v) * 1e9
        u_uj = (0.5 * c * (v**2)) * 1e6

        telemetry = {
            "c0_pf": round(c0_pf, 2),
            "c_pf": round(c_pf, 2),
            "q_nc": round(q_nc, 2),
            "u_uj": round(u_uj, 2)
        }

        return ParallelPlateCapacitorPermittivityOutput(
            vacuum_capacitance_c0_pf=round(c0_pf, 2),
            dielectric_capacitance_c_pf=round(c_pf, 2),
            stored_charge_q_nc=round(q_nc, 2),
            stored_electrostatic_energy_micro_j=round(u_uj, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "air_dielectric_2mm_gap": {"plate_diameter_d_cm": 20.0, "plate_separation_d_mm": 2.0, "dielectric_constant_k": 1.0, "applied_voltage_v_volts": 200.0},
            "mica_dielectric_k4_5": {"plate_diameter_d_cm": 20.0, "plate_separation_d_mm": 2.0, "dielectric_constant_k": 4.5, "applied_voltage_v_volts": 200.0}
        }


# ── 8. Cantilever Vibration Frequency & Period Engine ───────────────────────
class CantileverVibrationFrequencyPeriodInput(BaseModel):
    cantilever_length_l_cm: float = Field(default=50.0, ge=20.0, le=100.0)
    blade_width_b_mm: float = Field(default=25.0, ge=10.0, le=50.0)
    blade_thickness_d_mm: float = Field(default=1.5, ge=0.5, le=5.0)
    youngs_modulus_y_gpa: float = Field(default=200.0, ge=50.0, le=400.0)
    attached_load_m_kg: float = Field(default=0.30, ge=0.05, le=2.0)


class CantileverVibrationFrequencyPeriodOutput(BaseModel):
    cantilever_stiffness_k_n_m: float
    oscillation_time_period_t_sec: float
    natural_frequency_f_hz: float
    tip_static_deflection_mm: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CantileverVibrationFrequencyPeriodEngine(BaseSimulationEngine):
    name = "cantilever-vibration-frequency-period"
    description = "BS104/BS106: Physics Lab — Cantilever Vibration Time Period T = 2pi sqrt(M/k) & Young's Modulus Determination"

    def calculate(self, params: CantileverVibrationFrequencyPeriodInput) -> CantileverVibrationFrequencyPeriodOutput:
        l = params.cantilever_length_l_cm * 1e-2
        b = params.blade_width_b_mm * 1e-3
        d = params.blade_thickness_d_mm * 1e-3
        y = params.youngs_modulus_y_gpa * 1e9
        m = params.attached_load_m_kg
        g = 9.81

        # I_b = (b * d^3) / 12
        i_b = (b * (d**3)) / 12.0
        # Stiffness k = 3 * Y * I_b / L^3
        k_stiff = (3.0 * y * i_b) / (l**3)
        # T = 2 * pi * sqrt(M / k)
        t_sec = 2.0 * math.pi * math.sqrt(m / k_stiff)
        f_hz = 1.0 / t_sec
        delta_stat_mm = ((m * g) / k_stiff) * 1000.0

        telemetry = {
            "k_nm": round(k_stiff, 2),
            "t_sec": round(t_sec, 4),
            "f_hz": round(f_hz, 3),
            "delta_mm": round(delta_stat_mm, 2)
        }

        return CantileverVibrationFrequencyPeriodOutput(
            cantilever_stiffness_k_n_m=round(k_stiff, 2),
            oscillation_time_period_t_sec=round(t_sec, 4),
            natural_frequency_f_hz=round(f_hz, 3),
            tip_static_deflection_mm=round(delta_stat_mm, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "steel_cantilever_50cm_0_3kg": {"cantilever_length_l_cm": 50.0, "blade_width_b_mm": 25.0, "blade_thickness_d_mm": 1.5, "youngs_modulus_y_gpa": 200.0, "attached_load_m_kg": 0.30},
            "brass_cantilever_40cm_0_5kg": {"cantilever_length_l_cm": 40.0, "blade_width_b_mm": 20.0, "blade_thickness_d_mm": 2.0, "youngs_modulus_y_gpa": 100.0, "attached_load_m_kg": 0.50}
        }


# ── 9. Single Purchase Crab Winch Engine ────────────────────────────────────
class SinglePurchaseCrabWinchInput(BaseModel):
    load_lifted_w_kg: float = Field(default=60.0, ge=10.0, le=500.0)
    effort_applied_p_kg: float = Field(default=4.5, ge=0.5, le=50.0)
    effort_wheel_diameter_2r_cm: float = Field(default=40.0, ge=15.0, le=100.0)
    load_drum_diameter_d_cm: float = Field(default=15.0, ge=5.0, le=40.0)
    teeth_pinion_t1: int = Field(default=20, ge=10, le=50)
    teeth_spur_gear_t2: int = Field(default=60, ge=30, le=150)


class SinglePurchaseCrabWinchOutput(BaseModel):
    velocity_ratio_vr: float
    mechanical_advantage_ma: float
    mechanical_efficiency_percent: float
    ideal_effort_pi_kg: float
    effort_lost_in_friction_pf_kg: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SinglePurchaseCrabWinchEngine(BaseSimulationEngine):
    name = "single-purchase-crab-winch"
    description = "ES102/ES104: Mechanics Lab — Single Purchase Crab Winch VR = (2R/d)(T2/T1), MA = W/P & Efficiency eta"

    def calculate(self, params: SinglePurchaseCrabWinchInput) -> SinglePurchaseCrabWinchOutput:
        w = params.load_lifted_w_kg
        p = params.effort_applied_p_kg
        diam_2r = params.effort_wheel_diameter_2r_cm
        d_drum = params.load_drum_diameter_d_cm
        t1 = params.teeth_pinion_t1
        t2 = params.teeth_spur_gear_t2

        # VR = (2R / d) * (T2 / T1)
        vr = (diam_2r / d_drum) * (t2 / t1)
        ma = w / p
        eta = (ma / vr) * 100.0
        p_ideal = w / vr
        p_fric = p - p_ideal

        telemetry = {
            "vr": round(vr, 2),
            "ma": round(ma, 2),
            "eta_pct": round(eta, 2),
            "p_fric_kg": round(p_fric, 3)
        }

        return SinglePurchaseCrabWinchOutput(
            velocity_ratio_vr=round(vr, 2),
            mechanical_advantage_ma=round(ma, 2),
            mechanical_efficiency_percent=round(eta, 2),
            ideal_effort_pi_kg=round(p_ideal, 3),
            effort_lost_in_friction_pf_kg=round(p_fric, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_single_crab_60kg": {"load_lifted_w_kg": 60.0, "effort_applied_p_kg": 4.5, "effort_wheel_diameter_2r_cm": 40.0, "load_drum_diameter_d_cm": 15.0, "teeth_pinion_t1": 20, "teeth_spur_gear_t2": 60},
            "heavy_single_crab_120kg": {"load_lifted_w_kg": 120.0, "effort_applied_p_kg": 8.5, "effort_wheel_diameter_2r_cm": 50.0, "load_drum_diameter_d_cm": 15.0, "teeth_pinion_t1": 15, "teeth_spur_gear_t2": 60}
        }


# ── 10. Double Purchase Crab Winch Engine ───────────────────────────────────
class DoublePurchaseCrabWinchInput(BaseModel):
    load_lifted_w_kg: float = Field(default=150.0, ge=20.0, le=1000.0)
    effort_applied_p_kg: float = Field(default=5.0, ge=1.0, le=100.0)
    effort_arm_length_r_cm: float = Field(default=30.0, ge=15.0, le=60.0)
    load_drum_radius_r_drum_cm: float = Field(default=10.0, ge=5.0, le=25.0)
    pinions_t1_t3: List[int] = Field(default=[20, 25])
    spur_gears_t2_t4: List[int] = Field(default=[60, 100])


class DoublePurchaseCrabWinchOutput(BaseModel):
    velocity_ratio_vr: float
    mechanical_advantage_ma: float
    mechanical_efficiency_percent: float
    load_lost_in_friction_wf_kg: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DoublePurchaseCrabWinchEngine(BaseSimulationEngine):
    name = "double-purchase-crab-winch"
    description = "ES102/ES104: Mechanics Lab — Double Purchase Crab Winch VR = (R/r_drum)(T2/T1)(T4/T3), MA & Efficiency"

    def calculate(self, params: DoublePurchaseCrabWinchInput) -> DoublePurchaseCrabWinchOutput:
        w = params.load_lifted_w_kg
        p = params.effort_applied_p_kg
        r_arm = params.effort_arm_length_r_cm
        r_drum = params.load_drum_radius_r_drum_cm
        t1, t3 = params.pinions_t1_t3[0], params.pinions_t1_t3[1]
        t2, t4 = params.spur_gears_t2_t4[0], params.spur_gears_t2_t4[1]

        # VR = (R / r_drum) * (T2 / T1) * (T4 / T3)
        vr = (r_arm / r_drum) * (t2 / t1) * (t4 / t3)
        ma = w / p
        eta = (ma / vr) * 100.0
        w_fric = (p * vr) - w

        telemetry = {
            "vr": round(vr, 2),
            "ma": round(ma, 2),
            "eta_pct": round(eta, 2),
            "w_fric_kg": round(w_fric, 2)
        }

        return DoublePurchaseCrabWinchOutput(
            velocity_ratio_vr=round(vr, 2),
            mechanical_advantage_ma=round(ma, 2),
            mechanical_efficiency_percent=round(eta, 2),
            load_lost_in_friction_wf_kg=round(w_fric, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "lab_double_crab_150kg": {"load_lifted_w_kg": 150.0, "effort_applied_p_kg": 5.0, "effort_arm_length_r_cm": 30.0, "load_drum_radius_r_drum_cm": 10.0, "pinions_t1_t3": [20, 25], "spur_gears_t2_t4": [60, 100]},
            "heavy_industrial_double_crab": {"load_lifted_w_kg": 300.0, "effort_applied_p_kg": 9.5, "effort_arm_length_r_cm": 35.0, "load_drum_radius_r_drum_cm": 10.0, "pinions_t1_t3": [15, 20], "spur_gears_t2_t4": [60, 100]}
        }


# ── 11. Worm and Worm Wheel Machine Engine ──────────────────────────────────
class WormAndWormWheelMachineInput(BaseModel):
    load_lifted_w_kg: float = Field(default=120.0, ge=20.0, le=1000.0)
    effort_applied_p_kg: float = Field(default=3.2, ge=0.5, le=50.0)
    effort_wheel_radius_r_cm: float = Field(default=25.0, ge=10.0, le=50.0)
    load_drum_radius_r_drum_cm: float = Field(default=8.0, ge=4.0, le=20.0)
    teeth_worm_wheel_t: int = Field(default=40, ge=20, le=80)
    worm_threads_n: int = Field(default=1, ge=1, le=4)


class WormAndWormWheelMachineOutput(BaseModel):
    velocity_ratio_vr: float
    mechanical_advantage_ma: float
    mechanical_efficiency_percent: float
    reversibility_self_locking_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class WormAndWormWheelMachineEngine(BaseSimulationEngine):
    name = "worm-and-worm-wheel-machine"
    description = "ES102/ES104: Mechanics Lab — Worm & Worm Wheel VR = (R/r_drum)(T/n), MA = W/P & Self-Locking Condition eta < 50%"

    def calculate(self, params: WormAndWormWheelMachineInput) -> WormAndWormWheelMachineOutput:
        w = params.load_lifted_w_kg
        p = params.effort_applied_p_kg
        r_wheel = params.effort_wheel_radius_r_cm
        r_drum = params.load_drum_radius_r_drum_cm
        t_teeth = params.teeth_worm_wheel_t
        n_start = params.worm_threads_n

        # VR = (R / r_drum) * (T / n)
        vr = (r_wheel / r_drum) * (t_teeth / n_start)
        ma = w / p
        eta = (ma / vr) * 100.0
        rev_status = "NON-REVERSIBLE / SELF-LOCKING (η < 50%)" if eta < 50.0 else "REVERSIBLE MACHINE (η ≥ 50%)"

        telemetry = {
            "vr": round(vr, 2),
            "ma": round(ma, 2),
            "eta_pct": round(eta, 2),
            "rev_status": rev_status
        }

        return WormAndWormWheelMachineOutput(
            velocity_ratio_vr=round(vr, 2),
            mechanical_advantage_ma=round(ma, 2),
            mechanical_efficiency_percent=round(eta, 2),
            reversibility_self_locking_status=rev_status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "single_threaded_worm_120kg": {"load_lifted_w_kg": 120.0, "effort_applied_p_kg": 3.2, "effort_wheel_radius_r_cm": 25.0, "load_drum_radius_r_drum_cm": 8.0, "teeth_worm_wheel_t": 40, "worm_threads_n": 1},
            "double_threaded_worm_200kg": {"load_lifted_w_kg": 200.0, "effort_applied_p_kg": 4.8, "effort_wheel_radius_r_cm": 30.0, "load_drum_radius_r_drum_cm": 8.0, "teeth_worm_wheel_t": 50, "worm_threads_n": 2}
        }


# ── 12. Differential Axle and Wheel Engine ──────────────────────────────────
class DifferentialAxleAndWheelInput(BaseModel):
    load_lifted_w_kg: float = Field(default=100.0, ge=10.0, le=500.0)
    effort_applied_p_kg: float = Field(default=8.0, ge=0.5, le=50.0)
    effort_wheel_diameter_d_cm: float = Field(default=40.0, ge=20.0, le=80.0)
    larger_axle_diameter_d1_cm: float = Field(default=20.0, ge=10.0, le=40.0)
    smaller_axle_diameter_d2_cm: float = Field(default=15.0, ge=5.0, le=35.0)


class DifferentialAxleAndWheelOutput(BaseModel):
    velocity_ratio_vr: float
    mechanical_advantage_ma: float
    mechanical_efficiency_percent: float
    ideal_effort_pi_kg: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DifferentialAxleAndWheelEngine(BaseSimulationEngine):
    name = "differential-axle-and-wheel"
    description = "ES102/ES104: Mechanics Lab — Differential Axle & Wheel VR = 2D / (d1 - d2), MA = W/P & Efficiency eta"

    def calculate(self, params: DifferentialAxleAndWheelInput) -> DifferentialAxleAndWheelOutput:
        w = params.load_lifted_w_kg
        p = params.effort_applied_p_kg
        d_wheel = params.effort_wheel_diameter_d_cm
        d1 = params.larger_axle_diameter_d1_cm
        d2 = params.smaller_axle_diameter_d2_cm

        # VR = 2D / (d1 - d2)
        diff = max(0.5, d1 - d2)
        vr = (2.0 * d_wheel) / diff
        ma = w / p
        eta = (ma / vr) * 100.0
        p_ideal = w / vr

        telemetry = {
            "vr": round(vr, 2),
            "ma": round(ma, 2),
            "eta_pct": round(eta, 2),
            "p_ideal_kg": round(p_ideal, 2)
        }

        return DifferentialAxleAndWheelOutput(
            velocity_ratio_vr=round(vr, 2),
            mechanical_advantage_ma=round(ma, 2),
            mechanical_efficiency_percent=round(eta, 2),
            ideal_effort_pi_kg=round(p_ideal, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "differential_wheel_100kg": {"load_lifted_w_kg": 100.0, "effort_applied_p_kg": 8.0, "effort_wheel_diameter_d_cm": 40.0, "larger_axle_diameter_d1_cm": 20.0, "smaller_axle_diameter_d2_cm": 15.0},
            "high_ratio_diff_wheel": {"load_lifted_w_kg": 150.0, "effort_applied_p_kg": 7.5, "effort_wheel_diameter_d_cm": 50.0, "larger_axle_diameter_d1_cm": 22.0, "smaller_axle_diameter_d2_cm": 18.0}
        }


# ── 13. Lami's Theorem & Coplanar Forces Engine ─────────────────────────────
class LamisTheoremCoplanarForcesInput(BaseModel):
    force_p_newtons: float = Field(default=100.0, ge=10.0, le=1000.0)
    angle_alpha_deg: float = Field(default=120.0, ge=60.0, le=170.0)
    angle_beta_deg: float = Field(default=135.0, ge=60.0, le=170.0)


class LamisTheoremCoplanarForcesOutput(BaseModel):
    angle_gamma_deg: float
    force_q_newtons: float
    force_r_newtons: float
    coplanar_equilibrium_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class LamisTheoremCoplanarForcesEngine(BaseSimulationEngine):
    name = "lamis-theorem-coplanar-forces"
    description = "ES102/ES104: Mechanics Lab — Lami's Theorem P/sin(alpha) = Q/sin(beta) = R/sin(gamma) & Coplanar Concurrent Equilibrium"

    def calculate(self, params: LamisTheoremCoplanarForcesInput) -> LamisTheoremCoplanarForcesOutput:
        p = params.force_p_newtons
        alpha_deg = params.angle_alpha_deg
        beta_deg = params.angle_beta_deg

        gamma_deg = 360.0 - (alpha_deg + beta_deg)
        alpha_rad = math.radians(alpha_deg)
        beta_rad = math.radians(beta_deg)
        gamma_rad = math.radians(gamma_deg)

        # Lami's: P / sin(alpha) = Q / sin(beta) = R / sin(gamma)
        sin_a = max(1e-4, math.sin(alpha_rad))
        q = p * (math.sin(beta_rad) / sin_a)
        r = p * (math.sin(gamma_rad) / sin_a)

        status = f"COPLANAR EQUILIBRIUM VERIFIED: Q = {q:.2f} N, R = {r:.2f} N (γ = {gamma_deg:.1f}°)"

        telemetry = {
            "gamma_deg": round(gamma_deg, 1),
            "q_newtons": round(q, 2),
            "r_newtons": round(r, 2),
            "status": status
        }

        return LamisTheoremCoplanarForcesOutput(
            angle_gamma_deg=round(gamma_deg, 1),
            force_q_newtons=round(q, 2),
            force_r_newtons=round(r, 2),
            coplanar_equilibrium_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "symmetric_120deg_triad": {"force_p_newtons": 100.0, "angle_alpha_deg": 120.0, "angle_beta_deg": 120.0},
            "asymmetric_120_135deg": {"force_p_newtons": 100.0, "angle_alpha_deg": 120.0, "angle_beta_deg": 135.0}
        }


# ── 14. Jib Crane Tie & Jib Member Forces Engine ───────────────────────────
class JibCraneTieJibForcesInput(BaseModel):
    suspended_load_w_kn: float = Field(default=20.0, ge=1.0, le=200.0)
    jib_angle_theta1_deg: float = Field(default=30.0, ge=10.0, le=60.0)
    tie_angle_theta2_deg: float = Field(default=45.0, ge=15.0, le=75.0)


class JibCraneTieJibForcesOutput(BaseModel):
    tie_rod_tension_ftie_kn: float
    jib_boom_compression_fjib_kn: float
    vertical_post_reaction_kn: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class JibCraneTieJibForcesEngine(BaseSimulationEngine):
    name = "jib-crane-tie-jib-forces"
    description = "ES102/ES104: Mechanics Lab — Jib Crane Force Analysis F_tie = W sin(theta2)/sin(theta1+theta2) & F_jib Boom Compression"

    def calculate(self, params: JibCraneTieJibForcesInput) -> JibCraneTieJibForcesOutput:
        w = params.suspended_load_w_kn
        th1_rad = math.radians(params.jib_angle_theta1_deg)
        th2_rad = math.radians(params.tie_angle_theta2_deg)

        sin_sum = math.sin(th1_rad + th2_rad)
        sin_sum = max(1e-4, sin_sum)

        # F_tie = W * sin(th2) / sin(th1 + th2)
        f_tie = (w * math.sin(th2_rad)) / sin_sum
        # F_jib = W * sin(th1) / sin(th1 + th2)
        f_jib = (w * math.sin(th1_rad)) / sin_sum

        telemetry = {
            "f_tie_kn": round(f_tie, 2),
            "f_jib_kn": round(f_jib, 2),
            "w_kn": w
        }

        return JibCraneTieJibForcesOutput(
            tie_rod_tension_ftie_kn=round(f_tie, 2),
            jib_boom_compression_fjib_kn=round(f_jib, 2),
            vertical_post_reaction_kn=round(w, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "jib_30deg_tie_45deg_20kn": {"suspended_load_w_kn": 20.0, "jib_angle_theta1_deg": 30.0, "tie_angle_theta2_deg": 45.0},
            "heavy_jib_45deg_tie_60deg_50kn": {"suspended_load_w_kn": 50.0, "jib_angle_theta1_deg": 45.0, "tie_angle_theta2_deg": 60.0}
        }


# ── 15. Cramer's Rule Matrix Inversion System Engine ────────────────────────
class CramersRuleMatrixInversionSystemInput(BaseModel):
    matrix_a_row1: List[float] = Field(default=[2.0, 1.0, 1.0])
    matrix_a_row2: List[float] = Field(default=[1.0, 3.0, 2.0])
    matrix_a_row3: List[float] = Field(default=[1.0, 1.0, 1.0])
    constants_vector_b: List[float] = Field(default=[10.0, 18.0, 6.0])


class CramersRuleMatrixInversionSystemOutput(BaseModel):
    main_determinant_delta: float
    solution_x: float
    solution_y: float
    solution_z: float
    system_consistency_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CramersRuleMatrixInversionSystemEngine(BaseSimulationEngine):
    name = "cramers-rule-matrix-inversion-system"
    description = "BS102: Engineering Mathematics-II — System of Linear Equations Solver via Cramer's Rule x = Dx/D, y = Dy/D, z = Dz/D"

    def calculate(self, params: CramersRuleMatrixInversionSystemInput) -> CramersRuleMatrixInversionSystemOutput:
        a = np.array([params.matrix_a_row1, params.matrix_a_row2, params.matrix_a_row3], dtype=float)
        b = np.array(params.constants_vector_b, dtype=float)

        delta = float(np.linalg.det(a))

        if abs(delta) > 1e-5:
            # Cramer's Rule
            ax = a.copy(); ax[:, 0] = b; dx = float(np.linalg.det(ax))
            ay = a.copy(); ay[:, 1] = b; dy = float(np.linalg.det(ay))
            az = a.copy(); az[:, 2] = b; dz = float(np.linalg.det(az))

            x = dx / delta
            y = dy / delta
            z = dz / delta
            verdict = f"UNIQUE CONSISTENT SOLUTION: x = {x:.2f}, y = {y:.2f}, z = {z:.2f} (Determinant Δ = {delta:.1f})"
        else:
            x, y, z = 0.0, 0.0, 0.0
            verdict = "SYSTEM IS SINGULAR (Δ = 0: Infinitely Many Solutions or Inconsistent)"

        telemetry = {
            "delta": round(delta, 2),
            "x": round(x, 2),
            "y": round(y, 2),
            "z": round(z, 2),
            "verdict": verdict
        }

        return CramersRuleMatrixInversionSystemOutput(
            main_determinant_delta=round(delta, 2),
            solution_x=round(x, 2),
            solution_y=round(y, 2),
            solution_z=round(z, 2),
            system_consistency_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_3x3_system": {"matrix_a_row1": [2.0, 1.0, 1.0], "matrix_a_row2": [1.0, 3.0, 2.0], "matrix_a_row3": [1.0, 1.0, 1.0], "constants_vector_b": [10.0, 18.0, 6.0]},
            "orthogonal_mesh_system": {"matrix_a_row1": [3.0, -1.0, 2.0], "matrix_a_row2": [1.0, 2.0, 3.0], "matrix_a_row3": [2.0, -2.0, -1.0], "constants_vector_b": [12.0, 11.0, 2.0]}
        }


# ── 16. Number System Base Conversions Engine ───────────────────────────────
class NumberSystemBaseConversionsInput(BaseModel):
    input_decimal_integer: int = Field(default=215, ge=0, le=65535)


class NumberSystemBaseConversionsOutput(BaseModel):
    binary_string: str
    octal_string: str
    hexadecimal_string: str
    bcd_8421_string: str
    gray_code_string: str
    excess_3_string: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class NumberSystemBaseConversionsEngine(BaseSimulationEngine):
    name = "number-system-base-conversions"
    description = "ES102/ES106: Introduction to IT Systems — Number Base Converter (Binary, Octal, Hexadecimal, BCD 8421, Gray Code & Excess-3)"

    def calculate(self, params: NumberSystemBaseConversionsInput) -> NumberSystemBaseConversionsOutput:
        n = params.input_decimal_integer

        bin_str = bin(n)[2:]
        oct_str = oct(n)[2:]
        hex_str = hex(n)[2:].upper()

        # BCD 8421
        digits = [int(d) for d in str(n)]
        bcd_parts = [f"{d:04b}" for d in digits]
        bcd_str = " ".join(bcd_parts)

        # Excess-3
        ex3_parts = [f"{(d + 3):04b}" for d in digits]
        ex3_str = " ".join(ex3_parts)

        # Gray code: G = B ^ (B >> 1)
        gray_int = n ^ (n >> 1)
        gray_str = bin(gray_int)[2:]

        telemetry = {
            "dec": n,
            "bin": bin_str,
            "oct": oct_str,
            "hex": hex_str,
            "bcd": bcd_str,
            "gray": gray_str
        }

        return NumberSystemBaseConversionsOutput(
            binary_string=bin_str,
            octal_string=oct_str,
            hexadecimal_string=hex_str,
            bcd_8421_string=bcd_str,
            gray_code_string=gray_str,
            excess_3_string=ex3_str,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "decimal_215": {"input_decimal_integer": 215},
            "decimal_1024": {"input_decimal_integer": 1024}
        }
