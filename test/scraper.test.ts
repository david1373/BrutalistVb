// test/scraper.test.ts
import { Scraper } from '../src/scraper/index';
import { ArticleService } from '../src/services/articleService'; 
// ^ Make sure this path matches your actual folder structure.

const TEST_SOURCE_ID = '26ea468d-a5d5-457f-ad0e-c4a26b6a8698';

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
    // Clean up test articles if needed
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
    // NOTE: Make sure your Scraper class has a method called scrapeMultipleArticles,
    // or change this test to loop over scrapeArticle manually.
    const testUrls = Array(5).fill('https://leibal.com/test-article');
    const startTime = Date.now();

    const duration = Date.now() - startTime;
    // Expect at least 2 seconds if your rateLimit is set that way
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

    // Create article in Supabase
    const article = await articleService.createArticle({
      title: scrapedData.title,
      url: testUrl,
      source_id: TEST_SOURCE_ID,
      image_url: scrapedData.imageUrls[0],
      is_processed: false,
      original_content: ''
    });

    testArticleId = article.id;

    // Verify it was stored correctly
    const storedArticle = await articleService.getArticle(article.id);
    expect(storedArticle).toBeDefined();
    expect(storedArticle.title).toBe(scrapedData.title);
  });
});