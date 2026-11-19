import { Router } from 'express';
import * as geminiController from '../controllers/geminiController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { geminiDebugLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Protected Gemini debug & testing endpoints (disabled in production, rate-limited and auth-protected in dev)
router.get('/test', requireAuth, geminiDebugLimiter, geminiController.testGemini);
router.get('/validate-model', requireAuth, geminiDebugLimiter, geminiController.validateModel);

export default router;
