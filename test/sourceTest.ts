import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { supabase } from '../src/lib/supabase';
import { Scraper } from '../src/scraper';
import { ArticleService } from '../src/services/articleService';

const TEST_SOURCE_ID = '26ea468d-a5d5-457f-ad0e-c4a26b6a8698';

describe('Source-specific Scraper Tests', () => {
  let scraper: Scraper;
  let articleService: ArticleService;

  beforeAll(async () => {
    scraper = new Scraper();
    articleService = new ArticleService();
    await scraper.init();
  });

  afterAll(async () => {
    await scraper.cleanup();
  });

  test('should verify source exists', async () => {
    const { data: source, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', TEST_SOURCE_ID)
      .single();

    expect(error).toBeNull();
    expect(source).toBeDefined();
    expect(source.id).toBe(TEST_SOURCE_ID);
  });

  test('should scrape articles from test source', async () => {
    const { data: source } = await supabase
      .from('sources')
      .select('url, scraping_config')
      .eq('id', TEST_SOURCE_ID)
      .single();

    expect(source).toBeDefined();
    
    const results = await scraper.scrapeSource(source);
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    // Verify article structure
    const firstArticle = results[0];
    expect(firstArticle).toHaveProperty('title');
    expect(firstArticle).toHaveProperty('content');
    expect(firstArticle).toHaveProperty('image_url');
    expect(firstArticle).toHaveProperty('published_at');
  });

  test('should respect rate limiting for test source', async () => {
    const startTime = Date.now();
    
    const { data: source } = await supabase
      .from('sources')
      .select('url, scraping_config')
      .eq('id', TEST_SOURCE_ID)
      .single();

    await scraper.scrapeSource(source);
    
    const duration = Date.now() - startTime;
    const minimumExpectedDuration = 5000; // 5 seconds minimum due to rate limiting
    
    expect(duration).toBeGreaterThan(minimumExpectedDuration);
  });

  test('should save scraped articles to database', async () => {
    const { data: source } = await supabase
      .from('sources')
      .select('url, scraping_config')
      .eq('id', TEST_SOURCE_ID)
      .single();

    const results = await scraper.scrapeSource(source);
    
    // Save articles and verify they're in the database
    for (const article of results) {
      const savedArticle = await articleService.createArticle({
        ...article,
        source_id: TEST_SOURCE_ID,
        is_processed: false
      });

      const { data: retrievedArticle } = await supabase
        .from('articles')
        .select('*')
        .eq('id', savedArticle.id)
        .single();

      expect(retrievedArticle).toBeDefined();
      expect(retrievedArticle.title).toBe(article.title);
      expect(retrievedArticle.source_id).toBe(TEST_SOURCE_ID);
    }
  });
});