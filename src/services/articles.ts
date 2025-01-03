import { supabase } from '../lib/supabase';
import type { Article, ArticlePreview } from '../types/article';

export async function getLatestArticles(limit = 10): Promise<ArticlePreview[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      image_url,
      author,
      published_at,
      rewritten_content
    `)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((article): ArticlePreview => ({
    id: article.id,
    title: article.title,
    image: article.image_url || 'https://images.unsplash.com/photo-1485628390555-1a7bd503f9fe?auto=format&fit=crop&q=80',
    author: article.author || 'Unknown',
    date: article.published_at ? new Date(article.published_at) : new Date(),
    excerpt: article.rewritten_content?.slice(0, 150) || ''
  }));
}

export async function getArticle(id: string): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      rewritten_content,
      image_url,
      author,
      published_at,
      is_subscriber_only
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    content: data.rewritten_content || '',
    image: data.image_url || 'https://images.unsplash.com/photo-1485628390555-1a7bd503f9fe?auto=format&fit=crop&q=80',
    author: data.author || 'Unknown',
    date: data.published_at ? new Date(data.published_at) : new Date(),
    isSubscriberOnly: data.is_subscriber_only
  };
}