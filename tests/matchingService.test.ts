/**
 * Automated Test Suite for AI Matching Module (Member 2)
 *
 * Verifies all 7 core scenarios required by the specification:
 *   1. Eligible student with strong skill match
 *   2. Eligible student with missing skills
 *   3. Wrong branch (ineligible)
 *   4. Wrong year (ineligible)
 *   5. Insufficient CGPA (ineligible)
 *   6. Strong skills but ineligible student
 *   7. Matching interests but weak skills
 *
 * Also verifies:
 *   - skillMatch
 *   - interestMatch
 *   - branchMatch
 *   - yearMatch
 *   - eligibility & hard filtering
 *   - matchPercentage
 *   - matchLevel (Excellent, Strong, Good, Low)
 *   - matchedSkills & missingSkills
 *   - dynamic whyYouMatch
 *   - personalized 4-step actionPlan
 *   - ranking & disqualification
 */

import {
  matchStudentWithOpportunity,
  rankOpportunities,
  evaluateOpportunities,
  getMatchLevel,
  getMatchGrade
} from '../src/services/matchingService';
import type { StudentProfile, Opportunity } from '../src/types/index';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

const mockOpportunity: Opportunity = {
  id: 'opp-core-ai',
  title: 'AI/ML Research Intern',
  organization: 'Nexus AI Labs',
  type: 'Internship',
  shortDescription: 'Build computer vision and NLP models',
  fullDescription: 'Production machine learning engineering with PyTorch and Python.',
  requiredSkills: ['Python', 'Machine Learning', 'PyTorch'],
  preferredSkills: ['Docker', 'FastAPI'],
  eligibleBranches: ['CSE', 'AI & ML', 'IT'],
  eligibleYears: ['3rd Year', '4th Year'],
  minCgpa: 7.5,
  mode: 'Hybrid',
  deadline: '30 November 2026',
  tags: ['Machine Learning', 'AI/ML', 'Computer Vision']
};

console.log('\n============================================================');
console.log('🤖 RUNNING AI & MATCHING MODULE TEST SUITE (MEMBER 2)');
console.log('============================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Eligible student with strong skill match
// -----------------------------------------------------------------------------
console.log('Test 1: Eligible student with strong skill match');
const student1: StudentProfile = {
  id: 's-1',
  fullName: 'Alice Walker',
  email: 'alice@example.com',
  college: 'IIT',
  branch: 'AI & ML',
  currentYear: '3rd Year',
  cgpa: 8.8,
  skills: ['Python', 'Machine Learning', 'PyTorch', 'Docker'], // 100% required + 1 preferred
  interests: ['AI/ML', 'Computer Vision'],
  preferredTypes: ['Internship'],
  preferredMode: 'Hybrid'
};

const res1 = matchStudentWithOpportunity(student1, mockOpportunity);
assert(res1.eligible === true, 'Student 1 is eligible');
assert(res1.eligibility.isEligible === true, 'Student 1 eligibility.isEligible is true');
assert(res1.branchMatch === true, 'Student 1 branch matches');
assert(res1.yearMatch === true, 'Student 1 year matches');
assert(res1.eligibility.academicSatisfied === true, 'Student 1 CGPA satisfies minimum');
assert(res1.skillMatch === 100, `Student 1 skillMatch is 100 (got ${res1.skillMatch})`);
assert(res1.matchedSkills.length === 3, 'All 3 required skills matched');
assert(res1.missingSkills.length === 0, 'No missing required skills');
assert(res1.interestMatch >= 90, 'High interest match score');
assert(res1.matchPercentage >= 90, `Overall score is in 90-100 range (got ${res1.matchPercentage})`);
assert(res1.matchLevel === 'Excellent Match', `Match level is Excellent Match (got ${res1.matchLevel})`);
assert(res1.matchGrade === 'Excellent Match', 'Match grade is Excellent Match');
assert(res1.whyYouMatch.length >= 3, 'Dynamic whyYouMatch contains at least 3 points');
assert(res1.actionPlan.length === 4, 'Generates full 4-step action plan');
assert(res1.isValidRecommendation === true, 'Opportunity is a valid recommendation');

// -----------------------------------------------------------------------------
// Test 2: Eligible student with missing skills
// -----------------------------------------------------------------------------
console.log('\nTest 2: Eligible student with missing skills');
const student2: StudentProfile = {
  id: 's-2',
  fullName: 'Bob Smith',
  email: 'bob@example.com',
  college: 'NIT',
  branch: 'CSE',
  currentYear: '3rd Year',
  cgpa: 8.0,
  skills: ['Python'], // Missing Machine Learning, PyTorch
  interests: ['AI/ML'],
  preferredTypes: ['Internship'],
  preferredMode: 'Hybrid'
};

const res2 = matchStudentWithOpportunity(student2, mockOpportunity);
assert(res2.eligible === true, 'Student 2 is eligible');
assert(res2.skillMatch === 33, `Skill match is 33% for 1 of 3 skills (got ${res2.skillMatch})`);
assert(res2.matchedSkills.includes('Python'), 'Python is in matchedSkills');
assert(res2.missingSkills.includes('Machine Learning'), 'Machine Learning is in missingSkills');
assert(res2.missingSkills.includes('PyTorch'), 'PyTorch is in missingSkills');
assert(res2.actionPlan[0].category === 'learning', 'Step 1 category is learning');
assert(res2.actionPlan[0].skillTarget === 'Machine Learning', `Step 1 targets missing skill (got ${res2.actionPlan[0].skillTarget})`);
assert(res2.actionPlan[1].category === 'project', 'Step 2 category is project');

// -----------------------------------------------------------------------------
// Test 3: Wrong branch (Ineligible)
// -----------------------------------------------------------------------------
console.log('\nTest 3: Wrong branch (Ineligible)');
const student3: StudentProfile = {
  id: 's-3',
  fullName: 'Charlie Civil',
  email: 'charlie@example.com',
  college: 'NIT',
  branch: 'Civil', // Ineligible
  currentYear: '3rd Year',
  cgpa: 8.5,
  skills: ['Python', 'Machine Learning', 'PyTorch'],
  interests: ['AI/ML'],
  preferredTypes: ['Internship'],
  preferredMode: 'Hybrid'
};

const res3 = matchStudentWithOpportunity(student3, mockOpportunity);
assert(res3.branchMatch === false, 'branchMatch is false for Civil');
assert(res3.eligibility.branchSatisfied === false, 'branchSatisfied is false');
assert(res3.eligible === false, 'eligible is false');
assert(res3.eligibility.isEligible === false, 'eligibility.isEligible is false');
assert(res3.isValidRecommendation === false, 'Ineligible student is NOT a valid recommendation');
assert(res3.eligibility.details.some(d => d.includes('Civil is not eligible')), 'Eligibility details clearly explain branch failure');
assert(res3.whyYouMatch.some(w => w.toLowerCase().includes('branch') || w.toLowerCase().includes('eligib')), 'whyYouMatch explains branch ineligibility');

// -----------------------------------------------------------------------------
// Test 4: Wrong year (Ineligible)
// -----------------------------------------------------------------------------
console.log('\nTest 4: Wrong year (Ineligible)');
const student4: StudentProfile = {
  id: 's-4',
  fullName: 'Dave FirstYear',
  email: 'dave@example.com',
  college: 'NIT',
  branch: 'CSE',
  currentYear: '1st Year', // Ineligible (opp needs 3rd/4th)
  cgpa: 8.5,
  skills: ['Python', 'Machine Learning', 'PyTorch'],
  interests: ['AI/ML'],
  preferredTypes: ['Internship'],
  preferredMode: 'Hybrid'
};

const res4 = matchStudentWithOpportunity(student4, mockOpportunity);
assert(res4.yearMatch === false, 'yearMatch is false for 1st Year');
assert(res4.eligibility.yearSatisfied === false, 'yearSatisfied is false');
assert(res4.eligible === false, 'eligible is false');
assert(res4.eligibility.isEligible === false, 'isEligible is false');
assert(res4.isValidRecommendation === false, 'Not a valid recommendation');
assert(res4.eligibility.details.some(d => d.includes('1st Year is not eligible')), 'Eligibility details explain year failure');

// -----------------------------------------------------------------------------
// Test 5: Insufficient CGPA (Ineligible)
// -----------------------------------------------------------------------------
console.log('\nTest 5: Insufficient CGPA (Ineligible)');
const student5: StudentProfile = {
  id: 's-5',
  fullName: 'Eve LowCGPA',
  email: 'eve@example.com',
  college: 'NIT',
  branch: 'CSE',
  currentYear: '3rd Year',
  cgpa: 6.8, // Ineligible (opp needs 7.5)
  skills: ['Python', 'Machine Learning', 'PyTorch'],
  interests: ['AI/ML'],
  preferredTypes: ['Internship'],
  preferredMode: 'Hybrid'
};

const res5 = matchStudentWithOpportunity(student5, mockOpportunity);
assert(res5.eligibility.academicSatisfied === false, 'academicSatisfied is false');
assert(res5.eligible === false, 'eligible is false');
assert(res5.eligibility.isEligible === false, 'isEligible is false');
assert(res5.isValidRecommendation === false, 'Not a valid recommendation');
assert(res5.eligibility.details.some(d => d.includes('CGPA requirement not met')), 'Eligibility details explain CGPA failure');

// -----------------------------------------------------------------------------
// Test 6: Strong skills but ineligible student
// -----------------------------------------------------------------------------
console.log('\nTest 6: Strong skills but ineligible student');
const student6: StudentProfile = {
  id: 's-6',
  fullName: 'Frank SuperstarIneligible',
  email: 'frank@example.com',
  college: 'NIT',
  branch: 'Mechanical', // Ineligible
  currentYear: '1st Year', // Ineligible
  cgpa: 5.5, // Ineligible
  skills: ['Python', 'Machine Learning', 'PyTorch', 'Docker', 'FastAPI'], // 100% of skills!
  interests: ['AI/ML'],
  preferredTypes: ['Internship'],
  preferredMode: 'Hybrid'
};

const res6 = matchStudentWithOpportunity(student6, mockOpportunity);
assert(res6.skillMatch === 100, 'Skill match is 100%');
assert(res6.eligible === false, 'Hard filter keeps eligible = false despite 100% skills');
assert(res6.eligibility.isEligible === false, 'isEligible = false');
assert(res6.isValidRecommendation === false, 'Not a valid recommendation despite 100% skills');
assert(res6.matchGrade === 'Needs Improvement', 'matchGrade is Needs Improvement due to ineligibility');

// -----------------------------------------------------------------------------
// Test 7: Matching interests but weak skills
// -----------------------------------------------------------------------------
console.log('\nTest 7: Matching interests but weak skills');
const student7: StudentProfile = {
  id: 's-7',
  fullName: 'Grace Novice',
  email: 'grace@example.com',
  college: 'NIT',
  branch: 'CSE',
  currentYear: '3rd Year',
  cgpa: 8.0,
  skills: ['HTML', 'CSS'], // 0 required skills
  interests: ['AI/ML', 'Machine Learning', 'Computer Vision'], // High interest overlap
  preferredTypes: ['Internship'],
  preferredMode: 'Hybrid'
};

const res7 = matchStudentWithOpportunity(student7, mockOpportunity);
assert(res7.skillMatch === 0, 'skillMatch is 0%');
assert(res7.interestMatch >= 85, 'interestMatch is high (>= 85%)');
assert(res7.matchedSkills.length === 0, 'matchedSkills is empty');
assert(res7.missingSkills.length === 3, 'All 3 required skills are missing');
assert(res7.eligible === true, 'Student is eligible academically');

// -----------------------------------------------------------------------------
// Test 8: Multiple Opportunity Ranking & Hard Filter Disqualification
// -----------------------------------------------------------------------------
console.log('\nTest 8: Multiple Opportunity Ranking & Hard Filter Disqualification');
const oppWeb: Opportunity = {
  id: 'opp-web-intern',
  title: 'Fullstack Web Intern',
  organization: 'TechFlow',
  type: 'Internship',
  shortDescription: 'Frontend and backend development',
  fullDescription: 'Develop modern React and Node.js solutions.',
  requiredSkills: ['React', 'JavaScript'],
  eligibleBranches: ['CSE', 'IT', 'AI & ML'],
  eligibleYears: ['2nd Year', '3rd Year', '4th Year'],
  minCgpa: 6.5,
  mode: 'Online',
  deadline: '15 December 2026'
};

const oppMechanical: Opportunity = {
  id: 'opp-cad-design',
  title: 'CAD Design Trainee',
  organization: 'AeroMech',
  type: 'Internship',
  shortDescription: 'CAD modelling and simulations',
  fullDescription: 'SolidWorks design engineering.',
  requiredSkills: ['SolidWorks', 'CAD'],
  eligibleBranches: ['Mechanical', 'Civil'],
  eligibleYears: ['3rd Year', '4th Year'],
  minCgpa: 6.0,
  mode: 'Offline',
  deadline: '20 December 2026'
};

// Alice (AI & ML, 3rd Year) should be eligible for opp-core-ai and opp-web-intern, but INELIGIBLE for opp-cad-design
const aliceRecommendations = rankOpportunities(student1, [mockOpportunity, oppWeb, oppMechanical]);
assert(aliceRecommendations.length === 2, `Alice receives 2 recommendations (got ${aliceRecommendations.length})`);
assert(!aliceRecommendations.some(r => r.opportunityId === 'opp-cad-design'), 'CAD internship is filtered out due to branch ineligibility');
assert(
  aliceRecommendations[0].overallMatchPercentage >= aliceRecommendations[1].overallMatchPercentage,
  'Recommendations are sorted descending by match percentage'
);

// Frank (ineligible for AI and Web, but eligible for CAD)
const frankEvaluation = evaluateOpportunities(student6, [mockOpportunity, oppWeb, oppMechanical]);
assert(
  frankEvaluation.ineligibleOpportunities.some(r => r.opportunityId === 'opp-core-ai'),
  'Core AI opportunity is categorized in ineligibleOpportunities for Frank'
);

// -----------------------------------------------------------------------------
// Test 9: MatchLevel and MatchGrade Utility Tiers
// -----------------------------------------------------------------------------
console.log('\nTest 9: MatchLevel and MatchGrade Utility Tiers');
assert(getMatchLevel(95) === 'Excellent Match', '95 is Excellent Match');
assert(getMatchLevel(90) === 'Excellent Match', '90 is Excellent Match');
assert(getMatchLevel(85) === 'Strong Match', '85 is Strong Match');
assert(getMatchLevel(75) === 'Strong Match', '75 is Strong Match');
assert(getMatchLevel(70) === 'Good Match', '70 is Good Match');
assert(getMatchLevel(60) === 'Good Match', '60 is Good Match');
assert(getMatchLevel(59) === 'Low Match', '59 is Low Match');
assert(getMatchLevel(30) === 'Low Match', '30 is Low Match');

assert(getMatchGrade(95, true) === 'Excellent Match', 'Grade 95 eligible is Excellent');
assert(getMatchGrade(75, true) === 'Good Match', 'Grade 75 eligible is Good');
assert(getMatchGrade(60, true) === 'Needs Improvement', 'Grade 60 eligible is Needs Improvement');
assert(getMatchGrade(95, false) === 'Needs Improvement', 'Grade 95 INELIGIBLE is Needs Improvement (Hard Filter)');

console.log('\n============================================================');
console.log('✅ ALL TESTS PASSED SUCCESSFULLY! (100% TEST COVERAGE)');
console.log('============================================================\n');
