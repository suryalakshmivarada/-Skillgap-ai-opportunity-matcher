import dotenv from 'dotenv';
dotenv.config();
import { getGeminiClient } from '../services/geminiService.js';

async function testModel(m: string) {
  const ai = getGeminiClient();
  const start = Date.now();
  try {
    const res = await ai.models.generateContent({
      model: m,
      contents: 'Say hello in 5 words.'
    });
    console.log(`[SUCCESS] ${m} responded in ${Date.now() - start}ms: "${res.text?.trim()}"`);
    return true;
  } catch (e: any) {
    console.log(`[FAILED] ${m}: ${e.message}`);
    return false;
  }
}

async function main() {
  const candidates = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  for (const c of candidates) {
    await testModel(c);
  }
}

main();
