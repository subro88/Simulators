"""
Electrical Engineering 6th Semester Simulation Suite (WBSCTE EE/S6/EDEC, EE/S6/EIMT, EE/S6/EWII, EE/S6/IA, EE/S6/PC, EE/S6/CEM)
=============================================================================================================================
Implements 6 core electrical engineering simulation engines:
1. ElectricalDesignEstimationEngine (EE/S6/EDEC Electrical Design, Estimation & Costing)
2. ElectricalInstallationTestingEngine (EE/S6/EIMT Electrical Installation, Maintenance & Testing)
3. ElectricalWorkshop2Engine (EE/S6/EWII Electrical Workshop - II)
4. IndustrialAutomationPLCEngine (EE/S6/IA Industrial Automation & PLC)
5. ProcessControlInstrumentationEngine (EE/S6/PC Process Control & Instrumentation)
6. ControlElectricalMachinesEngine (EE/S6/CEM Control of Electrical Machines)
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


# ── 1. Electrical Design, Estimation & Costing Engine ────────────────────────
class ElectricalDesignEstimationInput(BaseModel):
    installation_type: Literal["residential_subcircuits", "industrial_motor_feeder", "service_connection_cable"] = Field(
        default="industrial_motor_feeder", description="Design Scheme"
    )
    load_power_kw: float = Field(default=37.0, ge=1.0, le=500.0, description="Connected Load Power (kW)")
    supply_voltage_v: float = Field(default=415.0, description="3-Phase Supply Voltage (V)")
    power_factor: float = Field(default=0.85, ge=0.5, le=1.0, description="Load Power Factor cos φ")
    efficiency: float = Field(default=0.90, ge=0.5, le=1.0, description="Motor / Load Efficiency η")
    cable_run_length_m: float = Field(default=80.0, ge=5.0, le=500.0, description="Cable Run Length (m)")
    cable_core_material: Literal["copper", "aluminum"] = Field(default="aluminum", description="Conductor Material")

class ElectricalDesignEstimationOutput(BaseModel):
    installation_type: str
    full_load_current_a: float
    recommended_cable_csa_sqmm: float
    voltage_drop_volts: float
    percentage_voltage_drop: float
    max_allowable_voltage_drop_pct: float
    voltage_drop_compliant: bool
    recommended_mcb_mccb_rating_a: int
    telemetry: Dict[str, Any]

class ElectricalDesignEstimationEngine(BaseSimulationEngine):
    name = "electrical-design-estimation"
    description = "Electrical Design & Estimation Lab: Residential Sub-circuits, Cable Sizing, Voltage Drop & Bill of Materials"

    def calculate(self, params: ElectricalDesignEstimationInput) -> ElectricalDesignEstimationOutput:
        # Full Load Current: I = (P * 1000) / (sqrt(3) * V * cos phi * eta)
        denom = math.sqrt(3.0) * params.supply_voltage_v * params.power_factor * params.efficiency
        iflt = (params.load_power_kw * 1000.0) / max(1.0, denom)

        # Cable Sizing (Rule of thumb: Aluminum ~ 1.5 A/mm², Copper ~ 3.5 A/mm² with derating)
        curr_density = 1.5 if params.cable_core_material == "aluminum" else 3.5
        calc_csa = iflt / curr_density
        # Standard cable cross sections (sq.mm)
        standards = [2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300]
        selected_csa = next((s for s in standards if s >= calc_csa), 300)

        # Conductor resistance & reactance per km
        rho = 0.0287 if params.cable_core_material == "aluminum" else 0.0178  # ohm*mm2/m
        r_cable = (rho * params.cable_run_length_m) / selected_csa
        x_cable = 0.08 * (params.cable_run_length_m / 1000.0)

        sin_phi = math.sin(math.acos(params.power_factor))
        v_drop = math.sqrt(3.0) * iflt * (r_cable * params.power_factor + x_cable * sin_phi)
        pct_drop = (v_drop / params.supply_voltage_v) * 100.0
        compliant = pct_drop <= 3.0

        # Breaker rating standard
        breaker_ratings = [16, 25, 32, 40, 63, 80, 100, 125, 160, 200, 250, 400]
        breaker_a = next((b for b in breaker_ratings if b >= iflt * 1.25), 400)

        return ElectricalDesignEstimationOutput(
            installation_type=params.installation_type,
            full_load_current_a=round(iflt, 2),
            recommended_cable_csa_sqmm=selected_csa,
            voltage_drop_volts=round(v_drop, 2),
            percentage_voltage_drop=round(pct_drop, 2),
            max_allowable_voltage_drop_pct=3.0,
            voltage_drop_compliant=compliant,
            recommended_mcb_mccb_rating_a=breaker_a,
            telemetry={"iflt": round(iflt, 2), "csa": selected_csa, "vdrop": round(v_drop, 2), "compliant": compliant}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "motor_feeder_37kw": {"installation_type": "industrial_motor_feeder", "load_power_kw": 37.0, "cable_run_length_m": 80.0, "cable_core_material": "aluminum"},
            "residential_subcircuit": {"installation_type": "residential_subcircuits", "load_power_kw": 5.0, "supply_voltage_v": 230.0, "cable_core_material": "copper"}
        }


# ── 2. Electrical Installation, Maintenance & Testing Engine ─────────────────
class ElectricalInstallationTestingInput(BaseModel):
    test_procedure: Literal["transformer_heat_run_sumpner", "motor_commissioning_megger", "earth_resistance_fall_potential"] = Field(
        default="transformer_heat_run_sumpner", description="Installation Test Type"
    )
    iron_loss_wi_watts: float = Field(default=450.0, description="Transformer Core Loss Wi (W)")
    copper_loss_wc_watts: float = Field(default=850.0, description="Transformer Full-Load Cu Loss Wc (W)")
    tank_cooling_surface_sqm: float = Field(default=12.5, description="Transformer Tank Surface S (m²)")
    heat_dissipation_coeff: float = Field(default=11.5, description="Cooling Coefficient λ (W/m²-°C)")
    earth_tester_voltage_v: float = Field(default=48.0, description="Earth Tester AC Injected Volts (V)")
    earth_tester_current_a: float = Field(default=6.5, description="Earth Tester Probe Current (A)")

class ElectricalInstallationTestingOutput(BaseModel):
    test_procedure: str
    total_losses_watts: float
    max_steady_temp_rise_c: float
    thermal_time_constant_hours: float
    measured_earth_resistance_ohms: float
    installation_safety_status: str
    telemetry: Dict[str, Any]

class ElectricalInstallationTestingEngine(BaseSimulationEngine):
    name = "electrical-installation-testing"
    description = "Electrical Installation & Testing Lab: Transformer Heat Run, Motor Commissioning & Earth Tester"

    def calculate(self, params: ElectricalInstallationTestingInput) -> ElectricalInstallationTestingOutput:
        w_total = params.iron_loss_wi_watts + params.copper_loss_wc_watts
        # Steady state temperature rise: theta_m = W_total / (S * lambda)
        theta_m = w_total / max(1.0, (params.tank_cooling_surface_sqm * params.heat_dissipation_coeff))
        tau_hours = 2.8  # Typical distribution transformer thermal time constant

        r_earth = params.earth_tester_voltage_v / max(0.1, params.earth_tester_current_a)
        is_safe = (theta_m <= 50.0) and (r_earth <= 1.0)
        status = "PASSED (IS 2026 & IE Rule 67 Compliant)" if is_safe else "WARNING: Out of Specification"

        return ElectricalInstallationTestingOutput(
            test_procedure=params.test_procedure,
            total_losses_watts=round(w_total, 1),
            max_steady_temp_rise_c=round(theta_m, 2),
            thermal_time_constant_hours=tau_hours,
            measured_earth_resistance_ohms=round(r_earth, 3),
            installation_safety_status=status,
            telemetry={"theta_m": round(theta_m, 1), "r_earth": round(r_earth, 2), "status": status}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "sumpner_test_10kva": {"test_procedure": "transformer_heat_run_sumpner", "iron_loss_wi_watts": 450.0, "copper_loss_wc_watts": 850.0},
            "earth_grid_test": {"test_procedure": "earth_resistance_fall_potential", "earth_tester_voltage_v": 4.5, "earth_tester_current_a": 6.5}
        }


# ── 3. Electrical Workshop - II Engine ───────────────────────────────────────
class ElectricalWorkshop2Input(BaseModel):
    workshop_task: Literal["motor_stator_rewinding", "armature_millivolt_drop_test", "busbar_fabrication_bending"] = Field(
        default="motor_stator_rewinding", description="Workshop Practical Task"
    )
    motor_hp_rating: float = Field(default=5.0, description="Induction Motor Rating (HP)")
    stator_slots: int = Field(default=36, description="Total Stator Slots (S)")
    number_of_poles: int = Field(default=4, description="Poles (P)")
    coil_span_slots: int = Field(default=8, description="Coil Span (1 to 9 = 8 slots)")
    wire_swg_gauge: int = Field(default=21, description="Copper Magnet Wire SWG")

class ElectricalWorkshop2Output(BaseModel):
    workshop_task: str
    slots_per_pole: float
    electrical_slot_angle_deg: float
    coil_pitch_factor_kp: float
    conductor_diameter_mm: float
    estimated_total_wire_kg: float
    telemetry: Dict[str, Any]

class ElectricalWorkshop2Engine(BaseSimulationEngine):
    name = "electrical-workshop-2"
    description = "Electrical Workshop - II: Motor Rewinding, Coil Pitch, Drop Test & Cable Termination"

    def calculate(self, params: ElectricalWorkshop2Input) -> ElectricalWorkshop2Output:
        s_per_p = params.stator_slots / params.number_of_poles
        gamma_deg = (180.0 * params.number_of_poles) / params.stator_slots  # slot angle electrical

        # Coil Pitch Factor: kp = cos(chording_angle / 2)
        full_pitch_slots = s_per_p
        chording_slots = full_pitch_slots - params.coil_span_slots
        chording_angle_rad = math.radians(chording_slots * gamma_deg)
        kp = math.cos(chording_angle_rad / 2.0)

        # Wire gauge 21 SWG diameter approx 0.813 mm
        wire_dia = 0.813 if params.wire_swg_gauge == 21 else (1.22 if params.wire_swg_gauge == 18 else 0.559)
        est_kg = params.motor_hp_rating * 0.95  # approx 0.95 kg copper per HP

        return ElectricalWorkshop2Output(
            workshop_task=params.workshop_task,
            slots_per_pole=round(s_per_p, 1),
            electrical_slot_angle_deg=round(gamma_deg, 2),
            coil_pitch_factor_kp=round(kp, 4),
            conductor_diameter_mm=wire_dia,
            estimated_total_wire_kg=round(est_kg, 2),
            telemetry={"kp": round(kp, 4), "gamma": round(gamma_deg, 2), "kg": round(est_kg, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "rewind_5hp_4pole": {"workshop_task": "motor_stator_rewinding", "motor_hp_rating": 5.0, "stator_slots": 36, "number_of_poles": 4, "coil_span_slots": 8},
            "rewind_10hp_4pole": {"workshop_task": "motor_stator_rewinding", "motor_hp_rating": 10.0, "stator_slots": 48, "number_of_poles": 4, "coil_span_slots": 10}
        }


# ── 4. Industrial Automation & PLC Engine ────────────────────────────────────
class IndustrialAutomationPLCInput(BaseModel):
    plc_mode: Literal["ladder_logic_latch", "timer_ton_delay", "counter_ctu_batch"] = Field(
        default="ladder_logic_latch", description="PLC Simulation Routine"
    )
    start_pushbutton_i0_0: bool = Field(default=True, description="Start PB Normally Open I0.0")
    stop_pushbutton_i0_1: bool = Field(default=False, description="Stop PB Normally Closed I0.1 (True=Pressed/Open)")
    overload_trip_i0_2: bool = Field(default=False, description="Thermal Overload Trip I0.2")
    timer_preset_pt_sec: float = Field(default=5.0, description="Timer Preset PT (s)")
    current_time_elapsed_et_sec: float = Field(default=3.5, description="Timer Elapsed ET (s)")

class IndustrialAutomationPLCOutput(BaseModel):
    plc_mode: str
    motor_contactor_q0_0: bool
    timer_done_bit_dn: bool
    scada_hmi_status_color: str
    scan_cycle_time_ms: float
    telemetry: Dict[str, Any]

class IndustrialAutomationPLCEngine(BaseSimulationEngine):
    name = "industrial-automation-plc"
    description = "Industrial Automation & PLC Lab: Ladder Logic Simulator, TON/CTU & SCADA Telemetry"

    def calculate(self, params: IndustrialAutomationPLCInput) -> IndustrialAutomationPLCOutput:
        # Latch logic: Q0.0 = (I0.0 OR Q0.0) AND (NOT I0.1) AND (NOT I0.2)
        q_out = (params.start_pushbutton_i0_0) and (not params.stop_pushbutton_i0_1) and (not params.overload_trip_i0_2)
        t_done = params.current_time_elapsed_et_sec >= params.timer_preset_pt_sec

        status_color = "#10b981" if q_out else ("#ef4444" if params.overload_trip_i0_2 else "#64748b")

        return IndustrialAutomationPLCOutput(
            plc_mode=params.plc_mode,
            motor_contactor_q0_0=q_out,
            timer_done_bit_dn=t_done,
            scada_hmi_status_color=status_color,
            scan_cycle_time_ms=1.45,
            telemetry={"q_out": q_out, "t_done": t_done, "et": params.current_time_elapsed_et_sec}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "motor_running": {"plc_mode": "ladder_logic_latch", "start_pushbutton_i0_0": True, "stop_pushbutton_i0_1": False, "overload_trip_i0_2": False},
            "trip_overload": {"plc_mode": "ladder_logic_latch", "start_pushbutton_i0_0": True, "stop_pushbutton_i0_1": False, "overload_trip_i0_2": True}
        }


# ── 5. Process Control & Instrumentation Engine ──────────────────────────────
class ProcessControlInstrumentationInput(BaseModel):
    loop_type: Literal["transmitter_4_20ma_calibration", "control_valve_cv_sizing", "pid_pressure_tank"] = Field(
        default="transmitter_4_20ma_calibration", description="Process Loop Subsystem"
    )
    measured_pressure_bar: float = Field(default=6.5, ge=0.0, le=16.0, description="Process Line Pressure (Bar)")
    pressure_range_max_bar: float = Field(default=10.0, description="Sensor Calibrated Span (Bar)")
    liquid_flow_q_gpm: float = Field(default=85.0, description="Fluid Flow Rate Q (GPM)")
    valve_pressure_drop_psi: float = Field(default=15.0, description="Valve Differential Delta P (psi)")
    specific_gravity_sg: float = Field(default=1.0, description="Fluid Specific Gravity SG (Water = 1.0)")

class ProcessControlInstrumentationOutput(BaseModel):
    loop_type: str
    transmitter_current_ma: float
    percentage_process_variable: float
    required_valve_cv: float
    flow_regime: str
    telemetry: Dict[str, Any]

class ProcessControlInstrumentationEngine(BaseSimulationEngine):
    name = "process-control-instrumentation"
    description = "Process Control Lab: 4-20mA Transmitter, Control Valve Cv Sizing & Closed-Loop Response"

    def calculate(self, params: ProcessControlInstrumentationInput) -> ProcessControlInstrumentationOutput:
        pct_pv = (params.measured_pressure_bar / max(0.1, params.pressure_range_max_bar)) * 100.0
        # 4-20mA Output: I = 4 + 16 * (PV / Span)
        i_ma = 4.0 + (16.0 * min(1.0, max(0.0, pct_pv / 100.0)))

        # Valve Flow Coefficient: Cv = Q * sqrt(SG / DeltaP)
        cv = params.liquid_flow_q_gpm * math.sqrt(params.specific_gravity_sg / max(0.1, params.valve_pressure_drop_psi))

        return ProcessControlInstrumentationOutput(
            loop_type=params.loop_type,
            transmitter_current_ma=round(i_ma, 2),
            percentage_process_variable=round(pct_pv, 1),
            required_valve_cv=round(cv, 2),
            flow_regime="Turbulent (Linear Equal Percentage Characteristic)",
            telemetry={"i_ma": round(i_ma, 2), "pct": round(pct_pv, 1), "cv": round(cv, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "pressure_65pct": {"loop_type": "transmitter_4_20ma_calibration", "measured_pressure_bar": 6.5, "pressure_range_max_bar": 10.0},
            "valve_85gpm": {"loop_type": "control_valve_cv_sizing", "liquid_flow_q_gpm": 85.0, "valve_pressure_drop_psi": 15.0}
        }


# ── 6. Control of Electrical Machines Engine ─────────────────────────────────
class ControlElectricalMachinesInput(BaseModel):
    starter_scheme: Literal["star_delta_automatic", "direct_on_line_dol", "rotor_resistance_starter"] = Field(
        default="star_delta_automatic", description="Motor Starter Topology"
    )
    motor_rated_power_kw: float = Field(default=22.0, description="Motor Rated Power (kW)")
    supply_voltage_v: float = Field(default=415.0, description="3-Phase Supply (V)")
    dol_starting_current_ratio: float = Field(default=6.0, description="DOL Starting Current Multiple (Is/In)")
    transition_timer_sec: float = Field(default=6.0, ge=1.0, le=20.0, description="Star to Delta Timer (s)")
    current_operating_time_s: float = Field(default=4.0, description="Time since Start Button (s)")

class ControlElectricalMachinesOutput(BaseModel):
    starter_scheme: str
    active_connection_mode: str
    starting_line_current_a: float
    starting_torque_percent: float
    star_current_reduction_ratio: float
    thermal_relay_health: str
    telemetry: Dict[str, Any]

class ControlElectricalMachinesEngine(BaseSimulationEngine):
    name = "control-electrical-machines"
    description = "Control of Electrical Machines Lab: Star-Delta Starter Timing, Rotor Resistance & Dynamic Braking"

    def calculate(self, params: ControlElectricalMachinesInput) -> ControlElectricalMachinesOutput:
        # Rated full load current
        i_fl = (params.motor_rated_power_kw * 1000.0) / (math.sqrt(3.0) * params.supply_voltage_v * 0.86 * 0.90)
        i_dol = i_fl * params.dol_starting_current_ratio

        is_star = params.current_operating_time_s < params.transition_timer_sec
        mode = "STAR (Reduced Voltage 58%)" if is_star else "DELTA (Full 415V Line Running)"

        # In Star: I_st = (1/3) * I_DOL, T_st = (1/3) * T_DOL
        i_start = (i_dol / 3.0) if is_star else i_fl
        t_start_pct = (33.3) if is_star else 100.0

        return ControlElectricalMachinesOutput(
            starter_scheme=params.starter_scheme,
            active_connection_mode=mode,
            starting_line_current_a=round(i_start, 2),
            starting_torque_percent=round(t_start_pct, 1),
            star_current_reduction_ratio=0.333,
            thermal_relay_health="NORMAL (Bimetallic Strip Reset)",
            telemetry={"mode": mode, "i_start": round(i_start, 1), "t_timer": params.transition_timer_sec}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "star_phase_4s": {"starter_scheme": "star_delta_automatic", "motor_rated_power_kw": 22.0, "transition_timer_sec": 6.0, "current_operating_time_s": 4.0},
            "delta_phase_8s": {"starter_scheme": "star_delta_automatic", "motor_rated_power_kw": 22.0, "transition_timer_sec": 6.0, "current_operating_time_s": 8.0}
        }
