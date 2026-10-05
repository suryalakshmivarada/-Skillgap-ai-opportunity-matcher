import React from 'react';
import type { Opportunity } from '../types';

import { Badge } from './Badge';
import { SkillTag } from './SkillTag';
import { Button } from './Button';
import {
  X,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Award,
  ExternalLink,
  GraduationCap
} from 'lucide-react';

export interface OpportunityModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeMatch: (opportunity: Opportunity) => void;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onAnalyzeMatch
}) => {
  if (!isOpen || !opportunity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700/80 p-6 md:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
              opportunity.logoBg || 'from-indigo-600 to-purple-600'
            } flex items-center justify-center text-white font-extrabold text-xl shadow-lg shrink-0`}
          >
            {opportunity.logoText || opportunity.organization.slice(0, 2).toUpperCase()}
          </div>
          <div className="pr-8">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{opportunity.organization}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              {opportunity.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge typeBadge={opportunity.type} size="sm" />
              <span className="text-xs text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {opportunity.mode}
              </span>
              {opportunity.location && (
                <span className="text-xs text-slate-400">({opportunity.location})</span>
              )}
            </div>
          </div>
        </div>

        {/* Key Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 mb-6 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Application Deadline</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {opportunity.deadline}
            </span>
          </div>
          {opportunity.duration && (
            <div>
              <span className="text-slate-500 block mb-0.5">Duration</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {opportunity.duration}
              </span>
            </div>
          )}
          {opportunity.stipendOrPrize && (
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block mb-0.5">Perk / Stipend</span>
              <span className="font-semibold text-emerald-300 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {opportunity.stipendOrPrize}
              </span>
            </div>
          )}
        </div>

        {/* Full Description */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
            About the Opportunity
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {opportunity.fullDescription}
          </p>
        </div>

        {/* Required Skills */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2.5">
            Required Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {opportunity.requiredSkills.map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
          </div>
        </div>

        {/* Eligibility Requirements */}
        <div className="mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            Eligibility Requirements
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>
                <strong>Eligible Branches:</strong> {opportunity.eligibleBranches.join(', ')}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>
                <strong>Eligible Years:</strong> {opportunity.eligibleYears.join(', ')}
              </span>
            </li>
            {opportunity.minCgpa && (
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>
                  <strong>Minimum Academic Requirement:</strong> {opportunity.minCgpa} CGPA / 65%
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {opportunity.applicationUrl ? (
            <a
              href={opportunity.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 order-2 sm:order-1"
            >
              <span>View Official Announcement</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
            <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onAnalyzeMatch(opportunity);
              }}
              className="w-full sm:w-auto"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Analyze My Match
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
