"""
Sequential Digital Logic (Flip-Flops & Counters) Physics Engine
==============================================================
Calculates next state Q_next and Q_bar for JK, D, T Flip-Flops and 4-bit Binary Ripple Counter.
"""

from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class SequentialLogicInput(BaseModel):
    flip_flop_type: Literal["jk_ff", "d_ff", "t_ff", "ripple_counter"] = Field(
        default="jk_ff",
        description="Sequential logic circuit element"
    )
    current_state_q: bool = Field(default=False, description="Current state Q(t)")
    input_j_or_d_or_t: bool = Field(default=True, description="Primary control input J, D, or T")
    input_k: bool = Field(default=False, description="Secondary input K (for JK Flip-Flop)")
    counter_clock_pulses: int = Field(default=5, ge=0, le=100, description="Clock pulse count (for Ripple Counter)")


class SequentialLogicOutput(BaseModel):
    flip_flop_type: str
    current_state_q: bool
    next_state_q: bool
    next_state_q_bar: bool
    counter_value_hex: str
    counter_value_decimal: int
    status_note: str


class SequentialLogicEngine(BaseSimulationEngine):
    name = "sequential-logic"
    description = "Sequential digital logic: JK/D/T edge-triggered Flip-Flops and 4-bit binary ripple counter"

    def calculate(self, params: SequentialLogicInput) -> SequentialLogicOutput:
        q = params.current_state_q
        j_d_t = params.input_j_or_d_or_t
        k = params.input_k

        if params.flip_flop_type == "jk_ff":
            # JK FF: Q_next = J*~Q + ~K*Q
            q_next = (j_d_t and not q) or (not k and q)
            type_title = "JK Flip-Flop"
            count_dec = 0
            count_hex = "0x0"

        elif params.flip_flop_type == "d_ff":
            # D FF: Q_next = D
            q_next = j_d_t
            type_title = "D Data Flip-Flop"
            count_dec = 0
            count_hex = "0x0"

        elif params.flip_flop_type == "t_ff":
            # T FF: Q_next = T ^ Q
            q_next = j_d_t != q
            type_title = "T Toggle Flip-Flop"
            count_dec = 0
            count_hex = "0x0"

        else: # ripple_counter
            count_dec = params.counter_clock_pulses % 16
            count_hex = hex(count_dec).upper()
            q_next = (count_dec % 2) == 1
            type_title = "4-Bit Binary Ripple Counter"

        q_bar = not q_next

        note = (
            f"{type_title}: Previous State Q(t) = {int(q)} -> "
            f"Clock Edge Next State Q(t+1) = {int(q_next)}, Q_bar = {int(q_bar)}"
            + (f" | Counter Value = {count_dec} ({count_hex})" if params.flip_flop_type == "ripple_counter" else "") + "."
        )

        return SequentialLogicOutput(
            flip_flop_type=type_title,
            current_state_q=q,
            next_state_q=q_next,
            next_state_q_bar=q_bar,
            counter_value_hex=count_hex,
            counter_value_decimal=count_dec,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "jk_toggle_mode": {
                "name": "JK Flip-Flop Toggle Mode (J=1, K=1)",
                "params": {"flip_flop_type": "jk_ff", "current_state_q": False, "input_j_or_d_or_t": True, "input_k": True}
            },
            "ripple_counter_7_pulses": {
                "name": "4-Bit Ripple Counter after 7 Clock Pulses",
                "params": {"flip_flop_type": "ripple_counter", "counter_clock_pulses": 7}
            }
        }
