import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Article = Database['public']['Tables']['articles']['Insert'];

export class ArticleService {
  async createArticle(article: Article) {
    try {
      const { data, error } = await supabase
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

  async updateArticle(id: string, updates: Partial<Article>) {
    try {
      const { data, error } = await supabase
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

  async getArticle(id: string) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting article:', error);
      throw error;
    }
  }

  async deleteArticle(id: string) {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }

  async listArticles({
    page = 1,
    limit = 10,
    status = 'published'
  }: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'published' | 'archived';
  } = {}) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        articles: data,
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      };
    } catch (error) {
      console.error('Error listing articles:', error);
      throw error;
    }
  }
}