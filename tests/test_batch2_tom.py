"""
Unit Tests for Batch 2: Theory of Machines (TOM) & Kinematics Suite (15 Tools)
=============================================================================
Validates kinematics and physics calculations across all 15 TOM engines.
"""

import pytest
from app.simulation import (
    FourBarEngine, FourBarInput,
    CamFollowerEngine, CamFollowerInput,
    GearTrainsEngine, GearTrainsInput,
    BeltDriveEngine, BeltDriveInput,
    SliderCrankEngine, SliderCrankInput,
    ScotchYokeEngine, ScotchYokeInput,
    GenevaEngine, GenevaInput,
    GovernorEngine, GovernorInput,
    FlywheelEngine, FlywheelInput,
    GyroscopeEngine, GyroscopeInput,
    VibrationsEngine, VibrationsInput,
    SHMEngine, SHMInput,
    SimpleMachinesEngine, SimpleMachinesInput,
    CollisionMomentumEngine, CollisionMomentumInput,
    TorqueRotationEngine, TorqueRotationInput
)


def test_four_bar_grashof_crank_rocker():
    engine = FourBarEngine()
    inp = FourBarInput(frame_length_a=180.0, crank_length_b=60.0, coupler_length_c=160.0, rocker_length_d=140.0)
    out = engine.calculate(inp)
    assert out.is_grashof is True
    assert "Crank-Rocker" in out.grashof_type
    assert out.transmission_angle_deg > 30.0


def test_cam_follower_shm():
    engine = CamFollowerEngine()
    inp = CamFollowerInput(follower_motion="shm", stroke_stroke_mm=40.0, cam_rpm=300.0, cam_angle_deg=60.0)
    out = engine.calculate(inp)
    assert "SHM" in out.motion_type
    assert 0.0 < out.follower_displacement_mm < 40.0
    assert out.follower_velocity_ms > 0.0


def test_gear_trains_ratio():
    engine = GearTrainsEngine()
    inp = GearTrainsInput(train_type="simple", driver_teeth=20, idler_teeth=40, driven_teeth=60, input_rpm=1440.0, input_torque_nm=100.0)
    out = engine.calculate(inp)
    assert out.gear_ratio == 3.0
    assert out.output_rpm == 480.0


def test_belt_drive_v_belt():
    engine = BeltDriveEngine()
    inp = BeltDriveInput(belt_type="v_belt", driver_diameter_mm=200.0, driven_diameter_mm=400.0, driver_rpm=1440.0)
    out = engine.calculate(inp)
    assert out.speed_ratio == 2.0
    assert out.belt_velocity_ms > 10.0
    assert out.tight_side_tension_n > out.slack_side_tension_n


def test_slider_crank_kinematics():
    engine = SliderCrankEngine()
    inp = SliderCrankInput(crank_radius_mm=50.0, connecting_rod_mm=200.0, crank_rpm=1500.0, crank_angle_deg=45.0)
    out = engine.calculate(inp)
    assert out.piston_stroke_mm == 100.0
    assert out.obliquity_ratio == 0.25
    assert out.piston_velocity_ms > 0.0


def test_scotch_yoke_shm():
    engine = ScotchYokeEngine()
    inp = ScotchYokeInput(crank_radius_mm=60.0, crank_rpm=600.0, crank_angle_deg=0.0)
    out = engine.calculate(inp)
    assert out.stroke_length_mm == 120.0
    assert out.yoke_displacement_mm == 60.0
    assert out.yoke_velocity_ms == 0.0  # Peak displacement has 0 velocity


def test_geneva_mechanism_engagement():
    engine = GenevaEngine()
    inp = GenevaInput(num_slots=4, drive_crank_radius_mm=80.0, driver_rpm=120.0, driver_angle_deg=180.0)
    out = engine.calculate(inp)
    assert out.in_engagement is True
    assert out.geneva_rpm > 0.0
    assert out.indexing_ratio == 0.25  # 4 slots = 25% motion duration


def test_governor_porter():
    engine = GovernorEngine()
    inp = GovernorInput(governor_type="porter", ball_mass_kg=3.0, central_sleeve_mass_kg=20.0, engine_rpm=200.0)
    out = engine.calculate(inp)
    assert out.equilibrium_height_mm > 0.0
    assert out.governor_effort_n > 0.0


def test_flywheel_energy_fluctuation():
    engine = FlywheelEngine()
    inp = FlywheelInput(engine_power_kw=50.0, mean_speed_rpm=1500.0, energy_fluctuation_pct=15.0, speed_fluctuation_pct=2.0)
    out = engine.calculate(inp)
    assert out.moment_of_inertia_kgm2 > 0.0
    assert out.flywheel_rim_mass_kg > 0.0


def test_gyroscope_couple():
    engine = GyroscopeEngine()
    inp = GyroscopeInput(rotor_mass_kg=8.0, rotor_radius_mm=150.0, spin_rpm=6000.0, precession_rpm=30.0)
    out = engine.calculate(inp)
    assert out.gyroscopic_couple_nm > 0.0
    assert out.rotor_inertia_kgm2 == 0.5 * 8.0 * (0.15 ** 2)


def test_vibrations_underdamped():
    engine = VibrationsEngine()
    inp = VibrationsInput(mass_kg=10.0, stiffness_n_m=4000.0, damping_coeff_ns_m=40.0)
    out = engine.calculate(inp)
    assert out.damping_ratio < 1.0
    assert out.natural_frequency_hz > 3.0
    assert "Underdamped" in out.vibration_regime


def test_shm_energy_conservation():
    engine = SHMEngine()
    inp = SHMInput(system_type="spring_mass", mass_kg=2.0, stiffness_n_m=50.0, amplitude_m=0.2, time_sec=0.5)
    out = engine.calculate(inp)
    expected_total = 0.5 * 50.0 * (0.2 ** 2)
    assert abs(out.total_energy_j - expected_total) < 1e-4


def test_simple_machines_screw_jack():
    engine = SimpleMachinesEngine()
    inp = SimpleMachinesInput(machine_type="screw_jack", load_weight_n=5000.0, applied_effort_n=250.0)
    out = engine.calculate(inp)
    assert out.mechanical_advantage == 20.0
    assert out.velocity_ratio > out.mechanical_advantage
    assert out.is_self_locking is True


def test_collision_momentum_elastic():
    engine = CollisionMomentumEngine()
    inp = CollisionMomentumInput(mass_1_kg=5.0, velocity_1_initial_ms=10.0, mass_2_kg=3.0, velocity_2_initial_ms=-2.0, coeff_restitution=1.0)
    out = engine.calculate(inp)
    assert abs(out.total_momentum_initial_kgms - out.total_momentum_final_kgms) < 1e-4
    assert abs(out.energy_loss_j) < 1e-4  # Zero energy loss in elastic


def test_torque_rotation_dynamics():
    engine = TorqueRotationEngine()
    inp = TorqueRotationInput(geometry="solid_cylinder", mass_kg=10.0, radius_mm=200.0, applied_force_n=50.0)
    out = engine.calculate(inp)
    assert out.moment_of_inertia_kgm2 == pytest.approx(0.2)
    assert out.applied_torque_nm == pytest.approx(10.0)
    assert out.angular_acceleration_rads2 == pytest.approx(50.0)
