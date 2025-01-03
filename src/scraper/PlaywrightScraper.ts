import { chromium, Browser, Page } from 'playwright';

interface ScrapingOptions {
  maxRetries?: number;
  waitTime?: number;
  headless?: boolean;
}

interface ArticleData {
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  tags: string[];
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
      headless: options.headless ?? true
    };
  }

  async init() {
    try {
      this.browser = await chromium.launch({
        headless: this.options.headless
      });
      this.page = await this.browser.newPage();
      
      // Set default timeout
      await this.page.setDefaultTimeout(30000);
      
      // Add custom retry logic
      this.page.on('crashedframe', async () => {
        console.log('Frame crashed, retrying...');
        await this.retry();
      });
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  private async retry() {
    if (!this.page || !this.browser) return;
    
    await this.page.close();
    this.page = await this.browser.newPage();
  }

  async scrapeArticle(url: string): Promise<ArticleData> {
    if (!this.page) throw new Error('Browser not initialized');

    let retries = 0;
    while (retries < this.options.maxRetries) {
      try {
        await this.page.goto(url, { waitUntil: 'networkidle' });
        
        // Wait for essential elements
        await this.page.waitForSelector('h1.entry-title');
        await this.page.waitForSelector('div.entry-content');
        
        // Extract data
        const title = await this.page.$eval('h1.entry-title', el => el.textContent?.trim() ?? '');
        const content = await this.page.$eval('div.entry-content', el => el.textContent?.trim() ?? '');
        const imageUrl = await this.page.$eval('div.entry-content img', img => img.getAttribute('src') ?? '');
        const author = await this.page.$eval('a[rel="author"]', el => el.textContent?.trim() ?? '');
        const publishedAt = await this.page.$eval('time', time => time.getAttribute('datetime') ?? '');
        const tags = await this.page.$$eval('a[rel="tag"]', els => els.map(el => el.textContent?.trim() ?? ''));

        return {
          title,
          content,
          imageUrl,
          author,
          publishedAt,
          tags
        };
      } catch (error) {
        retries++;
        console.error(`Failed to scrape article (attempt ${retries}):`, error);
        await new Promise(resolve => setTimeout(resolve, this.options.waitTime));
        
        if (retries === this.options.maxRetries) {
          throw new Error(`Failed to scrape article after ${retries} attempts`);
        }
      }
    }

    throw new Error('Unexpected error in scraping loop');
  }

  async scrapeArticleList(pageNum: number = 1): Promise<string[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      const url = `${this.baseUrl}/architecture/page/${pageNum}`;
      await this.page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for article links to load
      await this.page.waitForSelector('article a');
      
      // Extract all article URLs
      return await this.page.$$eval('article a', links => 
        links.map(link => link.href)
      );
    } catch (error) {
      console.error('Failed to scrape article list:', error);
      throw error;
    }
  }

  async takeScreenshot(selector: string, path: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      const element = await this.page.$(selector);
      if (element) {
        await element.screenshot({ path });
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      throw error;
    }
  }

  async close() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}