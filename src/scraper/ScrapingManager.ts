import { PlaywrightScraper } from './PlaywrightScraper';
import { ExtractedContent } from './scrapeUtils';

interface ScrapingResult {
  success: boolean;
  content?: ExtractedContent;
  error?: string;
  retries: number;
}

export class ScrapingManager {
  private scraper: PlaywrightScraper;
  private scrapedUrls: Set<string> = new Set();
  private failedUrls: Map<string, number> = new Map();

  constructor(baseUrl: string) {
    this.scraper = new PlaywrightScraper(baseUrl, {
      maxRetries: 3,
      timeout: 30000,
      headless: true
    });
  }

  async init() {
    await this.scraper.init();
  }

  async cleanup() {
    await this.scraper.close();
  }

  private isRecentlyScraped(url: string): boolean {
    return this.scrapedUrls.has(url);
  }

  private shouldRetry(url: string): boolean {
    const failures = this.failedUrls.get(url) || 0;
    return failures < 3; // Max 3 attempts per URL
  }

  private recordFailure(url: string) {
    const failures = (this.failedUrls.get(url) || 0) + 1;
    this.failedUrls.set(url, failures);
  }

  async scrapeArticle(url: string): Promise<ScrapingResult> {
    if (this.isRecentlyScraped(url)) {
      return {
        success: false,
        error: 'URL recently scraped',
        retries: 0
      };
    }

    if (!this.shouldRetry(url)) {
      return {
        success: false,
        error: 'Max retries exceeded for URL',
        retries: this.failedUrls.get(url) || 0
      };
    }

    try {
      const content = await this.scraper.scrapeArticle(url);
      this.scrapedUrls.add(url);
      
      return {
        success: true,
        content,
        retries: this.failedUrls.get(url) || 0
      };
    } catch (error) {
      this.recordFailure(url);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retries: this.failedUrls.get(url) || 0
      };
    }
  }

  async scrapeArticlesBatch(
    urls: string[],
    batchSize: number = 5
  ): Promise<Map<string, ScrapingResult>> {
    const results = new Map<string, ScrapingResult>();
    
    // Process in batches
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(url => this.scrapeArticle(url))
      );
      
      // Store results
      batch.forEach((url, index) => {
        results.set(url, batchResults[index]);
      });
      
      // Wait between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async rescrapeFailedArticles(): Promise<Map<string, ScrapingResult>> {
    const failedUrls = Array.from(this.failedUrls.entries())
      .filter(([_, failures]) => failures < 3)
      .map(([url]) => url);
    
    return this.scrapeArticlesBatch(failedUrls);
  }

  clearScrapingHistory() {
    this.scrapedUrls.clear();
    this.failedUrls.clear();
  }
}