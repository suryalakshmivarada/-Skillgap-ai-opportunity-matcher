import dotenv from 'dotenv';
dotenv.config();
import { getGeminiClient, getGeminiModelName } from '../services/geminiService.js';
import { getAllOpportunities } from '../services/opportunityService.js';
import { z } from 'zod';

const GeminiEvaluationItemSchema = z.object({
  opportunityId: z.string(),
  relevanceScore: z.number().min(0).max(100),
  relevanceReason: z.string(),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  recommendedSkills: z.array(z.string()).default([])
});

const GeminiBatchSchema = z.array(GeminiEvaluationItemSchema);

async function testBatch() {
  const opps = await getAllOpportunities();
  console.log(`Loaded ${opps.length} opportunities from DB.`);

  const studentProfile = {
    major: 'Computer Science and Engineering (CSE)',
    currentYear: '3rd Year',
    cgpa: 8.4,
    skills: ['Python', 'SQL', 'Machine Learning', 'Git', 'Data Structures'],
    interests: ['Artificial Intelligence', 'Machine Learning', 'Data Science']
  };

  const opportunitiesPayload = opps.map(o => ({
    id: o.id,
    title: o.title,
    organization: o.organization,
    category: o.type,
    shortDescription: o.shortDescription,
    requiredSkills: o.requiredSkills,
    preferredSkills: o.preferredSkills,
    eligibleBranches: o.eligibleBranches,
    eligibleYears: o.eligibleYears,
    minCgpa: o.minCgpa,
    mode: o.mode
  }));

  const systemInstruction = `You are an expert AI Career and Opportunity Matching Assistant.
Evaluate the semantic relevance of the opportunities for the student based ONLY on the provided student profile and opportunity details.
Evaluate:
1. Relevance to the student's stated interests and career goals.
2. Alignment with student's skills and coursework.
3. Why the opportunity is relevant (personalized explanation).
4. Missing skills the student should bridge.
5. Recommended next skills to develop.
6. A relevance score from 0 to 100 representing semantic and interest alignment.

Rules:
- Be objective and realistic. Unrelated opportunities (e.g. Mechanical/Robotics or UI/UX for a student with purely AI/ML/data interests and zero design/hardware skills) MUST receive low relevance scores (e.g. 10-40).
- Highly relevant opportunities in the student's domain (e.g. AI/ML Intern, GenAI specialization) MUST receive high scores (e.g. 80-95).
- Output MUST be valid JSON adhering strictly to the schema: an array of objects with keys: opportunityId, relevanceScore, relevanceReason, matchedSkills, missingSkills, recommendedSkills.
- Only return evaluations for the provided opportunity IDs.`;

  const prompt = `Student Profile:
${JSON.stringify(studentProfile, null, 2)}

Opportunities:
${JSON.stringify(opportunitiesPayload, null, 2)}

Provide the structured evaluations as a JSON array.`;

  const ai = getGeminiClient();
  const model = 'gemini-3.1-flash-lite';
  console.log(`Calling Gemini (${model}) with structured batch evaluation...`);
  const start = Date.now();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });

  const duration = Date.now() - start;
  console.log(`Received response in ${duration}ms!`);
  const rawText = response.text || '';
  console.log('Raw text length:', rawText.length);

  const parsed = JSON.parse(rawText);
  const validated = GeminiBatchSchema.parse(parsed);
  console.log(`Successfully validated ${validated.length} evaluations!`);

  // Sort by relevanceScore descending
  validated.sort((a, b) => b.relevanceScore - a.relevanceScore);
  console.log('\nTop 3 Opportunities by Gemini relevance:');
  for (const item of validated.slice(0, 3)) {
    const opp = opps.find(o => o.id === item.opportunityId);
    console.log(`- [${item.opportunityId}] ${opp?.title} | Score: ${item.relevanceScore}`);
    console.log(`  Reason: ${item.relevanceReason}`);
    console.log(`  Matched: ${item.matchedSkills.join(', ')} | Missing: ${item.missingSkills.join(', ')} | Recommended: ${item.recommendedSkills.join(', ')}`);
  }

  console.log('\nBottom 2 Opportunities by Gemini relevance:');
  for (const item of validated.slice(-2)) {
    const opp = opps.find(o => o.id === item.opportunityId);
    console.log(`- [${item.opportunityId}] ${opp?.title} | Score: ${item.relevanceScore}`);
    console.log(`  Reason: ${item.relevanceReason}`);
  }
}

testBatch().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
