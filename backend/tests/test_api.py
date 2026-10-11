import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, init_db
from backend.seed_data import seed_database_if_empty
from backend.risk_engine import (
    calculate_flood_risk,
    calculate_water_shortage_risk,
    calculate_heat_risk,
    calculate_leak_risk,
    calculate_drought_risk,
    calculate_overall_risk,
    get_risk_level,
    clamp
)
from backend.tanker_optimizer import optimize_tanker_allocation

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    with SessionLocal() as db:
        seed_database_if_empty(db)
    yield

# 1. System & Root Endpoints
def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "AquaNex"
    assert "Predict. Protect. Act." in data["tagline"]

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["api_status"] == "operational"
    assert data["database_status"] == "connected"
    assert "timestamp" in data

def test_system_status_endpoint():
    response = client.get("/api/system-status")
    assert response.status_code == 200
    data = response.json()
    assert data["api_status"] == "operational"
    assert data["locations_count"] >= 5
    assert "Prototype Mode" in data["data_mode"]

# 2. Dashboard Endpoint
def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "flood_risk" in data
    assert "water_shortage_risk" in data
    assert "overall_environmental_risk" in data
    assert data["locations_monitored_count"] >= 5
    assert len(data["recent_readings"]) >= 5
    assert len(data["risk_trends"]) == 7

# 3. Risk Engine Bounds & Clamping
def test_risk_score_bounds_and_clamping():
    assert clamp(-50) == 0.0
    assert clamp(150) == 100.0
    assert clamp(55.5) == 55.5

    # Test extreme flood inputs
    extreme_flood = calculate_flood_risk(rainfall_mm=9999.0, rainfall_intensity=500.0, soil_saturation=100.0, drainage_capacity=0.0)
    assert 0.0 <= extreme_flood["score"] <= 100.0
    assert extreme_flood["risk_level"] == "CRITICAL"

    zero_flood = calculate_flood_risk(rainfall_mm=0.0, rainfall_intensity=0.0, soil_saturation=0.0, drainage_capacity=100.0)
    assert 0.0 <= zero_flood["score"] <= 100.0
    assert zero_flood["risk_level"] == "LOW"

def test_risk_level_boundaries():
    assert get_risk_level(0.0) == "LOW"
    assert get_risk_level(30.0) == "LOW"
    assert get_risk_level(30.1) == "MODERATE"
    assert get_risk_level(60.0) == "MODERATE"
    assert get_risk_level(60.1) == "HIGH"
    assert get_risk_level(80.0) == "HIGH"
    assert get_risk_level(80.1) == "CRITICAL"
    assert get_risk_level(100.0) == "CRITICAL"

# 4. Sensitivity Tests (Increasing rainfall, Decreasing drainage)
def test_flood_risk_increases_with_rainfall():
    low_rain = calculate_flood_risk(rainfall_mm=20.0, rainfall_intensity=5.0, soil_saturation=50.0, drainage_capacity=60.0)
    high_rain = calculate_flood_risk(rainfall_mm=120.0, rainfall_intensity=35.0, soil_saturation=50.0, drainage_capacity=60.0)
    assert high_rain["score"] > low_rain["score"]

def test_flood_risk_increases_with_decreasing_drainage():
    good_drain = calculate_flood_risk(rainfall_mm=80.0, rainfall_intensity=20.0, soil_saturation=60.0, drainage_capacity=90.0)
    bad_drain = calculate_flood_risk(rainfall_mm=80.0, rainfall_intensity=20.0, soil_saturation=60.0, drainage_capacity=20.0)
    assert bad_drain["score"] > good_drain["score"]

# 5. Shortage & Heat Tests
def test_shortage_risk_behavior():
    balanced = calculate_water_shortage_risk(daily_demand=500000, daily_supply=500000, groundwater_pct=80, temperature_c=25)
    acute_deficit = calculate_water_shortage_risk(daily_demand=800000, daily_supply=400000, groundwater_pct=20, temperature_c=38)
    assert acute_deficit["score"] > balanced["score"]
    assert acute_deficit["deficit_liters"] == 400000

def test_heat_risk_behavior():
    mild = calculate_heat_risk(temperature_c=22.0, humidity_percent=40.0)
    extreme = calculate_heat_risk(temperature_c=42.0, humidity_percent=85.0)
    assert extreme["feels_like_c"] > mild["feels_like_c"]
    assert extreme["score"] > mild["score"]
    assert extreme["risk_level"] == "CRITICAL"

# 6. Leak Detection
def test_leak_anomaly_calculation():
    normal = calculate_leak_risk(normal_consumption=100000, observed_consumption=102000)
    assert not normal["anomaly_detected"]
    assert normal["risk_level"] == "LOW"

    leak = calculate_leak_risk(normal_consumption=100000, observed_consumption=140000)
    assert leak["anomaly_detected"]
    assert leak["excess_liters"] == 40000
    assert leak["anomaly_percentage"] == 40.0
    assert leak["risk_level"] in ["HIGH", "CRITICAL"]

# 7. Tanker Optimization Constraints
def test_tanker_allocation_constraints():
    locations = [
        {"id": 1, "name": "Sector Alpha", "demand_liters": 100000, "supply_liters": 50000, "shortage_risk": 85.0, "population": 40000, "priority_weight": 5},
        {"id": 2, "name": "Sector Beta", "demand_liters": 80000, "supply_liters": 60000, "shortage_risk": 60.0, "population": 25000, "priority_weight": 3},
        {"id": 3, "name": "Sector Gamma", "demand_liters": 50000, "supply_liters": 50000, "shortage_risk": 20.0, "population": 15000, "priority_weight": 2},
    ]
    # Total available: 5 tankers of 10,000L each = 50,000L capacity
    res = optimize_tanker_allocation(available_tankers=5, tanker_capacity_liters=10000, locations_demand=locations)
    
    assert res["total_tankers_allocated"] <= res["total_tankers_available"]
    assert res["total_tankers_allocated"] == 5
    assert res["remaining_idle_tankers"] == 0

    # Ensure no negative allocation
    for alloc in res["allocations"]:
        assert alloc["allocated_tankers"] >= 0
        assert alloc["allocated_water_liters"] >= 0
        assert alloc["unmet_demand_liters"] >= 0

    # Sector Gamma (zero shortage) must receive 0 tankers
    gamma_alloc = next(a for a in res["allocations"] if a["location_id"] == 3)
    assert gamma_alloc["allocated_tankers"] == 0
    assert gamma_alloc["net_shortage_liters"] == 0

# 8. Alert Acknowledgement Persistence
def test_alert_acknowledgement_persistence():
    # Fetch active alerts
    alerts_res = client.get("/api/alerts?status=ACTIVE")
    assert alerts_res.status_code == 200
    active_alerts = alerts_res.json()
    if len(active_alerts) == 0:
        from backend.database import SessionLocal
        from backend.models import Alert
        db = SessionLocal()
        try:
            a = db.query(Alert).first()
            if a:
                a.status = "ACTIVE"
                a.acknowledged_by = None
                a.acknowledged_at = None
                db.commit()
        finally:
            db.close()
        active_alerts = client.get("/api/alerts?status=ACTIVE").json()

    assert len(active_alerts) > 0

    target_alert = active_alerts[0]
    alert_id = target_alert["id"]

    # Acknowledge alert
    ack_res = client.post(f"/api/alerts/{alert_id}/acknowledge", json={"acknowledged_by": "Test Operator Suite"})
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["status"] == "ACKNOWLEDGED"
    assert ack_data["acknowledged_by"] == "Test Operator Suite"
    assert ack_data["acknowledged_at"] is not None

    # Idempotent re-acknowledge
    ack_res2 = client.post(f"/api/alerts/{alert_id}/acknowledge", json={"acknowledged_by": "Test Operator Suite"})
    assert ack_res2.status_code == 200
    assert ack_res2.json()["status"] == "ACKNOWLEDGED"

# 9. Water Forecast Length (7 Days)
def test_water_forecast_length_and_insights():
    res = client.get("/api/water-forecast")
    assert res.status_code == 200
    data = res.json()
    assert len(data["forecast_days"]) == 7
    assert "insight_summary" in data
    assert data["total_shortage_projected_liters"] >= 0

# 10. Climate Simulation API
def test_simulation_api():
    payload = {
        "rainfall_mm": 180.0,
        "temperature_c": 36.0,
        "groundwater_percent": 30.0,
        "daily_demand_liters": 750000.0,
        "daily_supply_liters": 450000.0,
        "drainage_capacity_percent": 35.0,
        "soil_saturation_percent": 90.0,
        "humidity_percent": 80.0
    }
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "simulation_id" in data
    assert "baseline_scores" in data
    assert "simulated_scores" in data
    assert "score_deltas" in data
    # Severe rainfall + poor drainage should increase flood risk delta
    assert data["score_deltas"]["flood_risk"] > 0
    assert len(data["recommended_actions"]) > 0

# 11. Invalid Request Handling
def test_invalid_request_handling():
    # Negative rainfall should be rejected by Pydantic validation
    invalid_payload = {
        "rainfall_mm": -10.0,
        "temperature_c": 25.0,
        "groundwater_percent": 50.0,
        "daily_demand_liters": 500000.0,
        "daily_supply_liters": 500000.0,
        "drainage_capacity_percent": 50.0,
        "soil_saturation_percent": 50.0
    }
    res = client.post("/api/simulate", json=invalid_payload)
    assert res.status_code == 422  # Unprocessable Entity
