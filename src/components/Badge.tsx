import React from 'react';
import type { OpportunityType } from '../types';


export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  typeBadge?: OpportunityType;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  typeBadge,
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 font-medium rounded-lg gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold rounded-xl gap-2'
  };

  // Determine variant based on OpportunityType if provided
  let effectiveVariant = variant || 'neutral';
  if (typeBadge) {
    switch (typeBadge) {
      case 'Internship':
        effectiveVariant = 'primary';
        break;
      case 'Hackathon':
        effectiveVariant = 'warning';
        break;
      case 'Scholarship':
        effectiveVariant = 'purple';
        break;
      case 'Certification':
        effectiveVariant = 'info';
        break;
      case 'Course':
        effectiveVariant = 'success';
        break;
      case 'Job':
        effectiveVariant = 'primary';
        break;
      case 'Competition':
        effectiveVariant = 'danger';
        break;
    }
  }

  const variantStyles = {
    primary: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    info: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    neutral: 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
  };

  const dotColors = {
    primary: 'bg-indigo-400',
    purple: 'bg-purple-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-cyan-400',
    neutral: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center tracking-wide leading-none whitespace-nowrap ${sizeStyles[size]} ${variantStyles[effectiveVariant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[effectiveVariant]} animate-pulse`}
        />
      )}
      {children || typeBadge}
    </span>
  );
};
