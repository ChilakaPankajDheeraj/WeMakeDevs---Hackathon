"""
AquaNex Tanker Fleet Allocation Optimizer
Deterministic decision-support optimizer for dispatching municipal water tankers
during localized water shortages.
Strictly respects resource constraints:
- Total allocated tankers <= Available tankers
- No negative allocations
- Allocations capped at actual location deficit
"""

import math
from typing import List, Dict, Any

def optimize_tanker_allocation(
    available_tankers: int,
    tanker_capacity_liters: float,
    locations_demand: List[Dict[str, Any]]
) -> Dict[str, Any]:
    if available_tankers < 0:
        raise ValueError("Available tankers cannot be negative.")
    if tanker_capacity_liters <= 0:
        raise ValueError("Tanker capacity must be greater than zero.")

    # Initialize location state
    loc_states = []
    total_net_shortage = 0.0

    for loc in locations_demand:
        dem = max(0.0, float(loc.get("demand_liters", 0.0)))
        sup = max(0.0, float(loc.get("supply_liters", 0.0)))
        shortage = max(0.0, dem - sup)
        risk = max(0.0, min(100.0, float(loc.get("shortage_risk", 50.0))))
        prio = max(1, min(5, int(loc.get("priority_weight", 3))))
        pop = max(1, int(loc.get("population", 10000)))
        
        # Tankers required to achieve 100% fulfillment
        max_tankers_needed = math.ceil(shortage / tanker_capacity_liters) if shortage > 0 else 0
        
        # Base urgency weight (0 to 1 scale)
        urgency_weight = (
            (risk / 100.0) * 0.40 +
            (prio / 5.0) * 0.35 +
            min(1.0, (pop / 100000.0)) * 0.25
        )

        total_net_shortage += shortage
        loc_states.append({
            "id": loc.get("id"),
            "name": loc.get("name", f"Location-{loc.get('id')}"),
            "demand": dem,
            "supply": sup,
            "shortage": shortage,
            "risk": risk,
            "priority": prio,
            "population": pop,
            "max_tankers_needed": max_tankers_needed,
            "urgency_weight": urgency_weight,
            "allocated_tankers": 0
        })

    # Deterministic incremental allocation
    tankers_remaining = available_tankers

    # Round 1: ensure high urgency locations with unmet deficit receive at least 1 tanker if possible
    # Sort by urgency weight descending
    sorted_by_urgency = sorted(
        [l for l in loc_states if l["shortage"] > 0],
        key=lambda x: (x["urgency_weight"], x["shortage"]),
        reverse=True
    )

    # Greedily allocate 1 tanker per step to the location with highest remaining deficit * urgency
    while tankers_remaining > 0:
        best_candidate = None
        best_score = -1.0

        for l in sorted_by_urgency:
            if l["allocated_tankers"] < l["max_tankers_needed"]:
                # Current unmet deficit for this location
                current_unmet = max(0.0, l["shortage"] - (l["allocated_tankers"] * tanker_capacity_liters))
                marginal_score = current_unmet * l["urgency_weight"]
                if marginal_score > best_score:
                    best_score = marginal_score
                    best_candidate = l

        if best_candidate is None:
            # All deficits fulfilled or no eligible locations remain
            break

        best_candidate["allocated_tankers"] += 1
        tankers_remaining -= 1

    # Compile allocation summaries
    allocations = []
    total_water_dispatched = 0.0
    total_unmet_demand = 0.0

    for l in loc_states:
        alloc_vol = min(l["shortage"], l["allocated_tankers"] * tanker_capacity_liters)
        unmet = max(0.0, l["shortage"] - (l["allocated_tankers"] * tanker_capacity_liters))
        fulfillment_pct = round((alloc_vol / l["shortage"] * 100.0), 1) if l["shortage"] > 0 else 100.0
        
        total_water_dispatched += (l["allocated_tankers"] * tanker_capacity_liters)
        total_unmet_demand += unmet

        rationale = ""
        if l["shortage"] == 0:
            rationale = "Zero net deficit; regular pipe supply meets 100% of demand."
        elif l["allocated_tankers"] == 0:
            rationale = f"Deferred due to lower relative urgency weight ({round(l['urgency_weight'], 2)}) vs fleet constraints."
        else:
            rationale = (
                f"Dispatched {l['allocated_tankers']} tankers ({round(alloc_vol):,} L) covering "
                f"{fulfillment_pct}% of deficit based on Risk Score {l['risk']}/100 and Priority {l['priority']}/5."
            )

        allocations.append({
            "location_id": l["id"],
            "location_name": l["name"],
            "initial_demand_liters": l["demand"],
            "initial_supply_liters": l["supply"],
            "net_shortage_liters": l["shortage"],
            "shortage_risk": l["risk"],
            "priority_weight": l["priority"],
            "population": l["population"],
            "allocated_tankers": l["allocated_tankers"],
            "allocated_water_liters": round(alloc_vol, 1),
            "unmet_demand_liters": round(unmet, 1),
            "fulfillment_rate_percent": fulfillment_pct,
            "allocation_rationale": rationale
        })

    allocated_count = available_tankers - tankers_remaining
    overall_fulfillment = round(((total_net_shortage - total_unmet_demand) / total_net_shortage * 100.0), 1) if total_net_shortage > 0 else 100.0

    summary = (
        f"Optimized fleet dispatch of {allocated_count}/{available_tankers} tankers delivering "
        f"{round(total_water_dispatched):,} L across {len(allocations)} sectors. "
        f"Overall deficit fulfillment reached {overall_fulfillment}%."
    )

    return {
        "total_tankers_available": available_tankers,
        "total_tankers_allocated": allocated_count,
        "remaining_idle_tankers": tankers_remaining,
        "total_water_dispatched_liters": round(total_water_dispatched, 1),
        "total_unmet_demand_liters": round(total_unmet_demand, 1),
        "overall_fulfillment_rate_percent": overall_fulfillment,
        "allocations": allocations,
        "optimization_summary": summary,
        "disclaimer": "Prototype Decision-Support Tool • Requires Municipal Dispatch Review"
    }
