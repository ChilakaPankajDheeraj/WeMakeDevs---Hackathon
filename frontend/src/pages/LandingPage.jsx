import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Droplets,
  CloudRain,
  Sun,
  Activity,
  Sliders,
  Bell,
  Cpu,
  CheckCircle,
  FileText,
  MapPin,
  ChevronRight
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-slate-50 to-white text-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold mb-6 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-sky-600 animate-pulse" />
            AI Water & Climate Early Warning System
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 mb-4">
            AQUANEX
          </h1>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent mb-6">
            Predict. Protect. Act.
          </p>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            Transforming environmental signals into intelligent action. AquaNex equips municipal control rooms, disaster response teams, and water utilities with transparent, multi-hazard risk forecasting.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-sky-600 text-white font-semibold text-sm shadow-md shadow-sky-600/25 hover:bg-sky-500 hover:shadow-lg transition active:scale-98"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/risk-map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:bg-slate-50 hover:text-slate-950 transition"
            >
              <MapPin className="h-4 w-4 text-sky-600" />
              <span>Explore Risk Map</span>
            </Link>
          </div>

          {/* System Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 pt-10 border-t border-slate-200/80 text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                  <Cpu className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-slate-900">AI Risk Engine</span>
              </div>
              <p className="text-xs text-slate-500">
                Deterministic heuristics for flood, shortage, heat, leaks, and drought.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
                  <Droplets className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-slate-900">Water Intelligence</span>
              </div>
              <p className="text-xs text-slate-500">
                7-day demand vs supply balance and groundwater depletion tracking.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-slate-900">Climate Monitoring</span>
              </div>
              <p className="text-xs text-slate-500">
                Active alert dispatching and interactive climate scenario simulator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Workflow: From Prediction to Action */}
      <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-sky-600 tracking-wider uppercase">
              The Primary Differentiator
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              FROM PREDICTION TO ACTION
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              For every elevated environmental risk, AquaNex clarifies what is happening, why it matters, and which exact response to prioritize.
            </p>
          </div>

          {/* Workflow Steps Horizontal Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 lg:gap-4 text-center">
            {[
              { step: '01', title: 'DATA', desc: 'Rainfall, soils, telemetry', icon: CloudRain },
              { step: '02', title: 'AI ANALYSIS', desc: 'Normalized multi-factor model', icon: Cpu },
              { step: '03', title: 'PREDICTION', desc: '0-100 bounded risk score', icon: Activity },
              { step: '04', title: 'EXPLANATION', desc: 'Contributing factor breakdown', icon: FileText },
              { step: '05', title: 'RECOMMENDATION', desc: 'Targeted operational steps', icon: Shield },
              { step: '06', title: 'ACTION', desc: 'Pumps, tankers, advisories', icon: CheckCircle },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="relative p-4 rounded-2xl bg-slate-50 border border-slate-200/70 shadow-xs flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded-full mb-3">
                    {st.step}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs mb-2">
                    <Icon className="h-5 w-5 text-sky-600" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-wide">{st.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety Disclaimer Footer */}
      <footer className="py-10 bg-slate-900 text-slate-400 text-xs text-center px-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="font-semibold text-slate-300">
            AquaNex — AI Water & Climate Early Warning System • Hackathon Prototype
          </p>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Notice: This application uses simulated demonstration data and heuristic algorithms for decision-support exploration. It is not a certified official emergency alert system and does not issue public evacuation orders.
          </p>
        </div>
      </footer>
    </div>
  );
}
