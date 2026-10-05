import type { Opportunity, OpportunityFilters } from '../types';
import { mockOpportunities } from '../data/mockOpportunities';

/**
 * OPPORTUNITY SERVICE
 * -------------------------------------------------------------
 * NOTE FOR MEMBER 3 & MEMBER 4:
 * This service is the single source of truth for loading, searching,
 * and filtering opportunities.
 *
 * Currently, it serves high-quality mock data from `src/data/mockOpportunities.ts`.
 * When connecting to your real backend database / REST API:
 * - Update the fetch logic below using `import.meta.env.VITE_API_BASE_URL`
 * - No UI changes in components or pages are needed!
 * -------------------------------------------------------------
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';


/**
 * Fetch all opportunities
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  // If an active backend server is configured in future integration:
  // try {
  //   const res = await fetch(`${API_BASE_URL}/api/opportunities`);
  //   if (res.ok) return await res.json();
  // } catch (e) {
  //   console.info('Backend API unavailable, falling back to mock dataset', e);
  // }

  // Fallback to local dataset for immediate demonstration
  return [...mockOpportunities];
}

/**
 * Fetch a single opportunity by its ID
 */
export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
  const all = await getOpportunities();
  return all.find((opp) => opp.id === id);
}

/**
 * Search and filter opportunities based on user-defined criteria
 */
export async function filterOpportunities(
  filters: Partial<OpportunityFilters>
): Promise<Opportunity[]> {
  const all = await getOpportunities();

  return all.filter((opp) => {
    // 1. Text Search query
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const name = opp.title || opp.name || '';
      const org = opp.organization || '';
      const desc = opp.shortDescription || opp.description || '';
      const skillsMatch = opp.requiredSkills.some((s) => s.toLowerCase().includes(q));

      if (
        !name.toLowerCase().includes(q) &&
        !org.toLowerCase().includes(q) &&
        !desc.toLowerCase().includes(q) &&
        !skillsMatch
      ) {
        return false;
      }
    }

    // 2. Type filter
    if (filters.type && filters.type !== 'All' && opp.type !== filters.type) {
      return false;
    }

    // 3. Branch filter
    if (filters.branch && filters.branch !== 'All') {
      const branches = opp.eligibleBranches || opp.branches || [];
      const matchBranch =
        branches.includes('Other') ||
        branches.some((b) => b.toLowerCase() === filters.branch?.toLowerCase());
      if (!matchBranch) return false;
    }

    // 4. Year filter
    if (filters.year && filters.year !== 'All') {
      const matchYear = opp.eligibleYears.some(
        (y) => y.toLowerCase() === filters.year?.toLowerCase()
      );
      if (!matchYear) return false;
    }

    // 5. Mode filter
    if (filters.mode && filters.mode !== 'All' && opp.mode !== filters.mode) {
      return false;
    }

    // 6. Skill filter
    if (filters.selectedSkill && filters.selectedSkill !== 'All') {
      const hasSkill = opp.requiredSkills.some(
        (s) => s.toLowerCase() === filters.selectedSkill?.toLowerCase()
      );
      if (!hasSkill) return false;
    }

    return true;
  });
}
