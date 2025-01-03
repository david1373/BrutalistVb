import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { scrapeArticles } from '../../services/scraper/utils';
import { logScraperError } from '../../services/scraper/logger';

export async function runScraper(_: Request, res: Response) {
  const results = [];

  try {
    // Get Leibal source ID
    const { data: source } = await supabase
      .from('sources')
      .select('id')
      .eq('name', 'Leibal')
      .single();

    if (!source) {
      throw new Error('Leibal source not found in database');
    }

    // Scrape articles
    const articles = await scrapeArticles('leibal');
    
    if (articles.length > 0) {
      // Save to database
      const { error: upsertError } = await supabase
        .from('articles')
        .upsert(
          articles.map(article => ({
            source_id: source.id,
            ...article,
            is_processed: false
          })),
          { onConflict: 'url' }
        );

      if (upsertError) throw upsertError;

      // Update last scraped timestamp
      await supabase
        .from('sources')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', source.id);

      results.push({
        source: 'Leibal',
        articlesFound: articles.length,
        sampleArticle: {
          title: articles[0].title,
          url: articles[0].url
        }
      });
    } else {
      results.push({
        source: 'Leibal',
        articlesFound: 0,
        error: 'No articles found'
      });
    }

    res.json({ 
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logScraperError(error as Error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run scraper',
      results: [],
      timestamp: new Date().toISOString()
    });
  }
}