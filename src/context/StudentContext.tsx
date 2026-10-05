import React, { createContext, useContext, useState, useEffect } from 'react';
import type { StudentProfile, MatchResult } from '../types';
import { mockOpportunities } from '../data/mockOpportunities';

import { analyzeOpportunityMatch } from '../services/matchingService';

interface StudentContextType {
  profile: StudentProfile;
  updateProfile: (updated: Partial<StudentProfile>) => void;
  resetToDemoProfile: () => void;
  savedMatches: Record<string, MatchResult>;
  activeMatch: MatchResult | null;
  setActiveMatch: (match: MatchResult | null) => void;
  saveMatch: (match: MatchResult) => void;
  toggleTaskCompletion: (stepId: string) => void;
  isTaskCompleted: (stepId: string) => boolean;
  getMatchForOpportunity: (opportunityId: string) => MatchResult | undefined;
}

// Default pre-filled student profile for seamless demo
export const DEFAULT_DEMO_PROFILE: StudentProfile = {
  id: 'student-demo-1',
  fullName: 'Aarav Sharma',
  email: 'aarav.sharma@college.edu.in',
  college: 'National Institute of Technology',
  branch: 'CSE',
  currentYear: '3rd Year',
  cgpa: 8.4,
  skills: ['Python', 'Machine Learning', 'SQL', 'React', 'JavaScript', 'Data Science'],
  interests: ['AI/ML', 'Web Development', 'Data Science', 'Cloud'],
  preferredTypes: ['Internship', 'Hackathon', 'Scholarship', 'Certification', 'Job'],
  preferredMode: 'Hybrid',
  updatedAt: new Date().toISOString()
};

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial profile from localStorage or fallback to default demo
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const stored = localStorage.getItem('sih_student_profile');
      return stored ? JSON.parse(stored) : DEFAULT_DEMO_PROFILE;
    } catch {
      return DEFAULT_DEMO_PROFILE;
    }
  });

  // Track saved analyzed matches
  const [savedMatches, setSavedMatches] = useState<Record<string, MatchResult>>(() => {
    try {
      const stored = localStorage.getItem('sih_saved_matches');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Track active match being inspected in MatchResult/ActionPlan
  const [activeMatch, setActiveMatch] = useState<MatchResult | null>(null);

  // Track completed steps in action plan
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('sih_completed_tasks');
      return stored ? JSON.parse(stored) : { 'act-opp-1-1': true }; // 1 pre-checked for rich demo
    } catch {
      return { 'act-opp-1-1': true };
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sih_student_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_saved_matches', JSON.stringify(savedMatches));
    } catch (e) {
      console.warn('Failed to save matches to localStorage', e);
    }
  }, [savedMatches]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_completed_tasks', JSON.stringify(completedTasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }, [completedTasks]);

  // Pre-seed the benchmark match (opp-1: AI/ML Intern) so My Matches has instant rich demo data
  useEffect(() => {
    const seedDefaultMatches = async () => {
      if (Object.keys(savedMatches).length === 0) {
        const opp1 = mockOpportunities.find(o => o.id === 'opp-1');
        const opp2 = mockOpportunities.find(o => o.id === 'opp-2');
        const opp4 = mockOpportunities.find(o => o.id === 'opp-4');
        const opp7 = mockOpportunities.find(o => o.id === 'opp-7');

        const initial: Record<string, MatchResult> = {};
        if (opp1) {
          const res1 = await analyzeOpportunityMatch(profile, opp1, false);
          initial[opp1.id] = res1;
        }
        if (opp2) {
          const res2 = await analyzeOpportunityMatch(profile, opp2, false);
          initial[opp2.id] = res2;
        }
        if (opp4) {
          const res4 = await analyzeOpportunityMatch(profile, opp4, false);
          initial[opp4.id] = res4;
        }
        if (opp7) {
          const res7 = await analyzeOpportunityMatch(profile, opp7, false);
          initial[opp7.id] = res7;
        }
        setSavedMatches(initial);
      }
    };
    seedDefaultMatches();
  }, []);

  const updateProfile = (updated: Partial<StudentProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updated,
      updatedAt: new Date().toISOString()
    }));
  };

  const resetToDemoProfile = () => {
    setProfile(DEFAULT_DEMO_PROFILE);
  };

  const saveMatch = (match: MatchResult) => {
    setSavedMatches(prev => ({
      ...prev,
      [match.opportunityId]: match
    }));
    setActiveMatch(match);
  };

  const toggleTaskCompletion = (stepId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const isTaskCompleted = (stepId: string): boolean => {
    return !!completedTasks[stepId];
  };

  const getMatchForOpportunity = (opportunityId: string): MatchResult | undefined => {
    return savedMatches[opportunityId];
  };

  return (
    <StudentContext.Provider
      value={{
        profile,
        updateProfile,
        resetToDemoProfile,
        savedMatches,
        activeMatch,
        setActiveMatch,
        saveMatch,
        toggleTaskCompletion,
        isTaskCompleted,
        getMatchForOpportunity
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
