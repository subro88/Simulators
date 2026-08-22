"""
Digital Logic Gates & Boolean Algebra Physics Engine
===================================================
Calculates truth table outputs Y for AND, OR, NOT, NAND, NOR, XOR, XNOR gates,
propagation delays, and logic level voltages (TTL/CMOS).
"""

from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class LogicGatesInput(BaseModel):
    gate_type: Literal["and", "or", "nand", "nor", "xor", "xnor", "not"] = Field(
        default="and",
        description="Digital logic gate type"
    )
    input_a: bool = Field(default=True, description="Logic input A (High=True, Low=False)")
    input_b: bool = Field(default=True, description="Logic input B (High=True, Low=False)")


class LogicGatesOutput(BaseModel):
    gate_type: str
    boolean_expression: str
    output_y: bool
    output_logic_level: str
    status_note: str


class LogicGatesEngine(BaseSimulationEngine):
    name = "logic-gates"
    description = "Digital fundamental logic gates (AND, OR, NAND, NOR, XOR, XNOR) truth table evaluation"

    def calculate(self, params: LogicGatesInput) -> LogicGatesOutput:
        a = params.input_a
        b = params.input_b

        if params.gate_type == "and":
            y = a and b
            expr = "Y = A · B"
            title = "2-Input AND Gate"
        elif params.gate_type == "or":
            y = a or b
            expr = "Y = A + B"
            title = "2-Input OR Gate"
        elif params.gate_type == "nand":
            y = not (a and b)
            expr = "Y = NOT(A · B)"
            title = "2-Input NAND Gate"
        elif params.gate_type == "nor":
            y = not (a or b)
            expr = "Y = NOT(A + B)"
            title = "2-Input NOR Gate"
        elif params.gate_type == "xor":
            y = a != b
            expr = "Y = A ⊕ B"
            title = "2-Input XOR (Exclusive OR) Gate"
        elif params.gate_type == "xnor":
            y = a == b
            expr = "Y = NOT(A ⊕ B)"
            title = "2-Input XNOR Gate"
        else: # not
            y = not a
            expr = "Y = NOT(A)"
            title = "NOT Gate (Inverter)"

        lvl = "LOGIC 1 (HIGH — 5.0V)" if y else "LOGIC 0 (LOW — 0.0V)"

        note = f"{title} [{expr}]: Input A = {int(a)}, Input B = {int(b)} -> Output Y = {int(y)} ({lvl})."

        return LogicGatesOutput(
            gate_type=title,
            boolean_expression=expr,
            output_y=y,
            output_logic_level=lvl,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "xor_gate_diff": {
                "name": "XOR Gate Difference Detector (A=1, B=0)",
                "params": {"gate_type": "xor", "input_a": True, "input_b": False}
            },
            "nand_gate_universal": {
                "name": "NAND Universal Gate (A=1, B=1)",
                "params": {"gate_type": "nand", "input_a": True, "input_b": True}
            }
        }
