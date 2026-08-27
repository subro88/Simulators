"""
Unit Tests for WBSCTE Computer Science & Technology 3rd Semester Simulation Suite
================================================================================
Validates DataStructuresEngine, ComputerArchitectureEngine, DigitalLogicDesignEngine,
PCHardwareAssemblyEngine, and DiscreteMathematicsEngine.
"""

import pytest
from app.simulation import (
    DataStructuresEngine, DataStructuresInput,
    ComputerArchitectureEngine, ComputerArchitectureInput,
    DigitalLogicDesignEngine, DigitalLogicDesignInput,
    PCHardwareAssemblyEngine, PCHardwareAssemblyInput,
    DiscreteMathematicsEngine, DiscreteMathematicsInput,
)


def test_data_structures_stack_queue():
    engine = DataStructuresEngine()
    # Stack Push
    inp_push = DataStructuresInput(data_structure="stack", operation="push", element_value=99, current_elements=[10, 20])
    out_push = engine.calculate(inp_push)
    assert 99 in out_push.elements_state
    assert out_push.top_or_front_index == 2

    # Queue Enqueue
    inp_q = DataStructuresInput(data_structure="queue", operation="enqueue", element_value=45, current_elements=[1, 2])
    out_q = engine.calculate(inp_q)
    assert out_q.elements_state[-1] == 45
    assert out_q.rear_index == 2

    # Bubble Sort
    inp_sort = DataStructuresInput(data_structure="sorting_algorithm", sort_algorithm="bubble_sort", current_elements=[5, 1, 4, 2, 8])
    out_sort = engine.calculate(inp_sort)
    assert out_sort.elements_state == [1, 2, 4, 5, 8]


def test_computer_architecture_coa():
    engine = ComputerArchitectureEngine()
    # Cache mapping
    inp_cache = ComputerArchitectureInput(simulation_mode="cache_mapping", memory_address_hex="0x3A4F", cache_type="direct_mapped")
    out_cache = engine.calculate(inp_cache)
    assert "Line" in out_cache.cache_index_bits
    assert "Tag" in out_cache.cache_hit_status or "Cache" in out_cache.cache_hit_status

    # Booth multiplication
    inp_booth = ComputerArchitectureInput(simulation_mode="booth_multiplication", booth_multiplicand_m=7, booth_multiplier_q=3)
    out_booth = engine.calculate(inp_booth)
    assert out_booth.booth_product_result == 21


def test_digital_logic_design_circuits():
    engine = DigitalLogicDesignEngine()
    # Full Adder: A=1, B=1, Cin=1 => Sum=1, Cout=1
    inp_fa = DigitalLogicDesignInput(circuit_type="full_adder", input_a=1, input_b=1, input_cin_or_sel=1)
    out_fa = engine.calculate(inp_fa)
    assert out_fa.output_y1 == 1  # Sum
    assert out_fa.output_y2 == 1  # Cout
    assert "74283" in out_fa.ic_designation

    # 4:1 Mux
    inp_mux = DigitalLogicDesignInput(circuit_type="multiplexer_4to1", input_cin_or_sel=2)
    out_mux = engine.calculate(inp_mux)
    assert out_mux.output_y1 in [0, 1]


def test_pc_hardware_assembly():
    engine = PCHardwareAssemblyEngine()
    inp = PCHardwareAssemblyInput(cpu_tdp_watts=105.0, gpu_tdp_watts=220.0, ram_modules_count=2, ram_speed_mhz=3600.0)
    out = engine.calculate(inp)
    assert out.recommended_smps_psu_wattage >= 500
    assert out.dual_channel_active is True
    assert out.ram_memory_bandwidth_gb_s > 40.0
    assert "POST" in out.post_diagnostic_meaning


def test_discrete_mathematics():
    engine = DiscreteMathematicsEngine()
    inp = DiscreteMathematicsInput(
        logic_expression_type="set_operations",
        proposition_p=True,
        proposition_q=False,
        set_a=[1, 2, 3, 4],
        set_b=[3, 4, 5, 6],
        graph_vertices_count=4,
        graph_edges_count=6
    )
    out = engine.calculate(inp)
    assert out.conditional_p_implies_q is False  # True -> False is False
    assert out.set_union == [1, 2, 3, 4, 5, 6]
    assert out.set_intersection == [3, 4]
    assert out.graph_degree_sum == 12  # 2 * 6
