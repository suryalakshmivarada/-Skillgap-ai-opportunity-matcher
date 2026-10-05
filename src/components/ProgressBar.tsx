import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  subLabel?: string;
  showPercentage?: boolean;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  subLabel,
  showPercentage = true,
  color = 'indigo',
  size = 'md',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colorStyles = {
    indigo: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
    emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    amber: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    rose: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]',
    gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 shadow-[0_0_16px_rgba(99,102,241,0.4)]'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1.5">
            <span>{label}</span>
            {subLabel && <span className="text-slate-500 text-[11px]">({subLabel})</span>}
          </div>
          {showPercentage && (
            <span className="font-semibold text-slate-200 tabular-nums">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/40 ${sizeStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
