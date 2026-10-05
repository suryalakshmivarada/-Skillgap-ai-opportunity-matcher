import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_DEMO_PROFILE } from '../context/StudentContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import type {
  BranchOption,
  YearOption,
  OpportunityType,
  OpportunityMode
} from '../types';

import {
  AVAILABLE_SKILLS_LIST,
  AVAILABLE_INTERESTS_LIST
} from '../data/mockOpportunities';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { SkillTag } from '../components/SkillTag';
import {
  User,
  Mail,
  GraduationCap,
  Sparkles,
  Plus,
  Compass,
  RotateCcw,
  CheckCircle2,
  Briefcase,
  Monitor
} from 'lucide-react';

const BRANCH_OPTIONS: BranchOption[] = [
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil',
  'AI & ML',
  'Other'
];

const YEAR_OPTIONS: YearOption[] = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate'
];

const ALL_OPPORTUNITY_TYPES: OpportunityType[] = [
  'Internship',
  'Hackathon',
  'Scholarship',
  'Certification',
  'Course',
  'Job',
  'Competition'
];

const MODE_OPTIONS: { value: OpportunityMode | 'All'; label: string; desc: string }[] = [
  { value: 'Hybrid', label: 'Hybrid', desc: 'Mix of campus and remote work' },
  { value: 'Online', label: 'Online / Remote', desc: '100% virtual participation' },
  { value: 'Offline', label: 'In-Person / Onsite', desc: 'Office or campus based' },
  { value: 'All', label: 'Any Mode', desc: 'Open to all working environments' }
];

export const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, resetToDemoProfile } = useStudentProfile();


  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    email: profile.email || '',
    college: profile.college || '',
    branch: profile.branch || 'CSE',
    currentYear: profile.currentYear || '3rd Year',
    cgpa: profile.cgpa?.toString() || '8.4',
    skills: [...(profile.skills || [])],
    interests: [...(profile.interests || [])],
    preferredTypes: [...(profile.preferredTypes || ['Internship', 'Hackathon'])],
    preferredMode: profile.preferredMode || 'Hybrid'
  });

  const [customSkillInput, setCustomSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Skill management
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
    }
    setCustomSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  // Interest management
  const handleToggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest]
      };
    });
  };

  // Opportunity Type toggles
  const handleToggleType = (type: OpportunityType) => {
    setFormData((prev) => {
      const exists = prev.preferredTypes.includes(type);
      return {
        ...prev,
        preferredTypes: exists
          ? prev.preferredTypes.filter((t) => t !== type)
          : [...prev.preferredTypes, type]
      };
    });
  };

  // Form Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.college.trim()) {
      errs.college = 'College / University is required';
    }

    const numCgpa = parseFloat(formData.cgpa);
    if (!formData.cgpa || isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      errs.cgpa = 'Enter a valid CGPA between 0.0 and 10.0';
    }

    if (formData.skills.length === 0) {
      errs.skills = 'Please add at least 1 technical skill';
    }

    if (formData.interests.length === 0) {
      errs.interests = 'Please select at least 1 career interest';
    }

    if (formData.preferredTypes.length === 0) {
      errs.preferredTypes = 'Select at least 1 opportunity type preference';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAndFind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    updateProfile({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      college: formData.college.trim(),
      branch: formData.branch as BranchOption,
      currentYear: formData.currentYear as YearOption,
      cgpa: parseFloat(formData.cgpa),
      skills: formData.skills,
      interests: formData.interests,
      preferredTypes: formData.preferredTypes,
      preferredMode: formData.preferredMode
    });

    setSaveSuccess(true);
    setTimeout(() => {
      navigate('/opportunities');
    }, 600);
  };

  const handleLoadDemo = () => {
    resetToDemoProfile();
    setFormData({
      fullName: DEFAULT_DEMO_PROFILE.fullName,
      email: DEFAULT_DEMO_PROFILE.email,
      college: DEFAULT_DEMO_PROFILE.college,
      branch: DEFAULT_DEMO_PROFILE.branch,
      currentYear: DEFAULT_DEMO_PROFILE.currentYear,
      cgpa: DEFAULT_DEMO_PROFILE.cgpa.toString(),
      skills: [...DEFAULT_DEMO_PROFILE.skills],
      interests: [...DEFAULT_DEMO_PROFILE.interests],
      preferredTypes: [...DEFAULT_DEMO_PROFILE.preferredTypes],
      preferredMode: DEFAULT_DEMO_PROFILE.preferredMode
    });
    setErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Profile Configuration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Build Your Student Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tell us about yourself so we can find opportunities that fit you.
          </p>
        </div>

        {/* Demo Fast Fill Button for evaluators */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLoadDemo}
          leftIcon={<RotateCcw className="w-4 h-4 text-indigo-400" />}
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          Reset Demo Data
        </Button>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm font-medium">
            Profile saved successfully! Redirecting you to matching opportunities...
          </div>
        </div>
      )}

      <form onSubmit={handleSaveAndFind} className="space-y-8">
        {/* Section 1: Personal Information */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Personal Information
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Basic contact details used for verification and notification.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Aarav Sharma"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              error={errors.fullName}
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. aarav.sharma@college.edu.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="sm:col-span-2">
              <Input
                label="College / University"
                placeholder="e.g. National Institute of Technology, Surathkal"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                error={errors.college}
                leftIcon={<GraduationCap className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Academic Information */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-400" />
            Academic Information
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Used by our eligibility engine to check branch, degree, and GPA prerequisites.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Branch / Discipline"
              options={BRANCH_OPTIONS}
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value as BranchOption })}
            />

            <Select
              label="Current Year"
              options={YEAR_OPTIONS}
              value={formData.currentYear}
              onChange={(e) => setFormData({ ...formData, currentYear: e.target.value as YearOption })}
            />

            <Input
              label="CGPA / Percentage (out of 10.0)"
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 8.4"
              value={formData.cgpa}
              onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
              error={errors.cgpa}
            />
          </div>
        </div>

        {/* Section 3: Technical Skills */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Technical Skills
            </h2>
            <span className="text-xs text-slate-400">
              {formData.skills.length} skills added
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Add programming languages, frameworks, and developer tools you know.
          </p>

          {/* Active Skills tags */}
          <div className="min-h-16 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 mb-4 flex flex-wrap gap-2 items-center">
            {formData.skills.map((skill) => (
              <SkillTag
                key={skill}
                skill={skill}
                onRemove={() => handleRemoveSkill(skill)}
              />
            ))}
            {formData.skills.length === 0 && (
              <span className="text-xs text-slate-500 italic">
                No skills added yet. Click suggestions below or type a custom skill.
              </span>
            )}
          </div>
          {errors.skills && (
            <p className="text-xs text-rose-400 font-medium mb-3">{errors.skills}</p>
          )}

          {/* Custom Add Input */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add another skill (e.g. Next.js, Kubernetes)..."
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(customSkillInput);
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleAddSkill(customSkillInput)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          {/* Popular Suggested Skills Chips */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Quick Add Popular Skills:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SKILLS_LIST.map((skill) => {
                const isAdded = formData.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      isAdded ? handleRemoveSkill(skill) : handleAddSkill(skill)
                    }
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {isAdded ? `✓ ${skill}` : `+ ${skill}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Career Interests */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Career Interests & Domains
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Select the domains you want the AI to prioritize in matching.
          </p>

          <div className="flex flex-wrap gap-2 mb-2">
            {AVAILABLE_INTERESTS_LIST.map((interest) => {
              const selected = formData.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleToggleInterest(interest)}
                  className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                    selected
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {selected ? '✓ ' : ''}{interest}
                </button>
              );
            })}
          </div>
          {errors.interests && (
            <p className="text-xs text-rose-400 font-medium mt-1">{errors.interests}</p>
          )}
        </div>

        {/* Section 5: Opportunity Types & Mode */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            Preferred Opportunity Types
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Choose which opportunity formats to highlight.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {ALL_OPPORTUNITY_TYPES.map((type) => {
              const selected = formData.preferredTypes.includes(type);
              return (
                <div
                  key={type}
                  onClick={() => handleToggleType(type)}
                  className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all ${
                    selected
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white font-semibold shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-medium">{type}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selected ? 'Selected' : 'Click to select'}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.preferredTypes && (
            <p className="text-xs text-rose-400 font-medium mb-4">{errors.preferredTypes}</p>
          )}

          {/* Mode Preference */}
          <div className="pt-5 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              Preferred Working Mode
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Do you prefer virtual work or onsite experience?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {MODE_OPTIONS.map((m) => {
                const active = formData.preferredMode === m.value;
                return (
                  <div
                    key={m.value}
                    onClick={() => setFormData({ ...formData, preferredMode: m.value })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      active
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-200 font-semibold'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{m.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {m.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4 z-20 glass-panel p-4 rounded-2xl border border-indigo-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Profile saves locally to your browser and matches automatically.
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full sm:w-auto font-bold px-8 shadow-xl shadow-indigo-600/30"
            leftIcon={<Sparkles className="w-5 h-5" />}
          >
            Save Profile & Find Opportunities
          </Button>
        </div>
      </form>
    </div>
  );
};
