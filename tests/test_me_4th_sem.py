"""
Unit Tests for WBSCTE Mechanical Engineering 4th Semester Physics Engines
==========================================================================
Validates:
1. ReciprocatingAirCompressorEngine
2. GasTurbineBraytonEngine
3. ShaperSlotterMachineEngine
4. GrindingWheelAbrasivesEngine
5. UnconventionalMachiningEDMEngine
6. TransducersInstrumentationEngine
7. SineBarSlipGaugesEngine
8. ComparatorsSurfaceRoughnessEngine
9. SQCControlChartsEngine
10. EpicyclicGearTrainsEngine
11. GovernorMechanismsEngine
12. BalancingRotatingMassesEngine
"""

import pytest
from app.simulation.me_4th_sem_suite import (
    ReciprocatingAirCompressorEngine, ReciprocatingAirCompressorInput,
    GasTurbineBraytonEngine, GasTurbineBraytonInput,
    ShaperSlotterMachineEngine, ShaperSlotterMachineInput,
    GrindingWheelAbrasivesEngine, GrindingWheelAbrasivesInput,
    UnconventionalMachiningEDMEngine, UnconventionalMachiningEDMInput,
    TransducersInstrumentationEngine, TransducersInstrumentationInput,
    SineBarSlipGaugesEngine, SineBarSlipGaugesInput,
    ComparatorsSurfaceRoughnessEngine, ComparatorsSurfaceRoughnessInput,
    SQCControlChartsEngine, SQCControlChartsInput,
    EpicyclicGearTrainsEngine, EpicyclicGearTrainsInput,
    GovernorMechanismsEngine, GovernorMechanismsInput,
    BalancingRotatingMassesEngine, BalancingRotatingMassesInput,
)


def test_reciprocating_air_compressor():
    engine = ReciprocatingAirCompressorEngine()
    inp = ReciprocatingAirCompressorInput(
        stages=2,
        suction_pressure_bar=1.0,
        delivery_pressure_bar=9.0,
        cylinder_bore_mm=120.0,
        stroke_length_mm=150.0,
        speed_rpm=750.0
    )
    out = engine.calculate(inp)
    assert out.pressure_ratio_per_stage == 3.0  # sqrt(9) = 3
    assert out.volumetric_efficiency_pct > 70.0
    assert out.indicated_power_kw > 0.0
    assert out.isothermal_efficiency_pct > 60.0


def test_gas_turbine_brayton():
    engine = GasTurbineBraytonEngine()
    inp = GasTurbineBraytonInput(
        ambient_temp_k=300.0,
        pressure_ratio_rp=6.0,
        turbine_inlet_temp_k=1200.0,
        air_mass_flow_kg_s=10.0
    )
    out = engine.calculate(inp)
    assert out.compressor_exit_temp_k > 300.0
    assert out.turbine_exit_temp_k < 1200.0
    assert out.net_power_output_kw > 0.0
    assert 20.0 < out.thermal_efficiency_pct < 60.0


def test_shaper_slotter_machine():
    engine = ShaperSlotterMachineEngine()
    inp = ShaperSlotterMachineInput(
        crank_radius_r_mm=120.0,
        connecting_arm_length_l_mm=360.0,
        crank_speed_rpm=45.0
    )
    out = engine.calculate(inp)
    assert out.quick_return_ratio > 1.3
    assert out.cutting_stroke_angle_deg > 180.0
    assert out.return_stroke_angle_deg < 180.0
    assert out.average_cutting_speed_m_min > 0.0


def test_grinding_wheel_abrasives():
    engine = GrindingWheelAbrasivesEngine()
    inp = GrindingWheelAbrasivesInput(
        wheel_diameter_mm=250.0,
        wheel_speed_rpm=2400.0,
        workpiece_speed_m_min=15.0,
        depth_of_cut_um=20.0
    )
    out = engine.calculate(inp)
    assert 25.0 < out.peripheral_wheel_speed_m_s < 35.0
    assert out.material_removal_rate_mm3_s > 0.0
    assert "A" in out.standard_wheel_marking
    assert "SAFE" in out.safety_compliance


def test_unconventional_machining_edm():
    engine = UnconventionalMachiningEDMEngine()
    inp = UnconventionalMachiningEDMInput(
        discharge_current_a=25.0,
        pulse_on_time_us=100.0,
        pulse_off_time_us=25.0
    )
    out = engine.calculate(inp)
    assert out.pulse_duty_cycle_pct == 80.0
    assert out.pulse_frequency_khz == 8.0
    assert out.material_removal_rate_mm3_min > 0.0
    assert out.surface_roughness_ra_um > 0.0


def test_transducers_instrumentation():
    engine = TransducersInstrumentationEngine()
    inp = TransducersInstrumentationInput(
        sensor_type="Strain Gauge Cantilever Beam",
        applied_measurand=20.0,
        bridge_excitation_v=10.0
    )
    out = engine.calculate(inp)
    assert out.sensor_output_voltage_mv > 0.0
    assert out.calculated_stress_mpa > 0.0
    assert "mV/N" in out.sensitivity_metric


def test_sine_bar_slip_gauges():
    engine = SineBarSlipGaugesEngine()
    inp = SineBarSlipGaugesInput(
        sine_bar_length_mm=200.0,
        target_angle_deg=14.5,
        measured_stack_height_mm=50.076
    )
    out = engine.calculate(inp)
    assert abs(out.theoretical_stack_height_mm - 50.076) < 0.1
    assert len(out.slip_gauge_combination) >= 2
    assert "Grade" in out.sine_bar_grade_accuracy


def test_comparators_surface_roughness():
    engine = ComparatorsSurfaceRoughnessEngine()
    inp = ComparatorsSurfaceRoughnessInput(
        nominal_dimension_mm=25.0,
        actual_dimension_mm=25.012
    )
    out = engine.calculate(inp)
    assert out.dimensional_deviation_um == 12.0
    assert out.surface_roughness_ra_um > 0.0
    assert "N" in out.iso_roughness_grade_number


def test_sqc_control_charts():
    engine = SQCControlChartsEngine()
    inp = SQCControlChartsInput(
        subgroup_size_n=5,
        subgroup_means=[50.01, 49.99, 50.02, 49.98, 50.00],
        subgroup_ranges=[0.10, 0.08, 0.12, 0.09, 0.11]
    )
    out = engine.calculate(inp)
    assert out.xbar_upper_control_limit_ucl > out.grand_mean_x_double_bar
    assert out.xbar_lower_control_limit_lcl < out.grand_mean_x_double_bar
    assert out.process_capability_cp > 0.0


def test_epicyclic_gear_trains():
    engine = EpicyclicGearTrainsEngine()
    inp = EpicyclicGearTrainsInput(
        sun_teeth_ts=20,
        planet_teeth_tp=30,
        ring_teeth_ta=80,
        sun_speed_rpm=1000.0,
        ring_speed_rpm=0.0
    )
    out = engine.calculate(inp)
    assert out.gear_pitch_geometry_valid is True
    assert out.gear_train_speed_ratio == 5.0  # 1 + 80/20 = 5
    assert out.arm_carrier_speed_rpm == 200.0


def test_governor_mechanisms():
    engine = GovernorMechanismsEngine()
    inp = GovernorMechanismsInput(
        governor_type="Porter Governor",
        flyball_mass_kg=3.0,
        central_sleeve_mass_kg=18.0
    )
    out = engine.calculate(inp)
    assert out.max_equilibrium_speed_rpm > out.min_equilibrium_speed_rpm
    assert out.sleeve_lift_mm > 0.0
    assert out.governor_sensitiveness_pct > 0.0


def test_balancing_rotating_masses():
    engine = BalancingRotatingMassesEngine()
    inp = BalancingRotatingMassesInput(
        masses_kg=[5.0, 8.0, 6.0],
        radii_mm=[120.0, 150.0, 100.0],
        angles_deg=[0.0, 90.0, 210.0],
        axial_distance_z_mm=[0.0, 200.0, 400.0],
        balance_radius_rb_mm=120.0
    )
    out = engine.calculate(inp)
    assert out.required_static_balance_mass_kg > 0.0
    assert 0.0 <= out.static_balance_angle_deg <= 360.0
    assert out.left_plane_dynamic_mass_kg > 0.0
    assert out.right_plane_dynamic_mass_kg > 0.0
