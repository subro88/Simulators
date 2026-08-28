"""
WBSCTE Electronics & Telecommunication Engineering (ETCE) 6th Semester Physics Engines
========================================================================================
Syllabus Mapped:
1. ETCE/ACE/S6:  OpticalFiberLinkAttenuationEngine
2. ETCE/ACE/S6:  SatelliteLinkBudgetLookAnglesEngine
3. ETCE/ACE/S6:  CellularFrequencyReuseHandoffEngine
4. ETCE/IC/S6:   LVDTDisplacementTransducerEngine
5. ETCE/IC/S6:   StrainGaugeWheatstoneBridgeEngine
6. ETCE/IC/S6:   RTDThermocouplePyrometerEngine
7. ETCE/IC/S6:   SecondOrderSystemTransientResponseEngine
8. ETCE/IC/S6:   RouthHurwitzStabilityCriterionEngine
9. ETCE/IE2/S6:  DielectricInductionHeatingEngine
10. ETCE/IE2/S6: PLCLadderLogicSimulatorEngine
11. ETCE/IE2/S6: UltrasonicFlawDetectorNDTEngine
12. ETCE/MED/S6: ECGBiopotentialInstrumentationEngine
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Optical Fiber Link Attenuation Engine ────────────────────────────────
class OpticalFiberLinkAttenuationInput(BaseModel):
    core_refractive_index_n1: float = Field(default=1.48, ge=1.40, le=1.60)
    cladding_refractive_index_n2: float = Field(default=1.46, ge=1.35, le=1.55)
    core_radius_a_um: float = Field(default=25.0, ge=4.0, le=50.0)
    operating_wavelength_nm: float = Field(default=1310.0, ge=800.0, le=1650.0)
    fiber_length_km: float = Field(default=15.0, ge=0.5, le=100.0)
    input_optical_power_mw: float = Field(default=2.0, ge=0.1, le=50.0)


class OpticalFiberLinkAttenuationOutput(BaseModel):
    numerical_aperture_na: float
    acceptance_angle_deg: float
    normalized_frequency_v_number: float
    total_fiber_link_loss_db: float
    received_optical_power_mw: float
    received_optical_power_dbm: float
    fiber_mode_type: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class OpticalFiberLinkAttenuationEngine(BaseSimulationEngine):
    name = "optical-fiber-link-attenuation"
    description = "ETCE/ACE/S6: Optical Fiber Communication — Numerical Aperture NA, V-Number, Acceptance Angle & Link Loss"

    def calculate(self, params: OpticalFiberLinkAttenuationInput) -> OpticalFiberLinkAttenuationOutput:
        n1 = params.core_refractive_index_n1
        n2 = params.cladding_refractive_index_n2
        a_um = params.core_radius_a_um
        lam_um = params.operating_wavelength_nm / 1000.0
        l_km = params.fiber_length_km
        pin_mw = params.input_optical_power_mw

        # NA = sqrt(n1^2 - n2^2)
        na = math.sqrt(max(0.0001, n1**2 - n2**2))
        theta_acc_deg = math.degrees(math.asin(min(1.0, na)))

        # V = (2 * pi * a / lambda) * NA
        v_num = (2.0 * math.pi * a_um / lam_um) * na
        mode_type = "SINGLE-MODE FIBER (SMF)" if v_num < 2.405 else "MULTI-MODE FIBER (MMF)"

        # Attenuation rate ~ 0.35 dB/km at 1310nm, 0.20 dB/km at 1550nm
        alpha_db_km = 0.35 if params.operating_wavelength_nm < 1400 else 0.20
        total_loss_db = alpha_db_km * l_km

        pout_mw = pin_mw * math.pow(10.0, -total_loss_db / 10.0)
        pout_dbm = 10.0 * math.log10(max(1e-9, pout_mw))

        telemetry = {
            "na": round(na, 4),
            "theta_deg": round(theta_acc_deg, 2),
            "v_num": round(v_num, 2),
            "loss_db": round(total_loss_db, 2),
            "pout_mw": round(pout_mw, 4),
            "pout_dbm": round(pout_dbm, 2)
        }

        return OpticalFiberLinkAttenuationOutput(
            numerical_aperture_na=round(na, 4),
            acceptance_angle_deg=round(theta_acc_deg, 2),
            normalized_frequency_v_number=round(v_num, 2),
            total_fiber_link_loss_db=round(total_loss_db, 2),
            received_optical_power_mw=round(pout_mw, 4),
            received_optical_power_dbm=round(pout_dbm, 2),
            fiber_mode_type=mode_type,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_multimode_50um": {"core_refractive_index_n1": 1.48, "cladding_refractive_index_n2": 1.46, "core_radius_a_um": 25.0, "operating_wavelength_nm": 1310.0, "fiber_length_km": 15.0, "input_optical_power_mw": 2.0},
            "single_mode_long_haul": {"core_refractive_index_n1": 1.465, "cladding_refractive_index_n2": 1.460, "core_radius_a_um": 4.5, "operating_wavelength_nm": 1550.0, "fiber_length_km": 50.0, "input_optical_power_mw": 5.0}
        }


# ── 2. Satellite Link Budget & Look Angles Engine ───────────────────────────
class SatelliteLinkBudgetLookAnglesInput(BaseModel):
    earth_station_lat_deg: float = Field(default=22.5, ge=-80.0, le=80.0)
    earth_station_lon_deg: float = Field(default=88.36, ge=-180.0, le=180.0)
    satellite_lon_deg: float = Field(default=83.0, ge=-180.0, le=180.0)
    uplink_frequency_ghz: float = Field(default=14.0, ge=1.0, le=30.0)
    transmitter_eirp_dbw: float = Field(default=55.0, ge=20.0, le=80.0)
    earth_station_g_over_t_db_k: float = Field(default=28.0, ge=5.0, le=45.0)


class SatelliteLinkBudgetLookAnglesOutput(BaseModel):
    azimuth_angle_deg: float
    elevation_angle_deg: float
    slant_range_path_km: float
    free_space_path_loss_db: float
    carrier_to_noise_density_c_n0_dbhz: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SatelliteLinkBudgetLookAnglesEngine(BaseSimulationEngine):
    name = "satellite-link-budget-look-angles"
    description = "ETCE/ACE/S6: Satellite Communications — Geostationary Look Angles (Az/El) & Link Budget C/N0"

    def calculate(self, params: SatelliteLinkBudgetLookAnglesInput) -> SatelliteLinkBudgetLookAnglesOutput:
        lat_rad = math.radians(params.earth_station_lat_deg)
        d_lon_rad = math.radians(params.satellite_lon_deg - params.earth_station_lon_deg)
        re = 6378.0
        rs = 42164.0

        # Slant range d = sqrt(Re^2 + Rs^2 - 2*Re*Rs*cos(lat)*cos(d_lon))
        cos_gamma = math.cos(lat_rad) * math.cos(d_lon_rad)
        d_km = math.sqrt(re**2 + rs**2 - 2.0 * re * rs * cos_gamma)

        # Elevation angle = arctan( (cos(gamma) - Re/Rs) / sin(gamma) )
        sin_gamma = math.sqrt(max(0.0001, 1.0 - cos_gamma**2))
        el_rad = math.atan((cos_gamma - (re / rs)) / sin_gamma)
        el_deg = math.degrees(el_rad)

        # Azimuth angle
        alpha_rad = math.atan(math.tan(abs(d_lon_rad)) / math.sin(abs(lat_rad)))
        az_deg = 180.0 + math.degrees(alpha_rad) if (params.satellite_lon_deg > params.earth_station_lon_deg) else 180.0 - math.degrees(alpha_rad)

        # Path loss Lfs = 20*log10(f_GHz) + 20*log10(d_km) + 92.45
        l_fs_db = 20.0 * math.log10(params.uplink_frequency_ghz) + 20.0 * math.log10(d_km) + 92.45

        # C/N0 = EIRP - Lfs + G/T - k_dBW (k = -228.6 dBW/K/Hz)
        k_boltzmann = -228.6
        c_n0 = params.transmitter_eirp_dbw - l_fs_db + params.earth_station_g_over_t_db_k - k_boltzmann

        telemetry = {
            "az_deg": round(az_deg, 1),
            "el_deg": round(el_deg, 1),
            "d_km": round(d_km, 1),
            "lfs_db": round(l_fs_db, 2),
            "cn0_db": round(c_n0, 2)
        }

        return SatelliteLinkBudgetLookAnglesOutput(
            azimuth_angle_deg=round(az_deg, 1),
            elevation_angle_deg=round(el_deg, 1),
            slant_range_path_km=round(d_km, 1),
            free_space_path_loss_db=round(l_fs_db, 2),
            carrier_to_noise_density_c_n0_dbhz=round(c_n0, 2),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "kolkata_insat_4a": {"earth_station_lat_deg": 22.5, "earth_station_lon_deg": 88.36, "satellite_lon_deg": 83.0, "uplink_frequency_ghz": 14.0, "transmitter_eirp_dbw": 55.0, "earth_station_g_over_t_db_k": 28.0},
            "delhi_gsat_ku_band": {"earth_station_lat_deg": 28.6, "earth_station_lon_deg": 77.2, "satellite_lon_deg": 93.5, "uplink_frequency_ghz": 14.0, "transmitter_eirp_dbw": 58.0, "earth_station_g_over_t_db_k": 30.0}
        }


# ── 3. Cellular Frequency Reuse & Handoff Engine ───────────────────────────
class CellularFrequencyReuseHandoffInput(BaseModel):
    cluster_size_k: int = Field(default=7, ge=1, le=19)
    path_loss_exponent_gamma: float = Field(default=4.0, ge=2.0, le=5.0)
    cell_radius_r_km: float = Field(default=2.0, ge=0.5, le=10.0)
    total_available_channels: int = Field(default=350, ge=50, le=1000)
    traffic_load_erlangs: float = Field(default=45.0, ge=1.0, le=200.0)


class CellularFrequencyReuseHandoffOutput(BaseModel):
    co_channel_reuse_ratio_q: float
    co_channel_distance_d_km: float
    signal_to_interference_ratio_sir_db: float
    channels_per_cell: int
    sir_compliance_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class CellularFrequencyReuseHandoffEngine(BaseSimulationEngine):
    name = "cellular-frequency-reuse-handoff"
    description = "ETCE/ACE/S6: Cellular Mobile Communications — Cluster Size K, Co-Channel S/I, Reuse Distance & Erlang Traffic"

    def calculate(self, params: CellularFrequencyReuseHandoffInput) -> CellularFrequencyReuseHandoffOutput:
        k = params.cluster_size_k
        gamma = params.path_loss_exponent_gamma
        r_km = params.cell_radius_r_km

        # Q = sqrt(3K)
        q = math.sqrt(3.0 * k)
        d_km = q * r_km

        # S/I = (sqrt(3K))^gamma / 6
        sir_lin = (q ** gamma) / 6.0
        sir_db = 10.0 * math.log10(max(1.0, sir_lin))

        ch_per_cell = params.total_available_channels // k
        status = "COMPLIANT (S/I >= 18 dB Standard)" if sir_db >= 18.0 else "NON-COMPLIANT (Severe Co-Channel Interference)"

        telemetry = {
            "q": round(q, 2),
            "d_km": round(d_km, 2),
            "sir_db": round(sir_db, 2),
            "ch_cell": ch_per_cell,
            "status": status
        }

        return CellularFrequencyReuseHandoffOutput(
            co_channel_reuse_ratio_q=round(q, 2),
            co_channel_distance_d_km=round(d_km, 2),
            signal_to_interference_ratio_sir_db=round(sir_db, 2),
            channels_per_cell=ch_per_cell,
            sir_compliance_status=status,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "cluster_k7_standard": {"cluster_size_k": 7, "path_loss_exponent_gamma": 4.0, "cell_radius_r_km": 2.0, "total_available_channels": 350, "traffic_load_erlangs": 45.0},
            "cluster_k4_dense_urban": {"cluster_size_k": 4, "path_loss_exponent_gamma": 4.0, "cell_radius_r_km": 1.0, "total_available_channels": 400, "traffic_load_erlangs": 70.0}
        }


# ── 4. LVDT Displacement Transducer Engine ──────────────────────────────────
class LVDTDisplacementTransducerInput(BaseModel):
    core_displacement_mm: float = Field(default=2.5, ge=-10.0, le=10.0)
    primary_excitation_vrms_v: float = Field(default=5.0, ge=1.0, le=20.0)
    excitation_frequency_khz: float = Field(default=2.5, ge=0.5, le=10.0)
    sensitivity_mv_per_mm: float = Field(default=40.0, ge=5.0, le=200.0)
    residual_null_voltage_mv: float = Field(default=5.0, ge=0.1, le=50.0)


class LVDTDisplacementTransducerOutput(BaseModel):
    differential_secondary_output_vrms_mv: float
    output_phase_angle_deg: float
    core_direction_polarity: str
    non_linearity_percentage: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class LVDTDisplacementTransducerEngine(BaseSimulationEngine):
    name = "lvdt-displacement-transducer"
    description = "ETCE/IC/S6: Industrial Transducers — Linear Variable Differential Transformer (LVDT) Output & Phase Reversal"

    def calculate(self, params: LVDTDisplacementTransducerInput) -> LVDTDisplacementTransducerOutput:
        x = params.core_displacement_mm
        sens = params.sensitivity_mv_per_mm
        v_null = params.residual_null_voltage_mv

        vout_mv = math.sqrt((sens * abs(x))**2 + v_null**2)
        phase = 0.0 if x >= 0 else 180.0
        polarity = "FORWARD (In-Phase 0°)" if x >= 0 else "REVERSE (Phase-Inverted 180°)"

        telemetry = {
            "x_mm": x,
            "vout_mv": round(vout_mv, 2),
            "phase": phase,
            "pol": polarity
        }

        return LVDTDisplacementTransducerOutput(
            differential_secondary_output_vrms_mv=round(vout_mv, 2),
            output_phase_angle_deg=phase,
            core_direction_polarity=polarity,
            non_linearity_percentage=0.15,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "lvdt_positive_2_5mm": {"core_displacement_mm": 2.5, "primary_excitation_vrms_v": 5.0, "excitation_frequency_khz": 2.5, "sensitivity_mv_per_mm": 40.0, "residual_null_voltage_mv": 5.0},
            "lvdt_negative_3mm": {"core_displacement_mm": -3.0, "primary_excitation_vrms_v": 5.0, "excitation_frequency_khz": 2.5, "sensitivity_mv_per_mm": 40.0, "residual_null_voltage_mv": 5.0}
        }


# ── 5. Strain Gauge & Wheatstone Bridge Engine ──────────────────────────────
class StrainGaugeWheatstoneBridgeInput(BaseModel):
    applied_mechanical_strain_microstrain: float = Field(default=500.0, ge=10.0, le=5000.0)
    gauge_factor_gf: float = Field(default=2.1, ge=1.5, le=4.0)
    bridge_configuration: Literal["Quarter Bridge (1 Active Gauge)", "Half Bridge (2 Active Gauges - Tension/Compression)", "Full Bridge (4 Active Gauges)"] = "Quarter Bridge (1 Active Gauge)"
    bridge_excitation_voltage_v: float = Field(default=10.0, ge=1.0, le=24.0)
    nominal_gauge_resistance_ohm: float = Field(default=120.0, ge=50.0, le=1000.0)


class StrainGaugeWheatstoneBridgeOutput(BaseModel):
    fractional_resistance_change_pct: float
    bridge_output_voltage_mv: float
    strain_measurement_resolution_ue: float
    temperature_compensation_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class StrainGaugeWheatstoneBridgeEngine(BaseSimulationEngine):
    name = "strain-gauge-wheatstone-bridge"
    description = "ETCE/IC/S6: Resistive Transducers — Foil Strain Gauge, Gauge Factor GF & Wheatstone Bridge Conditioning"

    def calculate(self, params: StrainGaugeWheatstoneBridgeInput) -> StrainGaugeWheatstoneBridgeOutput:
        eps = params.applied_mechanical_strain_microstrain * 1e-6
        gf = params.gauge_factor_gf
        vs = params.bridge_excitation_voltage_v

        # delta_R / R = GF * epsilon
        delta_r_ratio = gf * eps
        pct_dr = delta_r_ratio * 100.0

        if params.bridge_configuration == "Quarter Bridge (1 Active Gauge)":
            vo = (vs / 4.0) * delta_r_ratio
            comp = "UNCOMPENSATED (Susceptible to Thermal Drift)"
        elif params.bridge_configuration == "Half Bridge (2 Active Gauges - Tension/Compression)":
            vo = (vs / 2.0) * delta_r_ratio
            comp = "TEMPERATURE COMPENSATED (Differential Adjacent Arms)"
        else:  # Full Bridge
            vo = vs * delta_r_ratio
            comp = "FULLY COMPENSATED & 4x SENSITIVITY"

        vo_mv = vo * 1000.0

        telemetry = {
            "dr_pct": round(pct_dr, 4),
            "vo_mv": round(vo_mv, 3),
            "comp": comp
        }

        return StrainGaugeWheatstoneBridgeOutput(
            fractional_resistance_change_pct=round(pct_dr, 4),
            bridge_output_voltage_mv=round(vo_mv, 3),
            strain_measurement_resolution_ue=1.0,
            temperature_compensation_status=comp,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "quarter_bridge_500ue": {"applied_mechanical_strain_microstrain": 500.0, "gauge_factor_gf": 2.1, "bridge_configuration": "Quarter Bridge (1 Active Gauge)", "bridge_excitation_voltage_v": 10.0, "nominal_gauge_resistance_ohm": 120.0},
            "full_bridge_cantilever": {"applied_mechanical_strain_microstrain": 1000.0, "gauge_factor_gf": 2.1, "bridge_configuration": "Full Bridge (4 Active Gauges)", "bridge_excitation_voltage_v": 10.0, "nominal_gauge_resistance_ohm": 350.0}
        }


# ── 6. RTD, Thermocouple & Pyrometer Engine ─────────────────────────────────
class RTDThermocouplePyrometerInput(BaseModel):
    measured_temperature_degc: float = Field(default=150.0, ge=-200.0, le=1200.0)
    sensor_type: Literal["Pt100 RTD (Platinum resistance: R0 = 100Ω)", "Type-K Thermocouple (Chromel-Alumel)", "Optical Radiation Pyrometer"] = "Pt100 RTD (Platinum resistance: R0 = 100Ω)"
    rtd_ice_point_r0_ohm: float = Field(default=100.0, ge=50.0, le=1000.0)
    thermocouple_cold_junction_degc: float = Field(default=25.0, ge=0.0, le=50.0)


class RTDThermocouplePyrometerOutput(BaseModel):
    sensor_electrical_output: str
    sensitivity_alpha_or_seebeck: str
    measurement_linearity_status: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RTDThermocouplePyrometerEngine(BaseSimulationEngine):
    name = "rtd-thermocouple-pyrometer"
    description = "ETCE/IC/S6: Temperature Sensors — Pt100 RTD Callendar-Van Dusen Equation & Type-K Thermocouple Seebeck Effect"

    def calculate(self, params: RTDThermocouplePyrometerInput) -> RTDThermocouplePyrometerOutput:
        t = params.measured_temperature_degc

        if params.sensor_type == "Pt100 RTD (Platinum resistance: R0 = 100Ω)":
            r0 = params.rtd_ice_point_r0_ohm
            # Callendar-Van Dusen: Rt = R0 * (1 + A*T + B*T^2)
            a = 3.9083e-3
            b = -5.775e-7
            rt = r0 * (1.0 + a * t + b * (t**2))
            out_str = f"{rt:.2f} Ω Resistance"
            sens_str = "0.385 Ω / °C (alpha = 0.00385)"
            lin = "HIGH LINEARITY (Class-A IEC 60751 Standard)"
        elif params.sensor_type == "Type-K Thermocouple (Chromel-Alumel)":
            t_cj = params.thermocouple_cold_junction_degc
            emf_mv = 41.27e-3 * (t - t_cj)
            out_str = f"{emf_mv:.3f} mV Thermoelectric EMF"
            sens_str = "41.27 µV / °C Seebeck Coefficient"
            lin = "MODERATE LINEARITY (Requires Polynomial Cold-Junction Compensation)"
        else:  # Optical Pyrometer
            tk = t + 273.15
            rad_w_m2 = 5.67e-8 * (tk**4)
            out_str = f"{rad_w_m2:.1f} W/m² Stefan-Boltzmann Flux"
            sens_str = "T^4 Radiation Proportionality"
            lin = "NON-LINEAR (Non-Contact Infrared Pyrometry)"

        telemetry = {
            "t_degc": t,
            "out": out_str,
            "sens": sens_str
        }

        return RTDThermocouplePyrometerOutput(
            sensor_electrical_output=out_str,
            sensitivity_alpha_or_seebeck=sens_str,
            measurement_linearity_status=lin,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "pt100_150degc": {"measured_temperature_degc": 150.0, "sensor_type": "Pt100 RTD (Platinum resistance: R0 = 100Ω)", "rtd_ice_point_r0_ohm": 100.0, "thermocouple_cold_junction_degc": 25.0},
            "type_k_furnace_500degc": {"measured_temperature_degc": 500.0, "sensor_type": "Type-K Thermocouple (Chromel-Alumel)", "rtd_ice_point_r0_ohm": 100.0, "thermocouple_cold_junction_degc": 25.0}
        }


# ── 7. Second-Order System Transient Response Engine ────────────────────────
class SecondOrderSystemTransientResponseInput(BaseModel):
    natural_frequency_wn_rads: float = Field(default=5.0, ge=1.0, le=50.0)
    damping_ratio_zeta: float = Field(default=0.5, ge=0.0, le=2.0)
    step_input_magnitude: float = Field(default=1.0, ge=0.5, le=10.0)


class SecondOrderSystemTransientResponseOutput(BaseModel):
    damped_frequency_wd_rads: float
    percentage_peak_overshoot_pct: float
    peak_time_tp_s: float
    settling_time_2pct_ts_s: float
    rise_time_tr_s: float
    system_damping_type: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class SecondOrderSystemTransientResponseEngine(BaseSimulationEngine):
    name = "second-order-system-transient-response"
    description = "ETCE/IC/S6: Control Engineering — Second-Order System Step Response, Damping Ratio zeta, %OS & Settling Time ts"

    def calculate(self, params: SecondOrderSystemTransientResponseInput) -> SecondOrderSystemTransientResponseOutput:
        wn = params.natural_frequency_wn_rads
        zeta = params.damping_ratio_zeta

        if zeta < 1.0:
            wd = wn * math.sqrt(1.0 - zeta**2)
            os_pct = math.exp(- (zeta * math.pi) / math.sqrt(1.0 - zeta**2)) * 100.0
            tp = math.pi / wd
            ts = 4.0 / (zeta * wn)
            tr = (math.pi - math.atan(math.sqrt(1.0 - zeta**2) / max(0.001, zeta))) / wd
            damp_type = "UNDERDAMPED (Oscillatory Transient Response)"
        elif abs(zeta - 1.0) < 1e-4:
            wd = 0.0
            os_pct = 0.0
            tp = 0.0
            ts = 4.75 / wn
            tr = 3.36 / wn
            damp_type = "CRITICALLY DAMPED (Fastest Non-Oscillatory Response)"
        else:
            wd = 0.0
            os_pct = 0.0
            tp = 0.0
            ts = (zeta + math.sqrt(zeta**2 - 1.0)) * (4.0 / wn)
            tr = 5.0 / wn
            damp_type = "OVERDAMPED (Sluggish Exponential Response)"

        telemetry = {
            "wd": round(wd, 2),
            "os_pct": round(os_pct, 1),
            "tp_s": round(tp, 3),
            "ts_s": round(ts, 3),
            "tr_s": round(tr, 3),
            "type": damp_type
        }

        return SecondOrderSystemTransientResponseOutput(
            damped_frequency_wd_rads=round(wd, 2),
            percentage_peak_overshoot_pct=round(os_pct, 1),
            peak_time_tp_s=round(tp, 3),
            settling_time_2pct_ts_s=round(ts, 3),
            rise_time_tr_s=round(tr, 3),
            system_damping_type=damp_type,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "standard_underdamped_zeta05": {"natural_frequency_wn_rads": 5.0, "damping_ratio_zeta": 0.5, "step_input_magnitude": 1.0},
            "critically_damped_zeta1": {"natural_frequency_wn_rads": 5.0, "damping_ratio_zeta": 1.0, "step_input_magnitude": 1.0}
        }


# ── 8. Routh-Hurwitz Stability Criterion Engine ─────────────────────────────
class RouthHurwitzStabilityCriterionInput(BaseModel):
    coeff_a3: float = Field(default=1.0, ge=0.1, le=100.0)
    coeff_a2: float = Field(default=6.0, ge=-100.0, le=100.0)
    coeff_a1: float = Field(default=11.0, ge=-100.0, le=100.0)
    coeff_a0: float = Field(default=6.0, ge=-100.0, le=100.0)


class RouthHurwitzStabilityCriterionOutput(BaseModel):
    routh_array_first_column: List[float]
    sign_changes_count_rhp_poles: int
    system_stability_verdict: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class RouthHurwitzStabilityCriterionEngine(BaseSimulationEngine):
    name = "routh-hurwitz-stability-criterion"
    description = "ETCE/IC/S6: Control Systems — Routh-Hurwitz Stability Array & Right-Half Plane Roots Determination"

    def calculate(self, params: RouthHurwitzStabilityCriterionInput) -> RouthHurwitzStabilityCriterionOutput:
        a3 = params.coeff_a3
        a2 = params.coeff_a2
        a1 = params.coeff_a1
        a0 = params.coeff_a0

        # Routh array:
        # s3: a3, a1
        # s2: a2, a0
        # s1: b1 = (a2*a1 - a3*a0) / a2
        # s0: c1 = a0
        if abs(a2) > 1e-6:
            b1 = (a2 * a1 - a3 * a0) / a2
        else:
            b1 = 0.001

        col1 = [a3, a2, b1, a0]
        sign_changes = 0
        for i in range(len(col1) - 1):
            if (col1[i] > 0 and col1[i+1] < 0) or (col1[i] < 0 and col1[i+1] > 0):
                sign_changes += 1

        if sign_changes == 0 and all(x > 0 for x in col1):
            verdict = "STABLE (All Closed-Loop Poles in Left Half Plane)"
        else:
            verdict = f"UNSTABLE ({sign_changes} Poles in Right Half Plane)"

        telemetry = {
            "col1": [round(x, 2) for x in col1],
            "signs": sign_changes,
            "verdict": verdict
        }

        return RouthHurwitzStabilityCriterionOutput(
            routh_array_first_column=[round(x, 2) for x in col1],
            sign_changes_count_rhp_poles=sign_changes,
            system_stability_verdict=verdict,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "stable_cubic_system": {"coeff_a3": 1.0, "coeff_a2": 6.0, "coeff_a1": 11.0, "coeff_a0": 6.0},
            "unstable_system": {"coeff_a3": 1.0, "coeff_a2": 2.0, "coeff_a1": 1.0, "coeff_a0": 8.0}
        }


# ── 9. Dielectric & Induction Heating Engine ────────────────────────────────
class DielectricInductionHeatingInput(BaseModel):
    heating_process: Literal["Dielectric Heating (Insulators / Plastics / Wood)", "Induction Heating (Conductive Steel Billets)"] = "Dielectric Heating (Insulators / Plastics / Wood)"
    rf_generator_freq_mhz: float = Field(default=27.12, ge=0.01, le=100.0)
    rf_voltage_vrms_v: float = Field(default=3000.0, ge=500.0, le=10000.0)
    dielectric_constant_er: float = Field(default=4.2, ge=1.0, le=20.0)
    loss_tangent_tan_delta: float = Field(default=0.035, ge=0.001, le=0.2)
    steel_resistivity_ohm_m: float = Field(default=1.5e-7, ge=1e-8, le=1e-5)


class DielectricInductionHeatingOutput(BaseModel):
    thermal_power_generated_watts: float
    heating_skin_depth_mm: float
    volumetric_heat_density_w_cm3: float
    industrial_application_domain: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class DielectricInductionHeatingEngine(BaseSimulationEngine):
    name = "dielectric-induction-heating"
    description = "ETCE/IE2/S6: Industrial Heating — Dielectric Plastic Welding (P = 2pi f C V^2 tan(delta)) & Induction Surface Hardening"

    def calculate(self, params: DielectricInductionHeatingInput) -> DielectricInductionHeatingOutput:
        f_hz = params.rf_generator_freq_mhz * 1e6
        v = params.rf_voltage_vrms_v

        if params.heating_process == "Dielectric Heating (Insulators / Plastics / Wood)":
            c_f = 100e-12  # 100 pF fixture capacitance
            tan_d = params.loss_tangent_tan_delta
            # P = 2 * pi * f * C * V^2 * tan(delta)
            p_watts = 2.0 * math.pi * f_hz * c_f * (v**2) * tan_d
            skin_mm = 0.0
            app = "High-Frequency Preheating of Thermosetting Plastics, Plywood Gluing & Medical Diathermy"
        else:  # Induction Heating
            # delta = sqrt(rho / (pi * f * mu))
            mu = 4.0 * math.pi * 1e-7 * 100.0  # Relative permeability 100
            skin_m = math.sqrt(params.steel_resistivity_ohm_m / (math.pi * f_hz * mu))
            skin_mm = skin_m * 1000.0
            p_watts = 15000.0
            app = "Surface Hardening of Steel Gears, Billet Forging & Induction Furnace Smelting"

        vol_dens = p_watts / 250.0  # W / cm3

        telemetry = {
            "p_w": round(p_watts, 1),
            "skin_mm": round(skin_mm, 3),
            "app": app
        }

        return DielectricInductionHeatingOutput(
            thermal_power_generated_watts=round(p_watts, 1),
            heating_skin_depth_mm=round(skin_mm, 3),
            volumetric_heat_density_w_cm3=round(vol_dens, 2),
            industrial_application_domain=app,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "plastic_welding_27mhz": {"heating_process": "Dielectric Heating (Insulators / Plastics / Wood)", "rf_generator_freq_mhz": 27.12, "rf_voltage_vrms_v": 3000.0, "dielectric_constant_er": 4.2, "loss_tangent_tan_delta": 0.035, "steel_resistivity_ohm_m": 1.5e-7},
            "steel_surface_hardening": {"heating_process": "Induction Heating (Conductive Steel Billets)", "rf_generator_freq_mhz": 0.45, "rf_voltage_vrms_v": 1000.0, "dielectric_constant_er": 1.0, "loss_tangent_tan_delta": 0.01, "steel_resistivity_ohm_m": 1.5e-7}
        }


# ── 10. PLC Ladder Logic Simulator Engine ───────────────────────────────────
class PLCLadderLogicSimulatorInput(BaseModel):
    start_pushbutton_i0: bool = Field(default=True)
    stop_pushbutton_i1: bool = Field(default=False)
    thermal_overload_i2: bool = Field(default=False)
    timer_preset_seconds: float = Field(default=5.0, ge=1.0, le=60.0)
    program_rung_selection: Literal["Star-Delta Motor Starter Rung", "Conveyor Sequence Logic"] = "Star-Delta Motor Starter Rung"


class PLCLadderLogicSimulatorOutput(BaseModel):
    main_contactor_q0_state: bool
    star_contactor_q1_state: bool
    delta_contactor_q2_state: bool
    timer_done_bit_t0_dn: bool
    plc_scan_cycle_time_ms: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class PLCLadderLogicSimulatorEngine(BaseSimulationEngine):
    name = "plc-ladder-logic-simulator"
    description = "ETCE/IE2/S6: Industrial Automation — PLC Ladder Diagram Rung Scanning, Timers & Motor Starter Control"

    def calculate(self, params: PLCLadderLogicSimulatorInput) -> PLCLadderLogicSimulatorOutput:
        i0 = params.start_pushbutton_i0
        i1 = params.stop_pushbutton_i1
        i2 = params.thermal_overload_i2

        # Main contactor Q0 = (I0 or Q0) and not I1 and not I2
        q0 = i0 and (not i1) and (not i2)
        t0_dn = q0  # After timer expires
        q1 = q0 and (not t0_dn)  # Star contactor
        q2 = q0 and t0_dn         # Delta contactor

        telemetry = {
            "q0": q0,
            "q1": q1,
            "q2": q2,
            "t0_dn": t0_dn
        }

        return PLCLadderLogicSimulatorOutput(
            main_contactor_q0_state=q0,
            star_contactor_q1_state=q1,
            delta_contactor_q2_state=q2,
            timer_done_bit_t0_dn=t0_dn,
            plc_scan_cycle_time_ms=2.5,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "motor_running_delta": {"start_pushbutton_i0": True, "stop_pushbutton_i1": False, "thermal_overload_i2": False, "timer_preset_seconds": 5.0, "program_rung_selection": "Star-Delta Motor Starter Rung"},
            "emergency_stop_triggered": {"start_pushbutton_i0": True, "stop_pushbutton_i1": True, "thermal_overload_i2": False, "timer_preset_seconds": 5.0, "program_rung_selection": "Star-Delta Motor Starter Rung"}
        }


# ── 11. Ultrasonic Flaw Detector NDT Engine ─────────────────────────────────
class UltrasonicFlawDetectorNDTInput(BaseModel):
    steel_acoustic_velocity_m_s: float = Field(default=5920.0, ge=1000.0, le=8000.0)
    specimen_thickness_mm: float = Field(default=50.0, ge=10.0, le=500.0)
    flaw_depth_mm: float = Field(default=22.5, ge=2.0, le=450.0)
    probe_frequency_mhz: float = Field(default=4.0, ge=1.0, le=15.0)


class UltrasonicFlawDetectorNDTOutput(BaseModel):
    backwall_echo_time_of_flight_us: float
    flaw_echo_time_of_flight_us: float
    acoustic_wavelength_mm: float
    minimum_detectable_flaw_size_mm: float
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class UltrasonicFlawDetectorNDTEngine(BaseSimulationEngine):
    name = "ultrasonic-flaw-detector-ndt"
    description = "ETCE/IE2/S6: Non-Destructive Testing — Pulse-Echo Ultrasonic Flaw Detection & A-Scan Graticule Sizing"

    def calculate(self, params: UltrasonicFlawDetectorNDTInput) -> UltrasonicFlawDetectorNDTOutput:
        v = params.steel_acoustic_velocity_m_s
        d_thick = params.specimen_thickness_mm / 1000.0
        d_flaw = params.flaw_depth_mm / 1000.0
        f_hz = params.probe_frequency_mhz * 1e6

        # Time of flight t = 2 * d / v
        t_bw_us = (2.0 * d_thick / v) * 1e6
        t_flaw_us = (2.0 * d_flaw / v) * 1e6
        lam_mm = (v / f_hz) * 1000.0
        min_flaw_mm = lam_mm / 2.0

        telemetry = {
            "t_bw": round(t_bw_us, 2),
            "t_flaw": round(t_flaw_us, 2),
            "lam_mm": round(lam_mm, 3),
            "min_flaw": round(min_flaw_mm, 3)
        }

        return UltrasonicFlawDetectorNDTOutput(
            backwall_echo_time_of_flight_us=round(t_bw_us, 2),
            flaw_echo_time_of_flight_us=round(t_flaw_us, 2),
            acoustic_wavelength_mm=round(lam_mm, 3),
            minimum_detectable_flaw_size_mm=round(min_flaw_mm, 3),
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "steel_plate_50mm_flaw_22mm": {"steel_acoustic_velocity_m_s": 5920.0, "specimen_thickness_mm": 50.0, "flaw_depth_mm": 22.5, "probe_frequency_mhz": 4.0},
            "aluminum_block_100mm": {"steel_acoustic_velocity_m_s": 6320.0, "specimen_thickness_mm": 100.0, "flaw_depth_mm": 45.0, "probe_frequency_mhz": 5.0}
        }


# ── 12. ECG Biopotential Instrumentation Engine ─────────────────────────────
class ECGBiopotentialInstrumentationInput(BaseModel):
    lead_i_voltage_mv: float = Field(default=0.8, ge=0.1, le=3.0)
    lead_iii_voltage_mv: float = Field(default=0.5, ge=0.1, le=3.0)
    heart_rate_bpm: float = Field(default=72.0, ge=40.0, le=180.0)
    instrumentation_amp_gain: float = Field(default=1000.0, ge=100.0, le=5000.0)
    cmrr_db: float = Field(default=110.0, ge=80.0, le=140.0)


class ECGBiopotentialInstrumentationOutput(BaseModel):
    lead_ii_voltage_einthoven_mv: float
    cardiac_electrical_axis_deg: float
    rr_interval_ms: float
    amplified_output_voltage_v: float
    clinical_axis_interpretation: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ECGBiopotentialInstrumentationEngine(BaseSimulationEngine):
    name = "ecg-biopotential-instrumentation"
    description = "ETCE/MED/S6: Medical Electronics — ECG Einthoven's Triangle (Lead II = Lead I + Lead III) & Instrumentation Amp"

    def calculate(self, params: ECGBiopotentialInstrumentationInput) -> ECGBiopotentialInstrumentationOutput:
        l1 = params.lead_i_voltage_mv
        l3 = params.lead_iii_voltage_mv

        # Einthoven's Law: Lead II = Lead I + Lead III
        l2 = l1 + l3

        # Cardiac axis theta = arctan( (2*L2 - L1) / (sqrt(3)*L1) )
        numerator = 2.0 * l2 - l1
        denominator = math.sqrt(3.0) * l1
        axis_rad = math.atan(numerator / denominator)
        axis_deg = math.degrees(axis_rad)

        rr_ms = (60.0 / params.heart_rate_bpm) * 1000.0
        v_amp = (l2 / 1000.0) * params.instrumentation_amp_gain

        axis_str = "NORMAL CARDIAC AXIS (-30° to +90°)" if -30.0 <= axis_deg <= 90.0 else "AXIS DEVIATION"

        telemetry = {
            "l2_mv": round(l2, 2),
            "axis_deg": round(axis_deg, 1),
            "rr_ms": round(rr_ms, 1),
            "v_amp": round(v_amp, 2)
        }

        return ECGBiopotentialInstrumentationOutput(
            lead_ii_voltage_einthoven_mv=round(l2, 2),
            cardiac_electrical_axis_deg=round(axis_deg, 1),
            rr_interval_ms=round(rr_ms, 1),
            amplified_output_voltage_v=round(v_amp, 2),
            clinical_axis_interpretation=axis_str,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "normal_ecg_72bpm": {"lead_i_voltage_mv": 0.8, "lead_iii_voltage_mv": 0.5, "heart_rate_bpm": 72.0, "instrumentation_amp_gain": 1000.0, "cmrr_db": 110.0},
            "athletic_bradycardia_55bpm": {"lead_i_voltage_mv": 1.0, "lead_iii_voltage_mv": 0.6, "heart_rate_bpm": 55.0, "instrumentation_amp_gain": 1000.0, "cmrr_db": 110.0}
        }
