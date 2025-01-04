// test/source.test.ts
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { Scraper } from '../src/scraper';
import { ArticleService } from '../src/services/articleService';

const TEST_SOURCE_ID = '26ea468d-a5d5-457f-ad0e-c4a26b6a8698';

// We'll define supabase at the top level, but only import it in beforeAll.
let supabase: any;

describe('Source-specific Scraper Tests', () => {
  let scraper: Scraper;
  let articleService: ArticleService;

  beforeAll(async () => {
    // Defer the supabase import until after .env is loaded by Jest setup
    supabase = require('../src/lib/supabase').supabase;

    console.log('[DEBUG] SUPABASE_URL:', process.env.SUPABASE_URL);

    
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

    if (!source) {
      throw new Error('Source not found');
    }

    const results = await scraper.scrapeSource(source);
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

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

    if (!source) {
      throw new Error('Source not found');
    }

    await scraper.scrapeSource(source);

    const duration = Date.now() - startTime;
    const minimumExpectedDuration = 5000; // 5 seconds minimum

    expect(duration).toBeGreaterThan(minimumExpectedDuration);
  });

  test('should save scraped articles to database', async () => {
    const { data: source } = await supabase
      .from('sources')
      .select('url, scraping_config')
      .eq('id', TEST_SOURCE_ID)
      .single();

    if (!source) {
      throw new Error('Source not found');
    }

    const results = await scraper.scrapeSource(source);

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