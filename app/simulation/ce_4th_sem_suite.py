"""
WBSCTE Civil Engineering (CE) 4th Semester Physics Engines
===========================================================
Syllabus Mapped:
1. CE/ASURV/S4: TransitTheodoliteVernierAnglesEngine
2. CE/ASURV/S4: TheodoliteTraverseBowditchRuleEngine
3. CE/ASURV/S4: TacheometricStadiaDistanceHeightEngine
4. CE/ASURV/S4: CircularCurveSettingRankineMethodEngine
5. CE/GTE/S4:   SoilPhaseRelationshipsUnitWeightsEngine
6. CE/GTE/S4:   FallingHeadPermeabilityDarcyEngine
7. CE/GTE/S4:   RankineEarthPressureRetainingWallEngine
8. CE/GTE/S4:   UnconfinedCompressionVaneShearEngine
9. CE/TE1/S4:   HighwaySuperelevationStoppingSightDistanceEngine
10. CE/TE1/S4:  CaliforniaBearingRatioCBREngine
11. CE/TE1/S4:  BitumenPenetrationSofteningDuctilityEngine
12. CE/IRR/S4:  CropWaterDutyDeltaCanalDesignEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Transit Theodolite Vernier Angles Engine ─────────────────────────────
class TransitTheodoliteVernierAnglesInput(BaseModel):
    horizontal_angle_deg: float = Field(default=48.5, ge=0.0, le=360.0)
    repetitions_count_n: int = Field(default=3, ge=1, le=12)
    vertical_elevation_angle_deg: float = Field(default=12.5, ge=-85.0, le=85.0)
    instrument_face: Literal["Face Left (Normal)", "Face Right (Inverted)"] = "Face Left (Normal)"


class TransitTheodoliteVernierAnglesOutput(BaseModel):
    accumulated_repetition_angle_deg: float
    mean_measured_horizontal_angle_deg: float
    vertical_zenith_distance_deg: float
    collimation_error_elimination_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class TransitTheodoliteVernierAnglesEngine(BaseSimulationEngine):
    name = "transit-theodolite-vernier-angles"
    description = "CE/ASURV/S4: Theodolite Surveying — Transit Vernier Theodolite Horizontal Angle Repetition, Reiteration & Collimation"

    def calculate(self, params: TransitTheodoliteVernierAnglesInput) -> TransitTheodoliteVernierAnglesOutput:
        ang = params.horizontal_angle_deg
        n = params.repetitions_count_n
        vert = params.vertical_elevation_angle_deg

        acc_ang = (n * ang) % 360.0
        mean_ang = ang

        zenith = 90.0 - vert if vert >= 0 else 90.0 + abs(vert)
        status = "FL/FR Averaging Eliminates Collimation, Index & Horizontal Axis Tilt Errors"

        telemetry = {
            "ang_deg": ang,
            "n_reps": n,
            "acc_deg": round(acc_ang, 2),
            "vert_deg": vert,
            "zenith_deg": round(zenith, 2)
        }

        return TransitTheodoliteVernierAnglesOutput(
            accumulated_repetition_angle_deg=round(acc_ang, 2),
            mean_measured_horizontal_angle_deg=round(mean_ang, 4),
            vertical_zenith_distance_deg=round(zenith, 2),
            collimation_error_elimination_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "repetition_3_times_48deg": {"horizontal_angle_deg": 48.5, "repetitions_count_n": 3, "vertical_elevation_angle_deg": 12.5, "instrument_face": "Face Left (Normal)"},
            "reiteration_face_right": {"horizontal_angle_deg": 75.25, "repetitions_count_n": 6, "vertical_elevation_angle_deg": -5.5, "instrument_face": "Face Right (Inverted)"}
        }


# ── 2. Theodolite Traverse Bowditch Rule Engine ─────────────────────────────
class TheodoliteTraverseBowditchRuleInput(BaseModel):
    traverse_side_lengths_m: List[float] = Field(default=[120.0, 150.0, 110.0, 140.0])
    reduced_bearings_deg: List[float] = Field(default=[45.0, 135.0, 225.0, 315.0])


class TheodoliteTraverseBowditchRuleOutput(BaseModel):
    total_traverse_perimeter_m: float
    closing_error_linear_m: float
    closing_error_direction_deg: float
    relative_precision_ratio: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class TheodoliteTraverseBowditchRuleEngine(BaseSimulationEngine):
    name = "theodolite-traverse-bowditch-rule"
    description = "CE/ASURV/S4: Theodolite Traversing — Latitude L = l cos(theta), Departure D = l sin(theta) & Bowditch's Rule Balancing"

    def calculate(self, params: TheodoliteTraverseBowditchRuleInput) -> TheodoliteTraverseBowditchRuleOutput:
        lengths = params.traverse_side_lengths_m
        bearings = params.reduced_bearings_deg

        lats, deps = [], []
        for l, b in zip(lengths, bearings):
            rad = math.radians(b)
            lats.append(l * math.cos(rad))
            deps.append(l * math.sin(rad))

        sum_lat = sum(lats)
        sum_dep = sum(deps)
        perimeter = sum(lengths)

        e_lin = math.sqrt(sum_lat**2 + sum_dep**2)
        dir_deg = math.degrees(math.atan2(abs(sum_dep), max(1e-4, abs(sum_lat))))

        prec_denom = int(perimeter / max(0.001, e_lin)) if e_lin > 0.001 else 100000
        prec_str = f"1 in {prec_denom} (Traverse Precision)"

        telemetry = {
            "perim_m": round(perimeter, 2),
            "sum_lat": round(sum_lat, 3),
            "sum_dep": round(sum_dep, 3),
            "e_lin": round(e_lin, 3),
            "prec": prec_str
        }

        return TheodoliteTraverseBowditchRuleOutput(
            total_traverse_perimeter_m=round(perimeter, 2),
            closing_error_linear_m=round(e_lin, 3),
            closing_error_direction_deg=round(dir_deg, 2),
            relative_precision_ratio=prec_str,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "4_sided_closed_traverse": {"traverse_side_lengths_m": [120.0, 150.0, 110.0, 140.0], "reduced_bearings_deg": [45.0, 135.0, 225.0, 315.0]},
            "highway_bypass_loop": {"traverse_side_lengths_m": [200.0, 250.0, 180.0, 230.0], "reduced_bearings_deg": [30.0, 120.0, 210.0, 300.0]}
        }


# ── 3. Tacheometric Stadia Distance & Height Engine ─────────────────────────
class TacheometricStadiaDistanceHeightInput(BaseModel):
    stadia_intercept_s_m: float = Field(default=1.250, ge=0.1, le=5.0)
    vertical_sight_angle_deg: float = Field(default=8.5, ge=-45.0, le=45.0)
    multiplying_constant_k: float = Field(default=100.0, ge=90.0, le=110.0)
    additive_constant_c: float = Field(default=0.0, ge=0.0, le=0.5)
    instrument_axis_height_hi_m: float = Field(default=1.450, ge=0.5, le=2.5)
    central_hair_reading_h_m: float = Field(default=1.850, ge=0.5, le=4.0)


class TacheometricStadiaDistanceHeightOutput(BaseModel):
    horizontal_distance_d_m: float
    vertical_elevation_component_v_m: float
    elevation_difference_delta_rl_m: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class TacheometricStadiaDistanceHeightEngine(BaseSimulationEngine):
    name = "tacheometric-stadia-distance-height"
    description = "CE/ASURV/S4: Tacheometry — Stadia Hair Intercept s, Inclined Sight D = ks cos^2(theta) & Elevation Component V"

    def calculate(self, params: TacheometricStadiaDistanceHeightInput) -> TacheometricStadiaDistanceHeightOutput:
        s = params.stadia_intercept_s_m
        theta = math.radians(params.vertical_sight_angle_deg)
        k = params.multiplying_constant_k
        c = params.additive_constant_c
        hi = params.instrument_axis_height_hi_m
        h = params.central_hair_reading_h_m

        # D = k * s * cos^2(theta) + c * cos(theta)
        d_m = k * s * (math.cos(theta)**2) + c * math.cos(theta)

        # V = 0.5 * k * s * sin(2*theta) + c * sin(theta)
        v_m = 0.5 * k * s * math.sin(2.0 * theta) + c * math.sin(theta)

        # delta_RL = V + HI - h
        delta_rl = v_m + hi - h

        telemetry = {
            "s_m": s,
            "theta_deg": params.vertical_sight_angle_deg,
            "d_m": round(d_m, 2),
            "v_m": round(v_m, 2),
            "delta_rl": round(delta_rl, 2)
        }

        return TacheometricStadiaDistanceHeightOutput(
            horizontal_distance_d_m=round(d_m, 2),
            vertical_elevation_component_v_m=round(v_m, 2),
            elevation_difference_delta_rl_m=round(delta_rl, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "stadia_intercept_1_25m_angle8deg": {"stadia_intercept_s_m": 1.250, "vertical_sight_angle_deg": 8.5, "multiplying_constant_k": 100.0, "additive_constant_c": 0.0, "instrument_axis_height_hi_m": 1.450, "central_hair_reading_h_m": 1.850},
            "depression_sight_angle_minus6deg": {"stadia_intercept_s_m": 1.800, "vertical_sight_angle_deg": -6.0, "multiplying_constant_k": 100.0, "additive_constant_c": 0.0, "instrument_axis_height_hi_m": 1.500, "central_hair_reading_h_m": 2.100}
        }


# ── 4. Circular Curve Setting Rankine Method Engine ─────────────────────────
class CircularCurveSettingRankineMethodInput(BaseModel):
    curve_radius_r_m: float = Field(default=300.0, ge=50.0, le=2000.0)
    deflection_angle_delta_deg: float = Field(default=40.0, ge=5.0, le=120.0)
    subchord_length_c_m: float = Field(default=20.0, ge=5.0, le=50.0)
    chainage_intersection_point_v_m: float = Field(default=1250.0, ge=100.0, le=10000.0)


class CircularCurveSettingRankineMethodOutput(BaseModel):
    tangent_length_t_m: float
    curve_length_l_m: float
    long_chord_length_c_m: float
    apex_distance_e_m: float
    mid_ordinate_m_m: float
    rankine_deflection_angle_per_chord_deg: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CircularCurveSettingRankineMethodEngine(BaseSimulationEngine):
    name = "circular-curve-setting-rankine-method"
    description = "CE/ASURV/S4: Curves — Simple Circular Curve Elements (T, L, C, E, M) & Rankine Tangential Deflection Angle"

    def calculate(self, params: CircularCurveSettingRankineMethodInput) -> CircularCurveSettingRankineMethodOutput:
        r = params.curve_radius_r_m
        delta = math.radians(params.deflection_angle_delta_deg)
        c = params.subchord_length_c_m

        t = r * math.tan(delta / 2.0)
        l_curve = r * delta
        long_chord = 2.0 * r * math.sin(delta / 2.0)
        e_apex = r * ((1.0 / math.cos(delta / 2.0)) - 1.0)
        m_mid = r * (1.0 - math.cos(delta / 2.0))

        # delta_min = 1718.9 * c / R (minutes) -> degrees = delta_min / 60
        delta_min = 1718.9 * c / r
        delta_deg = delta_min / 60.0

        telemetry = {
            "t_m": round(t, 2),
            "l_m": round(l_curve, 2),
            "chord_m": round(long_chord, 2),
            "apex_m": round(e_apex, 2),
            "mid_m": round(m_mid, 2),
            "delta_deg": round(delta_deg, 3)
        }

        return CircularCurveSettingRankineMethodOutput(
            tangent_length_t_m=round(t, 2),
            curve_length_l_m=round(l_curve, 2),
            long_chord_length_c_m=round(long_chord, 2),
            apex_distance_e_m=round(e_apex, 2),
            mid_ordinate_m_m=round(m_mid, 2),
            rankine_deflection_angle_per_chord_deg=round(delta_deg, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "radius_300m_delta_40deg": {"curve_radius_r_m": 300.0, "deflection_angle_delta_deg": 40.0, "subchord_length_c_m": 20.0, "chainage_intersection_point_v_m": 1250.0},
            "expressway_curve_radius_600m": {"curve_radius_r_m": 600.0, "deflection_angle_delta_deg": 30.0, "subchord_length_c_m": 25.0, "chainage_intersection_point_v_m": 2500.0}
        }


# ── 5. Soil Phase Relationships & Unit Weights Engine ───────────────────────
class SoilPhaseRelationshipsUnitWeightsInput(BaseModel):
    water_content_pct: float = Field(default=18.0, ge=1.0, le=100.0)
    bulk_unit_weight_kn_m3: float = Field(default=19.5, ge=10.0, le=26.0)
    specific_gravity_gs: float = Field(default=2.68, ge=2.4, le=2.9)


class SoilPhaseRelationshipsUnitWeightsOutput(BaseModel):
    dry_unit_weight_kn_m3: float
    void_ratio_e: float
    porosity_percentage_n: float
    degree_of_saturation_percentage_sr: float
    submerged_unit_weight_kn_m3: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SoilPhaseRelationshipsUnitWeightsEngine(BaseSimulationEngine):
    name = "soil-phase-relationships-unit-weights"
    description = "CE/GTE/S4: Soil Mechanics — 3-Phase Soil Diagram, Void Ratio e, Porosity n, Saturation Sr & Dry Unit Weight"

    def calculate(self, params: SoilPhaseRelationshipsUnitWeightsInput) -> SoilPhaseRelationshipsUnitWeightsOutput:
        w = params.water_content_pct / 100.0
        gamma = params.bulk_unit_weight_kn_m3
        gs = params.specific_gravity_gs
        gamma_w = 9.81

        # gamma_d = gamma / (1 + w)
        gamma_d = gamma / (1.0 + w)

        # e = (Gs * gamma_w / gamma_d) - 1
        e = (gs * gamma_w / gamma_d) - 1.0
        n_pct = (e / (1.0 + e)) * 100.0

        # Sr = (w * Gs) / e
        sr_pct = min(100.0, (w * gs / max(0.01, e)) * 100.0)

        # gamma' = (Gs - 1) * gamma_w / (1 + e)
        gamma_sub = (gs - 1.0) * gamma_w / (1.0 + e)

        telemetry = {
            "gamma_d": round(gamma_d, 2),
            "e": round(e, 3),
            "n_pct": round(n_pct, 1),
            "sr_pct": round(sr_pct, 1),
            "gamma_sub": round(gamma_sub, 2)
        }

        return SoilPhaseRelationshipsUnitWeightsOutput(
            dry_unit_weight_kn_m3=round(gamma_d, 2),
            void_ratio_e=round(e, 3),
            porosity_percentage_n=round(n_pct, 1),
            degree_of_saturation_percentage_sr=round(sr_pct, 1),
            submerged_unit_weight_kn_m3=round(gamma_sub, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "sandy_clay_18pct_moisture": {"water_content_pct": 18.0, "bulk_unit_weight_kn_m3": 19.5, "specific_gravity_gs": 2.68},
            "saturated_soft_clay": {"water_content_pct": 35.0, "bulk_unit_weight_kn_m3": 17.5, "specific_gravity_gs": 2.70}
        }


# ── 6. Falling Head Permeability Darcy Engine ───────────────────────────────
class FallingHeadPermeabilityDarcyInput(BaseModel):
    permeameter_type: Literal["Falling Head Permeameter (Fine Clays & Silts)", "Constant Head Permeameter (Coarse Sands)"] = "Falling Head Permeameter (Fine Clays & Silts)"
    standpipe_area_a_cm2: float = Field(default=0.5, ge=0.1, le=5.0)
    soil_sample_area_a_cm2: float = Field(default=50.0, ge=10.0, le=200.0)
    sample_length_l_cm: float = Field(default=12.0, ge=5.0, le=30.0)
    initial_head_h1_cm: float = Field(default=80.0, ge=10.0, le=200.0)
    final_head_h2_cm: float = Field(default=40.0, ge=5.0, le=190.0)
    elapsed_time_t_seconds: float = Field(default=180.0, ge=10.0, le=3600.0)


class FallingHeadPermeabilityDarcyOutput(BaseModel):
    permeability_coefficient_k_cm_s: float
    permeability_coefficient_k_m_s: float
    soil_drainage_classification: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FallingHeadPermeabilityDarcyEngine(BaseSimulationEngine):
    name = "falling-head-permeability-darcy"
    description = "CE/GTE/S4: Soil Permeability — Darcy's Law v = ki, Constant & Falling Head Permeameter k = 2.303 aL/(At) log10(h1/h2)"

    def calculate(self, params: FallingHeadPermeabilityDarcyInput) -> FallingHeadPermeabilityDarcyOutput:
        a = params.standpipe_area_a_cm2
        big_a = params.soil_sample_area_a_cm2
        l = params.sample_length_l_cm
        h1 = params.initial_head_h1_cm
        h2 = params.final_head_h2_cm
        t = params.elapsed_time_t_seconds

        # k = (2.303 * a * L) / (A * t) * log10(h1 / h2)
        k_cm_s = (2.303 * a * l) / (big_a * t) * math.log10(h1 / max(1.0, h2))
        k_m_s = k_cm_s * 1e-2

        if k_cm_s > 1e-1:
            drain = "EXCELLENT DRAINAGE (Clean Gravel / Coarse Sand)"
        elif k_cm_s >= 1e-3:
            drain = "GOOD DRAINAGE (Medium / Fine Sand)"
        elif k_cm_s >= 1e-5:
            drain = "POOR DRAINAGE (Inorganic Silt / Silty Sand)"
        else:
            drain = "PRACTICALLY IMPERMEABLE (Homogeneous Clay: k < 10^-6 cm/s)"

        telemetry = {
            "k_cm_s": f"{k_cm_s:.3e}",
            "k_m_s": f"{k_m_s:.3e}",
            "drain": drain
        }

        return FallingHeadPermeabilityDarcyOutput(
            permeability_coefficient_k_cm_s=round(k_cm_s, 6),
            permeability_coefficient_k_m_s=round(k_m_s, 8),
            soil_drainage_classification=drain,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "silt_sample_falling_head": {"permeameter_type": "Falling Head Permeameter (Fine Clays & Silts)", "standpipe_area_a_cm2": 0.5, "soil_sample_area_a_cm2": 50.0, "sample_length_l_cm": 12.0, "initial_head_h1_cm": 80.0, "final_head_h2_cm": 40.0, "elapsed_time_t_seconds": 180.0},
            "clay_impermeable_core": {"permeameter_type": "Falling Head Permeameter (Fine Clays & Silts)", "standpipe_area_a_cm2": 0.2, "soil_sample_area_a_cm2": 50.0, "sample_length_l_cm": 15.0, "initial_head_h1_cm": 100.0, "final_head_h2_cm": 60.0, "elapsed_time_t_seconds": 900.0}
        }


# ── 7. Rankine Earth Pressure Retaining Wall Engine ─────────────────────────
class RankineEarthPressureRetainingWallInput(BaseModel):
    wall_height_h_m: float = Field(default=6.0, ge=1.0, le=15.0)
    soil_friction_angle_phi_deg: float = Field(default=30.0, ge=10.0, le=45.0)
    soil_cohesion_c_kpa: float = Field(default=0.0, ge=0.0, le=50.0)
    soil_unit_weight_gamma_kn_m3: float = Field(default=18.0, ge=14.0, le=22.0)
    surcharge_q_kpa: float = Field(default=10.0, ge=0.0, le=50.0)


class RankineEarthPressureRetainingWallOutput(BaseModel):
    active_pressure_coefficient_ka: float
    passive_pressure_coefficient_kp: float
    total_active_thrust_pa_kn_m: float
    overturning_moment_mo_knm_m: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RankineEarthPressureRetainingWallEngine(BaseSimulationEngine):
    name = "rankine-earth-pressure-retaining-wall"
    description = "CE/GTE/S4: Lateral Earth Pressure — Rankine Active (ka) & Passive (kp) Thrust on Cantilever Retaining Walls"

    def calculate(self, params: RankineEarthPressureRetainingWallInput) -> RankineEarthPressureRetainingWallOutput:
        phi = math.radians(params.soil_friction_angle_phi_deg)
        h = params.wall_height_h_m
        gamma = params.soil_unit_weight_gamma_kn_m3
        q = params.surcharge_q_kpa

        # ka = (1 - sin phi) / (1 + sin phi)
        ka = (1.0 - math.sin(phi)) / (1.0 + math.sin(phi))
        kp = 1.0 / max(0.001, ka)

        # Pa = 0.5 * ka * gamma * H^2 + ka * q * H
        p_soil = 0.5 * ka * gamma * (h**2)
        p_surch = ka * q * h
        p_total = p_soil + p_surch

        # Mo = P_soil * (H/3) + P_surch * (H/2)
        m_o = p_soil * (h / 3.0) + p_surch * (h / 2.0)

        telemetry = {
            "ka": round(ka, 3),
            "kp": round(kp, 3),
            "pa_kn": round(p_total, 2),
            "mo_knm": round(m_o, 2)
        }

        return RankineEarthPressureRetainingWallOutput(
            active_pressure_coefficient_ka=round(ka, 3),
            passive_pressure_coefficient_kp=round(kp, 3),
            total_active_thrust_pa_kn_m=round(p_total, 2),
            overturning_moment_mo_knm_m=round(m_o, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "wall_6m_phi30_surcharge10": {"wall_height_h_m": 6.0, "soil_friction_angle_phi_deg": 30.0, "soil_cohesion_c_kpa": 0.0, "soil_unit_weight_gamma_kn_m3": 18.0, "surcharge_q_kpa": 10.0},
            "bridge_abutment_8m": {"wall_height_h_m": 8.0, "soil_friction_angle_phi_deg": 35.0, "soil_cohesion_c_kpa": 0.0, "soil_unit_weight_gamma_kn_m3": 19.0, "surcharge_q_kpa": 15.0}
        }


# ── 8. Unconfined Compression & Vane Shear Engine ───────────────────────────
class UnconfinedCompressionVaneShearInput(BaseModel):
    test_method: Literal["Unconfined Compressive Strength (UCS)", "Laboratory Vane Shear Test"] = "Unconfined Compressive Strength (UCS)"
    specimen_diameter_d_mm: float = Field(default=38.0, ge=30.0, le=100.0)
    specimen_length_l_mm: float = Field(default=76.0, ge=60.0, le=200.0)
    axial_failure_load_n: float = Field(default=120.0, ge=10.0, le=1000.0)
    vane_torque_t_n_m: float = Field(default=0.45, ge=0.05, le=5.0)


class UnconfinedCompressionVaneShearOutput(BaseModel):
    unconfined_compressive_strength_qu_kpa: float
    undrained_cohesion_cu_kpa: float
    soil_consistency_grading: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class UnconfinedCompressionVaneShearEngine(BaseSimulationEngine):
    name = "unconfined-compression-vane-shear"
    description = "CE/GTE/S4: Soil Shear Strength — Unconfined Compressive Strength qu = 2cu & Laboratory Vane Shear Testing"

    def calculate(self, params: UnconfinedCompressionVaneShearInput) -> UnconfinedCompressionVaneShearOutput:
        d_m = params.specimen_diameter_d_mm / 1000.0
        area = (math.pi / 4.0) * (d_m**2)

        if params.test_method == "Unconfined Compressive Strength (UCS)":
            qu = (params.axial_failure_load_n / area) / 1000.0  # kPa
            cu = qu / 2.0
        else:  # Vane Shear
            # T = pi * d^2 * (h/2 + d/6) * cu  (h = 2d) => T = pi * d^3 * (7/6) * cu
            d_vane = 0.02  # 20mm vane diameter
            denom = math.pi * (d_vane**3) * (7.0 / 6.0)
            cu = (params.vane_torque_t_n_m / denom) / 1000.0  # kPa
            qu = 2.0 * cu

        if qu < 25.0:
            cons = "VERY SOFT CLAY (qu < 25 kPa)"
        elif qu <= 50.0:
            cons = "SOFT CLAY (qu = 25 - 50 kPa)"
        elif qu <= 100.0:
            cons = "MEDIUM STIFF CLAY (qu = 50 - 100 kPa)"
        elif qu <= 200.0:
            cons = "STIFF CLAY (qu = 100 - 200 kPa)"
        else:
            cons = "VERY STIFF / HARD CLAY (qu > 200 kPa)"

        telemetry = {
            "qu_kpa": round(qu, 2),
            "cu_kpa": round(cu, 2),
            "cons": cons
        }

        return UnconfinedCompressionVaneShearOutput(
            unconfined_compressive_strength_qu_kpa=round(qu, 2),
            undrained_cohesion_cu_kpa=round(cu, 2),
            soil_consistency_grading=cons,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "medium_clay_ucs": {"test_method": "Unconfined Compressive Strength (UCS)", "specimen_diameter_d_mm": 38.0, "specimen_length_l_mm": 76.0, "axial_failure_load_n": 120.0, "vane_torque_t_n_m": 0.45},
            "soft_marine_clay_vane": {"test_method": "Laboratory Vane Shear Test", "specimen_diameter_d_mm": 38.0, "specimen_length_l_mm": 76.0, "axial_failure_load_n": 50.0, "vane_torque_t_n_m": 0.20}
        }


# ── 9. Highway Superelevation & Stopping Sight Distance Engine ──────────────
class HighwaySuperelevationStoppingSightDistanceInput(BaseModel):
    design_speed_v_kmph: float = Field(default=80.0, ge=20.0, le=140.0)
    horizontal_curve_radius_r_m: float = Field(default=250.0, ge=30.0, le=1500.0)
    driver_reaction_time_t_s: float = Field(default=2.5, ge=1.0, le=4.0)
    longitudinal_friction_f: float = Field(default=0.35, ge=0.25, le=0.45)
    lateral_friction_f_lat: float = Field(default=0.15, ge=0.10, le=0.20)


class HighwaySuperelevationStoppingSightDistanceOutput(BaseModel):
    stopping_sight_distance_ssd_m: float
    design_superelevation_rate_e: float
    maximum_allowable_safe_speed_kmph: float
    irc73_superelevation_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class HighwaySuperelevationStoppingSightDistanceEngine(BaseSimulationEngine):
    name = "highway-superelevation-stopping-sight-distance"
    description = "CE/TE1/S4: Highway Geometry — IRC:73 Stopping Sight Distance (SSD), OSD & Superelevation e = V^2 / (225R)"

    def calculate(self, params: HighwaySuperelevationStoppingSightDistanceInput) -> HighwaySuperelevationStoppingSightDistanceOutput:
        v = params.design_speed_v_kmph
        r = params.horizontal_curve_radius_r_m
        t = params.driver_reaction_time_t_s
        f_long = params.longitudinal_friction_f
        f_lat = params.lateral_friction_f_lat

        # SSD = 0.278 * V * t + V^2 / (254 * f)
        ssd = 0.278 * v * t + (v**2) / (254.0 * f_long)

        # Design e for 75% speed: e = (0.75*V)^2 / (127 * R) = V^2 / (225 * R)
        e_calc = (v**2) / (225.0 * r)
        e_max = 0.07  # Plain and rolling terrain IRC limit 7%

        if e_calc <= e_max:
            e_design = e_calc
            v_safe = v
            verdict = f"DESIGN MET: Superelevation e = {e_design*100:.1f}% (<= 7% IRC limit)"
        else:
            e_design = e_max
            # Check (e_max + f_lat) = V^2 / (127 * R)
            v_safe = math.sqrt(127.0 * r * (e_max + f_lat))
            verdict = f"CAPPED AT MAX e = 7%: Safe speed = {v_safe:.1f} km/h (Design speed = {v:.0f} km/h)"

        telemetry = {
            "ssd_m": round(ssd, 1),
            "e_pct": round(e_design * 100.0, 2),
            "v_safe": round(v_safe, 1),
            "verdict": verdict
        }

        return HighwaySuperelevationStoppingSightDistanceOutput(
            stopping_sight_distance_ssd_m=round(ssd, 1),
            design_superelevation_rate_e=round(e_design, 4),
            maximum_allowable_safe_speed_kmph=round(v_safe, 1),
            irc73_superelevation_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "plain_terrain_80kmph": {"design_speed_v_kmph": 80.0, "horizontal_curve_radius_r_m": 250.0, "driver_reaction_time_t_s": 2.5, "longitudinal_friction_f": 0.35, "lateral_friction_f_lat": 0.15},
            "expressway_100kmph_radius500m": {"design_speed_v_kmph": 100.0, "horizontal_curve_radius_r_m": 500.0, "driver_reaction_time_t_s": 2.5, "longitudinal_friction_f": 0.35, "lateral_friction_f_lat": 0.15}
        }


# ── 10. California Bearing Ratio (CBR) Engine ───────────────────────────────
class CaliforniaBearingRatioCBRInput(BaseModel):
    penetration_2_5mm_load_kg: float = Field(default=68.5, ge=10.0, le=300.0)
    penetration_5_0mm_load_kg: float = Field(default=98.0, ge=10.0, le=450.0)
    subgrade_traffic_msa: float = Field(default=10.0, ge=1.0, le=150.0)


class CaliforniaBearingRatioCBROutput(BaseModel):
    cbr_at_2_5mm_percentage: float
    cbr_at_5_0mm_percentage: float
    design_cbr_percentage: float
    recommended_pavement_thickness_mm: float
    subgrade_strength_rating: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CaliforniaBearingRatioCBREngine(BaseSimulationEngine):
    name = "california-bearing-ratio-cbr"
    description = "CE/TE1/S4: Pavement Design — California Bearing Ratio (CBR) Standard Penetration & IRC:37 Pavement Sizing"

    def calculate(self, params: CaliforniaBearingRatioCBRInput) -> CaliforniaBearingRatioCBROutput:
        cbr_25 = (params.penetration_2_5mm_load_kg / 1370.0) * 100.0
        cbr_50 = (params.penetration_5_0mm_load_kg / 2055.0) * 100.0
        cbr_design = max(cbr_25, cbr_50)

        # Approximate IRC:37 total pavement thickness
        # T ~ 750 - (cbr_design * 30)
        thick_mm = max(350.0, min(800.0, 750.0 - (cbr_design * 25.0)))

        if cbr_design < 3.0:
            rating = "VERY POOR SUBGRADE (CBR < 3% — Requires Soil Stabilization)"
        elif cbr_design <= 5.0:
            rating = "POOR TO FAIR SUBGRADE (CBR 3 - 5%)"
        elif cbr_design <= 10.0:
            rating = "FAIR TO GOOD SUBGRADE (CBR 5 - 10%)"
        else:
            rating = "EXCELLENT SUBGRADE (CBR > 10%)"

        telemetry = {
            "cbr_25": round(cbr_25, 2),
            "cbr_50": round(cbr_50, 2),
            "cbr_des": round(cbr_design, 2),
            "thick_mm": round(thick_mm, 0),
            "rating": rating
        }

        return CaliforniaBearingRatioCBROutput(
            cbr_at_2_5mm_percentage=round(cbr_25, 2),
            cbr_at_5_0mm_percentage=round(cbr_50, 2),
            design_cbr_percentage=round(cbr_design, 2),
            recommended_pavement_thickness_mm=round(thick_mm, 0),
            subgrade_strength_rating=rating,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "cbr_5pct_standard_subgrade": {"penetration_2_5mm_load_kg": 68.5, "penetration_5_0mm_load_kg": 98.0, "subgrade_traffic_msa": 10.0},
            "stabilized_cbr_8pct": {"penetration_2_5mm_load_kg": 110.0, "penetration_5_0mm_load_kg": 155.0, "subgrade_traffic_msa": 20.0}
        }


# ── 11. Bitumen Penetration & Softening Point Engine ────────────────────────
class BitumenPenetrationSofteningDuctilityInput(BaseModel):
    penetration_value_tenth_mm: float = Field(default=65.0, ge=20.0, le=150.0)
    ring_ball_softening_point_degc: float = Field(default=48.5, ge=30.0, le=80.0)
    ductility_elongation_cm: float = Field(default=78.0, ge=10.0, le=120.0)
    bitumen_grade: Literal["VG-30 / 60/70 Grade", "VG-10 / 80/100 Grade", "VG-40 / 30/40 Heavy Grade"] = "VG-30 / 60/70 Grade"


class BitumenPenetrationSofteningDuctilityOutput(BaseModel):
    is73_viscosity_grade_designation: str
    penetration_index_pi: float
    ductility_test_status: str
    road_construction_suitability: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class BitumenPenetrationSofteningDuctilityEngine(BaseSimulationEngine):
    name = "bitumen-penetration-softening-ductility"
    description = "CE/TE1/S4: Pavement Bitumen — IS:73 Standard Penetration, Ring & Ball Softening Point & Ductility Testing"

    def calculate(self, params: BitumenPenetrationSofteningDuctilityInput) -> BitumenPenetrationSofteningDuctilityOutput:
        pen = params.penetration_value_tenth_mm
        sp = params.ring_ball_softening_point_degc
        duc = params.ductility_elongation_cm

        # Penetration Index PI = (20 - 500*A) / (1 + 50*A) where A = (log10(800) - log10(pen)) / (sp - 25)
        a = (math.log10(800.0) - math.log10(max(1.0, pen))) / max(1.0, sp - 25.0)
        pi = (20.0 - 500.0 * a) / (1.0 + 50.0 * a)

        duc_status = "PASSED (Ductility > 50 cm IS:1208 Requirement)" if duc >= 50.0 else "FAILED (Low Ductility / Brittle Bitumen)"

        if pen <= 45.0:
            vg = "VG-40 (Heavy Commercial Vehicle Traffic / Toll Plazas)"
        elif pen <= 75.0:
            vg = "VG-30 (Standard Pavement Surface Bituminous Concrete)"
        else:
            vg = "VG-10 (Cold Climates / Spray Applications)"

        telemetry = {
            "pen_dmm": pen,
            "sp_degc": sp,
            "duc_cm": duc,
            "pi": round(pi, 2),
            "vg": vg
        }

        return BitumenPenetrationSofteningDuctilityOutput(
            is73_viscosity_grade_designation=vg,
            penetration_index_pi=round(pi, 2),
            ductility_test_status=duc_status,
            road_construction_suitability="Suitable for Dense Bituminous Macadam (DBM) & Bituminous Concrete (BC)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_vg30_60_70": {"penetration_value_tenth_mm": 65.0, "ring_ball_softening_point_degc": 48.5, "ductility_elongation_cm": 78.0, "bitumen_grade": "VG-30 / 60/70 Grade"},
            "soft_vg10_80_100": {"penetration_value_tenth_mm": 85.0, "ring_ball_softening_point_degc": 42.0, "ductility_elongation_cm": 95.0, "bitumen_grade": "VG-10 / 80/100 Grade"}
        }


# ── 12. Crop Water Duty Delta & Canal Design Engine ─────────────────────────
class CropWaterDutyDeltaCanalDesignInput(BaseModel):
    crop_name: Literal["Rice (Delta = 120 cm, Base = 120 days)", "Wheat (Delta = 40 cm, Base = 120 days)", "Sugarcane (Delta = 180 cm, Base = 360 days)"] = "Rice (Delta = 120 cm, Base = 120 days)"
    culturable_command_area_cca_ha: float = Field(default=4500.0, ge=100.0, le=50000.0)
    canal_silt_factor_f: float = Field(default=1.0, ge=0.5, le=2.0)


class CropWaterDutyDeltaCanalDesignOutput(BaseModel):
    crop_duty_d_hectares_cumec: float
    required_canal_discharge_q_cumecs: float
    lacey_regime_velocity_v_m_s: float
    lacey_wetted_perimeter_p_m: float
    lacey_bed_slope_ratio: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CropWaterDutyDeltaCanalDesignEngine(BaseSimulationEngine):
    name = "crop-water-duty-delta-canal-design"
    description = "CE/IRR/S4: Irrigation Engineering — Delta = 8.64 B / D, Lacey's Regime Silt Theory & Kennedy Velocity"

    def calculate(self, params: CropWaterDutyDeltaCanalDesignInput) -> CropWaterDutyDeltaCanalDesignOutput:
        crop_data = {
            "Rice (Delta = 120 cm, Base = 120 days)": (1.20, 120.0),
            "Wheat (Delta = 40 cm, Base = 120 days)": (0.40, 120.0),
            "Sugarcane (Delta = 180 cm, Base = 360 days)": (1.80, 360.0)
        }
        delta_m, base_days = crop_data.get(params.crop_name, (1.20, 120.0))

        # Duty D = (8.64 * B) / Delta
        duty = (8.64 * base_days) / delta_m

        # Canal Discharge Q = CCA / D
        q = params.culturable_command_area_cca_ha / duty

        # Lacey's Silt Theory:
        # V = [ (Q * f^2) / 140 ]^(1/6)
        f = params.canal_silt_factor_f
        v = math.pow((q * (f**2)) / 140.0, 1.0 / 6.0)

        # Wetted perimeter P = 4.75 * sqrt(Q)
        p = 4.75 * math.sqrt(q)

        # Bed slope S = f^(5/3) / [3340 * Q^(1/6)]
        s_denom = 3340.0 * math.pow(q, 1.0 / 6.0) / math.pow(f, 5.0 / 3.0)
        s_str = f"1 in {int(s_denom)}"

        telemetry = {
            "duty": round(duty, 1),
            "q_cumecs": round(q, 3),
            "v_ms": round(v, 3),
            "p_m": round(p, 2),
            "slope": s_str
        }

        return CropWaterDutyDeltaCanalDesignOutput(
            crop_duty_d_hectares_cumec=round(duty, 1),
            required_canal_discharge_q_cumecs=round(q, 3),
            lacey_regime_velocity_v_m_s=round(v, 3),
            lacey_wetted_perimeter_p_m=round(p, 2),
            lacey_bed_slope_ratio=s_str,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "kharif_rice_4500ha": {"crop_name": "Rice (Delta = 120 cm, Base = 120 days)", "culturable_command_area_cca_ha": 4500.0, "canal_silt_factor_f": 1.0},
            "rabi_wheat_8000ha": {"crop_name": "Wheat (Delta = 40 cm, Base = 120 days)", "culturable_command_area_cca_ha": 8000.0, "canal_silt_factor_f": 1.0}
        }
