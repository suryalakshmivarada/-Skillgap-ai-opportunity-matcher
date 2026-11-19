import dotenv from 'dotenv';
dotenv.config();
import { getGeminiClient } from '../services/geminiService.js';

async function listModels() {
  const ai = getGeminiClient();
  const list = await ai.models.list();
  const models = [];
  for await (const m of list) {
    if (m.name) models.push(m.name);
  }
  console.log('Available models for this key:', models);
}

listModels().catch(err => console.error(err));
