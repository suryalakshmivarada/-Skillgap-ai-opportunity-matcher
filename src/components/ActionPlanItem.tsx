import React from 'react';
import type { ActionPlanStep } from '../types';

import { Button } from './Button';
import {
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  Code2,
  FileText,
  Send,
  ExternalLink
} from 'lucide-react';

export interface ActionPlanItemProps {
  step: ActionPlanStep;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onStartLearning?: (step: ActionPlanStep) => void;
  onApplyNow?: (step: ActionPlanStep) => void;
  isLast?: boolean;
}

export const ActionPlanItem: React.FC<ActionPlanItemProps> = ({
  step,
  isCompleted,
  onToggleComplete,
  onStartLearning,
  onApplyNow,
  isLast = false
}) => {
  const getCategoryIcon = () => {
    switch (step.category) {
      case 'learning':
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case 'project':
        return <Code2 className="w-4 h-4 text-purple-400" />;
      case 'resume':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'application':
        return <Send className="w-4 h-4 text-emerald-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative flex items-start gap-4 md:gap-6 group">
      {/* Timeline track line */}
      {!isLast && (
        <div
          className={`absolute left-5 top-11 bottom-0 w-0.5 transition-colors duration-300 ${
            isCompleted ? 'bg-emerald-500/40' : 'bg-slate-800'
          }`}
        />
      )}

      {/* Step Circle Indicator */}
      <button
        type="button"
        onClick={() => onToggleComplete(step.id)}
        className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 border cursor-pointer ${
          isCompleted
            ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-400 hover:text-white'
        }`}
        title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
      >
        {isCompleted ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <span className="font-bold text-sm">0{step.stepNumber}</span>
        )}
      </button>

      {/* Step Card Content */}
      <div
        className={`flex-1 glass-panel rounded-2xl p-5 md:p-6 border transition-all duration-200 mb-6 ${
          isCompleted
            ? 'border-emerald-500/30 bg-emerald-950/10'
            : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              {getCategoryIcon()}
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Step {step.stepNumber}
            </span>
            {step.skillTarget && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                {step.skillTarget}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800 w-fit">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{step.duration}</span>
          </div>
        </div>

        <h3
          className={`text-lg font-bold mb-2 transition-colors ${
            isCompleted ? 'text-slate-300 line-through decoration-emerald-500/60' : 'text-white'
          }`}
        >
          {step.title}
        </h3>

        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          {step.description}
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/60">
          {step.category === 'application' ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => onApplyNow?.(step)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              rightIcon={<ExternalLink className="w-3 h-3" />}
            >
              Apply Now
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartLearning?.(step)}
              leftIcon={<BookOpen className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Start Learning
            </Button>
          )}

          <Button
            variant={isCompleted ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => onToggleComplete(step.id)}
            leftIcon={
              isCompleted ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-400" />
              )
            }
          >
            {isCompleted ? 'Completed' : 'Mark as Completed'}
          </Button>
        </div>
      </div>
    </div>
  );
};
