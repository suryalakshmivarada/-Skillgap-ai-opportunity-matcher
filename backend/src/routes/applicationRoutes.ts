import { Router } from 'express';
import * as applicationController from '../controllers/applicationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', requireAuth, applicationController.submitApplication);
router.get('/', requireAuth, applicationController.getApplications);
router.get('/:opportunityId', requireAuth, applicationController.getApplicationStatus);

export default router;
