import type { Opportunity, OpportunityFilters, OpportunityType, OpportunityMode } from '../types';
import { mockOpportunities } from '../data/mockOpportunities';

/**
 * OPPORTUNITY DATA SERVICE
 * =============================================================
 * Member 3: Opportunities & Data Service
 *
 * This service is the single source of truth for:
 *   - Loading opportunities dataset
 *   - Fetching single opportunity details
 *   - Filtering by Type, Branch, Year, Mode, Skill, and Location
 *   - Search & multi-parameter filtering
 *   - Optional future database / Firestore sync adapter
 *
 * Architecture:
 *   - Offline-First: Consumes local dataset in `src/data/mockOpportunities.ts`
 *     and `src/data/opportunities.json`.
 *   - Ready for REST or Firestore backend integration when API keys are available.
 *   - 100% backward-compatible with Member 2 (AI Matching) and Member 1 (UI).
 * =============================================================
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Normalizes year strings to handle both numeric ('1', '2', '3', '4')
 * and ordinal text ('1st Year', '2nd Year', '3rd Year', '4th Year').
 */
function normalizeYearInput(year: string): string {
  const trimmed = year.trim().toLowerCase();
  if (trimmed === '1' || trimmed === '1st') return '1st year';
  if (trimmed === '2' || trimmed === '2nd') return '2nd year';
  if (trimmed === '3' || trimmed === '3rd') return '3rd year';
  if (trimmed === '4' || trimmed === '4th') return '4th year';
  return trimmed;
}

/**
 * Checks if an opportunity's mode matches a requested mode,
 * handling synonymous pairs ('Remote' / 'Online', 'On-site' / 'Offline').
 */
function matchesModeCondition(oppMode: string, requestedMode: string): boolean {
  if (!requestedMode || requestedMode === 'All') return true;

  const o = oppMode.toLowerCase();
  const r = requestedMode.toLowerCase();

  if (o === r) return true;
  if ((r === 'remote' || r === 'online') && (o === 'remote' || o === 'online')) return true;
  if (
    (r === 'on-site' || r === 'onsite' || r === 'offline') &&
    (o === 'on-site' || o === 'onsite' || o === 'offline')
  ) {
    return true;
  }
  return false;
}

/**
 * 1. Fetch all opportunities.
 * Primary method for Member 3 & Member 4.
 */
export async function getAllOpportunities(): Promise<Opportunity[]> {
  // If an external backend REST API is configured:
  // try {
  //   const res = await fetch(`${API_BASE_URL}/api/opportunities`);
  //   if (res.ok) return await res.json();
  // } catch (e) {
  //   console.info('Backend API unavailable, serving local opportunity dataset', e);
  // }

  return [...mockOpportunities];
}

/**
 * Alias for getAllOpportunities() to preserve 100% backward compatibility
 * with existing frontend callers and Member 2 matching functions.
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  return getAllOpportunities();
}

/**
 * 2. Fetch a single opportunity by its ID.
 */
export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
  const all = await getAllOpportunities();
  return all.find((opp) => opp.id === id);
}

/**
 * 3. Fetch opportunities filtered by type (e.g. 'Internship', 'Hackathon', 'Job', 'Course', 'Scholarship').
 */
export async function getOpportunitiesByType(type: OpportunityType | string): Promise<Opportunity[]> {
  if (!type || type === 'All') return getAllOpportunities();
  const all = await getAllOpportunities();
  return all.filter((opp) => opp.type.toLowerCase() === type.toLowerCase());
}

/**
 * 4. Fetch opportunities filtered by eligible engineering branch.
 * Supports: 'CSE', 'CSIT', 'CSD', 'ECE', 'EEE', 'Mechanical', 'Civil', etc.
 */
export async function getOpportunitiesByBranch(branch: string): Promise<Opportunity[]> {
  if (!branch || branch === 'All') return getAllOpportunities();
  const all = await getAllOpportunities();
  const target = branch.trim().toLowerCase();

  return all.filter((opp) => {
    const branches = opp.eligibleBranches || opp.branches || [];
    return (
      branches.includes('All') ||
      branches.includes('Other') ||
      branches.some((b) => b.trim().toLowerCase() === target)
    );
  });
}

/**
 * 5. Fetch opportunities filtered by eligible year of study.
 * Accepts '1', '2', '3', '4' or '1st Year', '2nd Year', '3rd Year', '4th Year'.
 */
export async function getOpportunitiesByYear(year: string): Promise<Opportunity[]> {
  if (!year || year === 'All') return getAllOpportunities();
  const all = await getAllOpportunities();
  const normalizedTarget = normalizeYearInput(year);

  return all.filter((opp) => {
    return (
      opp.eligibleYears.includes('All') ||
      opp.eligibleYears.some((y) => {
        const normY = normalizeYearInput(y);
        return normY === normalizedTarget || normY.charAt(0) === normalizedTarget.charAt(0);
      })
    );
  });
}

/**
 * 6. Fetch opportunities filtered by participation mode.
 * Supports: 'Remote', 'On-site', 'Hybrid', 'Online', 'Offline'.
 */
export async function getOpportunitiesByMode(mode: OpportunityMode | string): Promise<Opportunity[]> {
  if (!mode || mode === 'All') return getAllOpportunities();
  const all = await getAllOpportunities();
  return all.filter((opp) => matchesModeCondition(opp.mode, mode));
}

/**
 * 7. Fetch opportunities filtered by required or preferred skill.
 * Supports: 'Java', 'Python', 'SQL', 'React', 'AWS', 'IoT', etc.
 */
export async function getOpportunitiesBySkill(skill: string): Promise<Opportunity[]> {
  if (!skill || skill === 'All') return getAllOpportunities();
  const all = await getAllOpportunities();
  const target = skill.trim().toLowerCase();

  return all.filter((opp) => {
    const requiredMatch = opp.requiredSkills.some((s) => s.toLowerCase() === target);
    const preferredMatch = (opp.preferredSkills || []).some((s) => s.toLowerCase() === target);
    return requiredMatch || preferredMatch;
  });
}

/**
 * 8. Fetch opportunities by location (e.g. 'Hyderabad', 'Bengaluru', 'Remote', etc.).
 */
export async function getOpportunitiesByLocation(location: string): Promise<Opportunity[]> {
  if (!location || location === 'All') return getAllOpportunities();
  const all = await getAllOpportunities();
  const target = location.trim().toLowerCase();

  return all.filter((opp) => {
    return opp.location?.toLowerCase().includes(target);
  });
}

/**
 * 9. Fetch featured opportunities for home/dashboard banners.
 */
export async function getFeaturedOpportunities(): Promise<Opportunity[]> {
  const all = await getAllOpportunities();
  return all.filter((opp) => Boolean(opp.featured));
}

/**
 * 10. Multi-criteria search and filtering.
 * Preserves compatibility with existing search bar and filters page.
 */
export async function filterOpportunities(
  filters: Partial<OpportunityFilters>
): Promise<Opportunity[]> {
  const all = await getAllOpportunities();

  return all.filter((opp) => {
    // 1. Text Search query
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const name = opp.title || opp.name || '';
      const org = opp.organization || '';
      const desc = opp.shortDescription || opp.description || '';
      const skillsMatch = opp.requiredSkills.some((s) => s.toLowerCase().includes(q));
      const tagsMatch = (opp.tags || []).some((t) => t.toLowerCase().includes(q));

      if (
        !name.toLowerCase().includes(q) &&
        !org.toLowerCase().includes(q) &&
        !desc.toLowerCase().includes(q) &&
        !skillsMatch &&
        !tagsMatch
      ) {
        return false;
      }
    }

    // 2. Type filter
    if (filters.type && filters.type !== 'All' && opp.type.toLowerCase() !== filters.type.toLowerCase()) {
      return false;
    }

    // 3. Branch filter
    if (filters.branch && filters.branch !== 'All') {
      const branches = opp.eligibleBranches || opp.branches || [];
      const matchBranch =
        branches.includes('Other') ||
        branches.includes('All') ||
        branches.some((b) => b.toLowerCase() === filters.branch?.toLowerCase());
      if (!matchBranch) return false;
    }

    // 4. Year filter
    if (filters.year && filters.year !== 'All') {
      const normalizedTarget = normalizeYearInput(filters.year);
      const matchYear =
        opp.eligibleYears.includes('All') ||
        opp.eligibleYears.some((y) => {
          const normY = normalizeYearInput(y);
          return normY === normalizedTarget || normY.charAt(0) === normalizedTarget.charAt(0);
        });
      if (!matchYear) return false;
    }

    // 5. Mode filter
    if (filters.mode && filters.mode !== 'All') {
      if (!matchesModeCondition(opp.mode, filters.mode)) {
        return false;
      }
    }

    // 6. Skill filter
    if (filters.selectedSkill && filters.selectedSkill !== 'All') {
      const target = filters.selectedSkill.toLowerCase();
      const hasSkill =
        opp.requiredSkills.some((s) => s.toLowerCase() === target) ||
        (opp.preferredSkills || []).some((s) => s.toLowerCase() === target);
      if (!hasSkill) return false;
    }

    return true;
  });
}

/**
 * OPTIONAL FUTURE DATABASE INTEGRATION REFERENCE (FOR MEMBER 4 / CLOUD ENGINEER)
 * -------------------------------------------------------------------------------
 * When Firebase / Firestore credentials are configured in .env:
 *
 * Example Firestore Integration Pattern:
 *
 * import { initializeApp } from 'firebase/app';
 * import { getFirestore, collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
 *
 * const firebaseConfig = {
 *   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 *   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 *   // ... other credentials
 * };
 *
 * export async function seedOpportunitiesToFirestore(): Promise<{ seeded: number; skipped: number }> {
 *   const db = getFirestore(initializeApp(firebaseConfig));
 *   const collRef = collection(db, 'opportunities');
 *   let seeded = 0;
 *   for (const opp of mockOpportunities) {
 *     await setDoc(doc(collRef, opp.id), opp, { merge: true });
 *     seeded++;
 *   }
 *   return { seeded, skipped: 0 };
 * }
 * -------------------------------------------------------------------------------
 */
