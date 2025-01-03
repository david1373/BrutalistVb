import { Router } from 'express';
import scraperRoutes from './scraper';

const router = Router();

// Health check endpoint
router.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount other route modules
router.use('/scraper', scraperRoutes);

export default router;