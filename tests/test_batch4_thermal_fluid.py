"""
Unit Tests for Batch 4: Thermal & Fluid Engineering Suite (20 Tools)
===================================================================
Validates fluid dynamics, heat transfer, thermodynamic cycles, and power plant equations.
"""

import math
import pytest
from app.simulation import (
    BernoullisPrincipleEngine, BernoullisPrincipleInput,
    ContinuityEquationEngine, ContinuityEquationInput,
    ReynoldsNumberEngine, ReynoldsNumberInput,
    FluidFlowEngine, FluidFlowInput,
    BuoyancyEngine, BuoyancyInput,
    PascalsLawEngine, PascalsLawInput,
    WindTunnelEngine, WindTunnelInput,
    HeatTransferEngine, HeatTransferInput,
    HeatExchangerEngine, HeatExchangerInput,
    StefanBoltzmannEngine, StefanBoltzmannInput,
    IdealGasLawEngine, IdealGasLawInput,
    ThermodynamicsEngine, ThermodynamicsInput,
    RankineCycleEngine, RankineCycleInput,
    RefrigerationCycleEngine, RefrigerationCycleInput,
    CentrifugalPumpEngine, CentrifugalPumpInput,
    HydraulicTurbineEngine, HydraulicTurbineInput,
    HydraulicCircuitEngine, HydraulicCircuitInput,
    PneumaticCircuitEngine, PneumaticCircuitInput,
    ThermalPowerPlantEngine, ThermalPowerPlantInput,
    MorseTestEngine, MorseTestInput
)


def test_bernoulli_venturi():
    engine = BernoullisPrincipleEngine()
    inp = BernoullisPrincipleInput(pipe_diameter_mm=100.0, throat_diameter_mm=50.0, manometer_head_mm=250.0)
    out = engine.calculate(inp)
    assert out.throat_velocity_ms > out.inlet_velocity_ms
    assert out.throat_pressure_kpa < 200.0
    assert out.volumetric_flow_rate_lps > 0.0


def test_continuity_nozzle():
    engine = ContinuityEquationEngine()
    inp = ContinuityEquationInput(inlet_diameter_mm=80.0, outlet_diameter_mm=40.0, inlet_velocity_ms=2.5)
    out = engine.calculate(inp)
    assert out.area_ratio == 4.0
    assert out.outlet_velocity_ms == 10.0
    assert out.volumetric_flow_lps > 0.0


def test_reynolds_laminar_turbulent():
    engine = ReynoldsNumberEngine()
    inp_l = ReynoldsNumberInput(flow_velocity_ms=0.05, pipe_diameter_mm=25.0)
    out_l = engine.calculate(inp_l)
    assert out_l.reynolds_number < 2300.0
    assert "Laminar" in out_l.flow_regime

    inp_t = ReynoldsNumberInput(flow_velocity_ms=2.5, pipe_diameter_mm=100.0)
    out_t = engine.calculate(inp_t)
    assert out_t.reynolds_number > 4000.0
    assert "Turbulent" in out_t.flow_regime


def test_fluid_flow_losses():
    engine = FluidFlowEngine()
    inp = FluidFlowInput(pipe_diameter_mm=80.0, pipe_length_m=100.0, flow_rate_lps=15.0)
    out = engine.calculate(inp)
    assert out.total_head_loss_m > 0.0
    assert out.pressure_drop_kpa > 0.0
    assert out.pumping_power_kw > 0.0


def test_buoyancy_gm_stability():
    engine = BuoyancyEngine()
    inp = BuoyancyInput(body_mass_tonnes=500.0, hull_length_m=40.0, hull_beam_width_m=10.0, cg_height_above_keel_m=2.5)
    out = engine.calculate(inp)
    assert out.draft_depth_m > 0.0
    assert out.metacentric_height_gm_m > 0.0
    assert "STABLE" in out.stability_status


def test_pascals_law_press():
    engine = PascalsLawEngine()
    inp = PascalsLawInput(master_piston_dia_mm=20.0, slave_piston_dia_mm=100.0, input_force_n=200.0)
    out = engine.calculate(inp)
    assert out.mechanical_advantage == pytest.approx(25.0, rel=1e-3)
    assert out.output_force_kn == pytest.approx(5.0, rel=1e-3)
    assert out.slave_stroke_mm == pytest.approx(2.0, rel=1e-3)


def test_wind_tunnel_aerodynamics():
    engine = WindTunnelEngine()
    inp = WindTunnelInput(air_velocity_ms=35.0, angle_of_attack_deg=6.0)
    out = engine.calculate(inp)
    assert out.lift_force_n > out.drag_force_n
    assert out.is_stalled is False


def test_heat_transfer_composite_wall():
    engine = HeatTransferEngine()
    inp = HeatTransferInput(layer1_thickness_mm=100.0, layer2_thickness_mm=50.0, inner_temp_c=200.0, outer_temp_c=25.0)
    out = engine.calculate(inp)
    assert out.heat_transfer_rate_w > 0.0
    assert 25.0 < out.interface_temp_c < 200.0


def test_heat_exchanger_lmtd():
    engine = HeatExchangerEngine()
    inp = HeatExchangerInput(flow_arrangement="counter_flow", hot_fluid_inlet_c=95.0, hot_fluid_outlet_c=55.0)
    out = engine.calculate(inp)
    assert out.heat_duty_kw > 0.0
    assert out.lmtd_deg_c > 0.0
    assert out.required_area_m2 > 0.0


def test_stefan_boltzmann_radiation():
    engine = StefanBoltzmannEngine()
    inp = StefanBoltzmannInput(hot_surface_temp_c=500.0, surrounding_temp_c=25.0, emissivity=0.85)
    out = engine.calculate(inp)
    assert out.net_radiation_power_kw > 0.0
    assert out.radiation_h_coeff_w_m2k > 0.0


def test_ideal_gas_law_processes():
    engine = IdealGasLawEngine()
    inp = IdealGasLawInput(process_type="isothermal", initial_pressure_bar=2.0, compression_ratio=3.0)
    out = engine.calculate(inp)
    assert out.final_pressure_bar == pytest.approx(6.0, rel=1e-2)
    assert out.work_done_kj < 0.0  # compression work on gas


def test_thermodynamics_carnot():
    engine = ThermodynamicsEngine()
    inp = ThermodynamicsInput(hot_source_temp_c=600.0, cold_sink_temp_c=30.0, heat_input_kw=1000.0, actual_power_kw=450.0)
    out = engine.calculate(inp)
    assert out.carnot_efficiency_pct > out.actual_efficiency_pct
    assert out.rejected_heat_kw == 550.0


def test_rankine_steam_cycle():
    engine = RankineCycleEngine()
    inp = RankineCycleInput(boiler_pressure_bar=80.0, condenser_pressure_bar=0.08, steam_flow_rate_kg_s=25.0)
    out = engine.calculate(inp)
    assert out.net_power_mw > 0.0
    assert out.thermal_efficiency_pct > 20.0
    assert out.back_work_ratio_pct < 5.0


def test_refrigeration_vcr():
    engine = RefrigerationCycleEngine()
    inp = RefrigerationCycleInput(evaporator_temp_c=-10.0, condenser_temp_c=45.0, mass_flow_rate_kg_s=0.08)
    out = engine.calculate(inp)
    assert out.refrigeration_capacity_tr > 0.0
    assert out.cop_cooling > 1.0


def test_centrifugal_pump_npsh():
    engine = CentrifugalPumpEngine()
    inp = CentrifugalPumpInput(flow_rate_lps=25.0, suction_lift_m=3.5, delivery_head_m=28.0)
    out = engine.calculate(inp)
    assert out.manometric_head_m == 36.0
    assert out.shaft_input_power_kw > out.hydraulic_power_kw
    assert out.available_npsh_m > 0.0


def test_hydraulic_turbine_pelton():
    engine = HydraulicTurbineEngine()
    inp = HydraulicTurbineInput(turbine_type="pelton_wheel", net_head_m=250.0, discharge_m3_s=2.5)
    out = engine.calculate(inp)
    assert out.water_power_mw > 5.0
    assert out.shaft_power_mw > 0.0
    assert out.jet_or_flow_velocity_ms > 50.0


def test_hydraulic_circuit_actuator():
    engine = HydraulicCircuitEngine()
    inp = HydraulicCircuitInput(system_pressure_bar=160.0, flow_rate_lpm=40.0, piston_diameter_mm=80.0, rod_diameter_mm=45.0)
    out = engine.calculate(inp)
    assert out.extend_force_kn > out.retract_force_kn
    assert out.extend_velocity_mm_s < out.retract_velocity_mm_s


def test_pneumatic_circuit_fad():
    engine = PneumaticCircuitEngine()
    inp = PneumaticCircuitInput(working_pressure_bar=6.0, cylinder_bore_mm=50.0, stroke_length_mm=200.0, cycles_per_minute=30.0)
    out = engine.calculate(inp)
    assert out.thrust_force_n > 900.0
    assert out.free_air_delivery_lpm > 0.0


def test_thermal_power_plant_economics():
    engine = ThermalPowerPlantEngine()
    inp = ThermalPowerPlantInput(fuel_type="bituminous_coal", generator_output_mw=500.0)
    out = engine.calculate(inp)
    assert out.overall_plant_efficiency_pct > 30.0
    assert out.heat_rate_kj_kwh > 8000.0
    assert out.fuel_consumption_tonnes_per_hour > 100.0


def test_morse_test_engine():
    engine = MorseTestEngine()
    inp = MorseTestInput(num_cylinders=4, engine_speed_rpm=3000.0, brake_power_all_cyl_kw=60.0, avg_bp_cutout_kw=42.0)
    out = engine.calculate(inp)
    assert out.single_cylinder_ip_kw == 18.0
    assert out.total_indicated_power_kw == 72.0
    assert out.frictional_power_kw == 12.0
    assert out.mechanical_efficiency_pct == pytest.approx((60.0 / 72.0) * 100.0, rel=1e-2)
