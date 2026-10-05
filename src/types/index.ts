export type OpportunityType =
  | 'Internship'
  | 'Hackathon'
  | 'Scholarship'
  | 'Certification'
  | 'Course'
  | 'Job'
  | 'Competition';

export type OpportunityMode = 'Online' | 'Offline' | 'Hybrid';

export type BranchOption =
  | 'CSE'
  | 'IT'
  | 'ECE'
  | 'EEE'
  | 'Mechanical'
  | 'Civil'
  | 'AI & ML'
  | 'Other';

export type YearOption =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year'
  | 'Graduate';

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  college: string;
  branch: BranchOption;
  currentYear: YearOption;
  cgpa: number;
  skills: string[];
  interests: string[];
  preferredTypes: OpportunityType[];
  preferredMode: OpportunityMode | 'All';
  updatedAt?: string;
}

export interface Opportunity {
  id: string;
  name?: string; // Member 3 alias for title
  title: string;
  organization: string;
  logoText?: string;
  logoBg?: string;
  type: OpportunityType;
  description?: string; // Member 3 alias for shortDescription
  shortDescription: string;
  fullDescription: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  branches?: string[]; // Member 3 alias for eligibleBranches
  eligibleBranches: string[];
  eligibleYears: string[];
  eligibility?: string | EligibilityStatus; // Member 3 descriptive eligibility
  minCgpa?: number;
  mode: OpportunityMode;
  location?: string;
  deadline: string;
  duration?: string;
  stipendOrPrize?: string;
  applicationUrl?: string;
  featured?: boolean;
  defaultMatchScore?: number;
  tags?: string[];
}

export interface ActionPlanStep {
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
  status?: 'pending' | 'in-progress' | 'completed';
}

// Aliases for Member 2 & 4 integrations
export type ActionPlanItem = ActionPlanStep;
export type ActionPlan = ActionPlanStep[];

export interface EligibilityStatus {
  isEligible: boolean;
  branchSatisfied: boolean;
  yearSatisfied: boolean;
  academicSatisfied: boolean;
  details: string[];
}

export type EligibilityResult = EligibilityStatus;

export type MatchLevel = 'Excellent Match' | 'Strong Match' | 'Good Match' | 'Low Match';

export interface MatchResult {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  organization: string;
  opportunityType: OpportunityType;
  overallMatchPercentage: number;
  matchPercentage: number;
  skillMatchPercentage: number;
  skillMatch: number;
  interestMatchPercentage: number;
  interestMatch: number;
  branchMatch: boolean;
  yearMatch: boolean;
  eligibilityScore: number;
  eligible: boolean;
  isValidRecommendation: boolean;
  matchGrade: 'Excellent Match' | 'Good Match' | 'Needs Improvement';
  matchLevel: MatchLevel;
  whyYouMatch: string[];
  matchedSkills: string[];
  missingSkills: string[];
  eligibility: EligibilityStatus;
  actionPlan: ActionPlanStep[];
  analyzedAt: string;
}

export interface OpportunityFilters {
  searchQuery: string;
  type: string; // 'All' | OpportunityType
  branch: string;
  year: string;
  mode: string; // 'All' | OpportunityMode
  minMatchScore: number;
  selectedSkill: string;
  eligibleOnly: boolean;
  sortBy: 'match' | 'deadline' | 'newest';
}
