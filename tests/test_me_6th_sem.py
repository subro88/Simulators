"""
Unit Tests for WBSCTE Mechanical Engineering 6th Semester Physics Engines
==========================================================================
Validates:
1. PowerScrewsScrewJackEngine
2. ShaftKeysFlangeCouplingEngine
3. LeversKnuckleCotterJointEngine
4. HydroPneumaticCircuitsEngine
5. AbsorptionRefrigerationElectroluxEngine
6. AirConditioningLoadDuctDesignEngine
7. CADTransformationsSolidModelingEngine
8. IndustrialRoboticsFMSEngine
9. SolarThermalFlatPlateCollectorEngine
10. BeltConveyorMaterialHandlingEngine
11. CPMPERTNetworkAnalysisEngine
12. InventoryControlEOQEngine
"""

import pytest
from app.simulation.me_6th_sem_suite import (
    PowerScrewsScrewJackEngine, PowerScrewsScrewJackInput,
    ShaftKeysFlangeCouplingEngine, ShaftKeysFlangeCouplingInput,
    LeversKnuckleCotterJointEngine, LeversKnuckleCotterJointInput,
    HydroPneumaticCircuitsEngine, HydroPneumaticCircuitsInput,
    AbsorptionRefrigerationElectroluxEngine, AbsorptionRefrigerationElectroluxInput,
    AirConditioningLoadDuctDesignEngine, AirConditioningLoadDuctDesignInput,
    CADTransformationsSolidModelingEngine, CADTransformationsSolidModelingInput,
    IndustrialRoboticsFMSEngine, IndustrialRoboticsFMSInput,
    SolarThermalFlatPlateCollectorEngine, SolarThermalFlatPlateCollectorInput,
    BeltConveyorMaterialHandlingEngine, BeltConveyorMaterialHandlingInput,
    CPMPERTNetworkAnalysisEngine, CPMPERTNetworkAnalysisInput,
    InventoryControlEOQEngine, InventoryControlEOQInput,
)


def test_power_screws_screw_jack():
    engine = PowerScrewsScrewJackEngine()
    inp = PowerScrewsScrewJackInput(
        axial_load_w_kn=50.0,
        screw_nominal_diameter_d_mm=50.0,
        pitch_p_mm=8.0
    )
    out = engine.calculate(inp)
    assert out.torque_to_raise_load_nm > out.torque_to_lower_load_nm
    assert out.effort_on_tommy_bar_n > 0.0
    assert 10.0 < out.screw_jack_efficiency_pct < 60.0
    assert "SELF-LOCKING" in out.self_locking_condition


def test_shaft_keys_flange_coupling():
    engine = ShaftKeysFlangeCouplingEngine()
    inp = ShaftKeysFlangeCouplingInput(
        power_transmitted_kw=35.0,
        shaft_speed_rpm=720.0,
        bending_moment_m_nm=450.0
    )
    out = engine.calculate(inp)
    assert out.nominal_torque_t_nm > 0.0
    assert out.equivalent_twisting_moment_te_nm > out.nominal_torque_t_nm
    assert out.standard_shaft_diameter_is_mm >= out.calculated_shaft_diameter_mm
    assert out.key_length_mm > out.key_width_mm


def test_levers_knuckle_cotter_joint():
    engine = LeversKnuckleCotterJointEngine()
    inp = LeversKnuckleCotterJointInput(
        joint_type="Spigot-Socket Cotter Joint",
        applied_load_p_kn=30.0
    )
    out = engine.calculate(inp)
    assert out.principal_rod_pin_diameter_mm > 0.0
    assert out.cotter_thickness_mm > 0.0
    assert out.cotter_width_mm > out.cotter_thickness_mm
    assert "SAFE" in out.tensile_stress_failure_check


def test_hydro_pneumatic_circuits():
    engine = HydroPneumaticCircuitsEngine()
    inp = HydroPneumaticCircuitsInput(
        circuit_type="Regenerative High-Speed Circuit",
        supply_pressure_bar=140.0,
        cylinder_bore_dia_mm=80.0,
        piston_rod_dia_mm=35.0
    )
    out = engine.calculate(inp)
    assert out.piston_forward_speed_m_s > 0.0
    assert out.regenerative_speed_gain_pct > 0.0
    assert out.max_extension_force_kn > 0.0


def test_absorption_refrigeration_electrolux():
    engine = AbsorptionRefrigerationElectroluxEngine()
    inp = AbsorptionRefrigerationElectroluxInput(
        system_type="Ammonia-Water Electrolux 3-Fluid",
        generator_heat_input_kw=2.5,
        cooling_capacity_kw=1.1
    )
    out = engine.calculate(inp)
    assert out.carnot_maximum_cop > out.actual_thermal_cop
    assert out.hydrogen_partial_pressure_bar > 10.0
    assert out.system_total_working_pressure_bar == 15.0


def test_air_conditioning_load_duct_design():
    engine = AirConditioningLoadDuctDesignEngine()
    inp = AirConditioningLoadDuctDesignInput(
        room_sensible_heat_rsh_kw=35.0,
        room_latent_heat_rlh_kw=12.0
    )
    out = engine.calculate(inp)
    assert 0.6 < out.room_sensible_heat_factor_rshf < 0.95
    assert out.grand_total_heat_load_tr > 10.0
    assert out.dehumidified_air_flow_rate_cmm > 0.0
    assert out.equivalent_round_duct_dia_mm > 200.0


def test_cad_transformations_solid_modeling():
    engine = CADTransformationsSolidModelingEngine()
    inp = CADTransformationsSolidModelingInput(
        translation_tx_mm=50.0,
        translation_ty_mm=30.0,
        rotation_angle_theta_deg=45.0,
        scaling_factor_s=1.5
    )
    out = engine.calculate(inp)
    assert len(out.transformation_matrix_3x3) == 3
    assert out.csg_solid_volume_mm3 > 0.0


def test_industrial_robotics_fms():
    engine = IndustrialRoboticsFMSEngine()
    inp = IndustrialRoboticsFMSInput(
        robot_configuration="6-DOF Articulated Arm",
        link_1_length_mm=350.0,
        link_2_length_mm=300.0,
        payload_mass_kg=10.0
    )
    out = engine.calculate(inp)
    assert out.maximum_reach_envelope_radius_mm == 650.0
    assert out.joint_1_static_holding_torque_nm > 0.0
    assert out.fms_pick_place_cycle_time_s > 0.0


def test_solar_thermal_flat_plate_collector():
    engine = SolarThermalFlatPlateCollectorEngine()
    inp = SolarThermalFlatPlateCollectorInput(
        collector_gross_area_m2=2.0,
        solar_radiation_gt_w_m2=850.0
    )
    out = engine.calculate(inp)
    assert out.useful_heat_gain_rate_w > 0.0
    assert out.water_outlet_temperature_c > 40.0
    assert 40.0 < out.collector_thermal_efficiency_pct < 85.0
    assert out.stagnation_equilibrium_temperature_c > 100.0


def test_belt_conveyor_material_handling():
    engine = BeltConveyorMaterialHandlingEngine()
    inp = BeltConveyorMaterialHandlingInput(
        material_bulk_density_t_m3=1.4,
        belt_width_mm=800.0,
        belt_speed_m_s=1.8
    )
    out = engine.calculate(inp)
    assert out.carrying_capacity_tons_hr > 100.0
    assert out.tight_side_tension_t1_n > out.slack_side_tension_t2_n
    assert out.drive_motor_power_kw > 0.0
    assert out.recommended_belt_plies_count >= 2


def test_cpm_pert_network_analysis():
    engine = CPMPERTNetworkAnalysisEngine()
    inp = CPMPERTNetworkAnalysisInput(
        activity_optimistic_time_to=4.0,
        activity_most_likely_time_tm=8.0,
        activity_pessimistic_time_tp=18.0,
        project_critical_path_duration_days=42.0,
        target_project_deadline_ts_days=46.0
    )
    out = engine.calculate(inp)
    assert out.activity_expected_duration_te == 9.0  # (4 + 32 + 18)/6 = 9
    assert abs(out.activity_standard_deviation - 2.33) < 0.01  # (18-4)/6 = 2.33
    assert out.project_completion_probability_pct > 50.0


def test_inventory_control_eoq():
    engine = InventoryControlEOQEngine()
    inp = InventoryControlEOQInput(
        annual_demand_d_units=12000.0,
        ordering_cost_per_order_s=250.0,
        unit_item_cost_c=80.0,
        holding_cost_annual_pct=18.0
    )
    out = engine.calculate(inp)
    assert out.economic_order_quantity_eoq > 0.0
    assert out.optimal_orders_per_year > 0.0
    assert out.reorder_level_rol_units > 0.0
    assert out.total_inventory_cost > (12000.0 * 80.0)
