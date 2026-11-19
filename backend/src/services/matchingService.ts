import { prisma, isDatabaseConnected } from '../config/prisma.js';
import { StudentProfileDTO, getStudentProfile } from './studentService.js';
import { getOpportunityById, getAllOpportunities } from './opportunityService.js';
import {
  analyzeOpportunitiesWithGemini,
  analyzeSingleOpportunityWithGemini,
  GeminiEvaluationItem,
  SanitizedStudentForGemini,
  OpportunityForGemini
} from './geminiService.js';

export function toSanitizedStudent(profile: StudentProfileDTO): SanitizedStudentForGemini {
  return {
    major: profile.branch || 'General Engineering',
    currentYear: profile.currentYear || 'All',
    skills: profile.skills || [],
    interests: profile.interests || [],
    cgpa: profile.cgpa ?? undefined
  };
}

export function toOpportunityForGemini(opp: any): OpportunityForGemini {
  return {
    id: opp.id,
    title: opp.title,
    organization: opp.organization,
    category: opp.type,
    shortDescription: opp.shortDescription || opp.fullDescription || '',
    requiredSkills: opp.requiredSkills || [],
    preferredSkills: opp.preferredSkills || [],
    eligibleBranches: opp.eligibleBranches || [],
    eligibleYears: opp.eligibleYears || [],
    minCgpa: opp.minCgpa ?? null,
    mode: opp.mode || 'Online'
  };
}

export interface ActionPlanStepDTO {
  id: string;
  stepNumber: number;
  title: string;
  duration: string;
  description: string;
  category: 'learning' | 'project' | 'resume' | 'application';
  skillTarget?: string;
  resourceTitle?: string;
  resourceLink?: string;
  isCompleted: boolean;
  status?: string;
}

export interface EligibilityStatusDTO {
  isEligible: boolean;
  branchSatisfied: boolean;
  yearSatisfied: boolean;
  academicSatisfied: boolean;
  details: string[];
}

export interface MatchResultDTO {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  organization: string;
  opportunityType: string;
  overallMatchPercentage: number;
  skillMatchPercentage: number;
  interestMatchPercentage: number;
  eligibilityScore: number;
  matchGrade: 'Excellent Match' | 'Good Match' | 'Needs Improvement';
  whyYouMatch: string[];
  matchedSkills: string[];
  missingSkills: string[];
  eligibility: EligibilityStatusDTO;
  actionPlan: ActionPlanStepDTO[];
  analyzedAt: string;
}

// In-memory cache for fallback when DB is offline
const inMemoryMatches: Record<string, MatchResultDTO> = {};
const inMemoryTasks: Record<string, boolean> = {};

interface InMemoryTaskRelationship {
  taskId: string;
  actionPlanId: string;
  studentId: string;
  opportunityId: string;
  step: ActionPlanStepDTO;
}

const inMemoryTaskRegistry = new Map<string, InMemoryTaskRelationship>();

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

export function calculateMatch(
  profile: StudentProfileDTO,
  opportunity: any,
  geminiEval?: GeminiEvaluationItem | null
): MatchResultDTO {
  const studentSkills = profile.skills || [];
  const requiredSkills: string[] = opportunity.requiredSkills || [];
  const preferredSkills: string[] = opportunity.preferredSkills || [];

  // 1. Skill Matching (Rule-Based Objective)
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

  // 2. Interest Alignment Logic (Rule-Based Base)
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

  const ruleInterestScore = Math.min(100, Math.max(0, typeScore + domainScore + modeScore));

  // Determine semantic relevance score:
  // If Gemini evaluated this opportunity, use its AI relevance score; otherwise fall back to rule-based interest score
  const interestMatchPercentage = geminiEval && typeof geminiEval.relevanceScore === 'number'
    ? Math.min(100, Math.max(0, geminiEval.relevanceScore))
    : ruleInterestScore;

  // 3. Academic & Branch Eligibility (Rule-Based Hard Constraints)
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

  const eligibility: EligibilityStatusDTO = {
    isEligible,
    branchSatisfied,
    yearSatisfied,
    academicSatisfied,
    details: eligibilityDetails
  };

  // 4. Overall Match Percentage calculation (Hybrid Formula: 45% Skills, 25% AI Relevance, 30% Eligibility)
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

  // Integrate Gemini's personalized explanation point if available
  if (geminiEval && geminiEval.relevanceReason) {
    whyYouMatch.push(`AI Analysis: ${geminiEval.relevanceReason}`);
  }

  if (matchedSkills.length > 0) {
    whyYouMatch.push(`Technical match: You have verified skills in ${matchedSkills.slice(0, 3).join(', ')}.`);
  }

  if (matchedPreferred.length > 0) {
    whyYouMatch.push(`Preferred qualification bonus: You also know ${matchedPreferred.slice(0, 2).join(' & ')}.`);
  }

  if (!geminiEval && domainHits > 0 && studentInterests.length > 0) {
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

  // 6. Action Plan with Gemini Skill Recommendations
  const primaryMissing = (geminiEval?.recommendedSkills && geminiEval.recommendedSkills[0]) ||
                         missingSkills[0] ||
                         'Specialized Tools';

  const studentPrefix = profile.id ? `act-${profile.id}-${opportunity.id}` : `act-${opportunity.id}`;

  const actionPlan: ActionPlanStepDTO[] = [
    {
      id: `${studentPrefix}-1`,
      stepNumber: 1,
      title: `Learn ${primaryMissing}`,
      duration: '2 weeks',
      description: `Complete a targeted beginner-to-intermediate ${primaryMissing} crash course and build a small proof-of-concept module.`,
      category: 'learning',
      skillTarget: primaryMissing,
      resourceTitle: `${primaryMissing} Quickstart Guide & Official Docs`,
      resourceLink: `https://www.google.com/search?q=learn+${encodeURIComponent(primaryMissing)}+tutorial`,
      isCompleted: inMemoryTasks[`${studentPrefix}-1`] ?? false,
      status: inMemoryTasks[`${studentPrefix}-1`] ? 'completed' : 'pending'
    },
    {
      id: `${studentPrefix}-2`,
      stepNumber: 2,
      title: `Build a ${opportunity.type === 'Internship' ? 'Demonstration' : 'Hands-on'} Project`,
      duration: '1 week',
      description: `Create a practical, portfolio-ready project integrating ${matchedSkills[0] || 'Core Stack'} with ${primaryMissing}, and push code to GitHub with clear README documentation.`,
      category: 'project',
      skillTarget: matchedSkills[0] || 'Core Project',
      resourceTitle: 'GitHub Open Source Project Templates',
      resourceLink: 'https://github.com',
      isCompleted: inMemoryTasks[`${studentPrefix}-2`] ?? false,
      status: inMemoryTasks[`${studentPrefix}-2`] ? 'completed' : 'pending'
    },
    {
      id: `${studentPrefix}-3`,
      stepNumber: 3,
      title: 'Improve Your Resume & Portfolio',
      duration: '2 days',
      description: `Tailor your resume headline, quantify project outcomes, and highlight ${matchedSkills.join(', ') || 'relevant skills'} prominently.`,
      category: 'resume',
      resourceTitle: 'Tech Resume Checklist & Action Verb Guide',
      resourceLink: 'https://www.overleaf.com/gallery/tagged/cv',
      isCompleted: inMemoryTasks[`${studentPrefix}-3`] ?? false,
      status: inMemoryTasks[`${studentPrefix}-3`] ? 'completed' : 'pending'
    },
    {
      id: `${studentPrefix}-4`,
      stepNumber: 4,
      title: 'Apply for the Opportunity',
      duration: `Deadline: ${opportunity.deadline}`,
      description: `Submit your customized application and portfolio links to ${opportunity.organization} before the cutoff.`,
      category: 'application',
      resourceTitle: `${opportunity.organization} Official Portal`,
      resourceLink: opportunity.applicationUrl || '#',
      isCompleted: inMemoryTasks[`${studentPrefix}-4`] ?? false,
      status: inMemoryTasks[`${studentPrefix}-4`] ? 'completed' : 'pending'
    }
  ];

  // Register in-memory task relationships for reliable ownership verification when offline
  if (profile.id) {
    const planId = `plan-${profile.id}-${opportunity.id}`;
    for (const step of actionPlan) {
      inMemoryTaskRegistry.set(step.id, {
        taskId: step.id,
        actionPlanId: planId,
        studentId: profile.id,
        opportunityId: opportunity.id,
        step
      });
    }
  }

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

export async function analyzeAndSaveMatch(
  studentIdOrProfile?: string | StudentProfileDTO,
  opportunityIdOrOpp?: string | any
): Promise<MatchResultDTO> {
  // Resolve profile
  let profile: StudentProfileDTO;
  if (!studentIdOrProfile || typeof studentIdOrProfile === 'string') {
    profile = await getStudentProfile(studentIdOrProfile as string);
  } else {
    profile = studentIdOrProfile;
  }

  // Resolve opportunity
  let opportunity: any;
  if (typeof opportunityIdOrOpp === 'string') {
    opportunity = await getOpportunityById(opportunityIdOrOpp);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${opportunityIdOrOpp}`);
    }
  } else {
    opportunity = opportunityIdOrOpp;
  }

  // Try Gemini single opportunity evaluation
  let geminiEval: GeminiEvaluationItem | null = null;
  try {
    geminiEval = await analyzeSingleOpportunityWithGemini(
      toSanitizedStudent(profile),
      toOpportunityForGemini(opportunity)
    );
  } catch (err) {
    console.warn('[Gemini Matching] Single match analysis fallback to rule engine:', err);
  }

  // Run matching engine (hybrid)
  const result = calculateMatch(profile, opportunity, geminiEval);

  // Cache in memory
  inMemoryMatches[opportunity.id] = result;

  // Persist to PostgreSQL if connected
  if (isDatabaseConnected() && profile.id) {
    try {
      // 1. Ensure opportunity exists in DB
      await prisma.opportunity.upsert({
        where: { id: opportunity.id },
        update: {},
        create: {
          id: opportunity.id,
          title: opportunity.title,
          organization: opportunity.organization,
          logoText: opportunity.logoText,
          logoBg: opportunity.logoBg,
          type: opportunity.type,
          shortDescription: opportunity.shortDescription,
          fullDescription: opportunity.fullDescription || opportunity.shortDescription,
          requiredSkills: opportunity.requiredSkills || [],
          preferredSkills: opportunity.preferredSkills || [],
          eligibleBranches: opportunity.eligibleBranches || [],
          eligibleYears: opportunity.eligibleYears || [],
          minCgpa: opportunity.minCgpa,
          mode: opportunity.mode,
          location: opportunity.location,
          deadline: opportunity.deadline,
          duration: opportunity.duration,
          stipendOrPrize: opportunity.stipendOrPrize,
          applicationUrl: opportunity.applicationUrl,
          featured: opportunity.featured || false,
          defaultMatchScore: opportunity.defaultMatchScore,
          tags: opportunity.tags || []
        }
      });

      // 2. Upsert Match
      const savedMatch = await prisma.match.upsert({
        where: {
          studentId_opportunityId: {
            studentId: profile.id,
            opportunityId: opportunity.id
          }
        },
        update: {
          overallMatchPercentage: result.overallMatchPercentage,
          skillMatchPercentage: result.skillMatchPercentage,
          interestMatchPercentage: result.interestMatchPercentage,
          eligibilityScore: result.eligibilityScore,
          matchGrade: result.matchGrade,
          whyYouMatch: result.whyYouMatch,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          branchSatisfied: result.eligibility.branchSatisfied,
          yearSatisfied: result.eligibility.yearSatisfied,
          academicSatisfied: result.eligibility.academicSatisfied,
          isEligible: result.eligibility.isEligible,
          eligibilityDetails: result.eligibility.details,
          analyzedAt: new Date()
        },
        create: {
          studentId: profile.id,
          opportunityId: opportunity.id,
          overallMatchPercentage: result.overallMatchPercentage,
          skillMatchPercentage: result.skillMatchPercentage,
          interestMatchPercentage: result.interestMatchPercentage,
          eligibilityScore: result.eligibilityScore,
          matchGrade: result.matchGrade,
          whyYouMatch: result.whyYouMatch,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          branchSatisfied: result.eligibility.branchSatisfied,
          yearSatisfied: result.eligibility.yearSatisfied,
          academicSatisfied: result.eligibility.academicSatisfied,
          isEligible: result.eligibility.isEligible,
          eligibilityDetails: result.eligibility.details,
          analyzedAt: new Date()
        }
      });

      // 3. Upsert ActionPlan
      let actionPlanRecord = await prisma.actionPlan.findFirst({
        where: { matchId: savedMatch.id }
      });

      if (!actionPlanRecord) {
        actionPlanRecord = await prisma.actionPlan.create({
          data: {
            matchId: savedMatch.id,
            studentId: profile.id,
            opportunityId: opportunity.id
          }
        });
      }

      // 4. Upsert ActionPlanTasks
      for (const step of result.actionPlan) {
        const uniqueTaskId = profile.id
          ? `act-${profile.id}-${opportunity.id}-${step.stepNumber}`
          : step.id;
        step.id = uniqueTaskId;

        if (profile.id) {
          inMemoryTaskRegistry.set(uniqueTaskId, {
            taskId: uniqueTaskId,
            actionPlanId: actionPlanRecord.id,
            studentId: profile.id,
            opportunityId: opportunity.id,
            step
          });
        }

        // Preserve task completion if already toggled in DB
        const existingTask = await prisma.actionPlanTask.findUnique({
          where: { id: uniqueTaskId }
        });
        if (existingTask) {
          step.isCompleted = existingTask.isCompleted;
          step.status = existingTask.status;
        }

        await prisma.actionPlanTask.upsert({
          where: { id: uniqueTaskId },
          update: {
            actionPlanId: actionPlanRecord.id,
            title: step.title,
            duration: step.duration,
            description: step.description,
            category: step.category,
            skillTarget: step.skillTarget,
            resourceTitle: step.resourceTitle,
            resourceLink: step.resourceLink
          },
          create: {
            id: uniqueTaskId,
            actionPlanId: actionPlanRecord.id,
            stepNumber: step.stepNumber,
            title: step.title,
            duration: step.duration,
            description: step.description,
            category: step.category,
            skillTarget: step.skillTarget,
            resourceTitle: step.resourceTitle,
            resourceLink: step.resourceLink,
            isCompleted: step.isCompleted,
            status: step.isCompleted ? 'completed' : 'pending'
          }
        });
      }

      result.id = savedMatch.id;
    } catch (e: any) {
      if (process.env.NODE_ENV === 'production') {
        const err: any = new Error('Database service is temporarily unavailable. Failed to persist match.');
        err.statusCode = 503;
        throw err;
      }
      console.warn('Failed to persist match to database, returning memory result:', e);
    }
  }

  return result;
}

export async function getStudentMatches(studentId?: string): Promise<Record<string, MatchResultDTO>> {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !isDatabaseConnected()) {
    const err: any = new Error('Database service is temporarily unavailable. Unable to load matches.');
    err.statusCode = 503;
    throw err;
  }

  if (isDatabaseConnected()) {
    try {
      const student = await getStudentProfile(studentId);
      const matches = await prisma.match.findMany({
        where: student.id ? { studentId: student.id } : undefined,
        include: {
          opportunity: true,
          actionPlans: {
            include: {
              tasks: {
                orderBy: { stepNumber: 'asc' }
              }
            }
          }
        },
        orderBy: { overallMatchPercentage: 'desc' }
      });

      if (matches.length > 0) {
        const result: Record<string, MatchResultDTO> = {};
        for (const m of matches) {
          const actionPlanTasks: ActionPlanStepDTO[] = (m.actionPlans[0]?.tasks || []).map(t => ({
            id: t.id,
            stepNumber: t.stepNumber,
            title: t.title,
            duration: t.duration,
            description: t.description,
            category: t.category as any,
            skillTarget: t.skillTarget || undefined,
            resourceTitle: t.resourceTitle || undefined,
            resourceLink: t.resourceLink || undefined,
            isCompleted: t.isCompleted,
            status: t.status
          }));

          result[m.opportunityId] = {
            id: m.id,
            opportunityId: m.opportunityId,
            opportunityTitle: m.opportunity.title,
            organization: m.opportunity.organization,
            opportunityType: m.opportunity.type,
            overallMatchPercentage: m.overallMatchPercentage,
            skillMatchPercentage: m.skillMatchPercentage,
            interestMatchPercentage: m.interestMatchPercentage,
            eligibilityScore: m.eligibilityScore,
            matchGrade: m.matchGrade as any,
            whyYouMatch: m.whyYouMatch,
            matchedSkills: m.matchedSkills,
            missingSkills: m.missingSkills,
            eligibility: {
              isEligible: m.isEligible,
              branchSatisfied: m.branchSatisfied,
              yearSatisfied: m.yearSatisfied,
              academicSatisfied: m.academicSatisfied,
              details: m.eligibilityDetails
            },
            actionPlan: actionPlanTasks,
            analyzedAt: m.analyzedAt.toISOString()
          };
        }
        return result;
      }

      // If connected to DB and student profile was found, return empty record for this student
      if (student?.id) {
        return {};
      }
    } catch (e: any) {
      if (isProd) {
        if (!e.statusCode) e.statusCode = 503;
        throw e;
      }
      console.warn('Error fetching matches from database, using memory cache:', e);
    }
  }

  if (isProd) {
    return {};
  }

  // If memory matches empty, pre-seed opp-1, opp-2, opp-4, opp-7
  if (Object.keys(inMemoryMatches).length === 0) {
    const profile = await getStudentProfile();
    const allOpps = await getAllOpportunities();
    for (const id of ['opp-1', 'opp-2', 'opp-4', 'opp-7']) {
      const opp = allOpps.find(o => o.id === id);
      if (opp) {
        inMemoryMatches[id] = calculateMatch(profile, opp);
      }
    }
  }

  return inMemoryMatches;
}

export async function getBestMatches(studentId?: string, limit: number = 5): Promise<MatchResultDTO[]> {
  const allMatchesMap = await getStudentMatches(studentId);
  const list = Object.values(allMatchesMap);
  return list.sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage).slice(0, limit);
}

export async function toggleTaskCompletion(
  taskId: string,
  authenticatedStudentId?: string
): Promise<{ taskId: string; isCompleted: boolean }> {
  // 1. Require a non-empty authenticated student ID; reject missing identity
  if (!authenticatedStudentId || !authenticatedStudentId.trim()) {
    const unauthErr: any = new Error(
      'Authentication required: A valid student identity must be provided to toggle an action-plan task.'
    );
    unauthErr.statusCode = 401;
    throw unauthErr;
  }

  // 2. When PostgreSQL is connected, find the task and verify ownership via parent action plan
  if (isDatabaseConnected()) {
    try {
      const task = await prisma.actionPlanTask.findUnique({
        where: { id: taskId },
        include: { actionPlan: true }
      });

      if (!task) {
        const notFoundErr: any = new Error(`Action plan task not found: ${taskId}`);
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }

      // Verify that actionPlan.studentId exactly matches the authenticated student ID
      if (task.actionPlan.studentId !== authenticatedStudentId) {
        const forbiddenErr: any = new Error(
          'Forbidden: You are not authorized to update another student action-plan task'
        );
        forbiddenErr.statusCode = 403;
        throw forbiddenErr;
      }

      const updated = await prisma.actionPlanTask.update({
        where: { id: taskId },
        data: {
          isCompleted: !task.isCompleted,
          status: !task.isCompleted ? 'completed' : 'pending'
        }
      });

      // Synchronize in-memory cache if task exists there
      const newStatus = updated.isCompleted;
      inMemoryTasks[taskId] = newStatus;
      const taskRel = inMemoryTaskRegistry.get(taskId);
      if (taskRel) {
        taskRel.step.isCompleted = newStatus;
        taskRel.step.status = newStatus ? 'completed' : 'pending';
      }

      return { taskId: updated.id, isCompleted: updated.isCompleted };
    } catch (e: any) {
      // Propagate database error immediately; never silently fall back to in-memory storage
      if (!e.statusCode) e.statusCode = 500;
      throw e;
    }
  }

  // 3. PostgreSQL is genuinely disconnected: production check
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const err: any = new Error('Database service is offline. Unable to toggle task.');
    err.statusCode = 503;
    throw err;
  }

  // 4. Development-only in-memory toggling: verify ownership from actual stored task/action-plan relationship
  const taskRel = inMemoryTaskRegistry.get(taskId);
  if (!taskRel) {
    const notFoundErr: any = new Error(`Action plan task not found: ${taskId}`);
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  // Reject if stored student ID does not match authenticated student ID
  if (taskRel.studentId !== authenticatedStudentId) {
    const forbiddenErr: any = new Error(
      'Forbidden: You are not authorized to update another student action-plan task'
    );
    forbiddenErr.statusCode = 403;
    throw forbiddenErr;
  }

  // Toggle in memory once verified
  const currentStatus = taskRel.step.isCompleted ?? inMemoryTasks[taskId] ?? false;
  const newStatus = !currentStatus;
  inMemoryTasks[taskId] = newStatus;
  taskRel.step.isCompleted = newStatus;
  taskRel.step.status = newStatus ? 'completed' : 'pending';

  // Update in-memory matches if present
  for (const matchKey of Object.keys(inMemoryMatches)) {
    const plan = inMemoryMatches[matchKey]?.actionPlan;
    const task = plan?.find(t => t.id === taskId);
    if (task) {
      task.isCompleted = newStatus;
      task.status = newStatus ? 'completed' : 'pending';
    }
  }

  return { taskId, isCompleted: newStatus };
}

export async function evaluateAllOpportunities(
  studentIdOrProfile?: string | StudentProfileDTO
): Promise<Record<string, MatchResultDTO>> {
  let profile: StudentProfileDTO;
  if (typeof studentIdOrProfile === 'string' || !studentIdOrProfile) {
    profile = await getStudentProfile(studentIdOrProfile as string);
  } else {
    profile = studentIdOrProfile;
  }

  const allOpps = await getAllOpportunities();

  // Run batch Gemini analysis for all opportunities in one structured call
  let geminiEvals: Record<string, GeminiEvaluationItem> | null = null;
  try {
    geminiEvals = await analyzeOpportunitiesWithGemini(
      toSanitizedStudent(profile),
      allOpps.map(toOpportunityForGemini)
    );
  } catch (err) {
    console.warn('[Gemini Matching] Batch evaluation fallback to rule engine:', err);
  }

  const results: Record<string, MatchResultDTO> = {};
  for (const opp of allOpps) {
    const oppEval = geminiEvals ? geminiEvals[opp.id] || null : null;
    results[opp.id] = calculateMatch(profile, opp, oppEval);
  }
  return results;
}
