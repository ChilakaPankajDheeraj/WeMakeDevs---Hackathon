# AquaNex Data Directory

This directory contains simulated environmental datasets, baseline hydrologic vectors, and historical climate event logs used by the AquaNex AI early-warning engine.

## Data Schemas

1. **locations**: Geographic coordinates, population demographics, baseline drainage capacities, soil saturation indices, and historical hazard vulnerability indices.
2. **weather_data**: 24h accumulated rainfall (mm), peak intensity (mm/h), ambient temperature (°C), relative humidity (%), and calculated feels-like temperature.
3. **water_consumption**: Daily diurnal consumption records, metered volume, excess night flow anomalies, and anomaly classification.
4. **groundwater_data**: Aquifer depth (m), percentage capacity (%), and seasonal recharge rates.
5. **tanker_resources**: Municipal emergency water transport assets, registration identifiers, and delivery capacities.

All data is generated deterministically in `backend/seed_data.py`.
