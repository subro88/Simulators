"""
WBSCTE Mechanical Engineering 4th Semester Physics & Simulation Engine Suite
=============================================================================
Syllabus Mapped:
1. ME/S4/TE2: ReciprocatingAirCompressorEngine
2. ME/S4/TE2: GasTurbineBraytonEngine
3. ME/S4/MP2: ShaperSlotterMachineEngine
4. ME/S4/MP2: GrindingWheelAbrasivesEngine
5. ME/S4/MP2: UnconventionalMachiningEDMEngine
6. ME/S4/ET:  TransducersInstrumentationEngine
7. ME/S4/MQC: SineBarSlipGaugesEngine
8. ME/S4/MQC: ComparatorsSurfaceRoughnessEngine
9. ME/S4/MQC: SQCControlChartsEngine
10. ME/S4/TOM: EpicyclicGearTrainsEngine
11. ME/S4/TOM: GovernorMechanismsEngine
12. ME/S4/TOM: BalancingRotatingMassesEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Reciprocating Air Compressor Engine ──────────────────────────────────
class ReciprocatingAirCompressorInput(BaseModel):
    stages: int = Field(default=2, ge=1, le=3)
    suction_pressure_bar: float = Field(default=1.013, ge=0.5, le=5.0)
    delivery_pressure_bar: float = Field(default=8.0, ge=2.0, le=50.0)
    cylinder_bore_mm: float = Field(default=120.0, ge=50.0, le=500.0)
    stroke_length_mm: float = Field(default=140.0, ge=50.0, le=600.0)
    speed_rpm: float = Field(default=750.0, ge=100.0, le=3000.0)
    clearance_ratio_c: float = Field(default=0.045, ge=0.01, le=0.15)
    polytropic_index_n: float = Field(default=1.28, ge=1.1, le=1.4)
    intercooler_efficiency_pct: float = Field(default=88.0, ge=50.0, le=100.0)


class ReciprocatingAirCompressorOutput(BaseModel):
    pressure_ratio_per_stage: float
    swept_volume_m3: float
    volumetric_efficiency_pct: float
    free_air_delivery_m3_min: float
    indicated_power_kw: float
    isothermal_power_kw: float
    isothermal_efficiency_pct: float
    heat_rejected_intercooler_kw: float
    delivery_temperature_c: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ReciprocatingAirCompressorEngine(BaseSimulationEngine):
    name = "reciprocating-air-compressor"
    description = "ME/S4/TE2: Reciprocating Air Compressor Multi-Stage, Volumetric Efficiency, FAD & Intercooling"

    def calculate(self, params: ReciprocatingAirCompressorInput) -> ReciprocatingAirCompressorOutput:
        p1 = params.suction_pressure_bar * 1e5
        p2 = params.delivery_pressure_bar * 1e5
        n_st = params.stages
        n = params.polytropic_index_n

        rp_stage = (p2 / p1) ** (1.0 / n_st)
        bore_m = params.cylinder_bore_mm / 1000.0
        stroke_m = params.stroke_length_mm / 1000.0
        v_swept = (math.pi / 4.0) * (bore_m ** 2) * stroke_m

        eta_vol = 1.0 + params.clearance_ratio_c - params.clearance_ratio_c * (rp_stage ** (1.0 / n))
        eta_vol = max(0.1, min(0.98, eta_vol))

        fad_m3_s = v_swept * eta_vol * (params.speed_rpm / 60.0)
        fad_m3_min = fad_m3_s * 60.0

        work_stage_j = (n / (n - 1.0)) * p1 * (v_swept * eta_vol) * ((rp_stage ** ((n - 1.0) / n)) - 1.0)
        total_ip_w = n_st * work_stage_j * (params.speed_rpm / 60.0)
        total_ip_kw = total_ip_w / 1000.0

        isoth_power_kw = (p1 * fad_m3_s * math.log(p2 / p1)) / 1000.0
        isoth_eff = (isoth_power_kw / total_ip_kw) * 100.0 if total_ip_kw > 0 else 0.0

        t1_k = 298.15
        t2_stage_k = t1_k * (rp_stage ** ((n - 1.0) / n))
        t2_c = t2_stage_k - 273.15

        mass_flow_kg_s = (p1 * fad_m3_s) / (287.0 * t1_k)
        cp_air = 1.005
        q_intercooler_kw = (n_st - 1) * mass_flow_kg_s * cp_air * (t2_stage_k - t1_k) * (params.intercooler_efficiency_pct / 100.0)

        telemetry = {
            "p1_bar": params.suction_pressure_bar,
            "p2_bar": params.delivery_pressure_bar,
            "stages": n_st,
            "rpm": params.speed_rpm,
            "clearance_pct": params.clearance_ratio_c * 100.0,
            "isothermal_eff_pct": round(isoth_eff, 1)
        }

        return ReciprocatingAirCompressorOutput(
            pressure_ratio_per_stage=round(rp_stage, 3),
            swept_volume_m3=round(v_swept, 6),
            volumetric_efficiency_pct=round(eta_vol * 100.0, 2),
            free_air_delivery_m3_min=round(fad_m3_min, 3),
            indicated_power_kw=round(total_ip_kw, 2),
            isothermal_power_kw=round(isoth_power_kw, 2),
            isothermal_efficiency_pct=round(isoth_eff, 2),
            heat_rejected_intercooler_kw=round(q_intercooler_kw, 2),
            delivery_temperature_c=round(t2_c, 1),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "2_stage_industrial": {"stages": 2, "suction_pressure_bar": 1.013, "delivery_pressure_bar": 8.0, "cylinder_bore_mm": 120.0, "stroke_length_mm": 140.0, "speed_rpm": 750.0, "clearance_ratio_c": 0.045, "polytropic_index_n": 1.28, "intercooler_efficiency_pct": 88.0},
            "single_stage_workshop": {"stages": 1, "suction_pressure_bar": 1.0, "delivery_pressure_bar": 6.0, "cylinder_bore_mm": 100.0, "stroke_length_mm": 120.0, "speed_rpm": 900.0, "clearance_ratio_c": 0.05, "polytropic_index_n": 1.32, "intercooler_efficiency_pct": 0.0},
            "3_stage_high_pressure": {"stages": 3, "suction_pressure_bar": 1.0, "delivery_pressure_bar": 30.0, "cylinder_bore_mm": 140.0, "stroke_length_mm": 160.0, "speed_rpm": 600.0, "clearance_ratio_c": 0.04, "polytropic_index_n": 1.25, "intercooler_efficiency_pct": 92.0}
        }


# ── 2. Gas Turbine & Brayton Cycle Engine ───────────────────────────────────
class GasTurbineBraytonInput(BaseModel):
    ambient_temp_k: float = Field(default=300.0, ge=250.0, le=350.0)
    ambient_pressure_bar: float = Field(default=1.013, ge=0.5, le=2.0)
    pressure_ratio_rp: float = Field(default=7.5, ge=2.0, le=30.0)
    turbine_inlet_temp_k: float = Field(default=1250.0, ge=800.0, le=1800.0)
    compressor_isentropic_eff_pct: float = Field(default=86.0, ge=60.0, le=98.0)
    turbine_isentropic_eff_pct: float = Field(default=89.0, ge=60.0, le=98.0)
    regeneration_effectiveness_pct: float = Field(default=75.0, ge=0.0, le=95.0)
    air_mass_flow_kg_s: float = Field(default=15.0, ge=1.0, le=100.0)


class GasTurbineBraytonOutput(BaseModel):
    compressor_exit_temp_k: float
    turbine_exit_temp_k: float
    compressor_work_kw: float
    turbine_work_kw: float
    net_power_output_kw: float
    heat_supplied_kw: float
    thermal_efficiency_pct: float
    work_ratio: float
    specific_fuel_consumption_kg_kwh: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class GasTurbineBraytonEngine(BaseSimulationEngine):
    name = "gas-turbine-brayton"
    description = "ME/S4/TE2: Gas Turbine Open/Closed Brayton Cycle with Regeneration, Intercooling & Reheating"

    def calculate(self, params: GasTurbineBraytonInput) -> GasTurbineBraytonOutput:
        gamma = 1.4
        cp = 1.005
        t1 = params.ambient_temp_k
        t3 = params.turbine_inlet_temp_k
        rp = params.pressure_ratio_rp
        eta_c = params.compressor_isentropic_eff_pct / 100.0
        eta_t = params.turbine_isentropic_eff_pct / 100.0
        eps = params.regeneration_effectiveness_pct / 100.0

        t2s = t1 * (rp ** ((gamma - 1.0) / gamma))
        t2 = t1 + (t2s - t1) / eta_c
        w_c_kj = cp * (t2 - t1)

        t4s = t3 / (rp ** ((gamma - 1.0) / gamma))
        t4 = t3 - eta_t * (t3 - t4s)
        w_t_kj = cp * (t3 - t4)

        t_preheat = t2 + eps * (t4 - t2) if eps > 0 else t2
        q_in_kj = cp * (t3 - t_preheat)

        w_net_kj = w_t_kj - w_c_kj
        m_dot = params.air_mass_flow_kg_s

        p_net_kw = m_dot * w_net_kj
        p_comp_kw = m_dot * w_c_kj
        p_turb_kw = m_dot * w_t_kj
        q_in_kw = m_dot * q_in_kj

        eta_th = (w_net_kj / q_in_kj) * 100.0 if q_in_kj > 0 else 0.0
        work_ratio = (w_net_kj / w_t_kj) if w_t_kj > 0 else 0.0
        sfc = (3600.0 / (eta_th / 100.0 * 42000.0)) if eta_th > 0 else 0.0

        telemetry = {
            "rp": rp,
            "tit_k": t3,
            "thermal_eff_pct": round(eta_th, 2),
            "work_ratio": round(work_ratio, 3),
            "regeneration": eps > 0
        }

        return GasTurbineBraytonOutput(
            compressor_exit_temp_k=round(t2, 1),
            turbine_exit_temp_k=round(t4, 1),
            compressor_work_kw=round(p_comp_kw, 2),
            turbine_work_kw=round(p_turb_kw, 2),
            net_power_output_kw=round(p_net_kw, 2),
            heat_supplied_kw=round(q_in_kw, 2),
            thermal_efficiency_pct=round(eta_th, 2),
            work_ratio=round(work_ratio, 3),
            specific_fuel_consumption_kg_kwh=round(sfc, 4),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "regenerative_power_plant": {"ambient_temp_k": 300.0, "ambient_pressure_bar": 1.013, "pressure_ratio_rp": 7.5, "turbine_inlet_temp_k": 1250.0, "compressor_isentropic_eff_pct": 86.0, "turbine_isentropic_eff_pct": 89.0, "regeneration_effectiveness_pct": 75.0, "air_mass_flow_kg_s": 15.0},
            "simple_cycle_peaking": {"ambient_temp_k": 298.0, "ambient_pressure_bar": 1.0, "pressure_ratio_rp": 12.0, "turbine_inlet_temp_k": 1350.0, "compressor_isentropic_eff_pct": 88.0, "turbine_isentropic_eff_pct": 90.0, "regeneration_effectiveness_pct": 0.0, "air_mass_flow_kg_s": 25.0}
        }


# ── 3. Shaper & Slotter Machine Engine ──────────────────────────────────────
class ShaperSlotterMachineInput(BaseModel):
    crank_radius_r_mm: float = Field(default=120.0, ge=40.0, le=250.0)
    connecting_arm_length_l_mm: float = Field(default=380.0, ge=150.0, le=600.0)
    crank_speed_rpm: float = Field(default=48.0, ge=10.0, le=150.0)
    workpiece_length_mm: float = Field(default=220.0, ge=50.0, le=600.0)
    workpiece_width_mm: float = Field(default=140.0, ge=30.0, le=500.0)
    feed_per_stroke_mm: float = Field(default=0.45, ge=0.1, le=3.0)
    depth_of_cut_mm: float = Field(default=2.5, ge=0.2, le=10.0)
    specific_cutting_energy_mpa: float = Field(default=1950.0, ge=500.0, le=4000.0)


class ShaperSlotterMachineOutput(BaseModel):
    stroke_length_mm: float
    cutting_stroke_angle_deg: float
    return_stroke_angle_deg: float
    quick_return_ratio: float
    average_cutting_speed_m_min: float
    cutting_power_kw: float
    machining_time_min: float
    material_removal_rate_cm3_min: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ShaperSlotterMachineEngine(BaseSimulationEngine):
    name = "shaper-slotter-machine"
    description = "ME/S4/MP2: Shaper & Slotter Quick Return Motion Mechanism (QRMM), Cutting Velocity & Power"

    def calculate(self, params: ShaperSlotterMachineInput) -> ShaperSlotterMachineOutput:
        r = params.crank_radius_r_mm
        l = params.connecting_arm_length_l_mm

        sin_val = min(0.99, max(0.01, r / l))
        alpha_rad = 2.0 * math.asin(sin_val)
        alpha_deg = math.degrees(alpha_rad)

        return_angle = 180.0 - alpha_deg
        cutting_angle = 180.0 + alpha_deg
        qrr = cutting_angle / return_angle if return_angle > 0 else 1.5

        stroke_len = 2.0 * r * (l / (l - r * 0.5))
        stroke_m = stroke_len / 1000.0
        v_cut_avg = (stroke_m * (1.0 + 1.0 / qrr) * params.crank_speed_rpm)

        f_c_n = params.specific_cutting_energy_mpa * params.feed_per_stroke_mm * params.depth_of_cut_mm
        p_cut_kw = (f_c_n * (v_cut_avg / 60.0)) / 1000.0

        num_strokes = params.workpiece_width_mm / params.feed_per_stroke_mm
        t_mach_min = num_strokes / params.crank_speed_rpm
        mrr_cm3_min = (params.workpiece_length_mm * params.feed_per_stroke_mm * params.depth_of_cut_mm * params.crank_speed_rpm) / 1000.0

        telemetry = {
            "stroke_mm": round(stroke_len, 1),
            "qrr": round(qrr, 3),
            "cutting_speed_m_min": round(v_cut_avg, 2),
            "machining_time_min": round(t_mach_min, 2)
        }

        return ShaperSlotterMachineOutput(
            stroke_length_mm=round(stroke_len, 1),
            cutting_stroke_angle_deg=round(cutting_angle, 1),
            return_stroke_angle_deg=round(return_angle, 1),
            quick_return_ratio=round(qrr, 3),
            average_cutting_speed_m_min=round(v_cut_avg, 2),
            cutting_power_kw=round(p_cut_kw, 2),
            machining_time_min=round(t_mach_min, 2),
            material_removal_rate_cm3_min=round(mrr_cm3_min, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "surface_planning_mild_steel": {"crank_radius_r_mm": 120.0, "connecting_arm_length_l_mm": 380.0, "crank_speed_rpm": 48.0, "workpiece_length_mm": 220.0, "workpiece_width_mm": 140.0, "feed_per_stroke_mm": 0.45, "depth_of_cut_mm": 2.5, "specific_cutting_energy_mpa": 1950.0},
            "v_block_slotting_ci": {"crank_radius_r_mm": 90.0, "connecting_arm_length_l_mm": 350.0, "crank_speed_rpm": 60.0, "workpiece_length_mm": 150.0, "workpiece_width_mm": 80.0, "feed_per_stroke_mm": 0.35, "depth_of_cut_mm": 3.0, "specific_cutting_energy_mpa": 1400.0}
        }


# ── 4. Grinding Wheel & Abrasives Engine ────────────────────────────────────
class GrindingWheelAbrasivesInput(BaseModel):
    wheel_diameter_mm: float = Field(default=250.0, ge=100.0, le=600.0)
    wheel_speed_rpm: float = Field(default=2600.0, ge=500.0, le=6000.0)
    workpiece_speed_m_min: float = Field(default=16.0, ge=2.0, le=50.0)
    depth_of_cut_um: float = Field(default=25.0, ge=2.0, le=150.0)
    wheel_width_mm: float = Field(default=25.0, ge=5.0, le=100.0)
    abrasive_type: Literal["A - Aluminum Oxide", "C - Silicon Carbide", "CBN - Cubic Boron Nitride", "D - Diamond"] = "A - Aluminum Oxide"
    grain_size_mesh: int = Field(default=46, ge=10, le=600)
    grade_letter: Literal["H - Soft", "K - Medium Soft", "M - Medium", "P - Medium Hard", "S - Hard"] = "M - Medium"
    structure_number: int = Field(default=5, ge=1, le=15)
    bond_type: Literal["V - Vitrified", "B - Resinoid", "R - Rubber", "E - Shellac", "M - Metal"] = "V - Vitrified"


class GrindingWheelAbrasivesOutput(BaseModel):
    peripheral_wheel_speed_m_s: float
    material_removal_rate_mm3_s: float
    max_chip_thickness_um: float
    tangential_grinding_force_n: float
    grinding_spindle_power_kw: float
    specific_grinding_energy_j_mm3: float
    standard_wheel_marking: str
    safety_compliance: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class GrindingWheelAbrasivesEngine(BaseSimulationEngine):
    name = "grinding-wheel-abrasives"
    description = "ME/S4/MP2: Grinding Wheel Standard Marking (IS/ANSI), MRR, Chip Thickness & Surface Grinding Forces"

    def calculate(self, params: GrindingWheelAbrasivesInput) -> GrindingWheelAbrasivesOutput:
        d_m = params.wheel_diameter_mm / 1000.0
        v_s = (math.pi * d_m * params.wheel_speed_rpm) / 60.0
        v_w = params.workpiece_speed_m_min / 60.0
        doc_mm = params.depth_of_cut_um / 1000.0

        mrr_mm3_s = params.wheel_width_mm * (v_w * 1000.0) * doc_mm
        h_max_um = 2.0 * (v_w / v_s) * math.sqrt(doc_mm / params.wheel_diameter_mm) * 1e3
        h_max_um = max(0.05, h_max_um)

        u_base = 35.0
        u_actual = u_base * ((1.5 / max(0.1, h_max_um)) ** 0.4)

        power_w = u_actual * mrr_mm3_s
        power_kw = power_w / 1000.0
        f_t_n = power_w / v_s if v_s > 0 else 0.0

        ab_code = params.abrasive_type.split(" - ")[0]
        gr_code = params.grade_letter.split(" - ")[0]
        bd_code = params.bond_type.split(" - ")[0]
        marking = f"51 {ab_code} {params.grain_size_mesh} {gr_code} {params.structure_number} {bd_code} 23"
        safe_status = "SAFE (Wheel speed < 33 m/s safe vitrified limit)" if v_s <= 33.0 else "WARNING: High Speed Wheel Required (Reinforced Bond)"

        telemetry = {
            "peripheral_speed_m_s": round(v_s, 2),
            "marking": marking,
            "spindle_power_kw": round(power_kw, 2)
        }

        return GrindingWheelAbrasivesOutput(
            peripheral_wheel_speed_m_s=round(v_s, 2),
            material_removal_rate_mm3_s=round(mrr_mm3_s, 2),
            max_chip_thickness_um=round(h_max_um, 3),
            tangential_grinding_force_n=round(f_t_n, 1),
            grinding_spindle_power_kw=round(power_kw, 2),
            specific_grinding_energy_j_mm3=round(u_actual, 1),
            standard_wheel_marking=marking,
            safety_compliance=safe_status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "surface_grinding_medium_steel": {"wheel_diameter_mm": 250.0, "wheel_speed_rpm": 2600.0, "workpiece_speed_m_min": 16.0, "depth_of_cut_um": 25.0, "wheel_width_mm": 25.0, "abrasive_type": "A - Aluminum Oxide", "grain_size_mesh": 46, "grade_letter": "M - Medium", "structure_number": 5, "bond_type": "V - Vitrified"},
            "fine_finish_carbide": {"wheel_diameter_mm": 180.0, "wheel_speed_rpm": 3200.0, "workpiece_speed_m_min": 8.0, "depth_of_cut_um": 10.0, "wheel_width_mm": 15.0, "abrasive_type": "D - Diamond", "grain_size_mesh": 120, "grade_letter": "H - Soft", "structure_number": 8, "bond_type": "B - Resinoid"}
        }


# ── 5. Unconventional Machining (EDM) Engine ────────────────────────────────
class UnconventionalMachiningEDMInput(BaseModel):
    discharge_current_a: float = Field(default=22.0, ge=1.0, le=100.0)
    pulse_on_time_us: float = Field(default=95.0, ge=5.0, le=1000.0)
    pulse_off_time_us: float = Field(default=25.0, ge=2.0, le=500.0)
    open_circuit_voltage_v: float = Field(default=85.0, ge=30.0, le=300.0)
    spark_gap_um: float = Field(default=35.0, ge=10.0, le=150.0)
    workpiece_material: Literal["Die Steel (H13)", "Titanium Alloy (Ti-6Al-4V)", "Tungsten Carbide", "Inconel 718"] = "Die Steel (H13)"
    tool_electrode_material: Literal["Electrolytic Copper", "Isostatic Graphite", "Brass Alloy"] = "Electrolytic Copper"


class UnconventionalMachiningEDMOutput(BaseModel):
    pulse_duty_cycle_pct: float
    pulse_frequency_khz: float
    spark_energy_per_pulse_mj: float
    average_discharge_power_w: float
    material_removal_rate_mm3_min: float
    surface_roughness_ra_um: float
    spark_overcut_um: float
    electrode_wear_ratio_pct: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class UnconventionalMachiningEDMEngine(BaseSimulationEngine):
    name = "unconventional-machining-edm"
    description = "ME/S4/MP2: Non-Traditional Machining — Electric Discharge Machining (EDM) MRR, Spark Overcut & Surface Finish"

    def calculate(self, params: UnconventionalMachiningEDMInput) -> UnconventionalMachiningEDMOutput:
        t_on = params.pulse_on_time_us
        t_off = params.pulse_off_time_us
        t_total = t_on + t_off

        duty_cycle = (t_on / t_total) * 100.0
        freq_khz = 1000.0 / t_total

        v_spark = 25.0
        energy_mj = v_spark * params.discharge_current_a * (t_on * 1e-3)
        power_avg_w = (energy_mj * 1e-3) * (freq_khz * 1e3)

        mat_factor = {"Die Steel (H13)": 1.0, "Titanium Alloy (Ti-6Al-4V)": 0.72, "Tungsten Carbide": 0.38, "Inconel 718": 0.65}[params.workpiece_material]
        mrr = mat_factor * 0.18 * (params.discharge_current_a ** 1.1) * (t_on ** 0.38) * (duty_cycle / 100.0)
        ra_um = 0.028 * ((energy_mj * 1000.0) ** 0.35)
        overcut_um = params.spark_gap_um + 1.2 * math.sqrt(params.discharge_current_a)

        tool_factor = {"Electrolytic Copper": 0.8, "Isostatic Graphite": 0.35, "Brass Alloy": 1.4}[params.tool_electrode_material]
        twr_pct = tool_factor * (12.0 / math.sqrt(t_on))

        telemetry = {
            "current_a": params.discharge_current_a,
            "ton_us": t_on,
            "freq_khz": round(freq_khz, 2),
            "mrr_mm3_min": round(mrr, 2)
        }

        return UnconventionalMachiningEDMOutput(
            pulse_duty_cycle_pct=round(duty_cycle, 1),
            pulse_frequency_khz=round(freq_khz, 2),
            spark_energy_per_pulse_mj=round(energy_mj, 2),
            average_discharge_power_w=round(power_avg_w, 1),
            material_removal_rate_mm3_min=round(mrr, 2),
            surface_roughness_ra_um=round(ra_um, 2),
            spark_overcut_um=round(overcut_um, 1),
            electrode_wear_ratio_pct=round(twr_pct, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "rough_cavity_sinking": {"discharge_current_a": 35.0, "pulse_on_time_us": 180.0, "pulse_off_time_us": 35.0, "open_circuit_voltage_v": 90.0, "spark_gap_um": 45.0, "workpiece_material": "Die Steel (H13)", "tool_electrode_material": "Isostatic Graphite"},
            "fine_finishing_spark": {"discharge_current_a": 6.0, "pulse_on_time_us": 25.0, "pulse_off_time_us": 10.0, "open_circuit_voltage_v": 70.0, "spark_gap_um": 20.0, "workpiece_material": "Die Steel (H13)", "tool_electrode_material": "Electrolytic Copper"}
        }


# ── 6. Industrial Sensors & Transducers Engine ──────────────────────────────
class TransducersInstrumentationInput(BaseModel):
    sensor_type: Literal["Strain Gauge Cantilever Beam", "LVDT Displacement Core", "Piezoelectric Quartz Force", "RTD Pt100 Temperature"] = "Strain Gauge Cantilever Beam"
    applied_measurand: float = Field(default=15.0, ge=0.0, le=500.0)
    bridge_excitation_v: float = Field(default=10.0, ge=1.0, le=24.0)
    gauge_factor_gf: float = Field(default=2.12, ge=1.5, le=4.5)
    beam_length_mm: float = Field(default=180.0, ge=50.0, le=400.0)
    beam_width_mm: float = Field(default=22.0, ge=10.0, le=50.0)
    beam_thickness_mm: float = Field(default=4.0, ge=1.0, le=15.0)
    youngs_modulus_gpa: float = Field(default=205.0, ge=50.0, le=300.0)


class TransducersInstrumentationOutput(BaseModel):
    sensor_output_voltage_mv: float
    sensitivity_metric: str
    transducer_gain_mv_unit: float
    linearity_error_pct: float
    calculated_stress_mpa: float
    calculated_strain_microepsilon: float
    sensor_dynamic_range: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class TransducersInstrumentationEngine(BaseSimulationEngine):
    name = "transducers-instrumentation"
    description = "ME/S4/ET: Industrial Sensors & Instrumentation — Strain Gauge Bridge, LVDT, Piezoelectric & RTD"

    def calculate(self, params: TransducersInstrumentationInput) -> TransducersInstrumentationOutput:
        meas = params.applied_measurand

        if params.sensor_type == "Strain Gauge Cantilever Beam":
            f_n = meas
            l_m = params.beam_length_mm / 1000.0
            b_m = params.beam_width_mm / 1000.0
            t_m = params.beam_thickness_mm / 1000.0
            e_pa = params.youngs_modulus_gpa * 1e9

            sigma_pa = (6.0 * f_n * l_m) / (b_m * (t_m ** 2))
            strain = sigma_pa / e_pa
            micro_strain = strain * 1e6

            v_out_mv = 0.25 * params.bridge_excitation_v * params.gauge_factor_gf * strain * 1000.0
            gain = v_out_mv / f_n if f_n > 0 else 0.5
            sens_text = f"{gain:.3f} mV/N"
            lin_err = 0.15
            stress_mpa = sigma_pa / 1e6
            dyn_range = "0 to 100 N (Linear Elastic Range)"

        elif params.sensor_type == "LVDT Displacement Core":
            disp_mm = meas
            sens = 2.4 * params.bridge_excitation_v
            v_out_mv = sens * disp_mm
            gain = sens
            sens_text = f"{gain:.2f} mV/mm"
            lin_err = 0.25 * (disp_mm / 25.0)
            stress_mpa = 0.0
            micro_strain = 0.0
            dyn_range = "± 25 mm Core Travel"

        elif params.sensor_type == "Piezoelectric Quartz Force":
            f_n = meas
            gain = 12.5
            v_out_mv = gain * f_n
            sens_text = f"{gain:.2f} mV/N"
            lin_err = 0.08
            stress_mpa = f_n / 50.0
            micro_strain = 0.0
            dyn_range = "0 to 500 N Dynamic Force"

        else:
            t_c = meas
            gain = 3.85 * (params.bridge_excitation_v / 10.0)
            v_out_mv = gain * t_c
            sens_text = f"{gain:.2f} mV/°C"
            lin_err = 0.12
            stress_mpa = 0.0
            micro_strain = 0.0
            dyn_range = "-50°C to +400°C"

        telemetry = {
            "type": params.sensor_type,
            "output_mv": round(v_out_mv, 3),
            "stress_mpa": round(stress_mpa, 2)
        }

        return TransducersInstrumentationOutput(
            sensor_output_voltage_mv=round(v_out_mv, 3),
            sensitivity_metric=sens_text,
            transducer_gain_mv_unit=round(gain, 3),
            linearity_error_pct=round(lin_err, 3),
            calculated_stress_mpa=round(stress_mpa, 2),
            calculated_strain_microepsilon=round(micro_strain, 1),
            sensor_dynamic_range=dyn_range,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "cantilever_load_cell": {"sensor_type": "Strain Gauge Cantilever Beam", "applied_measurand": 15.0, "bridge_excitation_v": 10.0, "gauge_factor_gf": 2.12, "beam_length_mm": 180.0, "beam_width_mm": 22.0, "beam_thickness_mm": 4.0, "youngs_modulus_gpa": 205.0},
            "lvdt_stroke_gauge": {"sensor_type": "LVDT Displacement Core", "applied_measurand": 8.5, "bridge_excitation_v": 10.0, "gauge_factor_gf": 2.0, "beam_length_mm": 150.0, "beam_width_mm": 20.0, "beam_thickness_mm": 4.0, "youngs_modulus_gpa": 200.0}
        }


# ── 7. Sine Bar & Precision Slip Gauges Engine ──────────────────────────────
class SineBarSlipGaugesInput(BaseModel):
    sine_bar_length_mm: float = Field(default=200.0, ge=100.0, le=300.0)
    target_angle_deg: float = Field(default=18.435, ge=0.5, le=45.0)
    measured_stack_height_mm: float = Field(default=63.245, ge=5.0, le=250.0)
    roller_diameter_mm: float = Field(default=25.0, ge=10.0, le=40.0)
    ambient_temp_c: float = Field(default=24.0, ge=10.0, le=40.0)


class SineBarSlipGaugesOutput(BaseModel):
    theoretical_stack_height_mm: float
    measured_actual_angle_deg: float
    angular_error_arcsec: float
    slip_gauge_combination: List[str]
    total_slip_blocks_used: int
    thermal_expansion_correction_um: float
    sine_bar_grade_accuracy: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SineBarSlipGaugesEngine(BaseSimulationEngine):
    name = "sine-bar-slip-gauges"
    description = "ME/S4/MQC: Precision Metrology — Sine Bar Angle Measurement & Slip Gauge Block Wringing Stack"

    def calculate(self, params: SineBarSlipGaugesInput) -> SineBarSlipGaugesOutput:
        l = params.sine_bar_length_mm
        rad_target = math.radians(params.target_angle_deg)
        h_th = l * math.sin(rad_target)

        sin_meas = min(1.0, max(0.0, params.measured_stack_height_mm / l))
        angle_meas_deg = math.degrees(math.asin(sin_meas))

        diff_deg = angle_meas_deg - params.target_angle_deg
        error_arcsec = diff_deg * 3600.0

        rem = round(h_th, 3)
        stack = []

        dec3 = int(round(rem * 1000)) % 10
        if dec3 > 0:
            block = 1.000 + dec3 * 0.001
            stack.append(f"{block:.3f} mm")
            rem = round(rem - block, 3)

        dec2 = int(round(rem * 100)) % 100
        if dec2 > 0:
            block = 1.00 + dec2 * 0.01
            if block > rem:
                block = dec2 * 0.01
            stack.append(f"{block:.2f} mm")
            rem = round(rem - block, 3)

        if rem >= 10.0:
            blk10 = int(rem // 10) * 10.0
            stack.append(f"{blk10:.1f} mm")
            rem = round(rem - blk10, 3)
        if rem > 0:
            stack.append(f"{rem:.3f} mm")

        alpha_steel = 11.5e-6
        dt = params.ambient_temp_c - 20.0
        dl_um = l * alpha_steel * dt * 1e3

        acc_grade = "Grade 0 (Calibration / Master Lab)" if abs(error_arcsec) <= 5.0 else ("Grade 1 (Inspection Standard)" if abs(error_arcsec) <= 15.0 else "Grade 2 (Workshop Standard)")

        telemetry = {
            "sine_length_mm": l,
            "target_deg": params.target_angle_deg,
            "h_th_mm": round(h_th, 3),
            "error_arcsec": round(error_arcsec, 1)
        }

        return SineBarSlipGaugesOutput(
            theoretical_stack_height_mm=round(h_th, 3),
            measured_actual_angle_deg=round(angle_meas_deg, 4),
            angular_error_arcsec=round(error_arcsec, 1),
            slip_gauge_combination=stack,
            total_slip_blocks_used=len(stack),
            thermal_expansion_correction_um=round(dl_um, 3),
            sine_bar_grade_accuracy=acc_grade,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "taper_plug_angle_check": {"sine_bar_length_mm": 200.0, "target_angle_deg": 14.5, "measured_stack_height_mm": 50.076, "roller_diameter_mm": 25.0, "ambient_temp_c": 20.0},
            "precision_wedge_angle": {"sine_bar_length_mm": 150.0, "target_angle_deg": 22.5, "measured_stack_height_mm": 57.398, "roller_diameter_mm": 20.0, "ambient_temp_c": 22.0}
        }


# ── 8. Comparators & Surface Roughness Engine ───────────────────────────────
class ComparatorsSurfaceRoughnessInput(BaseModel):
    comparator_type: Literal["Pneumatic Solex Air Gauge", "Mechanical Dial Comparator", "Optical Reed Comparator", "Electronic LVDT Comparator"] = "Pneumatic Solex Air Gauge"
    nominal_dimension_mm: float = Field(default=30.0, ge=5.0, le=150.0)
    actual_dimension_mm: float = Field(default=30.018, ge=5.0, le=150.0)
    pneumatic_supply_pressure_bar: float = Field(default=1.6, ge=0.5, le=4.0)
    air_nozzle_diameter_mm: float = Field(default=1.5, ge=0.5, le=4.0)
    surface_peak_valleys_um: List[float] = Field(default=[1.8, 3.2, -0.9, -2.4, 4.1, 0.6, -1.8, 2.5, -3.1, 1.2])


class ComparatorsSurfaceRoughnessOutput(BaseModel):
    dimensional_deviation_um: float
    magnification_ratio: float
    comparator_indicator_reading: str
    surface_roughness_ra_um: float
    surface_roughness_rz_um: float
    surface_roughness_rq_rms_um: float
    iso_roughness_grade_number: str
    tolerance_zone_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ComparatorsSurfaceRoughnessEngine(BaseSimulationEngine):
    name = "comparators-surface-roughness"
    description = "ME/S4/MQC: Comparators (Pneumatic/Mechanical) & Surface Roughness Parameters (Ra, Rz, Rq, ISO N-grades)"

    def calculate(self, params: ComparatorsSurfaceRoughnessInput) -> ComparatorsSurfaceRoughnessOutput:
        diff_mm = params.actual_dimension_mm - params.nominal_dimension_mm
        diff_um = diff_mm * 1000.0

        if params.comparator_type == "Pneumatic Solex Air Gauge":
            mag = 2500.0
            pb = params.pneumatic_supply_pressure_bar * (1.0 - (max(0.005, diff_um) / 80.0) ** 2)
            reading = f"{pb:.2f} bar (Water Column: {pb * 10197.16 / 1000:.1f} cm H2O)"
        elif params.comparator_type == "Mechanical Dial Comparator":
            mag = 1000.0
            reading = f"{diff_um:+.1f} µm (Dial Needle: {diff_um/10.0:+.2f} div)"
        elif params.comparator_type == "Optical Reed Comparator":
            mag = 5000.0
            reading = f"{diff_um * (mag/1000.0):+.1f} mm Scale Projection"
        else:
            mag = 10000.0
            reading = f"{diff_um:+.3f} µm Digital Output (LVDT 0-10V)"

        pts = params.surface_peak_valleys_um
        n = len(pts)
        ra = sum(abs(x) for x in pts) / n
        rq = math.sqrt(sum(x ** 2 for x in pts) / n)

        pos_peaks = sorted([x for x in pts if x > 0], reverse=True)[:5]
        neg_valleys = sorted([abs(x) for x in pts if x < 0], reverse=True)[:5]
        p_avg = sum(pos_peaks) / max(1, len(pos_peaks))
        v_avg = sum(neg_valleys) / max(1, len(neg_valleys))
        rz = p_avg + v_avg

        if ra <= 0.025: iso_grade = "N1 (Superfinish / Lapping)"
        elif ra <= 0.05: iso_grade = "N2 (Polishing / Fine Lapping)"
        elif ra <= 0.1: iso_grade = "N3 (Fine Grinding)"
        elif ra <= 0.2: iso_grade = "N4 (Precision Grinding)"
        elif ra <= 0.4: iso_grade = "N5 (Good Commercial Grinding)"
        elif ra <= 0.8: iso_grade = "N6 (Fine Turning / Milling)"
        elif ra <= 1.6: iso_grade = "N7 (Standard Machining)"
        elif ra <= 3.2: iso_grade = "N8 (Medium Turning / Shaping)"
        elif ra <= 6.3: iso_grade = "N9 (Rough Machining)"
        else: iso_grade = "N10-N12 (Casting / Forging Rough Surface)"

        status = "ACCEPTABLE (Within ±25 µm IT7 Tolerance)" if abs(diff_um) <= 25.0 else "OUT OF TOLERANCE (Reject / Rework)"

        telemetry = {
            "dev_um": round(diff_um, 2),
            "ra_um": round(ra, 3),
            "iso_grade": iso_grade
        }

        return ComparatorsSurfaceRoughnessOutput(
            dimensional_deviation_um=round(diff_um, 2),
            magnification_ratio=round(mag, 0),
            comparator_indicator_reading=reading,
            surface_roughness_ra_um=round(ra, 3),
            surface_roughness_rz_um=round(rz, 3),
            surface_roughness_rq_rms_um=round(rq, 3),
            iso_roughness_grade_number=iso_grade,
            tolerance_zone_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "ground_shaft_solex_check": {"comparator_type": "Pneumatic Solex Air Gauge", "nominal_dimension_mm": 30.0, "actual_dimension_mm": 30.018, "pneumatic_supply_pressure_bar": 1.6, "air_nozzle_diameter_mm": 1.5, "surface_peak_valleys_um": [1.8, 3.2, -0.9, -2.4, 4.1, 0.6, -1.8, 2.5, -3.1, 1.2]},
            "milled_surface_dial_gauge": {"comparator_type": "Mechanical Dial Comparator", "nominal_dimension_mm": 50.0, "actual_dimension_mm": 49.985, "pneumatic_supply_pressure_bar": 1.0, "air_nozzle_diameter_mm": 1.0, "surface_peak_valleys_um": [4.5, 6.2, -3.8, -5.1, 7.0, 1.2, -4.5, 5.0]}
        }


# ── 9. Statistical Quality Control (SQC) Engine ─────────────────────────────
class SQCControlChartsInput(BaseModel):
    chart_type: Literal["X-bar and R Chart (Variables)", "p-Chart (Fraction Defective)", "c-Chart (Defect Count)"] = "X-bar and R Chart (Variables)"
    subgroup_size_n: int = Field(default=5, ge=2, le=10)
    subgroup_means: List[float] = Field(default=[50.02, 49.98, 50.05, 50.01, 49.95, 50.08, 49.99, 50.03, 50.00, 49.97])
    subgroup_ranges: List[float] = Field(default=[0.12, 0.08, 0.15, 0.10, 0.14, 0.09, 0.11, 0.13, 0.08, 0.10])
    upper_spec_limit_usl: float = Field(default=50.25, ge=10.0, le=200.0)
    lower_spec_limit_lsl: float = Field(default=49.75, ge=10.0, le=200.0)


class SQCControlChartsOutput(BaseModel):
    grand_mean_x_double_bar: float
    average_range_r_bar: float
    xbar_upper_control_limit_ucl: float
    xbar_lower_control_limit_lcl: float
    r_upper_control_limit_ucl: float
    r_lower_control_limit_lcl: float
    estimated_process_sigma: float
    process_capability_cp: float
    process_capability_cpk: float
    process_control_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SQCControlChartsEngine(BaseSimulationEngine):
    name = "sqc-control-charts"
    description = "ME/S4/MQC: Statistical Quality Control — Xbar-R Control Charts, Process Capability Cp, Cpk & Control Limits"

    def calculate(self, params: SQCControlChartsInput) -> SQCControlChartsOutput:
        n = params.subgroup_size_n

        sqc_table = {
            2: (1.880, 0.0, 3.267, 1.128),
            3: (1.023, 0.0, 2.574, 1.693),
            4: (0.729, 0.0, 2.282, 2.059),
            5: (0.577, 0.0, 2.115, 2.326),
            6: (0.483, 0.0, 2.004, 2.534),
            7: (0.419, 0.076, 1.924, 2.704),
            8: (0.373, 0.136, 1.864, 2.847),
            9: (0.337, 0.184, 1.816, 2.970),
            10: (0.308, 0.223, 1.777, 3.078)
        }
        a2, d3, d4, d2 = sqc_table.get(n, (0.577, 0.0, 2.115, 2.326))

        x_bar_list = params.subgroup_means
        r_list = params.subgroup_ranges

        x_dbl_bar = sum(x_bar_list) / len(x_bar_list)
        r_bar = sum(r_list) / len(r_list)

        ucl_x = x_dbl_bar + a2 * r_bar
        lcl_x = x_dbl_bar - a2 * r_bar
        ucl_r = d4 * r_bar
        lcl_r = d3 * r_bar

        sigma_hat = r_bar / d2
        cp = (params.upper_spec_limit_usl - params.lower_spec_limit_lsl) / (6.0 * sigma_hat) if sigma_hat > 0 else 0.0

        cpu = (params.upper_spec_limit_usl - x_dbl_bar) / (3.0 * sigma_hat) if sigma_hat > 0 else 0.0
        cpl = (x_dbl_bar - params.lower_spec_limit_lsl) / (3.0 * sigma_hat) if sigma_hat > 0 else 0.0
        cpk = min(cpu, cpl)

        in_control = all(lcl_x <= x <= ucl_x for x in x_bar_list) and all(lcl_r <= r <= ucl_r for r in r_list)
        status = "IN STATISTICAL CONTROL (Capable Process)" if (in_control and cpk >= 1.33) else ("IN CONTROL (Marginal Capability)" if in_control else "OUT OF STATISTICAL CONTROL (Special Cause Detected)")

        telemetry = {
            "x_double_bar": round(x_dbl_bar, 3),
            "r_bar": round(r_bar, 3),
            "cpk": round(cpk, 2),
            "in_control": in_control
        }

        return SQCControlChartsOutput(
            grand_mean_x_double_bar=round(x_dbl_bar, 4),
            average_range_r_bar=round(r_bar, 4),
            xbar_upper_control_limit_ucl=round(ucl_x, 4),
            xbar_lower_control_limit_lcl=round(lcl_x, 4),
            r_upper_control_limit_ucl=round(ucl_r, 4),
            r_lower_control_limit_lcl=round(lcl_r, 4),
            estimated_process_sigma=round(sigma_hat, 5),
            process_capability_cp=round(cp, 3),
            process_capability_cpk=round(cpk, 3),
            process_control_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "cnc_turned_pin_50mm": {"chart_type": "X-bar and R Chart (Variables)", "subgroup_size_n": 5, "subgroup_means": [50.02, 49.98, 50.05, 50.01, 49.95, 50.08, 49.99, 50.03, 50.00, 49.97], "subgroup_ranges": [0.12, 0.08, 0.15, 0.10, 0.14, 0.09, 0.11, 0.13, 0.08, 0.10], "upper_spec_limit_usl": 50.25, "lower_spec_limit_lsl": 49.75},
            "piston_ring_thickness": {"chart_type": "X-bar and R Chart (Variables)", "subgroup_size_n": 4, "subgroup_means": [2.502, 2.498, 2.501, 2.499, 2.503, 2.500], "subgroup_ranges": [0.008, 0.006, 0.007, 0.005, 0.009, 0.006], "upper_spec_limit_usl": 2.520, "lower_spec_limit_lsl": 2.480}
        }


# ── 10. Epicyclic Gear Trains Engine ─────────────────────────────────────────
class EpicyclicGearTrainsInput(BaseModel):
    sun_teeth_ts: int = Field(default=24, ge=10, le=100)
    planet_teeth_tp: int = Field(default=32, ge=10, le=100)
    ring_teeth_ta: int = Field(default=88, ge=30, le=300)
    sun_speed_rpm: float = Field(default=1200.0, ge=-5000.0, le=5000.0)
    ring_speed_rpm: float = Field(default=0.0, ge=-5000.0, le=5000.0)
    input_power_kw: float = Field(default=7.5, ge=0.5, le=100.0)


class EpicyclicGearTrainsOutput(BaseModel):
    arm_carrier_speed_rpm: float
    planet_speed_rpm: float
    gear_train_speed_ratio: float
    sun_input_torque_nm: float
    arm_output_torque_nm: float
    fixing_torque_ring_nm: float
    gear_pitch_geometry_valid: bool
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class EpicyclicGearTrainsEngine(BaseSimulationEngine):
    name = "epicyclic-gear-trains"
    description = "ME/S4/TOM: Epicyclic & Planetary Gear Trains — Tabular Speed Method, Torque Transmission & Arm Carrier Motion"

    def calculate(self, params: EpicyclicGearTrainsInput) -> EpicyclicGearTrainsOutput:
        ts = params.sun_teeth_ts
        tp = params.planet_teeth_tp
        ta = params.ring_teeth_ta

        geom_valid = (ta == ts + 2 * tp)

        ratio = ts / ta
        x = (params.sun_speed_rpm - params.ring_speed_rpm) / (1.0 + ratio)
        y = params.sun_speed_rpm - x

        arm_rpm = y
        planet_rpm = -x * (ts / tp) + y
        overall_vr = (params.sun_speed_rpm / arm_rpm) if abs(arm_rpm) > 1e-4 else 0.0

        t_sun = (params.input_power_kw * 1000.0 * 60.0) / (2.0 * math.pi * abs(params.sun_speed_rpm)) if params.sun_speed_rpm != 0 else 0.0
        t_arm = (params.input_power_kw * 1000.0 * 60.0) / (2.0 * math.pi * abs(arm_rpm)) if arm_rpm != 0 else 0.0
        t_ring = t_arm - t_sun

        telemetry = {
            "sun_rpm": params.sun_speed_rpm,
            "arm_rpm": round(arm_rpm, 2),
            "ratio": round(overall_vr, 3),
            "geom_valid": geom_valid
        }

        return EpicyclicGearTrainsOutput(
            arm_carrier_speed_rpm=round(arm_rpm, 2),
            planet_speed_rpm=round(planet_rpm, 2),
            gear_train_speed_ratio=round(overall_vr, 3),
            sun_input_torque_nm=round(t_sun, 2),
            arm_output_torque_nm=round(t_arm, 2),
            fixing_torque_ring_nm=round(t_ring, 2),
            gear_pitch_geometry_valid=geom_valid,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_planetary_reducer": {"sun_teeth_ts": 24, "planet_teeth_tp": 32, "ring_teeth_ta": 88, "sun_speed_rpm": 1200.0, "ring_speed_rpm": 0.0, "input_power_kw": 7.5},
            "differential_sun_planet": {"sun_teeth_ts": 20, "planet_teeth_tp": 30, "ring_teeth_ta": 80, "sun_speed_rpm": 1500.0, "ring_speed_rpm": 300.0, "input_power_kw": 10.0}
        }


# ── 11. Governor Mechanisms Engine ──────────────────────────────────────────
class GovernorMechanismsInput(BaseModel):
    governor_type: Literal["Watt Governor", "Porter Governor", "Proell Governor", "Hartnell Spring Governor"] = "Porter Governor"
    flyball_mass_kg: float = Field(default=3.5, ge=0.5, le=20.0)
    central_sleeve_mass_kg: float = Field(default=22.0, ge=0.0, le=100.0)
    upper_arm_length_mm: float = Field(default=240.0, ge=100.0, le=500.0)
    lower_arm_length_mm: float = Field(default=240.0, ge=100.0, le=500.0)
    rotation_radius_r1_mm: float = Field(default=120.0, ge=50.0, le=300.0)
    rotation_radius_r2_mm: float = Field(default=160.0, ge=60.0, le=350.0)
    spring_stiffness_n_mm: float = Field(default=18.0, ge=1.0, le=100.0)


class GovernorMechanismsOutput(BaseModel):
    min_equilibrium_speed_rpm: float
    max_equilibrium_speed_rpm: float
    mean_speed_rpm: float
    sleeve_lift_mm: float
    governor_sensitiveness_pct: float
    governor_effort_n: float
    governor_power_j: float
    governor_stability_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class GovernorMechanismsEngine(BaseSimulationEngine):
    name = "governor-mechanisms"
    description = "ME/S4/TOM: Centrifugal Governors — Watt, Porter, Proell, Hartnell Equilibrium Speeds, Effort & Power"

    def calculate(self, params: GovernorMechanismsInput) -> GovernorMechanismsOutput:
        m = params.flyball_mass_kg
        m_sleeve = params.central_sleeve_mass_kg
        l = params.upper_arm_length_mm / 1000.0

        r1 = params.rotation_radius_r1_mm / 1000.0
        r2 = params.rotation_radius_r2_mm / 1000.0

        h1 = math.sqrt(max(0.01, l**2 - r1**2))
        h2 = math.sqrt(max(0.01, l**2 - r2**2))
        lift_mm = 2.0 * (h1 - h2) * 1000.0

        g = 9.81
        if params.governor_type == "Watt Governor":
            n1 = math.sqrt(g / h1) * (60.0 / (2.0 * math.pi))
            n2 = math.sqrt(g / h2) * (60.0 / (2.0 * math.pi))
        elif params.governor_type == "Porter Governor":
            factor = (m + m_sleeve) / m
            n1 = math.sqrt(factor * (g / h1)) * (60.0 / (2.0 * math.pi))
            n2 = math.sqrt(factor * (g / h2)) * (60.0 / (2.0 * math.pi))
        elif params.governor_type == "Proell Governor":
            factor = ((m + m_sleeve) / m) * 1.25
            n1 = math.sqrt(factor * (g / h1)) * (60.0 / (2.0 * math.pi))
            n2 = math.sqrt(factor * (g / h2)) * (60.0 / (2.0 * math.pi))
        else:
            s = params.spring_stiffness_n_mm * 1000.0
            f_cent1 = s * (r1 - 0.08)
            f_cent2 = s * (r2 - 0.08)
            omega1 = math.sqrt(max(1.0, f_cent1 / (m * r1)))
            omega2 = math.sqrt(max(1.0, f_cent2 / (m * r2)))
            n1 = omega1 * (60.0 / (2.0 * math.pi))
            n2 = omega2 * (60.0 / (2.0 * math.pi))

        n_mean = (n1 + n2) / 2.0
        sens = ((n2 - n1) / n_mean) * 100.0 if n_mean > 0 else 0.0

        c = (n2 - n1) / n1 if n1 > 0 else 0.05
        effort_n = (m + m_sleeve) * g * (2.0 * c / (1.0 + 2.0 * c))
        power_j = effort_n * (lift_mm / 1000.0)

        status = "STABLE & SENSITIVE (Optimal Throttle Modulation)" if 5.0 <= sens <= 25.0 else ("ISOCHRONOUS / HUNTING (High Sensitivity Warning)" if sens < 5.0 else "INSENSITIVE (Sluggish Response)")

        telemetry = {
            "type": params.governor_type,
            "n_mean_rpm": round(n_mean, 1),
            "lift_mm": round(lift_mm, 2),
            "sensitiveness_pct": round(sens, 2)
        }

        return GovernorMechanismsOutput(
            min_equilibrium_speed_rpm=round(n1, 1),
            max_equilibrium_speed_rpm=round(n2, 1),
            mean_speed_rpm=round(n_mean, 1),
            sleeve_lift_mm=round(lift_mm, 2),
            governor_sensitiveness_pct=round(sens, 2),
            governor_effort_n=round(effort_n, 2),
            governor_power_j=round(power_j, 3),
            governor_stability_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "porter_diesel_engine": {"governor_type": "Porter Governor", "flyball_mass_kg": 3.5, "central_sleeve_mass_kg": 22.0, "upper_arm_length_mm": 240.0, "lower_arm_length_mm": 240.0, "rotation_radius_r1_mm": 120.0, "rotation_radius_r2_mm": 160.0, "spring_stiffness_n_mm": 18.0},
            "hartnell_spring_governor": {"governor_type": "Hartnell Spring Governor", "flyball_mass_kg": 2.5, "central_sleeve_mass_kg": 0.0, "upper_arm_length_mm": 200.0, "lower_arm_length_mm": 200.0, "rotation_radius_r1_mm": 100.0, "rotation_radius_r2_mm": 140.0, "spring_stiffness_n_mm": 25.0}
        }


# ── 12. Balancing of Rotating Masses Engine ─────────────────────────────────
class BalancingRotatingMassesInput(BaseModel):
    masses_kg: List[float] = Field(default=[6.0, 8.5, 5.0, 7.0])
    radii_mm: List[float] = Field(default=[120.0, 150.0, 100.0, 140.0])
    angles_deg: List[float] = Field(default=[0.0, 60.0, 135.0, 240.0])
    axial_distance_z_mm: List[float] = Field(default=[0.0, 150.0, 320.0, 480.0])
    balance_radius_rb_mm: float = Field(default=120.0, ge=50.0, le=300.0)
    shaft_speed_rpm: float = Field(default=1800.0, ge=100.0, le=6000.0)


class BalancingRotatingMassesOutput(BaseModel):
    resultant_unbalance_force_n: float
    required_static_balance_mass_kg: float
    static_balance_angle_deg: float
    left_plane_dynamic_mass_kg: float
    left_plane_dynamic_angle_deg: float
    right_plane_dynamic_mass_kg: float
    right_plane_dynamic_angle_deg: float
    residual_bearing_vibration_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class BalancingRotatingMassesEngine(BaseSimulationEngine):
    name = "balancing-rotating-masses"
    description = "ME/S4/TOM: Static & Dynamic Balancing of Multiple Rotating Masses in Single & Several Planes"

    def calculate(self, params: BalancingRotatingMassesInput) -> BalancingRotatingMassesOutput:
        omega = (2.0 * math.pi * params.shaft_speed_rpm) / 60.0

        fx_sum = 0.0
        fy_sum = 0.0
        cx_sum = 0.0
        cy_sum = 0.0

        for m, r_mm, ang_deg, z_mm in zip(params.masses_kg, params.radii_mm, params.angles_deg, params.axial_distance_z_mm):
            r_m = r_mm / 1000.0
            z_m = z_mm / 1000.0
            rad = math.radians(ang_deg)

            mr = m * r_m
            fx_sum += mr * math.cos(rad)
            fy_sum += mr * math.sin(rad)

            mrz = mr * z_m
            cx_sum += mrz * math.cos(rad)
            cy_sum += mrz * math.sin(rad)

        f_res_n = math.sqrt(fx_sum**2 + fy_sum**2) * (omega ** 2)

        rb_m = params.balance_radius_rb_mm / 1000.0
        m_static = math.sqrt(fx_sum**2 + fy_sum**2) / rb_m
        ang_static_rad = math.atan2(-fy_sum, -fx_sum)
        ang_static_deg = (math.degrees(ang_static_rad) + 360.0) % 360.0

        z_r = max(0.1, max(params.axial_distance_z_mm) / 1000.0)
        m_r_dyn = math.sqrt(cx_sum**2 + cy_sum**2) / (rb_m * z_r)
        ang_r_rad = math.atan2(-cy_sum, -cx_sum)
        ang_r_deg = (math.degrees(ang_r_rad) + 360.0) % 360.0

        fx_r = (m_r_dyn * rb_m) * math.cos(ang_r_rad)
        fy_r = (m_r_dyn * rb_m) * math.sin(ang_r_rad)

        fx_l = -(fx_sum + fx_r)
        fy_l = -(fy_sum + fy_r)
        m_l_dyn = math.sqrt(fx_l**2 + fy_l**2) / rb_m
        ang_l_rad = math.atan2(fy_l, fx_l)
        ang_l_deg = (math.degrees(ang_l_rad) + 360.0) % 360.0

        vib_status = "EXCELLENT (ISO 1940 Grade G2.5 Precision Balance)" if f_res_n < 500.0 else "UNBALANCED: Requires 2-Plane Dynamic Balancing"

        telemetry = {
            "unbalance_force_n": round(f_res_n, 1),
            "static_mass_kg": round(m_static, 3),
            "static_angle_deg": round(ang_static_deg, 1)
        }

        return BalancingRotatingMassesOutput(
            resultant_unbalance_force_n=round(f_res_n, 1),
            required_static_balance_mass_kg=round(m_static, 3),
            static_balance_angle_deg=round(ang_static_deg, 1),
            left_plane_dynamic_mass_kg=round(m_l_dyn, 3),
            left_plane_dynamic_angle_deg=round(ang_l_deg, 1),
            right_plane_dynamic_mass_kg=round(m_r_dyn, 3),
            right_plane_dynamic_angle_deg=round(ang_r_deg, 1),
            residual_bearing_vibration_status=vib_status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "four_crank_rotary_shaft": {"masses_kg": [6.0, 8.5, 5.0, 7.0], "radii_mm": [120.0, 150.0, 100.0, 140.0], "angles_deg": [0.0, 60.0, 135.0, 240.0], "axial_distance_z_mm": [0.0, 150.0, 320.0, 480.0], "balance_radius_rb_mm": 120.0, "shaft_speed_rpm": 1800.0},
            "single_plane_flywheel": {"masses_kg": [4.0, 6.0, 3.5], "radii_mm": [150.0, 120.0, 140.0], "angles_deg": [0.0, 120.0, 240.0], "axial_distance_z_mm": [0.0, 0.0, 0.0], "balance_radius_rb_mm": 150.0, "shaft_speed_rpm": 2400.0}
        }
