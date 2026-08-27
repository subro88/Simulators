"""
Unit Tests for WBSCTE Computer Science & Technology 5th Semester Simulation Suite
================================================================================
Validates SoftwareEngineeringEngine, JavaProgrammingEngine, OperatingSystemsEngine,
TheoryOfComputationEngine, NetworkAdministrationEngine, and MultimediaAnimationEngine.
"""

import pytest
from app.simulation import (
    SoftwareEngineeringEngine, SoftwareEngineeringInput,
    JavaProgrammingEngine, JavaProgrammingInput,
    OperatingSystemsEngine, OperatingSystemsInput,
    TheoryOfComputationEngine, TheoryOfComputationInput,
    NetworkAdministrationEngine, NetworkAdministrationInput,
    MultimediaAnimationEngine, MultimediaAnimationInput,
)


def test_software_engineering_cocomo():
    engine = SoftwareEngineeringEngine()
    inp = SoftwareEngineeringInput(estimation_model="basic_cocomo", kloc_lines_of_code=35.0, project_mode="organic")
    out = engine.calculate(inp)
    assert out.effort_person_months > 0.0
    assert out.development_time_months > 0.0
    assert out.cyclomatic_complexity_vg == 6  # 14 - 10 + 2


def test_java_programming_multithreading():
    engine = JavaProgrammingEngine()
    inp = JavaProgrammingInput(simulation_demo="multithreading_sync", thread_count=3, use_synchronized_block=True)
    out = engine.calculate(inp)
    assert out.final_counter_value == 3000
    assert not out.race_condition_detected
    assert len(out.thread_states) == 3


def test_operating_systems_scheduling():
    engine = OperatingSystemsEngine()
    inp = OperatingSystemsInput(scheduling_algorithm="round_robin", time_quantum_rr=2, page_reference_string="7,0,1,2,0,3,0,4")
    out = engine.calculate(inp)
    assert len(out.gantt_chart_timeline) > 0
    assert out.page_faults_count > 0
    assert "SAFE" in out.banker_safety_state


def test_theory_of_computation_dfa():
    engine = TheoryOfComputationEngine()
    inp = TheoryOfComputationInput(automata_type="dfa", input_string="101101", target_language="ends_with_01")
    out = engine.calculate(inp)
    assert out.is_string_accepted is True
    assert out.final_state_reached == "q2"


def test_network_administration_dns():
    engine = NetworkAdministrationEngine()
    inp = NetworkAdministrationInput(operation_mode="dns_resolution", domain_to_resolve="www.wbscte.co.in")
    out = engine.calculate(inp)
    assert len(out.protocol_steps) > 0
    assert out.resolved_ip_address == "104.21.48.192"


def test_multimedia_animation_bezier():
    engine = MultimediaAnimationEngine()
    inp = MultimediaAnimationInput(technique_mode="bezier_keyframing", interpolation_t=0.5, compression_quality_q=80)
    out = engine.calculate(inp)
    assert 0.0 <= out.interpolated_position_x <= 1.0
    assert out.psnr_quality_db > 35.0
    assert "A" in out.huffman_code_tree
