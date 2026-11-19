import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as studentService from '../services/studentService.js';

const studentProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  college: z.string().min(1, 'College/University name is required'),
  branch: z.string().min(1, 'Branch is required'),
  currentYear: z.string().min(1, 'Current year is required'),
  cgpa: z.number().min(0).max(10, 'CGPA must be between 0 and 10'),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  preferredTypes: z.array(z.string()).default([]),
  preferredMode: z.string().default('Hybrid')
});

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
      return;
    }

    // IDOR / BOLA Prevention: Verify that client is not attempting to access another student's profile
    const requestedId = (req.query.studentId as string) || (req.params.id as string);
    if (requestedId && requestedId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another student profile.'
      });
      return;
    }

    const profile = await studentService.getStudentProfile(authenticatedId);
    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    const authenticatedEmail = req.user?.email;
    if (!authenticatedId || !authenticatedEmail) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
      return;
    }

    // IDOR / Conflicting Identity Prevention:
    // If body contains an id, ensure it matches authenticated user
    if (req.body.id && req.body.id !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify another student profile.'
      });
      return;
    }

    // If body contains an email, reject if it conflicts with authenticated user's email
    if (req.body.email && req.body.email.toLowerCase().trim() !== authenticatedEmail.toLowerCase().trim()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Conflicting email address. You cannot modify another student profile or change account email.'
      });
      return;
    }

    // Validate partial or complete body
    const validatedData = studentProfileSchema.partial().parse(req.body);
    const updated = await studentService.createOrUpdateStudentProfile({
      ...validatedData,
      id: authenticatedId,
      email: authenticatedEmail
    });

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    const authenticatedEmail = req.user?.email;
    if (!authenticatedId || !authenticatedEmail) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
      return;
    }

    // IDOR / Conflicting Identity Prevention
    if (req.body.id && req.body.id !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot create a profile for another student ID.'
      });
      return;
    }

    if (req.body.email && req.body.email.toLowerCase().trim() !== authenticatedEmail.toLowerCase().trim()) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Conflicting email address. You cannot bind to another student email.'
      });
      return;
    }

    const validatedData = studentProfileSchema.parse(req.body);

    // Strictly derived from authenticated user
    const created = await studentService.createOrUpdateStudentProfile({
      ...validatedData,
      id: authenticatedId,
      email: authenticatedEmail
    });

    res.status(201).json({
      success: true,
      message: 'Student profile created successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
}

export async function resetProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
      return;
    }

    // Reset profile strictly scoped to the authenticated student ID
    const reset = await studentService.resetStudentProfile(authenticatedId);

    res.json({
      success: true,
      message: 'Student profile reset to default template successfully',
      data: reset
    });
  } catch (error) {
    next(error);
  }
}
