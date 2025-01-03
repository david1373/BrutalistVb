import { Router } from 'express';
import { runScraper } from '../controllers/scraperController';

export const scraperRouter = Router();

scraperRouter.get('/test', runScraper);