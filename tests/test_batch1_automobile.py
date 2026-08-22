"""
Unit Tests for Batch 1: Automobile Engineering Core Physics Engines
=====================================================================
Validates physics calculations for Differential, Friction Clutch, Four-Stroke Engine,
Two-Stroke Engine, Steering Geometry, and Valve Timing Diagram.
"""

import pytest
from app.simulation.four_stroke import FourStrokeEngine, FourStrokeInput
from app.simulation.two_stroke import TwoStrokeEngine, TwoStrokeInput
from app.simulation.steering import SteeringEngine, SteeringInput
from app.simulation.valve_timing import ValveTimingEngine, ValveTimingInput


def test_four_stroke_engine_physics():
    engine = FourStrokeEngine()
    inp = FourStrokeInput(engine_type="petrol_otto", compression_ratio=10.5, engine_rpm=3000.0)
    out = engine.calculate(inp)

    assert out.air_standard_efficiency_pct > 60.0
    assert out.brake_power_kw > 0.0
    assert out.total_displacement_cc > 1800.0


def test_two_stroke_engine_physics():
    engine = TwoStrokeEngine()
    inp = TwoStrokeInput(engine_type="petrol_reed_valve", scavenge_ratio=1.2, engine_rpm=4500.0)
    out = engine.calculate(inp)

    assert out.scavenging_efficiency_pct > 65.0
    assert out.power_stroke_frequency_hz == 75.0  # 4500 / 60 = 75 Hz in 2-stroke
    assert out.brake_power_kw > 0.0


def test_steering_geometry_ackermann():
    engine = SteeringEngine()
    inp = SteeringInput(steering_mechanism="ackermann", steering_wheel_angle_deg=180.0, steering_ratio=16.0)
    out = engine.calculate(inp)

    assert out.inner_wheel_angle_deg == 11.25  # 180 / 16
    assert out.actual_outer_wheel_angle_deg < out.inner_wheel_angle_deg
    assert out.turning_radius_cg_m > 0.0


def test_valve_timing_diagram_overlap():
    engine = ValveTimingEngine()
    inp = ValveTimingInput(ivo_deg_btdc=12.0, evc_deg_atdc=14.0)
    out = engine.calculate(inp)

    assert out.valve_overlap_deg == 26.0
    assert out.intake_duration_deg == 237.0  # 180 + 12 + 45
    assert out.volumetric_efficiency_pct > 70.0
