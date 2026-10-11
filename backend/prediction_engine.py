"""
AquaNex Prediction & Explanation Engine
Provides comprehensive environmental risk assessments, 7-day water forecasts,
explainability breakdowns, and what-if simulation differentials.
"""

import datetime
from typing import Dict, Any, List
from backend.risk_engine import (
    calculate_flood_risk,
    calculate_waterlogging_risk,
    calculate_water_shortage_risk,
    calculate_heat_risk,
    calculate_leak_risk,
    calculate_drought_risk,
    calculate_overall_risk,
    get_risk_level,
    clamp
)

def evaluate_full_risk_profile(params: Dict[str, Any]) -> Dict[str, Any]:
    rainfall_mm = float(params.get("rainfall_mm", 0.0))
    rainfall_intensity = float(params.get("rainfall_intensity", 0.0))
    temperature_c = float(params.get("temperature_c", 28.0))
    humidity_percent = float(params.get("humidity_percent", 65.0))
    groundwater_percent = float(params.get("groundwater_percent", 70.0))
    daily_demand = float(params.get("daily_demand_liters", 500000.0))
    daily_supply = float(params.get("daily_supply_liters", 480000.0))
    drainage_capacity = float(params.get("drainage_capacity_percent", 75.0))
    soil_saturation = float(params.get("soil_saturation_percent", 45.0))
    historical_flooding = float(params.get("historical_flooding_index", 25.0))
    historical_drought = float(params.get("historical_drought_index", 20.0))
    observed_consumption = float(params.get("observed_consumption_liters", daily_demand))
    normal_consumption = float(params.get("normal_consumption_liters", daily_demand * 0.95))

    # Evaluate all 6 hazard domains
    flood = calculate_flood_risk(rainfall_mm, rainfall_intensity, soil_saturation, drainage_capacity, historical_flooding)
    waterlogging = calculate_waterlogging_risk(rainfall_mm, drainage_capacity, soil_saturation, low_lying_vulnerability=historical_flooding * 1.2, historical_waterlogging=historical_flooding)
    shortage = calculate_water_shortage_risk(daily_demand, daily_supply, groundwater_percent, temperature_c, rainfall_deficit=max(0.0, 50.0 - rainfall_mm))
    heat = calculate_heat_risk(temperature_c, humidity_percent)
    leak = calculate_leak_risk(normal_consumption, observed_consumption)
    drought = calculate_drought_risk(groundwater_percent, rainfall_deficit=max(0.0, 60.0 - rainfall_mm), temperature_c=temperature_c, daily_demand=daily_demand, historical_drought=historical_drought)

    overall_score, overall_level, summary_expl = calculate_overall_risk(
        flood["score"],
        waterlogging["score"],
        shortage["score"],
        heat["score"],
        leak["score"],
        drought["score"]
    )

    assessment = {
        "flood_risk": flood["score"],
        "waterlogging_risk": waterlogging["score"],
        "shortage_risk": shortage["score"],
        "heat_risk": heat["score"],
        "leak_risk": leak["score"],
        "drought_risk": drought["score"],
        "overall_risk": overall_score,
        "risk_level": overall_level,
        "confidence_type": "heuristic",
        "summary_explanation": summary_expl,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

    details = {
        "flood": flood,
        "waterlogging": waterlogging,
        "shortage": shortage,
        "heat": heat,
        "leak": leak,
        "drought": drought
    }

    return {
        "assessment": assessment,
        "details": details
    }

def generate_7day_water_forecast(location_data: Dict[str, Any]) -> Dict[str, Any]:
    base_demand = float(location_data.get("daily_demand_liters", 500000.0))
    base_supply = float(location_data.get("daily_supply_liters", 480000.0))
    base_gw = float(location_data.get("groundwater_percent", 65.0))
    base_temp = float(location_data.get("temperature_c", 30.0))
    loc_id = location_data.get("id")
    loc_name = location_data.get("name", "Metro Region")

    forecast_days = []
    total_shortage = 0.0
    peak_shortage_vol = -1.0
    peak_day_str = "Day 1"

    # Deterministic 7-day pattern
    # Simulate gradual temperature progression and groundwater drawdown
    temp_adjustments = [0.0, 0.8, 1.5, 2.1, 1.8, 1.0, 0.4]
    supply_variation = [1.0, 0.98, 0.95, 0.92, 0.94, 0.96, 0.98]
    demand_variation = [1.0, 1.02, 1.05, 1.08, 1.06, 1.03, 1.01]

    start_date = datetime.date.today()

    for i in range(7):
        cur_date = start_date + datetime.timedelta(days=i)
        date_str = cur_date.strftime("%Y-%m-%d")
        day_name = cur_date.strftime("%a")

        t_sim = base_temp + temp_adjustments[i]
        d_sim = round(base_demand * demand_variation[i], 0)
        s_sim = round(base_supply * supply_variation[i], 0)
        gw_sim = round(clamp(base_gw - (i * 0.9), 10.0, 100.0), 1)

        deficit = max(0.0, d_sim - s_sim)
        total_shortage += deficit

        shortage_eval = calculate_water_shortage_risk(d_sim, s_sim, gw_sim, t_sim, rainfall_deficit=40.0)
        shortage_score = shortage_eval["score"]
        shortage_level = shortage_eval["risk_level"]

        if deficit > peak_shortage_vol:
            peak_shortage_vol = deficit
            peak_day_str = f"{day_name} ({date_str})"

        forecast_days.append({
            "date": date_str,
            "day_name": day_name,
            "demand_liters": d_sim,
            "supply_liters": s_sim,
            "groundwater_percent": gw_sim,
            "shortage_risk": shortage_score,
            "shortage_liters": round(deficit, 0),
            "risk_level": shortage_level
        })

    insight = (
        f"Projected demand exceeds available bulk supply over {sum(1 for d in forecast_days if d['shortage_liters'] > 0)} "
        f"of the next 7 days in {loc_name}. Peak simulated shortage reaches {round(peak_shortage_vol):,} L on {peak_day_str}."
    )

    return {
        "location_id": loc_id,
        "location_name": loc_name,
        "forecast_days": forecast_days,
        "total_shortage_projected_liters": round(total_shortage, 0),
        "peak_shortage_day": peak_day_str,
        "insight_summary": insight,
        "disclaimer": "Prototype Mode • Deterministic Simulated Water Balance Forecast"
    }

def explain_risk_assessment(risk_type: str, score: float = None, params: Dict[str, float] = None) -> Dict[str, Any]:
    rt = risk_type.lower()
    p = params or {}
    
    # If parameters provided, evaluate through appropriate engine
    if rt in ["flood", "flooding"]:
        res = calculate_flood_risk(
            p.get("rainfall_mm", 85.0),
            p.get("rainfall_intensity", 24.0),
            p.get("soil_saturation_percent", 75.0),
            p.get("drainage_capacity_percent", 40.0),
            p.get("historical_flooding_index", 45.0)
        )
    elif rt in ["waterlogging", "urban waterlogging"]:
        res = calculate_waterlogging_risk(
            p.get("rainfall_mm", 75.0),
            p.get("drainage_capacity_percent", 35.0),
            p.get("soil_saturation_percent", 70.0)
        )
    elif rt in ["shortage", "water shortage"]:
        res = calculate_water_shortage_risk(
            p.get("daily_demand_liters", 520000.0),
            p.get("daily_supply_liters", 400000.0),
            p.get("groundwater_percent", 42.0),
            p.get("temperature_c", 34.0)
        )
    elif rt in ["heat", "heat stress"]:
        res = calculate_heat_risk(
            p.get("temperature_c", 38.0),
            p.get("humidity_percent", 72.0)
        )
    elif rt in ["leak", "leakage", "pipeline leak"]:
        res = calculate_leak_risk(
            p.get("normal_consumption", 250000.0),
            p.get("observed_consumption", 340000.0)
        )
    elif rt in ["drought"]:
        res = calculate_drought_risk(
            p.get("groundwater_percent", 35.0),
            p.get("rainfall_deficit", 55.0),
            p.get("temperature_c", 35.0),
            p.get("daily_demand_liters", 450000.0)
        )
    else:
        # Fallback to general explanation
        s = score if score is not None else 65.0
        lvl = get_risk_level(s)
        return {
            "risk_type": risk_type,
            "score": s,
            "risk_level": lvl,
            "confidence_type": "heuristic",
            "explanation": f"Composite indicator calculated from localized multi-hazard sensor vector.",
            "contributing_factors": [
                {"name": "Aggregated Environmental Sensor Vector", "value": s, "unit": "idx", "impact": "Elevating", "weight_pct": 100.0}
            ],
            "actions": ["Verify field sensor telemetry and review operational protocols."],
            "prediction_window": "Next 24-48 Hours",
            "simulated_data_disclaimer": "Prototype Mode • Heuristic Explainability Breakdown"
        }

    return {
        "risk_type": risk_type,
        "score": res["score"],
        "risk_level": res["risk_level"],
        "confidence_type": res["confidence_type"],
        "explanation": res["explanation"],
        "contributing_factors": res["contributing_factors"],
        "actions": res["actions"],
        "prediction_window": res["prediction_horizon"],
        "simulated_data_disclaimer": "Prototype Mode • Transparent Input Breakdown"
    }
