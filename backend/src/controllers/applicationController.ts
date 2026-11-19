import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as applicationService from '../services/applicationService.js';

const applicationSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity ID is required'),
  studentId: z.string().optional(),
  notes: z.string().optional()
});

export async function submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const data = applicationSchema.parse(req.body);

    // IDOR Prevention: Ensure applicant is the authenticated student
    if (data.studentId && data.studentId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot submit applications for another student.'
      });
      return;
    }

    const application = await applicationService.createApplication({
      ...data,
      studentId: authenticatedId
    });

    res.status(201).json({
      success: true,
      message: 'Application recorded successfully',
      data: application
    });
  } catch (error) {
    next(error);
  }
}

export async function getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    // IDOR Prevention: Prevent reading another student's applications
    const requestedStudentId = req.query.studentId as string;
    if (requestedStudentId && requestedStudentId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another student applications.'
      });
      return;
    }

    const applications = await applicationService.getStudentApplications(authenticatedId);

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
}

export async function getApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const opportunityId = String(req.params.opportunityId);
    const requestedStudentId = req.query.studentId as string;
    if (requestedStudentId && requestedStudentId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot check application status for another student.'
      });
      return;
    }

    const application = await applicationService.getApplicationForOpportunity(opportunityId, authenticatedId);

    res.json({
      success: true,
      applied: !!application,
      data: application
    });
  } catch (error) {
    next(error);
  }
}
