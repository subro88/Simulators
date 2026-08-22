"""
Vernier Caliper & Micrometer Precision Metrology Physics Engine
===============================================================
Calculates Least Count LC, main scale reading MSD, vernier / thimble coincidences,
zero error corrections, and actual dimension measurement.
"""

import math
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class VernierCaliperMicrometerInput(BaseModel):
    instrument_type: Literal["vernier_caliper", "outside_micrometer"] = Field(default="vernier_caliper", description="Precision metrology tool type")
    main_scale_reading_mm: float = Field(default=24.0, ge=0.0, le=300.0, description="Main scale reading MSD in mm")
    verniethimble_coincidence_divisions: int = Field(default=12, ge=0, le=50, description="Vernier / Thimble scale coincidence division")
    zero_error_mm: float = Field(default=0.02, ge=-1.0, le=1.0, description="Instrument zero error in mm (+ or -)")


class VernierCaliperMicrometerOutput(BaseModel):
    instrument_type: str
    least_count_mm: float
    observed_reading_mm: float
    corrected_actual_reading_mm: float
    zero_error_correction_mm: float
    status_note: str


class VernierCaliperMicrometerEngine(BaseSimulationEngine):
    name = "vernier-caliper-micrometer"
    description = "Metrology Inspection Tools: Vernier Caliper & Micrometer Least Count LC, zero error correction, and actual dimension"

    def calculate(self, params: VernierCaliperMicrometerInput) -> VernierCaliperMicrometerOutput:
        msd = params.main_scale_reading_mm
        div = params.verniethimble_coincidence_divisions
        z_err = params.zero_error_mm

        if params.instrument_type == "outside_micrometer":
            # Micrometer pitch = 0.5mm, 50 thimble divisions -> LC = 0.01 mm
            lc_mm = 0.01
            div = min(50, div)
            tool_title = "Outside Micrometer (0-25mm, LC = 0.01mm)"
        else:
            # Vernier Caliper: 49 MSD = 50 VSD -> LC = 0.02 mm
            lc_mm = 0.02
            div = min(50, div)
            tool_title = "Vernier Caliper (150mm Range, LC = 0.02mm)"

        # Observed Reading = MSD + (Coincidence * LC)
        obs_reading = msd + (div * lc_mm)

        # Corrected Reading = Observed Reading - Zero Error
        corr_reading = obs_reading - z_err
        corr_val = -z_err

        note = (
            f"Precision Metrology ({tool_title}): Main Scale = {msd:.1f} mm, Coincidence Div = {div} | "
            f"Least Count LC = {lc_mm:.2f} mm | Observed Reading = {obs_reading:.2f} mm | "
            f"Zero Error = {z_err:+.2f} mm -> Corrected Dimension = {corr_reading:.2f} mm."
        )

        return VernierCaliperMicrometerOutput(
            instrument_type=tool_title,
            least_count_mm=float(lc_mm),
            observed_reading_mm=float(obs_reading),
            corrected_actual_reading_mm=float(corr_reading),
            zero_error_correction_mm=float(corr_val),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "vernier_caliper_reading": {
                "name": "Vernier Caliper Measurement (MSD = 24mm, Div = 12)",
                "params": {"instrument_type": "vernier_caliper", "main_scale_reading_mm": 24.0, "verniethimble_coincidence_divisions": 12, "zero_error_mm": 0.02}
            },
            "micrometer_shaft_inspection": {
                "name": "Micrometer Shaft Measurement (MSD = 12.5mm, Div = 34)",
                "params": {"instrument_type": "outside_micrometer", "main_scale_reading_mm": 12.5, "verniethimble_coincidence_divisions": 34, "zero_error_mm": -0.01}
            }
        }
