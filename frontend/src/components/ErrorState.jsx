import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Backend Connection Unavailable',
  message = 'Unable to reach the AquaNex API server. Please verify the backend is running.',
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center my-6 max-w-xl mx-auto shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      )}
    </div>
  );
}
