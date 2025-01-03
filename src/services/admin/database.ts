import { supabase } from '../../lib/supabase';

export async function getDatabaseStats() {
  // Get sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*');

  if (sourcesError) throw sourcesError;

  // Get articles
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select(`
      *,
      sources (name)
    `)
    .order('published_at', { ascending: false });

  if (articlesError) throw articlesError;

  return {
    sources: sources.map(source => ({
      name: source.name,
      enabled: source.enabled,
      last_scraped_at: source.last_scraped_at
    })),
    articles: articles.map(article => ({
      title: article.title,
      source: article.sources?.name,
      published_at: article.published_at,
      has_content: Boolean(article.rewritten_content)
    }))
  };
}