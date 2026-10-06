/**
 * OPPORTUNITY DATA & MATCHING INTEGRATION TEST SUITE
 * ============================================================
 * Member 3: Opportunities & Data Engineer
 *
 * Verifies:
 *   1. Full dataset integrity (30 items, required breakdown, required fields)
 *   2. Data service methods (getAllOpportunities, getOpportunitiesByType, etc.)
 *   3. Matching compatibility against existing Member 2 matching engine:
 *      Scenario 1: Strong skill match
 *      Scenario 2: Missing skills
 *      Scenario 3: Wrong branch (disqualification)
 *      Scenario 4: Wrong year (disqualification)
 *      Scenario 5: Insufficient CGPA (disqualification)
 *      Scenario 6: Matching interests
 *      Scenario 7: Different preferred modes (Remote, On-site, Hybrid)
 *      Scenario 8: Multiple opportunities ranked together (ranking & filtering)
 * ============================================================
 */

import {
  getAllOpportunities,
  getOpportunities,
  getOpportunityById,
  getOpportunitiesByType,
  getOpportunitiesByBranch,
  getOpportunitiesByYear,
  getOpportunitiesByMode,
  getOpportunitiesBySkill,
  getOpportunitiesByLocation,
  getFeaturedOpportunities,
  filterOpportunities
} from '../src/services/opportunityService';

import {
  matchStudentWithOpportunity,
  rankOpportunities,
  evaluateOpportunities
} from '../src/services/matchingService';

import type { StudentProfile } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n============================================================');
  console.log('📦 RUNNING MEMBER 3 OPPORTUNITIES & DATA TEST SUITE');
  console.log('============================================================\n');

  // ---------------------------------------------------------------------------
  // 1. DATASET INTEGRITY & BREAKDOWN
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Dataset Integrity & Distribution ---');
  const allOpps = await getAllOpportunities();
  assert(allOpps.length === 30, `Dataset contains exactly 30 opportunities (got ${allOpps.length})`);

  // Count by type
  const internships = allOpps.filter(o => o.type === 'Internship');
  const hackathons = allOpps.filter(o => o.type === 'Hackathon');
  const jobs = allOpps.filter(o => o.type === 'Job');
  const courses = allOpps.filter(o => o.type === 'Course');
  const scholarships = allOpps.filter(o => o.type === 'Scholarship');

  assert(internships.length === 8, `Exactly 8 Internships (got ${internships.length})`);
  assert(hackathons.length === 6, `Exactly 6 Hackathons (got ${hackathons.length})`);
  assert(jobs.length === 5, `Exactly 5 Jobs (got ${jobs.length})`);
  assert(courses.length === 6, `Exactly 6 Courses (got ${courses.length})`);
  assert(scholarships.length === 5, `Exactly 5 Scholarships (got ${scholarships.length})`);

  // Check unique IDs
  const idSet = new Set(allOpps.map(o => o.id));
  assert(idSet.size === 30, `All 30 opportunity IDs are unique (got ${idSet.size})`);

  // Verify all required fields on every opportunity
  allOpps.forEach((opp) => {
    assert(Boolean(opp.id), `Opp ${opp.id}: has id`);
    assert(Boolean(opp.title && opp.title.length > 0), `Opp ${opp.id}: has title`);
    assert(Boolean(opp.type), `Opp ${opp.id}: has type`);
    assert(Boolean(opp.organization), `Opp ${opp.id}: has organization`);
    assert(Boolean(opp.shortDescription && opp.shortDescription.length > 0), `Opp ${opp.id}: has shortDescription`);
    assert(Boolean(opp.fullDescription && opp.fullDescription.length > 0), `Opp ${opp.id}: has fullDescription`);
    assert(Boolean(opp.description), `Opp ${opp.id}: has description alias`);
    assert(Array.isArray(opp.requiredSkills) && opp.requiredSkills.length > 0, `Opp ${opp.id}: has requiredSkills`);
    assert(Array.isArray(opp.eligibleBranches) && opp.eligibleBranches.length > 0, `Opp ${opp.id}: has eligibleBranches`);
    assert(Array.isArray(opp.branches), `Opp ${opp.id}: has branches alias`);
    assert(Array.isArray(opp.eligibleYears) && opp.eligibleYears.length > 0, `Opp ${opp.id}: has eligibleYears`);
    assert(Boolean(opp.mode), `Opp ${opp.id}: has mode`);
    assert(Boolean(opp.location), `Opp ${opp.id}: has location`);
    assert(Boolean(opp.deadline), `Opp ${opp.id}: has deadline`);
    assert(Boolean(opp.stipendOrPrize), `Opp ${opp.id}: has stipendOrPrize`);
    assert(Boolean(opp.applicationUrl && opp.applicationLink), `Opp ${opp.id}: has applicationUrl and applicationLink`);
  });
  console.log('  ✓ All 30 opportunities verified against required schema\n');

  // ---------------------------------------------------------------------------
  // 2. DATA SERVICE METHODS
  // ---------------------------------------------------------------------------
  console.log('--- Suite 2: Opportunity Data Service Methods ---');

  // getOpportunities alias
  const aliasOpps = await getOpportunities();
  assert(aliasOpps.length === 30, 'getOpportunities() returns all 30 opportunities');

  // getOpportunityById
  const singleOpp = await getOpportunityById('opp-1');
  assert(singleOpp !== undefined && singleOpp.id === 'opp-1', 'getOpportunityById finds opp-1');

  // getOpportunitiesByType
  const typeResults = await getOpportunitiesByType('Hackathon');
  assert(typeResults.length === 6, `getOpportunitiesByType('Hackathon') returns 6 items (got ${typeResults.length})`);

  // getOpportunitiesByBranch
  const cseResults = await getOpportunitiesByBranch('CSE');
  assert(cseResults.length >= 25, `getOpportunitiesByBranch('CSE') finds opportunities accepting CSE (got ${cseResults.length})`);

  const mechResults = await getOpportunitiesByBranch('Mechanical');
  assert(mechResults.length > 0, `getOpportunitiesByBranch('Mechanical') finds opportunities (got ${mechResults.length})`);

  // getOpportunitiesByYear
  const year3Results = await getOpportunitiesByYear('3rd Year');
  assert(year3Results.length > 0, `getOpportunitiesByYear('3rd Year') returns items (got ${year3Results.length})`);

  const year3Numeric = await getOpportunitiesByYear('3');
  assert(year3Numeric.length === year3Results.length, `getOpportunitiesByYear('3') equals '3rd Year' count (${year3Numeric.length})`);

  // getOpportunitiesByMode
  const remoteResults = await getOpportunitiesByMode('Remote');
  assert(remoteResults.length > 0, `getOpportunitiesByMode('Remote') returns items (got ${remoteResults.length})`);

  const onSiteResults = await getOpportunitiesByMode('On-site');
  assert(onSiteResults.length > 0, `getOpportunitiesByMode('On-site') returns items (got ${onSiteResults.length})`);

  const hybridResults = await getOpportunitiesByMode('Hybrid');
  assert(hybridResults.length > 0, `getOpportunitiesByMode('Hybrid') returns items (got ${hybridResults.length})`);

  // getOpportunitiesBySkill
  const pyResults = await getOpportunitiesBySkill('Python');
  assert(pyResults.length >= 10, `getOpportunitiesBySkill('Python') returns matching items (got ${pyResults.length})`);

  // getOpportunitiesByLocation
  const hydResults = await getOpportunitiesByLocation('Hyderabad');
  assert(hydResults.length >= 3, `getOpportunitiesByLocation('Hyderabad') returns items (got ${hydResults.length})`);

  // getFeaturedOpportunities
  const featured = await getFeaturedOpportunities();
  assert(featured.length > 0, `getFeaturedOpportunities() returns featured items (got ${featured.length})`);

  // filterOpportunities
  const filtered = await filterOpportunities({
    type: 'Internship',
    branch: 'CSE',
    mode: 'Hybrid'
  });
  assert(filtered.length > 0, `filterOpportunities with multi-criteria returns matches (got ${filtered.length})`);
  console.log('  ✓ Data service filtering methods pass successfully\n');

  // ---------------------------------------------------------------------------
  // 3. MATCHING ENGINE INTEGRATION SCENARIOS
  // ---------------------------------------------------------------------------
  console.log('--- Suite 3: 8 Core Matching Integration Scenarios ---');

  // SCENARIO 1: Strong skill match
  console.log('Scenario 1: Strong skill match');
  const studentStrong: StudentProfile = {
    id: 'test-s1',
    fullName: 'Suresh Kumar',
    email: 'suresh@example.com',
    college: 'JNTU Hyderabad',
    branch: 'CSE',
    currentYear: '3rd Year',
    cgpa: 8.5,
    skills: ['Python', 'Machine Learning', 'SQL', 'Artificial Intelligence', 'Docker'],
    interests: ['Machine Learning', 'Artificial Intelligence'],
    preferredTypes: ['Internship'],
    preferredMode: 'Hybrid'
  };
  const opp1 = (await getOpportunityById('opp-1'))!;
  const res1 = matchStudentWithOpportunity(studentStrong, opp1);
  assert(res1.eligible === true, 'Student is eligible');
  assert(res1.skillMatch === 100, `Skill match is 100% (got ${res1.skillMatch}%)`);
  assert(res1.missingSkills.length === 0, 'No missing skills');
  assert(res1.matchPercentage >= 90, `High overall match percentage (got ${res1.matchPercentage}%)`);
  assert(res1.matchGrade === 'Excellent Match', 'Match grade is Excellent Match');
  assert(res1.isValidRecommendation === true, 'Valid recommendation');

  // SCENARIO 2: Missing skills
  console.log('\nScenario 2: Missing skills');
  const studentMissing: StudentProfile = {
    id: 'test-s2',
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    college: 'Andhra University',
    branch: 'CSE',
    currentYear: '3rd Year',
    cgpa: 8.0,
    skills: ['Python'], // Missing Machine Learning, SQL, Artificial Intelligence
    interests: ['Artificial Intelligence'],
    preferredTypes: ['Internship'],
    preferredMode: 'Hybrid'
  };
  const res2 = matchStudentWithOpportunity(studentMissing, opp1);
  assert(res2.eligible === true, 'Student 2 is academically eligible');
  assert(res2.skillMatch === 25, `Skill match reflects 1 of 4 skills: 25% (got ${res2.skillMatch}%)`);
  assert(res2.missingSkills.length === 3, 'Missing skills array contains 3 items');
  assert(res2.actionPlan[0].category === 'learning', 'Action plan step 1 is learning');
  assert(res2.actionPlan[0].skillTarget === 'Machine Learning', 'Action plan targets missing skill');

  // SCENARIO 3: Wrong branch (Ineligible)
  console.log('\nScenario 3: Wrong branch');
  const studentWrongBranch: StudentProfile = {
    id: 'test-s3',
    fullName: 'Ravi Teja',
    email: 'ravi@example.com',
    college: 'SRKR Engineering College',
    branch: 'Civil', // opp-1 accepts CSE, CSIT, CSD, ECE
    currentYear: '3rd Year',
    cgpa: 8.5,
    skills: ['Python', 'Machine Learning', 'SQL', 'Artificial Intelligence'],
    interests: ['Machine Learning'],
    preferredTypes: ['Internship'],
    preferredMode: 'Hybrid'
  };
  const res3 = matchStudentWithOpportunity(studentWrongBranch, opp1);
  assert(res3.branchMatch === false, 'branchMatch is false');
  assert(res3.eligible === false, 'eligible is false');
  assert(res3.isValidRecommendation === false, 'Hard filter flags isValidRecommendation as false');
  assert(res3.eligibility.details.some(d => d.includes('Branch requirement not met')), 'Eligibility details explain branch mismatch');

  // SCENARIO 4: Wrong year (Ineligible)
  console.log('\nScenario 4: Wrong year');
  const oppJob = (await getOpportunityById('opp-8'))!; // 4th Year only
  const studentWrongYear: StudentProfile = {
    id: 'test-s4',
    fullName: 'Ananya Rao',
    email: 'ananya@example.com',
    college: 'IIT Hyderabad',
    branch: 'CSE',
    currentYear: '1st Year', // Ineligible for 4th year job
    cgpa: 9.0,
    skills: ['Java', 'C++', 'SQL', 'React'],
    interests: ['Web Development'],
    preferredTypes: ['Job'],
    preferredMode: 'Hybrid'
  };
  const res4 = matchStudentWithOpportunity(studentWrongYear, oppJob);
  assert(res4.yearMatch === false, 'yearMatch is false for 1st Year');
  assert(res4.eligible === false, 'eligible is false');
  assert(res4.isValidRecommendation === false, 'Disqualified due to year mismatch');

  // SCENARIO 5: Insufficient CGPA (Ineligible)
  console.log('\nScenario 5: Insufficient CGPA');
  const oppScholarship = (await getOpportunityById('opp-28'))!; // min CGPA 8.5
  const studentLowCgpa: StudentProfile = {
    id: 'test-s5',
    fullName: 'Kiran Varma',
    email: 'kiran@example.com',
    college: 'GVP Visakhapatnam',
    branch: 'ECE',
    currentYear: '3rd Year',
    cgpa: 7.2, // Below 8.5
    skills: ['IoT', 'C', 'Communication Skills'],
    interests: ['IoT'],
    preferredTypes: ['Scholarship'],
    preferredMode: 'Hybrid'
  };
  const res5 = matchStudentWithOpportunity(studentLowCgpa, oppScholarship);
  assert(res5.eligibility.academicSatisfied === false, 'academicSatisfied is false');
  assert(res5.eligible === false, 'eligible is false');
  assert(res5.isValidRecommendation === false, 'Disqualified due to low CGPA');

  // SCENARIO 6: Matching interests
  console.log('\nScenario 6: Matching interests');
  const studentInterest: StudentProfile = {
    id: 'test-s6',
    fullName: 'Meera Iyer',
    email: 'meera@example.com',
    college: 'BITS Pilani',
    branch: 'CSE',
    currentYear: '3rd Year',
    cgpa: 8.0,
    skills: ['Python'],
    interests: ['Machine Learning', 'Artificial Intelligence', 'Computer Vision'],
    preferredTypes: ['Internship'],
    preferredMode: 'Hybrid'
  };
  const res6 = matchStudentWithOpportunity(studentInterest, opp1);
  assert(res6.interestMatch >= 80, `High interest match (got ${res6.interestMatch}%)`);
  assert(res6.whyYouMatch.some(w => w.toLowerCase().includes('interest') || w.toLowerCase().includes('align')), 'whyYouMatch highlights interest alignment');

  // SCENARIO 7: Different preferred modes (Remote, On-site, Hybrid)
  console.log('\nScenario 7: Different preferred modes');
  const oppRemote = (await getOpportunityById('opp-9'))!; // Remote
  const oppOnsite = (await getOpportunityById('opp-4'))!; // On-site
  const oppHybrid = (await getOpportunityById('opp-1'))!; // Hybrid

  const studentRemotePref: StudentProfile = { ...studentStrong, preferredMode: 'Remote' };
  const studentOnsitePref: StudentProfile = { ...studentStrong, preferredMode: 'On-site' };
  const studentHybridPref: StudentProfile = { ...studentStrong, preferredMode: 'Hybrid' };

  const matchRemote = matchStudentWithOpportunity(studentRemotePref, oppRemote);
  const matchOnsite = matchStudentWithOpportunity(studentOnsitePref, oppOnsite);
  const matchHybrid = matchStudentWithOpportunity(studentHybridPref, oppHybrid);

  assert(matchRemote.whyYouMatch.some(w => w.includes('preferred working mode') || w.includes('matches')), 'Remote mode preference recognized');
  assert(matchOnsite.whyYouMatch.some(w => w.includes('preferred working mode') || w.includes('matches')), 'On-site mode preference recognized');
  assert(matchHybrid.whyYouMatch.some(w => w.includes('preferred working mode') || w.includes('matches')), 'Hybrid mode preference recognized');

  // SCENARIO 8: Multiple opportunities ranked together
  console.log('\nScenario 8: Multiple opportunities ranked together');
  const evaluatedAll = evaluateOpportunities(studentStrong, allOpps);
  assert(evaluatedAll.validRecommendations.length > 0, `Found valid recommendations (got ${evaluatedAll.validRecommendations.length})`);
  assert(evaluatedAll.ineligibleOpportunities.length > 0, `Found ineligible opportunities correctly filtered out (got ${evaluatedAll.ineligibleOpportunities.length})`);
  assert(
    evaluatedAll.validRecommendations.length + evaluatedAll.ineligibleOpportunities.length === 30,
    'All 30 opportunities categorized into eligible and ineligible sets'
  );

  // Check ranking order
  const ranked = rankOpportunities(studentStrong, allOpps);
  for (let i = 0; i < ranked.length - 1; i++) {
    assert(
      ranked[i].overallMatchPercentage >= ranked[i + 1].overallMatchPercentage,
      `Ranked order descending: index ${i} (${ranked[i].overallMatchPercentage}%) >= index ${i+1} (${ranked[i+1].overallMatchPercentage}%)`
    );
  }

  // ---------------------------------------------------------------------------
  // 4. UNIVERSAL BRANCH ELIGIBILITY (['All']) & RESTRICTION TESTS
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Universal Branch Eligibility ("All") & Restriction Verification ---');

  // Test 4.1: CSE Student with eligibleBranches: ["All"]
  console.log('Test 4.1: CSE Student with eligibleBranches: ["All"]');
  const studentCse: StudentProfile = {
    id: 'test-cse-universal',
    fullName: 'Rahul CSE',
    email: 'rahul.cse@example.com',
    college: 'JNTU',
    branch: 'CSE',
    currentYear: '3rd Year',
    cgpa: 8.0,
    skills: ['Python', 'SQL'],
    interests: ['Artificial Intelligence'],
    preferredTypes: ['Hackathon'],
    preferredMode: 'Remote'
  };
  const oppUniversal = (await getOpportunityById('opp-2'))!; // eligibleBranches: ['All']
  assert(oppUniversal.eligibleBranches.includes('All'), 'opp-2 has eligibleBranches: ["All"]');
  const resCseUniversal = matchStudentWithOpportunity(studentCse, oppUniversal);
  assert(resCseUniversal.branchMatch === true, 'CSE student branchMatch is true for eligibleBranches: ["All"]');
  assert(resCseUniversal.eligibility.branchSatisfied === true, 'CSE student branchSatisfied is true for eligibleBranches: ["All"]');
  assert(resCseUniversal.eligible === true, 'CSE student is eligible for opportunity with eligibleBranches: ["All"]');

  // Test 4.2: Mechanical Student with eligibleBranches: ["All"]
  console.log('\nTest 4.2: Mechanical Student with eligibleBranches: ["All"]');
  const studentMech: StudentProfile = {
    id: 'test-mech-universal',
    fullName: 'Mahesh Mechanical',
    email: 'mahesh.mech@example.com',
    college: 'AU',
    branch: 'Mechanical',
    currentYear: '3rd Year',
    cgpa: 8.0,
    skills: ['Python', 'SQL'],
    interests: ['Artificial Intelligence'],
    preferredTypes: ['Hackathon'],
    preferredMode: 'Remote'
  };
  const resMechUniversal = matchStudentWithOpportunity(studentMech, oppUniversal);
  assert(resMechUniversal.branchMatch === true, 'Mechanical student branchMatch is true for eligibleBranches: ["All"]');
  assert(resMechUniversal.eligibility.branchSatisfied === true, 'Mechanical student branchSatisfied is true for eligibleBranches: ["All"]');
  assert(resMechUniversal.eligible === true, 'Mechanical student is eligible for opportunity with eligibleBranches: ["All"]');

  // Test 4.3: Normal Branch Restrictions such as ["CSE", "ECE"]
  console.log('\nTest 4.3: Normal Branch Restrictions ["CSE", "ECE"]');
  const oppRestricted = {
    ...opp1,
    id: 'opp-test-restricted-branches',
    eligibleBranches: ['CSE', 'ECE']
  };

  const studentEce: StudentProfile = {
    ...studentCse,
    id: 'test-ece',
    branch: 'ECE'
  };

  const resCseRestricted = matchStudentWithOpportunity(studentCse, oppRestricted);
  assert(resCseRestricted.branchMatch === true, 'CSE student is eligible for ["CSE", "ECE"]');
  assert(resCseRestricted.eligible === true, 'CSE student passes eligibility for ["CSE", "ECE"]');

  const resEceRestricted = matchStudentWithOpportunity(studentEce, oppRestricted);
  assert(resEceRestricted.branchMatch === true, 'ECE student is eligible for ["CSE", "ECE"]');
  assert(resEceRestricted.eligible === true, 'ECE student passes eligibility for ["CSE", "ECE"]');

  const resMechRestricted = matchStudentWithOpportunity(studentMech, oppRestricted);
  assert(resMechRestricted.branchMatch === false, 'Mechanical student branchMatch is false for ["CSE", "ECE"]');
  assert(resMechRestricted.eligibility.branchSatisfied === false, 'Mechanical student branchSatisfied is false for ["CSE", "ECE"]');
  assert(resMechRestricted.eligible === false, 'Mechanical student is ineligible for ["CSE", "ECE"]');
  assert(resMechRestricted.isValidRecommendation === false, 'Mechanical student is not a valid recommendation for ["CSE", "ECE"]');

  console.log('\n============================================================');
  console.log('✅ ALL MEMBER 3 DATA & INTEGRATION TESTS PASSED (100%)');
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
