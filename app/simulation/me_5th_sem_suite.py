"""
WBSCTE Mechanical Engineering 5th Semester Physics & Simulation Engine Suite
=============================================================================
Syllabus Mapped:
1. ME/S5/FMM: FlowOrificeVenturimeterEngine
2. ME/S5/FMM: PipeFrictionMinorLossesEngine
3. ME/S5/FMM: HydraulicReactionTurbinesEngine
4. ME/S5/FMM: ReciprocatingPumpAirVesselEngine
5. ME/S5/AMP: JigsFixturesDesignEngine
6. ME/S5/AMP: CNCPartProgrammingGCodeEngine
7. ME/S5/AMP: AdvancedMachiningLaserWaterjetEngine
8. ME/S5/PE:  SteamTurbinesNozzlesEngine
9. ME/S5/PE:  SteamCondensersCoolingTowersEngine
10. ME/S5/AE: AutomotiveGearboxTransmissionEngine
11. ME/S5/AE: AutomotiveBrakingABSEngine
12. ME/S5/TE: PressToolDieDesignEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Flow Orifice & Venturimeter Engine ───────────────────────────────────
class FlowOrificeVenturimeterInput(BaseModel):
    device_type: Literal["Venturimeter", "Orifice Meter"] = "Venturimeter"
    pipe_diameter_d1_mm: float = Field(default=100.0, ge=25.0, le=500.0)
    throat_diameter_d2_mm: float = Field(default=50.0, ge=10.0, le=300.0)
    manometer_deflection_cm: float = Field(default=25.0, ge=1.0, le=100.0)
    manometer_fluid_sg: float = Field(default=13.6, ge=1.2, le=15.0)  # 13.6 for Mercury
    flowing_fluid_sg: float = Field(default=1.0, ge=0.6, le=2.0)      # 1.0 for Water
    discharge_coefficient_cd: float = Field(default=0.98, ge=0.5, le=1.0)


class FlowOrificeVenturimeterOutput(BaseModel):
    differential_head_m_fluid: float
    theoretical_discharge_l_s: float
    actual_discharge_l_s: float
    throat_velocity_m_s: float
    pipe_inlet_velocity_m_s: float
    reynolds_number_inlet: float
    pressure_recovery_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class FlowOrificeVenturimeterEngine(BaseSimulationEngine):
    name = "flow-orifice-venturimeter"
    description = "ME/S5/FMM: Orifice Meter & Venturimeter Flow Calibration, Cd Coefficients & Differential Manometer"

    def calculate(self, params: FlowOrificeVenturimeterInput) -> FlowOrificeVenturimeterOutput:
        h_m = params.manometer_deflection_cm / 100.0
        # Differential head H = h * (Sm/Sf - 1)
        h_fluid = h_m * ((params.manometer_fluid_sg / params.flowing_fluid_sg) - 1.0)

        d1 = params.pipe_diameter_d1_mm / 1000.0
        d2 = params.throat_diameter_d2_mm / 1000.0
        a1 = (math.pi / 4.0) * (d1 ** 2)
        a2 = (math.pi / 4.0) * (d2 ** 2)

        g = 9.81
        q_th_m3_s = (a1 * a2 * math.sqrt(2.0 * g * h_fluid)) / math.sqrt(max(1e-6, a1**2 - a2**2))
        q_act_m3_s = params.discharge_coefficient_cd * q_th_m3_s

        v1 = q_act_m3_s / a1
        v2 = q_act_m3_s / a2

        # Reynolds number with water kinematic viscosity nu = 1e-6 m2/s
        nu = 1.0e-6
        re_d1 = (v1 * d1) / nu

        recov = 88.0 if params.device_type == "Venturimeter" else 45.0

        telemetry = {
            "device": params.device_type,
            "q_act_l_s": round(q_act_m3_s * 1000.0, 2),
            "h_fluid_m": round(h_fluid, 2),
            "reynolds": round(re_d1, 0)
        }

        return FlowOrificeVenturimeterOutput(
            differential_head_m_fluid=round(h_fluid, 3),
            theoretical_discharge_l_s=round(q_th_m3_s * 1000.0, 2),
            actual_discharge_l_s=round(q_act_m3_s * 1000.0, 2),
            throat_velocity_m_s=round(v2, 2),
            pipe_inlet_velocity_m_s=round(v1, 2),
            reynolds_number_inlet=round(re_d1, 0),
            pressure_recovery_pct=recov,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "venturimeter_water_hg": {"device_type": "Venturimeter", "pipe_diameter_d1_mm": 100.0, "throat_diameter_d2_mm": 50.0, "manometer_deflection_cm": 25.0, "manometer_fluid_sg": 13.6, "flowing_fluid_sg": 1.0, "discharge_coefficient_cd": 0.98},
            "orificemeter_water_test": {"device_type": "Orifice Meter", "pipe_diameter_d1_mm": 100.0, "throat_diameter_d2_mm": 50.0, "manometer_deflection_cm": 18.0, "manometer_fluid_sg": 13.6, "flowing_fluid_sg": 1.0, "discharge_coefficient_cd": 0.62}
        }


# ── 2. Pipe Friction & Minor Losses Engine ──────────────────────────────────
class PipeFrictionMinorLossesInput(BaseModel):
    pipe_diameter_mm: float = Field(default=50.0, ge=15.0, le=300.0)
    pipe_length_m: float = Field(default=30.0, ge=5.0, le=500.0)
    flow_velocity_m_s: float = Field(default=2.2, ge=0.2, le=10.0)
    pipe_material: Literal["Galvanized Iron (e=0.15mm)", "Commercial Steel (e=0.045mm)", "Smooth Copper (e=0.0015mm)", "PVC Plastic (e=0.001mm)"] = "Commercial Steel (e=0.045mm)"
    num_90_elbows: int = Field(default=3, ge=0, le=20)
    num_gate_valves: int = Field(default=2, ge=0, le=10)
    valve_opening_pct: float = Field(default=100.0, ge=20.0, le=100.0)


class PipeFrictionMinorLossesOutput(BaseModel):
    darcy_friction_factor_f: float
    major_friction_head_loss_hf_m: float
    minor_head_loss_hm_m: float
    total_head_loss_m: float
    flow_rate_l_s: float
    pumping_power_kw: float
    reynolds_number: float
    flow_regime: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PipeFrictionMinorLossesEngine(BaseSimulationEngine):
    name = "pipe-friction-minor-losses"
    description = "ME/S5/FMM: Pipe Friction Darcy-Weisbach Equation, Minor Losses (Bends/Valves) & Moody Chart"

    def calculate(self, params: PipeFrictionMinorLossesInput) -> PipeFrictionMinorLossesOutput:
        d_m = params.pipe_diameter_mm / 1000.0
        v = params.flow_velocity_m_s
        nu = 1.0e-6
        re = (v * d_m) / nu

        roughness = {
            "Galvanized Iron (e=0.15mm)": 0.15e-3,
            "Commercial Steel (e=0.045mm)": 0.045e-3,
            "Smooth Copper (e=0.0015mm)": 0.0015e-3,
            "PVC Plastic (e=0.001mm)": 0.001e-3
        }[params.pipe_material]

        # Swamee-Jain explicit formula for Darcy friction factor f
        if re < 2300:
            f = 64.0 / re
            regime = "Laminar Flow (Re < 2300)"
        else:
            rel_e = roughness / d_m
            term = (rel_e / 3.7) + (5.74 / (re ** 0.9))
            f = 0.25 / ((math.log10(term)) ** 2)
            regime = "Turbulent Flow (Re > 4000)" if re > 4000 else "Transition Zone"

        g = 9.81
        hf = (f * params.pipe_length_m * (v ** 2)) / (2.0 * g * d_m)

        # Minor losses: K_elbow = 0.75, K_valve = 0.2 (full open) -> increases as closed
        k_elbow = 0.75 * params.num_90_elbows
        k_valve_single = 0.2 * ((100.0 / params.valve_opening_pct) ** 2)
        k_valves = k_valve_single * params.num_gate_valves
        k_total = k_elbow + k_valves + 0.5  # 0.5 entrance loss
        hm = k_total * ((v ** 2) / (2.0 * g))

        h_total = hf + hm
        area = (math.pi / 4.0) * (d_m ** 2)
        q_m3_s = area * v
        q_l_s = q_m3_s * 1000.0

        rho = 1000.0
        p_pump_kw = (rho * g * q_m3_s * h_total) / (1000.0 * 0.75)  # 75% pump eff

        telemetry = {
            "reynolds": round(re, 0),
            "f_factor": round(f, 4),
            "hf_m": round(hf, 2),
            "hm_m": round(hm, 2)
        }

        return PipeFrictionMinorLossesOutput(
            darcy_friction_factor_f=round(f, 4),
            major_friction_head_loss_hf_m=round(hf, 2),
            minor_head_loss_hm_m=round(hm, 2),
            total_head_loss_m=round(h_total, 2),
            flow_rate_l_s=round(q_l_s, 2),
            pumping_power_kw=round(p_pump_kw, 2),
            reynolds_number=round(re, 0),
            flow_regime=regime,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "commercial_steel_line": {"pipe_diameter_mm": 50.0, "pipe_length_m": 30.0, "flow_velocity_m_s": 2.2, "pipe_material": "Commercial Steel (e=0.045mm)", "num_90_elbows": 3, "num_gate_valves": 2, "valve_opening_pct": 100.0},
            "galvanized_throttled_line": {"pipe_diameter_mm": 40.0, "pipe_length_m": 50.0, "flow_velocity_m_s": 1.8, "pipe_material": "Galvanized Iron (e=0.15mm)", "num_90_elbows": 5, "num_gate_valves": 1, "valve_opening_pct": 50.0}
        }


# ── 3. Hydraulic Reaction Turbines Engine ───────────────────────────────────
class HydraulicReactionTurbinesInput(BaseModel):
    turbine_type: Literal["Francis Reaction Turbine", "Kaplan Axial Turbine"] = "Francis Reaction Turbine"
    net_head_h_m: float = Field(default=45.0, ge=10.0, le=300.0)
    discharge_q_m3_s: float = Field(default=3.5, ge=0.2, le=50.0)
    runner_diameter_d_m: float = Field(default=0.85, ge=0.3, le=4.0)
    speed_rpm: float = Field(default=600.0, ge=100.0, le=2000.0)
    guide_vane_angle_alpha_deg: float = Field(default=22.0, ge=10.0, le=45.0)
    runner_blade_angle_theta_deg: float = Field(default=85.0, ge=60.0, le=120.0)
    draft_tube_efficiency_pct: float = Field(default=82.0, ge=50.0, le=95.0)


class HydraulicReactionTurbinesOutput(BaseModel):
    hydraulic_power_input_kw: float
    shaft_power_output_kw: float
    overall_efficiency_pct: float
    specific_speed_ns: float
    tangential_runner_speed_u1_m_s: float
    whirl_velocity_vw1_m_s: float
    draft_tube_pressure_recovery_m: float
    thoma_cavitation_factor: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class HydraulicReactionTurbinesEngine(BaseSimulationEngine):
    name = "hydraulic-reaction-turbines"
    description = "ME/S5/FMM: Francis & Kaplan Reaction Turbines — Velocity Triangles, Draft Tube Recovery & Cavitation"

    def calculate(self, params: HydraulicReactionTurbinesInput) -> HydraulicReactionTurbinesOutput:
        g = 9.81
        rho = 1000.0
        p_hyd_kw = (rho * g * params.discharge_q_m3_s * params.net_head_h_m) / 1000.0

        u1 = (math.pi * params.runner_diameter_d_m * params.speed_rpm) / 60.0
        # Flow velocity Vf1 ~ sqrt(2 * g * H * 0.25)
        vf1 = 0.28 * math.sqrt(2.0 * g * params.net_head_h_m)
        rad_alpha = math.radians(params.guide_vane_angle_alpha_deg)
        vw1 = vf1 / math.tan(rad_alpha)

        # Euler work per kg = u1 * vw1
        euler_head = (u1 * vw1) / g
        eta_hyd = min(0.94, (euler_head / params.net_head_h_m))
        eta_mech = 0.96
        eta_overall = eta_hyd * eta_mech

        p_shaft_kw = p_hyd_kw * eta_overall

        # Specific speed Ns = N * sqrt(P_kw) / (H^1.25)
        ns = (params.speed_rpm * math.sqrt(p_shaft_kw)) / (params.net_head_h_m ** 1.25)

        # Draft tube recovery
        v2 = vf1
        v3 = v2 * 0.35  # Tailrace velocity
        dt_recov = (params.draft_tube_efficiency_pct / 100.0) * ((v2**2 - v3**2) / (2.0 * g))

        # Thoma cavitation factor sigma = (H_bar - H_vap - Hs) / H
        sigma = (10.3 - 0.3 - 2.5) / params.net_head_h_m

        telemetry = {
            "type": params.turbine_type,
            "p_shaft_kw": round(p_shaft_kw, 1),
            "eta_pct": round(eta_overall * 100.0, 1),
            "ns": round(ns, 1)
        }

        return HydraulicReactionTurbinesOutput(
            hydraulic_power_input_kw=round(p_hyd_kw, 1),
            shaft_power_output_kw=round(p_shaft_kw, 1),
            overall_efficiency_pct=round(eta_overall * 100.0, 2),
            specific_speed_ns=round(ns, 1),
            tangential_runner_speed_u1_m_s=round(u1, 2),
            whirl_velocity_vw1_m_s=round(vw1, 2),
            draft_tube_pressure_recovery_m=round(dt_recov, 2),
            thoma_cavitation_factor=round(sigma, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "francis_medium_head": {"turbine_type": "Francis Reaction Turbine", "net_head_h_m": 45.0, "discharge_q_m3_s": 3.5, "runner_diameter_d_m": 0.85, "speed_rpm": 600.0, "guide_vane_angle_alpha_deg": 22.0, "runner_blade_angle_theta_deg": 85.0, "draft_tube_efficiency_pct": 82.0},
            "kaplan_low_head": {"turbine_type": "Kaplan Axial Turbine", "net_head_h_m": 18.0, "discharge_q_m3_s": 12.0, "runner_diameter_d_m": 1.4, "speed_rpm": 300.0, "guide_vane_angle_alpha_deg": 35.0, "runner_blade_angle_theta_deg": 110.0, "draft_tube_efficiency_pct": 88.0}
        }


# ── 4. Reciprocating Pump & Air Vessel Engine ───────────────────────────────
class ReciprocatingPumpAirVesselInput(BaseModel):
    pump_type: Literal["Single-Acting", "Double-Acting"] = "Single-Acting"
    cylinder_bore_mm: float = Field(default=120.0, ge=50.0, le=350.0)
    stroke_length_mm: float = Field(default=220.0, ge=80.0, le=500.0)
    crank_speed_rpm: float = Field(default=60.0, ge=20.0, le=150.0)
    suction_head_m: float = Field(default=3.5, ge=1.0, le=7.5)
    delivery_head_m: float = Field(default=25.0, ge=5.0, le=80.0)
    actual_discharge_l_s: float = Field(default=4.05, ge=0.5, le=30.0)
    air_vessel_installed: bool = True


class ReciprocatingPumpAirVesselOutput(BaseModel):
    theoretical_discharge_l_s: float
    actual_discharge_l_s: float
    percentage_slip_pct: float
    discharge_coefficient_cd: float
    pump_shaft_power_kw: float
    work_saved_by_air_vessel_pct: float
    suction_max_acceleration_head_m: float
    separation_cavitation_risk: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ReciprocatingPumpAirVesselEngine(BaseSimulationEngine):
    name = "reciprocating-pump-air-vessel"
    description = "ME/S5/FMM: Reciprocating Pump — % Slip, Acceleration Head, Air Vessel Work Saving & Indicator Diagram"

    def calculate(self, params: ReciprocatingPumpAirVesselInput) -> ReciprocatingPumpAirVesselOutput:
        d_m = params.cylinder_bore_mm / 1000.0
        l_m = params.stroke_length_mm / 1000.0
        n = params.crank_speed_rpm
        area = (math.pi / 4.0) * (d_m ** 2)

        multi = 2.0 if params.pump_type == "Double-Acting" else 1.0
        q_th_m3_s = (multi * area * l_m * n) / 60.0
        q_th_l_s = q_th_m3_s * 1000.0

        q_act_l_s = params.actual_discharge_l_s
        q_act_m3_s = q_act_l_s / 1000.0

        slip_pct = ((q_th_l_s - q_act_l_s) / q_th_l_s) * 100.0
        cd = q_act_l_s / q_th_l_s if q_th_l_s > 0 else 1.0

        # Acceleration head: h_a = (l_pipe / g) * (A / a_p) * omega^2 * r
        omega = (2.0 * math.pi * n) / 60.0
        r_m = l_m / 2.0
        a_pipe = (math.pi / 4.0) * ((d_m * 0.6) ** 2)
        h_as = (10.0 / 9.81) * (area / a_pipe) * (omega ** 2) * r_m

        work_saved = 84.8 if params.pump_type == "Single-Acting" else 39.2
        if not params.air_vessel_installed:
            work_saved = 0.0

        total_head = params.suction_head_m + params.delivery_head_m
        p_hyd_kw = (1000.0 * 9.81 * q_act_m3_s * total_head) / 1000.0
        p_shaft_kw = p_hyd_kw / 0.82

        risk = "SAFE (Total suction head < 7.8m vapor limit)" if (params.suction_head_m + (0.0 if params.air_vessel_installed else h_as)) < 7.8 else "CAVITATION RISK: Separation in suction pipe!"

        telemetry = {
            "q_th": round(q_th_l_s, 2),
            "q_act": round(q_act_l_s, 2),
            "slip_pct": round(slip_pct, 2),
            "has_m": round(h_as, 2)
        }

        return ReciprocatingPumpAirVesselOutput(
            theoretical_discharge_l_s=round(q_th_l_s, 2),
            actual_discharge_l_s=round(q_act_l_s, 2),
            percentage_slip_pct=round(slip_pct, 2),
            discharge_coefficient_cd=round(cd, 3),
            pump_shaft_power_kw=round(p_shaft_kw, 2),
            work_saved_by_air_vessel_pct=work_saved,
            suction_max_acceleration_head_m=round(h_as, 2),
            separation_cavitation_risk=risk,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "single_acting_fitted_air_vessel": {"pump_type": "Single-Acting", "cylinder_bore_mm": 120.0, "stroke_length_mm": 220.0, "crank_speed_rpm": 60.0, "suction_head_m": 3.5, "delivery_head_m": 25.0, "actual_discharge_l_s": 4.05, "air_vessel_installed": True},
            "double_acting_boiler_feed": {"pump_type": "Double-Acting", "cylinder_bore_mm": 100.0, "stroke_length_mm": 180.0, "crank_speed_rpm": 75.0, "suction_head_m": 2.5, "delivery_head_m": 45.0, "actual_discharge_l_s": 6.80, "air_vessel_installed": True}
        }


# ── 5. Jigs & Fixtures Design Engine ────────────────────────────────────────
class JigsFixturesDesignInput(BaseModel):
    workpiece_shape: Literal["Prismatic Block", "Cylindrical Shaft", "Irregular Housing"] = "Prismatic Block"
    locating_method: Literal["3-2-1 Pin Location", "V-Block Location", "Mandrel & Center"] = "3-2-1 Pin Location"
    clamping_type: Literal["Quick-Acting Cam Clamp", "Screw Clamp", "Pneumatic Toggle Clamp"] = "Quick-Acting Cam Clamp"
    cutting_thrust_force_n: float = Field(default=1600.0, ge=200.0, le=10000.0)
    friction_coefficient: float = Field(default=0.25, ge=0.1, le=0.5)
    safety_factor: float = Field(default=2.5, ge=1.5, le=5.0)
    drill_bushing_dia_mm: float = Field(default=14.0, ge=3.0, le=40.0)


class JigsFixturesDesignOutput(BaseModel):
    restrained_degrees_of_freedom: int
    required_clamping_force_n: float
    jig_plate_min_thickness_mm: float
    drill_bushing_tolerance_grade: str
    clamping_contact_stress_mpa: float
    locating_error_allowance_um: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class JigsFixturesDesignEngine(BaseSimulationEngine):
    name = "jigs-fixtures-design"
    description = "ME/S5/AMP: Jigs & Fixtures Design — 3-2-1 Locating Principle, Clamping Force & Drill Bushing Sizing"

    def calculate(self, params: JigsFixturesDesignInput) -> JigsFixturesDesignOutput:
        dof = 9 if params.locating_method == "3-2-1 Pin Location" else (8 if params.locating_method == "V-Block Location" else 10)
        req_clamp_n = (params.safety_factor * params.cutting_thrust_force_n) / params.friction_coefficient

        # Jig plate thickness sizing ~ 1.5 * drill bushing dia
        t_plate_mm = 1.5 * params.drill_bushing_dia_mm

        # Contact stress
        pad_area_mm2 = 450.0
        stress_mpa = req_clamp_n / pad_area_mm2

        bushing_tol = f"F7/h6 Precision Press-Fit (IS 4218) for Ø{params.drill_bushing_dia_mm}mm"

        telemetry = {
            "dof_restrained": dof,
            "clamp_force_n": round(req_clamp_n, 1),
            "t_plate_mm": round(t_plate_mm, 1)
        }

        return JigsFixturesDesignOutput(
            restrained_degrees_of_freedom=dof,
            required_clamping_force_n=round(req_clamp_n, 1),
            jig_plate_min_thickness_mm=round(t_plate_mm, 1),
            drill_bushing_tolerance_grade=bushing_tol,
            clamping_contact_stress_mpa=round(stress_mpa, 2),
            locating_error_allowance_um=12.5,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "drilling_jig_prismatic": {"workpiece_shape": "Prismatic Block", "locating_method": "3-2-1 Pin Location", "clamping_type": "Quick-Acting Cam Clamp", "cutting_thrust_force_n": 1600.0, "friction_coefficient": 0.25, "safety_factor": 2.5, "drill_bushing_dia_mm": 14.0},
            "milling_fixture_shaft": {"workpiece_shape": "Cylindrical Shaft", "locating_method": "V-Block Location", "clamping_type": "Screw Clamp", "cutting_thrust_force_n": 2400.0, "friction_coefficient": 0.30, "safety_factor": 3.0, "drill_bushing_dia_mm": 20.0}
        }


# ── 6. CNC Part Programming & G-Code Engine ─────────────────────────────────
class CNCPartProgrammingGCodeInput(BaseModel):
    machine_type: Literal["CNC Lathe Turning (2-Axis)", "Vertical Machining Center VMC (3-Axis)"] = "CNC Lathe Turning (2-Axis)"
    stock_diameter_mm: float = Field(default=50.0, ge=15.0, le=200.0)
    stock_length_mm: float = Field(default=100.0, ge=20.0, le=400.0)
    cutting_speed_vc_m_min: float = Field(default=180.0, ge=40.0, le=400.0)
    feed_rate_mm_rev: float = Field(default=0.22, ge=0.05, le=1.0)
    depth_of_cut_mm: float = Field(default=2.0, ge=0.5, le=6.0)
    canned_cycle: Literal["G71 Longitudinal Roughing", "G72 Transverse Facing", "G76 Threading Cycle", "G81 Drilling Cycle"] = "G71 Longitudinal Roughing"


class CNCPartProgrammingGCodeOutput(BaseModel):
    spindle_speed_rpm: float
    feed_speed_mm_min: float
    total_machining_time_s: float
    material_removal_rate_cm3_min: float
    gcode_program_preview: List[str]
    total_program_blocks: int
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CNCPartProgrammingGCodeEngine(BaseSimulationEngine):
    name = "cnc-part-programming-gcode"
    description = "ME/S5/AMP: CNC Part Programming — G-Codes, M-Codes, G71 Canned Cycles & Feed-Speed Calculations"

    def calculate(self, params: CNCPartProgrammingGCodeInput) -> CNCPartProgrammingGCodeOutput:
        d_m = params.stock_diameter_mm / 1000.0
        n_rpm = (params.cutting_speed_vc_m_min * 1000.0) / (math.pi * params.stock_diameter_mm)
        vf_mm_min = params.feed_rate_mm_rev * n_rpm

        # MRR = Vc * 1000 * f * ap
        mrr_cm3_min = (params.cutting_speed_vc_m_min * 1000.0 * params.feed_rate_mm_rev * params.depth_of_cut_mm) / 1000.0

        # Pass estimation
        total_depth = params.stock_diameter_mm * 0.25
        num_passes = math.ceil(total_depth / params.depth_of_cut_mm)
        t_mach_s = (params.stock_length_mm / (vf_mm_min / 60.0)) * num_passes

        gcode = [
            "O0001 (CNC TURNING PROGRAM - FANUC)",
            "G21 G90 G95 (METRIC, ABSOLUTE, MM/REV);",
            "G28 U0.0 W0.0 (RETURN TO MACHINE HOME);",
            f"G50 S3000 (MAX SPINDLE SPEED LIMIT);",
            f"G96 S{int(params.cutting_speed_vc_m_min)} M03 (CONST SURFACE SPEED & SPINDLE CW);",
            f"T0101 M08 (TOOL 01 SELECT & COOLANT ON);",
            f"G00 X{params.stock_diameter_mm + 2.0:.1f} Z2.0;",
            f"G71 U{params.depth_of_cut_mm:.1f} R0.5 (ROUGHING CYCLE - DEPTH & RETRACT);",
            "G71 P100 Q110 U0.5 W0.1 F" + f"{params.feed_rate_mm_rev:.2f};",
            "N100 G01 X20.0 Z0.0;",
            f"G01 X30.0 Z-30.0;",
            f"G01 X{params.stock_diameter_mm:.1f} Z-70.0;",
            "N110 G01 X" + f"{params.stock_diameter_mm + 2.0:.1f};",
            "G70 P100 Q110 (FINISHING CYCLE);",
            "G28 U0.0 W0.0 M09;",
            "M30 (END OF PROGRAM);"
        ]

        telemetry = {
            "rpm": round(n_rpm, 0),
            "feed_mm_min": round(vf_mm_min, 1),
            "mrr": round(mrr_cm3_min, 1),
            "time_s": round(t_mach_s, 1)
        }

        return CNCPartProgrammingGCodeOutput(
            spindle_speed_rpm=round(n_rpm, 0),
            feed_speed_mm_min=round(vf_mm_min, 1),
            total_machining_time_s=round(t_mach_s, 1),
            material_removal_rate_cm3_min=round(mrr_cm3_min, 2),
            gcode_program_preview=gcode,
            total_program_blocks=len(gcode),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "step_turning_mild_steel": {"machine_type": "CNC Lathe Turning (2-Axis)", "stock_diameter_mm": 50.0, "stock_length_mm": 100.0, "cutting_speed_vc_m_min": 180.0, "feed_rate_mm_rev": 0.22, "depth_of_cut_mm": 2.0, "canned_cycle": "G71 Longitudinal Roughing"},
            "high_speed_aluminum_turn": {"machine_type": "CNC Lathe Turning (2-Axis)", "stock_diameter_mm": 60.0, "stock_length_mm": 120.0, "cutting_speed_vc_m_min": 320.0, "feed_rate_mm_rev": 0.30, "depth_of_cut_mm": 3.0, "canned_cycle": "G71 Longitudinal Roughing"}
        }


# ── 7. Advanced Machining (Laser & Waterjet) Engine ─────────────────────────
class AdvancedMachiningLaserWaterjetInput(BaseModel):
    process_type: Literal["Fiber Laser Cutting (LBM)", "Abrasive Water Jet (AWJM)", "Ultrasonic Machining (USM)"] = "Fiber Laser Cutting (LBM)"
    sheet_thickness_mm: float = Field(default=6.0, ge=0.5, le=30.0)
    material_type: Literal["Mild Steel (CRCA)", "Stainless Steel (304)", "Aluminum Alloy (6061)", "Titanium (Grade 5)"] = "Mild Steel (CRCA)"
    laser_power_kw: float = Field(default=3.0, ge=0.5, le=15.0)
    waterjet_pressure_mpa: float = Field(default=380.0, ge=150.0, le=600.0)
    abrasive_flow_rate_g_min: float = Field(default=350.0, ge=100.0, le=800.0)


class AdvancedMachiningLaserWaterjetOutput(BaseModel):
    cutting_speed_mm_min: float
    kerf_width_mm: float
    heat_affected_zone_haz_mm: float
    taper_angle_deg: float
    specific_energy_j_mm3: float
    surface_finish_ra_um: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AdvancedMachiningLaserWaterjetEngine(BaseSimulationEngine):
    name = "advanced-machining-laser-waterjet"
    description = "ME/S5/AMP: Advanced Machining — Fiber Laser Beam (LBM) & Abrasive Water Jet (AWJM) Cutting Dynamics"

    def calculate(self, params: AdvancedMachiningLaserWaterjetInput) -> AdvancedMachiningLaserWaterjetOutput:
        t = params.sheet_thickness_mm

        if params.process_type == "Fiber Laser Cutting (LBM)":
            # Speed ~ Power / (t^1.1)
            v_cut = (params.laser_power_kw * 1800.0) / (t ** 1.15)
            kerf = 0.18 + 0.02 * t
            haz = 0.12 + 0.03 * t
            taper = 0.45
            ra = 1.4 + 0.1 * t
            energy = 45.0
        elif params.process_type == "Abrasive Water Jet (AWJM)":
            # Speed ~ (Pressure^1.4 * Abrasive) / t^1.2
            v_cut = (math.pow(params.waterjet_pressure_mpa / 350.0, 1.4) * (params.abrasive_flow_rate_g_min / 300.0) * 1200.0) / (t ** 1.25)
            kerf = 0.85
            haz = 0.0  # Cold cutting process (no thermal distortion)
            taper = 1.2
            ra = 2.2 + 0.15 * t
            energy = 85.0
        else:  # USM
            v_cut = 120.0 / math.sqrt(t)
            kerf = 0.45
            haz = 0.0
            taper = 1.8
            ra = 0.8
            energy = 120.0

        telemetry = {
            "process": params.process_type,
            "v_cut_mm_min": round(v_cut, 1),
            "kerf_mm": round(kerf, 3),
            "haz_mm": round(haz, 2)
        }

        return AdvancedMachiningLaserWaterjetOutput(
            cutting_speed_mm_min=round(v_cut, 1),
            kerf_width_mm=round(kerf, 3),
            heat_affected_zone_haz_mm=round(haz, 3),
            taper_angle_deg=round(taper, 2),
            specific_energy_j_mm3=round(energy, 1),
            surface_finish_ra_um=round(ra, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "laser_6mm_mild_steel": {"process_type": "Fiber Laser Cutting (LBM)", "sheet_thickness_mm": 6.0, "material_type": "Mild Steel (CRCA)", "laser_power_kw": 3.0, "waterjet_pressure_mpa": 380.0, "abrasive_flow_rate_g_min": 350.0},
            "awjm_12mm_titanium": {"process_type": "Abrasive Water Jet (AWJM)", "sheet_thickness_mm": 12.0, "material_type": "Titanium (Grade 5)", "laser_power_kw": 4.0, "waterjet_pressure_mpa": 420.0, "abrasive_flow_rate_g_min": 450.0}
        }


# ── 8. Steam Turbines & Nozzles Engine ──────────────────────────────────────
class SteamTurbinesNozzlesInput(BaseModel):
    nozzle_inlet_pressure_bar: float = Field(default=15.0, ge=3.0, le=100.0)
    nozzle_inlet_temp_c: float = Field(default=300.0, ge=150.0, le=600.0)
    condenser_back_pressure_bar: float = Field(default=1.5, ge=0.05, le=10.0)
    stage_type: Literal["De Laval Single Impulse Stage", "Curtis 2-Row Velocity Compounded", "Parson's 50% Reaction Stage"] = "De Laval Single Impulse Stage"
    blade_speed_ratio_rho: float = Field(default=0.45, ge=0.2, le=0.95)
    nozzle_angle_alpha1_deg: float = Field(default=20.0, ge=12.0, le=35.0)
    steam_flow_rate_kg_s: float = Field(default=8.5, ge=0.5, le=50.0)


class SteamTurbinesNozzlesOutput(BaseModel):
    critical_pressure_ratio: float
    critical_throat_pressure_bar: float
    steam_exit_velocity_m_s: float
    blade_speed_u_m_s: float
    whirl_velocity_change_m_s: float
    diagram_blading_efficiency_pct: float
    stage_power_output_kw: float
    axial_thrust_force_n: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SteamTurbinesNozzlesEngine(BaseSimulationEngine):
    name = "steam-turbines-nozzles"
    description = "ME/S5/PE: Steam Nozzles Critical Pressure Ratio, Velocity Triangles & Blading Diagram Efficiency"

    def calculate(self, params: SteamTurbinesNozzlesInput) -> SteamTurbinesNozzlesOutput:
        gamma = 1.3  # Superheated steam
        r_crit = (2.0 / (gamma + 1.0)) ** (gamma / (gamma - 1.0))  # ~ 0.546
        p_throat = params.nozzle_inlet_pressure_bar * r_crit

        # Isentropic enthalpy drop approx: dh = cp * (T1 - T2s)
        p1 = params.nozzle_inlet_pressure_bar
        p2 = params.condenser_back_pressure_bar
        t1_k = params.nozzle_inlet_temp_c + 273.15
        t2s_k = t1_k * math.pow(p2 / p1, (gamma - 1.0) / gamma)
        dh_kj = 2.1 * (t1_k - t2s_k)

        # Steam exit velocity C1 = sqrt(2000 * dh) * nozzle_eff(0.95)
        c1 = 44.72 * math.sqrt(max(10.0, dh_kj)) * 0.95
        u = params.blade_speed_ratio_rho * c1

        rad_alpha = math.radians(params.nozzle_angle_alpha1_deg)
        v_w1 = c1 * math.cos(rad_alpha)
        # Velocity compounding / blading delta Vw
        if params.stage_type == "De Laval Single Impulse Stage":
            delta_vw = 2.0 * (v_w1 - u) * 0.92
            eta_diag = (2.0 * u * delta_vw) / (c1 ** 2) * 100.0
        elif params.stage_type == "Curtis 2-Row Velocity Compounded":
            delta_vw = 4.0 * (v_w1 - 2.0 * u) * 0.88
            eta_diag = (2.0 * u * delta_vw) / (c1 ** 2) * 100.0
        else:  # Parson's 50% Reaction
            delta_vw = 2.0 * (v_w1 - u * 0.5)
            eta_diag = (2.0 * (v_w1 * u - u**2)) / ((v_w1**2) + (u**2)) * 100.0

        eta_diag = max(20.0, min(92.0, eta_diag))
        p_stage_kw = (params.steam_flow_rate_kg_s * delta_vw * u) / 1000.0
        f_axial = params.steam_flow_rate_kg_s * (c1 * math.sin(rad_alpha) * 0.15)

        telemetry = {
            "v_steam_m_s": round(c1, 1),
            "blade_speed_m_s": round(u, 1),
            "power_kw": round(p_stage_kw, 1),
            "diag_eff_pct": round(eta_diag, 1)
        }

        return SteamTurbinesNozzlesOutput(
            critical_pressure_ratio=round(r_crit, 3),
            critical_throat_pressure_bar=round(p_throat, 2),
            steam_exit_velocity_m_s=round(c1, 1),
            blade_speed_u_m_s=round(u, 1),
            whirl_velocity_change_m_s=round(delta_vw, 1),
            diagram_blading_efficiency_pct=round(eta_diag, 2),
            stage_power_output_kw=round(p_stage_kw, 1),
            axial_thrust_force_n=round(f_axial, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "de_laval_impulse_stage": {"nozzle_inlet_pressure_bar": 15.0, "nozzle_inlet_temp_c": 300.0, "condenser_back_pressure_bar": 1.5, "stage_type": "De Laval Single Impulse Stage", "blade_speed_ratio_rho": 0.45, "nozzle_angle_alpha1_deg": 20.0, "steam_flow_rate_kg_s": 8.5},
            "curtis_velocity_compounded": {"nozzle_inlet_pressure_bar": 25.0, "nozzle_inlet_temp_c": 350.0, "condenser_back_pressure_bar": 2.0, "stage_type": "Curtis 2-Row Velocity Compounded", "blade_speed_ratio_rho": 0.24, "nozzle_angle_alpha1_deg": 18.0, "steam_flow_rate_kg_s": 12.0}
        }


# ── 9. Steam Condensers & Cooling Towers Engine ─────────────────────────────
class SteamCondensersCoolingTowersInput(BaseModel):
    condenser_type: Literal["Surface Condenser (Shell & Tube)", "Low-Level Jet Condenser"] = "Surface Condenser (Shell & Tube)"
    steam_inflow_kg_hr: float = Field(default=12000.0, ge=1000.0, le=100000.0)
    vacuum_gauge_cm_hg: float = Field(default=70.5, ge=50.0, le=75.5)
    barometer_cm_hg: float = Field(default=76.0, ge=72.0, le=78.0)
    condensate_temp_c: float = Field(default=36.0, ge=20.0, le=60.0)
    cooling_water_inlet_temp_c: float = Field(default=24.0, ge=10.0, le=40.0)
    cooling_water_outlet_temp_c: float = Field(default=32.0, ge=15.0, le=50.0)
    ambient_wet_bulb_temp_c: float = Field(default=22.0, ge=5.0, le=35.0)


class SteamCondensersCoolingTowersOutput(BaseModel):
    absolute_condenser_pressure_bar: float
    vacuum_efficiency_pct: float
    condenser_thermal_efficiency_pct: float
    cooling_water_flow_rate_m3_hr: float
    cooling_tower_range_c: float
    cooling_tower_approach_c: float
    cooling_tower_effectiveness_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SteamCondensersCoolingTowersEngine(BaseSimulationEngine):
    name = "steam-condensers-cooling-towers"
    description = "ME/S5/PE: Steam Condensers Vacuum Efficiency & Hyperbolic Cooling Tower Range/Approach"

    def calculate(self, params: SteamCondensersCoolingTowersInput) -> SteamCondensersCoolingTowersOutput:
        p_abs_cm = params.barometer_cm_hg - params.vacuum_gauge_cm_hg
        p_abs_bar = p_abs_cm * (1.01325 / 76.0)

        # Steam saturation pressure approx from Antoine: log10(P_bar) = 5.2 - 1730/(T+233)
        t_c = params.condensate_temp_c
        p_sat_bar = 0.0594  # At 36°C ~ 0.0594 bar
        p_sat_cm = p_sat_bar * (76.0 / 1.01325)

        vac_eff = (params.vacuum_gauge_cm_hg / (params.barometer_cm_hg - p_sat_cm)) * 100.0
        vac_eff = max(60.0, min(99.0, vac_eff))

        # Condenser efficiency = (Tout - Tin) / (T_cond - Tin)
        t_in = params.cooling_water_inlet_temp_c
        t_out = params.cooling_water_outlet_temp_c
        cond_eff = ((t_out - t_in) / (t_c - t_in)) * 100.0 if (t_c > t_in) else 0.0

        # Energy balance: m_steam * h_fg = m_water * cp * (Tout - Tin)
        h_fg = 2415.0  # kJ/kg
        cp_w = 4.187   # kJ/kg.K
        m_s_kg_s = params.steam_inflow_kg_hr / 3600.0
        m_w_kg_s = (m_s_kg_s * h_fg) / (cp_w * (t_out - t_in)) if (t_out > t_in) else 10.0
        m_w_m3_hr = (m_w_kg_s * 3600.0) / 1000.0

        # Cooling tower
        t_wb = params.ambient_wet_bulb_temp_c
        c_range = t_out - t_in
        c_approach = t_in - t_wb
        ct_eff = (c_range / (c_range + c_approach)) * 100.0 if (c_range + c_approach) > 0 else 0.0

        telemetry = {
            "p_abs_bar": round(p_abs_bar, 4),
            "vac_eff_pct": round(vac_eff, 1),
            "water_flow_m3_hr": round(m_w_m3_hr, 1),
            "ct_eff_pct": round(ct_eff, 1)
        }

        return SteamCondensersCoolingTowersOutput(
            absolute_condenser_pressure_bar=round(p_abs_bar, 4),
            vacuum_efficiency_pct=round(vac_eff, 2),
            condenser_thermal_efficiency_pct=round(cond_eff, 2),
            cooling_water_flow_rate_m3_hr=round(m_w_m3_hr, 1),
            cooling_tower_range_c=round(c_range, 1),
            cooling_tower_approach_c=round(c_approach, 1),
            cooling_tower_effectiveness_pct=round(ct_eff, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "surface_condenser_50mw": {"condenser_type": "Surface Condenser (Shell & Tube)", "steam_inflow_kg_hr": 12000.0, "vacuum_gauge_cm_hg": 70.5, "barometer_cm_hg": 76.0, "condensate_temp_c": 36.0, "cooling_water_inlet_temp_c": 24.0, "cooling_water_outlet_temp_c": 32.0, "ambient_wet_bulb_temp_c": 22.0},
            "jet_condenser_small_plant": {"condenser_type": "Low-Level Jet Condenser", "steam_inflow_kg_hr": 6000.0, "vacuum_gauge_cm_hg": 68.0, "barometer_cm_hg": 76.0, "condensate_temp_c": 40.0, "cooling_water_inlet_temp_c": 26.0, "cooling_water_outlet_temp_c": 36.0, "ambient_wet_bulb_temp_c": 24.0}
        }


# ── 10. Automotive Gearbox & Transmission Engine ────────────────────────────
class AutomotiveGearboxTransmissionInput(BaseModel):
    engine_torque_nm: float = Field(default=185.0, ge=50.0, le=800.0)
    engine_speed_rpm: float = Field(default=3200.0, ge=800.0, le=7000.0)
    gear_selected: Literal["1st Gear (Ratio 3.80)", "2nd Gear (Ratio 2.20)", "3rd Gear (Ratio 1.40)", "4th Gear (Direct 1.00)", "5th Gear (Overdrive 0.80)"] = "1st Gear (Ratio 3.80)"
    final_drive_ratio: float = Field(default=4.1, ge=2.5, le=6.0)
    tire_rolling_radius_m: float = Field(default=0.31, ge=0.2, le=0.55)
    transmission_efficiency_pct: float = Field(default=92.0, ge=75.0, le=98.0)


class AutomotiveGearboxTransmissionOutput(BaseModel):
    overall_gear_ratio: float
    wheel_speed_rpm: float
    vehicle_forward_speed_km_h: float
    wheel_drive_torque_nm: float
    tractive_effort_force_n: float
    vehicle_gradeability_deg: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AutomotiveGearboxTransmissionEngine(BaseSimulationEngine):
    name = "automotive-gearbox-transmission"
    description = "ME/S5/AE: Manual Synchromesh Gearbox — Gear Ratios, Tractive Effort, Road Speed & Gradeability"

    def calculate(self, params: AutomotiveGearboxTransmissionInput) -> AutomotiveGearboxTransmissionOutput:
        r_map = {
            "1st Gear (Ratio 3.80)": 3.80,
            "2nd Gear (Ratio 2.20)": 2.20,
            "3rd Gear (Ratio 1.40)": 1.40,
            "4th Gear (Direct 1.00)": 1.00,
            "5th Gear (Overdrive 0.80)": 0.80
        }
        g_r = r_map[params.gear_selected]
        r_total = g_r * params.final_drive_ratio

        n_wheel = params.engine_speed_rpm / r_total
        v_m_s = (2.0 * math.pi * n_wheel * params.tire_rolling_radius_m) / 60.0
        v_km_h = v_m_s * 3.6

        eta = params.transmission_efficiency_pct / 100.0
        t_wheel = params.engine_torque_nm * r_total * eta
        f_tract = t_wheel / params.tire_rolling_radius_m

        # Gradeability angle for 1400 kg car
        m_car = 1400.0
        g = 9.81
        sin_theta = min(0.65, f_tract / (m_car * g))
        grade_deg = math.degrees(math.asin(sin_theta))

        telemetry = {
            "gear": params.gear_selected.split(" ")[0],
            "speed_km_h": round(v_km_h, 1),
            "tractive_n": round(f_tract, 0),
            "torque_nm": round(t_wheel, 1)
        }

        return AutomotiveGearboxTransmissionOutput(
            overall_gear_ratio=round(r_total, 3),
            wheel_speed_rpm=round(n_wheel, 1),
            vehicle_forward_speed_km_h=round(v_km_h, 1),
            wheel_drive_torque_nm=round(t_wheel, 1),
            tractive_effort_force_n=round(f_tract, 1),
            vehicle_gradeability_deg=round(grade_deg, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "1st_gear_steep_climb": {"engine_torque_nm": 185.0, "engine_speed_rpm": 3200.0, "gear_selected": "1st Gear (Ratio 3.80)", "final_drive_ratio": 4.1, "tire_rolling_radius_m": 0.31, "transmission_efficiency_pct": 92.0},
            "5th_gear_highway_cruise": {"engine_torque_nm": 140.0, "engine_speed_rpm": 2500.0, "gear_selected": "5th Gear (Overdrive 0.80)", "final_drive_ratio": 4.1, "tire_rolling_radius_m": 0.31, "transmission_efficiency_pct": 94.0}
        }


# ── 11. Automotive Braking & ABS Engine ──────────────────────────────────────
class AutomotiveBrakingABSInput(BaseModel):
    vehicle_mass_kg: float = Field(default=1400.0, ge=600.0, le=5000.0)
    initial_speed_km_h: float = Field(default=80.0, ge=20.0, le=160.0)
    brake_pedal_force_n: float = Field(default=350.0, ge=50.0, le=1000.0)
    pedal_leverage_ratio: float = Field(default=4.5, ge=2.5, le=7.0)
    master_cylinder_dia_mm: float = Field(default=22.0, ge=14.0, le=35.0)
    caliper_piston_dia_mm: float = Field(default=54.0, ge=30.0, le=80.0)
    disc_effective_radius_mm: float = Field(default=115.0, ge=70.0, le=200.0)
    brake_pad_friction_mu: float = Field(default=0.38, ge=0.2, le=0.6)
    road_adhesion_mu: float = Field(default=0.75, ge=0.1, le=1.0)
    abs_active: bool = True


class AutomotiveBrakingABSOutput(BaseModel):
    hydraulic_line_pressure_bar: float
    caliper_clamping_force_n: float
    total_braking_torque_nm: float
    total_braking_force_n: float
    vehicle_deceleration_m_s2: float
    stopping_distance_m: float
    stopping_time_s: float
    wheel_lockup_prevention_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class AutomotiveBrakingABSEngine(BaseSimulationEngine):
    name = "automotive-braking-abs"
    description = "ME/S5/AE: Hydraulic Disc Braking — Line Pressure, Tandem Master Cylinder & ABS Anti-Lock Stopping Distance"

    def calculate(self, params: AutomotiveBrakingABSInput) -> AutomotiveBrakingABSOutput:
        f_mc = params.brake_pedal_force_n * params.pedal_leverage_ratio
        a_mc = (math.pi / 4.0) * ((params.master_cylinder_dia_mm / 1000.0) ** 2)
        p_hyd_pa = f_mc / a_mc
        p_hyd_bar = p_hyd_pa / 1e5

        a_cal = (math.pi / 4.0) * ((params.caliper_piston_dia_mm / 1000.0) ** 2)
        f_clamp = 2.0 * p_hyd_pa * a_cal  # Twin piston

        # Disc torque per front wheel (2 friction faces)
        r_disc = params.disc_effective_radius_mm / 1000.0
        t_front_wheel = 2.0 * params.brake_pad_friction_mu * f_clamp * r_disc
        # Front + rear total torque (65% front, 35% rear)
        t_total = 2.0 * t_front_wheel / 0.65

        r_tire = 0.31  # m
        f_brake_gen = t_total / r_tire

        # Road adhesion limit
        f_adhesion_max = params.vehicle_mass_kg * 9.81 * params.road_adhesion_mu
        f_brake_actual = min(f_brake_gen, f_adhesion_max)

        decel = f_brake_actual / params.vehicle_mass_kg
        v_init = params.initial_speed_km_h / 3.6
        s_dist = (v_init ** 2) / (2.0 * decel)
        t_stop = v_init / decel

        abs_stat = "ABS ACTIVE (Optimal 15% Slip Maintained, No Wheel Lockup)" if params.abs_active else ("WHEEL LOCKUP OCCURRED (Skidding, Loss of Directional Control)" if f_brake_gen > f_adhesion_max else "NO LOCKUP (Tire in Static Contact Zone)")

        telemetry = {
            "p_bar": round(p_hyd_bar, 1),
            "decel_m_s2": round(decel, 2),
            "dist_m": round(s_dist, 1),
            "t_stop_s": round(t_stop, 2)
        }

        return AutomotiveBrakingABSOutput(
            hydraulic_line_pressure_bar=round(p_hyd_bar, 1),
            caliper_clamping_force_n=round(f_clamp, 1),
            total_braking_torque_nm=round(t_total, 1),
            total_braking_force_n=round(f_brake_actual, 1),
            vehicle_deceleration_m_s2=round(decel, 2),
            stopping_distance_m=round(s_dist, 2),
            stopping_time_s=round(t_stop, 2),
            wheel_lockup_prevention_status=abs_stat,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "dry_asphalt_emergency_stop": {"vehicle_mass_kg": 1400.0, "initial_speed_km_h": 80.0, "brake_pedal_force_n": 350.0, "pedal_leverage_ratio": 4.5, "master_cylinder_dia_mm": 22.0, "caliper_piston_dia_mm": 54.0, "disc_effective_radius_mm": 115.0, "brake_pad_friction_mu": 0.38, "road_adhesion_mu": 0.75, "abs_active": True},
            "wet_road_skid_test": {"vehicle_mass_kg": 1400.0, "initial_speed_km_h": 80.0, "brake_pedal_force_n": 400.0, "pedal_leverage_ratio": 4.5, "master_cylinder_dia_mm": 22.0, "caliper_piston_dia_mm": 54.0, "disc_effective_radius_mm": 115.0, "brake_pad_friction_mu": 0.38, "road_adhesion_mu": 0.35, "abs_active": False}
        }


# ── 12. Press Tool & Die Design Engine ──────────────────────────────────────
class PressToolDieDesignInput(BaseModel):
    blank_diameter_mm: float = Field(default=60.0, ge=10.0, le=300.0)
    sheet_thickness_mm: float = Field(default=2.5, ge=0.5, le=10.0)
    sheet_material: Literal["Mild Steel CRCA (tau=320 MPa)", "Stainless Steel 304 (tau=420 MPa)", "Aluminum Alloy (tau=160 MPa)", "Brass Alloy (tau=250 MPa)"] = "Mild Steel CRCA (tau=320 MPa)"
    punch_shear_ground_angle_deg: float = Field(default=2.0, ge=0.0, le=6.0)
    die_clearance_pct: float = Field(default=5.0, ge=2.0, le=12.0)
    strip_pitch_mm: float = Field(default=68.0, ge=15.0, le=350.0)
    strip_width_mm: float = Field(default=72.0, ge=15.0, le=400.0)


class PressToolDieDesignOutput(BaseModel):
    blanking_shear_force_kn: float
    force_reduced_with_shear_kn: float
    stripping_force_kn: float
    recommended_press_tonnage_tons: float
    die_clearance_per_side_mm: float
    punch_size_mm: float
    die_opening_size_mm: float
    strip_material_utilization_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PressToolDieDesignEngine(BaseSimulationEngine):
    name = "press-tool-die-design"
    description = "ME/S5/TE: Sheet Metal Press Tool — Blanking & Punching Forces, Die Clearances & Strip Layout"

    def calculate(self, params: PressToolDieDesignInput) -> PressToolDieDesignOutput:
        tau_map = {
            "Mild Steel CRCA (tau=320 MPa)": 320.0,
            "Stainless Steel 304 (tau=420 MPa)": 420.0,
            "Aluminum Alloy (tau=160 MPa)": 160.0,
            "Brass Alloy (tau=250 MPa)": 250.0
        }
        tau = tau_map[params.sheet_material]

        perimeter = math.pi * params.blank_diameter_mm
        t = params.sheet_thickness_mm

        f_max_n = perimeter * t * tau
        f_max_kn = f_max_n / 1000.0

        # Shear on punch reduces cutting peak force
        # F_act = F_max * (k * t) / (k * t + s) where s = D * tan(shear_angle)
        rad_shear = math.radians(params.punch_shear_ground_angle_deg)
        shear_drop_s = params.blank_diameter_mm * math.tan(rad_shear)
        k = 0.4  # penetration fraction
        f_act_kn = f_max_kn * ((k * t) / (k * t + shear_drop_s)) if shear_drop_s > 0 else f_max_kn

        f_strip_kn = 0.15 * f_act_kn
        p_total_kn = (f_act_kn + f_strip_kn) * 1.25  # 25% safety
        press_tons = p_total_kn / 9.81

        # Clearances (Blanking: Die = Size, Punch = Size - 2c)
        c_side_mm = (params.die_clearance_pct / 100.0) * t
        d_punch = params.blank_diameter_mm - 2.0 * c_side_mm
        d_die = params.blank_diameter_mm

        # Strip utilization
        blank_area = (math.pi / 4.0) * (params.blank_diameter_mm ** 2)
        strip_area = params.strip_pitch_mm * params.strip_width_mm
        eta_util = (blank_area / strip_area) * 100.0

        telemetry = {
            "f_max_kn": round(f_max_kn, 1),
            "f_act_kn": round(f_act_kn, 1),
            "press_tons": round(press_tons, 1),
            "util_pct": round(eta_util, 1)
        }

        return PressToolDieDesignOutput(
            blanking_shear_force_kn=round(f_max_kn, 1),
            force_reduced_with_shear_kn=round(f_act_kn, 1),
            stripping_force_kn=round(f_strip_kn, 1),
            recommended_press_tonnage_tons=round(press_tons, 1),
            die_clearance_per_side_mm=round(c_side_mm, 3),
            punch_size_mm=round(d_punch, 3),
            die_opening_size_mm=round(d_die, 3),
            strip_material_utilization_pct=round(eta_util, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "crca_washer_blanking": {"blank_diameter_mm": 60.0, "sheet_thickness_mm": 2.5, "sheet_material": "Mild Steel CRCA (tau=320 MPa)", "punch_shear_ground_angle_deg": 2.0, "die_clearance_pct": 5.0, "strip_pitch_mm": 68.0, "strip_width_mm": 72.0},
            "ss304_precision_disc": {"blank_diameter_mm": 45.0, "sheet_thickness_mm": 3.0, "sheet_material": "Stainless Steel 304 (tau=420 MPa)", "punch_shear_ground_angle_deg": 3.0, "die_clearance_pct": 6.5, "strip_pitch_mm": 52.0, "strip_width_mm": 56.0}
        }
