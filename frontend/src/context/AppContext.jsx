import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatISTTimeOnly } from '../utils/time';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [systemStatus, setSystemStatus] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(1);
  const [locationsList, setLocationsList] = useState([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(formatISTTimeOnly());

  // Data Source Mode: Default to 'live' real Open-Meteo weather!
  const [weatherMode, setWeatherModeState] = useState('live');
  const [weatherMeta, setWeatherMeta] = useState({
    source: 'Open-Meteo Weather API (CC-BY 4.0)',
    observation_time: null,
    hydrology_source: 'AquaNex Hydrology Baseline Simulation'
  });
  const [weatherError, setWeatherError] = useState(null);

  // Custom All-India Village/Location Management persisted in localStorage
  const [customVillages, setCustomVillages] = useState(() => {
    try {
      const saved = localStorage.getItem('aquanex_custom_villages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeVillageInspection, setActiveVillageInspection] = useState(null);

  const checkStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const statusData = await api.getSystemStatus();
      setSystemStatus(statusData);
      setActiveAlertsCount(statusData.active_alerts_count || 0);
      setBackendConnected(true);
      setConnectionError(null);

      // Load active weather mode from backend, defaulting to live
      let activeMode = 'live';
      try {
        const modeData = await api.getWeatherMode();
        if (modeData && modeData.mode) {
          activeMode = modeData.mode;
          setWeatherModeState(modeData.mode);
        }
      } catch (modeErr) {
        console.warn('Could not fetch initial weather mode:', modeErr);
      }

      // Load locations list for global selector with automatic fallback
      try {
        const mapData = await api.getRiskMap(activeMode);
        if (mapData && mapData.locations) {
          const combined = [...mapData.locations];
          // Merge custom saved villages
          customVillages.forEach((cv) => {
            if (!combined.some((l) => l.id === cv.id || l.name === cv.name)) {
              combined.push(cv);
            }
          });
          setLocationsList(combined);
          if (!selectedLocationId && combined.length > 0) {
            setSelectedLocationId(combined[0].id);
          }
        }
      } catch (mapErr) {
        if (activeMode === 'live') {
          console.warn('Live mode risk-map failed, auto falling back to demo baseline:', mapErr);
          setWeatherModeState('demo');
          const fallbackMap = await api.getRiskMap('demo');
          if (fallbackMap && fallbackMap.locations) {
            const combined = [...fallbackMap.locations];
            customVillages.forEach((cv) => {
              if (!combined.some((l) => l.id === cv.id || l.name === cv.name)) {
                combined.push(cv);
              }
            });
            setLocationsList(combined);
          }
        }
      }
      setLastRefreshed(formatISTTimeOnly());
    } catch (err) {
      console.warn('Backend connection issue:', err.message);
      setBackendConnected(false);
      setConnectionError('Backend connection unavailable.');
    } finally {
      setIsLoadingStatus(false);
    }
  }, [selectedLocationId, customVillages]);

  // Mode switcher handler
  const setWeatherMode = useCallback(async (newMode) => {
    try {
      setWeatherError(null);
      await api.setWeatherMode(newMode);
      setWeatherModeState(newMode);
    } catch (err) {
      console.error('Failed to change weather mode:', err);
      setWeatherError(`Failed to switch to ${newMode} mode: ${err.message}`);
    }
  }, []);

  const fallbackToDemoMode = useCallback(async () => {
    setWeatherError(null);
    try {
      await api.setWeatherMode('demo');
      setWeatherModeState('demo');
    } catch (err) {
      console.warn('Fallback setWeatherMode error:', err);
      setWeatherModeState('demo');
    }
  }, []);

  // Add a searched village to the active monitored locations list
  const addCustomVillage = useCallback((villageData) => {
    const newId = villageData.id || Math.floor(20000 + Math.random() * 80000);
    const newLocation = {
      id: newId,
      name: villageData.name,
      admin1: villageData.admin1 || '',
      latitude: Number(villageData.latitude),
      longitude: Number(villageData.longitude),
      zone_type: `${villageData.admin1 || 'Rural Basin'} Village`,
      population: villageData.population || 15000,
      overall_risk: villageData.risks?.overall_risk || 50.0,
      risk_level: villageData.risks?.risk_level || 'MODERATE',
      flood_risk: villageData.risks?.flood_risk || 20.0,
      shortage_risk: villageData.risks?.shortage_risk || 40.0,
      heat_risk: villageData.risks?.heat_risk || 45.0,
      leak_risk: villageData.risks?.leak_risk || 15.0,
      rainfall_mm: villageData.rainfall_mm || 0.0,
      rainfall_intensity: villageData.rainfall_intensity || 0.0,
      temperature_c: villageData.temperature_c || 28.0,
      humidity_percent: villageData.humidity_percent || 60.0,
      groundwater_percent: villageData.groundwater_percent || 45.0,
      daily_demand_liters: villageData.daily_demand_liters || 2025000,
      daily_supply_liters: villageData.daily_supply_liters || 1660500,
      weather_source: villageData.weather_source || 'Open-Meteo Weather API',
      weather_observation_time: villageData.observation_time || null,
      weather_description: villageData.weather_description || 'Live Telemetry',
      hydrology_source: 'Simulated Baseline',
      isCustom: true
    };

    setCustomVillages((prev) => {
      const filtered = prev.filter((p) => p.name.toLowerCase() !== newLocation.name.toLowerCase());
      const updated = [newLocation, ...filtered];
      try {
        localStorage.setItem('aquanex_custom_villages', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save to localStorage:', err);
      }
      return updated;
    });

    setLocationsList((prev) => {
      const filtered = prev.filter((p) => p.name.toLowerCase() !== newLocation.name.toLowerCase());
      return [newLocation, ...filtered];
    });

    setSelectedLocationId(newId);
    return newLocation;
  }, []);

  const removeCustomVillage = useCallback((villageId) => {
    setCustomVillages((prev) => {
      const updated = prev.filter((p) => p.id !== villageId);
      try {
        localStorage.setItem('aquanex_custom_villages', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save to localStorage:', err);
      }
      return updated;
    });
    setLocationsList((prev) => prev.filter((p) => p.id !== villageId));
  }, []);

  useEffect(() => {
    checkStatus();
    // Periodic status refresh every 45s
    const interval = setInterval(checkStatus, 45000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const value = {
    systemStatus,
    selectedLocationId,
    setSelectedLocationId,
    locationsList,
    activeAlertsCount,
    setActiveAlertsCount,
    isLoadingStatus,
    backendConnected,
    connectionError,
    lastRefreshed,
    refreshStatus: checkStatus,
    weatherMode,
    setWeatherMode,
    weatherMeta,
    setWeatherMeta,
    weatherError,
    setWeatherError,
    fallbackToDemoMode,
    customVillages,
    addCustomVillage,
    removeCustomVillage,
    activeVillageInspection,
    setActiveVillageInspection,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

