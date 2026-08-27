"""
Unit Tests for WBSCTE Computer Science & Technology 4th Semester Simulation Suite
================================================================================
Validates Microprocessor8085Engine, ComputerNetworksEngine, RdbmsSqlDatabaseEngine,
ObjectOrientedProgrammingEngine, ComputerGraphicsEngine, and WebDevelopmentEngine.
"""

import pytest
from app.simulation import (
    Microprocessor8085Engine, Microprocessor8085Input,
    ComputerNetworksEngine, ComputerNetworksInput,
    RdbmsSqlDatabaseEngine, RdbmsSqlDatabaseInput,
    ObjectOrientedProgrammingEngine, ObjectOrientedProgrammingInput,
    ComputerGraphicsEngine, ComputerGraphicsInput,
    WebDevelopmentEngine, WebDevelopmentInput,
)


def test_microprocessor_8085():
    engine = Microprocessor8085Engine()
    # Test ADD B instruction
    inp = Microprocessor8085Input(instruction="ADD B", accumulator_a=0x14, register_b=0x06)
    out = engine.calculate(inp)
    assert "0x1A" in out.registers["A"]
    assert out.flags["Zero (Z)"] == 0
    assert out.flags["Carry (CY)"] == 0
    assert out.t_states_count == 4


def test_computer_networks_subnetting():
    engine = ComputerNetworksEngine()
    inp = ComputerNetworksInput(ip_address="192.168.10.75", cidr_prefix=26)
    out = engine.calculate(inp)
    assert out.subnet_mask == "255.255.255.192"
    assert out.network_address == "192.168.10.64"
    assert out.broadcast_address == "192.168.10.127"
    assert out.total_usable_hosts == 62


def test_rdbms_sql_database():
    engine = RdbmsSqlDatabaseEngine()
    inp = RdbmsSqlDatabaseInput(sql_query="SELECT name FROM Employees WHERE salary > 45000", normalization_check_nf="3NF")
    out = engine.calculate(inp)
    assert out.rows_returned_count > 0
    assert "3NF" in out.normalization_status
    assert "Atomicity" in out.acid_property_check


def test_object_oriented_programming():
    engine = ObjectOrientedProgrammingEngine()
    inp = ObjectOrientedProgrammingInput(concept_demo="polymorphism_vtable", derived_class_name="Rectangle", virtual_method_call="area()")
    out = engine.calculate(inp)
    assert "vtable" in out.vptr_binding_resolution
    assert "Rectangle" in out.class_hierarchy


def test_computer_graphics_bresenham():
    engine = ComputerGraphicsEngine()
    inp = ComputerGraphicsInput(algorithm_type="bresenham_line", start_x=0, start_y=0, end_x=5, end_y=3)
    out = engine.calculate(inp)
    assert len(out.calculated_pixels) > 0
    assert out.calculated_pixels[0] == {"x": 0, "y": 0}
    assert len(out.transformation_matrix) == 3


def test_web_development_engine():
    engine = WebDevelopmentEngine()
    inp = WebDevelopmentInput(layout_mode="flexbox_row", dom_elements_count=4)
    out = engine.calculate(inp)
    assert out.http_status_code == 200
    assert "display: flex;" in out.css_rules_applied
    assert len(out.http_response_body["data"]) == 4
