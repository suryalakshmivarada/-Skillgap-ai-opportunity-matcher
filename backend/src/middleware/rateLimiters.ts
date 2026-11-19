import { rateLimit } from 'express-rate-limit';

/**
 * Rate limiter for student authentication (login & registration).
 * Prevents brute-force credential stuffing and registration spam.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

/**
 * Rate limiter for resource-intensive matching & Gemini AI endpoints.
 * Protects Google Gemini API quota from automated exhaustion while allowing smooth student usage.
 */
export const matchingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 matching requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many matching evaluation requests. Please wait a few minutes before analyzing more opportunities.'
  }
});

/**
 * Rate limiter for Gemini debug / validation endpoints (if used in development).
 */
export const geminiDebugLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded for Gemini test endpoints.'
  }
});
