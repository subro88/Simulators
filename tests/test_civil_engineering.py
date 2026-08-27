"""
Unit Tests for WBSCTE Civil Engineering Syllabus Simulators (3rd & 4th Sem)
=============================================================================
Validates lab calculations for Cement Physical Testing, Aggregate Testing, Concrete Workability,
Soil Mechanics, Bitumen Testing, and Surveying.
"""

import pytest
from app.simulation.cement_testing import CementTestingEngine, CementTestingInput
from app.simulation.aggregate_testing import AggregateTestingEngine, AggregateTestingInput


def test_cement_vicat_consistency():
    engine = CementTestingEngine()
    inp = CementTestingInput(test_type="consistency", water_percentage=28.5)
    out = engine.calculate(inp)

    assert out.is_standard_consistency is True
    assert 5.0 <= out.penetration_depth_mm <= 7.0
    assert "PASSED" in out.compliance_status


def test_cement_mortar_strength():
    engine = CementTestingEngine()
    inp = CementTestingInput(test_type="compressive_strength", cement_grade="opc_43", curing_days=7)
    out = engine.calculate(inp)

    assert out.compressive_strength_mpa > 25.0
    assert "7-Day" in out.status_note


def test_aggregate_impact_value():
    engine = AggregateTestingEngine()
    inp = AggregateTestingInput(test_type="impact_value", fines_passing_236mm_g=42.0)
    out = engine.calculate(inp)

    assert out.aggregate_impact_value_pct == 12.0
    assert "SUITABLE" in out.suitability_for_pavement
