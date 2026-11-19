import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (err?.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'A record with these details already exists',
      target: err.meta?.target
    });
    return;
  }

  // Prisma record not found (P2025)
  if (err?.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Requested record not found'
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
