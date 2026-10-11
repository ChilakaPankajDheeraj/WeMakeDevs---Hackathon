import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Activity,
  Droplets,
  Wrench,
  HelpCircle,
  RefreshCw,
  Compass,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function LeakIntelligencePage() {
  const { selectedLocationId } = useApp();
  const [normalConsumption, setNormalConsumption] = useState(500000);
  const [observedConsumption, setObservedConsumption] = useState(640000);
  const [pipeZoneId, setPipeZoneId] = useState('Sector-B Trunk Main');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Load baseline consumption records from backend
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await api.getWaterConsumption(selectedLocationId);
      setHistory(data || []);
      if (data && data.length > 0) {
        setNormalConsumption(data[0].normal_liters);
        setObservedConsumption(data[0].observed_liters);
      }
    } catch (err) {
      console.error('Failed to load consumption history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedLocationId]);

  const handleRunInvestigation = async (e) => {
    if (e) e.preventDefault();
    try {
      setAnalyzing(true);
      const res = await api.detectLeak({
        normal_consumption: Number(normalConsumption),
        observed_consumption: Number(observedConsumption),
        pipe_zone_id: pipeZoneId,
      });
      setResult(res);
    } catch (err) {
      console.error('Leak detection analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Run initial investigation once
  useEffect(() => {
    handleRunInvestigation();
  }, [normalConsumption, observedConsumption, pipeZoneId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pipeline Leak Intelligence
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Heuristic Flow Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Statistical anomaly detection comparing diurnal baseline consumption against observed pipe throughput.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
          Reload Telemetry
        </button>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Flow Parameter Telemetry
            </h2>
            <p className="text-xs text-slate-500">
              Adjust flow values or load historical meter readouts.
            </p>
          </div>

          <form onSubmit={handleRunInvestigation} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Monitored Sector / Pipeline Zone
              </label>
              <input
                type="text"
                value={pipeZoneId}
                onChange={(e) => setPipeZoneId(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Expected Baseline (L/day)
                </label>
                <span className="text-xs font-mono text-slate-500">
                  {Number(normalConsumption).toLocaleString()} L
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="1000000"
                step="10000"
                value={normalConsumption}
                onChange={(e) => setNormalConsumption(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Observed Telemetry Inflow (L/day)
                </label>
                <span className="text-xs font-mono text-indigo-700 font-bold">
                  {Number(observedConsumption).toLocaleString()} L
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="1200000"
                step="10000"
                value={observedConsumption}
                onChange={(e) => setObservedConsumption(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing Statistical Anomaly...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Investigate Anomaly</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
              Preset Scenarios
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setNormalConsumption(500000);
                  setObservedConsumption(512000);
                }}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 text-center"
              >
                Nominal Flow (+2%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setNormalConsumption(500000);
                  setObservedConsumption(690000);
                }}
                className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium hover:bg-rose-100 text-center"
              >
                Severe Rupture (+38%)
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Diagnostic Outcome
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-xl font-black text-slate-900">
                      {result.anomaly_detected ? 'Leak Anomaly Detected' : 'Flow Balance Normal'}
                    </h3>
                  </div>
                </div>
                <RiskBadge level={result.risk_level} score={result.risk_score} size="lg" />
              </div>

              {/* Metric Triplet */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Excess Volume
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                    {Math.round(result.excess_consumption).toLocaleString()} L
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Anomaly Rate
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black font-mono ${
                      result.anomaly_percentage > 15 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    +{result.anomaly_percentage}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Methodology
                  </span>
                  <span className="text-xs font-bold text-slate-700 block truncate mt-1">
                    Heuristic
                  </span>
                </div>
              </div>

              {/* Possible Causes List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Hypothesized Root Causes</span>
                </h4>
                <div className="space-y-2">
                  {(result.possible_causes || []).map((cause, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium flex items-center gap-2.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-sky-600" />
                  <span>Immediate Remediation Steps</span>
                </h4>
                <div className="space-y-2">
                  {(result.recommended_actions || []).map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 font-medium leading-relaxed"
                    >
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Historical Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Sector Historical Night Flow Logs
            </h3>
            {historyLoading ? (
              <LoadingSkeleton height="h-28" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Baseline</th>
                      <th className="pb-2">Observed</th>
                      <th className="pb-2">Excess</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {history.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 font-mono text-slate-500">{row.recorded_date}</td>
                        <td className="py-2.5 text-slate-700">
                          {Math.round(row.normal_liters).toLocaleString()} L
                        </td>
                        <td className="py-2.5 text-slate-700">
                          {Math.round(row.observed_liters).toLocaleString()} L
                        </td>
                        <td className="py-2.5 text-slate-700 font-mono">
                          {row.excess_liters > 0 ? `+${Math.round(row.excess_liters).toLocaleString()} L` : '0 L'}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.anomaly_flag
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {row.anomaly_flag ? 'Anomaly' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
