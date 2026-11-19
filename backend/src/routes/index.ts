import { Router } from 'express';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import opportunityRoutes from './opportunityRoutes.js';
import matchingRoutes from './matchingRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import geminiRoutes from './geminiRoutes.js';

const router = Router();

// Sub-routers
router.use('/auth', authRoutes);
router.use('/profile', studentRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/', matchingRoutes);
router.use('/applications', applicationRoutes);
router.use('/gemini', geminiRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Skill Opportunity Matcher Backend API'
  });
});

export default router;
