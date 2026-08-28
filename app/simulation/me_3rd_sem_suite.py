"""
Mechanical Engineering 3rd Semester Simulation Suite (WBSCTE ME/S3/ASOM, FOE, MP1, MED, MEM, TE1)
================================================================================================
Implements 11 specialized mechanical engineering simulation engines:
1. CastingProcessEngine (ME/S3/MP1 Casting, Pattern Sizing & Solidification)
2. MetalFormingForgingEngine (ME/S3/MP1 Rolling, Forging, Extrusion & Wire Drawing)
3. WeldingTechnologyEngine (ME/S3/MP1 Gas & Arc Welding Heat Input, HAZ & Cool Rate)
4. ShaftCouplingsJointsEngine (ME/S3/MED Flange, Muff, Oldham & Hooke's Universal Joint)
5. PlummerBlockBearingsEngine (ME/S3/MED Pedestal Journal Bearing & Sommerfeld Number)
6. IronCarbonPhaseDiagramEngine (ME/S3/MEM Fe-C Phase Fractions & Microstructure Lever Rule)
7. HeatTreatmentMetallurgyEngine (ME/S3/MEM Annealing, Normalizing, Quenching & Tempering)
8. NDTMaterialsTestingEngine (ME/S3/MEM Ultrasonic, Radiography & Magnetic Particle NDT)
9. AirStandardCyclesEngine (ME/S3/TE1 Otto, Diesel & Carnot P-V / T-s Cycle Efficiency)
10. SteamPropertiesMollierEngine (ME/S3/TE1 Enthalpy, Dryness Fraction & Throttling)
11. SteamBoilersMountingsEngine (ME/S3/TE1 Equivalent Evaporation & Boiler Thermal Efficiency)
"""

import math
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


# ── 1. Casting Process Engine ────────────────────────────────────────────────
class CastingProcessInput(BaseModel):
    casting_metal: Literal["cast_iron", "aluminum", "steel", "brass"] = Field(
        default="cast_iron", description="Casting Alloy"
    )
    part_length_mm: float = Field(default=200.0, ge=10.0, le=2000.0, description="Nominal Part Length (mm)")
    part_volume_cc: float = Field(default=850.0, ge=10.0, le=50000.0, description="Casting Volume (cm³)")
    part_surface_area_sqcm: float = Field(default=520.0, ge=10.0, le=20000.0, description="Surface Area (cm²)")
    sprue_height_mm: float = Field(default=150.0, ge=50.0, le=800.0, description="Sprue Pouring Height (mm)")
    mold_constant_b_s_per_sqcm: float = Field(default=2.2, description="Chvorinov Mold Constant (s/cm²)")

class CastingProcessOutput(BaseModel):
    casting_metal: str
    pattern_length_with_shrinkage_mm: float
    linear_shrinkage_allowance_pct: float
    modulus_v_over_a_cm: float
    chvorinov_solidification_time_sec: float
    choke_area_sqmm: float
    pouring_velocity_m_per_s: float
    telemetry: Dict[str, Any]

class CastingProcessEngine(BaseSimulationEngine):
    name = "casting-process"
    description = "Casting Process Lab: Pattern Sizing, Shrinkage Allowance, Gating Design & Chvorinov Solidification Time"

    def calculate(self, params: CastingProcessInput) -> CastingProcessOutput:
        shrink_rates = {"cast_iron": 1.0, "aluminum": 1.5, "steel": 2.0, "brass": 1.4}
        shrink_pct = shrink_rates.get(params.casting_metal, 1.0)
        pattern_len = params.part_length_mm * (1.0 + shrink_pct / 100.0)

        # Chvorinov's Rule: ts = B * (V / A)^2
        v_over_a = params.part_volume_cc / max(1.0, params.part_surface_area_sqcm)
        t_solid = params.mold_constant_b_s_per_sqcm * (v_over_a ** 2)

        # Torricelli velocity: v = sqrt(2 * g * H)
        g = 9.81
        h_m = params.sprue_height_mm / 1000.0
        v_pour = math.sqrt(2.0 * g * h_m)

        # Metal density (g/cm3)
        densities = {"cast_iron": 7.2, "aluminum": 2.7, "steel": 7.85, "brass": 8.5}
        rho = densities.get(params.casting_metal, 7.2)
        total_mass_kg = (params.part_volume_cc * rho) / 1000.0

        # Pouring time approx: t_p = 0.95 * sqrt(mass_kg) * 2.5
        t_pour = max(3.0, 2.4 * math.sqrt(total_mass_kg))
        # Choke area: Ac = (M) / (rho * t_p * Cd * v)
        cd = 0.85
        ac_sqmm = (total_mass_kg * 1e6) / (rho * 1000.0 * t_pour * cd * (v_pour * 1000.0))

        return CastingProcessOutput(
            casting_metal=params.casting_metal,
            pattern_length_with_shrinkage_mm=round(pattern_len, 2),
            linear_shrinkage_allowance_pct=shrink_pct,
            modulus_v_over_a_cm=round(v_over_a, 3),
            chvorinov_solidification_time_sec=round(t_solid, 1),
            choke_area_sqmm=round(ac_sqmm, 2),
            pouring_velocity_m_per_s=round(v_pour, 2),
            telemetry={"v_over_a": round(v_over_a, 3), "t_solid": round(t_solid, 1), "v_pour": round(v_pour, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "grey_cast_iron_bracket": {"casting_metal": "cast_iron", "part_length_mm": 200.0, "part_volume_cc": 850.0, "part_surface_area_sqcm": 520.0},
            "aluminum_alloy_flange": {"casting_metal": "aluminum", "part_length_mm": 150.0, "part_volume_cc": 450.0, "part_surface_area_sqcm": 380.0}
        }


# ── 2. Metal Forming & Forging Engine ───────────────────────────────────────
class MetalFormingForgingInput(BaseModel):
    forming_process: Literal["flat_rolling", "upset_forging", "wire_drawing", "forward_extrusion"] = Field(
        default="flat_rolling", description="Forming Process"
    )
    initial_thickness_or_dia_mm: float = Field(default=25.0, ge=1.0, le=500.0, description="Initial Height/Dia h0 (mm)")
    final_thickness_or_dia_mm: float = Field(default=18.0, ge=0.5, le=500.0, description="Final Height/Dia h1 (mm)")
    roll_radius_or_die_angle_deg: float = Field(default=250.0, description="Roll Radius R (mm) or Die Angle")
    material_flow_stress_mpa: float = Field(default=220.0, description="Yield Flow Stress σ0 (MPa)")
    friction_coefficient: float = Field(default=0.25, ge=0.01, le=0.6, description="Friction Coefficient μ")
    strip_width_mm: float = Field(default=180.0, description="Sheet / Billet Width (mm)")

class MetalFormingForgingOutput(BaseModel):
    forming_process: str
    absolute_reduction_mm: float
    percentage_reduction_pct: float
    contact_arc_length_mm: float
    forming_force_kn: float
    forming_power_kw: float
    telemetry: Dict[str, Any]

class MetalFormingForgingEngine(BaseSimulationEngine):
    name = "metal-forming-forging"
    description = "Metal Forming Lab: Flat Rolling Force, Open-Die Forging, Wire Drawing Stress & Extrusion Pressure"

    def calculate(self, params: MetalFormingForgingInput) -> MetalFormingForgingOutput:
        dh = params.initial_thickness_or_dia_mm - params.final_thickness_or_dia_mm
        pct_red = (dh / max(0.1, params.initial_thickness_or_dia_mm)) * 100.0
        r_mm = params.roll_radius_or_die_angle_deg

        if params.forming_process == "flat_rolling":
            # Projected contact length: L = sqrt(R * Delta_h)
            l_contact = math.sqrt(max(0.1, r_mm * dh))
            h_avg = (params.initial_thickness_or_dia_mm + params.final_thickness_or_dia_mm) / 2.0
            # Mean pressure factor: Q = 1 + (mu * L) / (2 * h_avg)
            q = 1.0 + (params.friction_coefficient * l_contact) / (2.0 * h_avg)
            # Roll force F = L * w * sigma_0 * Q
            force_n = l_contact * params.strip_width_mm * params.material_flow_stress_mpa * q
            force_kn = force_n / 1000.0
            # Roll power approx at 2 m/s
            v_roll = 2.0
            torque_nm = force_n * (l_contact / 1000.0) * 0.5
            power_kw = (2.0 * torque_nm * (v_roll / (r_mm / 1000.0))) / 1000.0
        elif params.forming_process == "upset_forging":
            l_contact = params.strip_width_mm / 2.0
            area = math.pi * ((params.strip_width_mm / 2.0) ** 2)
            force_kn = (area * params.material_flow_stress_mpa * (1.0 + (2.0 * params.friction_coefficient * (params.strip_width_mm / 2.0)) / (3.0 * params.final_thickness_or_dia_mm))) / 1000.0
            power_kw = force_kn * 0.05
        else:
            # Wire Drawing / Extrusion
            l_contact = dh
            true_strain = math.log(max(1.01, (params.initial_thickness_or_dia_mm / params.final_thickness_or_dia_mm) ** 2))
            draw_stress = params.material_flow_stress_mpa * true_strain * 1.25
            area_1 = math.pi * ((params.final_thickness_or_dia_mm / 2.0) ** 2)
            force_kn = (draw_stress * area_1) / 1000.0
            power_kw = force_kn * 1.5

        return MetalFormingForgingOutput(
            forming_process=params.forming_process,
            absolute_reduction_mm=round(dh, 2),
            percentage_reduction_pct=round(pct_red, 1),
            contact_arc_length_mm=round(l_contact, 2),
            forming_force_kn=round(force_kn, 1),
            forming_power_kw=round(power_kw, 2),
            telemetry={"dh": round(dh, 2), "force_kn": round(force_kn, 1), "pct_red": round(pct_red, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "steel_strip_rolling": {"forming_process": "flat_rolling", "initial_thickness_or_dia_mm": 25.0, "final_thickness_or_dia_mm": 18.0, "roll_radius_or_die_angle_deg": 250.0},
            "cylindrical_forging": {"forming_process": "upset_forging", "initial_thickness_or_dia_mm": 50.0, "final_thickness_or_dia_mm": 30.0, "strip_width_mm": 60.0}
        }


# ── 3. Welding Technology Engine ─────────────────────────────────────────────
class WeldingTechnologyInput(BaseModel):
    welding_process: Literal["shielded_metal_arc_smaw", "gas_tungsten_arc_gtaw", "gas_metal_arc_gmaw", "oxy_acetylene_gas"] = Field(
        default="shielded_metal_arc_smaw", description="Welding Process"
    )
    welding_current_a: float = Field(default=160.0, ge=20.0, le=600.0, description="Arc Current (A)")
    welding_voltage_v: float = Field(default=24.0, ge=10.0, le=60.0, description="Arc Voltage (V)")
    travel_speed_mm_per_min: float = Field(default=220.0, ge=20.0, le=1200.0, description="Travel Speed (mm/min)")
    plate_thickness_mm: float = Field(default=10.0, ge=1.0, le=50.0, description="Plate Thickness (mm)")
    preheat_temp_c: float = Field(default=25.0, ge=20.0, le=400.0, description="Preheat Temperature (°C)")

class WeldingTechnologyOutput(BaseModel):
    welding_process: str
    arc_power_watts: float
    arc_efficiency_eta: float
    linear_heat_input_kj_per_mm: float
    peak_haz_temperature_c: float
    cooling_rate_c_per_sec: float
    weld_joint_integrity: str
    telemetry: Dict[str, Any]

class WeldingTechnologyEngine(BaseSimulationEngine):
    name = "welding-technology"
    description = "Welding Technology Lab: Arc Heat Input (kJ/mm), HAZ Thermal Cycle, Bead Profile & Defect Inspection"

    def calculate(self, params: WeldingTechnologyInput) -> WeldingTechnologyOutput:
        efficiencies = {"shielded_metal_arc_smaw": 0.80, "gas_metal_arc_gmaw": 0.85, "gas_tungsten_arc_gtaw": 0.65, "oxy_acetylene_gas": 0.45}
        eta = efficiencies.get(params.welding_process, 0.80)

        # Arc Power P = V * I
        p_watts = params.welding_voltage_v * params.welding_current_a
        v_speed_mm_s = params.travel_speed_mm_per_min / 60.0
        # Heat Input: H = (eta * V * I) / (v * 1000)  [kJ/mm]
        h_kj_mm = (eta * p_watts) / (v_speed_mm_s * 1000.0)

        # HAZ Peak Temperature at 2mm from fusion line
        t_peak = params.preheat_temp_c + (1200.0 * (h_kj_mm / 1.0) / (params.plate_thickness_mm / 10.0))
        # Cooling rate at 540°C (Adams equation 3D thick plate approx)
        cr = (2.0 * math.pi * 0.041 * ((540.0 - params.preheat_temp_c) ** 2)) / (h_kj_mm * 1000.0)

        status = "OPTIMAL (Ductile Ferrite-Pearlite HAZ)" if cr < 45.0 else "CAUTION: Rapid Cool (Martensite Risk, Preheat Advised)"

        return WeldingTechnologyOutput(
            welding_process=params.welding_process,
            arc_power_watts=round(p_watts, 1),
            arc_efficiency_eta=eta,
            linear_heat_input_kj_per_mm=round(h_kj_mm, 3),
            peak_haz_temperature_c=round(t_peak, 1),
            cooling_rate_c_per_sec=round(cr, 2),
            weld_joint_integrity=status,
            telemetry={"h_kj_mm": round(h_kj_mm, 3), "cr": round(cr, 2), "p_watts": round(p_watts, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "smaw_mild_steel_10mm": {"welding_process": "shielded_metal_arc_smaw", "welding_current_a": 160.0, "welding_voltage_v": 24.0, "travel_speed_mm_per_min": 220.0},
            "mig_structural_pipe": {"welding_process": "gas_metal_arc_gmaw", "welding_current_a": 210.0, "welding_voltage_v": 28.0, "travel_speed_mm_per_min": 350.0}
        }


# ── 4. Shaft Couplings & Joints Engine ───────────────────────────────────────
class ShaftCouplingsJointsInput(BaseModel):
    coupling_type: Literal["protected_flange_coupling", "muff_sleeve_coupling", "oldhams_coupling", "universal_hookes_joint"] = Field(
        default="protected_flange_coupling", description="Coupling Type"
    )
    transmitted_power_kw: float = Field(default=30.0, ge=1.0, le=500.0, description="Transmitted Power (kW)")
    shaft_speed_rpm: float = Field(default=960.0, ge=50.0, le=5000.0, description="Shaft Speed (RPM)")
    allowable_shear_stress_mpa: float = Field(default=45.0, description="Allowable Shaft Shear Stress (MPa)")
    shaft_misalignment_angle_deg: float = Field(default=12.0, ge=0.0, le=30.0, description="Universal Joint Angle α (°)")

class ShaftCouplingsJointsOutput(BaseModel):
    coupling_type: str
    design_torque_nm: float
    calculated_shaft_diameter_mm: float
    flange_bolt_circle_pcd_mm: float
    number_of_coupling_bolts: int
    universal_joint_velocity_ratio_max: float
    universal_joint_velocity_ratio_min: float
    telemetry: Dict[str, Any]

class ShaftCouplingsJointsEngine(BaseSimulationEngine):
    name = "shaft-couplings-joints"
    description = "Shaft Couplings & Universal Joints: Flange, Muff, Oldham & Hooke's Joint Velocity Fluctuation"

    def calculate(self, params: ShaftCouplingsJointsInput) -> ShaftCouplingsJointsOutput:
        # Torque: T = (P * 1000 * 60) / (2 * pi * N)
        t_nm = (params.transmitted_power_kw * 60000.0) / (2.0 * math.pi * params.shaft_speed_rpm)
        # Service factor 1.25
        t_design = t_nm * 1.25

        # Shaft diameter: d = ((16 * T) / (pi * tau))^(1/3)
        t_nmm = t_design * 1000.0
        d_calc = ((16.0 * t_nmm) / (math.pi * params.allowable_shear_stress_mpa)) ** (1.0 / 3.0)
        std_d = math.ceil(d_calc / 5.0) * 5.0

        # Flange coupling proportions: D = 2d, D1 (PCD) = 3d, D2 = 4d, n_bolts = 3 to 6
        pcd = 3.0 * std_d
        n_bolts = 4 if std_d <= 40 else (6 if std_d <= 100 else 8)

        # Hooke's Joint velocity ratio extremes: max = 1/cos(alpha), min = cos(alpha)
        rad_alpha = math.radians(params.shaft_misalignment_angle_deg)
        cos_a = math.cos(rad_alpha)
        vr_max = 1.0 / max(0.1, cos_a)
        vr_min = cos_a

        return ShaftCouplingsJointsOutput(
            coupling_type=params.coupling_type,
            design_torque_nm=round(t_design, 2),
            calculated_shaft_diameter_mm=std_d,
            flange_bolt_circle_pcd_mm=round(pcd, 1),
            number_of_coupling_bolts=n_bolts,
            universal_joint_velocity_ratio_max=round(vr_max, 4),
            universal_joint_velocity_ratio_min=round(vr_min, 4),
            telemetry={"torque": round(t_design, 1), "shaft_d": std_d, "vr_max": round(vr_max, 3)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "flange_30kw_960rpm": {"coupling_type": "protected_flange_coupling", "transmitted_power_kw": 30.0, "shaft_speed_rpm": 960.0},
            "universal_joint_15deg": {"coupling_type": "universal_hookes_joint", "transmitted_power_kw": 15.0, "shaft_speed_rpm": 1440.0, "shaft_misalignment_angle_deg": 15.0}
        }


# ── 5. Plummer Block Bearings Engine ─────────────────────────────────────────
class PlummerBlockBearingsInput(BaseModel):
    bearing_type: Literal["plummer_block_pedestal", "solid_bush_bearing", "split_brass_bearing"] = Field(
        default="plummer_block_pedestal", description="Bearing Construction"
    )
    journal_diameter_mm: float = Field(default=75.0, ge=10.0, le=300.0, description="Journal Diameter D (mm)")
    bearing_length_mm: float = Field(default=90.0, ge=10.0, le=400.0, description="Bearing Length L (mm)")
    radial_load_w_kn: float = Field(default=12.5, ge=0.5, le=200.0, description="Radial Load W (kN)")
    shaft_speed_rpm: float = Field(default=720.0, ge=50.0, le=5000.0, description="Journal Speed N (RPM)")
    lubricant_viscosity_cp: float = Field(default=32.0, description="Oil Dynamic Viscosity μ (cP)")
    radial_clearance_c_microns: float = Field(default=45.0, description="Diametral Clearance c (μm)")

class PlummerBlockBearingsOutput(BaseModel):
    bearing_type: str
    bearing_pressure_mpa: float
    sommerfeld_number: float
    coefficient_of_friction_mu: float
    frictional_power_loss_watts: float
    heat_dissipated_watts: float
    lubrication_regime: str
    telemetry: Dict[str, Any]

class PlummerBlockBearingsEngine(BaseSimulationEngine):
    name = "plummer-block-bearings"
    description = "Machine Bearings Lab: Plummer Block Assembly, Bearing Pressure, Sommerfeld Number & Heat Dissipation"

    def calculate(self, params: PlummerBlockBearingsInput) -> PlummerBlockBearingsOutput:
        # Projected area: A = L * D
        proj_area_sqmm = params.bearing_length_mm * params.journal_diameter_mm
        # Bearing pressure: P = W / A
        p_mpa = (params.radial_load_w_kn * 1000.0) / proj_area_sqmm

        # Sommerfeld Number: S = (r / c)^2 * (mu * n_s / P)
        r_mm = params.journal_diameter_mm / 2.0
        c_mm = params.radial_clearance_c_microns / 1000.0
        n_s = params.shaft_speed_rpm / 60.0
        mu_pa_s = params.lubricant_viscosity_cp / 1000.0
        p_pa = p_mpa * 1e6

        s_num = ((r_mm / c_mm) ** 2) * ((mu_pa_s * n_s) / max(1.0, p_pa))

        # McKee equation for coefficient of friction
        f_coeff = (3.32 / 1e8) * ((params.lubricant_viscosity_cp * params.shaft_speed_rpm) / max(0.1, p_mpa)) * (params.journal_diameter_mm / c_mm) + 0.002

        # Friction torque: Tf = f * W * r
        t_f = f_coeff * (params.radial_load_w_kn * 1000.0) * (r_mm / 1000.0)
        power_loss = (2.0 * math.pi * params.shaft_speed_rpm * t_f) / 60.0
        heat_diss = 0.5 * (params.bearing_length_mm / 1000.0) * (params.journal_diameter_mm / 1000.0) * 15.0 * 25.0

        regime = "Thick Film Hydrodynamic Lubrication" if s_num > 0.05 else "Boundary / Mixed Lubrication"

        return PlummerBlockBearingsOutput(
            bearing_type=params.bearing_type,
            bearing_pressure_mpa=round(p_mpa, 2),
            sommerfeld_number=round(s_num, 4),
            coefficient_of_friction_mu=round(f_coeff, 4),
            frictional_power_loss_watts=round(power_loss, 1),
            heat_dissipated_watts=round(heat_diss, 1),
            lubrication_regime=regime,
            telemetry={"p_mpa": round(p_mpa, 2), "s_num": round(s_num, 4), "power_loss": round(power_loss, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "plummer_block_75mm": {"bearing_type": "plummer_block_pedestal", "journal_diameter_mm": 75.0, "bearing_length_mm": 90.0, "radial_load_w_kn": 12.5},
            "heavy_turbine_journal": {"bearing_type": "split_brass_bearing", "journal_diameter_mm": 120.0, "bearing_length_mm": 150.0, "radial_load_w_kn": 45.0}
        }


# ── 6. Iron-Carbon Phase Diagram Engine ──────────────────────────────────────
class IronCarbonPhaseDiagramInput(BaseModel):
    carbon_weight_percent: float = Field(default=0.45, ge=0.01, le=6.67, description="Carbon Content %C")
    temperature_celsius: float = Field(default=700.0, ge=20.0, le=1600.0, description="Temperature (°C)")

class IronCarbonPhaseDiagramOutput(BaseModel):
    carbon_weight_percent: float
    temperature_celsius: float
    alloy_classification: str
    stable_equilibrium_phases: str
    ferrite_phase_fraction_pct: float
    cementite_phase_fraction_pct: float
    pearlite_microstructure_fraction_pct: float
    telemetry: Dict[str, Any]

class IronCarbonPhaseDiagramEngine(BaseSimulationEngine):
    name = "iron-carbon-phase-diagram"
    description = "Iron-Carbon Equilibrium Phase Diagram: Lever Rule, Phase Fractions, Austenite & Pearlite Transformation"

    def calculate(self, params: IronCarbonPhaseDiagramInput) -> IronCarbonPhaseDiagramOutput:
        c = params.carbon_weight_percent
        temp = params.temperature_celsius

        # Classification
        if c < 0.008:
            cls_name = "Commercial Pure Iron"
        elif c < 0.77:
            cls_name = "Hypoeutectoid Plain Carbon Steel"
        elif abs(c - 0.77) < 0.03:
            cls_name = "Eutectoid Steel (100% Pearlite)"
        elif c <= 2.11:
            cls_name = "Hypereutectoid Tool Steel"
        elif c <= 4.3:
            cls_name = "Hypoeutectic Cast Iron"
        elif abs(c - 4.3) < 0.05:
            cls_name = "Eutectic Cast Iron (Ledeburite)"
        else:
            cls_name = "Hypereutectic Cast Iron"

        # Room temperature phase fractions (Lever rule between Ferrite 0.022% and Cementite 6.67%)
        c_alpha = 0.022
        c_fe3c = 6.67
        w_alpha = max(0.0, min(1.0, (c_fe3c - c) / (c_fe3c - c_alpha)))
        w_fe3c = 1.0 - w_alpha

        # Pearlite fraction at room temp for steel (< 2.11% C)
        if c <= 0.77:
            w_pearlite = (c / 0.77) * 100.0
        elif c <= 2.11:
            w_pearlite = ((6.67 - c) / (6.67 - 0.77)) * 100.0
        else:
            w_pearlite = 0.0

        # Phase description based on temperature
        if temp > 1538:
            phase_desc = "Liquid Molten Metal (L)"
        elif temp > 912 and c < 2.11:
            phase_desc = "Austenite (γ-FCC Solid Solution)"
        elif temp > 727:
            phase_desc = "Austenite + Ferrite (α + γ)" if c < 0.77 else "Austenite + Cementite (γ + Fe3C)"
        else:
            phase_desc = "Ferrite (α-BCC) + Cementite (Fe3C) [Pearlitic Structure]"

        return IronCarbonPhaseDiagramOutput(
            carbon_weight_percent=c,
            temperature_celsius=temp,
            alloy_classification=cls_name,
            stable_equilibrium_phases=phase_desc,
            ferrite_phase_fraction_pct=round(w_alpha * 100.0, 1),
            cementite_phase_fraction_pct=round(w_fe3c * 100.0, 1),
            pearlite_microstructure_fraction_pct=round(w_pearlite, 1),
            telemetry={"cls": cls_name, "pearlite": round(w_pearlite, 1), "alpha": round(w_alpha * 100.0, 1)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "mild_steel_045c": {"carbon_weight_percent": 0.45, "temperature_celsius": 700.0},
            "eutectoid_steel_077c": {"carbon_weight_percent": 0.77, "temperature_celsius": 700.0},
            "grey_cast_iron_32c": {"carbon_weight_percent": 3.2, "temperature_celsius": 700.0}
        }


# ── 7. Heat Treatment & Metallurgy Engine ────────────────────────────────────
class HeatTreatmentMetallurgyInput(BaseModel):
    heat_treatment_type: Literal["full_annealing", "normalizing", "oil_quenching_hardening", "water_quenching_hardening", "tempering_process"] = Field(
        default="oil_quenching_hardening", description="Heat Treatment Operation"
    )
    steel_grade: Literal["aisi_1045_medium_carbon", "aisi_1080_high_carbon", "aisi_4140_alloy_steel"] = Field(
        default="aisi_1045_medium_carbon", description="Steel Alloy Grade"
    )
    austenitizing_temp_c: float = Field(default=840.0, ge=700.0, le=1100.0, description="Austenitizing Temp (°C)")
    soaking_time_minutes: float = Field(default=45.0, ge=5.0, le=240.0, description="Soaking Time (min)")
    tempering_temp_c: float = Field(default=400.0, ge=150.0, le=650.0, description="Tempering Temp (°C)")

class HeatTreatmentMetallurgyOutput(BaseModel):
    heat_treatment_type: str
    resultant_microstructure: str
    achieved_hardness_hrc: float
    ultimate_tensile_strength_mpa: float
    impact_toughness_joules: float
    treatment_purpose_summary: str
    telemetry: Dict[str, Any]

class HeatTreatmentMetallurgyEngine(BaseSimulationEngine):
    name = "heat-treatment-metallurgy"
    description = "Heat Treatment Lab: Annealing, Normalizing, Quenching Hardening, Tempering & TTT Transformation"

    def calculate(self, params: HeatTreatmentMetallurgyInput) -> HeatTreatmentMetallurgyOutput:
        if params.heat_treatment_type == "full_annealing":
            micro = "Coarse Pearlite + Proeutectoid Ferrite"
            hrc = 18.0
            uts = 560.0
            tough = 85.0
            summary = "Maximum ductility, relieves internal stresses, softest machinable state."
        elif params.heat_treatment_type == "normalizing":
            micro = "Fine Pearlite + Refined Grain Ferrite"
            hrc = 24.0
            uts = 680.0
            tough = 65.0
            summary = "Uniform fine grain structure, improved yield strength and toughness."
        elif params.heat_treatment_type == "water_quenching_hardening":
            micro = "100% Acicular Martensite (Brittle)"
            hrc = 58.0
            uts = 1850.0
            tough = 12.0
            summary = "Maximum hardness and wear resistance, requires immediate tempering."
        elif params.heat_treatment_type == "oil_quenching_hardening":
            micro = "Tempered Martensite + Lower Bainite"
            hrc = 52.0
            uts = 1620.0
            tough = 22.0
            summary = "High hardness with moderate thermal shock and reduced distortion."
        else:
            # Tempering
            temp_ratio = (params.tempering_temp_c - 150.0) / 500.0
            hrc = 55.0 - (temp_ratio * 25.0)
            uts = 1750.0 - (temp_ratio * 800.0)
            tough = 20.0 + (temp_ratio * 55.0)
            micro = "Tempered Martensite (Sorbite / Troostite)"
            summary = "Relieves quench brittleness, balances high strength with impact toughness."

        return HeatTreatmentMetallurgyOutput(
            heat_treatment_type=params.heat_treatment_type,
            resultant_microstructure=micro,
            achieved_hardness_hrc=round(hrc, 1),
            ultimate_tensile_strength_mpa=round(uts, 1),
            impact_toughness_joules=round(tough, 1),
            treatment_purpose_summary=summary,
            telemetry={"hrc": round(hrc, 1), "uts": round(uts, 1), "micro": micro}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "oil_quench_1045": {"heat_treatment_type": "oil_quenching_hardening", "steel_grade": "aisi_1045_medium_carbon", "austenitizing_temp_c": 840.0},
            "medium_temper_400c": {"heat_treatment_type": "tempering_process", "tempering_temp_c": 400.0}
        }


# ── 8. NDT Materials Testing Engine ──────────────────────────────────────────
class NDTMaterialsTestingInput(BaseModel):
    ndt_method: Literal["ultrasonic_pulse_echo", "radiographic_testing", "magnetic_particle_mpi", "dye_penetrant_dpi"] = Field(
        default="ultrasonic_pulse_echo", description="NDT Testing Method"
    )
    test_block_thickness_mm: float = Field(default=50.0, ge=5.0, le=300.0, description="Material Thickness (mm)")
    ultrasonic_velocity_m_per_s: float = Field(default=5920.0, description="Longitudinal Wave Velocity (m/s)")
    measured_time_flight_microsec: float = Field(default=10.14, ge=0.5, le=100.0, description="Echo Time of Flight (μs)")
    flaw_echo_amplitude_pct: float = Field(default=68.0, ge=0.0, le=100.0, description="Flaw Echo Screen Height (%)")

class NDTMaterialsTestingOutput(BaseModel):
    ndt_method: str
    detected_flaw_depth_mm: float
    backwall_echo_depth_mm: float
    flaw_severity_classification: str
    acceptance_criteria_asme_sec_v: str
    telemetry: Dict[str, Any]

class NDTMaterialsTestingEngine(BaseSimulationEngine):
    name = "ndt-materials-testing"
    description = "Non-Destructive Testing Lab: Ultrasonic Flaw Detection (UT), Radiography, MPI & ASME Acceptance"

    def calculate(self, params: NDTMaterialsTestingInput) -> NDTMaterialsTestingOutput:
        # Depth d = (v * t) / 2
        d_flaw = (params.ultrasonic_velocity_m_per_s * (params.measured_time_flight_microsec * 1e-6) / 2.0) * 1000.0
        d_backwall = params.test_block_thickness_mm

        is_flaw = d_flaw < (d_backwall * 0.95)
        severity = "REJECTABLE: Sub-surface crack/inclusion" if (is_flaw and params.flaw_echo_amplitude_pct > 50.0) else "ACCEPTABLE: Minor porosity within ASME Sec V limits"
        status = "FAIL (ASME Sec V Art. 4)" if (is_flaw and params.flaw_echo_amplitude_pct > 50.0) else "PASS (Clean Specimen)"

        return NDTMaterialsTestingOutput(
            ndt_method=params.ndt_method,
            detected_flaw_depth_mm=round(d_flaw, 2),
            backwall_echo_depth_mm=round(d_backwall, 2),
            flaw_severity_classification=severity,
            acceptance_criteria_asme_sec_v=status,
            telemetry={"d_flaw": round(d_flaw, 2), "amp": params.flaw_echo_amplitude_pct, "status": status}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "ut_steel_plate_flaw_30mm": {"ndt_method": "ultrasonic_pulse_echo", "test_block_thickness_mm": 50.0, "measured_time_flight_microsec": 10.14, "flaw_echo_amplitude_pct": 68.0},
            "ut_sound_block": {"ndt_method": "ultrasonic_pulse_echo", "test_block_thickness_mm": 50.0, "measured_time_flight_microsec": 16.89, "flaw_echo_amplitude_pct": 10.0}
        }


# ── 9. Air Standard Cycles Engine ────────────────────────────────────────────
class AirStandardCyclesInput(BaseModel):
    cycle_type: Literal["otto_petrol_cycle", "diesel_cycle", "carnot_ideal_cycle", "dual_combustion_cycle"] = Field(
        default="otto_petrol_cycle", description="Thermodynamic Air Cycle"
    )
    compression_ratio_r: float = Field(default=8.5, ge=4.0, le=24.0, description="Compression Ratio r")
    cut_off_ratio_rc: float = Field(default=2.0, ge=1.1, le=5.0, description="Diesel Cut-off Ratio rc")
    initial_pressure_p1_bar: float = Field(default=1.013, description="Suction Pressure P1 (Bar)")
    initial_temperature_t1_k: float = Field(default=300.0, description="Suction Temp T1 (K)")
    specific_heat_ratio_gamma: float = Field(default=1.40, description="Ratio of Specific Heats γ")

class AirStandardCyclesOutput(BaseModel):
    cycle_type: str
    air_standard_efficiency_pct: float
    max_cycle_pressure_p3_bar: float
    max_cycle_temperature_t3_k: float
    net_work_done_kj_per_kg: float
    mean_effective_pressure_bar: float
    telemetry: Dict[str, Any]

class AirStandardCyclesEngine(BaseSimulationEngine):
    name = "air-standard-cycles"
    description = "Air Standard Cycles Lab: Otto, Diesel, Dual & Carnot Cycle Efficiency, P-V & T-s Indicator Diagrams"

    def calculate(self, params: AirStandardCyclesInput) -> AirStandardCyclesOutput:
        gamma = params.specific_heat_ratio_gamma
        r = params.compression_ratio_r
        rc = params.cut_off_ratio_rc

        if params.cycle_type == "otto_petrol_cycle":
            # eta_otto = 1 - 1 / r^(gamma - 1)
            eta = 1.0 - (1.0 / (r ** (gamma - 1.0)))
            t2 = params.initial_temperature_t1_k * (r ** (gamma - 1.0))
            t3 = t2 * 2.6
            p2 = params.initial_pressure_p1_bar * (r ** gamma)
            p3 = p2 * 2.6
            q_in = 0.718 * (t3 - t2)
            w_net = q_in * eta
        elif params.cycle_type == "diesel_cycle":
            # eta_diesel = 1 - (1 / r^(gamma - 1)) * [ (rc^gamma - 1) / (gamma * (rc - 1)) ]
            bracket = (rc ** gamma - 1.0) / (gamma * (rc - 1.0))
            eta = 1.0 - (1.0 / (r ** (gamma - 1.0))) * bracket
            t2 = params.initial_temperature_t1_k * (r ** (gamma - 1.0))
            t3 = t2 * rc
            p2 = params.initial_pressure_p1_bar * (r ** gamma)
            p3 = p2
            q_in = 1.005 * (t3 - t2)
            w_net = q_in * eta
        else:
            # Carnot
            t_high = 1600.0
            eta = 1.0 - (params.initial_temperature_t1_k / t_high)
            p3 = params.initial_pressure_p1_bar * 45.0
            t3 = t_high
            w_net = 450.0

        v1 = 0.287 * params.initial_temperature_t1_k / (params.initial_pressure_p1_bar * 100.0)
        vs = v1 * (1.0 - 1.0 / r)
        pmep = w_net / max(0.01, vs) / 100.0

        return AirStandardCyclesOutput(
            cycle_type=params.cycle_type,
            air_standard_efficiency_pct=round(eta * 100.0, 2),
            max_cycle_pressure_p3_bar=round(p3, 2),
            max_cycle_temperature_t3_k=round(t3, 1),
            net_work_done_kj_per_kg=round(w_net, 1),
            mean_effective_pressure_bar=round(pmep, 2),
            telemetry={"eta": round(eta * 100.0, 2), "p3": round(p3, 1), "pmep": round(pmep, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "otto_petrol_r85": {"cycle_type": "otto_petrol_cycle", "compression_ratio_r": 8.5},
            "diesel_r16_rc2": {"cycle_type": "diesel_cycle", "compression_ratio_r": 16.5, "cut_off_ratio_rc": 2.0}
        }


# ── 10. Steam Properties & Mollier Engine ────────────────────────────────────
class SteamPropertiesMollierInput(BaseModel):
    steam_condition: Literal["wet_steam", "dry_saturated_steam", "superheated_steam"] = Field(
        default="wet_steam", description="Steam State"
    )
    steam_pressure_bar: float = Field(default=10.0, ge=0.5, le=100.0, description="Steam Pressure P (Bar)")
    dryness_fraction_x: float = Field(default=0.88, ge=0.1, le=1.0, description="Dryness Fraction x")
    superheat_temp_c: float = Field(default=260.0, ge=100.0, le=600.0, description="Steam Temp for Superheated (°C)")

class SteamPropertiesMollierOutput(BaseModel):
    steam_condition: str
    saturation_temperature_tsat_c: float
    sensible_heat_hf_kj_per_kg: float
    latent_heat_hfg_kj_per_kg: float
    total_enthalpy_h_kj_per_kg: float
    total_entropy_s_kj_per_kg_k: float
    specific_volume_v_cu_m_per_kg: float
    telemetry: Dict[str, Any]

class SteamPropertiesMollierEngine(BaseSimulationEngine):
    name = "steam-properties-mollier"
    description = "Steam Properties Lab: Enthalpy, Dryness Fraction, Mollier Diagram & Throttling Calorimeter"

    def calculate(self, params: SteamPropertiesMollierInput) -> SteamPropertiesMollierOutput:
        p = params.steam_pressure_bar
        # Approx saturation temperature: Tsat ≈ 100 + 40 * ln(P)
        tsat = 100.0 + 38.5 * math.log(max(1.0, p))
        hf = 4.187 * tsat
        hfg = 2257.0 - (1.8 * (tsat - 100.0))
        sf = 4.187 * math.log((tsat + 273.15) / 273.15)
        sfg = hfg / (tsat + 273.15)
        vg = 1.673 / max(1.0, p ** 0.94)

        if params.steam_condition == "wet_steam":
            x = params.dryness_fraction_x
            h = hf + (x * hfg)
            s = sf + (x * sfg)
            v = x * vg
        elif params.steam_condition == "dry_saturated_steam":
            h = hf + hfg
            s = sf + sfg
            v = vg
        else:
            # Superheated
            cps = 2.1  # kJ/kg-K
            t_sup = max(tsat + 10.0, params.superheat_temp_c)
            h = hf + hfg + cps * (t_sup - tsat)
            s = sf + sfg + cps * math.log((t_sup + 273.15) / (tsat + 273.15))
            v = vg * ((t_sup + 273.15) / (tsat + 273.15))

        return SteamPropertiesMollierOutput(
            steam_condition=params.steam_condition,
            saturation_temperature_tsat_c=round(tsat, 2),
            sensible_heat_hf_kj_per_kg=round(hf, 1),
            latent_heat_hfg_kj_per_kg=round(hfg, 1),
            total_enthalpy_h_kj_per_kg=round(h, 1),
            total_entropy_s_kj_per_kg_k=round(s, 4),
            specific_volume_v_cu_m_per_kg=round(v, 4),
            telemetry={"tsat": round(tsat, 1), "enthalpy": round(h, 1), "entropy": round(s, 3)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "wet_steam_10bar_x88": {"steam_condition": "wet_steam", "steam_pressure_bar": 10.0, "dryness_fraction_x": 0.88},
            "superheated_15bar_300c": {"steam_condition": "superheated_steam", "steam_pressure_bar": 15.0, "superheat_temp_c": 300.0}
        }


# ── 11. Steam Boilers & Mountings Engine ─────────────────────────────────────
class SteamBoilersMountingsInput(BaseModel):
    boiler_type: Literal["babcock_and_wilcox_water_tube", "cochran_vertical_fire_tube", "lancashire_horizontal_fire_tube"] = Field(
        default="babcock_and_wilcox_water_tube", description="Boiler Construction"
    )
    steam_generation_rate_kg_per_hr: float = Field(default=5500.0, ge=100.0, le=100000.0, description="Steam Output (kg/hr)")
    steam_working_pressure_bar: float = Field(default=16.0, ge=2.0, le=80.0, description="Working Pressure (Bar)")
    feedwater_inlet_temp_c: float = Field(default=45.0, ge=10.0, le=120.0, description="Feedwater Inlet Temp (°C)")
    coal_fuel_consumption_kg_per_hr: float = Field(default=680.0, ge=10.0, le=15000.0, description="Fuel Rate (kg/hr)")
    fuel_calorific_value_kj_per_kg: float = Field(default=28500.0, description="Fuel Calorific Value CV (kJ/kg)")

class SteamBoilersMountingsOutput(BaseModel):
    boiler_type: str
    actual_evaporation_ratio_kg_per_kg_fuel: float
    equivalent_evaporation_from_at_100c_kg_per_hr: float
    boiler_thermal_efficiency_pct: float
    boiler_horsepower_bhp: float
    heat_absorbed_by_steam_kj_per_hr: float
    telemetry: Dict[str, Any]

class SteamBoilersMountingsEngine(BaseSimulationEngine):
    name = "steam-boilers-mountings"
    description = "Steam Boilers Lab: Babcock & Wilcox, Cochran Boiler, Equivalent Evaporation & Boiler Thermal Efficiency"

    def calculate(self, params: SteamBoilersMountingsInput) -> SteamBoilersMountingsOutput:
        # Enthalpy of steam at P bar
        tsat = 100.0 + 38.5 * math.log(max(1.0, params.steam_working_pressure_bar))
        hf_feed = 4.187 * params.feedwater_inlet_temp_c
        h_steam = 4.187 * tsat + 2257.0 - (1.8 * (tsat - 100.0))

        # Actual Evaporation Ratio ma = ms / mf
        ma = params.steam_generation_rate_kg_per_hr / max(1.0, params.coal_fuel_consumption_kg_per_hr)
        # Heat absorbed by steam: Q_steam = ms * (h - hf1)
        q_steam = params.steam_generation_rate_kg_per_hr * (h_steam - hf_feed)
        # Heat supplied by fuel: Q_fuel = mf * CV
        q_fuel = params.coal_fuel_consumption_kg_per_hr * params.fuel_calorific_value_kj_per_kg

        # Thermal Efficiency: eta = Q_steam / Q_fuel * 100%
        eta = (q_steam / max(1.0, q_fuel)) * 100.0

        # Equivalent evaporation: Ee = ms * (h - hf1) / 2257
        ee = q_steam / 2257.0
        # Boiler Horsepower: 1 BHP = 15.65 kg/hr equivalent evaporation
        bhp = ee / 15.65

        return SteamBoilersMountingsOutput(
            boiler_type=params.boiler_type,
            actual_evaporation_ratio_kg_per_kg_fuel=round(ma, 2),
            equivalent_evaporation_from_at_100c_kg_per_hr=round(ee, 1),
            boiler_thermal_efficiency_pct=round(eta, 2),
            boiler_horsepower_bhp=round(bhp, 1),
            heat_absorbed_by_steam_kj_per_hr=round(q_steam, 1),
            telemetry={"eta": round(eta, 2), "ee": round(ee, 1), "ma": round(ma, 2)}
        )

    def get_presets(self) -> Dict[str, Any]:
        return {
            "babcock_water_tube_16bar": {"boiler_type": "babcock_and_wilcox_water_tube", "steam_generation_rate_kg_per_hr": 5500.0, "steam_working_pressure_bar": 16.0},
            "cochran_vertical_10bar": {"boiler_type": "cochran_vertical_fire_tube", "steam_generation_rate_kg_per_hr": 1800.0, "steam_working_pressure_bar": 10.0, "coal_fuel_consumption_kg_per_hr": 250.0}
        }
