import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export interface SkillTagProps {
  skill: string;
  status?: 'neutral' | 'matched' | 'missing' | 'selectable';
  isSelected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const SkillTag: React.FC<SkillTagProps> = ({
  skill,
  status = 'neutral',
  isSelected = false,
  onRemove,
  onClick,
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5'
  };

  let colorStyles = 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60';

  if (status === 'matched') {
    colorStyles = 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30';
  } else if (status === 'missing') {
    colorStyles = 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30';
  } else if (status === 'selectable') {
    colorStyles = isSelected
      ? 'bg-indigo-600 text-white border border-indigo-400 shadow-sm shadow-indigo-500/30'
      : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer';
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-medium rounded-lg transition-all duration-150 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${sizeStyles[size]} ${colorStyles} ${className}`}
    >
      {status === 'matched' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
      {status === 'missing' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
      <span>{skill}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/20 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          title={`Remove ${skill}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
};
