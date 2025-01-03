import { supabase } from '../../lib/supabase';
import { ArticleData } from '../types';
import { logError } from './logger';

export async function getEnabledSources() {
  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .eq('enabled', true);

  if (error) throw error;
  return sources;
}

export async function saveArticle(sourceId: string, article: ArticleData) {
  const { error } = await supabase
    .from('articles')
    .upsert({
      source_id: sourceId,
      ...article,
      is_processed: false
    }, {
      onConflict: 'url'
    });

  if (error) {
    logError(`Failed to save article: ${article.title}`, error);
    return false;
  }
  return true;
}

export async function updateSourceLastScraped(sourceId: string) {
  await supabase
    .from('sources')
    .update({ last_scraped_at: new Date().toISOString() })
    .eq('id', sourceId);
}