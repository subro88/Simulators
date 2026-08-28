"""
WBSCTE Civil Engineering (CE) 3rd Semester Physics Engines
===========================================================
Syllabus Mapped:
1. CE/SURV/S3: PrismaticCompassTraverseSurveyEngine
2. CE/SURV/S3: DumpyLevelRiseFallLevellingEngine
3. CE/SURV/S3: ContourInterpolationProfileLevellingEngine
4. CE/SURV/S3: TrapezoidalSimpsonEarthworkVolumeEngine
5. CE/SURV/S3: PlaneTableRadiationIntersectionEngine
6. CE/BMC/S3:  VicatCementSettingSoundnessEngine
7. CE/BMC/S3:  BrickMasonryCompressiveWaterAbsorptionEngine
8. CE/BMC/S3:  SandBulkingMoistureContentEngine
9. CE/CT/S3:   ConcreteMixDesignIS10262Engine
10. CE/CT/S3:  ConcreteCompactingFactorVeeBeeEngine
11. CE/CT/S3:  SplitTensileFlexuralConcreteStrengthEngine
12. CE/MOS/S3: ShearForceBendingMomentDiagramsEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Prismatic Compass Traverse Survey Engine ─────────────────────────────
class PrismaticCompassTraverseSurveyInput(BaseModel):
    fore_bearing_wcb_deg: float = Field(default=45.5, ge=0.0, le=360.0)
    back_bearing_wcb_deg: float = Field(default=225.5, ge=0.0, le=360.0)
    magnetic_declination_deg: float = Field(default=2.5, ge=0.0, le=30.0)
    declination_direction: Literal["East (+)", "West (-)"] = "East (+)"


class PrismaticCompassTraverseSurveyOutput(BaseModel):
    reduced_bearing_quadrantal: str
    true_bearing_deg: float
    bearing_difference_error_deg: float
    local_attraction_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PrismaticCompassTraverseSurveyEngine(BaseSimulationEngine):
    name = "prismatic-compass-traverse-survey"
    description = "CE/SURV/S3: Compass Surveying — Whole Circle Bearing (WCB), Reduced Bearing, Magnetic Declination & Local Attraction"

    def calculate(self, params: PrismaticCompassTraverseSurveyInput) -> PrismaticCompassTraverseSurveyOutput:
        fb = params.fore_bearing_wcb_deg
        bb = params.back_bearing_wcb_deg
        dec = params.magnetic_declination_deg

        # Quadrantal / Reduced Bearing (RB)
        if 0.0 <= fb <= 90.0:
            rb_str = f"N {fb:.2f}° E"
        elif 90.0 < fb <= 180.0:
            rb_str = f"S {(180.0 - fb):.2f}° E"
        elif 180.0 < fb <= 270.0:
            rb_str = f"S {(fb - 180.0):.2f}° W"
        else:
            rb_str = f"N {(360.0 - fb):.2f}° W"

        # True Bearing = Magnetic Bearing +/- Declination
        tb = (fb + dec) if params.declination_direction == "East (+)" else (fb - dec)
        tb = (tb + 360.0) % 360.0

        # Check BB - FB = 180
        diff = abs(bb - fb)
        err = abs(diff - 180.0)
        la_status = "FREE FROM LOCAL ATTRACTION (Diff = 180°)" if err < 0.05 else f"AFFECTED BY LOCAL ATTRACTION (Error = {err:.2f}°)"

        telemetry = {
            "fb_wcb": round(fb, 2),
            "bb_wcb": round(bb, 2),
            "rb": rb_str,
            "tb": round(tb, 2),
            "err": round(err, 2),
            "status": la_status
        }

        return PrismaticCompassTraverseSurveyOutput(
            reduced_bearing_quadrantal=rb_str,
            true_bearing_deg=round(tb, 2),
            bearing_difference_error_deg=round(err, 2),
            local_attraction_status=la_status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "line_ab_northeast": {"fore_bearing_wcb_deg": 45.5, "back_bearing_wcb_deg": 225.5, "magnetic_declination_deg": 2.5, "declination_direction": "East (+)"},
            "line_bc_local_attraction": {"fore_bearing_wcb_deg": 122.0, "back_bearing_wcb_deg": 305.5, "magnetic_declination_deg": 1.5, "declination_direction": "West (-)"}
        }


# ── 2. Dumpy Level Rise & Fall Levelling Engine ─────────────────────────────
class DumpyLevelRiseFallLevellingInput(BaseModel):
    benchmark_elevation_m: float = Field(default=100.0, ge=0.0, le=5000.0)
    backsight_reading_m: float = Field(default=1.450, ge=0.1, le=5.0)
    intermediate_sight_reading_m: float = Field(default=1.820, ge=0.1, le=5.0)
    foresight_reading_m: float = Field(default=2.150, ge=0.1, le=5.0)


class DumpyLevelRiseFallLevellingOutput(BaseModel):
    height_of_instrument_hi_m: float
    reduced_level_is_station_m: float
    reduced_level_fs_station_m: float
    rise_fall_check_difference_m: float
    arithmetic_check_passed: bool
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DumpyLevelRiseFallLevellingEngine(BaseSimulationEngine):
    name = "dumpy-level-rise-fall-levelling"
    description = "CE/SURV/S3: Levelling — Height of Instrument (HI) & Rise and Fall Methods with 3-Point Arithmetic Check"

    def calculate(self, params: DumpyLevelRiseFallLevellingInput) -> DumpyLevelRiseFallLevellingOutput:
        bm = params.benchmark_elevation_m
        bs = params.backsight_reading_m
        is_rdg = params.intermediate_sight_reading_m
        fs = params.foresight_reading_m

        # HI Method
        hi = bm + bs
        rl_is = hi - is_rdg
        rl_fs = hi - fs

        # Rise & Fall Method
        delta1 = bs - is_rdg  # Rise if >0, Fall if <0
        delta2 = is_rdg - fs
        net_rise_fall = delta1 + delta2

        # Arithmetic check: sum(BS) - sum(FS) == Last_RL - First_RL
        lhs = bs - fs
        rhs = rl_fs - bm
        chk_diff = abs(lhs - rhs)
        passed = chk_diff < 0.001

        telemetry = {
            "hi": round(hi, 3),
            "rl_is": round(rl_is, 3),
            "rl_fs": round(rl_fs, 3),
            "delta1": round(delta1, 3),
            "delta2": round(delta2, 3),
            "chk_diff": round(chk_diff, 4)
        }

        return DumpyLevelRiseFallLevellingOutput(
            height_of_instrument_hi_m=round(hi, 3),
            reduced_level_is_station_m=round(rl_is, 3),
            reduced_level_fs_station_m=round(rl_fs, 3),
            rise_fall_check_difference_m=round(chk_diff, 4),
            arithmetic_check_passed=passed,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_benchmark_100m": {"benchmark_elevation_m": 100.0, "backsight_reading_m": 1.450, "intermediate_sight_reading_m": 1.820, "foresight_reading_m": 2.150},
            "fly_levelling_steep_slope": {"benchmark_elevation_m": 250.0, "backsight_reading_m": 0.850, "intermediate_sight_reading_m": 2.100, "foresight_reading_m": 3.450}
        }


# ── 3. Contour Interpolation & Profile Levelling Engine ─────────────────────
class ContourInterpolationProfileLevellingInput(BaseModel):
    point_a_elevation_m: float = Field(default=102.5, ge=0.0, le=5000.0)
    point_b_elevation_m: float = Field(default=107.0, ge=0.0, le=5000.0)
    horizontal_distance_ab_m: float = Field(default=45.0, ge=1.0, le=500.0)
    target_contour_elevation_m: float = Field(default=105.0, ge=0.0, le=5000.0)


class ContourInterpolationProfileLevellingOutput(BaseModel):
    ground_slope_gradient_pct: float
    interpolated_distance_from_a_m: float
    contour_interval_m: float
    terrain_slope_classification: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ContourInterpolationProfileLevellingEngine(BaseSimulationEngine):
    name = "contour-interpolation-profile-levelling"
    description = "CE/SURV/S3: Contouring — Contour Interval, Horizontal Equivalent & Arithmetic Interpolation of Contours"

    def calculate(self, params: ContourInterpolationProfileLevellingInput) -> ContourInterpolationProfileLevellingOutput:
        ha = params.point_a_elevation_m
        hb = params.point_b_elevation_m
        d = params.horizontal_distance_ab_m
        hc = params.target_contour_elevation_m

        delta_h = hb - ha
        grad_pct = (delta_h / d) * 100.0

        if abs(delta_h) > 1e-4 and (min(ha, hb) <= hc <= max(ha, hb)):
            dist_x = ((hc - ha) / delta_h) * d
        else:
            dist_x = 0.0

        terrain = "GENTLE SLOPE (< 5%)" if abs(grad_pct) < 5.0 else ("MODERATE SLOPE (5-15%)" if abs(grad_pct) <= 15.0 else "STEEP TERRAIN (> 15%)")

        telemetry = {
            "delta_h": round(delta_h, 2),
            "grad_pct": round(grad_pct, 2),
            "dist_x": round(dist_x, 2),
            "terrain": terrain
        }

        return ContourInterpolationProfileLevellingOutput(
            ground_slope_gradient_pct=round(grad_pct, 2),
            interpolated_distance_from_a_m=round(dist_x, 2),
            contour_interval_m=round(abs(delta_h), 2),
            terrain_slope_classification=terrain,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "contour_105m_interpolation": {"point_a_elevation_m": 102.5, "point_b_elevation_m": 107.0, "horizontal_distance_ab_m": 45.0, "target_contour_elevation_m": 105.0},
            "steep_ridge_contour": {"point_a_elevation_m": 50.0, "point_b_elevation_m": 65.0, "horizontal_distance_ab_m": 30.0, "target_contour_elevation_m": 60.0}
        }


# ── 4. Trapezoidal & Simpson Earthwork Volume Engine ────────────────────────
class TrapezoidalSimpsonEarthworkVolumeInput(BaseModel):
    cross_section_interval_d_m: float = Field(default=20.0, ge=1.0, le=100.0)
    ordinate_offsets_m: List[float] = Field(default=[5.2, 7.8, 9.4, 8.6, 6.1])
    formation_width_b_m: float = Field(default=10.0, ge=3.0, le=30.0)
    side_slope_s: float = Field(default=1.5, ge=0.5, le=3.0)


class TrapezoidalSimpsonEarthworkVolumeOutput(BaseModel):
    trapezoidal_area_m2: float
    simpsons_area_m2: float
    prismoidal_embankment_volume_m3: float
    method_accuracy_comparison: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class TrapezoidalSimpsonEarthworkVolumeEngine(BaseSimulationEngine):
    name = "trapezoidal-simpson-earthwork-volume"
    description = "CE/SURV/S3: Area & Earthwork Computation — Trapezoidal Rule, Simpson's 1/3rd Rule & Prismoidal Volume"

    def calculate(self, params: TrapezoidalSimpsonEarthworkVolumeInput) -> TrapezoidalSimpsonEarthworkVolumeOutput:
        d = params.cross_section_interval_d_m
        o = params.ordinate_offsets_m
        n = len(o)

        # Trapezoidal Rule: A = d * [ (o0 + on)/2 + sum(o1..on-1) ]
        if n >= 2:
            a_trap = d * (((o[0] + o[-1]) / 2.0) + sum(o[1:-1]))
        else:
            a_trap = 0.0

        # Simpson's 1/3rd Rule (requires odd number of ordinates)
        if n >= 3 and n % 2 == 1:
            sum_odd = sum(o[i] for i in range(1, n-1, 2))
            sum_even = sum(o[i] for i in range(2, n-1, 2))
            a_simp = (d / 3.0) * (o[0] + o[-1] + 4.0 * sum_odd + 2.0 * sum_even)
        else:
            a_simp = a_trap

        # Embankment Volume: V = Area * Length
        total_len = (n - 1) * d
        vol_m3 = a_simp * params.formation_width_b_m

        telemetry = {
            "a_trap": round(a_trap, 2),
            "a_simp": round(a_simp, 2),
            "vol_m3": round(vol_m3, 2),
            "len_m": total_len
        }

        return TrapezoidalSimpsonEarthworkVolumeOutput(
            trapezoidal_area_m2=round(a_trap, 2),
            simpsons_area_m2=round(a_simp, 2),
            prismoidal_embankment_volume_m3=round(vol_m3, 2),
            method_accuracy_comparison="Simpson's 1/3rd Rule accounts for parabolic curvature boundaries",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "5_ordinates_cross_section": {"cross_section_interval_d_m": 20.0, "ordinate_offsets_m": [5.2, 7.8, 9.4, 8.6, 6.1], "formation_width_b_m": 10.0, "side_slope_s": 1.5},
            "7_ordinates_highway_cut": {"cross_section_interval_d_m": 15.0, "ordinate_offsets_m": [4.0, 6.5, 8.2, 10.1, 9.0, 7.1, 5.0], "formation_width_b_m": 12.0, "side_slope_s": 2.0}
        }


# ── 5. Plane Table Radiation & Intersection Engine ──────────────────────────
class PlaneTableRadiationIntersectionInput(BaseModel):
    baseline_length_ab_m: float = Field(default=50.0, ge=5.0, le=500.0)
    angle_a_deg: float = Field(default=62.0, ge=5.0, le=170.0)
    angle_b_deg: float = Field(default=48.0, ge=5.0, le=170.0)
    alidade_sighting_method: Literal["Radiation Method (Direct Distance Measured)", "Intersection Method (Triangulated from Baseline)"] = "Intersection Method (Triangulated from Baseline)"


class PlaneTableRadiationIntersectionOutput(BaseModel):
    triangulated_distance_ac_m: float
    triangulated_distance_bc_m: float
    included_apex_angle_c_deg: float
    plotting_scale_ratio: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PlaneTableRadiationIntersectionEngine(BaseSimulationEngine):
    name = "plane-table-radiation-intersection"
    description = "CE/SURV/S3: Plane Table Surveying — Alidade Sight Line Ranging, Radiation & Intersection Methods"

    def calculate(self, params: PlaneTableRadiationIntersectionInput) -> PlaneTableRadiationIntersectionOutput:
        ab = params.baseline_length_ab_m
        ang_a = params.angle_a_deg
        ang_b = params.angle_b_deg

        ang_c = max(1.0, 180.0 - (ang_a + ang_b))

        # Sine rule: AC / sin(B) = BC / sin(A) = AB / sin(C)
        sin_c = math.sin(math.radians(ang_c))
        ac = ab * (math.sin(math.radians(ang_b)) / max(0.01, sin_c))
        bc = ab * (math.sin(math.radians(ang_a)) / max(0.01, sin_c))

        telemetry = {
            "ab_m": ab,
            "ang_c": round(ang_c, 1),
            "ac_m": round(ac, 2),
            "bc_m": round(bc, 2)
        }

        return PlaneTableRadiationIntersectionOutput(
            triangulated_distance_ac_m=round(ac, 2),
            triangulated_distance_bc_m=round(bc, 2),
            included_apex_angle_c_deg=round(ang_c, 1),
            plotting_scale_ratio="1:500 Metric Scale",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "intersection_50m_baseline": {"baseline_length_ab_m": 50.0, "angle_a_deg": 62.0, "angle_b_deg": 48.0, "alidade_sighting_method": "Intersection Method (Triangulated from Baseline)"},
            "river_obstacle_triangulation": {"baseline_length_ab_m": 80.0, "angle_a_deg": 75.0, "angle_b_deg": 55.0, "alidade_sighting_method": "Intersection Method (Triangulated from Baseline)"}
        }


# ── 6. Vicat Cement Setting & Soundness Engine ──────────────────────────────
class VicatCementSettingSoundnessInput(BaseModel):
    water_consistency_percentage_p: float = Field(default=30.0, ge=20.0, le=40.0)
    initial_setting_needle_penetration_mm: float = Field(default=5.0, ge=0.0, le=40.0)
    elapsed_setting_time_minutes: float = Field(default=45.0, ge=5.0, le=720.0)
    le_chatelier_expansion_mm: float = Field(default=2.5, ge=0.1, le=20.0)


class VicatCementSettingSoundnessOutput(BaseModel):
    initial_setting_water_req_pct: float
    soundness_water_req_pct: float
    cement_setting_status: str
    soundness_compliance_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class VicatCementSettingSoundnessEngine(BaseSimulationEngine):
    name = "vicat-cement-setting-soundness"
    description = "CE/BMC/S3: Cement Testing — Vicat Standard Consistency P, Initial/Final Setting Times & Le-Chatelier Soundness"

    def calculate(self, params: VicatCementSettingSoundnessInput) -> VicatCementSettingSoundnessOutput:
        p = params.water_consistency_percentage_p
        w_init = 0.85 * p
        w_sound = 0.78 * p

        t_el = params.elapsed_setting_time_minutes
        pen = params.initial_setting_needle_penetration_mm

        if t_el < 30.0:
            set_status = "INITIAL SETTING TOO FAST (< 30 min IS 269 Failure)"
        elif pen >= 5.0 and t_el >= 30.0:
            set_status = f"INITIAL SETTING PASSED (Time = {t_el:.0f} min > 30 min)"
        elif t_el > 600.0:
            set_status = "FINAL SETTING EXCEEDED (> 600 min Failure)"
        else:
            set_status = f"HARDENING IN PROGRESS ({t_el:.0f} min Elapsed)"

        exp = params.le_chatelier_expansion_mm
        sound_status = "SOUND CEMENT (Expansion < 10 mm IS 269 Standard)" if exp <= 10.0 else "UNSOUND CEMENT (Excess Free Lime Expansion > 10 mm)"

        telemetry = {
            "w_init": round(w_init, 2),
            "w_sound": round(w_sound, 2),
            "t_min": t_el,
            "exp_mm": exp
        }

        return VicatCementSettingSoundnessOutput(
            initial_setting_water_req_pct=round(w_init, 2),
            soundness_water_req_pct=round(w_sound, 2),
            cement_setting_status=set_status,
            soundness_compliance_status=sound_status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "opc_43_grade_standard": {"water_consistency_percentage_p": 30.0, "initial_setting_needle_penetration_mm": 5.0, "elapsed_setting_time_minutes": 45.0, "le_chatelier_expansion_mm": 2.5},
            "rapid_hardening_cement": {"water_consistency_percentage_p": 28.0, "initial_setting_needle_penetration_mm": 6.0, "elapsed_setting_time_minutes": 35.0, "le_chatelier_expansion_mm": 1.8}
        }


# ── 7. Brick Masonry Compressive & Water Absorption Engine ──────────────────
class BrickMasonryCompressiveWaterAbsorptionInput(BaseModel):
    crushing_load_kn: float = Field(default=220.0, ge=20.0, le=1000.0)
    brick_length_mm: float = Field(default=190.0, ge=150.0, le=250.0)
    brick_width_mm: float = Field(default=90.0, ge=70.0, le=130.0)
    dry_weight_kg: float = Field(default=3.10, ge=1.5, le=5.0)
    wet_weight_24hr_kg: float = Field(default=3.52, ge=1.5, le=6.0)


class BrickMasonryCompressiveWaterAbsorptionOutput(BaseModel):
    compressive_strength_mpa: float
    water_absorption_percentage: float
    is1077_brick_class: str
    absorption_compliance_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class BrickMasonryCompressiveWaterAbsorptionEngine(BaseSimulationEngine):
    name = "brick-masonry-compressive-water-absorption"
    description = "CE/BMC/S3: Brick & Masonry — IS 3495 Compressive Strength, 24-hr Water Absorption & Class Grading"

    def calculate(self, params: BrickMasonryCompressiveWaterAbsorptionInput) -> BrickMasonryCompressiveWaterAbsorptionOutput:
        area_mm2 = params.brick_length_mm * params.brick_width_mm
        f_b = (params.crushing_load_kn * 1000.0) / area_mm2

        w_dry = params.dry_weight_kg
        w_wet = params.wet_weight_24hr_kg
        abs_pct = ((w_wet - w_dry) / max(0.1, w_dry)) * 100.0

        if f_b >= 35.0:
            cls_name = "CLASS 35 (Heavy Duty Engineering Brick)"
        elif f_b >= 20.0:
            cls_name = "CLASS 20 (First Class Brick)"
        elif f_b >= 10.0:
            cls_name = "CLASS 10 (Standard Structural Brick)"
        elif f_b >= 7.5:
            cls_name = "CLASS 7.5 (Second Class Brick)"
        elif f_b >= 3.5:
            cls_name = "CLASS 3.5 (Common Building Brick)"
        else:
            cls_name = "SUB-STANDARD (< 3.5 MPa Failure)"

        abs_status = "COMPLIANT (Absorption <= 20% by weight)" if abs_pct <= 20.0 else "NON-COMPLIANT (> 20% Excessive Porosity)"

        telemetry = {
            "fb_mpa": round(f_b, 2),
            "abs_pct": round(abs_pct, 2),
            "cls": cls_name,
            "status": abs_status
        }

        return BrickMasonryCompressiveWaterAbsorptionOutput(
            compressive_strength_mpa=round(f_b, 2),
            water_absorption_percentage=round(abs_pct, 2),
            is1077_brick_class=cls_name,
            absorption_compliance_status=abs_status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "first_class_modular_brick": {"crushing_load_kn": 220.0, "brick_length_mm": 190.0, "brick_width_mm": 90.0, "dry_weight_kg": 3.10, "wet_weight_24hr_kg": 3.52},
            "second_class_brick": {"crushing_load_kn": 135.0, "brick_length_mm": 190.0, "brick_width_mm": 90.0, "dry_weight_kg": 3.00, "wet_weight_24hr_kg": 3.58}
        }


# ── 8. Sand Bulking & Moisture Content Engine ───────────────────────────────
class SandBulkingMoistureContentInput(BaseModel):
    initial_dry_sand_height_mm: float = Field(default=150.0, ge=50.0, le=300.0)
    bulked_damp_sand_height_mm: float = Field(default=185.0, ge=50.0, le=350.0)
    sand_moisture_content_pct: float = Field(default=5.0, ge=0.5, le=15.0)
    fineness_modulus_fm: float = Field(default=2.65, ge=1.5, le=3.8)


class SandBulkingMoistureContentOutput(BaseModel):
    sand_bulking_percentage: float
    batching_volume_correction_factor: float
    is383_sand_zone_classification: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SandBulkingMoistureContentEngine(BaseSimulationEngine):
    name = "sand-bulking-moisture-content"
    description = "CE/BMC/S3: Fine Aggregates — Sand Bulking due to Surface Tension Moisture Films & Sieve Fineness Modulus"

    def calculate(self, params: SandBulkingMoistureContentInput) -> SandBulkingMoistureContentOutput:
        h_dry = params.initial_dry_sand_height_mm
        h_bulk = params.bulked_damp_sand_height_mm

        bulking_pct = ((h_bulk - h_dry) / max(1.0, h_dry)) * 100.0
        corr_factor = 1.0 + (bulking_pct / 100.0)

        fm = params.fineness_modulus_fm
        if fm > 3.0:
            zone = "ZONE I (Coarse Sand: FM = 2.9 - 3.2)"
        elif fm >= 2.6:
            zone = "ZONE II (Medium Sand: FM = 2.6 - 2.9)"
        elif fm >= 2.2:
            zone = "ZONE III (Fine Sand: FM = 2.2 - 2.6)"
        else:
            zone = "ZONE IV (Very Fine Sand: FM < 2.2)"

        telemetry = {
            "bulking_pct": round(bulking_pct, 2),
            "corr": round(corr_factor, 3),
            "zone": zone
        }

        return SandBulkingMoistureContentOutput(
            sand_bulking_percentage=round(bulking_pct, 2),
            batching_volume_correction_factor=round(corr_factor, 3),
            is383_sand_zone_classification=zone,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "medium_sand_5pct_moisture": {"initial_dry_sand_height_mm": 150.0, "bulked_damp_sand_height_mm": 185.0, "sand_moisture_content_pct": 5.0, "fineness_modulus_fm": 2.65},
            "fine_sand_high_bulking": {"initial_dry_sand_height_mm": 150.0, "bulked_damp_sand_height_mm": 198.0, "sand_moisture_content_pct": 6.5, "fineness_modulus_fm": 2.30}
        }


# ── 9. Concrete Mix Design IS 10262 Engine ──────────────────────────────────
class ConcreteMixDesignIS10262Input(BaseModel):
    grade_of_concrete: Literal["M20 (fck = 20 MPa)", "M25 (fck = 25 MPa)", "M30 (fck = 30 MPa)", "M35 (fck = 35 MPa)"] = "M25 (fck = 25 MPa)"
    exposure_condition: Literal["Mild", "Moderate", "Severe", "Very Severe"] = "Moderate"
    maximum_aggregate_size_mm: float = Field(default=20.0, ge=10.0, le=40.0)
    slump_workability_mm: float = Field(default=100.0, ge=25.0, le=175.0)


class ConcreteMixDesignIS10262Output(BaseModel):
    target_mean_strength_fck_prime_mpa: float
    free_water_cement_ratio: float
    cement_content_kg_m3: float
    water_content_liters_m3: float
    fine_aggregate_sand_kg_m3: float
    coarse_aggregate_gravel_kg_m3: float
    mix_ratio_by_weight: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ConcreteMixDesignIS10262Engine(BaseSimulationEngine):
    name = "concrete-mix-design-is10262"
    description = "CE/CT/S3: Concrete Technology — IS 10262:2019 Mix Proportioning, Target Mean Strength & Material Batch Quantities"

    def calculate(self, params: ConcreteMixDesignIS10262Input) -> ConcreteMixDesignIS10262Output:
        grade_map = {
            "M20 (fck = 20 MPa)": (20.0, 4.0, 0.50),
            "M25 (fck = 25 MPa)": (25.0, 4.0, 0.45),
            "M30 (fck = 30 MPa)": (30.0, 5.0, 0.40),
            "M35 (fck = 35 MPa)": (35.0, 5.0, 0.38)
        }
        fck, s_dev, wc = grade_map.get(params.grade_of_concrete, (25.0, 4.0, 0.45))

        # fck' = fck + 1.65 * s
        fck_prime = fck + 1.65 * s_dev

        # Base water for 20mm aggregate = 186 kg/m3 (for 50mm slump) + 3% per 25mm extra slump
        slump_inc = max(0.0, (params.slump_workability_mm - 50.0) / 25.0)
        water_kg = 186.0 * (1.0 + 0.03 * slump_inc)
        cement_kg = water_kg / wc

        # Aggregate absolute volumes
        vol_cement = cement_kg / (3.15 * 1000.0)
        vol_water = water_kg / 1000.0
        vol_agg = 1.0 - (vol_cement + vol_water + 0.01)  # 1% entrapped air

        # 60% coarse, 40% fine
        sand_kg = vol_agg * 0.38 * 2.65 * 1000.0
        gravel_kg = vol_agg * 0.62 * 2.70 * 1000.0

        r_c = 1.0
        r_s = sand_kg / cement_kg
        r_g = gravel_kg / cement_kg
        mix_str = f"1 : {r_s:.2f} : {r_g:.2f} (Cement : Sand : Aggregate)"

        telemetry = {
            "fck_prime": round(fck_prime, 2),
            "wc": wc,
            "cement_kg": round(cement_kg, 1),
            "water_l": round(water_kg, 1),
            "sand_kg": round(sand_kg, 1),
            "gravel_kg": round(gravel_kg, 1),
            "mix": mix_str
        }

        return ConcreteMixDesignIS10262Output(
            target_mean_strength_fck_prime_mpa=round(fck_prime, 2),
            free_water_cement_ratio=round(wc, 2),
            cement_content_kg_m3=round(cement_kg, 1),
            water_content_liters_m3=round(water_kg, 1),
            fine_aggregate_sand_kg_m3=round(sand_kg, 1),
            coarse_aggregate_gravel_kg_m3=round(gravel_kg, 1),
            mix_ratio_by_weight=mix_str,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "m25_moderate_100mm_slump": {"grade_of_concrete": "M25 (fck = 25 MPa)", "exposure_condition": "Moderate", "maximum_aggregate_size_mm": 20.0, "slump_workability_mm": 100.0},
            "m30_severe_rcc": {"grade_of_concrete": "M30 (fck = 30 MPa)", "exposure_condition": "Severe", "maximum_aggregate_size_mm": 20.0, "slump_workability_mm": 75.0}
        }


# ── 10. Concrete Compacting Factor & Vee-Bee Engine ─────────────────────────
class ConcreteCompactingFactorVeeBeeInput(BaseModel):
    partially_compacted_weight_kg: float = Field(default=10.8, ge=5.0, le=25.0)
    fully_compacted_weight_kg: float = Field(default=12.2, ge=5.0, le=25.0)
    empty_cylinder_weight_kg: float = Field(default=4.5, ge=1.0, le=10.0)
    slump_measurement_mm: float = Field(default=65.0, ge=0.0, le=200.0)


class ConcreteCompactingFactorVeeBeeOutput(BaseModel):
    compacting_factor_cf: float
    workability_degree_classification: str
    vee_bee_time_seconds: float
    suitable_structural_applications: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ConcreteCompactingFactorVeeBeeEngine(BaseSimulationEngine):
    name = "concrete-compacting-factor-veebee"
    description = "CE/CT/S3: Fresh Concrete Workability — Compacting Factor CF = Wp/Wf, Vee-Bee Seconds & Slump Testing"

    def calculate(self, params: ConcreteCompactingFactorVeeBeeInput) -> ConcreteCompactingFactorVeeBeeOutput:
        w_part = params.partially_compacted_weight_kg - params.empty_cylinder_weight_kg
        w_full = params.fully_compacted_weight_kg - params.empty_cylinder_weight_kg

        cf = w_part / max(0.1, w_full)

        if cf < 0.75:
            deg = "VERY LOW WORKABILITY (Vee-Bee > 12s)"
            vb = 15.0
            app = "Road Pavements & Roller Compacted Concrete (Vibrated by Power Rollers)"
        elif cf <= 0.82:
            deg = "LOW WORKABILITY (Vee-Bee 6 - 12s)"
            vb = 8.5
            app = "Mass Concrete Foundations, Canal Linings & Lightly Reinforced Sections"
        elif cf <= 0.92:
            deg = "MEDIUM WORKABILITY (Vee-Bee 3 - 6s)"
            vb = 4.5
            app = "Heavily Reinforced Beams, Columns, Slabs & Pumping Concrete"
        else:
            deg = "HIGH WORKABILITY (Vee-Bee 0 - 3s)"
            vb = 1.5
            app = "Congested Reinforcement, Tremie Underwater Concreting & Self-Compacting"

        telemetry = {
            "cf": round(cf, 3),
            "deg": deg,
            "vb_s": vb,
            "app": app
        }

        return ConcreteCompactingFactorVeeBeeOutput(
            compacting_factor_cf=round(cf, 3),
            workability_degree_classification=deg,
            vee_bee_time_seconds=vb,
            suitable_structural_applications=app,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "medium_workability_beams": {"partially_compacted_weight_kg": 10.8, "fully_compacted_weight_kg": 12.2, "empty_cylinder_weight_kg": 4.5, "slump_measurement_mm": 65.0},
            "low_workability_pavements": {"partially_compacted_weight_kg": 9.8, "fully_compacted_weight_kg": 12.2, "empty_cylinder_weight_kg": 4.5, "slump_measurement_mm": 25.0}
        }


# ── 11. Split Tensile & Flexural Concrete Strength Engine ───────────────────
class SplitTensileFlexuralConcreteStrengthInput(BaseModel):
    cylinder_diameter_d_mm: float = Field(default=150.0, ge=100.0, le=200.0)
    cylinder_length_l_mm: float = Field(default=300.0, ge=200.0, le=400.0)
    tensile_cracking_load_kn: float = Field(default=185.0, ge=20.0, le=800.0)
    characteristic_cube_fck_mpa: float = Field(default=25.0, ge=15.0, le=80.0)


class SplitTensileFlexuralConcreteStrengthOutput(BaseModel):
    split_tensile_strength_fct_mpa: float
    modulus_of_rupture_flexural_fr_mpa: float
    direct_tensile_strength_estimate_mpa: float
    is456_tensile_ratio_percentage: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SplitTensileFlexuralConcreteStrengthEngine(BaseSimulationEngine):
    name = "split-tensile-flexural-concrete-strength"
    description = "CE/CT/S3: Hardened Concrete — Split Tensile (fct = 2P / pi L D) & Modulus of Rupture Flexure (fr = 0.7 sqrt(fck))"

    def calculate(self, params: SplitTensileFlexuralConcreteStrengthInput) -> SplitTensileFlexuralConcreteStrengthOutput:
        p_n = params.tensile_cracking_load_kn * 1000.0
        d = params.cylinder_diameter_d_mm
        l = params.cylinder_length_l_mm

        # f_ct = 2P / (pi * L * D)
        f_ct = (2.0 * p_n) / (math.pi * l * d)

        # IS 456 Flexural strength f_r = 0.7 * sqrt(fck)
        f_r = 0.7 * math.sqrt(params.characteristic_cube_fck_mpa)
        f_direct = 0.55 * f_ct
        ratio_pct = (f_ct / params.characteristic_cube_fck_mpa) * 100.0

        telemetry = {
            "f_ct": round(f_ct, 3),
            "f_r": round(f_r, 2),
            "f_direct": round(f_direct, 2),
            "ratio_pct": round(ratio_pct, 1)
        }

        return SplitTensileFlexuralConcreteStrengthOutput(
            split_tensile_strength_fct_mpa=round(f_ct, 3),
            modulus_of_rupture_flexural_fr_mpa=round(f_r, 2),
            direct_tensile_strength_estimate_mpa=round(f_direct, 2),
            is456_tensile_ratio_percentage=round(ratio_pct, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "m25_cylinder_split": {"cylinder_diameter_d_mm": 150.0, "cylinder_length_l_mm": 300.0, "tensile_cracking_load_kn": 185.0, "characteristic_cube_fck_mpa": 25.0},
            "m30_high_strength_cylinder": {"cylinder_diameter_d_mm": 150.0, "cylinder_length_l_mm": 300.0, "tensile_cracking_load_kn": 225.0, "characteristic_cube_fck_mpa": 30.0}
        }


# ── 12. Shear Force & Bending Moment Diagrams Engine ────────────────────────
class ShearForceBendingMomentDiagramsInput(BaseModel):
    beam_span_l_m: float = Field(default=6.0, ge=1.0, le=20.0)
    point_load_p_kn: float = Field(default=30.0, ge=0.0, le=200.0)
    point_load_distance_a_m: float = Field(default=2.0, ge=0.0, le=20.0)
    udl_w_kn_per_m: float = Field(default=10.0, ge=0.0, le=100.0)


class ShearForceBendingMomentDiagramsOutput(BaseModel):
    support_reaction_ra_kn: float
    support_reaction_rb_kn: float
    maximum_bending_moment_knm: float
    max_moment_location_x_m: float
    point_of_contraflexure_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ShearForceBendingMomentDiagramsEngine(BaseSimulationEngine):
    name = "shear-force-bending-moment-diagrams"
    description = "CE/MOS/S3: Mechanics of Structures — Analytical SFD & BMD Generator for Simply Supported & Loaded Beams"

    def calculate(self, params: ShearForceBendingMomentDiagramsInput) -> ShearForceBendingMomentDiagramsOutput:
        l = params.beam_span_l_m
        p = params.point_load_p_kn
        a = min(params.point_load_distance_a_m, l)
        w = params.udl_w_kn_per_m

        # sum(M_A) = 0 => Rb * L = P * a + w * L * (L/2)
        rb = (p * a + w * l * (l / 2.0)) / l
        ra = (p + w * l) - rb

        # Max Bending Moment where SF = 0
        # If w > 0: V(x) = Ra - w*x - (P if x >= a else 0) = 0
        if w > 0:
            x_zero = (ra - (p if ra > w * a else 0.0)) / w
            x_zero = max(0.0, min(l, x_zero))
        else:
            x_zero = a

        # M(x) = Ra * x - w*x^2/2 - P * max(0, x - a)
        m_max = ra * x_zero - (w * (x_zero**2) / 2.0) - (p * max(0.0, x_zero - a))

        telemetry = {
            "ra_kn": round(ra, 2),
            "rb_kn": round(rb, 2),
            "m_max_knm": round(m_max, 2),
            "x_m": round(x_zero, 2)
        }

        return ShearForceBendingMomentDiagramsOutput(
            support_reaction_ra_kn=round(ra, 2),
            support_reaction_rb_kn=round(rb, 2),
            maximum_bending_moment_knm=round(m_max, 2),
            max_moment_location_x_m=round(x_zero, 2),
            point_of_contraflexure_status="No point of contraflexure (Simply Supported Beam — Sagging throughout)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "simply_supported_point_and_udl": {"beam_span_l_m": 6.0, "point_load_p_kn": 30.0, "point_load_distance_a_m": 2.0, "udl_w_kn_per_m": 10.0},
            "central_point_load_only": {"beam_span_l_m": 5.0, "point_load_p_kn": 40.0, "point_load_distance_a_m": 2.5, "udl_w_kn_per_m": 0.0}
        }
