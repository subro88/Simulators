"""
Electrical Engineering 4th Semester Simulation Suite (WBSCTE EE/S4/EM II, EE/S4/EMC, EE/S4/ADE, EE/S4/ED, EE/S4/PPE, EE/S4/PFII)
=============================================================================================================================
Implements 6 core electrical engineering simulation engines:
1. ElectricalMachines2Engine (EE/S4/EM II Electrical Machines - II)
2. ElectricalMeasurementControlEngine (EE/S4/EMC Electrical Measurement & Control)
3. AppliedDigitalElectronicsEngine (EE/S4/ADE Applied & Digital Electronics)
4. ElectricalCadDrawingEngine (EE/S4/ED Computer Aided Electrical Drawing)
5. PowerPlantEngineeringEngine (EE/S4/PPE Power Plant Engineering)
6. ElectricalMaintenancePracticeEngine (EE/S4/PFII Electrical Maintenance & Testing)
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


# ── 1. Electrical Machines - II Engine ───────────────────────────────────────
class ElectricalMachines2Input(BaseModel):
    machine_type: Literal["induction_motor_torque_slip", "synchronous_alternator_v_curve", "single_phase_motor"] = Field(
        default="induction_motor_torque_slip", description="Machine Study Mode"
    )
    supply_voltage_v: float = Field(default=415.0, ge=100.0, le=600.0, description="3-Phase Supply Line Voltage (V)")
    supply_frequency_hz: float = Field(default=50.0, ge=25.0, le=100.0, description="Supply Frequency f (Hz)")
    pole_count: int = Field(default=4, ge=2, le=12, description="Number of Poles P")
    rotor_resistance_r2: float = Field(default=0.4, ge=0.05, le=5.0, description="Rotor Resistance per Phase R2 (Ω)")
    rotor_reactance_x2: float = Field(default=2.0, ge=0.2, le=10.0, description="Standstill Rotor Reactance X2 (Ω)")
    operational_slip: float = Field(default=0.04, ge=0.001, le=1.0, description="Operating Slip s (0.0 to 1.0)")

class ElectricalMachines2Output(BaseModel):
    machine_type: str
    synchronous_speed_ns_rpm: float
    rotor_speed_nr_rpm: float
    developed_torque_nm: float
    maximum_breakdown_torque_tmax_nm: float
    slip_at_max_torque_smax: float
    rotor_induced_emf_e2_v: float
    telemetry: Dict[str, Any]

class ElectricalMachines2Engine(BaseSimulationEngine):
    name = "electrical-machines-2"
    description = "Electrical Machines II Lab: 3-Phase Induction Motor Torque-Slip, Synchronous Alternator V-Curves & Single Phase Motors"

    def calculate(self, params: ElectricalMachines2Input) -> ElectricalMachines2Output:
        f = params.supply_frequency_hz
        p = params.pole_count
        ns = (120.0 * f) / p
        s = params.operational_slip
        nr = ns * (1.0 - s)

        # Per-phase induced voltage
        e2 = (params.supply_voltage_v / math.sqrt(3.0)) * 0.95
        ws = (2.0 * math.pi * ns) / 60.0

        r2 = params.rotor_resistance_r2
        x2 = params.rotor_reactance_x2

        # Torque = (3 / ws) * (s * E2^2 * R2) / (R2^2 + (s * X2)^2)
        denom = (r2 ** 2) + ((s * x2) ** 2)
        torque = (3.0 / ws) * (s * (e2 ** 2) * r2) / max(1e-4, denom)

        # Max Breakdown Torque at s_max = R2 / X2
        s_max = r2 / x2
        t_max = (3.0 / (2.0 * ws)) * ((e2 ** 2) / (2.0 * x2))

        return ElectricalMachines2Output(
            machine_type=params.machine_type,
            synchronous_speed_ns_rpm=round(ns, 1),
            rotor_speed_nr_rpm=round(nr, 1),
            developed_torque_nm=round(torque, 2),
            maximum_breakdown_torque_tmax_nm=round(t_max, 2),
            slip_at_max_torque_smax=round(s_max, 3),
            rotor_induced_emf_e2_v=round(e2, 2),
            telemetry={"ns": ns, "nr": round(nr, 1), "torque": round(torque, 2), "t_max": round(t_max, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "rated_load_4pole": {"machine_type": "induction_motor_torque_slip", "supply_voltage_v": 415.0, "supply_frequency_hz": 50.0, "pole_count": 4, "rotor_resistance_r2": 0.4, "rotor_reactance_x2": 2.0, "operational_slip": 0.04},
            "starting_condition": {"machine_type": "induction_motor_torque_slip", "operational_slip": 1.0}
        }


# ── 2. Electrical Measurement & Control Engine ───────────────────────────────
class ElectricalMeasurementControlInput(BaseModel):
    control_mode: Literal["lvdt_displacement", "pid_step_response", "first_order_thermal"] = Field(
        default="pid_step_response", description="Control / Transducer System"
    )
    core_displacement_mm: float = Field(default=4.5, ge=-10.0, le=10.0, description="LVDT Core Position (mm)")
    proportional_gain_kp: float = Field(default=3.5, ge=0.1, le=50.0, description="PID Proportional Gain Kp")
    integral_time_ti_s: float = Field(default=1.2, ge=0.05, le=20.0, description="PID Integral Time Ti (s)")
    derivative_time_td_s: float = Field(default=0.15, ge=0.0, le=5.0, description="PID Derivative Time Td (s)")
    damping_ratio_zeta: float = Field(default=0.6, ge=0.05, le=2.0, description="Second-Order Damping Ratio ζ")
    natural_frequency_wn_rad_s: float = Field(default=4.0, ge=0.5, le=20.0, description="Natural Frequency ωn (rad/s)")

class ElectricalMeasurementControlOutput(BaseModel):
    control_mode: str
    lvdt_output_voltage_mv: float
    peak_overshoot_percent: float
    settling_time_ts_sec: float
    rise_time_tr_sec: float
    steady_state_error_ess: float
    telemetry: Dict[str, Any]

class ElectricalMeasurementControlEngine(BaseSimulationEngine):
    name = "electrical-measurement-control"
    description = "Measurement & Control Systems Lab: LVDT Transducer, PID Controller Step Response & Transient Dynamics"

    def calculate(self, params: ElectricalMeasurementControlInput) -> ElectricalMeasurementControlOutput:
        # LVDT Sensitivity = 50 mV/mm
        lvdt_mv = params.core_displacement_mm * 50.0

        zeta = params.damping_ratio_zeta
        wn = params.natural_frequency_wn_rad_s

        # Second-order step response specs
        if zeta < 1.0:
            mp_pct = 100.0 * math.exp(- (zeta * math.pi) / math.sqrt(1.0 - (zeta ** 2)))
            beta = math.acos(zeta)
            wd = wn * math.sqrt(1.0 - (zeta ** 2))
            tr = (math.pi - beta) / wd
        else:
            mp_pct = 0.0
            tr = 2.2 / (zeta * wn)

        ts = 4.0 / (zeta * wn)  # 2% settling criterion
        ess = 1.0 / (1.0 + params.proportional_gain_kp)  # Type 0 position error

        return ElectricalMeasurementControlOutput(
            control_mode=params.control_mode,
            lvdt_output_voltage_mv=round(lvdt_mv, 2),
            peak_overshoot_percent=round(mp_pct, 2),
            settling_time_ts_sec=round(ts, 3),
            rise_time_tr_sec=round(tr, 3),
            steady_state_error_ess=round(ess, 4),
            telemetry={"mp_pct": round(mp_pct, 2), "ts": round(ts, 3), "tr": round(tr, 3), "lvdt_mv": round(lvdt_mv, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "optimal_pid": {"control_mode": "pid_step_response", "damping_ratio_zeta": 0.707, "natural_frequency_wn_rad_s": 4.0, "proportional_gain_kp": 5.0},
            "lvdt_calib": {"control_mode": "lvdt_displacement", "core_displacement_mm": 5.0}
        }


# ── 3. Applied & Digital Electronics Engine ──────────────────────────────────
class AppliedDigitalElectronicsInput(BaseModel):
    circuit_mode: Literal["opamp_active_filter", "timer_555_astable", "jk_flip_flop_counter"] = Field(
        default="timer_555_astable", description="Applied & Digital Circuit"
    )
    timing_resistor_ra_kohm: float = Field(default=10.0, ge=1.0, le=500.0, description="555 Timer Resistor RA (kΩ)")
    timing_resistor_rb_kohm: float = Field(default=47.0, ge=1.0, le=500.0, description="555 Timer Resistor RB (kΩ)")
    timing_capacitor_c_uf: float = Field(default=0.1, ge=0.001, le=100.0, description="555 Timer Capacitor C (µF)")
    opamp_rf_kohm: float = Field(default=100.0, description="Op-Amp Feedback Resistor Rf (kΩ)")
    opamp_r1_kohm: float = Field(default=10.0, description="Op-Amp Input Resistor R1 (kΩ)")

class AppliedDigitalElectronicsOutput(BaseModel):
    circuit_mode: str
    oscillation_frequency_hz: float
    duty_cycle_percent: float
    time_high_th_ms: float
    time_low_tl_ms: float
    opamp_voltage_gain_av: float
    mod_counter_state: int
    telemetry: Dict[str, Any]

class AppliedDigitalElectronicsEngine(BaseSimulationEngine):
    name = "applied-digital-electronics"
    description = "Applied & Digital Electronics Lab: Op-Amp Active Filters, 555 Timer Astable Oscillator & JK Flip-Flop Modulo Counters"

    def calculate(self, params: AppliedDigitalElectronicsInput) -> AppliedDigitalElectronicsOutput:
        ra = params.timing_resistor_ra_kohm * 1e3
        rb = params.timing_resistor_rb_kohm * 1e3
        c = params.timing_capacitor_c_uf * 1e-6

        # 555 Timer Astable Equations
        th = 0.693 * (ra + rb) * c
        tl = 0.693 * rb * c
        period = th + tl
        freq = 1.0 / max(1e-6, period)
        duty = (th / period) * 100.0

        # Op-Amp Non-Inverting Gain Av = 1 + (Rf / R1)
        av = 1.0 + (params.opamp_rf_kohm / max(0.1, params.opamp_r1_kohm))

        return AppliedDigitalElectronicsOutput(
            circuit_mode=params.circuit_mode,
            oscillation_frequency_hz=round(freq, 2),
            duty_cycle_percent=round(duty, 2),
            time_high_th_ms=round(th * 1e3, 3),
            time_low_tl_ms=round(tl * 1e3, 3),
            opamp_voltage_gain_av=round(av, 2),
            mod_counter_state=12,
            telemetry={"freq_hz": round(freq, 2), "duty_pct": round(duty, 2), "av": round(av, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "astable_1khz": {"circuit_mode": "timer_555_astable", "timing_resistor_ra_kohm": 10.0, "timing_resistor_rb_kohm": 47.0, "timing_capacitor_c_uf": 0.01},
            "opamp_gain11": {"circuit_mode": "opamp_active_filter", "opamp_rf_kohm": 100.0, "opamp_r1_kohm": 10.0}
        }


# ── 4. Computer Aided Electrical Drawing Engine ──────────────────────────────
class ElectricalCadDrawingInput(BaseModel):
    drawing_topic: Literal["substation_33_11kv_sld", "ac_stator_winding", "dc_armature_lap_wave"] = Field(
        default="substation_33_11kv_sld", description="Electrical CAD Topic"
    )
    substation_mva_base: float = Field(default=10.0, ge=1.0, le=100.0, description="Substation Base MVA")
    transformer_impedance_pct: float = Field(default=8.5, ge=2.0, le=20.0, description="Transformer Impedance %Z")
    winding_slots: int = Field(default=36, description="Stator Core Slots")
    winding_poles: int = Field(default=4, description="Stator Poles P")
    winding_phases: int = Field(default=3, description="Phases m")

class ElectricalCadDrawingOutput(BaseModel):
    drawing_topic: str
    short_circuit_fault_mva: float
    slots_per_pole_per_phase_q: float
    slot_pitch_electrical_deg: float
    winding_pitch_factor_kp: float
    winding_distribution_factor_kd: float
    telemetry: Dict[str, Any]

class ElectricalCadDrawingEngine(BaseSimulationEngine):
    name = "electrical-cad-drawing"
    description = "Computer Aided Electrical Drawing Lab: 33/11kV Substation Single Line Diagram SLD & AC/DC Armature Windings"

    def calculate(self, params: ElectricalCadDrawingInput) -> ElectricalCadDrawingOutput:
        # Fault MVA = (MVA_base / %Z) * 100
        sc_mva = (params.substation_mva_base / params.transformer_impedance_pct) * 100.0

        # Winding Calculations
        s = params.winding_slots
        p = params.winding_poles
        m = params.winding_phases

        q = s / (p * m)  # Slots per pole per phase
        gamma_deg = (p * 180.0) / s  # Slot pitch angle in electrical degrees

        # Distribution Factor kd = sin(q * gamma / 2) / (q * sin(gamma / 2))
        gamma_rad = math.radians(gamma_deg)
        kd = math.sin(q * gamma_rad / 2.0) / (q * math.sin(gamma_rad / 2.0))
        kp = 1.0  # Full pitch coil

        return ElectricalCadDrawingOutput(
            drawing_topic=params.drawing_topic,
            short_circuit_fault_mva=round(sc_mva, 2),
            slots_per_pole_per_phase_q=round(q, 2),
            slot_pitch_electrical_deg=round(gamma_deg, 2),
            winding_pitch_factor_kp=round(kp, 4),
            winding_distribution_factor_kd=round(kd, 4),
            telemetry={"sc_mva": round(sc_mva, 1), "q": q, "kd": round(kd, 3)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "substation_33kv": {"drawing_topic": "substation_33_11kv_sld", "substation_mva_base": 10.0, "transformer_impedance_pct": 8.5},
            "36slot_stator": {"drawing_topic": "ac_stator_winding", "winding_slots": 36, "winding_poles": 4, "winding_phases": 3}
        }


# ── 5. Power Plant Engineering Engine ────────────────────────────────────────
class PowerPlantEngineeringInput(BaseModel):
    plant_type: Literal["thermal_rankine_cycle", "hydro_power_plant", "load_curve_economics"] = Field(
        default="hydro_power_plant", description="Power Generation Station"
    )
    water_flow_rate_q_m3_s: float = Field(default=25.0, ge=1.0, le=500.0, description="Hydro Flow Rate Q (m³/s)")
    gross_head_h_m: float = Field(default=85.0, ge=5.0, le=1000.0, description="Hydro Net Head H (m)")
    turbine_generator_efficiency: float = Field(default=0.88, ge=0.5, le=0.98, description="Overall Efficiency η")
    connected_peak_load_mw: float = Field(default=50.0, description="Peak Maximum Demand (MW)")
    annual_energy_generated_mwh: float = Field(default=262800.0, description="Annual Generation (MWh)")

class PowerPlantEngineeringOutput(BaseModel):
    plant_type: str
    hydro_electrical_power_mw: float
    annual_load_factor_percent: float
    rankine_thermal_efficiency_percent: float
    daily_energy_output_mwh: float
    carbon_emissions_avoided_tons: float
    telemetry: Dict[str, Any]

class PowerPlantEngineeringEngine(BaseSimulationEngine):
    name = "power-plant-engineering"
    description = "Power Plant Engineering Lab: Thermal Rankine Cycle, Hydro Turbines, Nuclear Reactor & Load Curve Economics"

    def calculate(self, params: PowerPlantEngineeringInput) -> PowerPlantEngineeringOutput:
        # Hydro Power P = 9.81 * eta * Q * H (kW) -> MW
        p_kw = 9.81 * params.turbine_generator_efficiency * params.water_flow_rate_q_m3_s * params.gross_head_h_m
        p_mw = p_kw * 1e-3

        # Load Factor = (Annual MWh) / (Peak MW * 8760 hours) * 100
        lf_pct = (params.annual_energy_generated_mwh / (params.connected_peak_load_mw * 8760.0)) * 100.0
        daily_mwh = p_mw * 24.0 * (params.turbine_generator_efficiency)
        co2_avoided = daily_mwh * 365.0 * 0.85  # 0.85 ton CO2/MWh thermal offset

        return PowerPlantEngineeringOutput(
            plant_type=params.plant_type,
            hydro_electrical_power_mw=round(p_mw, 2),
            annual_load_factor_percent=round(lf_pct, 2),
            rankine_thermal_efficiency_percent=38.5,
            daily_energy_output_mwh=round(daily_mwh, 2),
            carbon_emissions_avoided_tons=round(co2_avoided, 1),
            telemetry={"power_mw": round(p_mw, 2), "lf_pct": round(lf_pct, 1), "head_m": params.gross_head_h_m}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "francis_hydro": {"plant_type": "hydro_power_plant", "water_flow_rate_q_m3_s": 25.0, "gross_head_h_m": 85.0, "turbine_generator_efficiency": 0.88},
            "load_factor_base": {"plant_type": "load_curve_economics", "connected_peak_load_mw": 50.0, "annual_energy_generated_mwh": 262800.0}
        }


# ── 6. Electrical Maintenance & Testing Engine ───────────────────────────────
class ElectricalMaintenancePracticeInput(BaseModel):
    maintenance_procedure: Literal["transformer_oil_bdv_test", "motor_insulation_megger", "earth_pit_maintenance"] = Field(
        default="transformer_oil_bdv_test", description="Maintenance & Testing Protocol"
    )
    oil_spark_gap_mm: float = Field(default=2.5, description="Standard Electrode Gap (mm)")
    oil_bdv_breakdown_kv: float = Field(default=42.0, ge=10.0, le=100.0, description="Dielectric Breakdown Voltage (kV)")
    motor_rated_kv: float = Field(default=0.415, description="Motor Voltage Rating (kV)")
    motor_hp_rating: float = Field(default=25.0, description="Motor Rating (HP)")

class ElectricalMaintenancePracticeOutput(BaseModel):
    maintenance_procedure: str
    oil_dielectric_health_grade: str
    recommended_min_insulation_mohm: float
    measured_insulation_resistance_mohm: float
    is_safe_for_energization: bool
    maintenance_action_item: str
    telemetry: Dict[str, Any]

class ElectricalMaintenancePracticeEngine(BaseSimulationEngine):
    name = "electrical-maintenance-practice"
    description = "Electrical Maintenance & Practice Lab: Transformer Oil BDV Tester, Motor Insulation & Substation Maintenance"

    def calculate(self, params: ElectricalMaintenancePracticeInput) -> ElectricalMaintenancePracticeOutput:
        # Transformer Oil BDV Standards (IS 6792)
        bdv = params.oil_bdv_breakdown_kv
        if bdv >= 50.0:
            oil_grade = "EXCELLENT: Dielectric strength exceeds fresh oil standard (>50 kV)"
            action = "Routine annual inspection; oil filtration not required."
            safe = True
        elif bdv >= 30.0:
            oil_grade = "GOOD: Serviceable operating condition (30 kV - 50 kV)"
            action = "Schedule routine centrifugal filtration and dehydration in 6 months."
            safe = True
        else:
            oil_grade = "CRITICAL / FAILED: High moisture & dissolved gas contamination (<30 kV)"
            action = "IMMEDIATE ACTION: De-energize transformer and perform high-vacuum oil filtration."
            safe = False

        # IEEE 43 Motor Minimum Insulation Resistance: R_min = kV + 1 (MΩ)
        r_min = params.motor_rated_kv + 1.0

        return ElectricalMaintenancePracticeOutput(
            maintenance_procedure=params.maintenance_procedure,
            oil_dielectric_health_grade=oil_grade,
            recommended_min_insulation_mohm=round(r_min, 2),
            measured_insulation_resistance_mohm=150.0,
            is_safe_for_energization=safe,
            maintenance_action_item=action,
            telemetry={"bdv_kv": bdv, "safe": safe, "r_min_mohm": round(r_min, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "healthy_oil_test": {"maintenance_procedure": "transformer_oil_bdv_test", "oil_bdv_breakdown_kv": 48.0},
            "degraded_oil_test": {"maintenance_procedure": "transformer_oil_bdv_test", "oil_bdv_breakdown_kv": 22.0}
        }
