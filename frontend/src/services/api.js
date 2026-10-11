import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for clear debugging
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AquaNex API Request Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // System & Status
  getHealth: () => client.get('/api/health').then((r) => r.data),
  getSystemStatus: () => client.get('/api/system-status').then((r) => r.data),

  // Weather Data Source Modes (Demo vs Live Open-Meteo)
  getWeatherMode: () => client.get('/api/weather/mode').then((r) => r.data),
  setWeatherMode: (mode) => client.post('/api/weather/mode', { mode }).then((r) => r.data),
  getLiveWeather: (locationId) => client.get(`/api/live-weather/${locationId}`).then((r) => r.data),

  // Command Center Dashboard
  getDashboard: (mode = null) => {
    const params = mode ? { mode } : {};
    return client.get('/api/dashboard', { params }).then((r) => r.data);
  },

  // Risk Map
  getRiskMap: (mode = null) => {
    const params = mode ? { mode } : {};
    return client.get('/api/risk-map', { params }).then((r) => r.data);
  },

  // Location Detail
  getLocationDetail: (locationId, mode = null) => {
    const params = mode ? { mode } : {};
    return client.get(`/api/location/${locationId}`, { params }).then((r) => r.data);
  },

  // Alerts
  getAlerts: (params = {}) => client.get('/api/alerts', { params }).then((r) => r.data),
  acknowledgeAlert: (alertId, payload = { acknowledged_by: 'Control Room Operator' }) =>
    client.post(`/api/alerts/${alertId}/acknowledge`, payload).then((r) => r.data),

  // Prediction & Explainability
  predictRisks: (payload) => client.post('/api/predict', payload).then((r) => r.data),
  explainRisk: (payload) => client.post('/api/explain', payload).then((r) => r.data),

  // Climate What-If Simulator
  runSimulation: (payload) => client.post('/api/simulate', payload).then((r) => r.data),

  // Water Intelligence
  getWaterForecast: (locationId = null) => {
    const params = locationId ? { location_id: locationId } : {};
    return client.get('/api/water-forecast', { params }).then((r) => r.data);
  },

  // Heat Intelligence
  getHeatRisk: (locationId = null) => {
    const params = locationId ? { location_id: locationId } : {};
    return client.get('/api/heat-risk', { params }).then((r) => r.data);
  },

  // Leak Intelligence
  getWaterConsumption: (locationId = null) => {
    const params = locationId ? { location_id: locationId } : {};
    return client.get('/api/water-consumption', { params }).then((r) => r.data);
  },
  detectLeak: (payload) => client.post('/api/leak-detection', payload).then((r) => r.data),

  // Tanker Fleet Optimizer
  optimizeTankers: (payload) => client.post('/api/tanker-optimize', payload).then((r) => r.data),

  // Recommendations
  getRecommendations: (params = {}) => client.get('/api/recommendations', { params }).then((r) => r.data),

  // Village & All-India Location Intelligence
  searchVillages: async (query, count = 10) => {
    try {
      const res = await client.get('/api/villages/search', { params: { q: query, count } });
      return res.data?.results || [];
    } catch {
      try {
        const resp = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
          params: { name: query, count, language: 'en', format: 'json' }
        });
        return (resp.data?.results || []).map((item) => ({
          id: item.id,
          name: item.name,
          admin1: item.admin1 || '',
          admin2: item.admin2 || '',
          country: item.country || 'India',
          country_code: item.country_code || 'IN',
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          population: item.population || 15000,
          display_name: `${item.name}, ${item.admin1 || ''} (${item.country || 'India'})`
        }));
      } catch {
        return [];
      }
    }
  },
  analyzeVillage: (params) => client.get('/api/villages/analyze', { params }).then((r) => r.data),
};

export default api;
