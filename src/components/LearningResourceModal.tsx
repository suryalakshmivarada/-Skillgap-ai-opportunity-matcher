import React from 'react';
import type { ActionPlanStep } from '../types';

import { Button } from './Button';
import {
  X,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
  Video,
  FileCode2,
  Sparkles
} from 'lucide-react';

export interface LearningResourceModalProps {
  step: ActionPlanStep | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteStep: (stepId: string) => void;
  isCompleted: boolean;
}

export const LearningResourceModal: React.FC<LearningResourceModalProps> = ({
  step,
  isOpen,
  onClose,
  onCompleteStep,
  isCompleted
}) => {
  if (!isOpen || !step) return null;

  const skill = step.skillTarget || 'Target Skill';

  const mockCuratedResources = [
    {
      title: `${skill} Fundamentals & Quickstart Handbook`,
      type: 'Documentation / Interactive Guide',
      icon: BookOpen,
      duration: '4 hours',
      link: `https://www.google.com/search?q=${encodeURIComponent(skill)}+official+documentation+quickstart`
    },
    {
      title: `Zero to Hero in ${skill}: Video Masterclass`,
      type: 'Guided Video Series',
      icon: Video,
      duration: '6 hours',
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill)}+crash+course+for+beginners`
    },
    {
      title: `Hands-on Portfolio Starter Project with ${skill}`,
      type: 'GitHub Repository & Code Sandbox',
      icon: FileCode2,
      duration: '1 weekend',
      link: `https://github.com/topics/${encodeURIComponent(skill.toLowerCase().replace(/\s+/g, '-'))}`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-xl rounded-3xl border border-indigo-500/30 p-6 md:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Personalized Learning Accelerator
            </div>
            <h3 className="text-xl font-bold text-white">{step.title}</h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          {step.description}
        </p>

        {/* Curated Resources List */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Curated Fast-Track Resources
          </h4>

          {mockCuratedResources.map((res, i) => {
            const Icon = res.icon;
            return (
              <a
                key={i}
                href={res.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {res.title}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{res.type}</span>
                      <span>•</span>
                      <span className="text-slate-500">{res.duration}</span>
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              </a>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Back to Plan
          </Button>

          <Button
            variant={isCompleted ? 'secondary' : 'success'}
            size="sm"
            onClick={() => {
              onCompleteStep(step.id);
              onClose();
            }}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isCompleted ? 'Keep as Done' : 'Mark as Completed & Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};
