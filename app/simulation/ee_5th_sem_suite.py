"""
Electrical Engineering 5th Semester Simulation Suite (WBSCTE EE/S5/PED, EE/S5/MPMC, EE/S5/SGP, EE/S5/UTHD, EE/S5/ILE, EE/S5/ECA)
=============================================================================================================================
Implements 6 core electrical engineering simulation engines:
1. PowerElectronicsDrivesEngine (EE/S5/PED Power Electronics & Drives)
2. Microcontroller8051Engine (EE/S5/MPMC Microprocessor & Microcontroller)
3. SwitchgearProtectionEngine (EE/S5/SGP Switchgear & Protection)
4. ElectricTractionHeatingEngine (EE/S5/UTHD Utilization, Traction, Heating and Drives)
5. IlluminationEngineeringEngine (EE/S5/ILE Illumination Engineering)
6. EnergyAuditConservationEngine (EE/S5/ECA Energy Conservation & Audit)
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


# ── 1. Power Electronics & Drives Engine ─────────────────────────────────────
class PowerElectronicsDrivesInput(BaseModel):
    converter_topology: Literal["scr_single_phase_bridge", "dc_buck_chopper", "dc_boost_chopper"] = Field(
        default="scr_single_phase_bridge", description="Power Converter Type"
    )
    firing_angle_alpha_deg: float = Field(default=45.0, ge=0.0, le=180.0, description="SCR Firing Angle α (°)")
    ac_input_voltage_rms: float = Field(default=230.0, ge=50.0, le=440.0, description="AC Supply Voltage (V RMS)")
    dc_duty_cycle_d: float = Field(default=0.6, ge=0.05, le=0.95, description="Chopper Duty Cycle D")
    chopper_input_vs: float = Field(default=100.0, ge=10.0, le=500.0, description="Chopper Input Voltage Vs (V)")
    load_resistance_r: float = Field(default=10.0, ge=1.0, le=200.0, description="Load Resistance (Ω)")

class PowerElectronicsDrivesOutput(BaseModel):
    converter_topology: str
    average_dc_voltage_vo: float
    rms_output_voltage_vrms: float
    average_load_current_io_a: float
    ripple_factor: float
    form_factor: float
    telemetry: Dict[str, Any]

class PowerElectronicsDrivesEngine(BaseSimulationEngine):
    name = "power-electronics-drives"
    description = "Power Electronics & Drives Lab: SCR Firing Phase Control, Buck/Boost DC Choppers & SPWM Inverter"

    def calculate(self, params: PowerElectronicsDrivesInput) -> PowerElectronicsDrivesOutput:
        alpha_rad = math.radians(params.firing_angle_alpha_deg)
        vm = params.ac_input_voltage_rms * math.sqrt(2.0)

        if params.converter_topology == "scr_single_phase_bridge":
            # Fully controlled bridge: Vdc = (2*Vm / pi) * cos(alpha)
            vdc = (2.0 * vm / math.pi) * math.cos(alpha_rad)
            vrms_sq = (vm ** 2) * (0.5 - (alpha_rad / (2.0 * math.pi)) + (math.sin(2.0 * alpha_rad) / (4.0 * math.pi)))
            vrms = math.sqrt(max(0.0, vrms_sq))
        elif params.converter_topology == "dc_buck_chopper":
            vdc = params.dc_duty_cycle_d * params.chopper_input_vs
            vrms = math.sqrt(params.dc_duty_cycle_d) * params.chopper_input_vs
        else:  # Boost Chopper
            vdc = params.chopper_input_vs / max(0.05, (1.0 - params.dc_duty_cycle_d))
            vrms = vdc

        io = vdc / params.load_resistance_r
        ff = vrms / max(1e-4, abs(vdc))
        rf = math.sqrt(max(0.0, (ff ** 2) - 1.0))

        return PowerElectronicsDrivesOutput(
            converter_topology=params.converter_topology,
            average_dc_voltage_vo=round(vdc, 2),
            rms_output_voltage_vrms=round(vrms, 2),
            average_load_current_io_a=round(io, 2),
            ripple_factor=round(rf, 3),
            form_factor=round(ff, 3),
            telemetry={"vdc": round(vdc, 2), "io_a": round(io, 2), "alpha": params.firing_angle_alpha_deg}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "scr_45deg": {"converter_topology": "scr_single_phase_bridge", "firing_angle_alpha_deg": 45.0, "ac_input_voltage_rms": 230.0},
            "buck_60pct": {"converter_topology": "dc_buck_chopper", "dc_duty_cycle_d": 0.60, "chopper_input_vs": 100.0}
        }


# ── 2. 8051 Microcontroller & Embedded Engine ────────────────────────────────
class Microcontroller8051Input(BaseModel):
    subsystem_mode: Literal["baud_rate_generator", "stepper_motor_pwm", "adc0808_conversion"] = Field(
        default="baud_rate_generator", description="8051 Peripheral Subsystem"
    )
    crystal_frequency_mhz: float = Field(default=11.0592, description="XTAL Frequency (MHz)")
    target_baud_rate: int = Field(default=9600, description="Desired UART Baud Rate (bps)")
    smod_bit: int = Field(default=0, ge=0, le=1, description="PCON.7 SMOD Bit (0 or 1)")
    stepper_step_angle_deg: float = Field(default=1.8, description="Stepper Motor Step Angle (°)")
    stepper_rpm: float = Field(default=120.0, description="Target Motor Speed (RPM)")

class Microcontroller8051Output(BaseModel):
    subsystem_mode: str
    timer1_th1_reload_hex: str
    timer1_th1_reload_dec: int
    timer_clock_khz: float
    stepper_step_frequency_hz: float
    steps_per_revolution: int
    telemetry: Dict[str, Any]

class Microcontroller8051Engine(BaseSimulationEngine):
    name = "microcontroller-8051"
    description = "8051 Microcontroller & Embedded Lab: Port I/O, Timer PWM, Stepper Motor Interfacing & Serial UART"

    def calculate(self, params: Microcontroller8051Input) -> Microcontroller8051Output:
        f_osc = params.crystal_frequency_mhz * 1e6
        timer_clk = f_osc / 12.0  # 12 clock cycles per machine cycle

        # UART Baud Rate: Baud = (2^SMOD / 32) * (Timer1_Overflow_Rate)
        # Timer1_Overflow = (f_osc / 12) / (256 - TH1)
        scale = (2 ** params.smod_bit) / 32.0
        divisor = params.target_baud_rate / scale
        n_count = timer_clk / max(1.0, divisor)
        th1_dec = int(round(256.0 - n_count))
        th1_dec = max(0, min(255, th1_dec))
        th1_hex = f"0x{th1_dec:02X}"

        # Stepper Motor calculations
        steps_per_rev = int(round(360.0 / params.stepper_step_angle_deg))
        step_freq = (params.stepper_rpm * steps_per_rev) / 60.0

        return Microcontroller8051Output(
            subsystem_mode=params.subsystem_mode,
            timer1_th1_reload_hex=th1_hex,
            timer1_th1_reload_dec=th1_dec,
            timer_clock_khz=round(timer_clk * 1e-3, 2),
            stepper_step_frequency_hz=round(step_freq, 1),
            steps_per_revolution=steps_per_rev,
            telemetry={"th1_hex": th1_hex, "baud": params.target_baud_rate, "steps_rev": steps_per_rev}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "baud_9600": {"subsystem_mode": "baud_rate_generator", "crystal_frequency_mhz": 11.0592, "target_baud_rate": 9600, "smod_bit": 0},
            "stepper_120rpm": {"subsystem_mode": "stepper_motor_pwm", "stepper_step_angle_deg": 1.8, "stepper_rpm": 120.0}
        }


# ── 3. Switchgear & Protection Engine ────────────────────────────────────────
class SwitchgearProtectionInput(BaseModel):
    protection_scheme: Literal["idmt_overcurrent_relay", "differential_merz_price", "vcb_arc_extinction"] = Field(
        default="idmt_overcurrent_relay", description="Switchgear & Relay Test"
    )
    fault_current_a: float = Field(default=3500.0, ge=100.0, le=20000.0, description="Primary Fault Current (A)")
    ct_primary_rating_a: float = Field(default=400.0, description="CT Primary Rating (A)")
    ct_secondary_rating_a: float = Field(default=5.0, description="CT Secondary Rating (A)")
    plug_setting_multiplier_ps: float = Field(default=1.25, description="Relay Plug Setting Multiplier PS (1.25 = 125%)")
    time_multiplier_setting_tms: float = Field(default=0.5, ge=0.05, le=1.0, description="Relay TMS (0.05 to 1.0)")

class SwitchgearProtectionOutput(BaseModel):
    protection_scheme: str
    plug_setting_multiplier_psm: float
    relay_operating_time_sec: float
    ct_secondary_current_is_a: float
    circuit_breaker_status: str
    arc_interruption_medium: str
    telemetry: Dict[str, Any]

class SwitchgearProtectionEngine(BaseSimulationEngine):
    name = "switchgear-protection"
    description = "Switchgear & Protection Lab: IDMT Overcurrent Relay Characteristics, Merz-Price Differential & VCB Arc Extinction"

    def calculate(self, params: SwitchgearProtectionInput) -> SwitchgearProtectionOutput:
        # CT secondary fault current
        ct_ratio = params.ct_primary_rating_a / params.ct_secondary_rating_a
        is_a = params.fault_current_a / max(1.0, ct_ratio)

        # Relay Pick-up current = Plug Setting * CT Secondary
        i_pickup = params.plug_setting_multiplier_ps * params.ct_secondary_rating_a
        psm = is_a / max(0.1, i_pickup)

        # Standard Inverse IDMT Curve: t = (0.14 / (PSM^0.02 - 1)) * TMS
        if psm > 1.0:
            denom = (psm ** 0.02) - 1.0
            t_op = (0.14 / max(1e-4, denom)) * params.time_multiplier_setting_tms
            cb_state = "TRIP COMMAND ISSUED"
        else:
            t_op = 999.0
            cb_state = "NORMAL / NO TRIP (Current below pickup threshold)"

        return SwitchgearProtectionOutput(
            protection_scheme=params.protection_scheme,
            plug_setting_multiplier_psm=round(psm, 2),
            relay_operating_time_sec=round(min(99.0, t_op), 3),
            ct_secondary_current_is_a=round(is_a, 2),
            circuit_breaker_status=cb_state,
            arc_interruption_medium="Vacuum (10^-7 bar) / SF6 Gas (5.0 bar)",
            telemetry={"psm": round(psm, 2), "t_op": round(t_op, 3), "tms": params.time_multiplier_setting_tms}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "heavy_fault_7ka": {"protection_scheme": "idmt_overcurrent_relay", "fault_current_a": 7000.0, "time_multiplier_setting_tms": 0.5},
            "moderate_fault_3.5ka": {"protection_scheme": "idmt_overcurrent_relay", "fault_current_a": 3500.0, "time_multiplier_setting_tms": 0.5}
        }


# ── 4. Utilization, Traction, Heating & Drives Engine ────────────────────────
class ElectricTractionHeatingInput(BaseModel):
    application_domain: Literal["traction_speed_time_curve", "dielectric_induction_heating", "electric_welding"] = Field(
        default="traction_speed_time_curve", description="Utilization Domain"
    )
    max_speed_vm_kmph: float = Field(default=60.0, ge=20.0, le=160.0, description="Crest Speed Vm (km/h)")
    acceleration_alpha_kmphs: float = Field(default=1.8, ge=0.5, le=4.0, description="Acceleration α (km/h/s)")
    braking_beta_kmphs: float = Field(default=2.5, ge=0.5, le=5.0, description="Braking Retardation β (km/h/s)")
    run_distance_d_km: float = Field(default=1.5, ge=0.2, le=20.0, description="Inter-Station Distance (km)")
    train_weight_w_ton: float = Field(default=120.0, description="Train Dead Weight (Tons)")

class ElectricTractionHeatingOutput(BaseModel):
    application_domain: str
    total_run_time_t_sec: float
    acceleration_time_t1_sec: float
    free_running_time_t2_sec: float
    braking_time_t3_sec: float
    average_speed_kmph: float
    specific_energy_consumption_sec_wh_ton_km: float
    dielectric_heating_power_kw: float
    telemetry: Dict[str, Any]

class ElectricTractionHeatingEngine(BaseSimulationEngine):
    name = "electric-traction-heating"
    description = "Utilization, Traction & Heating Lab: Speed-Time Curves, Specific Energy Consumption & Dielectric Heating"

    def calculate(self, params: ElectricTractionHeatingInput) -> ElectricTractionHeatingOutput:
        vm = params.max_speed_vm_kmph
        alpha = params.acceleration_alpha_kmphs
        beta = params.braking_beta_kmphs
        dist_km = params.run_distance_d_km

        t1 = vm / alpha
        t3 = vm / beta

        # Trapezoidal Distance: D = (Vm * t1 / 7200) + (Vm * t2 / 3600) + (Vm * t3 / 7200)
        d_acc_brake = (vm / 7200.0) * (t1 + t3)
        d_free = max(0.0, dist_km - d_acc_brake)
        t2 = (d_free * 3600.0) / max(1.0, vm)
        t_total = t1 + t2 + t3

        avg_speed = (dist_km / max(1.0, t_total)) * 3600.0

        # Specific Energy Consumption SEC = (0.01072 * Vm^2 / D) * (We/W) + 0.2778 * r * (D_t/D) (Wh / Ton-km)
        sec = (0.01072 * (vm ** 2) / max(0.1, dist_km)) * 1.1 + (0.2778 * 40.0)

        # Dielectric Heating: P = 2*pi*f*C*V^2*tan(delta)
        # f = 20 MHz, C = 100 pF, V = 2 kV, tan(delta) = 0.04
        p_diel_kw = 2.0 * math.pi * (20e6) * (100e-12) * ((2000) ** 2) * 0.04 * 1e-3

        return ElectricTractionHeatingOutput(
            application_domain=params.application_domain,
            total_run_time_t_sec=round(t_total, 1),
            acceleration_time_t1_sec=round(t1, 1),
            free_running_time_t2_sec=round(t2, 1),
            braking_time_t3_sec=round(t3, 1),
            average_speed_kmph=round(avg_speed, 2),
            specific_energy_consumption_sec_wh_ton_km=round(sec, 2),
            dielectric_heating_power_kw=round(p_diel_kw, 2),
            telemetry={"t_total": round(t_total, 1), "v_avg": round(avg_speed, 1), "sec": round(sec, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "suburban_train": {"application_domain": "traction_speed_time_curve", "max_speed_vm_kmph": 60.0, "acceleration_alpha_kmphs": 1.8, "braking_beta_kmphs": 2.5, "run_distance_d_km": 1.5},
            "mainline_express": {"application_domain": "traction_speed_time_curve", "max_speed_vm_kmph": 110.0, "run_distance_d_km": 10.0}
        }


# ── 5. Illumination Engineering Engine ───────────────────────────────────────
class IlluminationEngineeringInput(BaseModel):
    illumination_task: Literal["inverse_square_lambert", "indoor_lumen_design", "polar_candela_curve"] = Field(
        default="indoor_lumen_design", description="Illumination Calculation"
    )
    room_length_m: float = Field(default=20.0, description="Room Length L (m)")
    room_width_m: float = Field(default=12.0, description="Room Width W (m)")
    target_lux_level_e: float = Field(default=300.0, description="Required Illuminance E (Lux)")
    lamp_lumen_output_f: float = Field(default=3600.0, description="Lumens per Lamp F (lm)")
    utilization_factor_uf: float = Field(default=0.6, description="Coefficient of Utilization UF")
    maintenance_factor_mf: float = Field(default=0.8, description="Maintenance Factor MF")
    source_candela_i: float = Field(default=1200.0, description="Luminous Intensity I (Candela)")
    distance_d_m: float = Field(default=3.0, description="Distance from Source d (m)")
    incidence_angle_theta_deg: float = Field(default=30.0, description="Angle of Incidence θ (°)")

class IlluminationEngineeringOutput(BaseModel):
    illumination_task: str
    required_number_of_luminaires_n: int
    illuminance_at_point_lux: float
    total_floor_area_sqm: float
    installed_lighting_power_density_w_sqm: float
    recommended_space_height_ratio: float
    telemetry: Dict[str, Any]

class IlluminationEngineeringEngine(BaseSimulationEngine):
    name = "illumination-engineering"
    description = "Illumination Engineering Lab: Inverse Square & Lambert's Cosine Laws, Indoor Lux Calculation & Polar Curves"

    def calculate(self, params: IlluminationEngineeringInput) -> IlluminationEngineeringOutput:
        area = params.room_length_m * params.room_width_m
        total_lumens_required = (params.target_lux_level_e * area) / (params.utilization_factor_uf * params.maintenance_factor_mf)
        num_lamps = int(math.ceil(total_lumens_required / max(1.0, params.lamp_lumen_output_f)))

        # Lambert's Cosine Law: E = (I * cos(theta)) / d^2
        theta_rad = math.radians(params.incidence_angle_theta_deg)
        e_point = (params.source_candela_i * math.cos(theta_rad)) / max(0.1, (params.distance_d_m ** 2))

        # Power Density (assuming 36W LED per luminaire)
        lpd = (num_lamps * 36.0) / max(1.0, area)

        return IlluminationEngineeringOutput(
            illumination_task=params.illumination_task,
            required_number_of_luminaires_n=num_lamps,
            illuminance_at_point_lux=round(e_point, 2),
            total_floor_area_sqm=round(area, 1),
            installed_lighting_power_density_w_sqm=round(lpd, 2),
            recommended_space_height_ratio=1.2,
            telemetry={"num_lamps": num_lamps, "e_lux": params.target_lux_level_e, "e_point": round(e_point, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "classroom_300lux": {"illumination_task": "indoor_lumen_design", "room_length_m": 20.0, "room_width_m": 12.0, "target_lux_level_e": 300.0, "lamp_lumen_output_f": 3600.0},
            "drawing_hall_500lux": {"illumination_task": "indoor_lumen_design", "target_lux_level_e": 500.0}
        }


# ── 6. Energy Conservation & Audit Engine ────────────────────────────────────
class EnergyAuditConservationInput(BaseModel):
    audit_focus: Literal["power_factor_correction", "motor_efficiency_optimization", "sankey_heat_balance"] = Field(
        default="power_factor_correction", description="Energy Conservation Domain"
    )
    active_load_power_p_kw: float = Field(default=250.0, ge=10.0, le=5000.0, description="Active Power P (kW)")
    existing_power_factor_cos1: float = Field(default=0.72, ge=0.5, le=0.95, description="Initial Power Factor cos φ1")
    target_power_factor_cos2: float = Field(default=0.98, ge=0.8, le=1.0, description="Target Power Factor cos φ2")
    operating_hours_per_year: float = Field(default=4000.0, description="Annual Running Hours")
    electricity_tariff_per_kwh: float = Field(default=7.50, description="Electricity Tariff (₹ / kWh)")

class EnergyAuditConservationOutput(BaseModel):
    audit_focus: str
    required_capacitor_bank_kvar: float
    initial_apparent_power_s1_kva: float
    improved_apparent_power_s2_kva: float
    annual_energy_cost_savings_inr: float
    simple_payback_period_years: float
    co2_emissions_reduction_tons: float
    telemetry: Dict[str, Any]

class EnergyAuditConservationEngine(BaseSimulationEngine):
    name = "energy-audit-conservation"
    description = "Energy Conservation & Audit Lab: Sankey Diagram, Power Factor kVAR Calculator & Motor Efficiency Optimization"

    def calculate(self, params: EnergyAuditConservationInput) -> EnergyAuditConservationOutput:
        p = params.active_load_power_p_kw
        cos1 = params.existing_power_factor_cos1
        cos2 = params.target_power_factor_cos2

        tan1 = math.tan(math.acos(cos1))
        tan2 = math.tan(math.acos(cos2))

        # Required Capacitor kVAR = P * (tan phi1 - tan phi2)
        q_cap = p * (tan1 - tan2)

        s1_kva = p / cos1
        s2_kva = p / cos2

        # kVA demand charge savings + line loss reduction (assume 4% loss reduction)
        demand_savings_kw = (s1_kva - s2_kva) * 0.04 * params.operating_hours_per_year
        annual_savings_inr = demand_savings_kw * params.electricity_tariff_per_kwh + (s1_kva - s2_kva) * 350.0 * 12.0  # ₹350/kVA/month demand

        capital_cost_inr = q_cap * 1200.0  # ₹1200 per kVAR capacitor cost
        payback_years = capital_cost_inr / max(1.0, annual_savings_inr)
        co2_tons = (demand_savings_kw * 0.85) * 1e-3

        return EnergyAuditConservationOutput(
            audit_focus=params.audit_focus,
            required_capacitor_bank_kvar=round(q_cap, 2),
            initial_apparent_power_s1_kva=round(s1_kva, 2),
            improved_apparent_power_s2_kva=round(s2_kva, 2),
            annual_energy_cost_savings_inr=round(annual_savings_inr, 2),
            simple_payback_period_years=round(payback_years, 2),
            co2_emissions_reduction_tons=round(co2_tons, 2),
            telemetry={"kvar": round(q_cap, 1), "s1_kva": round(s1_kva, 1), "s2_kva": round(s2_kva, 1), "payback": round(payback_years, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "factory_250kw": {"audit_focus": "power_factor_correction", "active_load_power_p_kw": 250.0, "existing_power_factor_cos1": 0.72, "target_power_factor_cos2": 0.98},
            "commercial_100kw": {"audit_focus": "power_factor_correction", "active_load_power_p_kw": 100.0, "existing_power_factor_cos1": 0.75, "target_power_factor_cos2": 0.99}
        }
