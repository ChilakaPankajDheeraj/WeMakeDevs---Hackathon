import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  Layers,
  CloudRain,
  Sun,
  Droplets,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function SimulatorPage() {
  const { selectedLocationId, locationsList } = useApp();

  // Simulation Parameters State
  const [params, setParams] = useState({
    rainfall_mm: 85,
    temperature_c: 34,
    groundwater_percent: 45,
    daily_demand_liters: 700000,
    daily_supply_liters: 550000,
    drainage_capacity_percent: 40,
    soil_saturation_percent: 75,
    humidity_percent: 70,
  });

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Load baseline parameters from active location
  const loadBaseline = async (locId) => {
    try {
      setLoadingInitial(true);
      const detail = await api.getLocationDetail(locId || 1);
      if (detail) {
        setParams({
          rainfall_mm: detail.rainfall_mm,
          temperature_c: detail.temperature_c,
          groundwater_percent: detail.groundwater_percent,
          daily_demand_liters: detail.daily_demand_liters,
          daily_supply_liters: detail.daily_supply_liters,
          drainage_capacity_percent: detail.drainage_capacity_percent,
          soil_saturation_percent: detail.soil_saturation_percent,
          humidity_percent: detail.humidity_percent,
        });
      }
    } catch (err) {
      console.error('Failed to load baseline parameters:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadBaseline(selectedLocationId);
  }, [selectedLocationId]);

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    try {
      setSimulating(true);
      const res = await api.runSimulation({
        location_id: selectedLocationId || 1,
        ...params,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation calculation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Run initial simulation
  useEffect(() => {
    handleSimulate();
  }, [params]);

  const handleReset = () => {
    loadBaseline(selectedLocationId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              What-If Climate Scenario Simulator
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Interactive Stress Testing
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Simulate extreme climate anomalies, monsoon deluges, and acute drought to stress-test regional infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Baseline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sliders Input Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Environmental & Hydraulic Controls
              </h2>
              <p className="text-xs text-slate-500">
                Adjust variables to evaluate system threshold response.
              </p>
            </div>
            <Sliders className="h-5 w-5 text-sky-600" />
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            {/* 1. Rainfall */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CloudRain className="h-3.5 w-3.5 text-sky-600" />
                  <span>24h Rainfall:</span>
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {params.rainfall_mm} mm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={params.rainfall_mm}
                onChange={(e) => setParams({ ...params, rainfall_mm: Number(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            {/* 2. Temperature */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>Ambient Temperature:</span>
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {params.temperature_c}°C
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="55"
                step="1"
                value={params.temperature_c}
                onChange={(e) => setParams({ ...params, temperature_c: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* 3. Soil Saturation */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Soil Saturation:</span>
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {params.soil_saturation_percent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={params.soil_saturation_percent}
                onChange={(e) => setParams({ ...params, soil_saturation_percent: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* 4. Drainage Capacity */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-600" />
                  <span>Drainage Efficiency:</span>
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {params.drainage_capacity_percent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={params.drainage_capacity_percent}
                onChange={(e) => setParams({ ...params, drainage_capacity_percent: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* 5. Groundwater Percent */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-cyan-600" />
                  <span>Aquifer Reserves:</span>
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {params.groundwater_percent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={params.groundwater_percent}
                onChange={(e) => setParams({ ...params, groundwater_percent: Number(e.target.value) })}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            {/* 6. Water Demand */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Daily Demand (L):</label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {Math.round(params.daily_demand_liters / 1000)}k L
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="1500000"
                step="50000"
                value={params.daily_demand_liters}
                onChange={(e) => setParams({ ...params, daily_demand_liters: Number(e.target.value) })}
                className="w-full accent-slate-800 cursor-pointer"
              />
            </div>

            {/* 7. Water Supply */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Available Supply (L):</label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {Math.round(params.daily_supply_liters / 1000)}k L
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="1500000"
                step="50000"
                value={params.daily_supply_liters}
                onChange={(e) => setParams({ ...params, daily_supply_liters: Number(e.target.value) })}
                className="w-full accent-slate-800 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {simulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Calculating Backend Simulation...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run Scenario Simulation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Comparison Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {simulationResult && (
            <>
              {/* Score Shift Comparison Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Simulation Delta Analysis
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      Baseline vs Simulated Outcomes
                    </h3>
                  </div>
                  <span className="text-xs font-mono bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg border border-sky-100">
                    Run #{simulationResult.simulation_id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'flood_risk', label: 'Flood Risk', icon: CloudRain },
                    { key: 'shortage_risk', label: 'Water Shortage', icon: Droplets },
                    { key: 'heat_risk', label: 'Heat Stress', icon: Sun },
                    { key: 'overall_risk', label: 'Composite Risk', icon: Activity },
                  ].map((item) => {
                    const baseScore = simulationResult.baseline_scores[item.key] || 0;
                    const simScore = simulationResult.simulated_scores[item.key] || 0;
                    const delta = simulationResult.score_deltas[item.key] || 0;
                    const simLvl = simulationResult.simulated_levels[item.key];
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                            <Icon className="h-4 w-4 text-sky-600" />
                            <span>{item.label}</span>
                          </div>
                          <RiskBadge level={simLvl} size="sm" />
                        </div>

                        <div className="flex items-baseline justify-between pt-1">
                          <div className="text-xs text-slate-500">
                            Baseline: <strong className="text-slate-700">{Math.round(baseScore)}</strong>
                          </div>
                          <div className="text-lg font-black text-slate-900">
                            {Math.round(simScore)}
                          </div>
                        </div>

                        {/* Delta indicator */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400 text-[11px]">Net Shift:</span>
                          <span
                            className={`font-mono font-bold flex items-center gap-0.5 ${
                              delta > 0
                                ? 'text-rose-600'
                                : delta < 0
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {delta > 0 ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : delta < 0 ? (
                              <TrendingDown className="h-3.5 w-3.5" />
                            ) : (
                              <Minus className="h-3.5 w-3.5" />
                            )}
                            {delta > 0 ? `+${delta}` : delta} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Adaptive Actions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-600" />
                  <span>Adaptive Actions for Simulated Scenario</span>
                </h3>

                <div className="space-y-2">
                  {(simulationResult.recommended_actions || []).map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950 font-medium leading-relaxed"
                    >
                      {action}
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-slate-400 text-center font-medium">
                {simulationResult.disclaimer}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
