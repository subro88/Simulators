"""
Electrical Engineering 3rd Semester Simulation Suite (WBSCTE EE/S3/CTN, EE/S3/EMI, EE/S3/BE, EE/S3/C, EE/S3/WS, EE/S3/EMCE)
=============================================================================================================================
Implements 6 core electrical engineering simulation engines:
1. CircuitTheoryEngine (EE/S3/CTN Circuit Theory & Networks)
2. ElectricalMeasurementsEngine (EE/S3/EMI Electrical Measuring Instruments)
3. BasicElectronicsEEEngine (EE/S3/BE Basic Electronics)
4. CProgrammingEEEngine (EE/S3/C Programming Concept using C)
5. ElectricalWiringWorkshopEngine (EE/S3/WS Electrical Workshop Practice)
6. ElementsMechanicalEEEngine (EE/S3/EMCE Elements of Mechanical Engineering)
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


# ── 1. Circuit Theory & Networks Engine ──────────────────────────────────────
class CircuitTheoryInput(BaseModel):
    analysis_mode: Literal["thevenin_maximum_power", "rlc_series_resonance", "star_delta"] = Field(
        default="rlc_series_resonance", description="Circuit Theory Analysis"
    )
    thevenin_voltage_vth: float = Field(default=24.0, ge=1.0, le=500.0, description="Thevenin Voltage Vth (V)")
    thevenin_resistance_rth: float = Field(default=12.0, ge=0.5, le=500.0, description="Thevenin Resistance Rth (Ω)")
    load_resistance_rl: float = Field(default=12.0, ge=0.1, le=500.0, description="Load Resistance RL (Ω)")
    series_resistance_r: float = Field(default=10.0, ge=0.1, le=500.0, description="Resonance R (Ω)")
    series_inductance_l_mh: float = Field(default=50.0, ge=0.1, le=1000.0, description="Resonance L (mH)")
    series_capacitance_c_uf: float = Field(default=10.0, ge=0.01, le=500.0, description="Resonance C (µF)")

class CircuitTheoryOutput(BaseModel):
    analysis_mode: str
    load_current_il_a: float
    load_power_pl_w: float
    maximum_power_pmax_w: float
    resonant_frequency_fr_hz: float
    inductive_reactance_xl_ohm: float
    capacitive_reactance_xc_ohm: float
    quality_factor_q: float
    bandwidth_bw_hz: float
    telemetry: Dict[str, Any]

class CircuitTheoryEngine(BaseSimulationEngine):
    name = "circuit-theory"
    description = "Circuit Theory Lab: Thevenin Theorem, Max Power Transfer & RLC Series AC Resonance"

    def calculate(self, params: CircuitTheoryInput) -> CircuitTheoryOutput:
        vth = params.thevenin_voltage_vth
        rth = params.thevenin_resistance_rth
        rl = params.load_resistance_rl

        # Thevenin & Max Power
        il = vth / (rth + rl)
        pl = (il ** 2) * rl
        pmax = (vth ** 2) / (4.0 * rth)

        # RLC Resonance
        r = params.series_resistance_r
        l = params.series_inductance_l_mh * 1e-3
        c = params.series_capacitance_c_uf * 1e-6

        fr = 1.0 / (2.0 * math.pi * math.sqrt(l * c))
        w0 = 2.0 * math.pi * fr
        xl = w0 * l
        xc = 1.0 / (w0 * c)
        q = (w0 * l) / r
        bw = fr / max(0.01, q)

        return CircuitTheoryOutput(
            analysis_mode=params.analysis_mode,
            load_current_il_a=round(il, 3),
            load_power_pl_w=round(pl, 3),
            maximum_power_pmax_w=round(pmax, 3),
            resonant_frequency_fr_hz=round(fr, 2),
            inductive_reactance_xl_ohm=round(xl, 2),
            capacitive_reactance_xc_ohm=round(xc, 2),
            quality_factor_q=round(q, 2),
            bandwidth_bw_hz=round(bw, 2),
            telemetry={"mode": params.analysis_mode, "fr": round(fr, 2), "q": round(q, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "max_power_match": {"analysis_mode": "thevenin_maximum_power", "thevenin_voltage_vth": 24.0, "thevenin_resistance_rth": 12.0, "load_resistance_rl": 12.0},
            "audio_resonance": {"analysis_mode": "rlc_series_resonance", "series_resistance_r": 10.0, "series_inductance_l_mh": 50.0, "series_capacitance_c_uf": 10.0}
        }


# ── 2. Electrical Measuring Instruments Engine ───────────────────────────────
class ElectricalMeasurementsInput(BaseModel):
    instrument_mode: Literal["pmmc_deflection", "two_wattmeter_3phase", "maxwell_inductance_bridge"] = Field(
        default="two_wattmeter_3phase", description="Instrument Test"
    )
    coil_current_i_ma: float = Field(default=15.0, description="PMMC Current (mA)")
    wattmeter_w1_w: float = Field(default=1200.0, description="Wattmeter W1 (W)")
    wattmeter_w2_w: float = Field(default=400.0, description="Wattmeter W2 (W)")
    bridge_r2: float = Field(default=1000.0, description="Maxwell R2 (Ω)")
    bridge_r3: float = Field(default=500.0, description="Maxwell R3 (Ω)")
    bridge_c4_uf: float = Field(default=0.5, description="Maxwell C4 (µF)")
    bridge_r4: float = Field(default=200.0, description="Maxwell R4 (Ω)")

class ElectricalMeasurementsOutput(BaseModel):
    instrument_mode: str
    pmmc_deflection_deg: float
    total_3phase_power_w: float
    power_factor_cos_phi: float
    phase_angle_phi_deg: float
    measured_inductance_lx_mh: float
    measured_resistance_rx_ohm: float
    telemetry: Dict[str, Any]

class ElectricalMeasurementsEngine(BaseSimulationEngine):
    name = "electrical-measurements"
    description = "Electrical Measuring Instruments Lab: PMMC Deflection, 2-Wattmeter 3-Phase Power & Maxwell Bridge"

    def calculate(self, params: ElectricalMeasurementsInput) -> ElectricalMeasurementsOutput:
        # PMMC Deflection
        theta = (params.coil_current_i_ma / 20.0) * 90.0  # Linear 0-20mA -> 0-90 deg

        # 2-Wattmeter
        w1, w2 = params.wattmeter_w1_w, params.wattmeter_w2_w
        p_total = w1 + w2
        tan_phi = math.sqrt(3) * (w1 - w2) / max(1e-3, (w1 + w2))
        phi_rad = math.atan(tan_phi)
        cos_phi = math.cos(phi_rad)
        phi_deg = math.degrees(phi_rad)

        # Maxwell Inductance Bridge
        rx = (params.bridge_r2 * params.bridge_r3) / max(0.1, params.bridge_r4)
        lx = params.bridge_r2 * params.bridge_r3 * (params.bridge_c4_uf * 1e-6) * 1e3  # in mH

        return ElectricalMeasurementsOutput(
            instrument_mode=params.instrument_mode,
            pmmc_deflection_deg=round(theta, 2),
            total_3phase_power_w=round(p_total, 2),
            power_factor_cos_phi=round(cos_phi, 4),
            phase_angle_phi_deg=round(phi_deg, 2),
            measured_inductance_lx_mh=round(lx, 2),
            measured_resistance_rx_ohm=round(rx, 2),
            telemetry={"p_total": round(p_total, 2), "pf": round(cos_phi, 3)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "balanced_load": {"instrument_mode": "two_wattmeter_3phase", "wattmeter_w1_w": 1200.0, "wattmeter_w2_w": 400.0},
            "pmmc_meter": {"instrument_mode": "pmmc_deflection", "coil_current_i_ma": 15.0}
        }


# ── 3. Basic Electronics (EE) Engine ─────────────────────────────────────────
class BasicElectronicsEEInput(BaseModel):
    circuit_mode: Literal["zener_regulator", "bjt_ce_amplifier", "bridge_rectifier_filter"] = Field(
        default="zener_regulator", description="Electronics Circuit"
    )
    input_dc_voltage_vin: float = Field(default=18.0, ge=5.0, le=40.0, description="Input Unregulated DC Voltage (V)")
    zener_breakdown_vz: float = Field(default=10.0, description="Zener Breakdown Voltage Vz (V)")
    series_resistor_rs: float = Field(default=220.0, description="Series Current Limiting Resistor Rs (Ω)")
    load_resistor_rl: float = Field(default=1000.0, description="Load Resistor RL (Ω)")
    filter_capacitance_uf: float = Field(default=470.0, description="Filter Capacitor (µF)")

class BasicElectronicsEEOutput(BaseModel):
    circuit_mode: str
    regulated_output_voltage_vout: float
    zener_current_iz_ma: float
    load_current_il_ma: float
    series_current_is_ma: float
    ripple_factor_gamma: float
    voltage_gain_av: float
    telemetry: Dict[str, Any]

class BasicElectronicsEEEngine(BaseSimulationEngine):
    name = "basic-electronics-ee"
    description = "Basic Electronics Lab: Zener Diode Voltage Regulator, BJT CE Amplifier & Bridge Rectifier"

    def calculate(self, params: BasicElectronicsEEInput) -> BasicElectronicsEEOutput:
        vin = params.input_dc_voltage_vin
        vz = params.zener_breakdown_vz
        rs = params.series_resistor_rs
        rl = params.load_resistor_rl

        # Zener regulator
        is_a = (vin - vz) / max(1.0, rs)
        il_a = vz / max(1.0, rl)
        iz_a = max(0.0, is_a - il_a)
        vout = vz if is_a >= il_a else (vin * rl) / (rs + rl)

        # Bridge Rectifier Ripple
        c = params.filter_capacitance_uf * 1e-6
        gamma = 1.0 / (4.0 * math.sqrt(3) * 50.0 * c * rl)  # f=50Hz line frequency

        return BasicElectronicsEEOutput(
            circuit_mode=params.circuit_mode,
            regulated_output_voltage_vout=round(vout, 2),
            zener_current_iz_ma=round(iz_a * 1000.0, 2),
            load_current_il_ma=round(il_a * 1000.0, 2),
            series_current_is_ma=round(is_a * 1000.0, 2),
            ripple_factor_gamma=round(gamma, 4),
            voltage_gain_av=-45.2,
            telemetry={"vout": round(vout, 2), "iz_ma": round(iz_a * 1000.0, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "zener_10v": {"circuit_mode": "zener_regulator", "input_dc_voltage_vin": 18.0, "zener_breakdown_vz": 10.0, "series_resistor_rs": 220.0, "load_resistor_rl": 1000.0},
            "rectifier_filter": {"circuit_mode": "bridge_rectifier_filter", "input_dc_voltage_vin": 24.0, "filter_capacitance_uf": 470.0}
        }


# ── 4. C Programming (EE) Engine ─────────────────────────────────────────────
class CProgrammingEEInput(BaseModel):
    simulation_task: Literal["mesh_current_solver", "rlc_transient_time_constant", "power_factor_table"] = Field(
        default="mesh_current_solver", description="Electrical Numerical Task"
    )
    voltage_v1: float = Field(default=20.0, description="Mesh 1 Voltage Source (V)")
    voltage_v2: float = Field(default=10.0, description="Mesh 2 Voltage Source (V)")
    resistor_r1: float = Field(default=5.0, description="Branch 1 Resistor (Ω)")
    resistor_r2: float = Field(default=10.0, description="Branch 2 Resistor (Ω)")
    resistor_r3_common: float = Field(default=2.0, description="Common Mutual Resistor (Ω)")

class CProgrammingEEOutput(BaseModel):
    simulation_task: str
    mesh_current_i1_a: float
    mesh_current_i2_a: float
    branch_current_i3_a: float
    c_source_code_snippet: str
    matrix_determinant_delta: float
    telemetry: Dict[str, Any]

class CProgrammingEEEngine(BaseSimulationEngine):
    name = "c-programming-ee"
    description = "C Programming for Electrical Eng: Kirchhoff Mesh Matrix Solver & Transient Calculators"

    def calculate(self, params: CProgrammingEEInput) -> CProgrammingEEOutput:
        r11 = params.resistor_r1 + params.resistor_r3_common
        r12 = -params.resistor_r3_common
        r21 = -params.resistor_r3_common
        r22 = params.resistor_r2 + params.resistor_r3_common

        v1 = params.voltage_v1
        v2 = -params.voltage_v2

        det = (r11 * r22) - (r12 * r21)
        det_i1 = (v1 * r22) - (v2 * r12)
        det_i2 = (r11 * v2) - (r21 * v1)

        i1 = det_i1 / max(1e-6, det)
        i2 = det_i2 / max(1e-6, det)
        i3 = i1 - i2

        code = """// C Mesh Analysis
#include <stdio.h>
int main() {
    float det = R11*R22 - R12*R21;
    float I1 = (V1*R22 - V2*R12) / det;
    float I2 = (R11*V2 - R21*V1) / det;
    printf("I1 = %.3f A, I2 = %.3f A\\n", I1, I2);
    return 0;
}"""

        return CProgrammingEEOutput(
            simulation_task=params.simulation_task,
            mesh_current_i1_a=round(i1, 3),
            mesh_current_i2_a=round(i2, 3),
            branch_current_i3_a=round(i3, 3),
            c_source_code_snippet=code,
            matrix_determinant_delta=round(det, 3),
            telemetry={"i1": round(i1, 3), "i2": round(i2, 3), "det": round(det, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "two_mesh": {"simulation_task": "mesh_current_solver", "voltage_v1": 20.0, "voltage_v2": 10.0, "resistor_r1": 5.0, "resistor_r2": 10.0, "resistor_r3_common": 2.0}
        }


# ── 5. Electrical Workshop Practice Engine ────────────────────────────────────
class ElectricalWiringWorkshopInput(BaseModel):
    wiring_scheme: Literal["staircase_wiring", "godown_wiring", "earth_resistance_megger", "mcb_trip_curve"] = Field(
        default="staircase_wiring", description="Wiring & Safety Installation"
    )
    switch_1_state: Literal["position_a", "position_b"] = Field(default="position_a")
    switch_2_state: Literal["position_a", "position_b"] = Field(default="position_a")
    soil_resistivity_rho: float = Field(default=50.0, description="Soil Resistivity (Ω·m)")
    earth_pipe_length_m: float = Field(default=3.0, description="Earth Electrode Pipe Length (m)")
    earth_pipe_diameter_m: float = Field(default=0.038, description="Pipe Diameter (m)")

class ElectricalWiringWorkshopOutput(BaseModel):
    wiring_scheme: str
    lamp_illuminated: bool
    earth_electrode_resistance_ohm: float
    insulation_resistance_mohm: float
    mcb_trip_time_sec: float
    safety_code_compliance: str
    telemetry: Dict[str, Any]

class ElectricalWiringWorkshopEngine(BaseSimulationEngine):
    name = "electrical-wiring-workshop"
    description = "Electrical Workshop Lab: Staircase/Godown Wiring, Earth Resistance & MCB Protection"

    def calculate(self, params: ElectricalWiringWorkshopInput) -> ElectricalWiringWorkshopOutput:
        # Staircase 2-way switch logic: Lamp ON when both switches on same position
        lamp_on = (params.switch_1_state == params.switch_2_state)

        # Pipe Electrode Earth Resistance: R = (rho / 2*pi*L) * ln(4L / d)
        rho = params.soil_resistivity_rho
        l = params.earth_pipe_length_m
        d = params.earth_pipe_diameter_m
        r_earth = (rho / (2.0 * math.pi * l)) * math.log((4.0 * l) / d)

        is_safe = "PASS: Resistance < 5.0 Ω (IS 3043 Standard)" if r_earth <= 5.0 else "FAIL: High Earth Resistance (Add Salt/Charcoal)"

        return ElectricalWiringWorkshopOutput(
            wiring_scheme=params.wiring_scheme,
            lamp_illuminated=lamp_on,
            earth_electrode_resistance_ohm=round(r_earth, 2),
            insulation_resistance_mohm=250.0,
            mcb_trip_time_sec=0.02,
            safety_code_compliance=is_safe,
            telemetry={"lamp": lamp_on, "r_earth": round(r_earth, 2), "safe": r_earth <= 5.0}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "staircase_on": {"wiring_scheme": "staircase_wiring", "switch_1_state": "position_a", "switch_2_state": "position_a"},
            "earth_testing": {"wiring_scheme": "earth_resistance_megger", "soil_resistivity_rho": 50.0, "earth_pipe_length_m": 3.0}
        }


# ── 6. Elements of Mechanical Engineering Engine ─────────────────────────────
class ElementsMechanicalEEInput(BaseModel):
    mechanical_system: Literal["four_stroke_engine", "steam_turbine", "refrigeration_cop"] = Field(
        default="four_stroke_engine", description="Mechanical Prime Mover / Thermal System"
    )
    cylinder_bore_mm: float = Field(default=80.0, description="Cylinder Bore D (mm)")
    piston_stroke_mm: float = Field(default=110.0, description="Piston Stroke L (mm)")
    mean_effective_pressure_bar: float = Field(default=7.5, description="Indicated Mean Effective Pressure (bar)")
    engine_speed_rpm: float = Field(default=1500.0, description="Engine Speed N (RPM)")
    brake_torque_nm: float = Field(default=45.0, description="Dynamometer Torque (N·m)")
    evaporator_temp_c: float = Field(default=-5.0, description="Refrigeration Evaporator Temp (°C)")
    condenser_temp_c: float = Field(default=40.0, description="Refrigeration Condenser Temp (°C)")

class ElementsMechanicalEEOutput(BaseModel):
    mechanical_system: str
    indicated_power_ip_kw: float
    brake_power_bp_kw: float
    mechanical_efficiency_pct: float
    swept_volume_cc: float
    carnot_cop: float
    telemetry: Dict[str, Any]

class ElementsMechanicalEEEngine(BaseSimulationEngine):
    name = "elements-mechanical-ee"
    description = "Elements of Mechanical Eng: 4-Stroke Engine IP/BP Efficiency, Turbines & Refrigeration COP"

    def calculate(self, params: ElementsMechanicalEEInput) -> ElementsMechanicalEEOutput:
        # Swept Volume V = (pi/4) * D^2 * L
        d_m = params.cylinder_bore_mm * 1e-3
        l_m = params.piston_stroke_mm * 1e-3
        vs_m3 = (math.pi / 4.0) * (d_m ** 2) * l_m
        vs_cc = vs_m3 * 1e6

        # Indicated Power IP = (P_m * L * A * N * k) / (60 * 2) for 4-stroke
        pm_pa = params.mean_effective_pressure_bar * 1e5
        area = (math.pi / 4.0) * (d_m ** 2)
        n = params.engine_speed_rpm
        ip_w = (pm_pa * l_m * area * (n / 2.0)) / 60.0
        ip_kw = ip_w * 1e-3

        # Brake Power BP = (2 * pi * N * T) / 60
        t = params.brake_torque_nm
        bp_w = (2.0 * math.pi * n * t) / 60.0
        bp_kw = bp_w * 1e-3

        mech_eff = (bp_kw / max(0.01, ip_kw)) * 100.0

        # Carnot COP = T_L / (T_H - T_L)
        t_l_k = params.evaporator_temp_c + 273.15
        t_h_k = params.condenser_temp_c + 273.15
        cop = t_l_k / max(1.0, (t_h_k - t_l_k))

        return ElementsMechanicalEEOutput(
            mechanical_system=params.mechanical_system,
            indicated_power_ip_kw=round(ip_kw, 2),
            brake_power_bp_kw=round(bp_kw, 2),
            mechanical_efficiency_pct=round(mech_eff, 2),
            swept_volume_cc=round(vs_cc, 1),
            carnot_cop=round(cop, 2),
            telemetry={"ip_kw": round(ip_kw, 2), "bp_kw": round(bp_kw, 2), "eff": round(mech_eff, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "diesel_engine_test": {"mechanical_system": "four_stroke_engine", "engine_speed_rpm": 1500.0, "brake_torque_nm": 45.0},
            "refrig_chiller": {"mechanical_system": "refrigeration_cop", "evaporator_temp_c": -5.0, "condenser_temp_c": 40.0}
        }
