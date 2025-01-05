import { chromium, Browser, Page } from 'playwright';
import { extractStructuredContent, ExtractedContent } from './scrapeUtils';

interface ScrapingOptions {
  maxRetries?: number;
  waitTime?: number;
  headless?: boolean;
  timeout?: number;
}

export class PlaywrightScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private readonly baseUrl: string;
  private readonly options: Required<ScrapingOptions>;

  constructor(baseUrl: string, options: ScrapingOptions = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      waitTime: options.waitTime ?? 1000,
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000
    };
  }

  async init() {
    try {
      this.browser = await chromium.launch({
        headless: this.options.headless
      });
      
      this.page = await this.browser.newPage();
      await this.setupPage(this.page);
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  private async setupPage(page: Page) {
    // Set timeout
    await page.setDefaultTimeout(this.options.timeout);
    
    // Block unnecessary resources
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,font,woff2}', route => 
      route.abort()
    );

    // Handle page errors
    page.on('pageerror', error => {
      console.error('Page error:', error);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  }

  private async retry() {
    if (!this.page || !this.browser) return;
    
    await this.page.close();
    this.page = await this.browser.newPage();
    await this.setupPage(this.page);
  }

  async scrapeArticle(url: string): Promise<ExtractedContent> {
    if (!this.page) throw new Error('Browser not initialized');

    let lastError: Error | null = null;
    let retries = 0;

    while (retries < this.options.maxRetries) {
      try {
        // Navigate with custom timeout
        await this.page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: this.options.timeout
        });
        
        // Wait for essential elements
        await Promise.all([
          this.page.waitForSelector('h1.entry-title'),
          this.page.waitForSelector('div.entry-content')
        ]);

        // Extract content using enhanced utilities
        const content = await extractStructuredContent(this.page);
        
        // Validate extracted content
        if (!content.title || !content.originalContent) {
          throw new Error('Failed to extract required content');
        }

        return content;

      } catch (error) {
        lastError = error as Error;
        retries++;
        
        console.error(
          `Failed to scrape article (attempt ${retries}/${this.options.maxRetries}):`,
          error
        );

        if (retries < this.options.maxRetries) {
          // Exponential backoff
          const delay = this.options.waitTime * Math.pow(2, retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          await this.retry();
        }
      }
    }

    throw new Error(
      `Failed to scrape article after ${retries} attempts. ` +
      `Last error: ${lastError?.message}`
    );
  }

  async scrapeArticleList(pageNum: number = 1): Promise<string[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      const url = `${this.baseUrl}/architecture/page/${pageNum}`;
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });
      
      // Wait for article links with better selector
      await this.page.waitForSelector('article a[href*="/architecture/"]');
      
      // Extract and validate URLs
      const urls = await this.page.$$eval(
        'article a[href*="/architecture/"]', 
        links => links
          .map(link => link.href)
          .filter(href => href && href.includes('/architecture/'))
          .filter((href, index, self) => self.indexOf(href) === index)
      );

      if (!urls.length) {
        console.warn('No article URLs found on page', pageNum);
      }

      return urls;
    } catch (error) {
      console.error('Failed to scrape article list:', error);
      throw error;
    }
  }

  async close() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}