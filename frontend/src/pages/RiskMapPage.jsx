import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  X,
  Droplets,
  CloudRain,
  Sun,
  Shield,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import RiskBadge, { getRiskColors } from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import { useApp } from '../context/AppContext';

// Helper to create custom color-coded map pins using Leaflet divIcon
function createMarkerIcon(riskLevel, score) {
  let hexColor = '#10b981'; // LOW (Emerald)
  if (riskLevel === 'CRITICAL' || score > 80) hexColor = '#ef4444'; // Red
  else if (riskLevel === 'HIGH' || score > 60) hexColor = '#f97316'; // Orange
  else if (riskLevel === 'MODERATE' || score > 30) hexColor = '#f59e0b'; // Amber

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${hexColor};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          font-family: system-ui;
        ">${Math.round(score)}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function MapViewRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function RiskMapPage() {
  const { weatherMode, fallbackToDemoMode } = useApp();
  const [mapData, setMapData] = useState(null);
  const [selectedLocationDetail, setSelectedLocationDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveWeatherFailed, setLiveWeatherFailed] = useState(false);
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]);

  const loadRiskMap = async () => {
    try {
      setLoading(true);
      setError(null);
      setLiveWeatherFailed(false);
      const res = await api.getRiskMap(weatherMode);
      setMapData(res);
      if (res.locations && res.locations.length > 0) {
        setMapCenter([res.locations[0].latitude, res.locations[0].longitude]);
        // Pre-select first location for detailed view
        fetchLocationDetail(res.locations[0].id);
      }
    } catch (err) {
      console.error('Failed to load risk map data:', err);
      if (weatherMode === 'live') {
        setLiveWeatherFailed(true);
        setError('Open-Meteo Weather API failed or timed out. In Live Weather mode, AquaNex does not silently substitute simulated values.');
      } else {
        setError('Unable to load regional map data from backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationDetail = async (locationId) => {
    try {
      setDetailLoading(true);
      const detail = await api.getLocationDetail(locationId, weatherMode);
      setSelectedLocationDetail(detail);
      setMapCenter([detail.latitude, detail.longitude]);
    } catch (err) {
      console.error('Failed to load location details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadRiskMap();
  }, [weatherMode]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Live Weather Failure Warning */}
      {liveWeatherFailed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Live Telemetry Unavailable:</strong> Could not retrieve real-time atmospheric data from Open-Meteo API. Per system protocol, simulated numbers are not silently injected.
            </span>
          </div>
          <button
            onClick={fallbackToDemoMode}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 transition shadow-xs"
          >
            Switch to Prototype Demo Mode
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Interactive Risk Map
            </h1>
            {weatherMode === 'live' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Weather Data • Open-Meteo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                Prototype Mode • Simulated Data
              </span>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              OpenStreetMap Tiles
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Spatial monitoring of flood, shortage, heat, and infrastructure threats across municipal zones.
          </p>
        </div>

        <button
          onClick={loadRiskMap}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
          Refresh Map
        </button>
      </div>

      {/* Notice Banner */}
      <div className="rounded-xl bg-slate-900 text-slate-300 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-sky-400 shrink-0" />
          <span>
            <strong>Simulation Sandbox:</strong> Pins indicate demo geographic centroids. Weather calculations by AquaNex engine. Maps &copy; OpenStreetMap contributors. Weather telemetry by Open-Meteo (CC-BY 4.0). Not official emergency warnings.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[11px] text-sky-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
          EPSG:3857
        </span>
      </div>

      {error ? (
        liveWeatherFailed ? (
          <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
            <div className="max-w-md mx-auto">
              <h2 className="text-lg font-bold text-amber-900">Live Weather Telemetry Offline</h2>
              <p className="text-xs text-amber-800 mt-1">{error}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={fallbackToDemoMode}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition shadow-xs"
              >
                Switch to Prototype Demo Mode
              </button>
              <button
                onClick={loadRiskMap}
                className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition"
              >
                Retry Live Fetch
              </button>
            </div>
          </div>
        ) : (
          <ErrorState message={error} onRetry={loadRiskMap} />
        )
      ) : loading ? (
        <LoadingSkeleton height="h-[600px]" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Container (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[540px] sm:h-[620px] relative">
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <MapViewRecenter center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {(mapData?.locations || []).map((loc) => (
                <Marker
                  key={loc.id}
                  position={[loc.latitude, loc.longitude]}
                  icon={createMarkerIcon(loc.risk_level, loc.overall_risk)}
                  eventHandlers={{
                    click: () => fetchLocationDetail(loc.id),
                  }}
                >
                  <Popup>
                    <div className="p-1 font-sans text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">{loc.name}</span>
                        {weatherMode === 'live' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Live Weather
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                            Simulated
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500">{loc.zone_type}</div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-1.5 rounded">
                        <span>Rain: <strong>{loc.rainfall_mm} mm</strong></span>
                        <span>Temp: <strong>{loc.temperature_c}°C</strong></span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span>Risk Score:</span>
                        <RiskBadge level={loc.risk_level} score={loc.overall_risk} size="sm" />
                      </div>
                      <button
                        onClick={() => fetchLocationDetail(loc.id)}
                        className="w-full text-center bg-sky-600 text-white font-bold py-1 px-2 rounded hover:bg-sky-500 transition"
                      >
                        Inspect Sector
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Floating Map Legend */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur rounded-xl p-3 shadow-md border border-slate-200 text-xs space-y-1.5 pointer-events-auto">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                Risk Levels
              </span>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Low (0-30)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-slate-600">Moderate (31-60)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-slate-600">High (61-80)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-slate-600">Critical (81-100)</span>
              </div>
            </div>
          </div>

          {/* Location Detail Panel (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            {detailLoading ? (
              <LoadingSkeleton height="h-96" />
            ) : selectedLocationDetail ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-400">
                      Monitored Sector
                    </span>
                    <RiskBadge
                      level={selectedLocationDetail.risks?.risk_level}
                      score={selectedLocationDetail.risks?.overall_risk}
                    />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {selectedLocationDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedLocationDetail.zone_type} • Population: {selectedLocationDetail.population.toLocaleString()}
                  </p>
                  {weatherMode === 'live' && selectedLocationDetail.weather_observation_time && (
                    <p className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                      Observed: {selectedLocationDetail.weather_observation_time}
                    </p>
                  )}
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>Rainfall (24h)</span>
                      <span className={weatherMode === 'live' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {weatherMode === 'live' ? 'Open-Meteo' : 'Sim'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedLocationDetail.rainfall_mm} mm
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>Temperature</span>
                      <span className={weatherMode === 'live' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {weatherMode === 'live' ? 'Open-Meteo' : 'Sim'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedLocationDetail.temperature_c}°C
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>Groundwater</span>
                      <span className="text-slate-400">Simulated</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedLocationDetail.groundwater_percent}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>Drainage Cap</span>
                      <span className="text-slate-400">Simulated</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedLocationDetail.drainage_capacity_percent}%
                    </span>
                  </div>
                </div>

                {/* Risk Domain Scores */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Hazard Breakdown
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Flood Risk:</span>
                      <RiskBadge level={null} score={selectedLocationDetail.risks?.flood_risk} size="sm" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Water Shortage:</span>
                      <RiskBadge level={null} score={selectedLocationDetail.risks?.shortage_risk} size="sm" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Heat Stress:</span>
                      <RiskBadge level={null} score={selectedLocationDetail.risks?.heat_risk} size="sm" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Pipeline Leak:</span>
                      <RiskBadge level={null} score={selectedLocationDetail.risks?.leak_risk} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs">
                  <span className="font-bold text-sky-900 block mb-1">AI Explanation:</span>
                  <p className="text-sky-800 leading-relaxed">
                    {selectedLocationDetail.risks?.summary_explanation}
                  </p>
                </div>

                {/* Recommended Priority Action */}
                {selectedLocationDetail.recommendations && selectedLocationDetail.recommendations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Recommended Action
                    </span>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-slate-900">
                        {selectedLocationDetail.recommendations[0].title}
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {selectedLocationDetail.recommendations[0].suggested_action}
                      </p>
                    </div>
                  </div>
                )}

                {/* Data Source Provenance */}
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                  <div>
                    {weatherMode === 'live' ? (
                      <span className="text-emerald-700 font-semibold">
                        ● Live Weather: Open-Meteo API (CC-BY 4.0)
                      </span>
                    ) : (
                      <span className="text-sky-700 font-semibold">
                        ● Prototype Mode: Deterministic seeded values
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Hydrology & drainage: AquaNex baseline simulation.
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">
                Click any map marker to view sector risk intelligence.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
