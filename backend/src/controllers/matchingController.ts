import { Request, Response, NextFunction } from 'express';
import * as matchingService from '../services/matchingService.js';

export async function analyzeMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const { profile, opportunity, studentId, opportunityId } = req.body;

    // IDOR Prevention: Client must not analyze matches on behalf of a different student ID
    if (studentId && studentId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot analyze matches for another student.'
      });
      return;
    }

    const studentTarget = authenticatedId;
    const oppTarget = opportunity || opportunityId;

    if (!oppTarget) {
      res.status(400).json({
        success: false,
        message: 'Opportunity data or opportunityId is required for match analysis'
      });
      return;
    }

    const matchResult = await matchingService.analyzeAndSaveMatch(studentTarget, oppTarget);
    res.json({
      success: true,
      message: 'Opportunity match analyzed successfully',
      data: matchResult
    });
  } catch (error) {
    next(error);
  }
}

export async function getSavedMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    // IDOR Prevention: Disallow querying other students' matches
    const requestedStudentId = req.query.studentId as string;
    if (requestedStudentId && requestedStudentId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another student matches.'
      });
      return;
    }

    const matches = await matchingService.getStudentMatches(authenticatedId);
    res.json({
      success: true,
      count: Object.keys(matches).length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
}

export async function evaluateMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    // IDOR Prevention
    const requestedStudentId = req.query.studentId as string;
    if (requestedStudentId && requestedStudentId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot evaluate matches for another student.'
      });
      return;
    }

    const evaluated = await matchingService.evaluateAllOpportunities(authenticatedId);
    res.json({
      success: true,
      count: Object.keys(evaluated).length,
      data: evaluated
    });
  } catch (error) {
    next(error);
  }
}

export async function getBestMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const requestedStudentId = req.query.studentId as string;
    if (requestedStudentId && requestedStudentId !== authenticatedId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view best matches for another student.'
      });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const best = await matchingService.getBestMatches(authenticatedId, limit);
    res.json({
      success: true,
      count: best.length,
      data: best
    });
  } catch (error) {
    next(error);
  }
}

export async function getMatchByOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        message: 'Forbidden: You cannot view matches for another student.'
      });
      return;
    }

    const allMatches = await matchingService.getStudentMatches(authenticatedId);
    const match = allMatches[opportunityId];

    if (!match) {
      res.status(404).json({
        success: false,
        message: `No saved match found for opportunity ${opportunityId}`
      });
      return;
    }

    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleActionPlanTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedId = req.user?.id;
    if (!authenticatedId) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const taskId = String(req.params.taskId);
    if (!taskId) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
      return;
    }

    // Ownership verified inside toggleTaskCompletion
    const result = await matchingService.toggleTaskCompletion(taskId, authenticatedId);
    res.json({
      success: true,
      message: `Task ${result.isCompleted ? 'marked completed' : 'marked incomplete'}`,
      data: result
    });
  } catch (error: any) {
    if (error?.statusCode === 403) {
      res.status(403).json({
        success: false,
        message: error.message || 'Forbidden: You are not authorized to update this task.'
      });
      return;
    }
    if (error?.statusCode === 404) {
      res.status(404).json({
        success: false,
        message: error.message || 'Action plan task not found.'
      });
      return;
    }
    next(error);
  }
}
