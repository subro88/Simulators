"""
Unit Tests for Concrete Workability Simulation Engine (IS 1199)
"""

import pytest
from app.simulation.concrete_workability import (
    ConcreteWorkabilityEngine,
    ConcreteWorkabilityInput,
    ConcreteWorkabilityOutput,
)


@pytest.fixture
def engine():
    return ConcreteWorkabilityEngine()


def test_default_workability(engine):
    inp = ConcreteWorkabilityInput()
    out = engine.calculate(inp)
    assert isinstance(out, ConcreteWorkabilityOutput)
    assert out.water_cement_ratio == 0.50
    assert 50.0 <= out.slump_mm <= 120.0
    assert 0.80 <= out.compacting_factor <= 0.95
    assert out.degree_of_workability in ["Medium", "Low", "High"]


def test_low_water_dry_concrete(engine):
    inp = ConcreteWorkabilityInput(water_cement_ratio=0.36, admixture_dosage_percent=0.0)
    out = engine.calculate(inp)
    assert out.slump_mm < 30.0
    assert out.compacting_factor < 0.82
    assert out.vee_bee_seconds > 10.0


def test_superplasticizer_flow(engine):
    inp = ConcreteWorkabilityInput(water_cement_ratio=0.60, admixture_dosage_percent=1.5)
    out = engine.calculate(inp)
    assert out.slump_mm > 120.0
    assert out.compacting_factor > 0.90
    assert out.degree_of_workability in ["High", "Very High"]
