import { chromium, Browser } from 'playwright';
import { supabase } from '../../lib/supabase';
import { scrapers } from './sources';
import { saveArticles } from './database';
import { ScraperResult } from '../../types/scraper';
import { logScraperInfo, logScraperError } from './logger';

export async function runScrapers(): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    for (const [key, scraper] of Object.entries(scrapers)) {
      try {
        logScraperInfo(`Starting scraper for ${scraper.name}`);
        
        // Get source ID
        const { data: source } = await supabase
          .from('sources')
          .select('id')
          .eq('name', scraper.name)
          .single();

        if (!source) {
          throw new Error(`Source not found: ${scraper.name}`);
        }

        // Run scraper
        const articles = await scraper.scrape(page);
        
        if (articles.length > 0) {
          // Save articles
          const saved = await saveArticles(source.id, articles);
          
          if (saved) {
            results.push({
              source: scraper.name,
              articlesFound: articles.length,
              sampleArticle: {
                title: articles[0].title,
                url: articles[0].url
              }
            });
          } else {
            throw new Error('Failed to save articles');
          }
        } else {
          results.push({
            source: scraper.name,
            articlesFound: 0,
            error: 'No articles found'
          });
        }
      } catch (error) {
        logScraperError(error as Error, { source: key });
        results.push({
          source: scrapers[key].name,
          articlesFound: 0,
          error: error instanceof Error ? error.message : 'Failed to scrape'
        });
      }
    }
  } catch (error) {
    logScraperError(error as Error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
}