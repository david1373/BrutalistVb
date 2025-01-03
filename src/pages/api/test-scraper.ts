import { chromium } from 'playwright';
import { supabase } from '../../lib/supabase';
import { SCRAPER_CONFIG } from '../../services/scraper/config';
import { scrapeArticles } from '../../services/scraper/utils';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const results = [];
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    // Scrape each source
    for (const [sourceKey, sourceConfig] of Object.entries(SCRAPER_CONFIG.sources)) {
      try {
        // Get source ID from database
        const { data: source } = await supabase
          .from('sources')
          .select('id')
          .eq('name', sourceConfig.name)
          .single();

        if (!source) {
          results.push({
            source: sourceConfig.name,
            articlesFound: 0,
            error: 'Source not found in database'
          });
          continue;
        }

        // Scrape articles
        const articles = await scrapeArticles(page, sourceKey as keyof typeof SCRAPER_CONFIG.sources);
        
        if (articles.length > 0) {
          // Save to database
          await supabase
            .from('articles')
            .upsert(
              articles.map(article => ({
                source_id: source.id,
                ...article
              })),
              { onConflict: 'url' }
            );

          // Update last scraped timestamp
          await supabase
            .from('sources')
            .update({ last_scraped_at: new Date().toISOString() })
            .eq('id', source.id);

          results.push({
            source: sourceConfig.name,
            articlesFound: articles.length,
            sampleArticle: {
              title: articles[0].title,
              url: articles[0].url
            }
          });
        } else {
          results.push({
            source: sourceConfig.name,
            articlesFound: 0,
            error: 'No articles found'
          });
        }
      } catch (error) {
        results.push({
          source: sourceConfig.name,
          articlesFound: 0,
          error: error instanceof Error ? error.message : 'Failed to scrape'
        });
      }
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to run scraper'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } finally {
    await browser.close();
  }

  return new Response(
    JSON.stringify({ 
      results,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}