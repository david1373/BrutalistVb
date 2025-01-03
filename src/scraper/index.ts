import { BrowserContext, Page } from 'playwright';
import pLimit from 'p-limit';
import { createBrowserContext } from './browser';
import { ImageProcessor } from './imageProcessor';
import { SCRAPER_CONFIG } from './config';

export class Scraper {
  private context: BrowserContext;
  private imageProcessor: ImageProcessor;
  private limit: ReturnType<typeof pLimit>;

  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.limit = pLimit(SCRAPER_CONFIG.maxConcurrentPages);
  }

  async init() {
    this.context = await createBrowserContext();
  }

  async scrapeArticle(url: string, retryCount = 0): Promise<any> {
    try {
      const page = await this.context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      // Take full-page screenshot
      const screenshot = await page.screenshot({ fullPage: true });

      // Process and upload screenshot
      const imageUrls = await this.imageProcessor.processAndUpload(
        screenshot,
        url.split('/').pop() || 'default'
      );

      // Extract article content
      const article = await page.evaluate(() => ({
        title: document.querySelector('h1')?.textContent,
        content: document.querySelector('article')?.textContent,
        // Add more selectors as needed
      }));

      await page.close();
      return { ...article, imageUrls };

    } catch (error) {
      if (retryCount < SCRAPER_CONFIG.retryAttempts) {
        await new Promise(resolve => 
          setTimeout(resolve, SCRAPER_CONFIG.retryDelay * (retryCount + 1))
        );
        return this.scrapeArticle(url, retryCount + 1);
      }
      throw error;
    }
  }

  async scrapeMultipleArticles(urls: string[]) {
    const tasks = urls.map(url =>
      this.limit(() => this.scrapeArticle(url))
    );

    return Promise.all(tasks);
  }

  async cleanup() {
    await this.context.close();
  }
}