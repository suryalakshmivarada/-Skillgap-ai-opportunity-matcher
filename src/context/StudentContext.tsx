import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StudentProfile, MatchResult } from '../types';
import { api } from '../services/api';

export interface ApplicationRecord {
  id: string;
  opportunityId: string;
  opportunityTitle?: string;
  organization?: string;
  status: string;
  appliedAt: string;
  notes?: string;
}

interface StudentContextType {
  profile: StudentProfile;
  updateProfile: (updated: Partial<StudentProfile>) => Promise<void>;
  resetToDemoProfile: () => Promise<void>;
  savedMatches: Record<string, MatchResult>;
  activeMatch: MatchResult | null;
  setActiveMatch: (match: MatchResult | null) => void;
  saveMatch: (match: MatchResult) => void;
  toggleTaskCompletion: (stepId: string) => Promise<void>;
  isTaskCompleted: (stepId: string) => boolean;
  getMatchForOpportunity: (opportunityId: string) => MatchResult | undefined;
  applications: Record<string, ApplicationRecord>;
  recordApplication: (opportunityId: string, notes?: string) => Promise<ApplicationRecord>;
  isApplied: (opportunityId: string) => boolean;
  backendOnline: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (studentData: any) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
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
  // Backend connectivity flag
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

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
      return stored ? JSON.parse(stored) : { 'act-opp-1-1': true };
    } catch {
      return { 'act-opp-1-1': true };
    }
  });

  // Track student applications
  const [applications, setApplications] = useState<Record<string, ApplicationRecord>>(() => {
    try {
      const stored = localStorage.getItem('sih_applications');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => api.isAuthenticated());

  // Check backend health & sync initial data from PostgreSQL on mount
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      try {
        const health = await api.checkHealth();
        if (health && isMounted) {
          setBackendOnline(true);
        }

        // Auto-authenticate with demo account if no active token exists
        if (!api.isAuthenticated()) {
          try {
            await api.demoLogin();
            if (isMounted) setIsAuthenticated(true);
          } catch (e) {
            console.info('Auto demo login deferred', e);
          }
        } else {
          if (isMounted) setIsAuthenticated(true);
        }

        // 1. Sync Profile from Backend
        try {
          const remoteProfile = await api.getProfile();
          if (remoteProfile && remoteProfile.email && isMounted) {
            setProfile(remoteProfile);
          }
        } catch (e) {
          console.info('Using local profile (server syncing deferred)', e);
        }

        // 2. Sync Saved Matches & Action Plan Tasks from Backend
        try {
          const remoteMatches = await api.getSavedMatches();
          if (remoteMatches && Object.keys(remoteMatches).length > 0 && isMounted) {
            setSavedMatches(remoteMatches);

            // Sync task completion statuses from PostgreSQL action plans
            const taskMap: Record<string, boolean> = {};
            Object.values(remoteMatches).forEach(m => {
              (m.actionPlan || []).forEach(t => {
                if (t.id) {
                  taskMap[t.id] = !!t.isCompleted;
                }
              });
            });
            if (Object.keys(taskMap).length > 0) {
              setCompletedTasks(prev => ({
                ...prev,
                ...taskMap
              }));
            }
          }
        } catch (e) {
          console.info('Using local matches (server syncing deferred)', e);
        }

        // 3. Sync Applications from Backend
        try {
          const remoteApps = await api.getApplications();
          if (remoteApps && Array.isArray(remoteApps) && remoteApps.length > 0 && isMounted) {
            const mapped: Record<string, ApplicationRecord> = {};
            remoteApps.forEach(a => {
              mapped[a.opportunityId] = a;
            });
            setApplications(prev => ({
              ...prev,
              ...mapped
            }));
          }
        } catch (e) {
          console.info('Using local applications', e);
        }
      } catch {
        if (isMounted) setBackendOnline(false);
      }
    }

    syncWithBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to localStorage for offline resilience & seamless continuity
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

  useEffect(() => {
    try {
      localStorage.setItem('sih_applications', JSON.stringify(applications));
    } catch (e) {
      console.warn('Failed to save applications to localStorage', e);
    }
  }, [applications]);

  // Dynamic match evaluation sync when saved matches are empty
  useEffect(() => {
    let isMounted = true;
    const evaluateInitialMatches = async () => {
      if (Object.keys(savedMatches).length === 0) {
        try {
          const evaluated = await api.evaluateMatches(profile);
          if (evaluated && Object.keys(evaluated).length > 0 && isMounted) {
            setSavedMatches(evaluated);
          }
        } catch {
          // Gracefully defer until individual analysis or local calculation
        }
      }
    };
    evaluateInitialMatches();
    return () => {
      isMounted = false;
    };
  }, [profile.id]);

  const updateProfile = useCallback(async (updated: Partial<StudentProfile>) => {
    const merged = {
      ...profile,
      ...updated,
      updatedAt: new Date().toISOString()
    };
    setProfile(merged);

    // Sync to PostgreSQL backend
    try {
      const serverUpdated = await api.updateProfile(updated);
      const activeProfile = serverUpdated || merged;
      if (serverUpdated) {
        setProfile(serverUpdated);
      }

      // Re-evaluate matches for updated profile
      try {
        const reevaluated = await api.evaluateMatches(activeProfile);
        if (reevaluated && Object.keys(reevaluated).length > 0) {
          setSavedMatches(reevaluated);
        }
      } catch {
        // Non-blocking
      }
    } catch (e) {
      console.warn('Profile updated locally; backend sync error:', e);
    }
  }, [profile]);

  const resetToDemoProfile = useCallback(async () => {
    setProfile(DEFAULT_DEMO_PROFILE);

    // Sync to backend
    try {
      const serverReset = await api.resetProfile();
      if (serverReset) {
        setProfile(serverReset);
      }
    } catch (e) {
      console.warn('Profile reset locally; backend sync error:', e);
    }
  }, []);

  const saveMatch = useCallback((match: MatchResult) => {
    setSavedMatches(prev => ({
      ...prev,
      [match.opportunityId]: match
    }));
    setActiveMatch(match);
  }, []);

  const toggleTaskCompletion = useCallback(async (stepId: string) => {
    // 1. Optimistic local update
    const newStatus = !completedTasks[stepId];
    setCompletedTasks(prev => ({
      ...prev,
      [stepId]: newStatus
    }));

    // Update in activeMatch if loaded
    if (activeMatch && activeMatch.actionPlan) {
      const updatedPlan = activeMatch.actionPlan.map(task =>
        task.id === stepId
          ? {
              ...task,
              isCompleted: newStatus,
              status: (newStatus ? 'completed' : 'pending') as 'completed' | 'pending'
            }
          : task
      );
      setActiveMatch({ ...activeMatch, actionPlan: updatedPlan });
    }

    // 2. Sync to backend API
    try {
      await api.toggleActionPlanTask(stepId);
    } catch (e) {
      console.warn('Task completion saved locally; backend toggle error:', e);
    }
  }, [completedTasks, activeMatch]);

  const isTaskCompleted = useCallback((stepId: string): boolean => {
    return !!completedTasks[stepId];
  }, [completedTasks]);

  const getMatchForOpportunity = useCallback((opportunityId: string): MatchResult | undefined => {
    return savedMatches[opportunityId];
  }, [savedMatches]);

  const recordApplication = useCallback(async (opportunityId: string, notes?: string): Promise<ApplicationRecord> => {
    const oppMatch = savedMatches[opportunityId];
    const newRecord: ApplicationRecord = {
      id: `app-${opportunityId}-${Date.now()}`,
      opportunityId,
      opportunityTitle: oppMatch?.opportunityTitle || 'Opportunity',
      organization: oppMatch?.organization || 'Organization',
      status: 'Submitted',
      appliedAt: new Date().toISOString(),
      notes
    };

    // Update state & localStorage
    setApplications(prev => ({
      ...prev,
      [opportunityId]: newRecord
    }));

    // Save to PostgreSQL via API
    try {
      const serverRecord = await api.submitApplication(opportunityId, notes);
      if (serverRecord) {
        setApplications(prev => ({
          ...prev,
          [opportunityId]: serverRecord
        }));
        return serverRecord;
      }
    } catch (e) {
      console.warn('Application recorded locally; backend sync error:', e);
    }

    return newRecord;
  }, []);

  const isApplied = useCallback((opportunityId: string): boolean => {
    return !!applications[opportunityId];
  }, [applications]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.data) {
      setProfile(res.data);
      setIsAuthenticated(true);
      try {
        const matches = await api.getSavedMatches();
        setSavedMatches(matches || {});
        const apps = await api.getApplications();
        if (Array.isArray(apps)) {
          const map: Record<string, ApplicationRecord> = {};
          apps.forEach(a => { map[a.opportunityId] = a; });
          setApplications(map);
        }
      } catch (e) {
        console.warn('Post-login sync deferred:', e);
      }
    }
  }, []);

  const register = useCallback(async (studentData: any) => {
    const res = await api.register(studentData);
    if (res.data) {
      setProfile(res.data);
      setIsAuthenticated(true);
    }
  }, []);

  const demoLogin = useCallback(async () => {
    const res = await api.demoLogin();
    if (res.data) {
      setProfile(res.data);
      setIsAuthenticated(true);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
    setProfile(DEFAULT_DEMO_PROFILE);
    setSavedMatches({});
    setApplications({});
    setCompletedTasks({});
    try {
      localStorage.removeItem('sih_auth_token');
      localStorage.removeItem('sih_saved_matches');
      localStorage.removeItem('sih_applications');
    } catch {}
  }, []);

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
        getMatchForOpportunity,
        applications,
        recordApplication,
        isApplied,
        backendOnline,
        isAuthenticated,
        login,
        register,
        demoLogin,
        logout
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
