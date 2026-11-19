import { Router } from 'express';
import * as opportunityController from '../controllers/opportunityController.js';

const router = Router();

router.get('/', opportunityController.getOpportunities);
router.get('/:id', opportunityController.getOpportunityById);

export default router;
