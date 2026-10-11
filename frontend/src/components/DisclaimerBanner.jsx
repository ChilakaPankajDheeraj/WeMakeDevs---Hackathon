import React from 'react';
import { Info, Radio, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DisclaimerBanner({ compact = false }) {
  const { weatherMode, weatherMeta } = useApp();
  const isLive = weatherMode === 'live';

  if (compact) {
    if (isLive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Weather Data • Open-Meteo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
        Prototype Mode • Simulated Data
      </span>
    );
  }

  if (isLive) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2 bg-emerald-50/90 border-b border-emerald-200 text-xs text-emerald-900 transition-colors">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-600 shrink-0 animate-pulse" />
          <span>
            <strong className="font-semibold text-emerald-800">Live Weather Data:</strong> Real-time atmospheric metrics sourced from Open-Meteo API (CC-BY 4.0). Groundwater, drainage, and saturation are localized simulated baselines.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded shrink-0">
          <Globe className="h-3 w-3" />
          <span>Observed: {weatherMeta?.observation_time || 'Realtime Sync'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2 bg-sky-50/80 border-b border-sky-100 text-xs text-sky-800 transition-colors">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-sky-600 shrink-0" />
        <span>
          <strong className="font-semibold text-sky-900">Prototype Mode • Simulated Data:</strong> Deterministic seeded environmental data for demonstration and decision-support exploration only. Not a certified emergency-warning system.
        </span>
      </div>
      <span className="hidden md:inline font-mono text-[11px] text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded shrink-0">
        v1.0.0 MVP
      </span>
    </div>
  );
}

