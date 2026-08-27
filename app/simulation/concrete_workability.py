"""
Concrete Workability Simulation Engine (IS 1199 / WBSCTE Civil Engineering)
===========================================================================
Calculates workability characteristics across:
1. Slump Cone Test (True Slump, Shear Slump, Collapse Slump in mm)
2. Compacting Factor Test (Partial compaction vs Fully compacted weight ratio)
3. Vee-Bee Consistometer Test (Vibration remoulding time in seconds)
4. Flow Table Test (Flow percentage)
"""

from typing import Dict, Any, Literal
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


class ConcreteWorkabilityInput(BaseModel):
    water_cement_ratio: float = Field(default=0.50, ge=0.35, le=0.75, description="Water-Cement ratio (w/c)")
    aggregate_max_size_mm: float = Field(default=20.0, ge=10.0, le=40.0, description="Nominal maximum aggregate size (mm)")
    sand_aggregate_ratio: float = Field(default=0.35, ge=0.25, le=0.50, description="Fine aggregate to total aggregate ratio")
    admixture_dosage_percent: float = Field(default=0.0, ge=0.0, le=2.0, description="Superplasticizer dosage % by weight of cement")
    test_type: Literal["slump_cone", "compacting_factor", "vee_bee", "flow_table"] = Field(
        default="slump_cone", description="Active workability test"
    )


class ConcreteWorkabilityOutput(BaseModel):
    test_type: str
    water_cement_ratio: float
    slump_mm: float
    slump_type: str
    compacting_factor: float
    vee_bee_seconds: float
    flow_percent: float
    degree_of_workability: str
    suitable_applications: str
    is_code_compliance: str
    telemetry: Dict[str, Any]


class ConcreteWorkabilityEngine(BaseSimulationEngine):
    name = "concrete-workability"

    def calculate(self, params: ConcreteWorkabilityInput) -> ConcreteWorkabilityOutput:
        wc = params.water_cement_ratio
        agg_size = params.aggregate_max_size_mm
        sp = params.admixture_dosage_percent

        # Effective lubricated water factor
        eff_factor = (wc - 0.35) / 0.40  # 0.0 to 1.0 scale
        sp_boost = sp * 0.25
        combined_fluidity = np.clip(eff_factor + sp_boost, 0.0, 1.25)

        # 1. Slump Calculation (IS 1199)
        # Baseline slump from 15mm (stiff dry) to 190mm (high workability)
        raw_slump = 15.0 + (combined_fluidity ** 1.2) * 160.0
        # Aggregate size effect: Larger aggregate reduces specific surface area, increasing slump slightly
        agg_factor = (agg_size / 20.0) ** 0.3
        slump_mm = float(np.round(np.clip(raw_slump * agg_factor, 5.0, 195.0), 1))

        if slump_mm < 25.0:
            slump_type = "Very Low (True Slump)"
            degree = "Very Low"
        elif slump_mm <= 50.0:
            slump_type = "True Slump"
            degree = "Low"
        elif slump_mm <= 100.0:
            slump_type = "True Slump"
            degree = "Medium"
        elif slump_mm <= 150.0:
            slump_type = "True Slump"
            degree = "High"
        else:
            slump_type = "Near Collapse / High Fluidity"
            degree = "Very High"

        # 2. Compacting Factor Calculation (IS 1199)
        # CF ranges typically from 0.75 (very low) to 0.96 (high)
        compacting_factor = float(np.round(np.clip(0.72 + 0.24 * (combined_fluidity ** 0.85), 0.70, 0.98), 3))

        # 3. Vee-Bee Time Calculation (IS 1199)
        # Inversely proportional to slump. Ranges from 25s (dry) down to 2s (fluid)
        vee_bee_seconds = float(np.round(np.clip(28.0 * np.exp(-2.2 * combined_fluidity), 1.5, 30.0), 1))

        # 4. Flow Table Test Percentage
        # Flow % = ((D_spread - 250) / 250) * 100
        flow_percent = float(np.round(np.clip(15.0 + combined_fluidity * 85.0, 10.0, 120.0), 1))

        # Applications mapping per IS 456
        if degree == "Very Low":
            applications = "Road pavements with mechanical pavers, mass concrete foundations."
        elif degree == "Low":
            applications = "Mass concrete, light reinforced sections in slabs, beams, walls."
        elif degree == "Medium":
            applications = "Normal reinforced concrete, manual compaction, heavily reinforced sections."
        elif degree == "High":
            applications = "Heavily reinforced sections with congested rebar, tremie/pumped concrete."
        else:
            applications = "Self-compacting concrete (SCC), underwater tremie concting."

        is_compliance = f"Conforms to IS 1199 & IS 456 Table 2 (Degree: {degree})."

        telemetry = {
            "w_c_ratio": wc,
            "aggregate_size_mm": agg_size,
            "plasticizer_dosage_pct": sp,
            "slump_mm": slump_mm,
            "slump_category": slump_type,
            "compacting_factor": compacting_factor,
            "vee_bee_time_sec": vee_bee_seconds,
            "flow_percentage": flow_percent,
            "degree_workability": degree,
            "applications": applications
        }

        return ConcreteWorkabilityOutput(
            test_type=params.test_type,
            water_cement_ratio=wc,
            slump_mm=slump_mm,
            slump_type=slump_type,
            compacting_factor=compacting_factor,
            vee_bee_seconds=vee_bee_seconds,
            flow_percent=flow_percent,
            degree_of_workability=degree,
            suitable_applications=applications,
            is_code_compliance=is_compliance,
            telemetry=telemetry
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "mass_concrete": {
                "name": "Mass Concrete Foundation",
                "water_cement_ratio": 0.42,
                "aggregate_max_size_mm": 40.0,
                "sand_aggregate_ratio": 0.30,
                "admixture_dosage_percent": 0.0,
                "test_type": "slump_cone"
            },
            "pumpable_mix": {
                "name": "Pumped Concrete (Congested Rebar)",
                "water_cement_ratio": 0.55,
                "aggregate_max_size_mm": 20.0,
                "sand_aggregate_ratio": 0.40,
                "admixture_dosage_percent": 1.2,
                "test_type": "slump_cone"
            }
        }

