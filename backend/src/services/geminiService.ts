import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

/**
 * Sanitizes any error message or string so API keys or secrets are never leaked.
 */
export function sanitizeMessage(msg: string): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 5) {
    return msg.split(apiKey).join('[REDACTED]');
  }
  return msg.replace(/(key=)[^\s&]+/gi, '$1[REDACTED]');
}

/**
 * Returns the configured Gemini model name.
 */
export function getGeminiModelName(): string {
  return (process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite').trim();
}

/**
 * Checks whether the Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

/**
 * Returns an authenticated GoogleGenAI client instance.
 * Throws a safe, sanitized error if the API key is missing.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({ apiKey, httpOptions: { timeout: 25000 } });
}

/**
 * Validates whether the configured model (or a specified model) is available on the API.
 */
export async function validateModel(modelName?: string): Promise<{
  valid: boolean;
  model: string;
  availableModels?: string[];
  error?: string;
}> {
  const targetModel = (modelName || getGeminiModelName()).trim();
  const ai = getGeminiClient();

  try {
    const listResponse = await ai.models.list();
    const availableModels: string[] = [];

    for await (const m of listResponse) {
      if (m.name) {
        const cleanName = m.name.replace(/^models\//, '');
        availableModels.push(cleanName);
      }
    }

    const cleanTarget = targetModel.replace(/^models\//, '');
    const isAvailable = availableModels.some(
      (m) => m === cleanTarget || m.toLowerCase() === cleanTarget.toLowerCase()
    );

    if (!isAvailable) {
      return {
        valid: false,
        model: targetModel,
        availableModels,
        error: `Model '${targetModel}' is not available for this API key. Available models: ${availableModels.slice(0, 5).join(', ')}...`
      };
    }

    return {
      valid: true,
      model: targetModel,
      availableModels
    };
  } catch (error: any) {
    const safeError = sanitizeMessage(error?.message || 'Failed to query available models');
    return {
      valid: false,
      model: targetModel,
      error: safeError
    };
  }
}

/**
 * Generates text from Gemini using a prompt and the configured model.
 */
export async function generateGeminiText(
  prompt: string,
  options?: { model?: string }
): Promise<{
  text: string;
  model: string;
}> {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt string is required.');
  }

  const ai = getGeminiClient();
  const model = (options?.model || getGeminiModelName()).trim();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });

    const text = response.text || '';
    return {
      text,
      model
    };
  } catch (error: any) {
    const safeMsg = sanitizeMessage(error?.message || 'Unknown error occurred while calling Gemini API');

    if (error?.status === 404 || safeMsg.includes('not found') || safeMsg.includes('is not supported')) {
      throw new Error(`Gemini model '${model}' was not found or is unavailable: ${safeMsg}`);
    }
    if (error?.status === 401 || error?.status === 403 || safeMsg.includes('API_KEY_INVALID')) {
      throw new Error(`Gemini authentication error: Invalid API key or unauthorized access.`);
    }
    if (error?.status === 429 || safeMsg.includes('RESOURCE_EXHAUSTED') || safeMsg.includes('quota')) {
      throw new Error(`Gemini API rate limit or quota exceeded: ${safeMsg}`);
    }

    throw new Error(`Gemini generation failed: ${safeMsg}`);
  }
}

/**
 * Small test function that sends a verification prompt to Gemini and returns its response.
 */
export async function testGeminiConnection(): Promise<{
  success: boolean;
  model: string;
  response: string;
  latencyMs: number;
  timestamp: string;
}> {
  const startTime = Date.now();
  const testPrompt = 'Respond with exactly: "Hello from Gemini! AI Opportunity Matcher integration is successful."';

  const result = await generateGeminiText(testPrompt);
  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    model: result.model,
    response: result.text.trim(),
    latencyMs,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// GEMINI HYBRID MATCHING ANALYSIS
// ============================================================================

export const GeminiEvaluationItemSchema = z.object({
  opportunityId: z.string().min(1),
  relevanceScore: z.number().min(0).max(100),
  relevanceReason: z.string().min(5),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  recommendedSkills: z.array(z.string()).default([])
});

export type GeminiEvaluationItem = z.infer<typeof GeminiEvaluationItemSchema>;

export const GeminiBatchEvaluationSchema = z.array(GeminiEvaluationItemSchema);

export interface SanitizedStudentForGemini {
  major: string;
  currentYear: string;
  skills: string[];
  interests: string[];
  cgpa?: number;
}

export interface OpportunityForGemini {
  id: string;
  title: string;
  organization: string;
  category: string;
  shortDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  eligibleBranches: string[];
  eligibleYears: string[];
  minCgpa?: number | null;
  mode: string;
}

// In-memory cache for evaluations with 10-minute TTL to avoid redundant API calls
interface CachedEvaluations {
  data: Record<string, GeminiEvaluationItem>;
  expiresAt: number;
}
const evaluationCache = new Map<string, CachedEvaluations>();

function getCacheKey(student: SanitizedStudentForGemini): string {
  const skillsKey = [...(student.skills || [])].sort().join(',');
  const interestsKey = [...(student.interests || [])].sort().join(',');
  return `${student.major}|${student.currentYear}|${student.cgpa || 0}|${skillsKey}|${interestsKey}`;
}

const SYSTEM_INSTRUCTION = `You are an expert AI Career and Opportunity Matching Assistant.
Evaluate the semantic relevance of the opportunities for the student based ONLY on the provided student profile and opportunity details.

Evaluate:
1. Semantic relevance to the student's stated interests and career goals.
2. Alignment with student's verified skills, academic discipline, and coursework.
3. Why the opportunity is relevant (a clear, concise personalized explanation for the student).
4. Missing skills the student should bridge.
5. Recommended next skills or tools to develop for this opportunity.
6. A relevance score from 0 to 100 representing semantic and interest alignment.

Strict Scoring Guidelines:
- High relevance (80-98): Domain and interests match directly, skills align well.
- Moderate relevance (50-79): Partial domain overlap or adjacent field where student has foundational skills.
- Low relevance (10-45): Unrelated field (e.g. Mechanical/Robotics or UI/UX for a student with purely AI/ML/Data interests and zero hardware/design background, or Software Engineering for a student with zero coding skills).
- Ineligible or mismatch: Reflect the gap realistically in relevanceScore and missingSkills.

Formatting Requirements:
- Output MUST be valid JSON adhering strictly to the schema: an array of objects with keys:
  opportunityId, relevanceScore, relevanceReason, matchedSkills, missingSkills, recommendedSkills.
- Only return evaluations for the provided opportunity IDs.`;

/**
 * Analyzes a batch of opportunities for a given student profile using Gemini.
 * Returns a Record<opportunityId, GeminiEvaluationItem> or null if Gemini fails/times out.
 */
export async function analyzeOpportunitiesWithGemini(
  student: SanitizedStudentForGemini,
  opportunities: OpportunityForGemini[]
): Promise<Record<string, GeminiEvaluationItem> | null> {
  if (!isGeminiConfigured() || opportunities.length === 0) {
    return null;
  }

  // Check cache
  const cacheKey = getCacheKey(student);
  const cached = evaluationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    const allPresent = opportunities.every(o => cached.data[o.id]);
    if (allPresent) {
      return cached.data;
    }
  }

  const validOpportunityIds = new Set(opportunities.map(o => o.id));

  const prompt = `Student Profile:
${JSON.stringify(student, null, 2)}

Opportunities to Evaluate:
${JSON.stringify(opportunities, null, 2)}

Return a JSON array of evaluations for all ${opportunities.length} opportunities.`;

  // Candidate models: configured model first, followed by stable fallbacks
  const primaryModel = getGeminiModelName();
  const candidateModels = Array.from(new Set([primaryModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']));

  const ai = getGeminiClient();

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const rawText = (response.text || '').trim();
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const validated = GeminiBatchEvaluationSchema.parse(parsed);

      const resultMap: Record<string, GeminiEvaluationItem> = {};
      for (const item of validated) {
        // Enforce that only valid opportunity IDs are accepted
        if (validOpportunityIds.has(item.opportunityId)) {
          resultMap[item.opportunityId] = {
            ...item,
            // Ensure score is bounded
            relevanceScore: Math.max(0, Math.min(100, Math.round(item.relevanceScore)))
          };
        }
      }

      // Check that at least some evaluations were returned
      if (Object.keys(resultMap).length > 0) {
        evaluationCache.set(cacheKey, {
          data: resultMap,
          expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });
        return resultMap;
      }
    } catch (err: any) {
      const safeMsg = sanitizeMessage(err?.message || 'Error in Gemini batch evaluation');
      console.warn(`[Gemini Matching] Model ${model} failed: ${safeMsg}`);
      // Continue to next candidate model
    }
  }

  console.warn('[Gemini Matching] All candidate models exhausted or unavailable. Falling back to rule-based engine.');
  return null;
}

/**
 * Analyzes a single opportunity for a student profile using Gemini.
 */
export async function analyzeSingleOpportunityWithGemini(
  student: SanitizedStudentForGemini,
  opportunity: OpportunityForGemini
): Promise<GeminiEvaluationItem | null> {
  const batchResult = await analyzeOpportunitiesWithGemini(student, [opportunity]);
  return batchResult ? batchResult[opportunity.id] || null : null;
}
