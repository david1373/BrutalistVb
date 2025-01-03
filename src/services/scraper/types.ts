import { Page, ElementHandle } from 'playwright';
import { SCRAPER_CONFIG } from './config';

export interface ScrapedArticle {
  title: string;
  url: string;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  original_content: string;
  category: string;
}

export type ScraperSource = {
  name: string;
  url: string;
  selectors: {
    articleList: string;
    title: string;
    link: string;
    image: string;
    author: string;
    date: string;
    content: string;
  };
}

export interface SourceScraper {
  name: string;
  config: ScraperSource;
  scrape: (page: Page) => Promise<ScrapedArticle[]>;
}

export type SourceKey = keyof typeof SCRAPER_CONFIG.sources;

export interface ScraperError extends Error {
  source?: string;
  url?: string;
  phase?: 'navigation' | 'extraction' | 'content' | 'database';
}