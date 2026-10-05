import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { ActionPlanItem } from '../components/ActionPlanItem';
import { LearningResourceModal } from '../components/LearningResourceModal';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import type { ActionPlanStep } from '../types';
import {
  ListTodo,
  Sparkles,
  ArrowRight,
  Send,
  Building2,
  Trophy,
  ExternalLink,
  PartyPopper
} from 'lucide-react';


export const ActionPlan: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeMatch,
    savedMatches,
    setActiveMatch,
    toggleTaskCompletion,
    isTaskCompleted
  } = useStudent();

  // Pick current active match or fallback to first saved match
  const match = activeMatch || Object.values(savedMatches)[0];

  // Learning resource modal state
  const [selectedStepForResource, setSelectedStepForResource] = useState<ActionPlanStep | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Application confirmation popup state
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  if (!match) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
          <ListTodo className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Active Action Plan</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Generate an action plan by analyzing an opportunity from our discovery dashboard.
        </p>
        <Button variant="primary" onClick={() => navigate('/opportunities')}>
          Explore Opportunities
        </Button>
      </div>
    );
  }

  const steps = match.actionPlan || [];
  const completedCount = steps.filter((s) => isTaskCompleted(s.id)).length;
  const totalCount = steps.length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  const handleOpenLearningResource = (step: ActionPlanStep) => {
    setSelectedStepForResource(step);
    setIsResourceModalOpen(true);
  };

  const handleApplyNow = (step: ActionPlanStep) => {
    if (step.resourceLink && step.resourceLink !== '#') {
      window.open(step.resourceLink, '_blank', 'noopener,noreferrer');
    }
    setAppliedNotification(`Application launched for ${match.opportunityTitle} at ${match.organization}!`);
    setTimeout(() => {
      setAppliedNotification(null);
    }, 4500);
  };

  // Switcher if multiple matches exist
  const savedList = Object.values(savedMatches);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner / Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Guided Preparation Roadmap</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Your Personalized Action Plan
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here is what you can do next to become a stronger candidate.
          </p>
        </div>

        {/* Opportunity Switcher if user has analyzed multiple opportunities */}
        {savedList.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target:</span>
            <select
              value={match.opportunityId}
              onChange={(e) => {
                const target = savedMatches[e.target.value];
                if (target) setActiveMatch(target);
              }}
              className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {savedList.map((m) => (
                <option key={m.opportunityId} value={m.opportunityId}>
                  {m.opportunityTitle} ({m.overallMatchPercentage}%)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {appliedNotification && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in duration-300 shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <Send className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
          <button
            onClick={() => setAppliedNotification(null)}
            className="text-xs underline text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Target Opportunity Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Roadmap tailored for:</div>
            <div className="text-base font-bold text-white">
              {match.opportunityTitle}{' '}
              <span className="text-slate-400 font-normal">at {match.organization}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/match-result"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Review Full Match Analysis ({match.overallMatchPercentage}%)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Live Progress Card */}
      <div className="glass-panel glass-card-glow rounded-3xl p-6 sm:p-8 border border-indigo-500/30 mb-10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Preparation Progress
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{completedCount} of {totalCount} tasks completed</span>
              {isAllCompleted && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <PartyPopper className="w-3 h-3" /> Ready to Apply!
                </span>
              )}
            </h2>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-2xl font-black text-indigo-400">
              {Math.round((completedCount / (totalCount || 1)) * 100)}%
            </span>
            <div className="text-[11px] text-slate-400">Readiness Score</div>
          </div>
        </div>

        <ProgressBar
          value={completedCount}
          max={totalCount}
          showPercentage={false}
          color={isAllCompleted ? 'emerald' : 'gradient'}
          size="lg"
        />

        {isAllCompleted && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Outstanding job! You have satisfied all prerequisite milestones. You are now positioned in the top 10% candidate tier for this role.
            </span>
          </div>
        )}
      </div>

      {/* Action Plan Roadmap Steps */}
      <div className="relative pl-1 sm:pl-4 mb-10">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-indigo-400" />
          <span>Preparation Timeline & Milestones</span>
        </div>

        {steps.map((step, idx) => (
          <ActionPlanItem
            key={step.id}
            step={step}
            isCompleted={isTaskCompleted(step.id)}
            onToggleComplete={toggleTaskCompletion}
            onStartLearning={handleOpenLearningResource}
            onApplyNow={handleApplyNow}
            isLast={idx === steps.length - 1}
          />
        ))}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          Track your progress over time. Completed steps boost your match profile.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/my-matches')}
            className="w-full sm:w-auto text-xs"
          >
            View All Saved Matches
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => {
              const applyStep = steps.find((s) => s.category === 'application');
              if (applyStep) handleApplyNow(applyStep);
            }}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            rightIcon={<ExternalLink className="w-3 h-3" />}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            Apply Now
          </Button>
        </div>
      </div>

      {/* Interactive Learning Resource Modal */}
      <LearningResourceModal
        step={selectedStepForResource}
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onCompleteStep={(stepId) => {
          if (!isTaskCompleted(stepId)) {
            toggleTaskCompletion(stepId);
          }
        }}
        isCompleted={selectedStepForResource ? isTaskCompleted(selectedStepForResource.id) : false}
      />
    </div>
  );
};
