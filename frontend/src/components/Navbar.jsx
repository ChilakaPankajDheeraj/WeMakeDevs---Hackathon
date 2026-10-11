import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Activity,
  Layers,
  Menu,
  X,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Radio,
  Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import DisclaimerBanner from './DisclaimerBanner';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const {
    systemStatus,
    activeAlertsCount,
    selectedLocationId,
    setSelectedLocationId,
    locationsList,
    backendConnected,
    refreshStatus,
    isLoadingStatus,
    weatherMode,
    setWeatherMode,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <DisclaimerBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Mark & Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition lg:hidden"
              aria-label="Toggle navigation"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center text-white">
                  <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="#0284c7" fillOpacity="0.4" />
                    <circle cx="12" cy="14" r="2" fill="#38bdf8" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition">
                    AQUANEX
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 tracking-wider">
                    AI
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 hidden sm:inline -mt-0.5">
                  AI Water & Climate Early Warning
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Monitored Location Selector & Data Source Mode Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Location:</span>
              <select
                value={selectedLocationId || ''}
                onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.zone_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher (Prototype vs Live Open-Meteo) */}
            <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setWeatherMode('demo')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                  weatherMode === 'demo'
                    ? 'bg-white text-sky-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Prototype Mode: Deterministic seeded simulated data"
              >
                <Cpu className="h-3.5 w-3.5 text-sky-600" />
                <span>Demo</span>
              </button>
              <button
                type="button"
                onClick={() => setWeatherMode('live')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                  weatherMode === 'live'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Live Weather Data: Real-time Open-Meteo API (CC-BY 4.0)"
              >
                <Radio className={`h-3.5 w-3.5 ${weatherMode === 'live' ? 'animate-pulse text-white' : 'text-slate-400'}`} />
                <span>Live Weather</span>
              </button>
            </div>
          </div>

          {/* Right: Telemetry Health, Refresh & Alerts */}
          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium">
              {backendConnected ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-700">System Live</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({systemStatus?.database_mode?.includes('Supabase') ? 'Supabase' : 'SQLite'})
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-rose-600 font-semibold">Backend Offline</span>
                </>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshStatus}
              title="Refresh telemetry"
              className={`p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition ${
                isLoadingStatus ? 'animate-spin text-sky-600' : ''
              }`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Alerts Center Notification Button */}
            <Link
              to="/alerts"
              className="relative p-2 rounded-xl text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition"
              title="Alerts Center"
            >
              <Bell className="h-5 w-5" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm animate-bounce">
                  {activeAlertsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
