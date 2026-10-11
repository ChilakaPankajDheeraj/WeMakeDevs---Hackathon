"""
AquaNex Open-Meteo Weather Service
Integrates the free, open-source Open-Meteo Weather API (CC-BY 4.0).
Provides live weather observations, precipitation telemetry, timeout safeguards,
caching with TTL, and error handling without requiring paid API keys.
Documentation: https://open-meteo.com/en/docs
"""

import logging
import time
import datetime
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger("aquanex.weather_service")

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_CACHE_TTL_SECONDS = 300  # 5 minutes in-memory cache

# In-memory cache: (rounded_lat, rounded_lon) -> (timestamp, data)
_WEATHER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}

# WMO Weather interpretation codes
WMO_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

class WeatherServiceError(Exception):
    """Raised when external Open-Meteo API is unreachable or fails."""
    pass

def clear_weather_cache():
    """Utility to clear cached weather data."""
    _WEATHER_CACHE.clear()

def _get_cache_key(lat: float, lon: float) -> str:
    return f"{round(lat, 3)}:{round(lon, 3)}"

def format_to_ist(obs_raw: str) -> str:
    """Formats raw ISO time string into clean Indian Standard Time (IST)."""
    if not obs_raw:
        now_ist = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        return now_ist.strftime("%Y-%m-%d %I:%M %p IST")
    try:
        clean = obs_raw.replace("T", " ")
        if ":" in clean:
            parts = clean.split(" ")
            d_part = parts[0]
            t_part = parts[1]
            h, m = t_part.split(":")[:2]
            hi = int(h)
            ampm = "AM" if hi < 12 else "PM"
            h12 = hi % 12 or 12
            return f"{d_part} {h12:02d}:{m} {ampm} IST"
    except Exception:
        pass
    return f"{obs_raw} IST"

def parse_open_meteo_response(data: Dict[str, Any], lat: float, lon: float) -> Dict[str, Any]:
    """Parses raw Open-Meteo JSON into AquaNex normalized weather format."""
    current = data.get("current", {})
    daily = data.get("daily", {})

    temp_c = float(current.get("temperature_2m", 25.0))
    humidity = float(current.get("relative_humidity_2m", 60.0))
    rain_current = float(current.get("precipitation", current.get("rain", 0.0)))
    
    # 24h precipitation from daily if available, otherwise current
    precip_24h = rain_current
    if daily and "precipitation_sum" in daily and daily["precipitation_sum"]:
        precip_24h = float(daily["precipitation_sum"][0])

    w_code = int(current.get("weather_code", 0))
    w_desc = WMO_CODE_MAP.get(w_code, "Variable")
    obs_time = current.get("time", "")

    # Rainfall intensity proxy in mm/hr
    rain_intensity = round(rain_current * 4.0 if rain_current > 0 else 0.0, 1)

    return {
        "latitude": lat,
        "longitude": lon,
        "temperature_c": round(temp_c, 1),
        "humidity_percent": round(humidity, 1),
        "rainfall_mm": round(precip_24h, 1),
        "rainfall_intensity": rain_intensity,
        "current_precipitation_mm": round(rain_current, 1),
        "weather_code": w_code,
        "weather_description": w_desc,
        "wind_speed_kmh": float(current.get("wind_speed_10m", 0.0)),
        "observation_time": format_to_ist(obs_time),
        "source": "Open-Meteo Weather API",
        "source_url": "https://open-meteo.com",
        "attribution": "Weather data by Open-Meteo.com (CC-BY 4.0)",
        "is_live": True,
        "data_mode_label": "Live Weather Data (Open-Meteo)",
        "hydrology_status": "Simulated Hydrology Telemetry (Groundwater, Supply, Drainage are localized baselines)"
    }

def fetch_live_weather(
    latitude: float,
    longitude: float,
    timeout_seconds: float = 6.0,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Fetches live weather from Open-Meteo with caching and timeout safeguards.
    Raises WeatherServiceError on network or upstream failures.
    Does NOT silently substitute simulated data!
    """
    cache_key = _get_cache_key(latitude, longitude)
    now = time.time()

    if not force_refresh and cache_key in _WEATHER_CACHE:
        cached_time, cached_data = _WEATHER_CACHE[cache_key]
        if now - cached_time < DEFAULT_CACHE_TTL_SECONDS:
            res = dict(cached_data)
            res["cached"] = True
            return res

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "auto"
    }

    try:
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException as exc:
        logger.error(f"Open-Meteo request timed out ({timeout_seconds}s) for coordinates ({latitude}, {longitude})")
        raise WeatherServiceError(f"Open-Meteo weather service timed out after {timeout_seconds}s.") from exc
    except httpx.HTTPStatusError as exc:
        logger.error(f"Open-Meteo HTTP {exc.response.status_code} error: {exc.response.text}")
        raise WeatherServiceError(f"Open-Meteo API returned HTTP {exc.response.status_code}.") from exc
    except Exception as exc:
        logger.error(f"Failed to connect to Open-Meteo API: {exc}")
        raise WeatherServiceError(f"Unable to reach Open-Meteo weather service: {str(exc)}") from exc

    parsed = parse_open_meteo_response(data, latitude, longitude)
    parsed["cached"] = False
    _WEATHER_CACHE[cache_key] = (now, parsed)
    return parsed
