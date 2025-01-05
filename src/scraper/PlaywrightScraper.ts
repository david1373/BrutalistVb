import { chromium, Browser, Page } from 'playwright';

interface ScrapingOptions {
  maxRetries?: number;
  waitTime?: number;
  headless?: boolean;
}

interface ArticleData {
  title: string;
  content: string;
  originalContent: string;  // Added for storing raw content
  imageUrl: string;
  author: string;
  publishedAt: string;
  tags: string[];
  metaDescription?: string;  // Added for SEO content
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
      
      // Enhanced timeout for better reliability
      await this.page.setDefaultTimeout(45000);
      
      // Add custom retry logic
      this.page.on('crashedframe', async () => {
        console.log('Frame crashed, retrying...');
        await this.retry();
      });

      // Optimize resource loading
      await this.page.route('**/*.{png,jpg,jpeg,gif,svg}', route => 
        route.abort()
      );
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

  private async extractContent(selector: string): Promise<{ processed: string; original: string }> {
    if (!this.page) throw new Error('Browser not initialized');

    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return { processed: '', original: '' };

      // Store original HTML content
      const original = element.innerHTML;

      // Clone node for processing
      const processed = element.cloneNode(true) as HTMLElement;

      // Remove unwanted elements
      processed.querySelectorAll('script, style, iframe, .advertisement').forEach(el => el.remove());

      // Extract text content while preserving some structure
      const processedText = processed.innerText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');

      return {
        processed: processedText,
        original: original
      };
    }, selector);
  }

  async scrapeArticle(url: string): Promise<ArticleData> {
    if (!this.page) throw new Error('Browser not initialized');

    let retries = 0;
    while (retries < this.options.maxRetries) {
      try {
        await this.page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // Wait for essential elements with longer timeout
        await Promise.all([
          this.page.waitForSelector('h1.entry-title', { timeout: 30000 }),
          this.page.waitForSelector('div.entry-content', { timeout: 30000 })
        ]);
        
        // Extract content with both original and processed versions
        const { processed: content, original: originalContent } = 
          await this.extractContent('div.entry-content');

        // Enhanced metadata extraction
        const [title, imageUrl, author, publishedAt, metaDescription] = await Promise.all([
          this.page.$eval('h1.entry-title', el => el.textContent?.trim() ?? ''),
          this.page.$eval('div.entry-content img', img => img.getAttribute('src') ?? ''),
          this.page.$eval('a[rel="author"]', el => el.textContent?.trim() ?? ''),
          this.page.$eval('time', time => time.getAttribute('datetime') ?? ''),
          this.page.$eval('meta[name="description"]', meta => meta.getAttribute('content') ?? '')
        ]);

        // Enhanced tag extraction with error handling
        const tags = await this.page.$$eval('a[rel="tag"]', els => 
          els.map(el => el.textContent?.trim() ?? '').filter(tag => tag.length > 0)
        );

        return {
          title,
          content,
          originalContent,
          imageUrl,
          author,
          publishedAt,
          tags,
          metaDescription
        };
      } catch (error) {
        retries++;
        console.error(`Failed to scrape article (attempt ${retries}):`, error);
        await new Promise(resolve => setTimeout(resolve, this.options.waitTime * retries));
        
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
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Enhanced selector for better accuracy
      await this.page.waitForSelector('article a[href*="/architecture/"]');
      
      // Improved URL extraction with validation
      return await this.page.$$eval('article a[href*="/architecture/"]', links => 
        links
          .map(link => link.href)
          .filter(href => href && href.includes('/architecture/'))
          .filter((href, index, self) => self.indexOf(href) === index) // Remove duplicates
      );
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