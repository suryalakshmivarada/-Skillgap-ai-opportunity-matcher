import { Router } from 'express';
import * as matchingController from '../controllers/matchingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { matchingLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// AI Match Evaluation (protected by auth & matching rate limiter)
router.post('/match', requireAuth, matchingLimiter, matchingController.analyzeMatch);
router.post('/matches/evaluate', requireAuth, matchingLimiter, matchingController.evaluateMatches);
router.get('/matches/evaluate', requireAuth, matchingLimiter, matchingController.evaluateMatches);

// Saved matches & Best matches (protected by auth)
router.get('/matches', requireAuth, matchingController.getSavedMatches);
router.get('/matches/best', requireAuth, matchingController.getBestMatches);
router.get('/matches/:opportunityId', requireAuth, matchingController.getMatchByOpportunity);

// Action Plan Task toggle (protected by auth & task ownership verification)
router.patch('/action-plans/tasks/:taskId/toggle', requireAuth, matchingController.toggleActionPlanTask);
router.post('/action-plans/tasks/:taskId/toggle', requireAuth, matchingController.toggleActionPlanTask);

export default router;
