import { createBrowser, createPage } from './browser';
import { scrapeDezeen } from './dezeen';
import { supabase } from '../../lib/supabase';
import type { ScraperResult } from '../../types/scraper';

export async function testScraper(): Promise<ScraperResult[]> {
  const browser = await createBrowser();
  
  try {
    const page = await createPage(browser);
    
    // Get Dezeen source ID
    const { data: source } = await supabase
      .from('sources')
      .select('id')
      .eq('name', 'Dezeen')
      .single();

    if (!source) {
      throw new Error('Dezeen source not found');
    }

    // Scrape articles
    const articles = await scrapeDezeen(page);
    
    if (articles.length === 0) {
      return [{
        source: 'Dezeen',
        articlesFound: 0,
        error: 'No articles found'
      }];
    }

    // Save to database
    const { error: upsertError } = await supabase
      .from('articles')
      .upsert(
        articles.map(article => ({
          source_id: source.id,
          ...article
        })),
        { onConflict: 'url' }
      );

    if (upsertError) throw upsertError;

    // Update last scraped timestamp
    await supabase
      .from('sources')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', source.id);

    return [{
      source: 'Dezeen',
      articlesFound: articles.length,
      sampleArticle: articles[0] ? {
        title: articles[0].title,
        url: articles[0].url
      } : undefined
    }];

  } catch (error) {
    console.error('Scraper error:', error);
    return [{
      source: 'Dezeen',
      articlesFound: 0,
      error: error instanceof Error ? error.message : 'Failed to scrape'
    }];
  } finally {
    await browser.close();
  }
}