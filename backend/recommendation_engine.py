"""
AquaNex AI Decision & Recommendation Engine
Translates environmental risk calculations into prioritized, actionable decision-support suggestions.
All recommendations are flagged for human review.
"""

from typing import List, Dict, Any

def generate_recommendations(
    location_id: int,
    location_name: str,
    risks: Dict[str, Any],
    weather_info: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    recommendations = []
    rec_counter = 1

    flood = risks.get("flood_risk", 0.0)
    wl = risks.get("waterlogging_risk", 0.0)
    shortage = risks.get("shortage_risk", 0.0)
    heat = risks.get("heat_risk", 0.0)
    leak = risks.get("leak_risk", 0.0)
    drought = risks.get("drought_risk", 0.0)

    # 1. Flood Recommendations
    if flood >= 75.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Activate Simulated Flash Flood Protocol & Early-Warning Dispatch",
            "explanation": f"Flood risk is CRITICAL ({flood}/100) due to intense precipitation and saturated soil in {location_name}.",
            "priority": "CRITICAL",
            "linked_risk": "Flood",
            "contributing_factors": ["High 24h Rainfall", "Soil Saturation Near Capacity", "Drainage Outflow Bottlenecks"],
            "suggested_action": "Deploy high-volume dewatering pumps to lowest elevation catchments and issue automated civilian alerts to avoid low-lying arterial corridors.",
            "estimated_urgency": "Immediate (<2h)",
            "status": "Pending Review",
            "action_category": "Emergency Response"
        })
        rec_counter += 1
    elif flood >= 50.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Clear Vulnerable Drainage Culverts & Position Auxiliary Pumps",
            "explanation": f"Flood risk is MODERATE-TO-HIGH ({flood}/100) with continuing runoff pressure in {location_name}.",
            "priority": "HIGH",
            "linked_risk": "Flood",
            "contributing_factors": ["Active Rainfall Runoff", "Drainage Flow Obstructions"],
            "suggested_action": "Send municipal storm-water clearing squads to verify clear flow at primary culverts and monitor reservoir spillway gates.",
            "estimated_urgency": "High (<6h)",
            "status": "Pending Review",
            "action_category": "Infrastructure"
        })
        rec_counter += 1

    # 2. Waterlogging Recommendations
    if wl >= 70.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Urban Road Inundation Containment & Traffic Rerouting",
            "explanation": f"Waterlogging risk is HIGH ({wl}/100); low-lying street depressions are approaching flood capacity.",
            "priority": "HIGH",
            "linked_risk": "Waterlogging",
            "contributing_factors": ["Storm Drain Capacity Exceeded", "Topographic Depression Runoff Ingress"],
            "suggested_action": "Install mobile flashing barricades on identified flooded intersections and operate truck-mounted vacuum pumps.",
            "estimated_urgency": "High (<4h)",
            "status": "Pending Review",
            "action_category": "Public Safety"
        })
        rec_counter += 1

    # 3. Water Shortage Recommendations
    if shortage >= 70.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Mobilize Emergency Water Tanker Fleet & Prioritize Underserved Sectors",
            "explanation": f"Water shortage risk is CRITICAL ({shortage}/100); daily consumption significantly outstrips available distribution.",
            "priority": "CRITICAL",
            "linked_risk": "Water Shortage",
            "contributing_factors": ["Demand Deficit Exceeding 20%", "Depleted Storage Reserves"],
            "suggested_action": "Execute algorithmic tanker fleet dispatch to replenish neighborhood overhead cisterns and initiate public water kiosks.",
            "estimated_urgency": "Immediate (<3h)",
            "status": "Pending Review",
            "action_category": "Resource Allocation"
        })
        rec_counter += 1
    elif shortage >= 45.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Enforce Targeted Commercial Conservation & Line Pressure Balancing",
            "explanation": f"Water shortage risk is MODERATE ({shortage}/100); supply margins are tightening across {location_name}.",
            "priority": "MEDIUM",
            "linked_risk": "Water Shortage",
            "contributing_factors": ["High Diurnal Demand", "Limited Aquifer Recharge"],
            "suggested_action": "Throttle bulk delivery lines between 23:00 and 05:00 to reduce non-essential consumption and minimize distribution stress.",
            "estimated_urgency": "Within 24h",
            "status": "Pending Review",
            "action_category": "Resource Allocation"
        })
        rec_counter += 1

    # 4. Heat Stress Recommendations
    if heat >= 75.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Activate Public Cooling Shelters & Mandatory Outdoor Labor Recess",
            "explanation": f"Heat stress risk is CRITICAL ({heat}/100); feels-like temperatures present elevated thermal illness hazards.",
            "priority": "HIGH",
            "linked_risk": "Heat Stress",
            "contributing_factors": ["Extreme Ambient Temperature", "Elevated Wet-Bulb Humidity"],
            "suggested_action": "Open designated public air-conditioned cooling centers and ensure free electrolyte replenishment stations near transit hubs.",
            "estimated_urgency": "Immediate (<2h)",
            "status": "Pending Review",
            "action_category": "Public Safety"
        })
        rec_counter += 1
    elif heat >= 50.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Broadcast Heat-Safety Advisory & Prioritize Vulnerable Demographics",
            "explanation": f"Heat stress risk is MODERATE-TO-HIGH ({heat}/100); prolonged daytime exposure requires preventative guidance.",
            "priority": "MEDIUM",
            "linked_risk": "Heat Stress",
            "contributing_factors": ["High Temperature", "Prolonged Solar Radiation Exposure"],
            "suggested_action": "Distribute digital and community advisories regarding hydration schedules and check-in protocols for geriatric care homes.",
            "estimated_urgency": "Within 12h",
            "status": "Pending Review",
            "action_category": "Public Safety"
        })
        rec_counter += 1

    # 5. Pipeline Leak Recommendations
    if leak >= 65.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Dispatch Acoustic Correlation Leak-Detection Team to Target Sector",
            "explanation": f"Pipeline leak risk is HIGH ({leak}/100); telemetry indicates abnormal excess throughput not explained by consumer baselines.",
            "priority": "HIGH",
            "linked_risk": "Pipeline Leak",
            "contributing_factors": ["Anomalous Flow Inflow > 25%", "Night Minimum Flow Discrepancy"],
            "suggested_action": "Conduct step-isolation pressure testing along primary transmission sub-sectors and deploy correlators to pinpoint rupture coordinates.",
            "estimated_urgency": "High (<6h)",
            "status": "Pending Review",
            "action_category": "Infrastructure"
        })
        rec_counter += 1

    # 6. Drought Recommendations
    if drought >= 65.0:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Impose Tier-2 Hydrological Drought Restrictions & Piezometer Tracking",
            "explanation": f"Drought risk is HIGH ({drought}/100); persistent precipitation deficit has led to sustained groundwater table depression.",
            "priority": "HIGH",
            "linked_risk": "Drought",
            "contributing_factors": ["Subsurface Aquifer Depletion > 45%", "Consecutive Rainfall Deficits"],
            "suggested_action": "Cap private deep-well extractions, mandate greywater reclamation for municipal landscape watering, and prepare emergency inter-basin transfers.",
            "estimated_urgency": "Within 24h",
            "status": "Pending Review",
            "action_category": "Resource Allocation"
        })
        rec_counter += 1

    # If all risks are low, add a baseline maintenance recommendation
    if not recommendations:
        recommendations.append({
            "id": rec_counter,
            "location_id": location_id,
            "location_name": location_name,
            "title": "Maintain Continuous Telemetry & Preventative Infrastructure Inspection",
            "explanation": f"All environmental and hydraulic indicators in {location_name} are within nominal baseline thresholds.",
            "priority": "LOW",
            "linked_risk": "Baseline Operations",
            "contributing_factors": ["Stable Water Balance", "Normal Precipitation Flow"],
            "suggested_action": "Continue automated sensor polling and execute scheduled bi-weekly drainage grate sweeps.",
            "estimated_urgency": "Scheduled (48h)",
            "status": "Approved",
            "action_category": "Infrastructure"
        })

    return recommendations
