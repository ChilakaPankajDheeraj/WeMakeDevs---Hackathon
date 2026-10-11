import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudRain,
  Droplets,
  Sun,
  Search,
  ShieldAlert,
  Bell,
  MapPin,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import { useApp } from '../context/AppContext';

export default function DashboardPage() {
  const { weatherMode, setWeatherMeta, fallbackToDemoMode } = useApp();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveWeatherFailed, setLiveWeatherFailed] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLiveWeatherFailed(false);
      const data = await api.getDashboard(weatherMode);
      setDashboard(data);
      if (data) {
        setWeatherMeta({
          source: data.weather_source || 'Deterministic Simulation',
          observation_time: data.weather_observation_time || null,
          hydrology_source: data.hydrology_source || 'AquaNex Hydrology Baseline Simulation'
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      if (weatherMode === 'live') {
        console.warn('Live Weather API unreachable, auto-falling back to Demo mode...');
        setLiveWeatherFailed(true);
        fallbackToDemoMode();
        try {
          const fallbackData = await api.getDashboard('demo');
          setDashboard(fallbackData);
          if (fallbackData) {
            setWeatherMeta({
              source: fallbackData.weather_source || 'Simulated Baseline (Auto-Fallback)',
              observation_time: fallbackData.weather_observation_time || null,
              hydrology_source: fallbackData.hydrology_source || 'AquaNex Hydrology Baseline Simulation'
            });
          }
        } catch (fbErr) {
          setError('Backend connection issue.');
        }
      } else {
        setError('Backend connection unavailable.');
      }
    } finally {
      setLoading(false);
    }
  }, [weatherMode, setWeatherMeta, fallbackToDemoMode]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !dashboard) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton height="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton height="h-44" />
          <LoadingSkeleton height="h-44" />
          <LoadingSkeleton height="h-44" />
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    if (liveWeatherFailed) {
      return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold text-amber-900">
                    Live Weather Telemetry Unavailable
                  </h2>
                  <p className="text-sm text-amber-800 mt-1">
                    {error}
                  </p>
                  <p className="text-xs text-amber-700/90 mt-2 italic">
                    Per AquaNex safety protocols, live telemetry failures are never silently masked with simulated numbers. You can switch to deterministic Prototype Demo Mode to continue exploring the dashboard.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={fallbackToDemoMode}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs"
                  >
                    Switch to Prototype Demo Mode
                  </button>
                  <button
                    onClick={fetchDashboardData}
                    className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition"
                  >
                    Retry Live Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Backend Connection Unavailable"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Live Weather Failure Warning if dashboard still visible */}
      {liveWeatherFailed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Open-Meteo Live API Error:</strong> Telemetry fetch timed out or failed. Simulated fallback is not substituted silently.
            </span>
          </div>
          <button
            onClick={fallbackToDemoMode}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 transition"
          >
            Switch to Prototype Demo Mode
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Command Center
            </h1>
            {weatherMode === 'live' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Weather Data • Open-Meteo API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                Prototype Mode • Simulated Data
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time environmental telemetry synthesis across monitored municipal sectors.
            {weatherMode === 'live' && dashboard?.weather_observation_time && (
              <span className="ml-2 font-mono text-xs text-slate-400">
                (Observation: {dashboard.weather_observation_time})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            Updated: {dashboard?.last_refresh || 'Just now'}
          </span>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Composite Environmental Risk */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Composite Risk
            </span>
            <RiskBadge level={dashboard?.overall_risk_level} score={dashboard?.overall_environmental_risk} size="sm" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {Math.round(dashboard?.overall_environmental_risk || 0)}
              <span className="text-sm font-medium text-slate-400"> / 100</span>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated multi-hazard ceiling based on peak active threats.
            </p>
          </div>
        </div>

        {/* Active & Critical Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Emergency Alerts
            </span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Bell className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-rose-600">
                {dashboard?.critical_alerts_count || 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Critical ({dashboard?.active_alerts_count || 0} Total Active)
              </span>
            </div>
            <Link
              to="/alerts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              <span>Manage alerts</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Regional Water Deficit */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Supply Deficit
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Droplets className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {Math.round((dashboard?.water_deficit_liters || 0) / 1000).toLocaleString()}
              <span className="text-sm font-medium text-slate-400"> kL/day</span>
            </div>
            <p className="text-xs text-slate-500">
              Demand: {Math.round((dashboard?.total_water_demand_liters || 0) / 1000).toLocaleString()} kL vs Supply: {Math.round((dashboard?.total_water_supply_liters || 0) / 1000).toLocaleString()} kL
            </p>
          </div>
        </div>

        {/* Groundwater Storage */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Groundwater Buffer
            </span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {Math.round(dashboard?.avg_groundwater_percent || 0)}%
            </div>
            <p className="text-xs text-slate-500">
              Average aquifer capacity across {dashboard?.locations_monitored_count || 5} sectors.
            </p>
          </div>
        </div>
      </div>

      {/* Hazard Domain Matrix Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Individual Hazard Domains
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Flood Risk */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Flood Risk</h3>
              </div>
              <RiskBadge level={dashboard?.flood_risk_level} score={dashboard?.flood_risk} size="sm" />
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {dashboard?.flood_risk}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Precipitation and soil runoff capacity status.
            </p>
            <Link to="/predictions" className="text-xs font-semibold text-sky-600 hover:underline">
              Inspect forecast &rarr;
            </Link>
          </div>

          {/* Water Shortage */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Water Shortage</h3>
              </div>
              <RiskBadge level={dashboard?.water_shortage_level} score={dashboard?.water_shortage_risk} size="sm" />
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {dashboard?.water_shortage_risk}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Distribution deficit vs consumption demands.
            </p>
            <Link to="/water-intelligence" className="text-xs font-semibold text-teal-600 hover:underline">
              7-Day Balance &rarr;
            </Link>
          </div>

          {/* Heat Stress */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Heat Stress</h3>
              </div>
              <RiskBadge level={dashboard?.heat_risk_level} score={dashboard?.heat_risk} size="sm" />
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {dashboard?.heat_risk}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Calculated feels-like thermal exertion index.
            </p>
            <Link to="/heat-intelligence" className="text-xs font-semibold text-amber-600 hover:underline">
              Thermal Map &rarr;
            </Link>
          </div>

          {/* Leak Detection */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Pipeline Leak</h3>
              </div>
              <RiskBadge level={dashboard?.leak_risk_level} score={dashboard?.leak_risk_score} size="sm" />
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {dashboard?.leak_risk_score}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {dashboard?.leak_anomaly_detected ? (
                <span className="text-rose-600 font-bold">Unexplained night surge detected</span>
              ) : (
                'Night flow variance within nominal limits'
              )}
            </p>
            <Link to="/leak-intelligence" className="text-xs font-semibold text-indigo-600 hover:underline">
              Investigate telemetry &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                7-Day Environmental Risk Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Composite and specific risk evolutions over the observation window.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-sky-600" />
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard?.risk_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="overall" name="Composite Risk" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="flood" name="Flood Risk" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="shortage" name="Shortage Risk" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monitored Locations Table */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Monitored Sector Status
                </h3>
                <p className="text-xs text-slate-500">
                  Select any zone to load localized hydrologic telemetry.
                </p>
              </div>
              <Link to="/risk-map" className="text-xs font-semibold text-sky-600 hover:underline">
                View on Map &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="pb-2.5">Sector</th>
                    <th className="pb-2.5">
                      Rain {weatherMode === 'live' ? <span className="text-emerald-600 font-bold lowercase text-[10px]">(live)</span> : <span className="text-slate-400 font-normal lowercase text-[10px]">(sim)</span>}
                    </th>
                    <th className="pb-2.5">
                      Temp {weatherMode === 'live' ? <span className="text-emerald-600 font-bold lowercase text-[10px]">(live)</span> : <span className="text-slate-400 font-normal lowercase text-[10px]">(sim)</span>}
                    </th>
                    <th className="pb-2.5">
                      Groundwater <span className="text-slate-400 font-normal lowercase text-[10px]">(sim)</span>
                    </th>
                    <th className="pb-2.5 text-right">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(dashboard?.recent_readings || []).map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 font-bold text-slate-800">
                        {loc.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {loc.zone_type}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{loc.rainfall_mm} mm</td>
                      <td className="py-2.5 text-slate-600">{loc.temperature_c}°C</td>
                      <td className="py-2.5 text-slate-600">{loc.groundwater_percent}%</td>
                      <td className="py-2.5 text-right">
                        <RiskBadge level={loc.risk_level} score={loc.overall_risk} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Data Source Provenance Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
              <span>
                {weatherMode === 'live' ? (
                  <>
                    <strong className="text-emerald-700">Live Weather:</strong> Open-Meteo API (CC-BY 4.0). Groundwater, drainage & saturation remain calibrated simulated baselines.
                  </>
                ) : (
                  <>
                    <strong className="text-sky-700">Prototype Mode:</strong> Deterministic seeded hydrologic & environmental simulation.
                  </>
                )}
              </span>
              <span className="font-mono text-[10px] text-slate-400">AquaNex v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
