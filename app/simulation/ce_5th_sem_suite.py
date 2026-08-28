"""
WBSCTE Civil Engineering (CE) 5th Semester Physics Engines
===========================================================
Syllabus Mapped:
1. CE/DRCS/S5:  RCCSinglyReinforcedBeamIS456Engine
2. CE/DRCS/S5:  RCCDoublyReinforcedBeamIS456Engine
3. CE/DRCS/S5:  RCCFlangedTBeamDesignEngine
4. CE/DRCS/S5:  RCCBeamShearDesignStirrupsEngine
5. CE/DRCS/S5:  RCCOneWayTwoWaySlabEngine
6. CE/DRCS/S5:  RCCShortColumnHelicalTiesEngine
7. CE/DRCS/S5:  RCCIsolatedFootingPunchingShearEngine
8. CE/TE2/S5:   RailwaySuperelevationCantDeficiencyEngine
9. CE/TE2/S5:   RailwayTurnoutPointsCrossingEngine
10. CE/TE2/S5:  AirportRunwayLengthCorrectionsEngine
11. CE/GTE2/S5: SoilConsolidationOedometerSettlementEngine
12. CE/GTE2/S5: PileFoundationLoadCapacityEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. RCC Singly Reinforced Beam IS 456 Engine ────────────────────────────
class RCCSinglyReinforcedBeamIS456Input(BaseModel):
    concrete_grade_fck_mpa: float = Field(default=20.0, ge=15.0, le=50.0)
    steel_grade_fy_mpa: float = Field(default=415.0, ge=250.0, le=550.0)
    beam_width_b_mm: float = Field(default=250.0, ge=150.0, le=600.0)
    effective_depth_d_mm: float = Field(default=450.0, ge=200.0, le=1200.0)
    tension_steel_ast_mm2: float = Field(default=942.0, ge=100.0, le=5000.0)


class RCCSinglyReinforcedBeamIS456Output(BaseModel):
    neutral_axis_depth_xu_mm: float
    limiting_neutral_axis_xumax_mm: float
    moment_of_resistance_mu_knm: float
    limiting_moment_mulim_knm: float
    beam_section_failure_mode: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCCSinglyReinforcedBeamIS456Engine(BaseSimulationEngine):
    name = "rcc-singly-reinforced-beam-is456"
    description = "CE/DRCS/S5: RCC Design — IS 456:2000 Singly Reinforced Beam Neutral Axis xu, Limiting Moment Mulim & Section Classification"

    def calculate(self, params: RCCSinglyReinforcedBeamIS456Input) -> RCCSinglyReinforcedBeamIS456Output:
        fck = params.concrete_grade_fck_mpa
        fy = params.steel_grade_fy_mpa
        b = params.beam_width_b_mm
        d = params.effective_depth_d_mm
        ast = params.tension_steel_ast_mm2

        k_max = 0.53 if fy <= 250 else (0.48 if fy <= 415 else 0.46)
        xu_max = k_max * d

        # xu = 0.87 * fy * Ast / (0.36 * fck * b)
        xu = (0.87 * fy * ast) / (0.36 * fck * b)

        mu_lim = 0.36 * fck * b * xu_max * (d - 0.42 * xu_max) * 1e-6  # kNm

        if xu <= xu_max:
            mu = 0.87 * fy * ast * (d - 0.42 * xu) * 1e-6
            mode = "UNDER-REINFORCED (Ductile Tensile Steel Yield Failure — IS 456 Recommended)"
        else:
            mu = mu_lim
            mode = "OVER-REINFORCED (Brittle Concrete Crushing — Redesign to Doubly Reinforced)"

        telemetry = {
            "xu_mm": round(xu, 2),
            "xu_max_mm": round(xu_max, 2),
            "mu_knm": round(mu, 2),
            "mu_lim_knm": round(mu_lim, 2),
            "mode": mode
        }

        return RCCSinglyReinforcedBeamIS456Output(
            neutral_axis_depth_xu_mm=round(xu, 2),
            limiting_neutral_axis_xumax_mm=round(xu_max, 2),
            moment_of_resistance_mu_knm=round(mu, 2),
            limiting_moment_mulim_knm=round(mu_lim, 2),
            beam_section_failure_mode=mode,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "m20_fe415_under_reinforced": {"concrete_grade_fck_mpa": 20.0, "steel_grade_fy_mpa": 415.0, "beam_width_b_mm": 250.0, "effective_depth_d_mm": 450.0, "tension_steel_ast_mm2": 942.0},
            "m25_fe500_heavy_section": {"concrete_grade_fck_mpa": 25.0, "steel_grade_fy_mpa": 500.0, "beam_width_b_mm": 300.0, "effective_depth_d_mm": 550.0, "tension_steel_ast_mm2": 1608.0}
        }


# ── 2. RCC Doubly Reinforced Beam IS 456 Engine ────────────────────────────
class RCCDoublyReinforcedBeamIS456Input(BaseModel):
    concrete_grade_fck_mpa: float = Field(default=20.0, ge=15.0, le=50.0)
    steel_grade_fy_mpa: float = Field(default=415.0, ge=250.0, le=550.0)
    beam_width_b_mm: float = Field(default=250.0, ge=150.0, le=600.0)
    effective_depth_d_mm: float = Field(default=450.0, ge=200.0, le=1200.0)
    effective_cover_d_prime_mm: float = Field(default=45.0, ge=25.0, le=80.0)
    tension_steel_ast_mm2: float = Field(default=1472.0, ge=200.0, le=6000.0)
    compression_steel_asc_mm2: float = Field(default=402.0, ge=100.0, le=3000.0)


class RCCDoublyReinforcedBeamIS456Output(BaseModel):
    limiting_moment_mulim_knm: float
    compression_steel_moment_mu2_knm: float
    total_moment_capacity_mu_knm: float
    compression_steel_stress_fsc_mpa: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCCDoublyReinforcedBeamIS456Engine(BaseSimulationEngine):
    name = "rcc-doubly-reinforced-beam-is456"
    description = "CE/DRCS/S5: RCC Design — IS 456:2000 Doubly Reinforced Rectangular Beam Compression Steel Asc, Stress fsc & Mu"

    def calculate(self, params: RCCDoublyReinforcedBeamIS456Input) -> RCCDoublyReinforcedBeamIS456Output:
        fck = params.concrete_grade_fck_mpa
        fy = params.steel_grade_fy_mpa
        b = params.beam_width_b_mm
        d = params.effective_depth_d_mm
        d_prime = params.effective_cover_d_prime_mm
        asc = params.compression_steel_asc_mm2

        k_max = 0.48 if fy == 415 else (0.53 if fy == 250 else 0.46)
        xu_max = k_max * d
        mu_lim = 0.36 * fck * b * xu_max * (d - 0.42 * xu_max) * 1e-6

        # fsc estimation based on d'/d
        ratio = d_prime / d
        fsc = 353.0 if ratio <= 0.10 else (342.0 if ratio <= 0.15 else 329.0)
        fcc = 0.446 * fck

        # Mu2 = (fsc - fcc) * Asc * (d - d')
        mu2 = (fsc - fcc) * asc * (d - d_prime) * 1e-6
        mu_total = mu_lim + mu2

        telemetry = {
            "mu_lim_knm": round(mu_lim, 2),
            "mu2_knm": round(mu2, 2),
            "mu_total_knm": round(mu_total, 2),
            "fsc_mpa": fsc
        }

        return RCCDoublyReinforcedBeamIS456Output(
            limiting_moment_mulim_knm=round(mu_lim, 2),
            compression_steel_moment_mu2_knm=round(mu2, 2),
            total_moment_capacity_mu_knm=round(mu_total, 2),
            compression_steel_stress_fsc_mpa=fsc,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "m20_fe415_doubly_standard": {"concrete_grade_fck_mpa": 20.0, "steel_grade_fy_mpa": 415.0, "beam_width_b_mm": 250.0, "effective_depth_d_mm": 450.0, "effective_cover_d_prime_mm": 45.0, "tension_steel_ast_mm2": 1472.0, "compression_steel_asc_mm2": 402.0},
            "m25_fe415_heavy_double": {"concrete_grade_fck_mpa": 25.0, "steel_grade_fy_mpa": 415.0, "beam_width_b_mm": 300.0, "effective_depth_d_mm": 500.0, "effective_cover_d_prime_mm": 50.0, "tension_steel_ast_mm2": 2100.0, "compression_steel_asc_mm2": 603.0}
        }


# ── 3. RCC Flanged T-Beam Design Engine ─────────────────────────────────────
class RCCFlangedTBeamDesignInput(BaseModel):
    flange_width_bf_mm: float = Field(default=1200.0, ge=400.0, le=2500.0)
    flange_thickness_df_mm: float = Field(default=120.0, ge=80.0, le=250.0)
    web_width_bw_mm: float = Field(default=250.0, ge=150.0, le=600.0)
    effective_depth_d_mm: float = Field(default=450.0, ge=250.0, le=1200.0)
    tension_steel_ast_mm2: float = Field(default=1885.0, ge=300.0, le=8000.0)
    concrete_fck_mpa: float = Field(default=20.0, ge=15.0, le=50.0)
    steel_fy_mpa: float = Field(default=415.0, ge=250.0, le=550.0)


class RCCFlangedTBeamDesignOutput(BaseModel):
    neutral_axis_depth_xu_mm: float
    neutral_axis_location: str
    moment_of_resistance_mu_knm: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCCFlangedTBeamDesignEngine(BaseSimulationEngine):
    name = "rcc-flanged-t-beam-design"
    description = "CE/DRCS/S5: RCC Design — IS 456 Flanged T-Beam Effective Width bf, Neutral Axis Location & Flexural Capacity"

    def calculate(self, params: RCCFlangedTBeamDesignInput) -> RCCFlangedTBeamDesignOutput:
        bf = params.flange_width_bf_mm
        df = params.flange_thickness_df_mm
        bw = params.web_width_bw_mm
        d = params.effective_depth_d_mm
        ast = params.tension_steel_ast_mm2
        fck = params.concrete_fck_mpa
        fy = params.steel_fy_mpa

        # Assumption 1: xu in flange (xu <= Df)
        xu_flange = (0.87 * fy * ast) / (0.36 * fck * bf)

        if xu_flange <= df:
            xu = xu_flange
            loc = "NEUTRAL AXIS IN FLANGE (xu <= Df — Acts like a Rectangular Beam of width bf)"
            mu = 0.87 * fy * ast * (d - 0.42 * xu) * 1e-6
        else:
            loc = "NEUTRAL AXIS IN WEB (xu > Df — Flange stress block adjusted with yf)"
            xu = ((0.87 * fy * ast) - (0.45 * fck * (bf - bw) * df)) / (0.36 * fck * bw)
            mu = (0.36 * fck * bw * xu * (d - 0.42 * xu) + 0.45 * fck * (bf - bw) * df * (d - 0.5 * df)) * 1e-6

        telemetry = {
            "xu_mm": round(xu, 2),
            "loc": loc,
            "mu_knm": round(mu, 2)
        }

        return RCCFlangedTBeamDesignOutput(
            neutral_axis_depth_xu_mm=round(xu, 2),
            neutral_axis_location=loc,
            moment_of_resistance_mu_knm=round(mu, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "isolated_t_beam_flange_in_flange": {"flange_width_bf_mm": 1200.0, "flange_thickness_df_mm": 120.0, "web_width_bw_mm": 250.0, "effective_depth_d_mm": 450.0, "tension_steel_ast_mm2": 1885.0, "concrete_fck_mpa": 20.0, "steel_fy_mpa": 415.0},
            "heavy_girder_flange_in_web": {"flange_width_bf_mm": 1000.0, "flange_thickness_df_mm": 100.0, "web_width_bw_mm": 300.0, "effective_depth_d_mm": 550.0, "tension_steel_ast_mm2": 3200.0, "concrete_fck_mpa": 25.0, "steel_fy_mpa": 415.0}
        }


# ── 4. RCC Beam Shear Design & Stirrups Engine ──────────────────────────────
class RCCBeamShearDesignStirrupsInput(BaseModel):
    factored_shear_force_vu_kn: float = Field(default=140.0, ge=10.0, le=600.0)
    beam_width_b_mm: float = Field(default=250.0, ge=150.0, le=600.0)
    effective_depth_d_mm: float = Field(default=450.0, ge=200.0, le=1200.0)
    tension_steel_percentage_pt: float = Field(default=1.2, ge=0.15, le=4.0)
    concrete_fck_mpa: float = Field(default=20.0, ge=15.0, le=50.0)
    stirrups_dia_mm: float = Field(default=8.0, ge=6.0, le=16.0)
    stirrup_legs: int = Field(default=2, ge=2, le=4)


class RCCBeamShearDesignStirrupsOutput(BaseModel):
    nominal_shear_stress_tauv_mpa: float
    concrete_shear_strength_tauc_mpa: float
    shear_force_carried_by_steel_vus_kn: float
    recommended_stirrup_spacing_sv_mm: float
    shear_design_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCCBeamShearDesignStirrupsEngine(BaseSimulationEngine):
    name = "rcc-beam-shear-design-stirrups"
    description = "CE/DRCS/S5: RCC Design — IS 456 Nominal Shear Stress tau_v, Concrete tau_c & Vertical Stirrups Spacing sv"

    def calculate(self, params: RCCBeamShearDesignStirrupsInput) -> RCCBeamShearDesignStirrupsOutput:
        vu = params.factored_shear_force_vu_kn
        b = params.beam_width_b_mm
        d = params.effective_depth_d_mm
        pt = params.tension_steel_percentage_pt
        fck = params.concrete_fck_mpa
        dia = params.stirrups_dia_mm
        legs = params.stirrup_legs

        tau_v = (vu * 1000.0) / (b * d)
        tau_c = min(0.85, 0.28 * math.sqrt(fck) * math.pow(pt, 0.33))
        tau_c_max = 0.62 * math.sqrt(fck)

        if tau_v > tau_c_max:
            return RCCBeamShearDesignStirrupsOutput(
                nominal_shear_stress_tauv_mpa=round(tau_v, 3),
                concrete_shear_strength_tauc_mpa=round(tau_c, 3),
                shear_force_carried_by_steel_vus_kn=0.0,
                recommended_stirrup_spacing_sv_mm=0.0,
                shear_design_verdict="REDESIGN BEAM: Nominal shear stress exceeds maximum allowable limit tau_c,max",
                telemetry={"verdict": "FAILED"}
            )

        v_c = tau_c * b * d * 1e-3  # kN
        v_us = max(0.0, vu - v_c)

        asv = legs * (math.pi / 4.0) * (dia**2)

        if v_us > 0:
            sv_calc = (0.87 * 415.0 * asv * d) / (v_us * 1000.0)
            verdict = f"SHEAR REINFORCEMENT REQUIRED: Vus = {v_us:.1f} kN carried by {legs}-legged {dia:.0f}mm stirrups"
        else:
            sv_calc = (0.87 * 415.0 * asv) / (0.4 * b)
            verdict = "MINIMUM SHEAR STIRRUPS REQUIRED (tau_v <= tau_c)"

        sv_max = min(0.75 * d, 300.0, (0.87 * 415.0 * asv) / (0.4 * b))
        sv_rec = min(sv_calc, sv_max)

        telemetry = {
            "tau_v": round(tau_v, 3),
            "tau_c": round(tau_c, 3),
            "v_us_kn": round(v_us, 2),
            "sv_mm": round(sv_rec, 0),
            "verdict": verdict
        }

        return RCCBeamShearDesignStirrupsOutput(
            nominal_shear_stress_tauv_mpa=round(tau_v, 3),
            concrete_shear_strength_tauc_mpa=round(tau_c, 3),
            shear_force_carried_by_steel_vus_kn=round(v_us, 2),
            recommended_stirrup_spacing_sv_mm=round(sv_rec, 0),
            shear_design_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "beam_vu_140kn": {"factored_shear_force_vu_kn": 140.0, "beam_width_b_mm": 250.0, "effective_depth_d_mm": 450.0, "tension_steel_percentage_pt": 1.2, "concrete_fck_mpa": 20.0, "stirrups_dia_mm": 8.0, "stirrup_legs": 2},
            "heavy_girder_vu_300kn": {"factored_shear_force_vu_kn": 300.0, "beam_width_b_mm": 300.0, "effective_depth_d_mm": 600.0, "tension_steel_percentage_pt": 1.8, "concrete_fck_mpa": 25.0, "stirrups_dia_mm": 10.0, "stirrup_legs": 2}
        }


# ── 5. RCC One-Way & Two-Way Slab Engine ────────────────────────────────────
class RCCOneWayTwoWaySlabInput(BaseModel):
    short_span_lx_m: float = Field(default=3.5, ge=1.5, le=8.0)
    long_span_ly_m: float = Field(default=4.5, ge=1.5, le=15.0)
    total_factored_load_w_kn_m2: float = Field(default=10.5, ge=4.0, le=30.0)
    slab_type: Literal["Two-Way Restrained Slab (Ly/Lx <= 2)", "One-Way Slab (Ly/Lx > 2)"] = "Two-Way Restrained Slab (Ly/Lx <= 2)"
    concrete_fck_mpa: float = Field(default=20.0, ge=15.0, le=40.0)
    steel_fy_mpa: float = Field(default=415.0, ge=250.0, le=550.0)


class RCCOneWayTwoWaySlabOutput(BaseModel):
    aspect_ratio_r: float
    design_moment_short_span_mux_knm_m: float
    design_moment_long_span_muy_knm_m: float
    torsional_corner_mesh_required: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCCOneWayTwoWaySlabEngine(BaseSimulationEngine):
    name = "rcc-one-way-two-way-slab"
    description = "CE/DRCS/S5: RCC Design — IS 456 One-Way & Two-Way Restrained Slab Bending Moments Mux, Muy & Torsional Mesh"

    def calculate(self, params: RCCOneWayTwoWaySlabInput) -> RCCOneWayTwoWaySlabOutput:
        lx = params.short_span_lx_m
        ly = params.long_span_ly_m
        w = params.total_factored_load_w_kn_m2
        r = ly / lx

        if r > 2.0:
            # One-way slab action
            mux = (w * (lx**2)) / 8.0
            muy = 0.15 * mux  # Distribution steel moment
            mesh = "NOT REQUIRED (One-way slab action dominates)"
        else:
            # Two-way slab (IS 456 Table 26 coefficients approximation)
            alpha_x = 0.053
            alpha_y = 0.032
            mux = alpha_x * w * (lx**2)
            muy = alpha_y * w * (lx**2)
            mesh = f"REQUIRED: Provide 75% Ast,x corner mesh in 4 layers over length {lx/5.0:.2f} m"

        telemetry = {
            "r": round(r, 3),
            "mux_knm": round(mux, 2),
            "muy_knm": round(muy, 2),
            "mesh": mesh
        }

        return RCCOneWayTwoWaySlabOutput(
            aspect_ratio_r=round(r, 3),
            design_moment_short_span_mux_knm_m=round(mux, 2),
            design_moment_long_span_muy_knm_m=round(muy, 2),
            torsional_corner_mesh_required=mesh,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "two_way_room_slab_3_5x4_5m": {"short_span_lx_m": 3.5, "long_span_ly_m": 4.5, "total_factored_load_w_kn_m2": 10.5, "slab_type": "Two-Way Restrained Slab (Ly/Lx <= 2)", "concrete_fck_mpa": 20.0, "steel_fy_mpa": 415.0},
            "one_way_corridor_slab_2x6m": {"short_span_lx_m": 2.0, "long_span_ly_m": 6.0, "total_factored_load_w_kn_m2": 12.0, "slab_type": "One-Way Slab (Ly/Lx > 2)", "concrete_fck_mpa": 20.0, "steel_fy_mpa": 415.0}
        }


# ── 6. RCC Short Column & Helical Ties Engine ───────────────────────────────
class RCCShortColumnHelicalTiesInput(BaseModel):
    column_width_b_mm: float = Field(default=300.0, ge=200.0, le=1000.0)
    column_depth_d_mm: float = Field(default=400.0, ge=200.0, le=1000.0)
    unsupported_length_l_m: float = Field(default=3.0, ge=2.0, le=8.0)
    concrete_fck_mpa: float = Field(default=20.0, ge=15.0, le=50.0)
    steel_fy_mpa: float = Field(default=415.0, ge=250.0, le=550.0)
    steel_percentage_p_pct: float = Field(default=1.5, ge=0.8, le=6.0)
    tie_type: Literal["Lateral Ties", "Helical Reinforcement"] = "Lateral Ties"


class RCCShortColumnHelicalTiesOutput(BaseModel):
    gross_area_ag_mm2: float
    axial_load_capacity_pu_kn: float
    minimum_eccentricity_emin_mm: float
    slenderness_ratio: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCCShortColumnHelicalTiesEngine(BaseSimulationEngine):
    name = "rcc-short-column-helical-ties"
    description = "CE/DRCS/S5: RCC Design — IS 456 Axially Loaded Short Column Pu = 0.4 fck Ac + 0.67 fy Asc & Helical Spiral Gain"

    def calculate(self, params: RCCShortColumnHelicalTiesInput) -> RCCShortColumnHelicalTiesOutput:
        b = params.column_width_b_mm
        d = params.column_depth_d_mm
        l = params.unsupported_length_l_m * 1000.0
        fck = params.concrete_fck_mpa
        fy = params.steel_fy_mpa
        p = params.steel_percentage_p_pct / 100.0

        ag = b * d
        asc = p * ag
        ac = ag - asc

        # emin = L / 500 + D / 30 (min 20mm)
        e_min = max(20.0, (l / 500.0) + (d / 30.0))
        slenderness = l / min(b, d)

        # Pu = 0.4 * fck * Ac + 0.67 * fy * Asc
        pu = (0.4 * fck * ac + 0.67 * fy * asc) * 1e-3  # kN

        if params.tie_type == "Helical Reinforcement":
            pu *= 1.05  # 5% capacity gain per IS 456

        telemetry = {
            "ag_mm2": round(ag, 0),
            "pu_kn": round(pu, 2),
            "emin_mm": round(e_min, 1),
            "slenderness": round(slenderness, 2)
        }

        return RCCShortColumnHelicalTiesOutput(
            gross_area_ag_mm2=round(ag, 0),
            axial_load_capacity_pu_kn=round(pu, 2),
            minimum_eccentricity_emin_mm=round(e_min, 1),
            slenderness_ratio=round(slenderness, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "short_column_300x400_ties": {"column_width_b_mm": 300.0, "column_depth_d_mm": 400.0, "unsupported_length_l_m": 3.0, "concrete_fck_mpa": 20.0, "steel_fy_mpa": 415.0, "steel_percentage_p_pct": 1.5, "tie_type": "Lateral Ties"},
            "circular_spiral_column_400dia": {"column_width_b_mm": 400.0, "column_depth_d_mm": 400.0, "unsupported_length_l_m": 3.5, "concrete_fck_mpa": 25.0, "steel_fy_mpa": 415.0, "steel_percentage_p_pct": 2.0, "tie_type": "Helical Reinforcement"}
        }


# ── 7. RCC Isolated Footing & Punching Shear Engine ─────────────────────────
class RCCIsolatedFootingPunchingShearInput(BaseModel):
    column_axial_load_p_kn: float = Field(default=900.0, ge=100.0, le=3000.0)
    soil_safe_bearing_capacity_sbc_kpa: float = Field(default=180.0, ge=80.0, le=500.0)
    column_side_a_mm: float = Field(default=350.0, ge=200.0, le=800.0)
    footing_depth_d_mm: float = Field(default=450.0, ge=200.0, le=1000.0)
    concrete_fck_mpa: float = Field(default=20.0, ge=15.0, le=40.0)
    steel_fy_mpa: float = Field(default=415.0, ge=250.0, le=550.0)


class RCCIsolatedFootingPunchingShearOutput(BaseModel):
    required_footing_side_b_m: float
    factored_soil_pressure_qu_kpa: float
    punching_shear_stress_tauvp_mpa: float
    permissible_punching_stress_taucp_mpa: float
    punching_shear_safety_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RCCIsolatedFootingPunchingShearEngine(BaseSimulationEngine):
    name = "rcc-isolated-footing-punching-shear"
    description = "CE/DRCS/S5: RCC Design — IS 456 Isolated Footing Sizing, Upward Pressure qu & Two-Way Punching Shear Check"

    def calculate(self, params: RCCIsolatedFootingPunchingShearInput) -> RCCIsolatedFootingPunchingShearOutput:
        p = params.column_axial_load_p_kn
        sbc = params.soil_safe_bearing_capacity_sbc_kpa
        a = params.column_side_a_mm
        d = params.footing_depth_d_mm
        fck = params.concrete_fck_mpa

        # Footing area with 10% self-weight
        area_req = (1.10 * p) / sbc
        b_side = math.ceil(math.sqrt(area_req) * 10.0) / 10.0  # rounded up to 0.1m

        # Factored soil pressure
        qu = (1.5 * p) / (b_side**2)  # kPa

        # Punching perimeter at d/2
        bo = 4.0 * (a + d)
        crit_area = ((a + d) / 1000.0)**2
        v_up = 1.5 * p - (qu * crit_area)

        tau_vp = (v_up * 1000.0) / (bo * d)
        tau_cp = 0.25 * math.sqrt(fck)

        status = "SAFE IN PUNCHING SHEAR (tau_vp <= tau_cp per IS 456)" if tau_vp <= tau_cp else "UNSAFE: Increase Footing Depth d"

        telemetry = {
            "b_m": round(b_side, 2),
            "qu_kpa": round(qu, 2),
            "tau_vp": round(tau_vp, 3),
            "tau_cp": round(tau_cp, 3),
            "status": status
        }

        return RCCIsolatedFootingPunchingShearOutput(
            required_footing_side_b_m=round(b_side, 2),
            factored_soil_pressure_qu_kpa=round(qu, 2),
            punching_shear_stress_tauvp_mpa=round(tau_vp, 3),
            permissible_punching_stress_taucp_mpa=round(tau_cp, 3),
            punching_shear_safety_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "column_900kn_sbc180": {"column_axial_load_p_kn": 900.0, "soil_safe_bearing_capacity_sbc_kpa": 180.0, "column_side_a_mm": 350.0, "footing_depth_d_mm": 450.0, "concrete_fck_mpa": 20.0, "steel_fy_mpa": 415.0},
            "heavy_column_1500kn_sbc250": {"column_axial_load_p_kn": 1500.0, "soil_safe_bearing_capacity_sbc_kpa": 250.0, "column_side_a_mm": 450.0, "footing_depth_d_mm": 550.0, "concrete_fck_mpa": 25.0, "steel_fy_mpa": 415.0}
        }


# ── 8. Railway Superelevation & Cant Deficiency Engine ──────────────────────
class RailwaySuperelevationCantDeficiencyInput(BaseModel):
    track_gauge_g_m: float = Field(default=1.676, ge=1.0, le=1.7)
    curve_radius_r_m: float = Field(default=600.0, ge=150.0, le=2500.0)
    train_speed_v_kmph: float = Field(default=80.0, ge=30.0, le=160.0)
    max_cant_deficiency_cd_mm: float = Field(default=76.0, ge=50.0, le=100.0)


class RailwaySuperelevationCantDeficiencyOutput(BaseModel):
    equilibrium_cant_ceq_mm: float
    actual_cant_provided_cact_mm: float
    max_safe_speed_vmax_kmph: float
    indian_railway_cant_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RailwaySuperelevationCantDeficiencyEngine(BaseSimulationEngine):
    name = "railway-superelevation-cant-deficiency"
    description = "CE/TE2/S5: Railway Track — Broad Gauge Equilibrium Cant C = G V^2 / (127 R), Cant Deficiency & Max Speed"

    def calculate(self, params: RailwaySuperelevationCantDeficiencyInput) -> RailwaySuperelevationCantDeficiencyOutput:
        g = params.track_gauge_g_m
        r = params.curve_radius_r_m
        v = params.train_speed_v_kmph
        cd = params.max_cant_deficiency_cd_mm

        # Equilibrium Cant C = G * V^2 / (127 * R)
        c_eq_m = (g * (v**2)) / (127.0 * r)
        c_eq_mm = c_eq_m * 1000.0

        # Actual Cant Provided = C_eq - C_d (max 165 mm for BG)
        c_act_mm = max(0.0, min(165.0, c_eq_mm - cd))

        # Max safe speed Vmax = 4.35 * sqrt(R - 67)
        v_max = 4.35 * math.sqrt(max(1.0, r - 67.0))

        verdict = f"CANT COMPLIANT: Actual cant {c_act_mm:.1f} mm with CD = {cd:.0f} mm (Vmax = {v_max:.1f} km/h)"

        telemetry = {
            "c_eq_mm": round(c_eq_mm, 1),
            "c_act_mm": round(c_act_mm, 1),
            "v_max": round(v_max, 1),
            "verdict": verdict
        }

        return RailwaySuperelevationCantDeficiencyOutput(
            equilibrium_cant_ceq_mm=round(c_eq_mm, 1),
            actual_cant_provided_cact_mm=round(c_act_mm, 1),
            max_safe_speed_vmax_kmph=round(v_max, 1),
            indian_railway_cant_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "broad_gauge_radius_600m_80kmph": {"track_gauge_g_m": 1.676, "curve_radius_r_m": 600.0, "train_speed_v_kmph": 80.0, "max_cant_deficiency_cd_mm": 76.0},
            "high_speed_bg_radius_1200m_130kmph": {"track_gauge_g_m": 1.676, "curve_radius_r_m": 1200.0, "train_speed_v_kmph": 130.0, "max_cant_deficiency_cd_mm": 100.0}
        }


# ── 9. Railway Turnout Points & Crossing Engine ─────────────────────────────
class RailwayTurnoutPointsCrossingInput(BaseModel):
    turnout_ratio_n: float = Field(default=12.0, ge=6.0, le=20.0)
    gauge_g_m: float = Field(default=1.676, ge=1.0, le=1.7)
    heel_divergence_d_m: float = Field(default=0.133, ge=0.08, le=0.20)
    switch_type: Literal["1 in 12 Broad Gauge High-Speed Turnout", "1 in 8.5 Broad Gauge Yard Turnout"] = "1 in 12 Broad Gauge High-Speed Turnout"


class RailwayTurnoutPointsCrossingOutput(BaseModel):
    crossing_angle_deg: float
    curve_lead_cl_m: float
    switch_lead_sl_m: float
    turnout_curve_radius_r_m: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RailwayTurnoutPointsCrossingEngine(BaseSimulationEngine):
    name = "railway-turnout-points-crossing"
    description = "CE/TE2/S5: Railway Track — 1 in 12 / 1 in 8.5 Turnout Geometry, Crossing Angle alpha, Curve Lead CL & Radius R"

    def calculate(self, params: RailwayTurnoutPointsCrossingInput) -> RailwayTurnoutPointsCrossingOutput:
        n = params.turnout_ratio_n
        g = params.gauge_g_m
        d = params.heel_divergence_d_m

        # Crossing angle alpha = cot^-1(N)
        alpha_rad = math.atan(1.0 / n)
        alpha_deg = math.degrees(alpha_rad)

        # Curve Lead CL = 2 * G * N
        cl = 2.0 * g * n

        # Radius R = 2 * G * N^2
        r = 2.0 * g * (n**2)

        # Switch Lead SL = sqrt(2 * R * d)
        sl = math.sqrt(2.0 * r * d)

        telemetry = {
            "alpha_deg": round(alpha_deg, 3),
            "cl_m": round(cl, 2),
            "sl_m": round(sl, 2),
            "r_m": round(r, 1)
        }

        return RailwayTurnoutPointsCrossingOutput(
            crossing_angle_deg=round(alpha_deg, 3),
            curve_lead_cl_m=round(cl, 2),
            switch_lead_sl_m=round(sl, 2),
            turnout_curve_radius_r_m=round(r, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "1_in_12_bg_mainline": {"turnout_ratio_n": 12.0, "gauge_g_m": 1.676, "heel_divergence_d_m": 0.133, "switch_type": "1 in 12 Broad Gauge High-Speed Turnout"},
            "1_in_8_5_bg_yard": {"turnout_ratio_n": 8.5, "gauge_g_m": 1.676, "heel_divergence_d_m": 0.120, "switch_type": "1 in 8.5 Broad Gauge Yard Turnout"}
        }


# ── 10. Airport Runway Length Corrections Engine ────────────────────────────
class AirportRunwayLengthCorrectionsInput(BaseModel):
    basic_runway_length_lo_m: float = Field(default=2000.0, ge=800.0, le=4000.0)
    airport_elevation_msl_m: float = Field(default=600.0, ge=0.0, le=3000.0)
    airport_reference_temp_art_degc: float = Field(default=35.0, ge=10.0, le=50.0)
    effective_runway_gradient_pct: float = Field(default=0.8, ge=0.0, le=2.0)


class AirportRunwayLengthCorrectionsOutput(BaseModel):
    elevation_corrected_length_l1_m: float
    temperature_corrected_length_l2_m: float
    gradient_corrected_final_length_m: float
    icao_total_correction_percentage: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AirportRunwayLengthCorrectionsEngine(BaseSimulationEngine):
    name = "airport-runway-length-corrections"
    description = "CE/TE2/S5: Airport Engineering — ICAO Runway Length Elevation (+7%/300m), Temperature & Gradient Corrections"

    def calculate(self, params: AirportRunwayLengthCorrectionsInput) -> AirportRunwayLengthCorrectionsOutput:
        l0 = params.basic_runway_length_lo_m
        elev = params.airport_elevation_msl_m
        art = params.airport_reference_temp_art_degc
        grad = params.effective_runway_gradient_pct

        # 1. Elevation correction: +7% per 300m elevation
        l1 = l0 * (1.0 + 0.07 * (elev / 300.0))

        # 2. Temperature correction: +1% per 1°C rise above standard temp
        t_std = 15.0 - 0.0065 * elev
        t_diff = max(0.0, art - t_std)
        l2 = l1 * (1.0 + 0.01 * t_diff)

        # 3. Gradient correction: +20% per 1% effective gradient
        l_final = l2 * (1.0 + 0.20 * grad)

        pct_inc = ((l_final - l0) / l0) * 100.0

        telemetry = {
            "l0_m": l0,
            "l1_m": round(l1, 1),
            "l2_m": round(l2, 1),
            "l_final_m": round(l_final, 1),
            "pct_inc": round(pct_inc, 1)
        }

        return AirportRunwayLengthCorrectionsOutput(
            elevation_corrected_length_l1_m=round(l1, 1),
            temperature_corrected_length_l2_m=round(l2, 1),
            gradient_corrected_final_length_m=round(l_final, 1),
            icao_total_correction_percentage=round(pct_inc, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "regional_airport_600m_elev": {"basic_runway_length_lo_m": 2000.0, "airport_elevation_msl_m": 600.0, "airport_reference_temp_art_degc": 35.0, "effective_runway_gradient_pct": 0.8},
            "high_altitude_leh_3000m": {"basic_runway_length_lo_m": 2200.0, "airport_elevation_msl_m": 3000.0, "airport_reference_temp_art_degc": 28.0, "effective_runway_gradient_pct": 1.2}
        }


# ── 11. Soil Consolidation Oedometer Settlement Engine ───────────────────────
class SoilConsolidationOedometerSettlementInput(BaseModel):
    initial_void_ratio_eo: float = Field(default=0.85, ge=0.4, le=2.0)
    clay_layer_thickness_ho_m: float = Field(default=4.0, ge=1.0, le=15.0)
    initial_effective_stress_sigma0_kpa: float = Field(default=100.0, ge=20.0, le=500.0)
    additional_stress_increment_dsigma_kpa: float = Field(default=50.0, ge=10.0, le=300.0)
    liquid_limit_ll_pct: float = Field(default=45.0, ge=25.0, le=80.0)
    time_for_50pct_consolidation_t50_min: float = Field(default=12.5, ge=2.0, le=60.0)
    drainage_path_d_m: float = Field(default=0.01, ge=0.005, le=0.05)


class SoilConsolidationOedometerSettlementOutput(BaseModel):
    compression_index_cc: float
    total_primary_settlement_sc_mm: float
    coefficient_of_consolidation_cv_m2_s: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SoilConsolidationOedometerSettlementEngine(BaseSimulationEngine):
    name = "soil-consolidation-oedometer-settlement"
    description = "CE/GTE2/S5: Soil Mechanics — Terzaghi 1D Consolidation Oedometer Sc = Cc H0 / (1+e0) log10((sigma0+dsigma)/sigma0)"

    def calculate(self, params: SoilConsolidationOedometerSettlementInput) -> SoilConsolidationOedometerSettlementOutput:
        e0 = params.initial_void_ratio_eo
        h0 = params.clay_layer_thickness_ho_m
        sig0 = params.initial_effective_stress_sigma0_kpa
        dsig = params.additional_stress_increment_dsigma_kpa
        ll = params.liquid_limit_ll_pct
        t50_s = params.time_for_50pct_consolidation_t50_min * 60.0
        d = params.drainage_path_d_m

        # Compression Index Cc = 0.009 * (LL - 10)
        cc = 0.009 * (ll - 10.0)

        # Sc = Cc * H0 / (1 + e0) * log10((sig0 + dsig) / sig0)
        sc_m = (cc * h0 / (1.0 + e0)) * math.log10((sig0 + dsig) / sig0)
        sc_mm = sc_m * 1000.0

        # cv = Tv * d^2 / t50  (Tv for 50% = 0.197)
        cv = (0.197 * (d**2)) / max(1.0, t50_s)

        telemetry = {
            "cc": round(cc, 3),
            "sc_mm": round(sc_mm, 1),
            "cv_m2_s": f"{cv:.3e}"
        }

        return SoilConsolidationOedometerSettlementOutput(
            compression_index_cc=round(cc, 3),
            total_primary_settlement_sc_mm=round(sc_mm, 1),
            coefficient_of_consolidation_cv_m2_s=round(cv, 9),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "normally_consolidated_clay_4m": {"initial_void_ratio_eo": 0.85, "clay_layer_thickness_ho_m": 4.0, "initial_effective_stress_sigma0_kpa": 100.0, "additional_stress_increment_dsigma_kpa": 50.0, "liquid_limit_ll_pct": 45.0, "time_for_50pct_consolidation_t50_min": 12.5, "drainage_path_d_m": 0.01},
            "soft_estuarine_clay_8m": {"initial_void_ratio_eo": 1.20, "clay_layer_thickness_ho_m": 8.0, "initial_effective_stress_sigma0_kpa": 80.0, "additional_stress_increment_dsigma_kpa": 60.0, "liquid_limit_ll_pct": 65.0, "time_for_50pct_consolidation_t50_min": 25.0, "drainage_path_d_m": 0.01}
        }


# ── 12. Pile Foundation Load Capacity Engine ────────────────────────────────
class PileFoundationLoadCapacityInput(BaseModel):
    pile_type: Literal["Bored Cast-in-Situ RCC Pile", "Driven Precast Concrete Pile"] = "Bored Cast-in-Situ RCC Pile"
    pile_diameter_d_m: float = Field(default=0.6, ge=0.3, le=1.5)
    pile_length_l_m: float = Field(default=15.0, ge=5.0, le=35.0)
    soil_undrained_cohesion_cu_kpa: float = Field(default=60.0, ge=20.0, le=150.0)
    adhesion_factor_alpha: float = Field(default=0.6, ge=0.3, le=1.0)
    factor_of_safety: float = Field(default=2.5, ge=2.0, le=3.5)


class PileFoundationLoadCapacityOutput(BaseModel):
    ultimate_end_bearing_qb_kn: float
    ultimate_skin_friction_qs_kn: float
    total_ultimate_capacity_qu_kn: float
    safe_allowable_working_load_qsafe_kn: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PileFoundationLoadCapacityEngine(BaseSimulationEngine):
    name = "pile-foundation-load-capacity"
    description = "CE/GTE2/S5: Deep Foundations — Pile Ultimate Axial Capacity Qu = Qb + Qs = 9 cu Ab + alpha cu As"

    def calculate(self, params: PileFoundationLoadCapacityInput) -> PileFoundationLoadCapacityOutput:
        d = params.pile_diameter_d_m
        l = params.pile_length_l_m
        cu = params.soil_undrained_cohesion_cu_kpa
        alpha = params.adhesion_factor_alpha
        fs = params.factor_of_safety

        ab = (math.pi / 4.0) * (d**2)
        as_area = math.pi * d * l

        # End bearing Qb = 9 * cu * Ab
        qb = 9.0 * cu * ab

        # Skin friction Qs = alpha * cu * As
        qs = alpha * cu * as_area

        qu = qb + qs
        q_safe = qu / fs

        telemetry = {
            "qb_kn": round(qb, 2),
            "qs_kn": round(qs, 2),
            "qu_kn": round(qu, 2),
            "qsafe_kn": round(q_safe, 2)
        }

        return PileFoundationLoadCapacityOutput(
            ultimate_end_bearing_qb_kn=round(qb, 2),
            ultimate_skin_friction_qs_kn=round(qs, 2),
            total_ultimate_capacity_qu_kn=round(qu, 2),
            safe_allowable_working_load_qsafe_kn=round(q_safe, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "bored_pile_600mm_15m": {"pile_type": "Bored Cast-in-Situ RCC Pile", "pile_diameter_d_m": 0.6, "pile_length_l_m": 15.0, "soil_undrained_cohesion_cu_kpa": 60.0, "adhesion_factor_alpha": 0.6, "factor_of_safety": 2.5},
            "driven_pile_450mm_20m": {"pile_type": "Driven Precast Concrete Pile", "pile_diameter_d_m": 0.45, "pile_length_l_m": 20.0, "soil_undrained_cohesion_cu_kpa": 80.0, "adhesion_factor_alpha": 0.5, "factor_of_safety": 2.5}
        }
