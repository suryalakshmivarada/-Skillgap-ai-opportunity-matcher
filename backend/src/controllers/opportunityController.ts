import { Request, Response, NextFunction } from 'express';
import * as opportunityService from '../services/opportunityService.js';

export async function getOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      searchQuery: req.query.search as string,
      type: req.query.type as string,
      branch: req.query.branch as string,
      year: req.query.year as string,
      mode: req.query.mode as string,
      selectedSkill: req.query.skill as string,
      eligibleOnly: req.query.eligibleOnly === 'true'
    };

    const opportunities = await opportunityService.getAllOpportunities(filters);
    res.json({
      success: true,
      count: opportunities.length,
      data: opportunities
    });
  } catch (error) {
    next(error);
  }
}

export async function getOpportunityById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const opportunity = await opportunityService.getOpportunityById(id);

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: `Opportunity with ID '${id}' not found`
      });
      return;
    }

    res.json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
}
