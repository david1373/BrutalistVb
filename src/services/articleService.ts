import { getSupabaseClient } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Article = Database['public']['Tables']['articles']['Insert'];
type ArticleUpdate = Database['public']['Tables']['articles']['Update'];

export class ArticleService {
  async createArticle(article: Article) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('articles')
        .insert(article)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  async updateArticle(id: string, updates: ArticleUpdate) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  async getUnprocessedArticles() {
    try {
      const { data, error } = await getSupabaseClient()
        .from('articles')
        .select('*')
        .eq('is_processed', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting unprocessed articles:', error);
      throw error;
    }
  }

  async getArticleByUrl(url: string) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('articles')
        .select('*')
        .eq('url', url)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'
      return data;
    } catch (error) {
      console.error('Error getting article by URL:', error);
      throw error;
    }
  }

  async markAsProcessed(id: string, rewrittenContent: string) {
    try {
      const { error } = await getSupabaseClient()
        .from('articles')
        .update({
          is_processed: true,
          rewritten_content: rewrittenContent
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking article as processed:', error);
      throw error;
    }
  }

  async deleteArticle(id: string) {
    const { error } = await getSupabaseClient()
      .from('articles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getArticle(id: string) {
    const { data, error } = await getSupabaseClient()
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
}
}