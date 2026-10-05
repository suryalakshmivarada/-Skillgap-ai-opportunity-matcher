import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Brain, Cpu, Zap } from 'lucide-react';

export interface LoadingAnalysisProps {
  opportunityTitle: string;
  organization: string;
  onComplete: () => void;
}

interface StepItem {
  id: number;
  label: string;
  detail: string;
}

const ANALYSIS_STEPS: StepItem[] = [
  { id: 1, label: 'Checking your skills', detail: 'Parsing core competencies and programming languages...' },
  { id: 2, label: 'Comparing interests & goals', detail: 'Evaluating domain fit and candidate trajectory...' },
  { id: 3, label: 'Checking academic eligibility', detail: 'Verifying branch, year, and GPA thresholds...' },
  { id: 4, label: 'Identifying skill gaps', detail: 'Calculating missing requirements and prerequisites...' },
  { id: 5, label: 'Creating personalized recommendations', detail: 'Synthesizing tailored action plan & roadmap...' }
];

export const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({
  opportunityTitle,
  organization,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Step progression timer
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 700);

    // Call onComplete after all steps finish + slight pause
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const progressPercent = Math.min(100, Math.round((currentStepIndex / ANALYSIS_STEPS.length) * 100));

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 border border-indigo-500/30 shadow-2xl shadow-indigo-950/60 relative overflow-hidden text-center">
        {/* Glowing background aura */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Central Animated Orb */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/40 animate-spin-slow" />
          <div className="absolute -inset-2 rounded-full border border-purple-500/30 animate-pulse-subtle" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/40">
            <Brain className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-slate-700">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
        </div>

        {/* Headline */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Explainable AI Engine</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1.5">
          Analyzing your profile...
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Matching candidate profile against <span className="text-slate-200 font-semibold">{opportunityTitle}</span> at <span className="text-indigo-300">{organization}</span>
        </p>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 mb-8 overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Sequential Animated Steps */}
        <div className="space-y-3 text-left bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
          {ANALYSIS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 transition-all duration-300 ${
                  isPending ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  )}
                  {isPending && (
                    <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      isCompleted
                        ? 'text-slate-200'
                        : isCurrent
                        ? 'text-indigo-300 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  {isCurrent && (
                    <p className="text-xs text-indigo-400/80 mt-0.5 animate-pulse">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Cpu className="w-3.5 h-3.5 text-slate-500" />
          <span>Generating multi-dimensional match matrix & roadmap...</span>
        </div>
      </div>
    </div>
  );
};
