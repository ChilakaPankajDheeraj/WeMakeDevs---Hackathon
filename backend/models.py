import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rainfall_mm = Column(Float, default=0.0)
    rainfall_intensity = Column(Float, default=0.0)  # mm/hour
    temperature_c = Column(Float, default=28.0)
    humidity_percent = Column(Float, default=65.0)
    groundwater_percent = Column(Float, default=70.0)
    daily_demand_liters = Column(Float, default=500000.0)
    daily_supply_liters = Column(Float, default=480000.0)
    drainage_capacity_percent = Column(Float, default=75.0)
    soil_saturation_percent = Column(Float, default=45.0)
    historical_flooding_index = Column(Float, default=25.0)  # 0 to 100 scale
    historical_drought_index = Column(Float, default=20.0)   # 0 to 100 scale
    population = Column(Integer, default=50000)
    zone_type = Column(String(50), default="Mixed Urban")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    weather_records = relationship("WeatherData", back_populates="location", cascade="all, delete-orphan")
    consumption_records = relationship("WaterConsumption", back_populates="location", cascade="all, delete-orphan")
    groundwater_records = relationship("GroundwaterData", back_populates="location", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="location", cascade="all, delete-orphan")


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    rainfall_mm = Column(Float, nullable=False)
    rainfall_intensity = Column(Float, default=0.0)
    temperature_c = Column(Float, nullable=False)
    humidity_percent = Column(Float, nullable=False)
    feels_like_c = Column(Float, nullable=False)

    location = relationship("Location", back_populates="weather_records")


class WaterConsumption(Base):
    __tablename__ = "water_consumption"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    recorded_date = Column(String(20), nullable=False, index=True)
    normal_liters = Column(Float, nullable=False)
    observed_liters = Column(Float, nullable=False)
    excess_liters = Column(Float, default=0.0)
    anomaly_flag = Column(Boolean, default=False)
    cause_notes = Column(String(255), default="Normal consumption profile")

    location = relationship("Location", back_populates="consumption_records")


class GroundwaterData(Base):
    __tablename__ = "groundwater_data"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    recorded_date = Column(String(20), nullable=False, index=True)
    depth_meters = Column(Float, nullable=False)
    capacity_percent = Column(Float, nullable=False)
    recharge_rate = Column(Float, default=0.0)

    location = relationship("Location", back_populates="groundwater_records")


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    flood_risk = Column(Float, nullable=False)
    waterlogging_risk = Column(Float, nullable=False)
    shortage_risk = Column(Float, nullable=False)
    heat_risk = Column(Float, nullable=False)
    leak_risk = Column(Float, nullable=False)
    drought_risk = Column(Float, nullable=False)
    overall_risk = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    confidence_type = Column(String(30), default="heuristic")
    explanation = Column(Text, nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String(20), nullable=False, index=True)  # CRITICAL, WARNING, INFORMATION
    risk_type = Column(String(50), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    location_name = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    cause = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(20), default="ACTIVE", index=True)  # ACTIVE, ACKNOWLEDGED
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)

    location = relationship("Location", back_populates="alerts")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    linked_risk = Column(String(50), nullable=False)
    contributing_factors = Column(Text, nullable=True)  # JSON serialized string
    suggested_action = Column(Text, nullable=False)
    estimated_urgency = Column(String(50), default="Within 24h")
    status = Column(String(30), default="Pending Review")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False)
    event_date = Column(String(30), nullable=False)
    severity_rating = Column(Float, nullable=False)
    impact_summary = Column(Text, nullable=False)
    recorded_loss = Column(String(100), nullable=True)


class TankerResource(Base):
    __tablename__ = "tanker_resources"

    id = Column(Integer, primary_key=True, index=True)
    base_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    vehicle_reg = Column(String(30), nullable=False, unique=True)
    capacity_liters = Column(Float, default=10000.0)
    status = Column(String(20), default="Available")  # Available, Dispatched, Maintenance
    last_inspection = Column(DateTime, default=datetime.datetime.utcnow)


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    input_params = Column(Text, nullable=False)  # JSON serialized
    baseline_scores = Column(Text, nullable=False)  # JSON serialized
    simulated_scores = Column(Text, nullable=False)  # JSON serialized
    score_deltas = Column(Text, nullable=False)  # JSON serialized
    top_factors = Column(Text, nullable=True)
    recommended_actions_summary = Column(Text, nullable=True)
