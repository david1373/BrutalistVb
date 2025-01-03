import { Scraper } from './index';
import { SourceService } from '../services/sourceService';
import { ArticleService } from '../services/articleService';

async function testScraper() {
  const sourceId = '26ea468d-a5d5-457f-ad0e-c4a26b6a8698';
  const testUrl = 'https://leibal.com/architecture/pz-house/'; // Example article

  try {
    // Initialize services
    const sourceService = new SourceService();
    const articleService = new ArticleService();
    const scraper = new Scraper();

    console.log('Initializing scraper...');
    await scraper.init();

    // Verify source exists
    const sources = await sourceService.getEnabledSources();
    const source = sources.find(s => s.id === sourceId);
    if (!source) {
      throw new Error('Source not found');
    }
    console.log('Source found:', source.name);

    // Test single article scrape
    console.log('Scraping article:', testUrl);
    const scrapedData = await scraper.scrapeArticle(testUrl);
    console.log('Scraped data:', {
      title: scrapedData.title,
      hasContent: Boolean(scrapedData.content),
      imageUrls: scrapedData.imageUrls?.length
    });

    // Save to database
    const article = await articleService.createArticle({
      source_id: sourceId,
      title: scrapedData.title,
      original_content: scrapedData.content,
      url: testUrl,
      image_url: scrapedData.imageUrls?.[0],
      is_processed: false
    });

    console.log('Article saved:', article.id);

    // Update source last_scraped_at
    await sourceService.updateLastScraped(sourceId);
    console.log('Source updated');

    await scraper.cleanup();
    console.log('Test completed successfully');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testScraper();
