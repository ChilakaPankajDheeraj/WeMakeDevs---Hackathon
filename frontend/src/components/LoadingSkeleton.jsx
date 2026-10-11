import React from 'react';

export default function LoadingSkeleton({ lines = 3, height = 'h-24' }) {
  return (
    <div className={`w-full rounded-2xl bg-white border border-slate-100 p-6 shadow-sm animate-pulse ${height}`}>
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
}
