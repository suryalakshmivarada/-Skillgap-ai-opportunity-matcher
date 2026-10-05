import React from 'react';
import { SearchX, Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl border border-slate-800/80 max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
        {icon || <SearchX className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={<Sparkles className="w-4 h-4" />}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
