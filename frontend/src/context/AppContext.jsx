import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [systemStatus, setSystemStatus] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(1);
  const [locationsList, setLocationsList] = useState([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  // Data Source Mode: Default to 'live' real Open-Meteo weather!
  const [weatherMode, setWeatherModeState] = useState('live');
  const [weatherMeta, setWeatherMeta] = useState({
    source: 'Open-Meteo Weather API (CC-BY 4.0)',
    observation_time: null,
    hydrology_source: 'AquaNex Hydrology Baseline Simulation'
  });
  const [weatherError, setWeatherError] = useState(null);

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
          setLocationsList(mapData.locations);
          if (!selectedLocationId && mapData.locations.length > 0) {
            setSelectedLocationId(mapData.locations[0].id);
          }
        }
      } catch (mapErr) {
        if (activeMode === 'live') {
          console.warn('Live mode risk-map failed, auto falling back to demo baseline:', mapErr);
          setWeatherModeState('demo');
          const fallbackMap = await api.getRiskMap('demo');
          if (fallbackMap && fallbackMap.locations) {
            setLocationsList(fallbackMap.locations);
          }
        }
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Backend connection issue:', err.message);
      setBackendConnected(false);
      setConnectionError('Backend connection unavailable.');
    } finally {
      setIsLoadingStatus(false);
    }
  }, [selectedLocationId]);

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
