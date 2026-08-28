"""
WBSCTE Civil Engineering (CE) 6th Semester Physics Engines
===========================================================
Syllabus Mapped:
1. CE/DSS/S6:  IS800SteelBoltedWeldedConnectionEngine
2. CE/DSS/S6:  IS800SteelTensionMemberNetSectionEngine
3. CE/DSS/S6:  IS800SteelColumnBucklingCurvesEngine
4. CE/DSS/S6:  IS800SteelBeamBendingWebCripplingEngine
5. CE/EE/S6:   IS1893SeismicBaseShearDistributionEngine
6. CE/EE/S6:   IS13920DuctileDetailingConfinementEngine
7. CE/WRE/S6:  ConcreteGravityDamStabilityAnalysisEngine
8. CE/WRE/S6:  FlownetSeepageExitGradientPipingEngine
9. CE/WRE/S6:  UnitHydrographFloodRoutingRationalEngine
10. CE/MRS/S6: ReboundHammerUPVNDTTestingEngine
11. CE/MRS/S6: StructuralRetrofittingFRPJacketingEngine
12. CE/MI/S6:  MicroIrrigationDripSprinklerUniformityEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. IS 800 Steel Bolted & Welded Connection Engine ───────────────────────
class IS800SteelBoltedWeldedConnectionInput(BaseModel):
    bolt_diameter_d_mm: float = Field(default=20.0, ge=12.0, le=36.0)
    bolt_grade: Literal["4.6 Grade (fub = 400 MPa, fyb = 240 MPa)", "8.8 Grade (fub = 800 MPa, fyb = 640 MPa)"] = "4.6 Grade (fub = 400 MPa, fyb = 240 MPa)"
    plate_thickness_t_mm: float = Field(default=10.0, ge=4.0, le=40.0)
    fillet_weld_size_s_mm: float = Field(default=6.0, ge=3.0, le=20.0)
    weld_length_l_mm: float = Field(default=150.0, ge=30.0, le=600.0)


class IS800SteelBoltedWeldedConnectionOutput(BaseModel):
    bolt_single_shear_capacity_vdsb_kn: float
    bolt_bearing_capacity_vdpb_kn: float
    design_bolt_value_kn: float
    fillet_weld_design_strength_pw_kn: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IS800SteelBoltedWeldedConnectionEngine(BaseSimulationEngine):
    name = "is800-steel-bolted-welded-connection"
    description = "CE/DSS/S6: Steel Design — IS 800:2007 Bolted Connection Shear Vdsb, Bearing Vdpb & Fillet Weld Strength Pw"

    def calculate(self, params: IS800SteelBoltedWeldedConnectionInput) -> IS800SteelBoltedWeldedConnectionOutput:
        d = params.bolt_diameter_d_mm
        fub = 800.0 if "8.8" in params.bolt_grade else 400.0
        t = params.plate_thickness_t_mm
        s = params.fillet_weld_size_s_mm
        l_w = params.weld_length_l_mm
        fu = 410.0  # E250 steel plate

        # Bolt shear capacity Vdsb = (fub / (sqrt(3) * 1.25)) * Anb
        anb = 0.78 * (math.pi / 4.0) * (d**2)
        v_dsb = (fub / (math.sqrt(3) * 1.25)) * anb * 1e-3  # kN

        # Bolt bearing capacity Vdpb = (2.5 * kb * d * t * fu) / 1.25  (kb ~ 0.5)
        kb = 0.5
        v_dpb = (2.5 * kb * d * t * fu / 1.25) * 1e-3  # kN

        bolt_val = min(v_dsb, v_dpb)

        # Fillet weld strength Pw = fwd * tt * Lw
        f_wd = fu / (math.sqrt(3) * 1.25)
        t_t = 0.707 * s
        p_w = f_wd * t_t * l_w * 1e-3  # kN

        telemetry = {
            "vdsb_kn": round(v_dsb, 2),
            "vdpb_kn": round(v_dpb, 2),
            "bolt_val_kn": round(bolt_val, 2),
            "pw_kn": round(p_w, 2)
        }

        return IS800SteelBoltedWeldedConnectionOutput(
            bolt_single_shear_capacity_vdsb_kn=round(v_dsb, 2),
            bolt_bearing_capacity_vdpb_kn=round(v_dpb, 2),
            design_bolt_value_kn=round(bolt_val, 2),
            fillet_weld_design_strength_pw_kn=round(p_w, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "m20_grade46_lap_joint": {"bolt_diameter_d_mm": 20.0, "bolt_grade": "4.6 Grade (fub = 400 MPa, fyb = 240 MPa)", "plate_thickness_t_mm": 10.0, "fillet_weld_size_s_mm": 6.0, "weld_length_l_mm": 150.0},
            "m24_grade88_heavy_shear": {"bolt_diameter_d_mm": 24.0, "bolt_grade": "8.8 Grade (fub = 800 MPa, fyb = 640 MPa)", "plate_thickness_t_mm": 16.0, "fillet_weld_size_s_mm": 8.0, "weld_length_l_mm": 200.0}
        }


# ── 2. IS 800 Steel Tension Member & Net Section Engine ─────────────────────
class IS800SteelTensionMemberNetSectionInput(BaseModel):
    gross_area_ag_mm2: float = Field(default=1500.0, ge=300.0, le=6000.0)
    connected_leg_area_anc_mm2: float = Field(default=750.0, ge=150.0, le=3000.0)
    outstanding_leg_area_ago_mm2: float = Field(default=650.0, ge=100.0, le=3000.0)
    yield_strength_fy_mpa: float = Field(default=250.0, ge=230.0, le=450.0)
    ultimate_strength_fu_mpa: float = Field(default=410.0, ge=380.0, le=600.0)
    shear_lag_beta: float = Field(default=1.05, ge=0.7, le=1.4)


class IS800SteelTensionMemberNetSectionOutput(BaseModel):
    gross_section_yielding_strength_tdg_kn: float
    net_section_rupture_strength_tdn_kn: float
    design_tension_capacity_td_kn: float
    governing_tension_failure_mode: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IS800SteelTensionMemberNetSectionEngine(BaseSimulationEngine):
    name = "is800-steel-tension-member-net-section"
    description = "CE/DSS/S6: Steel Design — IS 800 Tension Member Gross Yielding Tdg, Net Section Rupture Tdn & Shear Lag"

    def calculate(self, params: IS800SteelTensionMemberNetSectionInput) -> IS800SteelTensionMemberNetSectionOutput:
        ag = params.gross_area_ag_mm2
        anc = params.connected_leg_area_anc_mm2
        ago = params.outstanding_leg_area_ago_mm2
        fy = params.yield_strength_fy_mpa
        fu = params.ultimate_strength_fu_mpa
        beta = params.shear_lag_beta

        # Tdg = Ag * fy / gamma_m0
        t_dg = (ag * fy / 1.10) * 1e-3

        # Tdn = 0.9 * Anc * fu / gamma_m1 + beta * Ago * fy / gamma_m0
        t_dn = ((0.9 * anc * fu / 1.25) + (beta * ago * fy / 1.10)) * 1e-3

        t_d = min(t_dg, t_dn)
        mode = "GROSS SECTION YIELDING (Tdg governs)" if t_dg <= t_dn else "NET SECTION RUPTURE (Tdn governs)"

        telemetry = {
            "tdg_kn": round(t_dg, 2),
            "tdn_kn": round(t_dn, 2),
            "td_kn": round(t_d, 2),
            "mode": mode
        }

        return IS800SteelTensionMemberNetSectionOutput(
            gross_section_yielding_strength_tdg_kn=round(t_dg, 2),
            net_section_rupture_strength_tdn_kn=round(t_dn, 2),
            design_tension_capacity_td_kn=round(t_d, 2),
            governing_tension_failure_mode=mode,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "isa_90x60x8_single_angle": {"gross_area_ag_mm2": 1136.0, "connected_leg_area_anc_mm2": 620.0, "outstanding_leg_area_ago_mm2": 450.0, "yield_strength_fy_mpa": 250.0, "ultimate_strength_fu_mpa": 410.0, "shear_lag_beta": 1.05},
            "isa_100x100x10_heavy_angle": {"gross_area_ag_mm2": 1900.0, "connected_leg_area_anc_mm2": 950.0, "outstanding_leg_area_ago_mm2": 850.0, "yield_strength_fy_mpa": 250.0, "ultimate_strength_fu_mpa": 410.0, "shear_lag_beta": 1.10}
        }


# ── 3. IS 800 Steel Column Buckling Curves Engine ───────────────────────────
class IS800SteelColumnBucklingCurvesInput(BaseModel):
    effective_length_kl_m: float = Field(default=3.5, ge=1.0, le=10.0)
    radius_of_gyration_r_mm: float = Field(default=45.0, ge=15.0, le=150.0)
    cross_section_area_ae_mm2: float = Field(default=4500.0, ge=800.0, le=25000.0)
    yield_strength_fy_mpa: float = Field(default=250.0, ge=230.0, le=450.0)
    buckling_class: Literal["Buckling Class c (Rolled I-Sections & Built-up)", "Buckling Class a (Hot rolled / Stress relieved)", "Buckling Class b (Welded I-sections)", "Buckling Class d (Thick plates)"] = "Buckling Class c (Rolled I-Sections & Built-up)"


class IS800SteelColumnBucklingCurvesOutput(BaseModel):
    slenderness_ratio_lambda: float
    design_compressive_stress_fcd_mpa: float
    axial_compressive_capacity_pd_kn: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IS800SteelColumnBucklingCurvesEngine(BaseSimulationEngine):
    name = "is800-steel-column-buckling-curves"
    description = "CE/DSS/S6: Steel Design — IS 800 Column Slenderness lambda, Buckling Classes a/b/c/d & Compressive Capacity Pd"

    def calculate(self, params: IS800SteelColumnBucklingCurvesInput) -> IS800SteelColumnBucklingCurvesOutput:
        kl_mm = params.effective_length_kl_m * 1000.0
        r = params.radius_of_gyration_r_mm
        ae = params.cross_section_area_ae_mm2
        fy = params.yield_strength_fy_mpa

        # Slenderness lambda = kL / r
        lam = kl_mm / r

        # Euler buckling stress fcc = pi^2 * E / lambda^2  (E = 2e5 MPa)
        f_cc = (math.pi**2 * 200000.0) / (lam**2)
        lam_0 = math.sqrt(fy / f_cc)

        alpha = 0.49 if "c" in params.buckling_class else (0.21 if "a" in params.buckling_class else (0.34 if "b" in params.buckling_class else 0.76))

        phi = 0.5 * (1.0 + alpha * (lam_0 - 0.2) + lam_0**2)
        chi = 1.0 / (phi + math.sqrt(max(0.001, phi**2 - lam_0**2)))
        f_cd = (chi * fy) / 1.10

        p_d = (ae * f_cd) * 1e-3  # kN

        telemetry = {
            "slenderness": round(lam, 2),
            "fcc_mpa": round(f_cc, 1),
            "fcd_mpa": round(f_cd, 1),
            "pd_kn": round(p_d, 2)
        }

        return IS800SteelColumnBucklingCurvesOutput(
            slenderness_ratio_lambda=round(lam, 2),
            design_compressive_stress_fcd_mpa=round(f_cd, 1),
            axial_compressive_capacity_pd_kn=round(p_d, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "ismb_300_column_3_5m": {"effective_length_kl_m": 3.5, "radius_of_gyration_r_mm": 45.0, "cross_section_area_ae_mm2": 5626.0, "yield_strength_fy_mpa": 250.0, "buckling_class": "Buckling Class c (Rolled I-Sections & Built-up)"},
            "ishb_400_heavy_column": {"effective_length_kl_m": 4.5, "radius_of_gyration_r_mm": 60.0, "cross_section_area_ae_mm2": 10466.0, "yield_strength_fy_mpa": 250.0, "buckling_class": "Buckling Class c (Rolled I-Sections & Built-up)"}
        }


# ── 4. IS 800 Steel Beam & Web Crippling Engine ─────────────────────────────
class IS800SteelBeamBendingWebCripplingInput(BaseModel):
    plastic_section_modulus_zp_cm3: float = Field(default=850.0, ge=100.0, le=5000.0)
    flange_width_b_mm: float = Field(default=140.0, ge=50.0, le=400.0)
    web_thickness_tw_mm: float = Field(default=7.5, ge=4.0, le=30.0)
    overall_depth_h_mm: float = Field(default=350.0, ge=150.0, le=1000.0)
    bearing_length_b1_mm: float = Field(default=75.0, ge=25.0, le=200.0)
    yield_strength_fy_mpa: float = Field(default=250.0, ge=230.0, le=450.0)


class IS800SteelBeamBendingWebCripplingOutput(BaseModel):
    design_bending_strength_md_knm: float
    web_bearing_crippling_strength_pwc_kn: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IS800SteelBeamBendingWebCripplingEngine(BaseSimulationEngine):
    name = "is800-steel-beam-bending-web-crippling"
    description = "CE/DSS/S6: Steel Design — IS 800 Plastic Moment Capacity Md = Zp fy / gamma_m0 & Web Bearing Crippling Pwc"

    def calculate(self, params: IS800SteelBeamBendingWebCripplingInput) -> IS800SteelBeamBendingWebCripplingOutput:
        zp = params.plastic_section_modulus_zp_cm3 * 1000.0  # mm3
        b1 = params.bearing_length_b1_mm
        tw = params.web_thickness_tw_mm
        fy = params.yield_strength_fy_mpa

        # Md = Zp * fy / gamma_m0
        m_d = (zp * fy / 1.10) * 1e-6  # kNm

        # Web Crippling Pwc = (b1 + 2.5 * root_radius_tf) * tw * fy / gamma_m0
        n2 = 2.5 * 25.0  # root clearance dispersion
        p_wc = ((b1 + n2) * tw * fy / 1.10) * 1e-3  # kN

        telemetry = {
            "md_knm": round(m_d, 2),
            "pwc_kn": round(p_wc, 2)
        }

        return IS800SteelBeamBendingWebCripplingOutput(
            design_bending_strength_md_knm=round(m_d, 2),
            web_bearing_crippling_strength_pwc_kn=round(p_wc, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "ismb_350_joist_beam": {"plastic_section_modulus_zp_cm3": 850.0, "flange_width_b_mm": 140.0, "web_thickness_tw_mm": 7.5, "overall_depth_h_mm": 350.0, "bearing_length_b1_mm": 75.0, "yield_strength_fy_mpa": 250.0},
            "ismb_500_heavy_girder": {"plastic_section_modulus_zp_cm3": 2075.0, "flange_width_b_mm": 180.0, "web_thickness_tw_mm": 10.2, "overall_depth_h_mm": 500.0, "bearing_length_b1_mm": 100.0, "yield_strength_fy_mpa": 250.0}
        }


# ── 5. IS 1893 Seismic Base Shear Distribution Engine ───────────────────────
class IS1893SeismicBaseShearDistributionInput(BaseModel):
    seismic_zone: Literal["Zone IV (Z = 0.24 — Kolkata / High Risk)", "Zone V (Z = 0.36 — Very High Risk)", "Zone III (Z = 0.16 — Moderate)", "Zone II (Z = 0.10 — Low)"] = "Zone IV (Z = 0.24 — Kolkata / High Risk)"
    importance_factor_i: float = Field(default=1.2, ge=1.0, le=1.5)
    response_reduction_factor_r: float = Field(default=5.0, ge=3.0, le=5.0)
    total_seismic_weight_w_kn: float = Field(default=12000.0, ge=1000.0, le=100000.0)
    building_height_h_m: float = Field(default=24.0, ge=6.0, le=100.0)
    number_of_storeys: int = Field(default=8, ge=2, le=30)


class IS1893SeismicBaseShearDistributionOutput(BaseModel):
    fundamental_period_ta_s: float
    horizontal_seismic_coefficient_ah: float
    total_design_base_shear_vb_kn: float
    roof_level_lateral_force_qn_kn: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IS1893SeismicBaseShearDistributionEngine(BaseSimulationEngine):
    name = "is1893-seismic-base-shear-distribution"
    description = "CE/EE/S6: Earthquake Engineering — IS 1893:2016 Base Shear Vb = Ah W & Parabolic Vertical Force Distribution Qi"

    def calculate(self, params: IS1893SeismicBaseShearDistributionInput) -> IS1893SeismicBaseShearDistributionOutput:
        z = 0.24 if "IV" in params.seismic_zone else (0.36 if "V" in params.seismic_zone else (0.16 if "III" in params.seismic_zone else 0.10))
        i = params.importance_factor_i
        r = params.response_reduction_factor_r
        w_tot = params.total_seismic_weight_w_kn
        h = params.building_height_h_m
        n = params.number_of_storeys

        # Ta = 0.075 * h^0.75
        t_a = 0.075 * math.pow(h, 0.75)

        # Medium soil Sa/g = 1.36 / Ta
        sa_g = min(2.5, 1.36 / max(0.1, t_a))

        # Ah = (Z * I * Sa/g) / (2 * R)
        a_h = (z * i * sa_g) / (2.0 * r)

        v_b = a_h * w_tot

        # Roof force Qi = Vb * (Wn * hn^2) / sum(Wj * hj^2)
        # assuming uniform floor weight W/n
        sum_h2 = sum([((j / n) * h)**2 for j in range(1, n + 1)])
        q_roof = v_b * (h**2) / (sum_h2 * n)

        telemetry = {
            "ta_s": round(t_a, 3),
            "ah": round(a_h, 4),
            "vb_kn": round(v_b, 1),
            "qroof_kn": round(q_roof, 1)
        }

        return IS1893SeismicBaseShearDistributionOutput(
            fundamental_period_ta_s=round(t_a, 3),
            horizontal_seismic_coefficient_ah=round(a_h, 4),
            total_design_base_shear_vb_kn=round(v_b, 1),
            roof_level_lateral_force_qn_kn=round(q_roof, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "g_plus_7_building_kolkata_zone4": {"seismic_zone": "Zone IV (Z = 0.24 — Kolkata / High Risk)", "importance_factor_i": 1.2, "response_reduction_factor_r": 5.0, "total_seismic_weight_w_kn": 12000.0, "building_height_h_m": 24.0, "number_of_storeys": 8},
            "g_plus_11_hospital_zone5": {"seismic_zone": "Zone V (Z = 0.36 — Very High Risk)", "importance_factor_i": 1.5, "response_reduction_factor_r": 5.0, "total_seismic_weight_w_kn": 22000.0, "building_height_h_m": 36.0, "number_of_storeys": 12}
        }


# ── 6. IS 13920 Ductile Detailing Confinement Engine ────────────────────────
class IS13920DuctileDetailingConfinementInput(BaseModel):
    column_dimension_d_mm: float = Field(default=450.0, ge=300.0, le=1000.0)
    column_core_dimension_h_mm: float = Field(default=370.0, ge=200.0, le=900.0)
    concrete_fck_mpa: float = Field(default=25.0, ge=20.0, le=50.0)
    steel_fy_mpa: float = Field(default=415.0, ge=415.0, le=550.0)
    hoop_bar_dia_mm: float = Field(default=8.0, ge=8.0, le=16.0)
    gross_area_ag_mm2: float = Field(default=202500.0, ge=90000.0, le=1000000.0)
    core_area_ak_mm2: float = Field(default=136900.0, ge=40000.0, le=800000.0)


class IS13920DuctileDetailingConfinementOutput(BaseModel):
    max_special_confining_spacing_sv_mm: float
    required_confining_hoop_area_ash_mm2: float
    provided_hoop_area_4legs_mm2: float
    ductility_compliance_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IS13920DuctileDetailingConfinementEngine(BaseSimulationEngine):
    name = "is13920-ductile-detailing-confinement"
    description = "CE/EE/S6: Earthquake Resistant Design — IS 13920:2016 Special Confining Hoops Ash & Maximum Spacing sv"

    def calculate(self, params: IS13920DuctileDetailingConfinementInput) -> IS13920DuctileDetailingConfinementOutput:
        d = params.column_dimension_d_mm
        h = params.column_core_dimension_h_mm
        fck = params.concrete_fck_mpa
        fy = params.steel_fy_mpa
        dia = params.hoop_bar_dia_mm
        ag = params.gross_area_ag_mm2
        ak = params.core_area_ak_mm2

        # Max spacing sv <= min(D/4, 100mm, 6*db)
        sv = min(d / 4.0, 100.0, 6.0 * 16.0)  # assume 16mm main rebar

        # Ash = 0.18 * sv * h * (Ag/Ak - 1) * (fck / fy)
        ash_req = 0.18 * sv * h * ((ag / ak) - 1.0) * (fck / fy)

        # Provided 4 legs of dia
        ash_prov = 4.0 * (math.pi / 4.0) * (dia**2)

        status = "COMPLIANT WITH IS 13920:2016 (Ash,prov >= Ash,req)" if ash_prov >= ash_req else "NON-COMPLIANT: Increase Hoop Diameter"

        telemetry = {
            "sv_mm": round(sv, 0),
            "ash_req_mm2": round(ash_req, 1),
            "ash_prov_mm2": round(ash_prov, 1),
            "status": status
        }

        return IS13920DuctileDetailingConfinementOutput(
            max_special_confining_spacing_sv_mm=round(sv, 0),
            required_confining_hoop_area_ash_mm2=round(ash_req, 1),
            provided_hoop_area_4legs_mm2=round(ash_prov, 1),
            ductility_compliance_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_450mm_column_is13920": {"column_dimension_d_mm": 450.0, "column_core_dimension_h_mm": 370.0, "concrete_fck_mpa": 25.0, "steel_fy_mpa": 415.0, "hoop_bar_dia_mm": 8.0, "gross_area_ag_mm2": 202500.0, "core_area_ak_mm2": 136900.0},
            "heavy_600mm_column_m30": {"column_dimension_d_mm": 600.0, "column_core_dimension_h_mm": 500.0, "concrete_fck_mpa": 30.0, "steel_fy_mpa": 500.0, "hoop_bar_dia_mm": 10.0, "gross_area_ag_mm2": 360000.0, "core_area_ak_mm2": 250000.0}
        }


# ── 7. Concrete Gravity Dam Stability Analysis Engine ───────────────────────
class ConcreteGravityDamStabilityAnalysisInput(BaseModel):
    dam_height_h_m: float = Field(default=60.0, ge=20.0, le=150.0)
    base_width_b_m: float = Field(default=45.0, ge=15.0, le=120.0)
    water_depth_hw_m: float = Field(default=55.0, ge=15.0, le=145.0)
    concrete_density_kn_m3: float = Field(default=24.0, ge=22.0, le=25.0)
    coefficient_of_friction_mu: float = Field(default=0.7, ge=0.5, le=0.85)
    uplift_reduction_factor: float = Field(default=0.67, ge=0.5, le=1.0)


class ConcreteGravityDamStabilityAnalysisOutput(BaseModel):
    factor_of_safety_overturning_fso: float
    factor_of_safety_sliding_fss: float
    dam_stability_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ConcreteGravityDamStabilityAnalysisEngine(BaseSimulationEngine):
    name = "concrete-gravity-dam-stability-analysis"
    description = "CE/WRE/S6: Water Resources — Concrete Gravity Dam Stability against Overturning FSO, Sliding FSS & Uplift"

    def calculate(self, params: ConcreteGravityDamStabilityAnalysisInput) -> ConcreteGravityDamStabilityAnalysisOutput:
        h = params.dam_height_h_m
        b = params.base_width_b_m
        hw = params.water_depth_hw_m
        gamma_c = params.concrete_density_kn_m3
        mu = params.coefficient_of_friction_mu
        c_up = params.uplift_reduction_factor

        # 1. Dam Self Weight W
        w_dam = 0.5 * b * h * gamma_c
        mr = w_dam * (2.0 * b / 3.0)

        # 2. Hydrostatic Thrust Pw
        pw = 0.5 * 9.81 * (hw**2)
        mo_water = pw * (hw / 3.0)

        # 3. Uplift Thrust U
        u = 0.5 * c_up * 9.81 * hw * b
        mo_uplift = u * (2.0 * b / 3.0)

        mo_tot = mo_water + mo_uplift
        fso = mr / max(1.0, mo_tot)

        # Sliding FS
        v_net = max(1.0, w_dam - u)
        fss = (mu * v_net) / pw

        safe = fso >= 1.5 and fss >= 1.0
        verdict = "STABLE MONOLITH (FSO >= 1.5, FSS >= 1.0 per IS 6512)" if safe else "UNSAFE: Widen Dam Base Width B"

        telemetry = {
            "w_dam_kn": round(w_dam, 1),
            "pw_thrust_kn": round(pw, 1),
            "fso": round(fso, 2),
            "fss": round(fss, 2),
            "verdict": verdict
        }

        return ConcreteGravityDamStabilityAnalysisOutput(
            factor_of_safety_overturning_fso=round(fso, 2),
            factor_of_safety_sliding_fss=round(fss, 2),
            dam_stability_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "dam_60m_stable": {"dam_height_h_m": 60.0, "base_width_b_m": 45.0, "water_depth_hw_m": 55.0, "concrete_density_kn_m3": 24.0, "coefficient_of_friction_mu": 0.7, "uplift_reduction_factor": 0.67},
            "high_dam_100m": {"dam_height_h_m": 100.0, "base_width_b_m": 75.0, "water_depth_hw_m": 92.0, "concrete_density_kn_m3": 24.0, "coefficient_of_friction_mu": 0.75, "uplift_reduction_factor": 0.67}
        }


# ── 8. Flow Net & Seepage Exit Gradient Engine ──────────────────────────────
class FlownetSeepageExitGradientPipingInput(BaseModel):
    hydraulic_head_h_m: float = Field(default=6.0, ge=1.0, le=30.0)
    soil_permeability_k_cm_s: float = Field(default=0.002, ge=0.0001, le=0.1)
    flow_channels_nf: int = Field(default=4, ge=2, le=10)
    equipotential_drops_nd: int = Field(default=12, ge=4, le=30)
    exit_field_length_l_m: float = Field(default=1.2, ge=0.3, le=5.0)


class FlownetSeepageExitGradientPipingOutput(BaseModel):
    seepage_discharge_q_litres_s_m: float
    exit_gradient_iexit: float
    piping_boiling_safety_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FlownetSeepageExitGradientPipingEngine(BaseSimulationEngine):
    name = "flownet-seepage-exit-gradient-piping"
    description = "CE/WRE/S6: Soil Hydraulics — 2D Flow Net Seepage q = kH (Nf/Nd) & Critical Exit Gradient Piping Check"

    def calculate(self, params: FlownetSeepageExitGradientPipingInput) -> FlownetSeepageExitGradientPipingOutput:
        h = params.hydraulic_head_h_m
        k_m_s = params.soil_permeability_k_cm_s * 1e-2
        nf = params.flow_channels_nf
        nd = params.equipotential_drops_nd
        l = params.exit_field_length_l_m

        # q = k * H * (Nf / Nd) m3/s/m => litres/s/m (* 1000)
        q_m3 = k_m_s * h * (nf / nd)
        q_litres = q_m3 * 1000.0

        # Exit gradient = (H / Nd) / L
        dh = h / nd
        i_exit = dh / l

        # Safe limit is 1/5 to 1/6 (0.17 - 0.20)
        safe = i_exit <= 0.20
        status = "SAFE AGAINST PIPING (iexit <= 0.20)" if safe else "UNSAFE PIPING HAZARD: Provide Downstream Sheet Pile Cutoff"

        telemetry = {
            "q_litres": round(q_litres, 4),
            "iexit": round(i_exit, 3),
            "status": status
        }

        return FlownetSeepageExitGradientPipingOutput(
            seepage_discharge_q_litres_s_m=round(q_litres, 4),
            exit_gradient_iexit=round(i_exit, 3),
            piping_boiling_safety_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "weir_seepage_6m_head": {"hydraulic_head_h_m": 6.0, "soil_permeability_k_cm_s": 0.002, "flow_channels_nf": 4, "equipotential_drops_nd": 12, "exit_field_length_l_m": 1.2},
            "barrage_high_permeability": {"hydraulic_head_h_m": 8.0, "soil_permeability_k_cm_s": 0.005, "flow_channels_nf": 5, "equipotential_drops_nd": 16, "exit_field_length_l_m": 1.5}
        }


# ── 9. Unit Hydrograph & Flood Routing Engine ───────────────────────────────
class UnitHydrographFloodRoutingRationalInput(BaseModel):
    catchment_area_a_km2: float = Field(default=45.0, ge=5.0, le=500.0)
    runoff_coefficient_c: float = Field(default=0.65, ge=0.2, le=0.95)
    rainfall_intensity_i_mm_hr: float = Field(default=35.0, ge=5.0, le=120.0)
    unit_hydrograph_peak_qp_cumecs: float = Field(default=120.0, ge=10.0, le=1000.0)
    storm_duration_hr: float = Field(default=4.0, ge=1.0, le=24.0)


class UnitHydrographFloodRoutingRationalOutput(BaseModel):
    rational_peak_discharge_q_cumecs: float
    total_direct_runoff_depth_cm: float
    flood_hydrograph_peak_flow_cumecs: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class UnitHydrographFloodRoutingRationalEngine(BaseSimulationEngine):
    name = "unit-hydrograph-flood-routing-rational"
    description = "CE/WRE/S6: Hydrology — Rational Peak Runoff Q = 1/36 C I A & Unit Hydrograph Flood Superposition"

    def calculate(self, params: UnitHydrographFloodRoutingRationalInput) -> UnitHydrographFloodRoutingRationalOutput:
        a = params.catchment_area_a_km2
        c = params.runoff_coefficient_c
        i = params.rainfall_intensity_i_mm_hr
        qp = params.unit_hydrograph_peak_qp_cumecs
        d_hr = params.storm_duration_hr

        # Rational Peak Q = (1/36) * C * I * A  cumecs
        q_rat = (1.0 / 36.0) * c * i * a

        # Runoff depth R = C * (I * d) / 10  cm
        r_cm = c * (i * d_hr) / 10.0

        # Flood peak = Qp * R + Baseflow(15 cumecs)
        q_flood = qp * r_cm + 15.0

        telemetry = {
            "q_rat": round(q_rat, 2),
            "r_cm": round(r_cm, 2),
            "q_flood": round(q_flood, 1)
        }

        return UnitHydrographFloodRoutingRationalOutput(
            rational_peak_discharge_q_cumecs=round(q_rat, 2),
            total_direct_runoff_depth_cm=round(r_cm, 2),
            flood_hydrograph_peak_flow_cumecs=round(q_flood, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "catchment_45km2_rational": {"catchment_area_a_km2": 45.0, "runoff_coefficient_c": 0.65, "rainfall_intensity_i_mm_hr": 35.0, "unit_hydrograph_peak_qp_cumecs": 120.0, "storm_duration_hr": 4.0},
            "urban_watershed_80km2": {"catchment_area_a_km2": 80.0, "runoff_coefficient_c": 0.80, "rainfall_intensity_i_mm_hr": 50.0, "unit_hydrograph_peak_qp_cumecs": 250.0, "storm_duration_hr": 6.0}
        }


# ── 10. Rebound Hammer & UPV NDT Testing Engine ─────────────────────────────
class ReboundHammerUPVNDTTestingInput(BaseModel):
    rebound_number_r: float = Field(default=36.0, ge=15.0, le=55.0)
    upv_path_length_l_mm: float = Field(default=300.0, ge=100.0, le=1000.0)
    upv_transit_time_t_us: float = Field(default=72.0, ge=20.0, le=400.0)
    concrete_tested_element: Literal["Beam Bottom Compression Zone", "Column Side Face", "Slab Surface"] = "Column Side Face"


class ReboundHammerUPVNDTTestingOutput(BaseModel):
    ultrasonic_pulse_velocity_km_s: float
    upv_concrete_quality_grade: str
    estimated_rebound_fck_mpa: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ReboundHammerUPVNDTTestingEngine(BaseSimulationEngine):
    name = "rebound-hammer-upv-ndt-testing"
    description = "CE/MRS/S6: NDT Testing — IS 13311 Schmidt Rebound Hammer Number R & Ultrasonic Pulse Velocity UPV v = L/t"

    def calculate(self, params: ReboundHammerUPVNDTTestingInput) -> ReboundHammerUPVNDTTestingOutput:
        r = params.rebound_number_r
        l_m = params.upv_path_length_l_mm * 1e-3
        t_s = params.upv_transit_time_t_us * 1e-6

        # UPV velocity in km/s
        v_km_s = (l_m / t_s) * 1e-3

        if v_km_s > 4.5:
            grade = "EXCELLENT CONCRETE QUALITY (v > 4.5 km/s IS 13311 Part 1)"
        elif v_km_s >= 3.5:
            grade = "GOOD CONCRETE QUALITY (v = 3.5 - 4.5 km/s)"
        elif v_km_s >= 3.0:
            grade = "MEDIUM CONCRETE QUALITY (v = 3.0 - 3.5 km/s)"
        else:
            grade = "DOUBTFUL / DEFECTIVE CONCRETE (v < 3.0 km/s)"

        # Empirical Rebound fck estimation
        fck_est = 0.024 * (r**2) + 0.35 * r - 2.5

        telemetry = {
            "v_km_s": round(v_km_s, 3),
            "grade": grade,
            "fck_est": round(fck_est, 1)
        }

        return ReboundHammerUPVNDTTestingOutput(
            ultrasonic_pulse_velocity_km_s=round(v_km_s, 3),
            upv_concrete_quality_grade=grade,
            estimated_rebound_fck_mpa=round(fck_est, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "m30_structural_column_test": {"rebound_number_r": 36.0, "upv_path_length_l_mm": 300.0, "upv_transit_time_t_us": 72.0, "concrete_tested_element": "Column Side Face"},
            "deteriorated_beam_corrosion": {"rebound_number_r": 22.0, "upv_path_length_l_mm": 250.0, "upv_transit_time_t_us": 95.0, "concrete_tested_element": "Beam Bottom Compression Zone"}
        }


# ── 11. Structural Retrofitting & FRP Jacketing Engine ───────────────────────
class StructuralRetrofittingFRPJacketingInput(BaseModel):
    unconfined_concrete_strength_fco_mpa: float = Field(default=20.0, ge=10.0, le=45.0)
    column_diameter_d_mm: float = Field(default=350.0, ge=200.0, le=1000.0)
    frp_layers_count_n: int = Field(default=2, ge=1, le=6)
    frp_thickness_per_layer_tf_mm: float = Field(default=0.35, ge=0.15, le=1.0)
    frp_tensile_strength_ffu_mpa: float = Field(default=3500.0, ge=1500.0, le=4500.0)


class StructuralRetrofittingFRPJacketingOutput(BaseModel):
    lateral_confining_pressure_fl_mpa: float
    confined_concrete_strength_fcc_mpa: float
    axial_strength_enhancement_ratio: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class StructuralRetrofittingFRPJacketingEngine(BaseSimulationEngine):
    name = "structural-retrofitting-frp-jacketing"
    description = "CE/MRS/S6: Rehabilitation — Carbon/Glass FRP Composite Jacketing Confinement fcc' = fco' + 3.3 fl"

    def calculate(self, params: StructuralRetrofittingFRPJacketingInput) -> StructuralRetrofittingFRPJacketingOutput:
        fco = params.unconfined_concrete_strength_fco_mpa
        d = params.column_diameter_d_mm
        n = params.frp_layers_count_n
        tf = params.frp_thickness_per_layer_tf_mm
        ffu = params.frp_tensile_strength_ffu_mpa

        t_total = n * tf

        # fl = 2 * tf * ffu / D
        f_l = (2.0 * t_total * ffu) / d

        # fcc = fco + 3.3 * fl (Lam & Teng model)
        f_cc = fco + 3.3 * f_l

        ratio = f_cc / fco

        telemetry = {
            "fl_mpa": round(f_l, 2),
            "fcc_mpa": round(f_cc, 1),
            "ratio": round(ratio, 2)
        }

        return StructuralRetrofittingFRPJacketingOutput(
            lateral_confining_pressure_fl_mpa=round(f_l, 2),
            confined_concrete_strength_fcc_mpa=round(f_cc, 1),
            axial_strength_enhancement_ratio=round(ratio, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "cfrp_2_layers_350mm_col": {"unconfined_concrete_strength_fco_mpa": 20.0, "column_diameter_d_mm": 350.0, "frp_layers_count_n": 2, "frp_thickness_per_layer_tf_mm": 0.35, "frp_tensile_strength_ffu_mpa": 3500.0},
            "gfrp_4_layers_heavy_jacket": {"unconfined_concrete_strength_fco_mpa": 25.0, "column_diameter_d_mm": 450.0, "frp_layers_count_n": 4, "frp_thickness_per_layer_tf_mm": 0.50, "frp_tensile_strength_ffu_mpa": 2200.0}
        }


# ── 12. Micro-Irrigation Drip & Sprinkler Uniformity Engine ──────────────────
class MicroIrrigationDripSprinklerUniformityInput(BaseModel):
    nominal_emitter_discharge_q0_lph: float = Field(default=4.0, ge=1.0, le=20.0)
    operating_pressure_head_h_m: float = Field(default=12.0, ge=5.0, le=40.0)
    emitter_discharge_exponent_x: float = Field(default=0.5, ge=0.0, le=0.8)
    measured_catch_depths_mm: List[float] = Field(default=[18.5, 19.2, 17.8, 18.0, 19.5, 17.2, 18.8, 18.4])


class MicroIrrigationDripSprinklerUniformityOutput(BaseModel):
    actual_emitter_discharge_q_lph: float
    christiansen_uniformity_coefficient_cu_pct: float
    distribution_uniformity_rating: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class MicroIrrigationDripSprinklerUniformityEngine(BaseSimulationEngine):
    name = "micro-irrigation-drip-sprinkler-uniformity"
    description = "CE/MI/S6: Micro-Irrigation — Drip Emitter Discharge q = k h^x & Christiansen Uniformity Coefficient CU"

    def calculate(self, params: MicroIrrigationDripSprinklerUniformityInput) -> MicroIrrigationDripSprinklerUniformityOutput:
        q0 = params.nominal_emitter_discharge_q0_lph
        h = params.operating_pressure_head_h_m
        x = params.emitter_discharge_exponent_x
        depths = params.measured_catch_depths_mm

        # q = k * h^x  (k = q0 / 10^x)
        k_const = q0 / math.pow(10.0, x)
        q_act = k_const * math.pow(h, x)

        # Christiansen CU = 100 * [1 - sum|yi - y_mean| / (n * y_mean)]
        n = len(depths)
        mean_y = sum(depths) / max(1, n)
        dev = sum([abs(y - mean_y) for y in depths])
        cu = 100.0 * (1.0 - (dev / (n * mean_y)))

        rating = "EXCELLENT UNIFORMITY (CU >= 90%)" if cu >= 90.0 else ("GOOD UNIFORMITY (CU 80-90%)" if cu >= 80.0 else "POOR UNIFORMITY (CU < 80%)")

        telemetry = {
            "q_lph": round(q_act, 2),
            "cu_pct": round(cu, 1),
            "rating": rating
        }

        return MicroIrrigationDripSprinklerUniformityOutput(
            actual_emitter_discharge_q_lph=round(q_act, 2),
            christiansen_uniformity_coefficient_cu_pct=round(cu, 1),
            distribution_uniformity_rating=rating,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "pressure_compensating_4lph": {"nominal_emitter_discharge_q0_lph": 4.0, "operating_pressure_head_h_m": 12.0, "emitter_discharge_exponent_x": 0.5, "measured_catch_depths_mm": [18.5, 19.2, 17.8, 18.0, 19.5, 17.2, 18.8, 18.4]},
            "sprinkler_nozzle_catch_grid": {"nominal_emitter_discharge_q0_lph": 12.0, "operating_pressure_head_h_m": 25.0, "emitter_discharge_exponent_x": 0.5, "measured_catch_depths_mm": [25.0, 24.2, 26.5, 23.8, 25.4, 24.8, 26.0, 25.1]}
        }
