"""
Economic Order Quantity (EOQ) & Inventory Control Physics Engine
================================================================
Calculates optimal batch size EOQ Q*, total annual inventory cost TC,
reorder point ROP, and ordering frequency.
"""

import math
from typing import Dict, Any
from pydantic import BaseModel, Field
from .base import BaseSimulationEngine


class EconomicOrderQuantityInput(BaseModel):
    annual_demand_d_units: float = Field(default=12000.0, ge=100.0, le=1000000.0, description="Annual demand D in units/year")
    ordering_cost_s_per_order: float = Field(default=150.0, ge=5.0, le=5000.0, description="Setup / Ordering cost S in $/order")
    holding_cost_h_per_unit_yr: float = Field(default=4.0, ge=0.1, le=500.0, description="Holding / Carrying cost H in $/unit/year")
    lead_time_days: float = Field(default=7.0, ge=1.0, le=90.0, description="Replenishment lead time L in days")


class EconomicOrderQuantityOutput(BaseModel):
    eoq_optimal_batch_units: float
    total_annual_inventory_cost: float
    reorder_point_rop_units: float
    orders_per_year: float
    order_cycle_time_days: float
    status_note: str


class EconomicOrderQuantityEngine(BaseSimulationEngine):
    name = "economic-order-quantity"
    description = "Industrial Inventory Control: EOQ batch size Q* = sqrt(2*D*S/H), total annual cost TC, and Reorder Point ROP"

    def calculate(self, params: EconomicOrderQuantityInput) -> EconomicOrderQuantityOutput:
        d = params.annual_demand_d_units
        s = params.ordering_cost_s_per_order
        h = params.holding_cost_h_per_unit_yr
        lead_days = params.lead_time_days

        # EOQ Formula Q* = sqrt(2 * D * S / H)
        q_eoq = math.sqrt((2.0 * d * s) / h) if h > 0 else 1000.0

        # Total Annual Cost TC(Q) = (D / Q) * S + (Q / 2) * H
        tc_annual = (d / q_eoq) * s + (q_eoq / 2.0) * h

        # Orders per year N = D / Q*
        n_orders = d / q_eoq

        # Order Cycle Time (days) = 365 / N
        cycle_days = 365.0 / n_orders if n_orders > 0 else 365.0

        # Daily Demand d_daily = D / 365
        d_daily = d / 365.0

        # Reorder Point ROP = d_daily * Lead_time
        rop_units = d_daily * lead_days

        note = (
            f"Inventory EOQ Model (Annual Demand D = {d:.0f} units, S = ${s:.0f}, H = ${h:.2f}/unit): "
            f"Optimal Order Quantity EOQ Q* = {q_eoq:.0f} units | Reorder Point ROP = {rop_units:.0f} units | "
            f"Total Annual Inventory Cost TC = ${tc_annual:.2f} ({n_orders:.1f} orders/year every {cycle_days:.1f} days)."
        )

        return EconomicOrderQuantityOutput(
            eoq_optimal_batch_units=float(q_eoq),
            total_annual_inventory_cost=float(tc_annual),
            reorder_point_rop_units=float(rop_units),
            orders_per_year=float(n_orders),
            order_cycle_time_days=float(cycle_days),
            status_note=note
        )

    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        return {
            "high_volume_factory_parts": {
                "name": "High-Volume Factory Component (D = 12,000 units/yr)",
                "params": {"annual_demand_d_units": 12000.0, "ordering_cost_s_per_order": 150.0, "holding_cost_h_per_unit_yr": 4.0, "lead_time_days": 7.0}
            },
            "expensive_spare_parts": {
                "name": "Expensive Machinery Spare Parts (D = 500 units/yr)",
                "params": {"annual_demand_d_units": 500.0, "ordering_cost_s_per_order": 500.0, "holding_cost_h_per_unit_yr": 50.0, "lead_time_days": 14.0}
            }
        }
