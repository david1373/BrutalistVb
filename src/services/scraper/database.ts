import { supabase } from '../../lib/supabase';
import { ScrapedArticle } from './types';
import { logScraperInfo, logScraperError } from './logger';

export async function saveArticles(sourceId: string, articles: ScrapedArticle[]) {
  try {
    logScraperInfo(`Saving ${articles.length} articles for source ${sourceId}`);
    
    const { error: upsertError } = await supabase
      .from('articles')
      .upsert(
        articles.map(article => ({
          source_id: sourceId,
          ...article,
          is_processed: false
        })),
        { onConflict: 'url' }
      );

    if (upsertError) throw upsertError;

    await updateSourceLastScraped(sourceId);
    
    return true;
  } catch (error) {
    logScraperError(error as Error, { phase: 'database', sourceId });
    return false;
  }
}

async function updateSourceLastScraped(sourceId: string) {
  const { error } = await supabase
    .from('sources')
    .update({ last_scraped_at: new Date().toISOString() })
    .eq('id', sourceId);

  if (error) {
    logScraperError(error, { 
      phase: 'database',
      operation: 'update_last_scraped',
      sourceId 
    });
  }
}