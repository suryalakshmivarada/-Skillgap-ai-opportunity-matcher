import type {
  StudentProfile,
  Opportunity,
  MatchResult,
  ActionPlanStep,
  EligibilityStatus,
  MatchLevel
} from '../types';
import { mockOpportunities } from '../data/mockOpportunities';

/**
 * AI MATCHING SERVICE
 * -------------------------------------------------------------
 * Member 2: AI & Matching Module Specialist
 *
 * Implements an explainable, multi-factor scoring model:
 *   - Skills:       40% (required skills primary, preferred skills secondary/bonus)
 *   - Interests:    25% (tags, title, description, preferred types, preferred mode)
 *   - Branch:       15% (academic discipline alignment)
 *   - Year:         10% (current academic year alignment)
 *   - Eligibility:  10% (HARD FILTER: branch + year + min CGPA)
 *
 * Hard Filter Rule:
 * Ineligible opportunities (failing branch, year, or min CGPA) cannot
 * be valid recommendations, even if the student has strong technical skills.
 * -------------------------------------------------------------
 */

/**
 * Maps a match score (0-100) to its standardized MatchLevel tier.
 *   90–100: Excellent Match
 *   75–89:  Strong Match
 *   60–74:  Good Match
 *   Below 60: Low Match
 */
export function getMatchLevel(score: number): MatchLevel {
  if (score >= 90) return 'Excellent Match';
  if (score >= 75) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  return 'Low Match';
}

/**
 * Maps a match score and eligibility status to the legacy UI grade badge.
 * Ineligible opportunities always receive 'Needs Improvement' in UI previews.
 */
export function getMatchGrade(
  score: number,
  isEligible: boolean
): 'Excellent Match' | 'Good Match' | 'Needs Improvement' {
  if (!isEligible) return 'Needs Improvement';
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Good Match';
  return 'Needs Improvement';
}

/**
 * Simulated delay helper to give realistic asynchronous processing feel.
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core matching function: Evaluates a single student against an opportunity.
 * Completely deterministic and synchronous for high-throughput batch evaluation.
 */
export function matchStudentWithOpportunity(
  profile: StudentProfile,
  opportunity: Opportunity
): MatchResult {
  // -----------------------------------------------------------
  // 1. SKILL MATCHING (Case-insensitive)
  // -----------------------------------------------------------
  const normalizedStudentSkills = new Set(
    profile.skills.map((s) => s.trim().toLowerCase())
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  opportunity.requiredSkills.forEach((reqSkill) => {
    if (normalizedStudentSkills.has(reqSkill.trim().toLowerCase())) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  const totalRequired = opportunity.requiredSkills.length;
  const baseSkillRatio =
    totalRequired > 0 ? matchedSkills.length / totalRequired : 1;
  const baseSkillScore = baseSkillRatio * 100;

  // Preferred skills are secondary/bonus signals and are NOT mandatory
  let preferredBonus = 0;
  const matchedPreferredSkills: string[] = [];
  if (opportunity.preferredSkills && opportunity.preferredSkills.length > 0) {
    opportunity.preferredSkills.forEach((prefSkill) => {
      if (normalizedStudentSkills.has(prefSkill.trim().toLowerCase())) {
        matchedPreferredSkills.push(prefSkill);
      }
    });
    // Scale bonus up to 10 points based on proportion of preferred skills matched
    const preferredRatio =
      matchedPreferredSkills.length / opportunity.preferredSkills.length;
    preferredBonus = preferredRatio * 10;
  }

  const skillMatch = Math.round(
    Math.min(100, Math.max(0, baseSkillScore + preferredBonus))
  );
  const skillMatchPercentage = skillMatch;

  // -----------------------------------------------------------
  // 2. INTEREST MATCHING
  // -----------------------------------------------------------
  const tags = (opportunity.tags || []).map((t) => t.trim().toLowerCase());
  const titleLower = opportunity.title.toLowerCase();
  const typeLower = opportunity.type.toLowerCase();
  const descLower = `${opportunity.shortDescription} ${
    opportunity.fullDescription || ''
  }`.toLowerCase();

  const matchedInterests: string[] = [];
  profile.interests.forEach((interest) => {
    const intLower = interest.trim().toLowerCase();
    const isMatched =
      tags.some((t) => t.includes(intLower) || intLower.includes(t)) ||
      titleLower.includes(intLower) ||
      typeLower.includes(intLower) ||
      descLower.includes(intLower);

    if (isMatched) {
      matchedInterests.push(interest);
    }
  });

  let baseInterestScore = 30; // Baseline when student has interests but none align
  if (profile.interests.length > 0) {
    const interestHitRatio = matchedInterests.length / profile.interests.length;
    if (matchedInterests.length > 0) {
      baseInterestScore = 70 + Math.round(interestHitRatio * 20); // 70 to 90
    }
  } else {
    baseInterestScore = 70; // Neutral default if student has no declared interests
  }

  // Opportunity Type preference bonus
  let typeBonus = 0;
  if (
    profile.preferredTypes &&
    profile.preferredTypes.length > 0 &&
    profile.preferredTypes.includes(opportunity.type)
  ) {
    typeBonus = 7;
  }

  // Working Mode preference bonus
  let modeBonus = 0;
  const isModeMatched =
    profile.preferredMode === 'All' ||
    profile.preferredMode === opportunity.mode ||
    (profile.preferredMode === 'Online' && (opportunity.mode === 'Remote' || (opportunity.mode as string) === 'Online')) ||
    (profile.preferredMode === 'Offline' && (opportunity.mode === 'On-site' || (opportunity.mode as string) === 'Offline')) ||
    ((profile.preferredMode as string) === 'Remote' && (opportunity.mode === 'Remote' || (opportunity.mode as string) === 'Online')) ||
    ((profile.preferredMode as string) === 'On-site' && (opportunity.mode === 'On-site' || (opportunity.mode as string) === 'Offline'));

  if (isModeMatched) {
    modeBonus = 3;
  }

  const interestMatch = Math.round(
    Math.min(100, Math.max(0, baseInterestScore + typeBonus + modeBonus))
  );
  const interestMatchPercentage = interestMatch;

  // -----------------------------------------------------------
  // 3. ELIGIBILITY & BRANCH/YEAR CHECKS (HARD FILTER)
  // -----------------------------------------------------------
  const eligibleBranches =
    opportunity.eligibleBranches || opportunity.branches || [];
  const branchMatch =
    eligibleBranches.includes('All') ||
    eligibleBranches.includes('Other') ||
    eligibleBranches.some(
      (b) => b.trim().toLowerCase() === profile.branch.trim().toLowerCase()
    );
  const branchSatisfied = branchMatch;

  const eligibleYears = opportunity.eligibleYears || [];
  const yearMatch =
    eligibleYears.includes('All') ||
    eligibleYears.some((y) => {
      const yNorm = y.trim().toLowerCase();
      const pNorm = profile.currentYear.trim().toLowerCase();
      return yNorm === pNorm || yNorm.charAt(0) === pNorm.charAt(0);
    });
  const yearSatisfied = yearMatch;

  const academicSatisfied = opportunity.minCgpa
    ? profile.cgpa >= opportunity.minCgpa
    : true;

  const isEligible = branchSatisfied && yearSatisfied && academicSatisfied;
  const eligible = isEligible;

  // Human-readable eligibility diagnostic details
  const eligibilityDetails: string[] = [];
  if (branchSatisfied) {
    eligibilityDetails.push(
      `Branch requirement satisfied (${profile.branch} is eligible)`
    );
  } else {
    eligibilityDetails.push(
      `Branch requirement not met (${profile.branch} is not eligible. Target branches: ${eligibleBranches.join(
        ', '
      )})`
    );
  }

  if (yearSatisfied) {
    eligibilityDetails.push(
      `Academic year satisfied (${profile.currentYear} is eligible)`
    );
  } else {
    eligibilityDetails.push(
      `Academic year requirement not met (${profile.currentYear} is not eligible. Target years: ${eligibleYears.join(
        ', '
      )})`
    );
  }

  if (academicSatisfied) {
    eligibilityDetails.push(
      `CGPA requirement satisfied (Your CGPA: ${profile.cgpa.toFixed(1)}${
        opportunity.minCgpa
          ? ` >= minimum ${opportunity.minCgpa.toFixed(1)}`
          : ''
      })`
    );
  } else {
    eligibilityDetails.push(
      `CGPA requirement not met (Your CGPA: ${profile.cgpa.toFixed(
        1
      )} < minimum required: ${opportunity.minCgpa?.toFixed(1)})`
    );
  }

  const eligibilityStatus: EligibilityStatus = {
    isEligible,
    branchSatisfied,
    yearSatisfied,
    academicSatisfied,
    details: eligibilityDetails
  };

  const eligibilityScore = isEligible ? 100 : 0;

  // -----------------------------------------------------------
  // 4. MATCH SCORE (Explainable 5-Factor Weighted Model)
  // -----------------------------------------------------------
  // Skills = 40%, Interests = 25%, Branch = 15%, Year = 10%, Eligibility = 10%
  const skillComponent = skillMatch * 0.40;
  const interestComponent = interestMatch * 0.25;
  const branchComponent = branchMatch ? 15 : 0;
  const yearComponent = yearMatch ? 10 : 0;
  const eligibilityComponent = isEligible ? 10 : 0;

  const overallMatchPercentage = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        skillComponent +
          interestComponent +
          branchComponent +
          yearComponent +
          eligibilityComponent
      )
    )
  );
  const matchPercentage = overallMatchPercentage;

  const matchLevel = getMatchLevel(overallMatchPercentage);
  const matchGrade = getMatchGrade(overallMatchPercentage, isEligible);

  // Hard filter rule: Ineligible candidates are never valid recommendations
  const isValidRecommendation = isEligible && overallMatchPercentage >= 60;

  // -----------------------------------------------------------
  // 5. DYNAMIC "WHY YOU MATCH" EXPLAINABLE SIGNALS
  // -----------------------------------------------------------
  const whyYouMatch: string[] = [];

  // Eligibility signal
  if (isEligible) {
    whyYouMatch.push(
      `You satisfy all eligibility criteria for ${profile.branch} (${profile.currentYear}, CGPA: ${profile.cgpa.toFixed(
        1
      )}).`
    );
  } else {
    const failedParts: string[] = [];
    if (!branchSatisfied) failedParts.push(`Branch (${profile.branch})`);
    if (!yearSatisfied) failedParts.push(`Year (${profile.currentYear})`);
    if (!academicSatisfied)
      failedParts.push(
        `CGPA (${profile.cgpa.toFixed(1)} < min ${opportunity.minCgpa?.toFixed(1)})`
      );
    whyYouMatch.push(
      `Eligibility Notice: You do not meet the mandatory criteria for ${failedParts.join(
        ' and '
      )}. This opportunity is not a valid recommendation.`
    );
  }

  // Required skills signal
  if (matchedSkills.length > 0) {
    whyYouMatch.push(
      `Your verified skills in ${matchedSkills.join(', ')} match ${
        matchedSkills.length
      } of ${totalRequired} required qualification(s).`
    );
  } else if (totalRequired > 0) {
    whyYouMatch.push(
      `Skill Gap: You currently do not have any of the required skills (${opportunity.requiredSkills.join(
        ', '
      )}). Prioritize learning these first.`
    );
  }

  // Preferred skills bonus signal
  if (matchedPreferredSkills.length > 0) {
    whyYouMatch.push(
      `Bonus qualification: You also possess preferred skill(s): ${matchedPreferredSkills.join(
        ', '
      )}.`
    );
  }

  // Interests signal
  if (matchedInterests.length > 0) {
    whyYouMatch.push(
      `Your interest in ${matchedInterests.join(
        ', '
      )} strongly aligns with this ${opportunity.type} opportunity.`
    );
  }

  // Academic background signal
  if (branchMatch && isEligible) {
    whyYouMatch.push(
      `Your ${profile.branch} academic discipline provides solid foundational preparation for this role.`
    );
  }

  // Work mode signal
  if (isModeMatched) {
    whyYouMatch.push(
      `The ${opportunity.mode} format matches your preferred working mode.`
    );
  }

  // Ensure minimum depth
  if (whyYouMatch.length < 3) {
    whyYouMatch.push(
      'Your foundational coursework supports rapid onboarding and project execution.'
    );
  }

  // -----------------------------------------------------------
  // 6. PERSONALIZED 4-STEP ACTION PLAN
  // -----------------------------------------------------------
  const primaryMissingSkill =
    missingSkills[0] ||
    (opportunity.requiredSkills[0] || 'Core Technical Tools');
  const anchorSkill =
    matchedSkills[0] || profile.skills[0] || 'Software Engineering';

  const actionPlan: ActionPlanStep[] = [
    {
      id: `act-${opportunity.id}-1`,
      stepNumber: 1,
      title:
        missingSkills.length > 0
          ? `Learn & Master ${primaryMissingSkill}`
          : `Deep Dive into Advanced ${primaryMissingSkill}`,
      duration: '2 weeks',
      description:
        missingSkills.length > 0
          ? `Bridge your key skill gap by completing a focused course or tutorial series in ${primaryMissingSkill} and building basic proof-of-concept exercises.`
          : `Advance your proficiency in ${primaryMissingSkill} by studying production design patterns and optimization techniques.`,
      category: 'learning',
      skillTarget: primaryMissingSkill,
      resourceTitle: `${primaryMissingSkill} Official Documentation & Tutorials`,
      resourceLink: `https://www.google.com/search?q=${encodeURIComponent(
        primaryMissingSkill
      )}+tutorial+official+documentation`,
      isCompleted: false,
      status: 'pending'
    },
    {
      id: `act-${opportunity.id}-2`,
      stepNumber: 2,
      title: `Build a Portfolio Project with ${primaryMissingSkill}`,
      duration: '1 week',
      description: `Create an end-to-end practical project integrating ${anchorSkill} with ${primaryMissingSkill}. Commit your clean code to GitHub with clear architecture documentation.`,
      category: 'project',
      skillTarget: primaryMissingSkill,
      resourceTitle: `GitHub Project Templates for ${primaryMissingSkill}`,
      resourceLink: `https://github.com/topics/${encodeURIComponent(
        primaryMissingSkill.toLowerCase().replace(/\s+/g, '-')
      )}`,
      isCompleted: false,
      status: 'pending'
    },
    {
      id: `act-${opportunity.id}-3`,
      stepNumber: 3,
      title: `Tailor Resume for ${opportunity.organization}`,
      duration: '2-3 days',
      description: `Refine your resume to spotlight ${
        matchedSkills.length > 0
          ? matchedSkills.join(', ')
          : 'your technical competencies'
      } and your new ${primaryMissingSkill} project, tailoring impact metrics for ${
        opportunity.organization
      }.`,
      category: 'resume',
      skillTarget: 'Resume Optimization',
      resourceTitle: 'Tech Resume Guide & ATS Checklist',
      resourceLink: 'https://www.overleaf.com/gallery/tagged/cv',
      isCompleted: false,
      status: 'pending'
    },
    {
      id: `act-${opportunity.id}-4`,
      stepNumber: 4,
      title: `Submit Application for ${opportunity.title}`,
      duration: `Deadline: ${opportunity.deadline}`,
      description: isEligible
        ? `Submit your application and portfolio links to ${opportunity.organization} before the ${opportunity.deadline} cutoff.`
        : `Review eligibility requirements. Reach out to ${opportunity.organization} coordinators or consider related opportunities matching your profile.`,
      category: 'application',
      skillTarget: opportunity.title,
      resourceTitle: `${opportunity.organization} Application Portal`,
      resourceLink: opportunity.applicationUrl || '#',
      isCompleted: false,
      status: 'pending'
    }
  ];

  return {
    id: `match-${opportunity.id}-${Date.now()}`,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    organization: opportunity.organization,
    opportunityType: opportunity.type,
    overallMatchPercentage,
    matchPercentage,
    skillMatchPercentage,
    skillMatch,
    interestMatchPercentage,
    interestMatch,
    branchMatch,
    yearMatch,
    eligibilityScore,
    eligible,
    isValidRecommendation,
    matchGrade,
    matchLevel,
    whyYouMatch,
    matchedSkills,
    missingSkills,
    eligibility: eligibilityStatus,
    actionPlan,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Primary asynchronous analysis function.
 * Preserved for full backward compatibility with existing UI callers.
 */
export async function analyzeOpportunityMatch(
  profile: StudentProfile,
  opportunity: Opportunity,
  simulateAiDelay: boolean = true
): Promise<MatchResult> {
  if (simulateAiDelay) {
    await delay(1200);
  }

  return matchStudentWithOpportunity(profile, opportunity);
}

/**
 * Result structure for multi-opportunity evaluation.
 */
export interface MultipleOpportunitiesEvaluation {
  validRecommendations: MatchResult[];
  ineligibleOpportunities: MatchResult[];
  allResults: MatchResult[];
}

/**
 * Evaluates multiple opportunities for a given student profile:
 *   - Evaluates each opportunity with matchStudentWithOpportunity
 *   - Removes ineligible opportunities from valid recommendations (HARD FILTER)
 *   - Sorts eligible opportunities by match percentage descending
 *
 * @returns Array of valid, eligible recommendations sorted by match percentage descending
 */
export function rankOpportunities(
  profile: StudentProfile,
  opportunities: Opportunity[]
): MatchResult[] {
  return opportunities
    .map((opp) => matchStudentWithOpportunity(profile, opp))
    .filter((res) => res.eligibility.isEligible)
    .sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);
}

/**
 * Comprehensive multi-opportunity evaluation helper.
 * Separates eligible recommendations from disqualified opportunities.
 */
export function evaluateOpportunities(
  profile: StudentProfile,
  opportunities: Opportunity[]
): MultipleOpportunitiesEvaluation {
  const allResults = opportunities.map((opp) =>
    matchStudentWithOpportunity(profile, opp)
  );

  const validRecommendations = allResults
    .filter((res) => res.eligibility.isEligible)
    .sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);

  const ineligibleOpportunities = allResults
    .filter((res) => !res.eligibility.isEligible)
    .sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);

  return {
    validRecommendations,
    ineligibleOpportunities,
    allResults
  };
}

/**
 * Helper to fetch all mock opportunities (preserved for backward compatibility).
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  return mockOpportunities;
}

/**
 * Helper to fetch a single opportunity (preserved for backward compatibility).
 */
export async function getOpportunityById(
  id: string
): Promise<Opportunity | undefined> {
  return mockOpportunities.find((o) => o.id === id);
}
