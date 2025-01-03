import { Page } from 'playwright';
import { ScrapedArticle, SourceScraper } from '../types';
import { SCRAPER_CONFIG } from '../config';
import { extractArticleData } from '../extractor';
import { logScraperInfo } from '../logger';

export const metropolisScraper: SourceScraper = {
  name: 'Metropolis',
  config: SCRAPER_CONFIG.sources.metropolis,
  
  async scrape(page: Page): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    const { url, selectors } = this.config;
    
    logScraperInfo(`Scraping Metropolis: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const elements = await page.$$(selectors.articleList);
    
    for (const element of elements.slice(0, SCRAPER_CONFIG.articlesPerSource)) {
      const article = await extractArticleData(page, element, this.config);
      articles.push(article);
    }
    
    return articles;
  }
};