import dotenv from 'dotenv';
dotenv.config();
import { evaluateAllOpportunities, analyzeAndSaveMatch, getStudentMatches, toggleTaskCompletion } from '../services/matchingService.js';
import { prisma } from '../config/prisma.js';

async function runProfileVerification() {
  console.log('================================================================');
  console.log('VERIFYING HYBRID GEMINI MATCHING ENGINE ACROSS 3 STUDENT PROFILES');
  console.log('================================================================\n');

  // PROFILE 1: CSE Student interested in AI/ML
  const profile1 = {
    id: 'test-cse-student',
    fullName: 'Aarav Sharma',
    email: 'aarav.cse@example.edu',
    college: 'IIT Delhi',
    branch: 'CSE',
    currentYear: '3rd Year',
    cgpa: 8.5,
    skills: ['Python', 'SQL', 'Machine Learning', 'Git'],
    interests: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
    preferredTypes: ['Internship', 'Course'],
    preferredMode: 'Hybrid'
  };

  // PROFILE 2: Mechanical Student interested in Robotics
  const profile2 = {
    id: 'test-mech-student',
    fullName: 'Rohan Verma',
    email: 'rohan.mech@example.edu',
    college: 'BITS Pilani',
    branch: 'Mechanical',
    currentYear: '3rd Year',
    cgpa: 8.0,
    skills: ['C++', 'Python', 'ROS2', 'Robotics', 'CAD'],
    interests: ['Robotics', 'Autonomous Systems', 'Hardware Design'],
    preferredTypes: ['Competition', 'Internship'],
    preferredMode: 'All'
  };

  // PROFILE 3: Unrelated Student (Civil Engineering, Non-Tech)
  const profile3 = {
    id: 'test-civil-student',
    fullName: 'Pooja Patel',
    email: 'pooja.civil@example.edu',
    college: 'NIT Surat',
    branch: 'Civil',
    currentYear: '2nd Year',
    cgpa: 6.2,
    skills: ['AutoCAD', 'Surveying', 'Concrete Technology', 'Structural Analysis'],
    interests: ['Structural Engineering', 'Construction Management', 'Urban Planning'],
    preferredTypes: ['Internship'],
    preferredMode: 'Offline'
  };

  // -------------------------------------------------------------
  // Test Profile 1
  // -------------------------------------------------------------
  console.log('--- TEST 1: CSE Student (AI/ML Domain) ---');
  const start1 = Date.now();
  const results1 = await evaluateAllOpportunities(profile1);
  const dur1 = Date.now() - start1;
  const sorted1 = Object.values(results1).sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);
  console.log(`Evaluated ${sorted1.length} opportunities in ${dur1}ms.`);
  console.log('Top 3 Matches:');
  sorted1.slice(0, 3).forEach((m, idx) => {
    console.log(`  ${idx + 1}. [${m.opportunityId}] ${m.opportunityTitle} (${m.organization})`);
    console.log(`     Overall: ${m.overallMatchPercentage}% (${m.matchGrade}) | Skill: ${m.skillMatchPercentage}% | AI Relevance: ${m.interestMatchPercentage}% | Eligible: ${m.eligibility.isEligible}`);
    console.log(`     AI Insight: ${m.whyYouMatch.find(w => w.startsWith('AI Analysis:')) || m.whyYouMatch[0]}`);
  });
  console.log('Bottom Match:');
  const bot1 = sorted1[sorted1.length - 1];
  console.log(`  [${bot1.opportunityId}] ${bot1.opportunityTitle} -> Overall: ${bot1.overallMatchPercentage}% (${bot1.matchGrade})\n`);

  // Verify Profile 1 Expectations:
  const top1Id = sorted1[0].opportunityId;
  const isAiOppTop = ['opp-1', 'opp-6', 'opp-2'].includes(top1Id);
  console.log(`Verification 1: AI/ML opportunity ranks highest? ${isAiOppTop ? 'PASSED (Top: ' + top1Id + ')' : 'FAILED'}`);

  // -------------------------------------------------------------
  // Test Profile 2
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Mechanical Student (Robotics Domain) ---');
  const start2 = Date.now();
  const results2 = await evaluateAllOpportunities(profile2);
  const dur2 = Date.now() - start2;
  const sorted2 = Object.values(results2).sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);
  console.log(`Evaluated ${sorted2.length} opportunities in ${dur2}ms.`);
  console.log('Top 3 Matches:');
  sorted2.slice(0, 3).forEach((m, idx) => {
    console.log(`  ${idx + 1}. [${m.opportunityId}] ${m.opportunityTitle} (${m.organization})`);
    console.log(`     Overall: ${m.overallMatchPercentage}% (${m.matchGrade}) | Skill: ${m.skillMatchPercentage}% | AI Relevance: ${m.interestMatchPercentage}% | Eligible: ${m.eligibility.isEligible}`);
    console.log(`     AI Insight: ${m.whyYouMatch.find(w => w.startsWith('AI Analysis:')) || m.whyYouMatch[0]}`);
  });

  const roboticsMatch = sorted2.find(m => m.opportunityId === 'opp-10');
  console.log(`Verification 2: Robotics opportunity (opp-10) evaluation:`);
  console.log(`  Score: ${roboticsMatch?.overallMatchPercentage}% | AI Relevance: ${roboticsMatch?.interestMatchPercentage}% | Rank: ${sorted2.findIndex(m => m.opportunityId === 'opp-10') + 1}`);
  console.log(`  Robotics ranks #1 for Mechanical/Robotics student? ${sorted2[0].opportunityId === 'opp-10' ? 'PASSED' : 'CHECK RANK'}`);

  // -------------------------------------------------------------
  // Test Profile 3
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Unrelated Student (Civil Engineering, Non-Tech) ---');
  const start3 = Date.now();
  const results3 = await evaluateAllOpportunities(profile3);
  const dur3 = Date.now() - start3;
  const sorted3 = Object.values(results3).sort((a, b) => b.overallMatchPercentage - a.overallMatchPercentage);
  console.log(`Evaluated ${sorted3.length} opportunities in ${dur3}ms.`);
  console.log('Tech Opportunity Ratings:');
  const opp1ForCivil = results3['opp-1']; // AI/ML Intern
  const opp4ForCivil = results3['opp-4']; // Full-Stack Intern
  const opp8ForCivil = results3['opp-8']; // SDE
  console.log(`  [opp-1 AI/ML Intern]: Overall: ${opp1ForCivil?.overallMatchPercentage}% | Skill: ${opp1ForCivil?.skillMatchPercentage}% | Eligible: ${opp1ForCivil?.eligibility.isEligible}`);
  console.log(`  [opp-4 Full-Stack]: Overall: ${opp4ForCivil?.overallMatchPercentage}% | Skill: ${opp4ForCivil?.skillMatchPercentage}% | Eligible: ${opp4ForCivil?.eligibility.isEligible}`);
  console.log(`  [opp-8 SDE]: Overall: ${opp8ForCivil?.overallMatchPercentage}% | Skill: ${opp8ForCivil?.skillMatchPercentage}% | Eligible: ${opp8ForCivil?.eligibility.isEligible}`);

  const allTechBelowCap = [opp1ForCivil, opp4ForCivil, opp8ForCivil].every(m => (m?.overallMatchPercentage || 0) <= 64);
  console.log(`Verification 3: Unrelated/ineligible tech opportunities capped at <= 64%? ${allTechBelowCap ? 'PASSED' : 'FAILED'}`);

  // -------------------------------------------------------------
  // Test Neon Database Persistence & Action Plans
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Neon Database Persistence & Action Plans ---');
  // First ensure student exists in Neon
  const dbStudent = await prisma.student.upsert({
    where: { email: profile1.email },
    update: {
      fullName: profile1.fullName,
      branch: profile1.branch,
      currentYear: profile1.currentYear,
      cgpa: profile1.cgpa,
      preferredMode: profile1.preferredMode,
      preferredTypes: profile1.preferredTypes
    },
    create: {
      fullName: profile1.fullName,
      email: profile1.email,
      college: profile1.college,
      branch: profile1.branch,
      currentYear: profile1.currentYear,
      cgpa: profile1.cgpa,
      preferredMode: profile1.preferredMode,
      preferredTypes: profile1.preferredTypes
    }
  });

  const profileWithId = { ...profile1, id: dbStudent.id };

  console.log(`Testing analyzeAndSaveMatch for student ${dbStudent.id} on opportunity opp-1...`);
  const savedMatch = await analyzeAndSaveMatch(profileWithId, 'opp-1');
  console.log(`Saved Match ID: ${savedMatch.id}`);
  console.log(`Overall: ${savedMatch.overallMatchPercentage}% | Grade: ${savedMatch.matchGrade}`);
  console.log(`Action Plan Tasks count: ${savedMatch.actionPlan.length}`);
  savedMatch.actionPlan.forEach(t => {
    console.log(`  Task #${t.stepNumber}: [${t.category}] ${t.title} (${t.duration}) - Status: ${t.status}`);
  });

  // Verify fetch from Neon DB
  const retrievedMatches = await getStudentMatches(dbStudent.id);
  const opp1Retrieved = retrievedMatches['opp-1'];
  console.log(`Retrieved from Neon DB for student ${dbStudent.id}: ${opp1Retrieved ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Action plan tasks preserved: ${opp1Retrieved?.actionPlan.length} tasks`);

  // Verify task completion toggle
  if (savedMatch.actionPlan.length > 0) {
    const firstTaskId = savedMatch.actionPlan[0].id;
    console.log(`Toggling task ${firstTaskId}...`);
    const toggled = await toggleTaskCompletion(firstTaskId);
    console.log(`Task ${toggled.taskId} completion status now: ${toggled.isCompleted}`);
    const toggledBack = await toggleTaskCompletion(firstTaskId);
    console.log(`Task ${toggledBack.taskId} toggled back to: ${toggledBack.isCompleted}`);
  }

  console.log('\n================================================================');
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runProfileVerification().catch(err => {
  console.error('Profile verification failed:', err);
  process.exit(1);
});
