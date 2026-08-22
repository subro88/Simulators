"""
Unit Tests for Automotive Friction Clutch Physics Engine
=========================================================
Validates Uniform Pressure vs Uniform Wear torque capacity, clamping forces,
pedal disengagement, slip torque, and power transmission calculations.
"""

import pytest
from app.simulation.clutch import ClutchEngine, ClutchInput


@pytest.fixture
def engine():
    return ClutchEngine()


def test_uniform_wear_torque_capacity(engine):
    """Uniform Wear theory capacity: T = n * mu * W * Rm."""
    inp = ClutchInput(
        clutch_type="single_plate",
        calculation_theory="uniform_wear",
        clamp_force_n=4000.0,
        friction_coeff=0.35,
        outer_radius_mm=120.0,
        inner_radius_mm=80.0,
        number_of_plates=1,
        pedal_travel_pct=0.0
    )
    out = engine.calculate(inp)

    # Rm = (120 + 80) / 2 = 100 mm = 0.10 m
    # T = 2 * 0.35 * 4000 * 0.10 = 280 N·m
    assert out.effective_mean_radius_mm == 100.0
    assert out.number_of_active_surfaces == 2
    assert out.max_torque_capacity_nm == 280.0
    assert out.is_slipping is False


def test_pedal_disengagement(engine):
    """Pedal depression reduces clamping force to zero."""
    inp = ClutchInput(pedal_travel_pct=100.0, engine_torque_nm=200.0)
    out = engine.calculate(inp)

    assert out.effective_clamp_force_n == 0.0
    assert out.max_torque_capacity_nm == 0.0
    assert out.gearbox_rpm == 0.0
    assert out.transmitted_torque_nm == 0.0
    assert out.is_slipping is True


def test_multi_plate_torque(engine):
    """Multi-plate clutch increases contact surfaces and torque capacity."""
    inp = ClutchInput(
        clutch_type="multi_plate",
        clamp_force_n=2000.0,
        friction_coeff=0.15,
        outer_radius_mm=80.0,
        inner_radius_mm=50.0,
        number_of_plates=5,
        pedal_travel_pct=0.0
    )
    out = engine.calculate(inp)

    # n_surfaces = 10
    # Rm = (80 + 50) / 2 = 65 mm = 0.065 m
    # T = 10 * 0.15 * 2000 * 0.065 = 195 N·m
    assert out.number_of_active_surfaces == 10
    assert out.effective_mean_radius_mm == 65.0
    assert out.max_torque_capacity_nm == 195.0
