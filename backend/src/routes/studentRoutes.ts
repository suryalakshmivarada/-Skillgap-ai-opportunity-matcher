import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, studentController.getProfile);
router.post('/', requireAuth, studentController.createProfile);
router.put('/', requireAuth, studentController.updateProfile);
router.post('/reset', requireAuth, studentController.resetProfile);

export default router;
