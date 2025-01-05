import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PlaywrightScraper } from '../../src/scraper/PlaywrightScraper';

describe('PlaywrightScraper', () => {
  let scraper: PlaywrightScraper;

  beforeAll(async () => {
    scraper = new PlaywrightScraper('https://leibal.com', {
      headless: true,
      timeout: 5000
    });
    await scraper.init();
  });

  afterAll(async () => {
    await scraper.close();
  });

  it('should extract article content correctly', async () => {
    const content = await scraper.scrapeArticle(
      'https://leibal.com/architecture/example-article'
    );

    expect(content).toMatchObject({
      title: expect.any(String),
      metaDescription: expect.any(String),
      originalContent: expect.any(String),
      processedContent: expect.any(String),
      structuredContent: expect.arrayContaining([
        expect.objectContaining({
          type: expect.stringMatching(/^(text|image|header|quote|list)$/),
          content: expect.any(String)
        })
      ]),
      mainImage: expect.objectContaining({
        url: expect.any(String),
        alt: expect.any(String)
      }),
      author: expect.any(String),
      publishedAt: expect.any(String),
      tags: expect.arrayContaining([expect.any(String)])
    });
  });

  it('should handle missing content gracefully', async () => {
    const testUrl = 'https://leibal.com/architecture/non-existent';
    await expect(scraper.scrapeArticle(testUrl)).rejects.toThrow('Failed to extract required content');
  });

  it('should retry failed requests', async () => {
    // Mock a failing URL that should trigger retries
    const testUrl = 'https://leibal.com/architecture/timeout-test';
    await expect(scraper.scrapeArticle(testUrl)).rejects.toThrow(/Failed to scrape article after \d+ attempts/);
  });

  it('should extract article list correctly', async () => {
    const urls = await scraper.scrapeArticleList(1);
    
    expect(urls).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^https:\/\/leibal\.com\/architecture\/.+/)
      ])
    );

    // Check for duplicates
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  it('should structure content with proper metadata', async () => {
    const content = await scraper.scrapeArticle(
      'https://leibal.com/architecture/example-article'
    );

    // Check for structured content types
    const contentTypes = content.structuredContent.map(block => block.type);
    expect(contentTypes).toContain('text');
    expect(contentTypes).toContain('image');

    // Verify metadata
    const imageBlock = content.structuredContent.find(block => block.type === 'image');
    expect(imageBlock?.metadata).toHaveProperty('alt');
    expect(imageBlock?.metadata).toHaveProperty('caption');

    // Check processed content formatting
    expect(content.processedContent).toContain('#'); // Headers
    expect(content.processedContent).toContain('[Image:'); // Image placeholders
    expect(content.processedContent).toContain('>'); // Quotes
  });
});
