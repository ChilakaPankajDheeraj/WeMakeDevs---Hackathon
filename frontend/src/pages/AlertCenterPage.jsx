import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  Check,
  Filter,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import RiskBadge from '../components/RiskBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function AlertCenterPage() {
  const { refreshStatus } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      const data = await api.getAlerts(params);
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setErrorMsg('Failed to load alerts from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (alertId) => {
    try {
      setAcknowledgingId(alertId);
      const updatedAlert = await api.acknowledgeAlert(alertId, {
        acknowledged_by: 'Control Room Dispatcher',
      });
      // Update local state with the returned persisted record
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? updatedAlert : a))
      );
      // Refresh global navbar badge
      refreshStatus();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      alert('Could not acknowledge alert. Please check your backend connection.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const severityOptions = ['ALL', 'CRITICAL', 'WARNING', 'INFORMATION'];
  const statusOptions = ['ALL', 'ACTIVE', 'ACKNOWLEDGED'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Emergency Alert Center
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Persistent Triage
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time hazard notifications, telemetry triggers, and operational acknowledgement workflows.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-rose-600" />
          Refresh Alerts
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Severity filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Severity:
          </span>
          {severityOptions.map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                severityFilter === sev
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Status:</span>
          <div className="flex items-center gap-1">
            {statusOptions.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton height="h-36" />
          <LoadingSkeleton height="h-36" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Active Alerts In Current Filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            All environmental warning conditions within nominal thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
            const isAck = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                className={`p-5 sm:p-6 rounded-2xl bg-white border transition shadow-xs space-y-4 ${
                  isCritical && !isAck
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : isWarning && !isAck
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {alert.risk_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Sector: {alert.location_name}
                    </h3>
                  </div>

                  {/* Actions / Acknowledge State */}
                  <div className="flex items-center gap-2 shrink-0">
                    <RiskBadge level={null} score={alert.risk_score} size="md" />
                    {isAck ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <Check className="h-3.5 w-3.5" />
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgingId === alert.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {acknowledgingId === alert.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                        <span>Acknowledge Alert</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Root Cause Analysis */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                  <strong className="block text-slate-900 font-bold uppercase text-[10px] tracking-wider">
                    Telemetry Trigger Cause:
                  </strong>
                  <p className="leading-relaxed">{alert.cause}</p>
                </div>

                {/* Recommended Operational Action */}
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950 flex items-start gap-2.5">
                  <Bell className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Standard Operating Procedure:</strong>
                    <p className="leading-relaxed mt-0.5">{alert.recommended_action}</p>
                  </div>
                </div>

                {/* Acknowledged Timestamp Footer */}
                {isAck && alert.acknowledged_at && (
                  <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Acknowledged by: <strong>{alert.acknowledged_by || 'Operator'}</strong></span>
                    <span>{new Date(alert.acknowledged_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
