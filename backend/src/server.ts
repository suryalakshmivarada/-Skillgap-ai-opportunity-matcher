import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { checkDatabaseConnection, prisma } from './config/prisma.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Parse configured CORS allowed origins
const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawCorsOrigin.split(',').map(o => o.trim()).filter(Boolean);

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS Middleware Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile clients, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In development or test, allow exact localhost / loopback ports
      if (!isProd) {
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      // Check allowed origins list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: Origin '${origin}' is not authorized`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser with strict size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging in development
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (_req, res) => {
  res.json({
    message: 'SkillGap AI Opportunity Matcher API is running',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Centralized error handler
app.use(errorHandler);

let serverInstance: any = null;

// Start server and check database connection
export async function startServer(): Promise<void> {
  await checkDatabaseConnection();

  return new Promise<void>((resolve) => {
    serverInstance = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 SkillGap Backend API running at: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🎯 API Base: http://localhost:${PORT}/api`);
      console.log(`🛡️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
      resolve();
    });
  });
}

// Graceful shutdown handler
async function handleShutdown(signal: string) {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      console.log('HTTP connection listener closed.');
      try {
        await prisma.$disconnect();
        console.log('PostgreSQL connection pool disconnected.');
      } catch (e) {
        console.error('Error during PostgreSQL disconnect:', e);
      }
      process.exit(0);
    });

    // Force terminate if graceful shutdown hangs
    setTimeout(() => {
      console.error('Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export const serverReadyPromise = startServer().catch(err => {
  console.error('Failed to start server:', err);
});

export default app;
