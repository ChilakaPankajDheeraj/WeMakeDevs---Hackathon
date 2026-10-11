"""
AquaNex AI Risk Engine
Deterministic, bounded [0, 100] environmental risk calculations.
Levels:
  0-30: LOW
  31-60: MODERATE
  61-80: HIGH
  81-100: CRITICAL
All functions are deterministic, handle edge cases / zero division gracefully, and clamp outputs.
"""

from typing import Dict, Any, Tuple, List

def clamp(val: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    return max(min_val, min(max_val, float(val)))

def get_risk_level(score: float) -> str:
    s = clamp(score)
    if s <= 30.0:
        return "LOW"
    elif s <= 60.0:
        return "MODERATE"
    elif s <= 80.0:
        return "HIGH"
    else:
        return "CRITICAL"

def calculate_flood_risk(
    rainfall_mm: float,
    rainfall_intensity: float,
    soil_saturation: float,
    drainage_capacity: float,
    historical_flooding: float = 25.0
) -> Dict[str, Any]:
    """
    Flood Risk Formulation:
    - 35% Normalized 24h rainfall (benchmark 150mm)
    - 20% Rainfall intensity rate (benchmark 50mm/hr)
    - 20% Soil saturation percentage
    - 15% Drainage inadequacy (100 - drainage_capacity)
    - 10% Historical flood vulnerability index
    """
    rain_factor = clamp((rainfall_mm / 150.0) * 100.0)
    intensity_factor = clamp((rainfall_intensity / 50.0) * 100.0)
    soil_factor = clamp(soil_saturation)
    drainage_deficit = clamp(100.0 - drainage_capacity)
    history_factor = clamp(historical_flooding)

    raw_score = (
        0.35 * rain_factor +
        0.20 * intensity_factor +
        0.20 * soil_factor +
        0.15 * drainage_deficit +
        0.10 * history_factor
    )
    score = round(clamp(raw_score), 1)
    level = get_risk_level(score)

    contributing_factors = [
        {"name": "24h Accumulated Rainfall", "value": round(rainfall_mm, 1), "unit": "mm", "impact": "Elevating" if rainfall_mm > 50 else "Mitigating", "weight_pct": 35.0},
        {"name": "Rainfall Peak Intensity", "value": round(rainfall_intensity, 1), "unit": "mm/h", "impact": "Elevating" if rainfall_intensity > 20 else "Neutral", "weight_pct": 20.0},
        {"name": "Soil Saturation", "value": round(soil_saturation, 1), "unit": "%", "impact": "Elevating" if soil_saturation > 70 else "Neutral", "weight_pct": 20.0},
        {"name": "Drainage Capacity Deficit", "value": round(100.0 - drainage_capacity, 1), "unit": "%", "impact": "Elevating" if drainage_capacity < 50 else "Mitigating", "weight_pct": 15.0},
        {"name": "Historical Flood Index", "value": round(historical_flooding, 1), "unit": "idx", "impact": "Elevating" if historical_flooding > 50 else "Neutral", "weight_pct": 10.0},
    ]

    actions = []
    if score > 80:
        actions = [
            "Issue immediate simulated early-warning flash flood alert to municipal response units",
            "Pre-deploy emergency suction pumps to high-risk low-lying culverts",
            "Establish perimeter barricades on flooded arterial roads and reroute traffic",
            "Alert district hospital emergency wards for localized water ingress readiness"
        ]
    elif score > 60:
        actions = [
            "Deploy municipal inspection crews to clear storm drain blockages",
            "Monitor water levels at primary canals and retention basins hourly",
            "Prepare backup mobile pumping units at designated vulnerable sectors"
        ]
    elif score > 30:
        actions = [
            "Conduct preventative clearing of street debris at stormwater grates",
            "Verify real-time telemetry on precipitation gauges and retention ponds"
        ]
    else:
        actions = [
            "Routine baseline catchment monitoring; drainage network operating within nominal capacity"
        ]

    explanation = (
        f"Flood risk is {level.lower()} at {score}/100. Rainfall of {rainfall_mm}mm and soil saturation of {soil_saturation}% "
        f"interact with drainage capacity of {drainage_capacity}%."
    )

    return {
        "score": score,
        "risk_level": level,
        "confidence_type": "heuristic",
        "explanation": explanation,
        "contributing_factors": contributing_factors,
        "actions": actions,
        "prediction_horizon": "Next 12-24 Hours"
    }

def calculate_waterlogging_risk(
    rainfall_mm: float,
    drainage_capacity: float,
    soil_saturation: float,
    low_lying_vulnerability: float = 40.0,
    historical_waterlogging: float = 30.0
) -> Dict[str, Any]:
    """
    Waterlogging Risk Formulation:
    - 30% Rainfall accumulation
    - 30% Drainage capacity shortfall
    - 20% Soil saturation (impervious runoff proxy)
    - 10% Low-lying topographic depression vulnerability
    - 10% Historical waterlogging recurrence
    """
    rain_factor = clamp((rainfall_mm / 100.0) * 100.0)
    drainage_deficit = clamp(100.0 - drainage_capacity)
    soil_factor = clamp(soil_saturation)
    vulnerability_factor = clamp(low_lying_vulnerability)
    history_factor = clamp(historical_waterlogging)

    raw_score = (
        0.30 * rain_factor +
        0.30 * drainage_deficit +
        0.20 * soil_factor +
        0.10 * vulnerability_factor +
        0.10 * history_factor
    )
    score = round(clamp(raw_score), 1)
    level = get_risk_level(score)

    contributing_factors = [
        {"name": "Precipitation Inflow", "value": round(rainfall_mm, 1), "unit": "mm", "impact": "Elevating" if rainfall_mm > 40 else "Neutral", "weight_pct": 30.0},
        {"name": "Storm Drain Inefficiency", "value": round(100.0 - drainage_capacity, 1), "unit": "%", "impact": "Elevating" if drainage_capacity < 60 else "Mitigating", "weight_pct": 30.0},
        {"name": "Ground Surface Saturation", "value": round(soil_saturation, 1), "unit": "%", "impact": "Elevating" if soil_saturation > 65 else "Neutral", "weight_pct": 20.0},
        {"name": "Topographic Low-Point Index", "value": round(low_lying_vulnerability, 1), "unit": "idx", "impact": "Elevating" if low_lying_vulnerability > 50 else "Neutral", "weight_pct": 10.0},
        {"name": "Historical Waterlogging Index", "value": round(historical_waterlogging, 1), "unit": "idx", "impact": "Elevating" if historical_waterlogging > 50 else "Neutral", "weight_pct": 10.0},
    ]

    actions = []
    if score > 80:
        actions = [
            "Dispatch rapid-action dewatering pumps to pedestrian subways and underpasses",
            "Close submerged road lanes and place warning lights at flooded intersections",
            "Mobilize sanitation teams to prevent sewer-stormwater cross-contamination"
        ]
    elif score > 60:
        actions = [
            "Stage auxiliary trailer-mounted dewatering equipment near identified low-lying hubs",
            "Clear trash barriers from stormwater culvert inlets"
        ]
    elif score > 30:
        actions = [
            "Inspect street drainage gullies for silt buildup",
            "Alert municipal road maintenance control room"
        ]
    else:
        actions = [
            "Surface runoff discharging smoothly through primary conduits"
        ]

    explanation = (
        f"Waterlogging risk is {level.lower()} at {score}/100. Local storm drainage efficiency ({drainage_capacity}%) "
        f"and surface soil saturation ({soil_saturation}%) are the driving determinants."
    )

    return {
        "score": score,
        "risk_level": level,
        "confidence_type": "heuristic",
        "explanation": explanation,
        "contributing_factors": contributing_factors,
        "actions": actions,
        "prediction_horizon": "Next 6-18 Hours"
    }

def calculate_water_shortage_risk(
    daily_demand: float,
    daily_supply: float,
    groundwater_pct: float,
    temperature_c: float,
    rainfall_deficit: float = 30.0
) -> Dict[str, Any]:
    """
    Water Shortage Risk Formulation:
    - 45% Net Demand-Supply Deficit Ratio
    - 30% Groundwater Depletion (100 - groundwater_pct)
    - 15% Ambient Temperature (evaporative/consumption surge)
    - 10% Rainfall Deficit
    """
    net_deficit = max(0.0, daily_demand - daily_supply)
    deficit_ratio = (net_deficit / daily_demand * 100.0) if daily_demand > 0 else 0.0
    deficit_factor = clamp(deficit_ratio * 2.0)  # A 50% deficit yields 100 on this factor

    gw_depletion = clamp(100.0 - groundwater_pct)
    temp_factor = clamp(max(0.0, (temperature_c - 24.0) / 20.0 * 100.0))
    rain_def_factor = clamp(rainfall_deficit)

    raw_score = (
        0.45 * deficit_factor +
        0.30 * gw_depletion +
        0.15 * temp_factor +
        0.10 * rain_def_factor
    )
    score = round(clamp(raw_score), 1)
    level = get_risk_level(score)

    contributing_factors = [
        {"name": "Demand vs Supply Deficit", "value": round(net_deficit, 0), "unit": "L/day", "impact": "Elevating" if net_deficit > 0 else "Mitigating", "weight_pct": 45.0},
        {"name": "Groundwater Reservoir Depletion", "value": round(gw_depletion, 1), "unit": "%", "impact": "Elevating" if gw_depletion > 50 else "Mitigating", "weight_pct": 30.0},
        {"name": "Thermal Demand Stress", "value": round(temperature_c, 1), "unit": "°C", "impact": "Elevating" if temperature_c > 32 else "Neutral", "weight_pct": 15.0},
        {"name": "Precipitation Deficit", "value": round(rainfall_deficit, 1), "unit": "%", "impact": "Elevating" if rainfall_deficit > 40 else "Mitigating", "weight_pct": 10.0},
    ]

    actions = []
    if score > 80:
        actions = [
            "Activate emergency water distribution protocol and dispatch municipal water tankers",
            "Impose temporary non-essential commercial water restrictions across critical sectors",
            "Interconnect auxiliary reservoir trunk lines to supplement localized distribution deficit",
            "Establish public emergency water collection stations in underserved neighborhoods"
        ]
    elif score > 60:
        actions = [
            "Optimize regional tanker delivery schedule prioritizing high-density residential zones",
            "Issue voluntary water conservation advisory to residential consumers",
            "Throttle line pressures during off-peak night hours (01:00 - 05:00) to curb losses"
        ]
    elif score > 30:
        actions = [
            "Monitor groundwater extraction rates at public tube wells",
            "Audit feeder line transfer efficiency between supply reservoirs"
        ]
    else:
        actions = [
            "Water supply is balanced with aggregate municipal demand; reserves intact"
        ]

    explanation = (
        f"Water shortage risk is {level.lower()} at {score}/100. Current deficit is {round(net_deficit):,} L/day "
        f"with groundwater storage at {groundwater_pct}% and ambient temperature at {temperature_c}°C."
    )

    return {
        "score": score,
        "risk_level": level,
        "confidence_type": "heuristic",
        "explanation": explanation,
        "deficit_liters": round(net_deficit, 1),
        "contributing_factors": contributing_factors,
        "actions": actions,
        "prediction_horizon": "Next 48-96 Hours"
    }

def calculate_heat_risk(
    temperature_c: float,
    humidity_percent: float,
    exposure_duration_hours: float = 4.0
) -> Dict[str, Any]:
    """
    Heat Stress Formulation:
    Calculates estimated feels-like temperature using NOAA Heat Index approximation,
    and maps it to bounded [0, 100] heat stress index.
    """
    t_c = float(temperature_c)
    rh = clamp(float(humidity_percent))

    # Rothfusz / NOAA Heat Index Approximation (in Fahrenheit, converted back)
    t_f = t_c * 9.0 / 5.0 + 32.0
    if t_f < 80.0:
        hi_f = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))
    else:
        hi_f = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * rh
            - 0.22475541 * t_f * rh
            - 0.00683783 * (t_f ** 2)
            - 0.05481717 * (rh ** 2)
            + 0.00122874 * (t_f ** 2) * rh
            + 0.00085282 * t_f * (rh ** 2)
            - 0.00000199 * (t_f ** 2) * (rh ** 2)
        )
    feels_like_c = round((hi_f - 32.0) * 5.0 / 9.0, 1)

    # Score mapping based on feels_like_c
    # <27°C: Low (0-30)
    # 27-34°C: Moderate (31-60)
    # 35-41°C: High (61-80)
    # >41°C: Critical (81-100)
    if feels_like_c <= 27.0:
        score = clamp((feels_like_c / 27.0) * 30.0)
    elif feels_like_c <= 34.0:
        score = 30.0 + ((feels_like_c - 27.0) / 7.0) * 30.0
    elif feels_like_c <= 42.0:
        score = 60.0 + ((feels_like_c - 34.0) / 8.0) * 20.0
    else:
        score = 80.0 + clamp(((feels_like_c - 42.0) / 10.0) * 20.0, 0.0, 20.0)

    # Exposure duration scalar (max +10% impact)
    duration_factor = min(1.10, 1.0 + (exposure_duration_hours - 2.0) * 0.025)
    score = round(clamp(score * duration_factor), 1)
    level = get_risk_level(score)

    contributing_factors = [
        {"name": "Ambient Air Temperature", "value": round(t_c, 1), "unit": "°C", "impact": "Elevating" if t_c > 32 else "Neutral", "weight_pct": 55.0},
        {"name": "Relative Humidity", "value": round(rh, 1), "unit": "%", "impact": "Elevating" if rh > 65 else "Neutral", "weight_pct": 35.0},
        {"name": "Estimated Exposure Duration", "value": round(exposure_duration_hours, 1), "unit": "hrs", "impact": "Elevating" if exposure_duration_hours > 4 else "Neutral", "weight_pct": 10.0},
    ]

    actions = []
    if score > 80:
        actions = [
            "Issue simulated extreme heat health warning across public alert channels",
            "Open air-conditioned municipal cooling centers with continuous hydration supplies",
            "Mandate suspension of strenuous municipal outdoor labor between 11:30 and 15:30",
            "Equip first responders and community health volunteers with heatstroke triage kits"
        ]
    elif score > 60:
        actions = [
            "Distribute potable water misting and hydration points at transit terminals",
            "Broadcast heat safety guidelines targeting senior citizens and vulnerable residents",
            "Advise schools and public facilities to curtail outdoor athletic activities"
        ]
    elif score > 30:
        actions = [
            "Encourage proactive daytime hydration and shaded transit routes",
            "Ensure functional air circulation and water coolers across public buildings"
        ]
    else:
        actions = [
            "Thermal comfort index is within safe seasonal physiological boundaries"
        ]

    explanation = (
        f"Heat stress risk is {level.lower()} at {score}/100. Ambient air temperature of {t_c}°C with "
        f"{rh}% humidity produces an estimated feels-like temperature of {feels_like_c}°C."
    )

    return {
        "score": score,
        "risk_level": level,
        "feels_like_c": feels_like_c,
        "confidence_type": "heuristic",
        "explanation": explanation,
        "contributing_factors": contributing_factors,
        "actions": actions,
        "prediction_horizon": "Next 24 Hours"
    }

def calculate_leak_risk(
    normal_consumption: float,
    observed_consumption: float
) -> Dict[str, Any]:
    """
    Leak Detection Formulation:
    Statistical and heuristic anomaly analysis comparing observed vs baseline consumption.
    Excess consumption = max(0, observed - normal)
    Anomaly percentage = ((observed - normal) / normal * 100)
    """
    norm = max(0.0, float(normal_consumption))
    obs = max(0.0, float(observed_consumption))
    excess = max(0.0, obs - norm)

    if norm <= 0.0:
        anomaly_pct = 100.0 if obs > 0 else 0.0
    else:
        anomaly_pct = ((obs - norm) / norm) * 100.0

    # Score mapping based on anomaly percentage:
    # <= 5%: minimal noise (score 0-20)
    # 5-15%: minor variance (score 21-40)
    # 15-30%: probable moderate leak (score 41-65)
    # 30-50%: serious pipeline anomaly (score 66-85)
    # > 50%: critical pipeline breach (score 86-100)
    if anomaly_pct <= 5.0:
        score = clamp((anomaly_pct / 5.0) * 20.0)
    elif anomaly_pct <= 15.0:
        score = 20.0 + ((anomaly_pct - 5.0) / 10.0) * 20.0
    elif anomaly_pct <= 30.0:
        score = 40.0 + ((anomaly_pct - 15.0) / 15.0) * 25.0
    elif anomaly_pct <= 50.0:
        score = 65.0 + ((anomaly_pct - 30.0) / 20.0) * 20.0
    else:
        score = 85.0 + clamp(((anomaly_pct - 50.0) / 30.0) * 15.0, 0.0, 15.0)

    score = round(clamp(score), 1)
    level = get_risk_level(score)
    anomaly_detected = (anomaly_pct > 15.0 and excess > 5000.0)

    possible_causes = []
    if score > 80:
        possible_causes = [
            "Major subsurface transmission main rupture or burst joint",
            "High-pressure distribution valve shear failure",
            "Catastrophic commercial manifold breach or pump bypass leak"
        ]
    elif score > 60:
        possible_causes = [
            "Progressive underground pipe fissure along aging cast-iron main",
            "Unauthorized large-volume industrial hydrant withdrawal",
            "Pressure-relief valve seating malfunction"
        ]
    elif score > 30:
        possible_causes = [
            "Minor service connection leak or degraded meter gasket",
            "Off-peak commercial tank refilling surge",
            "Meter calibration drift"
        ]
    else:
        possible_causes = [
            "Nominal diurnal water flow fluctuations within expected tolerance"
        ]

    actions = []
    if score > 80:
        actions = [
            "Dispatch emergency acoustic pipe-listening and correlation team immediately",
            "Isolate sector feeder isolation valves to restrict massive non-revenue water loss",
            "Coordinate with municipal road authorities for emergency excavation access"
        ]
    elif score > 60:
        actions = [
            "Conduct step-testing on sub-distribution lines during minimum night flow period (02:00 - 04:00)",
            "Inspect physical junction chambers and pressure-reducing valves in the sector"
        ]
    elif score > 30:
        actions = [
            "Audit commercial meter telemetry and review recent billing reconciliation",
            "Schedule acoustic leak logging inspection within 48 hours"
        ]
    else:
        actions = [
            "Routine telemetry verification; maintain standard automated meter monitoring"
        ]

    contributing_factors = [
        {"name": "Observed Water Inflow", "value": round(obs, 0), "unit": "L/day", "impact": "Elevating" if obs > norm else "Neutral", "weight_pct": 50.0},
        {"name": "Baseline Expected Inflow", "value": round(norm, 0), "unit": "L/day", "impact": "Neutral", "weight_pct": 25.0},
        {"name": "Excess Consumption Volume", "value": round(excess, 0), "unit": "L/day", "impact": "Elevating" if excess > 0 else "Mitigating", "weight_pct": 25.0},
    ]

    explanation = (
        f"Pipeline leak risk is {level.lower()} at {score}/100. Observed flow is {round(obs):,} L/day "
        f"compared to expected baseline of {round(norm):,} L/day (+{round(anomaly_pct, 1)}% variance, "
        f"{round(excess):,} L/day unexplained excess)."
    )

    return {
        "score": score,
        "risk_level": level,
        "anomaly_detected": anomaly_detected,
        "excess_liters": round(excess, 1),
        "anomaly_percentage": round(anomaly_pct, 1),
        "confidence_type": "heuristic statistical baseline",
        "explanation": explanation,
        "possible_causes": possible_causes,
        "contributing_factors": contributing_factors,
        "actions": actions,
        "prediction_horizon": "Next 6-24 Hours"
    }

def calculate_drought_risk(
    groundwater_pct: float,
    rainfall_deficit: float,
    temperature_c: float,
    daily_demand: float,
    historical_drought: float = 20.0
) -> Dict[str, Any]:
    """
    Drought Risk Formulation:
    - 40% Groundwater depletion
    - 30% Cumulative rainfall deficit
    - 15% Ambient temperature thermal evaporative load
    - 15% Historical drought frequency index
    """
    gw_depletion = clamp(100.0 - groundwater_pct)
    rain_def = clamp(rainfall_deficit)
    temp_factor = clamp(max(0.0, (temperature_c - 26.0) / 20.0 * 100.0))
    hist_factor = clamp(historical_drought)

    raw_score = (
        0.40 * gw_depletion +
        0.30 * rain_def +
        0.15 * temp_factor +
        0.15 * hist_factor
    )
    score = round(clamp(raw_score), 1)
    level = get_risk_level(score)

    contributing_factors = [
        {"name": "Subsurface Aquifer Depletion", "value": round(gw_depletion, 1), "unit": "%", "impact": "Elevating" if gw_depletion > 50 else "Mitigating", "weight_pct": 40.0},
        {"name": "Seasonal Rainfall Deficit", "value": round(rain_def, 1), "unit": "%", "impact": "Elevating" if rain_def > 40 else "Mitigating", "weight_pct": 30.0},
        {"name": "Evapotranspiration Index", "value": round(temperature_c, 1), "unit": "°C", "impact": "Elevating" if temperature_c > 32 else "Neutral", "weight_pct": 15.0},
        {"name": "Historical Drought Susceptibility", "value": round(hist_factor, 1), "unit": "idx", "impact": "Elevating" if hist_factor > 50 else "Neutral", "weight_pct": 15.0},
    ]

    actions = []
    if score > 80:
        actions = [
            "Declare simulated stage-3 meteorological and hydrological drought status",
            "Mandate agricultural and industrial groundwater extraction caps",
            "Reallocate regional dam storage for critical drinking water preservation",
            "Accelerate inter-basin bulk water transfer mechanisms"
        ]
    elif score > 60:
        actions = [
            "Promote treated wastewater recycling for cooling and landscaping",
            "Enforce phased lawn irrigation and vehicle washing restrictions",
            "Step up continuous piezometric aquifer monitoring"
        ]
    elif score > 30:
        actions = [
            "Publicize municipal water conservation awareness campaigns",
            "Incentivize commercial installation of rainwater recharge wells"
        ]
    else:
        actions = [
            "Aquifer reserves and precipitation recharge tracking within safe historical percentiles"
        ]

    explanation = (
        f"Drought risk is {level.lower()} at {score}/100. Groundwater storage is at {groundwater_pct}%, "
        f"with a rainfall deficit of {rainfall_deficit}% and seasonal temperature of {temperature_c}°C."
    )

    return {
        "score": score,
        "risk_level": level,
        "confidence_type": "heuristic",
        "explanation": explanation,
        "contributing_factors": contributing_factors,
        "actions": actions,
        "prediction_horizon": "Next 7-30 Days"
    }

def calculate_overall_risk(
    flood_score: float,
    waterlogging_score: float,
    shortage_score: float,
    heat_score: float,
    leak_score: float,
    drought_score: float
) -> Tuple[float, str, str]:
    """
    Overall Environmental Risk Formulation:
    Combines individual hazard domains using a weighted baseline plus severe-hazard escalation:
    Overall = 0.60 * WeightedBlend + 0.40 * MaxHazardScore
    Ensures that if any catastrophic individual risk (e.g. 90/100 flood) occurs,
    the overall index will accurately reflect an escalated warning.
    """
    f = clamp(flood_score)
    wl = clamp(waterlogging_score)
    ws = clamp(shortage_score)
    ht = clamp(heat_score)
    lk = clamp(leak_score)
    dr = clamp(drought_score)

    weighted_blend = (
        0.22 * f +
        0.16 * wl +
        0.24 * ws +
        0.16 * ht +
        0.08 * lk +
        0.14 * dr
    )
    max_hazard = max(f, wl, ws, ht, lk, dr)

    raw_overall = 0.60 * weighted_blend + 0.40 * max_hazard
    score = round(clamp(raw_overall), 1)
    level = get_risk_level(score)

    # Summary explanation
    critical_hazards = []
    if f >= 60: critical_hazards.append(f"Flood ({f})")
    if wl >= 60: critical_hazards.append(f"Waterlogging ({wl})")
    if ws >= 60: critical_hazards.append(f"Water Shortage ({ws})")
    if ht >= 60: critical_hazards.append(f"Heat Stress ({ht})")
    if lk >= 60: critical_hazards.append(f"Pipeline Leak ({lk})")
    if dr >= 60: critical_hazards.append(f"Drought ({dr})")

    if critical_hazards:
        summary = f"Composite environmental risk is {level} ({score}/100) driven by elevated {', '.join(critical_hazards)}."
    else:
        summary = f"Composite environmental risk is {level} ({score}/100); all environmental parameters are within acceptable thresholds."

    return score, level, summary
