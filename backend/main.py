"""
AquaNex FastAPI Application
AI Water & Climate Early Warning System (Predict. Protect. Act.)
REST API serving Command Center, Interactive Risk Map, Predictions,
What-if Simulator, Tanker Optimizer, Leak Detection, and Alert Center.
"""

import logging
import datetime
import json
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db, init_db, check_db_connection, SessionLocal
from backend.models import (
    Location,
    WeatherData,
    WaterConsumption,
    GroundwaterData,
    RiskPrediction,
    Alert,
    Recommendation,
    SimulationRun
)
from backend.schemas import (
    HealthResponse,
    SystemStatusResponse,
    LocationResponse,
    LocationDetailResponse,
    RiskMapResponse,
    RiskMapMarker,
    DashboardOverviewResponse,
    AlertResponse,
    AlertAcknowledgeRequest,
    PredictRequest,
    PredictResponse,
    ExplainRequest,
    ExplainResponse,
    SimulateRequest,
    SimulateResponse,
    WaterForecastResponse,
    HeatRiskResponse,
    LeakDetectionRequest,
    LeakDetectionResponse,
    TankerOptimizeRequest,
    TankerOptimizeResponse,
    RecommendationsListResponse,
    RecommendationItem,
    OverallRiskAssessment,
    RiskScoreDetail,
    WeatherModeResponse,
    WeatherModeUpdateRequest,
    LiveWeatherResponse
)
from backend.risk_engine import (
    calculate_flood_risk,
    calculate_waterlogging_risk,
    calculate_water_shortage_risk,
    calculate_heat_risk,
    calculate_leak_risk,
    calculate_drought_risk,
    calculate_overall_risk,
    get_risk_level
)
from backend.prediction_engine import (
    evaluate_full_risk_profile,
    generate_7day_water_forecast,
    explain_risk_assessment
)
from backend.recommendation_engine import generate_recommendations
from backend.leak_detection import analyze_leak_anomaly
from backend.tanker_optimizer import optimize_tanker_allocation
from backend.seed_data import seed_database_if_empty
from backend.weather_service import fetch_live_weather, WeatherServiceError

# Global runtime state for Data Source Mode ("demo" or "live")
CURRENT_WEATHER_MODE = settings.WEATHER_DATA_MODE  # Default: "demo"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aquanex.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and seed if required
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()
    try:
        with SessionLocal() as db:
            seeded = seed_database_if_empty(db)
            if seeded:
                logger.info("Database successfully seeded with realistic baseline demonstration data.")
            else:
                logger.info("Database already contains data; skipping seed initialization.")
    except Exception as e:
        logger.error(f"Error during startup data verification: {e}")
    yield
    logger.info("Shutting down AquaNex application services.")

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe error handling
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please verify telemetry inputs or check service status.",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    )

# --- 1. Root & System Status Endpoints ---

@app.get("/", tags=["System"])
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Predict. Protect. Act.",
        "description": settings.APP_DESCRIPTION,
        "version": settings.APP_VERSION,
        "data_mode": settings.DATA_MODE_LABEL,
        "docs_url": "/docs",
        "api_health": "/api/health"
    }

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def get_health(db: Session = Depends(get_db)):
    db_status = check_db_connection()
    return {
        "status": "healthy" if db_status["status"] == "connected" else "degraded",
        "api_status": "operational",
        "database_status": db_status["status"],
        "database_mode": settings.DATABASE_MODE,
        "risk_engine_status": "operational",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/api/system-status", response_model=SystemStatusResponse, tags=["System"])
def get_system_status(db: Session = Depends(get_db)):
    db_status = check_db_connection()
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    locations_count = db.query(Location).count()

    return {
        "api_status": "operational",
        "database_status": db_status["status"],
        "database_mode": f"{settings.DATABASE_MODE} ({'Supabase Cloud' if settings.is_supabase_enabled else 'Local SQLite'})",
        "risk_engine_status": "operational (deterministic heuristics)",
        "data_mode": settings.DATA_MODE_LABEL,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "active_alerts_count": active_alerts,
        "locations_count": locations_count
    }

# --- 1b. Weather Data Source Mode Endpoints ---

@app.get("/api/weather/mode", response_model=WeatherModeResponse, tags=["Weather"])
def get_weather_mode():
    is_live = CURRENT_WEATHER_MODE == "live"
    return WeatherModeResponse(
        mode=CURRENT_WEATHER_MODE,
        label="Live Weather Data (Open-Meteo)" if is_live else "Prototype Mode • Simulated Data",
        source="Open-Meteo Weather API (CC-BY 4.0)" if is_live else "Simulated Baseline Engine",
        timestamp=datetime.datetime.utcnow().isoformat(),
        description="Real-time atmospheric telemetry via Open-Meteo" if is_live else "Deterministic seeded environmental telemetry"
    )

@app.post("/api/weather/mode", response_model=WeatherModeResponse, tags=["Weather"])
def set_weather_mode(payload: WeatherModeUpdateRequest):
    global CURRENT_WEATHER_MODE
    req_mode = payload.mode.lower()
    if req_mode not in ["demo", "live"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid weather mode '{payload.mode}'. Allowed modes are 'demo' or 'live'."
        )
    CURRENT_WEATHER_MODE = req_mode
    logger.info(f"Weather Data Source Mode switched to: {CURRENT_WEATHER_MODE.upper()}")
    return get_weather_mode()

@app.get("/api/live-weather/{location_id}", response_model=LiveWeatherResponse, tags=["Weather"])
def get_live_weather_for_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {location_id} not found.")

    try:
        live_data = fetch_live_weather(loc.latitude, loc.longitude)
    except WeatherServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Open-Meteo API unavailable for {loc.name}: {str(exc)}. Please switch to Demo Mode."
        )

    return LiveWeatherResponse(
        location_id=loc.id,
        location_name=loc.name,
        **live_data
    )

# --- 2. Command Center Dashboard ---

@app.get("/api/dashboard", response_model=DashboardOverviewResponse, tags=["Dashboard"])
def get_dashboard(mode: Optional[str] = None, db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    if not locations:
        raise HTTPException(status_code=404, detail="No monitored locations found in database.")

    eff_mode = (mode or CURRENT_WEATHER_MODE).lower()
    is_live = eff_mode == "live"

    total_demand = sum(l.daily_demand_liters for l in locations)
    total_supply = sum(l.daily_supply_liters for l in locations)
    net_deficit = max(0.0, total_demand - total_supply)
    avg_gw = sum(l.groundwater_percent for l in locations) / len(locations)

    flood_scores = []
    shortage_scores = []
    heat_scores = []
    leak_scores = []
    overall_scores = []
    recent_readings = []

    for l in locations:
        latest_c = db.query(WaterConsumption).filter(WaterConsumption.location_id == l.id).order_by(WaterConsumption.id.desc()).first()
        obs_c = latest_c.observed_liters if latest_c else l.daily_demand_liters
        norm_c = latest_c.normal_liters if latest_c else l.daily_demand_liters

        # Hydrology parameters remain baseline/simulated
        rain_val = l.rainfall_mm
        intensity_val = l.rainfall_intensity
        temp_val = l.temperature_c
        hum_val = l.humidity_percent
        weather_desc = "Simulated Baseline"
        obs_time = datetime.datetime.utcnow().isoformat()

        if is_live:
            try:
                live_w = fetch_live_weather(l.latitude, l.longitude)
                rain_val = live_w["rainfall_mm"]
                intensity_val = live_w["rainfall_intensity"]
                temp_val = live_w["temperature_c"]
                hum_val = live_w["humidity_percent"]
                weather_desc = live_w["weather_description"]
                obs_time = live_w["observation_time"]
            except WeatherServiceError as exc:
                raise HTTPException(
                    status_code=503,
                    detail=f"Open-Meteo weather service unavailable: {str(exc)}. Please switch to Demo Mode."
                )

        f_res = calculate_flood_risk(rain_val, intensity_val, l.soil_saturation_percent, l.drainage_capacity_percent, l.historical_flooding_index)
        s_res = calculate_water_shortage_risk(l.daily_demand_liters, l.daily_supply_liters, l.groundwater_percent, temp_val)
        h_res = calculate_heat_risk(temp_val, hum_val)
        lk_res = calculate_leak_risk(norm_c, obs_c)
        dr_res = calculate_drought_risk(l.groundwater_percent, max(0.0, 50.0 - rain_val), temp_val, l.daily_demand_liters, l.historical_drought_index)

        ov_score, ov_lvl, _ = calculate_overall_risk(f_res["score"], 45.0, s_res["score"], h_res["score"], lk_res["score"], dr_res["score"])

        flood_scores.append(f_res["score"])
        shortage_scores.append(s_res["score"])
        heat_scores.append(h_res["score"])
        leak_scores.append(lk_res["score"])
        overall_scores.append(ov_score)

        recent_readings.append({
            "id": l.id,
            "name": l.name,
            "zone_type": l.zone_type,
            "rainfall_mm": rain_val,
            "temperature_c": temp_val,
            "groundwater_percent": l.groundwater_percent,
            "overall_risk": ov_score,
            "risk_level": ov_lvl,
            "weather_source": "Open-Meteo API" if is_live else "Simulated Baseline",
            "weather_description": weather_desc,
            "observation_time": obs_time
        })

    avg_flood = round(sum(flood_scores) / len(flood_scores), 1)
    avg_shortage = round(sum(shortage_scores) / len(shortage_scores), 1)
    avg_heat = round(sum(heat_scores) / len(heat_scores), 1)
    avg_leak = round(sum(leak_scores) / len(leak_scores), 1)
    max_overall = round(max(overall_scores), 1)

    crit_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.status == "ACTIVE").count()
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    has_leak_anomaly = any(s > 50 for s in leak_scores)

    trends = [
        {"day": "Day -6", "flood": round(avg_flood * 0.75, 1), "shortage": round(avg_shortage * 0.90, 1), "overall": round(max_overall * 0.80, 1)},
        {"day": "Day -5", "flood": round(avg_flood * 0.82, 1), "shortage": round(avg_shortage * 0.92, 1), "overall": round(max_overall * 0.84, 1)},
        {"day": "Day -4", "flood": round(avg_flood * 0.88, 1), "shortage": round(avg_shortage * 0.95, 1), "overall": round(max_overall * 0.89, 1)},
        {"day": "Day -3", "flood": round(avg_flood * 0.93, 1), "shortage": round(avg_shortage * 0.98, 1), "overall": round(max_overall * 0.94, 1)},
        {"day": "Day -2", "flood": round(avg_flood * 1.05, 1), "shortage": round(avg_shortage * 1.02, 1), "overall": round(max_overall * 0.97, 1)},
        {"day": "Yesterday", "flood": round(avg_flood * 1.08, 1), "shortage": round(avg_shortage * 1.04, 1), "overall": round(max_overall * 0.99, 1)},
        {"day": "Today", "flood": avg_flood, "shortage": avg_shortage, "overall": max_overall},
    ]

    return {
        "flood_risk": avg_flood,
        "flood_risk_level": get_risk_level(avg_flood),
        "water_shortage_risk": avg_shortage,
        "water_shortage_level": get_risk_level(avg_shortage),
        "heat_risk": avg_heat,
        "heat_risk_level": get_risk_level(avg_heat),
        "leak_anomaly_detected": has_leak_anomaly,
        "leak_risk_score": avg_leak,
        "leak_risk_level": get_risk_level(avg_leak),
        "overall_environmental_risk": max_overall,
        "overall_risk_level": get_risk_level(max_overall),
        "critical_alerts_count": crit_alerts,
        "active_alerts_count": active_alerts,
        "locations_monitored_count": len(locations),
        "total_water_demand_liters": round(total_demand, 0),
        "total_water_supply_liters": round(total_supply, 0),
        "water_deficit_liters": round(net_deficit, 0),
        "avg_groundwater_percent": round(avg_gw, 1),
        "recent_readings": recent_readings,
        "risk_trends": trends,
        "data_mode": "Live Weather Data (Open-Meteo)" if is_live else settings.DATA_MODE_LABEL,
        "last_refresh": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "disclaimer": "Live Weather Data integrated with simulated urban hydrology." if is_live else "Prototype Command Center • Data is simulated for demonstration.",
        "weather_mode": "live" if is_live else "demo",
        "weather_source": "Open-Meteo Weather API (CC-BY 4.0)" if is_live else "Simulated Baseline",
        "hydrology_source": "Simulated Hydrology Telemetry"
    }

# --- 3. Interactive Risk Map ---

@app.get("/api/risk-map", response_model=RiskMapResponse, tags=["Map"])
def get_risk_map(mode: Optional[str] = None, db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    markers = []
    eff_mode = (mode or CURRENT_WEATHER_MODE).lower()
    is_live = eff_mode == "live"

    for l in locations:
        rain_val = l.rainfall_mm
        intensity_val = l.rainfall_intensity
        temp_val = l.temperature_c
        hum_val = l.humidity_percent
        weather_desc = "Simulated Baseline"
        obs_time = datetime.datetime.utcnow().isoformat()

        if is_live:
            try:
                live_w = fetch_live_weather(l.latitude, l.longitude)
                rain_val = live_w["rainfall_mm"]
                intensity_val = live_w["rainfall_intensity"]
                temp_val = live_w["temperature_c"]
                hum_val = live_w["humidity_percent"]
                weather_desc = live_w["weather_description"]
                obs_time = live_w["observation_time"]
            except WeatherServiceError as exc:
                raise HTTPException(
                    status_code=503,
                    detail=f"Open-Meteo API unreachable: {str(exc)}. Please switch to Demo Mode."
                )

        eval_dict = {
            "rainfall_mm": rain_val,
            "rainfall_intensity": intensity_val,
            "temperature_c": temp_val,
            "humidity_percent": hum_val,
            "groundwater_percent": l.groundwater_percent,
            "daily_demand_liters": l.daily_demand_liters,
            "daily_supply_liters": l.daily_supply_liters,
            "drainage_capacity_percent": l.drainage_capacity_percent,
            "soil_saturation_percent": l.soil_saturation_percent,
            "historical_flooding_index": l.historical_flooding_index,
            "historical_drought_index": l.historical_drought_index
        }
        res = evaluate_full_risk_profile(eval_dict)
        assess = res["assessment"]

        markers.append(RiskMapMarker(
            id=l.id,
            name=l.name,
            latitude=l.latitude,
            longitude=l.longitude,
            zone_type=l.zone_type,
            population=l.population,
            overall_risk=assess["overall_risk"],
            risk_level=assess["risk_level"],
            flood_risk=assess["flood_risk"],
            shortage_risk=assess["shortage_risk"],
            heat_risk=assess["heat_risk"],
            leak_risk=assess["leak_risk"],
            rainfall_mm=rain_val,
            temperature_c=temp_val,
            humidity_percent=hum_val,
            groundwater_percent=l.groundwater_percent,
            daily_demand_liters=l.daily_demand_liters,
            daily_supply_liters=l.daily_supply_liters,
            weather_source="Open-Meteo Weather API" if is_live else "Simulated Baseline",
            weather_observation_time=obs_time,
            weather_description=weather_desc,
            hydrology_source="Simulated Hydrology Telemetry"
        ))

    return RiskMapResponse(
        locations=markers,
        data_mode="Live Weather Data (Open-Meteo)" if is_live else settings.DATA_MODE_LABEL,
        disclaimer="Map markers represent prototype simulated monitoring zones. Not certified emergency boundaries.",
        weather_mode="live" if is_live else "demo",
        weather_source="Open-Meteo Weather API (CC-BY 4.0)" if is_live else "Simulated Baseline"
    )

# --- 4. Location Details & Predictions ---

@app.get("/api/location/{location_id}", response_model=LocationDetailResponse, tags=["Locations"])
def get_location_detail(location_id: int, mode: Optional[str] = None, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found.")

    eff_mode = (mode or CURRENT_WEATHER_MODE).lower()
    is_live = eff_mode == "live"

    rain_val = loc.rainfall_mm
    intensity_val = loc.rainfall_intensity
    temp_val = loc.temperature_c
    hum_val = loc.humidity_percent
    weather_desc = "Simulated Baseline"
    obs_time = datetime.datetime.utcnow().isoformat()

    if is_live:
        try:
            live_w = fetch_live_weather(loc.latitude, loc.longitude)
            rain_val = live_w["rainfall_mm"]
            intensity_val = live_w["rainfall_intensity"]
            temp_val = live_w["temperature_c"]
            hum_val = live_w["humidity_percent"]
            weather_desc = live_w["weather_description"]
            obs_time = live_w["observation_time"]
        except WeatherServiceError as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Open-Meteo API unreachable for {loc.name}: {str(exc)}. Please switch to Demo Mode."
            )

    eval_dict = {
        "rainfall_mm": rain_val,
        "rainfall_intensity": intensity_val,
        "temperature_c": temp_val,
        "humidity_percent": hum_val,
        "groundwater_percent": loc.groundwater_percent,
        "daily_demand_liters": loc.daily_demand_liters,
        "daily_supply_liters": loc.daily_supply_liters,
        "drainage_capacity_percent": loc.drainage_capacity_percent,
        "soil_saturation_percent": loc.soil_saturation_percent,
        "historical_flooding_index": loc.historical_flooding_index,
        "historical_drought_index": loc.historical_drought_index
    }
    eval_res = evaluate_full_risk_profile(eval_dict)
    assess = eval_res["assessment"]
    details = eval_res["details"]

    loc_payload = {
        "id": loc.id,
        "name": loc.name,
        "daily_demand_liters": loc.daily_demand_liters,
        "daily_supply_liters": loc.daily_supply_liters,
        "groundwater_percent": loc.groundwater_percent,
        "temperature_c": temp_val
    }
    forecast_data = generate_7day_water_forecast(loc_payload)["forecast_days"]
    recs = generate_recommendations(loc.id, loc.name, assess)

    return LocationDetailResponse(
        id=loc.id,
        name=loc.name,
        latitude=loc.latitude,
        longitude=loc.longitude,
        rainfall_mm=rain_val,
        rainfall_intensity=intensity_val,
        temperature_c=temp_val,
        humidity_percent=hum_val,
        groundwater_percent=loc.groundwater_percent,
        daily_demand_liters=loc.daily_demand_liters,
        daily_supply_liters=loc.daily_supply_liters,
        drainage_capacity_percent=loc.drainage_capacity_percent,
        soil_saturation_percent=loc.soil_saturation_percent,
        historical_flooding_index=loc.historical_flooding_index,
        historical_drought_index=loc.historical_drought_index,
        population=loc.population,
        zone_type=loc.zone_type,
        updated_at=loc.updated_at,
        risks=OverallRiskAssessment(**assess),
        risk_details={k: RiskScoreDetail(risk_type=k, **v) for k, v in details.items()},
        forecast_7d=forecast_data,
        recommendations=recs,
        weather_source="Open-Meteo Weather API" if is_live else "Simulated Baseline",
        weather_observation_time=obs_time,
        weather_description=weather_desc,
        hydrology_source="Simulated Hydrology Baseline"
    )

# --- 5. Alerts & Acknowledgement ---

@app.get("/api/alerts", response_model=List[AlertResponse], tags=["Alerts"])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    alerts = query.order_by(Alert.timestamp.desc()).all()
    return alerts

@app.post("/api/alerts/{alert_id}/acknowledge", response_model=AlertResponse, tags=["Alerts"])
def acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledgeRequest = None,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with ID {alert_id} not found.")

    if alert.status == "ACKNOWLEDGED":
        # Return existing acknowledged record idempotently
        return alert

    ack_by = (payload.acknowledged_by if payload and payload.acknowledged_by else "Control Operator")
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.datetime.utcnow()
    alert.acknowledged_by = ack_by
    db.commit()
    db.refresh(alert)
    logger.info(f"Alert {alert_id} acknowledged by {ack_by}")
    return alert

# --- 6. Prediction & Explainability ---

@app.post("/api/predict", response_model=PredictResponse, tags=["Prediction"])
def predict_risks(payload: PredictRequest):
    param_dict = payload.model_dump()
    eval_res = evaluate_full_risk_profile(param_dict)
    assess = eval_res["assessment"]
    details = eval_res["details"]

    detail_objects = {}
    for k, v in details.items():
        detail_objects[k] = RiskScoreDetail(risk_type=k, **v)

    return PredictResponse(
        risks=OverallRiskAssessment(**assess),
        details=detail_objects,
        disclaimer="Prototype Mode • Calculated using deterministic multi-parameter models."
    )

@app.post("/api/explain", response_model=ExplainResponse, tags=["Prediction"])
def explain_risk(payload: ExplainRequest):
    res = explain_risk_assessment(payload.risk_type, payload.score, payload.parameters)
    return ExplainResponse(**res)

# --- 7. What-If Climate Simulator ---

@app.post("/api/simulate", response_model=SimulateResponse, tags=["Simulator"])
def run_simulation(payload: SimulateRequest, db: Session = Depends(get_db)):
    # Baseline retrieval
    if payload.location_id:
        loc = db.query(Location).filter(Location.id == payload.location_id).first()
        if not loc:
            raise HTTPException(status_code=404, detail=f"Location {payload.location_id} not found.")
        base_params = {
            "rainfall_mm": loc.rainfall_mm,
            "temperature_c": loc.temperature_c,
            "groundwater_percent": loc.groundwater_percent,
            "daily_demand_liters": loc.daily_demand_liters,
            "daily_supply_liters": loc.daily_supply_liters,
            "drainage_capacity_percent": loc.drainage_capacity_percent,
            "soil_saturation_percent": loc.soil_saturation_percent,
            "humidity_percent": loc.humidity_percent
        }
    else:
        # Standard regional baseline
        base_params = {
            "rainfall_mm": 25.0,
            "temperature_c": 30.0,
            "groundwater_percent": 65.0,
            "daily_demand_liters": 500000.0,
            "daily_supply_liters": 480000.0,
            "drainage_capacity_percent": 75.0,
            "soil_saturation_percent": 45.0,
            "humidity_percent": 65.0
        }

    sim_params = {
        "rainfall_mm": payload.rainfall_mm,
        "temperature_c": payload.temperature_c,
        "groundwater_percent": payload.groundwater_percent,
        "daily_demand_liters": payload.daily_demand_liters,
        "daily_supply_liters": payload.daily_supply_liters,
        "drainage_capacity_percent": payload.drainage_capacity_percent,
        "soil_saturation_percent": payload.soil_saturation_percent,
        "humidity_percent": payload.humidity_percent
    }

    base_eval = evaluate_full_risk_profile(base_params)
    sim_eval = evaluate_full_risk_profile(sim_params)

    base_scores = {
        "flood_risk": base_eval["assessment"]["flood_risk"],
        "shortage_risk": base_eval["assessment"]["shortage_risk"],
        "heat_risk": base_eval["assessment"]["heat_risk"],
        "drought_risk": base_eval["assessment"]["drought_risk"],
        "overall_risk": base_eval["assessment"]["overall_risk"]
    }

    sim_scores = {
        "flood_risk": sim_eval["assessment"]["flood_risk"],
        "shortage_risk": sim_eval["assessment"]["shortage_risk"],
        "heat_risk": sim_eval["assessment"]["heat_risk"],
        "drought_risk": sim_eval["assessment"]["drought_risk"],
        "overall_risk": sim_eval["assessment"]["overall_risk"]
    }

    score_deltas = {
        k: round(sim_scores[k] - base_scores[k], 1) for k in base_scores
    }

    base_levels = {k: get_risk_level(v) for k, v in base_scores.items()}
    sim_levels = {k: get_risk_level(v) for k, v in sim_scores.items()}

    # Extract top contributing factor shifts
    top_factors = []
    if abs(score_deltas["flood_risk"]) > 5:
        top_factors.append({
            "name": "Rainfall & Soil Saturation Surge",
            "value": payload.rainfall_mm,
            "unit": "mm",
            "impact": "Elevating" if score_deltas["flood_risk"] > 0 else "Mitigating",
            "weight_pct": 35.0
        })
    if abs(score_deltas["shortage_risk"]) > 5:
        top_factors.append({
            "name": "Demand-Supply Margin Shift",
            "value": round(payload.daily_demand_liters - payload.daily_supply_liters, 0),
            "unit": "L/day",
            "impact": "Elevating" if score_deltas["shortage_risk"] > 0 else "Mitigating",
            "weight_pct": 45.0
        })
    if abs(score_deltas["heat_risk"]) > 5:
        top_factors.append({
            "name": "Thermal Temperature Delta",
            "value": payload.temperature_c,
            "unit": "°C",
            "impact": "Elevating" if score_deltas["heat_risk"] > 0 else "Mitigating",
            "weight_pct": 55.0
        })

    # Recommended actions for the simulated outcome
    rec_actions = []
    if sim_scores["overall_risk"] > 70:
        rec_actions.append("Pre-position high-capacity dewatering pumps and enact emergency tanker routing.")
        rec_actions.append("Issue simulated climate contingency advisory to regional authorities.")
    elif sim_scores["shortage_risk"] > 60:
        rec_actions.append("Stage municipal tanker distribution lines and prepare water quota guidelines.")
    else:
        rec_actions.append("System capacity comfortably absorbs simulated environmental stress.")

    # Persist simulation run
    sim_record = SimulationRun(
        input_params=json.dumps(sim_params),
        baseline_scores=json.dumps(base_scores),
        simulated_scores=json.dumps(sim_scores),
        score_deltas=json.dumps(score_deltas),
        top_factors=json.dumps(top_factors),
        recommended_actions_summary="; ".join(rec_actions)
    )
    db.add(sim_record)
    db.commit()
    db.refresh(sim_record)

    return SimulateResponse(
        simulation_id=sim_record.id,
        baseline_scores=base_scores,
        simulated_scores=sim_scores,
        score_deltas=score_deltas,
        baseline_levels=base_levels,
        simulated_levels=sim_levels,
        top_contributing_factors=top_factors,
        recommended_actions=rec_actions,
        disclaimer="What-If Climate Simulation Model • Heuristic Exploration Prototype"
    )

# --- 8. Water Forecast ---

@app.get("/api/water-forecast", response_model=WaterForecastResponse, tags=["Water Intelligence"])
def get_water_forecast(location_id: Optional[int] = None, db: Session = Depends(get_db)):
    if location_id:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise HTTPException(status_code=404, detail="Location not found.")
        payload = {
            "id": loc.id,
            "name": loc.name,
            "daily_demand_liters": loc.daily_demand_liters,
            "daily_supply_liters": loc.daily_supply_liters,
            "groundwater_percent": loc.groundwater_percent,
            "temperature_c": loc.temperature_c
        }
    else:
        # Regional aggregate
        locs = db.query(Location).all()
        payload = {
            "id": None,
            "name": "Greater Regional Network",
            "daily_demand_liters": sum(l.daily_demand_liters for l in locs),
            "daily_supply_liters": sum(l.daily_supply_liters for l in locs),
            "groundwater_percent": sum(l.groundwater_percent for l in locs) / len(locs),
            "temperature_c": sum(l.temperature_c for l in locs) / len(locs)
        }

    return generate_7day_water_forecast(payload)

# --- 9. Heat Risk ---

@app.get("/api/heat-risk", response_model=HeatRiskResponse, tags=["Heat Intelligence"])
def get_heat_risk(location_id: Optional[int] = None, db: Session = Depends(get_db)):
    if location_id:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise HTTPException(status_code=404, detail="Location not found.")
        temp = loc.temperature_c
        hum = loc.humidity_percent
        name = loc.name
        lid = loc.id
    else:
        loc = db.query(Location).order_by(Location.temperature_c.desc()).first()
        temp = loc.temperature_c if loc else 35.0
        hum = loc.humidity_percent if loc else 60.0
        name = loc.name if loc else "Regional Max"
        lid = loc.id if loc else None

    eval_heat = calculate_heat_risk(temp, hum)
    return HeatRiskResponse(
        location_id=lid,
        location_name=name,
        temperature_c=temp,
        humidity_percent=hum,
        feels_like_c=eval_heat["feels_like_c"],
        heat_risk_score=eval_heat["score"],
        risk_level=eval_heat["risk_level"],
        prediction_window=eval_heat["prediction_horizon"],
        contributing_factors=eval_heat["contributing_factors"],
        recommended_actions=eval_heat["actions"],
        disclaimer="Prototype NOAA Heat Index Approximation • For Decision Support Only"
    )

# --- 10. Water Consumption History & Leak Detection ---

@app.get("/api/water-consumption", tags=["Leak Intelligence"])
def get_water_consumption(location_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(WaterConsumption)
    if location_id:
        query = query.filter(WaterConsumption.location_id == location_id)
    records = query.order_by(WaterConsumption.recorded_date.desc()).limit(50).all()
    return records

@app.post("/api/leak-detection", response_model=LeakDetectionResponse, tags=["Leak Intelligence"])
def detect_leak(payload: LeakDetectionRequest):
    return analyze_leak_anomaly(
        normal_consumption=payload.normal_consumption,
        observed_consumption=payload.observed_consumption,
        pipe_zone_id=payload.pipe_zone_id or "Zone-B Metro Core"
    )

# --- 11. Tanker Fleet Optimization ---

@app.post("/api/tanker-optimize", response_model=TankerOptimizeResponse, tags=["Tanker Optimizer"])
def run_tanker_optimization(payload: TankerOptimizeRequest, db: Session = Depends(get_db)):
    locations_input = []
    if payload.locations and len(payload.locations) > 0:
        locations_input = [l.model_dump() for l in payload.locations]
    else:
        # Load active monitored locations from database
        locs = db.query(Location).all()
        for l in locs:
            s_res = calculate_water_shortage_risk(l.daily_demand_liters, l.daily_supply_liters, l.groundwater_percent, l.temperature_c)
            # Assign priority weight based on population and zone
            prio = 5 if "Core" in l.name or "Industrial" in l.name else (4 if l.population > 80000 else 3)
            locations_input.append({
                "id": l.id,
                "name": l.name,
                "demand_liters": l.daily_demand_liters,
                "supply_liters": l.daily_supply_liters,
                "shortage_risk": s_res["score"],
                "population": l.population,
                "priority_weight": prio
            })

    result = optimize_tanker_allocation(
        available_tankers=payload.available_tankers,
        tanker_capacity_liters=payload.tanker_capacity_liters,
        locations_demand=locations_input
    )
    return result

# --- 12. Recommendations ---

@app.get("/api/recommendations", response_model=RecommendationsListResponse, tags=["Recommendations"])
def get_recommendations(
    priority: Optional[str] = None,
    risk_type: Optional[str] = None,
    location_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation)
    if priority:
        query = query.filter(Recommendation.priority == priority.upper())
    if risk_type:
        query = query.filter(Recommendation.linked_risk.ilike(f"%{risk_type}%"))
    if location_id:
        query = query.filter(Recommendation.location_id == location_id)

    db_recs = query.order_by(Recommendation.id.asc()).all()
    
    # Map to schema items
    rec_items = []
    critical_count = 0
    for r in db_recs:
        loc = db.query(Location).filter(Location.id == r.location_id).first() if r.location_id else None
        factors_list = [f.strip() for f in r.contributing_factors.split(";")] if r.contributing_factors else []
        if r.priority == "CRITICAL":
            critical_count += 1
            
        rec_items.append(RecommendationItem(
            id=r.id,
            title=r.title,
            explanation=r.explanation,
            priority=r.priority,
            linked_risk=r.linked_risk,
            contributing_factors=factors_list,
            suggested_action=r.suggested_action,
            estimated_urgency=r.estimated_urgency,
            status=r.status,
            location_id=r.location_id,
            location_name=loc.name if loc else "Regional Sector",
            created_at=r.created_at
        ))

    return RecommendationsListResponse(
        recommendations=rec_items,
        total_count=len(rec_items),
        critical_count=critical_count,
        disclaimer="AI-generated decision support suggestions require review by certified municipal authorities."
    )
