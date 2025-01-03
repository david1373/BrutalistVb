import express from 'express';
import cors from 'cors';
import { scraperRouter } from './routes/scraper';
import { serverConfig } from '../lib/config';
import { logServerStart, logServerError } from './utils/logger';

const app = express();
const { port } = serverConfig;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/scraper', scraperRouter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, _: express.Request, res: express.Response) => {
  logServerError(err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
try {
  app.listen(port, () => {
    logServerStart(port);
  });
} catch (error) {
  logServerError(error as Error);
  process.exit(1);
}

export default app;