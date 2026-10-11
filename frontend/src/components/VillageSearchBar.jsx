import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Sparkles, Plus, Check } from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

const PRESET_VILLAGES = [
  { name: 'Kollipara', admin1: 'Andhra Pradesh', country: 'India', latitude: 16.28756, longitude: 80.74998 },
  { name: 'Tenali', admin1: 'Andhra Pradesh', country: 'India', latitude: 16.24253, longitude: 80.63982 },
  { name: 'Bhimavaram', admin1: 'Andhra Pradesh', country: 'India', latitude: 16.54078, longitude: 81.52322 },
  { name: 'Guntur', admin1: 'Andhra Pradesh', country: 'India', latitude: 16.29974, longitude: 80.45729 },
  { name: 'Vijayawada', admin1: 'Andhra Pradesh', country: 'India', latitude: 16.50617, longitude: 80.64802 },
  { name: 'Warangal', admin1: 'Telangana', country: 'India', latitude: 17.96890, longitude: 79.59405 },
  { name: 'Tirupati', admin1: 'Andhra Pradesh', country: 'India', latitude: 13.62876, longitude: 79.41918 },
  { name: 'Siddipet', admin1: 'Telangana', country: 'India', latitude: 18.10483, longitude: 78.84858 },
  { name: 'Hyderabad', admin1: 'Telangana', country: 'India', latitude: 17.38504, longitude: 78.48667 },
];

export default function VillageSearchBar({ onLocationSelect, compact = false, className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const dropdownRef = useRef(null);

  const { addCustomVillage, setActiveVillageInspection, customVillages } = useApp();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(PRESET_VILLAGES);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await api.searchVillages(query.trim(), 8);
        setResults(data && data.length > 0 ? data : []);
      } catch (err) {
        console.error('Village search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (loc) => {
    setAnalyzingId(loc.name);
    try {
      // Analyze village in real-time
      const analysis = await api.analyzeVillage({
        lat: loc.latitude,
        lon: loc.longitude,
        name: loc.name,
        admin1: loc.admin1 || 'India',
        population: loc.population || 18500,
      });

      const fullData = { ...loc, ...analysis };
      setActiveVillageInspection(fullData);

      if (onLocationSelect) {
        onLocationSelect(fullData);
      }
      setIsOpen(false);
      setQuery('');
    } catch (err) {
      console.warn('Real-time village analysis fallback:', err);
      if (onLocationSelect) {
        onLocationSelect(loc);
      }
      setIsOpen(false);
    } finally {
      setAnalyzingId(null);
    }
  };

  const isAlreadySaved = (locName) => {
    return customVillages?.some((cv) => cv.name.toLowerCase() === locName.toLowerCase());
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-sky-600">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          ) : (
            <Search className="h-4 w-4 text-slate-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search any village, mandal, or town across India (e.g. Kollipara, Tenali, Guntur)..."
          className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-2xl shadow-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all font-medium"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults(PRESET_VILLAGES);
            }}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Preset Quick Chips (shown when compact is false and query is empty) */}
      {!compact && !query && (
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Popular:
          </span>
          {PRESET_VILLAGES.slice(0, 6).map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelect(preset)}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200/60 font-medium shrink-0 transition"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>
              {query ? `Search results for "${query}"` : 'Popular Settlements (Andhra & Telangana)'}
            </span>
            <span className="text-sky-600 font-semibold">All-India Coverage</span>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No village or town found matching "{query}". Try another spelling.
            </div>
          ) : (
            results.map((loc) => {
              const saved = isAlreadySaved(loc.name);
              const isAnalyzing = analyzingId === loc.name;

              return (
                <div
                  key={`${loc.name}-${loc.latitude}-${loc.longitude}`}
                  className="p-3 hover:bg-sky-50/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                  onClick={() => handleSelect(loc)}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-sky-100/70 text-sky-700 mt-0.5 group-hover:bg-sky-600 group-hover:text-white transition">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                          {loc.name}
                        </span>
                        {loc.admin1 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            {loc.admin1}
                          </span>
                        )}
                        {saved && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                            <Check className="h-2.5 w-2.5" /> Monitored
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {loc.admin2 ? `${loc.admin2}, ` : ''}{loc.country || 'India'} • Lat: {loc.latitude?.toFixed(2)}°, Lon: {loc.longitude?.toFixed(2)}°
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(loc);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold shadow-2xs transition flex items-center gap-1"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <span>Inspect & Pin</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
