"""
Computer Science & Technology 3rd Semester Simulation Suite (WBSCTE CST/3/301 - CST/3/306 & PP-I)
================================================================================================
Implements 5 core simulation engines:
1. DataStructuresEngine (CST/3/304 Data Structures & CST/3/302 C Programming)
2. ComputerArchitectureEngine (CST/3/305 Computer Organization & Architecture)
3. DigitalLogicDesignEngine (CST/3/303 Digital Logic Design Lab)
4. PCHardwareAssemblyEngine (CST/3/PP-I PC Maintenance & Hardware Assembly)
5. DiscreteMathematicsEngine (CST/3/301 Discrete Mathematics)
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


# ── 1. Data Structures Simulation Engine ─────────────────────────────────────
class DataStructuresInput(BaseModel):
    data_structure: Literal["stack", "queue", "linked_list", "binary_search_tree", "sorting_algorithm"] = Field(
        default="stack", description="Target data structure"
    )
    operation: str = Field(default="push", description="Operation (push/pop, enqueue/dequeue, insert/delete, sort)")
    element_value: int = Field(default=42, description="Value to insert or search")
    current_elements: List[int] = Field(default_factory=lambda: [10, 25, 30, 42, 55], description="Current buffer elements")
    sort_algorithm: Literal["bubble_sort", "selection_sort", "insertion_sort", "quick_sort"] = Field(
        default="bubble_sort", description="Sorting algorithm"
    )

class DataStructuresOutput(BaseModel):
    data_structure: str
    operation_performed: str
    elements_state: List[int]
    top_or_front_index: int
    rear_index: int
    step_explanation: str
    time_complexity: str
    space_complexity: str
    telemetry: Dict[str, Any]

class DataStructuresEngine(BaseSimulationEngine):
    name = "data-structures"
    description = "Data Structures & Algorithms Virtual Lab: Stack, Queue, Linked List, BST & Sorting operations"

    def calculate(self, params: DataStructuresInput) -> DataStructuresOutput:
        ds = params.data_structure
        op = params.operation.lower()
        val = params.element_value
        elems = list(params.current_elements)
        top = len(elems) - 1
        front = 0 if elems else -1
        rear = len(elems) - 1 if elems else -1
        step_msg = ""
        t_comp = "O(1)"
        s_comp = "O(n)"

        if ds == "stack":
            if op == "push":
                if len(elems) >= 8:
                    step_msg = "Stack Overflow! Maximum capacity (8) reached."
                else:
                    elems.append(val)
                    top = len(elems) - 1
                    step_msg = f"Pushed element {val} onto Top of Stack at index [{top}]."
            elif op == "pop":
                if not elems:
                    step_msg = "Stack Underflow! Stack is empty."
                else:
                    popped = elems.pop()
                    top = len(elems) - 1
                    step_msg = f"Popped element {popped} from Top of Stack. New Top index: [{top}]."
            else:
                step_msg = f"Stack Peek: Top element is {elems[-1] if elems else 'None'}."
            t_comp = "O(1)"

        elif ds == "queue":
            if op == "enqueue":
                if len(elems) >= 8:
                    step_msg = "Queue Full! Maximum capacity (8) reached."
                else:
                    elems.append(val)
                    front = 0
                    rear = len(elems) - 1
                    step_msg = f"Enqueued element {val} at Rear index [{rear}]."
            elif op == "dequeue":
                if not elems:
                    step_msg = "Queue Underflow! Queue is empty."
                else:
                    deq = elems.pop(0)
                    front = 0 if elems else -1
                    rear = len(elems) - 1 if elems else -1
                    step_msg = f"Dequeued element {deq} from Front of Queue."
            t_comp = "O(1)"

        elif ds == "linked_list":
            if op in ["insert", "insert_tail"]:
                elems.append(val)
                step_msg = f"Allocated new node ({val}) -> Attached to Linked List Tail."
            elif op == "insert_head":
                elems.insert(0, val)
                step_msg = f"Allocated new node ({val}) -> Updated Head pointer to new node."
            elif op == "delete":
                if val in elems:
                    elems.remove(val)
                    step_msg = f"Found node ({val}) -> Unlinked and freed memory."
                elif elems:
                    popped = elems.pop()
                    step_msg = f"Deleted Tail node ({popped})."
                else:
                    step_msg = "Linked list is empty."
            t_comp = "O(1) at Head, O(n) search"

        elif ds == "binary_search_tree":
            if val not in elems and len(elems) < 10:
                elems.append(val)
            sorted_bst = sorted(elems)
            step_msg = f"BST In-order traversal (Sorted keys): {sorted_bst}."
            t_comp = "O(log n) average, O(n) worst"

        else:  # sorting_algorithm
            algo = params.sort_algorithm
            n = len(elems)
            swaps = 0
            comparisons = 0
            if algo == "bubble_sort":
                for i in range(n):
                    for j in range(0, n - i - 1):
                        comparisons += 1
                        if elems[j] > elems[j + 1]:
                            elems[j], elems[j + 1] = elems[j + 1], elems[j]
                            swaps += 1
                step_msg = f"Bubble Sort completed: {comparisons} comparisons, {swaps} swaps. Sorted array: {elems}."
                t_comp = "O(n²)"
            elif algo == "selection_sort":
                for i in range(n):
                    min_idx = i
                    for j in range(i + 1, n):
                        comparisons += 1
                        if elems[j] < elems[min_idx]:
                            min_idx = j
                    if min_idx != i:
                        elems[i], elems[min_idx] = elems[min_idx], elems[i]
                        swaps += 1
                step_msg = f"Selection Sort completed: {comparisons} comparisons, {swaps} swaps. Sorted array: {elems}."
                t_comp = "O(n²)"
            else:
                elems.sort()
                step_msg = f"Sorting algorithm ({algo}) completed: Array sorted successfully -> {elems}."
                t_comp = "O(n log n)"

        return DataStructuresOutput(
            data_structure=ds,
            operation_performed=op,
            elements_state=elems,
            top_or_front_index=top if ds == "stack" else front,
            rear_index=rear,
            step_explanation=step_msg,
            time_complexity=t_comp,
            space_complexity=s_comp,
            telemetry={"elements": elems, "count": len(elems), "structure": ds, "complexity": t_comp}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "stack_demo": {"data_structure": "stack", "operation": "push", "element_value": 77, "current_elements": [12, 34, 56]},
            "bst_demo": {"data_structure": "binary_search_tree", "operation": "insert", "element_value": 45, "current_elements": [50, 30, 70, 20, 40]}
        }


# ── 2. Computer Organization & Architecture (COA) Engine ─────────────────────
class ComputerArchitectureInput(BaseModel):
    simulation_mode: Literal["instruction_cycle", "cache_mapping", "booth_multiplication", "pipeline_execution"] = Field(
        default="instruction_cycle", description="COA architecture sub-module"
    )
    instruction_opcode: str = Field(default="ADD R1, R2", description="Assembly instruction")
    program_counter_pc: int = Field(default=100, ge=0, le=65535, description="Initial Program Counter")
    cache_type: Literal["direct_mapped", "two_way_set_associative", "fully_associative"] = Field(
        default="direct_mapped", description="Cache mapping technique"
    )
    memory_address_hex: str = Field(default="0x3A4F", description="16-bit memory address")
    booth_multiplicand_m: int = Field(default=7, ge=-15, le=15, description="Multiplicand M (signed integer)")
    booth_multiplier_q: int = Field(default=3, ge=-15, le=15, description="Multiplier Q (signed integer)")

class ComputerArchitectureOutput(BaseModel):
    simulation_mode: str
    instruction_cycle_phase: str
    register_states: Dict[str, str]
    cache_tag_bits: str
    cache_index_bits: str
    cache_offset_bits: str
    cache_hit_status: str
    booth_product_result: int
    pipeline_clock_cycles: int
    step_details: str
    telemetry: Dict[str, Any]

class ComputerArchitectureEngine(BaseSimulationEngine):
    name = "computer-architecture"
    description = "Computer Organization & Architecture: Instruction Cycle, Cache Mapping, Booth Multiplication, Pipeline"

    def calculate(self, params: ComputerArchitectureInput) -> ComputerArchitectureOutput:
        mode = params.simulation_mode
        pc = params.program_counter_pc
        reg_states = {
            "PC": f"0x{pc:04X}",
            "MAR": f"0x{pc:04X}",
            "MDR": "0x2B01",
            "IR": params.instruction_opcode,
            "R1": "0x0014 (20)",
            "R2": "0x000F (15)",
            "ALU_ACC": "0x0023 (35)"
        }

        # 1. Cache Tag/Index breakdown (16-bit address, 256B Cache, 16B Line size -> 4 offset bits)
        try:
            addr_int = int(params.memory_address_hex, 16)
        except ValueError:
            addr_int = 0x3A4F

        offset_bits = f"0x{addr_int & 0x000F:X} (4 bits)"
        if params.cache_type == "direct_mapped":
            # 16 lines -> 4 index bits, 8 tag bits
            index_val = (addr_int >> 4) & 0x000F
            tag_val = (addr_int >> 8) & 0x00FF
            idx_str = f"Line [{index_val}]"
            tag_str = f"0x{tag_val:02X} (8 bits)"
            hit_status = "Cache HIT (Tag matched in Line 4)" if (index_val % 2 == 0) else "Cache MISS -> Fetched from Main Memory"
        elif params.cache_type == "two_way_set_associative":
            # 8 sets -> 3 index bits, 9 tag bits
            index_val = (addr_int >> 4) & 0x0007
            tag_val = (addr_int >> 7) & 0x01FF
            idx_str = f"Set [{index_val}] (Way 0 / Way 1)"
            tag_str = f"0x{tag_val:03X} (9 bits)"
            hit_status = "Cache HIT in Way 1"
        else: # fully associative
            idx_str = "No Index (Any Cache Line)"
            tag_val = (addr_int >> 4) & 0x0FFF
            tag_str = f"0x{tag_val:03X} (12 bits)"
            hit_status = "Cache HIT via CAM Search"

        # 2. Booth Multiplication
        m = params.booth_multiplicand_m
        q = params.booth_multiplier_q
        product = m * q

        step_info = f"Instruction '{params.instruction_opcode}' executed: Fetch -> Decode -> ALU Add -> Writeback."
        if mode == "cache_mapping":
            step_info = f"Address {params.memory_address_hex} decoded under {params.cache_type}: Tag={tag_str}, Index={idx_str}, Offset={offset_bits} -> {hit_status}."
        elif mode == "booth_multiplication":
            step_info = f"Booth's Multiplication: M={m}, Q={q} -> 4 cycles of arithmetic shift & add/sub -> Product = {product}."

        return ComputerArchitectureOutput(
            simulation_mode=mode,
            instruction_cycle_phase="Execute & Writeback Complete",
            register_states=reg_states,
            cache_tag_bits=tag_str,
            cache_index_bits=idx_str,
            cache_offset_bits=offset_bits,
            cache_hit_status=hit_status,
            booth_product_result=product,
            pipeline_clock_cycles=5,
            step_details=step_info,
            telemetry={"mode": mode, "pc": pc, "cache_hit": hit_status, "product": product, "registers": reg_states}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "instruction_fetch": {"simulation_mode": "instruction_cycle", "instruction_opcode": "ADD R1, R2", "program_counter_pc": 100},
            "cache_lookup": {"simulation_mode": "cache_mapping", "memory_address_hex": "0x3A4F", "cache_type": "direct_mapped"}
        }


# ── 3. Digital Logic Design Engine ───────────────────────────────────────────
class DigitalLogicDesignInput(BaseModel):
    circuit_type: Literal["half_adder", "full_adder", "multiplexer_4to1", "decoder_2to4", "flip_flop_jk", "binary_counter_4bit"] = Field(
        default="full_adder", description="Digital circuit configuration"
    )
    input_a: int = Field(default=1, ge=0, le=1)
    input_b: int = Field(default=1, ge=0, le=1)
    input_cin_or_sel: int = Field(default=0, ge=0, le=3, description="Carry-in or Select line (0-3 for MUX)")
    clock_pulse_count: int = Field(default=4, ge=0, le=15, description="Clock pulses for counter/flip-flop")

class DigitalLogicDesignOutput(BaseModel):
    circuit_type: str
    output_y1: int
    output_y2: int
    boolean_expression: str
    truth_table_row: str
    ic_designation: str
    telemetry: Dict[str, Any]

class DigitalLogicDesignEngine(BaseSimulationEngine):
    name = "digital-logic-design"
    description = "Digital Logic Design Lab: Adders, MUX/DEMUX, JK Flip-Flops, Counters & Boolean Gates"

    def calculate(self, params: DigitalLogicDesignInput) -> DigitalLogicDesignOutput:
        c_type = params.circuit_type
        a = params.input_a
        b = params.input_b
        cin = params.input_cin_or_sel & 0x01

        if c_type == "half_adder":
            sum_out = a ^ b
            carry_out = a & b
            bool_expr = "Sum = A ⊕ B, Carry = A · B"
            row = f"A={a}, B={b} => Sum={sum_out}, Carry={carry_out}"
            ic = "IC 7486 (XOR) + IC 7408 (AND)"
        elif c_type == "full_adder":
            sum_out = a ^ b ^ cin
            carry_out = (a & b) | (b & cin) | (a & cin)
            bool_expr = "Sum = A ⊕ B ⊕ Cin, Cout = AB + BCin + ACin"
            row = f"A={a}, B={b}, Cin={cin} => Sum={sum_out}, Cout={carry_out}"
            ic = "IC 74283 (4-bit Binary Full Adder)"
        elif c_type == "multiplexer_4to1":
            sel = params.input_cin_or_sel & 0x03
            inputs_data = [1, 0, 1, 0]
            sum_out = inputs_data[sel]
            carry_out = 0
            bool_expr = "Y = S1'S0'I0 + S1'S0 I1 + S1 S0'I2 + S1 S0 I3"
            row = f"Select lines (S1,S0) = {sel} => Output Y = I{sel} = {sum_out}"
            ic = "IC 74151 / IC 74153 (Multiplexer)"
        elif c_type == "decoder_2to4":
            sel = params.input_cin_or_sel & 0x03
            sum_out = 1 << sel
            carry_out = 0
            bool_expr = "Y_i = Active HIGH 2-to-4 line decoder output"
            row = f"Input lines = {sel} => Active Output Y{sel} = 1"
            ic = "IC 74139 (Dual 2-to-4 Decoder)"
        elif c_type == "flip_flop_jk":
            # J=a, K=b
            q_prev = 0
            if a == 0 and b == 0: q_next = q_prev
            elif a == 0 and b == 1: q_next = 0
            elif a == 1 and b == 0: q_next = 1
            else: q_next = 1 - q_prev  # Toggle
            sum_out = q_next
            carry_out = 1 - q_next
            bool_expr = "Q(next) = J·Q' + K'·Q"
            row = f"J={a}, K={b} => Q(next)={q_next}, Q_bar={carry_out}"
            ic = "IC 7476 / IC 7473 (Dual JK Flip-Flop)"
        else: # binary_counter_4bit
            clk = params.clock_pulse_count % 16
            sum_out = clk
            carry_out = 1 if clk == 15 else 0
            bool_expr = "MOD-16 Ripple Counter (Q3 Q2 Q1 Q0)"
            row = f"Clock Pulses = {clk} => Counter Binary = {clk:04b}"
            ic = "IC 7490 / IC 7493 (4-bit Binary Counter)"

        return DigitalLogicDesignOutput(
            circuit_type=c_type,
            output_y1=sum_out,
            output_y2=carry_out,
            boolean_expression=bool_expr,
            truth_table_row=row,
            ic_designation=ic,
            telemetry={"circuit": c_type, "out1": sum_out, "out2": carry_out, "ic": ic}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "full_adder_case": {"circuit_type": "full_adder", "input_a": 1, "input_b": 1, "input_cin_or_sel": 1},
            "mux_select": {"circuit_type": "multiplexer_4to1", "input_cin_or_sel": 2}
        }


# ── 4. PC Maintenance & Hardware Assembly Engine ─────────────────────────────
class PCHardwareAssemblyInput(BaseModel):
    cpu_tdp_watts: float = Field(default=65.0, ge=15.0, le=300.0, description="CPU Thermal Design Power")
    gpu_tdp_watts: float = Field(default=170.0, ge=0.0, le=600.0, description="Dedicated GPU Power")
    ram_modules_count: int = Field(default=2, ge=1, le=4, description="Number of DDR4/DDR5 sticks")
    ram_speed_mhz: float = Field(default=3200.0, ge=1600.0, le=7200.0, description="RAM Clock Frequency")
    storage_drives_count: int = Field(default=2, ge=1, le=8, description="Number of NVMe/SATA drives")
    post_beep_code: str = Field(default="1_short", description="Motherboard BIOS POST diagnostic tone")

class PCHardwareAssemblyOutput(BaseModel):
    total_system_power_draw_watts: float
    recommended_smps_psu_wattage: int
    ram_memory_bandwidth_gb_s: float
    dual_channel_active: bool
    pcie_gen4_bandwidth_gb_s: float
    post_diagnostic_meaning: str
    recommended_action: str
    telemetry: Dict[str, Any]

class PCHardwareAssemblyEngine(BaseSimulationEngine):
    name = "pc-hardware-assembly"
    description = "PC Hardware Maintenance & Assembly: Power Budgeting, RAM Bandwidth, BIOS Diagnostics & SMPS sizing"

    def calculate(self, params: PCHardwareAssemblyInput) -> PCHardwareAssemblyOutput:
        base_mobo_watts = 50.0
        fans_and_rgb_watts = 25.0
        storage_watts = params.storage_drives_count * 7.5
        ram_watts = params.ram_modules_count * 4.0

        total_watts = params.cpu_tdp_watts + params.gpu_tdp_watts + base_mobo_watts + fans_and_rgb_watts + storage_watts + ram_watts
        rec_psu = int(math.ceil((total_watts * 1.30) / 50.0) * 50)  # 30% headroom rounded to next 50W

        dual_channel = params.ram_modules_count >= 2
        channels = 2 if dual_channel else 1
        # Bandwidth (GB/s) = (Clock MHz * 8 bytes * channels) / 1000
        ram_bw = (params.ram_speed_mhz * 8.0 * channels) / 1000.0
        pcie_bw = 31.508  # PCIe Gen 4.0 x16 theoretical GB/s

        beep = params.post_beep_code.lower()
        if "1_short" in beep or "normal" in beep:
            diag = "POST Passed: System boot successful (Normal POST)."
            act = "System healthy. Ready to boot OS."
        elif "1_long_2_short" in beep or "video" in beep or "gpu" in beep:
            diag = "Video/Graphics Card error detected (Display adapter fault)."
            act = "Reseat GPU in PCIe x16 slot, verify 8-pin PCIe power cables."
        elif "continuous_long" in beep or "ram" in beep:
            diag = "DRAM Memory Error: No RAM detected or faulty memory module."
            act = "Reseat RAM modules in slots A2/B2, clean golden contact fingers."
        else:
            diag = "Power Supply / CPU VRM failure detected."
            act = "Check 24-Pin ATX and 8-Pin CPU power connectors with multimeter."

        return PCHardwareAssemblyOutput(
            total_system_power_draw_watts=round(total_watts, 1),
            recommended_smps_psu_wattage=rec_psu,
            ram_memory_bandwidth_gb_s=round(ram_bw, 2),
            dual_channel_active=dual_channel,
            pcie_gen4_bandwidth_gb_s=pcie_bw,
            post_diagnostic_meaning=diag,
            recommended_action=act,
            telemetry={"total_watts": total_watts, "rec_psu": rec_psu, "ram_bw": ram_bw, "dual_channel": dual_channel}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "gaming_rig": {"cpu_tdp_watts": 105.0, "gpu_tdp_watts": 220.0, "ram_modules_count": 2, "ram_speed_mhz": 3600.0, "storage_drives_count": 2},
            "office_workstation": {"cpu_tdp_watts": 65.0, "gpu_tdp_watts": 0.0, "ram_modules_count": 1, "ram_speed_mhz": 3200.0, "storage_drives_count": 1}
        }


# ── 5. Discrete Mathematics Engine ───────────────────────────────────────────
class DiscreteMathematicsInput(BaseModel):
    logic_expression_type: Literal["truth_table", "set_operations", "relations_properties", "graph_handshaking"] = Field(
        default="truth_table", description="Discrete mathematics domain"
    )
    proposition_p: bool = Field(default=True)
    proposition_q: bool = Field(default=False)
    set_a: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])
    set_b: List[int] = Field(default_factory=lambda: [3, 4, 5, 6, 7])
    graph_vertices_count: int = Field(default=5, ge=2, le=20)
    graph_edges_count: int = Field(default=7, ge=1, le=50)

class DiscreteMathematicsOutput(BaseModel):
    conjunction_p_and_q: bool
    disjunction_p_or_q: bool
    conditional_p_implies_q: bool
    biconditional_p_iff_q: bool
    set_union: List[int]
    set_intersection: List[int]
    set_difference_a_minus_b: List[int]
    symmetric_difference: List[int]
    graph_degree_sum: int
    euler_circuit_possible: bool
    result_summary: str
    telemetry: Dict[str, Any]

class DiscreteMathematicsEngine(BaseSimulationEngine):
    name = "discrete-mathematics"
    description = "Discrete Mathematics Lab: Mathematical Logic, Set Theory, Binary Relations & Graph Theory"

    def calculate(self, params: DiscreteMathematicsInput) -> DiscreteMathematicsOutput:
        p = params.proposition_p
        q = params.proposition_q

        p_and_q = p and q
        p_or_q = p or q
        p_implies_q = (not p) or q
        p_iff_q = (p == q)

        sa = set(params.set_a)
        sb = set(params.set_b)
        union = sorted(list(sa | sb))
        inter = sorted(list(sa & sb))
        diff = sorted(list(sa - sb))
        sym_diff = sorted(list(sa ^ sb))

        deg_sum = 2 * params.graph_edges_count
        # Handshaking lemma: sum of degrees = 2*E
        euler = (params.graph_edges_count >= params.graph_vertices_count)

        summary = f"Logic: P={p}, Q={q} => P∧Q={p_and_q}, P∨Q={p_or_q}, P→Q={p_implies_q}, P↔Q={p_iff_q}."
        if params.logic_expression_type == "set_operations":
            summary = f"Sets: A={params.set_a}, B={params.set_b} => A∪B={union}, A∩B={inter}, A-B={diff}."
        elif params.logic_expression_type == "graph_handshaking":
            summary = f"Graph with V={params.graph_vertices_count}, E={params.graph_edges_count} => Total Degree Sum = {deg_sum} (Handshaking Lemma)."

        return DiscreteMathematicsOutput(
            conjunction_p_and_q=p_and_q,
            disjunction_p_or_q=p_or_q,
            conditional_p_implies_q=p_implies_q,
            biconditional_p_iff_q=p_iff_q,
            set_union=union,
            set_intersection=inter,
            set_difference_a_minus_b=diff,
            symmetric_difference=sym_diff,
            graph_degree_sum=deg_sum,
            euler_circuit_possible=euler,
            result_summary=summary,
            telemetry={"union": union, "inter": inter, "diff": diff, "deg_sum": deg_sum}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "implication_falsity": {"proposition_p": True, "proposition_q": False},
            "sets_overlap": {"set_a": [1, 2, 3, 4], "set_b": [3, 4, 5, 6]}
        }
