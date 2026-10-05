import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { mockOpportunities, AVAILABLE_SKILLS_LIST } from '../data/mockOpportunities';
import type { Opportunity } from '../types';
import { analyzeOpportunityMatch } from '../services/matchingService';
import { OpportunityCard } from '../components/OpportunityCard';
import { OpportunityModal } from '../components/OpportunityModal';
import { LoadingAnalysis } from '../components/LoadingAnalysis';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Filter
} from 'lucide-react';


const TYPE_PILLS = [
  'All',
  'Internship',
  'Hackathon',
  'Scholarship',
  'Certification',
  'Course',
  'Job',
  'Competition'
];

export const Opportunities: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, savedMatches, saveMatch, setActiveMatch } = useStudent();

  // Selected opportunity for modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // AI Loading Screen state
  const [analyzingOpp, setAnalyzingOpp] = useState<Opportunity | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'newest'>('match');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Handle URL query parameter e.g. /opportunities?analyze=opp-1 or /opportunities?type=Internship
  useEffect(() => {
    const analyzeId = searchParams.get('analyze');
    if (analyzeId) {
      const opp = mockOpportunities.find((o) => o.id === analyzeId);
      if (opp) {
        handleStartAnalysis(opp);
      }
      searchParams.delete('analyze');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  // Start analysis trigger
  const handleStartAnalysis = (opportunity: Opportunity) => {
    setAnalyzingOpp(opportunity);
  };

  // Called when LoadingAnalysis finishes its simulated step sequence
  const handleAnalysisComplete = async () => {
    if (!analyzingOpp) return;
    const result = await analyzeOpportunityMatch(profile, analyzingOpp, false);
    saveMatch(result);
    setActiveMatch(result);
    setAnalyzingOpp(null);
    navigate('/match-result');
  };

  const handleViewDetails = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setIsModalOpen(true);
  };

  // Filter & Search Logic
  const filteredOpportunities = useMemo(() => {
    return mockOpportunities.filter((opp) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(query);
        const matchesOrg = opp.organization.toLowerCase().includes(query);
        const matchesDesc = opp.shortDescription.toLowerCase().includes(query);
        const matchesSkill = opp.requiredSkills.some((s) => s.toLowerCase().includes(query));
        if (!matchesTitle && !matchesOrg && !matchesDesc && !matchesSkill) {
          return false;
        }
      }

      // 2. Type filter
      if (selectedType !== 'All' && opp.type !== selectedType) {
        return false;
      }

      // 3. Branch filter
      if (selectedBranch !== 'All') {
        const matchesBranch =
          opp.eligibleBranches.includes('Other') ||
          opp.eligibleBranches.some((b) => b.toLowerCase() === selectedBranch.toLowerCase());
        if (!matchesBranch) return false;
      }

      // 4. Year filter
      if (selectedYear !== 'All') {
        const matchesYear = opp.eligibleYears.some(
          (y) => y.toLowerCase() === selectedYear.toLowerCase()
        );
        if (!matchesYear) return false;
      }

      // 5. Mode filter
      if (selectedMode !== 'All' && opp.mode !== selectedMode) {
        return false;
      }

      // 6. Skill filter
      if (selectedSkill !== 'All') {
        const hasSkill = opp.requiredSkills.some(
          (s) => s.toLowerCase() === selectedSkill.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      // 7. Eligible only filter
      if (eligibleOnly) {
        const isBranchEligible =
          opp.eligibleBranches.includes('Other') ||
          opp.eligibleBranches.includes(profile.branch);
        const isYearEligible = opp.eligibleYears.includes(profile.currentYear);
        const isGpaEligible = opp.minCgpa ? profile.cgpa >= opp.minCgpa : true;
        if (!isBranchEligible || !isYearEligible || !isGpaEligible) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'match') {
        const scoreA = savedMatches[a.id]?.overallMatchPercentage ?? a.defaultMatchScore ?? 80;
        const scoreB = savedMatches[b.id]?.overallMatchPercentage ?? b.defaultMatchScore ?? 80;
        return scoreB - scoreA;
      }
      if (sortBy === 'deadline') {
        return a.deadline.localeCompare(b.deadline);
      }
      return 0;
    });
  }, [
    searchQuery,
    selectedType,
    selectedBranch,
    selectedYear,
    selectedMode,
    selectedSkill,
    eligibleOnly,
    sortBy,
    profile,
    savedMatches
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedBranch('All');
    setSelectedYear('All');
    setSelectedMode('All');
    setSelectedSkill('All');
    setEligibleOnly(false);
    setSortBy('match');
  };

  const activeFiltersCount = [
    selectedType !== 'All',
    selectedBranch !== 'All',
    selectedYear !== 'All',
    selectedMode !== 'All',
    selectedSkill !== 'All',
    eligibleOnly,
    searchQuery.trim().length > 0
  ].filter(Boolean).length;

  // If currently analyzing, render the full-screen AI Loading experience
  if (analyzingOpp) {
    return (
      <LoadingAnalysis
        opportunityTitle={analyzingOpp.title}
        organization={analyzingOpp.organization}
        onComplete={handleAnalysisComplete}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Intelligent Discovery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Explore Opportunities
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Discover opportunities that match your skills, interests and eligibility.
        </p>
      </div>

      {/* Search & Top Action Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-800/80 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              placeholder="Search opportunities by title, company, or skill (e.g. Python, Tech Innovations)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              rightIcon={
                searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : undefined
              }
              className="py-3"
            />
          </div>

          {/* Toggle Advanced Filters Button */}
          <Button
            variant={showAdvancedFilters || activeFiltersCount > 0 ? 'secondary' : 'outline'}
            size="md"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            className="shrink-0 text-xs"
          >
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {/* Sort By Dropdown */}
          <div className="w-full md:w-52 shrink-0">
            <Select
              options={[
                { value: 'match', label: 'Sort: Highest Match %' },
                { value: 'deadline', label: 'Sort: Nearest Deadline' },
                { value: 'newest', label: 'Sort: Default' }
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            />
          </div>
        </div>

        {/* Opportunity Type Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-3 border-t border-slate-800/60 pb-1 scrollbar-none">
          {TYPE_PILLS.map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            <Select
              label="Branch"
              options={['All', 'CSE', 'IT', 'AI & ML', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other']}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            />

            <Select
              label="Academic Year"
              options={['All', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            />

            <Select
              label="Mode"
              options={['All', 'Online', 'Offline', 'Hybrid']}
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            />

            <Select
              label="Required Skill"
              options={['All', ...AVAILABLE_SKILLS_LIST]}
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            />

            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-300">
                  Only show opportunities matching my profile eligibility ({profile.branch}, {profile.currentYear}, CGPA {profile.cgpa})
                </span>
              </label>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
        <div>
          Showing <span className="font-bold text-white">{filteredOpportunities.length}</span> opportunities
          {selectedType !== 'All' && <span> in <strong className="text-indigo-300">{selectedType}</strong></span>}
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <span>Filtered view</span>
            <button
              onClick={resetFilters}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Opportunities Grid */}
      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp) => {
            const saved = savedMatches[opp.id];
            return (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                matchScore={saved?.overallMatchPercentage}
                hasAnalyzed={!!saved}
                onViewDetails={handleViewDetails}
                onAnalyzeMatch={handleStartAnalysis}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Filter className="w-8 h-8" />}
          title="No matching opportunities found"
          description="Try adjusting your search terms or clearing some of the filters to see more results."
          actionText="Clear All Filters"
          onAction={resetFilters}
          className="my-12"
        />
      )}

      {/* Opportunity Details Modal */}
      <OpportunityModal
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAnalyzeMatch={handleStartAnalysis}
      />
    </div>
  );
};
