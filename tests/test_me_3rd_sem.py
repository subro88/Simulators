"""
Unit Tests for WBSCTE Mechanical Engineering 3rd Semester Simulation Suite
==========================================================================
Validates CastingProcessEngine, MetalFormingForgingEngine, WeldingTechnologyEngine,
ShaftCouplingsJointsEngine, PlummerBlockBearingsEngine, IronCarbonPhaseDiagramEngine,
HeatTreatmentMetallurgyEngine, NDTMaterialsTestingEngine, AirStandardCyclesEngine,
SteamPropertiesMollierEngine, and SteamBoilersMountingsEngine.
"""

import pytest
from app.simulation import (
    CastingProcessEngine, CastingProcessInput,
    MetalFormingForgingEngine, MetalFormingForgingInput,
    WeldingTechnologyEngine, WeldingTechnologyInput,
    ShaftCouplingsJointsEngine, ShaftCouplingsJointsInput,
    PlummerBlockBearingsEngine, PlummerBlockBearingsInput,
    IronCarbonPhaseDiagramEngine, IronCarbonPhaseDiagramInput,
    HeatTreatmentMetallurgyEngine, HeatTreatmentMetallurgyInput,
    NDTMaterialsTestingEngine, NDTMaterialsTestingInput,
    AirStandardCyclesEngine, AirStandardCyclesInput,
    SteamPropertiesMollierEngine, SteamPropertiesMollierInput,
    SteamBoilersMountingsEngine, SteamBoilersMountingsInput,
)


def test_casting_process():
    engine = CastingProcessEngine()
    inp = CastingProcessInput(
        casting_metal="cast_iron",
        part_length_mm=200.0,
        part_volume_cc=850.0,
        part_surface_area_sqcm=520.0
    )
    out = engine.calculate(inp)
    assert out.pattern_length_with_shrinkage_mm == 202.0
    assert out.chvorinov_solidification_time_sec > 0.0
    assert out.choke_area_sqmm > 0.0


def test_metal_forming_forging():
    engine = MetalFormingForgingEngine()
    inp = MetalFormingForgingInput(
        forming_process="flat_rolling",
        initial_thickness_or_dia_mm=25.0,
        final_thickness_or_dia_mm=18.0,
        roll_radius_or_die_angle_deg=250.0,
        material_flow_stress_mpa=220.0,
        strip_width_mm=180.0
    )
    out = engine.calculate(inp)
    assert out.absolute_reduction_mm == 7.0
    assert out.percentage_reduction_pct == 28.0
    assert out.forming_force_kn > 100.0


def test_welding_technology():
    engine = WeldingTechnologyEngine()
    inp = WeldingTechnologyInput(
        welding_process="shielded_metal_arc_smaw",
        welding_current_a=160.0,
        welding_voltage_v=24.0,
        travel_speed_mm_per_min=220.0
    )
    out = engine.calculate(inp)
    assert out.arc_power_watts == 3840.0
    assert 0.5 < out.linear_heat_input_kj_per_mm < 2.0
    assert out.cooling_rate_c_per_sec > 0.0


def test_shaft_couplings_joints():
    engine = ShaftCouplingsJointsEngine()
    inp = ShaftCouplingsJointsInput(
        coupling_type="protected_flange_coupling",
        transmitted_power_kw=30.0,
        shaft_speed_rpm=960.0,
        shaft_misalignment_angle_deg=12.0
    )
    out = engine.calculate(inp)
    assert out.design_torque_nm > 350.0
    assert out.calculated_shaft_diameter_mm >= 35.0
    assert out.universal_joint_velocity_ratio_max > 1.0


def test_plummer_block_bearings():
    engine = PlummerBlockBearingsEngine()
    inp = PlummerBlockBearingsInput(
        bearing_type="plummer_block_pedestal",
        journal_diameter_mm=75.0,
        bearing_length_mm=90.0,
        radial_load_w_kn=12.5,
        shaft_speed_rpm=720.0
    )
    out = engine.calculate(inp)
    assert 1.0 < out.bearing_pressure_mpa < 3.0
    assert out.sommerfeld_number > 0.0
    assert "Hydrodynamic" in out.lubrication_regime


def test_iron_carbon_phase_diagram():
    engine = IronCarbonPhaseDiagramEngine()
    inp = IronCarbonPhaseDiagramInput(
        carbon_weight_percent=0.45,
        temperature_celsius=700.0
    )
    out = engine.calculate(inp)
    assert "Hypoeutectoid" in out.alloy_classification
    assert out.ferrite_phase_fraction_pct > 90.0
    assert 50.0 < out.pearlite_microstructure_fraction_pct < 65.0


def test_heat_treatment_metallurgy():
    engine = HeatTreatmentMetallurgyEngine()
    inp = HeatTreatmentMetallurgyInput(
        heat_treatment_type="oil_quenching_hardening",
        steel_grade="aisi_1045_medium_carbon"
    )
    out = engine.calculate(inp)
    assert out.achieved_hardness_hrc >= 50.0
    assert "Martensite" in out.resultant_microstructure


def test_ndt_materials_testing():
    engine = NDTMaterialsTestingEngine()
    inp = NDTMaterialsTestingInput(
        ndt_method="ultrasonic_pulse_echo",
        test_block_thickness_mm=50.0,
        measured_time_flight_microsec=10.14,
        flaw_echo_amplitude_pct=68.0
    )
    out = engine.calculate(inp)
    assert 28.0 < out.detected_flaw_depth_mm < 32.0
    assert "REJECTABLE" in out.flaw_severity_classification


def test_air_standard_cycles():
    engine = AirStandardCyclesEngine()
    inp = AirStandardCyclesInput(
        cycle_type="otto_petrol_cycle",
        compression_ratio_r=8.5
    )
    out = engine.calculate(inp)
    assert 55.0 < out.air_standard_efficiency_pct < 60.0
    assert out.mean_effective_pressure_bar > 0.0


def test_steam_properties_mollier():
    engine = SteamPropertiesMollierEngine()
    inp = SteamPropertiesMollierInput(
        steam_condition="wet_steam",
        steam_pressure_bar=10.0,
        dryness_fraction_x=0.88
    )
    out = engine.calculate(inp)
    assert 170.0 < out.saturation_temperature_tsat_c < 190.0
    assert 2400.0 < out.total_enthalpy_h_kj_per_kg < 2700.0


def test_steam_boilers_mountings():
    engine = SteamBoilersMountingsEngine()
    inp = SteamBoilersMountingsInput(
        boiler_type="babcock_and_wilcox_water_tube",
        steam_generation_rate_kg_per_hr=5500.0,
        steam_working_pressure_bar=16.0,
        coal_fuel_consumption_kg_per_hr=680.0
    )
    out = engine.calculate(inp)
    assert 7.0 < out.actual_evaporation_ratio_kg_per_kg_fuel < 9.0
    assert 60.0 < out.boiler_thermal_efficiency_pct < 85.0
