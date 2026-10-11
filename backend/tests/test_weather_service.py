import pytest
from unittest.mock import patch, MagicMock
import httpx
from fastapi.testclient import TestClient
from backend.main import app
from backend.weather_service import (
    parse_open_meteo_response,
    fetch_live_weather,
    WeatherServiceError,
    clear_weather_cache
)

client = TestClient(app)

MOCK_OPEN_METEO_JSON = {
    "latitude": 13.08,
    "longitude": 80.27,
    "generationtime_ms": 0.05,
    "current": {
        "time": "2026-10-11T12:00",
        "temperature_2m": 33.4,
        "relative_humidity_2m": 68.0,
        "precipitation": 2.5,
        "rain": 2.5,
        "weather_code": 61,
        "wind_speed_10m": 14.2
    },
    "daily": {
        "weather_code": [61],
        "temperature_2m_max": [35.0],
        "temperature_2m_min": [27.0],
        "precipitation_sum": [18.4]
    }
}

@pytest.fixture(autouse=True)
def clean_cache():
    clear_weather_cache()
    # Reset mode to demo
    client.post("/api/weather/mode", json={"mode": "demo"})
    yield
    clear_weather_cache()
    client.post("/api/weather/mode", json={"mode": "demo"})

def test_parse_open_meteo_response():
    parsed = parse_open_meteo_response(MOCK_OPEN_METEO_JSON, 13.08, 80.27)
    assert parsed["temperature_c"] == 33.4
    assert parsed["humidity_percent"] == 68.0
    assert parsed["rainfall_mm"] == 18.4
    assert parsed["current_precipitation_mm"] == 2.5
    assert parsed["weather_description"] == "Slight rain"
    assert parsed["source"] == "Open-Meteo Weather API"
    assert parsed["is_live"] is True
    assert "Open-Meteo.com" in parsed["attribution"]

@patch("httpx.Client.get")
def test_fetch_live_weather_success(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = MOCK_OPEN_METEO_JSON
    mock_resp.raise_for_status = MagicMock()
    mock_get.return_value = mock_resp

    data = fetch_live_weather(13.08, 80.27)
    assert data["temperature_c"] == 33.4
    assert data["is_live"] is True
    assert data["cached"] is False

    # Second call should use cache
    data2 = fetch_live_weather(13.08, 80.27)
    assert data2["cached"] is True
    assert mock_get.call_count == 1

@patch("httpx.Client.get")
def test_fetch_live_weather_timeout(mock_get):
    mock_get.side_effect = httpx.TimeoutException("Connection timed out")

    with pytest.raises(WeatherServiceError) as exc_info:
        fetch_live_weather(13.08, 80.27, timeout_seconds=1.0)
    assert "timed out" in str(exc_info.value).lower()

@patch("httpx.Client.get")
def test_fetch_live_weather_http_error(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"
    mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError("500 Error", request=MagicMock(), response=mock_resp)
    mock_get.return_value = mock_resp

    with pytest.raises(WeatherServiceError) as exc_info:
        fetch_live_weather(13.08, 80.27)
    assert "500" in str(exc_info.value)

def test_weather_mode_endpoints():
    # Initial mode check
    get_res = client.get("/api/weather/mode")
    assert get_res.status_code == 200
    assert get_res.json()["mode"] == "demo"

    # Switch to live
    post_res = client.post("/api/weather/mode", json={"mode": "live"})
    assert post_res.status_code == 200
    assert post_res.json()["mode"] == "live"
    assert "Open-Meteo" in post_res.json()["source"]

    # Invalid mode rejection
    invalid_res = client.post("/api/weather/mode", json={"mode": "unknown"})
    assert invalid_res.status_code == 400

@patch("backend.main.fetch_live_weather")
def test_live_weather_endpoint_success(mock_fetch):
    mock_fetch.return_value = parse_open_meteo_response(MOCK_OPEN_METEO_JSON, 13.08, 80.27)
    res = client.get("/api/live-weather/1")
    assert res.status_code == 200
    data = res.json()
    assert data["location_name"] is not None
    assert data["temperature_c"] == 33.4
    assert data["source"] == "Open-Meteo Weather API"
    assert data["is_live"] is True

@patch("backend.main.fetch_live_weather")
def test_live_weather_endpoint_failure(mock_fetch):
    mock_fetch.side_effect = WeatherServiceError("Open-Meteo DNS resolution failed")
    res = client.get("/api/live-weather/1")
    assert res.status_code == 503
    assert "Please switch to Demo Mode" in res.json()["detail"]

@patch("backend.main.fetch_live_weather")
def test_dashboard_live_mode_and_fallback(mock_fetch):
    # Live mode with mock
    mock_fetch.return_value = parse_open_meteo_response(MOCK_OPEN_METEO_JSON, 13.08, 80.27)
    res_live = client.get("/api/dashboard?mode=live")
    assert res_live.status_code == 200
    assert res_live.json()["weather_mode"] == "live"
    assert "Open-Meteo" in res_live.json()["weather_source"]

    # Demo mode operates normally without calling external service
    mock_fetch.side_effect = WeatherServiceError("Network is down")
    res_demo = client.get("/api/dashboard?mode=demo")
    assert res_demo.status_code == 200
    assert res_demo.json()["weather_mode"] == "demo"
    assert "Simulated" in res_demo.json()["data_mode"]

    # In live mode when service fails, HTTP 503 is returned with prompt to switch to demo mode
    res_live_fail = client.get("/api/dashboard?mode=live")
    assert res_live_fail.status_code == 503
    assert "Please switch to Demo Mode" in res_live_fail.json()["detail"]
