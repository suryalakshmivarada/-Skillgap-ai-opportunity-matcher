import type { StudentProfile, Opportunity, MatchResult, ActionPlanStep, EligibilityStatus } from '../types';
import { mockOpportunities } from '../data/mockOpportunities';
import { api } from './api';

/**
 * AI MATCHING SERVICE
 * -------------------------------------------------------------
 * Connected to Express + PostgreSQL Backend via api.analyzeMatch()
 * Includes seamless fallback to local engine if server is offline.
 * -------------------------------------------------------------
 */

// Simulated delay helper to give the realistic AI processing feel
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Skill aliases for intelligent semantic matching
export const SKILL_ALIASES: Record<string, string[]> = {
  'python': ['python', 'python3', 'py'],
  'machine learning': ['machine learning', 'ml', 'ai/ml', 'ai & ml', 'machine learning algorithms'],
  'deep learning': ['deep learning', 'dl', 'neural networks'],
  'tensorflow': ['tensorflow', 'tf', 'keras', 'pytorch'],
  'react': ['react', 'react.js', 'reactjs'],
  'javascript': ['javascript', 'js', 'es6', 'ecmascript'],
  'typescript': ['typescript', 'ts'],
  'node.js': ['node.js', 'nodejs', 'node'],
  'sql': ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite', 'database', 'rdbms'],
  'cloud': ['cloud', 'aws', 'gcp', 'google cloud', 'azure', 'cloud computing'],
  'c++': ['c++', 'cpp'],
  'java': ['java', 'core java', 'spring', 'spring boot'],
  'ui/ux': ['ui/ux', 'ui design', 'ux design', 'figma', 'product design', 'prototyping', 'wireframing'],
  'html': ['html', 'html5'],
  'css': ['css', 'css3', 'tailwind', 'tailwind css', 'bootstrap'],
  'docker': ['docker', 'containers', 'containerization'],
  'data science': ['data science', 'pandas', 'numpy', 'data analytics', 'analytics', 'statistics'],
  'cybersecurity': ['cybersecurity', 'security', 'information security', 'infosec', 'ctf', 'network security', 'ethical hacking'],
  'communication': ['communication', 'soft skills', 'presentation', 'teamwork', 'leadership']
};

export function isSkillMatch(studentSkill: string, targetSkill: string): boolean {
  const s = studentSkill.trim().toLowerCase();
  const t = targetSkill.trim().toLowerCase();
  if (s === t) return true;
  if (s.includes(t) || t.includes(s)) return true;

  // Check alias groups
  for (const group of Object.values(SKILL_ALIASES)) {
    const hasS = group.some(alias => s === alias || s.includes(alias) || alias.includes(s));
    const hasT = group.some(alias => t === alias || t.includes(alias) || alias.includes(t));
    if (hasS && hasT) return true;
  }
  return false;
}

/**
 * Pure rule-based matching calculation between student profile and opportunity
 */
export function calculateMatch(profile: StudentProfile, opportunity: Opportunity): MatchResult {
  const studentSkills = profile.skills || [];
  const requiredSkills: string[] = opportunity.requiredSkills || [];
  const preferredSkills: string[] = opportunity.preferredSkills || [];

  // 1. Skill Matching
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  requiredSkills.forEach(req => {
    const found = studentSkills.find(s => isSkillMatch(s, req));
    if (found) {
      if (!matchedSkills.includes(req)) matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  const matchedPreferred: string[] = [];
  preferredSkills.forEach(pref => {
    const found = studentSkills.find(s => isSkillMatch(s, pref));
    if (found) {
      matchedPreferred.push(pref);
      if (!matchedSkills.includes(pref)) matchedSkills.push(pref);
    }
  });

  const totalReq = requiredSkills.length;
  const matchedReqCount = totalReq - missingSkills.length;
  const reqRatio = totalReq > 0 ? (matchedReqCount / totalReq) : 1;
  const prefBonus = preferredSkills.length > 0 ? (matchedPreferred.length / preferredSkills.length) * 15 : 0;

  let skillMatchPercentage: number;
  if (totalReq > 0 && matchedReqCount === 0) {
    skillMatchPercentage = matchedPreferred.length > 0 ? 10 : 0;
  } else if (totalReq > 0) {
    skillMatchPercentage = Math.min(100, Math.round(reqRatio * 85 + prefBonus));
  } else {
    skillMatchPercentage = 80;
  }

  // 2. Interest Alignment Logic
  const studentInterests = profile.interests || [];
  const preferredTypes = profile.preferredTypes || [];
  const preferredMode = profile.preferredMode || 'All';

  // 2a. Type Match (30 pts max)
  let typeScore = 15;
  if (preferredTypes.length > 0) {
    if (preferredTypes.some(t => t.toLowerCase() === (opportunity.type || '').toLowerCase())) {
      typeScore = 30;
    } else {
      typeScore = 5;
    }
  }

  // 2b. Domain / Topic Alignment (50 pts max)
  const oppSearchContext = [
    (opportunity.title || '').toLowerCase(),
    (opportunity.type || '').toLowerCase(),
    (opportunity.shortDescription || '').toLowerCase(),
    ...(opportunity.tags || []).map((t: string) => t.toLowerCase()),
    ...(opportunity.requiredSkills || []).map((s: string) => s.toLowerCase())
  ].join(' ');

  let domainHits = 0;
  studentInterests.forEach(interest => {
    const intLower = interest.toLowerCase();
    if (oppSearchContext.includes(intLower)) {
      domainHits += 1;
    } else {
      const aliases = SKILL_ALIASES[intLower] || [];
      if (aliases.some(a => oppSearchContext.includes(a))) {
        domainHits += 1;
      }
    }
  });

  let domainScore = 5;
  if (studentInterests.length > 0) {
    if (domainHits > 0) {
      const hitRatio = Math.min(1, domainHits / Math.max(1, Math.min(3, studentInterests.length)));
      domainScore = Math.round(25 + hitRatio * 25);
    } else {
      domainScore = 5;
    }
  } else {
    domainScore = 30;
  }

  // 2c. Mode Preference (20 pts max)
  let modeScore = 10;
  if (preferredMode === 'All' || preferredMode.toLowerCase() === (opportunity.mode || '').toLowerCase()) {
    modeScore = 20;
  } else if (
    (preferredMode.toLowerCase() === 'hybrid' && opportunity.mode?.toLowerCase() === 'online') ||
    (preferredMode.toLowerCase() === 'online' && opportunity.mode?.toLowerCase() === 'hybrid')
  ) {
    modeScore = 14;
  } else {
    modeScore = 5;
  }

  const interestMatchPercentage = Math.min(100, Math.max(0, typeScore + domainScore + modeScore));

  // 3. Academic & Branch Eligibility
  const eligibleBranches: string[] = opportunity.eligibleBranches || [];
  const eligibleYears: string[] = opportunity.eligibleYears || [];
  const studentBranch = (profile.branch || '').trim();
  const studentYear = (profile.currentYear || '').trim();
  const studentCgpa = profile.cgpa ?? 0;
  const minCgpa = opportunity.minCgpa ?? 0;

  let branchScore = 0;
  let branchSatisfied = false;
  if (eligibleBranches.some(b => b.toLowerCase() === studentBranch.toLowerCase())) {
    branchScore = 40;
    branchSatisfied = true;
  } else if (eligibleBranches.includes('Other')) {
    branchScore = 28;
    branchSatisfied = true;
  } else {
    branchScore = 0;
    branchSatisfied = false;
  }

  let yearScore = 0;
  let yearSatisfied = false;
  if (eligibleYears.some(y => y.toLowerCase() === studentYear.toLowerCase())) {
    yearScore = 35;
    yearSatisfied = true;
  } else {
    yearScore = 0;
    yearSatisfied = false;
  }

  let gpaScore = 25;
  let academicSatisfied = true;
  if (minCgpa > 0) {
    if (studentCgpa >= minCgpa) {
      gpaScore = 25;
      academicSatisfied = true;
    } else {
      academicSatisfied = false;
      const shortfall = minCgpa - studentCgpa;
      gpaScore = Math.max(0, Math.round(25 - shortfall * 20));
    }
  }

  const eligibilityScore = Math.min(100, Math.max(0, branchScore + yearScore + gpaScore));
  const isEligible = branchSatisfied && yearSatisfied && academicSatisfied;

  const eligibilityDetails: string[] = [];
  if (branchSatisfied) {
    eligibilityDetails.push(`Branch: ${studentBranch} is eligible`);
  } else {
    eligibilityDetails.push(`Branch: ${studentBranch} is outside target disciplines (${eligibleBranches.join(', ')})`);
  }
  if (yearSatisfied) {
    eligibilityDetails.push(`Academic Year: ${studentYear} meets criteria`);
  } else {
    eligibilityDetails.push(`Academic Year: ${studentYear} does not match required years (${eligibleYears.join(', ')})`);
  }
  if (academicSatisfied) {
    eligibilityDetails.push(`CGPA: ${studentCgpa} satisfies minimum requirement (${minCgpa || 'None'})`);
  } else {
    eligibilityDetails.push(`CGPA: ${studentCgpa} is below required ${minCgpa}`);
  }

  const eligibility: EligibilityStatus = {
    isEligible,
    branchSatisfied,
    yearSatisfied,
    academicSatisfied,
    details: eligibilityDetails
  };

  // 4. Overall Match Percentage calculation
  // Weighted: 45% Skills, 25% Interests, 30% Eligibility
  let overallMatchPercentage = Math.round(
    skillMatchPercentage * 0.45 + interestMatchPercentage * 0.25 + eligibilityScore * 0.30
  );

  // Ineligible candidates are capped at 64% max to prevent false "Excellent Match"
  if (!isEligible) {
    overallMatchPercentage = Math.min(64, overallMatchPercentage);
  }

  overallMatchPercentage = Math.max(10, Math.min(99, overallMatchPercentage));

  let matchGrade: 'Excellent Match' | 'Good Match' | 'Needs Improvement' = 'Good Match';
  if (overallMatchPercentage >= 80) {
    matchGrade = 'Excellent Match';
  } else if (overallMatchPercentage < 60) {
    matchGrade = 'Needs Improvement';
  }

  // 5. Explainable "Why You Match" Points
  const whyYouMatch: string[] = [];

  if (matchedSkills.length > 0) {
    whyYouMatch.push(`Technical match: You have verified skills in ${matchedSkills.slice(0, 3).join(', ')}.`);
  }

  if (matchedPreferred.length > 0) {
    whyYouMatch.push(`Preferred qualification bonus: You also know ${matchedPreferred.slice(0, 2).join(' & ')}.`);
  }

  if (domainHits > 0 && studentInterests.length > 0) {
    const relevant = studentInterests.find(i => oppSearchContext.includes(i.toLowerCase())) || studentInterests[0];
    whyYouMatch.push(`Interest alignment: Your focus on ${relevant} aligns directly with this opportunity.`);
  }

  if (isEligible) {
    whyYouMatch.push(`Academic criteria: ${studentBranch} discipline and ${studentYear} satisfy all requirements.`);
  } else if (branchSatisfied) {
    whyYouMatch.push(`Department match: ${studentBranch} is an eligible discipline.`);
  }

  if (preferredMode === 'All' || preferredMode.toLowerCase() === (opportunity.mode || '').toLowerCase()) {
    whyYouMatch.push(`Working format: ${opportunity.mode} mode matches your preference.`);
  }

  if (missingSkills.length > 0) {
    whyYouMatch.push(`Skill gap: Bridge ${missingSkills.slice(0, 2).join(', ')} to boost your competitiveness.`);
  }

  while (whyYouMatch.length < 3) {
    whyYouMatch.push('Academic record and degree curriculum provide solid foundational qualification.');
  }

  // 6. Action Plan
  const primaryMissing = missingSkills[0] || 'Specialized Tools';
  const actionPlan: ActionPlanStep[] = [
    {
      id: `act-${opportunity.id}-1`,
      stepNumber: 1,
      title: `Learn ${primaryMissing}`,
      duration: '2 weeks',
      description: `Complete a targeted beginner-to-intermediate ${primaryMissing} crash course and build a small proof-of-concept module.`,
      category: 'learning',
      skillTarget: primaryMissing,
      resourceTitle: `${primaryMissing} Quickstart Guide & Official Docs`,
      resourceLink: `https://www.google.com/search?q=learn+${encodeURIComponent(primaryMissing)}+tutorial`,
      isCompleted: false
    },
    {
      id: `act-${opportunity.id}-2`,
      stepNumber: 2,
      title: `Build a ${opportunity.type === 'Internship' ? 'Demonstration' : 'Hands-on'} Project`,
      duration: '1 week',
      description: `Create a practical, portfolio-ready project integrating ${matchedSkills[0] || 'Core Stack'} with ${primaryMissing}, and push code to GitHub with clear README documentation.`,
      category: 'project',
      skillTarget: matchedSkills[0] || 'Core Project',
      resourceTitle: 'GitHub Open Source Project Templates',
      resourceLink: 'https://github.com',
      isCompleted: false
    },
    {
      id: `act-${opportunity.id}-3`,
      stepNumber: 3,
      title: 'Improve Your Resume & Portfolio',
      duration: '2 days',
      description: `Tailor your resume headline, quantify project outcomes, and highlight ${matchedSkills.join(', ')} prominently.`,
      category: 'resume',
      resourceTitle: 'Tech Resume Checklist & Action Verb Guide',
      resourceLink: 'https://www.overleaf.com/gallery/tagged/cv',
      isCompleted: false
    },
    {
      id: `act-${opportunity.id}-4`,
      stepNumber: 4,
      title: 'Apply for the Opportunity',
      duration: `Deadline: ${opportunity.deadline}`,
      description: `Submit your customized application and portfolio links to ${opportunity.organization} before the cutoff.`,
      category: 'application',
      resourceTitle: `${opportunity.organization} Official Portal`,
      resourceLink: opportunity.applicationUrl || '#',
      isCompleted: false
    }
  ];

  return {
    id: `match-${opportunity.id}-${Date.now()}`,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    organization: opportunity.organization,
    opportunityType: opportunity.type,
    overallMatchPercentage,
    skillMatchPercentage,
    interestMatchPercentage,
    eligibilityScore,
    matchGrade,
    whyYouMatch,
    matchedSkills,
    missingSkills,
    eligibility,
    actionPlan,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Analyzes the match between a student profile and a specific opportunity
 */
export async function analyzeOpportunityMatch(
  profile: StudentProfile,
  opportunity: Opportunity,
  simulateAiDelay: boolean = true
): Promise<MatchResult> {
  // 1. Attempt Backend API match
  try {
    const backendResult = await api.analyzeMatch(profile, opportunity);
    if (backendResult && backendResult.overallMatchPercentage !== undefined) {
      if (simulateAiDelay) await delay(400);
      return backendResult;
    }
  } catch (error) {
    console.info('Backend matching API unavailable, computing with local AI engine:', error);
  }

  if (simulateAiDelay) {
    await delay(600);
  }

  // Fallback to pure rule-based calculation
  return calculateMatch(profile, opportunity);
}

/**
 * Helper to fetch all mock opportunities
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  return mockOpportunities;
}

/**
 * Helper to fetch a single opportunity
 */
export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
  return mockOpportunities.find(o => o.id === id);
}
