import express, { Express } from 'express';
import { corsMiddleware } from '../middleware/cors';
import { requestLogger } from '../middleware/requestLogger';
import { errorHandler } from '../middleware/errorHandler';
import { securityHeaders } from '../middleware/securityHeaders';
import apiRoutes from '../routes/api';

export function createServer(): Express {
  const app = express();

  // Basic middleware
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(requestLogger);
  app.use(securityHeaders);

  // Mount API routes
  app.use('/api', apiRoutes);

  // Error handling - must be last
  app.use(errorHandler);

  return app;
}