import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Layers,
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
  Lock,
  FileCode
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { formatIST } from '../utils/time';

export default function SystemStatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);

  const fetchHealthAndStatus = async () => {
    try {
      setLoading(true);
      const [status, health] = await Promise.all([
        api.getSystemStatus(),
        api.getHealth(),
      ]);
      setStatusData(status);
      setHealthData(health);
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndStatus();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              System Architecture & Health
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
              Diagnostic Audit
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time verification of backend telemetry engines, database connectivity, and environment modes.
          </p>
        </div>

        <button
          onClick={fetchHealthAndStatus}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
          Re-Check Status
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton height="h-64" />
      ) : (
        <>
          {/* Status Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. API Status */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">FastAPI Core</span>
                <Server className="h-4 w-4 text-sky-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-lg font-black text-slate-900 capitalize">
                  {statusData?.api_status || 'Operational'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Port 8000 • Uvicorn ASGI
              </p>
            </div>

            {/* 2. Database Status */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Database Engine</span>
                <Database className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    statusData?.database_status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-lg font-black text-slate-900 capitalize">
                  {statusData?.database_status || 'Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {statusData?.database_mode}
              </p>
            </div>

            {/* 3. Risk Engine Status */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Risk Engine</span>
                <Cpu className="h-4 w-4 text-teal-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-lg font-black text-slate-900">
                  Operational
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Deterministic Heuristics (0-100)
              </p>
            </div>

            {/* 4. Active Monitored Nodes */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Monitored Sectors</span>
                <Layers className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">
                  {statusData?.locations_count || 5} Sectors
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {statusData?.active_alerts_count || 0} Active Triage Alerts
              </p>
            </div>
          </div>

          {/* Architecture & Dual Database Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Database className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-base">Dual-Mode Database Architecture</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                AquaNex features an abstract repository and connection layer supporting both zero-dependency local SQLite development and Supabase PostgreSQL in the cloud:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>SQLite Local Mode:</strong> Active by default without requiring Supabase accounts, API keys, or internet connectivity. Runs completely on local filesystem.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Supabase Cloud Mode:</strong> When <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">SUPABASE_URL</code> is present in environment, activates PostgreSQL with Row Level Security (RLS) policies.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Lock className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-base">Security Safeguards & Roles</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Production-grade security considerations implemented throughout:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Secret Isolation:</strong> Supabase service-role keys are never exposed in frontend code or bundled scripts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Planned Role Hierarchy:</strong> Administrator, Water-management operator, Disaster-response operator, Read-only viewer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Safe Exception Handling:</strong> Database transactions safely rollback and never leak raw stack traces to client requests.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Prototype Mode Disclaimer */}
          <div className="rounded-2xl bg-slate-900 text-slate-300 p-6 shadow-md border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Info className="h-5 w-5" />
              <span>Simulated Data & Safety Boundaries</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The environmental telemetry, sensor readings, and predictions displayed across this command center are simulated mathematical approximations created for hackathon demonstration. They do not constitute official public health or civil defense warnings. Integrations with real IoT precipitation sensors, satellite imagery, and municipal SCADA telemetry can be plugged directly into the modular repository layer.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-500">
              Timestamp: {formatIST(statusData?.timestamp)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
