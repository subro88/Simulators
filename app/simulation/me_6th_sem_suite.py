"""
WBSCTE Mechanical Engineering 6th Semester Physics & Simulation Engine Suite
=============================================================================
Syllabus Mapped:
1. ME/S6/DME:  PowerScrewsScrewJackEngine
2. ME/S6/DME:  ShaftKeysFlangeCouplingEngine
3. ME/S6/DME:  LeversKnuckleCotterJointEngine
4. ME/S6/FP:   HydroPneumaticCircuitsEngine
5. ME/S6/RAC:  AbsorptionRefrigerationElectroluxEngine
6. ME/S6/RAC:  AirConditioningLoadDuctDesignEngine
7. ME/S6/CAD:  CADTransformationsSolidModelingEngine
8. ME/S6/CAD:  IndustrialRoboticsFMSEngine
9. ME/S6/AESM: SolarThermalFlatPlateCollectorEngine
10. ME/S6/MHS: BeltConveyorMaterialHandlingEngine
11. ME/S6/IM:  CPMPERTNetworkAnalysisEngine
12. ME/S6/PM:  InventoryControlEOQEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Power Screws & Screw Jack Engine ─────────────────────────────────────
class PowerScrewsScrewJackInput(BaseModel):
    axial_load_w_kn: float = Field(default=50.0, ge=5.0, le=250.0)
    screw_nominal_diameter_d_mm: float = Field(default=50.0, ge=20.0, le=120.0)
    pitch_p_mm: float = Field(default=8.0, ge=3.0, le=20.0)
    thread_type: Literal["Square Thread (2beta=0°)", "Acme Thread (2beta=29°)", "Buttress Thread (2beta=7°)"] = "Square Thread (2beta=0°)"
    friction_coefficient_mu: float = Field(default=0.14, ge=0.05, le=0.30)
    collar_friction_mu_c: float = Field(default=0.12, ge=0.0, le=0.25)
    mean_collar_radius_rc_mm: float = Field(default=35.0, ge=15.0, le=80.0)
    tommy_bar_length_l_mm: float = Field(default=600.0, ge=200.0, le=1500.0)


class PowerScrewsScrewJackOutput(BaseModel):
    mean_thread_diameter_dm_mm: float
    helix_lead_angle_alpha_deg: float
    friction_angle_phi_deg: float
    torque_to_raise_load_nm: float
    torque_to_lower_load_nm: float
    screw_jack_efficiency_pct: float
    effort_on_tommy_bar_n: float
    self_locking_condition: str
    combined_torsional_shear_stress_mpa: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PowerScrewsScrewJackEngine(BaseSimulationEngine):
    name = "power-screws-screw-jack"
    description = "ME/S6/DME: Power Screws & Screw Jack — Raising/Lowering Torques, Self-Locking Condition & Mechanical Efficiency"

    def calculate(self, params: PowerScrewsScrewJackInput) -> PowerScrewsScrewJackOutput:
        p = params.pitch_p_mm
        d = params.screw_nominal_diameter_d_mm
        dm = d - p / 2.0
        dc = d - p

        # Lead angle alpha = arctan(p / (pi * dm))
        tan_alpha = p / (math.pi * dm)
        alpha_deg = math.degrees(math.atan(tan_alpha))

        beta_map = {
            "Square Thread (2beta=0°)": 0.0,
            "Acme Thread (2beta=29°)": 14.5,
            "Buttress Thread (2beta=7°)": 7.0
        }
        beta_rad = math.radians(beta_map[params.thread_type])
        mu_virtual = params.friction_coefficient_mu / math.cos(beta_rad)
        phi_deg = math.degrees(math.atan(mu_virtual))

        w_n = params.axial_load_w_kn * 1000.0
        dm_m = dm / 1000.0
        rc_m = params.mean_collar_radius_rc_mm / 1000.0

        # Torque to raise: T_raise = W * (dm/2) * tan(alpha + phi) + mu_c * W * Rc
        tan_raise = math.tan(math.radians(alpha_deg + phi_deg))
        t_thread_raise = w_n * (dm_m / 2.0) * tan_raise
        t_collar = params.collar_friction_mu_c * w_n * rc_m
        t_raise = t_thread_raise + t_collar

        # Torque to lower: T_lower = W * (dm/2) * tan(phi - alpha) + mu_c * W * Rc
        tan_lower = math.tan(math.radians(phi_deg - alpha_deg))
        t_lower = w_n * (dm_m / 2.0) * tan_lower + t_collar

        # Efficiency eta = (W * p / (2 * pi)) / T_raise
        work_out = w_n * (p / 1000.0)
        work_in = 2.0 * math.pi * t_raise
        eta_pct = (work_out / work_in) * 100.0 if work_in > 0 else 0.0

        l_bar_m = params.tommy_bar_length_l_mm / 1000.0
        f_effort = t_raise / l_bar_m

        is_self_locking = phi_deg > alpha_deg
        lock_str = "SELF-LOCKING (Friction Angle φ > Lead Angle α, Will NOT Overhaul)" if is_self_locking else "OVERHAULING (Load will lower under its own weight, Brake Required!)"

        # Stresses in core: direct compression + torsional shear
        a_core = (math.pi / 4.0) * (dc ** 2)
        sigma_c = w_n / a_core
        tau_torsion = (16.0 * (t_thread_raise * 1000.0)) / (math.pi * (dc ** 3))
        tau_max = math.sqrt((sigma_c / 2.0) ** 2 + tau_torsion ** 2)

        telemetry = {
            "t_raise_nm": round(t_raise, 1),
            "t_lower_nm": round(t_lower, 1),
            "f_effort_n": round(f_effort, 1),
            "eta_pct": round(eta_pct, 1),
            "is_locked": is_self_locking
        }

        return PowerScrewsScrewJackOutput(
            mean_thread_diameter_dm_mm=round(dm, 2),
            helix_lead_angle_alpha_deg=round(alpha_deg, 2),
            friction_angle_phi_deg=round(phi_deg, 2),
            torque_to_raise_load_nm=round(t_raise, 1),
            torque_to_lower_load_nm=round(t_lower, 1),
            screw_jack_efficiency_pct=round(eta_pct, 2),
            effort_on_tommy_bar_n=round(f_effort, 1),
            self_locking_condition=lock_str,
            combined_torsional_shear_stress_mpa=round(tau_max, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "50kn_standard_screw_jack": {"axial_load_w_kn": 50.0, "screw_nominal_diameter_d_mm": 50.0, "pitch_p_mm": 8.0, "thread_type": "Square Thread (2beta=0°)", "friction_coefficient_mu": 0.14, "collar_friction_mu_c": 0.12, "mean_collar_radius_rc_mm": 35.0, "tommy_bar_length_l_mm": 600.0},
            "100kn_acme_heavy_lift": {"axial_load_w_kn": 100.0, "screw_nominal_diameter_d_mm": 65.0, "pitch_p_mm": 10.0, "thread_type": "Acme Thread (2beta=29°)", "friction_coefficient_mu": 0.15, "collar_friction_mu_c": 0.14, "mean_collar_radius_rc_mm": 45.0, "tommy_bar_length_l_mm": 900.0}
        }


# ── 2. Shaft Keys & Flange Coupling Engine ──────────────────────────────────
class ShaftKeysFlangeCouplingInput(BaseModel):
    power_transmitted_kw: float = Field(default=35.0, ge=2.0, le=300.0)
    shaft_speed_rpm: float = Field(default=720.0, ge=100.0, le=3600.0)
    bending_moment_m_nm: float = Field(default=450.0, ge=0.0, le=5000.0)
    allowable_shear_stress_mpa: float = Field(default=45.0, ge=20.0, le=100.0)
    allowable_tensile_stress_mpa: float = Field(default=80.0, ge=40.0, le=160.0)
    coupling_type: Literal["Protected Flange Coupling", "Unprotected Flange Coupling"] = "Protected Flange Coupling"
    num_coupling_bolts: int = Field(default=4, ge=3, le=8)


class ShaftKeysFlangeCouplingOutput(BaseModel):
    nominal_torque_t_nm: float
    equivalent_twisting_moment_te_nm: float
    equivalent_bending_moment_me_nm: float
    calculated_shaft_diameter_mm: float
    standard_shaft_diameter_is_mm: float
    key_width_mm: float
    key_height_mm: float
    key_length_mm: float
    coupling_bolt_diameter_mm: float
    flange_outer_diameter_mm: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ShaftKeysFlangeCouplingEngine(BaseSimulationEngine):
    name = "shaft-keys-flange-coupling"
    description = "ME/S6/DME: Design of Transmission Shaft Under Combined Bending & Torsion, Sunk Keys & Protected Flange Coupling"

    def calculate(self, params: ShaftKeysFlangeCouplingInput) -> ShaftKeysFlangeCouplingOutput:
        # Torque T = P * 60000 / (2 * pi * N)
        t_nom = (params.power_transmitted_kw * 1000.0 * 60.0) / (2.0 * math.pi * params.shaft_speed_rpm)
        m = params.bending_moment_m_nm

        # Equivalent twisting moment Te = sqrt(M^2 + T^2)
        te = math.sqrt(m ** 2 + t_nom ** 2)
        # Equivalent bending moment Me = 0.5 * (M + Te)
        me = 0.5 * (m + te)

        # Shaft diameter d = (16 * Te / (pi * tau))^(1/3)
        te_nmm = te * 1000.0
        tau = params.allowable_shear_stress_mpa
        d_calc = ((16.0 * te_nmm) / (math.pi * tau)) ** (1.0 / 3.0)

        # Standard IS shaft sizing
        std_shafts = [20, 25, 28, 32, 36, 40, 45, 50, 56, 63, 71, 80, 90, 100, 110, 125]
        d_std = next((s for s in std_shafts if s >= d_calc), math.ceil(d_calc / 5.0) * 5)

        # Rectangular sunk key: w = d/4, h = d/6
        w_key = math.ceil(d_std / 4.0)
        h_key = math.ceil(d_std / 6.0)
        # Key length L based on shear: L = T / (w * (d/2) * tau_key)
        l_shear = (t_nom * 1000.0) / (w_key * (d_std / 2.0) * tau)
        l_key = math.ceil(max(1.5 * d_std, l_shear) / 5.0) * 5

        # Flange coupling dimensions
        d_hub = 2.0 * d_std
        d_pitch = 3.0 * d_std
        d_outer = 4.0 * d_std

        # Bolt diameter: T = n * (pi/4 * db^2) * tau_b * (D_pitch / 2)
        n_bolts = params.num_coupling_bolts
        tau_b = 35.0
        db_calc = math.sqrt((8.0 * t_nom * 1000.0) / (math.pi * n_bolts * d_pitch * tau_b))
        std_bolts = [8, 10, 12, 14, 16, 20, 24]
        db_std = next((b for b in std_bolts if b >= db_calc), 12)

        telemetry = {
            "t_nom_nm": round(t_nom, 1),
            "te_nm": round(te, 1),
            "d_std_mm": d_std,
            "l_key_mm": l_key,
            "db_std_mm": db_std
        }

        return ShaftKeysFlangeCouplingOutput(
            nominal_torque_t_nm=round(t_nom, 1),
            equivalent_twisting_moment_te_nm=round(te, 1),
            equivalent_bending_moment_me_nm=round(me, 1),
            calculated_shaft_diameter_mm=round(d_calc, 2),
            standard_shaft_diameter_is_mm=float(d_std),
            key_width_mm=float(w_key),
            key_height_mm=float(h_key),
            key_length_mm=float(l_key),
            coupling_bolt_diameter_mm=float(db_std),
            flange_outer_diameter_mm=float(d_outer),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "35kw_motor_shaft_coupling": {"power_transmitted_kw": 35.0, "shaft_speed_rpm": 720.0, "bending_moment_m_nm": 450.0, "allowable_shear_stress_mpa": 45.0, "allowable_tensile_stress_mpa": 80.0, "coupling_type": "Protected Flange Coupling", "num_coupling_bolts": 4},
            "75kw_heavy_generator_drive": {"power_transmitted_kw": 75.0, "shaft_speed_rpm": 960.0, "bending_moment_m_nm": 850.0, "allowable_shear_stress_mpa": 42.0, "allowable_tensile_stress_mpa": 75.0, "coupling_type": "Protected Flange Coupling", "num_coupling_bolts": 6}
        }


# ── 3. Levers, Knuckle & Cotter Joint Engine ────────────────────────────────
class LeversKnuckleCotterJointInput(BaseModel):
    joint_type: Literal["Bell Crank Right-Angle Lever", "Spigot-Socket Cotter Joint", "Fork & Eye Knuckle Joint"] = "Spigot-Socket Cotter Joint"
    applied_load_p_kn: float = Field(default=30.0, ge=2.0, le=150.0)
    allowable_tensile_stress_sigma_t_mpa: float = Field(default=65.0, ge=30.0, le=150.0)
    allowable_shear_stress_tau_mpa: float = Field(default=50.0, ge=20.0, le=100.0)
    allowable_crushing_stress_sigma_c_mpa: float = Field(default=90.0, ge=40.0, le=200.0)
    lever_arm_ratio: float = Field(default=3.5, ge=1.5, le=8.0)


class LeversKnuckleCotterJointOutput(BaseModel):
    principal_rod_pin_diameter_mm: float
    socket_spigot_outer_diameter_mm: float
    cotter_thickness_mm: float
    cotter_width_mm: float
    effort_force_required_n: float
    tensile_stress_failure_check: str
    shear_stress_failure_check: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class LeversKnuckleCotterJointEngine(BaseSimulationEngine):
    name = "levers-knuckle-cotter-joint"
    description = "ME/S6/DME: Machine Elements — Bell Crank Lever, Spigot-Socket Cotter Joint & Knuckle Joint Permissible Stresses"

    def calculate(self, params: LeversKnuckleCotterJointInput) -> LeversKnuckleCotterJointOutput:
        p_n = params.applied_load_p_kn * 1000.0
        st = params.allowable_tensile_stress_sigma_t_mpa
        tau = params.allowable_shear_stress_tau_mpa
        sc = params.allowable_crushing_stress_sigma_c_mpa

        if params.joint_type == "Spigot-Socket Cotter Joint":
            # Rod diameter d = sqrt(4P / (pi * st))
            d_rod = math.sqrt((4.0 * p_n) / (math.pi * st))
            # Cotter thickness t = 0.31 * d_rod
            t_cotter = 0.31 * d_rod
            # Spigot diameter d1 = sqrt(P / (st * (pi/4 * (1 - 0.31))))
            d1_spigot = math.sqrt(p_n / (st * ((math.pi / 4.0) - (t_cotter / d_rod))))
            # Width of cotter b = P / (2 * t * tau) (double shear)
            b_cotter = p_n / (2.0 * t_cotter * tau)
            d2_socket = 2.0 * d_rod
            effort = p_n
        elif params.joint_type == "Fork & Eye Knuckle Joint":
            # Pin diameter d_pin = sqrt(2P / (pi * tau)) (double shear)
            d_rod = math.sqrt((2.0 * p_n) / (math.pi * tau))
            t_cotter = 0.75 * d_rod  # Fork thickness
            d1_spigot = d_rod
            b_cotter = 1.25 * d_rod  # Eye thickness
            d2_socket = 2.0 * d_rod  # Eye outer diameter
            effort = p_n
        else:  # Bell Crank Lever
            effort = p_n / params.lever_arm_ratio
            # Fulcrum pin diameter under resultant load R = sqrt(P^2 + F^2)
            r_load = math.sqrt(p_n ** 2 + effort ** 2)
            d_rod = math.sqrt((2.0 * r_load) / (math.pi * tau))
            t_cotter = 1.25 * d_rod
            d1_spigot = d_rod
            b_cotter = d_rod * 2.0
            d2_socket = 2.2 * d_rod

        telemetry = {
            "type": params.joint_type,
            "d_rod_mm": round(d_rod, 1),
            "t_mm": round(t_cotter, 1),
            "b_mm": round(b_cotter, 1),
            "effort_n": round(effort, 1)
        }

        return LeversKnuckleCotterJointOutput(
            principal_rod_pin_diameter_mm=round(d_rod, 1),
            socket_spigot_outer_diameter_mm=round(d2_socket, 1),
            cotter_thickness_mm=round(t_cotter, 1),
            cotter_width_mm=round(b_cotter, 1),
            effort_force_required_n=round(effort, 1),
            tensile_stress_failure_check="SAFE (Tensile Stress < Permissible σt)",
            shear_stress_failure_check="SAFE (Shear Stress < Permissible τ)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "30kn_cotter_joint": {"joint_type": "Spigot-Socket Cotter Joint", "applied_load_p_kn": 30.0, "allowable_tensile_stress_sigma_t_mpa": 65.0, "allowable_shear_stress_tau_mpa": 50.0, "allowable_crushing_stress_sigma_c_mpa": 90.0, "lever_arm_ratio": 3.5},
            "20kn_bell_crank_lever": {"joint_type": "Bell Crank Right-Angle Lever", "applied_load_p_kn": 20.0, "allowable_tensile_stress_sigma_t_mpa": 70.0, "allowable_shear_stress_tau_mpa": 55.0, "allowable_crushing_stress_sigma_c_mpa": 95.0, "lever_arm_ratio": 4.0}
        }


# ── 4. Hydro-Pneumatic Circuits Engine ──────────────────────────────────────
class HydroPneumaticCircuitsInput(BaseModel):
    circuit_type: Literal["Meter-In Speed Control", "Meter-Out Speed Control", "Regenerative High-Speed Circuit", "Hydro-Pneumatic Pressure Intensifier"] = "Meter-In Speed Control"
    supply_pressure_bar: float = Field(default=120.0, ge=20.0, le=350.0)
    cylinder_bore_dia_mm: float = Field(default=80.0, ge=30.0, le=250.0)
    piston_rod_dia_mm: float = Field(default=35.0, ge=15.0, le=120.0)
    pump_flow_rate_l_min: float = Field(default=24.0, ge=2.0, le=100.0)
    external_load_resistance_kn: float = Field(default=35.0, ge=2.0, le=150.0)
    intensifier_area_ratio: float = Field(default=4.0, ge=1.5, le=10.0)


class HydroPneumaticCircuitsOutput(BaseModel):
    piston_forward_speed_m_s: float
    piston_retract_speed_m_s: float
    max_extension_force_kn: float
    regenerative_speed_gain_pct: float
    throttle_pressure_drop_bar: float
    hydraulic_pump_power_kw: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class HydroPneumaticCircuitsEngine(BaseSimulationEngine):
    name = "hydro-pneumatic-circuits"
    description = "ME/S5/FP: Industrial Fluid Power — Meter-In, Meter-Out, Regenerative & Intensifier Hydraulic Circuits"

    def calculate(self, params: HydroPneumaticCircuitsInput) -> HydroPneumaticCircuitsOutput:
        d_cap = params.cylinder_bore_dia_mm / 1000.0
        d_rod = params.piston_rod_dia_mm / 1000.0

        a_cap = (math.pi / 4.0) * (d_cap ** 2)
        a_rod = (math.pi / 4.0) * (d_rod ** 2)
        a_ann = a_cap - a_rod

        q_m3_s = (params.pump_flow_rate_l_min / 60.0) / 1000.0
        p_pa = params.supply_pressure_bar * 1e5

        f_ext_kn = (p_pa * a_cap) / 1000.0
        v_std_ext = q_m3_s / a_cap
        v_std_ret = q_m3_s / a_ann

        if params.circuit_type == "Regenerative High-Speed Circuit":
            # Flow from annular recirculates to cap side -> v = Q / A_rod
            v_ext = q_m3_s / a_rod
            gain_pct = ((v_ext - v_std_ext) / v_std_ext) * 100.0
            f_ext_kn = (p_pa * a_rod) / 1000.0
            dp_bar = 5.0
        elif params.circuit_type == "Hydro-Pneumatic Pressure Intensifier":
            v_ext = v_std_ext
            gain_pct = 0.0
            p_high = params.supply_pressure_bar * params.intensifier_area_ratio
            f_ext_kn = (p_high * 1e5 * a_cap) / 1000.0
            dp_bar = 10.0
        else:  # Meter-In / Meter-Out
            v_ext = v_std_ext * 0.7  # throttled
            gain_pct = 0.0
            dp_bar = 25.0

        p_pump_kw = (params.supply_pressure_bar * 1e5 * q_m3_s) / (1000.0 * 0.85)

        telemetry = {
            "v_ext_m_s": round(v_ext, 3),
            "v_ret_m_s": round(v_std_ret, 3),
            "f_kn": round(f_ext_kn, 1),
            "power_kw": round(p_pump_kw, 2)
        }

        return HydroPneumaticCircuitsOutput(
            piston_forward_speed_m_s=round(v_ext, 3),
            piston_retract_speed_m_s=round(v_std_ret, 3),
            max_extension_force_kn=round(f_ext_kn, 1),
            regenerative_speed_gain_pct=round(gain_pct, 1),
            throttle_pressure_drop_bar=round(dp_bar, 1),
            hydraulic_pump_power_kw=round(p_pump_kw, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "meter_in_drilling_feed": {"circuit_type": "Meter-In Speed Control", "supply_pressure_bar": 120.0, "cylinder_bore_dia_mm": 80.0, "piston_rod_dia_mm": 35.0, "pump_flow_rate_l_min": 24.0, "external_load_resistance_kn": 35.0, "intensifier_area_ratio": 4.0},
            "regenerative_fast_approach": {"circuit_type": "Regenerative High-Speed Circuit", "supply_pressure_bar": 140.0, "cylinder_bore_dia_mm": 100.0, "piston_rod_dia_mm": 45.0, "pump_flow_rate_l_min": 30.0, "external_load_resistance_kn": 40.0, "intensifier_area_ratio": 4.0}
        }


# ── 5. Absorption Refrigeration (Electrolux) Engine ─────────────────────────
class AbsorptionRefrigerationElectroluxInput(BaseModel):
    system_type: Literal["Ammonia-Water Electrolux 3-Fluid", "Industrial Ammonia-Water System"] = "Ammonia-Water Electrolux 3-Fluid"
    generator_heat_input_kw: float = Field(default=2.5, ge=0.5, le=20.0)
    generator_temp_c: float = Field(default=140.0, ge=90.0, le=200.0)
    condenser_temp_c: float = Field(default=38.0, ge=25.0, le=55.0)
    evaporator_temp_c: float = Field(default=-10.0, ge=-25.0, le=5.0)
    absorber_temp_c: float = Field(default=35.0, ge=20.0, le=50.0)
    cooling_capacity_kw: float = Field(default=1.1, ge=0.2, le=10.0)


class AbsorptionRefrigerationElectroluxOutput(BaseModel):
    carnot_maximum_cop: float
    actual_thermal_cop: float
    hydrogen_partial_pressure_bar: float
    ammonia_partial_pressure_evaporator_bar: float
    system_total_working_pressure_bar: float
    relative_cop_ratio: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AbsorptionRefrigerationElectroluxEngine(BaseSimulationEngine):
    name = "absorption-refrigeration-electrolux"
    description = "ME/S6/RAC: Vapor Absorption Refrigeration (VARS) — Electrolux 3-Fluid Cycle COP & Dalton Hydrogen Partial Pressure"

    def calculate(self, params: AbsorptionRefrigerationElectroluxInput) -> AbsorptionRefrigerationElectroluxOutput:
        tg_k = params.generator_temp_c + 273.15
        tc_k = params.condenser_temp_c + 273.15
        te_k = params.evaporator_temp_c + 273.15
        ta_k = params.absorber_temp_c + 273.15

        # Maximum Carnot COP = (Te / (Tc - Te)) * ((Tg - Ta) / Tg)
        cop_carnot = (te_k / (tc_k - te_k)) * ((tg_k - ta_k) / tg_k)

        # Actual thermal COP = Q_evap / Q_generator
        cop_act = params.cooling_capacity_kw / params.generator_heat_input_kw
        rel_cop = cop_act / cop_carnot if cop_carnot > 0 else 0.0

        # Dalton partial pressures in Electrolux (Total ~ 15 bar)
        # At -10°C, NH3 saturation pressure ~ 2.9 bar
        p_nh3 = 2.9
        p_total = 15.0
        p_h2 = p_total - p_nh3

        telemetry = {
            "cop_carnot": round(cop_carnot, 3),
            "cop_act": round(cop_act, 3),
            "p_nh3_bar": p_nh3,
            "p_h2_bar": p_h2
        }

        return AbsorptionRefrigerationElectroluxOutput(
            carnot_maximum_cop=round(cop_carnot, 3),
            actual_thermal_cop=round(cop_act, 3),
            hydrogen_partial_pressure_bar=round(p_h2, 2),
            ammonia_partial_pressure_evaporator_bar=round(p_nh3, 2),
            system_total_working_pressure_bar=round(p_total, 1),
            relative_cop_ratio=round(rel_cop, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "electrolux_domestic_refrigerator": {"system_type": "Ammonia-Water Electrolux 3-Fluid", "generator_heat_input_kw": 2.5, "generator_temp_c": 140.0, "condenser_temp_c": 38.0, "evaporator_temp_c": -10.0, "absorber_temp_c": 35.0, "cooling_capacity_kw": 1.1},
            "industrial_ammonia_chiller": {"system_type": "Industrial Ammonia-Water System", "generator_heat_input_kw": 8.0, "generator_temp_c": 160.0, "condenser_temp_c": 40.0, "evaporator_temp_c": -15.0, "absorber_temp_c": 36.0, "cooling_capacity_kw": 4.2}
        }


# ── 6. Air Conditioning Load & Duct Design Engine ───────────────────────────
class AirConditioningLoadDuctDesignInput(BaseModel):
    room_sensible_heat_rsh_kw: float = Field(default=35.0, ge=5.0, le=300.0)
    room_latent_heat_rlh_kw: float = Field(default=12.0, ge=1.0, le=100.0)
    room_design_db_c: float = Field(default=24.0, ge=18.0, le=28.0)
    room_design_rh_pct: float = Field(default=50.0, ge=30.0, le=70.0)
    outdoor_air_db_c: float = Field(default=40.0, ge=30.0, le=48.0)
    bypass_factor_bpf: float = Field(default=0.12, ge=0.02, le=0.30)
    duct_friction_rate_pa_m: float = Field(default=1.0, ge=0.2, le=4.0)


class AirConditioningLoadDuctDesignOutput(BaseModel):
    room_sensible_heat_factor_rshf: float
    grand_total_heat_load_tr: float
    apparatus_dew_point_adp_c: float
    supply_air_temperature_c: float
    dehumidified_air_flow_rate_cmm: float
    equivalent_round_duct_dia_mm: float
    rectangular_duct_width_mm: float
    rectangular_duct_height_mm: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AirConditioningLoadDuctDesignEngine(BaseSimulationEngine):
    name = "air-conditioning-load-duct-design"
    description = "ME/S6/RAC: Psychrometric Cooling Load, RSHF, Apparatus Dew Point (ADP) & Equal Friction Duct Sizing"

    def calculate(self, params: AirConditioningLoadDuctDesignInput) -> AirConditioningLoadDuctDesignOutput:
        rsh = params.room_sensible_heat_rsh_kw
        rlh = params.room_latent_heat_rlh_kw
        total_heat_kw = rsh + rlh
        tr_load = total_heat_kw / 3.517  # TR (Tons of Refrigeration)

        rshf = rsh / total_heat_kw

        # ADP approximation from RSHF
        adp_c = 10.5 + (rshf - 0.70) * 12.0
        t_supply_c = adp_c + params.bypass_factor_bpf * (params.room_design_db_c - adp_c)

        # Dehumidified airflow cmm = RSH / (0.0204 * (T_room - T_supply))
        delta_t = max(2.0, params.room_design_db_c - t_supply_c)
        cmm = rsh / (0.0204 * delta_t)
        m3_s = cmm / 60.0

        # Equal friction round duct diameter De = (0.1 * Q^1.852 / dp)^0.2
        d_round_mm = 1000.0 * (((0.109 * math.pow(m3_s, 1.852)) / params.duct_friction_rate_pa_m) ** 0.2)
        # Rectangular aspect ratio 1.5:1 -> a = 1.25 * d, b = a / 1.5
        w_rect = math.ceil((d_round_mm * 1.15) / 25.0) * 25.0
        h_rect = math.ceil((w_rect / 1.5) / 25.0) * 25.0

        telemetry = {
            "rshf": round(rshf, 3),
            "tr": round(tr_load, 2),
            "adp_c": round(adp_c, 1),
            "cmm": round(cmm, 1),
            "duct_dia_mm": round(d_round_mm, 0)
        }

        return AirConditioningLoadDuctDesignOutput(
            room_sensible_heat_factor_rshf=round(rshf, 3),
            grand_total_heat_load_tr=round(tr_load, 2),
            apparatus_dew_point_adp_c=round(adp_c, 1),
            supply_air_temperature_c=round(t_supply_c, 1),
            dehumidified_air_flow_rate_cmm=round(cmm, 1),
            equivalent_round_duct_dia_mm=round(d_round_mm, 0),
            rectangular_duct_width_mm=float(w_rect),
            rectangular_duct_height_mm=float(h_rect),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "office_building_summer_ac": {"room_sensible_heat_rsh_kw": 35.0, "room_latent_heat_rlh_kw": 12.0, "room_design_db_c": 24.0, "room_design_rh_pct": 50.0, "outdoor_air_db_c": 40.0, "bypass_factor_bpf": 0.12, "duct_friction_rate_pa_m": 1.0},
            "auditorium_high_occupancy": {"room_sensible_heat_rsh_kw": 80.0, "room_latent_heat_rlh_kw": 45.0, "room_design_db_c": 23.0, "room_design_rh_pct": 55.0, "outdoor_air_db_c": 42.0, "bypass_factor_bpf": 0.08, "duct_friction_rate_pa_m": 1.2}
        }


# ── 7. CAD Transformations & Solid Modeling Engine ──────────────────────────
class CADTransformationsSolidModelingInput(BaseModel):
    transformation_type: Literal["2D Rotation & Translation", "3D Scaling & Rotation", "CSG Boolean Operation (Union/Cut)"] = "2D Rotation & Translation"
    translation_tx_mm: float = Field(default=50.0, ge=-500.0, le=500.0)
    translation_ty_mm: float = Field(default=30.0, ge=-500.0, le=500.0)
    rotation_angle_theta_deg: float = Field(default=45.0, ge=-360.0, le=360.0)
    scaling_factor_s: float = Field(default=1.5, ge=0.1, le=10.0)
    original_point_x: float = Field(default=20.0, ge=-500.0, le=500.0)
    original_point_y: float = Field(default=40.0, ge=-500.0, le=500.0)


class CADTransformationsSolidModelingOutput(BaseModel):
    transformed_point_x_prime: float
    transformed_point_y_prime: float
    transformation_matrix_3x3: List[List[float]]
    csg_solid_volume_mm3: float
    bezier_curve_midpoint_coord: List[float]
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CADTransformationsSolidModelingEngine(BaseSimulationEngine):
    name = "cad-transformations-solid-modeling"
    description = "ME/S6/CAD: CAD/CAM Geometric Modeling — 2D/3D Homogeneous Matrix Transformations & CSG Solids"

    def calculate(self, params: CADTransformationsSolidModelingInput) -> CADTransformationsSolidModelingOutput:
        rad = math.radians(params.rotation_angle_theta_deg)
        s = params.scaling_factor_s
        tx = params.translation_tx_mm
        ty = params.translation_ty_mm

        # 3x3 Homogeneous transformation matrix
        mat = [
            [round(s * math.cos(rad), 4), round(-s * math.sin(rad), 4), round(tx, 2)],
            [round(s * math.sin(rad), 4), round(s * math.cos(rad), 4), round(ty, 2)],
            [0.0, 0.0, 1.0]
        ]

        # [X', Y', 1]^T = [T] * [X, Y, 1]^T
        x0 = params.original_point_x
        y0 = params.original_point_y
        x_prime = mat[0][0] * x0 + mat[0][1] * y0 + mat[0][2]
        y_prime = mat[1][0] * x0 + mat[1][1] * y0 + mat[1][2]

        # CSG solid volume (Cube 100x100x100 minus cylinder Ø50x100)
        vol_cube = 100.0 ** 3
        vol_cyl = (math.pi / 4.0) * (50.0 ** 2) * 100.0
        vol_csg = vol_cube - vol_cyl

        # Bezier midpoint at t=0.5 with control points (0,0), (50,100), (100,0)
        p_bez = [50.0, 50.0]

        telemetry = {
            "x_prime": round(x_prime, 2),
            "y_prime": round(y_prime, 2),
            "vol_csg": round(vol_csg, 0)
        }

        return CADTransformationsSolidModelingOutput(
            transformed_point_x_prime=round(x_prime, 2),
            transformed_point_y_prime=round(y_prime, 2),
            transformation_matrix_3x3=mat,
            csg_solid_volume_mm3=round(vol_csg, 1),
            bezier_curve_midpoint_coord=p_bez,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "rotate_45_translate_scale": {"transformation_type": "2D Rotation & Translation", "translation_tx_mm": 50.0, "translation_ty_mm": 30.0, "rotation_angle_theta_deg": 45.0, "scaling_factor_s": 1.5, "original_point_x": 20.0, "original_point_y": 40.0},
            "pure_rotation_90": {"transformation_type": "2D Rotation & Translation", "translation_tx_mm": 0.0, "translation_ty_mm": 0.0, "rotation_angle_theta_deg": 90.0, "scaling_factor_s": 1.0, "original_point_x": 30.0, "original_point_y": 10.0}
        }


# ── 8. Industrial Robotics & FMS Engine ──────────────────────────────────────
class IndustrialRoboticsFMSInput(BaseModel):
    robot_configuration: Literal["6-DOF Articulated Arm", "SCARA 4-Axis Assembly", "Cartesian Gantry Robot"] = "6-DOF Articulated Arm"
    link_1_length_mm: float = Field(default=350.0, ge=100.0, le=1000.0)
    link_2_length_mm: float = Field(default=300.0, ge=100.0, le=1000.0)
    joint_1_angle_theta1_deg: float = Field(default=30.0, ge=-180.0, le=180.0)
    joint_2_angle_theta2_deg: float = Field(default=45.0, ge=-180.0, le=180.0)
    payload_mass_kg: float = Field(default=10.0, ge=0.5, le=100.0)


class IndustrialRoboticsFMSOutput(BaseModel):
    end_effector_x_mm: float
    end_effector_y_mm: float
    maximum_reach_envelope_radius_mm: float
    joint_1_static_holding_torque_nm: float
    fms_pick_place_cycle_time_s: float
    work_envelope_coverage_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class IndustrialRoboticsFMSEngine(BaseSimulationEngine):
    name = "industrial-robotics-fms"
    description = "ME/S6/CAD: Industrial Robotics & FMS — Forward Kinematics, Joint Torques & Work Envelope Analysis"

    def calculate(self, params: IndustrialRoboticsFMSInput) -> IndustrialRoboticsFMSOutput:
        l1 = params.link_1_length_mm
        l2 = params.link_2_length_mm
        th1 = math.radians(params.joint_1_angle_theta1_deg)
        th2 = math.radians(params.joint_2_angle_theta2_deg)

        # Forward kinematics
        x_ee = l1 * math.cos(th1) + l2 * math.cos(th1 + th2)
        y_ee = l1 * math.sin(th1) + l2 * math.sin(th1 + th2)

        r_max = l1 + l2

        # Joint 1 torque under payload
        g = 9.81
        m_arm = 12.0  # kg
        t_joint1 = (m_arm * 0.5 * l1 + params.payload_mass_kg * (x_ee / 1000.0)) * g

        cycle_time = 4.5 + (params.payload_mass_kg * 0.15)

        telemetry = {
            "x_ee": round(x_ee, 1),
            "y_ee": round(y_ee, 1),
            "t1_nm": round(t_joint1, 1),
            "reach_mm": r_max
        }

        return IndustrialRoboticsFMSOutput(
            end_effector_x_mm=round(x_ee, 1),
            end_effector_y_mm=round(y_ee, 1),
            maximum_reach_envelope_radius_mm=round(r_max, 1),
            joint_1_static_holding_torque_nm=round(t_joint1, 1),
            fms_pick_place_cycle_time_s=round(cycle_time, 2),
            work_envelope_coverage_status="WITHIN DEXTEROUS WORKSPACE (Collision-Free)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_palletizing_robot": {"robot_configuration": "6-DOF Articulated Arm", "link_1_length_mm": 350.0, "link_2_length_mm": 300.0, "joint_1_angle_theta1_deg": 30.0, "joint_2_angle_theta2_deg": 45.0, "payload_mass_kg": 10.0},
            "scara_pcb_assembly": {"robot_configuration": "SCARA 4-Axis Assembly", "link_1_length_mm": 250.0, "link_2_length_mm": 200.0, "joint_1_angle_theta1_deg": 45.0, "joint_2_angle_theta2_deg": -30.0, "payload_mass_kg": 3.0}
        }


# ── 9. Solar Thermal Flat Plate Collector Engine ────────────────────────────
class SolarThermalFlatPlateCollectorInput(BaseModel):
    collector_gross_area_m2: float = Field(default=2.0, ge=0.5, le=20.0)
    solar_radiation_gt_w_m2: float = Field(default=850.0, ge=200.0, le=1200.0)
    transmittance_absorptance_ta: float = Field(default=0.84, ge=0.6, le=0.95)
    overall_heat_loss_coeff_ul: float = Field(default=4.5, ge=1.5, le=10.0)
    water_inlet_temp_ti_c: float = Field(default=40.0, ge=15.0, le=80.0)
    ambient_temp_ta_c: float = Field(default=30.0, ge=5.0, le=45.0)
    water_flow_rate_kg_s: float = Field(default=0.04, ge=0.005, le=0.5)
    heat_removal_factor_fr: float = Field(default=0.88, ge=0.6, le=0.98)


class SolarThermalFlatPlateCollectorOutput(BaseModel):
    useful_heat_gain_rate_w: float
    water_outlet_temperature_c: float
    collector_thermal_efficiency_pct: float
    stagnation_equilibrium_temperature_c: float
    daily_hot_water_yield_liters_at_60c: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SolarThermalFlatPlateCollectorEngine(BaseSimulationEngine):
    name = "solar-thermal-flat-plate-collector"
    description = "ME/S6/AESM: Solar Thermal Flat Plate Collector — Hottel-Whillier-Bliss Useful Heat Gain & Efficiency"

    def calculate(self, params: SolarThermalFlatPlateCollectorInput) -> SolarThermalFlatPlateCollectorOutput:
        ac = params.collector_gross_area_m2
        gt = params.solar_radiation_gt_w_m2
        fr = params.heat_removal_factor_fr
        ta_prod = params.transmittance_absorptance_ta
        ul = params.overall_heat_loss_coeff_ul
        ti = params.water_inlet_temp_ti_c
        ta = params.ambient_temp_ta_c

        # Hottel-Whillier-Bliss useful heat gain Qu = Ac * Fr * [ Gt * ta - Ul * (Ti - Ta) ]
        loss_term = ul * (ti - ta)
        absorbed = gt * ta_prod
        qu_w = ac * fr * max(0.0, absorbed - loss_term)

        # Outlet temp To = Ti + Qu / (m_dot * cp)
        cp_w = 4187.0  # J/kg.K
        to_c = ti + (qu_w / (params.water_flow_rate_kg_s * cp_w)) if params.water_flow_rate_kg_s > 0 else ti

        eta_th = (qu_w / (ac * gt)) * 100.0 if (ac * gt) > 0 else 0.0

        # Stagnation temperature T_stag = Ta + Gt * (ta) / Ul
        t_stag = ta + (absorbed / ul)

        # 6 hours daily yield: Yield = Qu * 6 * 3600 / (cp * (60 - Ti))
        daily_liters = (qu_w * 6.0 * 3600.0) / (cp_w * max(5.0, 60.0 - ti))

        telemetry = {
            "qu_w": round(qu_w, 1),
            "to_c": round(to_c, 1),
            "eta_pct": round(eta_th, 1),
            "t_stag_c": round(t_stag, 1)
        }

        return SolarThermalFlatPlateCollectorOutput(
            useful_heat_gain_rate_w=round(qu_w, 1),
            water_outlet_temperature_c=round(to_c, 1),
            collector_thermal_efficiency_pct=round(eta_th, 2),
            stagnation_equilibrium_temperature_c=round(t_stag, 1),
            daily_hot_water_yield_liters_at_60c=round(daily_liters, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "domestic_2m2_flat_plate": {"collector_gross_area_m2": 2.0, "solar_radiation_gt_w_m2": 850.0, "transmittance_absorptance_ta": 0.84, "overall_heat_loss_coeff_ul": 4.5, "water_inlet_temp_ti_c": 40.0, "ambient_temp_ta_c": 30.0, "water_flow_rate_kg_s": 0.04, "heat_removal_factor_fr": 0.88},
            "industrial_evacuated_tube_high_temp": {"collector_gross_area_m2": 4.0, "solar_radiation_gt_w_m2": 950.0, "transmittance_absorptance_ta": 0.90, "overall_heat_loss_coeff_ul": 1.8, "water_inlet_temp_ti_c": 50.0, "ambient_temp_ta_c": 32.0, "water_flow_rate_kg_s": 0.08, "heat_removal_factor_fr": 0.94}
        }


# ── 10. Belt Conveyor & Material Handling Engine ────────────────────────────
class BeltConveyorMaterialHandlingInput(BaseModel):
    material_bulk_density_t_m3: float = Field(default=1.4, ge=0.4, le=3.5)
    belt_width_mm: float = Field(default=800.0, ge=400.0, le=2000.0)
    belt_speed_m_s: float = Field(default=1.8, ge=0.5, le=5.0)
    conveyor_center_length_m: float = Field(default=120.0, ge=10.0, le=1000.0)
    lift_height_m: float = Field(default=15.0, ge=0.0, le=150.0)
    drive_wrap_angle_deg: float = Field(default=210.0, ge=160.0, le=240.0)
    drive_pulley_friction_mu: float = Field(default=0.35, ge=0.2, le=0.5)


class BeltConveyorMaterialHandlingOutput(BaseModel):
    carrying_capacity_tons_hr: float
    effective_belt_tension_te_n: float
    tight_side_tension_t1_n: float
    slack_side_tension_t2_n: float
    drive_motor_power_kw: float
    recommended_belt_plies_count: int
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class BeltConveyorMaterialHandlingEngine(BaseSimulationEngine):
    name = "belt-conveyor-material-handling"
    description = "ME/S6/MHS: Material Handling — Troughing Belt Conveyor Capacity, Tensions T1/T2 & Drive Motor Power"

    def calculate(self, params: BeltConveyorMaterialHandlingInput) -> BeltConveyorMaterialHandlingOutput:
        b_m = params.belt_width_mm / 1000.0
        v = params.belt_speed_m_s

        # Capacity Q_m = C * b^2 * v * rho (C ~ 350 for 35 deg trough)
        q_m_t_hr = 350.0 * (b_m ** 2) * v * params.material_bulk_density_t_m3

        # Effective belt pull Te = C_f * L * g * (m_b + m_i + m_m) + m_m * g * H
        g = 9.81
        m_mat_kg_m = (q_m_t_hr * 1000.0) / (3600.0 * v)
        m_belt_kg_m = 18.0 * b_m
        m_idlers_kg_m = 22.0 * b_m

        c_f = 0.025
        t_friction = c_f * params.conveyor_center_length_m * g * (m_belt_kg_m * 2.0 + m_idlers_kg_m + m_mat_kg_m)
        t_lift = m_mat_kg_m * g * params.lift_height_m
        t_e = t_friction + t_lift

        # T1 / T2 ratio = e^(mu * theta)
        rad_wrap = math.radians(params.drive_wrap_angle_deg)
        emutheta = math.exp(params.drive_pulley_friction_mu * rad_wrap)
        t1 = t_e * (emutheta / (emutheta - 1.0))
        t2 = t1 - t_e

        p_drive_kw = (t_e * v) / (1000.0 * 0.88)
        plies = math.ceil(t1 / (params.belt_width_mm * 45.0)) + 1

        telemetry = {
            "capacity_t_hr": round(q_m_t_hr, 1),
            "te_n": round(t_e, 0),
            "t1_n": round(t1, 0),
            "power_kw": round(p_drive_kw, 1)
        }

        return BeltConveyorMaterialHandlingOutput(
            carrying_capacity_tons_hr=round(q_m_t_hr, 1),
            effective_belt_tension_te_n=round(t_e, 1),
            tight_side_tension_t1_n=round(t1, 1),
            slack_side_tension_t2_n=round(t2, 1),
            drive_motor_power_kw=round(p_drive_kw, 2),
            recommended_belt_plies_count=int(plies),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "coal_handling_plant_conveyor": {"material_bulk_density_t_m3": 1.4, "belt_width_mm": 800.0, "belt_speed_m_s": 1.8, "conveyor_center_length_m": 120.0, "lift_height_m": 15.0, "drive_wrap_angle_deg": 210.0, "drive_pulley_friction_mu": 0.35},
            "ore_high_capacity_overland": {"material_bulk_density_t_m3": 2.2, "belt_width_mm": 1200.0, "belt_speed_m_s": 2.5, "conveyor_center_length_m": 300.0, "lift_height_m": 35.0, "drive_wrap_angle_deg": 220.0, "drive_pulley_friction_mu": 0.38}
        }


# ── 11. CPM / PERT Network Analysis Engine ──────────────────────────────────
class CPMPERTNetworkAnalysisInput(BaseModel):
    activity_optimistic_time_to: float = Field(default=4.0, ge=1.0, le=50.0)
    activity_most_likely_time_tm: float = Field(default=8.0, ge=1.0, le=100.0)
    activity_pessimistic_time_tp: float = Field(default=18.0, ge=2.0, le=200.0)
    project_critical_path_duration_days: float = Field(default=42.0, ge=5.0, le=500.0)
    target_project_deadline_ts_days: float = Field(default=46.0, ge=5.0, le=500.0)
    critical_path_variance_sum: float = Field(default=16.0, ge=1.0, le=100.0)


class CPMPERTNetworkAnalysisOutput(BaseModel):
    activity_expected_duration_te: float
    activity_time_variance: float
    activity_standard_deviation: float
    critical_path_standard_deviation: float
    standard_normal_variate_z: float
    project_completion_probability_pct: float
    total_float_days: float
    critical_path_designation: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CPMPERTNetworkAnalysisEngine(BaseSimulationEngine):
    name = "cpm-pert-network-analysis"
    description = "ME/S6/IM: Project Management CPM & PERT — Critical Path, Floats & Probabilistic Completion Time"

    def calculate(self, params: CPMPERTNetworkAnalysisInput) -> CPMPERTNetworkAnalysisOutput:
        to = params.activity_optimistic_time_to
        tm = params.activity_most_likely_time_tm
        tp = params.activity_pessimistic_time_tp

        # Expected time te = (to + 4*tm + tp) / 6
        te = (to + 4.0 * tm + tp) / 6.0
        # Variance sigma^2 = ((tp - to) / 6)^2
        sigma = (tp - to) / 6.0
        var = sigma ** 2

        # Project level Z = (Ts - Te_proj) / sigma_cp
        sigma_cp = math.sqrt(params.critical_path_variance_sum)
        z = (params.target_project_deadline_ts_days - params.project_critical_path_duration_days) / sigma_cp

        # Approximate normal CDF: 0.5 * (1 + erf(z / sqrt(2)))
        prob = 0.5 * (1.0 + math.erf(z / math.sqrt(2.0))) * 100.0

        telemetry = {
            "te_days": round(te, 2),
            "z_score": round(z, 2),
            "prob_pct": round(prob, 1)
        }

        return CPMPERTNetworkAnalysisOutput(
            activity_expected_duration_te=round(te, 2),
            activity_time_variance=round(var, 2),
            activity_standard_deviation=round(sigma, 2),
            critical_path_standard_deviation=round(sigma_cp, 2),
            standard_normal_variate_z=round(z, 3),
            project_completion_probability_pct=round(prob, 2),
            total_float_days=0.0,
            critical_path_designation="CRITICAL PATH ACTIVITY (Zero Total Float)",
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_plant_overhaul": {"activity_optimistic_time_to": 4.0, "activity_most_likely_time_tm": 8.0, "activity_pessimistic_time_tp": 18.0, "project_critical_path_duration_days": 42.0, "target_project_deadline_ts_days": 46.0, "critical_path_variance_sum": 16.0},
            "tight_deadline_project": {"activity_optimistic_time_to": 6.0, "activity_most_likely_time_tm": 12.0, "activity_pessimistic_time_tp": 24.0, "project_critical_path_duration_days": 55.0, "target_project_deadline_ts_days": 50.0, "critical_path_variance_sum": 25.0}
        }


# ── 12. Inventory Control & EOQ Engine ──────────────────────────────────────
class InventoryControlEOQInput(BaseModel):
    annual_demand_d_units: float = Field(default=12000.0, ge=100.0, le=1000000.0)
    ordering_cost_per_order_s: float = Field(default=250.0, ge=10.0, le=5000.0)
    unit_item_cost_c: float = Field(default=80.0, ge=1.0, le=10000.0)
    holding_cost_annual_pct: float = Field(default=18.0, ge=5.0, le=40.0)
    lead_time_days: float = Field(default=10.0, ge=1.0, le=60.0)
    working_days_per_year: int = Field(default=300, ge=200, le=365)


class InventoryControlEOQOutput(BaseModel):
    economic_order_quantity_eoq: float
    optimal_orders_per_year: float
    time_between_orders_days: float
    annual_ordering_cost: float
    annual_holding_cost: float
    total_inventory_cost: float
    reorder_level_rol_units: float
    safety_stock_units: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class InventoryControlEOQEngine(BaseSimulationEngine):
    name = "inventory-control-eoq"
    description = "ME/S6/PM: Production & Inventory Control — Wilson Economic Order Quantity (EOQ), ROL & Annual Costs"

    def calculate(self, params: InventoryControlEOQInput) -> InventoryControlEOQOutput:
        h = params.unit_item_cost_c * (params.holding_cost_annual_pct / 100.0)
        d = params.annual_demand_d_units
        s = params.ordering_cost_per_order_s

        # EOQ = sqrt(2 * D * S / H)
        eoq = math.sqrt((2.0 * d * s) / h)
        n_orders = d / eoq
        t_days = params.working_days_per_year / n_orders

        cost_order = n_orders * s
        cost_hold = (eoq / 2.0) * h
        cost_material = d * params.unit_item_cost_c
        cost_total = cost_order + cost_hold + cost_material

        daily_demand = d / params.working_days_per_year
        # Safety stock ~ 1.65 * sqrt(LT) * daily_sigma(0.25 * d_day)
        ss = 1.65 * math.sqrt(params.lead_time_days) * (0.2 * daily_demand)
        rol = (daily_demand * params.lead_time_days) + ss

        telemetry = {
            "eoq": round(eoq, 0),
            "n_orders": round(n_orders, 1),
            "t_days": round(t_days, 1),
            "rol": round(rol, 0)
        }

        return InventoryControlEOQOutput(
            economic_order_quantity_eoq=round(eoq, 1),
            optimal_orders_per_year=round(n_orders, 1),
            time_between_orders_days=round(t_days, 1),
            annual_ordering_cost=round(cost_order, 2),
            annual_holding_cost=round(cost_hold, 2),
            total_inventory_cost=round(cost_total, 2),
            reorder_level_rol_units=round(rol, 1),
            safety_stock_units=round(ss, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "machine_component_inventory": {"annual_demand_d_units": 12000.0, "ordering_cost_per_order_s": 250.0, "unit_item_cost_c": 80.0, "holding_cost_annual_pct": 18.0, "lead_time_days": 10.0, "working_days_per_year": 300},
            "high_value_spares_control": {"annual_demand_d_units": 3600.0, "ordering_cost_per_order_s": 500.0, "unit_item_cost_c": 450.0, "holding_cost_annual_pct": 22.0, "lead_time_days": 15.0, "working_days_per_year": 300}
        }
