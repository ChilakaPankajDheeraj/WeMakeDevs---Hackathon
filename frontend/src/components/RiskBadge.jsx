import React from 'react';

export function getRiskColors(level, score = null) {
  const lvl = (level || '').toUpperCase();
  if (lvl === 'CRITICAL' || (score !== null && score > 80)) {
    return {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'CRITICAL',
    };
  }
  if (lvl === 'HIGH' || (score !== null && score > 60)) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      label: 'HIGH',
    };
  }
  if (lvl === 'MODERATE' || (score !== null && score > 30)) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'MODERATE',
    };
  }
  return {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'LOW',
  };
}

export default function RiskBadge({ level, score = null, size = 'md', showDot = true }) {
  const { bg, text, border, dot, label } = getRiskColors(level, score);

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs font-semibold'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-bold'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${text} ${border} ${sizeClasses}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dot} shrink-0`} />}
      <span>{label}</span>
      {score !== null && (
        <span className="opacity-80 font-mono text-[11px]">({Math.round(score)})</span>
      )}
    </span>
  );
}
