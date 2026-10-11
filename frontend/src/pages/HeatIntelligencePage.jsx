import React, { useState, useEffect } from 'react';
import {
  SunMedium,
  Droplet,
  Thermometer,
  ShieldAlert,
  Clock,
  Heart,
  RefreshCw,
  Info,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function HeatIntelligencePage() {
  const { selectedLocationId } = useApp();
  const [heatData, setHeatData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHeatData = async () => {
    try {
      setLoading(true);
      const res = await api.getHeatRisk(selectedLocationId);
      setHeatData(res);
    } catch (err) {
      console.error('Failed to load heat intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatData();
  }, [selectedLocationId]);

  if (loading && !heatData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton height="h-32" />
        <LoadingSkeleton height="h-96" />
      </div>
    );
  }

  const score = heatData?.heat_risk_score || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Heat Stress Intelligence
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Thermal Exertion Index
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Predictive biometric and environmental heat indices evaluating public health exposure risks.
          </p>
        </div>

        <button
          onClick={loadHeatData}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
          Refresh Thermal Data
        </button>
      </div>

      {/* Main Thermal Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Gauge & Readings (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sector Location
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {heatData?.location_name}
              </h3>
            </div>
            <RiskBadge level={heatData?.risk_level} score={score} size="md" />
          </div>

          {/* Visual Gauge Representation */}
          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="inline-block relative">
              <svg className="w-48 h-28 overflow-visible" viewBox="0 0 200 110">
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={score > 80 ? '#ef4444' : score > 60 ? '#f97316' : score > 30 ? '#f59e0b' : '#10b981'}
                  strokeWidth="16"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * (score / 100))}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-x-0 bottom-2 text-center">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {Math.round(score)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Heat Stress Score
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Status: <strong className="text-slate-800">{heatData?.risk_level} Risk Category</strong>
            </p>
          </div>

          {/* Environmental Readout Triplet */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Thermometer className="h-4 w-4 text-rose-500 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Air Temp</span>
              <span className="text-base font-black text-slate-900">
                {heatData?.temperature_c}°C
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Droplet className="h-4 w-4 text-sky-500 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Humidity</span>
              <span className="text-base font-black text-slate-900">
                {heatData?.humidity_percent}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <SunMedium className="h-4 w-4 text-amber-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-amber-800 block uppercase">Feels Like</span>
              <span className="text-base font-black text-amber-900">
                {heatData?.feels_like_c}°C
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Calculation Model:</strong> Uses NOAA Rothfusz regression heat index approximation combining dry-bulb ambient air temperature and relative humidity.
          </div>
        </div>

        {/* Right Column: Actions & Contributing Factors (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recommended Interventions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Health & Public Safety
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Heat Mitigation Action Protocols
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {heatData?.prediction_window || 'Next 24h'}
              </span>
            </div>

            <div className="space-y-3">
              {(heatData?.recommended_actions || []).map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-950 font-medium"
                >
                  <span className="flex h-5 w-5 rounded-full bg-amber-200 text-amber-800 font-bold text-[11px] items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contributing Telemetry Factors */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Thermal Contributing Drivers
            </h3>
            <div className="space-y-2">
              {(heatData?.contributing_factors || []).map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-800">{factor.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-600">
                      {factor.value} {factor.unit}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        factor.impact === 'Elevating'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {factor.impact} ({factor.weight_pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
