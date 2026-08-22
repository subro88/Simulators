"""
Combinational Digital Logic (Full Adder & MUX) Physics Engine
============================================================
Calculates Full-Adder Sum & Carry-Out, 4:1 Multiplexer routing,
and Karnaugh map (K-Map) minimized Boolean functions.
"""

from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CombinationalLogicInput(BaseModel):
    circuit_type: Literal["full_adder", "multiplexer_4to1"] = Field(
        default="full_adder",
        description="Combinational digital circuit topology"
    )
    input_a: bool = Field(default=True, description="Input A or Data D0")
    input_b: bool = Field(default=True, description="Input B or Data D1")
    input_c: bool = Field(default=False, description="Carry-In Cin or Data D2")
    input_d: bool = Field(default=True, description="Data D3 (for 4:1 MUX)")
    select_s0: bool = Field(default=False, description="MUX Select Bit S0")
    select_s1: bool = Field(default=False, description="MUX Select Bit S1")


class CombinationalLogicOutput(BaseModel):
    circuit_type: str
    output_1_name: str
    output_1_value: bool
    output_2_name: str
    output_2_value: bool
    boolean_status: str
    status_note: str


class CombinationalLogicEngine(BaseSimulationEngine):
    name = "combinational-logic"
    description = "Combinational digital logic circuits: Full-Adder (Sum, Carry) and 4:1 MUX data selection"

    def calculate(self, params: CombinationalLogicInput) -> CombinationalLogicOutput:
        if params.circuit_type == "full_adder":
            a = params.input_a
            b = params.input_b
            cin = params.input_c

            # Full Adder equations: Sum = A ^ B ^ Cin, Cout = (A & B) | (Cin & (A ^ B))
            sum_out = (a != b) != cin
            cout = (a and b) or (cin and (a != b))

            out1_name = "Sum (S)"
            out1_val = sum_out
            out2_name = "Carry-Out (Cout)"
            out2_val = cout

            bool_status = f"Full-Adder: {int(a)} + {int(b)} + {int(cin)} = {int(cout)}{int(sum_out)}_2 (Decimal {int(a)+int(b)+int(cin)})"
            type_title = "1-Bit Binary Full-Adder"

        else: # 4:1 MUX
            s0 = params.select_s0
            s1 = params.select_s1
            sel_idx = (1 if s0 else 0) + (2 if s1 else 0)
            data_inputs = [params.input_a, params.input_b, params.input_c, params.input_d]
            y_out = data_inputs[sel_idx]

            out1_name = "MUX Output (Y)"
            out1_val = y_out
            out2_name = "Selected Channel"
            out2_val = True

            bool_status = f"4:1 MUX: Select S1S0 = {int(s1)}{int(s0)}_2 -> Routed Channel D{sel_idx} = {int(y_out)}"
            type_title = "4-to-1 Digital Multiplexer (MUX)"

        note = f"{type_title}: {bool_status} | Output 1 = {int(out1_val)}, Output 2 = {int(out2_val)}."

        return CombinationalLogicOutput(
            circuit_type=type_title,
            output_1_name=out1_name,
            output_1_value=out1_val,
            output_2_name=out2_name,
            output_2_value=out2_val,
            boolean_status=bool_status,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "full_adder_1_plus_1": {
                "name": "Full-Adder 1 + 1 with Carry-In 0",
                "params": {"circuit_type": "full_adder", "input_a": True, "input_b": True, "input_c": False}
            },
            "mux_channel_d3": {
                "name": "4:1 MUX Selecting Channel D3 (S1S0 = 11)",
                "params": {"circuit_type": "multiplexer_4to1", "input_a": False, "input_b": False, "input_c": False, "input_d": True, "select_s0": True, "select_s1": True}
            }
        }
