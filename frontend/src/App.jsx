import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PwaInstallPrompt from './components/PwaInstallPrompt';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import RiskMapPage from './pages/RiskMapPage';
import PredictionsPage from './pages/PredictionsPage';
import WaterIntelligencePage from './pages/WaterIntelligencePage';
import RecommendationsPage from './pages/RecommendationsPage';
import LeakIntelligencePage from './pages/LeakIntelligencePage';
import HeatIntelligencePage from './pages/HeatIntelligencePage';
import AlertCenterPage from './pages/AlertCenterPage';
import SimulatorPage from './pages/SimulatorPage';
import TankerOptimizerPage from './pages/TankerOptimizerPage';
import SystemStatusPage from './pages/SystemStatusPage';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return (
      <div className="min-h-screen flex flex-col">
        {children}
        <PwaInstallPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isSidebarOpen={sidebarOpen}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      <PwaInstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/risk-map" element={<RiskMapPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/water-intelligence" element={<WaterIntelligencePage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/leak-intelligence" element={<LeakIntelligencePage />} />
            <Route path="/heat-intelligence" element={<HeatIntelligencePage />} />
            <Route path="/alerts" element={<AlertCenterPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/tanker-optimizer" element={<TankerOptimizerPage />} />
            <Route path="/system-status" element={<SystemStatusPage />} />
            {/* Catch-all redirect to dashboard */}
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  );
}
