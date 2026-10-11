import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Droplets,
  Sun,
  Search,
  Activity,
  Layers,
  Shield,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function PredictionsPage() {
  const { selectedLocationId, locationsList } = useApp();
  const [locationDetail, setLocationDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flood');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getLocationDetail(selectedLocationId || 1);
        setLocationDetail(data);
      } catch (err) {
        console.error('Failed to load predictions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedLocationId]);

  if (loading && !locationDetail) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton height="h-28" />
        <LoadingSkeleton height="h-96" />
      </div>
    );
  }

  const details = locationDetail?.risk_details || {};
  const currentRisk = details[activeTab] || {
    score: 0,
    risk_level: 'LOW',
    explanation: 'Awaiting telemetry calculation.',
    contributing_factors: [],
    actions: [],
    prediction_horizon: 'Next 24 Hours'
  };

  const tabs = [
    { id: 'flood', label: 'Flood Risk', icon: CloudRain, score: details.flood?.score },
    { id: 'waterlogging', label: 'Waterlogging', icon: Layers, score: details.waterlogging?.score },
    { id: 'shortage', label: 'Water Shortage', icon: Droplets, score: details.shortage?.score },
    { id: 'heat', label: 'Heat Stress', icon: Sun, score: details.heat?.score },
    { id: 'leak', label: 'Pipeline Leak', icon: Search, score: details.leak?.score },
    { id: 'drought', label: 'Drought Vulnerability', icon: Activity, score: details.drought?.score },
  ];

  // Bar chart data for contributing factors
  const factorChartData = (currentRisk.contributing_factors || []).map((f) => ({
    name: f.name.length > 20 ? f.name.substring(0, 18) + '...' : f.name,
    weight: f.weight_pct,
    value: f.value,
    unit: f.unit,
    impact: f.impact,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Multi-Hazard Risk Predictions
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Deterministic AI Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Deep dive into predictive calculations, transparent weighting models, and immediate response protocols.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
          Target Sector: <strong className="text-slate-900">{locationDetail?.name}</strong>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition text-xs font-bold gap-1 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.score !== undefined && (
                <span className="font-mono text-[11px] opacity-80">
                  {Math.round(tab.score)}/100
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Focus Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Score & Factors (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Predicted Hazard Severity
              </span>
              <h2 className="text-2xl font-black text-slate-900 capitalize mt-0.5">
                {activeTab} Risk Analysis
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level={currentRisk.risk_level} score={currentRisk.score} size="lg" />
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-sky-600" />
              <span>What Is Happening & Why</span>
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {currentRisk.explanation}
            </p>
          </div>

          {/* Contributing Factors Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Contributing Telemetry Factors & Weights</span>
              <span className="text-xs font-normal text-slate-400">Deterministic Model Weights</span>
            </h3>

            <div className="space-y-2 mb-6">
              {(currentRisk.contributing_factors || []).map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
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
                          : factor.impact === 'Mitigating'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {factor.impact} ({factor.weight_pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Factors Weight Chart */}
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 60]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '0.5rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="weight" name="Model Weight (%)" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Decision Support Actions & Horizon (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Prediction Window Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Prediction Window
                </span>
                <span className="text-sm font-black text-slate-900">
                  {currentRisk.prediction_horizon || 'Next 24 Hours'}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Heuristic Confidence
            </span>
          </div>

          {/* Action Protocols */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Prioritized Response
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Recommended Operational Actions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic decision support for the responsible agency.
              </p>
            </div>

            <div className="space-y-3">
              {(currentRisk.actions || []).map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <span className="flex h-5 w-5 rounded-full bg-sky-100 text-sky-700 font-bold text-[11px] items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {action}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <strong>Human Decision Mandate:</strong> Suggestions must be verified by field inspection squads before initiating physical asset closures.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
