"""
Thermal & Fluid Engineering Simulation Suite (Batch 5)
======================================================
Covers 14 Thermal, Fluid Mechanics, and Heat Power engines:
1. BernoullisPrincipleEngine
2. FluidFlowEngine
3. ReynoldsNumberEngine
4. PascalsLawEngine
5. ViscosityExperimentEngine
6. ContinuityEquationEngine
7. ThermodynamicsCyclesEngine
8. RankineCycleEngine
9. RefrigerationCycleEngine
10. IdealGasLawEngine
11. BoylesLawEngine
12. CharlesLawEngine
13. HeatTransferEngine
14. HeatExchangerEngine
"""

import math
from typing import Dict, Any, Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from .base import BaseSimulationEngine


# ── 1. Bernoulli's Principle Engine ──────────────────────────────────────────
class BernoullisPrincipleInput(BaseModel):
    inlet_diameter_mm: float = Field(default=100.0, ge=10.0, le=1000.0)
    throat_diameter_mm: float = Field(default=50.0, ge=5.0, le=500.0)
    inlet_velocity_m_s: float = Field(default=2.0, ge=0.1, le=50.0)
    inlet_pressure_kpa: float = Field(default=200.0, ge=10.0, le=2000.0)
    fluid_density_kg_m3: float = Field(default=1000.0, ge=500.0, le=2000.0)
    elevation_diff_z2_minus_z1_m: float = Field(default=0.0, ge=-50.0, le=50.0)

class BernoullisPrincipleOutput(BaseModel):
    inlet_area_m2: float
    throat_area_m2: float
    flow_rate_m3_s: float
    throat_velocity_m_s: float
    throat_pressure_kpa: float
    dynamic_pressure_head_m: float
    static_pressure_head_m: float
    total_head_m: float
    telemetry: Dict[str, Any]

class BernoullisPrincipleEngine(BaseSimulationEngine):
    name = "bernoullis-principle"

    def calculate(self, params: BernoullisPrincipleInput) -> BernoullisPrincipleOutput:
        d1 = params.inlet_diameter_mm / 1000.0
        d2 = params.throat_diameter_mm / 1000.0
        a1 = (math.pi / 4.0) * (d1 ** 2)
        a2 = (math.pi / 4.0) * (d2 ** 2)
        q = a1 * params.inlet_velocity_m_s
        v2 = q / a2
        rho = params.fluid_density_kg_m3
        g = 9.81
        p1_pa = params.inlet_pressure_kpa * 1000.0
        dz = params.elevation_diff_z2_minus_z1_m

        # P2 = P1 + 0.5*rho*(v1^2 - v2^2) - rho*g*dz
        p2_pa = p1_pa + 0.5 * rho * (params.inlet_velocity_m_s ** 2 - v2 ** 2) - (rho * g * dz)
        p2_kpa = p2_pa / 1000.0

        h_stat = p1_pa / (rho * g)
        h_dyn = (params.inlet_velocity_m_s ** 2) / (2.0 * g)
        h_tot = h_stat + h_dyn

        return BernoullisPrincipleOutput(
            inlet_area_m2=round(a1, 6),
            throat_area_m2=round(a2, 6),
            flow_rate_m3_s=round(q, 5),
            throat_velocity_m_s=round(v2, 2),
            throat_pressure_kpa=round(p2_kpa, 2),
            dynamic_pressure_head_m=round(h_dyn, 3),
            static_pressure_head_m=round(h_stat, 3),
            total_head_m=round(h_tot, 3),
            telemetry={"v2": v2, "p2_kpa": p2_kpa, "flow_m3_s": q}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"venturi_water": {"inlet_diameter_mm": 100.0, "throat_diameter_mm": 50.0, "inlet_velocity_m_s": 2.0, "inlet_pressure_kpa": 200.0}}


# ── 2. Fluid Flow & Pipe Friction Engine ─────────────────────────────────────
class FluidFlowInput(BaseModel):
    pipe_diameter_mm: float = Field(default=50.0, ge=5.0, le=1000.0)
    pipe_length_m: float = Field(default=100.0, ge=1.0, le=5000.0)
    flow_rate_liters_per_min: float = Field(default=300.0, ge=1.0, le=10000.0)
    fluid_density_kg_m3: float = Field(default=1000.0, ge=500.0, le=2000.0)
    dynamic_viscosity_pa_s: float = Field(default=0.001, ge=0.0001, le=1.0)
    pipe_roughness_mm: float = Field(default=0.045, ge=0.001, le=5.0)  # Commercial steel

class FluidFlowOutput(BaseModel):
    flow_velocity_m_s: float
    reynolds_number: float
    friction_factor_f: float
    head_loss_m: float
    pressure_drop_kpa: float
    pumping_power_watts: float
    telemetry: Dict[str, Any]

class FluidFlowEngine(BaseSimulationEngine):
    name = "fluid-flow"

    def calculate(self, params: FluidFlowInput) -> FluidFlowOutput:
        d = params.pipe_diameter_mm / 1000.0
        area = (math.pi / 4.0) * (d ** 2)
        q_m3_s = (params.flow_rate_liters_per_min / 60.0) / 1000.0
        v = q_m3_s / area
        rho = params.fluid_density_kg_m3
        mu = params.dynamic_viscosity_pa_s
        re = (rho * v * d) / mu

        if re < 2300:
            f = 64.0 / re if re > 0 else 0.064
        else:
            # Swamee-Jain approximation of Colebrook-White
            eps_d = (params.pipe_roughness_mm / 1000.0) / d
            f = 0.25 / ((math.log10((eps_d / 3.7) + (5.74 / (re ** 0.9)))) ** 2)

        g = 9.81
        hf = (f * params.pipe_length_m * (v ** 2)) / (2.0 * g * d)
        dp_pa = rho * g * hf
        dp_kpa = dp_pa / 1000.0
        power_w = dp_pa * q_m3_s

        return FluidFlowOutput(
            flow_velocity_m_s=round(v, 2),
            reynolds_number=round(re, 1),
            friction_factor_f=round(f, 4),
            head_loss_m=round(hf, 2),
            pressure_drop_kpa=round(dp_kpa, 2),
            pumping_power_watts=round(power_w, 2),
            telemetry={"velocity": v, "reynolds": re, "hf_m": hf, "dp_kpa": dp_kpa}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"commercial_pipe": {"pipe_diameter_mm": 50.0, "pipe_length_m": 100.0, "flow_rate_liters_per_min": 300.0}}


# ── 3. Reynolds Number Engine ────────────────────────────────────────────────
class ReynoldsNumberInput(BaseModel):
    pipe_diameter_mm: float = Field(default=25.0, ge=1.0, le=500.0)
    velocity_m_s: float = Field(default=0.8, ge=0.01, le=30.0)
    fluid_type: Literal["water", "air", "lubricating_oil", "glycerin"] = Field(default="water")
    fluid_temperature_c: float = Field(default=20.0, ge=0.0, le=100.0)

class ReynoldsNumberOutput(BaseModel):
    reynolds_number: float
    flow_regime: str
    critical_velocity_laminar_m_s: float
    critical_velocity_turbulent_m_s: float
    dynamic_viscosity_pa_s: float
    kinematic_viscosity_m2_s: float
    telemetry: Dict[str, Any]

class ReynoldsNumberEngine(BaseSimulationEngine):
    name = "reynolds-number"

    def calculate(self, params: ReynoldsNumberInput) -> ReynoldsNumberOutput:
        d = params.pipe_diameter_mm / 1000.0
        if params.fluid_type == "water":
            rho = 1000.0
            mu = 0.001002 * math.exp(-0.02 * (params.fluid_temperature_c - 20.0))
        elif params.fluid_type == "air":
            rho = 1.204
            mu = 1.82e-5
        elif params.fluid_type == "lubricating_oil":
            rho = 890.0
            mu = 0.29
        else: # glycerin
            rho = 1260.0
            mu = 1.41

        nu = mu / rho
        re = (rho * params.velocity_m_s * d) / mu

        if re < 2000:
            regime = "Laminar Flow"
        elif re <= 4000:
            regime = "Transitional Flow"
        else:
            regime = "Turbulent Flow"

        v_crit_lam = (2000.0 * mu) / (rho * d)
        v_crit_turb = (4000.0 * mu) / (rho * d)

        return ReynoldsNumberOutput(
            reynolds_number=round(re, 1),
            flow_regime=regime,
            critical_velocity_laminar_m_s=round(v_crit_lam, 3),
            critical_velocity_turbulent_m_s=round(v_crit_turb, 3),
            dynamic_viscosity_pa_s=round(mu, 6),
            kinematic_viscosity_m2_s=round(nu, 8),
            telemetry={"re": re, "regime": regime}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"water_standard": {"pipe_diameter_mm": 25.0, "velocity_m_s": 0.8, "fluid_type": "water"}}


# ── 4. Pascal's Law Engine ───────────────────────────────────────────────────
class PascalsLawInput(BaseModel):
    plunger_diameter_mm: float = Field(default=25.0, ge=2.0, le=200.0)
    ram_diameter_mm: float = Field(default=150.0, ge=10.0, le=1000.0)
    applied_effort_force_n: float = Field(default=200.0, ge=1.0, le=10000.0)
    plunger_stroke_mm: float = Field(default=100.0, ge=5.0, le=500.0)

class PascalsLawOutput(BaseModel):
    hydraulic_pressure_bar: float
    lifted_load_kn: float
    mechanical_advantage: float
    ram_displacement_mm: float
    work_done_joules: float
    telemetry: Dict[str, Any]

class PascalsLawEngine(BaseSimulationEngine):
    name = "pascals-law"

    def calculate(self, params: PascalsLawInput) -> PascalsLawOutput:
        d1 = params.plunger_diameter_mm
        d2 = params.ram_diameter_mm
        a1 = (math.pi / 4.0) * (d1 ** 2)
        a2 = (math.pi / 4.0) * (d2 ** 2)

        p_mpa = params.applied_effort_force_n / a1
        p_bar = p_mpa * 10.0

        f2_n = p_mpa * a2
        f2_kn = f2_n / 1000.0
        ma = a2 / a1
        ram_disp = params.plunger_stroke_mm / ma
        work_j = (params.applied_effort_force_n * (params.plunger_stroke_mm / 1000.0))

        return PascalsLawOutput(
            hydraulic_pressure_bar=round(p_bar, 2),
            lifted_load_kn=round(f2_kn, 2),
            mechanical_advantage=round(ma, 2),
            ram_displacement_mm=round(ram_disp, 2),
            work_done_joules=round(work_j, 2),
            telemetry={"pressure_bar": p_bar, "load_kn": f2_kn, "ma": ma}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"hydraulic_jack": {"plunger_diameter_mm": 25.0, "ram_diameter_mm": 150.0, "applied_effort_force_n": 200.0}}


# ── 5. Viscosity Experiment Engine (Stokes' Law) ─────────────────────────────
class ViscosityExperimentInput(BaseModel):
    sphere_material: Literal["steel", "glass", "lead"] = Field(default="steel")
    sphere_diameter_mm: float = Field(default=3.0, ge=0.5, le=20.0)
    fall_height_m: float = Field(default=0.8, ge=0.1, le=2.0)
    fluid_type: Literal["castor_oil", "glycerin", "heavy_motor_oil"] = Field(default="castor_oil")
    temperature_c: float = Field(default=25.0, ge=10.0, le=80.0)

class ViscosityExperimentOutput(BaseModel):
    terminal_velocity_m_s: float
    fall_time_seconds: float
    dynamic_viscosity_pa_s: float
    kinematic_viscosity_cst: float
    stokes_reynolds_number: float
    telemetry: Dict[str, Any]

class ViscosityExperimentEngine(BaseSimulationEngine):
    name = "viscosity-experiment"

    def calculate(self, params: ViscosityExperimentInput) -> ViscosityExperimentOutput:
        r = (params.sphere_diameter_mm / 2.0) / 1000.0
        rho_s = 7850.0 if params.sphere_material == "steel" else (2500.0 if params.sphere_material == "glass" else 11340.0)

        if params.fluid_type == "castor_oil":
            rho_f = 960.0
            mu = 0.65 * math.exp(-0.03 * (params.temperature_c - 25.0))
        elif params.fluid_type == "glycerin":
            rho_f = 1260.0
            mu = 0.95 * math.exp(-0.04 * (params.temperature_c - 25.0))
        else: # heavy_motor_oil
            rho_f = 880.0
            mu = 0.35 * math.exp(-0.025 * (params.temperature_c - 25.0))

        g = 9.81
        # Stokes' terminal velocity: vt = 2*r^2*g*(rho_s - rho_f) / (9*mu)
        vt = (2.0 * (r ** 2) * g * (rho_s - rho_f)) / (9.0 * mu)
        t_fall = params.fall_height_m / vt if vt > 0 else 99.0
        re_p = (rho_f * vt * (2.0 * r)) / mu
        nu_cst = (mu / rho_f) * 1e6

        return ViscosityExperimentOutput(
            terminal_velocity_m_s=round(vt, 4),
            fall_time_seconds=round(t_fall, 2),
            dynamic_viscosity_pa_s=round(mu, 4),
            kinematic_viscosity_cst=round(nu_cst, 1),
            stokes_reynolds_number=round(re_p, 4),
            telemetry={"vt": vt, "t_fall": t_fall, "viscosity": mu}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"steel_in_castor_oil": {"sphere_material": "steel", "sphere_diameter_mm": 3.0, "fall_height_m": 0.8, "fluid_type": "castor_oil"}}


# ── 6. Continuity Equation Engine ────────────────────────────────────────────
class ContinuityEquationInput(BaseModel):
    section1_diameter_mm: float = Field(default=80.0, ge=5.0, le=1000.0)
    section1_velocity_m_s: float = Field(default=1.5, ge=0.01, le=50.0)
    section2_diameter_mm: float = Field(default=40.0, ge=5.0, le=1000.0)

class ContinuityEquationOutput(BaseModel):
    section1_area_cm2: float
    section2_area_cm2: float
    volumetric_flow_rate_l_s: float
    mass_flow_rate_kg_s: float
    section2_velocity_m_s: float
    velocity_ratio: float
    telemetry: Dict[str, Any]

class ContinuityEquationEngine(BaseSimulationEngine):
    name = "continuity-equation"

    def calculate(self, params: ContinuityEquationInput) -> ContinuityEquationOutput:
        d1_m = params.section1_diameter_mm / 1000.0
        d2_m = params.section2_diameter_mm / 1000.0
        a1 = (math.pi / 4.0) * (d1_m ** 2)
        a2 = (math.pi / 4.0) * (d2_m ** 2)

        q = a1 * params.section1_velocity_m_s
        v2 = q / a2
        q_l_s = q * 1000.0
        mdot = q * 1000.0  # water default
        ratio = v2 / params.section1_velocity_m_s

        return ContinuityEquationOutput(
            section1_area_cm2=round(a1 * 10000.0, 2),
            section2_area_cm2=round(a2 * 10000.0, 2),
            volumetric_flow_rate_l_s=round(q_l_s, 2),
            mass_flow_rate_kg_s=round(mdot, 2),
            section2_velocity_m_s=round(v2, 2),
            velocity_ratio=round(ratio, 2),
            telemetry={"v2": v2, "q_l_s": q_l_s, "ratio": ratio}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"pipe_reducer": {"section1_diameter_mm": 80.0, "section1_velocity_m_s": 1.5, "section2_diameter_mm": 40.0}}


# ── 7. Thermodynamic Cycles Engine ───────────────────────────────────────────
class ThermodynamicsCyclesInput(BaseModel):
    cycle_type: Literal["otto", "diesel", "dual", "carnot"] = Field(default="otto")
    compression_ratio_r: float = Field(default=8.5, ge=2.0, le=25.0)
    cutoff_ratio_rc: float = Field(default=1.8, ge=1.0, le=5.0)
    heat_addition_ratio_rp: float = Field(default=1.4, ge=1.0, le=3.0)
    gamma: float = Field(default=1.4, ge=1.2, le=1.67)
    t1_kelvin: float = Field(default=300.0, ge=200.0, le=500.0)
    p1_bar: float = Field(default=1.013, ge=0.5, le=5.0)

class ThermodynamicsCyclesOutput(BaseModel):
    thermal_efficiency_pct: float
    compression_temperature_t2_k: float
    peak_cycle_temperature_t3_k: float
    peak_cycle_pressure_p3_bar: float
    mean_effective_pressure_bar: float
    telemetry: Dict[str, Any]

class ThermodynamicsCyclesEngine(BaseSimulationEngine):
    name = "thermodynamics"

    def calculate(self, params: ThermodynamicsCyclesInput) -> ThermodynamicsCyclesOutput:
        r = params.compression_ratio_r
        g = params.gamma
        t1 = params.t1_kelvin
        p1 = params.p1_bar

        t2 = t1 * (r ** (g - 1.0))
        p2 = p1 * (r ** g)

        if params.cycle_type == "otto":
            eff = 1.0 - (1.0 / (r ** (g - 1.0)))
            t3 = t2 * 2.8
            p3 = p2 * (t3 / t2)
        elif params.cycle_type == "diesel":
            rc = params.cutoff_ratio_rc
            eff = 1.0 - (1.0 / (r ** (g - 1.0))) * ((rc ** g - 1.0) / (g * (rc - 1.0)))
            t3 = t2 * rc
            p3 = p2
        elif params.cycle_type == "carnot":
            t3 = 1800.0
            eff = 1.0 - (t1 / t3)
            p3 = p2 * 2.0
        else: # Dual
            rc = params.cutoff_ratio_rc
            rp = params.heat_addition_ratio_rp
            eff = 1.0 - (1.0 / (r ** (g - 1.0))) * (((rp * (rc ** g) - 1.0)) / ((rp - 1.0) + g * rp * (rc - 1.0)))
            p3 = p2 * rp
            t3 = t2 * rp * rc

        mep = (p3 - p1) * eff * 0.4

        return ThermodynamicsCyclesOutput(
            thermal_efficiency_pct=round(eff * 100.0, 2),
            compression_temperature_t2_k=round(t2, 1),
            peak_cycle_temperature_t3_k=round(t3, 1),
            peak_cycle_pressure_p3_bar=round(p3, 2),
            mean_effective_pressure_bar=round(mep, 2),
            telemetry={"efficiency": eff * 100.0, "t2": t2, "t3": t3, "p3": p3}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"standard_otto": {"cycle_type": "otto", "compression_ratio_r": 8.5}}


# ── 8. Rankine Cycle Engine ──────────────────────────────────────────────────
class RankineCycleInput(BaseModel):
    boiler_pressure_bar: float = Field(default=40.0, ge=5.0, le=200.0)
    superheat_temperature_c: float = Field(default=450.0, ge=150.0, le=600.0)
    condenser_pressure_bar: float = Field(default=0.08, ge=0.01, le=1.0)
    turbine_isentropic_efficiency: float = Field(default=0.85, ge=0.5, le=1.0)
    mass_flow_kg_s: float = Field(default=25.0, ge=1.0, le=500.0)

class RankineCycleOutput(BaseModel):
    turbine_work_kj_kg: float
    pump_work_kj_kg: float
    net_work_kj_kg: float
    heat_supplied_kj_kg: float
    rankine_efficiency_pct: float
    power_output_mw: float
    steam_rate_kg_kwh: float
    telemetry: Dict[str, Any]

class RankineCycleEngine(BaseSimulationEngine):
    name = "rankine-cycle"

    def calculate(self, params: RankineCycleInput) -> RankineCycleOutput:
        # Approximate enthalpy calculations for steam
        pb = params.boiler_pressure_bar
        t_sh = params.superheat_temperature_c
        pc = params.condenser_pressure_bar

        h1 = 3300.0 + 1.2 * (t_sh - 400.0) + 2.5 * pb  # kJ/kg
        h2s = 2150.0 + 8.0 * pb - 120.0 * math.log(pb / pc)
        h2 = h1 - params.turbine_isentropic_efficiency * (h1 - h2s)
        h3 = 173.0 + 35.0 * math.log(pc * 10.0 + 1.0)  # Condensate liquid
        wp = 0.00101 * (pb - pc) * 100.0  # Pump work v*dp
        h4 = h3 + wp

        wt = h1 - h2
        wnet = wt - wp
        qin = h1 - h4
        eff = (wnet / qin) * 100.0
        power_mw = (wnet * params.mass_flow_kg_s) / 1000.0
        steam_rate = 3600.0 / wnet

        return RankineCycleOutput(
            turbine_work_kj_kg=round(wt, 1),
            pump_work_kj_kg=round(wp, 2),
            net_work_kj_kg=round(wnet, 1),
            heat_supplied_kj_kg=round(qin, 1),
            rankine_efficiency_pct=round(eff, 2),
            power_output_mw=round(power_mw, 2),
            steam_rate_kg_kwh=round(steam_rate, 2),
            telemetry={"efficiency": eff, "power_mw": power_mw, "wnet": wnet}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"medium_power_plant": {"boiler_pressure_bar": 40.0, "superheat_temperature_c": 450.0, "condenser_pressure_bar": 0.08}}


# ── 9. Refrigeration Cycle Engine (VCRS) ─────────────────────────────────────
class RefrigerationCycleInput(BaseModel):
    refrigerant: Literal["R134a", "R410A", "R22", "R717_Ammonia"] = Field(default="R134a")
    evaporator_temp_c: float = Field(default=-10.0, ge=-40.0, le=10.0)
    condenser_temp_c: float = Field(default=40.0, ge=20.0, le=60.0)
    cooling_capacity_tr: float = Field(default=3.0, ge=0.5, le=100.0)
    compressor_isentropic_efficiency: float = Field(default=0.82, ge=0.5, le=1.0)

class RefrigerationCycleOutput(BaseModel):
    refrigerating_effect_kj_kg: float
    compressor_work_kj_kg: float
    cop_actual: float
    cop_carnot: float
    power_required_kw: float
    mass_flow_rate_kg_s: float
    telemetry: Dict[str, Any]

class RefrigerationCycleEngine(BaseSimulationEngine):
    name = "refrigeration-cycle"

    def calculate(self, params: RefrigerationCycleInput) -> RefrigerationCycleOutput:
        te = params.evaporator_temp_c
        tc = params.condenser_temp_c

        # R134a approximate state enthalpy values
        h1 = 392.0 + 0.9 * te  # Sat vapor at evap
        h3 = 256.0 + 1.4 * tc  # Sat liquid at cond
        h4 = h3  # Throttling
        h2s = h1 + 1.15 * (tc - te)
        h2 = h1 + (h2s - h1) / params.compressor_isentropic_efficiency

        re = h1 - h4  # kJ/kg
        wc = h2 - h1  # kJ/kg
        cop = re / wc
        cop_carnot = (te + 273.15) / (tc - te)

        capacity_kw = params.cooling_capacity_tr * 3.51685
        mdot = capacity_kw / re
        power_kw = mdot * wc

        return RefrigerationCycleOutput(
            refrigerating_effect_kj_kg=round(re, 2),
            compressor_work_kj_kg=round(wc, 2),
            cop_actual=round(cop, 2),
            cop_carnot=round(cop_carnot, 2),
            power_required_kw=round(power_kw, 2),
            mass_flow_rate_kg_s=round(mdot, 4),
            telemetry={"cop": cop, "cop_carnot": cop_carnot, "power_kw": power_kw}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"air_conditioner": {"refrigerant": "R134a", "evaporator_temp_c": 5.0, "condenser_temp_c": 45.0, "cooling_capacity_tr": 1.5}}


# ── 10. Ideal Gas Law Engine ─────────────────────────────────────────────────
class IdealGasLawInput(BaseModel):
    process_type: Literal["isothermal", "adiabatic", "isobaric", "isochoric"] = Field(default="isothermal")
    initial_pressure_kpa: float = Field(default=101.325, ge=1.0, le=5000.0)
    initial_volume_m3: float = Field(default=0.05, ge=0.001, le=10.0)
    initial_temperature_c: float = Field(default=25.0, ge=-100.0, le=1000.0)
    compression_ratio: float = Field(default=2.5, ge=0.1, le=20.0)
    gamma: float = Field(default=1.4, ge=1.1, le=1.67)

class IdealGasLawOutput(BaseModel):
    final_pressure_kpa: float
    final_volume_m3: float
    final_temperature_c: float
    work_done_joules: float
    heat_transfer_joules: float
    change_in_internal_energy_j: float
    telemetry: Dict[str, Any]

class IdealGasLawEngine(BaseSimulationEngine):
    name = "ideal-gas-law"

    def calculate(self, params: IdealGasLawInput) -> IdealGasLawOutput:
        p1 = params.initial_pressure_kpa * 1000.0
        v1 = params.initial_volume_m3
        t1 = params.initial_temperature_c + 273.15
        r_gas = 287.05  # J/(kg*K) air
        m = (p1 * v1) / (r_gas * t1)
        v2 = v1 / params.compression_ratio

        if params.process_type == "isothermal":
            p2 = p1 * (v1 / v2)
            t2 = t1
            w = p1 * v1 * math.log(v2 / v1)
            q = w
            du = 0.0
        elif params.process_type == "adiabatic":
            g = params.gamma
            p2 = p1 * ((v1 / v2) ** g)
            t2 = t1 * ((v1 / v2) ** (g - 1.0))
            w = (p1 * v1 - p2 * v2) / (g - 1.0)
            q = 0.0
            du = -w
        elif params.process_type == "isobaric":
            p2 = p1
            t2 = t1 * (v2 / v1)
            w = p1 * (v2 - v1)
            cv = r_gas / (params.gamma - 1.0)
            cp = cv + r_gas
            du = m * cv * (t2 - t1)
            q = m * cp * (t2 - t1)
        else: # isochoric
            v2 = v1
            t2 = t1 * params.compression_ratio
            p2 = p1 * (t2 / t1)
            w = 0.0
            cv = r_gas / (params.gamma - 1.0)
            du = m * cv * (t2 - t1)
            q = du

        return IdealGasLawOutput(
            final_pressure_kpa=round(p2 / 1000.0, 2),
            final_volume_m3=round(v2, 4),
            final_temperature_c=round(t2 - 273.15, 2),
            work_done_joules=round(w, 1),
            heat_transfer_joules=round(q, 1),
            change_in_internal_energy_j=round(du, 1),
            telemetry={"p2_kpa": p2 / 1000.0, "v2_m3": v2, "t2_c": t2 - 273.15, "work_j": w}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"isothermal_compression": {"process_type": "isothermal", "initial_pressure_kpa": 101.325, "compression_ratio": 2.5}}


# ── 11. Boyle's Law Engine ───────────────────────────────────────────────────
class BoylesLawInput(BaseModel):
    initial_pressure_kpa: float = Field(default=100.0, ge=1.0, le=2000.0)
    initial_volume_liters: float = Field(default=10.0, ge=0.1, le=500.0)
    target_volume_liters: float = Field(default=5.0, ge=0.1, le=500.0)

class BoylesLawOutput(BaseModel):
    constant_pv_kpa_l: float
    resulting_pressure_kpa: float
    pressure_ratio: float
    telemetry: Dict[str, Any]

class BoylesLawEngine(BaseSimulationEngine):
    name = "boyles-law"

    def calculate(self, params: BoylesLawInput) -> BoylesLawOutput:
        c = params.initial_pressure_kpa * params.initial_volume_liters
        p2 = c / params.target_volume_liters
        ratio = p2 / params.initial_pressure_kpa

        return BoylesLawOutput(
            constant_pv_kpa_l=round(c, 2),
            resulting_pressure_kpa=round(p2, 2),
            pressure_ratio=round(ratio, 3),
            telemetry={"p2_kpa": p2, "ratio": ratio}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"halve_volume": {"initial_pressure_kpa": 100.0, "initial_volume_liters": 10.0, "target_volume_liters": 5.0}}


# ── 12. Charles' Law Engine ──────────────────────────────────────────────────
class CharlesLawInput(BaseModel):
    initial_volume_liters: float = Field(default=5.0, ge=0.1, le=500.0)
    initial_temperature_c: float = Field(default=20.0, ge=-100.0, le=500.0)
    target_temperature_c: float = Field(default=100.0, ge=-100.0, le=1000.0)

class CharlesLawOutput(BaseModel):
    initial_temp_kelvin: float
    target_temp_kelvin: float
    resulting_volume_liters: float
    volume_expansion_ratio: float
    telemetry: Dict[str, Any]

class CharlesLawEngine(BaseSimulationEngine):
    name = "charles-law"

    def calculate(self, params: CharlesLawInput) -> CharlesLawOutput:
        t1_k = params.initial_temperature_c + 273.15
        t2_k = params.target_temperature_c + 273.15
        v2 = params.initial_volume_liters * (t2_k / t1_k)
        ratio = v2 / params.initial_volume_liters

        return CharlesLawOutput(
            initial_temp_kelvin=round(t1_k, 2),
            target_temp_kelvin=round(t2_k, 2),
            resulting_volume_liters=round(v2, 3),
            volume_expansion_ratio=round(ratio, 3),
            telemetry={"v2_l": v2, "ratio": ratio}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"heat_expansion": {"initial_volume_liters": 5.0, "initial_temperature_c": 20.0, "target_temperature_c": 100.0}}


# ── 13. Heat Transfer Engine (Conduction, Convection, Radiation) ─────────────
class HeatTransferInput(BaseModel):
    mode: Literal["conduction", "convection", "radiation", "combined"] = Field(default="conduction")
    surface_area_m2: float = Field(default=2.5, ge=0.01, le=100.0)
    wall_thickness_m: float = Field(default=0.15, ge=0.001, le=2.0)
    thermal_conductivity_w_mk: float = Field(default=0.8, ge=0.01, le=500.0)  # Brick
    convection_coeff_w_m2k: float = Field(default=15.0, ge=1.0, le=5000.0)
    emissivity: float = Field(default=0.90, ge=0.01, le=1.0)
    t_hot_c: float = Field(default=80.0, ge=-50.0, le=2000.0)
    t_cold_c: float = Field(default=20.0, ge=-50.0, le=1000.0)

class HeatTransferOutput(BaseModel):
    conduction_heat_rate_w: float
    convection_heat_rate_w: float
    radiation_heat_rate_w: float
    total_heat_transfer_rate_w: float
    thermal_resistance_k_w: float
    telemetry: Dict[str, Any]

class HeatTransferEngine(BaseSimulationEngine):
    name = "heat-transfer"

    def calculate(self, params: HeatTransferInput) -> HeatTransferOutput:
        a = params.surface_area_m2
        dt = params.t_hot_c - params.t_cold_c
        th_k = params.t_hot_c + 273.15
        tc_k = params.t_cold_c + 273.15
        sigma = 5.670374e-8  # Stefan-Boltzmann constant

        # 1. Conduction
        q_cond = (params.thermal_conductivity_w_mk * a * dt) / params.wall_thickness_m
        r_cond = params.wall_thickness_m / (params.thermal_conductivity_w_mk * a)

        # 2. Convection
        q_conv = params.convection_coeff_w_m2k * a * dt
        r_conv = 1.0 / (params.convection_coeff_w_m2k * a)

        # 3. Radiation
        q_rad = params.emissivity * sigma * a * ((th_k ** 4) - (tc_k ** 4))

        if params.mode == "conduction":
            q_tot = q_cond
            r_tot = r_cond
        elif params.mode == "convection":
            q_tot = q_conv
            r_tot = r_conv
        elif params.mode == "radiation":
            q_tot = q_rad
            r_tot = dt / q_rad if q_rad > 0 else 0.0
        else:
            q_tot = q_cond + q_conv + q_rad
            r_tot = dt / q_tot if q_tot > 0 else 0.0

        return HeatTransferOutput(
            conduction_heat_rate_w=round(q_cond, 2),
            convection_heat_rate_w=round(q_conv, 2),
            radiation_heat_rate_w=round(q_rad, 2),
            total_heat_transfer_rate_w=round(q_tot, 2),
            thermal_resistance_k_w=round(r_tot, 5),
            telemetry={"q_tot_w": q_tot, "r_tot": r_tot}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"brick_wall_conduction": {"mode": "conduction", "surface_area_m2": 2.5, "wall_thickness_m": 0.15, "thermal_conductivity_w_mk": 0.8, "t_hot_c": 80.0, "t_cold_c": 20.0}}


# ── 14. Heat Exchanger Engine (LMTD & NTU) ───────────────────────────────────
class HeatExchangerInput(BaseModel):
    flow_arrangement: Literal["counter_flow", "parallel_flow"] = Field(default="counter_flow")
    overall_heat_transfer_coeff_u: float = Field(default=600.0, ge=10.0, le=5000.0)
    exchanger_area_m2: float = Field(default=8.5, ge=0.1, le=500.0)
    hot_fluid_inlet_temp_c: float = Field(default=95.0, ge=20.0, le=500.0)
    hot_fluid_mass_flow_kg_s: float = Field(default=1.5, ge=0.01, le=100.0)
    hot_fluid_cp_j_kgk: float = Field(default=4180.0, ge=500.0, le=6000.0)
    cold_fluid_inlet_temp_c: float = Field(default=25.0, ge=0.0, le=200.0)
    cold_fluid_mass_flow_kg_s: float = Field(default=2.0, ge=0.01, le=100.0)
    cold_fluid_cp_j_kgk: float = Field(default=4180.0, ge=500.0, le=6000.0)

class HeatExchangerOutput(BaseModel):
    heat_transfer_rate_kw: float
    hot_fluid_outlet_temp_c: float
    cold_fluid_outlet_temp_c: float
    lmtd_deg_c: float
    ntu: float
    effectiveness_pct: float
    telemetry: Dict[str, Any]

class HeatExchangerEngine(BaseSimulationEngine):
    name = "heat-exchanger"

    def calculate(self, params: HeatExchangerInput) -> HeatExchangerOutput:
        ch = params.hot_fluid_mass_flow_kg_s * params.hot_fluid_cp_j_kgk
        cc = params.cold_fluid_mass_flow_kg_s * params.cold_fluid_cp_j_kgk
        cmin = min(ch, cc)
        cmax = max(ch, cc)
        cr = cmin / cmax

        u = params.overall_heat_transfer_coeff_u
        a = params.exchanger_area_m2
        ua = u * a
        ntu = ua / cmin

        if params.flow_arrangement == "counter_flow":
            if cr == 1.0:
                eff = ntu / (1.0 + ntu)
            else:
                eff = (1.0 - math.exp(-ntu * (1.0 - cr))) / (1.0 - cr * math.exp(-ntu * (1.0 - cr)))
        else: # parallel
            eff = (1.0 - math.exp(-ntu * (1.0 + cr))) / (1.0 + cr)

        q_max = cmin * (params.hot_fluid_inlet_temp_c - params.cold_fluid_inlet_temp_c)
        q_actual = eff * q_max
        q_kw = q_actual / 1000.0

        th_out = params.hot_fluid_inlet_temp_c - (q_actual / ch)
        tc_out = params.cold_fluid_inlet_temp_c + (q_actual / cc)

        if params.flow_arrangement == "counter_flow":
            dt1 = params.hot_fluid_inlet_temp_c - tc_out
            dt2 = th_out - params.cold_fluid_inlet_temp_c
        else:
            dt1 = params.hot_fluid_inlet_temp_c - params.cold_fluid_inlet_temp_c
            dt2 = th_out - tc_out

        if dt1 == dt2:
            lmtd = dt1
        else:
            lmtd = (dt1 - dt2) / math.log(dt1 / dt2) if (dt1 > 0 and dt2 > 0 and dt1 != dt2) else dt1

        return HeatExchangerOutput(
            heat_transfer_rate_kw=round(q_kw, 2),
            hot_fluid_outlet_temp_c=round(th_out, 2),
            cold_fluid_outlet_temp_c=round(tc_out, 2),
            lmtd_deg_c=round(lmtd, 2),
            ntu=round(ntu, 3),
            effectiveness_pct=round(eff * 100.0, 2),
            telemetry={"q_kw": q_kw, "th_out": th_out, "tc_out": tc_out, "lmtd": lmtd, "eff": eff * 100.0}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {"counter_flow_cooler": {"flow_arrangement": "counter_flow", "overall_heat_transfer_coeff_u": 600.0, "exchanger_area_m2": 8.5}}
