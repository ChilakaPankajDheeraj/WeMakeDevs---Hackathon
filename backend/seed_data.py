"""
AquaNex Database Seeder
Seeds initial realistic environmental datasets idempotently:
- 5 comprehensive monitored regional locations
- Pre-calculated risk assessments
- Realistic multi-day water consumption records (including leak anomalies)
- Live demo alerts with various severity levels
- Municipal tanker fleet resources
- Historical environmental event archives
"""

import datetime
from sqlalchemy.orm import Session
from backend.models import (
    Location,
    WeatherData,
    WaterConsumption,
    GroundwaterData,
    RiskPrediction,
    Alert,
    Recommendation,
    HistoricalEvent,
    TankerResource
)
from backend.prediction_engine import evaluate_full_risk_profile
from backend.recommendation_engine import generate_recommendations

def seed_database_if_empty(db: Session) -> bool:
    # Check if locations already exist to guarantee idempotency
    existing_count = db.query(Location).count()
    if existing_count > 0:
        return False

    now = datetime.datetime.utcnow()

    # 1. Monitored Regional Locations
    locations_data = [
        {
            "name": "Metro Central - Downtown Core",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "rainfall_mm": 92.5,
            "rainfall_intensity": 32.0,
            "temperature_c": 34.5,
            "humidity_percent": 78.0,
            "groundwater_percent": 38.0,
            "daily_demand_liters": 720000.0,
            "daily_supply_liters": 580000.0,
            "drainage_capacity_percent": 38.0,
            "soil_saturation_percent": 82.0,
            "historical_flooding_index": 68.0,
            "historical_drought_index": 45.0,
            "population": 145000,
            "zone_type": "Dense Urban Core"
        },
        {
            "name": "Coastal Delta - Harbor District",
            "latitude": 13.1145,
            "longitude": 80.2985,
            "rainfall_mm": 128.0,
            "rainfall_intensity": 46.0,
            "temperature_c": 31.0,
            "humidity_percent": 88.0,
            "groundwater_percent": 85.0,
            "daily_demand_liters": 410000.0,
            "daily_supply_liters": 420000.0,
            "drainage_capacity_percent": 28.0,
            "soil_saturation_percent": 94.0,
            "historical_flooding_index": 85.0,
            "historical_drought_index": 15.0,
            "population": 92000,
            "zone_type": "Coastal Lowland"
        },
        {
            "name": "Northern Ridge - Industrial Corridor",
            "latitude": 13.1580,
            "longitude": 80.1950,
            "rainfall_mm": 12.0,
            "rainfall_intensity": 2.0,
            "temperature_c": 39.5,
            "humidity_percent": 54.0,
            "groundwater_percent": 28.0,
            "daily_demand_liters": 950000.0,
            "daily_supply_liters": 680000.0,
            "drainage_capacity_percent": 72.0,
            "soil_saturation_percent": 32.0,
            "historical_flooding_index": 18.0,
            "historical_drought_index": 76.0,
            "population": 120000,
            "zone_type": "Industrial Corridor"
        },
        {
            "name": "South Hills - Elevated Residential",
            "latitude": 12.9850,
            "longitude": 80.2150,
            "rainfall_mm": 38.0,
            "rainfall_intensity": 10.0,
            "temperature_c": 30.5,
            "humidity_percent": 64.0,
            "groundwater_percent": 65.0,
            "daily_demand_liters": 380000.0,
            "daily_supply_liters": 395000.0,
            "drainage_capacity_percent": 82.0,
            "soil_saturation_percent": 45.0,
            "historical_flooding_index": 20.0,
            "historical_drought_index": 30.0,
            "population": 64000,
            "zone_type": "Elevated Residential"
        },
        {
            "name": "Western Agricultural - Peri-Urban Basin",
            "latitude": 13.0450,
            "longitude": 80.1120,
            "rainfall_mm": 4.0,
            "rainfall_intensity": 0.0,
            "temperature_c": 41.2,
            "humidity_percent": 42.0,
            "groundwater_percent": 21.0,
            "daily_demand_liters": 620000.0,
            "daily_supply_liters": 390000.0,
            "drainage_capacity_percent": 65.0,
            "soil_saturation_percent": 22.0,
            "historical_flooding_index": 12.0,
            "historical_drought_index": 88.0,
            "population": 78000,
            "zone_type": "Peri-Urban Agricultural"
        }
    ]

    created_locations = []
    for loc_dict in locations_data:
        loc = Location(**loc_dict, updated_at=now)
        db.add(loc)
        created_locations.append(loc)
    
    db.commit()

    # 2. Add weather telemetry, water consumption histories, and groundwater records
    for loc in created_locations:
        # Weather
        w = WeatherData(
            location_id=loc.id,
            recorded_at=now,
            rainfall_mm=loc.rainfall_mm,
            rainfall_intensity=loc.rainfall_intensity,
            temperature_c=loc.temperature_c,
            humidity_percent=loc.humidity_percent,
            feels_like_c=loc.temperature_c + 3.5
        )
        db.add(w)

        # Groundwater
        gw = GroundwaterData(
            location_id=loc.id,
            recorded_date=now.strftime("%Y-%m-%d"),
            depth_meters=round(35.0 - (loc.groundwater_percent * 0.25), 1),
            capacity_percent=loc.groundwater_percent,
            recharge_rate=round(loc.rainfall_mm * 0.15, 1)
        )
        db.add(gw)

        # Consumption over past 7 days (Inject anomaly into Metro Central to test leak detection)
        for d in range(7, 0, -1):
            day_str = (now - datetime.timedelta(days=d)).strftime("%Y-%m-%d")
            base_normal = loc.daily_demand_liters
            is_anomaly = False
            excess = 0.0
            notes = "Normal diurnal consumption pattern"

            if loc.name.startswith("Metro Central") and d <= 2:
                # 28% leak anomaly on recent days
                is_anomaly = True
                obs = base_normal * 1.28
                excess = obs - base_normal
                notes = "Suspicious nocturnal flow surge on Sub-zone B feeder"
            else:
                obs = base_normal * (0.96 + (d % 3) * 0.03)
                excess = max(0.0, obs - base_normal)

            c = WaterConsumption(
                location_id=loc.id,
                recorded_date=day_str,
                normal_liters=round(base_normal, 0),
                observed_liters=round(obs, 0),
                excess_liters=round(excess, 0),
                anomaly_flag=is_anomaly,
                cause_notes=notes
            )
            db.add(c)

        # Evaluate risk profile and store prediction
        eval_dict = {
            "rainfall_mm": loc.rainfall_mm,
            "rainfall_intensity": loc.rainfall_intensity,
            "temperature_c": loc.temperature_c,
            "humidity_percent": loc.humidity_percent,
            "groundwater_percent": loc.groundwater_percent,
            "daily_demand_liters": loc.daily_demand_liters,
            "daily_supply_liters": loc.daily_supply_liters,
            "drainage_capacity_percent": loc.drainage_capacity_percent,
            "soil_saturation_percent": loc.soil_saturation_percent,
            "historical_flooding_index": loc.historical_flooding_index,
            "historical_drought_index": loc.historical_drought_index,
            "observed_consumption_liters": loc.daily_demand_liters * (1.28 if loc.name.startswith("Metro Central") else 1.0),
            "normal_consumption_liters": loc.daily_demand_liters
        }
        full_eval = evaluate_full_risk_profile(eval_dict)
        assess = full_eval["assessment"]

        pred = RiskPrediction(
            location_id=loc.id,
            created_at=now,
            flood_risk=assess["flood_risk"],
            waterlogging_risk=assess["waterlogging_risk"],
            shortage_risk=assess["shortage_risk"],
            heat_risk=assess["heat_risk"],
            leak_risk=assess["leak_risk"],
            drought_risk=assess["drought_risk"],
            overall_risk=assess["overall_risk"],
            risk_level=assess["risk_level"],
            confidence_type=assess["confidence_type"],
            explanation=assess["summary_explanation"]
        )
        db.add(pred)

        # Add corresponding recommendations
        recs = generate_recommendations(loc.id, loc.name, assess)
        for r in recs:
            rec_entry = Recommendation(
                location_id=loc.id,
                title=r["title"],
                explanation=r["explanation"],
                priority=r["priority"],
                linked_risk=r["linked_risk"],
                contributing_factors="; ".join(r.get("contributing_factors", [])),
                suggested_action=r["suggested_action"],
                estimated_urgency=r["estimated_urgency"],
                status=r["status"],
                created_at=now
            )
            db.add(rec_entry)

    # 3. Seed Demo Alerts
    coastal_loc = next((l for l in created_locations if "Coastal" in l.name), created_locations[0])
    north_loc = next((l for l in created_locations if "Northern" in l.name), created_locations[1])
    metro_loc = next((l for l in created_locations if "Metro" in l.name), created_locations[0])
    west_loc = next((l for l in created_locations if "Western" in l.name), created_locations[4])
    south_loc = next((l for l in created_locations if "South" in l.name), created_locations[3])

    demo_alerts = [
        {
            "severity": "CRITICAL",
            "risk_type": "Flash Flood",
            "location_id": coastal_loc.id,
            "location_name": coastal_loc.name,
            "cause": "Accumulated rainfall 128mm with 94% soil saturation and constrained drainage (28%).",
            "risk_score": 87.5,
            "recommended_action": "Deploy trailer-mounted suction pumps to low-lying coastal underpasses and sound early flood advisory.",
            "status": "ACTIVE",
            "timestamp": now - datetime.timedelta(minutes=24)
        },
        {
            "severity": "CRITICAL",
            "risk_type": "Water Shortage",
            "location_id": north_loc.id,
            "location_name": north_loc.name,
            "cause": "Acute 270,000 L/day municipal deficit; groundwater reserves critically depleted at 28%.",
            "risk_score": 82.0,
            "recommended_action": "Authorize immediate priority tanker fleet dispatch and impose non-essential industrial draw limits.",
            "status": "ACTIVE",
            "timestamp": now - datetime.timedelta(minutes=52)
        },
        {
            "severity": "WARNING",
            "risk_type": "Pipeline Leak Anomaly",
            "location_id": metro_loc.id,
            "location_name": metro_loc.name,
            "cause": "Night minimum flow telemetry indicates +28% unexplained volume surge (approx 201k L/day).",
            "risk_score": 68.0,
            "recommended_action": "Dispatch acoustic listening crew to Sector B trunk junction and verify pressure telemetry.",
            "status": "ACTIVE",
            "timestamp": now - datetime.timedelta(hours=2, minutes=15)
        },
        {
            "severity": "WARNING",
            "risk_type": "Extreme Heat Stress",
            "location_id": west_loc.id,
            "location_name": west_loc.name,
            "cause": "Ambient temperature 41.2°C producing calculated feels-like thermal stress of 44.8°C.",
            "risk_score": 76.5,
            "recommended_action": "Activate municipal cooling stations and enforce outdoor labor work stoppage during peak hours.",
            "status": "ACTIVE",
            "timestamp": now - datetime.timedelta(hours=4)
        },
        {
            "severity": "INFORMATION",
            "risk_type": "Drainage Operations",
            "location_id": south_loc.id,
            "location_name": south_loc.name,
            "cause": "Drainage channels operating at 82% design efficiency; reservoir retention buffer stable.",
            "risk_score": 22.0,
            "recommended_action": "Maintain scheduled routine culvert clearing; no emergency intervention required.",
            "status": "ACKNOWLEDGED",
            "timestamp": now - datetime.timedelta(hours=14),
            "acknowledged_at": now - datetime.timedelta(hours=12),
            "acknowledged_by": "Senior Municipal Dispatcher"
        }
    ]

    for a in demo_alerts:
        alert_obj = Alert(**a)
        db.add(alert_obj)

    # 4. Seed Tanker Fleet Resources
    tanker_regs = [
        ("TN-01-WQ-8812", 12000.0, "Available"),
        ("TN-01-WQ-8813", 12000.0, "Available"),
        ("TN-01-WQ-8814", 10000.0, "Available"),
        ("TN-01-WQ-8815", 10000.0, "Available"),
        ("TN-02-WQ-4401", 14000.0, "Available"),
        ("TN-02-WQ-4402", 14000.0, "Dispatched"),
        ("TN-02-WQ-4403", 9000.0, "Available"),
        ("TN-03-WQ-1109", 10000.0, "Available"),
        ("TN-03-WQ-1110", 10000.0, "Available"),
        ("TN-04-WQ-6521", 12000.0, "Maintenance"),
        ("TN-04-WQ-6522", 12000.0, "Available"),
        ("TN-04-WQ-6523", 10000.0, "Available"),
    ]

    for reg, cap, stat in tanker_regs:
        tanker = TankerResource(
            base_location_id=metro_loc.id,
            vehicle_reg=reg,
            capacity_liters=cap,
            status=stat,
            last_inspection=now - datetime.timedelta(days=4)
        )
        db.add(tanker)

    # 5. Historical Disasters Archive
    historical_events = [
        {
            "location_id": coastal_loc.id,
            "event_type": "Coastal Flash Flood",
            "event_date": "2023-11-15",
            "severity_rating": 89.0,
            "impact_summary": "195mm 24h deluge caused severe waterlogging in port road corridors and 4 underpasses.",
            "recorded_loss": "$1.4M estimated infrastructure repair"
        },
        {
            "location_id": north_loc.id,
            "event_type": "Prolonged Aquifer Drought",
            "event_date": "2024-05-20",
            "severity_rating": 84.0,
            "impact_summary": "Precipitation deficit over 120 days dropped groundwater to 18%, requiring emergency tanker lines.",
            "recorded_loss": "Commercial production throttled 35%"
        },
        {
            "location_id": metro_loc.id,
            "event_type": "Transmission Trunk Breach",
            "event_date": "2024-02-11",
            "severity_rating": 72.0,
            "impact_summary": "Main cast-iron feeder burst in Sector C discharging 1.2M liters before valve isolation.",
            "recorded_loss": "Roadway cavity subsidence and pipe rebuild"
        }
    ]

    for h in historical_events:
        db.add(HistoricalEvent(**h))

    db.commit()
    return True
