import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Opportunity } from '../types';
import { getOpportunityById } from '../services/opportunityService';
import { useStudent } from '../context/StudentContext';
import { analyzeOpportunityMatch } from '../services/matchingService';
import { Badge } from '../components/Badge';
import { SkillTag } from '../components/SkillTag';
import { Button } from '../components/Button';
import { LoadingAnalysis } from '../components/LoadingAnalysis';
import {
  Building2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Award,
  ExternalLink,
  GraduationCap,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export const OpportunityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, savedMatches, saveMatch, setActiveMatch } = useStudent();
  const [opportunity, setOpportunity] = useState<Opportunity | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      getOpportunityById(id).then((opp) => {
        setOpportunity(opp);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-400">
        Loading opportunity details...
      </div>
    );
  }


  if (!opportunity) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Opportunity Not Found</h2>
        <p className="text-slate-400 mb-6 text-sm">
          The opportunity you are looking for may have expired or does not exist.
        </p>
        <Button variant="primary" onClick={() => navigate('/opportunities')}>
          Back to Opportunities
        </Button>
      </div>
    );
  }

  const existingMatch = savedMatches[opportunity.id];

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
  };

  const handleAnalysisComplete = async () => {
    const result = await analyzeOpportunityMatch(profile, opportunity, false);
    saveMatch(result);
    setActiveMatch(result);
    setIsAnalyzing(false);
    navigate('/match-result');
  };

  if (isAnalyzing) {
    return (
      <LoadingAnalysis
        opportunityTitle={opportunity.title}
        organization={opportunity.organization}
        onComplete={handleAnalysisComplete}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Opportunities</span>
      </Link>

      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800/80 shadow-2xl relative">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                opportunity.logoBg || 'from-indigo-600 to-violet-600'
              } flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shrink-0`}
            >
              {opportunity.logoText || opportunity.organization.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{opportunity.organization}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                {opportunity.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge typeBadge={opportunity.type} size="sm" />
                <span className="text-xs text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {opportunity.mode}
                </span>
                {opportunity.location && (
                  <span className="text-xs text-slate-400 font-medium">
                    ({opportunity.location})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col gap-2">
            <Button
              variant="gradient"
              size="lg"
              onClick={handleStartAnalysis}
              leftIcon={<Sparkles className="w-5 h-5" />}
              className="shadow-xl shadow-indigo-600/30"
            >
              {existingMatch ? 'Re-Analyze Match' : 'Analyze My Match'}
            </Button>
            {existingMatch && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveMatch(existingMatch);
                  navigate('/match-result');
                }}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              >
                View Existing Result ({existingMatch.overallMatchPercentage}%)
              </Button>
            )}
          </div>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 my-8 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Application Cutoff</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {opportunity.deadline}
            </span>
          </div>
          {opportunity.duration && (
            <div>
              <span className="text-slate-500 block mb-1">Duration</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-purple-400" />
                {opportunity.duration}
              </span>
            </div>
          )}
          {opportunity.stipendOrPrize && (
            <div className="col-span-2">
              <span className="text-slate-500 block mb-1">Stipend / Prize Pool</span>
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5 text-sm">
                <Award className="w-4 h-4" />
                {opportunity.stipendOrPrize}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3">
            Opportunity Overview
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            {opportunity.fullDescription}
          </p>
        </div>

        {/* Required Skills */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3">
            Required Technical Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {opportunity.requiredSkills.map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Eligibility Criteria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Eligible Branches</span>
              <span className="font-semibold text-slate-200">
                {opportunity.eligibleBranches.join(', ')}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Eligible Years</span>
              <span className="font-semibold text-slate-200">
                {opportunity.eligibleYears.join(', ')}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Minimum CGPA</span>
              <span className="font-semibold text-slate-200">
                {opportunity.minCgpa ? `${opportunity.minCgpa} / 10.0` : 'No CGPA cutoff'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info & External Application link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
          {opportunity.applicationUrl ? (
            <a
              href={opportunity.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5"
            >
              <span>Visit Official Application Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="md"
            onClick={handleStartAnalysis}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Analyze My Match
          </Button>
        </div>
      </div>
    </div>
  );
};
