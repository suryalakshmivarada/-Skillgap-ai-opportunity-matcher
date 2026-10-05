import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import type { MatchResult } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SkillTag } from '../components/SkillTag';
import { EmptyState } from '../components/EmptyState';
import {
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Brain,
  ListTodo,
  Layers,
  Building2,
  AlertTriangle,
  Award
} from 'lucide-react';


export const MyMatches: React.FC = () => {
  const navigate = useNavigate();
  const { savedMatches, setActiveMatch } = useStudent();
  const [filterTab, setFilterTab] = useState<'All' | 'Excellent Match' | 'Good Match' | 'Needs Improvement'>('All');

  const matchesList = useMemo(() => Object.values(savedMatches), [savedMatches]);

  const filteredMatches = useMemo(() => {
    if (filterTab === 'All') return matchesList;
    return matchesList.filter((m) => m.matchGrade === filterTab);
  }, [matchesList, filterTab]);

  // Summary Metrics
  const totalAnalyzed = matchesList.length;
  const avgScore =
    totalAnalyzed > 0
      ? Math.round(
          matchesList.reduce((acc, m) => acc + m.overallMatchPercentage, 0) / totalAnalyzed
        )
      : 0;

  // Aggregate missing skills to show top skill gaps
  const topGaps = useMemo(() => {
    const counts: Record<string, number> = {};
    matchesList.forEach((m) => {
      m.missingSkills.forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [matchesList]);

  const handleInspectMatch = (match: MatchResult) => {
    setActiveMatch(match);
    navigate('/match-result');
  };

  const handleViewActionPlan = (match: MatchResult) => {
    setActiveMatch(match);
    navigate('/action-plan');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Candidate Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Analyzed Matches
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track and compare your fit across analyzed opportunities.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/opportunities')}
          leftIcon={<Sparkles className="w-4 h-4" />}
          className="self-start sm:self-auto text-xs"
        >
          Analyze More Opportunities
        </Button>
      </div>

      {/* Analytics Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalAnalyzed}</div>
            <div className="text-xs text-slate-400">Total Analyzed Roles</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{avgScore}%</div>
            <div className="text-xs text-slate-400">Average Match Score</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white line-clamp-1">
              {topGaps.length > 0 ? topGaps.map((g) => g[0]).slice(0, 2).join(', ') : 'None'}
            </div>
            <div className="text-xs text-slate-400">Top High-Impact Skill Gaps</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-800">
        {(['All', 'Excellent Match', 'Good Match', 'Needs Improvement'] as const).map((tab) => {
          const count =
            tab === 'All'
              ? matchesList.length
              : matchesList.filter((m) => m.matchGrade === tab).length;

          const isActive = filterTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((item) => {
            let scoreColor = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
            if (item.overallMatchPercentage < 70) {
              scoreColor = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
            } else if (item.overallMatchPercentage < 85) {
              scoreColor = 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30';
            }

            return (
              <div
                key={item.id}
                className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between border border-slate-800/80 hover:border-indigo-500/40"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{item.organization}</span>
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-1">
                        {item.opportunityTitle}
                      </h3>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 flex items-center gap-1 ${scoreColor}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{item.overallMatchPercentage}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge typeBadge={item.opportunityType} size="sm" />
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {item.matchGrade}
                    </span>
                  </div>

                  {/* Skills Matched summary */}
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Matched Skills ({item.matchedSkills.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.matchedSkills.slice(0, 3).map((s) => (
                        <SkillTag key={s} skill={s} status="matched" size="sm" />
                      ))}
                      {item.matchedSkills.length > 3 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{item.matchedSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills summary */}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Missing Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.missingSkills.length > 0 ? (
                        item.missingSkills.slice(0, 2).map((s) => (
                          <SkillTag key={s} skill={s} status="missing" size="sm" />
                        ))
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium">
                          No missing skills!
                        </span>
                      )}
                      {item.missingSkills.length > 2 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{item.missingSkills.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInspectMatch(item)}
                    className="w-full text-xs"
                  >
                    View Analysis
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewActionPlan(item)}
                    leftIcon={<ListTodo className="w-3.5 h-3.5 text-indigo-400" />}
                    className="w-full text-xs"
                  >
                    Action Plan
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Award className="w-8 h-8" />}
          title="No opportunities in this tier yet"
          description={
            filterTab === 'All'
              ? 'You have not analyzed any opportunities yet. Head over to Explore Opportunities to run your first match analysis!'
              : `No analyzed opportunities classified as ${filterTab}. Try exploring other roles.`
          }
          actionText="Find Opportunities"
          onAction={() => navigate('/opportunities')}
          className="my-12"
        />
      )}
    </div>
  );
};
