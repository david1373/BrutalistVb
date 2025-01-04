import { BrowserContext, Page } from 'playwright';
import { createBrowserContext } from './browser';
import { ImageProcessor } from './imageProcessor';
import { SCRAPER_CONFIG } from './config';

interface Source {
  url: string;
  scraping_config?: {
    selectors?: {
      title?: string;
      content?: string;
      image?: string;
    };
  };
}

export class Scraper {
  private context: BrowserContext;
  private imageProcessor: ImageProcessor;

  async init() {
    this.context = await createBrowserContext();
    this.imageProcessor = new ImageProcessor();
  }

  async scrapeSource(source: Source): Promise<any[]> {
    try {
      const page = await this.context.newPage();
      await page.goto(source.url, { waitUntil: 'networkidle' });

      // Get all article links from the source page
      const articleUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/architecture/"]'));
        return links.map(link => link.getAttribute('href')).filter(href => href !== null) as string[];
      });

      const articles = [];
      for (const url of articleUrls) {
        try {
          const article = await this.scrapeArticle(url);
          articles.push({
            ...article,
            url,
            source: source.url
          });
        } catch (error) {
          console.error(`Error scraping article ${url}:`, error);
        }
      }

      await page.close();
      return articles;
    } catch (error) {
      console.error('Error scraping source:', error);
      return [];
    }
  }

  async scrapeArticle(url: string, retryCount = 0): Promise<{
    title: string;
    content: string;
    imageUrls: string[];
  }> {
    try {
      const page = await this.context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      // Extract content
      const data = await page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent?.trim() || '';
        const content = document.querySelector('.entry-content')?.textContent?.trim() || '';
        
        // Get main article image
        const mainImage = document.querySelector('.entry-content img');
        const imageUrl = mainImage?.getAttribute('src') || '';

        return { title, content, imageUrl };
      });

      // Take screenshot of the article content
      const contentArea = await page.locator('.entry-content').first();
      const screenshot = await contentArea.screenshot();

      // Process and upload screenshot
      const processedImages = screenshot ? 
        await this.imageProcessor.processAndUpload(screenshot, url.split('/').pop() || 'default') :
        [];

      await page.close();

      return {
        title: data.title,
        content: data.content,
        imageUrls: data.imageUrl ? [data.imageUrl, ...processedImages] : processedImages
      };

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

  async cleanup() {
    await this.context.close();
  }
}