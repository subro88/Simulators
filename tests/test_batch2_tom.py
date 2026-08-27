"""
Unit Tests for Batch 2: Theory of Machines (TOM) & Kinematics Physics Engines
=============================================================================
Validates kinematics calculations for Four-Bar Linkage, Cam-Follower, Gear Trains, Belt Drive, etc.
"""

import pytest
from app.simulation.four_bar import FourBarEngine, FourBarInput
from app.simulation.cam_follower import CamFollowerEngine, CamFollowerInput
from app.simulation.gear_trains import GearTrainsEngine, GearTrainsInput
from app.simulation.belt_drive import BeltDriveEngine, BeltDriveInput


def test_four_bar_grashof_crank_rocker():
    engine = FourBarEngine()
    inp = FourBarInput(frame_length_a=180.0, crank_length_b=60.0, coupler_length_c=160.0, rocker_length_d=140.0)
    out = engine.calculate(inp)

    assert out.is_grashof is True
    assert "Crank-Rocker" in out.grashof_type
    assert out.transmission_angle_deg > 30.0
    assert out.rocker_rpm != 0.0


def test_cam_follower_shm():
    engine = CamFollowerEngine()
    inp = CamFollowerInput(follower_motion="shm", stroke_stroke_mm=40.0, cam_rpm=300.0, cam_angle_deg=60.0)
    out = engine.calculate(inp)

    assert "SHM" in out.motion_type
    assert 0.0 < out.follower_displacement_mm < 40.0
    assert out.follower_velocity_ms > 0.0
    assert out.max_pressure_angle_deg < 40.0


def test_gear_trains_ratio():
    engine = GearTrainsEngine()
    inp = GearTrainsInput(train_type="simple", driver_teeth=20, idler_teeth=40, driven_teeth=60, input_rpm=1440.0, input_torque_nm=100.0)
    out = engine.calculate(inp)

    assert out.gear_ratio == 3.0
    assert out.output_rpm == 480.0
    assert out.output_torque_nm > 250.0


def test_belt_drive_power():
    engine = BeltDriveEngine()
    inp = BeltDriveInput(belt_type="flat_belt", driver_diameter_mm=200.0, driven_diameter_mm=400.0, driver_rpm=1440.0, max_tension_n=1500.0)
    out = engine.calculate(inp)

    assert out.belt_velocity_ms > 14.0
    assert out.transmitted_power_kw > 10.0
    assert out.tight_side_tension_n == 1500.0
    assert out.slack_side_tension_n < 1500.0
