"""
CNC G-Code Motion & Interpolation Physics Engine
================================================
Calculates G01 linear and G02/G03 circular arc block execution times t,
feedrates, and 3-axis motion trajectory coordinates.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class CncGcodeMachiningInput(BaseModel):
    gcode_command: Literal["G00_rapid", "G01_linear", "G02_cw_arc", "G03_ccw_arc"] = Field(default="G01_linear", description="CNC G-code motion mode")
    programmed_feedrate_mm_min: float = Field(default=500.0, ge=10.0, le=10000.0, description="Feedrate F in mm/min")
    start_x_mm: float = Field(default=0.0, ge=-500.0, le=500.0, description="Start X coordinate")
    start_y_mm: float = Field(default=0.0, ge=-500.0, le=500.0, description="Start Y coordinate")
    target_x_mm: float = Field(default=100.0, ge=-500.0, le=500.0, description="Target X coordinate")
    target_y_mm: float = Field(default=50.0, ge=-500.0, le=500.0, description="Target Y coordinate")
    arc_radius_mm: float = Field(default=50.0, ge=1.0, le=500.0, description="Arc radius R in mm (for G02/G03)")


class CncGcodeMachiningOutput(BaseModel):
    gcode_command: str
    path_length_mm: float
    actual_feedrate_mm_min: float
    block_execution_time_sec: float
    chip_load_per_sec_mm: float
    status_note: str


class CncGcodeMachiningEngine(BaseSimulationEngine):
    name = "cnc-gcode-machining"
    description = "CNC Milling Machine G-code motion controller: G00/G01/G02/G03 trajectory length, block time t, and feedrate"

    def calculate(self, params: CncGcodeMachiningInput) -> CncGcodeMachiningOutput:
        cmd = params.gcode_command
        f_prog = params.programmed_feedrate_mm_min
        x0, y0 = params.start_x_mm, params.start_y_mm
        x1, y1 = params.target_x_mm, params.target_y_mm
        r_arc = params.arc_radius_mm

        # Linear distance
        dx, dy = x1 - x0, y1 - y0
        d_chord = math.sqrt(dx**2 + dy**2)

        if cmd == "G00_rapid":
            f_actual = 5000.0  # Rapid positioning feed
            l_path = d_chord
            title = "G00 Rapid Positioning (Non-Cutting)"

        elif cmd == "G01_linear":
            f_actual = f_prog
            l_path = d_chord
            title = "G01 Linear Cutting Interpolation"

        else: # G02 or G03 Arc
            f_actual = f_prog
            if d_chord <= 2.0 * r_arc:
                theta = 2.0 * math.asin(d_chord / (2.0 * r_arc))
                l_path = r_arc * theta
            else:
                l_path = d_chord
            title = "G02 Circular Arc Clockwise" if cmd == "G02_cw_arc" else "G03 Circular Arc Counter-Clockwise"

        # Block Execution Time t = L / (F / 60) in seconds
        t_sec = (l_path / (f_actual / 60.0)) if f_actual > 0 else 0.0
        chip_load_sec = l_path / t_sec if t_sec > 0 else 0.0

        note = (
            f"CNC G-Code [{cmd}]: {title} from ({x0:.0f},{y0:.0f}) to ({x1:.0f},{y1:.0f}) | "
            f"Trajectory Length = {l_path:.1f} mm | Feedrate = {f_actual:.0f} mm/min | "
            f"Block Time = {t_sec:.2f} seconds."
        )

        return CncGcodeMachiningOutput(
            gcode_command=title,
            path_length_mm=float(l_path),
            actual_feedrate_mm_min=float(f_actual),
            block_execution_time_sec=float(t_sec),
            chip_load_per_sec_mm=float(chip_load_sec),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "g01_linear_feed": {
                "name": "G01 Linear Contour Feed (100mm Path, F=500)",
                "params": {"gcode_command": "G01_linear", "programmed_feedrate_mm_min": 500.0, "start_x_mm": 0.0, "start_y_mm": 0.0, "target_x_mm": 100.0, "target_y_mm": 50.0}
            },
            "g02_arc_corner": {
                "name": "G02 Circular Corner Radius (R=50mm Arc)",
                "params": {"gcode_command": "G02_cw_arc", "programmed_feedrate_mm_min": 350.0, "start_x_mm": 0.0, "start_y_mm": 0.0, "target_x_mm": 50.0, "target_y_mm": 50.0, "arc_radius_mm": 50.0}
            }
        }
