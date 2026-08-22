"""
Buoyancy, Archimedes Principle & Metacentric Height Physics Engine
===================================================================
Calculates buoyant force FB, draft depth d, submerged volume fraction,
metacentric height GM, righting moment M_R, and floating stability status.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class BuoyancyInput(BaseModel):
    body_mass_tonnes: float = Field(default=500.0, ge=1.0, le=50000.0, description="Floating hull mass M in metric tonnes")
    hull_length_m: float = Field(default=40.0, ge=5.0, le=300.0, description="Hull length L in meters")
    hull_beam_width_m: float = Field(default=10.0, ge=2.0, le=50.0, description="Hull beam width B in meters")
    hull_height_m: float = Field(default=6.0, ge=1.0, le=30.0, description="Total hull height H in meters")
    cg_height_above_keel_m: float = Field(default=3.2, ge=0.5, le=20.0, description="Height of Center of Gravity above keel (KG) in meters")
    heel_angle_deg: float = Field(default=5.0, ge=0.0, le=30.0, description="Heel/tilt angle theta in degrees")
    fluid_density_kg_m3: float = Field(default=1025.0, ge=900.0, le=1200.0, description="Fluid density (Seawater ≈ 1025 kg/m³)")


class BuoyancyOutput(BaseModel):
    buoyant_force_kn: float
    draft_depth_m: float
    submerged_volume_m3: float
    center_of_buoyancy_kb_m: float
    bm_metacentric_radius_m: float
    metacentric_height_gm_m: float
    righting_moment_knm: float
    stability_status: str
    status_note: str


class BuoyancyEngine(BaseSimulationEngine):
    name = "buoyancy"
    description = "Floating body stability and Archimedes principle: draft depth, metacentric height GM, and righting moment"

    def calculate(self, params: BuoyancyInput) -> BuoyancyOutput:
        g = 9.81
        m_kg = params.body_mass_tonnes * 1000.0
        rho = params.fluid_density_kg_m3

        # Buoyant Force FB = M * g (in kN)
        fb_kn = (m_kg * g) / 1000.0

        # Submerged volume V_sub = M / rho
        v_sub_m3 = m_kg / rho

        l = params.hull_length_m
        b = params.hull_beam_width_m
        h = params.hull_height_m

        # Draft depth T_draft = V_sub / (L * B) for rectangular barge hull
        draft_m = v_sub_m3 / (l * b) if (l * b) > 0 else 1.0

        # Center of Buoyancy KB = draft / 2
        kb_m = draft_m / 2.0

        # Waterplane Moment of Inertia I_wp = L * B^3 / 12
        i_wp = (l * (b ** 3)) / 12.0

        # Metacentric radius BM = I_wp / V_sub
        bm_m = i_wp / v_sub_m3 if v_sub_m3 > 0 else 1.0

        # KG = Center of Gravity height above keel
        kg_m = params.cg_height_above_keel_m

        # Metacentric Height GM = KB + BM - KG
        gm_m = kb_m + bm_m - kg_m

        # Righting Moment M_R = W * GM * sin(theta)
        heel_rad = math.radians(params.heel_angle_deg)
        m_righting_knm = fb_kn * gm_m * math.sin(heel_rad)

        if gm_m > 0.15:
            status = "STABLE (Positive GM — Upright Righting Moment)"
        elif math.isclose(gm_m, 0.0, abs_tol=0.15):
            status = "NEUTRAL (GM ≈ 0 — Sluggish Return)"
        else:
            status = "UNSTABLE (Negative GM — Capsize Risk!)"

        note = (
            f"Floating Hull: Draft Depth = {draft_m:.2f} m | Metacentric Height GM = {gm_m:.2f} m | "
            f"Righting Moment at {params.heel_angle_deg}° Heel = {m_righting_knm:.1f} kN·m ({status})."
        )

        return BuoyancyOutput(
            buoyant_force_kn=float(fb_kn),
            draft_depth_m=float(draft_m),
            submerged_volume_m3=float(v_sub_m3),
            center_of_buoyancy_kb_m=float(kb_m),
            bm_metacentric_radius_m=float(bm_m),
            metacentric_height_gm_m=float(gm_m),
            righting_moment_knm=float(m_righting_knm),
            stability_status=status,
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "cargo_barge_stable": {
                "name": "Cargo Barge Vessel (Stable)",
                "params": {"body_mass_tonnes": 500.0, "hull_length_m": 40.0, "hull_beam_width_m": 10.0, "hull_height_m": 5.0, "cg_height_above_keel_m": 2.5, "heel_angle_deg": 5.0}
            },
            "top_heavy_ship_unstable": {
                "name": "Top-Heavy Cargo Ship (Capsize Risk)",
                "params": {"body_mass_tonnes": 1200.0, "hull_length_m": 50.0, "hull_beam_width_m": 11.0, "hull_height_m": 7.0, "cg_height_above_keel_m": 5.2, "heel_angle_deg": 10.0}
            }
        }
