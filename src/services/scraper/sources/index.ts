import { dezeenScraper } from './dezeen';
import { leibalScraper } from './leibal';
import { metropolisScraper } from './metropolis';
import { SourceScraper } from '../types';

export const scrapers: Record<string, SourceScraper> = {
  dezeen: dezeenScraper,
  leibal: leibalScraper,
  metropolis: metropolisScraper,
};