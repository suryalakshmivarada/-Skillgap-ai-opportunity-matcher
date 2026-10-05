import React from 'react';
import type { Opportunity } from '../types';

import { Badge } from './Badge';
import { SkillTag } from './SkillTag';
import { Button } from './Button';
import {
  Calendar,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Building2,
  CheckCircle2
} from 'lucide-react';

export interface OpportunityCardProps {
  opportunity: Opportunity;
  matchScore?: number;
  onViewDetails: (opportunity: Opportunity) => void;
  onAnalyzeMatch: (opportunity: Opportunity) => void;
  hasAnalyzed?: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  matchScore,
  onViewDetails,
  onAnalyzeMatch,
  hasAnalyzed = false
}) => {
  const displayScore = matchScore ?? opportunity.defaultMatchScore ?? 85;

  let scoreBadgeColor = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
  if (displayScore < 70) {
    scoreBadgeColor = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
  } else if (displayScore < 85) {
    scoreBadgeColor = 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30';
  }

  return (
    <div className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between h-full border border-slate-800/80 hover:border-indigo-500/40 group relative overflow-hidden">
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent group-hover:via-indigo-500 transition-all duration-300" />

      <div>
        {/* Header: Organization, Type & Match Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                opportunity.logoBg || 'from-indigo-600 to-violet-600'
              } flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
            >
              {opportunity.logoText || opportunity.organization.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-medium text-slate-300">{opportunity.organization}</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mt-0.5">
                {opportunity.title}
              </h3>
            </div>
          </div>

          {/* Match Score Badge */}
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 flex items-center gap-1.5 ${scoreBadgeColor}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{displayScore}% Match</span>
          </div>
        </div>

        {/* Badges: Type & Mode */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge typeBadge={opportunity.type} size="sm" />
          <span className="text-xs text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            {opportunity.mode}
          </span>
          {opportunity.stipendOrPrize && (
            <span className="text-xs text-slate-300 font-medium bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800">
              {opportunity.stipendOrPrize}
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {opportunity.shortDescription}
        </p>

        {/* Required Skills */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Required Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.requiredSkills.slice(0, 4).map((skill) => (
              <SkillTag key={skill} skill={skill} size="sm" />
            ))}
            {opportunity.requiredSkills.length > 4 && (
              <span className="text-[11px] px-2 py-0.5 text-slate-400 bg-slate-900 rounded-md border border-slate-800">
                +{opportunity.requiredSkills.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Metadata info: Branch, Year, Deadline */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 mb-5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate" title={`Eligible: ${opportunity.eligibleBranches.join(', ')}`}>
              {opportunity.eligibleBranches.slice(0, 2).join(' / ')}
              {opportunity.eligibleBranches.length > 2 ? ' +' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate font-medium text-slate-300">
              {opportunity.deadline}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(opportunity)}
          className="w-full text-xs"
        >
          View Details
        </Button>
        <Button
          variant={hasAnalyzed ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onAnalyzeMatch(opportunity)}
          className="w-full text-xs"
          leftIcon={hasAnalyzed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
          rightIcon={!hasAnalyzed ? <ArrowRight className="w-3 h-3" /> : undefined}
        >
          {hasAnalyzed ? 'View Match' : 'Analyze Match'}
        </Button>
      </div>
    </div>
  );
};
