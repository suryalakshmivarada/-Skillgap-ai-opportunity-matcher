import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { mockOpportunities } from '../data/mockOpportunities';
import { analyzeOpportunityMatch } from '../services/matchingService';
import { MatchScore } from '../components/MatchScore';
import { ProgressBar } from '../components/ProgressBar';
import { SkillTag } from '../components/SkillTag';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Brain,
  ListTodo,
  Compass,
  Building2,
  GraduationCap
} from 'lucide-react';

export const MatchResult: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { activeMatch, savedMatches, profile, saveMatch, setActiveMatch } = useStudent();

  // If URL has :id parameter (e.g. /matches/:id), check savedMatches or run instant analysis
  const [match, setMatch] = React.useState(activeMatch || (id ? savedMatches[id] : undefined) || Object.values(savedMatches)[0]);

  React.useEffect(() => {
    if (id && (!match || match.opportunityId !== id)) {
      if (savedMatches[id]) {
        setMatch(savedMatches[id]);
        setActiveMatch(savedMatches[id]);
      } else {
        const opp = mockOpportunities.find((o) => o.id === id);
        if (opp) {
          analyzeOpportunityMatch(profile, opp, false).then((res) => {
            saveMatch(res);
            setActiveMatch(res);
            setMatch(res);
          });
        }
      }
    } else if (!match && Object.values(savedMatches).length > 0) {
      setMatch(activeMatch || Object.values(savedMatches)[0]);
    }
  }, [id, savedMatches, activeMatch, profile, saveMatch, setActiveMatch, match]);


  if (!match) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
          <Brain className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Analysis Selected</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Please select an opportunity to run an AI Match Analysis.
        </p>
        <Button variant="primary" onClick={() => navigate('/opportunities')}>
          Explore Opportunities
        </Button>
      </div>
    );
  }

  const {
    opportunityTitle,
    organization,
    opportunityType,
    overallMatchPercentage,
    skillMatchPercentage,
    interestMatchPercentage,
    eligibilityScore,
    matchGrade,
    whyYouMatch,
    matchedSkills,
    missingSkills,
    eligibility
  } = match;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/opportunities"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Back to Opportunities</span>
        </Link>

        <div className="text-xs text-slate-500">
          Analysis ID: <span className="font-mono text-slate-400">{match.id.slice(0, 15)}...</span>
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-indigo-500/30 shadow-2xl relative mb-10 overflow-hidden">
        {/* Subtle background gradient glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Opportunity Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Match Intelligence Report</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Your AI Match Analysis
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
            <span className="text-slate-200 font-semibold">{opportunityTitle}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              {organization}
            </span>
            <span>•</span>
            <Badge typeBadge={opportunityType} size="sm" />
          </div>
        </div>

        {/* Top Hero Section: Match Score Gauge & Match Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-800/90 mb-10">
          {/* Left: Large Circular Match Score */}
          <div className="md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
            <MatchScore
              score={overallMatchPercentage}
              grade={matchGrade}
              size="hero"
            />
          </div>

          {/* Right: Section 9 Match Breakdown Progress Bars */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-1">
                Multi-Dimensional Match Breakdown
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Component breakdown calculated across your technical stack, verified interests, and university criteria.
              </p>
            </div>

            <div className="space-y-3.5">
              <ProgressBar
                label="Skills Match"
                subLabel="Core technical stack overlap"
                value={skillMatchPercentage}
                color="indigo"
                size="md"
              />

              <ProgressBar
                label="Interest Alignment"
                subLabel="Domain and problem space compatibility"
                value={interestMatchPercentage}
                color="emerald"
                size="md"
              />

              <ProgressBar
                label="Academic Eligibility"
                subLabel="Branch, graduation year & GPA criteria"
                value={eligibilityScore}
                color="gradient"
                size="md"
              />

              <ProgressBar
                label="Overall Opportunity Fit"
                subLabel="Weighted synthesis score"
                value={overallMatchPercentage}
                color="indigo"
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Section 8 Part 1: Why You Match */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Why You Match
            </h2>
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              Explainable AI Signals
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {whyYouMatch.map((reason, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 8 Part 2: Skills Matched vs Missing Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Matched Skills */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Skills Matched
              </h3>
              <span className="text-xs font-semibold text-emerald-400">
                {matchedSkills.length} Verified
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Your profile satisfies the following key prerequisites for this role:
            </p>

            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <SkillTag key={skill} skill={skill} status="matched" />
              ))}
              {matchedSkills.length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  No direct skills matched yet.
                </span>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-950/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Missing Skills (Skill Gaps)
              </h3>
              <span className="text-xs font-semibold text-amber-400">
                {missingSkills.length} Identified
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Developing these skills can significantly improve your suitability and interview conversion:
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {missingSkills.map((skill) => (
                <SkillTag key={skill} skill={skill} status="missing" />
              ))}
              {missingSkills.length === 0 && (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  You have covered all required skills!
                </div>
              )}
            </div>

            <div className="text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <strong>Tip:</strong> You can fast-track these competencies with the step-by-step roadmap in your Action Plan.
            </div>
          </div>
        </div>

        {/* Section 8 Part 3: Eligibility Status */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              Academic Eligibility
            </h3>

            {eligibility.isEligible ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Eligible
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Not Fully Eligible
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                eligibility.branchSatisfied
                  ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              {eligibility.branchSatisfied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="text-xs font-medium">Branch requirement satisfied</span>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                eligibility.yearSatisfied
                  ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              {eligibility.yearSatisfied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="text-xs font-medium">Year requirement satisfied</span>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                eligibility.academicSatisfied
                  ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              {eligibility.academicSatisfied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="text-xs font-medium">Academic requirement satisfied</span>
            </div>
          </div>
        </div>

        {/* Section 10 CTA: Action Plan Banner */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/60 p-6 sm:p-8 rounded-3xl border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-indigo-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Recommended Next Steps</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              Personalized Action Plan Ready
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              We generated a 4-step preparation roadmap to bridge your missing skills ({missingSkills.slice(0, 2).join(', ') || 'specializations'}) before applying.
            </p>
          </div>

          <Button
            variant="gradient"
            size="lg"
            onClick={() => navigate('/action-plan')}
            leftIcon={<ListTodo className="w-5 h-5" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0 shadow-lg shadow-indigo-600/30 font-bold"
          >
            View Personalized Action Plan
          </Button>
        </div>
      </div>
    </div>
  );
};
