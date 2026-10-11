-- =========================================================================
-- AQUANEX: SUPABASE POSTGRESQL SCHEMA & ROW-LEVEL SECURITY POLICIES
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    rainfall_mm DOUBLE PRECISION DEFAULT 0.0,
    rainfall_intensity DOUBLE PRECISION DEFAULT 0.0,
    temperature_c DOUBLE PRECISION DEFAULT 28.0,
    humidity_percent DOUBLE PRECISION DEFAULT 65.0,
    groundwater_percent DOUBLE PRECISION DEFAULT 70.0,
    daily_demand_liters DOUBLE PRECISION DEFAULT 500000.0,
    daily_supply_liters DOUBLE PRECISION DEFAULT 480000.0,
    drainage_capacity_percent DOUBLE PRECISION DEFAULT 75.0,
    soil_saturation_percent DOUBLE PRECISION DEFAULT 45.0,
    historical_flooding_index DOUBLE PRECISION DEFAULT 25.0,
    historical_drought_index DOUBLE PRECISION DEFAULT 20.0,
    population INTEGER DEFAULT 50000,
    zone_type VARCHAR(50) DEFAULT 'Mixed Urban',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Weather Telemetry
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    rainfall_mm DOUBLE PRECISION NOT NULL,
    rainfall_intensity DOUBLE PRECISION DEFAULT 0.0,
    temperature_c DOUBLE PRECISION NOT NULL,
    humidity_percent DOUBLE PRECISION NOT NULL,
    feels_like_c DOUBLE PRECISION NOT NULL
);

-- 3. Water Consumption Telemetry
CREATE TABLE IF NOT EXISTS water_consumption (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    recorded_date VARCHAR(20) NOT NULL,
    normal_liters DOUBLE PRECISION NOT NULL,
    observed_liters DOUBLE PRECISION NOT NULL,
    excess_liters DOUBLE PRECISION DEFAULT 0.0,
    anomaly_flag BOOLEAN DEFAULT FALSE,
    cause_notes VARCHAR(255) DEFAULT 'Normal consumption profile'
);

-- 4. Groundwater Telemetry
CREATE TABLE IF NOT EXISTS groundwater_data (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    recorded_date VARCHAR(20) NOT NULL,
    depth_meters DOUBLE PRECISION NOT NULL,
    capacity_percent DOUBLE PRECISION NOT NULL,
    recharge_rate DOUBLE PRECISION DEFAULT 0.0
);

-- 5. Risk Predictions
CREATE TABLE IF NOT EXISTS risk_predictions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    flood_risk DOUBLE PRECISION NOT NULL,
    waterlogging_risk DOUBLE PRECISION NOT NULL,
    shortage_risk DOUBLE PRECISION NOT NULL,
    heat_risk DOUBLE PRECISION NOT NULL,
    leak_risk DOUBLE PRECISION NOT NULL,
    drought_risk DOUBLE PRECISION NOT NULL,
    overall_risk DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    confidence_type VARCHAR(30) DEFAULT 'heuristic',
    explanation TEXT
);

-- 6. Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    severity VARCHAR(20) NOT NULL,
    risk_type VARCHAR(50) NOT NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    location_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    cause TEXT NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    recommended_action TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(100)
);

-- 7. Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    explanation TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    linked_risk VARCHAR(50) NOT NULL,
    contributing_factors TEXT,
    suggested_action TEXT NOT NULL,
    estimated_urgency VARCHAR(50) DEFAULT 'Within 24h',
    status VARCHAR(30) DEFAULT 'Pending Review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Historical Events
CREATE TABLE IF NOT EXISTS historical_events (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_date VARCHAR(30) NOT NULL,
    severity_rating DOUBLE PRECISION NOT NULL,
    impact_summary TEXT NOT NULL,
    recorded_loss VARCHAR(100)
);

-- 9. Tanker Resources
CREATE TABLE IF NOT EXISTS tanker_resources (
    id SERIAL PRIMARY KEY,
    base_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    vehicle_reg VARCHAR(30) NOT NULL UNIQUE,
    capacity_liters DOUBLE PRECISION DEFAULT 10000.0,
    status VARCHAR(20) DEFAULT 'Available',
    last_inspection TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Simulation Runs
CREATE TABLE IF NOT EXISTS simulation_runs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    input_params TEXT NOT NULL,
    baseline_scores TEXT NOT NULL,
    simulated_scores TEXT NOT NULL,
    score_deltas TEXT NOT NULL,
    top_factors TEXT,
    recommended_actions_summary TEXT
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanker_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;

-- Public / Anonymous Read Policy for Demonstration
CREATE POLICY "Allow public read access to environmental telemetry"
ON locations FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to alerts"
ON alerts FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to recommendations"
ON recommendations FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to risk predictions"
ON risk_predictions FOR SELECT TO anon, authenticated USING (true);

-- Authenticated Operator Policy for Alert Acknowledgement & Simulation
CREATE POLICY "Allow operators to acknowledge alerts"
ON alerts FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow operators to insert simulation runs"
ON simulation_runs FOR INSERT TO authenticated
WITH CHECK (true);
