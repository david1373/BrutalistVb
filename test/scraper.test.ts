import { Scraper } from '../src/scraper';
import { ImageProcessor } from '../src/scraper/imageProcessor';
import { ArticleService } from '../src/services/articleService';
import { supabase } from '../src/lib/supabase';

describe('Scraper Integration Tests', () => {
  let scraper: Scraper;
  let articleService: ArticleService;
  let testArticleId: string;

  beforeAll(async () => {
    scraper = new Scraper();
    articleService = new ArticleService();
    await scraper.init();
  });

  afterAll(async () => {
    await scraper.cleanup();
    // Clean up test articles
    if (testArticleId) {
      await articleService.deleteArticle(testArticleId);
    }
  });

  it('should scrape and process a single article', async () => {
    const testUrl = 'https://leibal.com/test-article';
    const result = await scraper.scrapeArticle(testUrl);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.imageUrls).toBeInstanceOf(Array);
  });

  it('should handle rate limiting correctly', async () => {
    const testUrls = Array(5).fill('https://leibal.com/test-article');
    const startTime = Date.now();

    await scraper.scrapeMultipleArticles(testUrls);

    const duration = Date.now() - startTime;
    // Should take at least 2 seconds due to rate limiting
    expect(duration).toBeGreaterThan(2000);
  });

  it('should retry failed requests', async () => {
    const invalidUrl = 'https://leibal.com/nonexistent';
    
    await expect(scraper.scrapeArticle(invalidUrl))
      .rejects
      .toThrow();
  });

  it('should store articles in Supabase', async () => {
    const testUrl = 'https://leibal.com/test-article';
    const scrapedData = await scraper.scrapeArticle(testUrl);

    const article = await articleService.createArticle({
      title: scrapedData.title,
      content: scrapedData.content,
      images: scrapedData.imageUrls,
      status: 'draft'
    });

    testArticleId = article.id;

    const storedArticle = await articleService.getArticle(article.id);
    expect(storedArticle).toBeDefined();
    expect(storedArticle.title).toBe(scrapedData.title);
  });
});