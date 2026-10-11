import React, { useState, useEffect } from 'react';
import {
  Truck,
  Droplets,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
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

export default function TankerOptimizerPage() {
  const [availableTankers, setAvailableTankers] = useState(15);
  const [tankerCapacity, setTankerCapacity] = useState(10000);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState(null);

  const runOptimizer = async (e) => {
    if (e) e.preventDefault();
    try {
      setOptimizing(true);
      const res = await api.optimizeTankers({
        available_tankers: Number(availableTankers),
        tanker_capacity_liters: Number(tankerCapacity),
      });
      setResult(res);
    } catch (err) {
      console.error('Failed to run tanker fleet optimization:', err);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    runOptimizer();
  }, [availableTankers, tankerCapacity]);

  const chartData = (result?.allocations || []).map((a) => ({
    name: a.location_name.replace(' - ', '\n').split(' ')[0],
    shortage: Math.round(a.net_shortage_liters / 1000),
    allocated: Math.round(a.allocated_water_liters / 1000),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tanker Fleet Dispatch Optimizer
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              Constrained Resource Allocation
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic optimization dispatching emergency water trucks based on shortage severity and population priority.
          </p>
        </div>

        <button
          onClick={runOptimizer}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-600" />
          Re-Optimize Fleet
        </button>
      </div>

      {/* Resource Allocation Controls & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Fleet Capacity Parameters
            </h2>
            <p className="text-xs text-slate-500">
              Configure available municipal truck reserves.
            </p>
          </div>

          <form onSubmit={runOptimizer} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Available Tanker Vehicles:
                </label>
                <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                  {availableTankers} Trucks
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={availableTankers}
                onChange={(e) => setAvailableTankers(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Tanker Capacity:
                </label>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {Number(tankerCapacity).toLocaleString()} L
                </span>
              </div>
              <select
                value={tankerCapacity}
                onChange={(e) => setTankerCapacity(Number(e.target.value))}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-cyan-500 cursor-pointer"
              >
                <option value={8000}>8,000 Liters (Medium Rig)</option>
                <option value={10000}>10,000 Liters (Standard Tanker)</option>
                <option value={12000}>12,000 Liters (Heavy Tanker)</option>
                <option value={15000}>15,000 Liters (Bulk Trailer)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={optimizing}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-700/20 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {optimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Solving Allocation...</span>
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  <span>Execute Allocation Algorithm</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong className="block text-slate-800 mb-0.5">Constraint Guarantees:</strong>
            Never allocates more trucks than available. Never creates negative allocations. Respects zone severity weights.
          </div>
        </div>

        {/* Fleet KPI Metric Quad (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Dispatched
                  </span>
                  <span className="text-2xl font-black text-cyan-700 font-mono">
                    {result.total_tankers_allocated} / {result.total_tankers_available}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {result.remaining_idle_tankers} Idle in Reserve
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Water Dispatched
                  </span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {Math.round(result.total_water_dispatched_liters / 1000).toLocaleString()}
                    <span className="text-xs font-medium text-slate-400"> kL</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Total Delivered
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Unmet Deficit
                  </span>
                  <span className="text-2xl font-black text-rose-600 font-mono">
                    {Math.round(result.total_unmet_demand_liters / 1000).toLocaleString()}
                    <span className="text-xs font-medium text-slate-400"> kL</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Remaining Shortfall
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Fulfillment Rate
                  </span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    {result.overall_fulfillment_rate_percent}%
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Deficit Mitigated
                  </span>
                </div>
              </div>

              {/* Chart: Net Shortage vs Allocated */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sector Deficit vs Dispatched Water (kL)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comparison between initial demand deficit and optimized truck replenishment.
                    </p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-cyan-600" />
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} unit="kL" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '0.75rem',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="shortage" name="Net Deficit (kL)" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="allocated" name="Dispatched Water (kL)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Allocation Breakdown Table */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Sector Dispatch Allocation Matrix
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Transparent algorithmic reasoning behind each location's tanker assignment.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Sector</th>
                  <th className="pb-3">Shortage Risk</th>
                  <th className="pb-3">Net Deficit</th>
                  <th className="pb-3">Allocated Trucks</th>
                  <th className="pb-3">Water Delivered</th>
                  <th className="pb-3">Fulfillment</th>
                  <th className="pb-3">Algorithmic Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {result.allocations.map((alloc) => (
                  <tr key={alloc.location_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 font-bold text-slate-900">
                      {alloc.location_name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Pop: {alloc.population.toLocaleString()} • Prio: {alloc.priority_weight}/5
                      </span>
                    </td>
                    <td className="py-3">
                      <RiskBadge level={null} score={alloc.shortage_risk} size="sm" />
                    </td>
                    <td className="py-3 text-slate-700 font-mono">
                      {Math.round(alloc.net_shortage_liters).toLocaleString()} L
                    </td>
                    <td className="py-3 font-bold text-cyan-700 font-mono">
                      {alloc.allocated_tankers} Trucks
                    </td>
                    <td className="py-3 text-slate-700 font-mono">
                      {Math.round(alloc.allocated_water_liters).toLocaleString()} L
                    </td>
                    <td className="py-3 font-bold">
                      <span
                        className={
                          alloc.fulfillment_rate_percent >= 80
                            ? 'text-emerald-600'
                            : alloc.fulfillment_rate_percent > 0
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }
                      >
                        {alloc.fulfillment_rate_percent}%
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                      {alloc.allocation_rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
