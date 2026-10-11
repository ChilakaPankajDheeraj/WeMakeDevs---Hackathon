from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
import datetime

# --- Common / Enums ---
# Risk levels: LOW (0-30), MODERATE (31-60), HIGH (61-80), CRITICAL (81-100)

class SystemStatusResponse(BaseModel):
    api_status: str
    database_status: str
    database_mode: str
    risk_engine_status: str
    data_mode: str
    timestamp: str
    active_alerts_count: int
    locations_count: int

class HealthResponse(BaseModel):
    status: str
    api_status: str
    database_status: str
    database_mode: str
    risk_engine_status: str
    timestamp: str

# --- Location Schemas ---
class LocationBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    rainfall_mm: float = Field(default=0.0, ge=0.0, le=1000.0)
    rainfall_intensity: float = Field(default=0.0, ge=0.0, le=200.0)
    temperature_c: float = Field(default=28.0, ge=-20.0, le=65.0)
    humidity_percent: float = Field(default=65.0, ge=0.0, le=100.0)
    groundwater_percent: float = Field(default=70.0, ge=0.0, le=100.0)
    daily_demand_liters: float = Field(default=500000.0, ge=0.0)
    daily_supply_liters: float = Field(default=480000.0, ge=0.0)
    drainage_capacity_percent: float = Field(default=75.0, ge=0.0, le=100.0)
    soil_saturation_percent: float = Field(default=45.0, ge=0.0, le=100.0)
    historical_flooding_index: float = Field(default=25.0, ge=0.0, le=100.0)
    historical_drought_index: float = Field(default=20.0, ge=0.0, le=100.0)
    population: int = Field(default=50000, ge=1)
    zone_type: str = "Mixed Urban"

class LocationResponse(LocationBase):
    id: int
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- Risk Calculations & Predictions ---
class ContributingFactor(BaseModel):
    name: str
    value: float
    unit: str
    impact: str  # "Elevating", "Mitigating", "Neutral"
    weight_pct: float

class RiskScoreDetail(BaseModel):
    risk_type: str
    score: float
    risk_level: str
    confidence_type: str = "heuristic"
    explanation: str
    contributing_factors: List[ContributingFactor] = []
    actions: List[str] = []
    prediction_horizon: str = "Next 24-48 Hours"
    disclaimer: str = "Prototype Mode • Simulated Heuristic Estimate"

class OverallRiskAssessment(BaseModel):
    flood_risk: float
    waterlogging_risk: float
    shortage_risk: float
    heat_risk: float
    leak_risk: float
    drought_risk: float
    overall_risk: float
    risk_level: str
    confidence_type: str = "heuristic"
    summary_explanation: str
    timestamp: str

class LocationDetailResponse(LocationResponse):
    risks: OverallRiskAssessment
    risk_details: Dict[str, RiskScoreDetail]
    forecast_7d: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    weather_source: str = "Simulated Baseline"
    weather_observation_time: Optional[str] = None
    weather_description: Optional[str] = None
    hydrology_source: str = "Simulated Hydrology Baseline"

# --- Risk Map ---
class RiskMapMarker(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    zone_type: str
    population: int
    overall_risk: float
    risk_level: str
    flood_risk: float
    shortage_risk: float
    heat_risk: float
    leak_risk: float
    rainfall_mm: float
    temperature_c: float
    humidity_percent: float
    groundwater_percent: float
    daily_demand_liters: float
    daily_supply_liters: float
    weather_source: str = "Simulated Baseline"
    weather_observation_time: Optional[str] = None
    weather_description: Optional[str] = None
    hydrology_source: str = "Simulated Hydrology Telemetry"

class RiskMapResponse(BaseModel):
    locations: List[RiskMapMarker]
    data_mode: str
    disclaimer: str
    weather_mode: str = "demo"
    weather_source: str = "Simulated Baseline"

# --- Alerts ---
class AlertResponse(BaseModel):
    id: int
    severity: str
    risk_type: str
    location_id: Optional[int]
    location_name: str
    timestamp: datetime.datetime
    cause: str
    risk_score: float
    recommended_action: str
    status: str
    acknowledged_at: Optional[datetime.datetime] = None
    acknowledged_by: Optional[str] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: Optional[str] = "Operator"

# --- Predict & Explain Requests ---
class PredictRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0.0, le=1000.0)
    rainfall_intensity: float = Field(default=0.0, ge=0.0, le=200.0)
    temperature_c: float = Field(..., ge=-20.0, le=65.0)
    humidity_percent: float = Field(..., ge=0.0, le=100.0)
    groundwater_percent: float = Field(..., ge=0.0, le=100.0)
    daily_demand_liters: float = Field(..., ge=0.0)
    daily_supply_liters: float = Field(..., ge=0.0)
    drainage_capacity_percent: float = Field(..., ge=0.0, le=100.0)
    soil_saturation_percent: float = Field(..., ge=0.0, le=100.0)
    historical_flooding_index: float = Field(default=25.0, ge=0.0, le=100.0)
    historical_drought_index: float = Field(default=20.0, ge=0.0, le=100.0)
    observed_consumption_liters: Optional[float] = None
    normal_consumption_liters: Optional[float] = None

class PredictResponse(BaseModel):
    risks: OverallRiskAssessment
    details: Dict[str, RiskScoreDetail]
    disclaimer: str

class ExplainRequest(BaseModel):
    risk_type: str
    score: Optional[float] = None
    parameters: Optional[Dict[str, float]] = None

class ExplainResponse(BaseModel):
    risk_type: str
    score: float
    risk_level: str
    confidence_type: str
    explanation: str
    contributing_factors: List[ContributingFactor]
    actions: List[str]
    prediction_window: str
    simulated_data_disclaimer: str

# --- Simulation ---
class SimulateRequest(BaseModel):
    location_id: Optional[int] = None
    rainfall_mm: float = Field(..., ge=0.0, le=500.0)
    temperature_c: float = Field(..., ge=0.0, le=60.0)
    groundwater_percent: float = Field(..., ge=0.0, le=100.0)
    daily_demand_liters: float = Field(..., ge=0.0)
    daily_supply_liters: float = Field(..., ge=0.0)
    drainage_capacity_percent: float = Field(..., ge=0.0, le=100.0)
    soil_saturation_percent: float = Field(..., ge=0.0, le=100.0)
    humidity_percent: float = Field(default=65.0, ge=0.0, le=100.0)

class SimulateResponse(BaseModel):
    simulation_id: int
    baseline_scores: Dict[str, float]
    simulated_scores: Dict[str, float]
    score_deltas: Dict[str, float]
    baseline_levels: Dict[str, str]
    simulated_levels: Dict[str, str]
    top_contributing_factors: List[ContributingFactor]
    recommended_actions: List[str]
    disclaimer: str

# --- Water Forecast ---
class WaterForecastDay(BaseModel):
    date: str
    day_name: str
    demand_liters: float
    supply_liters: float
    groundwater_percent: float
    shortage_risk: float
    shortage_liters: float
    risk_level: str

class WaterForecastResponse(BaseModel):
    location_id: Optional[int]
    location_name: str
    forecast_days: List[WaterForecastDay]
    total_shortage_projected_liters: float
    peak_shortage_day: str
    insight_summary: str
    disclaimer: str

# --- Heat Risk ---
class HeatRiskResponse(BaseModel):
    location_id: Optional[int]
    location_name: str
    temperature_c: float
    humidity_percent: float
    feels_like_c: float
    heat_risk_score: float
    risk_level: str
    prediction_window: str
    contributing_factors: List[ContributingFactor]
    recommended_actions: List[str]
    disclaimer: str

# --- Leak Detection ---
class LeakDetectionRequest(BaseModel):
    normal_consumption: float = Field(..., ge=0.0)
    observed_consumption: float = Field(..., ge=0.0)
    pipe_zone_id: Optional[str] = "Zone-B Metro Core"

class LeakDetectionResponse(BaseModel):
    normal_consumption: float
    observed_consumption: float
    excess_consumption: float
    anomaly_percentage: float
    anomaly_detected: bool
    risk_score: float
    risk_level: str
    confidence_type: str
    possible_causes: List[str]
    recommended_actions: List[str]
    pipe_zone_id: Optional[str]
    disclaimer: str

# --- Tanker Optimization ---
class TankerLocationDemand(BaseModel):
    id: int
    name: str
    demand_liters: float = Field(..., ge=0.0)
    supply_liters: float = Field(..., ge=0.0)
    shortage_risk: float = Field(..., ge=0.0, le=100.0)
    population: int = Field(default=10000, ge=1)
    priority_weight: int = Field(default=3, ge=1, le=5)  # 1 (lowest) to 5 (highest)

class TankerOptimizeRequest(BaseModel):
    available_tankers: int = Field(..., ge=0, le=500)
    tanker_capacity_liters: float = Field(default=10000.0, gt=0.0)
    locations: Optional[List[TankerLocationDemand]] = None

class TankerAllocationItem(BaseModel):
    location_id: int
    location_name: str
    initial_demand_liters: float
    initial_supply_liters: float
    net_shortage_liters: float
    shortage_risk: float
    priority_weight: int
    population: int
    allocated_tankers: int
    allocated_water_liters: float
    unmet_demand_liters: float
    fulfillment_rate_percent: float
    allocation_rationale: str

class TankerOptimizeResponse(BaseModel):
    total_tankers_available: int
    total_tankers_allocated: int
    remaining_idle_tankers: int
    total_water_dispatched_liters: float
    total_unmet_demand_liters: float
    overall_fulfillment_rate_percent: float
    allocations: List[TankerAllocationItem]
    optimization_summary: str
    disclaimer: str

# --- Recommendations ---
class RecommendationItem(BaseModel):
    id: int
    title: str
    explanation: str
    priority: str
    linked_risk: str
    contributing_factors: List[str]
    suggested_action: str
    estimated_urgency: str
    status: str
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

class RecommendationsListResponse(BaseModel):
    recommendations: List[RecommendationItem]
    total_count: int
    critical_count: int
    disclaimer: str

# --- Dashboard ---
class DashboardOverviewResponse(BaseModel):
    flood_risk: float
    flood_risk_level: str
    water_shortage_risk: float
    water_shortage_level: str
    heat_risk: float
    heat_risk_level: str
    leak_anomaly_detected: bool
    leak_risk_score: float
    leak_risk_level: str
    overall_environmental_risk: float
    overall_risk_level: str
    critical_alerts_count: int
    active_alerts_count: int
    locations_monitored_count: int
    total_water_demand_liters: float
    total_water_supply_liters: float
    water_deficit_liters: float
    avg_groundwater_percent: float
    recent_readings: List[Dict[str, Any]]
    risk_trends: List[Dict[str, Any]]
    data_mode: str
    last_refresh: str
    disclaimer: str
    weather_mode: str = "demo"
    weather_source: str = "Simulated Baseline"
    hydrology_source: str = "Simulated Hydrology Telemetry"

# --- Weather Mode & External Live Weather ---
class WeatherModeResponse(BaseModel):
    mode: str  # "demo" or "live"
    label: str
    source: str
    timestamp: str
    description: str

class WeatherModeUpdateRequest(BaseModel):
    mode: str  # "demo" or "live"

class LiveWeatherResponse(BaseModel):
    location_id: Optional[int] = None
    location_name: str
    latitude: float
    longitude: float
    temperature_c: float
    humidity_percent: float
    rainfall_mm: float
    rainfall_intensity: float
    current_precipitation_mm: float
    weather_code: int
    weather_description: str
    wind_speed_kmh: float
    observation_time: str
    source: str
    source_url: str
    attribution: str
    is_live: bool
    data_mode_label: str
    hydrology_status: str
    cached: bool = False
