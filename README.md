# AQUANEX — AI Water & Climate Early Warning System
> **Tagline:** *Predict. Protect. Act.*  
> **Mission:** Transforming environmental signals into intelligent action.

AquaNex is an AI-powered environmental intelligence and decision-support platform engineered for municipalities, emergency response agencies, water utilities, and infrastructure planners. Rather than presenting passive charts, AquaNex bridges the gap **from prediction to action**—explaining what is happening, why risks are elevated, which factors contribute most, what could happen next, and which operational interventions to prioritize.

---

## 🌟 Key Features

1. **Command Center (Multi-Hazard Dashboard):** Synthesizes composite environmental risks, active triage alerts, net municipal water deficits, and 7-day risk trajectories.
2. **Interactive Risk Map (Leaflet / OpenStreetMap):** Spatial monitoring of monitored sectors with color-coded risk pins (Low, Moderate, High, Critical) and an instant sector intelligence drawer.
3. **Multi-Hazard Prediction Engine:** Deep dive into 6 distinct risk domains with transparent weighting models and bounded 0–100 scores:
   - 🌊 **Flood Risk:** Rainfall intensity, soil saturation runoff, drainage bottlenecks.
   - 🏙️ **Urban Waterlogging Risk:** Topographic low-points and storm drain efficiency.
   - 🚰 **Water Shortage Risk:** Net supply-demand deficits and aquifer depletion.
   - ☀️ **Heat Stress Intelligence:** NOAA-aligned feels-like index and physiological strain.
   - 🔍 **Pipeline Leak Intelligence:** Statistical night-flow excess anomaly detection.
   - 🌾 **Drought Vulnerability:** Multi-week precipitation deficits and groundwater drawdown.
4. **Water Intelligence & 7-Day Balance:** Visualized line and area forecast of daily demand vs bulk supply, projected shortage volumes, and groundwater trends.
5. **AI Decision & Recommendation Engine:** Prioritized, categorized operational steps (Infrastructure, Emergency Response, Resource Allocation, Public Safety) with human-in-the-loop verification mandates.
6. **What-If Climate Scenario Simulator:** Interactive slider controls (Rainfall, Temp, Saturation, Drainage, Demand, Supply) sending parameters to the backend risk engine and reporting baseline vs simulated differentials.
7. **Tanker Fleet Dispatch Optimizer:** Deterministic, priority-weighted constrained allocation algorithm dispatching municipal water trucks to acute shortage sectors without negative allocations or exceeding available fleet counts.
8. **Emergency Alert Center:** Persistent triage alerts in the database with one-click operator acknowledgment workflows.
9. **Progressive Web App (PWA):** Installable on mobile and desktop devices with offline caching and standalone display mode.
10. **Dual-Mode Database Architecture:** Runs locally out-of-the-box using SQLite, with seamless Supabase PostgreSQL cloud migration capability.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Precipitation & Weather Telemetry] --> E[FastAPI Backend Engine]
    B[Water Flow & Smart Meter Telemetry] --> E
    C[Piezometric Groundwater Data] --> E
    D[Urban Topography & Drainage Data] --> E

    subgraph "Backend Core (Python 3.11+ / FastAPI)"
        E --> F[Deterministic Risk Engine]
        F --> G[Explainability & Prediction Engine]
        F --> H[Recommendation Engine]
        E --> I[Leak Anomaly Detection]
        E --> J[Tanker Fleet Optimizer]
        E --> K[Dual Database Adapter Layer]
    end

    subgraph "Persistence"
        K --> L[(SQLite Local Mode)]
        K --> M[(Supabase PostgreSQL + RLS)]
    end

    subgraph "Frontend Command Center (React 19 + Vite + Tailwind)"
        E <--> N[REST API Client / Axios]
        N --> O[Command Center Overview]
        N --> P[Interactive Leaflet Risk Map]
        N --> Q[What-If Climate Simulator]
        N --> R[Water Intelligence & Forecasts]
        N --> S[Leak & Heat Intelligence]
        N --> T[Emergency Alert Triage]
    end
```

---

## 💻 Technology Stack

- **Frontend:**
  - React 19 + JSX
  - Vite 8 (Ultra-fast build tooling)
  - Tailwind CSS (Curated color tokens, accessible risk palettes)
  - Recharts (Composed charts, bar charts, trend lines)
  - Leaflet & React-Leaflet (OpenStreetMap spatial visualization)
  - Lucide React (Clean icon system)
  - Vite PWA Plugin (`vite-plugin-pwa`, Workbox service worker)
  - Axios + React Router DOM
- **Backend:**
  - Python 3.11+
  - FastAPI + Uvicorn ASGI
  - Pydantic v2 (Strict request/response validation and numeric bounds)
  - SQLAlchemy 2.0 (ORM database repository)
  - NumPy, Pandas, Scikit-learn
  - Pytest + HTTPX TestClient
- **Database:**
  - **Local Development:** SQLite (`aquanex.db`) — zero external accounts required.
  - **Cloud Production:** Supabase PostgreSQL with Row Level Security (RLS).

---

## 📂 Project Structure

```
aquanex/
├── frontend/
│   ├── public/
│   │   ├── icons/                  # 192x192 & 512x512 SVG brand marks
│   │   ├── favicon.svg             # Droplet brand favicon
│   │   └── manifest.webmanifest    # PWA configuration
│   ├── src/
│   │   ├── components/             # RiskBadge, Navbar, Sidebar, ErrorState, Skeletons
│   │   ├── context/                # Global AppContext (telemetry, location, connection)
│   │   ├── pages/                  # Dashboard, RiskMap, Simulator, Predictions, Tanker, etc.
│   │   ├── services/               # Axios API client (api.js)
│   │   ├── App.jsx                 # Router layout and PWA install prompt
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind CSS directives
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── backend/
│   ├── main.py                     # FastAPI REST server & lifespan startup
│   ├── config.py                   # Environment settings & Supabase toggle
│   ├── database.py                 # SQLAlchemy engine, session maker, health checks
│   ├── models.py                   # SQLAlchemy schema models
│   ├── schemas.py                  # Pydantic v2 request & response schemas
│   ├── risk_engine.py              # Bounded [0, 100] deterministic risk calculations
│   ├── prediction_engine.py        # 7-day water forecasts, explainability, simulation logic
│   ├── recommendation_engine.py    # Actionable operational intervention generator
│   ├── leak_detection.py           # Statistical night flow anomaly detection
│   ├── tanker_optimizer.py         # Priority-weighted constrained fleet solver
│   ├── seed_data.py                # Idempotent demo dataset seeder
│   ├── auth.py                     # Local demo bypass & Supabase JWT verification
│   ├── supabase_schema.sql         # Supabase PostgreSQL schema & RLS policies
│   ├── requirements.txt            # Python dependencies
│   └── tests/
│       └── test_api.py             # Pytest automated test suite (16 tests)
├── data/
│   └── README.md                   # Telemetry schemas documentation
├── .env.example                    # Environment template
├── .gitignore
├── README.md                       # Comprehensive guide
├── start.bat                       # Windows 1-command startup
└── start.sh                        # macOS / Linux 1-command startup
```

---

## ⚡ Quick Start (One-Command Startup)

### Windows
Double-click `start.bat` or run in terminal:
```cmd
start.bat
```
*The script automatically verifies Python & Node.js, configures the virtual environment, installs dependencies, initializes the local SQLite database, seeds idempotent demonstration data, launches FastAPI on port 8000, launches Vite on port 5173, and opens your browser.*

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

---

## 🔧 Manual Setup Instructions

### 1. Backend Setup
```bash
# From workspace root:
python -m venv venv

# Activate venv:
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies:
pip install -r backend/requirements.txt

# Run automated tests:
python -m pytest backend/tests/test_api.py -v

# Start FastAPI server:
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Root: [http://localhost:8000](http://localhost:8000)
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup
```bash
# From workspace root:
cd frontend

# Install dependencies:
npm install --legacy-peer-deps

# Start Vite dev server:
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 🌐 Supabase Cloud Configuration (Optional)

AquaNex works in **Local SQLite Mode** out of the box. To connect to Supabase:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and run the script located in `backend/supabase_schema.sql`.
3. In your `.env` file (copied from `.env.example`), update:
   ```env
   DATABASE_MODE=supabase
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
   SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
   SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
   ```
4. Restart the backend. The API will automatically detect Supabase mode and report connection status under `/api/system-status`.

---

---

## 🌐 Free External Data Integration & Maps

AquaNex integrates real external weather and spatial telemetry without requiring paid API keys:

### 1. Leaflet & OpenStreetMap (Spatial Telemetry)
- **Zero Paid Map API Keys:** Employs Leaflet and open tile sets (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Attribution Compliance:** Fully complies with OpenStreetMap Foundation tile usage and attribution policies (`© OpenStreetMap contributors`).
- **Calculated Risk Pins:** Map markers are dynamically color-coded by AquaNex's bounded [0, 100] multi-hazard engine (Low: 0-30, Moderate: 31-60, High: 61-80, Critical: 81-100).
- **Error & Loading States:** Built-in loading skeletons, map recentering animation, and fallback error states if tiles or backend endpoints are unreachable.

### 2. Open-Meteo API (Live Weather Telemetry)
- **Backend Architecture:** All external calls are isolated in `backend/weather_service.py`. No credentials or API keys are ever leaked or required in frontend code.
- **Atmospheric Parameters:** Fetches real-time temperature, apparent temperature, relative humidity, precipitation, and WMO weather condition codes using configurable coordinates for each monitored sector.
- **Resilience Safeguards:** 
  - **In-Memory Caching:** 5-minute TTL cache per coordinates minimizes outbound requests.
  - **Timeout Safeguard:** 6.0-second request timeout prevents thread stalling.
  - **Graceful Error Propagation:** Raises typed `WeatherServiceError` returning HTTP 503 rather than corrupting risk scores.
- **Attribution:** Sourced under Open-Meteo's **Creative Commons Attribution 4.0 International (CC-BY 4.0)** license.

---

## 🔀 Data Source Modes & Provenance Integrity

AquaNex implements two explicit, user-toggleable data modes via the navigation bar:

| Feature | Prototype Demo Mode | Live Weather Mode |
|---|---|---|
| **Label** | `Prototype Mode • Simulated Data` | `Live Weather Data • Open-Meteo` |
| **Atmospheric Telemetry** | Deterministic seeded historical baseline | Real-time Open-Meteo API response |
| **Hydrological Telemetry** | Seeded aquifer & drainage baseline | Localized simulated baseline *(Open-Meteo does not provide groundwater)* |
| **Observation Timestamp** | N/A (Simulation timestamp) | Real-time ISO-8601 observation timestamp |
| **Error Handling** | N/A (Deterministic local DB) | Clear 503 error banner + explicit option to switch to Demo Mode |
| **Silent Substitution** | Disabled | **Strictly prohibited** — failed live calls are never silently replaced with dummy values |

### ⚠️ Critical Data Limitations
1. **Weather Forecasts vs Official Warnings:** Open-Meteo atmospheric forecasts do not represent official civil defense or municipal evacuation warnings.
2. **Atmospheric vs Hydrological Boundaries:** Open-Meteo provides atmospheric data (precipitation, temperature, humidity, wind). It does **not** provide actual groundwater levels, pipeline pressure, drainage capacity, or municipal supply. These measurements remain explicitly labelled as **Simulated Hydrology Baseline**.

---

## 🧪 Automated Testing

AquaNex includes a 24-test automated pytest suite covering endpoints, boundary thresholds, risk sensitivity, tanker allocation constraints, alert persistence, and Open-Meteo parsing & error handling:
```bash
.\venv\Scripts\python -m pytest backend/tests -v
```
**Test Results:** `24 passed in 2.36s`
- `test_parse_open_meteo_response`: Validates JSON schema extraction and WMO code mapping.
- `test_fetch_live_weather_success`: Verifies mock API response parsing and metric binding.
- `test_fetch_live_weather_timeout`: Asserts that request timeouts raise typed `WeatherServiceError`.
- `test_fetch_live_weather_http_error`: Verifies 5xx/4xx upstream errors are properly caught.
- `test_weather_mode_endpoints`: Tests GET and POST `/api/weather/mode` transitions.
- `test_live_weather_endpoint_success`: Validates live telemetry endpoint responses.
- `test_live_weather_endpoint_failure`: Asserts HTTP 503 Service Unavailable on external failure.
- `test_dashboard_live_mode_and_fallback`: Verifies live risk recalculation and explicit error propagation.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, database connection, and risk engine status |
| `GET` | `/api/system-status` | Comprehensive status, DB mode, and alert counts |
| `GET` | `/api/weather/mode` | Returns current weather data mode (`demo` or `live`) |
| `POST` | `/api/weather/mode` | Sets weather data mode (`{"mode": "demo"}` or `{"mode": "live"}`) |
| `GET` | `/api/live-weather/{id}` | Fetches real-time Open-Meteo telemetry for sector location |
| `GET` | `/api/dashboard?mode={mode}` | Multi-hazard overview and trends (supports `live` vs `demo`) |
| `GET` | `/api/risk-map?mode={mode}` | Coordinates and risk scores for sectors (supports `live` vs `demo`) |
| `GET` | `/api/location/{id}?mode={mode}` | Sector detail and telemetry (supports `live` vs `demo`) |
| `GET` | `/api/alerts` | Filterable emergency alerts (`?status=ACTIVE&severity=CRITICAL`) |
| `POST` | `/api/alerts/{id}/acknowledge` | Persists operator alert acknowledgment |
| `POST` | `/api/predict` | Evaluates arbitrary input vectors through risk engine |
| `POST` | `/api/explain` | Transparent heuristic breakdown of hazard drivers |
| `POST` | `/api/simulate` | Climate what-if scenario calculator and delta evaluator |
| `GET` | `/api/water-forecast` | 7-day water demand vs supply forecast and deficit volumes |
| `GET` | `/api/heat-risk` | Temperature, humidity, and feels-like index |
| `POST` | `/api/leak-detection` | Statistical night flow anomaly diagnosis and causes |
| `POST` | `/api/tanker-optimize` | Priority-weighted tanker fleet allocation solver |
| `GET` | `/api/recommendations` | Decision-support operational action recommendations |

---

## 📱 Progressive Web App (PWA)

AquaNex is fully configured as a PWA:
- **Manifest:** Standalone display, theme color `#0284c7`, branded SVG icons.
- **Offline Guard:** Displays network status warnings if connectivity drops, preserving cached user interactions.
- **Install Prompt:** Responsive floating install prompt for Android, iOS Safari, and Chromium desktop.

---

## ⚠️ Prototype Disclaimer & Safety Mandate

> **Prototype Mode • Simulated Data**  
> AquaNex is a hackathon decision-support prototype. Atmospheric measurements in Live Weather Mode are retrieved from Open-Meteo API under CC-BY 4.0. Hydro-geological metrics (groundwater, drainage, pipe networks) are localized simulated baselines. This system does not issue official public evacuation orders or civil defense warnings. Recommendations must be verified by certified municipal authorities prior to operational execution.

---

## 👥 Authors & License
Developed for the Climate & Water Resilience Hackathon. Open-source under the MIT License.
Weather telemetry provided by [Open-Meteo.com](https://open-meteo.com) under CC-BY 4.0.
Maps © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors under ODbL.

