import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Student Registration & Login (protected by rate limiter)
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/demo-login', authLimiter, authController.demoLogin);

// Current Authenticated Student
router.get('/me', requireAuth, authController.getMe);

export default router;
