import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Droplets,
  Lightbulb,
  Search,
  SunMedium,
  Bell,
  Sliders,
  Truck,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const { activeAlertsCount, systemStatus } = useApp();

  const navLinks = [
    { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard, exact: true },
    { to: '/risk-map', label: 'Risk Map', icon: Map },
    { to: '/predictions', label: 'Risk Predictions', icon: TrendingUp },
    { to: '/water-intelligence', label: 'Water Intelligence', icon: Droplets },
    { to: '/recommendations', label: 'AI Recommendations', icon: Lightbulb },
    { to: '/leak-intelligence', label: 'Leak Intelligence', icon: Search },
    { to: '/heat-intelligence', label: 'Heat Intelligence', icon: SunMedium },
    { to: '/alerts', label: 'Alert Center', icon: Bell, badge: activeAlertsCount },
    { to: '/simulator', label: 'What-If Simulator', icon: Sliders },
    { to: '/tanker-optimizer', label: 'Tanker Optimizer', icon: Truck },
    { to: '/system-status', label: 'System & Status', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operations Center
            </span>
            <span className="text-sm font-semibold text-slate-800">
              Regional Multi-Hazard
            </span>
          </div>
          <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-sky-600" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-60" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700">Predict. Protect. Act.</span>
              <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              From risk prediction to verified decision response.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
