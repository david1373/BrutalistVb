import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { scrapers } from '../src/scrapers';
import { logScrapingStart, logScrapingResults, logError } from '../src/scrapers/utils/logger';

config();

const SCRAPE_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function scrapeArticles() {
  console.log('\n🚀 Starting scheduled scrape:', new Date().toISOString());
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    const { data: sources } = await supabase
      .from('sources')
      .select('*')
      .eq('enabled', true);

    if (!sources?.length) return;

    for (const source of sources) {
      try {
        const scraper = scrapers[source.name as keyof typeof scrapers];
        if (!scraper) continue;

        const articles = await scraper.scrape(page);
        
        if (articles.length > 0) {
          await supabase
            .from('articles')
            .upsert(
              articles.map(article => ({
                source_id: source.id,
                ...article
              })),
              { onConflict: 'url' }
            );

          await supabase
            .from('sources')
            .update({ last_scraped_at: new Date().toISOString() })
            .eq('id', source.id);
        }
      } catch (error) {
        logError(`Error scraping ${source.name}`, error);
      }
    }
  } catch (error) {
    logError('Fatal scraping error', error);
  } finally {
    await browser.close();
  }
}

// Run initial scrape
scrapeArticles();

// Schedule periodic scrapes
setInterval(scrapeArticles, SCRAPE_INTERVAL);

// Keep the process running
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down scraper...');
  process.exit(0);
});