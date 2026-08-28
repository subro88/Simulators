"""
Unit Tests for WBSCTE Mechanical Engineering 5th Semester Physics Engines
==========================================================================
Validates:
1. FlowOrificeVenturimeterEngine
2. PipeFrictionMinorLossesEngine
3. HydraulicReactionTurbinesEngine
4. ReciprocatingPumpAirVesselEngine
5. JigsFixturesDesignEngine
6. CNCPartProgrammingGCodeEngine
7. AdvancedMachiningLaserWaterjetEngine
8. SteamTurbinesNozzlesEngine
9. SteamCondensersCoolingTowersEngine
10. AutomotiveGearboxTransmissionEngine
11. AutomotiveBrakingABSEngine
12. PressToolDieDesignEngine
"""

import pytest
from app.simulation.me_5th_sem_suite import (
    FlowOrificeVenturimeterEngine, FlowOrificeVenturimeterInput,
    PipeFrictionMinorLossesEngine, PipeFrictionMinorLossesInput,
    HydraulicReactionTurbinesEngine, HydraulicReactionTurbinesInput,
    ReciprocatingPumpAirVesselEngine, ReciprocatingPumpAirVesselInput,
    JigsFixturesDesignEngine, JigsFixturesDesignInput,
    CNCPartProgrammingGCodeEngine, CNCPartProgrammingGCodeInput,
    AdvancedMachiningLaserWaterjetEngine, AdvancedMachiningLaserWaterjetInput,
    SteamTurbinesNozzlesEngine, SteamTurbinesNozzlesInput,
    SteamCondensersCoolingTowersEngine, SteamCondensersCoolingTowersInput,
    AutomotiveGearboxTransmissionEngine, AutomotiveGearboxTransmissionInput,
    AutomotiveBrakingABSEngine, AutomotiveBrakingABSInput,
    PressToolDieDesignEngine, PressToolDieDesignInput,
)


def test_flow_orifice_venturimeter():
    engine = FlowOrificeVenturimeterEngine()
    inp = FlowOrificeVenturimeterInput(
        device_type="Venturimeter",
        pipe_diameter_d1_mm=100.0,
        throat_diameter_d2_mm=50.0,
        manometer_deflection_cm=25.0
    )
    out = engine.calculate(inp)
    assert out.differential_head_m_fluid > 0.0
    assert out.actual_discharge_l_s > 0.0
    assert out.reynolds_number_inlet > 10000.0
    assert out.pressure_recovery_pct > 80.0


def test_pipe_friction_minor_losses():
    engine = PipeFrictionMinorLossesEngine()
    inp = PipeFrictionMinorLossesInput(
        pipe_diameter_mm=50.0,
        pipe_length_m=30.0,
        flow_velocity_m_s=2.2
    )
    out = engine.calculate(inp)
    assert 0.01 < out.darcy_friction_factor_f < 0.08
    assert out.major_friction_head_loss_hf_m > 0.0
    assert out.total_head_loss_m > out.major_friction_head_loss_hf_m
    assert out.pumping_power_kw > 0.0


def test_hydraulic_reaction_turbines():
    engine = HydraulicReactionTurbinesEngine()
    inp = HydraulicReactionTurbinesInput(
        turbine_type="Francis Reaction Turbine",
        net_head_h_m=45.0,
        discharge_q_m3_s=3.5
    )
    out = engine.calculate(inp)
    assert out.shaft_power_output_kw > 0.0
    assert 70.0 < out.overall_efficiency_pct < 98.0
    assert out.tangential_runner_speed_u1_m_s > 0.0
    assert out.draft_tube_pressure_recovery_m > 0.0


def test_reciprocating_pump_air_vessel():
    engine = ReciprocatingPumpAirVesselEngine()
    inp = ReciprocatingPumpAirVesselInput(
        pump_type="Single-Acting",
        cylinder_bore_mm=120.0,
        stroke_length_mm=220.0,
        crank_speed_rpm=60.0,
        air_vessel_installed=True
    )
    out = engine.calculate(inp)
    assert out.theoretical_discharge_l_s > 0.0
    assert out.work_saved_by_air_vessel_pct == 84.8
    assert out.pump_shaft_power_kw > 0.0


def test_jigs_fixtures_design():
    engine = JigsFixturesDesignEngine()
    inp = JigsFixturesDesignInput(
        workpiece_shape="Prismatic Block",
        locating_method="3-2-1 Pin Location",
        cutting_thrust_force_n=1600.0
    )
    out = engine.calculate(inp)
    assert out.restrained_degrees_of_freedom == 9
    assert out.required_clamping_force_n > 1600.0
    assert out.jig_plate_min_thickness_mm > 10.0


def test_cnc_part_programming_gcode():
    engine = CNCPartProgrammingGCodeEngine()
    inp = CNCPartProgrammingGCodeInput(
        stock_diameter_mm=50.0,
        cutting_speed_vc_m_min=180.0
    )
    out = engine.calculate(inp)
    assert out.spindle_speed_rpm > 500.0
    assert len(out.gcode_program_preview) >= 10
    assert out.material_removal_rate_cm3_min > 0.0


def test_advanced_machining_laser_waterjet():
    engine = AdvancedMachiningLaserWaterjetEngine()
    inp = AdvancedMachiningLaserWaterjetInput(
        process_type="Fiber Laser Cutting (LBM)",
        sheet_thickness_mm=6.0,
        laser_power_kw=3.0
    )
    out = engine.calculate(inp)
    assert out.cutting_speed_mm_min > 0.0
    assert out.kerf_width_mm > 0.0
    assert out.heat_affected_zone_haz_mm > 0.0


def test_steam_turbines_nozzles():
    engine = SteamTurbinesNozzlesEngine()
    inp = SteamTurbinesNozzlesInput(
        nozzle_inlet_pressure_bar=15.0,
        nozzle_inlet_temp_c=300.0
    )
    out = engine.calculate(inp)
    assert 0.5 < out.critical_pressure_ratio < 0.6
    assert out.steam_exit_velocity_m_s > 300.0
    assert out.stage_power_output_kw > 0.0
    assert 50.0 < out.diagram_blading_efficiency_pct < 95.0


def test_steam_condensers_cooling_towers():
    engine = SteamCondensersCoolingTowersEngine()
    inp = SteamCondensersCoolingTowersInput(
        vacuum_gauge_cm_hg=70.5,
        barometer_cm_hg=76.0
    )
    out = engine.calculate(inp)
    assert out.absolute_condenser_pressure_bar < 0.1
    assert out.vacuum_efficiency_pct > 80.0
    assert out.cooling_water_flow_rate_m3_hr > 0.0
    assert out.cooling_tower_range_c > 0.0


def test_automotive_gearbox_transmission():
    engine = AutomotiveGearboxTransmissionEngine()
    inp = AutomotiveGearboxTransmissionInput(
        engine_torque_nm=185.0,
        gear_selected="1st Gear (Ratio 3.80)"
    )
    out = engine.calculate(inp)
    assert out.overall_gear_ratio > 10.0
    assert out.wheel_drive_torque_nm > 185.0
    assert out.vehicle_forward_speed_km_h > 0.0
    assert out.tractive_effort_force_n > 1000.0


def test_automotive_braking_abs():
    engine = AutomotiveBrakingABSEngine()
    inp = AutomotiveBrakingABSInput(
        vehicle_mass_kg=1400.0,
        initial_speed_km_h=80.0,
        abs_active=True
    )
    out = engine.calculate(inp)
    assert out.hydraulic_line_pressure_bar > 10.0
    assert out.vehicle_deceleration_m_s2 > 0.0
    assert 10.0 < out.stopping_distance_m < 80.0
    assert "ABS ACTIVE" in out.wheel_lockup_prevention_status


def test_press_tool_die_design():
    engine = PressToolDieDesignEngine()
    inp = PressToolDieDesignInput(
        blank_diameter_mm=60.0,
        sheet_thickness_mm=2.5
    )
    out = engine.calculate(inp)
    assert out.blanking_shear_force_kn > 0.0
    assert out.force_reduced_with_shear_kn < out.blanking_shear_force_kn
    assert out.recommended_press_tonnage_tons > 0.0
    assert out.strip_material_utilization_pct > 50.0
