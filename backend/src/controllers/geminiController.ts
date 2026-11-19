import { Request, Response, NextFunction } from 'express';
import * as geminiService from '../services/geminiService.js';

/**
 * Controller to test Gemini API integration.
 * GET /api/gemini/test
 */
export async function testGemini(req: Request, res: Response, next: NextFunction): Promise<void> {
  // In production, debug endpoints are completely disabled
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
    return;
  }

  try {
    if (!geminiService.isGeminiConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Gemini service is not configured'
      });
      return;
    }

    const testResult = await geminiService.testGeminiConnection();

    res.json({
      success: true,
      message: 'Gemini integration verified successfully',
      data: testResult
    });
  } catch (error: any) {
    const errorMsg = geminiService.sanitizeMessage(error?.message || 'Gemini test request failed');

    // Choose status code based on error type
    let statusCode = 500;
    if (errorMsg.includes('Invalid API key') || errorMsg.includes('unauthorized')) {
      statusCode = 401;
    } else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
      statusCode = 429;
    } else if (errorMsg.includes('not found') || errorMsg.includes('unavailable')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMsg
    });
  }
}

/**
 * Controller to validate configured Gemini model.
 * GET /api/gemini/validate-model
 */
export async function validateModel(req: Request, res: Response, next: NextFunction): Promise<void> {
  // In production, debug endpoints are completely disabled
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
    return;
  }

  try {
    const modelParam = req.query.model as string;
    const result = await geminiService.validateModel(modelParam);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        ...result
      });
      return;
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: geminiService.sanitizeMessage(error?.message || 'Failed to validate model')
    });
  }
}
