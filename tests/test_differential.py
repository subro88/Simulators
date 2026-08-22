"""
Unit Tests for Automotive Differential Physics Engine
=====================================================
Validates kinematic equations, torque distribution, and cornering splits.
"""

import pytest
from app.simulation.differential import DifferentialEngine, DifferentialInput


@pytest.fixture
def engine():
    return DifferentialEngine()


def test_straight_driving_kinematics(engine):
    """Straight driving: Left = Right = Crown, Spider spin is zero."""
    inp = DifferentialInput(input_rpm=1200, final_drive_ratio=4.0, maneuver="straight")
    out = engine.calculate(inp)

    assert out.crown_rpm == 300.0
    assert out.left_rpm == 300.0
    assert out.right_rpm == 300.0
    assert out.spider_rpm == 0.0
    assert out.slip_detected is False
    assert (out.left_rpm + out.right_rpm) == 2.0 * out.crown_rpm


def test_left_turn_kinematics(engine):
    """Left turn: Inner left wheel slows down, outer right wheel speeds up."""
    inp = DifferentialInput(input_rpm=1200, final_drive_ratio=4.0, maneuver="left", turn_bias=75.0)
    out = engine.calculate(inp)

    # 75% allocated to outer right wheel: right_rpm = 300 * 2 * 0.75 = 450 RPM
    # inner left_rpm = 600 - 450 = 150 RPM
    assert out.crown_rpm == 300.0
    assert out.right_rpm == 450.0
    assert out.left_rpm == 150.0
    # Speed conservation law must hold:
    assert (out.left_rpm + out.right_rpm) == 2.0 * out.crown_rpm
    # Spider pinion must spin:
    assert out.spider_rpm > 0.0


def test_slip_condition(engine):
    """Traction loss / slip: Free wheel spins at 2x crown speed."""
    inp = DifferentialInput(input_rpm=1200, final_drive_ratio=4.0, maneuver="slip")
    out = engine.calculate(inp)

    assert out.crown_rpm == 300.0
    assert out.left_rpm == 600.0  # 2x crown speed
    assert out.right_rpm == 0.0   # grounded wheel stationary
    assert out.slip_detected is True
    assert (out.left_rpm + out.right_rpm) == 2.0 * out.crown_rpm


def test_torque_and_power(engine):
    """Torque multiplication and mechanical power calculation."""
    inp = DifferentialInput(
        input_rpm=2400,
        engine_torque_nm=200,
        final_drive_ratio=4.0,
        maneuver="straight"
    )
    out = engine.calculate(inp)

    assert out.total_crown_torque_nm == 800.0  # 200 * 4
    assert out.left_torque_nm == 360.0         # 400 * 0.9 traction coeff
    assert out.right_torque_nm == 360.0
    assert out.delivered_power_kw > 0.0
