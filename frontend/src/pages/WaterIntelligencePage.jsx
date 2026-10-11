import React, { useState, useEffect } from 'react';
import {
  Droplets,
  TrendingDown,
  Activity,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function WaterIntelligencePage() {
  const { selectedLocationId } = useApp();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getWaterForecast(selectedLocationId);
      setForecastData(res);
    } catch (err) {
      console.error('Failed to load water forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [selectedLocationId]);

  if (loading && !forecastData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton height="h-32" />
        <LoadingSkeleton height="h-96" />
      </div>
    );
  }

  const days = forecastData?.forecast_days || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Water Intelligence & 7-Day Balance
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
              Demand vs Supply Forecast
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Predictive modeling of municipal distribution margins, acute shortage volumes, and aquifer drawdown.
          </p>
        </div>

        <button
          onClick={loadForecast}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
          Refresh Forecast
        </button>
      </div>

      {/* AI Insight Summary Banner */}
      <div className="rounded-2xl bg-teal-50 border border-teal-200/80 p-5 shadow-xs flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
          <Droplets className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-teal-950">
            Water Balance Forecasting Insight ({forecastData?.location_name})
          </h3>
          <p className="text-sm text-teal-800 leading-relaxed font-medium">
            {forecastData?.insight_summary}
          </p>
          <span className="inline-block text-[11px] text-teal-700/80 font-mono mt-1">
            Simulated 7-Day Total Deficit: {Math.round(forecastData?.total_shortage_projected_liters || 0).toLocaleString()} Liters
          </span>
        </div>
      </div>

      {/* Primary Chart: Demand vs Supply Over 7 Days */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              7-Day Projected Demand vs Bulk Supply
            </h2>
            <p className="text-xs text-slate-500">
              Daily distribution capacity (L/day) juxtaposed with anticipated consumer load.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Peak Deficit: {forecastData?.peak_shortage_day}
          </span>
        </div>

        <div className="h-72 sm:h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day_name" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '0.75rem',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value) => `${Number(value).toLocaleString()} L`}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="shortage_liters"
                name="Projected Shortage Deficit"
                fill="#fca5a5"
                stroke="#ef4444"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="demand_liters"
                name="Projected Demand (L)"
                stroke="#0284c7"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="supply_liters"
                name="Available Supply (L)"
                stroke="#10b981"
                strokeWidth={3}
                strokeDasharray="4 4"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Daily Projection Schedule
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-white border transition shadow-xs flex flex-col justify-between ${
                day.shortage_liters > 0
                  ? 'border-rose-200 hover:border-rose-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">{day.day_name}</span>
                  <RiskBadge level={day.risk_level} score={day.shortage_risk} size="sm" />
                </div>
                <span className="text-[11px] text-slate-400 block mb-3 font-mono">
                  {day.date}
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Demand:</span>
                    <span className="font-semibold text-slate-800">
                      {Math.round(day.demand_liters / 1000)}k L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supply:</span>
                    <span className="font-semibold text-slate-800">
                      {Math.round(day.supply_liters / 1000)}k L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aquifer:</span>
                    <span className="font-semibold text-slate-800">
                      {day.groundwater_percent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Deficit
                </span>
                <span
                  className={`text-sm font-bold ${
                    day.shortage_liters > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {day.shortage_liters > 0
                    ? `-${Math.round(day.shortage_liters).toLocaleString()} L`
                    : 'Balanced'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
