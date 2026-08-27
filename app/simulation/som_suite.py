"""
Strength of Materials & Machine Design Simulation Suite (SOM Batch)
===================================================================
Covers 18 Strength of Materials & Machine Design engines:
1. StressStrainEngine
2. BeamBendingEngine
3. ShaftTorsionEngine
4. ColumnBucklingEngine
5. MohrsCircleEngine
6. StressConcentrationEngine
7. PressureVesselEngine
8. SpringDesignEngine
9. BoltedJointEngine
10. RivetedJointsEngine
11. WeldStrengthEngine
12. BearingEngine
13. GearStrengthEngine
14. PowerScrewEngine
15. FatigueLifeEngine
16. CrackPropagationEngine
17. CrossSectionPropsEngine
18. MaterialTestingEngine
"""

import math
from typing import Dict, Any, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Stress Strain Engine ──────────────────────────────────────────────────
class StressStrainInput(BaseModel):
    applied_force_kn: float = Field(default=50.0, ge=0.1, le=1000.0)
    specimen_diameter_mm: float = Field(default=12.5, ge=1.0, le=100.0)
    gauge_length_mm: float = Field(default=50.0, ge=10.0, le=500.0)
    youngs_modulus_gpa: float = Field(default=200.0, ge=10.0, le=500.0)
    poissons_ratio: float = Field(default=0.30, ge=0.1, le=0.5)

class StressStrainOutput(BaseModel):
    axial_stress_mpa: float
    axial_strain: float
    elongation_mm: float
    shear_modulus_gpa: float
    lateral_strain: float
    bulk_modulus_gpa: float
    telemetry: Dict[str, Any]

class StressStrainEngine(BaseSimulationEngine):
    name = "stress-strain"

    def calculate(self, params: StressStrainInput) -> StressStrainOutput:
        area_mm2 = (math.pi / 4.0) * (params.specimen_diameter_mm ** 2)
        stress_mpa = (params.applied_force_kn * 1000.0) / area_mm2
        e_mpa = params.youngs_modulus_gpa * 1000.0
        strain = stress_mpa / e_mpa
        elongation_mm = strain * params.gauge_length_mm
        g_gpa = params.youngs_modulus_gpa / (2.0 * (1.0 + params.poissons_ratio))
        k_gpa = params.youngs_modulus_gpa / (3.0 * (1.0 - 2.0 * params.poissons_ratio))
        lateral_strain = -params.poissons_ratio * strain

        return StressStrainOutput(
            axial_stress_mpa=round(stress_mpa, 2),
            axial_strain=round(strain, 6),
            elongation_mm=round(elongation_mm, 4),
            shear_modulus_gpa=round(g_gpa, 2),
            lateral_strain=round(lateral_strain, 6),
            bulk_modulus_gpa=round(k_gpa, 2),
            telemetry={"stress_mpa": stress_mpa, "strain": strain, "elongation_mm": elongation_mm}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "mild_steel": {"applied_force_kn": 45.0, "specimen_diameter_mm": 12.5, "youngs_modulus_gpa": 205.0},
            "aluminum_alloy": {"applied_force_kn": 25.0, "specimen_diameter_mm": 12.5, "youngs_modulus_gpa": 70.0}
        }


# ── 2. Beam Bending Engine ───────────────────────────────────────────────────
class BeamBendingInput(BaseModel):
    support_type: Literal["simply_supported", "cantilever", "fixed"] = Field(default="simply_supported")
    beam_length_m: float = Field(default=4.0, ge=0.5, le=20.0)
    point_load_kn: float = Field(default=20.0, ge=0.0, le=500.0)
    udl_kn_m: float = Field(default=5.0, ge=0.0, le=100.0)
    youngs_modulus_gpa: float = Field(default=200.0, ge=10.0, le=400.0)
    moment_of_inertia_cm4: float = Field(default=4500.0, ge=10.0, le=100000.0)

class BeamBendingOutput(BaseModel):
    max_bending_moment_knm: float
    max_shear_force_kn: float
    max_deflection_mm: float
    reaction_a_kn: float
    reaction_b_kn: float
    telemetry: Dict[str, Any]

class BeamBendingEngine(BaseSimulationEngine):
    name = "beam-bending"

    def calculate(self, params: BeamBendingInput) -> BeamBendingOutput:
        l = params.beam_length_m
        p = params.point_load_kn
        w = params.udl_kn_m
        e_mpa = params.youngs_modulus_gpa * 1000.0
        i_mm4 = params.moment_of_inertia_cm4 * 10000.0

        if params.support_type == "simply_supported":
            ra = (p / 2.0) + (w * l / 2.0)
            rb = ra
            max_m = (p * l / 4.0) + (w * (l ** 2) / 8.0)
            max_v = ra
            # Deflection at center in mm
            # (P * L^3 / 48EI) + (5 * w * L^4 / 384EI)
            l_mm = l * 1000.0
            p_n = p * 1000.0
            w_n_mm = w  # N/mm
            delta = (p_n * (l_mm ** 3)) / (48.0 * e_mpa * i_mm4) + (5.0 * w_n_mm * (l_mm ** 4)) / (384.0 * e_mpa * i_mm4)
        elif params.support_type == "cantilever":
            ra = p + (w * l)
            rb = 0.0
            max_m = (p * l) + (w * (l ** 2) / 2.0)
            max_v = ra
            l_mm = l * 1000.0
            p_n = p * 1000.0
            w_n_mm = w
            delta = (p_n * (l_mm ** 3)) / (3.0 * e_mpa * i_mm4) + (w_n_mm * (l_mm ** 4)) / (8.0 * e_mpa * i_mm4)
        else: # Fixed
            ra = (p / 2.0) + (w * l / 2.0)
            rb = ra
            max_m = (p * l / 8.0) + (w * (l ** 2) / 12.0)
            max_v = ra
            l_mm = l * 1000.0
            p_n = p * 1000.0
            w_n_mm = w
            delta = (p_n * (l_mm ** 3)) / (192.0 * e_mpa * i_mm4) + (w_n_mm * (l_mm ** 4)) / (384.0 * e_mpa * i_mm4)

        return BeamBendingOutput(
            max_bending_moment_knm=round(max_m, 2),
            max_shear_force_kn=round(max_v, 2),
            max_deflection_mm=round(delta, 3),
            reaction_a_kn=round(ra, 2),
            reaction_b_kn=round(rb, 2),
            telemetry={"max_moment_knm": max_m, "max_deflection_mm": delta}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_simply_supported": {"support_type": "simply_supported", "beam_length_m": 4.0, "point_load_kn": 20.0, "udl_kn_m": 5.0}
        }


# ── 3. Shaft Torsion Engine ──────────────────────────────────────────────────
class ShaftTorsionInput(BaseModel):
    shaft_type: Literal["solid", "hollow"] = Field(default="solid")
    outer_diameter_mm: float = Field(default=50.0, ge=5.0, le=500.0)
    inner_diameter_mm: float = Field(default=0.0, ge=0.0, le=450.0)
    shaft_length_m: float = Field(default=1.5, ge=0.1, le=20.0)
    applied_torque_nm: float = Field(default=1200.0, ge=1.0, le=100000.0)
    rpm: float = Field(default=1500.0, ge=1.0, le=10000.0)
    shear_modulus_gpa: float = Field(default=79.3, ge=10.0, le=200.0)

class ShaftTorsionOutput(BaseModel):
    polar_moment_j_mm4: float
    max_shear_stress_mpa: float
    angle_of_twist_deg: float
    transmitted_power_kw: float
    telemetry: Dict[str, Any]

class ShaftTorsionEngine(BaseSimulationEngine):
    name = "shaft-torsion"

    def calculate(self, params: ShaftTorsionInput) -> ShaftTorsionOutput:
        do = params.outer_diameter_mm
        di = params.inner_diameter_mm if params.shaft_type == "hollow" else 0.0
        j_mm4 = (math.pi / 32.0) * (do**4 - di**4)
        t_nmm = params.applied_torque_nm * 1000.0
        tau_mpa = (t_nmm * (do / 2.0)) / j_mm4
        g_mpa = params.shear_modulus_gpa * 1000.0
        l_mm = params.shaft_length_m * 1000.0
        theta_rad = (t_nmm * l_mm) / (g_mpa * j_mm4)
        theta_deg = math.degrees(theta_rad)
        power_kw = (2.0 * math.pi * params.rpm * params.applied_torque_nm) / 60000.0

        return ShaftTorsionOutput(
            polar_moment_j_mm4=round(j_mm4, 1),
            max_shear_stress_mpa=round(tau_mpa, 2),
            angle_of_twist_deg=round(theta_deg, 3),
            transmitted_power_kw=round(power_kw, 2),
            telemetry={"shear_stress_mpa": tau_mpa, "twist_deg": theta_deg, "power_kw": power_kw}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "solid_drive_shaft": {"shaft_type": "solid", "outer_diameter_mm": 50.0, "applied_torque_nm": 1200.0}
        }


# ── 4. Column Buckling Engine ────────────────────────────────────────────────
class ColumnBucklingInput(BaseModel):
    end_condition: Literal["pinned_pinned", "fixed_fixed", "fixed_free", "fixed_pinned"] = Field(default="pinned_pinned")
    column_length_m: float = Field(default=3.0, ge=0.5, le=20.0)
    cross_section_type: Literal["rectangular", "circular"] = Field(default="rectangular")
    width_mm: float = Field(default=80.0, ge=10.0, le=500.0)
    depth_mm: float = Field(default=120.0, ge=10.0, le=500.0)
    diameter_mm: float = Field(default=100.0, ge=10.0, le=500.0)
    youngs_modulus_gpa: float = Field(default=200.0, ge=10.0, le=400.0)
    yield_strength_mpa: float = Field(default=250.0, ge=50.0, le=1000.0)

class ColumnBucklingOutput(BaseModel):
    effective_length_m: float
    moment_of_inertia_min_cm4: float
    radius_of_gyration_mm: float
    slenderness_ratio: float
    euler_critical_load_kn: float
    rankine_critical_load_kn: float
    critical_stress_mpa: float
    telemetry: Dict[str, Any]

class ColumnBucklingEngine(BaseSimulationEngine):
    name = "column-buckling"

    def calculate(self, params: ColumnBucklingInput) -> ColumnBucklingOutput:
        l = params.column_length_m
        if params.end_condition == "pinned_pinned":
            le = l
        elif params.end_condition == "fixed_fixed":
            le = 0.5 * l
        elif params.end_condition == "fixed_free":
            le = 2.0 * l
        else: # fixed_pinned
            le = 0.707 * l

        if params.cross_section_type == "rectangular":
            area = params.width_mm * params.depth_mm
            i_min = (params.depth_mm * (params.width_mm ** 3)) / 12.0
        else:
            area = (math.pi / 4.0) * (params.diameter_mm ** 2)
            i_min = (math.pi / 64.0) * (params.diameter_mm ** 4)

        k_gyr = math.sqrt(i_min / area)
        slenderness = (le * 1000.0) / k_gyr
        e_mpa = params.youngs_modulus_gpa * 1000.0

        p_euler_n = (math.pi ** 2 * e_mpa * i_min) / ((le * 1000.0) ** 2)
        p_euler_kn = p_euler_n / 1000.0

        # Rankine formula: 1/P_R = 1/P_c + 1/P_E
        p_c_n = params.yield_strength_mpa * area
        p_rankine_n = (p_c_n * p_euler_n) / (p_c_n + p_euler_n)
        p_rankine_kn = p_rankine_n / 1000.0

        sigma_crit = p_euler_n / area

        return ColumnBucklingOutput(
            effective_length_m=round(le, 3),
            moment_of_inertia_min_cm4=round(i_min / 10000.0, 2),
            radius_of_gyration_mm=round(k_gyr, 2),
            slenderness_ratio=round(slenderness, 2),
            euler_critical_load_kn=round(p_euler_kn, 2),
            rankine_critical_load_kn=round(p_rankine_kn, 2),
            critical_stress_mpa=round(sigma_crit, 2),
            telemetry={"slenderness": slenderness, "euler_kn": p_euler_kn, "rankine_kn": p_rankine_kn}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "pinned_column": {"end_condition": "pinned_pinned", "column_length_m": 3.0, "width_mm": 80.0, "depth_mm": 120.0}
        }


# ── 5. Mohr's Circle Engine ──────────────────────────────────────────────────
class MohrsCircleInput(BaseModel):
    sigma_x_mpa: float = Field(default=80.0, ge=-1000.0, le=1000.0)
    sigma_y_mpa: float = Field(default=-40.0, ge=-1000.0, le=1000.0)
    tau_xy_mpa: float = Field(default=35.0, ge=-1000.0, le=1000.0)
    arbitrary_theta_deg: float = Field(default=30.0, ge=-180.0, le=180.0)

class MohrsCircleOutput(BaseModel):
    center_sigma_avg_mpa: float
    radius_r_mpa: float
    principal_stress_1_mpa: float
    principal_stress_2_mpa: float
    max_in_plane_shear_mpa: float
    theta_p1_deg: float
    theta_s1_deg: float
    transformed_sigma_x_prime_mpa: float
    transformed_tau_x_prime_y_prime_mpa: float
    telemetry: Dict[str, Any]

class MohrsCircleEngine(BaseSimulationEngine):
    name = "mohrs-circle"

    def calculate(self, params: MohrsCircleInput) -> MohrsCircleOutput:
        sx = params.sigma_x_mpa
        sy = params.sigma_y_mpa
        txy = params.tau_xy_mpa

        s_avg = (sx + sy) / 2.0
        r = math.sqrt(((sx - sy) / 2.0) ** 2 + txy ** 2)

        s1 = s_avg + r
        s2 = s_avg - r
        max_tau = r

        theta_p1 = 0.5 * math.degrees(math.atan2(2.0 * txy, sx - sy))
        theta_s1 = theta_p1 + 45.0

        rad = math.radians(params.arbitrary_theta_deg)
        sx_prime = s_avg + ((sx - sy) / 2.0) * math.cos(2.0 * rad) + txy * math.sin(2.0 * rad)
        txy_prime = -((sx - sy) / 2.0) * math.sin(2.0 * rad) + txy * math.cos(2.0 * rad)

        return MohrsCircleOutput(
            center_sigma_avg_mpa=round(s_avg, 2),
            radius_r_mpa=round(r, 2),
            principal_stress_1_mpa=round(s1, 2),
            principal_stress_2_mpa=round(s2, 2),
            max_in_plane_shear_mpa=round(max_tau, 2),
            theta_p1_deg=round(theta_p1, 2),
            theta_s1_deg=round(theta_s1, 2),
            transformed_sigma_x_prime_mpa=round(sx_prime, 2),
            transformed_tau_x_prime_y_prime_mpa=round(txy_prime, 2),
            telemetry={"s1": s1, "s2": s2, "max_shear": max_tau, "center": s_avg, "radius": r}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "biaxial_shear": {"sigma_x_mpa": 80.0, "sigma_y_mpa": -40.0, "tau_xy_mpa": 35.0}
        }


# ── 6. Stress Concentration Engine ───────────────────────────────────────────
class StressConcentrationInput(BaseModel):
    discontinuity_type: Literal["hole_in_plate", "shoulder_fillet_shaft", "transverse_groove"] = Field(default="hole_in_plate")
    plate_width_mm: float = Field(default=100.0, ge=10.0, le=1000.0)
    hole_diameter_mm: float = Field(default=20.0, ge=1.0, le=500.0)
    notch_sensitivity_q: float = Field(default=0.85, ge=0.0, le=1.0)

class StressConcentrationOutput(BaseModel):
    theoretical_kt: float
    fatigue_kf: float
    nominal_net_stress_mpa: float
    peak_stress_mpa: float
    telemetry: Dict[str, Any]

class StressConcentrationEngine(BaseSimulationEngine):
    name = "stress-concentration"

    def calculate(self, params: StressConcentrationInput) -> StressConcentrationOutput:
        d_w = params.hole_diameter_mm / params.plate_width_mm
        # Howland formula for hole in plate: Kt = 3.0 - 3.13*(d/w) + 3.66*(d/w)^2 - 1.53*(d/w)^3
        kt = 3.0 - 3.13 * d_w + 3.66 * (d_w ** 2) - 1.53 * (d_w ** 3)
        kf = 1.0 + params.notch_sensitivity_q * (kt - 1.0)
        nominal_stress = 50.0  # reference nominal
        peak_stress = nominal_stress * kt

        return StressConcentrationOutput(
            theoretical_kt=round(kt, 3),
            fatigue_kf=round(kf, 3),
            nominal_net_stress_mpa=round(nominal_stress, 2),
            peak_stress_mpa=round(peak_stress, 2),
            telemetry={"kt": kt, "kf": kf, "peak_stress": peak_stress}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"standard_hole": {"plate_width_mm": 100.0, "hole_diameter_mm": 20.0}}


# ── 7. Pressure Vessel Engine ────────────────────────────────────────────────
class PressureVesselInput(BaseModel):
    vessel_category: Literal["thin_cylinder", "thin_sphere", "thick_cylinder"] = Field(default="thin_cylinder")
    internal_pressure_bar: float = Field(default=20.0, ge=0.5, le=1000.0)
    inner_diameter_mm: float = Field(default=400.0, ge=50.0, le=5000.0)
    wall_thickness_mm: float = Field(default=10.0, ge=1.0, le=200.0)
    joint_efficiency_eta: float = Field(default=0.85, ge=0.5, le=1.0)

class PressureVesselOutput(BaseModel):
    hoop_stress_mpa: float
    longitudinal_stress_mpa: float
    max_shear_stress_mpa: float
    volumetric_strain: float
    telemetry: Dict[str, Any]

class PressureVesselEngine(BaseSimulationEngine):
    name = "pressure-vessel"

    def calculate(self, params: PressureVesselInput) -> PressureVesselOutput:
        p_mpa = params.internal_pressure_bar * 0.1
        d = params.inner_diameter_mm
        t = params.wall_thickness_mm

        hoop = (p_mpa * d) / (2.0 * t)
        longit = (p_mpa * d) / (4.0 * t)
        max_tau = (hoop - 0.0) / 2.0
        vol_strain = (p_mpa * d / (4.0 * t * 200000.0)) * (5.0 - 4.0 * 0.3)

        return PressureVesselOutput(
            hoop_stress_mpa=round(hoop, 2),
            longitudinal_stress_mpa=round(longit, 2),
            max_shear_stress_mpa=round(max_tau, 2),
            volumetric_strain=round(vol_strain, 7),
            telemetry={"hoop_stress_mpa": hoop, "longitudinal_stress_mpa": longit}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"air_receiver": {"internal_pressure_bar": 20.0, "inner_diameter_mm": 400.0, "wall_thickness_mm": 10.0}}


# ── 8. Spring Design Engine ──────────────────────────────────────────────────
class SpringDesignInput(BaseModel):
    applied_load_n: float = Field(default=800.0, ge=1.0, le=100000.0)
    wire_diameter_mm: float = Field(default=6.0, ge=0.5, le=50.0)
    mean_coil_diameter_mm: float = Field(default=48.0, ge=3.0, le=300.0)
    active_coils: int = Field(default=8, ge=2, le=50)
    shear_modulus_gpa: float = Field(default=79.3, ge=10.0, le=120.0)

class SpringDesignOutput(BaseModel):
    spring_index_c: float
    wahl_factor_kw: float
    max_shear_stress_mpa: float
    deflection_mm: float
    spring_rate_n_mm: float
    solid_length_mm: float
    free_length_mm: float
    telemetry: Dict[str, Any]

class SpringDesignEngine(BaseSimulationEngine):
    name = "spring-design"

    def calculate(self, params: SpringDesignInput) -> SpringDesignOutput:
        d = params.wire_diameter_mm
        D = params.mean_coil_diameter_mm
        n = params.active_coils
        p = params.applied_load_n
        g = params.shear_modulus_gpa * 1000.0

        c = D / d
        kw = ((4.0 * c - 1.0) / (4.0 * c - 4.0)) + (0.615 / c)
        tau = kw * (8.0 * p * D) / (math.pi * (d ** 3))
        delta = (8.0 * p * (D ** 3) * n) / (g * (d ** 4))
        rate = p / delta
        solid_l = (n + 2) * d
        free_l = solid_l + delta + (0.15 * delta)

        return SpringDesignOutput(
            spring_index_c=round(c, 2),
            wahl_factor_kw=round(kw, 3),
            max_shear_stress_mpa=round(tau, 2),
            deflection_mm=round(delta, 2),
            spring_rate_n_mm=round(rate, 2),
            solid_length_mm=round(solid_l, 1),
            free_length_mm=round(free_l, 1),
            telemetry={"spring_index": c, "wahl_factor": kw, "deflection_mm": delta, "rate_n_mm": rate}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"helical_compression": {"applied_load_n": 800.0, "wire_diameter_mm": 6.0, "mean_coil_diameter_mm": 48.0, "active_coils": 8}}


# ── 9. Bolted Joint Engine ───────────────────────────────────────────────────
class BoltedJointInput(BaseModel):
    bolt_nominal_dia_mm: float = Field(default=16.0, ge=3.0, le=64.0)
    property_class: str = Field(default="8.8")
    applied_tensile_kn: float = Field(default=35.0, ge=0.1, le=500.0)
    torque_coefficient_k: float = Field(default=0.20, ge=0.1, le=0.35)

class BoltedJointOutput(BaseModel):
    proof_strength_mpa: float
    preload_force_kn: float
    remaining_clamping_kn: float
    bolt_tensile_stress_mpa: float
    tightening_torque_nm: float
    telemetry: Dict[str, Any]

class BoltedJointEngine(BaseSimulationEngine):
    name = "bolted-joint"

    def calculate(self, params: BoltedJointInput) -> BoltedJointOutput:
        d = params.bolt_nominal_dia_mm
        area_tensile = 0.7854 * ((d - 0.9382 * 2.0) ** 2)
        sp_mpa = 580.0 if params.property_class == "8.8" else 830.0
        fi_kn = (0.75 * sp_mpa * area_tensile) / 1000.0
        # Joint stiffness factor C approx 0.25
        c_joint = 0.25
        clamping_kn = fi_kn - (1.0 - c_joint) * params.applied_tensile_kn
        total_bolt_load_kn = fi_kn + c_joint * params.applied_tensile_kn
        sigma_b = (total_bolt_load_kn * 1000.0) / area_tensile
        torque_nm = params.torque_coefficient_k * (fi_kn * 1000.0) * (d / 1000.0)

        return BoltedJointOutput(
            proof_strength_mpa=round(sp_mpa, 1),
            preload_force_kn=round(fi_kn, 2),
            remaining_clamping_kn=round(clamping_kn, 2),
            bolt_tensile_stress_mpa=round(sigma_b, 2),
            tightening_torque_nm=round(torque_nm, 2),
            telemetry={"preload_kn": fi_kn, "torque_nm": torque_nm, "clamping_kn": clamping_kn}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"m16_grade88": {"bolt_nominal_dia_mm": 16.0, "applied_tensile_kn": 35.0}}


# ── 10. Riveted Joints Engine ────────────────────────────────────────────────
class RivetedJointsInput(BaseModel):
    joint_type: Literal["lap_single_rivet", "butt_single_strap", "butt_double_strap"] = Field(default="butt_double_strap")
    plate_thickness_mm: float = Field(default=12.0, ge=2.0, le=50.0)
    rivet_diameter_mm: float = Field(default=22.0, ge=5.0, le=50.0)
    pitch_distance_mm: float = Field(default=70.0, ge=20.0, le=200.0)
    permissible_tensile_mpa: float = Field(default=120.0, ge=50.0, le=300.0)
    permissible_shear_mpa: float = Field(default=95.0, ge=40.0, le=250.0)
    permissible_crushing_mpa: float = Field(default=160.0, ge=80.0, le=400.0)

class RivetedJointsOutput(BaseModel):
    solid_plate_strength_kn: float
    plate_tearing_strength_kn: float
    rivet_shearing_strength_kn: float
    rivet_crushing_strength_kn: float
    joint_efficiency_pct: float
    governing_mode: str
    telemetry: Dict[str, Any]

class RivetedJointsEngine(BaseSimulationEngine):
    name = "riveted-joints"

    def calculate(self, params: RivetedJointsInput) -> RivetedJointsOutput:
        p = params.pitch_distance_mm
        t = params.plate_thickness_mm
        d = params.rivet_diameter_mm
        st = params.permissible_tensile_mpa
        tau = params.permissible_shear_mpa
        sc = params.permissible_crushing_mpa

        p_solid = (p * t * st) / 1000.0
        p_tear = ((p - d) * t * st) / 1000.0

        n_rivets = 2 if params.joint_type == "butt_double_strap" else 1
        n_shear_planes = 2 if params.joint_type == "butt_double_strap" else 1
        p_shear = (n_rivets * n_shear_planes * (math.pi / 4.0) * (d ** 2) * tau) / 1000.0
        p_crush = (n_rivets * d * t * sc) / 1000.0

        p_joint = min(p_tear, p_shear, p_crush)
        eff = (p_joint / p_solid) * 100.0

        if p_joint == p_tear:
            mode = "Plate Tearing"
        elif p_joint == p_shear:
            mode = "Rivet Shearing"
        else:
            mode = "Rivet Crushing"

        return RivetedJointsOutput(
            solid_plate_strength_kn=round(p_solid, 2),
            plate_tearing_strength_kn=round(p_tear, 2),
            rivet_shearing_strength_kn=round(p_shear, 2),
            rivet_crushing_strength_kn=round(p_crush, 2),
            joint_efficiency_pct=round(eff, 2),
            governing_mode=mode,
            telemetry={"efficiency": eff, "mode": mode, "solid_kn": p_solid}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"boiler_butt_joint": {"joint_type": "butt_double_strap", "plate_thickness_mm": 12.0, "rivet_diameter_mm": 22.0, "pitch_distance_mm": 70.0}}


# ── 11. Weld Strength Engine ─────────────────────────────────────────────────
class WeldStrengthInput(BaseModel):
    weld_type: Literal["single_transverse_fillet", "double_transverse_fillet", "double_parallel_fillet", "butt_weld"] = Field(default="double_parallel_fillet")
    weld_size_mm: float = Field(default=8.0, ge=1.0, le=40.0)
    weld_length_mm: float = Field(default=100.0, ge=10.0, le=1000.0)
    applied_force_kn: float = Field(default=60.0, ge=0.5, le=500.0)
    allowable_shear_mpa: float = Field(default=95.0, ge=30.0, le=200.0)

class WeldStrengthOutput(BaseModel):
    throat_thickness_mm: float
    effective_throat_area_mm2: float
    allowable_load_kn: float
    actual_shear_stress_mpa: float
    weld_safety_factor: float
    telemetry: Dict[str, Any]

class WeldStrengthEngine(BaseSimulationEngine):
    name = "weld-strength"

    def calculate(self, params: WeldStrengthInput) -> WeldStrengthOutput:
        s = params.weld_size_mm
        l = params.weld_length_mm
        throat = 0.7071 * s

        n_welds = 2 if "double" in params.weld_type else 1
        area = n_welds * throat * l
        p_allow_kn = (area * params.allowable_shear_mpa) / 1000.0
        actual_stress = (params.applied_force_kn * 1000.0) / area
        fos = params.allowable_shear_mpa / actual_stress if actual_stress > 0 else 99.0

        return WeldStrengthOutput(
            throat_thickness_mm=round(throat, 3),
            effective_throat_area_mm2=round(area, 1),
            allowable_load_kn=round(p_allow_kn, 2),
            actual_shear_stress_mpa=round(actual_stress, 2),
            weld_safety_factor=round(fos, 2),
            telemetry={"throat_mm": throat, "fos": fos, "allowable_kn": p_allow_kn}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"fillet_bracket": {"weld_type": "double_parallel_fillet", "weld_size_mm": 8.0, "weld_length_mm": 100.0, "applied_force_kn": 60.0}}


# ── 12. Bearing Selection Engine ─────────────────────────────────────────────
class BearingSelectionInput(BaseModel):
    bearing_type: Literal["ball_bearing", "roller_bearing"] = Field(default="ball_bearing")
    radial_load_kn: float = Field(default=8.0, ge=0.5, le=500.0)
    axial_load_kn: float = Field(default=3.0, ge=0.0, le=500.0)
    dynamic_load_rating_c_kn: float = Field(default=32.5, ge=1.0, le=1000.0)
    shaft_speed_rpm: float = Field(default=1440.0, ge=10.0, le=20000.0)

class BearingSelectionOutput(BaseModel):
    equivalent_radial_load_kn: float
    rating_life_l10_mr: float
    rating_life_hours_l10h: float
    telemetry: Dict[str, Any]

class BearingEngine(BaseSimulationEngine):
    name = "bearing-selection"

    def calculate(self, params: BearingSelectionInput) -> BearingSelectionOutput:
        x = 0.56
        y = 1.45
        pe = (x * params.radial_load_kn) + (y * params.axial_load_kn)
        p_exponent = 3.0 if params.bearing_type == "ball_bearing" else (10.0 / 3.0)
        l10_mr = (params.dynamic_load_rating_c_kn / pe) ** p_exponent
        l10_hours = (l10_mr * 1e6) / (60.0 * params.shaft_speed_rpm)

        return BearingSelectionOutput(
            equivalent_radial_load_kn=round(pe, 2),
            rating_life_l10_mr=round(l10_mr, 2),
            rating_life_hours_l10h=round(l10_hours, 1),
            telemetry={"pe_kn": pe, "l10_mr": l10_mr, "l10_hours": l10_hours}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"electric_motor_bearing": {"bearing_type": "ball_bearing", "radial_load_kn": 8.0, "axial_load_kn": 3.0, "dynamic_load_rating_c_kn": 32.5}}


# ── 13. Gear Strength Engine ─────────────────────────────────────────────────
class GearStrengthInput(BaseModel):
    module_mm: float = Field(default=4.0, ge=0.5, le=30.0)
    pinion_teeth: int = Field(default=20, ge=10, le=120)
    gear_teeth: int = Field(default=60, ge=12, le=300)
    face_width_mm: float = Field(default=40.0, ge=5.0, le=200.0)
    transmitted_power_kw: float = Field(default=15.0, ge=0.1, le=500.0)
    pinion_rpm: float = Field(default=1440.0, ge=10.0, le=10000.0)
    allowable_bending_stress_mpa: float = Field(default=140.0, ge=30.0, le=500.0)

class GearStrengthOutput(BaseModel):
    pitch_diameter_mm: float
    tangential_tooth_load_n: float
    lewis_beam_strength_n: float
    bending_safety_factor: float
    telemetry: Dict[str, Any]

class GearStrengthEngine(BaseSimulationEngine):
    name = "gear-strength"

    def calculate(self, params: GearStrengthInput) -> GearStrengthOutput:
        dp = params.module_mm * params.pinion_teeth
        torque_nm = (params.transmitted_power_kw * 1000.0 * 60.0) / (2.0 * math.pi * params.pinion_rpm)
        ft = (2.0 * torque_nm * 1000.0) / dp
        y_form = 0.154 - (0.912 / params.pinion_teeth)
        # Lewis beam strength Fb = sigma_b * b * pc * y = sigma_b * b * (pi * m) * y
        fb = params.allowable_bending_stress_mpa * params.face_width_mm * (math.pi * params.module_mm) * y_form
        fos = fb / ft if ft > 0 else 99.0

        return GearStrengthOutput(
            pitch_diameter_mm=round(dp, 2),
            tangential_tooth_load_n=round(ft, 2),
            lewis_beam_strength_n=round(fb, 2),
            bending_safety_factor=round(fos, 2),
            telemetry={"dp": dp, "ft": ft, "fb": fb, "fos": fos}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"standard_spur": {"module_mm": 4.0, "pinion_teeth": 20, "gear_teeth": 60, "face_width_mm": 40.0}}


# ── 14. Power Screw Engine ───────────────────────────────────────────────────
class PowerScrewInput(BaseModel):
    thread_profile: Literal["square_thread", "acme_thread", "buttress_thread"] = Field(default="square_thread")
    nominal_diameter_mm: float = Field(default=40.0, ge=10.0, le=200.0)
    pitch_mm: float = Field(default=7.0, ge=1.0, le=30.0)
    axial_load_kn: float = Field(default=20.0, ge=0.5, le=500.0)
    friction_coefficient: float = Field(default=0.15, ge=0.01, le=0.4)

class PowerScrewOutput(BaseModel):
    mean_diameter_mm: float
    helix_angle_deg: float
    friction_angle_deg: float
    torque_to_raise_nm: float
    torque_to_lower_nm: float
    efficiency_pct: float
    is_self_locking: bool
    telemetry: Dict[str, Any]

class PowerScrewEngine(BaseSimulationEngine):
    name = "power-screw"

    def calculate(self, params: PowerScrewInput) -> PowerScrewOutput:
        dm = params.nominal_diameter_mm - (params.pitch_mm / 2.0)
        alpha = math.atan(params.pitch_mm / (math.pi * dm))
        phi = math.atan(params.friction_coefficient)
        w = params.axial_load_kn * 1000.0

        t_raise = (w * (dm / 2000.0)) * math.tan(phi + alpha)
        t_lower = (w * (dm / 2000.0)) * math.tan(phi - alpha)
        eff = (math.tan(alpha) / math.tan(phi + alpha)) * 100.0
        self_locking = phi > alpha

        return PowerScrewOutput(
            mean_diameter_mm=round(dm, 2),
            helix_angle_deg=round(math.degrees(alpha), 2),
            friction_angle_deg=round(math.degrees(phi), 2),
            torque_to_raise_nm=round(t_raise, 2),
            torque_to_lower_nm=round(max(0.0, t_lower), 2),
            efficiency_pct=round(eff, 2),
            is_self_locking=self_locking,
            telemetry={"t_raise": t_raise, "t_lower": t_lower, "self_locking": self_locking}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"screw_jack": {"thread_profile": "square_thread", "nominal_diameter_mm": 40.0, "pitch_mm": 7.0, "axial_load_kn": 20.0}}


# ── 15. Fatigue Life Engine ──────────────────────────────────────────────────
class FatigueLifeInput(BaseModel):
    ultimate_strength_mpa: float = Field(default=600.0, ge=100.0, le=2500.0)
    yield_strength_mpa: float = Field(default=400.0, ge=80.0, le=2000.0)
    max_cyclic_stress_mpa: float = Field(default=250.0, ge=10.0, le=1500.0)
    min_cyclic_stress_mpa: float = Field(default=50.0, ge=-1000.0, le=1000.0)

class FatigueLifeOutput(BaseModel):
    stress_amplitude_sigma_a_mpa: float
    mean_stress_sigma_m_mpa: float
    stress_ratio_r: float
    endurance_limit_se_mpa: float
    goodman_safety_factor: float
    soderberg_safety_factor: float
    gerber_safety_factor: float
    telemetry: Dict[str, Any]

class FatigueLifeEngine(BaseSimulationEngine):
    name = "fatigue-life"

    def calculate(self, params: FatigueLifeInput) -> FatigueLifeOutput:
        smax = params.max_cyclic_stress_mpa
        smin = params.min_cyclic_stress_mpa
        sa = (smax - smin) / 2.0
        sm = (smax + smin) / 2.0
        r_ratio = smin / smax if smax != 0 else 0.0

        se = 0.5 * params.ultimate_strength_mpa
        fos_goodman = 1.0 / ((sa / se) + (sm / params.ultimate_strength_mpa))
        fos_soderberg = 1.0 / ((sa / se) + (sm / params.yield_strength_mpa))
        fos_gerber = 1.0 / ((sa / se) + ((sm / params.ultimate_strength_mpa) ** 2))

        return FatigueLifeOutput(
            stress_amplitude_sigma_a_mpa=round(sa, 2),
            mean_stress_sigma_m_mpa=round(sm, 2),
            stress_ratio_r=round(r_ratio, 3),
            endurance_limit_se_mpa=round(se, 2),
            goodman_safety_factor=round(max(0.0, fos_goodman), 2),
            soderberg_safety_factor=round(max(0.0, fos_soderberg), 2),
            gerber_safety_factor=round(max(0.0, fos_gerber), 2),
            telemetry={"sa": sa, "sm": sm, "fos_goodman": fos_goodman}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"fluctuating_shaft": {"ultimate_strength_mpa": 600.0, "yield_strength_mpa": 400.0, "max_cyclic_stress_mpa": 250.0, "min_cyclic_stress_mpa": 50.0}}


# ── 16. Crack Propagation Engine ─────────────────────────────────────────────
class CrackPropagationInput(BaseModel):
    initial_crack_size_mm: float = Field(default=2.0, ge=0.1, le=50.0)
    fracture_toughness_mpam: float = Field(default=50.0, ge=5.0, le=200.0)
    max_stress_mpa: float = Field(default=150.0, ge=10.0, le=1000.0)
    min_stress_mpa: float = Field(default=0.0, ge=0.0, le=500.0)
    paris_constant_c: float = Field(default=1e-11)
    paris_exponent_m: float = Field(default=3.0)

class CrackPropagationOutput(BaseModel):
    stress_intensity_ki_mpam: float
    critical_crack_size_mm: float
    cycles_to_failure_nf: float
    telemetry: Dict[str, Any]

class CrackPropagationEngine(BaseSimulationEngine):
    name = "crack-propagation"

    def calculate(self, params: CrackPropagationInput) -> CrackPropagationOutput:
        a0 = params.initial_crack_size_mm / 1000.0
        smax = params.max_stress_mpa
        smin = params.min_stress_mpa
        ds = smax - smin

        ki = 1.12 * smax * math.sqrt(math.pi * a0)
        # Critical crack ac = (K_Ic / (1.12 * smax))^2 / pi
        ac = ((params.fracture_toughness_mpam / (1.12 * smax)) ** 2) / math.pi
        ac_mm = ac * 1000.0

        # Paris Law integration
        m = params.paris_exponent_m
        c = params.paris_constant_c
        factor = (c * ((1.12 * ds * math.sqrt(math.pi)) ** m))
        if m == 2:
            nf = math.log(ac / a0) / factor
        else:
            nf = (1.0 / factor) * (1.0 / (1.0 - m / 2.0)) * ((ac ** (1.0 - m / 2.0)) - (a0 ** (1.0 - m / 2.0)))

        return CrackPropagationOutput(
            stress_intensity_ki_mpam=round(ki, 2),
            critical_crack_size_mm=round(ac_mm, 2),
            cycles_to_failure_nf=round(max(100.0, nf), 0),
            telemetry={"ki": ki, "ac_mm": ac_mm, "nf": nf}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"edge_crack_plate": {"initial_crack_size_mm": 2.0, "fracture_toughness_mpam": 50.0, "max_stress_mpa": 150.0}}


# ── 17. Cross Section Properties Engine ──────────────────────────────────────
class CrossSectionPropsInput(BaseModel):
    section_type: Literal["i_beam", "t_section", "channel", "rectangle", "circle", "hollow_circle"] = Field(default="i_beam")
    overall_height_mm: float = Field(default=200.0, ge=10.0, le=1000.0)
    flange_width_mm: float = Field(default=100.0, ge=10.0, le=1000.0)
    web_thickness_mm: float = Field(default=8.0, ge=1.0, le=100.0)
    flange_thickness_mm: float = Field(default=10.0, ge=1.0, le=100.0)

class CrossSectionPropsOutput(BaseModel):
    area_mm2: float
    moment_of_inertia_ix_cm4: float
    moment_of_inertia_iy_cm4: float
    section_modulus_zx_cm3: float
    radius_of_gyration_kx_cm: float
    telemetry: Dict[str, Any]

class CrossSectionPropsEngine(BaseSimulationEngine):
    name = "cross-section-props"

    def calculate(self, params: CrossSectionPropsInput) -> CrossSectionPropsOutput:
        h = params.overall_height_mm
        b = params.flange_width_mm
        tw = params.web_thickness_mm
        tf = params.flange_thickness_mm

        area = (2.0 * b * tf) + ((h - 2.0 * tf) * tw)
        ix = (b * (h ** 3) - (b - tw) * ((h - 2.0 * tf) ** 3)) / 12.0
        iy = (2.0 * tf * (b ** 3) + (h - 2.0 * tf) * (tw ** 3)) / 12.0
        zx = ix / (h / 2.0)
        kx = math.sqrt(ix / area)

        return CrossSectionPropsOutput(
            area_mm2=round(area, 1),
            moment_of_inertia_ix_cm4=round(ix / 10000.0, 2),
            moment_of_inertia_iy_cm4=round(iy / 10000.0, 2),
            section_modulus_zx_cm3=round(zx / 1000.0, 2),
            radius_of_gyration_kx_cm=round(kx / 10.0, 2),
            telemetry={"area": area, "ix_cm4": ix / 10000.0, "zx_cm3": zx / 1000.0}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"is_mb_200": {"section_type": "i_beam", "overall_height_mm": 200.0, "flange_width_mm": 100.0}}


# ── 18. Material Testing Engine ──────────────────────────────────────────────
class MaterialTestingInput(BaseModel):
    test_type: Literal["utm_tensile", "charpy_impact", "brinell_hardness", "rockwell_hardness"] = Field(default="utm_tensile")
    gauge_diameter_mm: float = Field(default=12.5, ge=2.0, le=50.0)
    gauge_length_mm: float = Field(default=50.0, ge=10.0, le=200.0)
    yield_load_kn: float = Field(default=45.0, ge=0.5, le=500.0)
    ultimate_load_kn: float = Field(default=75.0, ge=1.0, le=1000.0)
    fracture_diameter_mm: float = Field(default=8.5, ge=1.0, le=50.0)
    final_gauge_length_mm: float = Field(default=64.0, ge=10.0, le=300.0)

class MaterialTestingOutput(BaseModel):
    yield_strength_mpa: float
    ultimate_strength_mpa: float
    percentage_elongation: float
    percentage_reduction_in_area: float
    brinell_hardness_hbw: float
    telemetry: Dict[str, Any]

class MaterialTestingEngine(BaseSimulationEngine):
    name = "material-testing"

    def calculate(self, params: MaterialTestingInput) -> MaterialTestingOutput:
        a0 = (math.pi / 4.0) * (params.gauge_diameter_mm ** 2)
        af = (math.pi / 4.0) * (params.fracture_diameter_mm ** 2)
        sy = (params.yield_load_kn * 1000.0) / a0
        su = (params.ultimate_load_kn * 1000.0) / a0
        elong = ((params.final_gauge_length_mm - params.gauge_length_mm) / params.gauge_length_mm) * 100.0
        red_area = ((a0 - af) / a0) * 100.0
        hbw = su / 3.45  # Empirical approx HBW ~ Su / 3.45

        return MaterialTestingOutput(
            yield_strength_mpa=round(sy, 2),
            ultimate_strength_mpa=round(su, 2),
            percentage_elongation=round(elong, 1),
            percentage_reduction_in_area=round(red_area, 1),
            brinell_hardness_hbw=round(hbw, 1),
            telemetry={"yield_mpa": sy, "ultimate_mpa": su, "elongation_pct": elong}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"is_2062_steel": {"test_type": "utm_tensile", "gauge_diameter_mm": 12.5, "yield_load_kn": 45.0, "ultimate_load_kn": 75.0}}
